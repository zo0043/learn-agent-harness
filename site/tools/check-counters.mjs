#!/usr/bin/env node
/**
 * check-counters.mjs —— 口径一致性门禁（D7 机制性修复）
 *
 * 【为什么存在】
 * `notes/knowledge-map.md` 的「计数口径」块声明自己「全仓唯一参照，其余位置只引用本块、不另起数」。
 * 但这条约定**只靠人工遵守，从来没有机器门禁**——实测已发生多起「修一处、漏两处」：
 *   · 口径「站点 html 32」漏了 `nav`（真值 33），在 knowledge-map.md / README.md / verify.yml 三处各有一份手工副本；
 *   · `courses.ts` 注释曾写「有 npm run demo 的目录数 = 6」而实测为 10（该条至今仍是被声明已改却漏改的那条）；
 *   · `README.md` 曾称「27 个文件 / ~600KB」而实测 47 个文件 / ~996KB。
 * 本脚本把该约定升级为 CI 门禁：**逐条重算口径块里的数字，与块内声明值比对，不符即非 0 退出**。
 * 于是「改了知识库却忘了同步口径块」或「改了口径块却与实际不符」都会在 CI 先于耗时构建失败。
 *
 * 【设计约束】
 *   1. **不依赖全量 `astro build`**（本机构建约 484s 且受资源约束，历史多次 SIGKILL/OOM）。
 *      文件系统计数用 `fs.readdirSync`，代码计数用正则读 `site/src/data/*.ts` 源码（不 import、
 *      不 require TS、不起 vite），故本脚本秒级完成。
 *   2. **不新增第二份真源**：声明值只从 `notes/knowledge-map.md` 的口径块读取，脚本内不硬编码任何计数；
 *      重算值只从实际文件系统 / 源码派生。两边独立，才具备证伪能力。
 *   2b. **分解式不手工复述（2026-10-14）**：「站点 html 33」不再以字面量复述划分，改为**自源派生**
 *      三个桶并断言「互斥且穷尽」——A 静态页 = `site/src/pages/` 递归下全部 .astro 中文件名不含
 *      `[` 参数者；B 课程页 = 课程集合条目（`c/[slug].astro`）；C 专题页 = `notes/details/*.md`（由
 *      `details/[slug].astro` 渲染）。输出打印脚本**实算**出的桶成员清单。任何新增动态页若未登记，
 *      会让「穷尽」断言失败，而不是静默逃出计数（这正是把「修一处漏两处」变成机器可判定的关键）。
 *   3. **退出码语义**：0 = 全部一致；1 = 存在不一致或解析失败（解析失败同样必须失败，否则门禁会被静默绕过）。
 *
 * 【用法】在仓库根目录：`node site/tools/check-counters.mjs`
 *        路径按脚本自身位置解析，故从任意 cwd 运行皆可。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ── 仓库根：本文件位于 <root>/site/tools/check-counters.mjs，故上溯三级 ──────────────
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(path.dirname(HERE));

const P = {
  knowledgeMap: path.join(ROOT, 'notes', 'knowledge-map.md'),
  notesDir: path.join(ROOT, 'notes'),
  detailsDir: path.join(ROOT, 'notes', 'details'),
  interviewBank: path.join(ROOT, 'notes', 'interview-bank.md'),
  coursesTs: path.join(ROOT, 'site', 'src', 'data', 'courses.ts'),
  pagesDir: path.join(ROOT, 'site', 'src', 'pages'),
  readme: path.join(ROOT, 'README.md'),
  verifyYml: path.join(ROOT, '.github', 'workflows', 'verify.yml'),
};

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);
const mdFiles = (dir) =>
  exists(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')) : [];

// ── 结果收集 ────────────────────────────────────────────────────────────────────
const results = [];
let hardError = null;

/**
 * 登记一条判据。declared 与 actual 均为 null 表示该条无法解析（视为失败，避免门禁被静默绕过）。
 */
function check(name, declared, actual, note = '') {
  const pass = declared !== null && actual !== null && declared === actual;
  results.push({ name, declared, actual, pass, note });
}

// ── 1) 解析口径块（声明值唯一来源）────────────────────────────────────────────────
let block = '';
try {
  const km = read(P.knowledgeMap);
  const anchor = km.indexOf('计数口径');
  if (anchor < 0) throw new Error('未找到「计数口径」标记');
  const end = km.indexOf('\n\n', anchor);
  block = km.slice(anchor, end < 0 ? km.length : end);
} catch (e) {
  hardError = `无法读取/解析 ${path.relative(ROOT, P.knowledgeMap)} 的口径块：${e.message}`;
}

const num = (re, label) => {
  const m = block.match(re);
  if (!m) {
    hardError = hardError ?? `口径块缺少「${label}」声明（正则 ${re}）`;
    return null;
  }
  return Number(m[1]);
};

// 口径块声明值
let dec = {};
if (!hardError) {
  dec = {
    domains: num(/知识域\s*(\d+)/, '知识域'),
    coursePages: num(/课程页\s*(\d+)/, '课程页'),
    cards: num(/课程卡\s*(\d+)/, '课程卡'),
    exercises: num(/课内嵌\s*\*\*(\d+)\*\*/, '课内嵌题'),
    interviews: num(/面试题库精选\s*\*\*(\d+)\*\*/, '面试题库'),
    siteHtml: num(/站点 html\s*(\d+)/, '站点 html'),
  };
  // notes 顶层数与 EXCLUDED 条数由同一条算式给出：`notes 顶层 19 − knowledge-map − interview-bank`
  const m = block.match(/notes 顶层\s*(\d+)\s*−\s*([^）)]+)/);
  if (!m) {
    hardError = hardError ?? '口径块缺少「notes 顶层 N − …」算式';
  } else {
    dec.notesTop = Number(m[1]);
    dec.excludedNames = m[2]
      .split('−')
      .map((s) => s.trim())
      .filter(Boolean);
    dec.excluded = dec.excludedNames.length;
  }
}

// ── 2) 重算（实际来源）───────────────────────────────────────────────────────────
const act = {};
if (!hardError) {
  // notes 顶层 md 数
  act.notesTop = mdFiles(P.notesDir).length;

  // courses.ts 源码解析（不 import TS）：课程卡条目、DOMAIN_COUNT 的过滤语义、EXCLUDED 集合
  const ts = read(P.coursesTs);
  const arrStart = ts.indexOf('export const COURSES');
  const arrEnd = ts.indexOf('\n];', arrStart);
  if (arrStart < 0 || arrEnd < 0) {
    hardError = 'courses.ts 中未找到 COURSES 数组边界';
  } else {
    const arr = ts.slice(arrStart, arrEnd);
    const entries = [...arr.matchAll(/slug: '([^']*)', domain: '([^']*)', phase: '([^']*)'/g)].map(
      (m) => ({ slug: m[1], domain: m[2], phase: m[3] }),
    );
    const whiteboard = (ts.match(/const NON_COURSE_CARD_SLUG = '([^']+)'/) ?? [])[1];
    const horizontal = (ts.match(/const HORIZONTAL_PHASE = '([^']+)'/) ?? [])[1];
    if (!whiteboard || !horizontal) hardError = 'courses.ts 中未找到 NON_COURSE_CARD_SLUG / HORIZONTAL_PHASE';

    act.cards = entries.length;
    // 复刻 COURSE_COUNT：排除白板卡
    act.coursePages = entries.filter((e) => e.slug !== whiteboard).length;
    // 课程页桶的**成员清单**（供站点 html 三桶划分派生，不手工复述）
    act.courseSlugs = entries.filter((e) => e.slug !== whiteboard).map((e) => e.slug);
    // 复刻 DOMAIN_COUNT：排除白板卡与 phase='—' 横向资产后按 domain 去重
    act.domains = new Set(
      entries.filter((e) => e.slug !== whiteboard && e.phase !== horizontal).map((e) => e.domain),
    ).size;

    const exRaw = ts.match(/EXCLUDED_FROM_COURSE_ROUTE = new Set\(\[([^\]]*)\]\)/);
    if (!exRaw) {
      hardError = 'courses.ts 中未找到 EXCLUDED_FROM_COURSE_ROUTE';
    } else {
      act.excludedNames = [...exRaw[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
      act.excluded = act.excludedNames.length;
    }
  }

  // 课内嵌题 = 13 课练习题库（表格行）+ agent-harness §13 八题 + rag S1 五题 + model-basics S7 十六题
  const bankFiles = mdFiles(P.notesDir).filter((f) => f !== 'agent-harness.md');
  let bank = 0;
  for (const f of bankFiles) {
    const lines = read(path.join(P.notesDir, f)).split('\n');
    let inBank = false;
    for (const L of lines) {
      const h = L.match(/^#{1,3}\s*(.+)$/);
      if (h) {
        if (/练习题库/.test(h[1])) {
          inBank = true;
          continue;
        }
        if (inBank) inBank = false;
      }
      if (inBank && /^\|\s*\d+\s*\|/.test(L)) bank++;
    }
  }
  // agent-harness §13 存档题：同级标题「第十三节 练习题库」下的表格行
  let ah = 0;
  if (exists(path.join(P.notesDir, 'agent-harness.md'))) {
    const lines = read(path.join(P.notesDir, 'agent-harness.md')).split('\n');
    let inBank = false;
    for (const L of lines) {
      const h = L.match(/^#{1,3}\s*(.+)$/);
      if (h) {
        if (/练习题库/.test(h[1])) {
          inBank = true;
          continue;
        }
        if (inBank) inBank = false;
      }
      if (inBank && /^\|\s*\d+\s*\|/.test(L)) ah++;
    }
  }
  // rag S1 五道确认题
  let ragQ = 0;
  if (exists(path.join(P.notesDir, 'rag.md'))) {
    const seg = read(path.join(P.notesDir, 'rag.md')).split(/^## S1 /m)[1] ?? '';
    ragQ = (seg.split(/^## /m)[0].match(/^\*\*Q\d+/gm) ?? []).length;
  }
  // model-basics S7 八股速查表：节标题声明「(N 题 × …)」
  let mbQ = 0;
  if (exists(path.join(P.notesDir, 'model-basics.md'))) {
    const mb = read(path.join(P.notesDir, 'model-basics.md'));
    const seg = mb.split(/^## S7 /m)[1] ?? '';
    const body = seg.split(/^## /m)[0];
    const head = (seg.split('\n')[0].match(/（(\d+)\s*题/) ?? [])[1];
    const listed = (body.match(/^\d+\.\s+\*\*/gm) ?? []).length;
    // 标题声明与正文列表必须自洽，否则也算口径失真
    if (head !== undefined && Number(head) !== listed) {
      hardError =
        hardError ??
        `model-basics S7 标题声明 ${head} 题，正文实列 ${listed} 题（两者必须一致）`;
    }
    mbQ = listed;
  }
  act.exercises = bank + ah + ragQ + mbQ;
  act.exerciseParts = { bank, agentHarness: ah, ragS1: ragQ, modelBasicsS7: mbQ };

  // 面试题库 = §3 + §4 + §8
  if (exists(P.interviewBank)) {
    const secs = read(P.interviewBank).split(/^## /m).slice(1);
    let s3 = 0, s4 = 0, s8 = 0;
    for (const s of secs) {
      const title = s.split('\n')[0];
      if (/^3[ .、]/.test(title)) s3 += (s.match(/^- Q\d+/gm) ?? []).length;
      if (/^4[ .、]/.test(title)) s4 += (s.match(/^\|\s*\d+\s*\|/gm) ?? []).length;
      if (/^8[ .、]/.test(title)) s8 += (s.match(/^\*\*Q\d+/gm) ?? []).length;
    }
    act.interviews = s3 + s4 + s8;
    act.interviewParts = { s3, s4, s8 };
  } else {
    hardError = '未找到 notes/interview-bank.md';
  }

  // 站点 html = **三桶互斥且穷尽**的划分，自源文件派生（不再用字面量复述分解式）
  //   A 静态页：site/src/pages/**/*.astro 中文件名**不含 `[` 参数**者（非动态页）
  //   B 课程页：site/src/pages/c/[slug].astro          → 课程集合条目（排除白板卡）
  //   C 专题页：site/src/pages/details/[slug].astro    → notes/details/*.md
  const walkAstro = (dir) => {
    if (!exists(dir)) return [];
    const out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) out.push(...walkAstro(abs));
      else if (e.name.endsWith('.astro')) out.push(path.relative(P.pagesDir, abs));
    }
    return out;
  };
  const isDynamic = (f) => /\[[^\]]+\]/.test(f);
  const allPages = walkAstro(P.pagesDir);
  const staticPageFiles = allPages.filter((f) => !isDynamic(f));
  const dynamicPageFiles = allPages.filter(isDynamic);
  // 动态页必须全部已知：否则「三桶」不再穷尽，新页面会静默逃出计数
  const KNOWN_DYNAMIC = ['c/[slug].astro', 'details/[slug].astro'];
  act.siteHtmlUnclassified = dynamicPageFiles.filter((f) => !KNOWN_DYNAMIC.includes(f));

  // Astro 默认 build.format='directory'：非 index 页产出 <name>/index.html；index/404 例外
  const toHtmlOutput = (f) => {
    const n = f.replace(/\.astro$/, '');
    if (n === '404') return '404.html';
    if (n === 'index' || n.endsWith('/index')) return `${n}.html`;
    return `${n}/index.html`;
  };
  const bucketStatic = staticPageFiles.map(toHtmlOutput);
  const bucketCourse = (act.courseSlugs ?? []).map((s) => `c/${s}/index.html`);
  const bucketDetail = mdFiles(P.detailsDir).map((f) => `details/${f.replace(/\.md$/, '')}/index.html`);
  const buckets = { 静态页: bucketStatic, 课程页: bucketCourse, 专题页: bucketDetail };
  act.siteBuckets = buckets;
  act.siteHtmlUnion = bucketStatic.length + bucketCourse.length + bucketDetail.length;
  // 互斥性：逐成员判定是否落进两个及以上桶
  const owners = new Map();
  for (const [name, list] of Object.entries(buckets)) {
    for (const m of list) owners.set(m, [...(owners.get(m) ?? []), name]);
  }
  act.siteBucketOverlap = [...owners.entries()].filter(([, names]) => names.length > 1);
  act.siteHtml = act.siteHtmlUnion;
  act.siteHtmlDisjoint = act.siteBucketOverlap.length === 0;

  // 2b) 交叉核对：口径块里的「排除项名称」必须与代码集合逐字一致
  act.excludedNamesMatch =
    !!dec.excludedNames &&
    !!act.excludedNames &&
    dec.excludedNames.join(',') === act.excludedNames.join(',');
}

// ── 3) 判据登记 ─────────────────────────────────────────────────────────────────
if (hardError) {
  console.error(`\n✖ 口径门禁无法执行：${hardError}\n`);
  process.exit(1);
}

check('知识域', dec.domains, act.domains, 'courses.ts DOMAIN_COUNT 复刻（排除 whiteboard 与 phase=—）');
check('课程页 /c/<slug>/', dec.coursePages, act.coursePages, 'COURSES 条目排除白板卡');
check('课程卡', dec.cards, act.cards, 'COURSES 全部条目');
check('课内嵌题', dec.exercises, act.exercises, `13课题库 ${act.exerciseParts.bank} + agent-harness ${act.exerciseParts.agentHarness} + rag S1 ${act.exerciseParts.ragS1} + model-basics S7 ${act.exerciseParts.modelBasicsS7}`);
check('面试题库精选', dec.interviews, act.interviews, `§3 ${act.interviewParts.s3} + §4 ${act.interviewParts.s4} + §8 ${act.interviewParts.s8}`);
check('notes 顶层 md 数', dec.notesTop, act.notesTop, 'notes/*.md（process/ 与 details/ 不计）');
check('EXCLUDED_FROM_COURSE_ROUTE 条数', dec.excluded, act.excluded, 'courses.ts 的 Set 元素数');
check(
  '站点 html（三桶并集）',
  dec.siteHtml,
  act.siteHtml,
  `由源派生的三桶：\n        静态页 ${act.siteBuckets['静态页'].length} = ${act.siteBuckets['静态页'].join(' / ')}` +
    `\n        课程页 ${act.siteBuckets['课程页'].length} = ${act.siteBuckets['课程页'].join(' / ')}` +
    `\n        专题页 ${act.siteBuckets['专题页'].length} = ${act.siteBuckets['专题页'].join(' / ')}`,
);
check(
  '站点 html 三桶互斥',
  true,
  act.siteHtmlDisjoint,
  act.siteHtmlDisjoint
    ? '无成员落进两个桶'
    : `重叠成员：${act.siteBucketOverlap.map(([m, n]) => `${m} ∈ [${n.join(', ')}]`).join('；')}`,
);
check(
  '站点 html 动态页全部已分类',
  true,
  act.siteHtmlUnclassified.length === 0,
  act.siteHtmlUnclassified.length === 0
    ? '已知动态页 = c/[slug].astro, details/[slug].astro'
    : `未分类动态页（会静默逃出三桶计数）：${act.siteHtmlUnclassified.join(', ')}`,
);
check(
  '口算式自洽：顶层 − 排除 = 课程页',
  dec.coursePages,
  act.notesTop - act.excluded,
  `${act.notesTop} − ${act.excluded} = ${act.notesTop - act.excluded}`,
);
check(
  '排除项名称：口径块 ↔ 代码集合',
  true,
  act.excludedNamesMatch,
  `块内 [${(dec.excludedNames ?? []).join(', ')}] vs 代码 [${(act.excludedNames ?? []).join(', ')}]`,
);

// 3b) 副本交叉核对：同一口径的历史「手工副本」必须与口径块一致（这正是「修一处漏两处」的抓手）
const copies = [];
const grepNum = (file, re, label) => {
  if (!exists(file)) return;
  const m = read(file).match(re);
  copies.push({
    label,
    file: path.relative(ROOT, file),
    pass: !!m,
    expect: m ? m[0].trim().slice(0, 80) : '未匹配',
  });
};
// README.md：顶层课程内容数口径行 + dist html 33
grepNum(P.readme, new RegExp(`${dec.notesTop} 篇课程内容`), `README.md 声明「${dec.notesTop} 篇课程内容」`);
grepNum(P.readme, new RegExp(`dist HTML=${dec.siteHtml}|HTML=${dec.siteHtml}`), `README.md 声明 dist HTML=${dec.siteHtml}`);
// courses.ts：注释里的顶层数与课程页数
grepNum(P.coursesTs, new RegExp(`notes 顶层\\s*${dec.notesTop}\\s*−`), `courses.ts 注释声明「notes 顶层 ${dec.notesTop} −」`);
grepNum(P.coursesTs, new RegExp(`= ${dec.coursePages}(\\D|$)`), `courses.ts 注释声明课程页 ${dec.coursePages}`);
grepNum(P.coursesTs, new RegExp(`= ${dec.cards}(\\D|$)`), `courses.ts 注释声明课程卡 ${dec.cards}`);
// verify.yml：等值断言 + nav 关键页
grepNum(P.verifyYml, new RegExp(`-eq ${dec.siteHtml}\\b`), `verify.yml 等值断言 -eq ${dec.siteHtml}`);
grepNum(P.verifyYml, /nav\/index\.html/, 'verify.yml 关键页清单含 nav/index.html');

// ── 3c) 口径 B1 判据组（2026-10-19 新增；修复 2026-10-18 评审 Top-1 根因「手抄副本不在门禁内」）──
// 背景：2026-10-18 评审的 Top-1 根因是「同一事实有 2–4 份手抄副本，而门禁只覆盖其中 12 条」。
// 2026-10-19 修复轮已就地改正 demo 数 / span 数 / 事故时长 / 时间线截断 / 白板行数 / 轨迹文件引用，
// 但当时**无任何机器判据守着**（终审实测 check-counters.mjs 与 HEAD 逐字节一致）——P1 根因仍在。
// 本节把它们升为判据。**纪律：只增约束、不放宽任何既有判据**；声明值一律从源码/口径块/仓外官方派生。
const SCAN_SKIP = new Set(['node_modules', '.git', 'dist', 'analysis', 'reviews', '.state', 'out']);
const TEXT_EXT = new Set(['.md', '.astro', '.ts', '.mjs', '.js', '.json', '.yml', '.yaml', '.sh', '.txt', '.xml']);
const walkText = (dir, out = []) => {
  if (!exists(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SCAN_SKIP.has(e.name)) walkText(full, out); }
    else if (TEXT_EXT.has(path.extname(e.name))) out.push(full);
  }
  return out;
};
const SCAN_ROOTS = [
  'notes', 'site', 'harness-demo', 'rag-demo', 'sandbox-demo', 'mcp-demo',
  'durable-execution-demo', 'framework-demo', 'memory-redteam', 'viz', '.github',
  'README.md', 'handoff.md', 'AGENTS.md',
].map((r) => path.join(ROOT, r)).filter((p) => exists(p));
const SELF = path.relative(ROOT, HERE + '/check-counters.mjs'); // 自排除：门禁自身代码里的正则字面量不得判自己
const scanFiles = [];
for (const r of SCAN_ROOTS) {
  if (fs.statSync(r).isDirectory()) scanFiles.push(...walkText(r).filter((f) => path.relative(ROOT, f) !== SELF));
  else if (path.relative(ROOT, r) !== SELF) scanFiles.push(r);
}
const grepRepo = (re) => scanFiles.filter((f) => re.test(fs.readFileSync(f, 'utf8')));

// D1 可运行 demo 作品数：口径块枚举的六个具名目录 vs README 作品表实际列出的行
const workDirs = ['harness-demo', 'rag-demo', 'sandbox-demo', 'mcp-demo', 'durable-execution-demo', 'framework-demo'];
const missing = workDirs.filter((d) => !exists(path.join(ROOT, d)));
check('可运行 demo 作品（口径块 6 个目录全存在）', 0, missing.length, missing.join(', ') || '六个目录均在');
const readmeWorks = (read(P.readme).match(/^\| \[`([\w.-]+)\/`\]\([\w.\/-]+\)/gm) ?? [])
  .map((row) => row.match(/\[`([\w.-]+)\/`\]/)[1])
  .filter((d) => workDirs.includes(d));
check('可运行 demo 作品（README 作品表列全 6）', 6, readmeWorks.length, `README 列出：${readmeWorks.join(', ')}`);

// D2 OTel span 判据：mock 契约 spanTotal vs 站内声明，且旧值「实测 11 spans」必须清零
const scenarioTs = read(path.join(ROOT, 'harness-demo', 'src', 'otel-mock-scenario.ts'));
check('OTel mock 判据 spanTotal = 15', 15, Number((scenarioTs.match(/spanTotal:\s*(\d+)/) ?? [])[1]), 'harness-demo/src/otel-mock-scenario.ts');
const staleSpan = grepRepo(/实测 11 spans/);
check('旧值残留：实测 11 spans', 0, staleSpan.length, staleSpan.map((f) => path.relative(ROOT, f)).join(', ') || '无');

// D3 幽灵事故时长：旧值 24 分钟清零、25 分钟在位
check('旧值残留：24 分钟', 0, grepRepo(/24 分钟/).length, '统一为 25 分钟（agent-harness.md）');
check('事故时长 25 分钟在位', true, grepRepo(/25 分钟/).length > 0, 'notes/agent-harness.md');

// D4 时间线截断：llm-history.ts 必须自带截断声明且末节点为 2025-01；nav.astro 须同步标注
const llmHistoryTs = read(path.join(ROOT, 'site', 'src', 'data', 'llm-history.ts'));
check('llm-history.ts 截断声明在位', true, /止于 2025-01/.test(llmHistoryTs), '防「被读成最新进展」');
check('llm-history.ts 末节点 = 2025-01', true, /date: '2025-01'/.test(llmHistoryTs), 'DeepSeek-R1');
check('nav.astro 同步截断标注', true, /止于 2025-01/.test(read(path.join(ROOT, 'site', 'src', 'pages', 'nav.astro'))), 'FAC-F1 波及点');

// D5 白板行数：旧值 ~150 行清零、178 行在位
check('旧值残留：白板 ~150 行', 0, grepRepo(/~150 行/).length, grepRepo(/~150 行/).map((f) => path.relative(ROOT, f)).join(', ') || '统一为 178 行');
check('白板 178 行在位', true, grepRepo(/178 行/).length > 0, 'whiteboard/agent_whiteboard.py');

// D6 recall@5 口径：README 与 rag.md 都必须写 0.44（HEAD 下可复现值；0.38/135 属脏工作区产物）
check('README recall@5 = 0.44', true, /@5[=: ]*0\.44|recall@5[ =:]*0\.44/.test(read(P.readme)), '脏工作区值 0.38 不得回灌');
check('rag.md recall@5 = 0.44', true, /@5[=: ]*0\.44|recall@5[ =:]*0\.44/.test(read(path.join(ROOT, 'notes', 'rag.md'))), 'rag.md §13 数字口径');

// D7 sitemap：手写 site/public/sitemap.xml 的 url 数必须等于站点 html 数（否则新增页面会静默漏收）
const sitemapXml = read(path.join(ROOT, 'site', 'public', 'sitemap.xml'));
check('sitemap url 数 = 站点 html', dec.siteHtml, (sitemapXml.match(/<url>/g) ?? []).length, 'site/public/sitemap.xml（手写，未装 @astrojs/sitemap）');

// D8 旧写法/旧引用残留（豁免词同句出现时不算残留——那是「主动说明已废弃」的正确用法）
const staleIBM = grepRepo(/SAP、IBM[^ ]/);
check('旧写法残留：SAP、IBM（应为 IBM Research）', 0, staleIBM.length, staleIBM.map((f) => path.relative(ROOT, f)).join(', ') || '无');
check('旧写法残留：MCP 四原语与四层防御', 0, grepRepo(/四原语与四层防御/).length, '已改为「MCP 的 Client/Server 特性」');
const exempt = /未入库|本机产物|本地跑|入库样本|demo\.example\.jsonl/;
const staleTraj = grepRepo(/trajectories\/demo\.jsonl/).filter((f) => {
  const t = fs.readFileSync(f, 'utf8');
  return !t.split('\n').some((l) => /trajectories\/demo\.jsonl/.test(l) && exempt.test(l));
});
check('旧引用残留：trajectories/demo.jsonl（未带豁免说明）', 0, staleTraj.length, staleTraj.map((f) => path.relative(ROOT, f)).join(', ') || '无（余下均为带「未入库/本机产物」说明的正确用法）');

// ── 4) 输出 ─────────────────────────────────────────────────────────────────────
const pad = (v, w) => String(v ?? '∅').padStart(w);
console.log('\n═══ 口径一致性门禁（notes/knowledge-map.md 计数口径块 vs 实数重算）═══\n');
console.log(`  ${'判据'.padEnd(26)} ${'声明'.padStart(6)} ${'重算'.padStart(6)}   结果`);
console.log(`  ${'─'.repeat(26)} ${'─'.repeat(6)} ${'─'.repeat(6)}   ────`);
for (const r of results) {
  console.log(
    `  ${r.name.padEnd(26)} ${pad(r.declared, 6)} ${pad(r.actual, 6)}   ${r.pass ? '✅' : '✖ 不符'}` +
      (r.note ? `\n      ↳ ${r.note}` : ''),
  );
}
console.log(`\n  ── 副本交叉核对（同一口径的其余手工副本必须与口径块一致）──`);
for (const c of copies) {
  console.log(`  ${c.pass ? '✅' : '✖ 副本不符'}  ${c.file}：${c.label}`);
  if (!c.pass) console.log(`      ↳ 实际匹配：${c.expect}`);
}

const failed = [...results.filter((r) => !r.pass), ...copies.filter((c) => !c.pass)];
console.log(
  `\n${failed.length === 0 ? '✅ 口径全部一致' : `✖ ${failed.length} 项口径失真`}` +
    `（判据 ${results.length} 条 + 副本 ${copies.length} 处）\n`,
);
if (failed.length) {
  console.log('  修法：口径块是唯一参照——先改 notes/knowledge-map.md 计数口径块，再同步下列副本：');
  console.log('        README.md / site/src/data/courses.ts 注释 / .github/workflows/verify.yml\n');
}
process.exit(failed.length ? 1 : 0);
