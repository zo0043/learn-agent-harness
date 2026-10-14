// ============================================================
// 最小 agent loop —— M0 半成品（starter）
//   给全：TODOError / debug 计数 / registry / main()
//   补全（三处 TODO）：m0.1 解析 → m0.2 执行回填 → m0.3 loop 组装收口
// ============================================================
import { buildRegistry, callTool } from './tools.js';
import { mockModel } from './model.js';
import type { Action, Message, ToolCall } from './types.js';

/** 未完成的练习点占位：补全对应函数后，删除/替换该 throw */
export class TODOError extends Error {}

/** 调试计数：runLoop 实际执行工具的次数（供断言 a3 核对「真的调了 1 次工具」） */
export const debug = { toolCalls: 0 };

const registry = buildRegistry();

export function parseModelReply(_raw: string): Action {
  // TODO m0.1：JSON.parse(raw)，判别并校验成 Action（tool_call / deliver 两种形状之一），否则抛错
  throw new TODOError('m0.1: 把模型 JSON 回复解析成 tool_call 或 deliver 动作');
}

export async function executeAndBackfill(_messages: Message[], _tc: ToolCall): Promise<Message[]> {
  // TODO m0.2：callTool(registry, tc.name, tc.arguments) 执行，把结果作为 {role:'tool',…} 回写 messages 副本并返回
  throw new TODOError('m0.2: 执行工具并把结果回填 message');
}

export async function runLoop(_prompt: string, _maxSteps = 3): Promise<string> {
  // TODO m0.3：messages=[system,user]；循环：mockModel→parseModelReply→tool_call 则 executeAndBackfill 再想、deliver 则收口；超 maxSteps 抛错
  throw new TODOError('m0.3: 组装想→做→说 loop 并收口');
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