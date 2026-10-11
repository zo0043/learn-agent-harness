# framework-demo · 框架实操（M 课 P2.4）

用 **Claude Agent SDK**（`@anthropic-ai/claude-agent-sdk`，Claude Code 的编程化）跑通
**subagent + 权限 + 会话**的最小实操，指向**本地双格式代理**（同一代理同时支持 OpenAI
`/v1/chat/completions` 与 Anthropic `/v1/messages`）。

目的不是"会用 SDK"，而是 M 课 S3'**框架给你什么/藏什么**的实证：
A 课 harness-demo 里从零写的每一层（loop/工具/权限/会话），在这里各被哪行 SDK 选项替代、
哪些决策被藏进了 CLI 黑盒。

## 跑法

```bash
# node v22 环境（/usr/bin/node 是 v12，禁用）
export PATH=~/.nvm/versions/node/v22.23.2/bin:$PATH
cd framework-demo

# 注意：全局 NODE_ENV=production 会让 npm 跳过 devDependencies，必须显式 --include=dev
npm install --include=dev

npm run smoke   # 冒烟：一次最简单的 query()（~1 次 LLM 调用）
npm run demo    # 四能力全跑一遍（~12-15 次 LLM 调用），每步断言式输出 ✅/❌
```

`.env` 自包含（key 值复制自 `harness-demo/.env`，同一本地代理；`.gitignore` 照旧排除，模板见 `.env.example`）。
`src/env.ts` 把 `LLM_BASE_URL` **去掉末尾 `/v1`** 映射成 `ANTHROPIC_BASE_URL`（SDK/CLI 自己拼 `/v1/messages`），
`LLM_API_KEY` → `ANTHROPIC_API_KEY`，模型 `qwen3.8-flash-next`。

## 文件

| 文件 | 内容 |
|---|---|
| `src/env.ts` | .env 加载 + ANTHROPIC_* 映射（含 `ANTHROPIC_SMALL_FAST_MODEL` 指回同一模型，防 CLI 后台任务请求本地没有的模型名） |
| `src/lib.ts` | `runQuery()`：消费 `query()` 的 `AsyncGenerator<SDKMessage>`，收集流事件/tool_use/子代理消息 + 断言打印 |
| `src/capabilities.ts` | 四个能力各一步：最小 agent / subagent / 权限 deny / session resume |
| `src/demo.ts` | 入口：串行四步，全过才退出码 0 |
| `src/smoke.ts` | 冒烟脚本 |
| `docs/research-notes.md` | 测试语料（给 agent/subagent 读的文件） |

## 四个能力 × SDK 选项对照（文档锚点）

| 能力 | SDK 选项 | 断言证据（demo 输出） |
|---|---|---|
| ① 最小 agent | `query({ prompt, options: { allowedTools: ["Read"] } })`——内置工具开箱即用，不依赖网络工具 | ✅ 流里有 Read `tool_use`；最终回答含文件标题 |
| ② subagent | `agents: { researcher: { description, prompt, tools } }` 定义子代理；主 agent `allowedTools: ["Task", "Task(researcher)"]` 只留"委派"；`forwardSubagentText: true` 把子代理对话转发进主流 | ✅ 主 agent 发出 Task `tool_use`；子代理消息带 `parent_tool_use_id`（上下文隔离的直接证据） |
| ③ 权限 | `canUseTool` 回调：`rm` 命令返回 `{ behavior: "deny", message }`，deny 消息作为 tool_result 回进上下文 | ✅ 拦截到 `rm -rf` 并 deny；agent 未崩、最终回答说明处理方式 |
| ④ session | run1 从 result 消息取 `session_id`；run2 `options: { resume: session_id }` | ✅ resume 后同一 session_id；第二次回答带出第一次记住的代号（Nebula-7） |

会话持久化发生在 `~/.claude/projects/<cwd 的 slug>/` 下的 JSONL（和 A⑥ 手写的 JSONL 同构）——
resume = 从会话文件重建历史，框架替你做了"文件定位 + 重建 + 续写"。

## 与 harness-demo 对照表（同一问题：SDK 替你做了什么/藏了什么）

| 层 | harness-demo（A 课，~600 行手写） | framework-demo（SDK） | 给 / 藏 |
|---|---|---|---|
| 控制 loop | `agent.ts` 自己写 while+轮次计数 | `query()` 一个 AsyncGenerator | **给**：loop 形态、流式事件模型全免费。**藏**：轮次如何计、何时停（`maxTurns` 边界语义实测过坑） |
| 工具协议 | `tools.ts` 自己定义 schema+dispatch | 内置 Read/Bash/Grep…，`allowedTools` 过滤 | **给**：工具市场+参数 schema。**藏**：每个内置工具的实现与副作用面（Bash 能干什么你没审过） |
| 权限门 | `policy.ts` 规则表+审批回调，自己拦截 | `canUseTool`/`allowedTools`/`disallowedTools`/permissionMode | **给**：每次调用前的回调点。**藏**：规则优先级——实测 `allowedTools` 裸名会**抢在 canUseTool 之前 auto-approve**（SDK 有警告），规则引擎本身不透明 |
| 会话/恢复 | `session.ts` JSONL 手写 append/重建 | 自动写 `~/.claude/projects/`，`resume` 一行 | **给**：持久化+恢复默认值。**藏**：存哪、怎么 slug 化 cwd、压缩/截断策略（`resumeSessionAt` 只露了一角） |
| 子代理 | （A 课没写；pi-agents-team 是进程级编排） | `agents` 选项 + Task 工具，同进程上下文隔离 | **给**：委派协议+隔离上下文。**藏**：默认**不转发**子代理对话（要 `forwardSubagentText` 才看得到），子代理预算/模型继承规则 |
| 端点/鉴权 | `llm.ts` 自己 fetch + 重试 | 设 `ANTHROPIC_BASE_URL`/`ANTHROPIC_API_KEY` 即可（CLI 子进程读 env） | **给**：Anthropic 格式直连非官方端点（本代理双格式，实测跑通）。**藏**：CLI 还会发后台请求（小快模型/自更新），得用 env 逐个堵（`ANTHROPIC_SMALL_FAST_MODEL`/`DISABLE_AUTOUPDATER`） |

**一句话结论（可背）**：SDK 把 A 课 6 个文件的"默认决策"全做了，代价是——
规则优先级、持久化位置、后台行为都藏进 CLI 黑盒；要改某个默认决策，
你要么找 env/选项撬，要么退回自写 loop。**这就是"选框架=选一组不用重新论证的决策"的活样本。**

## 踩坑记录（2026-10-11 实测）

1. **`ANTHROPIC_BASE_URL` 不带 `/v1`**——SDK/CLI 自己拼路径，带上会 404。
2. **`allowedTools` 裸名 vs `canUseTool`**：裸名 auto-approve 整个工具，回调根本不触发
   （`CLAUDE_SDK_CAN_USE_TOOL_SHADOWED` 警告）。要"逐调用过权限"就别把该工具放进 allowedTools。
3. **子代理对话默认不出主流**：只有 tool_use/tool_result 心跳；`forwardSubagentText: true` 才拿到带 `parent_tool_use_id` 的完整嵌套对话。
4. **`maxTurns: 1` 会直接 `error_max_turns`**——turn 计数包含轮次边界，别按"1 次回答=1 turn"想。
5. **`NODE_ENV=production` 全局开着**：`npm install` 会跳过 devDependencies，必须 `--include=dev`。
6. **冒烟先行**：SDK 对非官方端点兼容性=设好两个 env 变量就能跑（qwen3.8-flash-next 支持 tool calling 是关键前提）；模型名直接透传，无白名单。

## 已知边界

- 子代理模型继承主模型（`agents.*.model` 未单独指定）；`maxTurns`/预算是全局粗粒度控制。
- 权限演示只有 canUseTool 一条路；`permissionMode`/settings 规则文件的组合未展开。
- 真实调用 ~15 次/遍，demo 默认跑一遍即停（`demo.ts` 串行四步后退出）。
