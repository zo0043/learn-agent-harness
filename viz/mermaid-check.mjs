// 确定性验收：把构建好的站点起来，逐页确认 mermaid 真的渲染成 <svg>（无语法错误），
// 并统计所有静态资源是否有非 200 响应。非视觉检查（不依赖模型看图）。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, extname } from 'node:path';

const DIST = '/home/ubuntu/app/learn-agent-harness/site/dist';
const BASE = '/learn-agent-harness';
// P-14：/c/ 路由清单从 notes/ 动态生成（增删笔记零维护）。
// 旧版是 15 条手抄 SLUGS——新增 llm-timeline / industry-2026 两篇时即已漏收，
// 且此后每加一篇课都要手动同步。规则与 courses.ts 的 EXCLUDED_FROM_COURSE_ROUTE
// 一致：notes 顶层 md 去掉两个独立页面（knowledge-map→/map、interview-bank→/interview）。
const NOTES_DIR = fileURLToPath(new URL('../notes/', import.meta.url));
const EXCLUDED = new Set(['knowledge-map', 'interview-bank']);
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

const chrome = '/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
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
