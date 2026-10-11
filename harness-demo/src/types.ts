// ============================================================
// 类型定义 —— 对应课程：② loop / ③ 工具协议 / ⑥⑦ 会话 / ⑨ 轨迹
// ============================================================

/** 模型生成的一次工具调用请求（注意：请求 ≠ 执行，见课程第 1 节） */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AssistantMessage {
  role: "assistant";
  content: string | null;
  tool_calls?: ToolCall[];
}

/** 工具结果回写消息：成功/错误/拒绝 都是合法结果（课程 ③） */
export interface ToolMessage {
  role: "tool";
  tool_call_id: string;
  name?: string;
  content: string;
}

export type Message =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | AssistantMessage
  | ToolMessage;

/** 工具声明：schema + 执行器。readonly 供 ⑦ 恢复时判断能否安全重放 */
export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema（教学子集）
  readonly?: boolean;
  execute(args: Record<string, unknown>): Promise<string>;
}

/** 轨迹事件（JSONL 一行一条）：日志是唯一事实源，上下文由日志派生（课程 ⑥） */
export type TrajectoryEvent =
  | { kind: "init"; system: string; user: string; startedAt: number }
  | { kind: "model_response"; assistant: AssistantMessage; finishReason: string; ms: number; usage?: { prompt_tokens?: number; completion_tokens?: number } }
  | { kind: "tool_intent"; id: string; name: string; args: Record<string, unknown> }
  | { kind: "tool_exec"; id: string; name: string; status: "ok" | "error" | "denied" | "unknown-state"; result?: string; ms: number }
  | { kind: "compaction"; summarized: number; kept: number }
  | { kind: "final"; content: string; totalMs: number }
  | { kind: "crash"; note: string };
