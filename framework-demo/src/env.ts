// 环境加载：读 framework-demo/.env（值来自 harness-demo/.env，同一本地代理），
// 映射成 Claude Agent SDK 需要的 ANTHROPIC_* 变量。
// 关键点：LLM_BASE_URL 去掉末尾 /v1 作为 ANTHROPIC_BASE_URL（SDK 自己拼 /v1/messages）。
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url)); // src/

export const PROXY = { base: "", key: "" };
export let MODEL = "";

let loaded = false;
export function loadEnv() {
  if (loaded) return;
  loaded = true;
  const raw = readFileSync(resolve(__dirname, "..", ".env"), "utf8");
  const vars: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m) vars[m[1]] = m[2];
  }
  for (const k of ["LLM_BASE_URL", "LLM_API_KEY", "LLM_MODEL"] as const) {
    if (!vars[k]) {
      console.error(`.env 缺少 ${k}（framework-demo/.env，值从 harness-demo/.env 复制）`);
      process.exit(1);
    }
  }
  PROXY.base = vars.LLM_BASE_URL.replace(/\/v1\/?$/, "");
  PROXY.key = vars.LLM_API_KEY;
  MODEL = vars.LLM_MODEL;
  // SDK 会 spawn claude 子进程，env 必须进 process.env 才能被子进程读到
  process.env.ANTHROPIC_BASE_URL = PROXY.base;
  process.env.ANTHROPIC_API_KEY = PROXY.key;
  process.env.ANTHROPIC_MODEL = MODEL;
  // CLI 后台任务（小快模型）也指向同一代理模型，避免它去请求 claude-haiku-* 这类本地没有的名字
  process.env.ANTHROPIC_SMALL_FAST_MODEL = MODEL;
  process.env.DISABLE_AUTOUPDATER = "1"; // 离线学习环境，禁掉 CLI 自更新检查
}
