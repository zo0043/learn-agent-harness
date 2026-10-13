# R5 独立评审：t5（CI 端结构 + 视觉回归作业，W4）

- 评审人：memory-dev（非 t5 实现者）
- 日期：2026-10-13（系统时钟）
- 被评审任务：t5（`.github/workflows/verify.yml` + `site/tools/visual-check.mjs` + 3 处 captain 授权的预存站点缺陷修复）
- 评审任务：t12（attempt 1，attempt_id `3b215252-f638-4fbc-9b8a-1fe5d9e8168c`）
- **结论：PASS（无阻断发现）**。t5 存储契约里的 **10 项 acceptance** 逐条成立，全部以**独立复跑/独立下载/独立证伪**为证据；实现者自述与实测无一处不符。4 条非阻断发现见 §5。

> 方法：不复用 t5 的任何自述数字；站点级证据一律从 GitHub API 现取（`gh workflow list` / `gh run list` / `gh run view` / artifact 下载解析），断言器行为另用**我自己写的 fixture**（非 t5 的 `site/tools/fixtures/`）独立证伪。
> 已知限制（如实标注）：本机 2 核 / MemTotal 3400MB，`astro build` 不可本地完成，故**站点级阳性与负路径只能以 CI 实跑为据**；本机能独立复跑的是断言器本身（selftest + 自建 fixture）。

---

## 1. 独立核实：CI 作业真实存在且真实跑过

| 证据 | 命令 | 实测输出 |
|---|---|---|
| 作业存在且 active | `gh workflow list` | `Deploy site to GitHub Pages active 381091374` / **`Verify site (structure + 3-viewport) active 382353631`**（两作业并存、独立） |
| 绿 run | `gh run list --limit 8 --json …` | `38282562346` conclusion=**success** event=pull_request headBranch=t5-visual-verify createdAt=2026-10-12T17:11:27Z |
| 注入 run | 同上 | `38282852860` conclusion=**failure** event=**workflow_dispatch** headBranch=t5-visual-verify createdAt=2026-10-12T17:14:06Z |
| 两者同一提交 | `gh run view <id> --json headSha` | 均为 `887988724479b7823bb24e691cb3b168090d38c1`（注入实验确在**绿基线**同一 SHA 上做） |
| 链接 | `gh run view --json url` | 绿：https://github.com/zo0043/learn-agent-harness/actions/runs/38282562346 · 注入：https://github.com/zo0043/learn-agent-harness/actions/runs/38282852860 |

绿 run 日志（`gh run view 38282562346 --log`，693 行）关键行：
- `dist HTML 文件数 = 31（下限 31 = 6 静态 + 17 课程页 + 8 专题页；构建产物不含 404.html）`
- 7 个关键页逐一 `关键页存在且非空：index.html / learn/ / works/ / interview/ / map/ / details/ / c/rag/`
- 21 行 `✅ <page> @<vp> sw=<n>/cw=<n> 元素 4/4（course-rag 5/5）console 0` + `✅ 全部通过：21 页×视口`

## 2. artifact 真实可下载（我自己下的，不是转述）

```
gh api repos/zo0043/learn-agent-harness/actions/runs/38282562346/artifacts
  → visual-verify-38282562346  size_in_bytes=30146321  expired=false
gh run download 38282562346 -D /tmp/rev-t5/art
  → 21 个 fullPage PNG + report.json（30 MB，实测）
```
`report.json` 逐字段解析（21 行，全部 httpStatus=200）：

| page | vp | ovPass | sw/cw | elems | consoleErrors | search.ok |
|---|---|---|---|---|---|---|
| home/learn/works/interview/map/details | 375/768/1280 | true | 375/375 · 768/768 · 1280/1280 | 4/4 | 0 | true（dialogOpen=true, inputVisible=true, inputWidth=243） |
| course-rag | 375/768/1280 | true | 同上 | 5/5 | 0 | true |

`summary = {total: 21, passed: 21, failed: 0}`；`scopeNote` 含边界声明；`search.applicable===false` 的页数 = **0**（即 21/21 页都有真实搜索入口断言，非空转）。

## 3. 负路径可证伪（不是文档里声称）

**CI 侧**：注入 run 的失败日志（`gh run view 38282852860 --log-failed`，668 行）实测
- `fault=overflow`（入参确实生效）
- **21 处** `注入 overflow 已检出（scrollWidth 5000 vs clientWidth 375）`
- 注入 artifact（`gh run download 38282852860`）里 `report.json`：`fault=overflow`、`summary={total:21,passed:0,failed:21}`、每条 `injection.overflowDetected=true`、`failures=["注入故障已检出（预期失败）：scrollWidth 5000 > clientWidth 375 + 4px"]`

**本机侧（我独立复跑，未用实现者自述）**：
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers node site/tools/visual-check.mjs --selftest` → exit 0，`✅ selftest 全部命中：17/17`
- **我自建 fixture 走真实 code path（`runMain`，非 selftest）**：
  - 好页 → `exit 0`，`✅ 全部通过：21 页×视口`（无假阳性）
  - 同一页加一个 3000px 元素 → `exit 1`，42 行 `横向溢出：scrollWidth 3000 > clientWidth 375/768/1280 + 4px`，21/21 页检出（断言器在我自己的输入上同样有牙）

**代码级非恒真保证**（读源码核实，`site/tools/visual-check.mjs`）：
- `:264-269` 负路径先跑基线，基线不通过即打印「负路径中止…注入实验无意义」并 `exit 1`（不会把本就坏的页算成注入效果）
- `:298-302` 注入**未被检出**同样 `exit 1`（"恒真的作业在这里跑不绿"）
- `:137` 断言 `scrollWidth <= clientWidth + 4px`（容差 4px 吸收子像素，判据未放宽）；`:172-179` 元素断言要求 `count>=min && visible`（非仅存在）
- 自检能力已被实跑证明：`38279358529` 失败原因是我复核过的**其自身下限算术错误**（日志：`dist HTML 文件数 = 31（下限 32 …+ 404）`）——若 sanity 恒真，首跑不会红

## 4. 边界诚实性 / 越界 / 冻结口径

**边界**：`verify.yml:4-12`、`visual-check.mjs:9-17`、`:249`、`:319`、`:431` 五处固定声明「只断言结构与几何，**不**覆盖视觉审美，像素级仍留人工目检」；绿 run 日志实收两行（`[visual-check] 边界：…` / `再次声明：这不等于视觉正确…`）。**未发现任何把「无横向溢出」说成「视觉正确」的表述**。「本机 OOM → 留 CI」在 workflow 头注与 checker 头注显式标注；本机复核 `nproc`/内存与「本机不保证能装浏览器」的表述一致。

**越界**：`git diff --stat origin/main...HEAD` = **10 文件**，全部落在 t5 的 inScope（`.github/workflows/`、`site/tools/`、`site/src/components/SiteSearch.astro`、`site/src/styles/global.css`、`site/package*.json`、`.gitignore`）。逐目录核验**全空**：`site/src/pages` / `notes` / `README.md` / `harness-demo` / `framework-demo` / `memory-redteam` / `rag-demo` / **`.github/workflows/deploy.yml`**。deploy.yml 最后一次改动是 `845628c`（Wave A+B，早于本线），t5 的 6 个 commit（`f70afc8 a931c4d 95accb7 b6a36d9 d63f46f 8879887`）无一触及。

**站点语义**：`SiteSearch.astro` diff = 纯类型标注删除（`const BASE: string`→`const BASE`、`querySelector<T>`→`querySelector`、`(m: any)`→`(m)`、`as HTMLElement|null` 删除），逻辑/文案零变化；`global.css` = 纯新增（`.chip-tool, .dc-top .chip { white-space:normal; overflow-wrap:anywhere }` + `.file-table { display:block; overflow-x:auto; max-width:100% }`），后者与**既有** `.markdown table`（`global.css:512-515`）逐属性一致——"同一既有模式"之说经源码核实成立；未改 `.chip` 全局规则、未改页面标记/文案。

**冻结口径**：`site/src/data/courses.ts:273 WORK_COUNT = 6` 未变；`notes/knowledge-map.md` 计数口径块（15 域 / 17 课程页 / 18 课程卡 / 6 demo / 205+37 题）未被本线触碰；`notes/rag.md §13`（132 chunks / 0.31·0.44·0.50）零 diff（语料三成员不在本线改动清单内）。

**分支与 PR 纪律**：`gh pr list --state all` → PR **#1 OPEN / mergedAt=null**（t5-visual-verify）；`git branch --contains 8879887` 仅 `t5-visual-verify`；`git ls-tree origin/main .github/workflows/` 只有 `deploy.yml`，`origin/main:site/tools/visual-check.mjs` 不存在 → **未自行合并、未直接推 main**。

## 5. 非阻断发现（不改变 PASS 结论）

| id | severity | 问题 | 建议修复 | 归属 |
|---|---|---|---|---|
| F1 | low | W4 作业在知识库**零记录**：`README.md` / `notes/*.md` / `handoff.md` 全库 grep 无 `verify.yml`/「三视口」/「结构+几何」/「几何回归」命中；该交付只能从 workflow 文件自身与 `audit/` 文档发现（`audit/gaps-analysis.md`、`audit/verify-t7.md`）。短板 E 的"补全"从笔记侧读不出来 | captain 整合期在 `knowledge-map.md` 未结事项或 README 配套资产表补一行（含绿/注入 run 链接 + 「不覆盖审美」边界） | 整合项（t5 的 inScope 明确排除 `notes/`、`README.md`，其未记录不构成契约违规） |
| F2 | low | 注入 run 的 artifact 仅 `report.json`（**1173 B**，无截图）——fault 分支按设计 `screenshot:false`（`:264` 基线 + 注入路径不传 screenshot）。正路径 artifact 有 21 张 PNG（已实测下载），故 acceptance #3 成立；但**失败现场不可视** | 可选：fault 模式对首个检出页留 1 张截图（失败现场即证据） | t5（可选增强，非契约要求） |
| F3 | low | 搜索断言在触发按钮缺失时**静默**置 `applicable:false`（`:219-221`）而不失败——当前 21/21 真实页都有入口（实测 applicable=false 计数为 0），但若未来回归删掉站内搜索入口，作业仍会绿 | 对站内真实页（非 fixture）要求 `[data-search-open]` 必须存在，缺失即失败 | t5（可证伪性小缺口） |
| F4 | info | `notes/knowledge-map.md:17`「站点 html **32** = …+ 404.html」与实际构建产物不符：CI 实测 `dist` HTML = **31** 且无 `404.html`（`site/src/pages/404.astro` 不存在；线上 `https://blog.zero43.top/learn-agent-harness/404.html` → **HTTP 404**）。`verify.yml:65` 已就地说明"构建产物以 CI 为准"，但 notes 那句仍活着 | captain 收口该句（改 31，或注明"404 为概念路由、不入构建产物"） | 整合项（notes 属 t5 out-of-scope） |

## 6. 逐条 acceptance 核对（t5 存储契约 10 项；任务书说的「6 项」为其核心 6 条，此处按实际契约全覆盖）

1. **verify.yml 与 deploy.yml 解耦、push/PR 上运行** — ✅ `on: push[main] + pull_request + workflow_dispatch`；独立 `concurrency: verify-visual-${ref}`、无 `needs`；`gh workflow list` 实测并存 active；deploy.yml 零 diff。
2. **结构回归 HTML sanity** — ✅ 绿 run 实测 `dist HTML 文件数 = 31 ≥ 31` + 7 关键页非空；**该步非恒真**：`38279358529` 因自身下限 32 而红（日志留证），修正后 31 与实构建物一致。
3. **三视口 × 7 页几何断言 + 截图/日志 artifact** — ✅ 21/21 行实测（我自己下载解析 `report.json` 与 21 张 PNG）；artifact API size 30,146,321 B、expired=false。
4. **负路径可证伪（不得恒真）** — ✅ 双通道：selftest 17/17（我复跑）+ 绿基线上 `workflow_dispatch fault=overflow` 的 `38282852860` failure（21/21 检出）+ 我自建 fixture 的 exit 0/exit 1 双跑 + 代码级"未检出也 exit 1"。
5. **边界诚实（不得称"视觉正确"；本机不可跑处标注留 CI）** — ✅ 五处声明 + 绿 run 实收；无 overclaim。
6. **captain 授权的 3 处预存缺陷修复（最小改动/零语义零文案）** — ✅ 授权见契约 acceptance #6 原文；diff 核验 SiteSearch 纯类型删除、global.css 纯新增且与既有 `.markdown table` 模式一致；修复的必要性有**修复前 CI 日志**独立佐证（`38281527590`：42× `pageerror: Missing initializer in const declaration`；溢出 1816/1818/1918 + 651 + 1024/1300）。
7. **搜索功能实证（强于"无 console error"）** — ✅ `report.json` 21/21 `search.ok=true`（`dialogOpen=true`、`inputVisible=true`、`inputWidth=243`），非"报错消失"式声明。
8. **修复后阳性 run 全绿且未放宽断言** — ✅ `38282562346` success，21/21 无 console error、无溢出；断言阈值/视口清单未被放宽（容差仍 4px，三视口 375/768/1280 未减）。
9. **冻结口径不变、不改站点页面语义与文案** — ✅ 见 §4（`WORK_COUNT=6`、口径块、rag §13 均未动；`site/src/pages/` 零 diff）。
10. **分支与 PR 纪律** — ✅ PR #1 OPEN 未合并；6 commit 仅在 `t5-visual-verify`；main 上无 `visual-check.mjs`、workflow 仅 `deploy.yml`。

## 7. 复跑指引（评审证据可重现）

```bash
# 作业与 run（需 gh 已登录 zo0043）
gh workflow list
gh run list --limit 8 --json databaseId,name,conclusion,event,headBranch
gh run view 38282562346 --log   | grep -E "dist HTML 文件数|✅ .*sw=|全部通过"
gh run view 38282852860 --log-failed | grep -c "注入 overflow 已检出"     # → 21
# artifact（注意：本机 ~/.cache 不可写，需 XDG_CACHE_HOME 重定向）
XDG_CACHE_HOME=/tmp/ghcache gh run download 38282562346 -D /tmp/rev-art   # 21 PNG + report.json
# 断言器本机独立复跑（不依赖站点构建）
cd site && PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers node tools/visual-check.mjs --selftest   # → 17/17
# 越界/冻结口径
git diff --stat origin/main...HEAD
git diff --name-only origin/main...HEAD -- site/src/pages notes README.md .github/workflows/deploy.yml   # → 空
```
