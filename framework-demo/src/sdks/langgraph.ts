// langgraph.ts —— LangGraph 侧的白板任务实现（离线 mock 端点）
//
// 对照要点（详见 docs/sdk-comparison.md）：
//   · loop 归属：图引擎——StateGraph 的节点/边/条件路由就是 loop，
//     LLM 客户端（ChatOpenAI）只负责"被调一次"；loop 的每一步都显式画在图上。
//   · 工具与 schema：@langchain/core/tools 的 tool({ schema: zod }) + model.bindTools()，
//     schema 由 langchain 编进请求的 tools[]。
//   · 权限与 HITL：函数工具没有预执行权限门（危险策略写在工具实现内）；
//     人工审批是一等原语：interrupt() 在节点内**真的挂起**——
//     状态写进 checkpointer，决定权交还调用方，Command({ resume }) 续跑。
//   · 状态与中断恢复：MemorySaver（checkpointer）按 thread_id 存全量状态；
//     挂起后 getState() 能看到中断点（tasks[].interrupts），同 thread 可续跑。
//   · 可观测：graph.streamEvents(v2) 事件流（on_chat_model_* / on_tool_* / on_chain_*）。
//
// 实现注记（踩坑，2026-10-12 实测）：
//   ① mock 的响应 id 必须是请求的纯函数且唯一——LangGraph 的 addMessages reducer
//      按 message id 合并，两条 AI 消息同 id 会互相顶掉，loop 直接断掉。
//   ② interrupt() 续跑时节点从函数头重放，interrupt() 直接返回 resume 值；
//      所以中断点之前的副作用必须幂等（本任务 mock 每步只带 1 个工具调用，安全）。
//   ③ 状态通道用官方预置 MessagesAnnotation（1.x 里 Annotation.Root 不再有 reducer 工厂）。
import { StateGraph, MessagesAnnotation, START, END, interrupt, Command, MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import {
  type UnifiedTrace, type ToolCallRecord,
  WHITEBOARD_PROMPT, DENY_MESSAGE, READ_RESULT, PUBLISH_RESULT, MOCK_MODEL,
} from "./task.js";
import type { MockServer } from "../mock-model.js";

type State = typeof MessagesAnnotation.State;

export async function runLangGraphTrace(mock: MockServer): Promise<UnifiedTrace> {
  const llm = new ChatOpenAI({
    model: MOCK_MODEL,
    apiKey: "mock-key",
    configuration: { baseURL: mock.openaiBaseUrl },
    temperature: 0,
  });

  const toolCalls: ToolCallRecord[] = [];
  const readDoc = tool(
    async (args: { path: string }) => {
      toolCalls.push({
        step: "read", name: "read_doc", args, executed: true, actionPerformed: true, denied: false, approved: false,
        evidence: "tool 节点直接调用 Runnable（无审批要求，等价于自动放行）",
      });
      return READ_RESULT;
    },
    { name: "read_doc", description: "读取文档标题", schema: z.object({ path: z.string() }) },
  );
  const deleteTemp = tool(
    async (args: { path: string }) => {
      toolCalls.push({
        step: "gate", name: "delete_temp", args, executed: true, actionPerformed: false, denied: true, approved: false,
        evidence: "LangGraph 无预执行权限门：策略写在工具实现内，调用后返回拒绝文本，删除未发生",
      });
      return DENY_MESSAGE;
    },
    { name: "delete_temp", description: "删除临时目录（危险）", schema: z.object({ path: z.string() }) },
  );
  const publishNote = tool(
    async (args: { path: string }) => {
      toolCalls.push({
        step: "approve", name: "publish_note", args, executed: true, actionPerformed: true, denied: false, approved: true,
        evidence: "interrupt() 挂起 → 调用方 Command({resume}) 批准 → 节点重放后工具才真正被调用",
      });
      return PUBLISH_RESULT;
    },
    { name: "publish_note", description: "发布笔记（需人工审批）", schema: z.object({ path: z.string() }) },
  );

  const bound = llm.bindTools([readDoc, deleteTemp, publishNote]);

  async function agentNode(state: State) {
    const ai = await bound.invoke(state.messages);
    return { messages: [ai] };
  }

  async function toolsNode(state: State) {
    const last = state.messages[state.messages.length - 1] as AIMessage;
    const out: ToolMessage[] = [];
    for (const tc of (last.tool_calls ?? []) as Array<{ name: string; args: Record<string, unknown>; id: string }>) {
      if (tc.name === "publish_note") {
        // 真正的挂起：状态进 checkpointer，决定权交还调用方；
        // 续跑时本行直接返回 resume 值（节点从头重放，注意幂等）
        const decision = interrupt({ tool: "publish_note", args: tc.args, reason: "需要人工审批" });
        const res = await publishNote.invoke(tc as never);
        out.push(new ToolMessage({ content: String(res), tool_call_id: tc.id }));
        void decision;
        continue;
      }
      const t = tc.name === "delete_temp" ? deleteTemp : readDoc;
      // 必须传完整 ToolCall（name+args+id）：StructuredTool 按 ToolCall 形态提取 args，
      // 缺 id 会被当成 args 本体去对 schema → "received undefined → at path"
      const res = await t.invoke(tc as never);
      out.push(new ToolMessage({ content: String(res), tool_call_id: tc.id }));
    }
    return { messages: out };
  }

  function route(state: State): "tools" | typeof END {
    const last = state.messages[state.messages.length - 1] as AIMessage;
    return last.tool_calls?.length ? "tools" : END;
  }

  const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", agentNode)
    .addNode("tools", toolsNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", route, { tools: "tools", [END]: END })
    .addEdge("tools", "agent")
    .compile({ checkpointer: new MemorySaver() });

  const cfg = { configurable: { thread_id: "whiteboard-1" } };
  const reqsBefore = mock.requests.length;

  // ① 第一段：streamEvents(v2) 跑到中断点（流在 interrupt 处自然结束）。
  //  streamEvents 不返回状态，中断点要从 getState 的 snapshot.tasks[].interrupts 读。
  const events: string[] = [];
  const input = { messages: [new HumanMessage(WHITEBOARD_PROMPT)] };
  const stream1 = graph.streamEvents(input, { ...cfg, version: "v2" });
  for await (const e of stream1 as AsyncIterable<{ event: string }>) events.push(e.event);
  const snap1 = (await graph.getState(cfg)) as {
    tasks?: Array<{ name?: string; interrupts?: Array<{ value?: { tool?: string } }> }>;
  };
  const interruptEntries = snap1.tasks?.flatMap((t) => t.interrupts ?? []) ?? [];
  const interrupted = interruptEntries.length > 0;
  const interruptValue = interruptEntries[0]?.value as { tool?: string } | undefined;

  // ② 人工决定（此处=确定性模拟：批准）+ 同 thread 续跑（只 resume 一次！
  //  resume 会消费掉中断点，重复 invoke 会另起一轮）
  let finalText = "";
  let resumed = false;
  if (interrupted) {
    const stream2 = graph.streamEvents(new Command({ resume: { approved: true } }), { ...cfg, version: "v2" });
    for await (const e of stream2 as AsyncIterable<{ event: string }>) events.push(e.event);
    const snap = (await graph.getState(cfg)) as { values?: { messages?: Array<{ content?: unknown }> } };
    const msgs = snap.values?.messages ?? [];
    finalText = String(msgs[msgs.length - 1]?.content ?? "");
    resumed = finalText.length > 0;
  }

  const modelCalls = mock.requests.length - reqsBefore;
  const openaiReqs = mock.requests.slice(reqsBefore).filter((r) => r.format === "openai");
  const lastMsgs = openaiReqs.length ? openaiReqs[openaiReqs.length - 1].msgs : 0;
  const lastReqToolResults = openaiReqs.length ? openaiReqs[openaiReqs.length - 1].toolResults : 0;
  const snap2 = (await graph.getState(cfg)) as {
    config?: { configurable?: { checkpoint_id?: string } };
    values?: { messages?: unknown[] };
  };
  const hasCheckpoint = !!snap2.config?.configurable?.checkpoint_id;
  const finalStateMessages = snap2.values?.messages?.length ?? 0;

  const modelEnd = events.filter((e) => e === "on_chat_model_end").length;
  const toolEnd = events.filter((e) => e === "on_tool_end").length;

  return {
    key: "langgraph",
    label: "LangGraph",
    packageSpec: "@langchain/langgraph + @langchain/openai + @langchain/core",
    baseUrl: mock.openaiBaseUrl,
    model: MOCK_MODEL,
    loopOwner: "图引擎（StateGraph 的节点/边/条件路由=loop；LLM 客户端只被按节点调用）",
    toolCalls,
    finalText,
    messageCount: lastMsgs,
    stateShape: `MemorySaver checkpointer 按 thread_id 存全量状态（checkpoint_id 存在=${hasCheckpoint}）；最终一次模型请求带 ${lastMsgs} 条 messages（含 3 条 tool 结果）`,
    paused: interrupted,
    resumed,
    pauseEvidence: interrupted
      ? `interrupt() 在 tools 节点挂起：getState().snapshot.tasks[].interrupts 含 value.tool=${interruptValue?.tool ?? "?"}，tasks 停在 tools 节点——状态已入 checkpointer`
      : "没有停在审批点（异常：任务被跳过）",
    resumeEvidence: resumed
      ? "Command({ resume }) 同 thread 续跑：节点重放、interrupt() 返回批准值、工具执行、模型收尾"
      : "无续跑",
    observability: {
      hook: "graph.streamEvents(v2) —— on_chat_model_* / on_tool_* / on_chain_* 事件流",
      events: modelEnd + toolEnd,
      samples: [`on_chat_model_end×${modelEnd}`, `on_tool_end×${toolEnd}`, `事件总数(含 chain/stream)${events.length}`],
    },
    extra: {
      modelCalls,
      // 结构化状态证据（compare:assert 直接断言）
      finalRequestMsgs: lastMsgs,
      finalRequestToolResults: lastReqToolResults,
      checkpointExists: hasCheckpoint,
      finalStateMessages: finalStateMessages,
    },
  };
}
