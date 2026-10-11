// ⑨ demo 入口：npm run demo 串起四个能力，每步断言式输出，全过才退出码 0
import { failureCount, addFailure } from "./lib.js";
import { step1_minimalAgent, step2_subagent, step3_permissions, step4_session } from "./capabilities.js";

console.log("framework-demo：Claude Agent SDK 四能力最小实操（指向本地双格式代理）");
try {
  await step1_minimalAgent();
  await step2_subagent();
  await step3_permissions();
  await step4_session();
} catch (e) {
  console.error("\n[异常]", e instanceof Error ? e.message : e);
  addFailure();
}
console.log(failureCount() === 0 ? "\n结果：4 个能力全部 ✅" : `\n结果：有 ${failureCount()} 个断言失败 ❌`);
process.exit(failureCount() === 0 ? 0 : 1);
