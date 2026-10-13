// 记忆检索层 —— 词法路（BM25 / IDF 定价）∥ 向量路（确定性 hash embedding）→ RRF 融合
//
// 对齐 notes/long-term-memory.md：
//   §S4「混合检索：向量（dense）∥ BM25（lexical）」+ §S4 设计要点「记忆里专有名词/ID 多，BM25 这一路尤其不可省」
//   §S4「RRF 融合（k=60，Cormack et al. 2009）：向量分数 ∈[-1,1]、BM25 无界，不可直接相加，用排名做公共货币」
//   §S10 步骤 4.3「BM25 路命中罕见词 pnpm（高 IDF）→ 排 #1；向量路命中语义 → 排 #3」
//
// 与 rag-demo/ 的关系（诚实标注，不吹）：机制同源（同一套 tokenizer 约定：拉丁整词 + CJK bigram；
// 同一套 BM25 公式），但**参数与实现是各自独立的**——rag-demo 用 k1=1.5/b=0.75 + FNV-1a 768 维 HashEmbedder，
// 本套件用 k1=1.2/b=0.75 + 64 维字符三元组 hash。之所以不直接 import rag-demo/：
// ① 本目录零依赖契约（不引入 tsx 构建链）；② 两份实现互为独立来源，其中一份算错不会被另一份掩盖。
// 参数不同这件事在 README 与笔记映射表里显式写出，不当作"复用 rag-demo"来讲。
//
// 确定性：本文件不使用 Date/Math.random——embedding 由内容与**位置**（而非全局计数器）决定，
// 因此同一批条目在同一进程 / 新进程重建后得到逐字节相同的分数。

/** S4 融合参数：RRF k=60（Cormack et al. 2009，与 rag-demo 的一致） */
export const RRF_K = 60;
/** 向量路维度（字符三元组 hash；与 rag-demo 的 768 维无关，见文件头诚实标注） */
export const EMB_DIM = 64;

/** BM25 词法路打分（k1=1.2, b=0.75）：df 由传入的 pool 现算，R11 的"罕见词高 IDF"就靠这一步 */
export function bm25Rank(pool, query) {
  const docs = pool.map((it) => ({ it, toks: tokenize(it.content ?? '') }));
  const N = docs.length || 1;
  const df = new Map();
  for (const d of docs) for (const t of new Set(d.toks)) df.set(t, (df.get(t) ?? 0) + 1);
  const avgdl = docs.reduce((s, d) => s + d.toks.length, 0) / N || 1;
  const q = tokenize(query);
  const scored = docs.map((d) => {
    let score = 0;
    for (const t of q) {
      const f = d.toks.filter((x) => x === t).length;
      if (!f) continue;
      const idf = Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5)); // 罕见词高 IDF（S10 步骤 4.3）
      score += idf * ((f * 2.2) / (f + 1.2 * (1 - 0.75 + 0.75 * (d.toks.length / avgdl))));
    }
    return { item: d.it, score: Number(score.toFixed(5)) };
  }).filter((r) => r.score > 0);
  scored.sort((a, b) => b.score - a.score || (a.item.id < b.item.id ? -1 : 1));
  return scored;
}

/** 向量路打分：与词法路**互补**——三元组哈希对子串/形态变化敏感，能捞到词法整词匹配漏掉的条目 */
export function denseRank(pool, query) {
  const q = embed(query);
  return pool
    .map((it) => {
      const v = it.embedding ?? embed(it.content ?? '');
      let dot = 0;
      for (let i = 0; i < EMB_DIM; i += 1) dot += q[i] * v[i];
      return { item: it, score: Number(dot.toFixed(5)) };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || (a.item.id < b.item.id ? -1 : 1));
}

/** S4 RRF：用排名做公共货币（向量 ∈[-1,1] 与 BM25 无界不可直接相加） */
export function rrfFuse(rankings, k = RRF_K) {
  const acc = new Map();
  rankings.forEach((ranking, listIdx) => {
    ranking.forEach((r, i) => {
      const cur = acc.get(r.item) ?? { item: r.item, score: 0, lexRank: null, vecRank: null };
      cur.score = Number((cur.score + 1 / (k + i + 1)).toFixed(5));
      if (listIdx === 0) cur.lexRank = i + 1;
      else cur.vecRank = i + 1;
      acc.set(r.item, cur);
    });
  });
  // 同分裁决：先词法路排名（记忆场景专有词/ID 多，[S4] 明确"BM25 这一路尤其不可省"），再向量路，最后 id。
  // 没有这层裁决，两路各投一票的条目会退化成 id 序，等于把"哪一路更可信"的信息丢掉。
  const tie = (a, b) => (a.lexRank ?? Infinity) - (b.lexRank ?? Infinity) ||
    (a.vecRank ?? Infinity) - (b.vecRank ?? Infinity) || (a.item.id < b.item.id ? -1 : 1);
  return [...acc.values()].sort((a, b) => b.score - a.score || tie(a, b));
}

/**
 * 确定性 hash embedding（64 维字符三元组计数，L2 归一）。
 * §S10 步骤 3 的 schema 里 embedding 是一等字段；§S10 步骤 7.2 要求删除时"清空向量"——
 * 因此它必须是可写入字段（不是每次查询现算），否则"清空"无从断言。
 */
export function embed(text) {
  const s = `^${String(text).toLowerCase()}$`;
  const v = new Array(EMB_DIM).fill(0);
  for (let i = 0; i + 3 <= s.length; i += 1) v[hash32(s.slice(i, i + 3)) % EMB_DIM] += 1;
  const norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0)) || 1;
  return v.map((x) => Number((x / norm).toFixed(6)));
}

function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** 与 rag-demo/src/tokenizer.ts 同一约定：拉丁整词（小写）+ CJK bigram */
export function tokenize(s) {
  const latin = (String(s).toLowerCase().match(/[a-z][a-z0-9_.-]{1,}/g) ?? []);
  const cjk = (String(s).match(/[\u4e00-\u9fff]{2,}/g) ?? []).flatMap((w) => {
    const out = [];
    for (let i = 0; i < w.length - 1; i += 1) out.push(w.slice(i, i + 2));
    return out;
  });
  return [...latin, ...cjk];
}
