# sandbox-demo — E 课 S2 作品：四通道 policy 引擎 + 幽灵事故重放

全离线确定性的 TS 迷你沙箱：**不调模型、不联网、不碰真实 FS、不用墙钟**。
把 FinHot 2026-10-09 幽灵事故重建成可重放剧本，用确定性问题证明"沙箱层的位置"，
并验收重放的逐字节可复现（S6）。

## 跑法

```bash
cd sandbox-demo
npm i            # 本机 NODE_ENV=production 会让 npm 跳过 devDeps，
                 # 所以 tsx/typescript 放在 dependencies（可运行 demo 就是本作品的运行时）
npm run demo     # 完整场景：① 四通道 policy 判定流 ② 沙箱边界 ③ 幽灵事故重放 + 确定性验收
npm run typecheck  # tsc --noEmit
```

`npm run demo` 末尾的 `✅ 重放一致性断言通过` 即 S6 验收（同一剧本各跑 3 次，转录逐字节相同）。

## 与 E 课（notes/sandbox.md）的对应

| 课程 | 实现 |
|---|---|
| **S1** 权限门 ≠ 沙箱（两道独立的门） | `src/policy.ts`（意图门）+ `src/sandbox.ts`（执行环境边界）；demo 第二节 [II-1]：`read_file ../../etc/passwd` 被权限门放行（allow）、被沙箱拦截（路径越界） |
| **S2** 四通道 policy 引擎 | `src/policy.ts` `Policy.decide`：allow/approve/deny/sandbox，冲突 `deny > approve > sandbox > allow`，默认 deny；approve 离线 = 预置审批表 `makeApprover` + `scenario.ts` `APPROVAL_TABLE` |
| **S2** ghost replay（事故重建成可重放剧本） | `src/scenario.ts` `GHOST_SCRIPT`（错误目录 compose → build → up → 生产容器被换）+ `src/replay.ts` `runScript`；demo 第三节 A（仅权限门，复现事故）vs B（四通道+沙箱，生产安全） |
| **S3** 隔离谱系 / egress 最难关 | `SandboxConfig.network: "deny"` + `Sandbox.openNetwork` 断言（demo 第二节 [II-3]）；注释标注"进程级 + 默认关边界"选型 |
| **S4** 凭据与 env | `Sandbox.env` 白名单 + `print_env` 工具（无沙箱时整个 env 可见、含凭据）+ `HOST_ENV`（FinHot 根目录 .env = 凭据面过大） |
| **S5** 审计底账 | `World.log` 状态变更日志 + 转录里每条 policy 判定（demo 第三节的"状态日志(ns=…)"行） |
| **S6** 可复现性 | `src/replay.ts` `assertDeterministic`（golden diff + sha256）；逻辑时钟（步序号）替代 `Date.now()`；`package-lock.json` 锁依赖 |

## 设计决策（与课程规格的取舍）

- **四通道冲突顺序**：课程 S2 定义了四通道但未给冲突优先级。本实现由 A⑤ 的
  `deny > approve > allow` 扩展：sandbox 是"更受限的执行方式"，插在 approve 与 allow 之间
  （隔离更多者优先，安全默认）。
- **sandbox 通道 = 隔离命名空间执行**：`World.ns` 隔离世界视图（`makeSandboxWorld`）——
  被沙箱化的会话 build/up 只影响自己的容器命名空间，生产容器不可见。
  对应事故归因："缺的是执行环境边界：哪个 compose 项目、哪个目录树、哪个命名空间"。
- **重放 = golden 对比**：每次运行重建全新 `World`（无跨运行状态），第 1 次输出为 golden，
  第 2/3 次逐字节 diff + sha256 打印。
- **check_container**：模拟事故后长出的运维规则"动生产容器前查容器创建时间"
  （S5：沙箱化前是事后校验规则、之后降级为双保险）。

## src 文件

| 文件 | 职责 |
|---|---|
| `types.ts` | Channel/Rule/Verdict/ToolCall/SandboxConfig + ToolError/BoundaryViolation |
| `policy.ts` | 四通道 policy 引擎 + 预置审批表 |
| `sandbox.ts` | 内存 World（FS/容器/env，逻辑时钟）+ 路径/env/网络三条边界 |
| `tools.ts` | 8 个确定性 mock 工具（read/write/print_env/net_fetch/run_shell/compose build/up/check_container） |
| `scenario.ts` | 幽灵事故剧本 + 两套 policy（仅权限门 / 四通道）+ 审批表 + 宿主 env |
| `replay.ts` | 剧本重放 → 转录 + N 次确定性验收 |
| `demo.ts` | 入口：判定流 + 边界 + 重放 + 验收 |
