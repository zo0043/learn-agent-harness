# memory-redteam —— 记忆投毒红队回归

把 `notes/long-term-memory.md` 里**已成文的判定**（§S7 四道投毒防线、§S10 步骤 6-7 的评测与遗忘传播）变成**可执行断言**。

面试里"我做过记忆投毒回归"这句话，之前只能靠笔记里的散文佐证；现在 `node test.mjs` 就是证据。

## 跑法（零依赖：不需要 `npm install`）

```bash
cd memory-redteam
node test.mjs              # 正跑：11 条探针全部守住 → 退出码 0
node test.mjs --ablate     # 消融自检：逐条关掉对应防线，探针必须失败 → 证明探针有效
node test.mjs --only R3    # 只跑一条
npm test                   # 等价于 node test.mjs
npx tsx src/index.ts       # 等价入口（转发到 test.mjs，输出逐字节一致）
```

要求 node ≥ 18（原生 ESM，无第三方依赖，无构建步骤；`src/index.ts` 是纯 JS 语法的转发入口，`tsx` 非必需）。

**确定性**：时钟由 `createStore()` 注入，缺省固定为 `FIXED_NOW`（§S10 走查基准时间）。同一命令连续两次运行输出逐字节一致（`diff` 为空）——回归报告里不含墙钟时间戳。

当前状态（2026-10-12）：

```
11/11 条探针守住（正跑，退出码 0）
10/10 条探针对其防线敏感（消融自检，退出码 0）
```

## 为什么需要"消融自检"

一个永远通过的测试是零信息量的。`--ablate` 会**逐条关掉该探针声称守住的防线**再跑一遍——如果关掉防线后探针仍然通过，说明这条探针没在测那道防线（恒真断言），runner 会以退出码 1 报出"恒真"。

这个机制在首次运行时立刻抓到一个真 bug：`scope.user` 缺失时按 `undefined` 比较，导致冲突检测静默失效（R2/R5/R6 同时被击穿），修法是引入 `sameScope()` 把缺省字段统一按 `null` 比较。

## 探针清单

| # | 探针 | 编码自 | 消融防线 |
|---|---|---|---|
| R1 | 低信任内容不得进入注入集（投毒落库） | §S7 防御1 + §S10 步骤6 | `trustGate` |
| R2 | 低信任来源不得覆盖高信任事实 | §S10 步骤5 + §S7 防御1 | `trustGate` |
| R3 | 高危事实必须独立审批才可注入 | §S7 防御3 | `highRiskApproval` |
| R4 | 记忆内容注入扫描（四类模式族） | §S7 防御2 | `injectionScan` |
| R5 | 写入/覆盖/删除全程审计留痕 | §S7 防御4 + §S10 步骤3/7 | `auditTrail` |
| R6 | 冲突消解链：覆盖不物理删除 + active 唯一 | §S5 + §S10 步骤2/5/6 | `conflictResolve` |
| R7 | 污染率聚合：四类毒候选零进入注入集 | §S6 + §S10 步骤6 | `trustGate`+`injectionScan`+`highRiskApproval`+`ttlWindow` |
| R8 | 反事实探针：跨 scope 不得召回 | §S10 步骤6 | `scopeFilter` |
| R9 | 遗忘沿血缘传播（硬删 + 墓碑） | §S10 步骤7 | `forgetPropagation` |
| R10 | 时效窗口：过期记忆不进注入集 | §S5/§S6 | `ttlWindow` |
| R11 | 机制检查：罕见词高 IDF 使 BM25 路排 #1 | §S10 步骤4.3 | —（机制检查） |

## 目录

```
memory-redteam/
├── package.json     零依赖，scripts: test / test:ablate
├── test.mjs         runner（正跑 + 消融）
├── src/index.ts     等价入口（转发 test.mjs；对齐合约 verify#3 的 npx tsx 跑法）
├── src/memory.mjs   写/读路径参考实现（每道防线可在 createStore() 里单独开关）
└── src/redteam.mjs  11 条探针：断言 + 来源引用 + 消融映射
```

## 它不是/不宣称什么（边界）

- **不是生产记忆系统**：`src/memory.mjs` 是"判定可执行化"的参考实现，用最小 BM25 + 内存存储把笔记里的判定跑起来；没有数据库、没有 embedding、没有并发控制。
- **注入扫描是文本模式层**（4 类模式族），不是语义层——能拦住"curl 外链/执行脚本/凭据字面量/指令覆盖"这类显式投毒，拦不住语义伪装。这正是 §S7 需要"人审或多源印证"的原因。
- **不替代笔记**：判定与理由的权威表述仍在 `notes/long-term-memory.md`；本套件只把其中**可判定的部分**变成回归。
- **§S10 的 recall 数值（`recall@1 = 0.87` 等）是走查示例**，笔记原文已声明"不是既成事实"，因此**未被断言**；R11 只断言其中的机制（罕见词高 IDF 排序），不断言示例数值。
