# G 课 · Durable Execution（长任务不丢不重）

> 优先级 P1 · 状态：⏳ 知识结构已建，待开课
> 前置：A⑥⑦（harness-demo session.ts = 你已有的最小 durable journal）
> 教学素材：FinHot backfill（1645 行、~10% 失败、断点续跑到次日凌晨）+ labeler（跨天异步）
> 目标：把 A 课"会话恢复"升级为"任务级 durable execution"，能答"设计一个跑 8 小时的 agent 任务，随时可能崩"

---

## S1 问题定义：长任务的三个"随时"

agent 任务可能跑几分钟到几天。期间随时发生：**进程崩 / 机器重启 / 服务发布 / 外部依赖挂**。
naive 做法=从头重跑 → 两个罪：
1. **丢**：已完成的工作蒸发（8 小时白跑）
2. **重**：副作用重复（消息发两遍、钱扣两次、文件写两遍）

**durable execution 的定义句**：工作流的执行状态被持久化，任何时刻崩溃后能从**恰好正确的点**继续，副作用**不多不少发生一次**（工程上=at-least-once 投递 + 幂等消化）。

## S2 三个核心机制（各自防什么）

| 机制 | 原理 | 防什么 | 代价 |
|---|---|---|---|
| **Journal / 事件日志**（event sourcing） | 每个外部动作前先记 intent、完成后记结果（A⑥⑦ 已实现） | 区分"没执行"vs"执行了没记录"=未知状态 | 日志存储；恢复要读日志 |
| **Checkpoint / 快照** | 定期把完整状态序列化落盘，恢复从最近快照开始 | 日志太长时重放太慢 | 快照一致性（写一半的快照=毒） |
| **幂等设计** | 同一副作用带 idempotency key，重复执行=无效果 | at-least-once 投递下的重复 | 业务层要接受 key 语义 |

**工业标准组合**：细粒度 journal（每步）+ 粗粒度 checkpoint（每 N 步/每 M 分钟）+ 幂等兜底（外部副作用）。三者缺一：
- 无 journal → 崩溃点只能靠猜（A⑦ 的未知状态问题）
- 无 checkpoint → 长任务恢复=从第 0 步重放全部（Temporal 用事件历史重放，任务小时级时不可行，靠快照）
- 无幂等 → 恢复时的"再执行一次"变成真实重复

**你的锚点**：harness-demo 的 `session.ts`（appendFileSync JSONL：intent→exec）就是机制 1 的最小实现；A⑦ 的"只读重放 / 非只读摆状态给模型"就是机制 3 的 agent 版实现。**面试讲法：我不是背概念，是我 150 行白板 harness 里就有 journal 和幂等分类。**

## S3 重放的确定性：LLM 让这件事变难了（本课核心洞察）

Temporal 类框架的模型：**workflow 代码是确定性的，崩溃后从头重放**——外部副作用（调 API、写 DB）通过"activity"执行，其结果被记录在事件历史里，重放时**直接读记录、不再执行**。

LLM 调用的位置：它是**昂贵+非确定+无幂等**的外部副作用 → 必须当 activity 记录：

```
重放时：
  普通代码        → 重新执行（确定性，结果一样）
  已记录的 LLM 调用 → 从历史读响应（不重调！省钱+省时间+避免漂移）
  已记录的写操作   → 从历史读结果（幂等 key 兜底外部世界）
  未完成的调用    → 真正未知状态 → 按 A⑦ 规则处理
```

**面试点**："如果重放时重新调 LLM，同一个任务恢复后可能走完全不同的路——评测不可复现（E 课 S6）、成本翻倍、还可能把'已经道歉过的用户'再道歉一遍。所以 LLM 响应是**数据**，不是**计算**。"

## S4 幂等设计：工具三分法（接 A⑦，升级为工程规范）

| 类别 | 例 | 崩溃后处理 |
|---|---|---|
| 只读 | read/grep/query | 安全重放（免费） |
| 幂等写 | `set x=1`、`upsert by id`、`git commit --amend 同一树` | 重放安全（结果收敛） |
| 非幂等 | append、转账、发消息、`docker compose up` | **禁止盲重放**：idempotency key（外部 API 支持时）/ 摆状态给模型 / 人工确认 |

FinHot 实例（每个都是真实发生过的）：
- backfill 按 `source_id` 幂等：重跑=跳过已 ok 的行，failed 行重试（~10% 失败率下，幂等=断点续跑的整个基础）
- labeler 的 T+5 拉取：同一 (source_id, horizon) 只落一次（upsert 语义）
- 幽灵事故的反面教材：`compose build+up` **非幂等且无 scope**，重放=再次污染生产

## S5 Long-horizon：持久化之上的第二层问题

durable 解决"不死"，**long-horizon** 解决"长跑不烂"（JD 原词：稀疏反馈防能力衰减）：

| 问题 | 现象 | 对策 |
|---|---|---|
| 目标漂移 | 跑到第 40 步忘了第 1 步的约束（"不许动生产"） | 约束锚点：周期性把原始目标重注入上下文（A⑧ 压缩的 head 保留就是最小版）；harness 课第五节 |
| 信用分配 | 第 100 步失败，锅在第 37 步？ | 轨迹级评测（H 课 S2）；milestone 检查点+每段验收 |
| 稀疏反馈 | 只有终点有对错信号 | 中间信号：每 milestone 的确定性断言（测试/格式/不变量） |
| 资源泄漏 | 长会话上下文膨胀、句柄/子进程堆积 | 预算+压缩（A⑧）；子任务边界回收（harness 课第八节） |

FinHot 映射：backfill 1645 行跑一夜=long-horizon 批处理（日志 /tmp/finhot-backfill-direction.log、ETA 跟踪、失败分类）；labeler T+5=**跨天的里程碑**（T0→T+1→T+3→T+5 逐格推进，每格都是中间信号）。

## S6 框架版图（2026-10 核实）

| 框架 | 模型 | 一句话定位（2026-10 核实） |
|---|---|---|
| Temporal | 事件历史重放+持久化 workflow | 老牌重型，企业生产；2026 文档明确覆盖 AI/LLM workflow 模式（LLM 调用=外部 activity） |
| Restate | REST-first：持久化执行=普通 HTTP endpoint+SDK | 部署最轻，已有服务不想重写 workflow 代码时的选项；2026 有 LLM 集成文档 |
| Inngest | 事件驱动+函数步骤 | 面向已有服务的事件流编排；2026 文档把 AI agent 当一等公民（步骤函数内调 LLM=天然 durable） |
| DBOS | Postgres 内事务+Durable Functions | **你的锚点最近**：FinHot 就是 Postgres 栈，DBOS=同库加 durable 语义 |

**共同点比单家更值钱**：四家的 2026 文档都在补"LLM 调用怎么当外部副作用记录"（=S3 的 LLM 响应是数据不是计算）——行业正在把 durable execution 的确定性重放模型适配到非确定组件上，这正是本课 S3 的内容。

选型句：小系统=**自己写 journal（你已有）+ 幂等 + 定期快照**（百行代码）；上了规模=选框架，选**数据库栈重合**的那个（FinHot→DBOS/Postgres；已有 K8s→Temporal）。

## S7 demo 计划（待开课）

durable 任务 runner（扩展 harness-demo，~200 行）：
1. 任务=多步混合（只读×2 + 幂等写×1 + 非幂等"发消息"×1，mock 外部服务）
2. 中途 `kill -9`（三种注入点：intent 前 / intent 后 exec 前 / exec 后）→ 重启
3. 验证：只读步重放、幂等步重放无副作用、非幂等步**不重放**（摆状态/mock 人工确认）、消息只发一遍（idempotency key）
4. 输出恢复报告：每步的处置（replay / skip / unknown→confirm）
验收：三种崩溃点 × 各跑 3 次，副作用计数恒=1。

## 练习题库（后续提问用）

| # | 题目 | 考察 |
|---|---|---|
| 1 | "exactly-once"为什么是幻觉？给你系统的投递保证是什么？ | S2 |
| 2 | 重放时 LLM 响应从历史读 vs 重新调用，各破什么？（评测/成本/一致性） | S3 |
| 3 | 工具"发飞书通知"没有 idempotency key 支持。设计防重复方案 | S4 |
| 4 | checkpoint 写盘写到一半崩了。恢复逻辑怎么处理这个毒快照？ | S2 |
| 5 | 8 小时任务跑到 6 小时，模型开始重复前 2 小时的探索。诊断+两个修复 | S5 目标漂移 |
| 6 | FinHot backfill 的"断点续跑"用哪三个机制实现的？各自对应哪行代码逻辑？ | S2+S4 |
| 7 | 为什么 labeler 的 T+5 不直接"跑批时 sleep 5 天"？ | S5 |
| 8 | 给你 Temporal 和自己写 journal 两个选项，什么任务量/团队规模下切换？ | S6 |

## 来源与锚点

- 框架现状：Temporal/Restate/Inngest/DBOS 与 LLM 适配方向——2026-10 已核实（各家 docs 站 LLM 章节），S6 已回填
- 我的证据：harness-demo session.ts（A⑥⑦）、FinHot backfill（1645 行/~10% 失败/断点续跑，#35）、labeler T+5 状态机、幽灵事故=非幂等无 scope 的代价
- 接回：A⑥⑦（journal/未知状态）、E（可复现）、H（轨迹评测）
