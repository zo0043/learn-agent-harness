# M 课 · 框架生态（懂原理不背 API）

> 优先级 P2 · 状态：⏳ 知识结构已建，待开课
> 深度定位：路线图原话"懂原理即可，不背 API"——目标是**选型判断力 + 框架边界感**
> **我的独特资产**：pi 是**日常在用+读过文档+跑过 RPC 模式（pi-agents-team workers）的框架**——多数候选人对框架只有 API 级认知

---

## S1 框架三族（坐标系）

| 族 | 代表 | 给的是什么 | 藏的是什么 |
|---|---|---|---|
| **Harness 级**（完整 agent 运行时） | pi、Claude Code（及其 SDK 化） | loop+工具+会话+权限+子代理+技能+TUI/RPC——**整个 harness 课第十节的现成实现** | 每层的默认选择（loop 形态/压缩策略/恢复规则）——用得不深=知其然 |
| **编排库**（代码里组装 agent） | LangGraph（图/状态/checkpoint）、OpenAI Agents SDK（handoffs/guardrails/sessions）、Claude Agent SDK | 原语：状态机/节点/边、agent 交接、会话持久化 | 抽象层的默认假设（状态怎么序列化、恢复语义）——图模型不是万能的 |
| **平台**（低代码/托管） | Dify/Coze/n8n 等 | 拖拽流程+托管 | 几乎全部（自定义 loop 行为难） |

**面试定位句**："框架=**预制件+默认决策**。选框架是选一组你不用重新论证的决策；放弃框架是你发现某个默认决策错了，且你愿意为它付整个自研的成本。"

## S2 框架给你什么 vs 框架藏什么（核心辨析题）

**给**：正确的默认值（流式解析/重试/会话持久化——A 课手写的每一层都是框架的"藏"）+ 生态（MCP 支持/工具市场/社区）+ 演进（安全补丁/新模型适配）。
**藏**：A 课 10 节的每一层决策都藏在某行框架代码里——**读源码才能把"藏"变"给"**。
**"什么时候不用框架"（标准反问，要能答）**：
- 控制循环本身是产品差异（如 FinHot 的 6 次调用固定结构+状态机=workflow 不是 agent loop，编排库够用，harness 级框架反而重）
- 框架的默认恢复/权限语义与你的安全模型冲突（如默认 allow 的工具面 vs 你的默认 deny）
- 依赖锁定（框架 API 漂移/停更）> 自维护成本
- 教学/面试白板场景（A 课本身就证明了 150 行能覆盖核心层）

## S3 各家要点（定位级，2026-10 已核实）

| 框架 | 一句话架构 | 面试谈资 |
|---|---|---|
| **pi**（earendil/badlogic 谱系，1.1.0） | 极简核心+扩展系统（extensions/skills/TUI）；会话=JSONL（同 A⑥ 设计）；RPC 模式可当 worker 进程 | **我日常用它+用它跑多 agent（pi-agents-team）**；扩展机制=JS/TS 直接进运行时（skill 加载、工具扩展）——框架即文档 |
| **Claude Agent SDK** | Claude Code 的编程化：把完整 harness 当库用（subagents/hooks/MCP/权限模式/skills/sessions） | **2025-09 由 Claude Code SDK 改名而来**（Python+TypeScript，Apache 2.0）；"Claude Code 的机制=官方参考实现"，SDK=机制的可编程面 |
| **OpenAI Agents SDK** | **Swarm 的官方后继**（2025 GA，Apache 2.0）：agents+handoffs（交接）+guardrails（输入/输出校验）+sessions（内置记忆）+tracing | handoffs=多 agent 的"函数调用"形态，与 orchestrator-worker 对比着讲（C 课 S3）；guardrails=I 课 Guardrails 的框架版 |
| **LangGraph** | 1.x 系（2025-10 出 1.0 alpha，随后稳定 1.0.x，当前 1.0.1；唯一 breaking 面=create_react_agent 废弃、迁入 langchain.agents.create_agent）：显式图：节点（函数）+边（条件）+状态（typed schema）+checkpoint 持久化 | 图=把 C 课 S3 的 workflow 模式显式化；checkpoint=G 课 durable 的框架版；"为什么不用图"=自由 agent 任务分解不可预知，画不出图 |
| **AAIF**（Agentic AI Foundation，Linux 基金会旗下）[2026现行] | 中立基金会治理主场：2025.12 Anthropic 将 MCP 捐给 AAIF，A2A 同入（A2A **TSC 共 8 席**：Google、Microsoft、Cisco、AWS、Salesforce、ServiceNow、SAP、IBM；AAIF 自身技术委员会另为 8 家） | "MCP 完成事实标准→基金会治理跃迁——应用端唯一有真实规模的互操作标准"；https://modelcontextprotocol.io/specification/versioning + https://a2a-protocol.org/latest/ |
| **MCP Registry**（官方 registry）[2026现行] | 官方 registry 仍在 **preview**（未 GA）：DNS 命名空间 + server.json + REST 发现；Anthropic/GitHub/Microsoft/PulseMCP 背书 | 生态规范化真实但早期；registry≠安全保证（I 课 S3/S4 同一原则）；https://modelcontextprotocol.io/registry |
| **computer use / GUI agent** [2026现行] | 升为一等（高重要度候选域信号）：Claude Code 扩到 desktop/mobile/cloud/computer use；OpenAI 设 Computer Use/Context Research 专岗 | 面试谈资："GUI agent 不再是边角方向"；追问见 C 课 S7（权限与观察）；https://code.claude.com/docs/en/agent-sdk/overview（OpenAI 专岗据本地 jd-research/ashby_openai.json） |
| **OpenAI Codex** [2026现行] | 由 CLI 转向 **agent 基础设施**：hosted/self-hosted sandbox+预热、workspace agents、Secure MCP Tunnel、SandboxAgent（Agents SDK：handoffs/guardrails/100+ 模型）；**AgentKit=低代码入口** | "OpenAI 在把 Codex 做成平台而不是产品"；https://developers.openai.com/codex |

**共同点（比单家更值钱的面试点）**：四家都在解同一组问题——会话持久化（JSONL/checkpoint）、子代理边界（上下文隔离）、工具标准化（MCP）、权限/护栏（guardrails/hooks/policy）。**框架生态的收敛=行业问题定义的收敛**——我用 A 课从零写过这些层，所以能看出四家在做同一件事。

## S4 pi 深潜（我的差异化章节：源码级用户故事）

别人讲框架："我用过 LangGraph 做了个 demo。"
我讲框架："**pi 是我每天干活的主力 harness**，我能讲到实现层：
- 会话=JSONL 事件日志，上下文由日志确定性重建（=A⑥ 的设计，harness-demo 是我按它复现的）
- 扩展系统：TS 扩展直接进运行时（quiz/md-log 扩展是我装过的）；skill=按需加载的指令包
- **RPC 模式**：pi-agents-team 的 worker 就是 `pi --mode rpc` 子进程——我跑过 orchestrator+7 类 profile 的多 agent 编排（路径范围/final_answer 契约/relay 问答）
- Magic Context：压缩/归档/检索的上下文工程实装（harness 课第五节的活教材，F 课记忆系统的活教材）"
**这个故事的面试价值**：把"框架使用者"升级成"harness 机制的活样本"——每个框架话题都能落回自己的日常实操。

## S5 选型面试话术

"选框架我看四层：① 控制循环模型（自由 loop vs 图 vs 固定 workflow——先匹配任务形态 C 课 S3）② 持久化/恢复语义（G 课三机制各做多少）③ 权限/护栏模型（默认 deny? 审批粒度? E 课）④ 可观测出口（OTel? 原始轨迹导出? D 课）。API 顺手度最后才看——**前四层错了，API 再好是走错路**。"

## 练习题库（后续提问用）

| # | 题目 | 考察 |
|---|---|---|
| 1 | "LangGraph 是不是比自研 loop 好？"——给出让它成立的两个条件+两个不成立的条件 | S2 |
| 2 | pi 的 JSONL 会话 vs LangGraph checkpoint：恢复语义差在哪？ | S3（G 课联动） |
| 3 | 一个需求："客服 agent，10 个意图分支，分支内 2-3 步固定操作"。选哪族框架？为什么不是 harness 级？ | S1/S2 |
| 4 | 框架默认把工具结果直接进上下文。你的安全模型要求"工具结果隔离渲染"。改框架还是弃框架？判据？ | S2 |
| 5 | 用 pi 跑过的 pi-agents-team 编排里，worker 之间的 trace 怎么关联？框架给了什么、缺什么？ | S4（D 课联动） |
| 6 | Claude Agent SDK 和自研 harness 的边界在哪——什么功能你宁可自研也不等 SDK？ | S3 |
| 7 | 框架停更了，你在上面有 3 年生产系统。迁移决策树？ | S2 锁定 |
| 8 | 为什么"编排库"（LangGraph 类）和"harness 级"（pi 类）的恢复默认值会不同？ | S1/S3 |

## 来源与锚点（2026-10 核实回填）

- 各家现状：Claude Agent SDK（2025-09 改名，Python+TS）/ OpenAI Agents SDK（Swarm 后继，GA）已核实（Anthropic/OpenAI 官方博客+仓库）；LangGraph 1.0 已核实（2025-10 alpha → 稳定 1.0.x，GitHub releases + langchain 官方博客；2026-10-11 复核）——S3 已回填
- 我的锚点：pi 1.1.0 日常（#38/#39 环境实践）、pi-agents-team 多 agent（orchestrator/worker/RPC，本会话正在用）、A 课（"框架藏什么"的实证）
- 实操已落地：framework-demo/（Claude Agent SDK 冒烟+四能力：agent/subagent/权限/会话，指向本地双格式代理）——S3'框架给你什么/藏什么'的活样本
- 对照 harness-demo 的踩坑实证见 framework-demo/README.md（2026-10-11：allowedTools 裸名会抢在 canUseTool 之前、子代理对话默认不出主流）
- 接回：C（形态选型）、G（checkpoint）、D（可观测出口）、I（MCP 支持面）、F（Magic Context）
