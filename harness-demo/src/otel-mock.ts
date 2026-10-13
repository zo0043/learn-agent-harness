// ============================================================
// otel-mock.ts — `npm run demo:otel:mock`
//   U-23 收口入口 A：用**本地 mock 模型**离线跑出确定性 span 树并打印（不依赖活端点/无 key）。
//   同时把快照写进 workspace/out/otel-spans.md（生成器产出，禁止手写）。
//
//   入口顺序有讲究：先设 env 再 dynamic import——src/llm.ts:22-24 在模块求值时固化 BASE/KEY。
//   本文件因此**只**能静态 import 那些不碰 LLM env 的模块。
// ============================================================
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { MOCK_MODEL, EXPECTED, renderCounts, renderSnapshot, renderTree, runMockOtelScenario, shape } from "./otel-mock-scenario.js";

const __dirname = dirname(fileURLToPath(import.meta.url)); // src/

console.log("[otel:mock] 离线场景：本地 mock OpenAI 兼容端点（无外网、无 LLM key）");
console.log(`[otel:mock] 场景定义：src/otel-mock-scenario.ts（8 个 tool_call 的名字与顺序抄自 trajectories/demo.jsonl；路径与 write_file 审批策略两处如实适配，见该文件头部注释）`);
console.log(`[otel:mock] mock 模型名：${MOCK_MODEL}\n`);

const r = await runMockOtelScenario();
console.log(`[otel:mock] 端点收到 ${r.requests} 次 /chat/completions，会话日志=${r.sessionFile.replace(__dirname + "/../", "")}\n`);

const sh = shape(r.spans);
console.log(renderTree(sh));
console.log(`\n${renderCounts(sh)}`);

// —— 生成式快照（修显示值不如修生成器）——
const snapPath = resolve(__dirname, "..", "workspace", "out", "otel-spans.md");
writeFileSync(snapPath, renderSnapshot(sh, { port: r.port, requests: r.requests, node: `${process.platform}/${process.arch}` }), "utf8");
console.log(`\n[otel:mock] 快照已写入 workspace/out/otel-spans.md（生成器产出，勿手改）`);

// —— 与历史材料对照（诚实性：历史值只能标"未验证"，不参与断言）——
const h = EXPECTED.historicalReportOnly;
console.log(
  `[otel:mock] 对照历史报告值：${h.spans} spans / ${h.traces} trace（${h.source}）` +
    ` → 与本次 mock 实测 ${sh.total} spans / ${sh.traceCount} trace ${sh.total === h.spans ? "一致" : "**不一致**"}；` +
    `历史值仓内无可复跑日志，仍标「未验证」。`,
);
console.log(`[otel:mock] 断言走另一条命令：npm run demo:otel:assert`);
