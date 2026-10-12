// ============================================================
// 任务计划（S7 规格）+ 三种崩溃注入点定义
//   任务 = 多步混合：只读×2 + 幂等写×1 + 非幂等"发消息"×1（mock 外部服务）
//   崩溃点：A intent 前 / B intent 后 exec 前 / C exec 后未落盘
// ============================================================
import type { CrashPoint, Disposition, StepSpec } from "./types.js";

export const TASK_ID = "backfill-1645";

export function makePlan(taskId: string): StepSpec[] {
  return [
    { step: 1, name: "read_config", kind: "readonly", tool: "read_file", args: { path: "config/task.yaml" }, idemKey: `${taskId}:s1:read_config` },
    { step: 2, name: "fetch_rows", kind: "readonly", tool: "query", args: { sql: "select id from backfill where status='pending'" }, idemKey: `${taskId}:s2:fetch_rows` },
    { step: 3, name: "upsert_row", kind: "idempotent", tool: "upsert", args: { table: "backfill", id: 1645, status: "ok" }, idemKey: `${taskId}:s3:upsert:row-1645` },
    { step: 4, name: "send_message", kind: "nonidempotent", tool: "send_message", args: { channel: "ops", text: "backfill 1645 行完成" }, idemKey: `${taskId}:s4:send:ops`, crashTarget: true },
  ];
}

export interface CrashSpec {
  id: CrashPoint;
  /** 注入位置（相对目标步的 intent/exec） */
  where: string;
  /** 该崩溃点下，目标步恢复时的预期处置 */
  expect: Disposition;
  expectText: string;
}

export const CRASH_SPECS: CrashSpec[] = [
  { id: "A", where: "intent 前（该步从未开始）", expect: "replay", expectText: "replay（无 intent → 正常执行）" },
  { id: "B", where: "intent 后 exec 前（副作用未知）", expect: "unknown-confirm-exec", expectText: "unknown→confirm→exec（mock 回报未送达）" },
  { id: "C", where: "exec 后未落盘（副作用已发生）", expect: "unknown-confirm-skip", expectText: "unknown→confirm→skip（mock 回报已送达）" },
];

export function crashSpec(id: CrashPoint): CrashSpec {
  const s = CRASH_SPECS.find((c) => c.id === id);
  if (!s) throw new Error(`未知崩溃点 ${id}`);
  return s;
}
