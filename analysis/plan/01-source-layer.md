# 01 真源层与派生改造设计（批次 A + 门禁扩展）

> 依据：`analysis/plan/00-plan-scope.md`（硬边界/10 字段/批次命名）、`analysis/content/08-synthesis.md` P1–P3+P10 与 ④ 节、
> `analysis/content/07-verification.md`（裁决账本 + 被证伪清单）、`01-pedagogy.md` F1–F4/F14、`04-consistency.md` F4、`05-coverage.md` F4/F7。
> **本轮零代码改动**：本文件只描述改法与验收，所有 file:line 均为我本轮亲自读原文/跑命令所得。

## 0. 本轮基线与真源原则

**唯一原则（全批次 A 共用）**：每一类事实有且只有一个真源，其余位置要么**引用**，要么**由构建期脚本派生**，
要么**被门禁断言锁定**。禁止「同一事实在 N 处手抄」。

| 事实类别 | 指定真源（本设计确定） | 现状问题 |
|---|---|---|
| 课程档位/阶段 | `site/src/data/course-structure.ts` 的 `stage` | `knowledge-map.md` 另有一套 `P0/P1/P2`「优先级」字形，9/14 课冲突 |
| 阅读序 | `course-structure.ts` 数组序（order = index） | 三份互斥顺序（km:128 / km:162 / learn.astro:177） |
| 课程依赖 | `course-structure.ts` 的 `prereqs` | `knowledge-map.md:103-125` 手写 mermaid 与之冲突 8/15 |
| 计数 | `knowledge-map.md` 头部「计数口径」块（声明值）+ 文件系统/源码（重算值） | 站点 7 处手写副本不在门禁内 |
| 资产↔课程映射 | 待定（见 A6 与「未决决策点」） | `km:141-152` 只有 8 行，漏登 2 个已有 demo 目录 |

**基线取证（亲自跑，本轮）**：

```
$ node site/tools/check-counters.mjs; echo "EXIT=$?"
... ✅ 口径全部一致（判据 12 条 + 副本 7 处）
EXIT=0
```

```
$ git log -1 --format='%h %s'
0f0ca19 fix(counters): 口径失真修正 + CI 门禁 + 消除幽灵路由
```

**07 修正值强制沿用**：依赖图不一致真值 **8/15**（非 9/15）；`details` 矛盾页 **04/08/06**（01 不矛盾）；
`industry-2026.md:**20**`；SSE 首现 `harness-from-scratch.md:15/:17`；`wc -l`=7；`A/B`=6。
**三条 falsified（`accuracy-F1`、`accuracy-F3`、`evidence-F2`）在本文件中零引用。**

---

## A1｜档位唯一真源：`course-structure.ts` 的 `stage`，清除「优先级」列的 P0–P2 字形

### id
`A1-stage-single-source`

### 目标
让「一门课属于哪一档」全仓只有一个答案：`course-structure.ts` 的 `stage`（严格五档 P0–P4）。
`knowledge-map.md` 课程总表不得再用 `P0/P1/P2` 这一组**字形**表达任何东西；横向两课（`llm-timeline`/`industry-2026`）
的阶段身份在全仓统一。消除 P1 描述的「读者按 P0 判断先学什么时看到课程卡 P1」的直接误导。

### 现状证据（本轮亲自读原文）

**（1）grep 全仓 `phase` 的所有读方**（`--include=*.ts/*.astro/*.mjs`，已排除 `node_modules`、`.git`、`analysis/`、`.agent-teams/`、`site/dist`）：

```
$ grep -rn '\.phase\b' --include=*.ts --include=*.astro --include=*.mjs . | grep -v node_modules | grep -v '^./analysis' | grep -v '^./.agent-teams' | grep -v '^./site/dist'
site/src/data/courses.ts:279:  COURSES.filter((c) => c.slug !== NON_COURSE_CARD_SLUG && c.phase !== HORIZONTAL_PHASE).map(
site/src/data/courses.ts:300:（注释）
site/src/pages/c/[slug].astro:61: <span class="chip">{structure ? structure.stage : meta.phase === '—' ? '未分阶段' : meta.phase}</span>
site/src/pages/nav.astro:309:  .phase-head h3 {      ← CSS 类名，不是字段读方
site/tools/check-counters.mjs:141:      entries.filter((e) => e.slug !== whiteboard && e.phase !== horizontal).map((e) => e.domain),
```

**结论：`phase` 字段在运行代码里只有 3 个读点**（不是 `notes/process/site-refactor-plan.md:474` 记的 3 个消费方里的老版本 —— 其中的
`DomainMap.astro` 已迁走，本轮 grep 复核确认）：

| # | 读点 | file:line | 读的是什么 |
|---|---|---|---|
| R1 | `DOMAIN_COUNT` 过滤 | `site/src/data/courses.ts:279` | 只读 `phase !== '—'`，用于排除横向资产 |
| R2 | 课程页 chip 兜底 | `site/src/pages/c/[slug].astro:61` | `structure ? structure.stage : (meta.phase === '—' ? '未分阶段' : meta.phase)` |
| R3 | 门禁源码解析 | `site/tools/check-counters.mjs:141`（以及 `:127-128` 的**行内正则**） | 用 `phase: '...'` 作为**解析锚点**提取每条卡片 |

**R2 是死分支（本轮推导，非转述）**：`c/[slug].astro:15-20` 的 `getStaticPaths()` 用
`EXCLUDED_FROM_COURSE_ROUTE`（`courses.ts:331` = `{'knowledge-map','interview-bank'}`）过滤；`structure` 来自
`courseBySlug(entry.id)`，其集合是 `COURSE_STRUCTURE`（17 门，含横向两课）。故对任何实际生成的 `/c/<slug>/` 页，
`structure` 恒为 truthy → `:61` 的 `meta.phase` 分支**不可达**。
**风险**：断言「R2 死」依赖 `COURSE_STRUCTURE` ⊇ 全部 `Notes 顶层 − EXCLUDED`，这个包含关系目前**无门禁**（见 A7 判据 13 补位）。

**（2）冲突真值（`stage` vs 「优先级」列，逐行落号）**

`notes/knowledge-map.md` 课程总表「优先级」列（表头 `:53`，数据行 `:55-68`，共 14 行）：

| km 行 | 主题 | km 优先级 | course-structure stage | 冲突 |
|---|---|---|---|---|
| :55 | 从零写 harness | P0 | `:101` P0 | — |
| :56 | RAG 与检索 | P0 | `:134` P0 | — |
| :57 | Agent 系统设计模板 | P0 | `:150` P0 | — |
| :58 | Agent 可观测 | **P2** | `:272` **P2** | — |
| :59 | 沙箱与凭据·可复现 | **P0** | `:168` **P1** | ★ |
| :60 | 长期记忆 | P2 | `:291` **P3** | ★ |
| :61 | durable execution | P1 | `:238` **P2** | ★ |
| :62 | 评测工程化 | **P0** | `:202` **P1** | ★ |
| :63 | MCP 协议 + 供应链安全 | P1 | `:185` **P1** | — |
| :64 | API 实操 + 多模型路由 | P1 | `:255` **P2** | ★ |
| :65 | 数据飞轮 | P1 | `:308` **P3** | ★ |
| :66 | 模型基础 | P2 | `:325` **P3** | ★ |
| :67 | 框架生态 | P2 | `:344` **P4** | ★ |
| :68 | 多智能体编排 | **P0** | `:219` **P1** | ★ |

→ **9/14 冲突**，与 `07-verification.md:37`（t4 独立复现）、`:67`（consistency-F4）**逐门一致**。
第 15 域 `agent-harness` 不在该表（它在 `:35` 附近的上表，标「编号课」）；`site/src/data/courses.ts` 的
`agent-harness` 行 `:126` 写 `phase: 'P0'`，而 `course-structure.ts:118` 写 `stage: 'P0'` → **该门无冲突**。

**（3）横向两课的四种互斥定位**（`08-synthesis.md` P1 原列，本轮逐条落到行）：

| file:line | 原文要点 |
|---|---|
| `course-structure.ts:85` | `llm-timeline` `stage: 'P0'` + 数组首位（order 0） |
| `site/src/pages/nav.astro:21` | 「横向知识（**位于 P0 之前**）」 |
| `site/src/pages/learn.astro:282` | 「LLM 发展史与演进、行业调研等**不挂在任一阶段上**」——而同页 P0 段 `:113` 正常渲染它 |
| `notes/knowledge-map.md:12` | 「`interview-bank` / `llm-timeline` / `industry-2026` / `details/` 为横向资产，**不计入门数**」，但同块 `:13` 的「课程页 17」含 `llm-timeline`/`industry-2026` |

（`course-structure.ts:96` `isHorizontal: true` 与 `:373` `industry-2026` 的 `isHorizontal: true` 是**已有的、可用的**横向标记——A1 的整改应当复用它，而不是新造字段。）

### 具体改法（落到文件·行区间·字段）

**改法 A1-a：`notes/knowledge-map.md` 课程总表「优先级」列改名 + 去字形 + 换五档引用**

- `:53` 表头：`| 主题 | 优先级 | 状态 | 课程文件 | 完成后你能做到 |`
  → `| 主题 | 阶段（引自 course-structure.ts） | 状态 | 课程文件 | 完成后你能做到 |`
- `:55-68` 每行第 2 列：把现有 P0/P1/P2 字形**逐行替换为 `course-structure.ts` 的 `stage` 真值**（见上表右列），
  共 9 行需要改值，5 行只是字面不变但语义改为「五档」。替换后的列值：从零写 harness P0 / RAG P0 / 系统设计 P0 /
  可观测 P2 / 沙箱 P1 / 长期记忆 P3 / durable P2 / 评测工程化 P1 / MCP P1 / API P2 / 数据飞轮 P3 / 模型基础 P3 /
  框架生态 P4 / 多智能体编排 P1。
- `:70` 表下那句「口径：课程总表 14 行 = 14 个编号课」**保留**（那是另一个事实：编号课计数），
  但在其后追加一句显式指认：阶段列唯一源为 `site/src/data/course-structure.ts` 的 `stage`，本表为该列的**只读副本**，由 `A7 判据 14` 机器校验。
- **禁止**同时在表外加「= P0/基础篇」之类的字形映射说明——那是第二套字形，等于把冲突搬个位置。

**改法 A1-b：横向两课「阶段身份」全仓统一（复用已有 `isHorizontal`）**

- `notes/knowledge-map.md:12`：把「不计入门数」的语义精确化，明确它讲的是**知识域计数**，不是**阶段归属**：
  「`interview-bank` / `llm-timeline` / `industry-2026` / `details/` 为横向资产，**不计入知识域门数**；
  在 `/learn/` 中它们以 `isHorizontal: true` 标记、**不参与阶段链**（`course-structure.ts`）。」
- `site/src/pages/nav.astro:21` 「位于 P0 之前」→ 与 `learn.astro:282` 的表述统一为**一套词**：
  建议定版为「横向知识（不属于 P0–P4 任一阶段；先读可建立代际判断，但不构成前置）」。
  这句话同时修掉「在 P0 之前」（会被读成前置）与「不挂在任一阶段上」（会被读成无定位）的对立。
- `site/src/pages/learn.astro:113` 的 P0 段：**不该**再天然渲染 `llm-timeline`（`stage:'P0'`+order 0 → 它出现在 P0 段头）。
  两种改法见「未决决策点 D1」——落地前**不预设**。
- `course-structure.ts:85` 的 `stage: 'P0'`：若 D1 选 (b)，改为 `stage` 不可表达的值会破坏 `STAGES` 类型与 `STAGE_COUNTS`
  （`:387-393` 按 `c.stage === s` 计数）。**推荐**而不是新增取值：保留 `stage:'P0'` 但让 `/learn/` 渲染层
  **先按 `isHorizontal` 分桶、再按 `stage` 分桶**（见 03 形式层设计），这样 `STAGE_COUNTS`（17 门）的语义不变，
  也不会出现「P0 段里混着横向资产」。

**改法 A1-c：`courses.ts` 的 `phase` 字段处置（推荐：三步瘦身，不一次性删字段）**

`phase` 现在承载**两个不同事实**，必须先拆开：

1. 「是不是横向资产」← `isHorizontal`（已存在，`course-structure.ts:96/:373`）
2. 「旧三档档位」← 无读方，纯 legacy

- **步骤 1（解耦 R1）**：`courses.ts:279` 的过滤条件
  `c.slug !== NON_COURSE_CARD_SLUG && c.phase !== HORIZONTAL_PHASE`
  → 改为 `c.slug !== NON_COURSE_CARD_SLUG && !HORIZONTAL_SLUGS.has(c.slug)`，
  并在 `courses.ts` 新增 `const HORIZONTAL_SLUGS = new Set(['llm-timeline', 'industry-2026']);`，
  保留 `HORIZONTAL_PHASE` 一版用于过渡（标 `@deprecated`，同一提交内删除）。
  **注意**：这引入了一个新的手写集合（2 个 slug）。它是**可被门禁证明闭合**的（A7 判据 15：`HORIZONTAL_SLUGS` 必须逐元素等于
  `COURSE_STRUCTURE.filter(c => c.isHorizontal).map(c => c.slug)`），比读一个 legacy 字符串字段更强。
- **步骤 2（清 R2）**：`c/[slug].astro:61` 的兜底分支整段删除，改为
  `<span class="chip">{structure.stage}</span>`。
  同时更新 `c/[slug].astro:27-28` 的注释（现文写「回退 courses.ts phase」）为「structure 缺失即 fail-fast」。
  **更强的做法**：在 `:29` 后加构建期断言 `if (!structure) throw new Error(...)`，
  把「死分支」变成「不可能」；这与本仓既有的 fail-fast 风格（`mvps.ts:161`、`DomainMap.astro:46-49`）一致。
- **步骤 3（删字段）**：确认 R1/R2/R3 全部清掉后，删 `courses.ts:37` 的 `phase` 字段声明、
  `:50-233` 全部 17 行数据里的 `phase: 'P0'|...` 片段、`:260` 的 `HORIZONTAL_PHASE`、`:300` 的收口注释、`:312` 的 `DEFAULT_META.phase`。
  **这一步必须与 A7 判据 16（改动门禁源码解析锚点）同一提交**，否则门禁 `:127` 的行内正则
  `/slug: '([^']*)', domain: '([^']*)', phase: '([^']*)'/g` 会解析失败 → `hardError` → 门禁 exit 1（这是**正确**行为，但会挡 CI）。
- **回滚友好**：三步各自独立可回滚；步骤 3 是纯删除，revert 一个提交即可。

**改法 A1-d：`notes/process/site-refactor-plan.md:474` 与 `:484` 的「3 个消费方」表述**
（本轮 grep 实测只剩 3 个**读点**，但其中 1 个是死分支、1 个是脚本解析锚点，不是「消费方」）
→ 就地划改为「1 个活读点（DOMAIN_COUNT 过滤）+ 1 个死分支 + 1 个门禁解析锚点；三者的清退见 A1-c」。
按全局纪律第 4 条（更正要就地划改），**不许只追加一行说明**。

### 派生还是手工
**手工改动 + 门禁派生校验**。`knowledge-map.md` 的课程总表是人读的索引，不改为生成物（否则 `notes/` 不再是「人写的一手笔记」）；
但它的「阶段」列被 `A7 判据 14` 从 `course-structure.ts` **逐行重算比对** —— 即「手工写、机器锁」。
`phase` 字段是**真删除**，不是派生。

### 验收命令（可重跑）

```bash
# 1) 字形清除：课程总表区间内不得再出现 P0/P1/P2 作为列值
$ sed -n '53,68p' notes/knowledge-map.md | grep -cE '\|\s*P[0-2]\s*\|'   # 期望 0
# 2) phase 字段读点清零（排除注释/CSS/门禁解析锚点）
$ grep -rn '\.phase\b' --include=*.ts --include=*.astro site/src/ | grep -v 'phase-head'   # 期望 0 行
$ grep -rn 'HORIZONTAL_PHASE' --include=*.ts site/src/                                     # 期望 0 行（步骤 3 后）
# 3) 门禁仍全绿（含新增判据）
$ node site/tools/check-counters.mjs; echo "EXIT=$?"                                       # 期望 EXIT=0
# 4) 阶段计数真源唯一
$ grep -rn 'STAGE_COUNTS' site/src/                                                        # 只应出现 course-structure.ts 定义 + 3 个页面消费
```
**必须留浏览器目检**：`/learn/` 各阶段段头与课程卡上的档位 chip、`/c/<slug>/` meta 栏第三个 chip、
`/nav/` 的「P0 基础篇 → P4 收口与前沿」段头文案 —— 三者是否显示同一档位（机器只能验源码，不能验渲染归属）。

### 回滚点
- A1-a/A1-b：单文件文本改动，`git checkout -- notes/knowledge-map.md site/src/pages/nav.astro site/src/pages/learn.astro`。
- A1-c：步骤 1/2/3 各一个提交，`git revert <该步 sha>` 即可；**不要**把三步压成一个提交（否则回滚会连带动到门禁）。
- 回滚后必须重跑 `node site/tools/check-counters.mjs`（步骤 3 与门禁解析锚点强耦合）。

### 依赖（前置项 id）
- 无前置。**是 A2/A3/A4/A6 的前置**（它们都要引用「阶段/阅读序真源已定」这一结论）。

### 工作量
**M**。理由：文本改动量小（约 25 行），但**判断密度高**——`phase` 的三步瘦身要同时动数据文件、渲染层、
门禁源码解析锚点，任一步漏掉都让门禁变红；且 A1-b 的横向课定位需要先拍 D1 才能落地。

### 风险
1. **`phase` 删除会静默打破门禁**：`check-counters.mjs:127` 的正则把 `phase:` 当**字段分隔符**。若先删字段再改脚本，
   门禁从「12 条判据」退化为 `hardError`（exit 1，它是**故意严格**的）。处置：步骤 3 与脚本改造同一提交；改后跑一次确认 exit 0。
2. **`DOMAIN_COUNT` 语义滑坡**：把 `phase !== '—'` 换成 `!HORIZONTAL_SLUGS.has(slug)` 后，
   `DOMAIN_COUNT` 从「数据驱动」变成「依赖一个手写集合」。缓解：A7 判据 15 用 `isHorizontal`（真源侧）反向锁死该集合。
   若不做判据 15，**这一步比现状更差**（现状至少读的是数据字段）。
3. **9 门课的「优先级」列改值会与 `notes/interview-bank.md` 的 JD 权重叙述产生新的不一致**（本轮**未核实**该文件是否引用这 9 个值）→
   列入「依据不足项 U2」。
4. **删 `learn.astro` 的 P0 段渲染顺序**（A1-b）会改变读者第一眼看到的课程顺序，属**用户可见行为变更**，必须留目检。

---

## A2｜依赖图改为「构建期派生 + 门禁断言」：明确落法、产物路径与伪码

### id
`A2-dependency-graph-derived`

### 目标
让 `/map` 上读者看到的那张依赖图**不再可能与 `prereqs` 冲突**。真源 = `course-structure.ts` 的 `prereqs`；
`knowledge-map.md:103-125` 的 mermaid 从「手写权威」降为「被机器锁定的副本」或「由脚本生成的产物」；
`learn.astro:188` 那句「完整依赖图见知识地图 →」的指向必须与真源一致。

### 现状证据（本轮亲自跑）

**（1）不一致真值 8/15（`07-verification.md:35` 的修正值，已核）**：两条**方向相反**的冲突边 +

```
km:109  HARNESS --> MCP          vs  course-structure.ts:189  mcp:           prereqs ['sandbox']
km:111  EVAL --> MULTIAGENT      vs  course-structure.ts:223  multi-agent:   prereqs ['system-design','harness-from-scratch']
```
6 门在图中**无入边**：`agent-harness`(`:122` prereqs `['harness-from-scratch']`)、`rag`(`:138` 同)、
`observability`(`:276` `['api-engineering']`)、`long-term-memory`(`:295` `['rag']`)、`model-basics`(`:329` `['llm-timeline']`)、
`framework-ecosystem`(`:348` `['agent-harness']`)。

**（2）图里还有 4 条**指向 `INTERVIEW`（`km:122-125`）**的虚线边**，它们**不对应任何课程的 `prereqs`**
（`INTERVIEW` 不是 17 门课之一）。这 4 条是「赴面试的能力汇聚」示意，**不是依赖**——设计时必须显式区分这两类边，
否则「派生」会把它们误判成 11 条非法边。

**（3）正面（`01-pedagogy.md §1.1` 已核，本轮未推翻）**：`prereqs` 拓扑 17/17 合法、无环；
`next` = 数组序 + 1（末课 `:366 `next: []`）。**这两条是 A2 可以依赖的既有资产**。

**（4）`learn.astro:186-188` 现状原文**：`顺序语义：每门课 next = 线性序 + 1（末课空，即上下篇导航）；跨多门的逻辑依赖由 prereqs 承载（如「评测工程化」同时是「durable execution」与「数据飞轮」的前置…）。完整依赖图见 <a href={base + "map/"}>知识地图 →</a>`

**（5）`/map` 的渲染机制（`viz/mermaid-check.mjs:23` 注释 + `astro.config.mjs:11-20`）**：
`/map` 是 `notes/knowledge-map.md` **原文渲染**（`remarkMermaid()` 把 ` ```mermaid ` 块转成 `<div class="mermaid">`，
前端 mermaid 库渲染）。即：**图是笔记里的文本**，站点没有第二份图。

### 具体改法：三种落法的对比与选定

| 落法 | 机制 | 产物路径 | 优点 | 缺点 |
|---|---|---|---|---|
| **(A) 预生成文件 + 检查模式** | 脚本渲染 mermaid 文本，写回 `knowledge-map.md` 的受保护区间；`--check` 只比对不写 | 改 `notes/knowledge-map.md:77-126` 区间 | 读者读到的仍是笔记；站点点零改动；人可 diff | 首次落地要动笔记的大块文本（与 P2 的「notes 是人写一手源」张力） |
| **(B) Astro 内脚本（构建期）** | 在 `/map` 页把 mermaid 块**替换**成由 `prereqs` 生成的图 | 需在 `astro.config.mjs` 的 remark 管线或 `map.astro` 内做「替换/追加」 | 零手工副本、天然不可能漂移 | 读者在 GitHub 看 `knowledge-map.md` 仍见**手写图**（与站点不一致，问题只是搬了家）；且站点源与笔记源分叉 |
| **(C) 独立 Astro 组件** | 新 `DependencyGraph.astro` 读 `COURSE_STRUCTURE` 生成图，`/map` 页在笔记正文**之前**插入 | 新增 `site/src/components/DependencyGraph.astro`；改 `site/src/pages/map.astro:i` | 不碰笔记、不碰 astro 管线、失败面最小 | `/map` 会**同时**有两张图（组件版 + 笔记手写版）→ 读者看到两张互相打脸的图，**比现状更糟**，除非同轮删掉笔记里的图 |

**推荐：落法 (A)，并把产物路径定为「受保护区间」**。理由：
1. 唯一能同时修好「站点读者」与「GitHub 读者」两种读者（P2 的影响面正是这两类）。
2. `/map` 是笔记原文渲染，落法 (A) 让站点**零改动**即自动一致（不需要碰 `astro.config.mjs` 与 remark 管线，
   而 (B) 要改管线，风险最高）。
3. 与 `check-counters.mjs` 已确立的「声明值在笔记、重算值在源码」哲学一致（`check-counters.mjs:18-19` 明文写了「不新增第二份真源」）。
4. 落法 (C) 的「两张图」问题在 (A) 中不存在。

**产物路径与标记（落法 A 的契约）**：

- 受保护区间：`notes/knowledge-map.md` 中从 `<!-- BEGIN:dep-graph (generated from site/src/data/course-structure.ts) -->`
  到 `<!-- END:dep-graph -->` 两行之间。**当前对应 `:78-126`**（含 ` ```mermaid ` 围栏与 ` ``` ` 收尾）。
- 生成器：`site/tools/gen-dep-graph.mjs`（新增），**默认 `--check`**（不写盘，比对后 exit 1/0）；
  只有显式 `--write` 才写回。这直接满足「不跑任何会写工作区的脚本」纪律——因为默认模式就是只读。
- 门禁接入：`check-counters.mjs` 末尾对同一区间做**逐字节**比对（判据 17，见 A7），
  这样 CI 不需要多跑一个脚本，也保证「改了 `prereqs` 忘了重生成」必红。

**伪码（生成器核心，落法 A）**：

```js
// site/tools/gen-dep-graph.mjs
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const KM   = path.join(ROOT, 'notes/knowledge-map.md');
const CS   = path.join(ROOT, 'site/src/data/course-structure.ts');

const BEGIN = '<!-- BEGIN:dep-graph (generated from site/src/data/course-structure.ts) -->';
const END   = '<!-- END:dep-graph -->';

// 1) 从源码解析（不 import TS，沿用 check-counters.mjs 的既有策略）
const src = fs.readFileSync(CS, 'utf8');
// 逐条抓 { slug, stage, prereqs, isHorizontal }；锚点为字段名而非行号，避免行漂移
const entries = [...src.matchAll(
  /slug:\s*'([^']+)'[\s\S]*?stage:\s*'(P\d)'[\s\S]*?prereqs:\s*\[([^\]]*)\][\s\S]*?isHorizontal:\s*(true|false)/g
)].map(([, slug, stage, pre, horiz]) => ({
  slug, stage, isHorizontal: horiz === 'true',
  prereqs: [...pre.matchAll(/'([^']+)'/g)].map(m => m[1]),
}));
if (entries.length !== 17) throw new Error(`解析到 ${entries.length} 门，期望 17 —— 解析锚点已失效`);

// 2) mermaid id：slug → 图内 ID（稳定映射，不用下划线，避免与 mermaid 关键字冲突）
const ID = (slug) => 'n_' + slug.replace(/[^a-z0-9]/gi, '_').toUpperCase();

// 3) 渲染：节点行 + 依赖边行（**只输出 prereqs 边**，不输出 INTERVIEW 汇聚边）
const nodeLines = entries.map(e =>
  `  ${ID(e.slug)}["${e.isHorizontal ? '横向' : e.stage} · ${e.slug}"]`);
const edgeLines = entries.flatMap(e => e.prereqs.map(p => `  ${ID(p)} --> ${ID(e.slug)}`));

// 4) 固定顺序：节点按数组序（= 阅读序），边按 (from 序, to 序) 排序 → 保证幂等、可逐字节比对
const out = ['```mermaid', 'flowchart LR', ...nodeLines, '', ...edgeLines, '```'].join('\n');

// 5) --check（默认）：比对受保护区间，不符则打印 diff 摘要并 exit 1
const md = fs.readFileSync(KM, 'utf8');
const b = md.indexOf(BEGIN), e2 = md.indexOf(END);
if (b < 0 || e2 < 0) { console.error('✖ knowledge-map.md 缺少 BEGIN/END:dep-graph 标记'); process.exit(1); }
const current = md.slice(b + BEGIN.length, e2).trim();
if (process.argv.includes('--write')) {
  fs.writeFileSync(KM, md.slice(0, b + BEGIN.length) + '\n' + out + '\n' + md.slice(e2));
  console.log('已重生成依赖图');
} else {
  const ok = current === out;
  console.log(ok ? '✅ 依赖图与 prereqs 一致' : '✖ 依赖图与 prereqs 不一致（跑 --write 重生成，或改 course-structure.ts 的 prereqs）');
  process.exit(ok ? 0 : 1);
}
```

**关于 `INTERVIEW` 汇聚边（`km:115-125` 现有 11 条中指向 INTERVIEW 的部分）的处置**：
它们是真实信息（「学完 X 可以去面试」），但不是 `prereqs`。**建议**保留为**独立小节**、
移出受保护区间：即把 `INTERVIEW` 节点与那 11 条边从生成图里拿掉，改写成受保护区间**下方**的一段普通文字列表
（「面试演练的前置覆盖：系统设计 / 沙箱与凭据 / 评测工程化 / durable execution / MCP / API / 数据飞轮 + 4 门虚线加深」），
由 `A7 判据 18` 断言「该列表的课程集合 = 全部 17 门课中 `next` 为空或 `stage∈{P2,P3,P4}` 的集合」——
**否则这 11 条边会永久逃出机器校验**（这正是 P2 的成因）。

### 派生还是手工
**派生（构建期脚本）**。`knowledge-map.md` 的图区间是**生成物**，人不得手改；
`course-structure.ts` 的 `prereqs` 是唯一真源。`learn.astro:188` 的引用句保留手写（它只有一句话，且不含数字/边）。

### 验收命令（可重跑）

```bash
# 1) 生成器检查模式（只读，不写盘）——这是默认行为
$ node site/tools/gen-dep-graph.mjs; echo "EXIT=$?"                     # 期望：✅ 一致 / EXIT=0
# 2) 故意破坏 prereqs 后必须变红（证伪能力自检）
$ cp site/src/data/course-structure.ts /tmp/cs.bak
$ sed -i "s/prereqs: \['sandbox'\]/prereqs: ['harness-from-scratch']/" site/src/data/course-structure.ts
$ node site/tools/gen-dep-graph.mjs; echo "EXIT=$?"                     # 期望：✖ 不一致 / EXIT=1
$ cp /tmp/cs.bak site/src/data/course-structure.ts                       # 复原并重跑确认 EXIT=0
# 3) 门禁整体仍绿（含新增判据 17/18）
$ node site/tools/check-counters.mjs; echo "EXIT=$?"                     # 期望 EXIT=0
# 4) 冲突边归零：图中不得再有 HARNESS --> MCP
$ sed -n '/BEGIN:dep-graph/,/END:dep-graph/p' notes/knowledge-map.md | grep -c 'HARNESS --> MCP'   # 期望 0
# 5) 六门「无入边」归零：每门至少 0 条或多条**与 prereqs 相同**的入边（由 1) 保证）
```
**必须留浏览器目检**：`/map` 页依赖图的**渲染后**外观——mermaid 是否报语法错误（`viz/mermaid-check.mjs` 能验「渲染成 `<svg>` 且无语法错」，
但它要写 `site/tools/out/` 且需 `site/dist`，本轮**不跑**，见 A7 与「依据不足项 U4」）；
节点位置是否因边数变化而重叠；`flowchart LR` 在 17 节点下是否需要切 `TD`。**这些属于形式组的 03 文档，本设计只确保数据正确。**

### 回滚点
- 生成器与门禁是两个新文件/新增段 → `git revert` 单提交即恢复现状。
- `knowledge-map.md` 的区间替换是**大块文本改动** → 回滚后立刻跑 `node site/tools/gen-dep-graph.mjs` 确认「代码与文本又一致」。
  **回滚不完整的最危险形态**是「文本回滚了、生成器还在」→ 下一次 CI 变红但没人知道为什么。故回滚必须**同时**回滚两处。

### 依赖（前置项 id）
- **A1**（阶段真源已定）——图节点标签要用 `stage`。
- **A7**（判据 17/18 必须同轮落地）——否则生成物在被改坏时无人发现。

### 工作量
**M**。理由：生成器本身约 40 行、`--check` 默认模式简单；工作量主要在**解析锚点的稳健性**
（现有 `check-counters.mjs` 用的是**顺序敏感**的行内正则 `slug/domain/phase`，A2 的正则要跨字段 `[\s\S]*?` 匹配，
一旦 `course-structure.ts` 的字段顺序变动就会误抓——必须加「解析到 17 门否则 throw」的自检，伪码已含）。

### 风险
1. **解析锚点脆弱**：正则跨字段匹配对字段重排敏感。缓解：断言 `entries.length === 17` + 断言每门 `prereqs ⊆ slugs`（自环检测），
   两者都不成立即 `throw`（宁可红，不可静默错）。
2. **图的可读性会下降**：从「手绘的、带 `· P0`/状态语义的图」变成「17 节点 + 14 条边的机器排版图」，
   原图里「done/doing/todo/hub 四色 classDef」（`km:79-83`）会丢失。**这是真实的功能退化**，
   需在 03 形式组里补「状态着色由 `mvpStatus`/`status` 派生」——否则 A2 解决了正确性、制造了可读性回退。
3. **`mermaid-check.mjs` 的可移植性**（`viz/mermaid-check.mjs:10` 硬编码绝对路径 `DIST='/home/ubuntu/app/learn-agent-harness/site/dist'`）
   会让 A2 的浏览器验收在非本机环境失效 → 列入「依据不足项 U4」与「未决决策点 D3」。
4. **`site/dist` 现为残骸**（`07-verification.md:57`：0 HTML / 89 文件）→ A2 的 `/map` 目检**当前无法执行**，
   必须先做形式组 0（构建环境）。这是 A2 的**外部阻塞**，不是 A2 自身缺陷。

---

## A3｜阅读序唯一真源：数组序；`km:128` 去箭头链、`km:162` 与 `learn.astro:177` 统一

### id
`A3-reading-order-single-source`

### 目标
「先学哪门」只有一份答案 = `course-structure.ts` 的数组序（order = index，`course-structure.ts:395` `BY_SLUG` 已用它）。
`km:128` 的「建议开课顺序」箭头链、`km:162` 的未结事项版本、`learn.astro:177` 的文案三者不得再互斥。

### 现状证据（本轮亲自读原文）

**三份互斥版本，最大位次差 7**：

| # | file:line | 内容 | 与数组序的差 |
|---|---|---|---|
| V1 | `notes/knowledge-map.md:128-129` | 「**建议开课顺序**:系统设计 → **多智能体编排** → 沙箱与凭据(续 §S2)→ 评测工程化 → durable execution → MCP → API → 数据飞轮 →(P2 四课按目标岗位权重排)」 | 多智能体编排列第 **2** 位 |
| V2 | `notes/knowledge-map.md:162` | 「开课顺序确认（当前建议：系统设计 → 沙箱与凭据（续 S2）→ 评测工程化 → durable execution → MCP → API → 数据飞轮 → P2 四课按目标岗位权重排）」**没有多智能体编排** | 与该课无关（漏项） |
| V3 | `site/src/pages/learn.astro:177` | 「线性阅读序 **#1→#17**（COURSE_STRUCTURE 数组序，与 course-structure.ts 单一真源）」 | 多智能体编排第 **9**、系统设计第 **5** |

**数组序实测（本轮由 `grep -n "slug:" course-structure.ts` 与行号推得，1-based）**：
`llm-timeline`(1) → `harness-from-scratch`(2) → `agent-harness`(3) → `rag`(4) → `system-design`(5) → `sandbox`(6) →
`mcp`(7) → `evaluation`(8) → `multi-agent`(9) → `durable-execution`(10) → `api-engineering`(11) → `observability`(12) →
`long-term-memory`(13) → `data-flywheel`(14) → `model-basics`(15) → `framework-ecosystem`(16) → `industry-2026`(17)`
→ **系统设计第 5、多智能体编排第 9**，与 `07-verification.md:36` 的复核值一致。

**另注（V1 的方向性错误，本轮新增发现）**：V1 把「评测工程化」放在 `durable execution` **之前**，但数组序是
`mcp`(7) → `evaluation`(8) → `durable-execution`(10)；V1 又写「沙箱与凭据(续 §S2)」在第 3 位而数组序是第 6。
**V1 与数组序不是「顺序不同」而是「语义不同」**（V1 是**备课进度**建议，数组序是**读者阅读序**）——
这一点在改造时必须显式声明，否则改成哪一种都会让另一批读者落空（见 D2）。

### 具体改法

**改法 A3-a：`learn.astro:177` 改为引用型（去硬编码 `#1→#17`）**

现状：
```astro
<span class="phase-desc">线性阅读序 #1→#17（COURSE_STRUCTURE 数组序，与 course-structure.ts 单一真源）</span>
```
改为（**从数据派生，不留任何字面量**）：
```astro
<span class="phase-desc">
  线性阅读序 #1→#{COURSE_STRUCTURE.length}（COURSE_STRUCTURE 数组序，与 course-structure.ts 单一真源）
</span>
```
理由：`#17` 是 04/08 分界清单里的 P10 同源问题（`learn.astro:199/:204` 的「17 个 demo」也是同一毛病）。
`COURSE_STRUCTURE.length` 已在同文件被消费（`learn.astro:273` 已用 `{COURSE_STRUCTURE.length} 门`），
**引入零新依赖**。若要更严格（防止有人把 `#1` 也当可变），可改为 `#{1}→#{COURSE_STRUCTURE.length}`——
**不建议**：`#1` 是「序列从 1 数起」的语义常量，不是数据。

**改法 A3-b：`km:128-129` 的箭头链「降级 + 去箭头」**

- 标题「**建议开课顺序**」→「**按目标岗位权重的选题优先级**（**不构成阅读顺序**；阅读序以 `/learn/` 的 #1→#N 为准）」。
- **删掉箭头链**（`→` 序列本身就在宣称一个顺序）。改为无序列的**分组表**：「先修地基 = 从零写 harness + RAG」/
  「收口能力 = 系统设计」/「P1 三课的公共地基 = 评测工程化」/「按岗位加权的选题池 = 其余」。
- 保留 `:129` 的「理由」段（它讲的是**依赖理由**，与顺序无关，且与 `prereqs` 自洽：评测工程化确是 `durable-execution`(`:242`)
  与 `data-flywheel`(`:312`) 的前置）。**注意**：`:129` 现写「多智能体编排依赖系统设计模板 + 从零写 harness 的子代理概念」，
  与 `:223` `prereqs ['system-design','harness-from-scratch']` **一致**，这是好证据，应保留。

**改法 A3-c：`km:162` 版本就地划改**

`notes/knowledge-map.md:162` 现为「`- [ ] [interview-bank §7 并入] 开课顺序确认（当前建议：系统设计 → 沙箱与凭据（续 S2）→ …）`」。
按全局纪律第 4 条（**就地划改，不能只追加**）：
改为「`- [x] 阅读序已定案（2026-XX-XX）：以 `course-structure.ts` 数组序为唯一阅读序，见 `/learn/` #1→#17。
开课/备课顺序（教学方视角）单列于 `:128` 的选题优先级，二者不是同一事实、不再并列为「顺序」两个版本。`」
——即**关闭该未结事项**，而不是再写第三份顺序。

**改法 A3-d：`handoff.md` 与 `interview-bank.md §7` 的顺序副本**
`interview-bank.md §7` 是 `:162` 那句的来源（该行自称「[interview-bank §7 并入]」）。
本轮**未通读** `interview-bank.md §7`，故**不预设**其改法 → 列入「依据不足项 U3」。
`handoff.md:199` 含一条**备课顺序**叙述（「Phase 1：系统设计 → 沙箱与凭据续 §S2 → 评测工程化」），
它是**历史接手记录**，按 C 批次（时效与证据链）处理，**不在 A3 范围**内改。

### 派生还是手工
**手工 + 门禁**。`km:128` 的分组表是人写的（它表达「岗位权重」，无法从仓库派生）；
但「**不得出现箭头链**」可机器断言（A7 判据 19：该区间内 `→` 计数为 0），
「`learn.astro` 不得出现 `#17` 字面量」也可断言（A7 判据 20）。

### 验收命令（可重跑）

```bash
# 1) 阅读序字面量清除
$ grep -n '#17' site/src/pages/learn.astro                              # 期望 0 行
# 2) km:128 区间不得有箭头链
$ sed -n '128,133p' notes/knowledge-map.md | grep -c '→'                # 期望 ≤1（仅允许出现在"不构成阅读顺序"的否定句里，按定版文案核对）
# 3) 未结事项已关闭
$ grep -n '开课顺序确认' notes/knowledge-map.md                          # 期望：命中行含 [x] 与 "已定案"
# 4) 三份版本的课程集合一致性（多智能体编排必须出现在阅读序里，位次 9）
$ grep -n "slug: 'multi-agent'" site/src/data/course-structure.ts        # 期望 1 行，且其数组位次=9
# 5) 门禁全绿
$ node site/tools/check-counters.mjs; echo "EXIT=$?"                     # 期望 EXIT=0
```
**必须留浏览器目检**：`/learn/` 的「建议开课顺序」段（`learn.astro:174-191`）在去掉箭头链后是否仍可读；
课程卡 `order-chain`（`:180-184`）的 17 个链接是否仍是**数组序**呈现（机器只看源码看得到顺序，看不到视觉顺序）。

### 回滚点
单文件文本改动（`notes/knowledge-map.md` + `site/src/pages/learn.astro`），`git checkout --` 即复原。
**但** A3-c 关闭未结事项后回滚会让 `:162` 重新变回「两个顺序版本并存」→ 回滚必须与 A3-b 一起，
否则落到比改造前更难解释的中间态。

### 依赖（前置项 id）
- **A1**（阶段真源）。与 **A2** 无强依赖（阅读序 ≠ 依赖图），但两者都改 `knowledge-map.md:103-129` **相邻区间** →
  **必须合并到一个改动批次**，否则两个改动会互相冲突（`:128` 紧接 `:126` 的图围栏结束）。

### 工作量
**S**。理由：纯文本 + 一个插值表达式（`learn.astro:177`）；没有新机制。**唯一要小心的是 A2/A3 改同一块**。

### 风险
1. **「备课顺序」这个真实需求被删除**：V1 表达的是**教学方**的备课优先级（先备哪门）。A3-b 把它改成「选题优先池」后，
   如果实际使用方按「备课顺序」读它，会失去信息。缓解：在标题里明写「教学方视角的选题优先级」，并保留分组语义。
   **这是 D2 未决点的核心。**
2. **`:128` 与 `:129` 的「评测工程化是 P1 三课的公共地基」中的「P1」是旧三档字形**：
   按 `course-structure.ts`，`durable-execution`/`api-engineering` 是 **P2**、`mcp` 是 **P1**（见 A1 表）。
   即 `:129` **也含 A1 的同源缺陷**。A3 落地时必须顺手改掉这句（否则 A1 的「去 P0-P2 字形」不彻底）→
   **A3 与 A1 是同一改动的两部分**。
3. **位次差 7 的读者影响面**：`07-verification.md:36` 已确认三处互斥，但「读者实际按哪个学」**无数据**（无埋点）。
   本设计选择数组序，理由是「`/learn/` 是读者第一入口 + `next` 字段已按数组序生成上下篇导航」（`course-structure.ts:106` 等）——
   这是**可验证的一致性论证**，不是偏好。

---

## A4｜计数派生：`WORK_COUNT` / `DOMAIN_COUNT` / 站点手写副本

### id
`A4-counter-derivation`

### 目标
`08-synthesis.md` P10 的四套数（6/10/11/17）收敛到**两类**：①「具名作品数」（真源 = 一份具名清单）②
「有 demo 脚本的目录数」（真源 = 各 `package.json`，若需要展示）。站点所有 `17 个 demo` / `6 个可运行 demo` 文案
改为**引用常量**或**改为正确的量词**。

### 现状证据（本轮亲自 grep + 亲自算）

**（1）常量及其读方（grep `--include=*.ts/*.astro`，排除 `node_modules`/`analysis`/`site/dist`）**

| 常量 | 定义 | 读方（file:line） |
|---|---|---|
| `COURSE_COUNT` | `courses.ts:269`（filter 派生）**和** `course-structure.ts:384`（`length` 派生）——**两份定义** | `interview.astro:14,124`；`index.astro:15,51,257,278` |
| `CARD_COUNT` | `courses.ts:272` | **0 个读方**（本轮 grep 无命中） |
| `DOMAIN_COUNT` | `courses.ts:278`（Set 派生） | `index.astro:15,51,261`；`DomainMap.astro:19,45-49`（构建期断言） |
| `WORK_COUNT` | `courses.ts:298`（**硬编码 6**） | `works.astro:6,62,408,410`；`interview.astro:14,119`；`index.astro:15,145,265` |
| `STAGE_COUNTS` | `course-structure.ts:387`（reduce 派生） | `nav.astro:8,103`；`learn.astro:9,80,116,272-273`；`index.astro:20,82` |

**（2）「6/10/11/17」的实测真值（本轮亲自跑）**

```
$ for d in */; do d=${d%/}; [ -f "$d/package.json" ] || continue; node -e "const p=require('./$d/package.json');const s=Object.keys(p.scripts||{});console.log('$d','| exact-demo:',s.includes('demo')?'YES':'no ','| demo*:',s.filter(x=>x.startsWith('demo')).join(',')||'-')"; done
api-demo                | exact-demo: YES | demo*
durable-execution-demo  | exact-demo: YES | demo,demo:one
flywheel-demo           | exact-demo: YES | demo
framework-demo          | exact-demo: YES | demo
harness-demo            | exact-demo: YES | demo,demo:crash,demo:reject,demo:compact,demo:otel,demo:otel:mock,demo:otel:assert
mcp-demo                | exact-demo: YES | demo
memory-redteam          | exact-demo: YES | demo
model-basics-demo       | exact-demo: YES | demo
my-agent                | exact-demo: YES | demo,demo:m0..demo:m4
rag-demo                | exact-demo: **no**  | demo:retrieval,demo:bm25,demo:rag,demo:eval
sandbox-demo            | exact-demo: YES | demo
site                    | exact-demo: no  | -
```

→ **精确 `demo` 键 = 10**（与 `07-verification.md:65` 的复核一致）；**含 `demo*` 脚本 = 11**（增 `rag-demo`）。
文档树里 `api-demo` / `flywheel-demo` / `model-basics-demo` / `my-agent` 是**有 demo 但不在具名作品清单**的目录。

**（3）「17 个 demo」三处活表述（`07-verification.md:79` confirmed，本轮复读原文）**
- `site/src/pages/learn.astro:199`：「…；**17 个 demo** 不是终点作品，而是每个 milestone 的参考答案（参考样本）」
- `site/src/pages/learn.astro:204`：「主线是你亲手搭的工具；**17 个 demo** 是每个 milestone 的参考答案。」
- `site/src/pages/index.astro:112`：「不是读完 **17 个 demo** 就结束，而是你自己写的代码能跑起来」

它们的**语义意图**是「17 门课各自的参考样本」（`mvpSlug` → `mvps.ts` 词表），**不是**「有 demo 脚本的目录」。
**根因是量词误用**：把「17 门课的参考样本」写成了「17 个 demo」。而 `WORK_COUNT = 6` 是**作品目录**口径。
两者**不是同一个集合**，所以「改成引用 `WORK_COUNT`」是**错的修法**——会把 17 改成 6，语义又错一次。

**（4）`knowledge-map.md` 口径块**（`:16`「可运行 demo 作品 6」条）与 `README.md:9`（本轮复读原文：
「6 个可运行 demo（`npm run demo` 一键复现；即下表六个**具名作品**目录——…）」）已就地澄清过，
**但 `README.md:9` 仍有一处残留不实**：它说「`npm run demo` 一键复现」，而六个具名作品里 **`rag-demo` 的入口是 `demo:eval`、
没有 `demo` 键**（上表实测）→ 「一键复现」对 `rag-demo` 不成立。`courses.ts:291` 自己也写明「6 具名作品里只有 5 个有 demo 键」。

### 具体改法

**改法 A4-a：把「17 个 demo」改为「N 门课的参考样本」（**首选**，零新机制）**

把三处措辞改为按真源表达的**类别名**，而**不是**换成另一个数字：
- `learn.astro:199`：`；17 个 demo 不是终点作品` → `；{COURSE_STRUCTURE.length} 门课各自的参考样本不是终点作品`
- `learn.astro:204`：`<strong>主线是你亲手搭的工具；17 个 demo 是每个 milestone 的参考答案。</strong>`
  → `<strong>主线是你亲手搭的工具；{COURSE_STRUCTURE.length} 门课的参考样本只是每个 milestone 的参考答案。</strong>`
- `index.astro:112`：`不是读完 17 个 demo 就结束` → `不是读完 {COURSE_STRUCTURE.length} 门课的参考样本就结束`
  （`index.astro:15` 已 import `COURSE_COUNT`，**优先用已有 import**：`{COURSE_COUNT} 门课的参考样本`）
- `learn.astro:193` 的**注释**「（capstone：你要搭的 / 17 demo 是参考样本）」同步改（注释也是副本；按纪律第 4 条就地划改）。

**为什么不用 `WORK_COUNT`**：`WORK_COUNT = 6` 是「具名作品目录」；这三处的对象是「17 门课的参考样本」。
用 `WORK_COUNT` 会把「17 门课」说成「6 个作品」，是**新的口径失真**。`WORK_COUNT` 的正确用武之地是
`works.astro` / `interview.astro:119`（「/works/ 看 6 个作品」）——那里**现已正确**。

**改法 A4-b：`WORK_COUNT` 由具名清单派生（去掉 `= 6` 字面量）**

`courses.ts:298` 现为 `export const WORK_COUNT = 6;`。改为：
```ts
/** 具名作品目录（口径真源；knowledge-map 计数口径块「可运行 demo 作品 6」条逐名一致） */
export const WORK_DIRS = [
  'harness-demo', 'rag-demo', 'sandbox-demo', 'mcp-demo', 'durable-execution-demo', 'framework-demo',
] as const;
export const WORK_COUNT = WORK_DIRS.length;
```
- **收益**：`A7 判据 21` 可断言「`WORK_DIRS` 每一项都存在且含 `package.json`」→ 「作品目录被删/改名」这类改动会立刻红。
- **仍然手工**的是**清单本身**（「哪 6 个算作品」是**人的判断**，无法从目录派生——因为 `memory-redteam` 也有 `demo` 键却不计入）。
  **不要**试图把它改成「扫描目录派生」：那正是 `courses.ts:289-295` 明文警告的错法。
- `courses.ts:285-297` 的长注释**保留**（它是这份清单的口径解释），但要补一句指向 `WORK_DIRS`。

**改法 A4-c：`COURSE_COUNT` 的两份定义合一**
`courses.ts:269`（filter）与 `course-structure.ts:384`（`length`）都导出 `COURSE_COUNT`。
两份目前**值相同（17）**（本轮 `check-counters` 的「课程页」判据与 `COURSE_STRUCTURE.length` 都=17），
但**无任何断言保证它们相等**。按「唯一真源」原则：
- **保留** `course-structure.ts:384` 的 `COURSE_COUNT`（它是数组长度的同义反复，且 A2 的派生链依赖它）。
- `courses.ts:269` 改为**跨文件断言**或改为从 `course-structure` 重导出：
  `export { COURSE_COUNT } from './course-structure';`
  **风险**：`courses.ts` 不 import `course-structure`（后者 import 前者？核实：`course-structure.ts:17` 只 import `./mvps`）→
  **无环**，重导出是安全的。
- 若不愿动 import 图：**退路**是加 `A7 判据 22`：`COURSE_COUNT(courses.ts) === COURSE_COUNT(course-structure.ts) === CARD_COUNT - 1`。
  三个数互锁，任一处漂移即红。**推荐退路**（改动面最小）。

**改法 A4-d：`README.md:9` 的「一键复现」措辞**
`6 个可运行 demo（npm run demo 一键复现；…）` → `6 个具名作品目录（其中 5 个有 npm run demo 入口，
rag-demo 的入口是 demo:eval）；…`（`courses.ts:291` 已有现成表述可照抄）。
`knowledge-map.md:16` 的口径块**已写对**（本轮复读确认它写的是「六个具名作品目录」且显式声明不是「所有带 demo 脚本的目录」）→ **不动**。

**改法 A4-e：「有 demo 脚本的目录数」若要展示，改为派生**
本轮不需要展示它（站点无此文案）。**但**若将来要展示，真源只能是扫描 `*/package.json` 的 `scripts.demo*`。
**建议**：不新增常量，直接由 `A7 判据 23` 断言「精确 `demo` 键目录数 = 10」的**事实**（这样 10 这个数不会变成第三个手写副本）。
**注意**：10 这个数**不应写进 `knowledge-map.md` 口径块**（它不是一个业务口径，只是实测事实）→
判据 23 的期望值应**从文件系统重算**，而不是硬编码 10。**否则就是「用门禁制造了第四个副本」。**
这是本设计里一个**容易做错**的点，实施时必须检查。

### 派生还是手工
- `WORK_COUNT`：**半派生**（清单手工、数量派生）。理由：哪个目录算「作品」是业务判断。
- `COURSE_COUNT`/`CARD_COUNT`/`DOMAIN_COUNT`/`STAGE_COUNTS`：**已派生**（不改，只互锁）。
- 站点三处「17 个 demo」：**手工改文案 + 改为插值**（引用 `COURSE_COUNT` / `COURSE_STRUCTURE.length`）。
- `README.md:9`：**手工**。

### 验收命令（可重跑）

```bash
# 1) 「17 个 demo」字面量清零
$ grep -rn '17 个 demo\|17 demo' site/src/ README.md handoff.md    # 期望 0 行
# 2) WORK_COUNT 不再是字面量
$ grep -n 'WORK_COUNT = 6' site/src/data/courses.ts                # 期望 0 行
$ grep -n 'WORK_COUNT = WORK_DIRS.length' site/src/data/courses.ts # 期望 1 行
# 3) 两个 COURSE_COUNT 同值（退路方案下由门禁断言）
$ node -e "const c=require('fs').readFileSync('site/src/data/courses.ts','utf8');" # 或用门禁判据 22
# 4) 六个具名作品目录都存在
$ for d in harness-demo rag-demo sandbox-demo mcp-demo durable-execution-demo framework-demo; do [ -f "$d/package.json" ] && echo "OK $d" || echo "MISSING $d"; done
# 5) 门禁全绿
$ node site/tools/check-counters.mjs; echo "EXIT=$?"               # 期望 EXIT=0
```
**必须留浏览器目检**：`/learn/` capstone 段（`learn.astro:196-211`）与 `index.astro:108-117` 在插值替换后
**读起来是否仍通顺**（「17 门课的参考样本」比「17 个 demo」长，可能换行/溢出）；
`/works/` 的「6 个可运行作品一览」（`works.astro:62`）与 `:408-410` 的脚注是否仍自洽。

### 回滚点
纯文本/常量改动，`git checkout --` 三处文件即复原。`WORK_DIRS` 引入后若回滚，
`A7 判据 21` 会因找不到 `WORK_DIRS` 而 `hardError` → **回滚必须连带回滚门禁判据**（同提交原则）。

### 依赖（前置项 id）
- **A1**（`DOMAIN_COUNT` 的过滤条件改法在 A1-c 已定）。`A4-c` 与 `A2`（`COURSE_STRUCTURE` 解析）无冲突。

### 工作量
**S–M**。理由：改动点共 6 处文本 + 1 个常量表达式 + 1 个 import 决策；**无新机制**。
偏 M 的唯一原因是 `COURSE_COUNT` 双定义需要选「重导出 vs 门禁互锁」并在 `tsc` 层面确认无环。

### 风险
1. **把「17 个 demo」错改成「6 个作品」**：这是本项**最高危的操作失误**（看似「改成了引用常量」，实则换了语义）。
   已在 A4-a 写明为什么不用 `WORK_COUNT`。实施者必须逐字对照。
2. **`WORK_DIRS` 变成第四份「作品清单」**：`knowledge-map.md:16` 已有一份逐名清单，`README.md` 作品表有第三份。
   A4-b 不新增副本，而是**把 `courses.ts` 里原本隐含的清单显式化**。若要彻底收敛，需 `A7 判据 21` 同时断言
   `knowledge-map.md:16` 与 `README.md` 作品表的目录名集合 == `WORK_DIRS`（**判据 21 的完整形态**）。
3. **门禁判据 23 硬编码 10**（见 A4-e）→ 会把「实测事实」升格为「口径」，未来目录变化时门禁会阻止合理改动。
   必须在实施时确认判据 23 是**从文件系统重算**。
4. **`CARD_COUNT` 有 0 个读方**：本轮 grep 未发现消费方。可能是给外部/文档用的。
   **不建议**删除（属清理，不属本批次目标），但应在 `A7 判据 22` 里把它纳入互锁，否则它永远「没人看也没人验」。

---

## A5｜`knowledge-map.md:141-152` 映射表补登与派生

### id
`A5-asset-course-map`

### 目标
「哪个资产证明了哪门课的能力」这张表成为**完整且可校验**的索引：不漏登已有 demo 目录，新增目录时不会静默逃出。

### 现状证据（本轮亲自读 + 07 复核值）

**（1）表结构**：`## 资产 ↔ 课程映射`（`knowledge-map.md:141`）→ 表头 `:144` → 数据行 `:146-152`。
**实测 8 行数据**（`07-verification.md:76` confirmed，本轮 `sed` 读出同为 8 行）：
`harness-demo` / `whiteboard` / `rag-demo` / `durable-execution-demo` / `sandbox-demo` / `memory-redteam` / `FinHot(生产)` / `pi + pi-agents-team`。

**（2）漏登**：
- `mcp-demo`、`framework-demo`：**目录存在**（上表 A4 的 `for` 循环实测二者都有 `package.json` + `demo` 键），
  且 `knowledge-map.md:37` / `:43` 的**上面那张表**已把 `mcp.md(mcp-demo/)` / `framework-ecosystem.md(framework-demo/)` 记上 →
  **同一文件内，索引有、能力映射表没有**。
- `api-demo`、`flywheel-demo`、`model-basics-demo`：**目录存在且有 demo 键**，映射表 0 命中。
- `my-agent`（capstone 主线）：映射表 0 命中，但 `capstone.ts:49-118` 的 `reference` 六栏**引用**了
  `api-demo` / `flywheel-demo` / `model-basics-demo` / `memory-redteam` / `framework-demo`（本轮读原文）。
- `final-project`：映射表 0 命中（`05-coverage.md` F5 confirmed：`README.md`/`handoff.md` 对它零提及）。

**（3）与另两处的三方不一致**（`08-synthesis.md` P10 明确列出）：
映射表 ↔ `§1 能力矩阵` ↔ `interview-bank.md:87-97`。

### 具体改法

**决策：这张表**不适合**「全派生」，采用「派生 + 人工审核」的混合，并明确它**不**承担「所有目录的清单」职责。**

理由（可验证）：表的第一列是 **`harness-demo` … `pi` 这类异构实体**（有目录、有生产系统、有第三方工具），
中间列「证明的能力」是**人的判断**（无法派生）。全派生的唯一可行形态是「扫描顶层目录」→ 会把
`node_modules`/`site`/`viz`/`japan...` 之类全部拉进来，产出一张**更没用的表**。

**改法 A5-a：补齐漏登的 4 个目录（手工，两行改一行加）**
在 `:146-152` 区间内新增/合并：
- 新增一行：``| `mcp-demo/`(投毒 + 四层防御 + 消融) | MCP 供应链安全防御实操 | MCP 与供应链安全 §S4、评测工程化(消融即评测) |``
  （`README.md`/`handoff.md:14` 已有该 demo 的实测描述可照抄，**但引用前必须先读原文**——见「依据不足项 U5」）
- 新增一行：``| `framework-demo/`(Claude Agent SDK 四能力 + 10 条 `ok()` 断言) | 框架源码级实操 | 框架生态 §S3 |``
  （**注意**：`knowledge-map.md` 口径块与 `08-synthesis.md` 备列都提到「11/11 混口径已按 U-24 废弃」，
  写这一行时必须用 **10 条断言**，不得写 11/11 → 改前必须读 `framework-demo/README.md` 原文，见依据不足项 U5）
- 新增一行（**capstone 主线**）：``| `my-agent/`(M0–M4 增量主线，121 个 TS 文件) | 毕业项目：从零增建完整 agent | 全部 17 门的收口（见 capstone.ts 六栏） |``
  —— **但这与 `04-evidence-gaps` / `02-content-layer` 的 capstone 登记项重叠**，见「未决决策点 D4」。
- `api-demo` / `flywheel-demo` / `model-basics-demo`：**建议不单独成行**，而是并入对应课程的行
  （如 `api-demo` 并入 API 与多模型路由的能力证明）。理由：它们体量小、`05-coverage.md` F4 已把它们记为「0 命中」，
  单列会让表从 8 行膨胀到 15 行而信息密度下降 → **D4 未决**。

**改法 A5-b：加「完整性」门禁（派生侧）**
新判据（见 `A7 判据 24`）：断言映射表第一列出现的**目录名集合** ⊇ `WORK_DIRS`（六个具名作品）。
即：`harness-demo / rag-demo / sandbox-demo / mcp-demo / durable-execution-demo / framework-demo` **必须全部出现在映射表里**。
- 这一条**只断言下界**（六个作品必须在），不强求「所有目录都在」——因为表的用途是「能力证明」而不是「目录台账」。
- 它恰好**抓住 `mcp-demo` / `framework-demo` 这两个漏登**（本项的核心问题），且语句可机器判定。
- **反例自检**：若将来新增第 7 个具名作品而忘了登记 → 门禁红（正确行为）。

**改法 A5-c：与 `interview-bank.md:87-97` 的三方一致性**
`08-synthesis.md` P10 说三方不一致，但**本轮未通读** `interview-bank.md:87-97` 与
`knowledge-map.md §1 能力矩阵`（在 `knowledge-map.md` 前半，本设计未展开）→
**不在 A5 里预设改法**，只登记为「依赖 `04-evidence-gaps` 与 `02-content-layer` 的交叉项」 → 依据不足项 U6。

### 派生还是手工
**手工补登 + 派生门禁**。第一列与第二列是人写的；「六个具名作品必须都在」是机器断言的。

### 验收命令（可重跑）

```bash
# 1) 映射表行数（改后）
$ awk 'NR>=146&&NR<=160 && /^\| `/' notes/knowledge-map.md | wc -l    # 期望 ≥10（原 8 + mcp-demo + framework-demo）
# 2) 六个具名作品全部出现在映射表
$ for d in harness-demo rag-demo sandbox-demo mcp-demo durable-execution-demo framework-demo; do
    grep -q "$d" notes/knowledge-map.md && echo "✅ $d" || echo "✖ 漏登 $d"; done
#   （等价门禁：A7 判据 24）
# 3) 门禁全绿
$ node site/tools/check-counters.mjs; echo "EXIT=$?"                   # 期望 EXIT=0
```
**必须留浏览器目检**：`/map` 页该表的**表格渲染宽度**（`:146` 的那一行能力描述极长，`harness-demo` 行含
「13 源文件 = 9 运行时 + 3 OTel …」整段括号）——新增行会更长，需目检是否溢出/横向滚动。

### 回滚点
单文件文本改动（`notes/knowledge-map.md:146-152`）。**但**若已加 `A7 判据 24`，回滚必须同时回滚判据（否则门禁红）。

### 依赖（前置项 id）
- **A4**（`WORK_DIRS` 七件套是判据 24 的期望值来源）。
- 与 **`02-content-layer` 的 capstone / details 登记项**有重叠 → D4。

### 工作量
**S**。理由：2–4 行文本 + 1 条门禁判据。**主要成本是「引用数字前必须回原文核对」**（U5）。

### 风险
1. **照抄 `handoff.md` 的数字会引入失真**：`handoff.md:14` 与 `:199` 的数字与口径块**不一致**（那正是 P10 的问题）。
   实施者若从 `handoff.md` 抄 `mcp-demo` 的描述，会把失真带进唯一索引 → **必须回 `mcp-demo/README.md` 原文**。
2. **表膨胀**：把 7 个小 demo 全列进去会让表从 8 行到 15 行，与「这是能力证明索引」的定位冲突 → D4。
3. **漏登的「已存在」与「不该存在」难区分**：`final-project`（`05-coverage.md` F5：7 个文件、零提及）
   到底算不算「资产」**无判据**→ 不能靠门禁判，只能人定 → 依据不足项 U7。

---

## A6｜门禁扩展（一）：现状逐条清单 + 站点手写副本 + 反向断言

### id
`A6-gate-extension`

### 目标
把 `08-synthesis.md` P10 的根因（「站点文案与根 README 里手写的数字副本不在门禁内」）**机制性**修掉：
门禁不只校验「口径块 vs 实数」，还要校验「**站点/README/handoff 的每一处数字副本**」，
并对「白名单外的数字字面量」做**反向断言**（新出现的副本必须显式登记，否则红）。

### 现状证据（本轮亲自跑 + 亲自读源码）

**（1）基线**：`node site/tools/check-counters.mjs` → 输出末行
「`✅ 口径全部一致（判据 12 条 + 副本 7 处）`」，`EXIT=0`（本轮实跑，见 §0）。

**（2）当前 12 条判据逐条清单**（源码 `site/tools/check-counters.mjs:286-328`，输出名取自实跑）

| # | 判据名 | 源码行 | 声明值来源 | 重算值来源 |
|---|---|---|---|---|
| 1 | 知识域 | `:286` | 口径块 `知识域 (\d+)` | `courses.ts` COURSES 条目 filter + Set 去重（`:140-142`） |
| 2 | 课程页 /c/<slug>/ | `:287` | 口径块 `课程页 (\d+)` | COURSES 排除白板卡（`:136`） |
| 3 | 课程卡 | `:288` | 口径块 `课程卡 (\d+)` | COURSES 条目数（`:134`） |
| 4 | 课内嵌题 | `:289` | 口径块 `课内嵌 \*\*(\d+)\*\*` | 13 课题库 + agent-harness + rag S1 + model-basics S7（`:153-211`） |
| 5 | 面试题库精选 | `:290` | 口径块 `面试题库精选 \*\*(\d+)\*\*` | interview-bank §3+§4+§8（`:213-227`） |
| 6 | notes 顶层 md 数 | `:291` | 口径块 `notes 顶层 (\d+)` | `fs.readdirSync(notes/*.md)`（`:117`） |
| 7 | EXCLUDED_FROM_COURSE_ROUTE 条数 | `:292` | 口径块算式右端项数 | `courses.ts` Set 元素数（`:144-150`） |
| 8 | 站点 html（三桶并集） | `:293-300` | 口径块 `站点 html (\d+)` | 静态页 + 课程页 + 专题页三桶（`:233-271`） |
| 9 | 站点 html 三桶互斥 | `:301-308` | 恒 `true` | 重叠成员判定（`:265-271`） |
| 10 | 站点 html 动态页全部已分类 | `:309-316` | 恒 `true` | `KNOWN_DYNAMIC = ['c/[slug].astro','details/[slug].astro']`（`:248-249`） |
| 11 | 口算式自洽：顶层 − 排除 = 课程页 | `:317-322` | `dec.coursePages` | `act.notesTop − act.excluded`（`:320`） |
| 12 | 排除项名称：口径块 ↔ 代码集合 | `:323-328` | 恒 `true` | 两串逐字比较（`:274-277`） |

**（3）当前 7 处副本交叉核对逐条清单**（源码 `:331-351`；机制 = `grepNum(file, regex)` 只断言**该正则能匹配**）

| # | 文件 | 源码行 | 断言的正则 | 实测输出标签 |
|---|---|---|---|---|
| C1 | `README.md` | `:343` | `` `${dec.notesTop} 篇课程内容` `` | README.md 声明「19 篇课程内容」 |
| C2 | `README.md` | `:344` | `dist HTML=${dec.siteHtml}\|HTML=${dec.siteHtml}` | README.md 声明 dist HTML=33 |
| C3 | `site/src/data/courses.ts` | `:346` | `` `notes 顶层\s*${dec.notesTop}\s*−` `` | courses.ts 注释声明「notes 顶层 19 −」 |
| C4 | `site/src/data/courses.ts` | `:347` | `` `= ${dec.coursePages}(\D\|$)` `` | courses.ts 注释声明课程页 17 |
| C5 | `site/src/data/courses.ts` | `:348` | `` `= ${dec.cards}(\D\|$)` `` | courses.ts 注释声明课程卡 18 |
| C6 | `.github/workflows/verify.yml` | `:350` | `` `-eq ${dec.siteHtml}\b` `` | verify.yml 等值断言 -eq 33 |
| C7 | `.github/workflows/verify.yml` | `:351` | `/nav\/index\.html/` | verify.yml 关键页清单含 nav/index.html |

**（4）门禁的结构性盲区（本项要修的）** —— 逐条列出**站点/README/handoff 的手写副本**（本轮逐处读原文确认）：

| # | file:line | 原文（节选） | 数字 | 是否在门禁内 |
|---|---|---|---|---|
| S1 | `site/src/pages/index.astro:34-35` | `const Q_IN_LESSON = 205;` / `const Q_BANK = 37;` | 205 / 37 | ✖ **不在**（`Q_*` 是源码常量，任何第 4 方都被它绕过） |
| S2 | `site/src/pages/nav.astro:17` | `…五阶段（P0–P4）课程地图：…**17 门课**线性阅读序。` | 17 | ✖ **不在**（`description` prop 字符串） |
| S3 | `site/src/pages/404.astro:37` | `17 个课程页（按域分组的课程卡；白板卡无课程页）。` | 17 | ✖ **不在** |
| S4 | `site/src/layouts/Base.astro:14` | `description = 'learn-agent-harness —— …五阶段课程体系：**17 课** · P0–P4 线性路线 · …'` | 17 | ✖ **不在** |
| S5 | `site/src/pages/learn.astro:199` | `…；**17 个 demo** 不是终点作品…` | 17 | ✖ **不在**（语义也错，见 A4-a） |
| S6 | `site/src/pages/learn.astro:204` | `…**17 个 demo** 是每个 milestone 的参考答案。` | 17 | ✖ **不在** |
| S7 | `site/src/pages/index.astro:112` | `不是读完 **17 个 demo** 就结束…` | 17 | ✖ **不在** |
| S8 | `handoff.md:14` | `…**knowledge-map 升 16 域**…` | 16 | ✖ **不在** |
| S9 | `handoff.md:199` | `…**十六个知识域**知识结构已建成…` | 十六 | ✖ **不在** |
| S10 | `handoff.md:191` | `…六个口径（**15 域/17 页/18 卡/6 作品/205+37 题**）…唯一参照` | 15/17/18/6/205/37 | ✖ **不在**（**六个数字挤在一行，是最该锁的一处**） |
| S11 | `site/src/pages/learn.astro:272-273` | `P0×{STAGE_COUNTS.P0} / …（合计 {COURSE_STRUCTURE.length} 门…）` | 派生 | ✅ **已是派生**（不需要新判据） |
| S12 | `site/src/pages/404.astro:42` | `6 个可运行 demo 与实测记录` | 6 | ✖ **不在** |
| S13 | `README.md:9` | `6 个可运行 demo（npm run demo 一键复现…）` | 6 | ✖ **不在**（措辞也不实，见 A4-d） |

**（5）另有 5 处「数字字面量但**不是**口径副本」**（反向断言必须白名单掉的，否则门禁会天天红）：

| file:line | 数字 | 为什么不是口径副本 |
|---|---|---|
| `site/src/pages/404.astro:3/:5-7/:19/:23` | 404、32、31 | HTTP 状态码 + **历史链叙述**（`32 才第一次真正成立`），删了会丢证据 |
| `site/src/pages/interview.astro:4/:40/:47/:59-60/:65/:76/:110-111/:119/:136-137/:165-166/:179` | 15/30/25/10/503/12/120 | **时间分/分钟/评分档**（面试流程参数），与口径无关 |
| `site/src/pages/works.astro:160/:170/:173/:198/:202/:413` | 768/10/10/~180/20/10 | **技术参数**（向量维度/耗时/token 数） |
| `site/src/components/SiteSearch.astro:18-20/:29-31/:92` | 24/11/7/16.5/21/18 | **SVG 坐标与 pagefind 参数** |
| `site/src/pages/index.astro:157/:196` | 426/180 | 性能数字（`→426`、`:180`），属实测值，非口径 |

**关键结论**：**不能**用「扫描全部数字」做反向断言（会在 5 类非口径数字上炸掉），
必须用「**业务量词邻近的数学数字**」+ 白名单。

### 具体改法

**改法 A6-a：站点手写副本改为「引用常量」或「登记进判据」**

**原则（本设计定的分工）**：能派生的**优先派生**（源码插值，门禁自然不用管）；不能派生的**登记成副本判据**。

| # | 改法（推荐） | 类型 |
|---|---|---|
| S1 `index.astro:34-35` | `Q_IN_LESSON = 205` / `Q_BANK = 37` 两个源码常量**保留**，但改为从 `notes/` 派生：课程内嵌题 = 「13 课 `## 练习题库` 表格行 + agent-harness §13 + rag S1 + model-basics S7」——**与 `check-counters.mjs:153-211` 完全同一算法** → 抽成 `site/src/utils/counters.ts` 共享（门禁脚本 import 它？**不行**：门禁是 `.mjs` 纯 node、不 import TS）。**因此**：要么复制算法（新增第二份算法，**违背纪律第 5 条**），要么**保留常量 + 登记为副本判据**。**选后者**（新增判据 25/26：`index.astro` 声明 205/37 == 口径块）。 | 登记副本 |
| S2 `nav.astro:17` | `17 门课` → 改成 `{COURSE_STRUCTURE.length} 门课`（`nav.astro:8` 已 import `COURSE_STRUCTURE`） | **派生** |
| S3 `404.astro:37` | `17 个课程页` → `{COURSE_COUNT} 个课程页`（需新增 import `site/src/data/courses`；**注意** `404.astro:9-10` 注释明写「不 import `site/src/data`（out of scope）」——**这条约束需由 captain 裁定是否放开**，见 D5） | 派生（待裁定） |
| S4 `Base.astro:14` | 默认 `description` 里的 `17 课` → 用 `import { COURSE_COUNT }` 拼串（同一 D5） | 派生（待裁定） |
| S5–S7 「17 个 demo」 | 按 **A4-a** 改为 `{COURSE_COUNT} 门课的参考样本` → 归入 A4 | **派生** |
| S8 `handoff.md:14` 「16 域」 | **就地划改**为 15 域（`handoff.md:191` 自己写的是 15 域，`README.md:38` 也是 15） | 手工 |
| S9 `handoff.md:199` 「十六个知识域」 | 同上 → 「十五个知识域」 | 手工 |
| S10 `handoff.md:191` | 六个数字**保留**（它是「唯一参照的声明句」），但**登记为副本判据**（判据 27：该行的 15/17/18/6/205/37 六个数逐个 == 口径块） | 登记副本 |
| S12 `404.astro:42` 「6 个可运行 demo」 | → `{WORK_COUNT} 个可运行 demo`（同 D5） | 派生（待裁定） |
| S13 `README.md:9` | 按 A4-d 改措辞；数字 6 登记为副本判据（判据 28） | 手工 + 登记 |

**改法 A6-b：反向断言「白名单外不得出现业务量词数字字面量」的实现**

**语义定版（这是本设计最关键的一条，必须逐字实现）**：反向断言**不扫全部数字**，只扫满足
「**数学数字 + 紧邻业务量词**」模式的字面量，位置为 `site/src/**/*.astro`、`site/src/**/*.ts`、`README.md`、`handoff.md`。

- **扫描对象**：两类文件
  - **源码字面量**：`.astro`/`.ts` 里**不在 `{...}` 插值内**的阿拉伯数字，且其后 0–2 字符内出现业务量词
    集 `课|门|个|页|卡|域|题|作品|demo`。
  - **渲染产物**（更强、但需 `site/dist`）：`site/dist/**/*.html` 的**文本节点**里匹配 `(\d+)\s*(课|门|个|页|卡|域|题|作品|demo)`
    的片段。**源码扫描是必须的**（不依赖构建）；**产物扫描是可选加强**（当前 `site/dist` 是残骸，见 U4）。
- **白名单机制（不是「一个文件白名单」，而是「精确行+精确值」白名单）**：
  `site/tools/numeric-claims.allowlist.json`（新增），格式：
  ```json
  {
    "//": "口径数字副本白名单。每一项必须写明口径来源；新增项必须给出 reason。删除失效项会由判据 30 报出。",
    "entries": [
      { "file": "site/src/pages/nav.astro",      "line": 17, "value": 17,  "claim": "courseCards", "reason": "description 文本；已由判据 25 锁定" },
      { "file": "site/src/pages/index.astro",    "line": 34, "value": 205, "claim": "exercises",   "reason": "源码常量 Q_IN_LESSON；已由判据 25 锁定" },
      { "file": "site/src/pages/index.astro",    "line": 35, "value": 37,  "claim": "interviews",  "reason": "源码常量 Q_BANK；已由判据 26 锁定" },
      { "file": "handoff.md",                    "line": 191, "value": 15, "claim": "domains",     "reason": "唯一参照声明句；判据 27 逐个锁定" },
      { "file": "site/src/pages/404.astro",      "line": 3,  "value": 404, "claim": "httpStatus",  "reason": "HTTP 状态码，非口径" },
      { "file": "site/src/pages/works.astro",    "line": 160, "value": 768, "claim": "techParam",  "reason": "向量维度，非口径" }
    ]
  }
  ```
- **判定规则**（伪码，可照抄实现）：
  ```js
  const QUANT = /(\d+)\s*(课|门|个|页|卡|域|题|作品|demo)/g;
  const SKIP_LINE = /口径|历史|原写|曾|已废|废弃|不得|禁止|旧值|旧口径|来源|出处/;  // 叙述性/历史性数字所在行
  const found = [];
  for (const f of [...astroTs, ...mdFiles]) {
    read(f).split('\n').forEach((line, i) => {
      if (SKIP_LINE.test(line)) return;                 // 历史链/口径声明行整行豁免（但要登记原因）
      const inInterp = /\{[^}]*\}/.test(line);          // 含插值的行跳过扫描（值已派生）
      if (inInterp) return;
      for (const m of line.matchAll(QUANT)) found.push({ file: f, line: i + 1, value: Number(m[1]) });
    });
  }
  const allow = new Set(allowlist.entries.map(e => `${e.file}:${e.line}:${e.value}`));
  const offenders = found.filter(x => !allow.has(`${x.file}:${x.line}:${x.value}`));
  const stale     = [...allow].filter(k => !found.some(x => `${x.file}:${x.line}:${x.value}` === k));
  ```
  - **判据 29**：`offenders.length === 0`（没有未登记的业务量词数字）
  - **判据 30**：`stale.length === 0`（白名单里没有已失效项 —— 这一条同样重要：
    否则白名单会越长越烂，最终变成「全豁免」而失去意义）
- **为什么 `SKIP_LINE` 的豁免要在白名单里可审计**：整行豁免等于把豁免权交给一条正则。
  缓解：把 `SKIP_LINE` 命中的行**打印出来**（不判失败），让人每次 CI 都能看到「这次豁免了哪些行」。
  **这是本项唯一无法完全机器化的部分**，必须在实施时保留打印。

### 派生还是手工
**门禁扩展（纯新增）**。站点侧：S2/S5/S6/S7 改派生，S1/S10/S13 登记副本，S8/S9 手工划改，S3/S4/S12 待 D5 裁定。

### 验收命令（可重跑）

```bash
# 1) 门禁判据数从 12 → 30+（含 A7 新增），且 exit 0
$ node site/tools/check-counters.mjs; echo "EXIT=$?"                  # 期望末行「判据 N 条 + 副本 M 处」且 N≥28、EXIT=0
# 2) 反向断言具备证伪能力：故意插一个字面量必须红
$ cp site/src/pages/404.astro /tmp/404.bak
$ sed -i '42s/6 个可运行 demo/7 个可运行 demo/' site/src/pages/404.astro
$ node site/tools/check-counters.mjs; echo "EXIT=$?"                  # 期望 EXIT=1 且报「未登记业务量词数字」
$ cp /tmp/404.bak site/src/pages/404.astro
# 3) 白名单失效项检测：删掉一条 allowlist 项指向的行，门禁应报 stale
$ node site/tools/check-counters.mjs; echo "EXIT=$?"                  # （改完白名单后重跑）
# 4) handoff 域数副本已修
$ grep -n '16 域\|十六个知识域' handoff.md                             # 期望 0 行
```
**必须留浏览器目检**：`/404`（含 `{COURSE_COUNT}` 插值后是否仍通顺）、`/nav/` 的 `<meta description>`（S2 插值后长度是否超过 160 字符）、
首页 `<meta description>`（`Base.astro:14` 是默认值，改后长度变化会影响搜索结果摘要）——**这三处机器验不了**。

### 回滚点
新增文件（`numeric-claims.allowlist.json`）+ 门禁新增段 → `git revert` 单提交。
**站点侧的 S3/S4/S12 若引入 `import site/src/data`**，回滚要同时还原 import（否则 `astro check` 会报未使用 import）。

### 依赖（前置项 id）
- **A1/A4**（口径块与派生常量的最终值）。**A6 必须在 A1–A5 之后落地**，否则白名单要录两次。

### 工作量
**L**。理由：反向断言要同时处理「拉丁数字 vs 中文数字（S9 是「十六」）」「插值行 vs 字面量行」
「叙述行豁免」「白名单失效检测」四类边界；白名单初始化要逐处（13 处业务副本 + 5 类非口径）判定。
**这是本项最大的单点风险，也是最容易做成「形式主义门禁」的地方。**

### 风险
1. **做成「全豁免门禁」**：若白名单把所有命中项都收进去且不做判据 30（stale 检测），
   门禁就永远绿——**比不做更糟**（给人虚假安全感）。判据 30 是**强制项**，不是可选优化。
2. **误报率**：`interview.astro` 有 11 处数字（时间分/评分档），若量词集包含「分」就会全炸 →
   **量词集必须精确**，本设计不含「分」「分钟」。实施时新增量词需评估误报。
3. **中文数字漏检**：`十六个知识域`（`handoff.md:199`）不匹配 `\d+` → 反向断言**抓不到它**。
   必须**额外**加一条针对中文数字的窄规则（`[一二三四五六七八九十百]+(个|门|课|域|页|卡|题)`），
   或在判据里显式登记该行。**本设计选择「额外窄规则 + 打印」**，因为 S9 正是 P10 的活证据。
4. **`SKIP_LINE` 正则过宽**：`口径` 二字出现在很多行（口径块本身），整行豁免会让 `handoff.md:191` 那条
   「六个口径（15 域/17 页/…）」正好落在豁免区。**处置**：判据 27 独立锁定 `handoff.md:191` 的六个数，
   **不依赖**反向断言覆盖它。

---

## A7｜门禁扩展（二）：扩展后的判据清单、实现落点与失败信息文案

### id
`A7-gate-criteria-expanded`

### 目标
给出**可直接实施**的扩展判据清单：每条判据的名称、实现落点（源码行区间）、声明/重算来源、
失败信息文案。**判据总数从 12 → 30**（判据 13–30 为本设计新增；其中 17/18 由 A2、21/24 由 A4/A5 提出，
本项统一编号并补齐实现细节）。

### 现状证据
见 A6 的 (2)(3)(4)：现行 **12 条判据**（`check-counters.mjs:286-328`）+ **7 处副本**（`:331-351`，机制为 `grepNum`），
输出末行格式为 `` `（判据 ${results.length} 条 + 副本 ${copies.length} 处）` ``（`:373`）。

### 扩展后的判据清单（判据 13–30）

**统一约定**：所有新判据复用现有 `check(name, declared, actual, note)`（`:62-65`）与 `copies[]` 机制；
新增的**结构性断言**沿用 `check(name, true, boolExpr, note)` 形式（如现行判据 9/10/12）。
**所有新判据必须满足「证伪能力」要求**：声明值与重算值必须来自**独立来源**（沿用 `:18-19` 的设计约束）。

| # | 判据名 | 实现落点（新增/改动） | 声明值来源 | 重算值来源 | 失败时的文案（可直接用） |
|---|---|---|---|---|---|
| 13 | 课程结构覆盖全部课程页 | 新增：解析 `course-structure.ts` 的 slug 集合，与 `act.courseSlugs`（`:138`）比较 | `COURSE_STRUCTURE` 的 17 个 slug | `courses.ts` COURSES 排除白板卡（`:138`） | `✖ 课程结构未覆盖全部课程页：缺 [${missing}]（courses.ts 有、course-structure.ts 无）／多 [${extra}]（/c/ 有卡但结构表无 → 课程页 "学习路径" 模块会优雅降级，读者看不到前置与上下篇）` |
| 14 | 课程总表「阶段」列 == `stage` | 新增：读 `knowledge-map.md:55-68`，逐行把「主题」映射到 slug 后取 `stage` 比对 | 表内单元格 | `course-structure.ts` 的 `stage` | `✖ 课程总表阶段列与单一真源不符：\n  ${domain}：表内 ${cell} vs course-structure.ts:${line} ${stage}\n  ↳ 口径块与课程总表的阶段列是只读副本，改 stage 后必须同步本表（不要反向改）` |
| 15 | `HORIZONTAL_SLUGS` == `isHorizontal` 集合 | 新增（仅 A1-c 步骤 1 落地后需要） | 无（纯断言） | `courses.ts` 的 Set vs `course-structure.ts` `isHorizontal: true` 的 slug | `✖ 横向资产集合漂移：courses.ts HORIZONTAL_SLUGS=[${a}] vs course-structure.ts isHorizontal=[${b}]\n  ↳ 两处必须逐元素相同；倾向删掉 courses.ts 那份、直接在 courses.ts 读 isHorizontal` |
| 16 | 门禁解析锚点自检：COURSES 条目数 == 18 | 改 `:127` 的行内正则（A1-c 步骤 3 必须同步）| 无（纯断言） | 解析到的条目数 | `✖ courses.ts 解析到 ${n} 条卡片，期望 18\n  ↳ 解析锚点（slug/domain/phase 字段顺序）已失效；manifest 变了要同步 site/tools/check-counters.mjs:127` |
| 17 | 依赖图与 prereqs 一致 | 新增（A2 的生成器 + 本门禁双重）| `knowledge-map.md` 的 `BEGIN/END:dep-graph` 区间文本 | `course-structure.ts` 的 `prereqs` 渲染结果 | `✖ 依赖图与 prereqs 不一致（${n} 条边差异）：\n  图中多出：${extraEdges}\n  图中缺失：${missingEdges}\n  ↳ 图是派生副本。跑 node site/tools/gen-dep-graph.mjs --write 重生成；若你认为图对、prereqs 错，请改 course-structure.ts` |
| 18 | 面试汇聚列表的课程集合正确 | 新增（A2 提到的独立文字列表）| 无（纯断言） | 该列表里的课程名集合 vs `COURSE_STRUCTURE` 中「`next` 为空或 `stage ∈ {P2,P3,P4}`」的集合 | `✖ 面试前置覆盖列表与课程结构不符：\n  列表多出：${extra}\n  列表缺失：${missing}\n  ↳ 该列表替代了原图里 11 条指向 INTERVIEW 的虚线边；它必须覆盖所有已收口课程` |
| 19 | 选题优先级段不得含箭头链 | 新增（A3-b）| 无（纯断言） | `knowledge-map.md:128-133` 区间的 `→` 计数 | `✖ 选题优先级段出现箭头链（命中 ${n} 处）：${lines}\n  ↳ 箭头链会被读成阅读顺序；阅读序唯一真源是 course-structure.ts 数组序（/learn/ 的 #1→#N）。要表达依赖请用 prereqs` |
| 20 | 站点源码不得出现阅读序字面量 | 新增（A3-a）| 无（纯断言） | `site/src/**` 里 `#1→#17` / `#17` 等模式 | `✖ ${file}:${line} 出现阅读序字面量「${match}」\n  ↳ 改为 {COURSE_STRUCTURE.length} 插值；数字字面量会在课程增删时静默失真` |
| 21 | 具名作品目录全部存在且有 package.json | 新增（A4-b）| `WORK_DIRS`（`courses.ts`）| `fs.existsSync(dir/package.json)` | `✖ 具名作品目录缺失或不可运行：${dirs}\n  ↳ WORK_DIRS 是作品口径的具名清单（knowledge-map 口径块「可运行 demo 作品 6」条）。改名/删除目录必须同步该清单与口径块` |
| 22 | 三个课程计数互锁 | 新增（A4-c 退路）| 无（纯断言）| `courses.ts` COURSE_COUNT / `course-structure.ts` COURSE_COUNT / `CARD_COUNT − 1` | `✖ 课程计数不一致：courses.ts COURSE_COUNT=${a}、course-structure.ts COURSE_COUNT=${b}、CARD_COUNT−1=${c}\n  ↳ 三处必须相等；若确实要改课程数，先改 course-structure.ts 数组，其余跟随` |
| 23 | 有 demo 脚本的目录数（事实核对，不设口径）| 新增（A4-e）| **不得硬编码**；与口径块无关 | 扫描 `*/package.json` 的 `scripts.demo` 精确键 | `✖ 有 npm run demo 的目录数变为 ${n}（上次 ${prev}）\n  ↳ 这不是口径，只是事实快照：目录增删都会让它变。若无误，请更新本判据的基准值（site/tools/demo-count.baseline）；注意「有 demo 脚本」≠「具名作品 ${WORK_COUNT}」` |
| 24 | 六个具名作品全部登记在映射表 | 新增（A5-b）| 无（纯断言）| 映射表第一列出现的目录名 ⊇ `WORK_DIRS` | `✖ 资产↔课程映射表漏登具名作品：${missing}\n  ↳ 该表是「某能力有没有实操证据」的唯一索引；新增作品目录必须登记（knowledge-map.md「资产 ↔ 课程映射」节）` |
| 25 | `index.astro` 题目常量 == 口径块 | 新增副本（A6-a S1）| 口径块「课内嵌 205」| `site/src/pages/index.astro:34` 的 `Q_IN_LESSON` | `✖ index.astro Q_IN_LESSON=${a} ≠ 口径块课内嵌题 ${b}\n  ↳ 该常量是口径块的源码副本；改口径须同步 site/src/pages/index.astro:34` |
| 26 | `index.astro` 面试常量 == 口径块 | 新增副本（A6-a S1）| 口径块「面试题库精选 37」| `site/src/pages/index.astro:35` 的 `Q_BANK` | `✖ index.astro Q_BANK=${a} ≠ 口径块面试题库精选 ${b}\n  ↳ 见 site/src/pages/index.astro:35` |
| 27 | `handoff.md` 唯一参照句六数逐个相符 | 新增副本（A6-a S10）| 口径块六项 | `handoff.md:191` 该行的 15/17/18/6/205/37 | `✖ handoff.md:191 的「唯一参照」句与口径块不符：\n  ${label}：写 ${declared} vs 口径块 ${actual}\n  ↳ 这句话自称唯一参照，数字错会误导所有接手者；就地划改，不要追加更正行` |
| 28 | `README.md` 作品数 == `WORK_COUNT` | 新增副本（A6-a S13）| `WORK_COUNT` | `README.md:9` 的「6 个（具名）作品」 | `✖ README.md 作品数与 WORK_COUNT=${n} 不符\n  ↳ 作品口径见 courses.ts WORK_DIRS 与 knowledge-map 计数口径块` |
| 29 | 无未登记的业务量词数字字面量 | 新增（A6-b 反向断言）| `numeric-claims.allowlist.json` | 扫描 `site/src/**` + `README.md` + `handoff.md` | `✖ ${n} 处未登记的业务量词数字：\n  ${file}:${line} 「${text}」\n  ↳ 三种处置：①改为 {常量} 插值（最优）②确认它与口径无关，加入 allowlist 并写明 reason ③它确实错了，就地划改\n  ↳ 白名单文件：site/tools/numeric-claims.allowlist.json（新增项必须写 reason）` |
| 30 | 白名单无失效项 | 新增（A6-b 反向断言）| 无（纯断言）| allowlist 每项是否仍在扫描结果中出现 | `✖ numeric-claims.allowlist.json 有 ${n} 项已失效（指向的行已无该数字）：${items}\n  ↳ 失效项会让白名单逐轮膨胀成「全豁免」。请删除它们，或恢复被误删的插值` |

**判据总数**：现有 12 + 新增 18 = **30**。
**副本总数**：现有 7 + 新增 6（判据 25/26/27/28 各 1–2 条 `grepNum`，加 A2 的 depot-graph 区间比对走 `check` 而非 `copies`）
→ **约 13 处**（实施时以实跑末行「判据 N 条 + 副本 M 处」为准）。

**输出格式的两处必改**（否则新判据的 note 会挤成一团）：
- `:356` 的表头列宽固定 `padEnd(26)`：新判据名最长 `无未登记的业务量词数字字面量`（14 全角字符 ≈ 28 列）→ **改为 `padEnd(30)`** 或按 max(name.length) 动态。
- `:376-377` 的「修法」提示目前只列 `README.md / courses.ts 注释 / verify.yml` 三个文件 → **必须扩充**
  为「口径块 + 站点副本（`index.astro:34-35`、`nav.astro:17`、`404.astro:37/:42`、`Base.astro:14`、`learn.astro:199/:204`、`index.astro:112`）
  + `README.md:9` + `handoff.md:14/:191/:199` + 白名单文件」。

### 派生还是手工
**门禁扩展（新增脚本段 + 一个新 JSON 白名单 + 一个新 CSS 无关的生成器）**。站点副本的**修**是手工/派生（见 A6-a 表）。

### 验收命令（可重跑）

```bash
# 1) 判据数达标且全绿
$ node site/tools/check-counters.mjs | tail -3        # 期望含「判据 30 条 + 副本 13 处」与「✅ 口径全部一致」
$ node site/tools/check-counters.mjs >/dev/null; echo "EXIT=$?"    # 期望 EXIT=0
# 2) 每条新判据的证伪能力：制造 3 类故障各跑一次
$ python3 - <<'PY'
import re,pathlib
p=pathlib.Path('notes/knowledge-map.md'); t=p.read_text()
# 故障 A：阶段列改错一格（判据 14 应红）
p.write_text(t.replace('| 沙箱与凭据·可复现 | P1 |','| 沙箱与凭据·可复现 | P0 |',1)); PY
$ node site/tools/check-counters.mjs >/dev/null; echo "A EXIT=$?"   # 期望 1
$ git checkout -- notes/knowledge-map.md
# 故障 B：删掉 WORK_DIRS 一项（判据 21 应红）—— 见 A4-b 实施后
# 故障 C：插一个未登记字面量（判据 29 应红）—— 见 A6 验收命令 2)
# 3) 副本区间比对不漏：把口径块「知识域 15」改成 14 而不改 course-structure（判据 1 应红）
$ sed -i 's/知识域 15/知识域 14/' notes/knowledge-map.md
$ node site/tools/check-counters.mjs >/dev/null; echo "B EXIT=$?"   # 期望 1
$ git checkout -- notes/knowledge-map.md
```
**必须留浏览器目检**：门禁**不检查渲染**。「口径数字在页面上显示是否正确」只能靠：
①`/learn/` 口径说明段（`learn.astro:272-284`，已是插值，风险低）
②`/works/` 的 `{WORK_COUNT} 个可运行作品一览`
③`/` 首页三个 `stat-num`（`index.astro:257/:261/:265`，分别是 `COURSE_COUNT`/`DOMAIN_COUNT`/`WORK_COUNT`）。
**这三处必须留浏览器目检**，不得用「门禁全绿」冒充页面正确。

### 回滚点
新增判据集中在 `check-counters.mjs` 尾部一段 + 一个白名单 JSON + 一个生成器 `.mjs`。
**回滚粒度问题**：若只回滚部分判据（如回滚 29/30 而留 13–28），白名单文件会变成**没人读的死文件** →
**建议**：判据 13–30 分 3 个提交落地（①13–16 口径互锁 ②17–24 派生与映射 ③25–30 副本与反向断言），
每个提交可独立回滚。`verify.yml` 的 CI 步骤**不需要改**（它已调用 `check-counters.mjs`，判据增减自动生效）；
但**必须核实** `verify.yml` 是否在任何地方硬编码「判据 12 条」这类期望值 → 见依据不足项 U8。

### 依赖（前置项 id）
- **A1–A6 全部**（判据 13–30 的期望值来自它们）。
- **形式组 0**（构建环境）：判据 29 的「渲染产物扫描」增强版需要 `site/dist`（当前残骸，U4）。

### 工作量
**L**。理由：18 条新判据里，13/14/15/17/18 需要**新的源码解析器**（`course-structure.ts` 的 `slug/stage/prereqs/isHorizontal`），
且解析不能 `import` TS（沿用 `:120` 的策略）；29/30 需要白名单机制与中文数字窄规则。
**建议的实施顺序**：先做 13–16（低风险、立刻锁住 A1 的成果），再做 21/24（纯文件系统，最简单），
最后做 17/18/29/30（最复杂、最需要证伪自检）。

### 风险
1. **判据 14 的「主题 → slug」映射是新的手写映射表**：`knowledge-map.md:55-68` 的第一列是中文主题名，
   而 `course-structure.ts` 的 `domain` 字段是**另一套中文名**。**本轮实测（亲自 grep 两边）**：
   - `courses.ts` 与 `course-structure.ts` 的 `domain` **17 门逐字相同**（`courses.ts:50-233` vs `course-structure.ts:86-362`）——
     这一对是**干净的**，可放心做逐字比较。
   - 但 `knowledge-map.md:55-68` 的主题列**与之不同名**，实测差异至少 5 组：
     `Agent 系统设计模板`(`:57`) vs `系统设计`、`Agent 可观测`(`:58`) vs `可观测`、`沙箱与凭据·可复现`(`:59`) vs `沙箱与凭据`、
     `MCP 协议 + 供应链安全`(`:63`) vs `MCP 与供应链安全`、`API 实操 + 多模型路由`(`:64`) vs `API 与多模型路由`。
   → **判据 14 不能用名字匹配**。**必须**改成「按**行序**（14 行 = 14 编号课，顺序与 `course-structure.ts` 的
   `isHorizontal === false` 子序列比对）」或「在 `knowledge-map.md` 的表里**新增一个 slug 列**（第 6 列）」。
   **本设计推荐后者**（新增 `slug` 列），因为它把「哪一行是哪门课」这个事实也变成**显式、可校验**的，
   顺带解决「主题名两套并存」在门禁里无法判定归属的问题。**这是本项第 2 高危的操作失误点**（误用名字匹配 → 全线误报）。
2. **判据 30 需要「上次扫描结果」的持久状态**：若实现为「与上一次 CI 的 allowlist 比对」，就需要缓存 →
   复杂化。**简化**：判据 30 只判「allowlist 每项在**本次**扫描结果中仍存在」，无需跨次状态。
   本设计采用**简化版**（无需状态）。
3. **`check-counters.mjs` 单文件膨胀到 ~600 行**：可维护性下降。
   **建议**：把新增解析器抽到 `site/tools/lib/parse-data.mjs` 并被门禁 import（`.mjs` 之间可正常 import，
   不违反「不 import TS」约束）。**这是本项推荐的实现结构**，但会新增一个文件 → 需在 D6 确认。
4. **30 条判据会让 CI 变慢**：**本轮实测现行脚本耗时 = 0.09s**（`/usr/bin/time -f "elapsed=%es" node site/tools/check-counters.mjs`）。
   新增 18 条含 4 类文件扫描，预计仍在秒级（均为同步 readFile），但**必须在实施后实测耗时并记录**，
   否则「门禁比构建还慢」会被绕过（有人在 `verify.yml:75-76` 里注释掉）。
   **现状核实**：`verify.yml:75-76` 只有 `name: Counter consistency gate (口径门禁)` + `run: node site/tools/check-counters.mjs`，
   **没有**硬编码「判据 12 条」这类期望值 → **判据增减无需改 `verify.yml`**（U8 已就地核实完毕，不再是缺口）。

---

## 批次 A 级验收门禁（可重跑 + 期望输出）

批次 A 全部落地后，**一次性**跑完：

```bash
# ── 1. 门禁（必须绿，且判据数达标）
$ node site/tools/check-counters.mjs; echo "EXIT=$?"
  期望：末段「✅ 口径全部一致（判据 30 条 + 副本 13 处）」；EXIT=0
# ── 2. 字形清除（A1）
$ sed -n '55,68p' notes/knowledge-map.md | grep -cE '\|\s*P[0-2]\s*\|'      # 期望 0
$ grep -rn '\.phase\b' --include=*.ts --include=*.astro site/src/ | grep -v phase-head   # 期望 0
# ── 3. 依赖图派生（A2）
$ node site/tools/gen-dep-graph.mjs; echo "EXIT=$?"                          # 期望 EXIT=0
$ sed -n '/BEGIN:dep-graph/,/END:dep-graph/p' notes/knowledge-map.md | grep -c 'HARNESS --> MCP'   # 期望 0
# ── 4. 阅读序（A3）
$ grep -rn '#17' site/src/pages/learn.astro                                   # 期望 0
$ grep -n '开课顺序确认' notes/knowledge-map.md                                # 期望命中行含 [x] 已定案
# ── 5. 计数（A4）
$ grep -rn '17 个 demo\|17 demo' site/src/ README.md handoff.md                # 期望 0
$ grep -c 'WORK_COUNT = 6' site/src/data/courses.ts                            # 期望 0
# ── 6. 映射表（A5）
$ for d in harness-demo rag-demo sandbox-demo mcp-demo durable-execution-demo framework-demo; do
    grep -q "$d" notes/knowledge-map.md || echo "✖ 漏登 $d"; done               # 期望无输出
# ── 7. 反向断言具备证伪能力（A6/A7）
$ cp site/src/pages/404.astro /tmp/404.bak && sed -i '42s/6 个/7 个/' site/src/pages/404.astro
$ node site/tools/check-counters.mjs >/dev/null; echo "EXPECT 1 -> $?"          # 期望 1
$ cp /tmp/404.bak site/src/pages/404.astro
# ── 8. 门禁耗时（防止被绕过）
$ /usr/bin/time -f "elapsed=%es" node site/tools/check-counters.mjs >/dev/null  # 期望 < 2s
# ── 9. 零越界自查
$ git status --porcelain | grep -v '^?? analysis/' | grep -v '^?? notes-restructure'   # 期望：无未预期的 M/A/D
```

**批次 A 的「必须留浏览器目检」清单（不得用门禁绿 / exit 0 冒充）**：
1. `/learn/` 五阶段段头 + 17 张课程卡的档位 chip（A1）
2. `/` 首页三个 `stat-num`（`COURSE_COUNT` / `DOMAIN_COUNT` / `WORK_COUNT`）与三处「17 个 demo」改后的文案（A4/A6）
3. `/c/<slug>/` 课程页 meta 栏第三个 chip（A1-c 删兜底分支后）
4. `/map` 依赖图与映射表（A2/A5）
5. `/nav/` 时间线前的「横向知识」定位句（A1-b）
6. `/404`（A6-a 若采纳插值）
7. 三个 `<meta description>`（`Base.astro:14` / `nav.astro:17` / `home`）长度

---

## 未决决策点（需用户拍板）

> 以下每条**都不替用户决定**。每条给出「选项 / 影响 / 我的倾向与理由」，倾向只作为输入，不是结论。

**D1｜横向两课（`llm-timeline` / `industry-2026`）在 `/learn/` 的阶段归属**
- 选项 (a)：保留 `stage: 'P0'` / `'P4'`，渲染层先按 `isHorizontal` 分桶，另设「横向知识」段。
- 选项 (b)：把 `stage` 改为不可表达（如 `null`），改 `Stage` 类型与 `STAGE_COUNTS`（`course-structure.ts:20/:387`）为可选。
- 选项 (c)：两者都不在 `/learn/` 出现（仅在 `/nav/`）。
- 影响：(b) 会动类型定义与三处 `STAGE_COUNTS` 消费（`nav.astro:103`、`learn.astro:80/:116/:272`、`index.astro:82`），
  风险最高但语义最干净；(a) 零类型改动、但要新增一个渲染分组；(c) 会让 `/learn/` 少内容。
- **倾向 (a)**：`STAGE_COUNTS` 现在算的是 17 门（含横向两课），(a) 不破坏这个语义；且 `isHorizontal` 已是既有真源。
- **但**：`08-synthesis.md` P1 的建议方向写的是「横向两课**移出阶段链**、在 `/learn/` 单列横向知识段」——
  这与 (a) 的「保留 stage 值、渲染层分桶」**并不矛盾**，实施时必须确认二者是同一件事。

**D2｜`km:128` 到底是「备课顺序」还是「选题优先级」**
- 选项 (a)：改成「按目标岗位权重的选题优先级（不构成阅读顺序）」，去箭头链。
- 选项 (b)：保留为「教学方**备课**顺序」并显式标注视角，与读者阅读序并存但**不再同名**。
- 选项 (c)：直接删除 `:128`，只留 `:162` 指向 `/learn/`。
- 影响：(a) 会丢掉一份真实的备课信息（`:128` 的 8 项序列有理由段支撑）；(c) 最简但丢信息。
- **倾向 (b)**：`:129` 的「理由」段（评测工程化是 P1 三课公共地基）与 `prereqs` 自洽，是有价值的内容；
  按 `00-plan-scope.md:72`「不许替用户决定」，此处**必须由用户确认这份信息是否还需要**。

**D3｜依赖图的落法**
- 选项 (a)：预生成 + 受保护区间（本设计推荐，见 A2）。
- 选项 (b)：Astro 构建期替换（改 `astro.config.mjs` 的 remark 管线）。
- 选项 (c)：独立 `DependencyGraph.astro` 组件 + 删掉笔记里的图。
- 影响：(b) 让 GitHub 上的 `knowledge-map.md` 仍显旧图；(c) 让 `/map` 与 GitHub 分开两套渲染路径；
  (a) 需要动笔记的大块文本（约 49 行）且引入 `<!-- BEGIN/END -->` HTML 注释（在 Obsidian 里会显示）。
- **倾向 (a)**，但**「Obsidian 里会看到 HTML 注释」这一点本轮未验证** → 见 U10。

**D4｜映射表是否登记 `my-agent` 与 3 个新 demo 目录**
- 选项 (a)：只补 `mcp-demo` / `framework-demo`（2 行，见 A5-a）；`my-agent` 归 capstone 体系。
- 选项 (b)：补 4 行（加 `my-agent`），3 个小 demo 并入课程行。
- 选项 (c)：全列（+7 行，表到 15 行）。
- 影响：这张表的定位是「能力证明索引」；(c) 会让它退化成目录台账，伤害可读性。
- **倾向 (a)+(b) 的组合**，但**与 `02-content-layer` 的 capstone 登记项重叠** → **需与 `02` 的负责人对齐后再定**，
  否则同一处事实会在两份设计里给出两种改法（本轮已登记该交叉点）。

**D5｜`404.astro` / `Base.astro` 能否 `import site/src/data`**
`404.astro:9-10` 的注释**明确**写着「不引入新依赖、不 import `site/src/data`（out of scope）」。
- 选项 (a)：放开该约束，S3/S4/S12 三处改插值（数字永远正确）。
- 选项 (b)：保持约束，三处数字登记进 `numeric-claims.allowlist.json`（改口径时靠门禁提醒）。
- 影响：(a) 让 404 页在 `data` 层变更时自动跟随，代价是打破一条**已写进代码注释的**约束；
  (b) 数字仍是手写副本，但至少不会再静默。
- **倾向 (a)**，理由是「404 也是读者会看到的页面，数字错同样误导」；
  但**这条约束的原意（避免 404 页因 data 层 fail-fast 而构建失败）我无法从注释完整复原** → **必须有用户判断**。

**D6｜新增解析器是否抽文件**
- 选项 (a)：全部写在 `check-counters.mjs` 内（单文件 ~600 行）。
- 选项 (b)：抽 `site/tools/lib/parse-data.mjs`（`.mjs` 间 import，不违反「不 import TS」）。
- **倾向 (b)**（A2 的生成器与 A7 的判据 13/15/17 需要**同一份** `course-structure.ts` 解析器；
  写两份 = 两份算法，违背「修生成器不修输出」）。
- 影响：(b) 多一个文件；**与 D3 的落法耦合**（若 D3 选 (a)，生成器与门禁必须共享解析器）。

**D7｜`phase` 字段是否真的删（A1-c 步骤 3）**
- 选项 (a)：删（本设计推荐）。选项 (b)：保留但标 `@deprecated`（现状的加强版）。
- 影响：删会让 `check-counters.mjs:127` 的正则必须同轮改（A1 风险 1）；保留则「legacy 字段」永久存在，
  下一位读者仍可能误用。
- **倾向 (a)**：`phase` 的**唯一活语义**（横向标记）已由 `isHorizontal` 承载；留着只会继续吸引误用。

---

## 依据不足项（不许当事实）

> 以下条目**本轮未核实或无法核实**。任何实施者不得把它们当既成事实使用；需要时**先补证据**。
> 每条给出「缺什么 / 怎么补 / 不补的后果」。

**U1｜`notes/process/site-refactor-plan.md` 与 `notes-restructure-plan.md` / `restructure-*.md` 的权威性未定**
- 缺什么：这些文件里有大量与本设计**同名但不同值**的断言（例：`site-refactor-plan.md:474` 说 `phase` 有「3 个消费方」，
  本轮实测是「3 个**读点**、其中 1 个是死分支、1 个是脚本锚点」；`notes-restructure-plan.md:334-335` 说
  `INTERVIEW`/`WORK_COUNT` 的处置「不影响页面」，与 A4 的发现方向不同）。
- 怎么补：读 `notes/process/site-refactor-plan.md` 全文 + `git log --follow` 确认它们是否仍被引用。
- 不补的后果：A1-d 的「就地划改」可能改到一份**已废弃文档**，浪费工时且可能引入新的矛盾表述。

**U2｜`notes/interview-bank.md` 是否引用 `knowledge-map.md:55-68` 的 9 个「优先级」值**
- 缺什么：A1-a 要把 9 门课的优先级列改值；若 `interview-bank.md` 按「P0 优先」组织了章节，会连带失真。
- 怎么补：`grep -n 'P0\|P1\|P2' notes/interview-bank.md` 并读命中段落。
- 不补的后果：改了 `knowledge-map.md` 却让 `interview-bank.md` 变成新的唯一冲突点（P1 的问题换位置重现）。

**U3｜`notes/interview-bank.md §7` 的「开课顺序」原文**
- 缺什么：`knowledge-map.md:162` 自称「[interview-bank §7 并入]」；A3-c 关闭该未结事项前，
  必须知道 `§7` 里是否还留着一份顺序副本。
- 怎么补：`sed -n '/^## *7/,/^## *8/p' notes/interview-bank.md`。
- 不补的后果：A3 只关了 3 份互斥版本中的 2 份，第 4 份（若存在）继续活着。

**U4｜`site/dist` 残骸对 A2/A6/A7 的浏览器验收的阻塞程度**
- 缺什么：`07-verification.md:57` confirmed「`site/dist` = 89 文件 / 0 HTML」；本轮**未重建**（边界禁止）。
  故 A2/A6/A7 的「浏览器目检」与 `viz/mermaid-check.mjs`（需 `site/dist`）**当前都无法执行**。
- 怎么补：形式组 0（构建环境）先落地并产出一份成功的 `site/dist`，再执行目检；
  或改用 `node site/tools/visual-check.mjs`（但它会写 `site/tools/out/`，需先定落盘约定）。
- 不补的后果：本设计里所有「必须留浏览器目检」条目**无法完成**，验收链断在最后一环（这正是 P9 的形态）。

**U5｜`mcp-demo` / `framework-demo` / `api-demo` / `flywheel-demo` / `model-basics-demo` 的**可引用描述**
- 缺什么：A5-a 要往映射表写这 5 个目录的能力描述。本轮**只核实了目录与 `package.json` 的存在与 `demo` 键**，
  **没有读它们的 README**，也没有核实「四层防御」「10 条 `ok()` 断言」这类数字。
- 怎么补：逐目录读 README 原文；**特别注意** `framework-demo` 的「11/11」是**已废弃口径**
  （`knowledge-map.md` 口径块与 `08-synthesis.md` 备列都提到 U-24），不得照抄。
- 不补的后果：把失真数字写进「唯一索引」，比不写更糟。

**U6｜`knowledge-map.md §1 能力矩阵` 与 `interview-bank.md:87-97` 的实际内容**
- 缺什么：`08-synthesis.md` P10 说三方（映射表 / §1 能力矩阵 / interview-bank）不一致，但本轮**未通读**这两处。
- 怎么补：读 `knowledge-map.md §1` 与 `interview-bank.md:87-97` 原文并做集合比对。
- 不补的后果：A5 只补登了映射表，三方不一致可能仍然存在（修了一角）。

**U7｜`final-project/` 是否算「资产」**
- 缺什么：`05-coverage.md` F5 confirmed 它 7 个文件、`README.md`/`handoff.md` 零提及、`git tag m0..m4` 实测 0 个。
  但「该不该进映射表」是**产品判断**，无判据可依。
- 怎么补：由用户裁定（→ D4/D7 同类问题）。
- 不补的后果：A5 的门禁（判据 24）只覆盖 `WORK_DIRS` 六个具名作品，`final-project` 会**继续逃出**所有索引。

**U8｜（已就地核实，保留记录）`verify.yml` 是否硬编码判据数**
- 结论：**不硬编码**。`verify.yml:75-76` 仅 `name: Counter consistency gate (口径门禁)` + `run: node site/tools/check-counters.mjs`。
- 保留原因：这是 A7 原本的**假设性风险**，核实后关闭；记录以免下一位实施者重复调查。

**U9｜`knowledge-map.md:55-68` 的「主题」列与 `domain` 字段的 14 组逐行差异全貌**
- 缺什么：本轮实测发现至少 5 组不同名（`Agent 系统设计模板`/`Agent 可观测`/`沙箱与凭据·可复现`/
  `MCP 协议 + 供应链安全`/`API 实操 + 多模型路由`），**未逐行核对全部 14 组**。
  同时**已核实**：`courses.ts` 与 `course-structure.ts` 的 `domain` **17 门逐字相同**（干净）。
- 怎么补：逐行 diff。
- 不补的后果：A7 判据 14 的「新增 slug 列」方案需要人工填 14 个 slug——填错一格，判据 14 会**长期误报或长期漏报**。

**U10｜`<!-- BEGIN/END:dep-graph -->` HTML 注释在 Obsidian 与站点的显示行为**
- 缺什么：`notes/` 同时是 Obsidian vault（`AGENTS.md` 明文）。HTML 注释在 Obsidian 阅读视图里**是否可见**本轮未验证。
- 怎么补：在本机 Obsidian 或按 Obsidian 文档确认；**不可**用「markdown 渲染器都应该忽略 HTML 注释」推断。
- 不补的后果：若可见，D3 的落法 (a) 会在读者的笔记视图里露出两行机器标记——**可读性回退**。

**U11｜`check-counters.mjs` 新增判据后的实际耗时**
- 缺什么：现行 **0.09s**（本轮实测）。新增 18 条（含 4 类文件扫描）后的耗时**未实测**。
- 怎么补：实施后 `/usr/bin/time -f "elapsed=%es" node site/tools/check-counters.mjs`。
- 不补的后果：若耗时上升到分钟级，CI 里这条门禁会被当成累赘而被绕过 —— **门禁被绕过的第一天起它就等于不存在**。

---

## 附：本文件的边界合规自查

- **零代码改动**：本轮只新建 `analysis/plan/01-source-layer.md`；未修改 `notes/`、`site/`、`README.md`、`handoff.md`
  及 `analysis/content/` 下任何文件。所有 `sed -i` 只出现在**验收命令的伪码**里（带 `cp` 备份与 `git checkout --` 复原），**本轮未执行**。
- **未跑 `astro build`**；未跑任何写盘脚本。跑过的命令只有：`node site/tools/check-counters.mjs`（只读，**已在本轮实跑**）、
  `grep`/`sed`/`awk`/`for`+`node -e`（只读）、`/usr/bin/time`（只读）。
- **未联网**（本轮无需要外部事实的断言；`08-synthesis.md` P8 的时点事实属 C 批次，不在本文件范围）。
- **未把他人自述当证据**：所有 file:line 均为本轮亲自读原文所得；对 `07-verification.md` 的引用是**引其修正值**并标注来源，
  凡本轮未能独立复现的（如 `details` 三页矛盾）**未在本文件作为证据使用**（它属 02 内容层）。
