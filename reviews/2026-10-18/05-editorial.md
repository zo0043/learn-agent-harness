# 编辑与一致性 评审报告（editorial）
- 评审员：editorial｜时间：2026-10-18 23:35（Asia/Shanghai）
- 覆盖声明：
  - 全读（逐行）：`site/src/pages/index.astro`（413 行）、`site/src/pages/learn.astro`（497 行）、`site/src/pages/works.astro`（460 行）、`site/src/pages/details/index.astro`（201 行）、`site/src/data/courses.ts`（331 行）
  - 抽样（列节/行）：`README.md:5-41,34`、`handoff.md:10,14,119,191,199`、`notes/knowledge-map.md:1-20`（口径块）、`site/src/data/course-structure.ts:137,143,211,383-393`、`site/src/data/mvps.ts:11-14,55,97,141,150`、`site/src/pages/404.astro:25-46`、`site/src/components/Header.astro:7-18`、`site/src/utils/ragStats.ts:5`；全仓 grep：`15 域/16 域/十七个/6 个 demo/17 个 demo/术语表/recall@3/![[ ]]`
  - 未读（原因）：`site/src/pages/nav.astro`、`site/src/pages/map.astro`、`site/src/pages/interview.astro`、`site/src/components/Footer.astro`、`site/src/layouts/Base.astro` 仅 grep 未逐行（本轮按 Lead 指示改为有界最小交付，优先落盘；已 grep 的结论标注为「仅 grep」）；`notes/*.md` 19 篇正文未逐行（仅口径 grep）；`site/src/data/*.ts` 除 `courses.ts` 外仅 grep 抽样
- 结论摘要：
  1. **站内「17 个 demo」与全仓口径 6 个具名作品直接对撞**（learn.astro:199/:204、index.astro:112 vs courses.ts:298 / works.astro:62 / knowledge-map 口径块），属对外声明与事实相反（blocker）。
  2. 知识域计数存在 **15 与「十六个」两个并存副本**（handoff.md:199 vs handoff.md:191 / knowledge-map.md 口径块 / index.astro:51）。
  3. **全仓 47 个 md 零图片引用、`viz/` 零产物**，而 README:34 对外承诺「Obsidian vault（LaTeX、mermaid、PNG 全渲染）」，GitHub/仓库读者按此去找图会一无所获（blocker）。
  4. 同一批 6 个目录在**同一站内被叫三种名字**（可运行作品 / 可运行 demo / 具名作品），且**全仓无术语表**可依。
  5. 中英混排与括号全/半角无统一规范（`(…)` 与 `（…）` 并存），站点页与 notes 各自为政。
- 本轮未验证的范围：
  - 线上站点 `https://blog.zero43.top/learn-agent-harness/` 的实际渲染文案（本轮未 curl，未取线上快照与 HEAD diff）。
  - `nav.astro` / `map.astro` / `interview.astro` / `Footer.astro` / `Base.astro` 的用户可见文案未逐行核对（仅 grep）。
  - `notes/*.md` 中 Mermaid 图语法、LaTeX 渲染正确性（属技术/展示视角）。
  - 站内全部相对链接与锚点的可达性全量核（仅核了 favicon 与 works/index/details 的锚点出口，未做全站链接爬取/404 探测）。
- 仓库根在 2026-10-18 23:24 出现一个**非我产出**的未跟踪文件 `t.html`（24263B，内容像是线上首页 HTML dump）；我未创建也未改动它，按宪章 §0.1 提醒 Lead 收尾时一并处置。
  - 术语 grep 只做「出现文件数」级统计（见 EDIT-F5 证据），未逐条判定每处译名是否错误。

---

### EDIT-F1｜站内三处称「17 个 demo」，而全仓口径与站内实际只有 6 个具名 demo（blocker）
- 严重度：blocker
- 对象：`site/src/pages/learn.astro:199`、`site/src/pages/learn.astro:204`、`site/src/pages/index.astro:112`
  - `learn.astro:199`：「…17 个 demo 不是终点作品，而是每个 milestone 的参考答案（参考样本）」
  - `index.astro:112`：「不是读完 17 个 demo 就结束」
- 现象：`17` 是**课程页数**的口径，被误写成 demo 数；同一站点 `/works/` 只列 6 个具名 demo，README 与 knowledge-map 口径块也写 6。
- 证据：
  - `grep -rn "17 个 demo\|6 个 demo\|6 个可运行" --include="*.md" --include="*.astro" . --exclude-dir=node_modules --exclude-dir=.git`
    - → `site/src/pages/learn.astro:199,204`、`site/src/pages/index.astro:112` 命中「17 个 demo」；
    - → `README.md:9`「6 个可运行 demo」、`site/src/pages/404.astro:42`「6 个可运行 demo」命中 6。
  - 口径真源 `notes/knowledge-map.md:15`（口径块内一行）：「**可运行 demo 作品 6** = harness-demo / rag-demo / sandbox-demo / mcp-demo / durable-execution-demo / framework-demo」。
  - 代码真源 `site/src/data/courses.ts:298`：`export const WORK_COUNT = 6;`；`site/src/pages/works.astro:62`：`<h2 class="do-title">{WORK_COUNT} 个可运行作品一览</h2>`。
  - 站内实际列表 `works.astro:46` `const DEMO_ANCHORS = Object.keys(DEMO_RUN_MODE);`，`works.astro:35-42` 的 `DEMO_RUN_MODE` 恰 6 个键（harness/rag/sandbox/mcp/durable/framework），`works.astro` 正文亦只有这 6 个 `<section class="work" id="…">`（另加 whiteboard 与 trajectory 两个配套节）。
  - 全仓 `grep -oP "^\s+slug: '\K[^']+" site/src/data/course-structure.ts | wc -l` → 17（17 正好是课程数，印证 17 是课程口径被挪用）。
- 影响：读者读完 capstone 段会以为仓库里有 17 个 demo 可对照，点进 `/works/` 只找到 6 个，会怀疑自己漏看 11 个或站点残缺——这正是「对外声明与事实相反」。
- 建议方向：把这三处 `17 个 demo` 改为「6 个 demo」或「17 门课对应的参考样本（6 个具名 demo + 白板版）」，并在计数规范里把「课程数」与「demo 数」显式分开写。
- 置信度：高（口径块、代码常量、页面实际列表三方一致指向 6，且 17 可溯源为课程数）。

### EDIT-F2｜知识域计数「15」与「十六个知识域」两个副本并存（high）
- 严重度：high
- 对象：`handoff.md:199`、`handoff.md:191`、`notes/knowledge-map.md` 口径块、`site/src/pages/index.astro:51`
  - `handoff.md:199`：「…**十六个知识域**知识结构已建成」
  - `handoff.md:191`：「六个口径（15 域/17 页/18 卡/6 作品/205+37 题）以 knowledge-map 头部口径块为唯一参照」
- 现象：同一份仓库叙事文档里，191 行写 15 域、199 行写「十六个知识域」；且 `handoff.md:14` 还留有「（knowledge-map 升 16 域）」的历史表述。
- 证据：
  - `grep -rn "15 个知识域\|16 域\|十六个知识域" README.md handoff.md notes/*.md site/src --include='*.md' --include='*.astro' --include='*.ts'` → `handoff.md:10`（15）、`handoff.md:14`（升 16 域）、`handoff.md:119`（15）、`handoff.md:191`（15）、`handoff.md:199`（十六个）、`notes/agent-harness.md:499`（15 域）、`notes/knowledge-map.md:72`（15）、`site/src/data/courses.ts:3`（15）。
  - 口径块真源 `notes/knowledge-map.md:13`：「**知识域 15** = 课程总表 14 编号课 + Harness 架构主线 `agent-harness.md`」。
  - 站内呈现代码 `site/src/pages/index.astro:15` `import { COURSE_COUNT, DOMAIN_COUNT, WORK_COUNT } from '../data/courses';` + `:51`「`{COURSE_COUNT} 课 · 五个阶段 · {DOMAIN_COUNT} 个知识域`」，`courses.ts:278-282` 派生 → 15。
- 影响：对外/对下一位接手者，同一文档给出两个知识域总数且无一处说明「16 是历史状态、15 才是当前冻结值」，读者无法判断哪个是现状。
- 建议方向：`handoff.md:199` 就地改为 15；`:14` 的「升 16 域」补一句「（后用 15 域冻结口径，见 knowledge-map 口径块）」。
- 置信度：高（口径块 + 站点派生代码均为 15，199 行为孤例）。

### EDIT-F3｜README 对外承诺「PNG 全渲染」，但仓库内 47 个 md 零图片引用、`viz/` 零产物（blocker）
- 严重度：blocker
- 对象：`README.md:34`、`viz/`、`notes/*.md`
  - `README.md:34`：「…Obsidian vault（LaTeX、mermaid、PNG 全渲染）。备考 coding agent 岗…」
- 现象：README 把「PNG 全渲染」作为仓库对外特征之一，但实际**没有任何一张 PNG 被引用或存在**；`viz/` 目录只剩 3 个 `.mjs` 脚本，无 PNG/SVG 产物。
- 证据：
  - `ls -la viz` → 仅 `chrome.mjs`(3645B) / `mermaid-check.mjs`(7359B) / `render.mjs`(5024B)，共 3 个文件，**0 个 .png/.svg**。
  - `find . -name "*.png" -not -path "./node_modules/*" -not -path "./.git/*" | wc -l` → **6**，逐条 `find` 输出全部落在 `*/node_modules/` 下（framework-demo/node_modules、site/node_modules 的依赖包图标），**仓库自身资产为 0**。
  - notes 侧三种图片语法全部为 0：
    - `grep -rn '!\[\[' notes --include='*.md' | wc -l` → 0（Obsidian 嵌入）
    - `grep -rn '!\[' notes --include='*.md' | wc -l` → 0（markdown 图片）
    - `grep -rn '<img' notes --include='*.md' | wc -l` → 0
  - site 侧唯一资产引用是 `site/src/layouts/Base.astro:26` 的 `favicon.svg`，且 `ls -la site/public/favicon.svg` → 存在（282B，此项无问题）。
  - 备注：`notes/` 内有 63 个 ```mermaid 代码块（`grep -rc '```mermaid' notes --include='*.md' | awk -F: '{s+=$2} END{print s}'` → 63），渲染依赖站点的 mermaid.ts，与「PNG」无关。
- 影响：README 是 GitHub 访客的第一入口，也是求职材料的「作品说明」。承诺 PNG 全渲染却一张都没有，访客会判定仓库言过其实或图在迁移中丢失；若作者本意是「Mermaid 渲染在站点里」，则该句措辞与事实不符。
- 建议方向：要么把「PNG 全渲染」改为「Mermaid 由站点构建期渲染」（与 63 个 mermaid 块相符），要么补齐 `viz/` 产物并给出引用点；二选一，不留悬空承诺。
- 置信度：高（路径与语法三条 grep 均为 0，`viz/` 目录实地列举）。

### EDIT-F4｜同一批 6 个目录在同一站内被叫三种名字：可运行作品 / 可运行 demo / 具名作品（medium）
- 严重度：medium
- 对象：`site/src/pages/index.astro:145`、`site/src/pages/works.astro:62`、`site/src/pages/404.astro:32`、`site/src/pages/404.astro:42`、`README.md:9`
  - `404.astro:32`：「全部内容总览：六个可运行作品、课程卡与进度。」
  - `404.astro:42`：「6 个可运行 demo 与实测记录（轨迹、OTel、压缩自测）。」
- 现象：同一页面 10 行内把同一对象先叫「六个可运行作品」又叫「6 个可运行 demo」；首页/作品页统一用「作品」，README 用「demo」，代码注释另称「具名作品」。数字 6 一致，但名词不统一。
- 证据：
  - `grep -rn "个可运行作品\|个具名作品\|个可运行 demo\|6 个作品" site/src README.md --include='*.astro' --include='*.ts' --include='*.md'` → `index.astro:145`（可运行作品）、`works.astro:62`（可运行作品）、`404.astro:32`（可运行作品）、`404.astro:42`（可运行 demo）、`README.md:9`（可运行 demo）、`courses.ts:285`（「可运行 demo 作品口径：六个具名作品目录」）、`mvps.ts:11/97/141/150`（可运行作品 / 6 个作品）。
  - 同一英文词在站点另有含义分裂：`works.astro:30-34` 的 `RUN_MODES` 用「demo」指**单个演示命令/节**（`'harness-demo'` 等目录名亦以 demo 结尾），而 knowledge-map 口径块用「demo 作品」指**目录整体**——「demo」一词承担了两种粒度。
- 影响：读者无法从名词判断「作品 / demo / 具名目录」是否同一集合；对「6 还是 10」这类口径争议（有 `npm run demo` 的目录实测 10 个）没有名词护栏，容易被误读。
- 建议方向：定一个规范名（建议「作品」＝具名目录整体，「demo」＝单次可运行演示），`404.astro:42` 与 README 同步，并在口径块写明。
- 置信度：高（grep 命中同一站内两处不同称谓，引文即证据）。

### EDIT-F5｜全仓无术语表/名词表，同一概念的译名靠各文件自觉（medium）
- 严重度：medium
- 对象：全仓（无对象即问题本身）；对照点 `site/src/pages/works.astro:367-375`、`site/src/pages/index.astro:157`、`notes/multi-agent.md:262`
  - `works.astro` 轨迹节标题：「轨迹可视化 · harness-demo 真实 demo」；同段 `trajectory.file` 用英文
  - `notes/multi-agent.md:262`：「完整轨迹 schema 见 `harness-demo/trajectories/demo.jsonl`」
- 现象：无任何词汇表/术语表，harness（保留英文）、轨迹/trajectory（中英并用）、权限门/permission gate、沙箱/sandbox、拒答/abstain 各自在不同文件里择一，未声明「首次出现写全称、后文用简称」。
- 证据：
  - `grep -rln "术语表\|名词表\|Glossary" --include="*.md" --include="*.astro" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=analysis` → **唯一命中 `reviews/2026-10-18/00a-上轮问题回归核对.md`（评审产物，非仓库内容）**，即仓库内容侧 0 命中。
  - 出现文件数（只读统计）：`harness` site 17 / notes 40；`轨迹` site 9 / notes 19；`trajectory` site 4 / notes 1；`权限门` site 6 / notes 19；`沙箱` site 8 / notes 35；`拒答` site 2 / notes 6；`评测` site 10 / notes 31；`eval` site 5 / notes 23。
  - 同句并置例：`notes/evaluation.md:27`：「**轨迹（trajectory）也要评**」——此处做了并置解释，但全仓仅此一处，属偶然而非规范。
- 影响：站点要面向「求职作品」读者（外部访客、面试官），术语不统一会让同一概念在首页/作品页/笔记里看起来像三样东西；新增内容也无护栏可依。
- 建议方向：在 `notes/knowledge-map.md` 命名总表旁加一小节「术语表」（10–15 条，给定中英对应与首选写法），并在站点 footer 或 `/nav/` 指向它。
- 置信度：高（术语表 grep 0 命中于仓库内容，命名规则仅覆盖课程名 `knowledge-map.md:19-21`）。

### EDIT-F6｜中文标题与正文里半角括号/冒号与全角并存，且无规范可依（low）
- 严重度：low
- 对象：`notes/knowledge-map.md:1`、`handoff.md:119`、对照 `site/src/pages/learn.astro:79-80`
  - `notes/knowledge-map.md:1`：「# 知识点总地图(面试导向:coding agent)」——中文标题里用半角 `(` 与半角 `:`
  - `handoff.md:119`：「### 4.1 知识点总览(15 个知识域 + 面试结构)」
- 现象：仓库文档对外标题惯用半角括号+半角冒号，而站点页面正文统一用全角（如 `learn.astro:115`「{stage} · {STAGE_LABELS[stage]}」、`learn.astro:116`「{STAGE_DESC[stage]} · {STAGE_COUNTS[stage]} 门课」），两套排版风格没有一处声明谁为准。
- 证据（仅阅读 + 抽样 grep）：
  - `sed -n '1,3p' notes/knowledge-map.md | cat -A` → 首行 `# 知识点总地图(` 为半角 `(`（ASCII 0x28，cat -A 未显示全角 M-（）。
  - `sed -n '119p' handoff.md` → `### 4.1 知识点总览(15 个知识域 + 面试结构)`，同为半角。
  - 尝试用 `grep -rnP '[\x{4e00}-\x{9fa5}],[\x{4e00}-\x{9fa5}]' site/src/pages/*.astro` 抽「中文间半角逗号」→ 站点页 **0 命中**（站点侧干净），问题集中在 notes/handoff 侧标题。
- 影响：只影响观感与「这个仓库的文字有没有统一把关」的判断，不导致错误行动；但求职作品的首要读者会先看标题级排版。
- 建议方向：定一条排版规范（中文语境一律全角标点、中英文之间加空格），先在 `knowledge-map.md` 与 `handoff.md` 的标题级位置落地。
- 置信度：中（抽样而非全量；站点页 0 命中是实测，notes 侧只抽了 2 个标题）。

### EDIT-F7｜`details/index.astro` 把「8 篇」写成字面量，同页另有由 `items.length` 派生的写法（low）
- 严重度：low
- 对象：`site/src/pages/details/index.astro:50`、`:58`
  - `:50`：「课程之外的延伸详解：<strong>{items.length} 个资深分水岭</strong>」（派生）
  - `:58`：「<h2 class="dx-index-title">8 个分水岭一览</h2>」（硬编码）
- 现象：同一页两处指同一个集合，一处派生一处手写；首页 `index.astro:215/227`（「详解：8 个资深分水岭」「查看全部 8 篇」）也是硬编码 8。当前 `notes/details/` 恰 8 篇（`ls notes/details/` → 01…08 共 8 个 .md），**当前不矛盾**，但新增第 9 篇时该页会出现「9 个资深分水岭」与「8 个分水岭一览」并存。
- 证据（仅阅读 `path:line`）：上述四处引文；`ls notes/details/` 输出 8 个文件。
- 影响：属「生成器/显示值」纪律问题（改显示值不改生成器，重生成即回退）——此刻不误导读者，但违反仓库自定的「不再手抄数字」原则，下一次内容增长即失效。
- 建议方向：`:58` 与首页两处改为 `{items.length}` 派生（或从共享 data 常量取），与 `:50` 同源。
- 置信度：高（引文对读即可确认硬编码与派生并存）。

---

## 正面确认

1. **课程页数 17 全链路自洽**：`notes/*.md` 顶层实测 19（`ls notes/*.md | wc -l` → 19），`courses.ts:269` 的 `COURSE_COUNT = COURSES.filter(c => c.slug !== 'whiteboard').length` → 17，`course-structure.ts` 的 slug 实枚举 17 个（`grep -oP "^\s+slug: '\K[^']+" … | wc -l` → 17，且 17 个 slug 对应的 `notes/<slug>.md` 逐个 `[ -f ]` 全部存在，无一 MISSING），首页 `index.astro:51/257` 与 learn 页 `learn.astro:67` 均引用同一常量。未发现 17 这条口径有矛盾副本（唯一的 17 误用见 EDIT-F1，指的是 demo 数）。
2. **rag-demo 评测数字是单源派生，未见漂移**：`recall@3=0.31 / 132 chunks / PASS 3/8` 在 `README.md:14`、`course-structure.ts:137,143,211`、`mvps.ts:55`、`courses.ts:63-64` 的明文副本与 `notes/rag.md §13` 完全一致；站点两处（`index.astro:165`、`works.astro:175-177`）走 `parseRagStats(ragEntry.body)`（`index.astro:29-31`、`works.astro:13-16`，失败即构建失败），`ragStats.ts:5` 还留存旧值 1.00→0.31 的划改记录。这是全仓数字纪律做得最好的一处。
3. **404 页「顶栏八个导航项」与 Header 实际项数相符**：`404.astro:46`「直接点顶栏八个导航项」，`Header.astro` 导航数组 `:7,10,11,12,13,14,15,18` 恰 8 项（首页/导航/题库/学习路线/详解/作品/知识地图/时间线）。
4. **站内唯一图片资源可达**：`Base.astro:26` 引用 `favicon.svg`，`site/public/favicon.svg` 实存（282B）。全站无其它图片引用，故不存在「引用了不存在的 PNG」这类断图（与 EDIT-F3 是同一事实的两面：不是断链，而是从未有图）。
5. **works 页锚点出口全部有对应 id**：`DEMO_ANCHORS`（6 个）与正文 `id="harness-demo"` … `id="framework-demo"` 一一对应，`works.astro:46` 从 `DEMO_RUN_MODE` 派生而非手抄；`index.astro` 指向的 `works/#whiteboard`（链在 `index.astro:152` 的卡片与 `:196` 的 `depth-foot`）与 `#trajectory`（`works.astro:367`）在目标页均有对应 `id`（`works.astro:197`、`:367`）。

## 转交他人

- `notes/` 内 63 个 Mermaid 块、「PNG 全渲染」承诺与站点 mermaid.ts 的实际渲染结果 —— 建议交 `presentation`（线上渲染实测）与 `tech-core`（mermaid 语法正确性）。
- 「有 `npm run demo` 的目录实测 10 个」这一真值（`courses.ts:289-295`、`works.astro:411-413`）是否仍成立 —— 建议交 `presentation` 或 `verifier` 实跑 `grep -l '"demo"' */package.json` 复核。
- `learn.astro:209` 把 `notes/process/capstone-blueprint.md` 写成 `<code>` 而非链接，读者点不进去 —— 属站内可达性，建议交 `presentation`。
- `learn.astro:177` 写「线性阅读序 #1→#17」，但 `COURSE_STRUCTURE` 首项是 `llm-timeline`（横向资产）——「#1」是否指它，属教学路径口径，建议交 `pedagogy`。
- 课程卡数 `CARD_COUNT = 18`（`courses.ts:272`）全仓无任何页面消费，仅存在于注释/口径块 —— 是否应删除或标注，建议交 `tech-core`。
