/**
 * S5：golden set + recall@k + 错误归因——T7 的示波器。
 *
 * recall@k = |top-k ∩ relevant| / |relevant|（分母 = 相关集，不是 k）
 * 系统分 = 各题平均。
 *
 * 错误归因签名（漏掉的每个相关 chunk 单独定位）：
 *   两路都在 top-10、融合却漏了   → 融合权重问题
 *   一路 top-10、另一路深埋       → 一路的盲区被融合救回（或该救没救）
 *   两路都 >10                     → 表面形式盲区（paraphrase/同义）或切块/覆盖问题
 *   范围外题                        → 拒答轨（demo-rag 测），不进 recall 统计
 *
 * 注意：标注基于 2026-10-17 的 chunk 快照；语料若被重新切块，ids 需重核。
 */

import { loadCorpus } from "./corpus.js";
import { HashEmbedder } from "./embed.js";
import { BruteForceCosine } from "./index.js";
import { BM25 } from "./bm25.js";
import { rrfFusion } from "./rrf.js";

interface GoldenQ {
  q: string;
  relevant: string[]; // 人工标注的相关 chunk id（"回答此题需要它"）
  outOfScope?: boolean;
  note?: string;
}

const GOLDEN: GoldenQ[] = [
  { q: "BM25 的词频为什么要饱和？k1 参数控制什么？", relevant: ["rag.md#28"], note: "同词面" },
  { q: "IDF 是什么？为什么是对数函数？", relevant: ["rag.md#29"], note: "同词面" },
  { q: "chunker 的 headingPath metadata 为什么必要？", relevant: ["agent-harness.md#6", "rag.md#16"], note: "跨文档双 chunk" },
  { q: "混合检索怎么用 RRF 融合两路分数？", relevant: ["rag.md#33", "agent-harness.md#43"], note: "跨文档双 chunk" },
  { q: "recall@k 评测指标怎么定义？", relevant: ["rag.md#38", "agent-harness.md#44"], note: "跨文档双 chunk" },
  { q: "代理里哪些模型下架了，现在能用哪些？", relevant: ["handoff.md#8", "handoff.md#11"], note: "稀有术语" },
  { q: "上下文压缩（compact）机制是怎么工作的？", relevant: ["agent-harness.md#16", "handoff.md#4"], note: "同词面" },
  { q: "系统怎么防止上下文溢出？", relevant: ["agent-harness.md#16", "handoff.md#4"], note: "paraphrase 探针（预期暴露表面形式盲区）" },
  { q: "苹果的 CEO 是谁？", relevant: [], outOfScope: true, note: "拒答轨" },
  { q: "北京今天天气怎么样？", relevant: [], outOfScope: true, note: "拒答轨" },
];

const chunks = loadCorpus();
const embedder = new HashEmbedder();
const cosine = new BruteForceCosine();
cosine.build(chunks, embedder.embed(chunks.map((c) => c.searchText)));
const bm25 = new BM25();
bm25.build(chunks);

const K_LIST = [3, 5, 10];

console.log(`Golden set：${GOLDEN.length} 题（范围外 ${GOLDEN.filter((g) => g.outOfScope).length} 题走拒答轨）\n`);

const rows: { q: GoldenQ; recalls: number[]; misses: { id: string; cosRank: number; bmRank: number }[] }[] = [];

for (const g of GOLDEN) {
  if (g.outOfScope) continue;

  const cosFull = cosine.topK(embedder.embed([g.q])[0], chunks.length);
  const bmFull = bm25.topK(g.q, chunks.length);
  const fused = rrfFusion(
    [
      { name: "cosine", results: cosFull },
      { name: "bm25", results: bmFull },
    ],
    60,
    chunks.length,
  );

  const recalls = K_LIST.map((k) => {
    const top = new Set(fused.slice(0, k).map((f) => f.chunk.id));
    return g.relevant.filter((id) => top.has(id)).length / g.relevant.length;
  });

  const top10 = new Set(fused.slice(0, 10).map((f) => f.chunk.id));
  const misses = g.relevant
    .filter((id) => !top10.has(id))
    .map((id) => ({
      id,
      cosRank: cosFull.find((r) => r.chunk.id === id)?.rank ?? -1,
      bmRank: bmFull.find((r) => r.chunk.id === id)?.rank ?? -1,
    }));

  rows.push({ q: g, recalls, misses });

  const marks = recalls.map((r) => (r === 1 ? "1.00" : r.toFixed(2))).join("  ");
  console.log(
    `Q[${g.note}] ${g.q.slice(0, 22).padEnd(24)} rec@3/5/10 = ${marks}  相关 ${g.relevant.length}`,
  );
  for (const m of misses) {
    const sig =
      m.cosRank <= 10 || m.bmRank <= 10
        ? `一路在 top-10（cosine#${m.cosRank} / bm25#${m.bmRank}）`
        : `两路都漏（cosine#${m.cosRank} / bm25#${m.bmRank}）→ 表面形式盲区或切块问题`;
    console.log(`    ✗ 漏 ${m.id}：${sig}`);
  }
}

console.log("");
const avg = (i: number) => rows.reduce((s, r) => s + r.recalls[i], 0) / rows.length;
console.log(`系统平均：recall@3 = ${avg(0).toFixed(2)}   recall@5 = ${avg(1).toFixed(2)}   recall@10 = ${avg(2).toFixed(2)}   （${rows.length} 道范围内存题）`);
