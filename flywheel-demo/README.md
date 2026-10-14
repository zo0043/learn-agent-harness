# flywheel-demo —— 数据飞轮 §S2 作品

数据飞轮的最小可运行闭环：**脱敏合成台账 → filter → label（两轮降噪）→ 指标单调可解释 → 决策门禁（含「一次只动一个变量」的可验证归因）**，四个模块各带可证伪断言。

全离线零 key：脱敏合成样本（字段形状对齐 FinHot，内容合成、不碰生产数据），labeler 用预置预测表（非 LLM 调用），指标是确定性判定函数。

## 跑法（clone 判据）

```bash
cd flywheel-demo
npm i
npm run demo      # 四模块断言 + 两轮消融走查，末尾 `✅ flywheel 验收通过`（exit 0）
npm run typecheck
```

- **判据**：`npm run demo` 末尾打印 `✅ flywheel 验收通过：四模块 10 条断言全绿 + 两轮消融走查通过`；任一失败 `❌` 且 exit 1。
- **确定性**：无 `Date.now()`/`Math.random()`/pid；逻辑时钟 = 步序号，labeler 预置表 + 合成样本，跑 N 次逐字节一致。

## 四模块（各一断言）

| 模块 | 断言 | 教学点 |
|---|---|---|
| ledger | pending→labeled/skipped，skipped 带 reason；published=false 反事实同口径评 | 状态机 + 反事实 |
| curate | 污染行单列归因；同板块+事件去重成代表 | 三道门 |
| label | T+5 回填；两轮只动 prompt | 延迟标签 + 降噪 |
| metrics | 手算 tp/fp/tn/fn 逐一相等；v1→v2 precision↑errors↓ | 指标可解释 |
| gate | 关键指标降/升 → reject/propose；双变量 → 不可归因 + 无 auto-apply | 决策门禁 |

## 复用与边界

- **FinHot 台账字段形状**（`notes/data-flywheel.md` §S2）：prompt_version / model_version / harness_commit / outcome_status / published —— 只照搬形状，样本内容合成。
- **evaluation 的「评测 = 仪表盘」口径**：指标分母 = labeled 行，skipped 一等终态不进指标。
- **memory-redteam 的「消融 = 逐层关防线」口径**：一次只动一个变量。
- **api-demo 的确定性纪律**：逻辑时钟 + 固定 seed，无墙钟/随机。

## 两轮消融（对齐 notes/data-flywheel.md §S6）

`v1→v2` 只动 prompt（round 校验 model/harness/样本逐字段不变）→ precision↑ errors↓ → gate propose（可归因）→ `v2→v3` prompt + golden set 双变量叠加 → 指标退步但 `attributable=false`（不把退步归给 prompt）→ 决策止步于提案/拒绝，全程无 auto-apply。

## NonGoals（不做）

真实 FinHot 台账数据 / 真实 LLM labeler / 真实微调与训练 / 真实数据平台 / 真实模型推理 / A/B 注入网关 —— 均排除；本 MVP 是「脱敏样本 + 确定性判定」的离线闭环。