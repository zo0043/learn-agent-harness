// ============================================================
// cost —— 成本拆分（notes/model-basics.md §S4.1）
//   stepCost = input_t × p_in + output_t × p_out（输出常是输入 3-5×）
//   taskCost = Σ 单步 × 步数（步数是唯一能乘数放大的项）
//   caching 折扣只打 prefill 命中段（decode 原价）
// ============================================================
import type { CostBreakdown } from './types.js';

export function stepCost(inputTokens: number, outputTokens: number, pIn: number, pOut: number): number {
  return inputTokens * pIn + outputTokens * pOut;
}

export function taskCost(steps: number[]): number {
  return steps.reduce((sum, c) => sum + c, 0);
}

/**
 * 前缀缓存折扣：step 是输入侧（prefill）基准成本 = inputTokens × pIn；
 * 命中 hitPrefixTokens 只按 discount（付费比例，如 0.1 = 打一折）计，未命中段原价。
 * 只动 prefill，decode（输出侧）另行原价计——见断言 cost-C。
 */
export function withCacheDiscount(step: number, inputTokens: number, hitPrefixTokens: number, discount: number): number {
  const perToken = step / inputTokens;
  const hitCost = hitPrefixTokens * perToken * discount;
  const missCost = (inputTokens - hitPrefixTokens) * perToken;
  return hitCost + missCost;
}

/** 把单步成本按 prefill（输入）与 decode（输出）拆成两行可解释项 */
export function breakdown(inputCost: number, outputCost: number): CostBreakdown {
  return { prefill: inputCost, decode: outputCost };
}