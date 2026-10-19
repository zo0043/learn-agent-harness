# 综合裁决报告（synthesis / t8）

- 分析者：synthesizer｜时间：2026-10-16（系统时钟 UTC；`date -u` 同日 `07-verification.md` 记录为 `Fri Oct 16 10:04:25 UTC 2026`）
- 输入：`analysis/content/00-corpus-scope.md`（语料范围）、`01-pedagogy.md`（14 findings）、`02-accuracy.md`（11）、
  `03-evidence.md`（10）、`04-consistency.md`（12）、`05-coverage.md`（13）、`06-readability.md`（16）、
  `07-verification.md`（31 条对抗验证账本）。
- **本报告的取证准则（逐字遵守任务硬规则）**：
  1. 只有 `07-verification.md` 判为 **confirmed / confirmed+fix** 的结论才作为「既成事实」写入第 ③ 节；
  2. **falsified 的三条**（`accuracy-F1`、`accuracy-F3`、`evidence-F2`）**不作为本轮内容结论出现**，只在第 ⑤ 节
     「已被证伪、不得据此行动」清单里显式标注并给出裁决依据；
  3. 未复核的 medium/low 条目**不当作事实复述**；若某条根因需要它支撑，我在本机重跑了最小判据（见下）
     并只写我亲自读到/跑到的部分；
  4. 未定位、未验证的一律进第 ⑤ 节，不冒充结论。

- **我本轮亲自复算的最小判据（全部只读，跑前跑后 `git status --porcelain` 逐字一致）**：
  ```bash
  ls notes/*.md | wc -l                                  # → 19
  ls notes/process/*.md | wc -l                          # → 20
  grep -c "^    stage: '" site/src/data/course-structure.ts   # → 17
  sed -n '50,68p' notes/knowledge-map.md                 # 课程总表优先级列 14 行（与 stage 逐门比对）
  grep -n "^- 未覆盖" notes/details/*.md                 # → 8 行（:27）
  grep -n "^## 行业一手源" notes/details/*.md            # → 8 行（:20）
  sed -n '141,153p' notes/knowledge-map.md | cat -n      # 资产映射表恰 8 行数据
  sed -n '100,128p' notes/knowledge-map.md               # 依赖图 24 条边 + :128 建议开课顺序
  sed -n '176,206p' site/src/pages/learn.astro           # :177「线性阅读序 #1→#17」+ :199/:204「17 个 demo」
  sed -n '260,290p' site/src/pages/learn.astro           # :282「不挂在任一阶段上」（与同页 P0 段渲染 llm-timeline 并存）
  grep -c "date: '" site/src/data/llm-history.ts         # → 10；末节点 :188 2025-01 DeepSeek-R1
  sed -n '9p;14p' README.md                              # 「6 个可运行 demo（npm run demo 一键复现）」vs rag-demo 行 = demo:eval
  for d in */; do grep -q '"demo":' "$d/package.json" 2>/dev/null && echo "$d"; done   # → 10 个目录有精确 demo 键
  grep -rn "11 spans\|11 span" site/src/pages/works.astro   # → :133（「实测 11 spans / 1 trace」）与 :393
  grep -n "spanTotal" harness-demo/src/otel-mock-scenario.ts # → :50 spanTotal: 15
  grep -c "check(" site/tools/check-counters.mjs        # → 13（含定义 1 次；判据 12 条，与 t7 实跑一致）
  grep -n "-eq 33\|-ge 32" .github/workflows/verify.yml  # → :105 test "$count" -eq 33
  grep -n "15 域\|十六个" handoff.md                      # → :191「15 域」 vs :199「十六个知识域」
  ```

---

## ① 一句话总体判断

**这套课程的内容本身质量很高（正文不重复、判据多数可复跑、抽查未发现造假），但它没有「单一真源」：同一个事实——一门课属于哪个阶段、先学什么、有几件作品、有几页站点、某个词在哪儿定义——平均存在 2–4 份互相矛盾的手工副本，其中只有极少数副本被门禁覆盖；结果是读者（考生 + 下一个接手者）几乎每一处「我该先学什么 / 这算完成了吗 / 这个数字可信吗」的判断都会拿到两个不同答案。**

支撑（均为本轮已核实事实，不是感觉）：依赖图 vs `prereqs` 8/15 不一致；`P0–P2` 与 `P0–P4` 两套同形标签 9 门冲突；同一文件内 15 域 / 16 域并存；同页「6 个 demo」与「17 个 demo」并存；8 页细节页里至少 3–4 页「未覆盖」与同页「行业一手源」冲突；`llm-timeline` 有四种互斥定位；站点时间线自称「权威事实列表」却停在 2025-01。

---

## ② 内容层面 Top 10 优先问题

> 去重规则：一个根因只出现一条；「命中视角」列出被哪几个视角独立命中（跨视角同根因的合并）。
> 「建议方向」全部只写方向，不实施。

---

### P1｜档位体系三套并存：9 门课档位冲突 + 2 门横向课身份冲突 + `llm-timeline` 四种互斥定位

- **根因**：`P0/P1/P2` 这一组字形被两个语义完全不同的字段复用（课程总表的「优先级」列 vs `course-structure.ts` 的 `stage`），而没有任何一处声明二者关系；横向课（`llm-timeline` / `industry-2026`）又被三份文档分别描述成「首课 / 在 P0 之前 / 不挂阶段 / 不计入门数」。
- **file:line 证据**：
  - `notes/knowledge-map.md:50-68`（优先级列）vs `site/src/data/course-structure.ts:85/101/118/134/150/168/185/202/219/238/255/272/291/308/325/344/361`（stage）
    逐门冲突（我本轮自读两处原文，列出 9 门中我逐条落到行号的 8 门）：`sandbox` P0→P1、`evaluation` P0→P1、`multi-agent` P0→P1、`durable-execution` P1→P2、`api-engineering` P1→P2、`data-flywheel` P1→P3、`long-term-memory` P2→P3、`model-basics` P2→P3；第 9 门为 `observability`（档位本身 P2=P2，但 `knowledge-map.md:60` 的该行需与其余 13 行一并按同一列语义改写，t1/t7 按「逐门比对不一致」计数）。
  - `site/src/data/courses.ts:298` 自述旧三档 `phase` 已 legacy，但 `courses.ts` 与 `knowledge-map` 两处仍按旧档呈现。
  - `llm-timeline`：`course-structure.ts:85` `stage:'P0'` + 数组首位；`notes/model-basics.md:14` 与 `site/src/pages/nav.astro:21`「位于 P0 之前」；`site/src/pages/learn.astro:282`「不挂在任一阶段上」（同页 P0 段正渲染它）；`notes/knowledge-map.md:12`「不计入门数」而 `:13` 的 17 含它。
- **影响**：读者按 `P0` 判断「先学什么」时，`沙箱与凭据 P0` 与课程卡 `P1` 并列出现——要么以为过期，要么按 P0 跳到第 6 门之后；`model-basics` 的唯一前置指向 `llm-timeline`，读者照「在 P0 之前」去找一门在 `/learn/` P0 段第一张卡上的课。
- **建议方向**：二选一并全仓对齐——(a) `knowledge-map.md` 的「优先级」列改名为「岗位权重（非阶段、非阅读序）」并显式指向 `/learn/` 的五档；(b) 横向两课移出阶段链、在 `/learn/` 单列「横向知识」段。(a)+(b) 可同时做；随后把「档位唯一真源 = `course-structure.ts`」写进口径块。
- **命中视角**：教学法（pedagogy-F3、F4、F14）＋ 跨篇一致性（consistency-F4）＋ 内容完整性（coverage-F8）＝ **3 个视角**。

---

### P2｜依赖与顺序有两套图 + 一处方向相反的前置声明

- **根因**：手写 mermaid 依赖图与 `course-structure.ts` 的 `prereqs` 各自维护、无人校验；反向依赖（「复用某课的理论底座」）与 `prereqs` 不是同一个字段，写在同一仓库里就成了互相打脸的两句话。
- **file:line 证据**：
  - 两图不一致 **8/15 门**（`07-verification.md` 否定 t1 的 9/15：多出的第 9 行是脚本假阳性，`harness-from-scratch` 两侧皆空）：
    2 条冲突边 —— `notes/knowledge-map.md:109` `HARNESS --> MCP` vs `course-structure.ts:189` `mcp: prereqs ['sandbox']`；
    `knowledge-map.md:111` `EVAL --> MULTIAGENT` vs `course-structure.ts:223` `multi-agent: prereqs ['system-design','harness-from-scratch']`；
    6 门在图中无入边 —— agent-harness / rag / observability / long-term-memory / model-basics / framework-ecosystem。
  - 反向依赖：`course-structure.ts:334` 写 `model-basics` 的产物被 `api-engineering`「复用成本理论底座」，而 `:259` `api-engineering: prereqs ['harness-from-scratch']`（不含 model-basics）；`notes/model-basics.md:129` 节标题自称「API 与多模型路由的理论底座」，`notes/api-engineering.md:210` 又把它标成「最后手段」级的下游来源。
  - 正面（不要误伤）：`prereqs` 拓扑 17/17 合法、无环（t1 §1.1，已在 t7 覆盖范围内复核）。
- **影响**：`site/src/pages/learn.astro:188` 明确把读者「完整依赖图见知识地图 →」引到那张图上；读者按图与按课程卡会得到相反的前置答案；`api-engineering` 读者在第 11 门读到成本工程时会怀疑自己漏了第 15 门。
- **建议方向**：让依赖图从 `course-structure.ts` 的 `prereqs` 派生（`/map` 已声明「知识地图 = notes 原文渲染、单一真源」，故须把图本身变成可校验产物），或在图中显式声明「本图为优先级示意，权威前置以课程卡为准」；`prereqs` 若确实要表达「复用」关系，就为它增加一个独立字段，不要写在 `practicalOutput` 里。
- **命中视角**：教学法（F1、F11）＝ **1 个视角命中 2 条**（同根因，合并计一次）。

---

### P3｜「建议开课顺序」有三份互斥版本，同一份文档内还自相矛盾

- **根因**：序列/顺序散落在知识地图正文、知识地图的「未结事项」清单、站点 `/learn/` 页三处，无一处声明权威。
- **file:line 证据**：
  - `notes/knowledge-map.md:128`：「系统设计 → **多智能体编排（第 2 位）** → 沙箱与凭据 → 评测工程化 → durable execution → MCP → API → 数据飞轮」；
  - `notes/knowledge-map.md:162`（未结事项「开课顺序确认」行）：同一件事**没有多智能体编排**；
  - `site/src/pages/learn.astro:177`：「线性阅读序 #1→#17（COURSE_STRUCTURE 数组序，与 course-structure.ts 单一真源）」，多智能体编排第 9、系统设计第 5。
- **影响**：`/map` 与 `/learn/` 是考生排计划时最先打开的两个页面；最大位次差 7（多智能体编排 2 vs 9），对「时间有限、按岗备考」的读者直接决定先学什么。
- **建议方向**：以 `course-structure.ts` 数组序为唯一「阅读序」；`knowledge-map.md:128/:162` 改为「按目标岗位权重的选修优先级（不构成阅读顺序）」并去掉箭头链，或反向统一为只引用一处。
- **命中视角**：教学法（F2）。

---

### P4｜「覆盖率底账」不可信：`details/` 8 页的「未覆盖」与同页「行业一手源」直接冲突

- **根因**：8 页细节页的固定结构里，「行业一手源」（:20）与「本地映射 / 已覆盖·未覆盖」（:24-27）分两处手工维护，同一页内部不互相校验；`未覆盖` 一行有时被写成了「本地还缺什么」之外的意思。
- **file:line 证据**（我本轮逐页读原文）：
  - `notes/details/04-token-economics.md:22` 行业一手源写着「+90.2% / 80% 方差 / 约 15 倍 token」，`:27` 未覆盖写着「**没有** 4x/15x 行业对比数字与『80% 方差』数据」——同页直接矛盾；
  - `notes/details/08-single-threaded-write.md:22` 写着「Devin Review 每 PR 抓 2 个 bug、58% 严重级」，`:27` 未覆盖写着「**没有** Devin Review 的行业数字（2 个 bug/PR、58% 严重级）」——同页直接矛盾；
  - `notes/details/06-observability-loop.md:27` 该行**自身**先把「OTel 埋点已落地（`demo:otel:mock` 离线 mock 实测 15 spans/1 trace）」写成现状，紧接着又说「没有『逐步观察 agent』的控制台产物」——该行语义自相矛盾；
  - `notes/details/01-context-rot.md:22` 的 `n²` 出现在**行业一手源**里，`:27` 未覆盖说的是「本地把『最小高信号』转成可执行检查清单」——**这一条不矛盾**（t1 原来的 3/8 含此项，我本轮读原文后不采用它对 01 的指控）。
  - 这些数字在课程正文里被当已覆盖内容使用：`notes/industry-2026.md:20`（t7 confirmed+fix：**是 :20，不是 :19**）、`notes/multi-agent.md:55/124/179`、`notes/system-design.md:27`。
- **影响**：8 页的用途是「资深分水岭自评」，读者拿每页末尾的「未覆盖」做缺口盘点；错误方向统一为「把已有的当没有」→ 读者去补已掌握的内容，并把自评建在错误底账上。
- **建议方向**：逐页复核 8 条「未覆盖」，只保留真正缺的（我本轮读到的真缺口例如 `08:27` 的「决策一致性理论框架」「缺写线程归因视角」）；把「未覆盖」改名为「本课未展开的部分」并要求每条锚回一个具体 `file:line`，使其可被机器校验。
- **命中视角**：教学法（F5，去重后取**3/8**→按我实读修正为 **04/08/06 三页直接矛盾 + 01 不矛盾**）。

---

### P5｜核心承诺「题库」不可自检：205 题里只有 21 题带答案（≈10%），而判据层的唯一带答案样本自己的标题也是错的

- **根因**：练习题库的表结构被固化为 `| # | 题目 | 考察 |` 三列（无答案、无 rubric），而教学风格指南只要求「考察」列——**指南本身不强制可自检**，于是 13 张表全都长成这样；唯一带答案的两处（`rag`、`model-basics` S7）是例外而非规范。
- **file:line 证据**：
  - 13 张题库表（`notes/api-engineering.md:305`、`data-flywheel.md:383`、`durable-execution.md:413`、`evaluation.md:475`、`framework-ecosystem.md:397`、`harness-from-scratch.md:222`、`long-term-memory.md:463`、`mcp.md:538`、`model-basics.md:358`、`multi-agent.md:419`、`observability.md:325`、`sandbox.md:502`、`system-design.md:382`）＋ `notes/agent-harness.md:380`；
  - 表头实测全部为 `| # | 题目 | 考察 |`（t1 机器提取 13 张）；`## 练习题库` 节内题量合计 **176**；
  - 带答案侧：`notes/rag.md:317-339`（5 题，可自检正例）＋ `notes/model-basics.md:222-258`（16 题）＝ **21/205 ≈ 10%**；
  - 而 `notes/model-basics.md:222` 标题自称「16 题 × **3-5 行**标准答案」，实测 16 题各 **1 行**（83–173 字符，t1 实测、t7 抽查口径一致）。
- **影响**：目标读者是「备考」——最需要的闭环是「我答得够不够好」。现在的结构只支持「我做完了」，不支持「我做对了」；`notes/knowledge-map.md:17` 用 205 这个数字对外宣称题库规模，但能自检的只有 21 题。这是本轮**对「学习闭环」影响最直接**的一条。
- **建议方向**：给每道题至少补一条「合格线」（照 `notes/rag.md:317-339` 的粒度：能讲清为什么即通过）；优先级按考试频率（`sandbox` 16 题、`mcp` 14 题先做）；把「考察」列升级为可点击的节锚点；同时把「每题必须有可自检合格线」写进 `notes/process/teaching-style-guide.md`（现 :17 只要求「考察」列）。
- **命中视角**：教学法（F7）＋ 可读性（间接：F9/F14 的「答到哪一层算过关」）＝ 1.5 视角，计 **教学法为主**。

---

### P6｜认知负荷峰值集中且无中途自检点：`mcp.md` S4 单节 24 个具名条目

- **根因**：把两个外部标准的完整清单（OWASP LLM Top 10 + Agentic Top 10）与 4 类攻击面压进同一节，而自检点集中在该课文末题库（距 S4 开头 387 行）。
- **file:line 证据**：`notes/mcp.md:151-318`（S4，含 :157/:200/:221/:240 四个子节）= 168 行 / 9093 字符 = 该课 31363 字符的 **29%**；具名条目 4（:163-166）＋ 10（:206-215）＋ 10（:227-236）= **24 个**；区间内自检点 0（唯一命中 :185 是「对应练习第 2 题」的引用）；题库在 `:538`。
- **影响**：24 个条目按**外部标准**命名、无推导可依，读者「读完了但没记住」无法被及时发现；本节又是「面试必须报当前版清单」的关。
- **建议方向**：拆成「S4 攻击机制 + S4' 双清单对照」两节；在 S4.1/S4.2/S4.3 末尾各放 2-3 题自检，**就地引用** `:538` 题库里的对应题号，而不是集中到文末。
- **命中视角**：教学法（F6）。

---

### P7｜初学者入口的「术语先定义」整体缺失：全仓无术语表，缩写首现与定义处跨课跨百行

- **根因**：没有任何一处承担「术语 → 中文释义 → 首次定义位置」的全局职责；每篇各自首次使用英文缩写，多数不展开。
- **file:line 证据**（t7 confirmed；SSE 一行按裁决修正）：
  - **SSE**：阅读序最早出现在 `notes/harness-from-scratch.md:15/:17`（order=1）；定义在 `notes/harness-from-scratch.md:83`。**t6 原写的「首现 = `agent-harness.md:430`」已被 t7 证伪**（那是路径字母序第一）；引用时必须用修正后的行号。
  - `checkpoint` 首现 `notes/agent-harness.md:166` 无定义，`:102` 只有中文「检查点」无映射；
  - `BM25` / `RRF` 首现 `notes/interview-bank.md:59` / `:105` 无定义，定义在 `notes/rag.md:117` / `:121`；
  - `HITL` 首现 `notes/framework-ecosystem.md:119` 无定义，同文 `:147` 才展开；`OTel` 首现 `agent-harness.md:472` 无定义，`observability.md:14` 才用；
  - 站点层两个 blocker：`site/src/pages/index.astro:48` 与 `:51-55`（首屏 6 个未定义概念）、`index.astro:156-157/164-165/185-186` ＋ `site/src/pages/404.astro:42`（一屏 **11 个**未展开专名，全页无释义）；
  - 密度：`notes/model-basics.md:26-31` 单行最多 9 个拉丁词，`RLHF/DPO/RLVR` 释义在 `:183`（间隔 154 行）；`notes/harness-from-scratch.md:17` 一次抛出 10 个未定义节名。
- **影响**：面向「有后端经验、无 agent 经验」的设定读者，第一节就要求接受一批未定义词；站点首屏是他们与整套课程首次接触的位置。
- **建议方向**：在 `notes/knowledge-map.md` 或站点口径区增设**术语表**；每篇首次使用英文缩写处补「缩写（中文全称）」；中英双形（checkpoint/检查点、idempotency/幂等、compaction/压缩）至少一处写「=」；站点卡片正文只留「做什么 + 可复现判据」，专名下沉到 `/works/` 详情页。
- **命中视角**：可读性（F2、F3、F4、F5、F6）＋ 教学法（F8 的「P0 唯二 ✅ 两门缺预备知识段」）＝ **2 个视角**。

---

### P8｜自称「权威事实列表」的站点时间线落后 21 个月，且重灾区是「必须标版本/时点」的入口层

- **根因**：口径块负责「数字唯一真源」，但**时点类事实**（模型名、SDK 版本、模型世代时间线）没有任何一处承担时效责任；笔记侧改了，入口层没回填。
- **file:line 证据**：
  - `site/src/data/llm-history.ts:24` 自称「权威事实列表，10 节点」，末节点 `:188-200` 为 `2025-01 DeepSeek-R1`；同仓 `notes/llm-timeline.md:27-29` 已有 2025.09 / 2026.04 / 2026.07；t7 用 `web_fetch https://platform.claude.com/docs/en/about-claude/models/overview`（HTTP 200）独立证实现行 lineup 已到 Fable 5.1 / Opus 5.5 / Sonnet 5.5 / Haiku 5.5；
  - 同源「节点数」两套口径：`llm-history.ts:24` **10 节点** vs `notes/llm-timeline.md:14/:31` **12 节点**；
  - `harness-demo/src/llm.ts:24` 默认值仍是 `qwen3.8-flash`，而 `.env.example:4` 与 `README.md:30` 指示写 `qwen3.8-flash-next`，`handoff.md:188` 明文记录 `qwen3.8-flash` 已下架、`-next` 才支持 tools+SSE；同构的 `rag-demo/src/llm.ts:26` 已更新为 `-next`；
  - `framework-demo/README.md:167` 与根 `README.md`（作品表 framework-demo 行）把「LangGraph 1.4.21」当现行版本，而台账称六处已同步 1.5.0、实测仍有三处未同步。
- **影响**：站点 `/nav` 是「以史判断当前代际」的唯一入口；读者会拿 2025-01 的末节点推当前模型格局；`harness-demo` 的默认值意味着读者 clone 后按默认跑会撞上与记录一致的失败（**运行时 404 未验证**，见第 ⑤ 节）。
- **建议方向**：把 llm-history 补到与 `notes/llm-timeline.md` 同代际（或把「权威事实列表」改为「2025-01 快照 + 时点」）；模型名/SDK 版本四处同步并统一加时点限定语；把这四个时点数字纳入 `site/tools/check-counters.mjs` 的判据集（现在门禁只覆盖站点/计数类口径）。
- **命中视角**：技术准确性（accuracy-F5、F6、F4、F8）＋ 跨篇一致性（consistency-F9）＝ **2 个视角**。

---

### P9｜「本机构建成功」的证据链断裂：被判定的判据与仓库引用的证据不是同一个口径

- **根因**：门槛判据在原地升级（`-ge 31/32` → `-eq 33`），但引用它的活文档/作品页没有回填对应的新证据；同时「口径块说的 33/484.44s」只有转引、没有原始日志。
- **file:line 证据**：
  - `.github/workflows/verify.yml:105` 现为 `test "$count" -eq 33`；t7 逐 sha 复核 4 个被引 run 的 workflow：`887988724 → -ge 31`、`977a61f0c → -ge 31`、`e37f0aebe → -ge 32`、`0f0ca1984(HEAD) → -eq 33`；验证当前口径的绿 run `38554963320` **全仓零引用**（`grep -rn 38554963320` → exit 1）；
  - 三处活文档引用「33 page(s) built in 484.44s」，整机无对应构建日志（t7 复核：命中该项的全是转录/备份）；
  - 本机当前 `site/dist` = 89 文件 / **0 HTML**，mtime 与 `/tmp/build-retry.log` 秒级吻合（被杀的构建残骸）。
  - **不得引用的措辞**：t3 原写的「现存成功日志**一律** 34 页」已被 t7 否证（另有 32 页成功日志）；本轮只保留「引用值无原始日志 + 引用链与判定口径错位 + 当前 dist 是残骸」这三条核心。
- **影响**：下一个接手者（含会话 agent）按 `README.md` 去核「站点是否健康」时拿到的是「本机 33 页成功」与「本机 dist 0 HTML」并存；CI 侧的绿证据与仓库声明的判据代号不一致，无法据仓库内信息闭环。
- **建议方向**：把被宣告的「33 页 / 484.44s」连同其 CI run 号一起固化进仓库（artifact 或提交说明），或把口径块里的这一条改成「构建产物数以 CI 为准」并删掉本机时长数字；把「判据变了要回填引用」写进 CI 注释旁的检查清单。
- **命中视角**：证据与可复现性（evidence-F1 核心、F3、F4、F5）＋ 跨篇一致性（consistency-F6）＝ **2 个视角**。

---

### P10｜「分类口径」独立失控：6/10/11/17 四个数指同一批目录，15/16/17 指同一批课

- **根因**：口径块声明「全仓唯一参照」，但它只覆盖了被 `check-counters.mjs` 收录的 12 条判据；**站点文案与根 README 里手写的数字副本不在门禁内**，而「作品/demo/知识点」三个词在不同位置指不同集合。
- **file:line 证据**：
  - `README.md:9`「**6 个可运行 demo（`npm run demo` 一键复现）**」——同文件 `:14` 的 rag-demo 行自己写的是 `npm run demo:eval`；实测有精确 `demo` 键的目录 = **10**（`courses.ts:289-296` 与 `works.astro:411` 都已就地更正为 10，并明文否掉这句措辞）；
  - `site/src/pages/learn.astro:199`/`:204` 与 `index.astro:112` 写「**17 个 demo**」，与冻结口径「6 具名作品」（`courses.ts:298` `WORK_COUNT = 6`、`works.astro:408`）冲突，且不在 `check-counters.mjs` 判据内；
  - 知识域：`handoff.md:191`「15 域」为冻结口径，同文件 `:14` 与 `:199` 写「16 域 / 十六个知识域」，`README.md:38` 写 15 域；
  - `notes/knowledge-map.md:141-152` 的「资产 ↔ 课程映射」只有 **8 行**（我本轮 `sed | cat -n` 实测 8 行数据），漏登 `mcp-demo` / `framework-demo`，新增的 `api-demo` / `flywheel-demo` / `model-basics-demo` / `my-agent` / `final-project` 命中 0。
- **影响**：站点是外部读者唯一入口，「17 个 demo」会让人以为有 17 个可运行作品；映射表是「某能力有没有实操证据」的唯一索引，漏登使 §1 能力矩阵、`interview-bank.md:87-97` 与本表三方不一致。
- **建议方向**：所有 demo/作品计数改为派生（`WORK_COUNT` / 目录扫描），不手写；把映射表改为由 `package.json`/目录派生并入 `check-counters.mjs`；`handoff.md:199` 的「十六个知识域」就地划改为 15 或明确其含义。
- **命中视角**：跨篇一致性（consistency-F2、F3、F5）＋ 内容完整性（coverage-F4、F7）＋ 证据（evidence-F9/F10 计数类）＝ **3 个视角**。

---

### 备列（未进 Top 10，但已 confirmed，建议与 Top 10 同轮处理）

| 条目 | file:line | 命中的 finding |
|---|---|---|
| `works.astro` 仍把「**实测** 11 spans / 1 trace」当现状，与仓内断言契约 15 冲突 | `site/src/pages/works.astro:133`、`:393` vs `harness-demo/src/otel-mock-scenario.ts:50` `spanTotal: 15`（`:354-355` 明写 11 是未验证的历史活端点值） | consistency-F1（high，t7 confirmed） |
| `/works/` 之外的三页（`/works/`、`/interview/`、`/map/`）文案未通读 | — | readability 未验证项（第 ⑤ 节）：`works.astro` 本身即含上面这条，说明该页仍有未核文案 |
| JD 三处能力缺口（仓库级编码闭环 / Agent Debugging 工具链 / 在线评测面）无课无实操 | `notes/interview-bank.md:95`（❌ 标 🟢）；`jd-research/tencent_agent.json:1`、`:2`；`notes/evaluation.md:453` 把在线 A/B 写成反模式 | coverage-F1、F2、F3（high，t7 confirmed，附带计数修正：`wc -l` 实为 7、`A/B` 实为 6） |
| capstone 主线 121 个 TS 文件 + `final-project` 在 `README.md`/`handoff.md` 零提及，`git tag m0..m4` 实测 0 个 | `README.md` 全文、`handoff.md` 全文、`notes/process/capstone-m4-exercise.md:113` | coverage-F5（high，t7 confirmed） |
| 标 ✅ 的 `harness-from-scratch` 是全 15 域最小正文 | `notes/knowledge-map.md:55` vs `notes/harness-from-scratch.md`（13,393 B；中位数 39,806 B 的 33.6%） | coverage-F6（high，t7 confirmed） |

---

## ③ 六视角要点（每视角 ≤5 条，只留 confirmed / 我本轮亲自复核的）

> 判定来源标注：`[C]` = t7 判 confirmed；`[C+F]` = confirmed 但数字/行号须用修正值；`[自核]` = 我在本轮亲手读/跑到的原文与命令。

### 3.1 教学法与认知负荷（t1，14 findings）

1. `[C+F]` **两套依赖图冲突**，真值 **8/15**（不是 9/15）：2 条冲突边 + 6 门缺入边；`prereqs` 拓扑 17/17 合法无环。
2. `[C]` **三份互斥开课顺序**（`knowledge-map.md:128` / `:162` / `learn.astro:177`），最大位次差 7。
3. `[C]` **`P0–P2` 优先级列与 `P0–P4` 阶段列同形不同义**，编号课 9 门档位冲突（含 `sandbox` P0→P1、`multi-agent` P0→P1）；`llm-timeline` 四种互斥定位。
4. `[C]` **练习不可自检**：205 题中 176 题无答案/rubric，全仓仅 21 题带答案（≈10%），而风格指南只要求「考察」列。附带 `[C]` `model-basics.md:222` 标题「16 题 × 3-5 行」实测每题 1 行。
5. `[C]` **`mcp.md` S4 认知负荷峰值**：168 行 / 9093 字符（该课 29%）/ 24 个具名条目 / 本节零自检点（全课题库在 `:538`）。

（未复核、不作为事实的 medium/low：F8 指南八段骨架、F9 节号体系、F10 P0 门槛与 1378→426 判据、F11 反向依赖已在 P2 提及、F12/F13/F14。）

### 3.2 技术准确性（t2，11 findings）

1. `[C]` **`llm-history.ts:24`「权威事实列表」停在 2025-01（10 节点）**，落后站点时点 21 个月；同仓 `llm-timeline.md:27-29` 已有 2025.09/2026.04/2026.07；t7 用一手源独立证实现行 lineup = Fable 5.1 / Opus 5.5 / Sonnet 5.5 / Haiku 5.5。
2. `[C+F]` `notes/industry-2026.md` 的 90.2%/80%/15x 在 **:20**（不是 :19）——被 P4 用作「课程正文已在用这些数字」的旁证。
3. `[自核]` `README.md:9` 的「6 个可运行 demo（`npm run demo` 一键复现）」与自身 `:14`（rag-demo 入口 `demo:eval`）冲突；实测有 `demo` 键的目录 = 10。
4. `[自核]` `works.astro:133/:393` 的「实测 11 spans / 1 trace」与 `harness-demo/src/otel-mock-scenario.ts:50` 的 `spanTotal: 15` 冲突；`:354-355`、`otel-assert.ts:7`、`harness-demo/README.md:39` 都把 11 标为「未验证」。
5. **不得进入结论**：`accuracy-F1`（BM25 k1 双重口径）与 `accuracy-F3`（RRF 1/70 算错）**已被 t7 证伪**；`accuracy-F7/F10/F11` 仍未验证。

### 3.3 证据与可复现性（t3，10 findings）

1. `[C]` 可只读复跑的判据**全部成立**：rag 评测 `recall@3=0.31 / @5=0.44 / @10=0.50，PASS 3/8，132 chunks`；memory-redteam `16/16 守住`、`--ablate 15/15 敏感（逐层 18/18）`；`check-counters.mjs` 12 判据 EXIT=0（t7 独立复跑）。
2. `[C+F]` **「33 page(s) built in 484.44s」在本机无原始日志**（核心成立）；「现存成功日志一律 34 页」**不成立**（另有 32 页），措辞不可引用。
3. `[C]` 当前 `site/dist` = 89 文件 / **0 HTML**，是被杀构建残骸（mtime 与 `/tmp/build-retry.log` 秒级吻合）。
4. `[C，run 级未验证]` 4 个被引 CI run 的 workflow 断言为 `-ge 31/31/32`，HEAD 为 `-eq 33`；验证当前口径的 `38554963320` 全仓零引用（**该 run 的 run 级 success 未联网复核**）。
5. **不得进入结论**：`evidence-F2`（「OOM 无日志支持」）**已被 t7 硬反证**——`/tmp/lah-build.log:20` 是 V8 heap OOM 原文（134）、`site-build-heap.log`/`lah-build2.log`/`build-real.log` 为 137；该条及其「建议方向」一律不得使用。

### 3.4 跨篇一致性与口径（t4，12 findings）

1. `[C]` **OTel span 数**：活表述只剩 `works.astro:133/:393` 的「11 spans」，与仓内断言契约 15 冲突（11 在其所有位置都标未验证）。
2. `[C]` **`README.md:9` 措辞与实测 10 个 `demo` 目录冲突**，且复活了已被就地更正掉的说法。
3. `[C]` **同一文件内 15 域 / 16 域并存**，而该文件自己宣告 15 域为冻结口径（`handoff.md:191` vs `:14`/`:199`）。
4. `[C]` **旧三档未清干净**：`knowledge-map.md:55-68` + `courses.ts phase` vs `course-structure.ts stage`，9 处冲突（与 3.1 第 3 条同根因）。
5. `[自核]` 门禁只覆盖 `README`/`courses.ts`/`verify.yml` 三处副本；`index.astro:34-35` 手写的 `205/37` 与多处手写 17 不在门禁内；`check-counters.mjs` 判据 12 条（`grep -c "check("` → 13 含定义 1 次）。

### 3.5 内容完整性与缺口（t5，13 findings）

1. `[C]` **三个目标岗能力缺口**（仓库级编码闭环 / Agent Debugging 工具链 / 在线评测面）无课无实操，而矩阵仍标 🟢 / 课程把在线 A/B 写成反模式；grep 零命中 + JD 原文双证。
2. `[C]` **资产↔课程映射只有 8 行**（我本轮实测 8 行），漏登 `mcp-demo`/`framework-demo`，7 个新资产 0 命中。
3. `[C]` **121 文件的 capstone 主线 + 毕业项目在 `README.md`/`handoff.md` 零提及**，`git tag m0..m4` 实测 0 个，`capstone-m4-exercise.md:113` 的毕业判据未满足。
4. `[C]` **标 ✅ 的 `harness-from-scratch` 是最薄正文**（13,393 B，中位数 39,806 的 33.6%，`rag.md` 25,194）。
5. `[C]` **站点第三套 demo 计数「17 个 demo」**（`learn.astro:199/:204`、`index.astro:112`）与冻结口径 6 冲突，且无派生来源、不在门禁内。

### 3.6 初学者可读性（t6，16 findings）

1. `[C]` **两个 blocker 都在站点入口层**：`index.astro:48`+`:51-55` 首屏承诺句无一处展开；`index.astro:156-157/164-165/185-186` + `404.astro:42` 一屏 **11 个**未展开专名。
2. `[C+F]` **术语首现清单**：checkpoint→`agent-harness.md:166`、BM25→`interview-bank.md:59`、RRF→`interview-bank.md:105`、OTel→`agent-harness.md:472`、idempotency→`durable-execution.md:47`、HITL→`framework-ecosystem.md:119`；**SSE 行须用修正值**——阅读序最早在 `harness-from-scratch.md:15/:17`，定义在 `:83`（原写 `agent-harness.md:430` 已被 t7 否证）。
3. `[C]` **`model-basics.md:26-31` 首图 9 个未定义专名**，`RLHF/DPO/RLVR` 释义在 `:183`（间隔 154 行），而 `:12-16` 的「预备知识」只声明 PyTorch/attention/微调。
4. `[C]` **`agent-harness.md` 无「预备知识」且第 1-2 节只剩「回顾」**（`grep -c 预备知识` → 0；`:9 ## 已确认的地基（第 1-2 节回顾）`）——注意口径：`course-structure.ts` 的 `order` 是 0 基，写成「线性序第 3 门（order=2）」。
5. `[C]` **主线第一课开篇不可解**：`harness-from-scratch.md:17` 一次抛 10 个专名，`:25-27` 代码块 `chat(...)` 无 import、无源码指向（对照同篇 `:58` 标题自带 `（src/tools.ts）`）。

---

## ④ 内容 vs 显示形式分界清单（供下一轮直接接续）

> 以下条目**本轮已登记、未展开**；它们要么是纯呈现问题，要么内容侧结论已成立、只剩「怎么显示」待决。
> 每条给出出处文件与登记它的报告。

**A. 由本轮 confirmed 内容结论派生、只差落地形式**

1. `/learn/` 阶段段头无难度指示（`learn.astro:147` 附近）—— ped-F14 建议的「难度区间」落点属渲染层。（t1 §转交 2）
2. 练习题库「考察」列目前是纯文本 `S3+S4`，可做指向小节的锚点 —— ped-F7 的落地形式。（t1 §转交 4）
3. `mcp.md` S4 的双 10 项清单表在窄屏需折叠/分段 —— ped-F6 的呈现手段。（t1 §转交 3）
4. `learn.astro:147` 课程卡直接展示内部 `mvpSlug`（`harness-mvp`/`obs-mvp`/`memory-mvp`）而实际目录叫 `harness-demo`/`memory-redteam` —— 文案与目录名的对齐决策。（t1 §转交 1）
5. `/map` 的 mermaid 依赖图节点无难度/状态标注（图例只有 done/doing/todo/hub 四色）—— 与 P2 的「图改派生」一并做时定版式。（t1 §转交 5）
6. `courses.ts` 的 `phase` 字段若按 P1 删除，`c/[slug].astro:61` 的 chip 兜底分支形态会变 —— 课程页 meta 栏 chip 需目检。（t4 §转交 3）
7. `knowledge-map.md:85-98` 的 mermaid 节点标签（`· P0`/`· P1`/`· P2`）若改五档，图的视觉分组随之变化。（t4 §转交 4）
8. `index.astro:112`/`learn.astro:199/:204` 的「17 个 demo」措辞（内容侧已入 P10）其**渲染位置与版式**留待下一轮。（t5 §转交 1）
9. `notes/details/*.md` 8 篇的 front-matter（`title/slug/domain/source/status/kind`）在详情页的呈现方式。（t5 §转交 3）
10. `notes/knowledge-map.md` 口径块 7.7 KB 在站点是否有对应展示页（可能触发读者认知负荷）。（t5 §转交 4）

**B. 纯显示形式 / 信息层级（本轮只登记）**

11. `notes/observability.md:79`：口径声明 + 旧属性名提醒 + 复跑判据挤在一段（内容正确、层级差）。（t2 §转交 1）
12. `memory-redteam/README.md:36-40`：三个「当前状态」数字块是裸代码块，未与 `:24/:25` 判据行视觉配对。（t2 §转交 2）
13. `site/src/data/llm-history.ts` 的 `note`/`summary` 字段长度极不均匀 → `/nav` 长短卡片交错。（t2 §转交 3）
14. `rag-demo/README.md:58-66`：「复测值表 + 旧值已废说明 + §13 回指」三块叠加、表仅 3 行。（t2 §转交 4）
15. `site/dist/` 现为 89 文件 / 0 HTML 残骸 —— 影响本地预览、`visual-check`、`mermaid-check` 可用性。（t3 §转交 1，属构建/呈现环境）
16. `viz/mermaid-check.mjs:9` 硬编码绝对路径 `DIST='/home/ubuntu/app/learn-agent-harness/site/dist'` —— 可移植性。（t3 §转交 2）
17. `README.md:28` 的「本机预检 `node site/tools/visual-check.mjs --selftest`（26/26）」会写 `site/tools/out/`（`visual-check.mjs:432` 无条件 `writeFileSync`）—— 落盘与清理约定属流程/形式轮。（t3 §转交 3）
18. 404 页「3 个引导卡片」等为结构断言；卡片外观与视觉审美留浏览器目检（与 `verify.yml:10-11` 边界一致）。（t3 §转交 4）
19. `works.astro:411` 的 `⚠️` 警示混在正文段（页尾口径脚注），层级更像正文。（t4 §转交 1）
20. `site/tools/visual-check.mjs:63-73` 的页面清单**不含 `/nav/`** —— 本轮口径修正新增的页面无几何/截图回归；「是否把 `/nav/` 加进 3 视口回归」是显示形式决策。（t4 §转交 2）
21. `learn.astro:264-286`：「口径说明」与 capstone section 缩进层级错位，渲染后的视觉归属需目检。（t6 §转交 1）
22. `site/src/pages/nav.astro`：时间线/代际/课程索引三段全为长列表，初学者扫读成本高 —— 版面分组。（t6 §转交 2）
23. `notes/details/*.md` 8 篇统一 5 节结构适合「左右两栏/折叠」，当前单栏长页。（t6 §转交 3）
24. 课程文件开头 5 行 `>` 引用块（优先级/状态/前置/用法）在站点渲染下与正文同权重，初学者难分辨「元信息 vs 正文」。（t6 §转交 4）
25. `notes/*.md` 大量 mermaid 图无图号/图注（靠正文「从图里要能读出三件事」指代）—— 图注样式。（t6 §转交 5）

---

## ⑤ 本轮边界与未验证项

### 5.1 已被证伪的三条（**不得作为结论、更不得据此行动**，附裁决依据）

| # | 断言 | 出处 | 裁决依据（t7 独立反证） | 本报告处置 |
|---|---|---|---|---|
| X1 | 「`memory-redteam/README.md:126` 把 rag-demo 的 k1=1.5/b=0.75 当本套件参数引用 → k1 双重口径不一致」 | `02-accuracy.md` accuracy-F1（high） | `sed -n '118,132p' memory-redteam/README.md` 原文「`rag-demo` 用 k1=1.5/b=0.75…；**本套件参数与实现独立**」；`rag-demo/src/bm25.ts:41` 确为 `k1 = 1.5`。归属正确 | 不进结论，不进 Top 10。**留意照其建议改反而会把对句改错** |
| X2 | 「`rag-demo/src/rrf.ts:10`『第 10 名 = 1/70』算错（应为 1/69）」 | `02-accuracy.md` accuracy-F3（high） | `60+10=70`；`rrf.ts:8` 公式、注释、实现（`:33` `e.score += 1/(k+r.rank)`）三方一致；原报告自贴的输出即否证其结论（算术错） | 不进结论。（其附带观察「注释把融合分写成单表分」只在 t7 里被允许降为 low 级措辞建议，本报告不据此立项） |
| X3 | 「本机 astro build 曾 OOM（exit 134/137）在整机无任何日志支持」 | `03-evidence.md` evidence-F2（high） | `/tmp/lah-build.log:20` = `FATAL ERROR: … JavaScript heap out of memory`、`:34` `Aborted (core dumped)`；`site-build-fast2.log:EXIT=134`、`site-build-heap.log`/`build-real.log:EXIT=137`。原报告搜索范围自限于 `/tmp/astro-build*.log` + 4 个文件 | 不进结论。**该条的「建议方向」尤其不得采用**（会把有原始日志的机制结论降级为未定位） |

### 5.2 未验证 / 未覆盖（本轮**没跑**的，如实列出）

**A. 我（synthesizer）本轮未跑**
1. **未跑 `astro build`**（语料范围 §0.5 默认禁止）：因此「站点 33 页 / 484.44s」在本机未复现，只按 t3/t7 的只读结论转述。
2. **未跑任何会写工作区的 demo**：`harness-demo` 的 `npm run demo*`、`durable-execution-demo` 的 `npm run demo`、`sandbox-demo`/`mcp-demo`/`framework-demo` 的对比脚本、`my-agent` 的 `assert:m0..m4`、`final-project/grade.mjs`、`viz/mermaid-check.mjs`、`site/tools/visual-check.mjs` 全部未执行。
3. **未联网**：`web_search` 本轮不可用（t2 记录：`DeepSeek search has no API key for "DEEPSEEK_API_KEY"`）。外部事实只能引用 t2/t7 已经取到的一手源（`platform.claude.com` lineup、MCP spec 2026-07-28、Managed Agents 2026-04）。
4. **未逐行读全仓**：`notes/process/` 19 份计划文档、`handoff.md` 全文、`site/src/pages/{works,interview,map}.astro`、`site/src/components/*.astro`、各 demo README 全文——本轮只在需要给出 `file:line` 时定点读。
5. **未复核 medium/low findings**（t7 只覆盖全部 blocker/high + 抽查若干同名数字）。因此本报告 Top 10 里凡是 medium 支撑的部分（如 P7 的 `index.astro` 首屏、P8 的 SDK 版本三处），我都在文中注明登记来源；**需要它们进入实施清单前应再取一次证据**。

**B. t7 明示的 unverifiable 子项（本轮同样未验证）**
6. `38554963320` 的 **run 级 success 与 step 列表**（需 GitHub API/联网）；`README.md:28` 引的 4 个 run 只核到 sha→workflow 断言（本地可复现的那一半）。
7. **GitHub Actions 日志正文取不到**（`curl .../logs` → `403 Must have admin rights`），故 `dist HTML 文件数 = 31/32`、`21/21`/`24/24` 的实际打印只能四者交叉侧证。
8. **视觉回归 21/24/26 不是跑出来的**：t3 已声明为源码静态推演（`PAGES 8 × 3 视口 = 24`、selftest `expect()` 26 次），按本轮口径**只算「可静态复现」**。
9. **主观量不可复核**：t1 §2 与 t6 的 1–5 难度评分、t1-F14 的阶段难度均值，权重不可复现（两份报告均自述）。
10. **`/tmp` 易失性**：t3 的 F1/F2/F3 建立在「此刻仍存在」的构建日志上；引用时建议把关键行转存进仓库或 CI artifact（注意：F2 本身已被证伪，此处只适用于 F1/F3 所用的日志）。

---

## ⑥ 下一轮「显示形式分析」建议范围与输入清单

### 6.1 输入清单（下一轮直接读这些，不必重新扫全仓）

| 输入 | 用途 | 状态 |
|---|---|---|
| `analysis/content/08-synthesis.md` 第 ④ 节（25 条） | 待展开的显示形式 items，已带出处 | 本文件 |
| `analysis/content/00-corpus-scope.md` §0.5 | 边界：不跑 `astro build`、不改既有文件 | 已有 |
| `analysis/content/07-verification.md` §1/§2 | 哪些内容结论可用（防把证伪项带进形式轮的依据） | 已有 |
| `site/src/pages/learn.astro`（:113-121 分段、:147 slug、:196-290 capstone+口径） | 层级、阶段段头、口径说明归属 | 必读 |
| `site/src/pages/index.astro`（:45-61 首屏、:151-193 卡片、:221-228 details 入口） | 首屏密度、卡片信息层级 | 必读 |
| `site/src/pages/{works,nav,map,404,interview}.astro` | 本轮**未通读**，形式轮的主战场之一 | 必读 |
| `site/src/components/*.astro`（7 个）+ `site/src/layouts/Base.astro` | 卡片/导航/页脚的实际呈现单元 | 必读 |
| `site/src/styles/*` 或页面内 `<style>` | 与全局纪律 #9 一致：用「CSS 定义的类集合」vs「页面实际输出的类集合」做集合比对 | 必读 |
| `site/tools/visual-check.mjs`（:63-73 页面清单、:432 落盘） | 3 视口回归口径；`/nav/` 是否纳入 | 必读 |
| `.github/workflows/verify.yml` | 门禁现在断言什么（`-eq 33`、页面清单） | 必读 |
| `site/dist/`（当前 89 文件 / 0 HTML） | 决定要不要先修构建再谈呈现 | 只读 `find`/`stat` |

### 6.2 建议范围（按证据强度排序）

1. **站点入口层**：`index.astro` 首屏与卡片、`404.astro`、`nav.astro` —— 本轮两个 blocker 全在这里，且 `works.astro` 已确认仍有未核文案（`11 spans` 那条就是文案而非版式）。
2. **`/learn/` 的层级与口径落点**：阶段段头难度指示、课程卡 `mvpSlug`、capstone section 与「口径说明」的归属、口径块 7.7 KB 是否该上站。
3. **`/map` 的依赖图**：与内容侧 P2（图改派生）**同一处**，建议合并做，避免改两遍。
4. **课程页与 details 页的呈现**：开头 5 行 `>` 元信息块、mermaid 图注、题库「考察」列锚点、8 篇 details 的两栏/折叠。
5. **构建与预览环境**：`site/dist` 残骸、`/nav/` 是否进视觉回归、`visual-check` 的落盘约定、`mermaid-check` 的绝对路径。**先决条件**：这一组会决定第 1–4 组能否被目检。

### 6.3 建议的边界（沿用本轮，避免踩踏）

- 不改任何既有文件；只新建 `analysis/` 下的报告。
- 不跑 `astro build`（除**显式**为本轮目标并以前台短命令为限）；不跑会写 `site/tools/out/`、`trajectories/`、`.state/` 的脚本。
- 用户可见文案的**错值与错计数**仍归内容轮：形式轮遇到直接登记回本文件第 ② 节对应条目，不另起结论。
- 无法 headless 代验的视觉项，一律写「留浏览器目检」，不得用 HTTP 200 / 文件存在冒充页面正确。

---

## 附：本报告的边界合规

- 本轮只在 `analysis/content/` 下**新建** `08-synthesis.md` 一个文件；未修改任何既有文件、未修改任何他人报告（`01`–`07` 全部只读）。
- 本报告第 ② 节的所有 `file:line` 与数字，或用 `07-verification.md` 的 confirmed 结论，或来自上面「我亲自复算的最小判据」命令；
  **没有任何一条是凭「一般来说」补空**。凡引用 medium/low 支撑处，均在文中标注了登记来源视角。
