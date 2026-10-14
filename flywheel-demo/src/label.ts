// ============================================================
// labeler —— data-flywheel §S2（延迟标签回填 + 两轮降噪「只动 prompt」）
//   生产里这是 LLM 判定；本 MVP 用「预置预测表」保证确定性 / 可复现（规格 §5.5）。
//   两轮降噪：prompt_version v1→v2→v3，model_version/harness_commit/样本集合全程不动。
// ============================================================
import type { Direction, LedgerRow, RoundResult } from './types.js';

/** 预置预测表（行 id × prompt_version → 预测方向）。生产对应 LLM 判定，这里固定保证零 key / 确定性。 */
const PRED: Record<string, Record<string, Direction>> = {
  v1: { c1: 'neutral', e1: 'bullish', e2: 'bullish', e3: 'bearish', e4: 'bullish', e5: 'bullish', e6: 'neutral', e7: 'none', e8: 'bullish' },
  v2: { c1: 'neutral', e1: 'bullish', e2: 'bullish', e3: 'bearish', e4: 'neutral', e5: 'neutral', e6: 'neutral', e7: 'none', e8: 'bullish' },
  v3: { c1: 'neutral', e1: 'bullish', e2: 'bullish', e3: 'bearish', e4: 'bullish', e5: 'neutral', e6: 'bullish', e7: 'none', e8: 'bullish' },
};

/** 确定性 labeler：按行 id + prompt_version 返回预测方向（fail-fast） */
export function predictLabel(rowId: string, version: string): Direction {
  const v = PRED[version];
  if (!v) throw new Error(`未知 prompt_version：${version}`);
  const d = v[rowId];
  if (!d) throw new Error(`无 ${rowId} 在 ${version} 的预置预测`);
  return d;
}

/** 确定性 hash（djb2，用于 round() 的 edit hash 与「一次只动一个变量」指纹） */
export function djb2(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h * 33) ^ input.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}

/** 状态机解析一个 due 的行：skip_when_due → skipped；否则 → labeled（predicted raw_label） */
export function resolveDue(r: LedgerRow): LedgerRow {
  if (r.skip_when_due) {
    return { ...r, outcome_status: 'skipped', skipped_reason: 'T+N 判定不可用（事件被证伪 / 来源撤回）' };
  }
  return { ...r, outcome_status: 'labeled', raw_label: predictLabel(r.id, r.prompt_version) };
}

/** T+5 回填：due_step <= tNow 的 pending 行推进状态机 */
export function backfillLabels(rows: LedgerRow[], tNow: number): LedgerRow[] {
  return rows.map((r) => (r.outcome_status === 'pending' && r.due_step <= tNow ? resolveDue(r) : r));
}

/**
 * 一轮「只动 prompt」变更记录。强制校验：除 prompt_version 外，
 * 非 prompt 字段（id/direction/dedupe_key/model_version/harness_commit）逐字段全同，
 * 否则抛错（违反「一次只动一个变量」→ 不可归属为 prompt 改进）。
 */
export function round(rows: LedgerRow[], from: string, to: string): RoundResult {
  const fp = (r: LedgerRow) => `${r.id}|${r.direction}|${r.dedupe_key}|${r.model_version}|${r.harness_commit}`;
  const fromFp = rows.map(fp).sort().join('\n');
  const toFp = rows.map((r) => ({ ...r, prompt_version: to })).map(fp).sort().join('\n');
  if (fromFp !== toFp) throw new Error('round(): 一次只动 prompt 被破坏，非 prompt 字段发生变化');
  return { prompt_version: to, edits: [{ file: 'prompt.ts', hash: djb2(`prompt:${from}->${to}`) }] };
}

/** 重标到目标 prompt 版本：只改 prompt_version + raw_label（model/harness/样本不变） */
export function relabel(rows: LedgerRow[], version: string): LedgerRow[] {
  return rows.map((r) => {
    if (r.outcome_status === 'skipped') return r;
    return { ...r, prompt_version: version, raw_label: predictLabel(r.id, version), outcome_status: 'labeled' };
  });
}