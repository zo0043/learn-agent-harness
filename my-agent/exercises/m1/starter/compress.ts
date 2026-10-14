// ============================================================
// token 上下文压缩 —— M1（挖 m1.2）：改的是「送模型的视图」，日志留全量
//   超阈值：head=[system,首 user] + 中间确定性摘要 + tail 原样；摘要 truncate 一行，不调真实模型。
// ============================================================
import { TODOError, type Message } from './types.js';

export interface CompressResult {
  messages: Message[];
  /** 被摘要压缩掉的消息条数（0 = 未触发压缩） */
  summarized: number;
}

export function compress(_messages: Message[], _threshold: number, _keepTail = 2): CompressResult {
  // TODO m1.2：估算 token 超 threshold 时，head + 中间确定性摘要 + tail 裁剪；未超原样返回 summarized=0
  throw new TODOError('m1.2: 实现超窗口下限的「摘要 + 尾部原样」裁剪');
}