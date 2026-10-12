# 内容审计报告：notes/ 课程笔记 × 仓库文案 × 站点展示层一致性

- 审计对象：`README.md`、`notes/`（19 顶层 + details/ 8）、`site/src/`（index/learn/works/map/timeline/interview、`data/courses.ts`、`data/trajectory.ts`、组件）、`handoff.md`、6 个 demo 源码
- 审计方式：**只读**。未修改任何被审计文件；唯一新增文件为本报告（`audit/` 目录为本次创建）。
- 审计日期口径：以仓库文件 mtime 与内容自述为准（最新内容日期 2026-10-12）。
- 复核方式分级：**✅ 实跑验证**（本审计实际执行了离线 demo/脚本）、**✅ 静态验证**（源码/文件计数逐条核对）、**未验证**（仓库内无证据或需活 LLM 端点/联网，明确标注，不做断言）。

---

## ① 发现列表

### P0 — 对外门面上的错误数字（现场可被证伪）

#### C-01 【P0】rag-demo 评测数字全面过期：README 与站点仍宣称 recall@3=1.00，实际复测值为 0.31
- **证据**：
  - ✅ 实跑验证（本审计执行 `cd rag-demo && npx tsx src/evaluate.ts`，离线确定性，exit 0）：
    `系统平均：recall@3 = 0.31   recall@5 = 0.44   recall@10 = 0.50   （8 道范围内题）`、`PASS 3/8`、`gold 锚点解析：16/16 全部命中（文本锚点 → 132 个 chunk 子串匹配）`。**语料实际 132 chunks，不是 85。**
  - 旧值宣称位置：`README.md:12`（"10 题 golden set 评测（recall@3=1.00）"）；`rag-demo/README.md:58-66`（表格 recall@3=1.00 / @5=0.94 / @10=1.00 + "唯一漏题"叙事，第 75 行自注"口径存在待第二档修订的争议…未改数字"）；`site/src/pages/index.astro:42`（"85 chunks，recall@3=1.00"）；`site/src/data/courses.ts:63,64`（intro 与 interviewAngle 两处 recall@3=1.00）；`site/src/pages/works.astro:78,93-97`（"85 chunks"×2 + 三个大数字 1.00/0.94/1.00）；`notes/long-term-memory.md:211,429`（recall@3=1.00/@5=0.94/@10=1.00 + "唯一漏题"）；`notes/rag.md:283`（"85 chunks"）；`notes/knowledge-map.md:46`（"跑过 85-chunk 评测"）。
  - 正确值位置（已修订）：`notes/rag.md:293-295`（0.31/0.44/0.50、PASS 3/8、"2026-10-12 锚点式 golden set 复测"+ 口径说明：旧值 1.00/0.94 出行号指针期、同一次排序 recall@k 单调不减故两者本不可能同现）；`notes/interview-bank.md:151`（§8-Q3 已启用新值并宣布旧值作废）；`notes/knowledge-map.md:127`（0.31）。
- **问题**：同一仓库两套数字并存，且**对外门面（README + 站点首页/作品页 + courses.ts）全部是旧值**；rag-demo/README.md:58 自称"照抄 notes/rag.md §13"，而 §13 现值已是 0.31/0.44/0.50 → 自相矛盾。面试中若被要求现场 `npm run demo:eval`，当场面穿。
- **建议改法**：以 `notes/rag.md:293` 为唯一数字源，统改：README.md:12 → "recall@3=0.31（锚点式 golden set，PASS 3/8）"；rag-demo/README.md 表格 → 0.31/0.44/0.50 + 132 chunks，"唯一漏题"叙事 → "5 题 FAIL 的机制归因（Q2 语料缺口 / Q7、Q8 compact 段检索短板 / Q1 k1 饱和 / Q3 headingPath）"；index.astro:42、courses.ts:63-64、works.astro:78/93-97、long-term-memory.md:211/429、knowledge-map.md:46、rag.md:283 同步。每处旧值引用加一行脚注："旧值 recall@3=1.00 出行号指针期 gold set，已废（见 notes/rag.md §13 口径注）"。

#### C-02 【P0】harness-from-scratch §8 压缩实测数字（2423→871、摘要 4 条）与代码矛盾；handoff 已记录"当前版本从未通过"，但笔记未划改
- **证据**：
  - ✅ 实跑验证（`cd harness-demo && npx tsx src/test-compact.ts`，离线 mock，exit 0）：`压缩前 tokens≈1378（阈值 1000）`、`摘要了 3 条，压缩后 messages=5 条，tokens≈426`、`✅ 压缩逻辑验证通过`。
  - `notes/harness-from-scratch.md:196`："压缩前 tokens≈2423 → 摘要 4 条 → 压缩后 5 条，tokens≈871 ✅"。
  - `harness-demo/src/test-compact.ts:48` 断言 `summarized !== 3` 即失败 → "摘要 4 条"与代码断言直接矛盾。
  - `handoff.md:92` 已明确记录该错误并宣布修正："`test-compact.ts` 断言 `summarized===4` 与实现契约矛盾…上文 2423→871 的数字来自更早的测试版本，**当前版本从未通过过**。已改为 3，mock 测试 ✅。"
  - 复述处：`notes/details/01-context-rot.md:26`（"实测 2423→871 tokens"）。
  - git 证据：`test-compact.ts` 与 `src/context.ts` 自初始提交（e242892）起未变，2423 说法引入于 845628c——即该数字从未对当前代码成立过。
- **问题**：handoff 已宣布"已改为 3"，但 notes 正文与 details 仍留错值未划改——正是"更正要就地划改，不能只追加"纪律的反例；读者从 handoff 读到"已修"、从课程读到旧数，两头不一致。且这是面试官让现场跑 mock 测试即穿的可证伪断言。
- **建议改法**：harness-from-scratch.md:196 改为"压缩前 tokens≈1378 → 摘要 3 条 → 压缩后 5 条，tokens≈426"（与实跑一致）；details/01-context-rot.md:26 同步；handoff.md:92 保留作为修正记录。

#### C-03 【P0】首页作品计数三处互斥：hero"6 个可运行作品" vs section 标题"五个作品" vs 统计卡"5"（卡片实际列了 6 个）
- **证据**：`site/src/pages/index.astro:13`（hero "**6 个可运行作品**"）；`index.astro:23` 注释（"作品（5 个可运行 demo）"）；`index.astro:25`（section 标题"**五个作品**"）；`index.astro:27-84` 实际渲染 **6 张卡片**（harness-demo / rag-demo / sandbox-demo / mcp-demo / durable-execution-demo / framework-demo）；`index.astro:177-179`（统计卡"**5** 可运行作品"）。同站 `site/src/pages/interview.astro:110`（"/works/ 看 **5 个作品**"）；`works.astro` 实有 7 个作品 section（6 demo + whiteboard）+ 轨迹可视化 + Roadmap；`README.md:9-19` 作品表 9 行（另含 whiteboard / viz / site）。
- **问题**：同一页面三个数字（6/五/5）；"可运行作品"在全仓无统一定义（5 / 6 / 7 / 9 四种口径并存）。
- **建议改法**：冻结定义"**6 个可运行 demo 作品**"（有 `npm run demo` 的目录）；index.astro 的 hero、注释、section 标题、统计卡四处全改 6；interview.astro:110 改 6；README 作品表拆两组——"6 个可运行 demo"与"配套资产（whiteboard 口述版 / viz 渲染器 / site）"；works.astro 页面导言补一句计数口径。

### P1 — 结构性不一致 / 误导（不立即穿帮，但持续损害可信度）

#### C-04 【P1】课程门数四种口径并存：17 / 18 / 15 知识域 / 16 域
- **证据**：
  - `site/src/pages/index.astro:12`（"**17 课** × 15 知识域"）、`index.astro:165-166`（统计卡"17 课程页"）、`site/src/pages/interview.astro:115`（"按 17 课过一遍"）。
  - `site/src/pages/learn.astro:11,27`：`const total = COURSES.length` → 渲染"**18 课** · 15 域"；`site/src/data/courses.ts:47-242` 实列 **18 条**。
  - ✅ 静态验证：`/c/[slug]` 页面数 = notes 顶层 19 − `EXCLUDED_FROM_COURSE_ROUTE`（knowledge-map、interview-bank，courses.ts:261）= **17**；COURSES 的 18 条 = 17 个有 notes 文件的 slug + `whiteboard`（无 notes 文件，learn.astro:49-59 特例链向 /works/#whiteboard）。
  - `notes/knowledge-map.md:62`："课程总表 14 行 = 14 个编号课；另加 1 条主线 agent-harness.md，合计 **15 个知识域**"（✅ 课程总表实为 14 数据行，算式自洽）。
  - `handoff.md:14`："knowledge-map 升 **16 域**"；`handoff.md:119` §4.1 标题"15 个知识域"但表格实列 **16 行**（含 interview-bank 行），且行号错乱：`| 16 | 面试结构` 排在 `| 15 | 多智能体编排` 之前。
- **问题**：四个数字各有"道理"但互不一致；根因是 courses.ts 把横向资产（llm-timeline、industry-2026）与白板卡混入课程卡列表，而 knowledge-map 的"15 域"不含它们。
- **建议改法**：在 knowledge-map 头部冻结唯一口径（建议："**15 知识域** = 14 编号课 + Harness 架构主线；interview-bank / llm-timeline / industry-2026 为横向资产，不计入门数"）；站点三处统一——要么全称"17 个课程页"（/c/ 路由数），要么全称"18 张课程卡"并注明白板卡无课程页；handoff:14"16 域"改 15 或注明口径；handoff §4.1 表格行号重排、interview-bank 行移出知识域表或标横向。

#### C-05 【P1】learn.astro"建议开课顺序"漏掉多智能体编排，与 knowledge-map 建议顺序不一致
- **证据**：`site/src/pages/learn.astro:95-97`（系统设计 → 沙箱与凭据（续 S2）→ 评测工程化 → durable execution → MCP → API → 数据飞轮 → P2）；`notes/knowledge-map.md:118`（系统设计 → **多智能体编排** → 沙箱与凭据（续 §S2）→ …）；`knowledge-map.md:119` 理由段含多智能体编排（"依赖系统设计模板 + 从零写 harness 的子代理概念，2026 行业实践已收敛（单线程写），开课成本低"），`learn.astro:100` 理由段把该句删掉了。
- **问题**：多智能体编排是 P0 课（knowledge-map.md:58、courses.ts:106），却在站点学习路线页的开课顺序里不存在——手抄副本漂移的典型案例（同页 /map 已改为笔记原文渲染，见 map.astro:2-8 注释，learn 的顺序段仍是手写）。
- **建议改法**：learn.astro:95-97 补回"多智能体编排"（第二位），理由段同步；或将该段改为从 knowledge-map 原文派生，消除手抄。

#### C-06 【P1】llm-timeline 在 courses.ts 标 P0，knowledge-map 定为横向资产
- **证据**：`site/src/data/courses.ts:116-117`（llm-timeline `phase: 'P0'`、status ✅）；`notes/knowledge-map.md:60`（横向资产清单含 llm-timeline）；`knowledge-map.md:89`（mermaid 中 `TIMELINE["✅ LLM 时间线 · 横向资产"]`）；courses.ts:3-4 注释自称 llm-timeline 是"并行新增"。
- **问题**：learn 页 P0 段因此多出一张"LLM 时间线"卡，P0 卡片数虚高；按 P0 优先级排序的读者被误导；与 knowledge-map 的"横向素材"定位直接矛盾。
- **建议改法**：二选一——(a) courses.ts:116 phase 改 `'—'`（与 industry-2026 同列"未分阶段"）；(b) 若确要 P0，则在 knowledge-map 课程总表补行并改"横向资产"表述。推荐 (a)。

#### C-07 【P1】harness-demo 源文件数"9"与实际 10 不符；works.astro 文件表漏 otel.ts
- **证据**：`README.md:11`、`notes/knowledge-map.md:135`、`site/src/pages/index.astro:31`、`site/src/pages/works.astro:25` 均称"9 个（源）文件"；✅ 静态验证 `harness-demo/src/*.ts` = **10 个**（agent / context / demo / llm / otel / policy / session / test-compact / tools / types）；`harness-demo/README.md:5-16` 自己的文件地图列了 10 行（含 otel.ts）；`works.astro:31-39` 文件表 **9 行且无 otel.ts**——而同页 `works.astro:53,303` 又在宣传 `demo:otel`（11 spans/1 trace）。
- **问题**："9"对不上任何自洽口径（含 test-compact 是 10，不含 otel 是 9）；站点作品页"文件 ↔ 课程节一一对应"的卖点因漏 otel.ts 在自己站上就破了。
- **建议改法**：统一改"10 个 src 文件（9 运行时 + 1 压缩自测 test-compact）"；works.astro:31-39 表补 otel.ts 行（可观测 §S2 埋点，对应 demo:otel 模式）。

#### C-08 【P1】"四种运行模式"残留 5 处（实际 5 种）
- **证据**：`notes/harness-from-scratch.md:202`（"**四种运行模式**全部实测通过" + 4 行表）；`site/src/pages/works.astro:38`（demo.ts"多步任务 + **四种运行模式**"）；`notes/interview-bank.md:50`（§3.4-Q1"**四种运行模式**各证明了什么？"）；`site/src/pages/interview.astro:55`（同题复述）；`notes/details/03-error-paths.md:26`（"从零写 harness §9 **四种 demo 模式**"）。实际 5 种：`harness-demo/README.md:29-35`（正常 / 崩溃恢复 / 审批拒绝 / 压缩 / OTel）、`works.astro:43-53` 自己也列 5 行（含 OTel）。
- **问题**：OTel 模式 2026-10-11 加入后，课程正文/题库/站点遗留"四种"；works.astro:38 与同页:43-55 自相矛盾。
- **建议改法**：上述 5 处改"五种"；harness-from-scratch.md:202 表格补 OTel 行（或注明"§⑨ 成文时为四种，后增 OTel"）。

#### C-09 【P1】interview-bank §3.5-Q2 与站点复述仍用"recall@5 唯一漏题"旧叙事（实际 5 题 FAIL）
- **证据**：`notes/interview-bank.md:57`（"Q2 recall@5 唯一漏题错在哪？（paraphrase 探针=词法路极限）"）；`site/src/pages/interview.astro:57`（同题 + hint"paraphrase 探针 = 词法路的极限"）。✅ 实跑输出：Q1/Q2/Q3/Q7/Q8 五题 FAIL；paraphrase 探针（Q8）漏题排名为 cosine#11 / bm25#13——旧叙事称"cosine#6 / bm25#27、差 1 名出 top-5"（该旧排名残留在 `notes/rag.md:296`，与同节 :293/:295 直接矛盾）。
- **问题**：bank 的 §3.5 追问链建立在已作废的评测叙事上；§8-Q3 已是新数，同一文件两套口径。
- **建议改法**：§3.5-Q2 改问"当前 5 道 FAIL 各自的机制归因是什么？哪些是语料缺口、哪些是检索短板？"；或保留原题但加注"（2026-10-12 锚点式复测后归因扩展，见 §8-Q3）"；rag.md:296 整段按 :295 口径重写（当前是修订说明后残留的旧段落）。

#### C-10 【P1】README 课程清单漏 multi-agent.md，"15 个知识域"在 README 自身语境下只列出 14 个文件
- **证据**：`README.md:27`（"**15 个知识域**状态"）；`README.md:29` 架构主线 3 个（agent-harness / harness-from-scratch / rag）；`README.md:30` 知识域课程 11 个（system-design / durable-execution / sandbox / evaluation / mcp / api-engineering / data-flywheel / long-term-memory / observability / framework-ecosystem / model-basics）——3+11=**14 ≠ 15**，缺的正是 multi-agent.md（knowledge-map.md:58 课程总表第 14 行、P0）。
- **问题**：P0 课在 README 清单中不存在（与 C-05 的 learn 页顺序缺失叠加，一门 P0 课在三处门面"查无此课"）。
- **建议改法**：README.md:30 补 `multi-agent.md`（多智能体编排），使 3+12=15 自洽。

#### C-11 【P1】"全课内嵌约 237 题"无法复现；可复现口径为 205（课内嵌）+ 37（bank）
- **证据**：`site/src/pages/index.astro:13`（"精选题库 37 题（**全课内嵌约 237 题**）"）、`index.astro:173-174`（统计卡"**~237** 题题库（各课末尾 + 交叉题）"）。
  - ✅ 静态验证（逐文件数出）：13 课"练习题库"表编号题合计 **176**（api-engineering 14 / data-flywheel 14 / durable-execution 14 / evaluation 14 / framework-ecosystem 14 / harness-from-scratch 8 / long-term-memory 14 / mcp 14 / model-basics 14 / multi-agent 12 / observability 14 / sandbox 16 / system-design 14）+ `notes/agent-harness.md:380` 第十三节 8 题 + `notes/rag.md:314` S1 五道确认题 5 + `notes/model-basics.md:194` S7 八股速查 16 = **205**。
  - ✅ 面试题库 37 题精确成立：interview-bank §3 项目深挖 22（3.1×5 + 3.2×5 + 3.3×4 + 3.4×4 + 3.5×4）+ §4 交叉 10 + §8 行为面 5 = **37**。
  - 注：237 在任何口径下均不成立（205 或 205+37=242 都不是 237）；README 无数值声称（237/37 的实际宣称位置是站点首页）。
- **建议改法**：改为"课内嵌 205 题 + 面试题库精选 37 题"（两个数都可复现）；index.astro 统计卡同步；计数方法写进 knowledge-map 口径块备查。

#### C-12 【P1】courses.ts relatedQuestions 自称"题目原文、禁止编造"，3 条实际带编辑性后缀/改写
- **证据**：`site/src/data/courses.ts:7,16,32`（"题库真实题目（题号 no + 题目原文 text…禁止编造）"）。实测不符：`courses.ts:154` §3.2-Q4 text 作"labeler 跑挂了怎么办？(幂等/upsert——durable execution)"，`notes/interview-bank.md:40` 原文为"（幂等/upsert/durable execution）"；`courses.ts:164` §4-#8 追加"（凭据面）"，`interview-bank.md:72` 无此后缀；`courses.ts:112/227/237` §8-Q4/Q5 追加"(bank 骨架…)"括注（`interview-bank.md:156/160` 原文无）。
- **问题**：课程页公开展示的"题目原文"与题库页原文有出入，考生两头对照起疑；数据文件自设的规矩自己破。
- **建议改法**：text 字段严格取原文；编辑性说明另立 `note` 字段或删除。

#### C-13 【P1】站点"32 个 html / 已上线"本地不可复核；dist 无任何 html 且未被 git 跟踪；works 轨迹可视化 section 在 CI 构建下恒为空态
- **证据**：
  - `notes/knowledge-map.md:152`（"已上线 https://blog.zero43.top/learn-agent-harness/（**32 个 html**）"）。
  - ✅ 路由算式复核：静态页 7（index / learn / works / map / timeline / interview / details 索引）+ details/[slug] 8 + /c/[slug] 17 = **32**——算式成立，但 `find site/dist -name "*.html" | wc -l` = **0**（dist 只有 .mjs 与静态资源），且 `git ls-files site/dist` = 0（未跟踪）。本审计尝试本地构建复核：默认堆 OOM、`--max-old-space-size=2600` 仍在客户端 vite 阶段被 kill（exit 137，机器仅 3.4GB/2 核）→ 本地无法产出构建证据（环境限制，非仓库缺陷；CI  Runner 内存充裕）。
  - `site/src/data/trajectory.ts:6-8,26-28` 自注：`harness-demo/trajectories/` 被 .gitignore 排除 → GitHub Actions 构建时文件不存在 → `available=false`；`site/src/components/TrajectoryTimeline.astro:171-184` 渲染空态占位。即 `works.astro:280-289` 的"轨迹可视化 · harness-demo 真实 demo"section 在线上站点恒为占位说明，而 `works.astro:283` 仍写"数据源：demo.jsonl（build 时静态导入）"。
- **建议改法**：① "32 个 html"改为可复现表述（"17 课程页 + 8 详解 + 7 功能页"）或补一次 CI 产物计数；② 轨迹 section 二选一：`git add -f` 一个脱敏 demo.jsonl 样本让线上有数据，或把 section 改名"轨迹可视化（本地运行 harness-demo 后生成）"避免线上空壳；③ .gitignore 补 `site/dist`（或纳入管理），避免"本地有 dist = 已构建"的误判。

### P2 — 准确性风险与细节问题（含"未验证"标注）

#### C-14 【P2】"11 spans/1 trace"（demo:otel）——仓库内无证据，需活 LLM 端点，标**未验证**
- **证据**：宣称处 `notes/knowledge-map.md:150`、`notes/interview-bank.md:86,102`、`site/src/pages/index.astro:32`、`site/src/pages/works.astro:53,303`、`notes/details/06-observability-loop.md`（"已落地…11 spans/1 trace"）。`harness-demo/workspace/out/otel.md` 仅一行"OTel 埋点验证完成"（无 span 计数）；`harness-demo/src/otel.ts:52-54` span 数为运行时动态统计，取决于当次模型调用轮数。
- **结论**：未验证（本会话无可用 LLM 端点；且该数随任务波动，写成固定值本身不稳）。
- **建议改法**：改为结构性描述（"span 树：invoke_agent → chat / execute_tool，收尾打印实测 span 数"），或附一次真实运行输出日志/截图作为证据锚点。

#### C-15 【P2】framework-demo"11/11 断言"——需活端点，标**未验证**；口径实为"10 断言 + 1 总体判定"
- **证据**：宣称处 `notes/knowledge-map.md:150`、`notes/interview-bank.md:96`。✅ 静态验证 `framework-demo/src/capabilities.ts` 实含 **10 条 `ok()`**（行 13/14/37/38/62/63/64/73/75/76）+ 1 个总体判定；`handoff.md:162` 自己写的就是"10 条 `ok()` 断言（+1 整体判定=11/11）"。
- **结论**：未验证（需 Anthropic 格式端点，本会话无法实跑）。
- **建议改法**：文案改"10 条断言 + 总体判定（11/11）"，与 handoff 口径一致。

#### C-16 【P2】FinHot 全部生产数字——仓库外证据，标**未验证**；1830 vs 1875 的 45 行口径差在转述中丢失
- **证据**：`notes/data-flywheel.md:96,222-223,229,252-253,259,276-280,283`（台账 1830 行、方向分布 none 1404/bullish 316/bearish 88/neutral 67、反事实 1634 行、858 skipped、precision 0.256→0.304→0.272、accuracy 0.611→0.676→0.654、n=200/seed=7、prompt hash 链）；`notes/agent-harness.md:414,453-455`；`site/src/data/courses.ts:181`。数据源自称 FinHot `.data/eval/selection-all-200-*.json`（#35），**不在本仓库**。
- 另：`notes/data-flywheel.md:223` 自曝"四项之和 1875 与同一段 1830 行差 45 行未归类（**待核对**；不自行改数）"——这条诚实的待核对标注在 courses.ts:181、agent-harness.md:414 等转述处消失（只讲 1830）。
- **结论**：未验证（仓库外证据）。data-flywheel 内部处理规范（不自行改数、标注口径差）值得保持。
- **建议改法**：所有转述处统一挂脚注"生产台账快照（#35），方向分布与总行数存在 45 行口径差待核对"；至少保证转述不丢失该限定。

#### C-17 【P2】外部时点事实（OWASP LLM Top 10 2026 版 2026-08-04、MCP spec 2026-07-28、LangGraph 1.0.x、A2A v1.0.1、Cognition/Anthropic 文章论断）——本会话无联网条件，标**未验证**
- **证据**：`notes/knowledge-map.md:8`、`notes/mcp.md:192-211`、`notes/industry-2026.md:15-27,70-84`、`handoff.md:12,14,160,162`。本审计 web_search 不可用（无 API key），未逐一联网核实。
- **说明**：这些是内容支柱但属仓库外事实；`notes/industry-2026.md:80-84`"已知缺口 / 待复核"（A2A 版本号未取得一手源、"writing tools for agents"URL 系引用推断、2025 前时间线节点日期来自记忆）是全仓最佳范式，建议其余课程引用外部数字时统一挂同类脚注。

#### C-18 【P2】whiteboard"~150 行"实际 178 行（自初始提交起未变）
- **证据**：`README.md:13`、`notes/knowledge-map.md:136`、`site/src/pages/index.astro:33,87`、`site/src/pages/works.astro:111`、`site/src/data/courses.ts:137` 均称"~150 行"；✅ `wc -l whiteboard/agent_whiteboard.py` = **178**（含 34 空行 + 8 注释，代码约 136 行）；git 历史显示该文件自 e242892 起 178 行未变——"~150"从一开始就不准。
- **建议改法**：改"~180 行"或"178 行"；若指代码行说"约 140 行代码"。

#### C-19 【P2】durable-execution-demo"13 文件"口径含糊（src 821 行 ✅ 可验证）
- **证据**：`notes/knowledge-map.md:138`（"13 文件/src 821 行"）；✅ 静态验证 src 9 文件合计 **821 行**（133+98+38+128+81+107+112+85+39）；含 README/package.json/tsconfig 为 12，含 package-lock.json 才 13。
- **建议改法**：写"9 src 文件 / 821 行"，与 harness-demo 的 src 口径统一。

#### C-20 【P2】"逐字节一致"类验收声明的可验证性分级（含正面结论）
- ✅ **实跑通过**：sandbox-demo（本审计执行 `npx tsx src/demo.ts`，exit 0）：A（仅权限门）/ B（四通道+沙箱）两组各 3 次重放逐字节一致（sha256=df9a4e24… / 9c0d52aa…），幽灵事故复现与拦截结论符合预期 → `README.md:15`、`knowledge-map.md:139`、`index.astro:52`、`works.astro:156-160` 声明与代码（`sandbox-demo/src/replay.ts:116-136` assertDeterministic）一致。
- ✅ **实跑通过**：mcp-demo（本审计执行，exit 0）：两次重放事件序列与 digest 相同（fnv1a:220aa43d），单层消融符合预期（仅 L1 仍泄、L2/L3 各自可拦、四层全开拦截）→ `README.md:16` 声明一致。
- ✅ **静态验证一致、未实跑**：durable-execution-demo——`src/demo.ts:21`（RUNS=3）、3 个 CRASH_SPECS、`sha256(canonical(report))` 跨次比对（行 102/117）、副作用计数断言 `after === 1`（行 105-106）、`selftest.ts` 6 例合成判定表，与 `README.md:17`、`knowledge-map.md:138` 声明逐条对应；实跑会 `rmSync` 重写 `.state/`（未跟踪运行产物），本审计遵守只读约束未执行。
- **未验证**：harness-demo demo:otel 与 framework-demo（需活端点，见 C-14/C-15）。

#### C-21 【P2】knowledge-map:8"每课题库 +2 题（共 20 题）"算不通
- **证据**：`notes/knowledge-map.md:8`（🔶1-5 五个缺口项…"每课题库 +2 题（共 20 题）"）；5×2=10、四次整理 12 课×2=24，均不等于 20；`handoff.md:12` 同段只写"每课题库 +2 题"（无"共 20 题"）。
- **建议改法**：删"（共 20 题）"或给出算式。

#### C-22 【P2】agent-harness.md §14"24min" vs 全仓其余"25 分钟"
- **证据**：`notes/agent-harness.md:414`（"错误目录 build 换掉生产容器 24min"）；`site/src/pages/index.astro:120`（"18:25 重建恢复（25 分钟）"）、`notes/interview-bank.md:19,135`（"25 分钟恢复"）、sandbox-demo 运行输出（"恢复代价 25 分钟"）。
- **建议改法**：统一 25 分钟（18:00→18:25）；若取 24.85 约数需全仓一致。

#### C-23 【P2】notes 之间零内部链接，"Obsidian vault"名不副实；站点课程页互不链接；README"PNG 全渲染"不实
- **证据**：✅ `grep -rE '\]\(' notes/` 与 `\[\[` 均 **0 命中**——跨课引用全是裸文本（如"沙箱与凭据 §S2"）；`site/astro.config.mjs` 的 remark 插件只有 gfm/math/mermaid，无交叉引用自动链接；`notes/` 无任何 PNG 嵌入（`grep -rn '!\[\[' notes/` 0 命中，viz/ 仅 render.mjs 与 mermaid-check.mjs），而 `README.md:25` 称"（LaTeX、mermaid、PNG 全渲染）"。
- **建议改法**：Obsidian 侧至少给 knowledge-map 命名总表（knowledge-map.md:18-39）加 wikilinks；站点侧加轻量 remark 插件把"规范名 §Sn"自动链到 /c/<slug>/（提升课程页间导航，这是"展示形式"收益最大的一处）；README:25 删"PNG 全渲染"或真正补图。

#### C-24 【P2】JD 覆盖矩阵空洞（interview-bank §6）：1 条 ⚪ 未排课 + 2 条 🟡 短板
- **证据**：`notes/interview-bank.md:82-97`：A2A / agent 身份 = "—（观察级）未排课 ⚪ 按 roadmap 保持观察"（唯一无课程行）；长期记忆 🟡"有活系统，无自研"；框架生态 🟡"有 SDK 实操，LangGraph 等仍只有定位级"。
- **判断**：⚪ 行是显式声明的观察级空洞（A2A 对 coding agent 岗确边缘，可维持）；两条 🟡 是真实短板。
- **建议改法**：框架生态 🟡 的补强路径写具体——framework-demo 已有 Claude Agent SDK 实操，缺 LangGraph/OpenAI Agents SDK 对照；最小动作："同一白板任务跑三家 SDK"对照演示，与 multi-agent §S6 框架对照节联动（该节已存在，见 knowledge-map.md:34）。

#### C-25 【P2】details/ 8 篇与正文章节的映射核查：引用基本准确，2 处过期数字/模式残留
- **证据**（逐篇核对"本地映射"栏）：
  - 01 → agent-harness §5.1（行 100"注意力边际递减（context rot）"✓）/ §5.2 / §8.1（行 231"1-2k token 浓缩摘要"✓）——但复述过期压缩数字 2423→871（见 C-02）；
  - 02 → agent-harness §3.1（行 42-49 ACI/SWE-bench/poka-yoke/最小可用/说不清 ✓）、§3.2 三道门 ✓；
  - 03 → agent-harness §6.1/§6.2（行 151/185 ✓）、§9.1（行 34 ✓）——但"§9 四种 demo 模式"过期（见 C-08）；
  - 04 → harness-from-scratch §8 + agent-harness §9.3 + evaluation §S2/S6 ✓；
  - 05 → harness-from-scratch §5 + agent-harness §7.1/§7.2（行 83/197 ✓）+ sandbox §S1/S2/S4 ✓；
  - 06 → harness-from-scratch §6 + agent-harness §9.1/§9.2 + evaluation §S2/S4/S6 + observability §S3/S5 ✓——但"11 spans/1 trace"未验证（见 C-14）；
  - 07 → agent-harness §10.2（行 313"每层删掉它会失去什么保证"✓）+ harness-from-scratch 开场模型侦察/§9 + sandbox §S6 ✓；
  - 08 → agent-harness §8.2（行 240 worktree ✓）/ §8.3（行 243-248 pi-agents-team ✓）+ sandbox §S1 ✓。
- **结论**：details 的"未覆盖"栏是高质量自我审视（如 07 自承"pin 是防变化取向，与实现可自由更换取向相反"），建议保留并随课程更新；仅 2 处残留需划改。

#### C-26 【P2】站点 /map 与 /interview 已改"笔记原文渲染"（单一真源，好实践），但 learn.astro 的进度/顺序段仍是手抄副本（漂移源）
- **证据**：`site/src/pages/map.astro:2-8` 注释（"此前是手绘副本…与 canonical 反复漂移；现改为原文渲染"）；`site/src/pages/learn.astro:16-21,95-101` 仍手写 PHASES 描述、建议开课顺序、理由段。
- **建议改法**：learn 页的阶段描述与开课顺序改为从 knowledge-map 派生，或在页面显式标注"手抄副本，可能滞后"。

#### C-27 【P2】rag.md §13 自身三处内部不一致（头部 85 chunks / 正文新值 / 尾部旧叙事段落）
- **证据**：`notes/rag.md:283`（"> 语料 = … → 85 chunks"）；`notes/rag.md:293`（新值 0.31/0.44/0.50，2026-10-12 复测）；`notes/rag.md:295`（口径说明：旧值已废）；`notes/rag.md:296`（"唯一漏题 = paraphrase 探针…差 1 名出 top-5"——旧叙事残段，与 :295 的"当前漏题定位到机制层：Q2/Q7/Q8"直接矛盾）；✅ 实跑 paraphrase 题（Q8）漏题排名 cosine#11/bm25#13（非 #6/#27）。另 `notes/rag.md:282`"作品 = rag-demo/（11 个 src 文件）"过期——✅ 实际 15 个 src（knowledge-map:137"15 文件"与 rag-demo/README.md:7-25 文件地图均正确）。
- **建议改法**：:283 改 132 chunks；:296 按 :295 口径重写；:282 改 15 个 src 文件。

### 正面结论（无需改动，列出以固定基线）

- ✅ `README.md:25`"27 个文件 / ~600KB"：`ls notes/*.md | wc -l` = 19、details/ = 8、`du -sk notes/` = 628KB——成立。
- ✅ 面试题库 37 题精确成立（见 C-11）；harness-from-scratch 8 题、agent-harness 8 题、rag S1 5 题与 handoff.md §4.1 各行"题库 N 题"描述一致。
- ✅ `notes/knowledge-map.md:62`"15 个知识域"算式自洽（14 编号课 + 1 主线）。
- ✅ sandbox-demo"600 行"精确（src 7 文件 92+44+137+103+48+118+58=600）；"3 次重放逐字节一致"实跑通过。
- ✅ mcp-demo 消融与两次重放逐字节一致实跑通过。
- ✅ durable-execution-demo src 821 行、"3 崩溃点×各 3 次 / 副作用恒=1 / 恢复报告逐字节一致"与 demo.ts 断言逐条对应（静态）。
- ✅ harness-demo `trajectories/demo.jsonl` 22 行事件分布（init×1 / model_response×6 / tool_intent×6 / tool_exec×8 / final×1）与 handoff.md:162 记录完全一致。
- ✅ llm-timeline"12 节点"成立（表格 12 数据行）；agent-harness.md"15 节"成立（第 1-2 回顾 + 第三~第十五节）。
- ✅ knowledge-map 课程总表 14 行、命名总表 21 行与 notes 实际文件对应（19+8 全部有着落）。
- ✅ system-design.md:264 ToT 引 NeurIPS 2023、mcp.md:192-211 OWASP 2026 版条目变动，与 handoff.md:160 记录的修正一致（内容内部自洽）。
- ✅ courses.ts 的 7 个 BANK 锚点与 toc.ts 的 slug 算法推演一致（如 "3.1 FinHot 幽灵事故（权限/沙箱/事故响应，最稀缺故事）" → `31-finhot-幽灵事故权限沙箱事故响应最稀缺故事`）；17 个 /c/ slug 全部有元数据，无 DEFAULT_META 兜底页。

---

## ② 内容调整建议（针对"coding agent 岗面试备考"目标）

### A. 数字治理（最高优先级，一次性运动）
1. **建立"唯一数字源"制度**：评测数字只认实跑输出——rag 指标以 `notes/rag.md §13` 为源（现值为 0.31/0.44/0.50、PASS 3/8、132 chunks），压缩数字以 `test-compact.ts` 实跑为源（1378→426、摘要 3 条）；README / site / 各课 / handoff 一律抄录，不另起数。在 handoff.md 增补一条"数字引用规范"。
2. **一次性划改清单**（按 C-01/C-02 执行）：README.md:12；rag-demo/README.md:58-66,75；index.astro:42；courses.ts:63-64；works.astro:78,93-97；long-term-memory.md:211,429；knowledge-map.md:46；rag.md:283,296；harness-from-scratch.md:196；details/01-context-rot.md:26。
3. **计数口径冻结**（写进 knowledge-map 头部口径块，其余位置只引用）：知识域 **15**（14 编号课 + 主线）/ 课程页 **17**（/c/ 路由）/ 课程卡 **18**（含白板卡）/ 可运行 demo 作品 **6** / 课内嵌题 **205** / 面试题库精选 **37**。对应修正点：C-03、C-04、C-06、C-11、C-21。

### B. 结构性问题修正
4. **learn.astro 开课顺序补回"多智能体编排"并改为从 knowledge-map 派生**（C-05/C-26）——P0 课不能只在笔记里存在。
5. **README.md:30 补 multi-agent.md**（C-10）。
6. **handoff.md §4.1 表格行号重排 + "16 域"改 15**（C-04）。
7. **courses.ts 清理**：llm-timeline phase 改 '—'（C-06）；relatedQuestions 的 text 严格取原文、编辑说明移入 note 字段（C-12）。
8. **works.astro 文件表补 otel.ts 行、"四种运行模式"改五种**（C-07/C-08）；"9 个文件"改 10（README.md:11、knowledge-map.md:135、index.astro:31 同步）。
9. **interview-bank §3.4-Q1 / §3.5-Q2 按"五种模式 + 5 题 FAIL 归因"重写**，站点 interview.astro:55,57 同步（C-08/C-09）。

### C. 准确性标注（不改数字，改标注）
10. **11 spans/1 trace 改结构性描述**或附真实运行日志（C-14）；**framework-demo"11/11 断言"改"10 断言 + 总体判定"**（C-15）。
11. **FinHot 数字统一挂"生产快照（#35）"脚注**，保留 1830 vs 1875 的 45 行口径差提示（C-16）。
12. **外部时点事实（OWASP/MCP spec/LangGraph/A2A）挂"未联网复核"脚注**，范式照抄 industry-2026.md:80-84"已知缺口 / 待复核"（C-17）。
13. **whiteboard "~150 行"改 ~180 行**（C-18）；**durable"13 文件"改"9 src / 821 行"**（C-19）；**agent-harness §14"24min"改 25 分钟**（C-22）。

### D. 展示层改进（site/，不改内容只改呈现）
14. **课程页交叉引用自动链接**：加 remark 插件把正文"规范名 §Sn"链到 /c/<slug>/——目前 notes 零内部链接（C-23），这是本站导航收益最大的单点改进。
15. **works 轨迹 section 处理**：提交脱敏 demo.jsonl 样本或改 section 定位，避免线上空壳（C-13）。
16. **"32 个 html"改为可复现算式表述**；.gitignore 补 site/dist（C-13）。
17. **首页统计卡与 hero 统一为 6 作品 / 17 课程页 / 15 知识域 / 205+37 题**（C-03/C-04/C-11）。

### E. 针对备考目标的内容增删判断
18. **保留并放大**：details/ 8 篇"本地映射（已覆盖/未覆盖）"体例是全仓最强内容形态（C-25 核查引用基本准确），建议推广到每门课的"面试映射"节；data-flywheel.md:223 的"不自行改数、标注口径差"是诚实范式，推广到所有外部数字。
19. **应重写**：interview-bank §3.5（rag-demo 追问链）——hash embedding 的故事是差异化王牌，但 Q1/Q2 还停在已作废的评测叙事上；按 2026-10-12 复测重写为"5 题 FAIL 的机制归因链"（语料缺口 vs 检索短板 vs paraphrase 极限），这本身就是更强的面试答案（C-09）。
20. **应补**：框架生态 🟡 → LangGraph/OpenAI Agents SDK 最小对照 demo（与 multi-agent §S6 联动）；长期记忆 🟡 → interview-bank.md:103 已列的"记忆投毒回归测试脚本"仍可做（低成本高信号）。A2A ⚪ 维持观察即可（C-24）。
21. **可合并/去冗**：knowledge-map.md:145-151"未结事项"与 interview-bank.md:105-111"未结清单"、handoff.md §四 三处待办高度重叠且部分已完成未勾——建议合并为单一"未结事项"清单（knowledge-map 为源，其余处引用）；handoff.md §4.1 与 knowledge-map 课程总表内容重复，handoff 改为只记增量。

---

## 附：本审计执行的复核命令（可重跑）

```bash
# 计数类
ls notes/*.md | wc -l                                   # 19
ls notes/details/*.md | wc -l                           # 8
du -sk notes/                                           # 628 KB
# 课内嵌题：176（13 课练习题库表）+ 8（agent-harness §13）+ 5（rag S1）+ 16（model-basics S7）= 205
awk '/^## 练习题库/{flag=1;next} /^## /{flag=0} flag' notes/<课>.md | grep -cE '^\| [0-9]+ \|'
# 面试题库：§3 22 + §4 10 + §8 5 = 37
awk '/^## 3\./,/^## 4\./' notes/interview-bank.md | grep -cE '^- Q[0-9]'
# demo 文件/行数
find <demo> -type f -not -path '*/node_modules/*' | xargs wc -l
wc -l whiteboard/agent_whiteboard.py                    # 178
grep -oE '"kind":"[a-z_]+"' harness-demo/trajectories/demo.jsonl | sort | uniq -c   # 22 事件
# 实跑验证（离线，exit 0）
cd rag-demo && npx tsx src/evaluate.ts                   # recall@3=0.31/@5=0.44/@10=0.50, PASS 3/8, 132 chunks
cd harness-demo && npx tsx src/test-compact.ts           # 1378→426, 摘要 3 条
cd sandbox-demo && npx tsx src/demo.ts                   # A/B 各 3 次逐字节一致 ✅
cd mcp-demo && npx tsx src/demo.ts                       # 消融符合预期 + 两次重放 digest 一致 ✅
# 未执行（说明）
# - durable-execution-demo demo：实跑会 rmSync 重写 .state/ → 只做静态核对
# - harness-demo demo:otel / framework-demo：需活 LLM 端点 → 未验证
# - site 本地构建：本机 3.4GB 内存客户端 vite 阶段 OOM（exit 137）→ 页数以路由算式复核
# - 外部事实联网核实：本会话 web_search 无 API key → 未验证
```

*报告完。所有结论均可按上述命令与 文件:行 证据复核。*
