/**
 * 暴力余弦索引——全部算法三行（T2 连接）：
 *   预归一化 → 点积 → 排序
 *
 * 每次查询 O(N)：刻意不上 ANN。几十个 chunk 时 O(N) 可见、可插桩、无近似——
 * 理论课 ③ 的 ANN 是规模化故事，这里先用最笨的方式把"检索"这件事看清楚。
 */

import type { Chunk, ScoredChunk } from "./types.js";

export function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export class BruteForceCosine {
  private chunks: Chunk[] = [];
  private vectors: number[][] = []; // 构建时已 L2 归一（T2：点积 = cosine）

  build(chunks: Chunk[], vectors: number[][]): void {
    if (chunks.length !== vectors.length) {
      throw new Error(`chunks(${chunks.length}) 与 vectors(${vectors.length}) 数量不匹配`);
    }
    this.chunks = chunks;
    this.vectors = vectors;
  }

  topK(queryVec: number[], k: number): ScoredChunk[] {
    // queryVec 同样归一化 → 点积就是 cosine 本身
    const scored = this.vectors.map((v, i) => ({
      chunk: this.chunks[i],
      score: dot(v, queryVec),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map((s, rank) => ({ ...s, rank: rank + 1 }));
  }
}
