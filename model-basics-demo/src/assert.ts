// ============================================================
// 断言式自测 —— model-basics §S1/S4/S8
//   四模块各一可证伪用例（期望值 = 预置常量手算后写死，量级参考口径）
// ============================================================
import { kvBytesPerToken, kvTotalBytes } from './kv.js';
import { prefixStable, prefillTokens } from './cache.js';
import { ttft, tpot } from './latency.js';
import { stepCost, taskCost, withCacheDiscount, breakdown } from './cost.js';
import type { Prompt } from './types.js';

export interface Assertion {
  id: string;
  module: string;
  run(): { ok: boolean; detail: string };
}

const ok = (detail: string) => ({ ok: true, detail });
const bad = (detail: string) => ({ ok: false, detail });
const close = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

/** S8 走查的量级参考常量（Mistral-7B 量级，FP16；非某真实硬件精确承诺） */
export const PARAMS = {
  layers: 32, kvHeads: 8, headDim: 128, bytes: 2, // → 131072 B/token ≈ 0.13MB
  seqLen: 8192, concurrency: 8,                    // KV 显存用真 8K = 8192 token
  promptTokens: 8000,                               // S8 走查的「8K prompt」量级取 8000 token（§S8 用 8000/吞吐 算 prefill）
  prefillThroughput: 8000,                          // 量级：8000 tok/s → 8000 token prefill = 1.0s
  tQueue: 2.2, tNet: 0,                             // TTFT 3.2s 里 t_queue ≈ 2.2s
  weightBytes: 14e9,                                // Mistral-7B FP16 权重 ≈ 14 GB
  hbmBw: 565e9,                                     // 量级 HBM 带宽（使 tpot(B=8) ≈ 40ms）
  pIn: 1, pOut: 3,                                  // 输出 = 3× 输入（3-5× 区间内）
  cacheDiscount: 0.1,                               // 前缀缓存命中按 1 折计
} as const;

const perToken = kvBytesPerToken(PARAMS.layers, PARAMS.kvHeads, PARAMS.headDim, PARAMS.bytes);
const kvPerSeq = perToken * PARAMS.seqLen;

const goodPrompt: Prompt = { system: 'SYS', tools: 'TOOLS', history: 'HIST', dynamic: 'TS_123', dynamicFirst: false };
const badPrompt: Prompt = { system: 'SYS', tools: 'TOOLS', history: 'HIST', dynamic: 'TS_123', dynamicFirst: true };

export const ASSERTIONS: Assertion[] = [
  // ── ① kv ────────────────────────────────────────────────
  {
    id: 'kv-A', module: 'kv',
    run: () => {
      const v = kvBytesPerToken(32, 8, 128, 2);
      return v === 131072
        ? ok(`每 token KV = ${v} B ≈ 0.13 MB/token（Mistral-7B 量级，2×32×8×128×2）`)
        : bad(`v=${v}（期望 131072）`);
    },
  },
  {
    id: 'kv-B', module: 'kv',
    run: () => {
      const total = kvTotalBytes(PARAMS.seqLen, perToken, PARAMS.concurrency);
      const gb = total / 1e9;
      return total === 8589934592
        ? ok(`8K × 并发 8 总 KV = ${total} B = 8 GiB ≈ ${gb.toFixed(1)} GB（只 KV，权重另算）`)
        : bad(`total=${total}（期望 8589934592 = 8 GiB）`);
    },
  },

  // ── ② cache ─────────────────────────────────────────────
  {
    id: 'cache-A', module: 'cache',
    run: () => {
      const stable = prefixStable(goodPrompt);
      const t = prefillTokens(PARAMS.seqLen, stable, 500);
      return stable && t === 500
        ? ok(`稳定前缀命中：prefill 只算新增 ${t} token（8K 系统+工具命中）`)
        : bad(`stable=${stable} prefill=${t}（期望 true / 500）`);
    },
  },
  {
    id: 'cache-B', module: 'cache',
    run: () => {
      const stable = prefixStable(badPrompt);
      const t = prefillTokens(PARAMS.seqLen, stable, 500);
      return !stable && t === PARAMS.seqLen
        ? ok(`动态字段放最前 → 前缀每轮变、缓存永久 miss → 全 ${t} token 重算（savings=0）`)
        : bad(`stable=${stable} prefill=${t}（期望 false / ${PARAMS.seqLen}）`);
    },
  },

  // ── ③ latency ───────────────────────────────────────────
  {
    id: 'latency-A', module: 'latency',
    run: () => {
      const single = ttft(0, PARAMS.promptTokens, PARAMS.prefillThroughput, PARAMS.tNet); // 单请求基线
      const full = ttft(PARAMS.tQueue, PARAMS.promptTokens, PARAMS.prefillThroughput, PARAMS.tNet);
      const queue = full - single;
      return close(full, 3.2) && close(queue, 2.2)
        ? ok(`TTFT ${full.toFixed(1)}s = t_queue ${queue.toFixed(1)}s + t_prefill ${single.toFixed(1)}s（排队占七成）`)
        : bad(`full=${full} queue=${queue}（期望 3.2 / 2.2）`);
    },
  },
  {
    id: 'latency-B', module: 'latency',
    run: () => {
      const tp1 = tpot(PARAMS.weightBytes, 1, kvPerSeq, PARAMS.hbmBw);
      const tp8 = tpot(PARAMS.weightBytes, 8, kvPerSeq, PARAMS.hbmBw);
      return tp8 > tp1 && close(tp8 * 1000, 40, 0.5)
        ? ok(`TPOT 随并发上升：B=1 ${(tp1 * 1000).toFixed(1)}ms → B=8 ${(tp8 * 1000).toFixed(1)}ms（≈40ms，B 份 KV 争带宽）`)
        : bad(`tp1=${tp1} tp8=${tp8}（期望 tp8 > tp1 且 tp8 ≈ 40ms）`);
    },
  },

  // ── ④ cost ──────────────────────────────────────────────
  {
    id: 'cost-A', module: 'cost',
    run: () => {
      const s = stepCost(8000, 2000, PARAMS.pIn, PARAMS.pOut);
      const ratio = PARAMS.pOut / PARAMS.pIn;
      return s === 14000 && ratio >= 3 && ratio <= 5
        ? ok(`stepCost(8K入,2K出) = ${s} = 输入×${PARAMS.pIn} + 输出×${PARAMS.pOut}（输出单价 ${ratio}× 输入，3-5× 区间）`)
        : bad(`s=${s} ratio=${ratio}（期望 14000 / 3..5）`);
    },
  },
  {
    id: 'cost-B', module: 'cost',
    run: () => {
      const base = stepCost(8000, 2000, PARAMS.pIn, PARAMS.pOut);       // 14000
      const incSteps = 12 * base - 8 * base;                              // 8→12 步增量
      const trimmed = taskCost(Array(8).fill(stepCost(6400, 2000, PARAMS.pIn, PARAMS.pOut))); // 砍 20% prompt
      const savePrompt = 8 * base - trimmed;
      return incSteps > savePrompt
        ? ok(`步数 8→12 增量 ${incSteps} > 砍 20% prompt 省 ${savePrompt}（少步 > 省字）`)
        : bad(`inc=${incSteps} save=${savePrompt}（期望步数放大更值钱）`);
    },
  },
  {
    id: 'cost-C', module: 'cost',
    run: () => {
      const inputBase = 8000 * PARAMS.pIn; // prefill 基准 8000
      const discounted = withCacheDiscount(inputBase, 8000, 7500, PARAMS.cacheDiscount); // 命中 7500 按 1 折
      return discounted === 1250
        ? ok(`caching 折扣只打 prefill 命中段：8000 → ${discounted}（7500×0.1 + 500×1）；decode 另行原价不折`)
        : bad(`discounted=${discounted}（期望 1250）`);
    },
  },
  {
    id: 'cost-D', module: 'cost',
    run: () => {
      const b = breakdown(8000 * PARAMS.pIn, 2000 * PARAMS.pOut);
      return b.prefill === 8000 && b.decode === 6000
        ? ok(`prefill/decode 归因：prefill=${b.prefill}（输入）、decode=${b.decode}（输出）两行可解释拆分`)
        : bad(`prefill=${b.prefill} decode=${b.decode}（期望 8000 / 6000）`);
    },
  },
];