// ============================================================
// M3 断言 —— 跑 starter 红 / solution 绿（argv[2]==='solution' 切目标）
//   五条断言编号 = TODO 编号（a1 durable / a2 SSE / a3 重试+cache / a4 路由+成本 / a5 span）
// ============================================================
import type { SSEFrame } from '../exercises/m3/starter/types.js';

const target = process.argv[2] === 'solution' ? 'solution' : 'starter';
const { TODOError } = await import(`../exercises/m3/${target}/types.js`);
const dur = await import(`../exercises/m3/${target}/durable.ts`);
const stm = await import(`../exercises/m3/${target}/stream.ts`);
const ret = await import(`../exercises/m3/${target}/retry.ts`);
const rtr = await import(`../exercises/m3/${target}/router.ts`);
const otl = await import(`../exercises/m3/${target}/otel.ts`);

const { recover, DEMO_PLAN, Store, World } = dur;
const { consumeStream, StreamError } = stm;
const { classify, withRetry, prefixKey, PrefixCache } = ret;
const { route, withFallback, stepCost, aggregateCosts, PROVIDERS } = rtr;
const { spanStart, spanEnd, spanTree, spanSummary, resetSpans } = otl;

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

// a1 崩溃恢复：A/B/C 恢复后 messageDeliveries===1 + 幂等写收敛 + 每步处置正确
await check('m3.1 崩溃恢复', 'A/B/C → messageDeliveries===1 + 幂等写收敛 + 处置正确', () => {
  const expectDispo: Record<string, string> = { A: 'replay', B: 'unknown-confirm-exec', C: 'skip' };
  for (const cp of ['A', 'B', 'C'] as const) {
    const r = recover(DEMO_PLAN, new Store(), new World(), cp);
    if (r.sideEffects.messageDeliveries !== 1) return false;
    if (r.idempotentWrite.value !== '报告 rpt-1') return false;
    const send = r.steps.find((d: { step: { step: number }; disposition: string }) => d.step.step === 3);
    if (!send || send.disposition !== expectDispo[cp]) return false;
  }
  return true;
});

// a2 SSE 流式：跨帧 arguments 拼成合法 JSON；error 帧抛；断流 incomplete
await check('m3.2 SSE 流式', '跨帧拼 arguments + error 帧抛 + 断流 incomplete', async () => {
  const frames: SSEFrame[] = [
    { type: 'delta', content: '结论：' },
    { type: 'delta', tool_calls: [{ index: 0, id: 'call_1', name: 'search' }] },
    { type: 'delta', tool_calls: [{ index: 0, arguments: '{"query":"Q1' }] },
    { type: 'delta', tool_calls: [{ index: 0, arguments: ' 关键数据"}' }] },
    { type: 'usage', input: 10, output: 3, model: 'p-fast' },
    { type: 'finish', finish_reason: 'tool_calls' },
  ];
  const res = await consumeStream(frames);
  const tc = res.toolCalls[0];
  const parseOk = tc.name === 'search' && (tc.arguments as { query?: string }).query === 'Q1 关键数据' && res.incomplete === false;

  let streamErr = false;
  try {
    await consumeStream([{ type: 'error', message: 'provider 内部错误' }]);
  } catch (e) {
    streamErr = e instanceof StreamError;
  }

  const eofRes = await consumeStream([{ type: 'delta', content: 'premature' }]);
  const eofOk = eofRes.incomplete === true;

  return parseOk && streamErr && eofOk;
});

// a3 重试+cache：4xx/未知不重试；5xx 退避重试成功；prefix 稳定 + 命中 0.5×
await check('m3.3 重试+cache', "4xx 不重试 / 5xx 重试成功 / prefix 命中 0.5×", async () => {
  const c400 = classify({ status: 400 }) === '400';
  const cUnknown = classify({}) === 'refusal';

  let calls = 0;
  const r = await withRetry(async () => { calls += 1; if (calls === 1) throw { signal: { status: 500 } }; }, 3);
  const retryOk = r.ok && r.retried === 1 && calls === 2;

  const volatileFiltered = prefixKey([{ role: 'user', content: 'a <now>' }]) === prefixKey([{ role: 'user', content: 'a <random>' }]);
  const k = prefixKey([{ role: 'user', content: '请总结这段' }]);
  const cache = new PrefixCache();
  cache.hit(k);
  const hit = cache.hit(k);

  return c400 && cUnknown && retryOk && volatileFiltered && hit.hit && hit.inputPriceX === 0.5;
});

// a4 路由+成本：能力矩阵路由 + 降级 + 成本按模型归因
await check('m3.4 路由+成本', '能力矩阵路由 + 降级阶梯 + 成本归因', () => {
  const cheap = route({ needsToolCalling: false, needsStructured: false, minWindowTokens: 100 }, PROVIDERS);
  const capable = route({ needsToolCalling: true, needsStructured: true, minWindowTokens: 20000 }, PROVIDERS);
  const fbOk = withFallback({ needsToolCalling: false, needsStructured: false, minWindowTokens: 3000 }, PROVIDERS, new Set(['p-capable']));
  const fbNo = withFallback({ needsToolCalling: true, needsStructured: true, minWindowTokens: 20000 }, PROVIDERS, new Set(['p-fast']));
  const c1 = stepCost('p-fast', { input: 1000, output: 100 });
  const agg = aggregateCosts([{ model: 'p-fast', cost: 0.65 }, { model: 'p-fast', cost: 0.35 }, { model: 'p-capable', cost: 4.5 }]);

  return (
    cheap?.id === 'p-fast' &&
    capable?.id === 'p-capable' &&
    fbOk.fell &&
    fbOk.provider?.id === 'p-capable' &&
    fbNo.provider === null &&
    fbNo.fell &&
    c1 === 0.65 &&
    agg.byModel['p-fast'] === 1 &&
    agg.byModel['p-capable'] === 4.5 &&
    agg.total === 5.5
  );
});

// a5 span 埋点：根名 invoke_agent + 子 span 数=总数−1 + byName 计数 + cost 归因
await check('m3.5 span 埋点', 'invoke_agent 根 + chat/execute_tool 子 span + cost 归因', () => {
  resetSpans();
  const root = spanStart('invoke_agent', { 'gen_ai.agent.name': 'my-agent' });
  const chat = spanStart('chat', { 'gen_ai.request.model': 'p-capable', cost: 0.012 });
  spanEnd(chat, { 'gen_ai.response.finish_reasons': ['stop'] });
  const t1 = spanStart('execute_tool', { 'gen_ai.tool.name': 'search', cost: 0.001 });
  spanEnd(t1, { 'harness.tool.status': 'ok' });
  const t2 = spanStart('execute_tool', { 'gen_ai.tool.name': 'read_file', cost: 0.002 });
  spanEnd(t2, { 'harness.tool.status': 'ok' });
  spanEnd(root, { 'gen_ai.usage.total_tokens': 13 });

  const tree = spanTree();
  const sum = spanSummary(tree);
  const rootOk = tree.name === 'invoke_agent';
  const byNameOk = sum.byName['invoke_agent'] === 1 && sum.byName['chat'] === 1 && sum.byName['execute_tool'] === 2;
  const childOk = tree.children.length === 3 && sum.total === 4; // 子 span 数 = 总数 − 1
  const costOk = chat.attrs.cost === 0.012 && t1.attrs.cost === 0.001 && t2.attrs.cost === 0.002;
  return rootOk && byNameOk && childOk && costOk;
});

if (failures === 0) {
  console.log('✅ m3 验收通过');
} else {
  console.log(`❌ m3 验收通过（${failures} 条未过）`);
  process.exitCode = 1;
}