---
title: "可观测→可改进闭环：迭代速度由失败归因能力决定"
slug: "06-observability-loop"
domain: "可观测与评测"
source: "https://www.anthropic.com/engineering/multi-agent-research-system"
status: "2026现行"
kind: "design-detail"
---

# 资深分水岭 6:可观测→可改进闭环

## 一句话定义

可观测不是"能看到"，而是"能改进"：可重放的事件日志（如 getEvents() 位置切片）+ 逐轨迹 eval + 控制台逐步观察，形成"观察到失败→归因→改进→回归"的闭环。

## 为什么影响走向

资深团队与 demo 团队的本质差距不在模型选择，而在"为什么失败"的归因能力：日志可重放、每条轨迹可评分、问题能在控制台里逐步看到，每次改 prompt/换模型/动 harness 才有 go/no-go 依据。没有这个闭环，所有改动都是盲调；有了它，失败案例变成改进输入，迭代速度就是复利。这也是 2026 年"agent 基础设施"岗位把沙箱隔离+评测闭环当主战场的原因。

## 行业一手源

Anthropic《How we built our multi-agent research system》：生产多智能体系统配套自定义控制台，逐步观察编排者与每个子代理的进度，会话日志可回放定位失败——可观测是这套系统能持续迭代的底座。

## 本地映射

- 已覆盖：从零写 harness §6(JSONL 一行一条、日志是唯一事实源、上下文由日志确定性派生）；Harness 架构 §9.2（记什么日志+脱敏纪律）+ §9.1（评估对象是 harness+模型整个系统）；评测工程化 §S2(四层指标含轨迹级：多余步/重复调用/死循环率）+ §S4(轨迹评测)+ §S6(CI 门禁)；可观测 §S3(span 建模轨迹树)+ §S5(调试工作流：回放+对比），定位"可观测是评测的数据管道"。
- 未覆盖:OTel 埋点已落地(harness-demo `demo:otel`,11 spans/1 trace);仍缺 getEvents() 式“位置切片重放”的 API 示例,也没有“逐步观察 agent”的控制台产物(Anthropic 自定义 UI 无对应 demo)。

## 面试一句话

"我不接受'模型说做完了'——日志是唯一事实源且可重放，每条轨迹有过程级评分，每次变更才有 go/no-go 依据。"
