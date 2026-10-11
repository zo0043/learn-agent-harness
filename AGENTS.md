# learn-agent-harness（学习系统主目录）

这是 AI 学习系统的**主目录**（基于 amosblomqvist/learn 的 pi-web 适配版）。教学 skill 和扩展已安装为**全局**（`~/.pi/agent/skills/{teach,visualize}`、`~/.pi/agent/extensions/{quiz,md-log}.ts`），任何目录的 pi-web 会话都可用；本目录承载渲染器、课程日志和 Obsidian vault。

## 行为约定（在本目录工作时）

- **用中文回复**（除非用户切换语言）。课程、日志、图注默认中文，术语保留英文原文。
- 在**任何**目录里，用户明确要学习/上课/系统讲解某主题时，按 `teach` skill 流程走（probe → plan → teach）；普通的简短解释不触发。
- **准确性不可妥协**：对事实、名字、公式、定义稍有不确定，先用 `web_explore`（单次快查）或 `delegate_task(profileName="librarian")`（多面研究）核实，绝不凭记忆断言。
- 配图按 `visualize` skill：结构图写 ```mermaid``` 代码块直接进课程；几何图手写 SVG 到 `viz/`，`node viz/render.mjs viz/<slug>.svg` 渲染后验证（能看图的模型亲眼看 PNG；不能的按源码逐坐标核验并注明）再嵌入 `![[<slug>.png|500]]`。
- 出题用 `quiz` 工具；返回 "quiz requires interactive mode UI"（pi-web 无 TUI）时按 teach skill 的 chat-graded quiz 流程，本会话内不再重试。
- 有标准答案的题用 quiz；无标准答案的分叉提问用 `ask_user_question`。

## 日志

- 长课程开始时执行 `/md-log notes/<主题>.md`（或绝对路径），课程全文（LaTeX 公式、mermaid、嵌入 PNG）实时镜像进该文件；本目录即 Obsidian vault。
