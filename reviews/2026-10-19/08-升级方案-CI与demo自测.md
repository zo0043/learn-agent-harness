# 08 · 升级方案：CI 全覆盖与 demo 出口自测（demo 自测可执行化盘点 + verify.yml 升级设计）

> 审核人：ci-auditor（CI 组）· 2026-10-19 · 只读审核，**未修改任何仓库现有文件**（收官时 `git status --porcelain` 仅 2 个 untracked：本报告与队友的 07 报告、既有 `session-audit/`）。
> 纪律：每个论断带 `文件:行号`；推断明确标「推断」；不能 headless 验证的标「留浏览器目检」；本机**未跑** `astro build`（宪章禁 + 历史 OOM）、**未装**任何依赖；未跑 ≠ 跑过，逐条如实记录。

## 一句话结论

**9 个 demo 全部本机可跑、退出码语义基本可靠（8 个 offline 断言入口本机全绿 + rag-demo `check:corpus` 是现成范本），但 CI 实际只覆盖 rag-demo 一个命令——范围内 9 demo 中 8 个零覆盖；真正的失实集中在两类：① live 线宣称（拒答轨 / 四能力 / 崩溃恢复）当前因上游代理 503 完全不可复现且无任何门禁，② 带日期的外部事实（registry latest `0.3.302`）当日已漂移（实测 `0.3.303`）；解法是 verify.yml 改 parallel matrix + 每 demo 统一 `npm run check` 出口判据，预计 CI 墙钟增量仅 +1~1.5 分钟。**

---

## 0. 实测环境与审核边界（先证清白）

| 项 | 值 | 证据 |
|---|---|---|
| node | v26.8.2（PATH 首选 `/home/ubuntu/.hermes/node/bin/node`）；备 v22.23.2（nvm） | `node --version` 实跑 |
| NODE_ENV | 未设置（各 README 警告的 `NODE_ENV=production` 跳过 devDeps 问题本机不复现） | `echo $NODE_ENV` 为空 |
| 依赖 | 全部 demo 的 `node_modules` 已存在，**未执行任何 npm i / npm ci** | 本次会话无安装命令 |
| astro build | **未跑**（禁） | —— |
| LLM 端点 | `https://api.zero43.top/v1` 可达；key 有效（`GET /v1/models` → HTTP 200，33 个模型，含 `qwen3.8-flash-next`）；**但 completions 通道 503 `model_not_found: No available channel for model qwen3.8-flash-next`** | 实测 curl + 两条 live demo 实跑（见 §1.10） |
| 仓库改动 | 0（运行产物全部落在 gitignore 路径：`harness-demo/workspace/out/`→.gitignore:21、`framework-demo/out/`→framework-demo/.gitignore:3、`.compare-trace.json`→:4、`durable-execution-demo/.state/`→.gitignore:22、`harness-demo/trajectories/*`→.gitignore:19） | `git check-ignore -v` 逐条实证 |

**实测方法学声明**：第一轮用管道 `| tail` 取退出码，拿到的是 `tail` 的退出码（恒 0）——已发现并**全部用文件重定向重测**（下文所有 exit code 均来自 `npm run X > log 2>&1; echo $?` 原文，非管道）。这是本报告自身的一次「退出码语义不可靠」实例，教训直接用于 §5 的设计。

---

## 1. 逐 demo 盘点表

### 1.1 总表

| demo | package.json | scripts | 自测/评测命令 | 本机实跑 | 耗时(real) | exit 0 语义可靠？ |
|---|---|---|---|---|---|---|
| api-demo | ✅ | `demo` / `typecheck` | `demo` 即断言入口（15 条） | **exit 0** | 0.449s | ✅ 可靠（断言失败 → exit 1） |
| durable-execution-demo | ✅ | `demo` / `demo:one` / `typecheck` | `demo` 即验收矩阵 | **exit 0** | 2.908s | ✅ 可靠（且断言「崩溃必须真被 SIGKILL 打死」） |
| flywheel-demo | ✅ | `demo` / `typecheck` | `demo` 即断言入口（10 条） | **exit 0** | 0.377s | ✅ 可靠 |
| framework-demo | ✅ | `smoke` / `demo` / `compare` / `compare:assert` | `compare:assert`（A1–A16，离线）；`demo`（live，需 secret） | compare:assert **exit 0**；live **未跑通**（503） | compare:assert 8.506s | ✅ 离线线可靠；live 线 exit 0 = 宣称成立但本机不可跑 |
| harness-demo | ✅ | `demo` / `demo:crash` / `demo:reject` / `demo:compact` / `demo:otel` / `demo:otel:mock` / `demo:otel:assert` | `demo:otel:assert`（离线断言）；`test-compact.ts` 有断言但**无 script**（README:40 让用户 `npx tsx` 手跑） | otel:assert **exit 0**（15 spans/1 trace 断言全过）；live `demo` **exit 1**（503） | otel:assert 0.937s；live 1.844s（失败） | ✅ 离线线可靠；live 线 exit 0 = 没崩（无宣称级断言） |
| mcp-demo | ✅ | `demo` | `demo` 即断言入口 | **exit 0** | 0.397s | ⚠️ 基本可靠但有洞：`okAll` 未含「仅 L1 仍泄」（demo.ts:99），README:61 的该条宣称不被守 |
| model-basics-demo | ✅ | `demo` / `typecheck` | `demo` 即断言入口（10 条） | **exit 0** | 0.387s | ✅ 可靠 |
| rag-demo | ✅ | `demo:retrieval` / `demo:bm25` / `demo:rag` / `demo:eval` / `check:corpus` | `check:corpus`（范本：真跑评测 + 9 处副本扫描）；`demo:eval`（16 锚点，未命中即 exit 1）；`demo:retrieval`/`demo:bm25` **零断言**（全文无 `process.exit`，exit 恒 0）；`demo:rag`（live，3 次调用） | check:corpus **exit 0**（134 chunks、0.31/0.38/0.56、PASS 3/8、锚点 16/16）；retrieval/bm25 exit 0（无断言）；`demo:rag` **exit 1**（503） | check:corpus 0.605s；retrieval 0.484s；bm25 0.500s；demo:rag 1.314s（失败） | ✅ check:corpus 强可靠；⚠️ retrieval/bm25 = 「没崩」；live 不可跑 |
| sandbox-demo | ✅ | `demo` / `typecheck` | `demo` 即验收入口（含 3 次重放逐字节） | **exit 0** | 0.416s | ✅ 可靠 |

附加可运行单元（不在 9 demo 内，但 CI 全覆盖设计必须一并决策）：

| 单元 | 本机实跑 | 耗时 | exit 语义 |
|---|---|---|---|
| memory-redteam | `test` exit 0（16/16 探针）；`test:ablate` exit 0（15/15 探针、18/18 层承重）；`test:persist` exit 0 | 0.247s / ~0.3s / 0.633s | ✅ 可靠；零依赖（package.json 自述「无需 npm install」） |
| my-agent | `assert:m4` **exit 1**（starter 未实现，4 条红——**这是设计**）；`assert:m4:solution` exit 0；`assert:m0` exit 1（starter） | 0.378s / 0.376s / 0.368s | ✅ 可靠；**CI 只能跑 `:solution` 变体** |
| final-project | `grade.mjs` 无参 **exit 1**（「未找到成品目录」，grade.mjs:20-25） | 0.195s | ✅ 可靠；CI 不宜跑（无成品目录，跑必红） |
| typecheck（5 个有该 script 的 demo） | api / durable / flywheel / model-basics / sandbox 全部 exit 0 | 各 ~2-4s | ✅；mcp / harness / framework **无 typecheck script** |

### 1.2 逐 demo 细节（证据）

**api-demo**（`src/demo.ts:26-95`）：六模块断言 + 事故场景走查，`finalOk` 假则 `process.exit(1)`（demo.ts:90-93）。断言期望值全部写死手算（assert.ts:223-233 的 `6.5/45/51.5` 等）。README:16 判据行与实跑一致（实跑输出「六模块断言：15 条 全绿」）。**缺口**：README:17 宣称「跑 N 次输出逐字节一致」——demo.ts 不跑第二次，该宣称无门禁（sandbox/durable/mcp 都守了确定性，它没守）。

**durable-execution-demo**（`src/demo.ts:63-131`）：3 崩溃点 × 各 3 次，每次清 `.state`（demo.ts:59-61）→ 子进程真 SIGKILL（runner 侧 `process.kill`）→ resume；断言四项：副作用恒=1、处置符合预期表、崩溃必须真死（`signal=SIGKILL || exit=137`，demo.ts:95-98）、恢复报告 3 次 sha256 一致。实跑三个崩溃点 sha256 均跨 3 次一致（日志 `ee239f775d7a…` 等）。README:19 判据行成立。CI 安全性：SIGKILL 只打自己起的子进程，runner 容器内可跑（推断：GitHub ubuntu-latest 允许进程自杀）。

**flywheel-demo**（`src/demo.ts:39-88`）：10 条断言 + 两轮消融走查（v1→v2 可归因 propose；v2→v3 双变量不可归因 reject），失败 exit 1（demo.ts:83-86）。README:16 成立。同样不守「逐字节一致」宣称（README:17）。

**model-basics-demo**（`src/demo.ts:24-84` + `src/assert.ts`）：10 条断言，期望值为预置常量手算写死（assert.ts:22-32 `PARAMS`、:45-48 `131072`、:53-58 `8589934592`）；README:29 主动声明「常数是量级参考不是真实硬件承诺」——诚实边界写得好。S8 六步走查是打印重算（demo.ts:44-74），无数值门禁（它是叙事走查，可接受）。

**mcp-demo**（`src/demo.ts:38-102`）：对照/防御/单层消融/重放四组，`okAll = leaked(control) && blocked && !leaked(l2) && !leaked(l3) && same`（demo.ts:99）——**缺 `leaked(l1)`**：README:61「仅 L1 → ❌ 仍泄（输入层是软防线）」这条教学结论只被打印、不被断言；若 L1 某天单独拦住了，CI/本机都不会红。重放一致性守了（demo.ts:73 事件序列 + digest）。

**sandbox-demo**（`src/demo.ts:31-90`）：判定流预期表（demo.ts:29 `FLOW_EXPECTED`）+ 四通道覆盖自检 + 边界（路径/env/网络 blocked）+ 幽灵事故 A/B + **3 次逐字节重放**（`assertDeterministic`，demo.ts:77-80）。README:17 判据行成立。确定性宣称有门禁。

**rag-demo**：`check:corpus` 是全场最强门禁（详见 §5.2 评估）：真源 `notes/rag.md` §13 声明值 vs `loadCorpus()` 实际值（check-corpus.ts:36-55）+ 8 处手抄副本逐份扫描（:61-112，含「旧值记录」句段豁免 :77-82）+ **spawn 实跑 `evaluate.ts`** 比对 recall 三值/PASS/锚点（:156-213）。本机复跑全部通过。`demo:eval` 的锚点未命中即 exit 1（evaluate.ts:118-128），但 recall 低不 exit（设计如此——值由 check:corpus 守）。`demo:retrieval`/`demo:bm25` 无任何断言（源码全文无 `process.exit`）——它们的 exit 0 = 没崩。`demo:rag` 需 live LLM（README:35），本机 503。

**harness-demo**：离线判据入口 = `demo:otel:assert`（otel-assert.ts:34-100，~20 项 check，任一失败 exit 1 :95-99）+ `src/test-compact.ts`（test-compact.ts:48-51 断言压缩行为，**但 package.json 无 script**，README:40 让用户手跑 `npx tsx`）。live 线（`demo`/`demo:crash`/`demo:reject`/`demo:compact`/`demo:otel`）需 `LLM_BASE_URL/LLM_API_KEY`（demo.ts:30-33 缺则 exit 1），且 demo.ts 对最终结果**无宣称级断言**——exit 0 = 没崩。README:38 宣称的「15 spans/1 trace（2026-10-12 实跑值）」本机用 `demo:otel:assert` 复跑成立（实测 15 spans/1 trace，工具名多重集与状态分布全部匹配 EXPECTED 契约，otel-mock-scenario.ts:57-70）。

**framework-demo**：离线判据 = `compare:assert`（bash 编排：跑 compare → detached watcher 有界等 Claude 会话 JSONL 落盘 ≤240s → 跨进程 resume 探针 → A1–A16 断言引擎，scripts/compare-assert.sh:31-95；断言引擎 compare-assert.ts:63-140 起）。本机实跑 16/16 + R3-1 防回归全过（10.386s/8.506s 两次测量），退出码透传可靠（compare-assert.sh:33-36、:92-95）。`compare` 单独跑只是打印（无断言门）。`demo`（live）需 `.env` + Anthropic 格式端点，本机 503（step ① 即失败：`turns=1`、无 Read tool_use；step ② 起挂起，本审核不再等待——live 不可跑结论已由 harness/rag 两条独立证据成立）。**留浏览器目检/人工复跑**：live 四能力的真实模型输出。

---

## 2. 失实风险排序（最高优先）

> 判定标准：**宣称了却没有任何命令能复现 = 失实，比没宣称更糟**。分三类：A = 任何命令都复现不了；B = 有命令可复现但 CI 不守（会静默腐化）；C = 健康（有命令且有守门）。

### A 类：宣称了、复现不了（当前为真失实）

| # | 宣称位置 | 宣称内容 | 为什么复现不了 | 本机实测 |
|---|---|---|---|---|
| A1 | `rag-demo/README.md:69` | 「拒答轨：'苹果的 CEO 是谁？' → 模型输出'材料不足' ✓」 | 只有 `demo:rag`（live，3 次 LLM 调用）能展示；`evaluate.ts:189` 自认「拒答行为由 demo-rag 端到端验证」——即**离线评测不断言拒答**；上游 503 | 未跑通，exit 1（503） |
| A2 | `README.md:18` | 「**registry latest 2026-10-19**：`0.3.302` / `0.20.0` / `1.5.1`」 | 带日期的外部 registry 事实，无门禁、无复现命令，随时间必然漂移 | **当日已漂**：registry.npmjs.org 实测 latest = `0.3.303`（claude-agent-sdk）/ `0.20.0`（@openai/agents，仍准确）/ `1.5.1`（langgraph，仍准确）。即 18 行三个数里第一个**写下当天就已过期** |
| A3 | `handoff.md:75-78` | harness-demo 四模式表全标「✅ 真实模型」（正常/崩溃恢复/审批拒绝/压缩） | 命令在（`npm run demo*`），但依赖代理模型通道；上游 503；且 live `demo` exit 0 本身无宣称级断言 | 未跑通，exit 1（503）。注：表内带日期（压缩 = 2026-10-10 晚），属**诚实的历史标注**，但「当前 clone 能复现」不成立 |
| A4 | `framework-demo/README.md:34` + `notes/framework-ecosystem.md:399` | live `npm run demo`「退出码 0 = 10 条 ok() 断言 + 1 条整体判定」 | live 线需 `.env`（Anthropic 格式端点）；上游 503；CI 无 secret 不可跑 | 未跑通（step ① 即 503，exit 非 0） |
| A5 | `harness-demo/README.md:43` | 「实测某 OpenAI 兼容代理的 `qwen3.8-flash-next` ✅；`step-5-preview` ❌（不支持 tool calling）」 | 外部服务状态宣称，**无日期、无命令、无日志锚点**（对比 README:51 的同代理故障宣称至少带了 2026-10-10） | 不可复现（且该代理当前对 qwen3.8-flash-next 直接 503，连 ✅ 半边都不成立） |

### B 类：有命令可复现、但 CI 零守门（「没人守的宣称」——改坏了没人知道）

| # | 宣称（位置） | 复现命令 | 本机复跑 | CI 现状 |
|---|---|---|---|---|
| B1 | 「离线 mock 15 spans / 1 trace」共 **10 处副本**：`site/src/data/mvps.ts:90`、`site/src/data/course-structure.ts:234,287`、`notes/knowledge-map.md:200`、`notes/observability.md:79,109`、`notes/harness-from-scratch.md:212`、`handoff.md:79,138`、`notes/multi-agent.md:262`、`notes/details/06-observability-loop.md:27`、`notes/process/site-refactor-plan.md:128` | `npm run demo:otel:assert`（0.937s，exit 0） | ✅ 成立（15 spans/1 trace，ok×7/denied×1/error×0） | **零覆盖**（harness-demo 在 workflow 出现 0 次） |
| B2 | api-demo「六模块 15 条断言全绿」（`api-demo/README.md:16`；站点串 `site/src/data/mvps.ts:115`） | `npm run demo`（0.449s） | ✅ 成立 | 零覆盖 |
| B3 | flywheel「四模块 10 条断言 + 两轮消融」（`flywheel-demo/README.md:16`；`mvps.ts:124`） | `npm run demo`（0.377s） | ✅ 成立 | 零覆盖 |
| B4 | model-basics「四模块 10 断言 + S8 六步」（`model-basics-demo/README.md:12,16`；`mvps.ts:133`） | `npm run demo`（0.387s） | ✅ 成立 | 零覆盖 |
| B5 | sandbox「重放一致性断言通过」（`sandbox-demo/README.md:17`） | `npm run demo`（0.416s） | ✅ 成立（A/B 各 3 次逐字节一致） | 零覆盖 |
| B6 | durable「3 崩溃点 × 各 3 次，副作用恒=1」（`durable-execution-demo/README.md:19`） | `npm run demo`（2.908s） | ✅ 成立 | 零覆盖 |
| B7 | mcp「对照 ❌ → 防御 ✅ → 消融 → 重放」（`mcp-demo/README.md:56,60-64`） | `npm run demo`（0.397s） | ✅ 成立（但见 §1.2 的 L1 洞：README:61 那条不被守） | 零覆盖 |
| B8 | framework 对照线「三家各 3 工具调用/4 模型调用、gate 均被拒、approve 均生效、FINAL_TEXT 一字不差」（`framework-demo/README.md:77-79`） | `npm run compare:assert`（8.506s，16/16） | ✅ 成立 | 零覆盖 |
| B9 | memory-redteam「16 条红队探针 / 逐层消融 18/18 层承重」（`README.md:25`） | `npm test` / `npm run test:ablate`（0.247s/~0.3s） | ✅ 成立 | 零覆盖 |
| B10 | my-agent「clone 能跑」口径（`site/src/data/courses.ts:155-159` 已注明 demo 目录数=10 的口径） | `assert:m*:solution`（0.376s） | ✅ solution 绿 / starter 红（设计） | 零覆盖 |
| B11 | 「确定性：跑 N 次逐字节一致」——api-demo `README.md:17`、flywheel `README.md:17`、model-basics `README.md:5` | 无（这三个 demo 的 demo.ts 都不跑第二次） | **未守**：mcp（demo.ts:73 事件+digest）、sandbox（replay.ts 3 次）、durable（sha256×3）守了；**6 个宣称确定性的 demo 里 3 个没守** | 零覆盖 |

### C 类：健康（有命令且有 CI 守门）——作为升级基线

- rag-demo chunk/recall/PASS/锚点：`verify.yml:104-108` 一步守（本机复跑全过）；真源唯一（`notes/rag.md:283,293,295`）。
- 站点口径块 / 类集合 / 3 视口几何 / mermaid 渲染：`verify.yml:81`（check-counters）、`:94`（check-classes）、`:192-194`（visual-check）、`:165`（mermaid-check）。

**排序结论**：A1/A2/A3/A4/A5 是「现在就是失实」的五条（A2 最廉价可修、A1 最伤教学信誉——它是 rag-demo README 明写的 ✅ 实证发现）；B 类是「定时炸弹」——11 组宣称全部依赖「人记得复跑」。

---

## 3. CI 现状核实（一手数据）

### 3.1 verify.yml 实跑步骤与耗时（GitHub API 一手源，run #27 / 39259030962，2026-10-19T13:18:32Z→13:20:51Z）

| # | 步骤（行号） | 耗时 |
|---|---|---|
| 1 | Set up job / Checkout（verify.yml:59-62） | 2s |
| 2 | Setup Node 22（:63-69） | 2s |
| 3 | Install dependencies（site `npm ci`，:71-74） | 8s |
| 4 | Counter consistency gate（:81） | 1s |
| 5 | Class-set gate（:94） | <1s |
| 6 | **Corpus chunk-count guard（rag-demo `npm ci` + `check:corpus`，:104-108）** | 1s（npm ci 缓存热） |
| 7 | Build site（astro build，:112） | **37s** |
| 8 | Build sanity（dist HTML 等值 32，:135） | <1s |
| 9 | Install headless Chromium（:147） | 20s |
| 10 | Mermaid render regression（:165） | 13s |
| 11 | Serve dist（:172-186） | 1s |
| 12 | 3-viewport assertions（:188-194） | **50s** |
| 13 | Stop server / Upload artifact（:197-211） | 3s |
| — | **合计** | **139s（2m19s）** |

### 3.2 deploy.yml（run #46 / 39259030706，同日 13:18:29Z→13:19:47Z）

Checkout / Setup Node / `npm ci`（:36）/ **Build（:40，37s 量级）** / Build sanity（:50，2026-10-19 新增的 PRES-F7 修复）/ configure-pages / upload / deploy 两 job，**合计 78s**。

### 3.3 「9/10 demo 零覆盖」说法核实

逐 demo grep `.github/workflows/` 出现次数：**rag-demo = 4**（:104 name、:107-108 run、其余为注释），**其余 8 个 demo + my-agent + memory-redteam + final-project 全部 = 0**。

准确表述（纠正口径）：
- 范围内 **9 个 demo：8 个零覆盖**（89%），rag-demo 是唯一被覆盖的，且只覆盖 `check:corpus` 一个命令（`demo:retrieval`/`demo:bm25` 未直接跑，`demo:rag` 跑不了）。
- 若把 my-agent / memory-redteam 也算「可运行 demo 单元」，则 **10/11 零覆盖**（全仓 12 个 package.json：9 demo + my-agent + memory-redteam + site；site 被覆盖）。
- 所以「9/10」的分子分母都不精确：**建议对外统一口径为「范围内 9 demo 8 个零覆盖；含 my-agent/memory-redteam 则 10/11」**，并写进 knowledge-map 口径块由 check-counters 守（推断：该口径目前无门禁）。

### 3.4 与既有设计的一致性

verify.yml 头部声明「与 deploy 独立 concurrency、互不阻塞」（:24-25）——升级设计必须保持这条（新增 job 也独立成组，见 §4）。rag-demo 步骤的注释（:96-103）已示范「为什么单独一步而不并进 check-counters」（要 import TS 生成器）——demo matrix 化之后这一步应迁入 matrix（rag-demo leg 自带 npm ci），避免重复装两遍。

---

## 4. 升级设计：verify.yml 怎么改

### 4.1 方案选择：parallel matrix（不拆 workflow、不串行）

| 候选 | 结论 |
|---|---|
| 串行加步骤 | ❌ 本机纯执行已 ~17s，但每 demo 一次 `npm ci` 冷缓存 20-40s，串行 +12-20 分钟，verify 从 139s 劣化到 ~15min |
| **parallel matrix（每 demo 一个 leg）** | ✅ 墙钟增量 = 最慢 leg（framework，npm ci 冷 + compare:assert ≈ 60-90s）；`fail-fast: false` 一个 demo 红不取消其他 leg，报告全量 |
| 拆独立 workflow | ⚠️ 可作为 live 线的归宿（见 §4.4），offline 线留在 verify.yml 内保持「一个 PR 一个总绿」 |

### 4.2 YAML 草图（新增 job，直接可落地；不触碰既有 build-and-verify job）

```yaml
# ── 新增：demo 出口自测矩阵（offline，零 key）────────────────────────────
  demos:
    runs-on: ubuntu-latest
    timeout-minutes: 10          # 单 leg 上限：本机最慢 framework 8.5s；留 npm ci 冷缓存 + ~10x 余量
    strategy:
      fail-fast: false           # 失败策略：一个 demo 红不阻断其他 leg 出结果；matrix 整体红仍阻断 PR
      matrix:
        include:
          - { demo: api-demo,               check: 'demo',            lock: 'api-demo/package-lock.json' }
          - { demo: durable-execution-demo, check: 'demo',            lock: 'durable-execution-demo/package-lock.json' }
          - { demo: flywheel-demo,          check: 'demo',            lock: 'flywheel-demo/package-lock.json' }
          - { demo: model-basics-demo,      check: 'demo',            lock: 'model-basics-demo/package-lock.json' }
          - { demo: mcp-demo,               check: 'demo',            lock: 'mcp-demo/package-lock.json' }
          - { demo: sandbox-demo,           check: 'demo',            lock: 'sandbox-demo/package-lock.json' }
          - { demo: rag-demo,               check: 'check:corpus',    lock: 'rag-demo/package-lock.json' }   # 取代既有 :104-108 步骤
          - { demo: harness-demo,           check: 'demo:otel:assert', lock: 'harness-demo/package-lock.json' } # 待补 test-compact script（P1）
          - { demo: framework-demo,         check: 'compare:assert',  lock: 'framework-demo/package-lock.json' }
          - { demo: memory-redteam,         check: 'test',            lock: '' }   # 零依赖：跳过 npm ci
          - { demo: my-agent,               check: 'assert:m4:solution', lock: 'my-agent/package-lock.json' } # starter 必红是设计，只跑 solution
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      # 每 demo 独立锁文件 → setup-node 内置 cache 只认单一路径，改手动 cache 按 lock hash 键控
      - name: Cache node_modules
        if: ${{ matrix.lock != '' }}
        uses: actions/cache@v4
        with:
          path: ${{ matrix.demo }}/node_modules
          key: demos-nm-${{ matrix.demo }}-${{ hashFiles(matrix.lock) }}
          restore-keys: demos-nm-${{ matrix.demo }}-
      - name: Install (npm ci, cold-cache safe)
        if: ${{ matrix.lock != '' }}
        working-directory: ${{ matrix.demo }}
        run: npm ci
      - name: Run exit self-test (${{ matrix.demo }} → ${{ matrix.check }})
        working-directory: ${{ matrix.demo }}
        run: |
          set -o pipefail
          npm run ${{ matrix.check }} 2>&1 | tee check.log
      # artifact：失败时也上传（现场即证据）； durable 的 .state/ 与 framework 的 .compare-trace.json 可选第二 path
      - name: Upload check log (always)
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: demo-check-${{ matrix.demo }}-${{ github.run_id }}
          path: |
            ${{ matrix.demo }}/check.log
            ${{ matrix.demo }}/.compare-trace.json
          retention-days: 14
          if-no-files-found: ignore
```

要点说明（都带依据）：
- **超时 10 分钟/leg**：本机最慢 framework `compare:assert` 8.5s、durable 2.9s；CI 变量是 npm ci 冷缓存（framework lock 97KB 最大）+ Claude 会话 JSONL 落盘等待（compare-assert.sh:54-61 有界 240s）+ 跨进程 resume 探针。10 分钟覆盖最坏组合（推断：GitHub runner 磁盘/CPU 优于本机 2 核 3.4GB，本机 8.5s 已是保守上界）。
- **失败策略**：`fail-fast: false`（全量报告）；matrix job 红 = PR 红（这就是「9 demo 有人守」的含义）。live 线不进来（见 §4.4）。
- **durable-execution 的 SIGKILL**：只杀自己 spawn 的 worker 子进程（demo.ts:35 `spawnSync`），容器内合法；`.state/` 每次运行前 `rmSync` 自清（demo.ts:59-61），无跨 run 污染。
- **framework 的端口 8791**：mock 端点固定端口（README:99「被占用时友好退出 exit 2」）——CI 全新 runner 无占用；detached watcher 用 `setsid`（compare-assert.sh:49），Linux runner 支持。
- **my-agent 只跑 `:solution`**：starter 补全前必红（本机实测 assert:m4 exit 1），把 starter 放进去 = 永久红。
- **memory-redteam 跳过 npm ci**：零依赖（package.json description 自述），`lock: ''` 走 if 分支。
- **artifact**：check.log 必传（失败现场即证据，沿用 verify.yml:204-211 的 `if: always()` 哲学）；framework 额外传 `.compare-trace.json`（断言引擎的输入面，复跑断言用）。

### 4.3 迁入与去重

既有 `verify.yml:104-108` 的 rag-demo 步骤迁入 matrix 的 rag leg 后删除，避免 site 之外再装一份 rag 依赖（原步骤自己注释了「单独装 rag-demo 依赖」，matrix 化后这个特殊性消失）。

### 4.4 live 线独立 workflow（需 secret，不阻断 PR）

```yaml
name: Verify demos (live, needs LLM secret)
on:
  schedule: [{ cron: '0 2 * * 1' }]   # 每周一 UTC 02:00；live 随代理状态漂，不做 PR 门禁
  workflow_dispatch:
jobs:
  live:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    continue-on-error: true            # 代理挂 ≠ 仓库坏：红只告警，不拦任何东西
    env:
      LLM_BASE_URL: ${{ secrets.LLM_BASE_URL }}
      LLM_API_KEY: ${{ secrets.LLM_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
        working-directory: harness-demo
      - run: npm run demo            # 正常路径
        working-directory: harness-demo
      - run: npm ci && npm run demo:rag
        working-directory: rag-demo
      - run: npm ci && npm run smoke && npm run demo   # smoke = 最小连通性探针（src/smoke.ts）
        working-directory: framework-demo
```

理由：harness-demo demo.ts:30-33 / rag README:35 / framework README:18 三条 live 线的宣称本质是「对接过真实端点」的历史事实（带日期的那些，handoff.md:75-78），**当前代理 503 已证明它们随时会不可复现**——把这种线塞进 PR 门禁只会制造长期红灯狼来了。schedule + continue-on-error + secret 是唯一诚实形态。**留人工目检**：live 输出的终端交互（模型是否真调工具、审批拒绝后是否不重试）。

---

## 5. 「出口自测」统一定义：`npm run check`

### 5.1 定义与必备五件

**统一语义：`npm run check` exit 0 ⇔ 本 demo 对外宣称的全部数值/行为成立。** exit 非 0 必须能指出「哪条宣称不成立」（像 check-corpus.ts:114-122 那样列出 drift 明细），不允许「跑完没崩就算过」。据此每个 demo 的 check 应包含：

1. **数值核对**：宣称值 vs 实跑值。期望值要么手算写死（model-basics assert.ts:45-48 范式），要么从唯一真源派生（check-corpus.ts:36-55 范式）——**禁止手抄第二份数**。
2. **行为探针**：核心机制的正/负路径（攻击得逞 vs 被拦：mcp demo.ts:99；降级与如实失败：api demo.ts:66-82；审批拒绝后不重试：harness live，当前只能人工）。
3. **边界用例**：每层单独失效仍安全（mcp 单层消融 demo.ts:60-63；sandbox 路径/env/网络三边界 demo.ts:51-61；api 的 400 不重试 assert.ts:138-151）。
4. **确定性**：两次（或三次）运行逐字节/sha256 一致（sandbox replay.ts、durable demo.ts:102、mcp demo.ts:73 范式）——**当前 6 个宣称确定性的 demo 有 3 个没守（§2-B11），补齐进 check**。
5. **负路径自证（mutation）**：人为改坏一个宣称值/行为，check 必须红。站点侧已有范式（verify.yml:26-31 的 fault 注入 + visual-check `--fault`）；demo 侧最小实现 = 临时改一个期望值复跑必须非 0（check-corpus.ts 头部的「四项变异测试」commit 信息即是范例：§13 回填旧值 / PASS 改数 / chunk 改数 / README 写旧值，各自判红）。

**分层**：`check = 行为断言（demo 内置 assert 入口）+ 宣称值守门（check:corpus 式：文档副本扫描 + 实跑对比）`。两者缺一不可：前者守「代码是对的」，后者守「嘴上说的和代码跑的一致」。

### 5.2 `rag-demo/check:corpus` 作为范本：够不够？

**够的（四点，直接推广）**：
1. **真跑不手抄**：spawn `evaluate.ts` 实跑，与 `notes/rag.md` §13 声明逐项比对（check-corpus.ts:156-213）——recall 从「手抄 + 写死绊线」升级为机器校验，这是全仓唯一做到「宣称值 = 实跑值」的 demo。
2. **全副本扫描**：真源之外 8 处手抄逐份校验，副本出现任何非实际值即 exit 1（:61-112）——直接治理「修一处漏两处」。
3. **旧值豁免的句段规则**：同句段内带废止标记（旧/已废/历史…）不算活声明（:77-82）——避免把「历史记录」误判为漂移，这个规则是被真实误报打磨出来的。
4. **响亮失败**：声明行解析不到也 exit 1（:40-43），门禁不被静默绕过。

**不够的（四点，不能照抄了事）**：
1. **它守的是「文档宣称 vs 实跑」，不是「demo 行为」**：pipeline 行为（SSE 拼接/拒答/消融/重放）不在其内——那些是各 demo 自己 `demo` 脚本里断言的事。**结论：check:corpus 是「宣称值门禁」的范本，不是「demo 出口自测」的范本；出口自测 = 它 + 行为断言两层。**
2. **拒答轨不断言**：`evaluate.ts:189` 明说拒答由 demo-rag 端到端验证，而 demo-rag 要 live LLM → rag-demo README:69 的「✅ 拒答」宣称实际无守门（§2-A1）。修法：在 check 里加**离线拒答断言**——用空/无关 context 驱动 generator，断言输出为拒答话术（generator.ts 的强制拒答路径本就可离线走，推断：只需把 llm.ts 换成 mock 或直接测 generator 的拒答分支）。
3. **副本清单硬编码**（REPLICAS :61-70）：新增宣称位置不会自动纳入——可接受，但要在注释里写明「加副本先加这里」。
4. **覆盖不到 demo:retrieval / demo:bm25 的任何展示值**：这两个命令零断言（源码无 `process.exit`），它们打印的「已知相关最优排名」等教学观察值无人守——要么补断言，要么在 README 明标「演示命令，非判据」。

### 5.3 每 demo 的 `check` 组成建议（落地清单）

| demo | `check` 应为 | 现状差距 |
|---|---|---|
| api-demo | `tsx src/demo.ts` + 双跑逐字节 diff | demo 即断言入口（✅）；缺确定性双跑（P2） |
| durable-execution-demo | `tsx src/demo.ts` | ✅ 现成（验收矩阵 + sha256 一致性） |
| flywheel-demo | `tsx src/demo.ts` + 双跑 diff | ✅/缺双跑 |
| model-basics-demo | `tsx src/demo.ts` + 双跑 diff | ✅/缺双跑 |
| mcp-demo | `tsx src/demo.ts`，并把 `leaked(l1)` 纳入 `okAll`（demo.ts:99） | 断言入口✅；L1 洞（P1） |
| sandbox-demo | `tsx src/demo.ts` | ✅ 现成（含 3 次重放） |
| rag-demo | `tsx src/check-corpus.ts`（+ 离线拒答断言） | ✅ 现成；拒答轨补断言（P0） |
| harness-demo | `tsx src/test-compact.ts && tsx src/otel-assert.ts` | test-compact 无 script（P1）；otel:assert ✅ |
| framework-demo | `bash scripts/compare-assert.sh` | ✅ 现成（= compare:assert） |
| memory-redteam | `node test.mjs && node test.mjs --ablate && node test.mjs --persist` | 命令全在，无 `check` 聚合 script（P1） |
| my-agent | `assert:m0:solution`…`assert:m4:solution` 串联 | 无聚合 script；starter 必红须显式排除（P1） |

（「+ 双跑 diff」指 `npm run check` 内部跑两次数值/输出 sha256——一次性的脚本成本，换 README 确定性宣称有人守。）

---

## 6. 成本估算

### 6.1 CI 时长增量

| 项 | 本机实测 | CI 估算（含冷 npm ci） |
|---|---|---|
| 11 个 leg 纯执行合计 | ~17s | ~17-30s |
| 每 leg npm ci（冷缓存） | —（未装） | 20-40s/leg（framework lock 97KB 最重；memory-redteam 0） |
| **parallel matrix 墙钟增量** | — | **≈ 最慢 leg ≈ 60-90s**（framework：ci ~40s + compare:assert ~10s + JSONL 落盘等待通常 0-数秒，compare-assert.sh:54-61） |
| verify 总时长 | 139s（现） | **≈ 200-230s（+45-65%）** |
| 串行方案（否决） | — | +12-20min → ~15min（不可接受） |
| live workflow | — | 每周 1 次 ~3-5min，`continue-on-error` 不计入门禁 |

GitHub 计费分钟（public repo 免费额度内）：11 legs × ~1.5min ≈ 16 min/run（推断：按 leg 计费，matrix 并行不省分钟但省墙钟）。

### 6.2 维护成本

- **一次性**：11 个 `check` script 各 ~10 分钟（多数只是把现有断言入口挂上去）；双跑 diff 脚本 6 个 demo 共用一份 ~30 分钟；mutation 自证每 demo 一次 ~5 分钟。
- **持续性**：宣称值变更时同步——已有 check:corpus 范式可抄（它的存在让 rag.md §13 改数必须同步 9 处，本次实测这个机制真的在工作：125→134 chunks 的漂移被 CI 抓住过，见 git log 首条 commit message「语料 125→134，CI 的语料守卫当场判红——门禁在正确工作」）。
- **registry latest 类宣称**（README:18）：建议改为「只写 pin + 不写 latest」或加 `as of` 日期 + 季度人工复核——任何门禁都守不了「外部世界的当前状态」，只能守「写下的日期与值的组合曾经为真」（推断：这类宣称的正确形态是带日期的历史记录，不是现在时）。

### 6.3 前置依赖矩阵（哪些 demo 跑不起来、需要什么）

| demo | 离线可跑？ | 前置 |
|---|---|---|
| api / durable / flywheel / model-basics / mcp / sandbox | ✅ 零 key 零网络 | 仅 node_modules |
| rag-demo `check:corpus` / `demo:eval` / retrieval / bm25 | ✅ 零 key | 仅 node_modules；`demo:rag` 需 LLM_BASE_URL/API_KEY（README:35） |
| harness-demo `demo:otel:assert` / `demo:otel:mock` / test-compact | ✅ 零 key（本地 mock 端点） | 仅 node_modules；`demo*` 需 .env |
| framework-demo `compare` / `compare:assert` | ✅ 零 key（本地 mock 127.0.0.1:8791） | node_modules（含 claude-agent-sdk-linux-x64 optional dep，npm ci 会自动装）；`demo`/`smoke` 需 .env（Anthropic 格式端点） |
| memory-redteam | ✅ 零依赖 | 无 |
| my-agent | ✅（仅 :solution） | node_modules |
| final-project `grade.mjs` | ⚠️ 无参必红 | 需学员成品目录；**不建议进 CI**（没有成品 = 永久红），留手动/教学流程 |

**当前唯一的外部单点**：`api.zero43.top` 代理的模型通道（本机实测 503 `No available channel for qwen3.8-flash-next`，而 key 本身有效、模型在 /v1/models 列表里）——这正是 live 线必须与 PR 门禁隔离的实证理由。

---

## 7. P0 / P1 / P2 分级（每项带验收判据）

### P0（本周内；不修就是持续失实）

| # | 动作 | 验收判据 |
|---|---|---|
| P0-1 | verify.yml 增加 demos parallel matrix（§4.2 草图），11 个 offline leg 全进；删除原 :104-108  rag 步骤（迁入 matrix） | push 后 GitHub run 页面出现 11 个 demo leg 全绿；任一 demo 的 demo 脚本被人为改坏（如把 api assert.ts 一个期望值改错）→ 对应 leg 红、其他 leg 仍绿（fail-fast: false 生效） |
| P0-2 | rag-demo 补**离线拒答断言**进 check（治 §2-A1）：空/无关 context 走 generator，断言拒答话术；README:69 宣称随之可离线复现 | `npm run check:corpus`（或新 check 入口）在拒答分支被改坏时 exit 1；本机实跑 exit 0 且输出含拒答断言行 |
| P0-3 | README.md:18 的「registry latest 2026-10-19：0.3.302」更正为实测值 0.3.303（registry.npmjs.org 一手源，2026-10-19），或整句改为「只写 pin 不写 latest」 | 该行三个版本号与 `npm view <pkg> version` 输出一致（或不再出现 latest 现在时表述） |
| P0-4 | handoff.md:75-78 / harness-demo README:32-39 / framework README:34 的 live 宣称加「当前不可复现」状态标注（上游 503，2026-10-19 实测） | 三处均出现「live 依赖代理通道；2026-10-19 实测 503 不可跑」类标注；不与既有历史日期标注矛盾（就地划改，非追加） |

### P1（两周内；把「没人守的宣称」变成「有人守」）

| # | 动作 | 验收判据 |
|---|---|---|
| P1-1 | 每 demo 落 `npm run check` script（§5.3 表；harness 补 `test-compact` script；memory-redteam / my-agent 补聚合 script；my-agent 只串 `:solution`） | `npm run check` 在 11 个单元全部 exit 0（本机复跑留日志）；check 与宣称的对应关系写进各 README 判据行 |
| P1-2 | mcp-demo `okAll` 纳入 `leaked(l1)`（src/demo.ts:99） | 把 L1 单独改成「能拦住」时 demo exit 1（mutation 自证）；正常树 exit 0 |
| P1-3 | 15 spans/1 trace 的 10 处副本由 P0-1 的 harness leg（demo:otel:assert）自动守；同时把「离线 mock 15 spans」与「历史活端点 11 spans 未验证」的措辞冻结（不得把 11 写成判据） | harness leg 绿 = 10 处副本的现值被守；改动 EXPECTED 契约（otel-mock-scenario.ts:57-70）而不改断言 → leg 红 |
| P1-4 | live workflow（§4.4）落地：schedule + secret + continue-on-error；harness/rag/framework 三线 + framework smoke 探针 | 手动 dispatch 一次：代理恢复时全绿、代理挂时黄不红（continue-on-error 生效）；secret 不进日志 |
| P1-5 | rag-demo `demo:retrieval` / `demo:bm25` 二选一：补断言 或 README 明标「演示命令非判据」 | 二者之一落地；不得维持「看起来像判据实际零断言」的现状 |

### P2（本月内；确定性与口径收口）

| # | 动作 | 验收判据 |
|---|---|---|
| P2-1 | api / flywheel / model-basics 补「双跑逐字节/sha256」进 check（治 §2-B11；共用一份 runner 脚本） | 任一处引入 `Date.now()`/`Math.random()` → check 红（mutation 自证） |
| P2-2 | 「范围内 9 demo 8 个零覆盖」口径写进 knowledge-map 计数口径块，由 check-counters 派生断言（治 §3.3 的口径不准） | 改坏该数字 → check-counters 红；CI 现状与该块一致 |
| P2-3 | artifact 完善：durable `.state/`、framework `.compare-trace.json` 随失败上传（§4.2 已含 path）；retention 14 天与既有 visual-verify 对齐 | 故意弄红一个 demo leg → artifact 里能下到该 demo 的 check.log 现场 |
| P2-4 | harness-demo README:43 的 `step-5-preview ❌` 补日期与证据形态，或改为「代理能力随通道变动，跑前看 /v1/models」（README:45 已有同款纪律，照抄） | 该行不再是无日期现在时外部断言 |
| P2-5 | final-project `grade.mjs` 明确「不进 CI」并写入手册（它有正确退出码语义，缺的只是成品目录） | README/handoff 出现「grade.mjs 为教学流程判据，非 CI 门禁」表述 |

### 留浏览器目检（本报告不覆盖、不冒充覆盖）

1. 站点像素级视觉审美（既有约定，verify.yml:19-21 已声明只断言结构+几何）。
2. live 三线的终端交互实跑（模型是否真调工具 / 审批拒绝后是否不重试 / 拒答话术）——待代理恢复后人工一次，**不得用 HTTP 200 或 exit 0 代替**。
3. framework live 四能力中「子代理委派真发生」的流式输出（forwardSubagentText，README:179）——headless 之外的人工确认。

---

## 8. 实测证据附录（命令原文 + exit + 耗时，可重跑）

本机 node v26.8.2、NODE_ENV 空；全部 `npm run <script>` 原文执行，退出码取自文件重定向（非管道）：

```
demo=api-demo               script=demo             exit=0  real 0m0.449s   （15 条断言全绿 + 事故场景通过）
demo=durable-execution-demo script=demo             exit=0  real 0m2.908s   （3 崩溃点×3 次，副作用恒=1，sha256 跨次一致）
demo=flywheel-demo          script=demo             exit=0  real 0m0.377s   （10 条断言 + 两轮消融）
demo=model-basics-demo      script=demo             exit=0  real 0m0.387s   （10 条断言 + S8 六步重算）
demo=mcp-demo               script=demo             exit=0  real 0m0.397s   （对照❌→防御✅→消融→重放一致）
demo=sandbox-demo           script=demo             exit=0  real 0m0.416s   （A/B 各 3 次逐字节一致）
demo=rag-demo               script=check:corpus     exit=0  real 0m0.605s   （134 chunks；9 处副本全符；recall 0.31/0.38/0.56；PASS 3/8；锚点 16/16）
demo=rag-demo               script=demo:retrieval   exit=0  real 0m0.484s   （零断言：exit 0 = 没崩）
demo=rag-demo               script=demo:bm25        exit=0  real 0m0.500s   （零断言：exit 0 = 没崩）
demo=rag-demo               script=demo:rag         exit=1  real 0m1.314s   （未跑通：LLM HTTP 503 model_not_found）
demo=harness-demo           script=demo:otel:assert exit=0  real 0m0.937s   （15 spans/1 trace 断言全过；历史 11 spans 对照打印为「未验证」）
demo=harness-demo           script=demo             exit=1  real 0m1.844s   （未跑通：LLM HTTP 503；live 线无宣称级断言）
demo=framework-demo         script=compare:assert   exit=0  real 0m8.506s   （A1–A16 + R3-1 全过；跨进程 resume ok）
demo=framework-demo         script=demo             exit=1（未跑完，step① 即 503；live 线）
demo=memory-redteam         script=test             exit=0  real 0m0.247s   （16/16 探针）
demo=memory-redteam         script=test:ablate      exit=0                （15/15 探针、18/18 层承重）
demo=memory-redteam         script=test:persist     exit=0  real 0m0.633s
demo=my-agent               script=assert:m4        exit=1  real 0m0.378s   （starter 未实现——设计内必红）
demo=my-agent               script=assert:m4:solution exit=0 real 0m0.376s
demo=final-project          script=grade            exit=1  real 0m0.195s   （无参 = 未提交，语义正确）
typecheck：api / durable / flywheel / model-basics / sandbox 全部 exit=0（mcp / harness / framework 无该 script）
LLM 端点：GET /v1/models → 200（33 模型，含 qwen3.8-flash-next）；completions → 503 No available channel
registry.npmjs.org（2026-10-19）：@anthropic-ai/claude-agent-sdk latest=0.3.303；@langchain/langgraph latest=1.5.1；@openai/agents latest=0.20.0
GitHub Actions API：verify run #27 共 139s（步骤明细见 §3.1）；deploy run #46 共 78s
```

**未跑清单（不得当成跑过）**：`astro build`（禁）；所有 `npm i / npm ci`（禁装依赖）；live 三线（上游 503）；framework live step② 之后（挂起，不再等待）；`viz/render.mjs`、`whiteboard/`（不在本次范围）。

---

## 9. 收口：一句话回顾

9 个 demo 的「可执行化」早就完成了（本机 8 个 offline 断言入口 + rag 范本门禁全部一次跑绿），缺的不是测试而是**把测试接进 CI 的那根线**；在这根线接上之前，仓里所有「✅ 实跑」里最值钱的两类（live 四能力/拒答轨、registry 现状）正在随时间变成失实——P0-1 的 matrix 是根，P0-2/3/4 是止血，P1/P2 是把「宣称—命令—门禁」三角焊死。
