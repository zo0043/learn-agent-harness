# M1 · multi-tool-session 代码结构清单（capstone-m1-structure，写给 wei 直接建文件）

> 按 `notes/process/capstone-m1-exercise.md` 落地 `my-agent/` 的 M1 增量骨架。**M1 在 M0 上真·增建**：`exercises/m1/starter` 继承 `exercises/m0/solution`（上一 milestone 完成态），本 milestone 新增的能力挖成 `TODOError` 占位。命名 / 协议已与 `capstone-blueprint.md` §7 + `capstone-style-guide.md` + `capstone-m0-structure.md` 对齐。

## 1. 目标目录结构（M1 阶段新增）

```
my-agent/
  package.json              # 新增 demo:m1 / assert:m1 / assert:m1:solution；demo 前进到 m1
  assert/
    m1.assert.ts            # 新增（m0.assert.ts 不动）
  exercises/
    m1/
      starter/              # = m0/solution 冻结 + M1 新增能力剪成 TODO
        types.ts            # M0 类型 + JSONL 事件类型（给全）
        model.ts            # 确定性 mock（扩展 search 脚本，给全；== m0/solution/model.ts 若不同则 diff 只见脚本扩展）
        tools.ts            # read_file（给全）+ search 打分排序（挖 m1.1）
        loop.ts             # = m0/solution/loop.ts 补全版 + 执行前接权限门（给全）
        session.ts          # 挖 m1.3
        compress.ts         # 挖 m1.2
        policy.ts           # 挖 m1.4
      solution/             # 补全后完成态（== 主线 src/ 该 milestone freeze）
        （同 starter，7 文件，TODO 全补全）
```

- **M1 仍不建 `my-agent/src/`**（`src/` 是主线累计真源，M1 起可先把 `exercises/m1/solution` 冻结为 `src/` 供 M2 承接，本结构清单不强制——若要建，`src/` == `exercises/m1/solution` 逐字节）。
- `exercises/m0/` 与 `assert/m0.assert.ts` **零改动**（M0 已过关，可复跑）。

## 2. package.json / tsconfig 增量

```jsonc
// package.json（在 M0 基础上新增；保留 demo/assert:m0/assert:m0:solution/typecheck）
"scripts": {
  "demo":       "tsx exercises/m1/starter/loop.ts",     // 主线 demo 前进到 M1 starter
  "demo:m0":    "tsx exercises/m0/starter/loop.ts",     // 回溯 M0（保留）
  "demo:m1":    "tsx exercises/m1/starter/loop.ts",     // M1 主线 demo 别名
  "assert:m0":  "tsx assert/m0.assert.ts",
  "assert:m0:solution": "tsx assert/m0.assert.ts solution",
  "assert:m1":  "tsx assert/m1.assert.ts",              // M1 半成品（补全前红）
  "assert:m1:solution": "tsx assert/m1.assert.ts solution", // M1 参考答案（绿）
  "typecheck":  "tsc --noEmit"
}
```

`tsconfig.json` 不变（`include: ["exercises", "assert"]` 已覆盖 m1）。

## 3. 每文件职责 + TODO 位置标注

### 3.1 `types.ts`（给全，M0 类型 + JSONL 事件）

M0 的 `ToolCall` / `Message` / `ToolSpec` / `Action` 原样保留，新增会话事件联合类型：

```ts
/** JSONL 一行一条；上下文由日志派生（不是另存） */
export type TrajectoryEvent =
  | { kind: "init"; system: string; user: string }
  | { kind: "assistant"; tool_calls?: ToolCall[]; deliver?: string }
  | { kind: "tool_exec"; id: string; name: string; status: "ok" | "denied" | "error"; result?: string }
  | { kind: "final"; content: string };
```

### 3.2 `model.ts`（给全，确定性底座；内容与 `m0/solution/model.ts` 只有一处脚本扩展）

M0 的「无 tool → read_file / 有 tool → deliver」扩成「无 tool → search / 有 search 结果 → deliver」：

```ts
export function mockModel(messages: Message[]): string {
  const sawTool = messages.some((m) => m.role === "tool");
  if (sawTool) return JSON.stringify({ deliver: "检索结果：BM25 是词频饱和的概率检索函数，k1 控制饱和程度。" });
  return JSON.stringify({ tool_call: { name: "search", arguments: { query: "BM25" } } });
}
```

### 3.3 `tools.ts`（半成品，挖 m1.1）

给全：`ToolSpec` 接口、`read_file`（照搬 m0）、`buildRegistry()` 骨架（登记 read_file + search）、`callTool()` 命名分发（照搬 m0 的 `registry.get(name)` + 未知抛错）、确定性检索语料常量。

挖 `m1.1`：`search` 工具的 execute（打分排序）。

```ts
const CORPUS = [
  { id: "c1", doc: "bm25", text: "BM25 是词频饱和的概率检索函数，k1 控制饱和程度。" },
  { id: "c2", doc: "harness", text: "agent loop = read prompt → call LLM → parse → execute 工具 → 回填。" },
];

const search: ToolSpec = {
  name: "search",
  description: "检索知识库（demo：分词打分排序，取 topK）",
  readonly: true,
  parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  execute: async ({ query }) => {
    // TODO m1.1：query 分词 → 对 CORPUS 每篇按词面命中打分 → sort 降序 → slice topK → JSON.stringify 命中摘要
    throw new TODOError("m1.1: 实现 search 打分排序执行体");
  },
};
```

### 3.4 `loop.ts`（给全，= m0/solution/loop.ts + 权限门接线）

`parseModelReply` / `executeAndBackfill` / `runLoop` 三个函数照搬 `m0/solution/loop.ts` 补全版。唯一改动：`executeAndBackfill` 执行工具前先过权限门（`policy.decide(name)`），`deny` 则把 `{role:"tool", content:"[策略拒绝] …"}` 回写、**不执行**。这条「执行路径上过权限门」接线给全；判定逻辑挖在 `policy.ts`（m1.4）。

```ts
import { decide } from "./policy";           // policy.ts 的 TODO 被调——deny 由它决定
// executeAndBackfill 内：
if (decide(tc.name) === "deny") {
  return [...messages, { role: "tool", tool_call_id: tc.id, name: tc.name, content: "[策略拒绝] 白名单外工具" }];
}
```

### 3.5 `session.ts`（半成品，挖 m1.3）

给全：`Session` 类骨架（`constructor(dir,id)`、`file` getter）、`TrajectoryEvent` 已由 types.ts 提供。

挖 `m1.3`：`append` / `loadAll` / `exists` / `start` / `rebuild`。

```ts
export class Session {
  constructor(private dir: string, public id: string) {}
  // TODO m1.3：append 写一行 JSONL；loadAll 读回事件数组；exists 判断日志存在；start 写 init；rebuild(events) 把事件重建为 messages（intent 无 exec → 未知状态标注）
  throw new TODOError("m1.3: 实现 JSONL 会话写入与重建");
}
```

### 3.6 `compress.ts`（半成品，挖 m1.2）

挖 `m1.2`：`compress(messages, threshold)` 压缩函数体。

```ts
export function compress(messages: Message[], threshold: number, keepTail = 2) {
  // TODO m1.2：estimateTokens 超 threshold → [head(0..1 原样), 中间摘要一行, ...tail(原样)]；未超 → 原样 {summarized:0}
  throw new TODOError("m1.2: 实现超窗口下限的「摘要 + 尾部原样」裁剪");
}
```

摘要必须**确定性**：中间每条消息 truncate 成一行 `role: content.slice(0,80)` 拼一条 `[压缩：此前 N 条摘要]`，**不调真实模型**。

### 3.7 `policy.ts`（半成品，挖 m1.4）

给全：`TOOL_ALLOWLIST = ["read_file", "search"]` 常量。

挖 `m1.4`：`decide(tool)` 判定。

```ts
export type PolicyDecision = "allow" | "deny";
export function decide(tool: string): PolicyDecision {
  // TODO m1.4：tool ∈ TOOL_ALLOWLIST → allow；否则 deny（默认 deny，白名单未列即拒）
  throw new TODOError("m1.4: 实现默认 deny 权限门判定");
}
```

## 4. 断言文件怎么组织（`assert/m1.assert.ts`）

照 `m0.assert.ts` 模式：一条脚本 `process.argv[2]` 切 starter/solution（动态 `await import`），`check()` 捕获 `TODOError` 判「未实现」。

```ts
// assert/m1.assert.ts（argv[2]==='solution' 切目标；半成品红 / solution 绿）
const target = process.argv[2] === "solution" ? "solution" : "starter";
const tools = await import(`../exercises/m1/${target}/tools.ts`);
const comp = await import(`../exercises/m1/${target}/compress.ts`);
const ses = await import(`../exercises/m1/${target}/session.ts`);
const pol = await import(`../exercises/m1/${target}/policy.ts`);

// a1 检索打分排序（m1.1）：callTool(registry,'search',{query:'BM25'}) 命中 bm25 置顶
// a2 压缩（m1.2）：构造超阈值 messages → 长度减小 + head/tail 逐字保留 + summarized>0
// a3 会话重建（m1.3）：append 2 事件 → loadAll 2 条 → rebuild 出 system/user + tool + 未知 intent 标注
// a4 权限门（m1.4）：decide('read_file')='allow' / decide('search')='allow' / decide('write_file')='deny' / decide('run_shell')='deny'
// 末行：四断言全绿 → ✅ m1 验收通过，否则 ❌ m1 验收通过 + process.exitCode=1
```

- **半成品红**：`m1.x` 抛 `TODOError` → 断言捕获 → `❌ m1.x 未实现` → 末行 `❌ m1 验收通过`（exit 1）。
- **solution 绿**：`npm run assert:m1:solution` 四条 `✅` + `✅ m1 验收通过`（exit 0）。
- **可重放**：`assert:m1:solution` 连跑两次 `diff` 空。

## 5. solutions 怎么放 + git tag m1

- `exercises/m1/solution/` = 补全后（4 个 TODO 函数体不再是 `throw TODOError`），`main()`（`loop.ts`）可 `npm run demo:m1` 跑通、打印「检索结果：BM25 …」。
- **逐字节继承**：`solution/types.ts` + `solution/model.ts` + `solution/loop.ts` 的 M0 已建段 == `exercises/m0/solution/` 同名段；`tools.ts` 只增 `search` 与语料，`read_file`/`callTool` 逐字节同 m0。
- **git tag 渐进快照**：`git tag m0`（若未打）→ `git tag m1`；`git diff m0 m1` 只见 M1 新增（4 能力 + JSONL 事件类型 + search 语料），M0 段无 diff。
- **真增建自证命令**：
  ```bash
  diff exercises/m0/solution/types.ts exercises/m1/solution/types.ts   # 只见 JSONL 事件类型新增段，其余同
  diff -r <m0/solution 去掉 session/compress/policy 后> <m1/solution>   # 只见 M1 新增
  ```

## 6. README 七段（M1 按 style-guide §5 模板填）

1. 定位：把 my-agent 从「单工具最小 loop」长成「多工具 + 会话恢复 + 压缩 + 权限门」的多轮 agent。
2. 要加的能力：`m1.1` 检索打分排序 + 多工具分发 / `m1.2` token 压缩 / `m1.3` JSONL 会话 / `m1.4` 默认 deny 权限门。
3. 必修课：harness-from-scratch（后段恢复/压缩/多工具）· agent-harness（分层）· rag（检索=打分排序）· system-design（收口）。
4. 练习：`npm run assert:m1`（先红）→ 补 §2 四个 TODO → `npm run assert:m1` 全绿。
5. TODO 清单：四行表（编号 / 文件 / 函数 / 要求），与 exercise §3 一致。
6. 断言命令：`npm run assert:m1` 末端 `✅ m1 验收通过`（exit 0，连跑两次 diff 空）。
7. 参考答案指针：切片答案 harness-demo（tools.ts 注册/分发、context.ts 压缩、session.ts 会话、policy.ts 权限门）+ rag-demo bm25.ts 打分排序（见 exercise §5）；主线答案 `../solution/`。

## 7. 建骨架自检（wei 完成后跑一次）

- [ ] `npm run assert:m1`（starter）exit ≠ 0，四条 `❌ m1.x 未实现`，末行 `❌ m1 验收通过`；
- [ ] 补全 solution 后 `npm run assert:m1:solution` exit 0，四条 `✅` + 末行 `✅ m1 验收通过`；
- [ ] `npm run demo:m1`（po solution）打印最终回答含 `检索结果：BM25`；
- [ ] 连跑两次 `assert:m1:solution` 输出 `diff` 空（可重放）；`npx tsc --noEmit`（strict）0 错；
- [ ] `diff exercises/m0/solution/types.ts exercises/m1/solution/types.ts` 只多 JSONL 事件段（继承证据）；`git tag m1` + `git diff m0 m1` 只见 M1 新增；
- [ ] 无 `Date.now`/`Math.random`/`pid`/`fetch`/跨目录 import；压缩摘要确定性（无真实 LLM 调用）。