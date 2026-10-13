// ============================================================
// otel-mock-scenario.ts — U-23 收口：**离线**跑出确定性 OTel span 树
//
// 为什么需要这个文件（问题陈述）
//   `npm run demo:otel` 走的是活 LLM 端点（src/llm.ts:22-24 读 LLM_BASE_URL/KEY），
//   而 span 数由 **运行时** 统计（src/otel.ts:52-54 的 memoryExporter.getFinishedSpans()），
//   取决于当次模型调了几轮、发了几个 tool_call。
//   → 于是历史材料里的「11 spans / 1 trace」在仓库内**没有任何可复跑证据**（审计 U-23 / C-14）。
//
// 本文件的办法（照抄 src/test-compact.ts:1-23 的既有范式）
//   起一个**本地 OpenAI 兼容 mock 端点**（127.0.0.1，随机端口，不走外网），
//   按**冻结脚本**返回 6 轮响应，然后跑**同一个** runAgent（agent.ts 不改），
//   把 span 树计数变成**确定值**。断言见 src/otel-assert.ts。
//
// 冻结脚本的来源（重要：数字不是"挑"出来的，是从仓内证据派生的）
//   8 个 tool_call 的**名字与顺序**逐条抄自仓内唯一的活端点端到端轨迹
//   `trajectories/demo.jsonl`（22 行：1 init / 6 model_response / 6 tool_intent /
//   8 tool_exec / 1 final——其中 2 次被拒调用在活端点日志里没有对应 tool_intent）。
//   两处**如实适配**（不是照抄，改在哪也写清楚）：
//     a) 读写路径改为 out/otel-mock-run.md（活轨迹写的是 out/summary.md，避免 mock 覆盖活跑产物）；
//     b) write_file 在 demo 默认策略下自动批准（活轨迹里该步被操作者拒批 → denied），
//        所以 mock 实跑状态 = ok×7 / denied×1（run_shell），活轨迹 = ok×6 / denied×2。
//   即 package.json `demo:otel` 同款任务形状；模型侧换成 mock，harness 侧一行不改。
//   ⇒ 期望 span 数 = 1 invoke_agent + 6 chat + 8 execute_tool = **15**，1 个 trace。
//
// 纪律（审计 U-23 的核心要求）
//   1. 断言写的是**由场景派生**的形态 + 计数，不是"凑到 11 才算过"；
//   2. 「11」确实出现在本文件（EXPECTED.historicalReportOnly 契约，及上文纪律说明与文末打印对照文本）——
//      均仅作为「未验证的历史报告值」被打印对照，不作为任何断言判据；
//   3. 若未来改了这个冻结脚本，otel-assert.ts 的 EXPECTED 常量会**失败**，必须显式改契约。
// ============================================================
import http from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import type { ReadableSpan } from "@opentelemetry/sdk-trace-base";

const __dirname = dirname(fileURLToPath(import.meta.url)); // src/

/** mock 模型名：与活端点模型名区分，避免读者把 mock 结果误当活端点结果 */
export const MOCK_MODEL = "mock-harness-otel-1";

/**
 * 冻结期望值（**契约常量**，由上面的场景派生，人工核对过一次）。
 * otel-assert.ts 拿实跑结果与它比对；不符即非 0 退出。
 * 注意这是"场景 → 期望"的显式声明，不是"旧数字 → 期望"。
 */
export const EXPECTED = {
  traceCount: 1,
  spanTotal: 15,
  byName: { invoke_agent: 1, chat: 6, execute_tool: 8 },
  rootName: "invoke_agent",
  /** 工具名**多重集**（断言时两侧都排序后比较，避免同一轮内两个 tool 的启动先后成为脆弱依赖） */
  toolNames: ["get_weather", "list_dir", "list_dir", "read_file", "read_file", "read_file", "run_shell", "write_file"],
  toolStatus: { ok: 7, denied: 1, error: 0 },
  /** 历史报告值：活端点跑出、仓内无回放日志 → 只能标"未验证"，不得当作断言 */
  historicalReportOnly: { spans: 11, traces: 1, source: "handoff.md:77 / notes/harness-from-scratch.md:210（活端点报告值，无可复跑日志）" },
} as const;

interface MockStep {
  content?: string;
  toolCalls?: { id: string; name: string; args: Record<string, unknown> }[];
  finish: "tool_calls" | "stop";
  usage: { prompt_tokens: number; completion_tokens: number };
}

/**
 * 冻结脚本：与 `trajectories/demo.jsonl` 的 6 轮 / 8 次工具调用逐条对应。
 * usage 用固定的整数（mock 的意义就是把"不确定"换成"确定"）。
 */
export const MOCK_STEPS: MockStep[] = [
  {
    content: "我先并行查天气和列 docs 目录。",
    toolCalls: [
      { id: "mock-call-1", name: "get_weather", args: { city: "北京" } },
      { id: "mock-call-2", name: "list_dir", args: { path: "docs" } },
    ],
    finish: "tool_calls",
    usage: { prompt_tokens: 765, completion_tokens: 104 },
  },
  {
    toolCalls: [
      { id: "mock-call-3", name: "read_file", args: { path: "docs/README.md" } },
      { id: "mock-call-4", name: "list_dir", args: { path: "out" } },
    ],
    finish: "tool_calls",
    usage: { prompt_tokens: 875, completion_tokens: 68 },
  },
  {
    content: "out/otel.md 已存在，先读现状再决定。",
    toolCalls: [{ id: "mock-call-5", name: "read_file", args: { path: "out/otel.md" } }],
    finish: "tool_calls",
    usage: { prompt_tokens: 1051, completion_tokens: 67 },
  },
  {
    content: "写入埋点验证结论，同时按任务要求试一次 run_shell。",
    toolCalls: [
      { id: "mock-call-6", name: "write_file", args: { path: "out/otel-mock-run.md", content: "OTel 埋点验证完成（U-23 mock 场景，离线可复跑）" } },
      { id: "mock-call-7", name: "run_shell", args: { command: "df -h" } },
    ],
    finish: "tool_calls",
    usage: { prompt_tokens: 1173, completion_tokens: 257 },
  },
  {
    toolCalls: [{ id: "mock-call-8", name: "read_file", args: { path: "out/otel-mock-run.md" } }],
    finish: "tool_calls",
    usage: { prompt_tokens: 1383, completion_tokens: 160 },
  },
  {
    content: "## 执行总结\n\n1. 天气 ✅ 2. docs/README ✅ 3. 写入 out/otel-mock-run.md ✅ 4. run_shell 被策略拒绝（不重试）❌\n",
    finish: "stop",
    usage: { prompt_tokens: 1489, completion_tokens: 471 },
  },
];

/** 把一个 tool_call 的 arguments 故意切成多片（复现 SSE 的"不完整 JSON 片段"） */
function fragmentedArgs(args: Record<string, unknown>): string[] {
  const s = JSON.stringify(args);
  const mid = Math.max(1, Math.floor(s.length / 2));
  return [s.slice(0, mid), s.slice(mid)];
}

const sse = (payload: unknown) => `data: ${JSON.stringify(payload)}\n\n`;

/** 按轮次生成一条 OpenAI 兼容的 SSE 响应体（含 usage 帧 + [DONE]） */
function sseBody(step: MockStep): string {
  let out = sse({ model: MOCK_MODEL, choices: [{ delta: { role: "assistant" }, index: 0 }] });
  if (step.content) out += sse({ model: MOCK_MODEL, choices: [{ delta: { content: step.content }, index: 0 }] });
  for (const [i, tc] of (step.toolCalls ?? []).entries()) {
    const frags = fragmentedArgs(tc.args);
    out += sse({
      model: MOCK_MODEL,
      choices: [{ delta: { tool_calls: [{ index: i, id: tc.id, type: "function", function: { name: tc.name, arguments: "" } }] }, index: 0 }],
    });
    for (const f of frags) {
      out += sse({ model: MOCK_MODEL, choices: [{ delta: { tool_calls: [{ index: i, function: { arguments: f } }] }, index: 0 }] });
    }
  }
  out += sse({ model: MOCK_MODEL, choices: [{ delta: {}, index: 0, finish_reason: step.finish }] });
  out += sse({ model: MOCK_MODEL, choices: [], usage: { ...step.usage, total_tokens: step.usage.prompt_tokens + step.usage.completion_tokens } });
  out += "data: [DONE]\n\n";
  return out;
}

/** 起本地 mock 端点；返回端口与关闭函数。端口用 0 → 由内核分配，避免与他人抢端口。 */
export async function startMockEndpoint(): Promise<{ port: number; close: () => Promise<void>; requests: () => number }> {
  let n = 0;
  const server = http.createServer((req, res) => {
    if (!req.url?.includes("/chat/completions")) {
      res.writeHead(404).end("not found");
      return;
    }
    const body: Buffer[] = [];
    req.on("data", (c: Buffer) => body.push(c));
    req.on("end", () => {
      const idx = n++;
      const step = MOCK_STEPS[Math.min(idx, MOCK_STEPS.length - 1)];
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
      res.end(sseBody(step));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const addr = server.address();
  if (!addr || typeof addr === "string") throw new Error("mock 端点未取得端口");
  return {
    port: addr.port,
    requests: () => n,
    close: () => new Promise<void>((r) => server.close(() => r())),
  };
}

export interface RunResult {
  spans: ReadableSpan[];
  /** 会话日志目录（临时目录，不污染仓内 trajectories/） */
  sessionFile: string;
  final: string;
  requests: number;
  port: number;
}

/**
 * 跑一次离线场景并返回 span。
 * 关键：**先**起 mock 端点、**后**用 dynamic import 加载 llm.ts/agent.ts——
 * 因为 src/llm.ts:22-24 在模块求值时就固化 BASE/KEY（ES import 提升问题）。
 */
export async function runMockOtelScenario(): Promise<RunResult> {
  const endpoint = await startMockEndpoint();
  process.env.LLM_BASE_URL = `http://127.0.0.1:${endpoint.port}/v1`;
  process.env.LLM_API_KEY = "mock";
  process.env.LLM_MODEL = MOCK_MODEL;
  process.env.OTEL_EXPORT_OTLP = "0";

  const { runAgent } = await import("./agent.js");
  const { initOtel, finishedSpans } = await import("./otel.js");
  const { buildRegistry } = await import("./tools.js");
  const { DEMO_POLICY, makeApproval } = await import("./policy.js");
  const { Session } = await import("./session.js");

  await initOtel({ console: false }); // 离线：不要 ConsoleSpanExporter 的原始 JSON 噪声

  // 会话日志落 trajectories/（该目录已被 .gitignore 的 `harness-demo/trajectories/*` 排除，
  // 不会污染 git status；也不叫 demo.jsonl —— 不会覆盖活端点跑出的那份）
  const sessionDir = resolve(__dirname, "..", "trajectories");
  const session = new Session(sessionDir, "otel-mock");
  if (session.exists()) session.remove(); // 每次全新，保证确定性

  const { final } = await runAgent({
    system: "你是一个文件处理 agent（本次由 mock 模型驱动，离线）。",
    user: "1. 查北京天气 2. 列出 docs 目录 3. 写 out/otel-mock-run.md 4. 试 run_shell 5. 总结",
    registry: buildRegistry(),
    policy: DEMO_POLICY, // 与 demo:otel 同一个策略：run_shell=deny / write_file=approve / 只读=allow
    approval: makeApproval(true), // 与 demo:otel 同款：非交互自动批准
    session,
    maxSteps: 8,
    compactThreshold: 12000,
  });

  const spans = finishedSpans();
  await endpoint.close();
  return { spans, sessionFile: session.file, final, requests: endpoint.requests(), port: endpoint.port };
}

// ——— span 树渲染（mock 命令的打印内容，也是快照文件的正文） ———

export interface SpanShape {
  traceCount: number;
  total: number;
  byName: Record<string, number>;
  toolNames: string[];
  toolStatus: Record<string, number>;
  rootId: string;
  children: { root: ReadableSpan; kids: ReadableSpan[] };
  ordered: ReadableSpan[];
}

const attrsOf = (s: ReadableSpan) => s.attributes as Record<string, unknown>;
/** 父 span id：SDK 的 ReadableSpan 上 `parentSpanId` 未暴露，权威字段是 parentSpanContext */
const parentId = (s: ReadableSpan): string | undefined => s.parentSpanContext?.spanId;

/** 从 span 列表提炼形态（排序稳定：先按名字，再按起始时间） */
export function shape(spans: ReadableSpan[]): SpanShape {
  const byName: Record<string, number> = {};
  for (const s of spans) byName[s.name] = (byName[s.name] ?? 0) + 1;
  const roots = spans.filter((s) => !parentId(s));
  if (roots.length !== 1) throw new Error(`期望恰好 1 个根 span（invoke_agent），实际 ${roots.length}`);
  const root = roots[0];
  const kids = spans
    .filter((s) => parentId(s) === root.spanContext().spanId)
    .sort((a, b) => a.startTime[0] - b.startTime[0] || a.startTime[1] - b.startTime[1] || a.name.localeCompare(b.name));
  const tools = kids.filter((s) => s.name === "execute_tool");
  const toolStatus: Record<string, number> = {};
  for (const t of tools) {
    const st = String(attrsOf(t)["harness.tool.status"] ?? "(缺)");
    toolStatus[st] = (toolStatus[st] ?? 0) + 1;
  }
  return {
    traceCount: new Set(spans.map((s) => s.spanContext().traceId)).size,
    total: spans.length,
    byName,
    toolNames: tools.map((t) => String(attrsOf(t)["gen_ai.tool.name"])),
    toolStatus,
    rootId: root.spanContext().spanId,
    children: { root, kids },
    ordered: spans,
  };
}

const ok = (s: ReadableSpan) => (s.status.code === 2 ? "ERROR" : s.status.code === 1 ? "OK" : "UNSET");
const ms = (s: ReadableSpan) => Math.round(s.duration[0] * 1000 + s.duration[1] / 1e6);

function describe(s: ReadableSpan): string {
  const a = attrsOf(s);
  const bits: string[] = [];
  if (a["gen_ai.request.model"]) bits.push(`model=${a["gen_ai.request.model"]}`);
  if (a["gen_ai.usage.input_tokens"] != null) bits.push(`tokens=${a["gen_ai.usage.input_tokens"]}in/${a["gen_ai.usage.output_tokens"]}out`);
  if (a["gen_ai.response.finish_reasons"]) bits.push(`finish=${JSON.stringify(a["gen_ai.response.finish_reasons"])}`);
  if (a["gen_ai.tool.name"]) bits.push(`tool=${a["gen_ai.tool.name"]}`);
  if (a["harness.tool.status"]) bits.push(`status=${a["harness.tool.status"]}`);
  return `${s.name} [${a["gen_ai.operation.name"] ?? "?"}] ${bits.join(" ")} → ${ok(s)} ${ms(s)}ms`;
}

/** ASCII span 树（与 notes/observability.md 的 S3 图一致：invoke_agent → chat / execute_tool） */
export function renderTree(sh: SpanShape): string {
  const lines: string[] = [];
  const tid = sh.children.root.spanContext().traceId;
  const a = attrsOf(sh.children.root);
  lines.push(`trace ${tid.slice(0, 16)}…（${sh.traceCount} 个 trace）`);
  lines.push(`└─ ${describe(sh.children.root)}`);
  lines.push(`   │  gen_ai.agent.name=${a["gen_ai.agent.name"]} gen_ai.session.id=${a["gen_ai.session.id"]}`);
  sh.children.kids.forEach((k, i) => {
    const last = i === sh.children.kids.length - 1;
    lines.push(`   ${last ? "└" : "├"}─ ${describe(k)}`);
  });
  return lines.join("\n");
}

/** 计数行（验收要求"打印 span 树与计数"） */
export function renderCounts(sh: SpanShape): string {
  const names = Object.entries(sh.byName)
    .sort()
    .map(([k, v]) => `${k}×${v}`)
    .join(" + ");
  const st = Object.entries(sh.toolStatus)
    .sort()
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  return `span 总数 = ${sh.total}（${sh.traceCount} 个 trace）：${names}\nexecute_tool 状态分布：${st}`;
}

/** 生成快照正文（写进 workspace/out/otel-spans.md；生成器产出，不手写） */
export function renderSnapshot(sh: SpanShape, meta: { port: number; requests: number; node: string }): string {
  const now = new Date().toISOString();
  const rows = sh.ordered
    .slice()
    .sort((a, b) => a.startTime[0] - b.startTime[0] || a.startTime[1] - b.startTime[1])
    .map((s) => {
      const a = attrsOf(s);
      const parent = parentId(s) ? (parentId(s) === sh.rootId ? "invoke_agent" : String(parentId(s)).slice(0, 8)) : "—（根）";
      return `| \`${s.name}\` | ${a["gen_ai.operation.name"] ?? "?"} | ${parent} | \`${JSON.stringify({ tool: a["gen_ai.tool.name"] ?? null, model: a["gen_ai.request.model"] ?? null, status: a["harness.tool.status"] ?? null })}\` | ${ok(s)} |`;
    })
    .join("\n");
  return `# demo:otel:mock 实测快照（U-23 收口）

> **本文件由生成器产出，请勿手改**——生成命令：\`cd harness-demo && npm run demo:otel:mock\`
> 重新生成即可更新；手改会在下一次运行时被覆盖（纪律：修显示值不如修生成器）。

- 生成时间（UTC）：\`${now}\`
- 生成主机：\`${meta.node}\`
- 模型：**本地 mock 端点**（\`${MOCK_MODEL}\`，127.0.0.1:${meta.port}）——**不联网、不需要任何 LLM key**
- 场景：\`src/otel-mock-scenario.ts\` 的冻结脚本（8 个 tool_call 的名字与顺序抄自 \`trajectories/demo.jsonl\`；路径与 write_file 审批策略两处如实适配，见该文件头部注释）
- mock 端点收到的请求数：${meta.requests}

## span 树

\`\`\`
${renderTree(sh)}
\`\`\`

## 计数（可重跑断言见 \`src/otel-assert.ts\` / \`npm run demo:otel:assert\`）

\`\`\`
${renderCounts(sh)}
\`\`\`

## 全量 span 表

| span 名 | operation | parent | 关键属性 | status |
|---|---|---|---|---|
${rows}

## 与历史材料的关系（诚实性声明）

- 本快照是 **mock 实测值**，可被任何人用上面那条命令原样复跑。
- 历史材料里的 \`11 spans / 1 trace\`（${EXPECTED.historicalReportOnly.source}）是**活端点报告值**：仓内没有对应的回放日志，因此**仍标「未验证」**，本文件不把它当作断言，也不为它调整任何判据。
- 仓内旁证：\`trajectories/demo.jsonl\`（活端点跑出的 22 行轨迹）含 6 × \`model_response\` / 8 × \`tool_exec\`；按 \`src/agent.ts\` 的埋点规则（1 \`invoke_agent\` + 每轮 1 \`chat\` + 每次工具 1 \`execute_tool\`）派生 = **15 spans**，与本快照一致，与 11 不一致。
`;
}
