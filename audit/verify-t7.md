# t7 V1 独立验证日志——t2/t3/t4/t5/t6 仓内可重跑证据与边界清单

- 验证人：verify-dev（非实现者，未参与 t2–t6 任何实现）
- 日期：2026-10-13（attempt 2 对当前工作树复跑；attempt 1 结果与之一致，唯一树差 = captain 对 notes/multi-agent.md 的划改，见 §7.3）
- 环境：node v26.8.2 / npm 11.19.1 / 本机 2 核 3400MB（nproc=2，MemTotal=3400MB，available≈1560MB）
- 分支：`t5-visual-verify`（HEAD 8879887）；origin/main=ca682b6（t5 提交未合并，符合 t5 验收「保留 PR 供 captain 评审」）
- 原始输出：`/tmp/verify-t7/*.log`（本报告 §2 的每段命令原文、退出码与关键输出均取自这些日志）
- 一键复跑：`bash audit/verify-t7-rerun.sh all`（t2/t3/t4/t5/t6 分段可跑）

## §0 结论

**PASS（无阻断发现）**。五项交付的全部 verify 命令在独立重跑下退出码 0、关键数字与交付自述一致；负路径判据经双重证伪（内置消融 + 验证人独立破坏注入 / 本机 selftest + CI 注入 run）证明非恒真；关键数字经独立方法复算一致；越界检查通过（冻结口径与语料纪律未破坏）。发现 5 条非阻断项（F1–F5，§8），其中 F1 建议下轮修注释措辞，F2 建议 captain 决定版本号口径，F3 为团队约束文案纠错，F4/F5 为信息项。

## §1 方法

1. 逐任务重跑其契约 verify 命令（原文见 §2），记录命令、退出码、关键输出；
2. 对交付说明里的每个数字/措辞做仓内证据核对（§3），无证据的标出；
3. 负路径抽查：t2（内置 `--ablate` + 验证人独立破坏注入）、t5（本机 selftest 负 fixture + CI 注入 run 日志）；
4. 独立复算：span 数（不读断言脚本，直接统计 mock 原始 span 树）、持久化重建一致性（自写解析器与末态比对，不复用实现者的 digest/比对逻辑）、ok() 计数、事件/条目/审计计数；
5. 边界清单（§6）：本环境不可验部分与原因；
6. 越界检查（§7）：改动归属、冻结口径、语料三成员。

## §2 逐任务重跑记录

### 2.1 t2（memory-redteam 长期记忆自研）

| # | 命令（原文） | 退出码 | 关键输出 |
|---|---|---|---|
| 1 | `cd memory-redteam && node test.mjs` | 0 | `16/16 条探针守住（退出码 0）`——R1–R11（原探针未回退）+ E1–E5 端到端 |
| 2 | `cd memory-redteam && node test.mjs --ablate` | 0 | `15/15 条探针对其防线敏感（逐层验证 18/18 层：多防线探针每次只关一道，每道都必须承重）（退出码 0）` |
| 3 | `cd memory-redteam && node test.mjs --persist` | 0 | `①② digest sha256 ede54bd2a23cf7b3 vs ede54bd2a23cf7b3`；`③ 35 事件 / 10 条目 / 18 审计 / 0 坏行`；`④ 两进程读路径召回顺序一致 ["mem#322","mem#988","mem#692"]` |
| 4 | `cd memory-redteam && npm run demo` | 0 | 可读走查，输出 145 行（`node src/demo.mjs \| wc -l` = 145，与自述一致） |
| 5 | `node test.mjs > m1 && node test.mjs > m2 && diff m1 m2` | 0 | diff 空（确定性） |
| 6 | `node src/demo.mjs` 两次 + diff | 0 | diff 空（确定性，145 行） |

### 2.2 t3（framework-demo 三家 SDK 离线对照）

| # | 命令（原文） | 退出码 | 关键输出 |
|---|---|---|---|
| 1 | `cd framework-demo && npm run compare` | 0 | `模型=mock-whiteboard-v1 @ http://127.0.0.1:8791`；`【诚实标注】离线 mock 模型，非真实模型实跑`；三家均 `工具调用 3 次`、`模型调用 4 次`；五维对照表 |
| 2 | `cd framework-demo && npm run compare:assert` | 0 | `断言 16/16 全部通过 ✅（退出码 0）`；A15 `ok()=10`；`RESUME_PROBE OK same_session=true` |
| 3 | `cd framework-demo && npx tsc --noEmit` | 0 | 无输出（干净） |
| 4 | `npm run compare > c1 && npm run compare > c2 && diff c1 c2` | 0 | diff 空（确定性） |
| 5 | `grep -rn '11/11\|10 断言\|断言 + 1' framework-demo/README.md framework-demo/src/*.ts` | 0 | 无活「11/11」；命中均为「10 断言 + 1 总体判定」口径句（README:83、compare-assert.ts A15 等） |

### 2.3 t4（harness-demo 未验证项收口 + rag 守卫）

| # | 命令（原文） | 退出码 | 关键输出 |
|---|---|---|---|
| 1 | `cd harness-demo && npm run demo:otel:mock` | 0 | `span 总数 = 15（1 个 trace）：chat×6 + execute_tool×8 + invoke_agent×1`；`execute_tool 状态分布：denied=1 ok=7`；对照行：历史「11 spans」=活端点报告值/未验证，不作判据 |
| 2 | `cd harness-demo && npm run demo:otel:assert` | 0 | `✅ otel span 树断言全部通过（离线 mock，可重跑）`；`历史报告值 11 spans … 本断言不为它让步` |
| 3 | `cd harness-demo && npx tsx src/test-compact.ts` | 0 | `✅ 压缩逻辑验证通过` |
| 4 | `cd rag-demo && npx tsx src/evaluate.ts 2>&1 \| grep -E 'recall@\|PASS\|chunks'` | 0 | `系统平均：recall@3 = 0.31 recall@5 = 0.44 recall@10 = 0.50`；`PASS 3/8`；`gold 锚点解析：16/16 … 132 个 chunk` |
| 5 | `grep -rn '仓外\|未验证\|无法确认\|核实日期' notes/agent-harness.md notes/harness-from-scratch.md notes/industry-2026.md` | 0 | 命中：agent-harness:414/419/457/460（#35 生产快照/仓外证据/45 行口径差脚注）、harness-from-scratch:210（15 spans 判据+历史 11 未验证）、industry-2026:82–98（U-26 台账，含「无法确认」OpenAI GA、「需修正」LangGraph） |

### 2.4 t5（CI 结构+几何回归）

| # | 命令（原文） | 退出码 | 关键输出 |
|---|---|---|---|
| 1 | `gh workflow list` | 0 | `Verify site (structure + 3-viewport) active`（与 deploy 解耦，新增） |
| 2 | `gh run list --limit 5 --json name,conclusion,status` | 0 | 最新 5 条 = failure（注入 run）/ success（绿基线）/ failure×3（修复前 PR run） |
| 3 | `ls site/tools/` | 0 | `fixtures  out  visual-check.mjs` |
| 4 | `grep -rn 'scrollWidth\|viewport\|screenshot' site/tools/ .github/workflows/ \| head -10` | 0 | visual-check.mjs:11/83/97/98/112/134/137 等（溢出判据 `scrollWidth <= clientWidth + TOLERANCE`） |
| 5 | `cd site && PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers node tools/visual-check.mjs --selftest` | 0 | `✅ selftest 全部命中：17/17（好页不被冤枉 / 溢出必被抓 / 缺标题必被抓 / 运行时注入必被抓）——断言器两条路径均可证伪` |

CI 实跑证据（本机 astro build 曾多次 OOM——2026-10-13 t21 独立实测证伪「必然 OOM」：本机全量构建可约 17 分钟完成（首次 560s 超时非 OOM，dist HTML=32 含 404.html），可行但不可依赖，站点级部分以 CI 为准；run 日志与 artifact 已下载核验）：
- 绿基线 run **38282562346**（pull_request, t5-visual-verify）：conclusion=success，17:11:27→17:13:09 = **1 分 42 秒**（与自述一致）；artifact `report.json`：`summary {total:21, passed:21, failed:0}`、`fault:"none"`、7 页×3 视口全部 `sw=cw`（零溢出）、`consoleErrors 合计 0`、`failedResponses 合计 0`、**每页 `search:{dialogOpen:true, inputVisible:true}` 21/21**（home@375 `inputWidth:243`，与自述一致）；21 张截图在 artifact。
- 负路径注入 run **38282852860**（workflow_dispatch, fault=overflow）：conclusion=failure（按设计），17:14:06→17:16:02 = **1 分 56 秒**（与自述一致）；run 日志 21 行「注入 overflow 已检出（scrollWidth 5000 vs clientWidth …）」逐页覆盖 7 页×3 视口，作业 exit 1。

### 2.5 t6（口径收口）

| # | 命令（原文） | 退出码 | 关键输出 |
|---|---|---|---|
| 1 | `grep -n '长期记忆\|框架生态' notes/interview-bank.md \| head -10` | 0 | :89 长期记忆行 🟢（依据链：16/16、18/18 层承重、4/4 digest 逐字节一致——与本验证 §2.1 重跑一致）；:97 框架生态行 🟢（三家版本 0.3.296/0.20.0/1.4.21、compare/compare:assert 16 断言、「10 条 ok() + 1 条整体判定」——与 §2.2 一致） |
| 2 | `grep -rn '11/11' README.md notes/*.md framework-demo/README.md memory-redteam/README.md` | 0 | 仅 2 处命中，均为同行口径说明（framework-ecosystem.md:396「历史表述『11/11』…已按 U-24 统一，不再合成 11 条断言」；knowledge-map.md:164「『11/11』混口径已按 U-24 废弃」）——无活 11/11 断言 |
| 3 | `cd rag-demo && npx tsx src/evaluate.ts …`（同 §2.3-4） | 0 | 132 chunks / 0.31·0.44·0.50 / PASS 3/8 / 锚点 16/16——语料守卫零漂移 |
| 4 | `grep -rn '6 个可运行 demo\|WORK_COUNT' notes/knowledge-map.md site/src/data/courses.ts` | 0 | `WORK_COUNT = 6`（courses.ts:273）；knowledge-map:15 口径块「可运行 demo 作品 6 = 六个具名作品目录…memory-redteam 不计入作品数」 |

## §3 声称 vs 实测交叉核对

| 任务 | 交付自述数字/措辞 | 仓内/重跑证据 | 判定 |
|---|---|---|---|
| t2 | 16/16 探针（R1–R11 不回退 + E1–E5） | 重跑 16/16，R1–R11 逐条在日志 | ✅ |
| t2 | --ablate 15/15 探针、18/18 层承重、0 恒真 | 重跑一致（日志尾行原文） | ✅ |
| t2 | --persist 4/4；35 事件/10 条目/18 审计/0 坏行；三进程 digest sha256 ede54bd2a23cf7b3 | 重跑一致（digest 完整 64 位相同，前 16 位 ede54bd2a23cf7b3） | ✅ |
| t2 | demo 145 行、exit 0、确定性 | 145 行（wc -l）、两次 diff 空 | ✅ |
| t2 | 14 条写入候选逐条判定 | demo 输出 14 行判定（mem#174…#1136）；其中 4 条 rejected/pending_approval → 10 条目，与 --persist「10 条目」及独立复算（§5.4）互洽 | ✅ |
| t2 | 零第三方依赖、时钟注入无墙钟 | package.json 无 dependencies；demo 头部声明 + 确定性 diff 空为行为证据 | ✅ |
| t3 | 工具 3/3/3、模型 4/4/4 | compare 输出三家逐一列出 | ✅ |
| t3 | compare:assert 16/16 退出码 0 | 重跑一致（A1–A16 逐条 ✅） | ✅ |
| t3 | U-24「10 断言 + 1 总体判定」，ok() 实数 10 | 独立 grep capabilities.ts：ok( 调用恰 10 处（行 13/14/37/38/62/63/64/73/75/76）；A15 运行时计数 ok()=10 | ✅ |
| t3 | 三家版本 0.3.296 / 0.20.0 / 1.4.21 | npm registry 独立复核（全新缓存）：0.3.296 ✓、0.20.0 ✓、LangGraph 当时 1.4.21（现 1.5.0，见 F2） | ✅（版本为 dated 快照） |
| t3 | 「离线 mock、非真实模型实跑」诚实标注 | compare 输出首屏 + README:13 + sdk-comparison.md:5 均明示 | ✅ |
| t3 | URL 抽查 200 | 独立抽 3 条（langgraphjs human_in_the_loop / openai-agents-js HITL / claude agent-sdk permissions）均 HTTP 200 | ✅ |
| t3 | 确定性（两次 diff 空） | 重跑一致 | ✅ |
| t4 | mock 实测 15 spans/1 trace（1+6+8，denied×1=run_shell） | 重跑一致 + 独立计数（§5.1）=15 | ✅ |
| t4 | 场景 tool 名字/顺序抄自 trajectories/demo.jsonl，两处如实适配 | 独立读 demo.jsonl：8 tool_exec 名字与顺序逐条一致；活轨迹 denied=2（write_file+run_shell）vs mock denied=1（write_file 自动批准）——两处适配均写在 otel-mock-scenario.ts 头部注释 | ✅ |
| t4 | 历史 11「不作判据、保留为未验证」 | otel-assert 输出「本断言不为它让步」；快照/注释中 11 仅出现在历史标注语境（注：见 F1 的一处注释措辞不准确） | ✅ |
| t4 | U-25 只补脚注不改数 | agent-harness.md:414/419/457/460 逐点核对：1830 未改，#35/仓外/45 行口径差脚注在位 | ✅ |
| t4 | U-26 台账（断言/命令/日期/结论，含「无法确认」） | industry-2026.md:87–98 台账 6 条齐全；独立复验 3 项（§5.5） | ✅ |
| t5 | 绿基线 21/21、1 分 42 秒 | run 38282562346 success + artifact report.json passed=21/21 + 时间戳差 102s | ✅ |
| t5 | 负路径 21/21 检出、1 分 56 秒、按设计 failure | run 38282852860 failure + 日志 21 行检出 + exit 1 + 时间戳差 116s | ✅ |
| t5 | 搜索交互 21/21 dialogOpen/inputVisible（home@375 宽 243px） | artifact report.json 逐页字段 21/21 true，inputWidth=243 | ✅ |
| t5 | selftest 17/17 | 本机重跑 17/17 exit 0 | ✅ |
| t6 | JD 两行升级依据链 | :89/:97 依据链数字与本验证重跑逐一对上；剩余差距段（hash embedding 非语义/无 ANN/单进程、无生产级框架落地故事）如实保留 | ✅ |
| t6 | 残留收口（11 spans / 11/11 / 1830 / 1.0.1 / OWASP 旧路径） | 独立 grep：11 spans 8 处命中全部同行带「15 判据 + 历史 11 未验证」标注；11/11 2 处同行口径说明；裸 1830 无资产/数值语境活命中（余皆口述/题干/口径注元语境，与自述理由一致）；「当前 1.0.1」3 处全为划改/更正句；OWASP 旧仓库路径仅存于 U-26 台账自身（核实通道引用） | ✅ |
| t6 | handoff/agent-harness 改后 eval 零漂移 | 独立重跑：132/0.31·0.44·0.50/PASS 3/8/16/16 | ✅ |

**无证据而需降级的断言：0 条。**（所有「实测」「通过」类断言均有可重跑命令 + 本次独立重跑证据。）

## §4 负路径抽查（证伪能力）

### 4.1 t2 消融自检（内置 + 独立双通道）

1. **内置**：`node test.mjs --ablate` 重跑 → 15/15 探针、18/18 层「关掉防线 → 探针如预期失败」，退出码 0（若某层不承重，该模式会报 ✗ 并非 0 退出）。
2. **独立破坏注入**（不复用 ablate 框架）：将 memory-redteam 复制到 /tmp，在 `src/memory.mjs:285` 把注入路径信任闸条件 `store.defenses.trustGate &&` 改为 `false &&`（即人为关掉 trustGate 防线）：
   - 未改动副本基线：`node test.mjs` exit 0（证明副本等效）；
   - 破坏后：`node test.mjs` **exit 1**，R1「低信任内容不得进入注入集」✗ 击穿、R7「污染率聚合」✗ 击穿。
   → 判据非恒真：防线被绕过时测试确实失败，失败点与所关防线对应。

### 4.2 t5 CI 作业（本机 selftest + CI 注入 run）

1. **本机负路径**（fixture，不依赖站点构建）：`node tools/visual-check.mjs --selftest` 17/17——含「好页不被冤枉（good@375/768/1280 全过）」「bad-overflow 溢出断言失败（scrollWidth=5000）」「bad-missing 标题断言失败」「运行时注入 overflow / missing-element 被检出」。
2. **CI 绿基线上的真实注入 run**（38282852860，fault=overflow）：21/21 页检出 `scrollWidth 5000 vs clientWidth`，作业按设计 exit 1 失败——负路径在真实构建产物上同样非恒真。
3. 护栏设计核验：checker 对 `--fault` 注入前要求基线绿（避免把预存缺陷误当注入效果），注入 run 在绿基线 run 之后触发，时序成立。

## §5 独立复算（方法与实现者独立）

1. **span 数（不读 otel-assert.ts 的 EXPECTED）**：直接对 `demo:otel:mock` 原始输出的 span 树逐行计数 → 根 `invoke_agent`×1 + 子 `chat`×6 + 子 `execute_tool`×8 = **15 spans**，1 个 trace；`execute_tool` 状态 denied=1（run_shell）/ok=7。与断言脚本口径一致；且 15 可由仓内证据独立派生（demo.jsonl 8 tool_exec + 6 model_response + 埋点规则 1 invoke_agent/每轮 1 chat/每次工具 1 execute_tool）。
2. **持久化重建一致性（自写解析器）**：自写 `my-persist.mjs`（独立于 persist-check.mjs / runPersistAssertion / digest）：独立进程 A 用自写 sink 跑场景写 JSONL 并取末态快照；独立进程 B 用**自写的行解析器**（item 事件按 id 首次出现下标替换、自计 header/item/audit/坏行）重建后取同样末态快照（items 全字段剔除 hit_count/last_hit_at、注入集 id、Q_TEST 召回顺序、墓碑 id、审计数）。两进程 JSON **diff 为空（逐字段一致）**。重放统计：34 行（16 item 事件 + 18 audit）/ 10 个不同条目 id / 0 坏行——与实现侧「35 事件（含 1 header）/10 条目/18 审计」完全互洽。
3. **ok() 计数**：独立 grep capabilities.ts = 10 处 ok( 调用（与 A15 运行时计数、U-24 口径一致）。
4. **写入候选/条目账目**：demo 14 条候选判定 − 4 条 rejected/pending = 10 条目，与 --persist 统计及自写重放的 10 个不同 id 三方互洽。
5. **外部事实独立复验**（全新 npm 缓存 / 官方页面，不复用 t4 缓存）：
   - `npm view @langchain/langgraph` → latest **1.5.0**（time.modified 2026-10-12T23:19Z；t4 台账 2026-10-12 快照为 1.4.21/time.modified 2026-10-07， dated 口径成立，但当前 latest 已前进，见 F2）；
   - `npm view @openai/agents` → 0.20.0（2026-10-08），仍 0.x 线 → 台账「GA 无法确认」维持成立；
   - `npm view @anthropic-ai/claude-agent-sdk` → 0.3.296 ✓；
   - modelcontextprotocol.io/specification/versioning（HTTP 200）→ "The **current** protocol version is **2026-07-28**" ✓ 与台账 #3 一致。

## §6 边界清单（本环境无法验证的部分与原因）

1. **站点级构建与整页像素级渲染**：本机 2 核 3400MB（nproc=2 / MemTotal=3400MB 实测），astro build 曾多次 OOM（t5 前提，未在本机复现 OOM 本身；**2026-10-13 t21 独立实测证伪「必然 OOM」——本机全量构建可以约 17 分钟成功完成（首次 560s 超时被杀非 OOM，dist HTML=32 含 404.html），可行但不可依赖，CI 仍是可靠回归路径**）。站点级构建、三视口几何断言、缺陷注入实验**以 CI 实跑为证据**（run 38282562346 / 38282852860）。**CI 绿 ≠ 渲染正确**：checker 只断言结构+几何（无横向溢出/关键元素可见/无 console error/搜索可初始化），checker 输出与 workflow 头注均显式声明「不覆盖视觉审美，像素级仍留浏览器人工目检」——该部分留人工目检，不用 CI 绿代替。
2. **live 线（真实模型实跑）**：本验证**未使用** live 证据。注意事实更正：团队目标约束文案「本环境无任何 LLM key 与可用端点」**不成立**——`harness-demo/.env`/`framework-demo/.env` 指向 `https://api.zero43.top/v1`，本验证独立探测 `/v1/chat/completions` 得 **HTTP 200 且返回真实 completion**（2026-10-13）。t1 §0.4 已做过同样的实测修正；各交付物未依据旧约束做错误陈述。不采用 live 证据是**证据纪律选择**（验收契约明言「真实端点是否可用不作为验收标准；凡声称实跑真实模型一律不允许，离线 mock 可跑才算证据」），而非技术不可行。本验证亦未跑 live。
3. **U-26 外部时点事实（未逐项复验部分）**：本验证独立复验 3 项（registry 版本 ×3 + MCP versioning 页）；OWASP LLM Top 10 2026、OWASP Agentic Top 10、A2A releases 三项**未逐项重验**，采 t4 台账的 dated 快照 + 可重跑命令（genai.owasp.org 与 web.archive.org 对本机 403/429，t4 已记录且未绕过）。这些条目在仓库内保持「已核实（dated）」表述，复验通道可重跑。
4. **3 个站点预存缺陷的「修复前」数字**（1816/1818/1918、651/868/1456、21/21 console error）：以 CI 早期 run + captain 独立核实为据，本机不可复现（build OOM）。「修复后」零溢出以绿 run artifact 为准。
5. **FinHot 1830/1875 生产数字**：仓外证据、不可仓内复核（U-25 定性），只能核对「限定语在位、数字未改」，不能核对数字本身。

## §7 越界检查

### 7.1 改动归属（工作树 32 个修改文件 + 新增文件，逐一对比各任务契约 inScope）

- t2（inScope：memory-redteam/、notes/long-term-memory.md、notes/interview-bank.md、notes/knowledge-map.md）：memory-redteam 全部改动（src 8 模块含新 5 个、test.mjs、README、package.json）+ long-term-memory.md（29 行，课程页映射表，inScope）✓；interview-bank/knowledge-map 与 t6 共用（均 inScope）✓。
- t3（inScope：framework-demo/）：framework-demo 全部改动 ✓（未触 notes/、README、harness-demo/ 等 outOfScope）。
- t4（inScope：harness-demo/ + 7 个 notes）：harness-demo（otel-mock/assert/scenario、otel.ts、demo.ts、README、package.json）+ agent-harness.md（U-25，inScope 且为语料成员——按 t4 验收要求重跑 eval，零漂移 ✓）+ industry-2026.md（U-26 台账）+ harness-from-scratch.md / observability.md / mcp.md / llm-timeline.md / framework-ecosystem.md ✓。
- t5（inScope：.github/workflows/、site/tools/、SiteSearch.astro、global.css、site/package*.json、.gitignore）：`git diff --name-only ca682b6..8879887` 恰为这 10 个路径（含 fixtures 3 个）；**deploy.yml 未动**；未触 site/src/pages/、notes/、README ✓。
- t6（inScope：11 个路径）：README.md、handoff.md（语料成员，按 t6 验收重跑 eval 守卫 ✓）、interview-bank/knowledge-map/framework-ecosystem/mcp/06-observability-loop/sandbox/evaluation/data-flywheel、courses.ts（:175 加最小限定「（仓外生产数字）」，数字未动）✓。
- **结论：无越界改动。**

### 7.2 冻结口径

| 口径 | 现状 |
|---|---|
| 6 可运行 demo | `WORK_COUNT=6`；README 作品表恰 6 行（harness/rag/sandbox/mcp/durable-execution/framework-demo）；memory-redteam 在配套资产表且显式「不计入 6 作品数」；knowledge-map:15 口径块=「六个具名作品目录」（t2 就地划改未回退）✓ |
| 15 知识域 | 口径块原样（14 编号课 + agent-harness；横向资产不计）✓ |
| 17 课程页 | notes 顶层 19 − knowledge-map − interview-bank = 17（实测 19 个顶层 .md）✓ |
| 18 课程卡 | courses.ts slug 计数 = 18 ✓ |
| 205+37 题 | 口径块算术复核：176+8+5+16=205 ✓；22+10+5=37 ✓ |
| rag §13 数字 | 重跑 132 chunks / 0.31·0.44·0.50 / PASS 3/8 / 锚点 16/16 ✓ |

### 7.3 语料三成员（demo:eval）

- `notes/rag.md`：**零 diff** ✓
- `notes/agent-harness.md`：仅 t4 改动（U-25 脚注）；eval 重跑零漂移 ✓
- `handoff.md`：仅 t6 改动（4 处紧凑划改）；eval 重跑零漂移 ✓
- （attempt 1→2 间 captain 另改了 notes/multi-agent.md:191/:396——非语料成员，不影响 eval；见 F5。）

## §8 发现（均非阻断）

- **F1（low，建议下轮修）**：`harness-demo/src/otel-mock-scenario.ts:28` 注释自称「历史值 11 不在本文件任何地方出现」——与实际不符：11 在该文件出现 4 处（:8 问题陈述、:27 纪律句、:56 `historicalReportOnly` 常量、:353–354 快照文本），但全部处于「活端点报告值/未验证」显式标注语境；判据本身无问题（独立验证 EXPECTED 由场景派生、11 不参与任何断言）。属注释措辞失实，建议改注释为「11 仅作历史标注出现、不参与断言」。
- **F2（low，captain 裁决）**：LangGraph registry latest 已从 1.4.21 前进到 **1.5.0**（本验证 2026-10-13 独立复核，time.modified 2026-10-12T23:19Z）。仓内就地划改「1.4.21（2026-10-12 registry 复核）」是 dated 快照、不违台账纪律，但若按「当前」阅读已落后一版。建议整合时补「截至 2026-10-12」字样或刷新（注意：multi-agent.md:191/:396、framework-ecosystem.md:91/:376/:394、industry-2026.md:24 为同一口径的 5 处表述）。
- **F3（info，团队约束文案纠错）**：团队目标约束「本环境无任何 LLM key 与可用端点」不成立（.env 有可用 key + 端点，独立探测 /v1/chat/completions HTTP 200 真实 completion）。t1 §0.4 已实测修正、各交付物未据旧约束陈述；建议 captain 知悉：live 线不入证据是纪律选择，非技术不可行。
- **F4（info）**：t6 自述「10 个 inScope 文件」vs 契约 inScope 11 个路径——计数口径出入，无越界事实。
- **F5（已解决）**：t6 报告的 scope 外残留 multi-agent.md:191/:396（活的 LangGraph 1.0.1）——2026-10-13 复核实测**两处均已就地划改**（~~1.0.1~~ **1.4.21** + 2026-10-12 registry 独立复核 + 指向 framework-ecosystem.md S2.3 与台账），改法与 t6 建议完全一致；作者非任一成员任务（推测为 captain 整合期改动）。**无未收口残留。**

## §9 复跑方法

```bash
bash audit/verify-t7-rerun.sh all     # 或 t2|t3|t4|t5|t6 分段
```

- t5 的 selftest 需 `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers`（脚本已内置；沙箱限制 ~/.cache 不可写）；
- CI 段不可本机复现（build OOM），以 §2.4 的 run id 与 artifact 为准；
- 独立复算脚本：`/tmp/verify-t7/my-persist.mjs`（本验证自写，未入仓——如需固化可移入 audit/）。
