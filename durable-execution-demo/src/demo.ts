// ============================================================
// demo 入口 —— durable execution §S7
//   npm run demo    验收矩阵 = 3 种崩溃点 × 各跑 3 次
//                   每次：清 .state → 崩溃运行（子进程 SIGKILL 真实自杀）→ resume 运行
//                   断言：副作用计数恒=1、恢复报告跨次逐字节一致、处置符合预期表
//   全离线确定性：mock 外部服务 + 逻辑时钟（步序号），不调模型、不联网、不用墙钟
// ============================================================
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { ExternalWorld } from "./external.js";
import { CRASH_SPECS, crashSpec, makePlan, TASK_ID } from "./plan.js";
import { DISPOSITION_LABEL } from "./recover.js";
import { decisionTable, selfCheckTableLines } from "./selftest.js";
import { canonical, sha256 } from "./state.js";
import { log } from "./runner.js";
import type { CrashPoint, RecoveryReport } from "./types.js";

const PROJECT_ROOT = new URL("..", import.meta.url).pathname;
const STATE_DIR = `${PROJECT_ROOT}.state`;
const WORKER = new URL("./worker.ts", import.meta.url).pathname;
const RUNS = 3;

const argv = process.argv.slice(2);
function flag(name: string): string | null {
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(`--${name}=`.length);
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;
}
const onlyCrash = flag("crash") as CrashPoint | null;
const runs = Number(flag("runs") ?? RUNS);

/** 起一个子进程跑 worker；崩溃运行必须真的被 SIGKILL 打死 */
function runWorker(mode: "crash" | "resume", crash: CrashPoint | null): { out: string; died: string } {
  const r = spawnSync(process.execPath, ["--import", "tsx", WORKER, "--mode", mode, ...(crash ? ["--crash", crash] : [])], {
    encoding: "utf8",
    cwd: PROJECT_ROOT,
  });
  const out = r.stdout ?? "";
  if (r.stderr) log(`  [worker stderr] ${r.stderr.trim()}`);
  const died = r.signal ? `signal=${r.signal}` : `exit=${String(r.status)}`;
  return { out, died };
}

function parseReport(out: string): RecoveryReport {
  const line = out.split("\n").find((l) => l.startsWith("REPORT_JSON:"));
  if (!line) throw new Error(`worker 未输出恢复报告:\n${out}`);
  return JSON.parse(line.slice("REPORT_JSON:".length)) as RecoveryReport;
}

function echo(out: string, indent: string): void {
  for (const l of out.split("\n")) if (l.trim() && !l.startsWith("REPORT_JSON:")) log(`${indent}${l}`);
}

function deliveries(): number {
  return new ExternalWorld(STATE_DIR).msg.deliveries();
}

function resetState(): void {
  rmSync(STATE_DIR, { recursive: true, force: true });
}

function main(): void {
  const plan = makePlan(TASK_ID);
  log("[durable-execution-demo] durable execution §S7 · 3 种崩溃点 × 各 3 次，副作用计数恒=1");
  log("  全离线确定性：mock 外部服务（消息队列 / 业务库）+ 逻辑时钟（步序号）替代 Date.now()；不调模型、不联网、不用墙钟\n");

  log("一、任务计划（多步混合：只读×2 + 幂等写×1 + 非幂等发消息×1）");
  for (const s of plan) {
    log(`  step${s.step} ${s.name.padEnd(13)} [${s.kind.padEnd(12)}] ${s.tool}  idemKey=${s.idemKey}${s.crashTarget ? "  ← 崩溃注入目标" : ""}`);
  }

  log("\n二、三种崩溃注入点（子进程 process.kill(process.pid,'SIGKILL') 真实自杀，再重启恢复）");
  for (const c of CRASH_SPECS) log(`  ${c.id} ${c.where.padEnd(30)} → send 步预期处置：${c.expectText}`);

  log("\n三、处置规则自检（合成 journal 状态 → 判定表，覆盖 S3 决策树全分支）");
  const rows = decisionTable(STATE_DIR);
  for (const l of selfCheckTableLines(rows)) log(l);

  const points = onlyCrash ? [onlyCrash] : CRASH_SPECS.map((c) => c.id);
  log(`\n四、验收矩阵：${points.length} 崩溃点 × 各 ${runs} 次（每次清 .state 重来：先崩溃运行 → 再 resume 运行）`);
  const summary: string[] = [];
  let allOk = true;

  for (const cp of points) {
    const spec = crashSpec(cp);
    const hashes: string[] = [];
    let countOk = true;
    let dispOk = true;
    let crashOk = true;
    for (let i = 1; i <= runs; i++) {
      resetState();
      const crash = runWorker("crash", cp);
      const before = deliveries();
      if (!(crash.died === "signal=SIGKILL" || crash.died === "exit=137")) {
        crashOk = false;
        log(`  [${cp}] run ${i}/${runs} ❌ 崩溃运行没有被 SIGKILL 打死（${crash.died}）`);
      }
      const resume = runWorker("resume", cp);
      const after = deliveries();
      const report = parseReport(resume.out);
      const hash = sha256(canonical(report));
      hashes.push(hash);
      const target = report.steps.find((s) => s.step === 4)!;
      const one = after === 1;
      if (after !== 1) countOk = false;
      if (target.disposition !== spec.expect) dispOk = false;
      const disp = report.steps.map((s) => `${s.step} ${DISPOSITION_LABEL[s.disposition]}`).join(" | ");
      if (i === 1) {
        log(`\n  [${cp}] run 1/${runs} 详细轨迹（${spec.where}）`);
        echo(crash.out, "      ");
        log(`      ── 重启，resume ──`);
        echo(resume.out, "      ");
      }
      log(`  [${cp}] run ${i}/${runs} 自杀=${crash.died} | 处置: ${disp} | 副作用: 崩溃前 ${before} + resume ${after - before} = ${after} ${one ? "✅" : "❌"} | 报告 sha256=${hash.slice(0, 12)}`);
    }
    const same = hashes.every((h) => h === hashes[0]);
    const ok = countOk && dispOk && crashOk && (runs < 2 || same);
    allOk = allOk && ok;
    log(`  [${cp}] 小结 ${ok ? "✅" : "❌"}：副作用计数恒=1 ${countOk ? "✅" : "❌"} / send 步处置恒=${spec.expectText} ${dispOk ? "✅" : "❌"} / 真实 SIGKILL ${crashOk ? "✅" : "❌"} / 恢复报告 ${runs} 次逐字节一致 ${same ? `✅ (sha256=${hashes[0].slice(0, 12)})` : runs < 2 ? "（runs<2 跳过）" : "❌"}`);
    summary.push(`${cp}: 计数恒=1 ${countOk ? "✅" : "❌"} / 处置=${spec.expect} ${dispOk ? "✅" : "❌"} / 报告一致 ${same ? "✅" : "❌"}`);
  }

  log("\n══════════════════════════════════");
  log("[总结]");
  for (const s of summary) log(`  - 崩溃点 ${s}`);
  log("  - 副作用计数 = mock 消息队列账本行数（at-least-once 投递的真实副作用；幂等写不计入，因为重复写外部状态收敛）");
  log("  - 恢复报告 = 每步处置 + 副作用计数；sha256 对比证明「同崩溃点各次恢复行为逐字节一致」");
  log(allOk ? `✅ durable 验收通过：${points.length} 崩溃点 × 各 ${runs} 次，副作用计数恒=1` : "❌ 存在未通过的验收项");
  if (!allOk) process.exit(1);
}

main();
