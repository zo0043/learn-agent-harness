// test-compact.ts — 用本地 mock 模型验证压缩逻辑（不依赖外部代理）
// 跑法：npm run demo 环境里 npx tsx src/test-compact.ts
// 教学点：mock 掉 provider，harness 的每个控制层都能独立验证
import http from "node:http";

process.env.LLM_BASE_URL = "http://127.0.0.1:8787/v1";
process.env.LLM_API_KEY = "mock";

const server = http.createServer((_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      choices: [
        {
          message: { role: "assistant", content: "[mock 摘要] 目标：完成文件任务；已完成：查天气、读 README；未决：写 out/summary.md" },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 500, completion_tokens: 50 },
    }),
  );
});
await new Promise<void>((r) => server.listen(8787, "127.0.0.1", () => r()));

const { estimateTokens, compactIfNeeded } = await import("./context.js");

const big = (s: string) => s.repeat(300);
const messages = [
  { role: "system" as const, content: "system prompt" },
  { role: "user" as const, content: "task" },
  { role: "assistant" as const, content: big("step1 ") },
  { role: "tool" as const, tool_call_id: "1", name: "read_file", content: big("data ") },
  { role: "assistant" as const, content: "ok" },
  { role: "tool" as const, tool_call_id: "2", name: "list_dir", content: big("dir ") },
  { role: "assistant" as const, content: "thinking" },
];

const before = estimateTokens(messages);
const { messages: after, summarized } = await compactIfNeeded(messages, 1000, 2);
const afterTokens = estimateTokens(after);

console.log(`压缩前 tokens≈${before}（阈值 1000）`);
console.log(`摘要了 ${summarized} 条，压缩后 messages=${after.length} 条，tokens≈${afterTokens}`);
console.log("head 保留 system+user:", after[0].role === "system" && after[1].role === "user");
console.log("中间变成摘要 note:", String((after[2] as { content: string }).content).startsWith("[压缩"));
console.log("尾 2 条保留:", after.length === 5);
server.close();
if (summarized !== 3 || after.length !== 5 || afterTokens >= before) {
  console.error("断言失败");
  process.exit(1);
}
console.log("✅ 压缩逻辑验证通过");
