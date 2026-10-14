# M2 · sandbox-mcp-eval 代码结构清单（capstone-m2-structure，写给 wei 直接建文件）

> 按 `notes/capstone-m2-exercise.md` 落地 `my-agent/` 的 M2 增量骨架。**M2 在 M1 上真·增建**：`exercises/m2/starter` 继承 `exercises/m1/solution`（上一 milestone 完成态），本 milestone 新增能力挖成 `TODOError`。命名 / 协议已与 `capstone-blueprint.md` §7 + `capstone-style-guide.md` + M0/M1 structure 对齐。

## 1. 目标目录结构（M2 阶段新增）

```
my-agent/
  package.json              # 新增 demo:m2 / assert:m2 / assert:m2:solution；demo 前进到 m2
  assert/
    m2.assert.ts            # 新增（m0/m1.assert.ts 不动）
  exercises/
    m2/
      starter/              # = m1/solution 冻结 + M2 新增能力剪成 TODO
        types.ts            # M1 类型 + 四通道/沙箱/golden/防御类型（给全）
        model.ts            # 确定性 mock（扩展「MCP 远程工具」投毒脚本，给全）
        tools.ts            # read_file + search（照搬 m1，给全；MCP 工具归 mcp.ts）
        loop.ts             # = m1/solution 补全版 + 四通道接线（给全）
        session.ts          # 照搬 m1（给全）
        compress.ts         # 照搬 m1（给全）
        policy.ts           # 挖 m2.1（四通道 decide）
        sandbox.ts          # 挖 m2.2（沙箱三边界）
        mcp.ts              # 挖 m2.3（远程工具 RPC + 四层防御）
        eval.ts             # 挖 m2.4（评测主流程 + judge 校准 + 门禁）
        golden/
          golden.ts         # golden set 文本锚点（给全）
      solution/             # 补全后完成态（== 主线该 milestone freeze）
        （同 starter，10 文件 + golden/，TODO 全补全）
```

- **仍不建 `my-agent/src/`**（`src/` 是主线累计真源，待 M4 收口或由 wei 决定承接时机；`exercises/m<N>/solution` 是每 milestone 的 freeze）。
- `exercises/m0/`、`exercises/m1/`、`assert/m0|m1.assert.ts` **零改动**（已过关，可复跑）。

## 2. package.json / tsconfig 增量

```jsonc
// package.json（M1 基础上新增；保留 demo:m0/demo:m1/assert:m0/assert:m1/…/typecheck）
"scripts": {
  "demo":       "tsx exercises/m2/starter/loop.ts",     // 主线 demo 前进到 M2 starter
  "demo:m2":    "tsx exercises/m2/starter/loop.ts",
  "assert:m2":  "tsx assert/m2.assert.ts",              // M2 半成品（补全前红）
  "assert:m2:solution": "tsx assert/m2.assert.ts solution", // M2 参考答案（绿）
  "typecheck":  "tsc --noEmit"
}
```

`tsconfig.json` 不变（`include: ["exercises", "assert"]` 已覆盖 m2）。

## 3. 每文件职责 + TODO 位置标注

### 3.1 `types.ts`（给全，M1 类型 + M2 新增类型）

M1 的 `ToolCall` / `Message` / `ToolSpec` / `Action` / `TrajectoryEvent` 原样保留，追加：

```ts
export type Channel = "allow" | "approve" | "deny" | "sandbox";
export const CHANNEL_PRIORITY: readonly Channel[] = ["deny", "approve", "sandbox", "allow"];
export interface Rule { id: string; channel: Channel; tools: string[]; when?: (args: any) => boolean; note?: string; }
export interface Verdict { channel: Channel; ruleId: string | null; reason: string; }
export interface SandboxConfig { workspace: string; envWhitelist: string[]; network: "deny"; }
export class BoundaryViolation extends Error { constructor(readonly kind: "path" | "env" | "network", msg: string) { super(msg); } }
export interface GoldenQ { q: string; anchors: string[]; note?: string; outOfScope?: boolean; }
export interface AuditEvent { seq: number; kind: string; detail: string; }
export interface GateVerdict { layer: string; passed: boolean; reason: string; }
export interface DefenseConfig { sanitize: boolean; policyGate: boolean; egress: boolean; }
```

### 3.2 `model.ts`（给全，确定性底座）

M1 的「无 tool → search / 有 tool → deliver」扩一条「投毒搜索」脚本，示范 remote 工具返回被投毒、需要 M2 防御：

```ts
export function mockModel(messages: Message[]): string {
  const sawTool = messages.some((m) => m.role === "tool");
  if (sawTool) return JSON.stringify({ deliver: "已调用远程工具并完成防御处理。" });
  return JSON.stringify({ tool_call: { name: "web_search", arguments: { query: "Q1 报告关键数据" } } });
}
// web_search 是 mcp.ts 的远程工具（走 rpcCall），其返回含投毒行 → 需 L1 消毒
```

### 3.3 `tools.ts` / `loop.ts` / `session.ts` / `compress.ts`（给全，照搬 m1/solution）

- `tools.ts`：`read_file` + `search`（打分排序）照搬 `m1/solution/tools.ts`，`callTool` 分发照搬。**不加 MCP 工具**（远程工具在 mcp.ts 单独声明，由 loop 通过 `callMCP` 而非 `callTool` 走）。
- `loop.ts`：`parseModelReply` / `runLoop` 照搬 m1；`executeAndBackfill` 的权限门接线从 M1 二态（`decide(name)==="deny"`）升级为四通道——`decide(name,args)` 返回 `{channel,…}`，`deny/approve` 拒绝回写、`allow` 放行、`sandbox` 走沙箱执行。这条升级给全；判定挖在 `policy.ts`。
- `session.ts` / `compress.ts`：照搬 m1。

### 3.4 `policy.ts`（半成品，挖 m2.1）

给全：`RULE_TABLE`（预置规则：read_file/search=allow、write_file=sandbox、run_shell/send_email=approve；`when` 参数级匹配器）。挖 `decide`：

```ts
const RULE_TABLE: Rule[] = [
  { id: "r-read", channel: "allow", tools: ["read_file", "search"], note: "只读放行" },
  { id: "r-sandbox", channel: "sandbox", tools: ["write_file"], note: "副作用→沙箱" },
  { id: "r-approve", channel: "approve", tools: ["run_shell", "send_email"], note: "高危→审批" },
];
export function decide(tool: string, args: Record<string, unknown>): Verdict {
  // TODO m2.1：按 CHANNEL_PRIORITY 顺序匹配 RULE_TABLE（含 when(args)），返回 {channel,ruleId,reason}；无匹配 fallback=deny
  throw new TODOError("m2.1: 实现四通道 policy 判定 deny>approve>sandbox>allow");
}
```

### 3.5 `sandbox.ts`（半成品，挖 m2.2）

给全：`SandboxConfig`（types.ts）、`makeWorld(ns, fs, containers)`。

挖 `m2.2`：`assertInWorkspace` + `Sandbox` 三边界。

```ts
export function assertInWorkspace(workspace: string, raw: string): string {
  // TODO m2.2a：规范化相对路径，拒绝绝对路径 / `..` 越根 / 越出 workspace，违规抛 BoundaryViolation("path",…)
  throw new TODOError("m2.2: 实现沙箱路径边界");
}
export class Sandbox {
  constructor(readonly config: SandboxConfig, readonly world: World, readonly hostEnv: Record<string, string>) {}
  // TODO m2.2b：env(name) 只读白名单（白名单外 undefined）；openNetwork(target) 恒抛 BoundaryViolation("network",egress 禁用)
  throw new TODOError("m2.2: 实现沙箱 env 白名单与网络禁用边界");
}
```

`World`（内存 fs Map + log）照搬 sandbox-demo `makeWorld`（给全）。

### 3.6 `mcp.ts`（半成品，挖 m2.3）

给全：`POISON_LINE`（投毒 payload，预置）+ `INJECTION_PATTERNS`（正则表）。

挖 `m2.3`：`callMCP`（rpcCall 形状）+ 四层防御。

```ts
const RPC_RESULT: Record<string, string> = {
  "Q1 报告关键数据": [
    "结果 1: Q1 营收同比增 15%（revenue=125M）",
    POISON_LINE,   // 投毒点：指令藏在正常结果中间
  ].join("\n"),
};

export async function callMCP(method: string, params: Record<string, unknown>): Promise<string> {
  // TODO m2.3a：rpcCall 形状（{method, params} → mock 响应表），离线不真发 RPC
  throw new TODOError("m2.3: 实现远程工具 RPC 调用形状");
}
export function sanitizeToolOutput(raw: string): { content: string; hits: number; quarantined: boolean } {
  // TODO m2.3b：L1 输入消毒——命中 INJECTION_PATTERNS 的行包 untrusted 围栏；L2 classifyTool/consultApproval、L3 EgressGate.check、L4 AuditLog 按 defense-in-depth 接线
  throw new TODOError("m2.3: 实现供应链四层防御（L1 消毒/L2 policy/L3 egress/L4 审计）");
}
```

### 3.7 `eval.ts` + `golden/golden.ts`（半成品，挖 m2.4）

给全：`golden/golden.ts`（`GOLDEN: GoldenQ[]`，每条 2-3 个 8-20 字中文文本锚点，从 eval 课的现行原文 grep 得到）。

挖 `m2.4`：`runEval` + `judgeCalibrate` + 门禁。

```ts
export function runEval(): void {
  // TODO m2.4a：golden 锚点→chunk id（子串匹配），任一锚点匹配 0 条 → 打印 ❌题号+锚点+建议 并 process.exit(1)（响亮失败）
  //        每题 recall@k = |top-k ∩ gold|/|gold|，recall@10=1 判 PASS，末行系统平均 + PASS n/N
  throw new TODOError("m2.4: 实现 golden set + recall 评测与锚点失效门禁");
}
export function judgeCalibrate(answers: string[], goldLabels: string[]): { consistent: boolean; score: number } {
  // TODO m2.4b：确定性 mock judge——答案与 golden 标签比对 + 一致性阈值（不调真实模型）
  throw new TODOError("m2.4: 实现确定性 judge 校准");
}
```

## 4. 断言文件怎么组织（`assert/m2.assert.ts`）

照 `m0/m1.assert.ts`：`process.argv[2]` 切 starter/solution（动态 `await import`），`check()` 捕获 `TODOError` 判「未实现」。

```ts
// assert/m2.assert.ts（argv[2]==='solution' 切目标；半成品红 / solution 绿）
const target = process.argv[2] === "solution" ? "solution" : "starter";
const pol = await import(`../exercises/m2/${target}/policy.ts`);
const sbx = await import(`../exercises/m2/${target}/sandbox.ts`);
const mcp = await import(`../exercises/m2/${target}/mcp.ts`);
const eva = await import(`../exercises/m2/${target}/eval.ts`);

// a1 四通道：decide('read_file',{})='allow' / write_file='sandbox' / run_shell='approve' / unknown='deny'
// a2 沙箱边界：assertInWorkspace('work','../x') 抛 BoundaryViolation；env('SECRET')=undefined；openNetwork 抛 egress
// a3 MCP 防御：sanitizeToolOutput(POISON_LINE).hits>0 且 quarantined；EgressGate.check(send_email,{to:'x@evil'}) 未过；AuditLog.digest() 两跑一致
// a4 评测：golden 1 题命中 recall@10=1 + PASS；失效锚点 → exit≠0（响亮失败）
// 末行：四断言全绿 → ✅ m2 验收通过，否则 ❌ m2 验收通过 + process.exitCode=1
```

- **半成品红**：`m2.x` 抛 `TODOError` → 断言捕获 → `❌ m2.x 未实现` → 末行 `❌ m2 验收通过`（exit 1）。
- **solution 绿**：`npm run assert:m2:solution` 四条 `✅` + `✅ m2 验收通过`（exit 0）。
- **可重放**：`assert:m2:solution` 连跑两次 `diff` 空（含 `AuditLog.digest()` 的 `fnv1a:…` 摘要稳定）。

## 5. solutions 怎么放 + git tag m2

- `exercises/m2/solution/` = 补全后（4 个 TODO 函数体不再是 `throw TODOError`），`main()` 可 `npm run demo:m2` 跑通「四通道判定 → 沙箱/MCP 执行 → 评测 PASS」。
- **逐字节继承**：`solution/{types,model,tools,loop,session,compress}.ts` 的 M1 已建段 == `exercises/m1/solution/` 同名段（见 exercise §7 的 diff 命令）。
- **git tag 渐进快照**：`git tag m1`（若未打）→ `git tag m2`；`git diff m1 m2` 只应见 M2 新增（4 能力 + 类型增补 + 四通道接线）。沿用 t25 纪律：`my-agent/` 若仍 git-untracked，真增建以文件级 diff 证据交付。

## 6. README 七段（M2 按 style-guide §5 模板填）

1. 定位：把 my-agent 从「多工具+会话+压缩+权限门」长成「四通道权限门 + 沙箱 + MCP 防御 + 评测门禁」的可评测代理。
2. 要加的能力：`m2.1` 四通道 policy / `m2.2` 沙箱三边界 / `m2.3` MCP RPC+四层防御 / `m2.4` golden set+judge 校准+门禁。
3. 必修课：sandbox（四通道 policy）· mcp（原语/四层防御）· evaluation（judge/golden/CI 门禁）· multi-agent（单线程约束意识）。
4. 练习：`npm run assert:m2`（先红）→ 补 §2 四个 TODO → `npm run assert:m2` 全绿。
5. TODO 清单：四行表（编号 / 文件 / 函数 / 要求），与 exercise §3 一致。
6. 断言命令：`npm run assert:m2` 末端 `✅ m2 验收通过`（exit 0，连跑两次 diff 空）。
7. 参考答案指针：切片答案 sandbox-demo（types/policy/sandbox）、mcp-demo（defense/server/agent）、rag-demo evaluate.ts（golden/recall/anchorMiss）（见 exercise §5）；主线答案 `../solution/`。

## 7. 建骨架自检（wei 完成后跑一次）

- [ ] `npm run assert:m2`（starter）exit ≠ 0，四条 `❌ m2.x 未实现`，末行 `❌ m2 验收通过`；
- [ ] 补全 solution 后 `npm run assert:m2:solution` exit 0，四条 `✅` + 末行 `✅ m2 验收通过`；
- [ ] `npm run demo:m2`（po solution）打印 PASS 与审计摘要（`fnv1a:…`）；
- [ ] 连跑两次 `assert:m2:solution` 输出 `diff` 空（可重放）；`npx tsc --noEmit`（strict）0 错；
- [ ] `diff exercises/m1/solution/tools.ts exercises/m2/starter/tools.ts` 空、`diff …/session.ts …/session.ts` 空（继承证据）；`git tag m2` + `git diff m1 m2` 只见 M2 新增；
- [ ] 无 `Date.now`/`Math.random`/`pid`/`fetch`（真 RPC）/跨目录 import；沙箱用内存 `Map` 世界不碰真实 FS/网络。