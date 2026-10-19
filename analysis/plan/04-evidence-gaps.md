# 04 · 实施前证据补齐（evidence-gap / t4）

- 执行者：evidence-gap（team `remediation-plan`，task `t4`，attempt 1/2）｜时间：本轮（2026-10-16，与 `analysis/content/07`／`08` 同一系统时钟日）
- 任务：把三份设计（`01-source-layer` / `02-content-layer` / `03-form-layer`）会依赖、但上一轮**未核实**的关键判定补成 confirmed。
- 依据的未验证清单：`analysis/content/08-synthesis.md` §5.2 第 3–5 条（`08:315-317`）与备列（`08:194-203`）、`analysis/content/07-verification.md` §6（`07:157-169`）。
- **本文件的性质**：全部条目是**我这轮亲自读到的原文或亲自跑出的只读命令输出**；不转述上一轮报告结论当证据。
  凡转引他人结论处一律显式标注「（转引，未复核）」。

## 0. 边界合规与方法

- 只读；只新建本文件。跑完全部命令后 `git status --porcelain` 与跑前**逐字一致**：
  `?? analysis/` + `?? notes-restructure-plan.md` + `?? restructure-review-content.md` + `?? restructure-review-structure.md` + `?? restructure-verify.md`。
- 未跑任何会写盘的脚本（`astro build` / `visual-check.mjs` / `mermaid-check.mjs` / 各 demo / `final-project/grade.mjs`）；未联网（`web_search` 本轮不可用，`web_fetch` 未使用）。
- 全部命令为 `read` / `sed -n` / `grep` / `wc` / `ls` / `cat` / `python3`（纯文本统计）/ `node -e`（纯只读复算，不写文件）。
- 复算类命令（可直接重跑，输出见对应条目）：

```bash
# 计数与常量复算（只读）
ls -1 harness-demo/src/ | wc -l                       # → 13
ls -1 rag-demo/src/ | wc -l                           # → 15
wc -l whiteboard/agent_whiteboard.py                  # → 178
ls notes/*.md | wc -l; ls notes/process/*.md | wc -l; ls notes/details/*.md | wc -l   # → 19 / 20 / 8
node -e '<见 §1.3.1 的复算脚本>'                      # → COURSES 18 / COURSE_COUNT 17 / DOMAIN_COUNT 15 / 静态页 8 / 三桶并集 33
node -e '<见 §1.3.1 的目录扫描>'                      # → 精确 "demo" 键目录 10 / 含 demo* 脚本目录 11
grep -n "P0 ·\|P1 ·\|P2 ·" site/src/pages/works.astro # → 6 处 demo 档位标签
grep -c "check(" site/tools/check-counters.mjs        # → 13（含 :62 定义 1 次 → 判据 12 条）
find site/dist -type f | wc -l; find site/dist -name '*.html' | wc -l   # → 89 / 0（残骸，仅用于声明「无法目检」）
```

---

## 一、已补证（confirmed）

### 1.1 未通读站点页的逐页问题清单

> 覆盖：`site/src/pages/{works,interview,map}.astro`（818 行）+ `site/src/components/*.astro`（7 个，796 行）+ `site/src/layouts/Base.astro`（136 行）。
> 判定用语：**✓ 一致**（与唯一真源/实测相符）｜**✗ 错值**（活的错误数字/引用，用户可见）｜**⚠ 未核实**（本轮无法判定，进第 二 节）。

#### A. `site/src/pages/works.astro`（460 行）— 本轮抽检唯一有活错值的页：已知 2 处（W1/W2）+ **新查出 5 处**（W3–W6 错值/错引，W7 口径冲突）+ 1 处依据不足（W8）

| # | file:line | 用户可见文案（节选） | 判定 | 依据（我读到的原文 / 我跑的命令） |
|---|---|---|---|---|
| W1 | `works.astro:133` | `OTel GenAI span 实测 11 spans / 1 trace`（「5 种 demo 模式」表最后一行） | **✗ 错值** | `harness-demo/src/otel-mock-scenario.ts:50` `spanTotal: 15`；`:51` `byName:{invoke_agent:1,chat:6,execute_tool:8}`；`:57` `historicalReportOnly:{spans:11,traces:1,source:"handoff.md:77 / notes/harness-from-scratch.md:210（活端点报告值，无可复跑日志）"}`；`harness-demo/src/otel-assert.ts:7-8` 注释「判据来自 EXPECTED 契约常量…而**不是**『对齐历史材料的 11 spans』」；`harness-demo/README.md:39` 写「确定性 span 树 **15 spans / 1 trace**（2026-10-12 实跑值）」。→ 与 `08:198`、`07:64` 的 consistency-F1 逐字一致 |
| W2 | `works.astro:393` | Roadmap「OTLP 端到端」行：`demo:otel 实测 11 spans/1 trace` | **✗ 错值** | 同上。`grep -rn "11 spans\|11 span" site/src/` 的活命中只剩这两处（与 `07:64` 的「活表述只剩 works.astro:133 与 :393」一致） |
| W3 | `works.astro:224` | `沙箱与凭据（P0 · 🔄 S2 已实现）` | **✗ 档位错**（第 4 份档位副本） | 阶段单一真源 `site/src/data/course-structure.ts:168` `sandbox: stage: 'P1'`。此处写的 `P0` 是旧三档口径（`notes/knowledge-map.md` 优先级列），**不在 `check-counters.mjs` 任何判据内** |
| W4 | `works.astro:296` | `durable execution（P1 · ✅ S7 demo 已落地 2026-10-12）` | **✗ 档位错** | `course-structure.ts:238` `durable-execution: stage: 'P2'` |
| W5 | `works.astro:330` | `框架生态（P2 · 🔄 SDK 实操已落地）` | **✗ 档位错** | `course-structure.ts:344` `framework-ecosystem: stage: 'P4'` |
| W6 | `works.astro:398` | `应用形态层（本轮无协议级标准，industry-2026 §五）…token 15× 成本` | **✗ 错引**（数字所在节错位） | `notes/industry-2026.md:20`（§一「头部团队工程经验」第 2 条）与 `:59`（§四「资深 vs 初级分水岭」第 4 条）有「约 15 倍 token」；**§五（`:65-71`「候选域信号」）全节无该数字**。§五 里对应的是「deep research = 本轮无协议级新动作，属应用形态层」（`:69`）——即节号对得上、括号里的数字归属错位 |
| W7 | `works.astro:198` | `whiteboard · 白板版 agent（~180 行 Python）`（`index.astro:196` 同页广告位写「180 行」无波浪号） | **✗ 与笔记侧口径冲突** | 实测 `wc -l whiteboard/agent_whiteboard.py` → **178**；笔记侧两处写 **~150 行**：`notes/harness-from-scratch.md:6`、`:214`（`## ⑩ 白板蒸馏（…，~150 行纯标准库）`）。同一作品三处两种量级（150 / 180 / 实测 178） |
| W8 | `works.astro:352` | `SDK 把从零写 harness 的 6 个文件的"默认决策"全做了` | **⚠ 依据不足**（口径不明，非错值） | 溯源到 `notes/framework-ecosystem.md:84`「harness-demo 手写的 **6 个文件**（loop/工具/权限/会话/子代理/端点）」；但 `harness-demo/src` 实测 13 文件 / 9 运行时（`works.astro:101` 自己就是这么写的），且其中**没有子代理文件**（子代理只是 `notes/multi-agent.md` 的练习）。该「6」是教学分组，不对应任何可数集合 → 见第 四 节 |
| W9 | `works.astro:62` / `:408-413` | `{WORK_COUNT} 个可运行作品一览` / 口径脚注「共 6 个具名作品…实测为 10」 | **✓ 一致** | `WORK_COUNT = 6`（`site/src/data/courses.ts:298`）；我按目录扫描精确 `"demo"` 键目录 = **10**（`api-demo, durable-execution-demo, flywheel-demo, framework-demo, harness-demo, mcp-demo, memory-redteam, model-basics-demo, my-agent, sandbox-demo`），含 `demo*` 脚本目录 = **11**（多 `rag-demo`）——与 `courses.ts:289-296` 注释的逐项枚举、`notes/knowledge-map.md:16` 口径块**完全一致** |
| W10 | `works.astro:101` | `13 个 src 文件（9 运行时 + 3 OTel 离线判据/断言 + 1 压缩自测）` | **✓ 一致** | `ls -1 harness-demo/src/` = 13：运行时 9 = `agent context demo llm otel policy session tools types`；OTel 3 = `otel-assert otel-mock-scenario otel-mock`；1 = `test-compact` |
| W11 | `works.astro:123-135` | `5 种 demo 模式`（表 5 行：`demo` / `demo:crash` / `demo:reject` / `demo:compact` / `demo:otel`） | **✓ 一致** | `harness-demo/package.json` scripts 恰有这 5 个 + `demo:otel:mock` / `demo:otel:assert`（本页另在 `:117-118` 单列，未混入「模式」计数） |
| W12 | `works.astro:158/:170/:173/:175-177/:180` | rag 数字（`{rag.chunks}`、`10 题`、`recall@3/5/10`、`PASS {rag.pass}`、复测日期） | **✓ 一致（且为派生）** | 值来自 `parseRagStats()`（`site/src/utils/ragStats.ts:45-83`）构建期解析 `notes/rag.md` §13：`:283`「语料 = 课程笔记自己（… → 132 chunks）」、`:293`「**golden set（10 题：8 范围内 + 2 范围外）**：recall@3 = 0.31 / recall@5 = 0.44 / recall@10 = 0.50（PASS 3/8，2026-10-12 …）」、`:295`「数字口径（重要）：旧版宣称的 recall@3=1.00 / @5=0.94 出自…已废」；解析失败即 throw（`ragStats.ts:36/54/60/65/72`），无硬编码回退 ✓ |
| W13 | `works.astro:94/:149/:262` | `从零写 harness（P0）` / `RAG 与检索（P0）` / `MCP 与供应链安全（P1）` | **✓ 一致** | `course-structure.ts:101 / :134 / :185`（stage 依次 P0 / P0 / P1） |
| W14 | `works.astro:44-46` | 注释「六个 demo 锚点从 `DEMO_RUN_MODE` 派生（**插入序 = 页面 section 序**）」 | **⚠ 注释与实测不完全一致**（低） | `DEMO_ANCHORS = Object.keys(DEMO_RUN_MODE)`（`:46`）= 6 项；页面还有一个 `id="whiteboard"` 的 section（`:197`）夹在 `rag-demo`(:147) 与 `sandbox-demo`(:222) 之间但**不在锚点表内**。锚点序 ≠ 完整 section 序（`trajectory` :367、`roadmap` :382 亦无锚点） |

#### B. `site/src/pages/interview.astro`（205 行）— 新查出 1 处活错值

| # | file:line | 用户可见文案 | 判定 | 依据 |
|---|---|---|---|---|
| I1 | `interview.astro:47` | 分组 chip：`§3.2 / §3.3 · 10 题取 3` | **✗ 错值（应为 9）** | 我按 `###` 分节统计 `notes/interview-bank.md` 的 `^- Q\d+` 行：`### 3.2 FinHot labeler`(`:36-41`) = **5 题**、`### 3.3 backfill 1645 行`(`:43-47`) = **4 题** → 合计 **9**，不是 10 |
| I2 | `interview.astro:38` | `§3.1 · 最稀缺故事，5 题取 3` | **✓ 一致** | `notes/interview-bank.md:29-35` `### 3.1` = 5 题 |
| I3 | `interview.astro:56` | `§3.4 / §3.5 · 8 题取 3` | **✓ 一致** | `:49-54` = 4 题 + `:55-61` = 4 题 = 8 |
| I4 | `interview.astro:65` | `§4 · 10 题取 3` | **✓ 一致** | `notes/interview-bank.md:62-76` §4 表行 `^\|\s*\d+\s*\|` = 10（`check-counters.mjs:220` 同一算法） |
| I5 | `interview.astro:74` | `§8 · 5 题取 3` | **✓ 一致** | `notes/interview-bank.md:114-163` `^\*\*Q\d+` = 5（`check-counters.mjs:221` 同一算法） |
| I6 | `interview.astro:110/:136` | `top 15 题` | **✓ 一致** | 页面 `GROUPS`（`:34-82`）5 组 × 每组 3 卡 = 15 |
| I7 | `interview.astro:119/:124` | `/works/ 看 {WORK_COUNT} 个作品` / `/learn/ 按 {COURSE_COUNT} 课过一遍` | **✓ 一致（且为派生）** | `courses.ts:298` WORK_COUNT=6；`courses.ts:269` 复算 = 17（我 node 复算同值） |
| I8 | `interview.astro:170/:179` | `8 个分水岭细节` / `12 个演化节点` | **✓ 与笔记侧一致** | `ls notes/details/*.md` → 8；`notes/llm-timeline.md:3`「· 12 节点 ·」、`:14`「## 12 节点时间线」。**注意**：站点数据文件口径不同——`site/src/data/llm-history.ts:24`「LLM 发展历史时间线（§7.3 权威事实列表，**10 节点**）」，我复算 `grep -c "date: '" site/src/data/llm-history.ts` → **10**（即站点自述与数据一致，但与同站点的 `/interview/` 文案「12 个演化节点」和 `notes/llm-timeline.md:3/:14` 的 12 冲突——P8 的两套口径，见 §1.2） |
| I9 | `interview.astro:60` | `10 题 golden set 里 5 题 FAIL` | **✓ 一致** | `notes/rag.md:293`「**golden set（10 题：8 范围内 + 2 范围外）**…PASS 3/8」+ `:299`「**5 题 FAIL 的机制归因**（2026-10-12 复测）」（Q1/Q2/Q3/Q7/Q8） |
| I10 | `interview.astro:23-29` | `idOf()` 的 7 个章节前缀（`3.1 FinHot 幽灵事故`/`3.2 FinHot labeler`/`3.3 backfill`/`3.4 harness-demo`/`3.5 rag-demo`/`4. 交叉快速问答`/`8. 行为面试`） | **✓ 全部命中** | `notes/interview-bank.md:29 / :36 / :43 / :49 / :55 / :62 / :114` 逐条标题以该前缀开头。且 `idOf` 找不到即 `throw`（`:26`）= 构建期 fail-fast，属**已有**门禁 |
| I11 | `interview.astro:111` | `3 步动线 · 5 大考点分组 · 30 分钟快速链接` | **✓ 一致** | `:115`（3 步 pipeline）、`:136`（5 组）、`:165`（「只有 30 分钟？」块） |

#### C. `map.astro` + `components/*.astro` + `Base.astro`

| # | file:line | 内容 | 判定 | 依据 |
|---|---|---|---|---|
| C1 | `map.astro:3-12`（注释）+ `:46` | 页面本体：除 `DomainMap` 与 `notes/knowledge-map.md` 原文外**无任何手写数字** | **✓ 无手写计数** | 全文 66 行，数字只出现在 CSS（`:64-65` 字号）。注释自称「courses.ts 派生，P-05」——准确说组件同时用两份数据源（`course-structure.ts` 的 stage + `courses.ts` 的 status/intro），注释偏简（低） |
| C2 | `DomainMap.astro:33-51` | 构建期断言 `domains.length === DOMAIN_COUNT` 且去重 domain 数相等，否则 throw | **✓ 断言有效** | `courses.ts:278-282` DOMAIN_COUNT 复算 = **15**（我 node 复算：保留 15 条 → 15 个去重 domain）；`COURSE_STRUCTURE.filter(!isHorizontal)` = 17−2 = 15 ✓ 两侧相等 |
| C3 | `DomainMap.astro:72/:85/:94` | `{domains.length} 个知识域`、`{g.stage} · {g.cards.length} 域` | **✓ 全派生** | 无手写计数 |
| C4 | `Header.astro:6-19` | 导航 8 项（首页/导航/题库/学习路线/详解/作品/知识地图/时间线）；`404.astro:45` 写「顶栏**八个**导航项」 | **✓ 一致** | 数组实测 8 项；注释 `Header.astro:63`「≤720px **八个**导航项…收进汉堡浮层」与 `site/src/styles/global.css:1740` `@media (max-width: 720px)` 一致；`visual-check.mjs:78-82` 注释亦写「`@media (max-width: 720px)` 收汉堡」 |
| C5 | `Header.astro:23/:37` | 注释「它们不是 **17 课**线性主线」/「全站 **17 个**课程页」 | **✓ 一致** | COURSE_COUNT = 17（复算） |
| C6 | `NotePageLayout.astro:17` | 注释「`/c/` 路由数仍是冻结的 17」 | **✓ 一致** | 同上 |
| C7 | `Footer.astro:8/:11` | 「coding agent 工程师**五阶段**课程体系」/「内容由 Astro 从 `notes/` 在**构建期**渲染」 | **✓ 一致** | `course-structure.ts` `STAGES` 五档；`map.astro:19-20`、`interview.astro:17-18`、`c/[slug].astro` 均 `getCollection('courses')` + `render()` |
| C8 | `Base.astro:14` | 默认 `<meta name="description">`：`learn-agent-harness —— coding agent 工程师方向的五阶段课程体系：**17 课** · P0–P4 线性路线 · 每课带可运行参考样本 · **增量主线 my-agent** · 知识地图与面试题库。` | **✓ 数字一致；⚠ 与 coverage-F5 的措辞需并读** | 「17 课」= COURSE_COUNT ✓。**新事实**：`my-agent`（增量主线）在站点 meta 描述与 `index.astro:106-120`、`learn.astro:193-206` 都有活表述；`coverage-F5`（`08:201`）的断言范围是「`README.md`/`handoff.md` 零提及」，与此**不冲突**，但下游若写成「全仓零提及」即为错（见第三节 X-6） |
| C9 | `Base.astro:16` | `<title>` 默认值「learn-agent-harness · coding agent 五阶段课程体系」 | **✓ 无计数** | — |
| C10 | `TrajectoryTimeline.astro:142-153` | `{events.length} 个事件` / `总耗时 {fmtMs(totalMs)}` / `{toolCalls} 次工具调用` / `{denied} 次被拒` | **✓ 全派生** | 由 `src/data/trajectory.ts` 的 `events` 计算（`:112-121`），无手写计数 |
| C11 | `SiteSearch.astro` / `StatusBadge.astro` | 无任何用户可见计数 | **✓ 无手写计数** | 全文 146 / 13 行 |

**pages/components 汇总**：`works.astro` 活错值 **6 处**（W1/W2/W3/W4/W5/W6）+ 口径冲突 1 处（W7）+ 依据不足 1 处（W8）；`interview.astro` 活错值 **1 处**（I1）；`map.astro` 与其余组件**未发现错值**。

### 1.2 `08` §5.2 列的 medium 支撑项逐条取证

> `08:317` 明写：「本报告 Top 10 里凡是 medium 支撑的部分（如 P7 的 `index.astro` 首屏、P8 的 SDK 版本三处）…**需要它们进入实施清单前应再取一次证据**」。以下逐条补证。

#### M1（P7）`index.astro` 首屏专名与「首屏 6 个未定义概念」

| 判定项 | 结论 | 依据 |
|---|---|---|
| `08:144` 引用 `index.astro:48` 与 `:51-55` 是首屏承诺句 | **✓ 行号与原文均命中** | `index.astro:48` = `<p class="hero-kicker">coding agent 工程师 · 五阶段课程体系 · 每课带可运行参考样本</p>`；`:51-56` = `hero-sub`：`<strong>{COURSE_COUNT} 课 · 五个阶段 · {DOMAIN_COUNT} 个知识域</strong>，每门课都带 <strong>可运行的参考样本</strong>（clone 下来就能跑，全离线零 key）。课程之外还有一条<strong>增量主线</strong>：跟着 {MILESTONES.length} 个里程碑，亲手搭出你自己的 agent 工具——每个里程碑的参考答案，就是前面那门课的 demo。` |
| 「首屏 **6 个**未定义概念」这一计数 | **⚠ 无法逐条复现**（`08:144` 原文只写「首屏 6 个未定义概念」，未列清单） | 我能确认的是：① 该两处在首屏（`<h1>` 之后）；② 全页 `grep -n "SSE\|JSONL\|BM25\|RRF\|golden set\|journal\|checkpoint\|SIGKILL\|replay\|skip\|OTel"` 只命中卡片区，**无任何释义段/外链定义**；③ 首屏出现的未展开专名候选有 `coding agent`、`参考样本`、`增量主线`、`里程碑`、`clone`、`零 key` 共 6 个 —— 但**这 6 个是我按「未展开」圈定的，`08` 圈的是不是同样这 6 个无法证实**（见第四节） |
| `08:254` 的 blocker：`index.astro:156-157/164-165/185-186` + `404.astro:42` 共 **11 个**未展开专名 | **✓ 逐 token 命中，11 个成立** | `SSE`(index:156)、`JSONL`(:157)、`BM25`(:164)、`RRF`(:164)、`golden set`(:165)、`journal`(:185)、`checkpoint`(:185)、`SIGKILL`(:185)、`replay`(:185)、`skip`(:185)、`OTel`(404:42) —— 全部落在这 4 处，且同页无释义（与 `07:86` t6-F2 的独立复核一致） |

#### M2（P8）SDK 版本「三处」与模型名两套

| 判定项 | 结论 | 依据 |
|---|---|---|
| `08:159` 指 `framework-demo/README.md:167` 与根 `README.md` 作品表行把「LangGraph **1.4.21**」当现行 | **✓ 命中** | `framework-demo/README.md:167`「**LangGraph 1.4.21 没有 `Annotation.Root` 的 reducer 工厂**…」；`README.md:18`（framework-demo 作品行）「三家 SDK 同任务离线 mock 对照（Claude Agent SDK 0.3.296 / OpenAI Agents SDK 0.20.0 / **LangGraph 1.4.21**）」，**全行无时点限定语、无 1.5.0 提示** |
| `08:159` 的「**三处未同步**」具体是哪三处 | **✓ 已定位为 3 处（此前只点名 2 处）** | 按「活 `1.4.21` 且**全文件 0 处 `1.5.0`**」筛选（`grep -c` 逐文件）：`README.md`(1/0)、`notes/interview-bank.md`(1/0)、`framework-demo/README.md`(1/0)。另有两处**带限定语、不算未同步**：`framework-demo/package.json:16` `"@langchain/langgraph": "^1.4.21"`（依赖声明，非版本论断）、`handoff.md:12`「~~当前 1.0.1~~ **1.4.21**，2026-10-12 registry 复核」（已带复核日期） |
| 台账（`notes/industry-2026.md:108` 第 4a 行）称「`framework-ecosystem.md:91/:284/:394/:396`、本文件 `:24`、`multi-agent.md:191/:396`——**六处已同步刷新为 1.5.0**」 | **⚠ 台账行内行号已漂移，2/3 对不上** | 实测 `grep -c`：`notes/framework-ecosystem.md` = 4 × 1.5.0 ✓（命中 `:99 / :292 / :420 / :422`，**与台账写的 `:91/:284/:394/:396` 行号不同**）；`notes/multi-agent.md` 的 1.5.0 在 `:199` 与 `:443`（台账写 `:191/:396` ✗）；`notes/industry-2026.md` 的 1.5.0 在 `:35` 与 `:108`（台账写「本文件 `:24`」✗，`:24` 现为 §一 第 4 条的 Cognition 段落） |
| `08:158` harness-demo 默认模型 `qwen3.8-flash` vs `-next` | **✓ 逐条命中，另有第 4 处副本** | `harness-demo/src/llm.ts:24` `export const MODEL = process.env.LLM_MODEL ?? "qwen3.8-flash";`（无 `.env` 时的默认值）；`harness-demo/.env.example:4` = `qwen3.8-flash-next`；`harness-demo/README.md:30` = `-next`（heredoc 写 `.env`）；`rag-demo/src/llm.ts:26` = `-next`；`handoff.md:188`「`qwen3.8-flash` 已下架 → `qwen3.8-flash-next` ✅（tools+SSE）」。**新增副本**：`harness-demo/README.md:43`「实测某 OpenAI 兼容代理的 `qwen3.8-flash-next` ✅」 |
| `notes/harness-from-scratch.md:19/:198/:237` 仍以 `qwen3.8-flash` 作「本 demo 用的模型」叙述 | **⚠ 历史快照 vs 现状**（需设计者判定是否回填） | `:19`「`qwen3.8-flash` 支持（tools + SSE 均验证）→ demo 用 qwen3.8-flash」、`:198`「## ⑨ 完整 demo（`src/demo.ts`，真实模型 qwen3.8-flash）」、`:237`「实测环境…（qwen3.8-flash 支持 tools+SSE…）」。这些是 2026-10-10 的实录叙述，与「现已换 `-next`」并存；与 `handoff.md:85/:188` 同仓自相矛盾（属 P8 时效类，非新 finding） |

#### M3（P10）「17 个 demo」的渲染位置

| 判定项 | 结论 | 依据 |
|---|---|---|
| `08:185/:250` 列 3 处：`learn.astro:199/:204`、`index.astro:112` | **✓ 逐条命中，且恰好 3 处** | `grep -rn "17 个 demo\|17 demo" site/src/` → `learn.astro:199`、`learn.astro:204`、`index.astro:112`（`learn.astro:193` 是注释行，不含该字面）。**无第 4 处** |
| 这 3 处是否在门禁内 | **✓ 不在**（复核 `08:242`） | `check-counters.mjs:331-351` 的 7 处副本只落 `README.md` / `courses.ts` / `verify.yml` 三个文件；`grep` 全脚本无 `site/src/pages` 命中（除 §2b 的页面三桶派生，那是**文件系统**计数而非文案断言） |

### 1.3 结构事实（实施会用到、此前只有自述）

#### 1.3.1 `site/src/data/courses.ts` 各常量与读方全量

复算脚本（只读，可重跑）：

```bash
node -e '
const fs=require("fs");
const ts=fs.readFileSync("site/src/data/courses.ts","utf8");
const a=ts.indexOf("export const COURSES"), b=ts.indexOf("\n];",a);
const entries=[...ts.slice(a,b).matchAll(/slug: '\''([^'\'']*)'\'', domain: '\''([^'\'']*)'\'', phase: '\''([^'\'']*)'\''/g)].map(m=>({slug:m[1],domain:m[2],phase:m[3]}));
const wb=(ts.match(/const NON_COURSE_CARD_SLUG = '\''([^'\'']+)'\''/)||[])[1];
const hor=(ts.match(/const HORIZONTAL_PHASE = '\''([^'\'']+)'\''/)||[])[1];
console.log(entries.length, entries.filter(e=>e.slug!==wb).length,
  new Set(entries.filter(e=>e.slug!==wb&&e.phase!==hor).map(e=>e.domain)).size);'
# 输出：18 17 15   （= 条目 / COURSE_COUNT / DOMAIN_COUNT）
```

| 常量 | 定义处 | 值（复算） | 读方（`grep -rn` 全仓 `site/src` + `site/tools` + `.github`） |
|---|---|---|---|
| `COURSES` | `courses.ts:47` | 18 条 | 仅本文件内 `COURSE_MAP:244`、`COURSE_COUNT:269`、`CARD_COUNT:272`、`DOMAIN_COUNT:278` |
| `COURSE_COUNT` | `courses.ts:269` | **17** | `interview.astro:14/:124`、`index.astro:15/:51/:257/:278` |
| `CARD_COUNT` | `courses.ts:272` | **18** | **零读方**（除定义处无任何命中） |
| `DOMAIN_COUNT` | `courses.ts:278` | **15** | `index.astro:15/:51/:261`、`DomainMap.astro:19/:46`（构建期断言）、`check-counters.mjs:139-142`（**复刻**，非 import） |
| `WORK_COUNT` | `courses.ts:298` | **6**（字面量，非派生） | `works.astro:6/:62/:408/:410`、`interview.astro:14/:119`、`index.astro:15/:145/:265` |
| `STATUS_COUNTS` | `courses.ts:303` | 见文件 | **零读方** |
| `courseMeta()` | `courses.ts:319` | — | `c/[slug].astro:10/:24`、`learn.astro:12/:38`、`DomainMap.astro:19/:34` |
| `EXCLUDED_FROM_COURSE_ROUTE` | `courses.ts:331` | 2 条 | `c/[slug].astro:10`；`check-counters.mjs:144-149` **复刻** |
| `COURSE_STRUCTURE` | `course-structure.ts:378` | **17** | `works.astro:7`、`Header.astro:3/:26`、`DomainMap.astro:20/:33`、`learn.astro`、`nav.astro`、`check-counters.mjs`（不 import） |
| `COURSE_COUNT`（**同名第二份**） | `course-structure.ts:384` | 17 | **零读方**（与 `courses.ts:269` 同名不同模块，全仓无人 import 这一份） |
| `STAGE_COUNTS` | `course-structure.ts:387` | P0:5 / P1:4 / P2:3 / P3:3 / P4:2 | `nav.astro:8/:103`、`learn.astro:9/:80/:116/:272-273`、`index.astro:20/:82` |
| `MVPS` | `mvps.ts:40` | **13 条**（实测 `grep -c "^    slug: '" site/src/data/mvps.ts` → 13） | `works.astro:8/:66`（只用 `.artifact` 前缀与 `.owner`，不渲染 `artifact` 文本）；`course-structure.ts:378-381` 经 `mvpStatusOf()` 派生 `mvpStatus`（映射不闭合即 fail-fast） |

**要点（实施要用）**：① 站点侧**有两份同名 `COURSE_COUNT`**，只有 `courses.ts:269` 那份被引用；`course-structure.ts:384` 那份与 `CARD_COUNT`、`STATUS_COUNTS` 同为**零读方**导出。② `WORK_COUNT` 是 **`courses.ts` 内唯一的手写计数常量**（其余都由 `COURSES`/`COURSE_STRUCTURE` 派生），且它的「10」口径只以注释（`courses.ts:289-296`）与文案（`works.astro:411`）存在，**无机器判据**。③ `STAGE_COUNTS` 是五档唯一派生源，`courses.ts` 的 `phase` 已 legacy（`courses.ts:300` 注释），但 `works.astro` 仍在用它（见 W3/W4/W5）。

#### 1.3.2 `site/tools/check-counters.mjs`：判据 12 条 + 副本 7 处（全量）

- 判据注册点：`check(...)` 共 **13** 次匹配，其中 `:62` 是函数定义 → **判据 12 条**。逐条：

| # | 行 | 判据名 | 声明值来源 | 重算值来源 |
|---|---|---|---|---|
| 1 | `:286` | 知识域 | `notes/knowledge-map.md` 口径块 `知识域 N` | `courses.ts` COURSES 数组正则解析后复刻 DOMAIN_COUNT（`:139-142`） |
| 2 | `:287` | 课程页 `/c/<slug>/` | 口径块 `课程页 N` | 同上，排除 whiteboard（`:136`） |
| 3 | `:288` | 课程卡 | 口径块 `课程卡 N` | COURSES 全部条目（`:134`） |
| 4 | `:289` | 课内嵌题 | 口径块 `课内嵌 **N**` | 13 课题库表行 + `agent-harness` §13 + `rag` S1 + `model-basics` S7（`:153-211`） |
| 5 | `:290` | 面试题库精选 | 口径块 `面试题库精选 **N**` | `interview-bank.md` §3+§4+§8（`:213-224`） |
| 6 | `:291` | notes 顶层 md 数 | 口径块 `notes 顶层 N − …` | `fs.readdirSync(notes)` 顶层 `.md`（`:117`） |
| 7 | `:292` | EXCLUDED_FROM_COURSE_ROUTE 条数 | 口径块算式右端条目数 | `courses.ts` Set 元素（`:148-149`） |
| 8 | `:293-300` | 站点 html（三桶并集） | 口径块 `站点 html N` | 三桶派生：静态页（`:233-245`）+ 课程页（`:259`）+ 专题页（`:260`） |
| 9 | `:301-308` | 站点 html 三桶互斥 | 恒 `true` | 逐成员判重（`:265-269`） |
| 10 | `:309-316` | 站点 html 动态页全部已分类 | 恒 `true` | 动态页须 ∈ `['c/[slug].astro','details/[slug].astro']`（`:248-249`） |
| 11 | `:317-322` | 口算式自洽：顶层 − 排除 = 课程页 | 口径块 `课程页` | `notesTop − excluded`（`:320`） |
| 12 | `:323-328` | 排除项名称：口径块 ↔ 代码集合 | 口径块算式右端名字列表 | `courses.ts` 的 Set 名称（`:274-277`） |

- **副本交叉核对全量 7 处**（`grepNum`，`:332-351`；全部只比对「口径块声明值是否出现在该文件里」，**不重算该文件自己的数字**）：

| # | 行 | 文件 | 断言内容 |
|---|---|---|---|
| 1 | `:343` | `README.md` | 含「19 篇课程内容」 |
| 2 | `:344` | `README.md` | 含 `dist HTML=33` / `HTML=33` |
| 3 | `:346` | `site/src/data/courses.ts` | 注释含「notes 顶层 19 −」 |
| 4 | `:347` | `courses.ts` | 注释含「= 17」（课程页） |
| 5 | `:348` | `courses.ts` | 注释含「= 18」（课程卡） |
| 6 | `:350` | `.github/workflows/verify.yml` | 含 `-eq 33` |
| 7 | `:351` | `verify.yml` | 含 `nav/index.html` |

- **副本覆盖边界（我实测的缺口，实施批次 A 需要）**：门禁**只**覆盖 `README.md` / `courses.ts` / `verify.yml` 三文件。以下手写副本**均在判据之外**：
  `index.astro:34-35`（`Q_IN_LESSON = 205` / `Q_BANK = 37`，硬编码常量而非复用口径块）、`index.astro:112`（17 个 demo）、`index.astro:196`（180 行）、`learn.astro:199/:204`（17 个 demo）、`index.astro:215/:227`（8 篇）、`interview.astro:47`（10 题，且值为错）、`interview.astro:170/:179`（8 / 12）、`works.astro` 全部手写档位与口径脚注、`404.astro:42`（6 个可运行 demo）、`404.astro:45`（八个导航项）、`Base.astro:14`（17 课）、`learn.astro:177`（#1→#17）、`.github/workflows/verify.yml:6`（注释「dist HTML=**32** 含 404.html」）、`verify.yml:8-9`（页面清单注释未含 nav/404）、`verify.yml:87-89`（33 的三桶枚举注释）、`site/tools/visual-check.mjs:71`（注释「构建产物 **32** 页之一」）、`README.md:30`（「当时 dist HTML=32」——已带时点，属历史叙述）。
  另有一类**未渲染但已手抄**的副本：`site/src/data/mvps.ts:47`（`artifact` 串写「harness-demo/（13 src = 9 运行时 + 3 OTel …1 压缩自测，5 运行模式）」）与 `:55`（「rag-demo/（**132 chunks** golden set，**recall@3=0.31**）」）——`MVPS` 的唯一渲染用途是 `works.astro:66` 的 `m.artifact.startsWith(id + '/')`（只取前缀，不出文本），故**当前用户不可见**；但它与 `works.astro`／`index.astro` 的 `parseRagStats` 派生路径不同，一旦有人把 `artifact` 渲染出来即复活「站点数字与笔记漂移」（原则见 `site/src/utils/ragStats.ts:4-10`）。

#### 1.3.3 `site/tools/visual-check.mjs`：页面清单与断言数

| 判定项 | 结论 | 依据 |
|---|---|---|
| 页面清单 | **8 页** | `:63-74` `PAGES`：`''`(home) / `learn/` / `works/` / `interview/` / `map/` / `details/` / `c/rag/` / `404.html` |
| **`/nav/` 是否在内** | **✓ 不在**（复核 `08:291` t4-§转交 2） | `:63-74` 无 `nav/`；`grep -n "nav/" visual-check.mjs` 无命中 |
| 视口 | 3 个（375 / 768 / 1280） | `:78-82` |
| 真实回归断言数 | **24 = 8 页 × 3 视口**（用脚本自己的算法：`runMain()` `:255` → `:265` `for (const vp of VIEWPORTS)` × `:266` `for (const pg of PAGES)` → `all.push(d)`，`:334` 打印「`${all.length}` 页×视口（`${PAGES.length}` 页 × 3 视口）」） | `visual-check.mjs:265-270`、`:334`；`README.md:30` 的「24/24」即此 |
| selftest 断言数 | **26 = 24 + 2** | 4 组 × 3 视口 × 2 条 `expect`（`:387/:388`、`:393/:395`、`:401/:402`、`:409/:410`）= 24，外加 `:423` 的 2 次故障注入（`overflow`/`missing-element`，`:417-424`）→ 与 `README.md:30` 的「26/26」**静态可复现**（本轮未跑，见第二节） |
| 落盘点 | `:257` / `:370` `mkdirSync`，`:432` `out/selftest-report.json`，`:459-460` `out/report.json` + 截图（`writeReport()` `:442`） | 与 `08:288`（t3-§转交 3）一致 |
| `works/` 的卡片下界 | `cardsMin: 6` | `:68`；`works.astro` 的 `.work` section 实测 9 个（`:92/:147/:197/:222/:260/:294/:328/:367/:382`）→ 满足 |
| `404` 的卡片下界 | `cardsMin: 3` | `:73`；`404.astro:28-44` 恰三个引导卡（`:29` 首页 / `:34` 学习路线 / `:39` 作品）→ 与 `visual-check.mjs:72` 注释「`cardsMin=3` 对应三个引导入口（首页/课程/作品）」一致 |

#### 1.3.4 `.github/workflows/verify.yml` 全部断言行

| 行 | 内容 | 性质 |
|---|---|---|
| `:75-76` | `node site/tools/check-counters.mjs` | 口径门禁（口径块 vs 实数；12 判据 + 7 副本；非 0 即失败） |
| `:78-80` | `npm run build`（working-directory: site） | 站点构建 |
| `:103` | `count=$(find site/dist -name '*.html' \| wc -l)` | 构建产物计数 |
| **`:105`** | **`test "$count" -eq 33`** | **唯一的数字等值断言**（与 `08:170` 转述的「`:105` → `-eq 33`」一致） |
| `:106-109` | `for p in index.html nav/index.html learn/index.html works/index.html interview/index.html map/index.html details/index.html c/rag/index.html 404.html; do [ -s "site/dist/$p" ] \|\| exit 1` | **9 个关键页非空断言**（含 `nav/index.html` 与 `404.html`） |
| `:131` | `curl -sf http://127.0.0.1:4173/learn-agent-harness/ > /dev/null \|\| exit 1` | 静态服务就绪断言 |
| `:138-143` | `node tools/visual-check.mjs --base … --out tools/out`（`FAULT!=none` 时带 `--fault`） | 24 组合结构+几何断言（`/nav/` 不在其中） |
| `:152-158` | `upload-artifact@v4`（`site/tools/out`） | 证据留存（非断言） |

- 其他「数字」只出现在**注释**里，且两处是**已过时副本**：`:6`「dist HTML=**32** 含 404.html」、`:64`「口径『站点 html 32』漏了 nav（真值 33）」；`:84-96` 是 33 的三桶枚举注释（与口径块一致：8 静态页 + 17 课程页 + 8 专题页；我复算三桶并集 = **33**）。
- 步骤顺序（实施批次 A/C 需要）：口径门禁（`:75`）**先于**构建（`:78`），是刻意设计（`:70` 注释说明「廉价可判定问题先行」）。

---

## 二、仍无法验证（给原因：需联网 / 需写盘 / 需浏览器）

> 以下条目**本轮没有跑**，因此不得作为实施依据的判据；实施后应把它们补成可重跑判据。

| # | 待验证项 | file:line | 原因（缺什么） | 建议的补证方式（下一轮） |
|---|---|---|---|---|
| U1 | `npm run demo` 的 **~12-15 次调用** | `works.astro:361` | **需写盘 + 需 LLM 端点**：跑 `framework-demo` 会写 `.state/`/轨迹；且 `demo` 需 Anthropic 兼容端点 | 在 CI 或带 key 环境跑一次，把调用数落成日志 |
| U2 | `与 TS 版架构 1:1 对应` | `works.astro:199` | 非写盘，但需逐文件语义比对（`whiteboard/agent_whiteboard.py` 178 行 vs `harness-demo/src/*` 13 文件）；本轮未做 | 出一张「白板函数 ↔ TS 文件」对应表，逐行挂 `file:line` |
| U3 | mcp-demo「四层防御实测」各格结论（`❌ send_email 真的执行`、`outbox 出现带 revenue=125M 机密的邮件`…） | `works.astro:275-279` | **需写盘**：`cd mcp-demo && npm run demo` | 跑一次，把 outbox 摘要落成日志/快照 |
| U4 | sandbox-demo「同一剧本连跑 3 次…逐字节 diff + sha256」、「✅ 重放一致性断言通过」 | `works.astro:243-248` | **需写盘**：`npm run demo` 产 golden 与 diff | 同上 |
| U5 | durable-execution-demo「3 崩溃点 × 真实 SIGKILL × 各 3 次…副作用计数恒=1」 | `works.astro:301/:313-316` | **需写盘**：真实 `SIGKILL` 子进程 + journal 落盘 | 同上 |
| U6 | `viz/mermaid-check.mjs` **覆盖 `/map` 本页**、语法错必 FAIL | `map.astro:8` | **需写盘/需构建产物**：`mermaid-check.mjs` 读 `site/dist`（且 `viz/mermaid-check.mjs:9` 硬编码绝对路径 `DIST='/home/ubuntu/app/learn-agent-harness/site/dist'`）；我本轮只读实测 `find site/dist -type f \| wc -l` → **89 文件**、`find site/dist -name '*.html' \| wc -l` → **0**（残骸） | 先修构建，再跑 mermaid-check |
| U7 | `framework-demo` 的 `compare:assert` **16 条断言**与 `docs/sdk-comparison.md` 五维对照 | `works.astro:330-354`、`README.md:18` | **需写盘 + 需联网装包**（三家 SDK），且需本地 mock 端点 | 跑一次 `npm run compare:assert`，把 16/16 落成日志 |
| U8 | `visual-check` 真跑 **24/24**、`--selftest` **26/26** | `README.md:30`、`site/tools/visual-check.mjs:432` | **需浏览器 + 需写盘**：需 headless Chromium 与 `site/tools/out/`（`:432` 无条件 `writeFileSync`） | CI 上跑（本次未联网、未装浏览器）；本机可先跑 `--selftest`（仍会写 `out/selftest/`） |
| U9 | CI run 级 success / step 列表（`38554963320`、`38282562346`、`38350151634` 等） | `README.md:30`、`notes/knowledge-map.md:171` | **需联网**（GitHub API）；`07:160` 已登记同一缺口 | 连 GitHub API 取 run 级结论 |
| U10 | 站点渲染后的**视觉呈现**（`/nav` 版面、404 卡片观感、works 标签栏 sticky 效果） | `works.astro:83-89`、`nav.astro` 全文 | **需浏览器**（headless 只能断结构/几何，`verify.yml:10-11` 已自设此边界） | **留浏览器目检**（不得用 HTTP 200 / 构建成功冒充） |
| U11 | `index.astro` 首屏「**6 个**未定义概念」的逐条清单 | `index.astro:48`、`:51-56` | **依据不足**：`08:144` 只给数量未给清单，我无法复现是哪 6 个（见 §1.2 M1） | 由设计者圈定并逐条挂 `file:line`，或改为「首屏无释义段落」这种可机器判定的表述 |
| U12 | `works.astro:352` 的「**6 个文件**」具体是哪 6 个 | `works.astro:352` ← `notes/framework-ecosystem.md:84` | **依据不足**：溯源到教学分组 `loop/工具/权限/会话/子代理/端点`，与 `harness-demo/src` 13 文件/9 运行时不同口径，且不存在「子代理」文件 | 要么改为可数口径（如「9 个运行时文件」），要么显式标注「教学分组，非文件计数」 |
| U13 | `notes/harness-from-scratch.md` 里 `qwen3.8-flash` 的 3 处叙述算「历史快照」还是「待回填」 | `notes/harness-from-scratch.md:19/:198/:237` | 需作者判定语料时效口径（与 `handoff.md:85/:188` 记录了换模型的事实并存） | 由内容层定口径后统一处理 |
| U14 | `notes/process/*.md` 20 份设计/过程文档全文 | `notes/process/` | 不在本任务范围（`08:316` 已声明未逐行读）；本轮沿用该边界 | 若实施涉及施工规范（capstone/MVP 规格），需另开一轮 |
| U15 | `Base.astro:14` 的 meta description 在搜索结果/社交卡片的实际呈现 | `Base.astro:14` | **需外部抓取**（构建后的 HTML + 第三方渲染），且 `site/dist` 当前 0 HTML | 构建后用 curl 取 `<meta name="description">` 实际值 |

---

## 三、与 `08` 冲突 / 需修正的

> 「冲突」= 我的实测与 `08`（或其转述的上游）不一致，或 `08` 的措辞在本轮取证后需要收窄/扩写。**未列出者即复核通过**。

| # | `08` 的原表述 | 我的实测 | 处置建议 |
|---|---|---|---|
| X-1 | `08:199` 备列：「`/works/` 之外的三页（`/works/`、`/interview/`、`/map/`）文案未通读」——句子自相矛盾（说「`/works/` 之外」却把 `/works/` 列入） | 我已完成三页 + 7 个组件 + `Base.astro` 通读：`/works/` 是**问题最多的一页**（6 处活错值 + 1 处错引 + 1 处口径冲突） | 该条可在下游**关闭**，并把结论替换为 §1.1 的三张表 |
| X-2 | `08:198` 只登记 `works.astro` 的 1 条问题（「实测 11 spans / 1 trace」） | 同页另有 **5 条新查出的活错值/引用错**：`:224` sandbox 写 P0（真值 P1）、`:296` durable 写 P1（真值 P2）、`:330` framework 写 P2（真值 P4）、`:398` 把 `token 15×` 挂在「§五」下（实际在 `§一:20`／`§四:59`）、`:198`「~180 行」与笔记「~150 行」冲突 | 备列该行**扩写**为「`/works/` 一页 6 条」，并进批次 A（档位）／批次 C（引用）／形式组 4（行数） |
| X-3 | `08:238`（§3.4-1）/`07:64`：「OTel span 数的**活表述只剩** `works.astro:133/:393`」 | **复核通过**（无修正）：`grep -rn "11 spans\|11 span" site/src/` 活命中亦只剩这两行；全仓其余命中均带「未验证/历史值」标注 | 无需修正 |
| X-4 | `08:159`（P8）：「台账称六处已同步 1.5.0、**实测仍有三处未同步**」——只点名了 2 处（`framework-demo/README.md:167`、根 `README.md` 作品行） | 第 3 处 = **`notes/interview-bank.md:97`**（「框架生态」行写「LangGraph 1.4.21」且全文件 0 处 1.5.0）。此外 **台账行内行号已漂移**：`notes/industry-2026.md:108` 写「`framework-ecosystem.md:91/:284/:394/:396`、本文件 `:24`、`multi-agent.md:191/:396`」，实测 1.5.0 所在行为 `framework-ecosystem.md:99 / :292 / :420 / :422`、`industry-2026.md:35 / :108`、`multi-agent.md:199 / :443` | ① 三处未同步清单补上 `interview-bank.md:97`；② **修正台账行号**（否则下一个接手者按行号核会核空）；③ 版本结论（latest=1.5.0）本身未被推翻 |
| X-5 | `08:242`（§3.4-5）：「门禁只覆盖 `README`/`courses.ts`/`verify.yml` **三处副本**」 | 更精确：**3 个文件 / 7 处 `grepNum` 断言**（`check-counters.mjs:343/344/346/347/348/350/351`），且这些断言只做「声明值是否出现在该文件」的字符串存在性核对，**不重算该文件自己的数字** | 下游引用应用「3 文件 7 处」，否则会低估门禁面 |
| X-6 | `08:201` 备列：「capstone 主线 121 个 TS 文件 + `final-project` 在 `README.md`/`handoff.md` **零提及**」 | 该断言**在其范围内成立**，但站点侧**不是零提及**：`Base.astro:14` meta description 明写「**增量主线 my-agent**」，`index.astro:106-120` 有「增量主线：亲手搭一个 agent」整段，`learn.astro:193-206` 有 capstone section | 下游**不得**把 F5 扩写成「全仓零提及」；引用时保留原范围（README/handoff） |
| X-7 | `08:184`（P10）引 `README.md:9`「6 个可运行 demo（`npm run demo` 一键复现）」 | 引文忠实，但 `README.md:9` **现文已带限定**：「…6 个可运行 demo（`npm run demo` 一键复现；即下表六个**具名作品**目录——`memory-redteam/` 为回归套件/自研实操证据，按口径块**不计入作品数**，见 knowledge-map 计数口径）」。**残留冲突收窄为一点**：六个具名目录里 `rag-demo` **没有** `demo` 键（其入口是 `demo:eval`，见同文件 `:14` 该行），故「`npm run demo` 一键复现」对这 6 个的并集不成立；实测精确 `demo` 键目录 = 10 个且**不含** `rag-demo` | 改法只需把「`npm run demo` 一键复现」改成「（`demo`/`demo:eval` 等入口，逐目录见下表）」或直接指向口径块 |
| X-8 | `08:317`：「凡是 medium 支撑的部分（如 P7 的 `index.astro` 首屏、P8 的 SDK 版本三处）…需要它们进入实施清单前应再取一次证据」 | 已补证（§1.2）：**P8 的三处已定位**（含 `interview-bank.md:97`）；**P7 的「6 个未定义概念」无法逐条复现**（`08` 未列清单）→ 转 U11 | 引用 P8 时用三处清单；引用 P7 首屏时改为文本事实（首屏两段原文 + 全页无释义）而非「6 个」 |
| X-9 | `08` 全篇**未登记** `interview.astro` 的任何错值（备列只说该页未通读） | **新 finding**：`interview.astro:47` 的题数 `§3.2 / §3.3 · 10 题取 3` 实测应为 **9**（`notes/interview-bank.md:36-41` 5 题 + `:43-47` 4 题） | 进批次 B/C 的「站点文案错值」清单（与 `works.astro:133` 同类：用户可见、不在门禁内） |
| X-10 | `08:59`（P1）/`07:67`（consistency-F4）统计的档位冲突副本 = `notes/knowledge-map.md:55-68` 优先级列 + `courses.ts` `phase` 两处（9 门） | **第 3 份呈现副本**：`works.astro:94/149/224/262/296/330` 六个 demo 档位标签，其中 `224`(sandbox P0)/`296`(durable P1)/`330`(framework P2) 三处与 `stage` 真值冲突，且**不在任何门禁内** | 批次 A 的 P1 若不把 `works.astro` 列为落点，改完 `knowledge-map`/`courses.ts` 后该页仍会呈现旧三档 |
| X-11 | `08:287`（§④-16）：「`viz/mermaid-check.mjs:9` 硬编码绝对路径 `DIST='…'`」 | **复核通过**（转引，未复核该文件本体——不在本任务 inScope）；`map.astro:8` 另有「`viz/mermaid-check.mjs` 覆盖本页」的**自述**，本轮未能验证（U6） | 保留原条 + 补 U6 的未验证标注 |
| X-12 | `08:316`（§5.2 第 4 条）：「未逐行读全仓：`notes/process/` **19 份**计划文档…」 | **数字错**：实测 `ls notes/process/*.md \| wc -l` → **20**，与 `notes/knowledge-map.md:13` 口径块「20 份设计/过程文档（15 capstone 设计 + 3 MVP 规格 + 2 施工规范）」一致。「19」是 **notes 顶层**的计数（`knowledge-map.md:13` 同一段的另一个数），此处被误用 | 下游引用该边界声明时写 **20 份**；若照抄 `08` 的 19 会与口径块冲突 |

**复核通过、无需修正的 `08` 条目（本轮亲自复跑）**：P2 的依赖图/`prereqs` 事实（`course-structure.ts` 17 门、`sandbox: prereqs['harness-from-scratch']`、`mcp: prereqs['sandbox']`）；P3 的三份开课顺序出处（`learn.astro:177`「#1→#17」原文）；P5 的题库表结构（`check-counters.mjs:168` 用 `^\|\s*\d+\s*\|` 统计，我复算 `§4` = 10）；P10 的 17 个 demo 三处；`WD-6` 的 15 域/16 域（`notes/knowledge-map.md:11-18` 口径块逐字）；P9 的 `-eq 33`（`verify.yml:105` 逐字）。

---

## 未决决策点（需用户拍板）

1. **`works.astro` 六处 demo 档位标签**：改成 `course-structure.ts` 的 `stage` 派生（P0–P4），还是改为「岗位权重（非阶段）」措辞？（与 `08:63` P1 的二选一**同一决策**，但落点多了这一页）
2. **白板行数三处口径**（笔记 `~150`｜站点 `~180`/`180`｜实测 `178`）：统一为 `wc -l` 实测值，还是全部改成带波浪号的近似值？近似值是否要允许与实测差 >10%？（现差 150 vs 178 = 15.7%，属「量级近似」还是「错值」需口径）
3. **`interview.astro:47` 的 `10 → 9`**：只修数字，还是把 5 个分组 chip 的题数**全改为从 `notes/interview-bank.md` 派生**（与 `check-counters.mjs` 同算法）？
4. **`works.astro:398` 的节号引用**：改成 `§一 / §四`，还是删掉括号内的数字（只保留「应用形态层」描述）？
5. **门禁扩面范围**：是否把站点页手写数字（`index.astro:34-35` 的 `205/37`、`index.astro:112`/`learn.astro:199/:204` 的 17、`404.astro:42` 的 6、`Base.astro:14` 的 17 课、`interview.astro:47`）纳入 `check-counters.mjs` 判据？纳入即意味着新建「页面文案副本」桶（现有 7 处副本全部不触及 `site/src/pages`）。
6. **`/nav/` 是否纳入 3 视口回归**（`visual-check.mjs:63-75` 现无 `/nav/`）；`08:291` 已登记为显示形式决策。
7. **`whiteboard` 是否升为具名作品**？（现为「配套资产」，`works.astro:408-410`、口径块、`WORK_COUNT=6` 三处一致；升格会同时触发 `WORK_COUNT`/口径块/README/`visual-check` cardsMin）

## 依据不足项（不许当事实）

1. `works.astro:352` 的「**6 个文件**」——无对应可数集合（U12）。
2. `index.astro` 首屏「**6 个**未定义概念」的具体清单（U11；`08:144` 只给数量未给清单，我按「未展开」自圈出 6 个候选但无法证实与 `08` 同集）。
3. `works.astro:361` 的「**~12-15 次**调用」（U1）。
4. `works.astro:199` 的「与 TS 版架构 **1:1** 对应」（U2）。
5. `08:159` 转述的台账「**六处**已同步 1.5.0」清单——行号已漂移，**不可直接引用**（X-4）；可用的是「latest=1.5.0（2026-10-13 复核）」这一结论 +我给出的三处未同步清单。
6. `08:242` 的「门禁覆盖**三处副本**」——应写作「3 文件 / 7 处 `grepNum`」（X-5）。
7. 任何「站点页面渲染正确」的表述——本轮 `site/dist` 实测 **89 文件 / 0 HTML**（我亲自跑 `find site/dist -type f | wc -l` 与 `find site/dist -name '*.html' | wc -l`），无任何可目检产物，一律**留浏览器目检**。

## 附：边界合规

- 本轮只**新建** `analysis/plan/04-evidence-gaps.md` 一个文件；未修改任何既有文件（含 `analysis/content/01`–`08`、`notes/`、`site/`、各 demo、`README.md`、`handoff.md`）。
- 跑完全部命令后 `git status --porcelain` 与跑前**逐字一致**：`?? analysis/` + 4 个既有未跟踪根文档（`notes-restructure-plan.md`、`restructure-review-content.md`、`restructure-review-structure.md`、`restructure-verify.md`）。
- 未跑 `astro build`；未跑任何会写 `site/tools/out/`、`site/dist/`、`trajectories/`、`.state/` 的脚本；未联网；未装包。
- 本文件每一条判定都带 `file:line` + 我亲自跑的命令或读到的原文；转引他人结论处已显式标注「（转引，未复核）」。

