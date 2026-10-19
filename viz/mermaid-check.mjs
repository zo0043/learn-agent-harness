// 确定性验收：把构建好的站点起来，逐页确认 mermaid 真的渲染成 <svg>（无语法错误），
// 并统计所有静态资源是否有非 200 响应。非视觉检查（不依赖模型看图）。
//
// 可移植性（G0-4 / F0-3）：
//   · 站点产物目录与 notes/ 目录**都从本文件位置派生**（import.meta.url），不再写死
//     「某台机器的 checkout 绝对路径」——换机器 / 换 checkout 后照样能跑。
//   · Chromium 由 viz/chrome.mjs 的候选表探测（`CHROME_PATH` 优先），不再写死 revision；
//     找不到浏览器时打印明确错误（探测过哪些路径 + 怎么修）而不是抛 ENOENT 崩栈。
//   · `site/dist` 不存在或 0 个 HTML 时，打印明确提示后 exit 1（不崩栈）。
//
// 用法：
//   node viz/mermaid-check.mjs            # 默认站点产物 = <repo>/site/dist
//   node viz/mermaid-check.mjs --dist=…   # 覆盖产物目录
//   node viz/mermaid-check.mjs --help     # 用法
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, extname } from 'node:path';
import { resolveChrome, chromeNotFoundMessage } from './chrome.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const argv = process.argv.slice(2);
const flag = (name, dflt = null) => {
  const hit = argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return dflt;
  if (hit.includes('=')) return hit.slice(hit.indexOf('=') + 1);
  const i = argv.indexOf(hit);
  return argv[i + 1] ?? dflt;
};

if (argv.includes('--help') || argv.includes('-h')) {
  console.log(`用法：node viz/mermaid-check.mjs [--dist=<站点产物目录>]
  默认 --dist = ${join(ROOT, 'site', 'dist')}（从本文件位置派生，可移植）
  Chromium 解析顺序见 viz/chrome.mjs（CHROME_PATH 优先），找不到时打印明确错误。`);
  process.exit(0);
}

const DIST = resolve(flag('dist', join(ROOT, 'site', 'dist')));
// 产物目录缺失 / 0 HTML ⇒ 明确提示（而不是让下游 stat 抛 ENOENT 崩栈）。
if (!existsSync(DIST)) {
  console.error(`mermaid-check: ❌ 站点产物目录不存在：${DIST}`);
  console.error('  先构建站点（cd site && npm run build），或用 --dist=<目录> 指定；');
  console.error('  注意：site/dist 曾出现「89 文件 / 0 HTML」的残骸，只看目录存在并不够。');
  process.exit(1);
}
const htmlCount = (() => {
  let n = 0;
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) n += 1;
    }
  };
  walk(DIST);
  return n;
})();
if (htmlCount === 0) {
  console.error(`mermaid-check: ❌ 站点产物目录里 0 个 HTML：${DIST}（这是构建残骸，不是可用产物）`);
  console.error('  重跑构建：cd site && npm run build');
  process.exit(1);
}
const BASE = '/learn-agent-harness';
// P-14：/c/ 路由清单从 notes/ 动态生成（增删笔记零维护）。
// 旧版是 15 条手抄 SLUGS——新增 llm-timeline / industry-2026 两篇时即已漏收，
// 且此后每加一篇课都要手动同步。规则与 courses.ts 的 EXCLUDED_FROM_COURSE_ROUTE
// 一致：notes 顶层 md 去掉有独立页面的那一个（knowledge-map→/map）。
// 2026-10-19 去面试化：interview-bank.md 已删除，EXCLUDED 由 2 条收缩为 1 条。
const NOTES_DIR = fileURLToPath(new URL('../notes/', import.meta.url));
const EXCLUDED = new Set(['knowledge-map']);
const SLUGS = readdirSync(NOTES_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.slice(0, -3))
  .filter((s) => !EXCLUDED.has(s))
  .sort();
// '/map' 自 2026-10-12 起为 notes/knowledge-map.md 原文渲染（mermaid 依赖图来自笔记，不再是手绘副本）
const PAGES = [...SLUGS, '/map'];
const PORT = 8099;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2',
  '.png': 'image/png', '.ico': 'image/x-icon', '.map': 'application/json',
};

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!p.startsWith(BASE)) { res.writeHead(404).end('no'); return; }
    p = p.slice(BASE.length) || '/';
    if (p.endsWith('/')) p += 'index.html';
    const file = join(DIST, p);
    const s = await stat(file);
    if (s.isDirectory()) { res.writeHead(404).end('dir'); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404).end('404'); }
});
await new Promise((r) => server.listen(PORT, r));

// G0-4：Chromium 不再是硬编码 revision 常量，而是候选表探测（CHROME_PATH 优先）。
// 找不到时打印「探测过哪些路径 + 怎么修」，而不是让 playwright 抛 ENOENT/不可执行崩栈。
const chrome = resolveChrome();
if (!chrome) {
  console.error(`mermaid-check: ❌ ${chromeNotFoundMessage()}`);
  process.exit(1);
}
console.log(`mermaid-check: dist=${DIST}（${htmlCount} 个 HTML）/ chrome=${chrome}`);
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage();

const bad = [];
page.on('response', (r) => { if (r.status() !== 200 && !r.url().startsWith('data:')) bad.push(`${r.status()} ${r.url()}`); });
page.on('console', (m) => { if (m.type() === 'error') bad.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => bad.push(`pageerror: ${e.message}`));

const rows = [];
for (const slug of PAGES) {
  const url = `http://localhost:${PORT}${BASE}${slug.startsWith('/') ? slug : `/c/${slug}`}/`;
  await page.goto(url, { waitUntil: 'load' });
  // 等 mermaid 客户端渲染（最多 8s）
  let rendered = 0, total = 0, errText = '';
  try {
    await page.waitForFunction(() => {
      const divs = [...document.querySelectorAll('.mermaid')];
      return divs.length > 0 && divs.every((d) => d.querySelector('svg'));
    }, { timeout: 8000 });
  } catch { /* fall through */ }
  ({ rendered, total, errText } = await page.evaluate(() => {
    const divs = [...document.querySelectorAll('.mermaid')];
    const rendered = divs.filter((d) => d.querySelector('svg')).length;
    const errs = divs.map((d) => d.textContent || '').filter((t) => /syntax error|error/i.test(t) && t.length < 400);
    return { rendered, total: divs.length, errText: errs.join(' | ') };
  }));
  rows.push({ slug, rendered, total, errText, ok: rendered === total && total > 0 });
}

await browser.close();
server.close();
console.log('=== mermaid 渲染（每页 .mermaid div 数量 / 成功渲染为 svg 的数量）===');
for (const r of rows) console.log(`${r.ok ? '✅' : '❌'} ${r.slug}: ${r.rendered}/${r.total}${r.errText ? ' ERR=' + r.errText : ''}`);
console.log('=== 非 200 响应 / 控制台错误 ===');
console.log(bad.length ? bad.join('\n') : '（无）');
const pass = rows.every((r) => r.ok) && bad.length === 0;
console.log(pass ? '\nRESULT: PASS' : '\nRESULT: FAIL');
process.exit(pass ? 0 : 1);
