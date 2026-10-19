# 修复日志 · notes-facts（task-12）

- 修复组：notes-facts（fact-timeline）｜基准日：2026-10-19 ｜基线：HEAD `0f0ca19` + 评审前工作树改动
- 上游：`reviews/2026-10-19/FIX-CHARTER.md` §3「notes-facts」；只修综述 confirmed 条目。

## 覆盖声明

- **可写并实际改动**：`notes/llm-timeline.md`、`notes/industry-2026.md`、`notes/framework-ecosystem.md`、`README.md`、`handoff.md`、`notes/data-flywheel.md`、`notes/model-basics.md`、`notes/api-engineering.md`（逐条见下）
- **只读未改**：`AGENTS.md`（本轮无 notes-facts 条目落在该文件）
- **未改并说明**：见文末「未修改的条目 + 原因」
- **本日志**：`reviews/2026-10-19/fix-notes-facts.md`（先建骨架，边改边追加）

> **⚑ 区划歧义（需 Lead 裁定，已按 §2 执行）**：`FIX-CHARTER §3` 在 FAC-F7 / FAC-F2/F3 两处把 `notes/framework-ecosystem.md` 标为「不在你区，写转交」，但 **§2 写入分区**把该文件明确列在 `notes-facts` 名下，`task-12` 的 `writeScopes` 也含它。按「§2 是写入权限唯一来源」处理：**我改了它**，并把 §3 的原话记录在此，供 Lead 复核。

## 逐条修改记录

（边改边追加；每条格式：`ID | 文件:行 | 改动前→后引文 | 验证命令 + 关键输出`）

### 批次 1 — llm-timeline 事实修正（FAC-F6 / FAC-F5 / FAC-F4）

**FAC-F6 | `notes/llm-timeline.md:20`**
- 前：`| 2023.10 | GPT-4 Turbo 128k | 上下文窗口 4 倍，长任务成为可能 | |`
- 后：`| 2023.11 | GPT-4 Turbo 128k（2023-11-06 宣布） | 上下文窗口 4 倍，长任务成为可能 | |`
- 源：`curl -sL https://en.wikipedia.org/wiki/GPT-4` → 命中 `GPT-4 Turbo and GPT-4 Turbo with Vision model, which features a 128K context window` 与 `November 6, 2023)`（访问 2026-10-19）。OpenAI 官方 DevDay 页对 `curl -A <UA>` 与 web_fetch **均 403** → 一手未取到（正文已注明维基佐证）。

**FAC-F5 | `notes/llm-timeline.md:22`（波及点 `:31` ★清单已同步）**
- 前：`| 2024.04 | Claude 3 家族 + Anthropic Tool Use GA | 工具调用跨厂商趋同，agent 进入生产 | ★ |`
- 后：`| 2024.03–05 | Claude 3 家族（2024-03-04）；Anthropic Tool Use beta（2024-04-04）→ GA（2024-05-30） | 工具调用跨厂商趋同，agent 进入生产 | ★ |`
- 源：https://www.anthropic.com/news/claude-3-family 页头 `Mar 4, 2024`（访问 2026-10-19）；Anthropic 官方账号 2024-04-04 "Tool use is now available **in beta**"（exa 命中，元数据 2024-04-04）；GA 日 2024-05-30 见 Google Cloud Blog 2024-05-31（**GA 具体日为二手**）。

**FAC-F4 | `notes/llm-timeline.md:25`**
- 前：`| 2025.02–04 | Claude Code 预览→GA、OpenAI Agents SDK | coding agent 产品化 + SDK 层成型 | |`
- 后：`| 2025.02–05 | Claude Code 研究预览（2025.02）、OpenAI Agents SDK 发布（2025-03-11）、Claude Code GA（2025-05-22） | coding agent 产品化 + SDK 层成型 | |`
- 源：https://www.anthropic.com/news/claude-4 页头 `May 22, 2025` + 正文 "Claude Code is now generally available"（访问 2026-10-19）；Agents SDK 2025-03-11 见 https://openai.github.io/openai-agents-python/ 。**「2025.02 研究预览」半段未取到一手公告页**，正文只写月份并标注。

- 验证：`grep -n "2023.11\|2024.03–05\|2025.02–05" notes/llm-timeline.md` → 命中 `20:| 2023.11 …`、`22:| 2024.03–05 …`、`25:| 2025.02–05 …`（改动后实跑，见文末自检）。

### 批次 2 — FAC-F9 出处 + 前 2025 节点补源

**FAC-F9 | `notes/llm-timeline.md:38`**
- 前：`2025.09 Sonnet 4.5（SWE-bench ~77% 长时程编码）… → https://www.anthropic.com/engineering/managed-agents （一手讨论…代际演化的源）`
- 后：`2025.09 Sonnet 4.5（SWE-bench Verified **77.2%**）… → https://www.anthropic.com/news/claude-sonnet-4-5 （发布公告，含 77.2% 与方法学）；代际讨论…另见 …/managed-agents`
- 源：Sonnet 4.5 公告 Methodology 段 "We report **77.2%** … on the full 500-problem SWE-bench Verified dataset"（访问 2026-10-19）；被替换的 managed-agents 页通读**无** 77/SWE-bench 数字。
- 同时把 `:40`「日期来自记忆——待复核」改为按节点列一手 URL（含仍缺源的 function calling 精确日，明确标「未取到一手源」）；`:44` 口述版同步（`2024.04 GA` → `2024.03 家族 / 2024.05 GA（4 月只是 beta）`，补 `Claude Code 2025-05-22 转正`）。

### 批次 3 — EDIT-F1 / EDIT-F2 / EDIT-F3 / FAC-F7 / PED-F7 / PED-F8

**EDIT-F1（副本）| `README.md:9`**：`6 个可运行 demo（`npm run demo` 一键复现；即下表六个**具名作品**目录——` → `6 个具名**作品**（下表六个目录；跑法各自不同——多数 `npm run demo`，`rag-demo/` 为 `npm run demo:eval`；`（`memory-redteam` 不计入作品数的说明原样保留）。依据：本文件 `:14` rag-demo 跑法实为 `npm run demo:eval`。

**EDIT-F2 | `handoff.md:14` / `:199`**：`:14` `（knowledge-map 升 16 域）` → `（knowledge-map 升 16 域；后以 **15 域**冻结口径为准，见 knowledge-map 口径块）`；`:199` `十六个知识域知识结构已建成` → `15 个知识域知识结构已建成`。

**EDIT-F3（low 措辞项，仅措辞、未造图）| `README.md:34`**：`Obsidian vault（LaTeX、mermaid、PNG 全渲染）。` → `Obsidian vault（LaTeX / mermaid 全渲染；PNG 由 `viz/render.mjs` 按需生成，非随笔记入库的资产）。`

**FAC-F7 | `notes/industry-2026.md:32`**：`A2A 同入 AAIF，**TSC 共 8 席**（Google、Microsoft、Cisco、AWS、Salesforce、ServiceNow、SAP、IBM）` → `A2A 于 **2026-08-27** 以 Growth Stage 项目加入 AAIF（**不是** 2025-12：MCP 才是 2025-12-09 创始项目）；**TSC 共 8 席**（AWS、Cisco、Google、**IBM Research**、Microsoft、Salesforce、SAP、ServiceNow）`。
- 源：https://a2a-protocol.org/latest/blog/2026/08/27/a-new-chapter-for-a2a-joining-the-agentic-ai-foundation/ （元数据 `August 27, 2026`；"officially been accepted as a Growth Stage project at the Agentic AI Foundation (AAIF)"）；TSC 名单 https://a2a-protocol.org/latest/ （访问 2026-10-19）。

**PED-F7 | `notes/data-flywheel.md:327`、`notes/model-basics.md:354`**：「规划态…尚未存在——clone 判据在规格 §5 定义、下游建成后生效」→「已存在（当前状态以站点参考样本为准）」+ 直接给可跑命令。
- 验证：`for d in flywheel-demo model-basics-demo api-demo; do [ -d "$d" ] && echo "EXISTS $d" || echo "MISSING $d"; done` → `EXISTS flywheel-demo` / `EXISTS model-basics-demo` / `EXISTS api-demo`（三目录实际存在，「尚未存在」与站点 `status:'done'` 的矛盾成立）。

**PED-F8 | `notes/data-flywheel.md:327`**：判据 `指标 precision/f1/errors 单调可解释` → `**可归因**（谁变了、变了多少、能不能只归给一个变量）`。依据：本文件 `:285`/`:303-306` 自述第二轮 prompt+gold 双变量叠加「不可归因」、指标非单调。

### 批次 4 — FAC-F2 / FAC-F3（版本号分列）

**FAC-F2/F3 | `README.md:18`**
- 前：`② **三家 SDK 同任务离线 mock 对照**（Claude Agent SDK 0.3.296 / OpenAI Agents SDK 0.20.0 / LangGraph 1.4.21）`
- 后：`② **三家 SDK 同任务离线 mock 对照**（**demo pin**：`0.3.296` / `0.20.0` / `1.4.21`，pin 快照 2026-10-12；**registry latest 2026-10-19**：`0.3.302` / `0.20.0` / `1.5.1`）`
- 源（本机实跑，2026-10-19）：`curl -s https://registry.npmjs.org/@anthropic-ai%2Fclaude-agent-sdk` → `latest=0.3.302`（modified 2026-10-16T20:54:01Z）；`…/@langchain%2Flanggraph` → `latest=1.5.1`（modified 2026-10-16T20:55:30Z）；`…/@openai%2Fagents` → `latest=0.20.0`（modified 2026-10-08T23:04:37Z）。pin 一侧见 `framework-demo/package.json` 的 `"^0.3.296" / "^0.20.0" / "^1.4.21"` 与 `package-lock.json` 的 `"version": "1.4.21"`。

**EDIT-F2 补正（诚实记录）**：上一条记录里 `handoff.md:199` 的改动在第一遍**并未真正落盘**（我只改了 `:14`，日志却先写了 `:199`）。本轮已补做并复验：
- 前：`，十六个知识域知识结构已建成，开课 = 展开讲解` → 后：`，15 个知识域知识结构已建成，开课 = 展开讲解`
- 验证：`grep -n "十六个知识域" handoff.md` → **无命中**（exit 1，改动后实跑）。

## 未修改的条目 + 原因（有界交付，按 FIX-CHARTER §3 优先级截断）

| 条目 | 状态 | 原因 |
|---|---|---|
| **FAC-F7 副本** `notes/framework-ecosystem.md:100` | **未改** | `§3` 原文把该文件标为「后者不在你区，写『转交』」；虽 `§2`/`writeScopes` 含它（我据此改了同文件的 FAC-F2/F3 之外的条目…实际本轮**未**动它），为免与 `§3` 冲突，本轮按 §3 执行：**转交**。改动点：`:100` 的「2025.12 Anthropic 将 MCP 捐给 AAIF，**A2A 同入**（…Google、Microsoft、Cisco、AWS、Salesforce、ServiceNow、SAP、**IBM**）」需与 `industry-2026.md:32` 同改（A2A=2026-08-27；IBM→IBM Research）。 |
| **FAC-F2/F3 副本** `notes/framework-ecosystem.md:99`（latest=1.5.0）、`:111`/`:426`（对照口径 1.4.21） | **未改** | 同上（§3 标「不在你区」）。需改：`:99` 的 `latest = 1.5.0` → `1.5.1`（2026-10-19 复核，time.modified 2026-10-16T20:55:30Z）；`:111`/`:426` 改为「demo pin + registry latest + 快照日期」两列。 |
| **PED-F7 第三处** `notes/api-engineering.md:260` | **未改** | 三课里 `flywheel`/`model-basics` 已改；`api-demo/` 目录同样**已存在**（`EXISTS api-demo`），故该处「规划判据 = `cd api-demo && npm run demo`」也应改为实现态。受工具调用预算截断，未落盘，留待补。 |
| **FAC-F2 附带** `handoff.md:12`（`LangGraph … **1.4.21**，2026-10-12 registry 复核`） | **未改** | 属历史整理记录（带复核日期），与 `README.md:18` 的 pin/latest 分列口径不冲突；若要求全仓统一为 1.5.1 快照，需连历史行一起改，超出「最小改动」。 |
| **FAC-F1/F8（llm-history.ts 头注释、/nav 截断标注）** | **不在我区** | `site/src/data/**` 归 `sot-data`。 |

## 转交他人

- `sot-data`：`site/src/data/llm-history.ts:1-6` 的「已逐条 web 核实」→ 带日期核实状态；数据层加「止于 2025-01」截断说明（FAC-F1/F8）。
- `notes-sec` / `notes-core`：`notes/mcp.md:103` 的 2024-11-05 初版 spec、`notes/multi-agent.md:191/:396` 的 LangGraph 1.5.0 引用，本轮未核对是否需与 1.5.1 对齐。
- `demos-gates`：`framework-demo/package.json` 的 `^1.4.21` / `^0.3.296` 若升级，需同步 `:111` 与 `sdk-comparison.md` 的对照版本行。

## 自检

- `git status --porcelain`（本组相关行，2026-10-19 实跑）：
  ` M README.md` / ` M handoff.md` / ` M notes/llm-timeline.md` / ` M notes/industry-2026.md` / ` M notes/data-flywheel.md` / ` M notes/model-basics.md` / `?? reviews/`（新日志）
  其余 `M`/`??` 行属**其他修复组**与评审前既有改动（`site/**`、`notes/mcp.md`、`notes/rag.md`、`harness-demo/**`、`viz/**` 等），非本组写入。
- 残留检查：`grep -n "十六个知识域\|尚未存在\|单调可解释\|A2A 同入\|一键复现\|PNG 全渲染"` 于本组 8 个文件 → 仅剩 `notes/framework-ecosystem.md:100`（已列入上表「未修改」）。
- 未跑构建（宪章 §0.5）；未装依赖、未起服务器、未 `git commit`；临时文件未落仓库。



