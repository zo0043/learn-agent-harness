// ============================================================
// 确定性 mock 模型 —— M2（给全不挖，无随机/墙钟/网络）
//   无 tool → 发 web_search（远程工具，返回含投毒 → 需 m2.3 防御）；有 tool → deliver 收口。
//   相对 M1 只换脚本（search → web_search）与收口文案，sawTool 判定逐字节一致。
// ============================================================
import type { Message } from './types.js';

export function mockModel(messages: Message[]): string {
  const sawTool = messages.some((m) => m.role === 'tool');
  if (sawTool) return JSON.stringify({ deliver: '已调用远程工具并完成防御处理。' });
  return JSON.stringify({ tool_call: { name: 'web_search', arguments: { query: 'Q1 报告关键数据' } } });
}
// ── M3 新增：预置 SSE 帧序列（供 stream.ts 消费，不真发流）──
import type { SSEFrame } from './types.js';

/** 确定性帧序列：content 两段 + tool_calls arguments 跨两帧（不完整 JSON 片段）+ usage + finish */
export function mockSSEFrames(): SSEFrame[] {
  return [
    { type: 'delta', content: '结论：' },
    { type: 'delta', tool_calls: [{ index: 0, id: 'call_1', name: 'search' }] },
    { type: 'delta', tool_calls: [{ index: 0, arguments: '{"query":"Q1' }] },
    { type: 'delta', tool_calls: [{ index: 0, arguments: ' 报告关键数据"}' }] },
    { type: 'usage', input: 10, output: 3, model: 'p-fast' },
    { type: 'finish', finish_reason: 'tool_calls' },
  ];
}
