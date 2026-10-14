// ============================================================
// 成本计数 —— API 与多模型路由 §S2
//   usage token × 每 1k token 单价 → 每步成本 + 按模型归因
// ============================================================
import type { CostReport, CostStep } from "./types.js";
import { providerById } from "./providers.js";

const round4 = (n: number) => Math.round(n * 10000) / 10000;

/** 单步成本 = input/1000 × input 单价 + output/1000 × output 单价 */
export function stepCost(model: string, usage: { input: number; output: number }): number {
  const p = providerById(model);
  return round4((usage.input / 1000) * p.price.input + (usage.output / 1000) * p.price.output);
}

export function aggregateCosts(steps: CostStep[]): CostReport {
  const byModel: Record<string, number> = {};
  let total = 0;
  for (const s of steps) {
    total = round4(total + s.cost);
    byModel[s.model] = round4((byModel[s.model] ?? 0) + s.cost);
  }
  return { total, byModel };
}