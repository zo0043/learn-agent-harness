# 修复日志：knowledge-map 组
- 修复员：pedagogy｜时间：2026-10-19 00:15（Asia/Shanghai）
- 依据：`reviews/2026-10-19/FIX-CHARTER.md`（§0 硬规则 / §1 冻结口径 / §2 写入分区 / §3 knowledge-map 清单 / §5 交付格式）
- 可写范围（**只有**）：`notes/knowledge-map.md` + 本日志。其余一律只读。
- 覆盖声明：
  - 本文件逐行修读（原 174 行；修订后以 `wc -l` 为准）。
  - 参照（**只读**）：`site/src/data/course-structure.ts`（prereqs/stage 取值源，mtime 记录见 P2）、`notes/interview-bank.md`（§6 JD 矩阵）、`site/src/pages/*.astro`（只核对口径，不改）。
  - 清单状态：**逐条追加中**（未完成项先写「待修」，不留到最后一次性写）。
- 前置事实：本次接手时 `notes/knowledge-map.md` mtime=2026-10-14 19:10:35（本轮仅我一人写该文件）。

---

## 逐条修改记录

### ID：A3 / PED-F1｜课程总表「优先级」列改名「岗位权重」、P0/P1/P2 → W0/W1/W2 ✅
- 文件：`notes/knowledge-map.md` 课程总表（原 `:53` 表头 + 14 行数据；改后表头/说明行见 `:53` 与其下新增说明行）
- 改动前 → 后：
  - 表头：`| 主题 | 优先级 | 状态 | 课程文件 | 完成后你能做到 |` → `| 主题 | 岗位权重 | 状态 | 课程文件 | 完成后你能做到 |`
  - 值：14 行 `P0/P1/P2` → `W0/W1/W2`（一一对应：从零写 harness P0→W0、RAG P0→W0、系统设计 P0→W0、可观测 P2→W2、沙箱 P0→W0、长期记忆 P2→W2、durable P1→W1、评测 P0→W0、MCP P1→W1、API P1→W1、数据飞轮 P1→W1、模型基础 P2→W2、框架生态 P2→W2、多智能体编排 P0→W0）
  - 表下新增说明行（原文）：`> **第 2 列口径（2026-10-19 改名）**：\`W0/W1/W2\` 是**岗位权重**，由旧列名「优先级」及其旧值 \`P0/P1/P2\` 改名而来（一一对应：P0→W0、P1→W1、P2→W2）。**它不是教学阶段、不是阅读序**——阶段标签 \`P0–P4\` 与线性阅读序见站点 \`/learn/\`（唯一真源 \`site/src/data/course-structure.ts\` 的 \`stage\` 与数组序）。历史上两套 \`P0/P1/P2\` 曾同名不同义（旧优先级 vs 站点阶段），改名为消歧。`
- 连带（同一根因，一并消歧）：`未结事项` 里 `调 P1/P2 权重` → `调 W1/W2 岗位权重`。
- 验证：
  ```
  $ grep -n '岗位权重\|W0\|W1\|W2' notes/knowledge-map.md | head -20
  :53  | 主题 | 岗位权重 | 状态 | 课程文件 | 完成后你能做到 |
  :55  | 从零写 harness | W0 | ✅ | ...
  :69  > **第 2 列口径（2026-10-19 改名）**：W0/W1/W2 是**岗位权重** …
  $ grep -c '优先级' notes/knowledge-map.md
  0
  ```
- 未动（转交）：`site/src/data/course-structure.ts` 的 `stage` 值（宪章 §1 冻结 P0–P4 不改，属 `sot-data` 组）；`site/src/data/courses.ts` 的 legacy `phase: 'P0'|'P1'|'P2'`（同属 `sot-data`）。

### ID：P2｜mermaid 依赖图边改为与 `course-structure.ts` 的 `prereqs` 逐条一致 ✅
- 文件：`notes/knowledge-map.md`「依赖图」节（原 `:78-131`；改后见同一节）
- 改动前 → 后（**共 17 条实线，全部由 `prereqs` 派生**）：
  - 节点：新增 `AGENTH`（`agent-harness`，主线）；14 个标签里的 `P0/P1/P2` → `W0/W1/W2`；`INTERVIEW` 标签由「🎯 面试演练 · P0 末」改为「🎯 面试演练 · 收口活动（非课程·无前置边）」。
  - 边（旧 → 新）：`HARNESS --> MCP` → `SANDBOX --> MCP`；`EVAL --> MULTIAGENT` → `HARNESS --> MULTIAGENT`；新增 `HARNESS --> AGENTH` / `HARNESS --> RAG` / `HARNESS --> SANDBOX` / `SANDBOX --> MCP` / `API --> OBS` / `RAG --> MEMORY` / `TIMELINE --> MODEL` / `AGENTH --> FRAMEWORK`；**删除全部 `--> INTERVIEW` 与 `-.-> INTERVIEW` 边**（INTERVIEW 非课程、无 `prereqs`）。
  - 图下补一行文字（原虚线语义改为非边文字）：`图外补充（**非前置边**，勿读成依赖）：可观测加深评测工程化（指标的数据管道上游）；长期记忆进系统设计设计题（\`long-term-memory.md §S9\` 收口系统设计）；面试演练是全部课程之后的收口活动。`
- 验证（脚本比对，**结果：17 == 17，两侧差集均为空、边集规范化后完全一致、无虚线边**）：
  ```
  $ node - <<'EOF'   # 只读两个文件，提取 prereqs 与 mermaid 实线边后比对
  prereqs 边数(含重复) = 17  去重后 = 17 | 图实线边数 = 17
  仅在 prereqs（图缺）: []
  仅在图（多余边）: []
  规范化后边集一致?: YES
  图中是否存在虚线边: 无
  一致边集：
    AGENTH --> FRAMEWORK / API --> OBS / EVAL --> DURABLE / EVAL --> FLYWHEEL / HARNESS --> AGENTH
    HARNESS --> API / HARNESS --> DURABLE / HARNESS --> MULTIAGENT / HARNESS --> RAG / HARNESS --> SANDBOX
    HARNESS --> SYSDESIGN / RAG --> EVAL / RAG --> MEMORY / RAG --> SYSDESIGN / SANDBOX --> MCP
    SYSDESIGN --> MULTIAGENT / TIMELINE --> MODEL
  EOF
  ```
- 取值源锚点（防并发漂移）：读取时 `site/src/data/course-structure.ts` mtime=**2026-10-14 16:08:21**、`stage` 仍为 5 档、`model-basics.prereqs=['llm-timeline']`。若 `sot-data` 组后续按 PED-F5 改 `prereqs`，需重跑本脚本对齐。
- mermaid 语法自检：仅阅读（`graph TD` + `classDef` + `节点["..."]:::class` + `A --> B`，无 `|`/`{}` 在标签内）；未跑 `viz/mermaid-check.mjs`（属 `demos-gates` 区工具，且本机不跑构建）。

### ID：P3｜两处「建议开课顺序」统一为一份指针 ✅
- 文件：`notes/knowledge-map.md`：原 `:128-129`（依赖图节内）重写；原 `:165`（未结事项内）改指针。
- 改动前 → 后：
  - 原 `:128`：`**建议开课顺序**:系统设计 → 多智能体编排 → 沙箱与凭据(续 §S2)→ 评测工程化 → … →（P2 四课按目标岗位权重排）。`
    改为：`**建议修读顺序（唯一真源 = 站点 \`/learn/\` 线性阅读序）**：即 \`course-structure.ts\` 数组序 #1→#17（llm-timeline → 从零写 harness → Harness 架构 → RAG 与检索 → 系统设计 → 沙箱与凭据 → MCP 与供应链安全 → 评测工程化 → 多智能体编排 → durable execution → API 与多模型路由 → 可观测 → 长期记忆 → 数据飞轮 → 模型基础 → 框架生态 → 行业前线调研）。` + 理由段（保留原「线性序满足全部 prereqs / 单链不打散跨课依赖」的论证，去掉旧的具体课名清单）。
  - 原 `:165`：`- [ ] [interview-bank §7 并入] 开课顺序确认（当前建议：系统设计 → 沙箱与凭据（续 S2）→ … → P2 四课按目标岗位权重排）`
    改为：`- [ ] [interview-bank §7 并入] 开课顺序确认（**唯一真源 = 站点 \`/learn/\` 线性阅读序**，即 \`site/src/data/course-structure.ts\` 数组序 #1→#17；本文件不再另列顺序清单——原此处与「依赖图」节各有一份重复列表，2026-10-19 已删并为上方单一指针）`
- 验证：
  ```
  $ grep -n '建议.*顺序\|开课顺序确认\|建议修读顺序' notes/knowledge-map.md
  :130  **建议修读顺序（唯一真源 = 站点 `/learn/` 线性阅读序）**：即 `course-structure.ts` 数组序 #1→#17…
  :165  - [ ] [interview-bank §7 并入] 开课顺序确认（**唯一真源 = 站点 `/learn/` 线性阅读序**…
  ```
  即：全文件只剩 1 处显式顺序叙述（`:130`，且为指针）+ 1 处待办指针（`:165`），旧的两份课名清单均已消失。
- 未动（转交）：站点 `/learn/` 自身的「建议开课顺序」区块（`site/src/pages/learn.astro`，属 `site-ui` 组）——本文件现在指向它，若其文案仍自称独立真源需该组同步。

### ID：PED-F10｜JD 覆盖判据改「除 ⚪ 观察项外全 🟢」并列出豁免 ✅
- 文件：`notes/knowledge-map.md` 未结事项（原 `:172`）
- 改动前 → 后：
  - 前：`- [ ] JD 关键词覆盖：见 \`interview-bank.md\` 矩阵（目标全 🟢）`
  - 后：`- [ ] JD 关键词覆盖：见 \`interview-bank.md\` §6 矩阵。**判据（2026-10-19 改，原写「目标全 🟢」不可达）：除 ⚪ 观察项外全 🟢**。已知豁免行（矩阵自带、不计入判据）：\`A2A / agent 身份 → —（观察级）｜未排课｜⚪ 按 roadmap 保持观察\`；其余 11 行目标全 🟢。`
- 验证（矩阵覆盖度实测，供判据里的数字 11/1 取证）：
  ```
  $ sed -n '85,98p' notes/interview-bank.md | grep -o '🟢\|⚪\|🟡' | sort | uniq -c
        1 ⚪
       11 🟢
  ```
  即 12 个数据行 = 11 🟢 + 1 ⚪（表头行无标记），判据「除 ⚪ 外全 🟢」与矩阵现值一致且可达。
- 未动（转交）：`interview-bank.md` 矩阵本体属 `notes-sec` 组；`interview.astro:47` 的「10 题」属 `site-ui` 组。

### ID：PRES-F5｜`:170` 断链修为 markdown 链接并 curl 验证 200 ✅
- 文件：`notes/knowledge-map.md` 未结事项「站点建设」条（原 `:170`）
- 改动前 → 后：
  - 前：`已上线 https://blog.zero43.top/learn-agent-harness/（**33 个 html**，…`
  - 后：`已上线 [https://blog.zero43.top/learn-agent-harness/](https://blog.zero43.top/learn-agent-harness/)（**33 个 html**，…`
- 验证：
  ```
  $ curl -sS -o /dev/null -w "HTTP %{http_code}  size=%{size_download}  url=%{url_effective}\n" -L --max-time 20 https://blog.zero43.top/learn-agent-harness/
  HTTP 200  size=29821  url=https://blog.zero43.top/learn-agent-harness/
  ```
- 未动：链接目标只读（线上已发布快照）。

---

## 逐条修改记录（续）

### ID：C4 / EDIT-F5｜新增「术语表」小节（10–15 条）
- 状态：待修

### ID：PRES-F5｜`:170` 断链修为 markdown 链接并 curl 验证 200
- 状态：待修

### ID：口径块｜§1 冻结值副本逐条核对（课程数 17 / 页数 33 / 作品数 6 / 域数 15 / span 15 / 事故 25 分钟）
- 状态：待修

### ID：上轮 P10｜`:141-152`「资产 ↔ 课程映射」表补登漏登 demo
- 状态：待修

---

## 未修改的条目 + 原因

（追加中）

## 转交他人（别区连带问题）

（追加中）

## 自检

（追加中）
