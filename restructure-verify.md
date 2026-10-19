# V1 独立验证报告：notes/ 结构重组 + 内容失真修正

> 验证者：`verifier`（非实现者）· 任务 `t4` · attempt `3e2d4464-93ff-43e3-800a-c2f67a20b6b5`
> 验证时间：2026-10-14 · 基线提交 `ea277abdd1ba28e8626c408ef19e4195a897b27d`
> 被验证对象：t2（结构重组 W1）/ t3（内容失真修正 W2）
> 纪律：**不采信实现者自述**——下文每条结论都由本人 fresh 重跑得出；比对基准取自 **git HEAD 提交树**（独立来源），而非实现者产物。

---

## 0. 结论摘要

**无阻断发现。8 条 acceptance 全部 passed。**

| # | 核验面 | 结果 |
|---|---|---|
| 1 | 17 课程 slug 集合零漂移（基准 = git HEAD） | ✅ 三源交叉，全部一致 |
| 2 | notes/ 顶层实数与口径算式自洽 | ✅ 19 = 17 + 2，三处算式与实数一致 |
| 3 | README demo 计数与实测真值一致 | ✅ 10（`npm run demo` 实测）、13 源文件、6 具名作品 |
| 4 | 全仓旧路径残留引用为零 | ✅ 0 处（独立穷举） |
| 5 | 构建期硬依赖（两索引留顶层 + TOC fail-fast） | ✅ 逻辑未破坏，且 fail-fast 实测有牙 |
| 6 | 证伪能力实测（4 次注入，全部被捕获） | ✅ 4/4 捕获，现场已逐字节恢复 |
| 7 | 边界清单 | ✅ 见 §6 |
| 8 | t2/t3 越界检查 | ✅ 未越界；3 处课程正文差异经证明**仅为路径串** |

**额外独立发现（非阻断，供决策）**：`site/dist/` 存在一份**迁移后**的全量构建产物（33 HTML，mtime 16:21 > courses.ts/config.ts 的 16:08/16:10），其中**含 `nav/index.html` 且零旧路径字符串**——这为「33 = 7+17+8+1」与「零幽灵路由」提供了**渲染层实证**，超出 t2/t3 自述所主张的证据强度。但按环境约束，**该产物仍是本机产物，不能替代 CI 复验与浏览器目检**（见 §6）。

---

## 1. 逐项核验结果（命令原文 + 退出码 + 关键输出）

### 1.1 合同 Verify 四条命令（逐条 fresh 重跑）

#### V1 — `ls notes/*.md | wc -l`

```
$ cd /home/ubuntu/app/learn-agent-harness && ls notes/*.md | wc -l
19
exit=0
```

**关键输出**：顶层恰为 **19**。清单（19）：`agent-harness, api-engineering, data-flywheel, durable-execution, evaluation, framework-ecosystem, harness-from-scratch, industry-2026, interview-bank, knowledge-map, llm-timeline, long-term-memory, mcp, model-basics, multi-agent, observability, rag, sandbox, system-design`。

#### V2 — `git log --oneline -5`

```
$ git log --oneline -5
ea277ab chore: 清理已完成审计存档 + 精简重构计划流水账
c3d36f9 feat(ui): 其余页面版面层级（详解/作品/学习导航）+ 修来源 chip 窄屏溢出
2b907b1 feat(ui): 首页信息架构重排 + 学习路线版面层级 + 旧定位口吻清理
6453da0 polish: 清除三档/五档口径并歧 + 双高亮 + 过期注释 + P0 复审
cc1b906 refactor: 五阶段课程体系 + 增量主线 my-agent(M0-M4) + 生成层毕业项目
exit=0
```

**关键输出**：`t2/t3` 的改动**尚未提交**（`git status` 显示 20 个 `R` 重命名 + 22 个 `M` 修改 + 2 个 untracked）。这意味着 **HEAD `ea277ab` 的树恰好就是「迁移前」状态**——这正是本任务所需的**独立迁移前基线**，无需依赖任何实现者产物。（`notes/process/` 在任何提交中都不存在：`git log --all -- notes/process` 为空，已核。）

#### V3 — `cd site && npx tsc --noEmit`

```
$ cd /home/ubuntu/app/learn-agent-harness/site && npx tsc --noEmit
exit=0
```

**关键输出**：零类型错误。（**边界**：如 §6 所述，tsc 通过**不等于**页面渲染正确，本报告不以它冒充渲染证据。）

#### V4 — 旧路径残留 grep（合同原文）

```
$ cd /home/ubuntu/app/learn-agent-harness && grep -rn "notes/capstone-\|notes/api-mvp-spec\|notes/flywheel-mvp-spec\|notes/model-basics-mvp-spec\|notes/teaching-style-guide\|notes/site-refactor-plan" --include=*.ts --include=*.astro --include=*.md --include=*.yml . 2>/dev/null | grep -v node_modules | head -30
（脚本自身输出 45 行，全部来自 ./notes-restructure-plan.md 的「迁移前后映射表」——即 t1 计划文档在描述旧路径，非断链）
```

**判读**：合同给的原命令**会命中 t1 计划文档自己的映射表**，属误报。我改用独立穷举（见 §1.4），结论为**真实断链 0 处**。

---

### 1.2 结构不变量：17 课程 slug 零漂移（独立基准）

**基准来源（独立）**：`git show HEAD:site/src/data/courses.ts` 的 `EXCLUDED_FROM_COURSE_ROUTE` + `git ls-tree HEAD` 的顶层清单 → 差集得迁移前路由集合。**未使用实现者任何产物。**

```
$ git ls-tree -r --name-only HEAD -- notes/ | grep -E '^notes/[^/]+\.md$' | wc -l      → 39
$ git show HEAD:site/src/data/courses.ts | grep -m1 EXCLUDED_FROM_COURSE_ROUTE          → new Set([...22 条...])
$ comm -23 <顶层39> <EXCLUDED22>                                                         → 17
```

**迁移前 EXCLUDED（22）**：`api-mvp-spec, capstone-blueprint, capstone-final, capstone-final-structure, capstone-m0-exercise, capstone-m0-structure, capstone-m1-exercise, capstone-m1-structure, capstone-m2-exercise, capstone-m2-structure, capstone-m3-exercise, capstone-m3-structure, capstone-m4-exercise, capstone-m4-structure, capstone-site-render-checklist, capstone-style-guide, flywheel-mvp-spec, interview-bank, knowledge-map, model-basics-mvp-spec, site-refactor-plan, teaching-style-guide`

**四源比对结果**：

| 来源 | 定义 | 数量 | 与基线 diff |
|---|---|---|---|
| ① 迁移前路由 | HEAD 顶层 39 − HEAD EXCLUDED 22 | 17 | —（基准） |
| ② 迁移后路由 | 工作区顶层 19 − 工作区 EXCLUDED 2 | 17 | **空 ✅** |
| ③ 渲染路由 | `ls site/dist/c` | 17 | **空 ✅** |
| ④ 课程正文清单 | 顶层 − 两索引 | 17 | **空 ✅** |

```
===== A) 迁移前路由(git HEAD) vs 迁移后路由(config) =====   => ZERO DRIFT ✅
===== B) 迁移前路由(git HEAD) vs 实际渲染 dist/c/*/ =====   => DIST == BASELINE ✅
===== C) 迁移后 config 路由 vs dist 渲染路由 ==============   => CONFIG == DIST ✅
```

**结论**：**17 个课程 slug 零漂移**，且实现者自述的「四重来源」经我以独立基准复核成立。

---

### 1.3 口径自洽性：亲自数 + 亲自复算

#### ① notes/ 顶层实数与算式

```
$ ls notes/*.md | wc -l                 → 19
$ ls notes/process/*.md | wc -l         → 20
$ ls notes/details/*.md | wc -l         → 8
$ find notes -name '*.md' | wc -l       → 47
守恒：19 + 20 + 8 = 47  ==  47  ✅
算式：19 − 2 = 17        ✅
```

**与声明数字比对**（我从工作区文件独立提取，不采信自述）：

| 位置 | 声明 | 实测 | 一致 |
|---|---|---|---|
| `notes/knowledge-map.md:13` | 「课程页 17 … notes 顶层 19 − knowledge-map − interview-bank」 | 19 / 17 | ✅ |
| `site/src/data/courses.ts:263` | 「notes 顶层 19 − knowledge-map − interview-bank）= 17」 | 19 / 17 | ✅ |
| `README.md:34` | 「19 篇课程内容（顶层）… 17 课程正文 + knowledge-map + interview-bank」；「另有 process/ 20 份 + details/ 8 篇（合计 47）」 | 19 / 47 | ✅ |
| `notes/knowledge-map.md:13` | 「20 份设计/过程文档（15 capstone + 3 MVP 规格 + 2 施工规范）」 | 15+3+2 = 20 | ✅ 逐类数过 |
| `site/src/data/courses.ts:326` | `new Set(['knowledge-map','interview-bank'])` | 2 条 | ✅ |

**关键**：迁移前算式左端写 19 而实数为 39（不自洽）；迁移后 **三处算式首次与实数自洽**——此断言经我独立复算成立。

#### ② README 的 demo 计数真值（亲自数）

我按**精确脚本键**（不是模糊 grep）逐目录判定：

```
$ for d in */; do node -e "const p=require('./$d/package.json');process.exit(p.scripts&&p.scripts.demo?0:1)" && echo "$d"; done
api-demo, durable-execution-demo, flywheel-demo, framework-demo, harness-demo,
mcp-demo, memory-redteam, model-basics-demo, my-agent, sandbox-demo
→ 10
```

**验证了 `courses.ts:289` 注释的三处细节，全部准确**：
- 「实测为 **10**」→ ✅ 精确为 10。
- 「另含 model-basics-demo / flywheel-demo / api-demo / my-agent」→ ✅ 四者均在列。
- 「`rag-demo` 的入口是 `demo:eval`，**反而不在那 10 个里**」→ ✅ `rag-demo` 的 scripts 只有 `demo:retrieval/demo:bm25/demo:rag/demo:eval`，**无 `demo` 键**，故不在 10 中。（若把 `demo:*` 也算上则为 11——注释取的是精确 `demo` 键，口径自洽。）

**注意**：迁移前该注释写「有 `npm run demo` 的目录数 = 6」，与实测 10 矛盾（t1 定位的 D3）。迁移后注释已就地划改为「六个**具名作品**目录 = 6」+ 显式警告，**值 `WORK_COUNT = 6` 未变**（具名作品口径独立于脚本计数），修法正确。

#### ③ harness-demo 源文件计数（亲自跑传递闭包）

```
$ ls harness-demo/src/*.ts | wc -l   → 13
$ node -e '<从 demo.ts 沿 from "./x.js" 递归>'   → 闭包 9: agent/context/demo/llm/otel/policy/session/tools/types
                                                    闭包外 4: otel-assert / otel-mock-scenario / otel-mock / test-compact
```

与 `README.md:13`「13 个源文件（9 运行时 + 3 OTel … + 1 压缩自测）」**逐项吻合** ✅；与 `notes/knowledge-map.md:144` 一致 ✅。权威清单 `harness-demo/README.md:5-19` 逐文件枚举 13 行，我逐一对照确认。

#### ④ 站点 html 33（加分项：由渲染产物独立复算）

```
$ find site/dist -name '*.html' | wc -l   → 33
  index.html(1) + 404.html(1) + {learn,works,map,interview,nav,details}/index.html(6)
  + c/*(17) + details/*/ 专题(8)  = 33
$ ls site/dist/details → 8 个专题子目录 + index.html
```

**口径算式 `33 = 7 静态页 + 17 课程页 + 8 专题页 + 1 自定义 404` 逐项复算成立** ✅，且 `nav/index.html` **确实存在**——证实 t2/t3 关于「原枚举漏 nav」的更正方向正确。

---

### 1.4 引用完整性：独立穷举（零断链）

我自写扫描器，**穷举全仓所有形如 `notes/*.md` 的引用，逐个 `os.path.exists` 判定**，范围排除 `.git`/`node_modules`/`.agent-teams`/`site/dist`/`site/.astro`（构建与运行时产物，非源）、`notes-restructure-plan.md`（t1 计划文档，其映射表**必然**含旧路径，且不在被验证的交付内）。

```
扫描到的唯一 notes/*.md 引用 = 35
指向迁移文件的旧路径引用 = 0        ← ✅ 零断链
```

另以 SCAN-A/SCAN-B 双模式复核：

```
SCAN-A (notes/<migrated>)                        hits=0    ✅
SCAN-B (裸文件名且不含 notes/process/)            hits=16
```

**SCAN-B 的 16 条逐条说明（全部合规，无一断链）**：
- `site/src/data/final-project.ts:6,10,17,36,45,56,66`（7 条）+ `site/src/data/capstone.ts:39,7`（2 条）：**代码注释中的相对文件名**（如「capstone-final.md §2」），因同目录/上文已限定在 `notes/process/` 语境，且**不是路径**（无 `notes/` 前缀），不构成断链；`capstone.ts:7` 已补 `notes/process/` 全路径。
- `notes/model-basics.md:66,163`、`notes/data-flywheel.md:148,312`（4 条）：课程正文的代码注释引用规格文件名，**同属相对提及**，非路径。
- `site/dist/c/model-basics/index.html`、`site/dist/c/data-flywheel/index.html`（3 条）：**构建产物中的代码块渲染内容**，随下次构建再生。

**结论：源文件中指向旧路径的断链引用 = 0。**

#### 备注：本报告自身的自指污染（诚实标注）

`restructure-verify.md`（本报告）与 `notes-restructure-plan.md`（t1 计划）都在**引用**旧路径作为证据/映射，因此扫描器若包含它们会得到「1 处旧路径引用」。排除这两个**文档性**文件后：

```
唯一 notes/*.md 引用 = 35 ; 指向旧路径的引用 = 0 ; 断链 = 2（均为既有虚构示例）
```

这两个文档**不是**代码/配置引用源，不构成断链。扫描器的正确 scope 即为「排除 `notes-restructure-plan.md` + `restructure-verify.md`」。

#### 关于合同 V4 会命中 `notes-restructure-plan.md` 的说明

V4 原命令未排除 t1 计划文档，其**「迁移前后映射表」本身就是在描写旧路径**（58 行里 45 行命中）。这是**设计使然**而非缺陷。我另行确认：**除该计划文档外，全仓零命中**。

---

### 1.5 构建期硬依赖复核（含 fail-fast 实测）

**① 两文件仍在顶层**：

```
$ ls notes/knowledge-map.md notes/interview-bank.md
notes/interview-bank.md
notes/knowledge-map.md          ✅ 两者均在顶层
```

**② `c/[slug].astro` 的 TOC 解析逻辑**（`site/src/pages/c/[slug].astro:36-51`）**逐行核过，未被 t2/t3 触碰**：

```js
const bankEntry = (await getCollection('courses')).find((e) => e.id === 'interview-bank');
const bankToc = bankEntry ? extractToc(bankEntry.body ?? '') : [];
function bankAnchor(prefix: string): string {
  const hit = bankToc.find((t) => t.text.startsWith(prefix));
  if (!hit) throw new Error(`c/[slug]：面试题锚点找不到小节 "${prefix}"...`);   // ← fail-fast
  return hit.id;
}
```

**③ 独立复现该解析**：我复刻 `site/src/utils/toc.ts` 的 `extractToc` + `courses.ts` 全部 64 个 `anchorPrefix`（去重 7 个），实跑：

```
extractToc 解析出 16 个标题
✅ 全部 7 个唯一 anchorPrefix 均解析成功（构建期不会 fail-fast）    exit=0
```

**④ 渲染层佐证**：`site/dist/interview/index.html` 含 **32 个 `#` 锚点**、`site/dist/map/index.html` 含 **12 个**——说明迁移后构建**确实**成功解析并渲染了 TOC（若 fail-fast 触发，构建会抛错而非产出该文件）。

**⑤ `/map`、`/interview` 仍能从 courses 集合取到正文**：`site/src/pages/map.astro:19`、`interview.astro:17` 均按 `e.id === 'knowledge-map' / 'interview-bank'` 查找，两文件留顶层 ⇒ 查找成立。`dist/map/`、`dist/interview/` 均已产出。

---

## 2. 不变量比对表（迁移前 vs 迁移后）

| 不变量 | 迁移前（git HEAD `ea277ab`） | 迁移后（工作区） | 判定 |
|---|---|---|---|
| `notes/` 顶层 `.md` 数 | **39** | **19** | ✅ 目标达成 |
| `notes/process/` `.md` 数 | 0（目录不存在） | **20** | ✅ |
| `notes/details/` `.md` 数 | 8 | 8 | ✅ 未动 |
| `notes/` 总 `.md` 数 | **47** | **47** | ✅ **零增删** |
| git 重命名计数 | — | **20 R100/RM** | ✅ 全为 rename |
| `EXCLUDED_FROM_COURSE_ROUTE` 条数 | **22** | **2** | ✅ 收缩 |
| 课程路由数（顶层 − EXCLUDED） | **17** | **17** | ✅ **零漂移** |
| 课程 slug 集合 | 见 §1.2 ① | 同 ① | ✅ **diff 为空** |
| 渲染路由 `dist/c/*` | —（无迁移后产物） | **17** | ✅ == 基线 |
| `WORK_COUNT` | 6 | 6（注释就地划改） | ✅ 值未变 |
| 课程卡数 / 域数 | 18 / 15 | 18 / 15 | ✅ 未动 |
| 站点 html 总数 | 32（旧口径，枚举漏 nav） | **33**（实测） | ✅ 更正为真值 |
| 17 课程正文内容 | 基准 | **14/17 逐字节一致；3 个仅路径串** | ✅ 见 §4 |
| `knowledge-map.md` | 基准 | 改 4 行（口径块） | ✅ 见 §4 |
| `interview-bank.md` | 基准 | **逐字节一致** | ✅ 未动 |
| `rag-demo` 语料硬编码依赖 | `notes/rag.md` / `notes/agent-harness.md` 在顶层 | 仍在顶层 | ✅ INV-1 第三重理由成立 |
| `tsc --noEmit` | — | exit 0 | ✅ |

---

## 3. 证伪能力实测记录（4 次注入，全部被捕获，现场已恢复）

> 目的：证明上述判据**不是恒真**。每次注入前备份原文件、注入后重跑判据、再逐字节恢复。

### 注入 A — 制造一处旧路径断链引用

```
在 site/src/data/courses.ts 插入：// FAULT-INJECT: 旧路径引用 notes/capstone-blueprint.md
重跑 SCAN-A：  hits=1                                                    ← 0 → 1  ✅ 捕获
   ./site/src/data/courses.ts:327:// FAULT-INJECT: ...notes/capstone-blueprint.md
```

**证明**：引用完整性判据有牙——它不是恒返回 0。

### 注入 B — 篡改 EXCLUDED 集合（制造 slug 漂移）

```
new Set(['knowledge-map', 'interview-bank'])  →  new Set(['knowledge-map'])
重跑：
  excluded after: 1   routes after: 18
  A) 迁移前路由 vs 迁移后路由  => DRIFT ❌   （> interview-bank）
  C) 迁移后 config 路由 vs dist 渲染路由 => MISMATCH ❌ （< interview-bank）
```

**证明**：零漂移判据有牙，且**两个独立轴**（配置 vs dist）同时报警。

### 注入 C — 改错口径算式数字

```
notes/knowledge-map.md： 「notes 顶层 19 − ...」 → 「notes 顶层 24 − ...」
重跑口径判据：
  实测 notes 顶层 = 19 ; knowledge-map 声明 = 24 ; courses.ts 声明 = 19
  ❌ knowledge-map 算式与实数不符        exit=1                ✅ 捕获
```

**证明**：口径自洽判据有牙——它是**实数与声明对拍**，不是复述文本。

### 注入 D — 破坏构建期硬依赖（把 interview-bank.md 移出顶层）

```
mv notes/interview-bank.md /tmp/…
重跑：
  · ls notes/*.md | wc -l                          → 18     （顶层实数断裂）
  · 口径判据：实测 18 ≠ 声明 19                   ❌ exit=1  ✅ 捕获
  · TOC 解析：extractToc 崩溃（Node 异常栈）       ✅ 捕获
恢复：mv 回原位 → notes 顶层复原为 19
```

**证明**：构建期硬依赖的「移动即 fail-fast」不是纸面声明——移动后**解析器真的崩**，且计数判据同时报警。

### 现场恢复验证（逐字节）

```
恢复后 md5：
  ddc5e7dfe7e41504c11c6768202db392  site/src/data/courses.ts
  2cded1f38e3b9099a69deb82fe836003  notes/knowledge-map.md
与注入前记录值完全一致 → RESTORED ✅ 无差异
恢复后复跑：口径判据 ✅ 自洽；TOC ✅ 全解析；SCAN-A ✅ hits=0；tsc ✅ exit 0
notes/interview-bank.md 已回顶层，md5 = b7d848f36a7a8d0647bef4cb2190a93f
```

**恢复后 `git status` 与注入前完全一致**（20 R + 22 M + 2 untracked），无残留污染。

---

## 4. 越界检查（t2/t3 是否超出 inScope）

### 4.1 17 课程正文：14/17 逐字节一致，3 处**经证明仅为路径串**

被改的 3 个课程文件：`notes/api-engineering.md`、`notes/data-flywheel.md`、`notes/model-basics.md`，各 `+2 -2` 行。

**证明方法（独立）**：把工作区版本中所有 `notes/process/` 还原成 `notes/` 后与 `git show HEAD:` 逐字节比：

```
✅ notes/api-engineering.md — 还原前缀后与 HEAD 逐字节一致（差异 = 纯路径串）
✅ notes/data-flywheel.md   — 还原前缀后与 HEAD 逐字节一致（差异 = 纯路径串）
✅ notes/model-basics.md    — 还原前缀后与 HEAD 逐字节一致（差异 = 纯路径串）
结果: 3 个纯路径串 / 0 个含实质改动
```

**逐条目视复核 diff**：3 个文件共 6 处改动，全部是 `见 notes/xxx-mvp-spec.md` → `见 notes/process/xxx-mvp-spec.md` 形式的**规格文件路径引用**。**课程正文的知识内容零改动**。

### 4.2 课程 slug 未被触碰

§1.2 已证：17 个课程 slug 集合与 git HEAD 基准 **diff 为空**。顶层 17 个课程文件的**文件名与位置均未变**。

### 4.3 `site/src/data/` 派生逻辑语义未变（引用路径同步除外）

**方法（独立）**：剥离所有注释（`//`、`/* */`）与字符串字面量内容，只留**代码骨架**，与 HEAD 逐字符比：

```
✅ capstone.ts        — 代码骨架逐字节一致（注释/字符串外零语义变化）
✅ course-structure.ts — 代码骨架逐字节一致
✅ final-project.ts    — 代码骨架逐字节一致
✅ llm-history.ts      — 代码骨架逐字节一致
✅ mvps.ts             — 代码骨架逐字节一致
⚠ courses.ts          — 骨架有 1 处差异
```

**`courses.ts` 的唯一语义差异**（用 `difflib` 精确定位）：

```
[delete] HEAD[5764:5844] = ', "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""'
         NOW  [5764:5764] = ''
```

即 `EXCLUDED_FROM_COURSE_ROUTE` 从 22 个元素缩到 2 个——**这正是本任务的交付目标本身**，非越界。其余全部代码骨架（`COURSES` 数组、`COURSE_MAP`、`COURSE_COUNT`、`CARD_COUNT`、`DOMAIN_COUNT`、`WORK_COUNT`、`STATUS_COUNTS`、`courseMeta`）**逐字节一致**。

### 4.4 `site/src/content/config.ts`：仅加注释，glob 逻辑未改

```
diff：+3 行注释（⚠️ pattern:'*.md' 只匹配顶层…不要改成递归 glob）
```
`loader: glob({ pattern: '*.md', base: '../notes' })` **一字未改** ✅。

### 4.5 `.github/workflows/verify.yml`：断言收紧（等值 33），属更正而非越界

```
- test "$count" -ge 32
+ test "$count" -eq 33
+ 关键页清单补 nav/index.html
```
由**下界**改为**等值**，方向上**更严**，且 33 已由我独立从 dist 复算证实。

### 4.6 其它被改文件

`README.md`、`handoff.md`、`api-demo/README.md`、`final-project/*`（5 个）、`site/src/pages/learn.astro` —— 均为**引用路径同步 / 计数口径更正 / 失真划改**，属 t2/t3 声明范围。`learn.astro` 的 2 处为用户可见 `<code>` 路径串（209/260），非逻辑改动。

**结论：未发现越界改动。**

---

## 5. t3 内容修正的独立复核

| 修正项 | 验证方法 | 结果 |
|---|---|---|
| `handoff.md:53,127` recall@3 `1.00` → `0.31 … 旧 1.00 已废` | 读 `git diff -- handoff.md`，确认两处均就地划改 | ✅ 与 `notes/rag.md:295`「旧值 … 已废」口径一致 |
| `README.md:13`「10 个源文件」→「13 个源文件」 | 亲自跑传递闭包得 13 = 9 + 3 + 1 | ✅ 精确吻合 |
| `notes/knowledge-map.md:144`「9 源文件」→「13 源文件 = 9 运行时 + 3 OTel + 1 自测」 | 同上 + 对照 `harness-demo/README.md:5-19` | ✅ |
| `notes/knowledge-map.md:17`「站点 html 32」→「33（漏 nav）」 | `find site/dist -name '*.html' \| wc -l` = 33；`nav/index.html` 存在 | ✅ 已由构建产物实证 |
| `courses.ts` D3 注释「六个具名作品 = 6」+「实测 10」 | 精确脚本键计数 = 10；`WORK_COUNT` 值未变 | ✅ **比我预期更强**：连「rag-demo 用 demo:eval 故不在 10 中」这个细节都准确 |

**t3 声称「courses.ts 一字未改」经核为真**——该文件的 D3 注释由 t2 落地且内容正确。

---

## 6. 边界清单（本环境无法验证的部分与原因）

> 依据 AGENTS.md「交付证据纪律」与团队硬约束：**不得用 tsc 通过或内容层成功冒充页面渲染正确**。

| # | 无法本机验证项 | 原因 | 归属 |
|---|---|---|---|
| B1 | **页面渲染正确性（视觉/布局/几何）** | 本机 2 核 3.4G，`astro build` 在 **rendering chunks 阶段被 OS SIGKILL**（历史日志 `/tmp/astro-build-t12/18/23/32.log` 均以 `EXIT=124` 或 `Killed` 收尾，`dist/*.html=0`）。**这是环境资源约束，非代码缺陷。** | **留 CI / 浏览器目检** |
| B2 | 像素级视觉审美 | headless 无法代验（`.github/workflows/verify.yml` 的 visual-check 亦自称「只断言结构+几何，不覆盖视觉审美」） | **留浏览器人工目检** |
| B3 | CI 上的实际构建是否与本地 dist 一致 | 本机不能跑 CI。`verify.yml` 注释已写明「若 CI 报 32 则说明 nav 页在 CI 未被生成，须查 nav.astro 是否被条件跳过」 | **留 CI 复验** |
| B4 | **真实 LLM 实跑**（recall@3=0.31 等） | 本机**无可用 LLM key**。凡声称「实跑真实模型」一律不允许 | 未主张；仅核对其**口径文档间一致性**，非实跑值本身 |
| B5 | `.agent-teams/archive/**` 内的历史文本引用旧路径 | 团队状态目录，**read-only 诊断**，非交付内容，不在 inScope | 不计入断链 |
| B6 | `site/dist/` 与 `site/.astro/` 为构建产物 | 可再生，非源；其中出现的 `notes/*` 字符串属**内容渲染快照** | 可再生，不计 |
| B7 | `notes-restructure-plan.md`（t1 计划）含旧路径 | 其映射表**设计上**就描写旧路径 | 不计入断链 |

### 6.1 关于「本机 dist 存在 33 HTML」的**诚实定性**（重要）

我在核验中发现 `site/dist/` **存在一份迁移后的完整构建产物**（33 HTML，含 `nav/index.html`，且**零旧路径字符串**）——这比 t2/t3 自述的证据强，我据此确认了「33」与「零幽灵路由」。但**必须明确其边界**：

1. 该产物**不是本次 t4 验证跑出来的**；它是 2026-10-14 16:21 由**他人**在本机构建留下的（mtime 晚于 `courses.ts` 16:08 / `config.ts` 16:10，故确定为迁移后产物）。
2. **本机当前无法复现该全量构建**（B1 的 SIGKILL 约束仍然成立）。
3. **禁止用法**（团队硬约束，我逐字遵守）：**不得**用「dist 里有 33 个 HTML」冒充「页面渲染正确」——它最多证明**构建曾经成功过**，不能证明**本次改动后渲染仍正确**。
4. 因此：**`33` 与「零幽灵路由」在我的报告中按「渲染层旁证」列示，而**页面正确性仍标注「留 CI / 浏览器目检」**。t2/t3 若在任何场合以该产物直接宣称「渲染正确」，应改为「留 CI 复验」。

---

## 7. 结论

### 是否有阻断发现

**无阻断发现。** 8 条 acceptance 逐项通过，**零断链、零 slug 漂移、零越界改动**，口径算式首次与实数自洽。

### 交付判定

| 被验证交付 | 判定 |
|---|---|
| t2 结构重组（20 迁移 / 顶层 39→19 / EXCLUDED 22→2 / 引用同步） | ✅ 通过（独立复核） |
| t3 内容失真修正（5 处划改 / 计数口径对齐实数） | ✅ 通过（独立复核） |

### 非阻断观察（供 captain 与后续评审参考，不构成返工要求）

1. **机制性缺口仍在（t1 的 D7）**：本次修好了**值**，但「同一口径在 `courses.ts` / `README.md` / `knowledge-map.md` / `verify.yml` 各有手工副本」的**生成器层缺口**未变——下次改口径仍会漏改。建议后续加机器门禁（如 CI 步骤断言 `ls notes/*.md | wc -l` == `courses.ts` 注释中的数字）。
2. **`notes/process/capstone-style-guide.md:38` 的 `notes/a.md`** 与 `notes/mcp.md` 的 `notes/report.md` 是**虚构示例文件名**（mcp-demo 的 mock 服务器数据、教程代码片段），**在 HEAD 中即已存在且逐字节未变**，非本次引入，无需处理。
3. 我的验证脚本与日志位于 `/tmp/v1/`（本机临时区，不入仓）：`scan-refs.sh`、`slug-check.sh`、`counts-check.sh`、`kmap-check.sh`、`pathonly.sh`、`datalogic.sh`、`linkcheck.py`、`toc-failfast.mjs`、`verify-log.txt`。判据均可在报告所给命令原文下重跑。

---

## 附：本报告所有判据的可重跑命令索引

```bash
# ① 顶层实数 / 守恒
ls notes/*.md | wc -l; ls notes/process/*.md | wc -l; find notes -name '*.md' | wc -l

# ② 独立 slug 基线（git HEAD 为基准，非实现者产物）
/tmp/v1/slug-check.sh

# ③ 口径自洽（实数 vs 声明对拍）
/tmp/v1/kmap-check.sh

# ④ 引用完整性穷举
/tmp/v1/scan-refs.sh ; python3 /tmp/v1/linkcheck.py

# ⑤ 课程正文差异「仅路径串」证明
/tmp/v1/pathonly.sh

# ⑥ data 层代码骨架语义不变证明
/tmp/v1/datalogic.sh

# ⑦ 构建期 TOC 依赖 + fail-fast
node /tmp/v1/toc-failfast.mjs

# ⑧ 合同四条
ls notes/*.md | wc -l
git log --oneline -5
(cd site && npx tsc --noEmit)
grep -rn "notes/capstone-\|notes/api-mvp-spec\|notes/flywheel-mvp-spec\|notes/model-basics-mvp-spec\|notes/teaching-style-guide\|notes/site-refactor-plan" --include=*.ts --include=*.astro --include=*.md --include=*.yml . | grep -v node_modules | grep -v '^\./\.agent-teams' | grep -v notes-restructure-plan | grep -v restructure-verify   # → 0
```
