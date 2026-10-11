/**
 * S3 demo：同一语料、同一组 query——cosine vs BM25 并排。
 *
 * 看三件事：
 *   1. Q1 翻不翻盘：价目表换了（IDF），"什么/为什" 噪声被压掉
 *   2. 发票：explain() 打印每个 query token 在 chunk 里的收费——定价看得见
 *   3. 诚实的部分：某些 query cosine 仍然更强——
 *      没有任何一路全面占优 → S4（RRF）才有存在的真实理由
 */

import { loadCorpus } from "./corpus.js";
import { HashEmbedder } from "./embed.js";
import { BruteForceCosine } from "./index.js";
import { BM25 } from "./bm25.js";

const chunks = loadCorpus();

const embedder = new HashEmbedder();
const cosine = new BruteForceCosine();
cosine.build(chunks, embedder.embed(chunks.map((c) => c.searchText)));

const bm25 = new BM25(); // k1=1.5, b=0.75
bm25.build(chunks);

console.log(`语料：${chunks.length} chunks，avgdl=${bm25.avgdl.toFixed(0)} tokens（k1=1.5, b=0.75）\n`);

const queries = [
  { q: "BM25 的词频为什么要饱和", relevant: "rag.md", label: "Q1 噪声词翻车现场（S2 里目标 #15）" },
  { q: "qwen3.8-flash-next 是什么", relevant: "handoff.md", label: "Q2 稀有术语" },
  { q: "上下文压缩是怎么工作的", relevant: "agent-harness.md", label: "Q3 话题聚簇" },
];

function bestRank(results: { chunk: { doc: string }; rank: number }[], doc: string): number {
  const ranks = results.filter((r) => r.chunk.doc === doc).map((r) => r.rank);
  return ranks.length ? Math.min(...ranks) : -1;
}

for (const { q, relevant, label } of queries) {
  const cosFull = cosine.topK(embedder.embed([q])[0], chunks.length);
  const bFull = bm25.topK(q, chunks.length);
  console.log(`${label}\nQ: ${q}`);
  console.log(
    `  cosine: top3 = ${cosFull.slice(0, 3).map((r) => `#${r.rank} ${r.chunk.doc}/${r.chunk.headingPath.slice(0, 16)}`).join(" | ")}  → 目标(${relevant}) #${bestRank(cosFull, relevant)}`,
  );
  console.log(
    `  BM25:   top3 = ${bFull.slice(0, 3).map((r) => `#${r.rank} ${r.chunk.doc}/${r.chunk.headingPath.slice(0, 16)}(${r.score.toFixed(1)})`).join(" | ")}  → 目标(${relevant}) #${bestRank(bFull, relevant)}`,
  );
  console.log("");
}

// —— 发票：Q1 在"目标 chunk"和"S2 的 cosine 榜首"上各收了多少钱
const q1 = queries[0].q;
const cosQ1 = cosine.topK(embedder.embed([q1])[0], chunks.length);
const bank = cosQ1.find((r) => r.chunk.headingPath.includes("练习题库"));
const invoices: [string, number][] = [
  ["目标 rag.md#28（真正的解释）", chunks.findIndex((c) => c.id === "rag.md#28")],
  [`${bank?.chunk.id ?? "?"}（S2 cosine 榜首）`, bank ? chunks.findIndex((c) => c.id === bank.chunk.id) : -1],
];

for (const [name, idx] of invoices) {
  if (idx < 0) continue;
  const lines = bm25.explain(q1, idx);
  const total = lines.reduce((s, l) => s + l.contribution, 0);
  console.log(`Q1 发票 · ${name}（总分 ${total.toFixed(2)}）`);
  console.log("  token      idf    tf   贡献");
  for (const l of lines) {
    console.log(`  ${l.token.padEnd(10)} ${l.idf.toFixed(2).padStart(5)}  ${String(l.tf).padStart(3)}  ${l.contribution.toFixed(2)}`);
  }
  console.log("");
}
