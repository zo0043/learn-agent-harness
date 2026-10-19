/**
 * status.ts —— 课程状态判定的**单一真源**（2026-10-19 新增）
 *
 * 【为什么存在】
 * 此前三处各自判定、口径不一：
 *   · `StatusBadge.astro` 用中文子串（includes('完成') / includes('进行')）——而
 *     `courses.ts` 里 12/17 门课的状态串实际是「🔄 讲义已展开」，既不含「完成」也不含
 *     「进行」，全部落进灰色 `badge-todo`（读作「规划中」）；
 *   · `learn.astro` 的 statusKey() 与 `DomainMap.astro` 的 statusDot() 按 emoji 前缀判定，
 *     同一批课在同一页显示为「进行中」。
 * 结果是 /learn/ 与 /c/<slug>/ 上 12 门「讲义已展开」的课挂灰色徽标，与同页
 * 「🔄 进行中 12」的统计直接矛盾（同站三色）。
 *
 * 【判定规则】按 emoji 前缀（✅ / 🔄·🚧 / ⏳），与 courses.ts 的 status 字面量对齐；
 * 未知前缀返回 'planned' 之外的兜底值 'other'，避免把未登记状态静默画成某一档。
 */

export type StatusKey = 'done' | 'doing' | 'planned' | 'other';

export function statusKey(status: string): StatusKey {
  if (status.startsWith('✅')) return 'done';
  if (status.startsWith('🔄') || status.startsWith('🚧')) return 'doing';
  if (status.startsWith('⏳')) return 'planned';
  return 'other';
}
