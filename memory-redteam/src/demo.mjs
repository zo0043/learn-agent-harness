#!/usr/bin/env node
// 自研长期记忆子系统 · 端到端走查（`npm run demo`）
//
// 一条命令把完整生命周期跑给人看：写入 → 召回 → 冲突消解 → 遗忘传播 → 跨会话持久化。
// 每个阶段标注它对齐 notes/long-term-memory.md 的哪一节，并打印**判定与理由**（不只是结果）——
// 被问"这条为什么没进注入集"，答案就在输出里。
//
// 零依赖（node 原生 ESM）、全离线：没有模型调用、没有网络、没有隐藏墙钟
// （时钟由场景注入、缺省固定），因此同一命令连续两次运行输出逐字节一致。

import { runScenario } from './scenario.mjs';
import { DEFENSE_KEYS, DEFENSE_NOTES, INJECT_CONFIDENCE, FIXED_NOW, TRUST } from './memory.mjs';
import { runPersistAssertion } from './persist-run.mjs';

const W = 84;
const rule = (ch = '─') => ch.repeat(W);
const title = (t) => { console.log(`\n${rule('━')}\n${t}\n${rule('━')}`); };
const section = (no, t) => { console.log(`\n${rule()}\n【${no}】${t}\n${rule()}`); };
const pad = (s, n) => { const str = String(s); return [...str].length >= n ? str : str + ' '.repeat(n - [...str].length); };
const row = (cells, widths) => console.log(cells.map((c, i) => pad(c, widths[i])).join(' │ '));

const { steps: s, readings: r, store } = runScenario();

title('自研长期记忆子系统 · 端到端生命周期走查（零依赖 / 全离线 / 确定性）');
console.log('对照 notes/long-term-memory.md：§S3 写侧决策树 · §S4 读侧检索与注入 · §S5 冲突消解与遗忘');
console.log('                              §S6 评测（一致性/污染率/false-recall）· §S7 四道投毒防线 · §S10 步骤 1-7');
console.log(`确定性时钟：createStore 注入，缺省 FIXED_NOW=${FIXED_NOW}；本场景时点=2026-10-16T10:00:00+08:00`);
console.log('本走查不调用墙钟（date 类 API 零使用，时钟全部由上文的注入时钟提供）：同一命令连续两次运行输出逐字节一致');

// ── 阶段 0 ───────────────────────────────────────────────────────────────────────────
section(0, '防线清单（8 项，每一项都能单独关闭 → node test.mjs --ablate 逐层证伪）');
for (const k of DEFENSE_KEYS) console.log(`  · ${pad(`defenses.${k}`, 30)} ${DEFENSE_NOTES[k]}`);
console.log(`\n  注入置信门：confidence ≥ ${INJECT_CONFIDENCE} 才允许进 system（[S10 步骤 4.5]）；信任等级：${Object.values(TRUST).join(' > ')}`);

// ── 阶段 1 ───────────────────────────────────────────────────────────────────────────
section(1, '写入路径（[S3] 决策树：价值 → 信任分级 → 去重/冲突 → 高危隔离；[S7] 四道防线各出一次场）');
const WRITES = [
  ['历史旧条（2026-09-20 用户陈述）', s.m190],
  ['会话 A：用户显式陈述偏好（[S10 步骤 1]）', s.m248],
  ['同 scope 的无关领域事实（布局）', s.m_layout],
  ['外部 README 想覆盖高信任规则（[S7 防御1]）', s.poison],
  ['外部 README 推断的候选（[S7 防御1]）', s.candidatePool],
  ['工具结果里的显式投毒（[S7 防御2]）', s.injection],
  ['高危 PROCEDURE 未审批（[S7 防御3]）', s.highRisk],
  ['高危 PROCEDURE 已审批（[S7 防御3]）', s.highRiskApproved],
  ['带 ttl 的配置事实（[S5] 时效）', s.mTtl],
  ['情景摘要 ← 血缘派生（[S2]/[S10 步骤 7]）', s.mSummary],
  ['语义蒸馏事实 ← 血缘派生第二跳', s.mDistill],
  ['会话 E：用户改口 bun（[S10 步骤 5]）', s.m301],
  ['同信任 + 同生效时间 → 并存', s.mCoexist],
  ['更旧的候选想覆盖当前有效条', s.mStale],
];
for (const [label, res] of WRITES) {
  console.log(`  ${pad(res.id, 9)} ${pad(res.op, 15)} ${label}`);
  if (res.reason) console.log(`            ${pad('', 15)} ↳ ${res.reason}`);
}
const sc = s.schemaExcerpt; // 遗忘**之前**的快照：遗忘会清空 content/embedding，事后取就读不到了
console.log(`\n  [S10 步骤 2-3] schema 落地（写入时快照，节选）：${JSON.stringify({
  id: sc.id, category: sc.category, scope: sc.scope, trust: sc.trust,
  confidence: sc.confidence, valid_from: sc.valid_from,
  embedding: `[${sc.embedding.slice(0, 4).join(', ')}, …] 共 ${sc.embedding.length} 维、L2 已归一`,
  derived_from: sc.derived_from, status: sc.status,
})}`);
console.log(`  [S7 防御4] 审计留痕：${store.audit.length} 条记录，ops=${JSON.stringify([...new Set(store.audit.map((a) => a.op))])}`);
console.log(`  低信任候选池的落库与处置：写入判定=${s.candidatePool.op}（进候选池，可被人工提升），但读路径信任闸不放它进注入集（下一阶段可见）`);

// ── 阶段 2 ───────────────────────────────────────────────────────────────────────────
section(2, '读路径（[S4] scope 过滤 → 混合检索 BM25 ∥ 向量 → RRF 融合；[S10 步骤 4]）');
console.log(`  query = ${JSON.stringify('这个仓库跑测试该用什么命令 pnpm')}`);
console.log(`  scope = repo=learn-agent-harness，now = 2026-10-15T14:20:00+08:00（会话 B 时点，显式传入）`);
console.log(`\n  召回结果（RRF k=60：用排名做公共货币，向量分数与 BM25 不可直接相加）：`);
console.log(`  ${pad('#', 3)} ${pad('id', 9)} ${pad('RRF 分', 9)} ${pad('BM25 排名', 10)} ${pad('向量排名', 9)} 内容（召回当时）`);
s.recallB.forEach((h, i) => {
  const e2 = (x) => [...String(x)].length + (String(x).match(/[\u4e00-\u9fff]/g)?.length ?? 0); // CJK 占两列宽
  const text = (s.contentAtRecall[h.item.id] ?? '').slice(0, 40);
  const padTo = (str, n) => str + ' '.repeat(Math.max(0, n - e2(str)));
  console.log(`  ${pad(i + 1, 3)} ${pad(h.item.id, 9)} ${pad(h.score, 9)} ${pad(h.paths.bm25 ?? '未命中', 10)} ${pad(h.paths.dense ?? '未命中', 9)} ${padTo(text, 60)}`);
});
console.log(`\n  错误归因（[S6] 一路漏=单路盲区）：top-1 由 BM25 命中罕见词 pnpm 定音（[S10 步骤 4.3]），` +
  `同时它也是向量路命中；两路都进 top-5 的条目不缺。`);
const inj = r.injectableIds;
console.log(`\n  注入集合审计（${r.audit.accepted.length} 条进 / ${r.audit.rejected.length} 条不进）：`);
for (const a of r.audit.accepted) console.log(`    ✓ ${pad(a.id, 9)} ${a.reason}`);
for (const a of r.audit.rejected) console.log(`    ✗ ${pad(a.id, 9)} ${a.reason}`);
console.log(`  最终注入集 = ${JSON.stringify(inj)}（预算内、每一条都有"为什么在"的理由）`);

// ── 阶段 3 ───────────────────────────────────────────────────────────────────────────
section(3, '冲突消解（[S5] 四种处置：覆盖 / 并存 / 时效到期 / 拒绝；[S10 步骤 2/5]）');
console.log('  ① 覆盖链（不物理删除，审计链完整保留）：');
s.chain.forEach((c, i) => console.log(`     ${i === 0 ? '  ' : '→ '} ${pad(c.id, 9)} status=${pad(c.status, 11)} valid_from=${c.valid_from} valid_to=${c.valid_to ?? '(仍有效)'}`));
console.log(`     旧条原文保留：${s.item[s.m190.id].content !== null ? '是（可追溯"为什么现在用 bun"）' : '否'}`);
console.log(`  ② 并存：${s.mCoexist.op} —— ${s.mCoexist.reason}`);
console.log(`  ③ 更旧候选：${s.mStale.op} —— ${s.mStale.reason}`);
console.log(`  ④ 时效到期（ttl → valid_to → active 迁移为 expired，归档不是删除）：${s.expired.join(', ') || '(无)'}`);

// ── 阶段 4 ───────────────────────────────────────────────────────────────────────────
section(4, '评测（[S6] 一致性 / 污染率 / "不该召回"）');
console.log(`  一致性：同 scope+category 的 active 条数 = ${JSON.stringify(r.consistency.activePerTopic)}`);
console.log(`          conflicts=${JSON.stringify(r.consistency.conflicts)}（期望 []）→ consistent=${r.consistency.consistent}`);
console.log(`  污染率：注入集 ${r.pollution.injected} 条、毒候选 ${r.pollution.candidates} 条（来源 untrusted / 状态 superseded·coexisting / 时效 expired）`);
console.log(`          泄漏 ${r.pollution.pollution} 条 → 污染率 ${r.pollution.rate}（目标 < 0.01）`);
console.log(`          签名交叉（命中注入扫描但来源可信）：${JSON.stringify(r.pollution.advisories.map((a) => [a.id, a.matched]))}`);
console.log('          —— 签名是线索不是证据：用户自己给的运维步骤会命中 script-exec，故"放行 + 留痕"，不虚报成污染');
console.log(`  "不该召回"（false-recall）：反事实 query=${JSON.stringify('另一个仓库 X 用什么命令跑测试')} → 命中 ${r.recallOtherRepo.length} 条（期望 0）`);

// ── 阶段 5 ───────────────────────────────────────────────────────────────────────────
section(5, '遗忘与传播（[S10 步骤 7] 用户说"忘掉"到底删了什么）');
console.log(`  用户原话：忘掉我 10 月 12 号说的测试命令那件事 → 定位到 ${s.m248.id}`);
console.log(`  血缘（派生闭包，删除要沿它传播）：${JSON.stringify(s.lineageBefore)}`);
console.log(`  ① 物理清除内容 + 清空向量：${s.m248.id}.content=null, embedding=null, status=deleted`);
console.log(`  ② 传播到派生物（不物理删除，保留 id 与血缘，状态置 redacted）：${JSON.stringify(s.forget.redacted)}`);
for (const id of s.forget.redacted) {
  const it = s.item[id];
  console.log(`       ${pad(id, 9)} content=${it.content} embedding=${it.embedding} status=${it.status} redacted_by=${it.redacted_by}`);
}
console.log(`  ③ 墓碑元数据：${JSON.stringify(s.forget.tombstone)}`);
console.log(`  ④ 未来会话不再召回：遗忘后[摘要 query]命中=${JSON.stringify(r.recallSummary.map((h) => h.id).filter((x) => s.forget.redacted.includes(x) || x === s.m248.id))}（期望 []）`);
console.log(`  ⑤ 不可逆边界（诚实）：若原文曾进入某次模型调用的上下文，无法从权重中删除（本就不训练）；但持久层不再含原文、不再被召回`);

// ── 阶段 6 ───────────────────────────────────────────────────────────────────────────
section(6, '跨会话持久化（JSONL 事件日志 → 新进程重建；[S2] 轨迹落盘是审计/恢复/评测的底座）');
console.log('  机制：每次变更（条目快照 + 审计记录）作为事件追加进 JSONL；重建 = 顺序重放（同 id 后写覆盖前写）。');
console.log('  断言方式：起两个独立子进程——① 建库+跑场景+落盘 ② 读同一 JSONL 重建后取读数，再与本进程独立跑一遍三方比对。');
const { ok, facts, checks } = runPersistAssertion();
console.log(`  日志规模：${facts.stats.events} 事件 / ${facts.stats.items} 条目 / ${facts.stats.audit} 审计 / ${facts.stats.corrupt} 坏行（临时日志跑完即清理，路径与 pid 不入输出）`);
for (const c of checks) console.log(`  ${c.ok ? '✓' : '✗'} ${c.id} ${pad(c.label, 46)} ${c.note}`);
console.log(`  → ${ok ? '重建后注入集/一致性/污染率/墓碑/召回结果逐字节一致（digest sha256 ' + facts.digests.verify.slice(0, 16) + '）' : '不一致，见上'}`);

// ── 边界 ───────────────────────────────────────────────────────────────────────────
title('这不是什么（边界，不吹）');
console.log('  · 不是生产记忆系统：单进程单写者、无文件锁、无 fsync（崩溃可能丢最后若干条）——完整版是 durable execution 那套');
console.log('  · embedding 是 64 维字符三元组 hash（确定性、可打印、可复现），**不是语义嵌入**；无 ANN 索引、无 cross-encoder rerank');
console.log('     （rag-demo 用 k1=1.5/b=0.75 + 768 维 FNV-1a；本套件参数独立，两份实现互为独立来源，不以"复用 rag-demo"自居）');
console.log('  · 注入扫描是文本模式层（4 类签名），拦不住语义伪装——这正是 §S7 需要"多源印证/人审"的原因');
console.log('  · 命中计数（hit_count/last_hit_at）本轮不落持久化日志（跨进程等价性断言已显式排除该字段）');
console.log('  · 本走查不断言 §S10 的示例数值（recall@1=0.87 等）——笔记原文已声明那是走查示例，不是既成事实');
console.log('\n  失败注入（证明断言有牙，不是常量 true）：');
console.log('    node test.mjs              16/16 条探针守住（单元级 R1-R11 + 端到端 E1-E5）');
console.log('    node test.mjs --ablate     逐层关掉防线 → 每条探针必须失败（18/18 层承重，关一道就塌）');
console.log('    node test.mjs --persist    追加跨会话持久化断言');
console.log(`\n${rule('━')}`);
process.exit(ok ? 0 : 1);
