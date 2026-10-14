// ============================================================
// mock provider + SSE 帧生成器 —— API 与多模型路由 §S2
//   照搬 harness-demo/src/llm.ts chatStream 的帧语义（独立实现，不跨目录 import）
//   新增：故障注入（可开关）+ 流中 error 帧 / 断流 两分支
// ============================================================
import type { FaultKind, ProviderSpec, SSEFrame } from "./types.js";

/** 两个 mock provider：p-fast 便宜无工具（短窗）/ p-capable 贵有工具结构化（长窗） */
export const PROVIDERS: ProviderSpec[] = [
  { id: "p-fast", toolCalling: false, structured: false, windowTokens: 4096, price: { input: 0.5, output: 1.5 } },
  { id: "p-capable", toolCalling: true, structured: true, windowTokens: 32768, price: { input: 3, output: 15 } },
];

export function providerById(id: string): ProviderSpec {
  const p = PROVIDERS.find((x) => x.id === id);
  if (!p) throw new Error(`未知 provider：${id}`);
  return p;
}

/** 事故素材（api-engineering §S7）：把带 function calling 的请求误路由到不支持 functions 的模型 */
export const ROUTE_400_MSG = "functions parameter of the code model must be provided";

/** transport 层故障（无帧）：status=4xx/5xx 或 timeout；分类靠 signal */
export class ProviderError extends Error {
  constructor(
    public readonly signal: { status?: number; err?: string },
    message: string,
  ) {
    super(message);
  }
}

export interface CallOpts {
  content?: string;
  toolCall?: { name: string; arguments: Record<string, unknown> };
  /** 故障注入（默认关）：正常断言不传；事故场景才开，保证确定性不被污染 */
  fault?: FaultKind | null;
}

/**
 * mock 调用：正常 → yield 预置帧序列；fault → 注入对应故障。
 * - 400 / 500 / timeout 属 transport 层，抛 ProviderError（不进帧流）
 * - error-frame 产一个 error 帧；eof 产一个 delta 后无 finish（断流）
 */
export async function* callProvider(provider: ProviderSpec, opts: CallOpts = {}): AsyncGenerator<SSEFrame> {
  switch (opts.fault) {
    case "400":
      throw new ProviderError({ status: 400 }, `${provider.id} → HTTP 400：${ROUTE_400_MSG}`);
    case "500":
      throw new ProviderError({ status: 500 }, `${provider.id} → HTTP 500：internal server error`);
    case "timeout":
      throw new ProviderError({ err: "timeout" }, `${provider.id} → 超时（无响应）`);
    case "error-frame":
      yield { type: "error", message: `${provider.id} 流中断（provider 内部错误）` };
      return;
    case "eof":
      yield { type: "delta", content: "premature" };
      return; // 缺 finish 帧 → 断流
    default:
      break;
  }
  yield* emitFrames(provider, opts);
}

/** 预置帧：content 两帧拼接 + tool_calls 跨帧（首帧 id/name，arguments 两段）+ usage + finish */
export function emitFrames(provider: ProviderSpec, opts: CallOpts = {}): SSEFrame[] {
  const frames: SSEFrame[] = [];
  if (opts.content) {
    const mid = Math.ceil(opts.content.length / 2);
    frames.push({ type: "delta", content: opts.content.slice(0, mid) });
    frames.push({ type: "delta", content: opts.content.slice(mid) });
  }
  if (opts.toolCall) {
    const json = JSON.stringify(opts.toolCall.arguments);
    const mid = Math.ceil(json.length / 2);
    frames.push({ type: "delta", tool_calls: [{ index: 0, id: "call_1", name: opts.toolCall.name }] });
    frames.push({ type: "delta", tool_calls: [{ index: 0, arguments: json.slice(0, mid) }] });
    frames.push({ type: "delta", tool_calls: [{ index: 0, arguments: json.slice(mid) }] });
  }
  frames.push({ type: "usage", input: 10, output: 3, model: provider.id });
  frames.push({ type: "finish", finish_reason: opts.toolCall ? "tool_calls" : "stop" });
  return frames;
}