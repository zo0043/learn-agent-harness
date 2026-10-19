# rag-demo — 从零写最小 RAG（RAG 与检索 实操作品）

一个可运行的 RAG pipeline，把课程 `../notes/rag.md` 的理论逐层落地：
corpus → chunker → tokenizer → HashEmbedder → 暴力余弦 ∥ BM25 → RRF 融合 → rerank 插槽 → 生成（强制引用 + 拒答）→ golden set 评测。
语料 = 课程笔记自己（rag.md + agent-harness.md + handoff.md）。零运行时依赖，tsx 直跑。

## 文件地图

```
src/types.ts        核心类型：Chunk / Embedder 接口 / ScoredChunk
src/corpus.ts       语料加载（读 notes/*.md + handoff.md → 切成 chunk）
src/chunker.ts      heading 边界两级切分 + headingPath metadata（MAX_CHARS=500 兜底）
src/tokenizer.ts    拉丁整词（保留 . _ -）+ CJK 字符 bigram
src/embed.ts        HashEmbedder：FNV-1a → 768 维计数 → L2 归一（离线、确定性）
src/index.ts        BruteForceCosine：预归一化 → 点积 → 排序（暴力 O(N)）
src/bm25.ts         BM25：IDF × tf 饱和(k1=1.5) × 长度归一(b=0.75)，附 explain() 发票
src/rrf.ts          RRF 融合：Σ 1/(k+rank)，k=60（rank 是两表唯一公共货币）
src/rerank.ts       Reranker 插槽 + IdentityReranker 直通（接真 rerank 一行不改）
src/generator.ts    生成：强制引用 [n] + 强制拒答
src/llm.ts          OpenAI 兼容 /chat/completions 客户端（非流式）
src/demo-retrieval.ts   S2 demo：向量路全链
src/demo-bm25.ts        S3 demo：cosine vs BM25 + 发票
src/demo-rag.ts         S4 demo：端到端（含生成，3 次 LLM 调用）
src/evaluate.ts         S5 demo：golden set + recall@k + 错误归因
```

## 跑法

零运行时依赖，tsx 直跑（需要 node ≥ 18；本机默认 node v12，用 nvm 的）：

```bash
export PATH=~/.nvm/versions/node/v22.23.2/bin:$PATH
npm install

# rag-demo/.env：仅 demo:rag 需要 LLM（3 次调用）；retrieval / bm25 / eval 全离线、可不配
cp .env.example .env   # 填入 LLM_BASE_URL / LLM_API_KEY / LLM_MODEL

npm run demo:retrieval  # S2 向量路
npm run demo:bm25       # S3 BM25 对比 + 发票
npm run demo:rag        # S4 端到端（含生成，3 次 LLM 调用）
npm run demo:eval       # S5 golden set + recall@k
```

命令出处：`package.json` scripts 第 8-11 行。
模型要求：OpenAI 兼容 `/chat/completions`（非流式）。默认 `qwen3.8-flash-next`（见 `.env.example`；代理模型会轮换，跑前看 `GET /v1/models`）。

## 三个实证发现

1. **定价 = 检索质量**：cosine 给所有 token 统一定价 $1 → 塞满噪声词的题库 chunk 压过真正的解释 chunk；换 BM25 价目表（IDF × tf 饱和 × 长度归一）目标回 #1。`explain()` 把每个 token 的收费打出来。
2. **没有一路全面占优**：噪声词重灾 BM25 赢、话题聚簇 cosine 赢 → RRF 按 rank 融合（唯一无量纲公共货币）；`perListRanks` 让"一路失明、另一路救回"可见。
3. **bigram 代价**：CJK bigram 是近似词单元，"上下文"三字词会拆、垃圾碎片会被当稀有信号定价 → 真实系统用正经分词器或语义 embedding（Tokenizer / Embedder 都是模块，pipeline 不动）。

## 评测（golden set）

golden set 10 题：8 道范围内 + 2 道范围外（走拒答轨，不进 recall 统计）。
recall@k = |top-k ∩ relevant| / |relevant|（分母 = 相关集，不是 k）；系统分 = 各题平均。

golden set 复测值（照抄 `notes/rag.md` §13 与 `src/evaluate.ts`，2026-10-12 锚点式 golden set 复跑口径）：

| 指标 | 值 |
| --- | --- |
| recall@3 | 0.31 |
| recall@5 | 0.44 |
| recall@10 | 0.50 |

PASS 3/8（判据：全部 gold chunk 进 top-10），语料 125 chunks。旧宣称值 recall@3=1.00 / @5=0.94 / @10=1.00（85 chunks）出自 2026-10-10 的「行号指针」golden set，指针漂移后静默打 0.00、且与 recall@k 单调性矛盾，**已废**；2026-10-12 起 gold 改为文本锚点（任一锚点匹配不到即 FAIL 退出）。完整口径说明见 `notes/rag.md` §13「数字口径」。

5 题 FAIL 的机制归因：Q2（IDF 对数）= 语料缺口（语料没有 IDF/对数的解释段）；Q7、Q8（compact / paraphrase）= compact 段检索短板；Q1（k1 饱和）= 排序短板；Q3（headingPath）= 两路极端分裂（bm25 #1 vs cosine #54-60）。共同根因：词法路只能走表面形式重叠——完全 paraphrase = 完全漏，这就是语义模型存在的理由。
拒答轨："苹果的 CEO 是谁？" → 模型输出"材料不足" ✓。

## 已知边界（教学刻意不做 / 留给后续课程）

- Embedder 是 hash 版（表面形式袋子），不是语义模型：同义词命不中（换真语义模型 = 再实现接口 ~10 行，pipeline 不动）。
- 暴力 O(N)，无 ANN——几十个 chunk 时可见、可插桩、无近似。
- Reranker 是直通插槽，未接真 rerank 模型。
- 分词是表面形式（拉丁整词 + CJK bigram），非 jieba 类正规分词器。
- 注：上表为 2026-10-12 锚点式复跑口径；如与更早文档看到的 1.00/0.94 不一致，以 `notes/rag.md` §13「数字口径」为准（旧值已废）。
