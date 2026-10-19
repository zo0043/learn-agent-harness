# 跨篇一致性与口径分析报告（consistency）

- 分析者：consistency｜时间：2026-10-16 17:58（系统时钟）
- 语料覆盖声明：
  - **通读（逐行）**：`README.md`(1–54)；`handoff.md`(1–200)；`notes/knowledge-map.md`(1–174)；`site/src/data/courses.ts`(1–331)；`site/src/data/course-structure.ts`(20–386 关键段)；`site/src/data/mvps.ts`(1–60)；`site/src/pages/{index,works,learn,nav,404}.astro` 口径段；`site/src/layouts/Base.astro:14`；`site/tools/check-counters.mjs`(全文 415 行)；`site/tools/visual-check.mjs`(55–110 / 238–345 / 352–440)；`.github/workflows/verify.yml`(1–180)；`harness-demo/README.md`(1–45)；`harness-demo/src/otel-mock-scenario.ts`(1–60)；`harness-demo/src/otel-assert.ts`(1–100)；`memory-redteam/README.md`(1–45)；`memory-redteam/test.mjs`(1–95)；`memory-redteam/src/redteam.mjs`(ablate 声明逐行)
  - **抽样（列出抽了哪几节/哪几行）**：`notes/process/site-refactor-plan.md` §0(:25–32) / §10.2(:325–340) / §11.4(:355–360) / §12.4(:427–436) / §13(:443–490) / §14(:491–500)；`notes/observability.md:79,:109`；`notes/framework-ecosystem.md:98–99,:111,:292,:420–422`；`notes/industry-2026.md:35,:107–110`；`notes/interview-bank.md:87,:89,:97,:102,:105,:151`；`notes/long-term-memory.md:219,:279,:416,:488`；`notes/details/06-observability-loop.md:27`；根 4 份 restructure 文档（`notes-restructure-plan.md` / `restructure-review-content.md` / `restructure-review-structure.md` / `restructure-verify.md`）按 grep 命中行抽读
  - **未读（原因）**：`notes/*.md` 课程正文的教学内容（属其它视角，本轮只取其口径行）；`site/src/pages/**` 的非口径模板代码；各 demo 的源码实现（只读被当作口径的常量：`otel-mock-scenario.ts:EXPECTED`、`redteam.mjs:ablate`）；`notes/process/` 其余 19 份的正文（只抽口径段）；`.agent-teams/**`（团队状态，只读诊断，按语料规范排除）
- 结论摘要（≤5 条）：
  1. **本轮 8 组「必须回答」数字里 6 组已核对一致**（19/17/33、205/37、13 源文件、8 页×3 视口、21/24/26、recall 三值、18/18 层），并已由 `node site/tools/check-counters.mjs` 复算（12 判据 + 7 副本全绿，exit 0）；**旧值 10/9 源文件、旧 recall@3=1.00 的活残留 = 0 处**（仅存于历史报告与带「已废/未验证」限定语的转述中）。
  2. **但两组数字仍自相矛盾且都在用户可见面**：OTel 埋点 `11 spans`（`works.astro:133/:393`）vs 全仓其余 15 spans；「6 个可运行 demo（`npm run demo` 一键复现）」（`README.md:9`）vs 实测只有 10 个目录有 `demo` 键、且 `rag-demo` 的入口是 `demo:eval`（`works.astro:411`、`courses.ts:289`、`README.md:14` 自相矛盾）→ F1 / F2。
  3. **旧三档 P0/P1/P2 远未清理干净**：同一课程在 `notes/knowledge-map.md` 课程总表(:55–68)与依赖图(:85–98)、以及 `site/src/data/courses.ts` 的 `phase` 字段里仍带旧三档标签，其中 **9/14 与 `course-structure.ts` 的五档 `stage` 直接冲突**（如 `sandbox` 表内 P0 / `stage` P1）→ F4。
  4. **门禁口径有结构性盲区**：`check-counters.mjs` 只交叉核对 `README.md` / `courses.ts` 注释 / `verify.yml` 三处副本，`index.astro:34–35` 手写的 `205/37`、`nav.astro:17` / `404.astro:37` / `Base.astro:14` 手写的 `17` 都不在门禁内 —— 这正是它自己立誓要治的「修一处漏两处」→ F5。
  5. 其余为「同一数字两个不同指称」（`8 页`）、陈旧数字（`34 页`）、构建时长口径（8 分钟 vs 17 分钟）、SDK 版本清单未随台账刷新（1.4.21 vs 1.5.0）、命名规范被自己破坏（5 处漂移名）。

---

## 0. 「必须回答」8 组数字的核对结果（成对 file:line）

| # | 口径 | A 处（file:line 说 X） | B 处（file:line 说 Y） | 判定 |
|---|---|---|---|---|
| 1 | **harness-demo 源文件数** | `README.md:13`「13 个源文件（9 运行时 + 3 OTel 离线判据/断言 + 1 压缩自测）」、`site/src/pages/works.astro:101`「13 个 src 文件…」、`site/src/data/mvps.ts:47`「13 src = 9 运行时 + 3 OTel…」、`notes/process/site-refactor-plan.md:123`「13 src…」、`notes/knowledge-map.md:145`「13 源文件…」 | 我自跑 `ls harness-demo/src/*.ts \| wc -l` → **13**；`harness-demo/README.md:5–16` 权威清单逐行 13 个 | **一致 ✅**（旧值 10/9 已 0 处活残留，见 §F0） |
| 2 | **19 / 17 / 33 页面** | `notes/knowledge-map.md:13`「课程页 17 = notes 顶层 19 − knowledge-map − interview-bank」；`:18`「站点 html 33 = 8 静态页 + 17 课程页 + 8 专题页」 | `README.md:34`「19 篇课程内容（顶层）」；`README.md:28`「dist HTML=33」；`.github/workflows/verify.yml:105` `test "$count" -eq 33` | **一致 ✅**（`ls notes/*.md \| wc -l`=19、`check-counters.mjs` 复算 33 三桶互斥且穷尽） |
| 3 | **205 题 / 37 题库** | `notes/knowledge-map.md:17`「课内嵌 205（13 课 176 + agent-harness §13 八题 + rag S1 五题 + model-basics S7 十六题）+ 面试题库精选 37（§3 22 + §4 10 + §8 5）」 | `site/src/pages/index.astro:34` `const Q_IN_LESSON = 205;` / `:35` `const Q_BANK = 37;` | **数值一致 ✅，但 index.astro 是门禁外的手工副本**（F5） |
| 4 | **6 具名作品 vs「有 npm run demo 的目录」** | `site/src/data/courses.ts:289`「勿据『有 npm run demo 的目录数』推算本值：实测为 10…`rag-demo` 的入口是 `demo:eval`」、`site/src/pages/works.astro:411` 同口径 | `README.md:9`「6 个可运行 demo（`npm run demo` 一键复现…）」；我自跑精确 `"demo"` 键目录数 = **10**（含 `my-agent`/`memory-redteam`，不含 `rag-demo`） | **`works.astro`/`courses.ts` 正确 ✅；`README.md:9` 的括注与自己的 `README.md:14` 矛盾 → F2（high）** |
| 5 | **8 页 × 3 视口** | `README.md:28`「3 视口（375/768/1280）× 8 页（含自定义 404 页，t20）」 | `site/tools/visual-check.mjs:63–73` PAGES **8** 项 + `:78–82` VIEWPORTS **3** 项 → 主流程 `all.length = 8×3 = 24` | **一致 ✅**；但 `8 页` 与「8 静态页」不是同一集合 → F7（medium） |
| 6 | **21 / 24 / 26 断言** | `README.md:28`「（21/21）…（24/24）…--selftest（26/26）」 | `visual-check.mjs:383–427` 逐段 `expect()` 计数 = 3×2(§1) + 3×2(§2) + 3×2(§3) + 3×2(§4) + 2(§5) = **26**；`:334` 打印 `${PAGES.length} 页 × 3 视口` = 24；404 页加入前 7×3 = 21 | **内部一致 ✅**（CI 侧 run 号与绿结果**未验证**，见末节） |
| 7 | **18 / 18 层（记忆消融）** | `README.md:25`「16 条红队探针（逐层消融 18/18 层承重）」、`notes/knowledge-map.md:150`「16 条探针 + 逐层消融 18/18 层」 | 我静态复算 `memory-redteam/src/redteam.mjs`：`grep -c "ablate: '"` → **13** + 数组声明 `:41`(3 层) / `:262`(2 层) = **18 层**；`:343` `ablate: null`（R11 跳过）→ 可消融探针 **15** | **一致 ✅**（`16 条探针 / 15 条可消融 / 18 层`三者关系只在 `memory-redteam/README.md:15,38` 有定义 → F12 low） |
| 8 | **recall 三值** | `notes/knowledge-map.md:19`「recall@3 = 0.31 / @5 = 0.44 / @10 = 0.50，PASS 3/8，132 chunks」 | `README.md:14`、`rag-demo/README.md:66`、`notes/rag.md:293`、`notes/long-term-memory.md:219,:488`、`site/src/data/mvps.ts:55` 全部同值；旧值 `1.00/0.94` 命中处逐条带「已废/未验证」限定语 | **一致 ✅**（唯一疏漏：`notes/interview-bank.md:151` 只写 @3/@5，属部分引用非矛盾） |

> **F0（无 finding，记录为已清干净）**：旧值「10 个源文件 / 10 个 src 文件 / 10 src / 9 源文件」在全仓**活文件 0 处**。
> 复现：`grep -rn "9 源文件\|9 个源文件\|10 个源文件\|10 个 src\|10 src\|13 个源文件\|13 个 src\|13 src" --include='*.{md,ts,astro,mjs}' .`
> → 命中仅 3 类：① 现行 13 的四处副本（`README.md:13`、`works.astro:101`、`mvps.ts:47`、`site-refactor-plan.md:123`）；② `restructure-verify.md:409–410`、`restructure-review-content.md:40,60–68,177` 的**历史报告转述**（含「改前→改后」对照）；③ 其它视角报告 `analysis/content/02-accuracy.md:329`。**无一处未改的旧值活表述**。

---

## 0.1 「必须回答」5 组的逐项落点（含归口其它视角、本文不重复计数的项）

| 必须回答 | 本文落点 |
|---|---|
| 1) 同一数字的多处副本是否一致（13/10 源文件、19/17/33、205/37、6 作品 vs demo 目录、8 页×3 视口、21/24/26、18/18 层、recall 三值） | §0 表（成对 file:line 逐组）+ F1、F2、F6、F7 |
| 2) 已划改结论的旧表述是否仍活（含同义变体；旧三档 P0/P1/P2） | §F0（10/9 源文件、旧 recall 值 = 0 处活残留）+ F1（11 spans 活残留）+ F2（已更正措辞复活）+ F6（34 页）+ **F4（旧三档 P0/P1/P2 大量存活）** |
| 3) 术语/命名漂移（一物多名 / 一名多义 / 首次定义与后用） | F10（5 个漂移名）+ F11（demo:otel vs demo:otel:mock）+ F4（P0–P2 同名不同义）+ F7（「8 页」一名两集合）+ F12（探针 15/16 无集中定义） |
| 4) 版本号/日期不一致 | **F8（构建时长 8 分钟 vs 17 分钟）** + **F9（SDK 版本 1.4.21 vs 1.5.0）**；recall/日期锚点侧一致（§0 #8、`knowledge-map.md:9` 的「10-17」历史更正已就地划改）。**归口其它视角**：① **模型名** —— `harness-demo/src/llm.ts` 默认值与 `.env.example` 不一致，已由 `analysis/content/02-accuracy.md` 登记（本文只确认模型名在各 README / `.env.example` 间一致：`qwen3.8-flash-next`）；② **「LLM 时间线 12 节点 vs /nav 10 节点」** —— 已由 `analysis/content/02-accuracy.md:206`（其 F8）登记；本文确认两套节点数各自内部自洽（`notes/llm-timeline.md` 数据行 12；`llm-history.ts` 的 `LLM_HISTORY` + `LLM_EVOLUTION` 由 `nav.astro:31` 按 `LLM_HISTORY.length` 渲染） |
| 5) 五阶段体系 vs 旧三档是否清理干净（`course-structure.ts` stage 为唯一源头 vs 遗留 `phase`） | **F4（结论：未清理干净）** + F5（门禁不覆盖 `phase`/`stage` 一致性）；另核 `notes/process/site-refactor-plan.md:333`（「仍是旧三档…属遗留债务」）与 `:484` / `courses.ts:300`（「已完成收口…P0/P1/P2 无读方」）**两种表述同时存活** |

> **口径（不重复计数声明）**：同仓其它视角报告已登记的同类问题不在本文重复计数，仅作交叉引用：`analysis/content/05-coverage.md:317`（其 F7「站点文案出现第三套 demo 计数『17 个 demo』」）与 `analysis/content/02-accuracy.md`（模型默认值、10/12 节点）。本文 F2 与之**不同**：F2 针对的是 `README.md:9` 把「6 具名作品」与「有 `npm run demo` 的目录」混成一句，与 `works.astro:411`/`courses.ts:289` 的明文口径冲突。

---

## F1（high）OTel 埋点 span 数在用户可见页仍是旧报告值「11 spans / 1 trace」，且被冠以「实测」

- `id`：`consistency-F1`
- `severity`：**high**
- `对象`：`site/src/pages/works.astro:133`（+ 同页 `:393`）
  > `:133` `<tr><td class="sec">OTel 埋点</td><td><code>npm run demo:otel</code></td><td>OTel GenAI span 实测 11 spans / 1 trace</td></tr>`
  > `:393` `<span class="rm-desc">harness-demo otel.ts 已 console 导出（demo:otel 实测 11 spans/1 trace）；下一步 OTEL_EXPORT_OTLP=1 接真实 collector…`
- `现象`：仓库对「OTel span 数」有两套值且在**同一仓内互相矛盾**：「11 spans/1 trace」是**无可复跑日志的活端点报告值**（全仓其它位置一律标「未验证」），离线可重跑判据的确定值是 **15 spans/1 trace**。`works.astro` 是唯一两处仍把 11 当**现行「实测」**陈述的地方，且这是用户可见页面（作品详解页 + Roadmap 段），既无「历史/未验证」限定语，也与本仓断言契约（`EXPECTED.spanTotal = 15`）冲突。
- `证据`（我跑的命令原文 + 关键输出）：
  ```bash
  grep -rn "11 spans\|11 span" --include=*.md --include=*.ts --include=*.astro . 2>/dev/null \
    | grep -v node_modules | grep -v '\.agent-teams' | grep -v jd-research
  # ./site/src/pages/works.astro:133:…OTel GenAI span 实测 11 spans / 1 trace
  # ./site/src/pages/works.astro:393:…demo:otel 实测 11 spans/1 trace…
  # ./harness-demo/src/otel-mock-scenario.ts:8:…历史材料里的「11 spans / 1 trace」在仓库内**没有任何可复跑证据**（审计 U-23 / C-14）
  # ./harness-demo/README.md:39:…历史活端点报告值「11 spans」标未验证、不作判据
  # ./harness-demo/src/otel-mock-scenario.ts:57:  historicalReportOnly: { spans: 11, traces: 1, source: "handoff.md:77 / notes/harness-from-scratch.md:210（活端点报告值，无可复跑日志）" },

  grep -rn "15 spans\|15 span" --include=*.md --include=*.ts --include=*.astro . 2>/dev/null | grep -v node_modules | grep -v '\.agent-teams'
  # ./harness-demo/src/otel-mock-scenario.ts:50:  spanTotal: 15,          ← EXPECTED 契约（otel-assert.ts:42 按它断言）
  # ./harness-demo/README.md:38:…确定性 span 树 15 spans / 1 trace（2026-10-12 实跑值）
  # ./notes/observability.md:109:…断言 15 spans/1 trace…
  # ./notes/knowledge-map.md:165 / ./handoff.md:77 / ./notes/details/06-observability-loop.md:27 / ./site/src/data/{course-structure.ts:228,281,mvps.ts:88}
  ```
  即：**11 的「活表述」仅剩 `works.astro` 两处**；`otel-mock-scenario.ts:50` 的 `EXPECTED.spanTotal = 15` 是 `otel-assert.ts:42` 的断言依据。
- `影响`：同一事实在仓内 2 个值、`works.astro` 站错一边 —— 读者（以及未来抄数字的人）会把「11」当权威值；这正是「只改一处、留下互相矛盾处」在 audit 侧已被记过（`.agent-teams/archive/learn-site-audit/team.json` 里 U-23 明确把 11 从「✅ 实测」改为「报告值/未验证」）之后**又在站点侧回流的同一类失真**。
- `建议方向`：把 `works.astro:133/:393` 的 11 就地划改为「离线 mock 15 spans/1 trace（2026-10-12 可重跑；历史活端点 11 spans 未验证、不作判据）」，与 `harness-demo/README.md:38–39` 同措辞；并把这句纳入 `check-counters.mjs` 的副本交叉核对（见 F5）。
- `置信度`：**高** —— 值来自源码常量与断言脚本，纯文本可判定；「11 无回放日志」由 `otel-mock-scenario.ts:8/:57` 自述，不需外部复跑。
- `归属`：`内容`

---

## F2（high）`README.md:9`「6 个可运行 demo（`npm run demo` 一键复现）」与同文件 `:14`、以及全仓口径块矛盾

- `id`：`consistency-F2`
- `severity`：**high**
- `对象`：`README.md:9`
  > `6 个可运行 demo（\`npm run demo\` 一键复现；即下表六个**具名作品**目录——\`memory-redteam/\` 为回归套件/自研实操证据，按口径块**不计入作品数**…`
- `现象`：把「6 个具名作品」与「`npm run demo` 一键复现」等同于一个集合 —— 但 6 个具名作品里 `rag-demo` **没有** `demo` 键（其入口是 `demo:eval`，`README.md:14` 自己就是这么写的），而真正有 `demo` 键的目录是 **10** 个。同一页内 `:9` 与 `:14` 直接冲突；口径块与 `courses.ts:289` / `works.astro:411` 已明文否掉这句措辞。
- `证据`（我跑的命令原文 + 关键输出）：
  ```bash
  # A 处
  sed -n '9p' README.md      → 6 个可运行 demo（`npm run demo` 一键复现；即下表六个**具名作品**目录…
  sed -n '14p' README.md     → | [`rag-demo/`] … | `cd rag-demo && npm i` → `npm run demo:eval` |
  # B 处（实测真值）
  for f in $(git ls-files | grep 'package.json$' | grep -v node_modules); do \
    d=$(dirname "$f"); if grep -q '"demo":' "$f"; then echo "YES $d"; fi; done | sort
  #   YES api-demo / durable-execution-demo / flywheel-demo / framework-demo / harness-demo
  #   YES mcp-demo / memory-redteam / model-basics-demo / my-agent / sandbox-demo       ← 10 个
  #   无 rag-demo（其 scripts 只有 demo:retrieval / demo:bm25 / demo:rag / demo:eval）
  node -e "const p=require('./rag-demo/package.json');console.log(Object.keys(p.scripts))"
  #   [ 'demo:retrieval', 'demo:bm25', 'demo:rag', 'demo:eval' ]      ← 无精确 "demo" 键
  ```
  同仓权威表述：`site/src/data/courses.ts:289`「⚠️ 勿据『有 `npm run demo` 的目录数』推算本值：实测为 10…`rag-demo` 的入口是 `demo:eval`，反而不在那 10 个里」；`site/src/pages/works.astro:411` 同口径；`notes/knowledge-map.md:16`「**不是『所有带 demo 脚本的目录』**（该措辞在 memory-redteam 加上 demo 脚本后已不成立，就地更正）」。
- `影响`：`README.md` 是访客第一入口，这句把已经就地更正过的错误措辞复活；且「一键复现」是 clone 判据的核心承诺，对 `rag-demo` 是假的（跑 `npm run demo` 会直接失败）。
- `建议方向`：把 `:9` 改为「6 个**具名作品**目录（`README.md` 下表；跑法见各行——`rag-demo` 为 `npm run demo:eval`），另有 5 个非作品 demo 目录（`api-demo`/`flywheel-demo`/`model-basics-demo`/`my-agent`/`memory-redteam`），故『有 `npm run demo` 的目录』实为 10，与本值不是同一口径」；并把这句交给门禁（F5）。
- `置信度`：**高** —— 我在本地对 `package.json` 逐个数过（10），`rag-demo` 无 `demo` 键为客观事实。
- `归属`：`内容`

---

## F3（high）知识域数在同一文件内 15 与 16 并存，且该文件自己宣告「15 域」为冻结口径

- `id`：`consistency-F3`
- `severity`：**high**
- `对象`：`handoff.md:191`（口径声明）vs `handoff.md:199` / `handoff.md:14`（16 域）
  > `:191` `六个口径（15 域/17 页/18 卡/6 作品/205+37 题）以 knowledge-map 头部口径块为唯一参照、别处只引用不改写`
  > `:199` `…**十六个知识域**知识结构已建成，开课 = 展开讲解 + 提问演练…`
  > `:14` `…+ \`details/\` 分水岭 8 页（knowledge-map 升 **16 域**）…`
- `现象`：`handoff.md`（唯一的交接/维护记录，`README.md:54` 指定读者从此读起）自己宣告 15 域为冻结口径，却在同一文件的另两处写 16 域。冻结口径侧：`notes/knowledge-map.md:12`「知识域 15 = 课程总表 14 编号课 + Harness 架构主线」、`:72` 同式、`README.md:38`「15 个知识域状态」、`site/src/data/courses.ts:275`「知识域口径：14 编号课 + Harness 架构主线 = 15」、`site/src/components/DomainMap.astro:72` 构建期断言与 `DOMAIN_COUNT` 相等。16 无任何活口径支撑。
- `证据`（我跑的命令原文 + 关键输出）：
  ```bash
  grep -rn "个知识域\|16 域\|15 域\|知识域 1[0-9]" --include=*.md --include=*.ts --include=*.astro \
    README.md handoff.md notes site/src | grep -v node_modules
  # ./README.md:38:…15 个知识域状态…
  # ./handoff.md:10:…15 个知识域状态 + 分阶段顺序 + 完成判据
  # ./handoff.md:14:…（knowledge-map 升 16 域）
  # ./handoff.md:119:### 4.1 知识点总览(15 个知识域 + 面试结构)
  # ./handoff.md:191:…六个口径（15 域/17 页/18 卡/6 作品/205+37 题）…
  # ./handoff.md:199:…十六个知识域知识结构已建成…
  # ./notes/knowledge-map.md:12:> · **知识域 15** = 课程总表 14 编号课 + Harness 架构主线 `agent-harness.md`
  # ./notes/knowledge-map.md:72:> 口径：课程总表 14 行 = 14 个编号课；另加 1 条主线…合计 15 个知识域。
  # ./site/src/data/courses.ts:275: * 知识域口径：14 编号课 + Harness 架构主线 = 15。
  node site/tools/check-counters.mjs | grep 知识域     → 知识域  声明 15  重算 15  ✅
  ```
- `影响`：读者从 `handoff.md:14/:199` 读入会得到「16 域」，与站点首页（`index.astro:51` 由 `DOMAIN_COUNT` 渲染）、`README.md:38` 的 15 直接矛盾；且 `handoff.md:191` 正是抄数字者最可能信任的「数字引用规范」条目 —— 规范条与违反条在同一文件，正是全局纪律 #4「更正要就地划改」的典型漏项。
- `建议方向`：就地划改 `handoff.md:14`「knowledge-map 升 16 域」→「（当时口径；现冻结为 15 域 = 14 编号课 + agent-harness 主线，见 :191 与口径块）」、`:199`「十六个知识域」→「十五个知识域」；若 16 曾是有效历史值，须在行内标注为历史并给出当时的算式（当前仓内无 16 的算式可复现）。
- `置信度`：**高** —— 两侧原文均在活文件里，且门禁复算 15 全绿。
- `归属`：`内容`

---

## F4（high）旧三档 P0/P1/P2 未清理干净：同一课程在 `knowledge-map` 表/图与 `courses.ts phase` 里带旧档位，其中 9 处与五档 `stage` 冲突

- `id`：`consistency-F4`
- `severity`：**high**
- `对象`（成对，全部实测行号）：
  - A：`notes/knowledge-map.md:55–68`（课程总表「优先级」列）+ `:85–98`（依赖图节点标签）
    > `:59` `| 沙箱与凭据·可复现 | **P0** | 📐 讲义已展开…` / `:61` `| durable execution | **P1** | 📐 |…` / `:67` `| 框架生态 | **P2** | 📐 讲义已展开…`
  - B：`site/src/data/course-structure.ts:20`（五档唯一真源）+ 各条 `stage`
    > `:20` `export const STAGES = ['P0', 'P1', 'P2', 'P3', 'P4'] as const;` / `:168` `stage: 'P1',`（sandbox）/ `:238` `stage: 'P2',`（durable-execution）/ `:344` `stage: 'P4',`（framework-ecosystem）
  - C：`site/src/data/courses.ts:37` `phase: 'P0' | 'P1' | 'P2' | '—';`（类型）+ 各条 `phase` 值（如 `:83` sandbox `'P0'`、`:147` durable `'P1'`、`:222` framework `'P2'`）
- `现象`：`notes/knowledge-map.md` 的课程总表与依赖图仍按**旧三档**给 14 门课标 P0/P1/P2（无 P3/P4），`courses.ts` 的 `phase` 字段值也是旧三档；而站点侧唯一真源是 `course-structure.ts` 的五档 `stage`。逐课比对后 **9/17** 处不一致（sandbox、evaluation、multi-agent、durable-execution、api-engineering、data-flywheel、long-term-memory、model-basics、framework-ecosystem），例如读者从 `knowledge-map.md:59` 读到 sandbox = P0（基础篇），而站点 `/learn/`、`/c/sandbox/` 显示 P1（工具与安全）。
- `证据`（我跑的命令原文 + 关键输出）：
  ```bash
  sed -n '53,68p' notes/knowledge-map.md | awk -F'|' '{print NR": "$2" | "$3}'
  # 5:  Agent 系统设计模板  |  P0        9:  durable execution  |  P1
  # 7:  沙箱与凭据·可复现   |  P0       13:  数据飞轮           |  P1
  # 10: 评测工程化         |  P0       14:  模型基础           |  P2
  # 16: 多智能体编排       |  P0       15:  框架生态           |  P2
  grep -n "slug: '\|stage: '" site/src/data/course-structure.ts
  # :83 llm-timeline / :99 harness-from-scratch / :116 agent-harness / :132 rag / :148 system-design → stage P0
  # :166 sandbox → P1   :183 mcp → P1   :200 evaluation → P1   :217 multi-agent → P1
  # :236 durable-execution → P2  :253 api-engineering → P2  :270 observability → P2
  # :289 long-term-memory → P3   :306 data-flywheel → P3   :323 model-basics → P3
  # :342 framework-ecosystem → P4   :359 industry-2026 → P4
  grep -rn "\.phase\b\|phase:" --include=*.ts --include=*.astro site/src
  # site/src/data/courses.ts:83: slug 'sandbox', domain '沙箱与凭据', phase: 'P0'
  # site/src/data/courses.ts:147: slug 'durable-execution', …, phase: 'P1'
  # site/src/data/courses.ts:222: slug 'framework-ecosystem', …, phase: 'P2'
  # site/src/pages/c/[slug].astro:61: <span class="chip">{structure ? structure.stage : meta.phase === '—' ? '未分阶段' : meta.phase}</span>
  ```
  逐课冲突清单（A=kills-map 表/图，B=stage）：sandbox P0→P1、evaluation P0→P1、multi-agent P0→P1、durable-execution P1→P2、api-engineering P1→P2、data-flywheel P1→P3、long-term-memory P2→P3、model-basics P2→P3、framework-ecosystem P2→P4 = **9 处**。
  `notes/process/site-refactor-plan.md:333`（活规格章节）自己也承认：「`courses.ts` 的 `phase` 仍是旧三档（P0/P1/P2 + `—`），与 `course-structure.ts` 的五档并存…属遗留债务，建议后续统一收口为单一真源」；而 `notes/process/site-refactor-plan.md:484` 又写「**已完成**（sprint 4 / t36）」、`courses.ts:300` 写「`phase` 字段已降为 legacy…P0/P1/P2 无读方」——**「仍有冲突值」与「已收口」两种表述同时活着**，且 `c/[slug].astro:61` 的兜底分支保留了对 `meta.phase` 的渲染路径（结构缺失时会把旧三档标签印到用户页面上）。
- `影响`：这是「五阶段课程体系」口径战的残留前线：课程优先级/阶段定位在 notes 层与站点层各说一套，9 门课的档位不同；任一新同学（或 LLM）按 `knowledge-map.md` 编排学习路线会得到与站点不一致的顺序，且 P0 在旧口径里是「最高优先级」、在新口径里是「基础篇」，**同名不同义**。
- `建议方向`：① `knowledge-map.md:55–68/:85–98` 的「优先级」列就地迁移为五档 `stage`（或改名「历史优先级(旧三档)」并加限定语，同时补 P3/P4）；② `courses.ts` 的 `phase` 要么删除、要么把值同步为 `stage` 并删除 `c/[slug].astro:61` 的 `meta.phase` 兜底分支（改为 `structure ? structure.stage : '未分阶段'`），使「阶段唯一真源 = course-structure.ts」名副其实；③ 给 `check-counters.mjs` 增加一条断言：`courses.ts` 里所有非 `—` 的 `phase` 必须不存在（或等于 `stage`）。
- `置信度`：**高** —— 两侧行号与值逐一取自源码文本，冲突清单可重算。
- `归属`：`内容`

---

## F5（medium）门禁只覆盖 3 处副本：`index.astro` 手写的 205/37、与多处手写的 17 不在门禁内

- `id`：`consistency-F5`
- `severity`：**medium**
- `对象`：`site/src/pages/index.astro:34–35`（+ `:33` 的注释自证它「引用」口径块）
  > `:33` `// 题目计数口径见 notes/knowledge-map.md 头部「计数口径」块（课内嵌 205 + 面试题库精选 37）。`
  > `:34` `const Q_IN_LESSON = 205;`　`:35` `const Q_BANK = 37;`
  同类手工副本：`site/src/pages/nav.astro:17`「…17 门课线性阅读序」、`site/src/pages/404.astro:37`「17 个课程页…」、`site/src/layouts/Base.astro:14`「…17 课 · P0–P4 线性路线…」
- `现象`：口径块 `notes/knowledge-map.md:11` 自称「**全仓唯一参照，其余位置只引用本块、不另起数**」，`handoff.md:191` 同规；`check-counters.mjs` 的存在理由正是把这条约定机器化（其头注释自述「实测已发生多起『修一处、漏两处』」）。但它 `# 3b) 副本交叉核对`（`check-counters.mjs:330–352`）只核对 `README.md` / `courses.ts` 注释 / `verify.yml` **三处** —— `index.astro:34–35` 的 205/37 与四个页面手写的 17 **都不在任何判据里**，数字改了不会红。
- `证据`（我跑的命令原文 + 关键输出）：
  ```bash
  node site/tools/check-counters.mjs; echo "EXIT=$?"
  # ✅ 口径全部一致（判据 12 条 + 副本 7 处）   EXIT=0
  # ── 副本交叉核对（同一口径的其余手工副本必须与口径块一致）──
  # ✅ README.md 声明「19 篇课程内容」/ README.md dist HTML=33 / courses.ts 注释声明「notes 顶层 19 −」
  # ✅ courses.ts 注释声明课程页 17 / 课程卡 18 / verify.yml 等值断言 -eq 33 / verify.yml 含 nav/index.html
  #   ← 7 处副本全部集中在 README.md / courses.ts / verify.yml；无 index.astro / nav.astro / 404.astro / Base.astro
  grep -n "Q_IN_LESSON\|Q_BANK" site/src/pages/index.astro      → :34 / :35
  grep -n "17 门课\|17 个课程页\|17 课 ·" site/src/pages/nav.astro site/src/pages/404.astro site/src/layouts/Base.astro
  #   nav.astro:17 / 404.astro:37 / Base.astro:14
  ```
  另注：门禁头注释自己点名了 `courses.ts` 注释曾写「有 npm run demo 的目录数 = 6」（该条至今只靠 `courses.ts:289` 的注释自律、无断言），即**已知的两类失真（副本漏检、demo 计数）都还没有判据**。
- `影响`：口径块承诺的「唯一参照」在事实上不成立；`index.astro` 是首页，`COURSE_COUNT` 是派生值而 `Q_IN_LESSON` 是字面量 —— 一旦题库变动（题库仍在增长：`knowledge-map.md:8` 记录每课题库 +2 题），门禁会全绿而首页数字静默过期。
- `建议方向`：在 `check-counters.mjs:330` 的副本段补入：`index.astro` 的 `Q_IN_LESSON/Q_BANK`、`Base.astro:14` / `nav.astro:17` / `404.astro:37` 的字面 17（或把这几处改为从派生常量插值，从根上消灭副本）；同时对「有 `npm run demo` 的目录数」加一条从 `**/package.json` 派生的断言（照 `courses.ts:289` 的 10 逐项加平）。
- `置信度`：**高** —— 门禁输出与副本清单为该脚本自身的打印，可复跑。
- `归属`：`内容`

---

## F6（medium）「站点 34 页」在 `site-refactor-plan` 里仍是活表述，与口径块 33 / CI 等值断言 33 冲突

- `id`：`consistency-F6`
- `severity`：**medium**
- `对象`：`notes/process/site-refactor-plan.md:358`、`:385`、`:430`（+ `:436` 的前向指针）
  > `:385` `- **必须 CI 复验**：…确认 \`dist/\` 产出 **34 页**、\`/nav\`、\`/learn\`、各 \`/c/<slug>/\` 学习路径模块成品 HTML…`
  > `:430` `- **留 CI 复验 34 页 HTML + 浏览器目检**：…确认 \`dist/\` **34 页**…`
  对照：`notes/knowledge-map.md:18`「**站点 html 33**」、`.github/workflows/verify.yml:105` `test "$count" -eq 33`
- `现象`：33 已是冻结口径（三桶互斥且穷尽、门禁逐桶实算），而同一份 process 文档 §11.4/§12.4 仍以 34 为验收值。34 在仓内**没有任何算式**能凑出（33 的三桶划分下 `details/index` 二次计入才会得 34，正是 `restructure-review-content.md:37` F5 指出的错法）。文档文首 `:9` 的「历史口径保留」条款**只覆盖** `notes/*.md=N` 这类时点快照与 Duplicate-id WARN，**不覆盖页数**；而 `:436` 又写着「『留 CI 复验 34 页』…仍滚动到 §13.5」，指向的 §13.5(`:478`) 已把该条改写成不含数字的「全页成品」——即**前向指针指到一个已不含 34 的段落**。
- `证据`（我跑的命令原文 + 关键输出）：
  ```bash
  grep -rn "34 页" --include=*.md --include=*.ts --include=*.astro . 2>/dev/null | grep -v node_modules | grep -v '\.agent-teams'
  # ./notes/process/site-refactor-plan.md:358:…（同命令在 capped 可用环境 t2–t4 均 exit 0 / 34 页…）
  # ./notes/process/site-refactor-plan.md:385:…确认 dist/ 产出 34 页…
  # ./notes/process/site-refactor-plan.md:430:…确认 dist/ 34 页…
  # ./notes/process/site-refactor-plan.md:436:…「留 CI 复验 34 页」…仍滚动到 §13.5。
  sed -n '478p' notes/process/site-refactor-plan.md
  # - **留 CI 复验全页 HTML + 浏览器目检**：…复验 `dist/` 全页成品与 `/nav`…      ← 数字已被就地删掉
  sed -n '9p' notes/process/site-refactor-plan.md
  # > ② **历史口径**：§11–§13 及 sprint 记录里出现的 `notes/*.md=N`（20 / 22 / 24 等）是各 sprint 当时时点的实测快照…
  ```
- `影响`：读者/后续任务会以「复验 34 页」为验收边界，而 CI 等值断言是 33、门禁实算 33 —— 复验必然对不上，属「自设验收边界」的隐患（全局纪律 #3）；且该文档被声明为「给后续工程任务的唯一输入文档」（`:2`）。
- `建议方向`：把 `:358/:385/:430` 的 34 就地划改为 33（或统一改为「全页成品（数量以 CI 等值断言 33 为准）」），并在 `:436` 的前向指针里去掉数字；若 34 确为某 sprint 的时点快照，须在该行显式标注「时点快照」并给出当时的枚举算式（仓内无）。
- `置信度`：**中高** —— 33/34 三处原文与门禁实算均可复跑；34 的「是否为某时点真值」我未取到独立证据（故未判 blocker）。
- `归属`：`内容`

---

## F7（medium）同一个「8 页」实为两个不同集合：口径块的「8 静态页」含 `nav`，视觉回归的 8 页不含 `nav` 却含 `c/rag`

- `id`：`consistency-F7`
- `severity`：**medium**
- `对象`：`README.md:28`「3 视口（375/768/1280）× **8 页**（含自定义 404 页，t20）」 vs `notes/knowledge-map.md:18`「**8 静态页**（index / learn / works / map / interview / **nav** / 404 / details/index）」
- `现象`：两处都写 8，但成员集合不同：`visual-check.mjs:63–73` 的 PAGES = `''`(home) / `learn/` / `works/` / `interview/` / `map/` / `details/` / `c/rag/` / `404.html`（**无 `nav/`**，且含一个课程页）；口径块的「8 静态页」含 `nav/` 与 `details/index` 但**不含** `c/rag`。数字相同 → 极易被读成同一件事，实际一处的「8」是路由桶、另一处的「8」是回归用例清单。
- `证据`（我跑的命令原文 + 关键输出）：
  ```bash
  grep -n "const PAGES\|const VIEWPORTS" site/tools/visual-check.mjs          → :63 / :78
  sed -n '63,73p' site/tools/visual-check.mjs
  # { path: '' …home } / learn/ / works/ / interview/ / map/ / details/ / c/rag/ / 404.html   ← 8 条，无 nav/
  grep -rn "8 静态页" --include=*.md --include=*.yml . | grep -v node_modules
  # notes/knowledge-map.md:18:…**8 静态页（index / learn / works / map / interview / **nav** / 404 / details/index）…
  # .github/workflows/verify.yml:86:#      · 8 静态页（…）：#        index / learn / works / map / interview / nav / 404 / details/index
  ```
  含义差异有实质后果：`knowledge-map.md:18` 的历史链自述「『6 静态页…=32』的枚举漏了 `nav`」，而**补齐 `nav` 后新增的 `/nav/` 页面至今不在任何几何/结构回归的页面清单里**（CI 只对上述 8 页做 3 视口断言）。
- `影响`：跨篇引用「8 页」时无法确定指哪套；`/nav/` 作为本轮口径修正的关键新增页，其渲染正确性只有「构建产物存在且非空」(`verify.yml:103–110` 关键页非空) 一层，没有几何断言。
- `建议方向`：把两处措辞区分开（口径块用「8 个静态路由」，`README.md:28` 用「回归覆盖 8 个代表页（home/learn/works/interview/map/details/c-rag/404）」），并把 `nav/` 加入 `PAGES`（使其成为第 9 页、断言数 27）或在 README 明示 `/nav/` 不在几何回归内。
- `置信度`：**高**（集合成员逐一读自源码/口径块）；「nav 无几何断言」为高置信推断（`PAGES` 是唯一页面清单，`checkOne` 只遍历它）。
- `归属`：`内容`（其「是否补测 `/nav/`」的决策属显示形式，见附录）

---

## F8（medium）本机构建时长两个口径并存：`README.md` 的「约 8 分钟」vs CI/工具的「约 17 分钟」

- `id`：`consistency-F8`
- `severity`：**medium**
- `对象`：`README.md:28`「本机全量构建**可约 8 分钟**成功（2026-10-14 复测 `astro build` 484s / exit 0…此前另有 17 分钟与 560s 超时被杀的非 OOM 记录）」 vs `site/tools/visual-check.mjs:6` / `.github/workflows/verify.yml:6`「本机全量构建**可以在约 17 分钟内**成功完成」
- `现象`：同一次「证伪必然 OOM」的结论，`README.md` 已按 2026-10-14 的最新复测把主口径改为 8 分钟（并把 17 分钟降级为「此前另有」），但工具头注释与 CI 注释仍以 17 分钟为现行表述。两处都是活文件（工具脚本 + workflow），且都用「约」而无日期限定。
- `证据`（我跑的命令原文 + 关键输出）：
  ```bash
  grep -n "约 17 分钟\|约 8 分钟" site/tools/visual-check.mjs .github/workflows/verify.yml README.md
  # site/tools/visual-check.mjs:6: * …2026-10-13 t21 独立实测证伪「必然 OOM」——本机全量构建可以在约 17 分钟内成功完成
  # .github/workflows/verify.yml:6:#     可以在约 17 分钟内成功完成（首次 560s 超时被杀**非** OOM，dist HTML=32 含 404.html），
  # README.md:28:…本机全量构建可约 8 分钟成功（2026-10-14 复测 `astro build` 484s / exit 0…）
  ```
- `影响`：构建时长是「可行但不可依赖」这一结论的量化依据；两个值并存会让读者无法判断哪个是现行口径（且 `verify.yml:6` 里同时挂着旧的 `dist HTML=32`，与同文件 `:105` 的 33 等值断言并列，属同一段的陈旧数字）。
- `建议方向`：统一为「2026-10-14 复测 484s（约 8 分钟）；2026-10-13 及以前有约 17 分钟与 560s 超时记录」一句，三处同措辞；同时把 `verify.yml:6` 的 `dist HTML=32` 就地改为 33（或删去该括号）。
- `置信度`：**高**（三处原文可复跑）；**未验证**：484s / 17 分钟 / 560s 这些数字本身我未复跑构建（边界见末节）。
- `归属`：`内容`

---

## F9（medium）SDK 版本清单未随核实台账刷新：`1.4.21` 仍作现行版本出现在三处，而台账声称「六处已同步 1.5.0」

- `id`：`consistency-F9`
- `severity`：**medium**
- `对象`：`README.md:18`、`notes/interview-bank.md:97`、`notes/framework-ecosystem.md:111`
  > `README.md:18` `② **三家 SDK 同任务离线 mock 对照**（Claude Agent SDK 0.3.296 / OpenAI Agents SDK 0.20.0 / **LangGraph 1.4.21**）…`
  > `notes/framework-ecosystem.md:111` `口径声明（不得省略）…版本：Claude Agent SDK \`0.3.296\` / OpenAI Agents SDK \`0.20.0\` / **LangGraph \`1.4.21\`**。`
  对照：`notes/industry-2026.md:35`「截至 2026-10-13 复核 registry latest = **1.5.0**」、`notes/industry-2026.md:108`「…**六处已同步刷新为 1.5.0**」、`notes/framework-ecosystem.md:99/:292`、`notes/multi-agent.md:199`
- `现象`：仓内已建立「版本以最新核实为准 + 旧值标注为历史快照」的台账纪律，`industry-2026.md:108`（4a 行）明确声称六处已刷新为 1.5.0；但 `README.md:18`、`interview-bank.md:97`、`framework-ecosystem.md:111` 仍把 `1.4.21` 平铺在版本清单里、既无日期也无「对照实跑快照」限定语（仅 `framework-ecosystem.md:422` 有该限定语）。读者从 `README.md`/`interview-bank.md` 读入会得到过期版本。
- `证据`（我跑的命令原文 + 关键输出）：
  ```bash
  grep -rn "0\.3\.296\|0\.20\.0\|1\.4\.21\|1\.5\.0" --include=*.md --include=*.ts --include=*.astro --include=*.json . \
    | grep -v node_modules | grep -v '\.agent-teams' | grep -v package-lock
  # ./README.md:18:…Claude Agent SDK 0.3.296 / OpenAI Agents SDK 0.20.0 / LangGraph 1.4.21…
  # ./notes/interview-bank.md:97:…（Claude Agent SDK 0.3.296 / OpenAI Agents SDK 0.20.0 / LangGraph 1.4.21）…
  # ./notes/framework-ecosystem.md:111:…版本：…/ LangGraph `1.4.21`。
  # ./notes/framework-ecosystem.md:99:…~~1.4.21~~ **截至 2026-10-13 全新缓存复核：npm registry latest = 1.5.0**
  # ./notes/industry-2026.md:35 / :108:…六处已同步刷新为 1.5.0…
  # ./notes/multi-agent.md:199:…~~1.0.1~~ ~~1.4.21~~ **1.5.0**
  # ./framework-demo/package.json:16:    "@langchain/langgraph": "^1.4.21",      ← 锁的是实跑快照，非 latest
  ```
- `影响`：版本号是「时点事实」类内容的典型易腐点；台账声称的「六处已同步」与实际存活的三处不一致，会让人误判「这项工作已完成」（同时 `framework-demo/package.json` 锁 1.4.21 是**有意**的对照快照，需与 latest 区分表述）。
- `建议方向`：三处改为「LangGraph 1.4.21（对照实跑快照 2026-10-12；registry latest 截至 2026-10-13 = 1.5.0，见 `notes/industry-2026.md` 核实台账）」；或在 `industry-2026.md:108` 的「六处」清单里补齐/更正实际处数。
- `置信度`：**中高** —— 文本对照可复跑；「1.5.0 是否仍是今天的 latest」**未验证**（不联网，按 §0 边界）。
- `归属`：`内容`

---

## F10（medium）命名规范被规范文件自身破坏：`knowledge-map` 的命名总表宣告 5 个规范名，课程总表却用 5 个漂移名

- `id`：`consistency-F10`
- `severity`：**medium**
- `对象`：`notes/knowledge-map.md:21–49`（命名总表，自称「唯一真源」） vs 同文件 `:55–68`（课程总表「主题」列）
  > `:21` `## 命名总表(唯一真源)`　`:23–25` `① 每份材料只有一个**规范名**,所有交叉引用 / 站点卡片 / handoff / demo 注释一律用它; ② 规范名**不带「课」字后缀**,不写 A–N 字母代号`
  > `:57` `| Agent 系统设计模板 | P0 |` / `:58` `| Agent 可观测 | P2 |` / `:59` `| 沙箱与凭据·可复现 | P0 |` / `:63` `| MCP 协议 + 供应链安全 | P1 |` / `:64` `| API 实操 + 多模型路由 | P1 |`
  规范名侧：`:33` `| 系统设计 |`、`:40` `| 可观测 |`、`:34` `| 沙箱与凭据 |`、`:37` `| MCP 与供应链安全 |`、`:38` `| API 与多模型路由 |`
- `现象`：同一文件的同一屏内，5 门课出现两个名字（`Agent 系统设计模板` / `系统设计`，`Agent 可观测` / `可观测`，`沙箱与凭据·可复现` / `沙箱与凭据`，`MCP 协议 + 供应链安全` / `MCP 与供应链安全`，`API 实操 + 多模型路由` / `API 与多模型路由`）。而站点数据层用的是规范名（`courses.ts:73` `domain: '系统设计'`、`:83` `'沙箱与凭据'`、`:158` `'MCP 与供应链安全'`、`:168` `'API 与多模型路由'`、`:192` `'可观测'`），即**漂移只发生在「唯一真源」文件自己身上**。另有轻量口径漂移：`site/src/data/courses.ts:37` 属型 `phase: 'P0'|'P1'|'P2'|'—'` 与 `course-structure.ts:20` `STAGES=['P0'..'P4']` 同名不同义（见 F4）。
- `证据`（我跑的命令原文 + 关键输出）：
  ```bash
  sed -n '53,68p' notes/knowledge-map.md | awk -F'|' '{print NR": "$2" | "$3}'
  # 5:  Agent 系统设计模板  |  P0       ← 命名总表:33 的规范名是「系统设计」
  # 6:  Agent 可观测        |  P2       ← 命名总表:40「可观测」
  # 7:  沙箱与凭据·可复现   |  P0       ← 命名总表:34「沙箱与凭据」
  # 11: MCP 协议 + 供应链安全|  P1       ← 命名总表:37「MCP 与供应链安全」
  # 12: API 实操 + 多模型路由|  P1       ← 命名总表:38「API 与多模型路由」
  grep -n "domain: '" site/src/data/courses.ts | sed -n '1,20p'
  # :73 domain: '系统设计'   :83 '沙箱与凭据'   :158 'MCP 与供应链安全'   :168 'API 与多模型路由'   :192 '可观测'
  ```
- `影响`：命名总表是交叉引用（`handoff`、站点卡片、demo 注释）的对照基准；它自身漂移会让「按规范名 grep 全仓」的收口动作漏掉 5 门课，也让读者无法确定「Agent 可观测」与「可观测」是否同一门课。
- `建议方向`：把 `:55–68` 的「主题」列改为与命名总表逐字一致（或在表头注明「本表主题列为历史别名，规范名见 §命名总表」并补齐映射）；同时给 `phase` 与 `stage` 的 P0–P2 命名冲突加限定（如 `stage` 用 `S0–S4` 或让 `phase` 值域改为 `legacy-P0` 之类）。
- `置信度`：**高**（两侧同行号原文）。
- `归属`：`内容`

---

## F11（low）术语漂移：离线 mock 入口被写作 `demo:otel`，与 `demo:otel:mock` 混用

- `id`：`consistency-F11`
- `severity`：**low**
- `对象`：`handoff.md:14`（以及 `notes/observability.md:79` 的「复现命令 `npm run demo:otel`」语境）
  > `handoff.md:14` `…harness-demo OTel 埋点（**demo:otel 离线 mock 实测 15 spans/1 trace**，2026-10-12；历史活端点 11 spans 未验证）…`
- `现象`：`demo:otel` 是**活端点**入口（需真实模型，`harness-demo/README.md:36`），离线确定性复跑入口是 `demo:otel:mock`（`:38`）：两者在同一句里的混用会让「15 spans 是哪条命令跑出来的」不可判定；`handoff.md:77` 的表头则写成 `npm run demo:otel` / `demo:otel:mock`+`demo:otel:assert` 三分，属正确写法。
- `证据`（我跑的命令原文 + 关键输出）：
  ```bash
  grep -rn "demo:otel" --include=*.md README.md handoff.md harness-demo/README.md notes/observability.md | head
  # harness-demo/README.md:36: npm run demo:otel       # …（真实代理，人工补充用）
  # harness-demo/README.md:38: npm run demo:otel:mock  # …确定性 span 树 15 spans / 1 trace（2026-10-12 实跑值）
  # handoff.md:14:…（demo:otel 离线 mock 实测 15 spans/1 trace…）     ← 命令名与「离线 mock」不是同一条命令
  # handoff.md:77:| OTel 埋点 | `npm run demo:otel` / `demo:otel:mock`+`demo:otel:assert` | ✅ 离线 mock 实测 15 spans / 1 trace…
  ```
- `影响`：低——但该句是 `handoff.md` 里被 `otel-mock-scenario.ts:57` 当作「历史值来源」引用的一行，命令名指错会让复跑者拿活端点命令去核对离线值。
- `建议方向`：`handoff.md:14` 就地改为「`demo:otel:mock` 离线 mock 实测 15 spans/1 trace」。
- `置信度`：**高**（`package.json` scripts 与 README 三行对照）。
- `归属`：`内容`

---

## F12（low）「16 条探针 / 15 条探针 / 18 层」三个数字缺一处集中定义，多数引用处无法自证

- `id`：`consistency-F12`
- `severity`：**low**
- `对象`：`notes/knowledge-map.md:150`「16 条探针 + 逐层消融 18/18 层」 / `notes/interview-bank.md:105`「15 条探针/18 层逐层消融全部承重」 vs `memory-redteam/README.md:15,38`「16 条探针：单元级 R1-R11 + 端到端 E1-E5」「15/15 条探针对其防线敏感」
- `现象`：数值本身**正确且自洽**（我静态复算：16 探针 = R1–R11(11) + E1–E5(5)；可消融 15 条；层数 13×1 + 3 + 2 = 18），但「为什么同一 demo 一处说 16、一处说 15」只在 `memory-redteam/README.md` 有定义（16 总数 / 15 声明了防线的探针 / R11 无防线可消融）。跨篇引用（knowledge-map、interview-bank、long-term-memory:279、README.md:25）多用「15 条探针 / 18 层」或「16 条探针」而未标明关系，读者按 15/16 之争去「纠错」会改错值——与 `notes-restructure-plan.md:384` 记录过的「容易误判为双计，复核时不要顺手纠正」属同类陷阱。
- `证据`（我跑的命令原文 + 关键输出）：
  ```bash
  grep -n "ablate" memory-redteam/src/redteam.mjs
  # :26/:57/:75/:97/:119/:142/:162/:183/:199/:242/:291/:306/:327  ← 13 条单防线
  # :41 ablate: ['trustGate','conflictResolve','ttlWindow']      ← 3 层
  # :262 ablate: ['ttlWindow','trustGate']                       ← 2 层
  # :343 ablate: null                                            ← R11 无防线（ablate 模式跳过）
  grep -c "ablate: '" memory-redteam/src/redteam.mjs               → 13
  sed -n '49p;88p' memory-redteam/test.mjs
  # :49  单元级 R1-R11 ${PROBES.length} 条 + 端到端 E1-E5 ${E2E_PROBES.length} 条
  # :88  （逐层验证 ${sensitiveLayers}/${layers} 层：多防线探针每次只关一道，每道都必须承重）
  #  → 13 + 3 + 2 = 18 层；可消融探针 = 15
  ```
- `影响`：低（当前无错值），但三个数字的「口径定义」只在一处，跨篇引用易被误改。
- `建议方向`：在 `notes/knowledge-map.md` 的计数口径块里补一条「记忆红队：探针 16（R1–R11 + E1–E5）｜可消融 15（R11 无对应防线）｜消融层 18」，其余位置只引用。
- `置信度`：**高**（层数/探针数由源码枚举实算）。
- `归属`：`内容`

---

## 转交下一轮（显示形式）

> 只登记，不展开；本条只列本轮在核对口径时**顺带撞见**的显示形式问题。

1. `site/src/pages/works.astro:411` 的「不是有 `npm run demo` 的目录数」警示以 `⚠️` 混在正文段（页尾口径脚注）中，层级上更像正文而非脚注 —— 与 F2 的措辞修正一起做时值得考虑版式。
2. `site/tools/visual-check.mjs:63–73` 的页面清单**不含 `/nav/`**，即本轮口径修正新增的页面没有任何几何/截图回归（F7 的内容面已记；「要不要把 `/nav/` 加进 3 视口截图回归」属显示形式决策）。
3. `site/src/data/courses.ts` 的 `phase` 字段若按 F4 删除，`site/src/pages/c/[slug].astro:61` 的 chip 兜底分支形态会变（`structure ? stage : …`）——影响课程页 meta 栏的 chip 呈现，需目检。
4. `notes/knowledge-map.md:85–98` 的 mermaid 依赖图节点标签（`· P0`/`· P1`/`· P2`）若按 F4 改为五档，图的视觉分组会随之变化。

## 本轮未覆盖 / 未验证

1. **CI 侧证据未验证（无网）**：`README.md:28` 的 run 号（[38282562346](https://github.com/zo0043/learn-agent-harness/actions/runs/38282562346) / [38282852860](https://github.com/zo0043/learn-agent-harness/actions/runs/38282852860) / [38345995909](https://github.com/zo0043/learn-agent-harness/actions/runs/38345995909) / [38350151634](https://github.com/zo0043/learn-agent-harness/actions/runs/38350151634)）与 `21/21`、`24/24`、`dist HTML 文件数=31/32` 这些**日志结论**均未取到原始日志（仓内 `git ls-files` 无 CI 日志留存）；我只验证了断言器侧的计数**机制**（`PAGES=8`、`VIEWPORTS=3`、selftest `expect()` 共 26 次），**未验证**「那几次 run 确实是 21/24/26」。
2. **构建时长数字未复跑**：`484s` / 「约 8 分钟」/「约 17 分钟」/「560s」/「873s」均为转述，我按语料规范 §0.5 未跑 `astro build`（本机约 8 分钟且不可依赖）→ F8 只判定「措辞不一致」，不判定哪个时长更真。
3. **未联网**：`LangGraph latest = 1.5.0`（`industry-2026.md:35/:108`）与 SDK 版本清单的「现行/最新」判定未复核（F9 只判「台账声称六处已同步 vs 实际三处未同步」）。
4. **未跑会写盘的 demo 自检**：`node test.mjs --ablate` / `npm run demo:eval` / `npm run demo:otel:mock` 等**均未执行**（避免改动仓库与产生 `.state/` 产物）。F12 的 18 层与 15 探针是**静态复算**（读 `redteam.mjs` 的 `ablate` 声明与 `test.mjs:65–90` 的累加逻辑），未取得运行输出；同理 §0 表里 rag 三值是核对「多处副本一致」，**不是**我重跑评测得到的。
5. **未覆盖**：`notes/*.md` 课程正文的教学口径（如各课「出口判据：题库 N 题」的逐课题号／题量是否与 `knowledge-map.md:58–68` 的「题库 14 题」逐条吻合）、`notes/process/` 其余 19 份的口径段、根 4 份 restructure 文档的**逐行**通读（只按 grep 命中行抽读，故对其中是否还有其它与我视角相关的旧值不做断言）、各 demo README 的其余数字（`rag-demo` 15 src 我只核了 `ls` = 15 与 `handoff.md:53`/`long-term-memory.md:488` 的表述一致，未逐文件核职责）。
6. **未复算**：`site/dist/` 产物（`site/dist/chunks/*.mjs` 是构建产物，按语料规范排除；其中出现的旧值不视为活表述）与 `.agent-teams/**`（团队状态，只作只读诊断，未作为证据引用）。
