# `site/tools/` —— 构建/预览环境的门禁与回归脚本

> 权威值只在**脚本本身**（`visual-check.mjs` 的 `PAGES`、`check-classes.mjs` 的扫描面）；
> 本文档是它们的**镜像**，不是第二份真源。改了脚本请同批改这里（反之亦然）。

## 1. 脚本一览

| 脚本 | 作用 | 读什么 | **写什么（写盘约定）** | 退出码 |
|---|---|---|---|---|
| `check-counters.mjs` | 口径一致性门禁（`notes/knowledge-map.md` 的「计数口径」块 vs 实数） | 源码 + 文件系统（**不读 dist**） | **不写任何文件**（纯只读） | 0 一致 / 1 不一致或解析失败 |
| `check-classes.mjs`（G0-5 新增） | 类集合门禁：`CSS 定义的类集合 − 页面实际输出的类集合` 差集必须为 0 | **`site/src/**` 源码**（定义侧 = `.css` 全文 + `.astro` 内联 `<style>`；输出侧 = 去掉 `<style>` 后的 `site/src` + `notes/**` + `site/public/**`）。**不读 `site/dist`** | **不写任何文件**（`--self-test` / `--replay-baseline` 只在内存里注入，不改仓库文件） | 0 通过 / 1 差集非 0、白名单失效、输入面为空、或负路径抓到注入项（`--self-test` 抓到 = 按设计红） / 2 `--self-test` 未抓到注入项（断言器过弱） |
| `visual-check.mjs` 主流程 | 33 页中的 10 条清单 × 3 视口（375/768/1280）的结构 + 几何断言（无横向溢出 / 关键元素可见 / 无 console error / 搜索入口交互） | 站点 HTTP（`--base`），需要 headless Chromium | **写 `--out`（默认 `site/tools/out/`）**：`report.json` + 每页截图。这是 **CI artifact 契约**（`verify.yml:140/142` 传 `--out tools/out`，artifact 上传该目录）；根 `.gitignore:25` 已忽略该目录 ⇒ 不污染工作区索引 | 0 全部通过 / 1 任一断言失败、故障未被检出、运行错误 |
| `visual-check.mjs --selftest` | 本机预检（用自带 fixture 验证断言器「好页不冤枉 + 坏页必被抓」，**不依赖站点构建**） | `site/tools/fixtures/*.html` | **写 `$TMPDIR/visual-check-selftest/`**（默认；显式 `--out` 时写该目录）——**不写工作区**。G0-3 的收敛点：此前这里默认写 `site/tools/out/selftest/`，让「本机预检」变成了工作区写盘（`git status` 会多出目录） | 0 全部预期命中 / 1 未命中或运行错误 |

**没有隐式写盘**：只有 `visual-check.mjs` 会写盘，且两条路径的落点都在上表里写死；
`check-counters.mjs` / `check-classes.mjs` 全只读。

## 2. 三个视口与页面清单（`visual-check.mjs` 的 `PAGES` 派生）

- 视口：375（mobile，≤720px 收汉堡）/ 768（tablet）/ 1280（desktop）。
- 页面清单 **10 条**（`PAGES` 数组，`{ path:` 计数）⇒ **30 组合**：
  首页 / `learn/` / `works/` / `interview/` / `map/` / `details/` / `c/rag/` /
  **`nav/`（G0-2 新增，2026-10-14；此前是 33 页里唯一无几何回归的一页）** /
  **`details/01-context-rot/`（03-D16(a) 新增；此前详情页零几何覆盖）** / `404.html`。
- 页面清单**不应**成为第三份手抄副本：`verify.yml` 的关键页清单、README 的文案都是它的镜像。
- `nav/` 的 `mustHave = .cards .card`（`LLM_EVOLUTION` 派生的代际卡，数量稳定）；
  **不要**换成 `.nav-course-group`（5 个阶段数会变 ⇒ 假红）。

## 3. 浏览器解析（G0-4 / 03-D3(a)）

`viz/chrome.mjs` 是本仓 Chromium 的**唯一解析点**（`CHROME_PATH` 优先，其次 ms-playwright 的
`chromium-<rev>` 探测、`/usr/bin/google-chrome`、`/usr/bin/chromium`）。`viz/render.mjs`、
`viz/mermaid-check.mjs` 都改用它；`visual-check.mjs` 在「playwright 自带浏览器不可用」时回退到它。

- 本机实测：`npx playwright install chromium` **无法执行**（`EACCES: /home/ubuntu/.cache/ms-playwright/__dirlock`，
  该目录不可写）⇒ 本机 `--selftest` 走回退路径（`chromium-1234`，完整 chrome 而非 headless-shell）。
- fixture 服务器对 `/favicon.ico` 显式返回 `204`：真实站点的 `Base.astro` 有 `<link rel="icon">`（不请求该路径），
  而 fixture 页没有 ⇒ 完整 chrome 会请求并拿到 404、在 console 里留一条 error，把 good 页误判为失败。
  这是 fixture 服务器的缺陷而非页面缺陷，也与断言无关（实测：回退路径下 26 项会错 1 项）。

## 4. 常用命令（可重跑）

```bash
cd /home/ubuntu/app/learn-agent-harness
node site/tools/check-counters.mjs                       # 口径门禁
node site/tools/check-classes.mjs                        # 类集合门禁（差集必须 0）
node site/tools/check-classes.mjs --self-test            # 负路径自证：exit 1 = 断言器有效
node site/tools/check-classes.mjs --replay-baseline      # 复现 03 §0.2 基线 10/8/5/3（证明同源）
node site/tools/check-classes.mjs --input-dir=/tmp/empty # 输入面反例：必须 exit 1「输入面为空」
cd site && node tools/visual-check.mjs --selftest        # 断言器本机预检（写 $TMPDIR）
cd site && npm run build                                 # 构建（含两道门禁，fail fast）
cd site && npm run preview                               # 预览（目检用；本脚本不代验渲染）
cd .. && viz/mermaid-check.mjs                           # 逐页确认 mermaid 渲染成 <svg>
```

## 5. 边界诚实（不得用 exit 0 冒充页面正确）

上述脚本**只**断言结构与几何：无横向溢出、关键元素可见、无 console error、类集合无死选择器。
**视觉审美**（布局读得顺不顺、配色、图文排版）**仍留浏览器人工目检**——本目录的任何绿灯都不覆盖它，
也不得被当作它的替代证据。
