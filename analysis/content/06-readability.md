# 初学者可读性 分析报告（readability）

- 分析者：readability｜时间：2026-10-16 17:51
- 语料覆盖声明：
  - **通读（逐行）**：`site/src/pages/index.astro`（413 行）、`site/src/pages/learn.astro`（496）、`site/src/pages/nav.astro`（330）、`site/src/pages/404.astro`（49）、`site/src/components/Header.astro`（186）、`site/src/components/Footer.astro`（13）、`site/src/components/DomainMap.astro`（121）、`site/src/components/NotePageLayout.astro`（150）、`site/src/data/course-structure.ts`（426，取其**用户可见文案**字段 intro/prerequisiteNote/practicalOutput）、`notes/model-basics.md`（391）、`notes/agent-harness.md`（514）、`notes/harness-from-scratch.md`（239）、`notes/rag.md`（339）、`notes/details/*.md` 8 篇（各 31 行）。
  - **抽样**：其余 13 篇课程（api-engineering / data-flywheel / durable-execution / evaluation / mcp / multi-agent / long-term-memory / system-design / sandbox / framework-ecosystem / industry-2026 / llm-timeline / knowledge-map）每篇**开头 1-22 行**（含文件头 5 行块 + `预备知识` 节 + S1 首段）；`notes/interview-bank.md` 第 1-60 行（题面表述 + §3 追问链）；`notes/observability.md` 第 1-40 行（作为「写得好的预备知识」对照组）。
  - **未读（原因）**：13 篇课程的正文中后段（本次任务指定「每篇开头 1-2 节」为抽读范围）；`notes/process/*` 20 篇、根文档、`site/src/pages/{works,interview,map}.astro`、`site/src/data/{courses,mvps,capstone,final-project,llm-history}.ts`（不属本任务主读/抽读范围）。
  - **读者设定**（判据基准，非「我自己看不看得懂」）：**有后端经验（会写服务、读过 SQL、用过 HTTP/JSON、跑过命令行）、无 agent 经验**（没用过 harness/loop/工具协议/MCP/向量检索）。凡判「当场未解释」= 该术语在该 file:line 之前**全文无任何定义或名称展开**，且该处未给出等价中文释义。
- 结论摘要（≤5 条）：
  1. **入口层（首页 + 学习路线 + 404）在用户第一次阅读的最高权重位置（首屏、作品卡、课程前置说明）就使用 SSE / BM25 / RRF / checkpoint / JSONL 等未展开缩写**，而面向初学者的站点没有任何术语表或替换文案——这是本角度最严重的一类问题（F1/F2）。
  2. **术语「先定义后用」在章内基本成立、跨章不成立**：model-basics 的 TTFT/TPOT、durable-execution 的幂等/checkpoint、rag 的 BM25/RRF 都在章内有定义，但这些章在**线性阅读序里排在更早的无定义使用之后**（如 `idempotency key` 首现于 durable-execution.md:47，而 `SSE` 首现于排更前的 agent-harness.md:430 且无定义）；且首现定义位置常要翻过一屏（F3/F4/F5）。
  3. **`notes/agent-harness.md` 是初学者线性路径上的第二课，却是最不友好的一篇**：第 1-2 节只剩「回顾」且零前置门槛声明（compare `harness-from-scratch.md` 无 `预备知识` 节），第 5.2 节一屏之内抛出 compaction / context rot / structured note-taking / few-shot / JSONL / prompt injection 六个专名（F6/F4）。
  4. **显示为「入口」的页面，其文案对初学者不自足**：`/details/*` 8 篇是首页「详解」入口直达页，只有「一句话定义 + 为什么影响走向 + 面试一句话」，无「读完能做什么」、无前置、无术语约定；`learn.astro` 的课程卡前置说明（`course-structure.ts` 的 `prerequisiteNote`）含代码标识符与反序「上完它」（F7/F8/F15）。
  5. **叙述人称与中文排版不统一**：主线第一课 `harness-from-scratch.md` 用「你」（:17/:196/:218），而多篇用「我的…」（model-basics.md:6 等，见 F12）；全 12 篇主读文件用半角 ASCII 引号（250/180/159/222 对），与站点中文文案的全角「」不一致（F13）；还有 `§5已建立`（缺空格，model-basics.md:117）、`从零写 harness侦察`（少空格，model-basics.md:367）等零散排版失（F13/F16）。

---

## 逐条 finding

### F1 · blocker · 首页首屏的入门承诺句密度过高、无一处展开

- **对象**：`site/src/pages/index.astro:48` 与 `site/src/pages/index.astro:51-55`
  - :48 `coding agent 工程师 · 五阶段课程体系 · 每课带可运行参考样本`
  - :51-55 `{COURSE_COUNT} 课 · 五个阶段 · {DOMAIN_COUNT} 个知识域`，每门课都带**可运行的参考样本**（clone 下来就能跑，全离线零 key）
- **现象**：读者在**首屏第一段可见文字**上就连遇 `coding agent` / `阶段` / `知识域` / `参考样本` / `clone` / `零 key` 六个未定义概念；页面未给任何一句「什么是 agent / 什么是 harness」的定义或外链。初学者在该位置无法判断「这门课是否为我准备」。
- **证据**：仅阅读 `site/src/pages/index.astro:45-61`（整段 hero）。复现：`sed -n '45,61p' site/src/pages/index.astro`。
- **影响**：首屏是唯一无法被导航绕开的文案；面向「无 agent 经验」的读者设定，此处即他们与整套课程首次接触，信息密度超过「可理解」阈值。
- **建议方向**：hero 抬头改为**先一句人话定位**（如「从零手写一个能跑的最小 agent：不依赖任何框架，一个文件一个文件长出来」），把 `coding agent 工程师 / 知识域` 这类行话下沉到第二屏或 `/learn/` 口径块；`参考样本` 首次出现处补一句「= 可 clone 的完整源码工程」。
- **置信度**：高（对象与读者设定均为硬编码事实，可逐字复核）。
- **归属**：内容

### F2 · blocker · 作品卡与 404 引导卡把未展开缩写当作卖点

- **对象**：`site/src/pages/index.astro:156-157`（harness-demo 卡）、`164-165`（rag-demo 卡）、`185-186`（durable 卡）、`42`（404 页）、`site/src/pages/404.astro:42`
  - index:156-157 `loop / 工具协议 / SSE 流式 / 权限门（默认 deny）/ JSONL 轨迹 + 崩溃恢复 / token 压缩（1378→426 tok）`
  - index:164-165 `chunking → hash embedding → 暴力余弦 ∥ BM25 → RRF 融合 → 强制引用 → golden set 评测`
  - index:185-186 `journal 双锚点 + checkpoint 原子写；3 种崩溃点真实 SIGKILL，恢复按判定表 replay / skip / unknown→confirm`
  - 404:42 `6 个可运行 demo 与实测记录（轨迹、OTel、压缩自测）`
- **现象**：**SSE / JSONL / BM25 / RRF / golden set / journal / checkpoint / SIGKILL / replay / skip / OTel** 共 11 个未定义专名集中出现在初学者必经的**卡片摘要**（首页 + 404 引导卡）里。全部 11 个术语在**同一页面的可见文案内没有任何展开或释义**。
- **证据**：仅阅读 `site/src/pages/index.astro:151-193`、`site/src/pages/404.astro:28-44`。复现：`sed -n '151,193p' site/src/pages/index.astro; sed -n '28,44p' site/src/pages/404.astro`。术语首现位置见 F3 的命令输出。
- **影响**：卡片是「决定点进去看哪个」的决策材料，其功能是**降低**而不是抬高中文门槛；对这些词一无所知的读者只能用「名字长度」选课。
- **建议方向**：卡片正文只留「做什么」与「可复现判据」，全部专名下沉到 `/works/` 详情页；或每卡强制一句人话（如 rag 卡 →「用最笨的算法做检索，并如实报告它哪里失败（recall@3=0.31）」）。
- **置信度**：高（逐字可数、可复核）。
- **归属**：内容

### F3 · high · 关键缩写「首次出现处」清单化核对：多数首现无定义，且首现位置常在线性序更早的课

- **对象**（逐个给首现 `file:line` + 当场是否解释）：

| 术语 | 仓库内首次出现 | 当场是否解释 | 首次**有定义**的位置 | 定义与首现的间隔 |
|---|---|---|---|---|
| SSE | `notes/agent-harness.md:430`（`streaming SSE、结构化输出、prompt caching`） | **否**（表格单元格内，无展开） | `notes/harness-from-scratch.md:83`（`## ④ SSE 流式`，:92-95 讲三件事） | 跨文件；线性序上 :430 属第 2 课、:83 属第 1 课，但**读者按升序读第 2 课时才遇到它** |
| OTel | `notes/agent-harness.md:472` | **否** | `notes/observability.md:14`（`trace / span / metric 三个 OTel 术语` + :15 展开 GenAI 属性族） | 跨 1 课 + 位于第 12 课，而首现是第 2 课 |
| BM25 | `notes/interview-bank.md:59`（`BM25 的 IDF 定价`） | **否** | `notes/rag.md:117`（`**BM25**（经典词面检索）：基于词频/文档频率的概率检索函数`） | 跨文件 |
| RRF | `notes/interview-bank.md:105` | **否** | `notes/rag.md:121-124`（给公式 `1/(k+rank_i(d))`） | 跨文件 |
| HITL | `notes/framework-ecosystem.md:119`（`③ 权限与 HITL 钩子`） | **否** | 同文 `:147`（`HITL（人工审批）`） | 同文件 28 行之后 |
| checkpoint | `notes/agent-harness.md:166`（伪代码 `load_checkpoint_and_events()`） | **否** | `notes/agent-harness.md:102`（`**检查点** | 可恢复的状态快照`，但**用中文词**，未与 `checkpoint` 建等价） | 反向：英文标识符 :166 在前、中文释义 :102 在前但无「= checkpoint」 |
| idempotency | `notes/durable-execution.md:47`（`带 idempotency key`） | **部分**（同行「重复执行=无效果」，但**未展开 `idempotency` 本身**；全角释义在 :15"幂等=同一操作执行两次最终状态一样"） | `notes/durable-execution.md:15`（`幂等=…`，中文词） | 中文释义在前、英文词在后但未互指 |
| RLS | **全仓 0 处** | — | — | 任务书列入待查项，实测不存在 |

- **证据**：
  ```
  grep -rn -m1 'SSE\|OTel\|BM25\|RRF\|HITL\|checkpoint\|idempotency' notes/*.md notes/details/*.md
  grep -rn 'RLS\|行级安全' notes/ site/src      # → 无输出（exit 0 的 grep -r 无匹配；已确认全仓 0 处）
  awk 'NR>=424 && NR<=432' notes/agent-harness.md   # :430 streaming SSE
  awk 'NR>=466 && NR<=476' notes/agent-harness.md   # :472 OTel GenAI
  grep -n 'RLHF\|DPO\|RLVR' notes/model-basics.md   # 29 / 183 / 189 / 190
  grep -c '第一手\|一手源' notes/details/*.md
  ```
- **影响**：术语的「首现」与「定义」被拆到两篇、两课、甚至相隔 60 行以上，读者只能在「不认识的词」状态下继续读，累积成整篇不理解；`checkpoint`/`幂等`/`idempotency` 这类中英双形还额外要求读者自己做映射。
- **建议方向**：在 `notes/knowledge-map.md` 或站点 `口径说明` 增设**术语表（术语 → 中文释义 → 首次定义处链接）**；每篇首次使用英文缩写时给「缩写（中文全称）」一次性展开；中英双形（checkpoint/检查点、idempotency/幂等、compaction/压缩）至少在一处明确写「=」。
- **置信度**：高（每条首现行均给出 grep 命令，可逐条复核）。
- **归属**：内容

### F4 · high · `model-basics.md` S1.0 的 mermaid 一屏 9 个未定义专名，且 S1.0→S5.1 的定义间隔达 154 行

- **对象**：`notes/model-basics.md:26-31`（mermaid）、`:28-30`、`:183`（首次给中文释义处）
  - :28 `① 预训练 Pretraining<br/>海量文本 · 下一 token 预测`
  - :29 `③ 对齐 Alignment<br/>RLHF / DPO / RLVR / 规则护栏`
  - :30 `④ 部署 Serving<br/>量化 + 推理引擎 + 连续批处理`
  - :183 `| RLHF/DPO/RLVR | 从偏好/可验证奖励学 | 意识级：RLVR（可验证奖励，如测试通过）是 coding 模型的主要 RL 形态…`
- **现象**：初学者路径的**模型课第 1 节第 1 张图**内即出现 `Pretraining / SFT / Alignment / RLHF / DPO / RLVR / Serving`（**RLHF/DPO/RLVR 三词当场零解释**），中文释义直到 :179-183 的表格才第一次出现（`RLVR（可验证奖励…）`），S5.1 的 :189-191 才给出对比。密度实测：:28 单行 9 个拉丁词、:29 单行 8 个、:30 单行 5 个，而该课「预备知识」(:12-16) **只声明了 PyTorch / attention / 微调三项不用会，未提 RLHF/DPO/RLVR**。
- **证据**：
  ```
  grep -n 'RLHF\|DPO\|RLVR' notes/model-basics.md     # 首现 :29（mermaid），释义 :183，对比图 :189-191
  awk 'NR>=24 && NR<=40 {n=0; split($0,a,/[^A-Za-z0-9_-]+/); for(i in a) if (a[i] ~ /^[A-Za-z]/) n++; print NR": "n}' notes/model-basics.md
  # → :28 latin-words=9 / :29=8 / :30=5
  sed -n '12,16p;179,183p' notes/model-basics.md
  ```
- **影响**：图的作用是「先给全貌」，这里的全貌由四个未展开缩写构成，读者只能跳过图；而 S5 才讲对齐，等于让第一节的关键背景悬空 154 行，违背该课自己声明的「机制 → 工程后果 → 失败模式」节奏（:8）。
- **建议方向**：S1.0 图内每个缩写第一次出现就带一句中文（`RLHF（人类反馈强化学习）` 等）；或在 :26 之前加 1 行「本图四个名词：SFT=监督微调、RLHF/DPO/RLVR=三种对齐手段，细节见 S5」。
- **置信度**：高。
- **归属**：内容

### F5 · high · `agent-harness.md` 作为初学者线性序第 2 课，缺前置门槛声明，且第 1-2 节是「回顾」

- **对象**：`notes/agent-harness.md:1-16`；对照 `notes/harness-from-scratch.md:1-19`、`site/src/data/course-structure.ts:128`
  - agent-harness.md:5 `> 来源说明：通用架构取自 Anthropic 官方工程文章…`
  - agent-harness.md:9 `## 已确认的地基（第 1-2 节回顾）`
  - agent-harness.md:16 `**Agent harness**（本课程工作定义）= 围绕模型运行的那套程序…`
  - course-structure.ts:128 `prerequisiteNote: '已理解最小 loop 的组成（权限门/恢复/压缩；来自上一课）'`
- **现象**：该文件是 17 门课线性序的第 2 课（`course-structure.ts:80-130`，order=2），但：
  ① `grep -L '预备知识' notes/*.md` 结果**包含 `notes/agent-harness.md`** —— 无「技能门槛 / 不需要提前会」两栏（同期 11 篇课程都有）；
  ② 它的第 1-2 节在文中**不存在**，只剩 :9 一行「（第 1-2 节回顾）」+ :9-34 的摘要，读者从第 :38 行「# 第三节」开始，**没有任何文字说明前面两节去哪了、是否需要补**；
  ③ 站点课程卡对它的唯一前置说明（course-structure.ts:128）是「已理解最小 loop 的组成（权限门/恢复/压缩）」，而 `最小 loop` 这个术语在**该课正文里没有定义**（定义在 `agent-harness.md:18-32` 自己的「最小 loop」小标题下，但站点卡片在读者点进课程**之前**展示这句话）。
- **证据**：
  ```
  grep -L '预备知识' notes/*.md
  # → notes/agent-harness.md notes/harness-from-scratch.md notes/interview-bank.md
  #   notes/knowledge-map.md notes/llm-timeline.md notes/rag.md notes/system-design.md
  grep -n '^#\{1,3\} ' notes/agent-harness.md | head -5   # 1:title / 9:「第 1-2 节回顾」/ 38:「第三节」
  sed -n '1,16p' notes/agent-harness.md
  sed -n '120,130p' site/src/data/course-structure.ts
  ```
- **影响**：对「无 agent 经验」读者，这是第二课的**第一屏**：既没有「你要会什么」，也没有「第 1-2 节在哪」，还缺最基础术语的界定（:16「模型 API 是无状态函数」在此处才定义 harness，但 `工具定义`/`tool_calls` 未定义）；判断「我能不能读」的信息全部缺失，是线性路径上最早、最强的劝退点。
- **建议方向**：为 `agent-harness.md` 补 `## 预备知识`（前置文件 + 技能门槛 + 不需要提前会三栏，直接复用同仓其它 11 篇的模板）；:9 的「回顾」改为 2-3 句「前两节讲了什么、没有原文，需要时先读 `harness-from-scratch.md` ①②」并给链接。
- **置信度**：高（`grep -L` 与标题序号为机械事实）。
- **归属**：内容

### F6 · high · 主线第一课开篇的「本体解析」句对「无 agent 经验」读者不可解；且未补前置

- **对象**：`notes/harness-from-scratch.md:19`、`:17`、`:23-27`
  - :17 `依赖图：① one-shot → ② loop → ③ 工具协议 → ④ SSE 流式 → ⑤ 权限门 → ⑥ 会话持久化 → ⑦ 恢复/未知状态 → ⑧ 预算/压缩 → ⑨ 轨迹/演示 → ⑩ 白板蒸馏。每节 = naive 版的一个坏法长出一层。`
  - :19 `模型选择侦察（2026-10-10 实测某 OpenAI 兼容代理）：`step-5-preview` 不支持 tool calling（直接回"无法调用工具"）；`qwen3.8-flash` 支持（tools + SSE 均验证）→ demo 用 qwen3.8-flash。**面试点：模型能力参差，harness 必须能降级。**`
  - :23-27 `## ① One-shot：15 行还不够` + 单行代码块 `const res = await chat({ messages: [{role:"user", content:"读 README 并总结"}] });`
- **现象**：这是 17 门课的**第一门可动手课**（order=2，`llm-timeline` order=1 为序章），但：
  ① :17 的依赖图一次性给出 10 个**尚未定义**的专名（one-shot / loop / 工具协议 / SSE / 权限门 / 会话持久化 / 恢复 / 预算压缩 / 轨迹 / 白板蒸馏），且**没有任何一句「这些词先不用懂，往下读就会遇到」**的过渡语；
  ② :19 的「模型选择侦察」出现在第一节之前，读者此刻还不知道 `tool calling` 是什么、`代理`(proxy) 指什么，就被要求接受「harness 必须能降级」这个结论；
  ③ :25-27 的代码块**无 import、无 `chat` 定义、无执行方式**，却在正文用「15 行还不够」作标题——读者无法判断它是伪代码还是可跑代码（真源码在 `harness-demo/src/`，本页未给路径）。
- **证据**：
  ```
  sed -n '1,27p' notes/harness-from-scratch.md
  grep -L '预备知识' notes/*.md            # harness-from-scratch.md 在列（无门槛声明）
  awk 'NR>=23 && NR<=29' notes/harness-from-scratch.md
  ```
- **影响**：读者在第一门课线上（≤30 行）遇到 10+ 未定义专名 + 1 个不可验证代码块，"能不能读下去"的自我判断无从建立；这也是 F3「SSE 首现有定义的位置 vs 无定义位置」的实际落点。
- **建议方向**：:17 依赖图前加一句「这 10 个词后面逐一长出，先跳过不影响」；把 :19 的模型侦察移到 ② 之后（或压成一句「模型支持什么是前提，见 ⑨」）；:26 代码块补 1 行注释说明「真实实现见 `harness-demo/src/llm.ts`，此处是形状」。
- **置信度**：高。
- **归属**：内容

### F7 · medium · `/details/*` 8 篇是首页直达入口，但缺「读完能做什么」与前置声明

- **对象**：`notes/details/01-context-rot.md` … `08-single-threaded-write.md`（8 篇结构一致，各 31 行）；入口在 `site/src/pages/index.astro:221-228`
  - 全部 8 篇的节标题固定为：`## 一句话定义` / `## 为什么影响走向` / `## 行业一手源` / `## 本地映射` / `## 面试一句话`（01:12/16/20/24/29；02:12/16/20/24/29；…；08:12/16/20/24/29）
  - `site/src/pages/index.astro:221-225` 只给 3 条链接（01/02/07），`:227` 给「查看全部 8 篇 →」
- **现象**：这 8 页**没有**「读完能做什么」这一栏（任务书要求的三件套第三件），也**没有**前置说明（它们被首页批量直达，读者可能没读过任何前置课）；「一句话定义」承担了「这是什么」，「为什么影响走向」承担了「为什么需要」，第三件缺失。另有 2 处细节：`01:14` 用 `n²` 而解释在 `01:18`（同页但也算跨节）、`05:10` 标题用 `HITL` 而展开在 `05:14`（同一节内，属可接受）。
- **证据**：
  ```
  grep -n '^## ' notes/details/*.md        # 8 篇的节标题集合一致，无「读完能…」
  sed -n '221,228p' site/src/pages/index.astro
  ```
- **影响**：入口页的读者最需要「我读完这个能拿去做什么」，而这一栏恰是 8 页统一缺的；首页把它们描述为「面试答到机制层时直接用的素材」（index:217-218），但页面本身没给「练习动作」。
- **建议方向**：在「面试一句话」后统一加 `## 读完能做什么`（1-2 条可验证动作，如「能在白板上说出本页的 n² 论证并给一个反例」）；或在 `details/index` 页统一说明 8 篇的阅读前置（建议先修 `agent-harness.md` §5/§6）。
- **置信度**：高（8 篇结构机械一致）。
- **归属**：内容

### F8 · medium · 站点课程卡的前置说明对初学者不自足：混入代码标识符 + 反序表述「上完它」

- **对象**：`site/src/data/course-structure.ts:266`（api-engineering 的 `prerequisiteNote`）与 `:15`（其内部引用）
  - :266 `'已能跑通 harness-demo（上一课带入 chatStream 的 SSE 三件事 + provider/context/压缩 + tc.name.trim() 防御性解析）；只需 HTTP 流式(SSE) / JSON 结构 / 基本成本概念的粗认知…'`
  - :128 `'已理解最小 loop 的组成（权限门/恢复/压缩；来自上一课）'`
- **现象**：`prerequisiteNote` 是课程卡的**用户可见文案**（经 `learn.astro:131-135` 等渲染），但它把 `harness-demo`（仓库目录名）、`chatStream`（函数名）、`tc.name.trim()`（表达式）当作读者已知对象；同时 `chatStream 的 SSE 三件事` 是**反序表述**——定义（SSE 三件事）在 `notes/api-engineering.md:15` 自己写着「上完它，`chatStream` 的 SSE 三件事…直接复用」，即「上完它」的「它」指的就是当前这门课的上一课，读者在**决定是否选这门课之前**无法解开指代。
- **证据**：
  ```
  sed -n '260,268p' site/src/data/course-structure.ts
  sed -n '128,130p' site/src/data/course-structure.ts
  sed -n '11,18p' notes/api-engineering.md
  sed -n '124,142p' site/src/pages/learn.astro      # prerequisiteNote 的渲染位置
  ```
- **影响**：面向初学者，前置说明的功能是「让我确认能不能开始」；混入源码标识符会把「能不能读」变成「认不认识我的代码」。
- **建议方向**：`prerequisiteNote` 只写概念级前置（如「会写 HTTP 请求、知道流式响应是什么」），源码标识符下沉到课程正文的「预备知识」；把「上完它」改为「先修 `harness-from-scratch`」之类的直述。
- **置信度**：中（渲染位置已核实；「初学者会不会真的卡住」无法机械证明，按读者设定判定）。
- **归属**：内容

### F9 · medium · 入口节缺「这一节解决什么问题」的三件套不一致（逐处 file:line）

- **对象**（有/无入口导语，逐篇列）：

| 课程文件 | 入口节（首个小节标题） | 「这一节解决什么问题」/等价导语 | 判定 |
|---|---|---|---|
| `notes/model-basics.md` | `## S1` :20 | :22 有，且全 9 节都有 | 三件套齐 |
| `notes/agent-harness.md` | `# 第三节` :38 | **无**（:38 后直接 `## 3.1` :40） | 缺 |
| `notes/harness-from-scratch.md` | `## ①` :23 | **无**（:23 后直接代码块 :25） | 缺 |
| `notes/rag.md` | `## 公理与 naive 起点（第 1-2 节）` :10 | 仅有定义句 :14、:23-30，**无「解决什么问题」** | 缺 |
| `notes/system-design.md` | `## S1` :10 | :12 有 | 齐 |
| `notes/observability.md` | `## S1` :19 | :21 有 | 齐 |
| `notes/durable-execution.md` | `## S1` :20 | :22 有 | 齐 |
| `notes/multi-agent.md` | `## 本课导读` :16 | :18-22 以「多智能体到底在买什么」给出等价导语 | 等价齐 |
| `notes/sandbox.md` | `## 开篇` :18 | :20-22 以问题句给出等价导语 | 等价齐 |
| `notes/mcp.md` | `## S1` :19 | :21 有 | 齐 |
| `notes/data-flywheel.md` | `## S1` :19 | :21 有 | 齐 |
| `notes/evaluation.md` | `## S1` :20 | :22 有 | 齐 |
| `notes/api-engineering.md` | `## S1` :21 | :9「本课怎么读」+ :21 标题自明 | 等价齐 |
| `notes/long-term-memory.md` | `## S1` :22 | :8「这一课解决什么问题」 | 齐 |
| `notes/framework-ecosystem.md` | `## S1` | :7/:9-21「本课导读 + 本课地图」 | 等价齐 |
| `notes/llm-timeline.md` | `## 为什么 agent 开发者需要历史（3 句）` :8 | 标题即问题陈述 | 等价齐 |
| `notes/industry-2026.md` | `## 预备知识` :8 | :10-13 吸收 | 等价齐 |

- **现象**：三件套（这是什么 / 为什么需要 / 读完能做什么）在 13 篇里以多种变体实现（「本课怎么读」「本课导读」「开篇」「一句话立场」），**没有统一模板**；真正缺第一件（这是什么/解决什么问题）的是 `agent-harness.md:38`、`harness-from-scratch.md:23`、`rag.md:10` 三处——恰是 P0 起步三课。
- **证据**：
  ```
  grep -n '^#\{1,3\} ' notes/agent-harness.md notes/harness-from-scratch.md notes/rag.md | head -12
  grep -c '这一节解决什么问题' notes/*.md
  ```
- **影响**：统一模板的意义在于「读者知道每节入口能拿到什么」；P0 三课缺这一格，初学者在最早的地方失去节奏锚。
- **建议方向**：为 P0 三课补入口导语（1-2 句：本节要解决的具体困惑）；报告层面建议给全仓课程约定「入口三件套」模板（可沿用 model-basics :22 的写法）。
- **置信度**：高（表内每格可逐行复核）。
- **归属**：内容

### F10 · medium · 代码块自足性：主线第一课的 `chat` 与主课伪代码的 `load_checkpoint_and_events()` 无定义

- **对象**：`notes/harness-from-scratch.md:25-27`、`notes/agent-harness.md:165-183`
  - harness-from-scratch:26 `const res = await chat({ messages: [{role:"user", content:"读 README 并总结"}] });` —— `chat` 无定义、无 import、未指源码位置
  - agent-harness:166 `state = load_checkpoint_and_events()` —— 该函数在全文无定义（`guarded_tool_step` 在 :185 有契约说明，`load_checkpoint_and_events` 没有）
- **现象**：脱离前文时，这两段代码的**输入来源与调用对象不明**；`harness-from-scratch` 全篇的其它代码块（:33-40、:60-79、:144-147、:153、:191-194）都给了「是哪一节的源码、在哪个文件」的线索，唯独开篇 `chat(...)` 没有；`agent-harness:165` 的伪代码块标注了「（教材版）」，但读者仍无法知道 `load_checkpoint_and_events` 是发明出来的名字还是真实 API。
- **证据**：
  ```
  sed -n '23,30p' notes/harness-from-scratch.md
  sed -n '163,186p' notes/agent-harness.md
  grep -n 'load_checkpoint_and_events\|guarded_tool_step' notes/agent-harness.md   # 165 / 179 / 185 / 341?
  ```
- **影响**：自足性判据是「把块单独投给读者能否读懂」；这两块单独看会让人以为存在一个标准 `chat()` / `load_checkpoint_and_events()` 库函数，产生错误期待；对照 `harness-from-scratch:58` 标题自带 `（src/tools.ts）`，说明作者有时会给、有时不给。
- **建议方向**：开篇代码块加 1 行注释给真实路径；`agent-harness` 伪代码块在首行标注「以下函数名是本课虚构的教学写法，非某库 API」。
- **置信度**：高（可逐块核对）。
- **归属**：内容

### F11 · medium · 交叉引用格式三套并存，指代不明

- **对象**：`notes/model-basics.md:36`（`从零写 harness aci`）、`notes/model-basics.md:59`（`从零写 harness §⑧ 的模型侧理由`）、`notes/harness-from-scratch.md:238`（`⑥⑦=第五六节会话与恢复`）、`notes/details/06-observability-loop.md:26`（`从零写 harness §6(...)`）、`:27`（`可观测 §S3(span 建模轨迹树)`）、`notes/details/01-context-rot.md:26`（`从零写 harness §8`）
- **现象**：同一类「指向另一份笔记某节」的引用，至少存在三种写法且**不统一**：
  ①「课程中文名 + 节号」——`Harness 架构 §5.1`、`从零写 harness §⑧`（model-basics:35/:53/:59/:236、details 多篇）；
  ②「文件名（或短名）+ 节号」——`harness-from-scratch.md ⑥`、`rag.md §13`；
  ③「裸文件名 + 小写词」——`model-basics.md:36` 的 `从零写 harness aci`，其中 `aci` 既无 `§`、也非该课节号（`从零写 harness` 的节号是 ①-⑩），**读者无法定位**。
  节号体系本身也不统一：`agent-harness` 用「第 N 节」/`§3.1`，`rag` 用 `①-⑬`+`S1`，其余课用 `S1-S11`。
- **证据**：
  ```
  grep -n '从零写 harness aci' notes/model-basics.md
  grep -n 'harness-from-scratch.md\|rag.md §\|从零写 harness §\|Harness 架构 §' notes/details/*.md | head -12
  grep -c '§' notes/model-basics.md notes/agent-harness.md notes/rag.md
  ```
- **影响**：初学者的主要障碍之一是「这些引用到底把我送去哪」；`aci` 那种引用是**死引用**（无对应节号），会让读者以为是坏了。
- **建议方向**：统一为「`notes/<file>.md` §<节号>」并保证节号存在；修掉 `从零写 harness aci`（ACI 的定义在 `agent-harness.md:42`「agent-computer interface（ACI，对照 HCI）」，而 `从零写 harness` 的节号只有 ①-⑩，故需改为「`harness-from-scratch.md ③` + 指向 `agent-harness.md §3.1` 的 ACI 术语」）。
- **置信度**：高。
- **归属**：内容

### F12 · medium · 叙述人称不统一：主线课程用第一人称叙述且贯穿到题库与深挖表

- **对象**：`notes/model-basics.md:6`、`:208`、`:379`；`notes/data-flywheel.md:6`；`notes/framework-ecosystem.md:5`；`notes/long-term-memory.md:6`；`notes/evaluation.md:40`；`notes/mcp.md:225`；`notes/observability.md:350`；`notes/system-design.md:174`；`notes/api-engineering.md:331`；`notes/durable-execution.md:369`；对照 `notes/harness-from-scratch.md:17/:196/:218`（用「你」）
  - model-basics.md:6 `> 用法：…；S6 是**我的**实测差异化；…`
  - model-basics.md:208 `**这一节解决什么问题**：…这是我把模型课讲出差异化的地方——别人背参数，我讲运维。`
  - harness-from-scratch.md:196 `…**面试点：mock provider 后每个控制层都能独立验证**`
- **现象**：主线课程内部人称混用——`harness-from-scratch.md` 面向「你」（:17「每节 = naive 版的一个坏法长出一层」；:218 白板讲解用「所以我写一个 while 循环」），而 `model-basics.md`/`data-flywheel.md`/`framework-ecosystem.md`/`long-term-memory.md` 在同一位置用「我的」，并且「我的」不只是口吻，而是**承担教学信息**（S6 是「我的实测」、S6 是「我的差异化王牌」，读者需自行切分「哪些是主讲人的实证、哪些是通用知识」）。站点侧则完全第三人称（`index.astro:48-55`、`Footer.astro:8-11`）。
- **证据**：
  ```
  for f in notes/*.md; do s=$(grep -n '我的' "$f" | head -1); [ -n "$s" ] && printf "%-38s %s\n" "$f" "$s"; done
  # → data-flywheel.md:6 / framework-ecosystem.md:5 / long-term-memory.md:6 /
  #   model-basics.md:6 / observability.md:350 / evaluation.md:40 / mcp.md:225 /
  #   system-design.md:174 / api-engineering.md:331 / durable-execution.md:369
  grep -c '我的' notes/model-basics.md   # 4 处
  ```
- **影响**：「有后端经验、无 agent 经验」的读者面对「我的实测强项」这类表述时，无法判断这是**知识点**还是**作者自述**；对自学读者，第一人称叙事要求额外的元认知切分，是可读性成本；对标 `details/*.md` 已改用「面试官问 / 你答」的第三人称模式（如 `03:31`「我设计 agent 先问…」仍是第一人称，属未统一）。
- **建议方向**：讲授性内容统一为第二人称（「你会看到」「你的证据」）；把「我的实测」改为「本仓实测（见 `harness-demo/…`）」这类可核查表述；自述性内容保留在「来源与锚点」一节。
- **置信度**：中（人称事实已机械核实；「是否算问题」按读者设定判定，已在证据里给出两种人称的对照）。
- **归属**：内容

### F13 · low · 中文排版零散失：缺空格、括号/引号风格不统一

- **对象**：`notes/model-basics.md:117`、`:367`、`:36`；12 篇主读文件的引号统计；文件标题括号
  - model-basics.md:117 `…（注意力质量随长度衰减，"context rot"/lost-in-the-middle——Harness 架构 §5已建立）` → **`§5` 与 `已建立` 之间缺空格**
  - model-basics.md:367 `| S6（从零写 harness侦察+评测工程化回归）|` → **`harness` 与 `侦察` 之间缺空格**（同行还缺 `）` 与 `|` 之间的空格）
  - model-basics.md:36 `（从零写 harness aci）` → 小写 `aci`（跨文件引用见 F11）
  - 文件标题：`# 模型基础(够用不深挖)`、`# Harness 架构(完整教程)`、`# 从零写 harness(最小 Agent Harness 完整教程)`、`# RAG 与检索(完整教程)` —— **同为半角 `(` + 全角 `)`**
  - 引号：`notes/details/06-observability-loop.md` 全角 `“`=2、半角 `"`=26，其余 11 篇全角 = 0
- **现象**：正文/标题层面存在可机械检出的排版不一致：中英边界缺空格、括号风格混用、同一文件内半角/全角引号并存。
- **证据**：
  ```
  sed -n '117p;367p;36p' notes/model-basics.md
  for f in notes/model-basics.md notes/agent-harness.md notes/harness-from-scratch.md notes/rag.md notes/details/*.md; do
    d=$(grep -o '"' "$f" | wc -l); c=$(grep -o '“' "$f" | wc -l); printf "%-42s ASCII=%s curly=%s\n" "$f" "$d" "$c"; done
  head -1 notes/model-basics.md notes/agent-harness.md notes/harness-from-scratch.md notes/rag.md
  ```
- **影响**：单条都轻微；但对「读满 17 课」的初学者，缺空格处会造成词组误读（`§5已建立` 会被读成一个词），引号混用在同一页内出现两种字形会显得未校对。
- **建议方向**：批量修排版（中英之间补空格、标题括号统一为全角「（）」、引号统一为半角 `""`，与全仓 98% 现状一致）。
- **置信度**：高（机械可数）。
- **归属**：内容

### F14 · low · 疑问句 + 「追问链」式题面密度高，单题嵌套 3-4 个问号

- **对象**：`notes/interview-bank.md:30-34`、`:37-41`、`:43-47`；`notes/model-basics.md:362-375`
  - interview-bank.md:32 `- Q3 "动容器前查创建时间"这条规则防什么、不防什么？（事前 vs 事后）`
  - interview-bank.md:38 `- Q2 858 条 skipped 各是什么？分母怎么写才不会骗人？`
  - model-basics.md:371 `| 10 | speculative decoding 为什么"无损"？什么情况下加速失败（接受率崩）？此时该换什么手段？ | S7-14 |` → 单格 3 个问号
- **现象**：题面普遍把「定义题 + 边界题 + 对策题」压进一行，单格最多 3 个问号；且题面用缩写首字母/行话而不展开（`BM25 的 IDF 定价` interview-bank:59、`speculative decoding` model-basics:371）。
- **证据**：
  ```
  sed -n '29,47p' notes/interview-bank.md
  awk 'NR>=362 && NR<=375' notes/model-basics.md
  grep -n '？.*？.*？' notes/model-basics.md notes/interview-bank.md | head
  ```
- **影响**：作为「模拟考卷」用法，压缩本身合理；但对初学者**当作自测题**时，一行 3 问无法判断自己答到哪一层算过关，也不会暴露「哪一问不会」。
- **建议方向**：题库答题栏保留压缩形态，另加「拆问」版本（每问一行）+ 一句「答到什么算过关」；或给每题标注最简合格的答点。
- **置信度**：中（计数可复核；「是否算问题」按用途判定）。
- **归属**：内容

### F15 · low · `learn.astro` 尾部的「口径说明」缩进错位，读者层面表现为层级可疑

- **对象**：`site/src/pages/learn.astro:196`、`:263-265`、`:286`
  - :196 `<section class="phase-section" id="capstone" data-capstone>`
  - :263-265 `</div>` → `<!-- ── 口径说明… -->` → `<section class="phase-section">`
  - :286 `</section>`
- **现象**：`口径说明` 这一节写在 `#capstone` 这个 `<section>` 内部（:263 只关掉了 `.cards` 的 `<div>`，`:286` 的 `</section>` 才关 capstone section），但**缩进层级与前一节相同**（`awk` 实测两节起始列均为 0），读者/维护者在页面结构上无法判断它属于谁；从「面向初学者的导航页」角度，该页尾出现的 `阶段计数 P0×5 …`、`mvpSlug`、`whiteboard 白板卡不计入课程页` 等口径内容对初学者是纯维护信息。
- **证据**：
  ```
  awk 'NR>=255 && NR<=292 {printf "%d[col=%d]: %s\n", NR, match($0,/^ */)-1, substr($0,1,50)}' site/src/pages/learn.astro
  # :265 与 :196 同为 col=0；:286 的 </section> 才闭合 :196
  ```
- **影响**：本角度下，这是一处「初学者会在页尾撞进维护者口径」的定位问题（缩进错位使层级不可读）；渲染正确性不在本轮范围。
- **建议方向**：把「口径说明」移出 capstone section（或明确降级为页脚注释），并同步缩进。
- **置信度**：中（缩进与标签配对可用命令复核；「渲染后是否错觉」未验证——本轮不看显示形式）。
- **归属**：内容（层级定位）+ 登记 `显示形式` 附录（缩进/结构）

### F16 · low · 同一文件内术语中英双形并存且未建立映射（compaction / checkpoint / 幂等 / token 压缩）

- **对象**：`notes/agent-harness.md:102`、`:108`；`notes/harness-from-scratch.md:193`、`:196`；`notes/durable-execution.md:15`、`:47`；`notes/model-basics.md:16`
  - agent-harness.md:102 `| **检查点** | 可恢复的状态快照 |`（中文）
  - agent-harness.md:108 `**① 压缩（compaction）**：窗口快满时…`（有映射）
  - harness-from-scratch.md:193 `compactIfNeeded: 保 head(system+首user) + 尾 keepTail 条…`（英文）
  - harness-from-scratch.md:196 `压缩前 tokens≈1378 → 摘要 3 条 → 压缩后 5 条`（中文）
  - durable-execution.md:15 `checkpoint=定期快照`（有映射）；:47 `idempotency key`（无映射，仅 `重复执行=无效果`）
  - model-basics.md:16 `…KV cache 机制、prefill-decode 两阶段…随 model-basics-demo 的 npm run demo 边跑边建`（**先要求读者接受这两个术语**，定义在 :45-47）
- **现象**：同一概念在同一课里有「英文词 / 中文词 / 代码标识符」三种写法，只有部分位置建立映射（compaction、checkpoint:15 有；idempotency、检查点:102、token 压缩 无）。
- **证据**：
  ```
  sed -n '102p;108p' notes/agent-harness.md
  sed -n '193p;196p' notes/harness-from-scratch.md
  sed -n '15p;47p' notes/durable-execution.md
  sed -n '16p;45,47p' notes/model-basics.md
  ```
- **影响**：初学者无法判断「检查点」与「checkpoint」是不是同一个东西，也无法把正文词汇映射到 `compactIfNeeded` / `keepTail` 这类标识符。
- **建议方向**：每篇首次出现处统一写「中文（English）」并保持后文一致；代码标识符在正文首次出现时给一句「= 前文说的 X」。
- **置信度**：高（逐行可复核）。
- **归属**：内容

---

## 逐篇难度评分（1=最易 … 5=最难，读者设定：有后端经验、无 agent 经验）

评分依据 = ①开篇 22 行内**未定义专名数**；②术语「首现→定义」间隔；③入口是否有导语；④是否有前置声明。卡点一律给 file:line。

| 课（按 `course-structure.ts` 线性序） | 难度 | 主要卡点（file:line） |
|---|---|---|
| `llm-timeline.md` | 2 | :3 `12 节点`、:10 `function calling`/`推理模型` 未展开；:11 `MCP` 直接使用（定义在 `mcp.md`）。入口 `## 为什么 agent 开发者需要历史` :8 已把「为什么需要」讲清，故仍属可读。 |
| `harness-from-scratch.md` | 3 | :17 十个未定义节名一次抛出；:19 `tool calling`/`代理` 前置结论；:25-27 `chat()` 无定义（F6/F10）；全文无 `预备知识` 门槛声明（F5 命令）。 |
| `agent-harness.md` | 4 | :9 第 1-2 节只剩「回顾」；:38 第三节无入口导语；:42 `ACI`/`HCI`、:101 `JSONL`、:108 `compaction`、:113 `structured note-taking`、:118 `just-in-time retrieval`、:122 `sub-agent` 一屏六名（F5/F9）。 |
| `rag.md` | 3 | :40 mermaid 内 `BM25`/`RRF` 首现无定义（定义在 :117/:121）；:10 `公理与 naive 起点` 无「这一节解决什么问题」；:280-299 §13 实测复盘段对初学者信息过载（:284 `FNV-1a`/`L2 归一`、:289 `df/idf`、:295 数字口径历史）。 |
| `system-design.md` | 2 | :10 入口导语齐；卡点 :20 「3-10× 成本、约 15×」未溯源（对初学者是突然的数字）、`:21` 注入面一句话带过；缺 `预备知识`（F5 命令）。 |
| `sandbox.md` | 2 | :20-22 开篇导语好；卡点 :13 `namespace + cgroup` 括号句、:22 `env`/`egress` 未展开（`egress` 定义在 :14 提及但未解释）。 |
| `mcp.md` | 3 | :14 门槛句好；卡点 :6 `tool poisoning`/`rug pull`/`红队` 与 :235 `approval fatigue` 均为未展开英文短语；:19 入口导语齐。 |
| `evaluation.md` | 2 | :20 入口导语齐；卡点 :5 `judge`/`golden set`/`CI 门禁`、:8 `LLM-as-judge`（定义在 :215 of rag 或本课 S3）、:15 `Cohen's Kappa`/`G-Eval` 明确列为「不用会」——处理得当，故难度不高。 |
| `multi-agent.md` | 3 | :10 门槛句好；:20 「1-2k token」未说明量级来源；:3 `§S3` 等交叉引用格式（F11）；:18 入口导读齐。 |
| `durable-execution.md` | 3 | :15 给 `幂等`/`checkpoint` 中文释义（好）；卡点 :8 `long-horizon`、:47 `idempotency key`/`at-least-once 投递` 未展开；:4 `journal` 未展开。 |
| `api-engineering.md` | 3 | :9「本课怎么读」+ :13-17 预备知识齐（本仓最好的入口模板之一）；卡点 :15 反序「上完它」（F8）、:21 `S1 流式深水区` 依赖 SSE 三个前提、:5 `litellm`/`p50`。 |
| `observability.md` | 4 | :13-15 门槛句写得好；卡点 :14 要求「会 trace/span/metric 的**粗概念**」但未给定义（定义靠读者自备）、:19 起 S1 全节是跨系统对照表；:350 `我的锚点`（F12）。 |
| `long-term-memory.md` | 3 | :8 有「这一课解决什么问题」；卡点 :6 `pinboard`/`tray`/`archive`、:16 `BM25/RRF`（依赖 rag）、`JSONL` 未展开（F5 无 `预备知识`）。 |
| `data-flywheel.md` | 4 | :6 首屏即 `T+5 延迟标签`/`台账 1830 行`/`#35`/「我的差异化王牌」；:13-15 门槛句齐但 :21 起 S1 直接进入生产台账语境，读者缺「飞轮是什么」的日常类比。 |
| `model-basics.md` | 5 | :26-31 mermaid 9 个未定义专名（F4）；:29 `RLHF/DPO/RLVR` 释义在 :183；:16 `prefill-decode` 先要求接受、:45 才定义；:56-63 `KV cache`/`GQA`/`MQA`/`PagedAttention` 一段四名。 |
| `framework-ecosystem.md` | 3 | :7「本课导读」+ :9-21「本课地图」极好；卡点 :5 「我的独特资产」+ `RPC 模式`/`pi-agents-team workers` 未展开、:119 `HITL` 首现无定义（F3）。 |
| `industry-2026.md` | 4 | :8-13 门槛句齐；卡点 :10 `isHorizontal`（源码标识符写进读者文案）、:12 `U-26 核实台账`、:19-22 `workflow vs agent`/`90.2%`/`context-anxiety` 密集且无前置课（:10 自陈「建议先修完前 16 课」——对初学者等于不可读）。 |
| `knowledge-map.md` | 3 | :11-19 计数口径块（`19 = 17 + 2`、`git 考古`、`EXCLUDED_FROM_COURSE_ROUTE`）对初学者是纯维护信息；作为索引用途 :22 命名总表可用。 |
| `interview-bank.md` | 4 | :10 自我介绍模板可读；:19 `S-T-A-R-L`、:30-47 追问链（F14）、:59 `BM25 的 IDF 定价`（F3）——建议标为「前 10 课之后再读」。 |

---

## 转交下一轮（显示形式）

（只登记，不展开）

1. `site/src/pages/learn.astro:264-286`：`口径说明` 与 capstone section 的缩进层级错位（F15 证据行），渲染后的视觉归属需目检。
2. `site/src/pages/nav.astro`：时间线/代际/课程索引三段全为长列表，初学者扫读成本高——版面分组待下一轮。
3. `notes/details/*.md` 8 篇：统一 5 节结构适合做「左右两栏/折叠」呈现，当前为单栏长页；信息层级待下一轮。
4. 课程文件开头 5 行 `>` 引用块（优先级/状态/前置/用法）在站点渲染下与正文同权重，初学者难分辨「元信息 vs 正文」。
5. `notes/*.md` 大量 mermaid 图无图号/图注（靠正文「从图里要能读出三件事」指代）——图注样式待下一轮。

## 本轮未覆盖 / 未验证

1. **13 篇课程的正文中后段未逐行读**（本任务限定「每篇开头 1-2 节」）：`api-engineering` / `data-flywheel` / `durable-execution` / `evaluation` / `mcp` / `multi-agent` / `long-term-memory` / `system-design` / `sandbox` / `framework-ecosystem` / `industry-2026` / `llm-timeline` / `knowledge-map`。其难度评分与卡点只基于前 22 行，**中后段的术语首现可能更早/更难**，未验证。
2. **站点渲染结果未目检**：本轮按边界不看显示形式，故「术语表缺失」类结论只基于文本；**未跑 `astro build`**（scope §0.5 要求默认不跑，本机约 8 分钟且不可依赖），因此无法验证 `notes/*.md` 在 `/c/<slug>/` 页面上的实际呈现顺序与折叠行为。未验证。
3. **`/works/`、`/interview/`、`/map/` 三页文案未通读**（不在本任务主读/抽读范围）：其中 `works.astro`（460 行）很可能也承载未展开缩写，本轮**未核对**——如需补齐入口层可读性结论，建议下一轮或由 `coverage` 视角并入。
4. **`site/src/data/*.ts` 仅核 `course-structure.ts`**：`mvps.ts` / `capstone.ts` / `final-project.ts` / `llm-history.ts` 的用户可见文案未读，其术语密度未评估。
5. **难度评分的主观成分**：评分由「未定义专名数 + 首现-定义间隔 + 入口三件套 + 前置声明」四项机械指标合成，权重由我设定，**不构成对外口径**；卡点行号可逐条复核，评分数字不可。
6. **`RLS` 判定为「全仓 0 处」**：命令 `grep -rn 'RLS\|行级安全' notes/ site/src` 无输出。若上游以英文全称 `row-level security` 出现，本轮未查（未跑该模式）。
7. **人称问题的判据边界**：F12 依据「同一信息位置出现两种人称」这一机械事实 + 读者设定；「第一人称是否必然降低可读性」我无实测数据（未做读者实验），故标 `medium` 而非更高。未验证。
