// ============================================================
// 四通道权限门 —— M2（挖 m2.1）：deny > approve > sandbox > allow
//   read_file/search=allow、write_file=sandbox、run_shell/send_email=approve；未匹配=deny。
// ============================================================
import { TODOError, type Rule, type Verdict } from './types.js';

/** 预置规则表（when 是可选的参数级匹配器） */
const RULE_TABLE: Rule[] = [
  { id: 'r-read', channel: 'allow', tools: ['read_file', 'search'], note: '只读放行' },
  { id: 'r-sandbox', channel: 'sandbox', tools: ['write_file'], note: '副作用→沙箱' },
  { id: 'r-approve', channel: 'approve', tools: ['run_shell', 'send_email'], note: '高危→审批' },
];

export function decide(_tool: string, _args: Record<string, unknown>): Verdict {
  // TODO m2.1：按 CHANNEL_PRIORITY 顺序匹配 RULE_TABLE（含 when(args)），无匹配 fallback=deny
  throw new TODOError('m2.1: 实现四通道 policy 判定 deny>approve>sandbox>allow');
}