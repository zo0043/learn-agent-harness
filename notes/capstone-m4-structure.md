# M4 · memory-flywheel-model 代码结构清单（capstone-m4-structure，写给 wei 直接建文件）

> 按 `notes/capstone-m4-exercise.md` 落地 `my-agent/` 的 M4 增量骨架（最后一个 milestone）。**M4 在 M3 上真·增建**：`exercises/m4/starter` 继承 `exercises/m3/solution`（上一 milestone 完成态），本 milestone 新增能力（4 项 → 4 个 TODO）挖成 `TODOError`。命名 / 协议与 `capstone-blueprint.md` §7 + `capstone-style-guide.md` + M0/M1/M2/M3 structure 对齐。

## 1. 目标目录结构（M4 阶段新增）

```
my-agent/
  package.json              # 新增 demo:m4 / assert:m4 / assert:m4:solution；demo 前进到 m4
  assert/
    m4.assert.ts            # 新增（m0/m1/m2/m3.assert.ts 不动）
  exercises/
    m4/
      starter/              # = m3/solution 冻结 + M4 新增能力剪成 TODO
        types.ts            # M3 类型 + memory/flywheel/modelcog 类型（给全）
        model.ts            # 确定性 mock（扩展「记忆候选 / 飞轮样本」入口，给全）
        tools.ts            # read_file + search（照搬 m3，给全）
        loop.ts             # = m3/solution 补全版 + M4 接线（recall 记忆 + 飞轮门禁止步，给全）
        session.ts          # 照搬 m3（给全）
        compress.ts         # 照搬 m3（给全）
        policy.ts           # 四通道 policy（照搬 m3，给全）
        sandbox.ts          # 沙箱三边界（照搬 m3，给全）
        mcp.ts              # MCP rpcCall + 四层防御（照搬 m3，给全）
        eval.ts             # 评测套件（照搬 m3，给全）
        golden/golden.ts    # golden 文本锚点（照搬 m3，给全）
        durable.ts          # durable（照搬 m3，给全）
        stream.ts           # SSE（照搬 m3，给全）
        retry.ts            # 重试+cache（照搬 m3，给全）
        router.ts           # 路由+成本（照搬 m3，给全）
        otel.ts             # span 埋点（照搬 m3，给全）
        memory.ts           # 挖 m4.1（写读遗忘 + 四道投毒防线）
        flywheel.ts         # 挖 m4.2（label 两轮降噪 + 门禁禁 auto-apply）
        costwalk.ts         # 挖 m4.3（KV cache / 成本走查）
        framework.ts        # 挖 m4.4（框架边界对照 + allowedTools 抢跑对照）
      solution/             # 补全后完成态（== 主线收口 freeze）
        （同 starter，20 文件 + golden/，TODO 全补全）
```

- **仍不建 `my-agent/src/`**；`exercises/m0|m1|m2|m3/`、`assert/m0|m1|m2|m3.assert.ts` **零改动**（已过关，可复跑）。
- **M4 完成 = 主线收口**：补 `assert:m4:solution` 全绿后，`git tag m0..m4` 五档齐，`git diff m0 m4` 即完整主线真增建历程。

## 2. package.json / tsconfig 增量

```jsonc
// package.json（M3 基础上新增；保留 demo:m0..m3/assert:m0..m3/…/typecheck）
"scripts": {
  "demo":       "tsx exercises/m4/starter/loop.ts",     // 主线 demo 前进到 M4 starter
  "demo:m4":    "tsx exercises/m4/starter/loop.ts",
  "assert:m4":  "tsx assert/m4.assert.ts",              // M4 半成品（补全前红）
  "assert:m4:solution": "tsx assert/m4.assert.ts solution", // M4 参考答案（绿）
  "typecheck":  "tsc --noEmit"
}
```

`tsconfig.json` 不变（`include: ["exercises", "assert"]` 已覆盖 m4）。

## 3. 每文件职责 + TODO 位置标注

### 3.1 `types.ts`（给全，M3 类型 + M4 新增类型）

M3 的 `StepKind`/`SSEFrame`/`ProviderSpec`/`SpanNode` 等原样保留，追加：

```ts
export type TrustLevel = "untrusted" | "inferred" | "user_confirmed";
export interface MemoryItem { id: string; content: string; category: string; scope: { repo: string | null; user: string | null }; trust: TrustLevel; confidence: number; valid_from: string; source?: string; lineage?: string[]; }
export interface Decision { action: "propose" | "reject"; attributable: boolean; reason: string; }  // 无 apply 态 → 禁 auto-apply
export type Direction = "bullish" | "bearish" | "neutral" | "none";
export interface LedgerRow { id: string; prompt_version: string; model_version: string; harness_commit: string; dedupe_key: string; direction: Direction; dirty?: boolean; outcome_status: "pending" | "labeled" | "skipped"; }
// ModelCogReport / FIXED_NOW 常量等
```

### 3.2 `model.ts` / `tools.ts` / `loop.ts` / … / `otel.ts`（给全，照搬 m3/solution + 接线）

- `model.ts`：M3 mock 扩「记忆候选 / 飞轮样本」预置入口。
- `loop.ts`：`executeAndBackfill` 在工具执行前 `recall(store, 相关上下文)`（记忆注入），决策后飞轮接线 `gate` 只 `propose/reject` 不 `apply`。接线给全；判定挖在 `memory.ts`/`flywheel.ts`。
- 其余照搬 m3。

### 3.3 `memory.ts`（半成品，挖 m4.1）

给全：`TRUST`（untrusted/inferred/user_confirmed）、`FIXED_NOW`（逻辑时钟）、`DEFENSE_KEYS` 四道投毒防线键（`trustGate/injectionScan/highRiskApproval/auditTrail`）。

挖 `m4.1`：

```ts
export function write(store: MemoryStore, candidate: MemoryItem): void {
  // TODO m4.1a：低信任候选不自动注入/不覆盖高信任（trustGate）；内容注入扫描（injectionScan）；高危事实独立审批（highRiskApproval）；写入留痕（auditTrail）+ 同 scope/category 冲突消解
  throw new TODOError("m4.1: 实现记忆写路径四道投毒防线 + 冲突消解");
}
export function recall(store: MemoryStore, query: string, opts?: { repo?: string | null; user?: string | null; k?: number }): MemoryItem[] {
  // TODO m4.1b：读路径——scope 过滤 + ttl 时效窗口 + 只注入「达阈值且过防线」的 active 条目
  throw new TODOError("m4.1: 实现记忆读路径 scope 过滤 + 时效窗口");
}
export function forget(store: MemoryStore, id: string, reason?: string): void {
  // TODO m4.1c：遗忘——落墓碑 + 沿血缘（lineage）传播到派生物（forgetPropagation）
  throw new TODOError("m4.1: 实现遗忘与血缘传播");
}
```

### 3.4 `flywheel.ts`（半成品，挖 m4.2）

给全：`PRED` 预置预测表（rowId × prompt_version → Direction）、`NOISE` 阈值。

挖 `m4.2`：

```ts
export function round(rows: LedgerRow[], from: string, to: string): { prompt_version: string } {
  // TODO m4.2a：一轮「只动 prompt」变更——除 prompt_version 外，其余字段逐项全同，否则抛错（不可归属为 prompt 改进）
  throw new TODOError("m4.2: 实现两轮降噪 round（只动 prompt 强制校验）");
}
export function gate(prev: MetricReport, next: MetricReport): Decision {
  // TODO m4.2b：关键指标 f1 不降 && 目标 precision 显著升（>NOISE）→ propose，否则 reject；action 只有 propose/reject（无 apply，禁 auto-apply）
  throw new TODOError("m4.2: 实现决策门禁（禁 auto-apply）");
}
export function curate(rows: LedgerRow[]): { kept: LedgerRow[]; poisoned: LedgerRow[]; deduped: LedgerRow[] } {
  // TODO m4.2c：去污染（dirty 单列）+ 去重（dedupe_key 聚代表）
  throw new TODOError("m4.2: 实现去污染去重");
}
```

### 3.5 `costwalk.ts`（半成品，挖 m4.3）

给全：模型参数常量（layers/kv_heads/head_dim/bytes、单价表）。

挖 `m4.3`：

```ts
export function kvBytesPerToken(layers: number, kvHeads: number, headDim: number, bytes: number): number {
  // TODO m4.3a：KV 显存/每 token = 2 × layers × kv_heads × head_dim × bytes（2 = K+V）
  throw new TODOError("m4.3: 实现 KV cache 显存估算");
}
export function withCacheDiscount(step: number, inputTokens: number, hitPrefixTokens: number, discount: number): number {
  // TODO m4.3b：缓存折扣只动 prefill 命中段（decode 原价）
  throw new TODOError("m4.3: 实现缓存折扣只打 prefill");
}
export function shouldScaleUp(kv: number, taskCost: number, budget: number, trainCost: number): "no" | "scale" | "fine-tune" {
  // TODO m4.3c：KV 显存 + 单步成本 × 步数 + 训练/推理成本阈值联合走查，给「不上更大模型 / 上更大 / 微调」的数值判断
  throw new TODOError("m4.3: 实现成本走查（该不该上更大模型 / 微调）");
}
```

### 3.6 `framework.ts`（半成品，挖 m4.4）

给全：五维对照维度名 + 三条 SDK 抽象边界数据（loop 归属/工具 schema/权限 HITL/状态中断/可观测）——取自 `framework-demo/src/compare.ts` 的 `DIMENSIONS`。

挖 `m4.4`：

```ts
export const COMPARE_TABLE: Array<{ dim: string; mine: string; sdk: string[] }> = [
  // TODO m4.4a：五维对照——「我搭的 my-agent」= 显式 loop + 显式 policy 门 + 显式 journal + 自建 span；三条 SDK 把 loop/权限/状态/可观测藏进框架
  throw new TODOError("m4.4: 实现框架五维边界对照（我搭的 vs 框架给的）");
];
export function allowedToolsRaceCheck(toolName: string, allowedTools: string[], canUseTool: (n: string, input: any) => { behavior: "allow" | "deny" }): { behavior: "allow" | "deny" } {
  // TODO m4.4b：allowedTools 抢跑对照——裸名 auto-approve 抢在 canUseTool 之前；正确写法是「不把危险工具放 allowedTools，让它落入 canUseTool 逐调用拦截」→ deny
  throw new TODOError("m4.4: 实现 allowedTools 抢跑对照（canUseTool 拦截）");
}
```

（主线 M4 不引真实 SDK——对照是离线数据 + `canUseTool` 逻辑函数，见 exercise §5 红线标注。）

## 4. 断言文件怎么组织（`assert/m4.assert.ts`）

照 `m0/m1/m2/m3.assert.ts`：`process.argv[2]` 切 starter/solution（动态 `await import`），`check()` 捕获 `TODOError` 判「未实现」。

```ts
// assert/m4.assert.ts（argv[2]==='solution' 切目标；半成品红 / solution 绿）
const target = process.argv[2] === "solution" ? "solution" : "starter";
const mem = await import(`../exercises/m4/${target}/memory.ts`);
const fly = await import(`../exercises/m4/${target}/flywheel.ts`);
const cw  = await import(`../exercises/m4/${target}/costwalk.ts`);
const fw  = await import(`../exercises/m4/${target}/framework.ts`);

// a1 记忆+防线：低信任候选不注入 / 反事实跨 scope 不召回 / forget 沿血缘传播到派生物 / 关掉 trustGate 后 probe 失败（消融敏感）
// a2 飞轮门禁：round 破坏「只动 prompt」抛错 / gate 关键指标 f1 不降 && precision 显著升 → propose、否则 reject / action 无 apply
// a3 模型意识：kvBytesPerToken 正确 / withCacheDiscount 只打 prefill / shouldScaleUp 带数值判断
// a4 框架对照：COMPARE_TABLE 五维「我搭的 vs 框架给的」成立 / allowedToolsRaceCheck 危险工具 deny 拦截
// 末行：四断言全绿 → ✅ m4 验收通过，否则 ❌ m4 验收通过 + process.exitCode=1
```

- **半成品红**：`m4.x` 抛 `TODOError` → `❌ m4.x 未实现` → 末行 `❌ m4 验收通过`（exit 1）。
- **solution 绿**：`npm run assert:m4:solution` 四条 `✅` + `✅ m4 验收通过`（exit 0）。
- **可重放**：`assert:m4:solution` 连跑两次 `diff` 空。

## 5. solutions 怎么放 + git tag m4

- `exercises/m4/solution/` = 补全后（4 个 TODO 函数体不再是 `throw TODOError`），`main()` 可 `npm run demo:m4` 跑通「记忆写读遗忘 → 飞轮门禁 → KV/成本走查 → 框架对照」。
- **逐字节继承**：`solution/` 里 M3 已建 16 文件 + golden 的 M3 段 == `exercises/m3/solution/` 同名段（见 exercise §7 的 diff 命令）。
- **git tag 渐进快照（收口）**：`git tag m3`（若未打）→ `git tag m4`；`git diff m3 m4` 只应见 M4 新增（4 能力 + 类型增补 + loop 接线）。**M4 后 `git tag m0..m4` 五档齐**，`git diff m0 m4` = 完整主线真增建历程（沿用 t25 纪律：my-agent/ git-untracked 时以文件级 diff 证据交付）。

## 6. README 七段（M4 按 style-guide §5 模板填）

1. 定位：把 my-agent 从「可恢复+流式路由+可观测」补成「有记忆+飞轮+模型意识+框架认知」的完整工具（主线收口站）。
2. 要加的能力：`m4.1` 记忆+防线 / `m4.2` 飞轮门禁 / `m4.3` KV+成本走查 / `m4.4` 框架对照。
3. 必修课：long-term-memory（四类记忆/防线）· data-flywheel（降噪/门禁）· model-basics（KV/成本）· framework-ecosystem（封装边界）+ industry-2026（横向收口素材）。
4. 练习：`npm run assert:m4`（先红）→ 补 §2 四个 TODO → `npm run assert:m4` 全绿。
5. TODO 清单：四行表（编号 / 文件 / 函数 / 要求），与 exercise §3 一致。
6. 断言命令：`npm run assert:m4` 末端 `✅ m4 验收通过`（exit 0，连跑两次 diff 空）。
7. 参考答案指针：切片答案 memory-redteam（memory/redteam）、flywheel-demo（label/gate/curate）、model-basics-demo（kv/cost）、framework-demo（compare/capabilities/lib）（见 exercise §5）+ 主线答案 `../solution/` + 主线毕业须知（exercise §9）。

## 7. 建骨架自检（wei 完成后跑一次，含主线毕业验收）

- [ ] `npm run assert:m4`（starter）exit ≠ 0，四条 `❌ m4.x 未实现`，末行 `❌ m4 验收通过`；
- [ ] 补全 solution 后 `npm run assert:m4:solution` exit 0，四条 `✅` + 末行 `✅ m4 验收通过`；
- [ ] `npm run demo:m4`（po solution）打印记忆注入/飞轮 gate/成本走查/框架对照；
- [ ] 连跑两次 `assert:m4:solution` 输出 `diff` 空（可重放）；`npx tsc --noEmit`（strict）0 错；
- [ ] `diff exercises/m3/solution/tools.ts exercises/m4/starter/tools.ts` 空、`diff …/durable.ts …/durable.ts` 空（继承证据）；`git tag m4` + `git diff m3 m4` 只见 M4 新增；
- [ ] **主线毕业验收（终审并行项）**：`assert:m0..m4:solution` 五档全绿 + `demo` 前进到 M4 + `git tag m0..m4` 五档齐 + `git diff m0 m4` 只见逐 milestone 真增建；
- [ ] 无 `Date.now`/`Math.random`/`pid`/`fetch`/真实 SDK import/真实 fs 写入；memory 用内存持久层 + `FIXED_NOW` 逻辑时钟；framework 对照离线条目。