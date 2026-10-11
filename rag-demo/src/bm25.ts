/**
 * BM25——词法检索的"价目表"（S3）。
 *
 * S2 的诊断：hash cosine 给所有 token 统一定价 $1——
 * "什么"（df 78/85）和"饱和"（df 5/85）同价，
 * 于是塞满噪声词的题库 chunk 压过了真正的解释 chunk（Q1 的 #15 翻车）。
 *
 * BM25 = 换价目表，索引结构不动：
 *   价格(t) = IDF(t)                          ← T4：到处都出现的词没有区分力
 *          × tf 饱和 f(tf)                     ← T5：第 1 次出现是最强信号，第 15 次几乎不添东西
 *   长度归一 b                                 ← 长 chunk 什么都多一点，要折价
 *
 * 推论（T6）：分数无界、随语料变、和 cosine 不同刻度 → 不能直接相加，
 * 所以 S4 用 RRF 按 rank 融合。
 */

import { tokenize } from "./tokenizer.js";
import type { Chunk, ScoredChunk } from "./types.js";

/** "发票"一行：某个 query token 在某个 chunk 里收了多少钱 */
export interface TokenContribution {
  token: string;
  idf: number;
  tf: number; // 在该 chunk 里的出现次数
  contribution: number;
}

export class BM25 {
  /** k1：tf 饱和速度（常用区间 1.2–2.0，这里 1.5） */
  private readonly k1: number;
  /** b：长度修正强度（0=关，1=全量；惯例 0.75）。注意它管长度，k1 管饱和，各管一摊 */
  private readonly b: number;

  private chunks: Chunk[] = [];
  private tfs: Map<string, number>[] = [];
  private dl: number[] = []; // 每 chunk 的 token 数
  private df = new Map<string, number>();
  private N = 0;
  private _avgdl = 0;

  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
  }

  get avgdl(): number {
    return this._avgdl;
  }

  build(chunks: Chunk[]): void {
    this.N = chunks.length;
    this.chunks = chunks;
    this.df = new Map();
    this.tfs = chunks.map((c) => {
      const tf = new Map<string, number>();
      for (const t of tokenize(c.searchText)) tf.set(t, (tf.get(t) ?? 0) + 1);
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
      return tf;
    });
    this.dl = this.tfs.map((tf) => [...tf.values()].reduce((a, b) => a + b, 0));
    this._avgdl = this.dl.reduce((a, b) => a + b, 0) / this.N;
  }

  /** T4 的定价：ES 变体 log(1 + (N - df + 0.5)/(df + 0.5))，恒非负 */
  idf(token: string): number {
    const df = this.df.get(token) ?? 0;
    if (df === 0) return 0;
    return Math.log(1 + (this.N - df + 0.5) / (df + 0.5));
  }

  /** T5 的 tf 饱和 × 长度修正：单调增、边际递减（永不饱和死） */
  private tfPart(tf: number, chunkIdx: number): number {
    const lenFactor = 1 - this.b + (this.b * this.dl[chunkIdx]) / this._avgdl;
    return (tf * (this.k1 + 1)) / (tf + this.k1 * lenFactor);
  }

  score(query: string, chunkIdx: number): number {
    let total = 0;
    for (const t of new Set(tokenize(query))) {
      const tf = this.tfs[chunkIdx].get(t) ?? 0;
      if (tf > 0) total += this.idf(t) * this.tfPart(tf, chunkIdx);
    }
    return total;
  }

  topK(query: string, k: number): ScoredChunk[] {
    const scored = this.chunks.map((c, i) => ({ chunk: c, score: this.score(query, i) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map((s, rank) => ({ ...s, rank: rank + 1 }));
  }

  /** 发票：query 的每个 token 在这个 chunk 里各收了多少钱——价目表可视化 */
  explain(query: string, chunkIdx: number): TokenContribution[] {
    return [...new Set(tokenize(query))]
      .map((t) => {
        const tf = this.tfs[chunkIdx].get(t) ?? 0;
        return {
          token: t,
          idf: this.idf(t),
          tf,
          contribution: tf > 0 ? this.idf(t) * this.tfPart(tf, chunkIdx) : 0,
        };
      })
      .sort((a, b) => b.contribution - a.contribution);
  }
}
