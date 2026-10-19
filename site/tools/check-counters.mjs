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
/** D10 用：slug → status（在 courses.ts 解析块内赋值；块内声明会踩 ReferenceError，故上移） */
let courseStatusMap = {};
/** D10 用：15 个知识域笔记 slug（排除白板卡与 phase='—' 横向资产）；同上移防 ReferenceError */
let courseNoteSlugs = [];

/**
 * 登记一条判据。declared 与 actual 均为 null 表示该条无法解析（视为失败，避免门禁被静默绕过）。
 */
function check(name, declared, actual, note = '') {
  const pass = declared !== null && actual !== null && declared === actual;
  results.push({ name, declared, actual, pass, note });
}

/**
 * 内部历史：dated 工作日志 / 过程文档 / 审计归档。它们**不在站点渲染面**上，
 * 保留当时语境是可追溯性的一部分；handoff.md 另有一条正向判据（文首必须声明当前定位）。
 * 模块级声明（2026-10-19 从「重算」块内上移）：D9 旧值判据组也要用它排除归档目录，
 * 放在 if (!hardError) 块内时块外不可见（首次实现踩过，ReferenceError）。
 */
const HISTORY_FILES = [
  'handoff.md',
  'notes/process/',
  'reviews/',
  'analysis/',
  '.agent-teams/',
  // 根目录的历史审计 / 结构重组报告：记录的是 2026-10-14 当时的真实状态，
  // 与 reviews/ 同属归档（不得改写），故同样豁免。
  'notes-restructure-plan.md',
  'restructure-',
];
const isHistory = (rel) => HISTORY_FILES.some((h) => rel === h || rel.startsWith(h) || rel.includes(h));

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
    siteHtml: num(/站点 html\s*(\d+)/, '站点 html'),
  };
  // notes 顶层数与 EXCLUDED 条数由同一条算式给出：`notes 顶层 18 − knowledge-map`
  // （2026-10-19 去面试化：interview-bank.md 已删除，算式左端与被减数同步少 1）
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
    // D10 真源：slug → status 字面量（与 StatusBadge/status.ts 同源口径）
    courseStatusMap = Object.fromEntries(
      [...arr.matchAll(/slug: '([^']*)', domain: '[^']*', phase: '[^']*', status: '([^']*)'/g)].map((m) => [m[1], m[2]]),
    );
    courseNoteSlugs = [...arr.matchAll(/slug: '([^']*)', domain: '[^']*', phase: '([^']*)', status: '([^']*)'/g)]
      .map((m) => ({ slug: m[1], phase: m[2] }))
      .filter((e) => e.slug !== whiteboard && e.phase !== horizontal)
      .map((e) => e.slug);

    const exRaw = ts.match(/EXCLUDED_FROM_COURSE_ROUTE = new Set\(\[([^\]]*)\]\)/);
    if (!exRaw) {
      hardError = 'courses.ts 中未找到 EXCLUDED_FROM_COURSE_ROUTE';
    } else {
      act.excludedNames = [...exRaw[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
      act.excluded = act.excludedNames.length;
    }
  }

  // 2026-10-19 去面试化：练习题库（原 205 题）与题库页（原 37 题）已按产品决定整体移除，
  // 原「课内嵌题 / 题库精选」两条判据连同其解析代码一并删除（被计数的对象已不存在）。
  // 改为下面这条**反向守卫判据**：全仓不得再出现面试/题库痕迹，防回潮。

  // ══ 去面试化守卫（2026-10-19 新增，两条判据）═════════════════════════════════
  // 设计理由（第一性原理）：用户要的不是「面试这个词出现 0 次」，而是
  // 「站点呈现的内容不再是面试备考，且没有因此坏掉的死引用」。
  // 所以禁词只覆盖**用户面**（真正渲染给读者的东西），而**内部历史**（handoff.md /
  // notes/process/ / reviews/）允许出现该词——把 dated 日志里的词改掉等于伪造历史，
  // 一条「不改谎话就无法满足」的判据本身就是坏判据。
  //
  // 判据 A · 用户面残留 = 0：notes/*.md + notes/details/*.md + site/src/** + README/AGENTS
  //   + site/public/**（这些是站点渲染面）。允许「明确记述已移除」的句子。
  // 判据 B · 死引用 = 0：全仓活源码不得再指向已删除的 interview-bank.md / /interview/。
  //   允许记述「已删除」的句子，以及 §HISTORY 列出的内部历史文件。
  const DECOM_ALLOW = /已删|已移除|去面试化|已整体移除|一并移除|已随|不再含题库|已于 2026-10-19|原练习题库|当时的|已删除|作废|原落在/;
  // 2026-10-19 二扩：禁词表补「谈资 / 最常考 / 八股 / 备考」——去面试化第一轮只列了
  // 面试|题库|interview|JD 关键词，这四个面试化措辞当时整批漏改（framework-ecosystem /
  // llm-timeline / industry-2026 / details 索引页），且第二轮扫描面（见下）同样没覆盖。
  const DECOM_PAT = /面试|题库|interview|JD\s*关键词|谈资|最常考|八股|备考/;
  const DEAD_PAT = /interview-bank|\/interview\//;
  // HISTORY_FILES / isHistory 已上移到模块级（D9 旧值判据组复用，见上方声明处注释）。

  const walkSrc = (dir) => {
    if (!exists(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
      const full = path.join(dir, d.name);
      if (d.isDirectory()) return walkSrc(full);
      return /\.(astro|ts|mjs|css)$/.test(d.name) ? [full] : [];
    });
  };
  const scanLines = (files) => {
    const hits = [];
    for (const rel of files) {
      const abs = path.isAbsolute(rel) ? rel : path.join(ROOT, rel);
      if (!exists(abs)) continue;
      // 自排除：门禁自身（与其余 tools）源码里的禁词是「文档在描述这条禁令」，
      // 属元语言而非用户面残留。2026-10-19 复审补 site/tools/** 进扫描面时发现：
      // 不排除会把 check-counters.mjs 自己的注释判红（它必须能写出这些词才能描述禁令）。
      if (path.relative(ROOT, abs).startsWith('site/tools/')) continue;
      read(abs).split('\n').forEach((L, i) => {
        if (DECOM_PAT.test(L) && !DECOM_ALLOW.test(L)) hits.push(`${rel}:${i + 1}: ${L.trim().slice(0, 80)}`);
      });
    }
    return hits;
  };

  // 判据 A 的输入面 = 站点渲染面
  // 2026-10-19 二扩：补 7 个 demo 的 src/ 目录注释。去面试化第一轮修了 11 处 demo
  // 源码注释（harness-demo/src/{tools,test-compact,policy,context,llm}.ts、
  // rag-demo/src/{corpus,bm25,evaluate,demo-bm25}.ts、sandbox-demo/src/policy.ts、
  // mcp-demo/src/defense.ts、memory-redteam/src/demo.mjs），但扫描面只含 site/src，
  // 修完无判据守着——与 P1「手抄副本不在门禁内」同根因。
  const DEMO_SRC_DIRS = [
    'harness-demo/src', 'rag-demo/src', 'sandbox-demo/src', 'mcp-demo/src',
    'durable-execution-demo/src', 'framework-demo/src', 'memory-redteam/src',
    // 2026-10-19 复审补：mvps.ts:13-17 声明这四个 demo 的产出被课程引用，属用户面
    'api-demo/src', 'flywheel-demo/src', 'model-basics-demo/src', 'my-agent/src',
  ];
  const SURFACE_FILES = [
    ...mdFiles(P.notesDir).map((f) => path.join('notes', f)),
    ...mdFiles(path.join(ROOT, 'notes', 'details')).map((f) => path.join('notes', 'details', f)),
    ...['README.md', 'AGENTS.md'].filter((f) => exists(path.join(ROOT, f))),
    ...walkSrc(path.join(ROOT, 'site', 'src')),
    // 2026-10-19 复审补：demo 的 README.md 是 GitHub 上直接渲染的用户面，此前整批逃网
    //（memory-redteam / rag-demo / mcp-demo 三家 README 的面试化与题目残留，
    //  都是这么漏过判据 A 的）；site/tools/** 同补（其 README 的死引用写法绕过了判据 B）
    //（site/tools/README.md 的 /interview/ 字样双逃守卫：判据 B 要字面 "/interview/"，
    //  而该文件写作 "/ `interview/`"）。
    ...DEMO_SRC_DIRS.map((d) => path.join(ROOT, d, '..', 'README.md')).filter((f) => exists(f)),
    ...walkSrc(path.join(ROOT, 'site', 'tools')),
    ...DEMO_SRC_DIRS.filter((d) => exists(path.join(ROOT, d))).flatMap((d) => walkSrc(path.join(ROOT, d))),
    ...['site/public/sitemap.xml', 'site/public/robots.txt'].filter((f) => exists(path.join(ROOT, f))),
  ];
  act.surfaceResidue = scanLines(SURFACE_FILES);
  act.surfaceSample = act.surfaceResidue.slice(0, 8);

  // 判据 B 的输入面 = 全仓活源码（.md/.astro/.ts/.mjs/.css/.yml/.json/.xml/.txt），排除内部历史
  const walkAll = (dir, out = []) => {
    if (!exists(dir)) return out;
    for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
      if (d.name === 'node_modules' || d.name === '.git' || d.name === 'dist') continue;
      // 2026-10-19 复审：session-audit/ 是 DSH 会话运行时的审计流水（git 未跟踪，
      // CI 干净检出里根本没有）。不跳过时，历史会话记录里出现过的旧措辞会把本判据判红
      // ——本机与 CI 扫到不同文件集，正是「门禁不 hermetic」的一处实证。
      if (d.name === 'session-audit') continue;
      const full = path.join(dir, d.name);
      const rel = path.relative(ROOT, full);
      if (d.isDirectory()) { walkAll(full, out); continue; }
      if (!/\.(md|astro|ts|mjs|css|yml|yaml|json|xml|txt)$/.test(d.name)) continue;
      if (isHistory(rel)) continue;
      out.push(rel);
    }
    return out;
  };
  const deadHits = [];
  // SELF：本文件自己的正则字面量不得判自己（本会话早期已因同类自匹配产出过假阳性）。
  // 注：SELF 常量在文件后半段才声明，故此处用同一表达式就地求值，不改声明位置。
  const SELF_REL = path.relative(ROOT, fileURLToPath(import.meta.url));
  for (const rel of walkAll(ROOT)) {
    if (rel === SELF_REL) continue;
    const abs = path.join(ROOT, rel);
    read(abs).split('\n').forEach((L, i) => {
      if (DEAD_PAT.test(L) && !DECOM_ALLOW.test(L)) deadHits.push(`${rel}:${i + 1}: ${L.trim().slice(0, 80)}`);
    });
  }
  act.deadRefs = deadHits;
  act.deadRefSample = deadHits.slice(0, 8);

  // 判据 C（正向）：handoff.md 文首必须声明当前定位——否则读者从历史条目读入会重新激活旧定位。
  const handoff = path.join(ROOT, 'handoff.md');
  if (exists(handoff)) {
    // 要求声明出现在**第一个 `## ` 标题之前**——即读者进入任何历史条目之前先看到当前定位。
    // 不用固定字符窗口（声明位置随前文增减而漂移，窗口法是脆的）。
    const txt = read(handoff);
    const firstH2 = txt.search(/^## /m);
    const head = firstH2 === -1 ? txt : txt.slice(0, firstH2);
    act.handoffNotice = /当前定位（2026-10-19 更新，以此为准）/.test(head) ? 1 : 0;
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
const TEXT_EXT = new Set(['.md', '.astro', '.ts', '.mjs', '.js', '.json', '.yml', '.yaml', '.sh', '.txt', '.xml', '.py']);
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
  'whiteboard', // 2026-10-19 复审补：白板是课程资产（works/map 渲染），此前整目录在扫描面外
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

// D6 recall@5 口径（2026-10-19 外部对标轮改判据：写死值 → 派生值）
//
// 原判据写死「README 与 rag.md 都必须写 0.44」，理由注的是「0.38/135 属脏工作区产物」。
// 它违反本文件头【设计约束】2「脚本内不硬编码任何计数」——且 0.44 只是 2026-10-19
// 去面试化那一次的干净树实测值，**语料一改它就失效**：本次 agent-harness.md 新增 §3.4
// （工具发现）后，语料 125→134 chunks，干净树实跑 recall@5 = 0.38 / recall@10 = 0.56
// （三语料成员与 HEAD 逐字一致后复跑，见 notes/rag.md §13 三度复跑对照）。
//
// 改为**派生**：从 notes/rag.md §13 解析 recall 三值组（与 site/src/utils/ragStats.ts
// 同一定位方式：整组匹配，避免命中 §13 内的作废旧值叙述），再断言 README 与 rag.md
// 都含该现值。证伪能力不减反增——原判据只抓「README 写 0.38」这一种漂移，
// 现判据抓「README 与真源任意不一致」。
//
// 「声明值 = 干净树实跑值」这条**不由本脚本保**（它跑不了语料生成器），
// 由 rag-demo 的 check:corpus 保——2026-10-19 同轮升级为真跑一遍评测、逐项比对。
const ragNote = read(path.join(ROOT, 'notes', 'rag.md'));
const ragSec13 = (() => {
  const m = /^##\s*13\b[^\n]*$/m.exec(ragNote);
  if (!m) return '';
  const rest = ragNote.slice(m.index + m[0].length);
  const next = /^##\s/m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
})();
const ragRecall = /recall@3\s*=\s*([0-9.]+)\s*\/\s*recall@5\s*=\s*([0-9.]+)\s*\/\s*recall@10\s*=\s*([0-9.]+)/.exec(ragSec13);
check('rag.md §13 recall 三值组可解析', true, !!ragRecall, 'parseRagStats 同款整组正则；解析不到说明 §13 结构已变，站点构建会先炸');
if (ragRecall) {
  const r5 = ragRecall[2];
  const r5re = new RegExp(`@5[=: ]*${r5.replace('.', '\\.')}|recall@5[ =:]*${r5.replace('.', '\\.')}`);
  check('README recall@5 = rag.md §13 真源', true, r5re.test(read(P.readme)), `真源现值 recall@5 = ${r5}（三值组 ${ragRecall[1]}/${r5}/${ragRecall[3]}）`);
  check('rag.md recall@5 = §13 真源', true, r5re.test(ragNote), `§13 现值 recall@5 = ${r5}`);
}

// D7 sitemap：手写 site/public/sitemap.xml 的 url 数必须等于站点 html 数 − 1（404.html 不是内容页）
// 2026-10-19 改判据：原判据「= 站点 html」把 404.html 收进 sitemap 这个坏做法钉成了门禁
// （404 进 sitemap 只会让爬虫收录一个 HTTP 404 响应；现已在 404.astro 加 noindex 双保险）。
const sitemapXml = read(path.join(ROOT, 'site', 'public', 'sitemap.xml'));
check('sitemap url 数 = 站点 html − 1', dec.siteHtml - 1, (sitemapXml.match(/<url>/g) ?? []).length, 'site/public/sitemap.xml（手写，未装 @astrojs/sitemap；404.html 不入表）');
check('sitemap 不含 404.html', true, !/<loc>[^<]*404\.html/.test(sitemapXml), '防回潮：404 不是内容页（注释里的记述不算）');
check('去面试化 A：站点渲染面不得残留 面试/题库/interview', 0, act.surfaceResidue.length, `命中 ${act.surfaceResidue.length} 处（样例：${act.surfaceSample.join(' ｜ ') || '无'}）`);
check('去面试化 B：活源码不得残留指向已删文件/页的死引用', 0, act.deadRefs.length, `命中 ${act.deadRefs.length} 处（样例：${act.deadRefSample.join(' ｜ ') || '无'}）`);
check('handoff.md 在首个 ## 标题前声明当前定位', 1, act.handoffNotice ?? 0, 'handoff.md 第一个 `## ` 标题之前须含「当前定位（2026-10-19 更新，以此为准）」——防读者从历史日志读入已作废的面试定位');

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

// ── D9 判据组（2026-10-19 修复轮二）───────────────────────────────────────────
// 背景：本轮审出「3 类漂移全部逃过绿门禁」——站点 html 33（真值 32）、白板 ~180 行
// （真值 178）、rag 132 chunks（真值 123）。共同根因 = 修的是**显示值**、没有判据守着，
// 下次任何人生成/手改都会静默回退（纪律 #5：修显示值不如修生成器/判据）。
// 纪律同 D1–D8：只增约束、不放宽既有判据。
// 旧值判据一律**行级**且豁免两类句子：① 记述本次更正的句子（改旧值=删历史=伪造）；
// ② 带日期的记录行（「2026-10-14 实测 33 page(s)」这类现场记录）。另把 notes/process/、
// reviews/、analysis/ 三个 dated 归档目录整体排除（与去面试化守卫的 HISTORY_FILES 同口径）。
// 一条「不改谎话就无法满足」的判据是坏判据。
const HIST_ALLOW = /原写|原为|原值|当时|曾|历史|已改|改为|更正|漂移|统一|形如|正则|旧值|此前|先前|之前|沿革|旧「|复测|实测|\d{4}-\d{2}-\d{2}/;
const grepLines = (re) => {
  const out = [];
  for (const f of scanFiles) {
    if (isHistory(path.relative(ROOT, f))) continue;
    fs.readFileSync(f, 'utf8').split('\n').forEach((L, i) => {
      if (re.test(L) && !HIST_ALLOW.test(L)) out.push(`${path.relative(ROOT, f)}:${i + 1}`);
    });
  }
  return out;
};

// D9.1 站点 html 旧值 33 清零（现行 32；沿革段/复测记录已豁免）
// 2026-10-19 复审扩形态：原枚举只有 5 种写法，「33 页 / 33 个页面 / HTML 33」这类同义
// 表述漏网——site/tools/README.md:12 的「33 页中的 10 条清单」就是这么活着逃过旧值扫描的。
const stale33 = grepLines(/33\s*个?\s*(html|页面|页|静态页)|(html|HTML|页面|页)\s*33|HTML=33|33 page/i);
check('旧值残留：站点 html 33', 0, stale33.length, stale33.slice(0, 4).join(' ') || '无（沿革段豁免）');

// D9.2 白板行数：~180 清零（178 在位由 D5 守着）
check('旧值残留：白板 ~180 行', 0, grepLines(/~180 行/).length, grepLines(/~180 行/).slice(0, 4).join(' ') || '无（沿革段豁免）');

// D9.3 rag 语料 chunk 数：132 清零、123 在位（parseRagStats 的形如示例行已豁免）
check('旧值残留：rag 132 chunks', 0, grepLines(/132[- ]?chunks?/i).length, grepLines(/132[- ]?chunks?/i).slice(0, 4).join(' ') || '无（形如示例/沿革豁免）');
check('rag 125 chunks 在位', true, /125 chunks/.test(read(path.join(ROOT, 'notes', 'rag.md'))), 'notes/rag.md §13 语料行（唯一真源，构建期由 ragStats.ts 解析；全副本扫描见 rag-demo/src/check-corpus.ts）');

// D9.4 durable-execution 行数：821 清零、831 在位
check('旧值残留：durable 821 行', 0, grepLines(/821 行/).length, grepLines(/821 行/).slice(0, 4).join(' ') || '无');
check('durable 831 行在位', true, grepRepo(/831 行/).length > 0, 'notes/durable-execution.md');

// D9.5 demo 源码目录文件数（结构判据：漂移过的两个目录）
// 2026-10-19 复审：声明值改为从 knowledge-map 资产表派生（原 16/9 硬编码在脚本里，
// 违背本文件头 :18「脚本内不硬编码任何计数」——那把「改错能否被抓住」变成「改脚本才算数」）。
const srcFileCount = (d) => (exists(path.join(ROOT, d)) ? fs.readdirSync(path.join(ROOT, d)).filter((f) => /\.(ts|mjs|js|tsx)$/.test(f)).length : 0);
const assetTable = read(P.knowledgeMap);
const claimNum = (re) => Number((assetTable.match(re) ?? [])[1] ?? NaN);
const wbClaim = claimNum(/agent_whiteboard\.py`[（(](\d+) 行/);
const ragSrcClaim = claimNum(/rag-demo\/\`[（(](\d+) 文件/);
const mrSrcClaim = claimNum(/memory-redteam\/\`[（(](\d+) src/);
check('rag-demo src 文件 = 资产表声明', ragSrcClaim, srcFileCount('rag-demo/src'), 'knowledge-map 资产表声明 vs 实测（2026-10-19 修复轮修正：README 写 15）');
check('memory-redteam src 文件 = 资产表声明', mrSrcClaim, srcFileCount('memory-redteam/src'), 'knowledge-map 资产表声明 vs 实测');

// D12（2026-10-19 复审新增）：**行数重算**判据——此前 D5/D9.4 只验「178 行/831 行」
// 字符串在场 + 旧值不在，从不重算：白板文件自述「~150 行」而实际 178 行，门禁全绿
// （whiteboard/ 不在扫描面、TEXT_EXT 不含 .py，双重遗漏）。现在按 wc -l 实算，
// 声明值仍从 knowledge-map 资产表读（不硬编码）。
const lineCount = (f) => (exists(f) ? read(f).split('\n').length - 1 : NaN);
const wbActual = lineCount(path.join(ROOT, 'whiteboard', 'agent_whiteboard.py'));
const durableClaim = claimNum(/durable-execution-demo\/\`[（(]9 src 文件\/(\d+) 行/);
const durableActual = (() => {
  const d = path.join(ROOT, 'durable-execution-demo', 'src');
  if (!exists(d)) return NaN;
  return fs.readdirSync(d).filter((f) => /\.(ts|mjs|js|tsx)$/.test(f))
    .reduce((n, f) => n + lineCount(path.join(d, f)), 0);
})();
check('白板行数 = 资产表声明', wbClaim, wbActual, `whiteboard/agent_whiteboard.py 实测 ${wbActual} 行（资产表声明 ${wbClaim}）`);
check('durable src 行数 = 资产表声明', durableClaim, durableActual, `durable-execution-demo/src 实测 ${durableActual} 行（资产表声明 ${durableClaim}）`);
check('durable src 文件数 = 9', 9, exists(path.join(ROOT, 'durable-execution-demo', 'src')) ? fs.readdirSync(path.join(ROOT, 'durable-execution-demo', 'src')).filter((f) => /\.(ts|mjs|js|tsx)$/.test(f)).length : 0, '资产表声明 9 src 文件');

// D9.6 StatusBadge 判定同源：三处（StatusBadge / learn.astro / DomainMap.astro）必须共用
// utils/status.ts 的 statusKey——本轮事故：StatusBadge 用 includes('完成')/includes('进行')
// 中文子串判定，而 12 门课状态串是「🔄 讲义已展开」，全落灰色徽标（同站三色）。
const statusBadge = read(path.join(ROOT, 'site', 'src', 'components', 'StatusBadge.astro'));
check('StatusBadge 判定同源 utils/status.ts', true,
  /from '\.\.\/utils\/status'/.test(statusBadge) && !/includes\('完成'\)/.test(statusBadge),
  'StatusBadge.astro 必须 import statusKey 且不得本地 includes 中文子串');
for (const [f, label] of [
  ['site/src/pages/learn.astro', 'learn.astro'],
  ['site/src/components/DomainMap.astro', 'DomainMap.astro'],
]) {
  const src = read(path.join(ROOT, f));
  check(`${label} 状态判定同源 utils/status.ts`, true,
    /from '\.\.\/(\.\.\/)?utils\/status'/.test(src) && !/function statusKey\(/.test(src),
    '不得再本地定义 statusKey');
}

// D9.7 visual-check 页数副本：PAGES 数组长度 vs README / verify.yml 的镜像文案
// （2026-10-19 查出：脚本侧 9 页早已改对，README 与 verify.yml 两处镜像还写 10 页/30 组合）
const vcSrc = read(path.join(ROOT, 'site', 'tools', 'visual-check.mjs'));
// 只数 PAGES 数组块内的条目——文件里还有其他 `{ path:` 形态的对象（fault/视口描述），
// 全文正则会把它们一起数进来（本轮首次实现就踩了这个坑：全文 17 vs 数组内 9）。
const pagesBlock = (vcSrc.match(/const PAGES = \[([\s\S]*?)\n\];/) ?? [])[1] ?? '';
const pagesCount = (pagesBlock.match(/\{ path:/g) ?? []).length;
check('visual-check 页数 = 9', 9, pagesCount, 'site/tools/visual-check.mjs PAGES（权威来源）');
check('README 镜像「9 页 / 27 组合」', true, /9 页/.test(read(P.readme)) && /27 组合/.test(read(P.readme)), 'README.md 站点回归段');
check('verify.yml 镜像「9 条页面清单 / 27 组合」', true, /9 条页面清单/.test(read(P.verifyYml)) && /27 组合/.test(read(P.verifyYml)), '.github/workflows/verify.yml 头注');

// D9.8 details↔课程双向链接：related frontmatter 与渲染端都在位
// （渐进披露最大真实缺口：本地映射曾是纯文本、课程页无任何反向链接）
const detailsDir = path.join(ROOT, 'notes', 'details');
const detailFiles = exists(detailsDir) ? fs.readdirSync(detailsDir).filter((f) => f.endsWith('.md')) : [];
const withRelated = detailFiles.filter((f) => /^related:/m.test(fs.readFileSync(path.join(detailsDir, f), 'utf8')));
check('details 篇目均带 related', detailFiles.length, withRelated.length, `notes/details/*.md（${detailFiles.length} 篇）`);
check('c/[slug] 渲染延伸分水岭', true, /relatedDetails/.test(read(path.join(ROOT, 'site', 'src', 'pages', 'c', '[slug].astro'))), '课程页反查格');
check('details/[slug] 渲染相关课程', true, /relatedCourses/.test(read(path.join(ROOT, 'site', 'src', 'pages', 'details', '[slug].astro'))), '详解页正查 chips');

// ── D10 判据组（2026-10-19 复审新增）：笔记头部状态记号 vs courses.ts ──────────
// 背景：复审发现「三态记号统一」只统一到 knowledge-map 口径块与 handoff:119 的声明，
// 而 11 个课程笔记的头部状态行仍用已退役记号（📐 ×9、📖 ×2）、handoff §4.1 表格 12 行
// 仍标 📐、3 篇（agent-harness / harness-from-scratch / rag）干脆没有状态行、
// evaluation.md 标 ✅ 而 courses.ts 是 🔄——同一门课在笔记里读作「结构建成未开」、
// 在 /learn/ 读作「讲义已展开」，与首轮修的「12 门课灰徽标」同属「同站多色」复发。
// 纪律 #5：加判据守着，不只改显示值。首轮只修了站点侧，没管笔记自己的头部行。
// 判据：① 15 个知识域笔记头部（前 6 行含「状态」的行）不得出现已退役记号；
//       ② 该行必须出现现行三态记号，且与 courses.ts 同 slug 的 status 前缀一致；
//       ③ handoff §4.1 表格行同样校验（表格是活表格，dated 归档段不在此范围）。
// 范围说明：白板卡与两个横向资产（llm-timeline / industry-2026，phase='—'）不设判据——
// 它们的头部是「参考素材」式描述而非三态状态，强行套记号会制造第二套假真源。
const RETIRED_MARKERS = /📐|📖|⚪|🔶/;
const NOW_MARKERS = ['✅', '🔄', '⏳'];
const notesDir = path.join(ROOT, 'notes');
const noteStatusLines = mdFiles(notesDir)
  .filter((f) => f !== 'knowledge-map.md' && courseNoteSlugs.includes(f.replace(/\.md$/, '')))
  .map((f) => path.join(notesDir, f));
const markerMismatch = [];
const retiredInNotes = [];
for (const f of noteStatusLines) {
  const slug = path.basename(f, '.md');
  const want = courseStatusMap[slug];
  if (!want) continue; // 非课程笔记（llm-timeline / industry-2026 / 横向资产）不设判据
  const head = read(f).split('\n').slice(0, 6).filter((L) => L.includes('状态'));
  if (head.length === 0) {
    markerMismatch.push(`${path.relative(ROOT, f)}：头部无状态行（courses.ts = ${want}）`);
    continue;
  }
  const line = head[0];
  if (RETIRED_MARKERS.test(line)) {
    retiredInNotes.push(`${path.relative(ROOT, f)}：${line.trim().slice(0, 40)}`);
    continue;
  }
  const hit = NOW_MARKERS.find((m) => line.includes(m));
  if (!hit || !want.startsWith(hit)) markerMismatch.push(`${path.relative(ROOT, f)}：笔记「${hit ?? '无记号'}」vs courses.ts「${want}」`);
}
// 2026-10-19 复审（B3）：恒真路径封堵。此前 courseStatusMap 解析不到条目时，
// 下面两个循环全 continue → 空输入即通过，note 还打印「N 个顶层笔记逐个对齐」——
// 实测把 courses.ts 的 status/phase 换序，匹配数 18→0、判据仍全绿。
// 现在把「解析面本身」也变成判据：笔记集合为空、map 为空、或解析出的课程数
// 与 courses.ts 的 slug 数不符，一律红。
check('D10 解析面有效（courses.ts 条目可解析）', 18, Object.keys(courseStatusMap).length, '属性换序/改名导致匹配 0 时必须红（防恒真）');
check('D10 笔记集合非空', true, noteStatusLines.length >= 15, `实际 ${noteStatusLines.length} 个知识域笔记进入校验`);
check('笔记头部无退役记号', 0, retiredInNotes.length, retiredInNotes.join('；') || '📐/📖/⚪/🔶 已清零');
check('笔记头部记号与 courses.ts 一致', 0, markerMismatch.length, markerMismatch.slice(0, 3).join('；') || `${noteStatusLines.length} 个顶层笔记逐个对齐`);

// handoff §4.1 活表格（HISTORY_FILES 豁免的是 dated 记录段，§4.1 是活表格，单独校验）
const handoffSrc = read(path.join(ROOT, 'handoff.md'));
const sec41 = handoffSrc.slice(handoffSrc.indexOf('### 4.1'), handoffSrc.indexOf('### 4.2'));
const tableRows = sec41.split('\n').filter((L) => /^\| \d+ \|/.test(L));
const handoffMismatch = tableRows
  .map((L) => {
    const cells = L.split('|').map((c) => c.trim());
    const slug = (cells[2].match(/`([\w-]+)\.md`/) ?? [])[1];
    const want = courseStatusMap[slug];
    if (!want) return null;
    const hit = NOW_MARKERS.find((m) => cells[4].includes(m));
    return hit && want.startsWith(hit) ? null : `handoff §4.1 第 ${cells[1]} 行「${cells[4].slice(0, 24)}」vs「${want}」`;
  })
  .filter(Boolean);
// 同 B3：§4.1 标题改名/表格清空时 tableRows 为空 → 判据空转。封堵：行数为 0 即红。
check('D10 handoff §4.1 表格行可解析', true, tableRows.length > 0, `实际 ${tableRows.length} 行进校验（0 行必须红）`);
check('handoff §4.1 记号与 courses.ts 一致', 0, handoffMismatch.length, handoffMismatch.slice(0, 3).join('；') || `${tableRows.length} 行逐个对齐`);

// ── D11 判据组（2026-10-19 复审新增）：内容面相对 .md 链接完整性 ─────────────────
// 背景：复审时全仓扫相对链接，282 处「断链」绝大多数在 node_modules（第三方 README，
// 与我们无关），但内容面 33 条里真有 2 条死引用，且都出在本轮自己的交付物上：
//   · reviews/2026-10-19/02 报告 → ../details/01-context-rot.md（少跳一级目录）
//   · reviews/2026-10-19/FIX-CHARTER:3 → 00-综述与整改建议.md（该文件在 2026-10-18/）
// 去面试化守卫的判据 B 只查「指向已删除的 interview-bank / /interview/」这一类死引用，
// 管不到普通路径写错。知识库的交叉引用是它最重要的导航面，故补这条机器判据。
// 豁免与 D9 同思路，但**只吃 LINK_ALLOW 一套**，刻意不吃 isHistory 与 HIST_ALLOW：
//   ① isHistory 把 reviews/ 整目录排除——而死链接恰恰出在本轮自己的报告里（02 报告
//      少跳一级、FIX-CHARTER 指错目录），排除掉等于把判最主要的对象排除掉；
//   ② HIST_ALLOW 含「任意日期」豁免（为放过「2026-10-14 实测 33 page(s)」这类记录），
//      而报告行几乎都带日期——套用它会把所有断链一起放过去（实测：注入的死链被日期豁免吞掉）。
//   链接完整性不受「保留历史语境」保护：路径写错就是写错，读者点过去就是 404。
// 注意：DECOM_ALLOW 声明在去面试化守卫的 if 块内（块作用域），此处不可见——
// 本文件 line 69-71 的教训（块内声明块外用 = ReferenceError）在这里第二次差点踩上，
// 故 D11 自带一份同口径的正则，不去动别人的作用域。
const LINK_ALLOW = /已删|已移除|去面试化|已整体移除|不再含题库|已删除/;
const LINK_ROOTS = ['notes', 'reviews', 'README.md', 'handoff.md', 'AGENTS.md'].map((r) => path.join(ROOT, r));
const linkFiles = [];
for (const r of LINK_ROOTS) {
  if (!exists(r)) continue;
  if (fs.statSync(r).isDirectory()) linkFiles.push(...walkText(r));
  else linkFiles.push(r);
}
const deadLinks = [];
for (const f of linkFiles) {
  const rel = path.relative(ROOT, f);
  read(f).split('\n').forEach((L, i) => {
    for (const m of L.matchAll(/\]\(([^)#]+\.md)(#[^)]*)?\)/g)) {
      const t = m[1];
      if (/^(https?:|mailto:|#)/.test(t)) continue;
      if (LINK_ALLOW.test(L)) continue; // 记述删除本身的句子不是死引用
      if (!exists(path.resolve(path.dirname(f), t))) deadLinks.push(`${rel}:${i + 1} → ${t}`);
    }
  });
}
check('内容面相对 md 链接无死引用', 0, deadLinks.length, deadLinks.slice(0, 3).join('；') || `${linkFiles.length} 个文件内链接全部落地`);

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
