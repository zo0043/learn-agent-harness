# Handoff — learn-agent-harness 会话交接

> 交接时间：2026-10-10 晚 · 上一会话内容：AI 学习系统搭建 → agent harness 架构课 → RAG 课 → 课程 A（从零写 harness）实操
> 交接对象：下一个接手此项目的会话／人
>
> **2026-10-10 晚 接手更新**：待办 1（demo:compact 活体）✅ 完成、待办 2（FinHot/.env）✅ 核对完整、待办 3（JD 数据）已从 /tmp 抢救到 `learn-agent-harness/jd-research/`。过程中发现并修复 5 个 bug（详见"三、待办"下的修复记录）。模型轮换：`qwen3.8-flash` 已从代理下架，现用 `qwen3.8-flash-next`（tool calling 已验）。
>
> **2026-10-10 深夜 / 10-11 凌晨 二次整理（本轮）**：B 课实操完成（rag-demo）；知识点完整性构建——新增 `notes/knowledge-map.md`（总索引）+ C/D/E/F/G/H/I/J/K/L/M 十课知识结构 + `notes/interview-bank.md`（面试结构/交叉题/JD 覆盖矩阵），时点事实（MCP spec/OTel/沙箱/记忆框架/caching 等）已核实回填。
>
> **2026-10-11 三次整理**：面经检索（中文面经站/英文系统设计/模型八股三路）→ 缺口清单入 §4.2；全量学习规划入 §四（学习总纲：15 个知识域状态 + 分阶段顺序 + 完成判据）。
>
> **2026-10-11 四次整理（内容补完，系统时钟）**：🔶1-5 五项全部写入——C-S8 范式速查 / H-S8 指标四代+奖励模型意识（judge 偏差三篇一手文献已核实）/ I-S4 升级为 Agent 安全全景 / L-S7 八股速查表 16 题 / interview-bank §8 行为面 5 题；核实时点事实：OWASP LLM Top 10 已更新到 **2026 版**（2026-08-04 发布；8 项变动：Excessive Agency #6→#3、System Prompt Leakage 被 Hidden Context Exposure 取代等，笔记已按 2026 版回填）、OWASP Agentic Top 10（2026，2025-12-09 发布）全文、LangGraph 1.0.x 稳定版（2025-10 alpha → 当前 1.0.1）。每课题库 +2 题。⚠️ 日期口径：前两轮标为 "10-17"，机器时钟 = 2026-10-11（周日，星期自洽；rag-demo mtime=10-11 00:06），本轮起用系统时钟，口径待确认。
>
> **2026-10-11 站点+内容扩充（本轮，已推 GitHub）**：① 日期口径归一完成（"10-17" 为未来日期误写，11 文件 28 处按 mtime 证据改回系统时钟）② 行业前线调研底稿 `notes/industry-2026.md`（MCP→AAIF 治理/spec 2026-07-28/协议三分、Managed Agents "harness 假设会腐烂"、Cognition 单线程写、computer use 升一等、LLM 时间线 12 节点、分水岭 8 细节，全部实抓官方一手源）③ 课程前线回填：I 课 S2.1 / M 课 S3+4 行 / C 课 S2 沙箱+评测闭环 / 新增 N 课 `multi-agent.md`（多智能体编排，一等域，S1-S7）+ `llm-timeline.md` + `details/` 分水岭 8 页（knowledge-map 升 16 域）④ interview-bank 待实操 4 项全部落地：`sandbox-demo/`（四通道 policy+幽灵事故重放，600 行，3 次重放逐字节一致）/ harness-demo OTel 埋点（demo:otel 实测 11 spans/1 trace）/ `mcp-demo/`（投毒+四层防御+消融）/ `framework-demo/`（Claude Agent SDK 四能力，主路线直连代理成功，副产发现 SDK allowedTools 会抢在 canUseTool 前 auto-approve 的坑）⑤ Astro 站 `site/` 已上线 **https://blog.zero43.top/learn-agent-harness/**（8 页面，GitHub Actions→Pages，build 零错误，9 页全 200；P4 文案已完成（808d580））⑥ 提交 845628c 已推 main，secret 扫描干净。

---

## 一、这个项目是什么

`/home/ubuntu/app/learn-agent-harness` = **AI 学习系统 + 面试备考课程**目录。当前目标：

> **备考 agent 开发工程师岗位**，方向已定：**coding agent**（Codex Core / Claude Code / CodeBuddy 那类岗）

产出全部落在本目录，按 Obsidian vault 组织（`notes/` 即课程日志，用 Obsidian 打开可读 LaTeX、mermaid、PNG）。

---

## 二、已完成的工作

### 1. 学习系统（已全局安装 + 冒烟测试）

基于 [amosblomqvist/learn](https://github.com/amosblomqvist/learn) 的 pi-web 适配版：

```
~/.pi/agent/skills/teach/SKILL.md          教学流程（probe → plan → teach）
~/.pi/agent/skills/visualize/SKILL.md      配图（mermaid / SVG→PNG→验证）
~/.pi/agent/extensions/quiz.ts             判分 quiz（pi-web 无 TUI 时降级为聊天判分）
~/.pi/agent/extensions/md-log.ts           /md-log <路径> 课程镜像（支持绝对路径）
```

关键适配决策（**不要重复踩**）：
- 上游 tmux subagent（researcher/svg-maker/mermaid-maker）**已删**，替换为 `web_explore` / `delegate_task(librarian)`；配图改主会话直接创作
- 上游自带 ask-user-question 扩展**已删**（pi-web 内置 `ask_user_question`，避免重复注册）
- teach 触发描述**已收窄**为"用户明确要学习/上课时触发"（防止开发会话误触发）；**改 skill 只改全局这一份**
- 扩展内 `@mariozechner/*` import 由 pi 1.1.0 运行时别名映射到 `@earendil-works/*`（已验证，无需改包名）
- 本目录 `AGENTS.md` 约定：中文回复、查证纪律、quiz 降级、日志工作流

### 2. 课程内容（12+ 份笔记；学习状态与顺序见 §四 学习总纲）

| 文件 | 内容 | 状态 |
|---|---|---|
| `notes/agent-harness.md` | **Harness 架构课**：13 节（地基→loop→工具协议→提示词→上下文工程→恢复→权限→多 agent→验证→总装→误区→pi 映射→题库）+ **第 15 节 JD 调研** | ✅ 讲完 |
| `notes/rag.md` | **RAG 课**：12 节（embedding 机制→ANN→chunk→混合检索→rerank→生成→评测→替代方案→系统设计骨架→实操计划）+ **§13 实操复盘（rag-demo）** | ✅ 完成（2026-10-10 深夜 / 10-11 凌晨 实操：rag-demo 11 文件 + golden set recall@3=1.00） |
| `notes/harness-from-scratch.md` | **课程 A**：10 节，含真实实测输出、白板骨架、练习题、代理故障实录 | ✅ 完成 |
| `notes/knowledge-map.md` + 十课文件 | **知识点完整性构建（2026-10-10 深夜 / 10-11 凌晨）**：C 系统设计 / D 可观测 / E 沙箱 / F 长期记忆 / G durable execution / H 评测工程化 / I MCP+安全 / J API+路由 / K 数据飞轮 / L 模型基础 / M 框架生态——每课=分节知识点+面试点+练习题库+资产钩子；另有 `notes/interview-bank.md`（30 秒自我介绍框架/60 分钟模拟结构/项目深挖追问链/交叉题/JD 覆盖矩阵） | ✅ 知识结构建成，待开课 |

### 3. 课程 A 作品代码（可运行）

```
harness-demo/                       TS 可运行版
  src/types.ts llm.ts tools.ts policy.ts session.ts context.ts agent.ts demo.ts
  src/test-compact.ts               压缩逻辑的本地 mock 测试（不依赖代理）
  workspace/docs/...                demo 测试语料
  trajectories/demo.jsonl           轨迹日志（演示崩溃恢复）
whiteboard/agent_whiteboard.py      ~150 行纯标准库白板版（面试现场手写用）
viz/render.mjs                      SVG→PNG（node 12 自举 + playwright-core）
```

四种模式实测：

| 模式 | 命令 | 状态 |
|---|---|---|
| 正常路径 | `npm run demo -- --fresh` | ✅ 真实模型（含 run_shell 被拒后继续） |
| 崩溃恢复 | `npm run demo:crash` → `npm run demo` | ✅ 真实模型（未知状态→先核对再重写） |
| 审批拒绝 | `npm run demo:reject` | ✅ 真实模型（跳过、不重试、out/ 为空） |
| 压缩 | `npm run demo:compact` | ✅ 活体验证（2026-10-10 晚，qwen3.8-flash-next，`[压缩] 摘要 3 条，保留 9 条` 真实触发） |

---

## 三、待办与风险

### 待办 1（✅ 2026-10-10 晚 完成）：`demo:compact` 活体验证

代理已恢复，但 **`qwen3.8-flash` 已从代理下架**（`/v1/models` 无此模型，qwen 系现剩 `qwen3.8-flash-next`/`qwen3.8-max`，两者 tool calling 均验过）。`harness-demo/.env` 当时是空的（URL/key 均未落盘，见待办 2），现已从 FinHot/.env 重建并设 `LLM_MODEL=qwen3.8-flash-next`。活体跑通：`[压缩] 摘要 3 条，保留 9 条`，全程 105s。

**过程中发现并修复的 5 个 bug**（接手人若读课程 A 代码，这是现成的反面教材）：
1. **`demo.ts` 的 `__dirname` 实为文件路径**：`resolve(file, "..", ".env")` → `src/.env`（不存在），.env 加载从未生效——之前能跑全靠 pi-web 进程环境里已有变量。
2. **ES import 提升**：`llm.ts` 的 `const BASE/KEY` 在模块求值期读 `process.env`，而入口的 .env 加载晚于 import——即使路径对也读不到。修法：.env 加载下沉到 `llm.ts` 模块顶部（先于 BASE/KEY 计算）。
3. **`tools.ts` 同款 `__dirname` bug**：`WORKSPACE_ROOT` 指向 `src/workspace`（不存在），list_dir 直接 ENOENT。
4. **tool_calls 回写格式**：内部 `ToolCall = {id,name,arguments:对象}`（扁平）直接 stringify 进请求体，严格上游拒 400（`upstream_error`）；非流式/流式 curl 重放同负载均 200 ⇒ 定位为格式问题。修法：`llm.ts` 加 `toWireMessages()`，历史 assistant.tool_calls 转 OpenAI wire 格式（嵌套 `function` + `arguments` 必须是 **JSON 字符串**）。
5. **`test-compact.ts` 断言 `summarized===4` 与实现契约矛盾**（7 条消息 head 2 + tail 2 → middle 只能是 3；4 与 length 5 在任何 head/tail 划分下都凑不出来）。上文 2423→871 的数字来自更早的测试版本，当前版本从未通过过。已改为 3，mock 测试 ✅。

另有小改进：`chatStream` 4xx 时现在读响应体报真实错误（原来只报"无 body"）。crash/reject 的活体回归已于同日补完（✅ 均通过：crash-resume 场景模型先只读核对再决定、未重复写入；reject 场景拒绝后不重试、out/ 为空）。

### 待办 2（✅ 2026-10-10 晚 已核）：FinHot/.env

`FinHot/.env` 完整：LLM_BASE_URL / LLM_API_KEY / LLM_EXTRA_JSON / LLM_MODEL 四行均在（共 145 行），未被并行会话污染。真正的问题在 `harness-demo/.env`——BASE_URL/API_KEY 两行为空（10-10 重建时 pi-web 进程环境恰好没有这两个变量，写入了空值）。现已从 FinHot/.env 填入真实值，**demo 从此自包含，不再依赖 pi-web 进程环境**。

### 待办 3：JD 调研的证据盲区（数据已抢救，补盲仍待人工）

JD 调研（`notes/agent-harness.md` 第 15 节）抓到一手 JD 1799 条（腾讯 339 / OpenAI 815 / Anthropic 645，2025-05~2026-10）。原始数据 **2026-10-10 晚 已从 `/tmp/agent-jd-research/` 移到 `learn-agent-harness/jd-research/`（51MB，不再受 /tmp 清理威胁）**。字节/百度/蚂蚁/阿里/智谱/月之暗面/DeepSeek **被反爬拦截，无一手证据**。字节是国内 agent 岗大户 → 建议人工抽 20-30 条 JD 发我补盲。

### 待办 4（🆕 2026-10-11，✅ 四次整理已写入）：缺口补强清单（面经检索所得）

见 §4.2——**5/5 🔶 项已全部写入（2026-10-11 四次整理）**：🔶1 L-S7 八股速查表 / 🔶2 H-S8 指标四代+奖励模型意识 / 🔶3 I-S4.2-4.4 OWASP 2026 双清单+防御分层 / 🔶4 C-S8 范式速查 / 🔶5 interview §8 行为面 5 题。⚪ LeetCode 仍另轨。不单独排期，跟着开课顺序走。

### 待办 5（🆕 2026-10-11）：安排模拟面试

2 场 60 分钟模拟（`notes/interview-bank.md` §2 结构），建议 Phase 1（C/E/H）完成后排第一场的初验，全部完成后排终验。

---

## 四、学习总纲（2026-10-11 规划）

> 规范索引 = `notes/knowledge-map.md`（课程总表/依赖图/横切点/资产映射）；本节 = **学习状态 + 顺序 + 完成判据**，是开课与面试准备的单一事实源。
> 状态记号：✅ 已完成（讲完+实操）/ 📐 结构建成未开（内容已写入，讲解与题库未做）/ 🔄 进行中 / 🔶 缺口补强（2026-10-11 面经检索，待写入）

### 4.1 知识点总览（全部 15 个知识域）

| # | 知识域（课 · 文件） | 范围（S 节概要） | 状态 | 完成判据 |
|---|---|---|---|---|
| 1 | Harness 架构课（`agent-harness.md`） | 13 节：地基/loop/工具协议/提示词/上下文工程/恢复/权限/多 agent/验证/总装/误区/pi 映射 + §15 JD 调研 | ✅ 讲完 | 题库 8 题未考（存档，另约） |
| 2 | A 从零写 harness（`harness-from-scratch.md` + `harness-demo/`） | 10 节：loop/工具协议/流式三件事/policy 三道门/崩溃恢复/权限三层/压缩/mock 验证/代理实录/白板总装 | ✅ 讲完+实操（四模式实测） | 题库 8 题未考 |
| 3 | B RAG（`rag.md` + `rag-demo/`） | 12 节理论 + §13 实操复盘：embedding/ANN/chunk/混合检索/rerank/生成/评测/替代方案/设计骨架 | ✅ 讲完+实操（recall@3=1.00） | S1 五道确认题未考 |
| 4 | C 系统设计（`system-design.md`） | S1 agent≠CRUD / S2 七步骨架 / S3 五模式 / S4 设计走查 / S5 FinHot 演练 / S6 客服演练 / S7 追问库 / S8 范式速查 | 📐 讲义已展开（2026-10-11） | 提问演练 + 题库 14 题通过 |
| 5 | E 沙箱与凭据（`sandbox.md` + `sandbox-demo/`） | S1 权限≠沙箱 / S2 四通道 policy demo / S3 隔离谱系 / S4 凭据 / S5 漂移审计 / S6 可复现 / S7 实战走查 / S8 常见错误 | 📐 讲义已展开（demo 已落地 2026-10-11） | 提问演练 + 题库 16 题通过（S2 demo 已验收：3 次重放逐字节一致） |
| 6 | H 评测工程化（`evaluation.md`） | S1 为什么 / S2 四层指标 / S3 judge 四偏差+校准 / S4 延迟奖励 / S5 golden set / S6 CI 门禁 / S7 demo 计划 / S8 指标四代 / S9 judge 校准实操 / S10 常见错误 | 📐 讲义已展开（2026-10-11） | 提问演练 + 题库 14 题通过 |
| 7 | G durable execution（`durable-execution.md`） | S1 三个随时 / S2 三机制 / S3 重放确定性 / S4 幂等三分法 / S5 long-horizon / S6 框架版图 / S7 demo / S8 实战走查 / S9 常见错误 | 📐 讲义已展开（2026-10-11） | 提问演练 + 题库 14 题通过 + S7 demo 落地 |
| 8 | I MCP + 安全（`mcp.md`） | S1 为什么 / S2 架构原语 / S3 认证分发 / S4 四攻击面 / S5 sampling 反转 / S6 demo 实证 / S7 实战走查 / S8 常见错误 | 📐 讲义已展开（2026-10-11） | 提问演练 + 题库 14 题通过 |
| 9 | J API + 路由（`api-engineering.md`） | S1 流式四件事 / S2 结构化三档 / S3 caching 经济学 / S4 失败分类学 / S5 路由三策略 / S6 成本工程 / S7 实战走查 / S8 常见错误 | 📐 讲义已展开（2026-10-11） | 提问演练 + 题库 14 题通过 |
| 10 | K 数据飞轮（`data-flywheel.md`） | S1 定义+判据 / S2 轨迹数据模型 / S3 筛选 / S4 消融+T3.2 边界 / S5 微调意识 / S6 实战走查（真实三轮指标已回填）/ S7 常见错误 / S8 故事打磨 | 📐 讲义已展开（2026-10-11） | 提问演练 + 题库 14 题通过 |
| 11 | D 可观测（`observability.md`） | S1 agent≠微服务 / S2 OTel GenAI / S3 span 建模 / S4 成本归因 / S5 回放对比 / S6 工具版图 / S7 实战走查 / S8 常见错误 | 📐 讲义已展开（2026-10-11） | 提问演练 + 题库 14 题通过 |
| 12 | F 长期记忆（`long-term-memory.md`） | S1 四类记忆 / S2 三层生命周期 / S3 写侧 / S4 读侧 / S5 冲突消解与遗忘 / S6 评测 / S7 记忆投毒 / S8 框架与学术 / S9 设计题 / S10 实战走查 / S11 常见错误 | 📐 讲义已展开（2026-10-11） | 提问演练 + 题库 14 题通过 |
| 13 | L 模型基础（`model-basics.md`） | S1 prefill/decode+KV cache / S2 采样 / S3 窗口 vs 有效 / S4 成本模型 / S5 微调意识 / S6 能力漂移 / S7 八股速查 / S8 实战走查 / S9 常见错误 | 📐 讲义已展开（2026-10-11） | 提问演练 + 题库 14 题通过 |
| 14 | M 框架生态（`framework-ecosystem.md`） | S1 框架三族 / S2 框架版图 / S3 抽象泄漏 / S4 选型决策树 / S5 迁移路径 / S6 pi 深潜 / S7 实战走查 / S8 常见错误 | 📐 讲义已展开（2026-10-11） | 提问演练 + 题库 14 题通过 |
| 15 | 面试结构（`interview-bank.md`） | 30 秒自我介绍 / 60 分钟模拟 / 5 组项目深挖追问链 / 10 道交叉题 / JD 覆盖矩阵 | 📐 | 2 场模拟通过 + 矩阵全 🟢 + 🔶5 STAR 模板 |
| — | N 多智能体编排（`multi-agent.md`） | S1 何时多智能体 / S2 拓扑 / S3 orchestrator-worker / S4 单线程写 / S5 通信成本 / S6 调试 / S7 子代理设计 / S8 实战走查 | 📐 讲义已展开（2026-10-11） | 提问演练 + 题库 12 题通过 |
| — | 范围外：算法编码（LeetCode） | 英文面经确认仍考（medium） | ⚪ 不在教程范围 | 建议 ~50 道 medium，并行轨 |

### 4.2 缺口补强清单（2026-10-11 面经检索：中文面经站 / 英文系统设计 / 模型八股 三路）

| # | 缺口 | 面经证据 | 写入位置 | 何时做 |
|---|---|---|---|---|
| 🔶1 | **L 课深度**：tokenizer（BPE/SentencePiece）/ MHA·GQA·MQA / MoE / loss（CE/KL）/ RL 谱系（PPO·GRPO·DPO·RLHF）/ 连续批处理 / 投机解码 / 量化（GPTQ·AWQ·FP8）/ 长上下文（RoPE/YaRN）/ prefix caching | HF 官方 25+ 题清单 + 知乎八股文线 + 25/30 题列表几乎必含 | `model-basics.md` 新增"S7 八股速查"（~15 题 × 3-5 行标准答案） | ✅ 已写入 2026-10-11（实为 S7，16 题） |
| 🔶2 | **H 课**：评测指标四代演进（exact match → BLEU/ROUGE → BERTScore → LLM-judge → 轨迹评测）+ reward model 意识 | 面经 40+ 题 / 30 必问题单列"BLEU/ROUGE 区别""RLHF 原理" | `evaluation.md` 新增"S8 指标四代演进" | ✅ 已写入 2026-10-11（S8，含奖励模型意识） |
| 🔶3 | **I 课**：Agent 安全独立节点——OWASP LLM Top 10（2025）+ OWASP Agentic Top 10（2026）清单、direct/indirect 注入分类、防御分层（input/execution/output/data） | 3 个独立安全面经源（知乎专文/专栏/面经站） | `mcp.md` S4 扩展为"Agent 安全总节"（与现有四攻击面合并） | ✅ 已写入 2026-10-11（S4.1-4.4；注意 OWASP LLM Top 10 已是 2026 版非 2025） |
| 🔶4 | **C 课**：经典范式点名（ReAct / Plan-and-Execute / Reflexion / self-consistency / ToT） | 英文系统设计标准题（ReAct vs Plan-and-Execute） | `system-design.md` 新增"S8 范式速查"（5 名 × 机制 × 适用场景，30 秒版） | ✅ 已写入 2026-10-11（S8） |
| 🔶5 | **interview-bank**：行为面 STAR 模板 + 5 道常备题（最大挑战/失败/冲突/为什么做 agent/为什么来） | 英文面经确认 behavioral 轮仍存在 | `interview-bank.md` 新增节 | ✅ 已写入 2026-10-11（§8，早于 Phase 4 计划） |
| ⚪ | 算法编码（LeetCode medium）——不在教程范围，需另轨 | 英文面经：仍会出 | 不写入教程，另轨备考 | 并行 |

**面经趋势印证**（2026 版面经共识）："RAG 考频下降，Agent 工程（记忆/工具可靠性/恢复）+ 评测（judge/轨迹评测）成主航道"（真实公司面经占比：agent 架构 33% / 系统设计 22% / 工程实现 22% / RAG 18%）→ 我们 P0 选 C/E/H、强项押 F/G/H/K 的排序被印证，无需调权。

### 4.3 学习顺序（分阶段，含每课动作与出口判据）

> **2026-10-11 讲义展开轮（本次）**：C / N / E / H 四门课已从"结构建成"展开为**开课版完整讲义**（每课：逐节讲解散文 + 4 张 mermaid + 实战走查节 + 常见错误/追问节 + 题库扩充）——C 14 题 / N 12 题 / E 16 题 / H 14 题（原各 4-10 题）。四课共 16 张 mermaid 已构建渲染为 SVG 验收通过。引用已一手源复核并修正 4 处：ToT 会议 ICLR'24→**NeurIPS 2023**、Self-Consistency arXiv 2210.17392→**2203.11171**、Codex Linux 沙箱 Landlock+seccomp→**bubblewrap+seccomp（Landlock legacy）**、A2A 补 **v1.0.1 + AAIF 8 家 TCC 名单**；E2B 的"~150ms/128MB"改为官方口径（未公开固定数值）。⚠️ 两条私有锚点（Claude Code 供应链事故 2025-07、rig-skill）**查无公开一手源**，已降级标注、待作者回填。开课 = 提问演练（另约时间）。
>
> **2026-10-11 Phase 2 讲义展开轮（本次）**：G / I / J / K 四门课同样展开为**开课版完整讲义**（各 4-5 张 mermaid，共 17 张；新增『实战走查』与『常见错误与面试官追问』节；题库各 8-10 → **14 题**）。引用一手源复核修正 8 处：MCP spec 版本线整段重写（**Streamable HTTP 与 OAuth 2.1 均为 2025-03-26 引入**、2025-06-18 加 elicitation/工具结构化输出、2025-11-25 加 OIDC 发现、2026-07-28 为去状态化+server/discover+订阅）、删掉**不存在的『OpenAI Registry/371 条目』**（URL 实测 404）、A2A TSC **8 席**（补 Cisco/ServiceNow）、生态规模数字改标『据媒体报道』、Anthropic **原生 structured outputs（`output_config.format`）+ strict tool use**（原写法已过时）、OpenAI 无 99.9% 遵循率官方数字、`effectively-once` 改用 Temporal/GCP 官方措辞、jitter 出处回填 AWS Architecture Blog (Marc Brooker, 2015)。**K 课实战走查回填了真实三轮评测数据**（FinHot `.data/eval/selection-all-200-*.json`，n=200/seed=7）：precision 0.256→**0.304**→0.272、accuracy 0.611→**0.676**→0.654（第二轮在 gold 重标后退步 → 提示词杠杆耗尽的实证）。四课共 17 张 mermaid 已渲染为 SVG 验收通过。
>
> **2026-10-11 Phase 3 讲义展开轮（本次）**：D / F / L / M 四课同样展开为**开课版完整讲义**（各 4 张 mermaid，共 16 张；新增『实战走查』与『常见错误与面试官追问』节；题库各 8-10 → **14 题**）。备课核对仓库真实资产：D 课对齐 harness-demo 的 `demo.jsonl` 实测事件分布（22 行：init×1 / model_response×6 / tool_intent×6 / tool_exec×8 / final×1；`compaction`/`crash` 仅 schema 定义未出现）；M 课对齐 framework-demo 的 10 条 `ok()` 断言（+1 整体判定=11/11）与 allowedTools 抢跑坑；F 课对齐 rag-demo 机制与指标（HashEmbedder FNV-1a 768 维 / BM25 k1=1.5,b=0.75 / RRF k=60 / 85 chunks / recall@3=1.00、@5=0.94、@10=1.00）。待核实项仅保留无法用仓库资料或确定常识确认的少量条目（量化收益差异、LangGraph/OpenAI 审批原语、A-MEM/Zep 论文出处、GenAI stable 时间线），未编造任何 arXiv 号/年份。

| 阶段 | 内容 | 每课动作 | 出口判据 |
|---|---|---|---|
| **Phase 1 · P0 收口** | C → E（续 S2）→ H | 讲解（先完整讲完，提问后续约）+ 各课题库 8 题 + 🔶4（C 范式）/ sandbox-demo src / 🔶2（H 指标演进） | 3 课讲完 + 24 题通过 + S2 demo 验收通过 |
| **Phase 2 · P1** | G → I → J → K | 同上 + 🔶3（I 安全总节） | 4 课讲完 + 32 题通过 |
| **Phase 3 · P2** | D → F → L → M | 同上 + 🔶1（L 八股升级） | 4 课讲完 + 32 题通过 + L ~15 道八股可答 |
| **Phase 4 · 面试演练** | 模拟面试 ×2 + 缺口收尾 | 按 `interview-bank.md` §2 执行（自我介绍→项目深挖→白板→设计→快问→反问） | 两轮均可追问到底 + 覆盖矩阵全 🟢 |
| 并行轨 | LeetCode medium（范围外）/ 字节 JD 人工补盲（待办 3） | 独立于课程 | ~50 题 / 20-30 条 JD |

### 4.4 完成判据（Definition of Done）

- **单课**：讲解完成（用户习惯：先完整讲完、后续再提问）→ 该课题库 8 题通过 → demo（若该课有）跑通并验收
- **面试就绪**：Phase 1-4 全过 + 覆盖矩阵（`interview-bank.md` §6）全 🟢 + 能连续通过 2 场 60 分钟模拟（自我介绍→任一项目被追三层→白板 20 分钟 agent→设计题 30 分钟）

**用户偏好（重申）**：先完整讲完再提问（提问另约时间）；当前阶段以讲解 + 面试知识为主，实操跟课走；模型选择：写 agent demo 必须用支持 tool calling 的模型（现用 `qwen3.8-flash-next`）。

---

## 五、环境事实（踩过的坑）

1. **`/usr/bin/node` 是 v12.22.9**（不支持 `??`/顶层 await）。现代 node：
   `~/.nvm/versions/node/v22.23.2/bin/node`。跑 harness-demo 必须先：
   `export PATH=~/.nvm/versions/node/v22.23.2/bin:$PATH`
   （`viz/render.mjs` 已内置 re-exec 自举，直接 `node viz/render.mjs` 可用）
2. **gpt-load 代理的模型均不支持图像输入**（qwen3.8-27b、step-5-preview 实测），read 图片报 "model does not support images"。visualize skill 已内置降级：按 SVG 源码逐坐标核验并声明"按构造核验"。
3. **模型 tool-calling 能力参差 + 模型列表会轮换**（2026-10-10 晚 实测）：`qwen3.8-flash` 已下架 → `qwen3.8-flash-next` ✅（tools+SSE）；`qwen3.8-max` ✅；`step-5-preview` 仍在但 ❌ 不支持 tool calling。我用的 OpenAI 兼容代理（litellm 网关）的模型列表随时间变，**跑 demo 前先看 `GET /v1/models`**。
4. playwright 浏览器在 `~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`（无需下载）。
5. pi 1.1.0 与 0.85.1 两份安装在机器上共存，引用 pi 文档结论时**必须标版本**。

---

## 六、接手建议（按优先级，2026-10-10 晚 更新）

1. ~~核对 FinHot/.env~~ ✅、~~demo:compact 活体~~ ✅ —— 已完成，无需再动
2. 出练习题：`notes/*.md` 里题库已扩充（原 16 题 + 十课各 8 题 + interview-bank 交叉 10 道）；本次修的 5 个 bug（见待办 1）本身就能出 2-3 道好题（import 提升、wire 格式）；提问另约时间（用户要求整理阶段不急着考）
3. 下一步：按 §四 学习总纲执行 **Phase 1**：C 系统设计 → E 沙箱续 S2（写 sandbox-demo src）→ H 评测工程化；**🔶1-5 已全部写入（2026-10-11 四次整理：C-S8 范式速查 / H-S8 指标四代 / I-S4.2-4.4 OWASP 2026 双清单 / L-S7 八股速查表 / interview §8 行为面 5 题）**，十课知识结构已建成，开课 = 展开讲解 + 提问演练（用户要求整理阶段不急着考，提问另约时间）
4. 补强优先级（interview-bank.md 覆盖矩阵 🟡→🟢）：① sandbox-demo src ② harness-demo 加 OTel 埋点导出 ③ 本地 MCP server 投毒演示
5. 若用户提供目标 JD（字节等），重新校准 P1/P2 权重（一手数据在 `jd-research/`）

---

## 七、关键记忆索引（本会话写入的 durable memory）

- `#38` learn-agent-harness 全局安装形态与适配决策
- `#39` 机器环境两坑（node 12 / 无视觉模型）
- 相关历史：`#34` FinHot 第三起外部破坏（幽灵事故）、`#36` 推演飞轮方案
- `#41` gpt-load 代理模型轮换 + harness-demo/.env 自包含（2026-10-10 晚）
