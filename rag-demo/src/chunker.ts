/**
 * Chunker——T3 落地：chunk = 语义信号被集中起来的单位。
 *
 * 两级切分（S1 的实操规则）：
 *   1. heading 是第一边界——标题变 = 话题变，最便宜的语义边界信号
 *   2. 某节仍超 MAX_CHARS → 按段落（空行）再切
 *
 * 每片挂完整 headingPath：这是后面"引用你依据的章节"的原料（T3 metadata 的第二重角色）。
 * 失败模式对照（S1）：切太大 → 语义糊；切太小 → 语义不完整。
 * MAX_CHARS 就是在这对之间调的旋钮。
 */

import type { Chunk } from "./types.js";

/** 单 chunk 的软上限（字符）。CJK 信息密度高，500 字 ≈ 一段完整论述 */
export const MAX_CHARS = 500;

export function splitMarkdown(doc: string, source: string): Chunk[] {
  const lines = source.split("\n");

  // 第一遍：按 heading 切段，维护标题栈得到完整 headingPath
  const sections: { path: string; lines: string[] }[] = [];
  const stack: { level: number; text: string }[] = [];
  let current: { path: string; lines: string[] } | null = null;
  const ensure = () => {
    if (!current) {
      current = { path: "", lines: [] };
      sections.push(current);
    }
    return current;
  };

  for (const line of lines) {
    const m = line.match(/^(#{1,6})\s+(.*)$/);
    if (m) {
      const level = m[1].length;
      while (stack.length >= level) stack.pop(); // 同级或更高级标题弹出栈
      stack.push({ level, text: m[2].trim() });
      current = { path: stack.map((h) => h.text).join(" / "), lines: [] };
      sections.push(current);
    } else {
      ensure().lines.push(line);
    }
  }

  // 第二遍：超长段 → 按段落切分，累积到 MAX_CHARS
  const chunks: Chunk[] = [];
  let n = 0;
  const makeChunk = (body: string, path: string) => {
    const searchText = path ? `${path}\n${body}` : body;
    chunks.push({
      id: `${doc}#${n++}`,
      doc,
      headingPath: path,
      text: body,
      searchText,
      length: searchText.length,
    });
  };

  for (const sec of sections) {
    const body = sec.lines.join("\n").trim();
    if (!body) continue;

    if (body.length <= MAX_CHARS) {
      makeChunk(body, sec.path);
      continue;
    }

    let buf = "";
    for (const para of body.split(/\n\s*\n/)) {
      if (buf && buf.length + para.length + 1 > MAX_CHARS) {
        makeChunk(buf, sec.path);
        buf = para;
      } else {
        buf = buf ? `${buf}\n${para}` : para;
      }
      // 单段仍超长 → 硬切（本语料不应触发，防御性保留）
      while (buf.length > MAX_CHARS) {
        makeChunk(buf.slice(0, MAX_CHARS), sec.path);
        buf = buf.slice(MAX_CHARS);
      }
    }
    if (buf) makeChunk(buf, sec.path);
  }

  return chunks;
}
