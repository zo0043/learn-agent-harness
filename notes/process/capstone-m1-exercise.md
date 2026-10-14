# M1 · multi-tool-session 里程碑动手练习设计（capstone-m1-exercise）

> 主线 `my-agent` 的第二个动手点：在 M0 单工具 loop 上**真·增建**多工具 + JSONL 会话 + 压缩 + 默认 deny 权限门。本设计严格套用 `notes/process/capstone-blueprint.md`（§3 M1 行 / §4 练习闭环）+ `notes/process/capstone-style-guide.md`（§1–§6）+ `notes/process/capstone-m0-exercise.md`（M0 模式逐段延续）；不重新设计 milestone 划分（captain 已定 M1=P0 多工具+会话+压缩）。
> 对应必修课 = `harness-from-scratch`（后段：恢复 / 压缩 / 多工具）+ `agent-harness`（分层）+ `rag`（检索=打分排序）+ `system-design`（收口）；参考答案 demo = `harness-demo`（5 运行模式）+ `rag-demo`（打分排序）。

## 1. M1 要交付什么（一句话 + 验收形态)

**学员此刻手里应有一个 `my-agent`，在 M0 单工具 loop 之上增建成「多工具（read_file + 检索=打分排序）+ JSONL 会话可恢复 + 超长上下文自动压缩 + 白名单外工具默认拒」的多轮 agent。**

具体：它能把一句话（如「查知识库里关于 BM25 的内容」）走完「想（发 search）→ 检索打分排序 → 结果回填 → 再想 → deliver 收口」；每次 `intent→exec` 写 JSONL，重启后从日志重建上下文续跑；上下文超窗口下限时按「头部原样 + 中间摘要 + 尾部原样」裁剪；任何白名单（只读两工具）之外的调用一律 deny 并回写拒绝结果（拒绝也是合法结果）。全程确定性 mock 模型、零 key、零外网（沿 M0 红线）。

## 2. 半成品与 TODO 切分（给全 vs 挖空）

按 style-guide §2「本 milestone 新增能力 → 挖 TODO；上一 milestone 成果 / 底座 → 给全」。M1 新增 4 项能力，挖 4 个 TODO；M0 已交付的 loop/单工具/底座照搬 `m0/solution`（逐字节继承，见 §7）。

| 文件 | 处理 | 理由 |
|---|---|---|
| `types.ts` | 给全（M0 类型 + 新增 JSONL 事件类型 `TrajectoryEvent`） | 跨 milestone 公共类型底座 |
| `model.ts` | 给全（确定性 mock，扩展出 `search` 工具调用脚本） | 确定性底座 |
| `loop.ts` | 给全（= `m0/solution/loop.ts` 补全版，`executeAndBackfill` 加「执行前走权限门」接线） | M0 已交付，地基不挖 |
| `tools.ts` | **半成品**：`read_file` 给全 + 检索语料分块底座给全，挖 `m1.1`（search 工具的打分排序执行体） | M1 新增：第二工具 + 命名分发 |
| `compress.ts` | **半成品**（新建），挖 `m1.2`（压缩函数体） | M1 新增：token 压缩 |
| `session.ts` | **半成品**（新建），挖 `m1.3`（JSONL 写入 / 重建） | M1 新增：会话持久化 / 续跑 |
| `policy.ts` | **半成品**（新建），挖 `m1.4`（默认 deny 判定） | M1 新增：权限门（第一道） |

**核心闭环挖在四处**（对应任务「多工具分发路由 / 压缩函数体 / 会话持久化续跑 / 权限门判定」）：
- 「第二工具（检索=打分排序）+ 多工具命名分发」→ `m1.1`；
- 「token 上下文压缩」→ `m1.2`；
- 「JSONL 会话持久化 / 续跑」→ `m1.3`；
- 「默认 deny 权限门」→ `m1.4`。

> 命名分发本身 = `callTool(registry, name, args)` 里的 `registry.get(name)`（M0 的 `callTool` 已具备 name→handler 查表）——M1 的关键不是重造分发，而是让登记表从 1 个工具长到 2 个工具，且第二个工具的 execute 是「打分排序」。

## 3. 每个 TODO 的补全后预期行为 + 判定方式

| 编号 | 函数（在文件） | 补全后预期行为 | 判定方式 |
|---|---|---|---|
| `m1.1` | `search`（`tools.ts`）：打分排序执行体 | 给 query，对预置语料 chunks 逐个打分（词面命中加权），`sort` 降序 → `slice(0, k)` → 返回 topK 摘要；`buildRegistry()` 把 `read_file` + `search` 都登记 | 断言 a1：`callTool(registry,'search',{query})` 命中 BM25 相关 chunk 置顶、只读工具登记数=2 |
| `m1.2` | `compress(messages, threshold)`（`compress.ts`） | 超阈值：`head = [system, 首 user]` + 中间段确定性摘要（每条 truncate 成一行）+ `tail` 原样保留；未超阈值原样返回 `{summarized:0}` | 断言 a2：构造超阈值 messages → 压缩后长度显著减小 + head/tail 内容逐字保留 + `summarized>0` |
| `m1.3` | `Session.append/loadAll` + `rebuild(events)`（`session.ts`） | 每次 `intent→exec` 写一行 JSONL；重启 `loadAll` 读日志 `rebuild` 出 messages；intent 已记而 exec 缺失 → 标「未知状态」不丢 | 断言 a3：append 两条事件 → loadAll 2 条 → rebuild 重建出 system/user + tool 回写；未知 intent 被标出 |
| `m1.4` | `decide(tool)`（`policy.ts`） | 白名单 `[read_file, search]` → `allow`；白名单外（含未知工具）→ `deny`（默认 deny） | 断言 a4：`decide('read_file')=allow`、`decide('search')=allow`、`decide('write_file')=deny`、`decide('run_shell')=deny` |

**每个 TODO 补全 = 学会 M1 一个关键机制**：`m1.1`（检索不是字面匹配而是打分排序）、`m1.2`（压缩改的是「送模型的视图」，日志留全量）、`m1.3`（JSONL 日志是唯一事实源，上下文由日志派生）、`m1.4`（权限门在执行路径上判定、默认 deny，不靠提示词求模型）。

## 4. 断言自测清单（确定性 / 可机器核对 / 可重放）

断言文件 `assert/m1.assert.ts`，跑 `exercises/m1/starter/`（红）或 `solution/`（绿）；每条断言编号 = TODO 编号，各自打印 `✅` / `❌`，末行 `✅ m1 验收通过`。

| 断言 | 已核对的预期 | 态 |
|---|---|---|
| `a1 m1.1 检索打分排序 + 多工具` | `search` query 命中 BM25 chunk 置顶；`buildRegistry().size===2`（read_file+search） | 确定性（预置语料） |
| `a2 m1.2 压缩` | 超阈值 → 长度减小 + head/tail 逐字保留 + `summarized>0`；未超阈值 → 原样 `summarized=0` | 确定性（确定性摘要，无真实 LLM） |
| `a3 m1.3 会话重建` | append 2 事件 → loadAll 2 条 → rebuild 出 system/user + tool；未知 intent 标注 | 确定性（固定事件序列） |
| `a4 m1.4 权限门` | read_file/search=allow；write_file/run_shell=deny（默认 deny） | 确定性（纯函数） |
| 末行 | 四断言全绿 → `✅ m1 验收通过`，exit 0 | 可机器核对 |

**三态纪律**（style-guide §3）：
- 确定性：`model.ts` 预置脚本、检索语料固定、压缩摘要用「每条 truncate 一行」**不调真实模型**、无 `Date.now`/`Math.random`/pid/墙钟（JSONL 事件里的 `startedAt`/`ms` 用逻辑计数器，不用墙钟）；
- 可机器核对：断言编号 + `✅`/`❌` + 末行验收行；
- 可重放：`npm run assert:m1` 连跑两次 `diff` 空。

**半成品三分**：starter 中 `m1.x` 抛 `TODOError('m1.x: …')` → 断言捕获判 `❌ m1.x 未实现`（红）；学员补全 → 绿；solution 跑同断言 → 绿（证断言可达）。

## 5. 参考答案组织（harness-demo / rag-demo 真实 file+function vs 主线 solution）

按 style-guide §4 分工：现有 demo = 切片答案，主线 solution = 增量答案。以下 `file+function` 已逐一 `read` 核实存在：

| M1 机制 | 切片答案（真实存在） | 主线答案 |
|---|---|---|
| 多工具注册 / 命名分发（底） | `harness-demo/src/tools.ts` `buildRegistry`（L50，5 工具）/ `callTool`（L103，`registry.get(name)` 分发）/ `toolSchemas`（L95，registry→API tools）/ `validateArgs`（L20） | `exercises/m1/solution/tools.ts`（2 工具） |
| 检索=打分排序（`m1.1`） | `rag-demo/src/bm25.ts` `BM25`（L28）/ `score(query, chunkIdx)`（L77）/ `topK`（L87-89，score→sort desc→slice k→rank）——M1 取「打分排序」最小子集，不做 BM25 的 IDF/长度归一全套 | `exercises/m1/solution/tools.ts` 的 `search` |
| token 压缩（`m1.2`） | `harness-demo/src/context.ts` `estimateTokens`（L11，字符/3.5）/ `compactIfNeeded`（L20，head+tail+中间摘要）——**但它 L40 调 `chat()` 真实 LLM 摘要**，M1 需确定性摘要主线自带 | `exercises/m1/solution/compress.ts` 的 `compress` |
| JSONL 会话 / 恢复（`m1.3`） | `harness-demo/src/session.ts` `Session`（L10，`append`/`loadAll`/`exists`/`start`/`remove`）/ `rebuild`（L50，事件→messages + unknownIntents）；`types.ts` `TrajectoryEvent`（L42-49） | `exercises/m1/solution/session.ts` |
| 默认 deny 权限门（`m1.4`） | `harness-demo/src/policy.ts` `Policy`（L16）/ `decide`（L22，deny>approve>allow 优先级）/ `DEMO_POLICY`（L31）/ `PolicyDecision`（L6）——M1 取「默认 deny + 白名单 allow」最小态；deny>approve>allow 三通道是 M2 升级（蓝图 §3 M2 四通道） | `exercises/m1/solution/policy.ts` 的 `decide` |

> 明确红线：`compactIfNeeded` 的 `chat()` 摘要、`DEMO_POLICY` 的 approve 通道（human-in-the-loop）**不是** M1 的最小态（前者要真实模型、后者是 M2 四通道），M1 一律主线自带确定性 solution。

## 6. clone 判据（`cd my-agent` 验收命令与预期输出）

```bash
cd my-agent
npm run assert:m1              # 补全后：全绿 + 末行 ✅ m1 验收通过（exit 0）
npm run assert:m1 && npm run assert:m1   # 连跑两次 diff 空 = 可重放
npm run demo:m1                # 跑通「多工具想→检索→说」，打印最终回答（含 BM25 命中内容）
```

- 断言命令 `npm run assert:m1` → 期望末行 `✅ m1 验收通过` + exit 0（不给会漂移的 hash/digest）。
- `node ≥ 18`、零 key、零外网、无 `node_modules` 跨目录 import。

## 7. 真·增建证据（m0/solution → m1/starter 逐字节继承）

- **`m1/starter` 继承自 `m0/solution`**（上一 milestone 完成态），祖先关系写进 `m1` README 第一行。
- **逐字节一致的部分**：`types.ts` / `model.ts` / `loop.ts` 里 M0 已建的解析/回填/切分逻辑、`tools.ts` 里 `read_file` 的既有实现，与 `exercises/m0/solution/` 同名段逐字节一致——`diff -r` 只见 M1 新增（第二工具、compress/session/policy 三文件、loop 里的权限门接线）。
- **真增建验证命令**（wei 建完跑）：
  ```bash
  diff exercises/m0/solution/model.ts exercises/m1/starter/model.ts   # 空（继承确定性底座）
  diff exercises/m0/solution/types.ts exercises/m1/starter/types.ts   # 空（类型底座不变）
  git tag m0 && git tag m1        # 渐进快照；git diff m0 m1 只见 M1 新增机制
  ```
  > 若 `m0` tag 未打（M0 阶段留待），先 `git tag m0` 再 `git tag m1`，`git diff m0 m1` 应为「仅 M1 新增的 4 能力 + JSONL 事件类型」。

## 8. 确定性红线与边界

- **红线**：mock 模型不联网不调真实模型、检索语料预置固定、压缩摘要确定性（truncate 一行，不调 LLM）、JSONL 事件用逻辑计数器不落墙钟、无 `Date.now`/`Math.random`/pid。
- **M1 明确不做**（留给后续 milestone）：沙箱第三通道 / 四通道 policy deny>approve>sandbox>allow（M2）、MCP（M2）、评测套件（M2）、durable journal/checkpoint 幂等（M3）、SSE/重试分类/caching/路由/成本（M3）、OTel（M3）、记忆/飞轮/模型成本（M4）。
- **不破坏**：不改 `harness-demo/src` / `rag-demo/src` 任何源码、不改 `mvps.ts`、`course-structure.ts`、17 课正文、M0 已建 `exercises/m0` 与 `assert/m0.assert.ts`；只新增 M1 文件 + 顶层 scripts 增量。