#!/usr/bin/env node
/**
 * check-classes.mjs —— 类集合门禁（纪律 #9 的可重跑版本）
 *
 * 【为什么存在】
 * CSS 选择器可以挂在**从未存在的祖先类**下而静默失效：类名一字之差（`.lf-count-note`
 * vs 页面实际输出的 `.lw-count-note`，见 `site/src/pages/learn.astro`）在浏览器里看不出
 * 任何异常——规则本来只调字号/颜色。这类缺陷**不会被「页面里有没有这个 class」抓住**，
 * 必须做集合比对：`CSS 定义的类集合 − 页面实际输出的类集合`。
 * 本脚本把 analysis/plan/03-form-layer.md §0.2 的一次性比对固化为每次构建都跑的门禁。
 *
 * 【输入面（必须读，防止门禁恒真）】
 *   · **定义集 = `site/src/**` 源码**（`*.css` 全文 + `.astro` 的内联 `<style>` 块）——
 *     这是唯一真源，与构建无关，**不读 site/dist**（dist 曾是 89 文件 / 0 HTML 的残骸，
 *     拿它当基准 ⇒ 输出集为空 ⇒ 门禁恒真。site/dist 既不作定义集也不作输出集）。
 *   · 输出集 = 「去掉 `<style>` 块后的 `site/src/**`」+ `notes/**\/*.md` + `site/public/**`
 *     —— 覆盖 Astro 模板字面量、`class:list`、以及 markdown 渲染产物里的类名，
 *     避免把**动态类名/渲染产物**误判为死选择器。
 *   · 输入面为空（`site/src` 不存在或没有 `.astro`）⇒ **exit 1**，拒绝宣告绿。
 *
 * 【三步收敛（缺一步都不成立），可用 --stage 复现中间态】
 *   ① strip   ：剥掉 CSS 注释 ⇒ 去掉注释里的通配写法伪差集（`.dc-` / `.ev-`）
 *   ② dynamic ：扫描器认识模板字面量里的动态类名前缀（`kind-${kind}`）⇒ 认可 `.kind-*`
 *   ③ whitelist：白名单（外部插件注入的类，本仓 CSS 里没有对应输出点）
 *   最终态（default）差集必须为 0。
 *
 * 【用法】
 *   node site/tools/check-classes.mjs                  # 门禁：差集非 0 ⇒ exit 1
 *   node site/tools/check-classes.mjs --self-test      # 负路径自证：注入死选择器必须被抓
 *                                                      # 抓到 ⇒ exit 1（本模式按设计返回非 0）
 *                                                      # 没抓到 ⇒ exit 2（断言器过弱，恒真）
 *   node site/tools/check-classes.mjs --stage=raw --expect=10     # 复现 03 §0.2 中间态
 *   node site/tools/check-classes.mjs --input-dir=/tmp/empty      # 输入面反例（必须 exit 1）
 *
 * 【写盘行为】本脚本**只读**：不写 site/tools/out，不写任何工作区文件，不建临时文件
 * （`--self-test` 也只在内存里注入，不改仓库文件）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(path.dirname(HERE)); // <root>/site/tools -> <root>

const argv = process.argv.slice(2);
const flag = (name, dflt = null) => {
  const hit = argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return dflt;
  if (hit.includes('=')) return hit.slice(hit.indexOf('=') + 1);
  const i = argv.indexOf(hit);
  return argv[i + 1] ?? dflt;
};
const HAS = (name) => argv.includes(`--${name}`);
const QUIET = HAS('quiet');
const SRC = path.resolve(flag('input-dir', path.join(ROOT, 'site', 'src')));
const STAGE = flag('stage', 'final');
const EXPECT = flag('expect', null);
const SELF_TEST = HAS('self-test');
const SELF_URL = fileURLToPath(import.meta.url);

const STAGES = ['raw', 'strip', 'dynamic', 'final'];
if (!STAGES.includes(STAGE)) {
  console.error(`check-classes: 未知 --stage=${STAGE}（可选 ${STAGES.join(' / ')}）`);
  process.exit(1);
}
const DO_STRIP = STAGE !== 'raw';
const DO_DYNAMIC = STAGE === 'dynamic' || STAGE === 'final';
const DO_WHITELIST = STAGE === 'final';
const REPLAY = HAS('replay-baseline');

// ── --replay-baseline 驱动：跨阶段复现 03 §0.2 的中间态 10 / 8 / 5 / 3 ─────────
// 为什么需要：本门禁与「清零 3 个真死选择器」是同一批动作（G0-5），清零后真源码里
// 复现不出基线数值；只有把已删的 3 条按原定义位置在内存里补回，才能证明扫描器实现
// 与 03 §0.2 基线**同源**，而不是把「已删的规则」与「从未存在的类」混为一谈。
if (REPLAY && !HAS('_replay-child')) {
  const expect = { raw: 10, strip: 8, dynamic: 5, final: 3 };
  console.log('check-classes --replay-baseline：把已删的 3 个真死选择器在**内存里**补回（不动仓库文件），');
  console.log('  复现 03 §0.2 的中间态：raw 不剥注释不认动态类 / strip 剥注释 / dynamic +认动态类 / final +白名单');
  let bad = 0;
  for (const s of STAGES) {
    const r = spawnSync(process.execPath, [SELF_URL, `--stage=${s}`, '--replay-baseline', '--_replay-child', '--quiet', `--expect=${expect[s]}`], { encoding: 'utf8' });
    const m = (r.stdout || '').match(/差集[）)]?: (\d+)/);
    const got = m ? Number(m[1]) : NaN;
    const ok = got === expect[s] && r.status === 0;
    if (!ok) bad += 1;
    console.log(`  ${ok ? '✅' : '❌'} stage=${s}: 差集 ${got}（03 §0.2 基线期望 ${expect[s]}）${ok ? '' : ` [exit=${r.status} ${(r.stderr || '').trim().split('\n').pop() || ''}]`}`);
  }
  console.log(bad === 0
    ? '\n✅ 基线同源：10 → 8 → 5 → 3 全部对上（与 03 §0.2 的中间态逐条一致）；清零后真源码的最终差集为 0'
    : `\n❌ 基线不同源：${bad}/${STAGES.length} 个阶段与 03 §0.2 基线不一致（扫描器实现与基线不是同一套）`);
  process.exit(bad === 0 ? 0 : 1);
}

// ── 白名单：外部插件在构建期注入的类（本仓 CSS 里定义了，但源码文本里永远不出现）──
// 失效检测：白名单项一旦「不再需要」（已出现在输出集，或已不在定义集）⇒ 报失效并 exit 1。
// 这条保证白名单不会退化成「全豁免」，也保证下一次差集不会被噪声淹没。
const WHITELIST = [
  { cls: 'astro-code', why: 'shiki 构建期注入 <pre class="astro-code astro-code-themes">（global.css 只剩样式定义）' },
  { cls: 'katex-display', why: 'rehype-katex 构建期注入（astro.config.mjs 管线）' },
];

// ── 工具函数 ────────────────────────────────────────────────────────────────
function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;

/** 剥 CSS 注释（/* ... *\/ 与行内 // 不剥——CSS 无 // 语义，剥了会误伤 url()）。 */
const stripCssComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');

const CLASS_TOKEN = /\.(-?[A-Za-z_][\w-]*)/g;
const STYLE_BLOCK = /<style[^>]*>([\s\S]*?)<\/style>/g;

// ── 输入面断言（空输入面必须 exit 1，否则门禁恒真）──────────────────────────
if (!fs.existsSync(SRC)) {
  console.error(`check-classes: ❌ 输入面不存在：${SRC}——输入面为空，拒绝宣告绿（exit 1）`);
  process.exit(1);
}
if (path.basename(SRC) === 'dist' || SRC.includes(`${path.sep}dist`)) {
  console.error(`check-classes: ❌ 输入面不得为构建产物 dist（${SRC}）——dist 可能是 0 HTML 的残骸，拿它当基准 ⇒ 门禁恒真`);
  process.exit(1);
}

const srcFiles = walk(SRC);
const astroFiles = srcFiles.filter((f) => f.endsWith('.astro'));
if (astroFiles.length === 0) {
  console.error(`check-classes: ❌ 输入面为空：${SRC} 下没有任何 .astro 文件——拒绝宣告绿（exit 1）`);
  process.exit(1);
}

// ── 定义集 ─────────────────────────────────────────────────────────────────
const defs = new Map(); // cls -> Map(file -> [lines])
const addDef = (cls, file, line) => {
  if (!defs.has(cls)) defs.set(cls, new Map());
  const byFile = defs.get(cls);
  if (!byFile.has(file)) byFile.set(file, []);
  byFile.get(file).push(line);
};
// baseLine：被扫文本在其**所属文件**里的起始行号（内联 <style> 块不是从文件第 1 行开始，
// 不补这个偏移就会报错行号——报错行号是门禁可用性的一半）。
const scanDefs = (text, file, baseLine = 1) => {
  const t = DO_STRIP ? stripCssComments(text) : text;
  for (const m of t.matchAll(CLASS_TOKEN)) addDef(m[1], file, baseLine + lineOf(t, m.index) - 1);
};

for (const f of srcFiles.filter((x) => x.endsWith('.css'))) scanDefs(fs.readFileSync(f, 'utf8'), f);
for (const f of astroFiles) {
  const t = fs.readFileSync(f, 'utf8');
  for (const s of t.matchAll(STYLE_BLOCK)) {
    const contentStart = s.index + s[0].indexOf('>') + 1;
    scanDefs(s[1], f, lineOf(t, contentStart));
  }
}

// --self-test：只在内存里注入一个「绝不出现」的死选择器（不改仓库文件）
const INJECTED = 'zzz-injected-dead-selector';
if (SELF_TEST) addDef(INJECTED, '(--self-test 内存注入)', 1);

// --replay-baseline：把 03 §0.2 基线里**后来被判真死并已删掉**的 3 个选择器按原定义位置
// 在内存里补回（不改仓库文件），用来复现「未清零时」的中间态 10 / 8 / 5 / 3。
// 意义：本门禁落地与「清零 3 个真死选择器」是同一批动作，事后跑真源码复现不出基线数值；
// 只有显式补回才能证明「扫描器实现与 03 §0.2 基线同源」，而不是把已删的规则当成了从未存在。
const BASELINE_DEAD = [
  { cls: 'details-entry', file: path.join(SRC, 'styles', 'global.css'), line: 732 },
  { cls: 'works-note', file: path.join(SRC, 'styles', 'global.css'), line: 725 },
  { cls: 'lf-count-note', file: path.join(SRC, 'pages', 'learn.astro'), line: 341 },
];
if (REPLAY) for (const d of BASELINE_DEAD) addDef(d.cls, `${d.file}（--replay-baseline 内存补回）`, d.line);

// ── 输出集（corpus）────────────────────────────────────────────────────────
// site/src：去掉 <style> 块后全文（模板/class:list/三元字面量都在这里）
// notes/**：markdown 原文（渲染后才会产生 class 的 markdown 语法也在此覆盖）
// site/public/**：静态资源（含 HTML）原文
let corpus = '';
const corpusFiles = [];
for (const f of srcFiles.filter((x) => !x.endsWith('.css'))) {
  let t = fs.readFileSync(f, 'utf8');
  if (f.endsWith('.astro')) t = t.replace(STYLE_BLOCK, '');
  corpus += t + '\n';
  corpusFiles.push(f);
}
for (const f of walk(path.join(ROOT, 'notes')).filter((x) => x.endsWith('.md'))) {
  corpus += fs.readFileSync(f, 'utf8') + '\n';
  corpusFiles.push(f);
}
for (const f of walk(path.join(ROOT, 'site', 'public'))) {
  corpus += fs.readFileSync(f, 'utf8') + '\n';
  corpusFiles.push(f);
}

const hasToken = (cls) => new RegExp(`(?<![\\w-])${cls.replace(/[-]/g, '\\-')}(?![\\w-])`).test(corpus);

// ── ② 动态类名前缀（模板字面量 `${}` 前的字面量片段）────────────────────────
const dynamicPrefixes = new Map(); // prefix -> [file]
if (DO_DYNAMIC) {
  for (const f of corpusFiles.filter((x) => /\.(astro|ts|tsx|js|mjs)$/.test(x))) {
    const t = fs.readFileSync(f, 'utf8');
    for (const tpl of t.matchAll(/`([^`]*)`/g)) {
      for (const m of tpl[1].matchAll(/([A-Za-z_][\w-]*?)\$\{/g)) {
        if (m[1].endsWith('-')) {
          if (!dynamicPrefixes.has(m[1])) dynamicPrefixes.set(m[1], []);
          dynamicPrefixes.get(m[1]).push(path.relative(ROOT, f));
        }
      }
    }
  }
}
const excusedByDynamic = [];

// ── 差集 ───────────────────────────────────────────────────────────────────
const dead = [];
for (const [cls, byFile] of [...defs].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (hasToken(cls)) continue;
  if (DO_DYNAMIC) {
    const pfx = [...dynamicPrefixes.keys()].find((p) => cls.startsWith(p));
    if (pfx) {
      excusedByDynamic.push({ cls, pfx });
      continue;
    }
  }
  const where = [...byFile].map(([f, lines]) => `${path.relative(ROOT, f)}:${lines[0]}`).join(', ');
  dead.push({ cls, where, raw: cls });
}

// ── ③ 白名单（含失效检测）─────────────────────────────────────────────────
const whitelistUsed = [];
const staleWhitelist = [];
for (const w of WHITELIST) {
  const defined = defs.has(w.cls);
  const inDiff = dead.some((d) => d.cls === w.cls);
  if (defined && inDiff) {
    if (DO_WHITELIST) whitelistUsed.push(w);
  } else if (DO_WHITELIST) {
    staleWhitelist.push({
      ...w,
      reason: !defined ? '白名单项已不在定义集（CSS 里已无此选择器）' : '白名单项已出现在输出集（不再是死选择器）',
    });
  }
}
const effectiveDead = DO_WHITELIST ? dead.filter((d) => !whitelistUsed.some((w) => w.cls === d.cls)) : dead;

// ── 报告 ───────────────────────────────────────────────────────────────────
const rel = (p) => path.relative(ROOT, p);
if (!QUIET) {
  console.log(`check-classes 输入面 = ${rel(SRC)}（读 site/dist？否——dist 既不作定义集也不作输出集）`);
  console.log(`  定义集: ${defs.size} 个类（来源：${srcFiles.filter((x) => x.endsWith('.css')).length} 个 css + ${astroFiles.length} 个 astro 的内联 <style>）`);
  console.log(`  输出集: ${corpusFiles.length} 个文件（去掉 <style> 后的 site/src + notes/**/*.md + site/public/**）`);
  console.log(`  阶段: ${STAGE}（剥注释=${DO_STRIP ? '是' : '否'} / 认动态类名=${DO_DYNAMIC ? '是' : '否'} / 白名单=${DO_WHITELIST ? '是' : '否'}${REPLAY ? ' / 基线复现=是' : ''}）`);
  if (DO_DYNAMIC) {
    console.log(`  动态类名前缀: ${[...dynamicPrefixes.entries()].map(([p, fs2]) => `${p}${'{…}'}（${fs2.length} 处）`).join(', ') || '（无）'}`);
    if (excusedByDynamic.length) console.log(`  动态类名认可 ${excusedByDynamic.length} 项: ${excusedByDynamic.map((e) => '.' + e.cls).join(', ')}`);
  }
  console.log('');
}
console.log(`=== CSS 定义、输出集里无此 token（差集）: ${effectiveDead.length} ===`);
for (const d of effectiveDead) console.log(`  .${d.cls}  <- ${d.where}`);

let exit = 0;
if (staleWhitelist.length) {
  console.error(`\n❌ 失效白名单项 ${staleWhitelist.length} 项（白名单必须随差集收敛而失效，否则会退化成全豁免）：`);
  for (const s of staleWhitelist) console.error(`  .${s.cls}  <- ${s.reason}`);
  exit = 1;
}
if (SELF_TEST) {
  const caught = effectiveDead.some((d) => d.cls === INJECTED);
  exit = caught ? 1 : 2; // 抓到 ⇒ 按设计红（exit 1）；没抓到 ⇒ 断言器过弱（exit 2 区分于「正常红」）
  console.log(caught
    ? `✅ --self-test：内存注入的 .${INJECTED} 已被告出（断言器有效；本模式按设计返回非 0）`
    : `❌ --self-test：内存注入的 .${INJECTED} **未被检出**——断言器过弱（恒真），必须修复`);
  process.exit(exit);
}
if (EXPECT !== null) {
  // 诊断模式（--expect=N / --replay-baseline 的子进程）：判据是「差集是否等于期望值」，
  // 差集非 0 本身不算失败——中间态本来就是非 0（03 §0.2 基线 10 / 8 / 5）。
  if (Number(EXPECT) !== effectiveDead.length) {
    console.error(`\n❌ --expect=${EXPECT} 与实际差集 ${effectiveDead.length} 不一致（扫描器实现与 03 §0.2 基线不同源）`);
    process.exit(1);
  }
  console.log(`✅ --expect=${EXPECT} 与实际差集一致（诊断模式）`);
  process.exit(exit);
}
if (exit === 0 && effectiveDead.length > 0) {
  console.error(`\n❌ 类集合门禁未通过：${effectiveDead.length} 个类「CSS 定义了但页面从不输出」（上方清单）——`);
  console.error('   这类选择器会静默失效（例如 .lf-count-note vs 页面实际的 .lw-count-note）。修法：删掉该死规则，或把页面输出改成它。');
  exit = 1;
}
if (exit === 0) {
  console.log(`\n✅ 类集合门禁通过：定义集 ${defs.size} / 差集 0 / 白名单 ${whitelistUsed.length} 项全部有效（${WHITELIST.map((w) => '.' + w.cls).join(', ')}）`);
}
process.exit(exit);
