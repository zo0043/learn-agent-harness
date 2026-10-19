# R3 评审报告：t2（notes/ 结构重组）——不变量零漂移与顶层构成

> 评审人：architect（非实现者；t2 实现者为 refactor-dev，无参与）
> 被评审任务：t2「W1：notes/ 结构重组实现（迁移文档 + 同步全部引用）」
> 评审基准：`git HEAD ea277ab`（迁移前状态，**独立于实现者产物**）
> 评审时间：2026-10-14 · 工作区状态：迁移未提交（`git status` 为 `R`/`RM`/`M` 混合）
> 本报告为新建文件；对被评审对象全程只读（inScope 仅本文件）

---

## 0. Verdict

**verdict = pass**

t2 的九条 acceptance **全部独立成立**。核心结论：

1. **17 课程 slug 零漂移**——以 `git HEAD` 为独立基准导出迁移前集合，与工作区导出集合 `diff` 为空。
2. **顶层恰为 19 且构成正确**——逐项列名核对为「17 课程 + knowledge-map + interview-bank」，集合相等判定 `true`。
3. **构建期硬依赖保持**——两索引仍在顶层（内容层实证在 `courses` 集合中）；`c/[slug].astro` fail-fast 逻辑**逐字节未改动**，且我独立复刻 `extractToc` 验证正常路径 7/7 解析成功、缺失路径**真实抛错**。
4. **残留断链为零**——自写扫描器穷举全仓：指向旧路径 **0 条**（另附指定的 9 个文件逐个 0 命中）。
5. **EXCLUDED 自洽**——2 条全部对应真实存在的顶层文件，失效条目 0、遗漏 0；**仍必需**（删空则路由变 19，破坏不变量）。
6. **config.ts glob 与目录匹配**——内容层实证 `courses=19`、`details=8`，20 份 process 文档**零误采集**。

**唯一发现**（F1，medium，非阻断、不改变 verdict）：`knowledge-map.md:17` 与 `verify.yml:85,95` 的 **33 分解式三处互不等价**——主式「7 静态页 + 17 课程页 + 8 专题页 + 1 自定义 404」算术正确（`= 33`）但「7 静态页」**未枚举成员**（歧义）；真正算术错的是 `knowledge-map.md:17` 同段「实测取证」括注，`2+6+17+9 = 34` 因 `details` 索引双计。**33 这个值本身是对的**（我已独立推演出 33 的正确分解），故这是**分解式表述缺陷**而非数值错误。captain 已开 t8 承接并已完成，**不据此判 needs_revision**（见 §6）。〔就地更正：本节原把主式也判为 34，系笔误，已改正；见 §6.6 更正记录〕

---

## ① 逐条 acceptance 复核表

> 纪律：不接受 t2 自述；以下每条的「独立证据」均为我本次在评审时重新执行的命令与输出。

| # | t2 acceptance（原文要点） | 判定 | 独立证据（本次实测） |
|---|---|---|---|
| **AC-1** | 20 份非课程文档移出顶层；迁移后顶层恰为 **19** = 17 课程 + knowledge-map + interview-bank | ✅ **成立** | `ls notes/*.md \| wc -l` → **19**；`ls notes/process/*.md \| wc -l` → **20**；`ls notes/details/*.md \| wc -l` → **8**；`find notes -name '*.md' \| wc -l` → **47** = 19+20+8（守恒，文件零增删）。构成逐项核对见 §③ |
| **AC-2** | 17 课程 slug 集合与迁移前**逐字节一致**；不得增删改名 | ✅ **成立** | 基准取自 git（非实现者产物）：`git ls-tree --name-only HEAD notes/` − `git show HEAD:...courses.ts` 的 22 条 EXCLUDED → **17**；工作区：`ls notes/*.md` − 现 2 条 EXCLUDED → **17**；`diff` → **空**（`ZERO_DRIFT`）。见 §② |
| **AC-3** | 同步更新全部引用，全仓无断链（含 `verify.yml`/`final-project/**`/`api-demo/README.md`） | ✅ **成立** | 自写扫描器穷举全仓 `notes/<已迁移文件>.md` 引用 → **断链 0**；指定的 9 个文件逐个 `grep -c` → **全部 0**。见 §④ |
| **AC-4** | 口径算式与实数首次自洽（`19 − 2 = 17`） | ✅ **成立** | 顶层 **19**、EXCLUDED **2**、课程 slug **17** → `19 − 2 = 17` 三个数字同时成立。`courses.ts:263` 与 `knowledge-map.md:13` 声明值与我实测一致 |
| **AC-5** | EXCLUDED 与实际目录状态一致：无失效条目、无遗漏 | ✅ **成立** | 集合 **2** 条，逐条验证：`knowledge-map`/`interview-bank` 顶层**存在**、`notes/process/` 下**不存在**（位置正确）；失效条目 **0**；顶层无「应排除却遗漏」的过程文档（**0**）。见 §⑤ |
| **AC-6** | capstone 迁移后站点引用仍有效（`capstone.ts` 等构建期逻辑无断链） | ✅ **成立** | `site/src/data/capstone.ts` 的旧路径引用 **0**；`course-structure.ts`/`mvps.ts`/`llm-history.ts`/`final-project.ts` 均 **0**；`npx tsc --noEmit` → **exit 0** |
| **AC-7** | knowledge-map.md 与 interview-bank.md 留顶层未被移动（构建期硬依赖，缺失即 fail-fast） | ✅ **成立** | `ls notes/knowledge-map.md notes/interview-bank.md` → **两文件均在**；`git diff --quiet HEAD -- 'site/src/pages/c/[slug].astro'` → **未改动**；内容层实证两 id 在 `courses` 集合中。fail-fast 证伪实测见 §⑥-5 |
| **AC-8** | 验证证据可重跑：`npx tsc --noEmit` exit 0；如实记录构建边界 | ⚠️ **成立，但有边界保留** | `npx tsc --noEmit` → **exit 0** ✅。构建部分：t2 称「全量 `astro build` exit 0 / 484.44s / 33 page(s) built」，**我复核时无法重现**（当前 `site/dist` 的 html = **0**，构建产物已被清理，mtime 17:53）。该声明我**只能追溯到他方日志的转引**（`/tmp/t7-evidence.log:42`「t2 实测 exit 0/484.44s/33 页」），**未见 t2 自己的原始构建日志**。这不影响结构重组结论（见 §⑥-7 边界），但**不得**被当作「页面渲染正确」的证据 |
| **AC-9** | D4 站点 html 真值 = **33**，三处口径改正、`verify.yml` 补 `nav/index.html`、不得写成未定 | ⚠️ **值成立，但分解式表述有缺陷** | 真值 33：我从源码结构独立推演出 **33**（见 §⑥-6），与声明一致 ✅。`verify.yml:96` `test "$count" -eq 33` ✅、`:97` 关键页含 `nav/index.html` ✅。**但**：三处分解式互不等价——主式 `7+17+8+1 = 33` 算术正确但「7 静态页」未枚举成员（歧义）；括注 `2+6+17+9 = 34` 为真算术双计 → 记为 **F1**（t8 已承接并完成） |

**逐条汇总：9 条 acceptance 中 7 条无条件成立，2 条（AC-8/AC-9）成立但附边界/缺陷保留，均无阻断项。**

---

## ② 不变量比对表（迁移前 vs 后，基准来自 git）

**基准独立性声明**：迁移前集合**不取自**实现者的任何清单或报告，而由 `git HEAD` 直接导出：

```bash
# 迁移前顶层（39）
git ls-tree --name-only HEAD notes/ | grep '\.md$' | sed 's|notes/||;s|\.md$||' | sort
# 迁移前 EXCLUDED（22）——从 HEAD 的历史版本读，不用工作区
git show HEAD:site/src/data/courses.ts \
  | grep -o "EXCLUDED_FROM_COURSE_ROUTE = new Set(\[.*\])" \
  | sed "s/.*Set(\[//;s/\])//" | tr ',' '\n' | sed "s/^ *'//;s/' *$//" | sort
# 迁移前课程 slug = 差集
comm -23 <顶层> <EXCLUDED>
```

| 维度 | 迁移前（git HEAD `ea277ab`） | 迁移后（工作区） | 判定 |
|---|---|---|---|
| notes 顶层 .md 数 | **39** | **19** | 按计划下降 20 |
| `EXCLUDED_FROM_COURSE_ROUTE` 条目 | **22** | **2** | 收缩 20（与迁走数相等） |
| **课程 slug 数** | **17** | **17** | **零漂移** |
| `notes/process/` .md 数 | —（不存在） | **20** | 新增承载 |
| `notes/details/` .md 数 | **8** | **8** | 未受影响 |
| notes 下 .md 合计 | **47** | **47** | **守恒（零增删）** |

**课程 slug 集合逐项比对（`diff` 输出为空）**：

```
$ diff /tmp/f-hc.txt /tmp/f-ac.txt      # HEAD 课程 slug  vs  工作区课程 slug
$ echo $?
0                                        # ← 无差异
```

两侧 17 项均为：
`agent-harness, api-engineering, data-flywheel, durable-execution, evaluation, framework-ecosystem, harness-from-scratch, industry-2026, llm-timeline, long-term-memory, mcp, model-basics, multi-agent, observability, rag, sandbox, system-design`

**课程正文内容未被改动（逐字节证明）**：

| 课程正文 | `git diff HEAD --numstat` | 逐字节判定 |
|---|---|---|
| 其余 14 个 | 无改动 | ✅ 与 HEAD 逐字节一致 |
| `api-engineering.md` | 2+/2− | ✅ 还原 `notes/process/` 前缀后与 HEAD **逐字节一致** |
| `data-flywheel.md` | 2+/2− | ✅ 同上 |
| `model-basics.md` | 2+/2− | ✅ 同上 |

```bash
# 逐字节复原证明（评审时重跑）
node -e "const {execSync}=require('child_process');const fs=require('fs');
for(const f of ['api-engineering','data-flywheel','model-basics']){
  const h=execSync('git show HEAD:notes/'+f+'.md').toString();
  const r=fs.readFileSync('notes/'+f+'.md','utf8').replaceAll('notes/process/','notes/');
  console.log(f, r===h?'✅ 仅路径串':'❌ 有实质差异');}"
# → api-engineering ✅ / data-flywheel ✅ / model-basics ✅
```

**实测 diff 内容**（3 文件共 6 行）经逐行审阅：每条改动**仅在 `notes/` 与 `notes/process/` 之间增删前缀**，正文文字、数字、标点、代码块一字未变。**结论：课程正文实质零改动。**

---

## ③ 顶层清单逐项核对（不只看数量）

```bash
$ ls notes/*.md | wc -l
19
```

**全部 19 项逐条列名**（`ls notes/*.md | xargs -n1 basename | sed 's/\.md$//' | sort`）：

| # | 文件名 | 类别 | 归属判定 |
|---|---|---|---|
| 1 | `agent-harness.md` | 课程 | 17 课程之列 |
| 2 | `api-engineering.md` | 课程 | ✅ |
| 3 | `data-flywheel.md` | 课程 | ✅ |
| 4 | `durable-execution.md` | 课程 | ✅ |
| 5 | `evaluation.md` | 课程 | ✅ |
| 6 | `framework-ecosystem.md` | 课程 | ✅ |
| 7 | `harness-from-scratch.md` | 课程 | ✅ |
| 8 | `industry-2026.md` | 课程（横向资产） | ✅ |
| 9 | `llm-timeline.md` | 课程（横向资产） | ✅ |
| 10 | `long-term-memory.md` | 课程 | ✅ |
| 11 | `mcp.md` | 课程 | ✅ |
| 12 | `model-basics.md` | 课程 | ✅ |
| 13 | `multi-agent.md` | 课程 | ✅ |
| 14 | `observability.md` | 课程 | ✅ |
| 15 | `rag.md` | 课程 | ✅ |
| 16 | `sandbox.md` | 课程 | ✅ |
| 17 | `system-design.md` | 课程 | ✅ |
| 18 | `knowledge-map.md` | **索引/题库** | 硬依赖，留顶层 ✅ |
| 19 | `interview-bank.md` | **索引/题库** | 硬依赖，留顶层 ✅ |

**集合相等判定**（非仅比数量）：

```bash
node -e "const fs=require('fs');
const a=fs.readFileSync('/tmp/f-aft.txt','utf8').trim().split('\n');
const u=[...fs.readFileSync('/tmp/f-hc.txt','utf8').trim().split('\n'),'knowledge-map','interview-bank'].sort();
console.log('顶层',a.length,'= 17 课程 + 2 索引 =',u.length,' 集合相等:',JSON.stringify(a)===JSON.stringify(u));"
# → 顶层 19 = 17 课程 + 2 索引 = 19   集合相等: true
```

- **多余项**：无（不存在任何 `capstone-*` / `*-mvp-spec` / `site-refactor-plan` / `teaching-style-guide` 残留顶层）
- **缺失项**：无
- **逐项与「17 课程 + 2 索引」集合相等**：`true`

**迁走的 20 份**：`ls notes/process/*.md | wc -l` → **20**，构成 = 15 capstone + 3 mvp-spec + 2 施工规范（与方案 §2.3 映射表一致）。

---

## ④ 残留断链穷举结果

**方法**：自写扫描器 recursive walk 全仓（排除 `node_modules`/`.git`/`.agent-teams`/`site/dist`/`site/.astro`），对每个文件按行正则匹配 `notes/<name>.md`，只审**已迁移的 20 个** name，逐个判定断链。

```bash
$ node /tmp/f-scan.mjs
断链 = 0
计划/验证报告自身的映射表引述（良性）= 48
✅ ZERO_BROKEN_LINKS
```

**指定的 9 个文件逐个核对（`grep -c` 旧路径引用）**：

| file | 旧路径引用数 |
|---|---|
| `site/src/content/config.ts` | **0** |
| `site/src/data/courses.ts` | **0** |
| `site/src/data/course-structure.ts` | **0** |
| `site/src/data/mvps.ts` | **0** |
| `site/src/data/llm-history.ts` | **0** |
| `notes/knowledge-map.md` | **0** |
| `README.md` | **0** |
| `handoff.md` | **0** |
| `.github/workflows/verify.yml` | **0** |

**合约 V4 原命令说明**（`grep -rn "notes/capstone-\|notes/teaching-style-guide\|notes/site-refactor-plan" ...`）：
现行工作区该命令 **命中 0 条**（exit 0，无输出）。原因是所有旧路径引用已改写为 `notes/process/...`。**注意**：t1 方案文档（`notes-restructure-plan.md`）与验证报告（`restructure-verify.md`）自身含旧路径字符串——前者是**迁移映射表的正常内容**，后者是**证伪实验的引述文本**，二者**不是断链**，已在扫描器中显式排除并归为「良性引述」。

### ⚠️ 关于 captain 提示的「AC-7 残留 2 条」假阳性——我独立复核并**确认属实**

t2 的验收脚本 `/tmp/r1-evidence/verify-restructure.sh` 重跑会报「AC-7 残留旧路径引用: 2」。**我独立核实：这是脚本对验证报告引述文本的假阳性，不是 t2 缺陷。**

```bash
$ grep -rn "FAULT-INJECT" --include=*.md --include=*.ts --include=*.yml --include=*.mjs . | grep -v node_modules
./restructure-verify.md:279:在 site/src/data/courses.ts 插入：// FAULT-INJECT: 旧路径引用 notes/capstone-blueprint.md
./restructure-verify.md:281:   ./site/src/data/courses.ts:327:// FAULT-INJECT: ...notes/capstone-blueprint.md
```

三条独立证据证明其为假阳性：

1. **命中的是引述，不是真实引用**：两行都在 `restructure-verify.md:277-283` 的 fenced code block 内，是 t4（验证者）记录**自己注入的故障字符串**作为证伪实验证据（原文写明「插入…→ 重跑 SCAN-A：hits=1 ← 0 → 1 ✅ 捕获」）。
2. **注入已回滚**：`grep -rn "FAULT-INJECT"` **仅命中该报告的引述本身**，工作区 `site/src/data/courses.ts:327` 无该内容（`grep -c` → 0）。
3. **该文件晚于 t2 完成**：`restructure-verify.md` mtime = **2026-10-14 17:35:18**，是 t4 的交付物，产生于 t2 终验之后；且它**不在 t2 的 inScope** 内。

**结论：不计入 t2 的问题项，不据此判 needs_revision。** 在扫描器中把 `restructure-verify.md` 等报告类文件列为良性引述后，断链 = **0**。

---

## ⑤ EXCLUDED 表自洽性与可简化性判断

**当前值**（`site/src/data/courses.ts`）：`new Set(['knowledge-map', 'interview-bank'])` → **2 条**。

### 5.1 逐条自洽性（无失效条目、无遗漏）

| 集合条目 | 顶层存在？ | `notes/process/` 存在？ | 判定 |
|---|---|---|---|
| `knowledge-map` | ✅ **是** | ❌ 否 | **有效**（文件真实存在且位置正确） |
| `interview-bank` | ✅ **是** | ❌ 否 | **有效** |

- **失效条目 0**：无任何条目指向已迁移到 `notes/process/` 的文件（原 22 条中的 20 条已正确删除）。
- **遗漏 0**：顶层不存在「应被排除却未列入」的过程文档——扫描 `^capstone-|^site-refactor-|^teaching-style|mvp-spec$` → **(无)**。
- **与目录状态一致**：集合语义已从「黑名单兜住 20 份错位文档」回归为「排除 2 个有独立页面的索引文件」，与 `c/[slug].astro:5` 注释（「排除项 knowledge-map / interview-bank 各有独立页面 /map、/interview」）**首次语义一致**。

### 5.2 可简化性判断：**仍必需，不可简化为空；但已无进一步简化空间**

**为什么仍必需**（不能删空集合）：

```bash
node -e "const fs=require('fs');
const top=fs.readdirSync('notes').filter(f=>f.endsWith('.md')).map(f=>f.slice(0,-3));
console.log('顶层非课程 =',top.filter(t=>!['knowledge-map','interview-bank'].includes(t)).length,'（全部是课程正文）');
console.log('若删空集合 → routes 会收',top.length,'条 ≠ 17 → 破坏 INV-1');"
# → 顶层非课程 = 17 （全部是课程正文）
# → 若删空集合 → routes 会收 19 条 ≠ 17 → 破坏 INV-1
```

顶层 19 个文件中**有 2 个不是课程页**（`knowledge-map`、`interview-bank` 各有独立页面 `/map`、`/interview`），它们仍在 `courses` 集合内（因为 glob 是顶层 `*.md`），**必须**靠这 2 条排除才能得到 17 个课程路由。**故集合不可删空。**

**为何已无进一步简化空间**：只剩 2 条，且两条都是**真排除**（各有独立页面且被构建期读取）——不存在「可删的多余条目」。从 22 → 2 已达理论下界。

**残余风险（值得记录，非 t2 缺陷）**：这 2 条仍是**手工清单**——将来若在 `notes/` 顶层新增第 3 个索引类文件，需手工同步该集合，否则会多出幽灵路由。但这是**原设计固有的**（`courses.ts:326` 注释与 `viz/mermaid-check.mjs:23` 的 `EXCLUDED` 构成同一规则的两个副本）。**建议（供 captain 决策，非本任务要求）**：让 `viz/mermaid-check.mjs` 直接 `import`/读取 `courses.ts` 的导出，消除双副本——本次实测二者已收敛一致（下节），故属**可选加固**而非缺陷。

### 5.3 迁移的附带收益（实测）

t1 §3.1-A18 预言「`viz/mermaid-check.mjs:22` 的第二份路由实现会从 20 个幽灵路由收敛为 0 差异」——**实测证实**：

```bash
node -e "const fs=require('fs');
const top=fs.readdirSync('notes').filter(f=>f.endsWith('.md')).map(f=>f.slice(0,-3));
const EXM=new Set(['knowledge-map','interview-bank']);
const m=fs.readFileSync('site/src/data/courses.ts','utf8').match(/EXCLUDED_FROM_COURSE_ROUTE = new Set\(\[(.*?)\]\)/s);
const EXC=new Set(m[1].split(',').map(x=>x.trim().replace(/^'|'\$/g,'')).filter(Boolean));
const a=top.filter(x=>!EXM.has(x)), b=top.filter(x=>!EXC.has(x));
console.log('mermaid-check slugs =',a.length,' 真实课程路由 =',b.length,' 差异 =',a.length-b.length);
console.log('幽灵路由:',a.filter(x=>!b.includes(x)).join(',')||'(无)');"
# → mermaid-check slugs = 17  真实课程路由 = 17  差异 = 0
# → 幽灵路由: (无)
```

**迁移前该差异为 20**（两份实现探测 37 vs 17）。这是「以文件系统事实替代手写排除清单」的量化收益。

---

## ⑥ 构建期硬依赖与 config.ts glob 核验

### 6.1 两索引在顶层（构建期硬依赖保持）

```bash
$ ls notes/knowledge-map.md notes/interview-bank.md
notes/interview-bank.md
notes/knowledge-map.md          # ✅ 两文件均在顶层
```

### 6.2 `c/[slug].astro` fail-fast 逻辑未改动

```bash
$ git diff --quiet HEAD -- 'site/src/pages/c/[slug].astro' && echo "UNCHANGED ✅"
UNCHANGED ✅
```

现状（`site/src/pages/c/[slug].astro`）：

| 行 | 内容 | 评审判定 |
|---|---|---|
| `:36-39` | 注释说明「构建期从 `notes/interview-bank.md` 的 TOC 按 anchorPrefix 解析真实 heading id；前缀解析不到即构建失败（fail-fast）」 | 未改动 ✅ |
| `:40` | `const bankEntry = (await getCollection('courses')).find((e) => e.id === 'interview-bank');` | 未改动 ✅ |
| `:41` | `const bankToc = bankEntry ? extractToc(bankEntry.body ?? '') : [];` | 未改动 ✅ |
| `:45` | `throw new Error('c/[slug]：面试题锚点找不到小节 …')` | **未改动** ✅ |

### 6.3 fail-fast 证伪实测（我独立复刻，不依赖他方结论）

复刻 `site/src/utils/toc.ts` 的 `slugify`/`extractToc`（逐字对齐），配合 `courses.ts` 中真实出现的 7 个 `anchorPrefix`：

```bash
$ node /tmp/f-falsify/t.mjs
真实 anchorPrefix 种类 = 7 : 3.4 harness-demo | 4. 交叉快速问答 | 3.5 rag-demo |
                              3.1 FinHot 幽灵事故 | 3.2 FinHot labeler | 五道标准题 | 3.3 backfill
[场景1 interview-bank 留在顶层] bankEntry=存在  TOC 条目=16
   → 解析成功 7 / 抛错 0
```

| 场景 | 条件 | 实测结果 | 判定 |
|---|---|---|---|
| **正常路径** | `interview-bank.md` 在顶层（现状） | TOC **16** 条，7 个 anchorPrefix **全部解析成功**，抛错 **0** | ✅ 硬依赖满足 |
| **证伪路径** | 模拟 `bankEntry = undefined`（索引移出顶层） | `bankToc = 0` 条 → `bankAnchor()` 在**第一个** prefix 即 throw：`c/[slug]：面试题锚点找不到小节 "3.4 harness-demo"…` | ✅ **fail-fast 真实生效** |

**结论**：fail-fast 是**活的**（不是死代码），且其保护的两文件仍在位。**若 t2 曾把 `interview-bank.md` 移出顶层，构建必定失败**——这从反面证明该不变量被正确遵守。

### 6.4 `site/src/content/config.ts` 的 glob 与目录结构匹配

```bash
$ grep -n "pattern:" site/src/content/config.ts
13:  loader: glob({ pattern: '*.md', base: '../notes' }),
23:  loader: glob({ pattern: '**/*.md', base: '../notes/details' }),
```

| 集合 | pattern | 目录实测 | 判定 |
|---|---|---|---|
| `courses` | `'*.md'`（**仅顶层**） | `notes/` 顶层 = 19 | ✅ 20 份 process 文档在 `notes/process/` **子目录**，对 `*.md` 天然不可见 |
| `details` | `'**/*.md'`（递归） | `notes/details/` = 8 | ✅ 与迁移无关，数量未变 |

**新增分层目录不会被误采集（内容层实证）**：

```bash
$ cd site && npx astro sync        # 仅内容层，不触发页面渲染
[content] Syncing content
[content] Synced content
[types] Generated 6.50s

$ node -e "…读 site/node_modules/.astro/data-store.json…"
courses 集合条目 = 19 （期望 19）
details 集合条目 = 8  （期望 8）
被误采集的 process 文档 = 0 (无) ✅
  knowledge-map    ✅ 在 courses 集合中
  interview-bank   ✅ 在 courses 集合中
```

这是**最强独立证据**：内容层（`Synced content`）实际迭代出的集合成员与预期完全一致——`courses` 恰 19 条、20 份 process 文档**零误采集**、两索引**均在集合内**（即仍在顶层且可被 `c/[slug].astro` 读取）。

**关于 `Duplicate id "knowledge-map"` WARN 的调查**（我不放过任何异常输出）：首次 `astro sync` 出现

```
[WARN] [glob-loader] Duplicate id "knowledge-map" found in .../notes/knowledge-map.md.
       Later items with the same id will overwrite earlier ones.
```

我核查并确认这是 **`glob-loader` 缓存残留，非真实重复**：

1. **文件唯一**：`find . -name "knowledge-map.md"`（排除 node_modules/.git）→ **仅 `./notes/knowledge-map.md` 一个**；`git ls-tree -r --name-only HEAD | grep knowledge-map.md` → 历史上**也只有一份**。
2. **清缓存后 WARN 消失**：`rm -rf site/node_modules/.astro site/.astro && npx astro sync` → 输出**无任何 WARN**，`Synced content` 正常。

这与仓库既有记录一致（`notes/process/site-refactor-plan.md` 多处记载「Duplicate id」为 content-store 缓存现象，非数据重复）。**判定：非 t2 引入，不记 finding。**

### 6.5 33 的独立推演（回应 AC-9）

我无法从构建产物直接验证（当前 `dist` html = 0），故用**源码结构推演**独立确认 33：

| 产物类别 | 来源 | 数量 |
|---|---|---|
| 顶层 `index.html` + `404.html` | `site/src/pages/{index,404}.astro` | **2** |
| 二级 `index.html`（learn/works/map/interview/**nav**/details） | 其余 6 个顶层页 + details 索引 | **6** |
| 课程页 `c/<slug>/index.html` | 17 课程 slug | **17** |
| `details/<slug>/index.html` | `notes/details/` 8 篇文章 | **8** |
| **合计** | | **33** |

```bash
node -e "console.log('2 + 6 + 17 + 8 =',2+6+17+8)"   # → 33
```

**结论：33 是真值，t2 的数值正确。** 但见 §6.6 的分解式缺陷。

### 6.6 F1：33 分解式三处互不等价（主式属歧义、括注属算术双计）（medium，非阻断，t8 承接）

> **就地更正记录（2026-10-14，captain 复核发现）**：本节原表把**主式**「7 静态页 + 17 课程页 + 8 专题页 + 1 自定义 404」也判为 `= 34`，**该判断是笔误**——`7+17+8+1 = **33**`，主式**算术本来就正确**。经 captain 逐项复核指出后，本条已就地改正（未文末追加）。**F1 的实质结论不变**：三处分解式互不等价、33 这个值正确、不据此判 t2 needs_revision；只有「主式也 = 34」这一处算错。captain 并说明其先前也曾对 content-dev 作出同类误判（称「t2 把 404 算两次」），已一并纠正。

**问题定位**：`notes/knowledge-map.md:17`、`.github/workflows/verify.yml:85`、`:95` 三处的 33 分解式**互不等价**；其中 `knowledge-map.md:17` 同段「实测取证」括注按字面求和 **= 34**（差 1）。

**先分清两类问题**：

- **主式**「7 静态页 + 17 课程页 + 8 专题页（details/）+ 1 自定义 404 页」→ `7+17+8+1 = **33**`，**算术正确**。其缺陷是「7 静态页」**未枚举成员**，属**歧义**，不是算术错。
- **实测取证括注**「顶层 2 + 二级 6 个 index.html（含 details/index）+ c/ 17 + details/ 9」→ `2+6+17+9 = **34**`，**这才是唯一的算术错**：`details/index` 被计入两次。

**算术分析（我独立完成；主式一行的笔误经 captain 复核指出后就地更正）**：

| 写法 | 位置 | 字面求和 | 与 33 |
|---|---|---|---|
| 「7 静态页（index/learn/works/map/interview/**nav**/details）+ 17 课程页 + 8 专题页（details/）+ 1 自定义 404 页」 | `knowledge-map.md:17` | `7+17+8+1 = 33` | ✅ **算术正确**；但「7 静态页」**未枚举成员** → ⚠️ **歧义**（见下） |
| 「33 = 7 静态页（…）+ 17 课程页 + 8 专题页 + 1 自定义 404 页」 | `verify.yml:85,95` | 同上 `= 33` | ✅ 算术正确；同样未枚举成员 → ⚠️ 歧义 |
| 「顶层 2 + 二级 6 个 index.html（含 details/index）+ c/ 17 + details/ 9 个（= 8 专题 + index）」 | `knowledge-map.md:17` 同段「实测取证」括注 | `2+6+17+9 = 34` | ❌ **差 1（唯一的算术错：`details` 索引双计）** |

**主式「7 静态页」的歧义点（这才是主式的真实缺陷）**：主式的 7 = `index / learn / works / map / interview / nav / details(索引)`——**含 `details` 索引、不含 404**；而 `ls site/src/pages/*.astro` 的 7 个文件 = `404 / index / interview / learn / map / nav / works`——**含 404、不含 `details/index`**（`details/index.astro` 在 `site/src/pages/details/` 子目录下，不计入顶层 `*.astro`）。两个「7」**数值相同而成员不同**：读者若按 `*.astro` 文件集去核对主式，会得出与之不符的分解。故主式的缺陷是**成员未枚举导致的歧义**。

**根因（仅对括注那条）**：`details` 索引被双计——「二级 6 个 index.html」里已含 `details/index.html`，而「details/ 9 个 = 8 专题 + index」又把它算了一次，故 `2+6+17+9 = 34` 而非 33。

**33 的正确分解（等价写法）**：

```
A. 6 静态页（不含 details 索引）+ 1 details 索引 + 17 课程页 + 8 专题页 + 1 自定义 404 = 33
B. 2（顶层 index+404）+ 6（二级 index，含 details 索引）+ 17（c/）+ 8（details 文章）= 33
C. 8 非动态静态页（= 7 顶层 *.astro 文件含 404 + details/index）+ 17 课程页 + 8 专题页 = 33   ← t8 采用的口径
```

**对照 HEAD 的原始写法**（说明 t2 改写引入了什么）：

```
HEAD (32):  6 静态页（index/learn/works/map/interview/details）+ 17 课程页 + 8 专题页（details/）
            → 6 里含 details 索引，17+8 亦覆盖 details 下 8 篇，未双计；404 是另一笔账
t2   (33):  7 静态页（…/nav/details）+ 17 课程页 + 8 专题页 + 1 自定义 404
            → 把 nav 加入（6→7，正确），加数与声明值 33 自洽（7+17+8+1 = 33）；
              缺陷只在「7 静态页」未枚举成员 → 歧义
```

**判定与处置**：**数值 33 正确**；缺陷为「三处分解式互不等价」——主式属**歧义**（成员未枚举），括注属**算术双计**（`details` 索引计两次）。属 **medium**（会让读者无法据任一处自行复算出 33，正是 t1 §4-D7 所述「口径手工副本导致互相矛盾」的同类复发）。**captain 已开 t8 承接修复，t8 已完成**——三处已统一为 `8 非动态静态页 + 17 课程页 + 8 专题页 = 33`（源派生）。

- **不据此判 t2 needs_revision**（t2 的交付目标——20 份文档迁移与引用同步——已完整达成，且 33 值经我独立推演正确）。
- 记为 **F1（medium）**，要求统一三处分解式并消除歧义与双计。**建议**采用写法 B/C（按真实产物层级枚举，而非「静态页」这一歧义概念），因其可直接与 `find site/dist -name '*.html'` 的输出逐类比对。

### 6.7 边界诚实声明（强制要求项）

**我未取得任何页面渲染正确性的独立证据，本报告也不作此断言。** 具体边界：

| 项 | 状态 |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 —— **仅证明类型层无破坏，不证明页面渲染正确** |
| `astro sync`（`Synced content`） | ✅ exit 0，集合成员实证 —— **仅证明内容层采集正确，不证明页面渲染正确** |
| 页面渲染（`astro build` → dist HTML） | ⚠️ **本机当前不可验证**：`find site/dist -name '*.html' \| wc -l` → **0**（构建产物已被清理，`site/dist` 现只含 89 个非 HTML 中间产物，mtime 17:53）。t2 声称的「exit 0 / 484.44s / 33 page(s) built」我**只能追溯到他方日志转引**（`/tmp/t7-evidence.log:42`），**未见 t2 自己的原始构建日志** |
| `/map`、`/interview` 渲染 | **留 CI / 浏览器目检** |
| 33 个 html 的实际产出 | **留 CI 实测**（`verify.yml:96` 已设等值断言，CI 是权威） |
| `nav/index.html` 存在性 | **留 CI 实测**（`verify.yml:97` 已纳入关键页清单） |

**明确未做**：未用 `tsc` 通过冒充渲染正确；未用 `Synced content` 成功冒充渲染正确；未把 t2 自述的构建成功当作已验证事实。

**据此我给 AC-8 的判定是「成立但有边界保留」**：结构重组的全部核心判据（不变量、构成、断链、EXCLUDED、glob、硬依赖）**本机可独立验证且已全部通过**；构建声称属**旁证而非本任务必要证据**，且**页面渲染正确性仍需 CI 确认**。

---

## ⑦ 结构化 findings

| id | severity | file:line | problem | requiredFix | 状态 |
|---|---|---|---|---|---|
| **F1** | **medium** | `notes/knowledge-map.md:17`；`.github/workflows/verify.yml:85`；`.github/workflows/verify.yml:95` | **33 的分解式三处互不等价。** 主式「7 静态页 + 17 课程页 + 8 专题页 + 1 自定义 404」算术**正确**（`7+17+8+1 = 33`），缺陷是「7 静态页」**未枚举成员**——主式的 7 含 `details` 索引不含 404，而 `ls site/src/pages/*.astro` 的 7 含 404 不含 `details/index`，两个「7」成员不同 → **歧义**。真正的**算术错**在 `knowledge-map.md:17` 同段「实测取证」括注：`2+6+17+9 = 34`，因 `details/index` 被「二级 6 个」与「details/ 9 个」各计一次 → **双计**。**数值 33 本身正确**（我经源码结构独立推演确认为 33），缺陷仅在分解式表述 | 由 **t8** 统一三处为同一分解式并消除歧义与双计（**t8 已完成**：统一为 `8 非动态静态页 + 17 课程页 + 8 专题页 = 33`，源派生）。**建议**写法：`33 = 2（顶层 index.html + 404.html）+ 6（二级 index.html：learn/works/map/interview/nav/details）+ 17（c/ 课程页）+ 8（details/ 文章页）`——可直接与 `find site/dist -name '*.html'` 逐类比对，不依赖歧义的「静态页」概念。修完三处须数值自洽（字面求和 = 33） | 已知 · **已由 t8 修复** · 不阻断 t2 |

**无 blocker / high / low 级 findings。**

### 关于两条「疑似 finding」的明确排除（避免后续复审重复立案）

| 疑似项 | 排除理由 |
|---|---|
| `restructure-verify.md:279,281` 的「旧路径引用 2 条」 | **假阳性**：t4 验证报告引述其自注入的故障字符串（fenced block 内），注入已回滚（`site/src/data/courses.ts` 现无该内容），且该文件晚于 t2 完成、不在 t2 inScope。已独立复核确认，见 §④ |
| `astro sync` 的 `Duplicate id "knowledge-map"` WARN | **非真实重复**：全仓仅一个 `knowledge-map.md`，`git ls-tree` 证明历史上也只有一份；清 `.astro` 缓存后重跑 WARN 消失。属 `glob-loader` 缓存残留，与仓库既有记载一致，见 §6.4 |

---

## ⑧ 评审方法与独立性声明

- **独立性**：t2 实现者为 refactor-dev；本评审由 architect 执行，未参与 t2 任何实现，t2 实现期间未向 refactor-dev 提供本报告结论。
- **不变量基准独立**：迁移前 slug/顶层/EXCLUDED 三者**全部**从 `git HEAD` 导出（`git ls-tree`、`git show HEAD:...`），**不使用**实现者生成的任何清单或报告。
- **不接受自述**：§① 每条的「独立证据」均为本次评审重新执行的命令与原始输出；对 t2 的构建声称未能重现处**如实标注**（§6.7）。
- **证伪优先**：对关键保护机制（`c/[slug].astro` fail-fast）做了**主动注入式证伪**（§6.3），确认其为活代码而非死路径。
- **异常不放过**：对 `Duplicate id` WARN 做了溯源调查（§6.4）而非忽略；对 captain 提示的假阳性做了独立复核（§④）而非直接采信。
- **越界检查**：本报告仅写入 inScope 文件 `restructure-review-structure.md`；`notes/`、`site/src/`、`README.md`、`handoff.md`、`site/dist/`、`.agent-teams/` 全程只读。评审过程中曾执行 `npx astro sync` 与 `rm -rf site/node_modules/.astro site/.astro`（均为**可再生缓存**，非源码；`site/.astro` 与 `site/node_modules/` 均属 t2 outOfScope 且非交付物）——**未修改任何被评审源文件**。
