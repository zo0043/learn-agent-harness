# flywheel-mvp 设计规格（data-flywheel 课独占 MVP）

> 写给下一任务的实现者（wei）：照这份规格从零建 `flywheel-demo/`，做到「可 clone、可运行、全离线零 key、确定性、断言自测」，不需要再找本课内容架构师确认设计取舍。
> 状态：本文件是**设计规格**，不是实现；`flywheel-demo/` 目录目前不存在。
> 关联：course-structure.ts `data-flywheel.mvpSlug = 'flywheel-mvp'`（sprint 2 标 planned）；教学正文见 `notes/data-flywheel.md`。

## 0. 目标（一句话）

flywheel-mvp = 「数据飞轮」的最小可运行闭环：**脱敏台账样本 → filter（curation）→ label（两轮降噪）→ 指标单调可解释 → 决策门禁（含「一次只动一个变量」的可验证归因）**，四个模块各一个可证伪断言，`npm run demo` 全绿 = 证明飞轮不是「收集数据」，而是「让每一次生产都变成下一次评测的输入」。

## 1. 复用关系与边界

- **复用（照搬语义，不 import 生产数据/上位 demo）**：
  - **FinHot 台账 field 形状**（`notes/data-flywheel.md` §S2）：三版本字段（`prompt_version`/`model_version`/`harness_commit`）、`outcome_status`（pending/labeled/skipped）、`published`（反事实）、`cum_pct_tN`（延迟标签）——**只照搬字段形状，样本内容是合成的，绝不搬生产台账数字（1830 行 / 具体板块事件在仓外）**。
  - **evaluation 的「评测 = 仪表盘」口径**：指标分母 = `labeled` 行、`skipped` 一等终态、golden 版本化。
  - **memory-redteam 的「消融自检 = 逐层关防线」口径**：一次只动一个变量的断言常式。
  - **api-demo 的「确定性纪律」**：逻辑时钟 + 固定 seed，无 `Date.now()`/`Math.random()`/pid。
- **边界**：各 demo 目录独立可 clone（sandbox/mcp/durable/api 都不跨目录 import），flywheel-demo 同样独立，四处语义「照搬 + 注释出处」。

## 2. 功能范围

### In scope（四模块最小可运行子集，各对一条断言）

1. **ledger（台账行 + 状态机）**：一行一任务（输入 + 三版本字段 + 终态 + 结果标签 + 反事实 `published`）；`outcome_status` 状态机 `pending → labeled / skipped`（`skipped` 带 reason、一等终态）。
2. **curate（筛选三道门）**：去污染（`direction` 失败行单独归因，不混进质量指标）/ 去重（同板块同事件聚代表）/ 分层（方向 + 难度固定配额）。
3. **label（延迟标签回填 + 两轮降噪）**：T+5 状态机推进 `pending → labeled/skipped`；两轮「只动 prompt」降噪（`prompt_version` v1→v2→v3，其余 11 个「提示词字段」全程不动）。
4. **metrics + gate（指标 + 决策门禁）**：`precision/recall/f1/errors/decisive` 计算 + 决策门禁（关键指标不降 && 目标指标显著升 → 生成提案；**T3.2 禁 auto-apply**，自动化止步提案）。

### NonGoals（明确不做，别做）

- **不做**真实 FinHot 台账数据 / 生产数据落盘（生产数据在仓外）。
- **不做**真实 LLM 调用 / 真实 labeler 平台 / 真实微调与训练。
- **不做**真实数据平台 / 生产追踪 / 真实 A/B 注入网关。
- **不做**真实模型推理——指标判定用「预置 tp/fp/tn/fn 表 + 确定性 labeler 判定函数」，**零 API key 全离线**。

## 3. 目录与文件结构

```
flywheel-demo/
  package.json          # scripts: demo (tsx src/demo.ts), typecheck (tsc --noEmit)；deps: tsx + typescript + @types/node
  tsconfig.json         # strict / NodeNext
  README.md             # clone 判据 + 四模块表 + nonGoals
  src/
    types.ts            # LedgerRow / MetricReport / Decision / 方向标签
    sample.ts           # 脱敏合成台账样本（字段形状对齐 FinHot，内容合成）
    ledger.ts           # outcome_status 状态机 + published 反事实
    curate.ts           # 去污染 / 去重 / 分层
    label.ts            # 延迟标签回填 + labeler 两轮降噪（prompt_version 版次）
    metrics.ts          # precision/recall/f1/errors/decisive
    gate.ts             # 决策门禁 + T3.2 禁 auto-apply
    demo.ts             # 入口：串四模块跑一遍「两轮消融」，末尾打印验收汇总
    assert.ts           # 断言式自测：四模块各一条可证伪用例
```

（src 目标规模 ~350 行，参照 api-demo 的「逻辑时钟 + 断言」风格。）

## 4. 入口命令与 clone 判据

```bash
cd flywheel-demo
npm i                 # NODE_ENV=production 时改用 NODE_ENV=development npm install
npm run demo          # 四模块断言 + 两轮消融走查 + 末尾汇总
npm run typecheck
```

- **判定「clone 能跑」**：`npm run demo` 末尾打印 `✅ flywheel 验收通过：四模块断言全绿`；任一断言失败打印 `❌` 并以退出码 1 终止（可进 CI）。
- **全离线零 key**：不 import 任何需要联网的 SDK；样本是合成数组、指标是确定性判定函数。
- **确定性**：不用 `Date.now()`/`Math.random()`/pid；T0/T+5 用逻辑时钟（步序号），两轮消融的 `prompt_version` 走预置版次表；跑 N 次逐字节一致。

## 5. 各模块规格（接口级，给 wei 直接实现）

### 5.1 `types.ts` + `sample.ts` —— 台账行 schema + 脱敏样本

```ts
export interface LedgerRow {
  id: string;                        // 行 id
  input: string;                     // 合成：板块 + 事件 + 方向（如 "央行 · 社融例行发布 · neutral"）
  prompt_version: string;            // v1/v2/v3（归因控制变量）
  model_version: string;             // 固定占位，全程不变
  harness_commit: string;            // 固定占位，全程不变
  outcome_status: 'pending' | 'labeled' | 'skipped';
  skipped_reason?: string;           // skipped 一等终态带原因
  raw_label?: 'none' | 'bullish' | 'bearish' | 'neutral';
  published: boolean;                // 反事实：false = 「没让上线」的判断保留
}
```

- `sample.ts` 提供 ~12 行**合成**样本（对齐字段形状 + 预置「污染行 / 重复行 / 反事实行 / skipped 行」各若干），**不含真实 FinHot 数字**。

### 5.2 `ledger.ts` —— 状态机

```ts
export function advanceStatus(rows: LedgerRow[], now: number): LedgerRow[]; // pending → labeled/skipped（skipped 带 reason）
```

- 断言 ledger-A：状态机推进后 `outcome_status ∈ {labeled, skipped}`，`skipped` 行都带 `skipped_reason`。
- 断言 ledger-B：`published=false` 的行保留、且可与 `published=true` 的行**进同一个 metrics 函数**（反事实同口径评）。

### 5.3 `curate.ts` —— 筛选三道门

```ts
export function curate(rows: LedgerRow[]): { kept: LedgerRow[]; poisoned: LedgerRow[]; deduped: LedgerRow[] };
```

- 断言 curate-A：污染行（`direction` 失败）被分到 `poisoned` 单独归因，不进 `kept`。
- 断言 curate-B：同板块同事件的行去重成代表（`deduped` 里只剩一条）。

### 5.4 `label.ts` —— 延迟标签回填 + 两轮降噪

```ts
export function backfillLabels(rows: LedgerRow[], tNow: number): LedgerRow[];  // T+5 推进状态机
export function round(rows: LedgerRow[], from: string, to: string): { prompt_version: string; edits: { file: string; hash: string }[] };
// 两轮降噪：round(rows, 'v1', 'v2') 与 round(rows, 'v2', 'v3') 各「只动 prompt」——
// prompt_version 变、其余 ledger 字段（model_version/harness_commit/data 版次）全程不动。
```

- 断言 label-A：T+5 回填后 `pending → labeled/skipped`，`skipped` 带 reason。
- 断言 label-B：两轮消融里 `model_version`/`harness_commit`/样本集合全程未变（一次只动 prompt）。

### 5.5 `metrics.ts` + `gate.ts` —— 指标 + 门禁

```ts
export function metrics(rows: LedgerRow[]): { precision: number; recall: number; f1: number; errors: number; decisive: number; accuracy: number };
export function gate(m: { prev: MetricReport; next: MetricReport; n: number; varNote?: string }): Decision;
// Decision = { action: 'propose' | 'reject'; reason: string; attributable: boolean };
// 关键指标不降 && 目标指标显著升（超重跑方差）→ propose；否则 reject。
// attributable=false 当 varNote 非空（双变量叠加 → 不可归因，不得把退步归给 prompt）。
```

- 断言 metrics-A：给定预置 tp/fp/tn/fn 手算期望值，`precision/f1/errors` 逐一相等。
- 断言 gate-A：关键指标降 → `action='reject'`；关键不降 + 目标升 → `action='propose'`。
- 断言 gate-B：双变量叠加（`varNote` 非空）→ `attributable=false` 且 reason 明说「不可归因」而非「prompt 变差」。

## 6. 断言式自测清单（demo.ts 职责）

demo.ts 按序跑下面 10 条，每条 `✅/❌`，全绿才打印汇总：

| # | 模块 | 断言 | 期望 |
|---|---|---|---|
| 1 | ledger | 状态机 pending → labeled/skipped | skipped 全带 reason |
| 2 | ledger | published=false 反事实保留 | 可与 published=true 同口径评 |
| 3 | curate | 污染行 direction failed | 被分到 poisoned、不进 kept |
| 4 | curate | 同板块同事件去重 | deduped 剩代表一条 |
| 5 | label | T+5 回填 | pending → labeled/skipped |
| 6 | label | 两轮消融只动 prompt | model/harness 版次全程未变 |
| 7 | metrics | 手算 tp/fp/tn/fn | precision/f1/errors 逐一相等 |
| 8 | metrics | 第一轮 v1→v2（只动 prompt） | precision↑、errors↓（可归因） |
| 9 | gate | 关键指标降 / 升 | reject / propose |
| 10 | gate | 双变量叠加 + 禁 auto-apply | attributable=false + 永远无「自动合入」态 |

最后跑一段「**两轮消融走查**」（对齐 `notes/data-flywheel.md` §S6 的 FinHot 真实过程，但用合成样本重放）：`v1→v2` 只动 prompt 指标升（可归因）→ `v2→v3` prompt + gold 双变量叠加指标退步（`attributable=false`）→ 决策停在「提案」（禁 auto-apply）。打印可读时间线（逻辑步号）。

## 7. 确定性纪律（参照 api-demo）

- 逻辑时钟 = 步序号（T0 / T+5 / 轮次）；断言变体用固定 seed；不含 `Date.now()`/`Math.random()`/pid。
- 指标期望值手算后写死在断言里；两轮消融的版次表预置（不随机）。
- 跑 N 次输出逐字节一致；「会漂移的 hash」只出现在正文「来源与锚点」，不进 clone 判据。

## 8. 给 wei 的关键提示与风险

1. **脱敏样本 ≠ 生产数据**：`sample.ts` 是合成内容（板块/事件/方向占位），字段形状对齐 FinHot，但**绝不落真实 1830 行 / 具体板块事件**——生产台账在仓外，这是本 MVP「全离线零 key」的红线。
2. **四模块各一断言、别做成大打印**：每条断言期望是可判定布尔/数值（指标用预置 tp/fp/tn/fn 手算）。
3. **指标是确定性判定函数，不是 LLM 调用**：`metrics()` 对样本按预置表计数，零 API key。
4. **「一次只动一个变量」要能机器断言**：两轮里 `model_version`/`harness_commit`/样本集合必须逐字段相等，只有 `prompt_version` 变——这是归因成立的证据，别写成注释烂尾。
5. **完成后**：在 course-structure.ts `data-flywheel.practicalOutput` 已写的 clone 判据（`cd flywheel-demo && npm i && npm run demo → ✅ flywheel 验收通过`）必须真实成立；并把 `mvps.ts` 里 `flywheel-mvp` 从 planned → done（附 exit 0 证据）——这是 wei 的职责，别在本规格文件里动。
6. **别越界**：真实 FinHot 数据、真实微调、真实数据平台、真实模型推理都在 nonGoals；做进去既超最小闭环、又破坏「脱敏样本不碰生产数据」的教育立场。