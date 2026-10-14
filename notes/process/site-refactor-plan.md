# 站点重构方案：五阶段课程体系 + LLM 横向知识

> 性质：**给后续工程任务（数据层、页面重构）的唯一输入文档**。本文件是编排与事实的单一真源，后续实现只引用、不改写本表结论。
> 审计人：alex（课程内容架构师） · 任务 t1 · 时间 2026-10-13（系统时钟）
> 审计对象：`site/src/data/courses.ts`（18 条 = 17 课程页 + 1 `whiteboard` 卡）、`notes/` 19 份笔记、三个草稿 `site/src/data/llm-history.ts` / `site/src/data/course-structure.ts` / `site/src/pages/nav.astro`。
>
> ⚠️ **文件位置与历史口径说明（2026-10-14 结构重组补记，不改动下文任何结论）**
> ① **位置**：本文件已从 `notes/` 顶层移入 `notes/process/`（与另外 19 份设计/过程文档一起）——顶层从此恰为 19 个课程内容文件，站点课程路由数 17 的口径算式 `19 − knowledge-map − interview-bank` 首次与文件系统事实自洽。本文件内容未因迁移改写。
> ② **历史口径**：§11–§13 及 sprint 记录里出现的 `notes/*.md=N`（20 / 22 / 24 等）是**各 sprint 当时时点的实测快照**，彼此并不一致，且与当时的真值（顶层 39）也不同。**它们是审计轨迹，不是当前口径陈述，故一律保留原数不改写**（改写＝伪造审计记录）。当前口径唯一参照 = `notes/knowledge-map.md` 头部计数口径块。
> ③ **`EXCLUDED_FROM_COURSE_ROUTE`**：本文件提到该集合时其值为 22 条；2026-10-14 迁移后已收缩为 2 条（`knowledge-map` / `interview-bank`），其余 20 份因位于 `notes/process/` 而被 `pattern:'*.md'` 天然排除，无需再登记。下表 §2/§3/§4/§5/§7 的编排结论（17 课程页、五阶段、词表）不受影响。
> ④ **glob 告警的定性（同属「时点快照」）**：§11.4-2 / §12.1 / §13.1 记录的 `Duplicate id "…"` WARN 是**各 sprint 当时的现场观测**（当时归因为 glob-loader 内容-store 缓存残留，非真实重复、不阻断构建），与同段引用的 `notes/*.md=20/22/24` 属同一批时点快照，故**原判断与原数一并保留、不改写**。同上：它们是审计轨迹，不是当前口径陈述；当前口径（顶层 19 / `EXCLUDED` 2 / 站点 html 33）的唯一参照 = `notes/knowledge-map.md` 头部计数口径块，并已由 `site/tools/check-counters.mjs` 在 CI 门禁化（`verify.yml` 的「Counter consistency gate」步骤）。§14「遗留事项（仍跟踪）」里那条 `Duplicate id` 条目属**未结项**、仍有效，故**不加**历史标注。

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
| `harness-mvp` | `harness-from-scratch` | `agent-harness`、`system-design`、`multi-agent` | ✅ 已实现 | `harness-demo/`（13 src = 9 运行时 + 3 OTel 离线判据/断言 + 1 压缩自测，5 运行模式）+ `whiteboard/agent_whiteboard.py` |
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
4. `notes/*.md=20` − `EXCLUDED{knowledge-map, interview-bank, site-refactor-plan}` = 17 路由课程页 == course-structure 17 slug（修正 site-refactor-plan 外泄）。 〔时点快照，非当前口径；见文首说明〕
5. `MVP=13`，17 课 `mvpSlug` 全闭合、`mvpStatusOf` 可解析。
6. `LLM_HISTORY=10`、`LLM_EVOLUTION=5`。
7. 17 课 `prereqs` 全部指向更早序（拓扑无环）、`next=序+1`。

### 11.3 本次就地修复（3 处，已修 + 经编译产物验证）

1. `site/src/data/courses.ts` — `EXCLUDED_FROM_COURSE_ROUTE` 追加 `'site-refactor-plan'`：修复方案文档被 content collection（`notes/*.md` glob）当课程、外泄 `/c/site-refactor-plan/` 路由的问题（正是「17→18 页」漂移根源）。
2. `site/src/data/courses.ts` — `PHASE_COUNTS` 注释改标 `@deprecated`：原注释「与 /learn 的 phase-section 一一对应」已失真（/learn 现走五档 `STAGE_COUNTS`），就地划改防后续手抄漂移。
3. `site/src/pages/index.astro` — 首页 footer 学习路线文案「P0 / P1 / P2 三段 × 知识域卡片」→「P0–P4 五阶段 × 17 课线性阅读序」（旧三段文案清零）。

### 11.4 遗留事项与留浏览器目检

- **必须 CI 复验**：在内存充足 / `capped` 可用环境跑全量 `bash build.sh`（含 pagefind），确认 `dist/` 产出 34 页、`/nav`、`/learn`、各 `/c/<slug>/` 学习路径模块成品 HTML、页面无 `undefined` 残留——本沙箱无法完成 HTML 渲染，此三项属「留 CI 构建复验 + 浏览器目检」，不得以 HTTP 200 或编译产物冒充页面正确。
- **「duplicate id site-refactor-plan」glob 告警**：首次 build 出现、重 build 已自愈（Astro content-store 缓存残留），非数据重复（已断言 notes/*.md=20 唯一）；且 §11.3-1 的 EXCLUDED 已兜底路由，该告警不阻断 CI。 〔时点快照，非当前口径；见文首说明〕
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
- **WARN「Duplicate id」= t6 §11.4-2 同现象，非真实重复**：8 个本 sprint 编辑的 note（api-engineering / durable-execution / evaluation / mcp / multi-agent / observability / sandbox / site-refactor-plan）首次 build 各报一次 glob-loader 缓存残留告警（内容-store 缓存 + 新条目首同步）；WARN 不阻断 `✓ built`，且一致性断言已证 `notes/*.md=22` 唯一、无真实重复。 〔时点快照，非当前口径；见文首说明〕

### 12.2 一致性终验（esbuild bundle + node 断言，exit 0 全过）

（脚本 `verify-t12.mjs` 临时建、跑通、已清理；断言语义固化如下，可随时重建复跑。）

1. `COURSE_COUNT=17`、`STAGE_COUNTS={P0:5,P1:4,P2:3,P3:3,P4:2}`。
2. `MVPS=13`；`api-mvp=done`（t11 落地）、`flywheel-mvp` / `model-basics-mvp` 仍 `planned`（本 sprint 未越界）；17 课 `mvpSlug` 全闭合。
3. P1+P2 共 7 课（sandbox / mcp / evaluation / multi-agent / durable-execution / api-engineering / observability）`prerequisiteNote` 含「上一课」承接句 + `practicalOutput` 含 clone 判据（`npm run demo` / `demo:`）＝已精化。
4. P3+P4 共 5 课（long-term-memory / data-flywheel / model-basics / framework-ecosystem / industry-2026）`prerequisiteNote` 仍简短（无「上一课」）+ `practicalOutput` 无 clone 判据＝未越界精化。
5. `teaching-style-guide.md` 就位；`notes/*.md=22` − `EXCLUDED{knowledge-map, interview-bank, site-refactor-plan, teaching-style-guide, api-mvp-spec}` = 17 路由课程页 == course-structure 17 slug。 〔时点快照，非当前口径；见文首说明〕
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
- **WARN「Duplicate id」= t6 §11.4-2 / t12 §12.1 同现象**：本 sprint 编辑的 note（industry-2026 / long-term-memory / model-basics / site-refactor-plan 等）首次 build 各报一次 glob-loader 缓存残留告警；WARN 不阻断 `✓ built`，一致性断言已证 `notes/*.md=24` 唯一、无真实重复。 〔时点快照，非当前口径；见文首说明〕

### 13.2 一致性终验（esbuild bundle + node 断言，exit 0 全过）

1. `COURSE_COUNT=17`、`STAGE_COUNTS={P0:5,P1:4,P2:3,P3:3,P4:2}`、17 课 `prereqs` 拓扑无环、`next=序+1`、industry-2026 为链尾。
2. **MVP 三态最终盘点**：13 slug = **11 done / 0 planned / 2 asset**——api / flywheel / model-basics 三个规划态已全部落地（t10 / t16 / t17）；llm-history / industry-research 两项横向 `asset`；无 `planned` 残留，17 课 `mvpSlug` 全闭合。
3. 17 课全精化：P0 用「0 经验」短式、P1–P4 用「上一课 / 无硬前置」承接；`practicalOutput` 全三件套；data-flywheel / model-basics 的「规划态·由下游实现」已就地回填 clean（无残留）。
4. `teaching-style-guide.md` / `flywheel-mvp-spec.md` / `model-basics-mvp-spec.md` 三份 process 文档就位且在 EXCLUDED；`notes/*.md=24` − EXCLUDED(7) = 17 路由页 == course-structure 17 slug。 〔时点快照，非当前口径；见文首说明〕
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

### 13.5 遗留事项与留 CI / 浏览器目检

> 状态划改（2026-10-14）：本清单原写「留 sprint 4」，但 sprint 4–6 均已落地并提交（见 §14）。
> 下列各项已按其**实际当下状态**就地更正，不再保留「待 sprint 4」的旧措辞。

- **留 CI 复验全页 HTML + 浏览器目检**：本机 HTML 渲染阶段易卡死/超时（2 vCPU / 3.4G），须在内存充足或 CI 环境跑全量 `bash build.sh`（含 pagefind）复验 `dist/` 全页成品与 `/nav`、`/learn`、各 `/c/<slug>/` 无 `undefined` 残留——不得以 HTTP 200 或编译产物冒充页面正确（同 §11.4 / §12.4）。**仍跟踪**，已并入 §14 遗留清单。
- **P0 正文终稿统一复审**：**仍未完成**——P0 五课正文深度已填充，但「正文终稿」复审自 sprint 1 后未再动。**仍跟踪**，已并入 §14 遗留清单。
- ~~**DomainMap.astro 三档→五档迁移 + `phase`/`HORIZONTAL_PHASE` 后续取舍**~~ **已完成（sprint 4 / t36）**：DomainMap.astro 已迁五档 `stage`，`courses.ts` 的 `phase` 字段降为 legacy（仅 `'—'` 仍被 DOMAIN_COUNT 过滤与 `c/[slug].astro` 兜底 chip 消费）。详见 `courses.ts:281` 注释。
- **courses.ts 其余派生口径**（`STATUS_COUNTS` / `PHASE_*` 残留）：`PHASE_COUNTS` 已删除（t18）；其余导出未动，**仍跟踪**。


## §14 后续 sprint 收口（sprint 4–6 已完成，过程记录已精简）

> 原 §14 / §15 / §16 为 sprint 4–6 的逐项验收流水账（改动清单、两态实跑证据、构建日志、留 CI 目检项），
> 全部任务已落地并提交（`git log`：`cc1b906` 五阶段课程体系 + 增量主线 M0–M4、`my-agent` 主线、`final-project` 毕业项目）。
> 本节只保留**仍有后续价值**的结论与遗留清单；过程记录不再保留，如需回溯请查 git 历史。

### 收口结论（四段式演进已完成）

1. **拼凑记录 → 五阶段教学体系**：17 课线性五档（P0–P4）+ LLM 发展史横向导航页；每课前置知识 / 独占 MVP，13 MVP = 11 done / 2 asset。
2. **+ 增量主线 M0–M4**：`my-agent` 五 milestone 真·增建（`m<N>/starter` = `m<N-1>/solution` 剪除后冻结），补全层三态「starter 红 / 补全绿 / solution 绿」，`npm run assert:m0..m4:solution` 串链全绿。
3. **+ 生成层毕业项目**：开放命题（research-assistant / repo-guard / signal-arbiter）+ 黑盒 B1–B5 / 白盒 W1–W7 判据 + 自测三步；**不给 starter / TODO / 参考答案**，学员从空目录起步。
4. **收口形态**：`毕业判据 = 成品能跑 + 黑盒断言过(B1–B5) + 白盒要素齐(W1–W7)`——「你搭出的这个，与 M4 的 `my-agent` 同级，且是你从空目录、从模糊需求、独立设计出来的」。

### 遗留事项（仍跟踪）

- **CI 复验全页 HTML + 浏览器目检**：本机 2 vCPU / 3.4G 下 HTML 渲染阶段易卡死/超时（历史 exit 134/137），须在内存充足环境或 CI 跑全量 `bash build.sh`（含 pagefind）复验 dist 全页。目检项：learn 页 capstone 区（M0–M4 5 卡 + 毕业项目卡）、`c/[slug]` 五格 lp-grid、`my-agent` README + `npm run demo` 前进到 M4、`node final-project/grade.mjs <成品>` 判据入口。
  > 口径更正：本机「必然 OOM」的旧断言已于 2026-10-13 被独立实测证伪——全量构建可在约 17 分钟内成功完成；但极慢/超时风险使其**不可依赖**，CI 仍是可靠回归路径。
- **补打 `m0..m4` 五档 tag**：`my-agent/` 与 `final-project/` commit 后补打，`git diff m0 m4` 即完整主线逐 milestone 真增建历程。
- **`Duplicate id "site-refactor-plan"` WARN**：glob-loader 摩擦，留后续清查 `.astro/` 内容缓存与加载次序（不影响 17 课路由）。
- **P0 正文终稿统一复审 + P1–P4 正文深度**：沿 §12.4 / §13.5 及原定范围留后续 sprint。
- **真实 key 可选加分（毕业项目）**：默认「全离线零 key」；学员接真实模型 key/数据源为加分项、非门槛，判据不因此加减分。
