---
title: "错误路径优先于快乐路径：agent 成功率由错误恢复决定"
slug: "03-error-paths"
domain: "恢复与可靠性"
source: "https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf"
status: "稳定历史"
kind: "mechanism-deepdive"
related: ["harness-from-scratch", "agent-harness"]
---

# 资深分水岭 3:错误路径优先于快乐路径

## 一句话定义

agent 的成功率由错误恢复能力决定，而不是快乐路径的完成度——失败时停机并把控制权交还用户；容器/harness 崩溃应被当作"可重试的工具错误"处理，会话日志支持冷启动恢复。

## 为什么影响走向

初级只设计 happy path：模型一跑偏、进程一崩溃，系统要么空转、要么盲目重放非只读操作造成二次伤害。行业共识是把"失败"当一等状态：OpenAI 官方指南要求失败时停机、把控制权交还用户；Anthropic 2026 的 Managed Agents 进一步把会话日志当唯一事实源，用 wake+getSession 对崩溃/中断的 agent 做冷启动恢复。错误路径设计得严谨与否，是 demo 和生产之间最直接的分界线。

## 行业一手源

OpenAI《A Practical Guide to Building Agents》：失败时必须停机并把控制权交还用户，护栏按工具风险分级触发暂停或升级人工。（2026 现行补充：Anthropic《Managed Agents》——session 日志支持冷启动恢复，崩溃=harness 级错误而非终点。）

## 本地映射

- 已覆盖：从零写 harness §7（先记 tool_intent 再执行；intent 在、exec 不在=结果未知；非只读不盲目重放、先摆状态让模型用 read_file 核对——模拟崩溃（harness 内 `process.exit(137)` 自触发）+ 真实恢复的实测输出）；Harness 架构 §6.1 三状态表 + §6.2 guarded_tool_step 契约；§9.1"loop 正常结束 ≠ 正确"；从零写 harness §9 四种 demo 模式，崩溃恢复模式全实测通过。
- 未覆盖：没有行业一手数字；本地恢复是"日志重建"路径，没有"session API 级冷启动"（wake+getSession）的对应物——那是产品化 SDK 的形态，本地课程未涉及。

## 一句话概括

"我设计 agent 先问'它崩溃了会不会重复伤害'：先记 intent 再执行，结果未知时先用只读工具核对现状，绝不盲目重放。"
