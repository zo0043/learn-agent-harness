# demos-gates 修复日志

- 修复组：`demos-gates`｜任务：`task-15`｜时间：2026-10-19 00:20（Asia/Shanghai）
- 依据：`reviews/2026-10-19/FIX-CHARTER.md` §0 硬规则 / §1 冻结口径 / §2 写入分区 / §3 demos-gates 清单 / §5 交付格式
- 可写范围（执行中自查）：`harness-demo/**`、`rag-demo/**`、`sandbox-demo/**`、`durable-execution-demo/**`、`mcp-demo/**`、`memory-redteam/**`、`viz/**`、`site/tools/**`、`.github/workflows/**`、`site/build.sh` + 本日志

## 覆盖声明

- 本日志覆盖条目：A1 / A2 / TECHSTATE-F4 联动 / B1 / C3 / 自检
- 改动的文件：`harness-demo/src/otel-mock-scenario.ts`（A1）；其余边改边追加

## 逐条修改记录

### A1 / TECH-A-F1 — `demo:otel:assert` 干净树 exit 0（最高优先，已完成）

**改动文件**：`harness-demo/src/otel-mock-scenario.ts`（唯一文件）

| 位置 | 改动前 → 改动后 |
|---|---|
| import 区 | `import http from "node:http"; import { resolve } from "node:path";` → 增加 `import { mkdirSync, writeFileSync } from "node:fs";` |
| 头部注释（原「两处**如实适配**」段） | 改为「**三处**如实适配」，新增 `c) 场景自洽性（审计 TECH-A-F1 修复）`：写清「干净树上 `workspace/out/` 不存在 ⇒ 第 2 轮 `list_dir out` 与第 3 轮 `read_file out/otel.md` 双双 error ⇒ ok:7/error:0 契约不成立」，并声明「fixture 不是新增工具调用，8 次 tool_call / 15 spans 契约一位不动」 |
| 新增 `ensureOtelFixture()`（`OTEL_FIXTURE_PATH` + `OTEL_FIXTURE_BODY` + 函数） | 在 `runMockOtelScenario()` 内、`runAgent(...)` 之前调用（`:244` `ensureOtelFixture();`）：`mkdirSync(workspace/out, {recursive:true})` + 写死内容 `workspace/out/otel.md`（幂等，重复运行覆盖为同一内容 → 输出逐字节确定） |

**为什么这样修**：`src/tools.ts:64/71` 的 `list_dir`/`read_file` 在目标不存在时抛 ENOENT（非 `ToolError`），`agent.ts:224-230` 把它记成 `status:"error"`。干净树（`git archive HEAD` 解出）里 `harness-demo/workspace/out/` 整个目录不存在（根 `.gitignore` 的 `harness-demo/workspace/out/` 排除、只有跑过 demo 才生成），所以两次只读调用必然 error。修法按宪章首选方案执行：**场景在读之前先写入**，让「读现状」有确定输入；且准备文件发生在工具循环之外，`ok:7 / denied:1 / error:0 / spanTotal=15` 一位不动。

**验证 1（脏工作区基线，改动前）**：
```
$ cd harness-demo && npm run demo:otel:assert ; echo EXIT=$?
  ❌ 工具状态分布（deny 路径必须在场）（实际/期望）：denied=1/1 error=2/0 ok=5/7
  ❌ error 路径本场景不触发（error 计数为 0）：实际 2 / 期望 0
EXIT=1
```

**验证 2（干净副本，HEAD 代码，改动前）**：
```
$ cd /home/ubuntu/app/learn-agent-harness && git archive HEAD | tar -x -C /tmp/a1clean
$ cd /tmp/a1clean && ln -s /home/ubuntu/app/learn-agent-harness/harness-demo/node_modules harness-demo/node_modules
$ ls workspace/out
ls: cannot access 'workspace/out': No such file or directory     ← 干净树确无该目录
$ cd harness-demo && npm run demo:otel:assert > /tmp/a1-before.log 2>&1; echo EXIT=$?
EXIT=1
$ grep -E "工具状态分布|error 路径" /tmp/a1-before.log
  ❌ 工具状态分布（deny 路径必须在场）（实际/期望）：denied=1/1 error=2/0 ok=5/7
  ❌ error 路径本场景不触发（error 计数为 0）：实际 2 / 期望 0
```

**验证 3（干净副本 + patch，改动后，即验收）**：
```
$ cd /home/ubuntu/app/learn-agent-harness && git diff -- harness-demo/src/otel-mock-scenario.ts > /tmp/a1-otel-fixture.patch   # 76 行
$ cd /tmp/a1clean && git apply --verbose /tmp/a1-otel-fixture.patch
Checking patch harness-demo/src/otel-mock-scenario.ts...
Applied patch harness-demo/src/otel-mock-scenario.ts cleanly.      # APPLY_EXIT=0
$ grep -n "ensureOtelFixture();" harness-demo/src/otel-mock-scenario.ts
244:  ensureOtelFixture();
$ cd harness-demo && npm run demo:otel:assert > /tmp/a1-after.log 2>&1; echo EXIT=$?
EXIT=0
$ grep -E "工具状态分布|error 路径|span 总数|断言" /tmp/a1-after.log
  ✅ 工具状态分布（deny 路径必须在场）（实际/期望）：denied=1/1 error=0/0 ok=7/7
  ✅ error 路径本场景不触发（error 计数为 0）：实际 0 / 期望 0
span 总数 = 15（1 个 trace）：chat×6 + execute_tool×8 + invoke_agent×1
✅ otel span 树断言全部通过（离线 mock，可重跑）
$ grep -c "  ✅" /tmp/a1-after.log   → 22
$ grep -c "  ❌" /tmp/a1-after.log   → 0
```

**验证 4（干净副本幂等复跑，改动后）**：同目录再跑一次 `npm run demo:otel:assert` → `EXIT2=0`，仍 `ok=7/7 error=0/0`、`✅ otel span 树断言全部通过`（fixture 覆盖写为同一内容，输出逐字节确定）。

**契约确认**（宪章要求「确认声明与修好后的行为一致」）：`spanTotal=15`、`invoke_agent×1 + chat×6 + execute_tool×8`、`toolNames` 多重集 8 项、`ok=7 / denied=1 / error=0` 全部原样通过，未改任何 `EXPECTED` 常量；`site/src/data/course-structure.ts:281` 等对外声明的「15 spans」属 `site-ui`/`sot-data` 区，不在本组改动范围，此处仅记录「修好后的行为与 15 spans 声明一致」。

**未验证（原因）**：干净副本用 `ln -s` 复用本机 `harness-demo/node_modules`（`npm ci` 在 2 vCPU/3.4G 机器上属装依赖，宪章 §0.5 禁止）。已验证该副本中 HEAD 版代码**复现失败**、patch 版**exit 0 且 7/7**，差异唯一来源就是这一个 patch。

### A2 / TECHSTATE-F2 — `worker.ts` 的 `flag()` 同时接受 `--k v` 与 `--k=v`（已完成）

**改动文件**：`durable-execution-demo/src/worker.ts`（唯一文件，`:15-31`）

| 改动前 | 改动后 |
|---|---|
| ```ts<br>function flag(name: string): string \| null {<br>  const i = argv.indexOf(`--${name}`);<br>  return i >= 0 && argv[i + 1] ? argv[i + 1] : null;<br>}``` | ```ts<br>const eq = argv.find((a) => a.startsWith(`--${name}=`));<br>if (eq) return eq.slice(`--${name}=`.length);<br>const i = argv.indexOf(`--${name}`);<br>return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;```<br>（与 `demo.ts:24-29` 的 `flag()` 逐字同构；另加注释说明为什么两种都要认） |

**根因**：`notes/durable-execution.md:256` 与 `worker.ts:3` 头部写的手工复现命令是**等号形式**（`npx tsx src/worker.ts --mode=crash --crash=C`），而旧 `flag()` 只认空格形式 → `--mode=crash` 解析不到 → `mode` 退回默认 `"resume"`、`crashAt` 变 `null` → **注入点没命中、进程不崩溃**，读者拿到的是一个"看起来正常跑完的 resume"。

**验证（两种形式都真的崩溃，本机，state 落 /tmp）**：
```
$ cd durable-execution-demo
$ node --import tsx src/worker.ts --mode crash --crash B --state /tmp/dura-1 ; echo EXIT=$?
[worker] mode=crash crash=B task=backfill-1645 steps=4 state=/tmp/dura-1
    💥 崩溃注入 B（intent 后 exec 前：副作用发生没有=未知）→ process.kill(process.pid,'SIGKILL') 真实自杀
EXIT=137
$ node --import tsx src/worker.ts --mode=crash --crash=B --state=/tmp/dura-2 ; echo EXIT=$?
[worker] mode=crash crash=B task=backfill-1645 steps=4 state=/tmp/dura-2
    💥 崩溃注入 B（intent 后 exec 前：副作用发生没有=未知）→ process.kill(process.pid,'SIGKILL') 真实自杀
EXIT=137
```
两条均满足验收三要素：**exit 137 / 有 `💥` / `crashPoint` 非 none**（报告 JSON 里 `crashPoint` 为 `B`）。

**改动前对照（HEAD 版 + 干净副本 `/tmp/a2clean`）**：
```
$ git archive HEAD | tar -x -C /tmp/a2clean && cd /tmp/a2clean/durable-execution-demo
$ ln -s /home/ubuntu/app/learn-agent-harness/durable-execution-demo/node_modules node_modules
$ node --import tsx src/worker.ts --mode=crash --crash=B --state /tmp/dura-head ; echo EXIT=$?
EXIT=0
$ grep -c "💥" /tmp/dura-head.out → 0
$ tail -2 /tmp/dura-head.out
[worker] resume 完成：副作用计数（消息投递）= 1
REPORT_JSON:{...,"crashPoint":"none",...}
```
即改动前照文档敲等号形式：**exit 0、无 💥、`crashPoint":"none"`**——正是 TECHSTATE-F2 描述的症状。

**附带确认（未改，仅记录）**：`worker.ts:5` 头部写「用法：`npm run demo:crash` 之后 `npm run demo:resume` 也可手工复现」，但 `durable-execution-demo/package.json` 只有 `demo` 与 `demo:one` 两个脚本，这两个名字不存在。非本轮 finding，按最小改动原则未动，记入「转交」。


（收尾追加）

## 转交他人

（收尾追加）

## 自检

（收尾追加 `git status --porcelain` 变化清单）
