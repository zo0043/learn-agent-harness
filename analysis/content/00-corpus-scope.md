# 内容多角度分析｜语料范围与产出规范（captain 下发，全体成员必读）

> 本轮任务：**只分析「内容」**（文字、事实、教学法、证据、口径、覆盖面、可读性）。
> 「显示形式」（版面层级、样式、交互、视觉审美）本轮**不分析**——发现了就登记进报告末尾的
> 「转交下一轮（显示形式）」附录，一句话登记即可，不展开。

## 0. 硬边界（违反即任务失败）

1. **不得修改任何既有文件**。唯一允许的写入是 `analysis/content/` 下的**新**报告文件。
   交付前自查：`git status --porcelain` 只应出现 `?? analysis/`（或本目录内新增文件的 `??`）。
2. **证据自跑**：每条 finding 必须给出 `file:line` + 你**亲自跑过**的命令原文与关键输出。
   不得把其他成员的自述、上一轮 team 的报告结论当作证据引用（可引用为「线索，未取信」）。
3. **未验证就标注**：没跑、跑不通、跑不了的，写「未验证（原因）」。
   禁止用「应该/显然/一般来说」冒充已核实。禁止把时间先后当因果；机制类结论不能复现就写「未定位」。
4. **不得只看标题下结论**。每条 finding 必须落在具体行上。
5. **不跑会改仓库/联网装包/长时间构建的命令**。只读复算；`astro build`（本机约 8 分钟且不可依赖）
   默认不跑，标为未验证；需要跑长命令先说明理由并以前台短命令为限。

## 1. 语料清单（全仓文字内容，实测 2026-10-16）

| 带 | 内容 | 规模 |
|---|---|---|
| **A 课程内容** | `notes/*.md` 顶层 **19** 篇（17 课程正文 + `knowledge-map.md` + `interview-bank.md`）+ `notes/details/*.md` **8** 篇 | ~700 KB |
| **B 过程/设计文档** | `notes/process/*.md` **20** 篇 + 仓库根 4 份：`notes-restructure-plan.md`、`restructure-review-content.md`、`restructure-review-structure.md`、`restructure-verify.md` | ~200 KB |
| **C 仓库叙事** | `README.md`、`handoff.md`、`AGENTS.md`（`~/.dsh/AGENTS.md` 属全局指令，不计入语料） | ~40 KB |
| **D 站点文案** | `site/src/pages/**/*.astro`（9 个页面 + c/[slug] + details/{[slug],index}）、`site/src/components/*.astro`（7 个）、`site/src/data/*.ts`（7 个，含 `courses.ts`/`course-structure.ts`/`mvps.ts`/`llm-history.ts` 的文案与口径字段）、`site/src/layouts/Base.astro` | ~238 KB（含模板代码，只判**用户可见文案**） |
| **E 作品文档** | 各 demo 的 `README.md`（api / durable-execution / final-project / flywheel / framework / harness / mcp / memory-redteam / model-basics / my-agent / rag / sandbox）+ `framework-demo/docs/{sdk-comparison,research-notes}.md` + `final-project/subjects/*.md`(4) + `harness-demo/workspace/docs/*.md`(2) | ~135 KB |

**排除**：`node_modules/`、`site/dist/`、`.git/`、`.agent-teams/`、demo 源码内的普通注释
（例外：被 README/课程/口径块当作**对外声明的判据或数字**的，算内容，须一并核对）。

**计数口径提醒**：体积只在需要时用 `wc -c` / `find -printf '%s'` 实测；**禁用 `du`**（4K 块取整会高估）。
仓库里所有「数字」都可能有 ≥2 处明文副本，核一个数就要 grep 全仓找副本。

## 2. 报告格式（每份报告统一，便于 verifier 与 synthesis 聚合）

文件头：

```
# <角度> 分析报告（<angle>）
- 分析者：<member name>｜时间：YYYY-MM-DD HH:MM
- 语料覆盖声明：
  - 通读（逐行）：<文件清单>
  - 抽样（列出抽了哪几节/哪几行）：<...>
  - 未读（原因）：<...>
- 结论摘要：<≤5 条>
```

每条 finding 一份小表（用 markdown 列表也行，字段必须齐）：

- `id`：`<angle>-F<n>`（如 `pedagogy-F3`）
- `severity`：`blocker | high | medium | low`
- `对象`：`file:line`（多行给区间）+ ≤2 行原文引文
- `现象`：一句话说清错在哪
- `证据`：我跑的命令原文 + 关键输出；阅读类结论写「仅阅读 file:line」
- `影响`：从**本角度**为什么算问题（一句话）
- `建议方向`：怎么改（**只写方向，不实施**；一句话）
- `置信度`：高/中/低 + 理由
- `归属`：`内容` 或 `显示形式`（后者只登记进附录）

末尾固定两节：
1. `## 转交下一轮（显示形式）` —— 只登记，不展开
2. `## 本轮未覆盖 / 未验证` —— 诚实边界

**质量下界**：每份分析报告 ≥8 条 finding（含至少 3 条 high 及以上），且不得为凑数把显示形式/风格偏好凑成 finding；
`low` 也必须有 file:line。**宁少勿虚**：条数不足就在覆盖声明里说明语料实际很干净，并给出你扫过的证据。

## 3. 统一术语

- 「口径」= 仓库里对某个数字的官方定义与算法（如「17 课程路由 = 19 − 2」「6 个具名作品」）。
- 「活表述」= 仍然出现在当前产物/仓库文件里的表述（区别于历史报告里的转述）。
- 「就地划改」= 修正结论时必须改掉所有活着的旧表述，而不是文末追加更正。
- 「未定位」= 复现不了、只能确定现象，不能确定机制。
