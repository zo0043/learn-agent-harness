// ============================================================
// 失败分类 + 重试 —— API 与多模型路由 §S2
//   4xx（契约违约）不重试；429 / 5xx / timeout / eof 指数退避 + jitter 重试
//   jitter 用固定 seed 的确定性伪随机（mulberry32），不用 Math.random()
// ============================================================
import type { FailureClass, RetryDecision } from "./types.js";

/** 确定性伪随机 mulberry32（固定 seed） */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function classify(signal: { status?: number; finish?: string; err?: string }): FailureClass {
  if (signal.status === 400) return "400";
  if (signal.status === 429) return "429";
  if (signal.status !== undefined && signal.status >= 500) return "5xx";
  if (signal.err === "timeout") return "timeout";
  if (signal.finish === "refusal" || signal.err === "refusal") return "refusal";
  if (signal.finish === "incomplete" || signal.err === "eof" || signal.err === "error-frame") return "eof";
  return "refusal"; // 未知失败按 refusal：不盲目重试
}

/** 指数退避（逻辑毫秒）+ jitter：base = 2^attempt × 100ms；429 退避更长（50% jitter） */
export function backoffMs(cls: FailureClass, attempt: number): number {
  const base = Math.pow(2, attempt) * 100;
  const r = mulberry32(1000 + attempt)();
  const ratio = cls === "429" ? 0.5 : 0.3;
  return base + Math.floor(r * base * ratio);
}

/**
 * 重试。fn 失败必须抛带 signal 的错误；4xx / refusal 不重试；其余按 budget 指数退避重试。
 * budget 耗尽 → 返回失败（交给上层降级/放弃）。
 */
export async function withRetry(
  fn: () => Promise<unknown>,
  budget: number,
  sleep: (ms: number) => Promise<void> = async () => {},
): Promise<RetryDecision> {
  let retried = 0;
  for (let attempt = 0; ; attempt++) {
    try {
      await fn();
      return { retried, ok: true, diagnostic: attempt === 0 ? "首次成功" : `第 ${attempt} 次重试后成功` };
    } catch (e) {
      const signal = (e as { signal?: { status?: number; finish?: string; err?: string } }).signal ?? {};
      const cls = classify(signal);
      if (cls === "400") return { retried, ok: false, diagnostic: "4xx 契约违约：不重试（路由错位/参数错）" };
      if (cls === "refusal") return { retried, ok: false, diagnostic: "refusal / 未知失败：不重试" };
      if (retried >= budget) {
        return { retried, ok: false, diagnostic: `重试预算 ${budget} 耗尽（连续 ${cls}）——交给上层降级 / 放弃` };
      }
      await sleep(backoffMs(cls, retried));
      retried += 1;
    }
  }
}