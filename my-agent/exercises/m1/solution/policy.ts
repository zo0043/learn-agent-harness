// ============================================================
// 默认 deny 权限门 —— M1：白名单未列即拒
//   （deny>approve>allow 三通道是 M2 升级；M1 只取「默认 deny + 白名单 allow」最小态）
// ============================================================

/** 只读工具白名单（M1 只有两个只读工具） */
export const TOOL_ALLOWLIST = ['read_file', 'search'];

export type PolicyDecision = 'allow' | 'deny';

export function decide(tool: string): PolicyDecision {
  return TOOL_ALLOWLIST.includes(tool) ? 'allow' : 'deny';
}