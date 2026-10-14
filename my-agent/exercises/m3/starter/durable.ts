// ============================================================
// durable execution —— M3（挖 m3.1）：journal 双锚点 + checkpoint 校验和 + 幂等键 + 恢复判定
//   主线用内存持久层（不碰真实 fs）；「崩溃」= 用同一 journal/checkpoint/幂等键重建 Store。
// ============================================================
import { TODOError, type Checkpoint, type CheckpointDone, type CrashPoint, type Decision, type JournalEvent, type RecoveryReport, type StepSpec } from './types.js';

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

/** 内存持久层（m3.1a） */
export class Store {
  // TODO m3.1a：journal 双锚点 append（intent→exec）；checkpoint write（sha256 校验和）+ read（校验失败→null）；幂等键读写；rebuild（同层重建模拟崩溃恢复）
  constructor(_restore?: unknown) {
    throw new TODOError('m3.1: 实现 journal 双锚点 + checkpoint 原子写(校验和) + 幂等键持久层');
  }
  append(_ev: Record<string, unknown>): JournalEvent {
    throw new TODOError('m3.1: 实现 journal 双锚点 + checkpoint 原子写(校验和) + 幂等键持久层');
  }
  readJournal(): JournalEvent[] {
    throw new TODOError('m3.1: 实现 journal 双锚点 + checkpoint 原子写(校验和) + 幂等键持久层');
  }
  lastSeq(): number {
    throw new TODOError('m3.1: 实现 journal 双锚点 + checkpoint 原子写(校验和) + 幂等键持久层');
  }
  writeCheckpoint(_done: CheckpointDone[], _seq: number): Checkpoint {
    throw new TODOError('m3.1: 实现 journal 双锚点 + checkpoint 原子写(校验和) + 幂等键持久层');
  }
  writeIdempotency(_key: string, _result: string): void {
    throw new TODOError('m3.1: 实现 journal 双锚点 + checkpoint 原子写(校验和) + 幂等键持久层');
  }
}

export function analyze(_plan: StepSpec[], _store: Store, _world: World): Decision[] {
  // TODO m3.1b：exec 在→skip；intent 在 exec 缺且只读→replay；幂等写→replay(幂等键兜底)；非幂等→unknown→只读确认；无 intent→replay
  throw new TODOError('m3.1: 实现崩溃恢复判定 skip/replay/unknown-confirm');
}

/** 崩溃注入 + 恢复执行（driver：crashTarget 步按 A/B/C 注入 → 重建 → analyze → 完成恢复） */
export function recover(_plan: StepSpec[], _store: Store, _world: World, _crashPoint: CrashPoint): RecoveryReport {
  // TODO（随 m3.1 一起补全：调用 Store/analyze 跑通完整恢复，产出 messageDeliveries===1 + 幂等写收敛）
  throw new TODOError('m3.1: 实现崩溃恢复判定 skip/replay/unknown-confirm');
}