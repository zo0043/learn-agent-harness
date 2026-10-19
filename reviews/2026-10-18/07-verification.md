# 对抗复核报告（adversarial verification）

- 复核员：`verifier`｜时间：2026-10-19 00:03（Asia/Shanghai，基准日仍按 CHARTER 取 2026-10-18）
- 立场：**不采信任何专家自述**。凡入账的裁定，证据栏只写我本人重跑的命令原文与我自己看到的关键输出。
- 基准日：2026-10-18（Asia/Shanghai），与 CHARTER 第 6 行一致。

## 1. 覆盖策略与抽样规则

### 1.0 范围与规模
6 份报告共 **57** 条 finding（`01-tech-core` 12 / `02-tech-state` 6 / `03-fact-timeline` 9 / `04-pedagogy` 15 / `05-editorial` 7 / `06-presentation` 8），严重度分布 **blocker 4 / high 16 / medium 22 / low 15**，与 Lead 交接数字一致（我按 `grep -n '^### '` 逐份索引核对）。

**注意一处交接错位**：Lead 给的 ID 前缀是 `TECHCORE-`，而 `01-tech-core.md` 实际用的是 **`TECH-A-`**（`TECH-A-F1…F12`）。本报告一律用**实际 ID**，避免综述引用时对不上。

### 1.1 全量层（逐条复核）
**4 条 blocker + 16 条 high = 20 条，全部逐条复核，无遗漏。**

### 1.2 抽样层（medium + low）
- 总量 37 条（medium 22 + low 15），**我实抽 13 条 = 35.1%**（≥30% 要求满足）：medium 8/22 = 36.4%，low 5/15 = 33.3%。
- **抽样规则（先定规则再看内容，避免挑好核的）**：
  1. **每个报告至少 2 条**（硬约束，防某一视角整体漏检）；
  2. 优先抽**结论最反直觉或影响最大**者——例如"扩展被说成内建"（TECH-A-F10）、"meta description 全站同一句"（PRES-F3）、"题数标签多算 1"（PED-F12）、"硬编码 8 与派生 {items.length} 并存"（EDIT-F7）；
  3. 优先抽**可用低成本命令在我本机复现**者，把网络预算留给 high 里的一手源项；
  4. 同报告内优先抽**能被第三方用一条命令证伪**的定量断言（行数、题数、HTTP 状态码、registry 版本），而非判断型断言。
- **实际抽中清单（13）**：

| 报告 | 抽中 | 报告内条数 |
|---|---|---|
| 01-tech-core | `TECH-A-F10`、`TECH-A-F11` | 2 / 7 |
| 02-tech-state | `TECHSTATE-F3`、`TECHSTATE-F6` | 2 / 4 |
| 03-fact-timeline | `FAC-F3`、`FAC-F8` | 2 / 7 |
| 04-pedagogy | `PED-F12`、`PED-F15` | 2 / 8 |
| 05-editorial | `EDIT-F5`、`EDIT-F7` | 2 / 4 |
| 06-presentation | `PRES-F3`、`PRES-F4`、`PRES-F5` | 3 / 7 |

### 1.3 我的证据纪律（自查）
- 每条裁定只写**我自己跑出的命令与输出**；凡引用专家数字，一律先自己重跑再比对。
- 需要写盘的实验（`demo:otel:assert`、`durable-execution` 的 `.state`）**全部在 `/tmp` 的 `git archive HEAD` 副本或 `cp -r` 副本上做**，工作区零写入（`git status --porcelain | wc -l` 起始 31、结束 31）。
- **我自己踩过两次坑，一并记录以示证据可信度边界**：① 用 `| head` 截断 grep 输出，误以为 `learn.astro` 没有「17 个 demo」；② 用 `cut -c1-150` 截断行，误以为 `handoff.md:191` 行号错位。两次都靠"回到原文整行读"纠正。**结论：任何指控必须基于整行原文，截断输出不得作为反证。**

## 裁定账本

> 字段：`原ID | 原严重度 | 裁定 | 我的证据/反证（命令+关键输出）| 我的置信度`
> 裁定 ∈ {confirmed, falsified, undetermined}。

| 原ID | 原严重度 | 裁定 | 我的证据/反证 | 我的置信度 |
|---|---|---|---|---|
| TECH-A-F1 | blocker | **confirmed**（证据强于原作） | `git archive HEAD \| tar -x -C /tmp/rag-head` 建干净树后 `npm run demo:otel:assert` → `❌ 工具状态分布：denied=1/1 error=2/0 ok=5/7`、`❌ otel 断言失败 2 条`，exit=1 | 高 |
| TECH-A-F2 | high | **falsified（结论层）**，机制层 confirmed | 干净 HEAD 树实跑 `tsx src/evaluate.ts` → `recall@5 = 0.44`、`132 个 chunk`（与声明逐字一致）；工作树跑 → `0.38`、`135`。漂移并非「声明已过期」 | 高 |
| EDIT「正面确认 #2」 | （非 finding） | **confirmed** | 同上 HEAD 实跑：声明值 0.44/132/PASS 3/8 在 HEAD 成立；`notes/rag.md`、`handoff.md` 工作树与 HEAD 无差异（`git diff --stat HEAD` 空），唯一差异文件为 ` M notes/agent-harness.md` | 高 |
| EDIT-F1 | blocker | **confirmed**（严重度建议 high） | `grep -n '17' site/src/pages/learn.astro` → `199:…17 个 demo 不是终点作品…`、`204:…17 个 demo 是每个 milestone 的参考答案`；`index.astro:112:不是读完 17 个 demo 就结束`。`courses.ts:298 export const WORK_COUNT = 6`；`works.astro:35-42` `DEMO_RUN_MODE` 恰 6 键，`<section class="work" id=…>` 仅 6 个 demo（+whiteboard/trajectory/roadmap 三个非 demo 节） | 高 |
| EDIT-F3 | blocker | **falsified**（降为 low 措辞项） | `grep -n 'png' .gitignore` → **无任何匹配**；`git log --all --diff-filter=A -- '*.png'` → **0 个提交**（全历史/全分支从未有过 PNG，故"迁移丢失"反证成立）；`find . -name '*.png' -not -path '*/node_modules/*'` → **0**。README:26 本身把 `viz/render.mjs` 登记为可用工具（SVG→PNG），故 PNG 是**能力声明** | 高 |
| TECH-A-F3 | high | **confirmed** | `grep -n "11 spans" site/src/pages/works.astro` → `133:…实测 11 spans / 1 trace`、`393:demo:otel 实测 11 spans/1 trace`；而 `notes/harness-from-scratch.md:210` 同一事实写「历史「11 spans / 1 trace」为活端点报告值…**未验证**——不作为任何判据」，`details/06:27` 同。站点"实测" vs 课程"未验证"直接对冲 | 高 |
| TECH-A-F4 | high | **confirmed** | `grep -rn "24 分钟\|25 分钟"` → 24：仅 `notes/agent-harness.md:212`、`notes/observability.md:299`；25：`agent-harness.md:420`、`sandbox.md:28/:35/:87/:421/:513`、`interview-bank.md:135`、`sandbox-demo/src/demo.ts:63/:70`、`interview.astro:40/:76`。且 `sandbox.md:421` 表头 `18:00–18:25` 与 25 自洽 | 高 |
| TECH-A-F5 | high | **confirmed（双重）** | ①门序：`harness-from-scratch.md` mermaid 为 `TC→V{校验名称已注册？参数合法？}→P{policy.decide}`，而 `agent.ts:186` 先 `o.policy.decide(name)`，deny/approve 分支 `:187-205` 在 intent(`:209`) 与 `callTool`(`:219`) 之前 → 顺序相反。②我自写探针 `npx tsx /tmp/my_polcheck.mts` → `decide(city) => deny (无匹配规则，默认拒绝)`，故未注册工具在 `agent.ts:187` 就被拒，**到不了** `tools.ts:105` 的 `未知工具: city`；`demo.ts:60` 确认用 `DEMO_POLICY` | 高 |
| EDIT-F2 | high | **confirmed** | `handoff.md:199`「**十六个知识域**知识结构已建成」vs 同文件 `:191`「六个口径（15 域/…）」、`:119`「15 个知识域」、`README.md:38`「15 个知识域」、`knowledge-map.md:11-12` 口径块「**知识域 15**」+`:72`「合计 15 个知识域」 | 高 |
| PED-F2 | high | **confirmed（6 条边全部复现）** | 我自写 `/tmp/prereq.mts` 提取站点：`07 mcp P1 prereqs=[sandbox]`、`09 multi-agent prereqs=[system-design,harness-from-scratch]`、`12 observability prereqs=[api-engineering]`、`13 long-term-memory prereqs=[rag]`、`15 model-basics prereqs=[llm-timeline]`、`16 framework-ecosystem prereqs=[agent-harness]`；图侧实读 `knowledge-map.md:109` `HARNESS --> MCP`（唯一入边）、`:113-114` `SYSDESIGN-->MULTIAGENT`+`EVAL-->MULTIAGENT`、OBS/MEMORY/MODEL/FRAMEWORK 仅虚线到 INTERVIEW、无实入边 → 6 处全部不一致 | 高 |
| PED-F3 | high | **confirmed** | 实读 `knowledge-map.md:128`「**建议开课顺序**:系统设计 → **多智能体编排** → 沙箱与凭据(续 §S2)→ 评测工程化…」与 `:162`「开课顺序确认（当前建议：系统设计 → **沙箱与凭据（续 S2）**→ 评测工程化…」：第 2 位互斥；两者起点均为"系统设计"，而站点数组序起点是 `llm-timeline → harness-from-scratch → …`（我提取的 17 项序） | 高 |
| TECHSTATE-F1 | high | **confirmed（官方一手源）** | ①`web_fetch …/specification/2026-07-28/changelog` → 导航栏 `### Client Features: Roots / Sampling / Elicitation`、`### Server Features: Overview / Discovery / Prompts / Resources / Tools`；②`web_fetch …/client/roots` → 「**Deprecated**: The Roots feature is deprecated as of protocol version `2026-07-28`」+「standardized way for **clients** to expose filesystem roots to servers … Servers can request the list of roots from supporting clients」；③changelog Deprecated §1「Deprecate the Roots, Sampling, and Logging features (SEP-2577)」+ Major §7「MRTR … replaces the previous approach of sending server-initiated requests, such as `roots/list`, `sampling/createMessage`」。对照 `mcp.md:87`「**原语（server 能提供的四类）**」含 sampling、`:98`「roots（server 声明它能碰的路径根——**server 端的 scope 声明**）」、`:505`「roots 是 **server 的自我声明**」→ 方向相反且漏标弃用 | 高 |
| TECHSTATE-F2 | high | **confirmed** | `/tmp` 副本照原文 `npx tsx src/worker.ts --mode=crash --crash=C` → 首行 `[worker] mode=resume …`、`REPORT_JSON:{…"crashPoint":"none"…"messageDeliveries":1}`、四步全跑完；对照空格形式 `--mode crash --crash C` → `[worker] mode=crash crash=C` + `💥 崩溃注入 C…process.kill(process.pid,'SIGKILL') 真实自杀`。根因实读 `worker.ts:17-20` `flag()` 用 `argv.indexOf(`--${name}`)` 精确匹配，`=` 形式返回 null → `mode` 回落 `"resume"` | 高 |
| FAC-F1 | high | **confirmed（事实层）；impact 需修正** | 本地：`grep -c "date: '" site/src/data/llm-history.ts` → **10**，末条 `188: date: '2025-01'` = DeepSeek-R1（`:187-200`）；`nav.astro:31` 自述 `2017 Transformer → 2025 DeepSeek-R1 · {LLM_HISTORY.length} 节点带权威出处`；`notes/llm-timeline.md:3/:14` 为「12 节点」、`:29` 末节点 `2026.07`。线上 `curl …/nav/` → HTTP 200 / 42733B，含 `10 节点带权威出处`、`2017 Transformer → 2025 DeepSeek-R1`（2025-01→2026-10 = 21 个月，成立）。**但**该页原文已把终点写成「→ 2025 DeepSeek-R1」，读者不会被误导为覆盖 2026，故"读者会把 2025-01 当当下代际"这一 impact 与页面自述冲突 | 高 |
| FAC-F2 | high | **confirmed（1.5.1 部分完全成立；"两处现行值互斥"需限定）** | 我直连 registry：`curl -s https://registry.npmjs.org/@langchain%2Flanggraph` → `latest = 1.5.1`、`modified = 2026-10-16T20:55:30.378Z`，故 1.4.21 与 1.5.0 **都不是 latest**（成立）。仓库三值并存：1.4.21（`README.md:18`、`framework-ecosystem.md:111`、`interview-bank.md:97`）、1.5.0（`framework-ecosystem.md:99/:292/:424`、`industry-2026.md:35`、`multi-agent.md:199`）。**但** `framework-ecosystem.md:426` 与 `industry-2026.md:35` 已显式区分「对照实跑快照=2026-10-12 的 1.4.21」与「截至 2026-10-13 复核 latest=1.5.0」并带删除线历史，故"互斥"只成立于 `README.md:18` 与 `interview-bank.md:97` 两处未标日期的副本 | 高 |
| PRES-F1 | high | **confirmed** | 线上实测：`curl …/map/`（54,385B）标题 DOM 序前 8 个全为 `<h2 class="dm-title">`/`<h3>`，`<h1` 出现在**第 22 位**（前有 1 h2 + 20 h3），h1 文本=`知识点总地图(面试导向:coding agent)`；`curl …/interview/`（48,030B）前 8 个为 `<h2>`/`<h3 class="review-sec">`/`<h4 class="review-group-title">`，`<h1` 在**第 13 位**，文本=`面试题库(模拟面试结构 + 交叉题 + JD 覆盖矩阵)` | 高 |
| PED-F4 | high | **confirmed** | `learn.astro:282`「**横向知识**：LLM 发展史与演进、行业调研等**不挂在任一阶段上**」vs `course-structure.ts:359-362` `slug:'industry-2026' … stage:'P4'`、`:86-96` `slug:'llm-timeline' … stage:'P0' … isHorizontal: true`；`nav.astro:21`「横向知识（位于 P0 之前）」vs `nav.astro` 把 LLM 时间线列入 P0 组 | 高 |
| PED-F5 | high | **confirmed** | `course-structure.ts:329` `prereqs: ['llm-timeline'],`，而 `:335-336` prerequisiteNote 要求「已上完 **LLM 发展史与演进**（…GPT 系 / o1 推理模型 / 开源系的代际差异）」。作者自证两资产不同：`:94` practicalOutput 写「横向资产另见 `mvpSlug=llm-history`（/nav 发展史 10 节点 + 5 代演进，与本文**互补**：模型史 vs agent 史）」，`nav.astro:17` 的 description 正是「LLM 发展史与演进横向知识总览」→ 链接指向错资产 | 高 |
| PED-F6 | high | **confirmed（实质）；计数需更正** | 我 `grep -c "判定"` = **17**（不是 16）；`grep -c "判定 clone 能跑"` = **13**（不是 14）；非 clone 型实为 **4** 条：`:94` build 型、`:127` 口语型、`:159` 口语型、`:370` **一手源型**（「判定 = 每条 [2026现行] 论断带官方一手源 URL + U-26 核实台账」——作者漏了这一类）。故真实分布 13/2/1/1 vs 作者 14/2/1。实质结论（2 门口语型不可判定 + 13 门只验参考实现能跑）成立 | 高 |
| PED-F7 | high | **confirmed** | `notes/data-flywheel.md:327`「`flywheel-demo/` **尚未存在**——clone 判据在规格 §5 定义」、`notes/model-basics.md:354`「`model-basics-demo/` **尚未存在**」；而 `for d in flywheel-demo model-basics-demo api-demo; do [ -d "$d" ]…` → **三个目录均 EXISTS**，且各自 `package.json` 都有 `"demo": "tsx src/demo.ts"`。api 侧确为较弱表述（`:260`「规划判据 = cd api-demo && npm run demo」），作者已自行列为波及点 | 高 |
| TECH-A-F10 | low | **confirmed** | `sed -n '80p' notes/rag.md` 确为「**pgvector（Postgres 内建 HNSW/IVFFlat）**」；我抓官方 README：`curl -sS -L https://raw.githubusercontent.com/pgvector/pgvector/master/README.md` → `Open-source vector similarity search for Postgres` + `Compile and install the extension (supports Postgres 13+)` → 是**扩展**不是内建 | 高 |
| TECH-A-F11 | low | **confirmed** | `sed -n '42,46p' harness-demo/src/demo.ts` 的 user prompt 为 5 条编号（第 4 条 = `用 run_shell 执行 "df -h"`）；`notes/harness-from-scratch.md:184`「已完成第 1/2/**3/5** 项；第 **4** 项 run_shell 被策略拒绝」与之自洽；而 `:200` 写成 6 步使 run_shell 变第 5 → 同节两套编号 | 高 |
| TECHSTATE-F3 | medium | **confirmed** | `grep -n "decide(\|runExec(\|execTool(" sandbox-demo/src/replay.ts` → `60: const v = cfg.policy.decide(call.tool, call.args);`、`80`/`91: const r = runExec(() => execTool(...))`（授权在前）；`sandbox.ts:87 return assertInWorkspace(this.config.workspace, raw)` 在 `:61` 定义、属执行期路径规范化；`scenario.ts:28-29` 的 `when` 用 `/(^\|\/)\.env$/`、`startsWith("work/ainews-new/")` 直接匹配**原始** `a.path`。而 `sandbox.md:284` 写「**先规范化再授权**」→ 与代码相反 | 高 |
| TECHSTATE-F6 | low | **confirmed** | 我实算：`node -e "const v=1/61+1/63; …"` → 精确 `0.032266458495966696`、5 位 `0.03227`、`2/62=0.032258`；`long-term-memory.md:399` 写 `0.03226` → 算式尾数错 1 位（且 0.03226 恰为"两路都第 2"的值，更易误导） | 高 |
| FAC-F3 | medium | **confirmed** | 我直连 registry：`curl -s https://registry.npmjs.org/@anthropic-ai%2Fclaude-agent-sdk` → `latest = 0.3.302`、`latest time = 2026-10-16T16:47:53.067Z`，版本尾巴 `0.3.296 → 0.3.299 → 0.3.300 → 0.3.301 → 0.3.302`；仓库侧 `README.md:18`/`framework-ecosystem.md:111`/`:426` 写 `0.3.296` | 高 |
| FAC-F8 | medium | **confirmed** | `grep -n "已逐条 web 核实" site/src/data/llm-history.ts` → `:4 * 唯一内容源：notes/process/site-refactor-plan.md §7（alex 审计后的权威事实表——已逐条 web 核实，`；`grep -n "记忆\|待复核" notes/llm-timeline.md` → `:40 …公认公开史实，日期来自记忆——**待复核**…` → 两文件核实状态自述相反 | 高 |
| PED-F12 | medium | **confirmed** | `sed -n '47p' site/src/pages/interview.astro` → `chip: '§3.2 / §3.3 · 10 题取 3',`；我用 awk 逐节重算：`3.1→5  3.2→5  3.3→4  3.4→4  3.5→4`，故 §3.2+§3.3 = **9** 题（`grep -n "^### 3\." interview-bank.md` 确认 3.2/3.3 两节存在）→ 标签多算 1 | 高 |
| PED-F15 | low | **confirmed** | `wc -l whiteboard/agent_whiteboard.py` → **178**；`~180 行` 见 `courses.ts:137`、`knowledge-map.md:146`；`~150 行` 见 `harness-from-scratch.md:6`、`:214` → 2×180 / 2×150 / 实测 178，三处不一致成立 | 高 |
| EDIT-F5 | medium | **confirmed** | `grep -rln "术语表\|名词表\|Glossary" … --exclude-dir=reviews --exclude-dir=analysis` → **0 命中（exit=1）**；`ls site/src/pages/` → 无术语页（404/c/details/index/interview/learn/map/nav/works） | 高 |
| EDIT-F7 | low | **confirmed** | `sed -n '50p;58p' site/src/pages/details/index.astro` → `:50 …<strong>{items.length} 个资深分水岭</strong>`（派生）vs `:58 <h2 class="dx-index-title">8 个分水岭一览</h2>`（硬编码）；`index.astro:215/:227` 亦硬编码 8；`ls notes/details/*.md \| wc -l` → **8**（当前自洽、增长即失效，作者的"此刻不矛盾"判断准确） | 高 |
| PRES-F3 | medium | **confirmed** | 线上逐页：`/`、`/learn/`、`/c/rag/` 的 `<meta name="description">` 前缀逐字相同（`learn-agent-harness —— coding ag…`）；首页 `property="og:"`=**0**、`name="twitter:`=**0**、`rel="canonical"`=**0** | 高 |
| PRES-F4 | medium | **confirmed（逐字命中）** | `for p in /sitemap.xml /robots.txt /sitemap-index.xml` → 全部 `404 11632`；父站 `curl -s https://blog.zero43.top/sitemap.xml` → `<loc>` 共 **55**，含 `learn-agent-harness` **0** 条 | 高 |
| PRES-F5 | medium | **confirmed（三处一致）** | 我实测该 URL：`curl -o /dev/null -w '%{http_code} %{size_download}' '…/learn-agent-harness/%EF%BC%88**33'` → `404 11632`；源文件 `knowledge-map.md:170` 确为「已上线 https://…/learn-agent-harness/（**33 个 html**…」；线上渲染为 `<a href="https://blog.zero43.top/learn-agent-harness/%EF%BC%88**33"`（`（**33` 被吞进 href） | 高 |
| PED-F1 | blocker | **confirmed（逐字命中）** | 我自写 `/tmp/pedf1b.mts`：knowledge-map 按「课程文件」列、course-structure 按 slug↔stage 配对 → `一致=5 冲突=9`，冲突 9 条与原文**逐条同名同值**（沙箱 P0/P1、长期记忆 P2/P3、durable P1/P2、评测 P0/P1、API P1/P2、数据飞轮 P1/P3、模型基础 P2/P3、框架 P2/P4、多智能体 P0/P1） | 高 |

## 2. blocker/high 复核明细

### 1.1 Lead 指定的跨专家冲突裁定：rag 评测数字（TECH-A-F2 vs EDIT 正面确认 #2）

**冲突不可调和，故必须择一。我的裁定：双方各对一半，但 `tech-core` 的措辞错在其「结论」，不在其「机制」。**

我的重跑，三组独立命令：

1. **工作树**（含未提交改动）：
   `cd rag-demo && npx tsx src/evaluate.ts`
   → `系统平均：recall@3 = 0.31   recall@5 = 0.38   recall@10 = 0.50（8 道范围内题）`、`PASS 3/8`、`gold 锚点解析：16/16 全部命中（文本锚点 → **135** 个 chunk 子串匹配）`
2. **干净 HEAD 树**（`git archive HEAD | tar -x -C /tmp/rag-head`，等价于一次字面 clone）：
   同命令 → `recall@3 = 0.31   recall@5 = **0.44**   recall@10 = 0.50`、`PASS 3/8`、`→ **132** 个 chunk 子串匹配`
3. **切块归因**（我自己的 `/tmp/chunkcmp.mts` 直接调 `splitMarkdown`）：
   `worktree: rag.md=35 agent-harness.md=55 handoff.md=45 合计=135` / `HEAD: rag.md=35 agent-harness.md=52 handoff.md=45 合计=132`

**结论（回答 Lead 的第 2 问）**：这是**"仅因评审时工作区有未提交改动"**引入的漂移，不是"仓库声明的真值已经漂移"。

- `git status --porcelain -- notes/agent-harness.md` → ` M notes/agent-harness.md`（起始即有，非本轮改动；`git status --porcelain | wc -l` = 31，与 CHARTER 第 12 行所述既有状态一致）。
- `git diff --stat HEAD -- notes/rag.md handoff.md` → 空；语料三成员里**只有** `agent-harness.md` 是脏的。
- 因此：**对外声明（recall@5=0.44 / 132 chunks）在 HEAD 下成立**；0.38/135 是本地脏工作区的产物，任何 `git clone` 这个仓库的读者都复现不到它。
- 站点渲染面 `site/src/utils/ragStats.ts` 在构建期解析的是 `notes/rag.md §13`（该文件工作树==HEAD），故**线上对外呈现的仍是 0.44/132，不是错值**。

**谁的措辞要改**：
- `tech-core`：`已过期` / `多处副本同源失效` 这两句**不成立**，必须改写为"声明值与 HEAD 一致；若把当前未提交的 `agent-harness.md` 改动提交，数字将漂移到 0.38/135"——即这是**未提交改动的潜伏耦合风险**，不是当前内容造假。其"漂移归因（52→55 chunks）"这一机制判断经我复算**完全正确**。
- `editorial`「正面确认 #2」：对"多处副本一致 + 站点走派生"的判断成立，但它是**在脏工作区上做的判断而未声明该状态**，严格说它没验证过"实跑值"，只验证了"副本之间一致"。建议在该条补一句"一致性已核，实跑一致性依赖工作区干净"。

**残余的真问题（降级，仍值得进综述）**：`notes/rag.md:298` 自设纪律"凡划改必须重跑 `demo:eval` 核对本节"在当前工作区**已被违反**——`agent-harness.md` 改了 14+/10− 却没同步 §13。这是**流程/O 级**问题，严重度 medium 及以下，不能写成"内容已过期"。

### 1.2 TECH-A-F1 的独立复核（我做了原作者没做的事：字面干净树）

原作者自认"唯一未做的是字面 `git clone` 到新目录"。我做了等价物（`git archive HEAD` 解包，且不污染工作区）：

- 干净树内 `harness-demo/workspace/` 只有 `docs/`，**无 `out/`**。
- `npm run demo:otel:assert` → `❌ 工具状态分布（deny 路径必须在场）：denied=1/1 error=2/0 ok=5/7`，`❌ otel 断言失败 2 条`，`[exit=1]`。
- **反事实实验**（我加的、原文没有的强证据）：在干净树里 `mkdir -p workspace/out && printf 'OTel 埋点验证完成\n' > workspace/out/otel.md` 后重跑 → `✅ 工具状态分布：error=0/0 ok=7/7`、`✅ otel span 树断言全部通过`，`[exit=0]`。
- 机制根因（我读源码定位）：`otel-mock-scenario.ts:88-91` 的 mock 第 5 步 `read_file {path:"out/otel.md"}` 去读该文件，而第 6 步只 `write_file out/otel-mock-run.md`——**场景自己从不创建 `out/otel.md`**；`.gitignore:21` 为 `harness-demo/workspace/out/`。缺失时 `read_file` 转成 error 态，故 `error=2/ok=5`。
- 裁定：**confirmed，且比原作更硬**。站点 `course-structure.ts:281` 把它写成 `exit 0 = 过` 的 clone 判据 → 干净 clone 必然背离，符合宪章 blocker 定义「对外声明与事实相反」。
- 附带发现（对 TECH-A-F3 的独立佐证）：`demo:otel:assert` 自己的输出里就写着 `ℹ️ 历史报告值 11 spans / 1 trace … 本次 mock 实测 15 spans / 1 trace → **数值不一致**`——即仓库工具层**已经知道** 11 spans 是历史值且与本场景不一致，`/works/` 却把它当"实测"呈现。

### 1.3 EDIT-F3 专项裁定（Lead 点名）：「能力声明」还是「资产声明」

**裁定：是能力声明；`editorial` 把它读成资产承诺属"自设验收边界"，故 blocker 不成立（falsified，残余降为 low）。**

| 检查项 | 我的命令 | 我的输出 | 对裁定的意义 |
|---|---|---|---|
| `.gitignore` 是否忽略 png | `grep -n 'png\|jpg\|svg\|image\|asset' .gitignore` | **无任何匹配** | 排除"故意不提交图"这一解释 |
| 历史是否曾有 PNG | `git log --all --diff-filter=A --format=%H -- '*.png' \| wc -l` | **0** | 全历史全分支**从未**新增 PNG → 不存在"迁移中丢失"的图 |
| 仓库自有 png 资产 | `find . -name '*.png' -not -path './.git/*' -not -path '*/node_modules/*' \| wc -l` | **0**（含 node_modules 时 8，全在依赖包内） | 资产数确为 0，但这是事实，不是失实 |
| notes 图片语法 | `grep -rn '!\[\[' notes --include='*.md' \| wc -l` 等三条 | `0 / 0 / 0` | 无悬空引用 → vault 不会因缺 png 而"渲染失败" |
| viz/ 产物 | `ls -la viz/` | 仅 3 个 `.mjs`，0 个 .png/.svg | 管线在、产物零 |
| 同括号另两项 | `$$` 块 8、inline `$` 行 71、mermaid 块 63 | LaTeX/mermaid **有内容**，PNG **无内容** | 该括号是**格式清单**，不是资产清单 |

**关键推理**：`README.md:34` 原句为 `…不要用 du（…）。Obsidian vault（LaTeX、mermaid、PNG 全渲染）。备考 coding agent 岗…`。括号紧跟"本目录即 Obsidian vault"，谓语是"渲染"，宾语是三种**格式**。「X 全渲染」陈述的是**渲染器支持**（这三种格式在这里都能正常显示），不是"仓库内含 PNG 资产"。同一份 README 的 `:26` 还把 `viz/render.mjs` 登记为「SVG→PNG 渲染器」并给出用法——**能力确实存在且已交付**，只是当前 0 次使用（17 门课用了 63 个 mermaid 块、8+71 处 LaTeX，没有几何图，故无需 PNG）。

所以 `editorial` 的推理链「README 提到 PNG ⇒ 承诺 PNG 资产 ⇒ 一张都没有 ⇒ 言过其实」在**第二步断裂**。裁定：**能力声明成立**（可验证：`render.mjs` 在、Obsidian 原生渲染 PNG）；**资产声明不成立**，因为原句并未声明资产。

顺带纠正其证据里的命令 bug：`find . -name "*.png" -not -path "./node_modules/*"` 只排除**顶层** `node_modules`，故数到 6；正确写法 `-not -path '*/node_modules/*'` 下是 8 个全部排除、仓库自有 **0**。结论（自有资产 0）不受影响，但命令与数字对不上。

**残余（low，可进综述）**：该短语对 PNG 是零实例的空口能力声明，属可删填充语；若要贴切应写成「mermaid 由站点客户端渲染」（且 PRES-F6 指出构建期并不渲染）。

### 1.4 PED-F1 复核方法说明（含我自己的纠错）

我第一次用"domain 名近似匹配"配对，得 `冲突=10 未匹配=2`，差点据此判 falsified；复查发现我的解析器把 `domain` 行与**下一条** `stage` 行配错（`slug`→`domain`→`stage` 间隔不固定）。改用 `slug↔stage` 相邻配对、`knowledge-map` 按第 4 列「课程文件」作 join key 后，精确落在 **9 条冲突**，与专家清单**逐字一致**（含 5 条一致项）。

裁定：**PED-F1 confirmed，9 门计数准确**。附注：该 finding 对解析方式敏感，综述引用时应写明 join key（slug / 课程文件），否则复现者易误判。

## 3. 抽样项与补充核查明细（要点摘录）

> 13 条抽样全部 **confirmed**，故这里只记**对定级/措辞有影响**的细节，命令原文见账本列。

- `TECH-A-F10`：官方 README 原话是「Compile and install **the extension**（supports Postgres 13+）」，`内建` 一词确实错；但该行同一句中「pgvector 是你的锚点：FinHot 生产就是 Postgres」的选型结论**不受影响**，low 定级合理。
- `TECHSTATE-F3`：确认的是**文档与代码顺序相反**，不是"demo 有漏洞"——`assertInWorkspace` 仍在执行期兜住越权写（作者也如此限定，未夸大为安全缺陷，属**正面记一笔**）。
- `TECHSTATE-F6`：纯算术，`0.03227` vs 讲义 `0.03226`；作者另外自己声明了"不主张 S10 与 R11 矛盾"的边界，克制得当。
- `FAC-F3` / `FAC-F8`：registry 与两处自述均按原文复现。
- `PED-F12`：我独立 awk 重算得 `3.2→5、3.3→4`，与作者一致；顺带确认 `interview.astro:47` 是**唯一**错标分组。
- `PRES-F3/F4/F5`：三条全部线上复现。`PRES-F4` 的数字（`404 11632`、父站 55 loc / 0 条本站）与我逐字相同。

**一处由我补充的正面证据（专家只断言"索引可用"，我做了独立核验）**：
`curl -s …/pagefind/pagefind-entry.json` → `{"version":"1.5.2","languages":{"zh-cn":{"hash":"zh-cn_59ab45d6b5ecd","wasm":null,"page_count":33}}}`，`pagefind.js` HTTP 200。
这同时独立佐证了口径块里的「站点 html 33」——**这是我在本轮见到的、唯一一个能用一条命令对上口径块总数的对外数字**。

---

## 4. 统计

| 严重度 | 总数 | confirmed | falsified | undetermined（未复核） |
|---|---|---|---|---|
| blocker | 4 | **3** | **1**（EDIT-F3） | 0 |
| high | 16 | **15** | **1**（TECH-A-F2） | 0 |
| medium | 22 | 8 | 0 | 14 |
| low | 15 | 5 | 0 | 10 |
| **合计** | **57** | **31** | **2** | **24** |

- 已复核 33 条（20 全量 + 13 抽样），占 57 条的 **57.9%**；其中**blocker/high 覆盖率 20/20 = 100%**。
- 抽样 13 条**全部 confirmed，零 falsified**——说明 medium/low 层的事实内核质量明显高于 blocker/high 层（后者两条问题都出在**把事实升格为结论**的环节，而非事实本身错）。

### 4.1 未复核的 24 条（逐条列出，不省略）
- 01-tech-core（5）：`TECH-A-F6`(m)、`F7`(m)、`F8`(l)、`F9`(l)、`F12`(l)
- 02-tech-state（2）：`F4`(m)、`F5`(l)
- 03-fact-timeline（5）：`F4`(m)、`F5`(m)、`F6`(m)、`F7`(m)、`F9`(l)
- 04-pedagogy（6）：`F8`(m)、`F9`(m)、`F10`(m)、`F11`(m)、`F13`(m)、`F14`(l)
- 05-editorial（2）：`F4`(m)、`F6`(l)
- 06-presentation（4）：`F2`(m)、`F6`(l)、`F7`(l)、`F8`(l)

> 这 24 条一律记 `undetermined（时间不足，未复核）`，**不是**认可其结论。

---

## 5. 必须从综述中剔除的条目

| 条目 | 一句话理由 |
|---|---|
| **`EDIT-F3`** | "README 承诺 PNG 资产却没图"不成立：原句是**渲染格式能力声明**（同括号内 LaTeX 有 8 个 `$$` 块 + 71 行 inline、mermaid 63 块，PNG 只是零实例），且 `git log --all --diff-filter=A -- '*.png'` **全历史 0 次**新增 PNG，`.gitignore` 也不忽略 png——"图在迁移中丢失"无从谈起。降级为 low 措辞项。 |
| **`TECH-A-F2`** | "声明值已过期、多处副本同源失效"不成立：干净 HEAD 树上实跑就是 `recall@5=0.44 / 132 chunks / PASS 3/8`，与声明**逐字一致**；0.38/135 只存在于**当前脏工作区**（` M notes/agent-harness.md`）。应改写为"未提交改动的潜伏耦合风险 + 违反 `rag.md:298` 自家纪律"，而非内容造假。 |

**建议降级/改措辞（不必剔除，但要改口径）**：
- `FAC-F1`：事实（10 节点、末节点 2025-01、滞后 21 个月、与 12 节点课程页并存）全部成立；但 impact 里"读者会把 2025-01 当成当下代际"与该页**自述** `2017 Transformer → 2025 DeepSeek-R1` 冲突，应改为"同站两个发展史终点不一致 + 该页缺 2025-02 之后内容"。
- `FAC-F2`：`1.5.1` 落后成立；但"两处现行值互斥"应限定为 `README.md:18`、`interview-bank.md:97` 两处未标日期的副本——`framework-ecosystem.md:426` 与 `industry-2026.md:35` **自己已明示**「快照 1.4.21 vs latest 1.5.0」，不是互斥。
- `PED-F6`：分布应改为 **13 clone 型 / 2 口语型 / 1 build 型 / 1 一手源型 = 17**（原文写 16 命中、14 clone，且漏了 `:370` 的一手源型）。
- `EDIT`「正面确认 #2」：结论不假，但**未声明该结论是在脏工作区上得出的**，应补"实跑一致性依赖工作区干净"。

---

## 6. 评审过程本身的失实

### 6.1 未发现的三类问题（先说没中的，防我自己凑数）
- **把 `analysis/` 或他人报告当证据：未发现**。全 6 份扫 `analysis/content|analysis/plan|.agent-teams|上一轮|00a-` 仅 3 处命中，且三处都**主动降格**：
  - `02-tech-state.md:69` 引用 `.agent-teams/archive/.../team.json:93` 时明写「**线索，未取信**：他人运行记录，非本次证据」——这是本轮**最规范的一处引用**；
  - `04-pedagogy.md:47` 声明「不依赖任何他人报告」；
  - `05-editorial.md:93` grep 时主动 `--exclude-dir=analysis`，并把唯一命中（评审产物）标注为"非仓库内容"。
- **对象 `file:line` 指向不存在的文件：未发现**。我用脚本从 6 份报告抽出 **154 个唯一路径引用**，全部带目录前缀的路径实测存在（抽查 `site/tools/check-counters.mjs`、`.github/workflows/deploy.yml`、`notes/details/05-hitl-security.md`、`harness-demo/workspace/docs/*.md`、`viz/chrome.mjs` 均 OK）；余下"未命中"是我正则只抓到 basename 所致，非报告缺陷。
- **把时间先后当因果：未发现**（`TECH-A-F2` 反而是**做了**因果复算——`splitMarkdown` 对 HEAD 版与工作树版分别切块得 52 vs 55，这一步我已独立复现，机制判断正确；它错的是结论定性，不是因果论证方式）。

### 6.2 已发现的问题
1. **`EDIT-F3`：自设验收边界（最严重的一处过程失实）**。把「vault 支持 PNG 渲染」的**能力声明**读成「仓库内含 PNG 资产」的**资产声明**，再以"资产为 0"判 blocker。宪章正文明令"自设边界＝最危险的失实形态"。**一份报告如果把"能力"与"库存"混为一谈，它给出的 blocker 就不能进综述。**
2. **`TECH-A-F2`：把工作区状态误当内容真值**。作者注意到了 ` M notes/agent-harness.md`（甚至用它做归因），却没有做**反向对照**（同一命令在干净 HEAD 上跑一次），于是把"未提交改动"升级成"对外声明已过期"。**缺一步对照，就把一个 O 级流程问题写成 high 级内容失实。**这是本轮最值得复用到流程里的一条教训：**凡"实跑 vs 声明不一致"，先问"跑的是哪棵树"。**
3. **`PED-F6`：计数与分类错位**（写 16 命中、14 clone；实际 17 命中、13 clone，且漏"一手源型"这一类）。结论方向不受影响，但**同一份报告里"用计数支撑结论"却又数错计数**，会削弱其可信度。
4. **`FAC-F1`：把"可能误读"写成"必然误读"**。页面原文自带终点标签，作者未处理这一反证即断言读者会被误导——属 impact 层的过度推演（事实层无误）。
5. **`FAC-F2`：选择性取证**。只引了写 1.4.21 的行，未提 `framework-ecosystem.md:426` 那段**已经显式区分快照与 latest** 的口径声明，导致"互斥"被放大。
6. **`PED-F8`：自设严重度边界（保守方向，轻微）**。其严重度栏自述"若按「同一事实 ≥2 处矛盾」计则触 high，但……故取 medium"——这是**作者自己重定义了宪章的 high 判据**。方向是往低判（无害），但性质上仍是自设边界，建议 Lead 在综述里统一一次严重度口径。
7. **交接信息错位（非专家责任）**：Lead 给的下游 ID 前缀 `TECHCORE-` 与 `01-tech-core.md` 实际使用的 `TECH-A-` 不一致。综述若照 `TECHCORE-` 引用会全部对不上号。

---

## 7. 我未验证的范围

1. **24 条 medium/low 未复核**（清单见 §4.1）——受时间与上下文预算限制，按协议优先保 blocker/high。
2. **未在本机跑任何构建**：`astro build` / `npm run build` 按宪章禁用；`site/dist`（89 文件 / 0 HTML）我未作为内容真源使用。**所有"站点呈现"类结论均以线上 `https://blog.zero43.top/learn-agent-harness/` 的 curl 输出为准**，因此：
   - `PRES-F2`（/works 4 个 h1）、`PRES-F6`（mermaid 客户端渲染需目检）、`PRES-F7`（deploy.yml 缺 dist 计数断言）、`PRES-F8`（搜索框无 label）**均未复核**；
   - 我**没有做浏览器目检**，任何"视觉/渲染效果"类判断都不在我的证据范围内。
3. **未做字面 `git clone` 到新目录**：用 `git archive HEAD | tar -x -C /tmp/rag-head` 等价替代（同一 commit 树、无 `.git`、无本地改动、无 gitignore 之外的状态），我认为对该 blocker 的判定等价；若 Lead 要求字面 clone，需联网取远端，我未做。
4. **外部事实只核了我用到的那几条**：MCP `2026-07-28` changelog / client-roots、npm `@langchain/langgraph`、`@anthropic-ai/claude-agent-sdk`、pgvector README、线上 sitemap/pagefind。**`FAC-F4/F5/F6/F7`（Claude GA 日、Claude 3 家族日期、GPT-4 Turbo 日期、A2A 入 AAIF 日期）我一条都没独立取证**，故全部 `undetermined`。
5. **`TECHSTATE-F5` 的 NSA 引语**：未取信也未证伪（无一手英文原文可比对），保持 `undetermined`。
6. **未评估教学法判断的"好坏"**：`PED-F6` 我只核了计数与字段分布，**"14 门课只验参考实现、不验学习者"这个教育学判断本身是否成立，我没有独立判据**，只能算"字段事实已确认"。

---

## 8. 我的三条"最该进综述"（排序）

1. **`TECH-A-F1`（blocker，我已用干净 HEAD 树 + 反事实实验双重坐实）**：站点把 `demo:otel:assert` 写成 `exit 0 = 过` 的 clone 判据，而干净 clone 必然 `exit 1`（`error=2/0, ok=5/7`）；补上那份被 gitignore 的 `workspace/out/otel.md` 才 `7/7`。这是本轮**唯一"照着做一定失败"**的缺陷，也是唯一被我做出因果闭环的一条。
2. **`PED-F1`（blocker，9/14 门课两套 P 标签冲突）**：我用 slug↔文件双 join 独立复算，**9 条冲突与专家清单逐字一致**。它直接决定"先学什么"，且 `/map`（读笔记 P0–P2）与 `/learn`（读 stage P0–P4）给相反答案——同一门课两个入口两个顺序。
3. **`TECHSTATE-F1`（high，唯一有官方一手源直接反证的技术错误）**：sampling/roots 被写成 **server 原语**（官方 Client Features 才有），roots 方向被写反（官方：clients 向 servers 暴露根，且明确"不是访问控制机制"），且漏标 `2026-07-28` 的 **Deprecated（SEP-2577）** 与 **MRTR 替代**。三处官方页面全部实抓，零解释空间。

> 附带提醒 Lead：`TECH-A-F1` 与 `EDIT-F1` 一个是"照着做会失败"、一个是"数错 11 个 demo"，都够 blocker；但 `EDIT-F3` 不成立——**如果把 EDIT-F3 留在综述里，综述的 blocker 数会虚高 1 条，而真正该被强调的 `TECH-A-F1` 会被稀释。**

<!-- 增量落盘锚点：每复核完 5–6 条即 edit 追加一次 -->

## 附录：预留锚点（已全部填充，保留供索引）

- `## 3. medium/low 分层抽样复核明细`
- `## 4. 统计`
- `## 5. 必须从综述中剔除的条目`
- `## 6. 评审过程本身的失实`
- `## 7. 我未验证的范围`

<!-- 增量落盘锚点：每复核完 5–6 条即 edit 追加一次 -->
