// ============================================================
// 评测飞轮 —— M4：label 两轮降噪 + 决策门禁禁 auto-apply
//   降噪靠「一次只动一个变量」；门禁只止步于提案（propose/reject，无 apply）。
// ============================================================
import type { Direction, GateDecision, LedgerRow, MetricReport, RoundResult } from './types.js';

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

/** 一轮「只动 prompt」变更记录。强制校验：除 prompt_version 外其余字段逐项全同，否则抛错。 */
export function round(rows: LedgerRow[], from: string, to: string): RoundResult {
  // (1) 迁移起点必须统一在 from 版本（混版本 = 有第二个变量在动）
  if (rows.some((r) => r.prompt_version !== from)) {
    throw new Error(`round(): 台账并非全在 ${from} 版本（一次只动 prompt 被破坏）`);
  }
  // (2) 同一 id 不得出现两个不同非 prompt 指纹（direction/dedupe_key/model_version/harness_commit 被改动）
  const fp = (r: LedgerRow) => `${r.id}|${r.direction}|${r.dedupe_key}|${r.model_version}|${r.harness_commit}`;
  const seen = new Map<string, string>();
  for (const r of rows) {
    const sig = fp(r);
    const prev = seen.get(r.id);
    if (prev !== undefined && prev !== sig) {
      throw new Error('round(): 同一行出现两个非 prompt 指纹（direction/去重键/模型/提交被改动，不可归属为 prompt 改进）');
    }
    seen.set(r.id, sig);
  }
  return { prompt_version: to, edits: [{ file: 'prompt.ts', hash: djb2(`prompt:${from}->${to}`) }] };
}

/** 决策门禁：关键指标 f1 不降 && 目标 precision 显著升（>NOISE）→ propose，否则 reject（无 apply 态） */
export function gate(prev: MetricReport, next: MetricReport): GateDecision {
  const keyOk = next.f1 >= prev.f1;
  const targetUp = next.precision - prev.precision > NOISE;
  const action: GateDecision['action'] = keyOk && targetUp ? 'propose' : 'reject';
  const reason =
    action === 'propose'
      ? '关键指标 f1 不降 且 目标指标 precision 显著升（超重跑方差）→ 生成提案，止步于提案'
      : keyOk
        ? '目标指标 precision 未显著升（未超重跑方差）'
        : '关键指标 f1 下降';
  return { action, attributable: true, reason };
}

/** 筛选三道门（本 MVP 断言主体=去污染 + 去重）：dirty 单列归因；同 dedupe_key 聚代表 */
export function curate(rows: LedgerRow[]): { kept: LedgerRow[]; poisoned: LedgerRow[]; deduped: LedgerRow[] } {
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