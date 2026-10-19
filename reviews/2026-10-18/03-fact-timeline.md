# 事实与时效 评审报告（fact-timeline）

- 评审员：fact-timeline｜时间：2026-10-18 23:40（Asia/Shanghai）
- 基准日：2026-10-18（Asia/Shanghai）
- 覆盖声明：
  - **全读（逐行）**：`notes/llm-timeline.md`（44 行）、`notes/industry-2026.md`（110 行）、`site/src/data/llm-history.ts`（276 行）、`README.md`（54 行）。
  - **抽样（grep 定向 + 局部精读）**：
    - `notes/model-basics.md`：按 `$[0-9]|token|上下文|窗口|20[0-9][0-9]|版本|GA` 命中 80 行（28–391），精读 :329（Mixtral 参数）、:384–:391（缺口/已核实注释）。
    - `notes/framework-ecosystem.md`：命中版本/日期/GA 关键词 60 行，精读 S2.3 各家要点表 :92–:111、S2.4 口径 :107–:115、:274–:310、来源回填 :422–:433。
    - `notes/api-engineering.md`：命中定价/缓存/限流关键词 60 行，精读 :97、:126–:127、:151、:229、:332–:338。
    - `notes/data-flywheel.md`：命中数字/日期关键词 50 行，精读 :241–:309（走查）、:415–:421（数字核实清单）。
  - **未读（原因）**：`model-basics.md` / `framework-ecosystem.md` / `api-engineering.md` / `data-flywheel.md` 全文（约 1590 行）未逐行读，只按上列关键词抽样（宪章 §2 阅读预算）；`notes/details/*`、`notes/process/*`、`analysis/**`、`handoff.md`、`AGENTS.md`、各 demo 源码未读（非本视角分区）。

- 结论摘要：
  1. **站点「LLM 发展史与演进（10 节点·带权威出处）」末节点停在 2025-01，比基准日滞后 21 个月，且与同站课程页 `llm-timeline.md`（12 节点到 2026.07）自相矛盾（F1，high）。**
  2. **LangGraph 版本号在同一站点同时以「1.4.21」（README）与「1.5.0」（industry-2026 / framework-ecosystem）两个现行值对外，而 registry 实测 latest = 1.5.1（F2，high）。**
  3. Claude Agent SDK 标 0.3.296，registry latest = 0.3.302（F3，medium）；Claude Code「预览→GA」写成 2025.02–04，官方 GA 为 2025-05-22（F4，medium）。
  4. 「2024.04 Claude 3 家族 + Tool Use GA」两处错：Claude 3 家族为 2024-03-04，2024-04-04 只是 beta 开放（F5，medium）；「2023.10 GPT-4 Turbo」实为 2023-11-06（F6，medium）。
  5. 「A2A 同入 AAIF」被放在 2025.12 同一格，官方 A2A 博客为 2026-08-27（F7，medium）。
- 本轮未验证的范围：见文末「未验证清单」。

---

### FAC-F1｜站点 /nav「10 节点带权威出处」的发展史末节点停在 2025-01，滞后基准日 21 个月，且与同站课程页 12 节点版矛盾（high）

- 严重度：high
- 对象：`site/src/pages/nav.astro:31`、`site/src/data/llm-history.ts:188-200`、`notes/llm-timeline.md:28-30`
  - 原文 1（`nav.astro:31`）：`<span class="phase-desc">2017 Transformer → 2025 DeepSeek-R1 · {LLM_HISTORY.length} 节点带权威出处</span>`
  - 原文 2（`llm-history.ts:188-199`）：`date: '2025-01',` / `name: 'DeepSeek-R1',`（数组最后一个元素到此结束，:201 即数组闭合）
- 现象：站点 `/nav` 对外自述「10 节点带权威出处」，其时间线终点是 2025-01 DeepSeek-R1；基准日 2026-10-18 时，**2025-02 至 2026-10 的全部模型/协议代际（Claude 4、Sonnet 4.5/Opus 4.5、GPT-5 系、Managed Agents、MCP 2026-07-28 spec）在该页完全缺失**；而同一仓库的课程页 `notes/llm-timeline.md` 有 12 节点、终点 2026.07。同一站点对「发展史到哪一年」存在两个互相矛盾的对外表述。
- 证据：
  - `curl -s "https://blog.zero43.top/learn-agent-harness/nav/"` → 命中 `2017 Transformer `、`2025 DeepSeek-R1 `、`10 节点带权威出处`（线上对外可见形态，访问 2026-10-18）。
  - `curl -s "https://blog.zero43.top/learn-agent-harness/c/llm-timeline/"` → HTTP 200 / 24263 bytes，`grep -oE '2026-07-28|2025\.09|12 节点'` 命中 `2026-07-28`×5、`2025.09`×4、`12 节点`×5（同站另一页已到 2026）。
  - 被 /nav 漏掉、经我一手核实的节点（均为官方源，访问日期 2026-10-18）：
    - Claude 4 / Claude Code GA **2025-05-22**：<https://www.anthropic.com/news/claude-4>（页头 `May 22, 2025`，正文 "Claude Code is now generally available"）。
    - Claude Sonnet 4.5 **2025-09-29**：<https://www.anthropic.com/news/claude-sonnet-4-5>（页头 `Sep 29, 2025`）。
    - Anthropic Managed Agents **Published Apr 08, 2026**：<https://www.anthropic.com/engineering/managed-agents>。
    - MCP spec `2026-07-28`：<https://modelcontextprotocol.io/specification/versioning>（`Version 2026-07-28 (latest)`）。
- 影响：`/nav` 是站点面向读者的「LLM 发展史」导航页，并自称「带权威出处」。考生/读者以它为最新前沿，会**把 2025-01 当成当下代际**，进而漏答「Managed Agents / Sonnet 4.5 之后的 harness 假设腐烂」「MCP 2026-07-28 spec」这类面试主线（`notes/llm-timeline.md:12,29` 自己就把它们列为「行业下一步」），属于会做出错误判断的对外声明。
- 建议方向：把 `/nav` 的时间线终点对齐 `llm-timeline.md` 的 2026.07 节点（或显式标注「本页止于 2025-01，2025-2026 见课程页」，并把自述「权威/最新」改为带截断日期的口径）。
- 置信度：高——线上页面 + 本地数据源 + 官方一手源三方一致；矛盾存在于同仓两份对外文件。

---

### FAC-F2｜LangGraph 版本号两处「现行」值互斥（1.4.21 vs 1.5.0），且都落后官方 latest 1.5.1（high）

- 严重度：high
- 对象：`README.md:18`、`notes/framework-ecosystem.md:99`、`notes/framework-ecosystem.md:111`、`notes/industry-2026.md:35`
  - 原文 1（`README.md:18`）：`② **三家 SDK 同任务离线 mock 对照**（Claude Agent SDK 0.3.296 / OpenAI Agents SDK 0.20.0 / LangGraph 1.4.21）`
  - 原文 2（`notes/industry-2026.md:35`）：`**截至 2026-10-13 复核 registry latest = 1.5.0**（time.modified 2026-10-12T23:19:38.982Z，全新缓存 `npm view` 独立复核…）`
- 现象：同一仓库对「LangGraph 现行版本」给出两个互斥值：README / framework-ecosystem 对照口径写 **1.4.21**（该值确为 `framework-demo/package.json` 的 pin），industry-2026 / framework-ecosystem S2.3 表写 **1.5.0**；而**两者都不是官方 latest**——registry 实测为 **1.5.1**。README 那行未标「快照日期」，读者无法判断哪个是当前值。
- 证据：
  - `curl -s https://registry.npmjs.org/@langchain%2Flanggraph | node -e '…"latest"/"time.modified"…'` → 关键输出 `latest= 1.5.1 modified= 2026-10-16T20:55:30.378Z`（本机实跑，2026-10-18）。
  - `cat framework-demo/package.json` → `"@langchain/langgraph": "^1.4.21"`；`grep -n "1.4.21" framework-demo/package-lock.json` → `"version": "1.4.21"`（证明 1.4.21 是 demo 的冻结快照，不是 registry 现行值）。
  - `notes/framework-ecosystem.md:111` 原文：`版本：Claude Agent SDK `0.3.296` / OpenAI Agents SDK `0.20.0` / LangGraph `1.4.21`。`
  - `notes/framework-ecosystem.md:99` 原文片段：`**截至 2026-10-13 全新缓存复核：npm registry latest = 1.5.0**`。
- 影响：框架选型课的核心结论之一是「pin 版本 + 升级前跑回归」（`framework-ecosystem.md:212,251,376`）。读者拿 README 的 1.4.21 当「现行」去对齐 industry-2026 的 1.5.0，会把「历史实跑快照」误读为「当前版本」，在做版本决策时踩错基线；且真实 latest 已到 1.5.1，说明按 2026-10-13 口径写下的「截至」值在 5 天后即失效，而文档没有任何一处提示该口径的半衰期。
- 建议方向：给三处版本号统一加「快照日期」前缀并把 demo pin（1.4.21）与 registry 现行值分列，别让两者同栏出现。
- 置信度：高——registry 直连实跑 + package.json/lock 双证 + 仓库内两处原文互斥。

---

### FAC-F3｜Claude Agent SDK 标 0.3.296，官方 registry latest 已是 0.3.302（medium）

- 严重度：medium
- 对象：`README.md:18`、`notes/framework-ecosystem.md:111`
  - 原文（`README.md:18`）：`（Claude Agent SDK 0.3.296 / OpenAI Agents SDK 0.20.0 / LangGraph 1.4.21）`
- 现象：站点/课程以 0.3.296 作为 Claude Agent SDK 的对外版本，registry latest 为 0.3.302（2026-10-16 发布），漂移 6 个 patch；repo 的 `0.3.296` 同样只是 `framework-demo/package.json` 的 pin 快照。
- 证据：`curl -s https://registry.npmjs.org/@anthropic-ai%2Fclaude-agent-sdk | node -e '…'` → `latest= 0.3.302 modified= 2026-10-16T20:54:01.114Z`；对照 `framework-demo/package.json` 的 `"@anthropic-ai/claude-agent-sdk": "^0.3.296"`。
- 影响：SDK 的权限钩子/会话语义是这门课的实操核心（`framework-ecosystem.md:143,151,157` 的踩坑都绑定具体 SDK 行为）。版本号停在上一个 patch，读者照文档 pin 会遇到与 `allowedTools` 抢占 `canUseTool`、`maxTurns` 语义等行为差异而无法归因。
- 建议方向：同 F2，把「demo pin」与「registry 现行」分开表述并标日期。
- 置信度：高——registry 直连实跑；`0.20.0`（OpenAI Agents SDK）经同一命令核对**与 registry 完全一致，无漂移**。

---

### FAC-F4｜「Claude Code 预览→GA」时间区间 2025.02–04 与官方 GA 日 2025-05-22 冲突（medium）

- 严重度：medium
- 对象：`notes/llm-timeline.md:25`、`notes/industry-2026.md:48`
  - 原文（`notes/llm-timeline.md:25`）：`| 2025.02–04 | Claude Code 预览→GA、OpenAI Agents SDK | coding agent 产品化 + SDK 层成型 | |`
- 现象：该行把「Claude Code GA」框进 2025.02–04，但官方 GA 公告发布于 **2025-05-22**（同一行后半段的 OpenAI Agents SDK = 2025-03-11，确在区间内，所以错的是前半段）。这是时间线表格里唯一同时含两个事件的行，读者会据此把 Claude Code 转正定在 4 月。
- 证据：
  - 一手：<https://www.anthropic.com/news/claude-4>（`May 22, 2025`，正文 "Claude Code is now generally available"），访问 2026-10-18。
  - 一手（Agents SDK 落点，用于确认区间另一半无误）：<https://openai.com/index/new-tools-for-building-agents/>（exa 检索返回发布日期 2025-03-11），访问 2026-10-18。
- 影响：`llm-timeline.md` 定位为「面试谈资必需」的历史锚点（:3、:31），GA 时间是「coding agent 何时产品化」的判据；错一个月会让「2025.02–04 产品化」这条时间因果链少一个月缓冲（模型侧质量门槛 2025.09 之前的那段空档）。
- 建议方向：把该行拆成两行（2025.02 Claude Code 研究预览 / 2025.05 GA），或把区间改为 2025.02–05。
- 置信度：高（Anthropic 一手公告页头日期）；Claude Code「2025.02 研究预览」这一半我未取到一手公告页，见未验证清单。

---

### FAC-F5｜「2024.04 Claude 3 家族 + Tool Use GA」一行两错：家族是 2024-03-04，2024-04 只是 beta（medium）

- 严重度：medium
- 对象：`notes/llm-timeline.md:22`、`notes/industry-2026.md:45`
  - 原文（`notes/llm-timeline.md:22`）：`| 2024.04 | Claude 3 家族 + Anthropic Tool Use GA | 工具调用跨厂商趋同，agent 进入生产 | ★ |`
- 现象：① Claude 3 家族发布于 **2024-03-04**，不在 2024.04；② Anthropic 官方在 **2024-04-04** 说的是 tool use **"now available in beta"**，GA 发生在 **2024-05-30**。该行把「beta 开放月」标成「GA 月」，且把家族发布月整体后移一个月——而这一行是 ★（面试必需）节点。
- 证据：
  - 一手（家族日期）：<https://www.anthropic.com/news/claude-3-family>（页头 `Mar 4, 2024`；正文 "These new features will include Tool Use (aka function calling)" —— 即发布时 Tool Use 尚未 GA）。
  - 一手（beta 而非 GA）：Anthropic 官方 LinkedIn 帖（`anthropicresearch`，2024-04-04）"Tool use is now available in **beta** to all customers in the Anthropic Messages API…"（exa 检索返回该帖与日期 2024-04-04）。
  - 二手一致（GA=2024-05-30）：Google Cloud Blog 2024-05-31 "Anthropic's Claude 3 Opus and tool use go GA"、The Verge 2024-05-30（均为 exa 检索结果，日期取自结果元数据）。
- 影响：★ 节点会被直接背进面试。「跨厂商工具调用趋同、agent 进入生产」的时点被提前到 4 月，读者会把 beta 期当成 GA 期谈；若面试官追问「Tool Use 何时 GA」，答 2024.04 即被证伪。
- 建议方向：家族行改 2024.03；Tool Use 拆 beta（2024-04-04）/ GA（2024-05-30）两个日期。
- 置信度：高——家族日期为官方页头；「4 月=beta」为 Anthropic 官方账号原文；GA 具体日仅二手，但足以证伪「2024.04 = GA」。

---

### FAC-F6｜「2023.10 GPT-4 Turbo 128k」实为 2023-11-06（medium）

- 严重度：medium
- 对象：`notes/llm-timeline.md:20`（同表 `notes/industry-2026.md:43` 同值）
  - 原文：`| 2023.10 | GPT-4 Turbo 128k | 上下文窗口 4 倍，长任务成为可能 | |`
- 现象：GPT-4 Turbo / 128K 的公开宣布时间是 **2023-11-06**（OpenAI DevDay），不是 2023.10。同一行把上下文窗口「4 倍」的解锁月份提前了约一个月。
- 证据：
  - `curl -sL "https://en.wikipedia.org/wiki/GPT-4"`（HTTP 200）→ 命中 `GPT-4 Turbo and GPT-4 Turbo with Vision model, which features a 128K context window` 与 `November 6, 2023)`；同页 `March 14, 2023` 佐证 GPT-4 首发行（:18 的 2023.03）无误。
  - OpenAI 官方 DevDay 页 `https://openai.com/index/new-models-and-developer-products-announced-at-devday/` 本机 curl（带浏览器 UA）与 web_fetch 均 **HTTP 403**，故一手改用维基（见未验证清单）。
- 影响：`llm-timeline.md:40` 自认 2025 前节点「日期来自记忆——待复核」，此条即其一被证伪者；该表是站点「LLM 时间线」页的正文（线上 `/c/llm-timeline/` HTTP 200 已确认渲染），错的月份会进入对外事实层。
- 建议方向：改为 2023.11，并顺手把 :40 那句「待复核」更新为已核清单。
- 置信度：中高——维基为二手但日期明确且与业界共识一致；OpenAI 一手 403 未取到（已记录）。

---

### FAC-F7｜「A2A 同入 AAIF」被并进 2025.12，官方为 2026-08-27（medium）

- 严重度：medium
- 对象：`notes/industry-2026.md:32`、`notes/framework-ecosystem.md:100`
  - 原文（`notes/framework-ecosystem.md:100`）：`中立基金会治理主场：2025.12 Anthropic 将 MCP 捐给 AAIF，A2A 同入（A2A **TSC 共 8 席**…`
- 现象：句子把 A2A 与 MCP 并列为 2025.12 入 AAIF 的项目；A2A 官方博客标题即「A New Chapter for A2A: Joining the Agentic AI Foundation」，日期 **August 27, 2026**，正文 "has officially been accepted as a Growth Stage project at the Agentic AI Foundation (AAIF)"。AAIF 成立公告（2025-12-09）的创始项目是 MCP / goose / AGENTS.md，**不含 A2A**。另：官方 TSC 名单第 4 家为 **IBM Research**，站内写 `IBM`（`:32`）。
- 证据：
  - 一手：<https://a2a-protocol.org/latest/blog/2026/08/27/a-new-chapter-for-a2a-joining-the-agentic-ai-foundation/>（元数据 `August 27, 2026`）。
  - 一手：Linux Foundation 公告 <https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation>（exa 检索返回发布日期 2025-12-09；标题限定 "Anchored by New Project Contributions Including Model Context Protocol (MCP), goose and AGENTS.md"）。
  - 一手（TSC 名单）：<https://a2a-protocol.org/latest/> → "maintained by a Technical Steering Committee with representatives from AWS, Cisco, Google, IBM Research, Microsoft, Salesforce, SAP, and ServiceNow"（8 家，数目与站内一致）。
- 影响：「基金会治理时间线」是这节的说服力来源（"事实标准→基金会治理跃迁"）。把 A2A 提前 8 个月并入 AAIF，会让读者在面试中说出一个可被官方公告直接证伪的时间点；且 A2A 采用节奏（站内称"企业采用早期"）正是 2026-08 才入 AAIF 的结果，时序错了，因果叙事也错。
- 建议方向：MCP 捐赠（2025-12-09）与 A2A 入 AAIF（2026-08-27）分列两行；`IBM` 补成 `IBM Research`。
- 置信度：高——A2A 官方博客日期与其首页治理段双向确认。

---

### FAC-F8｜`llm-history.ts` 自称「已逐条 web 核实」，`llm-timeline.md` 同段节点自认「日期来自记忆——待复核」（medium）

- 严重度：medium
- 对象：`site/src/data/llm-history.ts:1-6`、`notes/llm-timeline.md:40`
  - 原文 1（`llm-history.ts:4-6`）：`唯一内容源：notes/process/site-refactor-plan.md §7（alex 审计后的权威事实表——已逐条 web 核实，`
  - 原文 2（`notes/llm-timeline.md:40`）：`公认公开史实，日期来自记忆——**待复核**（沿用 industry-2026.md 已知缺口第 4 条…）`
- 现象：站点数据层（`/nav` 的 10 节点）对外声明「已逐条 web 核实，附 URL + 日期」，其头 4 个节点的对应版本（`llm-timeline.md` 的 2023.03–2024.09 段）在同一仓库被自认「日期来自记忆、待复核」。这两个声明覆盖重叠事实（GPT-4 2023.03、function calling 2023.06），**至少一个不成立**；且 F5/F6 已证明该「记忆段」内确有错值被写进对外内容。
- 证据：
  - 原文对读（上引两行，均逐字取自本地文件，行号如上）。
  - 复核实跑：`llm-history.ts` 中 2023-02 LLaMA / 2023-03 GPT-4 / 2023-06 function calling 的 `source` 只有 Wikipedia + 一个 403 的官方 blog（`llm-history.ts:113,127,141`），其中 function calling 的官方 blog 在 `:143` 自注「抓取 403」；我用 `curl -A "<浏览器 UA>"` 与 web_fetch 复跑同一 URL，**两次均 403**。
- 影响：读者无法区分「站点数据层声称的已核实」与「笔记自认的记忆来源」。凡遇到这两份材料的冲突（F1 是同一类），读者会误以为以「权威数据层」为准更安全——而它恰恰是被證出错值的一支。
- 建议方向：把 `llm-history.ts` 头部从「已逐条 web 核实」改为带日期的核实状态（哪些 exact、哪些 month、哪些待复核），与 `verified` 字段口径打通。
- 置信度：中高——两处原文逐字可查；「至少一个声明不成立」由 F5/F6 的错值落地佐证。

---

### FAC-F9｜Sonnet 4.5「SWE-bench ~77%」的出处指向一个不含该数字的页面（low）

- 严重度：low
- 对象：`notes/llm-timeline.md:38`
  - 原文：`- 2025.09 Sonnet 4.5（SWE-bench ~77% 长时程编码）[2026现行] → https://www.anthropic.com/engineering/managed-agents （一手讨论 Sonnet 4.5→Opus 4.5 代际演化的源）`
- 现象：数字本身**正确**（官方 77.2%），但给的 URL 是 Managed Agents 工程文，该页只讨论「harness 假设腐烂 / context anxiety」，我通读全文**未见任何 SWE-bench 数字**；真正的一手出处是 Sonnet 4.5 发布公告。
- 证据：
  - 一手（真正的出处）：<https://www.anthropic.com/news/claude-sonnet-4-5> → Methodology 段 "We report **77.2%**, which was averaged over 10 trials… on the full 500-problem SWE-bench Verified dataset"。
  - 复跑 `web_fetch https://www.anthropic.com/engineering/managed-agents` 全文：无 `77`/`SWE-bench` 命中（该页仅提及 Sonnet 4.5 的 context-anxiety 行为）。
- 影响：站内「数字→URL 对照」是它对抗时效漂移的机制（`:33` 标题即「来源与时间标注」）。出处指向无关页面时，读者按 URL 复核会核不到数字，进而怀疑数字本身；`[2026现行]` 标签因此名不副实。
- 建议方向：把该 node 的 URL 换成 `anthropic.com/news/claude-sonnet-4-5`，或并列两条（数字出处 / 代际讨论出处）。
- 置信度：高——官方公告原文含 77.2%，被引页无该数字（我通读了抓取全文）。

---

## 正面确认

以下范围我**主动用一手源查证过且未发现与站内表述冲突**（均标注访问/复核日期 2026-10-18）：

1. **MCP spec 版本**：`notes/llm-timeline.md:11,29,36`、`industry-2026.md:28` 称最新 spec = 2026-07-28。`curl -sL https://modelcontextprotocol.io/specification/versioning` → `Version 2026-07-28 (latest)`（多次命中）。**确认。**
2. **MCP Registry 仍为 preview**：`framework-ecosystem.md:101`、`industry-2026.md:30` 称「仍在 preview（未 GA）」。`web_fetch https://modelcontextprotocol.io/registry` → "The MCP Registry is currently in preview. Breaking changes or data resets may occur before general availability."，且背书方 "Anthropic, GitHub, PulseMCP, and Microsoft" 与站内名单一致。**确认。**
3. **AAIF 成立与 MCP 捐赠 2025-12-09**：`llm-timeline.md:11`、`framework-ecosystem.md:100`。Linux Foundation 公告（发布日期 2025-12-09）与 aaif.io 新闻页（`December 9, 2025`）双向确认创始项目为 MCP / goose / AGENTS.md。**确认（A2A 部分见 F7）。**
4. **Sonnet 4.5 日期与分数**：`llm-timeline.md:27`。官方公告页头 `Sep 29, 2025`、SWE-bench Verified 77.2%。**确认。**
5. **Managed Agents 2026.04**：`llm-timeline.md:28`、`industry-2026.md:21`。官方页 `Published Apr 08, 2026`，且「context-anxiety 补丁在 Opus 4.5 上成死重」的叙事与工程文原句一致。**确认。**
6. **多智能体数字**：`industry-2026.md:20,59` 的 90.2% / agent 4× / 多智能体 15× / token 解释 80% 方差。`web_fetch https://www.anthropic.com/engineering/multi-agent-research-system` 逐字命中 "outperformed single-agent Claude Opus 4 by **90.2%**"、"agents typically use about **4×** more tokens than chat…multi-agent systems use about **15×**"、"token usage by itself explains **80%** of the variance"。**确认。**
7. **CVE-2025-6514 CVSS 9.6**：`industry-2026.md:31`。NVD 详情页 + GitHub Advisory（Critical, 2025-07-09）+ JFrog 公告 "critical (CVSS 9.6) security vulnerability in the mcp-remote project"。**确认。**
8. **Mixtral 8x7B 参数**：`model-basics.md:329`「官方口径 46.7B / 12.9B」。`curl -sL https://mistral.ai/news/mixtral-of-experts` → 命中 `46.7B`、`12.9B`。**确认。**
9. **Stripe 内部 MCP server 400+ 工具**：`industry-2026.md:23`。`curl -sL https://cognition.ai/blog/what-we-learned-building-cloud-agents` → "Stripe has an internal MCP server with **over 400 tools**"。**确认。**
10. **Anthropic prompt caching 折扣**：`api-engineering.md:126`「读 = ×0.1；写 = ×1.25（5 分钟）/ ×2（1 小时）」。`curl -sL https://docs.claude.com/en/docs/build-with-claude/prompt-caching` → `0.1`×26、`1.25`×77、`2x`×29、`5-minute`×57、`1-hour`×111 命中。**确认。**
11. **OpenAI Agents SDK 版本无漂移**：`README.md:18` / `industry-2026.md:109` 标 0.20.0 → registry latest 实测同为 `0.20.0`（modified 2026-10-08）。**确认（与 F3 的 Claude SDK 形成对照）。**
12. **A2A v1.0.1（2026-05-28）**：`industry-2026.md:109` 缺口补记。`curl -s https://api.github.com/repos/a2aproject/A2A/releases` → `v1.0.1 | 2026-05-28T11:34:36Z`、`v1.0.0 | 2026-03-12`、`v0.3.0 | 2025-07-30`。**确认。**
13. **data-flywheel 的自评口径**：`data-flywheel.md:279,419-421` 的两轮消融数字（accuracy 0.611→0.676、precision 0.256→0.304 等）标注为「真实评测记录，n=200」并给出 `.data/eval/*.json` 路径；这些是**内部台账**，我未取外部源验证（见下），但站内口径自洽、分母与样本量明确，未发现叙述性夸大。

## 转交他人

- `llm-history.ts:59,93` 等「所有主流 LLM——BERT、GPT、LLaMA、DeepSeek——都是 Transformer 变体」「GPT-3 把参数量推到 1750 亿」属技术准确性范畴 → 交 `tech-core`。
- `api-engineering.md:151`「429 / 529（Anthropic over-capacity）」的 529 语义、`api-engineering.md:127`「OpenAI 自动前缀缓存 ≥1024 token、2024-10 起」的官方原文核对 → 交 `tech-core`（我只核了 Anthropic 侧缓存折扣）。
- `framework-ecosystem.md:97`「2025-09 由 Claude Code SDK 改名而来（Python+TypeScript，Apache 2.0）」与 `llm-timeline.md:25` 的 GA 区间同源，建议与我的 F4 一并回改 → 交 `editorial`（口径副本同步）。
- `site/src/data/llm-history.ts` 头部注释引用的 `notes/process/site-refactor-plan.md §7` 是宪章定义的**线索**非证据；若有人要主张「权威事实表」成立，须独立取证 → 交 `verifier`。
- 线上 `/nav` 的「10 节点带权威出处」文案与 `/c/llm-timeline/` 的 12 节点在同一站点并列，属对外可见形态的一致性问题 → 交 `editorial` / `presentation`（我已在 F1 给出 `nav.astro:31` 行号与线上实测）。

---

## 未验证清单（我查了什么、为何核不到）

| 待核事实 | 位置 | 我做了什么 | 结果 |
|---|---|---|---|
| OpenAI function calling 精确日（2023-06-13？） | `llm-history.ts:141-143`、`llm-timeline.md:19` | `curl -A <浏览器UA>` 与 `web_fetch` 同一 URL `openai.com/index/function-calling-and-other-api-updates/` | **未验证**：两次均 HTTP 403；仓库自注也是 403，我未能比它更进一步 |
| GPT-4 Turbo 一手公告日期 | `llm-timeline.md:20` | 同上，`openai.com/index/new-models-and-developer-products-announced-at-devday/` | **一手未取到（403）**；改用维基 `November 6, 2023`，故 F6 标「中高」 |
| Claude Code「2025.02 研究预览」起始日 | `llm-timeline.md:25` | 查 Anthropic news 未定位到该预览公告页（只取到 2025-05-22 GA 页） | **未验证**（区间后半段 GA 已被证伪，足以立 F4） |
| Anthropic Tool Use GA 的官方公告页 | `llm-timeline.md:22` | exa 检索；取得 Anthropic LinkedIn 官方 beta 帖（2024-04-04）与二手 GA 报道 | **GA 日仅二手（2024-05-30）**；「4 月=beta」为一手，足以立 F5 |
| NSA 批评 MCP「扩散速度超出安全模型」 | `industry-2026.md:31` | 未检索到 NSA 原文/报告 | **未验证**：无一手源 |
| MCP 规模「1 万+ server / SDK 月下载 9700 万+ / Agentforce 450 万调用」 | `industry-2026.md:29` | 未逐条取源（站内已自标「Wikipedia reportedly 口径，无官方一手数字」） | **未验证**（站内口径诚实，但仍是二手） |
| OpenAI Codex「SandboxAgent（100+ 模型）/ AgentKit / Secure MCP Tunnel」 | `industry-2026.md:34`、`framework-ecosystem.md:103` | 未取 `developers.openai.com/codex` 一手页（本轮时限） | **未验证** |
| 「Claude Agent SDK 2026 扩到 desktop/mobile/cloud/computer use」 | `industry-2026.md:33` | 未逐项取源 | **未验证** |
| pi 1.1.0 版本 | `framework-ecosystem.md:96,425` | 未确认 pi 的 registry/仓库版本 | **未验证** |
| data-flywheel 生产台账数字（1830 行 / 858 skipped / n=200 / baseline n≈60） | `data-flywheel.md:279,309,419-421` | `ls .data`、`find . -name 'selection-all-200*' -o -name 'gold.jsonl'` | **未验证**：仓库内**不存在** `.data/` 目录，`data-flywheel.md:419` 引用的 `.data/eval/*.json` 无法在本仓复现（外部一手源亦不存在，属私有台账） |
| codex「2025 GA」措辞 | `industry-2026.md:109`、`framework-ecosystem.md:98` | registry 实测 0.20.0（仍 0.x）；官方文档页自述 "production-ready upgrade of… Swarm"，未见 "GA" | **无法确认 GA 措辞**（与仓内既有台账结论一致，未证伪） |

---

*本报告仅只读访问被评审文件；除本文件外未在仓库写入任何内容（一次误建的 `t.html` 已由 Lead 清除，我复跑 `git status --porcelain` 确认无残留）。*
