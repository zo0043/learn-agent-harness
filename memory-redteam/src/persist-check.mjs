#!/usr/bin/env node
// 跨会话持久化断言 —— **新进程**用同一份 JSONL 重建后，末态读数必须与进程内逐字节一致
//
// 为什么必须换进程：同进程里"重建"很容易变成假验证——内存里的对象还在，
// 重建出来的是同一个引用，比的是自己跟自己（这正是全局纪律第 6 条"拿安装器产物跟安装器产物比 = 零信息量"）。
//
// 用法（test.mjs --persist 会以子进程方式调用本文件两遍）：
//   node src/persist-check.mjs --write <file>     建库 + 跑场景 + 落盘，打印进程内 digest
//   node src/persist-check.mjs --verify <file>    新进程：读 JSONL 重建 + 只跑只读读数，打印重建后 digest
// 退出码：0 = 通过；1 = 不一致/日志损坏；（--write 的"通过"仅表示写出成功）
//
// 诚实边界：digest **不含** hit_count / last_hit_at（读路径回写的命中信号本轮不落持久化日志，见 persist.mjs）。

import { runScenario, digest, finalReadings, REPO, NOW_SESSION_B, SCENARIO_NOW, Q_TEST } from './scenario.mjs';
import { createJsonlSink, rebuildFromJournal, resetJournal } from './persist.mjs';
import { recall } from './memory.mjs';

const argv = process.argv.slice(2);
const mode = argv[0];
const file = argv[1];
if (!['--write', '--verify'].includes(mode) || !file) {
  console.error('用法: node src/persist-check.mjs --write|--verify <journal.jsonl>');
  process.exit(2);
}

if (mode === '--write') {
  resetJournal(file, SCENARIO_NOW);
  const sink = createJsonlSink(file);
  const { store, readings } = runScenario({ sink });
  const n = sink.flush();
  // 召回 id 单独一行输出（runner 比对新进程重跑读路径的顺序）
  const ids = recall(store, Q_TEST, { repo: REPO, now: NOW_SESSION_B, k: 5 }).map((h) => h.item.id);
  const meta = { events: n + 1, items: store.items.length, audit: store.audit.length, corrupt: 0 };
  console.log(`STATS=${JSON.stringify(meta)}`);
  console.log(`RECALL_IDS=${JSON.stringify(ids)}`);
  console.log(`DIGEST=${digest(readings)}`);
  process.exit(0);
}

// --verify：全新进程 ────────────────────────────────────────────────────────────────
const { store, meta } = rebuildFromJournal(file);
const readings = finalReadings(store, { now: NOW_SESSION_B, repo: REPO });
const ids = recall(store, Q_TEST, { repo: REPO, now: NOW_SESSION_B, k: 5 }).map((h) => h.item.id);
console.log(`STATS=${JSON.stringify({ events: meta.events, items: meta.items, audit: meta.audit, corrupt: meta.corrupt })}`);
console.log(`RECALL_IDS=${JSON.stringify(ids)}`);
console.log(`DIGEST=${digest(readings)}`);
process.exit(meta.corrupt === 0 ? 0 : 1);
