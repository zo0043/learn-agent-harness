// mock-model.ts —— 离线 mock 模型端点（框架生态 W2 的对照底座）
//
// 为什么需要它：对照线**不依赖任何真实 key/端点**——要把「三家 SDK 同任务对照」做成离线可复现的断言，
// 就必须把一个**确定性的假模型**放到 HTTP 上，让三家 SDK 都以为自己在调真模型
// （照抄 harness-demo/src/test-compact.ts 的「mock 掉 provider」范式，从 1 个端点扩到双格式）。
//
// 关键性质（决定 compare 的确定性）：
//   1. 纯函数：响应只由**请求体内容**决定（数 tool 结果条数 → 决定下一步），不用全局计数器，
//      因此并发/后台请求不会打乱脚本，也不需要 sleep。
//   2. 零时间零随机：所有 id/文本/用量都是常量，同一请求两次得到逐字节相同的响应。
//   3. 双格式：Anthropic /v1/messages（Claude Agent SDK 的 claude CLI 走这条，强制 SSE）
//              与 OpenAI /v1/chat/completions（LangGraph ChatOpenAI 与 OpenAI Agents SDK，
//              Agents SDK 在 useResponses:false 下走**流式** chat completions）。
//
// 白板任务的脚本（三家共用，见 src/sdks/task.ts）：
//   tool 结果数 = 0 → 第 1 步：read_doc(docs/research-notes.md)     —— 普通工具，自动放行
//                = 1 → 第 2 步：delete_temp(/tmp/fw-demo-trash)      —— 危险工具，策略拒绝
//                = 2 → 第 3 步：publish_note(out/whiteboard-note.md) —— 需人类审批，暂停后批准
//               >= 3 → 收尾文本（含标题 + 说明被拒动作）
import http from "node:http";
import type { AddressInfo } from "node:net";
import { DOC_PATH, DOC_TITLE, GATE_PATH, APPROVAL_PATH, MOCK_MODEL, TOOL_NAMES } from "./sdks/task.js";

export const MOCK_PORT = 8791;
const MOCK_HOST = "127.0.0.1";

/** 白板任务收尾文本：常量，保证 compare 两次运行逐字节一致 */
export const FINAL_TEXT =
  `标题：${DOC_TITLE}（2026-Q3）。` +
  `危险动作 ${GATE_PATH} 已被权限策略拒绝，我没有重试；` +
  `需要审批的动作在人工批准后执行完成。`;

type Step = "read" | "gate" | "approve" | "final";

interface Picked { name: string; input: Record<string, unknown> }

/** 按优先级候选名挑工具：先逐个精确匹配，再正则，都没有就返回 null */
function pickTool(names: string[], exacts: string[], re: RegExp): string | null {
  for (const e of exacts) if (names.includes(e)) return e;
  return names.find((n) => re.test(n)) ?? null;
}

/** Claude 侧同名工具不存在时会退化到**内置工具市场**（Read/Bash），参数 schema 也随之不同 */
function argsFor(name: string, bashArgs: Record<string, unknown>, fnArgs: Record<string, unknown>, readArgs: Record<string, unknown>): Record<string, unknown> {
  if (name === "Bash") return bashArgs;
  if (name === "Read") return readArgs;
  return fnArgs;
}

function pickFor(step: Step, names: string[]): Picked | null {
  if (step === "final") return null; // 脚本跑完 → 只回收尾文本，不再要求工具调用
  if (step === "read") {
    const n = pickTool(names, ["mcp__whiteboard__read_doc", TOOL_NAMES.read, "Read"], /read/i);
    return n ? { name: n, input: argsFor(n, { command: `cat ${DOC_PATH}` }, { path: DOC_PATH }, { file_path: DOC_PATH }) } : null;
  }
  if (step === "gate") {
    const n = pickTool(names, ["mcp__whiteboard__delete_temp", TOOL_NAMES.gate, "Bash"], /delete/i);
    return n ? { name: n, input: argsFor(n, { command: `rm -rf ${GATE_PATH}` }, { path: GATE_PATH }, { file_path: GATE_PATH }) } : null;
  }
  const n = pickTool(names, ["mcp__whiteboard__publish_note", TOOL_NAMES.approve, "Bash"], /publish/i);
  // 审批步用 Bash touch 建出"发布"的产物文件：
  // ① touch 不是只读命令，CLI 安全规则不会自动放行 → 必过 canUseTool（逐调用权限门的直接证据）；
  // ② 文件真的被建出来 = 审批放行后的真实副作用（断言可查）；
  // ③ 与 gate 步的 rm 不同命令、同一把 Bash → 证明权限门是逐调用的，不是工具级开关。
  return n ? { name: n, input: argsFor(n, { command: `touch ${APPROVAL_PATH}` }, { path: APPROVAL_PATH }, { file_path: APPROVAL_PATH }) } : null;
}

/** 计数：请求里已经回填了几条工具结果 */
function countToolResultsOpenAI(body: Record<string, unknown>): number {
  const msgs = (body.messages as Array<Record<string, unknown>> | undefined) ?? [];
  return msgs.filter((m) => m.role === "tool").length;
}

function countToolResultsAnthropic(body: Record<string, unknown>): number {
  const msgs = (body.messages as Array<Record<string, unknown>> | undefined) ?? [];
  let n = 0;
  for (const m of msgs) {
    const c = m.content;
    if (Array.isArray(c)) for (const b of c as Array<Record<string, unknown>>) if (b.type === "tool_result") n++;
  }
  return n;
}

/** 请求里已经出现过几条 tool_use —— 用它给新工具调用编号，保证 id **唯一且仍是请求的纯函数** */
function countToolUsesAnthropic(body: Record<string, unknown>): number {
  const msgs = (body.messages as Array<Record<string, unknown>> | undefined) ?? [];
  let n = 0;
  for (const m of msgs) {
    const c = m.content;
    if (Array.isArray(c)) for (const b of c as Array<Record<string, unknown>>) if (b.type === "tool_use") n++;
  }
  return n;
}

function countToolUsesOpenAI(body: Record<string, unknown>): number {
  const msgs = (body.messages as Array<Record<string, unknown>> | undefined) ?? [];
  let n = 0;
  for (const m of msgs) {
    const tc = m.tool_calls as Array<unknown> | undefined;
    if (Array.isArray(tc)) n += tc.length;
  }
  return n;
}

/** 数请求里已有的 assistant 消息 —— 派生唯一的响应 id（仍是请求的纯函数）。
 *  为什么必须唯一：LangGraph 的 addMessages reducer 按 message id 合并，
 *  两条 AI 消息 id 相同会被替换掉第一条，loop 直接断掉（实测过）。 */
function countAssistantMessages(body: Record<string, unknown>): number {
  const msgs = (body.messages as Array<Record<string, unknown>> | undefined) ?? [];
  return msgs.filter((m) => m.role === "assistant").length;
}

const openaiResponseId = (body: Record<string, unknown>) =>
  `chatcmpl-mock-${String(countAssistantMessages(body) + 1).padStart(4, "0")}`;

const anthropicResponseId = (body: Record<string, unknown>) =>
  `msg_mock_${String(countAssistantMessages(body) + 1).padStart(4, "0")}`;

function stepOf(count: number): Step {
  if (count <= 0) return "read";
  if (count === 1) return "gate";
  if (count === 2) return "approve";
  return "final";
}

function openaiToolNames(body: Record<string, unknown>): string[] {
  const tools = (body.tools as Array<Record<string, unknown>> | undefined) ?? [];
  return tools.map((t) => {
    const fn = t.function as Record<string, unknown> | undefined;
    return String((fn?.name ?? t.name ?? "") as string);
  }).filter(Boolean);
}

function anthropicToolNames(body: Record<string, unknown>): string[] {
  const tools = (body.tools as Array<Record<string, unknown>> | undefined) ?? [];
  return tools.map((t) => String(t.name ?? "")).filter(Boolean);
}

// ────────────────────────── OpenAI /v1/chat/completions ──────────────────────────

interface OAIToolCall { id: string; type: "function"; function: { name: string; arguments: string } }

function openaiPlan(body: Record<string, unknown>): { toolCall: OAIToolCall | null } {
  const names = openaiToolNames(body);
  const picked = names.length ? pickFor(stepOf(countToolResultsOpenAI(body)), names) : null;
  if (!picked) return { toolCall: null };
  const seq = countToolUsesOpenAI(body) + 1; // 唯一 id：重复 id 会让 SDK 把 tool_result 认成孤儿
  return {
    toolCall: {
      id: `call_mock_0001_${seq}`,
      type: "function",
      function: { name: picked.name, arguments: JSON.stringify(picked.input) },
    },
  };
}

function openaiJson(body: Record<string, unknown>) {
  const { toolCall } = openaiPlan(body);
  const message = toolCall
    ? { role: "assistant", content: null, tool_calls: [toolCall] }
    : { role: "assistant", content: FINAL_TEXT };
  return {
    id: openaiResponseId(body),
    object: "chat.completion",
    created: 0, // 常量：不引入时间漂移
    model: MOCK_MODEL,
    choices: [{ index: 0, message, finish_reason: toolCall ? "tool_calls" : "stop", logprobs: null }],
    usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 },
  };
}

function openaiSse(res: http.ServerResponse, body: Record<string, unknown>) {
  const { toolCall } = openaiPlan(body);
  const rid = openaiResponseId(body);
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  const chunk = (delta: Record<string, unknown>, finish: string | null) =>
    `data: ${JSON.stringify({
      id: rid, object: "chat.completion.chunk", created: 0, model: MOCK_MODEL,
      choices: [{ index: 0, delta, finish_reason: finish, logprobs: null }],
    })}\n\n`;
  res.write(chunk({ role: "assistant", content: "" }, null));
  if (toolCall) {
    res.write(chunk({ tool_calls: [{ index: 0, id: toolCall.id, type: "function", function: { name: toolCall.function.name, arguments: "" } }] }, null));
    res.write(chunk({ tool_calls: [{ index: 0, function: { arguments: toolCall.function.arguments } }] }, null));
    res.write(chunk({}, "tool_calls"));
  } else {
    res.write(chunk({ content: FINAL_TEXT }, "stop"));
  }
  // stream_options.include_usage 时补一个 usage-only chunk（Agents SDK 会带这个开关）
  res.write(`data: ${JSON.stringify({
    id: rid, object: "chat.completion.chunk", created: 0, model: MOCK_MODEL,
    choices: [], usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 },
  })}\n\n`);
  res.write("data: [DONE]\n\n");
  res.end();
}

// ────────────────────────── Anthropic /v1/messages ──────────────────────────

function anthropicPlan(body: Record<string, unknown>): { tool: Picked | null } {
  const names = anthropicToolNames(body);
  // 没有广告工具（CLI 的后台/探测请求）→ 直接文本，避免把工具调用塞进无工具上下文
  const picked = names.length ? pickFor(stepOf(countToolResultsAnthropic(body)), names) : null;
  return { tool: picked };
}

function anthropicJson(body: Record<string, unknown>) {
  const { tool } = anthropicPlan(body);
  const seq = countToolUsesAnthropic(body) + 1;
  const content = tool
    ? [{ type: "tool_use", id: `toolu_mock_${String(seq).padStart(4, "0")}`, name: tool.name, input: tool.input }]
    : [{ type: "text", text: FINAL_TEXT }];
  return {
    id: anthropicResponseId(body), type: "message", role: "assistant", model: MOCK_MODEL,
    content,
    stop_reason: tool ? "tool_use" : "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 100, output_tokens: 20 },
  };
}

function anthropicSse(res: http.ServerResponse, body: Record<string, unknown>) {
  const { tool } = anthropicPlan(body);
  const seq = countToolUsesAnthropic(body) + 1;
  const toolId = `toolu_mock_${String(seq).padStart(4, "0")}`;
  const rid = anthropicResponseId(body);
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  const ev = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  ev("message_start", {
    type: "message_start",
    message: {
      id: rid, type: "message", role: "assistant", model: MOCK_MODEL, content: [],
      stop_reason: null, stop_sequence: null, usage: { input_tokens: 100, output_tokens: 0 },
    },
  });
  if (tool) {
    ev("content_block_start", { type: "content_block_start", index: 0, content_block: { type: "tool_use", id: toolId, name: tool.name, input: {} } });
    ev("content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: JSON.stringify(tool.input) } });
    ev("content_block_stop", { type: "content_block_stop", index: 0 });
    ev("message_delta", { type: "message_delta", delta: { stop_reason: "tool_use", stop_sequence: null }, usage: { output_tokens: 20 } });
  } else {
    ev("content_block_start", { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } });
    ev("content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: FINAL_TEXT } });
    ev("content_block_stop", { type: "content_block_stop", index: 0 });
    ev("message_delta", { type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 20 } });
  }
  ev("message_stop", { type: "message_stop" });
  res.end();
}

// ────────────────────────── server ──────────────────────────

export interface MockRequestLog { method: string; path: string; format: "anthropic" | "openai" | "other"; stream: boolean; toolResults: number; bodyBytes: number; msgs: number; resultTexts?: string[]; answered?: string }

/** 抓回填的 tool_result 文本（用于核对"拒绝消息真的回进了上下文"） */
function resultTextsOpenAI(body: Record<string, unknown>): string[] {
  const msgs = (body.messages as Array<Record<string, unknown>> | undefined) ?? [];
  return msgs.filter((m) => m.role === "tool").map((m) => String(m.content ?? "").slice(0, 160));
}

function resultTextsAnthropic(body: Record<string, unknown>): string[] {
  const out: string[] = [];
  const msgs = (body.messages as Array<Record<string, unknown>> | undefined) ?? [];
  for (const m of msgs) {
    const c = m.content;
    if (!Array.isArray(c)) continue;
    for (const b of c as Array<Record<string, unknown>>) {
      if (b.type === "tool_result") out.push(JSON.stringify(b.content ?? "").slice(0, 160));
    }
  }
  return out;
}

export interface MockServer {
  url: string;              // http://127.0.0.1:PORT
  anthropicBaseUrl: string; // http://127.0.0.1:PORT （claude CLI 自己拼 /v1/messages）
  openaiBaseUrl: string;    // http://127.0.0.1:PORT/v1
  requests: MockRequestLog[];
  close(): Promise<void>;
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

/** 起一个确定性的 mock 模型端点。port=0 → 由内核分配空闲端口（仍打印实际端口）。 */
export async function startMockModel(port = MOCK_PORT): Promise<MockServer> {
  const requests: MockRequestLog[] = [];
  const server = http.createServer(async (req, res) => {
    const raw = await readBody(req);
    let body: Record<string, unknown> = {};
    try { body = JSON.parse(raw || "{}") as Record<string, unknown>; } catch { body = {}; }
    const path = (req.url ?? "/").split("?")[0];
    const stream = body.stream === true;

    if (path === "/v1/messages") {
      requests.push({ method: req.method ?? "", path, format: "anthropic", stream, toolResults: countToolResultsAnthropic(body), bodyBytes: raw.length, msgs: ((body.messages as unknown[]) ?? []).length, resultTexts: resultTextsAnthropic(body), answered: (() => { const p = anthropicToolNames(body).length ? pickFor(stepOf(countToolResultsAnthropic(body)), anthropicToolNames(body)) : null; return p ? `tool:${p.name}:${JSON.stringify(p.input)}` : "final-text"; })() });
      res.setHeader("request-id", "req_mock_0001");
      if (stream) anthropicSse(res, body); else { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(anthropicJson(body))); }
      return;
    }
    if (path === "/v1/chat/completions") {
      requests.push({ method: req.method ?? "", path, format: "openai", stream, toolResults: countToolResultsOpenAI(body), bodyBytes: raw.length, msgs: ((body.messages as unknown[]) ?? []).length, resultTexts: resultTextsOpenAI(body), answered: (() => { const p = openaiToolNames(body).length ? pickFor(stepOf(countToolResultsOpenAI(body)), openaiToolNames(body)) : null; return p ? `tool:${p.name}:${JSON.stringify(p.input)}` : "final-text"; })() });
      if (stream) openaiSse(res, body); else { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(openaiJson(body))); }
      return;
    }
    // CLI/SDK 的非模型流量（版本探测、遥测端点、responses 端点等）：收下并给无害响应，绝不 5xx
    requests.push({ method: req.method ?? "", path, format: "other", stream, toolResults: -1, bodyBytes: raw.length, msgs: ((body.messages as unknown[]) ?? []).length });
    res.setHeader("Content-Type", "application/json");
    if (path.endsWith("/v1/models")) { res.end(JSON.stringify({ data: [{ id: MOCK_MODEL, object: "model" }] })); return; }
    res.end(JSON.stringify({ ok: true, mock: true, path }));
  });
  await new Promise<void>((r) => server.listen(port, MOCK_HOST, () => r()));
  const actual = (server.address() as AddressInfo).port;
  const base = `http://${MOCK_HOST}:${actual}`;
  return {
    url: base,
    anthropicBaseUrl: base,
    openaiBaseUrl: `${base}/v1`,
    requests,
    close: () => new Promise<void>((r) => { server.close(() => r()); server.closeAllConnections?.(); }),
  };
}

// 独立探测模式：npx tsx src/mock-model.ts --probe 用 curl 打一下就明白它返回什么
if (process.argv[2] === "--probe") {
  const s = await startMockModel(MOCK_PORT);
  console.log(`[mock] listening ${s.url}  (anthropic=${s.anthropicBaseUrl} openai=${s.anthropicBaseUrl}/v1) model=${MOCK_MODEL}`);
}
