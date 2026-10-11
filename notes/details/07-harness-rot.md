---
title: "harness 假设会腐烂：为尚不存在的模型写稳定接口"
slug: "07-harness-rot"
domain: "架构演化"
source: "https://www.anthropic.com/engineering/managed-agents"
status: "2026现行"
kind: "design-detail"
---

## 一句话定义

harness 编码了"模型做不到"的假设，而这些假设随模型升级腐烂——资深为"尚不存在的模型"写稳定接口、实现可自由更换；初级为"当前模型"写死逻辑。

## 为什么影响走向

为 Sonnet 4.5 打的补丁（如 context-anxiety 触发的上下文重置）在 Opus 4.5 上成了死重：你为当前模型的每个短板写的兼容 hack，都是下个模型的技术债。行业的解法是把 session/harness/sandbox 像操作系统虚拟化硬件一样抽象成稳定接口——接口不变，实现随模型换代自由更换。这是"维护逻辑"与"系统设计"的分水岭，也是 2026 年"为尚未写出的程序设计系统"这一工程立场的直接来源。

## 行业一手源

Anthropic《Managed Agents》（2026-04）：harness 编码了"模型做不到"的假设，假设随模型升级腐烂（Sonnet 4.5 的 context-anxiety 上下文重置在 Opus 4.5 上成了死重）；解法是把 session/harness/sandbox 抽象成稳定接口，凭据结构性地不可被沙箱触及。

## 本地映射

- 已覆盖：harness 架构课 §10.2（"每层删掉会失去什么保证"的逐层复习，已有分层抽象意识）；从零写 harness 开场模型侦察（step-5-preview 不支持 tool calling、qwen3.8-flash 支持→"harness 必须能降级"）+ ⑨ 代理故障实录（持续 400、工具名带不可见字符→tc.name.trim() 防御）；沙箱与凭据 §S6（模型版本号 pin，"模型会静默升级"——qwen3.8-flash 直接下架是活例子）。
- 未覆盖：没有"为尚不存在的模型设计稳定接口"（虚拟化接口）的框架；沙箱与凭据 §S6 的 pin 是"防变化"取向，与"实现可自由更换"取向相反；从零写 harness §9 的防御性代码正是会腐烂的死重样本，但课程没有把它上升为这条规则。

## 面试一句话

"我不为当前模型写死逻辑——harness 里的每个'模型做不到'假设都会随模型升级腐烂，所以我把 session/harness/sandbox 抽象成稳定接口，实现当可更换件。"
