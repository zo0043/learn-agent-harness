// 跨会话记忆的写/读路径参考实现 —— 零依赖（node >= 18，ESM）
//
// 忠实编码 notes/long-term-memory.md 的已成文判定：
//   S3 写侧决策树（价值 → 信任 → 去重/冲突 → 高危隔离）
//   S4 读侧注入（scope 过滤 → 混合检索 → 置信门）
//   S5 冲突消解与遗忘（supersede 不物理删除）
//   S7 记忆投毒四道防线（写侧信任分级 / 注入扫描 / 高危审批 / 审计留痕）
//   S10 步骤 6-7（污染率与反事实探针 / 删除沿血缘传播）
//
// 这不是生产记忆系统，是"把笔记里的判定变成可执行回归"的最小实现——
// 每个防线都可单独关闭（defenses），供消融自检证明探针确实在测它。

export const TRUST = Object.freeze({
  USER: 'user_confirmed',
  INFERRED: 'inferred',
  UNTRUSTED: 'untrusted',
});

/** S10 步骤 4.5：注入阈值（confidence ≥ 0.8 才进 system） */
export const INJECT_CONFIDENCE = 0.8;
/** S7 防御 3：高危事实（要执行 / 要凭据 / 要外发）= 程序记忆级管控 */
export const HIGH_RISK_CATEGORIES = Object.freeze(new Set(['PROCEDURE', 'CREDENTIALS', 'EGRESS']));

/** S7 防御 2：记忆内容注入扫描（与 MCP 与供应链安全 §S4 工具结果注入同一套检测） */
const SCAN_PATTERNS = [
  { id: 'remote-fetch', re: /(?:^|\s)(?:curl|wget)\s+https?:\/\//i },
  { id: 'script-exec', re: /(?:执行|运行|run|execute)\s*[`'"]?[^\s`'"]*\.(?:sh|bat|ps1)/i },
  { id: 'credential', re: /(?:token|api[_-]?key|secret|password)\s*[:=]/i },
  { id: 'instruction-override', re: /(?:忽略|无视|ignore)\s*(?:之前|以上|先前|previous|above|prior)/i },
];

const DEFENSE_KEYS = Object.freeze([
  'trustGate',        // S7.1 低信任候选不得自动注入/不得覆盖高信任
  'injectionScan',    // S7.2 内容注入扫描
  'highRiskApproval', // S7.3 高危事实独立审批
  'auditTrail',       // S7.4 写入留痕（含血缘）
  'conflictResolve',  // S5   同 scope/category 的冲突消解
  'scopeFilter',      // S4   scope 过滤（反事实探针依赖）
  'ttlWindow',        // S5   时效窗口（过期条不进注入集）
  'forgetPropagation', // S10.7 删除沿血缘传播到派生物
]);

export function createStore(overrides = {}) {
  const defenses = Object.fromEntries(DEFENSE_KEYS.map((k) => [k, true]));
  for (const [k, v] of Object.entries(overrides)) {
    if (!DEFENSE_KEYS.includes(k)) throw new Error(`未知防线: ${k}`);
    defenses[k] = v;
  }
  let seq = 0;
  return {
    defenses,
    items: [],
    audit: [],
    nextId: () => `mem#${100 + ++seq * 74}`, // 走查里的 mem#248 / mem#301 量级
  };
}

function audit(store, op, payload) {
  if (!store.defenses.auditTrail) return;
  store.audit.push({ op, at: payload.at ?? null, ...payload });
}

/** S7 防御 2 的实际检测；返回命中的模式 id 列表 */
export function scanContent(content) {
  return SCAN_PATTERNS.filter((p) => p.re.test(content)).map((p) => p.id);
}

/**
 * 写侧入口：走 S3 决策树。
 * candidate = { content, category, scope:{repo,user}, source_session, source_turns,
 *               confidence, trust, valid_from, valid_to?, approved?, derived_from? }
 * 返回 { op, id, reason, flags? }，op ∈ accepted | superseded | rejected | pending_approval
 */
export function write(store, candidate) {
  const at = candidate.valid_from ?? new Date().toISOString();
  const id = store.nextId();
  const flags = scanContent(candidate.content);

  // S7.2：内容注入扫描（低信任内容命中即降级为候选池，不自动注入；此处直接判 rejected）
  if (store.defenses.injectionScan && flags.length > 0 && candidate.trust !== TRUST.USER) {
    audit(store, 'write', { id, actor: `source:${candidate.source_session}`, triggered_by: candidate.triggered_by, result: 'rejected', reason: `注入扫描命中: ${flags.join(',')}` });
    return { op: 'rejected', id, reason: `注入扫描命中: ${flags.join(',')}`, flags };
  }

  // S7.3：高危事实独立审批（要执行/要凭据/要外发）
  const highRisk = HIGH_RISK_CATEGORIES.has(candidate.category);
  if (store.defenses.highRiskApproval && highRisk && !candidate.approved) {
    audit(store, 'write', { id, actor: `source:${candidate.source_session}`, triggered_by: candidate.triggered_by, result: 'pending_approval', reason: `高危类别 ${candidate.category} 未审批` });
    return { op: 'pending_approval', id, reason: `高危类别 ${candidate.category} 未审批`, flags };
  }

  // S5：同 scope + category 的既有 active 条 → 冲突判定
  const existing = store.defenses.conflictResolve
    ? store.items.find((it) => it.status === 'active' && it.category === candidate.category &&
        sameScope(it.scope, candidate.scope))
    : undefined;

  if (existing) {
    // S10 步骤 5：低信任来源不得覆盖高信任事实 → rejected
    if (store.defenses.trustGate && rank(candidate.trust) < rank(existing.trust)) {
      audit(store, 'write', { id, actor: `source:${candidate.source_session}`, triggered_by: candidate.triggered_by, result: 'rejected', reason: `低信任(${candidate.trust})不得覆盖高信任(${existing.trust})` });
      return { op: 'rejected', id, reason: `低信任(${candidate.trust})不得覆盖高信任(${existing.trust})`, flags };
    }
    // 同信任、新 valid_from 更晚 → 覆盖
    const item = materialize(id, candidate, at);
    if ((candidate.valid_from ?? '') >= (existing.valid_from ?? '')) {
      existing.status = 'superseded';
      existing.superseded_by = id;
      existing.valid_to = candidate.valid_from ?? at;
      store.items.push(item);
      audit(store, 'supersede', { from: existing.id, to: id, triggered_by: candidate.triggered_by });
      return { op: 'superseded', id, supersededId: existing.id, reason: '同信任 + 更新生效时间 → 覆盖（不物理删除，保留审计链）', flags };
    }
  }

  const item = materialize(id, candidate, at);
  store.items.push(item);
  audit(store, 'write', { id, actor: `source:${candidate.source_session}`, triggered_by: candidate.triggered_by, result: 'accepted' });
  return { op: 'accepted', id, flags };
}

function materialize(id, c, at) {
  return {
    id,
    content: c.content,
    category: c.category,
    scope: { repo: c.scope?.repo ?? null, user: c.scope?.user ?? null },
    source_session: c.source_session ?? null,
    source_turns: c.source_turns ?? [],
    created_at: at,
    valid_from: c.valid_from ?? at,
    valid_to: c.valid_to ?? null,
    confidence: c.confidence ?? 0,
    trust: c.trust,
    approved: Boolean(c.approved),
    status: 'active',
    derived_from: c.derived_from ?? null,
    embedding: [0.1, 0.2, 0.3], // 占位：遗忘时须清空（S10 步骤 7.2）
    superseded_by: null,
    deleted_at: null,
    deletion_reason: null,
    last_hit_at: null,
    hit_count: 0,
    probe_origin: c.probe_origin ?? null,
  };
}

const rank = (t) => ({ untrusted: 0, inferred: 1, user_confirmed: 2 }[t] ?? -1);

/** scope 相等判定：缺省字段统一按 null 比较（缺失 ≠ 其他值，否则冲突检测会静默失效） */
const sameScope = (a = {}, b = {}) => (a.repo ?? null) === (b.repo ?? null) && (a.user ?? null) === (b.user ?? null);

/**
 * S4 读侧：可注入集合（scope 过滤 → 活跃 → 信任闸 → 置信门 → 时效窗口）
 * 污染率就是这个集合里"不该在的条目"的比例（S6 / S10 步骤 6）。
 */
export function injectable(store, { repo = null, user = null, now = null } = {}) {
  return store.items.filter((it) => {
    if (store.defenses.scopeFilter && !scopeMatch(it.scope, { repo, user })) return false;
    if (it.status !== 'active') return false;
    if (store.defenses.trustGate && it.trust === TRUST.UNTRUSTED) return false;
    if (it.confidence < INJECT_CONFIDENCE) return false;
    if (store.defenses.ttlWindow && it.valid_to && now && it.valid_to <= now) return false;
    return true;
  });
}

function scopeMatch(itemScope, query) {
  if (query.repo !== null && itemScope.repo !== query.repo) return false;
  if (query.user !== null && itemScope.user !== query.user) return false;
  return true;
}

/** S10 步骤 4：混合检索的最小版——BM25（k1=1.2, b=0.75），scope 过滤先于打分 */
export function recall(store, query, { repo = null, user = null, k = 5, now = null } = {}) {
  const pool = injectable(store, { repo, user, now });
  const docs = pool.map((it) => ({ it, toks: tokenize(it.content) }));
  const N = docs.length || 1;
  const df = new Map();
  for (const d of docs) for (const t of new Set(d.toks)) df.set(t, (df.get(t) ?? 0) + 1);
  const avgdl = docs.reduce((s, d) => s + d.toks.length, 0) / N || 1;
  const q = tokenize(query);
  const scored = docs.map((d) => {
    let score = 0;
    for (const t of q) {
      const f = d.toks.filter((x) => x === t).length;
      if (!f) continue;
      const idf = Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5)); // 罕见词高 IDF（S10 步骤 4.3）
      score += idf * ((f * 2.2) / (f + 1.2 * (1 - 0.75 + 0.75 * (d.toks.length / avgdl))));
    }
    return { item: d.it, score: Number(score.toFixed(5)) };
  }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
  if (scored[0]) scored[0].item.hit_count += 1;
  return scored.slice(0, k);
}

function tokenize(s) {
  const latin = (s.toLowerCase().match(/[a-z][a-z0-9_.-]{1,}/g) ?? []);
  const cjk = (s.match(/[\u4e00-\u9fff]{2,}/g) ?? []).flatMap((w) => {
    const out = [];
    for (let i = 0; i < w.length - 1; i += 1) out.push(w.slice(i, i + 2));
    return out;
  });
  return [...latin, ...cjk];
}

/**
 * S10 步骤 7：用户说"忘掉"= 硬删（内容清除 + 墓碑）并沿血缘传播到派生物。
 * 返回 { id, tombstone, redacted: [...] }
 */
export function forget(store, id, reason = 'user_request') {
  const target = store.items.find((it) => it.id === id);
  if (!target) throw new Error(`forget: 未知 id ${id}`);
  target.content = null;
  target.embedding = null;
  target.status = 'deleted';
  target.deleted_at = new Date().toISOString();
  target.deletion_reason = reason;

  // 传播：derived_from 指向本条（或指向本条祖先）的派生物必须重生成/删除
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
    it.content = null;          // 派生物原文清除（redact）
    it.embedding = null;
    it.redacted_by = id;
    redacted.push(it.id);
  }
  audit(store, 'delete', { id, actor: 'user:explicit', result: 'hard_delete', reason, propagated: redacted });
  return { id, tombstone: { id, deleted_at: target.deleted_at, deletion_reason: reason, content: null }, redacted };
}
