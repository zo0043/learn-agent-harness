# 知识点总地图(面试导向:coding agent)

> 建立：2026-10-11 · 依据：handoff.md 路线图（2026-10-10）+ 仓库最新实况（10-11）
> 用途:全部知识点的一次性盘点——每课的知识结构在各自课程文件里,本文件是**索引 + 状态 + 依赖**。
> 命名(2026-10-11 起):课程一律以**知识域名**引用,弃用 A–N 字母代号与课程顺序编号(历史文档已批量改齐)。
> 状态记号：✅ 已完成 / 🔄 进行中 / 📐 讲义已展开（待提问演练） / ⏳ 未开始（已建知识结构，待开课）
>
> **四次整理（2026-10-11，系统时钟）：🔶1-5 五个缺口项全部写入**——系统设计 `system-design.md` S8 范式速查 / 评测工程化 `evaluation.md` S8 指标四代+奖励模型意识（judge 偏差三篇一手文献已核实）/ MCP 与供应链安全 `mcp.md` S4 升级为 Agent 安全全景（OWASP LLM Top 10 **2026 版**（2026-08-04 发布）+ Agentic Top 10（2026）全文核实）/ 模型基础 `model-basics.md` S7 八股速查表 16 题 / `interview-bank.md` §8 行为面 5 题；LangGraph 1.0.x 已核实。各课题库同步补题（现行题量见下方计数口径「题目」条，按块内规则不另起数）。
> ✅ 日期口径（2026-10-11 确认）：前两轮记录误标 "10-17"（未来日期），已按机器时钟 + 文件 mtime 证据归一到系统时钟 2026-10-11，共 11 文件 27 行 28 处修正（handoff/notes/代码注释）；文中残留的 "10-17" 均为引用原始错误写法的元记录引文。
>
> **计数口径（2026-10-12 冻结，全仓唯一参照，其余位置只引用本块、不另起数）**：
> · **知识域 15** = 课程总表 14 编号课 + Harness 架构主线 `agent-harness.md`；`interview-bank` / `llm-timeline` / `industry-2026` / `details/` 为横向资产，不计入门数。
> · **课程页 17** = 站点 `/c/<slug>/` 实生成路由数（notes 顶层 19 − knowledge-map − interview-bank）。
> · **课程卡 18** = `site/src/data/courses.ts` 全部条目；含 `whiteboard` 白板卡（无独立 notes 文件与课程页，链向 /works/#whiteboard），故课程卡比课程页多 1。
> · **可运行 demo 作品 6** = harness-demo / rag-demo / sandbox-demo / mcp-demo / durable-execution-demo / framework-demo（六个**具名作品**目录——作为作品列在 README 作品表与站点 `/works/` 页）；`whiteboard` / `viz` / `site` 为配套资产；`memory-redteam/`（2026-10-12 起有 `npm run demo`）按**回归套件/自研实操证据**计，同样不计入作品数。即"6"指上列六个具名目录，**不是"所有带 demo 脚本的目录"**（该措辞在 memory-redteam 加上 demo 脚本后已不成立，就地更正）。
> · **题目**：课内嵌 **205** 题（13 课练习题库 176 + agent-harness §13 八题 + rag S1 五题 + model-basics S7 十六题）+ 面试题库精选 **37** 题（interview-bank §3 22 + §4 10 + §8 5）。
> · **站点 html 32**（2026-10-13 最终态：32 这次**真正成立**——历史链如下，不得省略）= 6 静态页（index / learn / works / map / interview / details）+ 17 课程页（见上条）+ 8 专题页（details/）+ **自定义 404 页（2026-10-13 新增，`site/src/pages/404.astro`）**。历史链：① 旧口径「站点 html 32」**当初是凑数**——404.html 加数当时并不存在（audit 侧「静态页 7 含 timeline」同样不存在，两套算式互相矛盾且均未对照构建产物）；② 审计（U-22/C-13）查出后，本条 2026-10-13（t16）曾就地更正 32 → 31（依据：CI 绿 run [38282562346](https://github.com/zo0043/learn-agent-harness/actions/runs/38282562346) 日志「dist HTML 文件数 = 31」+ 当时 `ls site/src/pages/404.astro` 不存在 + 线上 `/404.html` 返回 HTTP 404）；③ 2026-10-13 用户决定**实际实现**自定义 404 页（t20），第 32 个加数从此真实存在——依据（可复核）：CI run [38350151634](https://github.com/zo0043/learn-agent-harness/actions/runs/38350151634) 日志「dist HTML 文件数 = 32（下限 32 = 6 静态 + 17 课程页 + 8 专题页 + 1 自定义 404 页（2026-10-13 新增）」）+「关键页存在且非空：404.html」+ 几何断言 not-found@375/768/1280 全 ✅（24 页×视口全过）。**一句话：32 现在是真的，但当初的写法是凑数**。构建产物数以 CI 为准。
> · **rag-demo 评测口径**（2026-10-12 锚点式 golden set 复测，以 `notes/rag.md §13` 为唯一数字源）：recall@3 = 0.31 / recall@5 = 0.44 / recall@10 = 0.50，PASS 3/8，语料 132 chunks；旧值 recall@3=1.00 / @5=0.94 出自已废止的「行号指针」golden set（旧语料口径同时作废，全仓禁用旧值）。

## 命名总表(唯一真源)

> 规则(2026-10-11 起):
> ① 每份材料只有一个**规范名**,所有交叉引用 / 站点卡片 / handoff / demo 注释一律用它;
> ② 规范名**不带「课」字后缀**,不写 A–N 字母代号;
> ③ 节号引用写作 `§Sn`(如 `沙箱与凭据 §S2`)。

| 规范名 | 文件 | 类别 |
|---|---|---|
| Harness 架构 | `agent-harness.md` | 主线 |
| 从零写 harness | `harness-from-scratch.md`(`harness-demo/`) | 编号课 |
| RAG 与检索 | `rag.md`(`rag-demo/`) | 编号课 |
| 系统设计 | `system-design.md` | 编号课 |
| 沙箱与凭据 | `sandbox.md`(`sandbox-demo/`) | 编号课 |
| 评测工程化 | `evaluation.md` | 编号课 |
| durable execution | `durable-execution.md`(`durable-execution-demo/`) | 编号课 |
| MCP 与供应链安全 | `mcp.md`(`mcp-demo/`) | 编号课 |
| API 与多模型路由 | `api-engineering.md` | 编号课 |
| 数据飞轮 | `data-flywheel.md` | 编号课 |
| 可观测 | `observability.md` | 编号课 |
| 长期记忆 | `long-term-memory.md` | 编号课 |
| 模型基础 | `model-basics.md` | 编号课 |
| 框架生态 | `framework-ecosystem.md`(`framework-demo/`) | 编号课 |
| 多智能体编排 | `multi-agent.md` | 编号课 |
| 面试题库 | `interview-bank.md` | 横向资产 |
| LLM 时间线 | `llm-timeline.md` | 横向资产 |
| 行业前线调研 | `industry-2026.md` | 横向资产 |
| 资深分水岭 1–8 | `details/*.md` | 横向资产 |
| 知识点总地图 | `knowledge-map.md` | 索引 |

## 课程总表

| 主题 | 优先级 | 状态 | 课程文件 | 完成后你能做到 |
|---|---|---|---|---|
| 从零写 harness | P0 | ✅ | `harness-from-scratch.md` | 白板 20 分钟写出可运行 agent loop（含恢复/权限/压缩） |
| RAG 与检索 | P0 | ✅ | `rag.md`（含 13 实操复盘） | 讲清 pipeline 每层为什么存在 + 跑过 132-chunk 评测（recall@3=0.31，2026-10-12 锚点式复测） |
| Agent 系统设计模板 | P0 | 📐 | `system-design.md` | 30 分钟结构化答“设计一个 X agent” |
| Agent 可观测 | P2 | 📐 讲义已展开（2026-10-11） | `observability.md` | 画 agent tracing 模型 + OTel GenAI 属性 + 成本归因（出口判据：提问演练 + 题库 14 题通过） |
| 沙箱与凭据·可复现 | P0 | 📐 讲义已展开（2026-10-11） | `sandbox.md` | 讲清“权限层 ≠ 沙箱” + 隔离技术选型 + 幽灵事故完整故事 |
| 长期记忆 | P2 | 📐 讲义已展开（2026-10-11） | `long-term-memory.md` | 设计跨会话 memory（写/读/遗忘/安全）（出口判据：提问演练 + 题库 14 题通过） |
| durable execution | P1 | 📐 | `durable-execution.md`(`durable-execution-demo/`,S7 demo 已落地) | 讲清长任务不丢不重（journal/checkpoint/幂等） |
| 评测工程化 | P0 | 📐 | `evaluation.md` | 设计 LLM-judge + golden set 版本化 + 评测 CI 门禁 |
| MCP 协议 + 供应链安全 | P1 | 📐 | `mcp.md` | 讲清 MCP 架构/原语/认证 + 四类投毒攻击与防御 |
| API 实操 + 多模型路由 | P1 | 📐 | `api-engineering.md` | 讲清流式/结构化输出/caching/重试分类/路由成本 |
| 数据飞轮 | P1 | 📐 | `data-flywheel.md` | 把 FinHot 台账+labeler 讲成“生产数据飞轮”故事 |
| 模型基础 | P2 | 📐 讲义已展开（2026-10-11） | `model-basics.md` | KV cache/推理成本/微调意识——够用不深挖（出口判据：提问演练 + 题库 14 题通过） |
| 框架生态 | P2 | 📐 讲义已展开（2026-10-11） | `framework-ecosystem.md` | 讲清框架给你什么/藏什么 + pi 源码级实操故事（出口判据：提问演练 + 题库 14 题通过） |
| 多智能体编排 | P0 | 📐 讲义已展开（2026-10-11） | `multi-agent.md` | 讲清何时多智能体 + orchestrator-worker/单线程写 + 给自己 harness 设计子代理方案 |

横向资产:`interview-bank.md`(模拟面试结构 + 交叉题库 + JD 关键词覆盖矩阵)· `llm-timeline.md`(LLM 时间线 12 节点)· `industry-2026.md`(2026-10 行业前线调研,MCP 与供应链安全 / 框架生态 / 系统设计 / 多智能体编排 一手源)· `details/`(资深分水岭 8 细节页)

> 口径：课程总表 14 行 = 14 个编号课；另加 1 条主线 `agent-harness.md`（Harness 架构），合计 15 个知识域。

> 2026-10-11 前线回填（industry-2026 → 课程）：MCP 与供应链安全 §S2.1（AAIF 治理/spec 2026-07-28/协议三分）· 框架生态 §S3 表 +4 行 · 系统设计 §S2 两个必答题模块 + 1 追问 · 从零写 harness §8 → 多智能体编排入口。课程状态(⏳/📐/✅)指"开课/实操"进度，不含内容回填。

## 依赖图（按 handoff 优先级）

```mermaid
graph TD
  classDef done fill:#2ea043,stroke:#278038,color:#fff
  classDef doing fill:#bb8009,stroke:#9a6700,color:#fff
  classDef todo fill:#6e7681,stroke:#57606a,color:#fff
  classDef hub fill:#0f766e,stroke:#0d5f59,color:#fff

  HARNESS["✅ 从零写 harness · P0"]:::done
  RAG["✅ RAG 与检索 · P0"]:::done
  SYSDESIGN["📐 系统设计 · P0"]:::doing
  SANDBOX["📐 沙箱与凭据 · P0"]:::doing
  EVAL["📐 评测工程化 · P0"]:::doing
  DURABLE["📐 durable execution · P1"]:::doing
  MCP["📐 MCP 与供应链安全 · P1"]:::doing
  API["📐 API 与多模型路由 · P1"]:::doing
  FLYWHEEL["📐 数据飞轮 · P1"]:::doing
  OBS["📐 可观测 · P2"]:::doing
  MEMORY["📐 长期记忆 · P2"]:::doing
  MODEL["📐 模型基础 · P2"]:::doing
  FRAMEWORK["📐 框架生态 · P2"]:::doing
  MULTIAGENT["📐 多智能体编排 · P0"]:::doing
  TIMELINE["✅ LLM 时间线 · 横向资产"]:::done
  INDUSTRY["✅ 行业前线调研 · 横向资产"]:::done
  INTERVIEW["🎯 面试演练 · P0 末"]:::hub

  HARNESS --> SYSDESIGN
  RAG --> SYSDESIGN
  HARNESS --> SANDBOX
  RAG --> EVAL
  HARNESS --> DURABLE
  EVAL --> DURABLE
  HARNESS --> MCP
  SYSDESIGN --> MULTIAGENT
  EVAL --> MULTIAGENT
  MULTIAGENT --> INTERVIEW
  HARNESS --> API
  EVAL --> FLYWHEEL
  SYSDESIGN --> INTERVIEW
  SANDBOX --> INTERVIEW
  EVAL --> INTERVIEW
  DURABLE --> INTERVIEW
  MCP --> INTERVIEW
  API --> INTERVIEW
  FLYWHEEL --> INTERVIEW
  OBS -.->|加深 评测工程化| INTERVIEW
  MEMORY -.->|进 系统设计 设计题| INTERVIEW
  MODEL -.-> INTERVIEW
  FRAMEWORK -.-> INTERVIEW
```

**建议开课顺序**:系统设计 → 多智能体编排 → 沙箱与凭据(续 §S2)→ 评测工程化 → durable execution → MCP 与供应链安全 → API 与多模型路由 → 数据飞轮 →(P2 四课按目标岗位权重排)。
理由:系统设计把「从零写 harness / RAG 与检索」收口成"设计能力";多智能体编排依赖系统设计模板 + 从零写 harness 的子代理概念,2026 行业实践已收敛(单线程写),开课成本低;沙箱与凭据讲义已展开且 demo 已落地;评测工程化是 P1 三课(durable execution / MCP 与供应链安全 / 数据飞轮)的公共地基。

## 横切知识点（多课重复出现，面试时按"一个主题三个锚点"讲）

| 横切主题 | 出现位置 | 三个锚点（证据链） |
|---|---|---|
| 失败恢复 | 从零写 harness §⑦、沙箱与凭据、durable execution | intent/exec 日志(harness-demo)→ 幽灵事故 scope 缺失(FinHot)→ durable journal(durable execution demo) |
| 权限与信任 | 从零写 harness §⑤、沙箱与凭据、MCP 与供应链安全、长期记忆 | 三道门(harness-demo policy)→ 沙箱=执行环境层(沙箱与凭据)→ MCP 不解决权限(MCP 与供应链安全)→ 记忆投毒四道防线(`memory-redteam/` 可执行实测) |
| 评测与验证 | RAG 与检索 §⑨、评测工程化、数据飞轮 | golden set(rag-demo recall@3=0.31,2026-10-12 复测)→ CI 门禁(评测工程化)→ 飞轮迭代(数据飞轮,FinHot 两轮降噪) |
| 成本工程 | 从零写 harness §⑧、API 与多模型路由、可观测 | 压缩(context.ts)→ 路由/caching(API 与多模型路由)→ token 归因(可观测) |
| 上下文工程 | 从零写 harness §⑧、RAG 与检索 §⑧、长期记忆 | 压缩/预算 → query 侧分布差/窗口≠RAG → 跨会话记忆 |

## 资产 ↔ 课程映射

| 资产 | 证明的能力 | 被哪些课引用 |
|---|---|---|
| `harness-demo/`(9 源文件 + trajectories 落盘，覆盖 harness-from-scratch ①-⑩ 十节；5 种运行模式实测) | loop/工具协议/流式/权限/恢复/压缩 | 系统设计(coding agent 设计)、沙箱与凭据(policy 层)、durable execution(session.ts=最小 journal)、评测工程化(mock 评测)、多智能体编排(§S7 子代理设计练习) |
| `whiteboard/agent_whiteboard.py`(~180 行) | 白板手写 | 系统设计、面试演练 |
| `rag-demo/`(15 文件 + golden set) | 检索全 pipeline + 评测 | 系统设计(KB 设计题)、评测工程化(检索层评测)、数据飞轮(指标驱动) |
| `durable-execution-demo/`(9 src 文件/821 行,3 崩溃点×各 3 次真实 SIGKILL 恢复:副作用恒=1、恢复报告逐字节一致,含负向测试) | journal/checkpoint/幂等三机制 + 未知态处置实操 | durable execution §S7、沙箱与凭据(崩溃恢复)、系统设计(长任务设计题) |
| `sandbox-demo/`(7 个 src 文件 + README,3 次重放逐字节一致) | 四通道 policy + 事故重放 | 沙箱与凭据 §S2 |
| `memory-redteam/`（7 src 文件，零依赖；16 条探针 + 逐层消融 18/18 层 + `npm run demo` 端到端走查 + JSONL 跨进程重建断言） | **自研长期记忆**：写/读/遗忘三路径 + 冲突消解/时效/血缘传播 + 四道投毒防线 + 跨会话持久化 | 长期记忆 §S3/S4/S5/S6/S7/S10（§S7 回归框给出逐条映射表） |
| FinHot(生产) | 长任务/批量评测/事故/数据飞轮 | 沙箱与凭据、durable execution、评测工程化、API 与多模型路由、数据飞轮 |
| pi + pi-agents-team(日常在用) | 多 agent 编排/框架源码级 | 系统设计、框架生态 |

## 未结事项（非课程，来自 handoff）

> **本清单是全站待办的唯一事实源**（2026-10-12 合并）：原散在三处的待办——`handoff.md` §三 待办 3/5、`interview-bank.md` §7 未结清单——已全部并入此处，另两处只保留一行引用。带 [interview-bank] / [handoff] 标注的条目是合并时带入；同事项不同表述的已归并（面试模拟、JD 补盲、岗位方向三处重复各留一条）。完成判据与口径块同源，改待办只改这一节。

- [x] 讲义展开（2026-10-11）：系统设计 / 多智能体编排 / 沙箱与凭据 / 评测工程化 四课从"结构建成"→"开课版讲义"（各 4 张 mermaid、实战走查节、题库 12-16 题）；引用一手源复核修正 4 处
- [x] 讲义展开（2026-10-11 Phase 2）：durable execution / MCP 与供应链安全 / API 与多模型路由 / 数据飞轮 四课 →"开课版讲义"（各 4-5 张 mermaid、实战走查节、题库各 14 题）；引用一手源复核修正 8 处；数据飞轮回填 FinHot 真实三轮评测指标
- [x] 讲义展开（2026-10-11 Phase 3）：可观测 / 长期记忆 / 模型基础 / 框架生态 四课 →"开课版讲义"（各 4 张 mermaid、实战走查节、题库扩充）
- [ ] 面试模拟问（题库已备 → `interview-bank.md`，开课式提问另约时间）；[handoff 待办 5 并入] 2 场 60 分钟模拟：Phase 1 完成后排初验、全部完成后排终验
- [ ] [interview-bank §7 并入] 开课顺序确认（当前建议：系统设计 → 沙箱与凭据（续 S2）→ 评测工程化 → durable execution → MCP 与供应链安全 → API 与多模型路由 → 数据飞轮 → P2 四课按目标岗位权重排）
- [ ] [interview-bank §7 并入] 旧课遗留确认题自测（不混入新课，另约时间；题已存档）：从零写 harness 练习题库 8 题 / 从零写 harness §S2-S4+白板题 / RAG S1 五道确认题（2026-10-12 已写入 `rag.md` 文末题库节）
- [x] 项目打磨（2026-10-12）：rag-demo / harness-demo README 补齐（harness-demo 模型名同步为 qwen3.8-flash-next）；durable-execution S7 demo 落地（durable-execution-demo/，3 崩溃点×3 次真实 SIGKILL 验收）
- [x] 实操补强 ×4（2026-10-11 完成）：sandbox-demo 四通道 policy+幽灵重放（600 行，3 次重放逐字节一致）/ harness-demo OTel 埋点（demo:otel 离线 mock 实测 **15 spans/1 trace**，2026-10-12；历史活端点「11 spans」未验证、不作判据）/ mcp-demo 投毒+四层防御+消融 / framework-demo Claude Agent SDK（10 条 `ok()` 断言 + 1 条整体判定；「11/11」混口径已按 U-24 废弃）
- [x] 记忆投毒红队回归（2026-10-12）：`memory-redteam/` 零依赖可执行套件——11 条探针全部守住、10/10 对防线敏感（消融自检），编码自长期记忆 §S7 四道防线与 §S10 步骤 6-7；首次运行即抓出"scope 缺省字段按 `undefined` 比较致冲突检测静默失效"的真 bug。原 interview-bank 补强项 4「未做」已闭环。**（同日原地升级：现为 16/16 守住、15 条探针/18 层逐层承重——见下条；本条保留为当时的验收记录，不再是当前能力描述）**
- [x] **自研长期记忆子系统**（2026-10-12，`memory-redteam/` 原地升级，**不新增作品目录**）：从"投毒回归脚本"补全为可演示的自研记忆子系统——写路径 7 项能力（信任分级/注入扫描/高危独立审批/审计留痕/冲突消解/时效窗口/遗忘传播）、读路径（scope 过滤 + BM25∥字符三元组 hash 向量 → RRF 融合 + 逐条注入理由审计）、跨会话持久化（JSONL 事件日志 → 新进程重建，写入进程/重建进程/本进程三方 digest 逐字节一致）、`npm run demo` 端到端走查（§S10 步骤 1-7）。`node test.mjs` 16/16 守住（单元级 R1-R11 + 端到端 E1-E5）、`--ablate` 15 条探针/18 层逐层关防线全部失败（runner 对多防线探针改为**逐层**验证）、`--persist` 4/4 通过。实现期还修掉四处真缺陷：污染率口径把"命中签名"当污染（虚报 33%）、遗忘后派生物状态仍 `active`、原 R7 声称的 `ttlWindow` 从未被触发、`write()` 缺省走墙钟 `new Date()` 破坏可复现性——逐条记在 `memory-redteam/README.md`
- [x] 作品口径就地更正（2026-10-12）：`memory-redteam/` 加了 `npm run demo`，计数口径块原措辞"（有 `npm run demo` 的目录）"随即失真——已改为"六个**具名作品**目录"，**数字 6 不变**，并显式声明 memory-redteam 按回归套件计、不计入作品数（site 作品页与 README 作品表均未改动）
- [x] 日期口径确认（2026-10-11）：归一到系统时钟，11 文件 27 行 28 处修正
- [x] 站点建设：Astro 站（site/）+ GitHub Pages 部署——已上线 https://blog.zero43.top/learn-agent-harness/（32 个 html，构成见上方计数口径「站点 html 32」条；历史链：旧「32」当初是凑数（404.html 不存在）→ 审计查出后 2026-10-13 曾就地更正为 31（t16）→ 用户决定实现自定义 404 页后 32 真正成立（t20，CI run [38350151634](https://github.com/zo0043/learn-agent-harness/actions/runs/38350151634)「dist HTML 文件数 = 32」））
- [x] CI 结构与几何回归（W4/t5，2026-10-12；2026-10-13 t16 按 t12 评审加固 F3 搜索断言 + F2 fault 失败现场截图；t20 新增自定义 404 页并纳入断言——8 页×3 视口=24、sanity 下界 ≥32）：`Verify site (structure + 3-viewport)` 作业（`.github/workflows/verify.yml` + `site/tools/visual-check.mjs`）——CI（ubuntu-latest）构建站点 → headless Chromium 3 视口（375/768/1280）× 8 页（含自定义 404 页）：① 无横向溢出（容差 4px）② 关键元素可见（header 导航/页标题/卡片容器/课程正文+meta 栏；404 页=标题+3 个引导卡片）③ 无 console error + 搜索入口交互（**入口必须存在、缺失即失败**；点击开 dialog/Esc 关）+ 负路径自证（注入 overflow/missing-element 必须被检出且作业必须失败）。绿基线 [run 38282562346](https://github.com/zo0043/learn-agent-harness/actions/runs/38282562346)（21/21 + selftest）/ 注入负路径 [run 38282852860](https://github.com/zo0043/learn-agent-harness/actions/runs/38282852860)（按设计失败）/ 加固后 [run 38345995909](https://github.com/zo0043/learn-agent-harness/actions/runs/38345995909)（21/21，dist HTML=31）/ 含 404 页后 [run 38350151634](https://github.com/zo0043/learn-agent-harness/actions/runs/38350151634)（24/24，dist HTML=32）。**边界：只断言结构+几何，不覆盖视觉审美——像素级仍留浏览器人工目检**
- [ ] JD 关键词覆盖：见 `interview-bank.md` 矩阵（目标全 🟢）
- [ ] 人工抽字节/百度 20-30 条 JD 补盲（反爬绕不过；一手数据已在 `jd-research/`，其余六家已抓 1799 条）[handoff 待办 3 / interview-bank §7 并入]
- [ ] 确认目标岗位方向（coding agent / 企业工作流 / 平台）→ 调 P1/P2 权重 [interview-bank §7 并入]
