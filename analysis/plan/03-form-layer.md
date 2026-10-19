# 03 · 显示形式改造设计（形式组 0–4）

> 任务：`t3 [p3-form]`。依据 `analysis/plan/00-plan-scope.md` 全文写就（10 字段格式、验收两分法、末尾两节）。
> 事实基础：`analysis/content/08-synthesis.md` ④（25 条登记项）与 ⑥（输入清单 + 建议范围）、
> 01/04/06 各自的「转交下一轮」附录；**并逐条回源码复核**（本文所有 `file:line` 都是我本轮亲自读到的当前值）。
> 三条 falsified（`accuracy-F1`/`accuracy-F3`/`evidence-F2`）**未被用作任何改造项的依据**；
> 凡涉及被修正的真值一律采用 07 的修正值（依赖图不一致 **8/15**、`details` 矛盾页 **04/08/06**、`industry-2026.md:20`）。
>
> **本轮零代码改动**：本文件是本轮唯一新增产物；未改 `site/`、`notes/`、任何既有文件；
> 未跑 `astro build`；未跑任何会写 `site/tools/out/`、`trajectories/`、`.state/` 的脚本。
> 所有证据命令都是只读命令（`find`/`stat`/`grep`/`sed`/`node -e`）。

## 0. 本文件怎么读

### 0.1 组与条目的对应关系（保证 ④ 的 25 条一条不漏）

| 组 | 主题 | 本文件条目 | 覆盖 ④ 登记项 |
|---|---|---|---|
| 组 0 | 构建与预览环境（**先决**，**批次 A 的前置/并行必备**） | F0-0…F0-4 | **15、16、17、20** |
| 组 1 | 入口层（`index` / `404` / `nav`） | F1-1…F1-5 | **8、13、18、22** + 08 §3.6 的两个 blocker（首屏、11 专名） |
| 组 2 | `/learn/` 层级与口径落点 | F2-1…F2-5 | **1、4、10、21**（+ F2-4 承接 01 的 A2 现状证据） |
| 组 3 | `/map` 依赖图（**与批次 A 的 P2 合并**） | F3-1…F3-3 | **5、7** |
| 组 4 | 课程页与 details 页 | F4-1…F4-8 | **2、3、6、9、19、23、24、25** |
| 附 A | 已登记但不落在站点渲染面（移交 02） | — | **11、12、14** |

**25 条逐条落位（自检：无遗漏、无重复）**：

| ④ | 落在 | ④ | 落在 | ④ | 落在 | ④ | 落在 | ④ | 落在 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | F2-2 | 6 | F4-6 | 11 | 附 A | 16 | F0-3 | 21 | F2-3 |
| 2 | F4-3 | 7 | F3-3 | 12 | 附 A | 17 | F0-2 | 22 | F1-4 |
| 3 | F4-8 | 8 | F1-5 | 13 | F1-4 | 18 | F1-3 | 23 | F4-4 |
| 4 | F2-1 | 9 | F4-5 | 14 | 附 A | 19 | F4-7 | 24 | F4-1 |
| 5 | F3-1 | 10 | F2-5 | 15 | F0-0 | 20 | F0-1 | 25 | F4-2 |

**不在 ④ 但必须做的 5 条**（08 §3.6 的两个 blocker + 本组复核发现）：

| 条目 | 为什么做 |
|---|---|
| F1-1 | 08 §3.6 blocker F1：`index.astro:45-61` 首屏承诺句无一处展开（`07-verification.md:85` confirmed） |
| F1-2 | 08 §3.6 blocker F2：`index.astro:151-193` 卡片一屏 11 个未展开专名（`07:86` confirmed） |
| F0-4 | 全届纪律 #9 的第一轮集合比对结果（3 个真死选择器）应升级为门禁——本轮**新发现**，④ 未登记 |
| F2-4 | `learn.astro:188` 的依赖图引用句与 A2 的一致性（**只改一遗**的边界说明） |
| F3-2 | `/map` 页上方交互视图与下方图缺少分工说明（本轮**新发现**） |

### 0.2 全届纪律 #9 的第一轮：CSS 定义类集合 vs 页面输出类集合

**方法（必须复现，不许靠「页面上有没有这个 class」）**：取 `site/src/styles/global.css` 与
各 `.astro` 内联 `<style>` 里出现的**全部** `.class` token 作为「定义集」；取去掉 `<style>` 块后的
`site/src/**` + `notes/**/*.md` + `site/public/**` 全文里的同名 token 作为「输出集」；
差集 = 疑似死选择器。命令原文（只读，可重跑）：

```bash
cd /home/ubuntu/app/learn-agent-harness && node -e '
const fs=require("fs"),path=require("path");
function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,out);else out.push(p)}return out}
const files=walk("site/src");const defs=new Map();
function add(c,f){if(!defs.has(c))defs.set(c,new Set());defs.get(c).add(f)}
for(const f of files.filter(x=>x.endsWith(".css")))for(const m of fs.readFileSync(f,"utf8").matchAll(/\.(-?[A-Za-z_][\w-]*)/g))add(m[1],f);
for(const f of files.filter(x=>x.endsWith(".astro"))){const t=fs.readFileSync(f,"utf8");for(const s of t.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g))for(const m of s[1].matchAll(/\.(-?[A-Za-z_][\w-]*)/g))add(m[1],f)}
let corpus="";
for(const f of files.filter(x=>!x.endsWith(".css"))){let t=fs.readFileSync(f,"utf8");if(f.endsWith(".astro"))t=t.replace(/<style[^>]*>[\s\S]*?<\/style>/g,"");corpus+=t+"\n"}
for(const f of walk("notes").filter(x=>x.endsWith(".md")))corpus+=fs.readFileSync(f,"utf8")+"\n";
for(const f of walk("site/public"))corpus+=fs.readFileSync(f,"utf8")+"\n";
const d3=[];for(const [c,w] of defs){const re=new RegExp("(?<![\\w-])"+c.replace(/[-]/g,"\\-")+"(?![\\w-])");if(!re.test(corpus))d3.push([c,[...w]])}
d3.sort();console.log("定义集:",defs.size,"| 差集:",d3.length);for(const [c,w] of d3)console.log("  ."+c+"  <- "+w.join(", "));
'
```

（上条命令的 `console.log` 文案是本文重排后的可读版；实际末次运行的输出以「第二轮」代码块为准。）

**本轮实测输出（原文，逐字复制）**：
- 第一轮（定义集 = `global.css` + 各页面内联 `<style>`；输出集 = `.astro` 的 `class=` 字面量）：
  `CSS-defined: 288 | output: 259`；差集 35 项、反向差集 6 项。
- 第二轮（把「输出集」扩到**去掉 `<style>` 后的 `site/src/**` + `notes/**/*.md` + `site/public/**` 全文**，
  以覆盖动态类名与 markdown 渲染产物）：

  ```
  === CSS 定义、去掉 <style> 后的全仓（site/src + notes + public）无此 token = 10 ===
    .astro-code  <- site/src/styles/global.css
    .dc-  <- site/src/styles/global.css
    .details-entry  <- site/src/styles/global.css
    .ev-  <- site/src/components/TrajectoryTimeline.astro
    .katex-display  <- site/src/styles/global.css
    .kind-cost-detail  <- site/src/styles/global.css
    .kind-design-detail  <- site/src/styles/global.css
    .kind-interview-question  <- site/src/styles/global.css
    .lf-count-note  <- site/src/pages/learn.astro
    .works-note  <- site/src/styles/global.css
  ```

> ⚠️ **两轮必须都做**（这正是纪律 #9 的语义）：第一轮（35 项）里绝大多数是动态类名与 markdown 渲染产物造成的**假死**；
> 只做第一轮会得出「35 个死选择器」的错误结论。**第二轮（10 项）才是可用基线**，
> 且第二轮里还要再剥掉 6 项「非死 / 伪差集」（见下表），**真死只有 3 项**。

**差集逐条裁定（这是纪律 #9 的语义核心：差集 ≠ 全是 bug）**：

| 差值项 | 裁定 | 依据（file:line） |
|---|---|---|
| `.astro-code` | **非死**：由 shiki 从外部注入 | `global.css:549` 注释即 `<pre class="astro-code astro-code-themes" …>`；规则在 `global.css:557-574` |
| `.katex-display` | **非死**：由 `rehype-katex` 注入 | 管线 `astro.config.mjs:27` |
| `.kind-cost-detail` / `.kind-design-detail` / `.kind-interview-question` | **非死**：动态类名 `kind-${kind}` 的三值恰好全覆盖 | 输出点 `details/[slug].astro:46`、`details/index.astro:70/93/117`；定义 `global.css:421/427/433`；`kind` 取值域 = `notes/details/*.md` 的 8 个 front-matter，实测只有 `interview-question`×5 / `cost-detail`×1 / `design-detail`×2 三种（`grep -n '^kind:' notes/details/*.md`） |
| `.dc-` / `.ev-` | **扫描器伪差集**：来自 CSS 注释里的通配写法 | `global.css:1321`「复用 .card/.domain-card/.dc-*」；`TrajectoryTimeline.astro:189`「.ev-* 只声明 background」 |
| **`.details-entry`** | **真死选择器** | 定义 `global.css:732-734`（`max-width:48em`）；全仓仅 `index.astro:221` 用了 `details-entry-links`，`.details-entry` 本身 0 处输出（`grep -rn 'details-entry' site/src` 只有 css 的 4 处 + `index.astro:221`） |
| **`.works-note`** | **真死选择器** | 定义 `global.css:725-730`；全仓 0 处输出（`grep -rn 'works-note' site/src` → 仅 `global.css:725`）。`works.astro` 的白板注已改用别的类 |
| **`.lf-count-note`** | **真死选择器（页面内联 style）** | 定义 `learn.astro:341`；`learn.astro` 里 0 处输出（页面用的是 `lw-count-note`，见 `learn.astro:271/276/281` 与定义 `learn.astro:383`）。注意这**正是纪律 #9 要抓的形态**：同页 `lw-`/`lf-` 一字之差，肉眼扫页面「有没有这个 class」永远抓不到 |

**结论（可机器验证的验收基线）**：差集从 **10 项**收敛到 **0 项**，路径是三步（缺一步都不成立）：
① 剥掉 CSS 注释里的通配写法 ⇒ 去掉 `.dc-`、`.ev-`（剩 8）；
② 扫描器认识动态类名（模板字符串 `kind-${kind}` 的三值 + `class:list` + 三元字面量）⇒ 认可 `.kind-*` 三项（剩 5）；
③ 白名单 `astro-code` / `katex-display`（外部插件注入）⇒ 剩 **3 项真死**（`.details-entry` / `.works-note` / `.lf-count-note`），
清掉这 3 项后**差集 = 0**。
（若只做步骤 ③ 的白名单、不做 ①②，则差集停在 6；**F0-4 的验收按最终态「差集 0」写**，
中间态数值已在 F0-4 的「可机器验证」第 2 条里列出两种口径。）
⚠️ 本条初稿误写「见 F0-5 的建议实现」——**本文件没有 F0-5**（组 0 只有 F0-0…F0-4）⇒ 就地更正为 **F0-4**。
**反向集合（输出集 − 定义集）本轮实测为 0 个真缺口**（唯一候选 `pn-prev`/`run-chip`/`toc-3`/
`featured`/`active` 都是动态类名，已逐条回源码确认有定义，见 `c/[slug].astro:178` + `global.css` 的 `.pn-*`、
`works.astro:31/94` + `global.css:1444`、`c/[slug].astro:219` + `global.css:896`、`Header.astro:55` + `global.css:256`）。

> **第二轮集合比对**在实施轮做（改完 `global.css`/`learn.astro` 后重跑同一命令），
> 判据写在各条目的「可机器验证」里；本轮已给出基线，**两轮的命令与判据同源**。

### 0.3 字段模板

每条按 00-plan-scope §3 的 10 字段写；其中 `验收` 一律拆成
`可机器验证（命令 + 期望）` 与 `必须留浏览器目检` 两段（00-plan-scope §4）。

---

## 组 0 · 构建与预览环境（先决）

> ⑥ 6.2 第 5 条明写：这一组是**先决条件**——它决定组 1–4 能否被目检。
> 组 0 不解决，后面所有「留浏览器目检」都是空话（现在 `site/dist` 里没有任何 HTML，
> 想目检必须先能产出 HTML 或起 `astro dev`）。
>
> **🔴 跨批次阻塞声明（captain 对齐，本组确认）**：`site/dist` 的 89 文件 / 0 HTML 残骸使
> **批次 A 与本文件组 1–4 的全部「必须留浏览器目检」条目无法验收**。
> ⇒ 组 0 定为 **批次 A 与该四组的前置（或至少并行必备）**：
> 任何需要目检的条目，其完成判据都必须包含「所用 `dist` 的来源」（本机重建成功 / CI artifact），
> 否则「留浏览器目检」是一句无法执行的话（违反 00-plan-scope §4.2 的边界纪律）。
> 具体阻塞面：本文件里 `grep -c "留浏览器目检"` = **33 处**（含本声明自身与「本项无目检项」的说明句），
> 其中**真正需要人眼的条目全部**依赖可用 HTML；批次 A 侧的目检项同理（见 `01-source-layer.md`）。

### 现状复核（先给事实，再给诊断）

本轮亲自跑到的现状（命令与输出原文）：

```bash
find site/dist -type f | wc -l            # → 89
find site/dist -name '*.html' | wc -l     # → 0
find site/dist -type f | sed 's/.*\.//' | sort | uniq -c | sort -rn
# → 28 mjs / 20 woff / 20 ttf / 19 woff2 / 1 svg / 1 css
find site/dist -type d                    # → dist, dist/pages, dist/pages/c, dist/pages/details, dist/_astro, dist/chunks, dist/chunks/astro
du -sh site/dist                          # → 3.4M
find site/dist -type f -printf '%TY-%Tm-%Td %TH:%TM:%TS\n' | sort | head -1   # 2026-10-14 17:53:55.095
find site/dist -type f -printf '%TY-%Tm-%Td %TH:%TM:%TS\n' | sort | tail -1   # 2026-10-14 17:53:55.435
```

即 **89 个文件全部落在 2026-10-14 17:53:55 这 0.34 秒内**——这是**单次构建的中途产物**，
不是多次构建叠加，也不是「构建成功后被清掉 HTML」。

### F0-0（诊断项，非改造项）｜`site/dist` 残骸的成因定位

- **id**：F0-0
- **目标**：把「89 文件 / 0 HTML」从现象定位到机制，并说清「能不能清、清了会怎样、重建要付什么代价」——**不执行清理**。
- **现状证据（file:line + 命令原文）**：
  - 清单：`find site/dist -type f | wc -l` → `89`；`find site/dist -name '*.html' | wc -l` → `0`。
  - 全部文件 mtime 落在 `2026-10-14 17:53:55.095` – `17:53:55.435`（0.34 秒内，单次构建中途产物）。
  - 目录里**有** `dist/pages/*.astro.mjs`（9 个）、`dist/chunks/astro/server_*.mjs`、`dist/renderers.mjs`、
    `dist/_noop-middleware.mjs`、`dist/noop-entrypoint.mjs`、`dist/_astro/*.{woff,woff2,ttf}`（KaTeX 字体 59 个）、`dist/favicon.svg`；
    **没有** `dist/404.html`、没有 `dist/index.html`、**没有 `dist/.prerender/`**（`find site/dist -type d` 输出里无此项）。
  - 与残骸同秒的日志仍在：`stat -c '%y %s' /tmp/build-retry.log` → `2026-10-14 17:53:55.471035363 +0800 509`。
    其全文最后一行是 `17:53:55 [vite] transforming...`，**无 `EXIT=` 标记、无报错**；
    同阶段的 `/tmp/build-real.log` 末行则是 `12:59:28 [vite] transforming...` + `EXIT=137`。
  - 仓库里已有同现象的旁证：`.github/workflows/verify.yml:6-7`「本机 2 核 3.4GB 下 astro build 曾多次 OOM（历史 exit 134/137，曾留下 **85 文件/0 HTML** 静默残骸）」；README:29 同述。
- **诊断（分两段，置信度不同）**：
  1. **高置信（可直接复现的机制）**：Astro 静态构建的顺序是
     `Syncing content` → `Building static entrypoints`（写 `dist/chunks`、`dist/renderers.mjs`、`dist/pages/*.astro.mjs`，
     正常会被后面的 `Rearranging server assets` 收进 `dist/.prerender/`）→ `building client (vite)`（写 `dist/_astro/` 字体等）
     → `Rearranging server assets` → **prerender 逐页写 HTML**。
     本次构建在 **`building client (vite) transforming...`** 之后被终止：日志止于此，
     `.prerender/` 与全部 HTML 均未产出，而前两步的产物留在了 `dist/` 且**时间戳完全一致**。
     ⇒ 「0 HTML」不是被清理、不是配置成 `output:'server'`（`astro.config.mjs` 无 `adapter`、无 `output`，
     日志自述 `[build] output: "static"` / `mode: "static"`），而是**构建中途夭折的静默残骸**。
  2. **未定位（不许当事实）**：**是谁终止了 17:53 那次构建**。`/tmp/build-retry.log` 没有 `EXIT=` 标记，
     故「OOM 被杀」（同类 `/tmp/build-real.log` = `EXIT=137`）与「超时被杀」（`/tmp/astro-build-t32.log` = `EXIT=124`）
     与「前台命令被会话终止」三种可能**无法区分**——按纪律 #7 记为**未定位**，不得写成「就是 OOM」。
- **哪些相关日志还在（P9 证据链的现场）**：本轮亲自 `ls`/`stat` 确认存在：
  `/tmp/build-retry.log`（残骸自身日志，**mtime 与残骸同秒**）、`/tmp/build-real.log`（`EXIT=137`）、
  `/tmp/astro-build-t32.log`（`EXIT=124`）、`/tmp/astro-build-t36.log`（无 EXIT，止于 transforming）、
  `/tmp/astro-build-t12.log`、`/tmp/astro-build-t18.log`、`/tmp/astro-build-t22.log`、`/tmp/astro-build-t23.log`、
  `/tmp/astro-build-t6.log`、`/tmp/astro-build-t6b.log`、`/tmp/astro-build.log`、
  以及 07 引用的 `/tmp/lah-build.log`（`FATAL ERROR: … JavaScript heap out of memory`）、
  `/tmp/site-build-fast2.log`、`/tmp/site-build-heap.log`。
  **风险**：全部在 `/tmp`（易失）。⇒ 与 **02-content-layer 的 P9「构建证据链固化」合并**：
  实施轮应把「同秒日志 + dist 清单」转存为仓库内或 CI artifact（本文件不代做）。
- **能否安全清理与重建的后果（只诊断，不执行）**：
  - **清理安全**：`site/dist` 被 `.gitignore` 忽略（根 `.gitignore` 尾部 `dist/` 与 `site/.gitignore:1-8` 的 `dist/`、`.astro/`），
    `git status --porcelain` 当前输出为 `?? analysis/` + 4 个既有未跟踪 md，**不含 `site/dist`** ⇒ 删它不产生任何 git 变更、不丢版本化内容。
  - **唯一不可再生的是「残骸本身作为证据」**：清理前必须先落一份清单（`find site/dist -type f` + `%T@` 时间戳 + `sha256sum`），
    否则 P9 的现场只剩 `/tmp` 日志。
  - **重建代价**：`cd site && npm run build` = `bash build.sh` → `check-counters.mjs`（约 0.3s，fail fast）→
    `capped astro build`（CPUQuota 90% / MemoryMax 1800M）→ `npx pagefind --site dist`。
    本机历史：成功一次 **484s（exit 0，33 page(s) built）**，也有 560s 超时被杀与 exit 134/137 的记录（README:29 / verify.yml:6-7）
    ⇒ **本机重建「可能成功但不可依赖」**；CI（ubuntu-latest）仍是可靠路径（`verify.yml` 的 `Build site` + `Build sanity`）。
  - **重建失败的最坏后果**：得到一份**同类新残骸**（仍是 0 HTML、仍被 ignore）——不劣于现状；不会污染版本库。
  - **不要顺手删的**：`site/node_modules/`（重建代价最大）、`site/.astro/`（可再生产物，删掉只会让下次 Content Layer 全量 sync；
    其 mtime `2026-10-14 18:11` 晚于 dist，说明残骸之后还跑过一次 `astro sync`/dev）。
  - **不要顺手删的（第二项）**：`site/tools/out/`（visual-check 产物，已 ignore；删它等于删掉既有回归现场）。
- **具体改法（落到文件・行区间）**：本项**不改任何文件**。实施轮的第一步动作序列写成如下骨架（供 06 汇总引用）：
  ```bash
  # 步骤 0（先留证据；只读）
  { echo "# dist relic inventory @ $(date -Is)"; find site/dist -type f -printf '%T@ %s %p\n' | sort;
    find site/dist -type f -exec sha256sum {} +; } | tee /tmp/dist-relic-inventory.log
  grep -n "EXIT=\|transforming" /tmp/build-retry.log /tmp/build-real.log > /tmp/dist-relic-buildlog-markers.log
  # 步骤 1（清理；dist 已 ignore，无 git 影响）
  rm -rf site/dist
  # 步骤 2（重建；本机失败可接受，但必须落日志与退出码）
  ( cd site && npm run build ) > /tmp/site-rebuild.log 2>&1; echo "EXIT=$?" >> /tmp/site-rebuild.log
  # 步骤 3（判据）
  find site/dist -name '*.html' | wc -l        # 期望 33
  ```
- **派生还是手工**：**手工**（清理是一次性运维动作，不是每次构建都该发生）。
  但「本机重建不可依赖」这件事**应由 CI 派生覆盖**（verify.yml 的 `Build sanity` 等值断言 33 已经是这个角色）。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. 清理前留证：`test -s /tmp/dist-relic-inventory.log && grep -c ' site/dist/' /tmp/dist-relic-inventory.log` → 期望 `89`。
    2. 清理后：`test ! -d site/dist && echo ok` → `ok`；`git status --porcelain | grep -c 'site/dist'` → `0`。
    3. 重建后：`find site/dist -name '*.html' | wc -l` → 期望 **33**；`find site/dist -type d -name '.prerender' | wc -l` → **0**。
    4. 关键页非空（逐字复用 `verify.yml` 的清单）：`for p in index.html nav/index.html learn/index.html works/index.html interview/index.html map/index.html details/index.html c/rag/index.html 404.html; do [ -s "site/dist/$p" ] || echo "MISS $p"; done` → **无输出**。
    5. CI 侧（权威判据）：`verify.yml` 的 `Build sanity` 步骤 exit 0。
  - **必须留浏览器目检**：本项**不产生任何目检项**（它是「让目检成为可能」的前置）。
    但清理+重建完成后，组 1–4 的每一条目检项**才**具备可执行条件；实施轮必须在目检记录里注明
    「目检用的 dist 来自 CI artifact 还是本机重建」，**不得**用「构建成功」冒充「页面正确」（00-plan-scope §4.2）。
- **回滚点**：无可回滚——`dist` 非版本化产物；回滚 = 重跑构建。证据日志（`/tmp/dist-relic-*.log`）在清理前落盘，属 append-only。
- **依赖**：无（组 0 是其余各组的先决）。
- **工作量**：**S**（`rm -rf` + 一条构建命令 + 3 条只读判据）。理由：动作本身极小；
  真正的不确定性是「本机重建会不会再次被杀」，而这一点**不增加工作量，只增加失败概率**（已由 CI 兜底）。
- **风险**：① 在 `/tmp` 日志丢失前没落盘证据 ⇒ 已用步骤 0 规避；
  ② 实施者顺手删 `site/.astro` 或 `node_modules` 造成更长的重建 ⇒ 已在「具体改法」里显式列为不要删；
  ③ 把「本机重建成功」当成 CI 绿的替代 ⇒ 已在验收里把 CI `Build sanity` 列为权威判据。

### F0-1｜`/nav/` 纳入 `visual-check.mjs` 的三视口回归清单

- **id**：F0-1｜**来源**：④-20（t4 转交 2）、⑥ 6.2-5
- **目标**：让 33 页里唯一**没有任何几何/截图回归**的 `/nav/` 进入 375/768/1280 三视口断言。
- **现状证据（file:line）**：
  - `site/tools/visual-check.mjs:63-73` 的 `PAGES` 数组实测 **8** 条（`node -e` 数 `{ path:` → 8），
    逐条为 `''`(home) / `learn/` / `works/` / `interview/` / `map/` / `details/` / `c/rag/` / `404.html`——**无 `nav/`**。
  - `/nav/` 是真实存在且被多处链接的顶层页：`site/src/pages/nav.astro:19`（`<h1 class="page-title">`）、
    `Header.astro:10`（`{ href: '/nav/', label: '导航' }`）、`index.astro:239`（`<a class="card depth-card" href={base + 'nav/'}>`）、
    `learn.astro:283`（口径说明里链 `/nav/`）。
  - 它已经进了**另一条**门禁但没有几何断言：`verify.yml` 的 `Build sanity` 关键页清单里**有** `nav/index.html`；
    `PAGES` 却是 8 条 × 3 视口 = 24 次断言（README:29 的「8 页」、run `38350151634` 的 `24/24` 与之吻合）。
  ⇒ 现状是**「页存在」有人管、「页没坏」没人管**，正是 ④-20 登记的风险。
- **具体改法（文件・行区间・字段）**：
  - `site/tools/visual-check.mjs:63-73`：在 `PAGES` 数组**末尾（`404.html` 之后、`];` 之前）追加一条**：
    ```js
    // t4/形式组 0：/nav/ 是 33 页里此前唯一无几何回归的顶层页（Header:10 / index.astro:239 均链向它）。
    // 三段长列表各取一个代表节点：时间线 10 项、代际 5 卡、课程索引 5 组。
    { path: 'nav/', id: 'nav', label: '学习导航', title: 'h1.page-title', container: '.cards .card', cardsMin: 5 },
    ```
    （计数依据：`llm-history.ts` 的 `LLM_HISTORY` 10 项、`LLM_EVOLUTION` 5 项，
    由 `node -e` 数 `date:`/`era:` 字段实测；`nav.astro:65-78` 把 5 个代际各渲染成一个 `<div class="card">`，
    `nav.astro:96-118` 再渲染 5 个 `.nav-course-group`。）
  - **可选加固（建议，但需单独验收）**：给 `PAGES` 条目加一个**可选**字段
    `mustHave: [{ sel: '.llm-timeline li', min: 10 }, { sel: '.nav-course-group', min: 5 }]`，
    在 `checkOne()`（`visual-check.mjs:102` 起）的几何断言之后追加一个同构的「选择器计数 ≥ min」循环，
    失败信息写进既有的 `d.failures` 通道。理由是 `/nav/` 的缺陷形态是「**某一段整段没渲染**」，
    而单容器断言只看得到第一段。
- **派生还是手工**：**手工改一处常量表 + 工具自身把断言派生到 3 视口**；
  页面清单本身**不应**再变成第三份手抄副本——**门禁扩展建议**：让 `PAGES` 与
  `verify.yml` 的关键页清单、`notes/knowledge-map.md` 的「站点 html 33」口径块同源（与批次 A 的门禁扩展合并，见 F0-5 与 01-source-layer 的对应条目）。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. `node -e "const s=require('fs').readFileSync('site/tools/visual-check.mjs','utf8');const m=s.match(/const PAGES = \[[\s\S]*?\n\];/)[0];console.log((m.match(/\{ path:/g)||[]).length)"` → 期望 **9**。
    2. `grep -n "'nav/'" site/tools/visual-check.mjs` → **1** 处命中。
    3. **文案同步（只改「描述」，不许改「历史」）**：
       - 必须改：`README.md` 的 `× 8 页` → `× 9 页`（`grep -o '× 8 页' README.md` 当前 1 处）；
         `.github/workflows/verify.yml:8-9` 的页面枚举（当前只列了**7**个：`首页 /learn/ /works/ /interview/ /map/ /details/ 与课程页 /c/rag/`
         —— **连 `404` 都漏列了**，而 `PAGES` 里有 8 条）⇒ 改为一串**9 项**且与 `PAGES` 逐条对齐（补 `nav/` 与 `404.html`）。
       - **不许改**：`README.md` 里 `21/21`（2 处）与 `24/24`（1 处）——那是**历史 run 的实测结果**，
         改它等于伪造证据（纪律 #2/#4）。新的一次 run 的预期值写在新 run 的记录里（`9 × 3 = 27`），
         旧数字保留并注明「当时 8 页」的语境。
       - 判据：`grep -c '× 9 页' README.md` → 1；`grep -c 'nav/index.html\|/nav/' .github/workflows/verify.yml` → ≥1；
         `grep -c '24/24' README.md` → **1（不变）**。
    4. 静态推演期望的断言总数：`PAGES 9 × VIEWPORTS 3 = 27`；**实际** 27/27 只能在 CI 上得到
       （本机需先有可用的 `site/dist`，见 F0-0），因此第 4 条判据的权威来源是 `verify.yml` 的 run 日志。
    5. `--selftest` 不受影响：`node site/tools/visual-check.mjs --selftest` 期望仍 `26/26`（selftest 用 fixture，不遍历 `PAGES`）。
  - **必须留浏览器目检**：`/nav/` 三段（时间线 10 项 / 代际 5 卡 / 课程索引 5 组）在 375px 下的实际观感、
    汉堡态下导航项是否被遮挡、长列表有无视觉断裂——**留浏览器目检**；几何断言（无横向溢出）**不算**目检通过。
- **回滚点**：删除 `PAGES` 里那一行即可（单行、无其他引用）；`git diff` 只应有一处 `+`。
- **依赖**：F0-0（没有可用 `dist` 时本条的断言跑不起来）；与批次 A 的 P10 口径块同步（第 3 条判据）。
- **工作量**：**S**。理由：一行常量 + 一处 README/workflow 文案；`mustHave` 加固才是 M（要动 `checkOne` 的断言通道）。
- **风险**：① 若把 `container` 选成 `.nav-course-group` 而 5 个阶段数变化，断言会假红 ⇒ 已选 `.cards .card`（代际卡，由 `LLM_EVOLUTION` 派生）；
  ② 只加页面不加断言点，会漏「整段没渲染」这一缺陷形态 ⇒ 已给出 `mustHave` 加固；
  ③ 断言数 24→27 会让 README/run 记录的旧值失真 ⇒ 与 P10 同批改，不许只改一半。

### F0-2｜`visual-check.mjs --selftest` 的落盘约定（无条件写盘的收敛）

- **id**：F0-2｜**来源**：④-17（t3 转交 3）、⑥ 6.2-5
- **目标**：把「本机预检」从**写工作区**改成**写系统临时目录**，让 README:29 宣传的那条命令
  在只读轮次/只读环境里也能安全执行；同时**不动** CI 产物路径（`site/tools/out` 是 artifact 契约）。
- **现状证据（file:line）**：
  - `visual-check.mjs:51`：`const OUT = arg('out', path.join(__dirname, 'out'));`（默认 `site/tools/out`）。
  - `visual-check.mjs:369-370`：selftest 分支 **硬编码** `const outDir = path.join(__dirname, 'out', 'selftest'); fs.mkdirSync(outDir, { recursive: true });`——**忽略 `--out`**。
  - `visual-check.mjs:432`：`fs2.writeFileSync(path.join(outDir, 'selftest-report.json'), …)` **无条件执行**（唯一出口是 `process.exit(0/1)` 在两行之后）。
  - 主流程同样落盘：`visual-check.mjs:257`（`mkdirSync(OUT)`）、`:459-460`（`mkdirSync(OUT)` + 写 `report.json`）、`:239`（写 `*_<vp>.png`）。
  - `README.md:29` 末列：「本机预检 `cd site && node tools/visual-check.mjs --selftest`（自带 fixture，不依赖构建，26/26）」
    ——**未提示它会写盘**。
  - `site/tools/out/` 已被忽略（根 `.gitignore:25`），所以它**不**会污染 `git status`；真正的代价是
    「只读轮次里出现无法解释的新文件」与「CI artifact 之外多一份人手产物」。
- **具体改法（文件・行区间）**：
  1. `site/tools/visual-check.mjs:369`（selftest 分支）改为：
     ```js
     // 形式组 0：selftest 是本机预检，默认不再写工作区（改落 os.tmpdir()）。
     // 需要留档时显式 --out <dir>；CI 的主流程（非 selftest）路径不变，仍是 site/tools/out。
     const outDir = arg('out', path.join(os.tmpdir(), 'lah-visual-selftest'));
     ```
     并在文件头 import 区补 `import os from 'node:os';`（`:1-20` 区域内，紧邻既有 `node:path` import）。
  2. `visual-check.mjs:432` 的写盘**保留但加一行可见提示**（不改写行为，只消除静默）：
     ```js
     console.log(`[visual-check] selftest 报告 → ${path.join(outDir, 'selftest-report.json')}`);
     ```
     ——「无条件写盘」本身**不是**缺陷（有 report 才可复核），缺陷是**写在哪、有没有说**。
  3. `visual-check.mjs:51` 的 `OUT` 默认值**不动**：`verify.yml` 的 `Upload screenshots + report` 用 `path: site/tools/out`，
     改默认值会直接打断 CI artifact 契约。
  4. `README.md:29`：把「（自带 fixture，不依赖构建，26/26）」改为
     「（自带 fixture，不依赖构建，26/26；报告默认落 `$TMPDIR/lah-visual-selftest/`，传 `--out site/tools/out/selftest` 可留档）」。
- **派生还是手工**：**手工**（一次性的路径默认值 + 一行提示 + 一句文档）。
  派生空间有限：selftest 的落盘位置是常量，没有可派生的真源。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. `grep -n "os.tmpdir()\|node:os" site/tools/visual-check.mjs` → 期望 **≥2** 处命中（import + 使用）。
    2. `grep -n "path.join(__dirname, 'out', 'selftest')" site/tools/visual-check.mjs` → 期望 **0** 处。
    3. 前后对比（现在就有基线，**动作前必须先跑一次**）：`find site/tools/out -type f 2>/dev/null | wc -l` 记下 N；
       修完后跑 `node site/tools/visual-check.mjs --selftest`，再跑同一条命令 → 期望**仍是 N**（默认不再写工作区）。
    4. `grep -n "site/tools/out" .github/workflows/verify.yml` → 期望仍命中 `path: site/tools/out`（**未被误改**）。
  - **必须留浏览器目检**：本项**不产生**目检项（报告的产出路径与页面呈现无关）。
- **回滚点**：`git diff site/tools/visual-check.mjs` 应只有 selftest 分支与 import 两处 `+/-`；回滚即 `git checkout -- site/tools/visual-check.mjs`。
- **依赖**：无（可与 F0-1 同一次改，两者都在同一文件、行号不重叠：F0-1 在 `:63-73`，F0-2 在 `:1-20`/`:369`/`:432`）。
- **工作量**：**S**。理由：3 处行级编辑 + 1 句 README；真正的成本是「跑一次 selftest 验证默认不落盘」，
  而本机跑得动（selftest 用 fixture、不依赖构建，README:29）。
- **风险**：① 顺手改了 `OUT` 默认值 ⇒ 会打断 CI artifact 上传（已在改法第 3 点点名「不动」）；
  ② 把 selftest 报告改到 tmpdir 后**丢掉**了 CI 侧的可复核性 ⇒ selftest 不进 CI（CI 走主流程），影响为零；
  ③ 若实施时把 `--out` 语义改成「selftest 与主流程共用」，会让 README 的两个命令产生两种路径语义 ⇒ 已把 README 文案写死为两句话。

### F0-3｜`viz/mermaid-check.mjs` 硬编码绝对路径的可移植化

- **id**：F0-3｜**来源**：④-16（t3 转交 2）、⑥ 6.2-5
- **目标**：让 `viz/mermaid-check.mjs` 不再写死本机路径，能在别的 checkout / 别的机器上直接跑。
- **现状证据（file:line，**注意行号修正**）**：
  - `viz/mermaid-check.mjs:10`：`const DIST = '/home/ubuntu/app/learn-agent-harness/site/dist';`
    ——④-16 登记为「:9」，**实测在 :10**（`:9` 是 `import { stat }` 那句的上一行）；按 07 的「引用时用修正值」纪律，本文一律用 `:10`。
  - `viz/mermaid-check.mjs:49`：`const chrome = '/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';`
    ——**④ 只登记了 DIST，漏了这条**。它把「Chromium 版本号」钉死（`chromium-1234`），playwright 升级即失效。（与 04-F7 的「六处已同步 vs 三处未同步」同类形态，但本条是形式层。）
  - 同文件已经证明「派生的写法可行」：`mermaid-check.mjs:19` `const NOTES_DIR = fileURLToPath(new URL('../notes/', import.meta.url));`
    ——同一个文件里既有正确派生又有写死路径。
  - 仓库里已有现成的**可复用解析器**：`viz/render.mjs:58-66` 的 `CHROME_CANDIDATES`（`CHROME_PATH` 环境变量 →
    `$HOME/.cache/ms-playwright/chromium-1234/{chrome-linux64,chrome-linux}/chrome` → `/usr/bin/google-chrome`）
    与 `:103` 的 `find(p => existsSync(p))`。
- **具体改法（文件・行区间）**：
  1. `viz/mermaid-check.mjs:10` 改为派生 + 环境变量逃生口：
     ```js
     // 形式组 0：从本文件位置派生（与 :19 的 NOTES_DIR 同一套写法），并允许显式覆盖。
     const DIST = process.env.LAH_DIST ?? fileURLToPath(new URL('../site/dist/', import.meta.url));
     ```
     （`:19` 已经在用 `fileURLToPath`，import 无需新增。）
  2. `viz/mermaid-check.mjs:49` 改为复用 `render.mjs` 的候选表——**推荐抽成 `viz/chrome.mjs`**：
     ```js
     // viz/chrome.mjs（新建，~15 行）
     import { existsSync } from 'node:fs';
     export const CHROME_CANDIDATES = [
       process.env.CHROME_PATH,
       `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`,
       `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux/chrome`,
       '/usr/bin/google-chrome',
     ].filter(Boolean);
     export function findChrome() {
       const p = CHROME_CANDIDATES.find((c) => { try { return existsSync(c); } catch { return false; } });
       if (!p) { console.error('no Chromium found — set CHROME_PATH to a chrome/chromium binary'); process.exit(2); }
       return p;
     }
     ```
     `mermaid-check.mjs:49-50` 改为 `const browser = await chromium.launch({ executablePath: findChrome(), headless: true });`，
     并把 `viz/render.mjs:58-66` 的候选表替换为 `import { findChrome } from './chrome.mjs'`（**只去掉重复，不改行为**）。
     ——注意 `render.mjs` 的候选表里 `CHROME_PATH` 缺失时是 `undefined`，现有 `find` 会 `existsSync(undefined)` 抛异常被 `try` 吞掉；
     抽模块时顺手用 `.filter(Boolean)` 消掉这个隐患。
  3. `viz/mermaid-check.mjs:49` 若**不**抽模块（保守方案）：至少改成 `const chrome = process.env.CHROME_PATH ?? '<现路径>';`，
     并把「版本号 1234 会过期」写成注释 + 失败时打印 `CHROME_PATH` 指引。**推荐抽模块**，理由：避免第三份候选表。
- **派生还是手工**：**派生**（路径从 `import.meta.url` 派生，浏览器从候选表探测）。
  这正是纪律 #5「修显示值不如修生成器」的同类：写死的是**环境值**，修的是**取值的派生方式**。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. `grep -rn "/home/ubuntu" viz/*.mjs` → 期望 **0** 命中（当前 2 命中：`:10`、`:49`）。
    2. `node --check viz/mermaid-check.mjs && node --check viz/chrome.mjs && node --check viz/render.mjs` → 三条 exit 0。
    3. 派生值正确性（只读，不启浏览器）：`node -e "import('./viz/chrome.mjs').then(m=>console.log(m.findChrome()))"` → 打印一个存在的路径。
       路径判据：`node -e "import('node:url').then(async u=>{const {fileURLToPath}=u;console.log(fileURLToPath(new URL('../site/dist/', new URL('file://'+process.cwd()+'/viz/mermaid-check.mjs'))))})"`
       → 打印 `<repo>/site/dist`（形状判据：以 `site/dist` 结尾，且 `test -d` 为真）。
    4. **不实跑 `mermaid-check.mjs`**：它需要 `site/dist` 里有 HTML（F0-0 的产物）+ 启 Chromium + 占 8099 端口。
       边界更正（就地划改 00-plan-scope §0.3）：我通读了 `viz/mermaid-check.mjs` 全文，
       **它不写工作区**（全文件只有 `console.log` 与 `process.exit`，无 `writeFile`/`mkdir`/`createWriteStream`）；
       00-plan-scope 把它归入「会写产物的脚本」是**不准确的**。本轮仍不跑它，理由改为**依赖不可用的 dist + 起浏览器属于重资源动作**。
  - **必须留浏览器目检**：本项**无目检项**（改的是工具的取值方式）。
    但修复的**收益**要在 F0-0 重建成功后由 `node viz/mermaid-check.mjs` 的 `RESULT: PASS` 体现，
    该 run 的判据是机器可读的；**图注/图号的观感**另见 F4-2（那条才是目检项）。
- **回滚点**：`git checkout -- viz/mermaid-check.mjs viz/render.mjs` + 删 `viz/chrome.mjs`（若采用抽模块方案）。
- **依赖**：与 F0-0 弱相关（不修也能改代码，只是改完无法端到端验证）。
- **工作量**：**M**。理由：抽 `viz/chrome.mjs` 要同时改两个调用方并保持 `render.mjs` 行为不变
  （render.mjs 还带 node12 re-exec 自举逻辑，回归面比 mermaid-check 大）；不抽模块则是 S。
- **风险**：① 抽模块时改了 `render.mjs` 的候选顺序 ⇒ 会让原本能渲染的机器变成找不到浏览器 ⇒ 验收第 3 条要求打印真实路径；
  ② 把 `DIST` 换成 `process.env.LAH_DIST` 而没设默认值 ⇒ 在 vite/CI 下变成 `undefined` ⇒ 已写成 `?? 派生值`；
  ③ `playwright-core` 的 Chromium 版本号会随后续 `npm i` 变化 ⇒ 候选表里保留两条已知路径 + `CHROME_PATH` 逃生口，
     并建议（**决策点 D3**）改用 `process.env.PLAYWRIGHT_BROWSERS_PATH` 或 playwright 自身解析。

### F0-4｜（跨批次）纪律 #9 的类集合比对升级为机器门禁

- **id**：F0-4｜**来源**：本文件 §0.2（纪律 #9 的两轮比对）+ 批次 A 的「门禁扩展」
- **目标**：把「CSS 定义类集合 vs 页面输出类集合」的差集做成**每次构建都会跑的检查**，
  使 `.lf-count-note` / `.works-note` / `.details-entry` 这类**静默失效**在选择器层面被抓住，而不是靠人眼看页面。
- **现状证据（file:line）**：
  - 现状**无任何**类集合门禁：`site/tools/` 下只有 `check-counters.mjs`（口径数字）与 `visual-check.mjs`（浏览器几何），
    两者都不做类集合比对（`check-counters.mjs` 通读后确认只重算口径块数字）。
  - 缺陷实证：`learn.astro:341` 定义了 `.lf-count-note` 而页面输出的是 `lw-count-note`
    （输出点 `learn.astro:271/276/281`，定义 `learn.astro:383`）——**只差一个字母前缀**，
    浏览器里看不出任何异常（这条规则本来只调字号/颜色），纪律 #9 正是为这类缺陷写的。
- **具体改法**：
  1. 新增 `site/tools/check-classes.mjs`（**只读**，Node 内置模块，不读 `dist`、不读 `node_modules`、无网络、无浏览器）：
     主体就是 §0.2 那段脚本，加上两点工程化：
     - **白名单**（必须显式列出，避免下一次差集变成噪声）：`astro-code`、`katex-display`（外部插件注入）、
       `dc-`/`ev-`（注释里的通配写法，或直接在扫描前剥掉 `/* */` 注释以根治伪差集——**推荐剥注释**）；
     - **退出码**：差集非空即 `exit 1`，打印每条 `.<class>  <- <定义文件>:<行>`（行号要真给，扫描时记录偏移）。
  2. 挂到 `site/build.sh`：插在 `:41-46` 的 `check-counters` 之后、`:53` 的 `capped "$ASTRO" build` 之前，
     写法与既有门禁**同构**（fail fast，且 `build:fast` 仍是绕过通道）：
     ```bash
     if ! node tools/check-classes.mjs; then
       echo "build.sh: 类集合门禁未通过（CSS 定义了但页面从不输出的类）——见上方清单。" >&2
       exit 1
     fi
     ```
  3. 挂到 `.github/workflows/verify.yml`：在 `Counter consistency gate (口径门禁)` 步骤之后加一个同名风格的
     `Class-set gate (类集合门禁)` 步骤（`run: node site/tools/check-classes.mjs`），
     **仍置于 `Build site` 之前**（理由与口径门禁逐字相同：廉价可判定、fail fast）。
  4. 同时清掉 §0.2 裁定为「真死」的 3 个选择器（`.details-entry` `global.css:732-734`、
     `.works-note` `global.css:725-730`、`.lf-count-note` `learn.astro:341`）——**门禁与清零必须同一批**，
     否则第一次跑门禁就是红的。
     清零的**替代路径**：若 `.lf-count-note` 是「本该用却写错前缀」的意图残留，则应把
     `learn.astro:271/276/281` 的 `lw-count-note` 改成 `lf-count-note`（保留内联定义、删 `:383`），
     **这是命名统一决策**，见 §未决决策点 D1。
- **派生还是手工**：**派生**（门禁每次从源码重算，不手抄清单）；清零动作是**手工一次**。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. `node site/tools/check-classes.mjs` → 期望 **exit 0**，输出 `差集: 0`（**三步全做**：剥注释 → 认识动态类名 → 白名单）。
    2. **中间态数值必须逐条对上**（否则说明扫描器的某一步没生效）：
       - 原版脚本（§0.2 的代码、不剥注释、不认动态类）→ `差集: 10`（与本轮基线一致）；
       - 只剥注释 → `差集: 8`（`.dc-`/`.ev-` 消失）；
       - 剥注释 + 认动态类名 → `差集: 5`（`.kind-*` 三项被认可）；
       - 再清掉 3 个真死选择器 → 最终 `差集: 0`。
       任一步的实测值与上列不符 ⇒ **扫描器实现与本文件的基线不同源**，必须先对齐再挂门禁。
    3. `grep -n "check-classes" site/build.sh .github/workflows/verify.yml` → 期望 **2** 处命中。
    4. `grep -rn "lf-count-note\|works-note\|\.details-entry\b" site/src` → 期望 **0** 命中（清零后）。
    5. 负路径自证（**必须做**，否则门禁可能恒真）：临时在 `global.css` 末尾追加 `.zzz-never-output {}`，
       跑 `node site/tools/check-classes.mjs` → 期望 `exit 1` 且输出含 `.zzz-never-output`；随后 `git checkout -- site/src/styles/global.css` 还原。
  - **必须留浏览器目检**：本项**无目检项**；但清零 3 个选择器时，`.details-entry`（`max-width:48em`）
    与 `.works-note`（`color: var(--text-faint)`）的**删除是否让某个页面变宽/变色**，属
    「删死规则会不会改变观感」——严格说死规则不可能改变观感，但**若某个元素靠继承拿到了这两个值**，
    就会变 ⇒ 因此对 `/works/` 与 `/details/` 两页在 1280px 下**留浏览器目检一次**（一次即可，不是每页）。
- **回滚点**：删 `site/tools/check-classes.mjs` + 还原 `build.sh`/`verify.yml` 的两处插入；清零的选择器可由 `git checkout` 恢复。
- **依赖**：批次 A 的门禁扩展（口径块「站点 html 33」等 P10 条目）——**建议同批落地**，因为两者都改 `build.sh` 的同一段插入点。
- **工作量**：**M**。理由：脚本本体可复制 §0.2（约 40 行），成本在**白名单设计与负路径自证**；
  接进 `build.sh`/`verify.yml` 是 6 行。若只做脚本、不挂门禁，则降为 S。
- **风险**：① 白名单写成「兜底吞掉一切」⇒ 门禁恒真（已用验收第 5 条的负路径自证封死）；
  ② 扫描器把 CSS 注释里的通配写法当类名 ⇒ 伪差集（已给「剥注释」的根治方案）；
  ③ 动态类名（`kind-${kind}`、`class:list`、`{cond ? 'a' : 'b'}`）会被误判为死 ⇒
  必须在脚本里**同时**扫描 `.astro`/`.ts` 里的模板字符串与三元表达式的字面量片段，
  **否则这个门禁会强制未来每次改动态类名都去加白名单**——这是本项最大的工程风险，必须在实施时按验收第 2 条逐条核对差集清单。

---

## 组 1 · 入口层（`index` / `404` / `nav`）

> ⑧ 08-synthesis §3.6 结论（本轮亲自回读源码复核）：**两个 blocker 都在这里**——
> `index.astro:48` + `:51-55` 首屏承诺句无一处展开；`index.astro:156-157/164-165/185-186` + `404.astro:42`
> 一屏 **11 个**未展开专名（SSE / JSONL / BM25 / RRF / golden set / journal / checkpoint / SIGKILL / replay / skip / OTel），全页无释义。
> 两个 blocker 的裁决依据见 `analysis/content/07-verification.md:85-86`（t7 逐字复核成立）。
> **边界**：11 个专名里是否有**错值**属内容轮；本组只解决「首现既不展开、也不指路」这件**呈现事实**。

### F1-1｜`index.astro` 首屏（`:45-61`）密度收敛 + 术语就地展开

- **id**：F1-1｜**来源**：08 §3.6 blocker F1（t6-F1，confirmed）、④-1（首屏侧）
- **目标**：首屏保留「这是什么 / 从哪开始」，把**未定义概念**从「断言」改为「可就地展开」，
  使读者不必先跳出去才能读懂第一屏。
- **现状证据（file:line）**：
  - `index.astro:47-61` 首屏 `<section class="hero">`：
    `:48` `hero-kicker`「coding agent 工程师 · 五阶段课程体系 · 每课带可运行参考样本」；
    `:49` `<h1>从 0 到能写 agent 工具</h1>`；
    `:50-55` `hero-sub`（一整段里含「可运行的参考样本」「clone 下来就能跑，全离线零 key」「增量主线」「{MILESTONES.length} 个里程碑」）；
    `:56-60` `hero-actions` 三个按钮。
  - 整段**无任何**术语定义、无内链到释义（07:85 的复核原文：整段未出现任何「agent / harness / 样本」的定义或外链）。
  - 07 同时记明这属「可复核的文本事实 + 明示读者设定」，量不可复现的部分（难度评分）与首屏无关。
- **具体改法（文件・行区间・样式块）**：
  1. `site/src/pages/index.astro:50-55`：把 `hero-sub` 拆成**承诺行 + 展开行**两句：
     承诺句（保留「{COURSE_COUNT} 课 · 五个阶段 · {DOMAIN_COUNT} 个知识域」）留在 `p.hero-sub`；
     解释句（clone/离线/增量主线/里程碑）移入新 `<p class="hero-sub-detail">`。
  2. 在 `:55`（`hero-sub` 的 `</p>`）与 `:56`（`<div class="hero-actions">`）**之间插入**术语条（新块，约 12 行）：
     ```astro
     <!-- 首屏术语条（形式组 1 / t6-F1）：首屏出现的未定义概念就地可展开，不必跳页 -->
     <details class="hero-terms" id="hero-terms">
       <summary>首屏这几个词是什么意思？</summary>
       <dl class="hero-terms-list">
         <div><dt>agent</dt><dd>能自己决定「调哪个工具、传什么参数」的模型程序；本仓的 agent 是「一个循环 + 工具协议」。</dd></div>
         <div><dt>harness</dt><dd>跑 agent 的那层壳：循环、工具协议、流式输出、权限门、轨迹落盘都在这里。</dd></div>
         <div><dt>参考样本</dt><dd>每门课配的可 clone 可运行的最小工程（本仓 6 个 demo + 白板版）；不是成品，是能跑起来的对照。</dd></div>
         <div><dt>增量主线</dt><dd>不是读 17 个 demo，而是按 5 个 milestone 亲手把 harness 一层层写出来。</dd></div>
         <div><dt>零 key</dt><dd>不需要任何模型 API key 就能跑——本地 mock 或离线确定性重放。</dd></div>
       </dl>
     </details>
     ```
  3. 首现专名加语义标记（**视觉零变化**，供脚本核对与将来生成术语条）：
     `:48` 的「agent」→ `<dfn data-term="agent">agent</dfn>`；`:51` 的「参考样本」→ `<dfn data-term="sample">参考样本</dfn>`；
     `:53` 的「增量主线」→ `<dfn data-term="milestone-track">增量主线</dfn>`。
  4. 样式块：`site/src/pages/index.astro` 的 `<style>` 区（`:289-413`）**末尾 `:412-413` 之前**追加 3 条规则
     （页面级即可，仅首页用）：
     ```css
     .hero-sub-detail { display: block; margin: 6px 0 0; font-size: 0.92rem; color: var(--text-soft); }
     .hero-terms { margin: 10px 0 0; font-size: 0.92rem; color: var(--text-soft); }
     .hero-terms summary { cursor: pointer; color: var(--accent); }
     .hero-terms-list { margin: 8px 0 0; padding-left: 0; }
     .hero-terms-list dt { font-weight: 600; }
     .hero-terms-list dd { margin: 0 0 6px 0; }
     ```
  5. 若最终采纳「术语表上站」（批次 B 的 P7）⇒ 把 `<details>` 内容改为**链到术语表页 + 保留首现 `<dfn>`**
     （见 §未决决策点 **D2**）；本条的 `<dfn>` 标记**无论哪种都要加**，它是两条路线的公共前置。
- **派生还是手工**：**手工**（一次性文案 + 标记）。
  可派生的部分是把「首屏出现的专名」变成脚本可核对的事实：`<dfn data-term>` 让
  「首屏还有几个专名没被覆盖」成为可机器验证的量（见验收），这是**把主观的「密度太高」变成可清点的集合**。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. `grep -c '<dfn' site/src/pages/index.astro` → 期望 **≥3**（`:48/:51/:53` 三处）。
    2. `grep -c 'id="hero-terms"' site/src/pages/index.astro` → 期望 **1**；`grep -c 'hero-terms' site/src/pages/index.astro` → 期望 **≥2**（标记 + CSS）。
    3. **首屏专名清点**（把「密度」变成集合）：`sed -n '45,61p' site/src/pages/index.astro | grep -o 'data-term="[^"]*"' | sort -u | wc -l`
       → 期望 **≥3**；且 `sed -n '45,61p' site/src/pages/index.astro | grep -cE 'SSE|BM25|RRF|JSONL|checkpoint|SIGKILL|OTel'` → 期望 **0**（首屏与 11 专名列表不重叠，重叠则说明拆分越界）。
    4. 第二轮类集合比对：重跑 §0.2 脚本 → `.hero-sub-detail` / `.hero-terms` / `.hero-terms-list` **不得**出现在差集里（即定义集与输出集都有它们）。
    5. `node site/tools/check-counters.mjs` → exit 0（本条未动任何计数，回归确认）。
  - **必须留浏览器目检**：
    ① 375px 下 `details` **收起态**时，`hero-actions` 三个按钮是否仍在**首屏内**（这是本条的真正目标，几何断言抓不到「首屏」这个语义）；
    ② 展开 `details` 后的高度跳变是否会盖住/推开 `route-grid`；
    ③ `<dfn>` 的浏览器默认斜体是否与周围正文冲突（若冲突，改 `font-style: normal; border-bottom: 1px dotted;`——**这条必须目检后才决定**）；
    ④ 1280px 首屏右半是否出现大片空白（拆分后承诺行变短）。
- **回滚点**：`git diff site/src/pages/index.astro` 应只涉及 `:45-61` 与 `<style>` 末尾两处；单文件、单页、无数据依赖，回滚 = `git checkout -- site/src/pages/index.astro`。
- **依赖**：D2 的决策（术语表是否上站）；无其他前置（不依赖 F0 组的技术前置，但**目检**需要 F0-0 产出 HTML）。
- **工作量**：**M**。理由：文案只有 5 条定义，但要**逐条**确认「首屏确实出现了这些词」并保持 375px 首屏不破；
  真正的成本在**目检 4 个视口行为**，不在写代码。
- **风险**：① 把术语条写成了「页尾脚注」而非首屏就地展开 ⇒ **直接违背本条的目标**（07:85 判的就是「无一处展开」）；
  ② 拆分 `hero-sub` 时丢了 `{MILESTONES.length}` 等模板变量 ⇒ 这些是**派生值**，必须保留模板写法，不许写成 5；
  ③ `<dfn>` 语义被 CSS 的 `.markdown dfn` 规则影响（若同时改 F4-1）⇒ 两处样式需放在同一处并目检。

### F1-2｜`index.astro` 作品卡（`:151-193`）的 11 专名就地指路

- **id**：F1-2｜**来源**：08 §3.6 blocker F2（t6-F2，confirmed）、④-2 的绑定项
- **目标**：卡片上的专名**不再只是卖点**——每个首现专名要么就地可展开，要么有一个统一入口。
- **现状证据（file:line）**：
  - `index.astro:151-194` `<div class="cards">` 内含 6 张 `a.card.depth-card`；专名分布（07:86 的复核行号，本轮回原文逐行确认）：
    - `:156-157` `harness-demo` 卡：「loop / 工具协议 / **SSE** 流式 / 权限门 / **JSONL** 轨迹 + 崩溃恢复 / token 压缩」
    - `:164-165` `rag-demo` 卡：「chunking → hash embedding → 暴力余弦 ∥ **BM25** → **RRF** 融合 → 强制引用 → **golden set** 评测」
    - `:172-173` `sandbox-demo` 卡：「**四通道 policy 引擎**（deny > approve > sandbox > allow）+ 幽灵事故重放」
    - `:179` `mcp-demo` 卡：「MCP 供应链投毒演示：mock server 注入 → 模型被劫持 → 四层防御拦截，**单层消融**」
    - `:185-186` `durable-execution-demo` 卡：「**journal** 双锚点 + **checkpoint** 原子写；3 种崩溃点真实 **SIGKILL**，恢复按判定表 **replay / skip / unknown→confirm**」
    - `:192` `framework-demo` 卡：「Claude Agent SDK 四能力」
  - 「全页无释义」由 07:86 用一条 `grep -n` 实测确认（命中**仅**这些卡片行，且 404 页仅 `:42` 一处）。
- **具体改法（文件・行区间・样式块）**：
  1. `site/src/pages/index.astro`：对上述每个首现专名包一层 `<dfn class="term" data-term="<英文原名>">…</dfn>`，
     **逐行落点**：`:156`（`SSE`）、`:157`（`JSONL`）、`:164`（`BM25`）、`:165`（`RRF`、`golden set`）、
     `:172`（`policy 引擎`）、`:179`（`消融`）、`:185`（`journal`、`checkpoint`、`SIGKILL`）、`:186`（`replay`、`skip`、`unknown→confirm`）。
     这层标记**视觉零变化**（不加下划线、不改色），目的是让「覆盖了几个专名」可被脚本清点。
  2. 在 `:194`（`.cards` 的 `</div>`）与 `:195`（`<p class="depth-foot">`）**之间插入**页内术语清单：
     ```astro
     <!-- 作品卡专名清单（形式组 1 / t6-F2）：11 个专名的就地展开入口 -->
     <details class="term-sheet" id="terms">
       <summary>卡片里的 SSE / BM25 / journal…都是什么？</summary>
       <dl class="term-sheet-list">
         <div><dt>SSE</dt><dd>Server-Sent Events：服务端用一条长连接把模型输出一个字一个字推给前端。</dd></div>
         <div><dt>JSONL</dt><dd>每行一个 JSON 的文件格式；本仓用来逐条落盘 agent 的对话轨迹，崩溃后能接着读。</dd></div>
         <div><dt>BM25</dt><dd>经典关键词检索打分函数（TF-IDF 的改良版）。</dd></div>
         <div><dt>RRF</dt><dd>Reciprocal Rank Fusion：把「关键词检索」与「向量检索」两份排名按 1/(k+rank) 融合成一个排名。</dd></div>
         <div><dt>golden set</dt><dd>人工标注好的固定测试集；每次改动都拿它算 recall@k，防止「感觉变好了」。</dd></div>
         <div><dt>journal</dt><dd>执行的追加日志：每步做之前先记「打算做什么」，崩溃后靠它判断哪一步要重放。</dd></div>
         <div><dt>checkpoint</dt><dd>周期性存的完整状态快照，用来避免从头重放整条日志。</dd></div>
         <div><dt>SIGKILL</dt><dd>杀进程的信号，进程**无法**捕获或清理——用它模拟最粗暴的崩溃。</dd></div>
         <div><dt>replay / skip / unknown→confirm</dt><dd>恢复判定表的三种结论：重放该步、跳过（已确认生效）、不确定就先问人。</dd></div>
       </dl>
     </details>
     ```
     并在 6 张卡的 `p` 之后（`:158`/`:166`/`:174`/`:180`/`:187`/`:193` 之后，各自 `</a>` 之前）**不**逐卡插入链接
     —— 逐卡插入会在 `a.card`（整卡是链接）里套第二个 `<a>`，**HTML 不允许**（`index.astro:152` 是 `<a class="card depth-card">`）。
     ⇒ 统一入口放在**分块层级**：`:195` 的 `depth-foot` 那句里追加一个 `<a href="#terms">专名速查</a>`。
  3. 样式块：新类 `.term-sheet` / `.term-sheet-list` 放进 `site/src/styles/global.css`
     （理由：F4-1 的课程页 `<dfn>` 也要用同一套规则），插入位置 `global.css:520` 之后（紧跟 `.markdown blockquote` 区域，`:496-506` 之后），
     形如：`dfn.term { font-style: normal; border-bottom: 1px dotted var(--accent); }`
     `.term-sheet { margin: 12px 0 0; font-size: 0.92rem; }`
     `.term-sheet summary { cursor: pointer; color: var(--accent); }`
     `.term-sheet-list dt { font-weight: 600; }`
     `.term-sheet-list dd { margin: 0 0 6px; color: var(--text-soft); }`
  4. **与 F1-3 共用同一份术语定义**：404 页的 `OTel` 条目并入同一 `dl`（跨页共享可在实施时抽 `site/src/data/glossary.ts`，
     见 §未决决策点 **D2**；本轮不预设文件位置）。
- **派生还是手工**：**手工**（文案）。**但覆盖度必须可派生核对**：
  「11 个专名是否都被标记」由 `data-term` 的集合与 07:86 给出的 11 词清单做集合比对（验收第 2 条）。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. 覆盖度集合比对（**本条的核心判据**）：
       ```bash
       cd /home/ubuntu/app/learn-agent-harness
       for t in SSE JSONL BM25 RRF "golden set" journal checkpoint SIGKILL replay skip OTel; do
         printf '%-12s index=%s sheet=%s\n' "$t" \
           "$(grep -c "$t" site/src/pages/index.astro)" "$(awk '/id="terms"/,/<\/details>/' site/src/pages/index.astro | grep -c "$t")"
       done
       ```
       期望：`sheet` 列**全部 ≥1**（11 个词都在速查清单里）；`index` 列对 OTel 为 0（它在 404 页，见 F1-3）。
    2. `grep -c 'data-term=' site/src/pages/index.astro` → 期望 **≥10**（11 词里 10 个在首页）。
    3. `grep -n 'id="terms"' site/src/pages/index.astro` → **1**；`grep -c 'href="#terms"' site/src/pages/index.astro` → **≥1**。
    4. **不许在卡片链接里套链接**（结构性反例检查）：
       `awk '/class="card depth-card"/,/<\/a>/' site/src/pages/index.astro | grep -c '<a '` → 期望 **6**（每卡恰好自身一个 `<a`，无嵌套）。
    5. 第二轮类集合比对：`.term-sheet`、`.term-sheet-list`、`dfn.term` 不得进差集。
  - **必须留浏览器目检**：
    ① `details` 在卡片墙**之后**的插入位置是否读起来像「卡片墙的脚注」而不是「另一块内容」；
    ② `:195` 的 `depth-foot` 那行在加了「专名速查」后是否换行破版（375px）；
    ③ `dfn.term` 的点线下划线在 1280px 密集卡片文本里是否**过于噪**（若噪，改成只保留 `data-term` 不加下划线——**必须目检后决定**）；
    ④ 6 张卡在 `auto-fill minmax(280px,1fr)`（`global.css:334-338`）下的**高度参差**是否因 `details` 插入而更明显。
- **回滚点**：单文件（`index.astro`）+ 单样式块（`global.css:520` 之后）可分别回滚。
- **依赖**：F1-3（OTel 条目并入同一份定义）、D2（清单是否上站/抽成 `glossary.ts`）。
- **工作量**：**M**。理由：11 条定义文字 + 逐行 13 处标记，机械但量大；
  风险集中在「整卡是链接」这一结构约束（已在改法第 2 点点名）。
- **风险**：① **在 `a.card` 内插入 `<a>`**——HTML 规范不允许，浏览器会拆开卡片 ⇒ 已用验收第 4 条封死；
  ② 把速查清单做成**折叠在页尾**而卡片上没有指向它的线索 ⇒ 违背 blocker 的修复意图（必须有 `href="#terms"` 入口）；
  ③ 定义里出现新的未定义专名（如 RRF 定义里的「向量检索」）⇒ 实施时每条定义只允许引入**前一屏已出现或同表内已定义**的词。

### F1-3｜`404.astro:42` 的引导卡文案与专名

- **id**：F1-3｜**来源**：08 §3.6 blocker F2（t6-F2）、④-18（t3 转交 4）
- **目标**：404 页第 3 张卡的**专名**与**计数**同时收口：专名并入术语清单，计数改为派生。
- **现状证据（file:line）**：
  - `404.astro:39-43` 第三张卡 `<a class="card" href={base + 'works/'}>`；`:42`
    `<p>6 个可运行 demo 与实测记录（轨迹、OTel、压缩自测）。</p>`——**OTel 是 11 专名里最靠后、也最容易漏的一个**（07:86 明写「404.astro 仅 :42 一处」）。
  - 数字 `6` 是**手抄常量**：真源是 `site/src/data/courses.ts:298` `export const WORK_COUNT = 6;`
    （`index.astro:15/145` 与 `interview.astro:12` 都从它派生）。
  - `404.astro:9-10` 的注释写明本页「不 import `site/src/data`（out of scope）」——所以这个手抄是**有理由的**，不是疏忽。
- **具体改法（文件・行区间）**：
  1. `site/src/pages/404.astro:42` 文案改为：
     ```astro
     <p>{WORK_COUNT} 个可运行 demo 与实测记录（对话轨迹、可观测性、上下文压缩的自测记录）。</p>
     ```
     即：`OTel` → 「可观测性」（**消掉最后一个未展开专名**）；`轨迹` → 「对话轨迹」（同页不再出现裸缩写）。
  2. `site/src/pages/404.astro:13-15` 的 import 区加一行：`import { WORK_COUNT } from '../data/courses';`
     ——**这是对 `:9-10` 注释里那句 out-of-scope 的有意修订**：本页是构建期静态页，`courses.ts` 是纯数据模块
     （无 `astro:content` 依赖，`index.astro` 已经在用同一导入），引入它不新增运行时依赖，只少一份手抄数字。
     若不采纳（见 §未决决策点 **D4**），则保留 `6` 但必须把它登记进 `check-counters.mjs` 的交叉核对清单（批次 A 的 P10）。
  3. `404.astro:46` 那句「或直接点顶栏八个导航项」的「八个」**未在 ④ 登记，但同属手抄计数**：
     真源是 `Header.astro:4-12` 的导航数组。本轮**只登记不改**（避免越界到 Header 的口径），
     在 §依据不足项里注明「`404.astro:46` 的『八个』与 `Header.astro` 导航项数的一致性本轮未核对」。
  4. 术语条目：`OTel` 不再出现后，F1-2 的 `dl` 里**不需要** OTel 条目；
     ⇒ F1-2 验收命令第 1 条的 `sheet` 列对 `OTel` 允许为 0，**但 `index.astro` 与 `404.astro` 合计命中数必须为 1**
     （即这个词在全站只出现一次，且出现处已被改写成中文）。
- **派生还是手工**：**派生**（计数从 `WORK_COUNT` 派生；这正是纪律 #5 的同类动作——但**此处的“显示值”是文案里的 6**，
  真源在手写数据模块里，所以「改生成器」等价于「改成 import」）。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. `grep -c 'OTel' site/src/pages/404.astro` → 期望 **0**；`grep -rn 'OTel' site/src/pages/ | wc -l` → 期望 **0**。
    2. `grep -n 'WORK_COUNT' site/src/pages/404.astro` → 期望 **2** 命中（import + 使用）；
       `grep -n ' 6 个可运行' site/src/pages/404.astro` → 期望 **0**（手抄常量已消失）。
    3. `node site/tools/check-counters.mjs` → exit 0（若采纳派生，门禁里关于 404 的手抄副本可减一条；**减法属批次 A**，本条只保证不引入新的手抄）。
    4. `node site/tools/visual-check.mjs` 的 404 条目判据不变：`PAGES` 里 `404.html` 的 `cardsMin: 3`（`visual-check.mjs:74`）**仍须通过**——
       本条只改卡内文案，不动卡片数量与结构 ⇒ 该断言应当**照旧绿**；若变红即说明改法越界。
  - **必须留浏览器目检**（**④-18 明确要求，不得用 `cardsMin=3` 冒充**）：
    ① 三张卡在 375 / 768 / 1280 下的换行与等高；
    ② 卡内「h3 → chip → p」三段间距（`global.css:340-366` 的 `.card` 与 `.card h3` / `.card p` 规则）；
    ③ 第三张卡文案改短后，三卡的视觉重量是否失衡（这是硬要求里的「卡面外观」目检项）。
- **回滚点**：`git checkout -- site/src/pages/404.astro`（单文件 4 行改动）。
- **依赖**：D4（是否 import `WORK_COUNT`）；与 F1-2 共用术语定义的边界（OTel 的处理方式）。
- **工作量**：**S**。理由：1 行文案 + 1 行 import；目检是三张卡的一次性对照。
- **风险**：① 引入 `courses.ts` 可能牵出别的 import 链（`courses.ts` 若有副作用）⇒ 实施前 `grep -n "import" site/src/data/courses.ts` 确认它是纯数据模块；
  ② 改了 404 的文案但 `visual-check` 的 `cardsMin` 若被误改成 2 ⇒ 结构断言失效（验收第 4 条）；
  ③ 「八个导航项」的手抄计数被顺手改错 ⇒ 已划出边界（只登记不改）。

### F1-4｜`nav.astro` 三段长列表的版面分组（含 `llm-history.ts` 长短交错）

- **id**：F1-4｜**来源**：④-22（t6 转交 2）、④-13（t2 转交 3）、⑥ 6.2-1（把 `nav.astro` 列入入口层）
- **目标**：`/nav/` 从「三段平铺长列表」变成「可扫读、可按年代跳转、次要字段可折叠」的版面，
  同时修掉「长短卡片交错」（数据侧字段长度不均 → 呈现侧必须提供折叠/截断）。
- **现状证据（file:line）**：
  - `nav.astro:28-57` 第 1 段「LLM 发展历史」：`<ol class="llm-timeline">`（`:33`）内 10 个 `<li class="llm-tl-item">`，
    每条固定渲染 4 个段（`:42` head / `:43` sig / `:44` summary / `:45` 可选 note / `:46` connectsTo / `:47-52` 出处链接）。
    **没有年代分组、没有锚点**（`grep -n "id=" nav.astro` 无命中）。
  - `nav.astro:59-82` 第 2 段：5 张代际卡（`LLM_EVOLUTION` 5 项，本轮 `node -e` 数 `era:` 实测）。
  - `nav.astro:84-121` 第 3 段：`.nav-course-grid`（`:96`）内 5 个 `.nav-course-group`（按 `STAGES` 派生）。
  - ④-13 的对象是 `site/src/data/llm-history.ts` 的 `note`/`summary` 字段长度极不均匀 ⇒ **长短卡片交错**。
    该文件不在 ④ 的「已展开」范围里，本轮**未逐条统计字段长度**（见 §依据不足项）。
- **具体改法（文件・行区间・样式块）**：
  1. `site/src/pages/nav.astro:33-56`：把单个 `<ol class="llm-timeline">` 改为**按年代派生分组**：
     在 `---` 前置区（`:12` 之后、`---` 之前）加一个纯函数并按它分组：
     ```ts
     /** 形式组 1（④-22）：按起始年份分桶，供时间线分段；数据侧不改。 */
     const DECADES: [string, number, number][] = [['2017–2019', 2017, 2019], ['2020–2022', 2020, 2022], ['2023–2025', 2023, 2025]];
     const yearOf = (d: string) => Number((d.match(/\d{4}/) ?? ['0'])[0]);
     const timelineGroups = DECADES.map(([label, lo, hi]) => ({ label, items: LLM_HISTORY.filter((i) => yearOf(i.date) >= lo && yearOf(i.date) <= hi) }));
     ```
     渲染改为 `{timelineGroups.map(g => (<> <h3 class="tl-decade" id={`decade-${...}`}>{g.label} · {g.items.length} 节点</h3> <ol class="llm-timeline">{g.items.map(...)}</ol> </>))}`，
     即把现有的 `:34-55` 的 `LLM_HISTORY.map` **原样搬进内层**（不改单条内部结构）。
     ⚠️ `date` 字段的格式本轮**未逐条核对**（见 §依据不足项）；实施前必须
     `node -e "…打印 LLM_HISTORY.map(i=>i.date)"` 确认每条的年份都能被 `\d{4}` 命中，否则分桶会静默丢条。
  2. `nav.astro:20-25` 的 `page-lead` 之后插入**段内跳转条**（复用 `/learn/` 的 `.stage-overview` 结构）：
     三个 `<a class="so-item" href="#…">`，指向三个 `<section>`（给 `:28`/`:60`/`:85` 三个 section 加 `id="tl"`/`id="evo"`/`id="course"`）。
  3. `nav.astro:45`（`item.note`）改为折叠：`<details class="llm-tl-note"><summary>补充</summary><p>{item.note}</p></details>`
     ——这是修 ④-13「长短交错」的**呈现侧手段**（数据不动）。
  4. 去重（**这是本条的派生部分**）：`.stage-overview` / `.so-item` / `.so-stage` / `.so-label` / `.so-count`
     现定义在 `learn.astro:344-377`（页面级 `<style>`），`/nav/` 要用就得**提到 `global.css`**：
     把这 5 条规则从 `learn.astro:344-377` 移到 `global.css`（建议插入 `global.css:751` 的 `.phase-section` 区域之前，
     与「学习路线 /learn」注释块相邻，新注释写「/learn/ 与 /nav/ 共用」）。
     移动是**纯搬迁**（声明逐字不变），这是 F0-4 类集合门禁能直接验证的动作。
- **派生还是手工**：**派生**（年代分组从 `LLM_HISTORY` 的 `date` 派生，计数从 `g.items.length` 派生；
  跳转条从三个 section 常量派生）+ **手工**（`note` 的折叠决策、样式搬迁）。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. `node -e "…"` 分桶覆盖性：`LLM_HISTORY` 10 条全部落进 3 桶且总数为 10（**实施前先跑**，确认 date 可解析）。
    2. `grep -c 'class="tl-decade"' site/src/pages/nav.astro` → 期望 **1**（在 map 内，运行时渲染 3 次）；
       `grep -c 'tl-decade' site/src/styles/global.css site/src/pages/nav.astro` → 定义与输出两侧都有（第二轮类集合比对差集为 0）。
    3. `grep -c 'class="so-item"' site/src/pages/nav.astro` → 期望 **1**（map 内，渲染 3 次）；
       `grep -c 'stage-overview\|so-item' site/src/pages/learn.astro` → 期望**减少**（仅剩输出处的 `nav.stage-overview` 与 3 处 `so-item`，定义已移走）；
       `grep -c '^\.so-item' site/src/styles/global.css` → 期望 **1**。
    4. F0-1 的 `mustHave`（若采纳加固）与 `container: '.cards .card', cardsMin: 5` 仍通过；
       `node site/tools/visual-check.mjs` 的 `nav` 条目在 3 视口全绿（**需 CI 或已重建的 dist**）。
    5. 搬迁的纯性检查：`git diff -U0 site/src/pages/learn.astro site/src/styles/global.css | grep '^[+-]' | grep -v '^[+-][+-]' | grep -cE '^[+-]\s*(display|grid-template|gap|margin|padding|background|border|border-radius|box-shadow|font-size|color|font-weight|text-decoration|minmax)'` → 两侧命中数应**相等**（说明是搬运，不是改写）。
  - **必须留浏览器目检**：
    ① 三个年代段头与 10 条时间线的**节奏**（段头是否被误读成又一条时间线条目）；
    ② `details` 折叠态下 10 条的**等高性**与「补充」按钮的可见性（折叠后是否仍有跳变）；
    ③ 375px 下日期列（`.llm-tl-date`）与正文列的对齐是否被段头打断；
    ④ 跳转条在 375px 是否换行成 3 行（若换行，考虑改成 2×? 或横滚）。
- **回滚点**：`nav.astro` 单文件 + `learn.astro`/`global.css` 的搬迁（三处，均可 `git checkout`）。
- **依赖**：F0-0（目检前提）、F0-1（同页回归基线）。
- **工作量**：**L**。理由：① 分桶要在不改数据的前提下复刻现有 DOM 结构（`<ol>` 内层重排）；
  ② 样式搬迁触及 `/learn/`（回归面含 33 页里最复杂的一页）；③ 目检 4 项 × 3 视口。
  若砍掉第 1 条（只用跳转条 + `note` 折叠），降为 **M**——**这是本条的降级方案**，见 §未决决策点 **D5**。
- **风险**：① `date` 字段里有跨年份/非四位数字，`yearOf` 返回 `0` 导致条目**静默消失**（`.map` 不报错）⇒ 验收第 1 条必须在改之前跑；
  ② 搬迁 `.so-*` 会改变 `/learn/` 的**层叠顺序**（页面级 `<style>` 在 Astro 里会与全局样式合并，但插入位置变了 ⇒ 同选择器同优先级下**后者胜**）⇒ 搬迁后必须目检 `/learn/` 的概览条；
  ③ 把 `note` 折叠后，「待复核」类信息（`item.note` 可能含证据说明）被藏起来 ⇒ 折叠 summary 必须写清楚是「补充」而不是「更多」。

### F1-5｜「17 个 demo」措辞的渲染位置与版式（不是改数字）

- **id**：F1-5｜**来源**：④-8（t5 转交 1）：`index.astro:112` / `learn.astro:199/:204` 的「17 个 demo」措辞**内容侧已入 P10**，**渲染位置与版式留待本轮**
- **目标**：把这三个数字从**散文里**提出来，变成**版式上可识别、改数时可 grep、将来可派生**的元素。
  **本条不判定 17 是否正确**（错值归内容轮 P10）。
- **现状证据（file:line）**：
  - `index.astro:111-112`：`{MILESTONES.length} 个里程碑对应五个阶段，后段复用你亲手写的前段代码——不是读完 **17 个 demo** 就结束，而是<strong>你自己写的代码能跑起来</strong>。`
  - `learn.astro:199`：`<span class="phase-desc">my-agent：…；**17 个 demo** 不是终点作品，而是每个 milestone 的参考答案（参考样本）</span>`
  - `learn.astro:204`：`<strong>主线是你亲手搭的工具；**17 个 demo** 是每个 milestone 的参考答案。</strong>`
  - 对照真源：`site/src/data/courses.ts:298` `WORK_COUNT = 6`（`index.astro:145` 用它渲染「6 个可运行作品」）。
    ⇒ 同页 `:112` 写 17、`:145` 写 6（派生），**呈现层没有任何区分**，读者看到的是两个都没解释的数字。
- **具体改法（文件・行区间・样式块）**：
  1. `site/src/pages/index.astro:111-116`：把那段 `<p class="page-lead">` 拆成两句（承诺 + 计数说明），
     计数部分包成 `<span class="count-chip" data-count-kind="demo">17 个 demo</span>`，
     并在 `<style>`（`:289-413`）追加 `.count-chip { display:inline-block; padding:0 6px; border-radius:6px; background:var(--bg-soft); border:1px solid var(--border); }`。
  2. `site/src/pages/learn.astro:199`：把「17 个 demo」同样包成 `<span class="count-chip" data-count-kind="demo">17 个 demo</span>`（`.phase-desc` 内允许内联元素；
     但 `.phase-desc` 是 flex 的子项 ⇒ **必须目检换行行为**）。
  3. `site/src/pages/learn.astro:204`：原句已在 `<strong>` 内 ⇒ 改为 `… <span class="count-chip" data-count-kind="demo">17 个 demo</span> 是每个 milestone 的参考答案。`
     （`<strong>` 里不再套 chip 的块级背景色，避免「强调里又强调」）。
  4. `.count-chip` 放哪：`/learn/` 与 `/` 两页都要用 ⇒ 放 `global.css`（插入位置同 F1-2 的 `:520` 之后），
     两页的 `<style>` 都不再重复定义。
  5. **不改数字**：`17` 保持字面量（内容轮定值后再由 P10 的映射表派生），本条只保证「改数时能一眼找到、且不会漏改第 3 处」。
- **派生还是手工**：**手工**（版式）。**派生方向**：`data-count-kind="demo"` 让 `check-counters.mjs`
  能**枚举**所有「demo 计数」的显示位点（实现见批次 A 的 P10）——本条为它提供可枚举的钩子。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. `grep -c 'data-count-kind="demo"' site/src/pages/index.astro site/src/pages/learn.astro` → 期望 **1** 与 **2**。
    2. **显示位点清单**（供 P10 的映射表使用）：
       `grep -rn '17 个 demo\|data-count-kind="demo"' site/src | sed 's/:.*//' | sort | uniq -c` → 期望 3 处（`index.astro`×1、`learn.astro`×2）。
    3. 第二轮类集合比对：`.count-chip` 不得进差集。
    4. `node site/tools/check-counters.mjs` → exit 0（本条未动计数真源）。
  - **必须留浏览器目检**：
    ① `learn.astro:199` 的 `.phase-desc` 是 `.phase-head` 这个 flex 容器的子项（`global.css:757-771`），
       插入 `inline-block` 后**是否仍与 `<h2>` 基线对齐**（这是本条的**主要风险**，几何断言抓不到）；
    ② `index.astro:112` 拆成两句后，`route-head` 的上下留白是否与同页其他 `route-head`（`:65-71`、`:135-140`）一致；
    ③ `count-chip` 的底色在深色主题下是否与 `--bg-soft` 对比不足。
- **回滚点**：三处行级改动 + `global.css` 一条规则，均可单文件回滚。
- **依赖**：批次 A 的 **P10**（计数派生 + 映射表补登）——本条**只加钩子**，不替 P10 决定真值。
- **工作量**：**S**。理由：3 处包裹 + 1 条 CSS；成本在 flex 基线的目检。
- **风险**：① 实施者顺手把 17 改成 6/7/10（**越界到内容轮**，且 08 的 P10 尚未定值）⇒ 本条改法第 5 点已显式禁止；
  ② 三处只改两处 ⇒ 验收第 2 条用清单封死；
  ③ `.count-chip` 放进 `global.css` 后与既有 `.chip`（`global.css` 的 `.chip` 定义）视觉混淆 ⇒
     命名上刻意区别于 `.chip`（`.count-chip` 无边框圆角药丸形态，只有浅底色），目检项③即为它设。

---

## 组 2 · `/learn/` 层级与口径落点

> **行号修正（就地划改，按 07 纪律）**：④-1、④-4 与 01 §转交 1/2 都写「`learn.astro:147` 附近」，
> 但 `:147` 是**课程卡的参考样本 chip 行**；**阶段段头**在 `learn.astro:113-117`（`<div class="phase-head">` 内 `h2` + `.phase-desc`）。
> 本轮一律用修正值：阶段段头 = `:113-117`，`mvpSlug` chip = `:146-152`（`:147` 是其中一行）。
> ④-4 说「`:147` 课程卡直接展示内部 `mvpSlug`」——**这条行号是对的**（`{course.mvpSlug}` 就在 `:147`）。

### F2-1｜课程卡的 `mvpSlug` 与真实目录名不符（文案/目录名的对齐决策）

- **id**：F2-1｜**来源**：④-4（t1 转交 1）、01 §转交 1
- **目标**：读者照着卡片上的名字去 clone，**能真的找到目录**；或者卡片明确表达「这是样本标识，不是目录名」。
- **现状证据（file:line + 实测对照）**：
  - `learn.astro:146-152` 的 `.dc-foot`：`:147` `<span class="chip">参考样本 <code>{course.mvpSlug}</code></span>`。
  - 同页 `:289-296` 的 JS 注释亦以 `mvpSlug` 为口径；`:277-279` 的「口径说明」段还专门解释了 `mvpSlug`
    （「每门课声明一个 `mvpSlug`，指向可 clone 运行的样本」）——**它自称可 clone，但字面值不是目录名**。
  - 实测对照（`ls -d */` × `MVPS[].slug`）：
    | `mvpSlug`（`mvps.ts:42/83/91/107` 等） | 实际目录（`ls -d */`） | 是否同名 |
    |---|---|---|
    | `harness-mvp`（4 门课复用：`:107/:124/:156/:225`） | `harness-demo/` | **否** |
    | `obs-mvp`（`:278`） | `harness-demo/`（`mvps.ts:88` 明写「harness-demo 的 demo:otel」） | **否，且与 `harness-mvp` 同目录** |
    | `memory-mvp`（`:297`） | `memory-redteam/` | **否** |
    | `llm-history`（`:91`） | 无目录（`mvps.ts:140`：`site/src/data/llm-history.ts` + `/nav` 页） | **否，非目录** |
    | `industry-research`（`:367`） | 无目录（`mvps.ts:149`：`notes/industry-2026.md` + `notes/details/`） | **否，非目录** |
    | `rag-mvp`/`sandbox-mvp`/`mcp-mvp`/`durable-execution-mvp`/`framework-mvp`/`api-mvp`/`flywheel-mvp`/`model-basics-mvp` | 去掉 `-mvp` 加 `-demo` 即目录名（`rag-demo/`、`sandbox-demo/`…） | **否，但可机械推导** |
  - ⇒ **13 个 `mvpSlug` 里没有一个是目录名**；4 门课（`harness-from-scratch`/`agent-harness`/`system-design`/`multi-agent`）显示同一个 `harness-mvp`，
    而 `mvps.ts:26-30` 的 `owner` 只有 `harness-from-scratch` 一处 —— 卡片上无法看出「复用」这层语义。
  - **真源已存在**：`mvps.ts:35` 的 `artifact` 字段**逐条写了真实路径**（`:47` `harness-demo/（…）+ whiteboard/agent_whiteboard.py`、
    `:96` `memory-redteam/（…）`、`:140` `site/src/data/llm-history.ts（重建）+ /nav 横向导航页`）。
    ⇒ 这也是**纪律 #5「修生成器不修输出」的现成素材**：显示位点该改为引用 `artifact` 的目录部分，而不是再手写一份映射表。
- **具体改法（文件・行区间・样式块）**：
  1. `site/src/pages/learn.astro:147` 改为**双段式**：slug 保留（它是课程↔样本映射的稳定标识、也是 `mvps.ts` 的键），
     后面补真实落点：
     ```astro
     <span class="chip">
       参考样本 <code>{course.mvpSlug}</code>
       <span class="mvp-path">{mvpPath(mvp)}</span>
     </span>
     ```
     其中 `mvpPath(mvp)` 是**从 `mvp.artifact` 派生**的页内纯函数（放在 `learn.astro` 的 `---` 前置区 `:36-41` 之后）：
     ```ts
     /** 形式组 2（④-4）：mvpSlug 是映射键，不是目录名——真实落点从 mvps.ts 的 artifact 字段派生。
      *  只取 artifact 里第一段反引号/斜杠路径，避免把整段说明塞进 chip。 */
     function mvpPath(mvp: { artifact: string }): string {
       const m = mvp.artifact.match(/^([\w.\-]+\/)/);
       return m ? m[1] : '（非目录资产）';
     }
     ```
  2. `learn.astro:277-279` 的「参考样本」口径句补一句：把「指向可 clone 运行的样本」改成
     「指向可 clone 运行的样本（`mvpSlug` 是映射键；真实目录见卡片上的落点，三态如实标注…）」——
     **口径句与显示形态必须同一批改**，否则读者仍在卡片上看到无法 clone 的字符串。
  3. 样式：新增 `.mvp-path` 放 `learn.astro` 的 `<style>`（`:339-496`），插在 `:408-412` 的 `.dc-foot` 规则之后：
     ```css
     .mvp-path { color: var(--text-faint); font-size: 0.78rem; }
     ```
     （不新增 `global.css` 规则：只有本页用；若 F1-5 已把 `global.css` 打开，也可放那里统一，**二选一，不要两处都写**。）
  4. **`c/[slug].astro:102-106` 是同一信息在课程页的副本**（`<code>{structure.mvpSlug}</code>` + `mvp.statusLabel`）：
     本条的显示形态要与它**同形态**（否则同一信息在两级页面不同样子）⇒ 若采纳本条，
     则 `c/[slug].astro:104` 后也追加一个 `<span class="mvp-path">`，并在 `c/[slug].astro` 的 `<style>`（`:232-300`）
     `:299-300` 之前加同一条规则（**两处规则内容逐字相同**，便于将来抽公共类）。
- **派生还是手工**：**派生**（路径从 `mvps.ts` 的 `artifact` 派生；`mvpSlug` 本身不动，避免动 13 处数据）。
  **禁止**新增「slug → 目录名」的手写映射表：那是第二份真源，且 4 门课共用一个 slug 时必然写错。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. `grep -c 'mvp-path' site/src/pages/learn.astro site/src/pages/c/\[slug\].astro` → 期望 **各 ≥2**（定义 + 输出）。
    2. **映射闭合核对**（把「名字对不上」变成可清点的事实）：
       ```bash
       cd /home/ubuntu/app/learn-agent-harness && node -e "
       const fs=require('fs');const t=fs.readFileSync('site/src/data/mvps.ts','utf8');
       const arts=[...t.matchAll(/slug: '([^']+)',[\s\S]*?artifact: '([^']+)'/g)].map(m=>[m[1],m[2]]);
       const dirs=new Set(fs.readdirSync('.').filter(f=>fs.statSync(f).isDirectory()));
       for(const [s,a] of arts){const m=a.match(/^([\w.\-]+)\//);console.log((m&&dirs.has(m[1].slice(0,-1)))?'OK ':'NO ',s,'->',m?m[1]:'(非目录)');}
       " | sort | uniq -c
       ```
       期望：`artifact` 首段路径若指向仓库目录，则该目录**真实存在**（`OK` 计数 = 8：harness/rag/sandbox/mcp/durable/framework/api/flywheel/model-basics 的 demo 目录 + memory-redteam；
       非目录资产 3 个走 `NO` 分支但**不报错**）；**任一 `OK` 之外的「本应是目录却不存在」= 失败**。
    3. 第二轮类集合比对：`.mvp-path` 不得进差集。
    4. `node site/tools/check-counters.mjs` → exit 0（`mvps.ts` 的 `size = 13` 口径未被本改动触碰）。
  - **必须留浏览器目检**：
    ① `.dc-foot` 是 `flex-wrap`（`learn.astro:409-414`），加一段文字后**卡片高度是否显著增加**、16 张卡是否仍等高；
    ② `.chip` 内的 `code` 与 `.mvp-path` 混排是否被读成两个不同的 chip（若被误读，考虑把落点移出 chip、另起一行）；
    ③ `/c/harness-from-scratch/` 的 `.lp-mvp`（`c/[slug].astro:283-289`）加了落点后是否与「参考样本」chip 挤成两行。
- **回滚点**：`learn.astro`（`:147` + 前置区函数 + style 一条）、`c/[slug].astro`（`:104` + style 一条）——两文件独立回滚。
- **依赖**：无。**与 F2-3 同页**（同一次改 `/learn/` 时一并目检，减少一次目检成本）。
- **工作量**：**M**。理由：函数 5 行 + 两处模板 + 两条 CSS，机械；成本在**口径句同步**（`:277-279`）
  与**卡片高度目检**——`harness-mvp` 被 4 门课复用，卡片高度变化会同时影响 4 张卡。
- **风险**：① `artifact` 字段是**散文**（如 `:47` 含 `+ whiteboard/agent_whiteboard.py`），正则取首段路径在措辞变化时会静默变 `（非目录资产）`⇒
  验收第 2 条必须对 13 条逐个打印，**逐个肉眼过一遍**，不能只看计数；
  ② 把 `mvpSlug` 本身改成目录名 ⇒ 会同时打断 `mvps.ts` 的键、`course-structure.ts` 的 13 处引用、
     `learn.astro` 的口径说明与 `c/[slug].astro:104` ⇒ **本条明确禁止**（改显示，不改键）；
  ③ `harness-mvp` 复用语义在卡片上仍不可见 ⇒ 这是**已知未解项**，登记在 §依据不足项。

### F2-2｜阶段段头加「难度区间」指示

- **id**：F2-2｜**来源**：④-1（t1 转交 2，ped-F14 的落地形式）
- **目标**：在 `/learn/` 的**五个阶段段头**上标注该段难度区间，把「P0 后两门难度明显上升」的预期管理前移。
- **现状证据（file:line）**：
  - `learn.astro:113-117`：`<section class="phase-section" id={`stage-${stage}`} data-lf-section data-stage={stage}>`
    内 `<div class="phase-head">` 只有 `<h2>{stage} · {STAGE_LABELS[stage]}</h2>`（`:115`）与
    `<span class="phase-desc">{STAGE_DESC[stage]} · {STAGE_COUNTS[stage]} 门课</span>`（`:116`）。
  - `STAGE_DESC` 真源在 `site/src/data/course-structure.ts:36-42`（P0–P4 五句话），**没有任何难度字段**。
  - `01-pedagogy.md:546-548` 的难度均值为 **P0=2.8 / P1=4.5 / P2=4.0 / P3=4.7 / P4=3.0**，
    并**自述「难度分为我的加权判断，量本身可复现，权重不可复现」，置信度中**（`:548`）。
  - ⇒ **本条必须处理「把不可复现的主观分数印到用户可见页面」这件事**（见 §未决决策点 **D6** 与 §依据不足项）。
- **具体改法（文件・行区间）**：
  1. **不改 `STAGE_DESC`**（它是五个阶段的目标句子，不是难度轴）。
     新增一份**显式的**难度表，并把它钉在真源文件里、带出处注释：
     `site/src/data/course-structure.ts` 末尾（`:386` 注释块之后）追加：
     ```ts
     /**
      * 阶段难度区间（形式组 2 / ④-1，ped-F14 的落地形式）。
      * ⚠️ 出处：analysis/content/01-pedagogy.md §2 的逐课 1–5 评分（P0 2.8 / P1 4.5 / P2 4.0 / P3 4.7 / P4 3.0）。
      * 该评分是加权判断（四项机械指标 + 自设权重）：**量可复现、权重不可复现**（01 自述，置信度中）。
      * 故此处只印「区间」与「段内是否有跃变提示」，不印均值小数——避免把不可复现的数当成对外口径。
      */
     export const STAGE_DIFFICULTY: Record<Stage, { range: string; note?: string }> = {
       P0: { range: '难度 1–4', note: '后两门（Harness 架构 / 系统设计）难度明显上升' },
       P1: { range: '难度 4–5' },
       P2: { range: '难度 3–4' },
       P3: { range: '难度 4–5' },
       P4: { range: '难度 2–4' },
     };
     ```
     ⚠️ 上表 `range` 的**每个数字本轮未从 01 的逐课表逐条复核**（见 §依据不足项）——
     实施前必须把 01 §2 的逐课表拉出来**逐课核一遍**，把 range 改成实测区间，**不许直接抄本条给出的示例值**。
  2. `site/src/pages/learn.astro:5-11` 的 import 块补 `STAGE_DIFFICULTY`；
     `:116` 的 `phase-desc` 后追加一个 chip：
     ```astro
     <span class="phase-diff" title={STAGE_DIFFICULTY[stage].note ?? ''}>{STAGE_DIFFICULTY[stage].range}</span>
     ```
     `title` 承载「跃变提示」，避免把长句塞进段头（`title` 在无 JS 的静态页上也可用）。
  3. 样式：`.phase-diff` 放 `global.css` 的 `.phase-head .phase-desc` 规则（`:769-773`）之后：
     ```css
     .phase-head .phase-diff {
       padding: 1px 8px; border: 1px dashed var(--border-strong); border-radius: 999px;
       font-size: 0.78rem; color: var(--text-faint);
     }
     ```
     （用**虚线灰边**刻意区别于 `.chip` 的实线 chip：它是「估计值」不是「事实徽章」——**视觉诚实**。）
  4. `index.astro:80-83` 的 `.route-stage` / `.route-label` / `.route-count` **不加**难度
     （首页第 ⑥ 段的定位是「一屏看清学什么」；难度信息在 `/learn/` 展开即可，避免首页密度回升）。
- **派生还是手工**：**手工**（难度是判断，不是派生量）。但**必须**让它有一个可核对的落点：
  数据表里写死出处 `01-pedagogy.md §2`，使「这个数从哪来」可回查（纪律 #3：自设边界要能逐字引出出处）。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. `grep -c 'STAGE_DIFFICULTY' site/src/data/course-structure.ts site/src/pages/learn.astro` → 期望 **各 ≥2**（定义 + 使用；learn 侧 import + 模板）。
    2. `node -e "…"` 覆盖性：`STAGES` 的 5 个键在 `STAGE_DIFFICULTY` 里**全部存在**且无多余键（fail-fast 式断言，写进 `check-counters.mjs` 的候选判据）。
    3. `grep -c 'class="phase-diff"' site/src/pages/learn.astro` → 期望 **1**（在 `STAGES.map` 内，运行期渲染 5 次）。
    4. `grep -n 'phase-diff' site/src/styles/global.css` → 期望 **1** 处定义。
    5. 第二轮类集合比对：`.phase-diff` 不得进差集。
    6. `node site/tools/check-counters.mjs` → exit 0（若把第 2 条写成新判据，则判据数从 12 → 13，属批次 A 的计数变更，须同步口径块）。
  - **必须留浏览器目检**：
    ① 段头 `.phase-head` 是 `flex-wrap`（`global.css:757-767`），`h2` + 长 `phase-desc` + 新 chip **是否被挤到第三行**；
    ② 该 chip 与 `.phase-desc` 里的「· {STAGE_COUNTS[stage]} 门课」在视觉上是否被读成同一组数字（两个不同的量挨在一起）；
    ③ 375px 下五个段头的一致性（若 P0 的 `note` 走 `title` 而无可见文本，四段有 chip、一段观感不同）；
    ④ **最重要**：虚线 chip 是否被误解为「可点击的筛选按钮」（同页 `:93-107` 真有 `.lf-chip` 筛选按钮）——若被误读，
       须改成纯文本前缀「难度：4–5」。
- **回滚点**：`course-structure.ts` 末尾追加的常量 + `learn.astro` 两处 + `global.css` 一条 = 三处，均可 `git checkout`。
- **依赖**：D6（是否印难度、印区间还是印跃变提示）；与 **F2-3** 同页（同一次目检）。
- **工作量**：**S**（实现）+ **M 的核对成本**（逐课核 01 §2 的区间）。
  理由：代码只有 3 处；真正的成本是**不许把未经复核的区间印上站**。
- **风险**：① **把不可复现的主观分数当成站点事实**——这是本条最大的风险，已用「不印均值小数、只印区间 + 虚线灰边 + 数据表带出处注释」三重约束压低；
  ② `01` §2 的逐课表若与 `STAGE_DESC` 的主题分组语义冲突（P1 是「工具与安全」而非纯难度轴，`01-pedagogy.md:546` 明写这一点）
     ⇒ 实施时必须在数据表注释里保留该限制语；
  ③ 新增常量未接入任何门禁 ⇒ 阶段名改了而难度表漏改（已用验收第 2 条封死）。

### F2-3｜`learn.astro:264-286` 的「口径说明」区块归属与缩进错位

- **id**：F2-3｜**来源**：④-21（t6 转交 1，readability-F15 证据行）、④-8 的同页关联
- **目标**：修掉「口径说明 section 在结构上落在 capstone section 内部」这一**结构性错位**，
  并让它要么成为 capstone 的一部分（层级正确、缩进正确），要么独立成尾注（视觉上是页尾）。
- **现状证据（file:line —— 本轮实测，比 ④ 的描述更精确）**：
  - `grep -c '<section' learn.astro` → **4**；`grep -c '</section>' learn.astro` → **3**。
    逐条：`<section` 在 `:113`（阶段段，`STAGES.map` 内）、`:174`（建议开课顺序）、`:196`（capstone，`id="capstone"`）、`:265`（口径说明）；
    `</section>` 在 `:169`（闭合阶段段）、`:191`（闭合顺序段）、`:286`（闭合口径说明）。
  - ⇒ **`:196` 的 capstone `<section>` 从未闭合**，被 `:265` 的「口径说明」`<section>` 包住，
    再由 `:286` 的**一个** `</section>` 闭合 —— 即 HTML 结构上是 `section > section`（嵌套），
    **不是**「缩进错位」这么轻：`:264` 的注释行**写在了 `:263` 的 `</div>`（闭合 `.cards`）与 `:265` 的 `<section>` 之间，
    但没有缩进修正所暗示的「闭合标签缺失」提示**。
  - 关键：这是否**真的是缺陷**取决于意图。两种读法：
    (a) 口径说明**故意**作为 capstone 的子区块（那 `:264-265` 的缩进应比 `:196` 深一级，且应有子标题层级 `h3` 而非 `h2`）；
    (b) 口径说明**本该**是独立尾注（那 `:196` 的 `</section>` 应补在 `:263` 之后，`:265` 的 section 保持同级）。
    **现状是两种都不是**：缩进与 `:196` 同级（读作 (b)），AST 上是 (a)。⇒ 这就是「读者/工具都无法判断归属」的形态。
  - 视觉后果（04-21/06-1 都要求目检）：`global.css:751-757` 的 `.phase-section { margin-top: 34px; }` 会**照样生效**，
    所以**子 section 与父 section 的间距叠加**，且 `:196` 的 `id="capstone"` 锚点（`index.astro:129` 链向 `learn/#capstone`）
    现在的锚点范围**多包含了口径说明**（跳到 capstone 后往下滚会一路包含口径段）。
- **具体改法（推荐 (a)：明确定位为 capstone 的尾注子区块，并把层级写对）**：
  1. `site/src/pages/learn.astro:263-265`：在 `:263` 的 `</div>`（`.cards` 收尾）之后、`:264` 注释之前**补一级缩进语义**：
     把 `:265` 的 `<section class="phase-section">` 改为 `<section class="phase-section phase-sub">`，
     并把内层 `h2`（`:267`）改为 `h3`、`phase-head`（`:266`）保留（`.phase-head h2` 规则要相应补 `h3` 选择器，见第 3 点）。
  2. `:286` 的 `</section>` **保留**（它闭合的是 `:265` 的行内 section）；
     并在 `:287` 的 `</Base>` 之前**补一句** `</section>` 来闭合 `:196` 的 capstone ——
     **注意 Astro/JSX 允许自闭合与隐式闭合的差异**：当前能构建（残骸证明走到过 transform 阶段），
     说明 `:196` 的未闭合被 `:286` 的 `</section>` 顶上（HTML 解析器容错）。
     ⇒ **推荐做法不是补标签**，而是把 `:265-286` 的整块**移出** `:196` 的 section：
     即把这段搬到 `:287`（`</Base>` 之前）作为**独立尾注 section**（这才是 HTML 层面干净、且与缩进一致）。
     **两块的选择必须由 D7 拍板**（见 §未决决策点）——本文件给两个可执行版本，不替用户决定。
  3. **版本 A（子区块版）**：新增 `phase-sub` 样式到 `global.css:751` 区域：
     ```css
     .phase-section.phase-sub { margin-top: 26px; border-left: 3px solid var(--border); padding-left: 16px; }
     .phase-section.phase-sub > .phase-head h3 { margin: 0; font-size: 1.05rem; }
     ```
     并给 `.phase-head .phase-desc`（`global.css:769`）补一条不依赖标签名的写法（现在规则挂在 `.phase-head .phase-desc`，**已经是类选择器，无需改**）；
     `h2` → `h3` 只影响 `:267` 一处，但 `.phase-head h2`（`global.css:768`）需要同时列出 `h3`。
  4. **版本 B（独立尾注版）**：`:265-286` 整段移到 `:196` 的 `</section>` **之后**（即先补 `:263` 后 `</section>`），
     新增 `id="caliber"` 便于将来从导航/首页直接跳；样式用 `global.css` 已有的 `.phase-section` + 一条
     `.caliber-note { font-size: 0.9rem; }` 降级小字（表达「这不是课程内容，是口径」）。
  5. 两版都**必须**同步 `:264` 的注释（现在写「原先挤在页首的两段术语，降为页尾脚注」——
     「页尾脚注」这个自述与「嵌套在 capstone 里」的现状**不一致**，注释本身是错位的证据）。
- **派生还是手工**：**手工**（结构搬家）。**可派生的核对**：section 开合配平可以机器验证（验收第 1 条）——
  这正是本次能发现问题的手段。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. **开合配平**：`grep -c '<section' site/src/pages/learn.astro` 与 `grep -c '</section>' …` **必须相等**（当前 4 : 3 ⇒ 改完期望 `4 : 4` 或 `5 : 5`，取决于版本）。
       逐条列出时必须能一一配对：`grep -n '</\?section' site/src/pages/learn.astro`。
    2. **锚点范围收窄**（版本 B 的核心收益）：`:196` 的 `id="capstone"` 与 `:265` 的 section 之间**不再嵌套**：
       用 `node -e` 或人工核对 `awk '/id="capstone"/,/<\/section>/' ` 的输出**不含**「口径说明」字样 → 期望**不含**。
       —— 这一条把「跳到 capstone 会滚过口径段」变成可验证事实。
    3. `grep -c 'phase-sub\|caliber-note' site/src/pages/learn.astro site/src/styles/global.css` → 按所选版本，两侧都有（第二轮类集合比对差集为 0）。
    4. `grep -n '页尾脚注' site/src/pages/learn.astro` → 期望命中处措辞与最终结构一致（不允许注释自述与结构相反）。
    5. **静态 HTML 结构验证（CI 侧最强判据）**：`verify.yml` 的 `Build sanity` 只断言文件存在与非空，
       ⇒ 建议**新加**一条只读检查：`node -e "…读 dist/learn/index.html，用 HTML 解析器断言 section 嵌套深度"`，
       或最简版 `grep -c '<section' site/dist/learn/index.html` 与上方源码计数一致（源码 4 → 产物 4）。
  - **必须留浏览器目检**（04-21 明写「渲染后的视觉归属需目检」）：
    ① 「口径说明」在 1280px 下**看起来属于 capstone 还是属于页尾**（这是本条真正的验收对象）；
    ② 版本 A 的左侧竖线 + 缩进在 375px 是否吃掉太多宽度；
    ③ 从首页点「看主线蓝图与过关判据 →」（`index.astro:129` → `/learn/#capstone`）落地后，
       滚动范围内是否仍包含口径段；
    ④ 四个/五个 `.phase-section` 的间距是否因嵌套层级修正而出现**双倍留白**（`margin-top: 34px` 叠加）。
- **回滚点**：`learn.astro` 单文件 + `global.css` 一处；**两版之间切换**也只需换这一段（回滚成本低）。
- **依赖**：D7（版本 A/B 的选择）；与 F2-1/F2-2 同页同批目检。
- **工作量**：**M**。理由：搬家本身小，难在①确认 `:196` 未闭合是否被构建容错吞掉（必须用产物核对）、
  ②四项目检里有两项（①②）需要对照两种版本。
- **风险**：① 若只改缩进不改结构 ⇒ **零收益**（AST 不变、锚点范围不变）——本条明确禁止「只调空格」；
  ② 补 `</section>` 时**多补一个**会让后续 section 全部错位（验收第 1 条用配平封死）；
  ③ 把 `h2` 改 `h3` 会让 `.phase-head h2` 规则失效、标题掉到 16px ⇒ 已要求同时补 `h3` 选择器（第 3 点）。

### F2-4｜`learn.astro:188` 的「完整依赖图见知识地图」指向

- **id**：F2-4｜**来源**：④-1 关联项；`01-source-layer.md` A2「现状证据（4）」直接点名 `learn.astro:186-188`
- **目标**：让这句引用在**图的真源改造（A2）之后仍然成立**——即它指向的图与 `prereqs` 一致。
- **现状证据（file:line）**：
  - `learn.astro:185-189` 的 `.order-reason`：`:188` `完整依赖图见 <a href={base + "map/"}>知识地图 →</a>`。
  - `01-source-layer.md:246` 已把这句话列为 A2 的现状证据（其原文与我本轮读到的 `:186-188` 一致）。
  - `/map` 侧：`map.astro:48` `<rendered.Content />`（`notes/knowledge-map.md` 原文渲染），
    图在 `notes/knowledge-map.md:78-126`（本轮亲读：`graph TD` + 4 个 `classDef` + 18 个节点行 + 23 条边，含 10 条指向 `INTERVIEW`）。
- **交叉引用（**显式合并，只改一遗**）**：本条**不另起设计**，直接采用 `01-source-layer.md` 的 **A2**：
  - 真源 = `site/src/data/course-structure.ts` 的 `prereqs`；
  - 生成器 = `site/tools/gen-dep-graph.mjs`（**默认 `--check`，不写盘**，见 01 `:271-272`）；
  - 受保护区间 = `notes/knowledge-map.md` 的 `<!-- BEGIN:dep-graph … -->` … `<!-- END:dep-graph -->`（01 `:269-270` 定为当前 `:78-126`）；
  - 门禁 = `check-counters.mjs` 的**判据 17**（01 `:976`）；
  - **陷阱（captain 已复核，与 01 一致）**：`notes/knowledge-map.md` 里指向 `INTERVIEW` 的边 **12 条（8 实线 + 4 虚线）**，
    `INTERVIEW` 不是 17 门课之一 ⇒ 若不显式区分，派生会把它们判成非法边。
    ⚠️ **数字口径差异必须点明**：01 `:239` 写「4 条指向 `INTERVIEW` 的虚线边」、`:327` 写「11 条中指向 INTERVIEW 的部分」；
    我本轮亲读 `notes/knowledge-map.md:110-125` 数得 **10 条**指向 `INTERVIEW` 的边（`MULTIAGENT --> INTERVIEW` 1 条 + `SYSDESIGN/SANDBOX/EVAL/DURABLE/MCP/API/FLYWHEEL --> INTERVIEW` 7 条 + 4 条虚线 = **12**；
    其中实线 8、虚线 4）。⇒ **三个数字（4 / 11 / 12）不一致，实施前必须定版**（见 §依据不足项，**不许拿任何一个当事实**）。
  - **具体改法（本条只做 `/learn/` 侧的那半句）**：`learn.astro:188` **保持不动**（01 `:334` 已判定「保留手写」，
    理由：它只有一句话、不含数字与边）。**但**要加一个**便宜的**一致性约束：这句话里的「完整依赖图」若将来
    变成指向某一版图的说法（例如 A2 采纳后图变成「由 `prereqs` 派生」），则在 A2 落地时**同批**在
    `notes/knowledge-map.md` 的图区间上方补一句「本图由 `site/src/data/course-structure.ts` 的 `prereqs` 派生」，
    使 `/learn/` 的这句话与图区的自述**互相印证**。
  - 若 D7/A2 决定把口径说明等块移位（F2-3），**不得**顺带改 `:188`（避免把不相关的两处混在一次提交里）。
- **派生还是手工**：**手工一句**（引用句），**派生**在图侧（A2）。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. `grep -n 'map/' site/src/pages/learn.astro` → 期望仍命中 `:188` 一处（未被误删/改指向）；**本项无改动**时此条作为「未越界」检查。
    2. A2 落地后：`node site/tools/gen-dep-graph.mjs; echo "EXIT=$?"` → 期望 `✅ 依赖图与 prereqs 一致` / `EXIT=0`（引用 01 `:340` 的判据，**不在本条重复设计**）。
    3. `node site/tools/check-counters.mjs` → exit 0（含 A2 的判据 17）。
  - **必须留浏览器目检**：`/learn/` 的 `.order-reason`（`learn.astro:427` 样式）在 375px 下这句的折行；
    以及点 `/map/` 后图是否渲染成 `<svg>`（此项**属 A2 的目检**，本条只确认链接可点）。
- **回滚点**：本条**无代码改动**（若把一致性自述句算进来，则回滚 = 还原 `knowledge-map.md` 图区上方那一句，属 A2 的文件）。
- **依赖**：**A2（`analysis/plan/01-source-layer.md`）**——本条与它**只改一遗**：图改派生在 A2 做，`/learn/` 只保留引用句。
- **工作量**：**S**（一句话 + 一次核对）；**大部分工作量归 A2**。
- **风险**：① 两边各改一半（A2 改了图、`/learn/` 的句子却说「手绘」）⇒ 本条要求 A2 落地时同批核对这句；
  ② 把 `/learn/` 的句子改成「图由代码生成」而 A2 尚未落地 ⇒ 变成新的不实陈述（**禁止**）。

### F2-5｜口径块 7.7 KB 是否上站（`/map` 认知负荷）

- **id**：F2-5｜**来源**：④-10（t5 转交 4）；06 §转交 2 的 `nav.astro` 长列表侧同源
- **目标**：给出「口径块要不要有站点展示位」的**可执行判定**，避免 `/map`（`map.astro:48` 全文渲染）把 7.7 KB 口径块
  无声地塞进读者路径。
- **现状证据（file:line + 实测）**：
  - `notes/knowledge-map.md` 总 **25522 字节**；「计数口径」小节（`:11` 起，到下一个 `## ` 前）**实测 10614 字节**——
    ④-10 说「7.7 KB」，我实测 **10614 B**（≈10.4 KB）。⇒ **数字不一致，以实测为准**（本条用 10614；
    4 的 7.7 KB 可能是别的口径/时点，见 §依据不足项）。
  - `/map` 的渲染：`map.astro:48` `<rendered.Content />` = **整个 `knowledge-map.md` 原样**（`map.astro:4-8` 注释明写「单一真源」）。
    口径块在该文件**靠前**（第 11 行起），即**在依赖图之前**。
  - ⇒ 读者打开 `/map` 的第一屏是**口径块开头**（第 8 行的四次整理说明 + 第 11 行的口径块），
    **图的可见位置被推到口径块之后**。
  - 对照：`/learn/` 已把口径降为页尾脚注（`learn.astro:271-285`，注释 `:264` 自述「降为页尾脚注」，**但该注释本身与结构矛盾**，见 F2-3）
    ⇒ 两页对同一类信息给出**相反的层级处理**。
- **具体改法（推荐：口径块在 `/map` 折叠 + 显式跳转）**：
  1. **不动笔记**（笔记是 GitHub 读者的一手源，且 `check-counters.mjs` 从块内重算数字）。
     只在 `site/src/pages/map.astro` 的渲染层处理：
     - `map.astro:22` 前置区之后，加一个**从 `entry.body` 派生**的判断（**只读笔记，不复制文本**）：
       ```ts
       /** 形式组 2（④-10）：口径块是「核对用」信息，进 /map 默认收起；正文仍由笔记渲染，不做第二份副本。 */
       const CALIBER_HEADING = '计数口径';
       const hasCaliber = (entry?.body ?? '').includes(CALIBER_HEADING);
       ```
     - 在 `map.astro:46-48` 之间插入一条**指向该小节锚点**的提示（不是复制内容）：
       ```astro
       {hasCaliber && (
         <p slot="before" class="caliber-jump">
           本页含<b>计数口径块</b>（约 {(entry!.body.match(/计数口径[\s\S]*?(?=\n## )/) ?? [''])[0].length} 字符）——
           仅供核对，可先跳过直读依赖图：<a href="#依赖图">跳到依赖图 ↓</a>
         </p>
       )}
       ```
       ⚠️ 锚点 `#依赖图` 的正确 id 由 `extractToc`（`map.astro:21`）派生 ⇒ **实施时必须先打印 `toc` 里的真实 id**
       （`node -e` 或临时 `console.log`），**不许照抄本条示例里的中文锚点**（中文 heading 的 slug 规则见 `site/src/utils/toc.ts`）。
  2. **更好的落法（需 D8 拍板）**：把口径块的**折叠**做成真的 `<details>`。但 Astro 的 markdown 渲染不产 `details`，
     需要在 `map.astro` 里对渲染后的 HTML 做**一次**包装（或用 `remark` 插件在构建期把 `计数口径` 小节包进 `<details>`）。
     ⇒ 这一版**风险更高**（动渲染产物），故列为备选。
  3. `map.astro` 的 `<style>`（`:63-66`）追加：`.caliber-jump { margin: 0 0 12px; font-size: 0.9rem; color: var(--text-soft); }`。
  4. **交叉引用 F1-4**：`/nav/` 的长列表与 `/map/` 的口径块是**同一类**「读者扫读成本」问题，
     两条都要用「默认收起 + 显式跳转」的同一手法（D5/D8 一起拍板，避免两页两种风格）。
- **派生还是手工**：**派生**（字符数从 `entry.body` 现算；锚点从 `extractToc` 派生；是否含口径块从笔记文本派生）
  + **手工**（「该不该收起」这一判断）。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. **口径块实测大小**（把 ④ 的 7.7 KB 换成可重跑的实测值）：
       `awk '/计数口径/,/^## [^计]/{print}' notes/knowledge-map.md | wc -c` → 记下实测（本轮 **10614**，含首尾行；`awk` 区间写法不同会差几行，实施时固定一条命令并写进验收）。
    2. `grep -c 'caliber-jump' site/src/pages/map.astro` → 期望 **≥2**（输出 + CSS 定义）。
    3. **锚点真实性**：`grep -n 'id="依赖图"\|#依赖图' site/src/pages/map.astro` 的锚点必须能在
       `extractToc` 的输出里找到同名 id ⇒ 实施时先跑一次 `node -e` 打印 `toc`；
       静态判据可写成：`grep -c '依赖图' site/src/pages/map.astro` ≥1 **且** 该 id 出现在 `notes/knowledge-map.md` 的标题里（`grep -n '^## .*依赖图' notes/knowledge-map.md` 命中）。
    4. **不产生第二份文本**：`grep -c '计数口径（2026-10-12 冻结' site/src/pages/map.astro` → 期望 **0**
       （即页面上没有口径块的复制文本，只有跳转提示）。
    5. `node site/tools/check-counters.mjs` → exit 0。
    6. 第二轮类集合比对：`.caliber-jump` 不得进差集。
  - **必须留浏览器目检**：
    ① `/map/` 首屏现在被口径块占据到什么程度、加了跳转条后**依赖图是否进入首屏或第二屏**；
    ② `/map/` 的 TOC 侧栏（`NotePageLayout.astro:131-148`）里口径块条目有多少、是否本身就已构成认知负荷；
    ③ 折叠版（若选）展开/收起的**高度跳变**与打印样式（`@media print` 未覆盖，折叠内容打印会丢——**必须目检打印预览**）。
- **回滚点**：`map.astro` 单文件（`:22` 前置区 + `:46-48` 插入 + `<style>` 一条）。
- **依赖**：D8（是否折叠）；**与 F1-4 同为「默认收起 + 显式跳转」手法**，两条应同批。
- **工作量**：**S**（跳转条版）/ **L**（真折叠版，需动渲染产物或加 remark 插件）。
- **风险**：① 把口径块**复制**一份到 `map.astro` ⇒ 立刻产生第二真源、`check-counters.mjs` 的重算对象变得含混（验收第 4 条封死）；
  ② 锚点写死中文 `#依赖图` 而 slug 规则变化 ⇒ 跳转静默失效（**这就是 `learn.astro:195` 注释里记录过的「锚点静默失效」事故形态**）⇒ 必须先打印 `toc`；
  ③ 折叠后**打印/无障碍**退化 ⇒ 目检第 ③ 项。

---

## 组 3 · `/map` 依赖图（**与批次 A 的 P2 合并**，只改一遗）

> **合并契约（captain 明确，与 `01-source-layer.md` A2 对齐）**
>
> - **真源与生成器归 A2**：`site/src/data/course-structure.ts` 的 `prereqs` 是唯一真源；
>   生成器 `site/tools/gen-dep-graph.mjs`（默认 `--check` 只读）；受保护区间
>   `notes/knowledge-map.md` 的 `<!-- BEGIN:dep-graph … -->` … `<!-- END:dep-graph -->`（01 `:269-270` 定为当前 `:78-126`，
>   本轮实测该文件里**尚无** `BEGIN/END` 标记 ⇒ 标记本身也是 A2 的产物）；
>   门禁 = `check-counters.mjs` 判据 17（01 `:976`）。
> - **本组只做「版式与着色」，不重复 A2 的机制设计**。凡与 A2 重叠处一律写「见 A2」，不另立。
> - **只改一遗的边界（写死）**：图区文本由 A2 的生成器产出 ⇒ **本组不改 `notes/knowledge-map.md` 的图区**（那是生成物）；
>   本组改的是 ① 生成器的**输出模板**（着色/方向/标签形态，A2 的伪码里这几项是占位）、
>   ② `/map` 与课程页的**呈现容器**（`map.astro` / `global.css` 的 mermaid 规则）。
>   **同一件东西不得两处改**：若 A2 的落地者发现需要改输出模板，**必须把本组 F3-1 的契约当输入**，不得各写一版。
> - **A2 的伪码里有 4 处会把图「改丑」的占位，本组负责给出正确取值**（见 F3-1，这是本组对 A2 的**必需**反馈）。

### 现状证据（本轮亲自读 + 复算，先给事实）

```bash
cd /home/ubuntu/app/learn-agent-harness
sed -n '78,126p' notes/knowledge-map.md          # 图区全文（含 4 个 classDef + 17 个节点行 + 23 条边）
grep -cE '^  [A-Z]+\["' notes/knowledge-map.md    # → 17 个节点行
grep -cE '^  [A-Z]+ (-->|-\.->)' notes/knowledge-map.md  # → 23 条边
for k in done doing todo hub; do echo ":::$k = $(grep -c ":::$k" notes/knowledge-map.md)"; done
# → :::done = 4 / :::doing = 12 / :::todo = 0 / :::hub = 1
sed -n '78,101p' notes/knowledge-map.md | grep -oE '✅|📐|🎯|⏳|🔄' | sort | uniq -c
# → 4 ✅ / 12 📐 / 1 🎯
grep -c -- '--> INTERVIEW' notes/knowledge-map.md          # → 8（实线）
grep -cE '\-\.\->' notes/knowledge-map.md                  # → 4（虚线）
grep -oE '✅ 完成|🔄 进行中|🔄 讲义已展开|⏳ 规划中' site/src/data/courses.ts | sort | uniq -c
# → 2 ⏳ 规划中 / 7 ✅ 完成 / 13 🔄 讲义已展开 / 1 🔄 进行中
```

**由此得到 4 条未被任何报告登记过的事实（本组的新证据）**：

| # | 事实 | 影响 |
|---|---|---|
| a | 图里**只有 16 个课程节点**（`sed` 出的 17 个节点行 = 16 课 + `INTERVIEW`）；`agent-harness`（Harness 架构）**整条节点都不存在** | 比「无入边」更严重：`agent-harness` 在图上**不可见**。A2 的生成器会为 17 门课各出一行 ⇒ 图会**多一个节点**（可见的变化，须在 A2 落地时一起放行） |
| b | `classDef todo` **定义了但 0 处使用**（`:::todo = 0`） | 与纪律 #9 同族：**mermaid 层的死样式**。A2 派生后 `todo` 仍无人用（`mvps.ts` 的 `planned` 三态里，17 门课**没有一门**是 planned——`grep` 实测 `⏳ 规划中` 只出现在 `courses.ts` 的非课程条目 `:313`） |
| c | 状态用了**第三套词表**：`courses.ts` 是 `✅/🔄/⏳`，classDef 名是 `done/doing/todo/hub`，**图上印的是 `✅/📐/🎯`** | `📐` 在两套真源里都**不存在** ⇒ 「颜色 ↔ 语义 ↔ 文案」三者没有可复核的映射；A2 派生时若不处理，会用 slug 覆盖 `domain`（见下 d） |
| d | A2 伪码 `01:304` 的节点标签是 `` `["${e.isHorizontal ? '横向' : e.stage} · ${e.slug}"]` ``（**打的是 slug**），而现图打的是**中文 domain**（`"✅ 从零写 harness · P0"`） | **若照 A2 伪码直出，图上会从「中文域名」退化成 `harness-from-scratch` 这类 slug** —— 这是可读性倒退，属本组必须拦下的项。`COURSE_STRUCTURE` 里**有 `domain` 字段**（`course-structure.ts` 的 `Course` 接口），可直接用 |

### F3-1｜派生图的「版式契约」：方向、着色、标签、顺序（对 A2 的必需输入）

- **id**：F3-1｜**来源**：④-5（t1 转交 5）、④-7（t4 转交 4）+ 本组新证据 a–d；机制归 **A2**
- **目标**：在 A2 把图改成派生之后，**图的读者可见属性一个都不能退化**：
  ① 仍是**上→下**布局；② 四色语义仍有对应（含 `todo` 的处置）；③ 节点标签仍是**中文域名 + 阶段**；
  ④ 新增的 `agent-harness` 节点有确定的落位与着色。
- **现状证据**：见上表 a–d 与「现状证据」命令块；另：`notes/knowledge-map.md:79` 是 `graph TD`（**不是** `flowchart LR`）。
- **具体改法（落到 A2 生成器的输出模板 + 本节契约）**：
  1. **方向：必须 `graph TD`**，覆盖 A2 伪码 `01:308` 的 `'flowchart LR'`。
     理由（形式层，必须写进 A2 的落地说明）：现图 17~18 节点 / 23 边，`LR` 布局会把图拉成**极宽的一条**；
     `global.css:619-637` 的 `div.mermaid { overflow-x: auto }` + `div.mermaid svg { max-width: 100% }` 会让它
     在 375px 下要么整体缩到不可读、要么出现**图内横滚**（读者要在图里左右拖）。`TD` 是现网已验证可读的形态。
     ⇒ 生成器的第 4 步改为 `['```mermaid', 'graph TD', …]`。
  2. **着色：保留 4 个 classDef，并把 `todo` 改成「有语义但当前为空」的显式声明**（二选一，见 D9）：
     - **方案 (i) 保留四色 + 注释说明**：生成器原样输出 4 个 `classDef`，并在图区外的自述里写
       「`todo` 当前无课程命中（17 门课里 `planned` 态为 0）」。**推荐**：色阶是给未来的（`mvps.ts` 已有 `planned` 态）。
     - **方案 (ii) 删 `todo`**：只出 3 个 classDef。好处是「死样式」清零，坏处是新增 planned 课程时要再改生成器。
     ⇒ 本文件**倾向 (i)**，但要求生成器**不再是唯一持有色值的地方**：把 4 个色值写成生成器顶部的 `CLASS_DEFS` 常量
     （`gen-dep-graph.mjs` 顶部，与 A2 的 `BEGIN/END` 常量并列），使「配色」与「真源解析」在同一文件里可 diff。
  3. **状态词表收口（新证据 c）**：节点着色由 `course-structure.ts` 派生**是做不到的**（该文件无 `status` 字段，
     状态在 `site/src/data/courses.ts` 的 `courseMeta()`）。
     ⇒ 生成器**必须再解析一份**：`courses.ts` 的 `COURSES` 数组的 `slug/status` 对（正则锚点用字段名，不用行号，
     与 A2 的解析策略一致），并把它映射成 classDef 名：
     ```
     '✅ 完成'        → done
     '🔄 讲义已展开'  → doing
     '🔄 进行中'      → doing
     '⏳ 规划中'      → todo
     （缺失/未命中）   → 显式报错并退出（不许默认成 doing）
     ```
     节点标签里的 emoji 也随之**从同一映射派生**（去掉现网 `📐` 这套第三词表，或反之统一 —— **必须只留一套**，
     见 D9；本文件倾向：**标签不带 emoji，改由颜色承担状态**，因为 mermaid 色块已在图上表达同一信息，双编码是冗余）。
     若采纳「标签不带 emoji」，则 `courses.ts` 的 `phase` 解析需求下降 —— **与 captain 提示的 `check-counters.mjs:127`
     正则耦合点交叉**：`site/tools/check-counters.mjs:127` 用
     `/slug: '([^']*)', domain: '([^']*)', phase: '([^']*)'/g` 解析 `courses.ts`，
     **删 `phase` 字段会让该正则匹配不到、门禁从 12 条判据退化为 `hardError`**。
     ⇒ 本条的生成器**新增的** `slug/status` 解析**必须与 `check-counters.mjs:127` 的正则形态保持兼容**：
     推荐在 A2/门禁里把该正则改为**分段匹配**（`slug:` 与 `status:` 各自独立锚点），
     这样即使 `phase` 被删（批次 A 的 P1 可能删它），门禁与生成器都不断。
     **⚠️ 就地更正（纪律 #4，本轮亲自复现）**：captain 与本组初稿都把该后果写成「门禁从 12 条判据**退化为 hardError**」——
     **实测不是 hardError**。`check-counters.mjs:127` 失配 ⇒ `entries.length` 从 **18**（17 课 + 白板卡）变 **0** ⇒
     `act.cards = 0` / `act.coursePages = 0` / `act.domains = 0` / `act.courseSlugs = []`，
     于**多条判据同时失配**（且「站点 html 三桶互斥且穷尽」因 `courseSlugs` 为空而失败），
     但不会走到 `:282` 的 `hardError` 分支（该分支只由「找不到数组边界」等解析前置条件触发）。
     复现命令（只读）：
     ```bash
     node -e "const fs=require('fs');const ts=fs.readFileSync('site/src/data/courses.ts','utf8');
     const a=ts.indexOf('export const COURSES'),b=ts.indexOf('\n];',a);const arr=ts.slice(a,b);
     const re=/slug: '([^']*)', domain: '([^']*)', phase: '([^']*)'/g;
     console.log('原文',[...arr.matchAll(re)].length,'| 删 phase 后',[...arr.replace(/, phase: '[^']*'/g,'').matchAll(re)].length);"
     # → 原文 18 | 删 phase 后 0
     ```
     **结论不变**（门禁会红、必须在删 `phase` 之前改解析），但**机制描述按实测写**：是「多条判据同时失配」而非「hardError」。
     本组**不直接改** `check-counters.mjs`，但把这条列为 **A2 的强制前置**（见 §未决决策点 **D10**）。
  4. **标签：必须用 `domain` 而不是 slug**（覆盖 A2 伪码 `01:304`）：
     生成器第 3 步改为
     ```js
     // domain 来自 course-structure.ts 的 Course 接口（A2 的解析正则需多抓一个 domain 字段）
     const nodeLines = entries.map(e => `  ${ID(e.slug)}["${e.isHorizontal ? '横向' : e.stage} · ${e.domain}"]:::${CLASS_OF[e.slug]}`);
     ```
     ⇒ **A2 的解析正则要扩一个字段**（`01:291-296` 的 `matchAll` 里加 `domain:\s*'([^']+)'`）。
     这是本组对 A2 的**第 2 条必需反馈**（第 1 条是方向）。
  5. **新增节点 `agent-harness` 的落位**：`ID('agent-harness')` = `n_AGENT_HARNESS`，按数组序落在 `n_LLM_TIMELINE` 之前
     （`course-structure.ts` 的数组序 = 阅读序）。它的边：`n_HARNESS --> n_AGENT_HARNESS`（`agent-harness` 的 `prereqs: ['harness-from-scratch']`）。
     ⇒ 图上会**多一个节点 + 一条边**（现状 17 节点/23 边 → 派生后 18 节点/24 边，**其中 INTERVIEW 与它的 12 条边被移出受保护区间**，
     故实际是「16+1 课 → 17 课」节点变化 + 边按 `prereqs` 重算）。**这个变化必须在 A2 的提交里显式说明**，
     否则审阅者会以为生成器算错了。
  6. **`INTERVIEW` 与 12 条汇聚边的处置：归 A2**（01 `:325-330`），本组只补充**版式约束**：
     它被移出图后成为**下方的一段文字列表**；该列表必须有**自己的小标题**且**不套用 mermaid 的色阶**
     （否则读者会以为它还是图的一部分）。小标题建议 `### 面试演练的前置覆盖`（`h3`，落进 TOC），
     样式复用 `global.css` 的 `.note-tail` 一类的弱化文本，**不新增色块**。
  7. **本轮不动手**：以上 1–6 全部作为 **A2 落地时的契约文本**，写进 01 或 06；本组只负责「写清楚」，不改 A2 的文件。
- **派生还是手工**：**派生**（一切从两份真源派生）；本组只固定**模板形态**（常量）。
- **验收命令（可重跑）**：
  - 可机器验证（**A2 落地后**才有意义，本条给出的是契约判据）：
    1. `grep -n "^graph TD\|^flowchart" notes/knowledge-map.md` → 期望命中 `graph TD`（**不得**出现 `flowchart LR`）。
    2. `grep -cE '^  [A-Z_]+\["' notes/knowledge-map.md` → 期望 **17**（16→17，含新增的 `n_AGENT_HARNESS`；
       若 `INTERVIEW` 仍在图内则为 18 ⇒ 说明 A2 的移出未做）。
    3. `grep -c 'classDef' notes/knowledge-map.md` → 期望 **4**（D9 选 (i)）或 **3**（选 (ii)），与决策一致。
    4. `grep -c ':::todo' notes/knowledge-map.md` → 期望与「`courses.ts` 里 `⏳ 规划中` 的课程数」相等（当前 **0**）。
    5. `grep -cE 'n_[A-Z_]+\["[^"]*"' notes/knowledge-map.md` 的标签里**不得**出现连字符 slug：
       `grep -E '^  n_[A-Z_]+\["' notes/knowledge-map.md | grep -c 'harness-from-scratch\|long-term-memory'` → 期望 **0**。
    6. `node site/tools/gen-dep-graph.mjs; echo EXIT=$?` → `EXIT=0`（引用 A2 `:340`，不重复设计）。
    7. `node site/tools/check-counters.mjs` → `EXIT=0`（含 A2 判据 17）。
    8. **生成器幂等**（A2 已要求逐字节比对；本组加一条形式侧）：连跑两次 `--write` 后 `git diff --stat notes/knowledge-map.md` → **空**。
  - **必须留浏览器目检**（这一组**全部**是目检对象，因为改的就是「看得见的东西」）：
    ① `/map/` 的图在 **375px** 下：是否**只缩不滚**（`div.mermaid` 的 `overflow-x:auto` 在 TD 布局下是否仍被触发）；
    ② 4 色在实际色觉下是否可区分（`#2ea043` 绿 / `#bb8009` 琥珀 / `#6e7681` 灰 / `#0f766e` 墨绿——
       琥珀与墨绿在低对比度屏上容易混，**必须目检**，必要时调 `stroke`）；
    ③ 深色主题下 4 色的可读性（`global.css:557-561` 有 `:root[data-theme='dark']` 分支，但 mermaid 用的是自己的 `theme`，
       由 `mermaid.ts:53` 的 `currentTheme()` 决定 ⇒ **必须两个主题各看一眼**）；
    ④ 新增的 `agent-harness` 节点是否让它所在的层级变拥挤（TD 布局下同层节点数变化会引起整图重排）；
    ⑤ 面试覆盖列表（移出图后的文字列表）是否被误读为图的一部分。
- **回滚点**：本组**不改文件**；A2 侧的回滚见 01 `:359`（生成器 + 门禁同提交 `git revert`）。
- **依赖**：**A2**（生成器与门禁）；**D9**（四色/todo）；**D10**（`check-counters.mjs:127` 正则与 `phase` 字段的耦合）；
  与批次 A 的 **P1**（`phase` 字段可能被删）**交叉强耦合**——见 D10 与 §未决决策点说明。
- **工作量**：**S（本组）** + **M（A2 侧多出的解析与模板工作）**。理由：本组产出的是契约文本（6 条），
  但其中第 3、4 两条会让 A2 的生成器多解析一份 `courses.ts` 并扩一个正则字段。
- **风险**：① **两处各改一半**（A2 改了生成器、本组契约没进生成器）⇒ 图上出现 slug 标签或 LR 布局，
  且因为图是生成物，**下次 `--write` 会静默回退**（纪律 #5 的经典形态）⇒ 必须把本节 6 条**逐条**写进 A2/06；
  ② 把 `courses.ts` 的 `status` 引入生成器 ⇒ 生成器从「只读一个文件」变成「读两个文件」，
  而 `check-counters.mjs:127` 的正则若因 `phase` 删除而失配，**两个工具会同时变红** ⇒ D10 必须先拍板；
  ③ 目检项 ②③ 是**主观色觉判断**，不得用「CI 绿」替代（00-plan-scope §4.2）。

### F3-2｜`/map` 的图容器与 mermaid 呈现（`map.astro` 侧）

- **id**：F3-2｜**来源**：④-5 的呈现侧；`map.astro:48` 的渲染形态；06 §转交 2 的 `/map` 认知负荷
- **目标**：图上方的「知识域交互视图」（`DomainMap`）与下方的 mermaid 图**不互相打脸**——
  两者都在表达「课程怎么连」，目前一个是交互卡片、一个是图，**没有任何一句话说明它们的关系**。
- **现状证据（file:line）**：
  - `map.astro:46` `<DomainMap slot="before" />`（在正文**之前**），`:48` `<rendered.Content />`（正文，含图）。
  - `map.astro:3-11` 的注释自述：「依赖关系（谁先谁后）继续由**笔记内 mermaid 依赖图**承担——交互视图**不做连线**」。
  - `DomainMap.astro`（120 行）本轮**未通读**（见 §依据不足项）；已知它由 `courses.ts` 派生（`map.astro:3` 注释「P-05」）。
  - `map.astro:50-52` 有一段 `slot="note"` 尾注（「本页由 `notes/knowledge-map.md` 自动渲染…」）——
    但**没有**说明「上方卡片视图与下方图的分工」。
- **具体改法（文件・行区间）**：
  1. `map.astro:46` 之后、`:48` 之前插入一句**分工说明**（沿用 A2 移出的面试列表的同一手法：文字、无色块）：
     ```astro
     <p slot="before" class="view-divide">
       上方是按知识域铺开的<b>交互视图</b>（点开看课程）；下方是<b>依赖图</b>：谁必须在谁之前，由每门课的 <code>prereqs</code> 派生。
     </p>
     ```
     ⚠️ `slot="before"` 只能有一个元素？**不是**——`NotePageLayout.astro:97` 是 `<slot name="before" />`，
     Astro 的具名 slot **允许**多个元素（按出现顺序渲染）。但 `DomainMap` 已占用 `before`，
     ⇒ 实施时**二选一**：(a) 把这句话放进 `DomainMap` 之后同 slot（推荐，已验证 slot 语义）；
     (b) 删掉 `slot="before"`，直接放进默认 slot 的正文之前（更简单）。
     **实施前必须用一次实际构建核对**（本条给出两个落法，见 D11）。
  2. `map.astro:63-66` 的 `<style>` 追加：
     ```css
     .view-divide { margin: 0 0 14px; font-size: 0.9rem; color: var(--text-soft); }
     ```
  3. **图容器不加新类**：图的外壳是 `mermaid.ts:39-45` 在**浏览器里**创建的 `figure.mermaid-figure`
     （服务端只产 `<div class="mermaid">`，见 `astro.config.mjs:11-20` 的 `remarkMermaid`）。
     ⇒ 想给 `/map` 的图单独加样式，只能用**祖先选择器**（如 `.markdown > .mermaid-figure`），
     **不能**在 `map.astro` 里给还没生成的元素加类。这是本条的**硬约束**，也是常见误区。
     若确实需要区分，唯一干净的做法是在 `mermaid.ts` 的 `ensureFigure` 里读 `el.dataset` 加类
     —— 那属于 `site/src/scripts/mermaid.ts`（`:37-47`），**本组不建议为一条样式去改客户端脚本**。
- **派生还是手工**：**手工**（一句话 + 一条 CSS）。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. `grep -c 'view-divide' site/src/pages/map.astro` → 期望 **≥2**（输出 + CSS）。
    2. `grep -c 'mermaid-figure' site/src/pages/map.astro` → 期望 **0**（确认没有被误当成可加类的元素）。
    3. 第二轮类集合比对：`.view-divide` 不得进差集。
    4. `/map` 的 mermaid 块数不变：`grep -c '```mermaid' notes/knowledge-map.md` → 期望 **1**（图区仍是**一张**图，
       由 A2 的生成器保证；若变成 2 张则说明派生时多出了一块）。
    5. `node site/tools/check-counters.mjs` → exit 0。
  - **必须留浏览器目检**：
    ① 上方 `DomainMap` 与下方图之间**是否需要额外的视觉分隔**（一句话够不够）；
    ② 375px 下 `DomainMap` 的卡片网格与图的宽度是否一致（两张东西宽度不同会显得拼接生硬）；
    ③ `/map` 首屏在加了这句话后是否仍能看到图的一部分（与 F2-5 的跳转条叠加后的综合效果）。
- **回滚点**：`map.astro` 单文件（一句话 + 一条 CSS）。
- **依赖**：F2-5（同页，两条一起改一起目检）；D11（slot 落法）；A2（图的内容）。
- **工作量**：**S**。
- **风险**：① 误以为可以给 `figure.mermaid-figure` 在 `map.astro` 里加类（**服务端不存在该元素**）⇒ 已写成硬约束；
  ② 两处 `slot="before"` 的写法若不生效，会**静默**丢掉一句话（Astro 不报错）⇒ 验收第 1 条要求 `grep` 到输出，
     且目检项 ① 是它的兜底确认。

### F3-3｜五档阶段的视觉分组（④-7 的核心；比 ④ 登记的更严重）

- **id**：F3-3｜**来源**：④-7（t4 转交 4：「`knowledge-map.md:85-98` 的 mermaid 节点标签（`· P0`/`· P1`/`· P2`）
  若改五档，图的视觉分组随之变化」）
- **目标**：把「阶段分组」这件事从**图上手抄的错值**收敛到派生，并确保分组从三档变五档后**版面仍然可读**。
- **现状证据（本轮复算，命令与输出原文）**：
  ```bash
  node -e "…解析 course-structure.ts 的 slug/stage，与 knowledge-map.md:85-101 的节点标签逐条比对…"
  # 输出（节选）：
  # ok   harness-from-scratch  graph= P0   true= P0
  # BAD  sandbox               graph= P0   true= P1
  # BAD  evaluation            graph= P0   true= P1
  # BAD  durable-execution     graph= P1   true= P2
  # BAD  api-engineering       graph= P1   true= P2
  # BAD  data-flywheel         graph= P1   true= P3
  # BAD  long-term-memory      graph= P2   true= P3
  # BAD  model-basics          graph= P2   true= P3
  # BAD  framework-ecosystem   graph= P2   true= P4
  # BAD  multi-agent           graph= P0   true= P1
  # BAD  llm-timeline          graph= 横向  true= P0
  # BAD  industry-2026         graph= 横向  true= P4
  # 一致 5 / 不一致 11 / 合计 16
  # 另有 1 行 `?? interview P0 末`（INTERVIEW 不是课程，A2 会移出图）
  ```
  - ⇒ 图上 **16 个课程节点里有 11 个的阶段标签与 `course-structure.ts` 的五档不一致**；
    图上出现的阶段值只有 `P0/P1/P2` + `横向资产`（`grep -oE '· (P[0-9]|横向[^"]*)' | sort | uniq -c` → `7 · P0` / `4 · P1` / `4 · P2` / `2 · 横向资产`），
    **完全没有 P3/P4** ⇒ 它用的是 `courses.ts` 的**旧三档 `phase`**（`courses.ts:34` 注释已自述「旧三档…已降为 legacy」）。
  - 与 ④-7 的描述对照：④ 说「若改五档，图的视觉分组随之变化」——**实测是「不改也已经是错的」**，
    即这不是「未来风险」而是**现存显示值失真**（同族问题在内容轮 P1/P10 已登记；本组只登记它的**呈现后果**）。
- **具体改法（**机制归 A2**；本组定分组形态）**：
  1. **标签值改由 `course-structure.ts` 的 `stage` 派生**（A2 伪码 `01:304` 已如此，本组确认该取值正确）。
  2. **`横向资产` 的处理**：`llm-timeline`（真值 P0）与 `industry-2026`（真值 P4）是**真课程**（有 `/c/<slug>/` 页面），
     图上却标成「横向资产」⇒ 派生后它们会回到 `P0` / `P4`。**这是正确变化**，但会让「横向」这一视觉分组**消失**。
     ⇒ 本组要求：横向属性由 `isHorizontal`（A2 的解析已抓）承担，**用 `classDef` 的第五色**（`hub` 现仅 `INTERVIEW` 用，
     移出后 `hub` 空出）或**节点边框样式**表达，**不要**再占用阶段标签位。
  3. **五档分组的版面（本组新增的设计）**：分组从「3 档 + 横向」变「5 档」后，同层节点数的分布会变
     （当前 `P0:6` 最大，派生后 `P0:5`、`P1:4`、`P2:3`、`P3:3`、`P4:2`）⇒ TD 布局的**宽度会更均匀**，
     但**纵向层数可能增加**。给出两档方案：
     - **(甲) 纯派生、不加 `subgraph`（推荐）**：只是标签值变准，图的拓扑不变，改动最小、审阅最容易。
       代价：读者仍要逐个读 `· Pn` 才能看出阶段分组，没有视觉聚类。
     - **(乙) `subgraph` 按阶段聚类**：在生成器里为 5 个阶段各出一个 `subgraph P0["P0 · 基础篇"] … end`。
       收益：阶段一眼可见；风险：`subgraph` 会强制节点分簇，**跨阶段的 `prereqs` 边会变得很长并交叉**，
       且 mermaid 在窄屏下对 `subgraph` 的布局更容易溢出。⇒ **必须目检后才能决定**。
     ⇒ 本文件**倾向 (甲)**（形式组的工作量应与收益相称：标签归真已经修掉 11 处错值），
       把 (乙) 列为 §未决决策点 **D12**。
  4. **若采纳 (乙)**：(乙) 的输出模板须固定为
     ```
     graph TD
       subgraph P0["P0 · 基础篇"]
         direction TB
         n_HARNESS_FROM_SCRATCH["从零写 harness"]:::done
         …
       end
     ```
     并在 `gen-dep-graph.mjs` 里按 `STAGES` 顺序输出 5 个 subgraph（数组序即分组序，保证幂等）。
  5. **本组不动 `notes/knowledge-map.md` 的图区**（生成物，见组 3 契约）；只把 3/4 的形态写进 A2 的落地契约。
- **派生还是手工**：**派生**（分组与标签都从 `course-structure.ts` 派生）。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. **标签-真值一致性**（本条核心判据，把上面的复算脚本固化为验收脚本）：
       上面那段 `node -e` 的**期望输出**改为 `一致 17 / 不一致 0 / 合计 17`（含新增的 `agent-harness`）。
       A2 落地前它是 `一致 5 / 不一致 11`——**这就是「图上印着错阶段」的可重跑证据**。
    2. `grep -oE '· (P[0-9])' notes/knowledge-map.md | sort | uniq -c` → 期望五档都有节点（`P0`×5、`P1`×4、`P2`×3、`P3`×3、`P4`×2），
       **不再出现** `· 横向资产`。
    3. `grep -c 'subgraph' notes/knowledge-map.md` → 期望 **0**（选甲）或 **5**（选乙），与 D12 一致。
    4. `node site/tools/gen-dep-graph.mjs; echo EXIT=$?` → `EXIT=0`（引用 A2）。
  - **必须留浏览器目检**：
    ① 五档分布下 TD 布局的**纵横比**（当前是 3 档偏方，五档可能变细长或变宽）；
    ② 375px 下图是否出现横滚（`div.mermaid{overflow-x:auto}`）；
    ③ `prereqs` 跨阶段的边（如 `evaluation(P1) --> durable-execution(P2)`）在图上是否仍可追踪；
    ④ 若选 (乙)，`subgraph` 边框与节点色块是否**叠加成噪**（两个视觉系统在表达同一件事）。
- **回滚点**：不改文件；A2 侧回滚见 01 `:359`。
- **依赖**：**A2**；D12（甲/乙）；与内容轮 **P1**（档位体系三套并存）同源——本组登记的是**图的呈现后果**，
  错值本身的判定归内容轮（**边界遵守 08 §6.3「用户可见文案的错值仍归内容轮」**）。
- **工作量**：**S（本组契约）** / **M（A2 若选乙）**。
- **风险**：① 把「11 处不一致」当成形式问题去改标签值 ⇒ **会与内容轮 P1 撞车**（本条只要求「派生」，
  真值判定权在内容轮；若 P1 决定改档位，图会随之自动跟改）⇒ 这是**必须**的交叉引用；
  ② 选 (乙) 后 `subgraph` 在 mermaid v12.1.0 + `securityLevel:'strict'`（`mermaid.ts:53-63`）下是否有兼容问题
  **本轮未验证**（属依据不足项）。

---

## 组 4 · 课程页与 details 页

> 本组的呈现单元是 `site/src/pages/c/[slug].astro`（300 行）、`site/src/pages/details/[slug].astro`（80 行）、
> `site/src/pages/details/index.astro`（201 行）与 `site/src/components/NotePageLayout.astro`（150 行），
> 样式主体在 `site/src/styles/global.css` 的 `.markdown` 区（`:455-580`）与 `.course-layout` 区。

### F4-1｜课程文件开头 5 行 `>` 引用块：元信息 vs 正文的视觉分级

- **id**：F4-1｜**来源**：④-24（t6 转交 4）
- **目标**：让读者一眼看出「这 5 行是元信息（优先级/状态/前置/用法），不是正文」。
- **现状证据（file:line）**：
  - 实测开头 `>` 块行数（`awk 'NR<=8 && /^>/{c++} END{print c+0}'`）：
    `knowledge-map.md` **6**、`observability.md`/`mcp.md`/`data-flywheel.md`/`api-engineering.md` 各 **5**、
    `system-design.md`/`sandbox.md`/`rag.md`/`model-basics.md`/`long-term-memory.md`/`harness-from-scratch.md`/`evaluation.md`/`durable-execution.md` 各 **4**、
    `framework-ecosystem.md`/`agent-harness.md` 各 **3**、`multi-agent.md`/`llm-timeline.md`/`interview-bank.md`/`industry-2026.md` 各 **2**。
  - ⇒ ④-24 说「开头 5 行 `>` 引用块」——**实测 17 篇里只有 4 篇是 5 行**（另有 1 篇 6 行、8 篇 4 行、2 篇 3 行、4 篇 2 行）。
    **「5 行」是最大值附近的取值，不是统一形态** ⇒ 任何「按行数」的硬编码方案都不成立。
  - `notes/rag.md:3-6` 是典型形态：`> 课程日志 · 2026-10-10 开课 · 完整教程版…` / `> 目标：**面试导向**——…` / `> 探测结论：…` / `> 节奏约定：…`。
  - 渲染层：`astro.config.mjs` 的 markdown 管线**没有**针对引用块的转换逻辑；`global.css:496-506`
    的 `.markdown blockquote` 给它加了左侧 3px 竖线 + `--bg-soft` 底 + `--text-soft` 字色——**视觉上确实就是一个引用块**，与正文的区分度只有「浅底 + 灰字」。
  - 课程页的元信息其实**已经有专门的容器**：`c/[slug].astro:57-67` 的 `.course-meta-bar`（域/slug/stage/StatusBadge + 面包屑），
    即读者在页面上**先看到一份机器可读的元信息条**，紧接着正文第一屏又是一份**手写元信息**（那 2–6 行 `>`）⇒ **两份元信息、两种样子**。
- **具体改法（文件・行区间・样式块）**：
  1. **不改 `notes/*.md`**（笔记是 GitHub 读者的一手源；且改 17 篇的开头结构会与内容轮撞车）。
     在**渲染层**加一条 `remark` 插件，把「文档开头连续的 `>` 块」标记成元信息容器：
     - 新文件 `site/src/utils/remarkNoteMeta.ts`（约 25 行，与 `utils/md.ts` 同一套插件写法）：
       ```ts
       /** 形式组 4（④-24）：把正文开头的连续 blockquote 标成「元信息」，供 CSS 分级。
        *  只在 h1 之后、第一个 h2 之前生效；不动文本内容，只把 html 节点包一层 div。 */
       export function remarkNoteMeta() {
         return (tree: any) => { /* 找到 h1 后、首个 h2 前的连续 blockquote，包成 <div class="note-meta">…</div> */ };
       }
       ```
     - 挂载点：`site/astro.config.mjs:26` 的 `remarkPlugins` 数组里追加 `remarkNoteMeta`（**注意顺序**：放在 `remarkMermaid` 之前，
       因为 mermaid 会改节点类型）。
     ⚠️ 该插件与本组其他项**同文件风险最高**：`astro.config.mjs` 是全局管线配置（`utils/md.ts:30-33` 明确记载「改它要动 shiki/base 等全局配置」）。
     ⇒ **备选（更稳）**：给 `c/[slug].astro` 加一个**客户端**脚本，把 `.markdown > blockquote:first-of-type` 加类
     （与 `mermaid.ts` 同一套 DOM 装饰手法，零管线风险，代价是无 JS 时无分级）。**两案见 D13**。
  2. 样式：`global.css:496-506` 的 `.markdown blockquote` 规则**不动**；在其后（`:506` 之后）新增：
     ```css
     /* 形式组 4（④-24）：正文开头的「元信息」引用块——与正文引用块区分 */
     .markdown .note-meta {
       margin: 0 0 1.6em; padding: 10px 14px;
       background: var(--bg-soft); border-left: 3px solid var(--border-strong);
       border-radius: 0 10px 10px 0; font-size: 0.88rem; color: var(--text-faint);
     }
     .markdown .note-meta blockquote { margin: 0; padding: 0; border: none; background: none; border-radius: 0; color: inherit; font-size: inherit; }
     ```
     关键点：内层 `blockquote` 的默认装饰被**显式清掉**（否则出现「框里又套一个引用框」）。
  3. 与 `c/[slug].astro:57-67` 的 `.course-meta-bar` **明确分工**：元信息条 = 机器派生（域/阶段/状态），
     引用块 = 作者手写（优先级/用法/探测结论）。⇒ 在同一条的 `<style>` 里给 `.note-meta` 加一句内容前缀说明不必；
     但**建议**在 `.course-meta-bar` 的 chip 行（`:58-63`）之后加一行小字「↓ 下面是本课自述的读法（作者手写）」——
     这是**可选增强**，见 D13。
- **派生还是手工**：**手工**（一次性管线/脚本 + 一条 CSS）。**没有任何派生空间**：那几行是作者手写文本。
  ⇒ 本条**特别需要**遵守纪律 #3：不许为了让规则简单而假设「所有课都是 5 行」（已实测 2–6 行不等）。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. **行数分布基线**（把「5 行」这个假设钉死为实测值）：
       ```bash
       cd /home/ubuntu/app/learn-agent-harness && for f in notes/*.md; do n=$(awk 'NR<=8 && /^>/{c++} END{print c+0}' "$f"); echo "$n $f"; done | sort -rn
       ```
       期望分布：`6×1 / 5×4 / 4×8 / 3×2 / 2×4`（合计 19 篇，含 `interview-bank`/`knowledge-map`）。
       验收判据：**改动后该分布不变**（本组不碰笔记）。
    2. 插件/脚本生效：`grep -c 'note-meta' site/src/styles/global.css` → 期望 **≥2**（容器 + 内层 blockquote 两条）；
       `grep -c 'note-meta' site/src/pages/c/\[slug\].astro site/src/utils/remarkNoteMeta.ts` → 按 D13 所选方案，命中数 >0。
    3. 第二轮类集合比对：`.note-meta` 不得进差集（若走 D13 的客户端方案，它出现在**脚本字符串**里 ⇒ 扫描器需覆盖 `.astro` 内的 `<script>` 文本，见 F0-4 的风险③）。
    4. `node site/tools/check-counters.mjs` → exit 0。
  - **必须留浏览器目检**：
    ① 元信息框与紧随其后的第一个 `##` 标题的**间距**是否被读成「框属于标题」；
    ② 框内 `**目标：**` 这类加粗在 0.88rem 下的可读性；
    ③ **正文中间的引用块是否被误加类**（若插件/脚本的选择器过宽，会波及正文里的 `>` 引用——这是本条的**主要风险**，
       必须逐页扫一眼：`grep -c '^>' notes/*.md` 与「开头连续块」的差集就是正文引用块的数量）；
    ④ 深色主题下 `.note-meta` 与 `.card` 底色是否区分不开。
- **回滚点**：`astro.config.mjs`（一行 import + 一行挂载）或 `c/[slug].astro`（一段 `<script>`）+ `global.css`（两条规则）——均可独立回滚。
- **依赖**：D13（插件 vs 客户端方案）。
- **工作量**：**M**。理由：插件 25 行（要处理 h1/h2 边界与代码围栏）、CSS 两条、目检 4 项 × 2 主题；
  若走客户端方案降为 **S**（但失去无 JS 分级）。
- **风险**：① **改 `astro.config.mjs` 影响全站 33 页**（不只课程页）⇒ 目检范围必须扩到 `/map`、`/interview`、`/details/*`
  （它们也都是笔记原文渲染，`map.astro:48`、`interview.astro`、`details/[slug].astro:60`）；
  ② 选择器过宽会误伤正文引用块（目检项③）；
  ③ 「5 行」这个错误前提若被写进实现（如 `slice(0,5)`）⇒ 实测 2–6 行会让它半失效 ⇒ 已用验收第 1 条把实测分布写死。

### F4-2｜mermaid 图注与图号（62 张图里 0 张有手写图注）

- **id**：F4-2｜**来源**：④-25（t6 转交 5）
- **目标**：每张图都有**可读的图注**（不是只有「图 1」），并且图注在站点上有一致样式。
- **现状证据（file:line + 实测）**：
  - 图总数：`grep -rc '```mermaid' notes/*.md | awk -F: '{s+=$2} END{print s}'` → **62**，
    分布在 **15 个文件**（14 篇各 4 张 + `mcp` 5 张 + `knowledge-map` 1 张 = **62**；本轮 `grep -rc` 逐文件实测）：
    `agent-harness`/`api-engineering`/`data-flywheel`/`durable-execution`/`evaluation`/`framework-ecosystem`/
    `harness-from-scratch`/`long-term-memory`/`model-basics`/`multi-agent`/`observability`/`rag`/`sandbox`/`system-design` 各 **4**。
  - 手写图注数：`grep -rc '^%% *caption:' notes/*.md | awk -F: '{s+=$2} END{print s}'` → **0**。
  - ⇒ 全部走兜底：`site/src/scripts/mermaid.ts:45` `figcaption.textContent = captionOf(el.dataset.msrc ?? '') ?? \`图 ${ordinal}\``
    （`captionOf` 在 `:19-23`，只认首行 `%% caption:`）；
    服务端直出路径同理：`site/src/utils/md.ts:46` `const caption = captionOf(node.value) ?? \`图 ${ordinal}\``。
  - ⇒ 现状**已有图号**（`图 1`、`图 2`…，`ordinal` 按页内出现顺序，`mermaid.ts:72-79` 的 `nodes.entries()`），
    **缺的是「这张图讲什么」**。④-25 的描述（「无图号/图注」）**前半不准确**：图号是有的，是自动的；图注是缺的。
  - 图注样式已存在：`global.css:605-610` `.mermaid-figure figcaption`（居中、0.85rem、`--text-faint`）。
  - 另一处「正文用文字指代图」的实证：`notes/*.md` 里有「从图里要能读出三件事」这类句子（④-25 原文），
    ⇒ 说明作者**知道**图需要导读，只是没写在图注位。
- **具体改法（**分两层，第二层才动笔记**）**：
  1. **呈现层（本组负责，不动笔记）**：把兜底图注从「图 N」升级为「图 N · <就近的图前正文最后一句/标题>」——
     **不建议**（自动摘要会产出误导性图注）。本组的呈现层改动只有两条：
     - `global.css:605-610`：`.mermaid-figure figcaption` 增加 `max-width: 40em; margin-inline: auto;`（长图注不横贯全宽）；
     - 新增 `.mermaid-figure figcaption::before { content: ''; }` **不需要**；改为**加一个可选图号位**：
       `.mermaid-figure figcaption .fig-no { color: var(--accent); font-weight: 600; margin-right: 6px; }`
       —— 前提是 `mermaid.ts:45` 改为把「图 N」与手写图注**分开渲染**（见第 3 点）。
  2. **内容层（属批次 B/C，本组只登记并给出格式契约）**：给 62 张图补 `%% caption:` 首行（作者手写一句）。
     **格式契约（供内容轮直接采用，本组不代写）**：
     ```
     ```mermaid
     %% caption: 五阶段的依赖边只有两处跨阶段（评测→durable、评测→飞轮）
     graph TD
     ...
     ```
     ```
     `captionOf`（`mermaid.ts:19-23` / `md.ts:11-15`）**只认首行**且要求整行匹配 `^%%\s*caption:\s*(.+?)\s*$` ⇒
     `%%` 后必须有空格、`caption:` 后必须有空格、整行不能有尾随内容。
     ⚠️ **`%%` 是 mermaid 的注释语法**，不会渲染进图内（mermaid v12 行为），**但本轮未实测**（见 §依据不足项）。
  3. **若采纳第 2 点**，则 `mermaid.ts:45` 改为：
     ```js
     const cap = captionOf(el.dataset.msrc ?? '');
     figcaption.innerHTML = `<span class="fig-no">图 ${ordinal}</span>${cap ? esc(cap) : '<span class="fig-missing">（本图缺图注）</span>'}`;
     ```
     并**必须**加 `esc()`（`utils/md.ts:84-90` 已有该函数；`mermaid.ts` 目前用 `textContent` 赋值，改 `innerHTML` 就要自己转义）。
     ⇒ 「缺图注」变成**读者可见**的事实（而不是静默的「图 N」）——这是纪律 #2 的同类手法：
     把缺失显式化，才能推动补齐。服务端路径 `md.ts:46-53` 同步改（它已经用 `esc(caption)`）。
- **派生还是手工**：**手工**（62 条图注是作者工作）；**呈现层是派生**（图号按页内顺序派生，已如此）。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. **图注覆盖率**（本条核心判据，本轮基线为 0）：
       ```bash
       cd /home/ubuntu/app/learn-agent-harness && a=$(grep -rc '```mermaid' notes/*.md | awk -F: '{s+=$2} END{print s}'); b=$(grep -rc '^%% *caption:' notes/*.md | awk -F: '{s+=$2} END{print s}'); echo "图 $a / 图注 $b"
       ```
       期望（内容轮完成后）：`图 62 / 图注 62`。**形式轮不改笔记 ⇒ 本轮的期望仍是 `62 / 0`，本条不使其变化。**
    2. 图注格式合规（防「写了但格式不被识别」——这是最容易静默失败的一步）：
       `grep -rhE '^%%' notes/*.md | grep -vcE '^%% caption: .+$'` → 期望 **0**（即所有 `%%` 行都是合法 caption 格式）。
    3. 覆盖性：`grep -c '```mermaid' notes/x.md` 与 `grep -c '^%% caption:' notes/x.md` **每个文件必须相等**（逐文件比对，防「总数对但某篇全缺」）。
    4. 呈现层：`grep -n 'fig-no\|fig-missing' site/src/scripts/mermaid.ts site/src/utils/md.ts` → 期望两侧都有；
       `grep -n 'fig-no\|fig-missing' site/src/styles/global.css` → 期望 ≥2。
    5. 转义反例自证：在图注里放 `<b>x</b>` 后目检是否被当标签解析（若被解析 ⇒ `esc()` 没接上）。**此条属负路径自证**，
       验证后必须还原笔记（或只在临时分支做）。
    6. `node viz/mermaid-check.mjs` → `RESULT: PASS`（**需 F0-0 的 dist + F0-3 的可移植化**）。
  - **必须留浏览器目检**：
    ① 62 张图的图注在 375px 是否折行成 3 行以上、是否与图一起居中；
    ② 「图 N · 说明」的排版是否读起来像图题（而不是图内文字）；
    ③ `/map` 单图页面的 `图 1` 是否显得多余（单图页可以只显示图注不带号——**须目检后决定**）；
    ④ 「（本图缺图注）」的可见性是否**过于刺眼**（它是给维护者看的，不该让读者觉得站点坏了）——若刺眼，
       改为 `--text-faint` 且不显示括号（须目检）。
- **回滚点**：`global.css`（图注样式）+ `mermaid.ts`/`md.ts`（图注拼装）——两处独立；笔记改动属内容轮，不在本组回滚范围。
- **依赖**：内容轮的批次 B/C（62 条图注）；F0-3（`mermaid-check` 可移植化后才能端到端验证）；F0-0（dist）。
- **工作量**：**S（呈现层）** / **L（62 条图注，归内容轮）**。理由：呈现层只有 2 个文件 3 处改动；
  图注本身是 62 次「读懂这张图并写一句话」。
- **风险**：① **改了拼装逻辑但 62 条图注一条没加** ⇒ 每张图都显示「缺图注」，站点观感变差
  ⇒ 必须**同一批**或**后置**（D14：先只改样式，等内容轮补齐图注后再打开「缺图注」提示）；
  ② `%% caption:` 若被 mermaid 当可见文本渲染进图 ⇒ 全部图变丑（**未实测**，见 §依据不足项）⇒ 实施前必须先用一张图试；
  ③ 改成 `innerHTML` 后忘记 `esc()` ⇒ **XSS/渲染破坏面**（笔记文本里本来就可能含 `<br/>`，`mermaid.ts:73` 注释专门解释过这点）。

### F4-3｜练习题库「考察」列的小节锚点

- **id**：F4-3｜**来源**：④-2（t1 转交 4，ped-F7 的落地形式）
- **目标**：读者看到「考察 S3+S4」时**能点进去**，而不是自己回翻找小节。
- **现状证据（file:line + 实测）**：
  - 表头形态：`| # | 题目 | 考察 |`（或 `| # | 题目 | 考察层 |`）。实测**表头 14 处、数据行 184 行**：
    `agent-harness.md:382`(8)、`api-engineering.md:309`(14)、`data-flywheel.md:387`(14)、`durable-execution.md:415`(14)、
    `evaluation.md:477`(14)、`framework-ecosystem.md:401`(14)、`harness-from-scratch.md:224`(8)、`long-term-memory.md:467`(14)、
    `mcp.md:542`(14)、`model-basics.md:360`(14)、`multi-agent.md:421`(12)、`observability.md:327`(14)、
    `sandbox.md:504`(16)、`system-design.md:386`(14)。
  - 取值形态（实测）：`S1`–`S8` 单一值；`S2+S4`、`S3+S4`、`S1+S5`、`S7 + S4.4`、`S1/S2`、`S5/S10`（**`/` 与 `+` 混用、有空格差异**）。
  - 小节真形态：`## S1 …`、`## S2 …`（h2），如 `notes/durable-execution.md:20/39/96/139/175/196/215/331/375`。
  - 锚点算法：`site/src/utils/toc.ts:11-21` 的 `slugify`（与 github-slugger 对齐）＋ `:23-48` 的 `extractToc`（只取 h2/h3）。
    例：`S2 三个核心机制（各自防什么）` → id `s2-三个核心机制各自防什么`。
  - **已有同机制的现成实现**：`c/[slug].astro:40-51` 的 `bankAnchor(prefix)` 用 `toc.find(t => t.text.startsWith(prefix))` 解析，
    并在**解析不到时抛错**（`:45` fail-fast）。⇒ 本条**必须复用这套机制**，不另写一套。
- **具体改法（**推荐客户端装饰，理由见下**）**：
  1. **为什么不改笔记**：把 `S3` 改写成 `[S3](#s3-…)` 需要**手算**每个 heading 的 slug（184 行 × 平均 1.5 个引用 ≈ 280 处），
     且 heading 一改就全断（正是 `c/[slug].astro:36-38` 注释里记录过的「锚点静默失效」事故形态）。
     ⇒ 笔记侧零改动。
  2. **为什么不在构建期注入**：`c/[slug].astro:23` 的 `render(entry)` 返回的是 **组件**，不是 HTML 字符串 ⇒
     构建期无法对已渲染 body 做字符串替换。要走构建期就得加 remark 插件重写表格单元格，但 slug 必须与
     Astro 内部的 heading id 完全一致（`utils/toc.ts:11` 只是**复刻**，不是同一个实现）⇒ 复刻出错的代价是**静默错锚点**。
  3. **选定方案：`c/[slug].astro` 新增一段客户端脚本**（与 `mermaid.ts` 同为「DOM 装饰」，零管线风险）：
     ```ts
     // 形式组 4（④-2 / ped-F7）：给「考察」列的 S<数字> 加小节锚点。
     // 用页面上真实生成的 heading id（不复制 slug 算法），找不到就不加——绝不产出坏锚点。
     (function () {
       const slugOf = (cell: HTMLElement, m: RegExpMatchArray) => {
         const no = m[1].toLowerCase();
         const hit = [...document.querySelectorAll<HTMLElement>('article.markdown h2[id],article.markdown h3[id]')]
           .find((h) => h.id === no + '-' || h.id.startsWith(no + '-'));
         return hit ? hit.id : null;
       };
       document.querySelectorAll<HTMLTableCellElement>('article.markdown table td').forEach((td) => {
         const txt = (td.textContent ?? '').trim();
         const m = txt.match(/^S(\d)(?:\s*[+/]\s*S(\d+(?:\.\d+)?))?(?:\s+.+)?$/);
         if (!m) return;
         // 只在「考察」列表头下生效（用最近的 table 的最后一个表头单元格判定）
         const th = td.closest('table')?.querySelector('thead tr th:last-child');
         if (!th || !/考察/.test(th.textContent ?? '')) return;
         …
       });
     })();
     ```
     ⚠️ **必须**做「只在该表生效」的头判定（实测 278 条编号行里只有 **184** 行属于 考察 表；其余是速查表 ⇒
     不加头判定会把「P0/P1/P2」「tool_calls」「⑤」这类值也当锚点候选）。
  4. 样式：`global.css` 的 `.markdown table` 区域（`:515-538`）之后加
     `.markdown td a.s-anchor { text-decoration: none; border-bottom: 1px dotted var(--accent); }`。
  5. **无 JS 时退化**：保持纯文本（现状），**不产**坏链接。这满足「静态 HTML 可读」的既有口径
     （`learn.astro:290-291` 的注释明写「无 JS 时静态 HTML 无任何 hidden」——同一哲学）。
- **派生还是手工**：**派生**（锚点从页面真实 heading id 派生，零手抄）。这是本组**唯一**「一次实现、184 行受益」的条目。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. **锚点可达性（负路径自证，核心判据）**：在 `/c/durable-execution/` 上，脚本注入的每个锚点目标必须存在。
       静态可重跑的近似判据：对每个 考察 表的 S 值，检查同文件是否存在 `## S<n> ` 或 `### S<n>` 标题：
       ```bash
       cd /home/ubuntu/app/learn-agent-harness && node -e "
       const fs=require('fs');let miss=0,tot=0;
       for(const f of fs.readdirSync('notes').filter(x=>x.endsWith('.md'))){
         const t=fs.readFileSync('notes/'+f,'utf8'),L=t.split('\n');
         const heads=new Set([...t.matchAll(/^#{2,3}\s+S(\d+(?:\.\d+)?)/gm)].map(m=>m[1]));
         L.forEach((l,i)=>{const h=l.match(/^\|\s*#\s*\|.*\|\s*考察(层)?\s*\|/);if(!h)return;for(let j=i+2;j<L.length&&/^\|\s*\d/.test(L[j]);j++){
           const cell=L[j].split('|');const v=(cell[cell.length-2]||'').trim();for(const m of v.matchAll(/S(\d+(?:\.\d+)?)/g)){tot++;if(!heads.has(m[1])){miss++;console.log(f+':'+(j+1),'S'+m[1],'无对应标题');}}}});
       }
       console.log('引用总数',tot,'/ 无对应标题',miss);
       "`
       期望：`无对应标题 = 0`（**若这个数不为 0，则本条的目标不可达——必须先修笔记或改设计**）。
       ⚠️ 本判据是**近似**（它把 `S5/S10` 的 `S10` 也算进去，而 `S10` 可能是「§10」的笔误）⇒ 输出必须**逐条人工过目**。
    2. `grep -c 's-anchor' site/src/pages/c/\[slug\].astro site/src/styles/global.css` → 两侧都有。
    3. 头判定生效：`grep -c '考察' site/src/pages/c/\[slug\].astro` → 期望 **≥1**（判定逻辑里出现）。
    4. 第二轮类集合比对：`.s-anchor` 不得进差集。
    5. 静态页面不受影响：`node site/tools/visual-check.mjs` 的 `c/rag` 条目（`visual-check.mjs:66`）仍绿。
  - **必须留浏览器目检**：
    ① 加了点线后**表格是否变花**（184 行密集点线；若花，改成只在 hover 时显示下划线）；
    ② 点锚点跳转后**标题是否被 sticky 顶栏遮挡**（`global.css:1868-1872` 已给 `.markdown h2/h3` 设了 `scroll-margin-top`，**需目检确认生效**）；
    ③ 窄屏下表格横滚（`.markdown table { overflow-x: auto }`，`global.css:512-515`）里锚点是否可点；
    ④ `S7 + S4.4` 这类多值是否两个都可点（`S4.4` 是 h3，见 `durable-execution.md:331/348`）。
- **回滚点**：`c/[slug].astro` 一段 `<script>` + `global.css` 一条规则。
- **依赖**：无（但**判据 1 的输出决定本条是否可做**——若存在无对应标题的引用，必须先由内容轮修）。
- **工作量**：**M**。理由：脚本约 30 行（含头判定与正则），但**正则要覆盖实测的 6 种取值形态**
  （`S3`/`S2+S4`/`S7 + S4.4`/`S1/S2`/`S5/S10`/`S5 目标漂移`），且要跑一次全量可达性核对。
- **风险**：① 复制 slug 算法而不是读真实 id ⇒ **静默坏锚点**（已明确禁止，改法第 2 点给了理由）；
  ② 忘记表头判定 ⇒ 速查表的 `P0/P1/P2` 被当锚点（94 行误伤，见改法第 3 点的实测数）；
  ③ `S10`/`S4.4` 这类边界值解析错 ⇒ 验收第 1 条会暴露（期望 0 处无对应标题）。

### F4-4｜8 篇 details 的两栏/折叠

- **id**：F4-4｜**来源**：④-23（t6 转交 3）
- **目标**：把 8 篇结构完全一致的 details 页从「单栏长页」变成**结构化呈现**，让「一句话定义 / 为什么影响 / 一手源 / 本地映射 / 面试一句话」五节可比、可折叠。
- **现状证据（file:line + 实测）**：
  - 8 篇结构**逐字同构**：每篇 `# 资深分水岭 N:…`（`:10`）+ 五个 h2：
    `## 一句话定义`（`:12`）、`## 为什么影响走向`（`:16`）、`## 行业一手源`（`:20`）、`## 本地映射`（`:24`）、`## 面试一句话`（`:29`）
    —— `grep -nE '^#{1,3} ' notes/details/*.md` 对 8 个文件逐条比对，**标题文本与顺序完全一致**（行号略有 ±1 差异）。
  - 渲染：`details/[slug].astro:42` 是**单栏** `<article class="markdown">`，`:60` `<Content />` 直出；
    **没有** `.course-layout`（对比 `c/[slug].astro:55` 有 `div.course-layout` + `aside.toc`）
    ⇒ **details 页没有 TOC 侧栏**，8 篇却都有 5 个可导航小节。
  - `details/[slug].astro:80` 全文**无** `<style>` 之外的结构类；`:69-79` 的 `<style>` 只有 `.chip-src`。
  - `details/index.astro`（201 行）是列表页，`:70/93/117` 三处渲染 `kind-${kind}` chip（与 F0-4 的类集合比对相关）。
- **具体改法（推荐：**加 `course-layout` + TOC，并把第 2–5 节做成 `details` 折叠**）**：
  1. `site/src/pages/details/[slug].astro:42` 外层改为 `<div class="course-layout">` 包住 `<article class="markdown">`，
     并在 `:66` 的 `</article>` 之后补 TOC 侧栏（**逐字复用** `c/[slug].astro:211-228` 的 `<aside class="toc">` 块）：
     ```astro
     {toc.length > 0 && (<aside class="toc" aria-label="本页目录"><details open><summary>本页目录</summary><ul>
       {toc.map((t) => (<li class={t.depth === 3 ? 'toc-3' : 'toc-2'}><a href={`#${t.id}`}>{t.text}</a></li>))}
     </ul></details></aside>)}
     ```
     并在前置区加 `import { extractToc } from '../../utils/toc';` 与 `const toc = extractToc(entry.body ?? '');`
     （`details/[slug].astro:20` 之后）。
     ⇒ **收益**：8 篇立刻与 17 门课程页同构（`NotePageLayout.astro:9` 的自述就是「与 /c/[slug] 课程页同一套 CSS 类」——
     details 页是**唯一**没跟上的渲染页）。**工作量为零新增 CSS**。
  2. **折叠**：把第 2–5 节（`## 为什么影响走向` 起）做成默认收起的 `<details>`。
     - 落法（推荐，风险最低）：**客户端**装饰，与 F4-1/F4-3 同一手法——脚本按 h2 边界把后续兄弟节点包进 `<details>`。
       ⚠️ 风险：无 JS 时全部展开（**可接受**：静态页仍完整可读，符合 `learn.astro:290` 的既有哲学）。
     - 落法 2（构建期 remark 插件）：与 F4-1 的 `remarkNoteMeta` 可合并为同一插件的两个规则，但**同样有全站管线风险**。
     - 落法 3（**不推荐**）：改 8 篇笔记加 `<details>` HTML 块 ⇒ 笔记在 GitHub 上退化成 HTML、且与内容轮撞车。
  3. **两栏**（`④-23` 的「左右两栏」）：注意 `course-layout` 是「正文 + TOC 侧栏」，**不是**「两栏正文」。
     若要做「一句话定义 / 面试一句话」左右对照，需新增栅格：
     ```css
     /* 形式组 4（④-23）：details 五节的对照视图（仅在窄屏之上生效） */
     @media (min-width: 900px) {
       .details-split { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 28px; }
     }
     ```
     ⇒ **建议只做 TOC + 折叠（第 1、2 点），不做两栏正文**：两栏会把「为什么影响走向」这类长段落压窄到不可读
     （`global.css:1858-1860` 的 `.markdown p { max-width: 40em }` 是既有的可读性约束，两栏会**违反它**）。
     **这是 §未决决策点 D15。**
- **派生还是手工**：**派生**（TOC 从 `extractToc` 派生；折叠边界从 h2 结构派生——8 篇同构使这条规则**可靠**，
  且若将来某篇缺某节，脚本按 h2 边界走仍不会错）。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. **8 篇结构同构性**（本条所依赖的前提，必须可重跑）：
       `for f in notes/details/*.md; do grep -cE '^## ' "$f"; done | sort | uniq -c` → 期望 **`8 5`**（8 篇各 5 个 h2）。
       标题序列：`for f in notes/details/*.md; do grep -E '^## ' "$f" | md5sum; done | sort -u | wc -l` → 期望 **1**（8 篇标题序列完全一致）。
    2. `grep -c 'course-layout\|aside class="toc"' site/src/pages/details/\[slug\].astro` → 期望 **≥2**。
    3. `grep -n 'extractToc' site/src/pages/details/\[slug\].astro` → 期望 **2**（import + 使用）。
    4. 与课程页同构性：`diff <(grep -o 'class="[^"]*"' site/src/pages/c/\[slug\].astro | sort -u) <(grep -o 'class="[^"]*"' site/src/pages/details/\[slug\].astro | sort -u)`
       → 期望差异**只包含** details 特有的类（`.chip-src`）与课程页特有的类（`.learning-path`/`.lp-*`/`.related-questions`/`.rq-*`/`.prev-next`/`.pn-*`/`.foot-links`）。
    5. 折叠脚本：`grep -c 'details-split\|<details' site/src/pages/details/\[slug\].astro` → 按 D15 的决策。
    6. `node site/tools/visual-check.mjs` 的 `details/` 条目（`visual-check.mjs:69`，`container: '.cards .card', cardsMin: 1`）仍绿 ——
       ⚠️ 该条目断的是**列表页**的卡片（`details/index.astro`），**不覆盖详情页** ⇒ 详情页目前**没有任何几何回归**（新证据）。
       ⇒ 建议（属 F0-1 的同类）把 `details/01-context-rot/` 加进 `PAGES`（见 D16）。
  - **必须留浏览器目检**：
    ① TOC 侧栏出现后，8 篇的**阅读宽度**是否与课程页一致（`course-layout` 的栅格断点）；
    ② 折叠态下 8 篇的**首屏高度**是否变短到「看起来内容很少」（这是折叠的常见反效果）；
    ③ 折叠摘要文字用什么（本组建议用 h2 标题本身，**须目检**是否与 h2 样式冲突）；
    ④ 8 篇在 `details/index.astro` 入口卡片与详情页之间的**观感连续性**（`:70/93/117` 三处 chip）。
- **回滚点**：`details/[slug].astro`（单文件：布局 + TOC + 可能的脚本）+ `global.css`（若做两栏）。
- **依赖**：D15（折叠/两栏范围）；D16（是否给详情页加几何回归）；与 F4-1 共用手法（客户端装饰 vs 管线插件）。
- **工作量**：**M**（TOC + 折叠）/ **L**（加两栏正文，含可读性回归）。理由：TOC 是搬 `c/[slug].astro:211-228` 的现成块；
  折叠脚本要处理 h2 边界；两栏则要重审 `max-width: 40em` 的可读性约束。
- **风险**：① 折叠把「本地映射（已覆盖/未覆盖）」藏起来 ⇒ 而这正是 08 里 **P4** 的对象（`details` 8 页的覆盖面问题是 Top 10 之一）
  ⇒ **折叠不能默认收起「本地映射」这一节**（否则加剧 P4 的可信度问题）。这是本条**最重要的约束**。
  ② 8 篇同构性若被内容轮改动（P4 复核）打破 ⇒ 折叠规则要按 h2 边界而非固定序号写（已在「派生」里写明）。

### F4-5｜details front-matter 在详情页的呈现（`source` / `status` / `kind`）

- **id**：F4-5｜**来源**：④-9（t5 转交 3）
- **目标**：把 8 篇的 `title/slug/domain/source/status/kind` 六字段的呈现收口成一致形态。
- **现状证据（file:line）**：
  - front-matter 六字段实测（`grep -n '^kind:' notes/details/*.md` 已核 `kind`；其余同）：
    `title` / `slug` / `domain` / `source` / `status` / `kind`（`notes/details/01-context-rot.md:1-8` 一带）。
  - 渲染点：`details/[slug].astro:43-54` 的 `.course-meta-bar` 依次输出
    `:45` 「详解」chip → `:46` `kind-${kind}` chip → `:47` `domain` chip → `:48-52` `source` chip（**只显示 host**，`:29-38` 有注释解释「完整 URL 会在窄屏撑破布局：实测 375px 溢出 197px」）→ `:53` StatusBadge。
  - `slug` 与 `title` **不在 meta 条里**：`title` 只进 `<Base title>`（`:41`）与面包屑末项（`:56`）；
    `slug` 完全不显示（`getStaticPaths` `:14` 用它做路由）。
  - `KIND_LABEL` 映射（`:22-27`）只覆盖 3 个值（`interview-question`/`design-detail`/`cost-detail`），
    与本组 F0-4 的类集合比对结论一致。
  - `details/index.astro:70/93/117` 用**同一套** `KIND_LABEL`？——本轮**未核对**该文件是否重复定义（见 §依据不足项）。
- **具体改法（文件・行区间）**：
  1. **不改字段与数据**（`content/config.ts:29-40` 的 schema 是 `optional + passthrough`，
     字段的**存在性**归内容轮 P4 复核）。
  2. `details/[slug].astro:43-54` 只做两处收口：
     - `:53` 的 `StatusBadge` 前补一个 `slug` chip（读者从列表页进来时能对上 URL）：
       `<span class="chip">{entry.data.slug ?? entry.id}</span>` —— 复用 `c/[slug].astro:60` 的同类形态（那里显示 `notes/{id}.md`）。
       **更好的做法**：与课程页统一为 `notes/details/{slug}.md` 形态（读者能直接找到文件）。
     - `:48-52` 的 `source` chip 补 `aria-label`/`title` 已有（`:49` 已有 `title={sourceUrl}`）；
       补一条 **视觉**说明：当 `sourceHost` 解析失败时（`:36` 的 `catch` 返回原串），当前会显示整段 URL
       ⇒ 加一个类 `.chip-src-raw { overflow-wrap: anywhere; }`（与 `.chip-src` 同规则，`:71-75` 已有）。
  3. **字段呈现的「有无」差异要显式化**（与 F4-2 同哲学）：某个字段缺失时**不要静默不渲染**，
     而是在 meta 条末尾加一个 `.meta-missing` 小字列出缺哪些字段——**这是可选增强**，
     且会与内容轮 P4 的「未覆盖 vs 行业一手源冲突」交叉 ⇒ **见 D17，默认不做**。
- **派生还是手工**：**手工**（形态）。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. `grep -c 'entry.data.slug' site/src/pages/details/\[slug\].astro` → 期望 **≥2**（路由 + 新增显示）。
    2. `grep -c 'chip-src-raw\|notes/details/' site/src/pages/details/\[slug\].astro` → 期望 ≥1。
    3. 第二轮类集合比对：新增类不得进差集。
    4. `node site/tools/check-counters.mjs` → exit 0（`details` 页数 8 的口径未被改动）。
  - **必须留浏览器目检**：
    ① meta 条新增 chip 后，375px 下**是否发生换行拥挤**（`:29` 的注释已记录过一次溢出事故，**这是本条的敏感点**）；
    ② 5–6 个 chip 在 768px 是否挤成两行、与面包屑的间距；
    ③ 深色主题下 `kind-*` 三色 chip 的对比度（`global.css:421/427/433`）。
- **回滚点**：`details/[slug].astro` 单文件（2 处 `+`）。
- **依赖**：D17（是否显式化缺失字段）；F0-4（类集合门禁会核这三个 `kind-*`）。
- **工作量**：**S**。
- **风险**：① 加 chip 触发窄屏溢出（`:29` 的历史事故）⇒ 验收目检项①是硬要求；
  ② 把 `slug` 显示成内部文件名会被读者误解为「另一个标题」⇒ 用 `notes/details/xxx.md` 形态明确它是路径。

### F4-6｜`c/[slug].astro:61` 的 chip 兜底分支（与 `check-counters.mjs:127` 强耦合）

- **id**：F4-6｜**来源**：④-6（t4 转交 3）+ **captain 本轮追加的硬依赖提示**
- **目标**：在批次 A 可能删除 `courses.ts` 的 `phase` 字段时，**课程页 meta 条的 chip 不会静默变化**，
  且 `check-counters.mjs` 的解析**不会因此退化为 hardError**。
- **现状证据（file:line）**：
  - `c/[slug].astro:61`：`<span class="chip">{structure ? structure.stage : meta.phase === '—' ? '未分阶段' : meta.phase}</span>`
    —— 三分支：① 结构表命中 → 五档 `stage`；② 结构表缺失且 `phase === '—'` → 「未分阶段」；③ 其余 → 旧三档 `phase`。
  - `courses.ts:300` 注释自述：`phase` 已降为 legacy，「P0/P1/P2 无读方…仅 '—' 仍被两处消费——
    ① DOMAIN_COUNT 过滤 ② `c/[slug].astro:61` 兜底 chip」。
  - **captain 提示的硬依赖（本轮已回源码确认，并**就地更正**了后果描述）**：`site/tools/check-counters.mjs:127`
    `const entries = [...arr.matchAll(/slug: '([^']*)', domain: '([^']*)', phase: '([^']*)'/g)]`
    —— 该正则要求**三个字段按此顺序、紧邻出现**。删掉 `phase` 字段 ⇒ `matchAll` 返回空 ⇒ `entries.length` 由 **18 → 0**
    ⇒ `act.cards = 0` / `act.coursePages = 0` / `act.domains = 0` / `act.courseSlugs = []`
    ⇒ **多条判据同时失配**（并让「站点 html 三桶互斥且穷尽」失败）。
    ⚠️ **不是** `hardError`（`:282` 的 `hardError` 分支只由「找不到 `export const COURSES` 边界」这类前置条件触发）——
    这一点与 captain 的措辞不同，本组以**亲自复现**为准（复现命令见 F3-1 第 3 点，输出「原文 18 | 删 phase 后 0」）。
    无论哪种失败形态，**实践结论一致**：门禁会红，必须在删 `phase` 之前改解析。
  - 本轮实测该正则的**紧邻性**：`courses.ts:50` 是 `slug: 'harness-from-scratch', domain: '从零写 harness', phase: 'P0', status: '✅ 完成',` ——
    `slug`/`domain`/`phase` 在同一行且紧邻，正则成立；若只删 `phase`，正则失配（已复核）。
- **具体改法（两处必须**同批**改，否则门禁失效）**：
  1. **`check-counters.mjs:127` 改为分段解析**（这是**前置**，属批次 A 的门禁扩展，本组只登记契约）：
     ```js
     // 形式组 4（④-6）+ 批次 A 门禁扩展：字段独立锚点，避免 phase 删除后整条正则失配。
     const entries = [...arr.matchAll(/slug: '([^']*)'[\s\S]*?domain: '([^']*)'/g)]
       .map((m) => ({ slug: m[1], domain: m[2] }));
     ```
     ⚠️ 但用 `[\s\S]*?` 会让 `slug` 与 `domain` 跨条目匹配（`slug` 是数组里唯一键，故可行但仍需 `entries.length === 17` 的断言兜底）。
     更稳的写法是**按对象切分**：先按 `{` … `}` 切条目，再在每条内独立匹配 `slug:`/`domain:`/`status:`。
     ⇒ 本组推荐后者，并把 `entries.length !== 17` 写成显式 `hardError`（fail-loud，而不是静默 0）。
  2. **`c/[slug].astro:61` 的兜底分支**：在 `phase` 被删后，表达式里的 `meta.phase` 会变成 `undefined` ⇒
     `undefined === '—'` 为 `false` ⇒ 走到第三分支渲染 `undefined`（**渲染出空 chip 或字面 "undefined"**）。
     ⇒ 改为**不依赖 `phase`** 的写法：
     ```astro
     <span class="chip">{structure ? structure.stage : '未分阶段'}</span>
     ```
     理由：`structure` 缺失 = 该笔记不在 `COURSE_STRUCTURE`。**本轮已核** `courses.ts:308-320`：
     `courseMeta(slug)` 对未知 slug 返回 `{ ...DEFAULT_META, slug }`，而 `DEFAULT_META.phase = '—'`
     —— ⇒ 兜底分支（`meta.phase === '—'` → 「未分阶段」）**确实可达**（未来新增一篇不在结构表里的笔记时命中），
     不是死代码。删 `phase` 时**必须同时**处理 `DEFAULT_META`（`courses.ts:310`）与 `HORIZONTAL_PHASE` 哨兵
     （`courses.ts:278` 的 `DOMAIN_COUNT` 过滤用 `c.phase !== HORIZONTAL_PHASE`）——那属批次 A，
     本条只要求「课程页 chip 不再读 `phase`」，从而砍掉三个消费点中的**一个**。
  3. **两处的先后顺序（不可颠倒）**：① 先改 `check-counters.mjs` 的解析（保持 12 条判据全绿）；
     ② 再改 `c/[slug].astro:61`；③ 最后才删 `courses.ts` 的 `phase` 字段（那一步属批次 A）。
     若先删 `phase`，中间态下门禁红、页面 chip 空 ⇒ 违反 00-plan-scope §3 的「可独立执行的顺序」。
- **派生还是手工**：**手工**（3 处联动改）。**派生方向**：`phase` 字段删除后，`DOMAIN_COUNT` 的过滤
  （`courses.ts:278` 用 `c.phase !== HORIZONTAL_PHASE`）也会受影响 ⇒ 那属批次 A，本组只负责**登记耦合**。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. **耦合本身可复现**（改之前必须先跑一次拿到基线）：
       ```bash
       cd /home/ubuntu/app/learn-agent-harness && node -e "
       const fs=require('fs');const ts=fs.readFileSync('site/src/data/courses.ts','utf8');
       const a=ts.indexOf('export const COURSES'),b=ts.indexOf('\n];',a);const arr=ts.slice(a,b);
       console.log('三字段紧邻正则命中:',[...arr.matchAll(/slug: '([^']*)', domain: '([^']*)', phase: '([^']*)'/g)].length);
       const stripped=arr.replace(/, phase: '[^']*'/g,'');
       console.log('模拟删除 phase 后命中:',[...stripped.matchAll(/slug: '([^']*)', domain: '([^']*)', phase: '([^']*)'/g)].length);
       "`
       期望：`17` 与 **`0`** ⇒ **这就是「删 phase 会让门禁退化」的可重跑证据**（captain 提示已被复现）。
    2. 改完后：`node site/tools/check-counters.mjs; echo EXIT=$?` → `EXIT=0`，且判据条数**不减少**（当前 12）。
    3. 改完后（在 `phase` 仍存在时）再跑一次第 1 条的 stripped 模拟 ⇒ 期望新解析在 stripped 文本上**仍得 17**
       （即新解析确实不依赖 `phase`）。
    4. `grep -c 'meta.phase' site/src/pages/\[slug\].astro` → 期望 **0**；`grep -rn 'meta.phase' site/src/pages/` → 期望 **0**。
    5. `grep -c 'phase' site/src/data/courses.ts` 的变化**只由批次 A 决定**，本组不改。
  - **必须留浏览器目检**：
    ① 17 个课程页的 meta 条第 3 个 chip 是否**全部**显示五档 `P0`–`P4`（改后不应有「未分阶段」出现）——
       逐页扫 17 次成本高，**建议只目检 2 页 + 用 `grep` 确认逻辑**；
    ② `/c/llm-timeline/` 与 `/c/industry-2026/`（`isHorizontal: true`）的 chip 是否仍正确（它们结构表命中，走第一分支）。
- **回滚点**：`check-counters.mjs`（一段解析）与 `c/[slug].astro`（一行）——**必须同提交**，回滚也要同提交。
- **依赖**：**批次 A 的 P1**（是否删 `phase`）+ **批次 A 的门禁扩展**（`check-counters.mjs:127` 的正则）；
  与 **F3-1 第 3 点**同源（生成器也要读 `courses.ts` 的字段）⇒ **三处（生成器 / 门禁 / 课程页 chip）必须共享同一套解析策略**（见 D10）。
- **工作量**：**S**（两处小改）+ **M（与批次 A 的协调成本）**。
- **风险**：① **顺序颠倒**（先删 `phase`）⇒ 门禁红 + chip 渲染 `undefined`（改法第 3 点写死顺序）；
  ② 三段式解析写成跨条目贪婪匹配，把 17 条解析成 1 条 ⇒ 必须保留 `entries.length` 的显式断言；
  ③ `structure` 为 falsy 时的兜底文案「未分阶段」在 17 门课**永远不该出现** ⇒ 若目检中出现，说明
     `COURSE_STRUCTURE` 与 `notes/` 不同步（那是新缺陷，须登记）。

### F4-7｜`works.astro:411` 的 `⚠️` 警示层级

- **id**：F4-7｜**来源**：④-19（t4 转交 1）
- **目标**：把「⚠️ 本值不是『有 `npm run demo` 的目录数』」这句从正文段里提出来，层级上成为**明确的警示块**。
- **现状证据（file:line）**：
  - `works.astro:404-415` `<section>` → `:405` `<h2>口径说明</h2>` → `:406-414` 单个 `<p class="work-soft">`，
    其中 `:411-413` 是那句 `⚠️` 警示（`<strong>不是</strong>` + 括号里的实测 10 个目录）。
  - 样式：`.work-soft` 在 `works.astro:429`（页面级）——`{ color: var(--text-soft); font-size: 0.9rem; }`，
    **与同段前半句同一个类** ⇒ 警示与口径正文**逐字同权**。
  - 这句的内容是 **P10 的关联项**（「6/10/11/17 四个数指同一批目录」）——本组只改**层级**，不改措辞与数字。
- **具体改法（文件・行区间）**：
  1. `works.astro:411-413` 从 `<p class="work-soft">` 里**拆出**，成为独立块：
     ```astro
     <p class="work-caveat">
       ⚠️ 本值<strong>不是</strong>「有 <code>npm run demo</code> 的目录数」——实测为 10（另含 model-basics-demo /
       flywheel-demo / api-demo / my-agent / memory-redteam；而 <code>rag-demo</code> 的入口是
       <code>demo:eval</code>，反而不在那 10 个里）。口径见 <code>notes/knowledge-map.md</code> 计数口径块。
     </p>
     ```
     原 `<p class="work-soft">` 保留前半句（`本页共 {WORK_COUNT} 个具名作品目录…不计入 {WORK_COUNT}`）。
  2. 样式：`works.astro` 的 `<style>`（`:418` 起）里，紧跟 `:429` 的 `.work-note` 之后加：
     ```css
     /* 形式组 4（④-19）：口径警示与口径正文分级（原与 .work-soft 同权，⚠️ 混在正文里） */
     .work-caveat {
       margin: 10px 0 0; padding: 8px 12px;
       background: var(--bg-soft); border-left: 3px solid var(--deny);
       border-radius: 0 10px 10px 0; font-size: 0.88rem; color: var(--text-soft);
     }
     ```
     ✅ **变量已核（就地更正初稿的 `var(--warn, #bb8009)`）**：本轮实测 `global.css` **没有** `--warn` 变量
     （`grep -n -- '--warn' site/src/styles/global.css` → 0 命中）；可用的是 `--ok: #1a7f37`（`:25`）、
     `--deny: #cf222e`（`:31`）、`--accent: #0f766e`（`:22`），且明暗两套主题都各自定义（`:49/52/58`）。
     ⇒ 上面那条**直接用 `var(--deny)`**（警示语义 + 双主题都有定义）；
     **不得**写 `var(--warn, …)` —— 那会让整条 `border-left` 静默失效（正是纪律 #9 的形态）。
  3. 与 F1-5 的关系：本条**不改任何数字**（6 / 10 的判定归内容轮 P10）。
- **派生还是手工**：**手工**（版式拆分）。数字 `10` 是手抄常量（`works.astro:412`），
  **是否派生归批次 A 的 P10**（派生需要真源「有 `npm run demo` 的目录数」；本组不引入）。
- **验收命令（可重跑）**：
  - 可机器验证：
    1. `grep -c 'work-caveat' site/src/pages/works.astro` → 期望 **≥2**（输出 + CSS）。
    2. `grep -c '⚠️' site/src/pages/works.astro` → 期望 **1**（仍在，只是换了容器）。
    3. `sed -n '405,420p' site/src/pages/works.astro | grep -c 'work-soft'` → 期望 **1**（前半句仍用它）。
    4. 第二轮类集合比对：`.work-caveat` 不得进差集。
    5. `node site/tools/check-counters.mjs` → exit 0（本条不改数字）。
  - **必须留浏览器目检**：
    ① 警示块的左侧色条颜色是否在本站既有色板内（`--warn` 是否存在见上）；
    ② 与上方 `.work` 卡片区的间距（`works.astro` 的 section 间距规则）；
    ③ 深色主题下的底色与字色对比。
- **回滚点**：`works.astro` 单文件（拆段 + 一条 CSS）。
- **依赖**：与 F1-5 / 批次 A 的 **P10** 交叉（不改数字）。
- **工作量**：**S**。
- **风险**：① 用了不存在的 CSS 变量 ⇒ 该规则**静默失效**（正是纪律 #9 的形态）⇒ 已要求先 `grep` 变量名；
  ② 拆分后两个 `<p>` 之间出现双倍间距 ⇒ 目检项②。

### F4-8｜`mcp.md` S4 双 10 项清单表的窄屏呈现（**主责在内容轮 P6**）

- **id**：F4-8｜**来源**：④-3（t1 转交 3）；主责见 `analysis/plan/02-content-layer.md` 的 **P6 拆节**
- **目标**：只登记**呈现侧约束**，供 P6 拆节时一并满足；**本组不另立拆节设计**。
- **现状证据（file:line）**：
  - `notes/mcp.md:7` 的用法行自述「S4 是安全全景（两套 OWASP 清单 + 防御分层）」。
  - `notes/mcp.md` 的 mermaid 块数 **5**（实测，全仓最多）；S4 区间的表结构本轮**未逐行读**（见 §依据不足项）。
  - 呈现层事实（已核）：`.markdown table { display: block; overflow-x: auto; max-width: 100% }`（`global.css:512-515`）
    ⇒ **宽表在窄屏是「表内横滚」**，不是折行；`.markdown p, .markdown li { max-width: 40em }`（`:1858-1860`）不约束表。
- **具体改法（呈现侧 3 条约束，交 P6 采纳）**：
  1. 拆节后每节的表**行数应 ≤ 10**（`global.css:515` 的横滚在 375px 下对超过 ~6 列的宽表会很难用；
     行数不影响横滚，**列数才是关键**）⇒ **真正的约束是列数**：S4 的 OWASP 清单表若超过 4 列，
     建议拆成「条目名 + 一句话」两列 + 逐条小标题（这也正是 P6「拆节」的方向）。
  2. 若必须保留宽表：**在表前加一句 `表可左右滑动`** 的提示（无 JS 时也可见），否则读者在窄屏看不到被截断的列。
  3. 不使用 HTML `<details>` 折叠表行（会破坏 GFM 表格语义与 `extractToc` 之外的可搜索性）。
- **派生还是手工**：手工（约束文本）。
- **验收命令（可重跑）**：
  - 可机器验证：**归 P6**；本组给出的判据是「`grep -c '^## S4' notes/mcp.md` = 1 且 S4 小节内 `|` 表行数 ≤ N（N 由 P6 定）」。
  - **必须留浏览器目检**：`/c/mcp/` 在 375px 下 S4 区域的**表内横滚可用性**（能否看到最右列的数值）——**留浏览器目检**。
- **回滚点**：无（本组不改）。
- **依赖**：**内容轮 P6**。
- **工作量**：**S**（本组零实现）/ P6 侧为 M。
- **风险**：① 本组若自行拆节 ⇒ **与 P6 撞车**（故明确不立）；② 用折叠绕过宽表 ⇒ 破坏可检索性。

---

## 附 A · 已登记但不落在站点渲染面的 3 条（转内容层 / 归 02）

以下 3 条在 08 ④ 里已登记，但**读者看到的不是站点页面**而是仓库里的 markdown / README ⇒ 不在本文件职责内，
在此**显式移交**，避免 ④ 的 25 条出现「谁都没接」的空白：

| ④ 序号 | 对象 | 移交去向 | 本组说明 |
|---|---|---|---|
| 11 | `notes/observability.md:79`（口径声明 + 旧属性名提醒 + 复跑判据挤在一段） | `analysis/plan/02-content-layer.md`（内容层的段落结构） | 它渲染进 `/c/observability/`，但那一段的**层级问题主要在笔记文本本身**；形式侧**无可做**（`global.css` 对 `.markdown p` 一视同仁，无法只对某段分级而不改笔记）。若 02 决定拆段，则**不需要**任何样式改动。 |
| 12 | `memory-redteam/README.md:36-40`（三个「当前状态」数字块是裸代码块，未与 `:24/:25` 判据行视觉配对） | 内容层（`README.md` 不在站点渲染范围内：`site/src/content/config.ts:12-15` 的 `base: '../notes'` 只收 `notes/`） | **形式侧零改动**。若要在站点呈现，需要先有「README 上站」的产品决策——**本轮不建议**（会新增一条内容管线）。 |
| 14 | `rag-demo/README.md:58-66`（复测值表 + 旧值已废说明 + §13 回指三块叠加、表仅 3 行） | 内容层 | 同上：`rag-demo/README.md` **不渲染到站点**（`rag-demo` 的评测数字已在 `/works/` 由 `parseRagStats` 派生，见 `works.astro:13` 注释与 `index.astro:29-31`）。⇒ 形式侧零改动；**注意**：若 02 改了 `notes/rag.md` §13 的数字，`/works/` 与首页会**自动跟随**（派生），这正是纪律 #5 的正例。 |

> **同时登记一处 ④ 的遗漏**：④-3（`mcp.md` S4 窄屏折叠）已由本文件 F4-8 以「呈现侧约束」形式接住，主责在 02 的 **P6 拆节**。

---

## 组间依赖与建议执行顺序（本文件范围内的可执行顺序）

```
组 0（F0-0 诊断+清理+重建）           ← 唯一先决：没有 HTML，一切目检为空
   ├─ F0-1 /nav 进回归              ← 与 F0-0 同批（同文件 visual-check.mjs）
   ├─ F0-2 selftest 落盘约定        ← 与 F0-1 同行不重叠
   ├─ F0-3 mermaid-check 可移植化   ← 与 F0-0 弱相关
   └─ F0-4 类集合门禁               ← 需批次 A 的门禁扩展同批（同改 build.sh 插入点）
组 1（F1-1…F1-5）                    ← 只依赖 组 0 的目检能力
组 2（F2-1…F2-5）                    ← 同页（learn.astro）四条：F2-1/F2-2/F2-3 一起改一次目检
组 3（F3-1…F3-3）                    ← 契约文本，无独立提交；随 A2 落地生效
组 4（F4-1…F4-8）                    ← F4-6 必须在批次 A 删 phase 之前完成（顺序见 F4-6 改法第 3 点）
```

**跨批次硬顺序（3 条，违反即产生中间态故障）**：

1. **`check-counters.mjs:127` 的解析改为分段** → 再改 `c/[slug].astro:61` → **最后**才删 `courses.ts` 的 `phase`（F4-6）。
2. **A2 的生成器模板**必须先吸收 **F3-1 的 6 条契约**（方向 `graph TD`、标签用 `domain`、四色 classDef、
   `agent-harness` 节点、INTERVIEW 移出、`todo` 处置）→ 再产出第一版受保护区间文本（F3-1/F3-3）。
3. **F0-4 的类集合门禁**与**批次 A 的门禁扩展**同批落地（都改 `site/build.sh` 的同一段插入点），
   且必须包含**负路径自证**（F0-4 验收第 5 条），否则门禁可能恒真。

---

## 未决决策点（需用户拍板）

> 00-plan-scope §6 要求：**不许替用户决定**。以下每条给出「选项 + 影响 + 本文件的倾向」，但**最终由用户定**。

| id | 决策点 | 选项 | 影响 | 本文件倾向 |
|---|---|---|---|---|
| **D1** | 死选择器清零方式（F0-4） | (a) 直接删 `.lf-count-note`（`learn.astro:341`）；(b) 把 `learn.astro:271/276/281` 的 `lw-count-note` 改成 `lf-count-note`（保留内联定义、删 `:383` 的重复） | (a) 少一条规则、零风险；(b) 统一前缀但**同一页同时存在 `lw-`/`lf-` 两族命名**（`lw-` 还有 `.lw-title`/`.lw-prereqs`/`.lw-label` 在用）⇒ (b) 会让命名更乱 | **(a)** |
| **D2** | 术语定义放哪（F1-1/F1-2） | (a) 各自页内 `<details>`；(b) 抽 `site/src/data/glossary.ts` 作真源 + 两处渲染 | (a) 两页各一份定义（**索引/样本/agent** 与 **SSE/BM25/journal…** 基本不重叠，重复度低）；(b) 单一真源、与批次 B 的 **P7 术语表**天然合并，但要新建文件 + 决定是否上站成独立页 | **(b)**（与 P7 合并，避免第二次搬迁） |
| **D3** | `mermaid-check` 的 Chromium 解析（F0-3） | (a) 抽 `viz/chrome.mjs` 候选表（复用 `render.mjs:58-66`）；(b) 只读 `CHROME_PATH` 环境变量；(c) 改用 playwright 自身解析（`PLAYWRIGHT_BROWSERS_PATH`） | (a) 三处同源；(b) 最简但默认路径仍需写死一处；(c) 最正确但**需实测**本机 playwright-core 的解析行为 | **(a)** |
| **D4** | 404 页是否 import `WORK_COUNT`（F1-3） | (a) import `courses.ts`（消掉手抄 6）；(b) 保留 `6` 并把该副本登记进 `check-counters.mjs` 的副本核对清单（批次 A） | (a) 破 `404.astro:9-10` 注释里的自述「不 import site/src/data」；(b) 与批次 A 的 P10「映射表补登」一致 | **(b)**（尊重既有注释边界，且与 P10 合并更省事） |
| **D5** | `/nav/` 版面分组范围（F1-4） | (a) 全做（年代分组 + 跳转条 + `note` 折叠 + `.so-*` 搬迁）；(b) 只做跳转条 + `note` 折叠 | (a) 扫读最好，但要动 `/learn/` 的样式归属（层叠风险）+ 目检 4 项 × 3 视口；(b) 收益 60%、风险 20% | **(b) 先行**，(a) 视 D-note 的收益观测决定 |
| **D6** | 是否在段头印难度（F2-2） | (a) 不印（只保留 `STAGE_DESC`）；(b) 印区间「难度 4–5」；(c) 只印跃变提示（「本段后两门难度明显上升」——**有实证的表述**） | 01 §2 的难度分**权重不可复现**（自述置信度中）⇒ (b) 把主观序数印成对外口径；(c) 只印**可复核的事实**（同一段内两门的相对跃迁，见 `01:544` 的 P0 内部跨 1→4） | **(c)**，若用户要 (b) 则必须同时标「估计」 |
| **D7** | `learn.astro:264-286` 口径说明的归属（F2-3） | (a) capstone 的子区块（`phase-sub`、标题降 `h3`）；(b) 独立尾注 section（补 `:196` 的闭合，`id="caliber"`） | (b) 让 `id="capstone"` 的锚点范围**收窄**（首页链接不再滚过口径段）、HTML 结构干净；(a) 保留「口径是 capstone 的注」这层语义 | **(b)** |
| **D8** | `/map` 口径块是否真折叠（F2-5） | (a) 只加跳转条；(b) 真折叠（需 remark 插件或渲染后 HTML 包装） | (b) 首屏更短，但要动渲染产物（风险面大、打印会丢）；(a) 零风险 | **(a)** |
| **D9** | 图的 4 色与 `todo`（F3-1/F3-3） | (a) 保留 4 个 classDef（`todo` 空置 + 注明）；(b) 删 `todo` 只留 3 色；(c) 另加第五色表达 `isHorizontal` | 见 F3-1 第 2 点与 F3-3 第 2 点 | **(a) + (c)** |
| **D10** | `courses.ts` 字段解析策略的统一（F3-1/F4-6） | (a) 三处（`check-counters.mjs` / `gen-dep-graph.mjs` / 将来任何解析器）**各自**写正则在 `01` 里统一约定；(b) 抽一个共享解析模块（如 `site/tools/parse-courses.mjs`）供两处 import | (b) 一份算法、与 01 `:1168` 的「倾向 (b)」一致（01 已就「共享解析器」表态倾向 (b)）；但多一个文件、且 `check-counters.mjs` 的设计约束是「不 import TS」（**纯 JS 模块可满足**） | **(b)**（与 01 的倾向一致，避免两份算法漂移） |
| **D11** | `/map` 分工说明的落位（F3-2） | (a) 与 `DomainMap` 共用 `slot="before"`（需实测 Astro 多元素具名 slot）；(b) 放进默认 slot 正文之前 | (a) 位置更贴（紧上方卡片视图）；(b) 写法最稳 | **(b) 除非实测 (a) 生效** |
| **D12** | 图是否按阶段 `subgraph` 聚类（F3-3） | (a) 纯派生不聚类；(b) 5 个 `subgraph` | (b) 阶段一眼可见，但跨阶段边变长交叉、窄屏更易溢出、mermaid v12 + `strict` 兼容性**未验证** | **(a)** |
| **D13** | 课程页 `>` 元信息块的实现（F4-1） | (a) `remark` 插件（进 `astro.config.mjs`，全站生效，无 JS 也有分级）；(b) `c/[slug].astro` 客户端脚本（零管线风险，无 JS 无分级） | (a) 收益完整但要动全局管线（`utils/md.ts:30-33` 已记录该文件的敏感度）；(b) 稳但退化 | **(b) 先行**，观察后再决定是否上 (a) |
| **D14** | 「本图缺图注」提示是否立即打开（F4-2） | (a) 立即（内容轮补齐前，62 张图全显示缺注）；(b) 等内容轮补齐后再打开 | (a) 把缺失显式化（纪律 #2 手法），但**期间观感变差**；(b) 观感优先 | **(b) 后置**，先只改样式 |
| **D15** | details 页做 TOC + 折叠 还是 加两栏正文（F4-4） | (a) TOC + 可折叠；(b) TOC + 两栏对照；(c) 只加 TOC | (b) 会违反 `.markdown p { max-width: 40em }` 的可读性约束；(c) 8 篇立刻与课程页同构、零新 CSS | **(a)**，且**「本地映射」节不得默认收起**（P4 相关） |
| **D16** | 是否给 details 详情页加几何回归（F4-4） | (a) 把 `details/01-context-rot/` 加进 `PAGES`（与 F0-1 同批）；(b) 不加 | 现状：详情页**没有任何几何回归**（`visual-check.mjs:69` 断的是列表页） | **(a)** |
| **D17** | details 缺失字段是否显式化（F4-5） | (a) 不显式（缺失即不渲染）；(b) 在 meta 条列出缺失字段（与 P4 复核交叉） | (b) 会把 P4 的问题**暴露到读者面前**（可能是好事，也可能加剧不信任） | **(a)**，把暴露问题留给 P4 的正式交付 |

---

## 依据不足项（不许当事实）

> 00-plan-scope §6 要求：**不许拿未复核的 medium 当事实**。以下每项都注明「为什么不足」与「怎么补」。

1. **`INTERVIEW` 汇聚边的条数三个数字不一致（4 / 11 / 12）**。
   本组亲数：`grep -c -- '--> INTERVIEW' notes/knowledge-map.md` → **8**（实线）、`grep -cE '\-\.\->' → 4`（虚线），**合计 12**。
   `01-source-layer.md:239` 写「4 条虚线」、`:327` 写「11 条中指向 INTERVIEW 的部分」。
   ⇒ **本组采用 12（8 实 + 4 虚）**，但**不宣称 01 错**（它的「11」可能指旧版节点行数或笔误）。
   **补齐方式**：A2 落地时由生成器**实测输出**这个数并写进图区的自述句；在那之前**任何依赖该数的判据都不得写成硬断言**。
2. **`notes/*.md` 里「`%%` 注释是否会被 mermaid 渲染成可见文本」未实测**（F4-2）。
   本轮未跑 mermaid（需 dist + 浏览器；且 62 张图全测成本高）。⇒ 图注方案落地前**必须**先用一张图试。
3. **`learn.astro:113-117` 的段头难度区间（F2-2 的 `STAGE_DIFFICULTY` 示例值）未逐课复核**。
   本文件给出的 `P0 1–4 / P1 4–5 / …` 是**示例占位**，不是实测值；`01-pedagogy.md §2` 的逐课表本轮**未逐行读**
   （只读了 `:544-548` 的均值与自述）。⇒ 实施前必须把 §2 的逐课表拉出来逐课核，**不许照抄本文示例**。
4. **`notes/knowledge-map.md` 的「计数口径」块实测 10614 B，与 ④-10 的「7.7 KB」不符**。
   差异原因未定位（可能是口径不同、或统计时点不同、或 7.7 KB 指别的块）。⇒ 本文件一律用实测 10614 B；
   若要对外引用「口径块多大」，**必须**先固定一条命令（本文件给了 `awk` 版本）。
5. **`DomainMap.astro`（120 行）未通读**（F3-2）。它与 mermaid 图的分工只依据 `map.astro:3-11` 的注释自述，
   **未验证**它是否也表达了依赖关系（若它其实有连线，F3-2 的「两张东西表达同一件事」前提需要重写）。
6. **`site/src/data/course-structure.ts:386` 的注释块与 `courses.ts:34` 的 `phase` 现状未逐行读完**
   （只核了被引用与被解析的字段）。⇒ 删 `phase` 的完整影响面（F4-6）可能还有**第三处消费点**未被本组发现；
   验收时应以 `grep -rn 'phase' site/src/` 的完整清单为准。
7. **`details/index.astro`（201 行）未通读**：`:70/93/117` 三处 `kind-${kind}` 已核，但
   `KIND_LABEL` 是否在该文件**重复定义**（与 `details/[slug].astro:22-27` 的第二份）本轮**未核**——
   若是两份，则属「第二真源」，应在 F4-5 时一并收口。
8. **`404.astro:46` 的「顶栏八个导航项」未核对**（`Header.astro:4-12` 的数组长度本轮未数）。
   ④ 也未登记它。⇒ 本文件只登记为疑点（F1-3 第 3 点），**不判定对错**。
9. **`works.astro` 的 `work-soft`/`work-note` 家族命名未全貌核对**（F4-7）：本轮只核了 `:429` 的 `.work-note` 与
   目标行的 `.work-soft`；`works.astro` 460 行里的其余 `work-*` 类未逐一读。
10. **`visual-check.mjs` 的 `mustHave` 加固（F0-1 改法第 2 点）未验证可行性**：
    本轮只读了 `checkOne()` 的签名（`:102`）与 `d.failures` 通道的存在，**未读完全部 140 行**（`：102-240`）。
    ⇒ 若该通道不支持「选择器计数」类失败信息，加固方案需要改设计。
11. **`astro` 的具名 slot 是否接受多个元素（F3-2 / D11）未实测**：本轮不能跑构建。
    依据是 Astro 文档语义（未取一手源）；⇒ 实施时必须先试。
12. **`mermaid` v12.1.0 + `securityLevel:'strict'` 下 `subgraph` 的兼容性未验证**（F3-3 / D12）。
13. **19 篇笔记开头的 `>` 块中，哪些属于「正文中段引用」未逐篇清点**（F4-1 的主要风险）。
    本文件只统计了**开头 8 行内**的 `>` 行数（分布 6/5×4/4×8/3×2/2×4）。
14. **`h1` 之后是否总紧跟 `>` 块**未验证（F4-1 的插件若要按「h1 后第一个 h2 前」定位，需要这个前提）。
    反例已知：`notes/rag.md:1-8` 是 `# h1` → 空行 → `>`×4 → `---` → `## `，形态上成立；但**未逐篇确认**。
15. **`site/dist` 的 89 个文件是否与某次 `--check` 通过的构建共享 `node_modules`/`.astro` 快照**未验证
    （F0-0 的诊断只到「构建中途夭折」，未定位终止者）。
16. **本文件所有「期望 = 33」的判据都沿用 `verify.yml` 的口径**（`Build sanity` 的等值断言 33）——
    该数字的权威来源是 **CI run 日志**，而 **GitHub Actions 日志正文本轮取不到**（`08-synthesis.md:321` 记载 `curl …/logs` → 403）。
    ⇒ 「33」在本机**不可独立复验**（除跑一次构建）；引用时须带出处（`verify.yml` 注释行 + `notes/knowledge-map.md` 计数口径块）。

---

## 边界合规自查（本轮）

- **只新建文件**：本文件是 `analysis/plan/03-form-layer.md`，**唯一**产物。
  `git status --porcelain` 当前输出：`?? analysis/` 与 4 个**既有**未跟踪 md（`notes-restructure-plan.md` /
  `restructure-review-content.md` / `restructure-review-structure.md` / `restructure-verify.md`，均在本轮开始前就存在）。
  **无任何 `M`（已跟踪文件被修改）条目**。
- **未跑**：`astro build`、`site/tools/visual-check.mjs`、`viz/mermaid-check.mjs`、
  以及任何会写 `site/tools/out/`、`trajectories/`、`.state/` 的脚本。全部命令为
  `find`/`stat`/`grep`/`sed`/`awk`/`wc`/`ls`/`node -e`（**只读复算**）。
- **未改**：`site/`、`notes/`、`README.md`、`handoff.md`、各 demo、`analysis/content/**`。
- **文献更正**：本文件对 ④ 的三处行号/事实做了就地更正并注明依据（组 2 开头「行号修正」、F0-3 的 `:9→:10`、
  F2-3 的「缩进错位 → 实为 section 未闭合」、F4-2 的「无图号 → 实为有图号缺图注」、F3-3 的「未来风险 → 现存失真」、
  **F4-6/F3-1 的「hardError → 实测为多条判据同时失配」**、F4-7 的 `--warn` 变量不存在）。
- **未采用被证伪项**：`accuracy-F1`（k1 双重口径）、`accuracy-F3`（RRF 1/70）、`evidence-F2`（OOM 无日志）
  三条**未作为任何条目的依据**；凡涉及真值一律用 07 的修正值（依赖图 **8/15**、`details` 矛盾页 **04/08/06**、`industry-2026.md:20`）。
