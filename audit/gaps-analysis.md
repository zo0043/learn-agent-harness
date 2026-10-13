# 短板补全方案基线（R1 · requirements）

> 归属任务：t1 / architect · 日期：2026-10-12 · 性质：**只读分析 + 方案设计**。本文件是全团队唯一新写文件（`audit/gaps-analysis.md`），未修改任何被分析文件。
> 用途：本文件是后续三条实现线（W1 长期记忆自研 / W2 三家 SDK 离线对照 / W3+W4 未验证项收口 + CI 结构视觉回归）与独立验证评审（V1/R2/R3）的**契约**。凡本文件写了「验收」的地方，实现者不得自行放宽；要改边界就回到本文件改，不得在实现里就地调判据（全局纪律 #3）。
> 编号沿用审计报告：`U-xx` 引自 `audit/report.md`（2026-10-12 版），本文只做**深度分析 + 可施工方案**，不重复审计报告已下过的事实判定。

---

## 0. 执行摘要

### 0.1 五项短板定性表（一句话版）

| # | 短板 | 准确定性 | 是否真短板 | 仓内能否自证 | 归属实现线 |
|---|---|---|---|---|---|
| A | 长期记忆「有活系统，无自研」 | **真短板**（能力缺失） | 是（缺的是"会说话的子系统"，不是缺测试） | 能（离线、零依赖） | W1 / t2 |
| B | 框架生态「SDK 实操仅 Claude 一家」 | **真短板**（实操证据窄） | 是（B/C 候选明确写"无本地实测，文档级"） | 能（离线 mock 三家） | W2 / t3 |
| C1 | U-23 otel「11 spans/1 trace」 | **真短板**（证据缺口）+ 附口径问题 | 是（仓内唯一产物是 4 字结论） | 能（本地 mock 端点 → 确定 span 树） | W3 / t4 |
| C2 | U-24 framework「11/11 断言」 | **纯标注问题**（口径口径不一致） | 否（能力本身存在） | 能（数 `ok()` 即可） | W2 / t3（与本线同文件，一次改完） |
| C3 | U-25 FinHot 生产数字 | **标注/转述问题**（仓外证据） | 半（数字本身无法仓内验证，但"转述丢限定"是可修缺陷） | 只能**如实降级标注**，不能自证 | W3 / t4 |
| C4 | U-26 外部时点事实 | **真短板**（可修：本环境有出网能力） | 是（已实测到与仓库表述矛盾的现行版本） | 能（`npm view` / 官方 URL，须记时间与来源） | W3 / t4 |
| D | 上轮 20 任务无独立评审 | **流程短板**（真实） | 是（量化：0/20 有独立评审，4/17 实现由同一人自验） | 能（本轮已排 t7/t8/t9；缺的是**制度**而非能力） | W5 / t6（写进口径与流程条） |
| E | 2 核 3.4GB → astro build 曾多次 OOM（exit 134/137，曾留 85 文件/0 HTML 残骸；**2026-10-13 t21 独立实测证伪「必然 OOM」：本机可约 17 分钟成功（首次 560s 超时非 OOM），可行但不可依赖，CI 为可靠路径**），视觉留目检 | **基础设施短板**（环境约束） | 是，但**不可在本机消除**（极慢/超时风险） | 本机不能；**能降级到 CI**（headless 结构+视觉断言） | W4 / t5 |

### 0.2 本轮的"止血 vs 收口"边界（先说清代价）

- A/B/C1/C4 可以做到**离线可跑、仓内自证**：全部证据来自 `npx tsx` / `node` / `npm view`，不依赖任何真实模型会话。
- C3 永远无法仓内自证（数据源 `FinHot/.data/eval/*` 不在仓库、且 `.gitignore` 明确排除 `jd-research/` 之外的仓外数据）。**本方案对 C3 的唯一正确动作是把限定写回去**，任何"补一个数字"的动作都是造假。
- E 在本机**不可依赖**（2026-10-13 t21 独立实测：本机全量构建可约 17 分钟成功，首次 560s 超时非 OOM——可行但极慢/超时风险，不作证据通道；2 核 / MemTotal 3400MB / `available≈1.5GB` 实测见 §5）。本方案不承诺"本机能 build 出 dist"，而是承诺"**CI 上必须有可失败的结构与视觉断言**"，并把本机目检降级为"非证据"。

### 0.3 一句话结论

四项（A/B/C1/C4）走**离线自证**、一项（C3）走**如实降级**、一项（D）走**制度落位**、一项（E）走**CI 迁移**；全部方案**不新增第 7 个作品**、**不改冻结算术**、**不触碰 rag §13 数字**（唯一触及语料成员的 W3 已写明必须重跑 eval）。

---

## 0.4 环境边界（本环境做不到的事——边界诚实性清单）

| # | 做不到 / 不得声称 | 实测或规则依据 | 因此必须降级为 |
|---|---|---|---|
| 1 | **不得以"实跑真实模型"作为交付证据** | 团队约束原文；另 `handoff.md` §五.3 记录该代理**模型列表会轮换**（`qwen3.8-flash` 已下架→`qwen3.8-flash-next`），今天 200 不能保证明天 200，不可复现即不可作证据 | 全部演示与断言必须能在**本地 mock 端点**下跑出确定结果（`harness-demo/src/test-compact.ts:6-8` 已是仓内范式：`LLM_BASE_URL=http://127.0.0.1:8787/v1`） |
| 2 | 本机 `cd site && npm run build` 产不出完整 dist | 实测：`site/dist` 现存 85 个文件、**HTML 文件数 = 0**、3.0M、mtime `2026-10-12 14:14`——典型的"vite 客户端阶段被杀死"残骸；`site/build.sh:4-11` 自述本机 astro build 会吃满一核、RSS ~1.3GB 把整机拖进 swap | 构建产物一类断言（页面数/HTML 数/搜索索引）**一律留 CI**；本机只允许跑不依赖 dist 的离线断言 |
| 3 | 整页视觉在本机不可代验 | 同上 + 无可用图形栈；`viz/mermaid-check.mjs:6` 硬编码读 `site/dist` → **本机 dist 无 HTML 时该检查必然徒劳** | 视觉类断言进 CI（headless chromium + 三视口），本机只跑"结构断言"（DOM/属性/尺寸计算），并显式标注"视觉留 CI 目检" |
| 4 | 仓外生产数据不可核 | `FinHot/.data/eval/selection-all-200-*.json`（`#35`）不在仓库（`notes/data-flywheel.md:222-223`） | FinHot 全部数字**永久标注"仓外证据（#35）"**，并保留 45 行口径差限定；不得改数 |
| 5 | 上轮"20 个任务"的会话过程不可复核 | 会话数据在 `.agent-teams/`（`.gitignore:44` 排除） | 流程类结论只引用**可数的事实**（任务数/kind/assignee），不引用对话内容 |

### 0.4.1 对约束本身的一处实测修正（重要，请 captain 决策）

约束原文说「本环境**无任何 LLM key 与可用端点**」。实测**不完全成立**：

```bash
# 只探测可达性，不打印密钥（key 长度 38）、不发起任何 chat 补全
HOST=$(grep -m1 '^LLM_BASE_URL=' harness-demo/.env | cut -d= -f2- | sed -E 's#(https?://[^/]+).*#\1#')
KEY=$(grep -m1 '^LLM_API_KEY=' harness-demo/.env | cut -d= -f2-)
curl -sS -o /tmp/models.json -w "models HTTP %{http_code}\n" -H "Authorization: Bearer $KEY" "$HOST/v1/models"
```

结果：`https://api.zero43.top/v1/models` → **HTTP 200**，返回模型列表（含 `DeepSeek-V4-Flash-0731`、`deepseek-ai/DeepSeek-V4.1-Flash`）。也就是说：**"有 key、端点对 /v1/models 可达"是事实**；本次**未**探测 chat 补全是否可用（按第 1 条约束也不得把它作为验收依据）。

因此约束的**可执行版本**应表述为（建议 captain 采用，W5 落进 `handoff.md` 口径块）：

> 证据纪律：**任何交付断言都必须在离线 mock 端点下可复现**；真实代理端点（`harness-demo/.env`）是否存在、是否可用，**不作为任何验收标准**，也不得写进任何"实测"表述。凡"实跑真实模型"的声称一律无效。

补充卫生要求：`harness-demo/.env`、`framework-demo/.env` 均被 `.gitignore` 命中（实测 `git ls-files framework-demo/` 只列出 `.env.example`），**CI 里跑任何 demo 必须注入 mock 端点，永不注入该 key**。

### 0.4.2 本次未做之事（诚实标注）

- 未复跑 `astro build` 来复现 OOM（成本高、且会把 2 核机器拖进 swap，风险大于收益）；OOM 结论采信**转引审计**（`audit/report.md:314`）+ `site/build.sh` 注释 + `site/dist` 残骸三重旁证。
- 未复跑 `cd rag-demo && npx tsx src/evaluate.ts`（132 chunks / 0.31 / 0.44 / 0.50 / PASS 3/8 / 锚点 16/16）：该数值属**转引审计**（`audit/report.md:16`，已验证区），本方案**不重述为自验**；凡需要它们的地方（W3）都写成"必须重跑核对"。
- 未修改 `notes/` 下任何文件、未碰 `site/`、未碰任何 demo 源码。

---

## 0.5 冻结口径与"只读文件"清单（口径影响总表）

**冻结算术（`notes/knowledge-map.md:11-18` 为唯一参照）与本文各方案的关系：**

| 冻结算术 | 现值 | A 长期记忆 | B 框架生态 | C1-C4 收口 | D 流程 | E 视觉 |
|---|---|---|---|---|---|---|
| 可运行 demo 作品 | **6**（`knowledge-map.md:15`） | 不变（原地升级 `memory-redteam/`，**不新建作品目录**） | 不变（三家 SDK 落 **`framework-demo/sdks/`** 子目录，仍是同一个作品） | 不变 | 不变 | 不变 |
| 知识域 | **15**（`:12`） | 不变 | 不变 | 不变 | 不变 | 不变 |
| 课程页 `/c/<slug>/` | **17**（`:13`） | 不变 | 不变 | 不变 | 不变 | 不变 |
| 课内嵌题 | **205 + 37**（`:16`） | 不变 | 不变 | 不变 | 不变 | 不变 |
| rag §13 数字 | **132 chunks / 0.31·0.44·0.50 / PASS 3/8** | 不变 | 不变 | 不变（数字本身不动，只补限定） | 不变 | 不变 |

**口径自身的脆弱点（本方案发现，请勿"顺手修"）**：`knowledge-map.md:15` 把"6"定义为「**有 `npm run demo` 的目录**」，但 `rag-demo/package.json` 只有 `demo:retrieval` / `demo:bm25` / `demo:rag` / `demo:eval`、**没有裸 `npm run demo`**。按字面定义会数出 5 而不是 6。**本方案不动这个定义**（动了就把冻结计数改坏了），只在 `.5` 注明：6 = harness / rag / sandbox / mcp / durable-execution / framework 这六个目录（引用 `knowledge-map.md:15`，不重新定义）。任何实现线不得以"字面定义不成立"为由改计数。

**只读"红线"文件（任何实现线不得写，如需改必须先向 captain 提案并重跑 eval）**：

| 文件 | 为什么 |
|---|---|
| `notes/rag.md` | demo:eval 语料成员（`rag-demo/src/corpus.ts:18`）+ **站点构建期输入**（`site/src/utils/ragStats.ts:45` 从 §13 解析，解析失败即构建失败） |
| `notes/agent-harness.md` | demo:eval 语料成员（`corpus.ts:19`） |
| `handoff.md` | demo:eval 语料成员（`corpus.ts:20`） |
| `notes/interview-bank.md`、`notes/knowledge-map.md`、`notes/framework-ecosystem.md`、`site/src/pages/*.astro`、`site/src/data/courses.ts` | 不是语料成员，但承载冻结算术与 U-24 的口径文字；可写，**只改口径不改数字** |

---

## 0.6 语料纪律总声明（三件语料成员 × 各方案触碰矩阵）

语料成员**只认这三个**（`rag-demo/src/corpus.ts:18-20` 的 `DOCS` 数组，实测三行就是 `notes/rag.md` / `notes/agent-harness.md` / `handoff.md`）：

| 方案 | 是否触及语料成员 | 触及哪个 | 必须执行的重跑与核对 |
|---|---|---|---|
| A 长期记忆自研 | **否** | — | 不涉及；W1 只写 `memory-redteam/**`（非语料） |
| B 三家 SDK 对照 | **否**（源码/README 在 `framework-demo/**`） | — | 不涉及；**但 W3 若改 `handoff.md:162` 的 11/11 口径，就触及 `handoff.md`** → 见下一行 |
| C1 U-23 otel | 否（写 `harness-demo/workspace/out/` 新日志 + 断言脚本） | — | 不涉及 |
| C2 U-24 断言口径 | **否**（若只改 `notes/framework-ecosystem.md` + `interview-bank.md`）；**是**（若同时改 `handoff.md:162`） | `handoff.md` | 触及则必须：`cd rag-demo && npx tsx src/evaluate.ts` → 核对 **132 chunks / recall@3=0.31 · @5=0.44 · @10=0.50 / PASS 3/8 / 锚点解析 16/16**，并且 `notes/rag.md` §13 现状不动（数字不变则 PASS 数不变；变了就是事故，必须定位） |
| C3 U-25 FinHot 标注 | **是**（转述处含 `notes/agent-harness.md:414,455`） | `notes/agent-harness.md` | **必须重跑 eval 并核对上列六项**（改语料 = 改语料的 chunk 边界与锚点命中，锚点 16/16 是最容易掉的一项）；`handoff.md` 若被触及同一处理 |
| C4 U-26 外部事实 | 否（写 `notes/industry-2026.md` 缺口节 + 引用处脚注；`notes/framework-ecosystem.md` 非语料） | — | 不涉及；**但联网核实要写"核实日期 + 来源 URL"，不许写成新的未标来源断言** |
| D 流程制度 | **是**（落点之一就是 `handoff.md` 加"评审制度"条） | `handoff.md` | 触及则必须重跑 eval 并核对六项；替代落位见 §4.5（可只写 `notes/knowledge-map.md` 口径块，避免触碰语料） |
| E CI 结构+视觉回归 | 否（只写 `.github/workflows/*`、`viz/*`、`site/scripts/*`） | — | 不涉及 |

**eval 重跑的唯一命令与判据（W3 触及语料后必须贴原始输出）**：

```bash
cd rag-demo && npx tsx src/evaluate.ts    # 期望：132 chunks / recall@3=0.31 @5=0.44 @10=0.50 / PASS 3/8 / gold 锚点解析 16/16
```

---

## 1. 短板 A：长期记忆「有活系统（pi Magic Context），无自研」

### A.1 证据（file:line）

| # | 证据 | 位置 |
|---|---|---|
| 1 | JD 覆盖矩阵自评 🟡：「pi Magic Context 日常（用过+接口级理解）」→「有活系统，无自研」 | `notes/interview-bank.md:89` |
| 2 | "补强已完成"打钩项指向的产物只有测试套件 | `notes/interview-bank.md:104`、`notes/knowledge-map.md:164` |
| 3 | 现有产物是**回归套件**而非子系统：文件清单 `package.json / test.mjs / src/index.ts / src/memory.mjs / src/redteam.mjs / README.md`（`find memory-redteam -type f`），总 552 行（`cat memory-redteam/src/*.mjs memory-redteam/src/*.ts memory-redteam/test.mjs \| wc -l`） | `memory-redteam/**` |
| 4 | 存储是**内存数组**（`items: []`），无持久化 | `memory-redteam/src/memory.mjs:57-61` |
| 5 | 向量检索是**占位符** `embedding: [0.1, 0.2, 0.3]`；读路径只有 BM25 | `memory-redteam/src/memory.mjs:144`、`:180-201` |
| 6 | 自述边界已经承认这一点：「不是生产记忆系统」「没有数据库、没有 embedding、没有并发控制」 | `memory-redteam/README.md:64` |
| 7 | 探针数 11（`grep -c "id: 'R" src/redteam.mjs`），且探针只断言"防线守住"，**没有任何一条断言端到端演示**（写→注入→召回→遗忘→再召回） | `memory-redteam/src/redteam.mjs` |
| 8 | 对外可运行入口只有 `node test.mjs` / `--ablate`，**没有 `npm run demo`** | `memory-redteam/package.json:7-10` |
| 9 | 会话持久化侧同样没有版本/迁移字段：`harness-demo/src/session.ts` 对 `version` / `schema_version` / `migrat` 的匹配数为 **0**（grep -c = 0） | `harness-demo/src/session.ts:8-25` |
| 10 | "活系统"的锚点表述是**用户日常使用**（pi Magic Context / project-memory / ctx_note / ctx_search），仓内不可能自证 | `notes/long-term-memory.md:6`、`:432`；`notes/framework-ecosystem.md:236` |

### A.2 准确定性

**真短板**。不是"标注问题"——标注是诚实的（`:89` 自己就写了"无自研"）；缺的是**一个能演示、能对比、能复现的自研子系统**。当前 `memory-redteam/` 能回答"我的四道防线守得住吗"，不能回答面试官真正会问的："**你自己的跨会话记忆长什么样？跨会话怎么恢复？升级了怎么办？和 pi 的差异在哪？**"

### A.3 差距量化

| 维度 | 现状 | 目标（可演示子系统的最低线） | 差距 |
|---|---|---|---|
| 打开/演示方式 | `node test.mjs`（测试输出） | `npm run demo`（一次完整生命周期叙事） | **+1 入口** |
| 持久化 | 0（内存数组） | JSONL 落盘 + 跨进程重开 | **+1 存储层** |
| 跨会话恢复 | 无 | `--session-dir`，第二次进程读到第一次的条目并注入 | **+1 恢复路径** |
| 读侧检索 | BM25 单路 | 复用 `rag-demo` 的 HashEmbedder(768) + BM25 + RRF 三路对照 | **+2 路** |
| 遗忘后重开 | 未断言 | 硬删 + 墓碑 + 派生物 redact **跨进程**仍生效 | **+1 断言** |
| 版本/迁移 | 无版本字段 | `schema_version` + 旧版文件可读/明确报错（二选一，不许静默） | **+1 机制** |
| 对照 pi | 只有散文 | 一张"pi = 条目树按活动分支重建 vs 自研 = JSONL+supersede 链"的**机制差异表**（有代码指向） | **+1 表** |
| 探针 | 11 条（防线级） | 11 条保留 + ≥5 条端到端（生命周期级） | **+5 条** |
| 可复现 | 已有（`FIXED_NOW`） | 保持：两次运行输出逐字节一致（`diff` 为空） | 保持 |

### A.4 根因

不是能力缺失，是**目标定错了一档**：上一轮的补强清单原文是"用 pi 的记忆机制做一个『记忆投毒回归测试』脚本"（`notes/interview-bank.md:100-104`），完成物是**测试**；但 JD 矩阵要补的是"**自研**"这一栏（`interview-bank.md:89` 的 🟡 说的是"无自研"，不是"无测试"）。任务定义与目标口径错位 → 交付了正确但不充分的产物。**这是"任务口径未向上游对齐"的典型，不是执行力问题。**

### A.5 补全方案（具体到目录与命令级）

**落位（口径安全）**：**原地升级 `memory-redteam/`**，不新建任何顶层目录。理由：`knowledge-map.md:15` 把"6 个可运行 demo"定义为六个具名目录；新目录 = 第 7 个作品 = 破坏冻结计数。若未来要单列"作品"，必须先把冻结计数提案给 captain 改口径——**本轮不做**。

```
memory-redteam/                     ← 原地升级，仍是同一个作品
├── package.json                    ← 加 "demo": "node demo.mjs"（保留 test/test:ablate）
├── demo.mjs                        ← 新增：一次完整生命周期叙事（叙事化打印，不靠测试框架）
├── src/memory.mjs                  ← 加：JSONL 持久化 + loadStore/saveStore + schema_version + 心跳
├── src/retrieval.mjs               ← 新增：三路检索对照（向量/BM25/RRF），复用 rag-demo 的实现
├── src/pi-compare.ts               ← 新增（可选，纯数据）：pi 机制 vs 自研机制的差异表（供 /map 与文档引用）
├── test.mjs                        ← 保留 11 条 → 追加 ≥5 条端到端探针（R12-R16）
└── README.md                       ← 重写"它能演示什么"，边界段保留并更新
```

**命令级验收（离线、零 key、可重跑）**：

```bash
cd memory-redteam
npm run demo                      # ① 生命周期叙事，退出码 0
node test.mjs                     # ② 原 11 条探针仍全守住，退出码 0（不得回退）
node test.mjs --ablate            # ③ 消融自检仍全敏感，退出码 0（不得回退）
node demo.mjs --session-dir /tmp/m1 && node demo.mjs --session-dir /tmp/m1 --reopen
                                  # ④ 跨进程恢复：第二次进程读到第一次写入的条目并注入
node demo.mjs --session-dir /tmp/m2 > /tmp/a.txt && node demo.mjs --session-dir /tmp/m2 > /tmp/b.txt
diff /tmp/a.txt /tmp/b.txt        # ⑤ 同一目录两次运行输出逐字节一致（确定性，diff 为空）
```

**取舍理由（为什么 A 不选 B）**

| 决策 | 选 A | 不选 B | 理由 |
|---|---|---|---|
| 落位 | 原地升级 `memory-redteam/` | 新建 `memory-system/` 顶层目录 | 新建 = 第 7 个作品，破坏冻结口径；且 memory-redteam 已是该主题的唯一资产，分家会让"测试"与"子系统"两份代码各自漂移 |
| 持久化格式 | **JSONL 追加**（与 `harness-demo/src/session.ts:8-25` 同源语义） | SQLite / 内存 + dump | 本仓已有"JSONL 是唯一事实源、上下文由日志派生"的成文原则与实现；复用同源语义可把"跨会话恢复"讲成一条主线，且零依赖（`memory-redteam/package.json` 现在就是零依赖，加 DB 依赖会引入安装/CI 风险） |
| 检索 | **复用 `rag-demo` 的 HashEmbedder + BM25 + RRF**（`rag-demo/src/embed.ts:19,31`、`bm25.ts:28`、`rrf.ts:23`） | 新写一套 | 复用能立刻产出"同一语料、三路检索"的对照表，也避免`memory.mjs:144` 那种占位 embedding；跨目录复用按**只读 import**，不改 rag-demo 一行（`corpus.ts` 是语料成员，只读） |
| 演示形态 | `npm run demo` 叙事 + 断言双出口 | 只加 README | 面试场景是"现场跑给你看"；只有测试输出无法展示写/读/忘/恢复的**过程** |
| 记忆版本 | `schema_version` 显式字段 + 不兼容即响亮失败 | 静默兼容 | 全局纪律 #3：宁可响亮失败也不静默错误；`session.ts` 的 0 命中说明这一层本仓从未做过，做一次即可作为新差异点 |
| 与 pi 的关系 | 出一个"机制差异表"（条目树/分支重建 vs JSONL/supersede 链） | 声称"自研了 pi 的 Magic Context" | 只能声称**自己写的东西**；pi 机制从 `notes/long-term-memory.md:6` / `notes/framework-ecosystem.md:236` 引用，属转述（且 pi 版本必须标注，`handoff.md` §五.5 要求） |

**工作量估计**：0.5–1 人日（持久化 1–2h、`demo.mjs` 叙事 1h、三路检索对照 1h、端到端探针 5 条 1h、README/边界改写 0.5h、跑两遍确定性 0.2h）。**风险**：低。唯一外部依赖是 `rag-demo` 的模块导出面（已实测 `export`，见 A.1 证据表外链命令）。

### A.6 可验收标准（仓内自证形式）

| # | 验收项 | 形式化判据（可 grep / 可断言） |
|---|---|---|
| A-1 | 子系统有独立演示入口 | `node -e "const s=require('./memory-redteam/package.json').scripts; process.exit(s.demo?0:1)"` → 退出码 0 |
| A-2 | 生命周期端到端可跑 | `cd memory-redteam && npm run demo` → 退出码 0，输出含"写入 / 注入 / 召回 / 遗忘 / 重开"五段标记 |
| A-3 | 跨会话恢复真实发生 | 上述 ④：第二次进程输出含第一次写入的条目内容 |
| A-4 | 确定性 | 上述 ⑤：`diff` 退出码 0（空 diff） |
| A-5 | 原回归不退化 | `node test.mjs` 与 `node test.mjs --ablate` 均退出码 0，探针数 **≥16**（11 旧 + ≥5 新） |
| A-6 | 持久化真落盘 | `--session-dir` 下存在 `*.jsonl`，且文件内含 `schema_version`；删除该文件后 `--reopen` 明确报错（不得静默返回空） |
| A-7 | 不是"另一个 rag-demo" | `npm run demo` 输出含"跨会话/遗忘传播/信任闸"三项中至少两项的实测数字（不是照抄 rag-demo 的 recall 数字） |
| A-8 | 不新增作品、不改口径 | `git status --porcelain` 里**无新增顶层目录**；`notes/knowledge-map.md:15` 原文不变（`grep -c "可运行 demo 作品 6"` = 1） |

### A.7 口径影响与语料纪律

- 冻结口径：**不变**（见 §0.5）。特别地：`memory-redteam/` 不是"6 个可运行 demo"之一（它现在没有 `npm run demo`，加了也仍在同一目录，不产生新条目）。
- 语料成员：**不触及**（`memory-redteam/**` 不在 `corpus.ts:18-20`）。
- 若 W1 想让 `/works` 或 `/learn` 提到这个子系统：那只改站点文案/`courses.ts` 的 intro，**不改任何计数**，且注意 `courses.ts` 的 18 张卡不含 memory-redteam——**不得为它新增第 19 张卡**（会牵动"课程卡 18"口径）。

### A.8 根因回顾与防复发

根因是"任务口径未对齐目标口径"。防复发动作（并入 §4 制度）：任何"补强清单"条目在开工前必须写清**判据动词**（"跑通/演示/自证"vs"写测试/写文档"），并在验收时逐字引用上游目标口径（这里是 `interview-bank.md:89` 的"无自研"三字）。

---

## 2. 短板 B：框架生态「SDK 实操仅 Claude Agent SDK 一家，LangGraph 等仅定位级」

### B.1 证据（file:line）

| # | 证据 | 位置 |
|---|---|---|
| 1 | JD 矩阵自评 🟡：「pi 源码级日常 + `framework-demo`（Claude Agent SDK，11/11 断言）+ 四家定位」→「有 SDK 实操，LangGraph 等仍只有定位级」 | `notes/interview-bank.md:97` |
| 2 | 仓内**唯一**框架 SDK 依赖是 Claude Agent SDK，且只有一个：`"@anthropic-ai/claude-agent-sdk": "^0.3.296"`（实测 `grep -c` 该目录 dependencies 仅此一条业务依赖） | `framework-demo/package.json:11-13` |
| 3 | 全部实操代码只 import 该 SDK；`query()` 直接当 AsyncGenerator 用 | `framework-demo/src/lib.ts:4`、`:43` |
| 4 | 端点依赖 `.env`：`readFileSync(resolve(__dirname,"..",".env"))`，缺 `LLM_BASE_URL`/`LLM_API_KEY`/`LLM_MODEL` 任一即 `process.exit(1)` | `framework-demo/src/env.ts:17`、`:23-28` |
| 5 | 连冒烟都要活端点：`smoke.ts` 顶部 `loadEnv()` 后立刻 `query()` | `framework-demo/src/smoke.ts:6`、`:9-12` |
| 6 | 课程自己的选型表把 B/C 明确标"**无本地实测，文档级**" | `notes/framework-ecosystem.md:266`、`:267` |
| 7 | 「候选 B/C 无本地实测，标记为文档级待验（`<!-- TODO 核实…`）」 | `notes/framework-ecosystem.md:280` |
| 8 | 选型结论："A 是唯一在本仓库被 11/11 断言验证过的候选" | `notes/framework-ecosystem.md:290` |
| 9 | 升级回归成本按"每次 SDK 升级跑 11/11 断言"计——即把**单家**实测当成回归基线 | `notes/framework-ecosystem.md:299` |
| 10 | 审计的补强建议正是"同一白板任务跑三家 SDK"最小对照 | `audit/report.md:216`、`audit/content-audit.md:151` |
| 11 | 已安装依赖清单里**没有** `openai` / `@openai/agents` / `@langchain/*`（`ls */node_modules/openai`、`@langchain` 均无命中） | 仓内 node_modules |
| 12 | 出网能力实测可用：`npm view` 三个包均返回版本（见 §2.5 命令） | 本次实测 |

### B.2 准确定性

**真短板**。标注是诚实的（课程没假装 B/C 跑过），缺的是**实操证据**：`framework-ecosystem.md:266-267` 那两格"无本地实测，文档级"就是短板的字面形态。当前状态能答"你用过哪家框架"，答不了"**同一件事三家怎么写、差别在哪**"。

### B.3 差距量化

| 维度 | 现状 | 目标 | 差距 |
|---|---|---|---|
| 有本地实测的候选 | **1 / 3**（A） | 3 / 3（A + LangGraph + OpenAI Agents SDK） | +2 |
| 同任务可比代码 | 只有 A 的四能力 demo | 三家 × 同一白板任务，**同一判据同一断言集** | +2 实现 |
| 离线可跑 | A 需活端点（`env.ts:17` 读 .env，`smoke.ts:6` 立即 query） | 三家用**本地 mock 端点**即可跑出确定结果 | +1 模式 |
| 断言口径 | 11/11（含 1 条总体判定）文字混用 | 统一"10 断言 + 总体判定" | 见 §3 U-24 |
| 对照维度表 | 无 | 一套逐维表（给你什么/藏什么/泄漏方向/迁移成本） | +1 |
| 作品数 | 6 | 6（**不得变 7**） | 0 |

### B.4 根因

**证据成本的结构性不对称**：A 家已经解决了端点问题（`framework-demo/.env` 指向本地代理，`env.ts` 把 `ANTHROPIC_*` 映射好），所以"有实测"；B/C 家要各写一套 env/协议适配（OpenAI Agents SDK 走 `OPENAI_*`/Responses 或 Chat Completions，LangGraph 走 `ChatOpenAI` 之类），成本比 A 高一个量级 → 一直停在"文档级"。根因不是判断失误，是**没把"离线 mock 端点"这个降本手段用在框架对照上**——而这个手段本仓已有范式（`harness-demo/src/test-compact.ts:6-8`）。

### B.5 补全方案（具体到目录与命令级）

**落位（口径安全）**：全部落在 **`framework-demo/` 之内**，不新增顶层目录、不新增作品：

```
framework-demo/                     ← 仍是同一个作品（6 之一）
├── package.json                    ← 加 devDeps：@openai/agents、@langchain/langgraph（+ langchain core）
├── mock-model.mjs                  ← 新增：本地 mock 模型端点（OpenAI 兼容 + Anthropic 兼容两条路由）
│                                     范式照抄 harness-demo/src/test-compact.ts（127.0.0.1 + node:http）
├── sdks/
│   ├── claude.mjs                  ← 抽取现有 A 家最小实现（与 src/ 现有四能力同源）
│   ├── openai-agents.mjs           ← B 家：同一白板任务
│   ├── langgraph.mjs               ← C 家：同一白板任务
│   └── compare.mjs                 ← 三家跑同一判据 → 打印逐维对照表 + 退出码
├── src/capabilities.ts             ← 保留（A 家四能力），不删
└── README.md                       ← 加"离线三家里程碑"节（命令 + 版本 pin + 已知限制）
```

**命令级（离线，不许依赖任何活端点）**：

```bash
cd framework-demo
npm i -D @openai/agents @langchain/langgraph     # 已实测 registry 可达、有版本可 pin
node mock-model.mjs --port 8788 --scenario whiteboard &   # 本地 mock 端点（无 key、无外网）
MOCK_BASE_URL=http://127.0.0.1:8788 npm run compare       # 三家 × 同一白板任务 → 对照表，退出码 0
node sdks/langgraph.mjs --offline-mock              # 单家可独立复跑
grep -n 'version' package-lock.json | head          # 版本 pin 证据（用于 §3 U-26 的版本口径核实）
```

**版本口径（本次实测，供 W2/W3 引用；须带日期与命令）**：

```bash
npm view @langchain/langgraph version --cache /tmp/npmc   # 1.4.21   (time.modified 2026-10-07)
npm view @openai/agents version --cache /tmp/npmc         # 0.20.0   (time.modified 2026-10-08)
npm view @anthropic-ai/claude-agent-sdk version --cache /tmp/npmc  # 0.3.296（与 package.json:12 一致）
```

→ **直接后果**：仓库多处写"LangGraph **1.0.x** 稳定版（当前 **1.0.1**）"（`handoff.md:12`、`notes/multi-agent.md:396`、`notes/framework-ecosystem.md:91,376`），与 registry latest **1.4.21** 不一致。这正是 §3 U-26 要收口的对象，且**本方案已用可重跑命令复现该矛盾**。

**取舍理由（为什么 A 不选 B）**

| 决策 | 选 A | 不选 B | 理由 |
|---|---|---|---|
| 端点 | **本地 mock（`node:http`）** | 复用 `framework-demo/.env` 的真实代理 | 约束明令：不得以"实跑真实模型"为证据；且真实模型输出不确定 → 无法写断言。mock 的关键在于**断言的对象是框架的调用形状**（委派/交接/checkpoint/权限钩子），不是模型智能 |
| 落位 | `framework-demo/sdks/` 子目录 | 新建 `sdk-compare/` 顶层作品 | 新目录 = 第 7 个作品 → 破坏冻结口径。子目录既保住"6"，又让三份实现与 README 天然同页对照 |
| 语言/栈 | Node ESM `.mjs`（与现有 `src/*.ts` 并存） | 全部改写 TS | 三家 SDK 的类型面差异大，写 TS 会让"离线可跑"被 typecheck 卡住；用 `.mjs` + 单独 `typecheck` 脚本（若需要）降低风险 |
| 判据 | **同一判据集**（同一白板任务 + 同一维度表 + 同一断言措辞） | 各家展示自己最亮的特性 | 对照组的力量来自"同任务"；各show 各的会退化成文档复述 |
| LangGraph 覆盖面 | 只做"图 + 状态 + checkpoint"最小面 | 追平 LangGraph 全特性 | 目标是"有亲手实现与对照证据"（`audit/report.md:216` 的最小动作），不是把框架吃透 |
| 是否联网 | 允许 `npm view` 查版本（只读、可复跑） | 不联网、纯记忆写版本号 | U-26 的教训就是"凭记忆写版本号"；实测已证明版本号写错了一代（1.0.1 → 1.4.21） |

**工作量估计**：1–1.5 人日（mock 端点 2–3h；三家最小实现各 1.5–2h；对照表 + README 1h；离线复跑验证 0.5h）。**风险**：中。风险点是 B/C 两家 SDK 的依赖体积与 Node 版本要求（实测本机 `node v26.8.2`，两包 registry 可达）；若 `@langchain/langgraph` 装不上，**降级方案**（必须先报告 captain，不得静默）为：只做 B 家 + 在 `framework-ecosystem.md` 把 C 家明确标"依赖不可安装（附报错）"——这仍是"如实降级"，好过假装跑过。

### B.6 可验收标准（仓内自证形式）

| # | 验收项 | 形式化判据 |
|---|---|---|
| B-1 | 三家都有本地实现 | `ls framework-demo/sdks/{claude,openai-agents,langgraph}.mjs` 三者齐备 |
| B-2 | 三份都在离线 mock 下跑通 | `cd framework-demo && node mock-model.mjs --port 8788 & MOCK_BASE_URL=http://127.0.0.1:8788 npm run compare` → 退出码 0，输出含三家各一行"✅ 判据 n" |
| B-3 | 断言数可数 | `compare.mjs` 打印 `断言 N/M`，且 N=断言条数、M=总条数；**不许写"11/11"这种含总体判定的混口径**（见 U-24） |
| B-4 | 不依赖任何活端点 | 在**空 `.env`／无 `.env`** 下命令仍退出码 0（`mv framework-demo/.env /tmp/e.bak` 后复跑，事后还原） |
| B-5 | 版本有 pin 与来源 | `framework-demo/package-lock.json` 含两包 resolved 版本；README 记录核实命令与日期 |
| B-6 | 口径安全 | 仓库根目录**无新增顶层作品目录**；`knowledge-map.md:15` 原文不变 |
| B-7 | 课程侧落地 | `notes/framework-ecosystem.md:266-267` 的"无本地实测，文档级"两格改为"有本地实测（离线 mock，命令+日期）"或如实降级（若某家装不上） |
| B-8 | 断言不得恒真 | 至少一条**消融/反例**：把某家 mock 的返回改成缺字段，其断言必须变红（照抄 `memory-redteam` 的 `--ablate` 思想） |

### B.7 口径影响与语料纪律

- 冻结口径：**不变**（核心落位在 `framework-demo/` 内；`framework-demo` 本身是 6 之一，不新增作品）。
- 语料成员：**本线不触及**；但 §3 的 U-24 若连带改 `handoff.md:162` 的"11/11"表述 → **触及语料，必须重跑 eval 并核对 132 chunks / 0.31·0.44·0.50 / PASS 3/8 / 锚点 16/16**（见 §0.6 矩阵）。建议 W2 **不碰 `handoff.md`**，把口径修正放 `notes/framework-ecosystem.md` + `notes/interview-bank.md`，从而完全避开语料重跑（取舍理由：`handoff.md:162` 是**历史记录**，语义上写的是"当时的口径"，改它会污染历史；正确做法是在新文档里写明现行口径）。

---

## 3. 未验证项 U-23 / U-24 / U-25 / U-26 收口

> 四项共用一条纪律：**能用仓内证据自证的，就把它变成可重跑断言；不能自证的，就把限定如实写回去**。任何一项都不允许"为了保住旧数字而放宽判据"。

### 3.1 U-23：otel「11 spans / 1 trace」仓内无证据 —— **真短板（证据缺口）**

**证据（file:line）**

| # | 证据 | 位置 |
|---|---|---|
| 1 | 审计定性：仓内无证据，运行时动态统计 | `audit/report.md:173-174` |
| 2 | 仓内唯一"产物"只有 4 个字，无 span 计数 | `harness-demo/workspace/out/otel.md:1`（全文 = `OTel 埋点验证完成`） |
| 3 | span 数来自**运行时**打印：`memoryExporter.getFinishedSpans()` | `harness-demo/src/otel.ts:52-54` |
| 4 | span 树形状是**写死在注释里的**（invoke_agent / chat / execute_tool） | `harness-demo/src/otel.ts:3-5`、`harness-demo/src/agent.ts:37` |
| 5 | 导出器：console + InMemory（OTLP 默认关，需 `OTEL_EXPORT_OTLP=1`） | `harness-demo/src/otel.ts:31-39` |
| 6 | 入库命令存在（`demo:otel`），但入口依赖 `harness-demo/src/llm.ts:22-24` 的活端点 env | `harness-demo/package.json:9` |
| 7 | 宣称处共 6 处 | `notes/knowledge-map.md:163`、`notes/interview-bank.md:87,102`、`notes/details/06-observability-loop.md:27`、`site/src/pages/index.astro:43`、`site/src/pages/works.astro:107,367` |
| 8 | 离线 mock 范式已存在（同仓） | `harness-demo/src/test-compact.ts:6-8` |

**差距量化**：可复跑证据 **0 条**；宣称 **6 处**；断言覆盖率 0/6。数字（11）本身**可能为真**——它只是不可复现，而不可复现的数字在面试现场就是"不可引用的数字"。

**根因**：埋点写进了"只有活端点才能跑"的入口（`demo.ts` 全流程），而**没写一个可离线复跑的 otel 断言脚本**；产物落盘又只写了一句人话（`otel.md:1`）。即 RC-3「渲染/管线静默」的近亲：**证据生成器不存在**。

**补全方案（目录与命令级）**

```
harness-demo/
├── src/test-otel.ts        ← 新增：mock 端点 + 固定场景 → 断言 span 树（不依赖活模型）
├── workspace/out/otel.md   ← 改为"实测输出快照"：命令 + 日期 + span 表（由脚本生成，不手写）
└── package.json            ← 加 "test:otel": "tsx src/test-otel.ts"
```

```bash
cd harness-demo
npx tsx src/test-otel.ts       # 期望：断言 span 名集合 = {invoke_agent, chat×N, execute_tool×M}，trace 数 = 1，退出码 0
npm run test:otel              # 同上的脚本入口
grep -c '11 spans' workspace/out/otel.md   # 若保留"11"：必须由本次输出得出；否则改为结构性描述
```

**取舍理由**
- **选**"mock 端点 + 固定场景 + 断言 span 树形状"，**不选**"把 11 换成 12 再宣称"：数字会随模型轮次漂（`otel.ts:52-54`），断言形状才是稳定的；且 mock 下模型调用次数完全可控 → span 数变成**确定值**。
- **选**"脚本生成 `otel.md`"，**不选**"手写日志"：全局纪律 #5（修显示值不如修生成器）。
- **选**"mock 端点"，**不选**"保留活端点跑法"：约束不许以真实模型为证据；活跑法可保留为 `demo:otel` 的人工补充（但不得作为断言）。

**可验收标准**：`cd harness-demo && npx tsx src/test-otel.ts` 退出码 0；输出含 span 名与 trace 数的**完整列表**；`workspace/out/otel.md` 内容 = 该脚本某次真实输出（含命令原文与日期）；`grep -rn "11 spans\|1 trace" notes/ site/` 命中的每一处都指向该快照（或改结构性描述），不再出现无出处的裸数字。

**若 W3 选择"结构性描述"而非"实测数字"**：则 6 处宣称改为"span 树：1 个 `invoke_agent` 根 span + 每次模型调用 1 个 `chat` + 每次工具调用 1 个 `execute_tool`（形状断言见 `harness-demo/src/test-otel.ts`）"，并**同时**贴出脚本实跑输出。二选一，不得两者都不做。

### 3.2 U-24：framework-demo「11/11 断言」实为 10 断言 + 1 总体判定 —— **纯标注问题**

**证据（file:line）**

| # | 证据 | 位置 |
|---|---|---|
| 1 | 审计定性 | `audit/report.md:176-177` |
| 2 | `ok()` 实测 **10 条**（行号 `13 14 37 38 62 63 64 73 75 76`），命令：`grep -c 'ok(' framework-demo/src/capabilities.ts` → 10 | `framework-demo/src/capabilities.ts` |
| 3 | 第 11 个"断言"其实是 demo 收尾的一行总判定 | `framework-demo/src/demo.ts:15` |
| 4 | `handoff.md:162` 自己写的就是正确口径（"10 条 ok() 断言（+1 整体判定=11/11）"）——**同仓两套口径** | `handoff.md:162` |
| 5 | 混口径残留处：`notes/framework-ecosystem.md:7`（"本机实测 11/11 通过"）、`:280`（已解释但仍以"11/11"收尾）、`:290`、`:299`；`notes/interview-bank.md:97` | 见左 |
| 6 | 本机再也跑不出该数字：`framework-demo/src/env.ts:23-28` 缺 env 即 `process.exit(1)` | `framework-demo/src/env.ts` |

**差距量化**：口径不一致处 **≥5 处**；可复现率 **0**（活端点）。注意：**能力本身不缺**（10 条断言各测一件真事），缺的是数字的**表述口径**与**可复现性**。所以它的定性与 U-23 不同：U-24 的核心动作是"改字"，不是"补证据"。

**根因**：RC-7（口径无定义）——"11/11"这个写法把**断言**与**总体判定**混为一谈；一旦混用，读者无法判断"11 条断言"是否都独立（实测是 10 独立 + 1 汇总）。

**补全方案**：与 W2 同文件、一次改完。

```bash
# 口径统一（改字）：四处改为「10 条断言 + 1 条总体判定（11/11）」
#    notes/framework-ecosystem.md:7,280,290,299  notes/interview-bank.md:97
grep -rn "11/11" notes/ site/ handoff.md | grep -v "10 条"    # 验收：应只剩 handoff.md:162（它本来就是正确口径）
```

**取舍理由**：**选**"统一为 10 断言 + 总体判定"，**不选**"补成真的 11 条断言"——后者是给数字凑数（全局纪律 #3 的反面）；除非 W2 确实新增了一条独立断言（例如"三家对照里至少两家 checkpoint 语义可重建"），那时**再**写 11 条，且必须逐条列出行号。

**可验收标准**：`grep -rn "11/11" notes/ site/ framework-demo/` 命中的每一处都在同一行/同一段内明确区分"断言数"与"总体判定"；`grep -c 'ok(' framework-demo/src/capabilities.ts` 的数字与该表述一致；离线 mock 跑法给出**独立可复跑**的断言统计（见 B-3）。

### 3.3 U-25：FinHot 生产数字（仓外证据 + 1830 vs 1875 的 45 行口径差）—— **标注/转述问题**

**证据（file:line）**

| # | 证据 | 位置 |
|---|---|---|
| 1 | 审计定性 | `audit/report.md:179-180` |
| 2 | 原始处**做对了**：诚实标注"另一快照口径…差 45 行未归类（**待核对**；不自行改数，也不把 1830 改成 1875）" | `notes/data-flywheel.md:222-223` |
| 3 | 数字核实清单里同样保留该口径差 | `notes/data-flywheel.md:374` |
| 4 | 转述处**丢限定**：只讲 1830 | `notes/agent-harness.md:414`、`:455` |
| 5 | 同左（站点侧） | `site/src/data/courses.ts:175` |
| 6 | 其他转述处 | `notes/sandbox.md:27`、`notes/evaluation.md:262`、`notes/data-flywheel.md:6,96,276,283,328,353,363` |
| 7 | 数据源不在仓库（`FinHot/.data/eval/…`，#35） | `notes/data-flywheel.md:222`（原文 `#35`） |

**差距量化**：诚实标注 **2 处**（`data-flywheel.md:223,374`）；丢失限定的转述 **≥5 处**（agent-harness×2、courses.ts×1、sandbox×1、evaluation×1，另有 data-flywheel 内部复述）。仓内可自证性：**0**（数字永远来自仓外）。

**根因**：RC-2 的变体——**"限定"在转述时不随数字一起走**。上游标注对了，下游抄数只抄了数。这与 U-02/U-10 是同一类事故（改一处、副本残留），只是这次的"副本"是**限定语**而不是数字。

**补全方案**：**只补限定，不改数字**（改数字 = 造假）。

```bash
# 统一脚注模板（转述处逐处附）
#   生产台账快照（#35，仓外证据）；方向分布四项之和 1875 与台账 1830 存在 45 行口径差、来源未说明（待核对）
grep -rn "1830" notes/ site/src | cut -d: -f1,2      # 列出全部转述点，逐点确认脚注在场
```

新增"仓外证据"标记范式：在 `notes/data-flywheel.md` 顶部（或 §数字核实清单处）写一条**是否仓内可核**的字段约定（`#35 仓外` / `实跑可核`），转述处只写标记号。

**取舍理由**：**选**"逐处挂脚注 + 建标记范式"，**不选**"删除 FinHot 数字"——FinHot 是本仓最强差异化（`audit/report.md` 正面基线），数字不可核不等于不可讲；**也不选**"补一个能自证的数字"（例如用 `durable-execution-demo` 的 821 行替代）——那是偷换主题。

**可验收标准**：
- 全仓 `grep -rn "1830" notes/ site/src` 的每一处，同一段落内必须出现 `#35` 与"仓外"字样（或指向脚注的锚点）；
- `grep -rn "1875" notes/` 至少 2 处（`data-flywheel.md:223,374` 保留）+ 全部转述处脚注内包含 45 行口径差；
- 不得出现任何一处把 1830 改成 1875、或删掉 45 行口径差的表述（逐点 diff 复核）。

**语料纪律**：`notes/agent-harness.md` **是 demo:eval 语料成员**（`corpus.ts:19`）→ W3 改它**必须**跑 `cd rag-demo && npx tsx src/evaluate.ts` 并贴原始输出核对 **132 chunks / 0.31·0.44·0.50 / PASS 3/8 / 锚点 16/16**。**注意**：这五处转述是加脚注（**加字符会改变 chunk 边界**），锚点 16/16 与 132 chunks 都可能变化——若变化，必须解释原因并同步 `notes/rag.md` §13 的核对结论（**不得**为了保持 132 去删脚注）。

### 3.4 U-26：外部时点事实未联网核实 —— **真短板（且本环境可修）**

**证据（file:line）**

| # | 证据 | 位置 |
|---|---|---|
| 1 | 审计定性（当时无联网条件） | `audit/report.md:182-183`、`audit/content-audit.md:118` |
| 2 | 已声明的具体断言：OWASP LLM Top 10 **2026 版（2026-08-04 发布）**、Agentic Top 10（2026-12-09 发布）、LangGraph 1.0.x（当前 **1.0.1**） | `handoff.md:12`；`notes/knowledge-map.md:8`；`notes/mcp.md:145,192,213` |
| 3 | 课程内断言：LangGraph "1.x 系…当前 1.0.1"；OpenAI Agents SDK "2025 GA"；A2A "v1.0.1" | `notes/framework-ecosystem.md:91`、`:90`、`:376`；`notes/multi-agent.md:396` |
| 4 | 全仓最佳范式（该抄的样）：「已知缺口 / 待复核」 | `notes/industry-2026.md:80-84` |
| 5 | **本次实测反证**：registry `@langchain/langgraph` latest = **1.4.21**（`time.modified` 2026-10-07），与"当前 1.0.1"不符 | 命令见 §2.5 |
| 6 | 本次实测：`@openai/agents` latest = **0.20.0**（2026-10-08）；`@anthropic-ai/claude-agent-sdk` = **0.3.296**（与 `package.json:12` 一致） | 命令见 §2.5 |

**差距量化**：待核实时点事实 **≥6 条**（OWASP LLM 2026 版与发布日、OWASP Agentic 发布日、LangGraph 版本、OpenAI Agents SDK GA 时点、A2A 版本、MCP spec 版本线）；其中 **1 条已被本次实测证伪**（LangGraph "当前 1.0.1" vs latest 1.4.21）。可核性：**现在可核**（出网可用，`curl`/`npm view` 均 200）。

**根因**：上一轮核实方**没有留下可复现的核实通道**（无联网时的 "核实" 只能靠既有记忆），而且**没有把"核实通道 + 日期"写进笔记**——所以同样的断言在下一次也会以同样方式过期。根因归类：RC-6（资产管线断裂：结论与来源分离）+ 缺"核实契约"。

**补全方案（目录与命令级）**

```
notes/industry-2026.md          ← 在既有「已知缺口 / 待复核」节追加本轮核实结果表（尽量不动正文其他部分，降低语料/口径风险）
notes/key-facts-verified.md     ← 新增（可选但推荐）：时点事实台账 —— 表头 = 断言 / 核实命令或 URL / 核实日期 / 结论（确认|需修正|无法确认）/ 影响文件
notes/framework-ecosystem.md    ← 把 1.0.x/1.0.1 相关表述改为核实后的版本口径（带日期与来源）
notes/multi-agent.md,handoff.md ← 同上（handoff.md 是语料成员 → 见语料纪律）
```

```bash
# 核实通道（每条都要记命令/URL 与日期）
npm view @langchain/langgraph version time.modified --cache /tmp/npmc
npm view @openai/agents version time.modified --cache /tmp/npmc
curl -sS -o /dev/null -w "%{http_code}\n" https://a2a-protocol.org/latest/       # A2A
curl -sS https://genai.owasp.org/llm-top-10/ | grep -i -m3 "2026"               # OWASP（以官方站为准）
# MCP spec：以 modelcontextprotocol.io 版本页为准（记 URL + 抓取日期）
```

**取舍理由**
- **选**"registry / 官方站 + 记录命令与日期"，**不选**"凭常识断言"：本次实测已证明凭记忆写的版本号错了一代。
- **选**"新增事实台账文件"，**不选**"只在课程里改字"：台账给出**下一次核实的入口**，避免同类过期复发（这是"修生成器"而不是"修显示值"）。
- **选**"能确认的确认、不能确认的写无法确认"，**不选**"为了全绿而含糊"：`industry-2026.md:80-84` 已建立"显式声明缺口"的正确范式，抄它。
- **不选**"把 OWASP 2026 版当假命题处理"：它可能为真（`notes/mcp.md` 引用了不少具体条目）；结论应由核实给出，不由直觉给出。

**可验收标准**：
- 一个**可重跑**的核实台账存在，每条含：断言原文 / 核实通道（命令或 URL）/ 核实日期（ISO）/ 结论 ∈ {确认, 需修正, 无法确认} / 受影响文件；
- 受影响文件里的表述与该台账结论一致（`grep` 逐条对照）；
- 不得出现"断言 + 无来源 + 无日期"的外部事实句（抽查 ≥10 条）；
- 台账里"需修正"的条目**必须已就地划改**（不是只追加一条更正说明——纪律 #4）。

**语料纪律**：若 W3 改 `handoff.md:12`（语料成员）→ **必须重跑 eval 核对六项**。建议：`handoff.md:12` 是历史轮次记录，**优先不改**，把修正放在 `notes/industry-2026.md` + 台账 + `notes/framework-ecosystem.md`。

### 3.5 四项收口的总验收（W3 交付时逐条贴原始输出）

```bash
cd harness-demo && npx tsx src/test-otel.ts               # U-23：span 树断言，退出码 0
grep -c 'ok(' framework-demo/src/capabilities.ts          # U-24：10（与文字口径一致）
grep -rn "11/11" notes/ site/ framework-demo/             # U-24：每处都区分"断言"与"总体判定"
grep -rn "1830" notes/ site/src                           # U-25：每处同段含 #35 + 仓外限定
grep -rn "1.0.x\|1.0.1" notes/ handoff.md                 # U-26：每处版本口径与台账一致
cd rag-demo && npx tsx src/evaluate.ts                    # 语料若被触及：132 chunks / 0.31·0.44·0.50 / PASS 3/8 / 锚点 16/16
```

---

## 4. 短板 D：上轮 20 个任务的实现全部自验，无独立评审 —— **流程短板**

### 4.1 证据（可数的事实，不含对话内容）

| # | 证据 | 位置/命令 |
|---|---|---|
| 1 | 上轮团队 `learn-site-audit` 共 **20 个任务，全部 completed**：t1–t3 审计、**t4–t20 共 17 个实现** | `node -e` 读 `.agent-teams/archive/learn-site-audit/team.json` |
| 2 | 其中 **t17–t20 的 assignee = captain**（4 个实现由同一人写、同一人验） | 同上 |
| 3 | **20 个任务里 kind 为 review/verification 的数量 = 0**；没有任何任务带 verdict 字段 | 同上 |
| 4 | 即：独立评审覆盖率 **0/20（0%）**；非实现者评审覆盖率 **0/17（0%）**；"作者=唯一验证者"占比 **4/17 ≈ 24%** | 由 1–3 推出 |
| 5 | 本轮的补救已排进任务表：t7（verification，verifier）、t8（review，verifier 评 t2）、t9（review，architect 评 t3） | `.agent-teams/gaps-remediation/team.json` |
| 6 | 但**本轮仍有覆盖缺口**：t4（evidence-dev）、t5（evidence-dev，CI/视觉）、t6（architect，口径收口）**没有对应的 review 任务**；且 t6 由 architect 自查（除非另派） | 同上 |
| 7 | 更根本的：仓库里**没有任何"评审制度"文字**——`handoff.md` §六 只写"数字引用规范"（`:198` 第 6 条），没有"谁验谁""验什么""怎么判 PASS" | `handoff.md:198`（§五 第 6 条） |

### 4.2 准确定性

**流程短板（真实）**，且它**不是能力问题而是制度缺位**：团队已经具备独立评审的能力（本轮 t7/t8/t9 就是证明），缺的是**默认要求**——"实现者不得给自己的产物下 verdict"没有写进任何可执行的规范里，所以上一轮 20 个任务里它也不会自动发生。

### 4.3 差距量化

| 指标 | 上轮 | 目标 | 差距 |
|---|---|---|---|
| 独立评审任务数 | 0 | 每个 implementation 至少 1 个非实现者 verdict | +N |
| 有 verdict 的任务占比 | 0/20 | 100%（所有 review/requirements） | +20 |
| 作者自验占比 | 4/17 | 0 | −4 |
| 制度文字 | 无 | `handoff.md`/`knowledge-map.md` 有"评审契约"条 | +1 |
| 可复跑证据（日志） | 部分（审计报告内嵌命令） | 每个交付附"命令 + 原始输出 + 退出码" | 待补 |

### 4.4 根因

三重叠加：
1. **单会话自验的路径依赖**：上一轮的前 3 个任务（审计）由 3 名成员并行产出、由 captain 综合；综合之后所有实现都归到少数人手里，**验证自然落回作者**。
2. **契约层缺失**：任务派发时没有规定"每个 implementation 的验证者必须是另一名成员"，也没有规定 verdict 的判据形态——没有契约，就没有违约。
3. **证据形态未标准化**：没有"命令 + 原始输出 + 退出码"的强制附件要求，导致"验过"无法被第三方复核（只能靠叙述，而叙述不可审计）。

### 4.5 补全方案（制度 + 文件落位）

**（A）制度条（写进仓库，可 grep 可检查）**——落位优先级从低风险到高风险：

| 落点 | 是否语料成员 | 风险 | 建议 |
|---|---|---|---|
| `notes/knowledge-map.md` §未结事项前新增「评审契约」小节 | 否 | 低 | **首选** |
| `audit/review-protocol.md` 新建 | 否 | 低 | 可选（与本文同目录，README 引用） |
| `handoff.md` §五 加第 7 条 | **是**（语料成员） | 中（须重跑 eval） | 若加则必须重跑 eval 核对六项 |

**契约内容（可直接抄进 `knowledge-map.md`）**：

> **评审契约（2026-10-12 立）**
> 1. 任何 `kind=implementation` 的任务，其验收 verdict 必须由**非实现者**给出；实现者不得给自己的产物下 `pass`。
> 2. 评审必须附**可重跑证据**：命令原文 + 原始输出 + 退出码；不得只给结论性叙述。
> 3. 评审判据**逐条引用上游契约**（本文件 `audit/gaps-analysis.md` 的验收表），不得就地放宽边界。
> 4. `needs_revision` / `reject` 必须给出结构化 findings（id/severity/problem/requiredFix），且 findings 关闭前不得转 `pass`。
> 5. 评审者对**同一文件的作者**只有在"作者≠评审者"时才可下 verdict；captain 自写的实现同样受此约束。

**（B）本轮的具体落位（不需新建任务，只需 captain 在派发时补齐）**：
- t7（verification）覆盖面要含 **t4 与 t5**（现表只列 t2/t3 的 review）——建议 t7 的 inScope 明确写"t2/t3/t4/t5/t6 五项交付的仓内可重跑证据"，t8/t9 之外的 t4/t5/t6 由 t7 承担独立验证（verifier 是"非实现者"）。
- t6 由 architect 实现 → **不得**由 architect 自己下 verdict；建议 t7 或 t8 的 owner（verifier）复核 t6 的口径改动（改字类，可轻量）。

**（C）"零依赖"的评审证据格式（防止评审也退化成叙述）**：

```bash
# 每个实现交付时附：命令 + 输出 + 退出码（三件套，落成文件）
mkdir -p audit/evidence
( cd memory-redteam && npm run demo ) > audit/evidence/W1-demo.log 2>&1; echo "exit=$?" >> audit/evidence/W1-demo.log
grep -c '✅' audit/evidence/W1-demo.log     # 评审者只信这个，不信实现者的"我跑过了"
```

**取舍理由**
- **选** `notes/knowledge-map.md` 作为制度落点（而非 `handoff.md`）：`handoff.md` 是 demo:eval 语料成员，改它要重跑 eval；制度条是**长期资产**、应落在"唯一事实源"旁边（`knowledge-map` 已是全站待办唯一清单），落这里零语料代价。
- **选**"verdict + 结构化 findings + 命令三件套"，**不选**"评审者再跑一遍然后口头说 OK"：后者不可审计，且与上一轮"自验"的区别只是换了个人说同样的话。
- **不选**"引入外部工具/流程框架"：本仓的纪律体系（`~/.dsh/AGENTS.md`）已经足够；缺的是**在仓库里留痕**。

**工作量估计**：0.3 人日（写契约条 + 证据目录约定 + captain 补齐 t7 覆盖面）；额外评审执行成本已在本轮任务表里（t7/t8/t9）。

### 4.6 可验收标准

| # | 验收项 | 形式化判据 |
|---|---|---|
| D-1 | 制度在仓库里可 grep | `grep -n "评审契约" notes/knowledge-map.md` 命中，且含"非实现者""verdict""可重跑"三个关键词 |
| D-2 | 本轮每个 implementation 都有非实现者 verdict | 团队任务表中 t2/t3/t4/t5/t6 各自存在 kind=review 或 kind=verification 的承接任务，且 assignee ≠ 实现者 |
| D-3 | 证据是三件套 | `ls audit/evidence/` 每个实现 ≥1 个 `.log`，内含命令原文与 `exit=` 行 |
| D-4 | 无自验 | 不存在"同一 assignee 既是 implementation 又是其 verdict 来源"的任务对（人工核对任务表两列） |
| D-5 | findings 可关闭 | 若有 needs_revision：findings 有 id/severity/problem/requiredFix；关闭后原 verdict 不得被改写（只允许 append 证据） |

### 4.7 口径影响与语料纪律

- 冻结口径：不变。
- 语料：若制度条落 `notes/knowledge-map.md`（**非语料成员**，推荐）→ **零 eval 成本**；若落 `handoff.md` → **必须重跑 eval 核对 132 chunks / 0.31·0.44·0.50 / PASS 3/8 / 锚点 16/16**。

---

## 5. 短板 E：2 核 3.4GB → astro build 曾多次 OOM（exit 134/137；**2026-10-13 t21 实测证伪「必然 OOM」——本机可约 17 分钟成功（首次 560s 超时非 OOM），可行但不可依赖，CI 为可靠路径**），整页视觉只能"留浏览器目检" —— **基础设施短板**

### 5.1 证据（file:line + 本次实测）

| # | 证据 | 位置/命令 |
|---|---|---|
| 1 | 审计结论（引文，时点 2026-10-12）：本机 astro build 在 vite 客户端阶段必然 OOM，验证请走 CI，勿用本机 dist 判断（**【2026-10-13 更正注·t25】引文中的「必然 OOM」已被 t21 独立实测证伪——本机全量构建可约 17 分钟成功（首次 560s 超时被杀非 OOM，dist HTML=32 含 404.html），本机可构建但不可依赖；「验证走 CI、勿用本机 dist 判断」的结论仍成立。见 `audit/report.md` ④ 建议行动顺序对应行的就地更正注**） | `audit/report.md:314`（t25 已就地更正并注记） |
| 2 | 构建脚本自述：本机未限流时 astro build 吃满一核、RSS 冲到 ~1.3GB，把整机拖进 direct reclaim + 换页 | `site/build.sh:4-8` |
| 3 | 已经打过两层补丁：显式 `--max-old-space-size=1024`；`capped` 限流 `CAPPED_MEMORY_MAX=1800M`、`MemorySwapMax=0` | `site/build.sh:29`、`:31-36` |
| 4 | **实测残骸**：`site/dist` 现存 **85 个文件、HTML 文件数 = 0**、3.0M、mtime `2026-10-12 14:14`（`find site/dist -name '*.html' \| wc -l` → 0；`find site/dist -type f \| wc -l` → 85；`du -sh site/dist` → 3.0M）。产物写到了 `_astro/`、`chunks/`、`pages/*.astro.mjs`、`renderers.mjs`，**没有 `index.html`** —— 典型的"vite 客户端阶段被杀死" | 本次实测 |
| 5 | 机器事实：`nproc` = **2**；`free -m` = `Mem: total 3400, available 1483, Swap: 2047/479 used` | 本次实测 |
| 6 | `capped` 已安装（`/usr/local/bin/capped`），即本机仍被限流保护 | 本次实测 |
| 7 | **视觉/结构验收链的断点**：`viz/mermaid-check.mjs:6` 硬编码读 `site/dist` → dist 无 HTML 时本机检查必然无效；浏览器其实可用：`~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`（`mermaid-check.mjs:51` 写死该路径） | `viz/mermaid-check.mjs:6,51` |
| 8 | **CI 只做构建+部署，不做任何测试**：唯一 workflow 是 `deploy.yml`，steps = checkout / setup-node / `npm ci` / `npm run build` / configure-pages / upload / deploy | `.github/workflows/deploy.yml:20-48` |
| 9 | 因此"整页视觉"当前的真实状态是：**既非本机可验，也非 CI 自动验**——只有人工目检（并在文档里标注"留浏览器目检"） | 由 4/7/8 推出 |

### 5.2 准确定性

**基础设施短板，且本机不可消除**。必须明确区分两件事：
- **本机不能 build**：环境约束，改代码解决不了（除非把站点构建拆小，但那是另一场工程，不在本轮）。
- **"没有自动化视觉/结构回归"**：这是**真实且可修**的——把它搬到 CI 即可，与 2 核机器无关。**这才是本轮要补的那一半。**

也就是说：E 的"不可解部分"只有一句（本机不产 dist），其余全可解（CI 上跑结构+视觉断言、把本机目检降级为非证据）。

### 5.3 差距量化

| 指标 | 现状 | 目标 | 差距 |
|---|---|---|---|
| 本机可产完整 dist | 否（HTML=0） | 否（**接受**，不解决） | 0（明确排除） |
| CI 上的结构断言 | 0 条 | ≥1 个 workflow job，断言页面数/关键 DOM/资源 200 | +1 job |
| CI 上的视觉断言 | 0 条 | headless 三视口截图 + 像素/尺寸断言（可失败） | +1 组 |
| 本机可跑的非 dist 断言 | `mermaid-check` 依赖 dist（不可跑） | 与 dist 无关的结构断言（如 courses.ts 派生量、口径计数） | +1 组 |
| "留浏览器目检"的表述 | 出现在文档里（无归属） | 改为"CI job X 已代验；本机仅结构断言" | 改字 |

### 5.4 根因

**验证通道依赖"本地产物"**：站点的验收（渲染、mermaid、可访问性、视觉）全部被设计成"先 build 再检查 dist"，而本机恰好 build 不了 → 验证通道整体塌方到"人工目检"。CI（`deploy.yml`）已经具备构建能力，却**只用于发布、不用于验证**——即"能跑的地方没跑，跑不了的地方全靠人眼"。

### 5.5 补全方案（目录与命令级）

```
.github/workflows/
├── deploy.yml            ← 保留（发布）
└── verify.yml            ← 新增：结构 + 视觉回归（在 CI runner 上跑，本机不跑）
                            steps: npm ci → npm run build → node site/scripts/checks/struct.mjs
                                   → node site/scripts/checks/visual.mjs（三视口截图 + 断言）
viz/
└── mermaid-check.mjs     ← 保留但显式标注"需完整 dist（本机不产 → 在 CI 或本机指 dist 时用）"
site/scripts/checks/
├── struct.mjs            ← 新增：DOM/计数/资源断言（不依赖像素）
└── visual.mjs            ← 新增：三视口（375/768/1280）截图 + 断言
```

**CI job（可施工的骨架）**：

```yaml
- name: Structural checks
  run: node site/scripts/checks/struct.mjs          # 退出码非 0 即失败
- name: Visual regression
  run: node site/scripts/checks/visual.mjs          # 三视口截图 + 断言，产物 upload-artifact
```

**本机可跑的（不依赖 dist）**：

```bash
node site/scripts/checks/struct.mjs --no-dist        # 纯数据断言：计数口径 / 派生量 / 锚点
node viz/mermaid-check.mjs                            # 仅在 dist 有 HTML 时有效（CI 用）
```

**取舍理由（为什么 A 不选 B）**

| 决策 | 选 A | 不选 B | 理由 |
|---|---|---|---|
| 视觉回归落点 | **CI runner**（内存充裕，`deploy.yml:22` 已是 ubuntu-latest） | 本机想办法 build | 本机 2 核 3.4GB 是硬约束（实测 `free -m`），改代码不解决；CI 已经会 build，加一个 job 的边际成本近乎为零 |
| 新增 workflow | **独立 `verify.yml`**（或 deploy 内加 job） | 塞进 deploy.yml 的 build 步骤 | 独立文件的好处：验证失败不阻塞发布语义，且本机能明确引用"CI 的结构/视觉证据"；若 captain 倾向单文件，改成 build 之后的并列 job 亦可接受 |
| 截图方案 | **headless chromium + 三视口**（chromium 已在 `~/.cache/ms-playwright/chromium-1234`；CI 用 `npx playwright install --with-deps chromium`） | 只做 DOM 断言 | DOM 断言抓不到"整页视觉"这类缺陷（这正是本短板的原始缺口）；但两者都要做——DOM 断言是**快速失败层**，视觉是**兜底层** |
| 基线策略 | 首轮**只断言"非空/尺寸/关键元素可见/无 console error/资源全 200"**，不引入像素基线 diff | 立刻上像素 diff 基线 | 像素基线在字体/渲染环境变化时会大面积假红，第一轮先建立"可失败的结构+可见性"信号更稳 |
| 本机角色 | 明确降级为"跑不依赖 dist 的结构断言；视觉留 CI" | 继续"人工目检" | `~/.dsh/AGENTS.md` 交付纪律 2：UI 渲染层无法 headless 代验时必须显式标注；现在可以 headless 代验了（在 CI），标注就必须改 |

**工作量估计**：0.5–1 人日（struct.mjs 2h；visual.mjs + 三视口 2–3h；workflow 接线与首跑调试 1h；文档口径改写 0.5h）。**风险**：中低。主要风险是 CI 上 chromium 安装耗时与 pagefind 步骤（`site/build.sh:45`）在 CI 的行为——首跑需人工看一次 log。

**与 t5 的关系**：本方案与 t5（W4：CI 端结构 + 视觉回归）是同一条线，本文只给**契约**（判据、落点、取舍）；t5 是执行者。**注意**：t5 的 verify 必须包含"CI 上真的红过一次"（把某个断言故意打断一次，确认 job 失败），否则无法区分"检查通过"与"检查没跑"。

### 5.6 可验收标准

| # | 验收项 | 形式化判据 |
|---|---|---|
| E-1 | CI 有验证 job | `.github/workflows/` 内存在非发布用途的 job，且失败会红 |
| E-2 | 结构断言可失败 | 故意破坏一处（如删一个统计卡的派生量）→ CI 该 job 失败；恢复后绿（**必须贴两次 CI 结论**） |
| E-3 | 视觉断言覆盖三视口 | 产出 375/768/1280 三张截图 artifact，且断言含"关键元素可见 + 无 console error + 资源全 200" |
| E-4 | 本机断言与 dist 解耦 | 在 `site/dist` 无 HTML 的情况下，本机结构断言仍退出码 0（证明它不依赖 dist） |
| E-5 | 表述就地划改 | 全仓 `grep -rn "留浏览器目检"` 的每一处都改为"本机不产 dist（见 `audit/gaps-analysis.md §5`）；结构与视觉回归在 CI（workflow 名 + job 名）"——**不得只追加一句更正**（纪律 #4） |
| E-6 | 口径安全 | 站点根目录无新增顶层作品；`knowledge-map.md:15` 不变 |

### 5.7 口径影响与语料纪律

- 冻结口径：不变（只加 CI 与脚本；`site/dist` 是 `.gitignore` 内的产物，不进仓库）。
- 语料成员：**不触及**（不写 `notes/rag.md` / `notes/agent-harness.md` / `handoff.md`）。唯一例外：若 E-5 要改 `handoff.md` 里的"留目检"表述 → 触及语料 → **必须重跑 eval 并核对六项**。建议把该表述的修正放在 `audit/gaps-analysis.md` 与 `site/README`（非语料），`handoff.md` 保持历史原样。

---

## 6. 三条实现线的施工契约（给 W1–W5 的边界与出口）

| 线 | 任务 | 允许写 | 禁止写 | 出口判据（退出码 0 的命令） |
|---|---|---|---|---|
| W1 长期记忆自研 | t2 | `memory-redteam/**` | 任何 `notes/**` 语料成员；`rag-demo/src/**`（只读 import 可以） | `cd memory-redteam && npm run demo && node test.mjs && node test.mjs --ablate` |
| W2 三家 SDK 对照 | t3 | `framework-demo/**`（含 `sdks/`）、`notes/framework-ecosystem.md`（只改口径不改数字）、`notes/interview-bank.md:97` | `handoff.md`（除非接受 eval 重跑）；任何顶层新作品目录 | `cd framework-demo && MOCK_BASE_URL=http://127.0.0.1:8788 node sdks/compare.mjs`（离线） |
| W3 未验证项收口 | t4 | `harness-demo/src/test-otel.ts`、`harness-demo/workspace/out/otel.md`、`harness-demo/package.json`、`notes/industry-2026.md`、`notes/mcp.md`、`notes/framework-ecosystem.md`、`site/src/pages/index.astro`、`site/src/pages/works.astro`、`notes/details/06-observability-loop.md`、**`notes/agent-harness.md`（仅加脚注，且必须重跑 eval）** | 改任何 FinHot 数字本身；把 1830 换成 1875 | `cd harness-demo && npx tsx src/test-otel.ts`；若触及语料：`cd rag-demo && npx tsx src/evaluate.ts`（核对六项并贴输出） |
| W4 CI 结构+视觉回归 | t5 | `.github/workflows/**`、`viz/**`、`site/scripts/checks/**` | `site/dist/**`（产物）；`notes/**` | CI job 绿 + "故意打破一次变红"的证据 |
| W5 口径收口 | t6 | `notes/interview-bank.md`（矩阵两行）、`README.md`、`notes/knowledge-map.md` | 冻结算术的**数值**；`notes/rag.md` | `grep -rn "11/11\|有活系统，无自研\|框架生态" notes/ README.md` 逐处与实测证据一致 |

**跨线冲突预警（消除并行踩踏）**：
1. `notes/framework-ecosystem.md` 被 W2（口径）与 W3（版本核实）**同时需要**。约定：**W2 只改 `:7,266,267,280,290,299` 的断言口径；W3 只改版本号相关句（`:91,376`）与核实台账**。谁先提交谁保留对方未动的段落。
2. `harness-demo/package.json` 被 W3（加 `test:otel` 脚本）触碰；W2 不碰它（W2 的 deps 加在 `framework-demo/package.json`）。
3. `notes/knowledge-map.md` 被 W5（矩阵/口径）与 D 项制度条同时需要 → **同一人（architect/W5）一次改完**，避免二次冲突。

---

## 7. 总验收清单（captain 整合时逐条重跑，本文所有数值都可复现）

```bash
# ── A 长期记忆自研 ────────────────────────────────────────────
cd memory-redteam && npm run demo && node test.mjs && node test.mjs --ablate && cd ..
# ── B 三家 SDK 离线对照 ──────────────────────────────────────
cd framework-demo && node mock-model.mjs --port 8788 & sleep 1
MOCK_BASE_URL=http://127.0.0.1:8788 node sdks/compare.mjs ; cd ..
# ── C1 U-23 otel 断言 ───────────────────────────────────────
cd harness-demo && npx tsx src/test-otel.ts && cd ..
# ── C2 U-24 口径 ────────────────────────────────────────────
grep -c 'ok(' framework-demo/src/capabilities.ts     # 期望 10
grep -rn "11/11" notes/ site/ framework-demo/         # 每处区分"断言"与"总体判定"
# ── C3 U-25 限定回填 ────────────────────────────────────────
grep -rn "1830" notes/ site/src                       # 每处同段含 #35 + 仓外 + 45 行口径差
# ── C4 U-26 外部事实台账 ────────────────────────────────────
ls notes/key-facts-verified.md && grep -c "核实日期\|无法确认" notes/key-facts-verified.md
# ── 语料纪律（仅在触及语料成员时）───────────────────────────
cd rag-demo && npx tsx src/evaluate.ts                # 132 chunks / 0.31·0.44·0.50 / PASS 3/8 / 锚点 16/16
# ── D 评审制度与证据 ────────────────────────────────────────
grep -n "评审契约" notes/knowledge-map.md
ls audit/evidence/*.log
# ── E CI 结构与视觉 ─────────────────────────────────────────
ls .github/workflows/ && ls site/scripts/checks/
# ── 冻结口径未变（原文级核对）───────────────────────────────
sed -n '11,18p' notes/knowledge-map.md
git status --porcelain | awk '{print $2}' | cut -d/ -f1 | sort -u   # 顶层目录不得新增作品目录
# ── 本任务自身的 verify（t1 契约）────────────────────────────
test -f audit/gaps-analysis.md && wc -l audit/gaps-analysis.md
grep -c -E 'U-23|U-24|U-25|U-26' audit/gaps-analysis.md
grep -c -E '验收|边界|冻结口径|语料' audit/gaps-analysis.md
grep -n 'gaps-analysis' .gitignore 2>/dev/null; echo ok
```

---

## 8. 本方案自身的边界（自我诚实性）

1. **本文未复跑 `astro build`**：OOM 结论由转引（`audit/report.md:314`）+ `site/build.sh:4-11` + `site/dist` 残骸三重旁证支撑；**本文不声称"亲自复现了 exit 134/137"**。
2. **本文未复跑 `demo:eval`**：132 chunks / 0.31·0.44·0.50 / PASS 3/8 属转引审计（`audit/report.md:16`）；本文只把它作为"必须核对的目标值"，不作为自验结果。
3. **本文对 U-26 给出的版本结论是本次实测（`npm view`，2026-10-12）**：它证明"1.0.1"与 registry latest 不一致，但**不声称掌握 LangGraph 的全部版本史**；正式结论应由 W3 的台账逐条给出。
4. **本文不声称"三家 SDK 一定能装"**：只实测了 registry 可达与版本存在；实际安装与离线 mock 可行性由 W2 首步验证，失败必须按 §2.5 的降级路径报告，不得静默。
5. **本文不掌握"活系统"本身**：pi Magic Context 的日常使用属用户侧事实（`notes/long-term-memory.md:6`），仓内不可自证；本方案只解决"自研"这一半。
6. **本文的"评审制度"提案需 captain 决策**：本文只给契约文本与落点选项（`knowledge-map.md` 零语料成本 vs `handoff.md` 需重跑 eval），不替 captain 决定仓库治理。
7. **待 captain 决策的两点**：
   - 约束表述修正（§0.4.1）：是否采用"任何交付断言必须在离线 mock 下可复现；真实端点是否可用不作为验收标准"这一更强也更可执行的版本。
   - 本轮 t7 的覆盖面：是否把 t4/t5/t6 一并纳入 verifier 的独立验证范围（本文 §4.5(B) 的建议是"应当纳入"，否则第 4 项短板只被修了一半）。

---

*本文完。所有 `file:line` 与命令均可在本仓重跑；凡"转引"处已显式标注，不冒充自验（`~/.dsh/AGENTS.md` 纪律 #2/#3）。*
