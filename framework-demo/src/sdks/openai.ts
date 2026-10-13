// openai.ts —— OpenAI Agents SDK 侧的白板任务实现（离线 mock 端点）
//
// 对照要点（详见 docs/sdk-comparison.md）：
//   · loop 归属：SDK 内置——Runner（run()）自带 agent loop（轮次/工具回填/停止判定），
//     调用方发一次 run()，拿回 RunResult。
//   · 工具与 schema：函数工具 tool({ name, description, parameters: zod, strict: true })，
//     schema 由 zod 编译进请求（mock 收到的 tools[] 里能看到）。
//   · 权限与 HITL：函数工具没有"策略拒绝"的一等门——危险策略要么写在 execute 内
//     （调用后返回拒绝文本，本实现取此路线），要么用 tool guardrail；
//     人工审批是一等公民：needsApproval: true → run 在审批点**真的停下**，
//     决定权交还调用方（RunState.approvalItem / approve()）。
//   · 状态与中断恢复：RunState（内存，可 toJSON() 序列化跨进程续跑）；
//     审批挂起后 run() 返回 → 人调 state.approvalItem → 再次 run(agent, state) 续跑。
//   · 可观测：Agent 实例是 EventEmitter——agent.on('agent_tool_start'|'agent_tool_end'|...)。
//
// 实现注记（踩坑，2026-10-12 实测）：
//   ① 必须从 @openai/agents-core 直接 import（Agent/run/tool），**不能**走 @openai/agents
//      的 index——它的 index 在 import 时无条件 setDefaultOpenAITracingExporter()，
//      离线环境会向外发 trace 批次并往 stderr 打 401 日志（破坏确定性）。
//   ② zod 参数必须 strict: true（非 strict 会直接 UserError）。
//   ③ run 停在审批点时读 result.finalOutput 会打警告到 stdout——先查 pending 审批再读。
// 必须在任何 run() 之前设置：agents-core 0.20 的默认 trace processor 是
// ConsoleSpanExporter，每个 span 都往 stdout 打一行 "[Exporter] Export span..."，
// 会破坏 compare 输出确定性（且离线环境无任何 trace 后端可送）。
// 另外必须从 @openai/agents-core 直 import——@openai/agents 的 index 会在 import 时
// 无条件启用 OpenAI 网络 trace exporter（离线打 401 日志）。
process.env.OPENAI_AGENTS_DISABLE_TRACING = "1";
import { Agent, run, tool, type RunToolApprovalItem } from "@openai/agents-core";
import { OpenAIChatCompletionsModel } from "@openai/agents-openai";
import OpenAI from "openai";
import { z } from "zod";
import {
  type UnifiedTrace, type ToolCallRecord,
  WHITEBOARD_PROMPT, DENY_MESSAGE, READ_RESULT, PUBLISH_RESULT, MOCK_MODEL,
} from "./task.js";
import type { MockServer } from "../mock-model.js";

export async function runOpenAITrace(mock: MockServer): Promise<UnifiedTrace> {
  const client = new OpenAI({ baseURL: mock.openaiBaseUrl, apiKey: "mock-key" });
  const model = new OpenAIChatCompletionsModel(client, MOCK_MODEL);

  const toolCalls: ToolCallRecord[] = [];
  const lifecycle: string[] = [];
  let lastMsgs = 0;

  const agent = new Agent({
    name: "whiteboard",
    instructions: "完成白板任务，按工具调用顺序处理，最后用中文一句话收尾。",
    model,
    tools: [
      tool({
        name: "read_doc", description: "读取文档标题", strict: true,
        parameters: z.object({ path: z.string() }),
        execute: async (args) => {
          toolCalls.push({
            step: "read", name: "read_doc", args, executed: true, actionPerformed: true, denied: false, approved: false,
            evidence: "函数工具 execute 直接运行（无审批要求，等价于自动放行）",
          });
          return READ_RESULT;
        },
      }),
      tool({
        name: "delete_temp", description: "删除临时目录（危险）", strict: true,
        parameters: z.object({ path: z.string() }),
        execute: async (args) => {
          toolCalls.push({
            step: "gate", name: "delete_temp", args, executed: true, actionPerformed: false, denied: true, approved: false,
            evidence: "SDK 无预执行权限门：策略写在 execute 内，函数运行后返回拒绝文本，删除未发生",
          });
          return DENY_MESSAGE;
        },
      }),
      tool({
        name: "publish_note", description: "发布笔记（需人工审批）", strict: true,
        parameters: z.object({ path: z.string() }),
        needsApproval: true,
        execute: async (args) => {
          toolCalls.push({
            step: "approve", name: "publish_note", args, executed: true, actionPerformed: true, denied: false, approved: true,
            evidence: "needsApproval=true：run 在审批点停下并交还 RunState；调用方 approve() 后续跑，execute 才运行",
          });
          return PUBLISH_RESULT;
        },
      }),
    ],
  });

  // 可观测钩子：Agent 实例上的 EventEmitter（agent_tool_start/end 各应出现 3 次）
  agent.on("agent_tool_start", () => lifecycle.push("agent_tool_start"));
  agent.on("agent_tool_end", () => lifecycle.push("agent_tool_end"));
  agent.on("agent_end", () => lifecycle.push("agent_end"));

  const reqsBefore = mock.requests.length;
  const opts = { maxTurns: 12 };

  // ① 第一段：跑到审批点停下
  const r1 = await run(agent, WHITEBOARD_PROMPT, opts);
  const pending = r1.newItems.find((i) => (i as { type: string }).type === "tool_approval_item") as RunToolApprovalItem | undefined;
  const paused = pending != null;

  // ② 人工决定（此处=确定性模拟：批准）+ 用 RunState 续跑
  let r2: typeof r1 | null = null;
  if (pending) {
    (r1.state as { approve: (i: RunToolApprovalItem) => void }).approve(pending);
    r2 = await run(agent, r1.state as never, opts);
  }
  const finalResult = r2 ?? r1;
  const finalText = String(finalResult.finalOutput ?? "");

  const modelCalls = mock.requests.length - reqsBefore;
  const openaiReqs = mock.requests.slice(reqsBefore).filter((r) => r.format === "openai");
  const lastReq = openaiReqs[openaiReqs.length - 1];
  lastMsgs = lastReq ? lastReq.msgs : 0;
  const lastReqToolResults = lastReq ? lastReq.toolResults : 0;

  return {
    key: "openai-agents-sdk",
    label: "OpenAI Agents SDK",
    packageSpec: "@openai/agents（本实现从 @openai/agents-core 直 import，避开 index 的 tracing 副作用）",
    baseUrl: mock.openaiBaseUrl,
    model: MOCK_MODEL,
    loopOwner: "SDK 内置（Runner 自带 loop：轮次/工具回填/停止判定全在 run() 内）",
    toolCalls,
    finalText,
    messageCount: lastMsgs,
    stateShape: `RunState 内存态（两段 run 之间靠它续命，可 toJSON() 序列化跨进程）；最终一次模型请求带 ${lastMsgs} 条 messages（含 3 条 tool 结果）`,
    paused,
    resumed: r2 != null && finalText.length > 0,
    pauseEvidence: pending
      ? `run() 在 needsApproval 工具处返回（未跑完），newItems 含 tool_approval_item（name=${(pending.rawItem as { name?: string }).name ?? "?"}）——决定权交还调用方`
      : "没有停在审批点（异常：任务被跳过）",
    resumeEvidence: r2
      ? `state.approvalItem 后 run(agent, state) 续跑：execute 运行、模型收尾`
      : "无续跑",
    observability: {
      hook: "agent.on('agent_tool_start' | 'agent_tool_end' | 'agent_end') —— Agent 实例即 EventEmitter",
      events: lifecycle.length,
      samples: [`agent_tool_start×${lifecycle.filter((e) => e === "agent_tool_start").length}`, `agent_tool_end×${lifecycle.filter((e) => e === "agent_tool_end").length}`, `agent_end×${lifecycle.filter((e) => e === "agent_end").length}`],
    },
    extra: {
      modelCalls,
      // 结构化状态证据（compare:assert 直接断言）
      finalRequestMsgs: lastMsgs,
      finalRequestToolResults: lastReqToolResults,
    },
  };
}
