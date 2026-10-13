// 跨会话持久化断言（被 test.mjs --persist 与 demo.mjs 共用，避免两份实现漂移）
//
// 为什么必须换进程：同进程里"重建"比的是同一个对象——等于自己跟自己比（零信息量）。
// 这里用 spawnSync 起两个**独立进程**：① 建库+跑场景+落 JSONL ② 读同一 JSONL 重建后取读数，
// 再与本进程独立跑一遍的结果三方比对。

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, runScenario } from './scenario.mjs';

const here = dirname(fileURLToPath(import.meta.url));

const parseKv = (out) => Object.fromEntries(out.split('\n')
  .map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));

export const sha16 = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

/**
 * 跑完整断言。返回
 *   { ok, facts, checks:[{id,label,ok,note}] }
 * facts.digests / facts.stats 供调用方排版；**不含临时路径与 pid**（保证调用方输出可逐字节复现）。
 */
export function runPersistAssertion() {
  const dir = mkdtempSync(join(tmpdir(), 'memory-redteam-persist-'));
  const journal = join(dir, 'memory.jsonl');
  const check = join(here, 'persist-check.mjs');
  try {
    const w = spawnSync(process.execPath, [check, '--write', journal], { encoding: 'utf8' });
    if (w.status !== 0) {
      return { ok: false, facts: { stats: {} }, checks: [{ id: '①', label: '写入子进程', ok: false, note: `退出码 ${w.status}: ${(w.stderr ?? '').trim() || (w.stdout ?? '').trim()}` }] };
    }
    const wf = parseKv(w.stdout ?? '');
    const v = spawnSync(process.execPath, [check, '--verify', journal], { encoding: 'utf8' });
    if (v.status !== 0) {
      return { ok: false, facts: { stats: {} }, checks: [{ id: '②', label: '重建子进程', ok: false, note: `退出码 ${v.status}: ${(v.stderr ?? '').trim() || (v.stdout ?? '').trim()}` }] };
    }
    const vf = parseKv(v.stdout ?? '');
    const stats = JSON.parse(vf.STATS ?? '{}');
    const local = digest(runScenario().readings); // 第三个独立来源：本进程自己跑一遍
    const recallW = JSON.parse(wf.RECALL_IDS ?? '[]');
    const recallV = JSON.parse(vf.RECALL_IDS ?? '[]');
    const checks = [
      { id: '①', label: '新进程用同一 JSONL 重建 ≡ 写入进程', ok: wf.DIGEST === vf.DIGEST, note: `digest sha256 ${sha16(vf.DIGEST ?? '')} vs ${sha16(wf.DIGEST ?? '')}` },
      { id: '②', label: '新进程重建 ≡ 本进程独立跑一遍', ok: local === vf.DIGEST, note: `digest sha256 ${sha16(local)} vs ${sha16(vf.DIGEST ?? '')}` },
      { id: '③', label: '重放完整性（无坏行 / 条目与审计非空）', ok: stats.corrupt === 0 && stats.items > 0 && stats.audit > 0, note: `${stats.events} 事件 / ${stats.items} 条目 / ${stats.audit} 审计 / ${stats.corrupt} 坏行` },
      { id: '④', label: '两进程读路径召回顺序一致', ok: recallW.join(',') === recallV.join(','), note: JSON.stringify(recallV) },
    ];
    return { ok: checks.every((c) => c.ok), facts: { stats, digests: { write: wf.DIGEST, verify: vf.DIGEST, local } }, checks };
  } finally {
    rmSync(dir, { recursive: true, force: true }); // 临时日志不入输出、不留痕
  }
}
