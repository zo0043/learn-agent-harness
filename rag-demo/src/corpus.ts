/**
 * 语料——元选择：课程笔记自己当语料。
 * 课程正文就是这套内容，golden set 标注因此非常自然，不用对陌生语料猜"相关"。
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { splitMarkdown } from "./chunker.js";
import type { Chunk } from "./types.js";

// harness-demo bug #1 的教训：__dirname 必须是目录（dirname(fileURLToPath(...))），不是文件路径
const here = dirname(fileURLToPath(import.meta.url)); // rag-demo/src
const root = resolve(here, "..", ".."); // learn-agent-harness

const DOCS = [
  { name: "rag.md", path: resolve(root, "notes/rag.md") },
  { name: "agent-harness.md", path: resolve(root, "notes/agent-harness.md") },
  { name: "handoff.md", path: resolve(root, "handoff.md") },
];

export function loadCorpus(): Chunk[] {
  const chunks: Chunk[] = [];
  for (const d of DOCS) {
    const source = readFileSync(d.path, "utf8");
    chunks.push(...splitMarkdown(d.name, source));
  }
  return chunks;
}
