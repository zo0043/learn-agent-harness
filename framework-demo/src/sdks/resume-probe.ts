// resume-probe.ts —— 跨进程会话 resume 探针（compare:assert A11 专用）
//
// 为什么必须跨进程：同一 node 进程内的 resume 会走 SDK 的进程内会话缓存（resume seed），
// 不经过磁盘；只有**新进程**的 resume 成功，才能证明「会话 JSONL 已落盘 + 从磁盘重建历史」。
//
// 用法：tsx src/sdks/resume-probe.ts <session_id> <mock_port>
// 退出码：0=resume 成功且 same_session；1=失败；2=参数/环境错误。
import { query } from "@anthropic-ai/claude-agent-sdk";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { startMockModel } from "../mock-model.js";
import { MOCK_MODEL } from "./task.js";

const __dirname = dirname(fileURLToPath(import.meta.url)); // src/sdks/
const ROOT = resolve(__dirname, "..", ".."); // framework-demo/

const [sessionId, portArg] = process.argv.slice(2);
if (!sessionId) {
  console.error("用法：tsx src/sdks/resume-probe.ts <session_id> [mock_port]");
  process.exit(2);
}
const port = Number(portArg ?? "8791");

const env: Record<string, string> = {
  ANTHROPIC_API_KEY: "mock-key",
  ANTHROPIC_MODEL: MOCK_MODEL,
  ANTHROPIC_SMALL_FAST_MODEL: MOCK_MODEL,
  CLAUDE_CONFIG_DIR: resolve(ROOT, ".claude-home"),
  DISABLE_AUTOUPDATER: "1",
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
  DISABLE_TELEMETRY: "1",
  DISABLE_ERROR_REPORTING: "1",
};
for (const [k, v] of Object.entries(env)) process.env[k] = v;

mkdirSync(env.CLAUDE_CONFIG_DIR, { recursive: true });

const mock = await startMockModel(port);
try {
  process.env.ANTHROPIC_BASE_URL = mock.anthropicBaseUrl;
  let probeSession = "";
  let probeError = false;
  let gotResult = false;
  for await (const m of query({
    prompt: "继续。",
    options: {
      model: MOCK_MODEL,
      cwd: ROOT,
      maxTurns: 3,
      permissionMode: "default",
      resume: sessionId,
      disallowedTools: ["Task", "Agent", "Bash", "BashOutput", "KillShell", "Glob", "Grep", "LS", "Read", "Edit", "MultiEdit", "Write", "NotebookEdit", "WebFetch", "WebSearch", "TodoWrite", "Skill"],
    },
  })) {
    if (m.type === "system" && m.subtype === "init") probeSession = m.session_id;
    if (m.type === "result") {
      gotResult = true;
      probeSession = m.session_id;
      probeError = m.is_error;
    }
  }
  const ok = gotResult && !probeError && probeSession === sessionId;
  console.log(`RESUME_PROBE ${ok ? "OK" : "FAIL"} same_session=${probeSession === sessionId}`);
  process.exit(ok ? 0 : 1);
} catch (e) {
  console.error("RESUME_PROBE FAIL", e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await mock.close();
}
