// ============================================================
// 类型定义 —— API 与多模型路由 §S2
//   六模块共享的契约：ProviderSpec / SSEFrame / 失败分类 / 路由任务 / 成本
// ============================================================

/** mock provider 能力矩阵（教学值；price = 每 1k token 单价） */
export interface ProviderSpec {
  id: string;
  toolCalling: boolean;
  structured: boolean;
  windowTokens: number;
  price: { input: number; output: number };
}

/** 可注入故障种类（相对 harness-demo 新增 error-frame / eof 两分支） */
export type FaultKind = "400" | "500" | "timeout" | "error-frame" | "eof";

/** SSE 帧（OpenAI 兼容协议的教学子集） */
export type SSEFrame =
  | { type: "delta"; content?: string; tool_calls?: { index: number; id?: string; name?: string; arguments?: string }[] }
  | { type: "usage"; input: number; output: number; model: string }
  | { type: "finish"; finish_reason: "stop" | "tool_calls" }
  | { type: "error"; message: string };

/** 流式解析后的一条 assistant 工具调用 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/** consumeStream 的产物 */
export interface StreamResult {
  content: string;
  toolCalls: ToolCall[];
  usage: { input: number; output: number; model: string } | null;
  incomplete: boolean;
}

/** 失败分类：4xx 契约违约 / 429 限流 / 5xx 服务错 / 超时 / refusal / 断流 */
export type FailureClass = "400" | "429" | "5xx" | "timeout" | "refusal" | "eof";

/** withRetry 的判定 */
export interface RetryDecision {
  retried: number;
  ok: boolean;
  diagnostic: string;
}

/** 路由任务的硬性要求（能力矩阵输入） */
export interface Task {
  needsToolCalling: boolean;
  needsStructured: boolean;
  minWindowTokens: number;
}

/** 成本聚合 */
export interface CostStep { model: string; cost: number; }
export interface CostReport { total: number; byModel: Record<string, number>; }