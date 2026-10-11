// ============================================================
// ① 类型定义 —— 对应 I 课 S4：MCP 投毒攻击 + 四层防御
// ============================================================

/** MCP 工具声明（对应 A 课 ③ ToolSpec：MCP 标准化的是这一层，不是权限/执行层） */
export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema（教学子集）
  /** 风险分级：read=只读 / write=副作用 / egress=外发通道（policy 门与 egress 门据此管辖） */
  risk?: "read" | "write" | "egress";
  execute(args: Record<string, unknown>): Promise<string>;
}

/** 模型生成的一次工具调用请求（请求 ≠ 执行，harness 课第 1 节） */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/** 工具结果回写消息：成功/错误/拒绝都是合法结果（harness 课 ③） */
export interface ToolMessage {
  role: "tool";
  tool_call_id: string;
  name: string;
  content: string;
}

export type Message =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_call?: ToolCall }
  | ToolMessage;

/** 模型的一次决策：请求工具调用，或输出最终答案 */
export interface ModelStep {
  kind: "tool" | "final";
  tool?: ToolCall;
  content?: string;
}

/**
 * 审计事件（L4 层）：唯一事实源、可重放（同 harness-demo trajectory 思想）。
 * 注意：故意不放时间戳——事件序列是输入序列的纯函数，这是确定性重放的基础。
 */
export interface AuditEvent {
  seq: number;
  kind: "user" | "model_call" | "gate" | "tool_exec" | "final";
  detail: string;
}

/** 单个防御层对一次工具调用的裁决 */
export interface GateVerdict {
  layer: string; // "L1 输入消毒" / "L2 policy 门" / "L3 沙箱断言"
  passed: boolean;
  reason: string;
}

/** 各防御层开关（L4 审计恒开——它也是本 demo 确定性的底座） */
export interface DefenseConfig {
  sanitize: boolean;   // L1 输入消毒：工具输出中的指令模式检测+隔离标记（S4.4 输入层/CDR）
  policyGate: boolean; // L2 policy 门：高危工具走审批通道（S4.4 执行层/Intent Gate）
  egress: boolean;     // L3 沙箱断言：外发通道白名单（S4.4 执行层/沙箱+egress）
}

/** 一次完整运行的报告（一组 = 对照组或某个防御配置） */
export interface RunReport {
  name: string;
  config: DefenseConfig;
  final: string;
  outbox: string[]; // mock SMTP 发件箱：非空 = 攻击的外泄邮件真的"发出"（攻击得逞证据）
  verdicts: GateVerdict[];
  events: AuditEvent[];
  digest: string; // 规范化事件的 FNV-1a 摘要（重放断言用）
}
