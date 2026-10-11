/**
 * S2 demo：向量路全链——corpus → chunker → hash embedder → 暴力余弦。
 *
 * 看两件事：
 *   1. 它的强项：稀有词/代码/模型名（token 完全一致 = 词法世界的主场）
 *   2. 它的盲区：同义词（"上下文压缩" vs "compact"）——
 *      这是 S3（BM25）和 embedder 接口存在的动机
 *
 * 每道题附一个"已知相关文档"，打印它的最优排名——
 * 这是 recall@k 的雏形（T7：分母是相关集，不是 k）。
 */

import { loadCorpus } from "./corpus.js";
import { HashEmbedder } from "./embed.js";
import { BruteForceCosine } from "./index.js";

const embedder = new HashEmbedder();
const chunks = loadCorpus();
const index = new BruteForceCosine();
index.build(chunks, embedder.embed(chunks.map((c) => c.searchText)));

const totalChars = chunks.reduce((s, c) => s + c.length, 0);
console.log(`语料：${chunks.length} chunks / ${totalChars} 字符，${embedder.dim} 维，暴力 O(N)\n`);

const queries: { q: string; relevant: string; note: string }[] = [
  { q: "BM25 的词频为什么要饱和", relevant: "rag.md", note: "同词面查询：期望命中" },
  { q: "qwen3.8-flash-next 是什么", relevant: "handoff.md", note: "稀有术语查询：词法主场" },
  { q: "上下文压缩是怎么工作的", relevant: "agent-harness.md", note: "同义词查询：期望暴露盲区" },
];

for (const { q, relevant, note } of queries) {
  const full = index.topK(embedder.embed([q])[0], chunks.length);
  console.log(`Q: ${q}   [${note}]`);
  for (const r of full.slice(0, 5)) {
    console.log(`  #${r.rank} cos=${r.score.toFixed(3)} [${r.chunk.doc}] ${r.chunk.headingPath.slice(0, 44)}`);
  }
  const relRanks = full.filter((s) => s.chunk.doc === relevant).map((s) => s.rank);
  const best = relRanks.length ? Math.min(...relRanks) : -1;
  console.log(
    best === -1
      ? "  → 已知相关文档：无 chunk 进榜？（检查语料）"
      : `  → 已知相关(${relevant})最优排名：#${best}${best > 5 ? "   ← top-5 没接住" : ""}`,
  );
  console.log("");
}
