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
function flag(name: string): string | null {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
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
