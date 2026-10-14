# learn-agent-harness

AI agent 开发学习系统 + **coding agent 方向面试备考作品**。

核心思路：用 AI 教 AI（pi-web 学习系统）的同时，把每节课的知识点落成**零框架可运行作品**——从零写 harness、零依赖 RAG pipeline、白板版……作品里每个文件对应课程一节，配套完整课程笔记与面试题库。

## 作品

6 个可运行 demo（`npm run demo` 一键复现；即下表六个**具名作品**目录——`memory-redteam/` 为回归套件/自研实操证据，按口径块**不计入作品数**，见 [knowledge-map 计数口径](notes/knowledge-map.md)）：

| 目录 | 内容 | 跑法 |
|---|---|---|
| [`harness-demo/`](harness-demo/) | **从零写 harness**：从零写 harness——agent loop / SSE 流式 / JSON schema 校验 / 权限门（deny>approve>allow，默认 deny）/ JSONL 轨迹 + 崩溃恢复 / token 压缩。13 个源文件（9 运行时 + 3 OTel 离线判据/断言 + 1 压缩自测）+ trajectories 落盘，覆盖 harness-from-scratch ①-⑩ 十节；5 种 demo 模式（正常 / 崩溃恢复 / 审批拒绝 / 压缩 / OTel 埋点） | `cd harness-demo && npm i && cp .env.example .env`（填自己的 key）→ `npm run demo` |
| [`rag-demo/`](rag-demo/) | **RAG 与检索**：从零写最小 RAG——chunker → hash embedder（768 维）→ 暴力余弦 ∥ BM25 → RRF 融合 → 强制引用 + 强制拒答生成 → 10 题 golden set 评测（recall@3=0.31 / @5=0.44 / @10=0.50，PASS 3/8，132 chunks；旧值 recall@3=1.00 出行号指针期 gold set、**已废**，口径见 [notes/rag.md](notes/rag.md) §13「数字口径」）。零依赖 tsx | `cd rag-demo && npm i` → `npm run demo:eval` |
| [`sandbox-demo/`](sandbox-demo/) | **沙箱与凭据**：TS 迷你沙箱——四通道 policy 引擎（allow/deny/approve/sandbox，deny 优先）+ FinHot 幽灵事故重放剧本（"权限门≠沙箱"：step 3 的 docker_compose_up 动作合法但被沙箱通道关进隔离命名空间）+ 确定性重放验收（3 次逐字节一致）。全离线零依赖 | `cd sandbox-demo && npm i` → `npm run demo` |
| [`mcp-demo/`](mcp-demo/) | **MCP 与供应链安全**：MCP 供应链投毒演示——对照组（注入指令劫持 send_email ❌）vs 四层防御（消毒/policy 门/沙箱断言/审计 ✅）+ 消融实验（L1 单独挡不住）+ 同进程两次重放逐字节一致。全离线 | `cd mcp-demo && npm i` → `npm run demo` |
| [`durable-execution-demo/`](durable-execution-demo/) | **durable execution**：长任务不丢不重——journal（intent→exec 双锚点）+ checkpoint 原子写 + 幂等存储 + mock 外部消息服务；3 种崩溃点（intent 前 / intent 后 exec 前 / exec 后）真实 SIGKILL 自杀重启，恢复按 §S8.2 判定表逐步行 replay / skip / unknown→confirm；验收 = 3 崩溃点 × 各 3 次，副作用计数恒=1、恢复报告逐字节一致（负向测试证伪有牙）。全离线零依赖 | `cd durable-execution-demo && npm i` → `npm run demo` |
| [`framework-demo/`](framework-demo/) | **框架生态** 实操：① Claude Agent SDK 指向自持 OpenAI/Anthropic 双格式代理，四能力实证——agent / 自定义 subagent（forwardSubagentText 证明委派真发生）/ permissions（canUseTool 拦截 rm）/ session resume（上下文延续），`npm run demo` 退出码 0 = 10 条 `ok()` 断言 + 1 条整体判定；② **三家 SDK 同任务离线 mock 对照**（Claude Agent SDK 0.3.296 / OpenAI Agents SDK 0.20.0 / LangGraph 1.4.21）——`npm run compare` 一条命令五维结构化对照、`npm run compare:assert` 16 条断言（本地 mock 端点：无外网、零 key、非真实模型实跑），逐维结论见 `framework-demo/docs/sdk-comparison.md`。含与 harness-demo 的"给什么/藏什么"对照表 | `cd framework-demo && npm i` → `npm run compare`（全离线）/ `npm run demo`（.env 需支持 Anthropic 格式 /v1/messages 的端点） |

配套资产（非 demo，支撑面试口述与站点）：

| 目录 | 内容 | 跑法 |
|---|---|---|
| [`whiteboard/`](whiteboard/) | 白板版 agent（~180 行 Python，面试口述用） | 直接读源码 |
| [`memory-redteam/`](memory-redteam/) | **长期记忆自研实操**（按计数口径**不计入 6 作品数**，见 knowledge-map 口径块）：写路径 7 项能力（信任分级/注入扫描/高危审批/审计留痕/冲突消解/时效窗口/遗忘传播）+ BM25∥字符三元组 hash 向量 RRF 混合检索（逐条注入理由审计）+ JSONL 跨进程持久化（三方 digest 逐字节一致）+ 16 条红队探针（逐层消融 18/18 层承重） | `cd memory-redteam && npm run demo`（全离线零依赖；`node test.mjs` / `--ablate` / `--persist` 可重跑判据） |
| [`viz/render.mjs`](viz/render.mjs) | SVG→PNG 渲染器（node12 re-exec 自举 + playwright-core，复用本机 Chromium 零下载） | `node viz/render.mjs x.svg` |
| [`site/`](site/) | Astro 公开学习站（本仓库内容的网站形态，GitHub Pages 部署） | 构建 `cd site && npm i && npm run build` |
| [`.github/workflows/verify.yml`](.github/workflows/verify.yml) + [`site/tools/visual-check.mjs`](site/tools/visual-check.mjs) | **站点结构+几何回归（W4/t5，补「本机构建留浏览器目检」缺口——本机 astro build 曾多次 OOM（exit 134/137，曾留 85 文件/0 HTML 残骸）；2026-10-13 t21 独立实测证伪「必然 OOM」：本机全量构建可约 8 分钟成功（2026-10-14 复测 `astro build` 484s / exit 0，「33 page(s) built」，dist HTML=33 含 404.html 与 nav/index.html；此前另有 17 分钟与 560s 超时被杀的非 OOM 记录），可行但不可依赖，CI 仍是可靠回归路径）**：CI（ubuntu-latest）构建站点 → headless Chromium 3 视口（375/768/1280）× 8 页（含自定义 404 页，t20）——无横向溢出（容差 4px）/ 关键元素可见（header 导航/页标题/卡片容器/课程正文+meta 栏；404 页=标题+3 引导卡片）/ 无 console error + 搜索入口交互（入口必须存在、缺失即失败）+ 负路径自证（fault 注入必须被检出，作业按设计失败）。绿基线 [run 38282562346](https://github.com/zo0043/learn-agent-harness/actions/runs/38282562346)（21/21）/ 注入负路径 [run 38282852860](https://github.com/zo0043/learn-agent-harness/actions/runs/38282852860)（按设计失败）/ 加固后 [run 38345995909](https://github.com/zo0043/learn-agent-harness/actions/runs/38345995909)（21/21）/ 含 404 页后 [run 38350151634](https://github.com/zo0043/learn-agent-harness/actions/runs/38350151634)（24/24，当时 dist HTML=32；2026-10-14 更正为 33，见 knowledge-map 计数口径块）。**只断言结构+几何，不覆盖视觉审美——像素级仍留浏览器人工目检** | CI 自动（push/PR）；本机预检 `cd site && node tools/visual-check.mjs --selftest`（自带 fixture，不依赖构建，26/26） |

作品要求 **node ≥ 18**；harness-demo / rag-demo 需任一支持 **tool calling + SSE 流式** 的 LLM 端点，framework-demo 的 `npm run demo` 额外要求 Anthropic 兼容格式端点（其 `npm run compare` / `compare:assert` 为全离线本地 mock、零 key）；sandbox-demo / mcp-demo / durable-execution-demo / `viz/` 全离线零 key；`whiteboard/` 需自备 LLM_API_KEY / LLM_BASE_URL（可选 LLM_MODEL）。

## 课程笔记（`notes/`）

**19 篇课程内容（顶层）**＝ 17 课程正文 + 总索引 `knowledge-map.md` + 面试题库 `interview-bank.md`；另有 `process/` 20 份设计/过程文档 + `details/` 8 篇专题（合计 47 个 md）。**体积不写绝对值**——口径随内容增长而漂移，需要时以 `wc -c` 实测为准：`find notes -maxdepth 1 -name '*.md' -printf '%s\n' | awk '{s+=$1} END{print s}'`（顶层）/ `find notes -name '*.md' …`（全部 47 个）；不要用 `du`（默认 4K 块取整，会高估约 7–10%）。Obsidian vault（LaTeX、mermaid、PNG 全渲染）。备考 coding agent 岗（Codex Core / Claude Code 类）的知识结构：

> `notes/` 顶层**恰为课程内容**（19 个 md）——这正是站点课程路由数 17 的来源（19 − `knowledge-map` − `interview-bank`，后两者有独立页面 `/map`、`/interview`）。设计/过程文档集中在 `notes/process/`，不生成课程页。

- **总索引**：[knowledge-map.md](notes/knowledge-map.md)——15 个知识域状态 + 分阶段学习路线 + 完成判据
- **面试题库**：[interview-bank.md](notes/interview-bank.md)——结构题 / 交叉题 / JD 覆盖矩阵 / 行为面
- **架构主线**：[agent-harness.md](notes/agent-harness.md)（15 节：第 1-2 节为回顾，3-15 为正文）· [harness-from-scratch.md](notes/harness-from-scratch.md)（从零写 harness 实录）· [rag.md](notes/rag.md)（RAG 与检索 实录）
- **知识域课程**：system-design / durable-execution / sandbox / evaluation / mcp / api-engineering / data-flywheel / long-term-memory / observability / framework-ecosystem / model-basics

## 学习系统（这个仓库的"为什么"）

本目录是 [amosblomqvist/learn](https://github.com/amosblomqvist/learn)（pi 作者的个人 AI 学习系统，视频《How I Use AI to Learn Things》）的 **pi-web 适配版**：teach/visualize 两个 skill + quiz/md-log 两个扩展，"教我 X" → probe（探测水平）→ plan（带依赖图的教学计划）→ teach（逐节点讲授 + 判分题），课程全文实时镜像进 `notes/`。

主要适配：

- 查证：tmux researcher subagent → `web_explore` / librarian worker（去掉 tmux 依赖）
- 配图：svg-maker/mermaid-maker subagent → 主会话直接创作（结构图写 mermaid 代码块；几何图手写 SVG → `viz/render.mjs` 渲染）；无视觉模型时按 SVG 源码逐坐标核验
- quiz：终端 pi 保留 TUI 选项面板；pi-web 降级为聊天判分（编号选项 → 报字母 → 立即判分 + 解释）
- 全局安装于 `~/.pi/agent/`，任意目录可用；本仓库 `AGENTS.md` 记录本目录行为约定

完整交接与维护记录见 [handoff.md](handoff.md)。
