# harness-demo — 从零写最小 agent harness（从零写 harness 作品）

一个可运行的最小 agent harness，每个文件对应课程一节（见 `../notes/harness-from-scratch.md`）：

```
src/types.ts     ②③⑥⑨ 类型：消息 / 工具调用 / 轨迹事件
src/llm.ts       ② 单次调用 + ④ SSE 流式解析（OpenAI 兼容）
src/tools.ts     ③ 注册表 + JSON schema 校验 + 路径范围（沙箱-lite）
src/policy.ts    ⑤ 权限门：deny > approve > allow，默认 deny
src/session.ts   ⑥ JSONL 轨迹日志 = 唯一事实源，上下文由日志派生
src/context.ts   ⑧ token 估算 + 压缩（保头尾、中间 LLM 摘要）
src/agent.ts     ②⑥⑦⑧ agent loop + guarded_tool_step（intent→执行→result）
src/otel.ts      可观测 §S2 OTel GenAI 埋点（invoke_agent→chat/execute_tool span 树，console 导出，OTEL_EXPORT_OTLP=1 开 OTLP）
src/demo.ts      ⑨ demo 入口（五种模式）
src/test-compact.ts  ⑧ 压缩逻辑的本地 mock 测试（不依赖外部代理）
```

## 跑法

需要 node ≥ 18（本机默认 node 是 v12，用 nvm 的）：

```bash
export PATH=~/.nvm/versions/node/v22.23.2/bin:$PATH
npm install

# 配置（harness-demo/.env；若全局环境已有 LLM_BASE_URL/LLM_API_KEY 可省）
printf 'LLM_BASE_URL=%s\nLLM_API_KEY=%s\nLLM_MODEL=qwen3.8-flash\n' "$LLM_BASE_URL" "$LLM_API_KEY" > .env

npm run demo            # 正常跑
npm run demo:crash      # 在 write_file 的 intent 后模拟崩溃（exit 137）
npm run demo            # ← 紧接着再跑一次 = 自动恢复（未知状态 → 模型先核对再重写）
npm run demo:reject     # 审批拒绝路径（模型跳过写入、不重试、如实报告）
npm run demo:compact    # 低压缩阈值（600 tokens）演示压缩
npm run demo:otel       # OTel GenAI 埋点：最小 agent 循环（真实代理），console 导出 span 并收尾打印摘要
npx tsx src/test-compact.ts   # 压缩逻辑的 mock 测试（不依赖代理）
```

模型要求：**必须支持 OpenAI tools + SSE 流式**。实测某 OpenAI 兼容代理的 `qwen3.8-flash` ✅；`step-5-preview` ❌（不支持 tool calling）。

## 轨迹日志

`trajectories/demo.jsonl`：一行一个事件（init / model_response / tool_intent / tool_exec / compaction / final）。崩溃恢复就靠它：`tool_intent` 在、对应 `tool_exec` 不在 = 未知状态。

## 已知边界（教学刻意不做）

- 重试/超时：API 层没有 retry（真实 provider 会 400/超时——2026-10-10 实测该代理路由故障，见课程日志）
- 压缩只保"头+尾"，没有 pi 式条目树/分支
- 审批是 demo 自动批准（真实是 human-in-the-loop）
- 工具校验只查 required/type/enum（生产用 zod/ajv）
