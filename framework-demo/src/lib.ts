// 共享工具：跑一次 query() 并收集流事件 + 断言打印
// 对照 harness-demo：我们的 runAgent 要自己写 loop/流式/事件收集，
// 这里 SDK 的 query() 直接是 AsyncGenerator<SDKMessage>——"流式解析+事件模型"被框架吸收了。
import { query, type Options, type SDKMessage, type SDKAssistantMessage } from "@anthropic-ai/claude-agent-sdk";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv, MODEL } from "./env.js";

const __dirname = dirname(fileURLToPath(import.meta.url)); // src/
export const ROOT = resolve(__dirname, ".."); // framework-demo/

export interface ToolUse {
  name: string;
  input: Record<string, unknown>;
  inSubagent: boolean; // parent_tool_use_id 非空 = 发生在子代理内部
}

export interface RunResult {
  sessionId: string;
  isError: boolean;
  finalText: string; // result 消息里的最终文本
  numTurns: number;
  cost: number;
  events: SDKMessage[]; // 原始流事件（调试用）
  toolUses: ToolUse[]; // 抽出来的 tool_use 块
  subagentTexts: string[]; // 子代理内部的 assistant 文本
}

const BUILTIN_TOOLS = ["Task", "Agent", "Bash", "BashOutput", "KillShell", "Glob", "Grep", "LS", "Read", "Edit", "MultiEdit", "Write", "NotebookEdit", "WebFetch", "WebSearch", "TodoWrite", "Skill", "WebSearch"];

export async function runQuery(prompt: string, extra: Partial<Options> = {}): Promise<RunResult> {
  loadEnv();
  const events: SDKMessage[] = [];
  const toolUses: ToolUse[] = [];
  const subagentTexts: string[] = [];
  let sessionId = "";
  let isError = false;
  let finalText = "";
  let numTurns = 0;
  let cost = 0;

  try {
    for await (const m of query({ prompt, options: { model: MODEL, cwd: ROOT, maxTurns: 8, ...extra } })) {
      events.push(m);
      if (m.type === "system" && m.subtype === "init") sessionId = m.session_id;
      if (m.type === "assistant") {
        const am = m as SDKAssistantMessage;
        if (am.session_id) sessionId = am.session_id;
        for (const b of am.message.content) {
          if (b.type === "tool_use") toolUses.push({ name: b.name, input: (b.input ?? {}) as Record<string, unknown>, inSubagent: am.parent_tool_use_id != null });
          if (b.type === "text" && am.parent_tool_use_id != null) subagentTexts.push(b.text);
        }
      }
      if (m.type === "result") {
        sessionId = m.session_id;
        isError = m.is_error;
        numTurns = m.num_turns;
        cost = m.total_cost_usd ?? 0;
        finalText = m.subtype === "success" ? m.result : JSON.stringify(m).slice(0, 300);
      }
    }
  } catch (e) {
    // SDK 在 error result 时直接 throw（如 error_max_turns）——收住，记成失败而不是中断整个 demo
    isError = true;
    finalText = finalText || `query 抛错: ${e instanceof Error ? e.message : String(e)}`;
  }
  return { sessionId, isError, finalText, numTurns, cost, events, toolUses, subagentTexts };
}

// 断言式打印：✅/❌ + 累计失败数（demo 末尾据此决定退出码）。
// U-24 口径修正：断言总数由 ok() 实际计数（assertionTotal），不在任何地方硬编码——
// demo 输出是「N 断言 + 1 总体判定」（判定=demo 末尾那行总结，不是第 N+1 个断言）。
let failures = 0;
let total = 0;
export function addFailure(n = 1) { failures += n; }
export function failureCount() { return failures; }
export function assertionTotal() { return total; }
export function ok(cond: boolean, label: string, evidence = "") {
  total++;
  if (cond) console.log(`  ✅ ${label}${evidence ? `（${evidence}）` : ""}`);
  else { failures++; console.log(`  ❌ ${label}${evidence ? `（证据: ${evidence}）` : ""}`); }
}

export { BUILTIN_TOOLS };
