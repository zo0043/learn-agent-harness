// ============================================================
// 类型定义 —— model-basics §S1/S4/S8
//   纯计算类型：KV 估算 / 前缀缓存 / 延迟估算 / 成本拆分
// ============================================================

/** KV cache 显存估算结果（bytes） */
export interface KvEstimate {
  bytesPerToken: number; // 每 token 的 K+V 字节
  bytesPerSeq: number;   // 每路序列（seqLen × bytesPerToken）
  totalBytes: number;    // seqLen × bytesPerToken × concurrency
}

/**
 * Prompt 结构（用于前缀缓存命中判定）。
 * 教学约定：system/tools/history 是「稳定前缀」，dynamic 是每轮都会变的字段；
 * dynamicFirst = true 表示把动态字段放到了 prompt 最前（坏模板 → 前缀每轮变 → cache miss）。
 * 说明：规格 §5.2 的 4 字段之外补了 dynamicFirst 一个布尔，把「动态字段位置」变成可机器判定项。
 */
export interface Prompt {
  system: string;
  tools: string;
  history: string;
  dynamic: string;
  dynamicFirst: boolean;
}

/** 延迟估算（秒） */
export interface LatencyEstimate {
  ttft: number; // 首 token 时间
  tpot: number; // 后续每 token 间隔（字速率）
}

/** 单步成本拆成 prefill（输入侧）与 decode（输出侧）两行 */
export interface CostBreakdown {
  prefill: number;
  decode: number;
}