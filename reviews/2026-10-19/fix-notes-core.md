# 修复日志｜notes-core 组（`notes/agent-harness.md` / `harness-from-scratch.md` / `rag.md` / `observability.md` / `evaluation.md` / `details/**`）

- 修复组：`notes-core`（成员 `tech-core`）｜开始：2026-10-19 00:16（Asia/Shanghai）
- 上游依据：`reviews/2026-10-19/FIX-CHARTER.md` §1 冻结口径、§3「notes-core」12 条；评审期报告 `reviews/2026-10-18/01-tech-core.md`
- 可写范围（宪章 §2）：上列 6 个路径 + 本日志。**其他文件只读**。

## 覆盖声明
- 计划修改文件：`notes/harness-from-scratch.md`（B3/F5、F6、F11、PED-F15）、`notes/rag.md`（F7、F10）、`notes/agent-harness.md`（F4）、`notes/observability.md`（F4 副本、P9）、`notes/evaluation.md`（F12）、`notes/details/02-tool-granularity.md`（PED-F14）、`notes/details/03-error-paths.md`（F6）、`notes/details/04-token-economics.md`（P4）、`notes/details/06-observability-loop.md`（F8/PED-F13）、`notes/details/08-single-threaded-write.md`（P4）
- 12 条清单状态表（边改边更新）：

| # | ID | 文件 | 状态 |
|---|---|---|---|
| 1 | B3 / TECH-A-F5（门序 + 未知工具实测） | harness-from-scratch.md | 待改 |
| 2 | TECH-A-F6（exit 137 = 模拟崩溃） | harness-from-scratch.md、details/03 | 待改 |
| 3 | TECH-A-F7（去「可证明」） | rag.md | 待改 |
| 4 | TECH-A-F10（pgvector 扩展） | rag.md | 待改 |
| 5 | TECH-A-F11（任务分步 5 条） | harness-from-scratch.md | 待改 |
| 6 | TECH-A-F12（示例值 0.94） | evaluation.md | 待改 |
| 7 | TECH-A-F4（24→25 分钟） | agent-harness.md（+observability 副本） | 待改 |
| 8 | P4（details/04、08 一手源 vs 未覆盖） | details/04、details/08 | 待改 |
| 9 | TECH-A-F8 / PED-F13（details/06 未覆盖行） | details/06 | 待改 |
| 10 | PED-F14（details/02 标题） | details/02 | 待改 |
| 11 | P9（demo.jsonl → demo.example.jsonl） | observability.md | 待改 |
| 12 | PED-F15（白板 178 行） | harness-from-scratch.md | 待改 |

## 逐条修改记录
<!-- 每条按 ID | 文件:行 | 改动前→后引文 | 验证命令 + 关键输出 追加 -->

### 1｜B3 / TECH-A-F5｜`notes/harness-from-scratch.md:81`、`:128-140`（门序与未知工具失败语义）
- **改动前**（:81）「实测：模型调用未注册工具 `city` → "未知工具: city" 回写 → 模型自己改调 `get_weather`。」；mermaid 首节点为 `V{"校验 名称已注册？参数合法？"}`，再流向 `policy.decide`。
- **改动后**（:81）「实测（`policy` 兜底先于校验）：**未注册**的工具名根本走不到校验层——`DEMO_POLICY.decide("city")` → `deny（无匹配规则，默认拒绝）`，模型收到的是「[策略拒绝] 无匹配规则」，不是「未知工具」；`callTool` 里的 `未知工具:` 分支是 defense-in-depth…」；mermaid 改为 **policy → (approve) → 记 intent → `callTool` 内校验 → 执行**，并在图后新增「**门序注意（对照 `src/agent.ts` / `src/tools.ts`，2026-10-19 复核）**」一段。
- **依据**：`harness-demo/src/agent.ts:186` 先 `o.policy.decide(name)`，:209 才记 `tool_intent`，:219 才 `callTool`（校验在 `tools.ts:106`）。
- **验证命令 + 输出**：
  ```
  $ cd harness-demo && ./node_modules/.bin/tsx /tmp/polcheck.mjs
  decide(city) => deny  (无匹配规则，默认拒绝)
  decide(read_file) => allow
  decide(run_shell) => deny   (命中规则: deny)
  decide(write_file) => approve
  $ cd - && grep -n "未知工具:\|policy 兜底先于校验" notes/harness-from-scratch.md
  81:**任何失败…实测（`policy` 兜底先于校验）：…`callTool` 里的 `未知工具:` 分支是 defense-in-depth…
  ```

### 2｜TECH-A-F6｜`notes/harness-from-scratch.md:179`、`notes/details/03-error-paths.md:26`（exit 137 = 模拟崩溃）
- **改动前**（:177→改后 :179）「**实测输出（真实崩溃 + 真实恢复）**：」；`details/03:26`「…真实崩溃 exit 137 + 真实恢复的实测输出」。
- **改动后**（:179）「**实测输出（模拟崩溃：harness 内 `process.exit(137)` 自触发 + 真实恢复）**：」；`details/03:26` 改为「模拟崩溃（harness 内 `process.exit(137)` 自触发）+ 真实恢复的实测输出」（同批第 7 条一并落地，见下）。
- **依据**：`harness-demo/src/agent.ts:213` 打印「[崩溃演示] 模拟进程崩溃…」，:214 `process.exit(137)`——崩溃由 harness 自己触发，与外部 SIGKILL 不同。
- **验证**：`grep -n "模拟崩溃：harness 内" notes/harness-from-scratch.md` → `179:…`（见本条输出）；未跑 `npm run demo:crash`（会覆写仓内证据 `trajectories/demo.jsonl`，宪章 §0.5 禁止写改动）。

### 3｜TECH-A-F11｜`notes/harness-from-scratch.md:202`（任务分步与 `demo.ts` 对齐）
- **改动前**「任务：查北京天气 → 列 docs → 读 README → 写 out/summary.md（需审批）→ 试 run_shell（会被拒）→ 总结。」（run_shell 是第 5 个箭头）
- **改动后**「任务（与 `src/demo.ts:42-46` 的 5 条编号一致）：① 查北京天气 → ② 列 docs 并读 `README.md` → ③ 写 `out/summary.md`（需审批）→ ④ 试 `run_shell`（会被拒）→ ⑤ 总结。」
- **依据**：`harness-demo/src/demo.ts:42-46` 的 user prompt 是 5 条编号（4=run_shell、5=总结），与同页 `:184`（原行号）「第 4 项 run_shell 被策略拒绝」自洽。
- **验证**：`grep -n "与 \`src/demo.ts:42-46\`" notes/harness-from-scratch.md` → `202:任务（与 src/demo.ts:42-46 的 5 条编号一致）…`

### 4｜PED-F15｜`notes/harness-from-scratch.md:6`、`:214`（白板 ~150 → 178 行）
- **改动前**「`whiteboard/agent_whiteboard.py`（~150 行纯标准库）」「## ⑩ 白板蒸馏（`whiteboard/agent_whiteboard.py`，~150 行纯标准库）」
- **改动后**两处均改「178 行纯标准库」。
- **验证命令 + 输出**：`wc -l whiteboard/agent_whiteboard.py` → `178 whiteboard/agent_whiteboard.py`；`grep -n "178 行" notes/harness-from-scratch.md` → `6:…（178 行纯标准库）`、`216:## ⑩ 白板蒸馏（…，178 行纯标准库）`。

### 5｜TECH-A-F7｜`notes/rag.md:65`、`:327`（去掉「可证明的召回损失」）
- **改动前**：`:65`「这就是 ANN 的核心交易：**用可证明的微小召回损失换数量级的延迟下降。**」；`:327`「…核心交易一句话：**用可证明的微小召回损失换数量级的延迟下降**。」
- **改动后**：`:65`「典型经验损失是 recall@1 从 0.99 掉到 0.95 量级（HNSW/IVF 都是启发式索引，**没有召回下界**，实际损失随索引类型/参数/数据分布变化，只能实测——`efSearch` / `nprobe` 就是那个旋钮）…核心交易：**用经验上很小、可实测的召回损失换数量级的延迟下降。**」；`:327`「损失可实测：…**没有召回下界**…核心交易一句话：**用经验上很小、可实测的召回损失换数量级的延迟下降**。」
- **依据**：HNSW 原论文（arXiv:1603.09320）摘要给的是近似最近邻方法，不含召回保证；`0.99→0.95` 在仓内/一手源均无出处，已降级为「典型量级」。
- **验证命令 + 输出**：`grep -n "可证明" notes/rag.md ...` → **空**（全仓本区已清）；`grep -n "可实测的召回损失" notes/rag.md` → `65:…`、`327:…`。

### 6｜TECH-A-F10｜`notes/rag.md:80`（pgvector 是扩展不是内建）
- **改动前**「**pgvector（Postgres 内建 HNSW/IVFFlat）**是你的锚点…」
- **改动后**「**pgvector（Postgres 的向量扩展：需安装并 `CREATE EXTENSION vector`，提供 HNSW/IVFFlat 索引）**是你的锚点…」
- **依据**：官方 README `https://raw.githubusercontent.com/pgvector/pgvector/master/README.md` → 首行「Open-source vector similarity search for Postgres」、「Compile and install the extension (supports Postgres 13+)」、「Enable the extension … `CREATE EXTENSION vector;`」。
- **验证**：`grep -n "向量扩展" notes/rag.md` → `80:…Postgres 的向量扩展：需安装并 CREATE EXTENSION vector…`

### 7｜TECH-A-F4｜`notes/agent-harness.md:212`（24 → 25 分钟）＋ `notes/details/03-error-paths.md:26`（F6 第二处）
- **改动前**：`agent-harness.md:212`「…生产 worker/api 被幽灵代码替换了 **24 分钟**。」；`details/03:26`「…非只读不盲目重放、先摆状态让模型用 read_file 核对——**真实崩溃 exit 137** + 真实恢复的实测输出）」
- **改动后**：`agent-harness.md:212`「…替换了 **25 分钟**。」（与 `notes/sandbox.md:28/:35/:87/:421`、`notes/interview-bank.md:135`、`agent-harness.md:420`、`sandbox-demo/src/demo.ts:63`、`site/src/pages/interview.astro:40/:76` 的 25 分钟对齐）；`details/03:26`「…**模拟崩溃（harness 内 `process.exit(137)` 自触发）** + 真实恢复的实测输出）」
- **验证（改动前基线）**：`grep -rn "24 分钟\|25 分钟" --include=*.md --include=*.ts --include=*.astro . | grep -v node_modules` → `agent-harness.md:212`（24）、`observability.md:299`（24）、`agent-harness.md:420`/`sandbox.md:28/:35/:87/:421`/`interview-bank.md:135`/`sandbox-demo/src/demo.ts:63/:70`/`interview.astro:40/:76`（均 25）
- **验证（改动后）**：`grep -rn "替换了 24 分钟" notes/` → **空**；`grep -n "替换了 25 分钟" notes/agent-harness.md notes/observability.md` → `212`、`299`
- **注**：`observability.md:299` 属我一区，已一并改为 25；`sandbox.md` / `interview-bank.md` / `interview.astro` 属别区（见「转交」）。

### 8｜P9｜`notes/observability.md` 的 `demo.jsonl` 引用改 `demo.example.jsonl`（含数字按入库文件重算）
- **改动前**：`observability.md:124`「subgraph JSONL["轨迹事件流（trajectories/demo.jsonl，22 行）"]」；`:139`「`trajectories/demo.jsonl` 中真实出现的事件类型是…（22 行：…）」；`:261`「样本事实（真实，来自 demo.jsonl）：22 个事件；…；`final.totalMs = 26749`；累计 `usage` = **6736 in / 1127 out**（合计 7863 tokens）」；`:275`「也可直接读 `trajectories/demo.jsonl`」；`:352`「`trajectories/demo.jsonl`（22 事件：…）」
- **改动后**（5 处路径）：
  - `:124` → `轨迹事件流（trajectories/demo.example.jsonl，22 行）`
  - `:139` → `trajectories/demo.example.jsonl` 中真实出现的事件类型是…（22 行：…）；并补一句「`demo.jsonl`（本地运行产物，未入库）由 `npm run demo` 生成」
  - `:261` → 样本事实（真实，来自 demo.example.jsonl）…`final.totalMs = 26700`；累计 `usage` = **6740 in / 1130 out**（合计 7870 tokens）
  - `:275` → 也可直接读 `trajectories/demo.example.jsonl`
  - `:352` → `trajectories/demo.example.jsonl`（22 事件：…）
  - 同时把 S7 走查表里来自活端点的 6 行 step 数字改为入库文件的等价值（765→770 / 875→880 / 1051→1050 / 1173→1170 / 1383→1380 / 1489→1490；104→100 / 68→70 / 67→70 / 257→260 / 160→160 / 471→470；6528→6500 / 1861→1900 / 1592→1600 / 4563→4600 / 4614→4600 / 7579→7600；`:277`、`:291-297` 的引用值同步）
- **依据**：`git ls-files harness-demo/trajectories/` → 只有 `demo.example.jsonl`；两份文件事件分布与结论一致，但逐事件数字不同（活端点那份有波动）。
- **验证命令 + 输出**：
  ```
  $ git ls-files harness-demo/trajectories/
  harness-demo/trajectories/demo.example.jsonl
  $ node -e '…统计两份…'
  demo.example.jsonl lines= 22 {"init":1,"model_response":6,"tool_intent":6,"tool_exec":8,"final":1} totalMs= 26700 usage= 6740in/1130out
  demo.jsonl         lines= 22 {"init":1,"model_response":6,"tool_intent":6,"tool_exec":8,"final":1} totalMs= 26749 usage= 6736in/1127out
  step1 example: p=770 c=100 ms=6500 | live: p=765 c=104 ms=6528
  step2 example: p=880 c=70 ms=1900 | live: p=875 c=68 ms=1861
  step3 example: p=1050 c=70 ms=1600 | live: p=1051 c=67 ms=1592
  step4 example: p=1170 c=260 ms=4600 | live: p=1173 c=257 ms=4563
  step5 example: p=1380 c=160 ms=4600 | live: p=1383 c=160 ms=4614
  step6 example: p=1490 c=470 ms=7600 | live: p=1489 c=471 ms=7579
  ```
- **验证（改动后）**：`grep -c "demo.example.jsonl" notes/observability.md` → `6`（`:124/:139/:261/:275/:352` + `:139` 内的未入库说明）；`grep -n "26749\|6736\|765 → 1489" notes/observability.md` → **空**；`grep -n "26700\|6740" notes/observability.md` → `261`（样本事实段）。

### 9｜TECH-A-F12｜`notes/evaluation.md:180`（示例值避开已作废旧值）
- **改动前**「**版本化** | 评测集有版本号；**指标必须绑定版本**（"v3 上 recall@5=0.94"，裸数字无意义）」
- **改动后**「…（"v3 上 recall@5=0.86"，裸数字无意义；示例值，非本仓 rag-demo 数字）」
- **依据**：`0.94` 是 rag-demo 旧行号指针期已作废的宣称值（`notes/rag.md:295`、`README.md:14` 标「已废」），示例值与废值撞车会让读者误读。
- **验证**：`grep -n "recall@5=0.94" notes/evaluation.md` → **空**；`grep -n "recall@5=0.86" notes/evaluation.md` → `180`。
- **注**：按宪章 §1 冻结口径 `recall@5` **不改** rag.md 的值（0.44 / 132 chunks，HEAD 下成立），本条只动 `evaluation.md` 的示例数字。

### 10｜TECH-A-F8 / PED-F13｜`notes/details/06-observability-loop.md:26-27`（把「已落地」移出「未覆盖」）
- **改动前**（`:26-27`）「- 已覆盖：…（见下）…」/「- 未覆盖:OTel 埋点已落地(harness-demo `demo:otel:mock` 离线 mock 实测 **15 spans/1 trace**,2026-10-12;历史活端点「11 spans」未验证、不作判据;`demo:otel:assert` 可离线复跑);仍缺 getEvents() 式"位置切片重放"的 API 示例,也没有"逐步观察 agent"的控制台产物(Anthropic 自定义 UI 无对应 demo)。」
- **改动后**：`已覆盖` 行并入「OTel 埋点已落地（harness-demo `demo:otel:mock` 离线 mock 实测 15 spans/1 trace，2026-10-12；历史活端点「11 spans」未验证、不作判据）」；`未覆盖` 行只留真缺口「缺 `getEvents()` 式『位置切片重放』的 API 示例，也没有『逐步观察 agent』的控制台产物（Anthropic 自定义 UI 无对应 demo）」。
- **验证**：`sed -n '24,28p' notes/details/06-observability-loop.md` → `已覆盖` 行含「OTel 埋点已落地」，`未覆盖` 行以「缺 `getEvents()` 式」开头、不再含「已落地」。

### 11｜PED-F14｜`notes/details/02-tool-granularity.md:20-22`（标题与正文自认「URL 推断」不符）
- **改动前**：标题「## 行业一手源」；正文「Anthropic《Writing Tools for Agents》：…（注：此 URL 由引用推断，要点已对照已核验的上下文工程文章与《Building Effective Agents》。）」
- **改动后**：标题「## 行业来源（URL 由引用推断，待核）」；正文保留原要点，并把「注：此 URL 由引用推断…」前置为正文首句，不再只放在括号附注里。
- **验证**：`grep -n "行业来源（URL 由引用推断，待核）" notes/details/02-tool-granularity.md` → `20`。
- **注**：标题文字改了，但 8 篇专题的「行业一手源 / 已覆盖 / 未覆盖」三段结构**未动**（`site/src/pages/index.astro:217` 只宣传结构、不解析该标题字面；`site/tools/check-counters.mjs` 不校验它——本轮 grep 全仓仅命中 `details/02` 自身一处）。

### 12｜P4｜`notes/details/04-token-economics.md:27`、`notes/details/08-single-threaded-write.md:27`（同页「一手源」与「未覆盖」矛盾）
- **改动前**（04:27）「- 未覆盖：没有 4x/15x 行业对比数字与"80% 方差"数据；…」（08:27）「- 未覆盖：没有"决策一致性"理论框架…；没有 Devin Review 的行业数字（2 个 bug/PR、58% 严重级）；…」
- **改动后**（04:27）「- 未覆盖：没有把 4x/15x 行业对比数字与"80% 方差"数据**转成可执行的架构选择判据/检查清单**（数字本身已在「行业来源」列出）；课程有预算机制，但没有"用 token 账本做架构选择（更大模型 vs 更多 agent）"的行业数据支撑。」（08:27）「- 未覆盖：没有"决策一致性"理论框架（行动携带隐式决策→并行=决策冲突）；**Devin Review 的行业数字（2 个 bug/PR、58% 严重级）已在「行业来源」列出，未转成本地可复现判据**；本地幽灵事故的归因口径是"缺 scope"，还没有"缺写线程"这个归因视角。」
- **依据**：两页的「未覆盖」都声称某个数字不存在，而同页「行业一手源」已给出该数字（Anthropic 多智能体文章：4×/15×/80% 方差；Cognition：2 bug/PR、58%），属直接矛盾。
- **验证**：`sed -n '22,28p' notes/details/04-token-economics.md`、`sed -n '22,28p' notes/details/08-single-threaded-write.md` → 「未覆盖」行不再声称数字缺失，改为「未转成判据」。





## 未修改的条目 + 原因
<!-- 待补 -->

## 转交他人（别区连带问题）
<!-- 待补 -->

## 自检
<!-- 待补：git status --porcelain 变化清单 -->
