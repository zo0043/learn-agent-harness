# t9 R3 评审日志——t3（三家 SDK 离线 mock 对照）· 第 1 轮

- 评审人：architect2（非实现者，未参与 t3 实现；t3 实现者为 sdk-dev2）
- 日期：2026-10-13；环境 node v26.8.2 / npm 11.19.1；工作树 HEAD 8879887（t5 分支提交之上，t2/t3/t4/t6 未提交改动在树内）
- 原始输出：`/tmp/t9-review/`（compare-1.log / compare-2.log / compare-assert.log / sabotage-assert.log）
- 一键复跑：`bash audit/review-t3-t9-rerun.sh`
- 评审基准：t3 最终契约（9 条 acceptance + 5 条 verify，inScope=`framework-demo/`，取自团队任务台账 amend 记录）

## §0 结论

**verdict = needs_revision**（1 条 high + 2 条 medium，均可在 framework-demo/ 内 3 行内修复）。

- t3 的 **9 条 acceptance 本身全部成立**（§2 逐条独立证据）；5 条 verify 命令独立复跑全部 exit 0（§3）。
- 「离线 mock 名副其实」核验通过：三家都是**真实 SDK 包**对**本地 127.0.0.1 mock** 实跑，无桩、无跳过；16 条断言覆盖三家（§4 覆盖矩阵）；负测试证明断言非恒真、退出码可靠（§4.3）。
- 越界检查通过：t3 改动全部在 framework-demo/ 内；冻结口径 6/15/17/18/205+37/rag §13 未动；语料三成员未被 t3 触碰（§6）。
- 但对照表**结论与代码一致性**检查发现 1 处实质错误（R3-1，high）+ 6 处 file:line 指针失准（R3-2）+ 1 处契约明令禁止的环境表述（R3-3）。详见 §7。

## §1 评审基准（t3 契约，自团队任务台账恢复）

9 条 acceptance（最终 amend 版，原文照录）：

| # | acceptance |
|---|---|
| A1 | 三家 SDK 各有对同一白板任务的最小实现，全部指向本地 mock 模型端点；任何交付断言必须在**离线 mock** 下可复现——真实端点是否可用**不作为验收标准**（不得声称「本环境无端点」，也不得把 live 跑通当作验收前提） |
| A2 | 一条命令跑完三家并打印结构化对照：`npm run compare`；断言脚本 `npm run compare:assert` 逐条断言（工具调用次数 / 权限拦截行为 / 中断恢复行为 / 消息与状态形态），退出码可靠（不符即非 0） |
| A3 | 对照维度至少 5 项：loop 归属、工具与 schema 声明、权限与 human-in-the-loop 钩子、状态与中断恢复、可观测钩子；每维度附代码 file:line 指针 + 官方文档 URL（须联网核实可达） |
| A4 | 诚实标注：README 与本任务产出写明「离线 mock 模型、非真实模型实跑」；若提供 live 模式须由环境变量显式开启且默认关闭，不得作为验收前提 |
| A5 | 核清并统一 framework-demo 的断言口径：「11/11 断言」实为「10 断言 + 1 总体判定」——以源码实数为准改写（含 README 与 demo 输出），不得为保住旧数字而调整断言 |
| A6 | 确定性：同一命令两次运行输出一致（mock 固定响应，不引入时间/随机漂移） |
| A7 | 不新增第 7 个可运行作品；对照产物落在既有 framework-demo/ 内 |
| A8 | framework-demo/README.md 给出对照表路径 + 各维度结论摘要（可被逐条引用） |
| A9 | 语料纪律：不得改动 notes/rag.md、notes/agent-harness.md、handoff.md |

5 条 verify：`npm run compare` / `npm run compare:assert` / `npx tsc --noEmit` / 两次 compare diff 为空 / 口径 grep（无活「11/11」）。

## §2 九条 acceptance 逐条独立核验（均不复用实现者自述）

| # | 判定 | 独立证据 |
|---|---|---|
| A1 | ✅ | 三家适配器均用**真实 SDK 原语**：claude.ts:13,69 `query()`（`@anthropic-ai/claude-agent-sdk`）、openai.ts:28,97,105 `Agent/run/tool`（`@openai/agents-core`）、langgraph.ts:21,108-114,137 `StateGraph/compile/streamEvents/Command`（`@langchain/langgraph`）；node_modules 实测版本 0.3.296 / 0.20.0 / 1.4.21（与 package.json/lock 一致）。同一任务：`WHITEBOARD_PROMPT`（task.ts:19）三家逐字共用（claude.ts:70 / openai.ts:97 / langgraph.ts:122）。全部指向 mock：claude.ts:48 `ANTHROPIC_BASE_URL=mock.anthropicBaseUrl`、openai.ts:39、langgraph.ts:38；A14 断言三家 baseUrl 前缀 `http://127.0.0.1:`。离线可复现：compare 路径不 import env.ts（仅 lib.ts:7/smoke.ts:4 引用，属 live 线）、不读 .env；本评审在离线环境实跑通过 |
| A2 | ✅（附 R3-1 发现） | `npm run compare` exit 0，输出结构化对照（三家明细+五维表+结论）；`npm run compare:assert` exit 0，16/16（A1-A3 工具次数 / A5,A6,A7 权限拦截 / A8-A11 中断恢复 / A12,A13 消息与状态形态）。退出码可靠：负测试（§4.3）破坏行为后 exit 1。附注：compare 打印的五维表 1 格结论与代码不符（R3-1），断言集未覆盖该格 |
| A3 | ✅（附 R3-2 发现） | 5 维度齐备（sdk-comparison.md 维度 1-5），每维度有 file:line + 官方 URL。URL 12/12 实测 HTTP 200（§5.1）。指针抽查：约 30 处中 24 处精确命中被引代码，6 处失准 1-5 行（R3-2）；所有维度的**结论**与代码行为一致（逐条核过适配器源码与实跑输出），唯 compare 打印表的 LangGraph HITL 格例外（R3-1） |
| A4 | ✅ | 诚实标注三处：compare.ts:5-7 头注、compare 输出首行【诚实标注】（compare-1.log:6）、README:10-17「诚实标注（先读）」、sdk-comparison.md:5-6。live 线 = 独立脚本 `npm run demo`（需 .env，默认不跑、不在 compare/compare:assert 路径上），README:7-8,14-15 明示「非验收前提、默认不跑」；compare/compare:assert 全程无 .env 依赖（§2 A1）。live 线本评审**未实跑**（纪律选择，与 t7 一致） |
| A5 | ✅ | 独立 grep capabilities.ts：`ok(` 恰 10 处（:13,14,37,38,62,63,64,73,75,76）；demo.ts:17-19 末尾行用 `assertionTotal()` 实数计数（lib.ts:79-80 `ok()` 内 `total++`），无硬编码；README:81-90 口径章节；全目录 `grep -rn '11/11'`（含 ts/md/sh/json，排除 node_modules）**0 命中**；A15 运行时静态断言 ok()=10 ✅ |
| A6 | ✅ | 两次 `npm run compare` 输出 sha256 相同（`77b0e8a8…2aa1`）、`diff` 空（compare-1.log vs compare-2.log）。代码面：mock-model.ts 零时间（`created: 0` :165）零随机，响应为请求纯函数；适配器不把 UUID/时间戳打进 stdout（claude.ts:199 注释+实现） |
| A7 | ✅ | `git status` 未跟踪新增全部落在 framework-demo/（+t1/t2/t4/t7 的 audit/、harness-demo/、memory-redteam/）；无新增顶层作品目录；`site/src/pages/works.astro` 零 diff；courses.ts 唯一改动是 t6 的 :175 限定语（非作品卡）；`WORK_COUNT = 6`（courses.ts:273）未动；knowledge-map:15 口径块「六个具名作品目录」未回退 |
| A8 | ✅ | README:66 指向 `docs/sdk-comparison.md`；README:69-75 五维一句话结论表（每格可逐条引用）；README:77-79 同任务不变量（3/3/3、4/4/4、gate 拒绝、FINAL_TEXT、127.0.0.1）——与实跑输出逐条对上 |
| A9 | ✅ | `git diff --stat`：notes/rag.md **零 diff**；notes/agent-harness.md 与 handoff.md 有 diff 但内容逐 hunk 核验为 t4（U-25 FinHot 脚注 ×2）与 t6（:14/:77 11 spans→15 判据、:162 11/11→10+1）所为，**无任何 t3 主题内容**；t3 的 changedPaths 全部在 framework-demo/ 内（git status 逐文件核对） |

## §3 关键命令独立复跑（V1-V5）

| # | 命令 | 退出码 | 关键输出 |
|---|---|---|---|
| V1 | `cd framework-demo && npm run compare` | 0 | `模型=mock-whiteboard-v1 @ http://127.0.0.1:8791`；`【诚实标注】离线 mock 模型，非真实模型实跑`；三家均 `工具调用 3 次`、`模型调用 4 次`；五维表+结论行（R3-1 所在行见 §7） |
| V2 | `cd framework-demo && npm run compare:assert` | 0 | `断言 16/16 全部通过 ✅（退出码 0）`；`RESUME_PROBE OK same_session=true`；A11 `jsonl=完整转录(3 tool_result, 落盘等待 0s) 跨进程resume=ok 产物文件=true`；A15 `ok()=10` |
| V3 | `cd framework-demo && npx tsc --noEmit` | 0 | 无输出（干净） |
| V4 | `npm run compare > c1 && npm run compare > c2 && diff c1 c2` | 0 | diff 空；两次 sha256 `77b0e8a883b86f3111c908328ac1d49a516fdd924ccc3150f0a87cbbd7ab2aa1` 相同 |
| V5 | `grep -rn '11/11\|10 断言\|断言 + 1' framework-demo/{README.md,src/*.ts,src/sdks/*.ts,docs/*.md}` | 0 | 0 处活「11/11」；命中全为「10 断言 + 1 总体判定」口径句（README:34,83,89；compare-assert.ts:145-146；demo.ts:16,19；lib.ts:72） |

## §4 「离线 mock 名副其实」专项

### 4.1 三家真跑通（无桩/无跳过）

- **Claude**：claude.ts 用 `query()` 真实拉起 claude CLI 子进程（`ANTHROPIC_BASE_URL`→mock、`mock-key`、遥测/自更新 env 逐个关闭 :53-56）；实跑输出含真实流事件 9 条、`Read/Bash/Bash` 工具名序列、canUseTool 回调 deny 证据、会话 JSONL 落盘（A11 三重证据）。
- **OpenAI**：openai.ts 用 `new Agent({ tools: [tool({…})] })` + `run()`；实跑输出 `read_doc/delete_temp/publish_note` 序列、`needsApproval` 真挂起（`newItems 含 tool_approval_item（name=publish_note）`）、两段 run 续跑、最终请求 msgs=8。
- **LangGraph**：langgraph.ts 用 `StateGraph + MemorySaver + interrupt/Command`；实跑输出 `interrupt() 在 tools 节点挂起…value.tool=publish_note`、同 thread resume 续跑、checkpoint_id 存在、最终 state 8 条 messages。
- 无 `skip`/`stub`/假轨迹：`.compare-trace.json` 的轨迹由三家适配器在实跑中采集；mock 请求日志按「运行前/后」切片计数（各 4 次模型调用，A16 断言通过）。
- mock 本身（mock-model.ts）：`node:http` 绑 127.0.0.1（:25,:318），双格式路由（/v1/messages :301、/v1/chat/completions :307），响应=请求体纯函数（tool 结果计数→step，:119-124），零时间零随机；非模型流量（/v1/models、遥测端点）收无害响应不 5xx（:312-316）。

### 4.2 断言覆盖三家（非只覆盖一家）

16 条断言 × 3 家覆盖矩阵（compare-assert.ts）：

| 断言 | 覆盖 | 类别 |
|---|---|---|
| A1 | Claude | 工具次数/名 |
| A2 | OpenAI | 工具次数/名 |
| A3 | LangGraph | 工具次数/名 |
| A4,A5,A6,A7 | 三家 | 最终输出/gate 拒绝/approve 完成 |
| A8 | OpenAI | 中断恢复（真挂起） |
| A9 | LangGraph | 中断恢复（真挂起） |
| A10,A11 | Claude | 中断恢复（进程内+跨进程磁盘） |
| A12 | OpenAI | 消息与状态形态 |
| A13 | LangGraph | 消息与状态形态 |
| A14 | 三家 | 离线端点 |
| A15 | 静态 | U-24 口径 |
| A16 | 三家 | 模型调用次数 |

每家各被 9 条断言约束（A15 为静态口径项）；三家各有**专属**行为断言（A1/A2/A3 逐家工具名、A8/A9/A10-A11 逐家中断恢复、A12/A13 逐家状态形态）。

### 4.3 负测试（断言非恒真、退出码可靠）——本评审自建，t7 未做过 t3 负路径

方法：`cp -r framework-demo /tmp/t9-sabotage`（node_modules 软链），两处破坏：
1. openai.ts `delete_temp.execute` 拆除策略（`denied:false, actionPerformed:true`，返回 "deleted (sabotage)"）；
2. mock-model.ts `FINAL_TEXT` 改为不含「已被权限策略拒绝」的文本。

结果：`npm run compare:assert` → **A5 ❌、A6 ❌，14/16，`断言失败 2 条：A5, A6 ❌（退出码 1）`，SABOTAGE_EXIT=1**（sabotage-assert.log）。破坏点与失败断言一一对应，无恒真、无误报。

## §5 对照表指针与 URL 核验

### 5.1 官方文档 URL（12 条唯一 URL，全部联网实测）

12/12 **HTTP 200**（curl -L，2026-10-13）：code.claude.com/docs/en/agent-sdk/{agent-loop,permissions,user-input,sessions,observability}；openai.github.io/openai-agents-js{,/guides/results/、/guides/tools/、/guides/human-in-the-loop/}；langchain-ai.github.io/langgraphjs/concepts/{low_level,human_in_the_loop,persistence}。

### 5.2 file:line 指针审计（全量 30 处引用逐一取行核对）

- 精确命中被引代码：26 处（35 处唯一引用中；含 openai.ts:97,105,51,62-71,76,98-105,88-94；langgraph.ts:108-114,114,123,125-131,137,88,139-146,180-186；claude.ts:80,81,131,132-133,144,155-171；task.ts:19,105；mock-model.ts:28,119,292）。
- **失准 6 处（R3-2，详见 §7）**：claude.ts:64×3（实 :69）、claude.ts:74（实 :75-79/文件头 :4-5）、langgraph.ts:38（实 :76-79）、langgraph.ts:34-57（实 :43-72）、langgraph.ts:60（实 :74）、claude.ts:196-199（实 :192-196）；另有 mock-model.ts:302/308 偏差 1 行（实 :301/:307）。
- 结论一致性：逐维度核对适配器源码与实跑输出，除 R3-1 所述 1 格外，各维结论均有代码依据（非文档复述）。

## §6 越界与冻结口径

- **改动归属**：t3 的 changedPaths 全部在 `framework-demo/`（git status 逐文件：package.json、README.md、.gitignore、docs/sdk-comparison.md、scripts/、src/{compare,compare-run,compare-assert,mock-model}.ts、src/sdks/×5）；工作树其余改动归属 t2（memory-redteam/、long-term-memory.md）、t4（harness-demo/、agent-harness.md、industry-2026.md 等）、t5（已提交 6 个 commit）、t6（README.md、handoff.md、interview-bank/knowledge-map/framework-ecosystem/mcp/06-observability-loop/sandbox/evaluation/data-flywheel、courses.ts）——逐 hunk 抽检无 t3 内容混入。
- **冻结口径**：6 作品（WORK_COUNT=6、README 作品表 6 行、knowledge-map:15 口径块未回退）/ 15 域 / 17 课程页（notes 顶层 19−2）/ 18 课程卡 / 205+37 题 / rag §13 数字（132 chunks / 0.31·0.44·0.50 / PASS 3/8 / 锚点 16/16，t4/t6 已各自守卫，本评审未重跑 eval——t3 未触语料，无触发条件）——全未变。
- **语料三成员**：rag.md 零 diff；agent-harness.md / handoff.md 的 diff 非 t3 所为（§2 A9）。
- **.env 卫生**：framework-demo/.env 等 3 个 .env 均 untracked+gitignored，无密钥入库；t3 未改动 .env。
- **临时探针残留**：src/ 顶层无 `_probe/_iso/_dbg`；唯一 "probe" 文件 src/sdks/resume-probe.ts 为 A11 有意组件（README:117 已说明）。

## §7 发现（3 条，均不涉冻结口径/语料）

### R3-1（high）compare 五维表「权限与 HITL」行 LangGraph 格与代码不符——把 OpenAI 的 API 安到 LangGraph 上

- 位置：`framework-demo/src/compare.ts:53-56`（DIMENSIONS 第 3 行）：三分支只写了 claude 与非 claude 两支，非 claude 支的文案「…人工审批一等原语：**needsApproval=true**（run 在审批点停下）」被 OpenAI 与 LangGraph **共用**。
- 复现：`npm run compare` 输出五维表（本评审 3 次运行一致）：
  `权限与 human-in-the-loop 钩子 | canUseTool 逐调用回调… | 无预执行权限门…needsApproval=true（run 在审批点停下） | 无预执行权限门…needsApproval=true（run 在审批点停下）`
  ——第 3 格（LangGraph）与第 2 格逐字相同，而 `needsApproval` 是 **OpenAI Agents SDK** 的 API；LangGraph 的真实机制是 `interrupt()`（同一次输出的 ③ LangGraph 明细节、README:73、sdk-comparison.md:37 三处均正确写成 `interrupt() 真挂起`，代码 langgraph.ts:88,137 亦然）。
- 为什么必须修：这是**旗舰对照命令** stdout 里的结论性错误——拿着这张表去答「三家区别」会说出「LangGraph 的审批原语是 needsApproval」这种不存在的 API；恰好违背本任务「不是复述文档定位」的初衷。且 A1-A16 无一覆盖该格（断言只看行为轨迹，不看表格文案），绿基线抓不到。
- 修法（1 行级）：compare.ts:53-56 补 langgraph 分支，文案对齐 sdk-comparison.md 维度 3（如「无预执行权限门（策略在工具内）；人工审批一等原语：interrupt() 真挂起 → Command({ resume })」）；建议顺带在 compare:assert 加一条轻量断言（或 README 自检 grep）锁定五维表 5×3 格中每格含该家专属关键词（canUseTool / needsApproval / interrupt），防回归。

### R3-2（medium）docs/sdk-comparison.md 头注「行号对应当前提交」不成立：6 处 file:line 指针失准

| 引用 | 被引内容 | 当前实际行 |
|---|---|---|
| `src/sdks/claude.ts:64`（维度 1/2/5 三处） | `for await (const m of query({...}))` / options 无工具声明 | for-await 在 **:69**；options 块 :71-103 |
| `src/sdks/claude.ts:74`（维度 1「loop 语义见注释」） | loop 归属注释 | :74 = `maxTurns: 10,`；loop 归属说明在文件头 **:4-5**（permissionMode 注释 :75-79） |
| `src/sdks/langgraph.ts:38`（维度 1「agent 节点按节点调 LLM」） | agentNode 调 LLM | :38 = ChatOpenAI 构造的 `configuration` 行；agentNode 在 **:76-79**（`bound.invoke` :77） |
| `src/sdks/langgraph.ts:34-57`（维度 2「三个 tool(...)」） | 三个工具声明 | 三个 tool 实为 **:43-72**（readDoc :43-52 / deleteTemp :53-62 / publishNote :63-72） |
| `src/sdks/langgraph.ts:60`（维度 2「bindTools」） | `model.bindTools([...])` | bindTools 在 **:74**（:60 是 `},`） |
| `src/sdks/claude.ts:196-199`（维度 5「events/samples 汇总」） | observability 汇总 | observability 对象 **:192-196**（events :194 / samples :195）；:196-199 已入 `extra` 块 |

另有 mock-model.ts:302/308 引路由行，实为 :301/:307（偏差 1 行，可不改）。失准模式一致（claude.ts 整体偏 5 行、langgraph.ts 偏 4-14 行），判断为文档早于末次代码收口、行号未回刷。**结论本身与代码一致**（§5.2），失准仅影响可导航性。修法：按上表回刷行号，或把头注改为「行号为撰写时近似行号，以符号名为准」。

### R3-3（medium）mock-model.ts:3 头注含契约明令禁止且实测不成立的环境断言

- 位置：`framework-demo/src/mock-model.ts:3`：「为什么需要它：**本环境无任何 LLM key、无可用外网模型端点**。要做『三家 SDK 同任务对照』…」
- 问题：① t3 契约 A1 明确「**不得声称『本环境无端点』**」（该条款正是因 t1 实测推翻旧约束而 amend 进来的）；② 事实不成立——`framework-demo/.env` 存在且含非空 key 条目（captain 复核过 3 个 .env），t7 独立探测 `api.zero43.top/v1/chat/completions` 得 HTTP 200 真实 completion（t7 §8 F3）；③ 同一事实的**正确写法**就摆在 README:12-15（「全部打到 127.0.0.1:8791…live 是否可用不是本目录的验收标准」）与 package.json:6（「无 key 可跑」——说的是对照线不需 key，表述成立）。
- 同类残留：t3 完成报告括号语「（无 key）」措辞同病（报告文本，不改文件，记录在案）。
- 修法（1 行）：mock-model.ts:3 改为「对照线**不依赖任何真实 key/端点**：要把『三家 SDK 同任务对照』做成离线可复现的断言，就必须把一个确定性的假模型放到 HTTP 上…」。

## §8 边界清单（本评审未验/不可验部分）

1. **live 线（真实模型实跑）**：本评审未实跑（纪律选择：验收契约明言 live 可用与否不作验收标准）。README/产出未据 live 能力作任何断言；live 线代码仅经 `tsc --noEmit` 校验（V3 覆盖全部 src）。
2. **LangGraph 版本号口径**：仓内 1.4.21 为 2026-10-12 dated 快照（t4 台账）；t7 已独立复核 registry latest 前进至 1.5.0（F2）——属「截至」措辞问题，captain 整合时统一裁决，非 t3 缺陷（t3 的 package.json/lock 与台账同口径）。
3. **Claude 会话 JSONL 刷盘时机**：A11 在本次运行中 0s 可见（干净环境）；README 踩坑④已如实标注时机不可控且「node 父进程门控刷盘」说法不作结论——评审认可该诚实性。
4. t5 的 CI 证据（run 38282562346 等）不在本任务评审范围（t3 不涉站点）。

## §9 复跑方法

```bash
bash audit/review-t3-t9-rerun.sh        # V1-V5 全量复跑 + 指针审计脚本
```

原始日志：/tmp/t9-review/{compare-1.log, compare-2.log, compare-assert.log, sabotage-assert.log}。
