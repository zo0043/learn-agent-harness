// 自研跨会话记忆子系统 —— 写 / 读 / 遗忘三路径的可运行实现（零依赖，node >= 18，ESM）
//
// 与 notes/long-term-memory.md 的逐条对齐（代码内以 [Sx] 标注节号，笔记侧见 §S7 回归框的映射表）：
//   [S3] 写侧决策树：价值 → 信任分级 → 去重/冲突 → 高危隔离；schema 含 category/scope/time/confidence/ttl/derived_from
//   [S4] 读侧注入：scope 过滤 → 混合检索（BM25 词法/IDF ∥ hash embedding → RRF）→ 置信门 0.8 → 注入预算
//   [S5] 冲突消解状态机：active / superseded / coexisting / expired / rejected；时效窗口（ttl → valid_to）
//   [S6] 评测口径：一致性（同 scope+category 的 active 唯一）、污染率、false-recall（反事实探针）
//   [S7] 记忆投毒四道防线：① 写侧信任分级 ② 内容注入扫描 ③ 高危独立审批 ④ 审计留痕
//   [S10] 步骤 1-7 完整生命周期：写入 → 召回 → 冲突消解 → 评测 → 遗忘（硬删 + 墓碑 + 沿血缘传播）
//
// 每一道防线都能单独关闭（createStore(overrides)），供 `node test.mjs --ablate` 消融自检——
// 关掉防线探针**必须失败**，否则说明该探针是恒真断言、零信息量。
//
// 确定性（合约要求）：时钟由调用方注入，缺省固定 FIXED_NOW；本文件**不含任何 new Date()/Date.now()**。
// 跨会话持久化：createStore(…, { sink }) 会把每次变更（条目快照 + 审计记录）以事件形式交给 sink，
// 由 persist.mjs 写成 JSONL；新进程用 hydrate() 重放同一 JSONL 即可重建等价状态。

import { bm25Rank, denseRank, embed, rrfFuse, tokenize } from './retrieval.mjs';

export const TRUST = Object.freeze({
  USER: 'user_confirmed',
  INFERRED: 'inferred',
  UNTRUSTED: 'untrusted',
});

/** [S10 步骤 4.5] 注入置信门：confidence ≥ 0.8 才进 system */
export const INJECT_CONFIDENCE = 0.8;
/** 确定性基准时钟：[S10] 走查的场景时间（2026-10-12）。回归输出必须可逐字节复现 */
export const FIXED_NOW = '2026-10-12T12:00:00+08:00';
/** [S7 防御3] 高危事实（要执行 / 要凭据 / 要外发）= 程序记忆级管控 */
export const HIGH_RISK_CATEGORIES = Object.freeze(new Set(['PROCEDURE', 'CREDENTIALS', 'EGRESS']));

/** [S7 防御2] 记忆内容注入扫描（与 MCP 与供应链安全 §S4 工具结果注入同一套检测） */
const SCAN_PATTERNS = [
  { id: 'remote-fetch', re: /(?:^|\s)(?:curl|wget)\s+https?:\/\//i },
  { id: 'script-exec', re: /(?:执行|运行|run|execute)\s*[`'"]?[^\s`'"]*\.(?:sh|bat|ps1)/i },
  { id: 'credential', re: /(?:token|api[_-]?key|secret|password)\s*[:=]/i },
  { id: 'instruction-override', re: /(?:忽略|无视|ignore)\s*(?:之前|以上|先前|previous|above|prior)/i },
];

/** 可开关的防线清单（--ablate 的消融对象；每一项都对应 notes 的一节判定） */
export const DEFENSE_KEYS = Object.freeze([
  'trustGate',         // [S7.1] 低信任候选不得自动注入 / 不得覆盖高信任
  'injectionScan',     // [S7.2] 内容注入扫描
  'highRiskApproval',  // [S7.3] 高危事实独立审批
  'auditTrail',        // [S7.4] 写入留痕（含血缘）
  'conflictResolve',   // [S5]   同 scope/category 的冲突消解状态机
  'scopeFilter',       // [S4]   scope 过滤（反事实探针依赖）
  'ttlWindow',         // [S5]   时效窗口（过期条不进注入集）
  'forgetPropagation', // [S10.7] 删除沿血缘传播到派生物
]);

/**
 * 建库。
 * @param overrides  防线开关（{ trustGate:false, … }）或 { clock: () => iso }
 * @param options    { sink } —— 持久化事件出口（见 persist.mjs）
 */
export function createStore(overrides = {}, options = {}) {
  const defenses = Object.fromEntries(DEFENSE_KEYS.map((k) => [k, true]));
  for (const [k, v] of Object.entries(overrides)) {
    if (k === 'clock') continue; // 时钟不是防线
    if (!DEFENSE_KEYS.includes(k)) throw new Error(`未知防线: ${k}`);
    defenses[k] = v;
  }
  const store = {
    defenses,
    items: [],
    audit: [],
    // 确定性：[S10] 时钟由调用方注入，缺省固定基准时间——否则 new Date() 会让同一回归两次运行输出不同。
    clock: overrides.clock ?? (() => FIXED_NOW),
    seq: 0,
    sink: options.sink ?? null,
    nextId: () => `mem#${100 + ++store.seq * 74}`, // [S3] schema id：稳定可引用可删（走查里的 mem#248 量级）
  };
  return store;
}

/** 从 JSONL 事件流重建状态（persist.mjs 调它；不在写路径上） */
export function hydrate(store, { items = [], audit = [] } = {}) {
  store.items = items;
  store.audit = audit;
  const maxId = items.reduce((m, it) => Math.max(m, Number(String(it.id).replace(/^mem#/, '')) || 0), 0);
  store.seq = maxId >= 174 ? Math.round((maxId - 100) / 74) : 0; // 继续编号，不漏不重
  return store;
}

/** 条目快照（持久化 / 摘要用；显式列字段，避免运行时字段漂移进 JSONL） */
export function snapshotItem(it) {
  return {
    id: it.id,
    content: it.content,
    category: it.category,
    scope: { repo: it.scope?.repo ?? null, user: it.scope?.user ?? null },
    source_session: it.source_session ?? null,
    source_turns: [...(it.source_turns ?? [])],
    created_at: it.created_at,
    valid_from: it.valid_from,
    valid_to: it.valid_to ?? null,
    ttl: it.ttl ?? null,
    confidence: it.confidence,
    trust: it.trust,
    approved: Boolean(it.approved),
    status: it.status,
    derived_from: it.derived_from ?? null,
    embedding: it.embedding ? [...it.embedding] : null,
    superseded_by: it.superseded_by ?? null,
    deleted_at: it.deleted_at ?? null,
    deletion_reason: it.deletion_reason ?? null,
    redacted_by: it.redacted_by ?? null,
    last_hit_at: it.last_hit_at ?? null,
    hit_count: it.hit_count ?? 0,
    probe_origin: it.probe_origin ?? null,
  };
}

function emitItem(store, it) {
  if (store.sink) store.sink.push({ t: 'item', item: snapshotItem(it) });
}

// [S7 防御4] 审计留痕：哪条轨迹触发的、判定结果是什么。关掉它 write/forget 仍工作但无留痕。
function audit(store, op, payload) {
  if (!store.defenses.auditTrail) return;
  const rec = { op, at: payload.at ?? null, ...payload };
  store.audit.push(rec);
  if (store.sink) store.sink.push({ t: 'audit', rec });
}

/** [S7 防御2] 的实际检测；返回命中的模式 id 列表 */
export function scanContent(content) {
  return SCAN_PATTERNS.filter((p) => p.re.test(String(content))).map((p) => p.id);
}

/**
 * [S3] 写侧入口：走决策树（价值 → 信任 → 去重/冲突 → 高危隔离）。
 * candidate = { content, category, scope:{repo,user}, source_session, source_turns, triggered_by,
 *               confidence, trust, valid_from, valid_to?, ttl?, approved?, derived_from?, probe_origin? }
 * 返回 { op, id, reason, flags? }，op ∈ accepted | superseded | coexisting | rejected | pending_approval
 */
export function write(store, candidate) {
  // 确定性：不取墙钟；缺省用注入时钟（缺省 FIXED_NOW）
  const at = candidate.valid_from ?? store.clock();
  const id = store.nextId();
  const flags = scanContent(candidate.content);

  // [S7 防御2] 命中签名但来源是用户确认：**不**自动判毒（签名 ≠ 证据），放行但留审计痕迹——
  // 否则"用户自己给的运维步骤"会被静默拒绝，而"审批过的步骤从此不再被扫描"又会变成盲区。
  if (flags.length > 0 && candidate.trust === TRUST.USER) {
    audit(store, 'advisory', { id, actor: `source:${candidate.source_session}`, triggered_by: candidate.triggered_by, result: 'accepted_with_warning', reason: `用户来源内容命中注入扫描签名: ${flags.join(',')}（放行 + 留痕，待多源印证）` });
  }

  // [S7 防御2] 内容注入扫描（低信任内容命中即降级；此处直接判 rejected 并留痕）
  if (store.defenses.injectionScan && flags.length > 0 && candidate.trust !== TRUST.USER) {
    audit(store, 'write', { id, actor: `source:${candidate.source_session}`, triggered_by: candidate.triggered_by, result: 'rejected', reason: `注入扫描命中: ${flags.join(',')}` });
    return { op: 'rejected', id, reason: `注入扫描命中: ${flags.join(',')}`, flags };
  }

  // [S7 防御3] 高危事实独立审批（要执行 / 要凭据 / 要外发）
  const highRisk = HIGH_RISK_CATEGORIES.has(candidate.category);
  if (store.defenses.highRiskApproval && highRisk && !candidate.approved) {
    audit(store, 'write', { id, actor: `source:${candidate.source_session}`, triggered_by: candidate.triggered_by, result: 'pending_approval', reason: `高危类别 ${candidate.category} 未审批` });
    return { op: 'pending_approval', id, reason: `高危类别 ${candidate.category} 未审批`, flags };
  }

  // [S5] 同 scope + category 的既有 active 条 → 冲突判定
  const existing = store.defenses.conflictResolve ? findConflict(store, candidate) : undefined;
  if (existing) {
    const decision = conflictDecision(existing, candidate, store.defenses.trustGate);

    if (decision === 'reject-lower-trust') {
      audit(store, 'write', { id, actor: `source:${candidate.source_session}`, triggered_by: candidate.triggered_by, result: 'rejected', reason: `低信任(${candidate.trust})不得覆盖高信任(${existing.trust})` });
      return { op: 'rejected', id, reason: `低信任(${candidate.trust})不得覆盖高信任(${existing.trust})`, flags };
    }
    if (decision === 'reject-stale') {
      // [S5] 更旧的候选不得把当前有效条顶掉——否则"半年前的一次性偏好"会盖掉当前偏好
      audit(store, 'write', { id, actor: `source:${candidate.source_session}`, triggered_by: candidate.triggered_by, result: 'rejected', reason: `陈旧候选 valid_from(${at}) 早于当前有效条(${existing.valid_from})` });
      return { op: 'rejected', id, reason: `陈旧候选 valid_from(${at}) 早于当前有效条(${existing.valid_from})，不得覆盖`, flags };
    }
    if (decision === 'coexisting') {
      // [S5] 同信任 + 无时间优势 → 并存（带时间戳）；coexisting 不是 active，不进注入集
      const item = materialize(id, candidate, at, 'coexisting');
      store.items.push(item);
      emitItem(store, item);
      audit(store, 'coexist', { id, with: existing.id, triggered_by: candidate.triggered_by, reason: '同信任 + 同 valid_from，无时间优势 → 并存待证据裁决' });
      return { op: 'coexisting', id, coexistsWith: existing.id, reason: '同信任 + 无时间优势 → 并存（带时间戳，触发澄清而非硬选）', flags };
    }

    // decision === 'supersede'：[S10 步骤 2/5] 覆盖不物理删除，保留审计链
    const item = materialize(id, candidate, at, 'active');
    existing.status = 'superseded';
    existing.superseded_by = id;
    existing.valid_to = candidate.valid_from ?? at;
    store.items.push(item);
    emitItem(store, existing);
    emitItem(store, item);
    audit(store, 'supersede', { from: existing.id, to: id, triggered_by: candidate.triggered_by });
    return { op: 'superseded', id, supersededId: existing.id, reason: '来源信任不低 + 更新生效时间 → 覆盖（不物理删除，保留审计链）', flags };
  }

  const item = materialize(id, candidate, at, 'active');
  store.items.push(item);
  emitItem(store, item);
  audit(store, 'write', { id, actor: `source:${candidate.source_session}`, triggered_by: candidate.triggered_by, result: 'accepted' });
  return { op: 'accepted', id, flags };
}

/** [S5] 冲突判定矩阵：信任优先，其次时间；无时间优势 → 并存；更旧 → 拒绝 */
function conflictDecision(existing, candidate, trustGateOn) {
  const rc = rank(candidate.trust);
  const re = rank(existing.trust);
  if (trustGateOn && rc < re) return 'reject-lower-trust';
  if (rc > re) return 'supersede'; // 更高信任直接覆盖（[S7.1]：确认过的偏好更新自动抽取的旧条）
  const cv = candidate.valid_from ?? '';
  const ev = existing.valid_from ?? '';
  if (cv > ev) return 'supersede';
  if (cv === ev) return 'coexisting';
  return 'reject-stale';
}

function findConflict(store, candidate) {
  return store.items.find((it) => it.status === 'active' && it.category === candidate.category &&
    sameScope(it.scope, candidate.scope));
}

function materialize(id, c, at, status) {
  return {
    id,
    content: c.content,
    category: c.category,
    scope: { repo: c.scope?.repo ?? null, user: c.scope?.user ?? null },
    source_session: c.source_session ?? null,
    source_turns: c.source_turns ?? [],
    created_at: at,
    valid_from: c.valid_from ?? at,
    // [S5] 时效窗口：显式 valid_to 优先；否则由 ttl（失效时间）推导——"会过期的事实带 TTL"
    valid_to: c.valid_to ?? (c.ttl ? String(c.ttl) : null),
    ttl: c.ttl ?? null,
    confidence: c.confidence ?? 0,
    trust: c.trust,
    approved: Boolean(c.approved),
    status,
    derived_from: c.derived_from ?? null,
    embedding: embed(c.content ?? ''), // [S10 步骤 3] embedding 是一等字段（删除时须清空，见 forget）
    superseded_by: null,
    deleted_at: null,
    deletion_reason: null,
    redacted_by: null,
    last_hit_at: null,
    hit_count: 0,
    probe_origin: c.probe_origin ?? null,
  };
}

const rank = (t) => ({ untrusted: 0, inferred: 1, user_confirmed: 2 }[t] ?? -1);

/** scope 相等判定：缺省字段统一按 null 比较（缺失 ≠ 其他值，否则冲突检测会静默失效） */
const sameScope = (a = {}, b = {}) => (a.repo ?? null) === (b.repo ?? null) && (a.user ?? null) === (b.user ?? null);

/**
 * [S4] 读侧：可注入集合（scope 过滤 → 活跃 → 信任闸 → 置信门 → 时效窗口）。
 * 污染率就是这个集合里"不该在的条目"的比例（[S6] / [S10 步骤 6]）。
 */
export function injectable(store, opts = {}) {
  return store.items.filter((it) => rejectReason(store, it, opts) === null);
}

/**
 * 可注入性审计：逐条给出"进 / 不进 + 理由"。
 * 这不是额外的防线，而是把 injectable() 的判定**显式化**——演示与评测需要能回答
 * "为什么这条没进注入集"（[S6] 污染率审计的做法：定期对注入集合做时效+信任+一致性审计）。
 */
export function injectionAudit(store, opts = {}) {
  const accepted = [];
  const rejected = [];
  for (const it of store.items) {
    const why = rejectReason(store, it, opts);
    if (why) rejected.push({ id: it.id, reason: why });
    else accepted.push({ id: it.id, reason: `active + trust=${it.trust} + confidence=${it.confidence} ≥ ${INJECT_CONFIDENCE}` });
  }
  return { accepted, rejected };
}

function rejectReason(store, it, { repo = null, user = null, now = null } = {}) {
  if (store.defenses.scopeFilter && !scopeMatch(it.scope, { repo, user })) return 'scope 不匹配（[S4] 过滤在检索时做，不是生成后做）';
  if (it.status !== 'active') return `状态 ${it.status} ≠ active（[S5] 状态机：superseded/coexisting/expired/redacted/deleted 不进注入集）`;
  if (store.defenses.trustGate && it.trust === TRUST.UNTRUSTED) return '信任等级 untrusted（[S7 防御1] 低信任候选不得自动注入）';
  if (it.confidence < INJECT_CONFIDENCE) return `置信度 ${it.confidence} < 阈值 ${INJECT_CONFIDENCE}（[S10 步骤 4.5] 置信门）`;
  if (store.defenses.ttlWindow && it.valid_to && now && it.valid_to <= now) return `时效窗口到期（valid_to ${it.valid_to} ≤ now ${now}，[S5] 时效）`;
  return null;
}

function scopeMatch(itemScope, query) {
  if (query.repo !== null && itemScope.repo !== query.repo) return false;
  if (query.user !== null && itemScope.user !== query.user) return false;
  return true;
}

/**
 * [S5] 时效窗口的**状态迁移**函数：active → expired（到点的事实归档不是删除，保留可追溯）。
 * 必须显式传 now —— 不允许实现自己去读墙钟（确定性契约）。
 * 关掉 ttlWindow 防线 = 系统整体不再维护时效（既不迁移状态、也不在注入时过滤）；
 * 否则"关防线"只影响读侧、消融探针就测不到写侧的状态机（恒真风险）。
 */
export function sweepExpired(store, now) {
  if (!now) throw new Error('sweepExpired(store, now)：now 必须显式传入（确定性：时钟不外取）');
  if (!store.defenses.ttlWindow) return [];
  const expired = [];
  for (const it of store.items) {
    if (it.status !== 'active' || !it.valid_to || it.valid_to > now) continue;
    it.status = 'expired';
    expired.push(it.id);
    audit(store, 'expire', { id: it.id, at: now, result: 'expired', reason: `valid_to ${it.valid_to} ≤ now ${now}` });
    emitItem(store, it);
  }
  return expired;
}

/**
 * [S4] 读侧召回：scope 过滤 → 混合检索（BM25 词法路 ∥ hash embedding 向量路 → RRF）→ top-k。
 * 返回 [{ item, score(RRF), paths:{ bm25, dense } }]——paths 用于错误归因（[S6] 一路漏=单路盲区）。
 */
export function recall(store, query, { repo = null, user = null, k = 5, now = null } = {}) {
  const pool = injectable(store, { repo, user, now });
  if (pool.length === 0) return [];
  const lex = bm25Rank(pool, query);
  const vec = denseRank(pool, query);
  const fused = rrfFuse([lex, vec]);
  if (fused[0]) {
    // [S10 步骤 4.6] 回写命中：用于衰减与巩固信号
    const top = fused[0].item;
    top.hit_count += 1;
    top.last_hit_at = now ?? store.clock();
  }
  return fused.slice(0, k).map((f) => ({
    item: f.item,
    score: f.score,
    paths: { bm25: f.lexRank ?? null, dense: f.vecRank ?? null },
  }));
}

/**
 * [S10 步骤 7] 用户说"忘掉" = 硬删（内容清除 + 向量清空 + 墓碑）并沿血缘传播到派生物。
 * 派生物不物理删除：保留 id 与血缘（审计价值），但内容清空、状态置 redacted → 不再进注入集。
 * 返回 { id, tombstone, redacted: [...] }
 */
export function forget(store, id, reason = 'user_request') {
  const target = store.items.find((it) => it.id === id);
  if (!target) throw new Error(`forget: 未知 id ${id}`);
  target.content = null;
  target.embedding = null;
  target.status = 'deleted';
  target.deleted_at = store.clock();
  target.deletion_reason = reason;
  emitItem(store, target);

  // 传播：derived_from 指向本条（或指向本条祖先）的派生物必须失效
  const lineage = new Set([id]);
  if (store.defenses.forgetPropagation) {
    let grew = true;
    while (grew) {
      grew = false;
      for (const it of store.items) {
        if (it.derived_from && lineage.has(it.derived_from) && !lineage.has(it.id)) {
          lineage.add(it.id);
          grew = true;
        }
      }
    }
  }
  const redacted = [];
  for (const it of store.items) {
    if (it.id === id || !lineage.has(it.id)) continue;
    it.content = null;                  // 派生物原文清除（redact）
    it.embedding = null;                // [S10 步骤 7.2] 向量一并清空
    it.status = 'redacted';             // 不复用 active —— 否则清空内容后仍会被注入
    it.redacted_by = id;
    redacted.push(it.id);
    emitItem(store, it);
  }
  audit(store, 'delete', { id, actor: 'user:explicit', result: 'hard_delete', reason, propagated: redacted });
  return { id, tombstone: { id, deleted_at: target.deleted_at, deletion_reason: reason, content: null }, redacted };
}

/** [S10 步骤 7.4] 墓碑元数据：为审计与血缘保留 id，不含原文 */
export function tombstones(store) {
  return store.items
    .filter((it) => it.status === 'deleted')
    .map((it) => ({ id: it.id, deleted_at: it.deleted_at, deletion_reason: it.deletion_reason, content: it.content, superseded_by: it.superseded_by ?? null }));
}

/** [S10 步骤 2/5] 覆盖链：mem#A → mem#B → mem#C 的完整审计链（不物理删除，链必须可走通） */
export function supersedeChain(store, id) {
  const chain = [];
  const seen = new Set();
  let cur = store.items.find((it) => it.id === id);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    chain.push({ id: cur.id, status: cur.status, valid_from: cur.valid_from, valid_to: cur.valid_to ?? null });
    cur = cur.superseded_by ? store.items.find((it) => it.id === cur.superseded_by) : null;
  }
  return chain;
}

/** [S3/S10.7] 血缘：由 id 派生出的条目（传递闭包），供删除传播与"毒源影响面"定位 */
export function lineageOf(store, id) {
  const lineage = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const it of store.items) {
      if (it.derived_from && lineage.has(it.derived_from) && !lineage.has(it.id)) {
        lineage.add(it.id);
        grew = true;
      }
    }
  }
  return [...lineage].map((x) => store.items.find((it) => it.id === x)).filter(Boolean);
}

/**
 * [S6 指标1 一致性] 同一 scope+category 是否只有一条当前有效事实；>1 即告警。
 * coexisting 是状态机里的合法例外（[S5]），但必须带时间戳——这里把它单列出来，不当冲突。
 */
export function consistencyReport(store) {
  const topics = new Map();
  for (const it of store.items) {
    if (it.status !== 'active') continue;
    const key = `${it.scope?.repo ?? '-'}/${it.scope?.user ?? '-'}/${it.category}`;
    if (!topics.has(key)) topics.set(key, []);
    topics.get(key).push(it.id);
  }
  const conflicts = [...topics.entries()].filter(([, ids]) => ids.length > 1);
  const coexisting = store.items.filter((it) => it.status === 'coexisting').map((it) => it.id);
  return {
    topics: [...topics.keys()],
    conflicts: conflicts.map(([topic, ids]) => ({ topic, ids })),
    activePerTopic: Object.fromEntries([...topics.entries()].map(([k, v]) => [k, v.length])),
    coexisting,
    consistent: conflicts.length === 0,
  };
}

/**
 * [S6 指标3 污染率] 注入集合里"过期 / 矛盾 / 被投毒"的条目比例（目标 < 1%）。
 *
 * 口径写死在代码里（不靠人工标注）："被投毒"按**来源与状态**判定，不按内容签名判定——
 *   来源 · trust=untrusted（外部/工具结果来的未确认候选）      → [S7 防御1]
 *   状态 · superseded / coexisting（同主题矛盾条）            → [S5]
 *   时效 · valid_to 已过 / status=expired                     → [S5]
 *
 * 为什么"命中注入扫描签名"**不**直接算污染：签名是线索不是证据——用户自己给的运维步骤
 * （"部署前先运行 preflight.sh"）天经地义命中 script-exec。把签名算成污染 = 拿线索冒充结论。
 * 这类条目单列成 advisories（命中签名但来源可信），既不隐藏也不冤枉。写路径对它们的处置是
 * "放行 + 审计留痕"（见 write() 的 advisory 分支）——这条边界是本次实现时实测发现的，
 * 原口径（签名即污染）会把污染率从 0 虚报成 33%，属于"指标口径 bug 而不是安全发现"。
 */
export function pollutionReport(store, opts = {}) {
  const injected = new Set(injectable(store, opts).map((it) => it.id));
  const candidates = [];
  const leaked = [];
  const advisories = [];
  // 同一 scope+category 有 >1 条 active → 每一条都记为"矛盾"
  const keyOf = (it) => `${it.scope?.repo ?? '-'}/${it.scope?.user ?? '-'}/${it.category}`;
  const activePerTopic = new Map();
  for (const it of store.items) {
    if (it.status !== 'active') continue;
    activePerTopic.set(keyOf(it), (activePerTopic.get(keyOf(it)) ?? 0) + 1);
  }
  const multiActive = new Map();
  for (const it of store.items) {
    if (it.status === 'active' && activePerTopic.get(keyOf(it)) > 1) multiActive.set(it.id, activePerTopic.get(keyOf(it)));
  }
  for (const it of store.items) {
    const sig = scanContent(it.content ?? '');
    if (sig.length > 0 && it.trust === TRUST.USER) {
      advisories.push({ id: it.id, matched: sig, note: '命中扫描签名但来源为用户确认 → 放行并留痕（签名 ≠ 证据）' });
    }
    const why = [];
    if (it.trust === TRUST.UNTRUSTED) why.push('来源 untrusted（未确认候选）');
    if (it.status === 'superseded') why.push('状态 superseded（矛盾旧条）');
    if (it.status === 'coexisting') why.push('状态 coexisting（未裁决矛盾）');
    if (it.status === 'expired') why.push('状态 expired（时效已过）');
    if (it.valid_to && opts.now && it.valid_to <= opts.now) why.push('时效已过（valid_to ≤ now）');
    // [S6] 污染 = 过期 / 矛盾 / 被投毒 —— "矛盾"这一层不能只在状态机上体现：
    // 同一 scope+category 出现 >1 条 active 就是未消解的冲突（状态机被关掉/被绕过时的真实后果），
    // 这类条目进注入集就是污染。没有这一层，关掉 conflictResolve 的泄漏会被漏报为 0。
    if (multiActive.has(it.id)) why.push(`与同 scope+category 的其他 active 条矛盾（该主题 active=${multiActive.get(it.id)} 条）`);
    if (why.length === 0) continue;
    candidates.push(it.id);
    if (injected.has(it.id)) leaked.push({ id: it.id, why: why.join(' + ') });
  }
  return {
    injected: injected.size,
    candidates: candidates.length,
    pollution: leaked.length,
    rate: injected.size === 0 ? 0 : Number((leaked.length / injected.size).toFixed(4)),
    leaked,
    advisories,
  };
}

/** 防线清单的"人话"映射（README / 演示 / 笔记三处共用同一份，避免手抄漂移） */
export const DEFENSE_NOTES = Object.freeze({
  trustGate: '[S7 防御1] 写侧信任分级',
  injectionScan: '[S7 防御2] 记忆内容注入扫描',
  highRiskApproval: '[S7 防御3] 高危事实独立审批',
  auditTrail: '[S7 防御4] 审计留痕（含血缘）',
  conflictResolve: '[S5] 冲突消解状态机',
  scopeFilter: '[S4] scope 过滤',
  ttlWindow: '[S5] 时效窗口',
  forgetPropagation: '[S10 步骤 7] 遗忘沿血缘传播',
});

export { tokenize, embed };
