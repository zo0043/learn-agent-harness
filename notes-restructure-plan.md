# notes/ 结构重组 + 内容失真修正 · 方案基线（R1）

> 角色：requirements 基线（只读分析产出，本文件不修改任何被分析对象）
> 仓库：`/home/ubuntu/app/learn-agent-harness` · 分支工作区 HEAD `ea277ab`
> 证据日志：`/tmp/r1-evidence/R1-evidence.log`（含命令原文与输出，可重跑）
> 口径纪律：本文所有数字均由命令数出，命令随行给出；凡未能独立复算者显式标注「未复算」及原因。

---

## 0. 一句话结论

`notes/` 顶层 39 个 md 中，**39 − 22(EXCLUDED) = 17 恰好成立**，所以「17 个课程路由」这个派生值一直是对的；**失真的是算式左端的被减数与 22 条硬编码本身**。把 20 份设计/过程文档移入 `notes/process/` 后，顶层恰为 19（17 课 + knowledge-map + interview-bank），`courses` 集合的 `pattern:'*.md'` 自然只捞到 19 条，`EXCLUDED_FROM_COURSE_ROUTE` 可从 22 条**收缩到 2 条**，且 `19 − 2 = 17` 三个数字同时在 `knowledge-map.md:13`、`courses.ts:262`、`README.md:34` 三处首次自洽。

附带收益：`viz/mermaid-check.mjs:22` 是同一路由规则的**第二份实现**（只硬编码 2 条排除），当前会探测到 **37 个 slug、其中 20 个幽灵路由**；迁移后自动收敛为 17，与 `courses.ts` 归零差异（见 §2.3-I 实测）。

---

## 1. 现状实测（基线快照）

| # | 事实 | 实测值 | 取证命令 |
|---|---|---|---|
| F1 | `notes/` 顶层 md 数 | **39** | `ls notes/*.md \| wc -l` |
| F2 | `notes/details/` md 数 | **8** | `ls notes/details/*.md \| wc -l` |
| F3 | notes 下 md 合计 | **47** | F1 + F2 |
| F4 | `EXCLUDED_FROM_COURSE_ROUTE` 条目数 | **22** | `node -e "...match(/EXCLUDED_FROM_COURSE_ROUTE = new Set\(\[(.*?)\]\)/s)..."` |
| F5 | 顶层去 EXCLUDED 后余数 | **17** | `ls notes/*.md` 与 F4 集合做差 |
| F6 | `COURSES` 数组条目数 | **18** | 解析 `courses.ts` `slug:` 字段计数 |
| F7 | 课程页（去 whiteboard） | **17** | 同 F6，排除 `whiteboard` |
| F8 | 知识域数 | **15** | 去 `whiteboard`、去 `phase==='—'` 后 domain 去重 |
| F9 | 有 `npm run demo` 的目录数 | **10** | 遍历 `*/package.json` 判断 `scripts.demo` |
| F10 | `site/src/pages/*.astro` 顶层页文件数 | **7** | `ls site/src/pages/*.astro \| wc -l`（index/learn/works/map/interview/**nav**/404） |
| F11 | 引用 20 份过程文档的位置总数 | **99** | 全仓（排除 node_modules/.git/.agent-teams/dist/.astro）逐文件正则扫描 |
| F12 | notes 目录体积 | **996K**（md 合计）/ 1004K（整目录） | `du -ch notes/*.md notes/details/*.md \| tail -1` |

**F4 的 22 条逐字清单**（`site/src/data/courses.ts:305`）：
`knowledge-map, interview-bank, site-refactor-plan, teaching-style-guide, api-mvp-spec, flywheel-mvp-spec, model-basics-mvp-spec, capstone-blueprint, capstone-style-guide, capstone-site-render-checklist, capstone-m0-exercise, capstone-m0-structure, capstone-m1-exercise, capstone-m1-structure, capstone-m2-exercise, capstone-m2-structure, capstone-m3-exercise, capstone-m3-structure, capstone-m4-exercise, capstone-m4-structure, capstone-final, capstone-final-structure`

其中：2 条（knowledge-map / interview-bank）是**真排除**（有独立页面 `/map`、`/interview`，且必须留顶层），20 条是**为 20 份过程文档打的补丁**。

**构建期证据（独立来源，非源码推断）**：`site/.astro/data-store.json` 中 `courses` 集合当前含 **39** 条 —— 与 F1 相等，证明 glob 确实把 20 份过程文档当课程收进去了。另一独立来源：陈旧产物 `site/dist/chunks/_astro_data-layer-content_DyCDU0ym.mjs` 的 content-layer 里能直接匹配到这 20 个 slug 字符串（`api-mvp-spec` … `teaching-style-guide`）。

```bash
# 取证：data-store 里 courses 集合条目数
node -e "const a=JSON.parse(require('fs').readFileSync('site/.astro/data-store.json','utf8'));
for(let i=0;i<a.length;i++) if(a[i]==='courses'&&Array.isArray(a[i+1])&&a[i+1][0]==='Map')
  console.log('courses entries =',(a[i+1].length-1)/2);"
# → courses entries = 39
```

---

## 2. 目标分层结构（①）

### 2.1 目录选择与论证

**决定：新建 `notes/process/`（扁平单层），20 份过程文档全部迁入。**

论证（四问四答，不凭喜好）：

**（1）为什么不复用既有的 `notes/details/` 模式？**
`notes/details/` **不是**「杂物间」，它是站点的一个**内容集合**，且带强制约定：

- `site/src/content/config.ts:19-20` 为它单独定义了 `details` 集合（`loader: glob({ pattern: '**/*.md', base: '../notes/details' })`），并在 `:21-29` 声明了 `title/slug/domain/source/status` frontmatter schema；
- `site/src/pages/details/index.astro` + `details/[slug].astro` 会为其中**每个** md 生成 `/details/<slug>/` 页面。

实测：`notes/details/*.md` **8 份全部有 frontmatter**（如 `01-context-rot.md:1-8`），而这 20 份过程文档**全部没有 frontmatter**（首行即 `# 标题`，逐份核过）。因此若把它们塞进 `details/`，会立刻产生两个后果：① 站点凭空多出 20 个 `/details/` 页面（与「结构重组不改变任何对外路由」的目标直接冲突）；② 需要为 20 份施工文档编造 `domain/source/status` 等语义字段（`source` 是「行业一手源 URL」，对这 20 份无意义）。**结论：不复用 details/，语义与代价都不成立。**

**（2）为什么新目录名取 `process`？**
因为仓库自身已经在用这个词、且是**权威定义**：`courses.ts:304` 的注释原文写着「后几者是 process 文档不是课程，不能生成 /c/ 课程页」。取 `process` 是与既有词汇直接对齐，不引入新概念。

**（3）为什么是扁平单层，不再分 `capstone/`、`mvp-specs/`、`site/` 三个子目录？**
因为**文件名前缀已经编码了同一套分类**：`capstone-*`（15）、`*-mvp-spec`（3）、`site-refactor-plan`/`teaching-style-guide`（2）。再加一层目录是**冗余编码**，而它带来的边际成本是真实的：写者范围声明要枚举 3 个目录、验收命令要写 `find`/`-maxdepth`、Obsidian 内引用路径更长、未来新增第 21 份文档时还要先做一次分类决策。**分层的收益（可读性）已由前缀提供，成本（多处枚举）却是新增的。** 扁平单层让「是不是课程」这个站点唯一在意的二值判断，恰好对应「在不在 `notes/` 顶层」这个文件系统事实——一个判断，一个位置，不需要查表。
（若后续确需分类，退化为纯文件移动即可，不影响任何消费方——因为没有任何代码读 `process/` 的内部结构，见 §2.3。）

**（4）与 `site/src/content/config.ts` 如何配合？**
**完全不需要改 config.ts。** 现有两条 loader 天然构成互补：

| 集合 | loader | 迁移后捞到什么 |
|---|---|---|
| `courses` | `glob({ pattern: '*.md', base: '../notes' })`（**仅顶层**） | 19 条（17 课 + knowledge-map + interview-bank） |
| `details` | `glob({ pattern: '**/*.md', base: '../notes/details' })` | 8 条（不变） |

关键在于 `courses` 的 pattern 是 `'*.md'` 而非 `'**/*.md'`：**任何子目录下的 md 对它天然不可见**。所以把 20 份文档移进 `notes/process/` 就是「用一个纯文件移动，同时完成路由收缩与口径修正」，**零代码改动**——这正是选子目录而非「改 glob 加 ignore 列表」的理由：前者让口径落在文件系统事实上，后者会再引入一份需要维护的忽略清单（与现有 22 条硬编码的病根同一类）。

> 备选方案（不推荐，记录备查）：把 glob 改成 `**/*.md` + `!process/**` 负向匹配。缺点：① 需要 Astro glob 支持负向 pattern（需实现时实测确认，本文未验证）；② 顶层文件数仍为 39，`19 − 2 = 17` 的口径依旧不成立，只治路由不治口径；③ 继续依赖一份手写排除清单。**否决。**

### 2.2 目标结构

```
notes/
├── *.md                      # 19 个：17 课程 + knowledge-map.md + interview-bank.md
├── details/                  # 8 个（既有 details 集合，本次不动）
└── process/                  # 新建：20 个设计/过程文档（courses glob 天然不可见）
    ├── capstone-*.md                 × 15
    ├── {api,flywheel,model-basics}-mvp-spec.md  × 3
    └── {site-refactor-plan,teaching-style-guide}.md  × 2
```

迁移后校验式：`ls notes/*.md | wc -l` → **19**；`ls notes/process/*.md | wc -l` → **20**；`19 + 20 + 8 = 47`（与 F3 守恒，**文件零增删**）。

### 2.3 逐文件迁移映射表（39 个顶层 md 全覆盖）

**A. 留在顶层 · 17 个课程正文**（`/c/<slug>/` 路由来源，slug 集合为硬不变量）

| # | 原路径 | 新路径 | 说明 |
|---|---|---|---|
| 1 | `notes/agent-harness.md` | 不变 | 课程（Harness 架构主线） |
| 2 | `notes/api-engineering.md` | 不变 | 课程 |
| 3 | `notes/data-flywheel.md` | 不变 | 课程 |
| 4 | `notes/durable-execution.md` | 不变 | 课程 |
| 5 | `notes/evaluation.md` | 不变 | 课程 |
| 6 | `notes/framework-ecosystem.md` | 不变 | 课程 |
| 7 | `notes/harness-from-scratch.md` | 不变 | 课程 |
| 8 | `notes/industry-2026.md` | 不变 | 课程（横向资产） |
| 9 | `notes/llm-timeline.md` | 不变 | 课程（横向资产） |
| 10 | `notes/long-term-memory.md` | 不变 | 课程 |
| 11 | `notes/mcp.md` | 不变 | 课程 |
| 12 | `notes/model-basics.md` | 不变 | 课程 |
| 13 | `notes/multi-agent.md` | 不变 | 课程 |
| 14 | `notes/observability.md` | 不变 | 课程 |
| 15 | `notes/rag.md` | 不变 | 课程 |
| 16 | `notes/sandbox.md` | 不变 | 课程 |
| 17 | `notes/system-design.md` | 不变 | 课程 |

**B. 留在顶层 · 2 个索引/题库（构建期强依赖，不可迁移）**

| # | 原路径 | 新路径 | 理由 |
|---|---|---|---|
| 18 | `notes/knowledge-map.md` | **不变（硬不变量）** | `map.astro:19` 从 `courses` 集合按 `id==='knowledge-map'` 取正文渲染 `/map` |
| 19 | `notes/interview-bank.md` | **不变（硬不变量）** | `interview.astro:17` 渲染 `/interview`；`c/[slug].astro:40-48` 构建期解析 TOC 锚点，**解析不到即 throw fail-fast** |

**C. 迁入 `notes/process/` · 15 个 capstone 设计文档**

| # | 原路径 | 新路径 |
|---|---|---|
| 20 | `notes/capstone-blueprint.md` | `notes/process/capstone-blueprint.md` |
| 21 | `notes/capstone-final.md` | `notes/process/capstone-final.md` |
| 22 | `notes/capstone-final-structure.md` | `notes/process/capstone-final-structure.md` |
| 23 | `notes/capstone-m0-exercise.md` | `notes/process/capstone-m0-exercise.md` |
| 24 | `notes/capstone-m0-structure.md` | `notes/process/capstone-m0-structure.md` |
| 25 | `notes/capstone-m1-exercise.md` | `notes/process/capstone-m1-exercise.md` |
| 26 | `notes/capstone-m1-structure.md` | `notes/process/capstone-m1-structure.md` |
| 27 | `notes/capstone-m2-exercise.md` | `notes/process/capstone-m2-exercise.md` |
| 28 | `notes/capstone-m2-structure.md` | `notes/process/capstone-m2-structure.md` |
| 29 | `notes/capstone-m3-exercise.md` | `notes/process/capstone-m3-exercise.md` |
| 30 | `notes/capstone-m3-structure.md` | `notes/process/capstone-m3-structure.md` |
| 31 | `notes/capstone-m4-exercise.md` | `notes/process/capstone-m4-exercise.md` |
| 32 | `notes/capstone-m4-structure.md` | `notes/process/capstone-m4-structure.md` |
| 33 | `notes/capstone-site-render-checklist.md` | `notes/process/capstone-site-render-checklist.md` |
| 34 | `notes/capstone-style-guide.md` | `notes/process/capstone-style-guide.md` |

**D. 迁入 `notes/process/` · 3 个 MVP 规格草稿**

| # | 原路径 | 新路径 |
|---|---|---|
| 35 | `notes/api-mvp-spec.md` | `notes/process/api-mvp-spec.md` |
| 36 | `notes/flywheel-mvp-spec.md` | `notes/process/flywheel-mvp-spec.md` |
| 37 | `notes/model-basics-mvp-spec.md` | `notes/process/model-basics-mvp-spec.md` |

**E. 迁入 `notes/process/` · 2 个施工规范**

| # | 原路径 | 新路径 |
|---|---|---|
| 38 | `notes/site-refactor-plan.md` | `notes/process/site-refactor-plan.md` |
| 39 | `notes/teaching-style-guide.md` | `notes/process/teaching-style-guide.md` |

**合计：17 + 2 + 15 + 3 + 2 = 39 ✓**（与 F1 守恒）

> ⚠️ **迁移执行注意**：`notes/capstone-final-structure.md` 是本任务 t1 之前由**其他 writer** 正在写入的文件（mtime `2026-10-14 14:27`，与 team 单写者纪律相关）。迁移任务开始前须用 `git status --short` 确认工作区干净，避免把他人半成品一起搬走。

---

## 3. 迁移影响面清单（②）

分类原则：**路径依赖**（代码按路径/集合 id 解析文件，迁移即断，必须同步改）与**叙述引用**（文档正文里提到某个文件名，迁移后指向失效路径，应改）分开列，避免把 99 条一视同仁（F11 的 99 条里，多数是同目录笔记间的相互提及）。

### 3.1 必须同步改的代码/配置（路径依赖级）

| # | file:line | 现状 | 必须改成 | 取证命令 |
|---|---|---|---|---|
| **A1** | `site/src/data/courses.ts:305` | `EXCLUDED_FROM_COURSE_ROUTE` 含 **22** 条 | 收缩为 **2** 条：`new Set(['knowledge-map', 'interview-bank'])`。其余 20 个 slug 迁移后不在 `courses` 集合中，`Set.has` 恒 false = 死配置 | `grep -n "EXCLUDED_FROM_COURSE_ROUTE" site/src/data/courses.ts` |
| **A2** | `site/src/data/courses.ts:304` | 注释解释 22 条：「…各有独立页面（/map、/interview）；后几者是 process 文档不是课程」 | 改为：「仅 2 条真排除（/map、/interview）；其余 20 份 process 文档位于 `notes/process/`，**不在 courses glob（`*.md` 仅顶层）内**，无需再列」 | 同上 |
| **A3** | `site/src/data/courses.ts:262` | `课程页口径…（notes 顶层 19 − knowledge-map − interview-bank）= 17` | **迁移后自动成立，可不改**；建议补一句显式口径：「19 = 17 课 + knowledge-map + interview-bank；20 份过程文档在 `notes/process/`」 | `grep -n "顶层 19" site/src/data/... README.md notes/knowledge-map.md` |
| **A4** | `site/src/data/course-structure.ts:4` | `唯一内容源：notes/site-refactor-plan.md §2/§3/§4/§5` | → `notes/process/site-refactor-plan.md §2/§3/§4/§5` | `grep -n "site-refactor-plan" site/src/data/course-structure.ts` |
| **A5** | `site/src/data/course-structure.ts:264` | 展示串「规格 notes/api-mvp-spec.md」 | → `notes/process/api-mvp-spec.md` | `grep -n "api-mvp-spec" site/src/data/course-structure.ts` |
| **A6** | `site/src/data/course-structure.ts:317` | 展示串「规格 notes/flywheel-mvp-spec.md」 | → `notes/process/flywheel-mvp-spec.md` | `grep -n "flywheel-mvp-spec" site/src/data/course-structure.ts` |
| **A7** | `site/src/data/course-structure.ts:334` | 展示串「规格 notes/model-basics-mvp-spec.md」 | → `notes/process/model-basics-mvp-spec.md` | `grep -n "model-basics-mvp-spec" site/src/data/course-structure.ts` |
| **A8** | `site/src/data/mvps.ts:4` | `来源：notes/site-refactor-plan.md §4.1（13 个 mvpSlug…）` | → `notes/process/site-refactor-plan.md §4.1` | `grep -n "site-refactor-plan" site/src/data/mvps.ts` |
| **A9** | `site/src/data/mvps.ts:161` | 运行时错误串「参照 notes/site-refactor-plan.md §4 词表」 | → `notes/process/site-refactor-plan.md §4` | 同上 |
| **A10** | `site/src/data/llm-history.ts:4` | `唯一内容源：notes/site-refactor-plan.md §7` | → `notes/process/site-refactor-plan.md §7` | `grep -n "site-refactor-plan" site/src/data/llm-history.ts` |
| **A11** | `site/src/data/capstone.ts:5` | `与 notes/capstone-blueprint.md §3 映射表逐字一致` | → `notes/process/capstone-blueprint.md §3` | `grep -n "capstone-blueprint" site/src/data/capstone.ts` |
| **A12** | `site/src/data/capstone.ts:39` | 注释「照 capstone-blueprint.md §3 映射表逐行抄入」 | → 前缀 `notes/process/`（或保留裸名，见 §3.3 说明） | 同上 |
| **A13** | `site/src/data/capstone.ts:7` | `term 约定（capstone-site-render-checklist §0）` | 补 `notes/process/` 前缀 | `grep -n "capstone-site-render-checklist" site/src/data/capstone.ts` |
| **A14** | `site/src/data/final-project.ts:3` | `与 notes/capstone-final.md 逐字一致` | → `notes/process/capstone-final.md` | `grep -n "capstone-final" site/src/data/final-project.ts` |
| **A15** | `site/src/data/final-project.ts:63` | `判据运行入口（capstone-final-structure.md §3.2）` | 补 `notes/process/` 前缀 | `grep -n "capstone-final-structure" site/src/data/final-project.ts` |
| **A16** | `site/src/pages/learn.astro:209` | 页面上可点的文案「完整蓝图见 `<code>notes/capstone-blueprint.md</code>`」 | → `notes/process/capstone-blueprint.md`（**用户可见**，必须改） | `grep -n "capstone-blueprint" site/src/pages/learn.astro` |
| **A17** | `site/src/pages/learn.astro:260` | 页面文案「完整命题/判据/自测见 `<code>notes/capstone-final.md</code>`」 | → `notes/process/capstone-final.md`（**用户可见**） | `grep -n "capstone-final" site/src/pages/learn.astro` |
| **A18** | `viz/mermaid-check.mjs:22-23` | **第二份路由实现**：`const EXCLUDED = new Set(['knowledge-map','interview-bank'])`，再 `readdirSync(NOTES_DIR)` 推 slug | **迁移后无需改**（自动收敛，见下方实测）。建议补注释说明「与 courses.ts 同源，依赖 `notes/` 顶层恰为课程+2 索引」 | `sed -n '22,33p' viz/mermaid-check.mjs` |
| **A19** | `site/src/data/courses.ts:278` | `/** 可运行 demo 作品口径：有 npm run demo 的目录数 = 6（whiteboard / viz / site 为配套资产，不计入）。 */` | **失真**（实测 10 个目录有 `npm run demo`）→ 见 §4 失真 #D4 | `grep -n "npm run demo 的目录数" site/src/data/courses.ts` |

**A18 实测（迁移收益的量化证据）**：

```bash
node -e "
const fs=require('fs');
const all=fs.readdirSync('notes').filter(f=>f.endsWith('.md')).map(f=>f.slice(0,-3));
const EXM=new Set(['knowledge-map','interview-bank']);          // mermaid-check 的排除集
const EXC=new Set([/* courses.ts 的 22 条 */]);                  // 见 §1 F4
console.log('现在: mermaid-check slugs =',all.filter(s=>!EXM.has(s)).length,
            ' 真实课程路由 =',all.filter(s=>!EXC.has(s)).length);
"
# 实测输出：现在 mermaid-check slugs = 37 ， 真实课程路由 = 17  → 20 个幽灵路由
# 迁移后两者均 = 17，差异归零
```

### 3.2 `c/[slug].astro` 的构建期依赖（重点核查）

任务要求单列。实测结论：**该文件在迁移后不需要改动**，但它是「knowledge-map / interview-bank 不得离开顶层」的**最强证据**：

| file:line | 代码 | 迁移影响 |
|---|---|---|
| `site/src/pages/c/[slug].astro:10` | `import { courseMeta, EXCLUDED_FROM_COURSE_ROUTE } from '../../data/courses'` | 无（随 A1 自动生效） |
| `site/src/pages/c/[slug].astro:18` | `.filter((e) => !EXCLUDED_FROM_COURSE_ROUTE.has(e.id))` | 无（集合缩到 2 条后语义等价） |
| `site/src/pages/c/[slug].astro:40` | `(await getCollection('courses')).find((e) => e.id === 'interview-bank')` | **依赖 interview-bank 留在 `courses` 集合中** → 必须留顶层 |
| `site/src/pages/c/[slug].astro:45` | `throw new Error('c/[slug]：面试题锚点找不到小节 …')` | **fail-fast**：`interview-bank` 一旦移走，`bankEntry` 为 `undefined` → `bankToc` 为空 → 只要任一课的 `relatedQuestions` 非空即 throw，**构建直接失败** |

```bash
grep -rn "EXCLUDED_FROM_COURSE_ROUTE" site/src/data/courses.ts site/src/pages/c/\[slug\].astro
# courses.ts:305（定义）· c/[slug].astro:10（import）· c/[slug].astro:18（过滤）
grep -rn "notes/knowledge-map.md\|notes/interview-bank.md" site/src/ --include=*.ts --include=*.astro
# → 18 处引用
```

### 3.3 叙述引用（应同步，非断链级）

迁移后这些字符串会指向不存在的路径。**分两步走**：

**（a）站点/工程文档中用户可见或面向实现者的路径串（必须改）**

| # | file:line | 现状串 | 改成 |
|---|---|---|---|
| B1 | `final-project/README.md:17` | `notes/capstone-final.md §3` | `notes/process/capstone-final.md §3` |
| B2 | `final-project/README.md:27` | `notes/capstone-final.md §4` | 同上 |
| B3 | `final-project/subjects/README.md:5` | `notes/capstone-final.md §3` | 同上 |
| B4 | `final-project/subjects/README.md:6` | `notes/capstone-final.md §4` | 同上 |
| B5 | `final-project/subjects/a-research.md:3` | `notes/capstone-final.md §3` | 同上 |
| B6 | `final-project/subjects/b-repo-guard.md:3` | `notes/capstone-final.md §3` | 同上 |
| B7 | `final-project/subjects/c-signal-arbiter.md:3` | `notes/capstone-final.md §3` | 同上 |
| B8 | `final-project/rubric.mjs:2` | `notes/capstone-final-structure.md §3.1` | `notes/process/capstone-final-structure.md §3.1` |
| B9 | `notes/api-engineering.md:84` | 提及 `api-mvp-spec` | 前缀 `notes/process/`（该文件留顶层，但引用了要移走的文件） |
| B10 | `notes/api-engineering.md:260` | 同上 | 同上 |
| B11 | `notes/data-flywheel.md:15` | 提及 `flywheel-mvp-spec` | 同上 |
| B12 | `notes/data-flywheel.md:148,312,327` | 同上（3 处注释/正文） | 同上 |
| B13 | `notes/model-basics.md:16,66,163,354` | 提及 `model-basics-mvp-spec`（4 处） | 同上 |
| B14 | `api-demo/README.md:37` | 提及 `api-mvp-spec` | 同上（若为裸名提及，见下方 (b)） |

**（b）20 份过程文档之间的相互引用（一次性批量替换）**

`notes/capstone-*.md`、`site-refactor-plan.md`、`teaching-style-guide.md` 内部大量互引（如 `capstone-final.md:4` → `notes/capstone-blueprint.md`；`capstone-m1-structure.md:3` → `notes/capstone-m0-exercise.md`；`capstone-site-render-checklist.md:9,33,36,109`）。这些**全部在迁移集合内部**，可对 `notes/process/` 内文件做一次规则化替换：

- 形态 `notes/<doc>.md` → `notes/process/<doc>.md`（**只替换含 `notes/` 前缀的绝对形态**）
- 形态 `` `<doc>.md` ``（裸文件名，如 `capstone-style-guide.md:3`「沿 `teaching-style-guide.md` §5/§6」）→ **建议不改**：同目录内裸名引用在迁移后仍然成立且更短；改动反而制造无谓 diff。
- **Obsidian wikilink**（`[[...]]`）按文件名解析，**不受目录影响**，无需改。实测这 20 份文档内没有 `[[ ]]` 形态引用。

**（c）明确不改的叙述引用**

| 位置 | 原因 |
|---|---|
| `notes/site-refactor-plan.md:366,373,380,411,448,455,500` | 这些是 **sprint 1–6 的带日期验收流水记录**（「`notes/*.md=20` − EXCLUDED = 17」「`notes/*.md=22`…」「`notes/*.md=24`…」）。它们是**历史时点的实测快照**，改写等于伪造审计记录。按仓库自身纪律（§7-1「改写只动教学组织，不动既有事实」+ date 口径归一先例），应在 `site-refactor-plan.md` 头部加一条**前置说明**指向本方案，声明「§11–§13 的 `notes/*.md=N` 为当时快照，现口径见本文与 knowledge-map 口径块」，而非就地改数。**留实现任务决策，本文给出推荐。** |
| `notes/knowledge-map.md` 内部对课程文件的引用 | 引用的都是**留顶层**的课程 → 无需改 |
| `README.md` 作品表对 `notes/rag.md` 等的链接 | 课程，留顶层 → 无需改 |

### 3.4 明确不需要改的（避免实现时过度修改）

| 位置 | 为什么不用改 |
|---|---|
| `site/src/content/config.ts:10` | `pattern: '*.md'` **保持原样**——正是它让 `process/` 天然不可见。仅 `:5` 注释可选补一句「子目录不在课程集合内」 |
| `site/src/content/config.ts:19-20` | `details` 集合与本次迁移无关 |
| `site/src/pages/map.astro:18-19` | 引 `knowledge-map`（留顶层） |
| `site/src/pages/interview.astro:16-17` | 引 `interview-bank`（留顶层） |
| `site/src/data/mvps.ts:15` | 引 `notes/knowledge-map.md`（留顶层） |
| `site/src/data/courses.ts:3,6,9,16,20,43,249,254,259` | 引 `knowledge-map` / `interview-bank` / `notes/*.md` 通称（留顶层） |
| `site/src/data/course-structure.ts:49,94,370` | 引 `knowledge-map` / `llm-timeline` / `industry-2026`（均留顶层） |
| `site/src/data/mvps.ts:149`、`course-structure.ts:370` | 引 `notes/industry-2026.md`（课程，留顶层） |
| `site/src/utils/ragStats.ts:2,32,37` | 按 **§13 标题**解析 rag.md 内容；`rag.md` 留顶层 → 路径与内容都不变 |
| `rag-demo/src/corpus.ts:18-19`、`rag-demo/src/evaluate.ts:18,124` | 硬编码 `notes/rag.md`、`notes/agent-harness.md`、`handoff.md` —— **三者全部留原位**（两个是课程）。这也是「17 课程不得移动」的**代码级**证据：移动 `rag.md` 会同时打断 demo 语料与 132-chunk / recall 数字 |
| `harness-demo/`、`mcp-demo/`、`api-demo/`、`flywheel-demo/`、`model-basics-demo/`、`memory-redteam/`、`my-agent/` 内的 `notes/<课程>.md` 引用 | 引用的均为**留顶层课程** |
| `final-project/subjects/*.md` 资产 | 见 §5：`final-project/` 目录本身不动 |

---

## 4. 内容失真清单（③）

每条含：失真点 file:line + 实测真值 + 取证命令 + 修法。**所有真值均由命令数出。**

### D1 —— 「课程页 17 = notes 顶层 19 − 2」算式所引被减数与排除数失真（任务指定核实项 ①）

| 项 | 内容 |
|---|---|
| 失真点 | `notes/knowledge-map.md:13`、`site/src/data/courses.ts:262`，**另实测发现第三处 `README.md:34`** |
| 原文 | 「**课程页 17** = 站点 `/c/<slug>/` 实生成路由数（notes 顶层 19 − knowledge-map − interview-bank）。」 |
| 实测真值 | notes 顶层 = **39**（非 19）；`EXCLUDED_FROM_COURSE_ROUTE` = **22** 条（非 2）；**39 − 22 = 17**，派生值 17 恰好正确 |
| 取证命令 | `ls notes/*.md \| wc -l` → 39 ; `grep -n "EXCLUDED_FROM_COURSE_ROUTE" site/src/data/courses.ts` → 数出 22 个 slug ; 集合做差 → 17 |
| 定性 | **算式与两个被引数字失真，结论值正确**。属「错过程、对结果」，最危险的一类——因为结果对，审查容易放过 |
| 修法 | **不需要改数字，只需要让算式成立**：迁移 20 份文档 → 顶层 19、EXCLUDED 2 → `19 − 2 = 17` 三处同时自洽。**这正是本方案选择「移动文件」而非「修正算式文字」的理由**：改文字只是让 3 处文案自洽，移动文件让**口径与文件系统事实**自洽，且顺带消掉 22 条硬编码与 20 个幽灵路由 |
| 迁移后 | 三处（`knowledge-map.md:13`、`courses.ts:262`、`README.md:34`）无需改字即成立；建议 `courses.ts:262` 补一句「19 = 17 课 + knowledge-map + interview-bank」 |

```bash
# 三处同源口径的完整取证
grep -rn "顶层 19\|顶层19" --include=*.md --include=*.ts . | grep -v node_modules
# → site/src/data/courses.ts:262 / README.md:34 / notes/knowledge-map.md:13
```

### D2 —— `README.md:34` 文件数与体积双向失真（**任务未指定，实测新增**）

| 项 | 内容 |
|---|---|
| 失真点 | `README.md:34`（`## 课程笔记（notes/）` 段首） |
| 原文 | 「27 个文件 / ~600KB（notes 顶层 19 + details/ 8）」 |
| 实测真值 | **47 个文件**（顶层 39 + details 8）；体积 **~996KB**（md 合计）/ 1004KB（整目录） |
| 取证命令 | `ls notes/*.md \| wc -l` → 39 ; `ls notes/details/*.md \| wc -l` → 8 ; `du -ch notes/*.md notes/details/*.md \| tail -1` → `996K total` |
| 定性 | 三个数字全错：`27`（应 47）、`19`（应 39，迁移后为 19）、`~600KB`（应 ~1000KB）。**且内部算术自相矛盾**：文中自己写「顶层 19 + details 8」，相加应为 27 —— 说明作者当年按「19」写死了总数，而 19 从未是事实 |
| 修法 | 迁移后顶层＝19 → 总数 = 19 + 8 = **27**，此时「27」**恰好自动成立**；`~600KB` 需改为 `~1MB`（或迁移后复测实值，因纯移动不改变体积，仍 ~996KB）。**即：迁移让「27」这个数字由错误巧合变成真实算式，但体积仍需单独更正** |

### D3 —— `README.md` 「6 个可运行 demo」与「有 `npm run demo` 的目录数」口径（任务指定核实项 ②）

| 项 | 内容 |
|---|---|
| 失真点 | 待判定的两处：`README.md:9` 与 `site/src/data/courses.ts:278` |
| 实测真值 | 有 `npm run demo` 的目录 = **10 个**：`api-demo, durable-execution-demo, flywheel-demo, framework-demo, harness-demo, mcp-demo, memory-redteam, model-basics-demo, my-agent, sandbox-demo`（注：`rag-demo` **不在其中**——它的入口是 `demo:eval`） |
| 取证命令 | `for d in */; do [ -f "$d/package.json" ] \|\| continue; node -e "const p=require('./$d/package.json');process.exit(p.scripts&&p.scripts.demo?0:1)" 2>/dev/null && echo "$d"; done \| wc -l` → **10** |
| **`README.md:9` 判定** | **自洽，无需改。** 原文为「6 个可运行 demo（`npm run demo` 一键复现；即下表六个**具名作品**目录——`memory-redteam/` 为回归套件/自研实操证据，按口径块**不计入作品数**）」。它把「6」显式锚定为**具名作品目录**这一口径，而非「有 demo 脚本的目录」，并点名说明了 `memory-redteam/` 为何排除。与 `knowledge-map.md:15` 的口径块（「`whiteboard`/`viz`/`site` 为配套资产；`memory-redteam/` 按回归套件计，同样不计入作品数。即"6"指上列六个具名目录，**不是"所有带 demo 脚本的目录"**」）**逐字一致**。 |
| **`courses.ts:278` 判定** | ⚠️ **失真，必须改。** 原文 `/** 可运行 demo 作品口径：有 \`npm run demo\` 的目录数 = 6（whiteboard / viz / site 为配套资产，不计入）。 */` —— 这**正是** `knowledge-map.md:167` 声明「已就地更正」的那条失真措辞，**但更正只落在 knowledge-map 口径块，`courses.ts:278` 的旧措辞被漏掉了**。实测该陈述为假：有 demo 的目录是 10 不是 6；且括号里只列了 whiteboard/viz/site 三个排除项，远不足以解释 10 → 6。 |
| 修法（D3） | 把 `courses.ts:278` 注释改为与口径块一致的措辞，例如：`/** 可运行 demo 作品口径：六个具名作品目录 = 6（harness/rag/sandbox/mcp/durable-execution/framework-demo）。「有 npm run demo 的目录」实测为 10（另有 memory-redteam / model-basics-demo / flywheel-demo / api-demo），非本口径，勿再据此推算。 */`。**注意**：`WORK_COUNT = 6` 这个**值不变**（口径未变），只修注释。 |
| 附加发现 | `WORK_COUNT`（`courses.ts:279`）被 `interview.astro:14,119` 消费并渲染为「/works/ 看 6 个作品」——**值本就正确**，所以这是纯注释失真，不影响页面 |

### D4 —— `knowledge-map.md:17` 「站点 html 32」的加数枚举遗漏 `nav`（任务指定核实项 ③ 之一）

| 项 | 内容 |
|---|---|
| 失真点 | `notes/knowledge-map.md:17`（及其同源副本 `.github/workflows/verify.yml:67,75`） |
| 原文 | 「**站点 html 32** = 6 静态页（index / learn / works / map / interview / details）+ 17 课程页 + 8 专题页 + 自定义 404 页」 |
| 实测真值 | `site/src/pages/*.astro` = **7** 个顶层页文件：`index, learn, works, map, interview, nav, 404`。上述枚举里的「6 静态页」**漏了 `nav`**（`nav.astro` 是真实页面：`Header.astro:10` 导航栏指向 `/nav/`，`index.astro:239` 有卡片链接，`nav.astro` 自身渲染 `LLM_HISTORY`/`LLM_EVOLUTION`/`STAGE_COUNTS` 全量内容） |
| 取证命令 | `ls site/src/pages/*.astro \| wc -l` → 7 ; `ls site/src/pages/*.astro` → 列出含 `nav.astro` ; `grep -n "nav/" site/src/components/Header.astro site/src/pages/index.astro` → 两处引用 |
| 定性 | 加数枚举 **不完整**。按源码枚举应为 33（6 普通页 + nav + 17 + 8 专题 + 404 的某种组合口径），但**本机无法实测**（见 §6 边界）。CI 的 `test "$count" -ge 32` 是**下界断言**，结构上**不可能**发现「少枚举一个页面」——多一个页面仍然 ≥32 |
| 修法 | ① 把 `nav` 补进枚举并重新给出加数（**32 → 33 或按实测定值**）；② CI 的 `-ge 32` 下界应改为**等值断言**或把 `nav.html` 加入 `verify.yml:77` 的关键页清单（目前清单是 `index/learn/works/interview/map/details/c-rag/404`，**同样漏 nav**）；③ 最终值**必须由 CI 实测**，不得由本机推断 |
| 重要限制 | 本机 `site/dist/*.html` = **0**（`find site/dist -name '*.html' \| wc -l` → 0），且 `astro build` 在 rendering chunks 阶段被 OS SIGKILL。**因此「32 还是 33」不得在本机拍板，标注「留 CI 实测」。** |

### D5 —— `knowledge-map.md` 计数口径块其余数字逐条核查（任务指定核实项 ③）

对 `knowledge-map.md:12-18` 逐条实测：

| 条 | 声称 | 实测 | 判定 | 取证命令 |
|---|---|---|---|---|
| L12 | 知识域 **15** = 14 编号课 + agent-harness 主线 | **15** | ✅ **正确** | 解析 `courses.ts` 的 `COURSES`，去 `whiteboard`、去 `phase==='—'`，domain 去重 → 15（域名单：从零写 harness/RAG 与检索/系统设计/沙箱与凭据/评测工程化/多智能体编排/Harness 架构/durable execution/MCP 与供应链安全/API 与多模型路由/数据飞轮/可观测/长期记忆/模型基础/框架生态） |
| L13 | 课程页 **17** | **17** | ⚠️ **值对、算式错** → 见 D1 | 见 D1 |
| L14 | 课程卡 **18** = `courses.ts` 全部条目；比课程页多 1 | **18** | ✅ **正确**（18 − 1 whiteboard = 17） | 解析 `courses.ts` `slug:` 计数 → 18 |
| L15 | 可运行 demo 作品 **6** | **6**（具名作品口径） | ✅ **口径自洽**；「有 demo 的目录」= 10 见 D3 | 见 D3 |
| L16 | 题目 = 课内嵌 **205**（13 课 176 + agent-harness §13 八题 + rag S1 五题 + model-basics S7 十六题）+ 题库 **37**（§3 22 + §4 10 + §8 5） | **176 / 8 / 5 / 16 / 205；22 / 10 / 5 / 37** | ✅ **完全正确，且可独立复算** | 见下方命令组 |
| L17 | 站点 html **32** | 枚举漏 `nav` → 真值待定 | ⚠️ **加数失真** → 见 D4 | 见 D4 |
| L18 | rag 评测：recall@3=0.31 / @5=0.44 / @10=0.50，PASS 3/8，语料 132 chunks；旧值 1.00/0.94 已废 | 与 `notes/rag.md` §13 正文逐字一致 | ✅ **正确**（与唯一数字源同步，且明确废弃旧值） | `sed -n '280,316p' notes/rag.md \| grep -E "recall\|PASS\|chunks"` → `recall@3 = 0.31 / recall@5 = 0.44 / recall@10 = 0.50（PASS 3/8…` |

```bash
# L16 的独立复算（全部由命令数出）
node -e "
const fs=require('fs');
function bank(f){const L=fs.readFileSync('notes/'+f,'utf8').split('\n');let b=false,c=0;
 for(const l of L){if(/^#{1,3}\s*.*练习题库/.test(l)){b=true;continue;}
  if(b&&/^#{1,3}\s/.test(l))b=false; if(b&&/^\|\s*\d+\s*\|/.test(l))c++;} return c;}
let t=0; const per={};
for(const f of fs.readdirSync('notes').filter(f=>f.endsWith('.md'))){const c=bank(f); if(c){per[f]=c;t+=c;}}
console.log(JSON.stringify(per,null,0)); console.log('13 课练习题库合计 =',t);
"
# → 13 个文件，合计 176（逐项：api 14 / data-flywheel 14 / durable 14 / evaluation 14 /
#    framework 14 / harness-from-scratch 8 / long-term-memory 14 / mcp 14 / model-basics 14 /
#    multi-agent 12 / observability 14 / sandbox 16 / system-design 14 = 176）
# agent-harness §13 = 8 ; model-basics S7 = 16 ; rag S1 = 5
# 176 + 8 + 5 + 16 = 205 ✅
grep -c "^- Q[0-9]" <(sed -n '27,61p' notes/interview-bank.md)   # §3 = 22
sed -n '62,76p' notes/interview-bank.md | grep -c "^| [0-9]"       # §4 = 10
grep -c "^\*\*Q[0-9]" <(sed -n '129,166p' notes/interview-bank.md) # §8 = 5  → 22+10+5 = 37 ✅
```

> **重要提醒（复算口径）**：L16 的 205 能对上，前提是「13 课 176」**已经包含 `model-basics.md` 自身 14 行的练习题库表**（见上表 `model-basics 14`），而「model-basics S7 十六题」是**另一个独立小节**（`## S7 八股速查表（16 题 × 3-5 行标准答案）`，编号列表形态，非表格）。二者不重复，合计正确。这是**容易误判为双计**的地方，实现任务复核时不要"顺手纠正"。同理，练习题库是**表格行**（`| N | …`）而非编号列表，用 `^[0-9]+\.` 会数出 0。

### D6 —— `site-refactor-plan.md` 历史流水中的 `notes/*.md=N`（记载性，非活动失真）

`notes/site-refactor-plan.md:366`（`notes/*.md=20`）、`:411`（`=22`）、`:455`（`=24`）、`:380/448/500`（glob 告警）——均为 sprint 1–6 **当时**的实测快照，且彼此并不一致（20/22/24 逼近真值 39 的过程）。**判定：属审计历史，不是当前口径陈述，不应改写数字**（改写＝伪造审计轨迹，违反仓库 §7-1 纪律）。**修法（推荐）**：在该文件头部（`# 站点重构方案…` 标题下方）加一条前置说明，声明 §11–§13 的 `notes/*.md=N` 为各 sprint 时点快照，当前口径以 `knowledge-map.md` 口径块与本方案为准。**由实现任务确认是否采纳。**

### D7 —— 口径散落导致"修一处漏两处"（**机制性失真的根因，任务指定核实项 ③ 的结构性发现**）

实测证据链（这是本次最有价值的发现）：

1. `knowledge-map.md:167` 明确记载：「作品口径就地更正（2026-10-12）：`memory-redteam/` 加了 `npm run demo`，计数口径块原措辞"（有 `npm run demo` 的目录）"随即失真——已改为"六个**具名作品**目录"…」
2. **但** `courses.ts:278` 至今仍写着「有 `npm run demo` 的目录数 = 6」——**就是那条被声明已更正、却漏改的措辞**（见 D3）。
3. 同类：`knowledge-map.md:13` 的口径算式在 `courses.ts:262` 与 `README.md:34` 各有一份**手工副本**，三处同步失真（见 D1/D2）。
4. 同类：`knowledge-map.md:17` 的「32」与 `verify.yml:67,75` 的「32」各一份副本，`nav` 遗漏两处同现（见 D4）。

**定性**：这不是 4 个孤立笔误，而是**「口径块为唯一真源」这条纪律只靠人工遵守、没有机器校验**的结构性后果。每次口径变更，都要求写者手动找到所有副本——实测已被证明做不到（167 行自己承认了漏改）。

**修法（结构级，建议单列后续任务，不在本次迁移范围）**：
- **短期**：迁移后把所有口径**值**收敛为「只有 `knowledge-map.md` 口径块出现裸数字」，其余位置一律改为**引用推导**（如 `README.md:34` 由脚本从 `ls notes/*.md | wc -l` 生成，或直接删数改述为「19 篇课程笔记 + 8 篇专题」）。
- **中期**：加一条 CI 断言脚本，按 `knowledge-map.md` 口径块逐条**重算**并与块内数字比对（本方案 §4 给出的命令组已可直接复用为脚本骨架：`ls`/`node -e` 数 15/17/18/205/37/6）。这是把「口径唯一参照」从**纪律**升级为**门禁**。
- **说明**：本次迁移**已消除** D1/D2 两类（把算式左端修正为事实），但 D3/D4/D7 需要独立任务，避免把迁移任务变成"顺手改数字"的无边界工作。

---

## 5. 不可迁移项与理由（⑤）

| 项 | 处置 | 理由（含取证） |
|---|---|---|
| `notes/knowledge-map.md` | **必须留顶层** | ① `map.astro:19`：`entries.find((e) => e.id === 'knowledge-map')` —— 从 **`courses` 集合**按 id 取，移出顶层即从集合消失 → `/map` 退化为空态「未就位」占位（`map.astro:54-59`）；② `courses.ts:249` 声明它是口径唯一参照；③ `mvps.ts:15`、`course-structure.ts:49`、`DomainMap.astro:72` 均指向它 |
| `notes/interview-bank.md` | **必须留顶层** | ① `interview.astro:17` 从 `courses` 集合按 id 取来渲染 `/interview`，移出即空态；② `c/[slug].astro:40-48` 构建期解析其 TOC，**解析不到即 `throw`（:45）fail-fast**；③ `interview.astro:26` 另有第二个 `throw`。移出顶层 = **构建必定失败**，不是"页面降级" |
| `notes/details/` 8 份 | **不动** | 既有 `details` 集合（`config.ts:19-20`）与 `/details/*` 路由的来源，带 frontmatter 约定；本次迁移与之无关 |
| `final-project/`、`my-agent/`、各 `*-demo/`、`viz/`、`whiteboard/`、`site/` | **不动** | 不在 `notes/` 单写者范围内；`final-project/rubric.mjs` 自称「机器可读唯一真源」，移动它属于另一类重构 |
| 20 份过程文档中的 `capstone-final.md` / `capstone-final-structure.md` | **可迁移，但需注意** | 它们**没有**被任何站点页面以集合 id 引用（`grep -n "e.id === 'capstone"` → 无结果），也**没有**独立路由被删除的风险（`capstone-final-structure.md:86,95` 自己就写明「不建课程路由」「EXCLUDED 已含 capstone-final + capstone-final-structure（路由页保持 17 不变）」）。站点只以**字符串**提及它们（`learn.astro:209,260`、`final-project.ts` 注释），故迁移安全，只要按 §3.3 同步字符串 |
| **capstone 文档是否被 `courses.ts` 排除逻辑与站点页面引用？** | **已核实：是（被排除）+ 是（仅字符串引用）** | ① 15 份 capstone 文档**全部**在 `EXCLUDED_FROM_COURSE_ROUTE` 的 22 条内（逐条比对确认）→ 迁移后该 15 条可从集合删除；② 站点侧无 archetype 页面按 id 取它们；③ 唯一页面级引用是 `learn.astro:209`（capstone-blueprint）与 `:260`（capstone-final）的 `<code>` 展示串 → 按 A16/A17 同步 |

---

## 6. 验收判据与不变量（④）

### 6.1 结构性不变量（迁移前后必须完全不变）

| ID | 不变量 | 迁移前实测 | 验证命令 |
|---|---|---|---|
| **INV-1** | 17 个课程路由数与 slug 集合不变 | 路由 17；slug 集合 = `agent-harness, api-engineering, data-flywheel, durable-execution, evaluation, framework-ecosystem, harness-from-scratch, industry-2026, llm-timeline, long-term-memory, mcp, model-basics, multi-agent, observability, rag, sandbox, system-design` | ① `ls notes/*.md \| xargs -n1 basename \| sed 's/\.md$//'` 去 EXCLUDED 后 `sort`，与上表 17 项 `diff`；② `cd site && npx astro build` 的 `getStaticPaths` 结果（**本机不可用**，见 §6.3）→ 用等价的 `esbuild bundle + node` 断言替代 |
| **INV-2** | `knowledge-map.md` / `interview-bank.md` 留在 `notes/` 顶层 | 两者均在顶层 | `ls notes/knowledge-map.md notes/interview-bank.md`（两文件存在）；且 `node -e` 断言 data-store `courses` 集合中仍含这两个 id |
| **INV-3** | `COURSE_COUNT === 17` | 17 | `esbuild` bundle `courses.ts` → `node -e "console.log(COURSE_COUNT)"` |
| **INV-4** | `CARD_COUNT === 18`、`DOMAIN_COUNT === 15` | 18 / 15 | 同上 |
| **INV-5** | `WORK_COUNT === 6` | 6 | 同上（口径为「具名作品」，与 D3 的 10 不冲突） |
| **INV-6** | 3 个 TS 数据文件的「唯一内容源」溯源声明仍准确指向存在的文件 | 指向 `notes/site-refactor-plan.md`（**存在**） | `course-structure.ts:4`、`mvps.ts:4`、`llm-history.ts:4` 改后须逐个 `ls` 验证新路径存在 |
| **INV-7** | 文件总数守恒（零增删） | 47 个 md（39 顶层 + 8 details） | `find notes -name '*.md' \| wc -l` → 47，迁移前后相等 |
| **INV-8** | `rag-demo` 语料路径仍可解析 | `corpus.ts` 指 `notes/rag.md`、`notes/agent-harness.md`、`handoff.md` 都存在 | `node -e "…existsSync…"` 三项均 true |
| **INV-9** | `/details/` 路由数与内容不变 | 8 份 content | `ls notes/details/*.md \| wc -l` → 8 |

### 6.2 迁移完成判据（目标态）

| ID | 判据 | 目标值 | 命令 |
|---|---|---|---|
| **AC-1** | `notes/` 顶层 md 数 | **19** | `ls notes/*.md \| wc -l` |
| **AC-2** | `notes/process/` md 数 | **20** | `ls notes/process/*.md \| wc -l` |
| **AC-3** | `EXCLUDED_FROM_COURSE_ROUTE` 条目数 | **2** | 解析 `courses.ts:305` 计数 |
| **AC-4** | 算式自洽：`19 − 2 = 17` | 三处一致 | `ls notes/*.md \| wc -l` = 19 且 EXCLUDED = 2 且 `COURSE_COUNT` = 17 |
| **AC-5** | 课程集合条目数 | **19** | data-store `courses` 集合计数（重建后） |
| **AC-6** | 幽灵路由归零 | `mermaid-check` slugs = 真实路由 = 17 | 见 §3.1-A18 脚本 |
| **AC-7** | 全仓无指向旧路径的 `notes/<过程文档>.md` | 0 条（`site-refactor-plan.md` 历史流水除外，见 D6） | 见 §6.4 一键脚本 |
| **AC-8** | D1–D5 逐条处置完成 | 见 §4 | 逐条命令 |

### 6.3 ⚠️ 边界诚实声明（**本机环境约束，不得设计依赖它的验收**）

**本机（2 vCPU / 3.4G）无法完成 `astro build` 的页面渲染阶段。** 实测与本仓库既有记录（`site-refactor-plan.md` §11.1/§12.1/§13.1、`.github/workflows/verify.yml:5-6`、`site/build.sh` 头注释、`README.md:28`）一致：

- `astro build` 在 `rendering chunks` / `building client (vite)` 阶段被 OS **SIGKILL**（exit 137 / timeout 124），`dist/*.html` 恒为 0（实测当前 `find site/dist -name '*.html' | wc -l` → **0**）。
- 可成功的是**内容层**（`Synced content`）与**服务端 static entrypoints 编译**（`[build] ✓ Completed`）。

**因此本方案严格区分三类验证，并按环境归属**：

| 类别 | 本机可验证？ | 手段 | 归属 |
|---|---|---|---|
| **① 口径/集合/路由数**（AC-1…AC-6、INV-1…INV-9） | ✅ **可以** | data-store 计数 + `esbuild bundle + node` 断言 `COURSE_COUNT/CARD_COUNT/DOMAIN_COUNT/WORK_COUNT` + `tsc --noEmit` + 文件系统计数 | **本机必做** |
| **② 内容层同步**（集合是否只捞 19 条、20 份文档不再进集合） | ✅ **可以** | 删除 `site/.astro` 缓存后重跑构建到 `Synced content` 阶段即可读 data-store；或直接断言 `ls notes/*.md \| wc -l === 19` | **本机必做** |
| **③ 页面渲染正确性**（dist html 数、`/c/<slug>/` 成品、`nav.html`、锚点 links、mermaid/katex 渲染、`/map`·`/interview` 正文） | ❌ **不可以** | —— | **留 CI / 浏览器目检** |

**明确禁止的验收写法**（防"以内容层成功冒充页面渲染正确"）：
- ❌ 用 `tsc --noEmit` exit 0 断言「站点正常」；
- ❌ 用 `[build] ✓ Completed`（服务端编译）或 `Synced content` 断言「页面渲染正确」；
- ❌ 用 `dist/` 目录存在断言「32/33 个 html 已产出」（实测 `dist/*.html = 0`）。

**针对本迁移，③ 类里必须留 CI 的具体项**：
1. `dist` HTML 实际数量是否等于更正后的口径值（D4 的 32/33 之争**只能由 CI 定**）；
2. `verify.yml:77` 关键页清单是否需补 `nav.html`；
3. `/map`、`/interview` 仍正常渲染（它们依赖 INV-2，本机只能证明"文件在集合里"，不能证明"渲染成功"）；
4. 17 个 `/c/<slug>/` 页面存在且非空（迁移删掉了 20 个本就不该存在的路由，需 CI 确认没有多删）；
5. `learn.astro:209,260` 与 `final-project` 文档中改后的 `notes/process/...` 路径字面量在页面上显示正确（**浏览器目检**）。

> 本机 `astro build` 曾于 2026-10-13 由 t21 独立实测「约 17 分钟可成功完成（首次 560s 超时被杀非 OOM，dist HTML=32 含 404.html）」（`verify.yml:5-6`、`README.md:28`）。**即「本机必失败」已被证伪，但「本机不可依赖」仍成立**。本方案不据此设计验收，仅在实现任务有余力时作为**附加**证据，且须如实区分「超时被杀」与「OOM 被杀」。

### 6.4 一键验收脚本（建议实现任务固化为 `verify-restructure.mjs`）

```bash
# AC-1..AC-4 + INV-1/INV-7 + AC-7（本机可跑，全部数出）
cd /home/ubuntu/app/learn-agent-harness

top=$(ls notes/*.md | wc -l);              echo "notes 顶层 = $top (期望 19)"
proc=$(ls notes/process/*.md 2>/dev/null | wc -l); echo "notes/process = $proc (期望 20)"
tot=$(find notes -name '*.md' | wc -l);    echo "notes md 合计 = $tot (期望 47)"
det=$(ls notes/details/*.md | wc -l);      echo "details = $det (期望 8)"

node -e "const s=require('fs').readFileSync('site/src/data/courses.ts','utf8');
const m=s.match(/EXCLUDED_FROM_COURSE_ROUTE = new Set\(\[(.*?)\]\)/s);
const a=m[1].split(',').map(x=>x.trim().replace(/^'|'\$/g,'')).filter(Boolean);
console.log('EXCLUDED 条目 =',a.length,'(期望 2):',a.join(','));"

echo "--- AC-7：全仓不应再有指向旧路径的引用（应为 0，site-refactor-plan 历史流水除外）---"
grep -rnE "notes/(capstone-[a-z0-9-]+|site-refactor-plan|teaching-style-guide|(api|flywheel|model-basics)-mvp-spec)\.md" \
  --include='*.ts' --include='*.astro' --include='*.mjs' --include='*.md' \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.astro --exclude-dir=.git . \
  | grep -v "notes/process/" | grep -v "notes/process/site-refactor-plan.md:"
```

---

## 7. 执行顺序与单写者边界建议（⑥）

### 7.1 顺序（严格串行，不得并行写 `notes/` 或 `site/src/`）

```
S1 前置       git status --short 必须干净；确认 capstone-final-structure.md 无半成品
              → 记录基线：ls notes/*.md | wc -l（应为 39）；保存 /tmp/r1-evidence 快照
S2 纯移动      mkdir notes/process && git mv notes/{20 份}.md notes/process/
              → 此步零内容改动，可单独提交、单独回滚（推荐独立 commit）
S3 改代码      §3.1 A1–A17（courses.ts / course-structure.ts / mvps.ts / llm-history.ts /
              capstone.ts / final-project.ts / learn.astro）
S4 改文档引用  §3.3 (a) B1–B14 + (b) notes/process/ 内部 notes/ 前缀批量替换
S5 口径文案    D1（courses.ts:262 补口径说明）、D2（README.md:34 文件数与体积）、
              D3（courses.ts:278 注释）、D4（knowledge-map.md:17 补 nav + verify.yml 清单）
              ⚠️ D4 的最终数字（32→33）标注「留 CI 实测」，实现时不得凭本机推断填数
S6 本机验证    §6.4 脚本 + tsc --noEmit + 内容层构建（Synced content）读 data-store
S7 诚实交付    声明「③ 类验证留 CI / 浏览器目检」（§6.3 清单）
S8 内容修正    由后续内容修正任务执行（D6/D7 建议项）
```

**为什么 S2 必须与 S3 分离**：S2 是**可逆的纯文件移动**（`git mv` 保留历史），S3 是语义修改。分离后，若 S3 出问题可 `git revert` S3 而不丢移动；反之若合并提交，回滚会同时撤销 `git mv`，丢失文件历史。**且 S2 之后立刻跑 AC-1/AC-2 就能验证「移动本身是否正确」，不必等代码改完**。

### 7.2 单写者边界

| 范围 | 允许的写者 | 说明 |
|---|---|---|
| `notes/**` | **仅结构重组任务** | 含 S2 移动与 S4 文档引用修改 |
| `site/src/**` | **仅结构重组任务** | 含 S3、S5 中的 `courses.ts`/`learn.astro` |
| `.github/workflows/verify.yml` | 结构重组任务（D4 若采纳） | 与站点同源，避免跨任务竞争 |
| `README.md`、`handoff.md` | 结构重组任务（D2） | 口径文案 |
| `viz/mermaid-check.mjs` | 结构重组任务（A18 仅注释，可选） | |
| `final-project/**` | 结构重组任务（B1–B8 仅注释/README 路径串） | **不改 `rubric.mjs` 的判据逻辑**，只改注释里的路径字面量 |
| 各 `*-demo/**`、`my-agent/**` | **本次不动** | 无路径依赖（§3.4 已核实） |
| 本文件 `notes-restructure-plan.md` | 仅 architect（R1） | 实现任务**只读**引用，不得就地改动基线结论；如需修订走新任务 |

**并发禁令**：内容修正任务（S8）必须等结构重组任务**完全结束**后再开始——因为 S4/S5 会改动 `notes/*.md` 与 `notes/process/*.md` 的路径串，与内容修正的编辑区重叠。两种编辑同时进行会产生**路径串与内容的混合冲突**，且在单写者纪律下无法归因。

**跨任务交接物**：S6 的验证日志（含命令原文与输出）+ `git status` + `git diff --stat`，作为 S8 的输入前提。

### 7.3 提交建议（便于独立验证与回滚）

| commit | 内容 | 可独立验证 |
|---|---|---|
| C1 | `git mv` 20 份文档 → `notes/process/`（纯移动，零内容改动） | AC-1/AC-2/INV-7 |
| C2 | S3 代码改动（A1–A17） | AC-3/AC-4/AC-6/INV-1…INV-6 + `tsc --noEmit` |
| C3 | S4 文档引用（B1–B14 + process/ 内部前缀） | AC-7 |
| C4 | S5 口径文案（D1–D4） | §4 逐条命令 |
| C5 | （可选）A18 注释 + S7 交付说明 | —— |

---

## 8. 遗留风险与待确认项

| # | 项 | 状态 | 处置建议 |
|---|---|---|---|
| R1 | `notes/site-refactor-plan.md` 的 §11–§13 历史流水含 `notes/*.md=20/22/24` | **已知，不阻断** | 见 D6：加前置说明而非改数；由实现任务决策 |
| R2 | D4 的「站点 html」真值（32 vs 33） | **本机不可测** | **留 CI 实测**；`verify.yml:77` 关键页清单疑似也漏 `nav.html`，建议一并修 |
| R3 | `astro` glob 是否支持负向 pattern | **未验证** | 不影响本方案（已否决备选方案）；若实现者想走备选须先实测 |
| R4 | `site/tools/visual-check.mjs` 是否对页面清单硬编码 | **未核查** | 该文件未在本次影响面扫描中出现（未被 20 份文档引用）；但 D4 若改页面数，建议实现时顺手核查它是否维护了独立页面清单 |
| R5 | `notes/process/` 内的互引替换若用 `sed` 批量执行，可能误伤代码块内的示例 | **需人工复核** | 替换后 `git diff` 逐条目检；优先只替换 `` `notes/xxx.md` `` 反引号形态 |
| R6 | `my-agent/`、各 demo 内对**课程**的 `notes/*.md` 引用 | **确认无需改** | 引用对象全部留顶层（§3.4）；实现时可用 §6.4 的 grep 反向确认 0 命中 |
| R7 | 本任务未实测 `astro build` 的 `Synced content` 阶段 | **有既有记录可依** | `site-refactor-plan.md` §11–§13 已记录该阶段可成功；实现任务 S6 应实跑并留日志 |

---

## 附：本方案的自检（对照 requirements 合约）

| 合约要求 | 本文件位置 | 自检 |
|---|---|---|
| ① 目标分层结构 + 逐文件迁移映射表 | §2（含 §2.1 四问论证、§2.3 全 39 文件逐条） | ✅ |
| 目录选择必须论证（为何该名、是否复用 details/、如何配合 config.ts 集合） | §2.1（四问四答） | ✅ |
| ② 迁移影响面清单（file:line + 同步改成什么 + grep 命令） | §3.1（A1–A19）、§3.2、§3.3、§3.4 | ✅ |
| ② 至少覆盖 config.ts / courses.ts（EXCLUDED 22 + COURSE_COUNT 注释）/ course-structure.ts / mvps.ts / llm-history.ts / c/[slug].astro / knowledge-map.md / README.md / handoff.md / capstone.ts | §3.1 + §3.4；**handoff.md 实测 0 命中**（`grep -nE "capstone\|mvp-spec\|site-refactor-plan\|teaching-style-guide" handoff.md` 无输出） | ✅（handoff 已核查并如实报 0） |
| ③ 内容失真清单（file:line + 实测真值 + 命令 + 修法） | §4 D1–D7 | ✅ |
| ③-a knowledge-map:13 与 courses.ts:262 的「19−2=17」 | D1（+ 实测发现第三处 README.md:34） | ✅ |
| ③-b README「6 个 demo」与真值、口径块是否自洽 | D3（真值 10；README:9 自洽；**courses.ts:278 失真**） | ✅ |
| ③-c 口径块其余数字（15/17/18/205+37/32/rag） | D5（逐条实测，含 176+8+5+16=205 与 22+10+5=37 独立复算） | ✅ |
| ④ 验收判据与不变量（17 路由与 slug 不变；两索引留顶层 + 验证方法） | §6.1 INV-1…INV-9、§6.2 AC-1…AC-8、§6.4 脚本 | ✅ |
| ⑤ 不可迁移项与理由（含 capstone 是否被排除逻辑与页面引用） | §5（含 capstone 专项核实） | ✅ |
| ⑥ 执行顺序与单写者边界 | §7.1/§7.2/§7.3 | ✅ |
| 边界诚实：页面渲染验证留 CI/浏览器目检，不设计依赖本机全量构建的验收 | §6.3（含三类验证归属表 + 禁止写法 + 5 项留 CI 清单） | ✅ |
| 不修改任何被分析文件 | 本文件为**新增**文件；对被分析对象全程只读 | ✅ |
