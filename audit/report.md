# 综合分析报告：learn-agent-harness 展示层 × 上游内容

- 综合对象：`audit/content-audit.md`（内容审计，27 条发现）与 `audit/presentation-audit.md`（展示审计，18 条发现 + 14 条提案）
- 本报告性质：**只读分析**。未修改任何被审计文件；唯一新增文件为本报告（`audit/report.md`）。
- 验证口径：
  - **✅ 已复核**（本综合亲自执行/逐行核对）：两条 P0 数字均实跑复现，四条必抽文件 + learn/works/harness-from-scratch/rag/interview/evaluation 关键行逐条对上，展示层 8 处静态证据抽验通过。详见 §0。
  - **✅ 转引审计**（两位审计员已实跑/静态验证，本报告未重复执行）：sandbox-demo / mcp-demo 逐字节一致、构建 OOM 复现、对比度计算等。
  - **未验证**（需活 LLM 端点 / 联网 / 完整浏览器渲染）：demo:otel 的 11 spans、framework-demo 11/11、FinHot 生产数字、OWASP/MCP spec/LangGraph/A2A 等外部时点事实。**本报告不对它们下断言**。

---

## 0. 高严重度发现复核结论（防误报）

| # | 复核项 | 方法 | 结论 |
|---|---|---|---|
| 1 | rag-demo 评测 recall@3=1.00 已过期 | 亲自实跑 `cd rag-demo && npx tsx src/evaluate.ts`（exit 0） | **属实**：`recall@3 = 0.31 / recall@5 = 0.44 / recall@10 = 0.50`，`PASS 3/8`，`gold 锚点解析 16/16 → 132 chunks`；Q8 paraphrase 漏题排名 cosine#11 / bm25#13。README:12、index.astro:42、works.astro:93-97、courses.ts:63-64 的旧值（1.00/0.94/1.00、85 chunks）与实跑矛盾 |
| 2 | harness-from-scratch:196 压缩数字矛盾 | 亲自实跑 `cd harness-demo && npx tsx src/test-compact.ts`（exit 0） | **属实**：`压缩前 tokens≈1378 → 摘要 3 条 → 压缩后 5 条 tokens≈426`；笔记:196 写 2423→871/摘要 4 条，与代码断言 `summarized !== 3 即失败` 直接矛盾。同命令实测 `src/*.ts` = **10 个文件**（"9 个源文件"亦不实） |
| 3 | 作品计数 6 / 五 / 5 三处互斥 | 逐行读 index.astro | **属实**：hero:13"6 个"、注释:23"5 个"、标题:25"五个作品"、统计卡:177"5"，而:27-84 实渲染 **6 张卡片**；interview.astro:110 亦写"5 个作品" |
| 4 | 课数/域数四种口径 | 逐行读 courses.ts + index/learn/interview | **属实**：courses.ts 实列 **18 条**（P0×9 / P1×4 / P2×4 / —×1），learn.astro:11 `COURSES.length` → "18 课"；index.astro:12/165、interview.astro:115 写"17 课"；"15 域"（knowledge-map:62，算式自洽）vs courses.ts 去重后实为 17 个 domain vs handoff:14"16 域" |
| 5 | learn 页开课顺序漏 multi-agent | 对照 learn.astro:95-97 与 knowledge-map.md:118 | **属实**：knowledge-map 顺序第二位是"多智能体编排"且理由段有其依赖分析；learn.astro 顺序与理由段均无。README:30 清单同样漏 multi-agent.md（3+11=14≠15） |
| 6 | `$...$` 假公式 | 逐行读 notes/evaluation.md:314/371/372 | **属实**：`$= 26 + 11 = 37$`、`$7 + 4 = 11$ 对`、`$8 + 1 = 9$ 对` 三处成对 `$` 包算术式，会被 rehype-katex（throwOnError:false）静默排成公式 |
| 7 | 暗色模式代码块白底 | grep global.css shiki | **属实**：`:488` 只有注释"双主题变量由 Astro 注入，随 data-theme 切换"，全文件无任何规则消费 `--shiki-dark`；40 个代码块亮色写死在内联 style |
| 8 | Mermaid.astro 死代码 / /c 双 chip / Header /c 失联 / interview 无 TOC / details top3 双渲染 / trajectories 被 gitignore | grep + sed 抽验 | **全部属实**：`grep -rn 'import Mermaid' src/` 为空；c/[slug].astro:31-32 两个同 domain chip；isActive 对 /c/* 无匹配；interview.astro 有 `toc` 无 `toc.map`（map.astro:55 有）；details/index.astro:79 `items.map` 不过滤 TOP3；.gitignore:13 `harness-demo/trajectories/` |

### 对两份审计报告的修正/降级（本报告的复核产出）

- **修正（不影响结论）**：presentation-audit F-06 称 courses.ts "P0×10"，实为 **P0×9**（P1×4 / P2×4 / —×1，总数 18 不变）。
- **降级（计数口径微差）**：F-14 称 `--text-faint` 用在 17 处，global.css 内实为 **16 处** `var(--text-faint)`（问题本身成立，不达标结论不变）；F-18 称"14+ 处 `style="display: block"`"，`src/pages/*.astro` 精确匹配为 **11 处**（全站内联 style 合计 36 处，问题成立）。
- **不降级**：F-10 的"中文锚点编码不一致"本身通常能匹配（审计员已如实标注），其真实内核是"BANK 六个锚点是手抄常量、无任何校验"——本报告按后者定级，保留 P1。
- **未发现误报**。两条 P0 数字、作品计数、口径混乱均已第一手复现，无需剔除任何发现。

---

## ① 问题总清单（P0 → P1 → P2）

> 每条含：问题 / 证据 / 影响 / 建议修法 / 根因归类。编号 U-xx 为合并后的统一编号；`C-xx`=内容审计、`F-xx`=展示审计原编号。
> 根因分类：**RC-1 缺单一数据源**（手抄数字/计数散落）｜**RC-2 修订未就地划改**（改一处、副本残留）｜**RC-3 渲染管线静默失效**（配置写了不生效、错误被吞）｜**RC-4 页面模板不统一**（双入口、残缺副本、重复渲染）｜**RC-5 规范缺失**（a11y / 响应式 / 排版 measure）｜**RC-6 资产管线断裂**（gitignore 排除、锚点手抄、产物不可复核）｜**RC-7 口径无定义**（"作品/课/域"从未冻结）。

### P0 — 对外门面上可被当场证伪

#### U-01 【P0】rag-demo 评测数字全面过期：对外门面全在宣称 recall@3=1.00，实跑为 0.31（C-01 / F-01）
- **问题**：旧值 recall@3=1.00 / @5=0.94 / @10=1.00、85 chunks 与 2026-10-12 锚点式复测值（0.31 / 0.44 / 0.50、PASS 3/8、132 chunks）两套并存，且**旧值占据全部对外位置**。
- **证据**（✅ 已复核）：旧值在 README.md:12、site index.astro:42、works.astro:78/93-97、courses.ts:63-64、notes/long-term-memory.md:211,429、knowledge-map.md:46、rag.md:283；新值只在 notes/rag.md:293-295 与 interview-bank.md:151。**同站 /c/rag 渲染 rag.md 显示 0.31，首页/作品页显示 1.00——两页互打脸**。
- **影响**：最醒目位置（首页 hero 下方、/works 大数字）展示作废数字；面试官让现场 `npm run demo:eval` 即当场证伪；rag-demo/README.md:58 自称照抄 rag.md §13，而 §13 现值已是新数，自相矛盾。
- **建议修法**：以 notes/rag.md:293 为唯一数字源，统改上述全部旧值位置；"唯一漏题"叙事改为"5 题 FAIL 的机制归因（Q2 语料缺口 / Q7、Q8 compact 段检索短板 / Q1 k1 饱和 / Q3 headingPath）"；每处旧值引用加脚注指向口径说明。**同时按提案 P-01 把这三个数字改为构建期从评测产物/rag.md §13 派生**，否则下次复测再漂。
- **根因**：RC-1（主）+ RC-2（rag.md §13 自身 :283/:296 残留旧值，是"修订未划改干净"的活例）。

#### U-02 【P0】harness-from-scratch 压缩实测数字与代码矛盾；handoff 已宣布"已改为 3"但笔记未划改（C-02）
- **问题**：笔记宣称"压缩前 2423 tokens → 摘要 4 条 → 压缩后 871"，代码与实跑均为 1378→426 / 摘要 3 条。
- **证据**（✅ 已复核）：实跑输出 `压缩前 tokens≈1378（阈值 1000）`、`摘要了 3 条，压缩后 messages=5 条，tokens≈426`、`✅ 压缩逻辑验证通过`；test-compact.ts:48 断言 `summarized !== 3` 即失败；handoff.md:92 明确记录"2423→871 来自更早的测试版本，**当前版本从未通过过**。已改为 3"；git 显示该数字自引入起从未对当前代码成立。复述处：notes/details/01-context-rot.md:26。
- **影响**：handoff 读"已修"、课程读旧数，两头不一致；面试现场跑 mock 测试即穿；是"更正要就地划改，不能只追加"纪律的反例。
- **建议修法**：harness-from-scratch.md:196 改为 1378→426/摘要 3 条；details/01-context-rot.md:26 同步；handoff:92 保留作修正记录。
- **根因**：RC-2。

#### U-03 【P0】作品计数三处互斥："可运行作品"在全仓有 5/6/7/9 四种口径（C-03 / F-03）
- **问题**：index.astro 同页 6/五/5 三个数字 vs 实际 6 张卡片。
- **证据**（✅ 已复核）：index.astro:13/23/25/27-84/177-179；interview.astro:110"5 个作品"；works.astro 有 7 个作品 section + 轨迹 + Roadmap；README:9-19 作品表 9 行。
- **影响**：首页第一屏自相矛盾；"可运行作品"无定义导致每个页面各写各的。
- **建议修法**：冻结定义"**6 个可运行 demo 作品**"（有 `npm run demo` 的目录：harness / rag / sandbox / mcp / durable-execution / framework）；index 四处 + interview:110 全改 6；README 作品表拆"6 个可运行 demo"与"配套资产（whiteboard / viz / site）"；works.astro 导言补计数口径。按提案 P-01 改为派生量。
- **根因**：RC-7（口径无定义）+ RC-1（手抄）。

#### U-04 【P0】`$...$` 假公式：三行散文算术被 rehype-katex 静默排成数学公式（F-02）
- **问题**：`= $7 + 4 = 11$ 对` 这类写法中成对的 `$` 被当行内公式定界符。
- **证据**（✅ 已复核原文 + 审计员实跑管线复现）：notes/evaluation.md:314（`$= 26 + 11 = 37$`）、:371（`$7 + 4 = 11$ 对`）、:372（`$8 + 1 = 9$ 对`）；输出为 `<span class="katex">…<annotation>7 + 4 = 11</annotation>`。`throwOnError:false` 使其静默发生。不成对的 `$`（如"成本 < $2"、"$PATH"）不受影响。
- **影响**：/c/evaluation 等页出现把"7 加 4 等于 11 对"排成数学体的怪异渲染，访客一眼看出"这站坏了"。
- **建议修法**：内容侧三行的 `$` 改中文表述或转义；管线侧根治——本站真实公式几乎全是 `$$` 显示公式与少量 `$p_o$` 单符号，把 remark-math 的 singleDollar 关掉（`micromark-extension-math` 的 `singleDollar: false`）损失极小。
- **根因**：RC-3。

### P1 — 结构性不一致 / 静默失效

#### U-05 【P1】课数与域数四种口径：17 / 18 课、15 / 16 / 17 域（C-04 / F-06）
- **证据**（✅ 已复核）：courses.ts 实 18 条（含 whiteboard 卡，无 notes/whiteboard.md，learn.astro:49-59 特例链向 /works）；/c/ 实生成 17 个路由（19 notes − knowledge-map − interview-bank）；index/interview 写 17 课；knowledge-map:62"15 域"算式自洽（14 编号课 + 主线）；courses.ts 去重 domain 实为 17 个（含 LLM 时间线/行业前线调研两个横向 + harness-from-scratch 与 whiteboard **共用同名域**"从零写 harness" → /learn 出现两张同名卡）；handoff:14"16 域"且 §4.1 表格 16 行行号错乱。
- **影响**：访客三页读到四个数字，"域"的定义全站没有一处说清。
- **建议修法**：在 knowledge-map 头部冻结口径并让其余位置只引用：**15 知识域**（14 编号课 + Harness 架构主线；interview-bank / llm-timeline / industry-2026 / details 为横向资产，不计入）/ **17 课程页**（/c/ 路由）/ **18 课程卡**（含白板卡，注明无课程页）。站点三处按此统一；whiteboard 给独立域名（如"从零写 harness（白板版）"）消同名双卡；handoff §4.1 行号重排。
- **根因**：RC-7 + RC-1。

#### U-06 【P1】P0 课"多智能体编排"在站点学习路线与 README 清单中查无此课（C-05 / C-10 / C-26）
- **证据**（✅ 已复核）：knowledge-map.md:58 课程总表第 14 行 P0、:118 建议开课顺序第二位；courses.ts:106 亦为 P0。但 learn.astro:95-97 开课顺序无它、:100 理由段删掉了它的依赖分析；README:29-30 的 3+11=14 个文件里没有 multi-agent.md。
- **影响**：一门 P0 课在三处门面不存在；learn 页顺序与知识地图矛盾；map.astro 已改"笔记原文渲染"（好实践），learn 的顺序段仍是手抄副本——漂移的典型案例。
- **建议修法**：learn.astro:95-97 补回"多智能体编排"（第二位）并同步理由段；README:30 补 multi-agent.md（3+12=15 自洽）；**根本修法**：learn 的阶段描述/开课顺序改为从 knowledge-map 派生（与 map.astro 同模式），或在页面显式标注"手抄副本，可能滞后"。
- **根因**：RC-2 + RC-1。

#### U-07 【P1】llm-timeline 在 courses.ts 标 P0，knowledge-map 定为横向资产（C-06）
- **证据**（✅ 已复核）：courses.ts:116 `phase: 'P0'`；knowledge-map.md:60/89 明确 llm-timeline 是横向资产。
- **影响**：/learn 的 P0 段多出一张"LLM 时间线"卡，P0 卡片数虚高，按优先级阅读的访客被误导。
- **建议修法**：phase 改 `'—'`（与 industry-2026 同列"未分阶段"）；若确要 P0 则反过来改 knowledge-map，二者不可兼得。
- **根因**：RC-2。

#### U-08 【P1】harness-demo 源文件数"9"与实际 10 不符；works 文件表漏 otel.ts（C-07）
- **证据**（✅ 已复核）：`ls harness-demo/src/*.ts` = 10；README:11、knowledge-map:135、index.astro:31、works.astro:25 均称 9；works.astro:31-39 表 9 行无 otel.ts，而同页 :43-53 在宣传 demo:otel。
- **影响**："文件 ↔ 课程节一一对应"的卖点在自己站上破了；同页自相矛盾。
- **建议修法**：统一"10 个 src 文件（9 运行时 + 1 压缩自测）"；works 表补 otel.ts 行（可观测 §S2 埋点）。
- **根因**：RC-1 + RC-2（OTel 加入后只改了一处）。

#### U-09 【P1】"四种运行模式"残留 5 处，实际 5 种（C-08）
- **证据**（✅ 已复核）：harness-from-scratch.md:202（4 行表无 OTel）、works.astro:38（"四种"）与同页 :43-53（5 行表含 OTel）自打脸、interview-bank.md:50、interview.astro:55、details/03-error-paths.md:26。
- **建议修法**：5 处改"五种"；harness-from-scratch:202 表补 OTel 行或注明"§⑨ 成文时为四种，后增 OTel"。
- **根因**：RC-2。

#### U-10 【P1】interview-bank §3.5 追问链建立在已作废的评测叙事上（C-09 / C-27）
- **证据**（✅ 已复核 + 实跑）：interview-bank.md:57 与 interview.astro:57 仍问"recall@5 唯一漏题"；实跑 5 题 FAIL（Q1/Q2/Q3/Q7/Q8），Q8 paraphrase 排名 cosine#11 / bm25#13，旧叙事称"#6/#27 差 1 名"；rag.md:296 是修订说明后残留的旧段落，与同节 :295 直接矛盾。
- **影响**：同一文件 §8-Q3 已用新数、§3.5 用旧叙事，考生两头对照起疑。
- **建议修法**：§3.5-Q2 重写为"当前 5 道 FAIL 各自的机制归因？哪些是语料缺口、哪些是检索短板？"（这本身就是更强的面试答案）；rag.md:296 按 :295 口径重写；rag.md:283 改 132 chunks、:282 改 15 个 src 文件。
- **根因**：RC-2。

#### U-11 【P1】"全课内嵌约 237 题"不可复现，可复现口径为 205 + 37（C-11）
- **证据**（✅ 转引审计的静态计数 + 部分核对）：13 课练习题库表 176 + agent-harness §13 8 + rag S1 5 + model-basics S7 16 = **205**；面试题库 37 题精确成立；237 在任何口径下不成立（205 或 242 都不是 237）。宣称位置 index.astro:13/173-174。
- **建议修法**：改"课内嵌 205 题 + 面试题库精选 37 题"；计数方法写进 knowledge-map 口径块备查。
- **根因**：RC-1。

#### U-12 【P1】courses.ts 自称"题目原文、禁止编造"，3 条实际带编辑性后缀（C-12）
- **证据**：courses.ts:154/164/112/227/237 的 text 有括注改写，interview-bank.md 原文无。
- **影响**：数据文件自设的规矩自己破；课程页与题库页两头对照起疑。
- **建议修法**：text 严格取原文；编辑说明另立 `note` 字段或删除。
- **根因**：RC-2。

#### U-13 【P1】暗色模式下 40 个代码块仍白底黑字（F-04）
- **证据**（✅ 已复核）：global.css:488 注释声称"随 data-theme 切换"，但无任何规则消费 `--shiki-dark`；产物中亮色写死在内联 style，暗色只以变量存在。mermaid 反而做对了（按 data-theme 重渲染）。
- **影响**：用户主动选择暗色后，一半页面是坏的——功能承诺未兑现。
- **建议修法**：补三条 CSS 消费 `--shiki-dark` / `--shiki-dark-bg`（`:root[data-theme='dark']` 下）；注释改为实话。工作量小。
- **根因**：RC-3。

#### U-14 【P1】/timeline 与 /c/llm-timeline 双入口且前者是残缺版；/interview 无 TOC（F-05）
- **证据**（✅ 已复核）：llm-timeline 不在 EXCLUDED_FROM_COURSE_ROUTE；/timeline 无 TOC/相关题/页脚而 /c/llm-timeline 有；interview.astro 取了 TOC 只用于 idOf()，从不渲染（map.astro 渲染了）。
- **影响**：同一内容两个 URL，Header"时间线"进去拿到功能更少的版本；全站最长页（interview-bank 14986 字节）无目录。
- **建议修法**：llm-timeline 加入排除集，/timeline 复用 /c/[slug] 布局（或 301）；/interview 补 TOC 侧栏（抄 map.astro:48-65）。
- **根因**：RC-4。

#### U-15 【P1】/details 列表页把 top3 卡片渲染两次（F-07）
- **证据**（✅ 已复核）：details/index.astro:22-25 TOP3_SLUGS 渲染后，:79 items.map 不过滤。
- **建议修法**："全部详解"过滤掉 top3 渲染"其余 5 篇"；两区统一调 oneLiner()。
- **根因**：RC-4。

#### U-16 【P1】/c/[slug] 元信息条同域名两个 chip（F-08）
- **证据**（✅ 已复核）：c/[slug].astro:31-32 `{meta.domain}` 出现两次，17 个课程页全中。
- **建议修法**：删一行；第二格改显示有信息量的内容（对应作品/笔记文件名）。
- **根因**：RC-4。

#### U-17 【P1】导航当前位置在 /c/* 失联（F-09）
- **证据**（✅ 已复核 isActive 逻辑）：`path.startsWith(item.href)` 对 /c/rag/ 无匹配；而面包屑说"首页 / 学习路线 / 域名"——两套定位信号矛盾。
- **建议修法**：`path.startsWith('/c/')` 时高亮"学习路线"，并加 `aria-current="page"`。
- **根因**：RC-4。

#### U-18 【P1】课程页相关面试题的 6 个锚点是手抄常量，无任何校验（F-10）
- **证据**（✅ 已复核）：courses.ts:37-45 BANK 六个 id 全硬编码；interview.astro 顶部复习区锚点有 fail-fast 校验，BANK 没有。interview-bank.md 标题一动，6 个锚点静默失效。
- **建议修法**：BANK 改为构建期从 interview-bank.md 的 TOC 解析（复用 toc.ts，与 interview.astro 同机制），让锚点与笔记标题同源。
- **根因**：RC-6。

#### U-19 【P1】Mermaid.astro 是死代码；62 张 mermaid 图全部无图题、无 figure 语义（F-11）
- **证据**（✅ 已复核）：无任何页面 import Mermaid.astro；62 个 mermaid 围栏 ↔ 产物 62 个裸 div.mermaid；`.mermaid-figure` CSS 对全站无一生效。
- **影响**：本站最重要的内容资产（62 张结构图 vs 40 个代码块）没有一张图注，说明文字散落在正文里；屏幕阅读器读到空 div。
- **建议修法**：remarkMermaid 升级为产出 `<figure class="mermaid-figure">` + `<figcaption>`（取围栏 info string 或自动编号），让已存在的 CSS/组件真正生效（二选一，另一个删）。
- **根因**：RC-3 + RC-4。

#### U-20 【P1】/map 是"知识地图"名字下的笔记直排，交互为零；三页框架靠注释维持（F-12）
- **证据**（✅ 已复核 map.astro 注释）：map.astro:2-8 自述从"站点侧结构化页面"退化为"笔记原文渲染"换来单一真源；12.8KB 笔记把"一眼看清 15 域怎么连"埋在第三屏后；/map /timeline /interview 三页 meta-bar/TOC/相关题/页脚各不相同。
- **影响**："知识地图"承诺可交互依赖图、交付长表格；若 mermaid 客户端渲染失败（见 U-21），核心价值归零。
- **建议修法**：见提案 P-05（交互化）+ P-06（三页统一框架，P-05 的前置）。
- **根因**：RC-4。

#### U-21 【P1】mermaid 渲染是单点：失败只留红字源码；htmlLabels 在 strict 下实际无效（F-13）
- **证据**（✅ 转引审计 + 已复核配置存在性）：mermaid.ts:29-35 catch 只加一个 class；.mermaid-error 把源码当红字摊开；禁 JS 访客看到 62 段源码；`securityLevel:'strict'` + `htmlLabels:true` 组合下 htmlLabels 被忽略，而 notes 大量用 `<br/>` 换行；viz/mermaid-check.mjs 的 SLUGS 只覆盖 15 个 slug（当前无漏网，加图即漏检）。
- **建议修法**：catch 改人话提示 + 可展开源码；securityLevel 与 `<br/>` 写法二选一对齐；SLUGS 从 notes/ 动态生成；容器加 `<noscript>`。
- **根因**：RC-3。

#### U-22 【P1】"32 个 html / 已上线"本地不可复核；works 轨迹区块在 CI 构建下恒为空态（C-13）
- **证据**（✅ 已复核 .gitignore + trajectory.ts）：路由算式 7 功能页 + 8 details + 17 课程页 = 32 成立，但 dist 无 html 且未跟踪（本机构建 OOM，属环境限制）；.gitignore:13 排除 harness-demo/trajectories/ → trajectory.ts 自注 CI 上 available=false → /works 轨迹 section 永远是占位说明，而 works.astro:283 仍写"数据源：demo.jsonl（build 时静态导入）"。
- **建议修法**："32 个 html"改可复现算式表述或补 CI 产物计数；轨迹 section 二选一——提交一份脱敏 demo.jsonl 样本（`git add -f` 或白名单）让线上有真实事件流，或把 section 改名"本地运行 harness-demo 后生成"；.gitignore 补 site/dist。
- **根因**：RC-6。

### P2 — 细节体验与准确性问题

#### U-23 【P2】"11 spans/1 trace"无仓库内证据，标**未验证**（C-14）
- 宣称处 knowledge-map:150、interview-bank:86,102、index.astro:32、works.astro:53/303、details/06。otel.md 只有一行结论；span 数是运行时动态统计。**建议**：改结构性描述（span 树形态 + 收尾打印实测数），或附一次真实运行输出作证据锚点。

#### U-24 【P2】framework-demo"11/11 断言"口径实为"10 断言 + 1 总体判定"，标**未验证**（C-15）
- capabilities.ts 实含 10 条 `ok()`；handoff:162 自己写的就是"10 条 ok()（+1 整体判定=11/11）"。**建议**：文案统一为 handoff 口径。

#### U-25 【P2】FinHot 全部生产数字为仓库外证据，标**未验证**；1830 vs 1875 的 45 行口径差在转述中丢失（C-16）
- data-flywheel.md:223 诚实地标了"待核对；不自行改数"，但 courses.ts:181、agent-harness.md:414 等转述处只讲 1830。**建议**：所有转述处挂脚注"生产台账快照（#35），方向分布与总行数存在 45 行口径差待核对"——转述不能丢失限定。

#### U-26 【P2】外部时点事实（OWASP 2026 版 / MCP spec / LangGraph 1.0.x / A2A v1.0.1 / 文章论断）无联网条件，标**未验证**（C-17）
- industry-2026.md:80-84 的"已知缺口 / 待复核"是全仓最佳范式。**建议**：其余课程引用外部数字时统一挂同类脚注；这是"内容诚实度"的放大器，不是缺陷。

#### U-27 【P2】whiteboard"~150 行"实际 178 行（C-18）
- README:13、knowledge-map:136、index.astro:33/87、works.astro:111、courses.ts:137 六处。**建议**：改"~180 行"或"178 行（约 140 行代码）"。

#### U-28 【P2】durable-execution-demo"13 文件"口径含糊（C-19）
- src 9 文件 / 821 行可验证；13 是含 lock 文件的口径。**建议**：写"9 src 文件 / 821 行"，与 harness-demo 口径统一。

#### U-29 【P2】knowledge-map:8"每课题库 +2 题（共 20 题）"算不通（C-21）
- 5×2=10、12 课×2=24，均不等于 20。**建议**：删"（共 20 题）"或给出算式。

#### U-30 【P2】agent-harness §14"24min" vs 全仓其余"25 分钟"（C-22）
- index.astro:120、interview-bank:19,135、sandbox-demo 输出均 25 分钟。**建议**：统一 25 分钟。

#### U-31 【P2】notes 之间零内部链接，"Obsidian vault"名不副实；README"PNG 全渲染"不实（C-23）
- ✅ `grep '\](' notes/` 与 `[[` 均 0 命中；notes/ 无任何 PNG。**建议**：knowledge-map 命名总表加 wikilinks；站点加轻量 remark 插件把"规范名 §Sn"自动链到 /c/<slug>/（全站导航收益最大的单点）；README:25 删"PNG 全渲染"。

#### U-32 【P2】可访问性基础项缺失（F-14）
- --text-faint 亮色 2.95:1 / 暗色 4.22:1 均不达标（用在 16 处，全是小字号次要信息）；无 skip-link、无 :focus-visible、无 aria-current。**建议**：--text-faint 改 #6b7280 / #8b98a5（一次改 16 处）；补焦点样式、skip-link、aria-current。可扩展 viz 的浏览器基建跑 axe-core。

#### U-33 【P2】移动端导航是 flex-wrap，无汉堡；sticky header 吃掉首屏约五分之一（F-15）
- **建议**：≤720px 收进汉堡按钮（aria-expanded/aria-controls、Esc 关闭、焦点陷阱），浮层展开。本站流量大概率以移动端分享链接为主。

#### U-34 【P2】/works 九 section 无页内导航；长页无阅读进度、无上下篇（F-16）
- **建议**：sticky 页内标签栏（复用 .chip）；Base 加 2px 进度条；page-foot 左侧改"← 上一篇 / 下一篇 →"。

#### U-35 【P2】正文 measure 失控：长文页行长 776-1040px（F-17）
- 只有落地页守了 46em。**建议**：`.markdown p, .markdown li { max-width: 40em }`，表格/代码/图全宽；顺带给 h2/h3 补 scroll-margin-top（TOC 跳转撞 sticky header）。

#### U-36 【P2】内联 style 散落 36 处，样式规则与结构脱钩（F-18）
- 根因是 .card 默认 flex 与"当块级容器用"的用途冲突。**建议**：加 .card-block 类替代 display:block；其余提升为工具类。

#### U-37 【P2】JD 覆盖矩阵的两条 🟡 是真实短板，⚪ 是显式声明的观察级空洞（C-24）
- 框架生态（有 SDK 实操、缺 LangGraph/OpenAI Agents SDK 对照）与长期记忆（有活系统、无自研）。**建议**：框架生态补"同一白板任务跑三家 SDK"最小对照（与 multi-agent §S6 联动）；长期记忆补 interview-bank:103 已列的"记忆投毒回归测试脚本"（低成本高信号）；A2A ⚪ 维持观察。

### 正面基线（无需改动，固定下来防回归）

sandbox-demo / mcp-demo 逐字节一致**已实跑通过**（本综合采信内容审计实跑）；durable-execution-demo 821 行与断言逐条对应（静态）；面试题库 37 题精确成立；knowledge-map"15 域"算式自洽；llm-timeline 12 节点、agent-harness 15 节成立；trajectories 22 事件分布与 handoff 记录一致；courses.ts 7 个 BANK 锚点与 toc.ts slug 算法推演一致、17 个 slug 无兜底页；details/ 8 篇的"本地映射（已覆盖/未覆盖）"体例与 data-flywheel"不自行改数、标注口径差"是全仓最强内容形态。

---

## ② 更好的展示形式提案（含工作量与优先级）

> 遵循"修显示值不如修生成器"：以下提案优先指向数据源/生成器/模板，而非逐处改输出。

### P-01 【P0 · 小（半天）】统一数据源：消灭全站手抄数字
- **解决**：U-01 / U-03 / U-05 / U-11 / U-27 / U-28 / U-30 的共同根因。首页 hero、统计卡、courses.ts 的 intro/interviewAngle、works.astro 的 eval-stats 全是手写常量。
- **改法**：
  1. `courses.ts` 导出派生量：`courseCount`（排除 whiteboard）、`domainCount`（`new Set(domain).size`，且 whiteboard 改名后不再与他者撞名）、`phaseCounts` / `statusCounts`（learn.astro:11-14 已在算，抽出来共享）、`workCount = 6`（并注释定义"有 npm run demo 的目录"）。
  2. index.astro:12-13/25/165-179、interview.astro:110/115、learn.astro:27 全部改引用派生量。
  3. works.astro:93-97 的 rag 三数字改为构建期读评测产物（或从 rag.md §13 表格解析），加"数字生成时间"脚注。
  4. 计数口径冻结写进 knowledge-map 头部口径块（15 域 / 17 课程页 / 18 课程卡 / 6 作品 / 205+37 题），其余位置只引用。
- **验收**：`grep -rn 'recall@3\|85 chunks\|237' site/src README.md` 无旧值残留；改 courses.ts 一条 status，首页统计卡跟着变。
- **依赖**：无（最先做）。这是唯一能阻止"下次内容更新后数字再漂"的修法。

### P-02 【P0 · 小】暗色代码块修复（U-13）
- global.css 补三条消费 `--shiki-dark` 的规则 + 修正 :488 注释。可加 playwright 断言暗色下 pre 背景不是 rgb(255,255,255)。

### P-03 【P0 · 小】`$` 假公式修复 + 公式策略收敛（U-04）
- 内容侧改 evaluation.md 三行；管线侧关 singleDollar，只留 `$$` 与显式 `\(...\)`。这是全站公式渲染策略第一次有人做决定。

### P-04 【P1 · 小】全站搜索（pagefind）
- 27 篇笔记 / 628KB，目前唯一检索手段是 Header 7 个导航项。`@pagefind/search` 构建期索引、零服务端依赖、适配 GitHub Pages；Header 加入口 + `/` 快捷键。备考资料库形态下检索是刚需。

### P-05 【P1 · 中】知识地图交互化（U-20）
- /map 顶部新增"15 域依赖图"交互区：从 courses.ts 派生节点与边（或在 knowledge-map 的 mermaid 之外补一份 `src/data/graph.ts` 结构化边表），节点按 status 着色（复用已有三色 legend-dot），hover 显示 intro + 面试视角，click 跳 /c/<slug>/；下方保留笔记原文（单一真源不变），三个表格前加页内锚点导航。
- **注意**：strict 模式下 mermaid click 被禁，需与 U-21 的 securityLevel 决策一并做。

### P-06 【P1 · 中】三个原文渲染页统一框架（U-14 / U-20）
- 抽 `NotePageLayout.astro`（meta-bar + 面包屑 + 正文 + TOC 侧栏 + page-foot + 可选相关题），/map /timeline /interview 全部改用；llm-timeline 加入 EXCLUDED_FROM_COURSE_ROUTE 消除双入口。**P-05 的前置**（否则交互区要写三遍）。

### P-07 【P1 · 中】移动端汉堡菜单（U-33）
- ≤720px 收进汉堡，浮层展开，保留"题库"强调色；aria-expanded/controls、Esc、焦点陷阱。

### P-08 【P1 · 小】阅读进度 + 上下篇 + /works 页内导航（U-34）
- Base 加 2px 进度条（prefers-reduced-motion 时禁用平滑）；page-foot 左侧改上一篇/下一篇（顺序取 COURSES）；/works 顶部 sticky 标签栏。长文站标配，成本极低。

### P-09 【P2 · 小-中】mermaid 图题 + figure 语义 + 失败兜底 + 死代码清理（U-19 / U-21 / U-36）
- remarkMermaid 产出 `<figure class="mermaid-figure">` + figcaption（让已存在的 CSS 与 Mermaid.astro 二选一真正生效，另一个删）；catch 改人话；`<noscript>` 提示；.card-block 替代内联 display:block。**若 P-05 要做交互图，此项合并进 P-05。**

### P-10 【P2 · 小】正文 measure 收口（U-35）
- `.markdown p, .markdown li { max-width: 40em }`，表格/代码/图 `max-width: none`；h2/h3 补 scroll-margin-top。

### P-11 【P2 · 小】可访问性三件套（U-32）
- --text-faint 两色替换（一次改 16 处，值得提前）、:focus-visible、skip-link、aria-current。可扩展 viz 浏览器基建跑 axe-core 做自动化。

### P-12 【P2 · 小】课程/作品筛选标签
- /learn 加 phase + 状态过滤 chips（~30 行无依赖 JS）；/works 加"离线可跑 / 需 LLM 端点"标签——6 个 demo 中 3 个全离线零 key，这是对"想立刻跑起来"的访客最强的筛选维度。

### P-13 【P2 · 中】轨迹数据源健壮化（U-22）
- 提交一份脱敏样例轨迹（site/src/data/trajectory.sample.jsonl 或 harness-demo/trajectories/demo.example.jsonl + .gitignore 白名单），trajectory.ts 支持"样例优先、真实产物覆盖"；顺手把 mdToHtml 与主管线配置对齐（目前是两份配置，改一处漏一处）。

### P-14 【P2 · 小】渲染健壮性其余项（U-21 剩余）
- mermaid-check.mjs 的 SLUGS 改为从 notes/ 动态生成；learn.astro:71 的 aria-label 从 div 上移到有 role 的元素或改可见文字。

---

## ③ 内容是否要调整：结论与调整清单

**结论：内容本身要调整，且是本次审计中优先级最高的工作。** 站点的问题一半是"呈现层放大了一半是内容数字失效"；但内容审计显示，notes/ 作为唯一真源已经出现了**修订未划改干净**（U-02 / U-10）、**同一文件三套口径**（rag.md §13）、**对外门面整体过期**（U-01）三类会持续失信的问题。调整分四类，严格区分：

### A. 改数字（一次性运动，最高优先）
1. rag 指标统一切到 notes/rag.md:293 口径（0.31/0.44/0.50、PASS 3/8、132 chunks）：README:12、rag-demo/README:58-66/75、index.astro:42、courses.ts:63-64、works.astro:78/93-97、long-term-memory.md:211/429、knowledge-map.md:46、rag.md:283。旧值引用处加脚注指向口径说明。
2. 压缩数字统一切到实跑口径（1378→426、摘要 3 条）：harness-from-scratch.md:196、details/01-context-rot.md:26。
3. 计数类修正：whiteboard ~150→~180 行（6 处）；durable"13 文件"→"9 src / 821 行"；harness-demo"9 文件"→"10 src"（4 处 + works 表补 otel.ts）；agent-harness"24min"→25 分钟；knowledge-map:8 删"（共 20 题）"；index.astro"~237"→"205 + 37"。
4. **制度层**：在 handoff.md 增补"数字引用规范"——评测数字只认实跑输出，其余位置一律抄录不另起数；知识域/课程页/课程卡/作品/题数六个口径冻结在 knowledge-map 头部，别处只引用。

### B. 结构修正（让 P0 课与横向资产各归其位）
5. README:30 补 multi-agent.md（C-10）；learn.astro:95-97 补回多智能体编排并同步理由段，或改为从 knowledge-map 派生（C-05/C-26）。
6. courses.ts：llm-timeline phase 改 '—'（C-06）；relatedQuestions 的 text 严格取原文、编辑说明移 note 字段（C-12）；whiteboard 独立域名。
7. interview-bank §3.4-Q1 / §3.5-Q2 按"五种模式 + 5 题 FAIL 机制归因"重写，站点 interview.astro:55/57 同步（C-08/C-09）；rag.md:296 按 :295 口径重写（C-27）。
8. handoff §4.1 表格行号重排、"16 域"改 15（C-04）。
9. 待办清单合并：knowledge-map:145-151"未结事项"、interview-bank"未结清单"、handoff §四 三处高度重叠且部分已完成未勾——合并为单一清单（knowledge-map 为源，其余引用）（C-25 延伸）。

### C. 只改标注、不改数字（诚实度放大器）
10. 11 spans/1 trace → 结构性描述或附真实运行日志（C-14）；framework"11/11"→"10 断言 + 总体判定"（C-15）。
11. FinHot 数字挂"生产快照（#35）、45 行口径差待核对"脚注，转述不丢限定（C-16）。
12. 外部时点事实（OWASP / MCP spec / LangGraph / A2A）挂"未联网复核"脚注，范式照抄 industry-2026.md:80-84（C-17）。
13. "32 个 html"改可复现算式表述（C-13）。
14. README:25 删"PNG 全渲染"（notes/ 无 PNG）（C-23）。

### D. 针对备考目标的内容增删
15. **保留并放大**：details/ 的"本地映射（已覆盖/未覆盖）"体例推广到每门课的"面试映射"节；data-flywheel 的"不自行改数"范式推广到所有外部数字。
16. **应重写**：interview-bank §3.5（rag-demo 追问链）——hash embedding 是差异化王牌，但追问链还停在作废叙事上；按复测重写为"5 题 FAIL 的机制归因链"本身就是更强的面试答案。
17. **应补**：框架生态 🟡 → "同一白板任务跑三家 SDK"最小对照（与 multi-agent §S6 联动）；长期记忆 🟡 → 记忆投毒回归测试脚本（interview-bank:103 已列，低成本高信号）。
18. **可维持**：A2A ⚪ 观察级空洞对 coding agent 岗确边缘，保持现状但保留显式声明。

---

## ④ 建议行动顺序

> 原则：先止血（P0 数字/公式）→ 再建制度（单一数据源）→ 再修结构（模板统一）→ 最后做体验增强。**每一波结束都应能在 CI 复跑验证**（注意：本机 astro build 在 vite 客户端阶段必然 OOM——这是 2 核 3.4GB 机器的环境限制，CI Runner 内存充裕不受影响；验证请走 GitHub Actions，勿用本机 dist 做判断，且注意 astro build 会先清空 outDir）。

**Wave 0 · 止血（可全部并行，无依赖）**
- U-01（rag 数字统改）｜U-02（压缩数字划改）｜U-03（作品计数冻结为 6）｜U-04（$ 假公式三行 + 关 singleDollar）
- 同步：knowledge-map 头部写入口径块（15 域/17 页/18 卡/6 作品/205+37 题）——这是后续所有波的参照点。

**Wave 1 · 建制度（依赖 Wave 0 的口径块）**
- P-01 单一数据源改造（派生量 + 首页/访谈页/works 接线）——**必须在 Wave 0 之后**，否则会把错数字固化进生成器。
- Wave 0 的计数类修正（U-11/U-27/U-28/U-30）可并入此波收尾。

**Wave 2 · 展示层缺陷修复（与 Wave 1 可并行，互不接触文件区域）**
- P-02 暗色代码块｜P-03 已在 Wave 0 完成其内容侧｜U-13/U-15/U-16/U-17（双 chip、top3 双渲染、Header 高亮）｜U-18（BANK 锚点改构建期解析）。

**Wave 3 · 结构统一（P-06 是 P-05 前置）**
- P-06 三页统一框架 + llm-timeline 消双入口 + /interview 补 TOC → 然后 P-05 知识地图交互化 → P-09 mermaid 图题/兜底（若做交互图则与 P-05 合并）。

**Wave 4 · 体验与健壮性（可并行）**
- P-04 搜索｜P-07 汉堡｜P-08 进度/上下篇/works 导航｜P-10 measure｜P-11 a11y｜P-12 筛选｜P-13 轨迹样例 + 配置对齐｜P-14 收尾。

**Wave 5 · 内容增补（长期，独立于以上）**
- interview-bank §3.5 重写｜三家 SDK 对照 demo｜记忆投毒回归脚本｜待办清单合并。

**依赖关系速查**：Wave 1 ⟵ Wave 0；P-05 ⟵ P-06；P-09 可并入 P-05；其余波次互相独立可并行。

---

## 附：本综合的复核命令（可重跑）

```bash
cd rag-demo && npx tsx src/evaluate.ts        # recall@3=0.31/@5=0.44/@10=0.50, PASS 3/8, 132 chunks, Q8 cosine#11/bm25#13
cd harness-demo && npx tsx src/test-compact.ts # 1378→426, 摘要 3 条 ✅
ls harness-demo/src/*.ts | wc -l              # 10
grep -c 'var(--text-faint)' site/src/styles/global.css   # 16
grep -rn 'import Mermaid' site/src/           # 空（死代码）
grep -n 'trajector' .gitignore                # harness-demo/trajectories/ 被排除
```

*报告完。所有"已验证事实"均可按上述命令与 文件:行 复核；所有"未验证"项已在正文显式标注，不做断言。*
