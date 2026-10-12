// ============================================================
// DurableRunner：正常运行路径 + 崩溃注入器
//   每步：记 intent → 执行副作用 → 记 exec 结果；每 N 步 checkpoint
//   崩溃注入：到目标步的 A/B/C 三点之一，子进程 process.kill(pid,'SIGKILL') 真实自杀
//   （写 journal 用 appendFileSync、写 stdout 用 writeSync：同步 IO，SIGKILL 前不丢）
// ============================================================
import { writeSync } from "node:fs";
import { CHECKPOINT_EVERY, type Store } from "./state.js";
import type { ExternalWorld } from "./external.js";
import type { CheckpointDone, CrashPoint, StepSpec } from "./types.js";

export interface ExecResult {
  result: string;
  /** 是否产生了 at-least-once 语义的真实副作用（非幂等投递） */
  sideEffect: boolean;
}

/** 同步写 stdout：console.log 走管道是异步的，SIGKILL 会吞掉未 flush 的行 */
export function log(line: string): void {
  writeSync(1, `${line}\n`);
}

/** 崩溃注入器：真实自杀（不是抛异常、不是 process.exit，是 SIGKILL） */
export function injectCrash(point: CrashPoint, where: string): never {
  log(`    💥 崩溃注入 ${point}（${where}）→ process.kill(process.pid,'SIGKILL') 真实自杀`);
  process.kill(process.pid, "SIGKILL");
  throw new Error("unreachable: SIGKILL 之后不应回到这里");
}

export class DurableRunner {
  /** 已完成的步（恢复时用快照 + journal 的 exec 记录 seeding，保证 checkpoint 节拍连续） */
  private done: CheckpointDone[];

  constructor(
    private readonly store: Store,
    private readonly ext: ExternalWorld,
    private readonly plan: StepSpec[],
    private readonly taskId: string,
    seedDone: CheckpointDone[] = [],
  ) {
    this.done = [...seedDone].sort((a, b) => a.step - b.step);
  }

  /** 崩溃运行：正常跑到目标步的注入点自杀 */
  run(crashAt: CrashPoint | null): void {
    this.store.append({ kind: "task_start", taskId: this.taskId, totalSteps: this.plan.length });
    for (const step of this.plan) {
      if (crashAt === "A" && step.crashTarget) injectCrash("A", "intent 前：该步从未开始");
      const intent = this.store.append({ kind: "intent", step: step.step, name: step.name, stepKind: step.kind, tool: step.tool, args: step.args, idemKey: step.idemKey });
      if (crashAt === "B" && step.crashTarget) injectCrash("B", "intent 后 exec 前：副作用发生没有=未知");
      const res = this.execute(step);
      if (crashAt === "C" && step.crashTarget) injectCrash("C", "exec 后未落盘：副作用已发生、结果未记录");
      const exec = this.finish(step, res);
      log(`    step${step.step} ${step.name} [${step.kind}] intent(seq=${intent.seq}) → exec(seq=${exec.seq}) ${res.result}`);
    }
  }

  /** 执行一个动作（外部副作用按工具分派；只读/幂等写/非幂等发消息） */
  execute(step: StepSpec): ExecResult {
    if (step.tool === "read_file") return { result: "config{batch=1645,retries=3}", sideEffect: false };
    if (step.tool === "query") return { result: "pending_rows=1645", sideEffect: false };
    if (step.tool === "upsert") {
      const v = this.ext.db.upsert(step.idemKey, "ok");
      return { result: `upsert row=${String(step.args.id)} → ${v}（幂等：重复写收敛）`, sideEffect: false };
    }
    if (step.tool === "send_message") {
      const d = this.ext.msg.deliver(step.idemKey, String(step.args.text));
      return { result: `delivered ${d.messageId}`, sideEffect: true };
    }
    throw new Error(`未知工具: ${step.tool}`);
  }

  /** exec 结果落 journal + 幂等存储（只对幂等写）+ 每 N 步 checkpoint */
  finish(step: StepSpec, res: ExecResult): { seq: number } {
    const ev = this.store.append({ kind: "exec", step: step.step, name: step.name, result: res.result, sideEffect: res.sideEffect });
    if (step.kind === "idempotent") this.store.writeIdempotency(step.idemKey, res.result);
    this.done.push({ step: step.step, name: step.name, stepKind: step.kind, result: res.result, sideEffect: res.sideEffect });
    if (this.done.length % CHECKPOINT_EVERY === 0) this.store.writeCheckpoint(this.done, ev.seq);
    return { seq: ev.seq };
  }
}
