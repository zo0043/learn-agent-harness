---
title: "HITL 审批与结构性安全边界：信任边界决定部署范围"
slug: "05-hitl-security"
domain: "沙箱安全"
source: "https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf"
status: "2026现行"
---

## 一句话定义

按工具风险分级触发暂停/人工升级（HITL），凭据放 vault、agent 永不可触及 token（MCP 代理代签）——信任边界是结构性决定的，靠 prompt 约束安全是初级做法。

## 为什么影响走向

审批（能不能做）与范围（能影响什么）是两个独立问题，单独哪个都不够；提示词是三层防线里最不可靠的一层，prompt injection 正是对这条边界的对抗压力测试。信任边界怎么画，直接决定 agent 能部署到哪一档（只读→写→生产）和提示注入风险的上限。行业 2026 的做法是把边界做进结构：凭据在 vault 里，沙箱内进程拿不到，MCP 代理代签——而不是指望模型"记得别碰"。

## 行业一手源

OpenAI《A Practical Guide to Building Agents》：护栏分层，按工具风险分级（只读/写、可逆性、财务影响）触发暂停或升级人工。（2026 现行补充：Anthropic《Managed Agents》——凭据结构性地不可被沙箱触及，MCP 代理代签。）

## 本地映射

- 已覆盖：课程 A ⑤（policy：deny>approve>allow、默认 deny，write_file→approve 即 human-in-the-loop，审批拒绝模式实测通过）；harness 架构课 §7.1（提示词不构成防线）+ §7.2（审批管"能不能"、scope 管"影响什么"）；E 课 S1（权限层≠沙箱三道独立门，提示词只能当第一道不能当最后道）+ S2 四通道 policy 引擎（approve 通道=挂起等人工批准）+ S4（最小凭据/零常驻凭据/egress 默认关/代执行）。
- 未覆盖：行业"按风险维度分级"（只读/写、可逆性、财务影响）没有落进本地 policy（本地是按工具名平铺三档，不是风险矩阵）；"vault + MCP 代理代签"在 E S4 只有"代执行"的定性描述，无完整实现。

## 面试一句话

"我不把安全写进 prompt——审批管'能不能做'，沙箱管'做了能炸多大'，凭据对 agent 结构性不可触及，注入攻击拿不到 token 就炸不出圈。"
