# my-agent — M0 · minimal-loop

> 本 starter 是主线 `my-agent` 的起点（无上一 milestone）。把 `my-agent` 从「无」长成一个**单工具最小 loop（想→做→说）**：给一句 `读 notes/hello.txt 的内容`，用确定性 mock 模型（不联网、不调真实模型）走完「模型想 → 解析出 read_file → 执行 read_file → 结果回填 → 再想 → 输出最终回答」。

## 1. 定位

M0 = harness 十节的**第一块砖**：loop + 工具协议 + 结果回写。对应课程 P0 `harness-from-scratch`（#2）。**M0 明确不做**（留给后续 milestone）：多工具 / JSONL 会话 / 上下文压缩（M1）、权限门 / 沙箱 / MCP / 评测（M1–M2）、durable / 流式 / 路由 / OTel（M3）、记忆 / 飞轮 / 成本（M4）。

## 2. 要加的能力（TODO 清单）

`loop.ts` 里挖了三处 TODO，补全每一处 = 学会一个 loop 关键机制：

| 编号 | 文件 | 函数 | 补全要求 |
|---|---|---|---|
| `m0.1` | `exercises/m0/starter/loop.ts` | `parseModelReply(raw)` | 把 mock 模型输出的 JSON 解析并**判别**成 `{kind:'tool_call',name,args}` 或 `{kind:'deliver',content}`；形状不对/两种都不是 → 抛错 |
| `m0.2` | `exercises/m0/starter/loop.ts` | `executeAndBackfill(messages,tc)` | 调 `tools.ts` 的 `callTool` 执行工具，把结果作为 `{role:'tool',tool_call_id,name,content}` 回写进 messages **副本**并返回 |
| `m0.3` | `exercises/m0/starter/loop.ts` | `runLoop(prompt,maxSteps=3)` | 组装 loop：`mockModel→parseModelReply` → tool_call 则 `executeAndBackfill` 后**再想**、deliver 则收口返回 content；超 `maxSteps` 抛错 |

> `types.ts` / `model.ts` / `tools.ts` 已给全（公共类型底座 + 确定性 mock 模型 + 单工具协议），不用改。

## 3. 必修课

`harness-from-scratch`（P0 #2）——loop / 工具协议（前段）。

## 4. 怎么动手

```bash
npm install                    # tsx + typescript + @types/node（零外部依赖、零 key）
npm run assert:m0              # 先跑：应看到 3 条 ❌ m0.x 未实现，末行 ❌ m0 验收通过（exit 1）
# …按 §2 补全 loop.ts 的三个函数（删掉对应 throw new TODOError(...)）…
npm run assert:m0              # 再跑：3 条 ✅ + 末行 ✅ m0 验收通过（exit 0）
npm run demo                   # 跑通「想→做→说」，打印最终回答（含 hello from my-agent）
```

## 5. 断言命令（clone 判据）

| 命令 | 目标 | 未补 TODO | 补全后 |
|---|---|---|---|
| `npm run assert:m0` | `starter/` | 3 条 `❌ m0.x 未实现` + 末行 `❌ m0 验收通过`，exit 1 | 3 条 `✅` + 末行 `✅ m0 验收通过`，exit 0 |
| `npm run assert:m0:solution` | `solution/`（参考答案） | —（始终绿，证断言可达） | 3 条 `✅` + 末行 `✅ m0 验收通过`，exit 0 |
| `npm run demo` | `starter/loop.ts` | 打印 `❌ 仍有 TODO 未完成：m0.3…`，exit 1（非静默崩） | 打印最终回答 + `✅ m0 demo 通过`，exit 0 |

- 可重放：`npm run assert:m0:solution` 连跑两次输出 `diff` 空（确定性）。
- 末行验收 + exit code 即判据，不给会漂移的 hash/digest。

## 6. 确定性红线

mock LLM 不联网、不调真实模型；`read_file` 返回**内置固定内容**（不读真实文件系统）；全程无 `Date.now` / `Math.random` / `pid` / `fetch`。参数校验与路径范围控制是 M1/M2 的机制，M0 不提前塞入。

## 7. 参考答案指针

| M0 机制 | 切片答案（真实存在，请先 `read` 再对照） | 主线答案 |
|---|---|---|
| loop 组装 + 收口判定（`m0.3`） | `harness-demo/src/agent.ts` 的 `runAgent`（取其最小子集：for 循环 + `!tool_calls?.length` 收口 + maxSteps 兜底；去掉 policy/session/otel/streaming） | `exercises/m0/solution/loop.ts` 的 `runLoop` |
| 执行 + 结果回写（`m0.2`） | `harness-demo/src/agent.ts` 的 `guardedToolStep`（callTool 执行 + `messages.push({role:"tool",…})` 回写）+ `harness-demo/src/tools.ts` 的 `callTool` | `exercises/m0/solution/loop.ts` 的 `executeAndBackfill` |
| 工具协议底座（给全） | `harness-demo/src/tools.ts` 的 `buildRegistry` / `validateArgs` + `harness-demo/src/types.ts` 的 `ToolCall`/`ToolSpec`/`Message` | `exercises/m0/starter/{tools,types}.ts` |
| **解析 → tool_call（`m0.1`）** | **harness-demo 无对应最小态**（其 `llm.ts` 是真实 fetch + SSE wire 协议，非离线 mock）——需主线自带 | `exercises/m0/solution/loop.ts` 的 `parseModelReply` |

> 红线：`harness-demo/src/llm.ts` **不是** M0 的 mock 参考（它调真实模型）；`agent.ts`/`tools.ts`/`types.ts` 才是「切出最小子集」的切片参考。本目录 `exercises/m0/solution/` 是完整参考答案，可直接对照。

---

# my-agent — M1 · multi-tool-session

> 本 starter 继承自 `exercises/m0/solution`（上一 milestone 完成态）。在 M0 单工具 loop 之上真·增建成「多工具（read_file + 检索=打分排序）+ JSONL 会话可恢复 + 超长上下文自动压缩 + 白名单外工具默认拒」的多轮 agent。

## 1. 定位

M1 = 把 `my-agent` 从「单工具 loop」长成「多工具多轮 agent」。对应必修课 P0 `harness-from-scratch`（后段：恢复 / 压缩 / 多工具）+ `agent-harness`（分层）+ `rag`（检索=打分排序）+ `system-design`（收口）。**M1 明确不做**（留给后续 milestone）：沙箱第三通道 / 四通道 policy deny>approve>sandbox>allow（M2）、MCP（M2）、评测套件（M2）、durable / SSE / 路由 / OTel（M3）、记忆 / 飞轮 / 成本（M4）。

## 2. 要加的能力（TODO 清单）

`exercises/m1/starter/` 里挖了四处 TODO，补全每一处 = 学会 M1 一个关键机制：

| 编号 | 文件 | 函数 | 补全要求 |
|---|---|---|---|
| `m1.1` | `tools.ts` | `search.execute` | query 分词 → 对预置 `CORPUS` 每篇按词面命中打分 → `sort` 降序 → `slice` topK → `JSON.stringify` 命中摘要；`buildRegistry()` 登记 read_file + search（多工具分发：registry.get(name)） |
| `m1.2` | `compress.ts` | `compress(messages,threshold,keepTail)` | 估算 token 超阈值：`head=[system,首 user]` + 中间段确定性摘要（每条 truncate 一行，不调真实模型）+ `tail` 原样；未超返回 `{summarized:0}` |
| `m1.3` | `session.ts` | `Session.append/loadAll/exists/start/rebuild` | 每次 `intent→exec` 写一行 JSONL；重启 `loadAll` 读日志 `rebuild` 出 messages；intent 已记而 exec 缺失 → 标「未知状态」不丢 |
| `m1.4` | `policy.ts` | `decide(tool)` | 白名单 `[read_file, search]` → `allow`；白名单外（含未知工具）→ `deny`（默认 deny） |

> `types.ts`（+`TrajectoryEvent`）/ `model.ts`（mock 脚本换成 search）/ `loop.ts`（继承 M0 + 执行前接权限门）已给全，不用改。`read_file`、`callTool` 的 `registry.get(name)` 分发是 M0 已交付底座，逐字节继承。

## 3. 必修课

`harness-from-scratch`（后段：恢复 / 压缩 / 多工具）+ `agent-harness`（分层：权限门·恢复·压缩落位）+ `rag`（检索=打分排序）+ `system-design`（把搭的 agent 讲成系统设计）。

## 4. 怎么动手

```bash
npm run assert:m1              # 先跑：应看到 4 条 ❌ m1.x 未实现，末行 ❌ m1 验收通过（exit 1）
# …按 §2 补全四个函数（删掉对应 throw new TODOError(...)）…
npm run assert:m1              # 再跑：4 条 ✅ + 末行 ✅ m1 验收通过（exit 0）
npm run demo:m1                # 跑通「想(search) → 检索打分 → 说」，打印最终回答（含 BM25 命中内容）
```

## 5. 断言命令（clone 判据）

| 命令 | 目标 | 未补 TODO | 补全后 |
|---|---|---|---|
| `npm run assert:m1` | `starter/` | 4 条 `❌ m1.x 未实现` + 末行 `❌ m1 验收通过`，exit 1 | 4 条 `✅` + 末行 `✅ m1 验收通过`，exit 0 |
| `npm run assert:m1:solution` | `solution/`（参考答案） | —（始终绿，证断言可达） | 4 条 `✅` + 末行 `✅ m1 验收通过`，exit 0 |
| `npm run demo:m1` | `starter/loop.ts` | 打印 `❌ 仍有 TODO 未完成：m1.x…`，exit 1（非静默崩） | 打印最终回答 + `✅ m1 demo 通过`，exit 0 |

- 可重放：`npm run assert:m1:solution` 连跑两次输出 `diff` 空（确定性）。
- 真·增建证据：`diff exercises/m0/solution/types.ts exercises/m1/solution/types.ts` 只见 M1 新增的 JSONL 事件段；`diff exercises/m0/solution/model.ts exercises/m1/solution/model.ts` 只见 mock 脚本从 read_file 换成 search。

## 6. 确定性红线

mock 模型不联网不调真实模型；检索语料预置固定；压缩摘要确定性（truncate 一行，不调 LLM）；JSONL 事件用逻辑结构（无时间戳/墙钟）；全程无 `Date.now` / `Math.random` / `pid` / `fetch`。会话用临时 JSONL（工作目录 `.tmp-` 前缀，不依赖真实时钟）。

## 7. 参考答案指针

| M1 机制 | 切片答案（真实存在，请先 `read` 再对照） | 主线答案 |
|---|---|---|
| 多工具注册 / 命名分发（底） | `harness-demo/src/tools.ts` 的 `buildRegistry` / `callTool`（`registry.get(name)` 分发）/ `toolSchemas` / `validateArgs` | `exercises/m1/solution/tools.ts`（2 工具） |
| 检索=打分排序（`m1.1`） | `rag-demo/src/bm25.ts` 的 `BM25` / `score` / `topK`（打分排序最小子集，不做 IDF/长度归一全套） | `exercises/m1/solution/tools.ts` 的 `search` |
| token 压缩（`m1.2`） | `harness-demo/src/context.ts` 的 `estimateTokens` / `compactIfNeeded`（但 L40 调 `chat()` 真实 LLM 摘要——M1 摘要为主线自带确定性 solution） | `exercises/m1/solution/compress.ts` 的 `compress` |
| JSONL 会话 / 恢复（`m1.3`） | `harness-demo/src/session.ts` 的 `Session` / `rebuild` + `types.ts` `TrajectoryEvent` | `exercises/m1/solution/session.ts` |
| 默认 deny 权限门（`m1.4`） | `harness-demo/src/policy.ts` 的 `Policy` / `decide` / `DEMO_POLICY`（approve 通道是 M2 四通道，M1 不取） | `exercises/m1/solution/policy.ts` 的 `decide` |

> 红线：`harness-demo/src/context.ts` 的 `chat()` 摘要、`policy.ts` 的 approve 通道**不是** M1 的最小态（前者要真实模型、后者是 M2 四通道），M1 一律主线自带确定性 solution。本目录 `exercises/m1/solution/` 是完整参考答案，可直接对照。
---

# my-agent — M2 · sandbox-mcp-eval

> 本 starter 继承自 `exercises/m1/solution`（上一 milestone 完成态）。在 M1 多工具 + 会话 + 压缩 + 默认 deny 之上真·增建成「四通道权限门（deny>approve>sandbox>allow）+ 沙箱三边界 + MCP 远程工具四层防御 + golden set 评测门禁」的 agent。

## 1. 定位

M2 = 把 `my-agent` 从「本地只读工具」长成「能安全调用远程工具 + 有评测兜底」的 agent。对应必修课 P1 `sandbox` + `mcp` + `evaluation` + `multi-agent`。**M2 明确不做**（留给后续 milestone）：durable journal/checkpoint / SSE / 重试 / 路由 / 缓存 / 成本归因 / OTel（M3）、记忆 / 飞轮 / 成本优化（M4）。

## 2. 要加的能力（TODO 清单）

`exercises/m2/starter/` 里挖了四处 TODO，补全每一处 = 学会 M2 一个关键机制：

| 编号 | 文件 | 函数 | 补全要求 |
|---|---|---|---|
| `m2.1` | `policy.ts` | `decide(tool,args)` | 按 `CHANNEL_PRIORITY=['deny','approve','sandbox','allow']` 匹配 `RULE_TABLE`（read_file/search=allow、write_file=sandbox、run_shell/send_email=approve）；支持可选 `when(args)` 参数级匹配器；无匹配 fallback=deny |
| `m2.2` | `sandbox.ts` | `assertInWorkspace` / `Sandbox.path·env·openNetwork` | 路径边界（规范化相对路径，拒绝对路径/`..` 越根）；env 白名单（白名单外 `undefined`）；网络边界（egress 默认禁用，调用抛 `BoundaryViolation`） |
| `m2.3` | `mcp.ts` | `callMCP` / `sanitizeToolOutput` | `rpcCall` 形状（`{method,params}` → 离线 mock 响应表，含投毒行）；L1 消毒（命中注入模式的行包 untrusted 围栏）+ L2 `classifyTool`/`consultApproval` + L3 `EgressGate.check` + L4 `AuditLog` 按 defense-in-depth 接线 |
| `m2.4` | `eval.ts` | `resolveAnchors` / `runEval` / `judgeCalibrate` | golden 文本锚点→chunk id（子串匹配）；任一锚点未命中 → 打印 ❌ 返回 1（响亮失败）；每题 `recall@10 = 1` 判 PASS；确定性 mock judge 一致性校 |

> `types.ts`（+`Channel`/`CHANNEL_PRIORITY`/`Rule`/`Verdict`/`SandboxConfig`/`BoundaryViolation`/`GoldenQ`/`AuditEvent`/`GateVerdict`/`DefenseConfig`）/ `model.ts`（mock 脚本换成 `web_search`，sawTool 判定字节一致）/ `loop.ts`（继承 M1 + 远程工具走 MCP+消毒、本地工具走四通道 `decide`）/ `tools.ts`·`session.ts`·`compress.ts`（逐字节继承 M1）/ `golden/golden.ts`（语料+golden set）已给全，不用改。

## 3. 必修课

`sandbox`（隔离三边界：路径/env/网络）+ `mcp`（远程工具协议 + 供应链投毒四层防御）+ `evaluation`（golden set · 文本锚点 · recall@k · judge 校准 · CI 门禁）+ `multi-agent`。

## 4. 怎么动手

```bash
npm run assert:m2              # 先跑：应看到 4 条 ❌ m2.x 未实现，末行 ❌ m2 验收通过（exit 1）
# …按 §2 补全四个文件（删掉对应 throw new TODOError(...)）…
npm run assert:m2              # 再跑：4 条 ✅ + 末行 ✅ m2 验收通过（exit 0）
npm run demo:m2                # 跑通「web_search 拉远程 → L1 消毒投毒 → deliver 收口 → 评测 PASS → 审计摘要」
```

## 5. 断言命令（clone 判据）

| 命令 | 目标 | 未补 TODO | 补全后 |
|---|---|---|---|
| `npm run assert:m2` | `starter/` | 4 条 `❌ m2.x 未实现` + 末行 `❌ m2 验收通过`，exit 1 | 4 条 `✅` + 末行 `✅ m2 验收通过`，exit 0 |
| `npm run assert:m2:solution` | `solution/`（参考答案） | —（始终绿，证断言可达） | 4 条 `✅` + 末行 `✅ m2 验收通过`，exit 0 |
| `npm run demo:m2` | `starter/loop.ts` | 打印 `❌ 仍有 TODO 未完成：m2.x…`，exit 1（非静默崩） | 打印最终回答 + `Q1..Q3 PASS` + `审计摘要：fnv1a:…` + `✅ m2 demo 通过`，exit 0 |

- 可重放：`npm run assert:m2:solution` 连跑两次输出 `diff` 空（确定性）。
- 真·增建证据：`diff exercises/m1/solution/{tools,session,compress}.ts exercises/m2/starter/{tools,session,compress}.ts` 逐字节**空**；`diff` 只见 `types.ts` M2 类型段、`model.ts` mock 脚本换成 `web_search`、`loop.ts` executeAndBackfill 四通道接线。

## 6. 确定性红线

全程不联网、不调真实模型：MCP 远程工具用**离线 mock 响应表**（不真发 RPC）；沙箱 `World` 是内存 `Map`（不碰真实 FS/container）；评测语料/golden/审批/投毒 payload 全部预置固定；审计摘要用 FNV-1a（无时间戳，可重放比对）；全程无 `Date.now` / `Math.random` / `pid` / `fetch`。

## 7. 参考答案指针

| M2 机制 | 切片答案（真实存在，请先 `read` 再对照） | 主线答案 |
|---|---|---|
| 四通道判定（`m2.1`） | `sandbox-demo/src/policy.ts` 的 `Policy.decide`（L15）/ `CHANNEL_PRIORITY` / `Rule` / `Verdict` | `exercises/m2/solution/policy.ts` 的 `decide` |
| 沙箱三边界（`m2.2`） | `sandbox-demo/src/sandbox.ts` 的 `assertInWorkspace`（L61）/ `makeWorld`（L25）/ `Sandbox`（L78） | `exercises/m2/solution/sandbox.ts` |
| MCP 四层防御（`m2.3`） | `mcp-demo/src/defense.ts` 的 `sanitizeToolOutput`（L28）/ `classifyTool`（L47）/ `consultApproval`（L60）/ `EgressGate`（L67）/ `AuditLog` FNV-1a digest（L96）+ `mcp-demo/src/server.ts` 的 `POISON_LINE`/`ATTACKER`/`buildTools` | `exercises/m2/solution/mcp.ts` |
| 评测门禁（`m2.4`） | `rag-demo/src/evaluate.ts` 的 `GoldenQ`/`GOLDEN`/文本锚点解析/`recall@k`/锚点失效 `exit(1)` | `exercises/m2/solution/eval.ts` + `golden/golden.ts` |

> 红线：M2 的沙箱 `assertInWorkspace` 语义为「workspace 是相对根、raw 是相对路径」（`assertInWorkspace('work','a/b')` 通过、`'../x'` 越根必抛），与 `sandbox-demo`（raw 需自带 `work/` 前缀）不同——以本目录 `exercises/m2/solution/` 为准。四层防御原语（`classifyTool`/`consultApproval`/`EgressGate`/`AuditLog`）与 `INJECTION_PATTERNS`/`POISON_LINE` 给全，`callMCP`/`sanitizeToolOutput` 才是 `m2.3` 的挖点。

---

# my-agent — M3 · durable-api-obs

> 本 starter 继承自 `exercises/m2/solution`（上一 milestone 完成态）。在 M2 四通道/沙箱/MCP/评测之上真·增建成「崩溃可恢复 + SSE 流式 + 重试分类/prompt caching + 多模型路由/成本归因 + span 可观测」的高可靠代理。

## 1. 定位

M3 = 把 `my-agent` 从「可安全调用远程工具 + 有评测兜底」长成「崩溃后可从 journal+checkpoint 恢复 + SSE 流式不断流 + 失败分类重试 + 前缀缓存省钱 + 多模型路由降级 + span 树可观测」。对应必修课 P2 `durable-execution` + `api-engineering` + `observability`。**M3 明确不做**（留给 M4）：长期记忆（语义/情景/episodic）、评测飞轮反馈回路、模型选型成本曲线、framework-ecosystem 抽象、industry-2026 调研。

## 2. 要加的能力（TODO 清单）

`exercises/m3/starter/` 里挖了五处 TODO，补全每一处 = 学会 M3 一个关键机制：

| 编号 | 文件 | 函数 | 补全要求 |
|---|---|---|---|
| `m3.1` | `durable.ts` | `Store.append` 等 + `analyze`/`recover` | journal 双锚点（intent→exec 同步 append）+ checkpoint 每 2 步 sha256 校验和（毒快照退回全量重放）+ 幂等键；恢复判定 exec 在→skip / 只读缺 exec→replay / 幂等写→replay / 非幂等→只读确认；副作用恒=1 |
| `m3.2` | `stream.ts` | `consumeStream` | delta 拼 content；tool_calls 按 index 分槽跨帧拼 arguments；流结束整体 `JSON.parse`（绝不对单片段 parse）；error 帧抛 `StreamError`；缺 finish 帧 `incomplete=true` |
| `m3.3` | `retry.ts` | `classify`/`backoffMs`/`prefixKey` | 4xx/refusal 不盲重试；429/5xx/timeout 指数退避 + 固定 seed jitter；稳定前缀 key（剔除时间戳/随机/id）命中 `PrefixCache.hit`→0.5× |
| `m3.4` | `router.ts` | `route`/`withFallback`/`stepCost`/`aggregateCosts` | 严格能力匹配（窗口+结构化+工具调用）里选最便宜；首选故障降级到窗口达标次选、断供如实失败；成本=token×单价，按模型归因 |
| `m3.5` | `otel.ts` | `spanStart`/`spanEnd`/`spanSummary` | span 树 `invoke_agent → chat/execute_tool`；每 span 记 model/tokens/finish/tool/status/cost 属性；确定性摘要按名计数 |

> `types.ts`（+`StepKind`/`Disposition`/`StepSpec`/`SSEFrame`/`ProviderSpec`/`FailureClass`/`RetryDecision`/`SpanNode` 等）/ `model.ts`（+`mockSSEFrames` 预置帧序列）/ `loop.ts`（继承 M2 + durable 双锚点 + span 接线）已给全；`tools/session/compress/policy/sandbox/mcp/eval` + `golden/` 逐字节继承 M2 不挖。

## 3. 必修课

`durable-execution`（journal 双锚点 / checkpoint 原子写 / 幂等键）+ `api-engineering`（SSE / 重试分类 / prompt caching / 路由 / 成本）+ `observability`（OTel trace/span + 成本归因）。

## 4. 怎么动手

```bash
npm run assert:m3              # 先跑：应看到 5 条 ❌ m3.x 未实现，末行 ❌ m3 验收通过（exit 1）
# …按 §2 补全五个文件（删掉对应 throw new TODOError(...)）…
npm run assert:m3              # 再跑：5 条 ✅ + 末行 ✅ m3 验收通过（exit 0）
npm run demo:m3                # 跑通「durable 恢复 → SSE 流式 → 重试/cache → 路由/成本 → span 摘要」
```

## 5. 断言命令（clone 判据）

| 命令 | 目标 | 未补 TODO | 补全后 |
|---|---|---|---|
| `npm run assert:m3` | `starter/` | 5 条 `❌ m3.x 未实现` + 末行 `❌ m3 验收通过`，exit 1 | 5 条 `✅` + 末行 `✅ m3 验收通过`，exit 0 |
| `npm run assert:m3:solution` | `solution/`（参考答案） | —（始终绿，证断言可达） | 5 条 `✅` + 末行 `✅ m3 验收通过`，exit 0 |
| `npm run demo:m3` | `starter/loop.ts` | 打印 `❌ 仍有 TODO 未完成：m3.x…`，exit 1（非静默崩） | 打印 durable 恢复报告 + span 摘要 + `✅ m3 demo 通过`，exit 0 |

- 可重放：`npm run assert:m3:solution` 连跑两次输出 `diff` 空（确定性）。
- 真·增建证据：`diff exercises/m2/solution/{tools,mcp}.ts exercises/m3/starter/{tools,mcp}.ts` 逐字节**空**；`diff` 只见 `types.ts` M3 类型段、`model.ts` +`mockSSEFrames`、`loop.ts` durable/span 接线 + 5 个 M3 新文件。

## 6. 确定性红线

全离线零 key：SSE 用预置帧序列（无真实 fetch/网络）；durable 用内存持久层 + 同层重建模拟崩溃（不碰真实 fs、逻辑步序号不落墙钟）；重试 jitter 用固定 seed `mulberry32`（不用 `Math.random`）；路由/成本是纯函数；span 记逻辑属性（不落墙钟）；主线自建轻量 `SpanNode` 记录器（**不引 `@opentelemetry`**）。全程无 `Date.now` / `Math.random` / `pid` / `fetch`。

## 7. 参考答案指针

| M3 机制 | 切片答案（真实存在，请先 `read` 再对照） | 主线答案 |
|---|---|---|
| durable（`m3.1`） | `durable-execution-demo/src/state.ts` `Store`/`sha256`/`canonical`/`writeJsonAtomic`/`CHECKPOINT_EVERY` + `recover.ts` `analyze`/`runRecovery`/`DISPOSITION_LABEL` + `types.ts` `StepKind`/`Disposition` | `exercises/m3/solution/durable.ts`（内存持久层，判定逻辑照搬 demo） |
| SSE（`m3.2`） | `api-demo/src/sse.ts` `consumeStream`/`StreamError` + `types.ts` `SSEFrame` | `exercises/m3/solution/stream.ts` |
| 重试+cache（`m3.3`） | `api-demo/src/retry.ts` `classify`/`backoffMs`/`withRetry`/`mulberry32` + `caching.ts` `prefixKey`/`PrefixCache`/`djb2` | `exercises/m3/solution/retry.ts` |
| 路由+成本（`m3.4`） | `api-demo/src/router.ts` `route`/`withFallback`/`strictOk` + `cost.ts` `stepCost`/`aggregateCosts` + `providers.ts` `PROVIDERS`/`providerById` | `exercises/m3/solution/router.ts` |
| OTel 埋点（`m3.5`） | `harness-demo/src/otel.ts` span 树语义 + `otel-mock-scenario.ts` `EXPECTED`（15 span 契约）+ `shape` | `exercises/m3/solution/otel.ts`（自建轻量 SpanNode） |

> 红线 / 最小态标注：`m3.1` demo 用真实 `.state/` + `renameSync` 原子写（生产形态），主线 M3 沿用「不碰真实 fs」红线改用内存持久层 + 同层重建，而去学判定逻辑；`m3.2` SSE 来源 demo 是真实 `fetch`，主线用预置帧序列；`m3.5` demo 用真实 `@opentelemetry`（15 span），主线自建轻量 `SpanNode`（零依赖），span 树语义照 demo。

---

# my-agent — M4 · memory-flywheel-model（主线收口站）

> 本 starter 继承自 `exercises/m3/solution`。在 M3 可恢复/流式路由/可观测之上真·增建成「有记忆 + 评测飞轮 + 模型意识 + 框架认知」的完整工具。**M4 是主线最后一个动手点**：补完 `assert:m4:solution` 后，`m0..m4` 五档齐，主线毕业。

## 1. 定位

M4 = 把 `my-agent` 从「可恢复 + 流式路由 + 可观测」补成 blueprint §3 M4 行收口形态：**多工具 / 多轮 / 带权限沙箱 / 可观测 / 可评测 / 可恢复 / 有记忆**。对应必修课 `long-term-memory`（四类记忆+四道投毒防线）+ `data-flywheel`（label 两轮降噪+门禁）+ `model-basics`（KV cache/成本）+ `framework-ecosystem`（封装边界）+ `industry-2026`（横向收口素材）。**M4 明确不做**：真实多进程记忆库 / 真实红队 / 真实 SDK 实跑（退化为离线对照）。

## 2. 要加的能力（TODO 清单）

| 编号 | 文件 | 函数 | 补全要求 |
|---|---|---|---|
| `m4.1` | `memory.ts` | `write` / `recall` / `forget` | 写：低信任不覆盖高信任（trustGate）+ 注入扫描（injectionScan）+ 高危独立审批（highRiskApproval）+ 审计留痕（auditTrail）+ 冲突消解；读：scope 过滤 + 时效窗口 + 信任闸 + 置信门；忘：墓碑 + 沿血缘传播 |
| `m4.2` | `flywheel.ts` | `round` / `gate` / `curate` | 降噪强制「除 prompt_version 外逐字段全同」（只动一个变量）；门禁 f1 不降 && precision 显著升→propose 否则 reject（无 apply 态）；去污染去重 |
| `m4.3` | `costwalk.ts` | `kvBytesPerToken` / `withCacheDiscount` / `shouldScaleUp` | KV=2×layers×kv_heads×head_dim×bytes；缓存折扣只打 prefill 命中段；KV+成本+微调成本联合走查给数值判断 |
| `m4.4` | `framework.ts` | `compareTable` / `allowedToolsRaceCheck` | 五维「我搭的 vs 框架给的」；allowedTools 裸名 auto-approve 抢跑 → 不把危险工具放 allowedTools 让它落 canUseTool 逐调用拦截 |

> `types.ts`（+MemoryItem/TrustLevel/MemoryStore/Direction/LedgerRow/GateDecision/ScaleDecision 等）/ `model.ts`（+记忆候选预置）/ `loop.ts`（继承 M3 + M4 演示接线）已给全；`tools/session/compress/policy/sandbox/mcp/eval/golden/durable/stream/retry/router/otel` 逐字节继承 M3 不挖。

## 3. 必修课

`long-term-memory`（四类记忆+四道投毒防线）· `data-flywheel`（label 两轮降噪+门禁）· `model-basics`（KV cache/成本走查）· `framework-ecosystem`（封装边界）+ `industry-2026`（横向收口素材）。

## 4. 怎么动手

```bash
npm run assert:m4              # 先跑：4 条 ❌ m4.x 未实现，末行 ❌ m4 验收通过（exit 1）
# …按 §2 补全四个文件（删掉对应 throw new TODOError(...)）…
npm run assert:m4              # 再跑：4 条 ✅ + 末行 ✅ m4 验收通过（exit 0）
npm run demo:m4                # 全链：M2 loop+评测 → M3 恢复/SSE/重试/路由/span → M4 记忆/飞轮/成本/框架
```

## 5. 断言命令（clone 判据）

| 命令 | 目标 | 未补 TODO | 补全后 |
|---|---|---|---|
| `npm run assert:m4` | `starter/` | 4 条 `❌ m4.x 未实现` + `❌ m4 验收通过`，exit 1 | 4 条 `✅` + `✅ m4 验收通过`，exit 0 |
| `npm run assert:m4:solution` | `solution/`（参考答案） | —（始终绿） | 4 条 `✅` + `✅ m4 验收通过`，exit 0 |
| `npm run demo:m4` | `starter/loop.ts` | 列 `❌ 仍有 TODO 未完成：m4.1`，exit 1 | 打印记忆/飞轮/成本/框架四段演示 + `✅ m4 demo 通过`，exit 0 |

- 可重放：`assert:m4:solution` 连跑两次 `diff` 空。
- 真·增建证据：`diff exercises/m3/solution/{tools,mcp,durable,...}.ts exercises/m4/starter/...ts` 逐字节空（16 文件中 14 个）；只见 `types.ts` M4 类型段 + `loop.ts` M4 演示接线 + 4 个 M4 新文件。

## 6. 确定性红线

记忆用内存持久层 + `FIXED_NOW` 逻辑时钟（不碰真实 fs/墙钟）；飞轮用合成脱敏样本 + 确定性 labeler（无真实数据/LLM）；模型意识纯计算走查；框架对照纯静态（不引真实 SDK）。四道投毒防线可开关消融（关掉→对应探针失败）。全程无 `Date.now` / `Math.random` / `pid` / `fetch` / 真实 SDK import。

## 7. 参考答案指针

| M4 机制 | 切片答案（请先 `read` 再对照） | 主线答案 |
|---|---|---|
| 记忆+防线（`m4.1`） | `memory-redteam/src/memory.mjs` `createStore`/`write`/`recall`/`forget`/`DEFENSE_KEYS`/`TRUST`/`FIXED_NOW` + `redteam.mjs` `PROBES` | `exercises/m4/solution/memory.ts`（四道防线最小态） |
| 飞轮（`m4.2`） | `flywheel-demo/src/label.ts` `predictLabel`/`round`/`relabel` + `gate.ts` `gate`/`NOISE` + `curate.ts` `curate` | `exercises/m4/solution/flywheel.ts` |
| 模型意识（`m4.3`） | `model-basics-demo/src/kv.ts` `kvBytesPerToken`/`kvTotalBytes` + `cost.ts` `stepCost`/`withCacheDiscount` | `exercises/m4/solution/costwalk.ts`（+`shouldScaleUp` 联合走查） |
| 框架对照（`m4.4`） | `framework-demo/src/compare.ts` `DIMENSIONS` + `capabilities.ts` `step3_permissions`（canUseTool deny） | `exercises/m4/solution/framework.ts` |

> 红线 / 最小态标注：`m4.1` demo 有完整红队 16 探针 + `embed`/BM25 混合检索（生产形态），主线取写读遗忘 + 四道防线判定最小态（词法匹配检索）；`m4.3` demo 给 KV/成本纯函数（无联合走查），`shouldScaleUp` 联合走查是主线自带；`m4.4` demo 真实跑三家 SDK + mock 端点，主线离线条目对照 + `canUseTool` 逻辑函数（不引真实 SDK）。

---

# my-agent · 主线毕业自述（终审收口锚）

M4 完成后，`my-agent` 完整形态用五句话自述（对应 `learn` 页 capstone hero 卡）：

1. **多工具**：一个 loop 里 `read_file` + `search`（检索=打分排序）+ 一个走 RPC 形状的远程 MCP 工具，按名字分发。
2. **多轮**：JSONL 会话可恢复（重建 + 未知态标注）+ 超长上下文自动压缩 + SSE 流式。
3. **带权限沙箱**：四通道 policy（deny>approve>sandbox>allow）+ 沙箱三边界（路径/env/egress）+ 供应链四层防御（L1 消毒/L2 policy/L3 egress 断言/L4 审计）。
4. **可观测 / 可评测 / 可恢复**：span 树埋点 + golden set 召回门禁（锚点失效响亮失败）+ durable journal/checkpoint 崩溃恢复（副作用恒=1）。
5. **有记忆 + 模型意识 + 框架认知**：四类记忆（写读遗忘 + 四道投毒防线）+ 评测飞轮（label 降噪 + 门禁止步提案）+ KV/成本走查（该不该上更大模型/微调）+ 五维框架对照（「我搭的 vs 框架给的」）。

**主线毕业验收（终审用）**：`cd my-agent` 依次 `assert:m0..m4:solution` 五档全绿 + `npm run demo`（主线 demo 前进到 M4）+ `git tag m0..m4` 五档齐 + `git diff m0 m4` 只见逐 milestone 真增建（M1 多工具会话压缩、M2 沙箱 MCP 评测、M3 恢复流式路由可观测、M4 记忆飞轮模型意识框架收口）。
