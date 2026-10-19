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
