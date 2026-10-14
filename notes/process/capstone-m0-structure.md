# M0 · minimal-loop 代码结构清单（capstone-m0-structure，写给 wei 直接建文件）

> 按 `notes/capstone-m0-exercise.md` 落地 `my-agent/` 的 M0 目标目录结构与每文件职责。这是「建骨架」清单，不含补全后的业务代码（TODO 体由 wei 填 `TODOError` 占位，solution 由 wei 按 exercise §3 补全）。命名/协议已与 `capstone-blueprint.md` §7 + `capstone-style-guide.md` 对齐。

## 1. 目标目录结构（M0 阶段）

```
my-agent/
  README.md                # 七段（见 §6）
  package.json             # tsx + typescript（devDeps），scripts 见 §2
  tsconfig.json            # strict + NodeNext，noEmit（tsx 直接跑）
  assert/
    m0.assert.ts           # 断言（跑 starter 红 / solution 绿，见 §4）
  exercises/
    m0/
      starter/             # 学员起点（types/model/tools 给全；loop 挖 3 处 TODO）
        types.ts
        model.ts           # 确定性 mock 模型（给全）
        tools.ts           # 单工具 read_file + registry + callTool（给全）
        loop.ts            # 半成品：骨架给全、挖 m0.1/m0.2/m0.3
      solution/            # 参考答案（loop.ts 补全后；其余同 starter）
        types.ts
        model.ts
        tools.ts
        loop.ts
```

- **M0 不建 `my-agent/src/`**：`src/` 是「主线真源」的累计目录，M1 起才承接（M1 会在 `m0/solution` 上真·增建，届时 `src/` = 主线累计真源）。M0 阶段只有 `exercises/m0/{starter,solution}` + `assert/` + 顶层三件。
- 祖先关系：M0 无上一 milestone，`starter/README` 第一行写「本 starter 是主线 my-agent 的起点（无上一 milestone）」；后续 M1 的 `starter` 继承 `m0/solution`。

## 2. package.json / tsconfig.json

```jsonc
// package.json
{
  "name": "my-agent",
  "private": true,
  "type": "module",
  "scripts": {
    "demo": "tsx exercises/m0/starter/loop.ts",
    "assert:m0": "tsx assert/m0.assert.ts",
    "assert:m0:solution": "tsx assert/m0.assert.ts solution"
  },
  "devDependencies": { "tsx": "^4.20.0", "typescript": "^5.6.0" }
}
```

```jsonc
// tsconfig.json（strict + NodeNext，noEmit）
{
  "compilerOptions": {
    "target": "ES2022", "module": "NodeNext", "moduleResolution": "NodeNext",
    "strict": true, "noEmit": true, "skipLibCheck": true,
    "esModuleInterop": true, "forceConsistentCasingInFileNames": true
  },
  "include": ["exercises", "assert"]
}
```

- 三条断言命令：`assert:m0`（跑 starter，补全前必红）、`assert:m0:solution`（跑 solution，必绿——证断言可达）、`demo`（跑通想→做→说）。零外部依赖，tsx 直接跑。

## 3. 每文件职责 + TODO 位置标注

### 3.1 `types.ts`（给全）

```ts
export interface ToolCall { id: string; name: string; arguments: Record<string, unknown>; }
export type Message =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; name: string; content: string };
export interface ToolSpec {
  name: string; description: string;
  parameters: Record<string, unknown>; readonly?: boolean;
  execute(args: Record<string, unknown>): Promise<string>;
}
/** m0.1 的产物：解析后的「下一步动作」两种形态 */
export type Action =
  | { kind: "tool_call"; name: string; args: Record<string, unknown> }
  | { kind: "deliver"; content: string };
```

### 3.2 `model.ts`（给全，确定性底座）

职责：**确定性 mock 模型** `mockModel(messages: Message[]): string`，返回一段 JSON 字符串（由学员的 `parseModelReply` 解析）。

确定性脚本逻辑（无随机/墙钟）：
- 若 `messages` 里**已有** `role === "tool"` 的消息 → 返回 `{"deliver":"notes/hello.txt 的内容是：hello from my-agent"}`；
- 否则 → 返回 `{"tool_call":{"name":"read_file","arguments":{"path":"notes/hello.txt"}}}`。

这样「读 notes/hello.txt」走 `想(read_file) → 做(回填) → 想(deliver) → 说`，正好 1 次工具调用，可断言。

```ts
export function mockModel(messages: Message[]): string {
  const sawTool = messages.some((m) => m.role === "tool");
  if (sawTool) return JSON.stringify({ deliver: "notes/hello.txt 的内容是：hello from my-agent" });
  return JSON.stringify({ tool_call: { name: "read_file", arguments: { path: "notes/hello.txt" } } });
}
```

### 3.3 `tools.ts`（给全，工具协议底座）

职责：单工具 `read_file` 的注册表 + 执行。read_file 返回**内置固定内容**（不读真实文件系统，保证确定性 + 零 fs 依赖）。

```ts
export function buildRegistry(): Map<string, ToolSpec> {
  const read_file: ToolSpec = {
    name: "read_file",
    description: "读取一个文件（demo：返回内置固定内容）",
    readonly: true,
    parameters: { type: "object", properties: { path: { type: "string", description: "文件路径" } }, required: ["path"] },
    execute: async () => "hello from my-agent",
  };
  return new Map([[read_file.name, read_file]]);
}
export async function callTool(registry: Map<string, ToolSpec>, name: string, args: Record<string, unknown>): Promise<string> {
  const spec = registry.get(name);
  if (!spec) throw new Error(`未知工具: ${name}`);
  return await spec.execute(args ?? {});
}
```

（M0 刻意不照搬 harness-demo 的 `validateArgs`/`scoped()` 全套——参数校验与路径范围控制是 M1/M2 的机制，M0 只保留「查注册表 + 执行 + 未知工具抛错」的最小协议；参考指针见 exercise §5。）

### 3.4 `loop.ts`（半成品，挖 3 处 TODO）—— TODO 位置标注

```ts
// 学员补全区（三处 TODO；体是 throw new TODOError('m0.x: …')）
export function parseModelReply(raw: string): Action {
  // TODO m0.1：JSON.parse(raw)，判别并校验成 Action（tool_call / deliver 两种形状之一），否则抛错
  throw new TODOError("m0.1: 把模型 JSON 回复解析成 tool_call 或 deliver 动作");
}
export async function executeAndBackfill(messages: Message[], tc: ToolCall): Promise<Message[]> {
  // TODO m0.2：callTool(registry, tc.name, tc.arguments) 执行，把结果作为 {role:'tool',…} 回写 messages 副本并返回
  throw new TODOError("m0.2: 执行工具并把结果回填 message");
}
export async function runLoop(prompt: string, maxSteps = 3): Promise<string> {
  // TODO m0.3：messages=[system,user]；循环：mockModel→parseModelReply→tool_call 则 executeAndBackfill 再想、deliver 则收口；超 maxSteps 抛错
  throw new TODOError("m0.3: 组装想→做→说 loop 并收口");
}
```

- **给全（不挖）**：`TODOError` 类（本文件顶部或单列）、`const registry = buildRegistry()`、以及一个 `main()`（读 `process.argv[2] ?? '读 notes/hello.txt 的内容'` 调 `runLoop` 打印最终回答，供 `npm run demo`）。这三样是骨架/底座，不是 M0 新增业务。
- **TODO 位置**：三处都挖在 `loop.ts` 的这三个函数体上；`m0.1`/`m0.2`/`m0.3` 编号与 exercise §3 表一致。

## 4. 断言文件怎么组织（`assert/m0.assert.ts`）

```ts
// assert/m0.assert.ts（跑 starter 红 / solution 绿，由 argv 切目标）
const target = process.argv[2] === "solution" ? "solution" : "starter";
const { parseModelReply, executeAndBackfill, runLoop } = await import(
  `../exercises/m0/${target}/loop.ts`
);
const { buildRegistry } = await import(`../exercises/m0/${target}/tools.ts`);

function expect(cond: boolean, tag: string, detail?: string) {
  console.log(cond ? `✅ ${tag}` : `❌ ${tag} ${detail ?? ""}`);
  if (!cond) process.exitCode = 1;
}
function guard<T>(tag: string, fn: () => T): T | undefined {
  try { return fn(); } catch (e) {
    if (e instanceof TODOError) { expect(false, tag, "未实现"); return undefined; }
    throw e;
  }
}

// a1 解析判别
const tc = guard("m0.1 解析", () => parseModelReply('{"tool_call":{"name":"read_file","arguments":{"path":"notes/hello.txt"}}}'));
expect(tc?.kind === "tool_call" && tc.name === "read_file", "m0.1 解析", "tool_call 形状");
// a2 执行回填
// a3 loop 收口（toolCalls 计数经 debug 导出或 runLoop 内部计数）
// 末行：assertPassed() ? console.log("✅ m0 验收通过") : console.log("❌ m0 验收通过");
```

- **断言组织**：一个 assert 文件跑一个 milestone（`assert/m0.assert.ts`），用 `process.argv[2]` 切换 starter/solution（动态 import 消除两套入口脚本），`demo`/`assert:m0`/`assert:m0:solution` 三条 script 覆盖「半成品红 → 补全绿 → 参考答案绿」三分。
- **可重放**：末行验收 + exit code（`process.exitCode = 1` on any ❌）；wei 建完后自测 `npm run assert:m0:solution` exit 0 且连跑两次 `diff` 空。
- **确定性命中**：断言只依赖预置 JSON 串 + `buildRegistry()` 的内置内容，无随机/墙钟/fs/网络。

## 5. solutions 怎么放

- `exercises/m0/solution/{types,model,tools,loop}.ts`：`types/model/tools` **逐字节同 starter**（给全部分不变）；`loop.ts` = 补全后的三个函数（不再 `throw TODOError`），`main()` 可跑通 `npm run demo`。
- **真增建证据（M0→M1）**：M1 的 `starter` = `m0/solution` 冻结 + 剪除 M1 新增能力（M1 起各 milestone 如此；M0 作为起点无上一版）。
- **核对**：`diff -r exercises/m0/solution/types.ts exercises/m0/starter/types.ts` 空；`diff -r <solution 其余给全文件>` 空；`loop.ts` 只在三个函数体内有差异。

## 6. README 七段（M0 按 style-guide §5 模板填）

1. 定位：把 my-agent 从「无」长成「单工具最小 loop（想→做→说）」。
2. 要加的能力：`m0.1` 解析 / `m0.2` 执行回填 / `m0.3` loop 组装收口。
3. 必修课：`harness-from-scratch`（loop / 工具协议，前段）。
4. 练习：`npm run assert:m0`（先红）→ 补全 §2 三个 TODO → 再跑全绿。
5. TODO 清单：三行表（编号 / 文件 / 函数 / 要求），与 exercise §3 一致。
6. 断言命令：`npm run assert:m0` 末端 `✅ m0 验收通过`（exit 0，连跑两次 diff 空）。
7. 参考答案指针：切片答案 `harness-demo/src/agent.ts` 的 `runAgent` / `guardedToolStep` + `tools.ts` 的 `callTool`/`buildRegistry`（file+function，见 exercise §5）；主线答案 `../solution/`。

## 7. 建骨架自检（wei 完成后跑一次）

- [ ] `npm run assert:m0`（starter）exit ≠ 0，三条 `❌ m0.x 未实现`，末行 `❌ m0 验收通过`；
- [ ] 补全 solution 后 `npm run assert:m0:solution` exit 0，三条 `✅` + 末行 `✅ m0 验收通过`；
- [ ] `npm run demo`（po solution）打印最终回答含 `hello from my-agent`；
- [ ] 连跑两次 `assert:m0:solution` 输出 `diff` 空（可重放）；`npx tsc --noEmit`（strict）0 错；
- [ ] 无 `Date.now`/`Math.random`/`pid`/`fetch`/跨目录 import（M0 全离线零 key）。