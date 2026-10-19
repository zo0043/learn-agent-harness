# 行业前线调研(2026-10)

> 调研素材（非课程正文）。两轮外部调研（2026-10-11），核心论断均实抓官方一手源；2025 前时间线节点为公认公开事件。
> 用途:1 站点「2026 前线」「资深分水岭」板块底稿 2 MCP 与供应链安全 / 框架生态 / 系统设计 更新输入 3 实战谈资弹药库。

---

## 预备知识（怎么读这份调研——横向资产，不是课程正文）

- **课程依赖（prereqs）**：无硬前置——本课是 P4 收口横向资产（`isHorizontal`），建议先修完前 16 课再读；它的作用是**用「官方一手源 + 核实台账」交叉验证前面各课引用的时效判断**（哪些还能引用、哪些已过时）。
- **技能门槛**：会读「结论 → 出处 → 标注」三元组即可。`[稳定历史]` = 多年未变、可放心引用；`[2026现行]` = 时效强，引用前先过一遍文末「U-26 核实台账」。
- **唯一门槛不是技能，是时效判断**：「这条结论现在还是这样吗？」——截断时间点已标在文首与核实台账（**2026-10-13 复核**）；每条 [2026现行] 断言的判定三态（确认 / 需修正 / 无法确认）见 §U-26，命令（`curl` / `npm view --cache <新目录>`）可重跑，**不凭记忆背书**。
- **可机器核对（本资产不含 clone 判据，用「出处重跑」代替）**：六节每条 [2026现行] 断言均带官方 URL，核实台账给出可复跑命令，重跑一致 = 出处仍成立。改稿时**只更新台账与标注、不臆造新事实**——这是「调研实录」区别于「课程推理」的纪律。

---

## 一、头部团队工程经验（6 条）

1. [稳定历史] Anthropic 服务数十团队后的结论：永远从最简单的可组合模式起步，多数任务"单次调用+检索"就够；workflow（预定义路径）与 agent（模型自主决策）是不同物种，只在需要模型驱动决策时才上后者。https://www.anthropic.com/engineering/building-effective-agents
2. [稳定历史] Anthropic 多智能体研究系统：多智能体内部评测比单智能体高 90.2%，但 token 用量解释 80% 的性能方差，多智能体消耗约 chat 的 15 倍 token——只对高价值、可并行任务划算；编排者必须"教"委派（目标/输出格式/边界）。https://www.anthropic.com/engineering/multi-agent-research-system
3. [2026现行] Anthropic Managed Agents（2026.4）：harness 编码了"模型做不到"的假设，且假设随模型升级腐烂（Sonnet 4.5 的 context-anxiety 上下文重置在 Opus 4.5 上成了死重）；解法是把 session/harness/sandbox 像操作系统虚拟化硬件那样抽象成稳定接口，凭据结构性地不可被沙箱触及。https://www.anthropic.com/engineering/managed-agents
4. [稳定历史→2026现行] Cognition 立场演化：2025「Don't Build Multi-Agents」（行动携带隐式决策，并行写必然冲突）→ 2026 确认唯一能工作的模式是"多智能体出智力、写操作保持单线程"；反直觉发现：代码评审循环在评审 agent 与编码 agent 零共享上下文时效果最好（Devin Review 平均每 PR 抓 2 个 bug，58% 严重级）。https://cognition.ai/blog/dont-build-multi-agents + https://cognition.ai/blog/multi-agents-working
5. [2026现行] Cognition 云 agent 基建：容器共享内核=安全威胁，每会话需 microVM（其 hypervisor 工程做了 1 年+）；SDLC 异步空档（等 CI/评审，分钟到天）要求 hypervisor 级整机快照；编排、权限继承+防篡改审计、集成是三个各自多季度的独立工程（例：Stripe 内部 MCP server 有 400+ 工具）。https://cognition.ai/blog/what-we-learned-building-cloud-agents
6. [稳定历史] OpenAI 官方指南：只在规则式方案失效时（复杂判断/规则难维护/非结构化数据）才建 agent；失败时必须停机并把控制权交还用户；护栏分层，按工具风险分级（只读/写、可逆性、财务影响）触发暂停或升级人工。https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf

## 二、生态与标准（2026 年中）

1. [2026现行，2026-10-12 复核确认] MCP 完成"事实标准→基金会治理"跃迁：2025-12 Anthropic 将其捐给 Linux 基金会旗下 Agentic AI Foundation（AAIF），最新 spec 2026-07-28（官方 versioning 页 "The current protocol version is 2026-07-28"），是应用端唯一有真实规模的互操作标准。https://modelcontextprotocol.io/specification/versioning
2. [2026现行] 规模（Wikipedia reportedly 口径，无官方一手数字）：2026 年中 1 万+ MCP server 跑在生产、官方 SDK 月下载 9700 万+；OpenAI/Google/Microsoft 全接入，Salesforce Agentforce 累计处理 450 万 MCP 调用。
3. [2026现行] 官方 MCP Registry 仍在 preview（未 GA），Anthropic/GitHub/Microsoft/PulseMCP 背书，DNS 命名空间 + server.json + REST 发现——生态规范化真实但早期。https://modelcontextprotocol.io/registry
4. [2026现行] "变味"信号是治理滞后而非路线失败：NSA 批评"扩散速度超出安全模型"（CVE-2025-6514 mcp-remote RCE/CVSS 9.6），spec 已补安全要求；协议三分：MCP=agent↔工具、A2A=agent↔agent、AG-UI=agent↔前端，MCP 定位收敛不再包打天下。
5. [2026现行，2026-10-19 复核] A2A 于 **2026-08-27** 以 Growth Stage 项目加入 AAIF（**不是** 2025-12：MCP 才是 2025-12-09 AAIF 成立时的创始项目，两者不同时）；**TSC 共 8 席**（AWS、Cisco、Google、IBM Research、Microsoft、Salesforce、SAP、ServiceNow）；官方明示"不规定子 agent 通信与工具调用"——企业互操作标准、采用慢，应用端"知道即可"。https://a2a-protocol.org/latest/blog/2026/08/27/a-new-chapter-for-a2a-joining-the-agentic-ai-foundation/ ＋ https://a2a-protocol.org/latest/
6. [2026现行] Claude Agent SDK=Claude Code harness 的产品化（loop 当库用：subagents/hooks/MCP/权限/sessions continue-resume-fork/会话外存）；2026 Claude Code 扩到 desktop/mobile/cloud/computer use，是目标岗最近的"参考实现+SDK"。https://code.claude.com/docs/en/agent-sdk/overview
7. [2026现行] OpenAI Codex 由 CLI 转向 agent 基础设施：hosted/self-hosted sandbox+预热、workspace agents、Secure MCP Tunnel、SandboxAgent（Agents SDK：handoffs/guardrails/100+ 模型）；AgentKit 为低代码入口。https://developers.openai.com/codex
8. [稳定历史 + 2026-10-13 复核] LangGraph 1.x 系：1.0（2025-10）→ 1.0.x 稳定为**历史口径**；~~（1.0.1）~~ ~~（1.4.21）~~ **截至 2026-10-13 复核 registry latest = 1.5.0**（time.modified 2026-10-12T23:19:38.982Z，全新缓存 `npm view` 独立复核；版本演变：1.0.1→1.4.21（2026-10-12 复核）→1.5.0（2026-10-13 复核），命令/来源见文末核实台账第 4/4a 行）。定位编排库（显式图+checkpoint+HITL，评测靠 LangSmith）；四框架收敛于同一问题集（会话持久化/子代理边界/工具标准化/权限护栏）——"框架收敛=行业问题定义收敛"是实战高分句。https://github.com/langchain-ai/langgraph

**必须会用**：MCP + 目标岗所属阵营一家 harness/SDK（Codex 系→Agents SDK+SandboxAgent，Claude 系→Agent SDK）；LangGraph 定位级；A2A/AG-UI 一句话。

## 三、LLM 时间线（agent 开发者视角，12 节点，★=实战谈资必需）

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

## 来源清单（本次实抓）

- anthropic.com/engineering/{building-effective-agents, multi-agent-research-system, effective-context-engineering-for-ai-agents, managed-agents}
- cognition.ai/blog/{dont-build-multi-agents, multi-agents-working, what-we-learned-building-cloud-agents}
- cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
- modelcontextprotocol.io/{specification/versioning, registry, specification/2026-07-28}
- a2a-protocol.org/latest/ · docs.ag-ui.com · code.claude.com/docs/en/agent-sdk/overview · developers.openai.com/codex · github.com/langchain-ai/langgraph
- en.wikipedia.org/wiki/Model_Context_Protocol（规模数据 reportedly 口径）
- 本地：jd-research/ashby_openai.json（815 条 OpenAI 真实岗位）

## 已知缺口 / 待复核

- ~~A2A spec 版本号未取得一手源~~ **2026-10-12 已补**：`a2a-protocol.org/latest/` 直连 HTTP 200（Linux Foundation 版权 2026）；`a2aproject/A2A` GitHub releases 最新 spec 发布 **v1.0.1**（2026-05-28）、v1.0.0（2026-03-12）、v0.3.0（2025-07-30）——详见下方核实台账。AgentKit GA 状态仍**无法确认**（未取得一手源）
- 英文面经帖（LevelUpTutor/Blind 2025-2026）未逐帖复核（搜索轮数上限）
- "writing tools for agents" URL 由引用推断，正文要点引自已验证的上下文工程文章
- 2025 前时间线节点日期来自记忆（公认史实，如需逐条 URL 复核可再补一轮）

### U-26 核实台账（本轮，2026-10-12，t4 归口）

> 结论集合 = {确认, 需修正, 无法确认}。「需修正」条目已就地划改（纪律：更正要就地划改，不能只追加）；「无法确认」的断言保留原表述并挂注，不删除也不升级为确认。命令均可重跑；本环境出网可达 GitHub/官方文档站，genai.owasp.org 与 web.archive.org 对本机 403/429（已记录，未绕过）。

| # | 断言（仓库位置） | 核实通道（可重跑） | 核实日期 | 结论 |
|---|---|---|---|---|
| 1 | OWASP LLM Top 10 **2026 版，2026-08-04 发布**（`notes/mcp.md` S4.2/S8.5/文末；`notes/knowledge-map.md:8`；`handoff.md:12`——后两处非本任务 scope，未改） | `raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/README.md` 与 `raw.githubusercontent.com/OWASP/www-project-top-10-for-large-language-model-applications/main/README.md`（两处均明示 "Current release: 2026 — published August 4, 2026"）；另抓 `2026/final/` 与 `2025/` 目录清单 | 2026-10-12 | **确认**；附带交叉确认「Excessive Agency #6→#3」（2025 LLM06 → 2026 LLM03）与「System Prompt Leakage→Hidden Context Exposure」（2025 LLM07 → 2026 LLM08） |
| 2 | OWASP Agentic Top 10 **2025-12-09 发布，ASI01-ASI10**（`notes/mcp.md` S4.3/文末） | 官方文档 PDF《OWASP Top 10 For Agentic Applications 2026》（Version 2026，**December 2025**；页面自注 genai.owasp.org；57 页；镜像 `github.com/hexobandit/owasp-top10-agentic-apps-summary` docs/…pdf）——TOC 的 ASI01-ASI10 条目与 `mcp.md` S4.3 表 **10/10 逐项一致**；genai.owasp.org 本环境直连 403/429 | 2026-10-12 | **确认**（条目清单与版本/月份一致）；具体日期「12-09」沿用上一轮（2026-10-11，`mcp.md:480`）genai.owasp.org 核实，PDF 只到月粒度——**具体日=上轮已核实、本轮复核受阻**，不重复标为已核 |
| 3 | MCP 最新 spec **2026-07-28**（`notes/mcp.md` S1/S2/文末；`notes/llm-timeline.md:11,29,36,44`；本文件 :17） | `curl -sSL https://modelcontextprotocol.io/specification/versioning`（308 → `/docs/2026-07-28/learn/versioning`）：页头 "Version 2026-07-28 (latest)"，正文 "The current protocol version is 2026-07-28" | 2026-10-12 | **确认** |
| 4 | LangGraph「当前 **1.0.1**」（`notes/framework-ecosystem.md:91`；本文件 :24） | `npm view @langchain/langgraph version dist-tags.latest time.modified --cache <全新缓存目录>` → `1.4.21` / `1.4.21` / `2026-10-07T16:28:15.649Z` | 2026-10-12 | **需修正**——latest=1.4.21 ≠ 1.0.1；**独立复核** t1 实测（结论一致，非直接采信）。已就地划改：`framework-ecosystem.md:91`、`:376`、本文件 :24（**本行保留为历史记录**，后续演变见 4a 行） |
| 4a | LangGraph registry latest **1.4.21 → 1.5.0** 版本演变复核（`notes/framework-ecosystem.md:91/:284/:394/:396`、本文件 :24、`notes/multi-agent.md:191/:396`——六处已同步刷新为 1.5.0） | `npm view @langchain/langgraph version time.modified --cache <全新缓存目录>` → `1.5.0` / `2026-10-12T23:19:38.982Z` | 2026-10-13 | **复核完成**——latest=1.5.0（registry time.modified 2026-10-12T23:19Z）；t7 独立验证发现 + captain 全新缓存独立复核，本任务再次全新缓存独立复核（三方一致）；1.4.21 为 2026-10-12 当时的诚实快照，1.4.21→1.5.0 属**版本演变**而非口径错误，对照实跑快照（framework-demo 三家对照=2026-10-12 的 1.4.21）按历史保留 |
| 5 | A2A 版本号（本文件 :82 原缺口；`notes/framework-ecosystem.md:92` A2A 链接） | `https://api.github.com/repos/a2aproject/A2A/releases` + `https://a2a-protocol.org/latest/`（HTTP 200）→ v1.0.1（2026-05-28T11:34:36Z）/ v1.0.0（2026-03-12）/ v0.3.0（2025-07-30） | 2026-10-12 | **确认**（缺口补齐）——A2A 最新 spec 发布 = **v1.0.1** |
| 6 | OpenAI Agents SDK「**2025 GA**」（`notes/framework-ecosystem.md:90`） | `npm view @openai/agents version time.modified --cache <全新缓存目录>` → `0.20.0` / `2026-10-08T23:04:37.645Z`（仍 0.x 线） | 2026-10-12 | **无法确认**（GA 属官方公告口径，本环境未取到一手源；registry 版本未背书 1.0）——表述处已挂「registry 实测 0.x 线」注，未删「GA」（未证伪） |
