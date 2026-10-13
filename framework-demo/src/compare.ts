// compare.ts —— 一条命令跑完三家 SDK 的同一白板任务，打印结构化对照
//
//   npm run compare
//
// 诚实标注：模型=本地 mock 端点（离线 mock 模型，非真实模型实跑）。
// 真实端点是否可用不是本对照的验收标准；live 实操见 npm run demo（需 .env，与对照无关）。
// 确定性：mock 是请求内容的纯函数（零时间/零随机），同一命令两次运行输出逐字节一致。
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runAllThree } from "./compare-run.js";
import { MOCK_MODEL } from "./sdks/task.js";
import { summarize, type UnifiedTrace } from "./sdks/task.js";

function toolCallLine(t: UnifiedTrace): string {
  const parts = t.toolCalls.map((c) => {
    const args = JSON.stringify(c.args ?? {});
    const flag = c.denied ? "deny" : c.approved ? "approved" : "auto";
    return `${c.name}(${args})→${flag}`;
  });
  return parts.join("  ·  ");
}

function sdkSection(idx: number, t: UnifiedTrace): string {
  const s = summarize(t);
  const lines: string[] = [];
  lines.push(`── ${["①", "②", "③"][idx - 1]} ${t.label}（${t.packageSpec}） ──`);
  lines.push(`  endpoint      ${t.baseUrl}  model=${t.model}`);
  lines.push(`  loop 归属      ${t.loopOwner}`);
  lines.push(`  模型调用      ${String(t.extra.modelCalls)} 次（全部打到本地 mock）`);
  lines.push(`  工具调用      ${t.toolCalls.length} 次（read=${s.readCalls} / gate=${s.gateCalls} / approve=${s.approveCalls}）`);
  lines.push(`    明细        ${toolCallLine(t)}`);
  const gate = t.toolCalls.find((c) => c.step === "gate");
  lines.push(`  权限拦截      ${gate ? gate.evidence : "（缺失！）"}`);
  lines.push(`  人工审批      ${t.paused ? "真挂起：决定权交还调用方" : "进程内回调（无框架级挂起）"}：${t.toolCalls.find((c) => c.step === "approve")?.evidence ?? ""}`);
  lines.push(`  中断/恢复     ${t.pauseEvidence}`);
  lines.push(`                ${t.resumeEvidence}`);
  lines.push(`  状态形态      ${t.stateShape}`);
  lines.push(`  可观测钩子    ${t.observability.hook}（事件 ${t.observability.events} 条：${t.observability.samples.join(" / ")}）`);
  lines.push(`  最终输出      ${t.finalText}`);
  lines.push("");
  return lines.join("\n");
}

const DIMENSIONS: Array<[string, (t: UnifiedTrace) => string]> = [
  ["loop 归属", (t) => t.loopOwner.split("（")[0]],
  ["工具与 schema 声明", (t) =>
    t.key === "claude-agent-sdk"
      ? "不声明函数工具：内置工具市场（Read/Bash）+ allowedTools/disallowedTools 过滤"
      : t.key === "openai-agents-sdk"
        ? "tool({ name, description, parameters: zod, strict: true })，schema 编译进请求"
        : "tool({ schema: zod }) + model.bindTools()，schema 编译进请求"],
  ["权限与 human-in-the-loop 钩子", (t) =>
    t.key === "claude-agent-sdk"
      ? "canUseTool 逐调用回调（进程内门，预执行拦截）"
      : t.key === "openai-agents-sdk"
        ? "无预执行权限门（策略在工具内/guardrail）；人工审批一等原语：needsApproval=true（run 在审批点停下）"
        : "无预执行权限门（策略在工具内）；人工审批一等原语：interrupt() 真挂起 → Command({ resume })"],
  ["状态与中断恢复", (t) =>
    t.key === "claude-agent-sdk"
      ? "会话 JSONL 落盘（$CLAUDE_CONFIG_DIR/projects/）；resume: session_id 重建历史续跑"
      : t.key === "openai-agents-sdk"
        ? "RunState 内存态（toJSON() 可序列化）；审批点 run 返回 → approve() → run(agent, state)"
        : "MemorySaver checkpointer 按 thread_id 存全量；interrupt() 挂起 → Command({ resume }) 续跑"],
  ["可观测钩子", (t) => t.observability.hook.split(" —— ")[0]],
];

async function main() {
  const { mock, traces } = await runAllThree();
  const fmt = (t: UnifiedTrace) => (t.extra.modelCalls as number);

  console.log("══ framework-demo · 三家 SDK 同任务离线对照 ══");
  console.log(`模型=${MOCK_MODEL} @ ${mock.anthropicBaseUrl}（本地 mock 端点）`);
  console.log("【诚实标注】离线 mock 模型，非真实模型实跑；断言全部在离线 mock 下可复现。真实端点可用性不是验收标准。");
  console.log("");
  console.log("── 白板任务（三家一字不改） ──");
  console.log("  ① 读 docs/research-notes.md 的标题（普通工具，自动放行）");
  console.log("  ② 申请删除 /tmp/fw-demo-trash（危险动作，权限策略拒绝）");
  console.log("  ③ 申请发布 out/whiteboard-note.md（需人工审批，批准后恢复并跑完）");
  console.log("");

  traces.forEach((t, i) => console.log(sdkSection(i + 1, t)));

  console.log("── 五维对照表（细节+file:line+文档 URL 见 docs/sdk-comparison.md） ──");
  console.log("维度                 | " + ["Claude Agent SDK", "OpenAI Agents SDK", "LangGraph"].map((h) => h.padEnd(18)).join(" | "));
  for (const [dim, fn] of DIMENSIONS) {
    const cells = traces.map((t) => fn(t));
    console.log(dim.padEnd(18, "　") + " | " + cells.join(" | "));
  }
  console.log("");
  console.log("── 结论 ──");
  console.log(`  工具调用次数  三家各 ${traces.map((t) => String(t.toolCalls.length)).join(" / ")} 次；模型调用 ${traces.map((t) => String(fmt(t))).join(" / ")} 次（同一任务，调用形状一致）`);
  console.log(`  权限拦截      三家 gate 均被策略拒绝且删除动作未生效（机制不同：预执行拦截 vs 函数内策略）`);
  console.log("  中断/恢复     OpenAI=RunState 审批挂起+恢复 | LangGraph=checkpointer interrupt+resume | Claude=进程内审批回调+会话 resume");
  console.log(`  消息/状态形态 OpenAI/LangGraph 最终请求带 3 条 tool 结果；Claude 会话 JSONL 落盘全量转录`);

  // 机器可读轨迹（确定性内容，无 UUID/时间戳）：compare:assert 子进程跑完后读它做断言。
  // 运行态产物，已 gitignore。
  writeFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "..", ".compare-trace.json"), JSON.stringify({ model: MOCK_MODEL, traces }, null, 2));
  await mock.close();
}

main().catch((e) => {
  console.error("compare 失败：", e instanceof Error ? e.message : e);
  process.exit(1);
});
