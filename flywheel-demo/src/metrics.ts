// ============================================================
// 指标计算 —— data-flywheel §S2（precision/recall/f1/errors/decisive/accuracy）
//   二进制「有信号 vs 无信号」口径：positive = {bullish,bearish}，negative = {neutral,none}
//   与 FinHot 稀疏信号 precision 同源：signal 事件稀少，fp 多 → precision 低
// ============================================================
import type { LedgerRow, MetricReport } from './types.js';

const round4 = (n: number) => Math.round(n * 10000) / 10000;
const pos = (d: string | undefined) => d === 'bullish' || d === 'bearish';

export function metrics(rows: LedgerRow[]): MetricReport {
  const labeled = rows.filter((r) => r.outcome_status === 'labeled' && r.raw_label !== undefined);
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  for (const r of labeled) {
    const goldPos = pos(r.direction);
    const predPos = pos(r.raw_label);
    if (goldPos && predPos) tp += 1;
    else if (goldPos && !predPos) fn += 1;
    else if (!goldPos && predPos) fp += 1;
    else tn += 1;
  }
  const n = tp + fp + tn + fn;
  const precision = tp + fp ? round4(tp / (tp + fp)) : 0;
  const recall = tp + fn ? round4(tp / (tp + fn)) : 0;
  const f1 = precision + recall ? round4((2 * precision * recall) / (precision + recall)) : 0;
  return {
    precision,
    recall,
    f1,
    errors: fp + fn,
    decisive: tp + fp,
    accuracy: n ? round4((tp + tn) / n) : 0,
  };
}