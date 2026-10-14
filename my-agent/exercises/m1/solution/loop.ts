// ============================================================
// 最小 agent loop —— M1（给全：继承 M0 solution 补全版 + 执行前接权限门）
//   parseModelReply / runLoop 两个函数照搬 M0 补全版；唯一改动 = executeAndBackfill
//   执行工具前先过 policy 门（deny 则回写拒绝、不执行）。system 提示词 mock 不依赖，照搬 M0。
// ============================================================
import { buildRegistry, callTool } from './tools.js';
import { mockModel } from './model.js';
import { decide } from './policy.js';
import { type Action, type Message, type ToolCall, TODOError } from './types.js';

/** 调试计数：runLoop 实际执行工具的次数（供断言核对） */
export const debug = { toolCalls: 0 };

const registry = buildRegistry();

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
  if (decide(tc.name) === 'deny') {
    return [...messages, { role: 'tool', tool_call_id: tc.id, name: tc.name, content: '[策略拒绝] 白名单外工具' }];
  }
  const result = await callTool(registry, tc.name, tc.arguments);
  return [...messages, { role: 'tool', tool_call_id: tc.id, name: tc.name, content: result }];
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
  const prompt = process.argv[2] ?? '查知识库里关于 BM25 的内容';
  try {
    console.log(await runLoop(prompt));
    console.log('✅ m1 demo 通过');
  } catch (e) {
    if (e instanceof TODOError) {
      console.log(`❌ 仍有 TODO 未完成：${e.message}`);
      console.log('  请补全 exercises/m1/ 下对应文件的 TODO，或用 npm run assert:m1 逐条定位全部 TODO');
      process.exit(1);
    }
    throw e;
  }
}

// npm run demo:m1 入口：仅当本文件被直接运行时执行 main()（被 assert 动态 import 时不执行）
if (process.argv[1]?.includes('loop.ts')) void main();