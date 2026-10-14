# api-mvp 设计规格（api-engineering 课独占 MVP）

> 写给下一任务的实现者（wei）：照这份规格从零建 `api-demo/`，做到「可 clone、可运行、全离线零 key、确定性、断言自测」，不需要再找本课内容架构师确认设计取舍。
> 状态：本文件是**设计规格**，不是实现；`api-demo/` 目录目前不存在。
> 关联：course-structure.ts `api-engineering.mvpSlug = 'api-mvp'`（sprint 1 标 planned）；教学正文见 `notes/api-engineering.md`。

## 0. 目标（一句话）

api-mvp = 「模型调用层」的最小可运行闭环：**六个模块各一个可证伪的断言**，`npm run demo` 全绿 = 证明调用层不是「调个 API」，而是有**失败分类、预算、降级、归因**的可靠性系统。

## 1. 复用关系与边界（§4.1 已定）

- **复用（照搬接口语义，不跨目录 import）**：`harness-demo/` 的
  - `src/llm.ts` `chatStream`：SSE 三件事——`\n\n` 分帧、content 拼接、tool_calls 按 index 分槽 + 流结束整体 `JSON.parse`、usage/model 帧在 `continue` 前抓取；
  - `src/context.ts`：`estimateTokens`（字符数/3.5）、`compactIfNeeded`（head+note+tail 压缩）；
  - `src/tools.ts`：`validateArgs`（schema 校验最后一道）；
  - `src/agent.ts:159-160`：`const name = tc.name.trim()`（防御性解析）。
- **边界**：各 demo 目录独立可 clone（sandbox-demo / mcp-demo / durable-execution-demo 都不 import harness-demo），所以 api-demo 是**独立目录**，上面四个语义「照搬 + 注释标明出处」，不 `import` harness-demo 的 .ts。api-demo 是唯一一个**新增**「流中 error 帧 / 断流标 incomplete / 双定时器 / 取消传播」这些 harness-demo 未实现分支的 demo。

## 2. 功能范围

### In scope（六模块最小可运行子集，每个对应一个断言）

1. **SSE 流式读取**：mock provider 产 SSE 帧序列 → 分帧 / content 拼接 / tool_calls 按 index 拼接整体 parse；**新增**流中 `error` 帧分支 + 断流（无结束帧）标 `incomplete`。
2. **结构化输出**：一个 JSON schema（工具参数）做约束校验 + `validateArgs` 语义校验，演示「schema 合法 ≠ 语义正确」。
3. **prompt caching**：请求前缀 hash + 命中计数 + 折扣（命中输入 ×0.5），打点打印命中（验证「前缀稳定性」）。
4. **重试分类**：`4xx`（契约违约）不重试、`5xx`/超时（指数退避+jitter）重试、`429` 退避+jitter；带重试预算。
5. **多模型路由**：≥2 个 mock provider + 能力矩阵（tool_calling / 结构化 / 窗口）按能力路由 + 降级阶梯。
6. **成本计数**：usage token × 单价表 → 每步成本 + 按模型归因 + 总成本断言。

### NonGoals（明确不做，别做）

- **不做**真实 provider 网络调用 / 真实 API key / OAuth / TLS。
- **不做**真实多 provider 网关（litellm 全套、上游负载均衡、请求改写重放）。
- **不做**真实 HTTP 服务器 / 真实 SSE transport——用**内存事件流**模拟帧序列即可。
- **不做**真实 KV cache 对接——只做「前缀 hash + 命中计数」的 mock。
- **不做**真实结构化输出采样（约束解码）——schema 校验是**事后断言**，不是生成期约束。
- **不做**生产级鉴权 / 多租户 / 审计落库。

## 3. 目录与文件结构

```
api-demo/
  package.json          # scripts: demo (tsx src/demo.ts), typecheck (tsc --noEmit)；dependencies: tsx + typescript（同 mcp-demo，放 dependencies 防 NODE_ENV=production 跳过）
  README.md             # clone 判据 + 跑法（`cd api-demo && npm i && npm run demo`）
  src/
    types.ts            # ProviderSpec/能力矩阵/CostReport/RetryDecision/SSE 帧类型
    providers.ts        # ≥2 个 mock provider + SSE 帧生成器（可注入状态码/超时/跨帧 tool_calls/error 帧/断流）
    sse.ts              # chatStream：分帧 / content 拼接 / tool_calls index 分槽整体 parse / incomplete 落标 / usage 回填
    schema.ts           # schema 约束校验 + validateArgs 语义校验
    caching.ts          # 前缀 hash + 命中计数 + 折扣 + 打点
    retry.ts            # 失败分类 + 指数退避 jitter（确定性伪随机）+ 重试预算 + 4xx 不重试
    router.ts           # 能力矩阵 + 路由 + 降级阶梯（大→小→缓存→规则→如实失败）
    cost.ts             # token × 单价 → 每步成本 + 按模型归因
    demo.ts             # 入口：串六模块跑一遍「事故场景」，末尾打印验收汇总
    assert.ts           # 断言式自测：六模块各一条可证伪用例 + 判定
```

（src 目标规模 ~400 行，参照 durable-execution-demo 的「逻辑时钟 + 断言」风格。）

## 4. 入口命令与 clone 判据

```bash
cd api-demo
npm i                 # NODE_ENV=production 时改用 NODE_ENV=development npm install（tsx 放 dependencies）
npm run demo          # 六模块断言 + 事故场景走查 + 末尾汇总
npm run typecheck
```

- **判定「clone 能跑」**：`npm run demo` 末尾打印 `✅ api 验收通过：六模块断言全绿`；任一断言失败打印 `❌` 并以退出码 1 终止（可进 CI）。
- **全离线零 key**：不 import 任何需要联网的 SDK；mock provider 用内存数据 + 逻辑时钟。
- **确定性**：不用 `Date.now()` 做判定源、不用 `Math.random()`（jitter 用固定 seed 的确定性伪随机如 `mulberry32/LCG`）；跑 N 次逐字节一致。

## 5. 各模块规格（接口级，给 wei 直接实现）

### 5.1 `providers.ts` —— 两个 mock provider + SSE 帧生成器

```ts
export interface ProviderSpec {
  id: string;                       // "p-fast" | "p-capable" | ...
  toolCalling: boolean;
  structured: boolean;
  windowTokens: number;
  price: { input: number; output: number }; // 每 1k token 单价（教学用）
  faults?: { kind: "400" | "500" | "timeout" | "error-frame" | "eof"; when: "first-call" } | null; // 可注入故障
}
export type SSEFrame =
  | { type: "delta"; content?: string; tool_calls?: { index: number; id?: string; name?: string; arguments?: string }[] }
  | { type: "usage"; input: number; output: number; model: string }
  | { type: "finish"; finish_reason: "stop" | "tool_calls" }
  | { type: "error"; message: string };
```

- 提供至少 2 个 provider：`p-fast`（便宜、无 tool_calling、短窗）、`p-capable`（贵、有 tool_calling、结构化）；每个 provider 提供 `emit(turns)` 生成**预置**帧序列（含一次「跨帧 tool_calls 拼接」用例）。
- `faults` 让 demo 能注入「400 route 错」「500 服务错」「timeout」「流中 error 帧」「中途 EOF」五种故障，供 retry/路由/sse 模块的断言触发。

### 5.2 `sse.ts` —— `chatStream`

```ts
export async function consumeStream(frames: AsyncIterable<SSEFrame>): Promise<{
  content: string; toolCalls: { id: string; name: string; arguments: Record<string, unknown> }[];
  usage: { input: number; output: number; model: string } | null;
  incomplete: boolean;   // 断流（无 finish 帧）→ true
}>;
```

- 照搬 harness-demo `llm.ts` 三件事 + 新增两个分支：收到 `error` 帧 → 抛分类错误（带 `kind:"error-frame"`）；流结束无 `finish` 帧 → `incomplete:true`（不产出 assistant 消息）。
- **断言 sse-A**：跨帧 tool_calls（首帧 id+name、次帧 arguments 片段）→ 整体 parse 出 1 个完整 `arguments` 对象。
- **断言 sse-B**：帧序列缺 `finish` → `incomplete === true`。

### 5.3 `schema.ts` —— 结构化输出两道门

```ts
export function validateSchema(schema: Record<string, unknown>, value: unknown): string[]; // 形状错误列表
export function validateSemantic(tool: string, args: Record<string, unknown>): string[];   // 语义错误（validateArgs 教学版）
```

- **断言 schema-A**：`{ city:"北京" }` → 两道门都过；**schema-B**：`{ city:123 }` → schema 违约（类型错，报错）；**schema-C**：`{ city:"北惊" }` → schema 过（字符串合法）但 `validateSemantic` 判「拼写/枚举外」非法。**这三条正好演示「schema 合法 ≠ 语义正确」**。

### 5.4 `caching.ts` —— 前缀缓存

```ts
export function prefixKey(messages: { role: string; content: string }[]): string; // 稳定段 hash（日期/随机段不参与）
export class PrefixCache { hit(prefix: string): { hit: boolean; inputPriceX: number }; } // 命中 → 0.5×
```

- **断言 cache-A**：同前缀连发 2 次 → 第 2 次 `hit:true`、输入成本 0.5×、命中计数=1；**cache-B**：前缀插一行 `now()` 动态值 → 命中=0（演示「动态值毁前缀」）。

### 5.5 `retry.ts` —— 失败分类 + 重试

```ts
export type FailureClass = "429" | "5xx" | "timeout" | "400" | "refusal" | "eof";
export function classify(signal: { status?: number; finish?: string; err?: string }): FailureClass;
export async function withRetry(fn: () => Promise<unknown>, budget: number): Promise<RetryDecision>;
// 指数退避 + jitter（确定性伪随机）；budget 耗尽 → 降级/放弃；
// classify()==="400" → 直接 return { retried:0, diagnostic }，不调用 fn 重试
```

- **断言 retry-A**：注入 400 → `retried === 0`（4xx 不重试）；**retry-B**：注入 500 → 指数退避重试后成功、`retried ≥ 1`；**retry-C**：预算 1、连续 500 → 预算耗尽返回「放弃 + 原因」。

### 5.6 `router.ts` —— 能力路由 + 降级

```ts
export function route(task: { needsToolCalling: boolean }, providers: ProviderSpec[]): ProviderSpec;
export function withFallback(task: Task, providers: ProviderSpec[]): { provider: ProviderSpec; fell: boolean };
```

- **断言 router-A**：任务要 tool_calling → 路由到 `p-capable`（`p-fast` 能力矩阵无 tool_calling，被跳）；**router-B**：`p-capable` 注入故障 → `withFallback` 降级到次选并 `fell:true`；**router-C**：全失败 → 返回「如实失败」报告（不是静默截断）。

### 5.7 `cost.ts` —— 成本计数

```ts
export function stepCost(model: string, usage: { input: number; output: number }): number;
export function aggregateCosts(steps: { model: string; cost: number }[]): { total: number; byModel: Record<string, number> };
```

- **断言 cost-A**：给定 token×单价表 → 总成本 = 期望值；`byModel` 两行（两个模型各自成本），证明「归因到模型」。

## 6. 断言式自测清单（验收矩阵 = demo.ts 的职责）

demo.ts 按序跑下面 10 条，每条 `✅/❌`，全绿才打印汇总：

| # | 模块 | 断言 | 期望 |
|---|---|---|---|
| 1 | sse | 跨帧 tool_calls 拼接后整体 parse | 1 个完整 arguments 对象 |
| 2 | sse | 断流无 finish 帧 | incomplete=true |
| 3 | schema | 类型错 | schema 违约 |
| 4 | schema | `city:"北惊"` | schema 过 / 语义 reject（演示两层） |
| 5 | caching | 同前缀 2 次 | 命中 1 次 + 输入 0.5× |
| 6 | caching | 前缀插动态值 | 命中 0 |
| 7 | retry | 400 | retried=0 不重试 |
| 8 | retry | 500 + 预算 | 退避重试后成功 |
| 9 | router | 能力矩阵缺 tool_calling | 路由到支持的 p-capable |
| 10 | cost | token×单价 | 总成本=期望、byModel 两行 |

最后跑一段「**事故场景走查**」（复用 notes/api-engineering.md S7 的素材）：`p-capable` 注入 `400 route 错` → classify 判 400 → 不重试 → `router.withFallback` 降级 → cost 归因到两个模型。打印一段可读时间线（逻辑步号，不用墙钟）。

## 7. 确定性纪律（参照 durable-execution-demo）

- 逻辑时钟 = 步序号；jitter 用确定性伪随机（固定 seed）；不把 pid/`Date.now()`/`Math.random()` 放进任何断言输出。
- `demo` 跑 N 次输出逐字节一致；交换退避/命中/归因的**期望值用常量写死在断言里**，不给「会漂移的 hash」。

## 8. 给 wei 的关键提示与风险

1. **独立目录、不 import harness-demo**：照搬 `chatStream`/`compactIfNeeded`/`validateArgs`/`tc.name.trim()` 的语义并注释出处；唯一「新增」是 S1 喂给的四个生产分支（error 帧 / incomplete / 双定时器 / 取消传播）里的**前两个**（双定时器/取消传播若超最小闭环可只打桩 + 注释，不阻塞验收，但要在 README 标注「桩」）。
2. **六模块都要能独立断言**，不要做成「一个大字符串打印完就行」——每条断言的期望是可判定的布尔/数值。
3. **mock provider 的故障注入是可开关的**：正常断言用无故障序列，事故场景才开 `faults`——否则确定性被污染。
4. **完成后**：在 course-structure.ts `api-engineering.practicalOutput` 已写的 clone 判据（`cd api-demo && npm i && npm run demo` → `✅ api 验收通过`）必须真实成立；并把 `mvps.ts` 里 `api-mvp` 从 planned → done（附 exit 0 证据）。这个转移是 wei 的职责，别在本规格文件里动。
5. **别越界**：真实 provider、真实网关、真实 HTTP server 都在 nonGoals；做进去既超最小闭环、又破坏「全离线零 key」的 clone 判据。