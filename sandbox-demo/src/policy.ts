// ============================================================
// S2 四通道 policy 引擎：allow/approve/deny/sandbox（课程 S2 权威定义）
//   approve 离线 = 预置审批表（makeApprover）；冲突 deny>approve>sandbox>allow；
//   默认 = deny（安全默认，沿用 A⑤：没写规则的工具一律不放行）
// ============================================================
import type { Channel, Rule, Verdict } from "./types.js";
import { CHANNEL_PRIORITY } from "./types.js";

export class Policy {
  constructor(
    private rules: Rule[],
    private fallback: Channel = "deny", // 默认 deny：没写规则的工具一律不放行（安全默认，教学点）
  ) {}

  decide(tool: string, args: Record<string, unknown>): Verdict {
    for (const ch of CHANNEL_PRIORITY) {
      for (const r of this.rules) {
        if (r.channel !== ch || !r.tools.includes(tool)) continue;
        if (r.when && !r.when(args)) continue;
        return { channel: ch, ruleId: r.id, reason: `命中规则 ${r.id}（${r.note ?? ch}）` };
      }
    }
    return { channel: this.fallback, ruleId: null, reason: "无匹配规则，默认 deny（安全默认）" };
  }
}

/** 审批记录（离线：human-in-the-loop → 预置审批表，审批结果固定，重放确定） */
export interface Approval {
  tool: string;
  when?: (args: Record<string, unknown>) => boolean;
  decision: "approved" | "rejected";
  note: string;
}

export type Approver = (tool: string, args: Record<string, unknown>) => { approved: boolean; note: string };

/** 从预置审批表构造审批回调（生产换成 UI/IM 通知，可能等几分钟） */
export function makeApprover(table: Approval[]): Approver {
  return (tool, args) => {
    const hit = table.find((a) => a.tool === tool && (!a.when || a.when(args)));
    if (!hit) return { approved: false, note: "无审批记录，默认按拒绝处理（安全默认）" };
    return { approved: hit.decision === "approved", note: hit.note };
  };
}
