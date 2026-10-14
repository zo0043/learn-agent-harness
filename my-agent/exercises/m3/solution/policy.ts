// ============================================================
// 四通道权限门 —— M2：deny > approve > sandbox > allow
//   read_file/search=allow、write_file=sandbox、run_shell/send_email=approve；未匹配=deny。
// ============================================================
import { CHANNEL_PRIORITY, type Rule, type Verdict } from './types.js';

/** 预置规则表（when 是可选的参数级匹配器） */
const RULE_TABLE: Rule[] = [
  { id: 'r-read', channel: 'allow', tools: ['read_file', 'search'], note: '只读放行' },
  { id: 'r-sandbox', channel: 'sandbox', tools: ['write_file'], note: '副作用→沙箱' },
  { id: 'r-approve', channel: 'approve', tools: ['run_shell', 'send_email'], note: '高危→审批' },
];

export function decide(tool: string, args: Record<string, unknown>): Verdict {
  for (const ch of CHANNEL_PRIORITY) {
    for (const r of RULE_TABLE) {
      if (r.channel !== ch || !r.tools.includes(tool)) continue;
      if (r.when && !r.when(args)) continue;
      return { channel: ch, ruleId: r.id, reason: `命中规则 ${r.id}（${r.note ?? ch}）` };
    }
  }
  return { channel: 'deny', ruleId: null, reason: '无匹配规则，默认 deny（安全默认）' };
}