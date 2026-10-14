// ============================================================
// M1 断言 —— 跑 starter 红 / solution 绿（argv[2]==='solution' 切目标）
//   四条断言编号 = TODO 编号（a1 检索打分 / a2 压缩 / a3 会话重建 / a4 权限门）
// ============================================================
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Message } from '../exercises/m1/starter/types.js';

const target = process.argv[2] === 'solution' ? 'solution' : 'starter';
const tools = await import(`../exercises/m1/${target}/tools.ts`);
const comp = await import(`../exercises/m1/${target}/compress.ts`);
const ses = await import(`../exercises/m1/${target}/session.ts`);
const pol = await import(`../exercises/m1/${target}/policy.ts`);
const { TODOError } = await import(`../exercises/m1/${target}/types.ts`);

const { buildRegistry, callTool } = tools;
const { compress } = comp;
const { Session } = ses;
const { decide } = pol;

let failures = 0;
function expect(cond: boolean, tag: string, detail?: string): void {
  console.log(cond ? `✅ ${tag}` : `❌ ${tag}${detail ? ` —— ${detail}` : ''}`);
  if (!cond) failures += 1;
}

async function check(tag: string, detail: string, body: () => boolean | Promise<boolean>): Promise<void> {
  try {
    expect(await body(), tag, detail);
  } catch (e) {
    if (e instanceof TODOError) expect(false, tag, `未实现：${(e as Error).message}`);
    else throw e;
  }
}

// a1 检索打分排序 + 多工具命名分发
await check('m1.1 检索打分排序 + 多工具', 'query=BM25 命中 bm25 置顶 + registry.size=2', async () => {
  const registry = buildRegistry();
  const raw = await callTool(registry, 'search', { query: 'BM25' });
  const top = JSON.parse(raw) as Array<{ id: string; doc: string; score: number }>;
  return registry.size === 2 && top.length >= 1 && top[0].doc === 'bm25';
});

// a2 超阈值压缩 + 未超阈值原样
await check('m1.2 压缩', '超阈值 head/tail 逐字保留 + summarized>0；未超原样 summarized=0', () => {
  const big: Message[] = [
    { role: 'system', content: 's'.repeat(120) },
    { role: 'user', content: 'u'.repeat(120) },
    { role: 'assistant', content: 'a1'.repeat(40) },
    { role: 'tool', tool_call_id: 't1', name: 'search', content: 'r1'.repeat(120) },
    { role: 'assistant', content: 'a2'.repeat(40) },
    { role: 'tool', tool_call_id: 't2', name: 'search', content: 'r2'.repeat(120) },
  ];
  const out = compress(big, 10, 2);
  const headOk = out.messages[0].role === 'system' && out.messages[1].role === 'user';
  const last = out.messages.length - 1;
  const tailOk = out.messages[last].role === 'tool' && out.messages[last].content === 'r2'.repeat(120)
    && out.messages[last - 1].role === 'assistant' && out.messages[last - 1].content === 'a2'.repeat(40);
  const small: Message[] = [{ role: 'system', content: 'hi' }];
  const outSmall = compress(small, 1000, 2);
  return out.summarized > 0 && out.messages.length < big.length && headOk && tailOk
    && outSmall.summarized === 0 && outSmall.messages === small;
});

// a3 JSONL 会话：append/loadAll 往返 + rebuild + 未知 intent 标注
await check('m1.3 会话重建', 'append 2 条 → loadAll 2 条 → rebuild 出 system/user/tool + 未知标注', () => {
  const dir = join('.tmp-m1-assert');
  rmSync(dir, { recursive: true, force: true });
  try {
    const s = new Session(dir, 's1');
    s.start('你是一个 agent', '查知识库里 BM25');
    s.append({ kind: 'assistant', tool_calls: [{ id: 'call_0', name: 'search', arguments: { query: 'BM25' } }] });
    const events = s.loadAll();
    const msgs: Message[] = s.rebuild(events);
    const hasSystem = msgs.some((m) => m.role === 'system' && m.content === '你是一个 agent');
    const hasUser = msgs.some((m) => m.role === 'user' && m.content === '查知识库里 BM25');
    const hasUnknown = msgs.some((m) => m.role === 'tool' && m.content.startsWith('[未知状态]'));
    return events.length === 2 && hasSystem && hasUser && hasUnknown;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// a4 默认 deny 权限门
await check('m1.4 权限门', '白名单 read_file/search=allow；write_file/run_shell=deny', () => {
  return decide('read_file') === 'allow' && decide('search') === 'allow'
    && decide('write_file') === 'deny' && decide('run_shell') === 'deny';
});

if (failures === 0) {
  console.log('✅ m1 验收通过');
} else {
  console.log(`❌ m1 验收通过（${failures} 条未过）`);
  process.exitCode = 1;
}