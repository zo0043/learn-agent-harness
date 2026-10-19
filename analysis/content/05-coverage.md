# 内容完整性与缺口分析报告（coverage）

- 分析者：coverage｜时间：2026-10-16 17:55
- 语料覆盖声明：
  - **通读（逐行）**：`analysis/content/00-corpus-scope.md`、`notes/knowledge-map.md`(174 行)、`notes/interview-bank.md`(166 行)、`notes/details/01-context-rot.md`、`site/src/data/course-structure.ts`(426 行)、`site/src/data/capstone.ts`(139 行)。
  - **抽样（列出行号/节）**：`notes/agent-harness.md` L380–514（§13 题库/§14 路线图/§15 JD 调研全文）；`handoff.md` L100–215（§三 待办 + §四 学习总纲 + §六）；`README.md` L1–32；`notes/observability.md` §S5(L218–245)；`notes/evaluation.md` L16/24/42/47/53/239/253/453/479/498/504；`notes/system-design.md` L106/138/179/188/274–399；`notes/model-basics.md` §S7(L222) 及 L6/73/98/123/170/199/305/330；`notes/details/*.md` 全文 L1–31 ×8（重点 L26「已覆盖」/L27「未覆盖」）；`notes/industry-2026.md` L91–100；`site/src/pages/{index,learn,works,404,nav}.astro` 命中行；`site/src/data/{courses,mvps,capstone,final-project}.ts` 命中行；`harness-demo/src/tools.ts`、`whiteboard/agent_whiteboard.py`、`my-agent/README.md`、`my-agent/package.json`、`final-project/README.md`、`final-project/rubric.mjs`。
  - **未读（原因）**：`site/src/pages/c/[slug].astro`、`details/[slug].astro`、`components/*.astro` 逐行（属显示形式，且本轮只判用户可见文案，抽读命中行已足）；`notes/process/` 20 篇只读标题/自检清单/关键承诺行（site-refactor-plan.md 52.9 KB 只读 §0–§14 标题面 + 计数门禁相关行）；`jd-research/` 原始网页/JS 抓取件只做结构探测与关键词定位（ashby/greenhouse/tencent 三源 JSON 用 python 解析统计，不逐条读）。
  - 写盘前自查：本报告是**唯一**新增文件；未修改任何既有文件。

- **结论摘要（5 条）**
  1. **15 个知识域全部有实质正文**（14 门编号课实测 13.4–53.8 KB、各 4–5 张 mermaid、各 8–16 题），knowledge-map 的域清单与实际**对得上**——本视角的缺口不在"课程没写"，而在**课程表之外的目标岗能力面**与**登记层**。
  2. **目标岗（Codex Core / Claude Code / CodeBuddy 类 coding agent）最核心的一条能力「仓库级编码闭环（读码→定位→改码→跑测试→看结果→再改）」无课、无 demo、无判据**，而 `interview-bank.md:95` 把它标成 🟢（F1）；同类无课项还有 Agent Debugging 工具链（F2）、在线评测面（F3）。
  3. **登记层系统性滞后于落地**：`knowledge-map.md:143–152` 的「资产↔课程映射」只有 8 行，6 个**具名作品**里的 `mcp-demo`/`framework-demo` 无行，`api-demo`/`flywheel-demo`/`model-basics-demo`/`my-agent`/`final-project` 在 knowledge-map 命中 0 次（F4）；121 个 TS 文件的 capstone 主线与毕业项目在 `README.md`/`handoff.md` 命中 0 次（F5）。
  4. **深度不均匀的只有两处**：`harness-from-scratch.md` 13,393 B（全 15 域最小，为中位数 39.8 KB 的 33%）却是仅有的两个 ✅ 之一（F6）；「臃肿」不在课程正文（跨篇 40 字符 shingle 最大重合率仅 1.6%），而在索引层——`knowledge-map.md` 25,522 B 里 7,723 B（30.3%）是计数口径块（F12）。
  5. **站点文案出现第三套 demo 计数「17 个 demo」**，与冻结口径「6 具名作品」冲突且无任何派生来源（实测 demo 目录 11 个 / 有 demo 脚本目录 11 个 / MILESTONES reference 条目 12 条）（F7）。

---

## §1 目标岗必备能力覆盖（问题 1 回答）

**目标岗依据（原文出处）**
- 目标方向本体：`handoff.md:22`「**备考 agent 开发工程师岗位**，方向已定：**coding agent**（Codex Core / Claude Code / CodeBuddy 那类岗）」；`notes/agent-harness.md:489` 同一口径的岗位归纳（Coding agent：执行 loop+沙箱+可复现性、SWE-bench/solve rate、harness×prompt×模型 ablation）。
- JD 一手原文（腾讯 careers 官方 API 抓取，JSONL，一行一条 = 一个抓取页）：
  - `jd-research/tencent_agent.json:1`｜`Agent Harness 工程师`：①agent loop 调度/Tool-Skill 抽象/Context 组装与压缩/长任务 checkpoint 恢复/Sub-Agent 并发编排/沙箱隔离与权限；②全链路 Tracing & Observability（Span 级建模、延迟/成本/成功率归因、failure mode 分类）；③Agent 质量评估体系（离线 Benchmark、**在线 A/B Testing、SBS 人工评测、regression detection**、LLM-as-Judge、pass@k、轨迹级评分、评测集管理与 CI 门禁）；④**Agent Debugging 工具链（Trace 回放与单步执行、上下文与 Prompt 的 Diff 对比、工具调用链可视化、失败样本最小复现集自动提取）**；⑤标注平台/数据管道/任务集与轨迹数据仓库。
  - `jd-research/tencent_agent.json:1`｜`Coding Agent Research Intern 108212/108097`（IEG）：「AI Coding Agents … such as **code generation, intelligent debugging**, gameplay, and level generation」。
  - `jd-research/tencent_agent.json:2`｜`企业微信-AI Agent Harness 全栈工程师`：Context Engineering、跨会话 Long-term Memory、长任务状态快照与恢复、**Prefix Cache、流式输出（SSE/WebSocket）、任务队列、沙箱执行、可观测性…多租户高并发场景下的稳定性与可扩展性**。
  - 关键词频次（`jd-research/tencent_terms.json`，腾讯 339 条 JD 的术语计数）：可观测/Tracing **57**(L2)、评测/Eval **40**(L3)、多Agent/编排 29、分布式/高并发 **28**(L5)、prompt injection/安全 27、成本/路由/多模型 24、规划/Planning 23、工具调用 22(L9)、KV cache 18、记忆 17、沙箱 16、context engineering 16、durable 14、RLHF/RL 14、SWE-bench/coding **7**(L25)、RL环境 6(L27)、prompt caching 6(L29)、GUI/端侧 6(L30)、computer use 1(L38)。
- 课程侧唯一能力矩阵：`notes/interview-bank.md:83–98`（11 行 JD 关键词 × 课程 × 证据 × 覆盖度）。

**能力覆盖矩阵（课 / 实操 / 判据 三列，★=完全覆盖，△=概念覆盖无实操或判据，✗=无）**

| # | 目标岗能力（含 JD 出处） | 有无课 | 有无实操 | 有无判据 | 依据（file:line） |
|---|---|---|---|---|---|
| 1 | agent loop / 工具协议 / 权限门 | ★ | ★ | ★ | `harness-from-scratch.md` + `harness-demo/`；`interview-bank.md:87–88` |
| 2 | 上下文压缩 / context engineering | ★ | ★ | ★ | `harness-from-scratch.md` §8；`harness-demo/src/test-compact.ts`（1378→426 tokens） |
| 3 | 沙箱隔离 / 凭据 / 权限模型两门 | ★ | ★ | ★ | `sandbox.md` §S1–S3 + `sandbox-demo`（`courses.ts` 派生判据 `course-structure.ts:176–177`） |
| 4 | 可观测 / OTel GenAI / 成本归因 | ★ | △（离线 mock） | ★ | `observability.md` §S2–S5 + `demo:otel:mock` 15 spans/1 trace |
| 5 | 评测体系（judge/pass@k/golden set/CI 门禁） | ★ | △（评测对象是 RAG 检索层） | ★ | `evaluation.md` §S2/S5/S9；`course-structure.ts:210–211` |
| 6 | durable execution / checkpoint | ★ | ★ | ★ | `durable-execution.md` + `durable-execution-demo`（3 崩溃点×3 次 SIGKILL） |
| 7 | MCP / 供应链安全 | ★ | ★ | ★ | `mcp.md` §S1–S6 + `mcp-demo` |
| 8 | 长期记忆 / 跨会话 | ★ | ★ | ★ | `long-term-memory.md` + `memory-redteam`（16/16 + 18/18 消融） |
| 9 | 多模型路由 / caching / 成本 | ★ | ★ | ★ | `api-engineering.md` §S3/S4/S5 + `api-demo` |
| 10 | 数据飞轮 / 轨迹数据仓 | ★ | △（脱敏样本，非生产） | ★ | `data-flywheel.md` §S6 + `flywheel-demo` |
| 11 | 多智能体编排 / 单线程写 | ★ | △（复用 harness-demo） | ★ | `multi-agent.md` §S4/S7 |
| 12 | **仓库级编码闭环（code generation + intelligent debugging + 跑测试）** | ✗ | ✗ | ✗ | JD `tencent_agent.json:1`（Coding Agent Intern）；**见 F1** |
| 13 | **编辑原语（diff/patch/apply_patch/str_replace）与编辑成功率** | ✗ | ✗ | ✗ | 全仓 grep 0 命中；**见 F1** |
| 14 | **代码库导航检索工具（grep/glob/repo map/agentic search）** | ✗ | ✗ | ✗ | `system-design.md:179` 只作为设计断言提「agent 自己 grep/read」；**见 F1** |
| 15 | **Agent Debugging：Trace 单步执行 / Prompt·上下文 Diff / 失败样本最小复现集** | △（仅 `observability.md` §S5 定性"回放+对比"） | ✗ | ✗ | JD `tencent_agent.json:1` item ④；grep `单步执行`/`最小复现`/`prompt diff` 0 命中；**见 F2** |
| 16 | **在线 A/B Testing / SBS 人工评测 / regression detection** | △（被显式排除） | ✗ | ✗ | `evaluation.md:453` 将"在线 A/B 做决策"列为反模式；**见 F3** |
| 17 | **任务队列 / WebSocket / 多租户高并发平台工程** | ✗ | ✗ | ✗ | JD `tencent_agent.json:2`（企业微信）item 6；grep `WebSocket`/`任务队列` 0 命中；**见 F4 附注** |
| 18 | Harness Self-Evolution（自进化 SDK / 工具集自主迭代） | △（`data-flywheel.md` 离线飞轮） | ✗ | ✗ | JD `tencent_agent.json:1`（WorkBuddy）item 4/5 |
| 19 | 规划 / Planning（ReAct / Plan-and-Execute） | △（`system-design.md` §S8 速查） | ✗ | △（题库 1 题） | `system-design.md:396`；`jd-research/tencent_terms.json:4`（Planning 23） |
| 20 | RL 环境 / 后训练 | △（`model-basics.md` §S7 八股） | ✗ | △ | `jd-research/tencent_terms.json:27`（RL环境 6） |
| 21 | A2A / agent 身份 | ✗（观察级） | ✗ | ✗ | `interview-bank.md:98`「未排课｜⚪ 按 roadmap 保持观察」 |
| 22 | computer use / GUI agent | ✗ | ✗ | ✗ | `agent-harness.md:481`「❌ 中低优先」；`tencent_terms.json:38` |
| 23 | 算法编码（LeetCode medium） | ✗（明确范围外） | ✗ | ✗ | `handoff.md:170`「并行轨…LeetCode medium（范围外）～50 题」 |

**一句话结论**：JD 上"agent 工程通用面"（1–11）覆盖得很好（多数是 ★/★/★，且都有离线可复跑的判据）；**缺口集中在 coding agent 岗位的差异化面（12–17）与平台工程面（17–18）**——恰好是 `agent-harness.md:489` 自己定义为"Coding agent = 执行 loop+沙箱+可复现性、SWE-bench/solve rate"的那一半。

---

## §2 深度均匀性实测（问题 2 回答）

**命令原文**
```bash
wc -c notes/*.md | sort -n
for f in notes/*.md; do printf "%-42s %3s H2 %5s lines\n" "$f" "$(grep -c '^## ' $f)" "$(wc -l < $f)"; done
for f in notes/*.md; do printf "%-42s %s\n" "$f" "$(grep -c '^```mermaid' $f)"; done
# 题库节内计数（python，只统计「练习题库」节内的 | 编号 | 行与 1. 行）
```

**逐域实测表（bytes = `wc -c`；H2/H3 = 标题数；题 = 「练习题库」节内条目；mermaid = ```mermaid 块数；专属产物 = 该域在 knowledge-map 资产映射表里的对应行）**

| 域 | 文件 | bytes | H2 | H3 | 行数 | mermaid | 题 | 题/KB | 专属可运行产物 |
|---|---|---|---|---|---|---|---|---|---|
| Harness 架构 | `agent-harness.md` | 30202 | 35 | 0 | 514 | 4 | 8 | 0.26 | ✗（复用 harness-demo） |
| 从零写 harness | `harness-from-scratch.md` | **13393** | 13 | 0 | 239 | 4 | 8 | 0.60 | `harness-demo/` |
| RAG 与检索 | `rag.md` | 25194 | 14 | 2 | 339 | 4 | 0（S1 五题在文末，另计） | 0.20 | `rag-demo/` |
| 系统设计 | `system-design.md` | 39431 | 11 | 9 | 428 | 4 | 14 | 0.36 | ✗（无代码） |
| 沙箱与凭据 | `sandbox.md` | 45694 | 14 | 25 | 530 | 4 | 16 | 0.35 | `sandbox-demo/` |
| 评测工程化 | `evaluation.md` | 41823 | 13 | 13 | 508 | 4 | 14 | 0.33 | ✗（复用 rag-demo） |
| durable execution | `durable-execution.md` | 42969 | 12 | 11 | 443 | 4 | 14 | 0.33 | `durable-execution-demo/` |
| MCP 与供应链安全 | `mcp.md` | **53780** | 11 | 18 | 566 | 5 | 14 | 0.26 | `mcp-demo/` |
| API 与多模型路由 | `api-engineering.md` | 37774 | 11 | 2 | 337 | 4 | 14 | 0.37 | `api-demo/` |
| 数据飞轮 | `data-flywheel.md` | 40182 | 11 | 10 | 418 | 4 | 14 | 0.35 | `flywheel-demo/` |
| 可观测 | `observability.md` | 39266 | 11 | 2 | 351 | 4 | 14 | 0.36 | ✗（复用 harness-demo OTel） |
| 长期记忆 | `long-term-memory.md` | 48187 | 14 | 7 | 492 | 4 | 14 | 0.29 | `memory-redteam/` |
| 模型基础 | `model-basics.md` | 36241 | 12 | 13 | 391 | 4 | 14（+S7 八股 16） | 0.39 | `model-basics-demo/` |
| 框架生态 | `framework-ecosystem.md` | 44180 | 11 | 21 | 430 | 4 | 14 | 0.32 | `framework-demo/` |
| 多智能体编排 | `multi-agent.md` | 39291 | 14 | 4 | 445 | 4 | 12 | 0.31 | ✗（复用 harness-demo） |

**实测结论**
1. **明显薄的两个域**：`harness-from-scratch.md` 13,393 B（14 门编号课中位数 = (39431+40182)/2 = **39,806 B**，它是中位数的 **33.6%**，最大/最小 = 53780/13393 = **4.02×**）；`rag.md` 25,194 B（63%，且**没有独立「练习题库」节**，只有文末 S1 五题）。
2. **12 门课恰好各 14 题**（沙箱 16 / 多智能体 12 为仅有两个例外），而正文体量从 36,241 到 53,780 B 波动 —— **题量不随内容体量变化**（`mcp.md` 53.8 KB 与 `api-engineering.md` 37.8 KB 同为 14 题；密度 0.26 vs 0.37 题/KB，差 42%）。
3. **5 个域没有专属可运行产物**（Harness 架构 / 系统设计 / 评测工程化 / 可观测 / 多智能体），其"实操证据"全部复用别课 demo；其中 `system-design.md` 39,431 B 是**纯文档、0 代码**，`course-structure.ts:127/159` 自述"无独立代码，复用 harness-mvp 作解剖对象"。
4. **「臃肿重复」实测不成立**（这是个否定性结论，需按纪律写明）：
   ```bash
   # 40 字符 shingle 两两交集（python，去空白后滑窗）
   notes/framework-ecosystem.md & notes/industry-2026.md = 162  (1.6% of the smaller set)
   notes/industry-2026.md & notes/multi-agent.md     = 154  (1.5%)
   notes/framework-ecosystem.md & notes/multi-agent.md = 56  (0.3%)
   # 8 篇 details 两两最大交集 88 shingles（details/03 × details/05）≈ 各自的 4%
   ```
   即**课程正文之间没有大段复制**（最大 1.6%）。真正的"臃肿"集中在**索引层**：`notes/knowledge-map.md` 25,522 B 是 19 个顶层 md 里的第 5 大文件，其中**计数口径块（L8–L19）占 7,723 B = 全文件 30.3%**，长度超过 `harness-from-scratch.md` 全文的 57%（F12）。

---

## §3 knowledge-map 声称 vs 仓库实际：15 域逐条核对（问题 3 回答）

核对基准：`notes/knowledge-map.md:53–68`（课程总表 14 行 + `:72` 的"另加 1 条主线 = 15 域"）+ `:21–49`（命名总表）；实物用上表 §2 的实测列。

| # | 域 | 声称状态（knowledge-map） | 实测正文 | 实测题 | 专属产物 | 判定 |
|---|---|---|---|---|---|---|
| 1 | Harness 架构 | （主线，命名总表 `:30`；依赖图 ✅） | 30,202 B / 35 H2 / 4 mermaid | 8 | ✗ 复用 | **一致**，但 `:30` 类别写"主线"而 `:72` 说它是 15 域之一，站点却给它 P0 第 3 课（`course-structure.ts:116–130`）→ 定位三处不同（F8 旁证） |
| 2 | 从零写 harness | ✅ 已完成（`:55`） | **13,393 B（全 15 域最小）** | 8（最少） | harness-demo | **声称 ✅ 但内容最薄** → F6 |
| 3 | RAG 与检索 | ✅ 已完成（`:56`） | 25,194 B | 0 节（S1 五题在 L330+ 文末） | rag-demo | **一致**（第二薄） |
| 4 | 系统设计 | 📐 讲义已展开（`:57`） | 39,431 B / 14 题 | 14 | ✗ | 一致 |
| 5 | 沙箱与凭据 | 📐（`:59`） | 45,694 B / 16 题 | 16 | sandbox-demo | 一致 |
| 6 | 评测工程化 | 📐（`:62`） | 41,823 B / 14 题 | 14 | ✗ 复用 rag-demo | 一致 |
| 7 | durable execution | 📐（`:61`） | 42,969 B / 14 题 | 14 | durable-execution-demo | 一致 |
| 8 | MCP 与供应链安全 | 📐（`:63`） | 53,780 B / 14 题 | 14 | mcp-demo | 一致（但有 H3=18 的第四层细分） |
| 9 | API 与多模型路由 | 📐（`:64`） | 37,774 B / 14 题 | 14 | api-demo | 一致（**api-demo 未登记** → F9） |
| 10 | 数据飞轮 | 📐（`:65`） | 40,182 B / 14 题 | 14 | flywheel-demo | 一致（**未登记** → F9） |
| 11 | 可观测 | 📐（`:58`） | 39,266 B / 14 题 | 14 | ✗ 复用 | 一致 |
| 12 | 长期记忆 | 📐（`:60`） | 48,187 B / 14 题 | 14 | memory-redteam | 一致 |
| 13 | 模型基础 | 📐（`:66`） | 36,241 B / 14+16 题 | 14+S7 16 | model-basics-demo | 一致（**未登记** → F9） |
| 14 | 框架生态 | 📐（`:67`） | 44,180 B / 14 题 | 14 | framework-demo | 一致（**映射表无行** → F4） |
| 15 | 多智能体编排 | 📐（`:68`） | 39,291 B / 12 题 | 12 | ✗ 复用 | 一致（**映射表无行** → F4） |

**计数口径复核（我亲自复算，全部成立）**
```bash
ls notes/*.md | wc -l                                  # → 19
ls notes/process/*.md | wc -l                          # → 20
ls notes/details/*.md | wc -l                          # → 8
grep -c "^    slug: '" site/src/data/courses.ts        # → 18（课程卡 18，含 whiteboard）
# 课内嵌题：13 课练习题库 176（=184−agent-harness 8）+ agent-harness §13 8 + rag S1 5 + model-basics S7 16 = 205
# 面试题库精选：§3 项目深挖 22（3.1 五 + 3.2 五 + 3.3 四 + 3.4 四 + 3.5 四）+ §4 表 10 + §8 五 = 37
```
**结论**：`knowledge-map.md:17` 的「205 + 37」、`:13` 的「19 = 17 + 2」、`:15` 的「课程卡 18」、`:16` 的「6 具名作品」**都在实测下成立**——这个文件的口径块本身是可靠的。问题**不在口径数字错，而在口径清单没跟上 2026-10-14 之后的落地**（F4/F5/F9）。

**"内容已存在但未登记"清单（问题 3 的后半问）**

| 已存在的内容 | 规模（实测） | 登记状态 |
|---|---|---|
| `api-demo/`（API 六模块 MVP） | 1 个 demo 脚本，git 已跟踪 | README **0** / handoff **0** / knowledge-map **0** / works.astro 1 |
| `flywheel-demo/` | 1 个 demo 脚本，git 已跟踪 | 同上 **0/0/0/1** |
| `model-basics-demo/` | 1 个 demo 脚本，git 已跟踪 | 同上 **0/0/0/1** |
| `my-agent/`（capstone 主线 M0–M4） | **121 个 .ts**（exercises 116 + assert 5）+ 6 个 demo 脚本；git 已跟踪 125 个文件 | README **0** / handoff **0** / knowledge-map **1**（仅出现在 `:14` 的 git 考古注里，资产映射表无行） |
| `final-project/`（毕业项目） | 7 个文件（`grade.mjs`/`rubric.mjs`/`subjects/*.md`×4/README） | README **0** / handoff **0** / knowledge-map **0** / works.astro **0**（只在 learn.astro capstone 卡出现） |
| 15 份 capstone 设计文档 | `notes/process/` 20 篇中的 15 篇 | `knowledge-map.md:70` 的横向资产清单只列 interview-bank / llm-timeline / industry-2026 / details，**未列 `notes/process/`** |

---

## §4 process 计划文档：承诺未落地 / 已落地未记录（问题 4 回答）

**命令原文**
```bash
for f in notes/process/*.md; do grep -c '^\s*-\s*\[ \]' $f; done     # 未勾选自检项
grep -rn "git tag" notes/process/*.md
git tag                                                              # → refactor-complete（唯一）
```

### 4.1 承诺未落地（逐条 + 实测）

| # | 承诺（file:line） | 承诺内容 | 实测 | 判定 |
|---|---|---|---|---|
| P1 | `notes/process/capstone-blueprint.md:120`；`capstone-m1-structure.md:174/178/201`；`m2-structure.md:188/192/210`；`m3-structure.md:203/207/225`；`m4-structure.md:40/183/187/205`；`m1-exercise.md:98/100`；`m4-exercise.md:113` | **`git tag m0`…`git tag m4` 五档渐进快照**，`git diff m0 m4` = 完整真增建历程；`capstone-m4-exercise.md:113` 更把它写成**主线毕业验收判据**之一 | `git tag` 实测**只有 `refactor-complete` 1 个**；`git ls-files my-agent` = 125（已跟踪，非 untracked） | **未落地**（`m2/m3/m4-exercise` 里"my-agent/ 目前 git-untracked，真增建以文件级 diff 证据交付"的豁免已被 `git ls-files` 证伪：文件已入库，可打 tag） |
| P2 | `notes/process/capstone-final-structure.md:96` | 自检项：`courses.ts` EXCLUDED 已含 `capstone-final` + `capstone-final-structure`（路由页保持 17 不变） | `site/src/data/courses.ts:331`：`EXCLUDED_FROM_COURSE_ROUTE = new Set(['knowledge-map', 'interview-bank'])` —— **不含 capstone-final**（结构重组改由 `notes/process/` 目录 + `pattern:'*.md'` 兜住，但该自检项与文案未就地划改） | **未落地（已被新结构取代但文档未划改）** |
| P3 | `capstone-style-guide.md:94–101`、`capstone-final-structure.md:88–96`、`capstone-m0-structure.md:196–201`、`m1-structure.md:201`、`m2-structure.md:210`、`m3-structure.md:225`、`m4-structure.md:205` | 7 份文档共 **44 个 `- [ ]` 落地自检项**（7+5+6+6+6+7+7）全为未勾选 | 无任何勾选痕迹；其中至少 3 项（tag / EXCLUDED / `diff` 空）经我实测**不成立或不适用** | **证据链缺口**：产物存在但"施工完成"的机器可核对记录缺失 |
| P4 | `capstone-m1-structure.md:29/62/98`、`capstone-style-guide.md:97` | "starter 继承 `m<N-1>/solution`（祖先关系写在 README 第一行）"、"`loop.ts` = `m0/solution/loop.ts` + 权限门接线"、"`git diff m<N-1> m<N>` 只含本 milestone 新增机制" | 逐文件 `cmp`：`m0/solution/{types,model,tools,loop}.ts` 与 `m1/starter/*` **全部不同**（diff 行数 17/13/35/39；其中 `types.ts`/`model.ts`/`tools.ts` 是"给全"项，按规范应逐字节继承） | **与规范不符**（未逐字节继承；是否等价改写需逐段比对，本视角只判"规范声明的字节级继承不成立"） |

### 4.2 已落地未记录（清单）

1. **`my-agent/` 121 个 TS 文件 + 5 个 assert + 6 个 demo 脚本**（M0–M4 starter/solution 全档）——`README.md`/`handoff.md` 命中 **0**；`knowledge-map.md` 命中 **1**（且只是 `:14` 引用 commit message，资产映射表 `:143–152` 无行）。
2. **`final-project/`**（`rubric.mjs` 的 B1–B5 + W1–W7 判据、`grade.mjs`、3 命题 subjects）——四份顶层交付文档命中 **0/0/0/0**。
3. **`api-demo/` / `flywheel-demo/` / `model-basics-demo/`** 三个 MVP 作品——README/handoff/knowledge-map 命中 **全 0**；只有 `works.astro` 各 1 次。
4. **`notes/process/` 20 篇设计文档** —— `knowledge-map.md:70` 横向资产清单未列。
5. **`site/tools/check-counters.mjs`（19,145 B）门禁** —— `knowledge-map.md:14` 只在机制结论一句里提到；其检查项（`:286–292`）为知识域/课程页/课程卡/课内嵌题/面试题/notes 顶层/EXCLUDED 七项，**不含 demo 数、作品数、"17 demo"、`notes/process` 文件数**，故 F7 的"17 个 demo"这类新数字不会被门禁发现。

---

## §5 `details/` 8 篇 vs 17 课程正文的关系（问题 5 回答）

**实测**：8 篇各 2,130–2,436 B（合计 18,335 B ≈ 单门课正文的 **46%**），结构完全同构（`一句话定义`/`为什么影响走向`/`行业一手源`/`本地映射`/`面试一句话` 5 节，各 31 行），每篇 `本地映射` 都给出「已覆盖 / 未覆盖」两行（L26/L27）。

| details | 指向的课程锚点（L26 摘要） | 与 17 课的 shingle 最大重合 | 关系判定 |
|---|---|---|---|
| 01 context-rot | Harness 架构 §5.1/§5.2/§8.1 + 从零写 harness §8 | 42（1.9%，对 industry-2026） | **互补（薄补充）**，非重复 |
| 02 tool-granularity | Harness 架构 §3.1/§3.2 + 从零写 harness §3 | 23（0.6%） | 互补 |
| 03 error-paths | 从零写 harness §7 + Harness 架构 §6.1/§6.2/§9.1 | 54（2.5%） | 互补 |
| 04 token-economics | 从零写 harness §8 + Harness 架构 §9.3 | 62（2.9%） | 互补 |
| 05 hitl-security | 从零写 harness §5 + Harness 架构 §7.1/§7.2 + 沙箱 §S1 | 54（2.5%） | 互补 |
| 06 observability-loop | 从零写 harness §6 + Harness 架构 §9.1/§9.2 + 评测 §S2 | 26（1.2%） | 互补 |
| 07 harness-rot | Harness 架构 §10.2 + 从零写 harness 开场/⑨ | 57（2.6%） | 互补 |
| 08 single-threaded-write | Harness 架构 §8.2/§8.3 + 沙箱 §S1 | 39（1.8%） | 互补 |

**结论**
1. **不是重复**：8 篇与任何一门课的 40 字符 shingle 重合都 ≤2.9%，且与**各课正文**（非 industry-2026）的重合更低（`02` 对全部 17 课最大 23 = 0.6%）。它们是"一句话 + 一手源 + 已覆盖/未覆盖"的**索引式补丁**，不是内容副本。
2. **互补但薄**：每篇只有 **1 条**「行业一手源」（如 `01:22` Anthropic 一篇），正文 2.1–2.4 KB；`local 映射` 的"未覆盖"行是仓库**自己承认的 8 条能力缺口**（见 §7 G1–G8）。
3. **判据过弱**：`course-structure.ts:370` 把 `notes/industry-2026.md + notes/details/ 8 页` 定为 `industry-research` 这个 MVP 的交付物，判据只有"每条 `[2026现行]` 论断带官方一手源 URL + 文末 U-26 核实台账"——**没有任何内容覆盖度判据**（"分水岭 8 条各讲清"不算判据，无机器可核对项）。
4. **登记口径倒挂**：`knowledge-map.md:12` 说 `details/` 是"横向资产，不计入门数"，但站点给它 8 个独立页（`站点 html 33` 口径里的第 3 桶），且它被当成一个 MVP 的成果交付 → **"资产"与"交付物"两种身份并存，无一处写明**。

---

## §6 Findings（F1–F13）

### F1（high）目标岗核心能力「仓库级编码闭环」无课、无实操、无判据，但覆盖矩阵标 🟢

- **对象**：`notes/interview-bank.md:95`（`| coding agent / SWE-bench / solve rate | 系统设计 + 从零写 harness | harness-demo + whiteboard + 系统设计模板 | 🟢 |`）；`harness-demo/src/tools.ts:53,60,67,74,85`；`whiteboard/agent_whiteboard.py:41–68`。
- **现象**：矩阵把 coding agent / SWE-bench / solve rate 判为 🟢，证据写的是 `harness-demo + whiteboard + 系统设计模板`；但这两个"运行版"作品的工具集里**没有代码编辑原语、没有代码检索工具、没有测试执行闭环**——`harness-demo` 只有 `get_weather`/`list_dir`/`read_file`/`write_file`/`run_shell` 5 个工具，`whiteboard` 只有 `list_dir`/`read_file`/`write_file` 3 个。系统设计侧只是"讲"（`system-design.md:179` 一句话提到"agent 自己 grep/read"）。
- **证据**：
  ```bash
  $ grep -rn "apply_patch\|str_replace\|edit_file\|replace_in_file\|insert_text\|unified diff" --include=*.ts --include=*.py . | grep -v node_modules
  （无输出）
  $ grep -rn "name: \"grep\|name: \"search\|name: \"glob\|name: \"find" --include=*.ts . | grep -v node_modules
  （无输出）
  $ grep -ri "agentic search" notes/ | wc -l        # → 0
  $ grep -ri "repo map" notes/ | wc -l              # → 0
  $ grep -n "name: " harness-demo/src/tools.ts | wc -l   # → 5（get_weather/list_dir/read_file/write_file/run_shell）
  ```
  JD 原文要求：`jd-research/tencent_agent.json:1`（`Coding Agent Research Intern 108212`）「**code generation, intelligent debugging**」；`jd-research/tencent_terms.json:25`「SWE-bench/coding: 7」。
- **影响**：这是目标岗的**入场能力**——面试官问"你的 agent 怎么改一个真实仓库并证明改对了"，现有资产（改天气/读 docs/写 out.md 的 demo）答不上"编辑成功率""大仓定位""改动后跑测试"三件事；而矩阵的 🟢 会让备考者误判为已覆盖。
- **建议方向**：新增一课（或给 `harness-from-scratch` 补 §S11）「编码 agent 的 ACI：编辑原语与仓库导航」，把 `apply_patch`/`str_replace` 与 grep/glob 落成 demo 工具，并给出"改对率 + 测试通过率"的可复跑判据；同时把 `interview-bank.md:95` 的 🟢 降级为 🟡 并注明差距。
- **置信度**：高（工具集与 grep 结果都是文件级实测；JD 原文可复读）。
- **归属**：内容。

### F2（high）JD 明确要求的 Agent Debugging 工具链（Trace 单步执行 / Prompt·上下文 Diff / 失败样本最小复现集）无课无实操

- **对象**：`jd-research/tencent_agent.json:1`（`Agent Harness 工程师` 职责 ④「Agent Debugging 工具链：支持 Trace 回放与单步执行、上下文与 Prompt 的 Diff 对比、工具调用链可视化、失败样本最小复现集自动提取」）；`notes/observability.md:218–245`（§S5 调试工作流）。
- **现象**：课程侧最接近的是可观测 §S5「回放 + 对比 + 自诊断闭环」，但它只到"重建当时世界 → 单变量重跑 → 轨迹级 diff → 告警"的**方法论层**；JD 要的三件具体工程物证（单步执行、Prompt/上下文 **Diff 视图**、失败样本**最小复现集自动提取**）在 15 域里没有任何一节、任何 demo。
- **证据**：
  ```bash
  $ grep -ril "单步执行" notes/            # → 0
  $ grep -ril "最小复现" notes/            # → 0
  $ grep -ril "prompt diff\|Prompt 的 Diff" notes/   # → 0
  $ grep -ril "调试工具" notes/            # → 0
  # observability.md §S5(L218) 全文检索：只出现 "回放"(L221)、"对比"(L222)、"告警"(L223)
  ```
  岗位频次侧证：`jd-research/tencent_terms.json:2`「可观测/Tracing: **57**」是全部术语里最高的一项。
- **影响**：可观测课覆盖"看数据"，不覆盖"用数据调试"；这是 Harness 岗 JD 的第 4 条职责，且与 F1 的编码闭环强耦合（改错了要能定位到哪一步、哪个 prompt 版本）。
- **建议方向**：把 `observability.md §S5` 扩成"S6 调试工具链"并配一个离线 demo：从 `harness-demo/trajectories/*.jsonl` 读一条 trace → 单步重放 → 打印两版 prompt 的 token 级 diff → 从失败 trace 抽取最小工具序列。
- **置信度**：高（grep 0 命中 + JD 原文双证）。
- **归属**：内容。

### F3（high）在线评测面（A/B Testing / SBS 人工评测 / regression detection）是 JD 三大职责之一，课程把它写成反模式

- **对象**：`jd-research/tencent_agent.json:1`（职责 ③「自动化 eval pipeline，覆盖离线 Benchmark、**在线 A/B Testing、SBS 人工评测与 regression detection**」）与 `:2`（混元 Harness Engineer 职责 ② 同款列表）；课程侧：`notes/evaluation.md:453`。
- **现象**：`evaluation.md:453` 的「常见错误」表把"**用在线 A/B 做决策**"列为反模式（"慢、贵、有体验/伦理风险…离线做 go/no-go 决策，在线只做确认"）。这条对**研究者视角**成立，但 JD 把"在线 A/B + SBS 人工评测 + regression detection"写成 Harness 岗的**本职交付**——课程不但没覆盖，还给了反向结论，且没有任何一处解释"自己是小团队/离线优先"的适用范围。
- **证据**：
  ```bash
  $ sed -n '453p' notes/evaluation.md
  | 10 | **用在线 A/B 做决策** | 慢、贵、有体验/伦理风险，小样本噪声当结论 | 离线做 go/no-go 决策，在线只做确认 |
  $ grep -ril "SBS" notes/                 # → 0
  $ grep -ril "regression detection" notes/ # → 0
  $ grep -rn "A/B" notes/evaluation.md notes/data-flywheel.md | wc -l   # → 4（全部是离线对照/评分偏差语境）
  ```
- **影响**：这是"离线评测"与"生产评测平台"之间的能力断层——JD 要的是评测**平台**（A/B、SBS、regression detection 三件套 + 评测集管理 + CI 门禁），课程只到"一套评测方案"（`course-structure.ts:210–211` 的 practicalOutput 亦如此自述）。
- **建议方向**：在 `evaluation.md` 新增 S11「生产评测闭环」，把在线 A/B 的**适用条件与灰区**（谁做决策、样本量、伦理红线）与 SBS 人工评测流程写清，并把已有的 `evaluation.md:453` 反模式改写为"离线优先，但以下三类结论只有在线能给"。
- **置信度**：高（行级原文 + JD 原文）。
- **归属**：内容。

### F4（high）`knowledge-map` 的「资产↔课程映射」只有 8 行：漏登 2/6 具名作品，且全部新增作品/主线缺席

- **对象**：`notes/knowledge-map.md:141–152`（`## 资产 ↔ 课程映射` + 8 行表格）。
- **现象**：该表是仓库**唯一**的"资产→能力→被谁引用"登记表，但：
  - 6 个**具名作品**（`knowledge-map.md:16` 口径）里只有 4 个有行（harness-demo / rag-demo / sandbox-demo / durable-execution-demo）；**`mcp-demo`、`framework-demo` 无行**——而完全不是作品的 `whiteboard/` 却有行。
  - 2026-10-14 之后落地的 `api-demo` / `flywheel-demo` / `model-basics-demo` / `my-agent` / `final-project` **全部无行**。
- **证据**：
  ```bash
  $ for d in harness-demo whiteboard rag-demo durable-execution-demo sandbox-demo memory-redteam mcp-demo framework-demo api-demo flywheel-demo model-basics-demo my-agent final-project; do printf "%-24s %s\n" "$d" "$(grep -c "$d" notes/knowledge-map.md)"; done
  harness-demo 7 / whiteboard 3 / rag-demo 6 / durable-execution-demo 5 / sandbox-demo 4 /
  memory-redteam 6 / mcp-demo 3 / framework-demo 3 / api-demo 0 / flywheel-demo 0 /
  model-basics-demo 0 / my-agent 1 / final-project 0
  $ sed -n '145,152p' notes/knowledge-map.md | cut -c1-30   # 8 行：harness-demo/whiteboard/rag-demo/durable-execution-demo/sandbox-demo/memory-redteam/FinHot/pi
  ```
  （`mcp-demo`/`framework-demo` 的 3 次命中都在正文散文里，不在映射表行内。）
- **影响**：映射表是"某能力有没有实操证据"的**唯一索引**。它漏登 2 个具名作品 + 5 个新资产，导致 §1 能力矩阵、`interview-bank.md:87–97` 的证据列与本表**三方不一致**（例：MCP 的实操证据要读 `mcp.md §S6` 才找到，映射表里没有）。
- **建议方向**：把映射表改为**由 `package.json`/目录派生**（每个含 demo 脚本的目录一行）并纳入 `check-counters.mjs`，而不是手工维护；补 `mcp-demo`/`framework-demo`/`api-demo`/`flywheel-demo`/`model-basics-demo`/`my-agent`/`final-project` 七行。
- **置信度**：高（grep 计数 + 表行逐行读）。
- **归属**：内容。

### F5（high）121 文件的 capstone 主线 + 毕业项目已落地，却在 `README.md`/`handoff.md` 零提及；其毕业判据未满足

- **对象**：`README.md`（全文 31 行）；`handoff.md`（29 KB）；`notes/process/capstone-m4-exercise.md:113`；`notes/process/capstone-blueprint.md:120`。
- **现象**：`my-agent/`（M0–M4）与 `final-project/` 是仓库**体量最大的新增内容**（121 个 TS + 7 个文件），但两份顶层叙事文档（`README.md` = 对外介绍，`handoff.md` = 唯一"学习总纲 + 接手建议"）**一次都没提**；`knowledge-map.md` 只在 `:14` 的 git 考古注里出现 1 次。同时 `capstone-m4-exercise.md:113` 把"`git tag m0..m4` 五档齐 + `git diff m0 m4` 只见逐 milestone 真增建"写成**主线毕业验收**的必要条件，实测**没有一个 tag**。
- **证据**：
  ```bash
  $ grep -c "my-agent" README.md handoff.md          # README.md:0  handoff.md:0
  $ grep -c "capstone\|毕业项目\|增量主线" README.md handoff.md   # 0 / 0
  $ find my-agent -name "*.ts" -not -path "*/node_modules/*" | wc -l   # → 121
  $ find final-project -type f | wc -l                                  # → 7
  $ git tag                                          # → refactor-complete（仅 1 个）
  ```
  反向确证："17 课程/MVP 作品表"这些内容 `README.md` 都有（`README.md:13–25` 逐作品一行），说明**遗漏是登记问题，不是有意省略**。
- **影响**：新人（含下一个会话的 agent）按 `README.md`/`handoff.md` 入手会**完全看不到主线与毕业项目**——这两份文档是 `handoff.md:5` 自称的"接手建议"，而 capstone 恰是"接手后最该知道的那件事"（`site/src/pages/learn.astro:199` 已把它放在站点主线位）。
- **建议方向**：`README.md` 增一节「学习主线（capstone）」+ 作品表加 api/flywheel/model-basics 三行；`handoff.md §四` 补"增量主线 M0–M4 + 生成层毕业项目"的状态与判据；二选一：补打 `m0`–`m4` tag，或把该判据就地划改为"以文件级 diff 交付"（现在是两种说法并存）。
- **置信度**：高。
- **归属**：内容。

### F6（high）「从零写 harness」标记 ✅ 已完成，但它是全 15 域最小的正文（13,393 B，中位数的 34%）

- **对象**：`notes/knowledge-map.md:55`（`| 从零写 harness | P0 | ✅ | harness-from-scratch.md | 白板 20 分钟写出可运行 agent loop（含恢复/权限/压缩） |`）；`notes/harness-from-scratch.md`。
- **现象**：15 域里只有 2 个 ✅（另一个是 RAG 25,194 B）。这个 P0 地基课的正文 **13,393 B / 239 行**，是 14 门编号课最小者，也是中位数 39,806 B 的 **33.6%**；题量 8 题并列最少。它承诺的"完成后你能做到：白板 20 分钟写出可运行 agent loop（含恢复/权限/压缩）"是整套课程最难产出的能力，却由篇幅最小的讲义承担（其"实操"证据主要在 `harness-demo/` 代码里，`knowledge-map.md:145` 一行括注）。
- **证据**：
  ```bash
  $ wc -c notes/harness-from-scratch.md notes/mcp.md notes/sandbox.md
   13393 notes/harness-from-scratch.md     # 最小
   53780 notes/mcp.md                      # 最大 → 最大/最小 = 4.02×
  # 14 门编号课排序后中位数 = (39431+40182)/2 = 39806
  $ grep -c '^## ' notes/harness-from-scratch.md     # → 13（含题库/附）
  ```
- **影响**：状态记号 ✅ 在 `knowledge-map.md:6` 定义为"讲完+实操"，读者/接手者会据 ✅ 判断"这课不用补"。实测它是**最薄的一课**——薄在机制推导与边界（`details/03/04/05/07` 四篇的"已覆盖"全部锚定在这一课，四篇的"未覆盖"也全部指向它缺的东西）。
- **建议方向**：要么对 `harness-from-scratch.md` 做一轮扩写（把 `harness-demo` 的 5 种运行模式、崩溃恢复实测、压缩实测逐节回填正文），要么在 ✅ 旁边加注"正文为骨架、判据在 `harness-demo/`"，别让记号承担它没承担的语义。
- **置信度**：高（纯实测体量 + 状态记号定义可引）。
- **归属**：内容。

### F7（high）站点文案出现第三套 demo 计数「17 个 demo」，与冻结口径「6 具名作品」冲突且无派生来源

- **对象**：`site/src/pages/learn.astro:199`、`site/src/pages/learn.astro:204`、`site/src/pages/index.astro:112`；对照 `site/src/data/courses.ts:298`（`export const WORK_COUNT = 6;`）与 `notes/knowledge-map.md:16`（6 具名作品口径）。
- **现象**：`learn.astro:199`「…**17 个 demo** 不是终点作品，而是每个 milestone 的参考答案（参考样本）」、`:204`「主线是你亲手搭的工具；**17 个 demo** 是每个 milestone 的参考答案」、`index.astro:112`「不是读完 **17 个 demo** 就结束」。而仓库里 demo 计数有且只有一个冻结口径：**6 个具名作品**（`courses.ts:298` 硬编码 `WORK_COUNT = 6`，`works.astro:408` 也按"具名作品"渲染）。
- **证据**：
  ```bash
  $ grep -rn "17 个 demo\|17 demo" site/src/          # learn.astro:199,204 / index.astro:112
  $ for d in api-demo durable-execution-demo flywheel-demo framework-demo harness-demo mcp-demo memory-redteam model-basics-demo my-agent rag-demo sandbox-demo; do echo "$d $(grep -o '\"demo[^\"]*\"' $d/package.json | wc -l)"; done
  → 11 个目录有 demo 脚本（含 my-agent；不含 whiteboard/（Python）与 site/）
  $ grep -c "reference:" site/src/data/capstone.ts     # → 5 个 milestone，reference 条目合计 12（含重复 demo）
  $ grep -c "WORK_COUNT" site/src/data/courses.ts      # → 6，定义处
  ```
  即：**6（口径）｜10（除 my-agent 的有脚本 demo）｜11（有脚本目录）｜12（milestone reference 条目）｜17（课程页数）**，没有任何一种算法得出 17。最可能的成因是**把"17 课程页"误写成"17 个 demo"**。
- **影响**：站点是外部读者**唯一**入口，这句话会让人以为有 17 个可运行作品；同时它绕过了 `check-counters.mjs`（该门禁只查七项，不含 demo 数——见 §4.2 第 5 条），所以不会被自动发现。
- **建议方向**：三处改为从 `WORK_COUNT` 派生（或改为"每门课一个参考样本（17 门课）"），并把"作品数/demo 数"纳入 `check-counters.mjs`。
- **置信度**：高（三处原文 + 四种算法的实测数字）。
- **归属**：内容（数字口径）；其渲染属显示形式，但**错的数字本身**是内容。

### F8（medium）学习路线存在两套阶段划分（五档 vs 三档），17 门课里 9 门阶段归属冲突

- **对象**：`site/src/data/course-structure.ts:80–375`（五档 `STAGES = ['P0'..'P4']`，`:20`）vs `site/src/data/courses.ts:50–233`（三档 `phase: 'P0'|'P1'|'P2'`）。
- **现象**：同一门课在两份站点数据源里阶段不同：`sandbox` 与 `evaluation` 在 `courses.ts` 是 P0、在 `course-structure.ts` 是 P1；`multi-agent` P0→P1；`durable-execution` P1→P2；`api-engineering` P1→P2；`data-flywheel` P1→P3；`long-term-memory` P2→P3；`model-basics` P2→P3；`framework-ecosystem` P2→P4；另有 `llm-timeline`/`industry-2026` 在 `courses.ts` 是 `'—'`、在 `course-structure.ts` 是 P0/P4。共 **9/17 门冲突 + 2 门'—' vs 实体阶段**。
- **证据**：
  ```bash
  $ grep -n "slug: '" site/src/data/courses.ts | sed -n '1,20p'   # 三档 phase
  $ grep -n "stage: 'P" site/src/data/course-structure.ts | wc -l  # 17
  $ sed -n '300p' site/src/data/courses.ts   # 自述："courses.ts 的 phase 字段已降为 legacy：P0/P1/P2 无读方…仅 '—' 仍被两处消费"
  ```
- **影响**：`courses.ts:300` 自己承认该字段是 legacy 但**仍有两处读方**（`DOMAIN_COUNT` 过滤、`c/[slug].astro:61` 兜底 chip），并且它是课程卡的可见字段来源之一；上游教案 `notes/process/site-refactor-plan.md:14` 也点名"旧草稿…三档 phase…sandbox/observability 错标阶段"——**计划里说已重做，实际两套并存**。
- **建议方向**：把 `courses.ts` 的 `phase` 字段删掉或改为从 `course-structure.ts` 派生（单一真源），保留 `'—'` 语义改由 `isHorizontal` 表达。
- **置信度**：中高（两侧数据都可读；"是否已渲染到页面"属显示形式，未逐页验证）。
- **归属**：内容（学习路线口径）。

### F9（medium）3 个新 MVP 作品与主线/毕业项目在顶层文档零登记（与 F4/F5 同源但主体不同）

- **对象**：`api-demo/`、`flywheel-demo/`、`model-basics-demo/`；`README.md:11–25` 作品表；`handoff.md`。
- **现象**：这三门课（API 与多模型路由 / 数据飞轮 / 模型基础）的 `practicalOutput` 明写"交付 <x>-mvp（独占：<dir>/，规格 notes/process/<x>-mvp-spec.md）"（`course-structure.ts:264/317/334`），对应目录也确实存在且 git 已跟踪；但 `README.md` 的"6 个具名作品"表与"配套资产"表里都没有它们，`notes/knowledge-map.md` 命中 **0** 次。
- **证据**：
  ```bash
  $ for d in api-demo flywheel-demo model-basics-demo; do printf "%-18s README=%s handoff=%s km=%s works=%s\n" $d "$(grep -c $d README.md)" "$(grep -c $d handoff.md)" "$(grep -c $d notes/knowledge-map.md)" "$(grep -c $d site/src/pages/works.astro)"; done
  api-demo           README=0 handoff=0 km=0 works=1
  flywheel-demo      README=0 handoff=0 km=0 works=1
  model-basics-demo  README=0 handoff=0 km=0 works=1
  $ git ls-files api-demo flywheel-demo model-basics-demo | wc -l   # → 38（已入库）
  $ ls api-demo flywheel-demo model-basics-demo/package.json | wc -l  # 3
  ```
- **影响**：读者从 README 出发会以为"6 个作品 + whiteboard + memory-redteam"就是全部实操资产，从而错估"每门课都有可跑产物"的覆盖度（实际是 10 个目录有 demo 脚本）。另外这三者的存在使 §2 表中"专属产物"列与 README 作品表**互相矛盾**。
- **建议方向**：README 作品表补 3 行（或明确声明"具名作品 6 + 独占 MVP 3"两个桶并给出全表），`knowledge-map.md` 资产映射表按 F4 的建议改为派生。
- **置信度**：高（计数与文件存在性实测）。
- **归属**：内容。

### F10（medium）process 计划文档 44 个落地自检项全未勾选，3 项经实测不成立

- **对象**：`notes/process/capstone-final-structure.md:88–96`、`capstone-m0-structure.md:196–201`、`capstone-m1-structure.md:201`、`capstone-m2-structure.md:210`、`capstone-m3-structure.md:225`、`capstone-m4-structure.md:205`、`capstone-style-guide.md:94–101`。
- **现象**：7 份文档共有 **44 个 `- [ ]`** 自检项（7+5+6+6+6+7+7），**无一勾选**；抽查其中三项实测不成立：`git tag m0..m4`（见 F5，0 个 tag）、`courses.ts` EXCLUDED 含 capstone-final（`:331` 只有 2 项）、"starter 逐字节继承前档 solution"（`cmp` 四个文件全部不同）。
- **证据**：
  ```bash
  $ for f in capstone-final-structure capstone-m0-structure capstone-m1-structure capstone-m2-structure capstone-m3-structure capstone-m4-structure capstone-style-guide; do printf "%-30s %s\n" $f "$(grep -c '^\s*-\s*\[ \]' notes/process/$f.md)"; done
  capstone-final-structure 7 / capstone-m0-structure 5 / capstone-m1-structure 6 /
  capstone-m2-structure 6 / capstone-m3-structure 6 / capstone-m4-structure 7 / capstone-style-guide 7   # 合计 44
  $ cmp my-agent/exercises/m0/solution/types.ts my-agent/exercises/m1/starter/types.ts ; echo $?   # → 1（不同）
  ```
- **影响**：这 44 项是"施工是否完成"的**唯一**机器可核对记录（其余都是散文自述）。它们全空 ⇒ 无法区分"已做但没勾"与"没做"，而三项抽查证明**至少有三项没有做**。下游（终审、下一轮接手）只能重新逐条实测，成本高。
- **建议方向**：把可机器核对的自检项改造成脚本（`npm run check:capstone`），勾选状态由脚本产出而不是人手打勾；不可机检项迁出 checklist 单列。
- **置信度**：高（计数 + 三项抽查实测）。
- **归属**：内容。

### F11（medium）15 域中 5 域无专属可运行产物，其中系统设计是 39 KB 纯文档

- **对象**：`notes/knowledge-map.md:143–152`（映射表）；`site/src/data/course-structure.ts:127/159/211/228/281`（各课 practicalOutput 自述"无独立代码/复用"）。
- **现象**：Harness 架构 / 系统设计 / 评测工程化 / 可观测 / 多智能体编排 5 个域没有自己的 demo，其中 3 个（评测、可观测、多智能体）的判据命令**指向别课的 demo**（`rag-demo && npm run demo:eval`、`harness-demo && npm run demo:otel:mock`、`harness-demo && npm run demo:reject`），系统设计则**只有"拿到需求能套模板讲完"的口述判据**。
- **证据**：
  ```bash
  $ grep -n "mvpSlug" site/src/data/course-structure.ts | grep -E "system-design|evaluation|observability|multi-agent|agent-harness"
  124 agent-harness   → harness-mvp
  156 system-design   → harness-mvp
  208 evaluation      → rag-mvp
  225 multi-agent     → harness-mvp
  278 observability   → obs-mvp（说明：obs-mvp 的资产是 harness-demo 的 OTel，非独立目录）
  $ ls -d */ | grep -E "system-design|evaluation|observability|multi-agent"   # 无
  ```
- **影响**：这 5 域"实操证据"的可复现性**依赖别课的产物**——一旦那门课的 demo 变了，这 5 域的判据静默失效（评测/可观测/多智能体三课的判据命令都直接引用 `harness-demo`/`rag-demo` 的脚本名）。`evaluation.md` 41.8 KB、`system-design.md` 39.4 KB 的正文没有对应的可执行验收物。
- **建议方向**：给评测工程化补一个最小 `eval-demo`（golden set 版本化 + CI 门禁断言，即使复用 rag 语料也独立成目录），系统设计补一份可核对的"设计模板产出物 + 自评 rubric"（如同 `final-project/rubric.mjs` 的形态）。
- **置信度**：中高（目录存在性与 mvpSlug 映射可读；"判据失效"是按引用的推论，未构造变更实验）。
- **归属**：内容。

### F12（medium）索引层臃肿：`knowledge-map.md` 30.3% 是计数口径块，长度超过最小课程全文的一半

- **对象**：`notes/knowledge-map.md:8–19`（四次整理 + 计数口径块）。
- **现象**：`knowledge-map.md` 25,522 B / 174 行是 19 个顶层 md 里的第 5 大文件；其中 **L8–L19 共 7,723 B = 30.3%**，`资产↔课程映射` 表 1,870 B = 7.3%。口径块里含大段"历史链/当初是凑数/不得省略"的元记录（如 `:18` 一整段讲 32→31→32→33 的演变，含 4 个 CI run 链接）。
- **证据**：
  ```bash
  $ wc -c notes/knowledge-map.md          # 25522
  $ sed -n '8,19p' notes/knowledge-map.md | wc -c      # 7723（30.3%）
  $ sed -n '143,152p' notes/knowledge-map.md | wc -c   # 1870
  $ wc -c notes/*.md | sort -n | sed -n '5,7p'         # 第 5 大：knowledge-map 25522
  ```
  这是**指定的**"唯一参照"块（`:11` "全仓唯一参照，其余位置只引用本块"），所以它不该被删——但它把"当前口径"与"演变考古"混编在同一块里，读者要读完 7.7 KB 才能拿到 6 个数字。
- **影响**：本视角判它是**检索成本**问题而非事实问题：口径块越长，越容易在别处无法完整引用而另起副本（F7 的"17 个 demo"就是典型的"绕过口径块自造数字"）。另注：与课程正文重复率实测 ≤1.6%，所以**唯一真正的"臃肿"就在这一层**。
- **建议方向**：口径块拆两段——「当前口径（6 个数字 + 出处命令）」与「演变考古（历史链）」；后者移入 `notes/process/` 或加折叠标记，让"唯一参照"可被 30 秒读完。
- **置信度**：高（字节实测）。
- **归属**：内容。

### F13（low）JD 关键词覆盖矩阵缺「平台工程」与「编码任务」两侧的列

- **对象**：`notes/interview-bank.md:85–98`（11 行矩阵）。
- **现象**：矩阵 11 行的关键词来自 `agent-harness.md:470–483`（2026-10-10 快照，11 项缺口）。它未收录 JD 侧同样高频/同样明确的一批词：`任务队列`、`WebSocket`、`多租户高并发`、`Harness Self-Evolution/自进化 SDK`、`A/B Testing`、`SBS 人工评测`、`regression detection`、`Agent Debugging/单步执行`、`RL 环境`，以及最关键的 `code generation / intelligent debugging / 仓库级编辑`。
- **证据**：
  ```bash
  $ grep -n "任务队列\|WebSocket\|SBS\|regression detection\|self-evol\|自进化" notes/interview-bank.md   # 仅 "自进化" 命中 §3.3 一处，其余 0
  $ sed -n '85,98p' notes/interview-bank.md | wc -l    # 11 行正文 + 2 表头
  # JD 侧频次：tencent_terms.json:5 分布式/高并发 28；:27 RL环境 6；:34 AgentOS/OS 3
  ```
- **影响**：矩阵被当作"覆盖度全 🟢 即面试就绪"的判据（`knowledge-map.md:172` 未结项"JD 关键词覆盖：矩阵（目标全 🟢）"），因此**矩阵的列集合就是备考的边界**。列缺失 ⇒ 缺口不会被追（F1/F2/F3 三条 high 恰好全部落在矩阵未收录的格子里）。
- **建议方向**：把矩阵改为"JD 原文条目 × 课程 × 证据 × 覆盖度"的**全量**矩阵（`jd-research/tencent_agent.json:1/:2` 逐职责行展开），并对每个 ✗ 标注"属岗位合格/属加分"。
- **置信度**：中高（矩阵原文与 grep 可读；"JD 条目全集"以我抽读的两条 JD 为界，未穷尽 339 条）。
- **归属**：内容。

---

## §7 缺口汇总与补救方向（问题 6 回答，只写方向不实施）

### 7.1 目标岗能力缺口（按"为什么算缺口"分组）

| # | 缺口 | 为什么算缺口（判据） | 补救方向（方向级） |
|---|---|---|---|
| G1 | 仓库级编码闭环（读码/定位/编辑/跑测试） | JD 原文点名的岗位核心（`tencent_agent.json:1` code generation + intelligent debugging），且矩阵标 🟢 但零实操、零判据（F1） | 新增"编码 agent ACI"一节/一课 + demo 工具集（grep/glob/apply_patch）+ "改对率/测试通过率"判据；矩阵降级 |
| G2 | Agent Debugging 工具链 | JD 职责第 4 条；15 域只有方法论（`observability.md:218`），三件工程物证全缺（F2） | 扩 `observability.md §S5` 为调试工具链 + 离线 demo（从 `trajectories/*.jsonl` 单步重放 + prompt diff + 最小复现集） |
| G3 | 在线评测面（A/B、SBS、regression detection） | JD 职责第 3 条；课程把在线 A/B 写成反模式且无适用范围说明（F3） | 新增 S11 生产评测闭环；改写 `evaluation.md:453` 为"离线优先 + 何时必须在线" |
| G4 | 平台工程（任务队列/WebSocket/多租户） | JD 企业微信条目明确列（`tencent_agent.json:2`）；grep 0 命中（§1 行 17） | 在 `api-engineering` 或 `sandbox` 补"平台工程面"一节（队列/背压/多租户隔离选址），或明确登记为"岗位非必需" |
| G5 | Harness Self-Evolution 闭环 | JD WorkBuddy 研究+工程双轨点名；课程只有离线飞轮（§1 行 18） | 在 `data-flywheel` 补"自进化闭环设计"（工具集/提示词/架构三层迭代的门禁与回滚） |
| G6 | RL 环境 / 后训练一侧 | JD 频次 RLHF/RL 14、RL 环境 6；课程仅 `model-basics §S7` 八股（§1 行 20） | 保持"意识层"定位即可，但把覆盖度从 🟢 改标为"八股级"，避免高估 |
| G7 | 代码库检索/大仓索引（agentic search / repo map） | 与 G1 同源；`system-design.md:179` 只用一句话断言，无机制、无 demo | 与 G1 合并处理；若不做，在 `system-design.md:179` 就地标注"未实操" |
| G8 | A2A / computer use | 两处已明确标"未排课/观察级"（`interview-bank.md:98`、`agent-harness.md:481`） | **不算缺口**（已如实登记），本轮不动；只在矩阵里保留 ⚪ |

### 7.2 仓库自身已承认的 8 条能力缺口（来自 `notes/details/*.md:27` 的"未覆盖"行，逐字来源见 §5）

`01` 缺 n² 注意力与填充率/召回的行业数字 · `02` 缺"描述质量 vs 成功率"基准与工具返回值 token 成本实测 · `03` 缺"session API 级冷启动（wake+getSession）"对应物 · `04` 缺 4x/15x 行业对比数字与"80% 方差"数据 · `05` 缺按风险维度分级（本地是按工具名平铺三档）+ vault+代签的完整实现 · `06` 缺 `getEvents()` 式位置切片重放 API 与"逐步观察 agent"的控制台产物 · `07` 缺"为尚不存在的模型设计稳定接口"的框架 · `08` 缺"决策一致性"理论框架与 Devin Review 行业数字。
→ **为什么算缺口**：这 8 条是仓库**自己写的**"资深分水岭未覆盖项"，而 `details/` 被站点当成一个 MVP 的交付物（§5.3），其判据却不含覆盖度检查 ⇒ 缺口永远不会被门禁提醒。**补救方向**：给 `details/` 增加"每条分水岭至少 2 个一手源 + 1 条本地可复跑判据"的最低标准，并纳入 `check-counters.mjs` 的清单。

### 7.3 登记层缺口（最高性价比的一类）

| # | 缺口 | 为什么算缺口 | 补救方向 |
|---|---|---|---|
| R1 | 资产映射表漏 2/6 具名作品 + 5 个新资产（F4） | 它是"能力→实操证据"的唯一索引，缺行 ⇒ 覆盖度不可审计 | 改为由目录/`package.json` 派生 + 纳入门禁 |
| R2 | my-agent / final-project 在 README/handoff 零提及（F5） | 这两份是接手入口；最大新增内容不可见 | README 加"学习主线"节；handoff §四 补状态 |
| R3 | 3 个新 MVP 作品无登记（F9） | README 作品表与 course-structure 判据互相矛盾 | 作品表补 3 行或声明两桶口径 |
| R4 | 站点"17 个 demo"（F7） | 外部读者唯一入口上的错数字；门禁不覆盖 | 从 `WORK_COUNT` 派生 + 门禁加"demo 数"检查 |
| R5 | 两套阶段划分（F8） | 学习路线的"顺序/阶段"是站点核心叙事 | `courses.ts` 的 `phase` 改派生或删除 |
| R6 | 44 个自检项不可核对（F10） | 施工完成度无可核对记录 | 自检项脚本化 |
| R7 | 口径块 7.7 KB 混编考古（F12） | 检索成本高 ⇒ 别处自造数字（R4 的成因） | 拆成"当前口径 / 演变考古"两段 |

---

## 转交下一轮（显示形式）

- `site/src/pages/learn.astro:199/204`、`index.astro:112` 的「17 个 demo」措辞本身属文案（内容，已入 F7），但其**渲染位置/版式**留待下一轮。
- `site/src/pages/courses 卡片`的 `phase` 字段（legacy 三档）是否仍渲染到页面（`c/[slug].astro:61` 兜底 chip）——只登记，未逐页目检。
- `notes/details/*.md` 8 页的 front-matter（`title/slug/domain/source/status/kind`）在详情页的呈现方式——只登记。
- `knowledge-map.md` 口径块 7.7 KB 在站点是否有对应展示页（可能触发读者认知负荷）——只登记。

## 本轮未覆盖 / 未验证

- **未跑任何会写盘的命令**：`my-agent` 的 `npm run assert:m0..m4[:solution]`、`final-project` 的 `grade.mjs`、各 demo 的 `npm run demo*` 均**未执行**（原因：00-corpus-scope §0.5 只读复算，且这些脚本会写 `trajectories/`、`.state/` 等运行产物）。因此「主线 121 文件是否真能跑绿」「毕业项目判据是否真可达」在本报告里是**未验证**，只核对了文件存在性与脚本定义。
- **未验证**：`astro build` 与站点 33 页（口径块自述本机构建不稳定，`notes/knowledge-map.md:18`）；我未跑构建，站点计数沿用 `knowledge-map.md` 口径块 + 我自跑的 `ls site/src/pages` 结构性核对。
- **未穷尽**：`jd-research/` 的一手 JD 只抽读了 `tencent_agent.json` 的 5 条 coding-agent/Harness 相关岗位与 `tencent_terms.json` 的术语计数；OpenAI Ashby(815)/Anthropic Greenhouse(645) 两个 JSON 我只做了结构与体量探测，**未逐条统计关键词**——§1 中「OpenAI Codex Core / Anthropic Claude Code」的具体要求以 `notes/agent-harness.md:489` 的归纳为准（该归纳本身我未回溯到原始条目验证）。
- **未逐行**：`notes/process/site-refactor-plan.md`（52.9 KB）只读标题面与计数相关行；`site/src/data/*.ts` 除 `course-structure/courses/mvps/capstone/final-project.ts` 外未读 `trajectory.ts`/`llm-history.ts`。
- **未构造实验**：F11 的"复用判据会随上游 demo 变更而失效"、F10 的"44 项未勾选是否全部未做"（只抽查 3 项）均为**推论 + 抽样**，标注为置信度中高，非全量证明。
