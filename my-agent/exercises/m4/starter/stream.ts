// ============================================================
// SSE 流式解析 —— M3：分帧 / 跨帧拼接 / 断流打标
//   content 边收边拼；tool_calls 按 index 分槽跨帧拼 arguments；流结束整体 JSON.parse（绝不对单片段 parse）。
// ============================================================
import type { SSEFrame, StreamResult, ToolCall } from './types.js';

/** 流中 error 帧 → 抛分类错误（kind:"error-frame"） */
export class StreamError extends Error {
  constructor(readonly kind: 'error-frame', message: string) {
    super(message);
    this.name = 'StreamError';
  }
}

export async function consumeStream(frames: Iterable<SSEFrame> | AsyncIterable<SSEFrame>): Promise<StreamResult> {
  let content = '';
  let incomplete = true; // 收到 finish 帧才置 false；断流保持 true
  let usage: StreamResult['usage'] = null;
  const slots = new Map<number, { id: string; name: string; argsStr: string }>();

  for await (const frame of frames) {
    if (frame.type === 'error') throw new StreamError('error-frame', frame.message);
    if (frame.type === 'delta') {
      if (frame.content) content += frame.content;
      for (const tc of frame.tool_calls ?? []) {
        const idx = tc.index ?? 0;
        const slot = slots.get(idx) ?? { id: '', name: '', argsStr: '' };
        if (tc.id) slot.id = tc.id;
        if (tc.name) slot.name += tc.name;
        if (tc.arguments) slot.argsStr += tc.arguments; // 不完整 JSON 片段只拼接，不 parse
        slots.set(idx, slot);
      }
    } else if (frame.type === 'usage') {
      usage = { input: frame.input, output: frame.output, model: frame.model };
    } else if (frame.type === 'finish') {
      incomplete = false;
    }
  }

  const toolCalls: ToolCall[] = [...slots.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, s]) => ({
      id: s.id,
      name: s.name,
      arguments: s.argsStr ? (JSON.parse(s.argsStr) as Record<string, unknown>) : {},
    }));

  return { content, toolCalls, usage, incomplete };
}