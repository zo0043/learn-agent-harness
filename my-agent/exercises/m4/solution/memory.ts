// ============================================================
// 长期记忆 —— M4：写读遗忘 + 四道投毒防线 + 血缘传播
//   记忆不是缓存：是「带信任等级 + 投毒防线 + 遗忘血缘」的状态。
//   确定性：逻辑时钟 FIXED_NOW；内存持久层不碰真实 fs/墙钟。
// ============================================================
import type { ForgetResult, MemoryItem, MemoryStore, MemoryWriteResult, TrustLevel } from './types.js';

/** 信任分级（演示/笔记/红线三处共用同一份，避免手抄漂移） */
export const TRUST: Record<'UNTRUSTED' | 'INFERRED' | 'USER', TrustLevel> = Object.freeze({
  UNTRUSTED: 'untrusted',
  INFERRED: 'inferred',
  USER: 'user_confirmed',
});

/** 确定性基准时钟（不落墙钟；同一场景两次运行输出逐字节一致） */
export const FIXED_NOW = '2026-10-12T12:00:00+08:00';

/** [S7] 记忆投毒四道防线（消融对象；每道都对应一个行为探针） */
export const FOUR_POISON_DEFENSES = Object.freeze(['trustGate', 'injectionScan', 'highRiskApproval', 'auditTrail'] as const);

/** 完整防线清单（四道投毒防线 + 记忆正确性机制） */
export const DEFENSE_KEYS = Object.freeze([
  ...FOUR_POISON_DEFENSES,
  'conflictResolve',   // [S5] 同 scope/category 冲突消解
  'scopeFilter',       // [S4] scope 过滤（反事实探针依赖）
  'ttlWindow',         // [S5] 时效窗口
  'forgetPropagation', // [S10.7] 删除沿血缘传播到派生物
] as const);

/** 注入置信门：confidence ≥ 0.8 才进注入集 */
export const INJECT_CONFIDENCE = 0.8;

/** 高危事实（要执行 / 要凭据 / 要外发）= 记忆级管控 */
export const HIGH_RISK_CATEGORIES: ReadonlySet<string> = new Set(['PROCEDURE', 'CREDENTIALS', 'EGRESS']);

/** [S7 防御2] 内容注入扫描签名（与 M2 MCP 工具结果注入同一套检测） */
const SCAN_PATTERNS: { id: string; re: RegExp }[] = [
  { id: 'remote-fetch', re: /(?:\b|^)(?:curl|wget)\s+https?:\/\//i },
  { id: 'script-exec', re: /(?:执行|运行|run|execute)\s*[`'"]?[^\s`'"]*\.(?:sh|bat|ps1)/i },
  { id: 'credential', re: /(?:token|api[_-]?key|secret|password)\s*[:=]/i },
  { id: 'instruction-override', re: /(?:忽略|无视|ignore)\s*(?:之前|以上|先前|previous|above|prior)/i },
];

/** 注入扫描实际检测；返回命中的签名 id 列表 */
export function scanContent(content: string): string[] {
  return SCAN_PATTERNS.filter((p) => p.re.test(String(content))).map((p) => p.id);
}

/** 建库：四道防线默认全开；clock 调用方注入（缺省 FIXED_NOW） */
export function createStore(overrides: Record<string, boolean> = {}): MemoryStore {
  const defenses: Record<string, boolean> = Object.fromEntries(DEFENSE_KEYS.map((k) => [k, true]));
  for (const [k, v] of Object.entries(overrides)) {
    if (!(DEFENSE_KEYS as readonly string[]).includes(k)) throw new Error(`未知防线: ${k}`);
    defenses[k] = v;
  }
  const store: MemoryStore = {
    defenses,
    items: [],
    audit: [],
    clock: () => FIXED_NOW,
    seq: 0,
    nextId: () => `mem#${100 + ++store.seq * 74}`,
  };
  return store;
}

// —— 内部 helpers ——
const rank = (t: TrustLevel): number => ({ untrusted: 0, inferred: 1, user_confirmed: 2 } as const)[t] ?? -1;
const sameScope = (a: { repo: string | null; user: string | null }, b: { repo: string | null; user: string | null }): boolean =>
  (a.repo ?? null) === (b.repo ?? null) && (a.user ?? null) === (b.user ?? null);

function findConflict(store: MemoryStore, candidate: MemoryItem): MemoryItem | undefined {
  return store.items.find((it) => it.status === 'active' && it.category === candidate.category && sameScope(it.scope, candidate.scope));
}

/** [S5] 冲突判定矩阵：信任优先，其次时间；无时间优势 → 并存；更旧 → 拒绝（trustGateOn 时低信任不覆盖高信任） */
function conflictDecision(existing: MemoryItem, candidate: MemoryItem, trustGateOn: boolean): 'reject-lower-trust' | 'supersede' | 'coexisting' | 'reject-stale' {
  const rc = rank(candidate.trust);
  const re = rank(existing.trust);
  if (trustGateOn && rc < re) return 'reject-lower-trust'; // [S7 防御1] 低信任候选不得覆盖高信任
  if (rc > re) return 'supersede';
  const cv = candidate.valid_from ?? '';
  const ev = existing.valid_from ?? '';
  if (cv > ev) return 'supersede';
  if (cv === ev) return 'coexisting';
  return 'reject-stale';
}

function materialize(id: string, c: MemoryItem, at: string, status: MemoryItem['status']): MemoryItem {
  return {
    id,
    content: c.content,
    category: c.category,
    scope: { repo: c.scope.repo ?? null, user: c.scope.user ?? null },
    trust: c.trust,
    confidence: c.confidence ?? 0,
    valid_from: c.valid_from ?? at,
    valid_to: c.valid_to ?? (c.ttl ? c.ttl : null),
    ttl: c.ttl ?? null,
    approved: Boolean(c.approved),
    derived_from: c.derived_from ?? null,
    superseded_by: null,
    status,
  };
}

const tokenize = (q: string): string[] => q.toLowerCase().split(/[^\p{L}\p{N}_]+/u).filter(Boolean);

function scopeMatch(itemScope: { repo: string | null; user: string | null }, query: { repo: string | null; user: string | null }): boolean {
  if (query.repo !== null && itemScope.repo !== query.repo) return false;
  if (query.user !== null && itemScope.user !== query.user) return false;
  return true;
}

/** [S3] 写路径：四道投毒防线（trustGate/injectionScan/highRiskApproval/auditTrail）+ 冲突消解 */
export function write(store: MemoryStore, candidate: MemoryItem): MemoryWriteResult {
  const at = candidate.valid_from ?? store.clock();
  const id = store.nextId();
  const flags = scanContent(candidate.content);
  const auditRec = (op: string, result: string, reason: string): void => {
    if (store.defenses.auditTrail) store.audit.push({ op, id, result, reason });
  };

  // [S7 防御2] 内容注入扫描（低信任内容命中即判 rejected；用户来源命中签名的放行+advisory 不在本最小态展开）
  if (store.defenses.injectionScan && flags.length > 0 && candidate.trust !== TRUST.USER) {
    auditRec('write', 'rejected', `注入扫描命中: ${flags.join(',')}`);
    return { op: 'rejected', id, reason: `注入扫描命中: ${flags.join(',')}`, flags };
  }

  // [S7 防御3] 高危事实独立审批
  const highRisk = HIGH_RISK_CATEGORIES.has(candidate.category);
  if (store.defenses.highRiskApproval && highRisk && !candidate.approved) {
    auditRec('write', 'pending_approval', `高危类别 ${candidate.category} 未审批`);
    return { op: 'pending_approval', id, reason: `高危类别 ${candidate.category} 未审批`, flags };
  }

  // [S5] 同 scope/category 冲突消解（[S7 防御1] trustGate 在 conflictDecision 内）
  const existing = store.defenses.conflictResolve ? findConflict(store, candidate) : undefined;
  if (existing) {
    const decision = conflictDecision(existing, candidate, store.defenses.trustGate);
    if (decision === 'reject-lower-trust') {
      auditRec('write', 'rejected', `低信任(${candidate.trust})不得覆盖高信任(${existing.trust})`);
      return { op: 'rejected', id, reason: `低信任(${candidate.trust})不得覆盖高信任(${existing.trust})`, flags };
    }
    if (decision === 'reject-stale') {
      auditRec('write', 'rejected', `陈旧候选 valid_from(${at}) 早于当前有效条(${existing.valid_from})`);
      return { op: 'rejected', id, reason: `陈旧候选 valid_from(${at}) 早于当前有效条(${existing.valid_from})，不得覆盖`, flags };
    }
    if (decision === 'coexisting') {
      store.items.push(materialize(id, candidate, at, 'coexisting'));
      auditRec('coexist', 'accepted', `同信任无时间优势 → 并存（与 ${existing.id} 并存待证据裁决）`);
      return { op: 'coexisting', id, reason: '同信任 + 无时间优势 → 并存（触发澄清而非硬选）', flags };
    }
    // supersede：覆盖不物理删除，保留审计链
    existing.status = 'superseded';
    existing.superseded_by = id;
    if (store.defenses.ttlWindow) existing.valid_to = at;
    store.items.push(materialize(id, candidate, at, 'active'));
    auditRec('supersede', 'accepted', `覆盖 ${existing.id}`);
    return { op: 'superseded', id, supersededId: existing.id, reason: '来源信任不低 + 更新生效时间 → 覆盖（不物理删除，保留审计链）', flags };
  }

  store.items.push(materialize(id, candidate, at, 'active'));
  auditRec('write', 'accepted', '');
  return { op: 'accepted', id, flags };
}

/** [S4] 读路径：scope 过滤 → active → 信任闸 → 置信门 → 时效窗口 → 简单词法匹配 top-k */
export function recall(store: MemoryStore, query: string, opts: { repo?: string | null; user?: string | null; k?: number; now?: string } = {}): MemoryItem[] {
  const repo = opts.repo ?? null;
  const user = opts.user ?? null;
  const now = opts.now ?? store.clock();
  const k = opts.k ?? 5;
  const tokens = tokenize(query);
  return store.items
    .filter((it) => {
      if (store.defenses.scopeFilter && !scopeMatch(it.scope, { repo, user })) return false;
      if (it.status !== 'active') return false;
      if (store.defenses.trustGate && it.trust === TRUST.UNTRUSTED) return false; // [S7 防御1] 低信任候选不自动注入
      if (it.confidence < INJECT_CONFIDENCE) return false;                          // 置信门
      if (store.defenses.ttlWindow && it.valid_to && now && it.valid_to <= now) return false; // 时效窗口
      return true;
    })
    .filter((it) => tokens.length === 0 || tokens.some((t) => it.content.toLowerCase().includes(t)))
    .slice(0, k);
}

/** [S10 步骤 7] 遗忘：落墓碑 + 沿血缘（derived_from 传递闭包）传播到派生物（content 清空 → status=redacted） */
export function forget(store: MemoryStore, id: string, reason = 'user_request'): ForgetResult {
  const target = store.items.find((it) => it.id === id);
  if (!target) throw new Error(`forget: 未知 id ${id}`);
  target.content = '';
  target.status = 'deleted';

  const lineage = new Set<string>([id]);
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
  const redacted: string[] = [];
  for (const it of store.items) {
    if (it.id === id || !lineage.has(it.id)) continue;
    it.content = '';
    it.status = 'redacted';
    redacted.push(it.id);
  }
  if (store.defenses.auditTrail) store.audit.push({ op: 'delete', id, result: 'hard_delete', reason: `${reason}；沿血缘传播 ${redacted.length} 条派生物` });
  return { id, redacted };
}