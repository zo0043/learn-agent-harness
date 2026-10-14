// ============================================================
// span 树埋点 —— M3（挖 m3.5）：invoke_agent → chat / execute_tool
//   主线自建轻量 SpanNode 记录器（不引 @opentelemetry）；成本进 attrs.cost 归因。
// ============================================================
import { TODOError, type SpanNode } from './types.js';

export const EXPECTED_ROOT = 'invoke_agent';

let root: SpanNode | null = null;
let stack: SpanNode[] = [];

/** 清空 span 树（demo/断言开头调用，保证确定性） */
export function resetSpans(): void {
  root = null;
  stack = [];
}

export function spanStart(_name: string, _attrs: Record<string, unknown>): SpanNode {
  // TODO m3.5：建 span 节点并压入当前树（无根则作为根）；返回该节点
  throw new TODOError('m3.5: 实现 span 树埋点（invoke_agent/chat/execute_tool + 成本字段归因）');
}

export function spanEnd(_node: SpanNode, _attrs: Record<string, unknown>): void {
  // TODO m3.5：合并结束属性并弹出栈顶
  throw new TODOError('m3.5: 实现 span 树埋点（invoke_agent/chat/execute_tool + 成本字段归因）');
}

/** 返回根 span（给全 getter） */
export function spanTree(): SpanNode {
  if (!root) throw new Error('无根 span：先 spanStart("invoke_agent")');
  return root;
}

export function spanSummary(_node: SpanNode): { total: number; byName: Record<string, number> } {
  // TODO m3.5：确定性 span 摘要——按名计数，供断言
  throw new TODOError('m3.5: 实现 span 摘要与成本归因');
}