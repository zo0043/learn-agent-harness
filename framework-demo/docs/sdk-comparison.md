# 三家 SDK 五维对照（同一白板任务 · 离线 mock）

> 本表是 `npm run compare` 输出的细节版：每个维度给**结论 + 代码落点（file:line）+ 官方文档 URL**。
> 代码落点均在 `framework-demo/` 内；行号已于 2026-10-13（t18 按 t9 评审 R3-2 回刷）对照当前代码逐一复核，文件再变动时以符号名为准。
> 诚实标注：模型是 `mock-whiteboard-v1`（本地 127.0.0.1:8791 端点），**非真实模型实跑**；
> 本表描述的是三家框架的**结构差异**（loop 归属/工具声明/权限钩子/状态/可观测），与模型无关。

## 任务与 mock（三家相同）

- 任务（`src/sdks/task.ts:19` `WHITEBOARD_PROMPT`）：
  ① 读 `docs/research-notes.md` 标题（自动放行）→ ② 删除 `/tmp/fw-demo-trash`（策略拒绝）→ ③ 发布 `out/whiteboard-note.md`（人工审批后恢复跑完）。
- mock（`src/mock-model.ts:292` `startMockModel`）：同一端点双格式（Anthropic `/v1/messages` `src/mock-model.ts:301` / OpenAI `/v1/chat/completions` `src/mock-model.ts:307`）；
  响应是**请求内容的纯函数**——按「已回填几条 tool 结果」决定下一步（`src/mock-model.ts:119` `stepOf`：0→read，1→gate，2→approve，≥3→`FINAL_TEXT`（`src/mock-model.ts:28`）），零时间零随机 → 两次运行逐字节一致。

## 五维对照

### 维度 1 · loop 归属（谁拥有 agent loop）

| | Claude Agent SDK | OpenAI Agents SDK | LangGraph |
|---|---|---|---|
| 结论 | **SDK 内置**：`query()` 启动 claude CLI 子进程，loop（轮次/工具回填/停止）全在 CLI 内；调用方只消费 `AsyncGenerator<SDKMessage>` | **SDK 内置**：`run(agent, input)` 一个独立函数跑完整个 loop（轮次/工具回填/停止判定） | **图引擎**：没有"SDK loop"——`StateGraph` 的节点/边/条件路由就是 loop；LLM 客户端只被按节点调用 |
| 代码落点 | `src/sdks/claude.ts:69`（`for await (const m of query({...}))`）；loop 归属语义见 `src/sdks/claude.ts:4-5` 文件头注释 | `src/sdks/openai.ts:97`（`run(agent, WHITEBOARD_PROMPT, opts)`）、`src/sdks/openai.ts:105`（续跑 `run(agent, r1.state, opts)`） | `src/sdks/langgraph.ts:108-114`（`StateGraph` + `addConditionalEdges` + `compile`）、`src/sdks/langgraph.ts:76-79`（agentNode 按节点调 LLM，`bound.invoke` :77） |
| 官方文档 | <https://code.claude.com/docs/en/agent-sdk/agent-loop> | <https://openai.github.io/openai-agents-js/guides/results/> | <https://langchain-ai.github.io/langgraphjs/concepts/low_level> |

### 维度 2 · 工具与 schema 声明

| | Claude Agent SDK | OpenAI Agents SDK | LangGraph |
|---|---|---|---|
| 结论 | **不声明函数工具**：用内置工具市场（Read/Bash…）+ `allowedTools`/`disallowedTools` 过滤（本对照未用 `allowedTools`，避免 shadow canUseTool，见 README 踩坑②） | `tool({ name, description, parameters: zod, strict: true })`；schema 由 SDK 编译进模型请求 | `tool(fn, { name, description, schema: zod })` + `model.bindTools([...])`；schema 编译进模型请求 |
| 代码落点 | `src/sdks/claude.ts:71-103`（options 只有 model/cwd/maxTurns/permissionMode/canUseTool，无工具声明）；resume 探针的 `disallowedTools` 在 `src/sdks/claude.ts:144` | `src/sdks/openai.ts:51`（read_doc）、`:62`（delete_temp）、`:73-76`（publish_note，`strict: true`） | `src/sdks/langgraph.ts:43-72`（三个 `tool(...)`：readDoc :43-52 / deleteTemp :53-62 / publishNote :63-72，zod `z.object({ path: z.string() })`）、`bindTools` 见 `src/sdks/langgraph.ts:74` |
| 官方文档 | <https://code.claude.com/docs/en/agent-sdk/permissions>（工具过滤） | <https://openai.github.io/openai-agents-js/guides/tools/> | <https://langchain-ai.github.io/langgraphjs/concepts/low_level>（tools/bindTools） |

### 维度 3 · 权限与 human-in-the-loop 钩子

| | Claude Agent SDK | OpenAI Agents SDK | LangGraph |
|---|---|---|---|
| 结论 | **进程内预执行门**：`canUseTool` 回调在工具执行前逐调用拦截（本对照 gate 步在此被 deny，`rm` 未执行）；人工审批=同一回调里"等待人"，**无框架级挂起**（进程活着，决定权未交还） | **无预执行权限门**（策略只能写在 `execute` 内或 guardrail；本对照 gate 步=函数执行后返回拒绝文本）；人工审批是一等原语 `needsApproval: true` → `run` 在审批点**真停下**，决定权交还调用方 | 同 OpenAI：**无预执行权限门**（策略写在工具实现内）；人工审批用 `interrupt()` 在节点内**真挂起**，`Command({ resume })` 由调用方放行 |
| 代码落点 | `src/sdks/claude.ts:81`（`canUseTool`：`rm` → `{ behavior: "deny", message: DENY_MESSAGE }`）、`src/sdks/claude.ts:80`（`permissionMode: "default"` 必须显式，否则 bypass 且回调不触发） | `src/sdks/openai.ts:62-71`（delete_temp 的 execute 返回拒绝文本）、`src/sdks/openai.ts:76`（`needsApproval: true`）、`src/sdks/openai.ts:98-105`（取 `tool_approval_item` → `r1.state.approve(item)` → 续跑） | `src/sdks/langgraph.ts:88`（`interrupt({ tool: "publish_note", ... })`）、`src/sdks/langgraph.ts:137`（`streamEvents(new Command({ resume: { approved: true } }), ...)`） |
| 官方文档 | <https://code.claude.com/docs/en/agent-sdk/permissions>（canUseTool）、<https://code.claude.com/docs/en/agent-sdk/user-input> | <https://openai.github.io/openai-agents-js/guides/human-in-the-loop/> | <https://langchain-ai.github.io/langgraphjs/concepts/human_in_the_loop> |

**三家 gate 步的可比不变量**（`compare:assert` A5 断言）：`denied=true && actionPerformed=false`——机制不同（预执行拦截 vs 函数内策略），删除动作都没发生（`src/sdks/task.ts:105` `gateActionBlocked`）。

### 维度 4 · 状态与中断恢复

| | Claude Agent SDK | OpenAI Agents SDK | LangGraph |
|---|---|---|---|
| 结论 | 状态=**落盘 JSONL 会话转录**（`$CLAUDE_CONFIG_DIR/projects/<cwd-slug>/`，异步刷盘，时机 0–180s+ 不可控，见 README 踩坑④）；中断恢复=`resume: session_id` 重建历史续跑（本对照：进程内探针验证 same_session=会话机制；`compare:assert` A11 再补**跨进程** resume 证明磁盘持久化） | 状态=**RunState 内存态**（两段 `run` 之间靠它续命，`toJSON()` 可序列化跨进程）；审批点 `run` 返回 → `state.approve(item)` → `run(agent, state)` | 状态=**checkpointer 全量快照**（`MemorySaver` 按 `thread_id` 存）；`interrupt()` 挂起 → 同 thread `Command({ resume })` 续跑（节点从函数头重放，`interrupt()` 直接返回 resume 值） |
| 代码落点 | `src/sdks/claude.ts:144`（`resume: sessionId` 探针）、`src/sdks/claude.ts:155-171`（JSONL 取证：含 tool_use / rm -rf / tool_result 计数）、`src/sdks/claude.ts:132-133`（审批产物文件存在性） | `src/sdks/openai.ts:97-106`（r1 停下 → approve → r2 续跑，state 全程内存）、最终请求 8 messages 见 `src/sdks/openai.ts` extra 字段（`finalRequestMsgs`） | `src/sdks/langgraph.ts:114`（`compile({ checkpointer: new MemorySaver() })`）、`src/sdks/langgraph.ts:125-131`（`getState` 读 `tasks[].interrupts`）、`src/sdks/langgraph.ts:139-146`（续跑后读最终 state，8 条 messages） |
| 官方文档 | <https://code.claude.com/docs/en/agent-sdk/sessions> | <https://openai.github.io/openai-agents-js/guides/results/>（RunState/序列化） | <https://langchain-ai.github.io/langgraphjs/concepts/persistence>（checkpointer）、<https://langchain-ai.github.io/langgraphjs/concepts/human_in_the_loop>（interrupt/resume） |

### 维度 5 · 可观测钩子

| | Claude Agent SDK | OpenAI Agents SDK | LangGraph |
|---|---|---|---|
| 结论 | `for await (const m of query(...))` 的 **SDKMessage 流**（system/assistant/result；本对照 9 条：init + tool_use×3 + user×3 + text + result） | Agent 实例即 EventEmitter：`agent.on('agent_tool_start' \| 'agent_tool_end' \| 'agent_end')`（本对照 7 条：start×3 / end×3 / end×1） | `graph.streamEvents(input, { version: "v2" })` 事件流（`on_chat_model_*` / `on_tool_*` / `on_chain_*`；本对照 on_chat_model_end×4 + on_tool_end×3，事件总数含 chain/stream 共 69） |
| 代码落点 | `src/sdks/claude.ts:69`（消费流）、`src/sdks/claude.ts:192-196`（observability：events :194 / samples :195 汇总进 trace） | `src/sdks/openai.ts:88-94`（`agent.on(...)` 三钩子收集） | `src/sdks/langgraph.ts:123` 与 `:137`（两段 `streamEvents` 收集）、`src/sdks/langgraph.ts:180-186`（events 汇总） |
| 官方文档 | <https://code.claude.com/docs/en/agent-sdk/observability> | <https://openai.github.io/openai-agents-js/>（guides：events/tracing） | <https://langchain-ai.github.io/langgraphjs/concepts/low_level>（streamEvents） |

## 模型调用数（同一任务同一 mock 脚本）

三家都是 **4 次**模型调用：read / gate / approve 三步 + 收尾（`compare:assert` A16）。
Claude 侧 4 次全部是流式 `/v1/messages`（`src/sdks/claude.ts` 主循环 3 次 + resume 探针 1 次为另计的会话级恢复验证）——
注意：`extra.modelCalls` 对 Claude 统计的是**主 run** 的请求数（mock 请求日志按主 run 前后差值计，`src/sdks/claude.ts:131`），resume 探针是主 run 结束后独立发起的第 5 次请求，用于会话恢复断言（A10）。
