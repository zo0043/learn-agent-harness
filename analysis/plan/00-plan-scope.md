# 实施计划轮｜范围与产出规范（captain 下发，全体成员必读）

> 本轮**只产出可执行的实施计划文档**，一行代码也不改。执行是下一轮的事。
> 本轮的唯一交付是回答：**改什么、怎么改、怎么验收、怎么回滚、按什么顺序**。

## 0. 硬边界（违反即任务失败）

1. **不得修改任何既有文件**——包括 `notes/`、`site/`、各 demo、`README.md`、`handoff.md`，
   以及 **`analysis/content/` 下上一轮的全部报告**（那是本轮的事实基础，只读）。
2. 唯一允许的写入：**`analysis/plan/` 下的新文件**。交付前自查 `git status --porcelain`：
   只应出现 `?? analysis/`（本轮新增的只有 `analysis/plan/*`）。
3. **不跑 `astro build`**；**不跑任何会写工作区的脚本**（`visual-check` 会写 `site/tools/out/`、
   `mermaid-check` 会写产物、各 demo 会写 `trajectories/`/`.state/`）。一律只读：`grep`/`sed`/`read`/`find`/`stat`/`node -e` 只读复算。
4. 证据纪律：file:line + 亲自跑过的命令原文；未验证写「未验证（原因）」；**不得把他人自述或上一轮报告结论当证据转述**。
5. 不跑长命令、不联网装包；`web_search` 本轮已知不可用（缺 key），需要外部事实时用 `web_fetch` 直取一手源并记 URL 与时点。

## 1. 事实基础（上一轮已 confirmed，可直接引用）

| 输入 | 用途 |
|---|---|
| `analysis/content/08-synthesis.md` | **主依据**：Top 10 + 备列 + ④ 显示形式分界 25 条 + ⑥ 下一轮建议范围与输入清单 |
| `analysis/content/07-verification.md` | 哪些结论已 confirmed / confirmed+fix；**哪些已被 falsified** |
| `analysis/content/01`–`06` | 各视角的 file:line 证据（引用时用 07 修正后的值） |
| `analysis/content/00-corpus-scope.md` | 上一轮的语料范围与记者纪律（沿用） |

**三条 falsified（`accuracy-F1`、`accuracy-F3`、`evidence-F2`）不得作为任何改造项的依据**；
**必须使用 07 的修正值**：依赖图不一致真值 **8/15**（非 9/15）、`details` 矛盾页为 **04/08/06**（`01` 不矛盾）、
`industry-2026.md:**20**`、SSE 首现 `harness-from-scratch.md:15/:17`、coverage 的两处计数修正（`wc -l` 7、`A/B` 6）。

## 2. 改造项基线与批次命名（全轮统一，不要自创）

- **批次 A**：口径治本 = P1 档位统一 / P2 依赖图派生 / P3 顺序统一 / P10 计数派生 + 映射表补登。
- **批次 B**：读者闭环 = P5 题库合格线 / P7 术语表 / P6 `mcp.md` S4 拆节 / P4 `details` 8 页复核。
- **批次 C**：时效与证据链 = P8 时点回填 / P9 构建证据链固化。
- **形式组 0**：构建与预览环境（`site/dist` 残骸、`/nav/` 进视觉回归、落盘约定、绝对路径）。
- **形式组 1**：站点入口层（`index` 首屏/卡片、`404`）。**组 2**：`/learn/` 层级与口径落点。
- **形式组 3**：`/map` 依赖图（**与批次 A 的 P2 是同一处，必须合并设计**）。
- **形式组 4**：课程页与 details 页呈现。**组 5**：回归环境（与组 0 相邻，可合并）。

## 3. 每个改造项必须写清的 10 个字段

`id` / `目标` / `现状证据(file:line)` / `具体改法（落到文件・函数・字段・行区间）` / `派生还是手工` /
`验收命令（可重跑）` / `回滚点` / `依赖（前置项 id）` / `工作量（S/M/L 并给理由）` / `风险`。

**「具体改法」的下限**：读者能照着动手，不需要再回来推理。允许写伪码、diff 级描述、字段表、脚本骨架，
但**不得真的落盘到 `notes/` 或 `site/`**。

## 4. 验收判据的两分法（必须分开写）

1. **可机器验证**：给出命令与期望输出（例：`node site/tools/check-counters.mjs` 判据数从 12 → N、exit 0；
   `git grep -n '<旧字形>'` 命中数 0）。
2. **必须留浏览器目检**：明确写出「留浏览器目检」，**不得**用 HTTP 200 / 文件存在 / 构建成功冒充页面正确
   （与上一轮 `08-synthesis.md` §6.3 一致）。

## 5. 产出文件

| 文件 | 负责 |
|---|---|
| `analysis/plan/01-source-layer.md` | 真源层与派生改造设计（批次 A + 门禁扩展） |
| `analysis/plan/02-content-layer.md` | 内容层改造设计（批次 B + C） |
| `analysis/plan/03-form-layer.md` | 形式层改造设计（组 0–4） |
| `analysis/plan/04-evidence-gaps.md` | 实施前必须补齐的证据（未通读页 + 未复核 medium/low + 结构事实） |
| `analysis/plan/05-feasibility-review.md` | 对抗式可行性/风险审查（对 01–03） |
| `analysis/plan/06-implementation-plan.md` | **主交付**：汇总成可独立执行的实施计划 |

每份设计文档末尾固定两节：`## 未决决策点（需用户拍板）`、`## 依据不足项（不许当事实）`。

## 6. 本轮交付判据

- 主文档 `06` 必须能让人**不回看 01–05** 就能执行。
- 每批次有**批次级验收门禁**（可重跑命令 + 期望输出）。
- 未决决策点单列，**不许替用户决定**；依据不足项单列，**不许拿未复核的 medium 当事实**。
- 全轮零代码改动。
