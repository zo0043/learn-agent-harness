// ============================================================
// 能力路由 + 降级阶梯 —— API 与多模型路由 §S2
//   严格能力匹配里选最便宜；首选故障则按「大→小」降级到窗口达标次选；
//   一个不剩 → 如实失败（不静默截断）
// ============================================================
import type { ProviderSpec, Task } from "./types.js";

const inputPrice = (p: ProviderSpec) => p.price.input;

function strictOk(task: Task, p: ProviderSpec): boolean {
  return (
    p.windowTokens >= task.minWindowTokens &&
    (!task.needsStructured || p.structured) &&
    (!task.needsToolCalling || p.toolCalling)
  );
}

/** 严格能力路由：满足全部硬要求（窗口 + 结构化 + 工具调用）里最便宜 */
export function route(task: Task, providers: ProviderSpec[]): ProviderSpec | null {
  return providers.filter((p) => strictOk(task, p)).sort((a, b) => inputPrice(a) - inputPrice(b))[0] ?? null;
}

export interface FallbackResult {
  provider: ProviderSpec | null;
  fell: boolean;
  reason: string;
}

/** 降级：首选不可用 → 降级到仍满足窗口硬下限的次选（可失去 tool_calling/structured）；无候选 → 如实失败 */
export function withFallback(task: Task, providers: ProviderSpec[], healthy: Set<string>): FallbackResult {
  const primary = route(task, providers);
  if (!primary) return { provider: null, fell: false, reason: "无能力匹配的 provider（如实失败，不静默截断）" };
  if (healthy.has(primary.id)) return { provider: primary, fell: false, reason: `${primary.id} 直接可用` };

  const ladder = providers
    .filter((p) => p.id !== primary.id && healthy.has(p.id) && p.windowTokens >= task.minWindowTokens)
    .sort((a, b) => inputPrice(a) - inputPrice(b));
  const next = ladder[0];
  if (!next) return { provider: null, fell: true, reason: `${primary.id} 不可用且无健康降级候选（如实失败）` };
  return {
    provider: next,
    fell: true,
    reason: `${primary.id} 不可用 → 降级 ${next.id}（窗口满足；${next.toolCalling ? "保留" : "失去"} tool_calling）`,
  };
}