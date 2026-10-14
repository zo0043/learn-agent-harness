// ============================================================
// prompt caching —— API 与多模型路由 §S2
//   前缀 hash + 命中计数 + 折扣（命中输入 ×0.5）
//   教学点：缓存键必须稳定——把 now()/随机段塞进前缀会毁掉命中
// ============================================================

/** 确定性 hash（djb2 → 16 进制），不用 Date.now / Math.random，跨次逐字节一致 */
export function djb2(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h * 33) ^ input.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}

/** 易变段标记：含这些的行不进稳定前缀（时间戳 / 随机 / 动态 id） */
const VOLATILE = /<>|<now>|<random>|<id>|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export interface PrefixMsg {
  role: string;
  content: string;
}

/** 稳定前缀 key：只取 role+content，剔除易变段（正确做法） */
export function prefixKey(messages: PrefixMsg[]): string {
  const stable = messages
    .filter((m) => !VOLATILE.test(m.content))
    .map((m) => `${m.role}:${m.content}`)
    .join("\n");
  return djb2(stable);
}

/** 反模式对照：把整段原文（含易变时间戳/随机段）直接 hash —— 动态值毁前缀 */
export function naivePrefixKey(messages: PrefixMsg[]): string {
  return djb2(JSON.stringify(messages));
}

export interface CacheHit {
  hit: boolean;
  inputPriceX: number; // 命中 → 0.5×，未命中 → 1
  hits: number; // 累计命中次数
}

export class PrefixCache {
  private last = "";
  private hits = 0;

  hit(prefix: string): CacheHit {
    const hit = this.last !== "" && prefix === this.last;
    if (hit) this.hits += 1;
    this.last = prefix;
    return { hit, inputPriceX: hit ? 0.5 : 1, hits: this.hits };
  }
}