// ============================================================
// latency —— TTFT / TPOT（notes/model-basics.md §S4.0 / §S8）
//   TTFT = t_queue + t_prefill + t_network，t_prefill ≈ prompt_tokens / prefill_throughput
//   TPOT ≈ (weight_bytes + B × kv_bytes_per_seq) / HBM_bw（B=并发；decode 每步读一次权重、读 B 份 KV）
// ============================================================

export function ttft(tQueue: number, promptTokens: number, prefillThroughput: number, tNet: number): number {
  return tQueue + promptTokens / prefillThroughput + tNet;
}

export function tpot(weightBytes: number, concurrency: number, kvBytesPerSeq: number, hbmBw: number): number {
  return (weightBytes + concurrency * kvBytesPerSeq) / hbmBw;
}