/**
 * Hash embedder——Embedder 接口的本课实现（S2）。
 *
 * 它是什么：token → FNV-1a hash → 768 维桶 → 计数累积 → L2 归一（T2：归一化后点积 = cosine）。
 * 它不是什么：语义模型。它是"表面形式袋子"（bag of surface forms）：
 *   ✅ 相同/重复的词能命中（稀有术语、代码、模型名——token 完全一致）
 *   ❌ 同义词命不中（"压缩" 与 "compact" 是不同 token → 向量近似正交）
 *
 * 为什么用它（刻意选择，不是妥协）：
 *   1. 全离线、确定性 → 可复现（沙箱与凭据主题；同一输入永远同一向量，断点可重放）
 *   2. 向量可以直接打印检查——你能"看见"检索在干什么
 *   3. 同义盲区从"故事"变成 demo 里的实证——那时你才真懂语义模型在卖什么
 */

import { tokenize } from "./tokenizer.js";
import type { Embedder } from "./types.js";

/** 维度是常数（T1：与输入长度无关）——换真模型时这个数跟着模型走 */
export const DIM = 768;

/** FNV-1a 32-bit——稳定、零依赖的字符串 hash */
export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export class HashEmbedder implements Embedder {
  readonly dim = DIM;

  embed(texts: string[]): number[][] {
    return texts.map((text) => {
      const v = new Array<number>(this.dim).fill(0);
      for (const tok of tokenize(text)) {
        v[fnv1a(tok) % this.dim] += 1; // 计数：tf 隐性加进向量方向
      }
      // L2 归一（T2）：|v| = 1 → 之后点积 = cosine
      const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
      return norm > 0 ? v.map((x) => x / norm) : v;
    });
  }
}
