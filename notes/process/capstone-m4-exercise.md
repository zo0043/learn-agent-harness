# M4 · memory-flywheel-model 里程碑动手练习设计（capstone-m4-exercise）

> 主线 `my-agent` 的最后一个动手点：在 M3（可恢复 + 流式路由 + 可观测）上**真·增建**四类记忆 + 评测飞轮 + 模型意识 + 框架边界对照，把 my-agent 补成「多工具 / 多轮 / 带权限沙箱 / 可观测 / 可评测 / 可恢复 / 有记忆」的完整工具（blueprint §3 M4 行收口形态）。本设计严格套用 `notes/process/capstone-blueprint.md`（§3 M4 行 / §4）+ `notes/process/capstone-style-guide.md` + M0/M1/M2/M3 四份 exercise 模式；不重新设计 milestone 划分（captain 已定 M4=P3+P4 记忆+飞轮+模型意识+框架收口）。
> 对应必修课 = `long-term-memory`（四类记忆 / 投毒防线）+ `data-flywheel`（两轮降噪 / 门禁）+ `model-basics`（KV cache / 成本）+ `framework-ecosystem`（框架抽象边界）+ `industry-2026`（横向收口素材）；参考答案 demo = `memory-redteam` / `flywheel-demo` / `model-basics-demo` / `framework-demo`。

## 1. M4 要交付什么（一句话 + 收口形态）

**学员此刻手里有一个「多工具 / 多轮 / 带权限沙箱 / 可观测 / 可评测 / 可恢复 / 有记忆」的完整 my-agent**——在 M3 基础上新增：记忆（写/读/遗忘走四道投毒防线）、评测飞轮（label 两轮降噪 + 决策门禁禁 auto-apply）、模型意识（KV cache / 成本走查：该不该上更大模型 / 该不该微调）、框架边界对照（my-agent 对照 SDK 抽象边界，形成「我搭的 vs 框架给的」收口认知）。全程确定性、零 key、零外网（沿用 M0–M3 红线）。

## 2. 半成品与 TODO 切分（给全 vs 挖空）

按 style-guide §2。M4 新增 4 项能力，挖 4 个 TODO（每补全=一个 M4 机制）；M3 已交付的 durable/SSE/重试/路由/span 等底座照搬 `m3/solution`（逐字节继承，见 §7）。

| 文件 | 处理 | 理由 |
|---|---|---|
| `types.ts` | 给全（M3 类型 + 新 `MemoryItem`/`TrustLevel`/`MemoryStore`/`Decision`(auto-apply 禁)/`LedgerRow`/`Direction`/`ModelCogReport`） | 公共类型底座 |
| `model.ts` / `tools.ts` / `loop.ts` / `session.ts` / `compress.ts` / `policy.ts` / `sandbox.ts` / `mcp.ts` / `eval.ts` / `golden/` | 给全（loop 只加「工具执行前 recall 记忆 + 飞轮门禁止步提案」接线，判定挖下面） | M1/M2/M3 已建，地基不挖 |
| `durable.ts` / `stream.ts` / `retry.ts` / `router.ts` / `otel.ts` | 给全继承 M3 | M3 已建，不挖 |
| `memory.ts` | **半成品**（新建）：挖 `m4.1`（写读遗忘 + 四道投毒防线） | M4 新增：记忆 |
| `flywheel.ts` | **半成品**（新建）：挖 `m4.2`（label 两轮降噪 + 门禁禁 auto-apply） | M4 新增：评测飞轮 |
| `costwalk.ts` | **半成品**（新建）：挖 `m4.3`（KV cache / 成本走查） | M4 新增：模型意识 |
| `framework.ts` | **半成品**（新建）：挖 `m4.4`（框架边界对照 + allowedTools 抢跑对照） | M4 新增：框架收口 |

**核心闭环挖在四处**（对应任务「记忆写读检索+投毒防线、飞轮 label 降噪+门禁、模型意识成本走查、框架对照表」）：
- 四类记忆 + 四道投毒防线 → `m4.1`；
- 评测飞轮（label 两轮降噪 + 门禁）→ `m4.2`；
- 模型意识（KV/成本走查）→ `m4.3`；
- 框架边界对照（allowedTools 抢跑对照）→ `m4.4`。

## 3. 每个 TODO 的补全后预期行为 + 判定方式

| 编号 | 函数（在文件） | 补全后预期行为 | 判定方式 |
|---|---|---|---|
| `m4.1` | `write` / `recall` / `forget`（`memory.ts`） | 写：低信任候选须确认才提升、注入扫描 + 高危事实审批 + 冲突消解（同 scope/category 唯一 active）；读：scope 过滤 + 时效窗口 + 只注入「达阈值且过防线」的条目；忘：`forget` 落墓碑 + 沿血缘传播到派生物；四道投毒防线 = trustGate / injectionScan / highRiskApproval / auditTrail | 断言 a1：低信任候选不自动注入；跨 scope 反事实不召回；forget 沿血缘传到派生物；关掉任一防线 → 对应探针失败 |
| `m4.2` | `round` / `gate` / `curate`（`flywheel.ts`） | `round(from,to)` 强制「除 prompt_version 外其余字段逐项全同」否则抛错（只动 prompt）；`gate`：关键指标 f1 不降 && 目标 precision 显著升（>NOISE）→ propose、否则 reject，action 只有 propose/reject 无 apply（禁 auto-apply）；`curate`：去污染 + 去重 | 断言 a2：round 破坏「只动 prompt」抛错；gate 门禁 propose/reject 判定；决策止步于提案（无 auto-apply 态） |
| `m4.3` | `kvBytesPerToken` / `kvTotalBytes` / `withCacheDiscount` / `shouldScaleUp`（`costwalk.ts`） | KV 显存 = 2×layers×kv_heads×head_dim×bytes；总显存 = seqLen×perToken×concurrency；缓存折扣只动 prefill 命中段；`shouldScaleUp`：KV/单步成本/步数联合走查给出「不上更大模型」或「值得微调」的数值判断 | 断言 a3：kvBytesPerToken 估算正确、withCacheDiscount 只打 prefill、shouldScaleUp 输出带数值依据的模型决策 |
| `m4.4` | `COMPARE_TABLE` / `allowedToolsRaceCheck`（`framework.ts`） | 五维对照表（loop 归属 / 工具 schema 声明 / 权限 HITL 钩子 / 状态中断恢复 / 可观测钩子）把「我搭的 my-agent」对照三条 SDK；`allowedToolsRaceCheck`：裸名 auto-approve 抢在 canUseTool 之前 → 正确写法是「不把危险工具放进 allowedTools，让 canUseTool 逐调用拦截」 | 断言 a4：对照表「我搭的是显式 loop+显式 policy 门+显式 journal，框架藏进 SDK」成立；allowedTools 抢跑示范 deny 拦截真的发生 |

**每个 TODO 补全 = 学会 M4 一个机制**：`m4.1`（记忆不是缓存，是「带信任等级 + 投毒防线 + 遗忘血缘」的状态）、`m4.2`（评测飞轮的降噪靠「只动一个变量」+ 门禁止步提案）、`m4.3`（模型选择是数值走查，KV/成本/步数共同决定）、`m4.4`（框架藏了 loop/权限/状态/可观测，我搭过才知道它给我的边界在哪）。

## 4. 断言自测清单（确定性 / 可机器核对 / 可重放）

断言文件 `assert/m4.assert.ts`，跑 `exercises/m4/starter/`（红）或 `solution/`（绿）；每条编号 = TODO 编号，各自打印 `✅` / `❌`，末行 `✅ m4 验收通过`。

| 断言 | 已核对的预期 | 态 |
|---|---|---|
| `a1 m4.1 记忆+防线` | 低信任不注入 / 反事实不召回 / forget 血缘传播 / 防线消融承重 | 确定性（预置候选/信任/scope/FIXED_TIME） |
| `a2 m4.2 飞轮门禁` | round 只动 prompt / gate propose|reject / 禁 auto-apply | 确定性（预置预测表 + 阈值） |
| `a3 m4.3 模型意识` | KV 显存 + 缓存折扣只动 prefill + 成本走查 | 确定性（纯函数数值） |
| `a4 m4.4 框架对照` | 五维对照 + allowedTools 抢跑 deny 拦截 | 确定性（离线条目对照） |
| 末行 | 四断言全绿 → `✅ m4 验收通过`，exit 0 | 可机器核对 |

**三态纪律**（style-guide §3）：确定性（记忆候选/预测表/模型参数/对照表全预置，用 `FIXED_NOW` 逻辑时钟不落墙钟，无 `Date.now`/`Math.random`/pid）；可机器核对（断言编号 + `✅`/`❌` + 末行验收行）；可重放（`npm run assert:m4` 连跑两次 `diff` 空）。

**半成品三分**：starter 中 `m4.x` 抛 `TODOError('m4.x: …')` → 断言捕获判 `❌ m4.x 未实现`（红）；学员补全 → 绿；solution 同断言 → 绿。

## 5. 参考答案组织（memory / flywheel / model-basics / framework 真实 file+function vs 主线 solution）

按 style-guide §4 分工。以下 `file+function` 已逐一 `read` 核实存在：

| M4 机制 | 切片答案（真实存在） | 主线答案 |
|---|---|---|
| 记忆+投毒防线（`m4.1`） | `memory-redteam/src/memory.mjs` `createStore`（L58）/ `write`（L139）/ `recall`（L321）/ `forget`（L345）/ `sweepExpired`（L303）/ `DEFENSE_KEYS`（L42，8 键，前 4 键=S7 四道投毒防线 trustGate/injectionScan/highRiskApproval/auditTrail）/ `TRUST`（L20）；`redteam.mjs` `PROBES`（L114，R1-R11）/ `E2E_PROBES`（L21，E1-E5）——16/16 探针守住（README L24） | `exercises/m4/solution/memory.ts` |
| 评测飞轮（`m4.2`） | `flywheel-demo/src/label.ts` `predictLabel`（L16）/ `round`（L49，只动 prompt）/ `relabel`（L58）/ `backfillLabels`（L40）；`gate.ts` `gate`（L10）/ `NOISE`（L8）；`curate.ts` `curate`（L15） | `exercises/m4/solution/flywheel.ts` |
| 模型意识（`m4.3`） | `model-basics-demo/src/kv.ts` `kvBytesPerToken`（L6）/ `kvTotalBytes`（L10）；`cost.ts` `stepCost`（L9）/ `withCacheDiscount`（L22，只动 prefill）/ `taskCost`（L13）/ `breakdown`（L30） | `exercises/m4/solution/costwalk.ts` |
| 框架对照（`m4.4`） | `framework-demo/src/compare.ts` `runAllThree` + `DIMENSIONS`（L45，五维对照）；`capabilities.ts` `step1_minimalAgent`（L6）/ `step3_permissions`（L43，canUseTool deny 拦截 + allowedTools 抢跑说明）/ `step4_session`（L69）；`lib.ts` `runQuery` / `BUILTIN_TOOLS` | `exercises/m4/solution/framework.ts` |

> 明确红线 / 最小态标注（诚实区分「demo 完整形态」与「主线教学最小态」）：
> - **`m4.1` 投毒防线完整度**：`memory-redteam` 是完整红队（16 条探针 + 消融自检逐层承重 18/18）。主线 M4 取最小态——`write/recall/forget` 走四道防线（trustGate/injectionScan/highRiskApproval/auditTrail）的**判定逻辑**照搬，配 4-6 条确定性探针（低信任不注入 / 反事实不召回 / 遗忘血缘 / 防线消融敏感），不照搬完整 16 探针自检框架（那是 demo 的工程完整体）；「持久化」沿用 M3 内存持久层（demo 有 `persist.mjs` 真实 JSONL，主线不碰真实 fs）。
> - **`m4.3` 成本走查「该不该微调」**：`model-basics-demo` 给 KV/成本纯函数（可直接照搬），但「该不该上更大模型 / 该不该微调」的联合走查（KV 显存 + 单步成本 × 步数 + 训练/推理成本阈值）**主线自带** `shouldScaleUp`（结合 M3 路由成本），demo 无此把 KV 与成本合并的决策函数。
> - **`m4.4` 框架对照**：`framework-demo` 真实跑三家 SDK（Claude/OpenAI/LangGraph）+ mock 模型端点。主线 M4 不引真实 SDK，把对照做成**离线五维对照表纯数据 + allowedTools 抢跑示范**（「故意不把 Bash 放 allowedTools，让 canUseTool 逐调用拦截」的对照逻辑照 `step3_permissions`），不跑真实 SDK/不联网。

## 6. clone 判据（`cd my-agent` 验收命令与预期输出）

```bash
cd my-agent
npm run assert:m4              # 补全后：全绿 + 末行 ✅ m4 验收通过（exit 0）
npm run assert:m4 && npm run assert:m4   # 连跑两次 diff 空 = 可重放
npm run demo:m4                # 跑通「记忆写读遗忘 + 飞轮门禁 + KV/成本走查 + 框架对照」
```

- 断言命令 `npm run assert:m4` → 期望末行 `✅ m4 验收通过` + exit 0（不绑会漂移的日志/摘要值；低信任不注入 / f1 不降 && precision 显著升 / KV 显存 / deny 拦截 是唯一稳定判据）+ 零 key、零外网、无跨目录 import、无真实 SDK/fetch。

## 7. 真·增建证据（m3/solution → m4/starter 逐字节继承）

- **`m4/starter` 继承自 `m3/solution`**（上一 milestone 完成态），祖先关系写进 `m4` README 第一行。
- **逐字节一致的部分**：`types/model/tools/loop/session/compress/policy/sandbox/mcp/eval` + `golden/` + `durable/stream/retry/router/otel` 里 M3 已建段与 `exercises/m3/solution/` 同名段逐字节一致——`diff -r` 只见 M4 新增（memory/flywheel/costwalk/framework 四新文件 + `types.ts` 增补的 memory/flywheel/modelcog 类型 + loop 的记忆 recall/飞轮门禁接线）。
- **真增建验证命令**（wei 建完跑）：
  ```bash
  diff exercises/m3/solution/tools.ts exercises/m4/starter/tools.ts     # 空（多工具底座不变）
  diff exercises/m3/solution/durable.ts exercises/m4/starter/durable.ts # 空（durable 底座不变）
  diff -r exercises/m3/solution exercises/m4/starter --exclude=types.ts --exclude=loop.ts --exclude=memory.ts --exclude=flywheel.ts --exclude=costwalk.ts --exclude=framework.ts
  # ↑ 只见 M4 新增文件与 4 处 TODO；已建段 diff 为空
  ```
  > `git tag m3`（若未打先打）→ `git tag m4` → `git diff m3 m4` 只应出现 M4 新增能力 + 类型/接线增补，M3 段无 diff。M4 完成后 `git tag m0..m4` 五档齐 + `git diff m0 m4` = 完整主线真增建历程（沿用 t25 纪律：my-agent/ 目前 git-untracked，真增建以文件级 diff 证据交付）。

## 8. 确定性红线与边界

- **红线**：记忆候选/信任/scope/FIXED_TIME、飞轮预测表/阈值、模型参数、对照表全预置；逻辑时钟不落墙钟；内存持久层不碰真实 fs、无真实 SDK/fetch/`Date.now`/`Math.random`/pid。
- **M4 是主线最后一站**：做完即主线收口，此后「主线真源 `src/`」的承接与「17 课 ↔ 主线」的站点收口由后续 sprint/终审处理。
- **不破坏**：不改 `memory-redteam`/`flywheel-demo`/`model-basics-demo`/`framework-demo` 任何源码、不改 `mvps.ts`、`course-structure.ts`、17 课正文、M0/M1/M2/M3 已建 `exercises/m0|m1|m2|m3` 与 `assert/`；只新增 M4 文件 + 顶层 scripts 增量。

## 9. 主线毕业须知（写给终审 / 学员的收口锚）

M4 完成后，`my-agent` 的完整形态可用五句话自述（对应 blueprint §3 收口morphology + `learn` 页 capstone hero 卡）：

1. **多工具**：一个 loop 里 `read_file` + `search`（检索=打分排序）+ 一个走 RPC 形状的远程 MCP 工具，按名字分发。
2. **多轮**：JSONL 会话可恢复（重建 + 未知态标注）+ 超长上下文自动压缩 + SSE 流式。
3. **带权限沙箱**：四通道 policy（deny>approve>sandbox>allow）+ 沙箱三边界（路径/env/egress）+ 供应链四层防御（L1 消毒/L2 policy/L3 egress 断言/L4 审计）。
4. **可观测 / 可评测 / 可恢复**：OTel span 树埋点 + golden set 召回门禁（锚点失效响亮失败）+ durable journal/checkpoint 崩溃恢复（副作用恒=1）。
5. **有记忆 + 模型意识 + 框架认知**：四类记忆（写读遗忘 + 四道投毒防线）+ 评测飞轮（label 降噪 + 门禁止步提案）+ KV/成本走查（该不该上更大模型/微调）+ 五维框架对照（「我搭的 vs 框架给的」）。

**主线毕业验收（终审用）**：`cd my-agent && npm test`（或依次 `assert:m0..m4:solution`）5 档全绿 + `npm run demo`（主线 demo 前进到 M4）+ `git tag m0..m4` 五档齐 + `git diff m0 m4` 只见逐 milestone 真增建（M1 多工具会话压缩、M2 沙箱 MCP 评测、M3 恢复流式路由可观测、M4 记忆飞轮模型意识框架收口），即主线毕业。