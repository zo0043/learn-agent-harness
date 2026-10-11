// ============================================================
// ② agent loop + ⑦ 恢复 的核心：guarded_tool_step
//    契约：policy → intent → execute → result（结果必回写，拒绝也是结果）
// ============================================================
import { callTool, ToolError, toolSchemas } from "./tools.js";
import type { ApprovalFn, Policy } from "./policy.js";
import { rebuild, type Session } from "./session.js";
import { compactIfNeeded } from "./context.js";
import { chatAny } from "./llm.js";
import type { Message, ToolCall, ToolSpec } from "./types.js";

export interface AgentOpts {
  system: string;
  user: string;
  registry: Map<string, ToolSpec>;
  policy: Policy;
  approval: ApprovalFn;
  session: Session;
  maxSteps?: number;
  compactThreshold?: number;
  /** demo：在 write_file 的 intent 记录后模拟崩溃（验证 ⑦ 恢复） */
  crashOnWriteIntent?: boolean;
  onDelta?: (d: { content?: string }) => void;
}

export interface AgentResult {
  final: string;
  ms: number;
  resumed: boolean;
}

export async function runAgent(o: AgentOpts): Promise<AgentResult> {
  const t0 = Date.now();

  // —— ⑥⑦ 启动：有日志就重建，处理未知状态 ——
  let messages: Message[];
  let resumed = false;
  if (o.session.exists()) {
    const { messages: rebuilt, unknownIntents } = rebuild(o.session.loadAll(), o.registry);
    messages = rebuilt;
    resumed = true;
    console.log(`[恢复] 从日志重建 ${messages.length} 条消息，未知状态工具调用 ${unknownIntents.length} 个`);
    for (const u of unknownIntents) {
      const spec = o.registry.get(u.name);
      if (spec?.readonly) {
        // 只读 → 安全重放
        const result = await callTool(o.registry, u.name, u.args);
        const content = `[恢复安全重放] ${result}`;
        messages.push({ role: "tool", tool_call_id: u.id, name: u.name, content });
        o.session.append({ kind: "tool_exec", id: u.id, name: u.name, status: "ok", result: content, ms: 0 });
      } else {
        // 非只读 → 不盲目重放；把状态摆给模型，让它先用只读工具核对现状
        const content = `[未知状态] ${u.name} 的执行结果未知（在 intent 与 result 之间崩溃）。请先用只读工具（read_file/list_dir）核对当前状态，再决定是否重放。`;
        messages.push({ role: "tool", tool_call_id: u.id, name: u.name, content });
        o.session.append({ kind: "tool_exec", id: u.id, name: u.name, status: "unknown-state", result: content, ms: 0 });
      }
    }
  } else {
    messages = [
      { role: "system", content: o.system },
      { role: "user", content: o.user },
    ];
    o.session.start(o.system, o.user);
  }

  const maxSteps = o.maxSteps ?? 15;
  for (let step = 1; step <= maxSteps; step++) {
    // —— ⑧ 预算检查 ——
    const c = await compactIfNeeded(messages, o.compactThreshold ?? 12000);
    if (c.summarized > 0) {
      messages = c.messages;
      o.session.append({ kind: "compaction", summarized: c.summarized, kept: messages.length });
      console.log(`[压缩] 摘要 ${c.summarized} 条消息，保留 ${messages.length} 条`);
    }

    // —— ② 调用模型（流式，边生成边显示） ——
    const r = await chatAny({
      messages,
      tools: toolSchemas(o.registry),
      stream: true,
      onDelta: o.onDelta,
    });
    o.session.append({
      kind: "model_response",
      assistant: r.assistant,
      finishReason: r.finishReason,
      ms: r.ms,
      usage: r.usage,
    });
    messages.push(r.assistant);

    // 没有工具调用 = 本轮结束
    if (!r.assistant.tool_calls?.length) {
      const final = r.assistant.content ?? "";
      o.session.append({ kind: "final", content: final, totalMs: Date.now() - t0 });
      return { final, ms: Date.now() - t0, resumed };
    }

    // —— ③⑤⑦ 逐个处理工具调用 ——
    for (const tc of r.assistant.tool_calls) {
      await guardedToolStep(o, messages, tc);
    }
  }
  // 预算耗尽：保存状态、如实暂停，不包装成成功（课程 harness 第九节）
  throw new Error(`达到最大步数 ${maxSteps}：状态已保存，可恢复续跑，不视为完成`);
}

/** 一个工具步的完整契约（课程第 3 节"三道门"的代码形态） */
async function guardedToolStep(o: AgentOpts, messages: Message[], tc: ToolCall) {
  // 防御：部分代理返回的工具名带首尾空白（qwen3.8-flash 2026-10-10 实测），不 trim 会注册表查不到
  const name = tc.name.trim();
  // 门 1+2：策略检查（deny/approve 都在这里，执行器之前）
  const { decision, reason } = o.policy.decide(name);
  if (decision === "deny") {
    const result = `[策略拒绝] ${reason}。你可以改用其他方式完成任务，或说明为什么需要该操作。`;
    messages.push({ role: "tool", tool_call_id: tc.id, name, content: result });
    o.session.append({ kind: "tool_exec", id: tc.id, name, status: "denied", result, ms: 0 });
    console.log(`  [策略] ${name} → deny（${reason}）`);
    return;
  }
  if (decision === "approve") {
    const ok = await o.approval(name, tc.arguments);
    if (!ok) {
      const result = `[审批未通过] 用户未批准该 ${name} 操作。`;
      messages.push({ role: "tool", tool_call_id: tc.id, name, content: result });
      o.session.append({ kind: "tool_exec", id: tc.id, name, status: "denied", result, ms: 0 });
      console.log(`  [策略] ${name} → 审批未通过`);
      return;
    }
    console.log(`  [策略] ${name} → 已批准（demo 自动批准）`);
  }

  // 门 3：先记 intent 再执行（⑦ 崩溃检测的关键：intent 在、exec 不在 = 未知状态）
  o.session.append({ kind: "tool_intent", id: tc.id, name, args: tc.arguments });

  if (o.crashOnWriteIntent && name === "write_file") {
    o.session.append({ kind: "crash", note: "demo：intent 已记录、result 未记录时模拟崩溃" });
    console.log("\n[崩溃演示] 模拟进程崩溃（日志里有 intent，没有 result）\n");
    process.exit(137);
  }

  const t0 = Date.now();
  try {
    const result = await callTool(o.registry, name, tc.arguments);
    messages.push({ role: "tool", tool_call_id: tc.id, name, content: result });
    o.session.append({ kind: "tool_exec", id: tc.id, name, status: "ok", result: result.slice(0, 2000), ms: Date.now() - t0 });
    console.log(`  [工具] ${name} ok（${Date.now() - t0}ms）`);
  } catch (e) {
    const result = e instanceof ToolError ? e.message : `执行异常: ${String(e)}`;
    messages.push({ role: "tool", tool_call_id: tc.id, name, content: result });
    o.session.append({ kind: "tool_exec", id: tc.id, name, status: "error", result, ms: Date.now() - t0 });
    console.log(`  [工具] ${name} 错误：${result}`);
  }
}
