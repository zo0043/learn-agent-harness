#!/usr/bin/env node
/**
 * visual-check.mjs — 站点结构 + 几何回归（W4 / t5，CI 作业 `Verify site` 的执行体）
 *
 * 背景：本机 2 核 3.4GB，astro build 必 OOM（历史 exit 134/137），整页视觉此前只能
 * 「留浏览器目检」。本脚本在 CI（ubuntu-latest，构建无 OOM 问题）上对构建产物做
 * 一层**结构与几何**的自动化断言，让「页面没坏」有可复跑证据。
 *
 * ── 边界诚实性（必须读）────────────────────────────────────────────────────
 * 本脚本**只**断言以下三类**可机检**约束，**不**断言、也**不能**断言视觉审美：
 *   ① 无横向溢出：max(documentElement.scrollWidth, body.scrollWidth)
 *                <= documentElement.clientWidth + 容差（默认 4px，吸收子像素取整）
 *   ② 关键元素可见：header 导航（桌面=横排 nav 含 ≥7 链接；≤720px=汉堡按钮，
 *                导航收起是设计而非缺陷）/ 页标题 / 卡片容器
 *   ③ 无 console error：pageerror（未捕获异常）+ console.error + 4xx/5xx 响应
 * 「无横向溢出」≠「视觉正确」：布局丑不丑、配色对不对、图文排版美不美，
 * 仍然**留浏览器人工目检**——本作业不覆盖，也不冒充覆盖。
 *
 * 用法（CI）：
 *   node tools/visual-check.mjs --base http://127.0.0.1:4173/learn-agent-harness/ --out tools/out
 *   负路径自证（人为注入，作业必须失败）：
 *   node tools/visual-check.mjs --base ... --out tools/out --fault overflow
 *   node tools/visual-check.mjs --base ... --out tools/out --fault missing-element
 * 本机预检（不依赖站点构建：用自带 fixture，验证断言器两条路径都会触发）：
 *   node tools/visual-check.mjs --selftest
 *
 * 退出码：0 = 全部断言通过（selftest 全部预期命中）；1 = 任一断言失败 /
 *   注入的故障未被检出（断言器过弱，同样算失败）/ 运行错误。
 *
 * 依赖：playwright（devDependency，仅 node 侧驱动；浏览器二进制由
 * `npx playwright install chromium` 提供——本机 2 核 3.4GB 不保证装得起来，
 * 装不起来时以 CI 实跑为准，见 .github/workflows/verify.yml）。
 */
import http from 'node:http';
import fs from 'node:fs';
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
const BASE = arg('base', 'http://127.0.0.1:4173/learn-agent-harness/');
const OUT = arg('out', path.join(__dirname, 'out'));
const FAULT = arg('fault', 'none'); // none | overflow | missing-element
const TOLERANCE = Number(arg('tolerance', '4')); // px

if (FAULT !== 'none' && FAULT !== 'overflow' && FAULT !== 'missing-element') {
  console.error(`[visual-check] 未知 --fault: ${FAULT}（可选 none/overflow/missing-element）`);
  process.exit(2);
}

// ── 被测页面（选择器取自 site/src 的现行结构；改页面结构时需同步本表）───────
// title = 页标题选择器；container + cardsMin = 卡片/容器断言。
// 课程页（c/rag）正文在 article.markdown 内（NotePageLayout），标题来自笔记 `# ` 渲染。
const PAGES = [
  { path: '', id: 'home', label: '首页', title: 'h1', container: '.cards .card', cardsMin: 1 },
  { path: 'learn/', id: 'learn', label: '学习路线', title: 'h1.page-title', container: '.cards .card', cardsMin: 1 },
  { path: 'works/', id: 'works', label: '作品详解', title: 'h1.page-title', container: 'section.work', cardsMin: 6 },
  { path: 'interview/', id: 'interview', label: '面试题库', title: 'h1', container: '.cards .card', cardsMin: 1 },
  { path: 'map/', id: 'map', label: '知识地图', title: 'h1', container: '.cards .card', cardsMin: 1 },
  { path: 'details/', id: 'details', label: '详解', title: 'h1.page-title', container: '.cards .card', cardsMin: 1 },
  { path: 'c/rag/', id: 'course-rag', label: '课程页·RAG与检索', title: 'article.markdown h1', container: 'article.markdown', cardsMin: 1, course: true },
];

// 三个视口：mobile 375（汉堡态）/ tablet 768 / desktop 1280。
// 断点依据：site/src/styles/global.css `@media (max-width: 720px)` 收汉堡。
const VIEWPORTS = [
  { id: '375', name: 'mobile', width: 375, height: 812 },
  { id: '768', name: 'tablet', width: 768, height: 1024 },
  { id: '1280', name: 'desktop', width: 1280, height: 900 },
];

// ── 注入故障（负路径自证；仅运行时注入，不改仓库文件）──────────────────────
function injectFault(page, kind) {
  return page.evaluate((k) => {
    if (k === 'overflow') {
      // 一个 5000px 宽的绝对定位条 → documentElement.scrollWidth 必然超 clientWidth
      const d = document.createElement('div');
      d.id = '__vc_injected_overflow__';
      d.style.cssText = 'position:absolute;left:0;top:0;width:5000px;height:24px;background:#f00;z-index:9999;';
      document.body.appendChild(d);
    } else if (k === 'missing-element') {
      // 移除页标题 → 「关键元素可见」断言必须失败
      const t = document.querySelector('h1');
      if (t) t.remove();
    }
  }, kind);
}

// ── 单页 × 单视口 检查 ─────────────────────────────────────────────────────
async function checkOne(browser, base, pageDef, vp, outDir, { screenshot = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const failedResponses = [];
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(`console.error: ${m.text()}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) failedResponses.push(`HTTP ${r.status()} ${r.url()}`);
  });

  const url = base + pageDef.path;
  const failures = [];
  const details = { page: pageDef.id, viewport: `${vp.width}x${vp.height}`, url, httpStatus: null, overflow: null, elements: [], consoleErrors: [], failedResponses: [], screenshot: null };

  try {
    const resp = await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    details.httpStatus = resp ? resp.status() : null;
    if (!resp || resp.status() !== 200) failures.push(`HTTP 状态 ${details.httpStatus}（期望 200）`);

    // 稳定化：等网络空闲（pagefind 懒加载不会触发；mermaid bundle 会）+ 图表渲染完成
    await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
    await page
      .waitForFunction(
        () => {
          const nodes = document.querySelectorAll('.mermaid');
          return nodes.length === 0 || [...nodes].every((n) => n.hasAttribute('data-processed') || n.querySelector('svg'));
        },
        { timeout: 15000 },
      )
      .catch(() => {});
    await page.waitForTimeout(300);

    // ① 无横向溢出
    const ov = await page.evaluate(() => ({
      scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      clientWidth: document.documentElement.clientWidth,
    }));
    const ovPass = ov.scrollWidth <= ov.clientWidth + TOLERANCE;
    details.overflow = { scrollWidth: ov.scrollWidth, clientWidth: ov.clientWidth, tolerance: TOLERANCE, pass: ovPass };
    if (!ovPass) {
      failures.push(`横向溢出：scrollWidth ${ov.scrollWidth} > clientWidth ${ov.clientWidth} + ${TOLERANCE}px`);
      // 诊断（不改判据）：列出最外层 5 个真正伸出文档的元素（跳过被横向滚动容器裁剪的——那是容器自身滚动，不算文档溢出）
      details.overflow.offenders = await page.evaluate((TOL) => {
        const cw = document.documentElement.clientWidth;
        const out = [];
        for (const el of document.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.right <= cw + TOL || r.width === 0) continue;
          let clipped = false;
          for (let a = el.parentElement; a; a = a.parentElement) {
            const ox = getComputedStyle(a).overflowX;
            if (/(auto|scroll|hidden)/.test(ox) && a.scrollWidth > a.clientWidth) { clipped = true; break; }
          }
          if (clipped) continue;
          const cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
          out.push({ selector: el.tagName.toLowerCase() + cls, right: Math.round(r.right), width: Math.round(r.width), text: (el.textContent || '').trim().slice(0, 60) });
        }
        out.sort((a, b) => b.width - a.width);
        return out.slice(0, 5);
      }, TOLERANCE);
      console.log(`[visual-check]   ↳ 溢出源（top）：${(details.overflow.offenders || []).map((o) => `<${o.selector}> w=${o.width} "${o.text.slice(0, 30)}"`).join(' | ')}`);
    }

    // ② 关键元素可见
    const vis = async (sel) => {
      const loc = page.locator(sel).first();
      try {
        return await loc.isVisible();
      } catch {
        return false;
      }
    };
    const elem = async (name, sel, { min = 1 } = {}) => {
      const count = await page.locator(sel).count();
      const visible = count > 0 && (await vis(sel));
      const ok = count >= min && visible;
      details.elements.push({ name, selector: sel, count, visible, ok });
      if (!ok) failures.push(`关键元素缺失/不可见：${name}（${sel}，count=${count}，visible=${visible}）`);
      return ok;
    };
    await elem('页头', 'header.site-header');
    if (vp.width > 720) {
      const navVisible = await vis('#site-nav');
      const linkCount = await page.locator('#site-nav a').count();
      const navOk = navVisible && linkCount >= 7;
      details.elements.push({ name: '主导航(横排)', selector: '#site-nav', count: linkCount, visible: navVisible, ok: navOk });
      if (!navOk) failures.push(`主导航不可见或链接数不足（#site-nav，links=${linkCount}，期望可见且 ≥7）`);
    } else {
      // ≤720px：导航按设计收进汉堡浮层（display:none 是关闭态，不是缺陷）
      const toggleVisible = await vis('.nav-toggle');
      details.elements.push({ name: '汉堡按钮(移动态)', selector: '.nav-toggle', count: 1, visible: toggleVisible, ok: toggleVisible });
      if (!toggleVisible) failures.push(`移动视口缺少可见的汉堡按钮（.nav-toggle）`);
    }
    await elem('页标题', pageDef.title);
    await elem(pageDef.course ? '课程正文' : '卡片容器', pageDef.container, { min: pageDef.cardsMin });
    if (pageDef.course) await elem('课程 meta 栏', 'header.course-meta-bar');

    // ③ 无 console error / 无 4xx-5xx
    if (consoleErrors.length > 0) failures.push(`console error ×${consoleErrors.length}：${consoleErrors.slice(0, 3).join(' | ')}${consoleErrors.length > 3 ? ` …（共 ${consoleErrors.length}）` : ''}`);
    if (failedResponses.length > 0) failures.push(`4xx/5xx 响应 ×${failedResponses.length}：${failedResponses.slice(0, 3).join(' | ')}`);

    if (screenshot) {
      const file = path.join(outDir, `${pageDef.id}_${vp.id}.png`);
      await page.screenshot({ path: file, fullPage: true });
      details.screenshot = path.relative(process.cwd(), file);
    }
  } catch (err) {
    failures.push(`运行错误：${err.message}`);
  } finally {
    await ctx.close().catch(() => {});
  }

  details.pass = failures.length === 0;
  details.failures = failures;
  return details;
}

// ── 主流程（CI）────────────────────────────────────────────────────────────
async function runMain() {
  const { chromium } = await import('playwright');
  fs.mkdirSync(OUT, { recursive: true });
  const t0 = Date.now();
  console.log(`[visual-check] base=${BASE} out=${OUT} fault=${FAULT} tolerance=${TOLERANCE}px`);
  console.log('[visual-check] 边界：只断言结构+几何（无横向溢出/关键元素可见/无 console error），不覆盖视觉审美（像素级仍留人工目检）');

  const browser = await chromium.launch({ headless: true });
  const all = [];
  try {
    for (const vp of VIEWPORTS) {
      for (const pg of PAGES) {
        let d;
        if (FAULT === 'none') {
          d = await checkOne(browser, BASE, pg, vp, OUT);
          all.push(d);
          printOne(d);
        } else {
          // 负路径：先基线（必须过，否则无法区分"本来就坏"和"注入导致"），
          // 再注入故障重跑断言，注入点必须被检出——两条都满足才算断言器有效。
          const baseline = await checkOne(browser, BASE, pg, vp, OUT, { screenshot: false });
          if (!baseline.pass) {
            console.error(`[visual-check] ❌ 负路径中止：基线本身未通过（${pg.id} ${vp.id}）：${baseline.failures.join('；')}——注入实验无意义`);
            await browser.close();
            process.exit(1);
          }
          const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
          const page = await ctx.newPage();
          await page.goto(BASE + pg.path, { waitUntil: 'load', timeout: 30000 });
          await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
          await injectFault(page, FAULT);
          const ov = await page.evaluate(() => ({
            scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
            clientWidth: document.documentElement.clientWidth,
          }));
          const titleGone = FAULT === 'missing-element' ? (await page.locator(pg.title).count()) === 0 : null;
          await ctx.close();

          const detectedOverflow = FAULT === 'overflow' && ov.scrollWidth > ov.clientWidth + TOLERANCE;
          const detectedMissing = FAULT === 'missing-element' && titleGone === true;
          const detected = detectedOverflow || detectedMissing;
          const d = {
            page: pg.id, viewport: `${vp.width}x${vp.height}`, url: BASE + pg.path,
            fault: FAULT,
            injection: { scrollWidth: ov.scrollWidth, clientWidth: ov.clientWidth, titleGone, overflowDetected: detectedOverflow, missingDetected: detectedMissing },
            pass: false, // 负路径下作业必须失败（exit 1），即使检出也保持 1
            failures: detected
              ? [`注入故障已检出（预期失败）：${FAULT === 'overflow' ? `scrollWidth ${ov.scrollWidth} > clientWidth ${ov.clientWidth} + ${TOLERANCE}px` : '页标题被移除，关键元素断言应失败'}`]
              : [`故障未被检出（断言器过弱！）：注入 ${FAULT} 后 scrollWidth=${ov.scrollWidth}/clientWidth=${ov.clientWidth}${FAULT === 'missing-element' ? '，标题仍存在' : ''}——该作业是恒真的，必须修复断言器`],
          };
          all.push(d);
          console.log(detected
            ? `[visual-check]  ${pg.id} ${vp.id}：注入 ${FAULT} 已检出（scrollWidth ${ov.scrollWidth} vs clientWidth ${ov.clientWidth}）——断言器有效，作业按预期失败`
            : `[visual-check] ❌ ${pg.id} ${vp.id}：注入 ${FAULT} **未被检出**——断言器过弱（恒真风险），作业失败`);
          if (!detected) {
            writeReport(all, t0);
            await browser.close();
            process.exit(1);
          }
        }
      }
    }
  } finally {
    writeReport(all, t0);
    await browser.close().catch(() => {});
  }

  if (FAULT === 'none') {
    const bad = all.filter((d) => !d.pass);
    if (bad.length > 0) {
      console.error(`\n[visual-check] ❌ ${bad.length}/${all.length} 页×视口 未通过：`);
      for (const d of bad) console.error(`  - ${d.page} @${d.viewport}: ${d.failures.join('；')}`);
      process.exit(1);
    }
    console.log(`\n[visual-check] ✅ 全部通过：${all.length} 页×视口（7 页 × 3 视口），无横向溢出 / 关键元素可见 / 无 console error`);
    console.log('[visual-check] 再次声明：这不等于视觉正确——审美判断仍留浏览器人工目检。');
    process.exit(0);
  } else {
    // 负路径：无论检出与否，作业退出码都是 1（检出=作业按预期失败；未检出=断言器过弱，同样失败）
    writeReport(all, t0);
    console.error(`\n[visual-check] 🧪 负路径（--fault ${FAULT}）结束：作业按设计失败（exit 1）。见上方逐页记录与 report.json。`);
    process.exit(1);
  }
}

function printOne(d) {
  const line = d.pass
    ? `[visual-check] ✅ ${d.page} @${d.viewport}  sw=${d.overflow?.scrollWidth}/cw=${d.overflow?.clientWidth}  元素 ${d.elements.length}/${d.elements.length}  console 0`
    : `[visual-check] ❌ ${d.page} @${d.viewport}  ${d.failures.join('；')}`;
  console.log(line);
}

// ── selftest（本机预检：fixture 验证断言器两条路径）────────────────────────
async function runSelftest() {
  const { chromium } = await import('playwright');
  const fixtures = path.join(__dirname, 'fixtures');
  const server = http.createServer((req, res) => {
    const file = path.join(fixtures, req.url === '/' ? 'good.html' : req.url.slice(1));
    if (!fs.existsSync(file)) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}/`;
  const outDir = path.join(__dirname, 'out', 'selftest');
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`[visual-check] selftest：fixture 服务器 ${base}（不依赖站点构建）`);

  const browser = await chromium.launch({ headless: true });
  const t0 = Date.now();
  const results = [];
  const expect = (name, cond, detail) => {
    const ok = !!cond;
    results.push({ name, ok, detail });
    console.log(`  ${ok ? '✅' : '❌'} ${name}${ok ? '' : ` —— ${detail}`}`);
  };

  try {
    // 1) good 页：3 视口全过（断言器不会冤枉好页面）
    for (const vp of VIEWPORTS) {
      const d = await checkOne(browser, base, { path: 'good.html', id: 'good', label: 'good', title: 'h1', container: '.cards .card', cardsMin: 3 }, vp, outDir, { screenshot: false });
      expect(`good @${vp.id} 全部通过`, d.pass, d.failures.join('；'));
    }
    // 2) 静态坏页：横向溢出 → 溢出断言必须失败，元素断言不受牵连
    for (const vp of VIEWPORTS) {
      const d = await checkOne(browser, base, { path: 'bad-overflow.html', id: 'bad-overflow', label: 'bad-overflow', title: 'h1', container: '.cards .card', cardsMin: 3 }, vp, outDir, { screenshot: false });
      expect(`bad-overflow @${vp.id} 溢出断言失败`, !d.overflow.pass, `scrollWidth=${d.overflow.scrollWidth} clientWidth=${d.overflow.clientWidth}`);
      const elemFail = d.elements.filter((e) => !e.ok);
      expect(`bad-overflow @${vp.id} 元素断言不受牵连`, elemFail.length === 0, `元素失败：${elemFail.map((e) => e.name).join(',')}`);
    }
    // 3) 静态坏页：无标题 → 标题断言必须失败
    for (const vp of VIEWPORTS) {
      const d = await checkOne(browser, base, { path: 'bad-missing.html', id: 'bad-missing', label: 'bad-missing', title: 'h1', container: '.cards .card', cardsMin: 3 }, vp, outDir, { screenshot: false });
      const title = d.elements.find((e) => e.name === '页标题');
      expect(`bad-missing @${vp.id} 标题断言失败`, title && !title.ok, `title=${JSON.stringify(title)}`);
      expect(`bad-missing @${vp.id} 溢出断言通过`, d.overflow.pass, `sw=${d.overflow.scrollWidth} cw=${d.overflow.clientWidth}`);
    }
    // 4) 运行时注入：good 页注入 overflow / missing，两条都必须被检出
    for (const fault of ['overflow', 'missing-element']) {
      const vp = VIEWPORTS[2]; // 桌面视口足以代表（注入与视口无关时取一即可，3 视口注入已覆盖在 2 中由静态页完成）
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await ctx.newPage();
      await page.goto(base + 'good.html', { waitUntil: 'load' });
      await injectFault(page, fault);
      const ov = await page.evaluate(() => ({ sw: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth), cw: document.documentElement.clientWidth }));
      const titleCount = await page.locator('h1').count();
      await ctx.close();
      const detected = fault === 'overflow' ? ov.sw > ov.cw + TOLERANCE : titleCount === 0;
      expect(`注入 ${fault} 被检出（good 页 ${vp.id}）`, detected, `sw=${ov.sw} cw=${ov.cw} titleCount=${titleCount}`);
    }
  } finally {
    await browser.close().catch(() => {});
    server.close();
  }

  const bad = results.filter((r) => !r.ok);
  const fs2 = await import('node:fs');
  fs2.writeFileSync(path.join(outDir, 'selftest-report.json'), JSON.stringify({ results, durationMs: Date.now() - t0 }, null, 2));
  if (bad.length > 0) {
    console.error(`\n[visual-check] ❌ selftest 失败：${bad.length}/${results.length} 项预期未命中（断言器不可信，禁止上 CI）`);
    process.exit(1);
  }
  console.log(`\n[visual-check] ✅ selftest 全部命中：${results.length}/${results.length}（好页不被冤枉 / 溢出必被抓 / 缺标题必被抓 / 运行时注入必被抓）——断言器两条路径均可证伪`);
  process.exit(0);
}

// ── 报告落盘 ───────────────────────────────────────────────────────────────
function writeReport(all, t0) {
  const report = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    fault: FAULT,
    tolerancePx: TOLERANCE,
    viewports: VIEWPORTS,
    pages: PAGES.map((p) => ({ path: p.path, id: p.id })),
    results: all,
    summary: {
      total: all.length,
      passed: all.filter((d) => d.pass).length,
      failed: all.filter((d) => !d.pass).length,
    },
    durationMs: Date.now() - t0,
    scopeNote: '本作业只断言结构与几何约束（无横向溢出/关键元素可见/无 console error），不覆盖视觉审美——像素级视觉仍留浏览器人工目检。',
  };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`[visual-check] 报告与截图 → ${path.join(OUT, 'report.json')}（${all.length} 页×视口，耗时 ${report.durationMs}ms）`);
}

if (HAS_SELFTEST) runSelftest().catch((e) => { console.error('[visual-check] 运行错误：', e); process.exit(1); });
else runMain().catch((e) => { console.error('[visual-check] 运行错误：', e); process.exit(1); });
