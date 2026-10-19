# 对抗验证报告（verification / t7）

- 验证者：verifier｜时间：2026-10-16 18:1x（系统时钟 UTC，`date -u` → `Fri Oct 16 10:04:25 UTC 2026`）
- 证据纪律（本报告自述，逐字遵守 `analysis/content/00-corpus-scope.md` §0.2）：
  **t1–t6 六份报告的一切结论在本报告中只当「待验证线索」，不作为证据转述。**
  账本里每一行的「我的证据」都是**我自己在本轮跑出的命令原文与关键输出**，或我自己读到的 `file:line`；
  与线索一致的写 confirmed，不一致的写 falsified 并给反证命令与反证输出。
- 覆盖声明：
  - 独立复核 **31 条** finding = t1 的 F1–F7（7 条 high）、t2 的 accuracy-F1/F3/F5（3 条 high）、
    t3 的 evidence-F1–F4（4 条 high）、t4 的 consistency-F1–F4（4 条 high）、
    t5 的 coverage-F1–F7（7 条 high）、t6 的 F1/F2（2 条 blocker）+ F3–F6（4 条 high）。
    → **六份报告的全部 blocker/high 已逐条覆盖**，另抽查若干中危条目的数字。
  - 我亲自跑过的**动态命令**（全部在只读边界内，跑完 `git status --porcelain` 与跑前逐字一致，
    仅 5 项 `??`：`analysis/`、`notes-restructure-plan.md`、`restructure-review-content.md`、
    `restructure-review-structure.md`、`restructure-verify.md`）：
    `node site/tools/check-counters.mjs`（EXIT=0）、
    `cd rag-demo && TSX_DISABLE_CACHE=1 ./node_modules/.bin/tsx src/evaluate.ts`（EXIT=0）、
    `cd memory-redteam && node test.mjs`（EXIT=0）、`node test.mjs --ablate`（EXIT=0）；
    其余为 grep / sed / python3 / node -e 复算与源码逐行阅读。
  - **我未跑**：任何 `astro build`、任何写盘点（sandbox / mcp / durable / framework / api / flywheel /
    model-basics / my-agent / final-project 的 demo），任何联网装包；`site/dist` 只做 `find`/`stat` 只读检查。
  - **我的未验证边界**见文末第 6 节。

---

## 1. 裁决账本（31 条，逐条一行）

判定用语：`confirmed`（线索成立）｜`confirmed+fix`（结论成立，但报告里的**数字/行号需就地修正**）｜
`falsified`（有反证）｜`unverifiable`（卡在环境/边界）。

### 1.1 t1 pedagogy（7 条 high）

| finding | 判定 | 我的证据（命令 + 关键输出，节选） | 理由 |
|---|---|---|---|
| pedagogy-F1 依赖图 vs prereqs | **confirmed+fix**：真值 **8/15**，报告写 9/15 | 我自己抽边（python，正则 `^\s+(\w+) (?:-->\|-\.->)\|...`）得 11 条非 INTERVIEW 边；自己解析 `course-structure.ts` 得 15 门 prereqs；逐门比对 → mismatch = **8**：mcp、multi-agent、agent-harness、rag、observability、long-term-memory、model-basics、framework-ecosystem。**逐字重跑 t1 的脚本** → 输出 `不一致课程数 = 9 / 15`，多出的第 9 行是 `harness-from-scratch \| - \| (无入边) ★不一致`（两侧都空，但脚本只给 `g` 侧加了 `\|\| '(无入边)'` 兜底，空串与 `'(无入边)'` 被判定不等） | 核心结论（两套依赖图冲突、2 条冲突边 + 6 门缺入边）成立；**9 是脚本假阳性**。报告正文自己的分解「2 门冲突边 + 6 门缺入边」= 8，与 headline 9 自相矛盾 |
| pedagogy-F2 三份互斥开课顺序 | **confirmed** | `grep -n 建议开课顺序 notes/knowledge-map.md site/src/pages/learn.astro` → km:128 与 learn.astro:176/177 命中；`sed -n '162p'` → 第二份（无多智能体）；`course-structure.ts` 数组序实测：llm-timeline(0) … system-design(4) … multi-agent(8)，1-based = 系统设计第 5、多智能体第 9 | 三处互斥、最大位次差 7 成立；行号全部对得上 |
| pedagogy-F3 P0–P4 标签二义 | **confirmed** | 我自己解析 knowledge-map「优先级」列 + course-structure `stage` 逐门比对：harness/rag/system-design/observability/mcp 一致，**9/14 冲突**（sandbox P0→P1、evaluation P0→P1、multi-agent P0→P1、durable P1→P2、api P1→P2、data-flywheel P1→P3、long-term-memory P2→P3、model-basics P2→P3、framework P2→P4），与报告表格逐行一致 | 结论与 9 门清单完全复现 |
| pedagogy-F4 llm-timeline 四种定位 | **confirmed** | `course-structure.ts:85 stage:'P0'`；`nav.astro:21`「位于 P0 之前」；`learn.astro:282`「不挂在任一阶段上」；`knowledge-map.md:12`「不计入门数」而 `:13` 的 17 含 llm-timeline（我复算 `notes/*.md` 顶层 19 − 2 = 17） | 四处互斥全部逐字命中 |
| pedagogy-F5 details 3/8「未覆盖」自相矛盾 | **confirmed+fix**（行号一处错） | `grep -n "^- 未覆盖"` 三页原文 + 同页 `## 行业一手源` 原文：01:22 有 n²、04:22 有 90.2%/80%/15x、08:22 有「Devin Review 2 个 bug、58% 严重级」——三页的「未覆盖」正是宣称没有这些。课程正文复用：`industry-2026.md:**20**`（不是报告的 :19；`:19` 是 building-effective-agents 条目，无数字）、`multi-agent.md:55/124/179`、`system-design.md:27` 全对 | 三处同文件内直接矛盾成立；**`industry-2026.md:19` 应为 `:20`** |
| pedagogy-F6 mcp S4 认知负荷 | **confirmed** | `awk 'NR>=151&&NR<=318' notes/mcp.md \| wc -l -m` → `168 9093`；`python3 -c "len(open('notes/mcp.md').read())"` → `31363`（9093/31363 = **29.0%**）；条目 4+10+10=24（:163-166 / :206-215 / :227-236）；区间内 `grep -cE '自检\|检查点\|练习\|小测'` → 0（唯一命中是 :185「对应练习第 2 题」的引用，不是自检点） | 行数、字符数、占比、条目数、无自检点全部实测成立 |
| pedagogy-F7 练习不可自检 | **confirmed** | 机器提取 13 张表头，全部为 `| # | 题目 | 考察 |`（rag 的 `## S1 五道确认题` 无表）；`## 练习题库` 节内 numbered 行合计 **176**；带答案侧：`model-basics.md:222` 标题 + 222–266 内 `^\d+\. ` = **16**，`rag.md:317-339` 有答案段 = 5 → 21/205 | 表结构、题量、答案量三项均可复算 |

### 1.2 t2 accuracy（3 条 high）

| finding | 判定 | 我的证据 | 理由 |
|---|---|---|---|
| accuracy-F1 BM25 k1「双重不一致」 | **falsified** | `sed -n '118,132p' memory-redteam/README.md` 原文：「\`rag-demo\` 用 k1=1.5/b=0.75 + 768 维 FNV-1a；**本套件参数与实现独立**（不 import rag-demo…）」；`rag-demo/src/bm25.ts:41` → `constructor(k1 = 1.5, b = 0.75)`；`notes/rag.md:286`、`notes/long-term-memory.md:488` 均把 k1=1.5 归给 **rag-demo**；本套件 `README.md:12` + `retrieval.mjs:22/:36` 的 k1=1.2 自洽 | README:126 那句话**归属正确**（rag-demo 确实 k1=1.5），并没有「把 rag-demo 参数当成本套件参数」。原报告读反了指代，finding 不成立 |
| accuracy-F3 RRF「第 10 名 = 1/70 算错」 | **falsified** | `sed -n '1,12p' rag-demo/src/rrf.ts` → 公式 `1/(k+rank)`、`k=60 → 第 1 名 = 1/61，第 10 名 = 1/70`；`node -e "console.log(1/(60+10),1/(60+9))"` → `0.014285714285714285 0.014925373134328358`；实现 `rrf.ts:33` `e.score += 1 / (k + r.rank)`；`evaluate.ts:143-152` 两表传全量排序 | **60+10 = 70**，源码注释与公式、实现三方一致。报告把 `1/(60+10)` 算成 `1/69`——它自己贴出的命令输出（1/70 = 0.014285…）就否证了它的结论。high 级 finding 建立在算术错误上 |
| accuracy-F5 /nav LLM 史停在 2025-01 | **confirmed** | `grep -c "date: '" site/src/data/llm-history.ts` → 10；末节点 `:188 date:'2025-01' / :190 name:'DeepSeek-R1'`，`:201 ];`；`llm-timeline.md:27-29` 有 2025.09 / 2026.04 / 2026.07；`date -u` → 2026-10-16。外部侧我自己取一手源 `web_fetch https://platform.claude.com/docs/en/about-claude/models/overview`（HTTP 200）→ 当前 lineup = **Claude Fable 5.1 / Opus 5.5 / Sonnet 5.5 / Haiku 5.5**（1M 上下文、knowledge cutoff Jun 2026） | 内部（10 节点、末节点 2025-01）与外部（官网当前 lineup）**双向独立证实**，报告的 21 个月落差成立 |

### 1.3 t3 evidence（4 条 high）

| finding | 判定 | 我的证据 | 理由 |
|---|---|---|---|
| evidence-F1 「33 page(s) built in 484.44s」无原始日志 | **confirmed+fix**（「一律 34」不成立） | `grep -rl "484.44" /tmp /home/ubuntu/app/learn-agent-harness` → 命中的全是转录/备份（session jsonl、`/tmp/v1/knowledge-map.md.bak`、`/tmp/t7-mirror/...`），**无构建日志**；`grep -HE "page\(s\) built" /tmp/*.log` → 本仓构建为 **34 / 34 / 34 / 32**（t2-astro-build 458.66s、t3-build 533.00s、t4-build2 873.03s、t21-astro2 514.85s），另有其它项目 130–139 页；`grep -HE "33 page" /tmp/*.log` → 空 | 核心（三处活文档引用的 484.44s/33 页在整机无原始日志、现存本仓成功日志是 32/34）成立；但「现存同类成功日志**一律**是 34 页」**被我的 grep 否证**（存在 32 页成功日志），须修正措辞 |
| evidence-F2 「本机 OOM（exit 134/137）」无日志支持 | **falsified** | `grep -H "EXIT=" /tmp/*.log` → `site-build-fast2.log:EXIT=134`、`site-build-heap.log:EXIT=137`、`build-real.log:EXIT=137`；`grep -n "heap\|Aborted"` → **/tmp/lah-build.log:20 `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`**、:34 `Aborted (core dumped)`，同文件头 `[build] directory: /tmp/lah-verify-dist/`（本仓 astro build）；`/tmp/lah-build2.log` → `Killed` + `[exit code: 137]`；`site-build-fast2.log` 头 `learn-agent-harness-site@0.1.0 build:fast` | **同机存在直接的 OOM 崩溃日志（V8 heap OOM → 134）与 Killed/137**。报告把搜索范围自限为 `/tmp/astro-build*.log` + 4 个文件，漏掉 `lah-build*.log / site-build-*.log / build-real.log`，由此得出「没有任何 134/137 记录」的反向结论——high 级 finding 被硬反证推翻 |
| evidence-F3 当前 site/dist 是残骸 | **confirmed** | `find site/dist -name '*.html' \| wc -l` → **0**；`find site/dist -type f \| wc -l` → **89**；`stat -c '%y %n' site/dist` → `2026-10-14 17:53:55.411035361`；`stat -c '%y' /tmp/build-retry.log` → `17:53:55.471`；tail 无完成行 | 0 HTML / 89 文件 / mtime 与 build-retry.log 秒级吻合，全部复现 |
| evidence-F4 被引 4 个 CI run 早于现行口径 | **confirmed**（本地半侧） | 我逐 sha 跑 `git show <sha>:.github/workflows/verify.yml`：`887988724 → -ge 31`、`977a61f0c → -ge 31`、`e37f0aebe → -ge 32`、**`0f0ca1984 (HEAD) → -eq 33`**；`Counter consistency gate` 计数 0/0/0/**1**；`grep -rn "38554963320"`（md/yml/mjs）→ **无输出（exit 1）** | 仓库侧四项全部可复现。run 级「success / step 全绿」需 GitHub API（我未联网核），标 **unverifiable**，不影响「引用链与判定口径错位 + 该 run 全仓零引用」的结论 |

### 1.4 t4 consistency（4 条 high）

| finding | 判定 | 我的证据 | 理由 |
|---|---|---|---|
| consistency-F1 works.astro 残留「11 spans 实测」 | **confirmed** | `grep -rn "11 spans\|11 span"`（排除 node_modules/.agent-teams/analysis）→ 活表述只剩 `works.astro:133`「OTel GenAI span 实测 11 spans / 1 trace」与 `:393`；`harness-demo/src/otel-mock-scenario.ts:50 spanTotal: 15` + `:57 historicalReportOnly {spans:11…}`；`otel-assert.ts:7`、`harness-demo/README.md:39` 均把 11 标未验证 | 与报告完全一致：11 的活表述仅剩站点两处，且与仓内断言契约 15 冲突 |
| consistency-F2 README:9「6 个可运行 demo（npm run demo 一键复现）」 | **confirmed** | `sed -n '9p;14p' README.md`（:9 的措辞 + :14 的 rag-demo 用 `demo:eval`）；我按 `package.json` 实测：精确 `"demo"` 键目录 = **10**（含 memory-redteam/my-agent，不含 rag-demo）；`rag-demo/package.json` scripts = `demo:retrieval / demo:bm25 / demo:rag / demo:eval` | 同页两处自相矛盾 + 实测 10 ≠ 6，成立 |
| consistency-F3 15 域 vs 16 域 | **confirmed** | `grep -n "16 域\|十六个知识域" handoff.md` → `:14`「knowledge-map 升 **16 域**」、`:199`「**十六个**知识域知识结构已建成」；同文件 `:191`「六个口径（**15 域**/17 页/18 卡/6 作品/205+37 题）…唯一参照」；`README.md:38` 15 域 | 同一文件内冻结口径与违反条并存，成立 |
| consistency-F4 旧三档残留 9/17 冲突 | **confirmed** | 我自己解析 `courses.ts phase` + `course-structure.ts stage` + `knowledge-map.md:55–68 优先级`：**9/14 编号课冲突**（清单与 t1-F3 一致），`llm-timeline`/`industry-2026` 在 courses.ts = `'—'`、在 stage = P0/P4；`courses.ts:298` 附近自述 phase 已 legacy | 逐门重算与报告的 9 处冲突清单一致 |

### 1.5 t5 coverage（7 条 high）

| finding | 判定 | 我的证据 | 理由 |
|---|---|---|---|
| coverage-F1「仓库级编码闭环」缺失 | **confirmed+fix**（一个计数错） | `grep -rn "apply_patch\|str_replace\|edit_file\|replace_in_file\|insert_text\|unified diff" --include=*.ts --include=*.py`（排除 node_modules）→ 无输出；`harness-demo/src/tools.ts` 工具名 = get_weather/list_dir/read_file/write_file/run_shell（5 个）；`whiteboard/agent_whiteboard.py` `@tool` = list_dir/read_file/write_file（3 个）；`interview-bank.md:95` 该行确为 🟢；JD `tencent_agent.json:1` 含 `Coding Agent Research Intern`/`intelligent debugging`/`code generation`/`108212`（我 python 校验 True） | 结论成立。**报告写 `grep -n "name: " tools.ts \| wc -l → 5`，实测 7**（多出 :98 `function: { name: t.name…` 与 :103 函数签名），工具数 5 正确、命令输出数是转录错 |
| coverage-F2 Agent Debugging 工具链无课无实操 | **confirmed** | 我自己跑四个检索，命中数全为 **0**：`grep -ril 单步执行 notes/`→0、`最小复现`→0、`prompt diff`→0、`调试工具`→0；JD `tencent_agent.json:2`（混元 Harness 岗）原文含「开发 Agent debugging 工具」「SBS 评…」；`tencent_terms.json:2` = `"可观测/Tracing": 57` | grep 零命中 + JD 原文双向证实 |
| coverage-F3 在线评测面被写成反模式 | **confirmed+fix**（一个计数错） | `sed -n '453p' notes/evaluation.md` 逐字为「| 10 | **用在线 A/B 做决策** | 慢、贵、有体验/伦理风险…| 离线做 go/no-go 决策，在线只做确认 |」；`grep -ril SBS notes/`→0、`regression detection`→0；JD `tencent_agent.json:2` 明确「自动化 eval pipeline、**A/B testing、regression detection**」「**SBS 评**」 | 结论成立。**报告写 `grep -rn "A/B" evaluation.md data-flywheel.md \| wc -l → 4`，实测 6**（`A/B` 亦命中 `A/B Testing` 之外的组合），属计数转录偏差 |
| coverage-F4 资产↔课程映射只有 8 行、漏登 | **confirmed** | `sed -n '141,153p' knowledge-map.md` 逐行读出恰 8 行（harness-demo/whiteboard/rag-demo/durable-execution-demo/sandbox-demo/memory-redteam/FinHot/pi）；我逐目录 `grep -c` 复算 → `harness-demo 7 whiteboard 3 rag-demo 6 durable-execution-demo 5 sandbox-demo 4 memory-redteam 6 mcp-demo 3 framework-demo 3 api-demo 0 flywheel-demo 0 model-basics-demo 0 my-agent 1 final-project 0`，与报告数字**逐个相同** | 8 行、漏登 mcp-demo/framework-demo、新资产全 0 命中，全部复现 |
| coverage-F5 capstone 主线零登记 + 毕业判据未满足 | **confirmed** | `grep -c "my-agent" README.md handoff.md` → 0/0；`grep -c "capstone\|毕业项目\|增量主线"` → 0/0；`find my-agent -name "*.ts" -not -path "*/node_modules/*" \| wc -l` → **121**；`find final-project -type f \| wc -l` → **7**；`git tag` → 仅 `refactor-complete`（无 m0–m4） | 五项全部实测命中 |
| coverage-F6 ✅ 课是最薄正文 | **confirmed** | `wc -c notes/harness-from-scratch.md` → **13393**；对 14 门编号课（排除 knowledge-map/interview-bank/llm-timeline/agent-harness/industry-2026）排序：min 13393、max 53780、**中位数 39806**、最大/最小 **4.016×**、占中位数 **33.6%**；`rag.md` = 25194 | 报告的 13,393 / 39,806 / 4.02× / 33.6% / 25,194 **逐个精确复现** |
| coverage-F7 第三套 demo 计数「17 个 demo」 | **confirmed** | `grep -rn "17 个 demo\|17 demo" site/src/` → `learn.astro:199/:204`、`index.astro:112`；`courses.ts:298 WORK_COUNT = 6`；我实测「有 demo\* 脚本目录」= **11**（含 rag-demo），「精确 demo 键」= **10**，`capstone.ts reference` 条目另计 | 三处活表述 + 6/10/11/17 四种算法，与报告一致 |

### 1.6 t6 readability（2 blocker + 4 high）

| finding | 判定 | 我的证据 | 理由 |
|---|---|---|---|
| F1（blocker）首屏承诺句密度 | **confirmed** | `sed -n '45,61p' site/src/pages/index.astro` 原文即 `hero-kicker`「coding agent 工程师 · 五阶段课程体系 · 每课带可运行参考样本」+ hero-sub「…可运行的参考样本（clone 下来就能跑，全离线零 key）」；整段未出现任何「agent / harness / 样本」的定义或外链 | 逐字复核成立；判据是「读者设定下密度过高」，属可复核的文本事实 + 明示读者设定 |
| F2（blocker）卡片/404 用未展开缩写当卖点 | **confirmed** | 逐行读 `index.astro:156-157/164-165/185-186`、`404.astro:42`：SSE / JSONL / BM25 / RRF / golden set / journal / checkpoint / SIGKILL / replay / skip / OTel 共 11 个专名；`grep -n "SSE\|BM25\|RRF\|golden set\|JSONL\|checkpoint\|SIGKILL\|OTel" index.astro` → 命中**仅**这些卡片行（156/157/164/165/185），全页无释义；404.astro 仅 :42 一处 | 11 个专名、集中位置、同页无展开，全部复核成立 |
| F3（high）术语首现清单 | **confirmed+fix**（SSE 行需修正） | 我用 python 扫 `notes/**/*.md` 全部首现：**checkpoint → agent-harness.md:166**（报告的 :102 只有中文「检查点」）、**BM25 → interview-bank.md:59**、**RRF → interview-bank.md:105**（我 `grep -o RRF` 确认该行含 RRF）、**OTel → agent-harness.md:472**、**idempotency → durable-execution.md:47**（全对）；`framework-ecosystem.md:119`「③ 权限与 HITL 钩子」/`:147`「HITL（人工审批）」全对；RLS 全仓 0 处成立。**但 SSE 行被否证**：`grep -n SSE notes/harness-from-scratch.md` → `:15`「没处理过 → ④ 节从零讲 SSE」、`:17`「④ SSE 流式」、`:19`——**harness-from-scratch 在课程序里（order=1）早于 agent-harness（order=2）**，故 `agent-harness.md:430` 不是「仓库内首次出现」，是**按路径字母序**排出来的第一名 | 8 个术语的 7 个成立；SSE 行的「首现」用路径排序冒充阅读序，须改为「agent-harness.md:430 是它所在课的首现，但全仓更早出现在 harness-from-scratch.md:15/:17」 |
| F4（high）model-basics S1.0 图内 9 个专名 | **confirmed** | `sed -n '24,32p'` 见 mermaid :29 `RLHF / DPO / RLVR / 规则护栏`；`grep -n "RLHF\|DPO\|RLVR"` → 首现 :29、释义表 :183、对比图 :189-191；我复算拉丁词数：:28=**9**、:29=**8**、:30=**5**；`sed -n '12,16p'` 的《预备知识》只声明 PyTorch/attention/微调不用会 | 首现/释义行号、词数、预备知识缺项全部实测一致 |
| F5（high）agent-harness 缺前置且 1-2 节只剩回顾 | **confirmed**（措辞需注意） | `grep -c 预备知识 notes/agent-harness.md` → 0，`grep -L '预备知识' notes/*.md` → agent-harness / harness-from-scratch / interview-bank / knowledge-map / llm-timeline / rag / system-design；`grep -n "^#\{1,3\} "` → `:9 ## 已确认的地基（第 1-2 节回顾）`、`:38 # 第三节`；`course-structure.ts:128`「已理解最小 loop 的组成…来自上一课」 | 事实成立。**注意**：站点口径 `order = 数组 index`（0 基），agent-harness = 2；写成「第 2 课」用的是 0 基，与 `/learn/` 页面「线性阅读序 #1→#17」（1 基）不同基，建议改为「线性序第 3 门（order=2）」 |
| F6（high）主线第一课开篇不可解 | **confirmed** | `sed -n '15,30p' notes/harness-from-scratch.md`：:17 依赖图一次抛 10 个专名（one-shot/loop/工具协议/SSE/权限门/会话持久化/恢复/预算压缩/轨迹/白板蒸馏）；:19 模型选择侦察在第一节之前；:25-27 代码块 `const res = await chat({...})` 无 import、无 chat 定义、无源码指向（对照同篇 :58 标题自带 `（src/tools.ts）`） | 三点逐字成立 |

**账本小结**：31 条中 `confirmed` **22** 条、`confirmed+fix` **6** 条、`falsified` **3** 条（accuracy-F1、accuracy-F3、evidence-F2）、`unverifiable` 0 条
（唯一外部项 evidence-F4 的 run 级绿已单列为子项 unverifiable，不影响其结论）。另有 4 条**数字/行号级偏差**已并入 above 的 `+fix`。

---

## 2. 被证伪清单（必须从最终结论中剔除或改写）

| # | 被证伪的断言 | 出处的 finding | 反证命令与反证输出 |
|---|---|---|---|
| X1 | 「memory-redteam README:126 把 rag-demo 的 k1=1.5/b=0.75 当本套件参数引用 → k1 双重口径不一致」 | **accuracy-F1（high）** | `sed -n '118,132p' memory-redteam/README.md` → 「\`rag-demo\` 用 k1=1.5/b=0.75 + 768 维 FNV-1a；**本套件参数与实现独立**（不 import rag-demo，避免一份算错被另一份掩盖）」；`grep -n "k1" rag-demo/src/bm25.ts` → `:41 constructor(k1 = 1.5, b = 0.75)`。归属正确，不存在「误当本套件参数」 |
| X2 | 「`rrf.ts:10`『第 10 名 = 1/70』算错，应为 1/69」 | **accuracy-F3（high）** | `sed -n '1,12p' rag-demo/src/rrf.ts`（公式 `1/(k+rank)`、k=60）；`node -e "console.log(1/(60+10),1/(60+9))"` → `0.014285714285714285 0.014925373134328358`。**60+10=70**：源码注释与公式/实现一致，原报告算术错。（其附带观察「注释把融合分写成单表分」属措辞不精确，可保留为 low 级表述建议，但**不能**以「算错」入结论） |
| X3 | 「本机 astro build 曾多次 OOM（exit 134/137）在整机无任何日志支持」 | **evidence-F2（high）** | `grep -n "FATAL ERROR\|Aborted" /tmp/lah-build.log` → `:20 FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`、`:34 Aborted (core dumped)`（同文件头 `[build] directory: /tmp/lah-verify-dist/`，即本仓 astro build）；`grep -H EXIT= /tmp/*.log` → `site-build-fast2.log:EXIT=134`、`site-build-heap.log:EXIT=137`、`build-real.log:EXIT=137`、`lah-build2.log: Killed/[exit code: 137]`。原报告只枚举 `/tmp/astro-build*.log` 与 4 个文件，属搜索范围自限导致的反向结论 |
| X4 | 「pedagogy-F1：不一致课程数 = **9**/15」 | **pedagogy-F1（high）标题数字** | 我的独立比对 = **8/15**；逐字重跑 t1 脚本得 9/15，多出的行是 `harness-from-scratch \| - \| (无入边) ★不一致`（两侧皆空，脚本只在一侧加了 `\|\|'(无入边)'`）。核心结论保留，数字改 8，并注明 2 冲突边 + 6 缺入边 |
| X5 | 「readability-F3：SSE **仓库内首次出现** = `agent-harness.md:430`」 | **readability-F3（high）表格一行** | `grep -n SSE notes/harness-from-scratch.md` → `:15`、`:17`、`:19`；课程序 harness-from-scratch(order=1) 早于 agent-harness(order=2)，故 430 只是**字母序**第一。其余 7 个术语行成立，F3 结论保留、该行改写 |
| X6 | 「evidence-F1：现存同类成功日志**一律**是 34 页」 | **evidence-F1（high）正文措辞** | `grep -HE "page\(s\) built" /tmp/*.log` → 本仓另有 `t21-astro2.log: 32 page(s) built in 514.85s`、`cold1500/1800.log`、`iso1500/1800.log` 均 32 页。核心（无 33 页原始日志）成立，**「一律 34」不成立** |
| X7 | 行号/计数级偏差（不影响方向，但照抄会错） | pedagogy-F5、coverage-F1、coverage-F3 | **pedagogy-F5**：`sed -n '19p;20p' notes/industry-2026.md` → 含 90.2%/80%/15x 的是 **:20**，`:19` 是 building-effective-agents 条目；**coverage-F1**：`grep -n 'name: ' harness-demo/src/tools.ts \| wc -l` → **7**（报告写 5；工具数 5 无误）；**coverage-F3**：`grep -rn 'A/B' notes/evaluation.md notes/data-flywheel.md \| wc -l` → **6**（报告写 4） |

---

## 3. 五类重点缺陷的判定（任务点名要抓）

| 类别 | 是否发现 | 实例 |
|---|---|---|
| ① 自设验收边界 | **发现** | **evidence-F2** 最典型：把「`/tmp/astro-build*.log` + 4 个日志」的枚举当作「整机/全部日志」的边界，得出「没有任何 134/137」的反向结论（见 X3）；**evidence-F1** 措辞「整机范围内没有任何原始日志」也超出自查范围（实际 `/tmp` 的 session jsonl / `.bak` 含该串，只是非构建日志）。t5-F6 的「14 门编号课」口径为自设但**在文内声明了**，可接受 |
| ② 数字转录失真（引文与原文不符） | **发现 5 处** | pedagogy-F1 的 9/15（X4）；pedagogy-F5 的 `industry-2026.md:19`（应为 :20）；coverage-F1 的 `wc -l → 5`（实为 7）；coverage-F3 的 `A/B → 4`（实为 6）；evidence-F1 的「一律 34」（实含 32）。另有 accuracy-F1/F3 属**读错原文**（更重，已单列证伪） |
| ③ 没跑过的当跑过 | **未发现造假，但发现 1 处「跑了却以偏概全」** | evidence-F2 声称可枚举日志、实际只枚举了一个 glob（X3）。六份报告声称的动态复跑，我在只读边界内独立复跑了其中两条主干：`rag-demo` 评测 → `recall@3 = 0.31 / @5 = 0.44 / @10 = 0.50，PASS 3/8，132 chunks，gold 锚点 16/16`（EXIT=0）；`memory-redteam` → `16/16 条探针守住`、`--ablate` `15/15 条探针对其防线敏感（逐层验证 18/18 层）`（均 EXIT=0），与其报告一致，**未发现「没跑过当跑过」的条目** |
| ④ 拿上一轮/其他成员报告结论当证据 | **基本未发现**；1 处边界情形 | `04-consistency.md:32/:46` 把 `analysis/content/02-accuracy.md` 与 `05-coverage.md` 列为「grep 命中类 / 已由他报告登记」，用于**去重声明与定位**，不是把结论当证据，且文内显式声明「不代视角下结论、不重复计 finding」——合规。其余报告未见引用 t1–t6 结论做论据 |
| ⑤ file:line 对不上 / 以偏概全 | **发现 6 处** | 即 X4–X7 的全部条目（含 SSE「首现」用字母序冒充阅读序、`industry-2026` 行号错位、两处 `wc -l` 计数错、`一律 34`、9/15）。所有被复查的 finding 的**主行号**（对象字段里的 file:line）经我逐条 `sed` 核对**均可命中原文**，问题集中在「自己附带的统计/引文行号」 |

---

## 4. 各报告可信度评级与「不得进入最终结论」条目

| 报告 | 评级 | 依据（我复核的高危条数） | **不得进入最终结论** 的条目 |
|---|---|---|---|
| `01-pedagogy.md` | **可用（需 1 处数字修正）** | 7/7 high 结论成立；F1 的「9/15」须改 8/15，F5 的 `industry-2026.md:19` 须改 :20 | 仅「9/15」这个数字与 `industry-2026.md:19` 这个行号；F1–F7 的结论本身可用 |
| `02-accuracy.md` | **需修正（2 条 high 证伪）** | 3 条 high 中 **2 条证伪**（F1/F3），1 条成立（F5，含我独立外部核实） | **accuracy-F1（BM25 k1）整条**；**accuracy-F3（RRF 1/70「算错」）的「算错」判定**（可降级为 low 的「注释措辞可更精确」）。其余 medium/low 未复核，引用前须另行取证 |
| `03-evidence.md` | **需修正（1 条 high 证伪）** | 4 条 high 中 3 条成立（F1 核心/F3/F4 本地侧），**F2 被硬反证** | **evidence-F2（OOM 无日志支持）整条及其「建议方向」**；evidence-F1 的「一律 34」措辞不可引用（核心结论可用）；evidence-F4 的「该 run success/step 全绿」为未验证子项，引用时须标注 |
| `04-consistency.md` | **可用** | 4/4 high 全部独立复现（含我重跑 `check-counters.mjs` EXIT=0 与其副本覆盖结论） | 无（F1–F4 均可进入最终结论） |
| `05-coverage.md` | **可用（需 2 处计数修正）** | 7/7 high 结论成立，其中 F4/F5/F6/F7 的数字与命令输出与我的复算**逐项相同** | 仅 F1 的 `wc -l → 5`、F3 的 `A/B → 4` 两个附带计数；JD 引文、工具集、体量结论均可用 |
| `06-readability.md` | **可用（需 1 行修正）** | 2 blocker + 4 high 结论成立 | 仅 F3 表格里 SSE 的「仓库内首次出现 = agent-harness.md:430」；F3 其余 7 行与 F1/F2/F4/F5/F6 可用（F5 的「第 2 课」建议注明 0 基） |

---

## 5. 「若按原报告行动会踩的坑」（按危害排序）

1. **按 accuracy-F3 的建议改 `rrf.ts:10`（把 1/70 改成 1/69）→ 把全仓 RRF 唯一算例从对改错。**
   现状 `k=60 → 第 10 名 = 1/(60+10) = 1/70` 与公式、实现三方自洽；照建议改会把一个正确的算术结果、以及 `rag.md`/`long-term-memory.md` 的同一教学锚点一起带偏。
2. **按 accuracy-F1 的建议改 `memory-redteam/README.md:126` → 把正确的归属句改成错的。**
   该句正确地把 k1=1.5 归给 rag-demo；改成 k1=1.2 会让读者以为 rag-demo 用 1.2，与 `bm25.ts:41` 直接冲突——**制造**一处真不一致。
3. **按 evidence-F2 的建议删掉/改写 `README.md:28` 的「exit 134/137」→ 删除有据记录。**
   `/tmp/lah-build.log:20` 是 V8 heap OOM 原文（exit 134）、`site-build-heap.log`/`lah-build2.log`/`build-real.log` 为 137/Killed；照建议改成「未定位 OOM」等于把有原始日志的机制结论降级，正是全局纪律 #4/#7 的反向事故。
4. **按 evidence-F1 的「一律 34 页」去解释 33 → 会误判唯一性来源。**
   现存本仓成功日志含 32 页（t21-astro2 / cold / iso 系列，旧枚举期）；把「32/34」压成「只有 34」会导致后续排查页数差异时漏掉一整类历史口径。
5. **按 pedagogy-F1 的 9/15 去改依赖图 → 会给一门本来一致（双方都无前置）的课补边。**
   真值 8/15，多出的 harness-from-scratch 两侧皆空。
6. **按 readability-F3 的 SSE 行加术语表锚点 → 锚到阅读序更晚的课。**
   读者在 harness-from-scratch（order=1）就会遇到 SSE；锚到 agent-harness.md:430 会让「首现处补定义」的位置选错课。
7. **把 coverage-F1/F3 的两个附带计数（5、4）抄进判据脚本 → 断言本身会红。**
   实测 7 与 6；若照抄成门禁阈值，会把正确的仓库判成失败。
8. **按 evidence-F4 的引用替换 → 需补网络核验才算合规。**
   我确认了「4 个被引 run 跑的是 -ge 31/31/32 且无门禁、`38554963320` 全仓零引用」，但该 run 的 run 级 green 与 step 结论我未联网复核；直接写「CI 已验证当前口径」仍缺一步。

---

## 6. 本轮未覆盖 / 未验证（我自己的边界，诚实声明）

1. **六份报告的中危/低压条目未逐条复核**（任务要求覆盖全部 blocker/high；我额外只抽查了与高危同名数字的中危项）。
2. **CI 侧**：`38554963320` 的 run 级 success 与 step 列表需 GitHub API/联网，我未核；
   `README.md:28` 引的 4 个 run 我也只核了 sha→workflow 断言（本地可复现的那半），未核其 run 级状态。
3. **未跑任何写盘点 demo**：sandbox / mcp / durable-execution / framework / api / flywheel / model-basics /
   my-agent / final-project 全部未跑；`astro build` 未跑（scope §0.5）；`site/dist` 只做只读 `find`/`stat`。
   我实跑的两条（rag-demo 评测、memory-redteam 探针）已在覆盖声明里给出命令与结果。
4. **主观量不可复核**：t1 §2 与 t6 的 1–5 难度评分、t1-F14 的阶段难度均值，权重不可复现（两份报告均自述）。
5. **t2 的 accuracy-F7/F10/F11、t3 的 evidence-F5–F10、t6 的 F7–F16 等未复核**；
   其中 accuracy-F7（LangGraph `Annotation.Root` 机制断言）仍处于「仓内无出处、未联网核」状态，我未改变该状态。
6. **边界合规**：本轮只新建 `analysis/content/07-verification.md`；跑命令前后 `git status --porcelain` 均为
   `?? analysis/` + 4 个既有未跟踪根文档，**未改任何既有文件、未改任何他人报告**。
