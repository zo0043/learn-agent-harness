# 技术准确性 A（核心 harness / agent loop / 上下文 / 评测 / 可观测 / RAG）评审报告（tech-core）
- 评审员：`tech-core`｜时间：2026-10-18 23:50（Asia/Shanghai）
- 覆盖声明：
  - **全读（逐行）**：`notes/agent-harness.md`(518)、`notes/harness-from-scratch.md`(242)、`notes/rag.md`(339)、`notes/details/01..08`(8 篇全部)
  - **抽样（列节/行）**：
    - `notes/observability.md`：grep 全篇关键词 `gen_ai|semconv|语义约定|conversation.id|session.id|gen_ai.system|provider.name`（命中 :59/:65–79/:95–107/:116–137/:232/:275–277/:291–299/:312–313/:340–349）+ **逐行读 :55–139**；另 `24 分钟` 命中 :299。
    - `notes/evaluation.md`：grep 全篇关键词 `实测|判据|必然|唯一|首次|证明|PASS|通过率|[0-9]+\.[0-9]+|%`（命中 :15/:22–25/:53/:74/:98/:109–112/:163/:180–181/:187/:192–216/:239/:273–290/:305–354/:389–428）+ **逐行读 :188–219**。
  - **对照证据源（逐行）**：`harness-demo/src/{agent,tools,policy,session,context,types,demo,llm,otel-mock-scenario,otel-assert,otel-mock,test-compact}.ts`；`rag-demo/src/{evaluate,rrf,bm25,chunker,rerank,embed,corpus}.ts`；`viz/`（仅 3 个 `.mjs` 工具，**无图资产**，我的分区笔记也**未引用 viz/**）；`site/src/data/{course-structure,mvps,courses}.ts` 与 `site/src/utils/ragStats.ts` 中与本分区课程有关的字段段。
  - **未读（原因）**：`notes/observability.md:1–54`、`:140–354` 未逐行（只 grep 抽样）；`notes/evaluation.md` 上列之外区段未逐行；`rag-demo/src/{demo-retrieval,demo-bm25,demo-rag,generator,index,tokenizer}.ts` 与 `harness-demo/src/otel.ts` 未逐行读（只在引用处读到片段）；`site/src/pages/**` 仅核了 `works.astro:133/:393` 两行。
- 结论摘要：
  1. **1 条 blocker**：OTS 离线判据 `demo:otel:assert` 在**干净仓库**必然非 0 退出——它要求 `workspace/out/otel.md` 已存在，而该文件由活端点 `demo:otel` 产生、整个 `workspace/out/` 被 `.gitignore` 排除；站点却把它写成「判定 clone 能跑 … exit 0 = 过」。
  2. rag 评测口径**已过期且有多处副本**：声明 `recall@5=0.44 / 132 chunks`，实跑 `0.38 / 135 chunks`（`recall@3=0.31`、`@10=0.50`、`PASS 3/8` 复现一致）；漂移可**因果归因**到未提交的 `notes/agent-harness.md`（该文件是语料成员，52→55 chunks）。
  3. 站点 `/works/` 两行仍把历史活端点值「**实测 11 spans / 1 trace**」当实测，与仓内 15-span 判据契约**相反**。
  4. FinHot 幽灵事故时长在同仓有 **24 分钟 / 25 分钟**两套口径，我分区内两篇文件各写一套。
  5. 有 1 处**机制与代码相反**：`harness-from-scratch.md` 的门序图与「未注册工具 `city` → `未知工具: city` 回写」实测，在当前代码路径上不可能发生（`policy` 的 `fallback=deny` 先拦）。
- 本轮未验证的范围：见文末「本轮未验证的范围」。

---

### TECH-A-F1｜`demo:otel:assert` 的 span 状态判据在干净仓库必然失败，而站点把它写成 clone 判据（blocker）
- 严重度：blocker
- 对象：`harness-demo/src/otel-mock-scenario.ts:55`（`toolStatus: { ok: 7, denied: 1, error: 0 }`）＋ `harness-demo/src/otel-mock-scenario.ts:91`（`read_file` → `out/otel.md`）＋ `harness-demo/src/otel-assert.ts:82-83`（`checkCounts("工具状态分布…")` / `check("error 路径本场景不触发…", …, 0)`）；对外声明：`site/src/data/course-structure.ts:281`、`notes/harness-from-scratch.md:210`、`notes/observability.md:79/:109`、`notes/details/06-observability-loop.md:27`
  > `site/src/data/course-structure.ts:281`「判定 clone 能跑 = … `npm run demo:otel:assert` 断言形态/计数（exit 0 = 过）」
  > `harness-from-scratch.md:210`「本地 mock 端点（无外网、无 key）跑出确定性 span 树 = **15 spans / 1 trace**」
- 现象：mock 冻结脚本第 3 步去读 `out/otel.md`，但该场景**自己从不创建它**（它写的是 `out/otel-mock-run.md`，:98）；`out/` 整个目录又被 `.gitignore` 排除。于是「ok×7」只有在**上一次活端点 `demo:otel` 跑过**、留下 `workspace/out/otel.md` 时才成立——干净 clone 上 `npm run demo:otel:assert` 必然失败（非 0 退出）。
- 证据（亲自跑）：
  - `git status --porcelain` 起始快照后，`cd harness-demo && timeout 55 npx tsx src/otel-assert.ts`（`workspace/out/` 当时**不存在**）→ `❌ 工具状态分布（deny 路径必须在场）（实际/期望）：denied=1/1 error=2/0 ok=5/7`、`❌ error 路径本场景不触发…：实际 2 / 期望 0`、`❌ otel 断言失败 2 条`（exit ≠ 0）
  - 再次运行（`out/` 已存在、但无 `otel.md`）→ `denied=1 error=1 ok=6`（仍失败）
  - 情景对照：`printf 'OTel 埋点验证完成\n' > workspace/out/otel.md` 后再跑 → `✅ …denied=1/1 error=0/0 ok=7/7`、`✅ otel span 树断言全部通过`（**证明判据通过依赖残留文件**）
  - 残留证据链：`git ls-files harness-demo/workspace` → 只有 `docs/README.md`、`docs/architecture.md`；`.gitignore` 含 `harness-demo/workspace/out/`；`harness-demo/src/otel-mock.ts:29-31` 只写 `workspace/out/otel-spans.md`
  - 收尾已恢复原状：`rm -rf harness-demo/workspace/out`（该目录是我跑判据时新建的），`git status --porcelain | wc -l` 与起始一致（31）
- 影响：照站点「clone 判据」走的读者/考生会拿到非 0 退出，从而**误判交付坏了或自己环境坏了**；反过来，课程宣称的「确定性 span 树 / 离线判据可复跑」也不成立（剩余 `error=1`），并使「15 spans」这个数字**只在作者机器上为真**。这是宪章定义的「对外声明与事实相反」。
- 建议方向：把 `out/otel.md` 纳入 mock 场景（前置一步写入），或把 `EXPECTED.toolStatus` 改为与干净工作区一致的 `ok:6/error:1`，并把「判据」与「依赖活端点残留」的耦合写清。
- 置信度：高（三情景实跑对照 + gitignore/tracked 文件清单，因果链完整；唯一未做的是字面 `git clone` 到新目录）

---

### TECH-A-F2｜rag 评测口径 `recall@5=0.44` / `132 chunks` 已过期，实跑 0.38 / 135，且站点多处副本同源失效（high）
- 严重度：high
- 对象：`notes/rag.md:283`、`:289`、`:293`，及副本 `notes/evaluation.md:216`、`site/src/data/course-structure.ts:137/:143/:211`、`site/src/data/mvps.ts:55`、`site/src/data/courses.ts:63`、`README.md:14`、`rag-demo/README.md:66`；渲染通道 `site/src/utils/ragStats.ts:45-83`
  > `rag.md:283`「语料 = 课程笔记自己（rag.md + agent-harness.md + handoff.md → **132 chunks**）」
  > `rag.md:293`「recall@3 = 0.31 / **recall@5 = 0.44** / recall@10 = 0.50（PASS 3/8，2026-10-12 锚点式 golden set 复测）」
- 现象：`rag.md` 自称 §13 是站点口径唯一真源（`ragStats.ts` 构建期解析它，解析失败即 throw，无硬编码回退），但其中的 `recall@5` 与 chunk 数已与现行工作区不一致；站点 4 处 TS 数据副本同时过期。`rag.md:298` 自己写下了耦合纪律「凡划改必须重跑 `npm run demo:eval` 核对本节，不符以实跑为准或调整新文案回稳」——该纪律未被满足。
- 证据（亲自跑）：
  - `cd rag-demo && timeout 55 npx tsx src/evaluate.ts`（=`npm run demo:eval` 同一入口）→ `系统平均：recall@3 = 0.31   recall@5 = 0.38   recall@10 = 0.50（8 道范围内题）`、`PASS 3/8`、`gold 锚点解析：16/16 全部命中（…→ 135 chunks）`、逐题漏点排名亦漂移（Q1 `cosine#73→#77`、Q7 `#45→#43`、Q8 `#11→#12 / #13→#14`、`#122→#126 / #112→#115`）
  - 漂移归因（不是时间先后，是复现出的因果）：`git show HEAD:notes/agent-harness.md > /tmp/ah-head.md`，再以同一 `splitMarkdown` 分别切现行工作树与 HEAD 版 → `agent-harness.md chunks: 工作树 55 / git HEAD 52 (diff 3)`、`rag.md=35 handoff.md=45 合计=135（HEAD 版 agent-harness 合计=132）`；`git status --porcelain` 显示 `notes/agent-harness.md` 为 ` M`（未提交改动），而它是 `rag-demo/src/corpus.ts:19` 的语料成员
- 影响：读者/考生按 `notes/rag.md`、站点课程卡或 README 复现评测会拿不到 0.44；宣称值与实跑值并存且站点由 §13 派生，属宪章 high 定义（关键事实无法复现 + ≥2 处互相矛盾的对外表述）。
- 建议方向：按 `rag.md:298` 的自家纪律重跑并把 `rag.md §13` 与 4 处副本同步到 0.38/135（或回稳语料后重算），并让 `ragStats.ts` 的解析面覆盖 recall@5。
- 置信度：高（数字与归因均由我本机命令产出；`git status` 起始已有 ` M notes/agent-harness.md`，非本轮改动）

---

### TECH-A-F3｜站点 `/works/` 把历史活端点值「11 spans / 1 trace」当作「实测」，与仓内 15-span 判据契约相反（high）
- 严重度：high
- 对象：`site/src/pages/works.astro:133`、`site/src/pages/works.astro:393`
  > `works.astro:133`「OTel GenAI span **实测 11 spans / 1 trace**」
  > `works.astro:393`「…（`demo:otel` **实测 11 spans/1 trace**）；下一步 `OTEL_EXPORT_OTLP=1` 接真实 collector…」
- 现象：同一站点/同一仓库里，`demo:otel` 的 span 数有两套口径：站点把 **11** 写成「实测」，而仓内可复跑契约是 **15**（`harness-demo/src/otel-mock-scenario.ts:50` `spanTotal: 15`、`:57` 明确把 11 标为 `historicalReportOnly …（活端点报告值，无可复跑日志）`，且课程 `harness-from-scratch.md:210`、`observability.md:79`、`details/06:27` 都已声明 11「未验证、不作判据」）。
- 证据（亲自跑）：
  - `grep -n "11 spans" site/src/pages/works.astro` → `133:…实测 11 spans / 1 trace…`、`393:…demo:otel 实测 11 spans/1 trace…`
  - `cd harness-demo && timeout 55 npx tsx src/otel-assert.ts` → `✅ span 总数：实际 15 / 期望 15`、`✅ 按名字的 span 计数：chat=6/6 execute_tool=8/8 invoke_agent=1/1`（形态计数两侧一致，与 11 不一致）
- 影响：站点读者（含面试官/审阅者）会据此认为该仓 OTel 埋点跑出 11 spans，且课程正文又说 11「未验证」——对外表述与课程自身声明相反，属宪章 high（同一事实 ≥2 处互相矛盾的对外表述）。
- 建议方向：把两行改为 15（并注明 `demo:otel:mock` 离线判据），或明确标注「历史活端点值、未验证」。
- 置信度：高（站点原文 + 我自己跑的判据输出）；**跨分区提示**：此项落在展示/编辑视角与本轮 Lead 已登记的「11 spans 当实测」备列上，请 Lead 去重裁定（我未把 `analysis/**`、`reviews/**` 的任何报告当证据，只作线索）。

---

### TECH-A-F4｜FinHot 幽灵事故时长在同一仓有「24 分钟 / 25 分钟」两套口径（high）
- 严重度：high
- 对象：`notes/agent-harness.md:212` 与 `notes/agent-harness.md:420`；同源另一处 `notes/observability.md:299`
  > `agent-harness.md:212`「生产 worker/api 被幽灵代码替换了 **24 分钟**。」
  > `agent-harness.md:420`「FinHot 幽灵事故（2026-10-09）：错误目录 build 换掉生产容器 **25 分钟**」
- 现象：同一事故、同一仓库，2 处写 24 分钟、≥5 处写 25 分钟（后者含"恢复代价 25 分钟""18:00–18:25"等可与时间线自洽的表述），读者无法判断哪个是准值。
- 证据（亲自跑）：`grep -rn "24 分钟\|25 分钟" --include=*.md --include=*.ts --include=*.astro . | grep -v node_modules` →
  `notes/agent-harness.md:212`（24）、`notes/agent-harness.md:420`（25）、`notes/observability.md:299`（24）、`notes/sandbox.md:28/:35/:87/:421` 与 `notes/interview-bank.md:135`（均 25）、`sandbox-demo/src/demo.ts:63/:70`、`site/src/pages/interview.astro:40/:76`（均 25）
- 影响：这是本仓对外反复使用的「生产事故」核心数字，且 `agent-harness.md` 的面试故事表（:420）与正文（:212）**同页自相矛盾**；考生照任一处背诵都可能与仓库另一处冲突（宪章 high：同一事实 ≥2 处互相矛盾的对外表述）。
- 建议方向：以带时间线自洽的 25 分钟统一（或就地划改 24 为 25 并说明来源 `#35`）。
- 置信度：高（grep 全仓命中清单）；**跨分区提示**：`notes/sandbox.md`、`interview.astro` 属 tech-state / pedagogy 分区，请一并同步。

---

### TECH-A-F5｜课程画的「① 校验 → ② 权限」门序与代码相反；「未注册工具 `city` → `未知工具: city` 回写」在当前代码上不可能发生（high）
- 严重度：high
- 对象：`notes/harness-from-scratch.md:129-132`（mermaid，标题行 :126 声明「对照 `src/policy.ts`」）＋ `notes/harness-from-scratch.md:81`；代码侧 `harness-demo/src/agent.ts:186`、`harness-demo/src/tools.ts:103-107`、`harness-demo/src/policy.ts:27`
  > `harness-from-scratch.md:81`「实测：模型调用未注册工具 `city` → "**未知工具: city**" 回写 → 模型自己改调 `get_weather`」
  > `harness-from-scratch.md:130`「TC → V{"**校验** 名称已注册？参数合法？"} → P{"**policy.decide** …"}」
- 现象：代码里 policy 先判、校验后行：`guardedToolStep` 先 `o.policy.decide(name)`（:186），只有 `allow`/已批准后才 `append tool_intent` 再 `callTool`→`validateArgs`。未注册工具 `city` 会先命中 `fallback=deny`（policy.ts:27），产出的是「[策略拒绝] 无匹配规则，默认拒绝…」，**永远到不了** `tools.ts:105` 的「未知工具: city」。也就是文档的实测输出与门序图都对不上现行代码。
- 证据（亲自跑）：
  - `cat > /tmp/polcheck.mjs`（`import { DEMO_POLICY } ...` 逐工具调 `decide`）+ `cd harness-demo && timeout 40 npx tsx /tmp/polcheck.mjs` → `decide(city) => deny  (无匹配规则，默认拒绝)`、`decide(read_file) => allow`、`decide(run_shell) => deny`、`decide(write_file) => approve`
  - 静态对照：`harness-demo/src/agent.ts:187-193`（deny 分支在 intent 之前 return）与 `:209`（先 `tool_intent`）后 `:219` `callTool`；`tools.ts:104-107`
- 影响：学习者据此口述/实现「门 1 校验名称已注册」会把权限门与校验门的**顺序与失败语义写反**（面试白板题正是考这两道门），也可能误以为未注册工具能被模型"自我纠正"。属宪章 high（关键事实无法复现）。
- 建议方向：把 mermaid 的 `校验/权限` 顺序改为与代码一致（权限在前、校验在 `callTool` 内），并把「未知工具」实测改为真实可复跑的 `[策略拒绝] 无匹配规则` 输出。
- 置信度：高（`decide()` 实跑输出 + 源码行）

---

### TECH-A-F6｜harness 自触发的 `process.exit(137)` 被课程写成「真实崩溃」（medium）
- 严重度：medium
- 对象：`notes/harness-from-scratch.md:177`、`:179`；`notes/details/03-error-paths.md:26`；代码 `harness-demo/src/agent.ts:211-214`
  > `harness-from-scratch.md:177`「**实测输出（真实崩溃 + 真实恢复）**」
  > `agent.ts:213`「`console.log("\n[崩溃演示] 模拟进程崩溃（日志里有 intent，没有 result）\n")`」＋ `:214 process.exit(137)`
- 现象：崩溃是 harness 自己在 `crashOnWriteIntent` 分支里**主动退出**（同仓 `sandbox-demo`/`durable-execution-demo` 用的是外部真实 SIGKILL 口径），并非外部真实崩溃；`details/03:26` 更写成「真实崩溃 exit 137」。它检验的机制（intent 已写、exec 缺失）确实被覆盖，但把演示级触发写成「真实崩溃」抬高了证据等级。
- 证据（亲自跑/读）：`read harness-demo/src/agent.ts:208-215`（逐行，见上引）；`read harness-from-scratch.md:177-184`。未跑 `npm run demo:crash`（会覆写仓内证据 `trajectories/demo.jsonl`，属禁止的写改动）。
- 影响：读者会把「demo 内自触发退出」当作崩溃一致性已实测的证据，从而高估该 demo 对信号/缓冲/kill -9 边界的覆盖（`session.ts:24-28` 的同步 append 纪律才是真正的防线）。
- 建议方向：改为「模拟崩溃（`process.exit(137)` 自触发）」并注明与外部 SIGKILL 的差异。
- 置信度：高（引用两处原文 + 代码行为）

---

### TECH-A-F7｜「用**可证明的**微小召回损失换数量级延迟下降」把经验观测写成理论保证（medium）
- 严重度：medium
- 对象：`notes/rag.md:65`、`notes/rag.md:327`
  > `rag.md:65`「这就是 ANN 的核心交易：**用可证明的微小召回损失换数量级的延迟下降。**」
  > `rag.md:327`「损失可量化：**recall@1 从 0.99 掉到 0.95**（HNSW/IVF 都是近似结构…）…核心交易一句话：用可证明的微小召回损失换数量级的延迟下降。」
- 现象：HNSW/IVF 属启发式近似索引，**不提供通用召回下界**；「可证明」是把经验观测升格为理论保证，且 `0.99→0.95` 这个区间在笔记与一手源里都没有出处。宪章把「证明/必然/唯一」类过度断言列为核查重点。
- 证据（亲自抓）：`curl -sS -L https://arxiv.org/abs/1603.09320`（HNSW 原论文摘要）→ 摘要是「We present a new approach for the approximate K-nearest neighbor search…」，全文页面 `guarantee` 命中 **0**；`notes/rag.md:65/:327` 原文（仅阅读）。同处正确的一面：RRF `k=60` 与「Elasticsearch 原生」经官方文档证实（见正面确认）。
- 影响：面试时若被追问「请证明」，按笔记口径回答会答错层级——recall 是**调参下的经验曲线**（`efSearch`/`nprobe`），不是可证明的界。
- 建议方向：改成「经验上很小的召回损失（可量化但无理论下界）」，并给 `0.99/0.95` 标来源或删去。
- 置信度：中高（「可证明」这一半证据强；「0.99→0.95 无出处」是「检索不到」，不能排除某处有来源）

---

### TECH-A-F8｜`details/06` 的「未覆盖」行里写着「OTel 埋点已落地」——行名与内容相反（low）
- 严重度：low
- 对象：`notes/details/06-observability-loop.md:27`
  > `- 未覆盖:OTel 埋点已落地(harness-demo \`demo:otel:mock\` 离线 mock 实测 **15 spans/1 trace**,2026-10-12;…);仍缺 getEvents() 式"位置切片重放"的 API 示例…`
- 现象：该页固定结构是「已覆盖 / 未覆盖」两条，「未覆盖」条首项却断言某事**已落地**（属已覆盖侧），且其后半句才回到真缺口；同一行内自相矛盾，扫描型读者会误读为 OTel 埋点仍缺。
- 证据（仅阅读 `notes/details/06-observability-loop.md:24-27`）。另注：本行「`demo:otel:assert` 可离线复跑」的表述已被 TECH-A-F1 证伪（干净仓库非 0 退出）。
- 影响：8 篇专题是「资深分水岭」速查页，「未覆盖」列表被当作缺口清单使用，分类错误会让读者误判课程覆盖度。
- 建议方向：把「OTel 埋点已落地…」移到「已覆盖」行，只留 `getEvents()` 式重放与逐步控制台产物两项真缺口。
- 置信度：高（原文可见；仅分类问题，无事实争议）

---

### TECH-A-F9｜`details/08` 的「2026 年**唯一**被确认能工作的模式」强于一手源表述（low）
- 严重度：low
- 对象：`notes/details/08-single-threaded-write.md:14`、`:22`
  > `:14`「2026 年**唯一**被确认能工作的模式是"多智能体出智力、写操作保持单线程"」
  > `:22`「Cognition《Multi-Agents Working》（2026）：**确认唯一**能工作的模式是…」
- 现象：Cognition 原文的表述是「Today, **a narrower class works**, where agents contribute intelligence while writes stay single-threaded」/「multi-agent systems **work best** today when writes stay single-threaded」——是「更窄的一类可行/最佳」，不是「唯一」。
- 证据（亲自抓）：`curl -sS -L https://cognition.ai/blog/multi-agents-working` → 正文可见「a narrower class works, where agents contribute intelligence while writes stay single-threaded」「multi-agent systems work best today when writes stay single-threaded」；同页「Devin Review catches an average of **2 bugs per PR**, of which roughly **58%** are severe」→ **该页其余数字与引用均核对一致**（见正面确认）。
- 影响：把厂商立场抬成「唯一可行」，读者复述时会被反问；属措辞过强而非事实错误。
- 建议方向：改为「目前被验证可行的是更窄的一类：多智能体只贡献智力、写保持单线程（Cognition 2026）」。
- 置信度：高（一手源原文对照）

---

### TECH-A-F10｜把 pgvector 说成「Postgres 内建 HNSW/IVFFlat」（low）
- 严重度：low
- 对象：`notes/rag.md:80`
  > 「**pgvector（Postgres 内建 HNSW/IVFFlat）**是你的锚点：FinHot 生产就是 Postgres，pgvector 等于同一套基础设施加向量能力」
- 现象：pgvector 是**需要安装并 `CREATE EXTENSION vector;` 的扩展**，不是 Postgres 内建能力；「内建」会让读者以为原生 Postgres 即可用，忽略安装/版本前提（README 写明支持 Postgres 13+）。
- 证据（亲自抓）：`curl -sS -L https://raw.githubusercontent.com/pgvector/pgvector/master/README.md` → 首行「Open-source vector similarity search for Postgres」、「Compile and install the extension (supports Postgres 13+)」、「Enable the extension… `CREATE EXTENSION vector;`」
- 影响：选型问答里把扩展说成内建会被追问；不影响 pipeline 结论。
- 建议方向：改为「pgvector（Postgres 的向量扩展，需安装 + `CREATE EXTENSION`）」。
- 置信度：高（官方 README 原文）

---

### TECH-A-F11｜`harness-from-scratch.md` 的任务分步（6 步、run_shell 第 5）与它引用的实测输出（第 4 项 run_shell）、`demo.ts`（5 项）三处不一致（low）
- 严重度：low
- 对象：`notes/harness-from-scratch.md:200` vs `:184`；代码 `harness-demo/src/demo.ts:42-46`
  > `:200`「查北京天气 → 列 docs → 读 README → 写 out/summary.md（需审批）→ **试 run_shell**（会被拒）→ 总结」（= run_shell 第 5）
  > `:184`「✅ 已完成第 1/2/3/5 项；**第 4 项 run_shell 被策略拒绝**」
- 现象：`demo.ts` 的 user prompt 是 5 条编号（4=run_shell、5=总结），`:184` 的实测输出与之自洽；而 `:200` 把「列 docs」「读 README」拆成两条变成 6 步，使 run_shell 变第 5 项。同一节内两套编号，读者对照 `demo.ts` 会困惑，`:206` 的「5 步全过」也因此语义不明。
- 证据（仅阅读）：`notes/harness-from-scratch.md:184/:200/:206`；`harness-demo/src/demo.ts:42-46`（逐行）。未跑 `npm run demo`（会覆写仓内证据轨迹）。
- 影响：低——只影响读者核对输出/步骤的自洽性。
- 建议方向：把 `:200` 的任务描述改成与 `demo.ts` 相同的 5 条编号。
- 置信度：高（原文对照）

---

### TECH-A-F12｜`evaluation.md` 用 `recall@5=0.94` 作示例值，恰好撞上 rag-demo 已作废的旧值（low）
- 严重度：low
- 对象：`notes/evaluation.md:180`
  > 「**版本化** | 评测集有版本号；**指标必须绑定版本**（"v3 上 recall@5=0.94"，裸数字无意义）」
- 现象：`0.94` 是 rag-demo **旧行号指针期已废弃**的 recall@5 宣称值（`notes/rag.md:295`、`README.md:14` 均标「已废」），此处作示例虽未声称是本仓数字，但读者 grep `0.94` 会在同一仓拿到「示例」与「已废旧值」两类命中，弱化了「已废」的醒目度。
- 证据（仅阅读）：`notes/evaluation.md:180`；`notes/rag.md:295`；`grep -rn "recall@3\|recall@5\|recall@10" --include=*.md --include=*.ts .`（命中 `evaluation.md:180` 与 rag 旧值/现行值多处）
- 影响：低——可能让读者把示例当作本仓历史值。
- 建议方向：示例值换成一个明显不冲突的量级（如 `0.86`）或标注「示例」。
- 置信度：中（依赖读者是否会混淆）

---

## 正面确认
1. **token 压缩数字可复跑**：`cd harness-demo && timeout 55 npx tsx src/test-compact.ts` → `压缩前 tokens≈1378（阈值 1000）`、`摘要了 3 条，压缩后 messages=5 条，tokens≈426`、`✅ 压缩逻辑验证通过`（exit 0），与 `harness-from-scratch.md:196`、`site/src/data/course-structure.ts:110` 逐字一致；`context.ts:11-12` 的 `JSON 长度/3.5` 与笔记口径一致（注意该数字由 `keepTail=2` 的测试参数决定，`test-compact.ts:39`）。
2. **OTel span 形态/计数可复跑**：`timeout 55 npx tsx src/otel-assert.ts` 的**形态与计数断言全部通过**——`trace 数 1/1`、`span 总数 15/15`、`chat=6/6 execute_tool=8/8 invoke_agent=1/1`、`1 trace 一棵树`、`根 span 生命周期覆盖子 span`；与 `harness-from-scratch.md:210`、`observability.md:79`、`mvps.ts:88` 的 15/1 一致（失败只在状态分布，见 F1）。
3. **JSONL 轨迹与页内统计口径一致**：直接解析 `harness-demo/trajectories/demo.jsonl`（22 行）→ `{"init":1,"model_response":6,"tool_intent":6,"tool_exec":8,"final":1}`、`tool_exec status: {"ok":6,"denied":2}`、`step1 prompt=765 … step6 prompt=1489 completion=471 ms=7579`，与 `observability.md:139`（22 行分布、exec 比 intent 多 2 条全为拒绝路径）、`:277`（765→1489 近 2×、step6 output=471/ms=7579）逐项吻合，机制解释与 `agent.ts:187-193` 的 deny 先返回、不记 intent 一致。
4. **权限门优先级与默认值属实**：`policy.ts:23-25` 按 `deny → approve → allow` 顺序查规则、`:19` `fallback="deny"`；实跑 `decide()` 输出 `run_shell=deny / write_file=approve / read_file=allow / city=deny(无匹配规则)`，与 `harness-from-scratch.md:121/:124`、`details/05:26` 一致。
5. **外部一手数字与引用经官方源核对全部属实**（我逐条抓取官方页面检索）：Anthropic《How we built our multi-agent research system》→「**90.2%** on our internal research eval」「**about 4×** more tokens than chat interactions, and multi-agent systems use **about 15×**」「token usage by itself explains **80% of the variance**」（`details/04` 全部命中）；Anthropic《Effective Context Engineering》→「**n² pairwise relationships** for n tokens」＋「attention budget」（`details/01` 命中）；Anthropic《Managed Agents》→「**context anxiety**」+ Sonnet 4.5 的 context resets 在 Opus 4.5 成「**dead weight**」、`wake(sessionId)`/`getSession(id)` 取回 event log、OAuth token 存 vault + MCP 专用代理（`details/07`、`details/03`、`details/05` 命中）；Cognition《Multi-Agents Working》→「writes stay single-threaded」「average of **2 bugs per PR**, roughly **58%** severe」（`details/08` 数字命中，仅「唯一」措辞过强，见 F9）；Anthropic《Building Effective Agents》Appendix 2 →「we actually **spent more time optimizing our tools than the overall prompt**」与「always require **absolute filepaths**… used this method flawlessly」（`agent-harness.md:46-47`、`details/02` 命中）；Elasticsearch 官方文档 RRF → `rank_constant`「**Defaults to 60**」且为原生 retriever（`rag.md:124/:138` 命中）。
6. **OTel 属性新旧名差异已被课程自己诚实披露**：`observability.md:76/:79/:107/:349` 明文写「仓库内代码用的是旧属性名 `gen_ai.system` / `gen_ai.session.id`（相对当前规范应为 `gen_ai.provider.name` / `gen_ai.conversation.id`）」；我抓 `raw.githubusercontent.com/open-telemetry/semantic-conventions-genai/main/docs/registry/attributes/gen-ai.md` 核实：`gen_ai.provider.name` 存在（Required）、`gen_ai.conversation.id` 存在（"conversation (session, thread)"）、`gen_ai.session.id` 命中 0、`gen_ai.system` 已不在注册表、`invoke_agent`/`execute_tool` 为合法 span 名 → **课程口径与我核到的一手规范一致，不构成 finding**。
7. **Session 的崩溃检测前提属实**：`session.ts:24-28` 用 `appendFileSync` 同步追加并注释「进程被 kill 时已 append 的行不丢」，与 `harness-from-scratch.md:145`、`agent-harness.md:287`（日志是恢复与审计的地基）一致；`agent.ts:208-209` 确实先记 `tool_intent` 再执行。
8. **`viz/` 无内容性缺口**：`ls viz/` 只有 `chrome.mjs`/`mermaid-check.mjs`/`render.mjs` 三个工具脚本，本分区 5 篇笔记 + 8 篇专题**均未引用 viz 资产**（grep `viz/|![[` 命中 0），故本视角没有图-文不符项可查。

## 转交他人
- `works.astro:133/:393` 的「11 spans」与实际渲染值 → **展示与交付 / 编辑**（并请 Lead 与已登记的「11 spans 当实测」备列去重）。
- FinHot 时长 24/25 分钟在 `notes/sandbox.md`、`sandbox-demo/src/demo.ts:63/:70`、`site/src/pages/interview.astro:40/:76` 的副本 → **技术准确性 B / 教学法**。
- `site/src/pages/works.astro` 是否真把过期的 `recall@5=0.44`/`132 chunks` 渲染到线上页面（`ragStats.ts` 派生链的可视结果） → **展示与交付**（我未抓线上页面）。
- `rag-demo` 的拒答轨（`notes/rag.md:301` 声称「苹果的 CEO 是谁？」→「材料不足」）与 `demo:rag` 三次 LLM 调用 → **技术准确性 B / 事实与时效**（我未跑活端点）。
- `source:` 字段里 `https://www.anthropic.com/engineering/managed-agents` 的**发布日期「2026-04」**（`details/07:22`）→ **事实与时效**（六个 URL 均 200 可达，但页面未给出可稳定引用的发布日期）。
- `harness-from-scratch.md:19` 的模型侦察（`step-5-preview` 不支持 tool calling、`qwen3.8-flash` 支持）与 `agent-harness.md:375` 的 pi 1.1.0 版本敏感断言 → **事实与时效**（需活端点/上游文档，我只读未跑）。

## 本轮未验证的范围（显式列出，均未写作已核实）
- **活端点 demo 一律未跑**：`npm run demo` / `demo:crash` / `demo:reject` / `demo:compact` / `demo:otel` 需要活 LLM 端点，且会**覆写仓内证据文件 `harness-demo/trajectories/demo.jsonl`**（该文件是 `otel-mock-scenario.ts:16-18` 的派生依据），属宪章禁止的写改动；因此 `harness-from-scratch.md:184` 的崩溃恢复实测输出（「重建 7 条消息 / 未知状态 1 个」）、`:206` 三种模式结果、`rag.md:301` 的拒答轨**均未复跑**。
- `harness-from-scratch.md:19` 的模型能力侦察结论、`agent-harness.md:353-376` 的 pi 1.1.0 官方文档核验（未核源码）、`agent-harness.md:470` 的 JD 调研数字：未验证（需活端点/上游文档；pi 版本断言不在我本轮证据内）。
- FinHot 生产数字（`1645 行`、`1830/1875 行`口径差、`~10% 失败`、`858 skipped`、`方向准确率 58% / baseline 49%`、`#35`）：**仓外证据、不可仓内复核**，我只核了其中的「24 vs 25 分钟」矛盾（F4），其余未验证。
- `notes/agent-harness.md:411-518`（第十四、十五节 JD/路线图）与 `notes/evaluation.md` 未逐行区段：只做了关键词抽样，未逐条取证。
- 站点页面渲染、a11y、SEO、构建与 CI：非本视角，未跑 `astro build`（宪章禁止）；线上 `https://blog.zero43.top/learn-agent-harness/` 未抓取（只核源文件与派生逻辑）。
- 我**未**阅读或引用 `analysis/**`、`reviews/**` 任何报告作为证据（仅 `works.astro` 一条在 Lead 备列中出现的线索被标注为「请去重」，结论由我自己的 grep + 判据实跑独立得出）。
- 本报告所有只读命令均在 60s 内结束；`workspace/out/` 由我跑判据时新建，已在收尾 `rm -rf` 复原，起始/收尾 `git status --porcelain` 均为 31 行、无新增改动。
