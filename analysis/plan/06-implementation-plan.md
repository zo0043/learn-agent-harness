# 06 · 可独立执行的实施计划（主交付）

> 任务：`t6 [p6-plan]`｜成员 `planner`｜批次命名与 10 字段沿用 `analysis/plan/00-plan-scope.md`。
> 输入：`00-plan-scope.md`（规范）、`01-source-layer.md`（批次 A）、`02-content-layer.md`（批次 B/C）、
> `03-form-layer.md`（形式组 0–4）、`04-evidence-gaps.md`（证据补齐）、`05-feasibility-review.md`（对抗审查裁决）。
>
> **本文档自足**：第 ③ 节的每一步都独立写全 10 字段（含 `file:line`、改法、可重跑验收命令、回滚点、依赖），
> 执行者**不需要回看 01–05** 就能动手。第 ①–②、④–⑧ 节只解决「顺序、门禁、防复发、回滚、拍板、排期、边界」。
>
> **本轮零改动**：本文档是本轮 `analysis/plan/` 下唯一的新增物；未改任何既有文件（含 `01`–`05` 与本轮 `analysis/content/*`）。
> 所有 `file:line` 为现状值，且本文档作者对下列事实**亲自复跑过只读命令复核**（见 §0.3 复核台账）。

---

## ① 总览与执行顺序

### 0.1 一句话结论

本轮审计确认的问题**全部可以在 4 个批次 / 5 个形式组内收敛**，但收敛有一个**不可违反的物理约束**：

> `site/build.sh:41` 把口径门禁做成了**部署阻塞点**（`set -e`，失败即不产出 `site/dist` → GitHub Pages 停更），
> `.github/workflows/verify.yml:76` 又让它成为**结构回归门禁**。因此**任何让 `check-counters.mjs` 变红的中间态都不能进主干**。
> ⇒ 批次 A 的**五处改动必须合并为一次提交**（清单见 §1.4「编辑器互斥组 G-A0」），而不是「先删字段再改脚本」。

### 0.2 强制沿用的事实口径（不得改写）

**（a）07 的修正值**（`00-plan-scope.md` §1 强制）：依赖图不一致真值 **8/15**（非 9/15）；`details` 矛盾页 = **04/08/06**
（**01 不矛盾**）；`industry-2026.md:**20**；SSE 首现 = `notes/harness-from-scratch.md:15/:17`（定义在 `:83`）；
coverage 两处计数 `wc -l` 实为 **7**、`A/B` 实为 **6**。

**（b）三条 falsified 不得作为任何依据**：`accuracy-F1`（BM25 k1 双重口径）、`accuracy-F3`（RRF 1/70「算错」）、
`evidence-F2`（OOM 无日志）。**包括它们的「建议方向」**也不得采用。

**（c）本文档采用的「现状实测值」**（我在本轮亲自复跑，命令与输出见 §0.3）：
`check-counters.mjs` 判据 **12 条** + 副本 **7 处**、exit 0；`notes/knowledge-map.md` 口径块 = **第 8–19 行**（锚点是 `:8` 的字面量「计数口径」）；
依赖图 mermaid 围栏起点 `:78`，图区 `:78-126`，**当前无 `BEGIN/END:dep-graph` 标记**；
指向 `INTERVIEW` 的边 **8 实线 + 4 虚线 = 12 条**；`works.astro` 档位标签 **6 处**（`:94/:149/:224/:262/:296/:330`）；
`visual-check.mjs` 的 `PAGES` **8 页**；`verify.yml:105` 是 `-eq 33` 等值断言。

**（d）05 的裁决分类与本文档的收录动作**（硬规则：只收录 confirmed；needs_revision 按修正版收；reject 剔除）。

| 05 裁决对象 | 裁决 | 本文档动作 |
|---|---|---|
| 01 风险 1「删 `phase` 的后果 = `hardError`」 | `needs_revision` | **已修正**：真实后果是「≥5 条判据同时失配」（非 hardError；hardError 仅在 `:124`/`:132`/`:146` 前置失败时置位） |
| 01 的 AC-2 验收「`grep -rn '\.phase\b' site/src/` 期望 0」 | `needs_revision`（05 坑 10） | **已修正**：必须带 `| grep -v 'phase-head\|phase-section\|phase-desc'`，否则追 `.phase-head` 等 CSS 类名幽灵 |
| 01 的 A2 伪码（方向 `flowchart LR`、slug 标签、无 classDef） | `needs_revision`（05 坑 11/16/12） | **已修正**：生成器模板必须吸收 03/F3-1 的 6 条契约（见 §3.A2 步） |
| 01 的 A2 验收命令 2 依赖 `HARNESS --> MCP` 命中 0 | `needs_revision` | **已修正**：改用「生成器 `--check` 与区间文本逐字节一致」的判据（判据 17），不靠边名字面量 |
| 01 的 A2 验收「无标记时 exit 1」 | `needs_revision`（05 C3） | **已修正**：标记插入 + 首次 `--write` + 判据 17 必须**同一提交**（§1.4 硬顺序 H-2） |
| 01 的 A4 提案「在 `site/src/data/courses.ts:279` 去掉 `HORIZONTAL_SLUGS` 新集合、改从 `COURSE_STRUCTURE` 派生 `DOMAIN_COUNT`」 | `confirmed*`（05 坑 14 证实可行） | **已修正**：采纳从 `COURSE_STRUCTURE` 派生，**禁止**新增第 5 份横向清单 |
| 01 的 A6-b 反向断言扫描面 | `needs_revision`（05 C6） | **已修正**：扫描面 = `site/src/**` + `README.md` + `handoff.md`，**显式排除 `site/tools/**`** |
| 01 的 A7 判据 23（计数清单全派生） | **`reject`** | **已剔除**：理由=清单仍三份且语义不同（05 §2）；改用「常量 + 判据 25/26 互锁」的降级版（见 §4.3） |
| 02 的 B-5 门禁（`grep 'S4\.2' notes/` 期望 0 命中） | **`reject`** | **已剔除**：实测全仓 `S4.2/3/4` **25 处命中**，「期望 0 命中」**结构上不可满足**；若为变绿去改 `sandbox.md:300/:311/:315`、`framework-ecosystem.md:188/:208` 即**越界改别的课的节号**。替代判据见 §3.B-P6 步 |
| 02 的 B-P5 工作量「L（含 92 题）」 | `needs_revision`（05 C7/§3） | **已修正**：覆盖 **184 题**（不是 92），且 `notes/agent-harness.md` 是 `demo:eval` 语料成员 → 改后**必须重跑评测**（§3.B-P5-a 步） |
| 02 的 B-P7「SSE 首现」判据 | `confirmed` | 照做（首现值 = `harness-from-scratch.md:15/:17`） |
| 02 的「回滚风险点在别处」 | `needs_revision`（05 §2） | **已修正**：`details/` 8 页与 `notes/rag.md`/`agent-harness.md`/`handoff.md` 的**语料成员关系**在 §5 回滚表中逐处写准 |
| 03 的「图 16 课程节点 / 11 个档位不一致」 | `needs_revision`（05 §9） | **已修正**：**17 个节点定义** = 14 课程节点（带档位）+ 2 横向资产节点 + 1 hub；**冲突 9 / 一致 5**；**`agent-harness` 节点缺失成立** |
| 03 的 F0-4 类集合门禁输入面 | `needs_revision`（05 坑 18） | **已修正**：输入面 = **`site/src/**` 源码**（不以 `site/dist` 为基准，实测 dist = 89 文件 / **0 HTML**） |
| 03 的 F0-1 `/nav/` 进视觉回归 | `confirmed` | 照做（`visual-check.mjs` 的 `PAGES` 8 → 9） |
| 03 的 F4-6（`c/[slug].astro:61` chip） | `confirmed` | 照做，且进硬顺序 H-1 |
| 03 未登记的 `works.astro:224/:296/:330` 三处档位活副本 | 05 §2/§3 新发现 | **新增为独立步骤**（§3.A0 步；01/02/03 三份设计全漏，captain 已独立复核） |
| 03 的 F1-1/F1-2 术语定义落点 | `confirmed*`（未深审） | 照做，但**必须先于 F1-1/F1-2 冻结术语真源**（§3.F1 前置，05 F-D4 / 03 D2） |

### 0.3 本文档的复核台账（我亲自跑的只读命令，可直接重跑）

| # | 命令 | 观察到的输出 |
|---|---|---|
| V1 | `node site/tools/check-counters.mjs; echo EXIT=$?` | `✅ 口径全部一致（判据 12 条 + 副本 7 处）`／`EXIT=0` |
| V2 | `grep -n 'check-counters' site/build.sh .github/workflows/*.yml` | `site/build.sh:41`、`.github/workflows/verify.yml:76`、`deploy.yml:40`（经 `npm run build`） |
| V3 | `grep -n 'BEGIN:dep-graph' notes/knowledge-map.md` | **0 命中**（标记尚不存在，故判据 17 不得先行落地） |
| V4 | `grep -c -- '--> INTERVIEW' notes/knowledge-map.md; grep -cE '\-\.\->' …` | `8` / `4`（实线 8 + 虚线 4 = 12 条） |
| V5 | `node -e` 复刻 `计数口径` 解析 | 首次出现 = 第 **8** 行（char 627）；块止于第 **19** 行（char 5072） |
| V6 | `grep -n "P0 ·\|P1 ·\|P2 ·" site/src/pages/works.astro` | 6 处：`:94 :149 :224 :262 :296 :330` |
| V7 | `node -e` 数 `visual-check.mjs` 的 `PAGES` | `8` |
| V8 | `grep -n 'check-counters\|-eq 33' .github/workflows/verify.yml` | `:76` 门禁；`:105` `test "$count" -eq 33`；`:106` 九个关键页 |
| V9 | `ls notes/*.md\|wc -l; ls notes/details/*.md\|wc -l; ls notes/process/*.md\|wc -l` | `19` / `8` / `20`（20 与 `08:316` 的「19 份」冲突，采实测 20） |
| V10 | `git status --porcelain` | `?? analysis/` + 4 个本轮前既有的未跟踪根 md；**无任何 `M`** |

### 0.4 依赖图（必须合并做的用 `⧺` 标出）

```
                    ┌─────────────────────────────────────────────┐
                    │ 组 0（先决：没有可目检的 HTML，一切目检为空）│
                    │ F0-0 构建/预览环境  F0-1 /nav 进回归         │
                    │ F0-2 selftest 落盘  F0-3 mermaid-check 可移植 │
                    └───────────────────┬─────────────────────────┘
                                        │（F0-4 类集合门禁 ⧺ 批次 A 的门禁扩展：同改 build.sh 插入点）
                                        ▼
        ┌───────────────────────────────────────────────────────────────────┐
        │ 批次 A（口径治本）—— 单次提交，内部硬顺序 H-1/H-2                 │
        │ A0 第 4 处档位副本(works.astro) ⧺ A1 档位瘦身 ⧺ A3 阅读序          │
        │ A4 计数派生 ⧺ A5 映射表       A6+A7 门禁扩展 ⧺ F0-4               │
        │ A2 依赖图派生 ⧺ F3-1/F3-2/F3-3（/map 与图契约）                   │
        └───────┬───────────────────────────────────────┬───────────────────┘
                │                                       │
                ▼                                       ▼
   ┌────────────────────────────┐          ┌──────────────────────────────┐
   │ 批次 B（读者闭环，可并行内部分支）│          │ 批次 C（时效与证据链，最后）  │
   │ B-P4 details 复核（可最先）  │          │ C-P9 证据链固化（最先做）     │
   │ B-P7 术语表 ⧺ 组 1 术语真源  │          │ C-P8 时点回填（末尾做）       │
   │ B-P5 题库合格线（3 批）      │          └──────────────────────────────┘
   │   └─ B-P6 mcp 拆节（依赖 B-P5 批 1）│
   └────────────────────────────┘
                │
                ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │ 形式组 1–4（入口层 / /learn/ / /map / 课程页与 details）            │
   │ 组 1 术语定义 ⧺ B-P7；组 2 映射表主责在 A5；组 3 全部 ⧺ A2；        │
   │ 组 4 F4-6 ⧺ A1（硬顺序 H-1）、F4-4/F4-5 ⧺ B-P4、F4-3 ⧺ B-P5         │
   └────────────────────────────────────────────────────────────────────┘
```

**可并行的三条**（互不触碰同一文件行）：
1. **B-P4（`notes/details/*.md`）** 与 **B-P5（`notes/<13 课>.md` 题库表）**：文件集不重叠（`details/` 8 页 vs 各课题库节）。
   唯一交集是 `notes/agent-harness.md`（B-P5 有表）——`details/` 不含它，故仍可并行。
2. **C-P9（删不实声明）** 与 **B-P4（删伪缺口）**：同为「删错」，都降低后续批次的误判输入，且文件不重叠
   （`verify.yml:76` 附近 / `README.md:28` / `notes/knowledge-map.md:18` vs `notes/details/*`）。**但** `knowledge-map.md:18` 与口径块
   同文件 ⇒ 与批次 A 的 km 改动**必须同一提交**（见 §1.4 互斥组 G-KM）。
3. **组 1（`index.astro` / `404.astro`）** 与 **组 2（`learn.astro`）**：不同文件；但 `index.astro` 同时被 A4 与 F1-5 触碰
   ⇒ 按 §1.5 单一主责表分离**行区间**后可并行。

**必须合并做的四组**（拆开会产生中间态故障或「改一半」）：

| 合并组 | 为什么不能拆 |
|---|---|
| **G-A0 = A0 + A1 + A6/A7 判据 13** | 删 `phase` 与门禁解析锚点改动若不同提交 → `entries=[]` → ≥5 条判据同时失配 → `build.sh:41` 中止构建 → Pages 停更 |
| **G-KM = A1 + A2 + A3 + A5 + C-P9(`km:18`)** | 同文件 `notes/knowledge-map.md`；且 `:8-19` 口径块**禁插空行**（解析锚点 = `:8` 字面量），A2 插标记不得落在此区间 |
| **G-CC = A6 + A7 + F0-4** | 三者同改 `site/tools/check-counters.mjs` 与 `site/build.sh` 的同一段插入点 |
| **G-MAP = A2 + F3-1 + F3-2 + F3-3 + F2-4** | `/map` 图与 `/learn/` 的引用句是同一处事实的两个面（「只改一遗」） |

### 1.4 硬顺序（违反即产生中间态故障；全部来自 05 §4 已验证的 3 条 + 我补的 3 条）

| # | 顺序 | 后果 |
|---|---|---|
| **H-1** | ① `check-counters.mjs:127` 解析改分段 → ② `c/[slug].astro:61` 清兜底分支 → ③ `courses.ts:279`/`:300` 解耦横向标记 → ④ **最后**删 `courses.ts` 的 `phase` 字段 | 违反 → 门禁 ≥5 条判据同时失配；`build.sh:41` 中止 ⇒ **部署停更**（不是「CI 红一个作业」） |
| **H-2** | `notes/knowledge-map.md` 插 `BEGIN/END:dep-graph` 标记 + 首次 `gen-dep-graph.mjs --write` + 判据 17 **同一提交** | 违反 → 判据 17 在无标记时 `hardError`（`site/tools/gen-dep-graph.mjs` 缺标记即 `exit 1`）⇒ CI 永久红 |
| **H-3** | `site/build.sh` 的门禁插入点改动与 `check-counters.mjs` 的调用点改动**同批** | 违反 → 「删脚本留调用」→ `set -e` 下构建中止 → 部署停更（05 R3） |
| **H-4**（本文档补，源自 05 §3/§4 汇总） | **先落 A6/A7 的门禁扩展**，再做 A1/A2/A4/A5 的**数据侧**改动 | 反向做 → 数据先改而判据未扩，等于「用没有判据的改动去换一个暂时变绿的基线」，A7 的 18 条判据落地时会一次性爆出大量历史失真，无法归因 |
| **H-5**（本文档补，源自 05 坑 17 归纳） | 四处「两批共改」位置**先由单一主责改一次**，另一批只做**读校验**（§1.5） | 违反 → 同一行被两批各改一次 ⇒ 冲突或「改一半」 |
| **H-6**（本文档补，源自 03 组间依赖 + 05 §6） | `F0-4` 的类集合门禁必须先**定输入面 = `site/src/**` 源码**，再写比对脚本 | 违反 → 拿 `site/dist` 当输入（实测 89 文件 / **0 HTML**）⇒ 比对基准为空，门禁恒真 |

### 1.5 单一主责表（四处「两批共改」位置，必须指定）

| # | 位置 | 冲突批次 | **单一主责** | 另一批的动作 |
|---|---|---|---|---|
| M1 | `site/src/pages/index.astro:34-35` 的 205/37 常量 与 `:112` / `learn.astro:199/:204` 的「17 个 demo」 | A4 × F1-5 | **A4**（批次 A） | F1-5 只读校验：不重写这些行，只在目检清单里确认文案 |
| M2 | `notes/knowledge-map.md:141-152` 资产↔课程映射表 | A5 × F2-1 | **A5**（批次 A） | F2-1 只做「/learn/ 或站点侧是否有该表的第二个渲染副本」的读校验，零写入 |
| M3 | `notes/mcp.md` 题库表（`:542` 表头起） | B-P5 × B-P6/F4-3 | **B-P5**（先改表结构：加「合格线」列） | B-P6 只在表**之前**（`:544` 之前安全区）插节标题，不动表行 |
| M4 | `notes/details/*.md`（8 页） | B-P4 × F4-4/F4-5 | **B-P4**（改 md 文本） | F4-4/F4-5 只改**呈现层**（`site/src/pages/details/*.astro` 的样式/栏位），不动 md |

> **M3 的额外红线**：题库节标题与表格之间**禁插任何 `#`–`###` 标题**（会截断门禁的 `inBank` 状态 ⇒ `课内嵌题` 变少 ⇒ 判据红，05 坑 7）。
> 安全插入位置：`notes/mcp.md:544`（题库节）**之前**。

### 1.6 三批次共用铁律（写进每一次提交的执行前置）

> **`notes/knowledge-map.md` 第 8–19 行之间禁插空行。** 门禁解析口径块的锚点是**第 8 行的字面量「计数口径」**
> （我复刻确认：`:8` char 627 → 块止于 `:19`），不是第 11 行的块标题。在 8–19 之间插空行 ⇒ 口径块截断 ⇒ `num()` 返回 null ⇒
> `hardError` ⇒ 门禁 exit 1 ⇒ `build.sh:41` 中止 ⇒ **Pages 停更**。（A2 的 `BEGIN/END:dep-graph` 标记必须落在 `:78-126` 图区，**不得**靠近口径块。）

---

## ② 批次划分与批次级验收门禁

### 2.1 批次定义（沿用 `00-plan-scope.md` §2，不自创）

| 批次 | 内容 | 步骤 id | 前置 |
|---|---|---|---|
| **组 0**（先决） | F0-0 构建/预览环境、F0-1 `/nav/` 进视觉回归、F0-2 selftest 落盘约定、F0-3 `mermaid-check` 可移植化、F0-4 类集合门禁 | §3 组 0 五步 | 无 |
| **批次 A** | A0 第 4 处档位副本、A1 档位唯一真源、A2 依赖图派生、A3 阅读序统一、A4 计数派生、A5 映射表补登、A6/A7 门禁扩展 | §3 批次 A 八步 | 组 0（F0-4 与 A6/A7 同批） |
| **批次 B** | B-P5 题库合格线、B-P7 术语表、B-P6 `mcp.md` S4 拆节、B-P4 `details` 8 页复核 | §3 批次 B 五步 | 批次 A 的门禁扩展（判据 13 起） |
| **批次 C** | C-P8 时点回填、C-P9 构建证据链固化 | §3 批次 C 两步 | 无（C-P9 建议最先） |
| **形式组 1** | F1-1…F1-5（入口层：首屏、11 专名、404、`/nav/`、`index` 文案） | §3 组 1 五步 | 组 0（目检能力）+ A4（M1 主责） |
| **形式组 2** | F2-1…F2-5（`/learn/` 层级与口径落点） | §3 组 2 五步 | A5（M2 主责）、A2（F2-4） |
| **形式组 3** | F3-1…F3-3（`/map` 依赖图；**与 A2 合并**） | §3 组 3 三步 | A2（同提交） |
| **形式组 4** | F4-1…F4-8（课程页与 details 呈现） | §3 组 4 八步 | B-P4（M4 主责）、A1（H-1）、B-P5（F4-3） |
| **组 5**（与组 0 合并） | 回归环境 = 组 0 的 F0-1/F0-2/F0-3（`visual-check` + `mermaid-check` + selftest） | 归入组 0 | — |

> 组 5 按 `00-plan-scope.md:38` 的原文「与组 0 相邻，可合并」处理：**不单列批次**，其内容即组 0 的 F0-1/F0-2/F0-3。

### 2.2 组 0 的门禁（先决条件：必须有可目检的 HTML）

```bash
cd /home/ubuntu/app/learn-agent-harness
# G0-1 构建环境：dist 必须产出 HTML（现状 89 文件 / 0 HTML 是残骸）
rm -rf site/dist && bash site/build.sh > /tmp/build-g0.log 2>&1; echo "EXIT=$?"
find site/dist -name '*.html' | wc -l                     # 期望 33
test -f site/dist/nav/index.html && echo nav-ok            # 期望打印 nav-ok
# G0-2 /nav/ 进视觉回归
node -e "const s=require('fs').readFileSync('site/tools/visual-check.mjs','utf8');console.log((s.match(/const PAGES = \[[\s\S]*?\n\];/)[0].match(/\{ path:/g)||[]).length)"
#                                                          期望 9（现状 8）
# G0-3 类集合门禁 + 负路径自证（F0-4）
node site/tools/check-classes.mjs; echo "EXIT=$?"           # 期望 EXIT=0，差集 0
# G0-4 mermaid-check 可移植化（不再硬编码 :10 与 :49 的 chrome 路径）
node viz/mermaid-check.mjs --help 2>&1 | head -3            # 期望打印用法（不再要求本机绝对路径）
```

**必须留浏览器目检（组 0）**：
1. `npm run preview` 后 `/learn-agent-harness/` 首屏可渲染（有 HTML ≠ 页面正确）；
2. `/nav/` 在 **375 / 768 / 1280** 三视口的布局（F0-1 的真实风险就是横向溢出，机器断言抓不到「读得顺」）；
3. 任意一页的 **mermaid 图渲染成 `<svg>`**（不是代码块）。

### 2.3 批次 A 的验收门禁（9 组可重跑命令 + 7 项目检）

```bash
cd /home/ubuntu/app/learn-agent-harness
# ── A-G1 门禁（必须绿，且判据数与副本数达标）
node site/tools/check-counters.mjs; echo "EXIT=$?"
    # 期望：末段「✅ 口径全部一致（判据 30 条 + 副本 13 处）」；EXIT=0
# ── A-G2 字形清除（A1）——注意 phase-head/phase-section/phase-desc 是 CSS 类名，必须排除
sed -n '55,68p' notes/knowledge-map.md | grep -cE '\|\s*P[0-2]\s*\|'          # 期望 0
grep -rn '\.phase\b' --include=*.ts --include=*.astro site/src/ \
  | grep -v 'phase-head\|phase-section\|phase-desc' | wc -l                   # 期望 0
# ── A-G3 第 4 处档位副本已清（A0；05 新发现，01/02/03 全漏）
grep -nE 'P[0-4] · (✅|🔄|⏳)' site/src/pages/works.astro | wc -l              # 期望 0（改为插值后不再硬编码）
# ── A-G4 依赖图派生（A2）
node site/tools/gen-dep-graph.mjs; echo "EXIT=$?"                              # 期望 EXIT=0（--check 默认只读）
node site/tools/gen-dep-graph.mjs --write >/dev/null && node site/tools/gen-dep-graph.mjs
    # 期望 二次 --check 仍 EXIT=0（幂等）
# ── A-G5 阅读序（A3）
grep -rn '#17' site/src/pages/learn.astro | wc -l                             # 期望 0
grep -n '开课顺序确认' notes/knowledge-map.md                                  # 期望命中行含 [x] 已定案
# ── A-G6 计数（A4）
grep -rn '17 个 demo\|17 demo' site/src/ README.md handoff.md | wc -l          # 期望 0
grep -c 'WORK_COUNT = 6' site/src/data/courses.ts                             # 期望 0（改为 WORK_DIRS.length）
# ── A-G7 映射表（A5）
for d in harness-demo rag-demo sandbox-demo mcp-demo durable-execution-demo framework-demo; do
  grep -q "$d" notes/knowledge-map.md || echo "✖ 漏登 $d"; done                 # 期望无输出
# ── A-G8 反向断言具备证伪能力（A6/A7）——负路径自证，必做
cp site/src/pages/404.astro /tmp/404.bak
sed -i '42s/[0-9]\+ 个/99 个/' site/src/pages/404.astro
if node site/tools/check-counters.mjs >/dev/null 2>&1; then echo "✖ 门禁恒真（未登记数字未被抓）"; else echo "✅ 负路径生效"; fi
cp /tmp/404.bak site/src/pages/404.astro
node site/tools/check-counters.mjs >/dev/null; echo "复原后 EXIT=$?"           # 期望 0
# ── A-G9 门禁耗时（防止被绕过）与零越界
/usr/bin/time -f "elapsed=%es" node site/tools/check-counters.mjs >/dev/null   # 期望 < 2s（现状 0.09s）
git status --porcelain | grep -v '^?? analysis/' | grep -v '^?? notes-restructure' | wc -l   # 期望 0
```

**必须留浏览器目检（批次 A，7 项；不得用门禁绿 / exit 0 冒充）**：
1. `/learn/` 五阶段段头 + 17 张课程卡的档位 chip（A1）；
2. `/` 首页三个 `stat-num`（`COURSE_COUNT` / `DOMAIN_COUNT` / `WORK_COUNT`）与「17 个 demo」改后文案（A4）；
3. `/c/<slug>/` 课程页 meta 栏第三个 chip（A1-c 删兜底分支后）；
4. `/map` 依赖图 + 映射表（A2/A5）——**图必须仍是四色 + `graph TD` + domain 标签**（F3-1 契约）；
5. `/nav/` 时间线前的「横向知识」定位句（A1-b）；
6. `/404`（A6-a 若采纳插值）；
7. 三个 `<meta description>`（`site/src/layouts/Base.astro:14`、`site/src/pages/nav.astro:17`、首页）的长度。

### 2.4 批次 B 的验收门禁（**已按 05 的 reject 重写**）

> 02 原 B-5（`grep 'S4\.2' notes/` 期望 0 命中）**已剔除**（reject）。替代判据：**只断言 mcp 页自身的节号自洽**，
> 不要求全仓 `S4.2/3/4` 归零（`sandbox.md:300/:311/:315`、`framework-ecosystem.md:188/:208` 是**别的课自己的**节号，动了就是越界）。

```bash
cd /home/ubuntu/app/learn-agent-harness
# ── B-1 门禁（含 B-P5 的 R-Q1/Q2/Q3 三条新判据）
node site/tools/check-counters.mjs; echo "EXIT=$?"
    # 期望 EXIT=0；判据数 12 → 15（grep -c "check(" site/tools/check-counters.mjs：13 → 16）
# ── B-2 术语表（B-P7）
node site/tools/check-terms.mjs; echo "EXIT=$?"
    # 期望 EXIT=0，并打印 11 个术语按 course-structure.ts 数组序的首现 file:line
# ── B-3 details 复核（B-P4）——先做「改动前反向复现」，再改（见 §3.B-P4 步）
node site/tools/check-details.mjs; echo "EXIT=$?"
    # 改动前：必须在 04/08 报 R-D2 红、06 报 R-D3 红、01 绿（这三红一绿就是脚本正确性的判据）
    # 改动后：EXIT=0
# ── B-4 合格线列存在（B-P5）
grep -l '合格线' notes/*.md | wc -l                        # 期望 14（14 张表各 1 次表头）
# ── B-5（替代判据）mcp 拆节自洽：新 S4B 只出现在 mcp 页，且 mcp 页内不再有指向未定义节号的引用
grep -n 'S4B' notes/mcp.md | wc -l                          # 期望 ≥2（节标题 + 目录/引用）
node -e "
const fs=require('fs');const t=fs.readFileSync('notes/mcp.md','utf8');
const heads=new Set([...t.matchAll(/^#{2,3}\s+(S[0-9]+[A-Za-z]?)/gm)].map(m=>m[1]));
const bad=new Set();
for(const m of t.matchAll(/\bS[0-9]+\.[0-9]+\b/g)){const p=m[0].split('.')[0];if(!heads.has(p))bad.add(m[0]);}
console.log('mcp.md 内引用了不存在节号的引用:',[...bad].join(',')||'无');
"                                                          # 期望「无」
# ── B-6 语料回归（不是「可跳过项」：B-P5 改了 agent-harness.md，它是 demo:eval 语料成员）
cd rag-demo && npm run demo:eval 2>&1 | tail -5            # 期望 recall/132 chunks 与改前一致或明确记录漂移
cd .. 
# ── B-7 零越界
git status --porcelain | grep -v '^?? analysis/' | grep -v '^?? notes-restructure' | wc -l   # 期望 0
```

**必须留浏览器目检（批次 B）**：
1. `/c/mcp/` 侧栏 TOC 多一条 S4B，且锚点可跳（`notes/` 的 id 算法与 Obsidian 锚点不一致，只能目检）；
2. `/map/` 术语表可跳（若 B-P7 采纳落点 (a)：`knowledge-map.md` 新增 `## 术语表`）；
3. `/details/04-token-economics/` 渲染后「本课未展开的部分」两条要点完整、无 markdown 表格/长行溢出；
4. `/c/sandbox/` 与 `/c/mcp/` 的题库表在 375px 下**新增「合格线」列后的横向溢出**（184 题里最宽的两张）。

### 2.5 批次 C 的验收门禁（4 组 + 1 项留实跑）

```bash
cd /home/ubuntu/app/learn-agent-harness
# ── C-1 不实的构建耗时数字已清除
grep -rn '484\.44\|484s' README.md notes/ .github/ site/ --exclude-dir=node_modules | wc -l   # 期望 0
# ── C-2 活文档引用可核实的 CI run
grep -rn '38554963320' README.md notes/ .github/ site/ --exclude-dir=node_modules | wc -l     # 期望 ≥1
# ── C-3 默认模型名（harness-demo 三处一致）
grep -n 'qwen3.8-flash"' harness-demo/src/llm.ts | wc -l                                      # 期望 0
grep -n 'LLM_MODEL\|qwen3.8' harness-demo/src/llm.ts harness-demo/.env.example harness-demo/README.md
    # 期望三处默认值一致（均为 -next 形态）
# ── C-4 口径块改动后仍可解析 + 裸版本断言
node site/tools/check-counters.mjs; echo "EXIT=$?"                                            # 期望 0
# ── C-5 零越界
git status --porcelain | grep -v '^?? analysis/' | grep -v '^?? notes-restructure' | wc -l    # 期望 0
```

**必须留实跑**：`cd harness-demo && npm run demo`，观察默认模型切换后的真实行为。
依赖活端点 `LLM_BASE_URL`——**本轮未验证**；端点不可用则写「未验证（端点不可用）」，**不得**当作已通过。

**必须留浏览器目检（批次 C）**：`/nav/` 的时间线定位句与 `asOf` 文案措辞（C-P8 改了 `nav.astro:31`）。

---

## ③ 逐步执行清单（每步 10 字段，自足）

> **读法**：每步 10 字段固定顺序 = `id / 目标 / 现状证据(file:line) / 具体改法 / 派生还是手工 / 验收命令（可重跑）/ 回滚点 / 依赖 / 工作量 / 风险`。
> **验收一律两分**：`可机器验证` 给命令与期望输出；`必须留浏览器目检` 明显单列，**不得**用 HTTP 200 / 构建成功 / exit 0 冒充。
> **插入顺序**：组 0 → 批次 A → 批次 B → 批次 C → 形式组 1 → 组 2 → 组 3（⧺ A2）→ 组 4。批次 A 与组 3 是**同一提交**（G-MAP）。

---

### 组 0｜构建与预览环境（先决；组 5 的回归环境即 F0-1/F0-2/F0-3，不单列）

#### 步 G0-1｜〈F0-0〉构建/预览环境诊断与 `site/dist` 残骸处理

- **id**：`F0-0`
- **目标**：把「`site/dist` 89 文件 / **0 HTML**」从现象定位到机制，并明确「能不能清、清了会怎样、重建要付什么代价」。
- **现状证据**：`find site/dist -type f | wc -l` → **89**；`find site/dist -name '*.html' | wc -l` → **0**（我复跑确认，见 §0.3 V10 同批命令）；
  `site/build.sh:41` 的门禁在 `astro` 之前（fail fast），`:55/:57` 才是 `astro build`；`verify.yml:105` 是 `test "$count" -eq 33`。
- **具体改法**：
  1. **先落盘证据**（在 `/tmp` 日志丢失前）：`mkdir -p site/tools/out && find site/dist -type f -printf '%p %s\n' | sort > site/tools/out/dist-residue.txt`
     —— 这是**唯一**允许写 `site/tools/out/` 的动作，且只写这一个诊断文件；其余一律只读。
  2. `cp site/build.sh site/build.sh.bak` 后跑一次完整构建并**落盘日志**：`bash site/build.sh > site/tools/out/build-$(date +%s).log 2>&1; echo EXIT=$?`
  3. 残骸处理：`rm -rf site/dist`（**只删 `site/dist`**）。**明确不要删**：`site/.astro/`、`site/node_modules/`（删了会拉长重建且与本次目标无关）。
  4. 若本机构建再次被杀（内存争用，05 F-U2 记为未验证）：**不重试第三次**，记录「本机重建不可靠，以 CI `verify.yml` 的 Build sanity 为权威判据」后继续——组 0 的目的是**拿到可目检的 HTML**，不是证明本机能构建。
- **派生还是手工**：**手工**（一次性运维动作，不是每次构建都要做）。「本机重建是否可靠」这件事由 CI 的等值断言 33 派生覆盖。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `find site/dist -name '*.html' | wc -l` → 期望 **33**；（构建失败时记「未达成（本机构建被杀）」，转 CI 判据）
    2. `test -f site/dist/nav/index.html && echo nav-ok` → 期望打印 `nav-ok`；
    3. `git status --porcelain site/dist` → 期望**无输出**（`site/dist` 应在忽略列表内；若出现条目立即停止并报告，不要提交构建产物）；
    4. `ls site/.astro site/node_modules >/dev/null && echo untouched` → 期望打印 `untouched`（证明没有顺手删缓存）。
  - **必须留浏览器目检**：`npm run preview` 后打开 `/learn-agent-harness/`，确认**首屏渲染出内容**（有 HTML ≠ 页面正确；这是 05 F-U3 明确记为未验证的项）。
- **回滚点**：`site/dist` 是构建产物（`rm -rf` 可逆：重跑 `bash site/build.sh`）；`site/dist` 与 `site/tools/out/*.log` 均**不入库**。
  若第 1 步的 `dist-residue.txt` 需要保留，把它记入提交说明而不是入库。
- **依赖**：无（组 0 是其余各组的先决）。
- **工作量**：**S**（`rm -rf` + 一条构建命令 + 4 条只读判据）。理由：动作本身极小；不确定性在「本机重建会不会被杀」，那**只增加失败概率，不增加工作量**。
- **风险**：① 在日志落盘前 `/tmp` 被清 ⇒ 已用改法第 1/2 步规避；② 顺手删 `site/.astro`/`node_modules` ⇒ 已显式列为「不要删」并加验收第 4 条；
  ③ 把「本机重建成功」当成 CI 绿的替代 ⇒ 验收里已把 CI 的等值断言 33 列为**权威判据**。

#### 步 G0-2｜〈F0-1〉`/nav/` 进入 375/768/1280 三视口视觉回归

- **id**：`F0-1`
- **目标**：33 页里唯一**没有任何几何/截图回归**的 `/nav/` 进入三视口断言。
- **现状证据**：`site/tools/visual-check.mjs:63-73` 的 `PAGES` 数组实测 **8** 条（我复跑：`{ path:` 计数 = 8，§0.3 V7）；
  `verify.yml:106` 的关键页清单**已含** `nav/index.html`（说明 CI 认为它是关键页，但几何回归没覆盖它）。
- **具体改法**：
  1. `site/tools/visual-check.mjs:63-73`：在 `PAGES` 数组内新增一条 `{ path: 'nav/', mustHave: '.cards .card' }`
     —— **`mustHave` 选 `.cards .card`**（代际卡，由 `LLM_EVOLUTION` 派生，数量稳定）；
     **不要**选 `.nav-course-group`（5 个阶段数会变，会造成假红）。
  2. 加固：`checkOne` 的断言通道要**真的断言 `mustHave` 命中**（不是「页面非空」）——若现状只在 fault 模式用 `mustHave`，则补一条正常模式下的存在性断言。
  3. 连带文案（**同批改，不许只改一半**）：`README.md` 里记录的「24 组合」→ **27 组合**；`site/tools/README.md`（若存在）同改。
- **派生还是手工**：**手工改一处常量表**；3 视口由工具自身派生。页面清单本身**不应**变成第三份手抄副本——建议让 `PAGES` 与 `verify.yml` 关键页清单、口径块的「站点 html 33」同源（与 A6/A7 合并，见步 GA-7）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `node -e "const s=require('fs').readFileSync('site/tools/visual-check.mjs','utf8');console.log((s.match(/const PAGES = \[[\s\S]*?\n\];/)[0].match(/\{ path:/g)||[]).length)"` → 期望 **9**；
    2. `grep -n 'nav/' site/tools/visual-check.mjs` → 期望命中新增那行；
    3. `grep -rn '24 组合\|24 combinations' README.md site/tools/` → 期望 **0 命中**（已改为 27）；
    4. `node site/tools/visual-check.mjs --base "http://127.0.0.1:4173/learn-agent-harness/" --out site/tools/out` → 期望 exit 0
       （**注意**：这条**会写 `site/tools/out/`**，只能在**执行轮**跑，本轮/只读轮禁跑）。
  - **必须留浏览器目检**：`/nav/` 在 **375px** 是否横向溢出（这是本条的**真实风险**，几何断言只测溢出、测不出「读得顺」）；768/1280 下代际卡不换行错位。
- **回滚点**：`git checkout -- site/tools/visual-check.mjs README.md`（单文件级；`site/tools/out/` 是产物，不入库）。
- **依赖**：**G0-1**（没有可用 `dist` 时断言跑不起来）；与 A6/A7 的口径块同步（`PAGES`/关键页/33 三处同源）→ 合并进 GA-7。
- **工作量**：**S**（一行常量 + 一处文案 + `mustHave` 加固；加固是 M 的一半量级）。理由：改动面小，成本在目检 3 视口。
- **风险**：① 选错 `mustHave` 容器 → 假红 ⇒ 已指定 `.cards .card`；② 只加页面不加断言点 → 漏「整段没渲染」⇒ 已给加固；
  ③ 断言数 24→27 让 README/run 记录的旧值失真 ⇒ 与文案同批改。

#### 步 G0-3｜〈F0-2〉`--selftest` 落盘约定改到系统临时目录

- **id**：`F0-2`
- **目标**：把「本机预检」从**写工作区**改成**写系统临时目录**；同时**不动** CI 产物路径（`site/tools/out` 是 artifact 契约）。
- **现状证据**：`site/tools/visual-check.mjs` 的 `OUT` 默认值（文件头 `:1-20` 区域）与 `:369`/`:432` 两处 selftest 落盘点；
  `README.md:29` 宣传的 preflight 命令（引用前**必须先读原文确认行号**，见 §6 U-3）。
- **具体改法**：
  1. `site/tools/visual-check.mjs`：新增 `const TMP_OUT = require('os').tmpdir() + '/visual-check-selftest'`；
     `--selftest` 分支的落盘改走 `TMP_OUT`（`:369`、`:432` 两处）。
  2. **不改** `OUT`（主流程默认 `site/tools/out`）——它被 `verify.yml:140/:142` 的 `--out tools/out` 显式传入，也是 artifact 上传路径。
  3. `README.md:29`：把 preflight 那句写成两句话——「主流程产物在 `site/tools/out`（CI artifact）」「`--selftest` 的临时报告在 `$TMPDIR`」。
- **派生还是手工**：**手工**（一次性路径默认值 + 一行提示 + 一句文档）。落盘位置是常量，没有可派生的真源。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `grep -n 'tmpdir()' site/tools/visual-check.mjs` → 期望 ≥1 命中；
    2. `git status --porcelain` 在跑过 `--selftest` 后**不得**出现 `site/tools/out/` 下的新文件
       （**注意**：`--selftest` 属**写盘**动作，**只读轮/本轮禁跑**；执行轮跑后必须核对这条）；
    3. `grep -n 'OUT' site/tools/visual-check.mjs | head -5` → 确认主流程默认值仍是 `site/tools/out`；
    4. `grep -n 'selftest' README.md` → 期望命中新写的那句（含 `$TMPDIR`）。
  - **必须留浏览器目检**：**无**（本步不改变任何页面渲染）。这是少数**不需要**目检的步骤，明确写出来以免被误认为漏写。
- **回滚点**：`git checkout -- site/tools/visual-check.mjs README.md`。
- **依赖**：无（可与 G0-2 同一次改：同文件、行号不重叠——G0-2 在 `:63-73`，本步在 `:1-20`/`:369`/`:432`）。
- **工作量**：**S**（3 处行级编辑 + 1 句 README）。理由：真正成本是「跑一次 selftest 验证默认不落盘」，而 selftest 用 fixture，本机跑得动。
- **风险**：① 顺手改了 `OUT` 默认值 ⇒ 打断 CI artifact 上传（已点名「不动」）；② selftest 不进 CI，改到 tmpdir 后影响为零；
  ③ 把 `--out` 语义改成「selftest 与主流程共用」⇒ 两个命令两种路径语义（已用两句 README 文案钉死）。

#### 步 G0-4｜〈F0-3〉`viz/mermaid-check.mjs` 可移植化

- **id**：`F0-3`
- **目标**：`viz/mermaid-check.mjs` 不再写死本机路径，能在别的 checkout / 别的机器上直接跑。
- **现状证据（行号已修正）**：`viz/mermaid-check.mjs:**10**` `const DIST = '/home/ubuntu/app/learn-agent-harness/site/dist';`
  （04/03 曾记 `:9`，**实测 `:10`**）；**另有一条 `:49` 的 chrome 路径**未被 ④ 登记（03 就地更正）；
  `viz/render.mjs:58-66` 有可复用的 chrome 候选表。
- **具体改法**：
  1. `viz/mermaid-check.mjs:10`：改为从 `import.meta.url` 派生：
     `const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'site', 'dist');`
  2. `:49` 的 chrome 路径：抽 `viz/chrome.mjs`，导出 `resolveChrome()`，候选表复用 `viz/render.mjs:58-66`；
     `render.mjs` 与本文件都改为 `import { resolveChrome } from './chrome.mjs'`（**保持 `render.mjs` 的候选顺序不变**）。
  3. 保留 `CHROME_PATH` 环境变量优先（若原实现已有，不要删）。
- **派生还是手工**：**派生**（路径从 `import.meta.url` 派生，浏览器从候选表探测）。等价于纪律 #5「修显示值不如修生成器」。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `grep -n "/home/ubuntu" viz/mermaid-check.mjs viz/render.mjs viz/chrome.mjs` → 期望 **0 命中**；
    2. `node -e "import('./viz/chrome.mjs').then(m=>console.log(m.resolveChrome()))"` → 期望打印**真实存在**的 chrome 绝对路径（打印后 `test -x` 校验）；
    3. `grep -n 'candidates\|resolveChrome' viz/render.mjs` → 期望命中 import，且候选顺序未被改动（`git diff viz/render.mjs` 只应有 import 行变化）；
    4. `node viz/mermaid-check.mjs 2>&1 | head -3` → 期望**不再**报「找不到 chrome」类错误；
       （本条**会读 `site/dist` 并可能写产物**，执行轮跑；`dist` 为空时应打印明确提示而不是崩栈）。
  - **必须留浏览器目检**：**无**——但需**目检 mermaid 图的渲染结果**（本步之后 `/map`、各课程页的 mermaid 应仍渲染成 `<svg>`），这与 A2 共用同一次目检。
- **回滚点**：`git checkout -- viz/mermaid-check.mjs viz/render.mjs` 并 `rm viz/chrome.mjs`。
- **依赖**：与 G0-1 弱相关（不修也能改代码，只是改完无法端到端验证）。
- **工作量**：**M**。理由：抽 `viz/chrome.mjs` 要同时改两个调用方并保持 `render.mjs` 行为不变（它带 node12 re-exec 自举逻辑，回归面比 `mermaid-check` 大）；**不抽模块则是 S**，执行轮按人力选。
- **风险**：① 抽模块时改了 `render.mjs` 的候选顺序 ⇒ 原本能渲染的机器反而找不到浏览器 ⇒ 验收第 2/3 条要求打印真实路径；
  ② 只改 `:10` 不改 `:49` ⇒ 换机器仍挂（`:49` 是 04 未登记的另一条）；③ `dist` 为空时崩栈而不是提示 ⇒ 验收第 4 条要求打印明确提示。

#### 步 G0-5｜〈F0-4〉类集合门禁（纪律 #9 升级为可重跑脚本）

- **id**：`F0-4`｜**输入面已按 05 坑 18 修正**：基准 = **`site/src/**` 源码**，**不以 `site/dist` 为输入**（实测 `dist` = 89 文件 / **0 HTML**，拿它当基准 ⇒ 门禁恒真）。
- **目标**：把「CSS 定义的类集合 vs 页面实际输出的类集合」的比对从**一次性检查**升级为**可重跑门禁**，防「选择器挂在从未存在的祖先类下而静默失效」。
- **现状证据**：第一轮差集 **35** 项、第二轮（剥注释 + 认动态类 + 白名单）**10** 项，真死仅 **3** 项：
  `.details-entry` / `.works-note` / `.lf-count-note`（03 §0.2 的双轮脚本可原样重跑，见 §0.3 的方法说明）。
- **具体改法**：
  1. 新建 `site/tools/check-classes.mjs`：把 03 §0.2 的脚本固化，并加三处加固：
     - **输入面断言**：脚本首行断言 `site/src` 下存在 `.astro` 文件、且**不读** `site/dist`（若 `dist` 存在也忽略）；输入为空即 `exit 1` 并打印「输入面为空，拒绝宣告绿」；
     - **白名单**：只有 3 个真死选择器可被显式处理，白名单**必须有失效检测**（白名单里的项一旦变成「已定义且已使用」→ 报「失效白名单项」并 exit 1）；
     - **负路径自证**：加 `--self-test` 分支，故意注入一个死选择器 → 必须报出。
  2. 处理 3 个真死选择器（**D1 未决，见 §6**）：默认按 (a) 直接删 `.lf-count-note`（`site/src/pages/learn.astro:341`）。**等 D1 拍板后再删**。
  3. 与批次 A 的门禁扩展**同批**接入 `site/build.sh` 的同一段插入点（`:41-46` 之后），保证「删脚本必删调用」（H-3）。
- **派生还是手工**：**派生**（集合比对完全由脚本派生）；3 个死选择器的处置是**手工**动作。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `node site/tools/check-classes.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`，打印「定义集 N / 差集 0 / 白名单 M 项全部有效」；
    2. `node site/tools/check-classes.mjs --self-test; echo "EXIT=$?"` → 期望**非 0**（注入的死选择器必须被抓）；
    3. **输入面反例（必做）**：临时把 `site/src` 复制规则打破（如把脚本输入面指向空目录）→ 必须 `exit 1` 且打印「输入面为空」；
       `grep -n "site/dist" site/tools/check-classes.mjs` → 期望**不出现**作为输入路径的写法（只允许出现在注释/断言里）；
    4. `bash site/build.sh` 在门禁失败时应中止（删掉 `check-classes.mjs` 后跑一次 **必须**中止，验证 H-3）——**执行轮做，做完复原**。
  - **必须留浏览器目检**：删/改那 3 个选择器后，`/details/<任一篇>`（`.details-entry`）、`/works/`（`.works-note`）、`/learn/` 口径脚注（`.lf-count-note`）三处的**视觉是否真的没有变化**——
    这是本条的**唯一**目的（集合比对证明「没有代码引用它」，但「删了会不会丑」只能目检）。
- **回滚点**：`rm site/tools/check-classes.mjs` **并同时**撤回 `site/build.sh` 里的调用（**两条必须同一提交**，否则 `set -e` 下构建中止 → 部署停更）。
- **依赖**：**G0-1**（目检需要 HTML）；**与批次 A 的 A6/A7 同批**（同改 `site/build.sh` 插入点）。
- **工作量**：**M**。理由：脚本骨架可从 03 §0.2 照抄（省 1 小时），成本在白名单失效检测 + 负路径自证 + 三处目检。
- **风险**：① 拿 `dist` 当输入 ⇒ 门禁恒真（已由输入面断言 + 反例验收封死）；② 白名单退化成「全豁免」⇒ 已要求失效检测（这与 05 对 A6-b 的要求同源）；
  ③ 与 A6/A7 抢 `build.sh` 同一插入点 ⇒ 必须同批，见 H-3/G-CC。

---

### 批次 A｜口径治本（**单次提交**，内部硬顺序 H-1/H-2）

> **执行前置（三批次共用铁律，见 §1.6）**：`notes/knowledge-map.md` **第 8–19 行之间禁插空行**。
> **本批次的文件集**：`site/src/data/courses.ts`、`site/src/data/course-structure.ts`、`site/src/pages/c/[slug].astro`、
> `site/src/pages/learn.astro`、`site/src/pages/works.astro`、`site/src/pages/index.astro`、
> `site/src/pages/nav.astro`、`notes/knowledge-map.md`、`site/tools/check-counters.mjs`、`site/tools/gen-dep-graph.mjs`（新）、
> `site/build.sh`、`README.md`。

#### 步 GA-1｜〈A0 + A1〉阶段唯一真源：清「优先级」字形 + 第 4 处档位副本 + `phase` 三步瘦身

> **为什么 A0 与 A1 合并**：它们都在治「同一桩事实的多份手抄」，且都必须在 `check-counters.mjs` 的解析锚点改动**之后**完成（H-1）。
> A0（`works.astro` 三处活错值）是 05 新发现、01/02/03 三份设计全漏的第 4 份档位副本，单独做会被 A1 的判据 14 漏掉。

- **id**：`A0-works-stage-copy` + `A1-stage-single-source`
- **目标**：让「一门课属于哪一档」全仓只有一个答案——`site/src/data/course-structure.ts` 的 `stage`（严格五档 P0–P4）；
  `notes/knowledge-map.md` 课程总表不得再用 `P0/P1/P2` 这组**字形**表达任何东西；横向两课（`llm-timeline`/`industry-2026`）的阶段身份全仓统一；
  `courses.ts` 的 `phase` 字段（承载两个不同事实的 legacy 字段）拆开后清退。消除「读者按 P0 判断先学什么时看到课程卡 P1」的直接误导。
- **现状证据**：
  - **`phase` 在运行代码只有 3 个读点**（我复核 01 的 grep）：`site/src/data/courses.ts:279`（`DOMAIN_COUNT` 过滤）、`site/src/pages/c/[slug].astro:61`（兜底 chip）、`site/tools/check-counters.mjs:127`+`:141`（**解析锚点**：正则 `/slug: '([^']*)', domain: '([^']*)', phase: '([^']*)'/g` **要求三字段同现**）。`site/src/pages/nav.astro:309` 的 `.phase-head` 是 **CSS 类名，不是字段读方**。
  - **R2 是死分支**：`c/[slug].astro:15-20` 的 `getStaticPaths()` 用 `EXCLUDED_FROM_COURSE_ROUTE`（`courses.ts:331` = `{'knowledge-map','interview-bank'}`）过滤，`structure = courseBySlug(entry.id)` 来自 `COURSE_STRUCTURE`（17 门，含横向两课）⇒ 实际生成的每个 `/c/<slug>/` 页 `structure` 恒 truthy。
  - **冲突真值 9/14**：`notes/knowledge-map.md` 课程总表：表头 `:53`、数据行 `:55-68`（14 行）；与 `course-structure.ts` 的五档对比后 **9 行冲突 / 5 行一致**。
  - **第 4 处档位副本（05 新发现，01/02/03 全漏）**：`site/src/pages/works.astro` 6 处档位标签（我实测 `:94 :149 :224 :262 :296 :330`），其中 **3 处是活错值**：
    `:224` 沙箱写 `P0`（真值 `course-structure.ts:168` = `P1`）、`:296` durable 写 `P1`（真值 `:238` = `P2`）、`:330` 框架生态写 `P2`（真值 `:344` = `P4`）。**这三处不在 `check-counters.mjs` 任何判据内。**
  - `notes/process/site-refactor-plan.md:474`/`:484` 的「3 个消费方」表述已过时（其中 1 个死分支、1 个脚本锚点）。
- **具体改法**（3 个子块，按 H-1 的顺序执行）：
  - **① `works.astro` 第 4 处副本（A0）**：把 `:94/:149/:224/:262/:296/:330` 六处的字面量 `P<n>` **改为从 `COURSE_STRUCTURE` 插值**
    （例如 `` `沙箱与凭据（${stageOf('sandbox')} · 🔄 S2 已实现）` ``，`stageOf` = 新增的 3 行查表函数）。
    **不要**只把 `:224` 的 `P0` 改成 `P1` —— 那就是「修显示值不修生成器」，下次仍会漂。同时把这三处登记进 A6 的副本白名单（判据 29/30）。
  - **② `notes/knowledge-map.md`（A1-a/A1-b）**：
    - `:53` 表头 `| 主题 | 优先级 | 状态 | … |` → `| 主题 | 阶段（引自 course-structure.ts） | 状态 | … |`；
    - `:55-68` 每行第 2 列**逐行替换为 `stage` 真值**（改后列值：从零写 harness P0 / RAG P0 / 系统设计 P0 / 可观测 P2 / 沙箱 P1 / 长期记忆 P3 / durable P2 / 评测工程化 P1 / MCP P1 / API P2 / 数据飞轮 P3 / 模型基础 P3 / 框架生态 P4 / 多智能体编排 P1）；
    - `:70` 表下那句「口径：课程总表 14 行 = 14 个编号课」**保留**（那是另一个事实），其后追加一句：阶段列唯一源为 `site/src/data/course-structure.ts` 的 `stage`，本表为该列**只读副本**，由判据 14 机器校验；
    - `:12` 把「不计入门数」精确化为「不计入**知识域门数**；在 `/learn/` 中以 `isHorizontal: true` 标记、**不参与阶段链**」；
    - **禁止**在表外加「= P0/基础篇」之类字形映射说明（那是第二套字形，等于把冲突搬个位置）；
    - **`site/src/pages/nav.astro:21`「位于 P0 之前」** → 与 `learn.astro:282` 统一为同一套词：「横向知识（不属于 P0–P4 任一阶段；先读可建立代际判断，但不构成前置）」（同时修掉「在 P0 之前」被读成前置、「不挂在任一阶段上」被读成无定位的对立）；
    - `:128` 的箭头链（06/08 记为「多智能体第 2 位」）→ 见步 GA-3（A3），**不在本步改**；
    - **红线**：本步的所有编辑**不得**落在 `:8-19` 口径块内（§1.6）。
  - **③ `courses.ts` 的 `phase` 三步瘦身（A1-c）** —— **必须按序，不得跳步**：
    - **步骤 1（解耦 R1）**：`courses.ts:279` 的 `c.phase !== HORIZONTAL_PHASE` → `!HORIZONTAL_SLUGS.has(c.slug)`；新增 `const HORIZONTAL_SLUGS = new Set(['llm-timeline','industry-2026'])`；`HORIZONTAL_PHASE` 标 `@deprecated` 并于**同一提交**内删除。
      **05 修正（已修正）**：`DOMAIN_COUNT` **直接由 `COURSE_STRUCTURE` 派生**（15 个非横向 slug 的 `domain` 串与 `courses.ts` 的 17 门**逐字相同**，05 用 `diff` 全等校验过），**禁止**因此新增第 5 份横向清单；
      判据 15 仍保留作互锁（`HORIZONTAL_SLUGS` 必须逐元素等于 `COURSE_STRUCTURE.filter(c=>c.isHorizontal).map(c=>c.slug)`）。
    - **步骤 2（清 R2）**：`c/[slug].astro:61` 整段兜底分支删除 → `<span class="chip">{structure.stage}</span>`；`:27-28` 注释改为「structure 缺失即 fail-fast」；**更强做法**：`:29` 后加构建期断言 `if (!structure) throw new Error(...)`，把「死分支」变成「不可能」（与本仓既有 fail-fast 风格一致：`mvps.ts:161`、`DomainMap.astro:46-49`）。
    - **步骤 3（删字段）**：确认 R1/R2/R3 全部清掉后，删 `courses.ts:37` 的 `phase` 声明、`:50-233` 全部 17 行数据里的 `phase: '…'` 片段、`:260` 的 `HORIZONTAL_PHASE`、`:300` 的收口注释、`:312` 的 `DEFAULT_META.phase`。
      **必须与判据 16（改 `check-counters.mjs:127` 解析锚点）同一提交**。
  - **④ `notes/process/site-refactor-plan.md:474`/`:484` 就地划改**（纪律 #4：不许只追加）：改为「1 个活读点（`DOMAIN_COUNT` 过滤）+ 1 个死分支 + 1 个门禁解析锚点；三者的清退见 A1-c」。
- **派生还是手工**：**手工改字形 + 派生锁值**。`:55-68` 的阶段列是**手工写、机器锁**（判据 14 逐行重算比对）；`works.astro` 六处改插值后**零手工**。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `sed -n '55,68p' notes/knowledge-map.md | grep -cE '\|\s*P[0-2]\s*\|'` → 期望 **0**；
    2. `grep -rn '\.phase\b' --include=*.ts --include=*.astro site/src/ | grep -v 'phase-head\|phase-section\|phase-desc' | wc -l` → 期望 **0**
       （**已修正**：必须排除 `.phase-head/.phase-section/.phase-desc` 三个 CSS 类名，否则会追幽灵）；
    3. `grep -rn "phase: '" site/src/data/courses.ts | wc -l` → 期望 **0**（步骤 3 完成后）；
    4. `grep -nE 'P[0-4] · (✅|🔄|⏳)' site/src/pages/works.astro | wc -l` → 期望 **0**（已改插值）；
    5. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望末段「判据 30 条 + 副本 13 处」、`EXIT=0`
       （**关键**：本步与判据 13/14/15/16 必须同一提交，否则这条会红）；
    6. `grep -n 'HORIZONTAL_SLUGS' site/src/data/courses.ts` → 期望存在，且**不得**出现第三/第四份横向清单
       （`grep -rc "llm-timeline" site/src/data/*.ts` 逐文件核，除 `course-structure.ts` 与 `courses.ts` 外应为 0）；
    7. `grep -n '3 个消费方' notes/process/site-refactor-plan.md | wc -l` → 期望 **0**（已就地划改）。
  - **必须留浏览器目检**：
    ① `/learn/` 五阶段段头 + 17 张课程卡的档位 chip（A1 的主目标）；
    ② **`/works/` 六张作品卡的档位标签**（A0 的主目标，`P0/P1/P2/P4` 是否与课程卡一致）；
    ③ `/c/<slug>/` 课程页 meta 栏第三个 chip（步骤 2 删兜底分支后仍显示五档）；
    ④ `/nav/` 时间线前的「横向知识」定位句（A1-b 的新词）；
    ⑤ `/c/llm-timeline/` 与 `/c/industry-2026/` 两页在 P0 段头下的归属是否读得通（D1 未决，见 §6）。
- **回滚点**：三步各自独立可回滚。步骤 1/2 = `git checkout -- site/src/data/courses.ts site/src/pages/c/[slug].astro`；
  步骤 3 = revert 那一个提交（纯删除，回滚干净）；`notes/knowledge-map.md` 与 `works.astro` = 文件级 `git checkout`。
  **注意**：回滚步骤 3 必须**同时**回滚判据 16，否则门禁红（同提交原则）。
- **依赖**：`G0-1`（目检需要 HTML）；判据 13/14/15/16 必须同轮（见步 GA-6）；D1 拍板后才动「横向两课在 `/learn/` 的归属」（其余部分不依赖 D1）。
- **工作量**：**M**。理由：`km` 14 行逐行核值 + `courses.ts` 三处删改（17 行数据）+ `works.astro` 6 处插值 + 一处报告划改；
  单处都小，但**必须同一次提交**且判据 13–16 要一起落地，协调成本高于编辑成本。
- **风险**：① **顺序错** → 门禁 ≥5 条判据同时失配 → `build.sh:41` 中止 ⇒ **Pages 停更**（**已修正**：这不是 `hardError`，报错更难读）；
  ② 在 `km:8-19` 插空行 → 口径块截断 → `hardError`（§1.6 铁律）；
  ③ 顺手给 `works.astro` 新增第二份 `stageOf` 查表 ⇒ 制造第 5 份副本（必须复用 `course-structure.ts`）；
  ④ 引入 `HORIZONTAL_SLUGS` 后忘掉判据 15 ⇒ 这一步**比现状更差**（现状至少读的是数据字段）；
  ⑤ 把 `STAGE_COUNTS`（17 门）语义改掉 ⇒ 连带 `nav.astro:103`、`learn.astro:80/:116/:272`、`index.astro:82` 四处失真。

#### 步 GA-2｜〈A2 + F3-1/F3-2/F3-3〉依赖图改为派生（受保护区间 + 生成器 + 双门禁）

> **本步与形式组 3 是同一提交**（G-MAP）。**已修正 3 处**：① 生成器模板必须吸收 F3-1 的 6 条契约（不得原样照抄 01 的伪码风险）；
> ② 判据 17 必须与标记插入 + 首次 `--write` 同一提交（H-2）；③ `INTERVIEW` 边**12 条（8 实线 + 4 虚线）**，不是 4 条也不是 11 条。

- **id**：`A2-dep-graph-derive`（含 `F3-1` 生成器契约、`F3-2` `/map` 分工说明、`F3-3` 图区呈现）
- **目标**：`notes/knowledge-map.md` 的依赖图从**手抄 mermaid** 变成**由 `course-structure.ts` 的 `prereqs` 派生**，
  且「图与 prereqs 不一致」这件事**在门禁里可被断言**——不再依赖人眼比对。
- **现状证据**：
  - 图区 = `notes/knowledge-map.md:78-126`（`## 依赖图` 在 `:76`，mermaid 围栏起于 `:78`）；**当前无 `BEGIN/END:dep-graph` 标记**（我复跑：`grep -c 'BEGIN:dep-graph'` = **0**，§0.3 V3）。
  - **节点口径（05 已勘误，实为）**：**17 个节点定义** = **14 个课程节点**（带档位标签）+ **2 个横向资产节点** + **1 个 hub**；与五档**冲突 9 / 一致 5**；**`agent-harness` 整条节点缺失**（成立）；`classDef todo` 定义 **0 使用**；状态用了**第三套词表**（`courses.ts` ✅/🔄/⏳ vs `classDef done/doing/todo` vs 图上 ✅/📐/🎯，而 `📐` **在两套真源里都不存在**）。
  - **指向 `INTERVIEW` 的边 = 12 条**（我复跑：`--> INTERVIEW` 8 + `-.-> ` 4，§0.3 V4）。01 内部三个数字（4 / 11 / 12）不一致，**故三个都不许当事实**——
    本步采用**我实测的 12（8 实线 + 4 虚线）**作为「必须显式区分」的输入，并把「4/11/12 三版数字必须定版」列入 §6 未决决策点。
  - `site/tools/check-counters.mjs` 现有 12 条判据里**没有**任何一条读这张图。
- **具体改法**：
  1. **标记插入（先于生成器）**：在 `:78` 前插 `<!-- BEGIN:dep-graph（本区间由 site/tools/gen-dep-graph.mjs 生成，改图请改 course-structure.ts 的 prereqs） -->`，
     在 `:126` 后插 `<!-- END:dep-graph -->`。**红线**：标记不得靠近 `:8-19` 口径块（§1.6）。
  2. **新建 `site/tools/gen-dep-graph.mjs`**：默认 `--check`（**只读**，比对区间文本与从 `prereqs` 渲染的结果，不一致即非 0 退出并打印差异边清单）；
     `--write` 才写盘。骨架要点（含 01 的可照抄伪码 + **F3-1 的 6 条契约**）：
     - **解析自检**：解析到的课程数 ≠ 17 即 `throw`（防止 manifest 变了却静默产出一张空图）；
     - **契约 1**：方向必须是 `graph TD`（**不是** `flowchart LR`）；
     - **契约 2**：节点标签用 `domain`（**不是** slug）；
     - **契约 3**：必须保留 **4 个 `classDef`**（`done`/`doing`/`todo`/`hub`）⇒ 四色不丢；`todo` 空置但**保留并注明**（D9）；
     - **契约 4**：必须新增 **`agent-harness` 节点**（现状缺失）；
     - **契约 5**：`INTERVIEW` 的 **12 条边显式区分**（8 实线 + 4 虚线），并改为**一句文字列表**承载（见判据 18）——否则派生会把它们判成非法边；
     - **契约 6**：状态 emoji 只用**真源已有的词表**（`courses.ts` 的 ✅/🔄/⏳），不得用 `📐`（该字形两套真源都没有）；
     - **D9 未决**：是否加第 5 色表达 `isHorizontal` —— 按 (a)+(c) 倾向实现，**等 D9 拍板**；
     - **D10 未决**：是否抽 `site/tools/parse-courses.mjs` 共享解析 —— 按 (b) 倾向实现（避免两份算法漂移）；
     - **D12 未决**：是否按阶段 `subgraph` 聚类 —— 按 (a) 倾向（纯派生不聚类）。
  3. **门禁接入（判据 17 + 判据 18）**：`check-counters.mjs` 末尾对同一区间做**逐字节**比对（判据 17）；
     判据 18 断言「替代 `INTERVIEW` 虚线边的那个文字列表」的课程集合 == `COURSE_STRUCTURE` 中「`next` 为空或 `stage ∈ {P2,P3,P4}`」的集合。
     **判据 17 与第 1/2 步同一提交**（H-2）。
  4. **`/map` 分工说明（F3-2）**：`site/src/pages/map.astro` 在 `DomainMap`（交互视图）与下方渲染图之间加一句分工说明（D11 未决：(a) 共用 `slot="before"` / (b) 放进默认 slot 正文之前；倾向 (b)）。
  5. **`/learn/` 侧只改一遗（F2-4）**：`site/src/pages/learn.astro:188` **保持不动**；若 A2 落地，则在 `knowledge-map.md` 图区上方**同批**补一句「本图由 `course-structure.ts` 的 `prereqs` 派生」，使 `/learn/` 的引用句与图区自述互相印证。
- **派生还是手工**：**派生**（图文本由 `prereqs` 派生，判据 17 逐字节比对）。`/map` 的分工说明是**手工一句**。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `node site/tools/gen-dep-graph.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`（默认只读 `--check`）；
    2. **幂等**：`node site/tools/gen-dep-graph.mjs --write >/dev/null && node site/tools/gen-dep-graph.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`；
    3. `grep -c 'BEGIN:dep-graph' notes/knowledge-map.md` → 期望 **1**；
    4. `sed -n '/BEGIN:dep-graph/,/END:dep-graph/p' notes/knowledge-map.md | grep -c 'graph TD'` → 期望 **1**（契约 1）；
    5. `sed -n '/BEGIN:dep-graph/,/END:dep-graph/p' notes/knowledge-map.md | grep -c 'agent-harness'` → 期望 **≥1**（契约 4）；
    6. `sed -n '/BEGIN:dep-graph/,/END:dep-graph/p' notes/knowledge-map.md | grep -c 'classDef'` → 期望 **4**（契约 3）；
    7. `sed -n '/BEGIN:dep-graph/,/END:dep-graph/p' notes/knowledge-map.md | grep -c '📐'` → 期望 **0**（契约 6）；
    8. `node -e "const t=require('fs').readFileSync('notes/knowledge-map.md','utf8');const s=t.split('BEGIN:dep-graph')[1].split('END:dep-graph')[0];console.log('实线 INTERVIEW',(s.match(/-->\\s*INTERVIEW/g)||[]).length,'虚线',(s.match(/-\.->\\s*INTERVIEW/g)||[]).length)"` → 期望打印 `实线 INTERVIEW 8 虚线 4`（契约 5 的输入基线）；
    9. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0` 且判据 17/18 出现在输出里；
    10. **负路径自证（必做）**：手工把区间里一条边的目标改一个字 → `gen-dep-graph.mjs` **必须**非 0 退出并打印差异边；复原后回 0；
    11. `node viz/mermaid-check.mjs 2>&1 | tail -3` → 期望**图可渲染**（**注意**：A2 改图的渲染正确性**零 CI 覆盖**，`mermaid-check` **不在 CI**——这是 05 §6 的原话）。
  - **必须留浏览器目检**：
    ① **`/map` 的图必须是 `graph TD` 的四色图**，节点标签是 `domain` 而不是 slug（**这是本步最容易静默退化的地方**，CI 只测横向溢出、测不出「难看/无色/方向变了」）；
    ② 图上**新增的 `agent-harness` 节点位置**读得通（不是孤立悬挂）；
    ③ `/map` 的 `DomainMap` 卡片视图与下方图之间的分工说明位置合理（F3-2）；
    ④ `/learn/` 的依赖图引用句与图区自述互相印证（F2-4）；
    ⑤ 窄屏（375px）下图的横向溢出情况（`mermaid-check` 不在 CI，这条**只能**目检）。
- **回滚点**：`git checkout -- notes/knowledge-map.md site/src/pages/map.astro` + `rm site/tools/gen-dep-graph.mjs`。
  **R4（05 补充的单向门）**：回滚 `km` 文本但**留着判据 17** ⇒ CI **永久红**（图与 `prereqs` 本来就不一致，那是现状）⇒ **R4 必须与判据 17 同提交来回滚**。
- **依赖**：`G0-4`（`mermaid-check` 可移植化后才能验证渲染）；判据 17/18 与步 GA-6 同批；D9/D10/D12 拍板（倾向已给，可先按倾向做）。
- **工作量**：**M–L**（05 §3 判定「A2 实为 M–L」）。理由：生成器 ~40 行伪码可照抄，但**契约 1–6 的落地 + 判据 17 的逐字节比对 + 12 条 `INTERVIEW` 边的显式区分**三处都不小；另加一次**只能目检**的渲染验证。
- **风险**：① **照 01 伪码原样实现渲染段** ⇒ 图退化为 `flowchart LR` + slug 标签 + 无色（05 坑 11）——这是本步**头号风险**，已用契约 1–6 + 验收第 4/5/6/7 条封死；
  ② **判据 17 先行落地** ⇒ `hardError`（H-2）；③ **按「11 条虚线边」写替代清单** ⇒ 实际 12 条 ⇒ 判据 18 红或漏一门课（05 坑 12）；
  ④ **回滚只回一半** ⇒ CI 永久红（R4）；⑤ 在 `:78` 附近误触口径块 ⇒ §1.6 铁律。

#### 步 GA-3｜〈A3〉阅读序统一（三份互斥版本收敛为一）

- **id**：`A3-reading-order`
- **目标**：全仓只有**一个**阅读序真源 = `course-structure.ts` 的**数组序**（order = index）；其余位置要么插值、要么只读副本。
- **现状证据**：三份**互斥**版本：
  1. `notes/knowledge-map.md:128`（箭头链，把**多智能体放第 2 位**）；
  2. `notes/knowledge-map.md:162`（漏项版）；
  3. `site/src/pages/learn.astro:177`（把**多智能体放第 9 位**）。
  **实测数组序**：系统设计第 **5**、多智能体第 **9**；`site/src/pages/learn.astro:177` 另有字面量 `#17`；
  `notes/knowledge-map.md:129` 的「P1 三课」也是 A1 同源字形缺陷。
- **具体改法**：
  1. `learn.astro:177`：`#17` → `#{COURSE_STRUCTURE.length}`（插值）。
  2. `notes/knowledge-map.md:128` 的箭头链：按 D2 拍板改（(a) 改成「按目标岗位权重的选题优先级（不构成阅读顺序）」去箭头链 / (b) 保留为「教学方备课顺序」并显式标注视角）。
     **D2 未决**——但**不论选哪个**，「不得出现箭头链 + 不得与阅读序同名」都可机器断言（判据 19：该区间 `→` 计数为 **0**）。
  3. `notes/knowledge-map.md:162` 的漏项版：与 `:128` 同批收敛，**不得**留第二份顺序表述。
  4. `notes/knowledge-map.md:129` 的「P1 三课」：随 A1 的字形清除一并改（**判据 19 与 A3 文案必须一致**——05 §2 指出这两处曾自相矛盾）。
- **派生还是手工**：**派生**（`learn.astro:177` 插值）+ **手工**（`km:128`/`:162` 两句的措辞，但由判据 19/20 锁死）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `grep -rn '#17' site/src/pages/learn.astro | wc -l` → 期望 **0**；
    2. `grep -n 'ORDER\|COURSE_STRUCTURE.length' site/src/pages/learn.astro | head -3` → 期望命中新的插值写法；
    3. `node -e "const t=require('fs').readFileSync('notes/knowledge-map.md','utf8');const seg=t.split('\n').slice(126,131).join('\n');console.log('箭头计数',(seg.match(/→/g)||[]).length)"` → 期望 **0**（判据 19）；
    4. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`（判据 19/20 已入）；
    5. `grep -n '开课顺序确认' notes/knowledge-map.md` → 期望命中行含 `[x] 已定案`（`km` 里那条未结事项已收口）。
  - **必须留浏览器目检**：`/learn/` 的顺序理由段（`learn.astro:427` 的 `.order-reason` 样式）在 375px 下的折行；`/learn/` 的课程卡顺序与 `/nav/` 的时间线顺序**是否一致**（这是「统一」的最终判据）。
- **回滚点**：`git checkout -- site/src/pages/learn.astro notes/knowledge-map.md`。判据 19/20 必须同提交回滚。
- **依赖**：`GA-1`（`km:129` 的 P1 字形与 A1 同源，必须同批）；`GA-6`（判据 19/20 落地）。
- **工作量**：**S**。理由：`learn.astro` 一处插值 + `km` 两处措辞；成本在「三份互斥版本必须同时收口，不能只改一份」。
- **风险**：① 只改 `learn.astro` 而留着 `km:128`/`:162` ⇒ 仍是三份互斥；② **判据 19 与 A3 文案不一致**（05 实测到的现存矛盾）⇒ 必须逐字对齐后再落地判据；
  ③ D2 未拍板就改 `km:128` ⇒ 可能与用户的「备课顺序」意图冲突（故判据只断言「无箭头链」，不断言语义）。

#### 步 GA-4｜〈A4〉计数派生（题量、demo 数、`WORK_COUNT`）

- **id**：`A4-count-derive`
- **目标**：「题量 205/37」「17 个 demo」「可运行作品 6」这些**在源码里手抄**的数字，要么改为派生/插值，要么登记为**判据锁定的副本**。
- **现状证据**：
  - `site/src/pages/index.astro:34-35` 的 `Q_IN_LESSON = 205` / `Q_BANK = 37` 是**两个源码常量**（**门禁盲区**）；
  - 实测**精确 `demo` 键目录 = 10**、含 `demo*` 脚本目录 = **11**、`rag-demo` **无** `demo` 键；
  - `site/src/data/courses.ts:298` 的 `WORK_COUNT = 6` 是**字面量**；「**17 个 demo**」的语义是「**17 门课各自的参考样本（`mvpSlug`）**」——
    **改引用 `WORK_COUNT`(6) 会换错语义**（`mvps.ts:13` 明文写着「两个不同口径」）；
  - `README.md:9` 的「npm run demo 一键复现」对 `rag-demo` **不实**；
  - `site/src/data/course-structure.ts:384` 有**第二份** `COURSE_COUNT` / `CARD_COUNT` / `STATUS_COUNTS`，**零读方**（04 §1.3）。
- **具体改法**：
  1. **`index.astro:34-35`（D2/F-D2 未决 → 采纳 F-D2 的保守分支）**：**保留常量 + 用判据 25/26 登记为副本**
     （理由：门禁是 `.mjs` 纯 node、**不 import TS**，第 55 行的 205 重算算法若复制到站点就是第二份算法，**违背纪律 #5**；因此选「保留常量 + 登记副本」）。
  2. **`WORK_COUNT`**：`courses.ts:298` 改为 `WORK_DIRS.length`（清单仍**手工**——`memory-redteam` 有 `demo` 键却不计入）；
     并加判据 21：`WORK_DIRS` 每一项**存在且含 `package.json`**。
  3. **「17 个 demo」**：`site/src/pages/index.astro:112`、`site/src/pages/learn.astro:199`/`:204` 改为插值 **`{COURSE_COUNT} 门课的参考样本`**
     ——**绝对不要**改成 `WORK_COUNT`(6)。**单一主责 = 本步（M1）**，F1-5 只读校验。
  4. **`judgment 23`（原「计数清单全派生」）已剔除**（reject）：本步改为**降级版**——判据 23 删除；「精确 `demo` 键目录 = 10」改为**从文件系统重算**的事实断言（**不许硬编码 10**，否则就是「用门禁制造了第四个副本」，01 `:612` 原话）。判据 23 的替代见 §4.3。
  5. `README.md:9` 措辞按 A4-d 改（对 `rag-demo` 不实的那句），数字 6 登记为副本（判据 28）。
  6. `course-structure.ts:384` 的第二份 `COURSE_COUNT`/`CARD_COUNT`：**纳入互锁**（判据 22：`courses.ts` 的 `COURSE_COUNT === course-structure.ts` 的 `=== CARD_COUNT - 1`），**不删除**（属清理，不属本批次目标）。
- **派生还是手工**：**混合**：`WORK_COUNT` 与三处「17 个 demo」→ **派生/插值**；205/37 与 `README.md` 的 6 → **手工常量 + 判据锁定**。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `grep -rn '17 个 demo\|17 demo' site/src/ README.md handoff.md | wc -l` → 期望 **0**；
    2. `grep -c 'WORK_COUNT = 6' site/src/data/courses.ts` → 期望 **0**；
    3. `grep -n 'WORK_DIRS' site/src/data/courses.ts | head -3` → 期望命中 `WORK_COUNT = WORK_DIRS.length` 与清单；
    4. `node -e "const fs=require('fs');let n=0;for(const d of fs.readdirSync('.')){try{if(fs.statSync(d).isDirectory()&&fs.existsSync(d+'/package.json')&&'demo' in JSON.parse(fs.readFileSync(d+'/package.json','utf8')).scripts)n++}catch(e){}}console.log('精确 demo 键目录',n)"` → 期望 **10**（与 04/01 实测一致）；
    5. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`；判据 21/22/25/26/27/28 出现在输出里；
    6. `grep -n 'npm run demo' README.md` → 期望该句已按 A4-d 改写（且不再对 `rag-demo` 作不实承诺）。
  - **必须留浏览器目检**：`/` 首页三个 `stat-num`（`COURSE_COUNT` / `DOMAIN_COUNT` / `WORK_COUNT`）= **17 / 15 / 6**；
    「{COURSE_COUNT} 门课的参考样本」那句在 375px 下的折行；`/learn/` 的「17 个 demo」改后文案读得通（**不得**读成「6 个参考样本」）。
- **回滚点**：`git checkout -- site/src/pages/index.astro site/src/pages/learn.astro site/src/data/courses.ts README.md`。判据 21/22/25/26/27/28 同提交回滚。
- **依赖**：`GA-1`（`WORK_DIRS` 是 A1 侧的清单）；`GA-6`（判据 21–28 落地）；D2 未决（205/37 的落法，已采纳保守分支）。
- **工作量**：**M**。理由：三处插值 + 一处常量派生 + 六条判据；成本在**判据 25–28 的副本核对表**（每项要写明口径来源与 reason）。
- **风险**：① **把「17 个 demo」改成 `WORK_COUNT`(6)** ⇒ 语义错位（05 坑 13、01 两次警告）；② 判据 25 硬编码 205 而非从口径块读 ⇒ 制造第四个副本；
  ③ 判据 23 硬编码 10 ⇒ 把「实测事实」升格为「口径」（01 `:657`）；④ 顺手删 `course-structure.ts:384` 的第二份常量 ⇒ 越界（不属本批次目标）。

#### 步 GA-5｜〈A5〉资产↔课程映射表补登（手工补登 + 下界门禁）

- **id**：`A5-asset-course-map`（**单一主责 = 本步**，见 §1.5 M2）
- **目标**：`notes/knowledge-map.md:141-152` 的「哪个资产证明了哪门课的能力」成为**完整且可校验**的索引：不漏登已有 demo 目录，新增目录时不会静默逃出。
- **现状证据**：表结构 = `## 资产 ↔ 课程映射`（`:141`）→ 表头 `:144` → 数据行 `:146-152`（**实测 8 行**：`harness-demo`/`whiteboard`/`rag-demo`/`durable-execution-demo`/`sandbox-demo`/`memory-redteam`/`FinHot(生产)`/`pi + pi-agents-team`）；
  **漏登**：`mcp-demo`、`framework-demo`（目录**实测存在**且有 `demo` 键，且**同一文件**的 `:37`/`:43` 上面那张索引表**已记**它们）；`api-demo`/`flywheel-demo`/`model-basics-demo` **0 命中**；`my-agent`（capstone 主线）0 命中（但 `capstone.ts:49-118` 的 `reference` 六栏引用了前三个 + `memory-redteam` + `framework-demo`）；`final-project` 0 命中。
- **具体改法**（**决策：这张表不适合全派生**——第一列是异构实体、第二列是人的判断；全派生只会产出一张更没用的表）：
  1. **新增 2 行**（本项核心）：``| `mcp-demo/`(投毒 + 四层防御 + 消融) | MCP 供应链安全防御实操 | MCP 与供应链安全 §S4、评测工程化(消融即评测) |``、
     ``| `framework-demo/`(Claude Agent SDK 四能力 + **10 条** `ok()` 断言) | 框架源码级实操 | 框架生态 §S3 |``。
     **红线**：写 `framework-demo` 那行**必须用 10 条断言**（「11/11 混口径已按 U-24 废弃」），且**引用前必须先读 `framework-demo/README.md` 原文**
     ——`handoff.md:14` 的数字与口径块**不一致**，照抄会把失真带进唯一索引。
  2. **`my-agent/` 行**：与 `02` 的 capstone 登记项重叠 ⇒ **D4 未决**（是否单列 + 是否把 7 个小 demo 全列会让表从 8 行膨胀到 15 行）。
  3. **`api-demo`/`flywheel-demo`/`model-basics-demo`**：**建议不单独成行**，并入对应课程的行（D4 未决）。
  4. **下界门禁（判据 24）**：断言映射表第一列的**目录名集合** ⊇ `WORK_DIRS`（六个具名作品必须全部出现）。
     **只断言下界**——不强求「所有目录都在」（表的用途是「能力证明」不是「目录台账」）；它**恰好**抓住 `mcp-demo`/`framework-demo` 这两个漏登。
  5. **与 `interview-bank.md:87-97` 的三方一致性**：01 明确**未通读**该区间与 `§1 能力矩阵` ⇒ **本步不预设改法**，登记为「依赖 04 与 02 的交叉项」（01 U6）。
- **派生还是手工**：**手工补登 + 派生门禁**（第一列/第二列人写；「六个具名作品必须都在」机器断言）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `awk 'NR>=146&&NR<=160 && /^\| `/' notes/knowledge-map.md | wc -l` → 期望 **≥10**（原 8 + 2）；
    2. `for d in harness-demo rag-demo sandbox-demo mcp-demo durable-execution-demo framework-demo; do grep -q "$d" notes/knowledge-map.md || echo "✖ 漏登 $d"; done` → 期望**无输出**；
    3. `grep -c '11/11' notes/knowledge-map.md` → 期望 **0**（混口径已废弃）；
    4. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`（判据 24 已入）；
    5. **负路径自证**：临时把 `mcp-demo` 那行删掉 → 判据 24 **必须**红；复原后回绿。
  - **必须留浏览器目检**：`/map` 页该表的**表格渲染宽度**——`:146` 那一行能力描述极长（`harness-demo` 行含「13 源文件 = 9 运行时 + 3 OTel …」整段括号），**新增桁更长** ⇒ 目检是否溢出/横向滚动。
- **回滚点**：`git checkout -- notes/knowledge-map.md`。**若已加判据 24，回滚必须同时回滚判据**（否则门禁红）。
- **依赖**：`GA-4`（`WORK_DIRS` 是判据 24 的期望值来源）；`GA-6`（判据 24 落地）；**D4 未决**。
- **工作量**：**S**。理由：2–4 行文本 + 1 条门禁判据；**主要成本是「引用数字前必须回原文核对」**。
- **风险**：① **照抄 `handoff.md:14`/`:199` 的数字** ⇒ 把失真带进唯一索引（必须回 `mcp-demo/README.md` 原文）；
  ② 表膨胀（8 → 15 行）与「能力证明索引」的定位冲突（D4）；③ `final-project` 到底算不算「资产」**无判据**（01 U7）——只能人定。

#### 步 GA-6｜〈A6 + A7〉门禁扩展：判据 13–30 + 站点手写副本 + 反向断言（白名单）

> **本步是 H-4 的执行者**：门禁扩展要**先于/同批于** A1/A2/A4/A5 的数据侧改动。
> **已修正 2 处**：① 反向断言的扫描面**显式排除 `site/tools/**`**（否则会命中新判据自身的字面量 → 自指红）；
> ② **判据 23 已剔除**（reject，见 §4.3）。

- **id**：`A6-gate-extension` + `A7-gate-criteria-13-30`
- **目标**：把「同一事实多处手抄」的每一处都变成**可机器断言**：新增判据 13–30（18 条），并把站点 13 处手写副本逐处登记，
  使「改了一处忘了另一处」必然被门禁抓到；同时让反向断言**具备证伪能力**（不做 stale 检测就退化为全豁免门禁，**比不做更糟**）。
- **现状证据**：现行判据 **12 条** + 副本 **7 处**（3 文件，`:343-351` 的 7 处 `grepNum`）；
  站点手写副本 **S1–S13**（01 逐处原文落号，例：S1 = `index.astro:34-35` 的 205/37、S10 = `handoff.md:191` 的六个数、
  S13 = `README.md:9` 的 6）；另有 **5 类 13 处非口径数字**（说明**不能扫全部数字**）。
  **新发现**：单靠 `\d+` 抓不到 `handoff.md:199` 的「**十六个**知识域」（中文数字形态）。
- **具体改法**：
  1. **新增判据 13–18**（A6）：13 课程结构覆盖全部课程页（`COURSE_STRUCTURE` 17 slug vs `act.courseSlugs`，`check-counters.mjs:138`）；
     14 课程总表「阶段」列 == `stage`（**逐行读 `km:55-68`**）；15 `HORIZONTAL_SLUGS` == `isHorizontal` 集合；
     16 门禁解析锚点自检（`COURSES` 条目数 == 18）；17 依赖图与 `prereqs` 逐字节一致；18 面试汇聚列表的课程集合正确。
     **判据 14 的红线（05 高风险点①）**：**不能用「主题名 == domain」匹配**（`km` 主题列至少 5 组不同名）⇒ 必须**新增 slug 列**或建立 14 项人工映射表，**填错一格就会长期误报或长期漏报**（01 U9）。
  2. **新增判据 19–24**（A7）：19 `km:128` 区间箭头链 `→` 计数 = 0；20 `learn.astro` 无 `#17` 字面量；
     21 `WORK_DIRS` 每项存在且含 `package.json`；22 `COURSE_COUNT(courses.ts) === COURSE_COUNT(course-structure.ts) === CARD_COUNT - 1`；
     23 **已剔除**（reject）；24 映射表第一列目录集合 ⊇ `WORK_DIRS`（只断言下界）。
  3. **新增判据 25–28**（副本登记）：25 `index.astro:34` 的 205 == 口径块声明值；26 `index.astro:35` 的 37 == 口径块声明值；
     27 `handoff.md:191` 那一行的六个数（15/17/18/6/205/37）逐个 == 口径块；28 `README.md` 的作品数 6 登记。
  4. **反向断言（判据 29/30）+ 白名单**（A6-b）：
     - 扫描面 = **`site/src/**` + `README.md` + `handoff.md`，显式排除 `site/tools/**`**（**已修正**），并在脚本里写成断言 + 负路径用例；
     - 精确量词集 = `课|门|个|页|卡|域|题|作品|demo`；**插值行跳过**；**叙述行豁免并打印**；中文数字窄规则（覆盖「十六个知识域」）；
     - 白名单项必须写明口径来源与 `reason`；**判据 29** = `offenders.length === 0`（未登记项为 0）；**判据 30** = `stale.length === 0`（白名单无失效项）。
     **判据 30 是强制项，不是可选优化**（01 `:937`）。
  5. **接入 `site/build.sh:41-46` 的同一段插入点**（与 G0-4 的 `check-classes.mjs` 同批）。
- **派生还是手工**：**派生**（18 条判据全部可机器判定）；白名单是**手工维护 + 机器双向断言（29/30）**。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望末段「**判据 30 条 + 副本 13 处**」、`EXIT=0`；
    2. `grep -c 'check(' site/tools/check-counters.mjs` → 期望 **31**（30 条判据 + `:62` 的定义 1 次；现状 13）；
    3. `grep -n 'site/tools' site/tools/check-counters.mjs | grep -i 'scan\|roots\|dirs'` → 期望扫描面常量**不含** `site/tools`；
    4. **负路径 1（未登记数字）**：`sed -i '42s/[0-9]\+ 个/99 个/' site/src/pages/404.astro` → 门禁**必须**非 0；复原后回 0；
    5. **负路径 2（失效白名单项）**：把白名单里某一项的 `line` 改到一行不含该数字的位置 → 门禁**必须**报「失效白名单项」并非 0；复原后回 0；
    6. **负路径 3（中文数字）**：临时把 `handoff.md:199` 的「十六个」改成「十五个」→ 门禁**必须**红（证明中文数字规则真的生效）；复原后回 0；
    7. **自指反例**：把 `site/tools` 加回扫描面 → 门禁**必须**因命中新判据自身字面量而红（证明「已修正」的必要性）；复原；
    8. `/usr/bin/time -f "elapsed=%es" node site/tools/check-counters.mjs >/dev/null` → 期望 **< 2s**（现状 0.09s；01 U11 的耗时风险）；
    9. `grep -c '判据 30 条' site/tools/README.md README.md 2>/dev/null` → 期望相关文案已同步（否则文案失真）。
  - **必须留浏览器目检**：**无**（本步不改变页面渲染）。明确写出以免被误认为漏写。
- **回滚点**：`git checkout -- site/tools/check-counters.mjs site/build.sh`。
  **R3（05 补充）**：若删掉新脚本，**必须同提交撤回 `build.sh` 的调用**，否则 `set -e` 下构建中止 ⇒ 部署停更。
- **依赖**：`GA-4`/`GA-5`（判据 21/22/24/25–28 的期望值来源）；`GA-1`/`GA-2`/`GA-3` 的数据侧改动与判据**同一次提交**；
  `G0-4`（同改 `build.sh` 插入点）；**D5 未决**（`handoff.md:199` 的「十六个知识域」= 失真改 15 还是加说明）。
- **工作量**：**L**。理由：18 条判据 × （判据名 + 实现落点 + 失败信息文案）+ 白名单双向断言 + 3 条负路径自证；
  且 01 已判定 **A6+A7 是 4 项闸门的前置**（05 §3），不能拆散落地。
- **风险**：① **判据 14 用「主题名 == domain」匹配** ⇒ 长期误报/漏报（已给「新增 slug 列」方案 + U9 的补证要求）；
  ② **反向断言不做判据 30** ⇒ 退化成全豁免门禁（**比不做更糟**，01 `:937`）；
  ③ 把 `handoff.md:199` 的「十六个知识域」**登记进白名单** ⇒ 把现存失真合法化（05 坑 15）；
  ④ 扫描面含 `site/tools` ⇒ 自指红（已修正）；
  ⑤ 门禁耗时升到分钟级 ⇒ 会被绕过（「门禁被绕过的第一天起它就等于不存在」，01 `:1247`）。

---

### 批次 B｜读者闭环（`B-P5` / `B-P7` / `B-P6` / `B-P4`）

> **本批次建议执行顺序**（02 的理由：先「删错/收窄不实声明」降低后续误判输入）：
> `B-P4`（纯删错，可最先）→ `B-P5` 批 1 → `B-P6`（紧随 mcp 题库）→ `B-P7` → `B-P5` 批 2/3。

#### 步 GB-1｜〈B-P4〉`details/` 8 页「未覆盖」逐页复核 + 可机器校验写法

> **单一主责 = 本步**（§1.5 M4）。**已修正 1 处**：`details/` 8 页**不是** `demo:eval` 语料成员（语料三成员见下），故改它们**不需**重跑评测；但 02 把这条回滚风险点写在了别处，本步写准。

- **id**：`B-P4`
- **目标**：`notes/details/*.md` 8 页的「未覆盖」栏从**无法核验的叙述**变成**可机器校验的格式**，并逐页复核「这条缺口是否真的缺」。
- **现状证据（file:line）**：
  - **矛盾集 = `04` / `08` / `06`**（07 的修正值，**不是** 3/8 里的另三页）：
    `notes/details/04-token-economics.md:27` 跨行矛盾（`:22` 已给 4x/15x 与「80% 方差」数字，`:27` 却说「没有这些数字」）；
    `notes/details/08-single-threaded-write.md:27` 跨行矛盾（`:22` 已给 Devin Review「2 个 bug/PR、58%」，`:27` 却说「没有」）；
    `notes/details/06-observability-loop.md:27` **行内自相矛盾**（同一条里先写「OTel 埋点**已落地**（`demo:otel:mock` 实测 15 spans/1 trace）」，紧接着写「仍缺…控制台产物」）。
  - **明确不动 1 页**：`notes/details/01-context-rot.md:27`——该句主体是「**行业对比数字/检查清单**」（确实不存在），而 `n²` 本身在 `:22` 已给；08 读原文后修正为 **01 不矛盾**（**本轮采用 08 修正值**）。
  - 4 页 `02`/`03`/`05`/`07` 逐行未发现直接冲突，只做格式迁移。
  - **语料成员核对（有代码依据）**：`rag-demo/src/corpus.ts:18-20` 逐字为 `rag.md` / `agent-harness.md` / `handoff.md` ⇒ **改 `notes/details/*` 不属语料变更**。
- **具体改法**：
  1. **新格式**（`:27` 那一行）：`- 本课未展开的部分：<主张 1>；<主张 2> ｜ 锚点：<file:line>[, <file:line>…]`；
     栏目名 `- 未覆盖：` → `- 本课未展开的部分：`；**锚点语法固定为 `file:line`**（可多个、逗号分隔），**不允许 URL 作锚点**。
  2. **三页逐页处置**：
     - `04-token-economics.md:27`：删掉「没有 4x/15x 行业对比数字与 80% 方差数据」整段；只留真缺口「课程有预算机制，但没有『用 token 账本做架构选择（更大模型 vs 更多 agent）』的数据支撑」，锚点 = `notes/harness-from-scratch.md:192`（`estimateTokens = JSON长度 / 3.5`）；
     - `08-single-threaded-write.md:27`：删「没有 Devin Review 的行业数字（2 个 bug/PR、58% 严重级）」；保留「决策一致性理论框架」「写线程归因视角」两条真缺口，锚点 = `notes/agent-harness.md:238`、`notes/sandbox.md:41`（**两处行号 02 已核实存在**）；
     - `06-observability-loop.md:27`：把「OTel 埋点已落地(…15 spans/1 trace…)」从「未覆盖」行**移走**（它属「已覆盖」侧），只留真缺口「仍缺 `getEvents()` 式位置切片重放的 API 示例 + 『逐步观察 agent』的控制台产物」。
  3. **`01-context-rot.md:27` 只做格式迁移**（加栏目名与锚点，句子内容**保持**）；**提交说明必须写一句「01 不矛盾，不得据 07 原表误伤」**。
  4. **新建 `site/tools/check-details.mjs`**，三条判据：**R-D1** 锚点可解析（每个 `file:line` 必须存在且行号在范围内）；
     **R-D2** 数字级跨行矛盾（**token 族定义必须排除 `n²`** → 自动不误伤 01，且**恰好复现** 04/08 两页）；
     **R-D3** 行内「已落地 + 仍缺」并存。
  5. **8 步人读流程**（`B-P4.3`）：① `sed -n '20,27p'` 逐字读；② 抄出「未覆盖」里每个数字/专名，回 `:22` 与 `:26` 找；③ 在 `:22` 已出现 → 伪缺口，删（04/08）；同条断言「已落地」与「仍缺」→ 行内矛盾，拆（06）；④ 主体是「行业对比数字/检查清单」而非该事实本身 → **不算矛盾**（**01 专用豁免，不得推广**成「加个限定语就不算矛盾」）；⑤ 为每条真缺口找**能证伪它的 `file:line`**；⑥ 改名；⑦ 跑脚本；⑧ 目检。
- **派生还是手工**：**语义复核 = 手工**（必须人读原文判断「这条缺口是否真的缺」）；**格式与矛盾检测 = 派生门禁**（R-D1/R-D2/R-D3）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. **反向复现（本项核心验收）**：**改动前**跑 `node site/tools/check-details.mjs` → **必须恰好**在 `04`、`08` 报 R-D2 红、在 `06` 报 R-D3 红、**`01` 不得报红**（这三红一绿就是脚本正确性的判据）；
    2. 改动后 `node site/tools/check-details.mjs; echo "EXIT=$?"` → 期望 `EXIT=0` 且打印 8 条「未覆盖」各自的锚点；
    3. `grep -c "^- 本课未展开的部分：" notes/details/*.md` → 每页恰 **1**，8 页共 **8**；
    4. `grep -rn '^- 未覆盖：' notes/details/*.md | wc -l` → 期望 **0**；
    5. `node -e "const fs=require('fs');let bad=0;for(const f of fs.readdirSync('notes/details')){const t=fs.readFileSync('notes/details/'+f,'utf8').split('\n');for(const m of t.join('\n').matchAll(/锚点：([^\n]+)/g)){for(const a of m[1].split(',')){const [p,l]=a.trim().split(':');if(!fs.existsSync(p)||+l>fs.readFileSync(p,'utf8').split('\n').length){bad++;console.log('坏锚点',f,a)}}}}console.log('坏锚点',bad)"` → 期望 `坏锚点 0`；
    6. `grep -c 'n²' notes/details/01-context-rot.md` → 期望 **≥1**（证明 R-D2 的 token 族确实排除了它 → 01 不红）。
  - **必须留浏览器目检**：`/details/04-token-economics/`（等改动页）渲染后「本课未展开的部分」两条要点完整、无 markdown 表格/长行溢出（8 页均为长页，`details/[slug].astro` 渲染）——**不得用构建成功冒充**。
- **回滚点**：`git checkout -- notes/details/`（8 文件目录级）；`rm site/tools/check-details.mjs`（若已接入 `build.sh`，**必须同提交撤回调用**，见 R3）。
- **依赖**：`GA-6`（门禁扩展；本项判据不依赖 `phase`，故与 A1 的 D7 解耦）。
- **工作量**：**M**。理由：8 页 × 读 31 行 + 判「真/伪缺口」≈2h；三页改写 + 5 页加锚点 ≈1h；判据脚本（含反向复现调试）≈1.5h。
- **风险**：① **误伤 `01`**（08/任务书双重点名）⇒ R-D2 必须用「数字 token」而不是「任意 token 交集」，并把「01 必须绿」写成脚本自测用例；
  ② 反向风险：**为过判据把真缺口写成模糊话** ⇒ 判据绿而内容更差；判据只能拦结构性矛盾，**语义仍靠人读流程**，这条要写进提交说明；
  ③ 改名与 `analysis/content/05-coverage.md:452-470` 的措辞错位 ⇒ **不得改上一轮报告**，只在 `notes/`/`site/` 内就地划改。

#### 步 GB-2｜〈B-P5 批 1/2/3〉练习题库补「合格线」列（**全 184 题**）

> **已修正 2 处**：① 工作量覆盖 **184 题**（不是 92 题——05 §3 判定 02 漏了 92/184 之外的部分）；
> ② `notes/agent-harness.md` **是 `demo:eval` 语料成员**（`rag-demo/src/corpus.ts:19`）⇒ 改它**必须重跑评测**。

- **id**：`B-P5`（**单一主责 = 本步**，§1.5 M3：`notes/mcp.md` 题库表由本步先改表结构，B-P6 只在其前插节标题）
- **目标**：把题库从「只支持『我做完了』」升级为「支持『我答对了』」：**14 张题库表 184 题每题一行「合格线」**，
  任何一题都能在不看参考答案的前提下自判是否过关；并把这条规则升级为**风格指南要求 + 机器门禁**。
- **现状证据**：14 张表**全部没有「合格线/答案/判定」列**，表头形态两种：
  - **13 张** `| # | 题目 | 考察 |` = **176 题**：`notes/api-engineering.md:309`(311–324,14)、`notes/data-flywheel.md:387`(389–402,14)、
    `notes/durable-execution.md:415`(417–430,14)、`notes/evaluation.md:477`(479–492,14)、`notes/framework-ecosystem.md:401`(403–416,14)、
    `notes/harness-from-scratch.md:224`(226–233,8)、`notes/long-term-memory.md:467`(469–482,14)、`notes/mcp.md:542`(544–557,14)、
    `notes/model-basics.md:360`(362–375,14)、`notes/multi-agent.md:421`(423–434,12)、`notes/observability.md:327`(329–342,14)、
    `notes/sandbox.md:504`(506–521,16)、`notes/system-design.md:386`(388–401,14)；
  - **1 张** `| # | 题目 | 考察层 |` = **8 题**：`notes/agent-harness.md:382`。
  与 `notes/knowledge-map.md:17` 的「题目：课内嵌 **205** 题（13 课练习题库 176 + agent-harness §13 **8** 题）」口径对齐
  （**205 = 176 + 8 + rag S1 + model-basics S7** 的完整算法见 `check-counters.mjs:153-211`）。
- **具体改法**：
  1. **列格式**（照 `notes/rag.md:317-339` 的粒度）：前缀 `≥N 点：` + **≥2 个圆码要点** + **≤120 字** + 可选 `✗ 典型错答`；一行一题。
  2. **分批（02 给的批次与题号段）**：
     - **批 1** = `notes/sandbox.md:506-521`（16 题）+ `notes/mcp.md:544-557`（14 题）= **30 题**；
     - **批 2** = `notes/observability.md:329-342` + `notes/evaluation.md:479-492` = **28 题**；
     - **批 3** = `notes/multi-agent.md:423-434`（12）+ `notes/api-engineering.md:311-324`（14）+ `notes/harness-from-scratch.md:226-233`（8）= **34 题**；
     - **其余 92 题**（`data-flywheel`/`durable-execution`/`framework-ecosystem`/`long-term-memory`/`model-basics`/`system-design`/`agent-harness`）**同属本项**，不得漏（05 §3）。
  3. **风格指南**：`notes/process/teaching-style-guide.md:17` → **必改**（含 §8 清单更新 + 新增 §9「题库表结构」）。
  4. **新建/扩展判据（三条，入 `check-counters.mjs`）**：**R-Q1** 列存在（**含「删考察列」反向保护**：考察列消失也必须红）；
     **R-Q2** 非空格式（每行有 `≥N 点：` 前缀 + ≥2 个圆码要点 + ≤120 字）；**R-Q3** 题量守恒（176 + 8 = 184 行不变）。
     附 3 条负路径 + **范围声明（不误伤 OWASP 清单表）**。
  5. **语料回归（不是可跳过项）**：本步改了 `notes/agent-harness.md` ⇒ 它是 `demo:eval` 语料成员 ⇒ 改后**必须** `cd rag-demo && npm run demo:eval`
     并把 recall / chunks 与改前对比，**漂移要记录**（门禁**不覆盖**语料，`rag-demo` **不在 CI**）。
- **派生还是手工**：**手工写内容**（每题的合格线是人的判断）+ **派生门禁**（R-Q1/R-Q2/R-Q3 三条 + 题量守恒从文件重算）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `grep -l '合格线' notes/*.md | wc -l` → 期望 **14**；
    2. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`，判据数 **12 → 15**（`grep -c 'check('`：13 → 16）；
    3. **题量守恒**：`node -e "…复算 14 张表数据行…"` → 期望 **184**（176 + 8）；
    4. **格式**：`grep -c '≥[0-9]\+ 点：' notes/*.md` 逐文件 ≥ 该表行数；
    5. **负路径 1**：删掉某张表的「考察」列 → R-Q1 **必须**红；**负路径 2**：把某行的 `≥N 点：` 前缀删掉 → R-Q2 必须红；
       **负路径 3**：删掉某表一行题 → R-Q3 必须红；
    6. **范围保护**：OWASP 清单表（`notes/mcp.md` 内）**不得**被 R-Q1 误伤 → 跑一次确认判据只认「`| # | 题目 | 考察`」三列形态；
    7. `cd rag-demo && npm run demo:eval 2>&1 | tail -5` → 期望 recall/chunks 与改前一致，或明确记录漂移（**执行轮跑**）。
  - **必须留浏览器目检**：`/c/sandbox/` 与 `/c/mcp/` 的题库表在 **375px** 下新增「合格线」列后的**横向溢出**（184 题里最宽的两张）；1280px 下表格版面是否仍可读。
- **回滚点**：`git checkout -- notes/*.md notes/process/teaching-style-guide.md`；判据 R-Q1/Q2/Q3 必须同提交回滚。
- **依赖**：`GA-6`（门禁扩展，判据 13 起，本项判据**不依赖 `phase`**）。
- **工作量**：**L**（**已修正**）。理由：184 题 × （≥2 圆码要点 + ≤120 字）是纯人力主项；再加 3 条判据 + 3 条负路径 + 一次语料回归。
- **风险**：① **漏掉 92 题**（05 §3 指出 02 的 L 只覆盖 92/184）；② **改 `agent-harness.md` 却不重跑 `demo:eval`** ⇒ 语料漂移无告警（05 坑 8，★）；
  ③ 在题库节标题与表格之间插 `#`–`###` 标题 ⇒ 截断门禁 `inBank` 状态（05 坑 7，★）——**B-P6 的插入点必须避开**；
  ④ 为凑格式把合格线写成空话 ⇒ 判据绿而读者仍无法自判（同 GB-1 风险②）。

#### 步 GB-3｜〈B-P6〉`notes/mcp.md` S4 拆节 + 小节末就地自检点

> **已剔除**：02 的 **B-5 门禁**（`grep 'S4\.2' notes/` 期望 0 命中）——**不可满足**（实测全仓 `S4.2/3/4` **25 处命中**），
> 且为变绿去改 `notes/sandbox.md:300/:311/:315`、`notes/framework-ecosystem.md:188/:208` 就是**越界改别的课的节号**。
> 替代判据见下（只断言 mcp 页自身自洽）。

- **id**：`B-P6`（依赖 `B-P5` 批 1：就地引用题号需题库先有合格线，否则引用只是「题目编号」）
- **目标**：`notes/mcp.md` 的 S4 过长（机制讲解与清单混在一节），拆成 **S4（机制）** 与 **S4B（清单 + 分层）** 两节，
  并在小节末加**就地自检点**（读者读完即自测），同时**不改坏**站点 TOC/锚点。
- **现状证据**：`notes/mcp.md` S4 边界 = **`:151-199`（S4 机制）** | **`:200-318`（新 S4B 清单 + 分层）**，**S4.4 必须随清单走**；
  站点锚点算法 = `site/src/utils/toc.ts:11-21` 的 `slugify` + `:23-48` 的 `extractToc`（只取 h2/h3），`c/[slug].astro:25` 消费它；
  **仓内零硬编码 mcp 锚点**（02 实 grep）；**`mcp` 页不在 `visual-check.mjs` 的 `PAGES`**（实测 8 页无 `/c/mcp/`）；
  级联清单 **11 处 `file:line`**（含 `notes/industry-2026.md:104`/`:105`、`notes/system-design.md:246`、**`handoff.md:106`/`:199` 的「MCP §S4.2-4.4」**）。
- **具体改法**：
  1. **拆分**：`:151-199` 保留为 S4（机制）；`:200-318` 改为新节 `## S4B …`（清单 + 分层）；**S4.4 随清单走**。
  2. **就地自检写法**：小节末**只写题号 + 提示**（如「自检：本节对应题库 #7、#11 → 见下方 `## 练习题库`」），
     **不写内链**——实测 `notes/` 内**零** `](#` 内链，且站点 id 算法与 Obsidian 锚点**不一致**。
  3. **级联更新（11 处）**：逐处把指向原 S4 清单部分的引用改指向 S4B；**必须包含 `handoff.md:106`/`:199`**（02 的清单漏了它们，05 坑 16 点名）。
  4. **`check-counters.mjs` 增判据（替代 B-5）**：解析 `notes/mcp.md` 的 h2/h3 节号集合，
     断言「页内出现的每个 `S<n>.<m>` 引用，其主节号在本页存在」；**扫描面只限 `notes/mcp.md`**，**不**要求全仓 `S4.2/3/4` 归零。
- **派生还是手工**：**手工改写**（拆节与引用措辞是人写的）；**派生校验**（节号自洽判据从 md 头文件重算）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `grep -n 'S4B' notes/mcp.md | wc -l` → 期望 **≥2**（节标题 + 级联引用）；
    2. **节号自洽（替代 B-5，命令原文见 §2.4 B-5）** → 期望「mcp.md 内引用了不存在节号的引用：无」；
    3. `grep -n 'S4\.[24]' handoff.md | wc -l` → 期望 **0**（两处死引用已改，05 坑 16）；
    4. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`；
    5. **插入点安全**：`awk 'NR>=540 && NR<=545' notes/mcp.md` → 目视确认题库节标题（`:542` 表头 / `:544` 起数据行）与表格之间**没有**新增 `#` 标题（05 坑 7）；
    6. `grep -rn '](# ' notes/ | wc -l` → 期望 **0**（保持「零内链」的既有形态）。
  - **必须留浏览器目检**：`/c/mcp/` 侧栏 TOC **多一条 S4B**，且**锚点可跳**（`notes/` 的 id 算法与 Obsidian 锚点不一致 ⇒ 只能目检）；
    375px 下 S4 与 S4B 的**双清单**是否造成版面拥挤（F4-8 的同源问题，主责在 P6）。
- **回滚点**：`git checkout -- notes/mcp.md handoff.md`；节号自洽判据同提交回滚。
- **依赖**：**`GB-2` 批 1**（就近引用 mcp 题库题号）；`GA-6`（判据落点）。
- **工作量**：**M**。理由：拆节本身一次编辑；成本在 **11 处级联**（含 02 漏掉的两处）+ 一条新判据 + TOC 目检。
- **风险**：① **照 02 原 B-5 门禁落地** ⇒ 永远红，或被迫越界改别的课的节号（**已剔除该门禁**）；
  ② **漏 `handoff.md:106`/`:199`** ⇒ 拆节后留两处死引用（治的正是这个病）；③ 在 `mcp.md:544` 之前以外的地方插节标题 ⇒ 断 `inBank`（★）；
  ④ 写了内链 ⇒ 与站点的 id 算法不一致，锚点静默失效。

#### 步 GB-4｜〈B-P7〉术语表 + 首现处补「缩写（中文全称）」

> **与形式组 1 的 F1-1/F1-2 共用同一份术语定义**（03 D2 倾向 (b)：抽 `site/src/data/glossary.ts` 作单一真源）。
> **落到哪里的 D4 未决**——本步给出「按 (a) 做」的执行路径（零计数级联），但**最终由用户拍板**。

- **id**：`B-P7`
- **目标**：消除「缩写满篇、首现处无中文全称」的阅读阻断（readability-F2/F3/F4 = **blocker/high, confirmed**）：
  建一份术语表，并在**每篇首现处**补「缩写（中文全称）」。
- **现状证据**：首现清单 **11 处**（03/02 已逐处 file:line）；**SSE 首现 = `notes/harness-from-scratch.md:15`/`:17`，定义在 `:83`**
  （**不是** `agent-harness.md:430`——那只是路径字母序第一）；首现的排序键 = **阅读序（`course-structure.ts` 数组 index）**，不是路径字母序。
- **具体改法**：
  1. **落点（推荐 (a)，D4 未决）**：`notes/knowledge-map.md` 新增 `## 术语表` 段——机制理由：`knowledge-map` 已在 `EXCLUDED_FROM_COURSE_ROUTE`（`courses.ts:331`）内、由 `/map/` 渲染 ⇒ **零计数级联**；
     若选 (b) 新建 `notes/glossary.md`（顶层 19→20）或 (c) 站点 `/glossary` 页（33→34），**必须**同步口径块 + CI 断言。
  2. **字段定义**：一行 6 字段（术语 / 中文全称 / 一句话定义 / 首现 `file:line` / 所属课程 / 关联术语）。
  3. **首现处补「缩写（中文全称）」**：按 11 处清单逐处就地补（**SSE 用 `harness-from-scratch.md:15`/`:17`**）。
  4. **新建 `site/tools/check-terms.mjs`**：按 `course-structure.ts` 的**数组序**（非字母序）算首现，逐个比对术语表里登记的 `file:line`；
     **含 SSE 回归保护**（首现值必须命中 `harness-from-scratch.md:15`/`:17`，不是 `agent-harness.md:430`）。
- **派生还是手工**：**手工写定义 + 派生校验**（首现值从 `course-structure.ts` 数组序重算，零手抄）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `node site/tools/check-terms.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`，并打印 **11** 个术语的「阅读序首现 `file:line`」；
    2. `grep -n 'SSE' notes/harness-from-scratch.md | head -3` → 期望命中 `:15`/`:17`/`:83`；
    3. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`（术语表落在 `knowledge-map.md` 时**不得**改变任何冻结计数）；
    4. **若选 (b)/(c)**：`find site/dist -name '*.html' | wc -l` 期望由 **33 → 34**，且**必须同批**改 `verify.yml:105` 的 `-eq 33`（**否则 CI 红**）；
    5. `grep -c '术语表' notes/knowledge-map.md` → 期望 ≥1（选 (a) 时）。
  - **必须留浏览器目检**：`/map/` 术语表**可跳**且渲染可读（`/map` 渲染整个 `knowledge-map.md`，新增段会加长首屏）；`/learn/` 或各课首现处的「缩写（中文全称）」不破坏句子排版。
- **回滚点**：选 (a) = `git checkout -- notes/knowledge-map.md notes/*.md`；选 (b)/(c) **必须同提交回滚** `verify.yml:105` 的等值断言与口径块数字。
- **依赖**：`GA-6`；`F1-1`/`F1-2`（组 1，共用术语定义）；**D4 未决**。
- **工作量**：**M**。理由：6 字段定义 + 11 处首现补全 + 一个校验脚本（含 SSE 回归保护）；成本主要在「首现按阅读序而非字母序」的算法正确性。
- **风险**：① 选 (b)/(c) 而忘了同步 `verify.yml:105` 的 `-eq 33` 与口径块 ⇒ **CI 红 + 口径级联**（这是 D4 的核心权衡）；
  ② SSE 首现取成 `agent-harness.md:430` ⇒ 判据长期错一块；③ 与 F1-1/F1-2 各写一份定义 ⇒ 第二次搬迁（03 D2 倾向 (b) 的理由）。

---

### 批次 C｜时效与证据链（建议 `C-P9` 最先、`C-P8` 最后）

#### 步 GC-1｜〈C-P9〉构建证据链固化（不实的「33 页 / 484.44s」收窄）

- **id**：`C-P9`
- **目标**：把「被宣告但不可核实、且与现场冲突」的构建数字（`484.44s` 本机耗时）**收窄**，
  改为指向**可核实的 CI run**；让活文档里的每个构建声明都有一条能被读者点开验证的证据链。
- **现状证据**：三处活文档引用了不可核实数字：`.github/workflows/verify.yml:97`（附近）、`README.md:28`、`notes/knowledge-map.md:18`；
  `verify.yml:96-99` 的注释已自述「本机构建**不稳定**：同日复跑一次被杀（内存 3.4G 争用）⇒ 本机成或败都不代表 CI 结果」；
  CI run `38554963320`；**artifact 有保留期**、**commit message 不可发现**（02 的论证）。
- **具体改法**（02 推荐方案 C = 口径改写）：
  1. `verify.yml:97` 附近：删「484.44s」这一本机耗时，改为「以本作业的 `Build sanity` 等值断言 33 为权威判据」；
  2. `README.md:28`：同口径改写，并把 `run 38554963320` 写成**活文档引用**（可点开的 green run）；
  3. `notes/knowledge-map.md:18`（口径块内！）：**只改措辞、不插空行**（§1.6 铁律）；
  4. **不采用**方案 (b)/(c)（落 CI artifact / 转存 `/tmp` 日志）：前提是**先有日志**，且 artifact 有保留期 ⇒ 引用会再次过期（D7 未决）。
- **派生还是手工**：**手工改写**（措辞）+ **派生可核实链接**（指向 CI run 而非本机数字）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `grep -rn '484\.44\|484s' README.md notes/ .github/ site/ --exclude-dir=node_modules | wc -l` → 期望 **0**；
    2. `grep -rn '38554963320' README.md notes/ .github/ site/ --exclude-dir=node_modules | wc -l` → 期望 **≥1**；
    3. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`（口径块措辞改动后仍可解析）；
    4. `sed -n '8,19p' notes/knowledge-map.md | grep -c '^$'` → 期望 **0**（**证明没有在口径块内插空行**，§1.6）。
  - **必须留浏览器目检**：`/map/` 的口径块第 8–19 行段落排版（措辞改了但块结构未变）。
- **回滚点**：`git checkout -- .github/workflows/verify.yml README.md notes/knowledge-map.md`。
- **依赖**：无（**建议批次 C 中最先做**：与 GB-1 同属「删错」，降低后续误判输入）。
- **工作量**：**S**。理由：3 处措辞 + 4 条只读判据。
- **风险**：① 在 `km:8-19` 内插空行以便「排版好看」⇒ `hardError` ⇒ **Pages 停更**（05 坑 2，★）；
  ② 把 artifact 链接当长期证据 ⇒ 保留期过后变成新的不可核实引用（D7）；③ 忘了 `README.md:28` 这一处 ⇒ 三处只改两处。

#### 步 GC-2｜〈C-P8〉时点回填（`llm-history` asOf + 默认模型 + SDK 版本分类处置）

- **id**：`C-P8`（**建议批次 C 中最后做**：含未核实项，以免把未验证数字写进正文）
- **目标**：给「时间线快照」类内容补**明确的时点（asOf）**，去掉「权威事实列表」这类**当下时态**的措辞；
  修正默认模型名；把 SDK 版本 12 处**逐处分类**（该改的改、锁定/历史的**不得改**）。
- **现状证据**：
  - `notes/knowledge-map.md` 侧的台账：`notes/industry-2026.md:108` 的行号**已漂移**（04 X-4）；
  - `site/src/data/llm-history.ts:188`/`:190` 末节点 **2025-01**、共 **10 节点** vs `notes/llm-timeline.md:3`/`:14` 的 **12 节点**；
  - `harness-demo/src/llm.ts:24` 默认 `qwen3.8-flash` → 应改 `-next`；
  - SDK 版本 **12 处**：**4 类需改（6 处）** / **6 处不得改**（`package.json:16` 与 `handoff.md` 属**锁定/历史**，改了会制造新不一致）；
  - 08-P8 的「三处未同步」实为 **三处**：`README.md:18` + `notes/interview-bank.md:97` + `framework-demo/README.md:167`（08 只点名 2 处）。
- **具体改法**：
  1. `HISTORY_AS_OF` 单一真源（`site/src/data/llm-history.ts` 新增常量），站点引用它；
  2. 去掉 `llm-history.ts` 的「权威事实列表」措辞，改为「截至 `HISTORY_AS_OF` 的快照」；
  3. `site/src/pages/nav.astro:31` 的文案与之一致（**这是 C-P8 唯一的目检点**）；
  4. **10 → 12 节点 = D6 未决**：(a) 只加 `asOf` + 改措辞（**10 节点不动**，本轮证据只够 (a)）；(b) 补齐到 12 节点（**需先取 2025.09 / 2026.04 / 2026.07 三个节点的公开一手源**；
     `notes/llm-timeline.md:27-29` 是**仓内自述，不能当外部证据**）；
  5. `harness-demo/src/llm.ts:24` 默认模型 → `-next`，并同步 `harness-demo/.env.example` 与 `harness-demo/README.md`（三处一致）；
  6. SDK 版本 12 处：**逐处按分类表处置**（需改 6 处改掉；`package.json:16` 与 `handoff.md` **不动**）。
- **派生还是手工**：**手工**（时点与版本是外部事实）+ **派生引用**（站点从 `HISTORY_AS_OF` 单点取）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `grep -n 'qwen3.8-flash"' harness-demo/src/llm.ts | wc -l` → 期望 **0**；
    2. `grep -n 'LLM_MODEL\|qwen3.8' harness-demo/src/llm.ts harness-demo/.env.example harness-demo/README.md` → 期望三处默认值一致（均为 `-next` 形态）；
    3. `grep -rn '权威事实列表' site/src/ | wc -l` → 期望 **0**；
    4. `grep -n 'HISTORY_AS_OF' site/src/data/llm-history.ts site/src/pages/nav.astro` → 期望 ≥2 命中（单一真源 + 消费方）；
    5. `grep -n '16\.[0-9]\+' notes/interview-bank.md:97` 一类逐处核 → 三处未同步**必须**与 SDK 分类表的「需改」清单一致；
    6. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`（新增「裸版本断言」判据绿）。
  - **必须留浏览器目检**：`/nav/` 的时间线定位句与 `asOf` 文案措辞（`nav.astro:31` 改动后读者是否还能看懂「这是快照不是当下」）。
  - **必须留实跑**：`cd harness-demo && npm run demo`，观察默认模型切换后的真实行为。
    **依赖活端点 `LLM_BASE_URL`——本轮未验证**；端点不可用则写「未验证（端点不可用）」，**不得**当作已通过。
- **回滚点**：`git checkout -- site/src/data/llm-history.ts site/src/pages/nav.astro harness-demo/src/llm.ts harness-demo/.env.example README.md notes/interview-bank.md framework-demo/README.md`。
- **依赖**：`GC-1`（先收窄不实声明再补新数字，02 的排序理由）；**D6 未决**（10 vs 12 节点）。
- **工作量**：**M**。理由：asOf 三处小改 + 默认模型三处同步 + SDK 版本 12 处**逐处分类**（分类成本高于编辑成本）+ 一处目检 + 一处实跑。
- **风险**：① 把 `package.json:16` 或 `handoff.md` 的 SDK 版本「顺手统一」⇒ **制造新不一致**（它们是锁定/历史语境）；
  ② 选 D6(b) 用仓内自述当外部一手源 ⇒ 把内部自述升格为外部证据（**禁止**）；
  ③ 改 `notes/interview-bank.md` 时若同批改到 `notes/agent-harness.md`/`handoff.md`/`notes/rag.md` ⇒ 触发语料变更（**必须**重跑评测）。

---

### 形式组 1｜站点入口层（`index` 首屏 / 11 专名 / `404` / `nav`）

> **前置（05 F-D4 + 03 D2）**：**先冻结术语真源**再改 F1-1/F1-2 —— 抽 `site/src/data/glossary.ts`（倾向 03 D2 的 (b)），
> 否则会写两份定义、下一轮再搬迁一次。
> **单一主责提醒（M1）**：`index.astro:112` 与 `learn.astro:199/:204` 的「17 个 demo」**由 A4 主责**（步 GA-4），本组**只读校验**。

#### 步 GF1-1｜〈F1-1〉`index.astro` 首屏承诺句就地展开（08 §3.6 blocker）

- **id**：`F1-1`
- **目标**：首屏承诺句里出现的每个概念**就地可展开**，而不是「说了 5 个词、一处没解释」。
- **现状证据**：`site/src/pages/index.astro:45-61` 首屏承诺句**无一处展开**（`07-verification.md:85` confirmed）；
  实测 `sed -n '45,61p' site/src/pages/index.astro | grep -o 'data-term="[^"]*"' | sort -u | wc -l` 现状低；
  首屏含模板变量（如 `{MILESTONES.length}`）——**这些是派生值，不许写成字面量**。
- **具体改法**：
  1. 把 `:45-61` 的 `hero-sub` 拆成「承诺行 + `hero-sub-detail`」，承诺句保留原意；
  2. 首屏出现的概念用 `<dfn class="term" data-term="…">` 标注，并在其下**就地**展开（不是页尾脚注——那是本条要修的形态本身）；
  3. 样式：新增 `.hero-sub-detail` / `.hero-terms` / `.hero-terms-list` 到 `site/src/styles/global.css`；
     **用 `--deny` 而不是 `--warn`**（**已修正**：`global.css` **无** `--warn` 变量，03 就地更正的实测）。
- **派生还是手工**：**手工文案** + **派生标记**（`data-term` 让「覆盖了几个专名」可被脚本清点）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `sed -n '45,61p' site/src/pages/index.astro | grep -o 'data-term="[^"]*"' | sort -u | wc -l` → 期望 **≥3**；
    2. `sed -n '45,61p' site/src/pages/index.astro | grep -cE 'SSE|BM25|RRF|JSONL|checkpoint|SIGKILL|OTel'` → 期望 **0**
       （首屏与 F1-2 的 11 专名列表**不重叠**，重叠即说明拆分越界）；
    3. `grep -c 'MILESTONES.length\|{' site/src/pages/index.astro` 对照改动前后 → 模板变量**必须保留**（不许写成 5）；
    4. 第二轮类集合比对（§0.3 的方法）：`.hero-sub-detail`/`.hero-terms`/`.hero-terms-list` **不得**出现在差集里；
    5. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`（本条未动任何计数，回归确认）。
  - **必须留浏览器目检**：
    ① **375px 下 `details` 收起态时 `hero-actions` 三个按钮是否仍在首屏内**（这是本条的**真正目标**，几何断言抓不到「首屏」这个语义）；
    ② 展开 `details` 后的高度跳变是否盖住/推开 `route-grid`；
    ③ `<dfn>` 的浏览器默认斜体是否与周围正文冲突（若冲突改 `font-style: normal; border-bottom: 1px dotted;`——**这条必须目检后才决定**）；
    ④ 1280px 首屏右半是否出现大片空白（拆分后承诺行变短）。
- **回滚点**：`git checkout -- site/src/pages/index.astro site/src/styles/global.css`；单文件、单页、无数据依赖。
- **依赖**：**术语真源冻结（GF1-1/GF1-2 共同前置）**；`G0-1`（目检需要 HTML）；D2 未决（术语是否上站）。
- **工作量**：**M**。理由：文案只有 5 条定义，但要**逐条**确认首屏确实出现了这些词并保持 375px 首屏不破；真正成本在**目检 4 个视口行为**。
- **风险**：① 把术语条写成**页尾脚注**而非首屏就地展开 ⇒ **直接违背本条目标**；
  ② 拆分 `hero-sub` 时丢了 `{MILESTONES.length}` 等模板变量 ⇒ 派生值变成硬编码；
  ③ 若同时改 F4-1 的 `.markdown dfn` 规则 ⇒ 两处样式需放在同一处并目检。

#### 步 GF1-2｜〈F1-2〉`index.astro` 作品卡的 11 专名就地指路（08 §3.6 blocker）

- **id**：`F1-2`
- **目标**：卡片上的专名**不再只是卖点**——每个首现专名要么就地可展开，要么有一个统一入口。
- **现状证据**：`site/src/pages/index.astro:151-194` 的 `<div class="cards">` 含 **6 张** `a.card.depth-card`；专名分布（本轮回原文逐行确认）：
  `:156-157` `harness-demo` 卡（loop / 工具协议 / **SSE** 流式 / 权限门 / **JSONL** 轨迹 + 崩溃恢复 / token 压缩）；
  `:164-165` `rag-demo` 卡（chunking → hash embedding → 暴力余弦 ∥ **BM25** → **RRF** 融合 → 强制引用 → **golden set** 评测）；
  `:172-173` `sandbox-demo` 卡（**四通道 policy 引擎** deny > approve > sandbox > allow + 幽灵事故重放）；
  `:179` `mcp-demo` 卡（MCP 供应链投毒演示…**单层消融**）；
  `:185-186` `durable-execution-demo` 卡（**journal** 双锚点 + **checkpoint** 原子写；3 种崩溃点真实 **SIGKILL**，恢复按判定表 **replay / skip / unknown→confirm**）；
  `:192` `framework-demo` 卡（Claude Agent SDK 四能力）。**共 11 个专名**。
- **具体改法**：
  1. 对每个首现专名包一层 `<dfn class="term" data-term="<英文原名>">`，**逐行落点**：`:156`（SSE）、`:157`（JSONL）、`:164`（BM25）、`:165`（RRF、golden set）、`:172`（policy 引擎）、`:179`（消融）、`:185`（journal、checkpoint、SIGKILL）、`:186`（replay、skip、unknown→confirm）。**这层标记视觉零变化**（不加下划线、不改色），目的是让「覆盖了几个专名」**可被脚本清点**。
  2. 在 `:194`（`.cards` 的 `</div>`）与 `:195`（`<p class="depth-foot">`）**之间**插入一个 `<details class="term-sheet" id="terms">` 身份证…`</details>`（`<summary>` + `<dl><div><dt/><dd/></div>…</dl>`，11 个条目）。
  3. **不要逐卡插入链接**：`index.astro:152` 是 `<a class="card depth-card">`（整卡是链接），往里套第二个 `<a>` **HTML 不允许**。
     统一入口放在**分块层级**：`:195` 的 `depth-foot` 那句里追加 `<a href="#terms">专名速查</a>`。
  4. 样式 `dfn.term` 与 `.term-sheet*` 放进 `site/src/styles/global.css`（**与 F4-1 的课程页 `<dfn>` 共用同一套规则**），插入位置 `:520` 之后（紧跟 `.markdown blockquote` 区域 `:496-506`）。
  5. **与 F1-3 共用同一份术语定义**：404 页的 `OTel` 条目并入同一份 `glossary.ts` 数据源。
- **派生还是手工**：**手工文案 + 派生标记**（`data-term` 可脚本清点）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `sed -n '151,194p' site/src/pages/index.astro | grep -o 'data-term="[^"]*"' | sort -u | wc -l` → 期望 **11**；
    2. `grep -c '<a ' site/src/pages/index.astro` 与 `<a class="card` 的嵌套深度核对 → 期望 `a.card` 内**无嵌套 `<a>`**（HTML 合法性）；
    3. `grep -n 'href="#terms"' site/src/pages/index.astro` → 期望命中 `:195` 附近；
    4. 第二轮类集合比对：`.term-sheet`/`.term-sheet-list` **不得**在差集里；
    5. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`。
  - **必须留浏览器目检**：
    ① `<details>` 折叠 `<dl>` 的 **375px 版面**（11 个条目会不会太长）；
    ② `<dfn class="term">` 的视觉是**零变化**（这是设计意图：只做标记不做装饰）；
    ③ 点「专名速查」锚点是否真的跳到 `#terms`（`extractToc` 只取 h2/h3，**`<details>` 不是标题**，锚点靠 `id` 属性）。
- **回滚点**：`git checkout -- site/src/pages/index.astro site/src/styles/global.css`。
- **依赖**：**术语真源冻结（与 GF1-1 同一份）**；`G0-1`；D2 未决。
- **工作量**：**M**。理由：11 个专名 + 11 条定义 + 一份样式 + 3 项目检；成本在定义措辞（要照 `notes/*` 的既有粒度，不能自创）。
- **风险**：① 逐卡插入 `<a>` ⇒ **HTML 非法**（已点名）；② 术语定义与 B-P7 的术语表各写一份 ⇒ 第二次搬迁；
  ③ 只加标记不加统一入口 ⇒ 读者知道有 11 个专名却无处查（等于把 blocker 换个形态）。

#### 步 GF1-3｜〈F1-3〉`404.astro` 的专名统一指路

- **id**：`F1-3`
- **目标**：404 页的专名（实测仅 `:42` 一处 `OTel`）与 GF1-2 的专名清单**共用同一份定义**，不再各写一份。
- **现状证据**：`07:86` 实测 404 页仅 `:42` 一处专名；`site/src/pages/404.astro:9-10` 注释自述「不 import `site/src/data`」；
  04 实测 `404.astro` 的手抄数字「6 个」在 `:42` 一带（判据 29/30 的负路径用例就用它）。
- **具体改法**：
  1. 404 页的 `OTel` 条目**并入** `site/src/data/glossary.ts`（与 GF1-2 同源），404 页只引用不重定义；
  2. `D4 未决`（404 是否 import `WORK_COUNT`）：(a) import `courses.ts`（消掉手抄 6；(b) 保留 `6` 并**把该副本登记进 `check-counters.mjs` 的副本白名单**（批次 A 的判据 29/30）。
     **倾向 (b)**（尊重 `404.astro:9-10` 的既有注释边界，且与 A5 合并更省事）。**(b) 是默认执行路径；(a) 需 D4 拍板。**
- **派生还是手工**：**派生**（术语定义从 `glossary.ts` 引用）+ **手工**（是否 import 的边界决策）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `grep -n 'OTel\|data-term' site/src/pages/404.astro` → 期望命中且引用的定义来源是 `glossary.ts`（或按 D4 选 (b) 时，`6` 出现在白名单里）；
    2. `grep -n '404.astro' site/tools/check-counters.mjs` → 选 (b) 时期望命中白名单条目（含 `reason` 字段）；
    3. **负路径（与 GA-6 验收第 4 条同）**：`sed -i '42s/[0-9]\+ 个/99 个/' site/src/pages/404.astro` → 门禁**必须**非 0；复原后回 0；
    4. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`。
  - **必须留浏览器目检**：`/404`（或任一非法路径）页面渲染正常、专名指路可点。
- **回滚点**：`git checkout -- site/src/pages/404.astro site/src/data/glossary.ts`（+ 白名单条目同提交回滚）。
- **依赖**：`GA-6`（判据 29/30 的白名单机制）；**D4 未决**；GF1-2（共用 `glossary.ts`）。
- **工作量**：**S**。理由：一处专名 + 一个白名单条目（或一行 import）。
- **风险**：① 选 (b) 却忘了把副本登记 ⇒ 判据 29 会把「6 个」报成未登记项（**这是正确行为**，但会挡 CI，必须一次性做完）；
  ② 选 (a) 破了 `404.astro:9-10` 的自述 ⇒ 必须同步改那句注释（纪律 #4 就地划改）。

#### 步 GF1-4｜〈F1-4〉`/nav/` 版面分组（长列表扫读成本）

- **id**：`F1-4`
- **目标**：`/nav/` 的长列表不再是一屏到底，给读者「年代分组 + 跳转条 + 折叠说明」的扫读结构。
- **现状证据**：`site/src/pages/nav.astro` 长列表；`nav.astro:17` 的 `<meta description>`；`nav.astro:31` 的时间线定位句（**C-P8 也会改这一带，注意不重叠**）；
  `visual-check.mjs` 的 `PAGES` 现状**无** `/nav/`（本组与 G0-2 同源）。
- **具体改法（D5 未决 → 按 (b) 先行）**：
  1. **跳转条**（年代/阶段锚点）+ **`note` 折叠**（(b) 范围）；
  2. (a) 完整范围（年代分组 + 跳转条 + `note` 折叠 + `.so-*` 搬迁）**需 D5 拍板后再做**——它会动 `/learn/` 的样式归属，有**层叠风险**；
  3. `/nav/` 已由 G0-2 加进 `visual-check` 的 `PAGES`，故本步可被三视口断言覆盖。
- **派生还是手工**：**派生**（分组从 `LLM_EVOLUTION` / `COURSE_STRUCTURE` 派生）+ **手工**（跳转条文案）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `grep -c 'id=' site/src/pages/nav.astro` → 期望 ≥ 跳转条条目数（跳转目标必须真实存在）；
    2. `grep -n 'nav/' site/tools/visual-check.mjs` → 期望命中（G0-2 已加）；
    3. `.so-*` 若未搬迁：`grep -rn '\.so-' site/src/styles/global.css | wc -l` → 改动前后应一致（证明没越界动样式归属）；
    4. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`。
  - **必须留浏览器目检**：`/nav/` 在 **375 / 768 / 1280** 三视口的版面；跳转条点击是否落到正确位置；
    `note` 折叠收起态下「时间线前那句定位句」是否仍在首屏可见。
- **回滚点**：`git checkout -- site/src/pages/nav.astro`（若动了 `global.css` 一并回滚）。
- **依赖**：`G0-2`（`/nav/` 在回归清单内）；**D5 未决**；**与 GC-2 的 `nav.astro:31` 不重叠**（本步不碰 `:31`）。
- **工作量**：**M**（按 (b) 范围）；(a) 范围是 **L**（+ 4 项 × 3 视口目检）。
- **风险**：① 只做跳转条但目标 id 不存在 ⇒ 死锚点（验收第 1 条封死）；② (a) 范围搬迁 `.so-*` ⇒ 影响 `/learn/` 样式，需额外目检；
  ③ 与 GC-2 同改 `nav.astro` 的相邻行 ⇒ **必须错开**（本步不碰 `:31`）。

#### 步 GF1-5｜〈F1-5〉入口层「17 个 demo」措辞的渲染位置与版式

- **id**：`F1-5`（**只读校验**，单一主责在 A4/步 GA-4，见 §1.5 M1）
- **目标**：确认 A4 改后的「`{COURSE_COUNT}` 门课的参考样本」在 `index.astro:112`、`learn.astro:199`/`:204` 三处的**渲染位置与版式**读得通。
- **现状证据**：三处文案**内容侧已入 A4**（P10）；④-8 明确把「渲染位置与版式」留待形式层。
- **具体改法**：**本步不改文案**（避免两批各改一次同一个字符串）。只做两件事：
  1. 核验 A4 的插值在这三处是否落在**合适的版式容器**里（若 `:112` 是卡片副标题而 `learn.astro:199` 是段首，同一句话在两处的容器不同 ⇒ 只调**容器/换行**，不调措辞）；
  2. 把核验结论写进提交说明（供 A4 的提交引用）。
- **派生还是手工**：**派生**（文案由插值派生）+ **手工**（是否调容器）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `grep -rn '17 个 demo\|17 demo' site/src/ | wc -l` → 期望 **0**（A4 已改完）；
    2. `grep -n 'COURSE_COUNT' site/src/pages/index.astro site/src/pages/learn.astro` → 期望命中三处插值；
    3. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`。
  - **必须留浏览器目检**：`/` 首页卡片区与 `/learn/` 段首的这句文案在 375 / 1280 下的折行与容器高度；
    **不得**读成「6 个参考样本」（语义错位的最终判据就是**读者能不能读对**）。
- **回滚点**：无（本步默认无代码改动）；若调了容器则 `git checkout -- site/src/pages/index.astro site/src/pages/learn.astro`。
- **依赖**：`GA-4`（主责）；`G0-1`。
- **工作量**：**S**。理由：两处版式核验 + 3 条只读判据。
- **风险**：① 顺手把文案也改了 ⇒ 与 A4 冲突（**明确禁止**）；② 把它读成「17 个 demo 目录」⇒ 语义错位未消除。

---

### 形式组 2｜`/learn/` 层级与口径落点

> **同页四条（F2-1/F2-2/F2-3）一起改一次目检**（03 的顺序建议）。

#### 步 GF2-1｜〈F2-1〉`/learn/` 侧的资产↔课程映射（**只读校验**，主责在 A5）

- **id**：`F2-1`（单一主责 = `A5`/步 GA-5，见 §1.5 M2）
- **目标**：确认映射表补登后，`/learn/`（或站点任何位置）**没有**该表的第二个渲染副本。
- **现状证据**：映射表在 `notes/knowledge-map.md:141-152`，由 `/map/` 渲染（`map.astro:48` `<rendered.Content />`）；`/learn/` 侧未见该表。
- **具体改法**：**只读**——grep `site/src/pages/learn.astro` 与 `site/src/components/` 是否出现该表的内容片段（如 `harness-demo` 与「证明的能力」同现）。
  若发现副本 ⇒ 登记进 A6 的副本白名单（判据 29），**不在本步改内容**。
- **派生还是手工**：**派生**（校验）；无手工改动。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `grep -rn '证明的能力\|资产 ↔ 课程映射' site/src/ | wc -l` → 期望 **0**（站点不复制该表标题）；
    2. `grep -c 'harness-demo' site/src/pages/learn.astro` → 期望 **0 或**该命中是**另一桩事实**（逐处核对并在提交说明里写明）；
    3. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`。
  - **必须留浏览器目检**：`/map/` 与 `/learn/` 两页的映射信息**不出现互相矛盾的版本**（同一资产在两页的说法要一致）。
- **回滚点**：无（本步默认无写入）。
- **依赖**：`GA-5`（主责）。
- **工作量**：**S**。理由：2 条 grep + 1 次两页对照。
- **风险**：① 发现副本却**顺手改掉** ⇒ 与 A5 抢同一处（**禁止**）；② 把 `/learn/` 里同名但不同义的 `harness-demo` 命中误判为副本。

#### 步 GF2-2｜〈F2-2〉`/learn/` 阶段段头是否印难度

- **id**：`F2-2`
- **目标**：给「阶段段头」一个**只印可复核事实**的表述，不把主观序数印成对外口径。
- **现状证据**：`site/src/pages/learn.astro` 的阶段段头（`STAGE_DESC` 消费处）；`01-pedagogy.md` §2 的难度分**权重不可复现**（自述置信度中）。
- **具体改法（D6 未决 → 按 (c) 执行）**：只印**可复核的事实**——同一段内两门课的**相对跃迁**（如「本段后两门难度明显上升」，见 `01:544` 的 P0 内部跨 1→4）。
  (a) 不印 / (b) 印「难度 4–5」**需 D6 拍板**（(b) 若采纳，**必须**同时标「估计」）。
- **派生还是手工**：**派生**（跃迁提示可由段内两门的难度序数差派生）+ **手工**（措辞）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `grep -nE '难度 [0-9]' site/src/pages/learn.astro | wc -l` → 期望 **0**（(c) 路径下不出现裸难度区间）；
    2. `grep -n '跃迁\|明显上升' site/src/pages/learn.astro` → 期望命中（(c) 的产物）；
    3. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`。
  - **必须留浏览器目检**：`/learn/` 五个阶段段头在 375px 下的折行；这句提示是否被读成「统一难度评级」（若是 ⇒ 措辞失败）。
- **回滚点**：`git checkout -- site/src/pages/learn.astro site/src/data/course-structure.ts`（若同时改了 `STAGE_DESC`）。
- **依赖**：`GA-1`（阶段词表统一后才能谈段头）；**D6 未决**。
- **工作量**：**S**。理由：一句提示 + 2 条判据 + 1 项目检。
- **风险**：① 印了主观序数（(b) 无「估计」标注）⇒ 把主观判断变成对外口径；② 与 F2-3 同时改 `learn.astro` 的相邻区域 ⇒ 必须同一次目检（03 的建议）。

#### 步 GF2-3｜〈F2-3〉`learn.astro` 口径说明的归属与 section 配平

- **id**：`F2-3`
- **目标**：`/learn/` 的口径说明不再嵌套在 capstone section 内，section 开合配平。
- **现状证据**：`site/src/pages/learn.astro:264-286` 的口径说明；**实测 `<section` 4 个 : `</section>` 3 个**（**已修正**：不是 03 初稿说的「缩进错位」，而是
  **口径说明实为嵌套在 capstone section 内**）；`learn.astro:264` 的注释自述「降为页尾脚注」**与结构矛盾**。
- **具体改法（D7 未决 → 按 (b) 执行）**：把口径说明做成**独立尾注 section**（补 `:196` 的闭合，`id="caliber"`），
  使 `id="capstone"` 的锚点范围**收窄**（首页链接不再滚过口径段）；并就地改 `:264` 的那句注释（纪律 #4）。
- **派生还是手工**：**手工**（结构性编辑）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `grep -c '<section' site/src/pages/learn.astro` 与 `grep -c '</section>' site/src/pages/learn.astro` → 期望**两者相等**；
    2. `grep -n 'id="caliber"\|id="capstone"' site/src/pages/learn.astro` → 期望两个 id 都命中且**不嵌套**；
    3. `grep -n '降为页尾脚注' site/src/pages/learn.astro` → 期望该注释已就地更新为与结构一致的说法；
    4. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`。
  - **必须留浏览器目检**：`/` 首页链到 `/learn/#capstone` 后**不再滚过口径段**；`/learn/` 尾部版面（口径段独立后与页脚的距离）。
- **回滚点**：`git checkout -- site/src/pages/learn.astro`。
- **依赖**：**D7 未决**；建议与 GF2-1/GF2-2 同一轮改（同页）。
- **工作量**：**S**。理由：一处 section 闭合 + 一个 `id` + 一句注释；成本在「配平后版面是否仍对」的目检。
- **风险**：① 只补 `</section>` 不调归属 ⇒ 口径段仍视觉上属于 capstone；② 忘了改 `:264` 的注释 ⇒ 注释与结构继续矛盾（纪律 #4 要求就地划改）。

#### 步 GF2-4｜〈F2-4〉`/learn/` 的依赖图引用句（**只改一遗**）

- **id**：`F2-4`（**与 GA-2 同一提交**，见 §1.4 G-MAP）
- **目标**：`/learn/` 的「完整依赖图」引用句与 `/map` 的图**互相印证**，不出现「图已派生而句子说手绘」。
- **现状证据**：`site/src/pages/learn.astro:188`（引用句，`01-source-layer.md` A2 直接点名 `:186-188`）；该句只有一句话、不含数字与边 ⇒ 01 判定**保留手写**。
- **具体改法**：**`:188` 保持不动**。若 A2 落地（图改为派生），则在 `notes/knowledge-map.md` 图区上方**同批**补一句「本图由 `site/src/data/course-structure.ts` 的 `prereqs` 派生」。
  **不得**在 A2 未落地时把 `/learn/` 的句子改成「图由代码生成」——那是**新的不实陈述**。
- **派生还是手工**：**手工一句**（引用句）；派生在图侧（A2）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `grep -n 'map/' site/src/pages/learn.astro` → 期望仍命中 `:188` **一处**（未被误删/改指向）；
    2. `grep -n 'prereqs' notes/knowledge-map.md | head -3` → A2 落地后期望命中图区上方那句自述；
    3. `node site/tools/gen-dep-graph.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`；
    4. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`。
  - **必须留浏览器目检**：`/learn/` 的 `.order-reason`（`learn.astro:427` 样式）在 375px 下这句的折行；点 `/map/` 后图**渲染成 `<svg>`**（属 A2 的目检，本条只确认链接可点）。
- **回滚点**：本条**无代码改动**；若把自述句算进来，回滚 = 还原 `notes/knowledge-map.md` 图区上方那一句（属 A2 的文件）。
- **依赖**：**`GA-2`（A2）**；`G0-4`。
- **工作量**：**S**（一句话 + 一次核对）；**大部分工作量归 A2**。
- **风险**：① 两边各改一半（A2 改了图、`/learn/` 的句子说「手绘」）⇒ **必须同批核对**；② 抢先改 `/learn/` 的句子 ⇒ 新不实陈述。

#### 步 GF2-5｜〈F2-5〉口径块 10.4 KB 是否上站（`/map` 认知负荷）

- **id**：`F2-5`
- **目标**：给出「口径块要不要有站点展示位」的**可执行判定**，避免 `/map` 把 ~10.4 KB 口径块无声地塞进读者路径。
- **现状证据**：`notes/knowledge-map.md` 总 **25522 字节**；「计数口径」小节实测 **10614 字节**（≈10.4 KB；**已修正**：④-10 写「7.7 KB」，实测 10614 B，**以实测为准**）；
  `/map` 由 `site/src/pages/map.astro:48` `<rendered.Content />` 渲染**整个 `knowledge-map.md`**，口径块在**第 11 行起**（**在依赖图之前**）⇒ 读者打开 `/map` 第一屏是口径块；
  对照：`/learn/` 已把口径降为页尾脚注（`learn.astro:271-285`）⇒ **两页对同类信息给出相反的层级处理**。
- **具体改法（D8 未决 → 按 (a) 执行）**：
  1. **不动笔记**（笔记是 GitHub 读者的一手源，且门禁从块内重算数字）。只在 `map.astro` 渲染层处理：
     `map.astro:22` 后加 `const CALIBER_HEADING='计数口径'; const hasCaliber=(entry?.body ?? '').includes(CALIBER_HEADING);`；
     在 `:46-48` 之间插一条**指向该小节锚点**的提示（**不复制内容**）；
  2. **锚点 id 必须现算**：`#依赖图` 一类锚点的真实 id 由 `extractToc`（`map.astro:21`）派生 ⇒ **实施时必须先打印 `toc` 里的真实 id**，**不许照抄示例里的中文锚点**（`site/src/utils/toc.ts`）；
  3. `map.astro` 的 `<style>`（`:63-66`）追加 `.caliber-jump { margin: 0 0 12px; font-size: 0.9rem; color: var(--text-soft); }`；
  4. **(b) 真折叠需 D8 拍板**（要 remark 插件或渲染后 HTML 包装 ⇒ 动渲染产物，**风险更高**，列为备选）；
  5. **交叉引用 F1-4**：`/nav/` 的长列表与 `/map/` 的口径块是**同一类**问题，两条都用「默认收起 + 显式跳转」的同一手法（D5/D8 一起拍板，避免两页两种风格）。
- **派生还是手工**：**派生**（字符数从 `entry.body` 现算；锚点从 `extractToc` 派生；是否含口径块从笔记文本派生）+ **手工**（「该不该收起」这一判断）。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. **口径块实测大小**（把 ④ 的 7.7 KB 换成可重跑实测值）：`awk '/计数口径/,/^## [^计]/{print}' notes/knowledge-map.md | wc -c` → 本轮实测 **10614**（含首尾行；`awk` 区间写法不同会差几行，实施时以该命令的输出为准）；
    2. `grep -n 'caliber-jump\|CALIBER_HEADING' site/src/pages/map.astro` → 期望命中；
    3. `node -e "…打印 extractToc 结果…"` → 期望打印**真实锚点 id 列表**（实施时用它替换示例里的中文锚点）；
    4. `grep -c '计数口径' site/src/pages/map.astro` → 期望命中（作为常量或判断串）而**不是**复制的正文；
    5. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`。
  - **必须留浏览器目检**：`/map/` 首屏（跳转条是否真的把读者引到图区）；点跳转条后**是否落到图**（中文锚点的 slug 规则只能目检确认）；
    375px 下跳转条的折行。
- **回滚点**：`git checkout -- site/src/pages/map.astro`（若动了 `global.css` 一并回滚）。**笔记侧零改动**，故无笔记回滚。
- **依赖**：**D8 未决**（(a) 跳转条 / (b) 真折叠）；与 GF1-4 的 `/nav/` 手法一致（同一决策）。
- **工作量**：**M**。理由：锚点 id 派生要实测 + 两处渲染层改动 + 2 项目检；成本在「不许复制笔记正文」这条纪律。
- **风险**：① **照抄示例里的中文锚点** ⇒ 死锚点（已点名「必须现算」）；② 复制口径块正文到站点 ⇒ 制造第二份副本（违背唯一真源原则）；
  ③ 选 (b) 真折叠 ⇒ 动渲染产物、打印丢内容、风险面大。

---

### 形式组 3｜`/map` 依赖图（**与批次 A 的 A2 合并，必须同一次提交**）

> **组 3 的三条不单独提交**：`F3-1`（生成器契约）、`F3-2`（`/map` 分工说明）、`F3-3`（图区呈现）全部在 **步 GA-2 内部**落地。
> 本节把它们**单列出来**，是为了满足「25 条登记项一条不漏」的可核对性，并给出**归属说明**——**不是**另起一组工作。

#### 步 GF3-1｜〈F3-1〉生成器契约（**在步 GA-2 内落地**）

- **id**：`F3-1`｜**归属**：步 GA-2 的「具体改法第 2 步」
- **目标**：保证 A2 的生成器**不把图改丑**。
- **现状证据**：01 的 A2 伪码有 **4 处**会造成读者可见退化（03 实测）：方向 `flowchart LR`（现为 `graph TD`）、标签打 slug 而非 `domain`、无 `classDef`（四色丢失）、未处理 `agent-harness` 新节点。
  **且**：图**只有 16 个课程节点**、`agent-harness` 整条节点缺失、`classDef todo` 定义 **0 使用**、状态用了**第三套词表**（`📐` 在两套真源里都不存在）。
- **具体改法**：即 GA-2 的**契约 1–6**（方向 `graph TD` / 标签 `domain` / 保留 4 个 `classDef` / 新增 `agent-harness` 节点 / `INTERVIEW` 12 条边显式区分 / 状态 emoji 只用真源词表 ✅🔄⏳）。
- **派生还是手工**：**派生**（全部由生成器保证）。
- **验收命令（可重跑）**：见 GA-2 验收第 4–8 条（`graph TD` = 1、`classDef` = 4、`agent-harness` ≥1、`📐` = 0、`INTERVIEW` 实线 8 / 虚线 4）。
- **必须留浏览器目检**：`/map` 的图**仍是四色**、方向仍是自顶向下、标签是 `domain`（**CI 测不出这些**，`mermaid-check` 不在 CI）。
- **回滚点**：随 GA-2（同提交）。
- **依赖**：`GA-2`；**D9 未决**（`todo` 空置保留 vs 删；是否加第 5 色表达 `isHorizontal`）；**D10 未决**（是否抽 `parse-courses.mjs`）。
- **工作量**：**并入 A2 的 M–L**。
- **风险**：① 照 01 伪码原样实现 ⇒ 图退化（**头号风险**）；② 用 slug 当标签 ⇒ 读者看不懂（现状是 `domain`）；③ 新增节点后没加 `classDef` ⇒ 新节点无色。

#### 步 GF3-2｜〈F3-2〉`/map` 上方交互视图与下方图的分工说明（**在步 GA-2 内落地**）

- **id**：`F3-2`｜**归属**：步 GA-2 的「具体改法第 4 步」
- **目标**：让读者知道 `/map` 上方卡片视图（`DomainMap`）与下方图**各自解决什么问题**，不再两套东西并列而无说明。
- **现状证据**：`site/src/pages/map.astro:48` 渲染整个 `knowledge-map.md`（含图）；`DomainMap` 是独立交互组件；两者之间**无分工说明**（03 的本轮新发现，④ 未登记）。
- **具体改法（D11 未决 → 按 (b) 执行）**：说明句放进**默认 slot 正文之前**（(b) 写法最稳）；
  (a) 与 `DomainMap` 共用 `slot="before"` **需先实测 Astro 多元素具名 slot 是否生效**。
- **派生还是手工**：**手工一句**。
- **验收命令（可重跑）**：
  - **可机器验证**：`grep -n '交互\|卡片视图\|下图' site/src/pages/map.astro` → 期望命中新增说明句；`node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`。
  - **必须留浏览器目检**：`/map` 首屏顺序 = 说明句 → 卡片视图 → 图；1250px 与 375px 下说明句位置都合理。
- **回滚点**：随 GA-2。
- **依赖**：`GA-2`；**D11 未决**。
- **工作量**：**S**（一句话）。
- **风险**：① 放在图**之后**（读者先看到图才知道有卡片视图）⇒ 起不到分工作用；② 选 (a) 而未实测多元素具名 slot ⇒ 静默不渲染。

#### 步 GF3-3｜〈F3-3〉图区呈现：阶段标签与状态词表（**在步 GA-2 内落地**）

- **id**：`F3-3`｜**归属**：步 GA-2 的「具体改法第 2 步」
- **目标**：图上的阶段标签与状态**不再与真源冲突**（**注意：这是现存显示值失真，不是「未来风险」**——03 就地更正）。
- **现状证据**：图上 **14 个课程节点带档位标签**，其中 **9 个与 `course-structure.ts` 的五档不一致 / 5 个一致**（**已修正**：03 原写「11 个不一致」，真值 9；`16` 的来源 = 14 课程 + 2 横向）；
  **完全无 P3/P4**？——不成立：图上确有 P0/P1/P2 标签，缺的是 `agent-harness` 节点；状态用第三套词表。
- **具体改法**：阶段标签从 `course-structure.ts` 的 `stage` 派生（与 A1 同源）；状态 emoji 只用 `courses.ts` 的 ✅/🔄/⏳；
  是否按阶段 `subgraph` 聚类 = **D12 未决（倾向 (a) 不聚类）**（(b) 会让跨阶段边变长交叉、窄屏更易溢出，且 mermaid v12 + `strict` 兼容性**未验证**）。
- **派生还是手工**：**派生**。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. `node -e "…按 05 §9 的方法复算图区节点/标签/冲突…"` → 期望 **节点定义 17 / 带档位 14 / 冲突 0 / 一致 14**（改前为冲突 9 / 一致 5，**这就是本条的判据**）；
    2. `sed -n '/BEGIN:dep-graph/,/END:dep-graph/p' notes/knowledge-map.md | grep -cE '📐|🎯'` → 期望 **0**（第三套词表不用）；
    3. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`（判据 17）。
  - **必须留浏览器目检**：`/map` 图上每个节点的阶段标签与 `/learn/` 对应课程卡的 chip **逐个一致**（机器只能比对文本，读起来是否一致要人看）。
- **回滚点**：随 GA-2。
- **依赖**：`GA-2`；`GA-1`（阶段真源统一）；**D9/D12 未决**。
- **工作量**：**并入 A2 的 M–L**。
- **风险**：① 把「9 个冲突」当成「11 个」⇒ 验收期望值错（**已修正为 9/14**）；② 聚类后窄屏溢出；③ 新旧词表混用 ⇒ 第三套词表复活。

---

### 形式组 4｜课程页与 details 页呈现（`F4-1`…`F4-8`）

> **主责划分**：`B-P4` 主责 `notes/details/*.md` 的**文本**（步 GB-1）；本组主责**呈现层**（§1.5 M4）。
> **`F4-6` 受硬顺序 H-1 约束**：必须在批次 A 删 `phase` **之前/同批**完成。

#### 步 GF4-1｜〈F4-1〉课程页 `>` 元信息块的分级呈现

- **id**：`F4-1`
- **目标**：让读者一眼看出「开头这几行是元信息（优先级/状态/前置/用法），不是正文」。
- **现状证据**：实测开头 `>` 块行数 **2–6 行不等**（**已修正**：④-24 说「开头 5 行」，实测 17 篇里只有 **4 篇**是 5 行，另有 1 篇 6 行、8 篇 4 行、2 篇 3 行、4 篇 2 行）；
  典型形态 `notes/rag.md:3-6`；`astro.config.mjs` 的 markdown 管线**没有**针对引用块的转换逻辑；`global.css:496-506` 是 `.markdown blockquote`；
  课程页**已有专门的元信息容器** `c/[slug].astro:57-67` 的 `.course-meta-bar`。
- **具体改法（D13 未决 → 按 (b) 先行）**：`c/[slug].astro` 加一段客户端脚本（**零管线风险**），把首个 `>` 块包成带 class 的元信息栏；
  (a) `remark` 插件（进 `astro.config.mjs`，全站生效、无 JS 也有分级）收益完整但**要动全局管线**——`utils/md.ts:30-33` 已记录该文件的敏感度 ⇒ **D13 拍板后再上 (a)**。
- **派生还是手工**：**手工**（一次性脚本 + 一条 CSS）。**没有派生空间**：那几行是作者手写文本。
- **验收命令（可重跑）**：
  - **可机器验证**：`node site/tools/check-classes.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`（新 class 必须同时出现在定义集与输出集）；
    `grep -n 'course-meta\|meta-note' site/src/pages/c/[slug].astro site/src/styles/global.css` → 期望两处都命中；
    `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`。
  - **必须留浏览器目检**：**4 项 × 2 主题**（明/暗）；**目检范围必须扩到 `/map`、`/interview`、`/details/*`**（若选了 (a) 插件方案，它影响全站 33 页）。
- **回滚点**：`astro.config.mjs`（一行 import + 一行挂载）或 `c/[slug].astro`（一段 `<script>`）+ `global.css`（两条规则）——均可独立回滚。
- **依赖**：**D13 未决**；`G0-1`；`G0-5`（类集合门禁）。
- **工作量**：**M**。理由：脚本 ~25 行（要处理 h1/h2 边界与代码围栏）+ CSS 两条 + 目检 4 项 × 2 主题。
- **风险**：① 改 `astro.config.mjs` ⇒ 影响全站 33 页，目检范围必须扩（否则会漏 `/map` 等页的退化）；② 把代码围栏里的 `>` 误判为元信息块 ⇒ 必须判边界。

#### 步 GF4-2｜〈F4-2〉mermaid 图注（62 图 / 0 手写图注）

- **id**：`F4-2`
- **目标**：每张图都有**可读的图注**（不是只有「图 1」），并且图注在站点上有一致样式。
- **现状证据**：图总数 **62**（`grep -rc '```mermaid' notes/*.md` 求和）；**手写图注 0**（`grep -rc '^%% *caption:'` 求和）；
  **已修正**：④-25 说「无图号」——实测**已有自动图号**（`site/src/scripts/mermaid.ts:45` `figcaption.textContent = captionOf(el.dataset.msrc ?? '') ?? \`图 ${ordinal}\``），
  **缺的是图注**；图注样式**已存在**（`global.css:605-610` `.mermaid-figure figcaption`）。
- **具体改法（分两层，第二层才动笔记）**：
  1. **先只改样式/拼装逻辑**（零内容风险）；
  2. **内容轮再补图注**：`%% caption:` 约定**必须先在一张图上试**——若被 mermaid 当可见文本渲染进图 ⇒ **全部图变丑**（03 依据不足项，**未实测**）；
  3. **D14 未决**：先只改样式，等内容轮补齐图注后再打开「缺图注」提示（否则每张图都显示「缺图注」，观感变差）；
  4. 若把 `textContent` 改成 `innerHTML`：**必须 `esc()`**（`mermaid.ts:73` 注释专门解释过笔记文本里可能含 `<br/>`）。
- **派生还是手工**：**派生**（图号与图注拼装）+ **手工**（62 条图注的撰写，属内容轮）。
- **验收命令（可重跑）**：
  - **可机器验证**：`grep -rc '```mermaid' notes/*.md | awk -F: '{s+=$2} END{print s}'` → 期望 **62**（不变）；
    `grep -n 'esc(' site/src/scripts/mermaid.ts` → 若用了 `innerHTML` 期望命中；
    `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`。
  - **必须留浏览器目检**：**任取 3 张图**确认图下方**有图注文本**（不是只有「图 N」）；图注样式与正文协调；`%% caption:` 试用的那张图**图内没有多出文本**。
- **回滚点**：`git checkout -- site/src/scripts/mermaid.ts site/src/styles/global.css`；笔记侧（若加了图注）`git checkout -- notes/`。
- **依赖**：`G0-1`；**D14 未决**；内容轮（62 条图注的撰写不在本批次范围内）。
- **工作量**：**M**。理由：拼装逻辑一处 + 样式一条；成本在**62 条图注**（属内容轮）与「`%% caption:` 会不会进图」的实测。
- **风险**：① 改了拼装逻辑但 62 条图注一条没加 ⇒ 每张图显示「缺图注」，观感变差（D14）；② `%% caption:` 被渲染进图 ⇒ 全部图变丑（**未实测**，必须先试一张）；③ 用 `innerHTML` 忘记 `esc()` ⇒ XSS/渲染破坏。

#### 步 GF4-3｜〈F4-3〉题库「考察」列的 S 节锚点（客户端装饰）

> **单一主责提醒（M3）**：`notes/mcp.md` 的题库表**表结构由 B-P5 先改**；本步只加**客户端锚点装饰**，不改笔记。

- **id**：`F4-3`｜**归属**：主责在 `B-P5`（表结构）/ `B-P6`（`mcp` 拆节）之后
- **目标**：读者看到「考察 S3+S4」时**能点进去**，而不是自己回翻找小节。
- **现状证据**：表头 **14 处 / 数据行 184 行**（与 GB-2 同一实测：`agent-harness.md:382`(8)、`api-engineering.md:309`(14)、`data-flywheel.md:387`(14)、`durable-execution.md:415`(14)、`evaluation.md:477`(14)、`framework-ecosystem.md:401`(14)、`harness-from-scratch.md:224`(8)、`long-term-memory.md:467`(14)、`mcp.md:542`(14)、`model-basics.md:360`(14)、`multi-agent.md:421`(12)、`observability.md:327`(14)、`sandbox.md:504`(16)、`system-design.md:386`(14)）；
  取值形态混用：`S1`–`S8`、`S2+S4`、`S3+S4`、`S1+S5`、`S7 + S4.4`、`S1/S2`、`S5/S10`（**`/` 与 `+` 混用、有空格差异**）；
  小节真形态 `## S1 …`（h2）；锚点算法 `site/src/utils/toc.ts:11-21` 的 `slugify` + `:23-48` 的 `extractToc`；
  **已有同机制的现成实现**：`c/[slug].astro:40-51` 的 `bankAnchor(prefix)`（`toc.find(t => t.text.startsWith(prefix))`，`:45` 解析不到即 **fail-fast**）⇒ **必须复用这套机制，不另写一套**。
- **具体改法（选定：`c/[slug].astro` 新增客户端脚本，与 `mermaid.ts` 同为 DOM 装饰、零管线风险）**：
  1. **不改笔记**：把 `S3` 改写成 `[S3](#s3-…)` 要**手算** 184 行 × 平均 1.5 个引用 ≈ 280 处锚点，且 heading 一改就全断（正是 `c/[slug].astro:36-38` 注释记录过的「锚点静默失效」事故形态）⇒ 笔记侧零改动；
  2. **不在构建期注入**：`c/[slug].astro:23` 的 `render(entry)` 返回**组件**不是 HTML 字符串 ⇒ 构建期无法替换已渲染 body；走 remark 插件需复刻 slug 算法，**复刻出错 = 静默错锚点**；
  3. **客户端脚本要点**：只处理 `article.markdown table td`，匹配 `/^S(\d)(?:\s*[+/]\s*S(\d+(?:\.\d+)?))?(?:\s+.+)?$/`；
     **必须做「只在该表生效」的头判定**——`td.closest('table')?.querySelector('thead tr th:last-child')` 且 `/考察/.test(th.textContent)`；
     锚点从**页面真实 heading id** 取（`h.id === no+'-' || h.id.startsWith(no+'-')`），**找不到就不加**（绝不产坏锚点）；
  4. 样式：`global.css` 的 `.markdown table` 区域（`:515-538`）之后加 `.markdown td a.s-anchor { text-decoration: none; border-bottom: 1px dotted var(--accent); }`；
  5. **无 JS 时退化**为纯文本（现状），**不产**坏链接。
- **派生还是手工**：**派生**（锚点从页面真实 heading id 派生，零手抄）。这是本组**唯一**「一次实现、184 行受益」的条目。
- **验收命令（可重跑）**：
  - **可机器验证**：
    1. **锚点可达性（核心判据）**（命令原文见 03 F4-3 验收第 1 条）：对每个「考察」表的 S 值检查同文件是否存在 `## S<n> ` 或 `### S<n>` 标题 → 期望 `无对应标题 = 0`
       （**若这个数不为 0，本条目标不可达——必须先修笔记或改设计**）；
    2. **头判定范围保护**：实测 278 条编号行里只有 **184** 行属于「考察」表 ⇒ 不加头判定会把 `P0/P1/P2`、`tool_calls`、`⑤` 也当锚点候选；
       用 `grep -c` 核对「考察表数据行 = 184」与脚本处理的 `td` 数一致；
    3. `node site/tools/check-classes.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`（`.s-anchor` 在定义集与输出集都要有）；
    4. `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`。
  - **必须留浏览器目检**：`/c/durable-execution/`（及任一有多 `/` 混用的课）点每个 S 锚点**是否跳到正确小节**；
    无 JS 时页面仍是纯文本且**无坏链接**；375px 下带下划线的单元格不破坏表格横滚。
- **回滚点**：`git checkout -- site/src/pages/c/[slug].astro site/src/styles/global.css`（笔记侧零改动）。
- **依赖**：`GB-2`（题库表结构先定）；`GB-3`（`mcp` 拆节会改变 S 节标题集合 ⇒ 顺序**必须**是 GB-3 之后）；`G0-4`（类集合门禁）。
- **工作量**：**M**。理由：一段客户端脚本 + 一条样式；成本在**头判定**（否则 278 行误伤）与**混用形态的正则**（`/` 与 `+`、空格、`S4.4`）。
- **风险**：① **不加头判定** ⇒ 把速查表的 `P0/P1/P2`、`tool_calls`、`⑤` 当锚点候选（已点名）；② 在笔记侧手算锚点 ⇒ 静默失效；
  ③ 在 `GB-3` 拆节**之前**落地 ⇒ `mcp` 页的 S4 锚点集合随后变化，脚本虽然用运行时 id 不受影响，但**判据 1 的静态检查会红**。

#### 步 GF4-4｜〈F4-4〉`details` 页结构化呈现（**呈现层，与 GB-1 分工**）

- **id**：`F4-4`（单一主责 = `B-P4` 的**文本**改动；本步只改呈现层，§1.5 M4）
- **目标**：把 8 篇结构完全一致的 details 页从「单栏长页」变成**结构化呈现**，让「一句话定义 / 为什么影响 / 一手源 / 本地映射 / 面试一句话」五节可比、可折叠。
- **现状证据**：8 篇结构**逐字同构**（每篇 `# 资深分水岭 N:…` 于 `:10` + 五个 h2；标题文本与顺序**完全一致**，行号略有 ±1 差异）；
  渲染 `site/src/pages/details/[slug].astro:42` 是**单栏** `<article class="markdown">`，`:60` `<Content />` 直出 ⇒ **details 页没有 TOC 侧栏**，8 篇却都有 5 个可导航小节；
  `:80` 全文**无** `<style>` 之外的结构类；`:69-79` 的 `<style>` 只有 `.chip-src`；`details/index.astro`（201 行）是列表页，`:70/93/117` 三处渲染 `kind-${kind}` chip。
- **具体改法**：`:42` 外层改为 `<div class="course-layout">` 包住 `<article class="markdown">`，并在其前加 `<aside class="toc">`（`{toc.length > 0 && …}`，用 `<details open><summary>本页目录</summary><ul>…</ul></details>`）；
  第 2–5 节做成 `details` 折叠（**注意**：这与页面自身叫 `details` 是两回事，容易混）。
- **派生还是手工**：**派生**（TOC 从 `extractToc` 派生）+ **手工**（哪些节折叠）。
- **验收命令（可重跑）**：
  - **可机器验证**：`grep -n 'course-layout\|class="toc"' site/src/pages/details/[slug].astro` → 期望命中；
    `node site/tools/check-classes.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`（`.course-layout`/`.toc` 必须同时在定义集与输出集）；
    `node site/tools/check-details.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`（GB-1 的判据仍绿）；
  - **必须留浏览器目检**：`/details/04-token-economics/` 侧栏 TOC 是否出现且锚点可跳；折叠态下五节的可比性；375px 下单栏 + TOC 是否挤压正文。
- **回滚点**：`git checkout -- site/src/pages/details/[slug].astro`（+ `global.css`）。
- **依赖**：**D15（若涉及折叠取舍）**；`GB-1`（文本先定）；`G0-4`。
- **工作量**：**M**。理由：一处布局包裹 + TOC 组件 + 折叠取舍 + 3 项目检。
- **风险**：① 与 `GB-1` 抢同一个文件（**本步只改 `.astro`，不碰 `.md`**）；② TOC 锚点与页面真实 id 不一致 ⇒ 死锚点；③ 折叠后**打印丢内容**。

#### 步 GF4-5｜〈F4-5〉`details` front-matter 六字段呈现收口

- **id**：`F4-5`（同 M4：本步只改呈现）
- **目标**：把 8 篇的 `title`/`slug`/`domain`/`source`/`status`/`kind` 六字段的呈现收口成一致形态。
- **现状证据**：front-matter 六字段实测存在（`notes/details/01-context-rot.md:1-8` 一带，**已复核**：头 6 行确有 `title/slug/domain/source/status`）；
  渲染点 `details/[slug].astro:43-54` 的 `.course-meta-bar`；`slug` 与 `title` **不在** meta 条里（`title` 只进 `<Base title>` 于 `:41` 与面包屑末项于 `:56`）；
  `KIND_LABEL` 映射（`:22-27`）只覆盖 **3** 个值（`interview-question`/`design-detail`/`cost-detail`）；
  `details/index.astro:70/93/117` 是否**重复定义**了 `KIND_LABEL` —— **本轮未核对**（03 依据不足项）⇒ 实施前**必须先读该文件**。
- **具体改法**：把六字段的呈现收口到 `.course-meta-bar` 一致形态（补 `slug`/`title` 的可见位）；若 `details/index.astro` 重复定义了 `KIND_LABEL` ⇒ 抽共享常量（**先读原文再决定**）。
- **派生还是手工**：**派生**（从 front-matter 派生）+ **手工**（栏位取舍）。
- **验收命令（可重跑）**：
  - **可机器验证**：`grep -n 'KIND_LABEL' site/src/pages/details/*.astro` → 期望**只有一处定义**（抽出后）；
    `grep -c 'kind:' notes/details/*.md` → 期望 8 处都有 `kind`；
    `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`。
  - **必须留浏览器目检**：8 篇的 `.course-meta-bar` 形态一致（逐个打开，或用一次三视口目检覆盖几篇）。
- **回滚点**：`git checkout -- site/src/pages/details/*.astro`。
- **依赖**：`GB-1`；**实施前必须先读 `details/index.astro`**（依据不足项）。
- **工作量**：**S**。理由：一处 meta 条 + 可能的常量抽取；成本在「先读 `details/index.astro`」。
- **风险**：① 未读 `details/index.astro` 就抽常量 ⇒ 漏掉第二处定义；② 补 `title` 进 meta 条后与面包屑重复 ⇒ 目检确认。

#### 步 GF4-6｜〈F4-6〉`c/[slug].astro:61` 的 chip 兜底分支（**受硬顺序 H-1 约束**）

- **id**：`F4-6`｜**必须在批次 A 删 `phase` 之前/同批完成**
- **目标**：课程页 meta 栏的档位 chip 只有一个来源（`course-structure.ts` 的 `stage`），不再有 legacy 兜底。
- **现状证据**：`site/src/pages/c/[slug].astro:61` `<span class="chip">{structure ? structure.stage : meta.phase === '—' ? '未分阶段' : meta.phase}</span>`；
  `structure` **恒 truthy**（`getStaticPaths()` 用 `EXCLUDED_FROM_COURSE_ROUTE` 过滤）⇒ 该兜底分支**不可达**（死分支）。
- **具体改法**：整段兜底分支删除 → `<span class="chip">{structure.stage}</span>`；`:27-28` 注释改为「structure 缺失即 fail-fast」；
  **更强做法**：`:29` 后加构建期断言 `if (!structure) throw new Error(...)`，把「死分支」变成「不可能」。
  **顺序**：必须**先**改 `check-counters.mjs:127` 的解析（步 GA-6/GA-1 步骤 3 的前置），**最后**才删 `phase` 字段（H-1）。
- **派生还是手工**：**派生**（chip 值从 `stage` 派生）。
- **验收命令（可重跑）**：
  - **可机器验证**：`grep -n '未分阶段\|meta.phase' site/src/pages/c/[slug].astro | wc -l` → 期望 **0**；
    `grep -n 'throw new Error' site/src/pages/c/[slug].astro` → 期望命中（若采纳 fail-fast）；
    `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`；
    **含**：`grep -rn '\.phase\b' --include=*.astro site/src/ | grep -v 'phase-head\|phase-section\|phase-desc' | wc -l` → 期望 **0**。
  - **必须留浏览器目检**：`/c/<slug>/` 课程页 meta 栏第三个 chip 在**全部 17 页**都显示五档（不是空白、不是「未分阶段」）。
- **回滚点**：`git checkout -- site/src/pages/c/[slug].astro`（**必须与 `courses.ts` 的 `phase` 删除同提交回滚**，否则死分支引用不存在的字段）。
- **依赖**：`GA-6`（判据 13；05 已复核：死分支成立依赖 `COURSE_STRUCTURE ⊇ Notes 顶层 − EXCLUDED`，这个包含关系**由判据 13 补位**）；**H-1**。
- **工作量**：**S**。理由：一处删除 + 一句断言 + 17 页目检（目检是主要成本）。
- **风险**：① **顺序反了** ⇒ 门禁 ≥5 条判据同时失配 ⇒ 部署停更（H-1）；② 删了分支但没补判据 13 ⇒ 「死分支」的成立前提无人守。

#### 步 GF4-7｜〈F4-7〉`works.astro` `⚠️` 警示块的层级

- **id**：`F4-7`
- **目标**：把「本值不是『有 `npm run demo` 的目录数』」这句从正文段里提出来，层级上成为**明确的警示块**。
- **现状证据**：`site/src/pages/works.astro:404-415` 的 `<section>` → `:405` `<h2>口径说明</h2>` → `:406-414` 单个 `<p class="work-soft">`；
  样式 `.work-soft` 在 `:429`（页面级）`{ color: var(--text-soft); font-size: 0.9rem; }`；
  这句内容属 **A4/P10 的关联项**（「6/10/11/17 四个数指同一批目录」）——**本步只改层级，不改措辞与数字**。
- **具体改法（**已修正**）**：新增警示块样式**必须用 `--deny`**（`global.css` **无 `--warn` 变量**，03 就地更正的实测）；把 `:406-414` 的 `<p>` 提升为 `<p class="work-warn">` 或独立 `<aside>`。
- **派生还是手工**：**手工**（层级与样式）。
- **验收命令（可重跑）**：
  - **可机器验证**：`grep -n 'work-warn\|work-soft' site/src/pages/works.astro site/src/styles/global.css` → 期望两处一致；
    `grep -n -- '--warn' site/src/styles/global.css | wc -l` → 期望 **0**（该变量不存在，不要引用）；
    `node site/tools/check-classes.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`；
    `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`。
  - **必须留浏览器目检**：`/works/` 的「口径说明」节在 375px 下警示块与正文的层级对比是否**一眼可辨**（这是本条的目标）。
- **回滚点**：`git checkout -- site/src/pages/works.astro site/src/styles/global.css`。
- **依赖**：`GA-4`（措辞与数字由 A4 主责）；`G0-4`。
- **工作量**：**S**。理由：一处 class 提升 + 一条样式 + 1 项目检。
- **风险**：① 引用不存在的 `--warn` ⇒ 样式静默失效（**已修正**）；② 顺手改数字/措辞 ⇒ 与 A4 冲突（**禁止**）。

#### 步 GF4-8｜〈F4-8〉`mcp` S4 双清单的窄屏呈现约束（**主责在 B-P6**）

- **id**：`F4-8`｜**归属**：呈现侧约束登记，**主责在步 GB-3（P6 拆节）**
- **目标**：只登记**呈现侧约束**，供 P6 拆节时一并满足；**本组不另立拆节设计**。
- **现状证据**：`notes/mcp.md:7` 的用法行自述「S4 是安全全景（两套 OWASP 清单 + 防御分层）」；`notes/mcp.md` 的 mermaid 块数 **5**（全仓最多）；
  呈现层事实（已核）：`.markdown table { display: block; overflow-x: auto; max-width: 100% }`（`global.css:512-515`）。
  **03 明确：S4 区间的表结构本轮未逐行读**（依据不足项）⇒ 实施前**必须先读**。
- **具体改法**：三条约束交给 GB-3：① 双清单不得并排在同一小节内（会加宽表格）；② 表内横滚可用性优先于美观；
  ③ **不使用 HTML `<details>` 折叠表行**（会破坏 GFM 表格语义与 `extractToc` 之外的可搜索性）。
- **派生还是手工**：**手工**（约束遵守）。
- **验收命令（可重跑）**：
  - **可机器验证**：**归 P6**；本组给出的判据是 `grep -c '^## S4' notes/mcp.md` **= 1** 且 S4 小节内 `|` 表行数 ≤ N（N 由 P6 定）；
    `node site/tools/check-counters.mjs; echo "EXIT=$?"` → 期望 `EXIT=0`。
  - **必须留浏览器目检**：`/c/mcp/` 在 **375px** 下 S4 区域的**表内横滚可用性**（能否看到最右列的数值）——**留浏览器目检**（`mcp` 页**不在** `visual-check.mjs` 的 `PAGES` ⇒ 无几何断言覆盖）。
- **回滚点**：无独立回滚（随 GB-3）。
- **依赖**：`GB-3`；**实施前必须先读 `notes/mcp.md` 的 S4 区间表结构**（依据不足项）。
- **工作量**：**S**（登记与目检）。
- **风险**：① 拆节后把两套 OWASP 清单并排 ⇒ 窄屏更拥挤；② 用 HTML `<details>` 折叠表行 ⇒ 破坏表格语义。

---

## ④ 防复发机制（门禁扩展、白名单、术语与题库的结构判据）

> **本节回答的问题**：改完这一轮，**下一轮还会不会退回去**？
> 全部机制的实现落点都在 `site/tools/`，且**必须**接入 `site/build.sh:41-46` 的同一段插入点（H-3），
> 否则「本地无门禁、只有 push 后才发现」（`build.sh` 原文的动机说明）。

### 4.1 门禁扩展总表（判据 12 → 30）

| 判据 | 名称 | 实现落点 | 期望值来源（真源） | 防范的复发形态 |
|---|---|---|---|---|
| 13 | 课程结构覆盖全部课程页 | `check-counters.mjs` | `COURSE_STRUCTURE` 的 17 slug vs `act.courseSlugs`（`:138`） | 课程页「学习路径」模块静默降级 |
| 14 | 课程总表「阶段」列 == `stage` | 同上 | `course-structure.ts` 的 `stage` | 阶段列手抄漂移（**必须新增 slug 列，不能用主题名匹配**） |
| 15 | `HORIZONTAL_SLUGS` == `isHorizontal` 集合 | 同上 | `course-structure.ts` 的 `isHorizontal` | 横向资产集合漂移（第 5 份清单） |
| 16 | 门禁解析锚点自检（`COURSES` 条目数 == 18） | 同上 | 解析结果 | manifest 变了但解析正则没改（静默产出 `entries=[]`） |
| 17 | 依赖图与 `prereqs` 一致 | 同上（逐字节比对 `BEGIN/END:dep-graph` 区间） | `course-structure.ts` 的 `prereqs` | 手抄图回潮 |
| 18 | 面试汇聚列表的课程集合正确 | 同上 | `next` 为空或 `stage ∈ {P2,P3,P4}` 的集合 | 替代 `INTERVIEW` 边的文字列表漏课 |
| 19 | `km:128` 区间无箭头链 | 同上 | 该区间 `→` 计数 = 0 | 「备课顺序」与阅读序再次混称 |
| 20 | `learn.astro` 无 `#17` 字面量 | 同上 | 插值写法 | 阅读序硬编码回潮 |
| 21 | `WORK_DIRS` 每项存在且含 `package.json` | 同上 | 文件系统 | 作品目录被删/改名而索引未改 |
| 22 | 三份 `COURSE_COUNT`/`CARD_COUNT` 互锁 | 同上 | `courses.ts` 与 `course-structure.ts` | 零读方的第二份常量永久漂移 |
| **23** | **已剔除（reject）** | — | — | 见 §4.3 |
| 24 | 映射表第一列目录集合 ⊇ `WORK_DIRS`（**只断言下界**） | 同上 | `WORK_DIRS` 六件套 | `mcp-demo`/`framework-demo` 式漏登 |
| 25 | `index.astro:34` 的 205 == 口径块 | 同上 | 口径块声明值 | 门禁盲区的源码常量漂移 |
| 26 | `index.astro:35` 的 37 == 口径块 | 同上 | 口径块声明值 | 同上 |
| 27 | `handoff.md:191` 六个数逐个 == 口径块 | 同上 | 口径块 | 「唯一参照声明句」自身漂移 |
| 28 | `README.md` 的作品数 6 登记 | 同上 | `WORK_DIRS.length` | README 与源码不一致 |
| 29 | **反向断言：未登记项 = 0** | 同上（**白名单机制**） | 扫描面内的精确量词数字 | 新一轮手抄数字直接逃过门禁 |
| 30 | **反向断言：白名单失效项 = 0** | 同上 | 白名单自身的有效性 | 白名单腐化 ⇒ 门禁退化为全豁免（**比不做更糟**） |

**另有两条独立门禁**（不进 `check-counters.mjs`，但同插入点接入）：

| 门禁 | 脚本 | 判据 | 防范的复发形态 |
|---|---|---|---|
| 类集合门禁 | `site/tools/check-classes.mjs`（新，步 G0-5） | 定义集 − 输出集 = 0（**输入面 = `site/src/**`**）+ 白名单失效检测 + `--self-test` | 选择器挂在从未存在的祖先类下而**静默失效** |
| 术语首现门禁 | `site/tools/check-terms.mjs`（新，步 GB-4） | 11 个术语的阅读序首现 `file:line` 与登记值一致 | 首现按字母序算错（SSE 的经典错法） |
| `details` 格式门禁 | `site/tools/check-details.mjs`（新，步 GB-1） | R-D1 锚点可解析 / R-D2 数字级跨行矛盾 / R-D3 行内「已落地 + 仍缺」 | 「未覆盖」栏写成无据叙述 |
| 依赖图生成器 | `site/tools/gen-dep-graph.mjs`（新，步 GA-2） | 默认 `--check` 只读 + 解析自检「17 门否则 throw」 | 派生器静默产出空图 |

### 4.2 白名单机制（唯一能防「新数字逃过门禁」的机制）

- **扫描面**：`site/src/**` + `README.md` + `handoff.md`，**显式排除 `site/tools/**`**（**已修正**：否则命中新判据自身的字面量 → 自指红）。
- **精确量词集**：`课|门|个|页|卡|域|题|作品|demo`。
- **跳过规则**：**插值行跳过**（模板变量所在行）；**叙述行豁免并打印**（豁免必须可见，不能静默）；**中文数字窄规则**（覆盖 `handoff.md:199` 的「十六个知识域」——单靠 `\d+` 抓不到）。
- **登记项格式**（每项必须写清口径来源与理由）：
  ```json
  { "file": "site/src/pages/index.astro", "line": 34, "value": 205, "claim": "exercises", "reason": "源码常量 Q_IN_LESSON；已由判据 25 锁定" }
  ```
- **双向断言（缺一不可）**：**判据 29** = 没有未登记的业务量词数字；**判据 30** = 白名单里没有已失效项。
  **判据 30 是强制项**——只做判据 29 的话，把所有命中项都收进白名单就永远绿，**比不做更糟**（给人虚假安全感）。
- **红线**：`handoff.md:199` 的「十六个知识域」是**现存失真（冻结口径 15）**，**不得**登记进白名单——白名单化 = 把失真合法化（05 坑 15）。它要走 D5 的拍板路径。

### 4.3 被剔除/降级项的防复发替代（记录以免下一位实施者重新发明）

| 被剔除项 | 原判 | 替代机制 |
|---|---|---|
| **判据 23**「计数清单全派生」 | `reject`（05 F-D3） | **删除判据 23**；「精确 `demo` 键目录 = 10」改为**从文件系统重算**的**事实断言**（**不许硬编码 10**，否则就是「用门禁制造了第四个副本」）；「清单仍三份」的状态由判据 22/25/26/27/28 的互锁覆盖，由 D 段（§6）决定是否继续收敛 |
| **02 的 B-5 门禁**（`grep 'S4\.2' notes/` 期望 0 命中） | `reject` | 改为「**只断言 `notes/mcp.md` 页内节号自洽**」（解析该页 h2/h3 节号集合，页内引用的主节号必须存在）；**不**要求全仓 `S4.2/3/4` 归零 |
| **A7 原「反向断言扫全部数字」** | `needs_revision` | 只扫**精确量词 + 业务数字**，并用白名单 + 判据 29/30 双向断言；**不**扫非口径数字（01 已列 5 类 13 处非口径数字说明为什么不能扫全部） |
| **A1 原验收「`\.phase\b` 期望 0 行」** | `needs_revision` | 加 `| grep -v 'phase-head\|phase-section\|phase-desc'`（那三个是 CSS 类名） |
| **A2 原验收「`HARNESS --> MCP` 命中 0」** | `needs_revision` | 改用判据 17 的**逐字节比对**（不靠边名字面量） |

### 4.4 术语与题库的**结构判据**（不依赖内容的机械形状）

> 这两类内容的复发形态是「**格式悄悄变形**」，而不是「数字错」。故判据断言**结构**，不断言措辞。

| 对象 | 结构判据 | 为什么是结构而不是内容 |
|---|---|---|
| 题库「合格线」列 | **R-Q1** 列存在（**含「删考察列」反向保护**）；**R-Q2** 非空格式（`≥N 点：` + ≥2 圆码要点 + ≤120 字）；**R-Q3** 题量守恒（176 + 8 = 184 行） | 内容质量（合格线写得好不好）机器判不了；但「这一列在不在、格式对不对、行数有没有少」完全可判 |
| 术语表 | 6 字段齐备（术语/中文全称/一句话定义/首现 `file:line`/所属课程/关联术语）；**首现按 `course-structure.ts` 数组序**（非字母序）；**SSE 回归保护** | 定义措辞是人的判断；但「首现位置」是可重算的派生事实 |
| `details` 「未覆盖」 | **R-D1** 锚点可解析（`file:line` 存在且行号在范围内，**不允许 URL 作锚点**）；**R-D2** 数字级跨行矛盾（**token 族排除 `n²`**）；**R-D3** 行内「已落地 + 仍缺」并存 | 逐页语义复核靠**人读 8 步流程**；判据只拦结构性矛盾 |
| 依赖图 | 节点定义 17 / 带档位 14 / 冲突 0 / 一致 14（**改前为 9 冲突 / 5 一致**）；`classDef` = 4；`📐` = 0；`INTERVIEW` 实线 8 / 虚线 4 | 图「好不好看」只能目检；但「标签是否等于 `stage`」完全可判 |
| 题库表位置 | 题库节标题与表格之间**禁插 `#`–`###` 标题**（会截断门禁 `inBank` 状态） | 是一条**写进实现的断言**，不是文档约定 |

---

## ⑤ 风险与回滚预案

### 5.1 风险等级总表（按「后果严重度」排序，不按概率）

| # | 风险 | 触发动作 | 后果 | 已有的封死手段 |
|---|---|---|---|---|
| R1 ★ | **部署停更** | 删 `phase` 与改 `check-counters.mjs:127` 解析**不同提交** | `entries=[]` → ≥5 条判据同时失配 → `build.sh:41` 中止 → **GitHub Pages 停止更新** | H-1 硬顺序 + 互斥组 G-A0 + 门禁验收 A-G1 |
| R2 ★ | **`hardError`** | 在 `notes/knowledge-map.md:8-19` 之间插空行 | 口径块截断 → `num()` 返回 null → 门禁 exit 1 → 部署停更 | §1.6 三批次共用铁律 + C-1 验收第 4 条（`sed -n '8,19p' | grep -c '^$'` 期望 0） |
| R3 ★ | **部署停更** | 删新脚本却留下 `build.sh`/`verify.yml` 的调用 | `set -e` 下构建中止 | 每个新脚本的回滚点都写明「同提交撤回调用」（H-3） |
| R4 ★ | **CI 永久红** | 回滚 A2 的 `km` 文本但留着判据 17 | 图与 `prereqs` 本来就不一致（那是现状）⇒ 永久红 | A2 回滚点写明 R4 是**单向门**，必须同提交回滚 |
| R5 ★ | **永久红 / 越界** | 照 02 原 B-5 门禁行动（`grep 'S4\.2'` 期望 0） | 不可能绿；为变绿去改 `sandbox.md:300/:311/:315`、`framework-ecosystem.md:188/:208` = **越界改别人的节号** | **该项已剔除**（reject）+ 替代判据（只查 `mcp.md` 页内自洽） |
| R6 ★ | **判据红** | 在题库节标题与表格之间插 `#`–`###` 标题 | `inBank` 状态被截断 → `课内嵌题` 变少 | M3 主责表 + B-P6 验收第 5 条（安全插入区 `notes/mcp.md:544` 之前） |
| R7 ★ | **语料漂移无告警** | 改 `notes/agent-harness.md`/`handoff.md`/`notes/rag.md` 却不重跑 `demo:eval` | `rag.md §13` 的 132 chunks / recall / PASS 可能漂移而门禁**不覆盖语料**（`rag-demo` **不在 CI**） | GB-2 验收第 7 条（必须重跑并记录漂移）+ GB-2 风险② |
| R8 ★ | **门禁被绕过** | 用 `npm run build:fast` 绕过门禁 | 把「部署级门禁」降级为可选 | 05 §1.0 明文：实施期**不得**用该旁路绕过门禁（它是本机调试旁路） |
| R9 ★ | **门禁被废弃** | 新增 18 条判据后耗时升到分钟级 | 「门禁被绕过的第一天起它就等于不存在」 | GA-6 验收第 8 条：`/usr/bin/time` 期望 **< 2s**（现状 0.09s） |
| R10 ☆ | **读者可见退化** | 照 01 伪码原样实现 A2 渲染段 | 图退化为 `flowchart LR` + slug 标签 + 无色，**CI 测不出**（`mermaid-check` **不在 CI**） | GA-2 契约 1–6 + 验收 4/5/6/7 条 + 目检 |
| R11 ☆ | **误伤 01** | `check-details.mjs` 的 R-D2 用「任意 token 交集」 | `n²` 被判红 | R-D2 必须用**数字 token**；把「01 必须绿」写成脚本自测用例 |
| R12 ☆ | **门禁恒真** | F0-4 类集合门禁拿 `site/dist` 当输入 | dist = 89 文件 / **0 HTML** ⇒ 基准为空 | 输入面 = `site/src/**` + 「输入面为空即 exit 1」断言 + 反例验收（G0-5 验收第 3 条） |
| R13 ☆ | **门禁恒真（更隐蔽）** | 白名单把命中项全收进去且不做 stale 检测 | 门禁永远绿，**比不做更糟** | 判据 30 为**强制项** + 负路径 2（失效白名单项必须报） |
| R14 ☆ | **自指红** | 反向断言扫描面含 `site/tools/**` | 命中新判据自身的字面量 | 扫描面显式排除 `site/tools` + 负路径 7（自指反例） |
| R15 ☆ | **语义错位** | 把「17 个 demo」改成 `WORK_COUNT`(6) | 换错集合（`mvps.ts:13` 明文「两个不同口径」） | GA-4 风险① + A-G6/A-G7 验收 + M1 单一主责 |
| R16 ☆ | **失真合法化** | 把 `handoff.md:199`「十六个知识域」登记进白名单 | 白名单化 = 承认失真 | §4.2 红线 + 05 坑 15 |
| R17 ☆ | **改一半** | 同一行被两批各改一次 | 冲突或半成品 | §1.5 单一主责表（M1–M4）+ H-5 |
| R18 ☆ | **判据与文案自相矛盾** | 判据 19 与 A3 的文案不一致 | 判据绿但文档自相矛盾 | GA-3 风险②（逐字对齐后再落地判据） |
| R19 ☆ | **不实陈述新增** | 在 A2 未落地时把 `/learn/` 句子改成「图由代码生成」 | 制造新的不实陈述 | GF2-4 改法明文禁止 |
| R20 ☆ | **CI 红（口径级联）** | D4 选 (b)/(c) 建术语表页面而忘了同步 `verify.yml:105` 的 `-eq 33` | 33 → 34 未同步 ⇒ CI 红 | GB-4 验收第 4 条 |
| R21 ☆ | **越界改别人的节号** | 为满足 B-5 去改 `sandbox.md`/`framework-ecosystem.md` | 越界 + 破坏别的课的自洽 | R5（该门禁已剔除） |
| R22 ☆ | **未验证当已通过** | 把「本机构建成功」当 CI 绿、把 HTTP 200 当页面正确 | 交付失实 | §2 各批次门禁的「必须留浏览器目检/留实跑」分段 + `00-plan-scope.md` §4 |

### 5.2 回滚矩阵（逐类给出可执行命令）

| 改动类 | 回滚命令 | 必须同提交/同批回滚的连带项 |
|---|---|---|
| **单文件文本**（`notes/*.md`、`notes/details/*`） | `git checkout -- notes/...` | 相关判据（判据 14/17/18/19/24/R-Q*/R-D*/术语首现） |
| **单文件源码**（`site/src/**`） | `git checkout -- site/src/...` | 若删了字段（`phase`）⇒ 必须与门禁解析改动**同一提交**回滚 |
| **新脚本**（`check-classes.mjs`/`gen-dep-graph.mjs`/`check-terms.mjs`/`check-details.mjs`） | `rm site/tools/<新脚本>` | **必须同提交撤回 `site/build.sh`（与/或 `verify.yml`）里的调用**，否则 `set -e` 下构建中止 ⇒ 部署停更（R3） |
| **仓库级文本回滚但留判据** | **禁止**（单向门） | A2：回滚 `km` 图区但留判据 17 ⇒ **CI 永久红**（R4） |
| **`courses.ts` 的 `phase` 删除** | revert 那一个提交 | 判据 16（解析锚点）必须同提交 |
| **口径块数字/措辞**（`notes/knowledge-map.md:8-19`） | `git checkout -- notes/knowledge-map.md` | 与口径块相关的判据；**且必须确认回滚后 `:8-19` 无空行** |
| **术语表落点选 (b)/(c)** | `git checkout -- notes/*.md site/src/pages/*.astro .github/workflows/verify.yml` | **`verify.yml:105` 的 `-eq 33` + 口径块数字**必须同批回滚（R20） |
| **构建产物**（`site/dist`、`site/tools/out/*`） | `rm -rf site/dist` / 手工删日志 | **不入库**；`site/.astro`、`site/node_modules` **不得**为回滚而删 |
| **白名单条目** | 删条目 | 判据 29/30 会报「失效白名单项」（正确行为，不是 bug） |

**回滚演练要求（执行轮）**：每个批次收尾时，**至少**对「新脚本类」与「字段删除类」各做一次回滚演练（删 → 跑 `bash site/build.sh` 确认**构建不会因残留调用而中止** → 复原）。
这一步不做，R3 就是纸面条款。

---

## ⑥ 未决决策点（需用户拍板，不许代替决定）

> **纪律**：本节每条**都由用户拍板**。给出的「默认执行路径」只用于「未拍板时如何不阻塞其余工作」，**不是**替用户决定。
> 若某步依赖未拍板的决策，**默认按默认路径做**，并在提交说明里标注「本处受 D<n> 约束，若拍板不同需重做」。

### 6.1 批次 A 相关

| id | 决策点 | 选项 | 影响 | 默认执行路径（未拍板时） |
|---|---|---|---|---|
| **D1** | 横向两课（`llm-timeline`/`industry-2026`）在 `/learn/` 的阶段归属 | (a) 保留 `stage: 'P0'`/`'P4'`，渲染层按 `isHorizontal` 先分桶、另设「横向知识」段；(b) `stage` 改为不可表达（动 `Stage` 类型与三处 `STAGE_COUNTS` 消费：`nav.astro:103`、`learn.astro:80/:116/:272`、`index.astro:82`）；(c) 两者都不在 `/learn/` 出现 | (b) 语义最干净但风险最高；(a) 零类型改动；(c) `/learn/` 少内容 | **(a)** |
| **D2** | `notes/knowledge-map.md:128` 是「备课顺序」还是「选题优先级」 | (a) 改成「按目标岗位权重的选题优先级（不构成阅读顺序）」、去箭头链；(b) 保留为「教学方备课顺序」并显式标注视角 | 决定这句话的语义；两条路径都满足判据 19（无箭头链） | **(a)** |
| **D3** | 依赖图的落法 | （01 已选「预生成 + 受保护区间」，本项**已定**，此处登记以免反复） | — | 已定：(a) 预生成 + `BEGIN/END` 区间 |
| **D4** | 映射表是否登记 `my-agent` 与 3 个新 demo 目录 | (a) 只补 `mcp-demo`/`framework-demo`（表 8 → 10 行）；(b) 把 7 个小 demo 全列（表 → 15 行），含 `my-agent`/`final-project` | 表的定位（能力证明索引 vs 目录台账） | **(a)** |
| **D5** | `notes/process/site-refactor-plan.md` 的边界 | （01 的 D5 原文：`404.astro`/`Base.astro` 能否 `import site/src/data`）——**与 03 的 D4 实为同一决策** | 决定 404 页是 import `WORK_COUNT` 还是保留手抄 `6` 并登记白名单 | **(b) 保留手抄 + 登记白名单**（尊重 `404.astro:9-10` 注释边界） |
| **D6** | 新增解析器是否抽文件 | (a) 三处各自写正则并在 01 里约定；(b) 抽 `site/tools/parse-courses.mjs` 供两处 import（纯 JS 模块可满足「不 import TS」的设计约束） | 避免两份算法漂移 | **(b)**（与 03 的 D10 同一决策） |
| **D7** | `phase` 字段是否真的删（A1-c 步骤 3） | (a) 删；(b) 保留但标 `@deprecated` | 决定是否触发 H-1 的全套同提交要求 | **(a) 删**（三步瘦身后） |
| **F-D2** | `index.astro:34-35` 的 205/37：构建期派生（照 `ragStats.ts`）还是「常量 + 判据 25/26」 | (a) 构建期派生；(b) 常量 + 判据互锁 | (a) 要复制门禁的重算算法到站点（**违背纪律 #5**，因为门禁是 `.mjs` 不 import TS） | **(b) 常量 + 判据 25/26** |
| **F-D3** | 判据 23 的存废 | 05 判 `reject` | — | **已剔除**（见 §4.3） |
| **F-D5** | `handoff.md:199`「十六个知识域」= 失真（改 15）还是别的口径（加说明） | (a) 改 15；(b) 加口径说明 | 涉及语料回归成本（`handoff.md` 是 `demo:eval` 语料成员！） | **不在此轮改**，登记为待拍板（**不得**登记进白名单） |
| **U9** | `km:55-68` 的「主题」列与 `domain` 字段的 14 组逐行差异全貌 | （01 的依据不足项） | 判据 14 的「新增 slug 列」需人工填 14 个 slug，**填错一格会长期误报或漏报** | **实施前必须逐行 diff 补齐**（判据 14 的前置） |

### 6.2 批次 B/C 相关

| id | 决策点 | 选项 | 影响 | 默认执行路径 |
|---|---|---|---|---|
| **02-D1 / F-D4** | 术语表落点 | (a) `notes/knowledge-map.md` 新增 `## 术语表`（零计数级联）；(b) 新建 `notes/glossary.md`（顶层 19→20、站点 33→34）；(c) 站点 `/glossary` 页（33→34） | (b)/(c) 触发 CI 断言与口径块级联 | **(a)** |
| **02-D2** | `B-P5` 分批顺序依据 | (a) 按 08 明示（sandbox 16 / mcp 14 先行）；(b) 按 JD 词频（可观测 57 / 评测 40）；(c) 按「最稀缺故事」 | 只影响批次划分顺序 | **(a)**（批 2 用 (b)） |
| **02-D3** | `notes/model-basics.md:222`「16 题 × 3-5 行标准答案」处置 | (a) 改字符口径；(b) 保留「3-5 行」并加注「按渲染行」 | (a) 是措辞升级而非事实修正 | **(a)** |
| **02-D6** | `notes/llm-timeline.md` 的 10 vs 12 节点 | (a) 只加 `asOf` + 改措辞（10 节点不动）；(b) 补齐到 12 节点（**需先取 2025.09 / 2026.04 / 2026.07 三个节点的公开一手源**；仓内自述**不能**当外部证据） | (b) 需外部取证 | **(a)** |
| **02-D7** | `C-P9` 是否保留「本机构建耗时」 | (a) 删除（口径改写）；(b) 落 CI artifact 后引用；(c) 转存 `/tmp` 日志后引用 | (b)/(c) 前提是**先有日志**，且 artifact 有保留期 | **(a)** |
| **02-D8** | `details/` 8 页是否补「读完能做什么」（06-F7，**medium 未复核**） | (a) 本轮不做；(b) 顺带加一节 | (b) 依赖未复核的 medium | **(a)** |

### 6.3 形式层相关

| id | 决策点 | 选项 | 默认执行路径 |
|---|---|---|---|
| **03-D1** | 死选择器清零方式（`F0-4`） | (a) 直接删 `.lf-count-note`（`learn.astro:341`）；(b) 把 `learn.astro:271/276/281` 的 `lw-count-note` 改成 `lf-count-note` | **(a)**（(b) 会让同一页同时存在 `lw-`/`lf-` 两族命名） |
| **03-D2** | 术语定义放哪（`F1-1`/`F1-2`） | (a) 各自页内 `<details>`；(b) 抽 `site/src/data/glossary.ts` 作真源 + 两处渲染 | **(b)**（与 B-P7 合并，避免第二次搬迁） |
| **03-D3** | `mermaid-check` 的 Chromium 解析（`F0-3`） | (a) 抽 `viz/chrome.mjs` 候选表（复用 `render.mjs:58-66`）；(b) 只读 `CHROME_PATH`；(c) 用 playwright 自身解析 | **(a)** |
| **03-D4** | 404 页是否 import `WORK_COUNT`（`F1-3`） | (a) import `courses.ts`；(b) 保留 `6` + 登记进白名单 | **(b)** |
| **03-D5** | `/nav/` 版面分组范围（`F1-4`） | (a) 全做（年代分组 + 跳转条 + `note` 折叠 + `.so-*` 搬迁）；(b) 只做跳转条 + `note` 折叠 | **(b) 先行** |
| **03-D6** | 是否在段头印难度（`F2-2`） | (a) 不印；(b) 印区间「难度 4–5」；(c) 只印跃变提示（**有实证**的表述） | **(c)**（(b) 若采纳必须同时标「估计」） |
| **03-D7** | `learn.astro:264-286` 口径说明的归属（`F2-3`） | (a) capstone 的子区块；(b) 独立尾注 section（补 `:196` 闭合，`id="caliber"`） | **(b)** |
| **03-D8** | `/map` 口径块是否真折叠（`F2-5`） | (a) 只加跳转条；(b) 真折叠（需 remark 插件或渲染后包装） | **(a)** |
| **03-D9** | 图的 4 色与 `todo`（`F3-1`/`F3-3`） | (a) 保留 4 个 `classDef`（`todo` 空置 + 注明）；(b) 删 `todo` 只留 3 色；(c) 另加第 5 色表达 `isHorizontal` | **(a) + (c)** |
| **03-D10** | `courses.ts` 字段解析策略统一（`F3-1`/`F4-6`） | (a) 各自写正则；(b) 抽共享解析模块 | **(b)**（= 01 的 D6） |
| **03-D11** | `/map` 分工说明的落位（`F3-2`） | (a) 与 `DomainMap` 共用 `slot="before"`（需实测 Astro 多元素具名 slot）；(b) 放进默认 slot 正文之前 | **(b) 除非实测 (a) 生效** |
| **03-D12** | 图是否按阶段 `subgraph` 聚类（`F3-3`） | (a) 纯派生不聚类；(b) 5 个 `subgraph` | **(a)** |
| **03-D13** | 课程页 `>` 元信息块的实现（`F4-1`） | (a) `remark` 插件（进 `astro.config.mjs`，全站生效、无 JS 也有分级）；(b) `c/[slug].astro` 客户端脚本（零管线风险、无 JS 无分级） | **(b) 先行** |
| **03-D14** | 「本图缺图注」提示是否立即打开（`F4-2`） | (a) 立即（内容轮补齐前 62 张图全显示缺注）；(b) 等内容轮补齐后再打开 | **(b) 后置**，先只改样式 |
| **03-D15** | `details` 页做 TOC + 折叠还是加两栏正文（`F4-4`） | (a) TOC + 可折叠；(b) TOC + 两栏对照；(c) 只加 TOC | **(a)**，且**「本地映射」节不得默认收起** |
| **03-D16** | 是否给 `details` 详情页加几何回归（`F4-4`） | (a) 把 `details/01-context-rot/` 加进 `visual-check.mjs` 的 `PAGES`（与 G0-2 同批）；(b) 不加 | **(a)**（现状：详情页**没有任何几何回归**） |
| **03-D17** | `details` 缺失字段是否显式化（`F4-5`） | (a) 不显式（缺失即不渲染）；(b) 在 meta 条列出缺失字段 | **(a)**，把暴露问题留给 B-P4 的正式交付 |

### 6.4 一处「数字三版不一致」必须定版（实施前硬前置）

| 对象 | 三个版本 | 本文档采用 | 定版要求 |
|---|---|---|---|
| 指向 `INTERVIEW` 的边数 | 01 `:239` 写 **4**（虚线）/ 01 `:327` 写 **11**（「11 条中指向 INTERVIEW 的部分」）/ **我实测 12**（8 实线 + 4 虚线，§0.3 V4） | **12（8 实线 + 4 虚线）** | 判据 18 的替代清单必须按 **12** 条写；**三个数字中任何一个都不得直接当事实**，须由执行者**重数一次**后再落地 |
| 图上档位冲突数 | 03 初稿 **11** / 05 勘误 **9** | **9（一致 5 / 合计 14）** | 判据与验收期望值一律用 **9/14**；`16 = 14 课程 + 2 横向` |
| `details` 矛盾页 | 07 原表 **3 页含 01** / 08 修正 **04/08/06** | **04/08/06（01 不矛盾）** | `check-details.mjs` 的反向复现必须**恰好**三红一绿 |

---

## ⑦ 工作量估计与建议排期

### 7.1 逐批次工作量（05 §3 的量级已并入；**标注了 05 的修正**）

| 批次/组 | 步骤数 | 量级 | 依据与 05 修正 |
|---|---|---|---|
| 组 0 | 5 | 2×S + 2×M + 1×M | F0-3 抽模块是 M（不抽则 S）；F0-4 是 M（脚本可照抄，成本在白名单失效检测与负路径） |
| 批次 A | 6（含合并） | 2×M + 2×L + 1×M–L + 1×S | **A6+A7 = L**（18 条判据，且是 4 项闸门的前置）；**A2 = M–L**（**05 修正**：01 原记为 M）；A1 = M；A4 = M；A5 = S；A3 = S |
| 批次 B | 4 | 2×M + 2×L | **B-P5 是 L 且覆盖 184 题**（**05 修正**：02 原 L 只覆盖 92/184，且漏算 `agent-harness.md` 是语料成员）；B-P4/B-P6/B-P7 各 M |
| 批次 C | 2 | S + M | C-P9 = S；C-P8 = M（SDK 版本 12 处**逐处分类**） |
| 形式组 1 | 5 | 3×M + 2×S | F1-1/F1-2 各 M（成本在目检）；F1-3/F1-5 各 S；F1-4 = M（按 (b) 范围） |
| 形式组 2 | 5 | 1×M + 3×S +（1 只读 S） | F2-5 = M；F2-2/F2-3/F2-4 = S；F2-1 是只读校验 S |
| 形式组 3 | 3 | 并入 A2 | 全部在 GA-2 内落地，不单独估 |
| 形式组 4 | 8 | 3×M + 4×S +（1 归 P6） | F4-1/F4-2/F4-3 各 M；F4-4 = M；F4-5/F4-6/F4-7/F4-8 = S |
| **合计** | **37 步**（其中 5 步为「只读校验/无代码改动」） | **约 12 × M + 4 × L + 1 × M–L + ~18 × S** | 见 7.2 的排期 |

### 7.2 建议排期（**按「不可拆的合并单元」排，不按步数排**）

> 排期单位 = **可独立提交的合并单元**（G-A0 / G-KM / G-CC / G-MAP）。同一单元内的步骤**必须一次提交、一次验收**。

| 提交序 | 合并单元 | 含步骤 | 量级 | 前置 |
|---|---|---|---|---|
| **C-0** | 组 0 构建环境 | G0-1…G0-5 | 2S+3M | — |
| **C-1** | **G-BC0**：批次 C 的「删错」+ 组 0 的独立小改 | GC-1（C-P9）+ GB-1（B-P4，可并行） | S+M | C-0 的 G0-1 |
| **C-2** | **G-CC**：门禁扩展（**先落地**） | GA-6（判据 13–30 + 白名单）+ F0-4 接入 `build.sh` | L | C-0 |
| **C-3** | **G-A0 ∪ G-KM**：批次 A 的数据侧（**单次提交**） | GA-1（A0+A1）、GA-3（A3）、GA-4（A4）、GA-5（A5） | M+M+M+S | C-2 |
| **C-4** | **G-MAP**：依赖图派生（**单次提交**） | GA-2（A2+F3-1/2/3）+ GF2-4 | M–L | C-3、G0-4 |
| **C-5** | 批次 B 批 1 | GB-2 批 1（sandbox 16 + mcp 14） | M–L | C-2 |
| **C-6** | `mcp` 拆节 | GB-3 | M | C-5（题号就位） |
| **C-7** | 术语真源 | GB-4 的 `glossary.ts`（**只建真源，不上站**） | S | C-2 |
| **C-8** | 组 1 | GF1-1、GF1-2、GF1-3 | M+M+S | C-7 |
| **C-9** | 组 2 | GF2-1（只读）、GF2-2、GF2-3、GF2-5 | S+S+S+M | C-3（A5 主责）、C-4 |
| **C-10** | 组 4 中与 B-P4 同源的两步 | GF4-4、GF4-5 | M+S | C-1 |
| **C-11** | 组 4 其余 | GF4-1、GF4-2、GF4-3、GF4-6、GF4-7、GF4-8 | M+M+M+S+S+S | C-3（F4-6 受 H-1）、C-6（F4-3 需 S 节标题已定） |
| **C-12** | `/nav/` 与 `index` 版式 | GF1-4、GF1-5 | M+S | C-0、C-3（M1 主责） |
| **C-13** | 术语表上站 + B 批 2/3 | GB-4 主体、GB-2 批 2/3 | M+L | C-7 |
| **C-14** | 批次 C 的时点回填（**最后**） | GC-2（C-P8） | M | C-1 |

**排期纪律（三条）**：
1. **C-2 必须先于 C-3/C-4**（H-4）：先用门禁把口径锁住，再动数据；反向做会让 A7 的 18 条判据一次性爆出大量历史失真而无法归因。
2. **C-3/C-4 是两次提交但一次验收**：两次提交之间**不得**跑部署（`build.sh` 未过门禁时 `set -e` 会中止 Pages）。
3. **C-14 放最后**：C-P8 含未核实项（活端点实跑），以免把未验证数字写进正文（02 的排序理由）。

### 7.3 工作量估计的诚实边界

- **本机的两条不确定性**（05 F-U2/F-U3，**未验证**）：① 本机 `astro build` 能否再成功、33 页能否复现（05 F-U2：构建不稳定，**以 CI 为准**）；
  ② `/nav/` 375px 是否横向溢出（需构建 + Chromium）。这两条**不增加工作量，只增加失败概率**。
- **不在本轮估计内的成本**：62 条 mermaid 图注的撰写（内容轮）、11 处术语定义措辞的定稿（属 B-P7 主体，已计 M）、
  `notes/*.md` 其余 92 题的合格线（**已计入 B-P5 的 L**，不是额外项）。

---

## ⑧ 执行轮边界

### 8.1 沿用（不改）

| 项 | 出处 | 沿用方式 |
|---|---|---|
| 批次命名（A/B/C + 组 0–4，组 5 并入组 0） | `00-plan-scope.md` §2 | 原样 |
| 10 字段 | `00-plan-scope.md` §3 | 原样（①`id` ②`目标` ③`现状证据(file:line)` ④`具体改法` ⑤`派生还是手工` ⑥`验收命令` ⑦`回滚点` ⑧`依赖` ⑨`工作量` ⑩`风险`） |
| 验收两分法 | `00-plan-scope.md` §4 | 原样：**可机器验证**（命令 + 期望输出）/ **必须留浏览器目检**（不得用 HTTP 200 / 构建成功 / exit 0 冒充） |
| 三条 falsified 不得作依据 | `00-plan-scope.md` §1 | 原样 |
| 07 修正值（8/15、04/08/06、`industry-2026.md:20`、SSE 首现、`wc -l`=7、`A/B`=6） | `00-plan-scope.md` §1 | 原样（本文档 §0.2 复述） |
| `analysis/content/00-corpus-scope.md` 的记者纪律 | `00-plan-scope.md` §1 | 原样 |
| 每份设计文档末尾两节（未决决策点 / 依据不足项） | `00-plan-scope.md` §5 | 本文件对应 §6 与 §8.4 |

### 8.2 执行轮**必须改**的边界（相对本轮）

| # | 本轮边界 | 执行轮必须改成 | 依据 |
|---|---|---|---|
| 1 | **不跑 `astro build`**（本轮硬禁区） | **必须跑**：组 0 的目标就是拿到可目检的 HTML；且 `bash site/build.sh` 是验证「门禁是否阻断部署」的唯一手段 | `00-plan-scope.md` §0.3 是本轮（计划轮）的边界；`build.sh:41` 的机制只有跑构建才能验证 |
| 2 | **不跑任何写盘脚本**（`visual-check` 写 `site/tools/out/`、各 demo 写 `trajectories/`/`.state/`） | **必须跑**：`visual-check.mjs`（含三视口与 `--fault`）、`mermaid-check.mjs`、`cd rag-demo && npm run demo:eval`、`cd harness-demo && npm run demo`（C-5 留实跑） | §2 各批次门禁里的「留实跑/留目检」项 |
| 3 | **一切只读** | 允许写：`notes/`、`site/`、`README.md`、`handoff.md`、各 demo、`.github/workflows/`、`site/build.sh`、**`analysis/plan/` 之外的新文件**（`site/tools/*.mjs`、`site/src/data/glossary.ts`、`viz/chrome.mjs`） | 执行轮的产出就是这些改动 |
| 4 | **可以联网**吗 | **需要联网的项必须联网**：D6 (b) 的三个时间线节点一手源、SDK 版本当前一手源（05 F-U5） | 05 §10 的 F-U5（本轮**未验证**：需联网） |
| 5 | **`--selftest` 属禁区**（会写盘） | 允许，但**落盘必须改到 `$TMPDIR`**（步 G0-3 的产物）；主流程仍写 `site/tools/out`（artifact 契约） | 步 G0-3 |
| 6 | **不跑 `npm run build:fast`** 绕门禁 | 仍然**不得**用 `build:fast` 绕过门禁（只在确认门禁本身有 bug 时，作为**诊断**手段并记录） | 05 §1.0 明文 |
| 7 | 未跟踪的 4 个根 md（`notes-restructure-plan.md` 等）不动 | **仍然不动**（它们是本轮前既有的未跟踪文件，不在任何改造项范围内） | §0.3 V10 的基线 |

### 8.3 执行轮的**逐批次完成判据**（一句话版）

| 批次 | 完成的定义 |
|---|---|
| 组 0 | `site/dist` 产出 **33** 个 HTML；`PAGES` = **9**；`check-classes.mjs` exit 0 且 `--self-test` 非 0 |
| 批次 A | 判据 **30 条 + 副本 13 处**、exit 0；A-G1…A-G9 全绿；7 项浏览器目检有记录 |
| 批次 B | B-1…B-7 全绿（**B-5 用替代判据**）；4 项浏览器目检 + 1 项语料回归有记录 |
| 批次 C | C-1…C-5 全绿 + C-5 实跑有日志或明确写「未验证（端点不可用）」 |
| 形式组 1–4 | 每组内的「可机器验证」全绿 + 「必须留浏览器目检」逐项有记录（**不得**用构建成功代替） |

### 8.4 依据不足项汇总（执行轮不许当事实）

> 汇总 01–05 的 U 系列，去重后按「动手前必须补什么」归类。**未补齐的项不得在执行时当作既成事实。**

| 归类 | 条目（跨 01–05） | 动手前必须补 |
|---|---|---|
| **需逐行读原文**（最优先） | U9（`km:55-68` 的 14 组主题名 vs `domain` 逐行差异）；`details/index.astro` 是否重复定义 `KIND_LABEL`；`notes/mcp.md` S4 区间的表结构 | `sed -n`/`diff` 逐行核；判据 14 的 slug 列必须先填对 14 格 |
| **需实测一张图** | 03 依据不足项：`%% caption:` 是否被 mermaid 当可见文本渲染进图（**未实测**） | 先用**一张图**试，再决定是否全量补图注 |
| **需联网** | 05 F-U5（SDK 版本当前一手源 / CI run 级 success）；`02-D6 (b)` 的三个时间线节点外部一手源 | `web_fetch` 直取一手源并记 URL 与时点 |
| **需活端点** | 05 F-U1（`demo:eval` 零漂移验证）；C-5 的 `cd harness-demo && npm run demo` | 活端点 `LLM_BASE_URL`；不可用则写「未验证（端点不可用）」 |
| **需构建 + 浏览器** | 05 F-U2（本机能否重建 33 页，**以 CI 为准**）；F-U3（`/nav/` 375px 溢出）；F-U4（Astro 组件内 `<style>` 的作用域形态 → F0-4 输入面） | 执行轮跑构建 + Chromium；**注意 F-U4 的替代方案已在 §3 G0-5 定死**（用 `site/src/**` 作输入面，绕开该未知量） |
| **需写盘后核** | `--selftest` 默认落盘位置（步 G0-3 的验收第 2 条） | 执行轮跑一次并核对 `git status` |
| **medium/low 未复核**（不得当事实） | 06-F7（`details`「读完能做什么」）；01 §2 的难度分**权重不可复现**；03 未深审的 `confirmed*` 项（F1-4/F1-5/F4-2/F4-3/F4-5/F4-7/F4-8 等） | 各步已在「风险/依赖」里点名；未复核的**不得**升格为判据期望值 |

### 8.5 本文件的边界合规自查

- **只新建本文件**：`analysis/plan/06-implementation-plan.md`。**未改**任何既有文件（含 `00`–`05`、`analysis/content/*`、`notes/`、`site/`、各 demo、`README.md`、`handoff.md`、`.github/workflows/`、`site/build.sh`）。
- **全部命令只读**：`node site/tools/check-counters.mjs`（只读，实读源码确认无写盘）、`grep`/`sed`/`awk`/`wc`/`ls`/`find`/`node -e`/`git status`。
  **未跑** `astro build`、`npm run build`、`visual-check`（含 `--selftest`）、`mermaid-check`、任何 demo；**未联网**；**未创建任何临时产物**（无 `site/tools/out`、无 `.state/`）。
- **未改任何被审文件**：本轮 `01`–`05` 的内容**逐字未动**；对其结论的修正**只出现在本文件内并显式标注「已修正/已剔除」**。
- **未把他人结论当证据转述**：§0.3 的 V1–V10 台账是我自己跑的；其余引用（如 05 的裁决、01–04 的实测）**均标注来源**，且凡我未能独立复现的（依赖图 17 节点/9 冲突的复算、门禁 `entries=[]` 的后果）**标为「引 05/01 的复核结论」**。
- **三条 falsified 零引用**：`accuracy-F1`、`accuracy-F3`、`evidence-F2` **未作为任何步骤的依据**（包括它们的「建议方向」）。

