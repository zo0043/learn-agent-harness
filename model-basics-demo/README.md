# model-basics-demo —— model-basics §S1/S4/S8 作品

KV cache / 推理成本数值走查脚本：输入（上下文长 / 输出预算 / 单价 / 并发 / 模型结构参数）→ 输出（KV 显存估算、前缀缓存命中 savings、TTFT/TPOT 首 token 估算、总成本按 prefill/decode 拆分）。四模块各一可证伪断言 + S8 延迟归因六步走查重放。

**全离线零 key**：纯计算脚本，不调模型、不联网、不 import 任何 SDK。**确定性**：输入全部预置常量，无 `Date.now()`/`Math.random()`/pid，跑 N 次逐字节一致。

## 跑法（clone 判据）

```bash
cd model-basics-demo
npm i
npm run demo        # 四模块 10 断言 + S8 六步走查，末尾 `✅ model-basics 验收通过：四模块断言全绿`（exit 0）
npm run typecheck
```

- **判据**：`npm run demo` 末尾打印 `✅ model-basics 验收通过：四模块断言全绿`；任一失败 `❌` 且 exit 1。

## 四模块（各一断言）

| 模块 | 断言 | 教学点 |
|---|---|---|
| kv | `kvBytesPerToken(32,8,128,2) === 131072`；8K×并发 8 = 8 GiB | KV 公式 2×layers×kv_heads×head_dim×bytes |
| cache | 稳定前缀命中 → prefill 只算新增 500；动态放最前 → 全 8K 重算 | 前缀缓存 miss 的常见根因 |
| latency | TTFT 拆队列 2.2s / prefill 1.0s；TPOT 随并发 B 上升 | 排队 vs prefill、内存带宽受限 |
| cost | stepCost=token×单价(输出 3-5×)；步数放大 > 省字；折扣只打 prefill；两行归因 | 成本模型三件事 |

## 量级参考口径（重要）

`0.13 MB/token`、输出 `3-5×`、`TTFT 2.2s`、TPOT `40ms` 等均为 **S8 示例模型量级参考**（Mistral-7B 量级、FP16），不是某真实硬件/模型的精确承诺。公式是严格的（可手推）；常数是预置输入，期待值用「预置输入手算后」写死在断言里，会随模型/硬件漂移的精确数只出现在 notes 正文「来源与锚点」，不进 clone 判据。

## S8 六步走查重放

`npm run demo` 末尾用脚本函数把 `notes/model-basics.md` §S8 的六步重算一遍：拆 TTFT/TPOT → 单请求基线拆出排队 2.2s → KV 显存 8GB → 前缀 miss 是 prefill 主因（修前缀后 8K→500）→ batch/并发（TPOT 随 B 升）→ 量化/speculative 只救 TPOT → 三条优化收口。

## 复用与边界

- 复用 `notes/model-basics.md` §S1（KV 公式）、§S4.1（成本模型）、§S4.0/§S8（TTFT/TPOT），照搬公式语义、注释出处，独立目录不 import 任何上位 demo。
- **NonGoals**：真实模型推理 / 真实 GPU / 推理引擎 / provider 调用（零 API key）；数值校准；微调/训练/采样模拟 —— 全部排除。