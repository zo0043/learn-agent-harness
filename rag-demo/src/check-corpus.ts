/**
 * 语料 chunk 数守卫（2026-10-19 新增）。
 *
 * 背景：这个数在本仓**漂移过两次**（85 → 132 → 123），每次都因为「删/增 notes 小节后
 * 声明值没同步」，而它有 6 处副本：notes/rag.md §13 / notes/evaluation.md /
 * notes/long-term-memory.md / site/src/data/course-structure.ts / site/src/data/mvps.ts /
 * rag-demo/README.md。
 *
 * notes/rag.md §13 是**唯一真源**（site/src/utils/ragStats.ts 构建期解析它并在站点上显示），
 * 本脚本把「声明值」与「实际语料」对上，不一致即 exit 1——让漂移在 CI 就暴露，
 * 而不是等读者发现站点显示的数字对不上。
 *
 * 放在 rag-demo 旁边（而不是 site/tools/）是因为只有这里能 import 语料生成器；
 * CI 侧由 .github/workflows/verify.yml 增加一步 `cd rag-demo && npm ci && npm run check:corpus`。
 */

import { readFileSync } from "node:fs";
import { loadCorpus } from "./corpus.js";

const NOTE_PATH = new URL("../../notes/rag.md", import.meta.url);
const note = readFileSync(NOTE_PATH, "utf8");

// 与 ragStats.ts 同一定位方式：「语料 … → N chunks」
const declared = /语料[^\n]*?→\s*(\d+)\s*chunks/.exec(note)?.[1];
if (declared === undefined) {
  console.error('check-corpus ❌ notes/rag.md §13 找不到「语料 … → N chunks」——声明行被改动或删除');
  process.exit(1);
}
const declaredN = Number(declared);

const actualN = loadCorpus().length;

if (declaredN !== actualN) {
  console.error(
    `check-corpus ❌ 声明 ≠ 实际：notes/rag.md §13 写 ${declaredN} chunks，实际语料 ${actualN} chunks。\n` +
      `  修法（唯一真源优先）：先改 notes/rag.md §13 的「→ ${actualN} chunks」，再同步 5 处副本\n` +
      `  （evaluation.md / long-term-memory.md / course-structure.ts / mvps.ts / rag-demo/README.md）。`,
  );
  process.exit(1);
}

console.log(`check-corpus ✅ 声明 = 实际 = ${actualN} chunks（notes/rag.md §13 与语料一致）`);
