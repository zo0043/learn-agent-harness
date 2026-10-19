# 证据与可复现性分析报告（evidence）

- 分析者：evidence（t3）｜时间：2026-10-16 18:05 CST
- 语料覆盖声明：
  - **通读（逐行）**：`README.md`(54 行)、`AGENTS.md`(21 行)、`notes/knowledge-map.md`(174 行)、`.github/workflows/verify.yml`(159 行)、`memory-redteam/README.md`(133 行)、`site/src/content/config.ts`、`site/src/pages/c/[slug].astro`、`handoff.md`（§二/三/四/五 全部数字与判据段）。
  - **抽样（列出抽了哪几节/哪几行）**：`site/tools/visual-check.mjs:55-90,352-440`（PAGES/VIEWPORTS/selftest）；`site/tools/check-counters.mjs`（**整脚本实跑**，未读源码逐行）；`viz/mermaid-check.mjs:1-30`；`rag-demo/README.md:53-70` + `rag-demo/src/evaluate.ts:1-60`；`durable-execution-demo/README.md`（数字段 5-20/36-68/82）；`sandbox-demo/README.md`（数字段）；`mcp-demo/README.md`（数字段）；`framework-demo/README.md:1-120` + `src/compare-assert.ts:134-151`；`notes/model-basics.md:222-262`（S7 16 题）；`notes/agent-harness.md:380-395`（§13 八题）；`notes/rag.md:317-339`（S1 五题）；`notes/interview-bank.md:14-30,62-82,108-165`（§2/§3/§4/§8）；`harness-demo/src/otel-mock-scenario.ts:28-58`；`site/src/data/courses.ts`（WORK_COUNT/EXCLUDED）；4 份根历史文档（`notes-restructure-plan.md`、`restructure-review-content.md`、`restructure-review-structure.md`、`restructure-verify.md`）的数字与验收节（grep 定位后选读指定行）。
  - **未读（原因）**：`notes/process/` 20 篇全文（只按文件计数 + 命中数字核对）；`site/src/components/*`、`site/src/styles/*`、`site/src/layouts/*` 正文（本轮只判用户可见文案，显示形式留下一轮）；各 demo 业务源码全文（只读与判据/产物/断言计数相关的段，普通注释按语料范围排除）；`site/dist/` 产物内容（只有残骸，见 F3）；`notes/details/*`、`notes/industry-2026.md`、`notes/llm-timeline.md` 正文（只做计数）。
- 结论摘要（≤5 条）：
  1. **口径块的主口径全部可独立复算**：15 域 / 17 课程页 / 18 课程卡 / 6 具名作品 / 205 题 / 37 题 / 33 html / 19-20-8-47 / git 考古 19→39→39，`node site/tools/check-counters.mjs` → **12 判据 + 7 副本全绿、exit 0**；205 = 176+8+5+16 与 37 = 22+10+5 我按文件逐表数出，逐项吻合。
  2. **能在只读边界内真跑的判据我全跑了并复现**：`rag-demo` → recall@3/5/10 = 0.31/0.44/0.50、PASS 3/8、132 chunks、锚点 16/16、exit 0；`memory-redteam` → 16/16 exit 0、`--ablate` → 15/15 敏感（逐层 18/18）exit 0；`sandbox-demo` → A/B 各 3 次逐字节一致；`mcp-demo` → run1/run2 digest 一致。**这是本报告最强的正面结论。**
  3. **但「本机构建成功」这条链是断的**：三处活文档引用的 `33 page(s) built in 484.44s` 在整机日志与产物两侧都查不到——唯一出现处是转引（`/tmp/t7-evidence.log:42`），现存同类**成功**日志一律是 **34 页**（多出幽灵路由 `/c/site-refactor-plan/`）；当前 `site/dist` 是**89 文件 / 0 HTML** 的残骸（mtime 2026-10-14 17:53:55，对应一次被杀构建）。`33` 的真正机器证据在 CI（run 38554963320 的 `-eq 33` 步骤 success），**而该 run 全仓零引用**（F1/F3/F4）。
  4. **被引用的 4 个 CI run 全部早于当前判定口径**：它们跑的是 `-ge 31 / -ge 31 / -ge 32` 的旧版 workflow（PAGES 7/7/8 → 21/21/24/24 自洽）；当前 `verify.yml` 已变成 `-eq 33` + 口径门禁（`0f0ca19`），这一版唯一一次绿 CI 是 run 38554963320（steps 5/7/10 全 success）——文档里没有它。引用链与它要证明的口径错位（F4）。
  5. **「未验证/留浏览器目检」的标注总体诚实**（`verify.yml:10-11` 与 `README.md:28` 尾句逐字一致；OTel 历史 11 spans 标未验证并写出处 `handoff.md:77`；rag 旧值标「已废」），失实集中在**本机构建/OOM 的机制性叙述**（F2）与个别可复算却被写错的行数/文件数（F8/F9）。

---

## F1（high）｜`33 page(s) built in 484.44s` 无本机原始日志；现存同类成功日志是 34 页

- `id`：evidence-F1
- `severity`：**high**
- `对象`：`README.md:28`（「2026-10-14 复测 `astro build` 484s / exit 0，「33 page(s) built」」）、`notes/knowledge-map.md:18`（同句 + 「本机全量构建产出 33 定值」）、`.github/workflows/verify.yml:97-100`（注释「实测依据：2026-10-14 t2 本机全量构建 `astro build` → 「33 page(s) built in 484.44s」」）
- `现象`：这个被三处活文档当作「实测」引用的数字，在**整机范围内没有任何原始日志**；唯一出现处是另一份文件的**转引**。现存真正的成功构建日志记录的页数是 **34**，不是 33——多出的那一页是迁移前的幽灵路由 `/c/site-refactor-plan/index.html`。
- `证据`（命令原文 + 关键输出，全部亲自跑过）：
  ```
  $ grep -rn "484\.44\|484s\|484 s" /tmp/*.log
  /tmp/t7-evidence.log:42:  astro build：本任务未重跑（门禁脚本不依赖构建；t2 实测 exit 0/484.44s/33 页）

  $ grep -rn "33 page(s) built" /tmp/*.log
  （无输出）

  $ grep -rn "page(s) built" /tmp/*.log | sed 's|/tmp/||'
  t2-astro-build.log:136:16:27:36 [build] 34 page(s) built in 458.66s
  t3-build.log:136:16:43:01 [build] 34 page(s) built in 533.00s
  t4-build2.log:136:17:11:09 [build] 34 page(s) built in 873.03s
  t21-astro2.log:133:13:48:39 [build] 32 page(s) built in 514.85s
  （另有 4 条 32 页 / 100~112s 与若干 130/131/139 页的其它项目构建记录）

  $ stat -c '%y %s' /tmp/t2-astro-build.log
  2026-10-13 16:27:45.754534753 +0800 10772

  $ grep -oE "/[A-Za-z0-9._/-]+\.html" /tmp/t2-astro-build.log | sort -u | sed 's/^/  /'   # 34 项
    ...(17 个 /c/*/index.html，含 /c/site-refactor-plan/index.html)...
  $ grep -oE "/[A-Za-z0-9._/-]+\.html" /tmp/t2-astro-build.log | sort -u | wc -l
  34
  ```
  历史文档自身已记录过同一缺口（线索级）：`restructure-review-structure.md:41` ——「t2 称「全量 `astro build` exit 0 / 484.44s / 33 page(s) built」，**我复核时无法重现**（当前 `site/dist` 的 html = **0**…）该声明我**只能追溯到他方日志的转引**（`/tmp/t7-evidence.log:42`），**未见 t2 自己的原始构建日志**」。
- `影响`：从「实测数字」到「口径结论」的链在这里断开——三处活文档把一个**转引**当实测引用，且现存日志的页数与引用值（34 vs 33）**不一致**；读者按文档去复核必然复现不了，只能改信 CI。按全局纪律「宣告完成前，验收数值必须落成可重跑日志，交付时引用日志路径」，「484.44s」这条不达标。
- `建议方向`：把 `484.44s / 33 page(s) built` 就地改成「未验证（原始日志缺失，仅有转引）」或直接换引 CI run 38554963320 的 `Build sanity` 步骤（那才是 33 的机器证据）；若要保留本机数字，须同时落一条日志路径并把「34 页含幽灵路由」的历史解释写清。
- `置信度`：**高**——命令可重跑、结论是「现存证据里没有」（不足以证明「当时没跑过」，但足以证明该引用无法被独立复核）。
- `归属`：内容

## F2（high）｜「本机 astro build 曾多次 OOM（exit 134/137…）」无日志支持，且与 `verify.yml` 的「**非** OOM」互相打脸

- `id`：evidence-F2
- `severity`：**high**
- `对象`：`README.md:28`（「本机 astro build 曾多次 OOM（exit 134/137，曾留 85 文件/0 HTML 残骸）」）vs `.github/workflows/verify.yml:4-7`（「2026-10-13 t21 独立实测证伪「必然 OOM」… 首次 560s 超时被杀**非** OOM」）
- `现象`：同一条机制性结论在两处活文档里互斥（OOM vs 非 OOM 超时）。本机现存的全部构建失败日志支持的是「超时被杀 / 被杀」，**没有任何 134/137 记录**；「多次 OOM」这个机制归因在当前证据下不成立。
- `证据`：
  ```
  $ grep -H "EXIT=" /tmp/astro-build*.log /tmp/t2-astro-build.log /tmp/t3-build.log /tmp/t4-build2.log
  astro-build-t12.log:EXIT=124
  astro-build-t18.log:EXIT=124
  astro-build-t23.log:EXIT=124
  astro-build-t32.log:EXIT=124
  t2-astro-build.log:ASTRO_BUILD_EXIT=0
  t3-build.log:ASTRO_BUILD_EXIT=0
  t4-build2.log:ASTRO_BUILD_EXIT=0
  t2-build.log:BUILD_EXIT=125

  $ tail -c 40 /tmp/astro-build-t22.log
  ...                    Killed

  $ tail -3 /tmp/astro-build-t36.log
   building client (vite)
  11:17:57 [vite] transforming...      ← 无完成行
  ```
  即：现存记录里只有 `EXIT=124`（`timeout` 语义）、`EXIT=125`、`Killed` 与 3 次 `exit 0`，**没有 134/137**。`85 文件/0 HTML` 这个残骸数也无对应日志（今天实测的残骸是 **89** 文件/0 HTML，见 F3）。
- `影响`：这是「把时间先后/猜测当因果」的机制类结论——复现不了就该写「未定位」。它还被当作「CI 是可靠回归路径」这条结论的前提之一。
- `建议方向`：就地划改为「本机构建多次被超时/被杀（`EXIT=124`×4、`Killed`×1，日志路径可给），**是否 OOM 未定位**」，删去 134/137 与「多次 OOM」；与 `verify.yml:4-7` 的措辞统一。
- `置信度`：**高**（日志可枚举）；「未定位」的表述空间留给上游。
- `归属`：内容

## F3（high）｜本机唯一「33 HTML」的渲染侧证据已被 17:53 的被杀构建覆盖；当前 `site/dist` = 89 文件 / 0 HTML

- `id`：evidence-F3
- `severity`：**high**
- `对象`：`site/dist/`（实测）；`restructure-verify.md:25`（「`site/dist/` 存在一份迁移后的全量构建产物（33 HTML，mtime 16:21…）——为「33 = 7+17+8+1」提供**渲染层实证**」）与 `:164`（`find site/dist -name '*.html' | wc -l` → **33**）；`restructure-review-content.md:122`（「该 dist 随后被 t4 的独立全量构建 `rm -rf dist` 清空（17:37 起）」）
- `现象`：历史文档记录过「本机 33 HTML」的产物实证，但那个产物已不存在；**当前** `site/dist` 是一次被中途杀掉的构建留下的残骸，一个 HTML 都没有。凡是依赖 `site/dist` 的本机验证（`visual-check.mjs`、`viz/mermaid-check.mjs`）今天都跑不出有意义的结果。
- `证据`：
  ```
  $ find site/dist -name '*.html' | wc -l
  0
  $ find site/dist -type f | wc -l
  89
  $ ls site/dist
  _astro  _noop-middleware.mjs  chunks  favicon.svg  noop-entrypoint.mjs  pages  renderers.mjs
  $ stat -c '%y %n' site/dist
  2026-10-14 17:53:55.411035361 +0800 site/dist

  $ stat -c '%y' /tmp/build-retry.log ; tail -3 /tmp/build-retry.log
  2026-10-14 17:53:55.471035363 +0800
    building client (vite)
  17:53:55 [vite] transforming...       ← 无完成行，被中断
  ```
  时间戳逐秒吻合（17:53:55.411 vs 17:53:55.471）：**现存残骸就是这次被杀构建的现场**。
- `影响`：从「产物」到「33 是真值」的链在本机已断（只剩历史文档转述）。`README.md:28` 的「dist HTML=33 含 404.html 与 nav/index.html」在今天**不可复核**。
- `建议方向`：明确写「本机 dist 现为 17:53 被杀构建的残骸（89 文件/0 HTML），本机渲染侧证据已失效；33 以 CI `Build sanity` 等值断言为准」，并把本地预览/验证命令标注为「需先成功构建」。
- `置信度`：**高**（文件系统 + mtime 双向可重跑）。
- `归属`：内容

## F4（high）｜4 个被引 CI run 全部早于当前判定口径；验证当前门禁的绿 run（38554963320）全仓零引用

- `id`：evidence-F4
- `severity`：**high**
- `对象`：`README.md:28`（绿基线 run 38282562346「21/21」/ 负路径 38282852860 / 加固后 38345995909「21/21」/ 含 404 页后 38350151634「24/24」）、`notes/knowledge-map.md:171`（同四 run）；对照 `.github/workflows/verify.yml:75-76`（`Counter consistency gate`）与 `:105`（`test "$count" -eq 33`）
- `现象`：被引的 4 个 run 跑的是**旧版** workflow——当时 dist 断言是**下界** `-ge 31 / -ge 31 / -ge 32`，且**没有**口径门禁步骤。当前 `verify.yml`（提交 `0f0ca19`，2026-10-14 19:12 +0800）已换成等值 `-eq 33` 并新增门禁；**真正验证这一版的绿 CI 是 run 38554963320**（head `0f0ca1984` = 当前 HEAD，success，steps「Counter consistency gate」/「Build sanity」/「3-viewport assertions」全 success），而它在全仓 `*.md`/`*.yml` 里**一次都没被引用**。
- `证据`：
  ```
  $ git show <sha>:.github/workflows/verify.yml | grep -oE 'test "\$count" -[a-z]+ [0-9]+'
  887988724 (run 38282562346): -ge 31
  977a61f0c (run 38345995909): -ge 31
  e37f0aebe (run 38350151634): -ge 32
  0f0ca1984 (HEAD)          : -eq 33

  $ git show <sha>:site/tools/visual-check.mjs | awk '/^const PAGES = \[/,/^\];/' | grep -c "path:"
  887988724: 7   977a61f0c: 7   e37f0aebe: 8   0f0ca1984: 8      # ×3 视口 = 21/21/24/24，与四 run 自述一致

  $ curl -s ".../actions/runs?per_page=30" | python3 -c "..."   # run 级结论
  6  887988724 success     2026-10-12T17:11:27Z  (102s)
  7  887988724 failure     2026-10-12T17:14:06Z  （负路径，按设计）
  8  977a61f0c success     2026-10-13T04:20:49Z  (115s)
  9  e37f0aebe success     2026-10-13T05:11:41Z  (116s)
  15 0f0ca1984 success     2026-10-14T11:12:38Z  (129s)   ← id 38554963320

  $ curl -s ".../actions/runs/38554963320/jobs" | python3 -c "..."
  step 5 Counter consistency gate (口径门禁) -> success
  step 7 Build sanity (dist must contain real HTML) -> success
  step 10 Run 3-viewport structure + geometry assertions -> success

  $ grep -rn "38554963320" --include=*.md --include=*.yml --include=*.mjs . | grep -v node_modules
  （无输出）
  ```
- `影响`：文档口径上的「绿基线」实为**旧判定口径**的绿（我只能核 run 级结论与步骤结论，日志正文见下）。要证明「当前门禁 + `-eq 33` 在 CI 上绿」，必须引 run 15；否则读者按引用去核，会以为 33 从未被 CI 断言过。
- `建议方向`：把 run 38554963320（含日期、steps 清单）补为当前口径的绿基线；旧四 run 保留但注明「旧版口径：dist 断言为 `-ge 31/32`、无口径门禁」。
- `置信度`：**高**（run/sha/断言三方交叉；唯一缺口是 GitHub logs API 需 admin 权限，见「未验证」节）。
- `归属`：内容

## F5（medium）｜`sanity 下界 ≥32`（文档）与 `-eq 33`（实现）不是同一个判据

- `id`：evidence-F5
- `severity`：**medium**
- `对象`：`notes/knowledge-map.md:171`（「8 页×3 视口=24、**sanity 下界 ≥32**」）vs `.github/workflows/verify.yml:101-105`（「原写「6 静态页…= 32」的枚举**漏了 nav**… 故这里改为**等值断言 33**」+ `test "$count" -eq 33`）
- `现象`：按文档复算得到的是「下界」判据，按实现复算得到的是「等值」判据——同一口径给出两个不同的门禁强度。而 `verify.yml` 自己写明：下界断言「结构上永远发现不了「少枚举一个页面」」，这正是 32→33 的历史成因；文档仍在用被废弃的判据描述当前 CI。
- `证据`：
  ```
  $ grep -n 'test "\$count"' .github/workflows/verify.yml
  105:          test "$count" -eq 33
  $ sed -n '171p' notes/knowledge-map.md | grep -o "sanity 下界 ≥32"
  sanity 下界 ≥32
  $ git show e37f0aebe:.github/workflows/verify.yml | grep -o 'test "\$count" -[a-z]* [0-9]*'
  test "$count" -ge 32
  ```
- `影响`（本角度）：文档→判据的复现路径指向一个**更弱**的判据，「CI 绿」的边界因此不可从文档逐字还原（违反「边界要逐字引自上游规范并写出处」）。
- `建议方向`：把该句改为「等值断言 `-eq 33`（`verify.yml:105`）+ 关键页非空清单」，与门禁同步。
- `置信度`：**高**（一处 grep + 一处 git show）。
- `归属`：内容
- `分工说明`：本条只判「文档声明的判据 vs 实现判据是否同一口径」；「旧值在别处活着/多处副本不一致」归 consistency 视角，不重复计。

## F6（medium）｜「16/17 张 mermaid 已渲染为 SVG 验收通过」在仓内零证据；验收脚本不在 CI 且依赖绝对路径与本地 dist

- `id`：evidence-F6
- `severity`：**medium**
- `对象`：`handoff.md:158`（「四课共 16 张 mermaid 已构建渲染为 SVG 验收通过」）、`:160`（「四课共 17 张 mermaid 已渲染为 SVG 验收通过」）、`:162`（「共 16 张」）；`viz/mermaid-check.mjs:9`（`const DIST = '/home/ubuntu/app/learn-agent-harness/site/dist';`）
- `现象`：mermaid 词法上是**可复算的**（我按 `` ```mermaid `` 计数：系统设计/多智能体/沙箱/评测 = 4+4+4+4 = 16；durable/MCP/API/数据飞轮 = 4+5+4+4 = 17；可观测/长期记忆/模型基础/框架生态 = 16 —— 三处声明全部吻合）。但「**已渲染为 SVG 验收通过**」这半句既无产物也无 CI：仓内没有任何课件 SVG，唯一的验收脚本依赖硬编码绝对路径 + 一个当前为 0 HTML 的 `site/dist`，且不在 `verify.yml` 里。
- `证据`：
  ```
  $ ls viz/                        → mermaid-check.mjs  render.mjs      # 无 .svg
  $ git log --all --name-only --pretty=format: | grep '\.svg$' | sort -u
  site/public/favicon.svg
  $ grep -n "const DIST" viz/mermaid-check.mjs
  9:const DIST = '/home/ubuntu/app/learn-agent-harness/site/dist';
  $ grep -n "mermaid-check" .github/workflows/verify.yml
  （无输出）
  $ for f in notes/*.md; do n=$(grep -c '^```mermaid' "$f"); [ "$n" -gt 0 ] && echo "$f $n"; done
  ... 每课 4（mcp 5）、knowledge-map 1，总计 62
  ```
- `影响`（本角度）：这是「验收通过」清单里唯一**连产物都拿不出**的一项（对比：rag/记忆/沙箱/mcp 的判据我今天都真跑复现了）；把「渲染通过」写成既成事实，等同用不可复核的自述充当渲染正确性证据。
- `建议方向`：要么把该句改成「已按脚本逐页确认（脚本路径 + 需先成功构建）」并把它接进 CI（或改为构建产物侧断言），要么补一份可提交的验收记录；绝对路径改为相对 `import.meta.url` 派生。
- `置信度`：**高**（计数与缺产物两条都可重跑）。
- `归属`：内容

## F7（medium）｜harness-demo / durable-execution-demo 的核心验收判据无落盘报告，且在「不写工作区」边界内不可跑

- `id`：evidence-F7
- `severity`：**medium**
- `对象`：`notes/knowledge-map.md:165-167`（「`demo:otel` 离线 mock 实测 **15 spans/1 trace**」「3 崩溃点×各 3 次真实 SIGKILL…副作用计数恒=1」「16/16 守住」）、`README.md:13,17`、`handoff.md:77`、`durable-execution-demo/README.md:19`（「`npm run demo` 末尾的 ✅ … 即 S7 验收」）
- `现象`：这些判据的源码契约齐备、可静态复核，但**「✅ 验收通过」只以 stdout/自述形式存在**，仓内没有任何验收报告落盘；同时它们对应的命令**会写工作区**，因此在只读审计边界内跑不了 → 「实测」这一档证据在本轮不可复核。
- `证据`：
  ```
  # 会写的证据（所以不跑）
  $ grep -ln "writeFileSync\|appendFileSync\|mkdirSync\|createWriteStream" harness-demo/src/*.ts
  harness-demo/src/otel-mock.ts          （写 workspace/out/otel-spans.md）
  harness-demo/src/session.ts            （写 trajectories/*.jsonl）
  harness-demo/src/tools.ts              （写 workspace/out/*）
  $ grep -ln "writeFileSync\|appendFileSync\|mkdirSync" durable-execution-demo/src/*.ts
  durable-execution-demo/src/external.ts  runner.ts  state.ts

  # 产物侧的现状
  $ ls harness-demo/workspace/out 2>&1 → No such file or directory      # 15 spans 的快照不存在
  $ ls -d durable-execution-demo/mock-service 2>&1 → No such file       # 副作用账本不在仓内
  $ find durable-execution-demo/.state -type f
  .state/checkpoint.json .state/mock-service/ledger.jsonl .state/mock-db/rows.json .state/journal.jsonl .state/idempotency.json
  $ stat -c '%y' durable-execution-demo/.state
  2026-10-16 17:52:19                       # 今日有运行痕迹（非本审计所跑），但那只是运行态工作目录，不是 3×3 验收报告

  # 判据契约确实齐备（可静态复核）
  $ sed -n '48,58p' harness-demo/src/otel-mock-scenario.ts
  export const EXPECTED = { traceCount: 1, spanTotal: 15, byName: { invoke_agent: 1, chat: 6, execute_tool: 8 }, ...
    historicalReportOnly: { spans: 11, traces: 1, source: "handoff.md:77 / notes/harness-from-scratch.md:210（活端点报告值，无可复跑日志）" } }
  $ sed -n '48,52p' durable-execution-demo/src/runner.ts
  if (crashAt === "A" && step.crashTarget) injectCrash("A", "intent 前：该步从未开始");
  if (crashAt === "B" && step.crashTarget) injectCrash("B", "intent 后 exec 前：副作用发生没有=未知");
  if (crashAt === "C" && step.crashTarget) injectCrash("C", "exec 后未落盘：副作用已发生、结果未记录");
  $ sed -n '85,95p' durable-execution-demo/src/demo.ts      # for points × for runs(1..3) 矩阵 + died==="signal=SIGKILL"||"exit=137" 断言
  ```
- `影响`（本角度）：证据→结论链在此是「自述级」而非「可查级」：**判据成立**（可读源码确认 3 个崩溃点、15/1 的期望常量、真实 `process.kill(pid,'SIGKILL')`），**但「已通过」没有可查记录**，第三方只能重跑（且必须允许写盘）。
- `建议方向`：`npm run demo` 的验收输出落一份不写工作区外的报告（或 CI 步骤里跑并留 artifact），并把「15 spans/1 trace」这类数字的来源标注为「契约常量 + 验收日志（路径）」。
- `置信度`：**高**（写盘点、缺失产物、契约常量三条都可重跑）。
- `归属`：内容

## F8（medium）｜白板行数：`~150 行`（handoff）与 `~180 行`（README/knowledge-map）互斥，实测 178

- `id`：evidence-F8
- `severity`：**medium**
- `对象`：`handoff.md:65`（「`whiteboard/agent_whiteboard.py` ~150 行纯标准库白板版」）vs `README.md:24`（「~180 行 Python」）/ `notes/knowledge-map.md:146`（「(~180 行)」）
- `现象`：同一个文件的规模在两处活文档里差 19%；可复算的那一侧（~180）成立，handoff 的「~150」不成立。
- `证据`：
  ```
  $ wc -l whiteboard/agent_whiteboard.py
  178 whiteboard/agent_whiteboard.py
  ```
- `影响`（本角度）：这是「可被一条只读命令证伪却没有被证伪」的旧值——面试口述/README 引用的规模数不一致时，被追问会露。
- `建议方向`：把 handoff 的「~150 行」就地改为「~180 行（`wc -l` = 178）」，或统一改为「约 180 行、实测 178」。
- `置信度`：**高**。
- `归属`：内容

## F9（medium）｜`memory-redteam/` 的「7 src 文件」按文件系统复算 = 9（计数口径未声明）

- `id`：evidence-F9
- `severity`：**medium**
- `对象`：`notes/knowledge-map.md:150`（「`memory-redteam/`（7 src 文件，零依赖；…）」）
- `现象`：按 `src/` 目录枚举得 9 个文件；「7」只有在「只数 README 表格里登记的 7 个模块」这一未声明口径下才成立（`persist-run.mjs`、`index.ts` 被排除）。同一批 demo 文件计数里，只有这一条按文件系统复算不复现。
- `证据`：
  ```
  $ find memory-redteam/src -type f | wc -l
  9
  $ ls memory-redteam/src
  demo.mjs  index.ts  memory.mjs  persist-check.mjs  persist-run.mjs  persist.mjs  redteam.mjs  retrieval.mjs  scenario.mjs

  # 对照（同一命令族，全部复现）
  $ ls harness-demo/src/* | wc -l                 → 13   （README.md:13「13 个源文件＝9+3+1」逐项吻合）
  $ find rag-demo/src -type f | wc -l             → 15   （handoff.md:53「rag-demo 15 文件」）
  $ find durable-execution-demo/src -name '*.ts' | wc -l   → 9
  $ wc -l durable-execution-demo/src/*.ts | tail -1        → 821 total（knowledge-map.md:148「9 src 文件/821 行」）
  $ wc -l sandbox-demo/src/*.ts | tail -1                  → 600 total（knowledge-map.md:165「600 行」）
  $ for d in */; do node -e "const p=require('./$d/package.json');process.exit(p.scripts&&p.scripts.demo?0:1)" && echo $d; done | wc -l   → 10（与 restructure-verify.md:145「实测为 10」一致）
  ```
- `影响`（本角度）：口径块自称「全仓唯一参照」，但该条的真值来源（目录 vs 登记表）没写；读者按不同口径复算会得到 7 或 9 两个数。
- `建议方向`：写成「7 个登记模块（`src/` 下共 9 个文件，含转发入口 `index.ts` 与子进程入口 `persist-run.mjs`）」，或直接改为 9 并说明。
- `置信度`：**高**。
- `归属`：内容

## F10（low）｜「六个口径」的成员集与口径块/门禁的条目数三者不一致

- `id`：evidence-F10
- `severity`：**low**
- `对象`：`handoff.md:191`（「六个口径（15 域/17 页/18 卡/6 作品/205+37 题）以 knowledge-map 头部口径块为唯一参照」）vs `notes/knowledge-map.md:11-19`（口径块实为 7 条：知识域/课程页/课程卡/作品/题目/站点 html 33/rag 评测口径）vs `site/tools/check-counters.mjs`（运行输出「判据 **12** 条 + 副本 7 处」）
- `现象`：按文档枚举得到 5 项（或把 205+37 拆开算 6 个数），按口径块成员得到 7 条，按 CI 门禁得到 12 条判据——三个数都能自辩，但**没有一处声明成员集**，所以「六个口径」这个指代无法从文档唯一复原。
- `证据`：
  ```
  $ node site/tools/check-counters.mjs ; echo EXIT=$?     # 只读脚本，无写盘调用（grep write/mkdir 无命中）
  ✅ 口径全部一致（判据 12 条 + 副本 7 处）
  EXIT=0
  ```
- `影响`（本角度）：属「可复现的指代」问题：读者想知道「哪 6 个」必须自己猜；若日后某条口径被废弃，「六个口径」这句会静默失真。
- `建议方向`：把该句改为显式枚举（「口径块 §计数口径 的 N 条」并给出成员表），或改成「口径块全部条目」。
- `置信度`：**中**（成员集解读本身有歧义空间，存疑表述已限定）。
- `归属`：内容

---

## 正面基线（我亲自复算/真跑通过的，供 synthesis 与 verifier 取用）

下面这些是**本节全部输出里最重要的一半**：本报告的高严重度条目集中在「本机构建/OOM」与「CI 引用链」，其余口径与判据——包括几个最常被面试引用的数字——**都经我独立复算或真跑复现**。

| 声明 | 位置 | 我的复算命令 | 结果 |
|---|---|---|---|
| 顶层 19 / process 20 / details 8 / 合计 47 | `knowledge-map.md:13`、`README.md:34` | `ls notes/*.md \| wc -l`；`ls notes/process/*.md \| wc -l`；`ls notes/details/*.md \| wc -l`；`find notes -name '*.md' \| wc -l` | 19 / 20 / 8 / 47 ✅ |
| process 构成 15+3+2 | `knowledge-map.md:13` | `ls notes/process/` 按前缀分类计数 | capstone 15 / mvp 3 / 其余 2 ✅ |
| git 考古 19→39→39、cc1b906 新增 20 | `knowledge-map.md:14`（含给出的复现命令） | `for rev in 5a04da0 cc1b906 ea277ab; do git ls-tree -r --name-only $rev -- notes/ \| awk -F/ 'NF==2 && /\.md$/' \| wc -l; done`；`git show --name-status --format="" cc1b906 -- notes/ \| grep -c '^A'` | 19 / 39 / 39；20 ✅ |
| 课程页 17 = 19−2（机制：glob `*.md` 只匹配顶层） | `knowledge-map.md:13`、`site/src/content/config.ts` | `node site/tools/check-counters.mjs`；`grep -n "pattern" site/src/content/config.ts` | 17 ✅（门禁重算） |
| 课程卡 18 / KNOWLEDGE 域 15 / 作品 6 | `knowledge-map.md:12,15,16` | 同上 + `grep -n WORK_COUNT site/src/data/courses.ts` | 18 / 15 / `WORK_COUNT = 6` ✅ |
| 站点 html 33（8 静态 + 17 课程 + 8 专题，互斥穷尽） | `knowledge-map.md:18` | `node site/tools/check-counters.mjs`（成员逐个列出）；`ls site/src/pages/*.astro \| wc -l` → 7 | 33 ✅（源派生；CI 侧见 F4） |
| 课内嵌题 205 = 176+8+5+16 | `knowledge-map.md:17` | `for f in notes/*.md; do awk '/^## 练习题库/{inb=1;next} inb&&/^## /{inb=0} inb&&/^\| *[0-9]+ *\|/{n++} END{if(n)printf "%s %d\n",F,n}' "$f"; done` → 14,14,14,14,14,8,14,14,14,12,14,16,14；`grep -n "^# 第十三节 练习题库" notes/agent-harness.md`（8 行）；`notes/rag.md:317`（Q1–Q5）；`notes/model-basics.md:222`（S7 编号 1–16） | 176+8+5+16 = 205 ✅ |
| 面试题库 37 = 22+10+5 | `knowledge-map.md:17` | `awk` 按 `- Q[0-9]+` / 表格行 数 §3/§4/§8 | 22 / 10 / 5 ✅ |
| rag 评测口径 | `knowledge-map.md:19`、`rag-demo/README.md:62-66` | `cd rag-demo && npm run demo:eval`（只读：`src/*` 无任何 write API；无网络） | `recall@3 = 0.31  recall@5 = 0.44  recall@10 = 0.50`、`PASS 3/8`、`132 chunks`、`gold 锚点解析：16/16`、**exit 0** ✅ |
| 记忆回归 16/16 与消融 18/18 层 | `memory-redteam/README.md:24-25,37-39`、`knowledge-map.md:166-167` | `node memory-redteam/test.mjs`；`node memory-redteam/test.mjs --ablate`（只读：`test.mjs`/`redteam.mjs`/`memory.mjs` 零 write API；`--persist` 才写 tmpdir，未跑） | `16/16 条探针守住（退出码 0）`；`15/15 条探针对其防线敏感（逐层验证 18/18 层）（退出码 0）` ✅ |
| 沙箱「3 次重放逐字节一致」 | `knowledge-map.md:165`、`sandbox-demo/README.md:39-40` | `cd sandbox-demo && npm run demo`（`src/` 无 write API） | `A（仅权限门）: run 2/3 vs golden → 逐字节一致 ✅；B（四通道+沙箱）: 同 ✅`、`EXIT=0` ✅ |
| MCP 「同输入→同输出+同摘要」 | `mcp-demo/README.md:5-6` | `cd mcp-demo && npm run demo`（`src/` 无 write API） | `run1/run2: 15 事件, digest=fnv1a:220aa43d` 一致、四层防御对照表、`EXIT=0` ✅ |
| harness-demo 13 源文件构成 | `README.md:13` | `ls harness-demo/src/* \| wc -l` + 分组点名（9 运行时 + 3 OTel + 1 压缩自测） | 13 ✅ |
| framework 10 断言 + A1–A16 | `README.md:18`、`framework-demo/README.md:81-89` | `grep -n "ok(" framework-demo/src/capabilities.ts`；`grep -oE '"A[0-9]+"' framework-demo/src/compare-assert.ts \| sort -u \| wc -l` | `ok()` 恰在文档点名的 `13,14,37,38,62,63,64,73,75,76` 十行；A1–A16 = 16 ✅（未跑：会写 session JSONL） |
| 轨迹事件分布 22 行 | `handoff.md:162` | `python3 -c "…json.loads per line, Counter(kind)…"` on `harness-demo/trajectories/demo.jsonl` | `rows=22 {'init':1,'model_response':6,'tool_intent':6,'tool_exec':8,'final':1}` ✅（`compaction`/`crash` 确实未出现） |
| OTel 契约常量 15 spans / 1 trace | `knowledge-map.md:165` | `grep -n EXPECTED -A 10 harness-demo/src/otel-mock-scenario.ts` | `{traceCount:1, spanTotal:15, byName:{invoke_agent:1, chat:6, execute_tool:8}}` ✅（未跑 mock；产物 `workspace/out/otel-spans.md` 不存在） |
| mermaid 张数 16/17/16 | `handoff.md:158,160,162` | `grep -c '^\`\`\`mermaid' notes/*.md` | 系统设计/多智能体/沙箱/评测 4×4=16；durable/MCP/API/飞轮 4+5+4+4=17；观察/记忆/模型/框架 4×4=16 ✅（SVG 验收见 F6） |
| LLM 时间线 12 节点 | `knowledge-map.md:70` | `grep -n '^\|' notes/llm-timeline.md` | 表头 1 + 数据行 12（2023.03 → 2026.07）✅ |
| JD 一手数据 1799 = 339+815+645 | `handoff.md:102` | `python3 -c "json.load(...)"` on `jd-research/{ashby_openai,gh_anthropic,tencent_all}.json` | `jobs: 815` / `jobs: 645` / `list: 339` = **1799** ✅（`jd-research/` 被 `.gitignore` 排除，属本机数据） |
| 日期口径残留声明「残留均为引文」 | `knowledge-map.md:9` | `grep -rn "10-17" notes/*.md notes/process/*.md notes/details/*.md handoff.md README.md` | 仅 `knowledge-map.md:9`、`handoff.md:12,14` 三处**引文式**出现，无未标注残留 ✅ |
| 口径一致性门禁 | `.github/workflows/verify.yml:75-76` | `node site/tools/check-counters.mjs`（脚本无写盘调用：`grep -n "writeFile\|mkdir\|appendFile\|rmSync\|execSync" → 无命中`） | 12 判据 + 7 副本全 ✅，`EXIT=0` |

**本报告的口径边界**：`git status --porcelain` 在本轮全部检查前后均为
`?? analysis/` + 4 份根历史文档（`notes-restructure-plan.md`、`restructure-review-*.md`、`restructure-verify.md`，本轮开始前即为未跟踪）。
除本文件外**未新建、未修改任何既有文件**；未跑任何会写工作区的命令（写盘点已逐条静态确认，见「未验证」节）。

---

## 转交下一轮（显示形式）

> 只登记，不展开。

1. `site/dist/` 现为 89 文件 / 0 HTML 的被杀构建残骸 —— 影响本地预览、`visual-check`、`mermaid-check` 的可用性；属「构建/呈现环境」问题，留待形式轮统一处置（是清理、是加说明、还是接进 CI）。
2. `viz/mermaid-check.mjs:9` 硬编码绝对路径 `DIST='/home/ubuntu/app/learn-agent-harness/site/dist'` —— 可移植性问题，形式/工程轮处理。
3. `README.md:28` 把「本机预检 `node site/tools/visual-check.mjs --selftest`（26/26）」写成可直接执行的预检，但该命令会写 `site/tools/out/`（`visual-check.mjs:432` 无条件 `writeFileSync('selftest-report.json')`，另产截图）；「本地预检的落盘与清理约定」属流程/形式轮话题（本轮按不写工作区边界未跑）。
4. 404 页「3 个引导卡片」等断言是结构断言；卡片**外观**与页面视觉审美一律留浏览器目检（与 `verify.yml:10-11` 的边界一致）。

## 本轮未覆盖 / 未验证

**A. 因「会写工作区」而未跑（这是本报告最主要的证据上限）**

1. `site/tools/visual-check.mjs`（默认模式与 `--selftest`）**未跑**：会写 `site/tools/out/**`（含 21/24 张截图与 `report.json`、`selftest-report.json`），且 `--selftest` 还需要 playwright。因此 **21/24/26 不是跑出来的**，而是源码静态推演：`PAGES.len × 3`（当前 8×3=24、历史 sha 7×3=21；`git show <sha>:...` 实测 7/7/8/8）+ selftest 的 `expect()` 计数（block1 3×2 + block2 3×2 + block3 3×2 + block4 3×2 + block5 2×1 = **26**）。推演与文档声明完全一致，**但按本轮口径只能算「可静态复现」，不算「已复现」**。
2. `harness-demo` 的 `npm run demo` / `demo:crash` / `demo:reject` / `demo:compact` / `demo:otel*` **未跑**：写 `trajectories/*.jsonl`、`workspace/out/*`（`otel-mock.ts:29-30`、`session.ts`、`tools.ts`）→ 「5 种模式实测」「压缩 摘要 3 条/保留 9 条」「105s」「15 spans/1 trace」均**未复现**（契约常量已静态核对，见正面基线）。
3. `durable-execution-demo` 的 `npm run demo` **未跑**：写 `.state/*` → **「3 崩溃点 × 各 3 次、副作用计数恒=1、恢复报告逐字节一致」未复现**。观察（非本审计所跑、不作为证据）：`.state` 目录 mtime = 2026-10-16 17:52:19，说明今天本机有运行痕迹；但 `.state` 是运行态工作目录（现存 `mock-service/ledger.jsonl` 仅 1 行 `msg-0001`），**不含验收报告**。
4. `framework-demo` 的 `npm run demo` / `compare` / `compare:assert` **未跑**：`src/sdks/claude.ts`、`resume-probe.ts`、`compare.ts` 都写文件（会话 JSONL 等）→ **10 断言实跑、A1–A16、五次对照结论均未复现**（断言数已静态复算）。
5. `viz/mermaid-check.mjs` **未跑**：需要 playwright + 一个能用的 `site/dist`（当前 0 HTML）。
6. `astro build` **未跑**（任务默认禁止：约 8 分钟且不可依赖）→ **`33` 的「构建产物」口径在本机未验证**；我改用只读方式：源派生（`check-counters.mjs`）+ CI 侧证（run 38554963320 的 `Build sanity` 步骤 success）。
7. 任何 `npm install`/`npx playwright install` **未跑**（不改环境、不联网装包）。

**B. 证据不可及**

8. **GitHub Actions 日志正文取不到**：`curl -sL /repos/.../actions/runs/<id>/logs` → `403 {"message":"Must have admin rights to Repository."}`。因此「dist HTML 文件数 = 31/32」「21/21、24/24 的实际打印」只能由 **run 级结论 + job steps 清单 + 同 sha 的断言源码 + PAGES 计数**四者交叉侧证，**未经日志原文确认**。
9. `/tmp` 是本次唯一的本机构建日志来源（仓内无任何构建日志文件）。`/tmp` 属易失目录，F1/F2/F3 的结论建立在「此刻仍存在」的这批日志上；引用时建议把关键行转存进仓库或 CI artifact。

**C. 本角度未取信的声明（线索级，需其他视角或后续轮次处理）**

10. **历史性/生产性数字**（无仓内证据、无一手数据）：`handoff.md:85`「全程 105s」、`:14`「上线时 9 页全 200」「build 零错误」、`:102`（JD 抓取时的反爬与条数口径）、`interview-bank.md`/`handoff.md` 里的 FinHot 生产数字（1830 行台账、1645 行 backfill、失败率 ~10%、T+5）、`knowledge-map.md:9`「11 文件 27 行 28 处修正」——均**未验证**（历史事件或生产环境，本机不可复现）。
11. **外部时点事实**（OWASP LLM/Agentic Top 10 2026 版、LangGraph 1.4.21、MCP spec 2026-07-28、模型轮换 qwen3.8-flash-next 等）**属技术准确性角度**，本报告只登记「不可由本机复算」这一事实，不判对错。
12. **其他成员/上一轮的自述**：本轮不引用任何其他成员报告结论（`restructure-verify.md` 等的同类发现只在 F1/F3 作为**线索**标注，均已由我自己的命令独立重跑）。
13. `04-consistency` 报告在本文件写作时尚不存在，故「多处副本是否一致 / 旧值是否活着」这一整类问题（如 `knowledge-map.md:171` 的 `≥32` 旧值与 `README.md:28` 的互斥归因）我只从**可复现性**角度各记一条（F2/F5），**不代 consistency 视角下结论、不重复计 finding**。
