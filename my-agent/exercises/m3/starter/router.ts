// ============================================================
// 能力路由 + 降级阶梯 + 成本归因 —— M3（挖 m3.4）
//   严格能力匹配里选最便宜；首选故障降级到窗口达标次选；成本 = token×单价，按模型归因。
// ============================================================
import { TODOError, type CostReport, type CostStep, type ProviderSpec, type Task } from './types.js';

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

export interface FallbackResult {
  provider: ProviderSpec | null;
  fell: boolean;
  reason: string;
}

export function route(_task: Task, _providers: ProviderSpec[]): ProviderSpec | null {
  // TODO m3.4a：严格能力匹配（窗口+结构化+工具调用）里选最便宜；无匹配如实 null
  throw new TODOError('m3.4: 实现能力矩阵路由（先能力后价格）');
}

export function withFallback(_task: Task, _providers: ProviderSpec[], _healthy: Set<string>): FallbackResult {
  // TODO m3.4a：首选故障→降级到窗口达标次选；一个不剩如实失败（不静默截断）
  throw new TODOError('m3.4: 实现降级阶梯（大→小，断供如实失败）');
}

export function stepCost(_model: string, _usage: { input: number; output: number }): number {
  // TODO m3.4b：单步成本 = input/1000×input 单价 + output/1000×output 单价
  throw new TODOError('m3.4: 实现成本计数与按模型归因（aggregateCosts）');
}

export function aggregateCosts(_steps: CostStep[]): CostReport {
  // TODO m3.4b：跨步聚合 total + byModel 归因
  throw new TODOError('m3.4: 实现成本计数与按模型归因（aggregateCosts）');
}