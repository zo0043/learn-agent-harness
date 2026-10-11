/**
 * S4 demo：全 pipeline 端到端——
 *   corpus → chunker → (cosine ∥ BM25) → RRF 融合 → rerank 插槽 → 生成（引用 + 拒答）
 *
 * 三道题：
 *   1. 语料内问题 → 期望：正确答案 + heading 引用
 *   2. 话题聚簇问题 → 同上
 *   3. 范围外问题 → 期望："材料不足"（拒答防线，不是幻觉）
 */

import { loadCorpus } from "./corpus.js";
import { HashEmbedder } from "./embed.js";
import { BruteForceCosine } from "./index.js";
import { BM25 } from "./bm25.js";
import { rrfFusion, type FusedResult } from "./rrf.js";
import { IdentityReranker } from "./rerank.js";
import { generateAnswer } from "./generator.js";

const chunks = loadCorpus();
const embedder = new HashEmbedder();
const cosine = new BruteForceCosine();
cosine.build(chunks, embedder.embed(chunks.map((c) => c.searchText)));
const bm25 = new BM25();
bm25.build(chunks);
const reranker = new IdentityReranker();

const RECALL_K = 10; // recall 侧候选数
const GENERATE_K = 5; // 喂给生成的上下文 chunk 数

async function ask(query: string): Promise<void> {
  console.log(`\n${"=".repeat(72)}\nQ: ${query}\n${"=".repeat(72)}`);

  // 两路全量排序 → RRF 融合（T6：rank 是公共货币）
  const fused: FusedResult[] = rrfFusion(
    [
      { name: "cosine", results: cosine.topK(embedder.embed([query])[0], chunks.length) },
      { name: "bm25", results: bm25.topK(query, chunks.length) },
    ],
    60,
    chunks.length,
  );

  // recall 侧取 RECALL_K → rerank 插槽（本课直通）→ precision 侧取 GENERATE_K
  const recalled = reranker.rerank(query, fused.slice(0, RECALL_K).map((f) => f.chunk));
  const top = recalled.slice(0, GENERATE_K);

  console.log("融合 top-5（RRF k=60）：");
  for (const c of top) {
    const f = fused.find((x) => x.chunk.id === c.id)!;
    console.log(`  #${f.rank} rrf=${f.score.toFixed(4)} [${c.doc}] ${c.headingPath.slice(0, 36)}   （${f.perListRanks.join(" + ")}）`);
  }

  const { answer, refused } = await generateAnswer(query, top);
  console.log(`\n[答案]${refused ? "（拒答：模型声明材料不足）" : ""}`);
  console.log(answer.trim());
}

await ask("BM25 的词频为什么要饱和？k1 参数控制什么？");
await ask("上下文压缩（compact）机制是怎么工作的？");
await ask("苹果的 CEO 是谁？");
