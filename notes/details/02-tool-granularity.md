---
title: "工具粒度与描述质量：工具定义就是契约"
slug: "02-tool-granularity"
domain: "工具设计"
source: "https://www.anthropic.com/engineering/writing-tools-for-agents"
status: "稳定历史"
---

## 一句话定义

工具定义是模型与世界的契约——名称/文档精确、功能不重叠、返回 token 高效；一个烂工具会污染整条轨迹。

## 为什么影响走向

初级把工具当附属品（写个函数、随手写段描述）；资深把工具设计当一等公民。因为描述就是模型读的"API 文档"（Anthropic 称之为 ACI，agent-computer interface），粒度或边界出错会表现为模型选错工具、传错参数、反复试错，而且这类失败发生在轨迹深处，事后极难归因。Anthropic 的官方口径：做 SWE-bench 时，优化工具花的时间比优化整体提示词还多——这条第一手数据说明了这个分水岭的分量。

## 行业一手源

Anthropic《Writing Tools for Agents》：工具定义即契约——名称与文档要精确、功能不重叠、返回要 token 高效。（注：此 URL 由引用推断，要点已对照已核验的上下文工程文章与《Building Effective Agents》。）

## 本地映射

- 已覆盖：harness 架构课 §3.1（描述=模型读的 API 文档/ACI、"优化工具比优化提示词花时间多"、强制绝对路径的 poka-yoke、"最小可用集合"、"人类说不清该用哪个，模型也说不清"）；§3.2 三道门（校验/权限/执行）与"拒绝也是合法结果"；课程 A ③ 实现了 ToolSpec（name/description/parameters/readonly）+ validateArgs 三层校验，实测模型调用未注册工具 city→错误回写→自己改调 get_weather。
- 未覆盖：没有"描述质量 vs 成功率"的量化基准；工具返回值的 token 成本没有实测（A ③ 只校验入参，不管出参膨胀）。

## 面试一句话

"工具定义就是契约：描述是模型读的 API 文档，一个烂工具污染整条轨迹——我优化工具的时间和优化提示词一样多。"
