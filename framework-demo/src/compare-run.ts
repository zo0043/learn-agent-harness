// compare-run.ts —— compare 与 compare:assert 共用的"跑三家"入口
//
// 顺序串行跑三家（2 核小机器，避免并发抢 mock/端口），每家的轨迹都是
// UnifiedTrace（src/sdks/task.ts）。全部模型流量打到本地 mock 端点，
// 不读 .env、不碰任何真实端点——这是"断言离线可复现"的直接保证。
import { startMockModel, MOCK_PORT, type MockServer } from "./mock-model.js";
import { runClaudeTrace } from "./sdks/claude.js";
import { runOpenAITrace } from "./sdks/openai.js";
import { runLangGraphTrace } from "./sdks/langgraph.js";
import type { UnifiedTrace } from "./sdks/task.js";

export interface CompareRun {
  mock: MockServer;
  traces: [UnifiedTrace, UnifiedTrace, UnifiedTrace];
}

export async function runAllThree(): Promise<CompareRun> {
  let mock: MockServer;
  try {
    mock = await startMockModel(MOCK_PORT);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "EADDRINUSE") {
      console.error(`mock 模型端点端口 ${MOCK_PORT} 被占用：先停掉占用进程（lsof -i :${MOCK_PORT}）再跑 compare`);
      process.exit(2);
    }
    throw e;
  }
  try {
    // 串行：每家的 mock 请求计数按"运行前/后"切片，OpenAI 与 LangGraph 共用
    // /v1/chat/completions，并行会互相污染计数
    const claude = await runClaudeTrace(mock);
    const openai = await runOpenAITrace(mock);
    const langgraph = await runLangGraphTrace(mock);
    return { mock, traces: [claude, openai, langgraph] };
  } catch (e) {
    await mock.close().catch(() => {});
    throw e;
  }
}
