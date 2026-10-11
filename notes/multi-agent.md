# N 课 · 多智能体编排

> P2 · ⏳ 知识结构已建（2026-10-11）· 前置：C 课 S3 + harness 课 §8 + A 课 ⑥⑧
> 定位：一等知识域；标注 [稳定历史]/[2026现行]，URL 见文末

---

## S1 何时多智能体（何时不用）

三层判断，每层可答"不"：
1. **要不要 agent**：OpenAI 指南 [稳定历史]——规则式失效才建 agent；失败必须停机、交还用户。
2. **单还是多**：Anthropic [稳定历史]——从最简单的可组合模式起步，多数任务"单次调用+检索"就够；workflow（预定义路径）与 agent（模型自决）不同物种。
3. **值不值**：≈15x chat token、token 解释 80% 性能方差——"多=好"大头是 token 买来的，只对**高价值、可并行**任务划算。

判断句：先单后多，可并行且高价值才并行。

## S2 架构模式

| 模式 | 结构 | 适用 |
|---|---|---|
| **orchestrator-worker**（hub-and-spoke） | 中央 agent 分解派工汇总 | 分解不可预知 |
| **pipeline** | 固定序列 A→B→C | 步骤可确定拆分 |
| **层级** | 多层 orchestrator | 需二次分解 |
| **blackboard** | 共享状态读写、互相触发 | 强耦合、涌现 |
| **debate-judge** | 独立生成、judge 裁决 | 要一致性 |

Anthropic 研究系统解剖 [稳定历史]：orchestrator + 并行 researchers（独立上下文）+ lead 汇总；内部评测高 **+90.2%**（但 15x token）；编排者必须"教"委派：三要素=**目标/输出格式/边界**。

## S3 通信与上下文隔离

反直觉发现 [稳定历史→2026现行]：评审 agent 与编码 agent **零共享上下文**时评审效果最好——独立上下文=独立判断，不被编码者思路锚定。Devin Review：平均每 PR 抓 2 个 bug、58% 严重级。
设计规则："通信"默认传**产物**，不传上下文。

A2A 一句话卡 [2026现行]：与 MCP 同入 AAIF 治理；官方"不规定子 agent 通信与工具调用"，企业互操作标准、采用慢。
面试一句："AAIF 治理下与 MCP 互补（agent↔agent vs agent↔工具），企业采用早期——我们尚未引入，但调研过。"

## S4 一致性与写：单线程写

Cognition 立场演化 [稳定历史→2026现行]：
- 2025「Don't Build Multi-Agents」：每个行动携带隐式决策，并行写者必然冲突
- 2026 确认：唯一能工作的模式是"**多智能体出智力、写操作保持单线程**"

分水岭：并行只在"**写单线程、读多路**"时产出一致工件。读写分治——读（检索/分析/评审/候选）多路并行；写收敛单一 agent，或 worktree 隔离/串行合并（harness 课 §8.2：独立上下文≠文件隔离）。

## S5 成本与评测

Token 经济学：agent ≈4x chat、多智能体 ≈15x；token 解释 80% 方差 → "更大模型 vs 更多 agent"是 token 经济学问题；预算是一等公民（A 课 ⑧）。

多智能体评测多一层：**逐 agent 局部指标加不出系统指标**（worker 都好、汇总照样错）；评估的是 harness+模型整个系统（harness 课 §9.1）：
- 整体级：任务级 pass@k + 轨迹级（C 课 S4）
- 逐 agent 级：成本归因 + 失败归因（分解错还是执行错）
- 纪律：先端到端评测再拆逐 agent——无基线分不清"多智能体差"还是"任务难"

## S6 框架对照（多智能体原语的三条路）

| 维度 | Claude Agent SDK | OpenAI Agents SDK | LangGraph |
|---|---|---|---|
| 原语 | subagents | handoffs（交接） | supervisor（图节点） |
| 会话 | sessions continue/resume/fork | sessions（内置记忆） | checkpoint（持久化/回放） |
| 定位 | harness 当库用（Claude Code 产品化） | Swarm 后继（guardrails） | 编排库（1.0.1，图+HITL） |

读法：三条路=子循环（垂直分叉）/交接（水平移交）/图调度（显式控制）；问题集相同（持久化/子代理边界/工具标准化/权限护栏）——"框架收敛=行业问题定义收敛"是面试高分句（M 课 S3）。

## S7 设计练习：给 harness-demo 加子代理

给 harness-demo（A 课单 loop）加"研究子代理"——并行检索文件、只回摘要。四决策：
1. **loop 嵌套 vs 新进程**：首选进程内嵌套（独立上下文，复用 ⑥ 会话机制）；要权限隔离/独立崩溃域才升级新进程（pi RPC 模式，M 课 S4）。
2. **轨迹记录**：复用 demo.jsonl 事件类型，子段加 `subagentId`；父进程只记"委派请求+摘要返回"（1-2k token），完整子轨迹落独立文件（A 课 ⑦）。
3. **权限继承**：子 policy ⊆ 父 policy——父为上界只收紧（如 researcher 只读工具）；policy 是进程级门（harness 课 §7），子代理不豁免。
4. **上下文传递**：只传"目标+输出契约"（S2 教委派三要素），不传父全量轨迹；返回=约束摘要。

## 与已有知识的衔接

- C 课 S8（范式速查）：ReAct 等是**单 agent** 范式——"怎么想"（C S8）×"谁和谁说话"（本课），两维正交
- harness 课 §8（子代理：最后才选）：本课=它的外部验证与升级（15x/零共享评审/单线程写）
- A 课 ⑥⑧：JSONL 轨迹=子代理记录地基；预算/压缩=token 经济学执行层
- H 课（评测）：整体 vs 逐 agent 接 H S4 轨迹评测、H S6 CI 门禁
- M 课 S3（各家要点）：S6 三列对照="子代理边界"共同点展开

## 练习题库（后续提问用）

| # | 题目 | 考察 |
|---|---|---|
| 1 | "上 5 个 agent 为何又慢又贵"——三句话答 | S1+S5 |
| 2 | 评审 agent 为何零共享上下文最好？最小输入？ | S3 |
| 3 | 设计评审循环：哪写单线程、哪读多路 | S4+S7 |
| 4 | handoffs/subagents/supervisor：各对什么任务形态 | S6 |

## 来源与锚点（自 industry-2026.md 复制，一手源已实抓）

- Anthropic [稳定历史]：最简单起步/workflow vs agent；4x/+90.2%/15x/80%/教委派（研究系统口径 §1.2/§4.4） → anthropic.com/engineering/{building-effective-agents, multi-agent-research-system}
- Cognition [稳定历史→2026现行]：隐式决策/并行写冲突→单线程写；Devin 2 bug/58% → cognition.ai/blog/{dont-build-multi-agents, multi-agents-working}
- OpenAI [稳定历史]：规则式失效才建 agent/失败停机 → cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
- 框架 [2026现行/稳定历史]：code.claude.com/docs/en/agent-sdk/overview（subagents/sessions continue-resume-fork） · developers.openai.com/codex（handoffs） · github.com/langchain-ai/langgraph（1.0.1） · a2a-protocol.org/latest/（A2A AAIF/TSC 七厂）
