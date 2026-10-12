// ============================================================
// 类型定义 —— durable execution §S7
//   工具三分法（S4）：readonly / idempotent / nonidempotent
//   三种崩溃注入点（S4）：A intent 前 / B intent 后 exec 前 / C exec 后未落盘
//   处置（S3 决策树 + S8.2 判定表）：skip / replay / unknown→confirm→{exec,skip}
// ============================================================

/** 工具三分法（S4）：同一操作执行两次，对世界的最终状态是否与执行一次相同 */
export type StepKind = "readonly" | "idempotent" | "nonidempotent";

/** 三种崩溃注入点（S4 状态图） */
export type CrashPoint = "A" | "B" | "C";

/** 恢复时对每一步的处置 */
export type Disposition = "skip" | "replay" | "unknown-confirm-exec" | "unknown-confirm-skip";

export interface StepSpec {
  step: number; // 逻辑时钟（步序号）：不用 Date.now()，保证跨次逐字节一致
  name: string;
  kind: StepKind;
  tool: string;
  args: Record<string, unknown>;
  /** idempotency key：必须落在外部世界能看到的持久层（S4 反例：进程内存里的 Set） */
  idemKey: string;
  /** 崩溃注入目标步 */
  crashTarget?: boolean;
}

type Seq = { seq: number };

/** Journal 事件（细粒度，唯一事实源）：intent→exec 双记录（S2 机制 1） */
export type JournalEvent =
  | (Seq & { kind: "task_start"; taskId: string; totalSteps: number })
  | (Seq & { kind: "intent"; step: number; name: string; stepKind: StepKind; tool: string; args: Record<string, unknown>; idemKey: string })
  | (Seq & { kind: "exec"; step: number; name: string; result: string; sideEffect: boolean });

export type JournalInput = DistributiveOmit<JournalEvent, "seq">;
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type IntentEvent = Extract<JournalEvent, { kind: "intent" }>;
export type ExecEvent = Extract<JournalEvent, { kind: "exec" }>;

/** 快照里的"已完成一步"（粗粒度 checkpoint，S2 机制 2） */
export interface CheckpointDone {
  step: number;
  name: string;
  stepKind: StepKind;
  result: string;
  sideEffect: boolean;
}

export interface Checkpoint {
  version: 1;
  /** 纳入本快照的 journal seq 上界：恢复只重放 seq 更大的事件 */
  seq: number;
  lastStep: number;
  done: CheckpointDone[];
  checksum: string;
}

export interface StepDisposition {
  step: number;
  name: string;
  stepKind: StepKind;
  disposition: Disposition;
  detail: string;
}

/** 恢复报告：每步处置 + 副作用计数（S7 验收对象） */
export interface RecoveryReport {
  taskId: string;
  crashPoint: string;
  resumedFrom: {
    checkpointStep: number | null;
    checkpointValid: boolean;
    journalEvents: number;
    replayedFromSeq: number;
  };
  steps: StepDisposition[];
  /** 验收指标：mock 消息队列账本行数（at-least-once 投递的真实副作用） */
  sideEffects: { messageDeliveries: number };
  /** 幂等写的最终收敛值（读外部世界，证明"重放无新副作用"） */
  idempotentWrite: { key: string; value: string };
  completedSteps: number;
}
