#!/usr/bin/env node
// 记忆投毒红队回归 —— runner（零依赖，node >= 18 ESM）
//
//   node test.mjs              正跑：所有探针必须守住（退出码 0）
//   node test.mjs --ablate     消融自检：逐条关掉对应防线重跑，探针必须失败
//                              （证明探针确实在测那道防线，而不是恒真断言）
//   node test.mjs --only R3    只跑某一条

import { PROBES } from './src/redteam.mjs';
import { createStore } from './src/memory.mjs';

const argv = process.argv.slice(2);
const ABLATE = argv.includes('--ablate');
const onlyIdx = argv.indexOf('--only');
const ONLY = onlyIdx >= 0 ? argv[onlyIdx + 1] : null;

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', red: '\x1b[31m', cyan: '\x1b[36m', yellow: '\x1b[33m' };
const pad = (s, n) => [...s].length >= n ? s : s + ' '.repeat(n - [...s].length);

function runProbe(probe, overrides = {}) {
  try {
    return probe.run(() => createStore(overrides));
  } catch (err) {
    return { pass: false, detail: `抛异常: ${err?.message ?? err}` };
  }
}

const list = ONLY ? PROBES.filter((p) => p.id === ONLY) : PROBES;
if (list.length === 0) {
  console.error(`未找到探针: ${ONLY}`);
  process.exit(2);
}

console.log(`${C.cyan}记忆投毒红队回归${C.reset} ${C.dim}（编码自 notes/long-term-memory.md S3/S5/S6/S7/S10）${C.reset}`);
console.log(`${C.dim}模式: ${ABLATE ? '消融自检 —— 关掉防线后探针必须失败' : '正跑 —— 所有防线必须守住'}${C.reset}\n`);

let bad = 0;
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
  for (const p of list) {
    if (!p.ablate) {
      console.log(`${C.yellow}－ 跳过${C.reset} ${pad(p.id, 4)} ${p.name} ${C.dim}（机制检查，无对应防线可消融）${C.reset}`);
      continue;
    }
    const offs = Array.isArray(p.ablate) ? p.ablate : [p.ablate];
    const r = runProbe(p, Object.fromEntries(offs.map((k) => [k, false])));
    const sensitive = !r.pass; // 关掉防线后必须失败，才说明探针有效
    if (!sensitive) bad += 1;
    const tag = sensitive ? `${C.green}✓ 敏感${C.reset}` : `${C.red}✗ 恒真${C.reset}`;
    console.log(`${tag} ${pad(p.id, 4)} 关掉 ${C.cyan}${offs.join('+')}${C.reset} → ${sensitive ? '探针如预期失败' : '探针仍然通过（无效探针）'}`);
    console.log(`      ${C.dim}${r.detail}${C.reset}`);
  }
  const withAbl = list.filter((p) => p.ablate).length;
  console.log(`\n${bad === 0 ? C.green : C.red}${withAbl - bad}/${withAbl} 条探针对其防线敏感${C.reset}` +
    (bad === 0 ? '（退出码 0）' : `，${bad} 条恒真（退出码 1）`));
}

process.exit(bad === 0 ? 0 : 1);
