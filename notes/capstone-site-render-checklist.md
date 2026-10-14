# 站点呈现改法清单（capstone，写给 wei）

> 把主线 `my-agent` 接到站点的呈现层改法清单。**本文件是清单与落点建议，不是实现**；实现交后续 wei。改法三处：① `learn.astro` 加主线入口与 5 milestone 视图；② 17 课 card / demo chip 的「作品 → 参考样本」话术；③ `c/[slug].astro` 学习路径加「主线挂钩」字段。改动以不破坏现有 17 课路由与五阶段结构为前提。

## 0. 前置判断（一次说清，避免重复踩坑）

- **不改**：`mvps.ts` 三态、`course-structure.ts` 五阶段 / prereqs / 17 课正文、17 demo 源码正确性。
- **加**：主线呈现需要一个**新增数据源** `site/src/data/capstone.ts`（见 §2.1），它只读课程/mvp 词表、不反向改它们。
- **术语统一**：呈现层把 demo 一律叫「参考样本（reference）」，主线叫「你要搭的（your build）」；milestone 键用小写 `m0`…`m4`，展示名 `M0`…`M4`（两处与 `capstone-blueprint.md` §3 / `capstone-style-guide.md` §1 一致）。

## 1. 三处落点总览

| 落点 | 文件 / 锚点 | 改动 |
|---|---|---|
| 主线入口 + 5 milestone 视图 | `learn.astro`：建议开课顺序 `<section class="phase-section">`（现约 L158）之后新增一个 section | 读 `capstone.ts` 渲染「主线卡 + 5 张 milestone 卡」 |
| 课程卡 demo chip 话术 | `learn.astro` 卡片 `dc-foot`（现约 L132–137）：`MVP {mvpSlug}` chip | 改为「参考样本」chip + 「主线挂钩」chip，计划/资产 chip 保留（三态语义不变） |
| 课程页「主线挂钩」 | `course-structure.ts` 的 `Course` 接口 + `c/[slug].astro` 的 `learning-path` 模块（现约 L70–128） | 加 `capstoneHook?` 字段 + `lp-grid` 第五个 `lp-item` |

## 2. `learn.astro` 主线入口与 5 milestone 视图

### 2.1 新增数据源 `site/src/data/capstone.ts`（建议）

```ts
export interface Milestone {
  key: 'm0' | 'm1' | 'm2' | 'm3' | 'm4';   // 工号键（小写）
  name: string;                              // M0 minimal-loop 等
  stage: string;                             // 'P0' … 'P4'（m4 = 'P3+P4' 或拆两档，建议单值 'P3' 并用 stageNote 说明「跨 P3+P4」）
  adds: string[];                            // 增建能力（每人一行）
  courses: string[];                         // 必修课 slug（链到 /c/<slug>/）
  reference: string[];                       // 参考答案 demo 目录名
  assertCmd: string;                         // 'npm run assert:m0'
}
export const MILESTONES: Milestone[] = [/* 照 capstone-blueprint.md §3 映射表逐行抄入 */];
```

**纪律**：`MILESTONES` 的 key/name/stage/adds/courses/reference 六栏必须与 `notes/capstone-blueprint.md` §3 映射表逐字一致（这是「自洽」的机器可核对点，见 §4 校验）；不得在 `capstone.ts` 里另造一套划分。

### 2.2 渲染（建议结构，不改现有 section）

在「建议开课顺序」section 之后新增：

```
<section class="phase-section" data-capstone>
  <div class="phase-head">
    <h2>增量主线 · capstone（你要搭的）</h2>
    <span class="phase-desc">my-agent：从零增建一个完整 agent——5 个 milestone 对应 P0–P4，复用的是你亲手写的代码</span>
  </div>
  <div class="cards">
    <!-- 一张主线总卡（链 my-agent/README.md 定位说明，无独立路由则链 /learn 锚点） + 5 张 milestone 卡 -->
  </div>
</section>
```

每张 milestone 卡（本地静态，无 JS 也能见，与现有卡片同策略）：`M<>{key大写} name`（chip）、阶段 chip、`adds` 列表、`courses` 链接（复用卡片内嵌 prereq 锚链样式 `.lw-prereqs`）、`assertCmd` 一行（`<code>`）。可选：加 `data-capstone-key` 供筛选扩展，但**不放 JS 筛选**（保持无 JS 兜底全可见）。

## 3. 课程卡 `dc-foot`「作品 → 参考样本」话术

现状（`learn.astro` L132–137）：

```astro
<span class="chip">MVP <code>{course.mvpSlug}</code></span>
{mvp.status === 'planned' && <span class="chip">规划中</span>}
{mvp.status === 'asset' && <span class="chip">横向资产</span>}
```

改为（追加两处，不删三态 chip）：

```astro
<span class="chip">参考样本 <code>{course.mvpSlug}</code></span>
{capstoneHookOf(course.slug) && <span class="chip">主线挂钩 {capstoneHookOf(course.slug)}</span>}
{mvp.status === 'planned' && <span class="chip">规划中</span>}
{mvp.status === 'asset' && <span class="chip">横向资产</span>}
```

- `capstoneHookOf(slug)`：查 `capstone.ts`，返回该课供哪个 milestone 的机制（如 `M0 loop` / `M1 多工具` / `M4 frameworks`）；返回空则不渲染 chip。
- 「参考样本」话术与「主线挂钩」chip 即定位转换：demo 从「你要交付的作品」改口为「你做完主线后对照的正确答案」。
- **可选话术微调**：`mvps.ts` 的 `statusLabel`（如 `✅ 已实现` → `✅ 参考实现`）属词表文字，改了不破坏三态 `status` 语义，但**非必需**——只做 chip 话术也够；不建议本轮动 `mvps.ts`（避免扩大 diff 面）。

## 4. 课程页「主线挂钩」字段落点（只给字段建议，不做实现）

### 4.1 `course-structure.ts` 加字段（建议，实现时做）

在 `Course` 接口加一个可选字段：

```ts
/** 主线挂钩：本课给 my-agent 哪个 milestone 供货什么机制（如「M0：loop 骨架 / 工具协议」）；横向资产课可留空。 */
capstoneHook?: string;
```

17 课逐课填（映射见表，`llm-timeline` / `industry-2026` 两个横向课可填「背景地图 / 收口素材」或不填）。填空值不影响现有 `learning-path`（用 `structure.capstoneHook &&` 守卫）。

### 4.2 `c/[slug].astro` `lp-grid` 落点

`learning-path` 模块现为 4 个 `lp-item`（前置 / 教学重点 / 实际输出 / 后续），在第 4 个 `lp-item` 之后、`</dl>` 之前加第五个：

```astro
{structure.capstoneHook && (
  <div class="lp-item">
    <dt>主线挂钩</dt>
    <dd>{structure.capstoneHook}</dd>
  </div>
)}
```

样式复用现有 `.lp-item` / `dt` / `dd`（`lp-grid` 是 auto-fit 栅格，5 项自动换行，无需新样式）。守卫保证不填字段的课（含横向课）不渲染空项，也不破坏「结构表缺失时 structure=undefined 优雅降级」的现有逻辑。

## 5. 交付顺序（给 wei 的执行序）

1. `capstone.ts` 建立（照 `capstone-blueprint.md` §3 抄映射，机器校验六栏一致）；
2. `learn.astro` 加主线 section（先卡后 chip，卡片静态可读）；
3. `learn.astro` `dc-foot` chip 话术（参考样本 + 主线挂钩）+ `capstoneHookOf`；
4. `course-structure.ts` 加 `capstoneHook?` + 17 课填空 + `c/[slug].astro` 第五 `lp-item`；
5. 自检：`esbuild bundle + node` 断言（`MILESTONES` 五栏 == blueprint 映射表；`capstoneHook` 覆盖 17 课无漏填；`notes/*.md` 计数 + EXCLUDED 兜底 = 17 路由页）；`tsc --noEmit`；`npm run build:fast`（诚实两段式，注意本沙箱 HTML 渲染段会 OOM 卡死，如实记 EXIT，不冒充全绿）。

## 6. 校验要点（可机器核对）

- `MILESTONES.length === 5`，key 集合 = `{m0,m1,m2,m3,m4}`，stage 五档顺序与 `course-structure.ts` STAGE 一致；
- `capstoneHookOf` 对 17 课逐一返回（或横向课显式空），无「漏填但声称已挂钩」；
- `notes/*.md` − `EXCLUDED_FROM_COURSE_ROUTE` = 17（新增三份 capstone 设计文档计入 EXCLUDED，当前 EXCLUDED=10，路由页恒 17）；
- `mvps.ts` 三态仍 11 done / 0 planned / 2 asset（本清单不动词表）。