// ============================================================
// 类型定义 —— data-flywheel §S2
//   台账行 schema（FinHot 字段形状 + 本 MVP 最小 demo-only 补充字段）
// ============================================================

/** 方向标签（黄金方向 ground truth 与 labeler 预测共用；'none' = 无方向即噪声） */
export type Direction = 'bullish' | 'bearish' | 'neutral' | 'none';

/**
 * 台账行。对齐 notes/data-flywheel.md §S2 的 FinHot 字段形状：
 *   prompt_version / model_version / harness_commit（三版本字段）
 *   outcome_status（pending/labeled/skipped）、published（反事实）
 * 本 MVP 的 demo-only 补充（规格 §1 说明 §5.1 是最小子集，生产字段在仓外）：
 *   direction  黄金方向（ground truth，供确定性 metrics 对照）
 *   dirty      污染标记（direction 解析失败 → curate 去污染）
 *   dedupe_key 板块+事件键（→ curate 去重）
 *   due_step   逻辑时钟步（对齐 FinHot cum_pct_tN 延迟标签窗口）
 *   skip_when_due  true → 延迟窗口关闭时判 skipped（一等终态带 reason）
 */
export interface LedgerRow {
  id: string;
  input: string;
  direction: Direction;
  dirty: boolean;
  dedupe_key: string;
  prompt_version: string;
  model_version: string;
  harness_commit: string;
  outcome_status: 'pending' | 'labeled' | 'skipped';
  skipped_reason?: string;
  raw_label?: Direction;
  published: boolean;
  due_step: number;
  skip_when_due: boolean;
}

/** 指标报告（二进制「有信号 vs 无信号」口径，同 FinHot 稀疏信号 precision） */
export interface MetricReport {
  precision: number;
  recall: number;
  f1: number;
  errors: number;   // fp + fn
  decisive: number; // tp + fp（labeler 给出明确方向的行数）
  accuracy: number;
}

/** 决策门禁输出：action 只有 propose/reject（禁 auto-apply 是类型级约束，无 apply 态） */
export interface Decision {
  action: 'propose' | 'reject';
  reason: string;
  attributable: boolean;
}

/** round() 的一次「只动 prompt」变更记录 */
export interface RoundEdit {
  file: string;
  hash: string;
}
export interface RoundResult {
  prompt_version: string;
  edits: RoundEdit[];
}