// ============================================================
// otel-assert.ts — `npm run demo:otel:assert`
//   U-23 收口入口 B：对**离线 mock 场景**跑出的 span 树做形态 + 计数断言。
//   任何一条不符 → 打印失败明细 → **非 0 退出**。
//
//   判据来自 otel-mock-scenario.ts 的 EXPECTED 契约常量（由场景派生，人工核对过），
//   而**不是**"对齐历史材料的 11 spans"。历史值只作为「未验证」对照被打印。
// ============================================================
import { EXPECTED, renderCounts, runMockOtelScenario, shape } from "./otel-mock-scenario.js";

const spanStatusName = (c: number) => (c === 2 ? "ERROR" : c === 1 ? "OK" : "UNSET");

const failures: string[] = [];
const check = (name: string, actual: unknown, expected: unknown) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  const pass = a === e;
  console.log(`${pass ? "  ✅" : "  ❌"} ${name}：实际 ${a} / 期望 ${e}`);
  if (!pass) failures.push(`${name}：实际 ${a} / 期望 ${e}`);
};
/** 计数映射比较：只比"出现在场"的键值对（缺省即 0），与键顺序无关 */
const checkCounts = (name: string, actual: Record<string, number>, expected: Record<string, number>) => {
  const keys = [...new Set([...Object.keys(actual), ...Object.keys(expected)])].sort();
  const rows = keys.map((k) => `${k}=${actual[k] ?? 0}/${expected[k] ?? 0}`);
  const pass = keys.every((k) => (actual[k] ?? 0) === (expected[k] ?? 0));
  console.log(`${pass ? "  ✅" : "  ❌"} ${name}（实际/期望）：${rows.join(" ")}`);
  if (!pass) failures.push(`${name}：${rows.filter((r) => r.split("=")[1].split("/")[0] !== r.split("=")[1].split("/")[1]).join(" ")}`);
};
/** 多重集比较：排序后逐项比对（同轮内两个工具的先后不作为判据） */
const checkMultiset = (name: string, actual: readonly string[], expected: readonly string[]) => {
  check(name, [...actual].sort(), [...expected].sort());
};

console.log("[otel:assert] 离线 mock 场景断言（无外网、无 LLM key）\n");
const r = await runMockOtelScenario();
const sh = shape(r.spans);
const root = sh.children.root;
const A = (s: { attributes: Record<string, unknown> }) => s.attributes as Record<string, unknown>;

console.log("— span 树形态 —");
check("trace 数", sh.traceCount, EXPECTED.traceCount);
check("span 总数", sh.total, EXPECTED.spanTotal);
checkCounts("按名字的 span 计数", sh.byName, EXPECTED.byName);
check("根 span 名", root.name, EXPECTED.rootName);
check("根 span 的 gen_ai.operation.name", A(root)["gen_ai.operation.name"], EXPECTED.rootName);
check("根 span 有 gen_ai.agent.name", A(root)["gen_ai.agent.name"], "harness-demo");
check("根 span 有 gen_ai.session.id", typeof A(root)["gen_ai.session.id"], "string");
check("子 span 数 = 总数 − 1", sh.children.kids.length, EXPECTED.spanTotal - 1);
check(
  "所有子 span 的父 == 根 spanId（1 trace 一棵树）",
  sh.children.kids.every((k) => k.parentSpanContext?.spanId === sh.rootId),
  true,
);
const ns = (t: [number, number]) => t[0] * 1e9 + t[1];
// 根 span 在 runAgent 的 finally 里 end()，最后一个子 span 也在同一毫秒内 end()。
// 实测：同毫秒时两者的纳秒读数会互有先后（首轮断言曾因此偶发失败）——所以这里断言的是
// **覆盖关系 + 1ms 容差**，而不是"严格最晚"。判据按实跑收紧到容差，不按直觉放宽到"不断言"。
const TOL_NS = 1e6; // 1ms
check(
  "根 span 生命周期覆盖全部子 span（end ≥ 最晚子 span 的 end − 1ms）",
  ns(root.endTime) >= Math.max(...sh.children.kids.map((k) => ns(k.endTime))) - TOL_NS,
  true,
);
// 上界（启动顺序）：根必须先于所有子 span 启动
check("根 span 先于所有子 span 启动", ns(root.startTime) <= Math.min(...sh.children.kids.map((k) => ns(k.startTime))), true);

console.log("\n— chat span（每次 LLM 调用 1 个）—");
const chats = sh.children.kids.filter((k) => k.name === "chat");
check("chat 数 == mock 端点数到的请求数", chats.length, r.requests);
check(
  "每个 chat 带 operation/system/request.model",
  chats.every((c) => A(c)["gen_ai.operation.name"] === "chat" && A(c)["gen_ai.system"] === "openai" && typeof A(c)["gen_ai.request.model"] === "string"),
  true,
);
check("每个 chat 带 response.model", chats.every((c) => typeof A(c)["gen_ai.response.model"] === "string"), true);
check("每个 chat 带 finish_reasons", chats.every((c) => Array.isArray(A(c)["gen_ai.response.finish_reasons"])), true);
check("每个 chat 带 input/output tokens", chats.every((c) => typeof A(c)["gen_ai.usage.input_tokens"] === "number" && typeof A(c)["gen_ai.usage.output_tokens"] === "number"), true);
check("chat span 全 OK", chats.every((c) => spanStatusName(c.status.code) === "OK"), true);

console.log("\n— execute_tool span（每次工具调用 1 个）—");
checkMultiset("工具名多重集", sh.toolNames, EXPECTED.toolNames);
checkCounts("工具状态分布（deny 路径必须在场）", sh.toolStatus, EXPECTED.toolStatus);
check("error 路径本场景不触发（error 计数为 0）", sh.toolStatus.error ?? 0, EXPECTED.toolStatus.error);
const denied = sh.children.kids.filter((k) => k.name === "execute_tool" && A(k)["harness.tool.status"] === "denied");
check("被拒绝的是 run_shell", denied.map((d) => A(d)["gen_ai.tool.name"]), ["run_shell"]);
check("execute_tool 都带 call.id 与参数摘要", sh.children.kids.filter((k) => k.name === "execute_tool").every((t) => typeof A(t)["gen_ai.tool.call.id"] === "string" && typeof A(t)["gen_ai.tool.call.arguments"] === "string"), true);

console.log("\n— 历史报告值（不参与断言，仅对照）—");
const h = EXPECTED.historicalReportOnly;
console.log(`  ℹ️  历史报告值 ${h.spans} spans / ${h.traces} trace — ${h.source}`);
console.log(`  ℹ️  本次 mock 实测 ${sh.total} spans / ${sh.traceCount} trace → ${sh.total === h.spans ? "数值一致" : "**数值不一致**（历史值仍标「未验证」，仓内无回放日志；本断言不为它让步）"}`);

console.log(`\n${renderCounts(sh)}`);

if (failures.length) {
  console.error(`\n❌ otel 断言失败 ${failures.length} 条：`);
  for (const f of failures) console.error(`   - ${f}`);
  process.exit(1);
}
console.log(`\n✅ otel span 树断言全部通过（离线 mock，可重跑）`);
