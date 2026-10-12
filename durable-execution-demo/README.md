# durable-execution-demo — durable execution §S7 作品：durable 任务 runner

全离线确定性的 TS durable 任务 runner：**不调模型、不联网、不用墙钟**。
任务 = 多步混合（只读×2 + 幂等写×1 + 非幂等"发消息"×1，mock 外部服务），
用 `process.kill(process.pid,'SIGKILL')` 在三种崩溃点**真实自杀**再重启恢复，
用"3 种崩溃点 × 各跑 3 次、副作用计数恒=1"这个可证伪的标准验收。

## 跑法

```bash
cd durable-execution-demo
npm i            # 本机 NODE_ENV=production 会让 npm 跳过 devDeps，
                 # 所以 tsx/typescript 放在 dependencies（可运行 demo 就是本作品的运行时）
npm run demo     # 验收矩阵：3 崩溃点 × 各 3 次（每次清 .state：先崩溃运行 → 再 resume 运行）
npm run demo:one # 单点单次：--crash=B --runs=1，看完整崩溃/恢复轨迹
npm run typecheck  # tsc --noEmit
```

`npm run demo` 末尾的 `✅ durable 验收通过：3 崩溃点 × 各 3 次，副作用计数恒=1` 即 S7 验收。
退出码 0/1 与这行一致（断言失败 → 1），可直接进 CI。

崩溃运行与 resume 运行也可以手工分步复现：

```bash
rm -rf .state && npx tsx src/worker.ts --mode=crash --crash=C   # 跑到注入点自杀（退出码被 SIGKILL 打死）
npx tsx src/worker.ts --mode=resume                             # 重启恢复，打印恢复报告
```

## 运行产物（`.state/`，可随时 `rm -rf` 重来）

| 文件 | 内容 |
|---|---|
| `journal.jsonl` | 唯一事实源：每步 `intent` → `exec` 双记录（细粒度，S2 机制 1） |
| `checkpoint.json` | 每 2 步的快照 + 校验和（粗粒度，S2 机制 2；毒快照 → 退回全量重放） |
| `idempotency.json` | 幂等写 key→结果（持久层，不是进程内存里的 Set，S4 反例） |
| `mock-service/ledger.jsonl` | **外部世界**的消息账本：副作用计数的唯一依据 |
| `mock-db/rows.json` | **外部世界**的业务库：幂等写的落点（upsert by key 收敛） |

## 与 durable execution（notes/durable-execution.md）的对应

| 课程 | 实现 |
|---|---|
| **S2** 三个核心机制 | `src/state.ts`（journal 同步 append + checkpoint 原子写 + 幂等存储）；`src/runner.ts` 每步 intent→exec、每 2 步 checkpoint |
| **S3** 重放的确定性 | `src/recover.ts` `analyze`：已记录的 exec → 读历史结果不重做；非幂等 unknown → 只读问外部服务再决定（LLM 调用在 agent 版里同样是"读历史不重调"） |
| **S4** 工具三分法 | `StepKind = readonly / idempotent / nonidempotent`（`src/types.ts`）+ `src/plan.ts` 的 4 步混合计划 |
| **S4** 三种崩溃注入点 | `src/runner.ts` `injectCrash`：A intent 前 / B intent 后 exec 前 / C exec 后未落盘，全部走 `process.kill(process.pid,'SIGKILL')` |
| **S7** 验收 | `src/demo.ts` 矩阵 = 3 崩溃点 × 3 次；断言副作用计数恒=1、恢复报告跨次逐字节一致（sha256）、处置符合预期表 |
| **S8.2** 逐行判定规则 | `src/recover.ts` `analyze` 的判定表（无 intent→replay / exec 在→skip / 只读→replay / 幂等写→replay / 非幂等 unknown→confirm） |
| **S9.1 #2** 毒快照 | `writeJsonAtomic`（临时文件 + rename）+ `readCheckpoint` 校验和失败即当无快照 |
| **S9.1 #7** 未知状态不当失败 | 非幂等步 intent 在 exec 缺时**不盲重放**，先只读问 mock 服务；已送达→skip，未送达→exec |

## 设计决策（与课程规格的取舍）

- **崩溃点只打在非幂等"发消息"步上**：三种崩溃点的难度差异（S4 状态图）正是由这一步放大的——
  只读/幂等步崩了都能安全重放，只有它需要 unknown→confirm。判定表其余分支由
  `src/selftest.ts` 用合成 journal 状态覆盖（demo 第三节的规则自检表）。
- **mock 服务端不去重**：`deliver` 按原样落账本（真实队列的 at-least-once 语义）。如果服务端
  顺手去重，"计数恒=1"就变成恒真的废话；不去重时，盲重放会让计数变 2（已实测：把
  `analyze` 里的 confirm 改成盲重放，崩溃点 C 立刻 `副作用=2 ❌` 且退出码 1）。
- **幂等键同时进 journal intent 和外部请求**：恢复时用 journal 里的 key 去问外部服务
  （"这个 key 送达过吗"），而不是问自己——本地层在崩溃点 C 恰好是缺的，这正是 S4
  "幂等 key 必须落在外部世界能看到的持久层"的实证。
- **逻辑时钟**：步序号 + journal `seq` 替代 `Date.now()`；消息 id 由账本行号派生
  （`msg-0001`）。所以恢复报告里没有任何时间戳/pid/随机量，跨次可逐字节比对。
- **同步 IO**：journal 用 `appendFileSync`、stdout 用 `writeSync(1, …)`——`console.log` 走管道是
  异步的，`SIGKILL` 会把没 flush 的日志吞掉（实测踩到）。
- **崩溃运行经 `node --import tsx` 起子进程**：这样 `process.pid` 就是 Worker 自己，
  SIGKILL 直接落在它身上（父进程收到 `signal=SIGKILL`，而不是 tsx CLI 转手的 `exit=137`）。

## src 文件

| 文件 | 职责 |
|---|---|
| `types.ts` | StepKind/CrashPoint/Disposition、StepSpec、JournalEvent、Checkpoint、RecoveryReport |
| `state.ts` | 持久层：journal 同步 append + 撕裂行容错、checkpoint 原子写 + 校验和、幂等存储、canonical JSON + sha256 |
| `external.ts` | mock 外部世界：消息队列（ledger/deliver/lookup）+ 业务库（upsert/get） |
| `plan.ts` | 4 步混合任务计划 + 三种崩溃注入点定义与预期处置 |
| `runner.ts` | DurableRunner：正常运行（intent→exec→checkpoint）+ 崩溃注入器 `injectCrash` |
| `recover.ts` | 恢复器：`analyze`（纯判定表，S8.2）+ `runRecovery`（按判定执行并产出恢复报告） |
| `selftest.ts` | 处置规则自检：合成 journal 状态跑遍 S3 决策树全分支 |
| `worker.ts` | 单次运行子进程入口（`--mode=crash --crash=A|B|C` / `--mode=resume`） |
| `demo.ts` | 入口：任务计划 + 崩溃点 + 规则自检 + 3×3 验收矩阵 + 断言 |
