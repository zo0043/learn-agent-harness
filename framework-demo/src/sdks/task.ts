// task.ts —— 三家 SDK 共用的「同一白板任务」契约 + 归一化轨迹类型
//
// 白板任务（同一个，三家一字不改）：
//   ① 读 docs/research-notes.md 的第一行标题          → 普通工具调用（自动放行）
//   ② 申请删除 /tmp/fw-demo-trash                    → 危险动作，被权限策略**拒绝**（工具不执行）
//   ③ 申请执行一个需要人类审批的动作                  → 运行**挂起**，人类批准后**恢复**并跑完
//
// 之所以能用同一个任务压三家：mock 模型是按「已经回填了几条工具结果」决定下一步的
// （见 src/mock-model.ts），与具体 SDK 无关；SDK 之间只差「谁拥有 loop / 怎么声明工具 /
// 怎么拦权限 / 怎么持久化状态 / 怎么吐可观测事件」。

export const DOC_PATH = "docs/research-notes.md";
export const DOC_TITLE = "边缘缓存调研笔记";
export const GATE_PATH = "/tmp/fw-demo-trash";
export const APPROVAL_PATH = "out/whiteboard-note.md";
export const MOCK_MODEL = "mock-whiteboard-v1";

/** 三家一字不改的白板任务提示词（同一输入，才能对照框架差异） */
export const WHITEBOARD_PROMPT =
  "白板任务，按顺序做三件事：" +
  `1) 读 ${DOC_PATH} 的标题；` +
  `2) 申请删除 ${GATE_PATH}；` +
  `3) 申请发布 ${APPROVAL_PATH}。` +
  "全部处理完后用中文一句话收尾。";

/** 危险动作被策略拒绝时回给模型的固定文本（三家同文案 → 上下文形态可对照） */
export const DENY_MESSAGE =
  `权限策略拒绝：禁止对 ${GATE_PATH} 执行删除（framework-demo 白板任务的策略拦截，动作未执行）`;

/** read 步工具函数（OpenAI/LangGraph 侧，Claude 侧走内置 Read）的固定返回 */
export const READ_RESULT = `文档标题：${DOC_TITLE}（2026-Q3）`;

/** publish 步工具函数执行后的固定返回 */
export const PUBLISH_RESULT = `已发布 ${APPROVAL_PATH}（mock：仅记录动作，未写真实文件）`;

/** 三家共用的逻辑工具名（Claude 侧同名工具走内置工具市场，故 mock 会退化到 Read/Bash） */
export const TOOL_NAMES = { read: "read_doc", gate: "delete_temp", approve: "publish_note" } as const;

export type Step = "read" | "gate" | "approve";

/** 归一化的单次工具调用记录（三家同一结构，才能对照） */
export interface ToolCallRecord {
  step: Step;
  /** 该 SDK 里这个动作的**真实工具名**（Claude 是 Read/Bash，另两家是函数工具名） */
  name: string;
  args: unknown;
  /** 工具函数/内置工具是否真的被执行了（产出了 tool_result） */
  executed: boolean;
  /** 危险/副作用动作是否**真的生效**（删除是否发生、发布是否落定）。三家 gate 步恒为 false，这是可比不变量 */
  actionPerformed: boolean;
  /** 是否被权限层拒绝（Claude=canUseTool 预执行拦截；OpenAI/LangGraph=策略写在工具函数内、调用后拒绝） */
  denied: boolean;
  /** 是否经过人工审批后放行 */
  approved: boolean;
  /** 该次调用的人类可读证据（谁在什么钩子里做的决定） */
  evidence: string;
}

export interface ObservabilityRecord {
  /** 可观测钩子的名字（三家各不相同，这本身就是对照结论） */
  hook: string;
  /** 收到的结构化事件条数 */
  events: number;
  /** 头几条事件的样例（确定性：来自 mock 固定响应） */
  samples: string[];
}

/** 三家的统一轨迹：compare.ts 只认这个结构，断言也只看它 */
export interface UnifiedTrace {
  key: "claude-agent-sdk" | "openai-agents-sdk" | "langgraph";
  label: string;
  packageSpec: string;
  /** 全部指向本地 mock 端点——"离线可跑"的直接证据 */
  baseUrl: string;
  model: string;
  /** loop 归属：SDK 内置 / 图引擎 / 调用方 */
  loopOwner: string;
  toolCalls: ToolCallRecord[];
  finalText: string;
  /** 最终上下文里的消息条数（状态形态的量化面） */
  messageCount: number;
  /** 状态形态的定性描述（谁持有状态、存在哪） */
  stateShape: string;
  /** 是否发生了真正的挂起（把决定权交还调用方） */
  paused: boolean;
  /** 挂起后是否恢复并跑完 */
  resumed: boolean;
  pauseEvidence: string;
  resumeEvidence: string;
  observability: ObservabilityRecord;
  extra: Record<string, string | number | boolean>;
}

export function stepOfToolCall(step: Step): Step { return step; }

/** 由轨迹抽取三条对照断言都要用的量 */
export function summarize(t: UnifiedTrace) {
  const byStep = (s: Step) => t.toolCalls.filter((c) => c.step === s);
  return {
    readCalls: byStep("read").length,
    gateCalls: byStep("gate").length,
    approveCalls: byStep("approve").length,
    /** 权限拦截的三家可比不变量：gate 被策略拒绝，且危险动作未生效（不要求"未执行"——
     *  Claude 预执行拦截=未执行，OpenAI/LangGraph 策略在函数内=执行后拒绝，机制不同但动作都没发生） */
    gateActionBlocked: byStep("gate").every((c) => c.denied && !c.actionPerformed),
    approveCompleted: byStep("approve").every((c) => c.approved && c.executed && c.actionPerformed),
    executed: t.toolCalls.filter((c) => c.executed).length,
    denied: t.toolCalls.filter((c) => c.denied).length,
  };
}
