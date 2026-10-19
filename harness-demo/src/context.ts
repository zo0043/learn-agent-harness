// ============================================================
// ⑧ 上下文预算：token 估算 + 压缩（教学策略）
// ============================================================
import { chat } from "./llm.js";
import type { Message } from "./types.js";

/**
 * 估算：不做精确 tokenization——总字符数/3.5 足够（英文 ~4 字符/token，中文 ~1.5-2）。
 * 教学点：预算检查用估算即可；精确计数只在计费/归因时需要。
 */
export function estimateTokens(messages: unknown[]): number {
  return Math.ceil(JSON.stringify(messages).length / 3.5);
}

/**
 * 压缩策略（教学版）：保 head（system + 首个 user）+ 尾 keepTail 条，
 * 中间段用 LLM 摘要替换。生产变体很多（pi：摘要替代旧消息、原始条目保留）。
 * 注意：压缩改变的是"送模型的视图"，日志永远保留全量（日志≠上下文，课程 ⑧ 节）。
 */
export async function compactIfNeeded(
  messages: Message[],
  threshold: number,
  keepTail = 6,
): Promise<{ messages: Message[]; summarized: number }> {
  if (estimateTokens(messages) < threshold) return { messages, summarized: 0 };
  const head = messages.slice(0, 2);
  const tail = messages.slice(-keepTail);
  const middle = messages.slice(2, messages.length - keepTail);
  if (middle.length === 0) return { messages, summarized: 0 };

  const flat = middle
    .map((m) => {
      if (m.role === "assistant")
        return `assistant: ${m.content ?? ""}${m.tool_calls ? ` [工具调用: ${m.tool_calls.map((t) => t.name).join(", ")}]` : ""}`;
      if (m.role === "tool") return `tool(${m.name ?? ""}): ${m.content.slice(0, 300)}`;
      return `${m.role}: ${m.content ?? ""}`;
    })
    .join("\n");

  const r = await chat({
    messages: [
      {
        role: "user",
        content: `请摘要以下 agent 执行过程，必须保留：目标、已完成步骤、关键决策、未决事项。\n\n${flat}`,
      },
    ],
  });
  const note: Message = {
    role: "user",
    content: `[压缩：此前 ${middle.length} 条消息的摘要] ${r.assistant.content ?? "(无)"}`,
  };
  return { messages: [...head, note, ...tail], summarized: middle.length };
}
