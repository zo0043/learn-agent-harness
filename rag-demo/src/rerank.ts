/**
 * Rerank 插槽——检索的两段式架构：
 *
 *   recall 侧（便宜、宽）: 向量索引 + BM25 + RRF → top-N，"把所有可能相关的捞进候选池"
 *   precision 侧（贵、窄）: rerank → top-k，"用最强的模型把候选池重排"
 *
 * 本课插槽是直通（IdentityReranker）：融合结果原样通过。
 * 接真 rerank 模型（bge-reranker / cross-encoder / LLM judge）只需实现 Reranker 接口，
 * pipeline 其他部分一行不改——与 Embedder 接口（换语义模型）同一个模式：
 * 贵的、会变的、依赖外部服务的部件，都藏在接口后面。
 *
 * 分工：Embedder 在 recall 侧管召回，Reranker 在 precision 侧管精度。
 */

import type { Chunk } from "./types.js";

export interface Reranker {
  rerank(query: string, chunks: Chunk[]): Chunk[];
}

/** 直通实现：不重排。占位 + 类型约束 */
export class IdentityReranker implements Reranker {
  rerank(_query: string, chunks: Chunk[]): Chunk[] {
    return chunks;
  }
}
