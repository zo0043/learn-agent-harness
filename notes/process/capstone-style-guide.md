# 增量主线施工规范（capstone-style-guide）

> 主线 `my-agent` 的施工规范（供造 practice 的后续任务照此执行）。总原则与 `notes/process/teaching-style-guide.md` 一致：**每个结论落到一个可复现判据**；主线特有的增量约束是——**每 milestone 在上一 milestone 的代码上真·增建，复用的是学员自己写的**。

## 1. 里程碑命名与切分规则

- **命名**：工号键用小写 `m0`…`m4`（目录 / 断言命令用小写），展示名用大写——五档固定为 `m0 minimal-loop` / `m1 multi-tool-session` / `m2 sandbox-mcp-eval` / `m3 durable-api-obs` / `m4 memory-flywheel-model`（与 `notes/process/capstone-blueprint.md` §3 映射表逐字一致，两处不得漂移）。
- **切分口径**：一阶段一个 milestone（不是一课一个）；`m0`/`m1` 同属 P0，按「增建能力单元」切——`m0` = 单工具最小 loop，`m1` = 多工具 + 会话 + 压缩（`m0` 是 `m1` 的地基）。
- **切分红线**：一个 milestone 新增的能力必须**来自该阶段的课**（机制归属硬绑定，见映射表）；不得把下阶段机制提前塞进本 milestone（避免「练习炸碎 / 依赖错位」）。
- **命名冲突**：断言、TODO、README 里出现的 milestone key 用小写单数 `m0`，示例命令 `npm run assert:m0`；不出现 `M0`（大写）作为文件系统路径或脚本参数。

## 2. 半成品「留 TODO」vs「给全」的判据

| 代码类别 | 处理 | 例子 |
|---|---|---|
| **本 milestone 要新增的机制** | 剪除函数体，留 `throw new TODOError('m<N>.<k>: …')` | M1 的 `compress()` 体剪成 TODOError，签名保留 |
| **上一 milestone 已建成的机制** | 全量给全（作地基，永不挖） | M1 的 `loop.ts`（M0 已建）原样保留 |
| **跨 milestone 的公共类型 / mock 底座** | 给全（属于「确定性底座」，非本 milestone 新增业务） | `model.ts` 预置表、`types.ts` |
| **纯配置 / 常量（golden 样本、PRICE 表）** | 给全 + 本 milestone 只新增「本 milestone 的业务逻辑」 | M2 的 `golden/` 样本给全，`eval.ts` 的 judge 校准留 TODO |

**判据一句话**：问「这块是不是 *本 milestone* 新增的能力？」是 → 留 TODO；不是（地基 / 底座 / 上一版成果）→ 给全。

## 3. 断言怎么写（确定性 / 可机器核对 / 可重放）

沿 `teaching-style-guide.md` §5/§6，补一条主线的**半成品三分**：

1. **确定性**：输入全部预置常量或 mock 预测表，逻辑时钟，无 `Date.now` / `Math.random` / `pid` / 墙钟；同一输入 → 同一输出。
2. **可机器核对**：每条断言一个编号 `m<N>.<k>`，各自打印 `✅` / `❌`；milestone 末行 `✅ m<N> 验收通过`。断言用「存根函数抛 TODOError → 断言捕获 → 判未实现」表达半成品红态。
3. **可重放**：补全前后各跑两次，`diff` 空 = 逐字节一致。clone 判据给「断言打印行 + `node ≥ 18`」，**不给会漂移的具体 hash/digest 数值**。

```ts
// assert/m1.assert.ts 骨架（示意；TODO 编号与 README TODO 清单一一对应）
import { runLoop } from '../exercises/m1/starter/loop';
function expect(cond: boolean, tag: string, detail?: string) {
  console.log(cond ? `✅ ${tag}` : `❌ ${tag} ${detail ?? ''}`);
  if (!cond) process.exitCode = 1;
}
try { runLoop({ input: '读 notes/a.md 前 3 行' }); expect(true, 'm1.1 多工具分发'); }
catch (e) { if (e instanceof TODOError) expect(false, 'm1.1 多工具分发', '未实现'); else throw e; }
// … 最后一行由 orchestrator 统一打印 ✅ m1 验收通过 / ❌
```

- **半成品红**：starter 里 `TODOError` 被断言捕获 → `❌ m<N>.<k> 未实现` → 末行 `❌ m<N> 验收通过`（exit ≠ 0）。
- **补全绿**：学员改 starter 补全 → 断言转绿。
- **参考答案绿**：solution 跑同断言 → 绿（证断言可达，不是永远红的假断言）。

## 4. 参考答案怎么组织（指向现有 demo vs 主线自带 solution）

| 参考答案来源 | 时机 | 指向 |
|---|---|---|
| **现有 17 demo** | 「这课给主线这一步供了哪个机制」的教学挂钩 | 指到 demo 具体文件 / 函数（如「参考 harness-demo/src 的 loop 段」，标文件 + 函数名，不整段复制进主线）|
| **主线自带 `exercises/m<N>/solution/`** | 学员补全后对照 | `solution` = 本 milestone 完成态（== 主线 `src/` 该 milestone freeze），是「主线视角的正确答案」|

**分工**：现有 demo 回答「这个能力长什么样、要点是什么」（切片答案）；主线 `solution` 回答「在 `my-agent` 这条线里，这一步该长成什么样」（增量答案）。二者并存，不互相替代。README 的「参考答案指针」两列都写：先指 demo 哪段，再指 `solution` 路径。

## 5. 每 milestone 的 README 结构（固定七段）

```markdown
# M1 · multi-tool-session（多工具 + 会话 + 压缩）
> 本 starter 继承自 ../m0/solution（上一 milestone 完成态）；本 milestone 需补全的能力见 §4 TODO 清单。

## 1. 定位
把 my-agent 从「单工具最小 loop」长成「多工具 + 会话恢复 + 上下文压缩」的多轮 agent。

## 2. 要加的能力（每条 = 一个 TODO）
- m1.1 多工具命名分发：工具表 { name → handler }，model 指 name 即执行对应 handler。
- m1.2 token 压缩：超过窗口下限，按「摘要 + 尾部原样」裁剪。
- m1.3 JSONL 会话：intent→exec 写日志，重启读日志续跑。
- m1.4 默认 deny 权限门：工具白名单外的调用一律拒绝（第一道门）。

## 3. 必修课（机制来源，节号以 notes/*.md 实际为准）
harness-from-scratch（后段恢复/压缩/多工具）· agent-harness（分层）· rag（检索=打分排序）· system-design（收口）

## 4. 练习
cd ../starter && npm run assert:m1   # 半成品：断言红（TODOError）
# 补全 §2 的 TODO 后：
npm run assert:m1                    # 期望：全绿 + 末行 ✅ m1 验收通过
npm run assert:m1 && npm run assert:m1  # 连跑两次 diff 空 = 可重放

## 5. TODO 清单
| 编号 | 文件 | 函数 | 要求 |
|---|---|---|---|
| m1.1 | src/tools/index.ts | dispatch() | 工具表查 name，未知丢给权限门 |
| … | … | … | … |

## 6. 断言命令
npm run assert:m1 → 期望末行 `✅ m1 验收通过`（exit 0，连跑两次逐字节一致）

## 7. 参考答案指针
- 切片答案：harness-demo/src（loop / 工具 / 会话段）、rag-demo（打分排序）。
- 主线答案：../solution/（本 milestone 完成态）。
```

## 6. 施工检查清单（每 milestone 收尾自检）

- [ ] 命名与 `capstone-blueprint.md` §3 一致（`m<N>` 小写键 / 展示名 / 阶段 / 增建能力 / 必修课 / 参考答案 demo 六栏齐全）；
- [ ] starter 继承 `m<N-1>/solution`（祖先关系写在 README 第一行），`git diff m<N-1> m<N>` 只含本 milestone 新增机制；
- [ ] 半成品剪除只挖「本 milestone 新增能力」，地基 / 底座给全，TODO 用 `TODOError` 带编号占位（能编译、断言红）；
- [ ] 断言满足确定性 / 可机器核对 / 可重放三态，clone 判据不给会漂移的 hash；
- [ ] 半成品三分自测：starter 红 → 补全绿 → solution 绿（三者都实跑过）；
- [ ] README 七段齐全，TODO 清单与断言编号一一对应；
- [ ] `npm run assert:m<N>` exit 0 且连跑两次逐字节一致（`diff` 空）。