# t17 R7 评审报告：t16（W7 收口 t12 评审发现 F1/F2/F3/F4/F4b）

- 评审人：sdk-dev2（非 t16 实现者；t16 实现者 = evidence-dev2）
- 评审日期：2026-10-13
- 被评审任务：t16（kind=implementation，status=completed，提交 977a61f @ t5-visual-verify）
- **结论：PASS（无阻断发现）** —— t16 的 12 项 acceptance（契约编号 1-12）逐条独立复核成立。
- 评审原则：不接受实现者自述；每条给独立证据（file:line + 命令输出 + run 链接/SHA）。

## 0. 独立复跑/复核记录（评审时点 2026-10-13）

| # | 动作 | 结果 |
|---|---|---|
| 1 | `cd site && node tools/visual-check.mjs --selftest`（PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers） | **26/26 全命中，exit 0**（好页不被冤枉/溢出必被抓/缺标题必被抓/**搜索入口缺失必被抓**/运行时注入必被抓） |
| 2 | **评审人自建证伪实验**（非 t16 的 fixture）：构造 7 页 dist（/tmp/f3-dist，仅 home 删搜索入口，其余 6 页按各自选择器定制并保留入口）→ 起本地 http 服务 → 走**真实主跑路径** `node tools/visual-check.mjs --base http://127.0.0.1:8899/ --out /tmp/f3-out` | **home @375/768/1280 三视口全部失败「搜索入口缺失：真实页必须存在 [data-search-open]（可证伪性加固：回归删除入口该页必须失败）」，MAIN_EXIT=1**；含入口的 6 页无一出现搜索失败（其余失败项为自建页的课程 meta 栏/works 卡片数等构造噪声，与搜索断言无关） |
| 3 | `git diff 8879887..977a61f -- site/tools/visual-check.mjs`（t5 版→t16 版） | 仅新增 searchRequired 参数+失败分支、主跑两处传 `searchRequired:true`、fault 模式 `*_fault-*.png` 截图、selftest 加 2 组预期；**TOLERANCE=4 / VIEWPORTS(375/768/1280) / PAGES 7 页清单逐字节未变**（两版 grep 比对一致） |
| 4 | `git diff main..t5-visual-verify -- .github/workflows/deploy.yml` | **空（零 diff）** |
| 5 | gh 核实三个 run | 38282562346=**success**（绿基线）/ 38282852860=**failure**（注入负路径，按设计；日志「注入 overflow 已检出 scrollWidth 5000 vs clientWidth 375——断言器有效，作业按预期失败」）/ 38345995909=**success**，**headSha=977a61f（=t16 提交）**，日志「✅ 全部通过：21 页×视口（7 页 × 3 视口）」 |
| 6 | F4 依据三方独立复核 | ① `gh run view 38282562346 --log`：「dist HTML 文件数 = 31（下限 31 = 6 静态 + 17 课程页 + 8 专题页；构建产物不含 404.html）」② `test ! -e site/src/pages/404.astro` → 不存在；`find site/src/pages -name '*.astro'` = 6 静态文件（index/interview/learn/map/works/details-index）+ 2 动态路由（c/[slug]、details/[slug]）③ `curl https://blog.zero43.top/learn-agent-harness/404.html` → **HTTP 404** |
| 7 | 31 构成独立核算 | 静态 6 ✓；专题 details/ 源 .md = 8 ✓（01..08）；课程页 = 18 slug − whiteboard（在 COURSES 但无 notes 文件、无 /c/ 路由，c/[slug].astro:42-44 自注）= **17** ✓；6+17+8=31 ✓（冻结口径「17 课程页/18 课程卡」自洽） |
| 8 | 语料/越界 | `git status`：t16 足迹 = 已提交 4 文件（visual-check.mjs / good.html / bad-missing-search.html / verify.yml）+ 工作树 4 文档（knowledge-map / README / audit×2），**全部在 inScope+fixture 说明内**；notes/rag.md 零 diff；agent-harness.md/handoff.md 的改动归属 t4/t6（非 t16）；courses.ts 工作树 diff 仅 t6 的 1 行限定（+行总数=1） |
| 9 | 分支纪律 | 当前分支 t5-visual-verify（HEAD=977a61f）；main=origin/main=ca682b6 **未动**；PR #1 **OPEN**（head=977a61f，base=main）；分支领先 main 7 个提交（t5×6+t16×1），未合并 |

## 1. 逐项 acceptance 核对（t16 契约 12 条）

1. **F4 口径 32→31 + 构成 + 显式无 404.html** — ✅ knowledge-map.md:17：「**站点 html 31**（2026-10-13 就地更正：原值 32 误把不存在的 404.html 算进加数）= 6 静态页（index / learn / works / map / interview / details）+ 17 课程页 + 8 专题页（details/）；**无 404.html——未实现自定义 404 页，GitHub Pages 使用其默认 404 页**」。无「+404.html」残留（全仓 grep 唯一「32」命中在该句的自我更正里）。构成经 #7 独立核算成立。
2. **F4 :169 同步** — ✅ knowledge-map.md:169：「（31 个 html，构成见上方计数口径「站点 html 31」条；原「32」误含不存在的 404.html，2026-10-13 就地更正）」。
3. **F4 证据落成可复核** — ✅ 四条依据同行在位（:17）：CI 绿 run 38282562346 日志「dist HTML 文件数 = 31」+ 本机 404.astro 不存在 + 6 静态+2 动态路由 + 线上 /404.html HTTP 404。评审人 #5/#6 全部独立复核，**三方一致**。
4. **F4b audit 侧更正（不改历史）** — ✅ audit/report.md（U-22 处，:170）与 audit/content-audit.md（C-13 处，:99）各加「**就地更正说明（2026-10-13，t16/F4b——本项上一轮收口时未经验证，现已更正）**」：承认上一轮算式为未经验证推演、点出凭空加数（audit 侧「7 功能页/静态页 7 含 timeline」、knowledge-map 侧「+404.html」三套算式互相矛盾且均为凑数）、给实测 31 与 CI run 链接、注明「本条原文作为历史记录保留」。原文未删改，更正以追加标注形式。
5. **F1 作业入档（笔记+README）** — ✅ knowledge-map.md:170（未结事项 [x] 行）+ README.md:28（配套资产表）：作业名 `Verify site (structure + 3-viewport)` + 三个 run 链接（绿基线 38282562346 / 注入负路径 38282852860 / 加固后 38345995909，超出要求的 2 条）+ 边界声明「**只断言结构+几何，不覆盖视觉审美——像素级仍留浏览器人工目检**」。gh 核实三条链接全部指向真实 run（非占位文本），headBranch 均为 t5-visual-verify。
6. **F3 可证伪性（关键）** — ✅ 双重独立证明：
   - 代码（visual-check.mjs:97 签名 `searchRequired = false`；:222-224 `else if (searchRequired) { …failures.push('搜索入口缺失…') }`；:264/:271 主跑 FAULT=none 与负路径基线**两处**均传 `searchRequired: true`）——静默 `applicable:false` 仅剩 fixture 路径；
   - **评审人自建实验（#2）**：自构造「仅 home 缺入口」的 7 页 dist 走真实主跑路径 → home 三视口全失败「搜索入口缺失」、MAIN_EXIT=1。不是只读代码声称。
7. **F3 CI 证据** — ✅ run **38345995909** 存在、conclusion=**success**、**headSha=977a61f（t16 提交本身）**，日志「✅ 全部通过：21 页×视口（7 页 × 3 视口），无横向溢出 / 关键元素可见 / 无 console error」——加固后真实页 21/21 绿（非仅本机证明，该条达成）。
8. **F2 fault 截图** — ✅ 走「低成本可加则加」路线：visual-check.mjs fault 路径新增 `*_fault-*.png` 落盘（:291-293 `faultShot` + `screenshot` 字段入 report）+ verify.yml:115-117 注释同步说明。失败现场自此可下载可见。
9. **断言零放宽** — ✅ #3：TOLERANCE=4、3 视口 375/768/1280、PAGES 7 页清单两版逐字节一致；diff 全部为**新增**（searchRequired 失败分支、fault 截图、selftest 新预期），无任何判据下调/删除。
10. **deploy.yml 语义 / 第 7 作品 / 冻结计数** — ✅ #4 deploy.yml 零 diff；无新增作品目录；冻结计数除 F4/F4b 授权处（32→31）外零改动——15 域/17 课程页/18 课程卡/6 作品/205+37/rag §13 均未变（courses.ts 工作树仅 t6 一行限定、非计数；knowledge-map 口径块其余行未动）。
11. **分支纪律** — ✅ #9：t5-visual-verify 分支 + PR #1 OPEN（head=977a61f）+ main（ca682b6）未动未合并（本地=origin）。
12. **语料纪律** — ✅ #8：t16 足迹不含 notes/rag.md（零 diff）、notes/agent-harness.md、handoff.md（后两者改动归属 t4/t6，见 t11/t6 评审记录）；无 eval 漂移问题。

## 2. 非阻断观察（不影响 verdict）

- O1：CI sanity 步用「下限 31」（dist < 31 失败；> 31 不拦）——若未来新增页面会静默放过，可考虑收紧为精确值；属 t5 作业设计层面，非 t16 契约范围，建议下轮视情况处理。
- O2：t16 文档行（knowledge-map:170/README:28）把 F3/F2 加固与 t5 原作业写在同一行，读起来「21/21」可能混淆 t5 与 t16 两个 run——两 run 均已在括号内分别标注（21/21 + selftest）/（21/21，dist HTML=31），歧义轻微，不构成误导。

## 3. 复跑指引

- selftest：`cd site && PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers node tools/visual-check.mjs --selftest`（26/26）
- 证伪实验脚本与 dist 在 /tmp/f3-dist、/tmp/f3-out（评审临时资产，未入工作树；构造方法见本报告 #2）
- CI 证据：`gh run view 38282562346 --log | grep 'dist HTML'`、`gh run view 38345995909 --log | grep '全部通过'`、`gh run view 38282852860 --log | grep 已检出`

**verdict: pass**
