// ============================================================
// 评测套件 —— M2（挖 m2.4）：golden 锚点→chunk + recall@k + judge 校准 + 门禁
//   golden/golden.ts 给全（文本锚点语料 + golden set）。
// ============================================================
import { TODOError, type GoldenQ } from './types.js';
import { EVAL_CORPUS, GOLDEN } from './golden/golden.js';

export interface ResolvedGold {
  no: number;
  q: string;
  ids: string[];
}
export interface AnchorMiss {
  no: number;
  q: string;
  anchor: string;
}

export function resolveAnchors(
  _golden: GoldenQ[],
  _corpus: { id: string; text: string }[],
): { golds: ResolvedGold[]; misses: AnchorMiss[] } {
  throw new TODOError('m2.4: 实现 golden set + recall 评测与锚点失效门禁');
}

export function runEval(_golden: GoldenQ[] = GOLDEN, _corpus: { id: string; text: string }[] = EVAL_CORPUS): number {
  // TODO m2.4：锚点→chunk id；任一锚点未命中 → 打印 ❌ 并返回 1（响亮失败）；每题 recall@10=1 判 PASS
  throw new TODOError('m2.4: 实现 golden set + recall 评测与锚点失效门禁');
}

export function judgeCalibrate(_answers: string[], _goldLabels: string[]): { consistent: boolean; score: number } {
  // TODO m2.4：确定性 mock judge —— 答案与 golden 标签比对 + 一致性阈值（不调真实模型）
  throw new TODOError('m2.4: 实现确定性 judge 校准');
}

// 直接运行 eval.ts 时：锚点失效 → 非零退出（响亮失败，拒绝出数）
if (process.argv[1]?.includes('eval.ts')) process.exit(runEval());