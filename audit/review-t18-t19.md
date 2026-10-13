# t19 R3 评审日志——t18（R3-1/R3-2/R3-3 修复）· 第 2 轮

- 评审人：architect2（t9 第 1 轮评审人，非实现者；t18 实现者为 sdk-dev2）
- 日期：2026-10-13；环境 node v26.8.2 / npm 11.19.1
- 原始输出：`/tmp/t9-review/r2-*`（r2-compare-1/2.log / r2-assert.log / r2-guard-green.log / r2-guard-red.log / r2-urls.txt）
- 复跑脚本：`bash audit/review-t3-t9-rerun.sh`（第 1 轮脚本对本轮工作树同样适用，含指针审计）

## §0 结论

**verdict = pass**。t9 三条发现全部修复并经独立复跑核验：

| t9 发现 | 修复核验 | 判定 |
|---|---|---|
| R3-1（high）compare 五维表 HITL 行 LangGraph 格误植 needsApproval | `compare.ts:53-58` 已补 langgraph 独立分支（`interrupt() 真挂起 → Command({ resume })`）；`npm run compare` 实跑输出三格独立、与 sdk-comparison.md:37/README:73/代码 langgraph.ts:88,137 一致 | ✅ 已解决 |
| R3-2（medium）sdk-comparison.md 6 处 file:line 指针失准 | 全量重审：36 处唯一引用**全部精确命中被引代码**（含 6 处回刷 + mock-model.ts:301/:307 + 头注改为 dated「以符号名为准」） | ✅ 已解决 |
| R3-3（medium）mock-model.ts:3「本环境无任何 LLM key、无可用外网模型端点」 | 已改为「对照线**不依赖任何真实 key/端点**——…」；全目录 grep 禁止表述（无任何 LLM/无可用外网/本环境无）= 0 命中，与 README:12-15 口径一致 | ✅ 已解决 |

无新发现（1 条 info 级备注见 §7，不阻断）。

## §1 关键命令独立复跑（t18 后工作树）

| # | 命令 | 退出码 | 关键输出 |
|---|---|---|---|
| 1 | `cd framework-demo && npm run compare` | 0 | 三家工具 3/3/3、模型 4/4/4、【诚实标注】在位；**HITL 行**：`canUseTool 逐调用回调（进程内门，预执行拦截） \| 无预执行权限门（策略在工具内/guardrail）；…needsApproval=true（run 在审批点停下） \| 无预执行权限门（策略在工具内）；…interrupt() 真挂起 → Command({ resume })` |
| 2 | 两次 `npm run compare` + diff | 0 | diff 空；两次 sha256 `230b5c345d3fe5f9d5d997f93fad0141e51d6728e9fe78825388a6f855822c00` 相同（与第 1 轮 `77b0e8a8…` 不同=HITL 行修复所致，预期内） |
| 3 | `cd framework-demo && npm run compare:assert` | 0 | 断言 16/16 全部通过（A15 ok()=10；A14 三家 baseUrl 127.0.0.1） |
| 4 | `cd framework-demo && npx tsc --noEmit` | 0 | 干净 |
| 5 | 口径/禁止表述 grep | 0 | `11/11` 0 命中；「无任何 LLM / 无可用外网 / 本环境无」0 命中 |

## §2 t3 九条 acceptance 复核（第 2 轮证据）

修复仅触及 `compare.ts` / `mock-model.ts:1-5` / `docs/sdk-comparison.md`（行号与头注），不改变任何行为路径，故第 1 轮（audit/review-t3-t9.md §2）的行为类证据继续有效；本轮对全部 5 条 verify 与 A3（指针/URL/结论一致性）做了全量新证据复跑：

| # | 判定 | 本轮证据 |
|---|---|---|
| A1 三家同任务+本地 mock+离线可复现 | ✅ | 本轮 compare 输出三家各自工具名序列（Read/Bash/Bash；read_doc/delete_temp/publish_note ×2）+ endpoint 行全为 127.0.0.1:8791；compare 路径不读 .env（import 图未变） |
| A2 一条命令对照+断言逐条+退出码可靠 | ✅ | 命令 1-3 全 0；16 条断言覆盖四类（工具/权限/中断/状态形态）；退出码可靠性另见 §4 守卫负路径（exit 1 实测） |
| A3 5 维度+file:line+URL 可达+结论与代码一致 | ✅ | 36 处唯一指针全部精确命中（§3）；12/12 URL HTTP 200（§5）；R3-1 修复后**所有**对照表表述（stdout 表 + sdk-comparison.md + README 速览表）三处互洽且与代码一致 |
| A4 诚实标注+live 默认关闭 | ✅ | compare 输出首行【诚实标注】、README:10-17 未动（t18 未触 README）；live 线仍为独立 `npm run demo` 脚本 |
| A5 U-24 口径 | ✅ | grep 0 活 11/11；A15 运行时 ok()=10 |
| A6 确定性 | ✅ | 命令 2 两次 sha256 相同 |
| A7 不新增第 7 作品 | ✅ | t18 未新增任何文件（3 文件就地修改）；WORK_COUNT=6 未动 |
| A8 README 对照表路径+结论摘要 | ✅ | t18 未触 README（mtime 未变）；docs/sdk-comparison.md 仍为指向目标且内容已同步修复 |
| A9 语料纪律 | ✅ | t18 mtime 证据仅 4 个 framework-demo 文件（§6）；rag.md/agent-harness.md/handoff.md 第 1 轮后零新增改动 |

## §3 R3-2 指针全量重审（36 处唯一引用）

第 1 轮失准的 6 处 + 2 处 off-by-1 全部回刷且逐行复核命中：
- `claude.ts:69` = `for await (const m of query({` ✓（×2 处引用）；`claude.ts:71-103` = options 块（无工具声明）✓；`claude.ts:4-5` = 文件头 loop 归属注释 ✓
- `langgraph.ts:76-79` = agentNode（`bound.invoke` :77）✓；`langgraph.ts:43-72` = 三个 tool（readDoc :43-52 / deleteTemp :53-62 / publishNote :63-72，文档内已写细粒度子指针）✓；`langgraph.ts:74` = `llm.bindTools([...])` ✓
- `claude.ts:192-196` = observability 对象（events :194 / samples :195）✓
- `mock-model.ts:301` = `if (path === "/v1/messages")` ✓；`mock-model.ts:307` = `if (path === "/v1/chat/completions")` ✓
- 其余 28 处与第 1 轮一致（精确命中）；头注改为「行号已于 2026-10-13（t18 按 t9 评审 R3-2 回刷）对照当前代码逐一复核，文件再变动时以符号名为准」——dated 诚实表述，可接受。

## §4 compare-assert.ts 回退核验 + 防回归守卫独立验证

1. **回退干净**：`wc -l` = 162（与第 1 轮评审所见一致）；`grep '防回归|regression|hitlStart|compareSrc'` 0 命中；tsc + 16/16 复绿（命令 3-4）。
2. **守卫补丁独立验证**（/tmp 副本，未碰工作树）：
   - 应用：`patch -p0 < /tmp/t18-regression-guard.patch` 干净应用（162→182 行）。⚠️ **t18 报告写的 `patch -p1` 不可用**（报 "can't find file to patch"，因 `---` 头是 `src/compare-assert.ts`，-p1 会剥成根下不存在的 `compare-assert.ts`）；`-p0` 正确。
   - 绿路径：守卫版 `npm run compare:assert` → `断言 16/16 全部通过 + 防回归通过 ✅（退出码 0）`。
   - 红路径：在守卫副本中把 R3-1 缺陷注回 compare.ts（恢复两分支）→ `A1-A16 全 ✅` + `❌ HITL 行含 canUseTool / needsApproval / interrupt+Command({ resume })` → **退出码 1**。守卫与缺陷一一对应，非恒真。
   - 结论：t18 声称的「已实现并实测」成立；若 captain 决定采用，用 **`patch -p0`** 回贴（补丁在 /tmp/t18-regression-guard.patch，/tmp 可能被清，48 行全文已录于 t18 报告）。

## §5 URL 复核

docs/sdk-comparison.md 的 12 条唯一 URL 本轮全部重查：12/12 HTTP 200（与第 1 轮 URL 集合完全一致，t18 未改 URL）。

## §6 越界检查（t18 delta）

- mtime 证据：2026-10-13 11:00 后仅 4 个 framework-demo 文件被写：`src/mock-model.ts`(13:26) / `docs/sdk-comparison.md`(13:30) / `src/compare.ts`(13:33) / `src/compare-assert.ts`(13:40=守卫加了又回退)——净改动 3 文件，全在 t18 inScope（framework-demo/）内。
- 工作树其余 M/?? 条目均为 t1-t7/t11/t12/t16/t17 既有产物（含其他评审线新增的 audit/review-t11-t4.md 等，非 t18）；冻结口径（WORK_COUNT=6、courses.ts、README 作品表、knowledge-map:15 口径块）与语料三成员自第 1 轮后零新增改动。

## §7 备注（info，不阻断）

- **守卫补丁待 captain 决策**：R3-1 防回归守卫未入树（t18 契约 inScope 不含 compare-assert.ts，提交校验拒收后已干净回退）。采用与否不影响本轮 pass；若采用：`cd framework-demo && patch -p0 < /tmp/t18-regression-guard.patch`（回贴后 compare:assert 全绿文案变为「断言 16/16 全部通过 + 防回归通过」，属预期输出变化），建议同步把 `src/compare-assert.ts` 加入该任务的 inScope 记录或由 captain 直接提交。守卫轻微脆弱点：锁定 HITL 行四个关键词，未来若改写 OpenAI 格文案去掉「needsApproval」字样会误报——可接受（守卫目的就是锁当前表述）。
- **LangGraph 版本口径**：仍为 t7 F2 的「dated 快照 1.4.21 vs registry latest 1.5.0」，属 captain 整合期「截至」措辞裁决，与 t18 无关。

## §8 复跑方法

```bash
bash audit/review-t3-t9-rerun.sh   # V1-V5 + 指针审计（对当前树有效）
# 守卫验证（可选）：
# rm -rf /tmp/t19-guardtest && cp -r framework-demo /tmp/t19-guardtest && rm -rf /tmp/t19-guardtest/{node_modules,.claude-home,out,.compare-trace.json} && ln -s $(pwd)/framework-demo/node_modules /tmp/t19-guardtest/node_modules && cd /tmp/t19-guardtest && patch --batch -p0 < /tmp/t18-regression-guard.patch && npm run compare:assert
```
