// ⑨ demo 入口：npm run demo 串起四个能力，每步断言式输出，全过才退出码 0
import { failureCount, addFailure, assertionTotal } from "./lib.js";
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
// U-24 口径：断言数由 ok() 实际计数（capabilities.ts 当前共 10 处 ok 调用），
// 末尾这行是「1 个总体判定」，不是第 N+1 个断言 → 输出「N 断言 + 1 总体判定」。
const failed = failureCount();
const total = assertionTotal();
console.log(failed === 0 ? `\n结果：${total} 断言 + 1 总体判定 = 全部 ✅` : `\n结果：${total} 断言中有 ${failed} 个失败 + 1 总体判定 = ❌`);
process.exit(failed === 0 ? 0 : 1);
