// ============================================================
// 公共类型底座 —— M0（全 milestone 复用，给全不挖）
// ============================================================

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export type Message =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[] }
  | { role: 'tool'; tool_call_id: string; name: string; content: string };

export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  readonly?: boolean;
  execute(args: Record<string, unknown>): Promise<string>;
}

/** m0.1 的产物：解析后的「下一步动作」两种形态 */
export type Action =
  | { kind: 'tool_call'; name: string; args: Record<string, unknown> }
  | { kind: 'deliver'; content: string };

// ── M1 新增 ─────────────────────────────────────────────
/** JSONL 会话事件（JSONL 一行一条；上下文由日志派生，不是另存） */
export type TrajectoryEvent =
  | { kind: 'init'; system: string; user: string }
  | { kind: 'assistant'; tool_calls?: ToolCall[]; deliver?: string }
  | { kind: 'tool_exec'; id: string; name: string; status: 'ok' | 'denied' | 'error'; result?: string }
  | { kind: 'final'; content: string };

/** 未完成的练习点占位（M1 起跨文件共享；补全后删除对应 throw） */
export class TODOError extends Error {}