// ============================================================
// 入口 —— model-basics §S1/S4/S8
//   ① 四模块断言自测（10 条）② S8 延迟归因六步走查重放（用脚本函数逐条重算）
//   全离线零 key；输入全部预置常量；跑 N 次逐字节一致
// ============================================================
import { kvBytesPerToken, kvTotalBytes } from './kv.js';
import { prefillTokens, prefixStable } from './cache.js';
import { ttft, tpot } from './latency.js';
import { stepCost, taskCost, withCacheDiscount } from './cost.js';
import { ASSERTIONS, PARAMS } from './assert.js';
import type { Prompt } from './types.js';

const MODULE_ORDER = ['kv', 'cache', 'latency', 'cost'];
const MODULE_LABEL: Record<string, string> = {
  kv: '① kv（KV cache 显存估算）',
  cache: '② cache（前缀缓存 savings）',
  latency: '③ latency（TTFT/TPOT）',
  cost: '④ cost（总成本拆分）',
};

const log = console.log;
const ms = (s: number) => `${(s * 1000).toFixed(1)}ms`;

function main() {
  let allOk = true;
  let total = 0;

  log('model-basics-demo —— KV cache / 推理成本数值走查（量级参考，全离线零 key）');
  for (const mod of MODULE_ORDER) {
    log(`\n${MODULE_LABEL[mod]}`);
    for (const a of ASSERTIONS.filter((x) => x.module === mod)) {
      const r = a.run();
      total += 1;
      if (!r.ok) allOk = false;
      log(`  ${r.ok ? '✅' : '❌'} [${a.id}] ${r.detail}`);
    }
  }

  log('\n════════════════════════════════════════');
  log('S8 延迟归因六步走查重放（notes/model-basics.md §S8，脚本函数逐条重算）');
  const perToken = kvBytesPerToken(PARAMS.layers, PARAMS.kvHeads, PARAMS.headDim, PARAMS.bytes);
  const kvPerSeq = perToken * PARAMS.seqLen;

  log(`\n[步骤 1] 拆 TTFT / TPOT（给定现象：TTFT 3.2s / TPOT 40ms / 并发 ${PARAMS.concurrency}）`);
  const ttftFull = ttft(PARAMS.tQueue, PARAMS.promptTokens, PARAMS.prefillThroughput, PARAMS.tNet);
  const tp8 = tpot(PARAMS.weightBytes, PARAMS.concurrency, kvPerSeq, PARAMS.hbmBw);
  log(`  ttft(2.2, ${PARAMS.promptTokens}, ${PARAMS.prefillThroughput}, 0) = ${ttftFull.toFixed(1)}s；tpot(B=8) = ${ms(tp8)}`);

  log(`\n[步骤 2] 单请求基线对照（只做一件事：分清排队 vs prefill）`);
  const single = ttft(0, PARAMS.promptTokens, PARAMS.prefillThroughput, PARAMS.tNet);
  const queue = ttftFull - single;
  log(`  单请求同 prompt → TTFT ≈ ${single.toFixed(1)}s → t_queue = 3.2 − 1.0 = ${queue.toFixed(1)}s（排队占七成）`);

  log(`\n[步骤 3] 看 prompt 长度与 KV cache 命中`);
  const totalKv = kvTotalBytes(PARAMS.seqLen, perToken, PARAMS.concurrency);
  log(`  KV/token = ${perToken} B ≈ 0.13 MB/token；8K → ${(kvPerSeq / 2 ** 30).toFixed(0)} GiB/路；并发 8 → ${(totalKv / 2 ** 30).toFixed(0)} GiB 只 KV（权重另算）`);
  const missPrefill = PARAMS.promptTokens / PARAMS.prefillThroughput; // 前缀 miss → 全 8K 重算
  const hitPrefill = 500 / PARAMS.prefillThroughput;                  // 命中 → 只算新增 ~500 token
  const prefillSpeedup = PARAMS.promptTokens / 500;
  log(`  前缀 miss → 每轮全 ${PARAMS.promptTokens} 重算 = ${missPrefill.toFixed(2)}s；命中 → 500 token = ${hitPrefill.toFixed(3)}s（×${prefillSpeedup} 减少）`);

  log(`\n[步骤 4] 看 batch / 并发`);
  const tp1 = tpot(PARAMS.weightBytes, 1, kvPerSeq, PARAMS.hbmBw);
  log(`  tpot(B=1) = ${ms(tp1)} vs tpot(B=8) = ${ms(tp8)}；8 路合计吞吐 ≈ 8 / ${tp8.toFixed(3)} = ${Math.round(8 / tp8)} tok/s（decode 带宽受限）`);

  log(`\n[步骤 5] 量化 / speculative decoding 能救什么（叙事，不计算）`);
  log('  量化砍 weight/BW；speculative decoding 用 draft 模型抢跑 —— 都救 TPOT，对 TTFT 几乎无用（首 token 仍走完整 prefill）');
  log('  本例主矛盾 TTFT=3.2s，speculative 只能改 40ms 的 TPOT → 先别上它');

  log(`\n[步骤 6] 三条可执行优化（收口）`);
  const speedup = Math.round(PARAMS.promptTokens / 500);
  log(`  ① 修前缀缓存：动态字段移到 prompt 末尾 → prefill ${missPrefill.toFixed(2)}s → ~${hitPrefill.toFixed(3)}s（×${speedup}），TTFT 有望回 1s 内`);
  log('  ② 准入与排队控制：按 HBM 带宽而非并发数定容量；确认带宽饱和先量化/换 GQA，不硬加并发');
  log('  ③ 压 prompt + 补 decode 手段：just-in-time 检索只送必要上下文（prefill 与 KV 同降）；decode 侧再上 speculative / 小模型分级');

  log('\n════════════════════════════════════════');
  log(`[汇总] 四模块断言 ${total} 条${allOk ? ' 全绿' : ''}；S8 六步走查已用脚本函数重算（排队 ${queue.toFixed(1)}s → KV 8GB → 前缀 miss ${missPrefill.toFixed(2)}s vs 命中 ${hitPrefill.toFixed(3)}s）`);

  if (!allOk) {
    log('\n❌ 存在未通过的验收项');
    process.exit(1);
  }
  log(`\n✅ model-basics 验收通过：四模块断言全绿`);
}

main();