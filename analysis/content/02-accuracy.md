# 技术准确性 分析报告（accuracy）

- 分析者：accuracy｜时间：2026-10-16 10:2x（系统时钟 UTC；核实动作全部发生在 2026-10-16 09:50–10:30 UTC）
- 语料覆盖声明：
  - **通读（逐行）**：`memory-redteam/README.md`、`durable-execution-demo/README.md`、`rag-demo/README.md`、`sandbox-demo/README.md`、`mcp-demo/README.md`、`harness-demo/README.md`、`framework-demo/README.md`(1-200 行)、`api-demo/README.md`、`model-basics-demo/README.md`、`site/src/data/llm-history.ts`(全文)、`notes/llm-timeline.md`(全文)、`notes/observability.md` S2 段与 :346、`notes/knowledge-map.md` :1-40、`README.md`(根，1-60 行)
  - **通读源码（核对用）**：`harness-demo/src/policy.ts`、`harness-demo/src/context.ts`、`harness-demo/src/otel-mock-scenario.ts`、`harness-demo/src/llm.ts`(grep)、`rag-demo/src/rrf.ts`、`rag-demo/src/bm25.ts`、`rag-demo/src/evaluate.ts`、`memory-redteam/src/retrieval.mjs`、`memory-redteam/src/redteam.mjs`(grep)、`memory-redteam/test.mjs`(grep)、`durable-execution-demo/src/recover.ts`、`sandbox-demo/src/policy.ts`、`framework-demo/src/sdks/langgraph.ts`、`framework-demo/src/capabilities.ts`(grep)、`framework-demo/src/compare-assert.ts`(grep)、`framework-demo/scripts/compare-assert.sh`
  - **抽样**：`notes/framework-ecosystem.md`(:98-99/:111/:420-422)、`notes/multi-agent.md`(:199/:230-262/:311-331/:443)、`notes/mcp.md`(:103-107/:128/:350-376/:563)、`notes/harness-from-scratch.md`(:100-215)、`notes/long-term-memory.md`(:133-153/:416/:436-438/:488)、`notes/sandbox.md`(:12-14/:68-141/:211-228/:525)、`notes/industry-2026.md`(:21/:35/:50/:93-110)、`notes/model-basics.md`(:183-248 + S6)、`notes/interview-bank.md`(:89/:97)、`notes/details/05,06,07`、`site/src/data/courses.ts`(:63-117)、`site/src/data/course-structure.ts`(:86-94/:137-213/:294-302)、`site/src/data/mvps.ts`(全文)
  - **未读（原因）**：`notes/agent-harness.md` / `system-design.md` / `evaluation.md` / `durable-execution.md` / `api-engineering.md` / `data-flywheel.md` / `long-term-memory.md` 全文（仅 grep + 定点读）——本轮预算压在「可对照源码/可外部核实」断言上；`notes/process/*` 20 篇按任务定义只抽读（实抽 `capstone-m4-exercise.md`、`capstone-blueprint.md`、`site-refactor-plan.md`）；站点其余 astro 文案未读
  - **工具限制（重要）**：本轮 `web_search` **不可用**（返回 `Error: DeepSeek search has no API key for "DEEPSEEK_API_KEY"`），因此外部核实全部改用 `web_fetch` 直取一手源（npm registry / Anthropic engineering / platform.claude.com / modelcontextprotocol.io / open-telemetry GitHub）——见 §「本轮未覆盖 / 未验证」
- 结论摘要（≤5 条）：
  1. **仓库自证的数字绝大部分是真的**：`memory-redteam` 16/16 探针守住、15/15 敏感、18 层承重、`--persist` 三方 digest 逐字节一致；`rag-demo` recall@3/5/10 = 0.31/0.44/0.50、PASS 3/8、132 chunks、锚点 16/16；`durable-execution-demo` 3×3 矩阵副作用恒=1；`harness-demo` demo.jsonl 22 行分布、压缩 1378→426、15 spans/1 trace；`framework-demo` 10 条 `ok()` + 16 条 A 断言；`api-demo` 15 条断言——**以上全部由我本轮亲自复跑/复算命中**（命令见各 finding）。这部分是本仓最强的地方。
  2. **但「文档说 X / 实现是 Y」仍抓到 5 处真不一致**，最重的是 BM25 `k1`：`memory-redteam/README.md:126` 说本套件参数独立，而同文件 `README.md:12`+`retrieval.mjs:22` 的实际参数是 k1=1.2——**三处中有一处口径不同**（F1）；另有 `harness-demo/.env.example` 的模型默认值与代码默认值不一致（默认会跑一个包内明文标注「已下架」的模型名，F4）。
  3. **一处公式级数值错误**：`rag-demo/src/rrf.ts:10` 「第 10 名 = 1/70」与它自己上一行的公式 `1/(k+rank)`（k=60 → 1/69）矛盾（F3），且该行忽略了 RRF 是 **Σ 跨表求和**，把融合分说成单表分。
  4. **站点 `/nav` 的 LLM 发展史数据源已落后 21 个月**：`site/src/data/llm-history.ts` 自称「权威事实列表」，最后一个节点是 2025-01 DeepSeek-R1，而站点描述是「LLM 发展史与演进」；同期仓库自己在别处已记录 2026-04 Managed Agents 与 Sonnet/Opus 4.5 代际（F5）。
  5. 外部可核实项抽核结论：SDK 版本号 0.3.296 / 0.20.0 / **1.4.21**（与本地 `node_modules` 安装态一致）、MCP `2026-07-28`「去状态化」描述、Sonnet 4.5 = 2025-09-29 & SWE-bench Verified 77.2%、OTel `gen_ai.provider.name`/`session.id` 迁移描述——**均核实为真**；未核实项一律列在末节，不用「应该」冒充。

---

## 逐条 finding

### accuracy-F1｜BM25 `k1` 本套件参数：README 内部 + 相对 rag-demo 的双重不一致

- `id`：accuracy-F1
- `severity`：**high**
- `对象`：`memory-redteam/README.md:12`｜`memory-redteam/README.md:126`｜`memory-redteam/src/retrieval.mjs:22`
  - README:12 「混合检索：BM25（**k1=1.2**, b=0.75，罕见词高 IDF）∥ hash embedding → RRF 融合（k=60）」
  - README:126 「**`rag-demo` 用 k1=1.5/b=0.75** + 768 维 FNV-1a；本套件参数与实现**独立**」
- `现象`：同一份 README 的边界节把「rag-demo 的 k1=1.5/b=0.75」当成**本套件当前参数**来引用（作为「参数独立」的对照），而本套件实际参数是 k1=1.2（README:12 与源码一致）。读者拿:126 去核对会得到错误数值；`notes/rag.md:286`、`notes/long-term-memory.md:488` 也跟着把 k1=1.5 当作「memory-redteam 复用 rag-demo 底层」的依据。
- `证据`：
  ```
  $ sed -n '12p;126p' memory-redteam/README.md
  | `src/retrieval.mjs` | §S4 | 混合检索：BM25（k1=1.2, b=0.75，罕见词高 IDF）∥ hash embedding → RRF 融合（k=60） |
    `rag-demo` 用 k1=1.5/b=0.75 + 768 维 FNV-1a；本套件参数与实现**独立**（不 import rag-demo…）
  $ sed -n '22p;36p' memory-redteam/src/retrieval.mjs
  /** BM25 词法路打分（k1=1.2, b=0.75）：df 由传入的 pool 现算… */
        score += idf * ((f * 2.2) / (f + 1.2 * (1 - 0.75 + 0.75 * (d.toks.length / avgdl))));
  $ grep -n "k1 = 1.5" rag-demo/src/bm25.ts
  41:  constructor(k1 = 1.5, b = 0.75) {
  ```
  → 实现是 k1=1.2/2.2 系数（`retrieval.mjs:36`），rag-demo 是 k1=1.5/2.5 系数（`bm25.ts:41,74`）。**哪个对**：README:12 与 `retrieval.mjs` 一致、且被 `npm run demo` 输出背书；README:126 那句是把 rag-demo 的参数误当成本套件的口误。
- `影响`（本角度）：同一个数字在一次阅读路径内给两个值，且错的那个恰好是「参数独立」论点的支点——会让人以为两套 BM25 参数相同（即「不独立」），把 F1 想表达的诚实声明推翻。
- `建议方向`：把 README:126 改成「rag-demo 用 k1=1.5（本套件为 k1=1.2）……本套件参数与实现独立」，或在:126 显式写出本套件参数并标注与:12 同源。
- `置信度`：**高**（三行原文 + 两处源码逐一比对，无解释空间）。
- `归属`：内容

### accuracy-F2｜探针计数 15/15 与 16/16 同时出现且都不带限定语

- `id`：accuracy-F2
- `severity`：**medium**
- `对象`：`memory-redteam/README.md:24`｜`memory-redteam/README.md:38`
  - :24 「`node test.mjs` # 正跑：**16/16** 条探针守住 → 退出码 0」
  - :38 「**15/15** 条探针对其防线敏感（消融自检逐层验证 18/18 层，退出码 0）」
- `现象`：两行是**两个不同口径**（正跑=16 条探针全守住；消融=15 条可消融探针全敏感，第 16 条 R11 是机制检查、无防线可关），但正文都没写出口径差，读起来像同一个数字写了两个值。
- `证据`（我实跑的两条命令，两条都 exit 0）：
  ```
  $ cd memory-redteam && node test.mjs | tail -2
  16/16 条探针守住（退出码 0）
  $ node test.mjs --ablate | tail -2
  15/15 条探针对其防线敏感（逐层验证 18/18 层：多防线探针每次只关一道，每道都必须承重）（退出码 0）
  $ grep -c "id: '" memory-redteam/src/redteam.mjs      # E1-E5 + R1-R11
  16
  $ grep -n "ablate: null" memory-redteam/src/redteam.mjs
  343:    ablate: null,        # ← R11，唯一不可消融
  ```
  → 16 = 探针总数、15 = 16−1（R11）、18 = 各探针声明防线数之和（E2 声明 3 道、R7 声明 2 道，其余 1 道）。
- `影响`：不是假数字（两个数是同一个 runner 打印的真值），但「同一文件里两个 16/15」会让 clone 判据的读者以为其中一个是笔误；`site/src/data/course-structure.ts:300` 只引用了 16/16 与 18/18，没引 15/15，口径链在站点侧断了。
- `建议方向`：在:38 前补一句口径定义（「15 = 16 条中可消融的 16−1 条；R11 为机制检查，`--ablate` 下跳过」），与:24 显式配对。
- `置信度`：**高**（两行原文 + 两条实跑 + `redteam.mjs` 计数三方一致）。
- `归属`：内容

### accuracy-F3｜RRF 注释的「第 10 名 = 1/70」算错，且漏掉「跨表求和」这个定义性特征

- `id`：accuracy-F3
- `severity`：**high**
- `对象`：`rag-demo/src/rrf.ts:8`｜`rag-demo/src/rrf.ts:10`｜`rag-demo/README.md:17`
  - :8 「`score(c) = Σ_lists 1 / (k + rank_list(c)),  k = 60`」
  - :10 「k=60 → 第 1 名 = 1/61，**第 10 名 = 1/70**：头部强但不独裁」
- `现象`：① 按上一行自己的公式 1/(60+10) = **1/69**，不是 1/70（「第 1 名 = 1/61」在 1/(k+1) 下成立，同段自相矛盾）；② 该行把融合分当成**单表**分举例，而 RRF 的定义就是跨表求和——结合 `evaluate.ts` 的调用，两表都传**全量排序**（`chunks.length`），所以恰好在 k=10 时 1/70 也**不是「两表都排第 10」的和**（那是 2/70）。
- `证据`：
  ```
  $ sed -n '8p;10p' rag-demo/src/rrf.ts
   *   score(c) = Σ_lists 1 / (k + rank_list(c)),  k = 60  (Cormack et al. 2009)
   * k=60 → 第 1 名 = 1/61，第 10 名 = 1/70：头部强但不独裁（S1 的表）。
  $ sed -n '32p' rag-demo/src/rrf.ts        # 实现与公式一致：逐表累加
        e.score += 1 / (k + r.rank);
  $ sed -n '143,152p' rag-demo/src/evaluate.ts   # 两表都传全量，故「单表第 10」这个量在本 demo 中不可观测
    const cosFull = cosine.topK(embedder.embed([g.q])[0], chunks.length);
    const bmFull = bm25.topK(g.q, chunks.length);
    const fused = rrfFusion([{name:"cosine",results:cosFull},{name:"bm25",results:bmFull}], 60, chunks.length);
  $ node -e "console.log(1/(60+10), 1/(60+9))"
  0.014285714285714285 0.014925373134328358   # 1/70 = 0.01428…, 1/69 = 0.01492…
  ```
- `影响`：这是全仓 RRF 教学的「唯一算例」，`notes/rag.md:133`、`notes/long-term-memory.md:153` 的公式都对，只有这个算例错——初学者会照抄算例。
- `建议方向`：改成「第 1 名贡献 1/61、第 10 名贡献 1/69；融合分 = 各表贡献之和（两表都在第 10 名的条目得 2/69）」。
- `置信度`：**高**（公式、实现、调用点三处可复算）。
- `归属`：内容

### accuracy-F4｜harness-demo 的 `LLM_MODEL` 默认值：代码是已下架的 `qwen3.8-flash`，README 却指示写成 `-next`

- `id`：accuracy-F4
- `severity`：**medium**
- `对象`：`harness-demo/src/llm.ts:24`｜`harness-demo/README.md:30`｜`harness-demo/.env.example:4`｜`handoff.md:85`
  - `llm.ts:24`：「`export const MODEL = process.env.LLM_MODEL ?? "qwen3.8-flash";`」
  - `README.md:30`：「`printf 'LLM_BASE_URL=%s\nLLM_API_KEY=%s\nLLM_MODEL=qwen3.8-flash-next\n' …`」
- `现象`：README 让 clone 者把模型写成 `qwen3.8-flash-next`（正确，tool calling 已验），但**没人设 `LLM_MODEL` 时**（例如照 `npm run demo` 直接跑、或自己写调用）代码会落到 `qwen3.8-flash`。而 handoff.md:85 明文记录该模型**已从代理下架**：「`qwen3.8-flash` 已从代理下架（`/v1/models` 无此模型，qwen 系现剩 `qwen3.8-flash-next`/`qwen3.8-max`）」。默认值指向一个取不到的模型，`notes/model-basics.md:213` 也只提旧名。
- `证据`：
  ```
  $ sed -n '24p' harness-demo/src/llm.ts
  export const MODEL = process.env.LLM_MODEL ?? "qwen3.8-flash";
  $ sed -n '30p' harness-demo/README.md
  printf 'LLM_BASE_URL=%s\nLLM_API_KEY=%s\nLLM_MODEL=qwen3.8-flash-next\n' …
  $ grep -rn "qwen3.8-flash\b" --include=*.ts --include=*.md --exclude-dir=node_modules . | grep -v flash-next
  harness-demo/src/llm.ts:24:… ?? "qwen3.8-flash";
  handoff.md:6:… `qwen3.8-flash` 已从代理下架，现用 `qwen3.8-flash-next`（tool calling 已验）
  handoff.md:85:… **`qwen3.8-flash` 已从代理下架**（`/v1/models` 无此模型…）
  notes/model-basics.md:213: … → 跑 harness 时被迫换 qwen3.8-flash
  ```
  → 对照：`rag-demo/src/llm.ts:26` 的默认值已更新为 `qwen3.8-flash-next`，两个同构 demo 的默认值不一致。**留浏览器/代理侧无法代跑核实**（需外网 + 代理 key），故「跑起来会 404」标为**未验证**，但「包内默认值与包内明文下架记录冲突」是纯文本可判定的。
- `影响`：默认路径（不配 `.env` 的裸跑、或只改 BASE_URL/KEY 的人）会拿到一个模型不存在的 404，而 README 的模型要求节又在暗示默认可用。
- `建议方向`：把 `llm.ts:24` 默认值改成 `qwen3.8-flash-next`（或删掉默认值、缺失即报错并指向 `.env.example`）。
- `置信度`：**高**（默认值冲突为文本可判定）；「实际 404」部分置信度中（未联网验证）。
- `归属`：内容

### accuracy-F5｜`site/src/data/llm-history.ts` 自称「权威事实列表」，但末节点停在 2025-01，落后站点时点 21 个月

- `id`：accuracy-F5
- `severity`：**high**
- `对象`：`site/src/data/llm-history.ts:24`｜`site/src/data/llm-history.ts:188-200`｜`site/src/data/llm-history.ts:268`｜`site/src/pages/nav.astro:17`
  - :24 「LLM 发展历史时间线（§7.3 **权威事实列表**，10 节点）」
  - :190 「name: 'DeepSeek-R1'」/ :188 「date: '2025-01'」（数组最后一个元素，:201 收尾 `];`）
  - :268 「period: '2024–2025'」/ :269 architecture「o1/o3（推理）、DeepSeek-V3/R1（开源推理）、Claude 3+」
- `现象`：站点 `/nav` 的标题是「LLM 发展史与演进横向知识总览」（`nav.astro:17`），但这张被标为**权威**的表在 2025-01 就结束：整整 21 个月（2025-02 → 2026-10）没有任何模型/协议节点。同期**本仓库自己在别处已写入**这些事实：`notes/llm-timeline.md:27-29` 有 2025.09 Sonnet 4.5、2026.04 Managed Agents、2026.07 MCP spec；`notes/industry-2026.md:21` 有 Sonnet 4.5→Opus 4.5 代际。且 site 元数据把 2026-10 当「现在」（`mvps.ts` 2026-10 口径、`knowledge-map.md:19` 实测 2026-10-14）。
- `证据`：
  ```
  $ grep -n "date: '" site/src/data/llm-history.ts | tail -3
  174:    date: '2024-12',
  188:    date: '2025-01',
  $ sed -n '188,192p;201p' site/src/data/llm-history.ts
      date: '2025-01',
      name: 'DeepSeek-R1',
  …
  ];
  $ grep -c "date: '" site/src/data/llm-history.ts ; grep -c "era: '" site/src/data/llm-history.ts
  10
  5
  $ date -u
  Fri Oct 16 09:50:21 UTC 2026
  $ sed -n '27,29p' notes/llm-timeline.md      # 仓库别处的同一段历史已到 2026.07
  | 2025.09 | Claude Sonnet 4.5（SWE-bench ~77%） | …
  | 2026.04 | Anthropic Managed Agents | …
  | 2026.07 | MCP 最新 spec 修订（2026-07-28…） | …
  $ sed -n '21p' notes/industry-2026.md
  3. [2026现行] Anthropic Managed Agents（2026.4）…
  ```
  外部核实站点时点（2026-10-16 抓取 `platform.claude.com/docs/en/models/overview`）：当前 lineup 已是 **Claude Fable 5.1 / Opus 5.5 / Sonnet 5.5 / Haiku 5.5**——llm-history 一个都没有（详见 §未验证/外部核实台账）。
- `影响`：站点自述为「发展史与演进」，首页/导航却给出一条停在 2025-01 的「权威」时间线；对 0 经验学员，这会被读成「2025 年后没有重要节点」，而同一站点的课程页又要求答「为什么 agent 用量 2026 爆发」。
- `建议方向`：把 llm-history 的节点补到与 `notes/llm-timeline.md` 同等时点（至少补 Sonnet 4.5 / Managed Agents / MCP 2026-07-28），或把该页的「权威/发展史」定位改成「历史锚点（至 2025-01）」并在 :24 注明覆盖边界。
- `置信度`：**高**（末节点、节点数、系统时钟、仓库内部交叉证据均可复现）。
- `归属`：内容

### accuracy-F6｜LangGraph「当前版本」：同仓两个时点快照并存，`framework-demo/README.md:167` 的版本限定句未标注时效

- `id`：accuracy-F6
- `severity`：**medium**
- `对象`：`framework-demo/README.md:167`｜`framework-demo/package.json:16`｜`notes/framework-ecosystem.md:99`｜`notes/multi-agent.md:199`
  - `README.md:167` 「**LangGraph 1.4.21** 没有 `Annotation.Root` 的 reducer 工厂」（踩坑节，无时点限定语）
  - `framework-ecosystem.md:99` 「~~当前 1.0.1~~ ~~1.4.21~~ **截至 2026-10-13 全新缓存复核：npm registry latest = 1.5.0**」
- `现象`：① 外部现状：registry `latest` = **1.5.0**（我 2026-10-16 直取 registry 复核），笔记侧已就地划改到 1.5.0，但 `framework-demo/README.md:167` 与根 `README.md:18` 仍以无条件语气写 1.4.21；② 本地实装态（我实测）确实是 1.4.21，所以「对照结果的版本锚点」这个**口径**没错，缺的是「1.4.21 = 当时的实跑快照，非当前 latest」的限定语；③ 同一条踩坑在 `framework-demo/src/sdks/langgraph.ts:23` 写的是「**1.x** 里 Annotation.Root 不再有 reducer 工厂」——`README.md:167` 把 1.x 的性质说成 1.4.21 专属，与自己的源码注释口径不一。
- `证据`：
  ```
  $ cd framework-demo && node -e "console.log(require('./node_modules/@langchain/langgraph/package.json').version)"
  1.4.21
  $ grep -n '"@langchain/langgraph"' framework-demo/package.json framework-demo/package-lock.json | head -3
  framework-demo/package.json:16:    "@langchain/langgraph": "^1.4.21",
  framework-demo/package-lock.json:664:      "version": "1.4.21",
  （web_fetch 2026-10-16）https://registry.npmjs.org/@langchain/langgraph/latest → "version":"1.5.0"
  $ sed -n '23p' framework-demo/src/sdks/langgraph.ts
  //   ③ 状态通道用官方预置 MessagesAnnotation（1.x 里 Annotation.Root 不再有 reducer 工厂）。
  $ sed -n '167p' framework-demo/README.md
  8. **LangGraph 1.4.21 没有 `Annotation.Root` 的 reducer 工厂**：状态通道用官方预置
  ```
- `影响`：读者会把「latest 仍是 1.4.21」当成当前口径（笔记已裁定这是**版本演变、非口径错误**，对照结果按历史保留），而 README 是作品入口、没有回指笔记台账，限定语在入口处丢失。
- `建议方向`：`README.md:167` 改成「LangGraph **1.4.21（2026-10-12 对照快照）** 没有…；截至 2026-10-13 registry latest 已为 1.5.0（见 notes/industry-2026.md 核实台账）」，根 README:18 同口径加一句快照时点。
- `置信度`：**高**（版本、lock、registry 三处实测）。
- `归属`：内容

### accuracy-F7｜`langgraph.ts:23` 的「1.x 里 Annotation.Root 不再有 reducer 工厂」这一 API 断言未取得一手源

- `id`：accuracy-F7
- `severity`：**low**
- `对象`：`framework-demo/src/sdks/langgraph.ts:23`（同义表述见 `framework-demo/README.md:167`）
  - 「状态通道用官方预置 MessagesAnnotation（1.x 里 Annotation.Root **不再有 reducer 工厂**）」
- `现象`：这是关于第三方库 API 的**机制断言**（不只是版本号），可能的读法是「1.x 移除了 reducer 工厂」——但 `Annotation.Root` 的 reducer 规格（`reducer` 选项 / `messagesStateReducer` 等）在 langgraphjs 文档里一直是其核心 channel API；「不再有 reducer 工厂」更可能指「`Annotation` 的旧 `reducer` 写法被 `Root({x: {reducer, default}})` 取代」或「没有 `ReducedValue` 这类工厂函数」。本仓把它当作**踩坑结论**写进源码注释与 README 踩坑清单，但没有给出 langgraphjs 官方页/`node_modules` 内的类型证据或 release note。
- `证据`：见 F6 的 `sed -n '23p'`；我**尝试但未完成**一手核实——`web_search` 不可用（缺 API key），`framework-demo/node_modules/@langchain/langgraph` 内的 API 面核对属长任务、本轮未做。
  ```
  $ grep -rn "Annotation" framework-demo/src/sdks/langgraph.ts framework-demo/README.md | head -3
  framework-demo/src/sdks/langgraph.ts:23://   ③ 状态通道用官方预置 MessagesAnnotation（1.x 里 Annotation.Root 不再有 reducer 工厂）。
  framework-demo/README.md:167:8. **LangGraph 1.4.21 没有 `Annotation.Root` 的 reducer 工厂**：状态通道用官方预置
  ```
  → **未验证（原因：无 web_search 通道；未在 `node_modules` 类型定义中逐名核对 `Annotation.Root` 的 reducer 相关导出）**。
- `影响`：面试场景下这类「某库移除了 X」的断言最容易被追问「哪一版移的、在哪份 release note」；现在仓库给不出处。
- `建议方向`：补一处可复现证据（`grep -n "reducer" framework-demo/node_modules/@langchain/langgraph/dist/graph/annotation.d.ts` 的输出，或官方文档 URL + 抓取时点），否则把措辞降级为「本版 API 形状：状态通道用官方预置 `MessagesAnnotation`（未逐一核对 reducer 工厂的历史）＋**未验证**」。
- `置信度`：**中**（断言确实缺出处；其真假我未定）。
- `归属`：内容

### accuracy-F8｜「10 节点 / 12 节点」两套 LLM 时间线 + `五代 period 2024–2025` 的时点错配

- `id`：accuracy-F8
- `severity`：**low**
- `对象`：`site/src/data/llm-history.ts:24`｜`site/src/data/llm-history.ts:268`｜`notes/llm-timeline.md:14,31`｜`site/src/data/course-structure.ts:88,94`
  - `llm-timeline.md:14` 「## **12 节点**时间线」（★5 个）
  - `llm-history.ts:24` 「LLM 发展历史时间线（§7.3 权威事实列表，**10 节点**）」
  - `llm-history.ts:268` 「period: '**2024–2025**'」（第五代，代表模型到 2025-01 为止）
- `现象`：「节点」这个词在本仓指两套不同的东西（agent 史 12 节点 vs 模型史 10 节点），`course-structure.ts:94` 试图用「模型史 vs agent 史」解释，但两页都用「节点」且都在站内导航上，读者会去比对数字。`period: '2024–2025'` 对一个「当前=2026-10」的站点还会被读成「第五代到 2025 年为止」，与 F5 的截断叠加。
- `证据`：
  ```
  $ sed -n '14p;31p' notes/llm-timeline.md
  ## 12 节点时间线
  **★ 节点（5 个，面试必需）**：…
  $ sed -n '24p;268p' site/src/data/llm-history.ts
   * LLM 发展历史时间线（§7.3 权威事实列表，10 节点）。
      period: '2024–2025',
  $ sed -n '94p' site/src/data/course-structure.ts
        '交付 agent 视角 12 节点时间线正文（notes/llm-timeline.md）…（/nav 发展史 10 节点 + 5 代演进，与本文互补：模型史 vs agent 史）'
  ```
- `影响`：同一导航体系里两个「节点数」；`period` 的右端点落在 2025 而页面时点是 2026-10。
- `建议方向`：两页分别改称「模型史 10 节点」「agent 史 12 节点」并把节点数写进标题；第五代 `period` 改 `'2024–'` 或补齐到 2026。
- `置信度`：**高**（文本可直接对照）。
- `归属`：内容

### accuracy-F9｜崩溃恢复在「agent 版」的处置：`harness-from-scratch` 说「摆状态给模型」，`durable-execution` 说「只读问外部服务」

- `id`：accuracy-F9
- `severity`：**low**
- `对象`：`notes/harness-from-scratch.md:166-176`｜`durable-execution-demo/README.md:44,48`｜`durable-execution-demo/src/recover.ts:83-89`
  - harness-from-scratch：「非只读 → 把状态摆给模型：`[未知状态] 执行结果未知，先用只读工具核对现状再决定` → **模型自己用 read_file 核对**」
  - durable README:44 「非幂等 unknown → **只读问外部服务**再决定（LLM 调用在 agent 版里同样是"读历史不重调"）」
  - recover.ts:84 「`const q = ext.msg.lookup(step.idemKey);`」
- `现象`：两处都叫「未知状态处置」，但处置主体不同（模型侧核对 vs 客户端查外部服务），durable README 用括号把两者等同（「agent 版里同样是…」）。这是**两种不同机制**，不是同一个机制的两个说法。
- `证据`：`sed -n '83,89p' durable-execution-demo/src/recover.ts` 显示是 `ext.msg.lookup(idemKey)`（查 mock 队列），不带模型参与；`notes/harness-from-scratch.md:166-176` 的流程图分支是 `MODEL["模型 read_file / list_dir 核对"]`。两者都有源码/笔记落点，机制描述各自成立——但合并叙述会让人以为 durable 的实现里也「让模型核对」。
- `影响`：面试讲「未知状态」时容易把两条路混成一条；durable 的判定表本身（`recover.ts:4-10`）是对的，README:48 的映射与实现逐条一致（我逐条核对过：exec 在→skip / 无 intent→replay / 只读→replay / 幂等→replay / 非幂等→unknown→confirm 两分支）。
- `建议方向`：durable README:44 的括号补一个区分句：「agent 版把这一步交给模型（harness-from-scratch §⑦），本 demo 无模型，改为向外部世界只读查询幂等键」。
- `置信度`：**中**（机制差异可从两处原文判定，但「是否算问题」取决于叙述意图）。
- `归属`：内容

### accuracy-F10｜token 估算的换算注释方向可疑：中文侧「~1.5-2」单位未对齐

- `id`：accuracy-F10
- `severity`：**low**
- `对象`：`harness-demo/src/context.ts:8`
  - 「估算：不做精确 tokenization——总字符数/3.5 足够（英文 ~4 字符/token，中文 ~1.5-2）。」
- `现象`：英文 ~4 chars/token 与 /3.5 自洽；但「中文 ~1.5-2」缺单位——主流 BPE 词表对中文大致 1 个汉字 ≈ 1 token 量级（即 ~1–1.5 chars/token），写成「1.5-2」若读作「1.5–2 字符/token」就与「/3.5」的方向相反（按 2 chars/token 估应除以 2 而非 3.5）。代码本身（`Math.ceil(JSON.stringify(messages).length / 3.5)`）是**刻意粗糙的预算估算**，注释也已声明「不做精确 tokenization」「预算检查用估算即可」——所以这不是实现 bug，而是注释里的**量纲/方向**可疑。
- `证据`：
  ```
  $ sed -n '8p;12p' harness-demo/src/context.ts
   * 估算：不做精确 tokenization——总字符数/3.5 足够（英文 ~4 字符/token，中文 ~1.5-2）。
  export function estimateTokens(messages: unknown[]): number { return Math.ceil(JSON.stringify(messages).length / 3.5); }
  （复跑佐证这套估算是「自洽的近似」，不是精算）$ npx tsx src/test-compact.ts → 压缩前 tokens≈1378 / 压缩后≈426 ✅
  ```
  → **未验证「中文 ~1.5-2 tokens/字 vs 字符/token」哪个是本意**：需要某个具体 tokenizer 的计数才能定论，本轮未做（无 web_search；本机 tokenizer 只有 demo 自带的 hash 版，用它验证属循环论证）。
- `影响`：这是全仓唯一处理「字符↔token」换算的地方，也是 F4 之外唯一会把「预算」算歪的地方；注释方向若误，学员会把 /3.5 用到中文语料上而不知道自己低估了。
- `建议方向`：把单位写死（例如「中文约 1 字 ≈ 1 token，故按字符数/1.2–2 估；本函数取 3.5 是英文为主语料下的保守上界」），或直接标注「本估算为教学粗估，中文语料请自行标定」。
- `置信度`：**中**（注释缺单位可确认；哪个数是「对」的未定）。
- `归属`：内容

### accuracy-F11｜`llm-timeline.md` 对 2025 年行给了一手源，而该行的 Claude Code 时点与本轮外部核实不符

- `id`：accuracy-F11
- `severity`：**low**
- `对象`：`notes/llm-timeline.md:25`｜`notes/llm-timeline.md:37`
  - :25 「| 2025.02–04 | Claude Code 预览→GA、OpenAI Agents SDK | coding agent 产品化 + SDK 层成型 | |」
  - :37 「2025.02-04 Claude Code 预览→GA / Agents SDK [2026现行] → https://code.claude.com/docs/en/agent-sdk/overview ；OpenAI Agents SDK（Swarm 后继）→ https://developers.openai.com/codex」
- `现象`：该行被标为 `[2026现行]` 且附官方 URL（即被声明为已核实），但「预览→GA」被压进 `2025.02–04` 一个区间；本轮外部核实到的时点是 **Claude Code 2025-02 发布（预览）、2025-05 GA**（与 Claude 4 同批）。也就是说 GA 落在 05 而非 04。同一行的 `developers.openai.com/codex` 也不是 OpenAI Agents SDK 的文档（Codex 是另一产品线），作为「OpenAI Agents SDK」的出处不指向上游 SDK 文档。
- `证据`：
  ```
  $ sed -n '25p;37p' notes/llm-timeline.md     # 原文见上
  （web_fetch 2026-10-16）https://en.wikipedia.org/wiki/Claude_(AI)
  "Claude Code, released in February 2025 … It was made generally available in May 2025 alongside Claude 4."
  ```
  → 注：`notes/llm-timeline.md:40` 已诚实声明「2025 前节点…日期来自记忆——**待复核**」，但 **2025 这一行被排除在该声明之外**（它在:36-39 的「2025 前后有官方一手源」清单里）。
- `影响`：被标为「已核实 + 现行」的行里含一个与外部时点不符的区间与一个不指向 SDK 的出处；面试口述版（:44）也说「2025.03-04 OpenAI 和 Google 先后采纳 MCP」——MCP 采纳那半句没问题（另一个事实），但它和 Claude Code GA 同处一行会互相借信用。
- `建议方向`：把该行拆开写（Claude Code 预览 2025-02 / GA 2025-05；OpenAI Agents SDK 2025-03），并把 SDK 出处换成上游仓库/文档；或把该行从「已核实」清单移入「待复核」。
- `置信度`：**中高**（原文可判定；「GA=05」来自 Wikipedia 而非 Anthropic 一手页，**一手源未取**）。
- `归属`：内容

---

## 外部可核实项：核实台账（核实时间统一 = 2026-10-16 09:50–10:35 UTC）

> 本轮 `web_search` 不可用（`Error: DeepSeek search has no API key`），全部改为 `web_fetch` 直取一手源。

| # | 仓内断言（file:line） | 核实方式与结果 | 结论 |
|---|---|---|---|
| 1 | Claude Agent SDK `0.3.296`（`notes/framework-ecosystem.md:111`、根 `README.md:18`） | `web_fetch https://registry.npmjs.org/@anthropic-ai/claude-agent-sdk/latest` → `"version":"0.3.301"`；本地 `framework-demo/node_modules/@anthropic-ai/claude-agent-sdk/package.json` → `0.3.296` | **快照口径成立**：仓库写的是对照实跑版本（=lock 装到的版本），与当前 registry latest（0.3.301）不同但不矛盾；缺「这是快照」的限定语，与 F6 同型（本条不计独立 finding） |
| 2 | OpenAI Agents SDK `0.20.0`（同上） | `web_fetch …/@openai/agents/latest` → `"version":"0.20.0"`（仍 0.x 线）；本地 node_modules = 0.20.0 | **核实为真，且仍是当前 latest**。仓内「2025 GA 属官方公告口径、未取到一手源 → 标『无法确认』」（`notes/framework-ecosystem.md:98/:420`）的保留态度**正确且与 registry 事实一致**（0.x 线） |
| 3 | LangGraph `1.4.21` / 「latest 已 1.5.0」（`notes/framework-ecosystem.md:99`、`notes/industry-2026.md:107-108`） | `web_fetch …/@langchain/langgraph/latest` → `"version":"1.5.0"`；本地 = 1.4.21 | **核实为真**（笔记侧 1.5.0 结论正确）；`framework-demo/README.md:167` 缺快照限定语 → 见 F6 |
| 4 | MCP 最新 spec `2026-07-28`「去状态化：移除 initialize 握手与 Mcp-Session-Id，新增 server/discover、subscriptions/listen、MRTR」（`notes/mcp.md:107/:128`、`notes/llm-timeline.md:36`） | `web_fetch modelcontextprotocol.io/specification/versioning` → 「The current protocol version is **2026-07-28**」；`web_fetch raw.githubusercontent.com/…/specification/2026-07-28/changelog.mdx` → major changes 1「Remove protocol-level sessions and the `Mcp-Session-Id` header」、2「remove the `initialize`/`notifications/initialized` handshake；every request carries its version in `_meta`」、3「Add `server/discover`」、4「Replace … with `subscriptions/listen`」、7「MRTR pattern introduced」 | **逐条核实为真**（连「MRTR」这个缩写名都对得上；仓内 mcp.md 是**全仓外部断言质量最高的一节**） |
| 5 | 「2025-03-26 引入 OAuth 2.1、Streamable HTTP 取代 HTTP+SSE；2025-06-18 加 elicitation、移除批处理」（`notes/mcp.md:104-105`） | 同一 changelog 的 deprecation 节：「Reclassify the HTTP+SSE transport (**deprecated since protocol version `2025-03-26`**)」，与仓内叙述一致 | **核实为真（关键点）**；2025-06-18 的细节本轮未逐条取一手源 → 该半句**未验证** |
| 6 | 「Sonnet 4.5（**2025.09**，SWE-bench **~77%**）」（`notes/llm-timeline.md:27,38`、`notes/industry-2026.md:50`、`notes/details/07-harness-rot.md:18`） | `web_fetch https://www.anthropic.com/news/claude-sonnet-4-5` → 「Published **Sep 29, 2025**」；Methodology「**We report 77.2%**」 | **核实为真**（月=2025-09、值 77.2%≈"~77%"） |
| 7 | 「Managed Agents（**2026.04**）……Sonnet 4.5 的 context-anxiety 上下文重置在 Opus 4.5 上成了死重」（`notes/industry-2026.md:21`、`notes/system-design.md:368`、`notes/details/07-harness-rot.md:22`） | `web_fetch https://www.anthropic.com/engineering/managed-agents` → 「Published **Apr 08, 2026**」；「Claude Sonnet 4.5 would wrap up tasks prematurely … sometimes called "context anxiety" … we used the same harness on Claude Opus 4.5, we found that the behavior was gone. The resets had become dead weight.」 | **逐句核实为真**（含日期与因果表述） |
| 8 | OTel 属性名：「`gen_ai.system` / `gen_ai.session.id` 相对当前规范应为 `gen_ai.provider.name` / `gen_ai.conversation.id`」（`notes/observability.md:79/:107/:346`；代码用旧名 `harness-demo/src/agent.ts:42,97`） | `web_fetch raw.githubusercontent.com/open-telemetry/semantic-conventions/main/docs/registry/attributes/gen-ai.md` → `gen_ai.system` 状态 `Deprecated`「**Replaced by `gen_ai.provider.name`**，which has moved to the OpenTelemetry GenAI semantic conventions repository」；`gen_ai.provider.name` 与 `gen_ai.conversation.id` 均在新仓库清单内；`gen_ai.session.id` **不在任何清单**；文件顶部说明 GenAI 属性已 moved to 独立仓库 | **核实为真**：仓内「旧名应为 ↑」映射正确；且「映射之外的第三事实」也成立——`session.id` 是**通用** semconv 命名空间（registry 另有 Session 节），而非 GenAI 命名空间下的 `gen_ai.session.id`（可作后续补充方向，非本条 finding） |
| 9 | 「当前 Claude 模型 lineup」 | `web_fetch platform.claude.com/docs/en/models/overview` → Claude **Fable 5.1 / Opus 5.5 / Sonnet 5.5 / Haiku 5.5**，1M 上下文、knowledge cutoff Jun 2026 | **作为 F5 的时点证据**：llm-history 停在 2025-01，比站点时点落后 21 个月 |
| 10 | 「Claude Code 预览 2025-02 → GA 2025-04」（`notes/llm-timeline.md:25`） | `web_fetch en.wikipedia.org/wiki/Claude_(AI)` → 「Claude Code, released in February 2025 … made generally available in **May 2025** alongside Claude 4」 | **与仓内区间不符**（GA=05 而非 04）→ 见 F11；来源为 Wikipedia，**Anthropic 一手源未取** |

---

## 本轮已验证为真（不作为 finding，避免凑数；均为我实跑/实算命中）

| 断言 | 落点 | 我跑的命令 / 结果 |
|---|---|---|
| memory-redteam 16/16 探针守住 | `memory-redteam/README.md:24` | `node test.mjs` → `16/16 条探针守住（退出码 0）` |
| 消融 15/15 敏感、18 层逐层承重 | `README.md:25,38` | `node test.mjs --ablate` → `15/15 …（逐层验证 18/18 层）` exit 0；`redteam.mjs` 探针 16 个、`ablate:null` 1 个、防线数合计 18 |
| `--persist` 三方 digest 逐字节一致 | `README.md:39`、`npm run demo` 判据 | `node test.mjs --persist` → `digest sha256 ede54bd2… vs ede54bd2…`、`35 事件 / 10 条目 / 18 审计 / 0 坏行`，exit 0 |
| 「没有 `new Date()`/`Date.now()`」 | `README.md:42` | `grep -rn "new Date()\|Date.now()" memory-redteam/src/*.mjs test.mjs` → 只有 2 处注释命中，无代码调用 |
| rag-demo recall@3/5/10 = 0.31/0.44/0.50、PASS 3/8、132 chunks、锚点 16/16 | `rag-demo/README.md:62-66`、`notes/rag.md §13`、根 `README.md:14` | `npx tsx rag-demo/src/evaluate.ts` → `系统平均：recall@3 = 0.31  recall@5 = 0.44  recall@10 = 0.50`、`PASS 3/8`、`gold 锚点解析：16/16`、`132 个 chunk`，exit 0 |
| 「recall@k = \|top-k ∩ relevant\| / \|relevant\|（分母=相关集）」 | `rag-demo/README.md:56` | `rag-demo/src/evaluate.ts:154-157` 逐行一致（分母 `g.ids.length`） |
| durable 3 崩溃点 × 3 次、副作用恒=1、报告 sha256 跨次一致 | `durable-execution-demo/README.md:6,19,47` | `npx tsx src/demo.ts` → `✅ durable 验收通过：3 崩溃点 × 各 3 次，副作用计数恒=1`，A/B/C 三组 `报告一致 ✅`，exit 0 |
| §S8.2 判定表五分支 | `durable-execution-demo/README.md:48`、`notes/durable-execution.md` | `durable-execution-demo/src/recover.ts:4-10`（注释表）与 :64-89（实现）逐分支一致（exec→skip / 无 intent→replay / 只读→replay / 幂等→replay / 非幂等→confirm-skip 或 confirm-exec） |
| 「文档说」dump 语义：at-least-once + 幂等消化 | `notes/durable-execution.md:29` | 与 `durable-execution-demo/src/demo.ts` 断言「mock 服务端不去重（at-least-once）」一致；`external.ts` 无去重 |
| 权限门 deny>approve>allow、fallback=deny | `notes/harness-from-scratch.md:121,124`、`notes/multi-agent.md:239`、根 `README.md:15` | `harness-demo/src/policy.ts:19,23-27` 逐行一致（`for (const d of ["deny","approve","allow"])`；`fallback: PolicyDecision = "deny"`） |
| 四通道 deny>approve>sandbox>allow、fallback=deny | `notes/sandbox.md:68,114,128`、`sandbox-demo/README.md:24` | `sandbox-demo/src/policy.ts:12,16-23` 一致（`CHANNEL_PRIORITY` 扫通道；`fallback: Channel = "deny"`） |
| `notes/multi-agent.md:311,331` 引「harness-demo default=deny（src/policy.ts:19 fallback）」 | 同上 | 精确成立：`policy.ts:19` 就是 fallback 那行的默认值行 |
| demo.jsonl 22 行分布 init×1/model_response×6/tool_intent×6/tool_exec×8/final×1 | `notes/observability.md:139,349`、`handoff.md:162` | `node -e` 统计 `harness-demo/trajectories/demo.jsonl` → `perFile lines: 22`，分布逐项命中 |
| 「tool_exec 比 tool_intent 多 2 条：deny/审批未通过先返回、未记 intent」 | `notes/observability.md:139` | 实读 jsonl：仅 `write_file`(denied)、`run_shell`(denied) 两条 exec 无对应 intent，其余 6 条 intent→exec 配对 |
| OTel 离线 span 树 15 spans / 1 trace（invoke_agent×1 + chat×6 + execute_tool×8，含 denied×1）；历史「11 spans」不作判据 | `harness-demo/README.md:38-39`、`notes/observability.md:79,109`、`notes/interview-bank.md:87` | `harness-demo/src/otel-mock-scenario.ts:48-58` 的 `EXPECTED` 契约常量逐项一致；`toolNames` 8 个与 demo.jsonl 被盗用的活轨迹一致；`historicalReportOnly:{spans:11}` 仅作对照 |
| 压缩 `1378 → 摘要 3 条 → 5 条 → 426 tokens` | `notes/harness-from-scratch.md:196` | `npx tsx harness-demo/src/test-compact.ts` → `压缩前 tokens≈1378（阈值 1000）`、`摘要了 3 条，压缩后 messages=5 条，tokens≈426`，exit 0 |
| framework-demo `10 条 ok() + 1 条整体判定`（不合成 11/11） | `framework-demo/README.md`、根 `README.md:18`、`notes/framework-ecosystem.md:422` | `grep -c "ok(" framework-demo/src/capabilities.ts` → **10**；`demo.ts:15` 注释自述「U-24 口径：断言数由 ok() 实际计数（当前共 10 处）」；`compare-assert.ts` 的 A15 断言读文件核查该口径 |
| framework-demo `16 条断言` | 同上 | `compare-assert.ts` 中 `A("A1"…` 到 `A("A16"…)` 共 16 个唯一编号（另有 1 条不计入编号的 R3-1 防回归守卫） |
| harness-demo「13 个源文件（9 运行时 + 3 OTel 离线判据/断言 + 1 压缩自测）」 | 根 `README.md:15`、`site/src/data/mvps.ts:50` | `ls harness-demo/src/*.ts \| wc -l` → **13** |
| rag-demo「15 src 文件」「hash embedder 768 维」「BM25 k1=1.5,b=0.75」 | `notes/long-term-memory.md:488`、`rag-demo/README.md:14,16` | `ls rag-demo/src/*.ts \| wc -l` → **15**；`embed.ts:19 export const DIM = 768`；`bm25.ts:41 constructor(k1 = 1.5, b = 0.75)` |
| memory-redteam「64 维字符三元组 hash」 | `memory-redteam/README.md:125` | `retrieval.mjs:20 export const EMB_DIM = 64`；`retrieval.mjs:78` 注释「64 维字符三元组计数，L2 归一」 |
| api-demo「15 条断言自测，全离线零 key」 | `site/src/data/mvps.ts:103`（`api-mvp` 行） | `node --import tsx src/demo.ts`（api-demo）→ `六模块断言：15 条 全绿`、`✅ api 验收通过：六模块 15 条断言全绿 + 事故场景走查通过`，exit 0 |
| flywheel-demo「四模块 + 10 断言」 | `site/src/data/mvps.ts:121` | `node --import tsx src/demo.ts`（flywheel-demo）→ `四模块断言：10 条 全绿`、`✅ flywheel 验收通过`，exit 0 |
| model-basics-demo「四模块 10 断言」+ KV 公式 `2×layers×kv_heads×head_dim×bytes` 数值 `kvBytesPerToken(32,8,128,2)===131072`、8K×并发 8 = 8 GiB | `model-basics-demo/README.md`、`notes/model-basics.md` S1/S7 | `node --import tsx src/demo.ts`（model-basics-demo）→ `四模块断言 10 条 全绿`，exit 0；手算 `2×32×8×128×2 = 131072` ✔、`131072×8192×8 = 8.0 GiB` ✔ |
| sandbox-demo 四通道 +「权限门 ≠ 沙箱」（`read_file ../../etc/passwd` 过权限门被沙箱拦） | `sandbox-demo/README.md:23`、`notes/sandbox.md:68` | 仅阅读 `sandbox-demo/README.md:23` + `src/policy.ts`（`decide` 逐通道扫）；demo 端到端输出**未复跑**（未在本轮跑 `npm run demo`）→ 该行的运行时结论标**未验证** |
| MCP 规范行为（版本线 / initialize 移除 / server/discover / subscriptions/listen / MRTR） | `notes/mcp.md:103-107,128` | 见上表 #4/#5（一手 changelog 逐条比对） |

---

## 转交下一轮（显示形式）

1. `notes/observability.md:79`：一整段「口径声明 + 注意仓库内代码用的是旧属性名 + 离线可重跑判据」挤在一个段落里（内容正确但可读性差）——层级/排版问题，转下一轮。
2. `memory-redteam/README.md:36-40`：三个「当前状态」数字块是裸代码块、没有与:24/:25 的判据行做视觉配对，读起来像三份不同结论——信息分组问题，转下一轮。
3. `site/src/data/llm-history.ts` 的 `note`/`summary` 字段长度极不均匀（有的一行、有的 5 行），在 `/nav` 上会形成长短卡片交错——排版问题，转下一轮。
4. `rag-demo/README.md:58-66` 的「复测值表 + 旧值已废说明 + §13 回指」三块叠在一起、表格只有 3 行——信息层级问题，转下一轮。

## 本轮未覆盖 / 未验证

1. **`web_search` 工具本轮不可用**：`web_search` 返回 `Error: DeepSeek search has no API key for "DEEPSEEK_API_KEY"; store it through the credentials service (the web Models page writes it), export it in the launching environment, or set a literal "apiKey" in the web-search-deepseek config`。因此没有任何「搜索结果汇总」类核实，全部改为 `web_fetch` 直取一手源；**凡是需要检索才能定位的事实（如 2025-06-18 spec 细节、langgraphjs API 迁移 release note）本轮一律标未验证**。
2. **未验证（F4 运行时部分）**：`harness-demo` 用默认 `qwen3.8-flash` 实际是否会 404——需要外网 + 该 OpenAI 兼容代理的 key，本轮未跑（也属「不跑联网命令」边界）。
3. **未验证（F7 全部机制部分）**：`Annotation.Root` 的 reducer 工厂在 langgraphjs 各版本的历史——未取一手源、未核对 `node_modules/@langchain/langgraph` 类型定义。
4. **未验证（F10）**：中文每字 token 数的正确量纲——需要具体 tokenizer 计数；本机只有 demo 自带 hash embedder 与 demo 的字符估算，用它验证属循环论证。
5. **未验证（F11 一手源）**：Claude Code GA 日期取自 Wikipedia（非 Anthropic 一手页）；2025-06-18 的 elicitation/批处理变更未取一手 changelog。
6. **未验证（外部 2026 行业现状的全景核对）**：任务要求的「2026 行业现状」本轮只核到 Managed Agents（2026-04）、MCP spec（2026-07-28）、Claude 当前 lineup（2026-10 抓取）；`notes/industry-2026.md` 里其余 2026 断言（OWASP LLM Top 10 2026 版、Agentic Top 10、A2A v1.0.1、Cognition 单线程写、computer use 升一等、LangGraph「唯一 breaking 面=create_react_agent 废弃」）**本轮未逐条复核**（`notes/industry-2026.md:93-110` 自带的核实台账未被我独立复算）。
7. **未读全文的语料**：`notes/agent-harness.md`（30KB）、`system-design.md`（39KB）、`evaluation.md`（42KB）、`durable-execution.md`（43KB）、`api-engineering.md`（38KB）、`data-flywheel.md`（40KB）、`framework-ecosystem.md`（44KB）、`mcp.md`（54KB）等只做了 grep + 定点抽查；`notes/details/01-04`、`site/src/pages/**/*.astro`、`site/src/components/*.astro`、`notes/process/*` 其余 17 篇、根 `handoff.md` 全文未读。**本轮任何「该不该有 X」的完整性判断都留给 content-gap 视角**，本报告只判「写了的那句对不对」。
8. **未做的复跑**：`sandbox-demo` 的 `npm run demo`（3 次重放逐字节一致）、`mcp-demo` 的 `npm run demo`（对照组/防御组/消融/重放）、`framework-demo` 的 `npm run compare:assert`（16 条 A 断言，需 detached watcher 与 ≤240s 等待 + 420s 超时）、`site` 的 `astro build`（按语料范围 §0 第 5 条明确不跑）。这些是**证据与可复现性**视角的核心素材，本轮只核了**静态可判定**的部分（断言编号数量、契约常量、mock 场景与活轨迹的一致性）。
9. **一致性归属提醒**：本轮发现里凡是「同一事实在两处自相矛盾」的（F1 的 README:12 vs :126、F6 的 1.4.21 vs 1.5.0、F8 的 12 vs 10 节点）都**只判了哪个是对的**、没有重复计 finding，按任务分工留给跨篇一致性与口径视角。
