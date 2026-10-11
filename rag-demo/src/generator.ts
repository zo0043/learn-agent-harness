/**
 * 生成器——检索结果 → 带引用的答案（+ 拒答）。
 *
 * 提示词的两条纪律（理论课 ⑧）：
 *   1. 强制引用：答案必须标注依据了哪个材料 [n]——
 *      答案可审计，且 T7 的错误归因有了抓手：
 *        答案错 + 有引用 → chunk 检索到了但生成环节坏了
 *        答案错 + 无引用 → 检索环节就没把该 chunk 捞进来
 *   2. 强制拒答：材料不足时必须说"材料不足"——
 *      RAG 的失败模式不是"不知道"，是"自信地编"（幻觉），
 *      拒答指令是对幻觉的第一道防线
 */

import { chat } from "./llm.js";
import type { Chunk } from "./types.js";

const SYSTEM = `你是检索增强问答模型（RAG）。规则：
1. 只依据下面编号的材料回答问题，不得使用外部知识。
2. 依据某个材料时，在相应句子末尾标注引用 [n]（n = 材料编号）。
3. 答案末尾单独一行"引用：[n] 文档/标题"，列出所有引用过的材料。
4. 如果材料不足以回答问题，必须明确回答"材料不足"，并简短说明缺少什么信息，不要猜测、不要编造。`;

export function buildUserPrompt(query: string, chunks: Chunk[]): string {
  const materials = chunks
    .map((c, i) => `[${i + 1}]（${c.doc} / ${c.headingPath}）\n${c.text}`)
    .join("\n\n");
  return `问题：${query}\n\n材料：\n${materials}`;
}

export interface RagAnswer {
  answer: string;
  /** 模型是否自称"材料不足"（拒答） */
  refused: boolean;
}

export async function generateAnswer(query: string, chunks: Chunk[]): Promise<RagAnswer> {
  if (chunks.length === 0) return { answer: "材料不足：检索结果为空。", refused: true };
  const answer = await chat([
    { role: "system", content: SYSTEM },
    { role: "user", content: buildUserPrompt(query, chunks) },
  ]);
  return { answer, refused: answer.includes("材料不足") };
}
