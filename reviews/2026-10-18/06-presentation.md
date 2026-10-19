# 展示与交付 评审报告（presentation）

- 评审员：presentation｜时间：2026-10-18 23:20（Asia/Shanghai）
- 覆盖声明：
  - **全读（逐行）**：`site/build.sh`（99 行）、`site/tools/check-counters.mjs`（379 行）、`site/tools/check-classes.mjs`（前 120 行 + 运行输出）、`.github/workflows/verify.yml`（175 行）、`.github/workflows/deploy.yml`（59 行）、`site/package.json`、`site/astro.config.mjs`、`site/src/pages/map.astro`、`site/src/components/NotePageLayout.astro`（60–135 行）、`site/src/layouts/Base.astro`（1–30 行）。
  - **抽样（列节/行）**：`site/src/pages/index.astro`（15/34/35/51/145/204/257–278 行）、`site/src/pages/works.astro`（20–25/94/196–198 行）、`site/src/pages/interview.astro`（9/13/22/196 行）、`site/src/data/courses.ts`（252/269/278/298/300 行）、`site/src/data/course-structure.ts`（24–30 行）、`site/src/styles/global.css`（9–61 color vars、65–70 focus、1205–1223 `.md-inline`、1872–1874 reduced-motion）、`site/tools/visual-check.mjs`（74–103 PAGES/VIEWPORTS、123–269 断言、319–345 fault）、`notes/knowledge-map.md`（计数口径块全文 + 170 行）、`README.md`（14/28 行）。
  - **线上实测**：`curl` 只读拉取 9 个页面 + 3 个课程页 + 42 个内部 URL + pagefind 索引分片 + 4 个 CI run 链接。原始 HTML 落 `/tmp/ls/*.html`、`/tmp/c-*.html`。
  - **未读（原因）**：`site/dist/` 全量（89 文件，已确认 0 HTML，非内容真源）；`notes/` 正文（属他人分区）；`site/src/components/*.astro` 其余 6 个（仅按需 grep）；`analysis/**`（宪章 §0.2 禁止当证据）。
- 结论摘要：
  1. **线上 33 页全部 HTTP 200、42/42 内部链接可达、base 前缀 100% 正确、pagefind 索引真实可用**——交付链路的基本面是健康的（唯一断链在 `/map/` 正文里，1 条）。
  2. **`/map/` 与 `/interview/` 的 `<h1>` 出现在 h2/h3/h4 之后**（根因：`NotePageLayout.astro:97` 的 `before` slot 先于正文 slot，而 layout 自身不输出 h1）——文档大纲倒置，屏幕阅读器用户先听到"知识域总览"再听到页标题。
  3. **`/works/` 有 4 个 `<h1>`**（页面自身 1 个 + 内嵌 demo README 的 3 个），且 `.md-inline` 无任何标题降级规则。
  4. **全站 0 个 `canonical` / `og:` / `twitter:` 标签；33 页里 31 页共用同一条 meta description**（`NotePageLayout.astro:74` 未把 `description` 转发给 `Base`）；子站无自己的 `sitemap.xml`/`robots.txt`，父站 sitemap 的 55 条 URL 里 **0 条**含 `learn-agent-harness`。
  5. **线上内容与 HEAD 无漂移**（口径数字 17/15/6/205/37 逐项对上），两道门禁本机复跑均绿（12 判据 + 7 副本 / 差集 0）；但 `deploy.yml` 只有 `npm run build` 一道，**没有** verify.yml 的 dist 计数等值断言。

- 本轮未验证的范围：
  - **真实浏览器内可判的一切**：视觉层叠/z-index、实际焦点顺序、Tab 走查、对比度实测（无浏览器，本机 2 vCPU/3.4GB，宪章 §0.5 禁止起服务器、禁止跑 build）——**留浏览器目检**。
  - **mermaid 是否真的渲染成 SVG**：只验证了「构建期未渲染 + 客户端有 lazy chunk + chunk 200」，未在浏览器里执行 JS——**留浏览器目检**（见 PRES-F6）。
  - **CI 实际结论**：仅取到 run 页面 HTTP 200 与 `completed` 字符串，未解析 job 级 conclusion（GitHub 需 JS）——**未验证**。
  - **`site/dist/` 残骸的复现路径**：只确认其构成（28 mjs + 60 字体 + 1 css，0 HTML），未复现成因——**未定位**。

---

### PRES-F1｜`/map/` 与 `/interview/` 的 `<h1>` 排在 h2/h3/h4 之后，文档大纲倒置（high）

- 严重度：**high**
- 对象：`site/src/components/NotePageLayout.astro:97`（`<slot name="before" />`）+ `site/src/pages/map.astro:46`（`<DomainMap slot="before" />`）；线上 `https://blog.zero43.top/learn-agent-harness/map/`、`.../interview/`
  - 原文引 1（layout，slot 顺序）：`<slot name="before" />` 紧接 `<slot />`
  - 原文引 2（map.astro）：`<DomainMap slot="before" />` 之后才是 `<rendered.Content />`
- 现象：`NotePageLayout` 自身**不输出任何 `<h1>`**（全文件无 h1），页标题靠 markdown 正文的 `#` 提供；而 `before` slot 里的 `DomainMap` 输出 h2/h3，于是 h1 被挤到 13 个标题之后。
- 证据：
  ```
  $ curl -s https://blog.zero43.top/learn-agent-harness/map/ -o /tmp/ls/map.html
  $ grep -o '<h[1-6][^>]*>' /tmp/ls/map.html | sed 's/<\(h[1-6]\).*/\1/' | tr '\n' ' '
  h2 h3 h3 h3 h3 h3 h3 h3 h3 h3 h3 h3 h3 h3 h3 h3 h3 h3 h3 h3 h3 h1 h2 h2 h2 h2 h2 h2
  ```
  ```
  $ python3 -c "import re;s=open('/tmp/ls/interview.html',encoding='utf-8').read()
  [print(i,'h'+m.group(1),'::',re.sub(r'<[^>]*>','',m.group(2))[:60]) for i,m in enumerate(list(re.finditer(r'<h([1-6])[^>]*>(.{0,90})',s))[:14])]"
  0 h2 :: 复习主区top 15 题
  12 h1 :: 面试题库(模拟面试结构 + 交叉题 + JD 覆盖矩阵)
  ```
  仅阅读 `site/src/components/NotePageLayout.astro:76-99`：`<article class="markdown">` → `<header class="course-meta-bar">`（仅 chips + 面包屑，无 h1）→ `<slot name="before" />` → `<slot />`。
- 影响：屏幕阅读器/大纲工具用户按标题导航时，页面的第一个标题是"知识域总览"（h2），页标题"知识点总地图"（h1）被埋在 22 个标题之后；`/interview/` 更严重——h1 是文档第 13 个标题。依赖标题层级生成目录或做跳读的用户会先被侧栏/横向资产内容淹没，误以为那一块才是正文起点。
- 建议方向：让 layout 在 meta-bar 之后、`before` slot 之前输出一个视觉隐藏或真实的 `<h1>{title}</h1>`，并把 markdown 正文的首个 h1 降级为 h2。
- 置信度：**高**——线上 HTML 与源码两处独立证据一致，根因可逐行定位。

---

### PRES-F2｜`/works/` 输出 4 个 `<h1>`，内嵌 demo README 的标题未降级（medium）

- 严重度：**medium**
- 对象：`harness-demo/workspace/docs/README.md:1`（`# FinHot（示例项目文档）`）；渲染路径 `site/src/components/TrajectoryTimeline.astro:31,37`（`mdToHtml` → `.md-inline`）；线上 `https://blog.zero43.top/learn-agent-harness/works/`
  - 原文引 1：`# FinHot（示例项目文档）`
  - 原文引 2（CSS，`.md-inline` 全部规则里无 h1–h6）：`.ev-body .md-inline { font-size: 0.92rem; color: var(--text); }`
- 现象：页面自身有 `<h1 class="page-title">作品详解</h1>`，同时把 demo 文档 markdown 原样注入 `.md-inline` 容器；文档里的 `#` 标题渲染成完整 `<h1>`，一页出现 4 个 h1。
- 证据：
  ```
  $ grep -o '<h1' /tmp/ls/works.html | wc -l
  4
  $ grep -o '<h1[^>]*>[^<]*' /tmp/ls/works.html
  <h1 class="page-title" data-astro-cid-7atbypev>作品详解
  <h1>FinHot（示例项目文档）
  <h1>项目总结
  <h1>项目总结
  ```
  ```
  $ grep -rn 'FinHot（示例项目文档）' --include='*.md' . | grep -v node_modules
  ./harness-demo/workspace/docs/README.md:1:# FinHot（示例项目文档）
  ```
  仅阅读 `site/src/styles/global.css:1212-1222`：`.md-inline` 的规则只有 font-size / margin / code 边框，**无任何 h1–h6 降级**。
- 影响：单页多 h1 破坏文档大纲唯一性；屏幕阅读器按 h1 跳转会在同一页命中 4 个不同主题（"作品详解"/"FinHot"/"项目总结"×2），用户无法判断哪个是页面主体。同时"项目总结"重复两次（同一 README 被两处注入）。
- 建议方向：注入外部 markdown 时做标题降级（如 h1→h3），或改用 `set:html` 前先重写标题级别；重复注入的那一处需确认是否有意。
- 置信度：**高**——线上 h1 计数与源文件行号直接对应。

---

### PRES-F3｜全站无 `canonical` / `og:` / `twitter:`；33 页里 31 页共用同一条 description（medium）

- 严重度：**medium**
- 对象：`site/src/layouts/Base.astro:24`（唯一一条 description）、`site/src/components/NotePageLayout.astro:74`（`<Base title={title}>` 未传 description）；线上全站
  - 原文引 1（Base，唯一 meta description）：`<meta name="description" content={description} />`
  - 原文引 2（NotePageLayout 调用处）：`<Base title={title}>`（无 `description=` 属性）
- 现象：`Base.astro` 支持 `description` prop，但只有 `nav.astro:17` 与 `404.astro:20` 传了自定义值；`NotePageLayout` 没把 description 往下传，所以 8 个课程页 + 8 个专题页 + map/interview/learn/works/details/index 全部落到同一条默认文案。全站无 canonical、无 og、无 twitter 卡片。
- 证据：
  ```
  $ for p in / /learn/ /works/ /c/rag/ /details/01-context-rot/; do
      curl -s "https://blog.zero43.top/learn-agent-harness$p" | grep -o '<meta name="description" content="[^"]*"' | head -1
    done
  /   -> learn-agent-harness —— coding agent 工程师方向的五阶段课程体系：17 课 · P0–P4 线性路线 …
  /learn/ -> （同上，逐字相同）
  /works/ -> （同上，逐字相同）
  /c/rag/ -> （同上，逐字相同）
  /details/01-context-rot/ -> （同上，逐字相同）
  ```
  ```
  $ grep -o 'property="og:' /tmp/ls/index.html | wc -l ; grep -o 'rel="canonical"' /tmp/ls/index.html | wc -l
  0
  0
  ```
  （9 个页面逐一统计：`og=0 tw=0 canon=0`，`desc=1`。）
- 影响：搜索引擎/社交平台无法区分 33 个页面——搜索结果摘要全部相同，分享链接无预览卡片；无 canonical 时若同内容被多路径访问（如 `/details/` 与 `/details/index.html` 均 200，已实测），权重会被分散。对本项目"课程体系"的对外传播是实际损失。
- 建议方向：`NotePageLayout` 增加并转发 `description`；`Base` 里补 `canonical`（`Astro.site` + `Astro.url.pathname`）与最小 og/twitter 组。
- 置信度：**高**——线上逐页统计 + 源码调用点两处独立确认。

---

### PRES-F4｜子站无 `sitemap.xml` / `robots.txt`，父站 sitemap 完全不含本站（medium）

- 严重度：**medium**
- 对象：`site/astro.config.mjs:22-31`（无 `@astrojs/sitemap` 集成，无 `public/robots.txt`）；线上 `https://blog.zero43.top/learn-agent-harness/sitemap.xml`
  - 原文引 1（astro.config.mjs 全文无 sitemap 集成）：`export default defineConfig({ site: 'https://blog.zero43.top/learn-agent-harness/', base: '/learn-agent-harness/', markdown: { … } })`
  - 原文引 2（`site/public/` 下无 robots.txt/sitemap）
- 现象：子站路径下 `sitemap.xml`、`sitemap-index.xml`、`robots.txt` 全部 404（返回自定义 404 页，HTTP 404）；父站 `https://blog.zero43.top/sitemap.xml` 有 55 条 URL，**0 条**指向 `learn-agent-harness`。
- 证据：
  ```
  $ B=https://blog.zero43.top/learn-agent-harness
  $ for p in /sitemap.xml /robots.txt /sitemap-index.xml; do
      curl -s -o /dev/null -w '%{http_code} %{size_download}' "$B$p"; echo " <- $p"; done
  404 11632 <- /sitemap.xml
  404 11632 <- /robots.txt
  404 11632 <- /sitemap-index.xml
  ```
  ```
  $ curl -s https://blog.zero43.top/sitemap.xml | grep -o 'learn-agent-harness' | wc -l
  0
  $ curl -s https://blog.zero43.top/sitemap.xml | grep -o '<loc>' | wc -l
  55
  ```
  （父站 robots.txt 存在且 `Sitemap: https://blog.zero43.top/sitemap.xml`，但该 sitemap 不含本站。）
- 影响：33 页课程内容对爬虫没有任何发现入口——只能靠父站首页的外链被动爬取，且父站 sitemap 的缺失会让"本站有多少页、哪些页"对搜索引擎不可见。对一个"课程体系"站点而言这是可达性（discoverability）缺口，不是纯 SEO 洁癖。
- 建议方向：加 `@astrojs/sitemap` 集成（会自动带上 `site` + `base`），或在 `site/public/` 放一份手写 robots.txt + sitemap；同时确认父站 sitemap 是否应纳入本站。
- 置信度：**高**——HTTP 状态码 + 父站 sitemap 内容直接计数。

---

### PRES-F5｜`/map/` 正文里有一条 404 断链（`（**33` 被吞进 URL）（medium）

- 严重度：**medium**
- 对象：`notes/knowledge-map.md:170`；线上 `https://blog.zero43.top/learn-agent-harness/map/`
  - 原文引（源文件，markdown 链接写法错误——URL 里直接跟了全角括号与 `**`）：
    `已上线 https://blog.zero43.top/learn-agent-harness/（**33 个 html**，构成见上方计数口径…`
  - 渲染后（线上 HTML）：`<a href="https://blog.zero43.top/learn-agent-harness/%EF%BC%88**33">https://blog.zero43.top/learn-agent-harness/（**33</a>`
- 现象：作者想写裸 URL + 粗体数字，但 `**33` 紧跟 URL 导致 markdown 把 `（**33` 解析进链接目标；该链接实测 404。
- 证据：
  ```
  $ curl -s -o /dev/null -w '%{http_code} %{size_download}\n' 'https://blog.zero43.top/learn-agent-harness/%EF%BC%88**33'
  404 11632
  ```
  ```
  $ grep -rn '（\*\*33' notes/ site/src/
  notes/knowledge-map.md:170:- [x] 站点建设：Astro 站（site/）+ GitHub Pages 部署——已上线 https://blog.zero43.top/learn-agent-harness/（**33 个 html**，…
  ```
  这是本次 42 条内部链接批量核验中**唯一**的非 200（其余 41 条全 200，含 20 个 `/c/<slug>/`、8 个 `/details/<slug>/`、8 个锚点）。
- 影响：读者在知识地图页点这条"已上线"链接会落到 404 页——而这条恰恰是证明"站点已上线"的证据链本身，断链会让人怀疑站点状态。同时它把 `**33` 这类排版残留直接暴露在可见文本里。
- 建议方向：URL 与说明文字之间加空格，并把 URL 写成 markdown 链接 `[文本](url)` 形式。
- 置信度：**高**——HTTP 404 + 源文件行号 + 渲染后 HTML 三处一致。

---

### PRES-F6｜mermaid 构建期不渲染，只输出 `.mermaid` 源码 div，依赖客户端 JS（low，附目检要求）

- 严重度：**low**
- 对象：`site/astro.config.mjs:11-20`（`remarkMermaid` 把代码块转成 `<div class="mermaid">` 原文）；线上 `https://blog.zero43.top/learn-agent-harness/c/harness-from-scratch/`
  - 原文引 1（astro.config.mjs）：`node.value = \`<div class="mermaid">\n${node.value}\n</div>\`;`
  - 原文引 2（线上 HTML 内 div 内容 = mermaid 源码）：`<div class="mermaid">\nflowchart TD\n  START["读入 messages<br>system + user + 历史"] --> CALL["call_model(messages)<br>模型只出请求"]`
- 现象：**构建期确实没有渲染 SVG**——`<div class="mermaid">` 里是原始 mermaid 源码文本；页面上 6 个 `<svg>` 全部是 UI 图标（`.icon-open` / `.icon-close` / 搜索图标 / `.icon-moon` / `.icon-sun`），**没有一个是图表**。渲染靠客户端 lazy chunk。
- 证据：
  ```
  $ curl -s .../c/harness-from-scratch/ -o /tmp/c-hfs.html
  $ grep -o 'class="mermaid"' /tmp/c-hfs.html | wc -l   # 4
  $ grep -o '<svg' /tmp/c-hfs.html | wc -l              # 6 —— 逐个查均为 UI 图标
  $ grep -o '<svg[^>]*>' /tmp/c-hfs.html | head -3
  <svg class="icon-open" viewBox="0 0 24 24" …>
  <svg class="icon-close" viewBox="0 0 24 24" …>
  <svg viewBox="0 0 24 24" …><circle cx="11" cy="11" r="7"></circle>   ← 搜索图标
  ```
  客户端链路（三段均实测 200）：
  ```
  $ grep -o 'mermaid[^;]\{0,80\}' /tmp/base2.js
  document.querySelector(".mermaid")&&P(()=>import("./mermaid.CNF9RGdZ.js"),[]).then(e=>e.renderAllMermaid())
  $ curl -s -o /dev/null -w '%{http_code} %{size_download}' .../_astro/mermaid.CNF9RGdZ.js
  200 1979
  ```
  页面自带 `<noscript>` 兜底：`本页图表需要 JavaScript 才能渲染；未启用脚本时，图中显示的是图表源码。`
- 影响：**不是缺陷，但必须说清边界**——「页面里有 mermaid 语法」不等于「读者看到图」。无 JS 环境（部分爬虫、禁用 JS 的读者、某些 RSS/阅读模式）看到的是裸源码。本次**未验证**浏览器内是否真的渲染出 SVG（无法执行 JS，宪章禁止起服务器/跑 build）——**留浏览器目检**：打开 `/c/harness-from-scratch/` 确认 4 处 `.mermaid` 变成 `<svg>`，并确认控制台无 mermaid 语法错误。
- 建议方向：若要覆盖无 JS 场景，可在构建期用 mermaid CLI 预渲染 SVG；否则保留现有 noscript 声明即可。
- 置信度：**高**（构建期未渲染这一结论）；**渲染最终效果未验证**（需浏览器）。

---

### PRES-F7｜`deploy.yml` 缺 verify.yml 的 dist 计数等值断言；本地 `site/dist` 是 89 文件/0 HTML 残骸（low）

- 严重度：**low**
- 对象：`.github/workflows/deploy.yml:38-40`（唯一构建步骤）、`.github/workflows/verify.yml:117-125`（Build sanity）；`site/dist/`（89 文件 / 0 HTML）
  - 原文引 1（deploy.yml，无任何 sanity 步骤）：`- name: Build` / `working-directory: site` / `run: npm run build`
  - 原文引 2（verify.yml，等值断言 33）：`count=$(find site/dist -name '*.html' | wc -l)` … `test "$count" -eq 33`
- 现象：两道门禁（口径/类集合）**确实覆盖了 deploy**——因为 `package.json:9` 的 `"build": "bash build.sh"`，而 `build.sh:41,54` 依次调用两个门禁。但 deploy.yml **没有** verify.yml 的 `Build sanity`（`find site/dist -name '*.html' | wc -l` 等值 33 + 9 个关键页非空），即：**部署路径不校验构建产物是否真的产出了 HTML**。本机 `site/dist` 恰好就是这种残骸。
- 证据：
  ```
  $ grep -n 'check-counters\|check-classes\|npm run build' .github/workflows/verify.yml
  79:        run: node site/tools/check-counters.mjs
  92:        run: node site/tools/check-classes.mjs
  96:        run: npm run build
  $ grep -n 'check-counters\|check-classes\|npm run build\|find site/dist' .github/workflows/deploy.yml
  40:        run: npm run build
  $ grep -c 'find site/dist' .github/workflows/deploy.yml
  0
  ```
  ```
  $ grep -n 'check-counters\|check-classes' site/build.sh
  41:if ! node tools/check-counters.mjs; then
  54:if ! node tools/check-classes.mjs; then
  $ grep -n '"build"' site/package.json
  9:    "build": "bash build.sh",
  ```
  本机残骸构成（`site/dist` 被 `site/.gitignore:2` 忽略，故 `git status` 干净）：
  ```
  $ find site/dist -type f | wc -l ; find site/dist -name '*.html' | wc -l
  89
  0
  $ find site/dist -type f | sed 's/.*\.//' | sort | uniq -c | sort -rn
       28 mjs / 20 woff / 20 ttf / 19 woff2 / 1 svg / 1 css
  $ curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1/learn-agent-harness/
  404
  ```
  （残骸全是 `pages/*.astro.mjs` SSR 中间产物 + KaTeX 字体，mtime 2026-10-17 09:43。）
- 影响：本地预览不可用（已实测 404），任何人想"本地看一眼"都会失败——这会诱导接手者误判站点状态。更实际的风险是：若某次构建产出 0 HTML 而 exit 0，deploy.yml 会把空目录上传到 Pages，**没有任何步骤会拦下**（verify.yml 会拦，但两者独立、互不阻塞，见 verify.yml:17-18 原文"互不阻塞"）。
- 建议方向：把 verify.yml 的 `Build sanity` 步骤复制进 deploy.yml 的 build job（或在 build.sh 尾部加产物断言），使部署路径自带同一道防线。
- 置信度：**高**——workflow 逐行引用 + 本机残骸实测。

---

### PRES-F8｜搜索框只有 placeholder，无 `<label>` / `aria-label`（low）

- 严重度：**low**
- 对象：`site/src/components/SiteSearch.astro`（线上渲染于每页 header）；线上 `https://blog.zero43.top/learn-agent-harness/`
  - 原文引（线上 HTML，input 无 label 关联）：`<input class="search-input" type="search" placeholder="搜索课程 / 作品 / 题库 / 详解…" autocomplete="off" spellcheck="false" data-search-input aria-controls="site-search-results">`
- 现象：搜索输入框没有任何可访问名称——`<label>` 计数 0，input 自身无 `aria-label`，`placeholder` 不能替代标签（占位文本在输入后消失，且部分 AT 不朗读）。外层 `<dialog aria-label="全站搜索">` 提供了容器名，但输入框本身仍无名。
- 证据：
  ```
  $ grep -o '<label' /tmp/ls/index.html | wc -l ; grep -o 'aria-label="[^"]*"' /tmp/ls/index.html | sort -u
  0
  aria-label="打开导航菜单" / "切换明暗主题" / "全站搜索" / "主导航" / "阅读进度" / "搜索全站（快捷键 /）"
  ```
  （`aria-label` 清单里没有一项属于该 input；`<dialog>` 的 `aria-label="全站搜索"` 是对话框名。）
  正面项：触发按钮有 `aria-label="搜索全站（快捷键 /）"`，结果区有 `role="region" aria-live="polite"`，`<kbd aria-hidden="true">/</kbd>` 与 `Esc` 提示齐备。
- 影响：屏幕阅读器用户 Tab 进搜索框时听到的是"编辑框"而非"搜索课程/作品/题库"，需要靠上下文猜测用途。属于可访问性打磨项，不阻断使用。
- 建议方向：给 input 加 `aria-label="搜索全站"` 或补一个视觉隐藏的 `<label for>`。
- 置信度：**高**——线上 HTML 结构直接可判。

---

## 正面确认

1. **线上可达性基本面完好**：9 个页面 + 3 个课程页全部 HTTP 200，字节数 11.6KB–63KB 均非空；`/404.html` 200，未知路径（`/this-does-not-exist/`、`/c/nope/`、`/details/nope/`）返回 **HTTP 404 + 自定义 404 页**（状态码正确，不是软 404）。
   ```
   $ for p in / /learn/ /map/ /interview/ /works/ /nav/ /details/ /details/01-context-rot/ /404.html; do
       curl -s -o /dev/null -w '%{http_code} %{size_download}' "$B$p"; done
   200 29821 / 200 56765 / 200 54385 / 200 48030 / 200 63009 / 200 42733 / 200 23115 / 200 14414 / 200 11632
   ```
2. **base 前缀 100% 正确，无断链**：从 9 个线上页面抽出 42 条内部 URL（含 20 个 `/c/<slug>/`、8 个 `/details/<slug>/`、7 个 `/works/#…` 锚点、`/learn/#capstone`），逐条 `curl` 全部 200；8 个锚点目标 id 在目标页中各命中 1 次。唯一例外是 PRES-F5 那条由 markdown 写法错误产生的 URL。
3. **pagefind 全文索引真实可用**：`/pagefind/pagefind.js`（45,555 B）、`pagefind-entry.json`（`page_count: 33`）、`pagefind-ui.js`（119,987 B）、`pagefind.zh-cn_*.pf_meta`（533 B gzip）全部 200；解压 meta 得到 43 个真实分片哈希，抽测 `fragment/zh-cn_116f1be.pf_fragment` → **200 / 21,410 B** 等 3 个分片均有内容，索引内含"不可/不合/站点"等中文词条。搜索不是空壳。
4. **KaTeX 在含数学的页面确实产出 `.katex`**：`/c/evaluation/` 81 处、`/c/system-design/` 3 处；无数学的页面为 0（符合预期，非缺陷）。
5. **两道门禁本机复跑均绿**（只读脚本，宪章允许）：
   ```
   $ node site/tools/check-counters.mjs   → EXIT=0
   ✅ 口径全部一致（判据 12 条 + 副本 7 处）
   $ node site/tools/check-classes.mjs    → EXIT=0
   ✅ 类集合门禁通过：定义集 280 / 差集 0 / 白名单 2 项全部有效
   ```
   口径块声明值与实数逐项相等：知识域 15、课程页 17、课程卡 18、课内嵌题 205、面试题库 37、notes 顶层 19、EXCLUDED 2、站点 html 33（三桶 8+17+8 互斥且穷尽）。
6. **文档声明的「关键页清单/页数/组合数」与脚本实际值一致**：`visual-check.mjs:77-95` 的 `PAGES` 数组实测 **10 项**，`VIEWPORTS` **3 项** → 30 组合；`verify.yml:9-10` 与 `README.md:28` 均写「10 页 … 共 30 组合」，且两处都显式声明「权威来源 = `site/tools/visual-check.mjs` 的 `PAGES`，本行只是它的镜像」——**声明与实现一致，未发现口径失真**。`verify.yml:121` 的 `test "$count" -eq 33` 与 `check-counters.mjs` 的 `站点 html 33` 同值。
7. **CI 绿基线链接全部可访问**：4 个 run 链接（38282562346 / 38282852860 / 38345995909 / 38350151634）`curl -sI` 均 **HTTP/2 200**，页面含 `completed` 字样。**但 job 级 conclusion 未解析**（GitHub 需 JS）——见未验证范围。
8. **a11y 基础设施到位**：`<html lang="zh-CN">` 全站正确；每页有 `<a class="skip-link" href="#main">跳到主内容</a>`；`main`/`header`/`nav`/`footer` landmark 齐备且 `nav` 均有 `aria-label`；`:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }`；`prefers-reduced-motion` 有显式处理；主题切换按钮 `aria-label="切换明暗主题"`；导航汉堡按钮 `aria-expanded="false" aria-controls="site-nav" aria-label="打开导航菜单"`。**图片 `<img>` 计数为 0**（全站零位图，故无 alt 缺失问题）。
9. **线上内容与 HEAD 无漂移**：`git log -1` = `0f0ca19`（2026-10-14 19:12）；用特征字符串逐项比对线上 HTML 与 `site/src` 源码，全部一致——首页 `17 课 · 五个阶段 · 15 个知识域` 与 `courses.ts:269,278,298` 的 `COURSE_COUNT/DOMAIN_COUNT/WORK_COUNT` 对上；首页 5 个 stat 数字 `17/15/6/205/37` 与 `index.astro:34-35,257-273` 逐字对上；`/learn/` 五个阶段标签（`P0 · 基础篇`…`P4 · 收口与前沿`）与 `course-structure.ts:24-30` 的 `STAGE_LABELS` 逐字对上；`/learn/` 渲染出 17 个 `/c/<slug>/` 链接 = `COURSE_COUNT`。**未发现已发布内容落后于仓库。**

---

## 转交他人

- `notes/knowledge-map.md:170` 的 markdown 链接写法错误（`（**33` 被吞进 URL）既是展示问题也是编辑一致性问题——建议 `editorial` 视角确认全仓是否还有同类「裸 URL 紧跟全角括号/粗体」写法。→ **editorial**
- `notes/knowledge-map.md` 计数口径块里「站点 html 33」的历史链引用了 4 个 CI run 号与「dist HTML 文件数 = 31/32」的日志值；本次只验证了 run 链接 200，未核对日志内数字。→ **verifier**
- `/works/` 内嵌 demo README 时「项目总结」出现两次（同一 README 被两处注入），可能对应作品页内容重复或数据源重复——属内容结构问题。→ **pedagogy / editorial**
- `site/dist` 残骸（28 个 `pages/*.astro.mjs` SSR 中间产物 + 0 HTML，mtime 2026-10-17 09:43）的成因未定位；`build.sh:66-71` 注释提到 `capped` 的 exit 125 回退 bug 是「89 文件/0 HTML 残骸」的一条现实成因路径。本次未复现，建议由能跑构建的环境确认。→ **verifier / Lead**
- `deploy.yml` 与 `verify.yml` 互不阻塞（verify.yml:17-18 明写），意味着**部署可能先于验证完成**。若关心「未通过几何回归的版本是否可能已上线」，需查 Pages 部署时间线与 run 时序。→ **verifier**
