// ============================================================
// 可观测 §S2：OTel GenAI 埋点（厂商中立的轨迹格式，语义约定见 notes/observability.md）
//   span 树（S3）：invoke_agent（1 trace = 1 任务/会话）
//                  ├─ chat          每次 LLM 调用（模型名/tokens/finish）
//                  └─ execute_tool  每次工具调用（工具名/参数摘要/状态/结果摘要）
//   导出：console 默认（demo 时实时打印 span）；OTEL_EXPORT_OTLP=1 才加 OTLP/HTTP（默认关）
//   不调 initOtel() 时全局 tracer 是 no-op 代理 → 现有 4 种 demo 模式零影响
// ============================================================
import { SpanStatusCode, trace } from "@opentelemetry/api";
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  ConsoleSpanExporter,
  InMemorySpanExporter,
  SimpleSpanProcessor,
  type SpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { resourceFromAttributes } from "@opentelemetry/resources";

/** OpenAI 兼容协议 → gen_ai.system（S2：provider 家族名） */
export const GEN_AI_SYSTEM = "openai";

export const tracer = trace.getTracer("harness-demo");

const memoryExporter = new InMemorySpanExporter(); // 收集已导出 span，收尾打摘要
let provider: BasicTracerProvider | null = null;

/**
 * 仅 demo:otel 入口调用；幂等。
 * @param opts.console 是否挂 ConsoleSpanExporter（默认 true，保持 `demo:otel` 行为不变）；
 *   离线断言脚本传 false——它自己打印 span 树，不需要原始 span JSON 噪声。
 */
export async function initOtel(opts: { console?: boolean } = {}): Promise<void> {
  if (provider) return;
  const processors: SpanProcessor[] = [new SimpleSpanProcessor(memoryExporter)];
  if (opts.console !== false) processors.unshift(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  if (process.env.OTEL_EXPORT_OTLP === "1") {
    // 可选 OTLP 导出：动态 import，默认不加载（环境变量开关，不默认开）
    const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
    processors.push(new BatchSpanProcessor(new OTLPTraceExporter()));
  }
  provider = new BasicTracerProvider({
    resource: resourceFromAttributes({ "service.name": "harness-demo" }),
    spanProcessors: processors,
  });
  trace.setGlobalTracerProvider(provider);
}

export async function shutdownOtel(): Promise<void> {
  await provider?.shutdown();
}

/**
 * 已结束/已导出的 span 列表（断言用）。
 * 用途：`src/otel-assert.ts` 在**离线 mock 模型**下对 span 树做确定性断言
 * （见 package.json 的 demo:otel:mock / demo:otel:assert）。
 * 注意：这是内存导出器的快照，只反映本进程 initOtel() 之后产生的 span。
 */
export function finishedSpans() {
  return memoryExporter.getFinishedSpans();
}

/** demo 收尾：打印收到的 span 摘要（span 名 + 关键属性），验证埋点生效 */
export function printSpanSummary(): void {
  const spans = memoryExporter.getFinishedSpans();
  console.log(`\n[otel] 收到 ${spans.length} 个 span（${new Set(spans.map((s) => s.spanContext().traceId)).size} 个 trace）：`);
  for (const s of spans) {
    const a = s.attributes;
    const bits: string[] = [];
    if (a["gen_ai.request.model"]) bits.push(`model=${a["gen_ai.request.model"]}`);
    if (a["gen_ai.usage.input_tokens"] != null)
      bits.push(`tokens=${a["gen_ai.usage.input_tokens"]}in/${a["gen_ai.usage.output_tokens"]}out`);
    if (a["gen_ai.response.finish_reasons"]) bits.push(`finish=${JSON.stringify(a["gen_ai.response.finish_reasons"])}`);
    if (a["gen_ai.tool.name"]) bits.push(`tool=${a["gen_ai.tool.name"]}`);
    if (a["harness.tool.status"]) bits.push(`toolStatus=${a["harness.tool.status"]}`);
    const code = s.status.code;
    const ms = Math.round(s.duration[0] * 1000 + s.duration[1] / 1e6);
    console.log(`  - ${s.name} [${a["gen_ai.operation.name"] ?? "?"}] ${bits.join(" ")} → ${code === SpanStatusCode.ERROR ? "ERROR" : code === SpanStatusCode.OK ? "OK" : "UNSET"} ${ms}ms`);
  }
}
