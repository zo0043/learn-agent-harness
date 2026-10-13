# t23 R9 评审日志——t22（R3-1 防回归守卫落地）· 第 1 轮

- 评审人：architect2（非实现者；t22 实现者=sdk-dev2）
- 日期：2026-10-13；环境 node v26.8.2 / npm 11.19.1
- 原始输出：`/tmp/t9-review/r3-*`（r3-assert.log / r3-compare-1/2.log / r3-copy-baseline.log / r3-negA.log / r3-negB.log / r3-restore.log / r3-baseline-hashes.txt）
- 独立负路径实验区：/tmp/t23-test（framework-demo 副本，node_modules 软链；实验后已删除，哈希基线存 r3-baseline-hashes.txt）

## §0 结论

**verdict = pass**。t22 的 6 条 acceptance 逐条独立核验成立；负路径由本评审**独立复现**（非采信实现者自述）；守卫双条腿均实证有效；A1–A16 编号语义、tsc、确定性、越界与分支纪律全部通过。无 findings（2 条 info 备注见 §8，不阻断）。

## §1 t22 六条 acceptance 逐条核验（独立证据）

### A1 守卫真实落地，打在旗舰输出该行（或文档一致性）上，逐格归属
- **落点**：`framework-demo/src/compare-assert.ts:154-213`（守卫块）：
  - 行切片 :170-176（`["权限与 human-in-the-loop 钩子"` → `"],`+1，**+1 含末格闭合引号**——t22 自捕获的首版 bug 修正，代码注释在案 :175-176）；
  - 逐分支取格 :165-181（`hitlCell` 取各 `t.key === "…"` 后首个引号串；langgraph=行内最后一个 `: "…"`）；
  - **srcAttr :183-188**：claude 含 canUseTool ∧ openai 含 needsApproval ∧ langgraph 含 interrupt ∧ 含 `Command({ resume })` ∧ **`!cellLanggraph.includes("needsApproval")`**（末项即 R3-1 缺陷的精确反条件）；
  - **docAttr :189-199**：sdk-comparison.md 维度 3「结论」行 `| 结论 |` 三格（d3cells[2]/[3]/[4]）归属一致。
- **「打在旗舰输出该行」的独立证明**（非内部变量）：程序化比对 compare.ts DIMENSIONS 行三格 vs `npm run compare` stdout 该行三格——**3/3 逐字相等**；打印逻辑 `traces.map(fn) + cells.join(" | ")`（compare.ts:90-93 区域）三格均为常量串、不插值 → 源码行=输出行的唯一确定性生成源（t22 声明成立）。
- **三格归属与三份源码一致**：Claude=canUseTool（claude.ts:81 回调）/ OpenAI=needsApproval（openai.ts:76）/ LangGraph=interrupt()+Command({ resume })（langgraph.ts:88/137）——与 t19 已核的 36/36 指针一致，本轮 stdout 行 + 文档维度 3 行双处复核 ✅。

### A2 负路径证明（本评审独立复现，非采信自述）
| 步骤 | 命令（/tmp/t23-test 副本内） | 结果 |
|---|---|---|
| 基线 | `npm run compare:assert`（全编排，生成 trace+JSONL） | exit 0，16/16+守卫✅ |
| 注缺陷（=R3-1 原样：HITL 行退两分支、LangGraph 落 else） | python 精确替换 → `npx tsx src/compare-assert.ts 0 0 1` | **exit 1**；`❌ compare.ts HITL 行…claude=canUseTool / openai=缺needsApproval / langgraph=缺interrupt/Command（混入 needsApproval！归属错误）`；**A1–A16 仍 16 条全 ✅**（无误伤，守卫是唯一致命点） |
| 注缺陷-文档腿（独立加测：源码恢复、仅改坏 sdk-comparison.md 维度 3 LangGraph 格 interrupt→needsApproval） | `npx tsx src/compare-assert.ts 0 0 1` | **exit 1**；`✅ compare.ts HITL 行…` + `❌ sdk-comparison.md 维度 3「结论」行…`——**第 ② 腿独立实证** |
| 恢复 | cp 恢复 → `sha256sum -c`（compare.ts 529f64de… / sdk-comparison.md dadb08d3… 双 OK）→ 复跑 | **exit 0**，16/16+守卫✅ |

### A3 A1–A16 编号与语义未破
- 实跑输出恰 **16 条 `✅ A`**（grep -c 计 16），报「断言 16/16」；守卫在**独立无编号小节**（节标题「防回归（不计入 A1–A16…）」，compare-assert.ts:201）。
- 计数口径交叉核对：compare-assert.ts:8（文件头「＋ R3-1 归属防回归守卫…不计入 A 编号」）/:60/:154/:201、scripts/compare-assert.sh:9（「A1–A16」未改）、README:31/:118（「A1–A16」）、framework-ecosystem.md:101/:396（「16 条断言」）——**全仓无「17」字样、无第二处断言数**；因总数未变，无需 docs 同步（t22 未改 docs/README，正确）。

### A4 tsc 与确定性
- `npx tsc --noEmit` **exit 0**（干净）。
- `npm run compare` 双跑 sha256 均 `230b5c345d3fe5f9d5d997f93fad0141e51d6728e9fe78825388a6f855822c00`、diff 空——且**与 t19 基线（t18 修复后）逐字节同值**：compare.ts 内容未变、守卫未扰动旗舰输出（守卫仅在阶段2c 文件内，不 spawn、不写输出）。

### A5 越界纪律
- t22 mtime 足迹（13:55-14:05 窗口）仅 3 个 framework-demo 文件：`src/compare-assert.ts`(14:00 守卫) / `src/compare.ts`(14:01 注缺陷+恢复，内容经 sha256+stdout 双证字节未变) / `.compare-trace.json`(14:04 运行产物，gitignore)——**净改动仅 compare-assert.ts**（untracked，工作树级，captain 整合期提交）。
- git status 无 t19 基线之外的新增 M/?? 文件；语料三成员（rag.md/agent-harness.md/handoff.md）与冻结计数（6/15/17/18/205+37、rag §13）在 t22 时间窗零触碰；t16/t20 的 site/ 提交属其它线、与本任务无文件交集。

### A6 分支纪律
- 当前分支 `t5-visual-verify` ✓；`main` 仍 = `ca682b6` 未动 ✓；**PR #1 经 `gh pr view` 独立核实 = OPEN** ✓（未合并、未推 main）。

## §2 t22 的 4 条 verify 命令复跑

| # | 命令 | 退出码 | 关键输出 |
|---|---|---|---|
| 1 | `cd framework-demo && npm run compare:assert` | 0 | 16/16 + 守卫两腿 ✅（「断言 16/16 全部通过 + 防回归通过 ✅（退出码 0）」） |
| 2 | `cd framework-demo && npx tsc --noEmit` | 0 | 干净 |
| 3 | `grep -n "interrupt\|needsApproval\|canUseTool" src/compare-assert.ts \| head -8` | 0 | 命中 :91-93（A8/A9）/:156-157/:184-186（守卫） |
| 4 | `cd framework-demo && npm run compare \| grep -A1 "权限与 human-in-the-loop"` | 0 | 三格独立行在位（LangGraph 格=interrupt() 真挂起 → Command({ resume })） |

## §3 守卫鲁棒性评估（独立代码审查）

- **覆盖 R3-1 原始缺陷**：两分支退化 → langgraph 格取到 else 文案（含 needsApproval）→ `!includes("needsApproval")` 必失败 ✓（负路径 A 实证）。
- **覆盖未来变体**：langgraph 格同时保留 interrupt 又混入 needsApproval → 同样被末项反条件抓住（t18 补丁只有正向关键词、抓不到该变体，t22 的逐格归属设计更强）。
- **保守失效**：行标签或 `t.key ===` 字面量被改名 → 取格得空串 → 守卫失败（fail-closed，方向安全）。
- **文档腿边界**：docAttr 只查三格正向关键词（不查 d3cells[4] 无 needsApproval）——R3-1 缺陷表现于源码腿，文档腿为一致性双保险，边界可接受（见 §8-2）。

## §8 Info 备注（不阻断、无需重评）

1. **负路径诊断文案**：两分支缺陷下输出「openai=缺needsApproval」（因 openai 分支标记从源码消失、取格为空）——失败归因实际落在 langgraph「混入 needsApproval！归属错误」，诊断方向正确，文案略冗余，无需改。
2. **文档腿无反条件**：若将来文档 LangGraph 格写成「interrupt() + needsApproval 双写」，docAttr 仍过（源码腿会先抓）。属双保险的定位，非缺陷；若要强化可给 docAttr 加 `!d3cells[4].includes("needsApproval")`（1 行，可留 captain 决定，不影响本轮 pass）。

## §9 复现命令

```bash
# 正路径（真实树）
cd framework-demo && npm run compare:assert            # 16/16 + 防回归 ✅ exit 0
# 负路径（/tmp 副本；需先生成 trace+JSONL：先跑一次完整 compare:assert）
npx tsx src/compare-assert.ts 0 0 1                    # 直调阶段2c（0=probeRc 0=waited 1=jsonlFound）
```
