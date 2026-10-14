# model-basics-mvp 设计规格（model-basics 课独占 MVP）

> 写给下一任务的实现者（wei）：照这份规格从零建 `model-basics-demo/`，做到「可 clone、可运行、全离线零 key、确定性、断言自测」，不需要再找本课内容架构师确认设计取舍。
> 状态：本文件是**设计规格**，不是实现；`model-basics-demo/` 目录目前不存在。
> 关联：course-structure.ts `model-basics.mvpSlug = 'model-basics-mvp'`（sprint 2 标 planned）；教学正文见 `notes/model-basics.md`。

## 0. 目标（一句话）

model-basics-mvp = **KV cache / 推理成本数值走查脚本**：输入（上下文长度 / 输出预算 / 单价 / 并发 / 模型结构参数）→ 输出（KV cache 显存估算、前缀缓存命中 savings、TTFT/TPOT 首 token 时间估算、总成本按 prefill/decode 拆分）——**全离线确定性计算，不调模型、不联网**，四模块各一个可证伪断言，`npm run demo` 全绿 = 证明「模型是 harness 组件时，哪些性质泄漏成工程约束」能用数字当场手推。

## 1. 复用关系与边界

- **复用（照搬公式语义，不 import 上位 demo）**：`notes/model-basics.md`
  - §S1 KV cache 公式：`2 × layers × kv_heads × head_dim × seq_len × bytes`；
  - §S4.1 成本模型：`stepCost = input_t × p_in + output_t × p_out`、`taskCost = Σ 单步 × 步数`、输出 ≈ 输入 3-5×；
  - §S4.0 / §S8 延迟估算：`TTFT = t_queue + t_prefill + t_network`、`TPOT ≈ (weight_bytes + B×kv_bytes)/HBM_bw`、`t_prefill ≈ prompt_tokens / prefill_throughput`。
- **边界**：各 demo 目录独立可 clone（sandbox/mcp/durable/api/flywheel 都不跨目录 import），model-basics-demo 同样独立，四处公式「照搬 + 注释出处」。

## 2. 功能范围

### In scope（四模块最小可运行子集，各对一条断言）

1. **kv（KV cache 显存估算）**：`kvBytesPerToken(layers, kvHeads, headDim, bytes)` → 每 token KV 字节 + 给定 seq_len×并发 → 总显存。
2. **cache（前缀缓存 savings）**：稳定前缀命中（动态字段放末尾）→ prefill 只算新增段；动态字段放最前 → 前缀每轮变、缓存永久 miss → 全量重算。
3. **latency（TTFT/TPOT 估算）**：给定 prefill 吞吐 / HBM 带宽 / 并发 → `ttft()`、`tpot()`，并区分「排队 vs prefill」。
4. **cost（总成本拆分）**：`stepCost` + `taskCost` + caching 折扣（只打 prefill 命中段）+ 按 prefill/decode 归因。

### NonGoals（明确不做，别做）

- **不做**真实模型推理 / 真实 GPU / 推理引擎 / provider 网络调用（零 API key）。
- **不做**数值校准到某真实硬件/模型（脚本用的是**量级参考**，非精确承诺）。
- **不做**微调实验 / 训练脚本 / 采样模拟（那是 theory，不是计算走查）。

## 3. 目录与文件结构

```
model-basics-demo/
  package.json          # scripts: demo (tsx src/demo.ts), typecheck (tsc --noEmit)；deps: tsx + typescript + @types/node
  tsconfig.json         # strict / NodeNext
  README.md             # clone 判据 + 四模块表 + nonGoals
  src/
    types.ts            # 输入参数 / KvEstimate / LatencyEstimate / CostBreakdown
    kv.ts               # kvBytesPerToken + 总显存
    cache.ts            # 前缀命中判定 + savings
    latency.ts          # ttft / tpot（排队 vs prefill 拆解）
    cost.ts             # stepCost / taskCost / caching 折扣 / prefill-decode 归因
    demo.ts             # 入口：串四模块跑一遍 S8 走查，末尾打印验收汇总
    assert.ts           # 断言式自测：四模块各一条可证伪用例
```

（src 目标规模 ~250 行，比 flywheel 更小——纯计算，无状态机。）

## 4. 入口命令与 clone 判据

```bash
cd model-basics-demo
npm i                 # NODE_ENV=production 时改用 NODE_ENV=development npm install
npm run demo          # 四模块断言 + S8 走查重放 + 末尾汇总
npm run typecheck
```

- **判定「clone 能跑」**：`npm run demo` 末尾打印 `✅ model-basics 验收通过：四模块断言全绿`；任一断言失败打印 `❌` 并以退出码 1 终止（可进 CI）。
- **全离线零 key**：纯计算，不 import 任何联网 SDK。
- **确定性**：无 `Date.now()`/`Math.random()`/pid；输入参数用预置常量；跑 N 次逐字节一致。

## 5. 各模块规格（接口级，给 wei 直接实现）

### 5.1 `kv.ts` —— KV cache 显存

```ts
export function kvBytesPerToken(layers: number, kvHeads: number, headDim: number, bytes: number): number;
// = 2 * layers * kvHeads * headDim * bytes（2 = K+V）
export function kvTotalBytes(seqLen: number, perToken: number, concurrency: number): number;
```

- 断言 kv-A：`kvBytesPerToken(32, 8, 128, 2) === 131072`（Mistral-7B 量级，0.13MB/token）。
- 断言 kv-B：`kvTotalBytes(8192, perToken, 8)` ≈ 1.0GB/路、并发 8 → 8GB（只放 KV，权重另算）。

### 5.2 `cache.ts` —— 前缀缓存 savings

```ts
export function prefixStable(prompt: { system: string; tools: string; history: string; dynamic: string }): boolean;
// dynamic 放末尾 → 前缀稳定（system+tools 每轮不变）→ hit；dynamic 放最前 → 前缀每轮变 → miss
export function prefillTokens(promptLen: number, stable: boolean, newTokens: number): number;
// stable=true → 只算 newTokens；stable=false → 全 promptLen 重算
```

- 断言 cache-A：稳定前缀 → prefill 只算新增段（8K 系统+工具命中、新增 ~500 token）。
- 断言 cache-B：动态字段放最前 → prefill 全 8K 重算（savings = 0）。

### 5.3 `latency.ts` —— TTFT / TPOT

```ts
export function ttft(tQueue: number, promptTokens: number, prefillThroughput: number, tNet: number): number;
// = t_queue + prompt_tokens/prefill_throughput + t_net
export function tpot(weightBytes: number, concurrency: number, kvBytesPerSeq: number, hbmBw: number): number;
// ≈ (weight_bytes + B·kv_bytes_per_seq) / HBM_bw
```

- 断言 latency-A：单请求基线对照能拆出「排队 vs prefill」（TTFT 3.2s，其中 t_queue ≈ 2.2s）。
- 断言 latency-B：`tpot` 随并发 B 上升（KV 份数变多），与 S1 推论 2 一致。

### 5.4 `cost.ts` —— 成本拆分

```ts
export function stepCost(inputTokens: number, outputTokens: number, pIn: number, pOut: number): number;
export function taskCost(steps: number[]): number;              // Σ 单步（步数 = 乘数放大）
export function withCacheDiscount(step: number, inputTokens: number, hitPrefixTokens: number, discount: number): number;
export function breakdown(inputCost: number, outputCost: number): { prefill: number; decode: number };
```

- 断言 cost-A：`stepCost` = 输入×pIn + 输出×pOut，输出单价 = 输入 3-5×。
- 断言 cost-B：`taskCost` 步数放大（8 步 → 12 步的增量 > 砍 20% prompt 的省）、caching 折扣只打 prefill 命中段。

## 6. 断言式自测清单（demo.ts 职责）

demo.ts 按序跑下面 10 条，每条 `✅/❌`，全绿才打印汇总：

| # | 模块 | 断言 | 期望 |
|---|---|---|---|
| 1 | kv | Mistral-7B 量级每 token KV | 131072 B ≈ 0.13MB/token |
| 2 | kv | 8K × 并发 8 总 KV | ~8GB（权重另算） |
| 3 | cache | 稳定前缀命中 | prefill 只算新增 ~500 token |
| 4 | cache | 动态字段放最前 | 前缀 miss、全 8K 重算 |
| 5 | latency | TTFT 拆 queue vs prefill | 3.2s 里 t_queue≈2.2s |
| 6 | latency | TPOT 随并发升 | B 份 KV → TPOT 上升 |
| 7 | cost | stepCost = token×单价 | 输出 = 输入 3-5× |
| 8 | cost | taskCost 步数放大 | 8→12 步增量 > 砍 20% prompt |
| 9 | cost | caching 折扣 | 只打 prefill 命中段、decode 原价 |
| 10 | cost | prefill/decode 归因 | 两行可解释拆分 |

最后跑一段「**S8 延迟归因走查重放**」（`notes/model-basics.md` §S8 的六步，但用脚本函数逐条重算）：TTFT 3.2s / TPOT 40ms / 并发 8 / 8K prompt → 单请求基线拆出排队 → KV 显存 8GB → 前缀 miss 是 prefill 主因 → 修前缀后 prefill 8K→500 → 三条优化。打印可读时间线（逻辑步号）。

## 7. 确定性纪律（参照 api-demo / flywheel-demo）

- 输入参数 = 预置常量（模型结构 / 单价 / 并发 / 长度）；无 `Date.now()`/`Math.random()`/pid。
- 期望测试值用「预置输入手算后」写死在断言里（如 `131072`），**量级参考口径**——README 显式声明「0.13MB/token、3-5×、2-3× 是量级参考，非某真实模型/硬件的精确承诺」。
- 跑 N 次输出逐字节一致；会随模型/硬件漂移的精确数只出现在正文「来源与锚点」，不进 clone 判据。

## 8. 给 wei 的关键提示与风险

1. **纯计算脚本，不要碰任何 SDK**：四模块全是纯函数，`tsx src/demo.ts` 直接跑，`typescript` 只用于 `tsc --noEmit`；**不 import 真实推理引擎、不联网、零 API key**。
2. **四模块各一断言、别做成大打印**：期望是手算后硬编码的数值（`131072`、`~8GB`、`0.13`），不靠人肉读。
3. **「量级参考」口径要守住**：KV 公式 / 单价 / 吞吐是输入参数，不是从某真实模型读来的；README 写明「数值章节的 0.13MB/token 等为量级参考」。
4. **S8 走查重放是差异化**：`demo.ts` 末尾把 `notes/model-basics.md` §S8 的六步用本脚本的函数重算一遍（排队 2.2s → KV 8GB → 前缀 miss → 修前缀 0.17s），让「延迟归因」不是叙述而是可复算。
5. **完成后**：在 course-structure.ts `model-basics.practicalOutput` 已写的 clone 判据（`cd model-basics-demo && npm i && npm run demo → ✅ model-basics 验收通过`）必须真实成立；并把 `mvps.ts` 里 `model-basics-mvp` 从 planned → done（附 exit 0 证据）——这是 wei 的职责，别在本规格文件里动。
6. **别越界**：真实推理、真实硬件/引擎、provider 调用、微调实验都在 nonGoals。