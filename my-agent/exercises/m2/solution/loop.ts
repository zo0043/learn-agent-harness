// ============================================================
// 最小 agent loop —— M2（给全：继承 M1 solution 补全版 + 四通道权限接线）
//   parseModelReply / runLoop 照搬 M1；executeAndBackfill 升级：
//   远程工具(web_search)走 callMCP+防御；本地工具先过四通道 decide(tool,args) →
//   deny/approve 拒绝回写、allow 放行、sandbox 走沙箱执行。判定挖在 policy.ts。
// ============================================================
import { buildRegistry, callTool } from './tools.js';
import { mockModel } from './model.js';
import { decide } from './policy.js';
import { callMCP, sanitizeToolOutput, audit } from './mcp.js';
import { runSandboxed } from './sandbox.js';
import { runEval } from './eval.js';
import { type Action, type Message, type ToolCall, TODOError } from './types.js';

/** 调试计数：runLoop 实际执行工具的次数（供断言核对） */
export const debug = { toolCalls: 0 };

const registry = buildRegistry();
/** 远程工具：走 MCP rpcCall + 供应链防御，不经本地四通道 policy */
const REMOTE_TOOLS = new Set(['web_search']);

export function parseModelReply(raw: string): Action {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    throw new Error(`模型回复不是合法 JSON：${raw}`);
  }
  if (typeof obj !== 'object' || obj === null) throw new Error('模型回复不是 JSON 对象');
  const o = obj as Record<string, unknown>;

  if (typeof o.deliver === 'string') return { kind: 'deliver', content: o.deliver };

  const tc = o.tool_call;
  if (typeof tc === 'object' && tc !== null) {
    const t = tc as Record<string, unknown>;
    const args = t.arguments ?? {};
    if (typeof t.name === 'string' && typeof args === 'object' && args !== null) {
      return { kind: 'tool_call', name: t.name, args: args as Record<string, unknown> };
    }
  }

  throw new Error('模型回复既不是 deliver 也不是 tool_call 形状');
}

export async function executeAndBackfill(messages: Message[], tc: ToolCall): Promise<Message[]> {
  if (REMOTE_TOOLS.has(tc.name)) {
    // 远程工具返回内容是注入通道 → L1 消毒后再进上下文（L2/L3/L4 见 mcp.ts）
    const raw = await callMCP(tc.name, tc.arguments);
    const content = sanitizeToolOutput(raw).content;
    return [...messages, { role: 'tool', tool_call_id: tc.id, name: tc.name, content }];
  }
  const verdict = decide(tc.name, tc.arguments);
  if (verdict.channel === 'deny' || verdict.channel === 'approve') {
    return [...messages, { role: 'tool', tool_call_id: tc.id, name: tc.name, content: `[${verdict.channel}] ${verdict.reason}` }];
  }
  if (verdict.channel === 'sandbox') {
    const content = runSandboxed(tc.name, tc.arguments);
    return [...messages, { role: 'tool', tool_call_id: tc.id, name: tc.name, content }];
  }
  const content = await callTool(registry, tc.name, tc.arguments);
  return [...messages, { role: 'tool', tool_call_id: tc.id, name: tc.name, content }];
}

export async function runLoop(prompt: string, maxSteps = 3): Promise<string> {
  debug.toolCalls = 0;
  let messages: Message[] = [
    { role: 'system', content: '你是一个能调用工具的 agent。需要读文件就输出 tool_call，拿到结果后输出 deliver。' },
    { role: 'user', content: prompt },
  ];

  for (let step = 0; step < maxSteps; step++) {
    const raw = mockModel(messages);
    const action = parseModelReply(raw);
    if (action.kind === 'deliver') return action.content;

    const tc: ToolCall = { id: `call_${step}`, name: action.name, arguments: action.args };
    messages = [...messages, { role: 'assistant', content: null, tool_calls: [tc] }];
    messages = await executeAndBackfill(messages, tc);
    debug.toolCalls += 1;
  }

  throw new Error(`超过 maxSteps=${maxSteps} 仍未 deliver`);
}

export async function main(): Promise<void> {
  const prompt = process.argv[2] ?? '查 Q1 报告关键数据（远程工具，返回含投毒）';
  try {
    console.log(await runLoop(prompt));       // web_search → MCP 防御 → deliver 收口
    runEval();                                 // golden set 评测门禁（PASS n/N）
    console.log(`审计摘要：${audit.digest()}`); // 供应链防御全程审计（fnv1a）
    console.log('✅ m2 demo 通过');
  } catch (e) {
    if (e instanceof TODOError) {
      console.log(`❌ 仍有 TODO 未完成：${e.message}`);
      console.log('  请补全 exercises/m2/ 下对应文件的 TODO，或用 npm run assert:m2 逐条定位全部 TODO');
      process.exit(1);
    }
    throw e;
  }
}

// npm run demo:m2 入口：仅当本文件被直接运行时执行 main()（被 assert 动态 import 时不执行）
if (process.argv[1]?.includes('loop.ts')) void main();