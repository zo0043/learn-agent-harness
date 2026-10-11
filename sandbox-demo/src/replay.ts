// ============================================================
// S6 重放引擎：剧本 → 逐条 policy 判定 + 沙箱内执行 → 转录（纯函数，确定性）
//   验收（S6）：同一剧本跑 N 次输出逐字节相同 = 系统行为可复现
// ============================================================
import { createHash } from "node:crypto";
import type { Status, ToolCall } from "./types.js";
import { BoundaryViolation, ToolError } from "./types.js";
import type { Approver, Policy } from "./policy.js";
import { execTool, type ExecCtx } from "./tools.js";
import type { Sandbox } from "./sandbox.js";
import type { World } from "./sandbox.js";

export type StepTrace = {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  channel: string;
  ruleId: string | null;
  status: Status;
  detail: string;
  output?: string;
};

export interface Transcript {
  steps: StepTrace[];
  lines: string[];
}

export interface RunConfig {
  label: string;
  script: ToolCall[];
  policy: Policy;
  approver: Approver;
  host: World;
  hostEnv: Record<string, string>;
  sandbox: Sandbox | null; // null = 无沙箱层（E 课之前：动作面 = 本机 root）
}

const MARK: Record<Status, string> = { ok: "✅", denied: "⛔", blocked: "🚫", error: "❌" };

/** 捕获执行期异常 → 变成可回写的结果（拒绝/拦截/错误都是合法结果，A③） */
function runExec(fn: () => string): { status: Status; detail: string; output?: string } {
  try {
    return { status: "ok", detail: "", output: fn() };
  } catch (e) {
    if (e instanceof BoundaryViolation) return { status: "blocked", detail: `边界违规[${e.kind}]: ${e.message}` };
    if (e instanceof ToolError) return { status: "error", detail: `工具错误: ${e.message}` };
    return { status: "error", detail: `执行异常: ${String(e)}` };
  }
}

/** 跑一遍剧本，生成转录（输入相同 → 输出逐字节相同） */
export function runScript(cfg: RunConfig): Transcript {
  const header = cfg.sandbox
    ? `[四通道 policy + 沙箱] workspace=${cfg.sandbox.config.workspace} ns=${cfg.sandbox.world.ns}`
    : `[仅 A⑤ 权限门] 无沙箱层（动作面=本机 root）`;
  const lines: string[] = [`${cfg.label} ${header}`];
  const steps: StepTrace[] = [];
  cfg.script.forEach((call, i) => {
    const v = cfg.policy.decide(call.tool, call.args);
    lines.push(`  ${i + 1}. ${call.id} ${call.tool} ${JSON.stringify(call.args)}`);
    if (call.note) lines.push(`     剧本注: ${call.note}`);
    lines.push(`     policy → ${v.channel} | ${v.reason}`);

    const ctx: ExecCtx = { host: cfg.host, sandbox: null, hostEnv: cfg.hostEnv, step: i + 1 };
    let status: Status;
    let detail = "";
    let output: string | undefined;
    if (v.channel === "deny") {
      status = "denied";
      detail = "策略拒绝，结果回写（拒绝也是合法结果）";
    } else if (v.channel === "approve") {
      const ap = cfg.approver(call.tool, call.args);
      detail = `审批表: ${ap.note}`;
      if (!ap.approved) {
        status = "denied";
        detail += " → 未获批准，不执行";
      } else {
        ctx.sandbox = cfg.sandbox;
        const r = runExec(() => execTool(call.tool, call.args, ctx));
        status = r.status;
        detail += ` → 已批; ${r.detail || "执行成功"}`;
        output = r.output;
      }
    } else if (v.channel === "sandbox" && !cfg.sandbox) {
      status = "blocked";
      detail = "命中 sandbox 通道但没有沙箱实例（配置错误）";
    } else {
      // allow 直接执行 / sandbox 在隔离环境内执行；有沙箱时边界恒生效（S1：沙箱是执行环境，不是可选项）
      ctx.sandbox = cfg.sandbox;
      const r = runExec(() => execTool(call.tool, call.args, ctx));
      status = r.status;
      output = r.output;
      detail = r.detail || (v.channel === "sandbox" ? `隔离环境内执行（ns=${cfg.sandbox!.world.ns}）` : cfg.sandbox ? "沙箱边界内执行" : "直接执行（无沙箱）");
    }
    lines.push(`     执行 → ${MARK[status]} ${status} | ${detail}`);
    if (output !== undefined) lines.push(`     结果: ${output}`);
    steps.push({ id: call.id, tool: call.tool, args: call.args, channel: v.channel, ruleId: v.ruleId, status, detail, output });
  });
  // 状态变更日志（审计底账，S5）
  for (const w of cfg.sandbox ? [cfg.host, cfg.sandbox.world] : [cfg.host]) {
    lines.push(`     状态日志(ns=${w.ns}): ${w.log.length ? w.log.join(" / ") : "（无状态变更）"}`);
  }
  return { steps, lines };
}

export function transcriptToString(t: Transcript): string {
  return [...t.lines, ""].join("\n");
}

export function sha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

/** S6 验收：跑 N 次逐字节一致（第 1 次为 golden，其余与 golden 做 diff） */
export function assertDeterministic(label: string, runOnce: () => string, times = 3): { ok: boolean; hash: string; lines: string[] } {
  const golden = runOnce();
  const hash = sha256(golden);
  const lines: string[] = [`${label}: run 1 (golden) sha256=${hash}`];
  let ok = true;
  for (let i = 2; i <= times; i++) {
    const t = runOnce();
    if (t === golden) {
      lines.push(`  run ${i} vs golden → 逐字节一致 ✅`);
      continue;
    }
    ok = false;
    const a = golden.split("\n");
    const b = t.split("\n");
    const d0 = a.findIndex((x, j) => x !== (b[j] ?? undefined)); // b 更长时 findIndex=-1，取 a 长度
    const d = d0 === -1 ? a.length : d0;
    lines.push(`  run ${i} vs golden → 存在 diff ❌（首处 diff 行 ${d + 1}）`);
    lines.push(`    golden: ${JSON.stringify(a[d] ?? "<EOF>")}`);
    lines.push(`    本次  : ${JSON.stringify(b[d] ?? "<EOF>")}`);
  }
  return { ok, hash, lines };
}
