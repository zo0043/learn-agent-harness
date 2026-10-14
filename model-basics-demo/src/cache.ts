// ============================================================
// cache —— 前缀缓存命中 + savings（notes/model-basics.md §S8 步骤 3）
//   稳定前缀命中（动态字段放末尾）→ prefill 只算新增段；
//   动态字段放最前 → 前缀每轮变、缓存永久 miss → 全量重算。
// ============================================================
import type { Prompt } from './types.js';

/** 稳定前缀判定：dynamicFirst=false（动态字段在末尾）→ 前缀稳定 → hit */
export function prefixStable(prompt: Prompt): boolean {
  return !prompt.dynamicFirst;
}

/** stable=true → 只 prefill newTokens；stable=false → 全 promptLen 重算 */
export function prefillTokens(promptLen: number, stable: boolean, newTokens: number): number {
  return stable ? newTokens : promptLen;
}