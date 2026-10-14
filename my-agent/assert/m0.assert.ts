// ============================================================
// M0 断言 —— 跑 starter 红 / solution 绿（argv[2]==='solution' 切目标）
//   三条断言编号 = TODO 编号（a1 解析 / a2 执行回填 / a3 loop 收口）
// ============================================================
import type { Message } from '../exercises/m0/starter/types.js';

const target = process.argv[2] === 'solution' ? 'solution' : 'starter';
const { parseModelReply, executeAndBackfill, runLoop, TODOError, debug } = await import(
  `../exercises/m0/${target}/loop.ts`
);

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

// a1 解析判别：tool_call / deliver 两形状 + 判别
await check('m0.1 解析判别', 'tool_call 或 deliver 两形状', () => {
  const t = parseModelReply('{"tool_call":{"name":"read_file","arguments":{"path":"notes/hello.txt"}}}');
  const d = parseModelReply('{"deliver":"hello from my-agent"}');
  return t.kind === 'tool_call' && t.name === 'read_file' && d.kind === 'deliver' && d.content === 'hello from my-agent';
});

// a2 执行回填：执行 read_file 后，末条消息 role==='tool' 且含固定内容
await check('m0.2 执行回填', '末条 role=tool 且含固定内容', async () => {
  const seed: Message[] = [{ role: 'user', content: '读 notes/hello.txt 的内容' }];
  const out = await executeAndBackfill(seed, { id: 'call_0', name: 'read_file', arguments: { path: 'notes/hello.txt' } });
  const last = out[out.length - 1];
  return out.length === seed.length + 1 && last.role === 'tool' && last.content === 'hello from my-agent';
});

// a3 loop 收口：最终回答含文件内容，且真的调了 1 次工具
await check('m0.3 loop 收口', '最终回答含 hello from my-agent 且 toolCalls=1', async () => {
  debug.toolCalls = 0;
  const answer = await runLoop('读 notes/hello.txt 的内容');
  return answer.includes('hello from my-agent') && debug.toolCalls === 1;
});

if (failures === 0) {
  console.log('✅ m0 验收通过');
} else {
  console.log(`❌ m0 验收通过（${failures} 条未过）`);
  process.exitCode = 1;
}