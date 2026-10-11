// ============================================================
// 类型定义 —— 对应 沙箱与凭据：S2 四通道 policy / S3 边界 / S5 审计 / S6 可复现
// ============================================================

/** 四通道：每个工具调用落到且仅落到一个通道（S2 权威定义） */
export type Channel = "allow" | "approve" | "deny" | "sandbox";

/**
 * 冲突优先级：deny > approve > sandbox > allow
 * 课程 S2 未给出四通道冲突顺序，这里由 A⑤ 的 deny>approve>allow 扩展：
 * sandbox 是"更受限的执行方式"，插在 approve 与 allow 之间（隔离更多者优先，安全默认）
 */
export const CHANNEL_PRIORITY: readonly Channel[] = ["deny", "approve", "sandbox", "allow"];

/** 一条 policy 规则：按 (tool, args) 匹配；when 是参数级匹配器（确定性，可离线） */
export interface Rule {
  id: string;
  channel: Channel;
  tools: string[];
  when?: (args: Record<string, unknown>) => boolean;
  note?: string;
}

/** policy 判定结果 */
export interface Verdict {
  channel: Channel;
  ruleId: string | null; // null = 没命中规则，落到 fallback
  reason: string;
}

/** 剧本里的一次工具调用（非模型生成——S2：不调模型，策略层作为确定性代码独立验证） */
export interface ToolCall {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  note?: string; // 该步背景（剧本旁白）
}

/** 执行结果状态：拒绝/边界拦截也是合法结果，必须回写（A③） */
export type Status = "ok" | "denied" | "blocked" | "error";

/** 工具执行错误（执行器自身出错，区别于 policy 拒绝与边界拦截） */
export class ToolError extends Error {}

/** 边界违规：由沙箱层抛出（S1：权限门管意图，沙箱管执行的影响范围） */
export class BoundaryViolation extends Error {
  constructor(readonly kind: "path" | "env" | "network", message: string) {
    super(message);
    this.name = "BoundaryViolation";
  }
}

/** 沙箱配置（S3：网络是最难关的一档 → egress 默认禁用；凭据不进可见 env，S4） */
export interface SandboxConfig {
  workspace: string; // 路径边界：会话的逻辑根目录
  envWhitelist: string[]; // env 边界：只有白名单可见
  network: "deny"; // 网络边界：egress 默认禁用
}
