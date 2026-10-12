// ============================================================
// 恢复器：rebuild → 逐步判 replay / skip / unknown→confirm
//   rebuild = 读 checkpoint（校验和，毒快照退回全量重放）+ 重放 checkpoint 之后的 journal
//   判定表（S8.2，本文件是实现）：
//     exec 在（快照或 journal）        → skip        读历史结果，不重做
//     intent 在、exec 缺 · 只读        → replay       免费重放（确定性）
//     intent 在、exec 缺 · 幂等写      → replay       幂等键兜底，外部状态收敛
//     intent 在、exec 缺 · 非幂等      → unknown→confirm：只读问 mock 服务
//                                          已送达 → skip；未送达 → exec
//     无 intent                        → replay       从未开始，安全执行
// ============================================================
import type { Store } from "./state.js";
import type { ExternalWorld } from "./external.js";
import { DurableRunner, log } from "./runner.js";
import type { CheckpointDone, Disposition, ExecEvent, IntentEvent, RecoveryReport, StepDisposition, StepSpec } from "./types.js";

export const DISPOSITION_LABEL: Record<Disposition, string> = {
  skip: "skip",
  replay: "replay",
  "unknown-confirm-exec": "unknown→confirm→exec",
  "unknown-confirm-skip": "unknown→confirm→skip",
};

interface DoneEntry extends CheckpointDone {
  source: "checkpoint" | "journal";
}

export interface Decision {
  step: StepSpec;
  disposition: Disposition;
  detail: string;
  execute: boolean;
}

export interface RecoveryView {
  ck: { seq: number; lastStep: number } | null;
  ckValid: boolean;
  journalEvents: number;
  replayedFromSeq: number;
  done: Map<number, DoneEntry>;
  intents: Map<number, IntentEvent>;
  decisions: Decision[];
}

/** 纯判定（不执行任何副作用）：可单测、可被 demo 的规则自检复用 */
export function analyze(plan: StepSpec[], store: Store, ext: ExternalWorld): RecoveryView {
  const { ck, valid } = store.readCheckpoint();
  const events = store.readJournal();
  const intents = new Map<number, IntentEvent>();
  const execs = new Map<number, ExecEvent>();
  for (const e of events) {
    if (ck && e.seq <= ck.seq) continue; // 已纳入快照的事件不重放（checkpoint = 重放加速器）
    if (e.kind === "intent") intents.set(e.step, e);
    else if (e.kind === "exec") execs.set(e.step, e);
  }
  const done = new Map<number, DoneEntry>();
  for (const d of ck?.done ?? []) done.set(d.step, { ...d, source: "checkpoint" });
  for (const [stepNo, e] of execs) {
    const spec = plan.find((p) => p.step === stepNo);
    done.set(stepNo, { step: stepNo, name: e.name, stepKind: spec?.kind ?? "readonly", result: e.result, sideEffect: e.sideEffect, source: "journal" });
  }

  const decisions: Decision[] = [];
  for (const step of plan) {
    const d = done.get(step.step);
    if (d) {
      decisions.push({ step, disposition: "skip", detail: `exec 已在${d.source === "checkpoint" ? "快照" : "journal"}：读历史结果「${d.result}」，不重做`, execute: false });
      continue;
    }
    if (!intents.has(step.step)) {
      decisions.push({ step, disposition: "replay", detail: "无 intent：从未开始 → 正常执行", execute: true });
      continue;
    }
    if (step.kind === "readonly") {
      decisions.push({ step, disposition: "replay", detail: "只读步（intent 在、exec 缺）：免费重放，确定性无副作用", execute: true });
      continue;
    }
    if (step.kind === "idempotent") {
      const cached = store.readIdempotency()[step.idemKey];
      decisions.push({ step, disposition: "replay", detail: `幂等写（intent 在、exec 缺）：幂等键兜底重放，外部状态收敛${cached ? `（持久层已有 key→${cached}）` : ""}`, execute: true });
      continue;
    }
    // 非幂等：不盲重放 —— 先只读问外部服务"这个 idempotency key 送达过吗"
    const q = ext.msg.lookup(step.idemKey);
    if (q.delivered) {
      decisions.push({ step, disposition: "unknown-confirm-skip", detail: `未知（intent 在、exec 缺）→ 只读问 mock 服务：key 已送达（${q.record?.messageId ?? "?"}）→ 不重放`, execute: false });
    } else {
      decisions.push({ step, disposition: "unknown-confirm-exec", detail: "未知（intent 在、exec 缺）→ 只读问 mock 服务：key 未送达 → 确认未发生才执行", execute: true });
    }
  }
  return { ck: ck ? { seq: ck.seq, lastStep: ck.lastStep } : null, ckValid: valid, journalEvents: events.length, replayedFromSeq: (ck?.seq ?? 0) + 1, done, intents, decisions };
}

/** 恢复执行：按判定表处置每一步，产出恢复报告（每步处置 + 副作用计数） */
export function runRecovery(plan: StepSpec[], store: Store, ext: ExternalWorld, taskId: string, crashPoint: string): RecoveryReport {
  const view = analyze(plan, store, ext);
  const seed = [...view.done.values()].map(({ source: _source, ...d }) => d);
  const runner = new DurableRunner(store, ext, plan, taskId, seed);
  log(`[resume] 恢复起点：checkpoint @step${view.ck?.lastStep ?? 0}（${view.ckValid ? "校验通过" : "无/毒快照 → 退回全量重放 journal"}）；重放 journal seq≥${view.replayedFromSeq}（共 ${view.journalEvents} 条事件）`);

  const steps: StepDisposition[] = [];
  let executed = 0;
  for (const d of view.decisions) {
    steps.push({ step: d.step.step, name: d.step.name, stepKind: d.step.kind, disposition: d.disposition, detail: d.detail });
    const label = DISPOSITION_LABEL[d.disposition];
    if (!d.execute) {
      log(`    step${d.step.step} ${d.step.name} [${d.step.kind}] → ${label}：${d.detail}`);
      continue;
    }
    const hasIntent = view.intents.has(d.step.step);
    if (!hasIntent) store.append({ kind: "intent", step: d.step.step, name: d.step.name, stepKind: d.step.kind, tool: d.step.tool, args: d.step.args, idemKey: d.step.idemKey });
    const res = runner.execute(d.step);
    const { seq } = runner.finish(d.step, res);
    executed += 1;
    log(`    step${d.step.step} ${d.step.name} [${d.step.kind}] → ${label}：${d.detail}${hasIntent ? "" : "（补记 intent）"}；exec(seq=${seq}) ${res.result}`);
  }

  const idemStep = plan.find((p) => p.kind === "idempotent");
  return {
    taskId,
    crashPoint,
    resumedFrom: { checkpointStep: view.ck?.lastStep ?? null, checkpointValid: view.ckValid, journalEvents: view.journalEvents, replayedFromSeq: view.replayedFromSeq },
    steps,
    sideEffects: { messageDeliveries: ext.msg.deliveries() },
    idempotentWrite: { key: idemStep?.idemKey ?? "", value: idemStep ? (ext.db.get(idemStep.idemKey) ?? "<none>") : "<none>" },
    completedSteps: view.done.size + executed,
  };
}
