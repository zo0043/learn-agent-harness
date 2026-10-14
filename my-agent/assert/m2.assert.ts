// ============================================================
// M2 断言 —— 跑 starter 红 / solution 绿（argv[2]==='solution' 切目标）
//   四条断言编号 = TODO 编号（a1 四通道 / a2 沙箱边界 / a3 MCP 防御 / a4 评测门禁）
// ============================================================
import type { GoldenQ, SandboxConfig } from '../exercises/m2/starter/types.js';

const target = process.argv[2] === 'solution' ? 'solution' : 'starter';
const { BoundaryViolation, TODOError } = await import(`../exercises/m2/${target}/types.js`);
const pol = await import(`../exercises/m2/${target}/policy.ts`);
const sbx = await import(`../exercises/m2/${target}/sandbox.ts`);
const mcp = await import(`../exercises/m2/${target}/mcp.ts`);
const eva = await import(`../exercises/m2/${target}/eval.ts`);

const { decide } = pol;
const { assertInWorkspace, Sandbox, makeWorld } = sbx;
const { sanitizeToolOutput, POISON_LINE, EgressGate, AuditLog } = mcp;
const { runEval, judgeCalibrate } = eva;

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

// a1 四通道判定：read_file=allow / write_file=sandbox / run_shell=approve / unknown=deny
await check('m2.1 四通道判定', 'allow/sandbox/approve/deny 各就各位 + 默认 deny', () => {
  const a = decide('read_file', {}).channel;
  const b = decide('write_file', { path: 'a' }).channel;
  const c = decide('run_shell', { cmd: 'x' }).channel;
  const d = decide('unknown', {}).channel;
  return a === 'allow' && b === 'sandbox' && c === 'approve' && d === 'deny';
});

// a2 沙箱三边界：路径规范化 / env 白名单 / egress 禁用
await check('m2.2 沙箱边界', '路径越界拒绝 + env 白名单外 undefined + egress 禁用', () => {
  const inOk = assertInWorkspace('work', 'a/b') === 'work/a/b';
  let escaped = false;
  try {
    assertInWorkspace('work', '../x');
  } catch (e) {
    escaped = e instanceof BoundaryViolation && (e as { kind: string }).kind === 'path';
  }
  const config: SandboxConfig = { workspace: 'work', envWhitelist: ['LANG'], network: 'deny' };
  const sb = new Sandbox(config, makeWorld('sandbox'), { LANG: 'C', SECRET: 's' });
  const secretHidden = sb.env('SECRET') === undefined;
  let egressBlocked = false;
  try {
    sb.openNetwork('evil.example');
  } catch (e) {
    egressBlocked = e instanceof BoundaryViolation && (e as { kind: string }).kind === 'network';
  }
  return inOk && escaped && secretHidden && egressBlocked;
});

// a3 MCP 四层防御：投毒 L1 围栏 + egress 拦截 + 审计摘要稳定
await check('m2.3 MCP 防御', '投毒检出隔离 + egress 白名单拦截 + 审计摘要稳定', () => {
  const s = sanitizeToolOutput(POISON_LINE);
  const gate = new EgressGate(['company.com']).check('send_email', { to: 'x@evil' });
  const al = new AuditLog();
  al.log('mcpegress', 'blocked');
  const d1 = al.digest();
  const d2 = al.digest();
  return s.hits > 0 && s.quarantined && !gate.passed && d1 === d2 && d1.startsWith('fnv1a:');
});

// a4 评测门禁：golden 命中 PASS（返回 0）+ 失效锚点响亮失败（返回 1）+ judge 校准
await check('m2.4 评测门禁', 'golden 命中 PASS + 失效锚点响亮失败 + 确定性 judge', () => {
  const good = runEval();
  const bad = runEval([{ q: '这条锚点在语料里不存在', anchors: ['这段文字绝对不存在于语料'] }]);
  const judge = judgeCalibrate(['A', 'B', 'C'], ['A', 'B', 'C']);
  const judgeBad = judgeCalibrate(['A', 'X', 'C'], ['A', 'B', 'C']);
  return good === 0 && bad === 1 && judge.consistent && judge.score === 1 && judgeBad.score < 1;
});

if (failures === 0) {
  console.log('✅ m2 验收通过');
} else {
  console.log(`❌ m2 验收通过（${failures} 条未过）`);
  process.exitCode = 1;
}