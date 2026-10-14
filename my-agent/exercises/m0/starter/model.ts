// ============================================================
// 确定性 mock 模型 —— M0（给全不挖，无随机/墙钟/网络）
//   按 messages 里是否已有 tool 结果决定下一步：无 → 发 read_file；有 → deliver 收口
// ============================================================
import type { Message } from './types.js';

export function mockModel(messages: Message[]): string {
  const sawTool = messages.some((m) => m.role === 'tool');
  if (sawTool) return JSON.stringify({ deliver: 'notes/hello.txt 的内容是：hello from my-agent' });
  return JSON.stringify({ tool_call: { name: 'read_file', arguments: { path: 'notes/hello.txt' } } });
}