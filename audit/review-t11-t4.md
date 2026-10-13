# t11 R4 评审报告：t4（W3 未验证项收口 U-23/U-25/U-26）

- 评审人：sdk-dev2（非 t4 实现者；t4 实现者 = evidence-dev2）
- 评审日期：2026-10-13
- 被评审任务：t4（kind=implementation，status=completed）
- **结论：PASS（无阻断发现）** —— t4 的 7 项 acceptance 逐条独立复核成立，5 条 verify 命令独立复跑全部 exit 0。
- 评审原则：不接受实现者自述；每条给独立复跑证据（命令输出或 file:line）；与 t7 V1（audit/verify-t7.md）互为独立（本报告不复用 t7 结论，仅在归因困难处引用其已核实的归属）。

## 0. 独立复跑记录（全部在评审时点 2026-10-13 重跑）

| # | 命令 | 退出码 | 关键输出 |
|---|---|---|---|
| 1 | `cd harness-demo && npm run demo:otel:mock` | 0 | 打印确定性 span 树；`span 总数 = 15（1 个 trace）：chat×6 + execute_tool×8 + invoke_agent×1`；`execute_tool 状态分布：denied=1 ok=7`；端点收到 6 次 /chat/completions；末尾对照历史 11「**不一致**…仍标未验证」。日志 /tmp/rev_otel_mock.txt |
| 2 | `cd harness-demo && npm run demo:otel:assert` | 0 | 全部 ✅（trace 数/span 总数/按名计数/根与父子关系/生命周期覆盖/8 项 chat 属性/工具名多重集/状态分布/被拒的是 run_shell/call.id）；末尾「历史报告值 11 spans（不参与断言，仅对照）…本次 mock 实测 15 → 数值不一致（本断言不为它让步）」。日志 /tmp/rev_otel_assert.txt |
| 3 | `cd harness-demo && npx tsx src/test-compact.ts` | 0 | 「✅ 压缩逻辑验证通过」 |
| 4 | `cd rag-demo && npx tsx src/evaluate.ts`（corpus 守卫，t4 触及语料成员 agent-harness.md） | 0 | `recall@3 = 0.31  recall@5 = 0.44  recall@10 = 0.50`；`PASS 3/8`；`gold 锚点解析：16/16 全部命中（…132 个 chunk…）`——与冻结基线逐字节一致，零漂移。日志 /tmp/rev_eval.txt |
| 5 | `grep -rn '仓外\|未验证\|无法确认\|核实日期' notes/agent-harness.md notes/harness-from-scratch.md notes/industry-2026.md` | 0 | agent-harness.md:414/419/457/460 限定语在位；harness-from-scratch.md:210 15 判据+11 未验证；industry-2026.md:82/89/91/99 台账与「无法确认」在位 |

另做负路径证伪（评审人自建临时脚本，跑完即删）：把 `EXPECTED.spanTotal` 篡改为 11 → 断言引擎 `exit 1`（「实际 span 数=15，被篡改的期望=11 → FAIL」）。证明判据**结构上**不为历史值 11 让步。

## 1. 逐项 acceptance 核对

### A1 U-23 收口（离线 mock 判据）——✅ 成立
- `demo:otel:mock` 打印 span 树与计数（复跑 #1）；`demo:otel:assert` 断言形态/计数、不符非 0（复跑 #2 + 负路径 exit 1）。
- 离线可复现：mock 端点 `127.0.0.1` 随机端口（`src/otel-mock-scenario.ts:146-162` `server.listen(0, "127.0.0.1")`），运行前把 `LLM_BASE_URL/KEY/MODEL` 指向本地（:188-191），全程无外网无 key。
- 真实端点不作为验收前提：`demo:otel`（活端点）在 README/demo.ts 头部均改标「需活端点，仅作人工补充」（harness-demo/README.md:37、src/demo.ts:7），判据只依赖 mock 两命令。
- 冻结场景的派生性：8 个 tool_call 名字/顺序逐条抄自仓内活端点轨迹 `trajectories/demo.jsonl`（scenario:15-24 头注，含两处如实适配 a/b 说明）；EXPECTED=1+6+8=15 由场景派生（:24、:48-58），非凑数。

### A2 U-23 诚实性（以 mock 实跑数改写，11 降级不悄悄保留/替换）——✅ 成立
- mock 实测 15 与文档写入值一致：harness-from-scratch.md:210、observability.md:71、harness-demo/README.md:37-38 均写「15 spans / 1 trace（2026-10-12 实跑值）」。
- 历史 11 的降级方式=**就地划改**（规则 4）：原「11 spans 报告值（未验证）」单元格被整行替换为「15 判据 + 历史 11=活端点报告值/未验证/不作为任何判据」；mock 与 assert 的输出自带对照行「与历史 11 **不一致**…仍标未验证」+「本断言不为它让步」——不是悄悄替换（11 仍在场且被解释），也不是悄悄保留为判据。
- 全仓活表述扫描：现存 6 处「11 spans」活命中（interview-bank.md:87,102；details/06-observability-loop.md:27；knowledge-map.md:164；handoff.md:14,77）全部同行带「未验证/不作判据」标注。其中 4 处非 t4 文件——t4 交付说明已如实列为「遗留（非本任务 scope，供 captain/t6）」，由 t6 W5 收口（t4 未越界代改）。
- t7 曾报 F1（scenario:28 注释「11 不在本文件出现」措辞失实）：**当前树已修正**——`src/otel-mock-scenario.ts:28` 现为「『11』**确实出现在本文件**（EXPECTED.historicalReportOnly 契约…）——均仅作为『未验证的历史报告值』被打印对照，不作为任何断言判据」。措辞与事实一致，F1 视为已解决。

### A3 U-25 收口（只补限定语，不改数字）——✅ 成立
- `git diff notes/agent-harness.md` 仅 2 个 hunk：两处表格行追加括注（「#35 生产台账快照，**仓外证据**，口径差见下表下注」）+ 两条 blockquote 脚注（「1875 与 1830 差 45 行口径差、来源未说明（待核对）」）。逐行核对 diff：1830、1645、858、25 分钟等数字全部原样（只出现在未改动的上下文行），1875 仅在新脚注中以口径差身份出现。
- t7 独立逐点复核（audit/verify-t7.md:99）：agent-harness.md:414/419/457/460，1830 未改、脚注在位。
- 确定语气消除：两处 FinHot 数字均挂「#35 生产快照/仓外/不可仓内复核」限定，不再裸陈述。

### A4 U-26 收口（逐条联网核实 + 日期 + 来源 + 结论三态）——✅ 成立
- 台账在位：`notes/industry-2026.md` §U-26 核实台账（:89-99 起），6 条（1-6 + 4a），每条含 断言(仓库位置) / 可重跑通道 / 核实日期 / 结论（确认/需修正/无法确认），结论集定义与纪律声明在 :89（含 403/429 受阻如实记录、未绕过）。
- 评审人独立抽查 4 条（> 要求的 2 条），全部可达且内容支持结论：
  | 条目 | 独立复跑 | 结果 vs 台账 |
  |---|---|---|
  | 3 MCP spec | `curl -sSL modelcontextprotocol.io/specification/versioning` | 可达；页「Version 2026-07-28 (latest)」+ canonical `/docs/2026-07-28/learn/versioning` → 支持「2026-07-28 现行」✅ |
  | 4/4a LangGraph | `npm view @langchain/langgraph version dist-tags.latest time.modified --cache <全新缓存>` | `1.5.0 / 1.5.0 / 2026-10-12T23:19:38.982Z` → 与台账 4a 行逐字一致 ✅（且继续证伪「当前 1.0.1」） |
  | 5 A2A | `curl api.github.com/repos/a2aproject/A2A/releases` | latest `v1.0.1`（2026-05-28T11:34:36Z）→ 逐字一致 ✅ |
  | 1 OWASP LLM Top 10 2026 | `curl raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/README.md` | 「Current release: 2026 — published August 4, 2026」→ 逐字一致 ✅ |
- 「无法确认」项未写成已确认：OpenAI Agents SDK「2025 GA」在 framework-ecosystem.md:90 保留原表述但挂「**该时点本轮未能取得一手源，标『无法确认』**；registry 实测仍 0.x 线（0.20.0）未背书 1.0」，:394 同口径复述；台账 :99 结论=**无法确认**。未升级、未删除。✅
- 版本演变的诚实处理：1.4.21（2026-10-12 快照）→ 1.5.0（2026-10-13 复核）记为台账 4a 行「版本演变、非口径错误」，t7/captain/t4 三方全新缓存独立复核一致；1.4.21 保留为对照实跑快照的时点值（framework-ecosystem.md:396 明示「对照实跑快照=2026-10-12；截至 2026-10-13 复核 registry latest 已升 1.5.0」）——dated 快照，不是过期失实。

### A5 版本句覆盖 + 独立复核（不得直接采信他人结论）——✅ 成立
- 覆盖：framework-ecosystem.md:91（S2.3 表，~~1.0.1~~ ~~1.4.21~~ 1.5.0 完整划改链+时间戳+命令）、:284（候选表 B）、:394/:396（S2.3 回填与实操段）；llm-timeline.md:36（MCP 句挂 2026-10-12 复核注，指向台账 #3）；两文件均为 t4 inScope 归口。
- 独立复核：台账 #4 明确「**独立复核** t1 实测（结论一致，非直接采信）」，通道为全新缓存目录的 `npm view`（1.4.21 / time.modified 2026-10-07）。评审人今日以全新缓存复跑（1.5.0）进一步支持「1.0.1 为过期口径」结论。

### A6 语料守卫（agent-harness.md 被触及 → eval 零漂移 + 解释）——✅ 成立
- 评审人独立重跑 `cd rag-demo && npx tsx src/evaluate.ts`：**132 chunks / 0.31·0.44·0.50 / PASS 3/8 / 锚点 16/16**，exit 0——与冻结基线零漂移（复跑 #4）。
- t1 预警「加脚注会改 chunk 边界，锚点可能变化，必须解释而非删脚注」：t4 交付说明给出处理过程（长脚注曾把两节切到 134，按 rag.md §13 耦合警告压缩脚注回稳，脚注三要素保留；t7 亦复核零漂移）；终态 132 chunks、锚点 16/16 证明边界已回稳且脚注未删。
- `notes/rag.md` 零 diff（评审人 `git diff --stat` 为空）。

### A7 冻结口径 / 不新增第 7 作品 / 不改 site——✅ 成立（含归因说明）
- t4 实际改动 = harness-demo/（otel-mock.ts、otel-mock-scenario.ts、otel-assert.ts 新增；otel.ts、demo.ts、README.md、package.json 修改）+ notes/{agent-harness, harness-from-scratch, observability, industry-2026, mcp, llm-timeline, framework-ecosystem}.md——**全部在 t4 inScope 内**（diff 内容逐一目检，与交付说明一致；otel.ts 改动为 initOtel 加 console 开关 + finishedSpans() 导出，纯增量，`demo:otel` 默认行为不变）。
- t4 outOfScope 文件越界扫描：framework-demo/、site/、interview-bank、knowledge-map、README.md、rag.md、handoff.md 的 diff 中均无 t4 特有标记（demo:otel:mock/otel-mock/核实台账/GenAI-Security-Project/2026-07-28/A2A v1.0.1/仓外证据）；handoff.md 与 interview-bank.md 中 2 处「demo:otel:mock」命中是 t6 W5 对 11-spans 行的收口引用（非 t4 改写）。
- 一处需说明的归因：`site/src/data/courses.ts:175` 加了「（仓外生产数字）」限定——该文件在 t4 outOfScope（site/），但 t7 独立验证已核其归属为 **t6**（W5 inScope 11 路径之一，audit/verify-t7.md:155「courses.ts（:175 加最小限定「（仓外生产数字）」，数字未动）」），数字 1830 未改、非 t4 所为。
- 冻结计数：WORK_COUNT=6（courses.ts:273）未动；15 域/17 课程页/205+37 题所在文件无 t4 改动；rag §13 数字=eval 零漂移（A6）。无新增作品目录。

## 2. 与 t7 V1 发现的对照

| t7 发现 | 当前树状态 | 评审结论 |
|---|---|---|
| F1 scenario:28 注释措辞失实 | 已改为准确措辞（:28「『11』确实出现在本文件…均仅作为未验证的历史报告值」） | 已解决，不再阻断 |
| F2 LangGraph 1.5.0 vs 1.4.21 | 台账 4a 行 + 6 处同步（framework-ecosystem:91/284/394/396、multi-agent:191/396）+ 三方独立复核 | 已收口（multi-agent 两处为 captain 整合期改动，t7 F5 已核） |

## 3. 非阻断观察（不影响 verdict，供 captain 知悉）

- O1：台账 #2（Agentic Top 10）具体日「12-09」沿用上一轮 genai.owasp.org 核实、本轮直连 403/429 受阻未复验——结论行已明确区分「确认（条目/版本/月）」与「具体日=上轮已核实、本轮复核受阻，不重复标为已核」，处理诚实，无需动作。
- O2：`workspace/out/otel-spans.md` 快照含生成时间/主机（gitignored，.gitignore:18）——不影响 stdout 确定性（assert 输出无时间戳），仅快照工件自带元数据，符合「生成器产出勿手改」纪律。
- O3：`demo:otel`（活端点线）本机是否可跑不在本评审范围（无 key 纪律）；其表述已正确降级为「人工补充」，判据不依赖它。

## 4. 复跑脚本

本次复跑命令均已在上表列全（可直接粘贴执行）；原始输出存 /tmp/rev_otel_mock.txt、/tmp/rev_otel_assert.txt、/tmp/rev_eval.txt。负路径临时脚本已删除，未留痕于工作树。

**verdict: pass**
