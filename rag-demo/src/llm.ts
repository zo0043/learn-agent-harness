/**
 * LLM 客户端——gpt-load 代理（OpenAI 兼容 /chat/completions，非流式）。
 *
 * harness-demo 5 个 bug 的教训直接用在这里：
 *   ① __dirname 必须是目录：dirname(fileURLToPath(import.meta.url))
 *   ② .env 加载必须在模块顶部：ES import 提升会让其他模块的 import 期
 *      process.env 读取早于入口代码执行
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

{
  const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
}

const BASE = (process.env.LLM_BASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.LLM_API_KEY ?? "";
const MODEL = process.env.LLM_MODEL ?? "qwen3.8-flash-next";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chat(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  if (!BASE || !KEY) throw new Error("LLM_BASE_URL / LLM_API_KEY 未配置（rag-demo/.env）");
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: opts.temperature ?? 0.2,
      max_tokens: opts.maxTokens ?? 800,
    }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { choices: { message: { content: string | null } }[] };
  return data.choices[0]?.message?.content ?? "";
}
