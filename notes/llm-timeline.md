# LLM 时间线(agent 开发者视角)

> 状态：参考素材（2026-10-11，整理自 `industry-2026.md` §3）· 12 节点 · ★=实战要点必备（5 个）
> 定位句：把模型侧的能力解锁按时间排成一条线——回答"为什么当年这么设计 / 为什么现在是这个格局 / 下一步往哪走"都用它

---

## 为什么 agent 开发者需要历史（3 句）

1. agent 的能力边界由模型代际决定：知道"哪一年解锁了哪个能力"，才能解释架构选择——上下文窗口决定长任务、function calling 决定工具协议、推理模型决定"少而深"。
2. 常会考演化：MCP 的意义（"AI 的 USB-C"）只有带时间线才答得完整——2024.11 发布 → 2025.03-04 跨厂商采纳 → 2025-12 基金会治理 → 2026-07-28 spec 修订。
3. 历史节点=预测锚点：知道 Sonnet 4.5（2025.09）跨过质量门槛，才能答"为什么 agent 用量 2026 爆发"；知道 Managed Agents（2026.04），才能答"行业下一步往哪走"。

## 12 节点时间线

| 日期 | 事件 | 对 agent 开发的意义 | ★ |
|---|---|---|---|
| 2023.03 | GPT-4 发布（32k 上下文） | agent 能力起点 | |
| 2023.06 | OpenAI function calling 发布 | 工具调用开始标准化，一切 agent 的协议地基 | ★ |
| 2023.11 | GPT-4 Turbo 128k（2023-11-06 宣布） | 上下文窗口 4 倍，长任务成为可能 | |
| 2024.02 | Gemini 1.5 Pro（1M 上下文） | 长上下文时代开启 | |
| 2024.03–05 | Claude 3 家族（2024-03-04）；Anthropic Tool Use beta（2024-04-04）→ GA（2024-05-30） | 工具调用跨厂商趋同，agent 进入生产 | ★ |
| 2024.09 | o1 发布 | 推理模型开启：agent 设计从"多调用"转向"少而深"，重试/投票类模式价值下降 | ★ |
| 2024.11 | MCP 发布（Anthropic） | 工具/连接器协议标准化，"AI 的 USB-C" | ★ |
| 2025.02–05 | Claude Code 研究预览（2025.02）、OpenAI Agents SDK 发布（2025-03-11）、Claude Code GA（2025-05-22） | coding agent 产品化 + SDK 层成型 | |
| 2025.03–04 | OpenAI、Google 先后采纳 MCP | de facto 标准确立 | ★ |
| 2025.09 | Claude Sonnet 4.5（SWE-bench ~77%） | 长时程自主编码跨过质量门槛，agent 用量爆发 | |
| 2026.04 | Anthropic Managed Agents | harness 接口化/虚拟化，"为尚未写出的程序"设计系统 | |
| 2026.07 | MCP 最新 spec 修订（2026-07-28：订阅、多轮请求、授权服务器发现等） | 协议仍在快速演进 | |

**★ 节点（5 个，实战必需）**：2023.06 function calling / 2024.03 Claude 3 家族（Tool Use beta 2024-04-04 → GA 2024-05-30）/ 2024.09 o1 / 2024.11 MCP / 2025.03-04 OpenAI+Google 采纳 MCP。

## 来源与时间标注（数字→URL 对照）

- **2025 前后有官方一手源**（自 industry-2026.md 复制）：
  - 2024.11 MCP 发布（spec 2024-11-05 初版）+ 2025.03-04 跨厂商采纳 + 2025-12 捐给 Linux 基金会 AAIF + 2026.07 spec 修订（2026-07-28：订阅/多轮请求/授权服务器发现）[2026现行，2026-10-12 复核：官方 versioning 页确认 "The current protocol version is 2026-07-28"，见 industry-2026.md 核实台账 #3] → https://modelcontextprotocol.io/specification/versioning
  - 2025.02–05 Claude Code 研究预览（2025.02，一手公告未取到 → 仅月份级）→ GA **2025-05-22**（官方公告页头日期）→ https://www.anthropic.com/news/claude-4 ；OpenAI Agents SDK（2025-03-11 发布，Swarm 后继）→ https://openai.github.io/openai-agents-python/ ；Claude Agent SDK 文档 → https://code.claude.com/docs/en/agent-sdk/overview
  - 2025.09 Sonnet 4.5（SWE-bench Verified **77.2%**）[2026现行，2026-10-19 复核] → https://www.anthropic.com/news/claude-sonnet-4-5 （发布公告，含 77.2% 与方法学）；代际讨论（Sonnet 4.5→Opus 4.5「harness 假设腐烂」）另见 https://www.anthropic.com/engineering/managed-agents
  - 2026.04 Managed Agents（harness 接口化/虚拟化）[2026现行] → https://www.anthropic.com/engineering/managed-agents
- **2025 前节点：2026-10-19 已补一手 URL**（此前写「日期来自记忆·待复核」，本轮改为带源）：
  - 2023.11 GPT-4 Turbo 128k（2023-11-06 宣布）→ https://en.wikipedia.org/wiki/GPT-4 （OpenAI 官方 DevDay 页对本机 403，故用维基佐证，**一手未取到**）
  - 2024.03 Claude 3 家族（2024-03-04）→ https://www.anthropic.com/news/claude-3-family ；Tool Use beta（2024-04-04，Anthropic 官方账号原文 "Tool use is now available in beta"）→ GA（2024-05-30，见 https://cloud.google.com/blog/products/ai-machine-learning/anthropics-claude-3-opus-and-tool-use-are-generally-available-on-vertex-ai ）
  - 2024.02 Gemini 1.5 Pro（1M 上下文）→ https://blog.google/technology/ai/google-gemini-next-generation-model-february-2024/
  - 2023.03 GPT-4（2023-03-14，见上维基页）；**2023.06 function calling 精确日仍未取到一手源**（官方 blog 对本机 403），仅存月份级；2024.09 o1（2024-09-12）

