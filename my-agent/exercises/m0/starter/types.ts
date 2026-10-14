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