// ============================================================
// 台账状态机 —— data-flywheel §S2（outcome_status pending → labeled / skipped）
//   在线 T0：advanceStatus(rows, 0)；延迟 T+5 见 label.ts 的 backfillLabels。
// ============================================================
import type { LedgerRow } from './types.js';
import { resolveDue } from './label.js';

export function advanceStatus(rows: LedgerRow[], now: number): LedgerRow[] {
  return rows.map((r) => (r.outcome_status === 'pending' && r.due_step <= now ? resolveDue(r) : r));
}