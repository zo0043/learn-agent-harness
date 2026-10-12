/**
 * S5：golden set + recall@k + 错误归因——T7 的示波器。
 *
 * recall@k = |top-k ∩ relevant| / |relevant|（分母 = 相关集，不是 k）
 * 系统分 = 各题平均。
 *
 * 错误归因签名（漏掉的每个相关 chunk 单独定位）：
 *   两路都在 top-10、融合却漏了   → 融合权重问题
 *   一路 top-10、另一路深埋       → 一路的盲区被融合救回（或该救没救）
 *   两路都 >10                     → 表面形式盲区（paraphrase/同义）或切块/覆盖问题
 *   范围外题                        → 拒答轨（demo-rag 测），不进 recall 统计
 *
 * gold 定位机制（2026-10-12 修；旧指针漂移的教训）：
 *   旧版 gold = chunk id 指针（"rag.md#28"，由某次快照的行号拼成）。语料一次编辑指针就漂移：
 *   rag.md 新增 4 张 mermaid + S1 题库节之后，rag.md#33 / rag.md#38 已不存在，rag.md#28/#29
 *   指向的是"实操复盘/确认题"段——相关 chunk 命中 0，却仍静默算出 recall 0.13（宣称值 1.00）。
 *   新版 gold = **文本锚点**：每个 gold 跨度一个 distinctive 中文子串（8-20 字、从
 *   notes/rag.md、notes/agent-harness.md、handoff.md 的现行内容 grep 得到、不含 markdown 符号）。
 *   启动时对 corpus 全部 chunk 做子串匹配，把锚点解析成 chunk id（同一锚点可命中多个 chunk，全部算 gold）；
 *   **任一锚点匹配不到任何 chunk：立即打印 ❌（题号 + 锚点原文 + 建议）并以非零码退出**——
 *   指针失效从"静默错数"变成"响亮失败"，绝不再静默 0.00。
 *   代价：语料大改版要重挑锚点；收益：评测数字永远可归因到现行原文。
 */

import { loadCorpus } from "./corpus.js";
import { HashEmbedder } from "./embed.js";
import { BruteForceCosine } from "./index.js";
import { BM25 } from "./bm25.js";
import { rrfFusion } from "./rrf.js";

interface GoldenQ {
  q: string;
  /** gold 锚点：每个 gold 跨度一个 distinctive 中文子串（语料现行原文，非行号/id 指针） */
  anchors: string[];
  outOfScope?: boolean; // 范围外题 → 拒答轨，不进 recall 统计
  note?: string;
}

const GOLDEN: GoldenQ[] = [
  {
    q: "BM25 的词频为什么要饱和？k1 参数控制什么？",
    anchors: ["IDF × tf 饱和 × 长度归一", "k1=1.5, b=0.75"],
    note: "词频饱和 + k1（rag.md §⑥/§13）",
  },
  {
    q: "IDF 是什么？为什么是对数函数？",
    anchors: ["基于词频/文档频率的概率检索函数", "BM25 词面路"],
    note: "IDF = 词频/文档频率（rag.md §⑥）",
  },
  {
    q: "chunker 的 headingPath metadata 为什么必要？",
    anchors: ["语义边界远好于任意", "文档 id、章节、时间戳", "挂 headingPath"],
    note: "结构感知切块 + 元数据（rag.md §④/§13）",
  },
  {
    q: "混合检索怎么用 RRF 融合两路分数？",
    anchors: ["两条路都走，用 RRF 融合", "只用排名不用分数"],
    note: "RRF 只用排名（rag.md §⑥）",
  },
  {
    q: "recall@k 评测指标怎么定义？",
    anchors: ["正确答案所在块有没有进 top-k"],
    note: "指标定义表（rag.md §⑨）",
  },
  {
    q: "代理里哪些模型下架了，现在能用哪些？",
    anchors: ["已从代理下架，现用", "无此模型，qwen 系现剩"],
    note: "模型轮换（handoff.md 两处）",
  },
  {
    q: "上下文压缩（compact）机制是怎么工作的？",
    anchors: ["把旧消息摘要化后开新上下文继续", "全程 105s"],
    note: "同词面（agent-harness §5.2 + handoff 活体记录）",
  },
  {
    q: "系统怎么防止上下文溢出？",
    anchors: ["把旧消息摘要化后开新上下文继续", "全程 105s"],
    note: "paraphrase 探针（预期暴露表面形式盲区）",
  },
  { q: "苹果的 CEO 是谁？", anchors: [], outOfScope: true, note: "拒答轨" },
  { q: "北京今天天气怎么样？", anchors: [], outOfScope: true, note: "拒答轨" },
];

const chunks = loadCorpus();

// ---- gold 锚点 → chunk id：文本锚点定位，替代旧的行号/id 指针 ----
interface ResolvedGold {
  no: number;
  q: string;
  note?: string;
  ids: string[];
}
const golds: ResolvedGold[] = [];
const anchorMiss: { no: number; q: string; anchor: string }[] = [];
let anchorTotal = 0;
let anchorHit = 0;

GOLDEN.forEach((g, i) => {
  if (g.outOfScope) return; // 拒答轨无 gold 锚点
  const ids = new Set<string>();
  if (g.anchors.length === 0) {
    anchorMiss.push({ no: i + 1, q: g.q, anchor: "（本题未配置任何锚点）" });
    return;
  }
  for (const a of g.anchors) {
    anchorTotal += 1;
    const hit = chunks.filter((c) => c.text.includes(a));
    if (hit.length === 0) {
      anchorMiss.push({ no: i + 1, q: g.q, anchor: a });
      continue;
    }
    anchorHit += 1;
    for (const c of hit) ids.add(c.id); // 同一锚点命中多个 chunk：全部算 gold
  }
  golds.push({ no: i + 1, q: g.q, note: g.note, ids: [...ids] });
});

if (anchorMiss.length > 0) {
  for (const m of anchorMiss) {
    console.log(`❌ Q${m.no} 锚点未命中：「${m.anchor}」在语料 ${chunks.length} 个 chunk 中子串匹配 0 条`);
    console.log(`    题目：${m.q}`);
  }
  console.log(
    `    建议：语料已改版或该段被删——用 grep 在 notes/rag.md、notes/agent-harness.md、handoff.md 里找现行原文，重挑 8-20 字、能唯一定位该段、不含 markdown 符号的中文锚点，再跑本评测。`,
  );
  console.log(`\ngold 锚点解析：${anchorHit}/${anchorTotal} 命中 —— 指针失效，拒绝出数（退出码 1）`);
  process.exit(1);
}

const embedder = new HashEmbedder();
const cosine = new BruteForceCosine();
cosine.build(chunks, embedder.embed(chunks.map((c) => c.searchText)));
const bm25 = new BM25();
bm25.build(chunks);

const K_LIST = [3, 5, 10];

console.log(`Golden set：${GOLDEN.length} 题（范围外 ${GOLDEN.filter((g) => g.outOfScope).length} 题走拒答轨）\n`);

const rows: { no: number; q: string; note?: string; recalls: number[]; misses: { id: string; cosRank: number; bmRank: number }[] }[] = [];

for (const g of golds) {
  const cosFull = cosine.topK(embedder.embed([g.q])[0], chunks.length);
  const bmFull = bm25.topK(g.q, chunks.length);
  const fused = rrfFusion(
    [
      { name: "cosine", results: cosFull },
      { name: "bm25", results: bmFull },
    ],
    60,
    chunks.length,
  );

  const recalls = K_LIST.map((k) => {
    const top = new Set(fused.slice(0, k).map((f) => f.chunk.id));
    return g.ids.filter((id) => top.has(id)).length / g.ids.length;
  });

  const top10 = new Set(fused.slice(0, 10).map((f) => f.chunk.id));
  const misses = g.ids
    .filter((id) => !top10.has(id))
    .map((id) => ({
      id,
      cosRank: cosFull.find((r) => r.chunk.id === id)?.rank ?? -1,
      bmRank: bmFull.find((r) => r.chunk.id === id)?.rank ?? -1,
    }));

  rows.push({ no: g.no, q: g.q, note: g.note, recalls, misses });

  const marks = recalls.map((r) => (r === 1 ? "1.00" : r.toFixed(2))).join("  ");
  const pass = recalls[2] === 1; // 判据：全部 gold chunk 进 top-10
  console.log(
    `Q${g.no} [${g.note}] ${g.q.slice(0, 22).padEnd(24)} rec@3/5/10 = ${marks}  相关 ${g.ids.length}  ${pass ? "✅ PASS" : "❌ FAIL"}`,
  );
  for (const m of misses) {
    const sig =
      m.cosRank <= 10 || m.bmRank <= 10
        ? `一路在 top-10（cosine#${m.cosRank} / bm25#${m.bmRank}）`
        : `两路都漏（cosine#${m.cosRank} / bm25#${m.bmRank}）→ 表面形式盲区或切块问题`;
    console.log(`    ✗ 漏 ${m.id}：${sig}`);
  }
}

console.log("");
const avg = (i: number) => rows.reduce((s, r) => s + r.recalls[i], 0) / rows.length;
console.log(`系统平均：recall@3 = ${avg(0).toFixed(2)}   recall@5 = ${avg(1).toFixed(2)}   recall@10 = ${avg(2).toFixed(2)}   （${rows.length} 道范围内题）`);
console.log(`PASS ${rows.filter((r) => r.recalls[2] === 1).length}/${rows.length}（判据：recall@10 = 1.00，全部 gold chunk 进 top-10）`);

console.log("\nOUT-OF-SCOPE 汇总（拒答轨，不进 recall 统计；拒答行为由 demo-rag 端到端验证）：");
GOLDEN.forEach((g, i) => {
  if (!g.outOfScope) return;
  console.log(`  Q${i + 1} ${g.q}  → 期望：明确拒答"资料中没有"，不硬编（${g.note}）`);
});

console.log(`\ngold 锚点解析：${anchorHit}/${anchorTotal} 全部命中（文本锚点 → ${chunks.length} 个 chunk 子串匹配；旧行号/id 指针已弃用）`);
