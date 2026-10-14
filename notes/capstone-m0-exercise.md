# M0 · minimal-loop 里程碑动手练习设计（capstone-m0-exercise）

> 主线 `my-agent` 的第一个动手点：从零搭出「想→做→说」最小 agent loop。本设计严格套用 `notes/capstone-blueprint.md`（§3/§4）与 `notes/capstone-style-guide.md`（§1–§6）协议；不重新设计里程碑划分（captain 已定 M0=P0 最小 loop）。
> 对应课程 = P0 `harness-from-scratch`（#2）；参考答案 demo = `harness-demo/`（harness-mvp）。

## 1. M0 要交付什么（一句话 + 验收形态）

**学员此刻手里应该有一个 `my-agent`，能跑通「read prompt → call LLM → 解析 → 执行一个工具 → 结果回填 → 再想 → deliver 收口」的最小 loop。**

具体：给一句 `读 notes/hello.txt 的内容`，`my-agent` 用**确定性 mock 模型**（不联网、不调真实模型）走完「模型想 → 解析出 read_file → 执行 read_file → 结果回填 → 再想 → 输出最终回答」，全程可机器核对、可重放。这是 harness 十节的**第一块砖**——loop + 工具协议 + 结果回写，不含（留 M1+ 的）多工具 / 会话 / 压缩 / 权限门 / 沙箱。

## 2. 半成品与 TODO 切分（给全 vs 挖空）

按 style-guide §2 判据「本 milestone 新增能力 → 挖 TODO；地基/底座 → 给全」。M0 的「核心闭环」是**解析 + 执行回填 + loop 组装**，这三处挖；其余给全。

| 文件 | 处理 | 理由 |
|---|---|---|
| `types.ts`（Message / ToolCall / ToolSpec / Action） | 给全 | 跨 milestone 公共类型底座 |
| `model.ts`（确定性 mock 模型） | 给全 | 确定性底座（预置表/脚本，非本 milestone 新增业务逻辑） |
| `tools.ts`（单工具 `read_file` + 注册表 + 执行） | 给全 | 工具协议底座（M0 只一个只读工具） |
| `loop.ts` | **半成品**：循环骨架给全，挖 `m0.1` 解析 / `m0.2` 执行回填 / `m0.3` loop 组装 | 这三处 = M0 的核心闭环 |

**核心闭环挖在两处语义上**（对应任务要求「只挖『把 LLM 回复解析成 tool_call 并回填 loop』」）：
- 「把 LLM 回复解析成 tool_call」→ `m0.1`；
- 「并把结果回填 loop」→ `m0.2`（执行 + 回写）+ `m0.3`（loop 里串起来 + 终止判定）。

## 3. 每个 TODO 的补全后预期行为 + 判定方式

| 编号 | 函数（在 `loop.ts`） | 补全后预期行为 | 判定方式 |
|---|---|---|---|
| `m0.1` | `parseModelReply(raw: string): Action` | 把 mock 模型输出的 JSON 字符串解析并**判别**成 `{kind:'tool_call', name, args}` 或 `{kind:'deliver', content}`；形状不对/两种都不是 → 抛错 | 断言 a1：两个合法形状各自解析正确、判别正确 |
| `m0.2` | `executeAndBackfill(messages, tc): Promise<Message[]>` | 查注册表执行 `tc`（调用 `tools.ts` 的 `callTool`），把结果作为 `{role:'tool', tool_call_id, name, content}` 回写进 messages 并返回新 messages | 断言 a2：messages 长度 +1、末条 role==='tool' 且含 mock 文件内容 |
| `m0.3` | `runLoop(prompt, maxSteps=3): Promise<string>` | 组装 loop：`mockModel(messages)` → `parseModelReply` → tool_call 则 `executeAndBackfill` 后再想、deliver 则收口返回 content；超 maxSteps 抛错 | 断言 a3：给定 prompt 返回含文件内容的最终回答，且中途真的调了 1 次工具 |

**每个 TODO 补全 = 学会一个 loop 关键机制**：`m0.1`（模型输出要解析成「下一步动作」）、`m0.2`（tool_call 不是执行，「执行 + 结果回写」才是）、`m0.3`（终止判定 + 收口，loop 什么时候该停）。

## 4. 断言自测清单（确定性 / 可机器核对 / 可重放）

断言文件 `assert/m0.assert.ts`，跑 `exercises/m0/starter/`（红）或 `solution/`（绿）；每条断言编号 = TODO 编号，各自打印 `✅` / `❌`，末行 `✅ m0 验收通过`。

| 断言 | 已核对的预期 | 态 |
|---|---|---|
| `a1 parseModelReply 判别` | `parseModelReply('{"tool_call":{...read_file...}}')` → tool_call 形状；`parseModelReply('{"deliver":"..."}')` → deliver 形状 | 确定性（纯函数） |
| `a2 executeAndBackfill 回写` | 执行 read_file 后 messages 末条 `role==='tool'` 且 content 含固定串 `hello from my-agent` | 确定性（内置假数据） |
| `a3 runLoop 收口` | `runLoop('读 notes/hello.txt 的内容')` 返回的最终回答含 `hello from my-agent`；且 debug 计数 `toolCalls===1` | 确定性（mock 脚本固定） |
| 末行 | 三断言全绿 → `✅ m0 验收通过`，exit 0 | 可机器核对 |

**三态纪律**（style-guide §3）：
- 确定性：`model.ts` 用预置表/脚本（按 messages 里是否已有 tool 结果决定下一步），`tools.ts` 的 read_file 返回**内置固定内容**（不读真实文件系统），无 `Date.now`/`Math.random`/pid/墙钟；
- 可机器核对：断言编号 + `✅`/`❌` 打印行 + 末行验收行；
- 可重放：`npm run assert:m0` 连跑两次 `diff` 空。

**半成品三分**：starter 中 `m0.x` 抛 `TODOError('m0.x: …')` → 断言捕获判 `❌ m0.x 未实现`（红）；学员补全 → 绿；solution 跑同断言 → 绿（证断言可达）。

## 5. 参考答案组织（harness-demo 真实 file+function vs 主线 solution）

按 style-guide §4 分工：现有 demo = 切片答案，主线 solution = 增量答案。以下 `file+function` 已逐一 `read` 核实存在：

| M0 机制 | 切片答案（harness-demo，真实存在） | 主线答案 |
|---|---|---|
| loop 组装 + 收口判定（`m0.3`） | `harness-demo/src/agent.ts` 的 `runAgent`（L34；`for(step…)` 循环 + L134 `if (!r.assistant.tool_calls?.length) return` 收口 + L147 maxSteps 兜底）——**取其最小子集**：去掉 policy/session/otel/streaming 这些 M1/M3 才加的东西 | `exercises/m0/solution/loop.ts` 的 `runLoop` |
| 执行 + 结果回写（`m0.2`） | `harness-demo/src/agent.ts` 的 `guardedToolStep`（L158；L219 `callTool` 执行 + L220 `messages.push({role:"tool",…})` 回写）+ `harness-demo/src/tools.ts` 的 `callTool`（L103，查注册表 + validateArgs + execute） | `exercises/m0/solution/loop.ts` 的 `executeAndBackfill` |
| 工具协议底座（给全，非挖） | `harness-demo/src/tools.ts` 的 `buildRegistry`（L50）/ `validateArgs`（L20）+ `harness-demo/src/types.ts` 的 `ToolCall`/`ToolSpec`/`Message` | `exercises/m0/starter/tools.ts` / `types.ts`（给全） |
| **解析 → tool_call（`m0.1`）** | **harness-demo 无对应最小态**：它的 `llm.ts`（`chat`/`chatStream`/`chatAny`）是**真实 fetch**（要 `.env` 的 `LLM_BASE_URL`/`LLM_API_KEY`，解析的是 SSE wire 协议），不是「离线 mock 预测表 → tool_call」。**需主线自带 solution** | `exercises/m0/solution/loop.ts` 的 `parseModelReply` |

> 明确红线：`harness-demo/src/llm.ts` **不是** M0 的 mock 参考（它调真实模型），M0 的「确定性 mock 模型 + 解析」一律主线自带；`agent.ts`/`tools.ts`/`types.ts` 是「切出最小子集」的切片参考。

## 6. clone 判据（`cd my-agent` 验收命令与预期输出）

```bash
cd my-agent
npm run assert:m0            # 补全后：全绿 + 末行 ✅ m0 验收通过（exit 0）
npm run assert:m0 && npm run assert:m0   # 连跑两次 diff 空 = 可重放
npm run demo                 # 跑通「想→做→说」，打印最终回答（含 hello from my-agent）
```

- 断言命令 `npm run assert:m0` → 期望末行 `✅ m0 验收通过` + exit 0（不给会漂移的 hash/digest；数值只出现在「来源与锚点」）。
- `node ≥ 18`、零 key、零外网、零 `node_modules` 跨目录 import。

## 7. 确定性红线与边界

- **红线**：mock LLM（不联网、不调真实模型），无 `Date.now`/`Math.random`/pid；read_file 用内置固定内容、不读真实文件系统（文件范围/路径沙箱是 M1/M2 的机制，不提前塞进 M0）。
- **M0 明确不做**（留给后续 milestone，避免「练习炸碎 / 依赖错位」）：多工具（M1）、JSONL 会话（M1）、上下文压缩（M1）、默认 deny 权限门/四通道 policy（M1/M2）、沙箱第三通道（M2）、MCP（M2）、评测套件（M2）、durable/流式/路由/OTel（M3）、记忆/飞轮/模型成本（M4）。
- **不破坏**：不改 `harness-demo/src` 任何源码、不改 `mvps.ts`、`course-structure.ts`、17 课正文；只新增 `my-agent/` 与本设计文档。