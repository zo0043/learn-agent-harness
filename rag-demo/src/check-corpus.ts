/**
 * 语料 chunk 数守卫（2026-10-19 新增；同日升级为**全副本扫描**）。
 *
 * 背景：这个数在本仓**漂移过两次**（85 → 132 → 123），每次都因为「删/增 notes 小节后
 * 声明值没同步」。而它有 **7 处副本**：notes/rag.md §13（唯一真源）/
 * notes/evaluation.md / notes/long-term-memory.md / notes/knowledge-map.md 口径块 /
 * site/src/data/course-structure.ts / site/src/data/mvps.ts / site/src/data/courses.ts /
 * rag-demo/README.md / README.md。
 *
 * 2026-10-19 升级理由（第一版只校验真源，仍留 P1 根因）：check-counters 的口径门禁
 * 覆盖不到这个数（它不在 knowledge-map 计数口径块里），而第一版 check-corpus 只比对
 * 「rag.md §13 声明值 vs 实际语料」——**其余 7 处副本照旧可以漂移**（本轮就实测到
 * courses.ts 写 132 而 rag.md 已改 123 的漂移活例）。故升级为：真源 + 全部副本逐份
 * 校验，副本里出现任何非实际值的 chunk 数即 exit 1。
 *
 * notes/rag.md §13 是**唯一真源**（site/src/utils/ragStats.ts 构建期解析它并在站点上显示），
 * 本脚本把「声明值」与「实际语料」对上，不一致即 exit 1——让漂移在 CI 就暴露，
 * 而不是等读者发现站点显示的数字对不上。
 *
 * 放在 rag-demo 旁边（而不是 site/tools/）是因为只有这里能 import 语料生成器；
 * CI 侧由 .github/workflows/verify.yml 增加一步 `cd rag-demo && npm ci && npm run check:corpus`。
 *
 * 有意不进副本清单：site/src/utils/ragStats.ts——它的解析器注释与错误信息里带有
 * 「形如 … → N chunks」的格式示例（示例数字早已过时），属**代码文档**而非声明值；
 * 门禁侧（check-counters.mjs 的旧值判据）对「形如/正则」行有同样豁免。
 */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { loadCorpus } from "./corpus.js";

const ROOT = new URL("../..", import.meta.url);
const at = (rel: string) => new URL(rel, ROOT);
const readRel = (rel: string) => readFileSync(at(rel), "utf8");

// ── 1) 真源：notes/rag.md §13 的「语料 … → N chunks」 ──────────────────────────
const note = readRel("notes/rag.md");
// 与 ragStats.ts 同一定位方式：「语料 … → N chunks」
const declared = /语料[^\n]*?→\s*(\d+)\s*chunks/.exec(note)?.[1];
if (declared === undefined) {
  console.error('check-corpus ❌ notes/rag.md §13 找不到「语料 … → N chunks」——声明行被改动或删除');
  process.exit(1);
}
const declaredN = Number(declared);

// ── 2) 实际值：语料生成器 ─────────────────────────────────────────────────────
const actualN = loadCorpus().length;

if (declaredN !== actualN) {
  console.error(
    `check-corpus ❌ 声明 ≠ 实际：notes/rag.md §13 写 ${declaredN} chunks，实际语料 ${actualN} chunks。\n` +
      `  修法（唯一真源优先）：先改 notes/rag.md §13 的「→ ${actualN} chunks」，再同步其余副本。`,
  );
  process.exit(1);
}

// ── 3) 全副本扫描（2026-10-19 升级）────────────────────────────────────────────
// 每份副本必须：① 至少出现一次**活声明**的 `<N> chunks` ② 活声明的每个 chunk 数都等于实际值。
//
// 副本清单（rag.md 真源之外的全部 8 处手抄）：
const REPLICAS = [
  "notes/evaluation.md",
  "notes/long-term-memory.md",
  "notes/knowledge-map.md",
  "site/src/data/course-structure.ts",
  "site/src/data/mvps.ts",
  "site/src/data/courses.ts",
  "rag-demo/README.md",
  "README.md",
];
//
// 「活声明」的界定（踩过坑后定的）：同一个句段里常同时出现现值与旧值记录
// （rag-demo/README.md:「语料 125 chunks。旧宣称值 recall@3=1.00 …（85 chunks）出自…」）。
// 行级豁免会连活声明一起放过（knowledge-map 那行就是「现值；旧值…」同行），
// 故按**句段**判：从该数字往后读到句号/分号/行尾（≤80 字），段内出现废止标记
// （旧/已废/作废/废弃/历史/当时/曾/行号指针/旧日期）⇒ 这是**记录**，不计入活声明。
const CHUNK_NUM = /(\d+)\s*chunks/gi;
const OBSOLETE = /旧|已废|作废|废弃|历史|当时|曾|行号指针|2026-10-10/;
const isRecord = (text: string, from: number) => {
  const seg = text.slice(from, from + 80).split(/[；。\n]/)[0] ?? '';
  return OBSOLETE.test(seg);
};

const problems: string[] = [];
const okList: string[] = [];
for (const rel of REPLICAS) {
  let text: string;
  try {
    text = readRel(rel);
  } catch {
    problems.push(`${rel}：文件不存在或读不到`);
    continue;
  }
  const live: number[] = [];
  const records: number[] = [];
  for (const m of text.matchAll(CHUNK_NUM)) {
    const n = Number(m[1]);
    const at = (m.index ?? 0) + m[0].length;
    if (isRecord(text, at)) records.push(n);
    else live.push(n);
  }
  if (live.length === 0) {
    problems.push(`${rel}：找不到活声明的「<N> chunks」（副本被删、数字被改写，或只剩旧值记录）`);
    continue;
  }
  const bad = live.filter((n) => n !== actualN);
  if (bad.length > 0) {
    problems.push(`${rel}：活声明出现非实际值的 chunk 数 ${[...new Set(bad)].join(', ')}（实际 ${actualN}）`);
  } else {
    okList.push(`${rel}（活声明 ${live.length} 处${records.length ? `，旧值记录 ${records.length} 处已豁免` : ''}）`);
  }
}

if (problems.length > 0) {
  console.error(
    `check-corpus ❌ 全副本扫描发现 ${problems.length} 处问题（实际语料 ${actualN} chunks）：\n` +
      problems.map((p) => `  · ${p}`).join("\n") +
      `\n  修法：以 notes/rag.md §13 为唯一真源逐份同步（纪律 #5：修显示值不如修生成器——` +
      `这里每份副本都是手抄，改完必须由本脚本复跑确认）。`,
  );
  process.exit(1);
}

console.log(
  `check-corpus ✅ 真源 + ${REPLICAS.length} 处副本全部 = 实际 = ${actualN} chunks\n` +
    okList.map((l) => `    ✓ ${l}`).join("\n"),
);

// ── 4) recall 三值组真校验（2026-10-19 外部对标轮新增）─────────────────────────
//
// 背景：recall 三值此前**只被手抄，没有任何门禁真跑过评测**。2026-10-18 为防脏工作区
// 值回灌，在 check-counters.mjs 写死一条「README 必须写 0.44」的绊线。那条绊线有两个
// 毛病：① 违反 check-counters 自己头部的【设计约束】2「脚本内不硬编码任何计数」；
// ② 语料一改就失效——本次 agent-harness.md 新增 §3.4（工具发现）后，干净树实跑就是
// recall@5 = 0.38 / recall@10 = 0.56，绊线当场误报（CI 红）。
//
// 修法不是把绊线数字改成 0.38（那只是把同一个坑挖深一点，下次语料再改还是红），
// 而是**真跑一遍评测**：本脚本 spawn `src/evaluate.ts`，解析它的汇总行，与 rag.md §13
// 的声明值逐项比对。recall 由此从「手抄 + 写死绊线」升级为「机器校验」——
// 拆掉写死值才是加强而非放水：现在任何副本写错现值都会被这里抓住。
//
// 顺带守两样也写在 §13 的东西：PASS 题数与 gold 锚点命中数。
const sec13 = (() => {
  const m = /^##\s*13\b[^\n]*$/m.exec(note);
  if (!m) return "";
  const rest = note.slice(m.index + m[0].length);
  const next = /^##\s/m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
})();
// 与 site/src/utils/ragStats.ts 同一定位方式：recall 三值**整组**匹配
// （§13 内另有作废旧值叙述 recall@3=1.00，逐项匹配会误中）。
const declaredRecall = /recall@3\s*=\s*([0-9.]+)\s*\/\s*recall@5\s*=\s*([0-9.]+)\s*\/\s*recall@10\s*=\s*([0-9.]+)/.exec(sec13);
const declaredPass = /PASS\s*(\d+\s*\/\s*\d+)/.exec(sec13);
const declaredAnchors = /gold 锚点\s*(\d+)\s*\/\s*(\d+)\s*全命中/.exec(sec13);

const EVAL_ENTRY = new URL("./evaluate.ts", import.meta.url);
let evalOut = "";
try {
  // process.execArgv 里带着 tsx 的 loader（本脚本自身就是被 tsx 拉起来的），
  // 故用同一个 node + 同一组 execArgv 去跑评测，无需再解析 node_modules/.bin。
  evalOut = execFileSync(process.execPath, [...process.execArgv, EVAL_ENTRY.pathname], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (e) {
  const partial = (e as { stdout?: string }).stdout ?? "";
  console.error(
    `check-corpus ❌ 真跑评测失败（exit ${(e as { status?: number }).status ?? "?"}）——` +
      `evaluate.ts 锚点未命中或运行出错即非零退出，属响亮失败：\n` +
      (partial.split("\n").slice(-12).join("\n") || String(e)),
  );
  process.exit(1);
}

const actualRecall = /系统平均：recall@3 = ([0-9.]+)\s+recall@5 = ([0-9.]+)\s+recall@10 = ([0-9.]+)/.exec(evalOut);
const actualPass = /PASS (\d+)\/(\d+)/.exec(evalOut);
const actualAnchors = /gold 锚点解析：(\d+)\/(\d+)/.exec(evalOut);

const drift: string[] = [];
if (!declaredRecall) drift.push("rag.md §13 找不到 recall 三值组（parseRagStats 同款整组正则）");
if (!actualRecall) drift.push("评测输出里解析不到「系统平均」行——evaluate.ts 输出格式已变，请同步本解析器");
if (declaredRecall && actualRecall) {
  const d = declaredRecall.slice(1).map((s) => s.trim());
  const a = actualRecall.slice(1);
  if (d.join("/") !== a.join("/")) {
    drift.push(`recall 三值组：§13 声明 ${d.join("/")} ≠ 实跑 ${a.join("/")}`);
  }
}
if (declaredPass && actualPass) {
  const d = declaredPass[1].replace(/\s+/g, "");
  if (d !== `${actualPass[1]}/${actualPass[2]}`) {
    drift.push(`PASS 题数：§13 声明 ${d} ≠ 实跑 ${actualPass[1]}/${actualPass[2]}`);
  }
} else if (!declaredPass) {
  drift.push("rag.md §13 找不到「PASS x/y」");
}
if (declaredAnchors && actualAnchors) {
  const d = declaredAnchors.slice(1).join("/");
  if (d !== `${actualAnchors[1]}/${actualAnchors[2]}`) {
    drift.push(`gold 锚点命中：§13 声明 ${d} ≠ 实跑 ${actualAnchors[1]}/${actualAnchors[2]}`);
  }
}

if (drift.length > 0) {
  console.error(
    `check-corpus ❌ 声明 ≠ 实跑（${drift.length} 项）：\n` +
      drift.map((d) => `  · ${d}`).join("\n") +
      `\n  修法：以实跑为准更新 notes/rag.md §13（唯一真源），再同步其余副本；` +
      `\n  若实跑值可疑，先确认三语料成员（rag.md / agent-harness.md / handoff.md）与 HEAD 一致——` +
      `\n  脏工作区上测出的数不是可声明值（2026-10-18 的教训）。`,
  );
  process.exit(1);
}

console.log(
  `check-corpus ✅ recall 三值组 / PASS / 锚点命中全部 = 实跑（` +
    `${actualRecall?.[1]}/${actualRecall?.[2]}/${actualRecall?.[3]}，PASS ${actualPass?.[1]}/${actualPass?.[2]}，` +
    `锚点 ${actualAnchors?.[1]}/${actualAnchors?.[2]}）`,
);
