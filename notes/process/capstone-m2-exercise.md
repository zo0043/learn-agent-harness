# M2 · sandbox-mcp-eval 里程碑动手练习设计（capstone-m2-exercise）

> 主线 `my-agent` 的第三个动手点：在 M1（多工具/会话/压缩/权限门）上**真·增建**四通道权限门 + 沙箱第三通道 + MCP 远程工具（供应链四层防御）+ 评测套件。本设计严格套用 `notes/process/capstone-blueprint.md`（§3 M2 行 / §4）+ `notes/process/capstone-style-guide.md` + M0/M1 两份 exercise 的模式；不重新设计 milestone 划分（captain 已定 M2=P1 沙箱+MCP+评测）。
> 对应必修课 = `sandbox`（四通道 policy）+ `mcp`（MCP 原语 / 供应链四层防御）+ `evaluation`（judge / golden set / CI 门禁）+ `multi-agent`（写单线程约束的意识）；参考答案 demo = `sandbox-demo` / `mcp-demo` / `rag-demo demo:eval`。

## 1. M2 要交付什么（一句话 + 验收形态）

**学员此刻手里应有一个 `my-agent`，在 M1 多工具代理之上增建成「四通道权限门（deny>approve>sandbox>allow）+ 沙箱第三通道执行 + MCP 远程工具（走 RPC 形状 + 供应链四层防御）+ golden set 评测门禁」的可评测代理。**

具体：一个工具调用先落四通道判定——只读白名单走 `allow`、副作用工具走 `sandbox`（沙箱世界执行、越界即 `BoundaryViolation`）、高危外发走 `approve`（预置审批表）、其余走 `deny`；一个「远程工具」的返回内容先过供应链四层防御（L1 输入消毒 → L2 policy 门 → L3 egress 断言 → L4 审计）再进上下文；最后用 golden set（文本锚点）+ 确定性 judge 校准 + recall@k 判据门禁证明「这个代理真的答对了」。全程确定性、零 key、零外网（沿 M0/M1 红线）。

## 2. 半成品与 TODO 切分（给全 vs 挖空）

按 style-guide §2「本 milestone 新增能力 → 挖 TODO；上一 milestone 成果 / 底座 → 给全」。M2 新增 4 项能力，挖 4 个 TODO；M1 已交付的多工具/会话/压缩/权限门底座照搬 `m1/solution`（逐字节继承，见 §7）。

| 文件 | 处理 | 理由 |
|---|---|---|
| `types.ts` | 给全（M1 类型 + 新增 `Channel`/`Rule`/`Verdict`/`SandboxConfig`/`BoundaryViolation`/`GoldenQ`/`DefenseConfig`/`AuditEvent`/`GateVerdict`） | 跨 milestone 公共类型底座 |
| `model.ts` | 给全（确定性 mock，扩展能发起「MCP 远程工具」调用的投毒脚本） | 确定性底座 |
| `tools.ts` | 给全继承 M1（read_file + search 不变；MCP 远程工具入口归 `mcp.ts`） | M1 已建，地基不挖 |
| `loop.ts` | 给全继承 M1（`executeAndBackfill` 接四通道 verdict + sandbox 通道执行接线） | M1 已建 + 必要接线 |
| `session.ts` / `compress.ts` | 给全继承 M1 | M1 已建，不挖 |
| `policy.ts` | **半成品**（升级）：挖 `m2.1`（四通道 `decide(tool,args)` 判定） | M2 新增：四通道 policy |
| `sandbox.ts` | **半成品**（新建）：挖 `m2.2`（沙箱三边界 + 沙箱世界） | M2 新增：沙箱第三通道 |
| `mcp.ts` | **半成品**（新建）：挖 `m2.3`（远程工具 RPC 形状 + 供应链四层防御） | M2 新增：MCP + 防御 |
| `eval.ts` + `golden/` | **半成品**（新建，`golden/` 给全）：挖 `m2.4`（评测主流程 + judge 校准 + CI 门禁） | M2 新增：评测套件 |

**核心闭环挖在四处**（对应任务「四通道 policy 判定 / sandbox 通道执行 / MCP JSON-RPC 客户端+防御 / 评测 judge+golden set」）：
- 四通道 policy 判定 → `m2.1`；
- 沙箱通道执行 → `m2.2`；
- MCP 远程工具 + 供应链防御 → `m2.3`；
- 评测套件（golden set + judge 校准 + CI 门禁）→ `m2.4`。

## 3. 每个 TODO 的补全后预期行为 + 判定方式

| 编号 | 函数（在文件） | 补全后预期行为 | 判定方式 |
|---|---|---|---|
| `m2.1` | `decide(tool, args)`（`policy.ts`） | 按 `CHANNEL_PRIORITY=[deny,approve,sandbox,allow]` 顺序匹配规则（含 `when(args)` 参数级匹配），返回 `{channel,ruleId,reason}`；无匹配落到 `fallback=deny` | 断言 a1：`decide('read_file',{})`=allow、`decide('write_file',{path:'a'})`=sandbox、`decide('run_shell',{cmd:'x'})`=approve、`decide('unknown',{})`=deny |
| `m2.2` | `Sandbox` 三边界（`sandbox.ts`） | 路径边界 `assertInWorkspace` 拒绝对路径/越出 workspace/`..` 越根；env 只读白名单；`openNetwork` 一律抛 `BoundaryViolation`；sandbox 通道执行走隔离世界 | 断言 a2：`assertInWorkspace('work','a/b')` 通过、`assertInWorkspace('work','../x')` 抛 `BoundaryViolation`、`env('SECRET')`=undefined、`openNetwork` 抛 egress 禁用 |
| `m2.3` | `callMCP` + 四层防御（`mcp.ts`/`defense`） | 远程工具走 `rpcCall(method,params)`→mock 响应表；返回内容过 L1 `sanitizeToolOutput`（注入模式 → 围栏标记）、L3 `EgressGate.check`（外发域白名单）、L2 `classifyTool`/`consultApproval`、L4 `AuditLog` 全程记录 | 断言 a3：投毒行 `POISON_LINE` → L1 检出 `hits>0` + 围栏；`EgressGate.check(send_email, {to:'x@evil'})`=未过；`AuditLog.digest()` 规范化摘要稳定 |
| `m2.4` | `runEval` + `judgeCalibrate`（`eval.ts`） | golden set 用文本锚点定位；每题 recall@k 计算 + `recall@10=1` 判 PASS；锚点失效**响亮失败**（exit 1 打印题号+锚点+建议，不静默 0）；judge 校准 = 确定性 mock（golden 标签比对 + 一致性阈值） | 断言 a4：构造含 1 题 golden 的评测，命中 → `recall@10=1` + `PASS`；构造失效锚点 → 锚点未命中并 exit code ≠ 0 |

**每个 TODO 补全 = 学会 M2 一个关键机制**：`m2.1`（权限门是四通道、冲突按 deny>approve>sandbox>allow 优先级、默认 deny）、`m2.2`（沙箱管「影响范围」三道边界，与权限门是两道独立的门）、`m2.3`（远程工具返回是注入通道，defense-in-depth 不依赖任何单层）、`m2.4`（评测数字可归因到现行原文，指针失效要响亮失败不静默错数）。

## 4. 断言自测清单（确定性 / 可机器核对 / 可重放）

断言文件 `assert/m2.assert.ts`，跑 `exercises/m2/starter/`（红）或 `solution/`（绿）；每条断言编号 = TODO 编号，各自打印 `✅` / `❌`，末行 `✅ m2 验收通过`。

| 断言 | 已核对的预期 | 态 |
|---|---|---|
| `a1 m2.1 四通道判定` | read_file=allow / write_file=sandbox / run_shell=approve / unknown=deny | 确定性（纯函数） |
| `a2 m2.2 沙箱边界` | 路径越界抛 `BoundaryViolation`、env 白名单外 undefined、egress 禁用抛错 | 确定性（纯字符串逻辑，不碰真实 FS） |
| `a3 m2.3 MCP 防御` | 投毒行 L1 围栏 + egress 白名单拦截 + AuditLog 摘要稳定 | 确定性（预置投毒 payload + FNV 摘要） |
| `a4 m2.4 评测门禁` | 文本锚点 recall@10=1 + 锚点失效响亮失败 exit≠0 | 确定性（golden 文本锚点，无随机） |
| 末行 | 四断言全绿 → `✅ m2 验收通过`，exit 0 | 可机器核对 |

**三态纪律**（style-guide §3）：确定性（mock 模型/投毒 payload/审批表/golden 锚点全预置，无 `Date.now`/`Math.random`/pid/墙钟）；可机器核对（断言编号 + `✅`/`❌` + 末行验收行）；可重放（`npm run assert:m2` 连跑两次 `diff` 空）。

**半成品三分**：starter 中 `m2.x` 抛 `TODOError('m2.x: …')` → 断言捕获判 `❌ m2.x 未实现`（红）；学员补全 → 绿；solution 跑同断言 → 绿（证断言可达）。

## 5. 参考答案组织（sandbox-demo / mcp-demo / rag-demo 真实 file+function vs 主线 solution）

按 style-guide §4 分工。以下 `file+function` 已逐一 `read` 核实存在：

| M2 机制 | 切片答案（真实存在） | 主线答案 |
|---|---|---|
| 四通道 policy（`m2.1`） | `sandbox-demo/src/types.ts` `Channel`（L6）/ `CHANNEL_PRIORITY`（L13，`["deny","approve","sandbox","allow"]`）/ `Rule`（L16）/ `Verdict`（L25）；`sandbox-demo/src/policy.ts` `Policy`（L9）/ `decide(tool,args)`（L15，按优先级匹配 + `when(args)`）/ `makeApprover`（L38，预置审批表） | `exercises/m2/solution/policy.ts` |
| 沙箱第三通道（`m2.2`） | `sandbox-demo/src/sandbox.ts` `Sandbox`（L78）/ `assertInWorkspace`（L61，路径边界）/ `makeSandboxWorld`（L51，隔离世界）+ `types.ts` `SandboxConfig`（L54，workspace/envWhitelist/network）/ `BoundaryViolation`（L46） | `exercises/m2/solution/sandbox.ts` |
| MCP + 供应链防御（`m2.3`） | `mcp-demo/src/defense.ts` `sanitizeToolOutput`（L28，L1）/ `classifyTool`（L47，L2）/ `consultApproval`（L60，L2 审批）/ `EgressGate`（L67，L3）/ `AuditLog`（L85，L4）；`mcp-demo/src/server.ts` `buildTools`（L33，mock MCP server）/ `POISON_LINE`（L13，投毒 payload）；`mcp-demo/src/agent.ts` `runAgent`（L18，防御层插执行路径）；`mcp-demo/src/types.ts` `ToolSpec`（L6，risk 分级）/ `DefenseConfig`（L61）/ `GateVerdict`（L54） | `exercises/m2/solution/mcp.ts` |
| 评测套件（`m2.4`） | `rag-demo/src/evaluate.ts` `GOLDEN`（L39，文本锚点 golden）/ `GoldenQ`（L31）/ recall@k 计算（L154-157）/ `PASS` 判据（L171，recall@10=1）/ `anchorMiss` 响亮失败（L118，首发命中不足 exit 1） | `exercises/m2/solution/eval.ts` |

> 明确红线/最小态标注：
> - **`m2.3` 的「走 JSON-RPC」**：`mcp-demo` 的远程工具是 mock server 的**函数调用**（`buildTools` → tool.execute），非真实 JSON-RPC wire 帧。主线 M2 的「一个远程工具走 RPC 形状」= 抽象 `rpcCall(method, params)` 形状 + mock 响应表（离线），**需主线自带**；防御四层照搬 `defense.ts` 语义。
> - **`m2.4` 的「judge 校准」**：`rag-demo demo:eval` 只有 golden set + recall@k + 锚点哨兵，**没有 LLM judge**。主线 M2 的 judge 校准 = 确定性 mock judge（golden 标签比对 + 一致性阈值），机制来源 `evaluation` 课，**需主线自带最小态**（不调真实模型）。

## 6. clone 判据（`cd my-agent` 验收命令与预期输出）

```bash
cd my-agent
npm run assert:m2              # 补全后：全绿 + 末行 ✅ m2 验收通过（exit 0）
npm run assert:m2 && npm run assert:m2   # 连跑两次 diff 空 = 可重放
npm run demo:m2                # 跑通「四通道判定 → 沙箱/MCP 执行 → 评测门禁」，打印 PASS 与摘要
```

- 断言命令 `npm run assert:m2` → 期望末行 `✅ m2 验收通过` + exit 0（不给会漂移的 hash/digest；审计摘要 `fnv1a:…` 只在「来源与锚点」说明，clone 判据不绑具体值）。
- `node ≥ 18`、零 key、零外网、无 `node_modules` 跨目录 import。

## 7. 真·增建证据（m1/solution → m2/starter 逐字节继承）

- **`m2/starter` 继承自 `m1/solution`**（上一 milestone 完成态），祖先关系写进 `m2` README 第一行。
- **逐字节一致的部分**：`types.ts` / `model.ts` / `tools.ts` / `loop.ts` / `session.ts` / `compress.ts` 里 M1 已建段与 `exercises/m1/solution/` 同名段逐字节一致——`diff -r` 只见 M2 新增（policy 四通道升级、sandbox/mcp/eval 三新文件、`types.ts` 增补的 channel/sandbox/golden 类型、loop 的四通道接线）。
- **真增建验证命令**（wei 建完跑）：
  ```bash
  diff exercises/m1/solution/tools.ts exercises/m2/starter/tools.ts   # 空（read_file/search 底座不变）
  diff exercises/m1/solution/session.ts exercises/m2/starter/session.ts  # 空（M1 会话不挖）
  diff -r exercises/m1/solution exercises/m2/starter --exclude=policy.ts --exclude=sandbox.ts --exclude=mcp.ts --exclude=eval.ts --exclude=types.ts --exclude=loop.ts
  # ↑ 只见 M2 新增文件与 4 处 TODO；已建段 diff 为空
  ```
  > `git tag m1`（若未打先打）→ `git tag m2` → `git diff m1 m2` 只应出现 M2 新增能力 + 类型增补，M1 段无 diff（沿用 t25 团队纪律：my-agent/ 目前 git-untracked，真增建以文件级 diff 证据交付，tag 需先 commit）。

## 8. 确定性红线与边界

- **红线**：mock 模型不联网、MCP 远程工具走 mock 响应表 + `rpcCall` 形状（不真发 RPC）、投毒 payload 预置、审批表/golden 锚点预置、审计摘要 FNV 规范化（无时间戳）、沙箱用逻辑世界（`Map` 内存，不碰真实 FS/网络）、无 `Date.now`/`Math.random`/pid。
- **M2 明确不做**（留给后续 milestone）：durable journal/checkpoint 幂等（M3）、SSE/重试分类/caching/路由/成本（M3）、OTel（M3）、记忆/飞轮/模型成本（M4）。
- **不破坏**：不改 `sandbox-demo/src` / `mcp-demo/src` / `rag-demo/src` 任何源码、不改 `mvps.ts`、`course-structure.ts`、17 课正文、M0/M1 已建 `exercises/m0|m1` 与 `assert/m0|m1.assert.ts`；只新增 M2 文件 + 顶层 scripts 增量。
- **单线程约束意识（multi-agent 课）**：M2 的沙箱/评测都按「单线程、确定性、可重放」写约束，为后续 multi-agent（需显式交接/串行）留意识，不在本 milestone 引入并发。