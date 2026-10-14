// ============================================================
// 最小 agent loop —— M3（给全：继承 M2 solution 补全版 + durable/span 接线）
//   parseModelReply / runLoop 照搬 M2；executeAndBackfill 在 M2 四通道接线前加 durable 双锚点
//   （执行前 journal.append(intent)、执行后 append(exec) + 每 N 步 writeCheckpoint）；
//   span 树埋点与「durable 恢复 / SSE / 重试 / 路由成本」演示放在 main()。判定挖在 durable.ts/otel.ts。
// ============================================================
import { buildRegistry, callTool } from './tools.js';
import { mockModel, mockSSEFrames } from './model.js';
import { decide } from './policy.js';
import { callMCP, sanitizeToolOutput, audit } from './mcp.js';
import { runSandboxed } from './sandbox.js';
import { runEval } from './eval.js';
import { Store, CHECKPOINT_EVERY, recover, DEMO_PLAN, World } from './durable.js';
import { consumeStream } from './stream.js';
import { withRetry, prefixKey, PrefixCache } from './retry.js';
import { route, PROVIDERS } from './router.js';
import { spanStart, spanEnd, spanTree, spanSummary, resetSpans, EXPECTED_ROOT } from './otel.js';
import { type Action, type Message, type ToolCall, TODOError } from './types.js';

/** 调试计数：runLoop 实际执行工具的次数（供断言核对） */
export const debug = { toolCalls: 0 };

const registry = buildRegistry();
/** 远程工具：走 MCP rpcCall + 供应链防御，不经本地四通道 policy */
const REMOTE_TOOLS = new Set(['web_search']);

// —— durable 单例（懒实例化：starter 里 new Store() 抛 TODOError 时不污染模块求值路径） ——
let store: Store | null = null;
let loopStep = 0;
function durableStore(): Store {
  if (!store) store = new Store();
  return store;
}

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
  // durable 前锚点：intent 先落 journal（进程被杀也不丢「我想做」）
  const st = durableStore();
  loopStep += 1;
  st.append({ kind: 'intent', step: loopStep, name: tc.name, stepKind: 'readonly', tool: tc.name, args: tc.arguments, idemKey: `loop:${loopStep}` });

  let content: string;
  if (REMOTE_TOOLS.has(tc.name)) {
    const raw = await callMCP(tc.name, tc.arguments);
    content = sanitizeToolOutput(raw).content;
  } else {
    const verdict = decide(tc.name, tc.arguments);
    if (verdict.channel === 'deny' || verdict.channel === 'approve') {
      content = `[${verdict.channel}] ${verdict.reason}`;
    } else if (verdict.channel === 'sandbox') {
      content = runSandboxed(tc.name, tc.arguments);
    } else {
      content = await callTool(registry, tc.name, tc.arguments);
    }
  }

  // durable 后锚点：exec 落 journal；每 CHECKPOINT_EVERY 步落一个校验和快照
  st.append({ kind: 'exec', step: loopStep, name: tc.name, result: content, sideEffect: false });
  if (loopStep % CHECKPOINT_EVERY === 0) st.writeCheckpoint([], loopStep);

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
    console.log(await runLoop(prompt));        // M2 loop，每步带 durable journal 双锚点
    runEval();                                  // golden set 评测门禁（PASS n/N）
    console.log(`审计摘要：${audit.digest()}`);

    // —— M3 新增演示（全部离线确定性；判定逻辑在 durable/stream/retry/router/otel） ——
    const r = recover(DEMO_PLAN, new Store(), new World(), 'C');
    console.log(`durable 恢复(C)：messageDeliveries=${r.sideEffects.messageDeliveries}；幂等写收敛=${r.idempotentWrite.value}`);

    const s = await consumeStream(mockSSEFrames());
    console.log(`SSE：content=${JSON.stringify(s.content)} toolCalls=${s.toolCalls.length} incomplete=${s.incomplete}`);

    let calls = 0;
    const rt = await withRetry(async () => { calls += 1; if (calls === 1) throw { signal: { status: 500 } }; }, 3);
    const cache = new PrefixCache();
    cache.hit(prefixKey([{ role: 'user', content: '静默前缀' }]));
    const hit = cache.hit(prefixKey([{ role: 'user', content: '静默前缀' }]));
    console.log(`重试：${rt.diagnostic}；缓存命中折扣 inputPriceX=${hit.inputPriceX}`);

    const prov = route({ needsToolCalling: true, needsStructured: true, minWindowTokens: 20000 }, PROVIDERS);
    console.log(`路由：${prov?.id ?? 'null'}`);

    resetSpans();
    const root = spanStart(EXPECTED_ROOT, { 'gen_ai.agent.name': 'my-agent' });
    const chat = spanStart('chat', { 'gen_ai.request.model': prov?.id ?? 'p-capable', 'gen_ai.usage.input_tokens': 10, 'gen_ai.usage.output_tokens': 3, cost: 0.012 });
    spanEnd(chat, { 'gen_ai.response.finish_reasons': ['tool_calls'] });
    const toolSpan = spanStart('execute_tool', { 'gen_ai.tool.name': 'web_search', cost: 0.001 });
    spanEnd(toolSpan, { 'harness.tool.status': 'ok' });
    spanEnd(root, { 'gen_ai.usage.total_tokens': 13 });
    console.log(`span 摘要：total=${spanSummary(spanTree()).total} byName=${JSON.stringify(spanSummary(spanTree()).byName)}`);

    console.log('✅ m3 demo 通过');
  } catch (e) {
    if (e instanceof TODOError) {
      console.log(`❌ 仍有 TODO 未完成：${e.message}`);
      console.log('  请补全 exercises/m3/ 下对应文件的 TODO，或用 npm run assert:m3 逐条定位全部 TODO');
      process.exit(1);
    }
    throw e;
  }
}

// npm run demo:m3 入口：仅当本文件被直接运行时执行 main()（被 assert 动态 import 时不执行）
if (process.argv[1]?.includes('loop.ts')) void main();