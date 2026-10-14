// ============================================================
// 模型意识 —— M4：KV cache 显存 + 成本走查（该不该上更大模型/微调）
//   模型选择是数值走查：KV / 单步成本 / 步数共同决定。
// ============================================================
import type { ScaleReport } from './types.js';

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

const round0 = (n: number) => Math.round(n);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** KV 显存 / 每 token = 2 × layers × kv_heads × head_dim × bytes（2 = K + V） */
export function kvBytesPerToken(layers: number, kvHeads: number, headDim: number, bytes: number): number {
  return 2 * layers * kvHeads * headDim * bytes;
}

/** 前缀缓存折扣：只动 prefill 命中段（hitPrefixTokens 按折扣计），未命中段与 decode 原价 */
export function withCacheDiscount(step: number, inputTokens: number, hitPrefixTokens: number, discount: number): number {
  const perToken = step / inputTokens;
  const hitCost = hitPrefixTokens * perToken * discount;
  const missCost = (inputTokens - hitPrefixTokens) * perToken;
  return hitCost + missCost;
}

/** 单处理器显存见顶红线（48GB 卡的 80%，用于「上更大模型是否可行」的硬约束） */
const KV_HEADROOM_MB = 48000 * 0.8;

/**
 * 成本走查：KV 显存 + 单步成本×步数 + 微调成本联合决策。
 *   taskCost ≤ budget            → no（当前模型够用）
 *   taskCost > budget 且 KV 见顶 → fine-tune（微调划算）/ no（微调也不划算）
 *   taskCost > budget 且 KV 有余 → fine-tune（微调 < 超支额）/ scale（微调不划算，上更大模型）
 */
export function shouldScaleUp(kv: number, taskCost: number, budget: number, trainCost: number): ScaleReport {
  if (taskCost <= budget) {
    return { decision: 'no', reason: `任务总成本 ${round2(taskCost)} ≤ 预算 ${round2(budget)}：当前模型够用，不上更大模型（KV ${round0(kv)}MB）` };
  }
  const over = round2(taskCost - budget);
  if (kv >= KV_HEADROOM_MB) {
    if (trainCost < over) {
      return { decision: 'fine-tune', reason: `KV 已 ${round0(kv)}MB 逼近显存见顶（≥ ${round0(KV_HEADROOM_MB)}MB），不能上更大模型；超支 ${over} 且微调 ${round2(trainCost)} < 超支额 → 值得微调` };
    }
    return { decision: 'no', reason: `KV 已 ${round0(kv)}MB 逼近显存见顶且微调 ${round2(trainCost)} ≥ 超支 ${over}：维持现状` };
  }
  if (trainCost < over) {
    return { decision: 'fine-tune', reason: `超预算 ${over}；微调一次 ${round2(trainCost)} < 超支额 ${over} → 值得微调（高频重跑摊薄推理成本）；KV ${round0(kv)}MB 有余量` };
  }
  return { decision: 'scale', reason: `超预算 ${over}；微调 ${round2(trainCost)} ≥ 超支额 ${over} 不划算 → 上更大模型（KV 将随层数放大，当前 ${round0(kv)}MB 有余量）` };
}