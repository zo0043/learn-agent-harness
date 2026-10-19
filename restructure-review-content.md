# R2 评审报告：t3（内容失真修正）——就地划改完整性与生成器优先

- 评审对象：`t3`「W2：内容失真修正（就地划改 + 计数口径与实数对齐）」，实现者 content-dev
- 评审者：reviewer（未参与 t3 实现，独立复核）
- 本任务：`t5` R2，attempt 2（attempt_id `0a8481a5-ed1e-406c-b92d-699c1bd3e1d7`）
- 评审时间：2026-10-14 17:4x（工作区状态：`git HEAD = ea277ab`，20 个 process 文档已迁移，`git status` 含 t2/t3/t7 的在飞改动）
- 纪律声明：**本报告不含任何实现者自述的转述作为证据**。下文每条结论都由我在本次评审中亲自跑命令产出，命令原文与关键输出随附；凡引用实现者/其他成员的自述处，均显式标注为「未取信/仅作线索」。
- **verdict：needs_revision**（5 条 findings，其中 2 条 high）

---

## 0. 一句话结论

t3 的主口径数字（顶层 19 / 算式 17 / 205 / 37 / rag 0.31-0.44-0.50）经我独立复算**全部成立**，边界表态（未跑 build、不冒充渲染正确）也**诚实**；
但「就地划改做净」与「修生成器优先」两条**未达标**：

1. t3 自己新发现并修正的 harness-demo 源文件数（10 → **13**）**只改了两处手工副本**，同一数字在
   `site/src/pages/works.astro:101`（**用户可见页面 /works/ 的标题 + 只有 10 行的文件表**）与 `site/src/data/mvps.ts:47`
   **仍是 10**，与 `README.md:13`、`notes/knowledge-map.md:144` 直接矛盾 —— 正是 t3 自己用来描述别人缺陷的那句
   「只改一处而留下互相矛盾的另一处」。
2. 「有 `npm run demo` 的目录」这条**已被口径块判定失效**的定义，仍在 `site/src/pages/works.astro:405-407` 活着，
   且枚举事实错误（把只有 `demo:eval` 的 `rag-demo` 算进去、把真正有 `demo` 的 `memory-redteam` 漏掉）。
3. 生成器层未动、也无门禁：这两个计数是散在 ≥4 处的硬编码字符串，t3 只改了显示值；新加的
   `site/tools/check-counters.mjs`（t7）经我逐条核对**不覆盖**该计数，故下次新增文件仍会**静默回退**。

---

## ① 逐条 acceptance 复核表（t3 的 8 条 + 本任务的 6 条）

### A. t3 自身 8 条 acceptance

| # | t3 acceptance | 我的独立复核 | 判定 |
|---|---|---|---|
| 1 | 逐条修正且**就地划改**，给出「改前 file:line → 改后」对照 | `git diff HEAD -- handoff.md` 实测：仅 2 处变更，正是 :53 与 :127 两行的 `recall@3=1.00` → `recall@3=0.31,2026-10-12 锚点式复测;旧 1.00 已废`（改前文本见 `/tmp/t3/handoff.bak` 逐行 diff）；`README.md` 仅 :13/:34/:28 区段变更；`knowledge-map.md` 仅 :13/:17/:144/:169/:170 变更，**无一处「文末追加更正」**。✅ 就地划改成立 | passed |
| 2 | 顶层算式失真（17 = 19 − 2）与实测一致 | `ls notes/*.md \| wc -l` → **19**；`EXCLUDED_FROM_COURSE_ROUTE = new Set(['knowledge-map','interview-bank'])` → **2**；tsx 实跑 `COURSE_COUNT = 17`。三处副本（`knowledge-map.md:13` / `courses.ts:263` / `README.md:34`）文本一致 | passed |
| 3 | README 的 demo 计数按实测就地划改；口径块「六个具名作品」若自洽则保留并说明 | 我实测：精确键 `"demo"` 的目录 = **10**（api-demo/durable-execution-demo/flywheel-demo/framework-demo/harness-demo/mcp-demo/memory-redteam/model-basics-demo/my-agent/sandbox-demo）；`demo*` = 11（多 rag-demo）。`README.md:9` + `courses.ts:285` 现描述「六个**具名作品**目录 = 6，不是『有 demo 脚本的目录』」= **自洽**，保留正确。**但**同一「有 npm run demo 的目录」定义在 `works.astro:405-407` 仍活着且枚举错误 → 见 F2 | **failed**（F2） |
| 4 | 逐条核查口径块全部数字（15 域 /17 课程页 /18 卡 /205 题 /37 题库 /站点 html / rag 口径） | 全部亲自复算通过（详见 §③）：15/17/18/6 常数 tsx 实跑；**176+8+5+16 = 205** 我按文件逐表数出 176、按 code block 数出 8/5/16；**22+10+5 = 37** 逐节数出；rag 口径**真实重跑** `npm run demo:eval` exit 0。站点 html = **33**，我以迁移后 dist 产物逐文件数出。**唯一瑕疵**：t3 报告里给的构成式「2 顶层 + 6 二级 index + 17 c/ + 9 details/」相加 = **34** ≠ 33（details/index 二次计入）→ F5（报告级，非产物级） | passed（含 F5 低） |
| 5 | 修生成器优先于修输出；说明每处改的是生成器还是输出 | **未落实**：t3 自述「③④ 属改『输出显示值』」，其「权威清单」`harness-demo/README.md` 本身也是**手工枚举**、非生成器；同一数字仍有 2 处活副本未改（`works.astro:101`、`mvps.ts:47`）；门禁侧 `site/tools/check-counters.mjs` 经我核对**无** harness-demo 源文件数/ demo 目录数检查项 → 重生成/新增文件会静默回退 → 见 F3 | **failed**（F3） |
| 6 | 不触碰 17 课程正文实质与 slug；不改 `site/src/data/` 派生逻辑语义 | 见 §④：t3 changedPaths 为 3 个文件；课程 slug 集合 tsx 实跑 = 17+whiteboard 卡，无变化；`site/src/data/` 的**唯一非注释语义差异**是 t2 的 `EXCLUDED_FROM_COURSE_ROUTE` 22→2（交付目标本身），其余为注释/引用路径串 | passed |
| 7 | **全仓不得残留已划改结论的旧值活表述** | **未达标**：「10 个源文件」/「9 源文件」确为 0 处，但 t3 的 grep 模式**漏了同义变体**：`10 个 src 文件` → `works.astro:101`（1 处，活）；`10 src` → `mvps.ts:47`（1 处，活）+ `site-refactor-plan.md:122`（该文档是 mvps.ts 声明的唯一内容源）。同一事实在仓内 4 处，改 2 处留 2 处 → 见 F1 | **failed**（F1） |
| 8 | 证据可重跑；构建边界如实标注 | t3 给出命令+输出且**明确声明「我未运行 astro build」、不宣称渲染正确、html=33 系读取既有产物**——边界诚实成立。**观察**：任务前提「本机 astro build 必被 SIGKILL」与留存的原始日志不符（见 §⑤ 观察 1），且 `knowledge-map.md:17` 引用的「33 page(s) built in 484.44s」**无原始日志留存**（只有 t4/t7 的转述），但 `33` 这一**数字**由我实测的迁移后 dist 产物独立佐证 | passed（含观察） |

### B. 本任务（t5）6 条 acceptance

| # | t5 acceptance | 复核结果 |
|---|---|---|
| 1 | 逐条核对 t3 全部 acceptance，每条给独立证据 | 见上表 A1–A8，全部为本次新跑命令 + file:line |
| 2 | 独立取证每条修正后的数字，不采信实现者数字 | 见 §③，全部自跑；其中 2 处**与实现者口径的来源不同**（我用 `wc -c` 与 `du` 双测体积、用 Python 脚本数题库、用传递闭包脚本算运行时文件数） |
| 3 | 修生成器优先逐条判断；改输出而生成器未改须判发现 | 见 F1/F3：harness-demo 源文件数属「应改生成器/常量/门禁」一类（可从文件系统派生），实现者只改显示值 → **判为发现** |
| 4 | 越界检查 | 见 §④：未越界（课程正文/ slug / 派生逻辑语义均未被 t3 触碰） |
| 5 | 修正后表述内部自洽（同一数字多处一致） | **不成立**：13 vs 10（README/knowledge-map vs works.astro/mvps.ts）；「六个具名作品」vs「= 有 npm run demo 的目录」（courses.ts vs works.astro） → F1/F2 |
| 6 | 边界诚实（不得接受笼统「构建通过」） | t3 未给出「构建通过」类断言，明确未跑 build；我另发现环境前提与留存日志冲突，如实记录（§⑤ 观察 1） |

---

## ② 旧值活残留 grep（我自己的取证，模式覆盖同义变体）

```
$ cd /home/ubuntu/app/learn-agent-harness
$ grep -rn "10 个源文件\|9 源文件" --include='*.md' --include='*.ts' --include='*.astro' .   # 排除 node_modules/dist
（无输出）                                     ← t3 报告的 0 处，复现成立

$ grep -rn "10 个 src 文件\|10 src\|13 src" --include='*.md' --include='*.ts' --include='*.astro' \
    --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.astro .
site/src/pages/works.astro:101:      <h3>10 个 src 文件（9 运行时 + 1 压缩自测）↔ ①-⑩ 十节（下表按主要落点）</h3>
site/src/data/mvps.ts:47:    artifact: 'harness-demo/（10 src，5 运行模式）+ whiteboard/agent_whiteboard.py',
notes/process/site-refactor-plan.md:122:| `harness-mvp` | ... | `harness-demo/`（10 src，5 运行模式）+ `whiteboard/agent_whiteboard.py` |
README.md:13:| [`harness-demo/`](harness-demo/) | ... 13 个源文件（9 运行时 + 3 OTel 离线判据/断言 + 1 压缩自测）...
notes/knowledge-map.md:144:| `harness-demo/`(13 源文件 = 9 运行时 + 3 OTel 离线判据/断言(...) + 1 压缩自测；...
```

真值（我自己数）：

```
$ ls harness-demo/src/*.ts | wc -l
13
$ ls harness-demo/src/          # 13 个 .ts，无其它类型文件
agent.ts context.ts demo.ts llm.ts otel-assert.ts otel-mock-scenario.ts otel-mock.ts
otel.ts policy.ts session.ts test-compact.ts tools.ts types.ts
```

**结论：旧值「10」在仓内仍是 2 处活表述（其中 1 处是用户可见页面标题 + 用户可见表格），t3 的 grep 未覆盖 `个 src 文件` / `N src` 两种变体。**

其他旧值：

```
$ grep -rn "recall@3 *= *1\.00\|@5 *= *0\.94\|0\.94\|85 chunks" ...   # 人工逐条判读
README.md:14            旧值 recall@3=1.00 …**已废**                      → 历史限定语 ✅
handoff.md:162          …85 chunks / recall@3=1.00、@5=0.94、@10=1.00（旧行号指针口径、已废） → ✅
notes/rag.md:295        旧版宣称的 …gold set——…（2026-10-12 已改文本锚点）    → ✅
notes/long-term-memory.md:219  旧值 …**已废**                              → ✅
notes/long-term-memory.md:416  recall@1 = 1.00 / recall@3 = 1.00（**记忆黄金集示例值**，非 rag 旧值） → 非残留 ✅
notes/interview-bank.md:151    旧值 …已废                                  → ✅
notes/knowledge-map.md:18      旧值 …出自已废止的「行号指针」golden set       → ✅
rag-demo/README.md:66,77       旧宣称值 …**已废**；以 rag.md §13 为准        → ✅
notes/evaluation.md:180        "v3 上 recall@5=0.94"（**举例说明指标要绑版本**） → 非残留 ✅
notes/evaluation.md:328        judge 一致率 0.94（Cohen's κ 表，与 rag 无关） → 非残留 ✅
```

**结论：`recall@3=1.00` 的 7 处与 t3 报告的 7 处完全一致，逐条带「已废/旧值」限定语；我额外核查的 3 处（long-term-memory:416、evaluation:180/328）属其它口径，非 rag 旧值残留。**

`64 个源文件`类误报排除：`harness-demo/README.md:5-19` 是**逐文件枚举 13 行**（我数了正文 code block：types/llm/tools/policy/session/context/agent/otel/otel-mock-scenario/otel-mock/otel-assert/demo/test-compact = 13），grep 未命中纯因它按行枚举、无「N 个源文件」句式。

---

## ③ 修正后数字的独立复算（全部自跑，不采信实现者数字）

| 口径 | 实现者/文档声明 | 我的实测命令与结果 | 一致? |
|---|---|---|---|
| notes 顶层 md | 19 | `ls notes/*.md \| wc -l` → **19**（清单：17 课程 + knowledge-map + interview-bank） | ✅ |
| notes/process md | 20 | `ls notes/process/*.md \| wc -l` → **20** | ✅ |
| notes/details md | 8 | `ls notes/details/*.md \| wc -l` → **8** | ✅ |
| notes 总 md | 47 | `find notes -name '*.md' \| wc -l` → **47** = 19+20+8 | ✅ |
| 顶层体积 | ~668KB | `du -ch notes/*.md \| tail -1` → **668K**；字节真值 `wc -c` → **641447 B**（= 626 KiB）。README 用 du 口径，**du 值可复现** | ✅（口径为 du） |
| 总md体积 | ~996KB | `du -ch` 三段 668K + 296K + 32K = **996K**；字节真值 **925053 B**。内部自洽 | ✅ |
| 算式 19−2=17 | 17 | EXCLUDED 实测 `new Set(['knowledge-map','interview-bank'])` → 2；`19−2 = 17` | ✅ |
| COURSE_COUNT / CARD_COUNT / DOMAIN_COUNT / WORK_COUNT | 17 / 18 / 15 / 6 | `tsx -e "import * as C from './site/src/data/courses.ts'"` → **17 / 18 / 15 / 6**；`COURSES.length`=18（含 whiteboard 卡） | ✅ |
| 「有 npm run demo 的目录」 | 10 | 遍历 `*/package.json` 精确匹配 `"demo"` → **10**；匹配 `demo` 前缀 → 11（多 rag-demo `demo:eval`） | ✅ |
| harness-demo 源文件 | 13 = 9 运行时 + 3 OTel + 1 自测 | `ls harness-demo/src/*.ts` → **13**；Python 脚本从 `demo.ts` 沿 `from "./x.js"` 递归求闭包 → **9**（agent/context/demo/llm/otel/policy/session/tools/types），闭包外 = otel-assert / otel-mock / otel-mock-scenario / test-compact | ✅ |
| 课内嵌题 205 | 176 + 8 + 5 + 16 | 逐文件数「练习题库」表内 `\| N \|` 行：13 课 = 14,14,14,14,14,8,14,14,14,12,14,16,14 → **176**；agent-harness §13 → **8**；rag S1 五道确认题 → **5**；model-basics S7 编号条目 → **16**。合计 **205** | ✅ |
| 面试题库 37 | 22 + 10 + 5 | `interview-bank.md` §3 `- Qn` 计 **22**；§4 表格行 **10**；§8 五道标准题 **5**。合计 **37** | ✅ |
| 站点 html | 33 | 评审开始时实测迁移后产物：`find site/dist -name '*.html'` → **33**，清单 = 404 + index + interview + learn + map + **nav** + works（7）+ `c/` **17**（恰为 17 课程 slug，**无幽灵路由**）+ `details/` **9**（8 专题 + index）。**注**：该 dist 随后被 t4 的独立全量构建 `rm -rf dist` 清空（`/tmp/t4-build-settle.log`，17:37 起），我用的是清空前实测记录 | ✅ |
| rag 评测口径 | 0.31 / 0.44 / 0.50，PASS 3/8，132 chunks | **真实重跑** `cd rag-demo && npm run demo:eval` → exit **0**：`系统平均：recall@3 = 0.31  recall@5 = 0.44  recall@10 = 0.50`、`PASS 3/8`、`gold 锚点解析：16/16`、语料 132 chunks（日志 `/tmp/t5-eval.log`）。与 `notes/rag.md §13` 一致 | ✅ |

**唯一与实现者口径不同的地方（不构成失真，仅记录）**：体积数用 `du`（含 4K 块取整），字节真值比之小约 4%（668K vs 641,447 B / 996K vs 925,053 B）。文档用 `~` 且同族数字互相自洽（668+296+32=996），我不判为发现。

---

## ④ 越界检查

| 检查项 | 证据 | 结论 |
|---|---|---|
| 未触碰 17 课程正文实质 | `git diff HEAD --numstat -- 'notes/*.md'`：顶层仅 `api-engineering.md`/`data-flywheel.md`/`model-basics.md` 各 **2+/2−**（t2 的路径串：`notes/xxx-mvp-spec.md` → `notes/process/…`，我逐行读过 diff，仅路径串）、`knowledge-map.md` 8 行、其余为 rename 到 `process/` | ✅ 无正文改写 |
| 未改任何课程 slug | tsx 实跑 `COURSES.map(c=>c.slug)` → 18 条 = 17 课程 + `whiteboard`（白板卡），与迁移前基线一致；`notes/*.md` 顶层集合逐名比对无增删 | ✅ |
| 未改 `site/src/data/` 派生逻辑语义 | `git diff HEAD -- site/src/data/ \| grep -vE '^\+\+\|^--' \| grep -vE '^[+-]\s*(\*\|//\|/\*)'`：非注释差异仅 3 类 ①3 个 mvp-spec 路径串加前缀（t2）②错误串路径（t2）③**`EXCLUDED_FROM_COURSE_ROUTE` 22 条 → 2 条**（交付目标本身）。派生常量（`COURSE_COUNT/CARD_COUNT/DOMAIN_COUNT/STATUS_COUNTS`）表达式未变，tsx 实跑值与声明一致 | ✅ |
| t3 实际改动范围 | t3 申报 `changedPaths = handoff.md / README.md / notes/knowledge-map.md`；我一字未改这些文件，仅读取（`git diff HEAD -- handoff.md` 证实其两处划改内容与申报一致） | ✅ 无越界 |
| 本任务未越界 | 本次评审只新建 `restructure-review-content.md`；对 `notes/`、`site/src/`、`README.md`、`handoff.md`、`site/dist/`、`.agent-teams/` **只读** | ✅ |

---

## ⑤ 边界诚实复核（构建/渲染）

**观察 1（对任务前提的独立观察，非 t3 过失）**：任务书面前提「本机 astro build 在 rendering chunks 阶段必被 OS SIGKILL」与留存的原始日志不符：

```
/tmp/t2-astro-build.log:  16:27:36 [build] 34 page(s) built in 458.66s   ← 含 /nav/index.html，nav 出现 1 次
/tmp/t3-build.log:        16:43:01 [build] 34 page(s) built in 533.00s
/tmp/t4-build2.log:       17:11:09 [build] 34 page(s) built in 873.03s
/tmp/t21-astro2.log:      13:48:39 [build] 32 page(s) built in 514.85s   ← 更早，nav 未加入
```

即本机**可以**完成全量构建（450–873s，exit 0）。t3 对此的表述是「我未运行 `astro build`，因此不宣称任何页面渲染正确性」——**恰好是诚实的**，不存在「用构建通过冒充渲染正确」；反过来也不能因前提被证伪而给 t3 加分或减分。

**观察 2（provenance 缺口）**：`notes/knowledge-map.md:17` 写着「实测取证：`astro build` 输出「33 page(s) built in 484.44s」」。我在 `/tmp` 全量检索：

```
$ grep -rls "33 page(s) built" /tmp   →  /tmp/r1-evidence/R2-evidence-FINAL.log
                                        /tmp/r1-evidence/R2-evidence.log
                                        /tmp/t7-evidence.log（转述）
                                        /tmp/v1/knowledge-map.md.bak（口径块自身副本）
                                        /tmp/t7-fingerprint/knowledge-map.md.orig
$ grep -rls "484" /tmp/*.log          →  （无原始构建日志）
```

即**该次 33 页构建的原始 stdout 未落盘**，留存的是 t4/t7 的转述。但 `33` 这个**数字**由我实测的迁移后 dist 产物独立佐证（§③ 表最后一行），且产物页面构成与口径块「7 静态页（含 nav）+ 17 课程页 + 8 专题页 + 1 404 = 33」逐项吻合；`c/` 恰 17 条也确实被 `EXCLUDED → 2` 的新集合解释。故我判定：**数字可信、出处表述偏强**（建议改为「本机全量构建 + dist 产物计数双证，原始日志未留存」）。这条属 t2 的文本，不计入 t3 findings，作为给 captain 的观察上报。

**观察 3**：t3 报告里的构成式「2 顶层 + 6 二级 index + 17 c/ + 9 details/ = 33」**相加为 34**（details/index.html 被计入两处）。正确分组应为「2 顶层 + 5 二级 index + 17 c/ + 9 details/ = 33」，或「7 静态页（含 details/index）+ 8 专题页 + 17 课程页 + 1 404 = 33」。记为 F5（低）。

---

## ⑤b verdict 与结构化 findings

**verdict = needs_revision**（t3 acceptance #3 / #5 / #7 不成立；头条数字全部正确、越界与边界诚实无问题）

| id | severity | 位置 | 问题 | requiredFix |
|---|---|---|---|---|
| F1 | **high** | `site/src/pages/works.astro:101`、`site/src/data/mvps.ts:47`（源头 `notes/process/site-refactor-plan.md:122`） | t3 新发现并修正的「harness-demo 源文件数 10 → 13」**只改了两处手工副本**。同一事实在仓内共 4 处，另 2 处仍是旧值 10：`works.astro:101` 是**用户可见页面 /works/ 的三级标题**（「10 个 src 文件（9 运行时 + 1 压缩自测）」）且其下文件表**只有 10 行**（缺 otel-mock/otel-assert/otel-mock-scenario），直接与 `README.md:13`、`notes/knowledge-map.md:144` 的 13 矛盾；`mvps.ts:47` 是同数字的第三份手工副本（被 `works.astro:66` 作为匹配键消费），其声明唯一内容源 `site-refactor-plan.md:122` 也写 10 src。t3 的残留 grep 只覆盖「10 个源文件/9 源文件」，**未覆盖「10 个 src 文件 / 10 src」变体**，故漏检。违反 t3 acceptance #7「全仓不得残留已划改结论的旧值活表述」，并复现了 t3 自己批评的「只改一处而留下互相矛盾的另一处」 | ① `works.astro:101` 的标题与文件表按 13 个文件重写（补 OTel 三个文件行；或把该表明确限定为「①-⑩ 十节对应的 10 个运行时文件」并改名以免与总数冲突）；② `mvps.ts:47` 的 `artifact` 串与 `notes/process/site-refactor-plan.md:122` 的「10 src」同步为 13（或改为不写数字的表述）；③ 交付前用 `grep -rn "10 个 src 文件\|10 src\|10 个源文件\|9 源文件"` 收口到 0 处活残留。**注**：`works.astro`/`mvps.ts` 落在 t3 原 inScope 之外，需 captain 裁定「扩 t3 范围重开」或「另立修复任务」——但现状的仓内自相矛盾必须有人收口 |
| F2 | **high** | `site/src/pages/works.astro:405-407` | 已被口径块判定**失效**的定义仍在用户可见页面活着：「本页共 {WORK_COUNT} 个可运行 demo 作品（= 有 `npm run demo` 的目录：harness-demo / rag-demo / sandbox-demo / mcp-demo / durable-execution-demo / framework-demo）」。我实测（`python3` 读各 `package.json` 的 `scripts`）：`rag-demo` 的精确键 `demo` = **False**（只有 `demo:retrieval/demo:bm25/demo:rag/demo:eval`），`memory-redteam` 的精确键 `demo` = **True**（`['demo']`）。故该括号**定义与枚举双重错误**：它把没有 `npm run demo` 的 `rag-demo` 算进去，又把真正有的 `memory-redteam` 排除在外。`notes/knowledge-map.md:15` 早已声明该措辞「在 memory-redteam 加上 demo 脚本后已不成立，就地更正」，`courses.ts:285` 也显式警告「勿据『有 npm run demo 的目录数』推算」，唯 `works.astro:405` 未同步 → D3 的处置只落在注释与 README，用户可见副本未改 | 把 `works.astro:405-407` 改为与口径块一致的表述：`{WORK_COUNT} 个具名作品目录（harness-demo / rag-demo / sandbox-demo / mcp-demo / durable-execution-demo / framework-demo）；另有 memory-redteam/ 按回归套件计、不计入作品数`，删掉「= 有 `npm run demo` 的目录」这一定义；同样需 captain 裁定范围 |
| F3 | medium | `README.md:13` / `notes/knowledge-map.md:144` / `site/src/pages/works.astro:101` / `site/src/data/mvps.ts:47`；门禁 `site/tools/check-counters.mjs` | **修生成器优先未落实**：harness-demo 源文件数是可由文件系统派生的硬编码串，散布 4 处；t3 改的是 2 处**显示值**，其援引的「权威清单」`harness-demo/README.md:5-19` 也是手工枚举（另一个手工副本）。我逐行核对 t7 新增的 `site/tools/check-counters.mjs`：其检查项为知识域/课程页/课程卡/题目/站点 html/顶层数（`check('课内嵌题'…)`、`check('站点 html'…)` 等），**没有任何 harness-demo 源文件数或「有 demo 脚本的目录数」断言**，故无机器门禁。本次失真的成因（文件新增后无人同步，`5a04da0` 加入 3 个 OTel 文件）**会再次发生且静默回退** | ① 在 `check-counters.mjs` 增加一条从 `harness-demo/src/*.ts` 与各 `package.json` 派生的断言（真值来源 = 文件系统，声明值来源 = 口径块/README，两边独立）；② 或在口径块里把「13 源文件」的**唯一真源**声明为「构建期/CI 由文件系统派生」，四份手工副本只许引用不许另写；③ 修复后附一次「删/增一个 src 文件 → 门禁必须失败」的证伪记录 |
| F4 | low | `site/src/data/courses.ts:286-287` | 该警告的枚举**算不平**：「六个具名作品目录（harness-demo / rag-demo / sandbox-demo / mcp-demo / durable-execution-demo / framework-demo）」中 `rag-demo` 无 `demo` 键 → 5 个；「另含 model-basics-demo / flywheel-demo / api-demo / my-agent」→ 4 个；5+4 = **9**，与「实测为 10」差 1。缺的正是 `memory-redteam`（我实测其 package.json 有 `"demo"`，且正是它的存在导致原措辞失真的那个目录）。总数 10 正确，**枚举不闭合** | 在「另含」列表补 `memory-redteam`（并保留「它按回归套件计、不计入作品数」的限定），使 10 可被读者逐项加平 |
| F5 | low | t3 交付说明（output「三、逐条复算结果」/ acceptance #4 证据） | 构成式「2 顶层 + 6 二级 index + 17 c/ + 9 details/ = 33」实际相加 = **34**（`details/index.html` 被二次计入）。头条数字 33 正确（我独立数出 33 个文件），但该构成式不能自洽，属「修正后表述内部自洽」这一验收项的**报告级**瑕疵 | 改为「2 顶层（index.html/404.html）+ 5 二级 index（learn/works/map/interview/nav）+ 17 c/ + 9 details/（8 专题 + index）= 33」，与 `knowledge-map.md:17` 的「7+8+17+1」表述二选一并保持唯一 |

**findings 之外明确不判为发现的两点**（避免过度严格）：
- 体积数用 `du` 而非字节真值（差 ~4%，文档带 `~` 且同族自洽）；
- 「33 page(s) built in 484.44s」的原始日志未留存（数字本身被 dist 产物独立佐证，且该文本属 t2 而非 t3）。

---

## ⑥ 命令清单（可重跑）

```bash
cd /home/ubuntu/app/learn-agent-harness
# 结构计数
ls notes/*.md | wc -l                                   # 19
ls notes/process/*.md | wc -l                           # 20
ls notes/details/*.md | wc -l                           # 8
find notes -name '*.md' | wc -l                         # 47
du -ch notes/*.md | tail -1                             # 668K ；wc -c = 641447
# 常数（tsx 实跑，非 grep）
export PATH=~/.nvm/versions/node/v22.23.2/bin:$PATH
./rag-demo/node_modules/.bin/tsx -e "import * as C from './site/src/data/courses.ts'; console.log(C.COURSE_COUNT,C.CARD_COUNT,C.DOMAIN_COUNT,C.WORK_COUNT,C.COURSES.length)"
# 17 18 15 6 18
# demo 目录
for d in */; do [ -f "$d/package.json" ] && grep -q '"demo"' "$d/package.json" && echo "$d"; done | wc -l   # 10
# harness-demo 源文件与运行时闭包
ls harness-demo/src/*.ts | wc -l                        # 13
python3 - <<'EOF'   # 传递闭包 = 9
import re,os
src='harness-demo/src'; seen=set()
def walk(f):
    if f in seen: return
    seen.add(f)
    for m in re.findall(r'from\s+"\./([A-Za-z0-9_\-]+)\.js"', open(os.path.join(src,f+'.ts')).read()): walk(m)
walk('demo'); print(len(seen), sorted(seen))
EOF
# rag 评测真跑
cd rag-demo && timeout 300 npm run demo:eval | tail -6   # exit 0：0.31/0.44/0.50，PASS 3/8，132 chunks，锚点 16/16
# 旧值活残留（含同义变体）
grep -rn "10 个源文件\|9 源文件\|10 个 src 文件\|10 src" --include='*.md' --include='*.ts' --include='*.astro' \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.astro .
# 越界
git diff HEAD --numstat -- 'notes/*.md'
git diff HEAD -- site/src/data/ | grep -vE '^(\+\+\+|---)'
```
