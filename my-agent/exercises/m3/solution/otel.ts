// ============================================================
// span 树埋点 —— M3：invoke_agent → chat / execute_tool
//   主线自建轻量 SpanNode 记录器（不引 @opentelemetry）；成本进 attrs.cost 归因。
// ============================================================
import type { SpanNode } from './types.js';

export const EXPECTED_ROOT = 'invoke_agent';

let root: SpanNode | null = null;
let stack: SpanNode[] = [];

/** 清空 span 树（demo/断言开头调用，保证确定性） */
export function resetSpans(): void {
  root = null;
  stack = [];
}

export function spanStart(name: string, attrs: Record<string, unknown>): SpanNode {
  const node: SpanNode = { name, attrs, children: [] };
  if (stack.length === 0) root = node;
  else stack[stack.length - 1].children.push(node);
  stack.push(node);
  return node;
}

export function spanEnd(node: SpanNode, attrs: Record<string, unknown>): void {
  Object.assign(node.attrs, attrs);
  if (stack[stack.length - 1] === node) stack.pop();
  else stack.length = 0; // 栈顶不符 → 容错清空（防御性）
}

/** 返回根 span（给全 getter） */
export function spanTree(): SpanNode {
  if (!root) throw new Error('无根 span：先 spanStart("invoke_agent")');
  return root;
}

/** 确定性 span 摘要：按名计数（供断言比对） */
export function spanSummary(node: SpanNode): { total: number; byName: Record<string, number> } {
  const byName: Record<string, number> = {};
  let total = 0;
  const walk = (n: SpanNode) => {
    total += 1;
    byName[n.name] = (byName[n.name] ?? 0) + 1;
    for (const c of n.children) walk(c);
  };
  walk(node);
  return { total, byName };
}