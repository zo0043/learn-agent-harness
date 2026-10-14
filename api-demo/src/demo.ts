// ============================================================
// 入口 —— API 与多模型路由 §S2
//   ① 六模块断言自测 ② 事故场景走查（路由错位 400 → 不重试 → 降级 → 成本归因）
//   全离线零 key；逻辑时钟 + 固定 seed jitter；跑 N 次输出逐字节一致
// ============================================================
import { ASSERTIONS } from "./assert.js";
import { callProvider, providerById, PROVIDERS, ROUTE_400_MSG, ProviderError } from "./providers.js";
import { consumeStream } from "./sse.js";
import { classify, withRetry } from "./retry.js";
import { route, withFallback } from "./router.js";
import { stepCost, aggregateCosts } from "./cost.js";
import type { Task } from "./types.js";

const MODULE_ORDER = ["sse", "schema", "caching", "retry", "router", "cost"];
const MODULE_LABEL: Record<string, string> = {
  sse: "① SSE 流式读取",
  schema: "② 结构化输出（两道门）",
  caching: "③ prompt caching",
  retry: "④ 重试分类",
  router: "⑤ 多模型路由",
  cost: "⑥ 成本计数",
};

const log = console.log;

async function main() {
  let allOk = true;
  let total = 0;

  log("api-demo —— 模型调用层六模块最小闭环（全离线零 key，mock provider）");
  for (const mod of MODULE_ORDER) {
    log(`\n${MODULE_LABEL[mod]}`);
    for (const a of ASSERTIONS.filter((x) => x.module === mod)) {
      const r = await a.run();
      total += 1;
      if (!r.ok) allOk = false;
      log(`  ${r.ok ? "✅" : "❌"} [${a.id}] ${r.detail}`);
    }
  }

  log("\n════════════════════════════════════════");
  log("事故场景走查：路由错位 400 → 不重试 → 降级 → 成本归因");
  log("（素材复用 notes/api-engineering.md S7：functions 参数被路由到不支持 functions 的模型）");
  let scenarioOk = true;

  const task: Task = { needsToolCalling: true, needsStructured: false, minWindowTokens: 4096 };

  log('\n[1] 能力路由：带函数调用的请求应路由到 p-capable');
  const primary = route(task, PROVIDERS);
  log(`    route → ${primary?.id}（tool_calling=${primary?.toolCalling}）${primary?.id === "p-capable" ? " ✅" : " ❌"}`);
  scenarioOk &&= primary?.id === "p-capable";

  log('\n[2] 事故：p-capable 注入 400 route 错（classify → 4xx 契约违约 → 不重试）');
  let r400;
  {
    let calls = 0;
    r400 = await withRetry(async () => {
      calls += 1;
      for await (const _ of callProvider(providerById("p-capable"), { fault: "400" })) void _;
    }, 2);
    const cls = classify({ status: 400 });
    log(`    classify=${cls} retried=${r400.retried} fn 调用=${calls} 次 ${r400.retried === 0 && calls === 1 ? " ✅" : " ❌"}`);
    scenarioOk &&= r400.retried === 0 && calls === 1;
  }

  log('\n[3] 降级：p-capable 不可用 → 降级到 p-fast（窗口满足，失去 tool_calling）');
  const fb = withFallback(task, PROVIDERS, new Set(["p-fast"]));
  log(`    ${fb.reason} fell=${fb.fell} 最终=${fb.provider?.id ?? "null"} ${fb.fell && fb.provider?.id === "p-fast" ? " ✅" : " ❌"}`);
  scenarioOk &&= fb.fell && fb.provider?.id === "p-fast";

  log('\n[4] 降级后 p-fast 成功回流 + 成本归因到两个模型');
  const good = await consumeStream(callProvider(providerById("p-fast"), { content: "降级后的回复" }));
  const cost400 = 0; // 400 契约违约无 usage（不产 token）
  const costFallback = stepCost("p-fast", { input: good.usage?.input ?? 0, output: good.usage?.output ?? 0 });
  const report = aggregateCosts([
    { model: "p-capable", cost: cost400 },
    { model: "p-fast", cost: costFallback },
  ]);
  log(`    p-fast usage=${JSON.stringify(good.usage)} → cost=${costFallback}；byModel=${JSON.stringify(report.byModel)} total=${report.total}`);
  const byModel2 = Object.keys(report.byModel).length === 2;
  log(`    ${byModel2 ? " ✅" : " ❌"}（归因到两模型；p-capable 因 400=0）`);
  scenarioOk &&= byModel2;

  log("\n════════════════════════════════════════");
  log("[汇总]");
  log(`  六模块断言：${total} 条${allOk ? " 全绿" : ""}`);
  log(`  事故场景：${scenarioOk ? "✅ 通过" : "❌ 存在失败"}`);

  const finalOk = allOk && scenarioOk;
  if (!finalOk) {
    log("\n❌ 存在未通过的验收项");
    process.exit(1);
  }
  log(`\n✅ api 验收通过：六模块 ${total} 条断言全绿 + 事故场景走查通过`);
}

main();