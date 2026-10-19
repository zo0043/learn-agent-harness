# C 组 · 讲义去面试化改造日志

- 组：C（讲义改写）｜任务：`task-19`｜owner：tech-state（崩溃）→ **Lead 代执行**｜开始：2026-10-19 11:31（Asia/Shanghai）
- 依据：`reviews/2026-10-19/DEINTERVIEW-CHARTER.md`（§0 用户原话、§1 新定位、§2.1 分区、§3 硬规则、§4 验收）

> **代执行说明**：tech-state 在写出本骨架后崩溃（无任何实际编辑、无 closing message）。
> 后续由 Lead 按其可写范围**在真实文件状态上**完成，并补齐后续几轮第一性原理返工。
> 原始 owner 的崩溃过程未留痕，此处只记录 Lead 实际做了什么。

## 硬规则自检清单
- [x] 无 `git commit` / `git push`（提交由 Lead 单独进行）；无 build；临时文件只落 `/tmp`
- [x] 每次编辑前重新 `grep -n` 取当前行号（不复用旧行号）
- [x] 删除均整段（`## X` 到下一个 `##` 前），无半截表格
- [x] 不改讲义技术内容（只删题目、只改面试框架表述）

## 修改记录（Lead 代执行）

### 1. 删除题目类小节（13 课 + 1 个一级标题）

| 文件 | 删除内容 | 行数 |
|---|---|---|
| `notes/agent-harness.md` | `# 第十三节 练习题库`（**一级标题**，`##` 扫描抓不到） | 29 |
| `notes/agent-harness.md` | `## FinHot 项目面试故事映射` | 18 |
| `notes/agent-harness.md` | `## 岗位方向侧重（JD 归纳）` | 6 |
| `notes/api-engineering.md` | `## 练习题库（后续提问用）` | 25 |
| `notes/data-flywheel.md` | 同上 + `## S8 故事打磨（面试版，背下来）` | 25 + 13 |
| `notes/durable-execution.md` | `## 练习题库（后续提问用）` | 23 |
| `notes/evaluation.md` | 同上 | 22 |
| `notes/framework-ecosystem.md` | 同上 | 25 |
| `notes/harness-from-scratch.md` | 同上 | 16 |
| `notes/industry-2026.md` | `## 六、对面试的直接含义` | 9 |
| `notes/llm-timeline.md` | `## 面试 30 秒口述版` | 3 |
| `notes/long-term-memory.md` | `## 练习题库（后续提问用）` | 25 |
| `notes/mcp.md` | 同上 | 23 |
| `notes/model-basics.md` | `## S7 八股速查表（16 题 × 3-5 行标准答案）` | 44 |
| `notes/multi-agent.md` | `## 练习题库（后续提问用）` | 22 |
| `notes/observability.md` | 同上 | 22 |
| `notes/rag.md` | `## S1 五道确认题（课后自测）` | 23 |
| `notes/sandbox.md` | `## 练习题库（后续提问用）` | 25 |
| `notes/system-design.md` | 同上 | 25 |

合计删除 **约 442 行**题目内容（205 课内题 + 37 题库页题 = 242 题）。

**两次漏网与补救**（均因标题不含「题库」二字）：
- `# 第十三节 练习题库` 用**一级标题**——`## ` 前缀扫描抓不到。靠 `rag-demo` 语料清单里出现 `agent-harness.md#36/#37` 才发现。
- `## S1 五道确认题` / `## S7 八股速查表` 标题无「题库」字样。第二轮靠**语义扫描**（`确认题|自测|八股|速查表`）抓出。

### 2. 标题与框架改写（保留教学价值内容）

- `## SN 常见错误与面试官追问` → `## SN 常见错误与自查要点`（11 个文件；**内容保留**——按用户决定，常见错误清单有教学价值）
- `## 面试一句话` → `## 一句话概括`（`notes/details/*.md`）
- `kind: "interview-question"` → `kind: "mechanism-deepdive"`（5 个 details 文件）
- 批量措辞替换约 230 处：`可背面试句`→`核心结论`、`面试官追问`→`值得自查的点`、`面试加分`→`体现深度`、`候选人`→`读者`、`杀伤力`→`难点`
- JD 框架 → 工业界框架（保留实质证据、去掉岗位措辞）：`JD 锚点`→`工业界锚点`、`JD 原词`→`工业界原词`、`目标岗位`→`深入方向`、`岗位权重`→`内容权重`、表头 `JD 证据`→`工业界证据`
- `## 知识点总地图(实战导向:coding agent)` → `(coding agent 工程)`
- mermaid 节点 `INTERVIEW["🎯 实战演练"]` → `SYNTH["🔁 复盘整合"]`

### 3. 第一性原理返工（第 10 轮用户要求「深度思考」）

**最初的设计是错的**：我在 `check-counters.mjs` 里加了一条「全仓 `面试|题库|interview` 必须 0 次」的判据。
它抓出 56 处，其中约 40 处是 `handoff.md` 的 **dated 历史条目**——不改就是伪史，改了历史就没了。
**一条只能靠伪造历史来满足的判据，本身就是坏判据。**

改为三条精确判据：
- **A · 站点渲染面残留 = 0**（`notes/*.md` + `notes/details/*.md` + `site/src/**` + `README/AGENTS.md` + `site/public/**`）
- **B · 活源码死引用 = 0**（不得再指向已删的 `interview-bank.md` / `/interview/`；`handoff.md`/`notes/process/`/`reviews/` 等内部历史豁免）
- **C · `handoff.md` 在首个 `## ` 标题前声明当前定位**（正向判据，替代禁词）

同时**修真定位而非改历史**：`handoff.md` 文首加「当前定位（2026-10-19 更新，以此为准）」声明，正文里**活着的**定位/判据/待办段就地改写，dated 条目一字不动。

### 4. 连带发现并修复的真实缺陷

| 缺陷 | 性质 | 修法 |
|---|---|---|
| `rag-demo/src/demo-bm25.ts:54` 按 `headingPath.includes("练习题库")` 找噪声 chunk | **功能回归**：题库节删除后 `bank` 恒 undefined，第二条发票被 `idx<0 → continue` **静默跳过**（有 `?? "?"` 兜底所以不报错，演示少了一半） | 改为不依赖小节名的通用定义：「cosine 排名里第一个非目标 chunk」，并在目标 chunk 缺失时**抛错**而非静默 |
| 语料 chunk 数 132 → 123 未同步 | **口径漂移**（该数历史上已漂过 85→132→123 两次，**无任何机器校验**） | 新增 `rag-demo/src/check-corpus.ts`（比对 `notes/rag.md §13` 声明值与 `loadCorpus()` 实际值）+ `check:corpus` 脚本 + **CI 新增一步**；同步 6 处副本 |
| `viz/mermaid-check.mjs:73` `EXCLUDED` 仍含已删的 `interview-bank` | 第二份路由实现（`notes-restructure-plan.md:198` 早有预警），排除集残留死条目 | 收缩为 `new Set(['knowledge-map'])` |
| `harness-demo/src/otel-mock-scenario.ts:66` 引用 `handoff.md:77` / `harness-from-scratch.md:210` 两个**行号** | `handoff.md:77` 是本次编辑推漂的；`harness-from-scratch.md:210` **改动前就已经错**（内容在 212） | 改为**内容锚点**（按表格行语义定位），行号引用会被任何编辑静默作废 |
| `courses.ts:93` / `course-structure.ts:334` 课程简介仍宣传「S7 八股速查 16 题」 | 悬空引用（**用户面**，/learn/ 与 /c/ 页直接展示） | 改为「一次延迟归因走查」 |
| `notes/agent-harness.md:421` mermaid `实战演练:模拟题+项目故事打磨` | 悬空引用 | 改为 `复盘整合:脱稿复述各课机制` |
| `notes/process/teaching-style-guide.md` 结构模板仍含「⑦ 练习题库 / 面试追问」 | 模板会指导未来内容**重新长回**题库 | 同步改为「常见错误与自查清单」 |

## 跳过项

- `site/dist/**`：构建产物，已 gitignore，含旧 `interview.astro.mjs` 残骸——**不影响交付**，下次构建即被清掉。
- `notes/process/site-refactor-plan.md` / `capstone-site-render-checklist.md` 里的 `interview-bank`：属 `notes/process/` 内部过程文档，按判据 B 的历史豁免处理，未改。

## 未修改条目及原因

- `handoff.md` 的 dated 历史条目（8/12/14/54/57/108/110/112/159-163 行等）：chronological 工作日志，记录的是**当时做了什么**；按「不得伪造历史」原则保留，靠文首声明区分「当前定位」与「历史事实」。
- `reviews/`、`analysis/`、`.agent-teams/`：历史归档，同样豁免。

## 转交他人

- 无（Lead 已代执行全部范围）。

## 最终残留扫描

```
用户面（notes/*.md + notes/details/*.md + site/src/** + README/AGENTS.md）：0 处
活源码死引用（interview-bank / /interview/）：0 处
handoff.md 文首定位声明：存在 ✅
门禁：check-counters 30 条全绿 / check-classes 262 定义 diff 0 / visual-check selftest 32/32 / check-corpus 123=123 ✅
demo：rag-demo eval 0.31/0.44/0.50 PASS 3/8（16/16 锚点）、bm25 发票 2 条、
      harness-demo otel:assert 15 spans ✅、durable-execution/sandbox/mcp/memory-redteam demo 全 ✅
      （harness-demo demo:compact、framework-demo demo 需外网模型，本机 503，未作为证据）
```
