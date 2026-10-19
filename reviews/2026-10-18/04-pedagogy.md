# 教学法 评审报告（pedagogy）
- 评审员：pedagogy｜时间：2026-10-18 23:30（Asia/Shanghai）
- 覆盖声明：
  - **全读（逐行）**：`notes/knowledge-map.md`（174 行）、`site/src/data/course-structure.ts`（426 行）、`site/src/pages/learn.astro`（497 行）。另为核对「生成选项/字段」的呈现口径，**全读**了 `site/src/pages/nav.astro`、`site/src/pages/map.astro`、`site/src/pages/interview.astro`、`site/src/data/courses.ts`、`site/src/data/mvps.ts`、`notes/interview-bank.md`；预算是够的（合计约 2400 行，其中 astro 文件大半是 `<style>`，只扫不析）。
  - **抽样（逐节/逐行）**：`notes/details/*.md` 8 篇全文（每篇 ~2.3KB，便宜）；`notes/*.md` 的**各级标题清单**（用 `grep -n '^##* '` 扫 13 门课的节号，验证 §S/§N 交叉引用是否指得到）；`site/src/pages/c/[slug].astro:60-119`（只取渲染「前置知识/技能储备/实际输出」的模板段，用于判断 learner 实际看到哪些字段）；`notes/data-flywheel.md` 的 `precision|单调` 命中行；`notes/api-engineering.md` 的 `实跑判据|尚未存在|api-demo` 命中行；`flywheel-demo/README.md` 与 `flywheel-demo/src/assert.ts` 的 `单调|precision` 命中行。
  - **未读（原因）**：① `notes/llm-timeline.md`、`notes/industry-2026.md` 正文（只取标题/节点数——事实时效属 `fact-timeline` 分区）；② `site/src/components/DomainMap.astro`（`/map` 顶部交互视图如何取 `stage`/`phase` 未验证，故该视图的 P 标签呈现**不列入结论**）；③ `notes/process/*.md`（20 份；`course-structure.ts:4` 自称唯一内容源，但按宪章第 2 节「不先读完整个语料」未展开，故其「逐字一致」声明**未验证**）；④ 17 门课的正文（除上面抽样命中外未逐行；本视角只审路径/判据/题库覆盖，正文事实属技术分区）。
- 结论摘要：
  1. **【blocker】** 站点五档 `P0–P4` 与笔记 `P0–P2` 优先级用同一字母表却含义不同、14 门里 9 门冲突：`/learn` 说沙箱=**P1 阶段**、`/map`（原文渲染笔记）说沙箱=**P0 优先级**，同一课得到相反的「先学什么」。
  2. **【high】** 「先学什么」在本站有 ≥4 个互不相等的答案：`/learn` 线性序（起点=LLM 时间线）、`/map` 建议开课顺序（起点=系统设计）、`knowledge-map.md:128` 与 `:162` 两个不同版本、以及 `prereqs` 边与笔记 mermaid 依赖图的 ≥6 条边差异。
  3. **【high】** 完成判据两种坏形态并存：2 门课只有不可判定判据（「画清分层并讲清每层为什么存在」），14 门课的判据是「clone 能跑参考实现」——衡量的是仓库而非学习者；另有 3 门课正文仍写「demo 目录尚未存在」而站点声明已实现。
  4. **【medium】** 题库/专题页的自查口径有可复核的错点：`interview.astro` 把 5+4 题标成「10 题」；`details/06` 在「未覆盖」标题下写「已落地」；JD 矩阵的「目标全 🟢」被自身 ⚪ 行证伪。
  5. 结构层面**是好的**：`prereqs ⊆ 更早 order` 17/17 成立、`next = order+1` 17/17 成立（自跑脚本），17 个 slug 全有 notes 文件——拓扑没坏，坏的是**同一份拓扑被四套叙述互相打架地讲**。
- 本轮未验证的范围：
  - 未跑 `astro build`/未起服务器（宪章 §0.5 禁），所有「页面上会显示成什么样」均由数据派生 + 模板代码推理得出，**留浏览器目检**。
  - 未跑任何 `npm run demo` / `node test.mjs`：flywheel 的 `precision 0.256→0.304→0.272`、`15 spans/1 trace`、`16/16` 等**只按文本与断言源码核对，未实测复跑**。
  - 未读 `notes/process/site-refactor-plan.md §2/§3/§4`，故 `course-structure.ts:4-6` 的「与 §2 主表逐字一致、无漂移」声明未验证。
  - `site/src/components/DomainMap.astro` 未读，`/map` 顶部交互视图是否另有一套阶段标签未验证。
  - `industry-2026.md` 与 `details/*.md` 的「行业一手源」真伪未核（URL 可达性/内容对得上属 `fact-timeline`）。

---

### PED-F1｜五档 `P0–P4` 与笔记 `P0–P2` 优先级同字母不同义，14 门课 9 门冲突（**blocker**）
- 严重度：blocker
- 对象：`notes/knowledge-map.md:53-68`（优先级列）＋ `site/src/data/course-structure.ts:85,101,118,134,151,168,185,202,219,238,255,272,291,308,325,344`（stage）
- 原文引文：
  - `notes/knowledge-map.md:59` → `| 沙箱与凭据·可复现 | P0 | 📐 讲义已展开（2026-10-11） |`
  - `site/src/data/course-structure.ts:166-168` → `slug: 'sandbox',` … `stage: 'P1',`
- 现象：同一门课在两处被贴上同名但不同义的 `P0`——笔记的 `P0/P1/P2` 是**优先级**（表头第 2 列写「优先级」），站点 `P0–P4` 是**教学阶段**；14 门编号课里 **9 门**的两套 P 值互相冲突（沙箱 P0/P1、评测 P0/P1、多智能体 P0/P1、durable P1/P2、API P1/P2、长期记忆 P2/P3、数据飞轮 P1/P3、模型基础 P2/P3、框架 P2/P4）。
- 证据：
  ```
  $ awk -F'|' '/^\| (从零写 harness|…|多智能体编排) /{gsub(/ /,"",$2);gsub(/ /,"",$3);print $3" <- "$2}' notes/knowledge-map.md
  P0 <- 从零写harness      P0 <- Agent系统设计模板    P2 <- Agent可观测
  P0 <- RAG与检索          P2 <- 长期记忆             P1 <- durableexecution
  P0 <- 评测工程化          P1 <- MCP协议+供应链安全   P1 <- API实操+多模型路由
  P1 <- 数据飞轮           P2 <- 模型基础             P2 <- 框架生态
  P0 <- 多智能体编排        P0 <- 沙箱与凭据
  $ grep -n "domain: '\|stage: 'P" site/src/data/course-structure.ts
  168:    stage: 'P1',   169:    domain: '沙箱与凭据',
  202:    stage: 'P1',   203:    domain: '评测工程化',
  219:    stage: 'P1',   220:    domain: '多智能体编排',
  255:    stage: 'P2',   256:    domain: 'API 与多模型路由',
  291:    stage: 'P3',   292:    domain: '长期记忆',
  308:    stage: 'P3',   309:    domain: '数据飞轮',
  ```
- 影响：`/learn`（读 `stage`）与 `/map`（**原文渲染** `knowledge-map.md`，`:51` 声明「改笔记即同步」）对同一课给出相反的先后答案。以「沙箱与凭据」为例：按 `/map` 是最高优先级 P0（应早学），按 `/learn` 是 P1（在 P0 五课之后）。考生/学习者据不同入口会**排错学习顺序**，且会误以为「P0 我已完成」而跳过实际被排在后段的课。
- 建议方向：两套标签改名区分（如阶段 `阶段 S0–S4` vs 优先级 `优先 P0–P2`），或把 legacy 优先级列整体迁移为阶段口径后删除旧列。
- 置信度：高｜两处均为逐行实读，且冲突计数由命名表与 stage 字段逐条比对得出，不依赖任何他人报告。

### PED-F2｜笔记 mermaid 依赖图与站点 `prereqs` 在 ≥6 条边上不一致：同一问题两张依赖图（**high**）
- 严重度：high
- 对象：`notes/knowledge-map.md:103-126`（mermaid 边）＋ `site/src/data/course-structure.ts:189,223,276,295,329,348`
- 原文引文：
  - `notes/knowledge-map.md:109` → `HARNESS --> MCP`（图中 MCP 只依赖「从零写 harness」）
  - `site/src/data/course-structure.ts:189` → `prereqs: ['sandbox'],`（站点要求先学沙箱）
- 现象：`/map` 与 `/learn` 都在回答「MCP 要先学什么」，答案不同。逐条比对差异：MCP（图：HARNESS；站点：sandbox）、多智能体（图：SYSDESIGN+EVAL；站点：system-design+harness-from-scratch，**丢了 EVAL 边**）、可观测（图：无入边、仅虚线到 INTERVIEW；站点：api-engineering）、长期记忆（图：无入边；站点：rag）、模型基础（图：无入边；站点：llm-timeline）、框架生态（图：无入边；站点：agent-harness）。
- 证据：
  ```
  $ node - <<'EOF'   # 从 course-structure.ts 提取 slug/stage/prereqs/next，校验拓扑与线性序
  05 sandbox              P1 prereqs=[harness-from-scratch] ok next=mcp
  06 mcp                  P1 prereqs=[sandbox] ok next=evaluation
  07 evaluation           P1 prereqs=[rag] ok next=multi-agent
  08 multi-agent          P1 prereqs=[system-design,harness-from-scratch] ok next=durable-execution
  11 observability        P2 prereqs=[api-engineering] ok next=long-term-memory
  12 long-term-memory     P3 prereqs=[rag] ok next=data-flywheel
  14 model-basics         P3 prereqs=[llm-timeline] ok next=framework-ecosystem
  15 framework-ecosystem  P4 prereqs=[agent-harness] ok next=industry-2026
  EOF
  （上列为站点侧；图侧为逐行实读 `knowledge-map.md:103-126`）
  ```
- 影响：读者想确认「沙箱是不是 MCP 的前置」时会得到相反答案；按图学的人会跳过沙箱直接上 MCP，而 MCP 课自身的 `prerequisiteNote:196` 明确写「已上完沙箱与凭据（上一课带入 policy 门/egress 直觉）」——**课内声明与图上声明对冲**。
- 建议方向：让 `prereqs` 成为依赖图唯一真源，笔记 mermaid 由数据生成或加「与课程页 prereqs 对齐」的机器校验。
- 置信度：高｜两处均逐行实读；站点侧由自跑脚本输出确认，图侧为阅读结论。

### PED-F3｜`knowledge-map.md` 内部两处「建议开课顺序」互相矛盾，且都不等于站点线性序（**high**）
- 严重度：high
- 对象：`notes/knowledge-map.md:128` 与 `notes/knowledge-map.md:162`
- 原文引文：
  - `:128` → `**建议开课顺序**:系统设计 → 多智能体编排 → 沙箱与凭据(续 §S2)→ 评测工程化 → …`
  - `:162` → `[interview-bank §7 并入] 开课顺序确认（当前建议：系统设计 → 沙箱与凭据（续 S2）→ 评测工程化 → …`
- 现象：同一文件两处「建议开课顺序」的第 2 位不同（`:128` 是多智能体编排，`:162` 直接跳到沙箱与凭据），且两处都不含站点 `/learn` 的起点「LLM 时间线」与「从零写 harness」。
- 证据：仅阅读 `notes/knowledge-map.md:128` 与 `:162`（两行并列可直读）。
- 影响：读者在 `/map` 同一页内看到两段「当前建议」；`/learn` 又给出第三种顺序。学习者无法确定「第一条命令/N 天该读哪课」。
- 建议方向：全站只保留一份顺序定义（建议以 `COURSE_STRUCTURE` 数组序为唯一真源），其余位置改为指针引用。
- 置信度：高｜纯阅读，两行原文并列即可复现。

### PED-F4｜「横向资产不挂阶段」的口径说明，与同一页把行业调研渲染进 P4 阶段自相矛盾（**high**）
- 严重度：high
- 对象：`site/src/pages/learn.astro:281-284` vs `site/src/pages/learn.astro:121,127,150`；旁证 `site/src/pages/nav.astro:21` vs `nav.astro:106-109`
- 原文引文：
  - `learn.astro:282` → `<strong>横向知识</strong>：LLM 发展史与演进、行业调研等不挂在任一阶段上，见`
  - `learn.astro:127`（渲染循环内）→ `<span class="chip chip-strong">{course.stage}</span>`，而 `course-structure.ts:361-362` 给 `industry-2026` 的 `stage: 'P4'`
- 现象：`/learn` 的「口径说明」声明行业调研**不挂在任一阶段**，但同页 `STAGES.map(...)` 正把 `行业前线调研` 卡片渲染在 **P4 收口与前沿**分区里，并同时打上「横向资产」chip（`mvp.status === 'asset'`，`:150`）；`/nav:21` 也声明该横向知识「位于 P0 之前」，而 `/nav` 自己的五阶段导航把 `LLM 时间线` 列进 **P0** 组（`nav.astro:106-109`，带「横向」chip）。
- 证据：
  ```
  $ grep -n "横向知识\|位于 P0\|不挂在任一阶段" site/src/pages/nav.astro site/src/pages/learn.astro
  nav.astro:21:    LLM 发展史与演进是贯穿全站的<strong>横向知识</strong>（位于 P0 之前）——
  learn.astro:282:  <strong>横向知识</strong>：LLM 发展史与演进、行业调研等不挂在任一阶段上，见
  $ grep -n "domain: '\|stage: 'P" site/src/data/course-structure.ts   # 横向项仍带 stage
  361:    stage: 'P4',   362:    domain: '行业前线调研',
   96:    isHorizontal: true,   # llm-timeline，stage: 'P0'（:85）
  ```
- 影响：学习者看到一张 **P4 卡片上挂着「横向资产」**、而口径说明说它不属任何阶段，无法判断「行业调研算不算这条路径的一部分、P4 要不要学它」。也直接影响第 1 问「先学什么」——P0 里那门「LLM 时间线」到底是必读序章还是可选横向。
- 建议方向：二选一并全站统一——要么横向课不进阶段分区（渲染时排除）、要么删掉「不挂在任一阶段」的口径句。
- 置信度：高｜「行业调研」一项是无争议的直接矛盾（`stage: 'P4'` 有明文）；「LLM 发展史与演进」若指 `/nav` 资产则属措辞歧义，已在现象中分开陈述。

### PED-F5｜`模型基础` 的前置错配：`prereqs` 指向 agent 视角时间线，技能储备却要求另一份「模型史」资产（**high**）
- 严重度：high
- 对象：`site/src/data/course-structure.ts:329` 与 `:335-336`
- 原文引文：
  - `:329` → `prereqs: ['llm-timeline'],`
  - `:336` → `'已上完 LLM 发展史与演进（上一课带入「模型是会持续换代的组件」时间轴：GPT 系 / o1 推理模型 / 开源系的代际差异）…'`
- 现象：`prereqs` 是 `llm-timeline`（域名「LLM 时间线」，`intro` 自述为 *agent 开发者视角* 的 12 节点），而 `prerequisiteNote` 要求的是「LLM 发展史与演进」——按 `course-structure.ts:94` 的明文，那是 `mvpSlug=llm-history`（`/nav` 的 10 节点 + 5 代演进），两资产被作者自己声明为**互补但不同**（「模型史 vs agent 史」）。
- 证据：仅阅读 `course-structure.ts:83-96`（llm-timeline 定义＋llm-history 对照说明）、`:323-337`（model-basics），以及 `nav.astro:15-24`（`/nav` 自称 LLM 发展史与演进）。
- 影响：学习者点课程页「前置知识」链接（`c/[slug].astro:79-84`）只会到达 agent 时间线，拿不到被声明的「GPT 系 / o1 / 开源系代际」；`c/[slug].astro:90` 又把同一段渲染成「技能储备」标签，进一步让人以为两处指同一资源。
- 建议方向：`prereqs` 改为 `llm-history`（或把该课前置说明改写为「读 /nav 五代演进」并同步链接）。
- 置信度：中高｜两字段逐行实读、且作者已在 `:94` 区分两资产；未核 `/nav` 与 agent 时间线的内容重合度（未读 `llm-timeline.md` 全文）。

### PED-F6｜完成判据两种坏形态并存：2 门课不可判定，14 门课衡量的是「参考实现能跑」而非学习者（**high**）
- 严重度：high
- 对象：`site/src/data/course-structure.ts:127`（agent-harness）、`:159`（system-design）、`:110,143,177,194,211,228,247,264,281,300,317,334,353`（另 13 门）
- 原文引文：
  - `:127` → `'…；判定 = 能对照 harness-demo 画清分层并讲清每层为什么存在'`
  - `:110` → `'…判定 clone 能跑 = cd harness-demo && npx tsx src/test-compact.ts 复现压缩 1378→426 tokens…'`
- 现象：17 门课里 **2 门**（Harness 架构、系统设计）的「判定」只有口语型标准（「画清」「讲清」「套模板讲完整条」），没有可证伪动作；**14 门**的判定统一是「clone 参考样本并复现作者写死的数字/断言」——这对「仓库是否可跑」可证伪，但**不检验学习者能否独立产出该能力**，与同字段抬头「实际输出（`c/[slug].astro:99`）」的语义（学员产出）不匹配。另有 `llm-timeline:94` 的判定是「npm run build 后 /c/llm-timeline 渲染出 12 节点表」——用站点构建当学习判据。
- 证据：
  ```
  $ grep -n "判定" site/src/data/course-structure.ts
  110: …判定 clone 能跑 = cd harness-demo && npx tsx src/test-compact.ts 复现压缩 1378→426 tokens…
  127: …判定 = 能对照 harness-demo 画清分层并讲清每层为什么存在
  159: …判定 = 拿到一个需求能套模板讲完整条「需求→组件→权衡」
  211: …判定 clone 能跑 = cd rag-demo && npm run demo:eval 复现 recall@3=0.31…
  （共 16 条命中；其中 14 条为「判定 clone 能跑 = …」，2 条为口语型，1 条为 build 型）
  ```
- 影响：读者无法判定自己是否「学完 Harness 架构/系统设计」（会自行宣布完成）；对另外 14 门，任何能跑 `npm run demo` 的人（甚至没读讲义的人）都会自认达标——**误判完成度**，且 `llm-timeline` 的判据要求 `npm run build`，而 `knowledge-map.md:18` 自己写「本机 `astro build` 不稳定…曾被杀」。
- 建议方向：把「参考样本可复现」与「学习者可自查」拆成两个字段；后者按每课给可交付物 + 反向自测题（题库已有）。
- 置信度：高｜`grep -n "判定"` 全量命中已逐条分类计数。

### PED-F7｜`flywheel`/`model-basics`/`api` 三门课正文仍写「demo 目录尚未存在/规划判据」，而站点与文件系统声明已实现（**high**）
- 严重度：high
- 对象：`notes/data-flywheel.md:327`、`notes/model-basics.md:354`、`notes/api-engineering.md:260` vs `site/src/data/mvps.ts:108-133`、`site/src/data/course-structure.ts:264,317,334`
- 原文引文：
  - `notes/data-flywheel.md:327` → `**实跑判据（本课，规划态三样，目录由下游建成）**：…\`flywheel-demo/\` 尚未存在——clone 判据在规格 §5 定义、下游建成后生效`
  - `site/src/data/mvps.ts:120-122` → `status: 'done',` / `statusLabel: '✅ 已实现',` / `artifact: 'flywheel-demo/（脱敏台账 → filter/label 两轮降噪 → 指标 → 门禁 四模块 + 10 断言自测）'`
- 现象：三门课的正文「实跑判据」块停留在重建前的规划态措辞（flywheel、model-basics 写「目录尚未存在」，api 写「规划判据 = cd api-demo…」），而 `mvps.ts` 三态标记为 `done`、`course-structure.ts` 的 `practicalOutput` 已写「判定 clone 能跑 = cd <demo> && npm run demo」；`mvps.ts:16-17` 的注释同样还把它们列为「规划态（api / flywheel / model-basics）」。
- 证据：
  ```
  $ grep -rn "尚未存在\|规划态" notes/*.md
  notes/data-flywheel.md:327:…\`flywheel-demo/\` 尚未存在——clone 判据在规格 §5 定义、下游建成后生效…
  notes/model-basics.md:354:…\`model-basics-demo/\` 尚未存在——clone 判据在规格 §5 定义、下游建成后生效…
  $ for d in flywheel-demo model-basics-demo api-demo; do [ -d "$d" ] && echo "EXISTS $d"; done
  EXISTS flywheel-demo   EXISTS model-basics-demo   EXISTS api-demo
  ```
- 影响：学院读到正文「尚未存在」直接跳过实跑验收，或反过来在课程页看到「判定 clone 能跑」后以为正文过时——同一门课的**完成判据在正文与站点口径上互相否定**，属「读者据此误判完成度/可用性」。
- 建议方向：正文「实跑判据」块与 `mvps.ts` 状态同步（或在正文改为指针「状态见站点参考样本」以免二次漂移）。
- 置信度：高｜三条 grep 命中 + 目录存在于文件系统，均为自跑输出；`api-engineering.md:260` 单独看是「已实现判据 + 规划判据」并存，措辞比另两门温和，故本 finding 以 flywheel/model-basics 为主、api 列入波及点。

### PED-F8｜数据飞轮的判据声明「指标…单调可解释」，与正文/参考样本的「第二轮全面退步」矛盾（**medium**）
- 严重度：medium（若按「同一事实 ≥2 处矛盾」计则触 high，但两处均为过程描述、不致错误行动，故取 medium）
- 对象：`site/src/data/course-structure.ts:317`＋`:315` vs `notes/data-flywheel.md:285,305-306`、`flywheel-demo/README.md:38`
- 原文引文：
  - `course-structure.ts:317` → `复现「脱敏台账样本 → filter/label 两轮降噪 → 指标 precision/f1/errors 单调可解释」断言`
  - `notes/data-flywheel.md:285` → `precision **0.304 → 0.272**、recall 0.960 → **0.880**、f1 0.462 → 0.415、accuracy 0.676 → 0.654——**相对第一轮全面退步**`
- 现象：「单调」与列出的三点序列 `0.256→0.304→0.272` 直接冲突；参考样本自身也在 `flywheel-demo/README.md:38` 写明 `v2→v3 … 指标退步但 attributable=false`，其断言 `flywheel-demo/src/assert.ts:146` 只检查 `m2.precision > m1.precision`（单步），并非全程单调。
- 证据：
  ```
  $ grep -n "precision\|单调" notes/data-flywheel.md
  279: …precision **0.256 → 0.304**（相对 +18.8%）…
  285: …precision **0.304 → 0.272**…**相对第一轮全面退步**…
  327: …指标 precision/f1/errors 单调可解释」断言…
  $ grep -n "单调\|退步" flywheel-demo/README.md
  38: …`v2→v3` prompt + golden set 双变量叠加 → 指标退步但 `attributable=false`…
  ```
- 影响：学员按字面自查「指标是否单调」会判定参考样本不合格/自己复现失败；与课程强调的「分母纪律/不把退步归给 prompt」教学重点相冲。
- 建议方向：判据改为「指标变化可归因（每轮 edits 与指标升降一致）」这类可证伪表述。
- 置信度：高｜数字与「退步」结论均引自正文与参考样本文本。

### PED-F9｜13 处 `技能储备` 里的「上一课带入 X」有 10 处与 `/learn` 线性序不符（**medium**）
- 严重度：medium
- 对象：`site/src/data/course-structure.ts:144,179,213,230,249,266,302,319,336,355`（另 3 处 `:128,:196,:283` 正确）
- 原文引文：
  - `:213`（评测工程化）→ `'已上完 RAG 并跑过 rag-demo（上一课带入 recall@k / golden set / 错误归因三件直觉）…'`
  - 自跑输出：`07 evaluation  prev=mcp  HAS | 已上完 RAG 并跑过 rag-demo…`
- 现象：`learn.astro:186-188` 明确把站点顺序定义为「线性序 #1→#17，每门课 next = 线性序 + 1」；`c/[slug].astro:110-113` 也把 `next` 渲染成「后续课程」。在这一口径下「上一课」= 数组前一项。实测 13 处含「上一课」的 `prerequisiteNote` 中 **10 处**指的并非数组前一项（rag→说是 harness、sandbox→harness、evaluation→RAG、multi-agent→系统设计、durable→harness、api→harness、memory→RAG、flywheel→评测、model-basics→LLM 发展史、framework→agent-harness）；仅 agent-harness、mcp、observability 三处正确。
- 证据：
  ```
  $ node - <<'EOF'  # 提取 prerequisiteNote，与线性序前一项对照
  03 rag                  prev=agent-harness        HAS | 已能跑通 harness-demo（上一课带入…）
  07 evaluation           prev=mcp                  HAS | 已上完 RAG 并跑过 rag-demo（上一课带入…）
  08 multi-agent          prev=evaluation           HAS | 已上完系统设计（上一课带入…）
  12 long-term-memory     prev=observability        HAS | 已上完 RAG 与检索（上一课带入…）
  14 model-basics         prev=data-flywheel        HAS | 已上完 LLM 发展史与演进（上一课带入…）
  EOF
  ```
- 影响：严格按 `/learn` 线性序学习的人，在进入第 7 课（评测）时被告知「上一课带入 recall@k」，但上一课实际是多智能体编排——学习者误判自己的前置是否达成，也可能据此认为顺序可有可无。
- 建议方向：措辞改为「前置课（<域名>）带入」并跟 `prereqs` 同源，或直接由 `prereqs[0]` 生成。
- 置信度：高｜现象由自跑脚本逐条比对得出（现象层面 10/13）；「上一课」是否应等于线性前一项取决于口径，已在影响中限定为「按 `/learn` 自述的线性序口径」。

### PED-F10｜JD 覆盖矩阵的完成判据「目标全 🟢」被矩阵自身的 ⚪ 行证伪（**medium**）
- 严重度：medium
- 对象：`notes/knowledge-map.md:172` vs `notes/interview-bank.md:98`
- 原文引文：
  - `knowledge-map.md:172` → `- [ ] JD 关键词覆盖：见 \`interview-bank.md\` 矩阵（目标全 🟢）`
  - `interview-bank.md:98` → `| A2A / agent 身份 | —（观察级） | 未排课 | ⚪ 按 roadmap 保持观察 |`
- 现象：`knowledge-map.md:156` 声明「未结事项」是「全站待办的唯一事实源」，而该清单把「矩阵全 🟢」当作可勾选的完成判据；矩阵自身有一行明确为 ⚪ 且课程列为「未排课」。该待办在其现行定义下**不可能被勾选**。
- 证据：
  ```
  $ grep -n "目标全 🟢" notes/knowledge-map.md
  172:- [ ] JD 关键词覆盖：见 `interview-bank.md` 矩阵（目标全 🟢）
  $ grep -n "A2A" notes/interview-bank.md
  98:| A2A / agent 身份 | —（观察级） | 未排课 | ⚪ 按 roadmap 保持观察 |
  ```
- 影响：接手者/考生把「全绿」当验收线，会长期处于「未完成」状态或误判为待修复缺陷；也不清楚 🟡 是否仍存在（矩阵现值全为 🟢/⚪，而 `:100` 的「补强优先级（把 🟡 变 🟢）」标题仍在）。
- 建议方向：判据改为「除 ⚪ 观察项外全 🟢」并显式列出豁免。
- 置信度：高｜两点均为逐行实读。

### PED-F11｜交叉题 §4 的「断链检测」归属与站点 `courses.ts` 反向归属不一致；记忆投毒锚点指向 S5（**medium**）
- 严重度：medium
- 对象：`notes/interview-bank.md:66,71,73` vs `site/src/data/courses.ts:79,110,132,162,164,226,239`；`notes/long-term-memory.md:178`（S5）与 `:242`（S7）
- 原文引文：
  - `interview-bank.md:73`（#8 的断链检测）→ `| 沙箱与凭据 §S4 + 框架生态 §S4 + 系统设计 §S3 |`
  - `courses.ts:110`（multi-agent 挂 #8）→ `{ no: '§4-#8', text: '多 agent 编排里，子 agent 的权限、凭据、trace 分别怎么管？', anchorPrefix: '4. 交叉快速问答' },`
- 现象：同一道题，两侧给出的「考哪些课」不同。#8：题库说 沙箱/框架生态/系统设计，`courses.ts` 说 多智能体编排/框架生态/MCP/系统设计（题库未列多智能体——而这恰是该题的课）；#1：题库说 MCP/沙箱/从零写 harness，`courses.ts` 说 Harness 架构/MCP/行业前线调研（沙箱缺失、行业调研加入）。另 `interview-bank.md:71` 的 #6 把「记忆投毒」指向「长期记忆 §S5」，而该课 S5 是「冲突消解与遗忘」、S7 才是「安全：记忆是注入的跨会话持久化通道（必考深度）」。
- 证据：
  ```
  $ grep -n "^## S" notes/long-term-memory.md
  178:## S5 冲突消解与遗忘（一致性治理）
  242:## S7 安全：记忆是注入的跨会话持久化通道（必考深度）
  $ awk '/投毒/{print NR}' notes/long-term-memory.md | head   # 命中集中在 S6/S7 段落
  244/246/256/… （S7）
  ```
- 影响：考生按「断链检测」复习时会去读不覆盖该题的课/节，且会漏掉真正的主场课（#8 漏多智能体编排、#1 漏沙箱）；按 courses.ts 的「相关面试题」反查又会得到不同集合。
- 建议方向：`courses.ts.relatedQuestions` 与题库「断链检测」列二选一作为真源，另一侧改为引用；#6 锚点改 §S7。
- 置信度：中｜归属差异为逐行实读；「§S5 应为 §S7」依赖对两节主题的判断（S7 标题为明文），未读 S5 全文。

### PED-F12｜`interview.astro` 分组题数标签错：§3.2+§3.3 标「10 题」，实际 9 题（**medium**）
- 严重度：medium
- 对象：`site/src/pages/interview.astro:47`
- 原文引文：`chip: '§3.2 / §3.3 · 10 题取 3',`
- 现象：`interview-bank.md` 中 §3.2 有 Q1–Q5（5 题）、§3.3 有 Q1–Q4（4 题），合计 **9**；同页其他分组标签均与实际一致（§3.1「5 题」、§3.4/§3.5「8 题」、§4「10 题」、§8「5 题」），仅此一处多算 1。
- 证据：
  ```
  $ for h in "3.1 FinHot" "3.2 FinHot" "3.3 backfill" "3.4 harness" "3.5 rag"; do
      awk -v h="$h" 'index($0,"### "h)==1{f=1;next} /^### |^## /{f=0} f&&/^- Q/{c++} END{print h" -> "c+0}' notes/interview-bank.md; done
  3.1 FinHot -> 5   3.2 FinHot -> 5   3.3 backfill -> 4   3.4 harness -> 4   3.5 rag -> 4
  ```
- 影响：复习者以为该组有 10 题可抽（实际 9），按「10 题取 3」估复习量不准；也削弱「题号可回溯」的可信度。
- 建议方向：改为「9 题取 3」，或把该标签从数据派生（像 `STAGE_COUNTS` 那样）。
- 置信度：高｜题数由自跑 awk 逐节统计。

### PED-F13｜`details/06` 在「未覆盖」标题下写「已落地」——专题页自查声明与内容相反（**medium**）
- 严重度：medium
- 对象：`notes/details/06-observability-loop.md:27`
- 原文引文：`- 未覆盖:OTel 埋点已落地(harness-demo \`demo:otel:mock\` 离线 mock 实测 **15 spans/1 trace**,2026-10-12;…);仍缺 getEvents() 式"位置切片重放"的 API 示例…`
- 现象：该篇「本地映射」的两条目是「已覆盖 / 未覆盖」（`:26` 为「已覆盖：…」），但「未覆盖」这条以「OTel 埋点已落地」开头——把一项**已完成**的能力写在「未覆盖」清单里，随后才接「仍缺 …」的真实缺口。同页形状与其余 7 篇「未覆盖」条目（只列缺口）不一致。
- 证据：仅阅读 `notes/details/06-observability-loop.md:26-27`（对照 `:22` 的「行业一手源」与 `:14` 的「一句话定义」）。
- 影响：读者（尤其按「未覆盖=待补」扫清单的人）会把「OTel 埋点」误登记为缺口，或反过来怀疑「未覆盖」段不可信，从而误判该专题的覆盖状态。
- 建议方向：把「已落地」事实移入「已覆盖」条，「未覆盖」只留 `getEvents()` 位置切片与控制台产物两项。
- 置信度：高｜单篇逐行实读，标题与内容直接对照。

### PED-F14｜`details/02` 的「行业一手源」URL 自认由引用推断，与「一手源」标题不符（**low**）
- 严重度：low
- 对象：`notes/details/02-tool-granularity.md:20-22`（frontmatter `:5-6`）
- 原文引文：`Anthropic《Writing Tools for Agents》：工具定义即契约…（注：此 URL 由引用推断，要点已对照已核验的上下文工程文章与《Building Effective Agents》。）`
- 现象：小节标题写「行业一手源」，但正文自认该 URL 是推断而非实抓；同类 `details/01/04/05/06/07/08` 的源均为直引官方文章。
- 证据：仅阅读 `notes/details/02-tool-granularity.md:20-22` 与 `:5-6`（`status: "稳定历史"`）。
- 影响：专题页自称「行业一手源」，接手者会把它当可直接引用的出处；本条的 `status` 是「稳定历史」故未违反 `course-structure.ts:370` 对 `[2026现行]` 的判据，但标题与附注仍相互削弱。（真伪核实建议交 `fact-timeline`。）
- 建议方向：附注前置到标题行，或改标题为「行业来源（URL 待核）」。
- 置信度：高｜逐行实读。

### PED-F15｜白板题规模三处不一致：实际 178 行 / 两处「~180 行」/ 两处「~150 行」（**low**）
- 严重度：low
- 对象：`site/src/data/courses.ts:137`、`notes/knowledge-map.md:146` vs `notes/harness-from-scratch.md:6,214`
- 原文引文：
  - `courses.ts:137` → `intro: '~180 行纯标准库 Python 白板版 agent，与 harness-demo 1:1 对应，20 分钟白板题骨架',`
  - `notes/harness-from-scratch.md:214` → `## ⑩ 白板蒸馏（\`whiteboard/agent_whiteboard.py\`，~150 行纯标准库）`
- 现象：该作品承担「20 分钟白板题」的难度/时长声明（`interview-bank.md:20` 白板 15′），但其规模有 150/180 两个版本，实测 178 行。
- 证据：
  ```
  $ wc -l whiteboard/agent_whiteboard.py
  178 whiteboard/agent_whiteboard.py
  ```
- 影响：用「~150 行」估算白板工作量会低估约 19%；难度声明依据不一致。
- 建议方向：统一按实测 178 行（或写「<200 行」）并只留一处数字。
- 置信度：高｜自跑 `wc -l`。

---

## 正面确认

1. **课程拓扑是自洽的（本视角主动查证、未发现问题）**：自跑脚本逐课核验 `prereqs` 全部 ⊆ 更早 order（17/17 `ok`）、`next` 全部等于数组 `order+1`（17/17 无 `BAD_NEXT`）；17 个 slug 逐一对应存在的 `notes/<slug>.md`（17/17 `OK`）。即 `course-structure.ts:9-11`「按 §3 线性阅读序 / 已校验拓扑序」这一步本身没坏。
2. **题库题量口径自洽**：`interview-bank.md` 逐节实测 §3.1=5、§3.2=5、§3.3=4、§3.4=4、§3.5=4（§3 合计 22）、§4=10、§8=5，与 `knowledge-map.md:17`「面试题库精选 **37** 题（§3 22 + §4 10 + §8 5）」完全一致；`interview.astro` 的 top 15 = 5 组 × 3 题亦对得上。
3. **锚点机制不会静默失效**：`courses.ts` 的 `anchorPrefix`（`3.1 FinHot 幽灵事故`/`3.2 FinHot labeler`/`3.3 backfill`/`3.4 harness-demo`/`3.5 rag-demo`/`4. 交叉快速问答`/`五道标准题`）与 `interview-bank.md` 的实际小节标题逐一对齐；`interview.astro:23-29` 的 `idOf()` 与 `courses.ts:20-21` 均声明解析失败即构建失败（fail-fast）。
4. **`details/*.md` 的节号交叉引用全部指得到**：`grep -n '^##* '` 核验后，「Harness 架构 §5.1/§3.1/§6.1/§7.1/§9.1/§9.2/§9.3/§10.2/§8.2/§8.3」在 `agent-harness.md` 均存在；`「从零写 harness §③/§④/§⑤/§⑥/§⑦/§⑧/§⑨/§⑩」`均存在；`mcp.md` 的 `§S2.1`（`:64`）也真实存在——`knowledge-map.md:74` 的该条引用无误。
5. **课程→参考样本映射闭合**：17 门课声明的 `mvpSlug`（harness-mvp / rag-mvp / sandbox-mvp / mcp-mvp / durable-execution-mvp / obs-mvp / memory-mvp / framework-mvp / api-mvp / flywheel-mvp / model-basics-mvp / llm-history / industry-research）逐一命中 `mvps.ts:40-152` 的词表；`mvpStatusOf` fail-fast 设计使漂移会在构建期暴露。
6. **课程页会渲染全部教学字段**：`c/[slug].astro:71-119` 逐项渲染「前置知识（`prereqs` 链接）+ 技能储备（`prerequisiteNote`）+ 核心概念 + 实际输出（`practicalOutput`）+ 后续课程」——本报告 F5/F6/F9 之所以算问题，前提正是这些字段**真的对读者可见**（已核模板）。

## 转交他人

- `courses.ts:37,50,62,73,83,95,106,116,126,136,147,158,168,180,192,202,212,222,233` 的 legacy `phase: 'P0'|'P1'|'P2'` 与 `course-structure.ts` 的 `stage` 有 9 处不同值（`:300` 声称仅 `'—'` 仍有读方）→ 建议交 **`editorial`**（我已把「P 字母表冲突」升为 PED-F1，此处是**同一根因的源码副本**，请合并去重）。
- `site/src/data/mvps.ts:16-17` 注释仍写「规划态（api / flywheel / model-basics）」，三者在同文件已是 `status: 'done'` → 交 **`editorial`**（与 PED-F7 同根因）。
- `site/src/pages/nav.astro:31`「2017 Transformer → 2025 DeepSeek-R1」与 `notes/llm-timeline.md:3` 的「12 节点（至 2026）」、`llm-history.ts` 实际 10 节点 / 5 代演进（自跑计数）之间的边界是否自洽 → 交 **`fact-timeline`**。
- `notes/details/02-tool-granularity.md:22` 与 `05-hitl-security.md:22` 引用的 URL 是否真实可达、内容是否对得上标题论断 → 交 **`fact-timeline`**。
- `notes/process/*.md`（尤其 `site-refactor-plan.md §2/§3/§4`）是否为「唯一内容源」、与 `course-structure.ts` 是否「逐字一致」→ 交 **`editorial`**（属宪章语料 B，本视角未展开）。
- `/map` 顶部 `DomainMap` 交互视图是否再引入一套阶段/优先级标签（`map.astro:46` 在笔记正文之上插入了组件）→ 交 **`presentation`**。
- JD 覆盖矩阵（`interview-bank.md:85-98`）缺「模型基础 / 多智能体编排 / 行业前线调研」三课独立行，是否算覆盖缺口 → 交 **`editorial`**（判据失实部分已列为 PED-F10）。
