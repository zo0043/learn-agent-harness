// ============================================================
// ⑤ 最小 agent loop：模型 ↔ mock MCP server，防御层插在执行路径上
//   对照组 = 全关；防御组 = 按 config 开 L1/L2/L3（L4 恒开）。
//   关键结构：工具调用 = intent → 各层裁决（全过才执行）→ 结果（L1 作用于返回）
// ============================================================
import type { DefenseConfig, GateVerdict, Message, ModelStep, RunReport, ToolMessage, ToolSpec } from "./types.js";
import { AuditLog, EgressGate, classifyTool, consultApproval, sanitizeToolOutput } from "./defense.js";

export interface RunOpts {
  name: string;
  user: string;
  tools: ToolSpec[];
  model: { decide(h: Message[]): ModelStep };
  config: DefenseConfig;
  outbox: string[];
}

export async function runAgent(opts: RunOpts): Promise<RunReport> {
  const audit = new AuditLog();
  const egress = new EgressGate();
  const verdicts: GateVerdict[] = [];
  const history: Message[] = [{ role: "user", content: opts.user }];
  let final = "";
  audit.log("user", opts.user);

  for (let step = 0; step < 8; step++) {
    const stepRes = opts.model.decide(history);
    if (stepRes.kind === "final") {
      final = stepRes.content ?? "";
      audit.log("final", final);
      break;
    }
    const call = stepRes.tool!;
    const tool = opts.tools.find((t) => t.name === call.name);
    audit.log("model_call", `${call.name}(${JSON.stringify(call.arguments)})`);
    if (!tool) {
      history.push({ role: "tool", tool_call_id: call.id, name: call.name, content: "已拦截（未执行）: 未知工具" });
      continue;
    }

    // 各层独立裁决，全过才执行（defense in depth：每层都能单独拦）
    const local: GateVerdict[] = [];
    if (opts.config.policyGate) {
      const cls = classifyTool(tool);
      if (cls === "approve") {
        const a = consultApproval(String(call.arguments.to ?? ""));
        local.push({
          layer: "L2 policy 门",
          passed: a.decision === "allow",
          reason: a.decision === "allow" ? a.reason : `高危工具需审批，被拒: ${a.reason}`,
        });
      } else {
        local.push({ layer: "L2 policy 门", passed: cls === "allow", reason: `工具分级 = ${cls}` });
      }
    }
    if (opts.config.egress) local.push(egress.check(tool, call.arguments));

    for (const v of local) {
      audit.log("gate", `${v.layer} → ${v.passed ? "放行" : "拦截"}: ${v.reason}`);
      verdicts.push(v);
    }

    if (local.some((v) => !v.passed)) {
      // 拒绝 = 合法结果：写回上下文，模型如实处理（同 harness-demo 拒绝模式，不重试）
      const reason = local.filter((v) => !v.passed).map((v) => `${v.layer}: ${v.reason}`).join("; ");
      history.push({ role: "tool", tool_call_id: call.id, name: tool.name, content: `已拦截（未执行）: ${reason}` });
      continue;
    }

    // 执行 → L1 输入消毒作用于返回（进模型上下文之前）
    const raw = await tool.execute(call.arguments);
    let result = raw;
    if (opts.config.sanitize) {
      const s = sanitizeToolOutput(raw);
      const v: GateVerdict = {
        layer: "L1 输入消毒",
        passed: true,
        reason: s.quarantined ? `检出 ${s.hits} 处疑似注入，已隔离标记` : "未见注入模式，放行",
      };
      audit.log("gate", `${v.layer} → ${v.reason}`);
      verdicts.push(v);
      result = s.content;
    }
    audit.log("tool_exec", `${tool.name} → ${result.replaceAll("\n", " ⏎ ")}`);
    history.push({ role: "tool", tool_call_id: call.id, name: tool.name, content: result });
  }

  return {
    name: opts.name,
    config: opts.config,
    final,
    outbox: [...opts.outbox],
    verdicts,
    events: audit.all(),
    digest: audit.digest(),
  };
}
