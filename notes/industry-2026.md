# 行业前线调研（2026-10）

> 调研素材（非课程正文）。两轮外部调研（2026-10-11），核心论断均实抓官方一手源；2025 前时间线节点为公认公开事件。
> 用途:1 站点「2026 前线」「资深分水岭」板块底稿 2 MCP 与供应链安全 / 框架生态 / 系统设计 更新输入 3 面试谈资弹药库。

## 一、头部团队工程经验（6 条）

1. [稳定历史] Anthropic 服务数十团队后的结论：永远从最简单的可组合模式起步，多数任务"单次调用+检索"就够；workflow（预定义路径）与 agent（模型自主决策）是不同物种，只在需要模型驱动决策时才上后者。https://www.anthropic.com/engineering/building-effective-agents
2. [稳定历史] Anthropic 多智能体研究系统：多智能体内部评测比单智能体高 90.2%，但 token 用量解释 80% 的性能方差，多智能体消耗约 chat 的 15 倍 token——只对高价值、可并行任务划算；编排者必须"教"委派（目标/输出格式/边界）。https://www.anthropic.com/engineering/multi-agent-research-system
3. [2026现行] Anthropic Managed Agents（2026.4）：harness 编码了"模型做不到"的假设，且假设随模型升级腐烂（Sonnet 4.5 的 context-anxiety 上下文重置在 Opus 4.5 上成了死重）；解法是把 session/harness/sandbox 像操作系统虚拟化硬件那样抽象成稳定接口，凭据结构性地不可被沙箱触及。https://www.anthropic.com/engineering/managed-agents
4. [稳定历史→2026现行] Cognition 立场演化：2025「Don't Build Multi-Agents」（行动携带隐式决策，并行写必然冲突）→ 2026 确认唯一能工作的模式是"多智能体出智力、写操作保持单线程"；反直觉发现：代码评审循环在评审 agent 与编码 agent 零共享上下文时效果最好（Devin Review 平均每 PR 抓 2 个 bug，58% 严重级）。https://cognition.ai/blog/dont-build-multi-agents + https://cognition.ai/blog/multi-agents-working
5. [2026现行] Cognition 云 agent 基建：容器共享内核=安全威胁，每会话需 microVM（其 hypervisor 工程做了 1 年+）；SDLC 异步空档（等 CI/评审，分钟到天）要求 hypervisor 级整机快照；编排、权限继承+防篡改审计、集成是三个各自多季度的独立工程（例：Stripe 内部 MCP server 有 400+ 工具）。https://cognition.ai/blog/what-we-learned-building-cloud-agents
6. [稳定历史] OpenAI 官方指南：只在规则式方案失效时（复杂判断/规则难维护/非结构化数据）才建 agent；失败时必须停机并把控制权交还用户；护栏分层，按工具风险分级（只读/写、可逆性、财务影响）触发暂停或升级人工。https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf

## 二、生态与标准（2026 年中）

1. [2026现行] MCP 完成"事实标准→基金会治理"跃迁：2025-12 Anthropic 将其捐给 Linux 基金会旗下 Agentic AI Foundation（AAIF），最新 spec 2026-07-28，是应用端唯一有真实规模的互操作标准。https://modelcontextprotocol.io/specification/versioning
2. [2026现行] 规模（Wikipedia reportedly 口径，无官方一手数字）：2026 年中 1 万+ MCP server 跑在生产、官方 SDK 月下载 9700 万+；OpenAI/Google/Microsoft 全接入，Salesforce Agentforce 累计处理 450 万 MCP 调用。
3. [2026现行] 官方 MCP Registry 仍在 preview（未 GA），Anthropic/GitHub/Microsoft/PulseMCP 背书，DNS 命名空间 + server.json + REST 发现——生态规范化真实但早期。https://modelcontextprotocol.io/registry
4. [2026现行] "变味"信号是治理滞后而非路线失败：NSA 批评"扩散速度超出安全模型"（CVE-2025-6514 mcp-remote RCE/CVSS 9.6），spec 已补安全要求；协议三分：MCP=agent↔工具、A2A=agent↔agent、AG-UI=agent↔前端，MCP 定位收敛不再包打天下。
5. [2026现行] A2A 同入 AAIF，**TSC 共 8 席**（Google、Microsoft、Cisco、AWS、Salesforce、ServiceNow、SAP、IBM）；官方明示"不规定子 agent 通信与工具调用"——企业互操作标准、采用慢，应用端"知道即可"。https://a2a-protocol.org/latest/
6. [2026现行] Claude Agent SDK=Claude Code harness 的产品化（loop 当库用：subagents/hooks/MCP/权限/sessions continue-resume-fork/会话外存）；2026 Claude Code 扩到 desktop/mobile/cloud/computer use，是目标岗最近的"参考实现+SDK"。https://code.claude.com/docs/en/agent-sdk/overview
7. [2026现行] OpenAI Codex 由 CLI 转向 agent 基础设施：hosted/self-hosted sandbox+预热、workspace agents、Secure MCP Tunnel、SandboxAgent（Agents SDK：handoffs/guardrails/100+ 模型）；AgentKit 为低代码入口。https://developers.openai.com/codex
8. [稳定历史] LangGraph 1.x 稳定（1.0.1），定位编排库（显式图+checkpoint+HITL，评测靠 LangSmith）；四框架收敛于同一问题集（会话持久化/子代理边界/工具标准化/权限护栏）——"框架收敛=行业问题定义收敛"是面试高分句。https://github.com/langchain-ai/langgraph

**必须会用**：MCP + 目标岗所属阵营一家 harness/SDK（Codex 系→Agents SDK+SandboxAgent，Claude 系→Agent SDK）；LangGraph 定位级；A2A/AG-UI 一句话。

## 三、LLM 演化时间线（agent 开发者视角，12 节点，★=面试谈资必需）

- 2023.03 GPT-4 发布（32k 上下文）——agent 能力起点。
- 2023.06★ OpenAI function calling 发布——工具调用开始标准化，一切 agent 的协议地基。
- 2023.10 GPT-4 Turbo 128k——上下文窗口 4 倍，长任务成为可能。
- 2024.02 Gemini 1.5 Pro（1M 上下文）——长上下文时代开启。
- 2024.04★ Claude 3 家族 + Anthropic Tool Use GA——工具调用跨厂商趋同，agent 进入生产。
- 2024.09★ o1 发布——推理模型开启：agent 设计从"多调用"转向"少而深"，重试/投票类模式价值下降。
- 2024.11★ MCP 发布（Anthropic）——工具/连接器协议标准化，"AI 的 USB-C"。
- 2025.02–04 Claude Code 预览→GA、OpenAI Agents SDK——coding agent 产品化 + SDK 层成型。
- 2025.03–04★ OpenAI、Google 先后采纳 MCP——de facto 标准确立。
- 2025.09 Claude Sonnet 4.5（SWE-bench ~77%）——长时程自主编码跨过质量门槛，agent 用量爆发。
- 2026.04 Anthropic Managed Agents——harness 接口化/虚拟化，"为尚未写出的程序"设计系统。
- 2026.07 MCP 最新 spec 修订（2026-07-28：订阅、多轮请求、授权服务器发现等）——协议仍在快速演进。

## 四、资深 vs 初级分水岭（8 条 + 为什么影响走向）

1. **context rot（长上下文衰减）**：注意力预算受 n² 关系约束，上下文越长召回越差，要"最小高信号 token 集"而非塞满窗口 → 决定 compaction/子代理/记忆文件的设计；初级第一错觉是"窗口大就能全塞"。https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
2. **工具粒度与描述质量**：工具定义就是契约——名称/文档精确、功能不重叠、返回 token 高效 → 一个烂工具污染整条轨迹；资深把工具设计当一等公民而非附属品。https://www.anthropic.com/engineering/writing-tools-for-agents
3. **错误路径优先于快乐路径**：失败时停机交还用户；容器/harness 崩溃=可重试的工具错误，session 日志支持冷启动（wake+getSession 恢复）→ agent 成功率由错误恢复决定，初级只设计 happy path。
4. **token 经济学与延迟预算**：agent 约 4 倍、多智能体约 15 倍 chat token，token 用量解释 80% 方差 → 决定产品能否商业化，也决定"更大模型 vs 更多 agent"的架构选择。
5. **HITL 审批与结构性安全边界**：按工具风险分级触发暂停/人工升级；凭据放 vault、agent 永不可触 token（MCP 代理代签）→ 信任边界决定部署范围（只读→写→生产）和提示注入风险上限；靠 prompt 约束安全是初级做法。
6. **可观测→可改进闭环**：可重放的事件日志（getEvents() 位置切片）+ 逐轨迹 eval + 控制台逐步观察 agent → agent 迭代速度由失败归因能力决定，资深团队与 demo 团队的本质差距。
7. **harness 假设会腐烂**：为 Sonnet 4.5 打的补丁在 Opus 4.5 上成了死重 → 资深为"尚不存在的模型"写稳定接口、实现可自由更换；初级为"当前模型"写死逻辑。
8. **决策一致性（单线程写）**：每个行动携带隐式决策，并行写者产出风格/边界冲突的碎片 → 并行只在"写单线程、读多路"时产出一致工件，2026 年多智能体实践的真实分水岭。

## 五、候选域信号（外部验证后的定级）

- **computer use / GUI agent = 升为一等**（高重要度）：Claude Code computer use/Chrome/iOS 模拟器；OpenAI 设 Agent Post-Training、Computer Use Research 专岗 → 建议并入 系统设计主线，备"GUI agent 的权限与观察怎么处理"追问。
- **A2A 身份互操作 = 真实但热度低于 MCP** → 维持观察级，备一句："AAIF 治理下与 MCP 互补（agent↔agent vs agent↔工具），企业采用早期，我们尚未引入"——主动说"未引入"即显示做过功课。
- **deep research = 本轮无协议级新动作**，属应用形态层，知道即可。
- **生成式 UI = AG-UI 与 MCP/A2A 并列为第三支柱**（agent↔前端），知道即可。

## 六、对面试的直接含义（与 interview-bank 交叉验证）

1. 主战场核心 = "设计一个 coding agent"（与 interview-bank §2 一致）；2026 新主线 = agent 基础设施（沙箱隔离 + 评测闭环，OpenAI 连 Context/Computer Use 都设了专职研究岗）→ 答题时主动带沙箱与评测闭环，比只画 loop 高半档。
2. OpenAI 2026 岗位拆分 = 追问方向的直接证据：Codex Core Agents（harness）、Computer Use Research、Context Research、Agent Post-Training、Agent Security、Agent Infrastructure。
3. 实操题典型 = 20 分钟白板最小 agent + 崩溃/恢复模式讲解（本地 whiteboard/ + harness-demo 四模式已备）。
4. 行为题考"可预测处事方式"：Action="我"+决策链、Result 带数字、Learn 出可迁移规则；真实生产事故→机制的故事是市场顶配（幽灵事故）。
5. 英文面经三件套：系统设计 + pair coding + 快问快答；agent 系统设计核心考点="为什么是 agent 不是 workflow"+ 评测设计取舍。
6. 新面经边际收益低 → 时间投题库 §6 四个 🟡：sandbox-demo 源码 / OTel 埋点 / MCP 投毒演示 / 框架实操。

## 来源清单（本次实抓）

- anthropic.com/engineering/{building-effective-agents, multi-agent-research-system, effective-context-engineering-for-ai-agents, managed-agents}
- cognition.ai/blog/{dont-build-multi-agents, multi-agents-working, what-we-learned-building-cloud-agents}
- cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
- modelcontextprotocol.io/{specification/versioning, registry, specification/2026-07-28}
- a2a-protocol.org/latest/ · docs.ag-ui.com · code.claude.com/docs/en/agent-sdk/overview · developers.openai.com/codex · github.com/langchain-ai/langgraph
- en.wikipedia.org/wiki/Model_Context_Protocol（规模数据 reportedly 口径）
- 本地：jd-research/ashby_openai.json（815 条 OpenAI 真实岗位）

## 已知缺口 / 待复核

- A2A spec 版本号、AgentKit GA 状态未取得一手源（页面 JS 渲染）
- 英文面经帖（LevelUpTutor/Blind 2025-2026）未逐帖复核（搜索轮数上限）
- "writing tools for agents" URL 由引用推断，正文要点引自已验证的上下文工程文章
- 2025 前时间线节点日期来自记忆（公认史实，如需逐条 URL 复核可再补一轮）
