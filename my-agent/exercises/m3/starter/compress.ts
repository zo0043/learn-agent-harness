// ============================================================
// token 上下文压缩 —— M1：改的是「送模型的视图」，日志留全量
//   超阈值：head=[system,首 user] + 中间确定性摘要 + tail 原样；摘要 truncate 一行，不调真实模型。
// ============================================================
import { type Message } from './types.js';

export interface CompressResult {
  messages: Message[];
  /** 被摘要压缩掉的消息条数（0 = 未触发压缩） */
  summarized: number;
}

/** 粗略 token 估算（字符/3.5，逻辑估算，不调真实 tokenizer） */
function estTokens(m: Message): number {
  const c = typeof m.content === 'string' ? m.content : '';
  return Math.max(1, Math.ceil(c.length / 3.5));
}

export function compress(messages: Message[], threshold: number, keepTail = 2): CompressResult {
  const total = messages.reduce((n, m) => n + estTokens(m), 0);
  if (total <= threshold) return { messages, summarized: 0 };

  // 消息太少压不出「中间段」时直接原样返回（避免 head/tail 重叠）
  if (messages.length <= 2 + keepTail) return { messages, summarized: 0 };

  const head = messages.slice(0, 2);                                  // [system, 首 user]
  const middle = messages.slice(2, messages.length - keepTail);       // 中间待摘要段
  const tail = messages.slice(messages.length - keepTail);            // 尾部原样保留

  const summary = middle
    .map((m) => `${m.role}: ${typeof m.content === 'string' ? m.content.slice(0, 80) : ''}`)
    .join(' | ');
  const summaryMsg: Message = { role: 'user', content: `[压缩：此前 ${middle.length} 条摘要] ${summary}` };

  return {
    messages: [...head, summaryMsg, ...tail],
    summarized: middle.length,
  };
}