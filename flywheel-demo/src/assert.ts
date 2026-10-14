// ============================================================
// 断言式自测 —— data-flywheel §S2
//   四模块各 1+ 条可证伪断言（期望值手算写死；逻辑时钟 + 预置预测表，零随机）
// ============================================================
import { SAMPLE, MODEL_VERSION, HARNESS_COMMIT } from './sample.js';
import { advanceStatus } from './ledger.js';
import { curate } from './curate.js';
import { backfillLabels, round, relabel } from './label.js';
import { metrics } from './metrics.js';
import { gate } from './gate.js';
import type { Direction, LedgerRow } from './types.js';

export interface Assertion {
  id: string;
  module: string;
  run(): { ok: boolean; detail: string } | Promise<{ ok: boolean; detail: string }>;
}

const ok = (detail: string) => ({ ok: true, detail });
const bad = (detail: string) => ({ ok: false, detail });

/** label-eligible 集合 = curate 后 kept 里非 skip 的行（metrics 分母） */
function labelable(): LedgerRow[] {
  return curate(SAMPLE).kept.filter((r) => !r.skip_when_due);
}

/** 极小可手算的 metrics 行构造器 */
function mrow(id: string, direction: Direction, raw_label: Direction): LedgerRow {
  return {
    id, input: id, direction, dirty: false, dedupe_key: id,
    prompt_version: 'v1', model_version: 'x', harness_commit: 'y',
    outcome_status: 'labeled', raw_label, published: true, due_step: 0, skip_when_due: false,
  };
}

export const ASSERTIONS: Assertion[] = [
  // ── ① ledger ─────────────────────────────────────────────
  {
    id: 'ledger-A', module: 'ledger',
    run: () => {
      const kept = curate(SAMPLE).kept; // 11 行：9 label + s1(due0 skip) + s2(due5 skip)
      const out = advanceStatus(kept, 0);
      const terminal = out.filter((r) => r.outcome_status !== 'pending');
      const skipped = out.filter((r) => r.outcome_status === 'skipped');
      const pass = terminal.length === 10 && skipped.length === 1 && skipped.every((r) => !!r.skipped_reason);
      return pass
        ? ok(`T0 推进：${terminal.length} 行终态（9 labeled + s1 skipped），skipped 全带 reason：「${skipped[0]?.skipped_reason}」`)
        : bad(`terminal=${terminal.length} skipped=${skipped.length}（期望 terminal=10、skipped=1 且带 reason）`);
    },
  },
  {
    id: 'ledger-B', module: 'ledger',
    run: () => {
      const lab = labelable(); // 9 行，含 c1(published=false) + e1..e8(published=true)
      const labeled = advanceStatus(lab, 0);
      const hasFalse = labeled.some((r) => !r.published);
      const hasTrue = labeled.some((r) => r.published);
      const m = metrics(labeled);
      const pass = hasFalse && hasTrue && m.decisive === 6; // c1 与 e 行同口径进同一 metrics（v1 decisive=6）
      return pass
        ? ok(`published=false 反事实行保留并可与 published=true 同口径进 metrics（混合集 decisive=${m.decisive}）`)
        : bad(`hasFalse=${hasFalse} hasTrue=${hasTrue} decisive=${m.decisive}（期望混合集同口径评，v1 decisive=6）`);
    },
  },

  // ── ② curate ─────────────────────────────────────────────
  {
    id: 'curate-A', module: 'curate',
    run: () => {
      const c = curate(SAMPLE);
      const pass = c.poisoned.length === 2 && c.poisoned.every((r) => r.dirty) && c.kept.every((r) => !r.dirty);
      return pass
        ? ok(`2 污染行被分到 poisoned 单独归因、不进 kept（kept=${c.kept.length} 行全干净）`)
        : bad(`poisoned=${c.poisoned.length}（期望 2 行且 kept 全干净）`);
    },
  },
  {
    id: 'curate-B', module: 'curate',
    run: () => {
      const c = curate(SAMPLE);
      const reps = c.kept.filter((r) => r.dedupe_key === 'cnb:mlf');
      const dups = c.deduped.filter((r) => r.dedupe_key === 'cnb:mlf');
      const pass = reps.length === 1 && reps[0].id === 'c1' && dups.length === 1 && dups[0].id === 'c2';
      return pass
        ? ok(`同板块+事件（cnb:mlf）去重成代表：kept 剩 c1，deduped 收 c2`)
        : bad(`reps=${reps.map((r) => r.id)} dups=${dups.map((r) => r.id)}（期望 kept 剩 c1、deduped 收 c2）`);
    },
  },

  // ── ③ label ──────────────────────────────────────────────
  {
    id: 'label-A', module: 'label',
    run: () => {
      const kept = curate(SAMPLE).kept;
      const t0 = advanceStatus(kept, 0);
      const pendingAfterT0 = t0.filter((r) => r.outcome_status === 'pending');
      const t5 = backfillLabels(kept, 5);
      const pendingAfterT5 = t5.filter((r) => r.outcome_status === 'pending');
      const skipped = t5.filter((r) => r.outcome_status === 'skipped');
      const pass = pendingAfterT0.length === 1 && pendingAfterT0[0].id === 's2' && pendingAfterT5.length === 0 && skipped.length === 2 && skipped.every((r) => !!r.skipped_reason);
      return pass
        ? ok(`T+5 回填：s2 由 pending → skipped（T0 pending=1、T+5 pending=0），2 skipped 全带 reason`)
        : bad(`T0 pending=${pendingAfterT0.length} T+5 pending=${pendingAfterT5.length} skipped=${skipped.length}（期望 s2 在 T+5 被回填、0 pending、2 skipped）`);
    },
  },
  {
    id: 'label-B', module: 'label',
    run: () => {
      const lab = labelable(); // 9 行，全在 v1
      const r1 = round(lab, 'v1', 'v2');
      const lab2 = relabel(lab, 'v2');
      const r2 = round(lab2, 'v2', 'v3');
      const idsBefore = lab.map((x) => `${x.id}:${x.direction}:${x.dedupe_key}`).sort().join('|');
      const idsAfter = relabel(lab2, 'v3').map((x) => `${x.id}:${x.direction}:${x.dedupe_key}`).sort().join('|');
      const versionsOk = lab.every((x) => x.model_version === MODEL_VERSION) && lab.every((x) => x.harness_commit === HARNESS_COMMIT);
      const pass = r1.edits.length === 1 && r1.edits[0].file === 'prompt.ts' && r2.edits.length === 1 && r2.edits[0].file === 'prompt.ts' && versionsOk && idsBefore === idsAfter;
      return pass
        ? ok(`两轮消融只动 prompt：edits=[prompt.ts]×2，model_version=${MODEL_VERSION}/harness_commit=${HARNESS_COMMIT}/样本集合逐字段不变`)
        : bad(`r1=${r1.edits.map((e) => e.file)} r2=${r2.edits.map((e) => e.file)} versionsOk=${versionsOk} idsSame=${idsBefore === idsAfter}（期望只动 prompt 且样本不变）`);
    },
  },

  // ── ④ metrics ────────────────────────────────────────────
  {
    id: 'metrics-A', module: 'metrics',
    run: () => {
      const m = metrics([
        mrow('a', 'bullish', 'bullish'), // tp
        mrow('b', 'neutral', 'bullish'), // fp
        mrow('c', 'neutral', 'neutral'), // tn
        mrow('d', 'bearish', 'neutral'), // fn
      ]);
      const pass = m.precision === 0.5 && m.f1 === 0.5 && m.errors === 2;
      return pass
        ? ok(`手算 tp=1/fp=1/tn=1/fn=1 → precision=${m.precision} f1=${m.f1} errors=${m.errors}（逐一相等）`)
        : bad(`precision=${m.precision} f1=${m.f1} errors=${m.errors}（期望 0.5/0.5/2）`);
    },
  },
  {
    id: 'metrics-B', module: 'metrics',
    run: () => {
      const lab = labelable();
      const m1 = metrics(relabel(lab, 'v1'));
      const m2 = metrics(relabel(lab, 'v2'));
      const r = round(lab, 'v1', 'v2');
      const pass = m2.precision > m1.precision && m2.errors < m1.errors && r.edits.length === 1;
      return pass
        ? ok(`v1→v2（只动 prompt）：precision ${m1.precision}→${m2.precision}↑、errors ${m1.errors}→${m2.errors}↓（可归因：edits=[prompt.ts]）`)
        : bad(`precision ${m1.precision}→${m2.precision} errors ${m1.errors}→${m2.errors}（期望 precision↑ errors↓）`);
    },
  },

  // ── ⑤ gate ───────────────────────────────────────────────
  {
    id: 'gate-A', module: 'gate',
    run: () => {
      const down = gate({ prev: { precision: 0.75, recall: 1, f1: 0.8571, errors: 1, decisive: 4, accuracy: 0.8889 }, next: { precision: 0.5, recall: 1, f1: 0.6667, errors: 3, decisive: 6, accuracy: 0.6667 }, n: 9 });
      const up = gate({ prev: { precision: 0.5, recall: 1, f1: 0.6667, errors: 3, decisive: 6, accuracy: 0.6667 }, next: { precision: 0.75, recall: 1, f1: 0.8571, errors: 1, decisive: 4, accuracy: 0.8889 }, n: 9 });
      const pass = down.action === 'reject' && up.action === 'propose' && up.attributable === true;
      return pass
        ? ok(`关键指标降 → reject；关键不降 + 目标显著升 → propose（attributable=${up.attributable}）`)
        : bad(`down=${down.action} up=${up.action}（期望 reject / propose）`);
    },
  },
  {
    id: 'gate-B', module: 'gate',
    run: () => {
      const d = gate({ prev: { precision: 0.75, recall: 1, f1: 0.8571, errors: 1, decisive: 4, accuracy: 0.8889 }, next: { precision: 0.5, recall: 0.6, f1: 0.5455, errors: 5, decisive: 6, accuracy: 0.4444 }, n: 9, varNote: 'prompt v3 + golden set 漂移' });
      const pass = d.attributable === false && d.reason.includes('不可归因') && (d.action === 'propose' || d.action === 'reject');
      return pass
        ? ok(`双变量叠加 → attributable=${d.attributable}；「${d.reason}」；且 Decision.action ∈ {propose,reject}（无 auto-apply 态）`)
        : bad(`attributable=${d.attributable} reason=${d.reason}（期望 attributable=false 且 reason 含「不可归因」）`);
    },
  },
];