# 修复日志 · sot-data（Lead 代执行）+ Lead 第二轮补修

- 说明：`sot-data` 组成员因平台反复中断未能交付，本分区由 **Lead 直接执行**；`00-修复复核报告.md` 已如实记录「文件改了但日志缺失」这一审计缺口，本文件补上。
- 第二轮：终审（`00-修复复核报告.md`）判定「未修 7 / 部分修 6」后，由 Lead 就地补修，逐条记录于 §B。
- 可写范围（宪章 §2）：`site/src/data/**`、`site/src/utils/ragStats.ts`；第二轮另含终审判定残留所在文件（已在终审报告中登记为「Lead 补修」）。
- 纪律：所有改动均附「改动前→后引文 + 验证命令输出」；**未跑任何构建**（Lead 统一跑的一次已 OOM，见终审报告）。

---

## A. 第一轮（sot-data 分区）

| ID | 文件:行 | 改动前 → 改动后 | 验证 |
|---|---|---|---|
| A3/PED-F1（本站侧） | `site/src/data/course-structure.ts:1-12` | 文件头仅写「五阶段课程编排（唯一真源，重建）」 → 新增「**阶段口径（唯一真源声明）**」段：`stage ∈ P0–P4` 是**教学阶段**、也是 `/learn/` 线性阅读序；`notes/knowledge-map.md` 的 **W0–W2** 是**岗位权重**，两者不是同一套标签、不可互换，并记明修复前同批 `P0–P2` 表达权重导致 `/learn` 与 `/map` 顺序相反 | 终审独立复核：`grep -o '\| P[0-2] \|' notes/knowledge-map.md` → 0 命中；`sed -n '4p' course-structure.ts` 命中新声明（裁定「已修且可复现」） |
| B4/FAC-F8 | `site/src/data/llm-history.ts:4-8` | 「alex 审计后的权威事实表——**已逐条 web 核实**」 → 改为「**不是**逐条 web 核实……每条自带 `source` + `verified('exact'\|'month')`，标 `month` 的仅为月份级成立」，要求按字段级 `verified` 判断 | 终审裁定 `FAC-F8` 已修且可复现 |
| B4/FAC-F1 | `site/src/data/llm-history.ts:24-36` | 接口注释仅写「10 节点」 → 新增「**截断声明**」：本表止于 **2025-01**（末节点 DeepSeek-R1），是"截至该时点"的快照、不代表最新进展；2025 后代际见 `notes/llm-timeline.md`（12 节点，到 2026.07） | 终审判定 `FAC-F1` 部分修（数据层已改、页级标注未做）→ 见 §B 补完 |
| PED-F5 | `site/src/data/course-structure.ts:336-342` | `prerequisiteNote` 点名「已上完 **LLM 发展史与演进**」，而 `:335 prereqs: ['llm-timeline']`——点名课程与 `prereqs` 指向不同文件（`llm-history` 只是该课的 nav 数据源） → 改点名「已上完 **LLM 时间线**（序章横向；…）」 | 终审判定部分修（残留"开源系"半句）→ 见 §B 补完 |
| PED-F9 | `site/src/data/course-structure.ts` 全表 13 处 | `上一课带入 X` → `前置课带入 X`（"上一课"暗示线性阅读序，实测 13 处中 10 处与 `/learn` 线性序不符） | 终审判定 `PED-F9` 已修且可复现 |

**门禁**：`node site/tools/check-counters.mjs` → EXIT 0；`node site/tools/check-classes.mjs` → EXIT 0（改动后复跑）。

---

## B. 第二轮（终审判定「未修/部分修」的补修）

| ID | 文件:行 | 改动前 → 改动后 | 验证命令 + 输出 |
|---|---|---|---|
| **B1（终审头号空洞）** | `site/tools/check-counters.mjs` 新增 §3c | 判据 12 条 → **29 条**。新增 D1–D8：① demo 作品 6（口径块 6 目录全在 + README 作品表列全）② OTel `spanTotal:15` + `实测 11 spans` 清零 ③ 事故时长 `24 分钟` 清零 / `25 分钟` 在位 ④ `llm-history.ts` 截断声明 + 末节点 `2025-01` + `nav.astro` 同步标注 ⑤ 白板 `~150 行` 清零 / `178 行` 在位 ⑥ `recall@5=0.44`（README + rag.md，脏工作区值 0.38 不得回灌）⑦ `sitemap.xml` url 数 = 站点 html 33 ⑧ 旧写法残留（`SAP、IBM`→`IBM Research`、`四原语与四层防御`、`trajectories/demo.jsonl` 未带豁免说明）。含**自排除**（门禁自身正则字面量不判自己）与命中文件回显 | `node site/tools/check-counters.mjs` → **EXIT 0，判据 29 条 + 副本 7 处全 ✅**；首轮插入即抓出 6 处真实漂移（白板 `~150 行` 第二处、2 处裸 IBM、3 处 demo.jsonl 未带说明、2 处自命中），全部处置后转绿 |
| TECHSTATE-F3 | `notes/sandbox.md:236-260` | 「① 路径 canonicalize → ② 许可 → ③ lockdown → ④ 审计」**顺序写反**，且把 canonicalize 画成所有调用的第一道门 → 重写为「① 许可（最前）→ ② 执行 → ③ 路径边界 + lockdown（**仅在有沙箱实例时**）→ ④ 审计」，mermaid 同步重画，新增四条事实：`policy.decide` 在最前；`assertInWorkspace` 在 `execTool→pth()` 内；**A 组 `sandbox:null` 时路径原样透传、根本没有路径边界层**；lockdown 属沙箱实例不属策略门 | Lead 独立核码：`sandbox-demo/src/replay.ts:60` = `const v = cfg.policy.decide(...)` 在循环体最前；`ctx.sandbox` 仅在 allow/sandbox/approve 分支内赋值；`tools.ts:27-28` = `pth = (args,k,ctx) => ctx.sandbox ? ctx.sandbox.path(...) : str(args,k)`；`replay.ts:55` A 组 header 直书「无沙箱层（动作面=本机 root）」 |
| TECHSTATE-F4 | `notes/sandbox.md:187-188` | A 组 sha256 = `ecbabb3a…`（2026-10-11）→ `df9a4e2406109a675aca5390a73d9e175f0e5703ebe4bddee0510095099e5536`（2026-10-19 重跑），并注明旧值作废；B 组 `9c0d52aa…` 不动（已逐字命中） | 终审实跑输出 `A … sha256=df9a4e2406109a67…`、`B … sha256=9c0d52aa6d58124…`（B 与讲义一致） |
| PED-F11 | `notes/interview-bank.md:71/:73` | #6 归属「长期记忆 §S5」（记忆投毒在 §S7）→ 「长期记忆 §S7（记忆投毒；§S5 是冲突消解与遗忘）」；#8 缺主场课 → 补「**多智能体编排（主场）**」置于首位 | `sed -n '71p;73p'` 复核命中 |
| FAC-F1（页级） | `site/src/pages/nav.astro:31` | 「2017 Transformer → 2025 DeepSeek-R1 · {LLM_HISTORY.length} 节点**带权威出处**」 → 改为「→ **2025-01** DeepSeek-R1 · N 节点（每条带 source 与 verified 字段，**整体为「部分核实」，非逐条核实**）——**本表止于 2025-01**，之后代际见 /c/llm-timeline/」 | `sed -n '31p'` + 门禁 D4「nav.astro 同步截断标注」✅ |
| FAC-F7 | `notes/mcp.md:135`、`notes/multi-agent.md:141` | 裸 `SAP、IBM` → `SAP、IBM Research`（2 处） | 门禁 D8「SAP、IBM[^ ]」残留 0 ✅ |
| P9 | `harness-demo/README.md:14`、`src/otel-mock.ts:18`、`src/otel-mock-scenario.ts:16-17/:76/:369/:394`、`TrajectoryTimeline.astro:3/:176`、`works.astro:116`、`handoff.md:64` | `trajectories/demo.jsonl` 引用统一为「**活端点本机产物，未入库；入库样例是 demo.example.jsonl**」；`TrajectoryTimeline` 改为解构 `trajectory.source/file` 并**动态渲染当前数据源**（原来写死文件名，读者无法知道用的是哪一份） | 门禁 D8「未带豁免说明的 trajectories/demo.jsonl」残留 0 ✅；`sed -n '11p' TrajectoryTimeline.astro` → `const { events, available, source, file } = trajectory;` |
| PED-F15 | `notes/evaluation.md:251` | 白板 wrapper「~150 行」→「约 150–180 行」（终审只列了 `handoff.md:65`，此为其漏网的第二处，由门禁 D5 抓出） | 门禁 D5「白板 ~150 行」残留 0 ✅ |
| C1/PED-F6 | `site/src/data/course-structure.ts:133/:165` | 两条不可证伪口语判据（「能对照 harness-demo 画清分层」「拿到一个需求能套模板讲完整条」）→ 改为**可证伪的学习者自查判据**：前者要求「现场画出 5 层分层图 + 指出 FinHot 幽灵事故对应哪一层失守，缺一层即未过」；后者要求「30 分钟内按七步骨架输出模板 + 给出改用 workflow 的反例，超时或缺任一步骤即未过」 | `sed -n '133p;165p'` 复核命中 |
| PRES-F4 | `site/public/sitemap.xml`、`site/public/robots.txt`（**新增**） | 子站 sitemap/robots 全 404 → 手写 33 条 url（8 静态 + 17 课程 + 8 专题，base 前缀正确）+ robots.txt 指向 sitemap。**未装 `@astrojs/sitemap`**（宪章禁装依赖）；新增页面时须同步更新，否则门禁 D7 失败 | 门禁 D7「sitemap url 数 = 站点 html 33」✅（脚本实测输出 33 = 静态 8 + 课程 17 + 专题 8） |
| C3/PRES-F7 | `.github/workflows/deploy.yml:42-60` | 部署作业只 `npm run build` 就 `upload-pages-artifact`，产物断言只在 `verify.yml` → **部署路径自身**新增 `Build sanity`（dist HTML 等值 33 + 9 个关键页非空），与 verify.yml 同款 | 终审已裁定 C3「已修且可复现」（Lead 在终审快照前插入） |

### 未修 / 有意不做

| 项 | 原因 |
|---|---|
| **EDIT-F6（标点规范）** | low。中文标题半角 `(`/`:` 与全角并存属**文风取舍**而非事实错误，需主编定规范后才能统一；本轮不擅自定义规范 |
| ~~**`demoteNoteH1` 白名单改派生 + 「唯一 h1」断言**~~ **← 已推翻并修复，见下** | 原写「28 篇 notes 全是双 h1、改动耦合不可盲改」。推送后线上实测**推翻**该判断：课程/详解页只有 1 个 h1；真实缺陷是 `/map`、`/interview` 的降级**在真实管线里静默 no-op**（content 集合条目无 `filePath`）与 `/works/` 内嵌片段未降级。**均已修复**：片段降级 + 两篇笔记首标题降为 h2 + 删除失效插件 + CI 新增「h1 唯一性」断言（selftest 32/32）。详见 `01-修复交付总结.md` §六 |
| **本机构建** | Lead 统一跑的一次被内核 OOM 杀（exit 137，`dist` 0 HTML，`build.sh:90` 记录在案）→ 渲染层全部 `undetermined`，见终审报告「留浏览器目检」清单 |

### 自检

- `node site/tools/check-counters.mjs` → **EXIT 0**（判据 29 + 副本 7）
- `node site/tools/check-classes.mjs` → **EXIT 0**（定义集 281 / 差集 0）
- `git status --porcelain` 变化项均落在本轮申报范围内（终审 §6 判定越界写入 **0 项**）

### 补记：两处「第一版修得不彻底」的自我更正（2026-10-19 收尾时发现）

1. **重复前缀 bug**：第一版把标注写成 `harness-demo/trajectories/{file ?? 'demo.jsonl'}`，而 `site/src/data/trajectory.ts:90` 的 `file` 字段**本就自带 `harness-demo/trajectories/` 前缀** → 会渲染出 `harness-demo/trajectories/harness-demo/trajectories/demo.jsonl`。已改为 `{file ?? 'harness-demo/trajectories/demo.jsonl'}`。
   *教训：改组件前没读数据层，凭文件名猜字段内容。*
2. **修在不可达分支**：第一版只改了 `available === false` 的 else 分支（空态占位），但 `trajectory.ts:95-98` 在 `REAL_FILE` 与 `EXAMPLE_FILE` 都不存在时**直接 throw**（`available` 恒为 true）→ 该分支实际不可达，披露缺口等于没修。已把数据源标注**同时**加到可达路径（`available && events.length > 0` 分支，`traj-stats` 之前），并补 `.traj-source` 样式。
   *教训：终审判的「披露缺口」是对的，而我第一版只改了看起来相关的文案、没验证它会不会被渲染。*
