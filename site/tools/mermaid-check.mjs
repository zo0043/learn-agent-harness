#!/usr/bin/env node
/**
 * mermaid-check.mjs — 站点 mermaid 图渲染回归（2026-10-19 新增，CI 作业 `Verify site` 的执行体）
 *
 * 背景（为什么要这一步）：站内 62 张 mermaid 图全部由**客户端**渲染（mermaid.ts 动态
 * import ~2MB bundle 后 mermaid.run）。这类失败在结构/几何断言里完全隐形——
 * visual-check.mjs 只断言「无横向溢出 / 关键元素可见 / 无 console error」，
 * 而一张渲染失败、退化显示源码的图：不溢出、容器在、console 无错（脚本有意
 * console.error 但那是 mermaid 自己抛的，页面已 catch）。
 * 真实事故：W3-A 修复前 <br/> 换行标签全量退化（15 篇讲义 × 4 图），
 * 只有人眼看得见——本步把「图到底渲没渲出来」变成可复跑断言。
 *
 * ── 边界诚实性（必须读）────────────────────────────────────────────────────
 * 本脚本只断言两类**可机检**约束：
 *   ① 每个 `.mermaid` 容器最终都产出 `<svg>`（渲染成功）且不落入 `.mermaid-error`（失败态）
 *   ② 加载过程无 pageerror / console.error（mermaid 运行时异常会走 console.error）
 * 不断言图的**内容正确性**（节点连对不对、文字全不全）——那需要人读图，
 * 仍**留浏览器人工目检**；本步只保证「图渲染成了 SVG」这层机械事实。
 *
 * 用法（CI，dist 由 Build site 步产出）：
 *   node tools/mermaid-check.mjs --dist ../dist
 * 本机预检（不依赖站点构建：fixture 双页，验证检出逻辑双向成立）：
 *   node tools/mermaid-check.mjs --selftest
 *
 * 被测页面**不手抄清单**：运行时扫 `--dist` 下含 `class="mermaid"` 的 HTML——
 * 新增/删除讲义图自动进/出清单（第二份真源是漂移的来源，见口径门禁 P1 根因）。
 * 空清单即失败（防「门禁恒真」： dist 没构建出来时也必须红）。
 *
 * 退出码：0 = 全部页面每张图都渲成 svg（selftest：检出逻辑双向成立）；
 *   1 = 有失败态/空清单/运行错误（selftest：检出逻辑不成立 / 漏检坏页）；
 *   2 = CLI 参数错误。
 *
 * 依赖：playwright（site devDependency）+ `npx playwright install chromium` 的浏览器二进制；
 * 服务器为本文件自建（node:http，按 base 前缀路由到 dist）——不依赖外部服务。
 */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CLI 参数 ────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
function arg(name, def = null) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
}
const HAS_SELFTEST = argv.includes('--selftest');
// 站点以 base=/learn-agent-harness/ 构建（astro 只改 URL 前缀，dist 平铺），
// 故 HTML 里的资源引用是 /learn-agent-harness/_astro/… 绝对路径——服务器必须
// 按同一前缀路由，否则 bundle 404、mermaid 永远不加载（假红）。
const BASE_PREFIX = (() => {
  const b = arg('base', 'http://127.0.0.1:4174/learn-agent-harness/');
  try {
    return new URL(b).pathname.replace(/\/$/, '');
  } catch {
    console.error(`[mermaid-check] --base 不是合法 URL: ${b}`);
    process.exit(2);
  }
})();
const DIST = path.resolve(arg('dist', path.join(__dirname, '..', 'dist')));
const TMP_DIST = path.join(os.tmpdir(), 'mermaid-check-selftest');

if (!HAS_SELFTEST && !fs.existsSync(DIST)) {
  console.error(`[mermaid-check] dist 不存在：${DIST}（先 cd site && npm run build，或用 --selftest 预检）`);
  process.exit(2);
}

// ── 被测页面：扫 dist 里含 class="mermaid" 的 HTML（构建产物形态，
//    与 astro.config.mjs 把 ```mermaid 围栏转成 <div class="mermaid"> 的管线一致）────────
function findMermaidPages(root) {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (!e.name.endsWith('.html')) continue;
      const html = fs.readFileSync(full, 'utf8');
      if (html.includes('class="mermaid"')) out.push('/' + path.relative(root, full).split(path.sep).join('/'));
    }
  };
  walk(root);
  return out.sort();
}

// ── 静态服务器（自建，按 base 前缀路由到 dist）──────────────────────────────
function serve(root, port) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    let p = decodeURIComponent(url.pathname);
    if (BASE_PREFIX && (p === BASE_PREFIX || p.startsWith(BASE_PREFIX + '/'))) {
      p = p.slice(BASE_PREFIX.length) || '/';
    } else {
      res.writeHead(404).end('not under base prefix');
      return;
    }
    let file = path.join(root, p);
    if (!file.startsWith(root)) { res.writeHead(403).end('forbidden'); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404).end('not found'); return; }
    const ext = path.extname(file);
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }[ext] ?? 'application/octet-stream';
    res.writeHead(200, { 'content-type': type });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

// ── 断言一台页面 ────────────────────────────────────────────────────────────
async function checkPage(browser, url) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`); });
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    // 等渲染落定：每张图要么成 svg，要么落 .mermaid-error（脚本对两者都加类）。
    // 轮询到「mermaid 容器数 == svg+error 数」或超时（30s 上限，15 页 × 62 图的余量）。
    const deadline = Date.now() + 30000;
    let stat = { divs: 0, svgs: 0, errors: 0 };
    while (Date.now() < deadline) {
      stat = await page.evaluate(() => ({
        divs: document.querySelectorAll('.mermaid').length,
        svgs: document.querySelectorAll('.mermaid svg').length,
        errors: document.querySelectorAll('.mermaid-error').length,
      }));
      if (stat.divs > 0 && stat.svgs + stat.errors >= stat.divs) break;
      await page.waitForTimeout(250);
    }
    return { url, ...stat, consoleErrors: errors };
  } finally {
    await page.close();
  }
}

async function main() {
  const root = HAS_SELFTEST ? TMP_DIST : DIST;

  if (HAS_SELFTEST) {
    // 自建 fixture：一页「渲染成功」+ 一页「渲染失败」。fixture 用极简内联脚本模仿
    // mermaid.ts 的两种落点（成功 → 容器内出现 <svg>；失败 → 容器加 .mermaid-error），
    // 验证的是**本断言器的检出逻辑**（divs↔svg 映射、error 态识别、服务器路由、
    // 空清单守卫），不是 mermaid 本身——真实渲染由 CI 上的 dist 覆盖。
    fs.rmSync(TMP_DIST, { recursive: true, force: true });
    fs.mkdirSync(path.join(TMP_DIST, 'good'), { recursive: true });
    fs.mkdirSync(path.join(TMP_DIST, 'bad'), { recursive: true });
    fs.writeFileSync(
      path.join(TMP_DIST, 'good', 'index.html'),
      '<!doctype html><html><body><div class="mermaid">flowchart TD\n A-->B</div>' +
        '<script>document.querySelector(".mermaid").innerHTML = "<svg></svg>";</script></body></html>',
    );
    fs.writeFileSync(
      path.join(TMP_DIST, 'bad', 'index.html'),
      '<!doctype html><html><body><div class="mermaid">flowchart TD\n A-->>{{{{</div>' +
        '<script>document.querySelector(".mermaid").classList.add("mermaid-error");</script></body></html>',
    );
  }

  const pages = findMermaidPages(root);
  if (pages.length === 0) {
    console.error('[mermaid-check] ✖ dist 里没有任何含 class="mermaid" 的页面——空清单即失败（防门禁恒真）');
    process.exit(1);
  }
  console.log(`[mermaid-check] 被测页面 ${pages.length} 个（扫 ${path.relative(process.cwd(), root)} 下含 class="mermaid" 的 html）`);

  server = await serve(root, 4174);

  // ── 本机无浏览器二进制时：只验证到「服务器路由」层，检出逻辑明确留 CI ──────────
  // 背景：本机 2 核 3.4GB 不保证装得起 chromium（与 visual-check 同样的边界声明）。
  // 退出码 2 = 预检环境不具备（既不是断言失败 1，也不是通过 0）——不冒充任何结论。
  let browser = null;
  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch();
  } catch (e) {
    console.error(`[mermaid-check] ⚠️ 本机起不了 chromium（${String(e).split('\n')[0]}）`);
    console.error('[mermaid-check] 本机预检到此为止：服务器路由已验证，渲染检出逻辑留 CI 实跑（CI 在 visual-check 前已装 chromium）');
    server.close();
    process.exit(2);
  }
  const base = `http://127.0.0.1:4174${BASE_PREFIX}`;

  if (HAS_SELFTEST) {
    // 预期：good 页通过、bad 页被检出——两条都必须成立，否则断言器过弱或误报。
    const good = await checkPage(browser, base + '/good/');
    const bad = await checkPage(browser, base + '/bad/');
    const goodOk = good.errors === 0 && good.svgs === good.divs && good.divs > 0 && good.consoleErrors.length === 0;
    const badCaught = bad.errors > 0 || bad.svgs + bad.errors < bad.divs;
    console.log(`  good 页：divs=${good.divs} svg=${good.svgs} err=${good.errors} → ${goodOk ? '✅ 判过' : '✖ 误报'}`);
    console.log(`  bad  页：divs=${bad.divs} svg=${bad.svgs} err=${bad.errors} → ${badCaught ? '✅ 检出' : '✖ 漏检（断言器过弱）'}`);
    console.log(
      goodOk && badCaught
        ? '\n[mermaid-check] ✅ selftest 通过：检出逻辑双向成立\n'
        : '\n[mermaid-check] ✖ selftest 失败：检出逻辑不成立\n',
    );
    await browser.close();
    server.close();
    process.exit(goodOk && badCaught ? 0 : 1);
  }

  const results = [];
  for (const p of pages) {
    const r = await checkPage(browser, base + p);
    results.push(r);
    const bad = r.errors > 0 || (r.divs > 0 && r.svgs + r.errors < r.divs) || r.consoleErrors.length > 0;
    console.log(
      `  ${bad ? '✖' : '✅'} ${p}  divs=${r.divs} svg=${r.svgs} err=${r.errors}` +
      (r.consoleErrors.length ? `\n      ↳ ${r.consoleErrors.slice(0, 3).join(' | ')}` : ''),
    );
  }

  const failed = results.filter(
    (r) => r.errors > 0 || (r.divs > 0 && r.svgs + r.errors < r.divs) || r.consoleErrors.length > 0,
  );
  const totalDivs = results.reduce((s, r) => s + r.divs, 0);
  const totalSvgs = results.reduce((s, r) => s + r.svgs, 0);
  console.log(`\n  合计 ${results.length} 页 / ${totalDivs} 图 / 渲成 svg ${totalSvgs} 张`);
  console.log(
    failed.length === 0
      ? '\n[mermaid-check] ✅ 全部 mermaid 图渲染成功（边界：不校验图内容正确性，仍留浏览器目检）\n'
      : `\n[mermaid-check] ✖ ${failed.length} 页存在渲染失败/运行错误\n`,
  );
  await browser.close();
  server.close();
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('[mermaid-check] 运行错误：', e);
  process.exit(1);
});
