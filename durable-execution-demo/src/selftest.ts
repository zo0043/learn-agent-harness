// ============================================================
// 处置规则自检：合成 journal 状态 → 判定表（覆盖 S3 决策树全部分支）
//   真实验收矩阵只把崩溃点打在非幂等"发消息"步上；这里用合成状态把
//   "只读步 replay / 幂等写 replay / 非幂等 unknown→confirm 两路 / 已完成 skip"
//   全部跑到，证明判定表本身是对的，而不只是某一条路径碰巧对。
// ============================================================
import { ExternalWorld } from "./external.js";
import { analyze, DISPOSITION_LABEL } from "./recover.js";
import { makePlan, TASK_ID } from "./plan.js";
import { Store } from "./state.js";
import type { Disposition, StepKind, StepSpec } from "./types.js";

export interface SelfCheckRow {
  label: string;
  step: number;
  name: string;
  stepKind: StepKind;
  journalState: string;
  disposition: Disposition;
}

interface Case {
  label: string;
  /** 目标步在 journal 里的状态 */
  journalState: string;
  /** 目标步：把前 target-1 步记成已完成，目标步按 case 记状态 */
  target: number;
  build: (store: Store, ext: ExternalWorld, step: StepSpec, prev: StepSpec[]) => void;
}

const CASES: Case[] = [
  { label: "无 intent（从未开始）", journalState: "无 intent", target: 4, build: (s) => void s.append({ kind: "task_start", taskId: TASK_ID, totalSteps: 4 }) },
  {
    label: "intent 在、exec 缺 · 只读步",
    journalState: "intent 在、exec 缺",
    target: 1,
    build: (s, _e, step, prev) => {
      s.append({ kind: "task_start", taskId: TASK_ID, totalSteps: 4 });
      for (const p of prev) doneStep(s, p);
      s.append({ kind: "intent", step: step.step, name: step.name, stepKind: step.kind, tool: step.tool, args: step.args, idemKey: step.idemKey });
    },
  },
  {
    label: "intent 在、exec 缺 · 幂等写",
    journalState: "intent 在、exec 缺",
    target: 3,
    build: (s, _e, step, prev) => {
      s.append({ kind: "task_start", taskId: TASK_ID, totalSteps: 4 });
      for (const p of prev) doneStep(s, p);
      s.append({ kind: "intent", step: step.step, name: step.name, stepKind: step.kind, tool: step.tool, args: step.args, idemKey: step.idemKey });
    },
  },
  {
    label: "intent 在、exec 缺 · 非幂等（mock 回报未送达）",
    journalState: "intent 在、exec 缺",
    target: 4,
    build: (s, _e, step, prev) => {
      s.append({ kind: "task_start", taskId: TASK_ID, totalSteps: 4 });
      for (const p of prev) doneStep(s, p);
      s.append({ kind: "intent", step: step.step, name: step.name, stepKind: step.kind, tool: step.tool, args: step.args, idemKey: step.idemKey });
    },
  },
  {
    label: "intent 在、exec 缺 · 非幂等（mock 回报已送达）",
    journalState: "intent 在、exec 缺",
    target: 4,
    build: (s, ext, step, prev) => {
      s.append({ kind: "task_start", taskId: TASK_ID, totalSteps: 4 });
      for (const p of prev) doneStep(s, p);
      s.append({ kind: "intent", step: step.step, name: step.name, stepKind: step.kind, tool: step.tool, args: step.args, idemKey: step.idemKey });
      ext.msg.deliver(step.idemKey, String(step.args.text)); // 外部世界已收到（崩溃点 C 的形态）
    },
  },
  { label: "intent + exec 都在（已完成）", journalState: "intent + exec", target: 4, build: (s, _e, step, prev) => {
      s.append({ kind: "task_start", taskId: TASK_ID, totalSteps: 4 });
      for (const p of prev) doneStep(s, p);
      s.append({ kind: "intent", step: step.step, name: step.name, stepKind: step.kind, tool: step.tool, args: step.args, idemKey: step.idemKey });
      s.append({ kind: "exec", step: step.step, name: step.name, result: "delivered msg-0001", sideEffect: true });
    } },
];

function doneStep(store: Store, step: StepSpec): void {
  store.append({ kind: "intent", step: step.step, name: step.name, stepKind: step.kind, tool: step.tool, args: step.args, idemKey: step.idemKey });
  store.append({ kind: "exec", step: step.step, name: step.name, result: `${step.name}:ok`, sideEffect: false });
}

/** 在独立状态目录里跑判定表（纯判定，不执行副作用） */
export function decisionTable(stateRoot: string): SelfCheckRow[] {
  const plan = makePlan(TASK_ID);
  const rows: SelfCheckRow[] = [];
  CASES.forEach((c, i) => {
    const dir = `${stateRoot}/selftest/${i}`;
    const store = new Store(dir);
    const ext = new ExternalWorld(dir);
    const step = plan.find((p) => p.step === c.target)!;
    c.build(store, ext, step, plan.filter((p) => p.step < c.target));
    const view = analyze(plan, store, ext);
    const d = view.decisions.find((x) => x.step.step === c.target)!;
    rows.push({ label: c.label, step: step.step, name: step.name, stepKind: step.kind, journalState: c.journalState, disposition: d.disposition });
  });
  return rows;
}

export function selfCheckTableLines(rows: SelfCheckRow[]): string[] {
  const w = Math.max(...rows.map((r) => r.label.length));
  return rows.map((r) => `  ${r.label.padEnd(w)}  step${r.step} ${r.name}[${r.stepKind}]（${r.journalState}）→ ${DISPOSITION_LABEL[r.disposition]}`);
}
