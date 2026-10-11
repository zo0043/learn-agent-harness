# learn-agent-harness

AI agent 开发学习系统 + **coding agent 方向面试备考作品**。

核心思路：用 AI 教 AI（pi-web 学习系统）的同时，把每节课的知识点落成**零框架可运行作品**——从零手写的最小 agent harness、零依赖 RAG pipeline、白板版……作品里每个文件对应课程一节，配套完整课程笔记与面试题库。

## 作品

| 目录 | 内容 | 跑法 |
|---|---|---|
| [`harness-demo/`](harness-demo/) | **课程 A**：从零写最小 agent harness——agent loop / SSE 流式 / JSON schema 校验 / 权限门（deny>approve>allow，默认 deny）/ JSONL 轨迹 + 崩溃恢复 / token 压缩。9 个文件对应 9 节，4 种 demo 模式（正常 / 崩溃恢复 / 审批拒绝 / 压缩） | `cd harness-demo && npm i && cp .env.example .env`（填自己的 key）→ `npm run demo` |
| [`rag-demo/`](rag-demo/) | **课程 B**：从零写最小 RAG——chunker → hash embedder（768 维）→ 暴力余弦 ∥ BM25 → RRF 融合 → 强制引用 + 强制拒答生成 → 10 题 golden set 评测（recall@3=1.00）。零依赖 tsx | `cd rag-demo && npm i` → `npm run demo:eval` |
| [`whiteboard/`](whiteboard/) | 白板版 agent（~150 行 Python，面试口述用） | 直接读源码 |
| [`viz/render.mjs`](viz/render.mjs) | SVG→PNG 渲染器（node12 re-exec 自举 + playwright-core，复用本机 Chromium 零下载） | `node viz/render.mjs x.svg` |
| `sandbox-demo/` | **课程 E**（计划中）：TS 迷你沙箱——四通道 policy 引擎 + 事故重放（全离线确定性） | src 待写 |

作品要求 **node ≥ 18** 与任一支持 **tool calling + SSE 流式** 的 OpenAI 兼容 LLM 端点（`viz/render.mjs` 与 `whiteboard/` 除外）。

## 课程笔记（`notes/`）

16 个文件 / ~200KB，Obsidian vault（LaTeX、mermaid、PNG 全渲染）。备考 coding agent 岗（Codex Core / Claude Code 类）的知识结构：

- **总索引**：[knowledge-map.md](notes/knowledge-map.md)——15 个知识域状态 + 分阶段学习路线 + 完成判据
- **面试题库**：[interview-bank.md](notes/interview-bank.md)——结构题 / 交叉题 / JD 覆盖矩阵 / 行为面
- **架构主线**：[agent-harness.md](notes/agent-harness.md)（13 节）· [harness-from-scratch.md](notes/harness-from-scratch.md)（课程 A 实录）· [rag.md](notes/rag.md)（课程 B 实录）
- **知识域课程**：system-design / durable-execution / sandbox / evaluation / mcp / api-engineering / data-flywheel / long-term-memory / observability / framework-ecosystem / model-basics

## 学习系统（这个仓库的"为什么"）

本目录是 [amosblomqvist/learn](https://github.com/amosblomqvist/learn)（pi 作者的个人 AI 学习系统，视频《How I Use AI to Learn Things》）的 **pi-web 适配版**：teach/visualize 两个 skill + quiz/md-log 两个扩展，"教我 X" → probe（探测水平）→ plan（带依赖图的教学计划）→ teach（逐节点讲授 + 判分题），课程全文实时镜像进 `notes/`。

主要适配：

- 查证：tmux researcher subagent → `web_explore` / librarian worker（去掉 tmux 依赖）
- 配图：svg-maker/mermaid-maker subagent → 主会话直接创作（结构图写 mermaid 代码块；几何图手写 SVG → `viz/render.mjs` 渲染）；无视觉模型时按 SVG 源码逐坐标核验
- quiz：终端 pi 保留 TUI 选项面板；pi-web 降级为聊天判分（编号选项 → 报字母 → 立即判分 + 解释）
- 全局安装于 `~/.pi/agent/`，任意目录可用；本仓库 `AGENTS.md` 记录本目录行为约定

完整交接与维护记录见 [handoff.md](handoff.md)。
