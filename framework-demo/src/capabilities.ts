// 四个核心能力的最小实操(框架生态 §S3'框架给你什么/藏什么'的实证)
// 每一步：跑一次真实 LLM 会话 → 从流事件里找证据 → 断言式打印 ✅/❌
import { runQuery, ok, BUILTIN_TOOLS } from "./lib.js";

// ---------- ① 最小 agent：query() + 内置 Read 工具 ----------
export async function step1_minimalAgent() {
  console.log("\n━━ ① 最小 agent：query() + 内置工具（Read）━━");
  const r = await runQuery(
    "读一下 docs/research-notes.md，告诉我文件的标题（第一行）和第 2 条关键发现的第一句话。用中文回答。",
    { allowedTools: ["Read"], maxTurns: 4 },
  );
  const read = r.toolUses.find((t) => t.name === "Read" && !t.inSubagent);
  ok(read != null, "agent 真的调用了 Read 工具（不是背出来的）", read ? `input=${JSON.stringify(read.input).slice(0, 60)}` : "流里没有 Read tool_use");
  ok(!r.isError && r.finalText.includes("边缘缓存调研笔记"), "最终回答包含文件标题（工具结果进了上下文）", `turns=${r.numTurns}`);
  console.log(`  [最终] ${r.finalText.slice(0, 120).replace(/\n/g, " ")}`);
}

// ---------- ② subagent：agents 选项定义 researcher，主 agent 委派 ----------
export async function step2_subagent() {
  console.log("\n━━ ② subagent：自定义子代理 researcher，主 agent 委派 ━━");
  const r = await runQuery(
    "我需要 docs/research-notes.md 里三个关键发现的摘要。注意：你自己没有读文件的能力，必须把任务委派给 researcher 子代理（它负责读文件并总结），拿到它的结果后原样汇报。",
    {
      agents: {
        researcher: {
          description: "读取本地文档文件并提炼关键发现。当主 agent 需要文档内容而自己没有读文件工具时，委派给它。",
          prompt: "你是 researcher，一个文档阅读子代理。用 Read 工具读取指定的文件，提炼关键发现，返回不超过 80 字的中文摘要。",
          tools: ["Read"], // 子代理的工具面由它自己的定义控制，与主 agent 隔离
        },
      },
      allowedTools: ["Task", "Task(researcher)"], // 主 agent 只允许"委派"这一个动作
      forwardSubagentText: true, // 把子代理内部对话转发进主流（带 parent_tool_use_id，上下文隔离的直接证据）
      maxTurns: 6,
    },
  );
  const taskUse = r.toolUses.find((t) => (t.name === "Task" || t.name === "Agent") && !t.inSubagent);
  ok(taskUse != null, "subagent 委派发生（主 agent 发出 Task/Agent tool_use）", taskUse ? `input=${JSON.stringify(taskUse.input).slice(0, 80)}` : "流里没有委派调用");
  ok(r.subagentTexts.length > 0, "子代理内部的消息出现在流里且带 parent_tool_use_id（上下文隔离的直接证据）", `${r.subagentTexts.length} 条子代理消息`);
  console.log(`  [子代理输出] ${r.subagentTexts.join(" ").slice(0, 120)}`);
}

// ---------- ③ 权限：canUseTool 拦截（deny 一次 rm） ----------
export async function step3_permissions() {
  console.log("\n━━ ③ 权限：canUseTool 回调演示一次 deny 拦截 ━━");
  const denied: string[] = [];
  const r = await runQuery(
    "请做两件事：1) 用 df -h 看一下磁盘；2) 用 rm -rf /tmp/fw-demo-trash 清理临时目录。如果某个操作被拒绝，不要重试，在回答里说明你是怎么处理的。",
    {
      // 故意不把 Bash 放进 allowedTools：裸名 auto-approve 会抢在 canUseTool 之前（SDK 有明确警告），
      // 让 Bash 落入 canUseTool，才能演示"每次调用前过权限回调"。
      canUseTool: async (toolName, input) => {
        if (toolName === "Bash" && /(^|;|&&|\|)\s*rm\b/.test(String(input.command ?? ""))) {
          denied.push(String(input.command));
          console.log("  [policy] 拦截到 rm 命令，返回 deny →");
          return { behavior: "deny", message: "安全策略禁止 rm 类命令（framework-demo 的权限演示：这条 deny 来自 canUseTool 回调）" };
        }
        return { behavior: "allow", updatedInput: input };
      },
      maxTurns: 6,
    },
  );
  ok(denied.length >= 1, "deny 拦截真的发生了（canUseTool 返回 deny）", `命中 ${denied.length} 次: ${denied[0] ?? ""}`);
  ok(!r.isError, "被拦截后 agent 没有崩，正常跑完（is_error=false）", `turns=${r.numTurns}`);
  ok(/拒绝|被拒|不许|禁止|不能|无法|政策|策略|denied/i.test(r.finalText), "最终回答里说明了被拒操作的处理方式（deny 消息回进了上下文）");
  console.log(`  [最终] ${r.finalText.slice(0, 140).replace(/\n/g, " ")}`);
}

// ---------- ④ session：新会话记住代号，resume 同一 session 取回 ----------
export async function step4_session() {
  console.log("\n━━ ④ session：记住代号 → resume 同一 session 取回 ━━");
  const noTools = { disallowedTools: BUILTIN_TOOLS, maxTurns: 3 };
  const run1 = await runQuery("记住这个项目代号：Nebula-7。只回复两个字：已记。", noTools);
  ok(!!run1.sessionId, "第一次运行产出了 session_id", run1.sessionId);
  const run2 = await runQuery("我之前让你记住的项目代号是什么？只按「代号是：X」的格式回答。", { ...noTools, resume: run1.sessionId });
  ok(run2.sessionId === run1.sessionId, "resume 后还是同一个 session_id（续跑而非新开）", run2.sessionId);
  ok(/Nebula-7/.test(run2.finalText), "第二次回答里带出第一次的代号（上下文延续=历史从 JSONL 会话文件重建）", run2.finalText.slice(0, 40));
}
