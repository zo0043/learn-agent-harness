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

// ── M2 新增 ─────────────────────────────────────────────
/** 四通道：每个工具调用落到且仅落到一个通道 */
export type Channel = 'allow' | 'approve' | 'deny' | 'sandbox';
/** 冲突优先级：deny > approve > sandbox > allow（sandbox 插在 approve 与 allow 之间） */
export const CHANNEL_PRIORITY: readonly Channel[] = ['deny', 'approve', 'sandbox', 'allow'];
/** 一条 policy 规则：按 (tool, args) 匹配；when 是参数级匹配器（确定性，可离线） */
export interface Rule {
  id: string;
  channel: Channel;
  tools: string[];
  when?: (args: Record<string, unknown>) => boolean;
  note?: string;
}
/** policy 判定结果；ruleId=null 表示没命中规则、落到 fallback */
export interface Verdict {
  channel: Channel;
  ruleId: string | null;
  reason: string;
}
/** 边界违规：由沙箱层抛出（权限门管意图，沙箱管执行的影响范围） */
export class BoundaryViolation extends Error {
  constructor(readonly kind: 'path' | 'env' | 'network', message: string) {
    super(message);
    this.name = 'BoundaryViolation';
  }
}
/** 沙箱配置：workspace=路径根 / envWhitelist=env 白名单 / network 默认禁用 */
export interface SandboxConfig {
  workspace: string;
  envWhitelist: string[];
  network: 'deny';
}
/** golden 题：文本锚点（8-20 字 distinctive 中文子串，非行号/id 指针） */
export interface GoldenQ {
  q: string;
  anchors: string[];
  note?: string;
  outOfScope?: boolean;
}
/** 审计事件（seq 用逻辑计数器，不落墙钟） */
export interface AuditEvent {
  seq: number;
  kind: string;
  detail: string;
}
/** 防御层门禁结果 */
export interface GateVerdict {
  layer: string;
  passed: boolean;
  reason: string;
}
/** 四层防御开关 */
export interface DefenseConfig {
  sanitize: boolean;
  policyGate: boolean;
  egress: boolean;
}
// ── M3 新增 ─────────────────────────────────────────────
/** 工具三分法：执行两次对外部世界最终状态是否与一次相同 */
export type StepKind = "readonly" | "idempotent" | "nonidempotent";
/** 崩溃注入点：A intent 前 / B intent 后 exec 前 / C exec 后未落盘 */
export type CrashPoint = "A" | "B" | "C";
/** 恢复处置（S8.2 判定表） */
export type Disposition = "skip" | "replay" | "unknown-confirm-exec" | "unknown-confirm-skip";
/** 一步计划（逻辑步序号，不落墙钟） */
export interface StepSpec { step: number; name: string; kind: StepKind; tool: string; args: Record<string, unknown>; idemKey: string; crashTarget?: boolean; }
/** journal 事件（细粒度唯一事实源：intent→exec 双锚点） */
export interface JournalIntent { seq: number; kind: "intent"; step: number; name: string; stepKind: StepKind; tool: string; args: Record<string, unknown>; idemKey: string; }
export interface JournalExec { seq: number; kind: "exec"; step: number; name: string; result: string; sideEffect: boolean; }
export type JournalEvent = JournalIntent | JournalExec;
/** 快照里的「已完成一步」（粗粒度 checkpoint） */
export interface CheckpointDone { step: number; name: string; stepKind: StepKind; result: string; sideEffect: boolean; }
export interface Checkpoint { version: 1; seq: number; lastStep: number; done: CheckpointDone[]; checksum: string; }
/** 恢复判定（一步） */
export interface Decision { step: StepSpec; disposition: Disposition; detail: string; execute: boolean; }
/** 恢复报告（验收对象） */
export interface RecoveryReport { crashPoint: CrashPoint; steps: Decision[]; sideEffects: { messageDeliveries: number }; idempotentWrite: { key: string; value: string }; }
/** SSE 帧（OpenAI 兼容协议教学子集） */
export type SSEFrame =
  | { type: "delta"; content?: string; tool_calls?: { index: number; id?: string; name?: string; arguments?: string }[] }
  | { type: "usage"; input: number; output: number; model: string }
  | { type: "finish"; finish_reason: "stop" | "tool_calls" }
  | { type: "error"; message: string };
/** 流式解析产物（toolCalls 复用 M0 ToolCall） */
export interface StreamResult { content: string; toolCalls: ToolCall[]; usage: { input: number; output: number; model: string } | null; incomplete: boolean; }
/** mock provider 能力矩阵（price = 每 1k token 单价） */
export interface ProviderSpec { id: string; toolCalling: boolean; structured: boolean; windowTokens: number; price: { input: number; output: number }; }
/** 路由任务的硬性要求 */
export interface Task { needsToolCalling: boolean; needsStructured: boolean; minWindowTokens: number; }
/** 失败分类 */
export type FailureClass = "400" | "429" | "5xx" | "timeout" | "refusal" | "eof";
/** withRetry 判定 */
export interface RetryDecision { retried: number; ok: boolean; diagnostic: string; }
/** 成本聚合 */
export interface CostStep { model: string; cost: number; }
export interface CostReport { total: number; byModel: Record<string, number>; }
/** 轻量 span 树节点（主线自建，不引 @opentelemetry） */
export interface SpanNode { name: string; attrs: Record<string, unknown>; children: SpanNode[]; }
