# 站点重构方案：五阶段课程体系 + LLM 横向知识

> 性质：**给后续工程任务（数据层、页面重构）的唯一输入文档**。本文件是编排与事实的单一真源，后续实现只引用、不改写本表结论。
> 审计人：alex（课程内容架构师） · 任务 t1 · 时间 2026-10-13（系统时钟）
> 审计对象：`site/src/data/courses.ts`（18 条 = 17 课程页 + 1 `whiteboard` 卡）、`notes/` 19 份笔记、三个草稿 `site/src/data/llm-history.ts` / `site/src/data/course-structure.ts` / `site/src/pages/nav.astro`。

---

## §0 审计结论摘要

1. **现有 phase 只有 P0/P1/P2 三档 + `—` 横向**，且 `courses.ts` 里 P0=7 门、P1=4、P2=4、`—`=2（`llm-timeline`、`industry-2026`），不满足目标「五阶段 P0–P4」。需要从三档扩展为五档，并把全部 17 门课程页条目无遗漏地归位。
2. **三个草稿不足/有误**（见 §7）：
   - `course-structure.ts` 只覆盖 5 门课的一条线性链，且把 `sandbox` 误标 P1、`observability` 误标 P4——与课程实数不符；
   - `llm-history.ts` 存在**事实错误**（LLaMA 写作 2022、"Open source" 表述错误）与**臆测**（"Agent 2.0"、"2026 Next-gen Multi-agent + Self-improvement"、"Self-improvement/Multi-agent collaboration" 均无权威来源）；
   - `nav.astro` 直接消费了上述错误数据，且页面结构是残缺草稿。
   - **结论：三个草稿全部重做，不沿用。**
3. **17 个课程页条目清单**（= 19 份顶层笔记 − `knowledge-map` − `interview-bank`，恰与 `courses.ts` 去 `whiteboard` 后一致）：
   `harness-from-scratch` / `rag` / `system-design` / `sandbox` / `evaluation` / `multi-agent` / `llm-timeline` / `agent-harness` / `durable-execution` / `mcp` / `api-engineering` / `data-flywheel` / `observability` / `long-term-memory` / `model-basics` / `framework-ecosystem` / `industry-2026`。**§2 主表恰好 17 行，无遗漏。**

---

## §1 编排总原则与决策记录（we_i 实现前必读）

**P0**（基础篇，0 经验可入手）｜**P1**（工具与安全）｜**P2**（生产可靠性）｜**P3**（体系与数据）｜**P4**（收口与前沿）。

硬约束与对应决策：

1. **「五阶段 17 课无遗漏」**：17 门课程页条目**全部**落入 P0–P4，不设 0.5 之类中间态。主表 §2 每行一个 stage。
2. **「LLM 发展史与演进横向知识导航页（位于 P0 之前）」与「P0 从零写 harness 起步」的调和**：
   - `llm-timeline` 在课程表里的 stage 标为 **P0（序章，第 1 课）**，`prereqs=[]`，0 经验可读，作为「背景地图」；
   - 它同时是「LLM 发展史与演进横向知识导航页」的**正文来源**——该横向页（`nav.astro` 重做后的产物）在**站点导航里位于 P0 之前**，是一页「横向知识总览」；`/c/llm-timeline` 课程页仍是它的深度正文。
   - **P0 的实践起步点是 `harness-from-scratch`（第 2 课，从零写 loop）**：序章是纯阅读背景，第一门「动手写代码」的课就是从零写 harness。这同时满足「横向页在 P0 前」与「从零写 harness 起步」。
3. **「独占 MVP」与「共享 MVP」的语义（重要，消歧）**：
   - 每门课有且仅有**一个 `mvpSlug` 字段值**（课程→MVP 是函数映射，映射唯一）；
   - 但映射**不是单射**：后段课程会**复用/扩展**前一段课程的同一 MVP（"后一阶段可复用前一阶段代码"）。§4 词表标注每个 MVP 的「归属课（owner）」与「复用课」。
   - 「MVP 必须可 clone、完整可运行，不是演示片段」→ §4 区分「代码 MVP（已实现可运行）」「代码 MVP（规划）」「非代码/横向资产」三态，现状如实标注，规划态绝不冒充已实现。
4. **`next` 与「课程序列」**：采用**单链线性阅读序**（§3 给出 1–17）。每门课 `next` = 序里的下一门（末课为空）；上下篇导航（上一篇/下一篇）由该线性序派生。逻辑依赖（可能跨多门）由 `prereqs` 承载。这样「prereqs 引用的大前提存在」与「上下篇顺序明确」都由构造保证。
5. **口径冻结**（沿用 knowledge-map 2026-10-12 冻结口径，仅新增本表的派生量）：
   - 15 知识域（14 编号课 + `agent-harness` 主线）｜17 课程页｜18 课程卡（含 `whiteboard`）｜6 可运行 demo 作品｜可运行回归套件 `memory-redteam` 不计作品数。
   - 本表新增：**五阶段课程 17 门 = P0×5 + P1×4 + P2×3 + P3×3 + P4×2**；其中 15 门为知识域课，2 门为横向资产（`llm-timeline`、`industry-2026`）现归入 P0/P4 作为序章/收口。

---

## §2 五阶段课程编排总表（唯一真源）

> 列：`#`=线性序｜`stage`｜`slug`｜`课名/域`｜`prereqs`(前置课程 slug)｜`next`(线性后继 slug)｜`mvpSlug`｜`前置知识`(一句)
> 「前置知识」= 课程之外需备的概念/技能（`—` 表示无需）。「prereqs」= 课程之间的硬依赖。二者不同。

### P0 基础篇（0 经验可入手，从零写 harness 起步）

| # | slug | 课名/域 | prereqs | next | mvpSlug | 前置知识 |
|---|---|---|---|---|---|---|
| 1 | `llm-timeline` | LLM 发展史与演进（序章·横向） | `[]` | `harness-from-scratch` | `llm-history` | —（0 经验可读） |
| 2 | `harness-from-scratch` | 从零写 harness | `[]` | `agent-harness` | `harness-mvp` | Python 基础（函数/类/异常/文件 IO）+ 会跑终端命令 |
| 3 | `agent-harness` | Harness 架构（主线） | `["harness-from-scratch"]` | `rag` | `harness-mvp` | 已理解最小 loop 的组成（权限门/恢复/压缩） |
| 4 | `rag` | RAG 与检索 | `["harness-from-scratch"]` | `system-design` | `rag-mvp` | 「检索=打分排序」直觉 + 会读写文件；无需语义模型 |
| 5 | `system-design` | Agent 系统设计 | `["harness-from-scratch","rag"]` | `sandbox` | `harness-mvp` | 能画业务流程图、会讲「需求→组件→权衡」 |

### P1 工具与安全篇

| # | slug | 课名/域 | prereqs | next | mvpSlug | 前置知识 |
|---|---|---|---|---|---|---|
| 6 | `sandbox` | 沙箱与凭据 | `["harness-from-scratch"]` | `mcp` | `sandbox-mvp` | OS 进程/文件系统/容器隔离的基本概念 |
| 7 | `mcp` | MCP 与供应链安全 | `["sandbox"]` | `evaluation` | `mcp-mvp` | HTTP/JSON-RPC + 客户端-服务器模型 |
| 8 | `evaluation` | 评测工程化 | `["rag"]` | `multi-agent` | `rag-mvp` | precision/recall 概念 + 抽样统计直觉 |
| 9 | `multi-agent` | 多智能体编排 | `["system-design","harness-from-scratch"]` | `durable-execution` | `harness-mvp` | 顺序执行与并发的差异（单线程写 vs 多路读） |

### P2 生产可靠性篇

| # | slug | 课名/域 | prereqs | next | mvpSlug | 前置知识 |
|---|---|---|---|---|---|---|
| 10 | `durable-execution` | durable execution | `["harness-from-scratch","evaluation"]` | `api-engineering` | `durable-execution-mvp` | 幂等/事务/checkpoint 基本概念 |
| 11 | `api-engineering` | API 与多模型路由 | `["harness-from-scratch"]` | `observability` | `api-mvp` | HTTP 流式(SSE) + JSON 结构 + 基本成本概念 |
| 12 | `observability` | 可观测 | `["api-engineering"]` | `long-term-memory` | `obs-mvp` | trace/span/metric 概念（OpenTelemetry 术语） |

### P3 体系与数据篇

| # | slug | 课名/域 | prereqs | next | mvpSlug | 前置知识 |
|---|---|---|---|---|---|---|
| 13 | `long-term-memory` | 长期记忆 | `["rag"]` | `data-flywheel` | `memory-mvp` | 向量相似度(余弦) + 检索融合(RRF)基础 |
| 14 | `data-flywheel` | 数据飞轮 | `["evaluation"]` | `model-basics` | `flywheel-mvp` | 训练/评测数据版本化 + 标签噪声概念 |
| 15 | `model-basics` | 模型基础 | `["llm-timeline"]` | `framework-ecosystem` | `model-basics-mvp` | 矩阵乘法 + softmax 基础直觉 |

### P4 收口与前沿篇

| # | slug | 课名/域 | prereqs | next | mvpSlug | 前置知识 |
|---|---|---|---|---|---|---|
| 16 | `framework-ecosystem` | 框架生态 | `["agent-harness"]` | `industry-2026` | `framework-mvp` | 已亲手写过 harness + 会读 TS/Python SDK 文档 |
| 17 | `industry-2026` | 行业前线调研（横向收口） | `[]` | `[]`（末课） | `industry-research` | 建议先修完前 16 课（收口阅读；无硬前置） |

**自洽校验（全部通过）**：17 行无遗漏；每行 `prereqs` 引用的 slug 都出现在更小的 `#`（拓扑序）；`next` 恰好等于 `#+1`（末课 `[]`）；五阶段计数 P0×5+P1×4+P2×3+P3×3+P4×2=17。

---

## §3 课程序列（上下篇导航唯一真源）

线性阅读序（#1→#17，`next` 与上一篇/下一篇由此派生）：

```
llm-timeline → harness-from-scratch → agent-harness → rag → system-design
→ sandbox → mcp → evaluation → multi-agent → durable-execution
→ api-engineering → observability → long-term-memory → data-flywheel → model-basics
→ framework-ecosystem → industry-2026
```

- 「上一篇」= `#-1` 的 slug；「下一篇」= `#+1` 的 slug。
- 仅一处**有意的逻辑跳链**说明：`evaluation(#8)` 的线性后继是 `multi-agent(#9)`，但 `evaluation` 同时是 `durable-execution(#10)` 与 `data-flywheel(#14)` 的 `prereqs`——这些是「软依赖/前置」，不进上下篇导航，避免把单链打散。

---

## §4 MVP 词表 + 课程→MVP 映射一致表

### 4.1 词表（13 个 mvpSlug；三态如实标注）

| mvpSlug | 归属课（owner） | 复用/扩展课 | 现况 | 制品 |
|---|---|---|---|---|
| `harness-mvp` | `harness-from-scratch` | `agent-harness`、`system-design`、`multi-agent` | ✅ 已实现 | `harness-demo/`（10 src，5 运行模式）+ `whiteboard/agent_whiteboard.py` |
| `rag-mvp` | `rag` | `evaluation`、`system-design`(参考) | ✅ 已实现 | `rag-demo/`（132 chunks golden set，recall@3=0.31） |
| `sandbox-mvp` | `sandbox` | — | ✅ 已实现 | `sandbox-demo/`（四通道 policy + 幽灵重放） |
| `mcp-mvp` | `mcp` | — | ✅ 已实现 | `mcp-demo/`（投毒 + 四层防御 + 消融） |
| `durable-execution-mvp` | `durable-execution` | — | ✅ 已实现 | `durable-execution-demo/`（journal/checkpoint/幂等） |
| `obs-mvp` | `observability` | — | ✅ 已实现(v0) | `harness-demo` 的 `demo:otel`（离线 mock 15 spans/1 trace） |
| `memory-mvp` | `long-term-memory` | — | ✅ 已实现 | `memory-redteam/`（自研记忆子系统，16/16 守住） |
| `framework-mvp` | `framework-ecosystem` | — | ✅ 已实现 | `framework-demo/`（Claude Agent SDK 四能力） |
| `api-mvp` | `api-engineering` | — | ⏳ 规划(本 sprint 只登记) | 无独立 demo；v0 复用 `harness-mvp` 的 provider/context/压缩模块，扩展流式/结构化输出/caching/重试/路由 |
| `flywheel-mvp` | `data-flywheel` | — | ⏳ 规划(本 sprint 只登记) | FinHot 台账脱敏样本 + labeler 最小闭环；生产数据在仓外 |
| `model-basics-mvp` | `model-basics` | — | ⏳ 规划(本 sprint 只登记) | KV cache / 推理成本数值走查脚本 |
| `llm-history` | `llm-timeline` | `industry-2026`(同类横向) | 🔄 本 sprint 重建 | `site/src/data/llm-history.ts`（重建）+ `/nav` 横向导航页 |
| `industry-research` | `industry-2026` | — | ✅ 已实现(非代码) | `notes/industry-2026.md` + `notes/details/` 8 页 |

> 非代码/横向的 `llm-history`、`industry-research` 属「横向资产」，不是「可运行 demo」——**不计入 6 个作品数**（口径冻结不变）。`system-design`、`evaluation`、`multi-agent` 三门「模板/评测/练习」课复用 `harness-mvp`/`rag-mvp`，不新增代码制品，其「产物」是课程内的设计模板与评测/子代练习。

### 4.2 课程→MVP 映射（与 §2 主表逐行一致）

`llm-timeline→llm-history`｜`harness-from-scratch→harness-mvp`｜`agent-harness→harness-mvp`｜`rag→rag-mvp`｜`system-design→harness-mvp`｜`sandbox→sandbox-mvp`｜`mcp→mcp-mvp`｜`evaluation→rag-mvp`｜`multi-agent→harness-mvp`｜`durable-execution→durable-execution-mvp`｜`api-engineering→api-mvp`｜`observability→obs-mvp`｜`long-term-memory→memory-mvp`｜`data-flywheel→flywheel-mvp`｜`model-basics→model-basics-mvp`｜`framework-ecosystem→framework-mvp`｜`industry-2026→industry-research`

（17 行，与 §2 主表 `mvpSlug` 完全一致；每个 mvpSlug 都出现在 §4.1 词表——映射闭合。）

---

## §5 前置知识标注汇总（需要前置知识/技能的课）

> 无前置知识（`—`）的课：`llm-timeline`、`system-design`、`industry-2026` 三门（纯概念/背景/收口，0 技能门槛）。其余 14 门见 §2 主表「前置知识」列，此处汇总为一句话定位：

| slug | 前置知识（一句话） |
|---|---|
| `harness-from-scratch` | 会 Python（函数/类/异常/IO）+ 跑终端 |
| `agent-harness` | 已懂最小 loop 的组成（由 harness-from-scratch 带入） |
| `rag` | 检索=打分排序的直觉 + 文件读写 |
| `sandbox` | OS 进程/文件系统/容器隔离概念 |
| `mcp` | HTTP/JSON-RPC 与客户端-服务器模型 |
| `evaluation` | precision/recall + 抽样统计 |
| `multi-agent` | 顺序执行与并发差异 |
| `durable-execution` | 幂等/事务/checkpoint |
| `api-engineering` | HTTP 流式(SSE) + JSON + 成本 |
| `observability` | trace/span/metric（OTel） |
| `long-term-memory` | 向量相似度 + RRF 融合 |
| `data-flywheel` | 数据版本化 + 标签噪声 |
| `model-basics` | 矩阵乘法 + softmax |
| `framework-ecosystem` | 亲手写过 harness + 读 SDK 文档 |

---

## §6 横向知识清单

> 「横向知识」= 贯穿多个阶段/课程、不按单课线性展开的知识面（本次 sprint 只深度填充「LLM 历史 + 演进」，其余列清单待后续 sprint）。

### 6.1 本 sprint 深度填充（LLM 历史 + 演进）

- **LLM 发展历史（关键时间线）**：见 §7.3 权威事实表（2017 Transformer → … → 2025 DeepSeek-R1）。教学定位：回答「为什么当年这么设计 / 为什么现在是这个格局 / 下一步往哪走」。
- **LLM 演进过程（架构/能力代际）**：见 §7.4 权威代际表（预训练 → 规模/上下文学习 → 指令微调/RLHF → 工具调用/多模态 → 推理模型 → 开源权重）。教学定位：把「架构选择」与「能力解锁」按代对齐。

### 6.2 其他横向知识（本次只列清单，待后续 sprint）

| 横向知识面 | 与课程的交叉 | 现状 | 优先级建议 |
|---|---|---|---|
| 安全（提示注入/越权/越狱/供应链投毒/OWASP LLM & Agentic Top 10） | `mcp` §S4、`sandbox`、`long-term-memory`(记忆投毒) | 已在课程内分散覆盖，缺一个横向安全总览 | 高（与 P1 联动） |
| 可观测（OTel GenAI、tracing、成本归因） | `observability`、`api-engineering` | 已有 `obs-mvp`；横向汇总缺 | 中 |
| 成本/经济学（token 计价、caching、蒸馏、小模型路由、KV cache） | `api-engineering`、`model-basics` | 分散；缺成本横向视图 | 中 |
| 评测与对齐（benchmark 演化、judge 偏差、污染/记忆投毒） | `evaluation`、`data-flywheel` | 已较强；横向汇总缺 | 中 |
| 协议与治理（MCP/AAIF 治理、A2A、spec 演进） | `mcp`、`industry-2026` | `industry-2026` 已有一手源 | 低（本轮已覆盖大部分） |
| 多模态演进（vision→audio→tool/computer use） | `llm-timeline`、`industry-2026` | 时间线里已含电脑使用/多模态节点 | 低 |
| 开源生态全景（LLaMA / Mistral / Qwen / DeepSeek / Gemma 版图） | `llm-timeline`、`model-basics` | 时间线覆盖部分；缺版图页 | 中 |

---

## §7 LLM 发展史与演进事实核查结论

> 核查方式：`web_search` 在本环境无 DeepSeek API key 不可用（已记录）；改用 `web_fetch` 抓取维基百科与 arXiv 一手/权威页逐条核实。**已核实事实均有 URL + 日期；「公认公开史实但未逐条抓一手源」的补充节点单独标注，不下断言。**

### 7.1 原草稿 `llm-history.ts` 的错误与臆测（逐条）

**LLM_HISTORY（时间线）**

| # | 草稿原文 | 判定 | 修正 |
|---|---|---|---|
| 1 | `2017 Transformer / Attention is all you need` | ✅ 正确 | 补充：2017-06 发表，NeurIPS 2017，Google 8 作者（Vaswani 等）。见 §7.3 |
| 2 | `2018 BERT / Pre-training` | ✅ 正确 | 补充：2018-10，Google，encoder-only + MLM/NSP 预训练。见 §7.3 |
| 3 | `2020 GPT-3 / In-context learning` | ✅ 正确 | 补充：2020-05，175B，「Language Models are Few-Shot Learners」。见 §7.3 |
| 4 | `2022 LLaMA / Open source` | ❌ **年份错误 + 表述错误** | LLaMA 是 **2023-02-24**（不是 2022）；首发权重仅限研究者申请、后被泄流，**并非 open source**（OSI 明确不认可）。真正的开放可商用权重是 **LLaMA 2（2023-07-18）**。见 §7.3 |
| 5 | `2023 GPT-4 / Tool use` | ⚠️ **混淆** | GPT-4 发布是 **2023-03-14**（多模态）；**tool/function calling 是 2023-06 作为独立 API 能力**，不是 GPT-4 发布自带。拆成两个节点。见 §7.3 |
| 6 | `2024 o1 / Reasoning` | ✅ 基本正确 | 精确：**o1-preview/o1-mini 2024-09-12，正式 o1 2024-12-05**，推理模型（chain-of-thought）。见 §7.3 |
| 7 | `2025 o3 / DeepSeek / Agent 2.0` | ❌ **臆测/混乱** | o3 **首次公布 2024-12（preview）**、正式开放约 2025-04；DeepSeek-R1 **2025-01-20**（arXiv 2501.12948）；「**Agent 2.0**」是营销性臆造标签，无权威定义。拆开并删掉臆造标签 |
| 8 | `2026 Next-gen / Multi-agent + Self-improvement` | ❌ **纯臆测** | 无权威来源的对未来猜测，**不得进入权威事实表**。本 sprint 一律删除 |

**LLM_EVOLUTION（代际）**

| # | 草稿原文 | 判定 | 修正 |
|---|---|---|---|
| 1 | 第一代 2017-2018 Transformer [Attention/Multi-head/Scaled Dot-Product/Positional Encoding] | ✅ 正确 | 与论文机制一致 |
| 2 | 第二代 2018-2020 BERT/GPT-2 [Pre-training/MLM/Next Token Prediction] | ✅ 正确 | — |
| 3 | 第三代 2020-2022 GPT-3/Codex [In-context learning/Few-shot/Code generation] | ✅ 基本正确 | Codex 是 2021-07（OpenAI，微调自 GPT-3），补年代 |
| 4 | 第四代 2022-2024 LLaMA/GPT-4 [Open source/Tool use/Multimodal/Reasoning] | ❌ **两点错误** | ①「Open source」错（见上）；②「Reasoning」属 2024（o1），与 GPT-4 同代是时间错配。去掉「Open source」，把「Reasoning」移到推理代 |
| 5 | 第五代 2024-2026 o1/DeepSeek/Agent 2.0 [Chain-of-thought/Self-improvement/Multi-agent collaboration] | ❌ **多条臆测** | 「Agent 2.0」「Self-improvement」「Multi-agent collaboration」均无权威来源；「2026」未来年份不当。改为「推理模型代（2024）+ 开源权重代（2023–2025）」，删臆造项 |

### 7.2 结论

草稿的错误集中在：**一个年份硬错（LLaMA 2022）、一个表述硬错（"Open source"）、多处把「模型发布」与「能力上线」绑错（GPT-4 vs function calling）、以及整条 2026 行与"Agent 2.0 / Self-improvement / Multi-agent"是臆造。** 重做原则：**只保留有权威来源的事实；能力解锁注明「是先发布还是后上线」；未来不写进权威表。**

### 7.3 修正后的权威事实列表（LLM 发展历史，均已核实）

| 日期 | 事件 | 关键意义（对 agent 开发） | 出处 |
|---|---|---|---|
| 2017-06 | Transformer（"Attention Is All You Need"，Google，Vaswani 等 8 人，NeurIPS 2017） | 现代 LLM 架构起点：自注意力 + 多头 + 位置编码，可并行训练 | [arXiv 1706.03762](https://arxiv.org/abs/1706.03762)；[Wikipedia](https://en.wikipedia.org/wiki/Attention_Is_All_You_Need)（"presented June 12, 2017"） |
| 2018-10 | BERT（Google，Devlin 等，encoder-only，MLM + NSP 预训练） | 「预训练 + 微调」范式确立 | [arXiv 1810.04805](https://arxiv.org/abs/1810.04805)；[Wikipedia BERT](https://en.wikipedia.org/wiki/BERT_(language_model))（release Oct 31, 2018） |
| 2020-05 | GPT-3（OpenAI，175B，"Language Models are Few-Shot Learners"） | 上下文学习(in-context learning)/few-shot 涌现 | [arXiv 2005.14165](https://arxiv.org/abs/2005.14165)；[Wikipedia GPT-3](https://en.wikipedia.org/wiki/GPT-3)（publication May 29, 2020） |
| 2023-02 | LLaMA（Meta AI，研究用权重、随后泄流） | 开源权重竞赛起点；规模缩小也能打 | [Wikipedia Llama](https://en.wikipedia.org/wiki/LLaMA)（announced Feb 24, 2023；weights 仅 case-by-case 给研究者；2023-03-03 泄流） |
| 2023-03 | GPT-4（OpenAI，多模态 LLM） | agent 能力起点（含 32k 上下文版本） | [Wikipedia GPT-4](https://en.wikipedia.org/wiki/GPT-4)（release March 14, 2023；multimodal） |
| 2023-06 | OpenAI function calling API | 工具调用开始标准化，一切 agent 的协议地基 | OpenAI 官方 blog「Function calling and other API updates」（bot 抓取 403，but公开史实，月份级待复核精确日）；本仓 `notes/llm-timeline.md` 标 2023-06，一致 |
| 2023-07 | LLaMA 2（Meta + Microsoft，7/13/70B，开放可商用权重） | 真正「开放权重」节点（OSI 仍不认可称 open source） | [Wikipedia Llama](https://en.wikipedia.org/wiki/LLaMA)（July 18, 2023） |
| 2024-09 | OpenAI o1-preview / o1-mini | 推理模型开启：训练期大规模 RL + 推理期 chain-of-thought | [Wikipedia OpenAI o1](https://en.wikipedia.org/wiki/OpenAI_o1)（o1-preview/o1-mini Sept 12, 2024） |
| 2024-12 | OpenAI o1（正式版）/ DeepSeek-V3 | o1 正式开放；DeepSeek-V3（MoE 671B/37B 激活）开源权重追平闭源 | [Wikipedia OpenAI o1](https://en.wikipedia.org/wiki/OpenAI_o1)（full o1 Dec 5, 2024）；[arXiv 2412.19437](https://arxiv.org/abs/2412.19437)（DeepSeek-V3, submitted Dec 27, 2024） |
| 2025-01 | DeepSeek-R1 | 纯 RL 激发推理能力，开源权重推理模型，Nature 收录 | [arXiv 2501.12948](https://arxiv.org/abs/2501.12948)（submitted Jan 22, 2025；Nature 645:633–638, 2025） |

> 补充节点（公开史实，精确日期待复核，本 sprint 不写进数据、仅作教学参考）：2018 GPT-1 / 2019-02 GPT-2（"too dangerous" 分阶段发布）/ 2022-11 ChatGPT（RLHF 引爆）/ 2024-02 Gemini 1.5 Pro(1M 上下文) / 2024-05 GPT-4o(全模态)。这些若要进数据层，需先按同样标准逐条补 URL。

### 7.4 修正后的权威代际列表（LLM 演进过程）

| 代 | 时期 | 代表架构/模型 | 解锁能力（有出处的主张） |
|---|---|---|---|
| 一 | 2017–2018 | Transformer → BERT/GPT | 自注意力/多头/位置编码；预训练+微调范式 |
| 二 | 2019–2020 | GPT-2 → GPT-3 | 无监督预训练 scaling；上下文学习/few-shot 涌现 |
| 三 | 2021–2022 | Codex / ChatGPT(InstructGPT) | 代码生成；指令遵循 + RLHF 对齐 |
| 四 | 2023 | GPT-4（多模态）/ LLaMA·LLaMA 2（开源权重）/ function calling | 多模态；工具调用标准化；开源权重竞赛 |
| 五 | 2024–2025 | o1/o3（推理）、DeepSeek-V3/R1（开源推理）、Claude 3+ | 推理模型（chain-of-thought + RL）；开源权重追平闭源 |

---

## §8 给后续工程任务（数据层实现）的要点

> 下述契约是 wei 实现 `course-structure.ts` / `llm-history.ts` / `nav.astro` 的**唯一输入**；改动编排必须先改本文件，再改代码。

### 8.1 数据契约 `COURSE_STRUCTURE`（重建 `course-structure.ts`）

```ts
// 语义：17 项，顺序即 §3 线性序（order 从该数组 index 派生，不必显式存）
export interface CourseStructureItem {
  slug: string;            // 课程页 slug（与 courses.ts / notes 同名）
  stage: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';   // 严格 5 档，无 0.5/无 '—'
  domain: string;          // 知识域规范名（取自 knowledge-map 命名总表）
  title: string;           // 一句话标题（可另起，用于导航卡）
  prereqs: string[];       // 前置课程 slug（⊆ 更早 order 的 slug，§2 已校验）
  next: string[];          // 线性后继（0 或 1 个 slug；上下篇）= §2「next」
  mvpSlug: string;         // §4 词表内的 slug，映射闭合
  prerequisiteNote: string;// 前置知识一句话；无则 '—'（§2/§5）
  mvpStatus: 'done' | 'planned' | 'asset'; // done=可运行 demo / planned=规划 / asset=非代码或横向
  isHorizontal: boolean;   // 仅 llm-timeline / industry-2026 为 true（横向双定位）
}
```

- **单一真源**：`courses.ts` 的 `phase` 字段迁移为 `stage`（P0–P4 五档），`—` 不再作为课程 stage；`llm-timeline` 改 P0、`industry-2026` 改 P4。
- **派生量收敛**：`COURSE_COUNT=17`（不含 whiteboard）；`PHASE_COUNTS` 按五档重算（P0:5/P1:4/P2:3/P3:3/P4:2）；`DOMAIN_COUNT` 仍守 knowledge-map 冻结口径（15），不受本次 stage 重排影响（因为 llm-timeline/industry-2026 本就不计入门数）。
- **导航**：上下篇用线性序 index（`prev=order-1`、`next=order+1`），不要用 `next` 字段重算序列。

### 8.2 数据契约 `LLM_HISTORY` / `LLM_EVOLUTION`（重建 `llm-history.ts`）

- 以 §7.3 / §7.4 为唯一内容源，**删除全部臆造项**（"Agent 2.0"、"Self-improvement"、"Multi-agent collaboration"、"2026 Next-gen"）。
- 每条事实带 `source`（URL）字段；「月份级待复核」的事实带 `verified: 'month'` 与说明，不得标成已核实。
- `LLM_HISTORY` 关键字段：`date`（如 `2017-06`）、`name`、`org`、`significance`、`source`。
- 演进代际严格按 §7.4，去掉「Open source」「Reasoning 错代」两处错。

### 8.3 `nav.astro` 重建要点

- 页面定位：**「LLM 发展史与演进」横向知识导航页**，站点导航中位于 P0 之前。
- 内容两段：① LLM 历史 + 演进（读 `llm-history.ts`，深度链接到 `/c/llm-timeline`）；② 五阶段课程地图（读 `course-structure.ts`，按 stage 分组五卡）。
- 消除旧的双入口残缺问题（原 `/timeline` 与 `/c/llm-timeline` 双残版本）：`llm-timeline` 保留课程页为深度正文，`nav` 页为总览并链接过去，不复刻残缺副本。
- 现有站点「32 html」口径：nav 若作为**新静态页**（如 `/nav/`）会使静态页 6→7、总数 32→33；**实现时须同步 knowledge-map 计数口径块**（按纪律「改计数只改口径块 + 生成器，别处只引用」）。

### 8.4 边界与范围

- 本次 sprint 只深度填充「LLM 历史 + 演进」与「P0 基础篇」；P1–P4 只做 stage/prereqs/next/mvpSlug 元数据落地，正文深度留待后续。
- 本文件不改动任何 notes 课程正文与 `courses.ts` 的 `intro/interviewAngle/relatedQuestions`（那是后续填充任务）；只在其上叠加 stage 重排与结构字段。

---

## §9 自洽性自检清单（交付时逐条通过）

- [x] 17 个课程页条目全部出现在 §2 主表，无遗漏、无重复。
- [x] stage 仅含 P0/P1/P2/P3/P4 五档，无 0.5 / 无 `—` 当课程阶段用。
- [x] 每行 `prereqs` 引用的 slug 均在其更早 `#`（拓扑序成立）。
- [x] 每行 `next` = `#+1`（末课 `[]`），上下篇顺序唯一确定。
- [x] 每行 `mvpSlug` 均落在 §4.1 词表，§4.2 映射与 §2 主表逐行一致（映射闭合）。
- [x] P0 首课 0 经验可读（`llm-timeline` 序章），实践起点为 `harness-from-scratch`（从零写）；P4 收口 `framework-ecosystem` + `industry-2026`（可独立开发完整 agent 工具 + 前沿视野）。
- [x] LLM 事实核查：已核实的全部附 URL+日期；臆测项已删除并逐条标注原草稿错误。

---

## §10 已完成范围 / 待后续 sprint 项（t5 终审追加）

> 本节是 sprint 收口的边界声明：明确「本次做完了什么」与「P1–P4 深度内容还欠什么」，供用户与后续 sprint 对齐预期。

### 10.1 本次 sprint 已完成（t1–t5）

- **结构**：五阶段 P0–P4 全站落地，17 课 prereqs/next/MVP/前置知识四层闭合，无 0.5 中间态。
- **数据层**：`course-structure.ts`（17 项五档 + 教学三字段）、`llm-history.ts`（10 节点 + 5 代权威事实）、`mvps.ts`（13 slug 三态）——单一真源，构建 + 运行时断言通过。
- **页面**：`nav.astro`（LLM 历史/演进横向导航页 + 五阶段地图，位于 P0 之前）、`learn.astro`（五阶段 + MVP 学习路线）、`c/[slug].astro`（学习路径模块：前置/教学/输出/后续）、首页 + Header 导航入口。
- **教学化（t5）**：LLM 历史 10 节点各补 2–4 句「为什么重要 / 解决了什么问题」+ 课程挂钩（`summary`/`connectsTo`）；演进 5 代各补一段「首尾承接」+ 课程挂钩（`transition`/`connectsTo`）；P0 五课的「前置知识」与「MVP 定位」（交付对象 + clone 判据 + 复用关系）落到 `course-structure.ts`。
- **事实核查**：LLM 时间点（Transformer/BERT/GPT-3/GPT-4/function calling/o1/LLaMA/LLaMA 2/DeepSeek-V3/R1）已 web 核实并附 URL+日期；原草稿错误与臆测项全部删除。

### 10.2 待后续 sprint 项（本次明确不做）

1. **P1–P4 深度内容**：P1（沙箱/MCP/评测/多智能体）、P2（durable/API/可观测）、P3（长期记忆/数据飞轮/模型基础）、P4（框架生态/行业前线）的正文教学化（逐节代码 + 讲解、每课前置知识段、MVP 实跑判据）尚未展开——本次只做到 stage/prereqs/next/mvpSlug/teachingFocus/practicalOutput 元数据就位，正文沿用既有 notes，未做「代码 + 讲解」重写。
2. **P0 正文终稿**：`harness-from-scratch`/`agent-harness`/`rag`/`system-design` 的课程笔记仍沿用既有讲义，未重写为「教学型（代码 + 讲解）」终稿；本次只在 course-structure 元数据层补了前置知识与 MVP 定位。
3. **三个「规划」MVP**：`api-mvp` / `flywheel-mvp` / `model-basics-mvp` 无独立可运行 demo，需后续 sprint 从零建。
4. **其余横向知识面**（§6.2）：安全总览 / 可观测汇总 / 成本经济学 / 评测对齐横向视图 / 开源生态版图——仅列清单，未填充。
5. **时点事实补漏**：function calling 精确日（2023-06，月份级）仍待抓一手源补精确日；GPT-2 / ChatGPT / GPT-4o / Claude 3 等补充节点尚未纳入数据层（见 §7.3 备注）。
6. **`courses.ts` 口径收口**：`courses.ts` 的 `phase` 仍是旧三档（P0/P1/P2 + `—`），与 `course-structure.ts` 的五档并存；站点消费方已统一改走 course-structure（t4），但 courses.ts 的 `phase` 字段本身尚未迁移/删除，属遗留债务，建议后续统一收口为单一真源。

### 10.3 终审结论（t5 执行）

- **全站核对**：17 课无遗漏、五档无 0.5、prereqs 全部指向更早序（无环）、next=序+1（上下篇自洽）、MVP 映射闭合（13 slug）、STAGE_COUNTS=P0:5/P1:4/P2:3/P3:3/P4:2——全部通过代码断言（esbuild bundle + node 运行时校验）。
- **事实抽查**（与一手源/仓库实测一致，无就地需改事项）：LLaMA=2023-02（非 2022）、GPT-4=2023-03 且 function calling=2023-06 已拆分、DeepSeek-R1=2025-01、压缩 1378→426 tokens（harness-demo test-compact.ts `summarized===3`）、recall@3=0.31（132 chunks，PASS 3/8，rag-demo）。
- **MVP 口径**：6 个可运行作品（harness/rag/sandbox/mcp/durable/framework）+ `memory-redteam`（回归套件，不计作品数）+ 13 MVP slug（含 2 横向 asset、3 规划）两套口径并存、互不冲突，与 knowledge-map 冻结口径一致。

---

## §11 构建验收与一致性终审（t6）

> 本节是把「构建命令原文 + 结果 + 一致性抽查 + 就地修复 + 遗留」落成可复验记录。所有数值均可从下方引用的日志/命令复跑。

### 11.1 构建命令与证据

仓库 `site/package.json` 的构建入口是 `"build": "bash build.sh"`（依赖 `capped` 包装、MemoryMax 1.8G）。本沙箱 `capped` 不可用（`passwordless sudo unavailable - running WITHOUT caps: nice: a command must be given with an adjustment`），故退回仓库原生 `build:fast`（=`astro build`）并显式设堆上限——与原 `build.sh` 内 `NODE_OPTIONS=--max-old-space-size=1024` 一致：

```bash
cd site && NODE_OPTIONS="--max-old-space-size=1024" npm run build:fast > /tmp/astro-build-t6b.log 2>&1; echo "EXIT=$?" >> /tmp/astro-build-t6b.log
```

结果日志：`/tmp/astro-build-t6b.log`（两段式，如实区分）：

- ✅ **服务端编译通过（零编译 / 零类型错误）**：`17:53:34 [vite] ✓ built in 3.42s` → `[build] ✓ Completed in 3.47s`（`Building static entrypoints`）。该阶段编译全部 `.astro` + `.ts`（nav / learn / c-[slug] / index / Header + 三数据层），并把改动正确产入 `dist/`。已 grep 实证：`dist/pages/index.astro.mjs` 含「P0–P4 五阶段 × 17 课线性阅读序」且旧「P0 / P1 / P2 三段」已无；`dist/pages/nav.astro.mjs` 含 10 历史日期 + summary/transition/connectsTo 教学文案；`dist/chunks/courses_*.mjs` 含 `site-refactor-plan` 路由排除项。
- ⛔️ **HTML 渲染阶段被本沙箱环境卡死（留 CI / 浏览器目检）**：自 `[build] building client (vite)` 起停在 `17:53:34 [vite] transforming...`，12+ 分钟无进展，`dist/*.html` 恒为 0。归因：本机 2 vCPU / 3.4G RAM，逐页渲染 17 篇 30–48KB markdown（shiki + KaTeX）时 swap 打满（1592/2047MB）、进程长期 `Dl`（不可中断换页）；属环境资源约束而非代码缺陷（同命令在 `capped` 可用环境 t2–t4 均 exit 0 / 34 页；t5 已记录同等现象）。

### 11.2 一致性抽查（代码断言，exit 0，全部通过）

跨 courses.ts / course-structure.ts / mvps.ts / llm-history.ts / notes/*.md 五源核对，命令：

```bash
cd site && ./node_modules/.bin/esbuild verify-t6.mjs --bundle --format=esm --platform=node --outfile=/tmp/verify-t6.bundle.mjs && node /tmp/verify-t6.bundle.mjs
```

断言逐条 ✓：
1. `course-structure` `COURSE_COUNT=17` == `courses.ts` `COURSE_COUNT=17`。
2. `STAGES` 五档、`STAGE_COUNTS={P0:5,P1:4,P2:3,P3:3,P4:2}`。
3. courses.ts 课程卡（去 whiteboard）17 slug == course-structure 17 slug（单一真源不漂移）。
4. `notes/*.md=20` − `EXCLUDED{knowledge-map, interview-bank, site-refactor-plan}` = 17 路由课程页 == course-structure 17 slug（修正 site-refactor-plan 外泄）。
5. `MVP=13`，17 课 `mvpSlug` 全闭合、`mvpStatusOf` 可解析。
6. `LLM_HISTORY=10`、`LLM_EVOLUTION=5`。
7. 17 课 `prereqs` 全部指向更早序（拓扑无环）、`next=序+1`。

### 11.3 本次就地修复（3 处，已修 + 经编译产物验证）

1. `site/src/data/courses.ts` — `EXCLUDED_FROM_COURSE_ROUTE` 追加 `'site-refactor-plan'`：修复方案文档被 content collection（`notes/*.md` glob）当课程、外泄 `/c/site-refactor-plan/` 路由的问题（正是「17→18 页」漂移根源）。
2. `site/src/data/courses.ts` — `PHASE_COUNTS` 注释改标 `@deprecated`：原注释「与 /learn 的 phase-section 一一对应」已失真（/learn 现走五档 `STAGE_COUNTS`），就地划改防后续手抄漂移。
3. `site/src/pages/index.astro` — 首页 footer 学习路线文案「P0 / P1 / P2 三段 × 知识域卡片」→「P0–P4 五阶段 × 17 课线性阅读序」（旧三段文案清零）。

### 11.4 遗留事项与留浏览器目检

- **必须 CI 复验**：在内存充足 / `capped` 可用环境跑全量 `bash build.sh`（含 pagefind），确认 `dist/` 产出 34 页、`/nav`、`/learn`、各 `/c/<slug>/` 学习路径模块成品 HTML、页面无 `undefined` 残留——本沙箱无法完成 HTML 渲染，此三项属「留 CI 构建复验 + 浏览器目检」，不得以 HTTP 200 或编译产物冒充页面正确。
- **「duplicate id site-refactor-plan」glob 告警**：首次 build 出现、重 build 已自愈（Astro content-store 缓存残留），非数据重复（已断言 notes/*.md=20 唯一）；且 §11.3-1 的 EXCLUDED 已兜底路由，该告警不阻断 CI。
- **P1–P4 正文深度内容**：仍未被塞成教学型「代码+讲解」，属 §10.2 明确待办（已核：3 个规划 MVP 目录不存在、P1–P4 notes mtime 未变、未越界）。

> 注：上一条是 t6 时点的记录；sprint 2（t7–t11）已收口其中 P1+P2 七课（见 §12），剩余 P3+P4 五课仍留 sprint 3。

## §12 sprint 2 验收与一致性终审（t12）

> 本节把 sprint 2（P1+P2 深度 + api-mvp 落地）的构建命令原文 + 一致性终验 + 正确性抽查 + 遗留落成可复验记录。

### 12.1 构建命令与证据

（同 §11.1 口径：本沙箱 `capped` 不可用，退回仓库原生 `build:fast` 并显式设堆上限；`timeout 120` 兜底防 HTML 阶段无限卡死。）

```bash
cd site && NODE_OPTIONS="--max-old-space-size=1024" timeout 120 npm run build:fast > /tmp/astro-build-t12.log 2>&1; echo "EXIT=$?" >> /tmp/astro-build-t12.log
```

结果日志：`/tmp/astro-build-t12.log`（两段式，如实区分）：

- ✅ **服务端编译通过（零编译 / 零类型错误）**：`19:54:07 [vite] ✓ built in 3.49s` → `[build] ✓ Completed in 3.55s`（`Building static entrypoints`）。该阶段编译全部 `.astro` + `.ts`（nav / learn / c-[slug] / index / Header + course-structure/courses/mvps/llm-history 四数据层），并把 sprint 2 改动正确产入 `dist/`。
- ⛔️ **HTML 渲染阶段被本沙箱环境卡死（留 CI / 浏览器目检）**：自 `[build] building client (vite)` 起停在 `19:54:07 [vite] transforming...`，`timeout 120` 触发（EXIT=124），`dist/*.html` 恒为 0。归因同 §11.1：本机 2 vCPU / 3.4G RAM，逐页渲染 22 篇 markdown（shiki + KaTeX）时 swap 打满、进程不可中断换页；属环境资源约束而非代码缺陷。
- **WARN「Duplicate id」= t6 §11.4-2 同现象，非真实重复**：8 个本 sprint 编辑的 note（api-engineering / durable-execution / evaluation / mcp / multi-agent / observability / sandbox / site-refactor-plan）首次 build 各报一次 glob-loader 缓存残留告警（内容-store 缓存 + 新条目首同步）；WARN 不阻断 `✓ built`，且一致性断言已证 `notes/*.md=22` 唯一、无真实重复。

### 12.2 一致性终验（esbuild bundle + node 断言，exit 0 全过）

（脚本 `verify-t12.mjs` 临时建、跑通、已清理；断言语义固化如下，可随时重建复跑。）

1. `COURSE_COUNT=17`、`STAGE_COUNTS={P0:5,P1:4,P2:3,P3:3,P4:2}`。
2. `MVPS=13`；`api-mvp=done`（t11 落地）、`flywheel-mvp` / `model-basics-mvp` 仍 `planned`（本 sprint 未越界）；17 课 `mvpSlug` 全闭合。
3. P1+P2 共 7 课（sandbox / mcp / evaluation / multi-agent / durable-execution / api-engineering / observability）`prerequisiteNote` 含「上一课」承接句 + `practicalOutput` 含 clone 判据（`npm run demo` / `demo:`）＝已精化。
4. P3+P4 共 5 课（long-term-memory / data-flywheel / model-basics / framework-ecosystem / industry-2026）`prerequisiteNote` 仍简短（无「上一课」）+ `practicalOutput` 无 clone 判据＝未越界精化。
5. `teaching-style-guide.md` 就位；`notes/*.md=22` − `EXCLUDED{knowledge-map, interview-bank, site-refactor-plan, teaching-style-guide, api-mvp-spec}` = 17 路由课程页 == course-structure 17 slug。
6. 17 课 `prereqs` 拓扑无环、`next=序+1`；`courses.ts`（去 whiteboard）17 slug == course-structure 17 slug；`LLM_HISTORY=10`、`LLM_EVOLUTION=5`。
7. `npx tsc --noEmit` exit 0（无类型破坏）。

### 12.3 内容正确性抽查（4 处，均与一手源 / 源码一致，无错误需划改）

1. **sandbox 四通道**：`sandbox-demo/src/types.ts:13` `CHANNEL_PRIORITY = ["deny","approve","sandbox","allow"]` ✓（与 notes/sandbox.md §S2 一致）。
2. **mcp 四层防御消融**：`mcp-demo/src/defense.ts` `sanitizeToolOutput`(L1) / `classifyTool`(L2) / `EgressGate`(L3) / `AuditLog`(L4) + `agent.ts` 四层可开关消融 ✓。
3. **durable-execution 副作用计数恒=1**：`durable-execution-demo/src/demo.ts:65`「3 种崩溃点 × 各 3 次，副作用计数恒=1」+ 子进程 `SIGKILL` 真实自杀 ✓。
4. **api-engineering 重试分类（4xx 不盲重试）**：`api-demo/src/retry.ts:3`「4xx（契约违约）不重试；429 / 5xx / timeout / eof 指数退避 + jitter」+ `classify(400)` ✓。

### 12.4 遗留事项（sprint 3）与留 CI / 浏览器目检

- **留 CI 复验 34 页 HTML + 浏览器目检**：本沙箱 HTML 渲染卡死，须在内存充足 / `capped` 可用环境跑全量 `bash build.sh`（含 pagefind），确认 `dist/` 34 页、`/nav`、`/learn`、各 `/c/<slug>/` 成品 HTML、页面无 `undefined` 残留——不得以 HTTP 200 或编译产物冒充页面正确（同 §11.4）。
- **P3+P4 五课深度**（long-term-memory / data-flywheel / framework-ecosystem / model-basics / industry-2026）仍为简短版，未做「代码+讲解」教学化，留 sprint 3。
- **flywheel-mvp / model-basics-mvp**（data-flywheel / model-basics 两课独占 MVP）仍 `planned`，留 sprint 3 建 demo。
- **P0 正文终稿**：P0 五课 sprint 1 已深度填充，但「正文终稿」复审未再动，留 sprint 3 统一收口。
- **courses.ts `PHASE_COUNTS` 口径收口**：已标 `@deprecated`（t6 §11.3-2），/learn 的 phase-section 与五档 `STAGE_COUNTS` 的最终统一留在 sprint 3。

> 注：§12.4 的「P3+P4 五课深度」「flywheel-mvp / model-basics-mvp 建 demo」「PHASE_COUNTS 口径收口」三项已在本 sprint 3 收口（见 §13）；「留 CI 复验 34 页」「P0 正文终稿」「DomainMap 三档→五档」仍滚动到 §13.5。

## §13 sprint 3 验收与一致性终审（t18）

> 本节把 sprint 3（P3+P4 五课深度 + flywheel-mvp + model-basics-mvp + courses.ts 口径收口）的构建命令原文 + 一致性终验 + 正确性抽查 + 收口结论 + 遗留落成可复验记录。

### 13.1 构建命令与证据

（同 §11.1 / §12.1 口径：本沙箱 `capped` 不可用，退回仓库原生 `build:fast` + 堆上限 + `timeout 120` 兜底。）

```bash
cd site && NODE_OPTIONS="--max-old-space-size=1024" timeout 120 npm run build:fast > /tmp/astro-build-t18.log 2>&1; echo "EXIT=$?" >> /tmp/astro-build-t18.log
```

结果日志：`/tmp/astro-build-t18.log`（两段式，如实区分）：

- ✅ **服务端编译通过（零编译 / 零类型错误）**：`21:08:42 [vite] ✓ built in 3.90s` → `[build] ✓ Completed in 3.97s`（`Building static entrypoints`）。特别确认：本任务删除 courses.ts 的 `PHASE_COUNTS` 后，服务端 entrypoints 编译仍零错误，sprint 3 改动正确产入 `dist/`。
- ⛔️ **HTML 渲染阶段被本沙箱环境卡死（留 CI / 浏览器目检）**：自 `[build] building client (vite)` 起停在 `21:08:42 [vite] transforming...`，`timeout 120` 触发（EXIT=124），`dist/*.html` 恒为 0。归因同 §11.1 / §12.1：本机 2 vCPU / 3.4G RAM，逐页渲染 24 篇 markdown（shiki + KaTeX）时 swap 打满、不可中断换页；环境资源约束而非代码缺陷。
- **WARN「Duplicate id」= t6 §11.4-2 / t12 §12.1 同现象**：本 sprint 编辑的 note（industry-2026 / long-term-memory / model-basics / site-refactor-plan 等）首次 build 各报一次 glob-loader 缓存残留告警；WARN 不阻断 `✓ built`，一致性断言已证 `notes/*.md=24` 唯一、无真实重复。

### 13.2 一致性终验（esbuild bundle + node 断言，exit 0 全过）

1. `COURSE_COUNT=17`、`STAGE_COUNTS={P0:5,P1:4,P2:3,P3:3,P4:2}`、17 课 `prereqs` 拓扑无环、`next=序+1`、industry-2026 为链尾。
2. **MVP 三态最终盘点**：13 slug = **11 done / 0 planned / 2 asset**——api / flywheel / model-basics 三个规划态已全部落地（t10 / t16 / t17）；llm-history / industry-research 两项横向 `asset`；无 `planned` 残留，17 课 `mvpSlug` 全闭合。
3. 17 课全精化：P0 用「0 经验」短式、P1–P4 用「上一课 / 无硬前置」承接；`practicalOutput` 全三件套；data-flywheel / model-basics 的「规划态·由下游实现」已就地回填 clean（无残留）。
4. `teaching-style-guide.md` / `flywheel-mvp-spec.md` / `model-basics-mvp-spec.md` 三份 process 文档就位且在 EXCLUDED；`notes/*.md=24` − EXCLUDED(7) = 17 路由页 == course-structure 17 slug。
5. `LLM_HISTORY=10`、`LLM_EVOLUTION=5`；`courses.ts`（去 whiteboard）17 slug == course-structure 17 slug；`npx tsc --noEmit` exit 0（含删 `PHASE_COUNTS` 后零破坏，全部断言 exit 0）。

### 13.3 正确性抽查（3 处实跑 exit 0 + 1 处源码/原文核对，均一致）

1. **memory-redteam 16/16**：`node test.mjs` exit 0 + 末尾 `16/16 条探针守住`（单元 R1-R11 + 端到端 E1-E5）。
2. **flywheel-demo 脱敏闭环**：`npm run demo` exit 0 + `✅ flywheel 验收通过：四模块 10 条断言全绿 + 两轮消融走查通过`（禁 auto-apply 全程无自动合入态）。
3. **model-basics-demo 成本走查**：`npm run demo` exit 0 + `✅ model-basics 验收通过：四模块断言全绿`（KV 8GB → 前缀 miss 1.00s vs 命中 0.063s）。
4. **framework-demo allowedTools 抢跑 + industry-2026 截断**：`capabilities.ts:49-56` 注释「allowedTools 裸名会抢在 canUseTool 之前 auto-approve」+ `canUseTool` deny rm 正则（源码核对）；`industry-2026.md` U-26 台账截断点「2026-10-13 复核」（原文核对）。无错误需划改。

### 13.4 courses.ts phase 口径收口结论

- **`PHASE_COUNTS`（旧三档）已就地删除**：grep 全 `src` 确认无消费方（仅定义处），删除后 `tsc --noEmit` 与 build 服务端编译均零错误；五阶段计数单一真源归 `course-structure.ts` 的 `STAGE_COUNTS`。
- **`phase` 字段仍保留（有 3 个消费方，不强行删破坏构建）**：① `DomainMap.astro`（三档 legacy 分组 `PHASE_ORDER=['P0','P1','P2']`）② `c/[slug].astro:61`（`meta.phase === '—'` 兜底 chip）③ `courses.ts` `DOMAIN_COUNT` 过滤（`c.phase !== HORIZONTAL_PHASE`）。
- **待办（非本 sprint 范围）**：`DomainMap.astro` 三档→五档迁移属 UI 迁移，涉视觉目检，留待后续；迁移完成后 `phase` 字段与 `HORIZONTAL_PHASE` 才可进一步取舍。

### 13.5 遗留事项（sprint 4）与留 CI / 浏览器目检

- **留 CI 复验 34 页 HTML + 浏览器目检**：本沙箱 HTML 渲染卡死，须在内存充足 / `capped` 可用环境跑全量 `bash build.sh`（含 pagefind），确认 `dist/` 34 页、`/nav`、`/learn`、各 `/c/<slug>/` 成品 HTML、页面无 `undefined` 残留——不得以 HTTP 200 或编译产物冒充页面正确（同 §11.4 / §12.4）。
- **P0 正文终稿统一复审**：P0 五课 sprint 1 已深度填充，但「正文终稿」复审未再动，留 sprint 4。
- **DomainMap.astro 三档→五档迁移 + `phase`/`HORIZONTAL_PHASE` 后续取舍**（见 §13.4 待办）。
- **courses.ts 其余派生口径**（`STATUS_COUNTS` / `PHASE_*` 相关残留）：本任务只收口 `PHASE_COUNTS`，未越界动其他导出；若后续有迁移，一并评估。

## §14 sprint 4 验收与终审（t23）

> 本节把 sprint 4（增量主线蓝图 + M0 范例 + 站点呈现）的改动清单 + 一致性终验 + M0 两态实跑证据 + 构建证据 + 遗留落成可复验记录。

### 14.1 改动文件清单（t19–t22，sprint 4 四任务）

| 任务 | 改动 |
|---|---|
| t19 主线蓝图与施工规范 | `notes/capstone-blueprint.md` + `notes/capstone-style-guide.md` + `notes/capstone-site-render-checklist.md`（新·3 份设计文档）；`site/src/data/courses.ts`（EXCLUDED 7→10） |
| t20 M0 练习设计 | `notes/capstone-m0-exercise.md` + `notes/capstone-m0-structure.md`（新·2 份）；`site/src/data/courses.ts`（EXCLUDED 10→12） |
| t21 M0 代码骨架 | `my-agent/` 13 文件新建（package.json/tsconfig/README/assert/m0.assert.ts/exercises/m0/{starter,solution}/{types,model,tools,loop}.ts）；按任务未动 mvps.ts / course-structure.ts |
| t22 站点呈现主线 | `site/src/data/capstone.ts`（新）；`site/src/pages/learn.astro` + `site/src/pages/c/[slug].astro` + `site/src/data/course-structure.ts`（新增 `capstoneHook?` 字段，17 课填实） |

### 14.2 主线蓝图要点（capstone）

- 主线项目 `my-agent`：学员从零逐步增建、最终 = 多工具/多轮/带权限沙箱/可观测/可评测/可恢复/有记忆的完整工具；TS + tsx 全离线零 key 确定性。
- 5 milestone（M0–M4）对应 P0–P4：M0 最小 loop（P0）；M1 多工具+会话+压缩（P0）；M2 沙箱+MCP+评测（P1）；M3 durable+路由+可观测（P2）；M4 记忆+飞轮+模型意识（P3+P4，跨两阶段）。
- 17 独立 demo 降格为「参考样本（reference）」，主线是「你要搭的（your build）」，只做定位转换不改 demo 正确性 / mvps.ts 三态 / 五阶段结构 / 17 课正文。
- 练习闭环：`m<N>/starter`（半成品挖 TODO，`TODOError('m<N>.<k>')` 占位）→ 补全 → `m<N>/solution`（参考答案）；断言三态「确定性 / 可机器核对 / 可重放」+ 半成品三分（starter 红→补全绿→solution 绿）；真增建证据 = `m<N>/solution` == `m<N+1>/starter` 字节一致 + `git tag m0..m4` 渐进快照。

### 14.3 M0 范例两态实跑证据（练习闭环生命线，亲自核验）

```bash
cd my-agent
npm run assert:m0            # 未补 TODO：3 条 ❌ + ❌ m0 验收通过，exit 1
npm run assert:m0:solution   # 参考答案：3 条 ✅ + ✅ m0 验收通过，exit 0
npm run demo                 # starter 未补：❌ 仍有 TODO 未完成 + 位置提示，exit 1
npx tsx exercises/m0/solution/loop.ts   # solution：打印最终回答 + ✅ m0 demo 通过，exit 0
```

实跑结果（本终审 t23 亲自跑，非引报告）：
- `assert:m0`（starter）→ `❌ m0.1 解析判别 / ❌ m0.2 执行回填 / ❌ m0.3 loop 收口`（逐条列出 TODO 位置）+ `❌ m0 验收通过（3 条未过）`，**exit 1**。
- `assert:m0:solution` → `✅ m0.1 / ✅ m0.2 / ✅ m0.3` + `✅ m0 验收通过`，**exit 0**。
- `npm run demo`（starter）→ `❌ 仍有 TODO 未完成：m0.3…` + `请补全 exercises/m0/ 下 loop.ts 的对应 TODO`，**exit 1**（非静默崩）。
- `npx tsx exercises/m0/solution/loop.ts` → `notes/hello.txt 的内容是：hello from my-agent` + `✅ m0 demo 通过`，**exit 0**。

两态（未补「红 exit 1」/ 完整「绿 exit 0」）真实成立，是练习闭环的生命线，非只信报告。

### 14.4 一致性终验（esbuild bundle + node 断言，exit 0 全过）

1. 现有结构零破坏：`COURSE_COUNT=17`、`STAGE_COUNTS={P0:5,P1:4,P2:3,P3:3,P4:2}`、17 课 prereqs 拓扑无环、`next=序+1`、`industry-2026` 链尾；MVP 三态 13=**11 done / 0 planned / 2 asset**（sprint 4 未动 mvps.ts 词表）。
2. **capstone 主线自洽**：`capstone.ts` 5 milestone 键 `m0..m4`、阶段序 `P0,P0,P1,P2,P3`、必修课全可解析；17 课 `capstoneHook` 全非空（无 undefined）；`M<k>` 双向一致——唯一跨 milestone 课是 `harness-from-scratch`（blueprint §3 明确同时供 **M0 前段** loop/工具协议 + **M1 后段** 恢复/压缩/多工具）；`capstoneHook` 单值取 M0（主 hook），M1 关系由 `MILESTONES.m1.courses` 承担，非漂移。
3. **三份主线设计文档自洽**：`capstone-blueprint` / `capstone-style-guide` / `capstone-m0-exercise` 的 m0–m4 键 + 五命名（minimal-loop/multi-tool-session/sandbox-mcp-eval/durable-api-obs/memory-flywheel-model）+ `my-agent` / `exercises/` / `TODOError` / `assert/` 路径一致，无 `src↔lib` 漂移。
4. 5 份 capstone 设计文档均 EXCLUDED，`notes/*.md=29` − EXCLUDED(12) = 17 路由页 == course-structure 17 slug。
5. `npx tsc --noEmit` exit 0（含 `capstone.ts` / `capstoneHook` 字段引入后零类型错误）。

> **字段名提示**：任务描述写「若新增 `mainlineMilestone` 字段」，实际字段名为 `capstoneHook?`（t22 落地，语义 = 本课给 `my-agent` 哪个 milestone 供什么机制）。二者指同一机制；终审按实际 `capstoneHook` 核对，17 课映射与蓝图 §3 一致、无 undefined。

### 14.5 构建验证（诚实两段式，沿 §11/§12/§13 口径）

```bash
cd site && NODE_OPTIONS="--max-old-space-size=1024" timeout 120 npm run build:fast > /tmp/astro-build-t23.log 2>&1; echo "EXIT=$?" >> /tmp/astro-build-t23.log
```

结果日志：`/tmp/astro-build-t23.log`（两段式）：

- ✅ **服务端编译通过（零编译 / 零类型错误）**：`22:38:02 [vite] ✓ built in 3.26s` → `22:38:02 [build] ✓ Completed in 3.34s`（`Building static entrypoints`），sprint 4 四任务改动（learn 主线入口 / demo→参考定位话术 / 课程页主线挂钩 / `capstone.ts` + `capstoneHook` 字段）正确产入 `dist/`，服务端零错误。
- ⛔️ **HTML 渲染阶段仍被本沙箱环境卡死（留 CI / 浏览器目检）**：自 `[build] building client (vite)` 起停在 `[vite] transforming...`，`timeout 120` 触发（EXIT=124），`dist/*.html=0`。归因同 §11.1 / §12.1 / §13.1：本机 2 vCPU / 3.4G RAM，逐页渲染时 swap 打满、不可中断换页；环境资源约束而非代码缺陷，不冒充全绿。

### 14.6 遗留事项（sprint 5 及之后）

- **M1–M4 里程碑实现留 sprint 5**：M1 multi-tool-session / M2 sandbox-mcp-eval / M3 durable-api-obs / M4 memory-flywheel-model 的 `starter`/`solution` + 断言均「building」，留后续任务按蓝图 §3 逐 milestone 增建；落地时只需把 `m.stage/status` 翻 done、补 `assertCmd` 真实可达，`capstone.ts` 映射表与 `course-structure.ts` 的 `capstoneHook` 已完成双向断言、不必再动。
- **P0 正文终稿统一复审**：sprint 1 已深度填充，正文终稿复审留 sprint 5（沿 §12.4 / §13.5）。
- **留 CI 复验 34 页 HTML + 浏览器目检**：本沙箱 HTML 渲染卡死，须在内存充足 / `capped` 环境跑全量 `bash build.sh`（含 pagefind）；新增目检项——learn 页 capstone section 5 卡视觉、c/[slug] 五格 lp-grid（前置/教学重点/实际输出/主线挂钩/后续）换行、`my-agent` README + `npm run demo` 浏览器视角。
- **`capstoneHook` 跨 milestone 单值局限**：`harness-from-scratch` 同时供 M0/M1，单值 `capstoneHook` 只落主 hook（M0）；若后续需要 M1 关系显式可见，再评估加 `capstoneHooks?: string[]`（非本 sprint 范围，现设计已可读且与蓝图一致）。

---

## §15 sprint 5 验收与终审（t32）—— 增量主线整体收口

> sprint 5 = t24–t32：M1–M4 里程碑设计（alex，t24/t26/t28/t30）与实现（wei，t25/t27/t29/t31）+ 本终审（alex，t32）。收口后增量主线 `my-agent` 从「M0 试点」成为「五 milestone 完整」的课程动手闭环主线。

### 15.1 改动文件清单（sprint 5 九任务）

| 任务 | 产物 |
|---|---|
| t24/t26/t28/t30（设计） | `notes/capstone-m1/m2/m3/m4-exercise.md` + `notes/capstone-m1/m2/m3/m4-structure.md`（8 份）；`site/src/data/courses.ts` EXCLUDED 12→20（逐次追加 8 项设计文档） |
| t25/t27/t29/t31（实现） | `my-agent/exercises/m1/m2/m3/m4/{starter,solution}/` 各 milestone 源文件 + `my-agent/assert/m1/m2/m3/m4.assert.ts` + `my-agent/package.json` scripts增量 + `my-agent/README.md` 七段；`site/src/data/capstone.ts` m1–m4 status 翻 done |
| t32（终审） | `site/verify-t32.mjs`（临时校验，已删）；本 §15 |

### 15.2 M0–M4 串链证据（真·增建，脚本核验 diff 空）

逐级脚本核验（esbuild bundle + node，exit 0），proves「学员复用自己上一级 solution 的代码」：

| 边界 | 给全继承（逐字节 diff 空） | 升级（types/model/loop/tools/policy 剪除处） | 新增 |
|---|---|---|---|
| M1 ← M0 | 0 文件 | loop/model/tools/types（4） | session/compress/policy（3） |
| M2 ← M1 | compress/session/tools（3） | loop/model/policy/types（4） | eval/golden/mcp/sandbox（4） |
| M3 ← M2 | compress/eval/golden/mcp/policy/sandbox/session/tools（8） | loop/model/types（3） | durable/otel/retry/router/stream（5） |
| M4 ← M3 | compress/durable/eval/golden/mcp/model/otel/policy/retry/router/sandbox/session/stream/tools（14） | loop/types（2） | costwalk/flywheel/framework/memory（4） |

- **给全继承文件逐字节 diff 空**、升级文件仅在 `{types,model,loop,tools,policy}` 白名单内、无上一级 solution 文件被丢弃——「真·增建」硬证据成立。
- **git tag m0..m4 不可交付（诚实标注，同 t25/t27/t29/t31）**：`my-agent/` 全目录 git untracked（`?? my-agent/`），tag 需先 commit，而团队纪律 flag-for-merge 不 commit；串链以文件级逐字节 diff + 五档 assert 串链证据交付，tag 留 merge/CI commit 环境再打。

### 15.3 练习闭环两态证据（亲自实跑，非转述）

`npm run assert:m<N>`（半成品红）+ `npm run assert:m<N>:solution`（绿）+ `demo` 未补退出码：

| milestone | starter 红 | solution 绿 |
|---|---|---|
| m0 | exit 1（3 条未过） | exit 0 `✅ m0 验收通过` |
| m1 | exit 1（4 条未过） | exit 0 `✅ m1 验收通过` |
| m2 | exit 1（4 条未过） | exit 0 `✅ m2 验收通过` |
| m3 | exit 1（5 条未过） | exit 0 `✅ m3 验收通过` |
| m4 | exit 1（4 条未过） | exit 0 `✅ m4 验收通过` |

- 抽查未补 demo：`npm run demo:m4`（starter）exit 1，先跑通 M0–M3 全链（审计 fnv1a + durable messageDeliveries=1 + SSE + 重试 0.5× + 路由 + span total=3）后在 m4.1 停：`❌ 仍有 TODO 未完成：m4.1: 实现记忆写路径四道投毒防线 + 冲突消解`。
- `exercises/m4/solution/loop.ts` 直跑 exit 0：记忆 write/recall/forget + 飞轮 round/gate/curate + 模型意识 kv/成本（fine-tune）+ 框架对照 5 维 + 抢跑 deny，末行 `✅ m4 demo 通过`。
- 「未完成=可检测失败、补全=可判定过关」在 M0–M4 五档全部成立。

### 15.4 正确性抽查（4+1 处，与 demo 源码一致）

1. **M1 压缩** `m1/solution/compress.ts`：超阈值 head=[system,首 user]+中间确定性摘要（`slice(0,80)` truncate，不调真实模型）+tail 原样（keepTail=2）——与 `api-demo` context 的 estimateTokens/compactIfNeeded 同构。
2. **M2 四通道 policy** `m2/solution/policy.ts`：`CHANNEL_PRIORITY` deny>approve>sandbox>allow 遍历 + RULE_TABLE（read_file/search=allow、write_file=sandbox、run_shell/send_email=approve）+ `when(args)` 参数匹配 + fallback deny——与 sandbox-demo policy 一致。
3. **M3 重试分类** `m3/solution/retry.ts`：classify（400 不盲重试 / 429 退避更长 / 5xx / timeout / refusal / eof）、backoffMs 指数退避 + `mulberry32` 固定 seed jitter、prefixKey djb2 稳定前缀命中 0.5×——与 api-demo retry/caching 一致。
4. **M4 记忆投毒防线** `m4/solution/memory.ts`：`FOUR_POISON_DEFENSES`=[trustGate,injectionScan,highRiskApproval,auditTrail]（=memory-redteam S7.1–S7.4）+ `DEFENSE_KEYS` 8 键（+conflictResolve/scopeFilter/ttlWindow/forgetPropagation）+ write 低信任不覆盖高信任/recall scope 过滤+时效窗口/forget 落墓碑沿血缘传播——与 memory-redteam `memory.mjs` 同构。
5. **M4 飞轮门禁** `m4/solution/flywheel.ts`：`gate`（f1 不降 && precision 提升 >NOISE(0.02)→propose 否则 reject，action 无 apply 态）+ `round`（除 prompt_version 外逐字段全同否则抛错）+ `curate`（去污染去重）——与 flywheel-demo label/gate/curate 一致。

未发现需要就地划改的错误。

### 15.5 构建证据（诚实两段式，沿 §11–§14 口径）

```bash
cd site && NODE_OPTIONS="--max-old-space-size=1024" timeout 120 npm run build:fast > /tmp/astro-build-t32.log 2>&1; echo "EXIT=$?" >> /tmp/astro-build-t32.log
```

结果日志：`/tmp/astro-build-t32.log`（两段式）：

- ✅ **服务端编译通过（零编译 / 零类型错误）**：`10:02:13 [vite] ✓ built in 4.50s` → `[build] ✓ Completed in 4.56s`（`Building static entrypoints`），capstone.ts 5 milestone 全 done 后 learn capstone 卡从「🚧 施工中」变「✅ 已就位」的数据驱动已就位、正确产入 `dist/`。
- ⛔️ **HTML 渲染阶段仍被本沙箱环境卡死（留 CI / 浏览器目检）**：自 `[build] building client (vite)` 起停在 `[vite] transforming...`，`timeout 120` 触发（EXIT=124），`dist/*.html=0`。归因同 §11.1–§14.5：本机 2 vCPU / 3.4G RAM，逐页渲染 swap 打满、不可中断换页；环境资源约束而非代码缺陷，不冒充全绿。
- 附带 WARN（非阻断）：`[glob-loader] Duplicate id "site-refactor-plan"`——`site-refactor-plan.md` 在课程 EXCLUDED 集合内、无课程路由依赖它，且已核验 37 份顶层 notes 文件名与 frontmatter slug 均无真实重复；判断为 Astro glob-loader 缓存/加载次序摩擦，不影响 17 课输出，留后续一并查（不影响本 sprint 收口）。

### 15.6 capstone 5 milestone 全 done + capstoneHook 双向

- `site/src/data/capstone.ts`：MILESTONES 5 项（m0 minimal-loop / m1 multi-tool-session / m2 sandbox-mcp-eval / m3 durable-api-obs / m4 memory-flywheel-model）status 全 `done` + `assertCmd` 全就位（`npm run assert:m<N>`）；`assertMilestonesCoursesResolve()` （必修课 slug 全解析）exit 0。
- `site/src/data/course-structure.ts`：17 课 `capstoneHook` 全非空；16 课 `M<k> · …` 前缀 + 序章 llm-history `全域 · 背景地图（序章）`；双向一致（hook 的 M<k> ↔ MILESTONES key 闭包）exit 0。
- 现有结构零破坏：17 课五档 `STAGE_COUNTS={P0:5,P1:4,P2:3,P3:3,P4:2}`、MVP 13=11/0/2、prereq 合法、`notes=37 − EXCLUDED=20 = 17` 路由口径。

### 15.7 遗留事项

- **P0 正文终稿统一复审**：沿 §12.4 / §13.5 / §14.6 继续留 sprint 后续（正文改动不在本 sprint 范围）。
- **留 CI 复验 34 页 HTML + 浏览器目检**：本沙箱 HTML 渲染卡死，须在内存充足 / `capped` 环境跑全量 `bash build.sh`（含 pagefind）；目检项——learn 页 capstone section 5 卡视觉（应已「✅ 已就位」而非「🚧 施工中」）、c/[slug] 五格 lp-grid、`my-agent` README + `npm run demo`（前进到 M4）浏览器视角。
- **git tag m0..m4 五档补打**：`my-agent/` 现 untracked（`?? my-agent/`），待 flag-for-merge commit 后补打 `m0..m4` 五档（`git diff m0 m4` 即完整主线逐 milestone 真增建历程），作为 CI 复验一项。
- **`Duplicate id "site-refactor-plan"` WARN**：逐项排除真实重复后判断为 glob-loader 摩擦，留后续清查 `.astro/` 内容缓存与加载次序（不影响 17 课输出、无路由依赖）。
- **P1–P4 正文深度**：首次 sprint 仅 P0 深度填充，P1–P4 元数据/结构就位、正文深度留后续 sprint（原定范围，非本 sprint 遗漏）。

---

## 16. sprint 6 毕业项目（生成层收口）设计与整体最终终审

> 毕业项目是主线 `my-agent` 的**终极收口**：把学员从「补全已给签名的 TODO」（补全层）推到「从模糊需求独立设计 + 实现自己的 agent」（生成层）。三层级收口——追踪(demo) → 补全(M0–M4 TODO) → 生成(本任务)——在本 sprint 落地并终审通过。改动文件：`notes/capstone-final.md`（设计，t33）、`notes/capstone-final-structure.md`（落地清单，t33）、`final-project/`（脚手架，t34）、`site/src/data/final-project.ts` + `site/src/pages/learn.astro`（站点呈现，t34）、`site/src/data/courses.ts`（EXCLUDED 20→22）、本文件（§16，t35）。

### 16.1 生成层纪律核验（关键：未退化为补全层）

- **脚手架原子扫描（文件级）**：`final-project/` 共 7 文件（`README.md` / `grade.mjs` / `rubric.mjs` / `subjects/{README,a-research,b-repo-guard,c-signal-arbiter}.md`）；`.ts` 半成品 = **0**；`throw new TODOError` = **0**；`starter`/`solution`/`exercises` 目录 = **0**。
- **grep 命中均为「纪律否定表述 / 三层级对照」**，不是真实结构：`grade.mjs:21`「本页无 starter/TODO/参考答案」、`README.md`「不提供 starter/TODO/参考答案，学员从空目录起步」、`README.md` 三层级表「补全层给 starter+solution」——这些是**说明「不给什么」**，非交付中的半成品。
- **脚手架只含三样合规物**：① `grade.mjs`（判据运行器：跑学员 `assert.mjs` 认 exit + 读学员 `MANIFEST.md` 认 W1–W7 覆盖性，不判实现）；② `rubric.mjs`（B1–B5 / W1–W7 机器可读唯一真源，无实现 hint）；③ `subjects/*.md` + `README.md`（空命题骨架：标题 + 一句话，判据指针回 `capstone-final.md`）。结论：**生成层纪律成立，退回补全层的风险被文件级探针封死。**

### 16.2 判据可用性（亲自实跑，样例跑完即删）

- `npm run check:final`（无成品态）→ `❌ 未找到成品目录：请从空目录开始搭建（本页无 starter/TODO/参考答案）… exit 1` —— 可检测、非 TODO 式。
- **最小合规成品样例**（`/tmp/final-sample-ok`，仅验证判据器，**跑完已删、未写入交付**）→ `✅ 黑盒判据通过 → ✅ 白盒要素 W1–W7 全指认 → ✅ 毕业判据通过 exit 0`。
- 反例三态各 exit 1 且逐条列缺失：黑盒 `assert.mjs exit 1` + 白盒缺 W3,W5 → `❌ 毕业判据通过（黑盒未过；白盒缺 W3,W5）`；缺 `MANIFEST.md` → `❌ 白盒缺 W1–W7 全列`。判据器「过/不过」两向正确命中。

### 16.3 站点 + 一致性断言（esbuild+node exit 0 / tsc 0）

- `site/src/data/final-project.ts`（GENERATIVE_DISCIPLINE / SKILL_LADDER 三步 / FINAL_SUBJECTS 3 命题 / FINAL_BLACKBOX B1–B5 / FINAL_WHITEBOX W1–W7 / FINAL_SELF_CHECK 三步 / FINAL_GRADE_CMD / FINAL_CLOSING）与 `rubric.mjs` **逐字一致**（单一真源自洽）。
- `learn.astro` capstone 主线 M0–M4 五卡后追加「毕业项目 · 生成层收口」`final-card`（三命题 + 判据摘要 + 自测三步 + `node grade.mjs` 入口 + 收口句），静态无 JS 全可见。
- **白盒要素 M0–M4 衔接核验**：W1 loop(M0) / W2 工具分发(M1) / W3 默认 deny·白名单·多通道(M1/M2) / W4 golden+可跑断言(M2) / W5 journal·checkpoint·幂等(M3) / W6 span·metric·结构化日志(M3) / W7 记忆·评测飞轮·模型成本(M4 三选一)——机制全为 M0–M4 教过，未凭空新增。
- 结构零破坏：17 课五档 `STAGE_COUNTS={P0:5,P1:4,P2:3,P3:3,P4:2}`、MVP 13=11/0/2、prereq 合法、`capstone.ts` 5 milestone 全 `done` + `assertCmd` 就位、`notes=39 − EXCLUDED=22 = 17` 路由口径；`npx tsc --noEmit` exit 0。

### 16.4 构建证据（诚实两段式，同 §11–§14 / §15.6）

- **服务端 ✓ built 零错误**：`10:58:14 [vite] ✓ built in 12.49s` → `[build] ✓ Completed in 12.89s`（日志 `/tmp/astro-build-t16.log`）。
- **HTML 渲染卡死（环境约束，如实记录，不冒充全绿）**：停在 `10:58:14 [vite] transforming...`，`dist/html = 0`（2 vCPU/3.4G 沙箱，同 §11–§16 一贯现象）；附非阻断 WARN `Duplicate id "site-refactor-plan"`（glob-loader 摩擦，已逐项排除真实重复，无 17 课路由依赖，留 §16.6）。

### 16.5 全局收口结论（四段式演进已完成）

从「拼凑感强的公开学习记录」到完整课程体系，四段式演进在本重构全部落地：

1. **拼凑记录 → 五阶段教学体系**：17 课线性五档（P0–P4）+ LLM 发展史横向知识导航页（P0 前）+ 每课前置知识/独占 MVP，13 MVP = 11 done / 2 asset；
2. **+ 增量主线 M0–M4**：`my-agent` 五 milestone 真·增建（`mN/starter = mN-1/solution` 冻结剪除 + 断言闭环），补全层三态「starter 红 / 补全绿 / solution 绿」全部实跑成立，五档 `assert:m0..m4:solution` 串链全绿；
3. **+ 生成层毕业项目**：开放命题（research-assistant / repo-guard / signal-arbiter）+ 黑盒 B1–B5 / 白盒 W1–W7 判据 + 自测三步（先黑盒 → 再白盒 → 再补断言），**不给 starter/TODO/参考答案**，学员从空目录起步；
4. **收口形态**：`毕业判据 = 成品能跑 + 黑盒断言过(B1–B5) + 白盒要素齐(W1–W7)`，收口一句话——「你搭出的这个，与 M4 的 `my-agent` 同级，且是你从空目录、从模糊需求、独立设计出来的」。

### 16.6 最终遗留清单（M0–M4 + 毕业项目全部落地后的收口 items）

- **CI 复验 34 页 HTML + 浏览器目检**：本沙箱 HTML 渲染卡死，须在内存充足环境跑全量 `bash build.sh`（含 pagefind）复验 dist 全页；浏览器目检 learn 页 capstone section（M0–M4 5 卡 + 毕业项目卡视觉）、c/[slug] 五格 lp-grid、`my-agent` README + `npm run demo` 前进到 M4、`node final-project/grade.mjs <成品>` 判据入口。
- **git commit + 补打 `m0..m4` 五档 tag**：`my-agent/` 现 untracked，待 flag-for-merge commit 后补打五档（`git diff m0 m4` 即完整主线逐 milestone 真增建历程）作为 CI 复验一项；毕业项目 `final-project/` 一并纳入。
- **`Duplicate id "site-refactor-plan"` WARN**：glob-loader 摩擦，留后续清查 `.astro/` 内容缓存与加载次序（不影响 17 课、无路由依赖）。
- **P0 正文终稿统一复审 + P1–P4 正文深度**：沿 §12.4/§13.5/§14.6 及原定范围留后续 sprint。
- **真实 key 可选加分（毕业项目）**：红线延续「全离线零 key」为默认；学员接真实模型 key/数据源为加分项、非门槛，判据不因此加分/减分（判据只认 B1–B5 行为 + W1–W7 要素）。