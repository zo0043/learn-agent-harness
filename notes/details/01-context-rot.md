---
title: "context rot：长上下文衰减，窗口大不等于能全塞"
slug: "01-context-rot"
domain: "上下文工程"
source: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents"
status: "2026现行"
---

## 一句话定义

上下文越长，模型的注意力分配与召回越差（注意力预算受 n² 关系约束），正确做法是追求"最小高信号 token 集"，而不是把窗口塞满。

## 为什么影响走向

初级工程师的第一错觉是"窗口大就能全塞"——2024 年 Gemini 1.5 把窗口推到 1M 后这个错觉尤其强。但注意力成本随序列长度近似平方增长，塞得越多召回越差，长任务必然出现"忘了目标"或"在旧信息里打转"。这一条结论直接决定三个设计方向：compaction（压缩）、子代理上下文隔离、上下文外记忆文件。同一个问题，三种答案，选哪个取决于信息是否"每轮都要在场"。

## 行业一手源

Anthropic《Effective Context Engineering for AI Agents》（2025-09）：注意力预算受 n² 关系约束，长上下文导致召回退化，上下文工程的目标是找到"完成本轮所需的最小高信号 token 集"。

## 本地映射

- 已覆盖：harness 架构课 §5.1 直接用"注意力边际递减（context rot）"并推出"窗口有限 ≠ 会话必须短"；§5.2 给出四技术（压缩/结构化笔记/即时检索/子代理），§8.1 有子代理"只回传 1-2k token 浓缩摘要"的量化说法；课程 A ⑧ 实现了预算与压缩（estimateTokens、compactIfNeeded 保 head+尾、中间 LLM 摘要，实测 2423→871 tokens），练习题库第 4 题考"压缩后忘了约束怎么办"。
- 未覆盖：没有 n² 注意力关系与"填充率 vs 召回"的行业对比数字；课程是定性论证，Anthropic 的"最小高信号"没有转成可执行的检查清单。

## 面试一句话

"别把窗口塞满——注意力是平方级预算，上下文工程就是挑'本轮真正需要的最小 token 集'。"
