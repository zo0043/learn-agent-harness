// ============================================================
// 评测飞轮 —— M4（挖 m4.2）：label 两轮降噪 + 决策门禁禁 auto-apply
//   降噪靠「一次只动一个变量」；门禁只止步于提案（propose/reject，无 apply）。
// ============================================================
import { TODOError, type Direction, type GateDecision, type LedgerRow, type MetricReport, type RoundResult } from './types.js';

/** 预置预测表（行 id × prompt_version → 预测方向）。生产对应 LLM 判定，这里固定保证零 key/确定性。 */
export const PRED: Record<string, Record<string, Direction>> = {
  v1: { c1: 'neutral', e1: 'bullish', e2: 'bullish', e3: 'bearish', e4: 'bullish', e5: 'bullish', e6: 'neutral', e7: 'none', e8: 'bullish' },
  v2: { c1: 'neutral', e1: 'bullish', e2: 'bullish', e3: 'bearish', e4: 'neutral', e5: 'neutral', e6: 'neutral', e7: 'none', e8: 'bullish' },
};

/** 重跑方差阈值（教学常量）：precision 提升需 >2pp 才算「显著」，否则归因噪声 */
export const NOISE = 0.02;

/** 确定性 hash（djb2，用于 round() 的 edit hash + 变量指纹） */
export function djb2(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h * 33) ^ input.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}

/** 确定性 labeler：按行 id + prompt_version 返回预测方向（fail-fast） */
export function predictLabel(rowId: string, version: string): Direction {
  const d = PRED[version]?.[rowId];
  if (!d) throw new Error(`无 ${rowId} 在 ${version} 的预置预测`);
  return d;
}

/** 固定样本（给全，供 demo/断言确定性使用；e4/e5 同 dedupe_key 用于去重，d1 dirty 用于去污染） */
export function sampleRows(): LedgerRow[] {
  return [
    { id: 'e1', input: '公司上调指引', direction: 'bullish', dirty: false, dedupe_key: '板块A:上调', prompt_version: 'v1', model_version: 'm1', harness_commit: 'h1', outcome_status: 'pending', published: false },
    { id: 'e2', input: '公司下调指引', direction: 'bearish', dirty: false, dedupe_key: '板块A:下调', prompt_version: 'v1', model_version: 'm1', harness_commit: 'h1', outcome_status: 'pending', published: false },
    { id: 'e4', input: '板块A 上调（重复）', direction: 'bullish', dirty: false, dedupe_key: '板块A:上调', prompt_version: 'v1', model_version: 'm1', harness_commit: 'h1', outcome_status: 'pending', published: false },
    { id: 'd9', input: '[解析失败]', direction: 'none', dirty: true, dedupe_key: '板块C:污染', prompt_version: 'v1', model_version: 'm1', harness_commit: 'h1', outcome_status: 'pending', published: false },
  ];
}

export function round(_rows: LedgerRow[], _from: string, _to: string): RoundResult {
  // TODO m4.2a：一轮「只动 prompt」变更——除 prompt_version 外其余字段逐项全同，否则抛错（不可归属为 prompt 改进）
  throw new TODOError('m4.2: 实现两轮降噪 round（只动 prompt 强制校验）');
}

export function gate(_prev: MetricReport, _next: MetricReport): GateDecision {
  // TODO m4.2b：关键指标 f1 不降 && 目标 precision 显著升（>NOISE）→ propose，否则 reject；action 只有 propose/reject（无 apply，禁 auto-apply）
  throw new TODOError('m4.2: 实现决策门禁（禁 auto-apply）');
}

export function curate(_rows: LedgerRow[]): { kept: LedgerRow[]; poisoned: LedgerRow[]; deduped: LedgerRow[] } {
  // TODO m4.2c：去污染（dirty 单列归因）+ 去重（同 dedupe_key 聚代表）
  throw new TODOError('m4.2: 实现去污染去重');
}