// ============================================================
// 最小 agent loop —— M0 参考答案（solution）
//   m0.1 解析 → m0.2 执行回填 → m0.3 loop 组装收口（与 starter 仅此三函数体不同）
// ============================================================
import { buildRegistry, callTool } from './tools.js';
import { mockModel } from './model.js';
import type { Action, Message, ToolCall } from './types.js';

/** 未完成的练习点占位（solution 不再 throw，但保留类供断言捕获 starter 的未完成态） */
export class TODOError extends Error {}

/** 调试计数：runLoop 实际执行工具的次数（供断言 a3 核对「真的调了 1 次工具」） */
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
  const prompt = process.argv[2] ?? '读 notes/hello.txt 的内容';
  try {
    console.log(await runLoop(prompt));
    console.log('✅ m0 demo 通过');
  } catch (e) {
    if (e instanceof TODOError) {
      console.log(`❌ 仍有 TODO 未完成：${e.message}`);
      console.log('  请补全 exercises/m0/ 下 loop.ts 的对应 TODO，或用 npm run assert:m0 逐条定位全部 TODO');
      process.exit(1);
    }
    throw e;
  }
}

// npm run demo 入口：仅当本文件被直接运行时执行 main()（被 assert 动态 import 时不执行）
if (process.argv[1]?.includes('loop.ts')) void main();