# 修复阶段宪章（全体修复组必读）

- 上游依据：[`00-综述与整改建议.md`](00-综述与整改建议.md) 的批次 A/B/C。**只修综述里 confirmed 的条目**；falsified（`EDIT-F3`、`TECH-A-F2` 结论层）**不修**（`EDIT-F3` 只按 low 措辞项处理，见 §3）。
- 目标：把 57 条 finding 中**本轮确认可修**的落到代码/文档里，且**修完后站点仍能构建、判据仍能复跑**。
- 基准日：2026-10-19。基线：HEAD `0f0ca19` + 本次评审前的工作树改动。

---

## 0. 硬规则（违反即任务失败）

1. **写入分区**：你只能改本宪章 §2 分配给你的文件/目录。**跨区文件一律只读**。发现别区的连带问题 → 写进你的修复日志的「转交」节，不要动手。
2. **最小改动**：只改 finding 指出的位置，不顺手重构、不改无关文案、不重排无关内容。
3. **可验证**：每条修改必须在你的修复日志里给出「改动前 → 改动后」的命令证据（`grep -n` / `sed -n` / 实跑输出）。跑不了的写「未验证（原因）」。
4. **不得为迁就现状放宽边界**：`site/tools/check-counters.mjs` 等门禁的**判据只能因「判据本身写错」而改**，且必须在日志里写清原判据错在哪；**不得为了让当前文本通过而改判据**。反之，文本错了就改文本。
5. **不得跑的**：`astro build` / `npm run build` / `npm run build:fast`（由 Lead 统一跑一次，见 §4）、装依赖、起服务器、`git commit` / `git push` / `git checkout` / `git stash`。只读命令 60s 内结束。
6. **临时文件只落 `/tmp/`**，不得在仓库内落盘任何非你名下的文件。
7. **不改 demo 的语义判据数字**（除非 finding 明确要求）：如 `spanTotal: 15`、压缩 `1378→426`、durable 的 821 行表、`recall@3=0.31` 等——这些是经复核逐字复现的真值。
8. **中文回复**；术语沿用仓库现有写法（harness 保留英文；轨迹/权限门/沙箱等中文优先，首次出现处给英文）。

---

## 1. 冻结口径（**所有组必须对齐，禁止自行另立**）

| 口径 | 冻结值 | 说明 |
|---|---|---|
| 课程数 | **17** | 派生自 `course-structure.ts` slug 实枚举 |
| 站点页数 | **33** | 含 `404.html` |
| 作品 / demo 数 | **6** | `courses.ts WORK_COUNT = 6`；「有 `npm run demo` 键的目录 = 10」是另一回事，不得混用 |
| 知识域 | **15** | `handoff.md:199` 的「十六个」改为 15 |
| 阶段标签 | **P0–P4** | `course-structure.ts` 的 `stage`，站点唯一真源，**不改值** |
| 岗位权重标签 | **W0–W2** | 由 `notes/knowledge-map.md` 课程总表旧「优先级」列 `P0/P1/P2` 改名而来（P0→W0、P1→W1、P2→W2），列名改「岗位权重」并注明「非阶段、非阅读序，阶段见 `/learn/`」 |
| OTel span 数 | **15** | `demo:otel:mock` 离线判据；站点文案里的「实测 11 spans」改为 15 或标注为历史未验证值 |
| 幽灵事故时长 | **25 分钟** | 统一 `agent-harness.md` 的 24 分钟 |
| 时间线 | `/nav` 的 10 节点**保留但显式标注截断** | 头注释去掉「已逐条 web 核实」的绝对表述，改带日期的核实状态；页面加「止于 2025-01，后续见 `/c/llm-timeline/`」 |
| LangGraph | **demo pin 1.4.21 与 registry latest 1.5.1 分列并标快照日期** | 不得删掉任何一侧 |
| Claude Agent SDK | **pin 0.3.296 / latest 0.3.302 分列并标日期** | 同上 |
| 白板行数 | **178** | 统一 `~150 行`/`~180 行` |
| `details/` 篇数 | **8**（改为派生） | `details/index.astro:58` 与首页两处硬编码 8 → `{items.length}` |
| 题库 §3.2+§3.3 | **9 题** | `interview.astro:47` 的「10 题」改 9 |
| 轨迹文件引用 | **`demo.example.jsonl`** | `demo.jsonl` 不在版本控制内（`.gitignore:19-20`），引用改为入库的那份 |
| `recall@5` / `chunks` | **0.44 / 132（HEAD 下成立）** | **不得**改成 0.38/135（那是脏工作区产物）；只需按 `rag.md:298` 自家纪律补一条「复跑前确认工作区干净」的说明 |

---

## 2. 写入分区（互不重叠）

| 组 | 可写范围 |
|---|---|
| `sot-data` | `site/src/data/**`、`site/src/utils/ragStats.ts` |
| `notes-core` | `notes/agent-harness.md`、`notes/harness-from-scratch.md`、`notes/rag.md`、`notes/observability.md`、`notes/evaluation.md`、`notes/details/**` |
| `notes-sec` | `notes/mcp.md`、`notes/sandbox.md`、`notes/durable-execution.md`、`notes/long-term-memory.md`、`notes/multi-agent.md`、`notes/system-design.md`、`notes/interview-bank.md` |
| `notes-facts` | `notes/llm-timeline.md`、`notes/industry-2026.md`、`notes/framework-ecosystem.md`、`notes/model-basics.md`、`notes/api-engineering.md`、`notes/data-flywheel.md`、`README.md`、`handoff.md`、`AGENTS.md` |
| `knowledge-map` | `notes/knowledge-map.md`（**只此一个文件**） |
| `site-ui` | `site/src/pages/**`、`site/src/components/**`、`site/src/layouts/**`、`site/src/styles/**`、`site/astro.config.mjs` |
| `demos-gates` | `harness-demo/**`、`rag-demo/**`、`sandbox-demo/**`、`durable-execution-demo/**`、`mcp-demo/**`、`memory-redteam/**`、`viz/**`、`site/tools/**`、`.github/workflows/**`、`site/build.sh` |
| `verifier2`（最后跑） | 只写自己的复核报告 |

> `notes/process/**`、`final-project/**`、`my-agent/**`、`flywheel-demo/**`、`api-demo/**`、`model-basics-demo/**`、`jd-research/**`、`whiteboard/**`：本轮**不改**（发现问题的写进日志「转交」节）。

---

## 3. 修复清单（按组下发，编号沿用评审 ID）

### `sot-data`
- **A3 / PED-F1**：`course-structure.ts` 的 `stage` **值不动**；但要消除与笔记的歧义——在文件头注释与 `/learn` 呈现处明确「P0–P4 = 教学阶段，唯一真源」。`knowledge-map` 的权重列改名由 `knowledge-map` 组做，你只负责本站一侧。
- **PED-F5**：`model-basics` 的 `prereqs: ['llm-timeline']` 与 `prerequisiteNote` 要求的「LLM 发展史与演进」（=`mvpSlug: llm-history`）不一致 → 二选一对齐（建议改 prereqs 指向 `llm-history`，或改 note 措辞），**并同步链接目标**。
- **PED-F6**：把「判定」拆成两个语义——`practicalOutput`（参考样本可复现）与新增/明确的学习者自查口径；把 `:127`（agent-harness）这类不可证伪的口语判据改成可证伪表述。**注意：`grep -c "判定"` 实为 17、`判定 clone 能跑` 实为 13**（评审报告写的 16/14 是错的）。
- **PED-F9**：13 处「上一课带入 X」中 10 处与线性序不符 → 措辞改为「前置课（<域名>）带入」并跟 `prereqs` 同源（或由 `prereqs[0]` 生成）。
- **B1**：在 `check-counters.mjs` 增加判据：**demo 数=6 / 知识域=15 / span 数=15 / 事故时长=25 / 时间线末节点日期 / 白板行数=178** 在全仓文本副本中的一致性（**判据只能加，不能为迁就文本而放宽**）。同步 `ragStats.ts` 的解析面覆盖 `recall@5`。
- **B4 / FAC-F1/F2/F3/F8**：`llm-history.ts` 头部注释的「已逐条 web 核实」改为带日期的核实状态；数据层加「止于 2025-01」的截断说明；把 SDK 版本号改为「demo pin + registry latest + 快照日期」两列口径（latest 值见 §1）。

### `notes-core`（`agent-harness` / `harness-from-scratch` / `rag` / `observability` / `evaluation` / `details/**`）
- **B3 / TECH-A-F5**：`harness-from-scratch.md:126-132` 的门序 mermaid 改为与代码一致（**先 `policy.decide` 后校验**）；`:81` 的「未知工具 `city` → `未知工具: city`」实测输出改为真实可复跑的 `[策略拒绝] 无匹配规则，默认拒绝`。
- **TECH-A-F6**：`harness-from-scratch.md:177/:179`、`details/03:26` 的「真实崩溃 exit 137」改为「模拟崩溃（`process.exit(137)` 自触发）」并注明与外部 SIGKILL 的差异。
- **TECH-A-F7**：`rag.md:65/:327`「用**可证明的**微小召回损失」改为「经验上很小的召回损失（可量化但无理论下界）」；`0.99→0.95` 标来源或删去。
- **TECH-A-F10**：`rag.md:80` pgvector「Postgres 内建 HNSW/IVFFlat」→「pgvector（Postgres 的向量扩展，需安装 + `CREATE EXTENSION`）」。
- **TECH-A-F11**：`harness-from-scratch.md:200` 的任务分步改为与 `demo.ts` 一致的 5 条编号。
- **TECH-A-F12**：`evaluation.md:180` 的示例值 `0.94` 换成不冲突量级或标注「示例」。
- **TECH-A-F4**：`agent-harness.md:212` 的「24 分钟」→「25 分钟」（与 `:420` 及时间线自洽）；波及点见「转交」。
- **P4**：`details/04-token-economics.md:22/:27`、`details/08-single-threaded-write.md:22/:27` —— 同页「行业一手源」与「未覆盖」直接矛盾，按综述方向逐页复核并只保留真缺口。
- **TECH-A-F8 / PED-F13**：`details/06:27` 的「未覆盖」行把「OTel 埋点已落地」写进未覆盖 → 移到「已覆盖」行，只留真缺口。
- **PED-F14**：`details/02:20-22` 标题「行业一手源」与正文自认「URL 推断」不符 → 标题改「行业来源（URL 待核）」或把附注前置。
- **P9**：`observability.md`/`multi-agent.md` 里对 `trajectories/demo.jsonl` 的引用改为 `demo.example.jsonl`（`multi-agent.md` 属 `notes-sec` 区，你只改 `observability.md`，另一处写进「转交」）。
- **PED-F15**：`harness-from-scratch.md:6/:214` 的「~150 行」→「178 行」或「<200 行」。

### `notes-sec`（`mcp` / `sandbox` / `durable-execution` / `long-term-memory` / `multi-agent` / `system-design` / `interview-bank`）
- **B5 / TECHSTATE-F1**：按 MCP 官方 Client/Server Features 重写 `mcp.md` 的原语表（`Sampling`/`Roots`/`Elicitation` 是 **Client** Features；Server 只有 Discovery/Prompts/Resources/Tools）；`roots` 方向改为「客户端向 server 暴露路径根，且规范明确它不是访问控制机制」；为 sampling/roots 加 **Deprecated（2026-07-28，SEP-2577）** 徽标，并把 **MRTR / `InputRequiredResult`** 写进「2026 更新」清单。**改动前必须抓取官方页面留证据**（URL + 关键引文）。波及点 `mcp.md:553`（练习 8）与 `course-structure.ts:196`（后者不在你区，写「转交」）。
- **A2 / TECHSTATE-F2**：`durable-execution.md:256` 的手工复现命令改成**实际可用**的形式（与 `worker.ts` 的 `flag()` 匹配的那种）。`worker.ts` 本身的兼容性修改归 `demos-gates` 组——你若只改文档，务必跑通你写的那条命令并附输出。
- **TECHSTATE-F3**：`sandbox.md:236/:238-253/:284` 的四层顺序改为 demo 实际控制流（**先按 raw 参数授权、后由 W 层规范化兜底**），或明确标注该四层是「推荐设计」而非 demo 现状。
- **TECHSTATE-F4**：`sandbox.md:186-189` 的 A 组 sha256 回填为你**当场实跑**得到的值（B 组已逐字命中，不要动）；若你实跑值与讲义不同，按实跑值改并在日志写明。
- **TECHSTATE-F5**：`mcp.md:132` 内联 URL 拆成「NSA 引语出处」与「NVD」两个，或在无一手源时给 NSA 引语加「转述，未取信」。
- **TECHSTATE-F6**：`long-term-memory.md:399` 的 `0.03226` → `0.03227`（或标「约 0.0323，5 位截断」）。
- **PED-F11**：`interview-bank.md:66/:71/:73` 的题-课归属与 `courses.ts` 反向归属不一致 → 以题库为真源统一（`courses.ts` 不在你区，写「转交」）；#6 的记忆投毒锚点由 §S5 改 §S7。
- **PED-F9 转交项**：`multi-agent.md` 等处的「上一课带入 X」措辞不在你区（数据层），如正文有同类表述写「转交」。
- **P9**：`multi-agent.md:268` 的 `trajectories/demo.jsonl` → `demo.example.jsonl`。

### `notes-facts`（`llm-timeline` / `industry-2026` / `framework-ecosystem` / `model-basics` / `api-engineering` / `data-flywheel` / `README.md` / `handoff.md` / `AGENTS.md`）
- **FAC-F4**：`llm-timeline.md:25`「2025.02–04 Claude Code 预览→GA」→ 拆成 2025.02 研究预览 / 2025-05-22 GA（官方公告页头日期）。
- **FAC-F5**：`llm-timeline.md:22`「2024.04 Claude 3 家族 + Tool Use GA」→ 家族行改 2024.03；Tool Use 拆 beta（2024-04-04）/ GA（2024-05-30）。
- **FAC-F6**：`llm-timeline.md:20`「2023.10 GPT-4 Turbo 128k」→ 2023.11。
- **FAC-F7**：`industry-2026.md:32`/`framework-ecosystem.md:100`（后者不在你区，写「转交」）：A2A 入 AAIF 从 2025.12 拆出为 **2026-08-27**；`IBM` → `IBM Research`。
- **FAC-F9**：`llm-timeline.md:38` 的 Sonnet 4.5 URL 换成含 77.2% 的发布公告页，或并列两条出处。
- **FAC-F2/F3**：`README.md:18` 与 `framework-ecosystem.md`（后者不在你区）里的 SDK 版本号改为「demo pin + registry latest + 快照日期」分列（latest 见 §1）。`framework-ecosystem.md` 的同类改动写「转交」。
- **PED-F7**：`data-flywheel.md:327`、`model-basics.md:354` 的「目录尚未存在」与站点 `status:'done'` 矛盾 → 改为指针「状态见站点参考样本」或同步为实现态措辞；`api-engineering.md:260` 的「规划判据」同样处理。
- **PED-F8**：`data-flywheel.md:285/:305-306` 与站点「单调可解释」判据矛盾 → 正文/判据措辞改为「指标变化可归因」。
- **EDIT-F2**：`handoff.md:199`「十六个知识域」→「15 个知识域」；`:14` 的「升 16 域」补一句「（后以 15 域冻结口径为准，见 knowledge-map 口径块）」。
- **EDIT-F1 副本**：`README.md:9` 的「6 个可运行 demo（`npm run demo` 一键复现）」与本文件 rag-demo 行实际是 `demo:eval` 不一致 → 措辞改为准确表述（`memory-redteam` 不计入作品数的说明保留）。
- **EDIT-F3（low 措辞项）**：`README.md:34`「Obsidian vault（LaTeX、mermaid、PNG 全渲染）」→ 改为「Obsidian vault（LaTeX / mermaid 全渲染；PNG 由 `viz/render.mjs` 按需生成）」这类不含「已有 PNG 资产」暗示的措辞。**只改这一处措辞，不要去造图。**
- **TECH-A-F2 结论层**：`README.md:14` 的 recall 数字**不动**（HEAD 下成立）；只在 `rag.md` 侧（不在你区）由 `notes-core` 补「复跑前确认工作区干净」的说明——你在此只确认 README 无需改，写进日志。
- **FAC-F8 联动**：`llm-history.ts` 头注释归 `sot-data`；你区若有三处以上引用「权威事实列表」措辞的副本，改为与之一致。

### `knowledge-map`（只改 `notes/knowledge-map.md`）
- **A3 / PED-F1**：课程总表 `:53-68` 的「优先级」列改名「岗位权重」，值 `P0/P1/P2` → `W0/W1/W2`，表头旁加一行说明「本列为岗位权重，非教学阶段、非阅读序；阶段（P0–P4）与线性阅读序见站点 `/learn/`」。
- **P2**：mermaid 依赖图 `:103-126` 的边改为与 `course-structure.ts` 的 `prereqs` **逐条一致**（你只读该文件取值，不改它）；改完用脚本比对并附输出。
- **P3**：`:128` 与 `:162` 两段「建议开课顺序」统一为**一份**（建议：保留 `:128` 的叙述但改为指针「以站点 `/learn/` 线性阅读序（`course-structure.ts` 数组序）为唯一真源」），并删掉另一处的重复列表。
- **PED-F10**：`:172`「JD 关键词覆盖：目标全 🟢」→「除 ⚪ 观察项外全 🟢」并显式列出豁免行。
- **C4 / EDIT-F5**：新增「术语表」小节（10–15 条：harness/轨迹 trajectory/权限门/沙箱/拒答/评测/checkpoint/幂等/RRF/BM25/HITL/OTel/MCP 等，给中英对应与首选写法）。
- **PRES-F5**：`:170` 的断链（URL 后紧跟 `（**33`）修为 markdown 链接形式并验证 200。
- **口径块**：把 §1 冻结值里属于本文件的副本（课程数/页数/作品数/域数/span 数/事故时长）逐条核对并统一。
- **上轮 P10 残留**：`:141-152` 的「资产 ↔ 课程映射」表补登漏登的 demo（`mcp-demo` / `framework-demo` / `api-demo` / `flywheel-demo` / `model-basics-demo` / `my-agent` / `final-project`），或改为从目录派生。

### `site-ui`（`site/src/pages/**`、`components/**`、`layouts/**`、`styles/**`、`astro.config.mjs`）
- **A4 / EDIT-F1**：`learn.astro:199/:204`、`index.astro:112` 的「17 个 demo」改为与 6 个具名 demo 一致的措辞（如「6 个 demo」或「17 门课对应的参考样本」），**不得**改动 `courses.ts`（不在你区）。
- **TECH-A-F3**：`works.astro:133/:393` 的「实测 11 spans / 1 trace」→ 15 spans（注明 `demo:otel:mock` 离线判据）或标注「历史活端点值、未验证」。
- **C2 / PRES-F1**：`NotePageLayout.astro` 在 meta-bar 之后、`before` slot 之前输出 `<h1>{title}</h1>`（可视觉隐藏），并把 markdown 正文首个 h1 降级为 h2（**注意别破坏 `check-classes.mjs` 的类集合**）。
- **C2 / PRES-F3**：`NotePageLayout` 转发 `description`；`Base.astro` 补 `canonical`（`Astro.site` + `Astro.url.pathname`）与最小 og/twitter 组。
- **C2 / PRES-F4**：`site/astro.config.mjs` 加 `@astrojs/sitemap` 集成，或在 `site/public/` 放手写 `robots.txt` + sitemap（**不得装新依赖**——若需 `@astrojs/sitemap` 而它不在 `package.json`，则改用手写 `public/` 方案）。
- **C4 / EDIT-F4**：`404.astro:42` 的「6 个可运行 demo」与 `:32` 的「六个可运行作品」统一为同一规范名（建议「作品」= 具名目录整体），`README` 侧由 `notes-facts` 同步。
- **C4 / EDIT-F7**：`details/index.astro:58` 与首页 `index.astro:215/:227` 的硬编码 8 → 派生（`items.length` / 共享常量）。
- **C5 / PRES-F8**：`SiteSearch.astro` 的 input 加 `aria-label="搜索全站"` 或视觉隐藏 `<label for>`。
- **PED-F12**：`interview.astro:47` 的「§3.2 / §3.3 · 10 题取 3」→「9 题取 3」（或改为派生）。
- **C2 附带**：`learn.astro:209` 把 `capstone-blueprint.md` 写成 `<code>` 而非链接（读者点不进去）→ 修为链接或明确标注为路径文本。

### `demos-gates`（demo 源码 / `site/tools/**` / workflows / `build.sh`）
- **A1 / TECH-A-F1（最高优先）**：让 `npm run demo:otel:assert` 在**干净树**上 exit 0。首选方案：mock 场景在自己读 `out/otel.md` **之前先写入它**（使场景自洽），保持 `ok:7 / error:0 / spanTotal:15` 不变。验收：`git archive HEAD | tar -x -C /tmp/xxx`（**必须先 `git stash` 你的改动或用 `git archive` 取 HEAD 版再打 patch**——更简单的做法：把你的改动应用到 `/tmp` 副本后，在该副本上跑断言）后跑 `npm run demo:otel:assert` 必须 exit 0 且 7/7。**同时**在 `site/src/data/course-structure.ts:281` 等对外声明处（不在你区）无需改，但要在日志里确认「声明与修好后的行为一致」。
- **A2 / TECHSTATE-F2**：`durable-execution-demo/src/worker.ts` 的 `flag()` 同时接受 `--k v` 与 `--k=v` 两种形式；验收：两种形式都真的崩溃（exit 137、有 `💥`、`crashPoint` 非 none）。
- **TECHSTATE-F4 联动**：`sandbox-demo` 若需修到让讲义 hash 可复现，则修 demo 并**在日志里给出新 hash**（`notes-sec` 组会按你给的 hash 回填讲义；若你判定讲义 hash 过期而 demo 无需改，也要给出你实跑的 hash 供其回填）。
- **B1**：`check-counters.mjs` 按 §1 冻结值增加判据（与 `sot-data` 组协同：**该文件归你**，`sot-data` 只提需求；你实现后必须本机跑通 `node tools/check-counters.mjs` exit 0）。
- **C3 / PRES-F7**：`deploy.yml` 增加 `Build sanity` 步骤（`find site/dist -name '*.html' | wc -l` 等值 33 + 9 个关键页非空），或把这断言加进 `build.sh` 尾部，使**部署路径也校验产物**。
- **自检**：`node tools/check-counters.mjs && node tools/check-classes.mjs` 必须 exit 0（注意：其他组可能正在改 `site/src`，若因他人未完成的编辑而失败，重试一次并在日志注明）。

---

## 4. 构建验证（只由 Lead 执行一次）

所有组交付后，Lead 在后台跑一次 `npm run build`（`nice` + 堆上限），用 `free -m` 监控；可用内存跌破阈值即 kill 并据实报告「构建未完成」。**任何组不得自行跑构建。**

## 5. 交付格式

每组只写一个文件：`reviews/2026-10-19/fix-<组名>.md`，含：
- 覆盖声明（改了哪些文件、哪些条目）
- 逐条修改记录：`ID | 文件:行 | 改动前→改动后（引文） | 验证命令 + 关键输出`
- 未修改的条目 + 原因
- 转交他人（别区的连带问题）
- 自检：`git status --porcelain` 变化清单（应只有你区文件 + 你的日志）

**先建骨架落盘，再边改边追加**——不得"最后一次性写"（本轮已有两次整轮丢失的教训）。
