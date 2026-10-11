/**
 * RRF 融合——T6：刻度不可比，rank 是公共货币。
 *
 * cosine ∈ [-1,1] 刻度固定；BM25 ∈ [0,∞) 刻度随语料漂移——
 * 两个分数不能相加（S3 已实证：Q1 BM25 赢、Q3 cosine 赢，互有胜负）。
 * 两列表天然共有的唯一无量纲量是 rank：第 1 名就是第 1 名，不依赖刻度。
 *
 *   score(c) = Σ_lists 1 / (k + rank_list(c)),  k = 60  (Cormack et al. 2009)
 *
 * k=60 → 第 1 名 = 1/61，第 10 名 = 1/70：头部强但不独裁（S1 的表）。
 * RRF 只有一个旋钮 k——旋钮少是它工程耐用的原因，这里用 60 不动。
 */

import type { Chunk, ScoredChunk } from "./types.js";

export interface FusedResult {
  chunk: Chunk;
  score: number;
  rank: number; // 1-based，融合后
  perListRanks: string[]; // 各列表里的名次，如 ["cosine#15", "bm25#1"]
}

export function rrfFusion(
  lists: { name: string; results: ScoredChunk[] }[],
  k = 60,
  topK = 5,
): FusedResult[] {
  const byId = new Map<string, { score: number; chunk: Chunk; perListRanks: string[] }>();
  for (const { name, results } of lists) {
    for (const r of results) {
      const e = byId.get(r.chunk.id) ?? { score: 0, chunk: r.chunk, perListRanks: [] };
      e.score += 1 / (k + r.rank);
      e.perListRanks.push(`${name}#${r.rank}`);
      byId.set(r.chunk.id, e);
    }
  }
  const all = [...byId.values()].sort((a, b) => b.score - a.score);
  return all.slice(0, topK).map((e, i) => ({
    chunk: e.chunk,
    score: e.score,
    rank: i + 1,
    perListRanks: e.perListRanks,
  }));
}
