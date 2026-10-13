// claude.ts —— Claude Agent SDK 侧的白板任务实现（离线 mock 端点）
//
// 对照要点（详见 docs/sdk-comparison.md）：
//   · loop 归属：SDK 内置——query() 背后是 claude CLI 子进程自带的 agent loop，
//     调用方只消费 AsyncGenerator<SDKMessage>，不写 while。
//   · 工具与 schema：不声明函数工具——直接用内置工具市场（Read/Bash…），
//     mock 按"请求里广告了哪些工具名"退化出 Read/Bash 的调用形状。
//   · 权限与 HITL：canUseTool 逐调用回调（进程内门）。没有"挂起再恢复"的
//     框架状态：进程死在审批等待里时，靠会话 JSONL + resume 续跑。
//   · 状态与中断恢复：会话持久化在 $CLAUDE_CONFIG_DIR/projects/<cwd-slug>/*.jsonl；
//     框架级中断恢复 = resume: session_id（本文件末尾的 resume 探针就是证据）。
//   · 可观测：for await 消费 SDKMessage 流（system/assistant/result）。
import { query, type SDKMessage, type SDKAssistantMessage } from "@anthropic-ai/claude-agent-sdk";
import { mkdirSync, rmSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type UnifiedTrace, type ToolCallRecord, type Step,
  WHITEBOARD_PROMPT, DENY_MESSAGE, MOCK_MODEL, GATE_PATH, APPROVAL_PATH,
} from "./task.js";
import type { MockServer } from "../mock-model.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, "..", ".."); // framework-demo/
export const CLAUDE_CONFIG_DIR = resolve(ROOT, ".claude-home");

/** 内置工具全集（resume 探针里全禁掉 → 无工具上下文，mock 只回收尾文本） */
const BUILTIN_TOOLS = ["Task", "Agent", "Bash", "BashOutput", "KillShell", "Glob", "Grep", "LS", "Read", "Edit", "MultiEdit", "Write", "NotebookEdit", "WebFetch", "WebSearch", "TodoWrite", "Skill"];

function stepOfName(name: string, input: Record<string, unknown>): Step {
  const cmd = String(input.command ?? "");
  if (name === "Read" || /read/i.test(name)) return "read";
  if (/\brm\b/.test(cmd)) return "gate";
  return "approve";
}

export async function runClaudeTrace(mock: MockServer): Promise<UnifiedTrace> {
  // 每次运行从干净的会话目录开始（目录内文件名带 UUID，属运行态，不进 git）
  rmSync(CLAUDE_CONFIG_DIR, { recursive: true, force: true });
  mkdirSync(CLAUDE_CONFIG_DIR, { recursive: true });
  // 审批产物文件也清掉，保证"文件存在"是本次运行审批放行的证据。
  // 注意要留空目录：touch 不建父目录，out/ 不存在会 ENOENT（审批放行了但文件没落盘）。
  rmSync(resolve(ROOT, "out"), { recursive: true, force: true });
  mkdirSync(resolve(ROOT, "out"), { recursive: true });

  // claude CLI 是子进程，env 必须进 process.env
  const env: Record<string, string> = {
    ANTHROPIC_BASE_URL: mock.anthropicBaseUrl,
    ANTHROPIC_API_KEY: "mock-key",
    ANTHROPIC_MODEL: MOCK_MODEL,
    ANTHROPIC_SMALL_FAST_MODEL: MOCK_MODEL,
    CLAUDE_CONFIG_DIR,
    DISABLE_AUTOUPDATER: "1",
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
    DISABLE_TELEMETRY: "1",
    DISABLE_ERROR_REPORTING: "1",
  };
  for (const [k, v] of Object.entries(env)) process.env[k] = v;

  const toolCalls: ToolCallRecord[] = [];
  const approvedCommands: string[] = [];
  let sessionId = "";
  let isError = false;
  let finalText = "";
  let eventCount = 0;
  const reqsBefore = mock.requests.length;
  let readRecorded = false;

  for await (const m of query({
    prompt: WHITEBOARD_PROMPT,
    options: {
      model: MOCK_MODEL,
      cwd: ROOT,
      maxTurns: 10,
      // 关键 ①：permissionMode 必须显式 "default"——不设时非交互 query 走 bypass，
      //  canUseTool 根本不会被调用（实测：tool 照跑、回调零命中）。
      // 关键 ②：不用 allowedTools（裸名会抢在回调前 auto-approve，SDK 会把 shadow 警告
      //  打到 stderr，破坏输出确定性）。Read 属 CLI 内置安全工具，default 模式下规则
      //  自动放行、不过回调——它的 tool_use 从流事件里记录（见下方循环）。
      permissionMode: "default",
      canUseTool: async (toolName, input) => {
        if (process.env.FW_DEBUG_CLAUDE) console.log("[fw-debug] canUseTool", toolName, JSON.stringify(input).slice(0, 80));
        const cmd = String((input as Record<string, unknown> | null)?.command ?? "");
        if (toolName === "Bash" && /\brm\b/.test(cmd)) {
          toolCalls.push({
            step: "gate", name: toolName, args: input, executed: false, actionPerformed: false, denied: true, approved: false,
            evidence: `canUseTool 回调返回 deny（${cmd}），Bash 预执行拦截未运行，deny 文本作为 tool_result 回进上下文`,
          });
          return { behavior: "deny", message: DENY_MESSAGE };
        }
        const step = stepOfName(toolName, (input ?? {}) as Record<string, unknown>);
        toolCalls.push({
          step, name: toolName, args: input, executed: true, actionPerformed: step === "approve",
          denied: false,
          approved: step === "approve",
          evidence: step === "approve"
            ? "canUseTool 回调返回 allow（此处=模拟人工审批通过），Bash touch 随后真实执行，产物文件落盘"
            : "canUseTool 回调返回 allow（普通动作，自动放行）",
        });
        if (step === "approve") approvedCommands.push(cmd);
        return { behavior: "allow", updatedInput: input };
      },
    },
  })) {
    eventCount++;
    if (m.type === "system" && m.subtype === "init") sessionId = m.session_id;
    if (m.type === "assistant") {
      const am = m as SDKAssistantMessage;
      if (am.session_id) sessionId = am.session_id;
      // Read 不过 canUseTool（内置安全工具自动放行）——从流的 tool_use 事件补记 read 步；
      // Bash 的 gate/approve 记录由 canUseTool 采集（那里有策略决定的证据），不重复记。
      for (const b of am.message.content) {
        if (b.type === "tool_use" && b.name === "Read" && !readRecorded && am.parent_tool_use_id == null) {
          readRecorded = true;
          toolCalls.unshift({
            step: "read", name: "Read", args: (b.input ?? {}) as Record<string, unknown>,
            executed: true, actionPerformed: true, denied: false, approved: false,
            evidence: "内置 Read 属 CLI 安全工具，permissionMode=default 下规则自动放行（不经过 canUseTool 回调）",
          });
        }
      }
    }
    if (m.type === "result") {
      sessionId = m.session_id;
      isError = m.is_error;
      finalText = m.subtype === "success" ? (m as { result?: string }).result ?? "" : JSON.stringify(m).slice(0, 200);
    }
  }
  const modelCalls = mock.requests.length - reqsBefore;

  // 审批放行的真实副作用：touch 出的产物文件（每次运行前由 compare 清理 out/ 保证可重复）
  const approvedFile = resolve(ROOT, APPROVAL_PATH);
  const approvedFileExists = existsSync(approvedFile);

  // ── 框架级中断恢复证据：会话 JSONL + resume（与 HITL 回调是两回事） ──
  // resume 探针：同一 session_id 续跑一次无工具问答（mock 对无工具请求只回收尾文本）。
  let resumeProbe: { ok: boolean; sameSession: boolean } = { ok: false, sameSession: false };
  if (sessionId) {
    try {
      let probeSession = "";
      let probeError = false;
      for await (const m of query({
        prompt: "继续。",
        options: { model: MOCK_MODEL, cwd: ROOT, maxTurns: 3, resume: sessionId, disallowedTools: BUILTIN_TOOLS },
      })) {
        if (m.type === "system" && m.subtype === "init") probeSession = m.session_id;
        if (m.type === "result") { probeSession = m.session_id; probeError = m.is_error; }
      }
      resumeProbe = { ok: !probeError, sameSession: probeSession === sessionId };
    } catch {
      resumeProbe = { ok: false, sameSession: false };
    }
  }

  // 会话 JSONL 落盘证据（状态形态：文件里的完整转录）。
  // 诚实说明：本进程内读不到本次运行的会话文件是正常现象——会话 JSONL 的刷盘是
  // **异步**的（实测 0–180s+，时机不可控，疑似 CLI 残留组件的延迟同步）；
  // 落盘与「跨进程磁盘 resume」由 compare:assert 在子进程退出后验证（A11）。
  const projectsDir = resolve(CLAUDE_CONFIG_DIR, "projects", `${ROOT.replace(/\//g, "-")}`); // slug = cwd 路径 /→-（前导 / 即前导 -，勿再加 -）
  let jsonlEvidence = "会话 JSONL 异步刷盘（本进程内不可读，compare:assert 阶段跨进程验证）";
  let jsonlToolUse = false;
  let jsonlDeny = false;
  let jsonlToolResults = 0;
  if (existsSync(projectsDir)) {
    const files = readdirSync(projectsDir).filter((f) => f.endsWith(".jsonl"));
    if (files.length) {
      const body = readFileSync(resolve(projectsDir, files[0]), "utf8");
      jsonlToolUse = body.includes('"tool_use"');
      jsonlDeny = body.includes("rm -rf");
      jsonlToolResults = (body.match(/"type":"tool_result"/g) ?? []).length;
      jsonlEvidence = `${files.length} 个 JSONL 会话文件：含 tool_use=${jsonlToolUse}，含 rm -rf=${jsonlDeny}，tool_result 行数=${jsonlToolResults}`;
    }
  }

  return {
    key: "claude-agent-sdk",
    label: "Claude Agent SDK",
    packageSpec: "@anthropic-ai/claude-agent-sdk",
    baseUrl: mock.anthropicBaseUrl,
    model: MOCK_MODEL,
    loopOwner: "SDK 内置（claude CLI 子进程自带 agent loop；调用方只消费 query() 的 AsyncGenerator）",
    toolCalls,
    finalText,
    messageCount: eventCount,
    stateShape: `进程内流事件 ${eventCount} 条 + 落盘 JSONL 会话转录（$CLAUDE_CONFIG_DIR/projects/<cwd-slug>/）；${jsonlEvidence}；审批产物文件 ${APPROVAL_PATH} 存在=${approvedFileExists}`,
    paused: false, // HITL 是进程内 canUseTool 回调，不是框架状态挂起
    resumed: resumeProbe.ok,
    pauseEvidence: "无框架级挂起：审批等待发生在 canUseTool 回调内（进程活着，决定权未交还调用方）",
    resumeEvidence: resumeProbe.ok
      ? `会话级中断恢复：resume 同一 session_id 进程内探针成功，same_session=${resumeProbe.sameSession}（SDK 会话重建；磁盘 resume 由 compare:assert A11 跨进程验证）`
      : "resume 探针失败",
    observability: {
      hook: "for await (const m of query(...)) —— SDKMessage 流（system/assistant/result）",
      events: eventCount,
      samples: [`system:init(session_id)`, `assistant:tool_use×${toolCalls.length}`, "result:success"],
    },
    extra: {
      modelCalls,
      // session_id 只进 .compare-trace.json（gitignore 的运行态文件），不进 stdout（保持输出确定性）
      sessionId,
      mainRunSessionPresent: sessionId.length > 0,
      // 结构化中断恢复/状态/副作用证据（compare:assert 直接断言这些字段，不解析字符串）
      resumeProbeOk: resumeProbe.ok && resumeProbe.sameSession,
      jsonlToolUse,
      jsonlDeny,
      jsonlToolResults,
      approvedFileExists,
    },
  };
}
