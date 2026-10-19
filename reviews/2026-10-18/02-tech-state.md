# 技术准确性 B（安全 / 沙箱 / 持久执行 / 记忆 / 多智能体 / 系统设计）评审报告（tech-state）
- 评审员：tech-state｜时间：2026-10-18 23:49（Asia/Shanghai）
- 覆盖声明：
  - **全读（逐行）**：`notes/sandbox.md`（533 行）、`notes/durable-execution.md`（447 行）、`notes/mcp.md`（568 行）；对照证据源逐行读 `sandbox-demo/src/{types,policy,sandbox,scenario,replay,tools,demo}.ts`、`durable-execution-demo/src/{state,demo,worker,runner,recover}.ts`、`mcp-demo/src/*.ts`（行数核对）。
  - **抽样（列节/行）**：`notes/long-term-memory.md` — S4 读路径（125–176）、S6 评测（215–241）、S7 安全（242–306）、S10 走查（347–438）、题库（463–487）、来源（488–496）；`notes/multi-agent.md` — S3 通信（141）、S4 单线程写（145–177）、S8 轨迹 schema（266–352）、S9（354–408）、来源（441–447）；`notes/system-design.md` — 决策树（66–96）、S3 选型（97–138）、S4/S6/S8（194–273）、S9 口述稿（274–381）、来源（407–432）。抽样方法=按 claim 关键词 `实测|证明|唯一|必然|所有|规范|一手|协议` grep 定位后再读上下文。
  - **未读（原因）**：`notes/multi-agent.md` 与 `notes/system-design.md` 的全文（预算 150–250 KB 上限，按宪章 §2 只做定向抽样）；`memory-redteam/src/{memory,redteam,scenario,persist,*}.mjs` 只读了 `retrieval.mjs` 与 `redteam.mjs` 的 R11/E1 段（其余靠实跑输出核对）；`notes/process/*`、`analysis/*` 与线上站点渲染（非本分区）。
- 结论摘要：
  1. `mcp.md` 把 **sampling / roots 当成"server 能提供的原语"**，且未标注 2026-07-28 已把 Roots/Sampling/Logging 标为 Deprecated、server-initiated requests 已被 MRTR 取代——与该文件自己引作权威的官方规范页相互矛盾（最严重项）。
  2. `durable-execution.md:256` 记录的手工分步复现命令 `npx tsx src/worker.ts --mode=crash --crash=C` **静默退化成 resume**（不崩溃、exit 0），文档声称的崩溃复现无法按原文复现。
  3. `sandbox.md` S3.5 声称 demo 执行路径是"canonicalize → 许可 → lockdown → 审计"，实测控制流相反：`Policy.decide`（含对**未规范化** raw path 的参数匹配）先于 `assertInWorkspace`。
  4. `sandbox.md:187` 的 A 组 sha256 锚点 `ecbabb3a…` 不可复现（实测 `df9a4e24…`）；B 组 `9c0d52aa…` 与 durable/memory 三套锚点全部逐字节命中。
  5. 持久执行/记忆的判定表与红队判据**可复跑**（崩溃点 A/B/C 处置、副作用恒=1、`--persist` 三方 digest、`16/16`+`15/15 探针/18 层`），且"断言有牙"经我独立改坏代码验证。
- 本轮未验证的范围（显式列出，**不得当已核实**）：① 未独立验证 `mcp.md` S4.2/S4.3 两份 OWASP 清单条目号（2026 版 LLM Top 10 与 Agentic Top 10）、`2025-11-25`/`2025-06-18`/`2024-11-05` 三版 changelog 细目、registry 的 DNS 治理细节——只验证了 `2026-07-28` 与传输/EOL 部分；② 未验证 NSA 批评原话的一手出处（只验证了 CVE-2025-6514 存在且 CVSS 9.6）；③ 未验证 A2A TSC 8 席名单与 `aaif.io` 项目列表（转交 fact-timeline）；④ `notes/long-term-memory.md`/`multi-agent.md`/`system-design.md` 未全读，未读部分的结论未取信；⑤ `memory-redteam` 我只实跑了三态命令与 `--ablate`/`--persist`，未逐行读 `memory.mjs`（26 KB）核对 BM25 k1=1.2 / 64 维三元组的实现细节；⑥ 未验证线上站点是否发布了与本报告相关的字段文案；⑦ 未验证 `sandbox-demo` 的 `npm run typecheck`（宪章禁止装依赖，`^22.10.0` 的 `@types/node` 已在 node_modules，但未跑）。
- 环境：Node **v26.8.2**（`/home/ubuntu/.hermes/node/bin/node`）、本机 `git status` 自检见文末。全部命令均在 60–180s 内结束；`durable-execution-demo` 的 `npm run demo` 会写 gitignore 的 `.state/`（仓库自带"运行产物，可随时删除重来"口径），未触碰任何受版本控制文件。

---

### TECHSTATE-F1｜`mcp.md` 把 sampling/roots 当成 server 原语，并漏标 2026-07-28 的 Deprecated（high）
- 严重度：high
- 对象：`notes/mcp.md:81-82`（mermaid「四原语 · tools / resources / prompts / sampling」标注在 MCP Server 下）、`notes/mcp.md:87`「**原语（server 能提供的四类）**」表格（含 sampling）、`notes/mcp.md:96`「sampling 方向相反，是唯一"server 发起、host 执行"的原语」、`notes/mcp.md:98`「roots（server 声明它能碰的路径根——**server 端的 scope 声明**）」、`notes/mcp.md:102-107`（版本线 "2026 更新"）、`notes/mcp.md:321`/`notes/mcp.md:505`
  - 引文 1：`**原语（server 能提供的四类）**`（mcp.md:87）
  - 引文 2：`roots（server 声明它能碰的路径根——**server 端的 scope 声明**，与 host 端的 policy 互补）`（mcp.md:98）
- 现象：方向与时效各错一处——(a) 官方规范把 `Sampling`/`Roots`/`Elicitation` 列在 **Client Features**，Server Features 只有 `Discovery/Prompts/Resources/Tools`；roots 是**客户端**向 server 暴露的路径（"clients expose filesystem roots to servers … Servers can request the list of roots from supporting clients"），讲义说成 server 的自我声明；(b) `2026-07-28` 已把 Roots、Sampling、Logging **标为 Deprecated**（"New implementations **SHOULD NOT** adopt it"），并把 `sampling/createMessage`、`roots/list` 等 server-initiated requests **替换为 MRTR**（`InputRequiredResult`）；讲义 S2.1 自称"2026 更新"却只列了去状态化，仍把 sampling 当核心原语并作为面试必答点（`mcp.md:330`「能指出 sampling 是 MCP 里信任模型最复杂的一个原语」）。
- 证据：
  - 命令：`web_fetch https://modelcontextprotocol.io/specification/2026-07-28/changelog` → 关键输出：「Deprecate the Roots, Sampling, and Logging features (SEP-2577). These features remain fully functional during the deprecation window but new implementations should not add support for them.」+「Multi Round-Trip Requests (MRTR) pattern introduced which replaces the previous approach of sending server-initiated requests, such as `roots/list`, `sampling/createMessage`, or `elicitation/create`」。
  - 命令：`web_fetch https://modelcontextprotocol.io/specification/2026-07-28/client/roots` → 「**Deprecated**: The Roots feature is deprecated as of protocol version `2026-07-28`」+「provides a standardized way for **clients** to expose filesystem "roots" to servers … They are informational guidance rather than an access-control mechanism」；同页导航把 Roots/Sampling/Elicitation 置于 **Client Features**、Prompts/Resources/Tools 置于 **Server Features**。
  - 命令：`web_fetch https://modelcontextprotocol.io/specification/versioning` → 「The **current** protocol version is **2026-07-28**」（确认讲义版本号本身正确；错的是原语归属与弃用标注）。
  - 正向核对：`mcp.md:107`「移除 initialize 握手与 Mcp-Session-Id，新增 server/discover、subscriptions/listen 订阅、MRTR」与官方 Key Changes 第 1/2/3/4/7 条**逐条一致**（这一句是对的）。
- 影响：从**技术准确性**看，这是本分区唯一的"对外声明与规范相反"：读者/考生会(a)把 client feature 描述成 server 提供的能力、(b)在 2026-10 的面试里把已弃用且已被 MRTR 替代的 `sampling/createMessage` 机制讲成"当前最复杂原语"。(c) `notes/mcp.md:553`（练习 8）与 `site/src/data/course-structure.ts:196`（「MCP 四原语与四层防御随 mcp-demo 边跑边建」）把该口径传导到题库与站点文案。
- 建议方向：S2 的原语表按官方 Client/Server Features 重排并为 sampling/roots 加 Deprecated 徽标；S5 改写为"方向反转曾是信任难点，2026-07-28 起由 MRTR 承接"，并把 MRTR/`InputRequiredResult` 写进 S2.1 的"2026 更新"清单。
- 置信度：高（三处官方页面均为一手源；讲义行号已逐字核对；仅"是否算 blocker"取决于对考生影响的判定——本条**未**给出 blocker，因为讲义的 host 侧强制结论不受影响）。

### TECHSTATE-F2｜`durable-execution.md:256` 的手工复现命令静默退化为 resume，不产生崩溃（high）
- 严重度：high
- 对象：`notes/durable-execution.md:256`
  - 引文：`崩溃/resume 也可手工分步复现：`npx tsx src/worker.ts --mode=crash --crash=C` → `npx tsx src/worker.ts --mode=resume``
- 现象：文档给出的 `--mode=crash --crash=C` 是 `=` 形式，而 `durable-execution-demo/src/worker.ts:30-35` 的 `flag()` 只做 `argv.indexOf("--mode")`（空格形式）匹配；`=` 形式一律返回 null，于是 `mode` 回落到默认 `"resume"`、`crashAt` 为 null——进程**不崩溃**，把 4 步全跑完并 exit 0。照文档逐字执行的人会以为"已手工复现崩溃点 C"，实际得到一次无崩溃的完整运行。
- 证据：
  - 命令（照文档原文）：`cd durable-execution-demo && rm -rf .state && npx tsx src/worker.ts --mode=crash --crash=C` → 输出首行 `[worker] mode=resume task=backfill-1645 …`，末尾 `REPORT_JSON:{…"crashPoint":"none"…"sideEffects":{"messageDeliveries":1}}`，`EXIT_A=0`（无 `💥 崩溃注入` 行）。
  - 对照命令（空格形式）：`rm -rf .state && npx tsx src/worker.ts --mode crash --crash C` → `[worker] mode=crash crash=C …` + `💥 崩溃注入 C（exec 后未落盘：副作用已发生、结果未记录）→ process.kill(process.pid,'SIGKILL') 真实自杀`，`EXIT_B=137`。
  - 波及点：`durable-execution-demo/src/worker.ts:7` 注释写「用法：`npm run demo:crash` 之后 `npm run demo:resume` 也可手工复现」，但 `durable-execution-demo/package.json` 的 scripts 只有 `demo` / `demo:one` / `typecheck`（无 `demo:crash`、`demo:resume`）。
  - 正向核验：主验收路径可复跑——`npm run demo` 连续两次输出 md5 完全相同（`6edf9b5233153c20126e3552eb2d15b9`，9766 字节，`diff` 空），三崩溃点报告 sha256 = `675c17a5cc32`/`7bd8f27afdb6`/`ee239f775d7a` 与文档逐字一致。
- 影响：从技术准确性看，这是"关键事实无法按文档复现"，且失败是**静默**的（无报错、exit 0）——接手者会把一次普通 resume 当成崩溃恢复演练通过，等于跳过验证；CI 里若照抄该命令，门禁恒绿。
- 建议方向：文档与 `worker.ts` 注释统一为可用的调用形式（或让 `flag()` 同时接受 `--k=v`），并把 `demo:crash`/`demo:resume` 补成真实 script 或从注释删除。
- 置信度：高（两种形式实跑对照，输出已逐字记录；`package.json` 已读）。

### TECHSTATE-F3｜`sandbox.md` S3.5 宣称的四层顺序与 demo 实际控制流相反（medium）
- 严重度：medium
- 对象：`notes/sandbox.md:236`（「把 `sandbox-demo` 的执行路径拆开，正好是四层」）、`notes/sandbox.md:238-253`（mermaid：L1 canonicalize → L2 许可 → L3 lockdown → L4 审计）、`notes/sandbox.md:284`（「**顺序有意义**：先规范化再授权（否则授权的是"看起来安全"的路径）」）
  - 引文 1：`把 `sandbox-demo` 的执行路径拆开，正好是四层`（sandbox.md:236）
  - 引文 2：`顺序有意义：先规范化再授权（否则授权的是"看起来安全"的路径），授权后再 lockdown`（sandbox.md:284）
- 现象：实测控制流是**先授权、后规范化**：`replay.ts:60` 先调用 `cfg.policy.decide(call.tool, call.args)`（参数级 `when` 直接对**未经规范化的原始字符串**做匹配，见 `scenario.ts:28-29` 的 `/(^|\/)\.env$/` 与 `startsWith("work/ainews-new/")`），之后才在 `replay.ts:80/91` 的执行分支里经 `tools.ts:27-28` 的 `pth()` → `sandbox.ts:87` → `assertInWorkspace`（`sandbox.ts:61`）做路径规范化。S3.5 把 demo 描述成"先规范化再授权"，与代码相反；讲义自己承认参数级 `when` 拦 `.env`/跨树（`sandbox.md:280`），恰好证明授权发生在规范化之前。
- 证据：
  - 命令：`grep -n "decide(\|execTool(\|runExec(" sandbox-demo/src/replay.ts` → `60: const v = cfg.policy.decide(call.tool, call.args);`、`80/91: const r = runExec(() => execTool(call.tool, call.args, ctx));`（decide 在前）。
  - 命令：`grep -n "const pth\|assertInWorkspace" sandbox-demo/src/tools.ts sandbox-demo/src/sandbox.ts` → `tools.ts:28  ctx.sandbox ? ctx.sandbox.path(str(args,k)) : str(args,k)`、`sandbox.ts:87 return assertInWorkspace(this.config.workspace, raw)`。
  - 命令：`grep -n "when:" sandbox-demo/src/scenario.ts` → `28: … /(^|\/)\.env$/.test(String(a.path ?? ""))`、`29: … String(a.path ?? "").startsWith("work/ainews-new/")`（原始字符串匹配）。
  - 命令：`npm run demo`（`sandbox-demo`）→ 判定流全部落到预期通道、`✅ 重放一致性断言通过`（即该顺序不影响现有断言，缺的是文档与代码一致性）。
- 影响：读者会把"先规范化再授权"当成 demo 已验证的既有设计，并在自己的实现里依赖它；而 demo 的真实顺序正是 S3.5 自己警告的"授权的是看起来安全的路径"——只是被 W 层 `assertInWorkspace` 兜住（`f5` 那段越权写因此才被判 blocked）。接手者若按讲义复刻，会误判哪一层在承担拦截责任。
- 建议方向：S3.5 的图与结论改为"demo 实际是先按 raw 参数授权、再由 W 层规范化兜底"，或明确标注该四层是**推荐设计**而非 demo 现状。
- 置信度：高（控制流由三处源码行号直读确认；未构造真实绕过路径，仅论证顺序与文档不符）。

### TECHSTATE-F4｜`sandbox.md:187` 记录的 A 组 sha256 锚点不可复现（medium）
- 严重度：medium
- 对象：`notes/sandbox.md:186-189`
  - 引文：`- A（仅权限门）`ecbabb3a901ff81aab6404c800eb49d3ef6e3722dce9db98507e9adda1777aca``（sandbox.md:187）
- 现象：按文档跑 `cd sandbox-demo && npm run demo`，A 组实测 sha256 为 `df9a4e2406109a675aca5390a73d9e175f0e5703ebe4bddee0510095099e5536`，与讲义记录的 `ecbabb3a…` 不同；同一次运行的 B 组 `9c0d52aa6d5812440b8c0045d97ae793351d34a1c5207ecc486a1130b614246c` 与讲义**逐字相同**。B 命中而 A 不命中，说明 demo 版本未整体漂移，只有 A 组转录内容（`check_container` 的"被替换"分支，仅 A 组会打印）发生过变化，讲义那句"hash 随 demo 版本变化"的免责说明覆盖不了这个缺口。
- 证据：
  - 命令：`cd sandbox-demo && npm run demo` → `A（仅权限门）: run 1 (golden) sha256=df9a4e2406109a675aca5390a73d9e175f0e5703ebe4bddee0510095099e5536`；`B（四通道+沙箱）: … sha256=9c0d52aa6d5812440b8c0045d97ae793351d34a1c5207ecc486a1130b614246c`；两行都跟随 `run 2/3`、`run 3/3 → 逐字节一致 ✅`。
  - 命令：`grep -rn "ecbabb3a\|9c0d52aa\|df9a4e24" --include=*.md --include=*.ts .` → 仅 `notes/sandbox.md:187` 存在旧 A 值；`df9a4e24…` 另见 `.agent-teams/archive/learn-site-audit/team.json:93`（**线索，未取信**：他人运行记录，非本次证据）。
- 影响：讲义把这两个 hash 称作"逐字节可复现的机器可验证锚点"（`sandbox.md:189`），其中一半已失效——读者/CI 照抄会得到"复现失败"，进而无法区分是 demo 漂了还是文档旧了；对照 `site/src/data/course-structure.ts:177` 的 clone 判据只断言 `✅ 重放一致性断言通过`（不含 hash），故站点层未受影响。
- 建议方向：重跑后回填 A 组 hash，或在讲义中显式标注"hash 为某日期快照值，仅 B 组与当前树一致"。
- 置信度：高（单一命令复现，B 组同一命令命中，排除环境差异）。

### TECHSTATE-F5｜`mcp.md:132` 的 NSA 批评与 CVE 内联引用指向不含该内容的页面（low）
- 严重度：low
- 对象：`notes/mcp.md:132`
  - 引文：`**安全批评（NSA）**："扩散速度超出安全模型"——代表案例 **CVE-2025-6514（mcp-remote 的 OS 命令注入致 RCE，CVSS 3.1 = 9.6，NVD）**；… https://modelcontextprotocol.io/specification/versioning`
- 现象：该行末尾挂的 URL 是 MCP versioning 页，而该页内容只有版本/功能状态/协商三节，全文不含 NSA 或 CVE-2025-6514（我已抓取）。CVE 与 NSA 引语因此在该处**无来源可查**；文末来源表（`mcp.md:563`）给出的 `nvd.nist.gov/vuln/detail/CVE-2025-6514` 才是正确出处，两处口径不一致。
- 证据：
  - 命令：`web_fetch https://modelcontextprotocol.io/specification/versioning` → 返回内容为 Revisions / Feature States / Negotiation 三节（含"The current protocol version is **2026-07-28**"），无 NSA、无 CVE 字样。
  - 命令：`domain_search nvd "CVE-2025-6514 mcp-remote"` → 「mcp-remote is exposed to OS command injection when connecting to untrusted MCP servers … CVSS 9.6」（nvd.nist.gov/vuln/detail/CVE-2025-6514，2025-07-09）——CVE 与 CVSS 9.6 本身**属实**。
  - 未验证：NSA"扩散速度超出安全模型"的中文引语无一手英文原文可比对（不在本分区预算内）。
- 影响：读者按内联链接核查会查无此内容，属于引用卫生问题；可能让读者对同一行里**正确**的 CVE 事实也生疑。
- 建议方向：把该行的 URL 拆成两个（NSA 原文出处 + NVD），或在无一手源时给 NSA 引语加"转述，未取信"标记。
- 置信度：高（对引用页做了全文抓取；CVE 已由 NVD 独立确认）。

### TECHSTATE-F6｜`long-term-memory.md:399` 的 RRF 融合数值第 5 位小数算错（low）
- 严重度：low
- 对象：`notes/long-term-memory.md:399`
  - 引文：`**RRF 融合**：`mem#248` = `1/(60+1) + 1/(60+3) = 0.01639 + 0.01587 = 0.03226`，融合 **#1**。`
- 现象：`1/61 + 1/63 = 0.0163934 + 0.0158730 = 0.0322664`，保留 5 位应为 `0.03227`，讲义写 `0.03226`（写成 0.03226 的值恰好等于 `2/62`，即"两路都排第 2"的情形）。机制与 `RRF_K = 60` 的结论不受影响。
- 证据：
  - 命令：`node -e "console.log(1/61+1/63, (1/61+1/63).toFixed(5), 2/62)"` → `0.032266458495966696 0.03227 0.03225806451612903`（>0.032265，5 位进位为 0.03227；`2/62=0.032258` 即讲义所写的 0.03226 对应的"两路都第 2"情形）。
  - 命令：`grep -n "RRF_K\|EMB_DIM\|k1=1.2" memory-redteam/src/retrieval.mjs` → `18: export const RRF_K = 60;`、`20: export const EMB_DIM = 64;`、`22: BM25 词法路打分（k1=1.2, b=0.75）`——与讲义 `long-term-memory.md:152-153` 的"k1=1.2、64 维字符三元组 hash、RRF k=60"声明一致。
  - 声明边界：S10 是"走查示例"，讲义已在 `long-term-memory.md:432/438` 显式声明示例数值"仍未被断言"；R11 的实测 pool 与 S10 不同（`top-1=mem#174`，`0.03278`），故本条只主张算式与取位，不主张 S10 与 R11 矛盾。
- 影响：几乎无行动影响，属数字精度瑕疵；但因讲义把同一算式当作"融合 #1"的支撑，保留 1 位误差会让细心的读者以为两路名次算错。
- 建议方向：改为 `0.03227`，或标为"约 0.0323（5 位截断）"。
- 置信度：高（纯算术，可一行命令复核）。

---

## 正面确认（主动查证、未发现问题）

1. **「权限门 ≠ 沙箱」这条核心区分与 demo 行为一致（全分区最重要的一条）**：实跑 `cd sandbox-demo && npm run demo` 得 A 组「⚠️ finfo-worker 被替换! 构建自 work/ainews-old（预期 work/ainews-new），step 3 启动」、B 组「✅ finfo-worker 正常：构建自 work/ainews-new, step 0 启动」——`sandbox.md:193-195` 对旧表述的自我修正（step 2/step 3 **都进 sandbox 通道且执行成功 status=ok**，不是被 blocked；真正 blocked 的是边界违规）与代码/输出**完全吻合**。`sandbox.ts:72-81` 的 `makeSandboxWorld` 只复制 workspace 下文件且 `containers` 为空，`tools.ts:25-28` 的 `targetWorld/pth` 确认有沙箱时只见隔离视图。
2. **四通道优先级与安全默认口径与代码一致**：`decide` 按 `CHANNEL_PRIORITY = ["deny","approve","sandbox","allow"]` 逐通道扫描、无规则落 `fallback = deny`（`sandbox-demo/src/types.ts:13`、`policy.ts:20-29`），与 `sandbox.md:114` / `site/src/data/course-structure.ts:175` 的 `deny>approve>sandbox>allow` 逐字一致；实跑 f2（`.env` 同时命中 allow 规则→判 denied）与 f9（无规则工具→denied）印证"deny 优先"与 fallback。
3. **audit 留痕口径与实现一致、且讲义已主动标注截断差异**：`replay.ts:100-103` 对每个 ns 输出状态日志，`mcp-demo` 实跑输出 `L4 审计=恒开`（`defense.ts` 的 `DefenseConfig` 只有 L1/L2/L3 开关），与 `mcp.md:377`「只有 L1/L2/L3 可开关，审计恒开」一致；`sandbox.md:341` 主动指出 harness-demo 是"intent 全量、exec/结果截断"（`result.slice(0,2000)`），属诚实标注而非过度断言。
4. **持久执行判定表与验收锚点全部可复跑（含"断言有牙"的独立验证）**：实跑 `npm run demo` → A `1 skip|2 skip|3 skip|4 replay`、B `…4 unknown→confirm→exec`、C `…4 unknown→confirm→skip`，副作用计数 `0+1`/`0+1`/`1+0` 恒=1，报告 sha256 `675c17a5cc32`/`7bd8f27afdb6`/`ee239f775d7a` 与 `durable-execution.md:304-316` 逐字相同；`src 821 行` 与 `durable-execution.md:275-288` 的 9 文件行数表**逐个相同**；连跑两次输出 md5 相同（9766 字节）印证 `:319`「整段输出逐字节一致」；**独立证伪**：把副本 `/tmp/durblind` 的 `recover.ts` confirm 改成盲重放（`if (q.delivered)` → `if (false)`）后实跑 `--crash=C --runs=1` → `副作用: 崩溃前 1 + resume 1 = 2 ❌`、`❌ 存在未通过的验收项`、`EXIT=1`，与 `durable-execution.md:321` 的声称完全一致（断言确有牙齿，非恒真）。
5. **记忆子系统三态判据可复现**：`node test.mjs` → `16/16 条探针守住（退出码 0）`；`node test.mjs --ablate` → `15/15 条探针对其防线敏感（逐层验证 18/18 层）（退出码 0）`；`node test.mjs --persist` → 三方 digest 均 `ede54bd2a23cf7b3`、`①/②/③/④` 全 true——与 `long-term-memory.md:279/436-438` 的声明逐字吻合；R11 输出 `top-1=mem#174（期望 mem#174）` 印证 `retrieval.mjs` 的 BM25 高 IDF 机制，`--ablate` 中 R8/R9/R10/E1-E5 关层后如预期失败印证"可开关防线"。
6. **`mcp-demo` 离线 mock 的自我定位诚实、未冒称规范验证**：实跑 digest `fnv1a:9c3d75b1`（对照）/`220aa43d`（防御）/`90f36149`（仅 L1，❌ 仍泄）/`53c44306`（仅 L2 ✅）/`e5ff2e54`（仅 L3 ✅）与 `mcp.md:371` 逐字一致，`src 6 文件 499 行` 与 `:372` 一致；`mcp.md:376` 明写「demo 不演示 MCP 线上协议 … **不能拿它讲 S2 的传输层**」，`:342` 明写 tool poisoning/rug pull **未实现**，`:377` 明写四层只有三层可消融——"演示"与"生产/规范验证"的边界标注清楚。`sandbox.md:185/257/279` 同类标注（Node ≥18、`assertInWorkspace` 是纯字符串教学简化、真实系统需内核侧 realpath/openat）亦诚实。
7. **MCP 传输与 registry 口径经一手源确认**：`web_fetch https://modelcontextprotocol.io/registry/about` → 「The MCP Registry is currently in preview. Breaking changes or data resets may occur before general availability.」+「backed by … Anthropic, GitHub, PulseMCP, and Microsoft」+「namespace authentication … delegates security scanning to underlying package registries / downstream aggregators」——与 `mcp.md:131`「仍在 preview（未 GA）」「Anthropic/GitHub/Microsoft/PulseMCP 背书」「DNS 命名空间 + server.json + REST 发现」「registry 审核≠安全保证」四点一致；`mcp.md:109`「HTTP+SSE 自 2025-03-26 起被 Streamable HTTP 取代、已列 Deprecated」被 2026-07-28 changelog 原文「deprecated since protocol version `2025-03-26`」确认。

## 转交他人

- `notes/mcp.md:129` 的 A2A「TSC 共 8 席：Google、Microsoft、Cisco、AWS、Salesforce、ServiceNow、SAP、IBM」与 `notes/multi-agent.md:141` 的「AAIF 技术委员会现列 8 家（Anthropic、Microsoft、Block、OpenAI、Google、Cloudflare、Bloomberg、AWS）」是**两套不同名单**，需一手源（a2aproject GOVERNANCE.md / aaif.io）逐席核对 → 建议交 **fact-timeline**。
- `notes/mcp.md:130` 的「2024.11 发布 → 2025.3 OpenAI/Google 采纳 → 2025.12 捐给 AAIF → 2026.7 最新 spec 修订」成熟度曲线与 `mcp.md:132` 的 NSA 引语，需官宣/一手新闻源 → 建议交 **fact-timeline**。
- `notes/mcp.md:200-215`（OWASP LLM Top 10 **2026 版**条目号与 2025 版对照）与 `:221-238`（Agentic Top 10 ASI01-ASI10）未由我独立取证，但被本站点当作"当前版"对外 → 建议交 **fact-timeline**。
- `notes/multi-agent.md:152`「2026 确认：**唯一**能工作的模式是"多智能体出智力、写操作保持单线程"」：措辞是绝对化断言，出处是 Cognition 单篇随笔（`:151`），"唯一"是否属于该文原话需核 → 建议交 **pedagogy**（表述边界）与 **fact-timeline**（出处）。
- `notes/multi-agent.md:268` 自陈「仓库里可运行的**双 agent demo 仍在 Roadmap「规划中」**」——请核对该 Roadmap 在站点上是否仍标注为"规划中"，以及教学完成判据是否与之对齐 → 建议交 **pedagogy**（完成判据）与 **presentation**（线上可见形态）。
- `notes/sandbox.md:33/532` 主动声明「Claude Code 供应链事故（2025-07）」「agent 无沙箱事故」「rig-skill」三条锚点"查无公开一手源，勿对外引用"，但 `:33` 同段仍保留"2025-07 npm 供应链投毒/2025-08 Nx 投毒"作替代例证 → 建议交 **fact-timeline** 核这两起事件的官方通告 URL。
- `sandbox-demo/README.md`、`mcp-demo/README.md`、`durable-execution-demo/README.md`、`memory-redteam/README.md`（本分区未全读，仅按需 grep）中的判据数字是否与笔记副本一致 → 建议交 **editorial**（口径副本一致性）。

---

### 交付自检
- `git status --porcelain`（2026-10-18 23:49，写入本报告后复核）：除本报告 `reviews/2026-10-18/02-tech-state.md` 与 Lead 接手时既有的 ` M`/`??` 外，**未新增任何改动**；demo 运行产物仅落在 gitignore 的 `durable-execution-demo/.state/`（`git check-ignore -v` 确认命中 `.gitignore:22`）。
- 未执行：`astro build` / `npm run build` / 任何依赖安装 / 任何服务器启动；未修改被评审文件；`/tmp/durblind` 为 `/tmp` 下的临时副本（未改仓库内任何文件）。
