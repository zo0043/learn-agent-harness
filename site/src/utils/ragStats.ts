/**
 * 构建期从 `notes/rag.md` §13 解析 rag-demo golden set 的实测数字。
 *
 * 为什么存在（P-01 单一数据源）：站点首页与 /works 展示的评测数字曾经是手抄常量，
 * 与笔记 §13 反复漂移（W0 已止血：recall@3 1.00 → 0.31、85 → 132 chunks）。
 * 手抄只能修一次——下次复测还会再漂。所以改为构建期从笔记解析，§13 是唯一真源。
 *
 * 失败策略：任何一项解析不到立即 throw，让构建失败。
 * **明确禁止静默回退到任何硬编码数字**——那会把「站点数字与笔记不一致」
 * 重新变成无声事故，正是本文件要消灭的失效模式。
 *
 * 口径注：§13 内部同时含已作废的旧值叙述（"旧版宣称的 recall@3=1.00 / @5=0.94"）。
 * 因此 recall 必须按「recall@3 = x / recall@5 = y / recall@10 = z」**整组**匹配，
 * 不能逐项匹配 `recall@N`，否则会命中作废旧值。
 */

export interface RagStats {
  /** recall@3，如 '0.31' */
  recall3: string;
  /** recall@5，如 '0.44' */
  recall5: string;
  /** recall@10，如 '0.50' */
  recall10: string;
  /** PASS 通过题数 / 总题数，如 '3/8' */
  pass: string;
  /** 语料 chunk 数，如 132 */
  chunks: number;
  /** §13 自述的复测日期（ISO），如 '2026-10-12' */
  date: string;
}

/** 取出 notes/rag.md 的 §13 小节正文（`## 13 · …` 起，到下一个 `## ` 之前）。 */
function section13(markdown: string): string {
  const m = /^##\s*13\b[^\n]*$/m.exec(markdown);
  if (!m) {
    throw new Error(
      'parseRagStats: notes/rag.md 找不到 §13 标题（"## 13 · …"）——笔记结构已变，请同步本解析器',
    );
  }
  const rest = markdown.slice(m.index + m[0].length);
  const next = /^##\s/m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

export function parseRagStats(markdown: string): RagStats {
  const sec = section13(markdown);

  // recall 三项整组匹配：§13 内另有作废旧值叙述（recall@3=1.00），逐项匹配会误中。
  const recall =
    /recall@3\s*=\s*([0-9.]+)\s*\/\s*recall@5\s*=\s*([0-9.]+)\s*\/\s*recall@10\s*=\s*([0-9.]+)/.exec(
      sec,
    );
  if (!recall) {
    throw new Error(
      'parseRagStats: §13 找不到 "recall@3 = x / recall@5 = y / recall@10 = z" 整组数字',
    );
  }

  const pass = /PASS\s*(\d+\s*\/\s*\d+)/.exec(sec);
  if (!pass) {
    throw new Error('parseRagStats: §13 找不到 "PASS x/y"');
  }

  const date = /PASS\s*\d+\s*\/\s*\d+\s*[，,]\s*(\d{4}-\d{2}-\d{2})/.exec(sec);
  if (!date) {
    throw new Error('parseRagStats: §13 找不到复测日期（形如 "PASS 3/8，2026-10-12"）');
  }

  // 语料行形如「语料 = 课程笔记自己（rag.md + … → 132 chunks）」。
  // 用「语料 … → N chunks」锚定，避免命中 §13 里 "132↔133 chunks" 的漂移叙述。
  const chunks = /语料[^\n]*?→\s*(\d+)\s*chunks/.exec(sec);
  if (!chunks) {
    throw new Error('parseRagStats: §13 找不到语料 chunk 数（形如 "语料 … → 132 chunks"）');
  }

  return {
    recall3: recall[1],
    recall5: recall[2],
    recall10: recall[3],
    pass: pass[1].replace(/\s+/g, ''),
    chunks: Number(chunks[1]),
    date: date[1],
  };
}
