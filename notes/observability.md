# D 课 · Agent 可观测（tracing / OTel GenAI / 成本归因）

> 优先级 P2（JD 显示是 2026 新热点，腾讯有专门岗——若目标平台向则提级）
> 状态：⏳ 知识结构已建，待开课
> 前置：A⑥（JSONL 日志=harness 内置的轨迹源）+ H 课（可观测=数据采集，评测=决策）
> 定位句：**可观测是评测的数据管道**——没有轨迹采得全，golden set/judge/飞轮（K 课）全是无源之水

---

## S1 为什么 agent 可观测 ≠ 微服务可观测

| 维度 | 微服务 | agent |
|---|---|---|
| 工作单元 | 请求（扁平调用链） | **轨迹**（agent→步→LLM 调用/工具调用，树形嵌套，深度不可预知） |
| 失败 | 错误码/超时 | 错误码**+语义失败**（调用全 200，答案全错） |
| 确定性 | 同输入同输出 | 非确定 → 观测的价值=**能重放、能对比两次运行** |
| 成本 | 通常不是观测维度 | **token 成本是一等指标**（和延迟、错误率并列） |
| 调试手段 | 日志+指标 | **轨迹回放**（整条 prompt+工具 I/O 重现）+ 轨迹对比（diff 两次运行） |

## S2 OTel GenAI 语义约定（面试要能报名字）

OpenTelemetry 为 GenAI 定义了语义约定（gen_ai.* 属性族）。

**状态注（面试要能答"它稳定吗"）**：截至 2026-10，gen_ai span/属性**仍是 experimental**（GenAI 语义约定 v1.39.0，2025-07 随 OpenTelemetry 规范发布 LLM/embedding/tracing 指引；stable 化 PR 在推进中）——但属性名已是事实标准，LangSmith/Langfuse/Phoenix/Helicone 全部向它收敛。面试说法："experimental ≠ 不能用：它是唯一厂商中立的轨迹格式，早用的代价是 stable 化时的属性改名，不用的代价是每个平台一套适配（N×M）。"

- **span 命名/操作类型**（`gen_ai.operation.name` 取值，已核实）：`chat` / `text_completion` / `embeddings` / `execute_tool` / `create_agent` / `invoke_agent`
- **关键属性**：`gen_ai.system`（provider：openai/anthropic/…）、`gen_ai.request.model` / `gen_ai.response.model`、`gen_ai.usage.input_tokens` / `gen_ai.usage.output_tokens`、`gen_ai.agent.name` / `gen_ai.agent.id` / `gen_ai.session.id`、`gen_ai.tool.name` + 工具参数摘要、温度等请求参数
- **为什么重要（面试点）**：语义约定=**厂商中立的轨迹格式**——harness 按它埋点，后端接 Langfuse/Phoenix/Jaeger 任意一个，不用为每个平台重写。**"OTel 之于可观测，就是 MCP 之于工具接口"——都是把 N×M 降成 N+M**

## S3 span 建模：一棵轨迹树

```
trace（=一个任务/一次会话）
└─ invoke_agent（主 agent）
   ├─ LLM call（step 1: tokens/模型/延迟/成本）
   ├─ execute_tool read_file（参数摘要/结果摘要/状态）
   ├─ LLM call（step 2）
   ├─ execute_tool bash（含退出码、耗时）
   ├─ invoke_agent（子 agent —— 子 trace 或同 trace 嵌套 span）
   └─ final（终态：完成/失败/超预算 + 原因分类）
```

设计要点：
1. **一个 trace = 一个用户可见的任务**（不是每个 LLM 调用一个 trace——粒度太碎，成本归因和回放都散架）
2. **LLM span 记全 prompt 与响应**（可回放的前提；大 payload 落对象存储，span 存指针）——注意：全量记录=隐私/合规边界，要有开关（E 课沙箱的"审计"与这里的"回放"是同一份数据的两种用途）
3. **子 agent 传播**：orchestrator 派 worker 时传 parent span context（pi-agents-team 的 worker 会话=独立 trace，靠 task id 关联——多 agent 系统的 trace 边界问题，M 课联动）
4. **重试是 child 不是新 trace**：同一逻辑调用的 3 次重试=1 个 span 内 3 个事件（或 3 个子 span 挂同父）——错误率统计才不会把重试数成失败数

## S4 成本/token 归因

- 每 LLM span 带 token×单价 → trace 成本 = 求和 → 按**用户/功能/模型/任务类型**四维聚合
- 面试要能答的四个问题：**哪个功能最烧钱？哪个用户账单异常？哪次 prompt 改动让成本涨了？哪个模型的每美元效果最差？**（前三个=归因，第四个=归因×评测=J 课路由的决策输入）
- FinHot 锚点：吞吐事故期（#11）"每天烧多少钱、每篇成本多少"当时没有归因只能算总账——**这就是"成本工程缺归因"的活案例**

## S5 调试工作流：回放 + 对比

1. **回放**：从 trace 重建"当时的世界"（prompt 全文+工具结果）→ 换提示词/换模型**单变量重跑** → diff（E 课 S6 可复现性在这里变现：温度/seed 固定才能 diff 得干净）
2. **对比**：同一任务两版 harness 各跑 N 次 → 轨迹级 diff（步数/工具序列/成本/终态）
3. **告警**：错误率/成本/步数超 P95 → 告警（agent 的"错误率"包含语义失败：judge 抽审不达标率）
4. FinHot 映射：/tmp/finhot-backfill-direction.log（进度/ETA/失败分类）= **手工版可观测**；labeler 的 skipped 原因字段=终态原因分类的生产实例

## S6 工具版图（2026-10 已核实）

LangSmith / Langfuse / Braintrust / Phoenix（Arize）/ Helicone 等（2026-10 核实均为 OTel 原生接入）——面试只需定位级："托管 vs 自托管、是否 OTel 原生、是否带 judge/评测闭环（LangSmith/Braintrust 带，纯 tracing 的只管管道）"。**选型句：先看数据管道（OTel 兼容性），再看评测闭环，最后看合规（自托管）**。
**自建最小版**：A⑥ 的 JSONL 就是最小 trace 存储——"我理解为什么 OTel 值得用，也亲手建过最小版"= 双向证据。

## 练习题库（后续提问用）

| # | 题目 | 考察 |
|---|---|---|
| 1 | 为什么"每个 LLM 调用一个 trace"是错的粒度？成本归因会怎么坏？ | S3 |
| 2 | 重试 3 次的工具调用，错误率指标怎么记才不被重试污染？ | S3 |
| 3 | 老板问"这个月 agent 功能花了多少"。列出你需要的四个维度+查询路径 | S4 |
| 4 | 轨迹里要存全量 prompt。合规团队反对。设计三档折中 | S3/S5 |
| 5 | 子 agent 跑在另一个进程/服务。trace 怎么不断？ | S3 多 agent |
| 6 | OTel GenAI 约定里 usage 属性缺失（provider 不报 token）。成本归因怎么办？ | S2+S4 |
| 7 | 语义失败（全 200 答案错）怎么进告警？和 H 课 judge 怎么分工？ | S1+S5 |
| 8 | 回放一次生产轨迹，换 prompt 重跑结果不同。排三个可疑的非确定源 | S5（E 课 S6 联动） |

## 来源与锚点（2026-10 核实回填）

- OTel GenAI：状态（experimental）/属性名/operation 取值已核实（opentelemetry.io 语义约定 v1.39.0 + GenAI LLM 指引页）；采用方=LangSmith/Langfuse/Phoenix/Helicone 官方文档
- 我的锚点：A⑥ JSONL（最小 trace 存储）、FinHot backfill 日志（手工版可观测）、labeler 原因分类、pi-agents-team 多 agent trace 边界（日常在用）
- 接回：H（采集→决策）、E（审计=同一份数据）、J（成本归因→路由）、K（飞轮的输入端）
