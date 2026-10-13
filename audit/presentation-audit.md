# 展示审计报告：site/ 全站页面、组件与呈现管线

- 审计对象：`site/`（Astro 5.18.2 + `src/styles/global.css` + 少量原生 JS，GitHub Pages 部署）
  - 页面：`index` / `works` / `learn` / `map` / `timeline` / `interview` / `details` / `details/[slug]` / `c/[slug]`
  - 组件：`src/components/{Header,Footer,Mermaid,StatusBadge,TrajectoryTimeline}.astro`
  - 布局：`src/layouts/Base.astro`；数据：`src/data/{courses,trajectory}.ts`
  - 渲染管线：`src/utils/{md,toc}.ts`、`src/content/config.ts`、`astro.config.mjs`、`build.sh`
- 审计方式：**只读**。未修改任何被审计文件；唯一新增文件为本报告（`audit/` 目录此前已由内容审计创建）。
- 与 `audit/content-audit.md` 的分工：那份管**内容数字与事实**（recall 值、压缩数字等）；本报告管**展现信息**——信息架构、导航、排版、渲染管线失效风险、响应式/暗色/可访问性，以及更好的展示形式。两处都提到的数字问题只在本报告点「展示层为何放大它」，不重复其改法。
- 验证口径分级：
  - **✅ 实跑验证**：本审计实际执行命令并记录输出（构建、`unified` 管线复现、对比度计算、`capped` 复现）。
  - **✅ 静态验证**：逐行读源码 + 文件计数/交叉比对。
  - **⚠️ 本机不可验**：需完整 `astro build` 产物或浏览器渲染，本机无法完成，已明确标注。

---

## ① 构建验证结果

### 1.1 环境事实

| 项 | 值 |
|---|---|
| `site/node_modules` | **存在**（327 个顶层包），无需 npm install |
| Astro 版本 | `astro v5.18.2`（`./node_modules/.bin/astro --version` 实测） |
| Node | v26.8.2（满足 build.sh 的 ≥18 检查） |
| 机器 | 2 vCPU / 3.4 GB 总内存 / 2.0 GB swap；`free -m` 实测 available ≈ 1.9 GB |
| `site/dist` | 曾被 gitignore（`site/.gitignore:2`），非仓库跟踪文件 |

### 1.2 `cd site && npm run build` —— **失败，exit 125**

完整输出（`/tmp/site-build.log`）：

```
> learn-agent-harness-site@0.1.0 build
> bash build.sh

[capped] passwordless sudo unavailable - running WITHOUT caps:
nice: a command must be given with an adjustment
Try 'nice --help' for more information.
EXIT=125
```

**根因（✅ 实跑复现，与本站代码无关）**：`build.sh:31-39` 在 `command -v capped` 命中时 `exec capped ./node_modules/.bin/astro build`。本机 `/usr/local/bin/capped` 的 `run_plain()` 分支有 bug——`sudo -n true` 失败（容器内 `no new privileges` 标志使 sudo 不可用，`sudo -n true` exit 1）后走 `run_plain "passwordless sudo unavailable"`，而该函数 `why=$1; shift` 之后 `$@` 已空，于是 `exec nice -n 10`（无命令）→ nice 报 "a command must be given with an adjustment" → 125。

用最短命令复现（`cd /tmp && CAPPED_NICE=10 capped /bin/echo hello`）得到完全相同的两行错误与 exit 125。**结论：这是宿主工具链缺陷，不是站点缺陷**；CI（ubuntu-latest，无 `capped`）走 `exec "$ASTRO" build "$@"` 原样分支，不受影响。

### 1.3 绕过 capped 直接 `astro build` —— **失败，OOM**

| 尝试 | 命令 | 结果 |
|---|---|---|
| A | `npm run build:fast`（默认堆） | `building client (vite)` 阶段 `FATAL ERROR: Ineffective mark-compacts near heap limit ... JavaScript heap out of memory`，**exit 134**（堆在 513 MB 处撞顶） |
| B | `NODE_OPTIONS=--max-old-space-size=2600 astro build` | 同一阶段被 **SIGKILL，exit 137**（cgroup/系统级 OOM，非 V8 堆上限） |
| C | `NODE_OPTIONS=--max-old-space-size=1800 nice -n 19 astro build` | 卡在 `building client (vite) / [vite] transforming...` 无进展，被手动终止 |

三次均停在同一行：

```
 building client (vite)
13:59:45 [vite] transforming...
```

即 `Building static entrypoints` / `[vite] ✓ built` 已通过，**卡在 client bundle 的 transform 阶段**。这与 `build.sh:32-37` 注释预言的现象一致（vite transform 阶段内存峰值超 1.5 G，1500M 硬上限下被 SIGTERM，日志正好停在 "building client (vite) / [vite] transforming..."）。但注释给的解（抬到 1800M）在本机当前可用内存（≈1.9 GB，且已被其他服务占用）下**不够**——attempt B 给到 2600 MB 仍被系统 OOM killer 杀掉。

**⚠️ 本机不可验**：因此本次审计**无法获得完整构建产物**，"错误/警告/产物大小"这一项只能给出上半程结论：

- 内容层与 SSR 层**无错误、无警告**（`[content] Synced content` / `[build] ✓ Completed in 824ms` / `[vite] ✓ built in 3.39s` 全绿）。
- 客户端 bundle 阶段在本机 OOM 风险高（当时两次 attempt 均在 vite transform 阶段被杀；**2026-10-13 t21 独立实测：本机全量构建可约 17 分钟成功（首次 560s 超时被杀非 OOM）——「必然 OOM」不成立，本机可行但不可依赖，可靠路径是 CI**），**不是站点代码错误**（AST 已编译通过、`dist/pages/*.astro.mjs` 与 `dist/chunks/*` 已生成）。
- 可参考的已生成物：`site/.astro/`（上次成功构建的中间产物，含 `chunks/_astro_data-layer-content_*.mjs`，即全部 SSR 后 HTML 字符串）与本次半程 `dist/`。本报告的渲染管线结论大量基于对 `site/.astro/chunks/_astro_data-layer-content_DBxbNg_o.mjs` 的静态核对（40 个 `<pre class="astro-code astro-code-themes">`、62 个 `<div class="mermaid">`，与 `notes/` 中 62 个 ` ```mermaid ` 围栏精确对应 → **markdown 管线本身无丢失**）。

### 1.4 一个被构建失败放大的运维风险（P1，见 F-12）

`astro build` 会**先清空 outDir**。本次三次失败构建把 `site/dist/` 里原有的完整产物（10-11 22:04 成功构建：`index.html` 13063 字节 + `c/ details/ interview/ learn/ map/ timeline/ works/` 全量页面）**抹成了只有中间产物、0 个 HTML**（`find site/dist -name '*.html' | wc -l` = 0）。

因为 `dist/` 在 `.gitignore` 中、CI 每次重新构建，这不会污染仓库；但**本机若曾用 `site/dist` 做本地预览/验证，一次失败构建就会让它静默变成空站**，且不留任何报错指向"你的产物被删了"。

---

## ② 发现列表

> 严重度定义：**P0** = 对外门面上可被当场证伪的错误 / 让内容根本看不到；**P1** = 结构性不一致或静默失效，持续损害可信度与可用性；**P2** = 细节体验与一致性问题。

### P0

#### F-01 【P0】rag-demo 评测数字在展示层全面过期：站点仍宣称 recall@3=1.00，实际复测 0.31
- **证据**：`site/src/pages/index.astro:42`（"10 题 golden set 评测（85 chunks，recall@3=1.00）"）；`site/src/pages/works.astro:78`（"85 chunks"）+ `works.astro:93-97`（三个大数字 1.00 / 0.94 / 1.00）；`site/src/data/courses.ts:63-64`（intro 与 interviewAngle 两处 recall@3=1.00）。
- 正确值（`notes/rag.md:293-295`）：recall@3=0.31 / @5=0.44 / @10=0.50，PASS 3/8，132 chunks；旧值已明令作废（"旧版宣称的 recall@3=1.00 / @5=0.94 出自 2026-10-10 的「行号指针」golden set……已废"）。`notes/interview-bank.md:151` 已启用新值。
- **问题**：内容审计 C-01 已实跑 `npx tsx src/evaluate.ts` 证实。**展示层是放大伤害的那一层**——首页 hero 下方的作品卡和 /works 的 `eval-stats` 大数字是全站最醒目的位置，读者第一眼看到的就是作废数字；而 `/c/rag/` 课程页渲染同一份笔记却显示 0.31。**同站两页互相打脸**，且面试官让现场跑 `npm run demo:eval` 即穿。
- **建议修法**：以 `notes/rag.md:293` 为唯一数字源，改 `index.astro:42`、`works.astro:78/93-97`、`courses.ts:63-64`。同时把这三个数字从手写文本改为从笔记/评测产物派生（见提案 P-01），否则下次复测还会再漂一次。

#### F-02 【P0】`/c/rag/` 与 `/c/evaluation/` 等页的 `$...$` 假公式：把"= $7 + 4 = 11$ 对"渲染成 KaTeX 数学公式
- **证据（✅ 实跑复现）**：用站点同款管线（`remark-parse + remark-math + remark-rehype + rehype-katex`，与 `astro.config.mjs:25-31` 一致）处理 `notes/evaluation.md:371` 原文：
  - 输入：`- **内容稳定**（两序都选同一项）= $7 + 4 = 11$ 对，占 55%`
  - 输出：`<span class="katex">...<annotation encoding="application/x-tex">7 + 4 = 11</annotation>...`
  - 即 **"7 + 4 = 11" 被当成行内公式排成数学体**，而它本意是"7 加 4 等于 11 对"。
- 同类假阳性位置：`notes/evaluation.md:314`（"对角线和 $= 26 + 11 = 37$"）、`notes/evaluation.md:372`（"$8 + 1 = 9$ 对"）。`rehype-katex` 配 `throwOnError:false`（`astro.config.mjs:27`）所以不报错、不中断构建——**静默地把散文渲染成公式**。
- **对照**：`notes/evaluation.md:223` 的"成本 < $2"、`notes/model-basics.md:335` 的"$0.01"、`notes/mcp.md:317` 的 `$PATH` 均**不会**被误判（已实跑验证：无 `math-inline`），因为不成对。所以这是**成对 `$` 的误食**，只影响上面三行，但错得很难看。
- **建议修法**：内容侧把这三行的 `$` 改成中文"7 + 4 = 11 对"或加转义 `\$`；管线侧（若想根治）给 `remark-math` 关掉 singleDollarText（`remarkMath` 无此选项，可换 `micromark-extension-math` 的 `singleDollar: false`），只保留 `$$` 显示公式——本站真实公式全是 `$$`（`api-engineering.md:203`、`durable-execution.md:92`、`evaluation.md:43/284`）与少量 `$p_o$` 这类单符号，损失极小。

#### F-03 【P0】首页作品计数三处互斥：hero"6 个" vs 标题"五个作品" vs 统计卡"5"（卡片实际 6 张）
- **证据**：`site/src/pages/index.astro:13`（hero "**6 个可运行作品**"）；`index.astro:23` 注释（"作品（5 个可运行 demo）"）；`index.astro:25`（section 标题"**五个作品**"）；`index.astro:27-84` 实际渲染 **6 张卡片**；`index.astro:177-179`（统计卡"**5** 可运行作品"）。同站 `site/src/pages/interview.astro:110`（"/works/ 看 **5 个作品**"）。
- **问题**：同一页面三个数字（6 / 五 / 5）；"可运行作品"在全仓无统一定义（5 / 6 / 7 / 9 四种口径并存：`works.astro` 有 7 个作品 section + 轨迹 + Roadmap；`README.md:9-19` 作品表 9 行）。
- **建议修法**：冻结定义"**6 个可运行 demo 作品**"（有 `npm run demo` 的目录）；index 四处 + interview:110 全改 6；`works.astro` 导言补一句计数口径；README 作品表拆"6 个可运行 demo"与"配套资产（whiteboard / viz / site）"。（与内容审计 C-03 同一事实，此处强调它是**展示层手抄数字**的典型，见提案 P-01。）

### P1

#### F-04 【P1】暗色模式下代码块仍是白底黑字——`global.css:488` 的注释与事实相反
- **证据（✅ 静态 + 产物核对）**：
  - `site/src/styles/global.css:488` 注释写："shiki 代码块（**双主题变量由 Astro 注入，随 data-theme 切换**）"。
  - 但 `global.css` 中**没有任何规则消费 `--shiki-dark`**（`grep -c shiki-dark dist/_astro/_slug_.BsSf02dF.css` = 0；`grep shiki src/styles/global.css` 只命中那条注释本身）。
  - `site/.astro/chunks/_astro_data-layer-content_DBxbNg_o.mjs` 中实际注入的是：`class="astro-code astro-code-themes github-light github-dark" style="background-color:#fff;--shiki-dark-bg:#24292e;color:#24292e;--shiki-dark:#e1e4e8"` —— **亮色写死在内联 style 上，暗色只以变量形式存在，无人使用**。
  - shiki 3.23 的 `defaultColor` 默认为 `'light'`，双主题不会自动随 `prefers-color-scheme` 或任意属性切换；`@astrojs/markdown-remark/dist/shiki.js:37-60` 只做 hast 转换，不生成切换 CSS。
- **问题**：全站 40 个代码块，在用户点了右上角月亮（`Base.astro:52-65` 把 `data-theme="dark"` 写到 `<html>`）之后**依旧是白底 `#fff` + 深字 `#24292e`**，夹在 `--bg-card:#1a2027` 的暗色页面里像一块膏药。mermaid 反而做对了（`src/scripts/mermaid.ts:8-10,39-41` 会按 `data-theme` 重渲染），代码块没做。
- **建议修法**（二选一，工作量均小）：
  1. 在 `global.css` 补一条消费规则：
     ```css
     :root[data-theme='dark'] pre.astro-code,
     :root[data-theme='dark'] pre.astro-code span { color: var(--shiki-dark); }
     :root[data-theme='dark'] pre.astro-code { background-color: var(--shiki-dark-bg); }
     ```
     （`--shiki-dark` / `--shiki-dark-bg` 已由 Astro 内联在每个 pre 上，直接可用。）
  2. 或在 `astro.config.mjs:28-30` 的 `shikiConfig` 里显式给 `defaultColor: false` 并自行写两套规则（更可控但更啰嗦）。
  - 同时把 `global.css:488` 那句"随 data-theme 切换"的注释改成实话，或改完代码后让它成为实话。

#### F-05 【P1】`/interview` 与 `/c/interview-bank` 双入口；`/timeline` 与 `/c/llm-timeline` 内容 100% 重复，且 `/timeline` 是残缺版
- **证据**：
  - `site/src/data/courses.ts:261` `EXCLUDED_FROM_COURSE_ROUTE = new Set(['knowledge-map','interview-bank'])` —— 题库与知识地图被正确排除，各有独立页。
  - 但 **`llm-timeline` 不在排除集**：`notes/llm-timeline.md` 同时被 `c/[slug].astro:13-18` 生成 `/c/llm-timeline/`，又被 `timeline.astro:13` 渲染成 `/timeline/`。
  - 两个页面能力不对等：`/c/llm-timeline/` 有 meta-bar（域/阶段/StatusBadge）、面包屑、**侧栏 TOC**（`c/[slug].astro:74-91`）、**相关面试题 3 条**（`c/[slug].astro:43-64`）、`page-foot` 四链接；`/timeline/`（`timeline.astro:20-33`）**只有 meta-bar + 面包屑 + 正文**，无 TOC、无相关题、无页脚。`timeline.astro:5` 的注释自己也承认"llm-timeline 同时在 /c/llm-timeline 作为课程页出现"。
  - `/interview` 侧：`interview.astro:19` 调 `extractToc` 取了目录，但**只用于 `idOf()` 定位锚点，从没把 TOC 渲染出来**（`grep toc.map interview.astro` 为空）——而 `/map` 同样结构却渲染了 TOC（`map.astro:48-65`）。结果是全站最长的一页（`interview-bank.md` 14986 字节，含 §1-§8 + JD 矩阵）**没有侧栏目录**，只能靠页面内锚点跳。
- **问题**：① 同一内容两个 URL，SEO 与分享链接分裂，且用户从 Header"时间线"进去拿到的是功能更少的那版；② `/interview` 长页无目录，与 `/map`、`/c/*` 的阅读体验不一致。
- **建议修法**：把 `llm-timeline` 加进 `EXCLUDED_FROM_COURSE_ROUTE`，`/timeline` 改为从 `courses.ts` 取 meta 后复用与 `/c/[slug]` 相同的布局（或直接 301 到 `/c/llm-timeline/`）；`/interview` 补 TOC 侧栏（代码可完全抄 `map.astro:48-65`）。

#### F-06 【P1】`/learn` 的"总进度"与首页/题库页的课数口径不一致（18 vs 17），"15 域"与实际 17 域不符
- **证据**：
  - `site/src/pages/learn.astro:11` `const total = COURSES.length`，而 `courses.ts` 实有 **18 条**（✅ 静态逐条列出：P0×10 / P1×4 / P2×4 / —×1），其中 `whiteboard` 那条**没有对应 `notes/whiteboard.md`**（`ls notes/whiteboard.md` 不存在），`learn.astro:50-59` 对它走 `isWhiteboard` 分支链向 `/works/#whiteboard`。所以 `/learn` 页面自己渲染出"**18 课**"。
  - 首页 `index.astro:12` 写"**17 课** × **15 知识域**"；`index.astro:165-170` 统计卡写"**17** 课程页"；`interview.astro:115` 写"/learn/ 按 **17 课**过一遍"。
  - "15 域"来源：`learn.astro:10` 注释自述"15 域 = notes/knowledge-map.md 口径：课程总表 14 编号课 + 主线 agent-harness.md"；但 `courses.ts` 里去重后的 domain 实为 **17 个**（✅ 实算：`new Set(domains).size` = 17，含 LLM 时间线 / 行业前线调研 / Harness 架构 三个横向+主线，且 `harness-from-scratch` 与 `whiteboard` **共用同一个 domain "从零写 harness"** → `/learn` 上出现两张同名域卡片）。
  - `notes/knowledge-map.md:62` 自述"合计 15 个知识域"，而 `handoff.md:14` 说"knowledge-map 升 **16** 域"——上游自己也没对齐。
- **问题**：访客在首页读到 17 课 / 15 域，点进学习路线读到 18 课 / 15 域（其中一张卡还不在本站有正文），再点知识地图读到 15 或 16 域。**四个数字三种口径**，且"域"的定义（编号课？含横向资产？含白板作品？）全站没有一处说清。
- **建议修法**：在 `courses.ts` 增加派生量而不是手抄：`courseCount = COURSES.filter(c => c.slug !== 'whiteboard').length`（=17，与 `/c/` 实生成的 17 个路由精确相等：19 个 notes 顶层 md − knowledge-map − interview-bank）、`domainCount = new Set(COURSES.map(c=>c.domain)).size`；首页 hero、统计卡、`interview.astro:115`、`learn.astro:27` 全部改用这两个派生量。同时给 `whiteboard` 一个不冲突的 domain（如"从零写 harness（白板版）"）或从 COURSES 移除、只在 /works 展示，消掉同名双卡。

#### F-07 【P1】`/details` 列表页把 top3 卡片渲染了两次（无去重）
- **证据**：`site/src/pages/details/index.astro:22-25` 定义 `TOP3_SLUGS = ['01-context-rot','02-tool-granularity','07-harness-rot']` 并渲染"面试最常考 top3"区（`:50-72`）；随后 `:74-94` 的"全部详解"区 `items.map(...)` **不过滤 top3**，同一批 3 张卡原文再出现一次。
- **问题**：8 篇详解里 3 篇在首屏并列出现两次；且 top3 卡有 `oneLiner()` 摘要（`:28-40,64`），"全部详解"卡没有（`:82-91` 只渲染 chip + StatusBadge）——同一份内容两种信息密度，视觉上也显得页面在重复。
- **建议修法**：`items.filter(i => !TOP3_SLUGS.includes(i.data.slug ?? i.id))` 渲染"其余 5 篇"；或反过来把 top3 做成"置顶标记 + 排序"，只保留一个列表。同时给"全部详解"卡也调 `oneLiner()`，统一信息密度。

#### F-08 【P1】`/c/[slug]` 元信息条把同一个域名渲染成两个 chip
- **证据**：`site/src/pages/c/[slug].astro:31-32`：
  ```astro
  <span class="chip chip-strong">{meta.domain}</span>
  <span class="chip">{meta.domain}</span>
  ```
- **问题**：17 个课程页顶部都显示"从零写 harness 从零写 harness"这样的重复 chip，一眼像 bug。
- **建议修法**：删掉其中一行；若要保留两格，第二格改显示有信息量的内容（如对应作品 `harness-demo` / 关联笔记文件名）。

#### F-09 【P1】导航"当前位置"在 `/c/*` 与 `/details/*` 上失联，且 Header 无 `/c`、`/timeline` 之外的归属提示
- **证据（✅ 实跑模拟 `Header.astro:15-18` 的 `isActive`）**：
  - `/c/rag/` → **没有任何导航项高亮**（`nav.filter(isActive)` 为空）。
  - `/details/01-context-rot/` → 只有 `/details/` 高亮（正确）。
  - `/`、`/learn/`、`/works/`、`/map/`、`/timeline/`、`/interview/` 均正确。
- **问题**：全站 17 个课程页（内容主体）在导航上**完全看不出自己在哪**；面包屑（`c/[slug].astro:36-38`）说"首页 / 学习路线 / 域名"，但 Header 里"学习路线"并不高亮——两套定位信号互相矛盾。
- **建议修法**：`isActive` 增加规则：`path.startsWith('/c/')` 时高亮"学习路线"（并可在 nav 项上加 `aria-current="page"`，见 F-14）。

#### F-10 【P1】课程页相关面试题锚点用 `encodeURIComponent` 编码中文，但 Astro 生成的 heading id 是未编码中文
- **证据（✅ 实跑）**：`site/src/pages/c/[slug].astro:54`：
  ```astro
  <a href={`${import.meta.env.BASE_URL}interview/#${encodeURIComponent(q.anchor)}`}>
  ```
  对 `courses.ts:38` 的 `BANK.s31 = '31-finhot-幽灵事故权限沙箱事故响应最稀缺故事'` 做 `encodeURIComponent` → `31-finhot-%E5%B9%BD%E7%81%B5...`。
- 浏览器对 fragment 的匹配是按**解码后**字符串比较，所以 `#%E5%B9%BD...` 与 `id="31-finhot-幽灵事故..."` **通常能匹配上**（现代浏览器会 decode fragment）——这一点不是必错。
- **但同一文件的另一处没编码**：`site/src/pages/interview.astro:144` 的 `<a class="q-foot" href={`#${q.anchor}`}>` 直接插未编码中文。两处写法不一致。
- **真正的问题**是 `courses.ts:18` 注释自述锚点是"2026-10-11 build 实测"的**手抄常量**（`BANK` 对象 6 个 id 全硬编码）。一旦 `notes/interview-bank.md` 的标题措辞变动（该文件 10-11 刚改过一次日期口径，动过 11 个文件），这 6 个锚点**全部静默失效**——页面照常构建、照常渲染，只是点击"在下方全文中查看"不跳转。`interview.astro:20-26` 的 `idOf()` 会对顶部复习区锚点抛错（fail-fast，好），但 `courses.ts` 的 `BANK` **没有任何校验**。
- **建议修法**：把 `courses.ts` 的 `BANK` 改为构建期从 `interview-bank.md` 的 TOC 解析（复用 `src/utils/toc.ts` 的 `extractToc`，按 heading 文本前缀匹配，与 `interview.astro:20-26` 同机制），让锚点与笔记标题同源；顺手统一 `encodeURIComponent` 的用法（要么都编码要么都不编码）。

#### F-11 【P1】`Mermaid.astro` 是死代码；62 张 mermaid 图全部无图题、无 `<figure>` 语义
- **证据**：
  - `grep -rn "components/Mermaid\|import Mermaid" site/src/` **为空** → `src/components/Mermaid.astro`（唯一提供 `<figure class="mermaid-figure">` + `<figcaption>` 的组件）从未被任何页面 import。
  - 全部 62 张图走 `astro.config.mjs:11-20` 的 `remarkMermaid` → 裸 `<div class="mermaid">`（✅ 在 `.astro/chunks/_astro_data-layer-content_DBxbNg_o.mjs` 中数到 62 个，与 `notes/` 中 62 个 ` ```mermaid ` 围栏精确相等）。
  - 因此 `global.css:522-535` 的 `.mermaid-figure` / `figcaption` 规则（卡片边框 + 图注居中）**对全站 62 张图无一生效**；图只靠 `global.css:536-547` 的裸 `div.mermaid`  flex 居中。
- **问题**：① 写了不用的组件 + 不生效的 CSS（死代码两处）；② 62 张结构图**没有一张图注**——这些图的说明文字散落在正文段落里（如 `notes/api-engineering.md` "四条路径的全貌（正常只占左边一条）："），图与说明分离，扫读时不知道每张图在讲什么；③ 无 `figure` 语义，屏幕阅读器读到的是个空 `div`。
- **建议修法**：要么删掉 `Mermaid.astro` 与 `.mermaid-figure` CSS（承认不需要），要么把 `remarkMermaid` 升级为产出 `<figure class="mermaid-figure"><div class="mermaid">…</div><figcaption>mermaid</figcaption></figure>`（figcaption 可取围栏 info string 或上一段文字），让 62 张图都有边框与图注。推荐后者——这是本站最重要的内容资产（62 张 vs 40 个代码块）。

#### F-12 【P1】`/map` 是全站唯一"整页 markdown 直排"的知识地图，交互性为零；`/timeline`、`/interview` 三页分工靠注释维持
- **证据**：
  - `site/src/pages/map.astro:2-8` 注释自述"此前是手绘副本（mermaid 依赖图 + 横切表 + 资产表），与 canonical 反复漂移；现改为与 /interview 同模式：从 courses 集合 render knowledge-map.md"。即**从"站点侧结构化页面"退化成"笔记原文渲染"**，换来单一真源。
  - `notes/knowledge-map.md` 是一篇 12807 字节的索引笔记：命名总表（18 行）+ 课程总表（14 行）+ 横切主题表 + mermaid 依赖图（`graph TD`，15 节点 + classDef 四色）。作为"知识地图"页面，它把访客要的"一眼看清 15 个域怎么连"埋在第三屏之后，且依赖图是 mermaid 客户端渲染（`map.astro:5-7` 注释承认依赖 `viz/mermaid-check.mjs` 兜底）。
  - 三页分工现状：`/timeline` = `llm-timeline.md` 原文；`/map` = `knowledge-map.md` 原文；`/interview` = `interview-bank.md` 原文 + 手抄 top15 复习区。三者的"页面级"信息（meta-bar / TOC / 相关题 / 页脚）**各不相同**（/timeline 最少，/map 中等，/interview 最多且无 TOC）。
- **问题**：① "知识地图"这个名字承诺的是**可交互的依赖图**，交付的是长表格；② 三个原文渲染页的页面框架不统一，像三个不同模板；③ mermaid 图若客户端渲染失败（见 F-13），`/map` 的核心价值直接归零——而它现在是唯一的依赖图载体。
- **建议修法**：见提案 P-05（知识地图交互化）与 P-06（三页统一框架）。

#### F-13 【P1】mermaid 客户端渲染是单点：失败只进 console.error + 一个红色文字类，无占位、无兜底、无 noscript 提示
- **证据**：
  - `src/scripts/mermaid.ts:29-35`：`try { await mermaid.run({nodes:[el]}) } catch (err) { el.classList.add('mermaid-error'); console.error(...) }`。
  - `global.css:548-554` 的 `.mermaid-error` 只做 `color: var(--deny); font-family: monospace; white-space: pre-wrap`——即把 mermaid 源码当红字原文摊开，**没有"图加载失败"的人话提示**。
  - `Base.astro:66-69`：仅当 `document.querySelector('.mermaid')` 才动态 `import('../scripts/mermaid.ts')`——省 2 MB bundle 的好设计，但意味着**禁用 JS 的访客看到的是 62 段 mermaid 源码文本**（`div.mermaid` 里就是纯文本，无 `<noscript>` 提示）。
  - `securityLevel: 'strict'` + `flowchart: { htmlLabels: true }`（`mermaid.ts:19,21`）：strict 模式下 htmlLabels 实际被忽略（mermaid 文档：htmlLabels 仅在 `loose`/`antiscript` 生效），而 `notes/agent-harness.md:135-138` 等处大量使用 `<br/>` 标签换行——**这些 `<br/>` 在 strict 模式下不会被解析成换行**，会显示为字面文本或被吞。这是一个"配置项写了但不生效"的静默降级。
  - `viz/mermaid-check.mjs` 的覆盖不全：`SLUGS` 只列 15 个 slug（✅ 实算比对），漏掉 `industry-2026` 与 `llm-timeline`（这两个恰好 0 个 mermaid，所以**当前无实际漏网**，但下次给这两篇加图就会漏检）；且它检查的是"渲染成 svg"，**检查不了 `<br/>` 标签是否被正确解析**。
- **问题**：全站最重要的视觉资产（62 张图）依赖一条"客户端动态 import → mermaid.run → 逐图 try/catch"的链，任何一环出问题只留红字源码；`htmlLabels: true` 在 strict 下是无效配置，`<br/>` 图的渲染质量存疑但无任何检测。
- **建议修法**：① catch 分支把 `el.textContent` 替换为人话（"⚠ 这张图未渲染成功（mermaid 报错），源码：…"），并保留一个可展开的 `<details>`；② 要么把 `securityLevel` 降到 `'antiscript'` 让 `htmlLabels` 真生效，要么把笔记里的 `<br/>` 换成 mermaid 的 `<br>` 兼容写法并加检测；③ `mermaid-check.mjs` 的 `SLUGS` 改为从 `notes/` 目录动态生成（或至少补上两条排除规则的注释说明为何是 15）；④ 给 `.mermaid` 容器加 `<noscript>` 提示。

#### F-14 【P2】可访问性基础项：无 skip-link、无 `:focus-visible` 样式、无 `aria-current`、`--text-faint` 对比度不达标
- **证据**：
  - `grep -n ":focus\|focus-visible\|outline" src/styles/global.css` **为空** → 全站没有自定义焦点样式，靠浏览器默认 outline（部分浏览器在 `border-radius` 元素上几乎看不见）。
  - `Base.astro:46-51` 无"跳到主内容"链接；`<main class="wrap">` 无 `id`/`tabindex`。
  - Header 导航无 `aria-current="page"`（`Header.astro:25-34`），当前页只靠颜色+底色区分（`.site-nav a.active`，`global.css:207-211`）。
  - **对比度（✅ 实算 WCAG 相对亮度）**：`--text-faint: #8b949e` on `--bg: #fbfaf7` = **2.95:1**（AA 要求 4.5:1）；暗色 `--text-faint: #6e7a86` on `--bg: #101418` = **4.22:1**（也不达标）。`--text-faint` 用在 `global.css` 的 **17 处**，包括页脚（`:257`，字号 0.88rem）、`.work-tag`（`:885`）、`.dc-angle`（`:721`）、`.crumbs`（`:770`）、`.q-hint` 之外的说明文字、`.ev-ms`（`:1113`）、`.review-head-note`（`:1247`）等——都是**小字号次要信息**，恰是低视力用户最需要读的。
  - 对照：`--text-soft` 亮色 5.75:1 / 暗色 7.53:1（达标）；`--accent` 亮色 5.24:1 / 暗色 9.94:1（达标）；四个 badge 组合全部 ≥4.47:1（达标）。**只有 `--text-faint` 一族不达标**。
- **建议修法**：`--text-faint` 亮色改 `#6b7280`（≈5.3:1）、暗色改 `#8b98a5`（≈5.6:1），一次改动修 17 处；补 `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`；Header 加 `aria-current={isActive(item) ? 'page' : undefined}`；`<main>` 加 `id="main"` + Header 首位加 skip-link。

#### F-15 【P2】移动端导航是 7 个项 + 品牌 + 主题按钮的 flex-wrap，没有汉堡菜单；sticky header 在小屏可能占掉三分之一首屏
- **证据**：`global.css:166-173`（`.header-inner` flex + wrap）、`:188-193`（`.site-nav` flex-wrap）、`:1346-1352`（560px 断点只把字号降到 0.86rem、padding 降到 4px 8px）。`Header.astro` 无 `<button>` 控制导航展开（唯一的 button 是主题切换 `:36-57`）。
- **问题**：7 个导航项在 375px 宽度下必然折成 2-3 行，加上 brand 与主题按钮，sticky header（`:157-164`，`position: sticky; top: 0`）实测会占到 ~110-130px 高度——在 667px 高的手机上首屏五分之一没有了。没有汉堡菜单，也没有"当前项滚动到可见"的处理。
- **建议修法**：见提案 P-07。

#### F-16 【P2】`/works` 的 7 个 section 全部平铺在一页，无页内导航；长页无阅读进度
- **证据**：`works.astro` 7 个 `<section class="work" id="...">`（`:16/67/110/135/173/207/241`）+ 轨迹 + Roadmap，共 9 个 section，页面极长（源码 313 行，含 6 张表格 + 3 个 runbox + pipeline）。`global.css:876-879` 只给了 `.work { scroll-margin-top: 76px }`（锚点跳转不被 sticky header 遮住），**没有页内目录/标签栏**。
- 全站无阅读进度条（`grep progress src/` 只命中 `scroll-behavior`/`scroll-margin`）、无上下篇导航（`c/[slug].astro:66-71` 的 `page-foot` 是四个平级链接，非 prev/next）。
- **建议修法**：见提案 P-04、P-08。

#### F-17 【P2】正文 measure 失控：`/c/*` 与 `/interview` 的正文行长达 100+ 字符
- **证据**：`global.css:144-148` `.wrap { max-width: 1080px }`；`.course-layout`（`:746-751`）是 `1fr + 232px`，正文栏 ≈ 1080 − 232 − 32 − 40(padding) ≈ **776px**；`.markdown p`（`:421-423`）**没有 max-width/measure 限制**。16px 字号 + 1.75 行高下，中文一行约 **48-55 字**，英文/代码混排更长。
- `/interview` 更差：`interview.astro:85` 的 `<article class="markdown">` **不在 `.course-layout` 里**（无 TOC 侧栏），正文独占 1080px − 40 = **1040px**，行长约为 `/c/*` 的 1.34 倍。
- 首页 hero/导语反而做了 measure（`.hero-sub { max-width: 46em }` `:573`、`.page-lead { max-width: 48em }` `:593`）——**只有落地页守了排版规范，长文页没有**。
- **建议修法**：`.markdown p, .markdown li { max-width: 40em }`（约 640px，中文最佳区间 35-45 字）；`.markdown` 内的表格/代码块/图保持全宽（用 `max-width: none` 覆盖）。工作量小，对 17 篇长笔记的读完率影响最大。

#### F-18 【P2）页面内联 style 散落，样式规则与结构脱钩
- **证据**：`index.astro` 7 处 `style="..."`（`:93/110/115/129/141/155/181`，含 `display:block`、`margin-top:44px`、`color/font-size` 组合）、`works.astro` 14 处、`learn.astro` 4 处。典型如 `index.astro:115/129/141` 三张卡都写 `style="display: block"`——因为 `.card` 默认 `display:flex`（`global.css:303-306`），用作块级容器时必须逐个覆盖。
- **问题**：视觉调整无法在 CSS 里统一收口；`.card` 的 flex 默认值与"当块级容器用"的实际用途冲突，是重复写内联样式的根因。
- **建议修法**：加一个 `.card-block` 类（`display:block`）替代 14 处 `style="display: block"`；其余 margin/color 提升为工具类或并入现有组件类。工作量小，纯清理。

---

## ③ 展示形式改进提案（按优先级排序）

> 每个提案含：解决什么问题 / 大致改法 / 工作量（小 ≤半天、中 1-2 天、大 ≥3 天）/ 优先级。所有提案均**不动被审计文件**，仅在此列出。

### P-01 【P0 · 小】统一数据源：消灭全站手抄数字
- **解决**：F-01 / F-03 / F-06 三类问题的共同根因——首页 hero、统计卡、`interview.astro` 复习动线、`courses.ts` 的 intro/interviewAngle、`works.astro` 的 eval-stats **全是手写常量**，与 `notes/`、`courses.ts`、实际 demo 产物无从同步。本次审计已证实至少 6 处数字互相矛盾（作品 5/6/7/9、课程 17/18、域 15/16/17、recall 1.00/0.31）。
- **改法**：
  1. 在 `src/data/courses.ts` 导出派生量：`courseCount`（排除 `whiteboard`）、`domainCount`（`new Set(domain).size`）、`phaseCounts`、`statusCounts`（`learn.astro:11-14` 已在算，抽出来共享）、`workCount`。
  2. 首页 `index.astro:12-13/25/165-179`、`interview.astro:110/115` 全部改引用派生量。
  3. `works.astro:93-97` 的 rag 评测三数字改为构建期读 `rag-demo` 的评测输出（或从 `notes/rag.md §13` 的表格解析），并加一条"数字生成时间"脚注。
- **工作量**：小（半天）。**优先级 P0**：这是唯一能阻止"下次内容更新后数字再漂一次"的修法；只改数字不改结构，下个月还会复发。

### P-02 【P0 · 小】暗色模式代码块修复
- **解决**：F-04。全站 40 个代码块在暗色模式下白底刺眼；`global.css:488` 注释说谎。
- **改法**：按 F-04 给的两条方案任选（推荐方案 1，三行 CSS）；顺手修正那条注释。可加一条验收：`viz/mermaid-check.mjs` 式的 playwright 检查里断言暗色下 `pre` 的 computed background-color 不是 `rgb(255,255,255)`。
- **工作量**：小。**优先级 P0**：暗色是用户主动选择的模式，选完看到一半页面是坏的，属于"功能承诺未兑现"。

### P-03 【P0 · 小】`$...$` 假公式修复 + 公式渲染策略收敛
- **解决**：F-02。三行散文被排成数学公式；同时全站公式渲染策略（`remark-math` 的 singleDollar）没有人为它做过决定。
- **改法**：内容侧改 `notes/evaluation.md:314/371/372` 三行；管线侧把行内公式限定为"已知符号模式"或直接关 singleDollar（本站真实公式以 `$$` 为主，单符号如 `$p_o$` 可用 `\(...\)` 显式标注）。
- **工作量**：小。**优先级 P0**：与外露的错误数字同级——都是"访客一眼看出这是错的"。

### P-04 【P1 · 小】全站搜索
- **解决**：27 篇笔记 / 628KB / 17 个课程页 + 8 个详解页，目前**唯一的检索手段是 Header 7 个导航项**（`grep -rn "search\|pagefind\|lunr\|fuse" site/src` 为空 → 确认零搜索）。访客想找"幂等键"、"recall@k"、"egress 白名单"这类具体概念时，只能逐页翻或回 GitHub 用站外搜索。
- **改法**：`@pagefind/search`（Astro 官方集成，构建期索引 `dist/*.html`，零服务端依赖，适配 GitHub Pages）。Header 加一个搜索入口（`/` 快捷键唤起），结果页用现有 `.card` 样式。27 页体量下索引体积可忽略。
- **工作量**：小（半天，含样式对齐）。**优先级 P1**：本站是"备考资料库"形态，检索是刚需；且 628KB 纯文本对 pagefind 毫无压力。

### P-05 【P1 · 中】知识地图交互化
- **解决**：F-12。"知识地图"这个名字承诺依赖图，交付的是 12.8KB 长笔记直排；且依赖图是 mermaid 客户端渲染的单点（F-13）。
- **改法**：
  1. `/map` 顶部新增一块"15 域依赖图"交互区：从 `courses.ts` 派生节点与边（或在 `knowledge-map.md` 的 mermaid 之外补一份 `src/data/graph.ts` 结构化边表），用轻量 SVG/Canvas 渲染（可继续用 mermaid 但加 `click` 事件 → 跳 `/c/<slug>/`，注意 `securityLevel: 'strict'` 会禁 `click`，需配合 F-13 一并调整）。
  2. 节点按 `status` 着色（复用 `.legend-dot.ok/.doing/.todo` 三色，`global.css:1205-1223` 已有），hover 显示 intro + 面试视角。
  3. 下方保留笔记原文（单一真源不变），但把"命名总表 / 课程总表 / 横切主题"三个表格前面各加一个页内锚点导航。
- **工作量**：中（1-2 天）。**优先级 P1**：这是本站区别于"普通博客"的核心资产，目前被埋没了。

### P-06 【P1 · 中】三个原文渲染页（/map /timeline /interview）统一页面框架
- **解决**：F-05 / F-12。三个页面的 meta-bar / TOC / 相关题 / 页脚各不相同；`/timeline` 是 `/c/llm-timeline` 的残缺副本；`/interview` 无 TOC 而 `/map` 有。
- **改法**：抽一个 `NotePageLayout.astro`（meta-bar + 面包屑 + 正文 + TOC 侧栏 + `page-foot` + 可选"相关面试题"），三个页面全部改用它；`llm-timeline` 加入 `EXCLUDED_FROM_COURSE_ROUTE` 消除双入口。
- **工作量**：中。**优先级 P1**：一致性修复，且是 P-05 的前置（否则交互区要写三遍）。

### P-07 【P1 · 中】移动端导航改造
- **解决**：F-15。375px 下 7 项 flex-wrap 把 sticky header 撑到 ~120px。
- **改法**：≤720px 时把 `.site-nav` 收进汉堡按钮（`<button aria-expanded>` + `<div hidden>`），品牌 + 主题按钮 + 汉堡留在顶栏；展开面板用 `position: absolute` 浮层（不推开内容）。保留"题库"项的强调色（`.site-nav a.featured`，`global.css:213-227`）。可访问性：按钮 `aria-controls`/`aria-expanded`，Esc 关闭，焦点陷阱。
- **工作量**：中。**优先级 P1**：本站流量大概率以移动端分享链接为主（GitHub/面试场景），首屏被导航吃掉五分之一是硬伤。

### P-08 【P1 · 小】阅读进度 + 上下篇导航
- **解决**：F-16。17 篇课程笔记平均 ~35KB（最大 `mcp.md` 47KB），`/c/*` 页无进度反馈、无顺序阅读路径；`/works` 9 个 section 无页内导航。
- **改法**：
  1. `Base.astro` 加 2px 顶部进度条（`scroll` 监听 + `transform: scaleX()`，`prefers-reduced-motion` 时禁用平滑）。
  2. `c/[slug].astro` 的 `page-foot`（`:66-71`）左侧改"← 上一篇 / 下一篇 →"（顺序取 `COURSES` 数组，或按 phase 分组内顺序），右侧保留现有的四个横向链接。
  3. `/works` 顶部加一行 sticky 页内标签栏（7 个作品锚点 + Roadmap），复用 `.chip` 样式。
- **工作量**：小。**优先级 P1**：长文站的标配，成本极低。

### P-09 【P2 · 小】mermaid 图题 + `<figure>` 语义 + 失败兜底
- **解决**：F-11 / F-13。62 张图无图注、无语义、失败只留红字源码、禁 JS 时是源码文本。
- **改法**：`remarkMermaid` 改为产出 `<figure class="mermaid-figure"><div class="mermaid">…</div><figcaption>{info string 或自动编号}</figcaption></figure>`，让已存在的 `.mermaid-figure` CSS 与 `Mermaid.astro` 组件（二选一，另一个删掉）真正生效；catch 分支改人话提示；容器加 `<noscript>`。
- **工作量**：小-中。**优先级 P2**（但若 P-05 要做交互图，此项应合并进 P-05 一起做）。

### P-10 【P2 · 小】正文 measure 与排版规范收口
- **解决**：F-17。长文页行长 776-1040px，超出中文舒适区。
- **改法**：`.markdown p, .markdown li { max-width: 40em }`，表格/代码/图 `max-width: none`；顺带把 `hanging-punctuation`（`global.css:123-127`）保留、给 `.markdown h2/h3` 加 `scroll-margin-top: 76px`（现在只有 `.work` 有，`:878`，课程页 TOC 跳转会撞 sticky header）。
- **工作量**：小。**优先级 P2**：体验收益大但非缺陷。

### P-11 【P2 · 小】可访问性三件套
- **解决**：F-14。`--text-faint` 17 处对比度 2.95:1 不达标；无 skip-link；无 `:focus-visible`；无 `aria-current`。
- **改法**：按 F-14 的四条改法执行。可加一条自动化：playwright 检查里对每个页面跑 `axe-core`（`viz/mermaid-check.mjs` 已有浏览器基建，扩展成本低）。
- **工作量**：小。**优先级 P2**：`--text-faint` 一条其实值得提前（一次改 17 处）。

### P-12 【P2 · 小】课程/作品筛选与标签
- **解决**：`/learn` 18 张卡按 P0/P1/P2 平铺，`/works` 7 个作品平铺；访客想按"我有兴趣的域"或"已完成的"快速定位时只能滚。
- **改法**：`/learn` 顶部加 phase 过滤 chips（P0/P1/P2/横向 + 状态：✅/🔄）+ 简单的客户端 `data-*` 过滤（无依赖，~30 行 JS）；`/works` 加"离线可跑 / 需 LLM 端点"标签过滤（本站 6 个 demo 中 3 个全离线零 key，这是强筛选维度，`README.md:22` 已明确区分）。
- **工作量**：小。**优先级 P2**：18 张卡的规模下收益中等，但"离线/需 key"这个维度对想立刻跑起来的访客很有价值。

### P-13 【P2 · 中】`TrajectoryTimeline` 数据源健壮化 + 轨迹可视化升级
- **解决**：`src/data/trajectory.ts:26-38` 读 `harness-demo/trajectories/demo.jsonl`，该路径被根 `.gitignore:16` 排除 → **CI 构建时 `available=false`，`/works/#trajectory` 显示"轨迹文件不在仓库中"占位**（`TrajectoryTimeline.astro:171-184`）。即线上版这一区块**永远是空的**。
- **改法**：① 在仓库里提交一份**脱敏的样例轨迹**（如 `site/src/data/trajectory.sample.jsonl`，或 `harness-demo/trajectories/demo.example.jsonl` 并改 `.gitignore` 白名单），让线上也有真实事件流可看；② `trajectory.ts` 支持"样例优先、真实产物覆盖"；③ 顺手把 `mdToHtml`（`src/utils/md.ts:38-41`）与主管线的差异对齐（它目前是独立 processor，`astro.config.mjs` 改配置时容易漏掉它——已实跑验证两者行为一致，但这是两份配置）。
- **工作量**：中。**优先级 P2**：不影响主流程，但"线上作品页有个永久空区块"是可见的瑕疵；且样例轨迹是很好的面试素材展示。

### P-14 【P2 · 小】清理死代码与失效 CSS
- **解决**：F-11（`Mermaid.astro` + `.mermaid-figure` 不生效）、F-18（14+ 处 `style="display:block"`）、`Mermaid.astro` 的 `title` prop 无人传。
- **改法**：随 P-09 一并处理；`learn.astro:71` 的 `aria-label="撰写中"` 加在 `<div>` 上（`div` 无 role 时 aria-label 对部分屏幕阅读器无效）改为 `role="note"` 或直接放可见文字。
- **工作量**：小。**优先级 P2**。

---

## 附：本审计执行过的命令（可重跑）

```bash
# 构建验证
cd site && npm run build                  # → exit 125（capped 工具链 bug，见 1.2）
cd site && npm run build:fast             # → exit 134，vite client 阶段 V8 OOM
NODE_OPTIONS=--max-old-space-size=2600 ./node_modules/.bin/astro build   # → exit 137，系统 OOM
NODE_OPTIONS=--max-old-space-size=1800 nice -n 19 ./node_modules/.bin/astro build  # 卡死，手动终止
cd /tmp && CAPPED_NICE=10 capped /bin/echo hello   # 复现 capped bug → exit 125

# 渲染管线复现（$...$ 假公式）
cd site && node --input-type=module -e "…unified+remark-math+remark-rehype+rehype-katex…"

# 静态核对
grep -c '```mermaid' notes/*.md notes/details/*.md     # 62（与产物中 .mermaid div 数一致）
grep -o 'astro-code astro-code-themes' site/.astro/chunks/_astro_data-layer-content_DBxbNg_o.mjs | wc -l   # 40
node -e "…new Set(domains).size…"                      # courses.ts：18 条 / 17 个唯一 domain
node -e "…WCAG 对比度计算…"                            # --text-faint 亮 2.95:1 / 暗 4.22:1

# Header isActive 模拟
node -e "…对 8 个 path 跑 Header.astro:15-18 的逻辑…"   # /c/* 无高亮
```

**未修改任何被审计文件。** 唯一新增：`audit/presentation-audit.md`（本文件）。
