// ============================================================
// kv —— KV cache 显存估算（notes/model-basics.md §S1）
//   kvBytesPerToken = 2 × layers × kv_heads × head_dim × bytes（2 = K + V）
// ============================================================

export function kvBytesPerToken(layers: number, kvHeads: number, headDim: number, bytes: number): number {
  return 2 * layers * kvHeads * headDim * bytes;
}

export function kvTotalBytes(seqLen: number, perToken: number, concurrency: number): number {
  return seqLen * perToken * concurrency;
}