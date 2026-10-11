// ============================================================
// ② agent loop + ⑦ 恢复 的核心：guarded_tool_step
//    契约：policy → intent → execute → result（结果必回写，拒绝也是结果）
// ============================================================
import { SpanStatusCode, context, trace, type Context } from "@opentelemetry/api";
import { callTool, ToolError, toolSchemas } from "./tools.js";
import type { ApprovalFn, Policy } from "./policy.js";
import { rebuild, type Session } from "./session.js";
import { compactIfNeeded } from "./context.js";
import { chatAny, MODEL, type ChatResult } from "./llm.js";
import { GEN_AI_SYSTEM, tracer } from "./otel.js";
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

  // —— D 课 S2 OTel GenAI：轨迹树根 span（1 trace = 1 任务/会话，见 notes/observability.md S3）——
  const agentSpan = tracer.startSpan("invoke_agent", {
    attributes: {
      "gen_ai.operation.name": "invoke_agent",
      "gen_ai.agent.name": "harness-demo",
      "gen_ai.session.id": o.session.id,
    },
  });
  const agentCtx = trace.setSpan(context.active(), agentSpan);

  try {

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
      // —— D 课 S2：每次 LLM 调用 = 1 个 chat span（S3 树：挂在 invoke_agent 下）——
      const chatSpan = tracer.startSpan(
        "chat",
        {
          attributes: {
            "gen_ai.operation.name": "chat",
            "gen_ai.system": GEN_AI_SYSTEM,
            "gen_ai.request.model": MODEL,
          },
        },
        agentCtx
      );
      let r: ChatResult;
      try {
        r = await chatAny({
          messages,
          tools: toolSchemas(o.registry),
          stream: true,
          onDelta: o.onDelta,
        });
        // S2 关键属性：响应模型 / finish / token 用量
        if (r.responseModel) chatSpan.setAttribute("gen_ai.response.model", r.responseModel);
        if (r.finishReason) chatSpan.setAttribute("gen_ai.response.finish_reasons", [r.finishReason]);
        if (r.usage?.prompt_tokens != null) chatSpan.setAttribute("gen_ai.usage.input_tokens", r.usage.prompt_tokens);
        if (r.usage?.completion_tokens != null) chatSpan.setAttribute("gen_ai.usage.output_tokens", r.usage.completion_tokens);
        chatSpan.setStatus({ code: SpanStatusCode.OK });
      } catch (e) {
        chatSpan.recordException(e as Error);
        chatSpan.setStatus({ code: SpanStatusCode.ERROR, message: String(e) });
        throw e;
      } finally {
        chatSpan.end();
      }
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
        agentSpan.setStatus({ code: SpanStatusCode.OK });
        return { final, ms: Date.now() - t0, resumed };
      }

      // —— ③⑤⑦ 逐个处理工具调用 ——
      for (const tc of r.assistant.tool_calls) {
        await guardedToolStep(o, messages, tc, agentCtx);
      }
    }
    // 预算耗尽：保存状态、如实暂停，不包装成成功（课程 harness 第九节）
    throw new Error(`达到最大步数 ${maxSteps}：状态已保存，可恢复续跑，不视为完成`);
  } catch (e) {
    agentSpan.recordException(e as Error);
    agentSpan.setStatus({ code: SpanStatusCode.ERROR, message: String(e) });
    throw e;
  } finally {
    agentSpan.end();
  }
}

/** 一个工具步的完整契约（课程第 3 节"三道门"的代码形态） */
async function guardedToolStep(o: AgentOpts, messages: Message[], tc: ToolCall, agentCtx: Context) {
  // 防御：部分代理返回的工具名带首尾空白（qwen3.8-flash 2026-10-10 实测），不 trim 会注册表查不到
  const name = tc.name.trim();
  // —— D 课 S2：每次工具调用 = 1 个 execute_tool span（参数摘要先行，状态收尾）——
  const toolSpan = tracer.startSpan(
    "execute_tool",
    {
      attributes: {
        "gen_ai.operation.name": "execute_tool",
        "gen_ai.tool.name": name,
        "gen_ai.tool.call.id": tc.id,
        "gen_ai.tool.call.arguments": JSON.stringify(tc.arguments).slice(0, 500), // 参数摘要（S2）
      },
    },
    agentCtx
  );
  const endTool = (status: "ok" | "error" | "denied", result?: string, err?: unknown) => {
    toolSpan.setAttribute("harness.tool.status", status);
    if (result) toolSpan.setAttribute("gen_ai.tool.call.result", result.slice(0, 500)); // 结果摘要（S2）
    if (err) {
      toolSpan.recordException(err as Error);
      toolSpan.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
    } else {
      toolSpan.setStatus({ code: SpanStatusCode.OK });
    }
    toolSpan.end();
  };
  // 门 1+2：策略检查（deny/approve 都在这里，执行器之前）
  const { decision, reason } = o.policy.decide(name);
  if (decision === "deny") {
    const result = `[策略拒绝] ${reason}。你可以改用其他方式完成任务，或说明为什么需要该操作。`;
    messages.push({ role: "tool", tool_call_id: tc.id, name, content: result });
    o.session.append({ kind: "tool_exec", id: tc.id, name, status: "denied", result, ms: 0 });
    console.log(`  [策略] ${name} → deny（${reason}）`);
    endTool("denied", result);
    return;
  }
  if (decision === "approve") {
    const ok = await o.approval(name, tc.arguments);
    if (!ok) {
      const result = `[审批未通过] 用户未批准该 ${name} 操作。`;
      messages.push({ role: "tool", tool_call_id: tc.id, name, content: result });
      o.session.append({ kind: "tool_exec", id: tc.id, name, status: "denied", result, ms: 0 });
      console.log(`  [策略] ${name} → 审批未通过`);
      endTool("denied", result);
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
    endTool("ok", result);
  } catch (e) {
    const result = e instanceof ToolError ? e.message : `执行异常: ${String(e)}`;
    messages.push({ role: "tool", tool_call_id: tc.id, name, content: result });
    o.session.append({ kind: "tool_exec", id: tc.id, name, status: "error", result, ms: Date.now() - t0 });
    console.log(`  [工具] ${name} 错误：${result}`);
    endTool("error", result, e);
  }
}
