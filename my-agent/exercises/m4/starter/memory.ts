// ============================================================
// 长期记忆 —— M4（挖 m4.1）：写读遗忘 + 四道投毒防线 + 血缘传播
//   记忆不是缓存：是「带信任等级 + 投毒防线 + 遗忘血缘」的状态。
//   确定性：逻辑时钟 FIXED_NOW；内存持久层不碰真实 fs/墙钟。
// ============================================================
import { TODOError, type ForgetResult, type MemoryItem, type MemoryStore, type MemoryWriteResult, type TrustLevel } from './types.js';

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

export function write(_store: MemoryStore, _candidate: MemoryItem): MemoryWriteResult {
  // TODO m4.1a：写路径四道投毒防线（trustGate 低信任不覆盖高信任 / injectionScan 内容扫描 / highRiskApproval 高危独立审批 / auditTrail 留痕）+ 同 scope/category 冲突消解（supersede/coexist/reject-stale）
  throw new TODOError('m4.1: 实现记忆写路径四道投毒防线 + 冲突消解');
}

export function recall(_store: MemoryStore, _query: string, _opts?: { repo?: string | null; user?: string | null; k?: number; now?: string }): MemoryItem[] {
  // TODO m4.1b：读路径——scope 过滤 + 时效窗口（valid_to ≤ now 过期）+ 信任闸（untrusted 不注入）+ 置信门（≥ INJECT_CONFIDENCE）+ 只回 active
  throw new TODOError('m4.1: 实现记忆读路径 scope 过滤 + 时效窗口 + 信任/置信门');
}

export function forget(_store: MemoryStore, _id: string, _reason?: string): ForgetResult {
  // TODO m4.1c：遗忘——落墓碑（content 清空 + status=deleted）+ 沿血缘（derived_from 传递闭包）传播到派生物（status=redacted）
  throw new TODOError('m4.1: 实现遗忘与血缘传播');
}