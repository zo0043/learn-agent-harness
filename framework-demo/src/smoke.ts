// 冒烟：SDK 能否指向本地代理（Anthropic 格式）发一次最简单的 query
// 跑法：npm run smoke（env 从 .env 加载，见 env.ts）
import { query } from "@anthropic-ai/claude-agent-sdk";
import { loadEnv, PROXY, MODEL } from "./env.js";

loadEnv();
console.log(`[smoke] ANTHROPIC_BASE_URL=${PROXY.base} model=${MODEL}`);

const q = query({
  prompt: "只回复两个字：通了",
  options: { model: MODEL, maxTurns: 1, disallowedTools: ["Bash", "Edit", "Write", "WebFetch", "WebSearch"] },
});
for await (const m of q) {
  if (m.type === "system" && m.subtype === "init") console.log("[smoke] session_id =", m.session_id);
  if (m.type === "assistant") {
    for (const b of m.message.content) if (b.type === "text") console.log("[smoke] 模型说:", b.text);
  }
  if (m.type === "result") {
    console.log(`[smoke] result subtype=${m.subtype} is_error=${m.is_error} turns=${m.num_turns}`);
    console.log("[smoke] 最终:", m.subtype === "success" ? (m.result as string) : (m as { error?: string }).error ?? "");
  }
}
