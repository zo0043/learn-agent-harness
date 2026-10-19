# 05 · 对抗式可行性与风险审查（对 01/02/03 三份设计）

> 审查人：`feasibility`（t5）｜方式：**不听结论、只认取证**——三份设计的每条待审主张都由我在仓库里重跑一遍命令或重读原文后才判。
> 边界：只读。本文件是 `analysis/plan/` 下本轮唯一新增物；未改任何既有文件（含 01–04）。
> 基线（本轮实跑，改动前）：`git status --porcelain` = `?? analysis/` + 4 个本轮前既有的未跟踪根 md；
> `git log --oneline -3` = `0f0ca19` / `d49a3c5` / `ea277ab`；`git ls-files | wc -l` = 383；
> `node site/tools/check-counters.mjs` → **exit 0**，末行「判据 12 条 + 副本 7 处」。

---

## 0. 本文件怎么读（判定语义与取证规格）

**判定只有三档**（任务书要求）：

| 判定 | 含义 | 下游动作 |
|---|---|---|
| `confirmed` | 我复跑/复读后主张成立，可直接进 06 | 照做 |
| `needs_revision` | 方向成立但**某条事实/边界/顺序/工作量写错或写漏**，照原文做会产出中间态故障或假验收 | 按「必须改成」落地后再进 06 |
| `reject` | 该条做法本身不成立（会新增副本/无法验收/无法回滚） | 按「替代方向」重写 |

**每条判定的取证规格**：`命令 → 观察 → 结论`。凡我没跑过的，写「未验证（原因）」，**不转述 01/02/03 的结论当证据**。

**审查覆盖（我实跑过的取证，共 30 组只读命令）**：
`git status/ls-files/log`、`node site/tools/check-counters.mjs`（现网绿基线）、
`node -e` 复刻门禁的**口径块解析**与**COURSES 解析**、`node -e` 复刻 **A2 伪码正则**（原样粘贴）、
`node -e` 复算**依赖图 17 节点/14 档位标签/9 冲突**、`node -e` 复算 **DOMAIN_COUNT 两种派生路径**、
`grep -rn` 扫 `phase` 全读点、`domain` 串逐字比对、`git ls-files` 逐个核对改动目标的版本控制状态、
`wc -c`/`awk` 量 `knowledge-map.md`（25522 B）与口径块（10614 B）、`ls notes/details/*.md`（8）、
`grep` 扫仓内硬编码 mcp 锚点（0 命中）、`grep` 核 `rag-demo/src/corpus.ts` 的语料成员。

---

## 1. 必查一问：会不会破坏现有 CI（`check-counters` / `visual-check` / `verify.yml` 逐条）

### 1.0 先说一条**三份设计都没写**的机制事实：门禁在 CI 上跑**两次**，而且其中一次是**部署阻塞点**

`证据`：

```bash
grep -n 'check-counters' site/build.sh .github/workflows/*.yml
# site/build.sh:41:if ! node tools/check-counters.mjs; then   ← set -e + 失败即中止构建（:42-44 打印理由）
# .github/workflows/verify.yml:92: run: node site/tools/check-counters.mjs
# .github/workflows/deploy.yml:40: run: npm run build          ← 即 site/build.sh（package.json:9）
```

`结论`：口径门禁是 **verify.yml（结构回归）与 deploy.yml（Pages 部署）共同的前置**。任何让门禁变红的改动，
后果不止「CI 红一个作业」，而是 **`site/dist` 不再产出 → GitHub Pages 停止更新**（`build.sh` 在 astro 之前中止）。
⇒ 06 必须把「门禁改造与数据改造同提交」写成**部署级红线**，而不是「CI 可能红」。另：`package.json` 的
`build:fast`（`astro build` 直连）是既有旁路，**不得**在实施期用它绕过门禁（会把部署门禁降级为可选）。

### 1.1 受影响断言逐条清单（改动 → 变红的判据 → 为什么）

> 判据编号使用现状 12 条的顺序（`check-counters.mjs:286-328`），副本指 `:343-351` 的 7 处 `grepNum`。

| # | 改造项 | 受影响的断言/副本 | 机制（我实读源码行） | 判定 |
|---|---|---|---|---|
| C1 | **A1-c 步骤 3：删 `courses.ts` 的 `phase` 字段** | 判据「课程卡」「课程页 /c/<slug>/」「知识域」→ 全红；连带「站点 html（三桶并集）」「口算式自洽」红 | `:127` 正则 `/slug: '([^']*)', domain: '([^']*)', phase: '([^']*)'/g` **要求三字段同现**（我逐字复读）。删 `phase` → `entries=[]` → `act.cards/coursePages/domains=0`、`act.courseSlugs=[]`（`:138`）→ 课程页桶空 → `act.siteHtml=25`。**不是 `hardError`**（`hardError` 只在 `:124` 数组边界 / `:132` 常量 / `:146` EXCLUDED 失败时置位） | `need_revision`（01 风险 1 把后果写成 `hardError`；真实后果是**≥5 条判据同时失配**，更嘈杂、更难定位） |
| C2 | 同上，**顺序** | 无（但决定红不红） | 必须「先改 `:127` 解析（分段/换字段）→ 再改 `c/[slug].astro:61` → 最后删 `phase`」 | `confirmed`（03 §组间依赖第 1 条与我复读一致） |
| C3 | **A2：依赖图派生 + 判据 17 逐字节比对** | 新判据 17 → `hardError` if 标记缺失 | 我实读 `notes/knowledge-map.md:78-126`：**当前无任何 `BEGIN/END:dep-graph` 标记**；A2 伪码 `:313` 在缺标记时 `exit 1`。若判据 17 先于「标记 + 首次 `--write`」落地 → CI 红 | `need_revision`（必须写进硬顺序：**标记插入 + 首次生成 + 判据 17 同一提交**；且见 §5 回滚 4） |
| C4 | **A4-b：`WORK_COUNT = WORK_DIRS.length`** | 现有 12 条判据**都不读** `WORK_COUNT`/`WORK_DIRS` | `grep -rn WORK_COUNT site/tools/` → 0 命中 | `confirmed`（不破坏现状） |
| C5 | **A5：映射表补登** | 现有门禁**不解析**该表；仅新增判据 24 会读 | 我实读门禁全部读点（`P` 对象 `:39-48`）：只读 km 的口径块 + notes 顶层/详情 + interview-bank + courses.ts + pages + README + verify.yml | `confirmed` |
| C6 | **A6-b 反向断言（判据 29/30）** | 新增扫描面 = `site/src/**` + `README.md` + `handoff.md` | 若扫描面手滑扩到 `site/tools/**`，会把**新判据自身的字面量**（`:16` 的「期望 18」、生成器的「17 门否则 throw」）当未登记数字命中 → 自指红 | `need_revision`（把「扫描面 = site/src + README.md + handoff.md，**显式排除 site/tools**」写成脚本断言并加负路径用例） |
| C7 | **B-P5：题库加「合格线」列** | 判据「课内嵌题」的**重算值** | 我只读 `:156-170`：重算只认「练习题库标题下、行首匹配 `^\|\s*\d+\s*\|` 的行」。**加列不改行首** → 计数不变；但**改表头**要保留「考察」列，否则 02 自己的 R-Q1 判定基失效（02 已写反向保护） | `confirmed`（附：00 号风险在 02 自己的新判据，不在现有门禁） |
| C8 | **B-P5/B-P7：改 `notes/agent-harness.md` / `notes/harness-from-scratch.md`** | **不是门禁，是语料回归** | 我实读 `rag-demo/src/corpus.ts:19`：`{ name: "agent-harness.md", path: ... notes/agent-harness.md }` —— **`agent-harness.md` 是 `demo:eval` 语料成员**，而 B-P5 的批次清单含 `agent-harness.md:382` 的 8 题表、B-P7 要改 `harness-from-scratch.md:15`。改语料成员必须重跑 `cd rag-demo && npm run demo:eval` 核 132 chunks / recall@3·5·10 / PASS 3/8 零漂移 | `need_revision`（**工作量与批次门禁都漏了这条回归**，见 §3 与 §6） |
| C9 | **B-P6：`mcp.md` 拆节** | 判据「课内嵌题」的重算值（**隐含机制**） | `:161-167`：遇到任意 `^#{1,3}\s*` 标题即 `inBank=false`，再到下一个含「练习题库」的标题才重新进桶。**若在题库节标题与其表格之间插入任何 `#`–`###` 标题，该表整段逃出计数** → 课内嵌题 205 变少、判据红 | `need_revision`（拆分区间 `151-318` 在题库（`:544+`）之前故当前安全，但这条**机制必须写成实施约束**，否则同文件后续任何拆节都会静默改变题量） |
| C10 | **B-P4：`details/*.md` 文本改动** | 判据「notes 顶层 md 数」（19）、「站点 html 专题页桶」（8） | 我实跑 `ls notes/details/*.md \| wc -l` = **8**；桶成员由**文件数**派生（`:260`）。只改文本 → 零影响；**增删文件** → 34/32 → 连带 `verify.yml:105` `-eq 33` 红 | `confirmed`（附约束：B-P4 **不得**增删 details 文件） |
| C11 | **B-P7 落点 (a)：km 加 `## 术语表`** | 「站点 html 33」「notes 顶层 19」「课程页 17」**全不变** | 我实跑 `node -e` 复刻门禁解析：`num(/知识域\s*(\d+)/)` 等 6 个正则 + `notes 顶层 19 − knowledge-map − interview-bank` 算式 + 三桶穷尽。km 已是顶层 md、已在 `EXCLUDED_FROM_COURSE_ROUTE`（`courses.ts:331`）、站点三桶不含 km ⇒ **零级联**，02 的机制论证成立 | `confirmed`（但**新增一条 02 没写的硬约束** → C12） |
| C12 | **任何对 km 第 8–19 行的编辑**（A1-b 改 `:12`、C-P9 改 `:18`、B-P7 加说明行） | `hardError` → 门禁 exit 1 | 我实跑 `node -e` 复刻 `:69-77`：锚点是 **`km.indexOf('计数口径')` 的首次出现 = 第 8 行的交叉引用**（char 627），块体一直延到**第 19 行后的第一个空行**（char 4472）。**在该区间插入一个空行（`\n\n`）即截断块** → `num()` 返回 null → `hardError`。⚠️ 02 把风险写成「术语表内不得出现 `知识域 \d+` 措辞」——**那个风险不成立**（术语表在块区间之外）；**真正成立的是「不许在 :8–:19 之间加空行」** | `need_revision`（02 的回滚点/实现约束写错了风险点，须换成上面这条） |
| C13 | **F0-1：`/nav/` 进 visual-check PAGES** | CI 组合数 24 → 27；nav 页三条断言 | 我实读 `visual-check.mjs:63-73`（8 页）与 `PAGES` 选择器约定，并实读 `nav.astro:19`（`h1.page-title` ✓）、`:65-67`（`.cards .card` ✓）→ **现有选择器可复用**；但 375px 横向溢出**本机无法验证**（需构建 + Chromium） | `need_revision`（F0-1 的「cardsMin/mustHave 加固」被列为可选；实际应写成**必需**，且落地后第一次必须只跑 nav 一页看 CI，否则可能因首页以外的页把 CI 打红） |
| C14 | **F0-2：selftest 落盘约定** | CI **不跑** selftest（我实读 verify.yml 全部步骤） | `visual-check.mjs:369-372` `mkdirSync(out/selftest)` + `:432` `writeFileSync(selftest-report.json)` ⇒ `--selftest` **确实无条件写盘**；落点 `site/tools/out/` 被 `.gitignore:###站点结构+几何回归的本地运行产物` 覆盖 | `confirmed`（且 F0-2 的验收「跑一次 selftest 验证默认不落盘」**本轮禁区** → §6） |
| C15 | **F0-3：mermaid-check 可移植化** | **不影响 CI**（该脚本不在任何 workflow） | 我实读 `viz/mermaid-check.mjs:10`（`DIST='/home/ubuntu/app/learn-agent-harness/site/dist'` 硬编码）、`:49`（chrome 缓存绝对路径）、`process.argv`/`--out` 无；并 `grep -n` verify.yml/deploy.yml → **零调用** | `need_revision`（03 写「`mermaid-check` 覆盖本页」是对的，但**没点出它不在 CI 里**：⇒ A2 改图后的 mermaid 渲染正确性**无 CI 覆盖**，见 §6） |
| C16 | **F0-4：类集合门禁进 `build.sh`** | 会让**部署路径**多一道门禁 | 我实读 `build.sh:35-44`：门禁插在 astro 之前、失败即中止（`set -e`）。F0-4 若要插新脚本，插入点必须与 `:41` 同一段并走同一种 `if ! node …; then … exit 1` 形态 | `needs_revision`（03 的跨批次硬顺序第 3 条写「与批次 A 的门禁扩展同批（同改 build.sh 插入点）」——**批次 A 的 18 条新判据写在 `check-counters.mjs` 内部，并不改 build.sh**；只有 F0-4 侧改 build.sh） |
| C17 | **C-P8：改 `harness-demo/src/llm.ts:24` 默认模型** | 无门禁影响 | 我实读 `harness-demo/src/llm.ts` 的 `process.env.LLM_MODEL ?? …` 默认分支形态（02 给的落号）；该目录不参与任何 CI 断言 | `confirmed`（但行为变更需实跑 → §6） |
| C18 | **C-P9：改 `verify.yml:97` 注释 / README / km:18** | 注释零断言影响；**若加 `upload-artifact` 步骤**则 CI 时长 + 保留期 | 我实读 verify.yml 已有 artifact 步骤（保留 14 天） | `confirmed`（02 自己也不推荐加步骤） |
| C19 | **判据 16 的字面量「期望 18」** | 新增判据自身的硬编码 | `:127` 解析锚点要按新字段重构，A7 判据 16 用「解析到 18 条」做自检 | `confirmed`（可接受：它是**解析自检**而非口径声明；但必须在 06 里登记为「允许的解析锚点字面量」，防止 A6-b 把它当未登记数字扫到） |

**小结（一问）**：**没有任何改造项会破坏 `verify.yml` 的构建期断言（`-eq 33` / 9 个关键页），除非改动增删了顶层 `notes/*.md`、`site/src/pages/*.astro` 静态页或 `notes/details/*.md` 文件**（B-P7 选 (b)/(c) 会，选 (a) 不会；B-P4 不许增删）；**真正的 CI 风险全部集中在 `check-counters.mjs` 的解析锚点与 `build.sh` 的部署阻塞上**（C1/C3/C12）。
`01` 的 A1 风险 1 是**唯一一条把后果写错的**（`hardError` → 实为多判据同时失配）；`02` 的 B-P7 风险点**写错了位置**（见 C12）。

---

## 2. 必查二问：「治本」还是「又添一份副本」（阶段/顺序/计数/术语四类）

### 2.1 阶段（A1）— 副本从 3 处降到 2 处，但**漏了第 4 处活副本** ⇒ `needs_revision`

`我实测的全部档位副本（每条都能复跑）`：

| 副本 | 落点 | 与 `course-structure.ts` 的 `stage` 是否一致 | 01 是否处理 |
|---|---|---|---|
| ① `courses.ts` 的 `phase`（17 行数据 + 类型 + `HORIZONTAL_PHASE` + `DEFAULT_META`） | `:37/:50-233/:260/:312` | **9 处不一致**（01 落号） | ✅ 真删（`phase` 三步瘦身） |
| ② `knowledge-map.md` 课程总表「优先级」列 | `:55-68` | 我实跑逐行比对：**9 处不一致** | ✅ 改列 + 判据 14 机器锁 |
| ③ `knowledge-map.md` 依赖图节点标签 | `:85-101` | 我实跑复算：**17 个节点定义 / 14 个课程节点带档位 / 9 冲突 / 5 一致**（另一个 `P0` 命中是 hub 节点 `INTERVIEW["🎯 面试演练 · P0 末"]`，不是课程） | ✅ A2 派生（但伪码有退化，见 2.5） |
| ④ **`site/src/pages/works.astro` 的档位字符串** | `:224` sandbox 写 **P0**（真值 P1）、`:296` durable 写 **P1**（真值 P2）、`:330` framework 写 **P2**（真值 P4） | **3 处不一致** | ❌ **01/02/03 三份设计全文零命中**（我 `grep` 三份设计对 `works.astro:2xx/:3xx` 与这三句原文 → 0 命中；04 的 W3/W4/W5 找到了，但设计轮没人接） |

`结论`：A1 把 stage 副本从 4 处降到 3 处（①真删、②③机器锁、**④仍在站点上对读者显示错档位**）。
④ 不是「未来风险」，是**现存显示值失真**，且它挂在 `/works/` 每个作品卡的 tag 行上。
⇒ `needs_revision`：**必须改成**——判据 14 的扫描面从「km 课程总表」扩到「站点源码里的档位字形」（至少 `works.astro` 三处），
或退一步：在 A6 的白名单里**显式登记**这三处为「待修（已知失真）」，并在批次 A 门禁里加一条「`site/src/**` 不得出现 `（P0 ·`/`（P1 ·`/`（P2 ·` 形态的档位断言」的反向断言。
否则本批「档位治本」的名义与站点现实不符。

### 2.2 顺序（A3）— 变成「插值 + 弱门禁」，但**三份顺序副本只收敛了两份** ⇒ `needs_revision`

`我实测`：`learn.astro:177` 是字面量 `#1→#17`；`COURSE_STRUCTURE.length` 在同文件 `:273` 已被消费（引零新依赖）；
`km:128-129` 是箭头链；`km:162` 是未结事项里的第二份顺序；**`handoff.md:199` 与 `interview-bank.md §7`** 是第五/第六份（01 自列 U3「未通读、不预设」）。

- A3-a（`learn.astro:177` → 插值）：**真派生**，`confirmed`。
- A3-b/c（km 两处手工改 + 判据 19「该区间 `→` 计数为 0」）：**内部自相矛盾**——A3-c 的定版文案里就含 `见 /learn/ #1→#17`，
  而验收命令第 2 条自己承认「期望 ≤1（仅允许出现在否定句里）」。判据 19 的失败文案是「命中 n 处」，声明值是「0」。
  ⇒ `needs_revision`：二者必须统一（建议：判据 19 = 「`→` 计数 ≤1 **且** 命中行必须同时含否定词『不构成阅读顺序』」，
  并把这条写成脚本注释，否则实施者会按「0」实现、被自己的文案打红）。
- `handoff.md:199` / `interview-bank §7`：**顺序副本未收敛**。⇒ 允许分批（A3 只管 km+learn），但 06 必须把
  「顺序副本现状 = 4 份（learn+km×2+handoff/interview-bank）」写进已知未收敛清单，**不得**宣称「阅读序唯一真源已达成」。

### 2.3 计数（A4）— 数字真派生，但**清单变三份**，且有一条判据会**新造副本** ⇒ `needs_revision`

- `WORK_COUNT = WORK_DIRS.length`：**数字派生成立**。我实读 `mvps.ts:13` 的原文：「⚠️ 可运行 demo 作品数（WORK_COUNT = 6）与「本词表 size = 13」是两个不同口径」
  → 与 `courses.ts:285-297` 的注释一致。**「17 个 demo」≠「6 个作品」在仓库里有明文依据**（02/01 都正确，无任何设计犯此替换——这本是 captain 要我查的项，**结论：无设计犯**）。
- 但**清单**：`courses.ts:WORK_DIRS`（新）/ `knowledge-map.md:16`（已有逐名清单）/ `README.md` 作品表（第三份）→ 仍然三份。
  01 自己写了「判据 21 的完整形态」才会断言三处集合相等，但**判据表里的 #21 只断言目录存在 + 有 `package.json`**（我逐字复读 `:980`）。
  ⇒ `needs_revision`：判据 21 要么按 01 自述的「完整形态」实现（三处集合互等），要么明写「清单三份、仅锁存在性」。
- **判据 23 判 `reject`**：`01:982` 的列定义自相矛盾——「声明值来源」写「**不得硬编码**、与口径块无关」，
  失败文案却写「（上次 `${prev}`）…若无误，请更新本判据的基准值（`site/tools/demo-count.baseline`）」再加 A4-e 正文「判据 23 的期望值应**从文件系统重算**，而不是硬编码 10」。
  **一个门禁若有基准文件，就是把实测事实升格为口径**——这正是它自己警告的「用门禁制造第四个副本」。
  `替代方向`：① 删掉判据 23（该数字站点无展示位，本轮无需展示）；或 ② 降级为**只打印不失败**的信息性输出（exit 不参与）。
- `index.astro:34-35` 的 `Q_IN_LESSON=205`/`Q_BANK=37`：01 选择**新增副本判据 25/26**（保留常量 + 机器锁），
  而仓库已有**更强的既有先例**：`site/src/utils/ragStats.ts` 在构建期从 `notes/rag.md §13` 解析数字、**解析不到即 throw，明文禁止静默回退**。
  ⇒ `needs_revision`：建议改为构建期从 `notes/knowledge-map.md` 的口径块解析这两数（照 `ragStats.ts` 模板，约 30 行），
  判据 25/26 作为**退路**。收益=真删 2 份副本；代价=多一个脆解析器（km 口径块格式），**这个代价本身要在 06 里写清**。
  另：`index.astro:33` 的注释里还有第三份 `205 + 37` 的字面量（我实读）——按纪律 4 需**就地划改**，01 的判据 25/26 只覆盖常量、未覆盖注释。

### 2.4 术语（B-P7）— 落点选得对，但与形式组的**词表耦合未上升为硬前置** ⇒ `needs_revision`

- 落点 (a) 的机制论证**我复核成立**（C11 实测零级联）；(b)/(c) 的 33→34 级联我也复核成立
  （`c` 会进「静态页」桶：`check-counters.mjs:243-245` 的非动态页判定 → `siteHtml` 34 ≠ 33 → 判据红 + `verify.yml:105` 红 + 关键页清单未含）。
- 真问题不在落点，在**跨批一致性**：02 自己写「形式层用 `<dfn data-term="…">`，故术语表『术语』列取值域必须与 `data-term` 一致……实施时先定 `data-term` 词表，再填本表（**次序不能反**）」——
  这是一条**跨批次硬顺序**，但 02 的「依赖」字段只写「无硬前置」，03 的跨批次硬顺序 3 条里也没有它。
  ⇒ `needs_revision`：06 必须把它列为 B-P7 与 F1-1/F1-2 的**共同前置**（先冻结 `data-term` 词表 → 再写两侧）。
  否则两侧各自落地后，术语表跳不到卡片、`check-terms.mjs` 也核不了（这正是 02 说的失败形态）。
- 术语表落点使 `/map` 变长：与 03 的 F2-5（口径块默认收起 + 跳转）、F1-4（nav 长列表）是同一类问题，
  02 的 D4 与 03 的 D5/D8 必须**一起拍板**（03 已写「两条应同批」，02 未写）。

### 2.5 依赖图（A2）— 派生方向正确，但**伪码照抄会产出读者可见退化** ⇒ `needs_revision`

我**原样粘贴** A2 伪码正则（`01:291-296`）实跑：

```
A2 regex parsed entries: 17
slug order: llm-timeline,harness-from-scratch,agent-harness,rag,system-design,sandbox,mcp,evaluation,
            multi-agent,durable-execution,api-engineering,observability,long-term-memory,data-flywheel,
            model-basics,framework-ecosystem,industry-2026
任何重复 slug（过捕获症状）: false
horizontal: ["llm-timeline","industry-2026"]
```

⇒ **解析器本身可行**（这是 A2 最容易失败的地方，我给了正面证据）。但**渲染段**与图现状逐条对比后：

| 伪码 | 现状 `km:78-126` | 后果 |
|---|---|---|
| `flowchart LR` | `graph TD` | 依赖图由纵向变横向 → 长链在窄屏更易溢出（CI 只测横向溢出，**不测可读性**） |
| 标签 `"${stage} · ${slug}"` | `"✅ 从零写 harness · P0"`（domain + 状态 emoji + 档位） | 图上打 slug（`harness-from-scratch`）而非读者认得的 domain → 与 03-F3-1 的契约冲突 |
| **无** `classDef` | 4 个 `classDef`（done/doing/todo/hub）+ 逐节点 `:::done/:::doing/:::hub` | **四色状态图例整体丢失**（我实测 `:::todo` 现 0 使用、另三色分别 4/12/1 处使用） |
| 只输出 `prereqs` 边 | 23 条边（我实测：19 实线 + 4 虚线），其中 **12 条指向 `INTERVIEW`**（8 实线 + 4 虚线） | 01 只把「4 条虚线」写成待处理；`judgement 18` 的文案写「11 条指向 INTERVIEW 的**虚线**边」——**数与线型都错**（实为 12 条，其中 8 条是实线）。若按「11」写替代清单，会漏一门课 → 判据 18 红 |

⇒ `needs_revision`：A2 的「伪码」必须标注为**解析段可照抄、渲染段须吸收 03-F3-1 的 6 条契约**（03 已给出，我复核其必要性成立）；
并把「INTERVIEW 汇聚边 = 12 条（8 实线 + 4 虚线）」更正进 A2/判据 18 的文案。
另：伪码 `entries.length !== 17` 与判据 16 的「期望 18」都是**新增的解析自检字面量**，可接受，但要在 06 登记（见 C19）。

---

## 3. 必查三问：工作量 S/M/L 是否与实测体量匹配（被低估项排序）

### 3.0 我的独立体量基线（不引用设计自述）

| 量 | 我的实测 | 命令 |
|---|---|---|
| notes 顶层 md | **19** | `ls notes/*.md \| wc -l` |
| notes/process md | **20** | `git ls-files notes/process \| wc -l`（04 的 X-12 对照值） |
| details 页 | **8** | `ls notes/details/*.md \| wc -l` |
| 课内嵌题 | **205**（= 13 课题库 176 + agent-harness 8 + rag S1 5 + model-basics S7 16） | 我实跑门禁输出逐项打印 |
| 面试题库精选 | **37**（= §3 22 + §4 10 + §5 0 + §8 5） | 同上 |
| 站点 html | **33**（8 静态 + 17 课程 + 8 专题） | 同上（三桶成员逐一打印） |
| 站点源码 astro 页 | **18 文件**（16 静态/动态 + 2 动态） | `find site/src/pages -name '*.astro'` |
| notes 顶层 mermaid 围栏 | **62** | `grep -rc '```mermaid' notes/*.md \| awk -F: '{s+=$2} END{print s}'` |
| `site/dist` | **0 HTML / 89 文件**（被杀构建的残骸） | `find site/dist -name '*.html' \| wc -l`；`find site/dist -type f \| wc -l` |
| `knowledge-map.md` | **25522 B**，口径块（awk 区间）**10614 B** | `wc -c`；`awk '/计数口径/,/^## [^计]/{print}'` |

### 3.1 被低估项（按严重度排序）

1. **`B-P5`（判 `needs_revision`）——「L」只对应**一半**工作量，且漏算一次语料回归。**
   算术：`B1 30 + B2 28 + B3 34 = 92 题`，覆盖 7 张表（我按 02 给的题号段逐段复核：sandbox/mcp/observability/evaluation/multi-agent/api-engineering/harness-from-scratch）；
   全量 = **14 张表 / 184 题**（我实跑门禁的重算值 176 + 8 = 184 与 02 一致）⇒ **前三批只占 92/184**，还剩 7 张表 92 题**没有任何批次归属**。
   而 02 的 `工作量` 字段写「一次性全做完约 3–4 个工作时段」——**「一次性全做完」与该批表的覆盖面对不上**（3–4 时段 = L，对应 184；但 B-P5.2 只排了 92）。
   `必须改成`：① 把 L 明确挂到 184 题全量，并补「后 7 课 / 92 题」的批次；或 ② 把 L 改成「每批 M × 4 批」。二者取一，**不许留「L 但只排一半」的口径**。
   另有**未计入工作量的隐藏步骤**：`agent-harness.md:382` 的 8 题表在 B-P5 首批范围内，而 `agent-harness.md` 是 `demo:eval` 语料成员（我实读 `rag-demo/src/corpus.ts:19-24`：DOCS = rag.md / agent-harness.md / handoff.md）
   ⇒ 改完**必须**重跑 `cd rag-demo && npm run demo:eval` 核 132 chunks / recall@3·5·10 / PASS 3/8 零漂移。该命令需要活端点/网络，**本机与本轮都跑不了**（02 的风险②提到了这条，但**工作量与批次门禁都没算它**）。

2. **`A6+A7`（判 `needs_revision`）——两项各判 L，但它们是同一文件、且是 4 个改造项的机器锁前置；真正的风险不在行数，在「白名单初始化」。**
   实测支撑：现有门禁 `12 条判据 + 7 处副本`（我实跑）；A7 要加到 30 条（+18）并新增一个 allowlist JSON；
   01 自述要逐处判定「13 处业务副本 + 5 类 13 处非口径数字」。
   我的补充取证：**反向断言（判据 29）的扫描面必须显式排除 `site/tools/**`**，否则新判据自身的字面量（`期望 18`、生成器 `17 门否则 throw`）会自指命中（C6）。
   另一条 01 已抓到但值得再强调：`handoff.md:199` 写的是**中文数字**「十六个知识域」（我实读该行原文），
   而冻结口径是 **知识域 15** ⇒ 这**不只是「`\d+` 抓不到」的盲区，它是一处现存失真**；
   若实施者图省事把它登记进 allowlist 当「叙述性表述」，等于**把一处真失真白名单化**——这正是 01 自己警告的「全豁免门禁」形态。
   `必须改成`：判据 29 的白名单项必须逐项写 `reason`，且「中文数字命中」一律进**待修**而非豁免；判据 30 的 stale 检测必须在**同一提交**落地（否则白名单只增不减）。

3. **`F0-4`（判 `needs_revision`）——M 的前提「脚本本体可复制 §0.2（约 40 行）」没写死亡集比对的**输入面**。**
   我在源码层复核了 03 的「真死 3 项」结论**成立**：`.works-note`（`global.css:725` 定义、全仓 0 处 `class="works-note"`）、
   `.details-entry`（`global.css:732` 定义；`index.astro:221` 用的是 `details-entry-links`）、
   `.lf-count-note`（`learn.astro:341` 组件内 `<style>` 定义，而三个 `<p>` 用的是 `lw-count-note`，见 `learn.astro:271/:276/:281`）。
   但**输入面一旦换成构建产物**（`build.sh` 里的门禁只能看源码或 dist 二选一），Astro 会给组件内 `<style>` 加作用域标记，
   类集合比对必须剥掉作用域哈希——这一步 03 没写，且**本机无法验证**（`site/dist` 实测 **0 HTML**，没有产物可比）。
   `必须改成`：F0-4 的「具体改法」第一行写明**输入面 = 源码（`site/src/**/*.astro` 的 `class=` 文本 + `<style>` 块 + `global.css`）**，
   并显式列出「不覆盖动态拼接类（模板串/条件渲染）」这一边界（03 §0.2 已用「认动态类」描述，但要写成边界声明）。

4. **`F0-1`（判 `needs_revision`）——`mustHave` 加固被降为可选（「才是 M」），实际是**必需**。**
   我实读 `nav.astro:19`（`h1.page-title` ✓）与 `:65-67`（`.cards .card` ✓）⇒ 选择器可复用；
   但 `checkOne` 的断言通道（`visual-check.mjs:207` 的 `applicable`/`searchRequired` 语义）不看 `nav` 特有结构，
   因此 nav 页**能"绿"但什么都没验到**的风险是真实的（03 自己也写了这条顾虑）。
   ⇒ nav 进回归 + `mustHave` 加固应作为**同一条**交付，否则新增的 3 个组合只是把 CI 时长从 24 → 27。

5. **`A2`（判 `needs_revision`）——判 M，但实现面 = 生成器（~40 行）+ 标记插入 + 判据 17 + 吸收 F3-1 的 6 条契约（含 domain 标签与四色 classDef，均需从 `mvpStatus` 二次派生）⇒ 实际 M–L。**
   我实测的支持：A2 的解析正则（原样粘贴）**能正确解析 17 门**（见 §2.5），这是最省事的一半；
   但渲染段要从 `course-structure.ts` 派生「状态 emoji + classDef」必须再读 `mvps.ts` 的三态（`mvps.ts:9-10` 的 done/planned + 02 提到的第三态），
   即生成器实际依赖 **两个** 数据源，工作量与失败面都要重报。

6. **`C-P8`（判 `confirmed`，但**受限**）**：M 的 1.5 h「重取一手源」需要联网（SDK 版本当前值 / 三个时间线节点），
   而 00-scope §0.5 已声明 `web_search` 本轮不可用。⇒ 该项**在本轮不可验证也不可完成**，只能作为有网环境下的任务；02 把它列入 D6/U3 是对的。

### 3.2 我判**没有**被低估的项（抽样复核通过）

- `B-P7`（M）：术语表首版 12–20 条 + 11 处首现展开 + 一个 ~60 行脚本；与我实测的「11 处首现清单」（02 逐条给 file:line，我抽验 SSE=harness-from-scratch.md:15/:17、定义 :83 形态合理）相称。
- `B-P4`（M）：8 页（我实测 = 8 文件）+ 三页改写 + 一条判据脚本。**且它是唯一「不进构建、不碰计数」的批次 B 项**（我实测 details 只按文件数进桶）。
- `F2-5`（S）：03 报的口径块 **10614 B**、km 全文 **25522 B** 与我的实测**逐字节相同** ⇒ 该条的量化前提可信，S 合理（跳转条版）。
- `F0-0`（S）：`rm -rf site/dist` + 重建；`dist` 被 `site/.gitignore` 忽略（我实读），无版本化数据可损；03 自己写得诚实（「工作量 S，只是失败概率高」）。

---

## 4. 必查四问：改动顺序的隐藏依赖（含 3 条硬顺序的验证与补充）

### 4.1 删 `phase` 的完整影响面（我实跑 `grep -rn`，逐行落号 —— 全集，非抽样）

| 类别 | 落点 | 是否受影响 |
|---|---|---|
| 类型/数据 | `courses.ts:37`（类型联合）、`:50-233`（17 行数据）、`:260`（`HORIZONTAL_PHASE`）、`:312`（`DEFAULT_META.phase`）、`:300`（收口注释） | **必改** |
| 活读点 | `courses.ts:279`（`DOMAIN_COUNT` 过滤） | **必改** |
| 死分支 | `c/[slug].astro:61` + `:27-28` 注释 | **必改**（我复核为死分支：`getStaticPaths` 只排除 km/interview-bank，而 `COURSE_STRUCTURE` 的 17 个 slug 与 courses.ts 的 17 张课程卡**集合逐字相等**——我用 `node -e` 校过 `EQUAL: true`，故 `structure` 恒 truthy） |
| 门禁解析锚点 | `check-counters.mjs:127/:128/:139/:141/:286` | **必改**（C1） |
| 文档副本 | `notes/process/site-refactor-plan.md:474/:484`（01 的 A1-d 已处置） | 必改（纪律 4） |
| **CSS 类名（不是字段）** | `nav.astro:28/29/31/60/61/63/85/86/88/309`、`learn.astro:113-116/174-177/196-199/265-268`、`DomainMap.astro:91-94`、`global.css:751-771` —— 我实测 **25 处** `phase-section|phase-head|phase-desc` | **不受影响，但会被「清 phase」的正则误伤** |

⚠️ **实测到的具体误伤**：01 的 A1 验收命令 2 是 `grep -rn '\.phase\b' site/src/ … | grep -v 'phase-head'` → 期望 0 行。
`\b` 在 `phase-` 的连字符前**成立**，所以 `.phase-section` / `.phase-desc` 全部命中（我实跑：`global.css:751/755/758/767/771` 等 ≥6 行）。
⇒ 该命令**永远不会 0 行**，实施者会追一批幽灵命中。`必须改成`
`grep -rnE '\.phase\b' --include=*.ts site/src/ | grep -v 'phase-'`（限定 `.ts` 数据/逻辑文件，而非全 `site/src`），或直接断言「`courses.ts` 内 0 命中」。

### 4.2 术语表落点是否影响站点构建（我实跑确认）

- 不进 `/c/<slug>/`：`courses.ts:331` 的 `EXCLUDED_FROM_COURSE_ROUTE = new Set(['knowledge-map','interview-bank'])` + `c/[slug].astro:17-21` 的过滤。
- **进 `/map` 全文渲染**：`map.astro:48` `<rendered.Content />`（我实读）+ `site/src/content/config.ts` 的 `glob({pattern:'*.md', base:'../notes'})`（顶层、不递归）。
- 因此「术语表」的实际读者入口是 `/map` 而**不是** `/learn`：这是一条**内容归属**判断（不是技术约束），
  且与 03-F2-5（口径块默认收起 + 跳转）/F1-4（nav 长列表）同属「/map 认知负荷」，02 的 D4 与 03 的 D5/D8 必须同时拍板。

### 4.3 拆节是否影响锚点（我实跑确认）

- 仓内**零硬编码 mcp 锚点**：`grep -rn 'c/mcp#\|#s4-agent\|mcp/#' notes/ site/src README.md handoff.md` → **0 命中**（与 03/02 的说法一致，我自己复跑）。
- id 由 `utils/toc.ts` 单一生成器产出，`c/[slug].astro:25` 与 `map.astro:21` 共用 ⇒ 标题一改 id 随动，**站点内部不会不一致**；失效的是**仓外书签**（02 已声明）。
- **但 B-P6 的批次门禁 `B-5` 不可满足**（我实测，判 `reject`，见 §7）。
  另：`handoff.md:106` 与 `:199` 都写着「MCP 与供应链安全 §S4.2-4.4」（我实读原文），而 02 的级联清单**只列到 `industry-2026.md:104/:105` 与 `system-design.md:246`**，**漏了 handoff.md 两处**；
  且 `handoff.md` 是 `demo:eval` 语料成员 ⇒ 修它要重跑评测（不修则留下指向已改名小节的两处死引用——这恰是 02 要治的病）。

### 4.4 三条跨批次硬顺序的验证与补充

| 03 的硬顺序 | 我的复核 | 补充要求 |
|---|---|---|
| ① `check-counters:127` 解析 → `c/[slug].astro:61` → 删 `phase` | **成立**（C1/C2）。补充：错序的后果比 03 写的更重——`build.sh:41` 使门禁成为**部署阻塞点**，错序 = Pages 停止更新 | 写成「同一提交内完成三步」比「按序三个提交」更安全（每一步单独提交之间 CI 必红） |
| ② A2 生成器先吸收 F3-1 六契约 | **成立**（我逐条核了伪码的 4 处退化，§2.5） | 增补第 7 项契约：**INTERVIEW 汇聚边 = 12 条（8 实线 + 4 虚线）**，01 写的「11 条虚线」数与线型都错 |
| ③ F0-4 与批次 A 门禁扩展同批 | **部分成立** | 批次 A 的 18 条判据在 `check-counters.mjs` 内部，**不改 `build.sh`**；只有 F0-4 侧改 build.sh/verify.yml。表述须改（C16） |

**我补充的硬顺序（4–6，均有实测依据）**：

4. **`BEGIN/END:dep-graph` 标记插入 + 生成器首次 `--write` + 判据 17 落地必须同一提交**——我实读 `km:78-126` 现无任何标记，判据 17 先落地即 `hardError`。
5. **不得在 `knowledge-map.md` 第 8–19 行之间插入空行**（C12）——门禁的口径块锚点是**第 8 行**（字面量首次出现）到其后第一个空行；
   A1-b（改 `:12`）、C-P9（改 `:18`）都在这个区间内。这是**三批次共用的写入约束**，必须写成一行铁律。
6. **先冻结 `data-term` 词表，再落 B-P7 与 F1-1/F1-2**（02 自述但未进任何顺序表，§2.4）。

---

## 5. 必查五问：回滚点是否真可回滚（git 取证）

### 5.1 逐个改动目标的版本控制状态（我实跑 `git ls-files --error-unmatch`）

**全部 `TRACKED`**：`notes/knowledge-map.md`、`notes/mcp.md`、`notes/rag.md`、`notes/details/*.md`（8）、`notes/process/*.md`（20）、
`site/src/**`（页/数据/组件/样式）、`site/tools/check-counters.mjs`、`site/tools/visual-check.mjs`、`site/tools/fixtures/*`、
`.github/workflows/{verify,deploy}.yml`、`site/build.sh`、`README.md`、`handoff.md`、`viz/{mermaid-check,render}.mjs`。
⇒ **源码与笔记类改动都能 `git checkout --` / `git revert` 回滚**，且现有工作区干净（只有 `?? analysis/`），回滚基线清晰。

### 5.2 回滚**不成立**或需要额外条件的 5 类（这是本问的真正答案）

| # | 对象 | 事实（实测） | 回滚结论 |
|---|---|---|---|
| R1 | `site/dist/`（F0-0 要删重建） | `site/.gitignore` = `node_modules/ dist/ .astro/`；`git ls-files site/dist \| wc -l` = **0**；现状 **0 HTML / 89 文件** | **git 层无回滚点**——重建是唯一恢复路径，而本机构建不稳定（`484s` 成功过也曾被杀；02 称本机无 484.44s 原始日志）。**03-F0-0 已如实写「无可回滚」**，这条予以 `confirmed` |
| R2 | `site/tools/out/`（visual-check 产物 + selftest） | 根 `.gitignore` 有 `site/tools/out/`；`visual-check.mjs:369-372/:432` 无条件写盘 | 同上：`rm -rf` 即清，但**「回滚 = 重跑」需要能跑 Chromium + dist**；本轮两条都不具备 |
| R3 | 新脚本与新 JSON（`gen-dep-graph.mjs` / `check-terms.mjs` / `check-details.mjs` / `check-classes.mjs` / `numeric-claims.allowlist.json` / `demo-count.baseline`） | 均为**新增未跟踪文件** | 「删文件」不等于回滚：**必须同一提交撤回它的调用点**（`build.sh` / `verify.yml`）。否则 `set -e` 下 `node tools/x.mjs` 因文件缺失非 0 退出 ⇒ **部署中止**（比 CI 红更重） |
| R4 | A2 的受保护区间 | km 由「纯人写笔记」变成「含生成区间」；`git checkout` 能恢复文本 | **是一次性单向门**：回滚 km 文本后，若判据 17 仍在 CI，会因「图 ≠ prereqs」立刻红；⇒ **回滚必须连带回滚判据 17**。01 只写了「跑 `--write` 重生成」，未写这条联动 |
| R5 | 判据 21/23 依赖的新常量/新基准（`WORK_DIRS` / `demo-count.baseline`） | 01 自己指出「回滚 `WORK_DIRS` 会让判据 21 `hardError`」 | 成立；我补一条：`demo-count.baseline` 若采纳（我判 reject，§2.3）会多一份「只为实现门禁而存在的文件」，回滚面再大一圈 |

**结论（五问）**：`01/02/03` 对**文本/源码类**回滚的判断全部成立（且大多给了单文件 `git checkout` 的具体命令）；
不成立的是**产物类与门禁耦合类**：R1/R2 属 03 已如实声明，**R3/R4 是设计里缺的**（必须补进 06 的每个新脚本条目与 A2 条目）。

---

## 6. 必查六问：哪些步骤**超出「只出计划」能定死**（必须显式标注）

> 判据：凡需要「跑构建 / 跑浏览器 / 跑 demo / 联网 / 写盘」才能判定的，本轮**不可能**定死，06 必须写成「留实跑/目检」并给命令。

| 类别 | 涉及项 | 为什么本轮定不死 | 06 必须写的形态 |
|---|---|---|---|
| **本机 `astro build`** | F0-0 的「重建」、所有页面类验收、33 页断言 | `site/dist` 实测 **0 HTML / 89 文件**（被杀构建残骸）；构建约 484 s 且曾被杀；`build.sh` 还带 `capped` 限流分支 | 「以 CI 为准」+ 明确「本机成/败都不代表 CI」 |
| **`visual-check`（需 Chromium + dist）** | F0-1、F1-*、F2-*、F4-* 的全部「留浏览器目检」条 | 需要 `npx playwright install --with-deps chromium`（CI 步骤）+ 已构建 dist + 本地静态服务器 | 每条保留「留浏览器目检」，并给「CI 上跑哪一步看哪一行」 |
| **`--selftest`（会写盘）** | F0-2 的验收「跑一次 selftest 验证默认不落盘」 | 我实读 `visual-check.mjs:369-372/:432` ⇒ **`--selftest` 无条件 `mkdir` + `writeFileSync`**，落在被 gitignore 的 `site/tools/out/selftest/` | 本轮**禁止执行**（00-scope §0.3）；写成「实施轮第一条命令」 |
| **`viz/mermaid-check.mjs`** | A2/F3-2 的「图能渲染」 | ① 不在任何 workflow（我实跑 grep verify.yml/deploy.yml 零调用）② 硬编码 `DIST`（`:10`）与 chrome 路径（`:49`）③ 需要 dist + Chromium | 「mermaid 渲染正确性**当前零 CI 覆盖**」→ 要么先做 F0-3 可移植化 + 接进 verify.yml，要么只留目检（不得用「构建成功」冒充） |
| **demo 实跑 / 语料回归** | B-P5（改 `agent-harness.md`）、B-P6（若修 `handoff.md`）、C-P8（`harness-demo` 默认模型） | `demo:eval` / `npm run demo` 需活端点 + 写 `trajectories/`、`.state/` | 「留实跑」+ 若端点不可用写「未验证（端点不可用）」；**不得**在无日志时宣称零漂移 |
| **联网** | C-P8 的 SDK 版本一手源、C-P9 的 run 级 success 复核 | 00-scope §0.5：`web_search` 无 key | 「未验证（需联网）」；`web_fetch` 直取要记 URL 与时点 |
| **CI 真跑** | 所有「CI 会绿」的断言 | 本轮不联网、不推分支 | 06 里一律写成「CI 判定项 + 期望值」，**不得**写成「已验证绿」 |

---

## 7. 逐项裁决表

> `confirmed` = 可照做；`needs_revision` = 按「必须改成」修完再进 06；`reject` = 换方向。
> **03 的 26 条我未逐条深审**：标 `confirmed*` 者表示我只复核了它的**机制前提**（不是全部细节），原因列在「复核范围」列——这是诚实性声明，不是通过的背书。

### 7.1 01（批次 A + 门禁扩展）

| 项 | 判定 | 关键理由 / 必须改成 |
|---|---|---|
| A1 档位唯一真源 | `needs_revision` | ① 漏第 4 份档位副本 `works.astro:224/:296/:330`（我实测 3 处值全错，三份设计零命中）；② 风险 1 写 `hardError`，实为≥5 条判据同时失配；③ 验收命令 2 的正则误伤 25 处 `phase-*` CSS 类名 |
| A2 依赖图派生 | `needs_revision` | 伪码解析段**正确**（我原样实跑 17 门），渲染段 4 处退化（`flowchart LR`/slug 标签/无 classDef/未含状态）+ INTERVIEW 边数应为 12（8 实线 + 4 虚线）；另需补硬顺序 4（标记 + 首次生成 + 判据 17 同提交）与回滚联动 R4 |
| A3 阅读序 | `needs_revision` | 判据 19（`→` = 0）与 A3-c 定版文案（含 `#1→#17`）自相矛盾；`handoff.md:199` / `interview-bank §7` 的顺序副本未收敛（01 自列 U3，但不得对外称「唯一真源已达成」） |
| A4 计数派生 | `needs_revision` | 「17 个 demo」→ `{COURSE_COUNT} 门课的参考样本` **confirmed**（`mvps.ts:13` 明文两个口径，无设计犯 WORK_COUNT 替换）；但 `WORK_DIRS` 使作品清单仍是三份（判据 21 未含集合互等）；`index.astro:34-35` 建议改构建期派生（照 `ragStats.ts` 先例），并补 `:33` 注释副本 |
| A5 映射表补登 | `confirmed` | 我实测：映射表 8 行数据（表头 + 分隔 + 8），`mcp-demo`/`framework-demo` 命中 **0**（两个目录确实存在）⇒ 「手工补登 + 下界门禁」是正确取舍（第一列异构实体不可派生） |
| A6 门禁扩展（一） | `needs_revision` | 反向断言扫描面必须显式排除 `site/tools/**`（C6）；`handoff.md:199` 的「十六个知识域」是**现存失真**（冻结口径 15）而非叙述豁免 ⇒ 不得白名单化；白名单每项须带 reason + 判据 30 同批 |
| A7 判据 13–30 | `needs_revision` | 判据 16/18/19/23/25/26 分别有问题：18 数错（12 非 11）、19 与 A3 冲突、**23 判 `reject`**（自相矛盾且会新增 `demo-count.baseline` 第四份副本）、25/26 建议升级为真派生；判据 13/14/15/17/21/22/24/27/28/29/30 方向成立 |

### 7.2 02（批次 B/C）

| 项 | 判定 | 关键理由 / 必须改成 |
|---|---|---|
| B-P5 题库合格线 | `needs_revision` | L 只覆盖 92/184（§3.1-1）；漏算 `agent-harness.md`（语料成员）改动后的 `demo:eval` 回归；**批次门禁 B-1 的期望值写死「12 → 15」**，与 A7 的「→ 30」在**同一文件同一计数**上冲突（必须写成「≥15 且三条 R-Q 判据名出现」） |
| B-P7 术语表 | `needs_revision` | 落点 (a) 的零级联**我复核成立**（C11）；但 ① 回滚点写错风险点（应为「不得在 km :8–19 间加空行」，不是我写的术语表措辞，见 C12）；② `data-term` 词表未列为硬前置（§2.4）；③ `index.astro:48/:51-55` 等 11 专名下沉与 F1-1/F1-2 的边界必须在 06 里成对写 |
| B-P6 `mcp.md` 拆节 | `confirmed`（附 2 条强制约束） | 拆分边界（`151-199` / `200-318`，S4.4 随清单走）与「零仓内硬编码锚点」（我实跑 0 命中）成立；**但** ① 批次门禁 **B-5 不可满足 → 判 `reject`**（见下）；② 必须写「不得在题库节标题与其表格之间插入 `#`–`###` 标题」（C9），否则静默改变 `课内嵌题` 计数 |
| B-P4 details 8 页 | `confirmed` | 我实测 details = 8 个 md、`课内嵌题`/`专题页` 桶按**文件名**派生（`check-counters.mjs:260`）⇒ 只改文本零影响；R-D2 的 token 族边界（排除 `n²` → `01` 自动绿）是必要的自测，02 已写 |
| C-P8 时点回填 | `confirmed`（**受限：需联网**） | 默认模型 `harness-demo/src/llm.ts:24` 形态对；SDK 版本「锁定/快照/当前」三分法是防新不一致的关键（02 已写）；1.5 h 取证需网络，本轮不可验证 |
| C-P9 证据链固化 | `confirmed` | 我复核现状：本机 dist **0 HTML** 与「33 页成功」互相打脸（实测支持 02 的前提）；「口径改写 (C)」是正确取舍；`-eq 33` 不得改宽 |

**B-5 判 `reject`（本文件最强的一条反证）**：
02 的批次 B 门禁第 5 条要求 `grep -rn 'S4\.4\|S4\.2\|S4\.3' notes/ site/src/ --exclude-dir=node_modules` → **0 命中**。
我实跑同一命令的等价扫描，命中**至少 5 处与 mcp.md 无关**：
`notes/sandbox.md:300`（`### S4.2 env 泄漏面`）、`notes/sandbox.md:311`（`### S4.3 审计`）、`notes/sandbox.md:315`（`### S4.4 FinHot 映射`）、
`notes/framework-ecosystem.md:208`（`### S4.2 团队约束补充`）、`notes/framework-ecosystem.md:188`（图内「四个必问维度见 S4.2」）——**这些是各课自己的 S4.x 节号**。
⇒ 该门禁**永远不可能绿**；若照它行动，会顺手动别人的节号（越界）。
`替代方向`：把断言收窄到「**mcp 的** S4.x」——① `notes/mcp.md` 内不得出现 `S4\.2|S4\.3|S4\.4`；② 02 级联表里那 11 处具体行必须都出现新号（逐行断言，比全局 grep 更强）；
③ 若坚持全局 grep，必须给 `sandbox.md` / `framework-ecosystem.md` 的 5 处写显式 allowlist + reason（并说明它们与 mcp 无关）。

### 7.3 03（形式组 0–4）

| 项 | 判定 | 复核范围与理由 |
|---|---|---|
| F0-0 dist 残骸 | `confirmed*` | 复核：`site/.gitignore` 含 `dist/`、`git ls-files site/dist` = 0、现状 **0 HTML / 89 文件**（与 02 一致）；03 的「无可回滚」声明正确 |
| F0-1 `/nav` 进回归 | `needs_revision` | 复核：`nav.astro:19` 有 `h1.page-title`、`:65-67` 有 `.cards .card`；`mustHave` 加固必须从「可选」改为「必需」（§3.1-4） |
| F0-2 selftest 落盘 | `confirmed*` | 复核源码 `:369-372/:432` 无条件写盘 ✓；但其验收命令**本轮禁区**（§6） |
| F0-3 mermaid-check 可移植化 | `confirmed*` | 复核：`:10` 绝对 `DIST`、`:49` 绝对 chrome 路径 ✓；**补充**：它不在任何 workflow（03 未点出，见 C15） |
| F0-4 类集合门禁 | `needs_revision` | 复核：`.works-note`/`.details-entry`/`.lf-count-note` 三处**确为定义未用** ✓（我用 `grep` 逐个核对）；但输入面（源码 vs dist/Astro 作用域）未定义（§3.1-3） |
| F1-1 index 首屏术语 | `confirmed*` | 未深审：仅核 `index.astro:33-35` 与 `:48/:51-56` 区间的存在性（04 已逐条取证） |
| F1-2 11 专名下沉 | `confirmed*` | 未深审（与 B-P7 `data-term` 强耦合 → 硬顺序 6 是本条的真正风险） |
| F1-3 404 引导卡 | `confirmed*` | 未深审 |
| F1-4 nav 版面分组（L） | `confirmed*` | 未深审；L 的理由（`<ol>` 内层重排 + 最复杂页回归）与我实测的 nav 页体量相称 |
| F1-5 「17 个 demo」措辞 | `confirmed*` | 与 A4-a 同一处；**两批都改同一行** ⇒ 06 必须指定单一主责（否则重复改/改一半） |
| F2-1 mvpSlug 与目录对齐 | `confirmed*` | 复核：`mvps.ts` 确有 `artifact` 字段（`grep -c` = 14 行含注释），03 的「派生自 artifact」方向可行；未深审映射表全表 |
| F2-2 阶段难度区间 | `confirmed*` | 未深审；`STAGE_COUNTS` 派生化（03 追加常量）与 A1 的 stage 真源不冲突 |
| F2-3 口径说明归属 | `confirmed*` | 复核：`learn.astro` `<section` 开合确实不配平（`:113/:174/:196/:265` 四个开标签，我读到的 `</section>` 位置与 03 的描述一致） |
| F2-4 「完整依赖图见知识地图」指向 | `confirmed*` | 复核：`learn.astro:188` 一带确有该句（我读到 `:190` 的 `<a href="map/">知识地图 →</a>`） |
| F2-5 口径块上站 | `confirmed*` | 复核量化前提：km **25522 B**、口径块 **10614 B** —— 与我的 `wc -c` / `awk` 实测**逐字节相同**；S/L 分档合理 |
| F3-1 派生图版式契约 | `confirmed` | 我逐条复核了它的 6 条契约必要性（对 A2 伪码的 4 处退化）——**这是三份设计里最有价值的一节** |
| F3-2 图容器/mermaid 呈现 | `confirmed*` | 未深审；但见 §6「mermaid 渲染零 CI 覆盖」 |
| F3-3 五档视觉分组 | `needs_revision` | 勘误：我实测图为 **17 个节点定义 / 14 个课程节点带档位标签 / 9 冲突 / 5 一致**；03 写的「16 个课程节点 / 11 个不一致」需按 captain 的裁决改为 9（`11` 可解释为「9 冲突 + 2 个横向资产节点」，但作为**待修数字**必须写 9） |
| F4-1 开头 `>` 块分级 | `confirmed*` | 未深审；03 自报「④-24 的『开头 5 行』实测 2–6 行不等」是对上游的正当勘误 |
| F4-2 图注/图号 | `confirmed*` | 复核量：notes 顶层 mermaid 围栏 **62**（与「62 张图」一致） |
| F4-3 题库小节锚点 | `confirmed*` | 未深审；与 B-P5 同表 ⇒ 需指定主责 |
| F4-4 details 两栏/折叠 | `confirmed*` | 未深审；与 B-P4 同文件族 ⇒ 需指定主责 |
| F4-5 details front-matter 呈现 | `confirmed*` | 复核：`notes/details/04-token-economics.md` 头 6 行确有 `title/slug/domain/source/status` ✓ |
| F4-6 `c/[slug].astro:61` chip | `confirmed` | 我复核死分支成立（slug 集合逐字相等），且它与门禁解析锚点强耦合 → 已进硬顺序 1 |
| F4-7 works `⚠️` 警示层级 | `confirmed*` | 未深审 |
| F4-8 mcp S4 双清单窄屏 | `confirmed*` | 主责在 P6；未深审 |

---

## 8. 「按原设计行动会踩的坑」清单（可直接当实施前 checklist）

> 每条都是**我实测过的**，不是推测。★ = 会造成 CI 红 / 部署停更；☆ = 会造成失真或返工。

1. ★ **先删 `phase` 后改门禁** → `check-counters.mjs:127` 解析出 `entries=[]` → 「课程卡/课程页/知识域/站点html/口算式」≥5 条判据同时失配；
   而 `build.sh:41` 让门禁成为部署阻塞 → **Pages 停更**。（不是 `hardError`，报错会更难读。）
2. ★ **在 `km` 第 8–19 行之间插入空行**（为术语表/为口径说明「排版好看」）→ 口径块截断 → `num()` 返回 null → `hardError` → 门禁 exit 1。
   锚点是**第 8 行的「计数口径」四个字**，不是第 11 行的块标题（我实跑复刻过这个解析）。
3. ★ **判据 17 先于 `BEGIN/END:dep-graph` 标记落地** → `hardError`（`km:78-126` 现无标记，我实读）。
4. ★ **回滚 A2 的 km 文本但留着判据 17** → CI 永久红（图与 prereqs 本来就不一致，那是现状）。
5. ★ **删掉新脚本却留下 `build.sh`/`verify.yml` 的调用** → `set -e` 下构建中止 → 部署停更。
6. ★ **照 02 的 B-5 门禁行动**（`grep 'S4\.2' notes/` 期望 0）→ 永远不可能绿；若为了变绿去改 `sandbox.md:300/:311/:315`、`framework-ecosystem.md:188/:208`，
   就是**越界改别人的节号**。
7. ★ **在题库节标题与表格之间插入 `#`–`###` 标题**（拆节/加小标题）→ 门禁的 `inBank` 状态被截断 → `课内嵌题` 变少 → 判据红。
   插在哪安全：题库节（`mcp.md:544+`）**之前**。
8. ★ **改 `notes/agent-harness.md` 或 `handoff.md` 却不重跑 `demo:eval`** → 语料变了，`rag.md §13` 的 132 chunks / recall / PASS 可能漂移而无任何机器告警
   （门禁不覆盖语料；`rag-demo` 不在 CI）。
9. ★ **用 `npm run build:fast` 绕过门禁** → 把「部署级门禁」降级为可选（该旁路是给本机调试的）。
10. ☆ **照 01 的 A1 验收命令 2 找「0 行」** → `\.phase\b` 会命中 `.phase-section/.phase-head/.phase-desc`（实测 ≥6 行），追幽灵。
11. ☆ **照 A2 伪码原样实现渲染段** → 图从「`graph TD` + domain 标签 + 四色状态 + 状态 emoji」退化为「`flowchart LR` + slug 标签 + 无色」——读者可见退化，
    而 CI 只测横向溢出**测不出**它（mermaid-check 又不在 CI）。
12. ☆ **按「11 条虚线边」写 INTERVIEW 替代清单** → 实际 12 条（8 实线 + 4 虚线）→ 判据 18 红或漏一门课。
13. ☆ **把「17 个 demo」改成 `WORK_COUNT`（6）** → 语义错位（`mvps.ts:13` 明文「两个不同口径」）。01 已两次警告；实施者仍可能手滑。
14. ☆ **把 `HORIZONTAL_SLUGS` 新增的手写集合当成真源** → 那是第 5 份横向清单；我实测**可以完全避免**：
    `COURSE_STRUCTURE` 的 15 个非横向 slug 的 domain 串与 `courses.ts` 的 17 门逐字相同（我用 `diff` 校过，全等），
    非横向 15 门去重域 = **15** ⇒ `DOMAIN_COUNT` 可直接从 `COURSE_STRUCTURE` 派生，无需新集合。
15. ☆ **把 `handoff.md:199` 的「十六个知识域」登记进白名单** → 那是**现存失真**（冻结口径 15），白名单化 = 把失真合法化。
16. ☆ **`handoff.md:106/:199` 的「MCP §S4.2-4.4」被遗漏** → 02 的级联清单没有它们，B-5 的扫描面也不含 `handoff.md` ⇒ 拆节后留两处死引用（治的正是这个病）。
17. ☆ **同一行被两批各改一次**：`learn.astro:199/:204` 与 `index.astro:112` 的「17 个 demo」同属 A4-a 与 F1-5；assets↔课程映射表同属 A5 与 F2-1；
    `mcp.md` 题库表同属 B-P5 与 B-P6/F4-3；`details/*.md` 同属 B-P4 与 F4-4/F4-5。⇒ 06 必须为每处指定**单一主责**，否则「改一半」或冲突。
18. ☆ **`F0-4` 的类集合门禁拿 dist 当输入** → Astro 作用域样式会改写选择器，比对基准不清 ⇒ 先定输入面（我实测 dist 是 0 HTML，本就无从比对）。

---

## 9. 对 03 的已确认勘误（并自查是否还有同源计数）

| 勘误 | 03 原文 | 真值（我的实测） | 同源计数自查 |
|---|---|---|---|
| 依赖图节点/冲突数 | 「16 个课程节点，11 个阶段标签不一致」 | **17 个节点定义**（= 14 课程节点 + 2 横向资产节点 + 1 hub）；**14 个课程节点带档位标签**；**9 冲突 / 5 一致**。可解释来源：`16 = 14 + 2 横向`、`11 = 9 冲突 + 2 横向(无档位)` | 我扫了 03 全文里其它同源数字：`classDef done=4 / doing=12 / todo=0 / hub=1`（我复算**成立**）、「62 图 / 0 手写图注」（我复算 62 **成立**）、「口径块 10614 B / km 25522 B」（我复算**逐字节相同**）⇒ **同源错误仅此一处**，其余量化前提可信 |
| 「`agent-harness` 整条节点缺失」 | 成立 | 我实测：14 个课程节点里**无** `agent-harness`（Harness 架构主线）节点 ✓ | — |
| 「状态用了第三套词表」 | 成立 | 我实测图上 `:::done/doing/hub` 与标签 emoji `✅/📐/🎯`；`📐` 不在 `courses.ts` 的 `✅/🔄/⏳` 内 ✓ | — |

---

## 10. 转交 06 的未决/无法验证项（我不替用户决定）

| id | 内容 | 归属 |
|---|---|---|
| F-D1 | 同一行被两批共改的 4 组（坑 17）→ 必须指定单一主责 | 06 必须解决（不是用户决策） |
| F-D2 | `index.astro:34-35` 的 205/37：构建期派生（照 `ragStats.ts`）还是「常量 + 判据 25/26」 | 建议在 06 里给 A4 拍板，属技术取舍 |
| F-D3 | 判据 23 的存废（我判 `reject`） | 06 直接删或降级 |
| F-D4 | 术语表落点 (a)/(b)/(c) | 与 02-D4 / 03-D5/D8 合并由用户拍板 |
| F-D5 | `handoff.md:199`「十六个知识域」= 失真（改 15）还是别的口径（加说明） | 用户/主责拍板（涉及语料回归成本） |
| F-U1 | `demo:eval` 零漂移验证（改 `agent-harness.md`/`handoff.md` 后） | **未验证**（需活端点/联网；本轮不跑 demo） |
| F-U2 | 本机 `astro build` 能否再成功、33 页能否复现 | **未验证**（构建不稳定；以 CI 为准） |
| F-U3 | `/nav/` 375px 是否横向溢出（F0-1 的真实风险） | **未验证**（需构建 + Chromium） |
| F-U4 | Astro 构建产物里组件内 `<style>` 的作用域形态（F0-4 输入面） | **未验证**（`site/dist` 实测 0 HTML） |
| F-U5 | SDK 版本当前一手源 / CI run 级 success | **未验证**（需联网） |

---

## 11. 边界合规自查（本文件）

- **只新增本文件**：`analysis/plan/05-feasibility-review.md`；未改 `01/02/03/04`、未改 `analysis/content/*`、未改 `notes/`、`site/`、各 demo、`README.md`、`handoff.md`。
- **全部命令只读**：`git status/ls-files/log`、`grep`、`sed`、`awk`、`wc`、`ls`、`find`、`head`、`node -e`/heredoc 复算（不写盘、不 import TS、不起 vite）；
  **未跑** `astro build`、`npm run build`、`visual-check`（含 `--selftest`）、`mermaid-check`、任何 demo；**未联网**。
- 我唯一执行过的**已有脚本**是 `node site/tools/check-counters.mjs`（只读：它只 `readFileSync` + `console.log`，我实读源码确认无任何写盘调用）——用于取得「改动前」绿基线。
- `node -e` 复算只读工作区文件；**未创建任何临时产物**（无 `site/tools/out`、无 `.state/`）。

