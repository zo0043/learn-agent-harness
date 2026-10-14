// ============================================================
// SSE 流式解析 —— M3（挖 m3.2）：分帧 / 跨帧拼接 / 断流打标
//   content 边收边拼；tool_calls 按 index 分槽跨帧拼 arguments；流结束整体 JSON.parse（绝不对单片段 parse）。
// ============================================================
import { TODOError, type SSEFrame, type StreamResult } from './types.js';

/** 流中 error 帧 → 抛分类错误（kind:"error-frame"） */
export class StreamError extends Error {
  constructor(readonly kind: 'error-frame', message: string) {
    super(message);
    this.name = 'StreamError';
  }
}

export async function consumeStream(_frames: Iterable<SSEFrame> | AsyncIterable<SSEFrame>): Promise<StreamResult> {
  // TODO m3.2：delta 拼 content；tool_calls 按 index 分槽跨帧拼（arguments 只拼接）；流结束整体 JSON.parse 一次；error 帧抛 StreamError；缺 finish 帧 incomplete=true
  throw new TODOError('m3.2: 实现 SSE 分帧/跨帧拼接/断流打标');
}