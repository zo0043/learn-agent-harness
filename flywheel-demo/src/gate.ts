// ============================================================
// 决策门禁 —— data-flywheel §S2（关键指标不降 && 目标指标显著升 → propose；否则 reject）
//   禁 auto-apply：Decision.action 类型只有 propose/reject（无 apply 态，自动化止步于提案）
// ============================================================
import type { Decision, MetricReport } from './types.js';

/** 重跑方差阈值（教学常量）：precision 提升需 >2pp 才算「显著」，否则拒绝归因噪声 */
export const NOISE = 0.02;

export function gate(m: { prev: MetricReport; next: MetricReport; n: number; varNote?: string }): Decision {
  const attributable = !m.varNote;
  if (!attributable) {
    return {
      action: 'reject',
      attributable: false,
      reason: '双变量叠加（prompt + 其它变量同时变），指标变化不可归因 —— 不将退步归给 prompt，也不自动合入',
    };
  }
  const keyOk = m.next.f1 >= m.prev.f1; // 关键指标：f1 不降
  const targetUp = m.next.precision - m.prev.precision > NOISE; // 目标指标：precision 显著升
  const action: Decision['action'] = keyOk && targetUp ? 'propose' : 'reject';
  const reason =
    action === 'propose'
      ? '关键指标 f1 不降 且 目标指标 precision 显著升（超重跑方差）→ 生成提案，止步于提案'
      : keyOk
        ? '目标指标 precision 未显著升（未超重跑方差）'
        : '关键指标 f1 下降';
  return { action, attributable, reason };
}