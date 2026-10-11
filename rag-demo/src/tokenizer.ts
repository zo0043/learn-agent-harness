/**
 * 分词器——词法检索第一个静默杀手（理论课 ⑦ "tokenize" 的落地）。
 *
 * 规则：
 *  - 拉丁/数字串 → 整词小写；词内保留 . _ -，
 *    让 "qwen3.8-flash-next" 保持一个 token（切碎 → 稀有术语匹配不上）
 *  - CJK 串 → 字符 bigram（"上下文压缩" → 上下/下文/文压/压缩）
 *    单字碰撞太多（"的/是/了" 撞掉一切语义），bigram 是最便宜的近似词单元
 *
 * 注意：这是"表面形式"分词——不认同义词（"压缩" ≠ "compact" → 不同 token）。
 * 这个盲区是 demo 要亲眼展示的：它正是 embedder 接口存在、
 * 以及"换真语义模型"这件事有实际价值的地方。
 */

const LATIN_RE = /[a-z0-9][a-z0-9._\-]*/g;
const CJK_RE = /[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]+/g;

export function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const lower = text.toLowerCase();

  for (const m of lower.matchAll(LATIN_RE)) tokens.push(m[0]);

  for (const m of lower.matchAll(CJK_RE)) {
    const run = m[0];
    if (run.length === 1) tokens.push(run);
    for (let i = 0; i + 2 <= run.length; i++) tokens.push(run.slice(i, i + 2));
  }

  return tokens;
}
