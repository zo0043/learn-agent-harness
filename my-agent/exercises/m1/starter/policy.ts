// ============================================================
// 默认 deny 权限门 —— M1（挖 m1.4）：白名单未列即拒
//   （deny>approve>allow 三通道是 M2 升级；M1 只取「默认 deny + 白名单 allow」最小态）
// ============================================================
import { TODOError } from './types.js';

/** 只读工具白名单（M1 只有两个只读工具） */
export const TOOL_ALLOWLIST = ['read_file', 'search'];

export type PolicyDecision = 'allow' | 'deny';

export function decide(_tool: string): PolicyDecision {
  // TODO m1.4：tool ∈ TOOL_ALLOWLIST → allow；否则 deny（默认 deny，白名单未列即拒）
  throw new TODOError('m1.4: 实现默认 deny 权限门判定');
}