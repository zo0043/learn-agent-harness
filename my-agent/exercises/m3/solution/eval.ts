// ============================================================
// 评测套件 —— M2（m2.4 补全）：golden 锚点→chunk + recall@k + judge 校准 + 门禁
//   golden/golden.ts 给全（文本锚点语料 + golden set）。
// ============================================================
import type { GoldenQ } from './types.js';
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

/** 文本锚点 → chunk id（子串匹配；同一锚点命中多个 chunk 全算 gold） */
export function resolveAnchors(
  golden: GoldenQ[],
  corpus: { id: string; text: string }[],
): { golds: ResolvedGold[]; misses: AnchorMiss[] } {
  const golds: ResolvedGold[] = [];
  const misses: AnchorMiss[] = [];
  golden.forEach((g, i) => {
    if (g.outOfScope) return; // 拒答轨无 gold 锚点
    if (g.anchors.length === 0) {
      misses.push({ no: i + 1, q: g.q, anchor: '（本题未配置任何锚点）' });
      return;
    }
    const ids = new Set<string>();
    for (const a of g.anchors) {
      const hit = corpus.filter((c) => c.text.includes(a));
      if (hit.length === 0) {
        misses.push({ no: i + 1, q: g.q, anchor: a });
        continue;
      }
      for (const c of hit) ids.add(c.id);
    }
    golds.push({ no: i + 1, q: g.q, ids: [...ids] });
  });
  return { golds, misses };
}

/** 确定性检索最小态：词面命中打分（离线；M2 不调真实 embedder/模型） */
function retrieveTopK(query: string, corpus: { id: string; text: string }[], k: number): string[] {
  const terms = query.split(/\s+/).filter(Boolean);
  const scored = corpus.map((c) => {
    let s = 0;
    for (const t of terms) if (c.text.toLowerCase().includes(t.toLowerCase())) s += 1;
    return { id: c.id, s };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, k).map((x) => x.id);
}

/** 评测主流程：锚点失效 → 响亮失败（返回 1）；否则 recall@10=1 判 PASS，返回 0 */
export function runEval(golden: GoldenQ[] = GOLDEN, corpus: { id: string; text: string }[] = EVAL_CORPUS): number {
  const { golds, misses } = resolveAnchors(golden, corpus);
  if (misses.length > 0) {
    for (const m of misses) {
      console.log(`❌ Q${m.no} 锚点未命中：「${m.anchor}」在 ${corpus.length} 个 chunk 中子串匹配 0 条`);
      console.log(`    题目：${m.q}`);
    }
    console.log('    建议：语料已改版——用 grep 找现行原文，重挑 8-20 字 distinctive 中文锚点，再跑评测。');
    console.log('gold 锚点失效——拒绝出数（退出码 1）');
    return 1;
  }

  let pass = 0;
  for (const g of golds) {
    const top10 = new Set(retrieveTopK(g.q, corpus, 10));
    const recall = g.ids.filter((id) => top10.has(id)).length / g.ids.length;
    const ok = recall === 1;
    if (ok) pass += 1;
    console.log(`Q${g.no} [${g.q.slice(0, 18)}] recall@10=${recall.toFixed(2)} 相关 ${g.ids.length}  ${ok ? '✅ PASS' : '❌ FAIL'}`);
  }
  console.log(`PASS ${pass}/${golds.length}（判据：recall@10 = 1.00）`);
  return 0;
}

/** 确定性 mock judge：答案与 golden 标签比对 + 一致性阈值（不调真实模型） */
export function judgeCalibrate(answers: string[], goldLabels: string[]): { consistent: boolean; score: number } {
  const n = Math.min(answers.length, goldLabels.length);
  let agree = 0;
  for (let i = 0; i < n; i++) if (answers[i] === goldLabels[i]) agree += 1;
  const score = n === 0 ? 0 : agree / n;
  return { consistent: score >= 0.8, score };
}

// 直接运行 eval.ts 时：锚点失效 → 非零退出（响亮失败，拒绝出数）
if (process.argv[1]?.includes('eval.ts')) process.exit(runEval());