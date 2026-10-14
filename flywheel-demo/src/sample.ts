// ============================================================
// 脱敏合成台账样本 —— data-flywheel §S2
//   ⚠️ 红线：这里是「字段形状对齐 FinHot 的合成样本」，绝不落真实生产数字
//   （真实 1830 行 / 具体板块事件在仓外）。方向是占位，事件是占位。
// ============================================================
import type { Direction, LedgerRow } from './types.js';

/** 固定版本字段（全程不变，供 label-B「只动 prompt」断言核对） */
export const MODEL_VERSION = 'model-m1';
export const HARNESS_COMMIT = 'h1a2b3c';

interface RowOpts {
  dedupe_key: string;
  published?: boolean;
  dirty?: boolean;
  due_step?: number;
  skip_when_due?: boolean;
}

function r(id: string, input: string, direction: Direction, o: RowOpts): LedgerRow {
  return {
    id,
    input,
    direction,
    dirty: o.dirty ?? false,
    dedupe_key: o.dedupe_key,
    prompt_version: 'v1',
    model_version: MODEL_VERSION,
    harness_commit: HARNESS_COMMIT,
    outcome_status: 'pending',
    published: o.published ?? true,
    due_step: o.due_step ?? 0,
    skip_when_due: o.skip_when_due ?? false,
  };
}

/** 14 行合成样本：2 污染 + 2 去重对 + 2 skipped + 8 metrics（其中 c1 为反事实 published=false） */
export const SAMPLE: LedgerRow[] = [
  // 污染行（direction 解析失败 → curate 去污染）
  r('p1', '投毒 · 广告拉群 · bullish', 'bullish', { dedupe_key: 'poison:a', dirty: true }),
  r('p2', '投毒 · 引流返利 · bearish', 'bearish', { dedupe_key: 'poison:b', dirty: true }),
  // 去重对（同 dedupe_key = 同板块+事件）
  r('c1', '央行 · 社融例行发布 · neutral', 'neutral', { dedupe_key: 'cnb:mlf', published: false }),
  r('c2', '央行 · 社融例行发布 · neutral（重复）', 'neutral', { dedupe_key: 'cnb:mlf', published: false }),
  // metrics 样本（c1 + e1..e8 共 9 条 label 行）
  r('e1', '央行 · 降准超预期 · bullish', 'bullish', { dedupe_key: 'cnb:rrr' }),
  r('e2', '央行 · 结构性工具扩容 · bullish', 'bullish', { dedupe_key: 'cnb:srr' }),
  r('e3', '财政部 · 赤字率上调 · bearish', 'bearish', { dedupe_key: 'mof:aa' }),
  r('e4', '财政部 · 债务置换 · neutral', 'neutral', { dedupe_key: 'mof:bb' }),
  r('e5', '统计局 · CPI 例行 · neutral', 'neutral', { dedupe_key: 'nbs:cpi' }),
  r('e6', '统计局 · PMI 例行 · neutral', 'neutral', { dedupe_key: 'nbs:pmi' }),
  r('e7', '证监会 · 例行答问 · none', 'none', { dedupe_key: 'csrc:qa' }),
  r('e8', '证监会 · 传闻澄清 · none', 'none', { dedupe_key: 'csrc:cl' }),
  // skipped 一等终态行（延迟窗口 / 证伪撤回）
  r('s1', '事件 · 遭证伪 · none', 'none', { dedupe_key: 'xx:s1', skip_when_due: true, due_step: 0 }),
  r('s2', '事件 · 来源撤回 · none', 'none', { dedupe_key: 'xx:s2', skip_when_due: true, due_step: 5 }),
];