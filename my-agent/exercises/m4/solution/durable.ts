// ============================================================
// durable execution —— M3：journal 双锚点 + checkpoint 校验和 + 幂等键 + 恢复判定
//   主线用内存持久层（不碰真实 fs）；「崩溃」= 用同一 journal/checkpoint/幂等键重建 Store。
// ============================================================
import { createHash } from 'node:crypto';
import type {
  Checkpoint,
  CheckpointDone,
  CrashPoint,
  Decision,
  JournalEvent,
  JournalExec,
  JournalIntent,
  RecoveryReport,
  StepKind,
  StepSpec,
} from './types.js';

export const CHECKPOINT_EVERY = 2;
export const CRASH_POINTS = ['A', 'B', 'C'] as const;

/** mock 外部世界（给全，确定性）：消息投递账本 + db（供「非幂等→只读确认」查询） */
export class World {
  deliveries: string[] = [];
  db = new Map<string, string>();

  deliver(key: string): void {
    this.deliveries.push(key);
  }
  deliveryCount(): number {
    return this.deliveries.length;
  }
  lookup(key: string): { delivered: boolean } {
    return { delivered: this.deliveries.includes(key) };
  }
}

/** 确定性 plan（给全）：readonly + idempotent + nonidempotent 各一步 */
export const DEMO_PLAN: StepSpec[] = [
  { step: 1, name: '读报告', kind: 'readonly', tool: 'read_file', args: { path: 'report.md' }, idemKey: 'r:report' },
  { step: 2, name: '写报告(幂等)', kind: 'idempotent', tool: 'write_report', args: { id: 'rpt-1', title: 'Q1' }, idemKey: 'w:rpt-1' },
  { step: 3, name: '发邮件(非幂等)', kind: 'nonidempotent', tool: 'send_email', args: { to: 'ops@company.com' }, idemKey: 'e:ops', crashTarget: true },
];

/** 确定性 sha256（校验和；不涉墙钟/随机） */
function sha256(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

/** canonical JSON：键排序 + 无空白 → 跨次逐字节一致（校验和比对前提） */
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const rec = value as Record<string, unknown>;
  return `{${Object.keys(rec)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(rec[k])}`)
    .join(',')}}`;
}

type JournalInput =
  | { kind: 'intent'; step: number; name: string; stepKind: StepKind; tool: string; args: Record<string, unknown>; idemKey: string }
  | { kind: 'exec'; step: number; name: string; result: string; sideEffect: boolean };

/** 内存持久层（双锚点 + 校验和 checkpoint + 幂等键） */
export class Store {
  private seq = 0;
  private journal: JournalEvent[];
  private ck: Checkpoint | null;
  private idem: Map<string, string>;

  constructor(restore?: { journal: JournalEvent[]; checkpoint: Checkpoint | null; idempotency: Map<string, string> }) {
    this.journal = restore ? [...restore.journal] : [];
    this.ck = restore?.checkpoint ?? null;
    this.idem = restore ? new Map(restore.idempotency) : new Map();
    for (const e of this.journal) this.seq = Math.max(this.seq, e.seq);
  }

  /** 同步 append（细粒度唯一事实源）：intent→exec 逐条落地 */
  append(ev: JournalInput): JournalEvent {
    const full = { ...ev, seq: ++this.seq } as unknown as JournalEvent;
    this.journal.push(full);
    return full;
  }

  readJournal(): JournalEvent[] {
    return [...this.journal];
  }

  lastSeq(): number {
    return this.seq;
  }

  writeCheckpoint(done: CheckpointDone[], seq: number): Checkpoint {
    const ck: Checkpoint = { version: 1, seq, lastStep: done.length ? done[done.length - 1].step : 0, done, checksum: '' };
    ck.checksum = sha256(canonical({ version: ck.version, seq: ck.seq, lastStep: ck.lastStep, done: ck.done }));
    this.ck = ck;
    return ck;
  }

  /** 读快照并校验；校验失败（毒快照）→ 返回 null 退回全量重放 journal */
  readCheckpoint(): { ck: Checkpoint | null; valid: boolean } {
    const raw = this.ck;
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.done)) return { ck: null, valid: false };
    const { checksum, ...rest } = raw;
    const ok = typeof checksum === 'string' && checksum === sha256(canonical(rest));
    return ok ? { ck: raw, valid: true } : { ck: null, valid: false };
  }

  writeIdempotency(key: string, result: string): void {
    this.idem.set(key, result);
  }

  readIdempotency(): Record<string, string> {
    return Object.fromEntries(this.idem);
  }

  /** 同层重建：模拟进程重启后从同一 durable 层（journal/checkpoint/幂等键）恢复 */
  rebuild(): Store {
    return new Store({ journal: this.readJournal(), checkpoint: this.readCheckpoint().ck, idempotency: new Map(this.idem) });
  }
}

/** 恢复判定（纯函数，不执行副作用） */
export function analyze(plan: StepSpec[], store: Store, world: World): Decision[] {
  const { ck } = store.readCheckpoint();
  const events = store.readJournal();
  const intents = new Map<number, JournalIntent>();
  const execs = new Map<number, JournalExec>();
  for (const e of events) {
    if (ck && e.seq <= ck.seq) continue; // 已纳入快照的事件不重放
    if (e.kind === 'intent') intents.set(e.step, e);
    else execs.set(e.step, e);
  }
  const done = new Map<number, string>();
  for (const d of ck?.done ?? []) done.set(d.step, d.result);
  for (const e of execs.values()) done.set(e.step, e.result);

  const out: Decision[] = [];
  for (const step of plan) {
    if (done.has(step.step)) {
      out.push({ step, disposition: 'skip', detail: 'exec 已在 journal/快照：读历史结果，不重做', execute: false });
    } else if (!intents.has(step.step)) {
      out.push({ step, disposition: 'replay', detail: '无 intent：从未开始 → 正常执行', execute: true });
    } else if (step.kind === 'readonly') {
      out.push({ step, disposition: 'replay', detail: '只读（intent 在 exec 缺）：免费重放，无副作用', execute: true });
    } else if (step.kind === 'idempotent') {
      out.push({ step, disposition: 'replay', detail: '幂等写（intent 在 exec 缺）：幂等键兜底重放，外部状态收敛', execute: true });
    } else {
      const q = world.lookup(step.idemKey);
      if (q.delivered) out.push({ step, disposition: 'unknown-confirm-skip', detail: '未知态 → 只读确认：key 已送达 → 不重放', execute: false });
      else out.push({ step, disposition: 'unknown-confirm-exec', detail: '未知态 → 只读确认：key 未送达 → 确认未发生才执行', execute: true });
    }
  }
  return out;
}

function currentDone(plan: StepSpec[], store: Store): CheckpointDone[] {
  const kindByStep = new Map(plan.map((s) => [s.step, s.kind]));
  return store
    .readJournal()
    .filter((e): e is JournalExec => e.kind === 'exec')
    .map((e) => ({ step: e.step, name: e.name, stepKind: kindByStep.get(e.step) ?? 'readonly', result: e.result, sideEffect: e.sideEffect }));
}

function runStep(plan: StepSpec[], store: Store, world: World, step: StepSpec): void {
  store.append({ kind: 'intent', step: step.step, name: step.name, stepKind: step.kind, tool: step.tool, args: step.args, idemKey: step.idemKey });
  let result: string;
  let sideEffect = false;
  if (step.kind === 'readonly') {
    result = `已读 ${String(step.args.path ?? '')}`;
  } else if (step.kind === 'idempotent') {
    result = `报告 ${String(step.args.id)}`;
    world.db.set(step.idemKey, result);
    store.writeIdempotency(step.idemKey, result);
  } else {
    result = `已发送到 ${String(step.args.to ?? '')}`;
    world.deliver(step.idemKey);
    sideEffect = true;
  }
  store.append({ kind: 'exec', step: step.step, name: step.name, result, sideEffect });
  if (step.step % CHECKPOINT_EVERY === 0) store.writeCheckpoint(currentDone(plan, store), store.lastSeq());
}

/** 崩溃注入 + 恢复执行：crashTarget 步按 A/B/C 注入 → 同层重建 → analyze → 完成恢复 */
export function recover(plan: StepSpec[], store: Store, world: World, crashPoint: CrashPoint): RecoveryReport {
  const target = plan.find((s) => s.crashTarget) ?? plan[plan.length - 1];

  for (const step of plan) {
    if (step.step >= target.step) break;
    runStep(plan, store, world, step);
  }

  if (crashPoint === 'B' || crashPoint === 'C') {
    store.append({ kind: 'intent', step: target.step, name: target.name, stepKind: target.kind, tool: target.tool, args: target.args, idemKey: target.idemKey });
  }
  if (crashPoint === 'C') {
    runStep(plan, store, world, target);
  }

  const rebuilt = store.rebuild();
  const decisions = analyze(plan, rebuilt, world);
  for (const d of decisions) if (d.execute) runStep(plan, rebuilt, world, d.step);

  const idem = plan.find((s) => s.kind === 'idempotent')!;
  return {
    crashPoint,
    steps: decisions,
    sideEffects: { messageDeliveries: world.deliveryCount() },
    idempotentWrite: { key: idem.idemKey, value: world.db.get(idem.idemKey) ?? '<none>' },
  };
}