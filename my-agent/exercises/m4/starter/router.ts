// ============================================================
// 能力路由 + 降级阶梯 + 成本归因 —— M3
//   严格能力匹配里选最便宜；首选故障降级到窗口达标次选；成本 = token×单价，按模型归因。
// ============================================================
import type { CostReport, CostStep, ProviderSpec, Task } from './types.js';

/** 两个 mock provider（给全）：p-fast 便宜无工具 / p-capable 贵有工具结构化 */
export const PROVIDERS: ProviderSpec[] = [
  { id: 'p-fast', toolCalling: false, structured: false, windowTokens: 4096, price: { input: 0.5, output: 1.5 } },
  { id: 'p-capable', toolCalling: true, structured: true, windowTokens: 32768, price: { input: 3, output: 15 } },
];

export function providerById(id: string): ProviderSpec {
  const p = PROVIDERS.find((x) => x.id === id);
  if (!p) throw new Error(`未知 provider：${id}`);
  return p;
}

/** 严格能力匹配（给全）：窗口 + 结构化 + 工具调用三个硬要求全满足 */
export function strictOk(task: Task, p: ProviderSpec): boolean {
  return p.windowTokens >= task.minWindowTokens && (!task.needsStructured || p.structured) && (!task.needsToolCalling || p.toolCalling);
}

const inputPrice = (p: ProviderSpec) => p.price.input;

export interface FallbackResult {
  provider: ProviderSpec | null;
  fell: boolean;
  reason: string;
}

/** 严格能力路由：满足全部硬要求里最便宜 */
export function route(task: Task, providers: ProviderSpec[]): ProviderSpec | null {
  return providers.filter((p) => strictOk(task, p)).sort((a, b) => inputPrice(a) - inputPrice(b))[0] ?? null;
}

/** 降级：首选不可用 → 降级到仍满足窗口硬下限的次选；无候选 → 如实失败 */
export function withFallback(task: Task, providers: ProviderSpec[], healthy: Set<string>): FallbackResult {
  const primary = route(task, providers);
  if (!primary) return { provider: null, fell: false, reason: '无能力匹配的 provider（如实失败，不静默截断）' };
  if (healthy.has(primary.id)) return { provider: primary, fell: false, reason: `${primary.id} 直接可用` };

  const ladder = providers
    .filter((p) => p.id !== primary.id && healthy.has(p.id) && p.windowTokens >= task.minWindowTokens)
    .sort((a, b) => inputPrice(a) - inputPrice(b));
  const next = ladder[0];
  if (!next) return { provider: null, fell: true, reason: `${primary.id} 不可用且无健康降级候选（如实失败）` };
  return { provider: next, fell: true, reason: `${primary.id} 不可用 → 降级 ${next.id}（窗口满足；${next.toolCalling ? '保留' : '失去'} tool_calling）` };
}

const round4 = (n: number) => Math.round(n * 10000) / 10000;

/** 单步成本 = input/1000×input 单价 + output/1000×output 单价 */
export function stepCost(model: string, usage: { input: number; output: number }): number {
  const p = providerById(model);
  return round4((usage.input / 1000) * p.price.input + (usage.output / 1000) * p.price.output);
}

/** 跨步聚合：total + 按模型归因 */
export function aggregateCosts(steps: CostStep[]): CostReport {
  const byModel: Record<string, number> = {};
  let total = 0;
  for (const s of steps) {
    total = round4(total + s.cost);
    byModel[s.model] = round4((byModel[s.model] ?? 0) + s.cost);
  }
  return { total, byModel };
}