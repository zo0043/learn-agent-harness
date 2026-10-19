// ============================================================
// ② 单次模型调用 + ④ SSE 流式（OpenAI 兼容协议）
// ============================================================
import type { AssistantMessage, ToolCall } from "./types.js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// 零依赖 .env 加载（harness-demo/.env）
// 必须放在本模块顶部：ES import 提升使 demo.ts 的入口代码晚于本模块求值，
// 若在入口加载 env，BASE/KEY 会在 import 期被读成空串。
{
  const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
}

const BASE = (process.env.LLM_BASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.LLM_API_KEY ?? "";
export const MODEL = process.env.LLM_MODEL ?? "qwen3.8-flash-next";

/**
 * 历史里的 assistant.tool_calls 要按 OpenAI wire 协议回写：
 * 嵌套 {id, type:"function", function:{name, arguments}}，且 arguments 必须是
 * JSON **字符串**（本内部模型用扁平 {id,name,arguments:对象}，直接 stringify
 * 会被严格上游拒 400，2026-10-10 qwen3.8-flash-next 实测）。
 */
function toWireMessages(messages: unknown[]): unknown[] {
  return messages.map((m) => {
    const a = m as AssistantMessage;
    if (m && a.role === "assistant" && a.tool_calls) {
      return {
        role: "assistant",
        content: a.content,
        tool_calls: a.tool_calls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: {
            name: tc.name,
            arguments: typeof tc.arguments === "string" ? tc.arguments : JSON.stringify(tc.arguments),
          },
        })),
      };
    }
    return m;
  });
}

export interface ChatOpts {
  messages: unknown[];
  tools?: unknown[];
  stream?: boolean;
  onDelta?: (d: { content?: string }) => void;
}

export interface ChatResult {
  assistant: AssistantMessage;
  finishReason: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  responseModel?: string; // wire 实际返回的模型（span 的 gen_ai.response.model）
  ms: number;
}

/** 非流式：一次拿完整响应（白板版用这个；生产默认流式） */
export async function chat(opts: ChatOpts): Promise<ChatResult> {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages: toWireMessages(opts.messages), tools: opts.tools, stream: false }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as {
    choices: { message: { content: string | null; tool_calls?: ToolCall[] }; finish_reason: string }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    model?: string;
  };
  return {
    assistant: { role: "assistant", content: data.choices[0].message.content, tool_calls: data.choices[0].message.tool_calls },
    finishReason: data.choices[0].finish_reason,
    usage: data.usage,
    responseModel: data.model,
    ms: Date.now() - t0,
  };
}

/**
 * ④ SSE 流式。三件必须处理的事（要能讲清每件在防什么）：
 *  1. 帧以 \n\n 分隔，每行 `data: {json}`，结束帧 `data: [DONE]`
 *  2. content 是碎片，边收边拼
 *  3. tool_calls 也是碎片：首块带 id+name，后续块带 arguments 的
 *     **不完整 JSON 片段**——必须按 index 拼接、流结束后整体 JSON.parse
 *     （绝不能对单个片段 parse）
 */
async function chatStream(opts: ChatOpts): Promise<ChatResult> {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages: toWireMessages(opts.messages), tools: opts.tools, stream: true, stream_options: { include_usage: true } }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  if (!res.body) throw new Error("LLM HTTP: 流式响应无 body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let content = "";
  let finishReason = "";
  let responseModel = "";
  let usage: { prompt_tokens?: number; completion_tokens?: number } | undefined;
  const tcSlots = new Map<number, { id: string; name: string; argsStr: string }>();

  const handleFrame = (frame: string) => {
    for (const line of frame.split("\n")) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") continue;
      const chunk = JSON.parse(payload) as {
        choices?: { delta?: { content?: string; tool_calls?: { index?: number; id?: string; function?: { name?: string; arguments?: string } }[] }; finish_reason?: string }[];
        model?: string;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      // S2 埋点数据源：usage 帧（choices 为空）与 model 字段要在 continue 之前抓
      if (chunk.model) responseModel = chunk.model;
      if (chunk.usage) usage = chunk.usage;
      const choice = chunk.choices?.[0];
      if (!choice) continue;
      const delta = choice.delta ?? {};
      if (delta.content) {
        content += delta.content;
        opts.onDelta?.({ content: delta.content });
      }
      for (const tc of delta.tool_calls ?? []) {
        const slot = tcSlots.get(tc.index ?? 0) ?? { id: "", name: "", argsStr: "" };
        if (tc.id) slot.id = tc.id;
        if (tc.function?.name) slot.name += tc.function.name;
        if (tc.function?.arguments) slot.argsStr += tc.function.arguments; // 不完整 JSON 片段，只拼接
        tcSlots.set(tc.index ?? 0, slot);
      }
      if (choice.finish_reason) finishReason = choice.finish_reason;
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const frame = buf.slice(0, i);
      buf = buf.slice(i + 2);
      if (frame.trim()) handleFrame(frame);
    }
  }
  if (buf.trim()) handleFrame(buf);

  const tool_calls: ToolCall[] = [...tcSlots.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, s]) => ({ id: s.id, name: s.name, arguments: s.argsStr ? (JSON.parse(s.argsStr) as Record<string, unknown>) : {} }));

  return {
    assistant: { role: "assistant", content: content || null, tool_calls: tool_calls.length ? tool_calls : undefined },
    finishReason,
    usage,
    responseModel: responseModel || undefined,
    ms: Date.now() - t0,
  };
}

export async function chatAny(opts: ChatOpts): Promise<ChatResult> {
  return opts.stream ? chatStream(opts) : chat(opts);
}
