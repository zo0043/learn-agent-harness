# M3 · durable-api-obs 代码结构清单（capstone-m3-structure，写给 wei 直接建文件）

> 按 `notes/capstone-m3-exercise.md` 落地 `my-agent/` 的 M3 增量骨架。**M3 在 M2 上真·增建**：`exercises/m3/starter` 继承 `exercises/m2/solution`（上一 milestone 完成态），本 milestone 新增能力（7 项 → 5 个 TODO）挖成 `TODOError`。命名 / 协议与 `capstone-blueprint.md` §7 + `capstone-style-guide.md` + M0/M1/M2 structure 对齐。

## 1. 目标目录结构（M3 阶段新增）

```
my-agent/
  package.json              # 新增 demo:m3 / assert:m3 / assert:m3:solution；demo 前进到 m3
  assert/
    m3.assert.ts            # 新增（m0/m1/m2.assert.ts 不动）
  exercises/
    m3/
      starter/              # = m2/solution 冻结 + M3 新增能力剪成 TODO
        types.ts            # M2 类型 + durable/sse/provider/span 类型（给全）
        model.ts            # 确定性 mock（扩展流式帧生成入口，给全）
        tools.ts            # read_file + search（照搬 m2，给全）
        loop.ts             # = m2/solution 补全版 + M3 接线（durable 双锚点 + span 埋点，给全）
        session.ts          # 照搬 m2（给全）
        compress.ts         # 照搬 m2（给全）
        policy.ts           # 四通道 policy（照搬 m2，给全）
        sandbox.ts          # 沙箱三边界（照搬 m2，给全）
        mcp.ts              # MCP rpcCall + 四层防御（照搬 m2，给全）
        eval.ts             # 评测套件（照搬 m2，给全）
        golden/golden.ts    # golden 文本锚点（照搬 m2，给全）
        durable.ts          # 挖 m3.1（journal/checkpoint/幂等/恢复判定）
        stream.ts           # 挖 m3.2（SSE 分帧/拼接/断流）
        retry.ts            # 挖 m3.3（重试分类 + prompt caching）
        router.ts           # 挖 m3.4（多模型路由+降级 + 成本归因）
        otel.ts             # 挖 m3.5（span 树埋点 + 成本归因）
      solution/             # 补全后完成态（== 主线该 milestone freeze）
        （同 starter，16 文件 + golden/，TODO 全补全）
```

- **仍不建 `my-agent/src/`**；`exercises/m0|m1|m2/`、`assert/m0|m1|m2.assert.ts` **零改动**（已过关，可复跑）。

## 2. package.json / tsconfig 增量

```jsonc
// package.json（M2 基础上新增；保留 demo:m0/demo:m1/demo:m2/assert:m0|m1|m2/…/typecheck）
"scripts": {
  "demo":       "tsx exercises/m3/starter/loop.ts",     // 主线 demo 前进到 M3 starter
  "demo:m3":    "tsx exercises/m3/starter/loop.ts",
  "assert:m3":  "tsx assert/m3.assert.ts",              // M3 半成品（补全前红）
  "assert:m3:solution": "tsx assert/m3.assert.ts solution", // M3 参考答案（绿）
  "typecheck":  "tsc --noEmit"
}
```

`tsconfig.json` 不变（`include: ["exercises", "assert"]` 已覆盖 m3）。

## 3. 每文件职责 + TODO 位置标注

### 3.1 `types.ts`（给全，M2 类型 + M3 新增类型）

M2 的 `Channel`/`Rule`/`Verdict`/`SandboxConfig`/`GoldenQ`/`GateVerdict` 等原样保留，追加：

```ts
export type StepKind = "readonly" | "idempotent" | "nonidempotent";   // 工具三分法
export type CrashPoint = "A" | "B" | "C";                              // 意图前 / 意图后执行前 / 执行后未落盘
export type Disposition = "skip" | "replay" | "unknown-confirm-exec" | "unknown-confirm-skip";
export interface StepSpec { step: number; name: string; kind: StepKind; tool: string; args: any; idemKey: string; crashTarget?: boolean; }
export type SSEFrame =
  | { type: "delta"; content?: string; tool_calls?: { index: number; id?: string; name?: string; arguments?: string }[] }
  | { type: "usage"; input: number; output: number; model: string }
  | { type: "finish"; finish_reason: "stop" | "tool_calls" }
  | { type: "error"; message: string };
export interface ProviderSpec { id: string; toolCalling: boolean; structured: boolean; windowTokens: number; price: { input: number; output: number }; }
export type FailureClass = "400" | "429" | "5xx" | "timeout" | "refusal" | "eof";
export interface RetryDecision { retried: number; ok: boolean; diagnostic: string; }
export interface SpanNode { name: string; attrs: Record<string, unknown>; children: SpanNode[]; }
```

### 3.2 `model.ts` / `tools.ts` / `loop.ts` / `session.ts` / `compress.ts`（给全，照搬 m2/solution + 接线）

- `model.ts`：M2 mock 扩一条「流式帧生成」入口（预置帧序列，供 `stream.ts` 消费；不真发流）。
- `tools.ts` / `session.ts` / `compress.ts`：照搬 m2。
- `loop.ts`：`parseModelReply`/`runLoop` 照搬 m2；`executeAndBackfill` 在 M2 四通道接线前加 durable 双锚点（执行前 `journal.append(intent)`、执行后 `append(exec)` + 每 N 步 `writeCheckpoint`）+ span 埋点（`spanStart/spanEnd`）。这条接线给全；判定挖在 `durable.ts`/`otel.ts`。

### 3.3 `policy.ts` / `sandbox.ts` / `mcp.ts` / `eval.ts` / `golden/`（给全，照搬 m2/solution）

M2 已建，不挖。

### 3.4 `durable.ts`（半成品，挖 m3.1）

给全：`CHECKPOINT_EVERY=2`、`StepSpec` 类型（types）、崩溃注入点 A/B/C 常量。

挖 `m3.1`：

```ts
export class Store {
  // TODO m3.1a：journal 双锚点 append（intent→exec 逐条同步 append）；checkpoint writeCheckpoint（sha256 校验和）+ readCheckpoint（校验失败→null 退回全量重放）；幂等键 readIdempotency/writeIdempotency
  throw new TODOError("m3.1: 实现 journal 双锚点 + checkpoint 原子写(校验和) + 幂等键持久层");
}
export function analyze(plan: StepSpec[], store: Store): Decision[] {
  // TODO m3.1b：恢复判定——exec 在→skip；intent 在 exec 缺且只读→replay；幂等写→replay(幂等键兜底)；非幂等→unknown→只读确认；无 intent→replay
  throw new TODOError("m3.1: 实现崩溃恢复判定 skip/replay/unknown-confirm");
}
```

（主线用**内存持久层**：`Store` 内 `journal: JournalEvent[]` + `checkpoint` 对象 + `idempotency: Map`；「崩溃」= 重建 `Store` 对象用原 journal/checkpoint 恢复——见 exercise §5 红线标注。）

### 3.5 `stream.ts`（半成品，挖 m3.2）

给全：`SSEFrame` 类型（types）。

挖 `m3.2`：

```ts
export class StreamError extends Error { constructor(readonly kind: "error-frame", msg: string) { super(msg); } }
export async function consumeStream(frames: Iterable<SSEFrame>): Promise<StreamResult> {
  // TODO m3.2：delta 拼 content；tool_calls 按 index 分槽跨帧拼（arguments 只拼接）；流结束整体 JSON.parse 一次；error 帧抛 StreamError；缺 finish 帧 incomplete=true
  throw new TODOError("m3.2: 实现 SSE 分帧/跨帧拼接/断流打标");
}
```

### 3.6 `retry.ts`（半成品，挖 m3.3）

给全：`mulberry32`（固定 seed 确定性 jitter）、`FailureClass` 类型。

挖 `m3.3`：

```ts
export function classify(signal: { status?: number; finish?: string; err?: string }): FailureClass {
  // TODO m3.3a：400/429/5xx/timeout/refusal/eof 分类；未知按 refusal 不盲重试
  throw new TODOError("m3.3: 实现失败分类（4xx 不盲重试）");
}
export function backoffMs(cls: FailureClass, attempt: number): number {
  // TODO m3.3a：指数退避 2^attempt × 100ms + mulberry32 jitter；429 更长
  throw new TODOError("m3.3: 实现指数退避+jitter");
}
export function prefixKey(messages: { role: string; content: string }[]): string {
  // TODO m3.3b：稳定前缀 hash——剔除易变段（时间戳/随机/id）后 djb2；命中 PrefixCache.hit→0.5×
  throw new TODOError("m3.3: 实现 prompt caching 稳定前缀 + 命中折扣");
}
```

### 3.7 `router.ts`（半成品，挖 m3.4）

给全：`ProviderSpec` 类型 + `PROVIDERS`（p-fast 便宜无工具 4096 / p-capable 贵有工具结构化 32768）。

挖 `m3.4`：

```ts
export function route(task: Task, providers: ProviderSpec[]): ProviderSpec | null {
  // TODO m3.4a：严格能力匹配（窗口+结构化+工具调用）里选最便宜；无匹配如实 null
  throw new TODOError("m3.4: 实现能力矩阵路由（先能力后价格）");
}
export function withFallback(task: Task, providers: ProviderSpec[], healthy: Set<string>): FallbackResult {
  // TODO m3.4a：首选故障→降级到窗口达标次选；一个不剩如实失败（不静默截断）
  throw new TODOError("m3.4: 实现降级阶梯（大→小，断供如实失败）");
}
export function stepCost(model: string, usage: { input: number; output: number }): number {
  // TODO m3.4b：单步成本 = input/1000×input 单价 + output/1000×output 单价
  throw new TODOError("m3.4: 实现成本计数与按模型归因（aggregateCosts）");
}
```

### 3.8 `otel.ts`（半成品，挖 m3.5）

给全：`SpanNode` 类型 + 离线契约常量（`EXPECTED_NAME` = `invoke_agent`，子 span `chat`/`execute_tool`）。

挖 `m3.5`：

```ts
export function spanStart(name: string, attrs: Record<string, unknown>): SpanNode {
  // TODO m3.5：建 span 节点并压入当前树；spanEnd 弹出；spanTree 返回 invoke_agent 根 + 子 span（chat/execute_tool）
  throw new TODOError("m3.5: 实现 span 树埋点（invoke_agent/chat/execute_tool + 成本字段归因）");
}
export function spanSummary(root: SpanNode): { total: number; byName: Record<string, number> } {
  // TODO m3.5：确定性 span 摘要——按名计数 + 属性可达，供断言；成本跨度进 attrs.cost 归因
  throw new TODOError("m3.5: 实现 span 摘要与成本归因");
}
```

（主线 M3 **不引入 @opentelemetry 依赖**，自建轻量 `SpanNode` 记录器；见 exercise §5 红线标注。）

## 4. 断言文件怎么组织（`assert/m3.assert.ts`）

照 `m0/m1/m2.assert.ts`：`process.argv[2]` 切 starter/solution（动态 `await import`），`check()` 捕获 `TODOError` 判「未实现」。

```ts
// assert/m3.assert.ts（argv[2]==='solution' 切目标；半成品红 / solution 绿）
const target = process.argv[2] === "solution" ? "solution" : "starter";
const dur = await import(`../exercises/m3/${target}/durable.ts`);
const stm = await import(`../exercises/m3/${target}/stream.ts`);
const ret = await import(`../exercises/m3/${target}/retry.ts`);
const rtr = await import(`../exercises/m3/${target}/router.ts`);
const otl = await import(`../exercises/m3/${target}/otel.ts`);

// a1 崩溃恢复：注入 A/B/C → analyze disposition 正确；恢复后 messageDeliveries===1（副作用恒=1）+ 幂等写收敛
// a2 SSE：跨帧 arguments 拼成合法 JSON；error 帧抛 StreamError；eof 断流 incomplete=true
// a3 重试+cache：classify 4xx/refusal 不重试；5xx withRetry 重试成功；prefixKey 剔除易变段→PrefixCache 命中 0.5×
// a4 路由+成本：route 选对 provider；withFallback healthy 剔除后降级；stepCost/aggregateCosts 按模型归因
// a5 span：已知脚本 → spanTree 根名 invoke_agent + 子 span 数=总数−1 + byName 计数 + cost 字段归因
// 末行：五断言全绿 → ✅ m3 验收通过，否则 ❌ m3 验收通过 + process.exitCode=1
```

- **半成品红**：`m3.x` 抛 `TODOError` → `❌ m3.x 未实现` → 末行 `❌ m3 验收通过`（exit 1）。
- **solution 绿**：`npm run assert:m3:solution` 五条 `✅` + `✅ m3 验收通过`（exit 0）。
- **可重放**：`assert:m3:solution` 连跑两次 `diff` 空。

## 5. solutions 怎么放 + git tag m3

- `exercises/m3/solution/` = 补全后（5 个 TODO 函数体不再是 `throw TODOError`），`main()` 可 `npm run demo:m3` 跑通「durable 恢复 → SSE 流式 → 重试/cache → 路由/成本 → span 摘要」。
- **逐字节继承**：`solution/{types,model,tools,loop,session,compress,policy,sandbox,mcp,eval}|golden` 的 M2 已建段 == `exercises/m2/solution/` 同名段（见 exercise §7 的 diff 命令）。
- **git tag 渐进快照**：`git tag m2`（若未打）→ `git tag m3`；`git diff m2 m3` 只应见 M3 新增（5 能力 + 类型增补 + loop 接线）。沿用 t25 纪律：`my-agent/` 若仍 git-untracked，真增建以文件级 diff 证据交付。

## 6. README 七段（M3 按 style-guide §5 模板填）

1. 定位：把 my-agent 从「四通道/沙箱/MCP/评测」长成「崩溃可恢复 + 流式路由 + 可观测」的高可靠代理。
2. 要加的能力：`m3.1` durable 恢复 / `m3.2` SSE 流式 / `m3.3` 重试+cache / `m3.4` 路由+成本 / `m3.5` span 埋点。
3. 必修课：durable-execution（双锚点/checkpoint/幂等）· api-engineering（SSE/重试/cache/路由/成本）· observability（trace/span）。
4. 练习：`npm run assert:m3`（先红）→ 补 §2 五个 TODO → `npm run assert:m3` 全绿。
5. TODO 清单：五行表（编号 / 文件 / 函数 / 要求），与 exercise §3 一致。
6. 断言命令：`npm run assert:m3` 末端 `✅ m3 验收通过`（exit 0，连跑两次 diff 空）。
7. 参考答案指针：切片答案 durable-execution-demo（state/recover）、api-demo（sse/retry/caching/router/cost/providers）、harness-demo otel（说见 exercise §5）+ 主线答案 `../solution/`。

## 7. 建骨架自检（wei 完成后跑一次）

- [ ] `npm run assert:m3`（starter）exit ≠ 0，五条 `❌ m3.x 未实现`，末行 `❌ m3 验收通过`；
- [ ] 补全 solution 后 `npm run assert:m3:solution` exit 0，五条 `✅` + 末行 `✅ m3 验收通过`；
- [ ] `npm run demo:m3`（po solution）打印 durable 恢复报告（sideEffects=1）+ span 摘要；
- [ ] 连跑两次 `assert:m3:solution` 输出 `diff` 空（可重放）；`npx tsc --noEmit`（strict）0 错；
- [ ] `diff exercises/m2/solution/tools.ts exercises/m3/starter/tools.ts` 空、`diff …/mcp.ts …/mcp.ts` 空（继承证据）；`git tag m3` + `git diff m2 m3` 只见 M3 新增；
- [ ] 无 `Date.now`/`Math.random`/`pid`/`fetch`/`@opentelemetry`（主线自建 span 记录器）/真实 fs 写入（durable 用内存持久层）；jitter 用固定 seed `mulberry32`。