# 修复日志：site-ui 组

- 组：`site-ui`｜基准日：2026-10-19｜依据：`reviews/2026-10-19/FIX-CHARTER.md` §3「site-ui」
- 可写范围：`site/src/pages/**`、`site/src/components/**`、`site/src/layouts/**`、`site/src/styles/**`、`site/astro.config.mjs`、本日志
- 覆盖声明：
  - 全读：`site/src/layouts/Base.astro`、`site/src/components/NotePageLayout.astro`、`site/src/components/SiteSearch.astro`、`site/astro.config.mjs`、`site/src/pages/c/[slug].astro`、`site/src/pages/details/[slug].astro`
  - 抽样（按 finding 定位行）：`learn.astro:190-214`、`index.astro:100-129/205-234`、`404.astro:18-49`、`details/index.astro:45-70`、`interview.astro:40-54`、`works.astro:125-140/385-400`、`global.css`（`.page-title` @670、color vars、`:focus-visible`）
  - 未读（原因）：其余 `components/*.astro` 与页面未命中清单条目；`site/src/data/**` 属 `sot-data` 区，只作只读引用
- 说明：本轮为**有界交付**——按 Lead 给定优先级做前序条目，未做条目见「未完成清单」。
- **门禁最终状态（全部改动落地后复跑）**：`check-classes` **EXIT=0**（定义集 280 / 差集 0 / 白名单 2 项有效）；`check-counters` **EXIT=0**（判据 12 条 + 副本 7 处全 ✅）
- **构建未跑**（宪章 §0.5 / §4：只由 Lead 统一跑一次）→ 渲染结果**未验证**，见各条「未验证」标注。

---

## 逐条修改记录

### ① A4 / EDIT-F1 —「17 个 demo」→「17 门课的参考样本」

| 文件:行 | 改动前 → 改动后 |
|---|---|
| `site/src/pages/learn.astro:199` | `17 个 demo 不是终点作品，而是每个 milestone 的参考答案（参考样本）` → `17 门课的参考样本不是终点作品，而是每个 milestone 的参考答案（参考样本）` |
| `site/src/pages/learn.astro:204` | `<strong>主线是你亲手搭的工具；17 个 demo 是每个 milestone 的参考答案。</strong>` → `<strong>主线是你亲手搭的工具；17 门课的参考样本是每个 milestone 的参考答案。</strong>` |
| `site/src/pages/index.astro:112` | `不是读完 17 个 demo 就结束` → `不是读完 17 门课的参考样本就结束` |

- 依据：宪章 §1 冻结口径「作品 / demo 数 = **6**」，而「17」是**课程数**。「17 个 demo」把课程数安到了 demo 头上，与 `courses.ts WORK_COUNT = 6` 冲突。改用「17 门课的参考样本」——既保留 17（课程数正确），又不再宣称有 17 个 demo；与站点 description「每课带可运行参考样本」同源口径。
- `courses.ts` **未改动**（不在本区）。
- 验证：
  ```
  $ grep -rn '17 个 demo' site/src/pages/
  （无输出 —— 残留为 0）
  $ grep -rn '17 门课的参考样本' site/src/pages/
  site/src/pages/learn.astro:199 … learn.astro:204 … index.astro:112 …
  ```

### ② C2 / PRES-F1 — NotePageLayout 输出 `<h1>` + 正文首个 h1 降级（high 级根因）

| 文件:行 | 改动前 → 改动后 |
|---|---|
| `site/src/components/NotePageLayout.astro:115` | （无 h1；meta-bar 之后直接 `<slot name="before" />`）→ `<h1 class="page-title">{title}</h1>`，位置在 `</header>` 之后、`<slot name="before" />` 之前 |
| `site/astro.config.mjs:35-47` | 新增 rehype 插件 `demoteNoteH1()`：把 `knowledge-map.md` / `interview-bank.md` 正文的**首个 h1 → h2** |
| `site/astro.config.mjs:55` | `rehypePlugins: [[rehypeKatex, …]]` → `rehypePlugins: [demoteNoteH1, [rehypeKatex, …]]` |

- 根因（评审已定位，本轮按之修）：layout 自身不输出 h1，页标题靠 markdown 正文的 `#`；而 `before` 槽（`/map` 的 `DomainMap`、`/interview` 的复习主区）先输出 h2–h4，于是 h1 被挤到第 13/22 个标题之后。现在 h1 由 layout 在 before 槽之前输出，正文首个 h1 降为 h2 → 全页唯一 h1 且排在最前。
- **为什么只降级这两篇**：其余笔记（`/c/<slug>`、`/details/<slug>`）的 markdown h1 就是页面唯一标题，全局降级会让这 25 页失去 h1，`visual-check.mjs` 的 `title: 'article.markdown h1'` 断言随即失败（回归）。插件按 vfile 源文件名白名单限定，**路径取不到时不降级**（保守回退，宁可保留旧行为也不误伤 25 个课程页）。
- 类名复用既有 `.page-title`（`global.css:670`，learn/nav/details/404 已在输出）→ 不新增死选择器。
- 验证：
  ```
  $ grep -n 'page-title' site/src/components/NotePageLayout.astro
  115:      <h1 class="page-title">{title}</h1>
  $ grep -n 'demoteNoteH1' site/astro.config.mjs
  35:function demoteNoteH1() {
  55:    rehypePlugins: [demoteNoteH1, [rehypeKatex, { throwOnError: false, strict: false }]],
  $ node site/tools/check-classes.mjs   →  EXIT=0（差集 0，未引入死选择器）
  ```
- **未验证**：`file.history[0]` 在 Astro 内容集合管线里是否恒有值、降级是否真的只作用于这 2 篇——需构建后看 `/map/`、`/interview/` 的标题序列与 `/c/rag/` 仍有 h1 才能确认。**留构建/浏览器目检**。

### ③ C2 / PRES-F3 — 转发 description + Base 补 canonical / og / twitter

| 文件:行 | 改动前 → 改动后 |
|---|---|
| `site/src/components/NotePageLayout.astro:86` | `<Base title={title}>` → `<Base title={title} description={desc}>`（新增 `description?: string` prop；未传时按 title 派生一条） |
| `site/src/layouts/Base.astro:25-34` | 新增 `<link rel="canonical">` + `og:type/site_name/locale/title/description/url` + `twitter:card/title/description` |

- 现象（评审 PRES-F3）：33 页里 31 页共用同一条 meta description；全站 0 个 canonical/og/twitter。根因是 `NotePageLayout` 调用 `<Base title={title}>` 时不带 description，8 个课程页 + 8 个专题页 + `/map`/`/interview` 全落到 `Base.astro:14` 的同一条默认文案。
- canonical 取 `new URL(Astro.url.pathname, Astro.site).href`——`site` 与 `base` 都带尾斜杠，解析出 `https://blog.zero43.top/learn-agent-harness/<path>` 绝对地址。
- 验证：
  ```
  $ grep -n 'description={desc}' site/src/components/NotePageLayout.astro
  86:<Base title={title} description={desc}>
  $ grep -c 'property="og:\|rel="canonical"\|name="twitter:' site/src/layouts/Base.astro
  10
  ```
- **未验证**：canonical 实际输出字符串、og 在 HTML 中的位置——需构建后抓 HTML 确认。

### ④ C5 / PRES-F8 — 搜索框补可访问名称

| 文件:行 | 改动前 → 改动后 |
|---|---|
| `site/src/components/SiteSearch.astro:40` | `<input … data-search-input aria-controls="site-search-results">` → 增 `aria-label="搜索全站"` |

- 现象：input 只有 `placeholder`，`<label>` 计数为 0，无 `aria-label` → 屏幕阅读器读作无名的"编辑框"。
- 验证：
  ```
  $ grep -n 'aria-label="搜索全站"' site/src/components/SiteSearch.astro
  40:        aria-label="搜索全站"
  ```

### ⑤ C4 / EDIT-F4 — 404 页「作品 / demo」名词统一

| 文件:行 | 改动前 → 改动后 |
|---|---|
| `site/src/pages/404.astro:32` | `全部内容总览：六个可运行作品、课程卡与进度。` → `全部内容总览：6 个可运行作品（具名 demo 目录）、课程卡与进度。` |
| `site/src/pages/404.astro:42` | `6 个可运行 demo 与实测记录（轨迹、OTel、压缩自测）。` → `6 个可运行作品（具名 demo 目录）与实测记录（轨迹、OTel、压缩自测）。` |

- 依据：宪章 §1 冻结口径「作品 / demo 数 = 6」，且「作品」= 具名目录整体（与 `knowledge-map` 口径块「六个**具名作品**目录」一致）。原页同一屏内「六个可运行作品」与「6 个可运行 demo」两种称法并存，数字一致但名词不一致。
- 验证：
  ```
  $ grep -n '可运行作品\|可运行 demo' site/src/pages/404.astro
  32:        <p>全部内容总览：6 个可运行作品（具名 demo 目录）、课程卡与进度。</p>
  42:        <p>6 个可运行作品（具名 demo 目录）与实测记录（轨迹、OTel、压缩自测）。</p>
  ```

### ⑥ PED-F12 — 题库 §3.2/§3.3 题数 10 → 9

| 文件:行 | 改动前 → 改动后 |
|---|---|
| `site/src/pages/interview.astro:47` | `chip: '§3.2 / §3.3 · 10 题取 3'` → `chip: '§3.2 / §3.3 · 9 题取 3'` |

- 依据：宪章 §1「题库 §3.2+§3.3 = **9 题**」。该 chip 是 `/interview` 复习主区上对读者可见的题量声明。
- 验证：
  ```
  $ grep -n '9 题取 3' site/src/pages/interview.astro
  47:        chip: '§3.2 / §3.3 · 9 题取 3',
  ```

### ⑦ C2 附带 — `capstone-blueprint.md` 由死文本改为链接

| 文件:行 | 改动前 → 改动后 |
|---|---|
| `site/src/pages/learn.astro:209` | `完整蓝图见 <code>notes/process/capstone-blueprint.md</code>。` → `完整蓝图见 <a href="https://github.com/zo0043/learn-agent-harness/blob/main/notes/process/capstone-blueprint.md" target="_blank" rel="noopener"><code>notes/process/capstone-blueprint.md</code> ↗</a>。` |

- 现象：读者看到路径却点不进去（纯 `<code>`）。改为指向仓库该文件，保留 `<code>` 等宽样式。
- 验证：
  ```
  $ grep -c 'blob/main/notes/process/capstone-blueprint.md' site/src/pages/learn.astro
  1
  ```

---

## 未完成清单 + 原因

按 Lead 优先级排序，以下条目**本轮未做**（受轮次/工具调用预算限制，优先保证已做条目落盘）：

| 条目 | 内容 | 未做原因 |
|---|---|---|
| ⑤ **C4 / EDIT-F7** | `details/index.astro:58` 与 `index.astro:215/:227` 的硬编码 8 → 派生 | 需在 `index.astro` frontmatter 新增 `const DETAILS_COUNT = (await getCollection('details')).length` 并改 3 处文案，属跨段改动；预算不足，未半途实施（避免留下「部分派生」的半成品）。 |
| ⑦ **TECH-A-F3** | `works.astro:133/:393` 的「实测 11 spans」→ 15 spans | 未做。若改，须注明 `demo:otel:mock` 离线判据才算诚实；`demos-gates` 组正在修 `demo:otel:assert`（宪章 §3 A1），其判据值可能与站点文案联动，宜等其定稿后一次改准。 |
| ⑨ **C2 / PRES-F4** | sitemap / robots（不装依赖） | `@astrojs/sitemap` 不在 `site/package.json`（`grep -c` = 0），须手写方案；且宪章 §3 建议的 `site/public/` **不在本组 §2 写入分区**（§2 只给 pages/components/layouts/styles/astro.config），故改走 `site/src/pages/sitemap.xml.ts` 端点——需构建验证才知是否产出，本组不能跑构建。**未验证风险高**，故未做，转交 `demos-gates`/Lead 决策。 |

---

## 转交他人

- **`demos-gates`**：`works.astro` 的 span 文案（TECH-A-F3）与 `npm run demo:otel:assert` 的 `spanTotal:15` 是同一事实的两个副本，建议其修完断言后一并核站点文案，避免二次漂移。
- **`demos-gates` / Lead**：PRES-F4 的 sitemap/robots 若要做，注意 `check-counters.mjs` 的「静态页 = `site/src/pages/**` 里非 `[` 的 **.astro**」只统计 `.astro`——新增 `.ts` 端点不会污染 33 的口径；但 `check-classes.mjs` 的输出集会扫描 `site/src` 下全部文件。建议在 `demos-gates` 区（`site/tools`）或 Lead 统一裁决后实施。
- **`knowledge-map` 组**：`learn.astro:193` 的源码注释仍写「capstone：你要搭的 / **17 demo** 是参考样本」——非渲染文本，未在 finding 范围内故未动，但它是同一错误口径的副本，建议顺手统一。
- **`sot-data` 组**：`index.astro` 若做 EDIT-F7，需要 `getCollection('details')` 的条目数；与本组已用的 `items.length` 口径同源，可复用。

---

## 自检

### `git status --porcelain` 本组改动清单

```
 M site/astro.config.mjs
 M site/src/components/NotePageLayout.astro
 M site/src/components/SiteSearch.astro
 M site/src/layouts/Base.astro
 M site/src/pages/index.astro
 M site/src/pages/learn.astro
 M site/src/pages/404.astro
 M site/src/pages/interview.astro
?? reviews/2026-10-19/fix-site-ui.md      ← 本日志
```

（`site/src/data/course-structure.ts`、`site/src/data/llm-history.ts`、`site/src/styles/global.css` 的 ` M` 属**其他组**改动，非本组所为；`global.css` 在评审基线时已是 ` M`。）

### 门禁（全部改动落地后复跑）

```
$ node site/tools/check-classes.mjs    → EXIT=0
  ✅ 类集合门禁通过：定义集 280 / 差集 0 / 白名单 2 项全部有效（.astro-code, .katex-display）
$ node site/tools/check-counters.mjs   → EXIT=0
  ✅ 口径全部一致（判据 12 条 + 副本 7 处）
```

### 未跑的验证（据实声明）

- `astro build` / `npm run build`：**未跑**（宪章 §4 只由 Lead 执行）。
- 因此以下**均未验证**，需构建后确认：① `/map/`、`/interview/` 的 h1 是否成为第一个标题且唯一；② `demoteNoteH1` 的路径白名单是否真的命中（`file.history[0]` 行为未实测）；③ `/c/rag/`、`/details/01-context-rot/` 是否仍有 `article.markdown h1`（防回归）；④ canonical/og 的实际输出；⑤ `aria-label` 在渲染 HTML 中的呈现。
- 视觉层叠/对比度/焦点顺序：**留浏览器目检**。
