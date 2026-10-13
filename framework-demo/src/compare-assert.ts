// compare-assert.ts —— 断言引擎（npm run compare:assert 的**阶段2c**，由
// scripts/compare-assert.sh 编排调用；本文件不 spawn 子进程、不等待，只读文件断言）
//
//   编排（bash，见 scripts/compare-assert.sh）：
//     阶段1：npx tsx src/compare.ts              （三家对照 + 写 .compare-trace.json）
//     阶段2a：bash 有界等待会话 JSONL 落盘（≤240s）
//     阶段2b：跨进程 resume 探针（src/sdks/resume-probe.ts）
//     阶段2c：本文件 —— 读 trace + JSONL + 静态文件，逐条断言 A1–A16 ＋ R3-1 归属防回归守卫（五维表 HITL 行三家原语归属，不计入 A 编号）
//
// 为什么等待必须在 bash：实测 node 父进程存活时会持续推迟会话 JSONL 的异步刷盘
// （父进程退出后才落盘、mtime 回填到会话时间戳）；bash 父进程无此影响。
//
// 为什么 A11 要跨进程 resume：同进程 resume 走 SDK 内存会话缓存（resume seed），
// 不经过磁盘；只有全新进程的 resume 成功才证明「JSONL 落盘 + 从磁盘重建历史」。
//
// 诚实标注：全部断言在离线 mock 下可复现；模型调用均指向 127.0.0.1 mock 端点。
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { summarize, type UnifiedTrace } from "./sdks/task.js";
import { FINAL_TEXT } from "./mock-model.js";

const __dirname = dirname(fileURLToPath(import.meta.url)); // src/
const ROOT = resolve(__dirname, ".."); // framework-demo/

// 由 shell 编排器传入：跨进程 resume 探针退出码 / 落盘等待秒数 / 会话文件是否落盘(0|1)
const [probeRcArg, waitedArg, jsonlFoundArg] = process.argv.slice(2);
const probeRc = Number(probeRcArg ?? "-1");
const waitedSec = Number(waitedArg ?? "-1");
const jsonlFound = jsonlFoundArg === "1";

interface TraceFile { model: string; traces: UnifiedTrace[] }

const results: Array<{ id: string; name: string; pass: boolean; evidence: string }> = [];
function A(id: string, name: string, pass: boolean, evidence = "") {
  results.push({ id, name, pass, evidence });
  console.log(`  ${pass ? "✅" : "❌"} ${id} ${name}${evidence ? `（${evidence}）` : ""}`);
}

function byKey(traces: UnifiedTrace[], key: UnifiedTrace["key"]): UnifiedTrace {
  const t = traces.find((x) => x.key === key);
  if (!t) throw new Error(`trace 缺少 ${key}`);
  return t;
}

function main() {
  const tracePath = resolve(ROOT, ".compare-trace.json");
  if (!existsSync(tracePath)) {
    console.error("[断言引擎失败] 缺少 .compare-trace.json（阶段1未跑完？）");
    process.exit(1);
  }
  const tf = JSON.parse(readFileSync(tracePath, "utf8")) as TraceFile;
  const [claude, openai, langgraph] = [
    byKey(tf.traces, "claude-agent-sdk"),
    byKey(tf.traces, "openai-agents-sdk"),
    byKey(tf.traces, "langgraph"),
  ];

  console.log("");
  console.log("── 阶段2c：断言（A1–A16；会话 JSONL 落盘与跨进程 resume 由 bash 编排完成） ──");

  // A1–A3 工具调用次数：每家 3 次，且逐步工具名符合任务脚本
  A("A1", "Claude 工具调用 3 次（Read/Bash/Bash）",
    claude.toolCalls.length === 3 && claude.toolCalls.map((c) => c.name).join(",") === "Read,Bash,Bash",
    claude.toolCalls.map((c) => c.name).join(","));
  A("A2", "OpenAI 工具调用 3 次（read_doc/delete_temp/publish_note）",
    openai.toolCalls.length === 3 && openai.toolCalls.map((c) => c.name).join(",") === "read_doc,delete_temp,publish_note",
    openai.toolCalls.map((c) => c.name).join(","));
  A("A3", "LangGraph 工具调用 3 次（read_doc/delete_temp/publish_note）",
    langgraph.toolCalls.length === 3 && langgraph.toolCalls.map((c) => c.name).join(",") === "read_doc,delete_temp,publish_note",
    langgraph.toolCalls.map((c) => c.name).join(","));

  // A4 最终输出：三家一字不差 = mock 固定收尾文本
  A("A4", "三家最终输出均等于 mock 固定 FINAL_TEXT",
    [claude, openai, langgraph].every((t) => t.finalText === FINAL_TEXT),
    `len=${claude.finalText.length}`);

  // A5 权限拦截不变量：gate 被策略拒绝且删除动作未生效（三家机制不同，动作都没发生）
  A("A5", "三家 gate 步均被拒绝且删除未生效（gateActionBlocked）",
    [claude, openai, langgraph].every((t) => summarize(t).gateActionBlocked));

  // A6 拒绝文本回进上下文：最终输出里都说明了被拒动作（mock 的 FINAL_TEXT 含该句，
  //    而 FINAL_TEXT 只在模型收到 gate 的 deny tool_result 之后才会被产出 → 闭环证据）
  A("A6", "三家最终输出均含「已被权限策略拒绝」（deny 文本进了模型上下文）",
    [claude, openai, langgraph].every((t) => t.finalText.includes("已被权限策略拒绝")));

  // A7 审批完成：approve 步 approved && executed && actionPerformed
  A("A7", "三家 approve 步均「批准→执行→动作生效」（approveCompleted）",
    [claude, openai, langgraph].every((t) => summarize(t).approveCompleted));

  // A8/A9 真挂起：OpenAI=needsApproval 停 run；LangGraph=interrupt 挂图（paused=true 且恢复跑完）
  A("A8", "OpenAI 发生真挂起并恢复（needsApproval → approve → 续跑）", openai.paused && openai.resumed);
  A("A9", "LangGraph 发生真挂起并恢复（interrupt → Command resume → 续跑）", langgraph.paused && langgraph.resumed);

  // A10 Claude 会话级中断恢复：进程内 resume 同一 session_id 探针成功
  // （注意：进程内 resume 可能走 SDK 内存会话缓存，磁盘持久化由 A11 的跨进程探针证明）
  A("A10", "Claude 进程内 resume 探针成功（会话级中断恢复，same_session）",
    claude.extra.resumeProbeOk === true && claude.extra.mainRunSessionPresent === true);

  // A11 Claude 状态形态（三重证据，缺一不过）：
  //   ① 审批放行有真实副作用（touch 出的产物文件存在，进程内确定性证据）
  //   ② 本轮会话 JSONL（<session-uuid>.jsonl）已落盘且含完整转录（tool_use + rm -rf + ≥3 tool_result）
  //   ③ 跨进程 resume 探针成功（bash 编排阶段2b 的结果，rc=0）
  const projectsDir = resolve(ROOT, ".claude-home", "projects", `${ROOT.replace(/\//g, "-")}`); // slug = cwd 路径 /→-
  const sessionFile = typeof claude.extra.sessionId === "string" && claude.extra.sessionId
    ? resolve(projectsDir, `${claude.extra.sessionId}.jsonl`)
    : null;
  let mainJsonl: string | null = null;
  if (jsonlFound && sessionFile && existsSync(sessionFile)) {
    mainJsonl = readFileSync(sessionFile, "utf8");
  }
  const toolResults = mainJsonl ? (mainJsonl.match(/"type":"tool_result"/g) ?? []).length : 0;
  const jsonlOk = mainJsonl != null
    && mainJsonl.includes('"tool_use"') && mainJsonl.includes("rm -rf") && toolResults >= 3;
  A("A11", "Claude 状态形态：审批产物落盘 + 会话 JSONL 完整转录 + 跨进程磁盘 resume 成功",
    jsonlOk && probeRc === 0 && claude.extra.approvedFileExists === true,
    `jsonl=${jsonlOk ? `完整转录(${toolResults} tool_result, 落盘等待 ${waitedSec}s)` : (jsonlFound ? "内容不符" : "missing")} 跨进程resume=${probeRc === 0 ? "ok" : `rc=${probeRc}`} 产物文件=${String(claude.extra.approvedFileExists)}`);

  // A12 OpenAI 状态形态：最终一次模型请求带 3 条 tool 结果、≥7 条 messages
  A("A12", "OpenAI 最终请求带 3 条 tool 结果且 ≥7 条 messages（RunState 内存态）",
    openai.extra.finalRequestToolResults === 3 && (openai.extra.finalRequestMsgs as number) >= 7,
    `msgs=${String(openai.extra.finalRequestMsgs)} toolResults=${String(openai.extra.finalRequestToolResults)}`);

  // A13 LangGraph 状态形态：checkpoint 存在且最终 state 有 8 条 messages（human+3ai+3tool+final ai）
  A("A13", "LangGraph checkpoint 存在且最终 state 含 8 条 messages（checkpointer 落盘）",
    langgraph.extra.checkpointExists === true && langgraph.extra.finalStateMessages === 8,
    `finalStateMessages=${String(langgraph.extra.finalStateMessages)}`);

  // A14 离线端点：三家 baseUrl 全部指向 127.0.0.1（没有任何请求离开本机）
  A("A14", "三家 baseUrl 全部指向本地 127.0.0.1 mock 端点",
    [claude, openai, langgraph].every((t) => t.baseUrl.startsWith("http://127.0.0.1:")),
    [claude, openai, langgraph].map((t) => t.baseUrl).join(" / "));

  // A15 U-24 静态口径：断言数=10（capabilities.ts 里 ok() 调用计数）+ 1 总体判定（demo 末尾行）；
  //     README 使用该口径，且全目录不出现旧混口径字样（"11"+"\/11" 拼接，避免本文件自身含字面量）
  const OLD = "11" + "/11";
  const caps = readFileSync(resolve(ROOT, "src", "capabilities.ts"), "utf8");
  const okCount = (caps.match(/(^|\s)ok\(/g) ?? []).length;
  const readme = readFileSync(resolve(ROOT, "README.md"), "utf8");
  const srcFiles = readdirSync(resolve(ROOT, "src"), { recursive: true }) as string[];
  const srcBodies = srcFiles
    .filter((f) => f.endsWith(".ts"))
    .map((f) => readFileSync(resolve(ROOT, "src", f), "utf8"));
  const noOld = !readme.includes(OLD) && !srcBodies.some((b) => b.includes(OLD));
  A("A15", "U-24 口径：ok() 调用=10 且 README 写「10 断言 + 1 总体判定」且无旧混口径字样",
    okCount === 10 && readme.includes("10 断言 + 1 总体判定") && noOld,
    `ok()=${okCount}`);

  // A16 模型调用次数：每家 4 次（read/gate/approve 三步 + 收尾，同一 mock 同一脚本）
  A("A16", "三家模型调用均为 4 次（同一任务同一 mock 脚本）",
    [claude, openai, langgraph].every((t) => t.extra.modelCalls === 4),
    [claude, openai, langgraph].map((t) => String(t.extra.modelCalls)).join(" / "));

  // ── 防回归（不计入 A1–A16 编号与语义；R3-1 归属守卫——t9 评审 high 发现的唯一自动防线）──
  // 五维表「权限与 human-in-the-loop 钩子」行的三家归属必须各自为：
  //   claude=canUseTool / openai=needsApproval / langgraph=interrupt+Command({ resume })
  // R3-1 原始缺陷 = OpenAI 的 needsApproval 被安到 LangGraph 格（两分支共用 else 文案），
  // 且 A1–A16 只断言行为轨迹、不断言表格文案 → 该缺陷静默无覆盖。
  // 断言落点（为什么这样打，两条腿）：
  //   ① compare.ts DIMENSIONS 该行是旗舰 compare 输出该行的唯一确定性生成源——该行三格
  //      均为常量串（不插值 trace 字段），逐分支取格校验归属；（本文件按设计「不 spawn
  //      子进程」，见文件头；阶段1 stdout 透传未落盘，compare-assert.sh:33。）
  //   ② docs/sdk-comparison.md 维度 3「结论」行三格归属一致——源码与文档任一被改回错误
  //      归属都会失败（双保险）。
  const hitlCell = (row: string, key: string): string => {
    const i = row.indexOf(key);
    if (i < 0) return "";
    const q = row.slice(i + key.length).match(/"([^"]*)"/);
    return q ? q[1] : "";
  };
  const compareSrc = readFileSync(resolve(ROOT, "src", "compare.ts"), "utf8");
  const hitlStart = compareSrc.indexOf('["权限与 human-in-the-loop 钩子"');
  const hitlEnd = hitlStart >= 0 ? compareSrc.indexOf('"],', hitlStart) : -1;
  // 注意：行尾切到 +1 含末格闭合引号（'"],' 的首字符即末格字符串的收尾引号），
  // 否则末格（langgraph 分支）正则取不到完整字符串。
  const hitlRow = hitlStart >= 0 && hitlEnd > hitlStart ? compareSrc.slice(hitlStart, hitlEnd + 1) : "";
  const cellClaude = hitlCell(hitlRow, 't.key === "claude-agent-sdk"');
  const cellOpenai = hitlCell(hitlRow, 't.key === "openai-agents-sdk"');
  const cellLanggraph = (() => {
    const i = hitlRow.lastIndexOf(': "');
    return i >= 0 ? (hitlRow.slice(i).match(/"([^"]*)"/)?.[1] ?? "") : "";
  })();
  const srcAttr =
    cellClaude.includes("canUseTool") &&
    cellOpenai.includes("needsApproval") &&
    cellLanggraph.includes("interrupt") &&
    cellLanggraph.includes("Command({ resume })") &&
    !cellLanggraph.includes("needsApproval");
  const doc = readFileSync(resolve(ROOT, "docs", "sdk-comparison.md"), "utf8");
  const d3Start = doc.indexOf("### 维度 3");
  const d3End = d3Start >= 0 ? doc.indexOf("### 维度 4", d3Start) : -1;
  const d3 = d3Start >= 0 && d3End > d3Start ? doc.slice(d3Start, d3End) : "";
  const d3Row = d3.split("\n").find((l) => l.startsWith("| 结论 |")) ?? "";
  const d3cells = d3Row.split("|").map((s) => s.trim());
  const docAttr =
    (d3cells[2] ?? "").includes("canUseTool") &&
    (d3cells[3] ?? "").includes("needsApproval") &&
    (d3cells[4] ?? "").includes("interrupt") &&
    (d3cells[4] ?? "").includes("Command({ resume })");
  console.log("");
  console.log("── 防回归（不计入 A1–A16；R3-1 归属守卫：五维表 HITL 行三家原语归属） ──");
  console.log(`  ${srcAttr ? "✅" : "❌"} compare.ts HITL 行（输出行的确定性生成源）：claude=${cellClaude.includes("canUseTool") ? "canUseTool" : "缺canUseTool"} / openai=${cellOpenai.includes("needsApproval") ? "needsApproval" : "缺needsApproval"} / langgraph=${cellLanggraph.includes("interrupt") && cellLanggraph.includes("Command({ resume })") ? "interrupt+Command({ resume })" : "缺interrupt/Command"}${cellLanggraph.includes("needsApproval") ? "（混入 needsApproval！归属错误）" : ""}`);
  console.log(`  ${docAttr ? "✅" : "❌"} sdk-comparison.md 维度 3「结论」行：三格归属一致（canUseTool / needsApproval / interrupt+Command({ resume })）`);

  const failed = results.filter((r) => !r.pass);
  const guardOk = srcAttr && docAttr;
  console.log("");
  if (failed.length === 0 && guardOk) {
    console.log(`断言 ${results.length}/${results.length} 全部通过 + 防回归通过 ✅（退出码 0）`);
  } else {
    console.log(`断言失败 ${failed.length} 条：${failed.map((r) => r.id).join(", ") || "（无）"}，防回归=${guardOk ? "通过" : "失败"} ❌（退出码 1）`);
  }
  process.exit(failed.length === 0 && guardOk ? 0 : 1);
}

main();
