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

// —— 发票：Q1 在「目标 chunk」和「cosine 榜首的非目标 chunk」上各收多少钱
// 2026-10-19：原实现按 headingPath.includes("练习题库") 找噪声 chunk；该节随题库移除后
// bank 恒为 undefined，第二条发票被 `idx < 0 → continue` 静默跳过（有兜底所以不报错，但演示少了一半）。
// 改为**不依赖具体小节名**的通用定义：cosine 排名里第一个不是目标的 chunk = 「噪声压过解释」的那一块。
// 这样语料任何增删都不影响这条演示（修生成器，而不是修死值）。
const TARGET_ID = "rag.md#28";
const q1 = queries[0].q;
const cosQ1 = cosine.topK(embedder.embed([q1])[0], chunks.length);
const targetIdx = chunks.findIndex((c) => c.id === TARGET_ID);
if (targetIdx < 0) {
  throw new Error(`demo-bm25：目标 chunk ${TARGET_ID} 不在语料里——rag.md 增删小节后需同步本常量`);
}
const noise = cosQ1.find((r) => r.chunk.id !== TARGET_ID);
const invoices: [string, number][] = [
  [`目标 ${TARGET_ID}（真正的解释）`, targetIdx],
  ...(noise
    ? [[`${noise.chunk.id}（cosine 榜首的非目标 chunk：${noise.chunk.headingPath.slice(0, 24)}）`, chunks.findIndex((c) => c.id === noise.chunk.id)] as [string, number]]
    : []),
];
if (!noise) {
  console.log("⚠ 语料里除目标外没有其它 chunk，第二条发票跳过");
}

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
