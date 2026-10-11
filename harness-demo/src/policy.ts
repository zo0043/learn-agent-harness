// ============================================================
// ⑤ 权限门：在执行路径上检查，不在提示词里
//    优先级 deny > approve > allow；默认 = deny（安全默认，面试点）
// ============================================================

export type PolicyDecision = "allow" | "approve" | "deny";

/** 审批回调：生产是 human-in-the-loop（UI/IM 通知，可能等几分钟） */
export type ApprovalFn = (tool: string, args: Record<string, unknown>) => Promise<boolean>;

interface Rule {
  tools: string[];
  decision: PolicyDecision;
}

export class Policy {
  constructor(
    private rules: Rule[],
    private fallback: PolicyDecision = "deny", // 默认 deny：没写规则的工具一律不放行
  ) {}

  decide(tool: string): { decision: PolicyDecision; reason: string } {
    for (const d of ["deny", "approve", "allow"] as PolicyDecision[]) {
      const rule = this.rules.find((r) => r.decision === d && r.tools.includes(tool));
      if (rule) return { decision: d, reason: `命中规则: ${d}` };
    }
    return { decision: this.fallback, reason: "无匹配规则，默认拒绝" };
  }
}

export const DEMO_POLICY = new Policy([
  { tools: ["run_shell"], decision: "deny" }, // 硬禁止：演示模型如何被拒绝后继续
  { tools: ["write_file"], decision: "approve" }, // 副作用：需审批
  { tools: ["get_weather", "list_dir", "read_file"], decision: "allow" }, // 只读：放行
  // 注意：没列出的工具会落到 fallback=deny
]);

/** demo 审批：非交互。auto=false 模拟"人拒绝"（演示拒绝也是合法结果） */
export function makeApproval(auto: boolean): ApprovalFn {
  return async (tool, args) => {
    void tool;
    void args;
    return auto;
  };
}
