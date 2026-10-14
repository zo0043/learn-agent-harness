# M3 · durable-api-obs 里程碑动手练习设计（capstone-m3-exercise）

> 主线 `my-agent` 的第四个动手点：在 M2（四通道/沙箱/MCP/评测）上**真·增建** durable execution（崩溃恢复）+ SSE 流式 + 重试分类/prompt caching + 多模型路由/成本归因 + OTel trace/span。本设计严格套用 `notes/capstone-blueprint.md`（§3 M3 行 / §4）+ `notes/capstone-style-guide.md` + M0/M1/M2 三份 exercise 的模式；不重新设计 milestone 划分（captain 已定 M3=P2 可恢复+流式路由+可观测）。
> 对应必修课 = `durable-execution`（journal 双锚点 / checkpoint 原子写 / 幂等键）+ `api-engineering`（SSE / 重试分类 / prompt caching / 路由 / 成本）+ `observability`（OTel trace/span + 成本归因）；参考答案 demo = `durable-execution-demo` / `api-demo` / `harness-demo demo:otel`。

## 1. M3 要交付什么（一句话 + 验收形态）

**学员此刻手里应有一个 `my-agent`，在 M2 沙箱/MCP/评测代理之上增建成「崩溃后可从 journal+checkpoint 安全恢复 + SSE 流式读读完不断流 + 失败分类重试 + prompt 前缀缓存 + 多模型路由降级省钱 + OTel span 树可观测」的高可靠代理。**

具体：一次任务执行把「意图 intent → 执行 exec」逐一落入 journal，每 N 步落一个带校验和的 checkpoint，副作用工具带幂等键；崩溃后重建，按「exec 在→skip / intent 在 exec 缺且只读→replay / 幂等写→replay / 非幂等→只读确认未知态」判定恢复，最终「副作用恒=1、幂等写收敛」；LLM 回复走 SSE 帧流（分帧拼 content、跨帧拼 tool_calls、缺 finish 帧记 incomplete）；网络失败按分类（4xx/refusal 不盲重试，429/5xx/timeout 指数退避+jitter）；prompt 前缀稳定 hash 命中给 0.5×；多模型按能力矩阵+降级阶梯路由（断供如实失败），成本按模型归因；全程 span 树（invoke_agent/chat/execute_tool）埋点可机器断言。全程确定性、零 key、零外网（沿用 M0–M2 红线）。

## 2. 半成品与 TODO 切分（给全 vs 挖空）

按 style-guide §2。M3 新增 7 项能力，**合并成 5 个 TODO**（每个补全=学会一个 M3 机制）；M2 已交付的四通道/沙箱/MCP/评测底座照搬 `m2/solution`（逐字节继承，见 §7）。

| 文件 | 处理 | 理由 |
|---|---|---|
| `types.ts` | 给全（M2 类型 + 新 `StepKind`/`Disposition`/`StepSpec`/`SSEFrame`/`ProviderSpec`/`FailureClass`/`RetryDecision`/`SpanNode`） | 公共类型底座 |
| `model.ts` / `tools.ts` / `loop.ts` / `session.ts` / `compress.ts` | 给全（loop 只接 M3 接线：durable 落盘 + span 埋点；判定挖在下面） | M1/M2 已建，地基不挖 |
| `policy.ts` / `sandbox.ts` / `mcp.ts` / `eval.ts` / `golden/` | 给全继承 M2 | M2 已建，不挖 |
| `durable.ts` | **半成品**（新建）：挖 `m3.1`（journal 双锚点 + checkpoint 原子写 + 幂等键 + 恢复判定） | M3 新增：durable |
| `stream.ts` | **半成品**（新建）：挖 `m3.2`（SSE 分帧/拼接/断流 incomplete） | M3 新增：SSE |
| `retry.ts` | **半成品**（新建）：挖 `m3.3`（重试分类 + prompt caching） | M3 新增：重试+cache |
| `router.ts` | **半成品**（新建）：挖 `m3.4`（多模型路由+降级 + 成本归因） | M3 新增：路由+成本 |
| `otel.ts` | **半成品**（新建）：挖 `m3.5`（span 树埋点 + 成本字段归因） | M3 新增：OTel |

**核心闭环挖在五处**（对应任务「journal/checkpoint 恢复、SSE、重试分类、多模型路由+降级、成本归因+trace 埋点」）：
- durable（journal/checkpoint/幂等/未知态确认）→ `m3.1`；
- SSE 流式读取 → `m3.2`；
- 重试分类 + prompt caching → `m3.3`；
- 多模型路由 + 成本归因 → `m3.4`；
- OTel trace/span 埋点 + 成本归因 → `m3.5`。

## 3. 每个 TODO 的补全后预期行为 + 判定方式

| 编号 | 函数（在文件） | 补全后预期行为 | 判定方式 |
|---|---|---|---|
| `m3.1` | `Store.append/readJournal/writeCheckpoint/readCheckpoint` + `recoverDecision`（`durable.ts`） | journal 双锚点（intent→exec 同步 append）；checkpoint 每 `CHECKPOINT_EVERY=2` 步写校验和、读时校验失败退回全量重放；幂等键落持久层；恢复判定 `analyze`：exec 在→skip、intent 在 exec 缺且只读→replay、幂等写→replay、非幂等→unknown→只读确认 | 断言 a1：崩溃点 B/C 恢复后 `messageDeliveries===1`（副作用恒=1）+ 幂等写收敛 + 每步 disposition 正确 |
| `m3.2` | `consumeStream`（`stream.ts`） | 消费 SSE 帧：delta 拼 content、tool_calls 按 index 分槽跨帧拼、流结束整体 `JSON.parse`（不 parse 单片段）、error 帧抛 `StreamError`、缺 finish 帧 `incomplete=true` | 断言 a2：跨帧 arguments 拼成合法 JSON；error 帧抛；缺 finish → incomplete |
| `m3.3` | `classify`/`backoffMs`/`withRetry` + `prefixKey`/`PrefixCache`（`retry.ts`） | 4xx/refusal 不盲重试；429/5xx/timeout 指数退避 + 确定性 jitter；预算耗尽如实失败；固化前缀 key（剔除易变段）命中给 0.5× | 断言 a3：`classify({status:400})='400'` 不重试、`withRetry` 5xx 重试后成功、`prefixKey` 稳定 `PrefixCache.hit`→0.5× |
| `m3.4` | `route`/`withFallback` + `stepCost`/`aggregateCosts`（`router.ts`） | 严格能力匹配里选最便宜；首选故障降级到窗口达标次选；无候选如实失败；成本 = token×单价，按模型归因 | 断言 a4：`route` 选 p-fast/p-capable 正确、`withFallback` 健康集剔除后降级、`aggregateCosts.byModel` 归因正确 |
| `m3.5` | `spanStart`/`spanEnd`/`spanTree`（`otel.ts`） | span 树 `invoke_agent → chat/execute_tool`，每 span 记 model/tokens/finish/tool/status/成本；`expected` 契约逐项断言（15 个 span 的判定由 `otel-mock-scenario.ts EXPECTED` 派生） | 断言 a5：构造已知脚本 → span 树按帧计数、根 span 名 `invoke_agent`、子 span 数=总数−1、cost 字段归因 |

**每个 TODO 补全 = 学会 M3 一个关键机制**：`m3.1`（崩溃恢复靠「双锚点 journal + 校验和 checkpoint + 幂等键 + 未知态只读确认」，副作用恒=1）、`m3.2`（流式要「分帧 + 跨帧拼 + 整体 parse + 断流打标」，绝不对单片段 parse）、`m3.3`（4xx 是契约违约不重试；退避要 jitter；缓存键稳定才命中）、`m3.4`（路由先能力后价格；断供如实失败不静默截断；成本要按模型归因）、`m3.5`（span 树是厂商中立轨迹，确定性断言可比对）。

## 4. 断言自测清单（确定性 / 可机器核对 / 可重放）

断言文件 `assert/m3.assert.ts`，跑 `exercises/m3/starter/`（红）或 `solution/`（绿）；每条断言编号 = TODO 编号，各自打印 `✅` / `❌`，末行 `✅ m3 验收通过`。

| 断言 | 已核对的预期 | 态 |
|---|---|---|
| `a1 m3.1 崩溃恢复` | 注入崩溃点 A/B/C → 恢复后 `messageDeliveries===1` + 幂等写收敛 + 每步 disposition 正确 | 确定性（逻辑步序号，非墙钟） |
| `a2 m3.2 SSE 流式` | 跨帧 tool_calls 拼成合法 JSON；error 帧抛 `StreamError`；断流 `incomplete` | 确定性（预置帧序列） |
| `a3 m3.3 重试+cache` | 4xx 不重试 / 5xx 指数退避重试 / prefix 命中 0.5× | 确定性（固定 seed jitter） |
| `a4 m3.4 路由+成本` | 能力矩阵路由 + 降级 + 成本按模型归因 | 确定性（离线路由纯函数） |
| `a5 m3.5 span 埋点` | span 树计数/父子/属性与契约一致（15 span 示例派生） | 确定性（span 记逻辑属性，无墙钟） |
| 末行 | 五断言全绿 → `✅ m3 验收通过`，exit 0 | 可机器核对 |

**三态纪律**（style-guide §3）：确定性（mock 模型/崩溃注入点/帧序列/故障信号全预置，jitter 用固定 seed mulberry32，无 `Math.random`/墙钟）；可机器核对（断言编号 + `✅`/`❌` + 末行验收行）；可重放（`npm run assert:m3` 连跑两次 `diff` 空）。

**半成品三分**：starter 中 `m3.x` 抛 `TODOError('m3.x: …')` → 断言捕获判 `❌ m3.x 未实现`（红）；学员补全 → 绿；solution 同断言 → 绿。

## 5. 参考答案组织（durable / api / otel 真实 file+function vs 主线 solution）

按 style-guide §4 分工。以下 `file+function` 已逐一 `read` 核实存在：

| M3 机制 | 切片答案（真实存在） | 主线答案 |
|---|---|---|
| durable（`m3.1`） | `durable-execution-demo/src/state.ts` `Store`（L45）/ `writeJsonAtomic`（L31，临时文件+rename）/ `canonical`（L20）/ `sha256`（L15）/ `CHECKPOINT_EVERY`（L13）；`recover.ts` `analyze`（L46，纯判定）/ `runRecovery`（L95）/ `DISPOSITION_LABEL`（L17）；`types.ts` `StepKind`（L9，readonly/idempotent/nonidempotent）/ `Disposition`（L15） | `exercises/m3/solution/durable.ts` |
| SSE（`m3.2`） | `api-demo/src/sse.ts` `consumeStream`（L17）/ `StreamError`（L11）；`api-demo/src/types.ts` `SSEFrame`（L19） | `exercises/m3/solution/stream.ts` |
| 重试+cache（`m3.3`） | `api-demo/src/retry.ts` `classify`（L19）/ `backoffMs`（L30）/ `withRetry`（L41）/ `mulberry32`（L9，固定 seed）；`caching.ts` `prefixKey`（L23）/ `naivePrefixKey`（L32）/ `PrefixCache`（L42）/ `djb2`（L8） | `exercises/m3/solution/retry.ts` |
| 路由+成本（`m3.4`） | `api-demo/src/router.ts` `route`（L19）/ `withFallback`（L30）/ `strictOk`（L10）；`cost.ts` `stepCost`（L11）/ `aggregateCosts`（L16）；`providers.ts` `PROVIDERS`（L9）/ `providerById`（L14） | `exercises/m3/solution/router.ts` |
| OTel 埋点（`m3.5`） | `harness-demo/src/otel.ts` `initOtel`（L33）/ `finishedSpans`（L59）/ `printSpanSummary`（L64）/ `GEN_AI_SYSTEM`（L21）/ `tracer`（L23）；`otel-mock-scenario.ts` `EXPECTED`（L48，`spanTotal: 15` L50，`traceCount: 1` L49）/ `shape`（L241）；`otel-assert.ts`（按名 span 计数/工具状态分布断言） | `exercises/m3/solution/otel.ts` |

> 明确红线 / 最小态标注（诚实区分「demo 生产形态」与「主线教学最小态」）：
> - **`m3.1` durable 持久介质**：`durable-execution-demo` 用真实 `.state/` + `appendFileSync`/`renameSync` 原子写（跨进程崩溃恢复的生产形态）。主线 M3 沿用 M0–M2「不碰真实 fs / 无跨目录写」红线，用**内存持久层 + 模拟崩溃重建**（`Store` 换进程对象重建、journal 数组 + checkpoint 对象 + 幂等 map），而去学**判定逻辑**（双锚点/校验和/幂等收敛/未知态只读确认）——这部分照搬 demo 语义；「真实磁盘持久化」留标注，不引入真实 fs 写入污染 `my-agent/`。
> - **`m3.2` SSE 来源**：`harness-demo/src/llm.ts` 的 `chatStream` 是真实 `fetch` + SSE wire；主线用 M2 的 mock 脚本思路（预置帧序列），`consumeStream` 的分帧/拼接/断流逻辑照搬 `api-demo` 语义。
> - **`m3.5` OTel 依赖**：`demo:otel` 用真实 `@opentelemetry/api` + `sdk-trace-base`（生产标准实现，`EXPECTED.spanTotal=15` 断言）。主线 M3 **不引入 `@opentelemetry` 依赖**（my-agent 至今仅 `tsx`+`typescript`），自建轻量 `SpanNode` 记录器（`invoke_agent/chat/execute_tool` 三级 span + `gen_ai.request.model`/`usage.tokens`/`finish`/`tool.name`/`cost` 属性），span 树语义照 `otel.ts`；demo:otel 的 15-span 契约作教学对照。

## 6. clone 判据（`cd my-agent` 验收命令与预期输出）

```bash
cd my-agent
npm run assert:m3              # 补全后：全绿 + 末行 ✅ m3 验收通过（exit 0）
npm run assert:m3 && npm run assert:m3   # 连跑两次 diff 空 = 可重放
npm run demo:m3                # 跑通「durable 恢复 → SSE 流式 → 重试/cache → 路由/成本 → span 树摘要」
```

- 断言命令 `npm run assert:m3` → 期望末行 `✅ m3 验收通过` + exit 0（不绑会漂移的日志/摘要值；`messageDeliveries===1`/幂等收敛/span 计数是唯一稳定判据）+ 零 key、零外网、无跨目录 import。

## 7. 真·增建证据（m2/solution → m3/starter 逐字节继承）

- **`m3/starter` 继承自 `m2/solution`**（上一 milestone 完成态），祖先关系写进 `m3` README 第一行。
- **逐字节一致的部分**：`types/model/tools/loop/session/compress/policy/sandbox/mcp/eval` + `golden/` 里 M2 已建段与 `exercises/m2/solution/` 同名段逐字节一致——`diff -r` 只见 M3 新增（durable/stream/retry/router/otel 五新文件 + `types.ts` 增补的 durable/sse/provider/span 类型 + loop 的 durable/span 接线）。
- **真增建验证命令**（wei 建完跑）：
  ```bash
  diff exercises/m2/solution/tools.ts exercises/m3/starter/tools.ts    # 空（多工具底座不变）
  diff exercises/m2/solution/mcp.ts exercises/m3/starter/mcp.ts        # 空（MCP 底座不变）
  diff -r exercises/m2/solution exercises/m3/starter --exclude=types.ts --exclude=loop.ts --exclude=durable.ts --exclude=stream.ts --exclude=retry.ts --exclude=router.ts --exclude=otel.ts
  # ↑ 只见 M3 新增文件与 5 处 TODO；已建段 diff 为空
  ```
  > `git tag m2`（若未打先打）→ `git tag m3` → `git diff m2 m3` 只应出现 M3 新增能力 + 类型/接线增补，M2 段无 diff（沿用 t25 纪律：my-agent/ 目前 git-untracked，真增建以文件级 diff 证据交付）。

## 8. 确定性红线与边界

- **红线**：mock 模型/崩溃注入点/SSE 帧序列/故障信号全预置；重试 jitter 用固定 seed（`mulberry32`）不用 `Math.random`；durable 用逻辑步序号不落墙钟；span 记逻辑属性 + 成本（不落墙钟）；内存持久层不碰真实 fs、SSE 无真实网络、无 `fetch`、无 `Date.now`/`Math.random`/pid。
- **M3 明确不做**（留给 M4）：长期记忆（语义/情景/episodic 三合一）、data-flywheel 反馈回路、（model-basics 的）模型选型成本曲线、framework-ecosystem 抽象、industry-2026 调研。
- **不破坏**：不改 `durable-execution-demo/src` / `api-demo/src` / `harness-demo/src` 任何源码、不改 `mvps.ts`、`course-structure.ts`、17 课正文、M0/M1/M2 已建 `exercises/m0|m1|m2` 与 `assert/m0|m1|m2.assert.ts`；只新增 M3 文件 + 顶层 scripts 增量。