// ============================================================
// 单次运行的子进程入口（被 demo.ts  spawn）
//   --mode=crash --crash=A|B|C   崩溃运行：跑到注入点真实自杀（SIGKILL）
//   --mode=resume                resume 运行：恢复 → 跑完 → 打印恢复报告
// 用法：npm run demo:crash 之后 npm run demo:resume 也可手工复现
// ============================================================
import { Store } from "./state.js";
import { ExternalWorld } from "./external.js";
import { makePlan, TASK_ID } from "./plan.js";
import { DurableRunner, log } from "./runner.js";
import { runRecovery } from "./recover.js";
import { canonical } from "./state.js";
import type { CrashPoint } from "./types.js";

const argv = process.argv.slice(2);
/**
 * 命令行 flag 解析：同时支持 `--k v` 与 `--k=v` 两种形式（审计 TECHSTATE-F2）。
 * 为什么必须两种都支持：本文件头部与 notes/durable-execution.md:256 的手工复现命令写的是
 * `npx tsx src/worker.ts --mode=crash --crash=C`（等号形式），而旧实现只认 `--k v`——
 * 于是照文档敲命令时 mode 退回默认 "resume"、crash 变 null，**注入点没命中、进程不崩溃**，
 * 读者得到的是「一个看起来正常跑完的 resume」，而不是预期的 SIGKILL 自杀。
 * 与 demo.ts:24-29 的 flag() 保持同一实现（demo.ts 自己两种都认，worker 才是缺口）。
 */
function flag(name: string): string | null {
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(`--${name}=`.length);
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;
}

const STATE_DIR = flag("state") ?? new URL("../.state", import.meta.url).pathname;
const mode = flag("mode") ?? "resume";
const crashAt = (flag("crash") ?? null) as CrashPoint | null;

const store = new Store(STATE_DIR);
const ext = new ExternalWorld(STATE_DIR);
const plan = makePlan(TASK_ID);

if (mode === "crash") {
  log(`[worker] mode=crash crash=${crashAt ?? "-"} task=${TASK_ID} steps=${plan.length} state=${STATE_DIR}`);
  new DurableRunner(store, ext, plan, TASK_ID).run(crashAt);
  log("[worker] ❌ 未崩溃就跑完了：注入点没命中（crashTarget 配置错误）");
  process.exit(1);
}

log(`[worker] mode=resume task=${TASK_ID} state=${STATE_DIR}`);
const report = runRecovery(plan, store, ext, TASK_ID, crashAt ?? "none");
log(`[worker] resume 完成：副作用计数（消息投递）= ${report.sideEffects.messageDeliveries}`);
log(`REPORT_JSON:${canonical(report)}`);
