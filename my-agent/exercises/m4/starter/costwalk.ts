// ============================================================
// 模型意识 —— M4（挖 m4.3）：KV cache 显存 + 成本走查（该不该上更大模型/微调）
//   模型选择是数值走查：KV / 单步成本 / 步数共同决定。
// ============================================================
import { TODOError, type ScaleReport } from './types.js';

/** 两个候选模型参数（给全）：small 便宜 / large 贵但一次吃下更多上下文 */
export const MODELS = Object.freeze({
  small: { label: 'small-8b', layers: 8, kvHeads: 4, headDim: 128, bytes: 2, pIn: 0.5, pOut: 1.5 },
  large: { label: 'large-32b', layers: 32, kvHeads: 8, headDim: 128, bytes: 2, pIn: 3, pOut: 15 },
});

/** KV 显存总占用（给全）：seqLen × perToken × 并发 */
export function kvTotalBytes(seqLen: number, perToken: number, concurrency: number): number {
  return seqLen * perToken * concurrency;
}

/** 单步成本（给全）：inputTokens × pIn + outputTokens × pOut */
export function stepCost(inputTokens: number, outputTokens: number, pIn: number, pOut: number): number {
  return inputTokens * pIn + outputTokens * pOut;
}

/** 总任务成本（给全）：单步成本 × 步数（步数是唯一能乘数放大的项） */
export function taskCost(step: number, steps: number): number {
  return step * steps;
}

export function kvBytesPerToken(_layers: number, _kvHeads: number, _headDim: number, _bytes: number): number {
  // TODO m4.3a：KV 显存 / 每 token = 2 × layers × kv_heads × head_dim × bytes（2 = K + V）
  throw new TODOError('m4.3: 实现 KV cache 显存估算');
}

export function withCacheDiscount(_step: number, _inputTokens: number, _hitPrefixTokens: number, _discount: number): number {
  // TODO m4.3b：缓存折扣只动 prefill 命中段（decode/未命中段原价）
  throw new TODOError('m4.3: 实现缓存折扣只打 prefill');
}

export function shouldScaleUp(_kv: number, _taskCost: number, _budget: number, _trainCost: number): ScaleReport {
  // TODO m4.3c：KV 显存 + 单步成本×步数 + 微调成本联合走查，给出「不上更大模型 / 上更大 / 值得微调」的数值判断（reason 带数值）
  throw new TODOError('m4.3: 实现成本走查（该不该上更大模型 / 微调）');
}