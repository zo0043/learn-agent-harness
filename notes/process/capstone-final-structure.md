# 毕业项目落地清单（capstone-final-structure，写给 wei）

> 对应 `notes/process/capstone-final.md`。这是生成层（第三跳）的**落地脚手架说明**——与 M0–M4 补全层的 `exercises/m<N>/{starter,solution}` **完全不同**：毕业项目**不建 starter、不建 solution、不写 TODO**，只给「验收判据运行器 + 空命题骨架说明」。命名的判据与命题正文在 `capstone-final.md`（单一真源），本文件只讲「代码骨架长什么样、站点点在哪」。

## 1. 硬边界（落地时不得越界）

- ❌ **不建** `final-project/{starter,solution}`，不建任何 `exercises/*/` 结构，不写 `TODOError`，不写任何 half-done 文件等学员补函数体。
- ❌ **不写** 任何「正确实现长什么样」的 hint：不出现 `types.ts 骨架`、`loop.ts 签名`、`policy.ts 函数名`、`memory.ts createStore` 这类把模块拆分/接口/实现名塞给学员的内容。
- ✅ **只建三样**（见 §2）：① 判据运行器（跑「学员自己写的断言 + 学员自己写的自述」，机器判覆盖性 + exit 码）；② 空命题骨架说明（3 命题的标题 + 一句话，内容指向 `capstone-final.md`）；③ 学员成品的工作目录约定（空目录，含 `assert.mjs` + `MANIFEST.md` 的**约定**，不含实现）。

> 判据运行器唯一「知道」学员成品的两个接口：`<成品>/assert.mjs`（黑盒断言脚本，exit 0 = 过）与 `<成品>/MANIFEST.md`（白盒自述，覆盖 W1–W7）。它**不知道**学员内部实现长什么样——这正是生成层与补全层的分界。

## 2. 脚手架目录（顶层 `final-project/`，与 `my-agent/` 并列）

```
final-project/
  README.md             # 空命题骨架说明：三命题标题 + 「判据在 capstone-final.md」指针，零实现内容
  grade.mjs             # 判据运行器：node grade.mjs <学员成品目录>
  rubric.mjs            # 白盒要素清单（硬编码 W1–W7，grade.mjs 引用）+ 黑盒判据编号（B1–B5）
  subjects/
    a-research.md       # 命题 A 一句话骨架（完整命题见 capstone-final.md §3）
    b-repo-guard.md     # 命题 B 一句话骨架
    c-signal-arbiter.md # 命题 C 一句话骨架
    （可选）README      # 「选一条，从空目录起步」指引
```

学员自己的成品在**学员自选的任意目录**（如 `~/my-agent-final` 或 `final-project/mine/`），判据运行器对一个「成品目录」跑分，不在脚手架里预建实现。

## 3. 三个文件的职责（wei 落地时照此写）

### 3.1 `rubric.mjs`（判据的机器可读唯一真源）

```js
// 与 notes/process/capstone-final.md §4 逐字对照；只有编号 + 判据文案，不含任何实现 hint
export const BLACKBOX = [
  ['B1', '确定性', '同一输入连跑两次 diff 空'],
  ['B2', '主任务跑通', '某条端到端输入→预期断言过'],
  ['B3', '权限/沙箱拦停', '危险动作被拒且副作用未发生'],
  ['B4', '崩溃可恢复', '中断后重启，副作用恰好一次'],
  ['B5', '评测自评', 'golden set（≥3 条）达标 + 打印指标'],
];
export const WHITEBOX = [
  ['W1', 'loop 想→做→说 + 终止判定', 'M0'],
  ['W2', '≥2 工具按名分发', 'M1'],
  ['W3', '默认 deny / 白名单 / 多通道（其一）', 'M1/M2'],
  ['W4', 'golden set + 可跑断言', 'M2'],
  ['W5', 'journal / checkpoint / 幂等（其一）', 'M3'],
  ['W6', 'span / metric / 结构化日志（其一）', 'M3'],
  ['W7', '记忆 / 评测飞轮 / 模型成本意识（M4 三选一）', 'M4'],
];
```

### 3.2 `grade.mjs`（判据运行器）

只做两件可判定的事、各给 `✅`/`❌`、末行 `✅ 毕业判据通过 / ❌`：

1. **黑盒**：`node <成品>/assert.mjs` 子进程，`exit 0` 且末行含 `✅`（学员自己的断言决定 B1–B5 细节；运行器只认 exit 码）→ 黑盒过。
2. **白盒**：读 `<成品>/MANIFEST.md`，逐条 `W1–W7` 检查「MANIFEST 里按 `W<k>:` 格式指认了位置」→ 七条全覆盖 → 白盒过，否则列缺失编号。

```js
// grade.mjs 骨架（示意，wei 落地成真实现）
const dir = process.argv[2]; if (!dir) { console.error('用法：node grade.mjs <成品目录>'); process.exit(2); }
// (1) 黑盒：跑学员 assert.mjs
spawnSync('node', [join(dir, 'assert.mjs')], { stdio: 'inherit' });  // 认 exit 码 + 末行 ✅
// (2) 白盒：读 MANIFEST.md，正则找每一行 `W\d:`，比对 rubric WHITEBOX 七条全覆盖
// (3) 末行：两者皆过 → '✅ 毕业判据通过'（exit 0），否则 '❌ 毕业判据通过（缺失: W3, B4…）'（exit 1）
```

> 判据运行器**不检查黑盒是不是真的确定性、不检查白盒指认是不是对**——那是学员自己的 `assert.mjs` 与 `MANIFEST.md` 的责任，运行器只做「覆盖性 + exit 码」两层机器判据，避免越界给答案。

### 3.3 `README.md` + `subjects/*.md`（空命题骨架说明）

- `README.md`：三命题标题 + 「完整命题/判据/自测引导见 `notes/process/capstone-final.md`（本站「毕业项目」卡）」+ 生成层纪律一句话（「从空目录起步，无 starter/TODO/solution」）+ `node grade.mjs <目录>` 判据入口。
- `subjects/a|b|c-*.md`：只放命题**标题 + 一句话摘要**（如「个人研究助理：查资料→记笔记→定时提醒，带权限门/可自评/可恢复」），**不放实现 hint**，完整判据指针回 `capstone-final.md`。

## 4. 站点呈现落点（learn.astro）

`site/src/pages/learn.astro` 的 capstone 主线 section（M0–M4 五卡）之后，新增一个「毕业项目（final）」卡：

- **卡片定位**：与 M0–M4 卡同一 section、视觉并列但末尾收起；标题「毕业项目 · 生成层收口」；副文案一句话「从模糊需求，独立设计并实现你自己的 agent」。
- **卡内三块**：
  1. 三步层级（追踪→补全→生成）一句带过，点明「本卡是第三跳」；
  2. 三命题标题（research-assistant / repo-guard / signal-arbiter）+ 指向 `notes/process/capstone-final.md` 的判据清单（黑盒 B1–B5 / 白盒 W1–W7 的机器可读摘要，可从 `final-project/rubric.mjs` 或 capstone-final.md 直读渲染）；
  3. 「怎么判自己过关」三步（先黑盒跑通 → 再白盒自查 → 再补断言）+ `node grade.mjs <目录>` 入口。
- **数据源**：新增一份站点数据（如 `site/src/data/final-project.ts`）承载「命题标题/摘要 + B1–B5 + W1–W7 + 收口一句话」，与 `notes/process/capstone-final.md` 逐字一致（单一真源，机器可核对）；`learn.astro` 只读它渲染，不另造一套文案。
- **不建课程路由**：毕业项目是主线 section 的收口卡，**不新增 `routes`/`/c/*` 课程页**；`notes/process/capstone-final.md` + `notes/process/capstone-final-structure.md` 加入 `courses.ts` 的 `EXCLUDED_FROM_COURSE_ROUTE`（照 capstone-m<N>-exercise/structure 同规）。

## 5. 落地自检（wei 做完跑一遍）

- [ ] `final-project/` 下**无** `starter` / `solution` / `TODOError` / 任何 `.ts` 半成品实现文件（只有 `grade.mjs`/`rubric.mjs`/`subjects/*.md`/`README.md`）；
- [ ] `rubric.mjs` 的 B1–B5 / W1–W7 与 `notes/process/capstone-final.md` §4 逐字一致；
- [ ] `grade.mjs` 对一个「空目录（缺 assert.mjs + MANIFEST.md）」跑，能 `❌ 毕业判据通过（缺失…）` 且 exit 1（判据可达、不是恒绿假判据）；
- [ ] `grade.mjs` 对一个「自制的、MANIFEST 七条全 + assert.mjs exit 0」的最小成品目录跑，能 `✅ 毕业判据通过` exit 0（判据可达，不是恒红）；
- [ ] learn.astro capstone section 后出现「毕业项目」卡，caption 文案与 capstone-final.md §6 收口一句话一致；
- [ ] `courses.ts` EXCLUDED 已含 `capstone-final` + `capstone-final-structure`（路由页保持 17 不变）；
- [ ] 全离线零 key 延续：`final-project/` 脚手架里无任何真实 API key / 网络调用 / 真实模型端点。

## 6. 与补全层（M0–M4）的对照（落入 README 供学员自量）

| | 补全层 M0–M4 | 生成层 毕业项目 |
|---|---|---|
| 你拿到什么 | `starter`（半成品）+ `solution`（参考答案） | 命题 + 判据 + 引导（`capstone-final.md`），空目录起步 |
| 判据 | 教师写的 `assert:m<N>` | 你自己写的 `assert.mjs` + `MANIFEST.md` |
| 你练什么 | 把给定签名补对 | 从模糊需求拆模块、定接口、写验收 |
| 过关线 | `assert:m<N>` 末行 ✅（exit 0） | `grade.mjs` 黑盒过 + 白盒齐（exit 0） |
| 一句话收口 | 你搭出的 == 主线 reference | 你搭出的 **与 M4 同级，且是你独立设计的** |