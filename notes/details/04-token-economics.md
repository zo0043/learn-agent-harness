---
title: "token 经济学与延迟预算：成本是 agent 的第一约束"
slug: "04-token-economics"
domain: "成本与架构取舍"
source: "https://www.anthropic.com/engineering/multi-agent-research-system"
status: "2026现行"
kind: "cost-detail"
related: ["harness-from-scratch", "agent-harness", "evaluation"]
---

# 资深分水岭 4:token 经济学与延迟预算

## 一句话定义

agent 约消耗 chat 4 倍、多智能体约 15 倍的 token，且 token 用量解释约 80% 的性能方差——这组数字决定产品能否商业化，也决定"更大模型 vs 更多 agent"的架构选择。

## 为什么影响走向

初级看 agent 只看"能不能跑通"，资深先算 token 预算再画架构。多智能体内部评测比单智能体高 90.2%，听起来是免费升级——但 token 用量解释了 80% 的性能方差，多智能体消耗约 chat 15 倍 token：性能与成本是同一个旋钮的两端，只有高价值、可并行的任务才回本。因此 15x 这个数字同时是成本定价依据和架构决策依据：上多智能体不是"更聪明"，是买昂贵的并行。

## 行业一手源

Anthropic《How we built our multi-agent research system》：多智能体内部评测比单智能体高 90.2%，但 token 用量解释 80% 的性能方差，多智能体消耗约 chat 的 15 倍 token——只对高价值、可并行任务划算。

## 本地映射

- 已覆盖：从零写 harness §8（estimateTokens=JSON 长度/3.5，"预算检查用估算，精确计数只为计费"，预算与压缩机制已实现并经 mock 模型验证）；Harness 架构 §9.3（轮数/时间/费用上限是 harness 一等公民，预算耗尽保存状态、如实暂停，不包装成成功）；评测工程化 §S2 系统级指标（成本 $/任务、崩溃恢复成功率）+ S6（评测本身烧 token，judge 分层控成本）。
- 未覆盖：4x/15x 行业对比数字与"80% 方差"数据本身已列在「行业一手源」，但课程**没有把它们转成可执行的架构选择判据/检查清单**；课程有预算机制，但没有"用 token 账本做架构选择（更大模型 vs 更多 agent）"的行业数据支撑。

## 一句话概括

"我画 agent 架构前先算 token 预算：单 agent 约 chat 4 倍、多智能体约 15 倍——这个数字决定我敢不敢上多智能体，也决定产品怎么定价。"
