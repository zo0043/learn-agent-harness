# api-demo —— API 与多模型路由 §S2 作品

模型调用层的最小可运行闭环：**六个模块各带可证伪断言**，证明「调一个模型」不是裸调用，而是有失败分类、预算、降级、归因的可靠性系统。

全离线零 key：mock provider 用内存数据 + 逻辑时钟，不联网、不调真实模型、不 import 任何需联网的 SDK。

## 跑法（clone 判据）

```bash
cd api-demo
npm i          # tsx/typescript 在 dependencies（防 NODE_ENV=production 跳过）
npm run demo   # 六模块断言 + 事故场景走查，末尾 `✅ api 验收通过`（exit 0）
npm run typecheck
```

- **判据**：`npm run demo` 末尾打印 `✅ api 验收通过：六模块 N 条断言全绿 + 事故场景走查通过`；任一断言失败打印 `❌` 且退出码 1。
- **确定性**：不用 `Date.now()`/`Math.random()`/pid；jitter 用固定 seed 的 mulberry32。跑 N 次输出逐字节一致。

## 六模块（各一断言）

| 模块 | 断言 | 教学点 |
|---|---|---|
| SSE 流式 | 跨帧 tool_calls 拼接后整体 parse；断流标 incomplete；error 帧抛错 | 分帧/拼接/整体 parse |
| 结构化输出 | 类型错违约；`city:"北惊"` 形状过语义 reject | schema 合法 ≠ 语义正确 |
| prompt caching | 同前缀第 2 次 hit ×0.5；前缀插时间戳命中=0 | 缓存键要稳定 |
| 重试分类 | 400 retried=0；500 指数退避成功；预算耗尽放弃 | 4xx 不盲重试 |
| 多模型路由 | 能力矩阵跳无 tool_calling；故障降级；全失败如实失败 | 路由+降级阶梯 |
| 成本计数 | token×单价 → total + byModel 两行 | 成本归因到模型 |

## 复用与边界（照搬 harness-demo 语义，独立实现不跨目录 import）

- `chatStream` 的 SSE 三件事（`\n\n` 分帧 / content 拼接 / tool_calls 按 index 分槽、流结束整体 `JSON.parse`）→ `sse.ts`
- `tools.ts` 的 `validateArgs` 教学三层（required + type + enum）→ `schema.ts`
- `agent.ts` 的 `tc.name.trim()` 防御性解析思想 → 路由/工具名相关的注释里
- `context.ts` 的「预算意识」→ `caching.ts` 的稳定前缀

**唯一新增**（本 demo 相对 harness-demo 多的生产分支）：流中 `error` 帧、断流标 `incomplete`（均已实现）。双定时器/取消传播属「更大生产分支」，本最小闭环未实现（见 `notes/api-mvp-spec.md` §8.1 注明为桩不阻塞验收）。

## 事故场景（复用 notes/api-engineering.md S7）

`p-capable` 注入 `400 route 错`（functions 参数被误路由到不支持 functions 的模型）→ `classify` 判 400 → **不重试**（契约违约）→ `withFallback` 降级到 `p-fast` → 成本归因到两个模型。

## NonGoals（不做）

真实 provider / 真实 key / OAuth / TLS / 真实网关(litellm 那套) / 真实 HTTP server / 真实 KV cache / 约束解码采样 / 生产鉴权多租户。