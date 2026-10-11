# LLM 演化时间线（agent 开发者视角）

> 状态：参考素材（2026-10-11，整理自 `industry-2026.md` §3）· 12 节点 · ★=面试谈资必需（5 个）
> 定位句：把模型侧的能力解锁按时间排成一条线——回答"为什么当年这么设计 / 为什么现在是这个格局 / 下一步往哪走"都用它

---

## 为什么 agent 开发者需要历史（3 句）

1. agent 的能力边界由模型代际决定：知道"哪一年解锁了哪个能力"，才能解释架构选择——上下文窗口决定长任务、function calling 决定工具协议、推理模型决定"少而深"。
2. 面试会考演化：MCP 的意义（"AI 的 USB-C"）只有带时间线才答得完整——2024.11 发布 → 2025.03-04 跨厂商采纳 → 2025-12 基金会治理 → 2026-07-28 spec 修订。
3. 历史节点=预测锚点：知道 Sonnet 4.5（2025.09）跨过质量门槛，才能答"为什么 agent 用量 2026 爆发"；知道 Managed Agents（2026.04），才能答"行业下一步往哪走"。

## 12 节点时间线

| 日期 | 事件 | 对 agent 开发的意义 | ★ |
|---|---|---|---|
| 2023.03 | GPT-4 发布（32k 上下文） | agent 能力起点 | |
| 2023.06 | OpenAI function calling 发布 | 工具调用开始标准化，一切 agent 的协议地基 | ★ |
| 2023.10 | GPT-4 Turbo 128k | 上下文窗口 4 倍，长任务成为可能 | |
| 2024.02 | Gemini 1.5 Pro（1M 上下文） | 长上下文时代开启 | |
| 2024.04 | Claude 3 家族 + Anthropic Tool Use GA | 工具调用跨厂商趋同，agent 进入生产 | ★ |
| 2024.09 | o1 发布 | 推理模型开启：agent 设计从"多调用"转向"少而深"，重试/投票类模式价值下降 | ★ |
| 2024.11 | MCP 发布（Anthropic） | 工具/连接器协议标准化，"AI 的 USB-C" | ★ |
| 2025.02–04 | Claude Code 预览→GA、OpenAI Agents SDK | coding agent 产品化 + SDK 层成型 | |
| 2025.03–04 | OpenAI、Google 先后采纳 MCP | de facto 标准确立 | ★ |
| 2025.09 | Claude Sonnet 4.5（SWE-bench ~77%） | 长时程自主编码跨过质量门槛，agent 用量爆发 | |
| 2026.04 | Anthropic Managed Agents | harness 接口化/虚拟化，"为尚未写出的程序"设计系统 | |
| 2026.07 | MCP 最新 spec 修订（2026-07-28：订阅、多轮请求、授权服务器发现等） | 协议仍在快速演进 | |

**★ 节点（5 个，面试必需）**：2023.06 function calling / 2024.04 Claude 3 + Tool Use GA / 2024.09 o1 / 2024.11 MCP / 2025.03-04 OpenAI+Google 采纳 MCP。

## 来源与时间标注（数字→URL 对照）

- **2025 前后有官方一手源**（自 industry-2026.md 复制）：
  - 2024.11 MCP 发布（spec 2024-11-05 初版）+ 2025.03-04 跨厂商采纳 + 2025-12 捐给 Linux 基金会 AAIF + 2026.07 spec 修订（2026-07-28：订阅/多轮请求/授权服务器发现）[2026现行] → https://modelcontextprotocol.io/specification/versioning
  - 2025.02-04 Claude Code 预览→GA / Agents SDK [2026现行] → https://code.claude.com/docs/en/agent-sdk/overview ；OpenAI Agents SDK（Swarm 后继）→ https://developers.openai.com/codex
  - 2025.09 Sonnet 4.5（SWE-bench ~77% 长时程编码）[2026现行] → https://www.anthropic.com/engineering/managed-agents （一手讨论 Sonnet 4.5→Opus 4.5 代际演化的源）
  - 2026.04 Managed Agents（harness 接口化/虚拟化）[2026现行] → https://www.anthropic.com/engineering/managed-agents
- **2025 前节点（2023.03–2024.09，含 32k/128k/1M 窗口数字）**：公认公开史实，日期来自记忆——**待复核**（沿用 industry-2026.md 已知缺口第 4 条；如需逐条 URL 可再补一轮核实）

## 面试 30 秒口述版（★ 节点串成一段）

"agent 的协议地基从 2023.06 开始：OpenAI function calling 把工具调用标准化，2024.04 Claude 3 家族 + Anthropic Tool Use GA 让工具调用跨厂商趋同，agent 进入生产。2024.09 o1 发布开启推理模型时代——agent 设计从'多调用'转向'少而深'，重试/投票类模式价值下降。2024.11 Anthropic 发布 MCP，把工具/连接器协议标准化，就是'AI 的 USB-C'；2025.03-04 OpenAI 和 Google 先后采纳，de facto 标准确立（2025-12 捐给 AAIF 基金会治理，最新 spec 2026-07-28 仍在演进）。然后是模型侧跨过质量门槛：2025.09 Sonnet 4.5（SWE-bench ~77%）让长时程自主编码商用可行，agent 用量爆发；2026.04 Anthropic Managed Agents 把 harness 推向接口化/虚拟化——为尚未写出的程序设计系统。"
