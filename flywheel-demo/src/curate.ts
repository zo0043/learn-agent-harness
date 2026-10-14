// ============================================================
// 筛选三道门 —— data-flywheel §S2
//   去污染（dirty 行单列归因，不进 quality 指标）
//   去重（同 dedupe_key 聚代表）
//   （分层配额在 FinHot 真实里是「方向+难度固定配额」，本 MVP 以去污染/去重两门为断言主体）
// ============================================================
import type { LedgerRow } from './types.js';

export interface Curated {
  kept: LedgerRow[];     // 去污染 + 去重后的代表
  poisoned: LedgerRow[]; // 污染行（direction 失败，单独归因）
  deduped: LedgerRow[];  // 被去重掉的重复行
}

export function curate(rows: LedgerRow[]): Curated {
  const poisoned = rows.filter((r) => r.dirty);
  const clean = rows.filter((r) => !r.dirty);
  const seen = new Set<string>();
  const kept: LedgerRow[] = [];
  const deduped: LedgerRow[] = [];
  for (const r of clean) {
    if (seen.has(r.dedupe_key)) {
      deduped.push(r);
      continue;
    }
    seen.add(r.dedupe_key);
    kept.push(r);
  }
  return { kept, poisoned, deduped };
}