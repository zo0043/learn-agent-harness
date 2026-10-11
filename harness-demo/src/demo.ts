// ============================================================
// ⑨ demo 入口：多步任务 + 五种运行模式
//   npm run demo               正常跑（无日志时新开会话）
//   npm run demo:crash         在 write_file 的 intent 后模拟崩溃
//   npm run demo:reject        审批拒绝路径
//   npm run demo:compact       低阈值触发压缩
//   npm run demo:otel          OTel GenAI 埋点（span 导出 + 收尾摘要）
// ============================================================
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRegistry } from "./tools.js";
import { DEMO_POLICY, makeApproval } from "./policy.js";
import { Session } from "./session.js";
import { runAgent } from "./agent.js";
import { MODEL } from "./llm.js";
import { initOtel, printSpanSummary, shutdownOtel } from "./otel.js";

// .env 加载已下沉到 llm.ts 模块顶部（ES import 提升问题，见该文件注释）

const __dirname = dirname(fileURLToPath(import.meta.url)); // src/ 目录（不是文件路径！）
const argv = process.argv.slice(2);
const fresh = argv.includes("--fresh");
const crash = argv.includes("--crash");
const reject = argv.includes("--no-approve");
const compact = argv.includes("--compact");
const otel = argv.includes("--otel");

if (!process.env.LLM_BASE_URL || !process.env.LLM_API_KEY) {
  console.error("缺少 LLM_BASE_URL / LLM_API_KEY（应写在 harness-demo/.env）");
  process.exit(1);
}
if (otel) await initOtel(); // OTel GenAI 埋点：console 导出（OTEL_EXPORT_OTLP=1 时加 OTLP）

const system = `你是一个文件处理 agent。工具清单见 tools。要求：
1. 逐步完成用户任务
2. 工具被拒绝或报错时，调整计划继续，不要重试同一被拒操作
3. 遇到"未知状态"提示时，先用只读工具核对现状再决定
4. 完成后总结你做了什么、结果如何`;

const user = otel ? `1. 查北京天气\n2. 列出 docs 目录的文件\n3. 把一句"OTel 埋点验证完成"写入 out/otel.md\n4. 用 run_shell 执行 "df -h"（观察你如何处理被拒绝的操作）\n5. 总结` : `1. 查一下北京的天气
2. 列出 docs 目录下的文件，读取 README.md
3. 把 README.md 里项目的总结（一句话）写入 out/summary.md
4. 用 run_shell 执行 "df -h" 看看磁盘（我想知道你会怎么处理被拒绝的操作）
5. 完成后总结你做了什么`;

const sessionDir = resolve(__dirname, "..", "trajectories");
const session = new Session(sessionDir, "demo");
if (fresh && session.exists()) session.remove();

const registry = buildRegistry();
console.log(`[demo] model=${MODEL} session=${session.id}${fresh ? " (fresh)" : ""}${crash ? " [crash 模式]" : ""}${reject ? " [拒绝审批模式]" : ""}${compact ? " [低压缩阈值]" : ""}${otel ? " [OTel 埋点模式]" : ""}\n`);

try {
  const { final, ms, resumed } = await runAgent({
    system,
    user,
    registry,
    policy: DEMO_POLICY,
    approval: makeApproval(!reject),
    session,
    maxSteps: otel ? 8 : 15,
    compactThreshold: compact ? 600 : 12000,
    crashOnWriteIntent: crash,
    onDelta: (d) => {
      if (d.content) process.stdout.write(d.content);
    },
  });
  if (!resumed) process.stdout.write("\n");
  console.log(`\n[demo] 完成，耗时 ${ms}ms`);
} catch (e) {
  console.error(`\n[demo] 中止：${String(e)}`);
  if (otel) printSpanSummary();
  process.exit(1);
}
if (otel) {
  printSpanSummary(); // 收到的 span 摘要（span 名 + 关键属性），验证埋点生效
  await shutdownOtel();
}
