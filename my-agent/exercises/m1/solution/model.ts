// ============================================================
// 确定性 mock 模型 —— M1（给全不挖，无随机/墙钟/网络）
//   按 messages 里是否已有 tool 结果决定下一步：无 → 发 search；有 → deliver 收口。
//   相对 M0 只换了脚本（read_file → search），确定性底座（sawTool 判定）逐字节一致。
// ============================================================
import type { Message } from './types.js';

export function mockModel(messages: Message[]): string {
  const sawTool = messages.some((m) => m.role === 'tool');
  if (sawTool) return JSON.stringify({ deliver: '检索结果：BM25 是词频饱和的概率检索函数，k1 控制饱和程度。' });
  return JSON.stringify({ tool_call: { name: 'search', arguments: { query: 'BM25' } } });
}