# framework-demo · 框架生态实证（三家 SDK 同任务离线对照 + Claude 四能力实操）

**两条线，一个目录：**

1. **三家 SDK 同任务离线对照**（本 README 的主体）：Claude Agent SDK / OpenAI Agents SDK / LangGraph
   跑**同一个白板任务**，全部指向**本地 mock 端点**，一条命令出结构化对照 + 一条命令出可信断言。
2. **Claude 四能力 live 实操**（`npm run demo`，原有内容）：指向 `.env` 里的本地双格式代理
   （真实模型），**非验收前提**、默认不跑——见「诚实标注」。

## 诚实标注（先读）

- **对照线全部是离线 mock 模型**：`mock-whiteboard-v1` 是本仓库内的确定性 mock
  （`src/mock-model.ts`），模型调用全部打到 `127.0.0.1:8791`，**不是真实模型实跑**，也不依赖网络。
- **live 模式默认关闭**：`npm run demo` 才连真实端点（`.env`，本地双格式代理）；
  live 是否可用**不是**本目录的验收标准——对照线的所有断言在离线 mock 下可复现。
- 三家 SDK 之间比较的是**框架结构差异**（谁拥有 loop / 怎么声明工具 / 怎么拦权限 /
  状态存哪 / 怎么吐事件），与模型能力无关——这正是同一 mock 能压三家的原因。

## 跑法

```bash
# node v22 环境（/usr/bin/node 是 v12，禁用）
export PATH=~/.nvm/versions/node/v22.23.2/bin:$PATH
cd framework-demo

# 注意：全局 NODE_ENV=production 会让 npm 跳过 devDependencies，必须显式 --include=dev
npm install --include=dev

# ── 对照线（离线 mock，零网络，可重复） ──
npm run compare        # 一条命令：三家跑同一白板任务，打印结构化对照（含五维表）
npm run compare:assert # 一条命令：跑完 compare 后逐条断言（A1–A16），全过退出码 0

# ── live 线（非验收前提；需 .env，真实模型，约 12–15 次调用） ──
npm run demo           # Claude 四能力最小实操，每步断言式输出，末尾「N 断言 + 1 总体判定」
```

确定性：`npm run compare` 两次运行输出**逐字节一致**（mock 是请求内容的纯函数，
零时间/零随机；会话/中断 UUID 一律不打进输出）。验收时直接 diff 两次运行即可。

## 白板任务（三家一字不改）

同一个提示词（`src/sdks/task.ts:19`）压出三家框架差异：

| 步 | 动作 | 期望 | 压出的框架差异 |
|---|---|---|---|
| ① read | 读 `docs/research-notes.md` 的标题 | 自动放行，执行 | 工具声明方式（内置市场 vs 函数工具） |
| ② gate | 删除 `/tmp/fw-demo-trash` | **权限策略拒绝**，删除未生效 | 权限门位置（预执行回调 vs 函数内策略） |
| ③ approve | 发布 `out/whiteboard-note.md` | **人工审批** → 批准后恢复并跑完 | 中断/恢复形态（进程内回调 vs RunState vs checkpointer interrupt） |

mock 模型按「已回填几条 tool 结果」决定下一步（0→read，1→gate，2→approve，≥3→固定收尾
`FINAL_TEXT`，`src/mock-model.ts:119`）——与 SDK 无关，所以三家拿到的是同一脚本。

## 本地 mock（`src/mock-model.ts`）

- 一个 HTTP server（默认端口 `8791`，`src/mock-model.ts:24`）**双格式**：
  Anthropic `/v1/messages`（`src/mock-model.ts:302`）+ OpenAI `/v1/chat/completions`（`src/mock-model.ts:308`），
  JSON/SSE 都支持（Claude CLI 用 SSE，OpenAI SDK 用 JSON，LangGraph 走 `@langchain/openai` 的 chat/completions）。
- **纯函数**：响应只依赖请求体（工具结果计数 + 工具名列表），零时间戳零随机 → 输出可 diff。
- 工具名自适应：mock 看请求里**有哪些工具**（`read_doc`/`publish_note` 精确匹配，否则退化到
  `Read`/`Bash`），所以同一 mock 同时喂得饱「声明函数工具的两家」和「用内置工具的 Claude」。
- 踩坑：响应 id 必须是请求的**纯函数且逐请求唯一**（`anthropicResponseId`/`openaiResponseId`）——
  LangGraph 的 `addMessages` 按 message id 合并，id 恒定会让第二轮起状态塌缩成 1 条。

## 对照结果速览（`npm run compare` 输出）

五维对照表（结论 + file:line + 官方文档 URL，可被引用）在 **`docs/sdk-comparison.md`**。
各维度一句话结论：

| 维度 | Claude Agent SDK | OpenAI Agents SDK | LangGraph |
|---|---|---|---|
| loop 归属 | SDK 内置（CLI 子进程自带 loop，调用方消费流） | SDK 内置（`run()` 独立函数跑完整 loop） | 图引擎（StateGraph 节点/边/条件路由=loop） |
| 工具与 schema | 不声明函数工具：内置市场（Read/Bash）+ 过滤 | `tool({ parameters: zod, strict: true })`，schema 编译进请求 | `tool({ schema: zod })` + `bindTools()`，schema 编译进请求 |
| 权限与 HITL | `canUseTool` 进程内预执行门（gate 在此 deny）；审批=回调内等待，无框架挂起 | 无预执行门（策略在 execute 内）；`needsApproval=true` 真挂起 | 无预执行门（策略在工具内）；`interrupt()` 真挂起 |
| 状态与中断恢复 | 会话 JSONL 落盘；`resume: session_id` 重建续跑 | RunState 内存态（可 toJSON）；approve → `run(agent, state)` | MemorySaver checkpointer 按 thread 存全量；`Command({ resume })` |
| 可观测钩子 | `for await (const m of query(...))` SDKMessage 流 | `agent.on('agent_tool_start'/'agent_tool_end'/'agent_end')` | `graph.streamEvents(v2)`（on_chat_model_* / on_tool_* / on_chain_*） |

同任务不变量（`npm run compare:assert` 逐条断言，退出码可信）：
三家工具调用各 **3 次**（read/gate/approve 各 1）、模型调用各 **4 次**、gate 均被拒绝且删除未生效、
approve 均「批准→执行→生效」、最终输出与 mock 固定 `FINAL_TEXT` 一字不差、三家 baseUrl 全在 `127.0.0.1`。

## U-24 口径修正（断言数）

- **现行口径：10 断言 + 1 总体判定。** `src/capabilities.ts` 里 `ok()` 调用共 10 处
  （`src/capabilities.ts:13,14,37,38,62,63,64,73,75,76`），demo 末尾那一行总结是「1 个总体判定」，
  不是第 11 个断言。
- demo 输出的断言总数由 `ok()` **实际计数**（`src/lib.ts:74` `assertionTotal()`），不在任何地方硬编码——
  以后增删断言，输出自动跟着变（`src/demo.ts` 末尾两行）。
- 旧版把「10 个 ok 调用 + 1 行判定」混成 11 的口径已废弃，本目录内不再出现。
- `npm run compare:assert` 的 A15 静态断言这条口径：`ok()` 计数=10 且 README 含「10 断言 + 1 总体判定」
  且全目录无旧混口径字样。

## 确定性说明（为什么可以 diff 两次运行）

- mock 纯函数（上文）；三家适配器不引入时间/随机进输出。
- 会话 id / checkpoint id / interrupt id 等 UUID **一律不打进 stdout**（只用于内部续跑）；
  Claude 侧的会话恢复用「same_session=true/false」布尔表达，不打印 UUID。
- 三家**串行**执行（`src/compare-run.ts`）：OpenAI 与 LangGraph 共用 OpenAI 格式端点，
  并行会互相污染按「每 SDK 请求切片」计数的 mock 日志，故固定 claude→openai→langgraph 顺序。
- 端口固定 `8791`；被占用时友好退出（exit 2），不重试换端口（换端口会改变输出里的 endpoint 行）。
- 唯一跨进程延迟是 Claude 会话 JSONL 的异步刷盘（0–180s+，时机不可控，且 **node 父进程存活期间会被持续推迟**——见踩坑④）：
  `compare` 输出不依赖它（进程内状态如实标注）；`compare:assert` 由 **bash 编排**（`scripts/compare-assert.sh`）：
  compare 退出后由 bash 按本轮 session_id 有界等待该文件（≤240s），再跑跨进程 resume 探针与断言引擎。
  等待时长不影响 `npm run compare` 的 stdout，两次运行的 diff 不受影响。

## 文件

| 文件 | 内容 |
|---|---|
| `src/mock-model.ts` | 本地双格式确定性 mock（端口 8791）+ 请求日志 |
| `src/sdks/task.ts` | 三家共用白板任务契约 + 归一化轨迹类型（`UnifiedTrace`/`summarize`） |
| `src/sdks/claude.ts` | Claude 适配器（canUseTool 权限门 + 会话 resume 探针 + JSONL 取证） |
| `src/sdks/openai.ts` | OpenAI 适配器（函数工具 + needsApproval 两段 run） |
| `src/sdks/langgraph.ts` | LangGraph 适配器（StateGraph + interrupt + MemorySaver + streamEvents） |
| `src/compare-run.ts` | 串行跑三家（起/停 mock） |
| `src/compare.ts` | 结构化对照打印（`npm run compare`），另写 `.compare-trace.json`（gitignore） |
| `scripts/compare-assert.sh` | `npm run compare:assert` 编排器（bash）：跑 compare → 有界等待会话 JSONL → 跨进程 resume 探针 → 断言引擎。等待必须在 bash：node 父进程存活会推迟刷盘（踩坑④） |
| `src/sdks/resume-probe.ts` | 跨进程 resume 探针（独立 node 进程 + 自带 mock）：resume 同一 session_id 验证磁盘持久化 |
| `src/compare-assert.ts` | 断言引擎 A1–A16（`npm run compare:assert` 的阶段2c，纯读文件断言，不 spawn/等待） |
| `src/lib.ts` / `src/capabilities.ts` / `src/demo.ts` / `src/env.ts` / `src/smoke.ts` | live 四能力线（原内容；`lib.ts` 新增 `assertionTotal()` 计数） |
| `docs/sdk-comparison.md` | 五维对照表（file:line + 官方文档 URL）——**引用对照结论以它为准** |
| `docs/research-notes.md` | 白板任务语料（被读的文档） |

## 与 harness-demo 对照（同一问题：SDK 替你做了什么/藏了什么）

| 层 | harness-demo（从零写 harness） | framework-demo（SDK） | 给 / 藏 |
|---|---|---|---|
| 控制 loop | 自己写 while+轮次计数 | `query()` 一个 AsyncGenerator / `run()` 一个函数 / 图引擎 | **给**：loop 形态免费。**藏**：轮次语义、停止边界（`maxTurns` 实测过坑） |
| 工具协议 | 自己定义 schema+dispatch | 内置市场过滤 / 函数工具 zod schema | **给**：schema 编译进请求。**藏**：内置工具的实现与副作用面 |
| 权限门 | 规则表+审批回调自拦 | `canUseTool`/`needsApproval`/`interrupt` | **给**：三种不同粒度的钩子。**藏**：规则优先级（allowedTools 裸名会 shadow 回调） |
| 会话/恢复 | JSONL 手写 append/重建 | 自动 JSONL + `resume` / RunState / checkpointer | **给**：持久化+恢复默认值。**藏**：存哪、slug 规则、刷盘时机（JSONL 异步落盘，node 父进程存活期间被推迟——踩坑④） |
| 端点/鉴权 | 自己 fetch + 重试 | 设 `ANTHROPIC_BASE_URL`/`OPENAI_BASE_URL` 即可 | **给**：双格式直连。**藏**：CLI 后台请求（小快模型/自更新）要 env 逐个堵 |

**一句话结论（可背）**：三家 SDK 把「loop/工具/权限/状态/可观测」这五层各自给了不同的默认决策——
Claude 把 loop 藏进 CLI（换预执行权限门+落盘会话），OpenAI 把 loop 收进 `run()`（换 RunState 审批挂起），
LangGraph 把 loop 摊成图（换 checkpointer 全量状态）。**选框架=选一组不用重新论证的决策。**

## 踩坑记录（实测）

对照线（本目录新增）：

1. **`permissionMode` 必须显式 `"default"`**（`src/sdks/claude.ts:80`）——不设时非交互 `query()`
   走 bypass，`canUseTool` 根本不被调用（实测：工具照跑、回调零命中）。
2. **CLI 内置安全规则会绕过 `canUseTool`**：只读命令（`ls`/`cat`…）和 `Read` 在 default 模式下
   被规则自动放行、不过回调。要"逐调用过权限门"，动作必须是非只读的（本对照审批步因此用
   `touch` 建产物文件——顺带得到"批准→执行→落盘"的真实副作用证据）。
3. **`touch` 不建父目录**：`rmSync(out/)` 清场后必须 `mkdirSync(out)`，否则审批放行了但 touch ENOENT、文件没落盘（`src/sdks/claude.ts:44`）。
4. **Claude 会话 JSONL 的目录 slug 是最大暗坑（花时最多），刷盘是异步的**：
   - **slug = cwd 路径逐字符 `/`→`-`**：`/home/.../framework-demo` → `-home-...-framework-demo`
     （前导 `/` 本身就是前导 `-`，**不能再额外加 `-`**）。本实现最初写成 `-${path.replace(...)}`
     得到 `--home-...`（不存在的目录），所有「按该路径查文件」的逻辑**永远查空**，一度误判为
     「文件被 node 进程门控/不可见」。教训：排查落盘问题先 `ls .claude-home/projects/` 核对真实
     目录名，别假设路径。
   - **刷盘异步**：compare 进程退出后 JSONL 才写盘（干净环境 ~0–1s，偶有数秒延迟）；
     compare 进程内读不到本次文件是正常现象。因此断言在 compare 退出后做，用有界轮询等待。
   - `compare:assert` 的等待放在 **setsid 出的 detached watcher**（`scripts/compare-assert.sh`
     阶段2，独立会话）：按**本轮 session_id** 精确定位 `<uuid>.jsonl`，有界等待（≤240s）；
     随后在同一 detached 会话内跑**跨进程** resume 探针（`src/sdks/resume-probe.ts`，独立进程，
     自带 mock）证明磁盘持久化，再跑断言引擎。detached 是为稳健（避免与 compare 的进程生命周期
     耦合）；「同会话 node 进程会推迟刷盘」这一说法**未能在 slug 修正后稳定复现，故不作为结论**。
   - 同进程 resume 会走 SDK 的内存会话缓存（resume seed），**不能**作为落盘证据，故用跨进程探针。
5. **OpenAI SDK 必须从 `@openai/agents-core` 直 import**（`src/sdks/openai.ts:28-31`）——
   `@openai/agents` 的 index 在 import 时无条件启用 OpenAI 网络 trace exporter（离线环境打 401 日志）。
6. **agents-core 0.20 默认开 ConsoleSpanExporter**：每个 span 往 stdout 打一行
   `[Exporter] Export span...`，破坏输出确定性——`OPENAI_AGENTS_DISABLE_TRACING=1` 必须在任何 `run()` 前设（`src/sdks/openai.ts:27`）。
7. **0.20 的 `execute(input, context)` 参数顺序**：第一个参数才是工具参数；
   zod 参数必须 `strict: true`（否则直接 UserError）。
8. **LangGraph 1.4.21 没有 `Annotation.Root` 的 reducer 工厂**：状态通道用官方预置
   `MessagesAnnotation`；`interrupt()` 续跑时**节点从函数头重放**（工具必须幂等/mock 每次只发一个 tool_call 才安全）；
   `StructuredTool.invoke` 要传完整 ToolCall（name+args+id），缺 id 会被当成 args 本体对 schema
   （"received undefined → at path"）。
9. **中断点不是 `getState().__interrupt__`**：1.x 里从 `snapshot.tasks[].interrupts[].value` 读；
   interrupt 的 `id` 是随机 UUID，绝不打进输出。

live 线（原有）：

10. **`ANTHROPIC_BASE_URL` 不带 `/v1`**——SDK/CLI 自己拼路径，带上会 404。
11. **`allowedTools` 裸名 vs `canUseTool`**：裸名 auto-approve 整个工具，回调不触发
    （`CLAUDE_SDK_CAN_USE_TOOL_SHADOWED` 警告）。要"逐调用过权限"就别把该工具放进 allowedTools。
12. **子代理对话默认不出主流**：`forwardSubagentText: true` 才拿到带 `parent_tool_use_id` 的嵌套对话。
13. **`maxTurns: 1` 会直接 `error_max_turns`**——turn 计数含轮次边界，别按"1 次回答=1 turn"想。
14. **`NODE_ENV=production` 全局开着**：`npm install` 必须 `--include=dev`。

## 已知边界

- 对照线只证明**框架结构差异**（同一 mock 脚本下的行为），不评价三家真实模型下的能力/稳定性。
- 运行态产物（**均已在 `.gitignore` 排除，勿提交**）：`.claude-home/` = Claude Agent SDK（claude CLI）
  的运行时配置/会话目录（由 `CLAUDE_CONFIG_DIR` 指定，compare 每次运行重建，内含按
  `<cwd-slug>/<session-uuid>.jsonl` 命名的会话转录）；`out/` = 审批放行的产物目录；
  `.compare-trace.json` / `.assert-watcher-*` = 断言阶段的中间文件。
- Claude 侧"人工审批"是进程内回调里的等待，不是框架级挂起——这是 Claude SDK 的真实形态，
  对照表里按"无框架挂起"如实标注，不美化。
- LangGraph 用 `MemorySaver`（内存 checkpointer）演示；换 Sqlite/Saver 只改 `compile({ checkpointer })` 一行。
- live 线：真实调用 ~15 次/遍，demo 默认跑一遍即停；子代理模型继承主模型。
