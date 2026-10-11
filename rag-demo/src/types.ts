/**
 * 最小 RAG pipeline 的核心类型。
 *
 * 全 pipeline 以 Chunk 为原子单位（T3：chunk = 语义信号被集中起来的单位）——
 * 索引、BM25、融合、rerank、引用，全部以 chunk 为单位运作。
 */

/** 文本块：检索、引用、生成的最小单位 */
export interface Chunk {
  id: string; // "doc#n"，稳定标识
  doc: string; // 来源文档名
  headingPath: string; // 标题链 "⑥ … / 词频饱和"（T3：metadata = "我在哪儿"，引用的原料）
  text: string; // 原始文本（展示 / 生成用）
  searchText: string; // 被索引的文本 = headingPath + 原文（标题是最高信号词，进索引）
  length: number; // searchText 长度（BM25 的 avgdl 要用）
}

/**
 * Embedder：向量路唯一的可插拔接口（T1：同一模型产出的所有向量活在同一个 d 维空间）。
 *
 * 本课程的实现是 hash 版（全离线、确定性、可复现）；
 * 换成真语义模型 = 再实现一个这个接口（~10 行），pipeline 其他部分一行不改。
 */
export interface Embedder {
  readonly dim: number;
  embed(texts: string[]): number[][];
}

/** 打分后的检索结果 */
export interface ScoredChunk {
  chunk: Chunk;
  score: number;
  rank: number; // 1-based
}
