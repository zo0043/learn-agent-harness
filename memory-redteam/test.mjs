#!/usr/bin/env node
// 记忆子系统回归 + 红队 —— runner（零依赖，node >= 18 ESM）
//
//   node test.mjs                正跑：R1-R11（单元级）+ E1-E5（端到端）全部守住 → 退出码 0
//   node test.mjs --ablate       消融自检：逐条关掉该探针声称守住的防线，探针必须失败
//                                （多防线探针**逐层**验证——见下方"为什么逐层"）
//   node test.mjs --persist      追加跨会话持久化断言：子进程写 JSONL → 新进程重建 → 末态读数逐字节一致
//   node test.mjs --only R3      只跑某一条（正跑模式）
//
// 为什么消融要逐层：一条探针同时宣称测三道防线时，"把三道一起关掉探针就失败"什么都证明不了——
// 可能只有一道在起作用、另外两道是摆设。逐层关（每次只关一道）才等价于"每一道都是承重的"。
// 本仓库用这个更严的口径实测抓到三处真缺陷（原 R5 探针测的其实是删除判定、原 R9 的审计断言与防线耦合、
// 原 R7 宣称的 ttlWindow 从未被触发）——细节见 README「消融自检抓到的真缺陷」。

import { PROBES, E2E_PROBES } from './src/redteam.mjs';
import { createStore } from './src/memory.mjs';
import { runPersistAssertion } from './src/persist-run.mjs';

const argv = process.argv.slice(2);
const ABLATE = argv.includes('--ablate');
const PERSIST = argv.includes('--persist');
const onlyIdx = argv.indexOf('--only');
const ONLY = onlyIdx >= 0 ? argv[onlyIdx + 1] : null;

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', red: '\x1b[31m', cyan: '\x1b[36m', yellow: '\x1b[33m' };
const pad = (s, n) => [...s].length >= n ? s : s + ' '.repeat(n - [...s].length);
let bad = 0;
const fail = (msg) => { console.log(`${C.red}✗ ${msg}${C.reset}`); bad += 1; };

// 探针契约：run(makeStore, overrides)
//   makeStore(extra) → 一个建库函数（单元级探针用）
//   overrides        → 本次运行的防线开关（端到端探针用它驱动整场景）
function runProbe(probe, overrides = {}) {
  try {
    return probe.run((extra = {}) => createStore({ ...overrides, ...extra }), overrides);
  } catch (err) {
    return { pass: false, detail: `抛异常: ${err?.message ?? err}` };
  }
}

const ALL = [...PROBES, ...E2E_PROBES];
const list = ONLY ? ALL.filter((p) => p.id === ONLY) : ALL;
if (list.length === 0) {
  console.error(`未找到探针: ${ONLY}`);
  process.exit(2);
}

console.log(`${C.cyan}记忆子系统回归 + 红队${C.reset} ${C.dim}（编码自 notes/long-term-memory.md §S3/S4/S5/S6/S7/S10）${C.reset}`);
console.log(`${C.dim}单元级 R1-R11 ${PROBES.length} 条 + 端到端 E1-E5 ${E2E_PROBES.length} 条${C.reset}`);
console.log(`${C.dim}模式: ${ABLATE ? '消融自检 —— 逐层关掉防线后探针必须失败' : '正跑 —— 所有防线必须守住'}${C.reset}\n`);

if (!ABLATE) {
  for (const p of list) {
    const r = runProbe(p);
    if (!r.pass) bad += 1;
    const tag = r.pass ? `${C.green}✓ 守住${C.reset}` : `${C.red}✗ 击穿${C.reset}`;
    console.log(`${tag} ${pad(p.id, 4)} ${p.name}`);
    console.log(`      ${C.dim}${r.detail}${C.reset}`);
    console.log(`      ${C.dim}来源: ${p.source}${C.reset}`);
  }
  console.log(`\n${bad === 0 ? C.green : C.red}${list.length - bad}/${list.length} 条探针守住${C.reset}` +
    (bad === 0 ? '（退出码 0）' : `，${bad} 条被击穿（退出码 1）`));
} else {
  const ablatable = list.filter((p) => p.ablate);
  let layers = 0;
  let sensitiveLayers = 0;
  for (const p of ablatable) {
    const offs = Array.isArray(p.ablate) ? p.ablate : [p.ablate];
    const isMulti = offs.length > 1;
    let probeSensitive = true;
    for (const layer of offs) {
      const r = runProbe(p, { [layer]: false });
      const sensitive = !r.pass; // 关掉防线后必须失败，才说明这条探针真的在测它
      layers += 1;
      if (sensitive) sensitiveLayers += 1; else { bad += 1; probeSensitive = false; }
      const tag = sensitive ? `${C.green}✓ 敏感${C.reset}` : `${C.red}✗ 恒真${C.reset}`;
      console.log(`${tag} ${pad(p.id, 4)} 关掉 ${C.cyan}${layer}${C.reset} → ${sensitive ? '探针如预期失败' : '探针仍然通过（该层是摆设）'}`);
      console.log(`      ${C.dim}${r.detail}${C.reset}`);
    }
    if (isMulti) {
      console.log(`      ${probeSensitive ? C.green : C.red}↳ ${p.id} 宣称的 ${offs.length} 道防线逐层验证：${probeSensitive ? '全部承重' : '存在摆设'}${C.reset}`);
    }
  }
  for (const p of list) {
    if (!p.ablate) console.log(`${C.yellow}－ 跳过${C.reset} ${pad(p.id, 4)} ${p.name} ${C.dim}（机制检查，无对应防线可消融）${C.reset}`);
  }
  console.log(`\n${bad === 0 ? C.green : C.red}${ablatable.length}/${ablatable.length} 条探针对其防线敏感${C.reset}` +
    `${C.dim}（逐层验证 ${sensitiveLayers}/${layers} 层：多防线探针每次只关一道，每道都必须承重）${C.reset}` +
    (bad === 0 ? '（退出码 0）' : `，${bad} 层恒真（退出码 1）`));
}

if (PERSIST) {
  bad += runPersistCheck();
}

process.exit(bad === 0 ? 0 : 1);

/**
 * 跨会话持久化断言：子进程写 JSONL → 新进程重建 → 三方 digest 比对。
 * 逻辑在 src/persist-run.mjs（与 demo.mjs 共用同一份，避免两份实现漂移）。
 */
function runPersistCheck() {
  console.log(`\n${C.cyan}跨会话持久化${C.reset} ${C.dim}（子进程写 JSONL → 新进程重建 → 末态读数逐字节比对）${C.reset}`);
  const { ok, facts, checks } = runPersistAssertion();
  const stats = facts.stats ?? {};
  if (stats.events) {
    console.log(`      ${C.dim}日志=${stats.events} 事件 / ${stats.items} 条目 / ${stats.audit} 审计 / ${stats.corrupt} 坏行（临时日志已清理，路径与 pid 不入输出以保证可逐字节复现）${C.reset}`);
  }
  for (const c of checks) {
    console.log(`      ${c.ok ? C.green : C.red}${c.id} ${c.label}：${c.ok}${C.reset}`);
    console.log(`         ${C.dim}${c.note}${C.reset}`);
  }
  console.log(ok
    ? `${C.green}✓ 持久化断言通过${C.reset}：新进程用同一 JSONL 重建后，注入集/一致性/污染率/墓碑/召回结果逐字节一致`
    : `${C.red}✗ 持久化断言失败${C.reset}`);
  return ok ? 0 : 1;
}
