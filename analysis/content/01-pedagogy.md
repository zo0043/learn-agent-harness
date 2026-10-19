# 教学法与认知负荷分析报告（pedagogy）

- 分析者：pedagogy｜时间：2026-10-16 17:52
- 语料覆盖声明：
  - **通读（逐行）**：`notes/knowledge-map.md`(174 行)、`notes/process/teaching-style-guide.md`(94 行)、`notes/process/capstone-style-guide.md`(102 行)、`site/src/data/course-structure.ts`(426 行)、`site/src/pages/learn.astro`(496 行)、`notes/details/*.md` 全 8 篇(各 32 行左右)。
  - **结构化通读（全部标题 + 每课「预备知识」段 + 每课首/尾 + 指定区间逐行）**：`notes/*.md` 顶层 19 篇。
    指定区间逐行：`notes/mcp.md:151-318`（S4 全景）、`notes/sandbox.md:428-530`、`notes/system-design.md:390-428`、`notes/model-basics.md:129-132,222-266`、`notes/api-engineering.md:201-215,229`、`notes/agent-harness.md:380-400`、`notes/rag.md:317-339`、`notes/harness-from-scratch.md`（经 `harness-demo/src/test-compact.ts` 逐行 + 定点 grep）。
  - **抽样**：`site/src/pages/nav.astro:17-24`、`site/src/pages/map.astro:1-80`、`my-agent/README.md`（仅标题级）、各 demo `package.json` 的 `scripts` 键、`notes/process/site-refactor-plan.md`（仅 grep 级）。
  - **未读（原因）**：`notes/process/` 其余 18 篇计划文档只做 grep 级抽读（任务列为 secondary）；`industry-2026.md`/`interview-bank.md` 只读标题与命中行；各 demo 源码正文未通读（不属本角度主读带，且"注释"已被语料范围排除）。
- 结论摘要（≤5 条）：
  1. **前置依赖的「数据层」是干净的，但呈现层有三套互斥的路由**：17 门课的 `prereqs ⊆ 更早 order` 全部成立、依赖图无环，但 `knowledge-map.md` 的依赖图与 `course-structure.ts` 的 `prereqs` **9/15 门课对不上**（F1），并且仓库里同时活着**三份不同的「建议开课顺序」**（F2）。
  2. **难度曲线不单调**：P0 阶段内部跨度 1→4（序章 1 分到系统设计 4 分），最大跃迁在 P0→P1（平均 +1.7），P4 反而回落（F14）。
  3. **认知负荷两个明确峰值**：`mcp.md` S4 单节 9093 字符 / 24 个具名条目（全课 31363 字符的 29%），`observability.md` S2 单节 6624 字符的属性清单（F6）。
  4. **练习体系"可做完但不可自检"**：205 题里 176 题是「# / 题目 / 考察」三列表，没有任何答案、rubric 或判据；全仓仅 21 题带答案（F7）。风格指南 §1⑦ 本身只要求「考察」列 → **指南不强制可自检**（F8 的另一半）。
  5. **`details/` 8 页的「未覆盖」自述有 3/8 与同文件「行业一手源」直接矛盾**（F5）——学习者用来决定"还缺什么"的缺口地图不可信；而 `✅ 已完成` 标记的两门课恰是最不满足风格指南骨架的两门（F8）。
- 正面基线（先说清楚，避免"全是问题"的错觉）：
  - `node /tmp/dep.mjs`：17/17 `prereqs` 满足 `⊆ 更早 order`，`next` 全部 = 序 +1（末课空），阶段计数 `{P0:5,P1:4,P2:3,P3:3,P4:2}` 与 `site/src/data/course-structure.ts:386` 的注释一致。
  - 11 门带「预备知识」段的课，其正文「课程依赖（prereqs）」与 `course-structure.ts` 的 `prereqs` **逐门一致**（mcp/sandbox/evaluation/multi-agent/long-term-memory/model-basics/observability/data-flywheel/api-engineering/durable-execution/framework-ecosystem）；`notes/system-design.md:4` 的「前置：」行亦与 `prereqs` 一致。
  - `knowledge-map.md:17` 的「课内嵌 205 题」口径**可复现**：13 张练习题库表 = 168 行 + `harness-from-scratch` 8 行 = 176，+ `agent-harness` §13 的 8 题 + `rag` 5 题 + `model-basics` S7 的 16 题 = 205。
  - `notes/details/` 8 页结构完全统一（一句话定义 / 为什么影响走向 / 行业一手源 / 本地映射〔已覆盖·未覆盖〕/ 面试一句话），且每页都有显式的「未覆盖」自述——这个"自带诚实块"的设计本身值得保留（问题在 F5：内容写错了）。

---

## 1. 前置依赖是否成立

**结论**：数据层成立，呈现层不成立。分三段说。

### 1.1 数据层：17/17 合法、无环（正面）

复现脚本（我亲自跑过，下面是脚本原文，`node /tmp/dep.mjs`）：

```js
import fs from 'fs';
const src = fs.readFileSync('site/src/data/course-structure.ts','utf8');
const items = [];
const re = /\{\s*\n\s*(?:slug: '([\w-]+)',[\s\S]*?)stage: '(P\d)',[\s\S]*?prereqs: \[([^\]]*)\],\s*\n\s*next: \[([^\]]*)\]/g;
let m;
while ((m = re.exec(src))) {
  items.push({slug:m[1], stage:m[2], prereqs:m[3].split(',').map(s=>s.trim().replace(/'/g,'')).filter(Boolean), next:m[4].split(',').map(s=>s.trim().replace(/'/g,'')).filter(Boolean)});
}
const idx = new Map(items.map((c,i)=>[c.slug,i]));
console.log('parsed items:', items.length);
items.forEach((c,i)=>{
  const bad = c.prereqs.filter(p=>!idx.has(p) || idx.get(p)>=i);
  const nx = idx.has(c.next[0]) && idx.get(c.next[0])===i+1;
  console.log(`${String(i).padStart(2)} ${c.slug.padEnd(22)} ${c.stage} prereqs=[${c.prereqs.join(',')}] ${bad.length? 'VIOLATION:'+bad.join(','):'topo-ok'} next=${c.next[0]} ${nx?'seq-ok':'SEQ-BREAK'}`);
});
console.log('\nstage counts:', JSON.stringify(items.reduce((a,c)=>{a[c.stage]=(a[c.stage]||0)+1;return a;},{})));
```

关键输出：17 行全部 `topo-ok`，`next` 全部 `seq-ok`（末课 `industry-2026` 为 `next=undefined SEQ-BREAK`，属设计上的"末课空"，`learn.astro:186` 已声明），`stage counts: {"P0":5,"P1":4,"P2":3,"P3":3,"P4":2}`。
依赖图的环检测（`node /tmp/cycle.mjs`，脚本见 F1）输出 `cycles = 无环(0)`。

### 1.2 依赖图对不上（→ F1）

`knowledge-map.md:103-125` 的 mermaid 依赖图与 `course-structure.ts` 的 `prereqs` 在 **9/15 门课**上不一致。详见 F1。

### 1.3 跨课引用：多数是"合法前瞻"，但有一处"锚点表指向未学课程"（→ F11、F4）

用脚本统计每门课正文提到其他课程的行（`node /tmp/xref.mjs`，按 `course-structure` 线性序判定"后向 = 引用更晚的课"）：

```
### mcp (order 6)  后向引用(引用更晚的课)=8  前向=32
   BACK -> evaluation (order 7) at lines 232
   BACK -> observability (order 11) at lines 236
   BACK -> long-term-memory (order 12) at lines 232,253
   BACK -> framework-ecosystem (order 15) at lines 233,253,384,565
### api-engineering (order 10)  后向引用=6  前向=30
   BACK -> model-basics (order 14) at lines 210
### observability (order 11)  后向引用=3  前向=15
   BACK -> data-flywheel (order 13) at lines 6,351
```

这些"后向引用"绝大多数出现在 **来源与锚点 / 交叉定位 / 走查收口**这类位置上，属合法的"前瞻指针"，不构成前置违约。但 `mcp.md:232`/`233`/`236` 出现在 **S4.3 表格的「我的锚点」列**（ASI06→长期记忆 §S5、ASI07→框架生态 §S3、ASI10→可观测 §S4）：列名是"**我的**锚点"，而这三门课分别排在 mcp 之后的第 6/9/5 位——照 `/learn/` 线性序走的读者在这里被要求指认自己尚未建立的知识。这属**表述层**问题（应改为"对应课/后续课"），不是依赖违约。

---

## 2. 难度曲线（逐课 1–5）

评分口径（可复现，不靠感觉）：`chars` = `python3` 逐文件 `len(text)`；`CJK` = 汉字数；`最大节` = 按 `^#{1,2} ` 切段后最大段的字符数；`前置` = `course-structure.ts` 的 `prereqs.length`；`新概念代理` = `**…**` 加粗标签数（近似"本课引入的具名概念"）；`题目` = 练习题库行数。
难度分是上述量的加权判断，**不是单选题**：`新概念代理/1000 chars` 高 + `前置`多 + 需要外部工具链（npm/tsx/统计）→ 加分。

| # | 课程 | 阶段 | 难度 | 前置 | chars | CJK | 最大节字符 | 加粗 | 题目 | 依据（本角度） |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | llm-timeline | P0 | **1** | 0 | 2918 | 729 | 970 | 3 | 0 | 纯阅读，无代码/数学；`course-structure.ts:95` 自述"0 经验可读：会看网页即可" |
| 1 | harness-from-scratch | P0 | **2** | 0 | 8343 | 2053 | 1158 | 25 | 8 | 首门动手课但门槛真实存在（Python 基础 + npm/tsx 双工具链，见 F10）；加粗密度最低（3.0/千字），概念负荷小、动手负荷大 |
| 2 | agent-harness | P0 | **4** | 1 | 15898 | 6221 | 1422 | 98 | 8 | 8 层架构 + "每层删掉失去什么保证"；49 个 h2（含第 14/15 节两篇历史调研附录，见 F9 的风险） |
| 3 | rag | P0 | **3** | 1（`:138`） | 13100 | 4992 | 2620 | 101 | 5 | embedding/ANN/RRF 三个新范式；一节一"死法"的推进方式对新手友好 |
| 4 | system-design | P0 | **4** | 2（`:154`） | 19899 | 8321 | 4388 | 108 | 14 | 综合设计题，需把前两门收口；S9 是 30 分钟口述稿（考的是组织能力） |
| 5 | sandbox | P1 | **4** | 1 | 25505 | 8468 | 3146 | 171 | 16 | 17 个 h2/h3（含 S2.5/S3.5 插入节）+ 16 题库，是所有课里题量最大的 |
| 6 | mcp | P1 | **5** | 1 | **31363** | 9246 | **9093** | 270 | 14 | 全仓最长课；单节 24 个具名条目（F6）；协议 + 认证 + 两版 OWASP + 注入双层分类 |
| 7 | evaluation | P1 | **5** | 1 | 21540 | 8774 | 4049 | 160 | 14 | 需要统计直觉（Kappa/抽样/一致性），S9 是 7 步完整校准推演 |
| 8 | multi-agent | P1 | **4** | 2 | 23279 | 6704 | 7290 | 149 | 12 | 概念不算新但判据多（S1 何时不用 / S9 什么时候不要用，两节都在"反着说"） |
| 9 | durable-execution | P2 | **4** | 2 | 23148 | 8509 | 6720 | 150 | 14 | journal/checkpoint/幂等的组合推理；S7 demo 实录占 6720 字符但属过程叙述 |
| 10 | api-engineering | P2 | **4** | 1 | 19699 | 7710 | 3806 | 146 | 14 | 六模块并联（流式/结构化/caching/重试/路由/成本），每块都不深但都要求落地 |
| 11 | observability | P2 | **4** | 1 | 22519 | 7106 | 6624 | 174 | 14 | 最大节是 OTel GenAI 属性清单（记忆型负荷，F6） |
| 12 | long-term-memory | P3 | **5** | 1 | 25514 | 9602 | 4466 | 209 | 14 | 加粗标签全仓最多（209），S1-S11 十一个编号节 + 写/读/遗忘/安全四路径 |
| 13 | data-flywheel | P3 | **4** | 1 | 20376 | 8277 | 6513 | 190 | 14 | 生产故事型，但六步走查 + 三轮指标口径需对齐 |
| 14 | model-basics | P3 | **5** | 1（`llm-timeline`） | 19010 | 7213 | 2857 | 130 | 14+16 | **跃迁最陡**：唯一前置是 P0 的纯阅读序章（难度 1），本课含 KV cache 公式/量化/RL 谱系 + 16 题八股 |
| 15 | framework-ecosystem | P4 | **4** | 1 | 24119 | 8516 | 6006 | 188 | 14 | 21 个 h3，SDK 对照需读 TS/Python 签名 |
| 16 | industry-2026 | P4 | **2** | 0 | 11270 | 2863 | 3515 | 47 | 0 | 纯阅读收口，无动手；`course-structure.ts:372` 自述"无硬前置" |

**曲线判读（→ F14）**：阶段均值 P0=2.8 / P1=4.5 / P2=4.0 / P3=4.7 / P4=3.0。**P0→P1 是唯一 >1 的跃迁（+1.7）**，而 P3→P4 反向下降 1.7。`course-structure.ts:23` 把阶段定义为"基础篇 → 工具与安全 → 生产可靠性 → 体系与数据 → 收口与前沿"，读起来是"由浅入深"，但难度序列在 P4 回落、而 P0 内部跨度 1→4。

---

## 3. 认知负荷（可量化）

复现脚本（`node /tmp/load.mjs`，我亲自跑过）：

```js
import fs from 'fs';
const files=fs.readdirSync('notes').filter(f=>f.endsWith('.md')).sort();
console.log(['file','chars','bold','qrows','tblrows','mermaid','code','sections','maxSecChars','maxSecName'].join('\t'));
for(const f of files){
  const t=fs.readFileSync('notes/'+f,'utf8');
  const chars=[...t].length;
  const bold=(t.match(/\*\*[^*\n]{1,40}\*\*/g)||[]).length;
  const tbl=(t.match(/^\|/gm)||[]).length;
  const mm=(t.match(/^```mermaid/gm)||[]).length;
  const code=((t.match(/^```/gm)||[]).length)/2;
  const secs=[]; let cur={name:'(head)',len:0};
  for(const line of t.split('\n')){
    if(/^#{1,2} /.test(line)){ secs.push(cur); cur={name:line.replace(/^#+ /,'').slice(0,34),len:0}; }
    else cur.len+=[...line].length;
  }
  secs.push(cur);
  const body=secs.filter(s=>s.name!=='(head)');
  const max=body.reduce((a,b)=>b.len>a.len?b:a,{name:'-',len:0});
  console.log([f,chars,bold,tbl,mm,code,body.length,max.len,max.name].join('\t'));
}
```

`mcp S4` 单节密度（另一条独立命令）：

```
$ awk 'NR>=151 && NR<=318' notes/mcp.md | wc -l -m
    168    9093
$ awk 'NR>=65 && NR<=142' notes/observability.md | wc -l -m
     78    6624
```

- 全仓 17 门课正文合计 **327500 字符**、均值 **19265 字符**（`python3` 逐文件 `len(open(...).read())` 求和，脚本见 F10 无关；实测输出 `17 门课 chars 合计 = 327500  均值 = 19265`），单课最长 `mcp` 31363 / 最短 `llm-timeline` 2918，**差 10.7 倍**。
- 单节峰值：`mcp.md` S4 = 9093 字符（该课 29%），在 151–318 行内承载 **4 类攻击面 + OWASP LLM Top 10（2026）10 条 + OWASP Agentic Top 10（2026）10 条 = 24 个具名条目 + 1 张 6 节点 mermaid + 防御分层表**，且本节之前只有 S4.1-S4.4 四个小节标题、没有任何练习或自检点（全课唯一的练习题库在 `mcp.md:538`，相距 220 行）。
- 第二峰值 `observability.md:65-142` S2 = 6624 字符，主体是 OTel GenAI 属性名清单——记忆型负荷，无推导可依。
- 长度并不等于难度：`long-term-memory` 9602 CJK 是 CJK 最高，但加粗密度 8.2/千字（209/25514），而 `harness-from-scratch` 只有 3.0/千字（25/8343）——**密度与长度都在 mcp 处同时取峰**，这是 F6 的量化依据。

---

## 4. 教学法是否服务目标读者（coding agent 岗面试备考）

**服务到的部分（正面）**：几乎每门课都把"面试官追问"独立成节（`grep -c 面试官追问`：sandbox 6 / mcp 6 / framework 8 / api 4 / evaluation 3 / durable 3 / observability 3 / system-design 4）；每门课的「来源与锚点」节给出 URL/论文号/实测命令（19 篇顶层笔记里 17 篇有「来源」节，缺的 2 篇是 `knowledge-map` 与 `interview-bank` 这两个非课程文件）；`system-design.md:124-148` 那种"现象/对策/面试官追问"三行结构，是最省读者推理力的写法，值得作为全仓模板。

**没服务到的部分（→ F7、F8、F10）**：练习可做完但不可自检（F7）；`✅` 标记与教学完成度脱钩（F8）；"0 经验可入手"与实际门槛冲突（F10）。另外**类比几乎没有**：

```
$ for p in 就像 好比 打个比方 类比 相当于 如同; do printf "%-10s %s\n" "$p" "$(grep -ro "$p" notes/*.md | wc -l)"; done
就像        0
好比        0
打个比方    0
类比        1
相当于      0
如同        0
```

唯一一次「类比」出现在 `notes/long-term-memory.md:26`（表头列名）。全仓靠"FinHot 事故 + demo 实测 + 对照表"承担直觉建立——对**有工程背景的转岗读者**有效，但对 `course-structure.ts:37`「0 经验可入手 · 从零写 harness 起步」承诺的读者，缺少从日常经验搭桥的台阶。这一条我按 **medium** 登记（F10 是它的可证伪形式），不单列偏好型 finding。

---

## 5. 风格指南与内容的双向偏离

见 F7（指南不强制可自检）、F8（内容没做到骨架）、F9（指南的节号规则不可满足）、F12（指南式"标题承诺"与内容不符）、F13（capstone 指南的七段 README 与交付物不符）。指南另一处值得记录：`teaching-style-guide.md:3` 自述规范"供 P1–P4 逐课深度终稿沿用（当前从 sandbox / mcp 起步）"，**P0 五课在指南制定之前就已定稿**——这就是 F8 的机制性根因（不是执行不力，是指南没回溯覆盖 P0，而 P0 又恰好挂着唯一的两个 `✅`）。

---

## Finding 清单

### pedagogy-F1 ｜ severity: high ｜ 归属: 内容
- **对象**：`notes/knowledge-map.md:103-125`（依赖图）↔ `site/src/data/course-structure.ts:105,122,138,154,172,189,206,223,242,259,276,295,312,329,348`（`prereqs`）
- **原文引文**：`HARNESS --> MCP`（knowledge-map.md:109）；`mcp` 条目 `prereqs: ['sandbox'],`（course-structure.ts:189）；`EVAL --> MULTIAGENT`（knowledge-map.md:111）；`multi-agent` 条目 `prereqs: ['system-design', 'harness-from-scratch'],`（course-structure.ts:223）
- **现象**：同一个仓库里活着两张依赖图，对 15 门非横向课中的 9 门给出不同前置。其中 2 门是**冲突边**（mcp 的父是 harness 还是 sandbox；multi-agent 的父含不含 evaluation），6 门是**图中缺入边**（agent-harness / rag / observability / long-term-memory / model-basics / framework-ecosystem 在 mermaid 图里没有任何前置连线）。
- **证据**（我亲自跑过，脚本原文与输出）：

```js
import fs from 'fs';
const km=fs.readFileSync('notes/knowledge-map.md','utf8');
const edges=[...km.matchAll(/^\s+(\w+) (?:-->|-\.->)(?:\|[^|]*\|)? (\w+)$/gm)].map(m=>[m[1],m[2]]);
const CODE={HARNESS:'harness-from-scratch',RAG:'rag',SYSDESIGN:'system-design',SANDBOX:'sandbox',EVAL:'evaluation',DURABLE:'durable-execution',MCP:'mcp',API:'api-engineering',FLYWHEEL:'data-flywheel',OBS:'observability',MEMORY:'long-term-memory',MODEL:'model-basics',FRAMEWORK:'framework-ecosystem',MULTIAGENT:'multi-agent'};
const site={'harness-from-scratch':[],'agent-harness':['harness-from-scratch'],'rag':['harness-from-scratch'],'system-design':['harness-from-scratch','rag'],'sandbox':['harness-from-scratch'],'mcp':['sandbox'],'evaluation':['rag'],'multi-agent':['system-design','harness-from-scratch'],'durable-execution':['harness-from-scratch','evaluation'],'api-engineering':['harness-from-scratch'],'observability':['api-engineering'],'long-term-memory':['rag'],'data-flywheel':['evaluation'],'model-basics':['llm-timeline'],'framework-ecosystem':['agent-harness']};
const graphParents={};
for(const [a,b] of edges){ if(b==='INTERVIEW') continue; (graphParents[CODE[b]] ??= []).push(CODE[a]); }
let mismatch=0;
for(const c of Object.keys(site)){
  const g=(graphParents[c]||[]).slice().sort().join(',')||'(无入边)';
  const s=site[c].slice().sort().join(',');
  const eq=g===s; if(!eq) mismatch++;
  console.log(`${c.padEnd(22)} | ${(s||'-').padEnd(38)} | ${g.padEnd(30)} ${eq?'一致':'★不一致'}`);
}
console.log(`\n不一致课程数 = ${mismatch} / ${Object.keys(site).length}；图中非 INTERVIEW 边数 = ${edges.filter(e=>e[1]!=='INTERVIEW').length}`);
```

关键输出（节选）：

```
mcp                    | sandbox                                | harness-from-scratch           ★不一致
multi-agent            | harness-from-scratch,system-design     | evaluation,system-design       ★不一致
agent-harness          | harness-from-scratch                   | (无入边)                        ★不一致
rag                    | harness-from-scratch                   | (无入边)                        ★不一致
observability          | api-engineering                        | (无入边)                        ★不一致
long-term-memory       | rag                                    | (无入边)                        ★不一致
model-basics           | llm-timeline                           | (无入边)                        ★不一致
framework-ecosystem    | agent-harness                          | (无入边)                        ★不一致

不一致课程数 = 9 / 15；图中非 INTERVIEW 边数 = 11
```

环检测（`node /tmp/cycle.mjs`，同一份边抽取 + DFS 三色）输出：`edge count(excl INTERVIEW) = 11  nodes = 10`、`cycles = 无环(0)`、`无入边节点 = HARNESS,RAG`。**无悬空节点引用、无环**——问题是边集不完整/不一致，不是图坏了。
- **影响**：`learn.astro:188` 明确写着「完整依赖图见 **知识地图 →**」，把读者从"线性序"引到这张图上；读者按图找"我该先学什么"时，会在 mcp/multi-agent 拿到与课程卡「前置」chip（`learn.astro:133-141` 渲染 `prereqs`）相反的答案。
- **建议方向**：把依赖图从手写 mermaid 改为由 `course-structure.ts` 的 `prereqs` 派生（`/map` 已由 `map.astro:2-9` 声明"知识地图 = notes 原文渲染、单一真源"，故需先把图本身从"手写文本"变成"可校验产物"），或在知识地图中显式声明"本图为 P0-P2 优先级示意，权威前置以课程卡为准"。
- **置信度**：高（脚本可重跑，逐门列出）。

### pedagogy-F2 ｜ severity: high ｜ 归属: 内容
- **对象**：`notes/knowledge-map.md:128`、`notes/knowledge-map.md:162`、`site/src/pages/learn.astro:173-191`（+ `site/src/data/course-structure.ts:80-375` 数组序）
- **原文引文**：`knowledge-map.md:128`：「**建议开课顺序**:系统设计 → 多智能体编排 → 沙箱与凭据(续 §S2)→ 评测工程化 → durable execution → MCP 与供应链安全 → API 与多模型路由 → 数据飞轮 →(P2 四课按目标岗位权重排)。」
  `knowledge-map.md:162`：「[ ] [interview-bank §7 并入] 开课顺序确认（当前建议：系统设计 → 沙箱与凭据（续 S2）→ 评测工程化 → durable execution → MCP 与供应链安全 → API 与多模型路由 → 数据飞轮 → P2 四课按目标岗位权重排）」
- **现象**：仓库里同时活着**三份不同的建议顺序**，且同一文件内两处自相矛盾：`:128` 把「多智能体编排」排在**第 2 位**，`:162` 的同一件事**完全没有它**；而站点 `/learn/` 的「建议开课顺序」（`learn.astro:177` 标题自称"线性阅读序 #1→#17（COURSE_STRUCTURE 数组序，与 course-structure.ts 单一真源）"）把「多智能体编排」排在第 9 位、把「系统设计」排在第 5 位，并在其前面放了 llm-timeline / harness-from-scratch / agent-harness / rag 四门课。
- **证据**：
```
$ grep -n "建议开课顺序\|系统设计 →\|沙箱与凭据(续\|沙箱与凭据（续" notes/knowledge-map.md
128:**建议开课顺序**:系统设计 → 多智能体编排 → 沙箱与凭据(续 §S2)→ 评测工程化 → durable execution → MCP 与供应链安全 → API 与多模型路由 → 数据飞轮 →(P2 四课按目标岗位权重排)。
162:- [ ] [interview-bank §7 并入] 开课顺序确认（当前建议：系统设计 → 沙箱与凭据（续 S2）→ 评测工程化 → durable execution → MCP 与供应链安全 → API 与多模型路由 → 数据飞轮 → P2 四课按目标岗位权重排）
$ grep -n '门课\|线性阅读序' site/src/pages/learn.astro
67:    P0–P4 五阶段 × <strong>{COURSE_STRUCTURE.length} 门课</strong>，线性阅读序，每课带
177:      <span class="phase-desc">线性阅读序 #1→#17（COURSE_STRUCTURE 数组序，与 course-structure.ts 单一真源）</span>
```
  （另：`knowledge-map.md:162` 是**未结事项里的未勾选项**，说明作者自己知道"开课顺序未确认"；但 `:128` 与 `learn.astro:177` 都以"建议/真源"的确定语气写给读者。）
- **影响**：这是考生排学习计划时最先看的两个页面（`/map` 与 `/learn`），三份顺序的差异最大到 7 个位次（多智能体编排 2 vs 9），读者无法判断哪份是当前口径；对"时间有限、要按岗备考"的目标读者，这直接决定先学什么。
- **建议方向**：以 `course-structure.ts` 数组序为唯一"阅读序"，把 `knowledge-map.md:128/162` 改为"按目标岗位权重的选修优先级（不构成阅读顺序）"并去掉箭头链表达，或反向统一（先定一份，另一处只引用）。
- **置信度**：高（grep 原文 + 三处定位）。

### pedagogy-F3 ｜ severity: high ｜ 归属: 内容
- **对象**：`notes/knowledge-map.md:55-68`（`优先级` 列）↔ `site/src/data/course-structure.ts:85,101,118,134,150,168,185,202,219,238,255,272,291,308,325,344,361`（`stage`）
- **原文引文**：`knowledge-map.md:53-54` 表头「`| 主题 | 优先级 | 状态 | …`」；`knowledge-map.md:59`「`| 沙箱与凭据·可复现 | P0 | 📐 讲义已展开（2026-10-11） | …`」；`course-structure.ts:168`「`stage: 'P1',`」（sandbox 条目内）
- **现象**：**同一个字形 `P0/P1/P2` 在两个产物里指两件事**：knowledge-map 的 `优先级` 列（来自 handoff 的优先级方案）与 course-structure/`/learn/` 的 `stage`（五档阶段，`STAGE_LABELS` = 基础篇/工具与安全/生产可靠性/体系与数据/收口与前沿）。两者对 **14 门编号课中的 9 门给出不同档位**：

| 课程 | knowledge-map `优先级`(:55-68) | course-structure `stage` | 差 |
|---|---|---|---|
| 沙箱与凭据 | **P0**（:59） | P1（:168） | 1 档 |
| 评测工程化 | **P0**（:62） | P1（:202） | 1 档 |
| 多智能体编排 | **P0**（:68） | P1（:219） | 1 档 |
| durable execution | P1（:61） | P2（:238） | 1 档 |
| API 与多模型路由 | P1（:64） | P2（:255） | 1 档 |
| 数据飞轮 | P1（:65） | **P3**（:308） | 2 档 |
| 长期记忆 | P2（:60） | **P3**（:291） | 1 档 |
| 模型基础 | P2（:66） | **P3**（:325） | 1 档 |
| 框架生态 | P2（:67） | **P4**（:344） | 2 档 |

- **证据**（我亲自跑过）：
```
$ sed -n '53,68p' notes/knowledge-map.md | cut -c1-60
| 主题 | 优先级 | 状态 | 课程文件 | 完成后你能…
| 从零写 harness | P0 | ✅ | `harness-from-scratch.md` |
| RAG 与检索 | P0 | ✅ | `rag.md`（含 13 实操复盘…
| Agent 系统设计模板 | P0 | 📐 | `system-design.md`
| Agent 可观测 | P2 | 📐 讲义已展开（2026-10-11…
| 沙箱与凭据·可复现 | P0 | 📐 讲义已展开（2…
| 长期记忆 | P2 | 📐 讲义已展开（2026-10-11） |
| durable execution | P1 | 📐 | `durable-execution.md`(`du…
| 评测工程化 | P0 | 📐 | `evaluation.md` | 设计 LLM
| MCP 协议 + 供应链安全 | P1 | 📐 | `mcp.md` | 讲…
| API 实操 + 多模型路由 | P1 | 📐 | `api-engineerin…
| 数据飞轮 | P1 | 📐 | `data-flywheel.md` | 把 FinHot
| 模型基础 | P2 | 📐 讲义已展开（2026-10-11） |
| 框架生态 | P2 | 📐 讲义已展开（2026-10-11） |
| 多智能体编排 | P0 | 📐 讲义已展开（2026-10-1…
$ grep -n "stage: 'P" site/src/data/course-structure.ts   # 逐条 stage 行号见 F3 表格
```
  并且 `knowledge-map.md:76` 的依赖图小节标题直接叫「**依赖图（按 handoff 优先级）**」，图内节点标签也写成 `SANDBOX["📐 沙箱与凭据 · P0"]`（`:88`）——即 `P0` 这一个字形在同一页面（`/map` 渲染 knowledge-map.md，含图）里既是优先级、又被 `/learn/` 当作阶段。
- **影响**：目标读者会拿 `P0` 当"先学什么"的强信号；`沙箱与凭据 P0` 与课程卡 `P1` 并列出现时，读者要么以为其中一处过期，要么按 P0 跳到第 6 门之后的内容（而 sandbox 在站点序列里是第 6 门，其 `prereqs` 只要 harness-from-scratch，跳读代价不大——真正的误读发生在「模型基础 P2」被当成"P3 之前就能学"，而它实际是 `llm-timeline` 单前置的独立支线，见 F11）。
- **建议方向**：knowledge-map 的 `优先级` 列改名为「岗位权重（非阶段、非阅读序）」并显式写"阶段的 P0–P4 见学习路线页"，或直接删列——两套同形标签并存本身就是认知负荷源。
- **置信度**：高（两处原文 + 9 门逐条对照）。

### pedagogy-F4 ｜ severity: high ｜ 归属: 内容
- **对象**：`site/src/data/course-structure.ts:85`、`notes/model-basics.md:14`、`site/src/pages/nav.astro:21`、`site/src/pages/learn.astro:282`、`notes/knowledge-map.md:12`
- **原文引文**：`course-structure.ts:85`「`stage: 'P0',`」（llm-timeline 条目，位于数组首位）→ 渲染进 `/learn/` 的 **P0 段第一张卡**（`learn.astro:113-121` 按 `stage` 分段）；
  `model-basics.md:14`「**课程依赖（prereqs）**：`llm-timeline`（横向导航页，**位于 P0 之前**）」；
  `nav.astro:21`「LLM 发展史与演进是贯穿全站的**横向知识**（**位于 P0 之前**）——」；
  `learn.astro:282`「**横向知识**：LLM 发展史与演进、行业调研等**不挂在任一阶段上**，见 学习导航 与 知识地图」；
  `knowledge-map.md:12`「`interview-bank` / `llm-timeline` / `industry-2026` / `details/` 为横向资产，**不计入门数**」——但 `knowledge-map.md:13` 的「课程页 17」= 19 − 2 又确实把 llm-timeline 算进那 17。
- **现象**：同一个 `llm-timeline` 有**四种互相排斥的定位**，且全都活着、都在学习者会打开的页面上：(a) `stage: 'P0'` + 数组首位 → "P0 第一课"；(b) 「位于 P0 之前」×2（笔记与 nav 页）；(c) 「不挂在任一阶段上」（/learn 页尾口径块，而同一页的 P0 段正渲染着它）；(d) 「不计入门数」但又是"17 门课"之一。`industry-2026` 同理（`isHorizontal: true` 且 `stage: 'P4'`，`course-structure.ts:361-373`）。
- **证据**：
```
$ grep -n "LLM 发展史与演进" -r --include=*.md --include=*.ts --include=*.astro . | grep -v node_modules
./site/src/data/course-structure.ts:336:      '已上完 LLM 发展史与演进（上一课带入「模型是会持续换代的组件」时间轴…'
./site/src/pages/nav.astro:21:    LLM 发展史与演进是贯穿全站的<strong>横向知识</strong>（位于 P0 之前）——
./site/src/pages/learn.astro:282:        <strong>横向知识</strong>：LLM 发展史与演进、行业调研等不挂在任一阶段上，见
./notes/model-basics.md:14:- **课程依赖（prereqs）**：`llm-timeline`（横向导航页，位于 P0 之前）——…
$ grep -n "slug: 'llm-timeline'" -A3 site/src/data/course-structure.ts
83:    slug: 'llm-timeline',
84:    capstoneHook: '全域 · 背景地图（序章）',
85:    stage: 'P0',
```
- **影响**：`model-basics` 的唯一前置就指向它，读者照 model-basics 的预备知识段去"P0 之前"找一门不存在的课（/learn P0 段的第一张卡就是它），或在 `/learn/` 页尾读到"不挂阶段"而困惑自己刚才看到的是什么。这也直接污染 F14 的难度曲线（`llm-timeline` 被计入 P0，把 P0 均值从 3.5 拉到 2.8）。
- **建议方向**：二选一并全仓对齐——要么承认 llm-timeline/industry-2026 是 P0/P4 的正式课程（则删掉"不挂阶段""不计入门数"的措辞），要么把它们移出 `COURSE_STRUCTURE` 的阶段链、在 `/learn/` 单独成"横向知识"段（则 `model-basics` 的《预备知识》段改为指向横向段）。
- **置信度**：高。

### pedagogy-F5 ｜ severity: high ｜ 归属: 内容
- **对象**：`notes/details/01-context-rot.md:27`、`notes/details/04-token-economics.md:27`、`notes/details/08-single-threaded-write.md:27`（三份的「未覆盖」行），对照各自 `:22` 的「行业一手源」行与 `notes/industry-2026.md:19`、`notes/multi-agent.md:55,124,179`、`notes/system-design.md:27`
- **原文引文**：
  `details/08:22`「Cognition《Multi-Agents Working》（2026）：…零共享上下文的评审循环效果最好（**Devin Review 平均每 PR 抓 2 个 bug、58% 严重级**）。」
  `details/08:27`「- 未覆盖：没有"决策一致性"理论框架（行动携带隐式决策→并行=决策冲突）；**没有 Devin Review 的行业数字（2 个 bug/PR、58% 严重级）**；…」
  `details/04:14`「agent 约消耗 chat 4 倍、多智能体约 15 倍的 token，且 token 用量解释约 80% 的性能方差…」
  `details/04:27`「- 未覆盖：**没有 4x/15x 行业对比数字与"80% 方差"数据**；…」
  `details/01:22`「…注意力预算受 **n²** 关系约束…」 / `details/01:27`「- 未覆盖：**没有 n² 注意力关系**与"填充率 vs 召回"的行业对比数字；…」
- **现象**：`details/` 8 页的固定结构是「一句话定义 / 为什么影响走向 / 行业一手源 / 本地映射（已覆盖·未覆盖）/ 面试一句话」。**其中 3 页的「未覆盖」声明与同文件「行业一手源」段落直接矛盾**（01 的 n²、04 的 4x/15x/80%、08 的 Devin 2 bugs/58%），且 04/08 声称缺的数字在**课程正文里也在用**：`industry-2026.md:19`（Anthropic 多智能体研究系统：+90.2%、80% 方差、15 倍 token）、`multi-agent.md:55/179/364`（≈15x / 80% 方差）、`system-design.md:27`（4×/15×/80%，并注明出处 `industry-2026.md §一.2 / §四.4`）、`multi-agent.md:124`（Devin 每 PR 2 个 bug、58% 严重级）、`framework-ecosystem.md:425`（agent ≈4×、多智能体 ≈15× 见 industry-2026.md §一）。
- **证据**（我亲自跑过）：
```
$ grep -n "^- 未覆盖" notes/details/*.md
notes/details/01-context-rot.md:27:- 未覆盖：没有 n² 注意力关系与"填充率 vs 召回"的行业对比数字；课程是定性论证，Anthropic 的"最小高信号"没有转成可执行的检查清单。
notes/details/02-tool-granularity.md:27:- 未覆盖：没有"描述质量 vs 成功率"的量化基准；工具返回值的 token 成本没有实测（从零写 harness §3 只校验入参，不管出参膨胀）。
notes/details/03-error-paths.md:27:- 未覆盖：没有行业一手数字；本地恢复是"日志重建"路径，没有"session API 级冷启动"（wake+getSession）的对应物——那是产品化 SDK 的形态，本地课程未涉及。
notes/details/04-token-economics.md:27:- 未覆盖：没有 4x/15x 行业对比数字与"80% 方差"数据；课程有预算机制，但没有"用 token 账本做架构选择（更大模型 vs 更多 agent）"的行业数据支撑。
notes/details/05-hitl-security.md:27:- 未覆盖：行业"按风险维度分级"（只读/写、可逆性、财务影响）没有落进本地 policy（本地是按工具名平铺三档，不是风险矩阵）；"vault + MCP 代理代签"在 E S4 只有"代执行"的定性描述，无完整实现。
notes/details/06-observability-loop.md:27:- 未覆盖:OTel 埋点已落地(harness-demo `demo:otel:mock` 离线 mock 实测 **15 spans/1 trace**…);仍缺 getEvents() 式“位置切片重放”的 API 示例…
notes/details/07-harness-rot.md:27:- 未覆盖：没有"为尚不存在的模型设计稳定接口"（虚拟化接口）的框架；沙箱与凭据 §S6 的 pin 是"防变化"取向，与"实现可自由更换"取向相反；…
notes/details/08-single-threaded-write.md:27:- 未覆盖：没有"决策一致性"理论框架（行动携带隐式决策→并行=决策冲突）；没有 Devin Review 的行业数字（2 个 bug/PR、58% 严重级）；…
$ grep -n "15×\|15x\|4×\|80% 性能方差" notes/*.md notes/details/*.md | head
notes/framework-ecosystem.md:425:- 2026 行业上下文：Anthropic Managed Agents / token 经济学（agent ≈4×、多智能体 ≈15×）见 industry-2026.md §一；…
notes/multi-agent.md:55:3. **值不值**：≈**15x** chat token、token 解释 **80%** 性能方差 [稳定历史]——…
notes/multi-agent.md:179:**Token 经济学**：agent ≈ **4x** chat、多智能体 ≈ **15x**；token 解释 **80%** 方差 → …
notes/system-design.md:27:**面试信号**：…agent 约 4× chat token、多智能体约 15×，token 用量能解释约 80% 的性能方差（industry-2026.md §一.2 / §四.4）。
```
- **影响**：`details/` 8 页是"资深分水岭"清单，读者用它做**自我缺口盘点**（每页末尾的「未覆盖」就是给读者"这里我没有证据"的诚实标记）。3/8 的标记是错的，而且错的方向统一为"把已有的当没有"——读者会去补已经掌握的内容，并把"我缺 X"的判断建在错误底账上。这把"诚实块"从资产变成了新的不可信源（也与 `teaching-style-guide.md:81`「改写只动教学组织，不动既有事实」的纪律相悖）。
- **建议方向**：逐页复核 8 条「未覆盖」（把与「行业一手源」/课程正文重复的条目删掉，只保留真正缺的，如 01 保留"填充率 vs 召回缺检查清单"、08 保留"缺 scoped 归因视角"）；建议把「未覆盖」改名为「本课未展开的部分」并把每条锚回一个具体 file:line，使其可被校验。
- **置信度**：高（三处同文件内直接对照 + 课程正文五处旁证）。

### pedagogy-F6 ｜ severity: high ｜ 归属: 内容
- **对象**：`notes/mcp.md:151-318`（S4，含 `S4.1` :157 / `S4.2` :200 / `S4.3` :221 / `S4.4` :240）
- **原文引文**：`mcp.md:151`「## S4 Agent 安全全景（JD 热点，**必须能画图**）」；`mcp.md:200`「### S4.2 OWASP LLM Top 10（**2026 版**…面试报当前版）」；`mcp.md:221`「### S4.3 OWASP Agentic Top 10（2026…）」；`mcp.md:538`「## 练习题库（后续提问用）」
- **现象**：单节 168 行 / 9093 字符（占该课 31363 字符的 29%），内含 **24 个必须记住的具名条目**（4 类攻击面 + LLM01–LLM10 + ASI01–ASI10）、1 张 6 节点攻击链 mermaid、1 张防御分层表；本课也是全仓最长课。该节内**没有任何自检点**，全课唯一练习题库在第 538 行，距 S4 开头 387 行。
- **证据**（我亲自跑过）：
```
$ awk 'NR>=151 && NR<=318' notes/mcp.md | wc -l -m
    168    9093
$ awk 'NR>=151 && NR<=318' notes/mcp.md | grep -c '^- \|^[0-9]\+\. \|^| [0-9]'
9
$ node /tmp/load.mjs   # 脚本原文见本报告 §3
notes/mcp.md	31363	270	78	5	11	12	8896	S4 Agent 安全全景（JD 热点，必须能画图）
```
（`grep -c` 的 9 是列表项计数，24 个具名条目来自逐行阅读该区间：S4.1 攻击面表 4 行 `mcp.md:163-166`、S4.2 LLM Top 10 表 10 行 `mcp.md:206-215`、S4.3 Agentic Top 10 表 10 行 `mcp.md:227-236`——共 24 行具名条目，4+10+10=24。）
- **影响**：这是"单节新概念密度"的最坏点：24 个编号条目按**外部标准**（OWASP 清单）命名，读者记忆负担与推导负担脱钩（无推导可依），而该节前没有任何"分批自检"。对以"面试报得出当前版清单"为目标的读者，本节是必须过的关，但没有中途检查点意味着"读完了但没记住"无法被及时发现。
- **建议方向**：把 S4 拆成两节（S4 攻击机制 + S4' 双清单对照），并在 S4.1/S4.2/S4.3 每节末尾各放 2-3 题自检（复用 `mcp.md:538` 题库里的对应题号，做**就地**引用而不是集中到文末）。
- **置信度**：高（字符/行数/条目均为实测）。

### pedagogy-F7 ｜ severity: high ｜ 归属: 内容
- **对象**：13 张练习题库表（`notes/api-engineering.md:305`、`data-flywheel.md:383`、`durable-execution.md:413`、`evaluation.md:475`、`framework-ecosystem.md:397`、`harness-from-scratch.md:222`、`long-term-memory.md:463`、`mcp.md:538`、`model-basics.md:358`、`multi-agent.md:419`、`observability.md:325`、`sandbox.md:502`、`system-design.md:382`）+ `notes/agent-harness.md:380`
- **原文引文**：`sandbox.md:504-506`「`| # | 题目 | 考察 |` / `| 1 | 权限门、沙箱、提示词三层各给一个"单独存在必被绕"的攻击链 | S1 |`」；`system-design.md:382`「## 练习题库（后续提问用）」
- **现象**：205 题中 **176 题**只有「题目 + 考察（小节号）」两列，**没有答案、没有 rubric、没有判定标准**；另有 `agent-harness` §13 的 8 题（`:384-391`，仅第 1 题标「✅ 已答对」）同样无答案。全仓带答案的只有 `model-basics` S7 的 16 题（`:222`，答案内嵌）与 `rag` 的 5 道确认题（`:317-339`，每题一段答案）——**21/205 ≈ 10%**。`evaluation`/`data-flywheel`/`mcp`/`multi-agent` 等课的"面试官追问"节给了应对思路，但那不是练习的判定。
- **证据**（我亲自跑过）：
```
$ python3 - <<'EOF'
import glob,re
for f in sorted(glob.glob('notes/*.md')):
    t=open(f,encoding='utf-8').read().split('\n')
    for i,l in enumerate(t):
        if re.match(r'^## .*(练习题库|确认题)', l):
            for j in range(i+1,min(i+8,len(t))):
                if t[j].startswith('|'):
                    print(f"{f}:{i+1}  '{l.strip()[:38]}'  -> header: {t[j].strip()[:70]}"); break
            else:
                print(f"{f}:{i+1}  '{l.strip()[:38]}'  -> (no table)")
EOF
notes/api-engineering.md:305  '## 练习题库（后续提问用）'  -> header: | # | 题目 | 考察 |
notes/data-flywheel.md:383  '## 练习题库（后续提问用）'  -> header: | # | 题目 | 考察 |
notes/durable-execution.md:413  '## 练习题库（后续提问用）'  -> header: | # | 题目 | 考察 |
notes/evaluation.md:475  '## 练习题库（后续提问用）'  -> header: | # | 题目 | 考察 |
notes/framework-ecosystem.md:397  '## 练习题库（后续提问用）'  -> header: | # | 题目 | 考察 |
notes/harness-from-scratch.md:222  '## 练习题库（后续提问用）'  -> header: | # | 题目 | 考察 |
notes/long-term-memory.md:463  '## 练习题库（后续提问用）'  -> header: | # | 题目 | 考察 |
notes/mcp.md:538  '## 练习题库（后续提问用）'  -> header: | # | 题目 | 考察 |
notes/model-basics.md:358  '## 练习题库（后续提问用）'  -> header: | # | 题目 | 考察 |
notes/multi-agent.md:419  '## 练习题库（后续提问用）'  -> header: | # | 题目 | 考察 |
notes/observability.md:325  '## 练习题库（后续提问用）'  -> header: | # | 题目 | 考察 |
notes/rag.md:317  '## S1 五道确认题（课后自测）'  -> (no table)
notes/sandbox.md:502  '## 练习题库（后续提问用）'  -> header: | # | 题目 | 考察 |
notes/system-design.md:382  '## 练习题库（后续提问用）'  -> header: | # | 题目 | 考察 |
```
  13 张表**没有任何一张**包含"参考答案/判定/合格线"列。
- **影响**：直接回答本任务第 4 问——目标读者是"备考"，最需要的闭环是"我答得够不够好"。现在的结构只支持"我做完了"，不支持"我做对了"；`knowledge-map.md:17` 用 205 这个数字对外宣称题库规模，但能自检的只有 21 题。对标 `rag.md:319` 的写法（"先合上讲义自己讲一遍，再对照标准答案；答到'能讲清为什么'即通过"）——**同一仓库里存在一个可自检的正例，只是没有推广**。
- **建议方向**：给每道题至少补一条"合格线"（可自检的要点清单，不必写满分答案，照 `rag.md:317-339` 的粒度）；优先级按考试频率（`sandbox` 16 题、`mcp` 14 题先做）；把「考察」列升级为可点击的节锚点（现在只是 `S3+S4` 这样的文本）。
- **置信度**：高（表头与计数均为机器提取）。

### pedagogy-F8 ｜ severity: medium ｜ 归属: 内容
- **对象**：`notes/process/teaching-style-guide.md:3,8,12,16,17,88` ↔ `notes/harness-from-scratch.md`、`notes/rag.md`、`notes/agent-harness.md`、`notes/system-design.md`，对照 `notes/knowledge-map.md:55-56`（✅）
- **原文引文**：`teaching-style-guide.md:8`「按「由浅入深」组织，顺序固定，**缺一不可**：」；`:12`「② 预备知识段 → 课程之外的技能门槛」；`:16`「⑥ 失败模式/陷阱 → 每节一个「最常见的错」+ 面试追问」；`:88`「- [ ] 八段骨架齐全，`③为什么` 在 `④机制` 之前；」；`:3`「本文是「课程笔记 → 教学型正文」的统一规范，供 **P1–P4** 逐课深度终稿沿用（当前从 sandbox / mcp 起步）」；
  `knowledge-map.md:55`「`| 从零写 harness | P0 | ✅ | …`」、`:56`「`| RAG 与检索 | P0 | ✅ | …`」。
- **现象**：指南宣称八段骨架"缺一不可"，但**唯一两门被标 `✅`（已完成）的课恰恰是缺段最多的**：
  - `harness-from-scratch.md`：无「预备知识」段（14 个 h2 里没有）、无「失败模式/陷阱」段（`grep -c 常见错误`=0、`失败模式`=0）、题库只有 8 题且编号体系为 `①-⑩`；
  - `rag.md`：无「预备知识」段、无「失败模式」段（`常见错误`=0、`失败模式`=1）、无题库表（仅 5 道确认题）；
  - `agent-harness.md`：无「预备知识」段、无「失败模式/面试追问」段（只有「第十一节 常见误区对照表」）、题库 8 题无答案；
  - `system-design.md`：无「预备知识」段（用 `:4` 的「> 前置：」单行代替，`grep -c 预备知识`=0）。
  其余 11 门 P1–P4 课全部有「预备知识」段。
- **证据**（我亲自跑过）：
```
$ for f in notes/*.md; do printf "%-30s 失败模式=%s 常见错误=%s 面试官追问=%s 预备知识=%s\n" "$f" "$(grep -c '失败模式' $f)" "$(grep -c '常见错误' $f)" "$(grep -c '面试官追问' $f)" "$(grep -c '预备知识' $f)"; done
notes/agent-harness.md         失败模式=1 常见错误=0 面试官追问=0 预备知识=0
notes/harness-from-scratch.md  失败模式=0 常见错误=0 面试官追问=0 预备知识=0
notes/rag.md                   失败模式=1 常见错误=0 面试官追问=0 预备知识=0
notes/system-design.md         失败模式=1 常见错误=0 面试官追问=4 预备知识=0
notes/sandbox.md               失败模式=7 常见错误=2 面试官追问=6 预备知识=1
notes/mcp.md                   失败模式=7 常见错误=1 面试官追问=6 预备知识=1
（其余 7 门 P1–P4 均 失败模式≥2 / 面试官追问≥1 / 预备知识=1）
$ grep -c '^## ' notes/harness-from-scratch.md   # 14 个 h2，无「预备知识」
```
- **影响**：读者从 `knowledge-map.md` 的课程总表学到的信号是"✅ = 已完成、📐 = 讲义已展开待演练"，自然推论"✅ 那两门最完整"；实际上它们是**唯一没按教学规范写过的两门**（且 `harness-from-scratch` 是整条主线的第一门动手课——见 F10）。机制性根因是 `teaching-style-guide.md:3` 自述范围只覆盖 P1–P4，P0 定稿在指南之前，指南未回溯。
- **建议方向**：要么给 P0 五课补「预备知识/失败模式」两段（`agent-harness`/`rag`/`system-design` 各补一段即可，量小），要么把 `✅` 的语义在课程总表里写清（`✅` = 已开课/已实操，不含教学规范完成度），二者都不做则至少不要让 `✅` 与规范完成度反向相关。
- **置信度**：高（grep 计数 + 标题清单）。

### pedagogy-F9 ｜ severity: medium ｜ 归属: 内容
- **对象**：`notes/knowledge-map.md:26`（命名规则③）↔ `notes/rag.md:12,280,317`、`notes/harness-from-scratch.md`（`①-⑩`）、`notes/agent-harness.md`（`第 N 节`）、`notes/llm-timeline.md`、`notes/industry-2026.md`、`notes/interview-bank.md`
- **原文引文**：`knowledge-map.md:26`「③ 节号引用写作 `§Sn`（如 `沙箱与凭据 §S2`）。」；`knowledge-map.md:137`「| 评测与验证 | RAG 与检索 **§⑨**、评测工程化、数据飞轮 | …」；`rag.md:12`「### ① 语义是几何」、`rag.md:280`「## 13 · 实操复盘：从零写一个最小 RAG…」、`rag.md:317`「## S1 五道确认题（课后自测）」
- **现象**：命名规则③规定节号一律写 `§Sn`，但实际只有 11 门课用 `S<n>`；`harness-from-scratch` 用 `①-⑩`、`agent-harness` 用「第 N 节」（13 处）、`llm-timeline`/`industry-2026`/`interview-bank` 无编号；**`rag.md` 一门之内并存三套编号**（`①-⑫` / `13 ·` / `S1`），其中 `S1 五道确认题` 的 `S1` 指"第一组确认题"而与本课正文的 `S` 编号体系无关。跨课引用因此混用：`knowledge-map.md:137` 写 `RAG 与检索 §⑨`（规则③禁止的写法），而 `system-design.md:442` 又写 `RAG 与检索 §⑪`。
- **证据**（我亲自跑过）：
```
$ for f in notes/*.md; do s=$(grep -c '^## S[0-9]' $f); c=$(grep -c '^## [①②③④⑤⑥⑦⑧⑨⑩⑪⑫]' $f); j=$(grep -c '^# 第.*节' $f); echo "$(printf '%-30s' $f) S<n>=$s circle=$c 第N节=$j"; done
notes/agent-harness.md         S<n>=0 circle=0 第N节=13
notes/harness-from-scratch.md  S<n>=0 circle=10 第N节=0
notes/rag.md                   S<n>=1 circle=10 第N节=0
notes/llm-timeline.md          S<n>=0 circle=0 第N节=0
notes/industry-2026.md         S<n>=0 circle=0 第N节=0
notes/interview-bank.md        S<n>=0 circle=0 第N节=0
（api-engineering/data-flywheel/durable-execution/evaluation/framework-ecosystem/long-term-memory/mcp/model-basics/multi-agent/observability/sandbox/system-design 均 S<n>=8~11）
$ grep -n '^## ' notes/rag.md | sed -n '10,15p'
280:## 13 · 实操复盘：从零写一个最小 RAG（2026-10-10 深夜 / 10-11 凌晨）
317:## S1 五道确认题（课后自测）
```
- **影响**：题目的「考察」列（F7）与「来源与锚点」节都用 `§` 引用小节。读者拿到 `S3.5 + S8.2` 这样的指针去 `sandbox.md` 能对上，但拿到 `§⑨` 去 `rag.md` 会先看到 `⑨ RAG 评测`；更麻烦的是 `rag` 的 `S1` ——按规则③读作"小节 S1"，实际是"确认题第 1 组"。对新手这是纯粹的检索摩擦，且随课程增多而放大。
- **建议方向**：给 `harness-from-scratch`/`agent-harness`/`rag` 三课补一层 `S<n>` 别名（或在 `knowledge-map.md` 加一张"各课节号体系对照表"），并把 `rag.md:317` 的 `S1` 改成不冲突的写法（如「确认题 A 组」）；规则③要么执行到底，要么改成"以各课实际节号为准，跨课引用必须带课程名"。
- **置信度**：高。

### pedagogy-F10 ｜ severity: medium ｜ 归属: 内容
- **对象**：`site/src/data/course-structure.ts:37`、`site/src/pages/learn.astro:116`、`site/src/data/course-structure.ts:112`、`site/src/data/course-structure.ts:110`、`site/src/pages/learn.astro:205`
- **原文引文**：`course-structure.ts:37`「`P0: '0 经验可入手 · 从零写 harness 起步（序章 + 动手）',`」→ 渲染于 `/learn/` P0 段标题（`learn.astro:116`）；
  同页 P0 第二张卡的 `prerequisiteNote`（`course-structure.ts:112`）「0 经验可入手：会 **Python 基础（函数/异常/文件 IO）** ＋ 跑终端命令即可，不要求懂模型原理（**demo 用 npm/tsx**，白板版纯标准库）」；
  `course-structure.ts:110`「判定 clone 能跑 = `cd harness-demo && npx tsx src/test-compact.ts` 复现压缩 1378→426 tokens」。
- **现象**："0 经验"在同一个页面上是两件事：P0 段标题承诺"0 经验可入手"，而 P0 第二张课卡的启动门槛要求 **Python 基础 + 终端 + 两个工具链（Python 标准库白板版 / Node+tsx demo 版）**，完成判据又要求跑 `npx tsx`。真正 0 编程经验的人无法开始；有编程经验但不熟 Node 生态的人也会卡在判据上（而 `harness-from-scratch` 恰恰是"整条主线的第一块砖"，`course-structure.ts:110` 自述）。
- **证据**：
```
$ sed -n '34,42p' site/src/data/course-structure.ts
export const STAGE_DESC: Record<Stage, string> = {
  P0: '0 经验可入手 · 从零写 harness 起步（序章 + 动手）',
$ sed -n '110,113p' site/src/data/course-structure.ts
      '交付 harness-mvp（独占）：最小 agent loop（权限门/崩溃恢复/压缩，5 种运行模式）。判定 clone 能跑 = cd harness-demo && npx tsx src/test-compact.ts 复现压缩 1378→426 tokens；它是主干第一块砖，agent-harness/sandbox/durable-execution/multi-agent 复用/扩展这份代码',
    prerequisiteNote:
      '0 经验可入手：会 Python 基础（函数/异常/文件 IO）＋ 跑终端命令即可，不要求懂模型原理（demo 用 npm/tsx，白板版纯标准库）',
$ ls harness-demo/src/ | tr '\n' ' '
agent.ts context.ts demo.ts llm.ts otel-assert.ts otel-mock-scenario.ts otel-mock.ts otel.ts policy.ts session.ts test-compact.ts tools.ts types.ts
$ grep -n "if (summarized" harness-demo/src/test-compact.ts
48:if (summarized !== 3 || after.length !== 5 || afterTokens >= before) {
```
- **影响**：P0 段的承诺决定了"谁有资格从第 1 课开始"。承诺与门槛不符会造成两类流失：0 编程经验者被首课劝退；有 Python 无 Node 经验者卡在判据（判据要求的 `npx tsx` 与"会 Python 基础"不是同一技能）。**另一层**：`course-structure.ts:110` 把"1378→426 tokens"写进 clone 判据，而 `test-compact.ts:48` 的断言只检查 `summarized===3 && after.length===5 && afterTokens<before`——**源码里没有 1378/426 这两个数**（`grep -rn "1378" --include=*.ts harness-demo/` 无命中；全仓命中只在 `notes/harness-from-scratch.md:196`、`notes/process/site-refactor-plan.md:338`、`notes/details/01-context-rot.md:26`、`course-structure.ts:110` 与历史 team 归档中），即判据里那个数是**打印值而非断言值**。这不违反 `teaching-style-guide.md:77` 的字面（它禁的是会漂移的 hash/digest），但把"未断言的量"写成"clone 判据"会让读者在 `estimateTokens` 改动后拿到绿色 `✅ 压缩逻辑验证通过` 却对不上 426。属**判据可自检性**的下沉问题。
- **建议方向**：`STAGE_DESC.P0` 改为「有编程基础可入手（会 Python 基础 + 终端；不要求 AI/模型经验）」，或在 P0 段前加一张"两条路径"卡（纯阅读序章 → 动手课需要什么）；把 clone 判据里的 1378→426 改成"打印出的 tokens 比压缩前小、摘要 3 条、messages=5"（即与 `test-compact.ts:48` 的断言逐项对齐）。
- **置信度**：高（原文 + 断言源码核对）；"0 经验读者会流失"这一后果属推论，标注为**中**（无读者数据可验）。

### pedagogy-F11 ｜ severity: medium ｜ 归属: 内容
- **对象**：`site/src/data/course-structure.ts:334`、`site/src/data/course-structure.ts:259,329`、`notes/model-basics.md:129`、`notes/api-engineering.md:210`
- **原文引文**：`course-structure.ts:334`（model-basics 的 `practicalOutput` 末尾）「…（全离线零 key、纯计算脚本不调模型、确定性）；**`api-engineering` 复用它的「成本 = token×单价×步数」理论底座**，data-flywheel 复用它的「微调时机/取舍」意识。」；
  `course-structure.ts:259`「`prereqs: ['harness-from-scratch'],`」（api-engineering）；`course-structure.ts:329`「`prereqs: ['llm-timeline'],`」（model-basics）；
  `model-basics.md:129`「## S4 推理成本模型（**API 与多模型路由的理论底座**）」；`api-engineering.md:210`「④ 蒸馏/小模型微调（数据飞轮/ 模型基础，最后手段）」
- **现象**：存在一条**与阅读序反向的依赖声明**：api-engineering 是第 11 门（order 10），model-basics 是第 15 门（order 14，`course-structure.ts:325`），但 model-basics 的 `practicalOutput` 把 api-engineering 列为它的下游复用它"成本理论底座"，model-basics.md:129 的节标题也自称 api-engineering 的"理论底座"——而 api-engineering 的 `prereqs` 里没有 model-basics（`:259` 只有 harness-from-scratch），照 `/learn/` 路线读的读者在第 11 门读 S6 成本工程时，第 15 门的理论底座还没出现。`api-engineering.md:229` 自己给了一个成本公式（含 `$tokens_i$` / `$price_i$`），所以不是内容缺失，而是**"谁是谁的前置"在两处说法相反**（课程卡说 api 先、model-basics 的复用关系说 model-basics 是地基）。
- **证据**：
```
$ sed -n '334,336p' site/src/data/course-structure.ts
      '交付 model-basics-mvp（独占：model-basics-demo/，KV cache / 推理成本数值走查脚本，规格 notes/process/model-basics-mvp-spec.md）。判定 clone 能跑 = cd model-basics-demo && npm run demo 复现「输入上下文长/输出预算/单价 → KV 命中 savings / 首 token 时间估算 / 总成本拆分」断言 + 末尾 `✅ model-basics 验收通过`（全离线零 key、纯计算脚本不调模型、确定性）；api-engineering 复用它的「成本 = token×单价×步数」理论底座，data-flywheel 复用它的「微调时机/取舍」意识',
$ grep -n "slug: '\|stage: '\|prereqs: \[" site/src/data/course-structure.ts | sed -n '21,30p'
253:    slug: 'api-engineering',   255:    stage: 'P2',   259:    prereqs: ['harness-from-scratch'],
323:    slug: 'model-basics',      325:    stage: 'P3',   329:    prereqs: ['llm-timeline'],
$ node /tmp/xref.mjs   # api-engineering 后向引用
### api-engineering (order 10)  后向引用(引用更晚的课)=6  前向=30
   BACK -> model-basics (order 14) at lines 210
```
- **影响**：`prereqs` 是读者唯一会去执行的"先学什么"信号，而 `practicalOutput` 里的"复用关系"是给他"学完能干嘛"的预期。两者对同一对课给出相反次序，会让读者在 api-engineering S6 处怀疑自己漏课（`api-engineering.md:210` 的措辞"数据飞轮/ 模型基础，最后手段"用斜杠与空格混排，也读不出是"后续课"还是"另一个来源"）。
- **建议方向**：二选一——把 model-basics 提到 api-engineering 之前（涉及阶段重排，代价大），或把 `:334` 的措辞改成"本课为后续『API 与多模型路由』S6 的成本口径提供**复核口径**（该课会先自给公式，本课负责把它落到 KV cache/单价上）"，并把 `api-engineering.md:210` 的指针写明"后续课：模型基础 §S4"。
- **置信度**：高（行号 + 序位为机器提取）；"读者会因此漏课"为推论，标**中**。

### pedagogy-F12 ｜ severity: low ｜ 归属: 内容
- **对象**：`notes/model-basics.md:222`（标题）↔ `notes/model-basics.md:228-252`（16 条答案）
- **原文引文**：`model-basics.md:222`「## S7 八股速查表（**16 题 × 3-5 行标准答案**）」；`model-basics.md:228`「1. **BPE 算法？** 字符级起步，反复合并语料中频率最高的相邻 token 对，直到词表达标。为什么用：OOV 可控（生词拆成已知子词）、词表从指数级压到几万-几十万、子词带来泛化。」
- **现象**：标题承诺每题"3-5 行标准答案"，实际每条都是**单行**（83–173 字符），靠分号堆叠多个要点；行数与承诺不符。
- **证据**（我亲自跑过）：
```
$ awk 'NR>=222 && NR<=266 && /^[0-9]+\. /{print NR": "length($0)" chars"}' notes/model-basics.md
228: 95 chars
229: 103 chars
230: 90 chars
234: 147 chars
235: 141 chars
236: 173 chars
240: 145 chars
244: 92 chars
245: 91 chars
246: 83 chars
247: 108 chars
248: 106 chars
252: 133 chars
253: 139 chars
254: 153 chars
258: 162 chars
$ awk 'NR>=222 && NR<=266 && /^[0-9]+\. /{n++} END{print n}' notes/model-basics.md
16
```
  16 题在第 228–258 行，**每题恰好占 1 行**（无一条满 3 行）。
- **影响**：轻。这张表定位是"面试前 30 分钟过一遍"，单行反而便于快速扫；问题是"3-5 行"这个字数承诺让读者预期可背诵的完整段落，实际拿到的是要点串。属"标题自述与内容不符"，与 F5 同类但后果小得多。**唯一不影响正确性的偏差**。
- **建议方向**：标题改为"16 题 × 一段要点"，或把其中 5 题（RL 谱系 S7-8~S7-12）展开成 3 行的可背诵版。
- **置信度**：高（实测字符数）。

### pedagogy-F13 ｜ severity: low ｜ 归属: 内容（旁证：产物属作品文档带）
- **对象**：`notes/process/capstone-style-guide.md:56-92`（§5 固定七段）↔ `my-agent/README.md:1-63`（M0 段），及 `my-agent/exercises/m*/` 目录
- **原文引文**：`capstone-style-guide.md:56`「## 5. 每 milestone 的 README 结构（**固定七段**）」，其七段为「1 定位 / 2 要加的能力 / 3 必修课 / 4 练习 / 5 TODO 清单 / 6 断言命令 / 7 参考答案指针」；`:101`「- [ ] README 七段齐全，TODO 清单与断言编号一一对应；」
  实际 `my-agent/README.md:5-50`（M0 段）：`1. 定位 / 2. 要加的能力（TODO 清单）/ 3. 必修课 / 4. 怎么动手 / 5. 断言命令（clone 判据）/ 6. 确定性红线 / 7. 参考答案指针`
- **现象**：「TODO 清单」被并进第 2 节（未独立成段）、第 4 段名替换为「怎么动手」、多出指南七段之外的第 6 段「确定性红线」；且 5 个 milestone 的 README **全部合并在 `my-agent/README.md` 一个文件里**（M0 段 :1-61、M1 段 :63-123、M2 段 :125-189、M3 段 :191-253、M4 段 :255-...），`my-agent/exercises/m0..m4/` 目录下**没有 README.md**（`ls my-agent/exercises/m*/README.md` → `No such file or directory`）。指南 §5 的标题写法是「# M1 · multi-tool-session…」暗示每 milestone 一份 README；§4 又说"参考 demo 哪段 + `../solution/`"。
- **证据**：
```
$ ls my-agent/exercises/m*/README.md
ls: cannot access 'my-agent/exercises/m*/README.md': No such file or directory
$ grep -n '^## [0-9]' my-agent/README.md | head -8
5:## 1. 定位
9:## 2. 要加的能力（TODO 清单）
21:## 3. 必修课
25:## 4. 怎么动手
35:## 5. 断言命令（clone 判据）
46:## 6. 确定性红线
50:## 7. 参考答案指针
$ ls my-agent/exercises/m1/
solution  starter
```
- **影响**：轻。七段内容基本在（可读性不差，甚至"确定性红线"是有价值的补充），偏离属"结构不逐字对齐"；但清单项 `capstone-style-guide.md:101` 若被当作验收闸门，就会得出"未通过"的结论，而实际交付是可用的——**指南与交付物的粒度不一致**本身会消耗复核注意力。这是本报告唯一触到"作品文档带"的 finding（`my-agent/` 主要归下一代/另一角度），我按旁证登记。
- **建议方向**：指南 §5 增加"允许把 §5 TODO 清单并入 §2、允许追加『确定性红线』段"，或让交付物补上独立 §5；二者对齐一处即可。
- **置信度**：高（文件系统实测）。

### pedagogy-F14 ｜ severity: low ｜ 归属: 内容
- **对象**：`site/src/data/course-structure.ts:20-42`（`STAGES`/`STAGE_LABELS`/`STAGE_DESC`）+ 本报告 §2 的难度表
- **原文引文**：`course-structure.ts:23`「/** 阶段中文名（§1 编排总原则：基础篇/工具与安全/生产可靠性/体系与数据/收口与前沿）。 */」；`:36-42` 的 `STAGE_DESC`；`learn.astro:67`「P0–P4 五阶段 × 17 门课，**线性阅读序**」
- **现象**：阶段命名承诺"由浅入深"的走向，但按 §2 的量化评分，阶段均值 P0=2.8 / P1=4.5 / P2=4.0 / P3=4.7 / P4=3.0：**最大跃迁出现在 P0→P1（+1.7）**，P1→P2 反而降 0.5，P3→P4 降 1.7；P0 段内部从 1（llm-timeline）到 4（system-design、agent-harness）跨 3 档，P4 段内 4（framework-ecosystem）与 2（industry-2026）并列。
- **证据**：见 §2 的逐课表与 `node /tmp/load.mjs` / `python3` CJK 计数输出（`notes/*.md` 的 chars/CJK/加粗数），阶段计数 `{"P0":5,"P1":4,"P2":3,"P3":3,"P4":2}` 由 `node /tmp/dep.mjs` 实测（与 `course-structure.ts:386` 注释一致）。
- **影响**：轻-中。读者若把 P0 理解成"最简单的五门"，会在第 2-5 门遇到 4 分区（`agent-harness` 8 层架构、`system-design` 综合设计），而这两门正是"求职关键课"——提前的难度冲击比渐进的难度更容易造成放弃。但阶段划分同时承担"主题分组"职能（P1 = 工具与安全），并非纯难度轴，**因此我把它评为 low**，不建议为难度重排阶段。
- **建议方向**：在 `/learn/` 的阶段标题旁标注该段的难度区间（如「P0 · 基础篇（难度 1-4）」），或在 `STAGE_DESC` 里写明"P0 后两门（Harness 架构 / 系统设计）难度明显上升"，把预期管理前移。
- **置信度**：中（难度分为我的加权判断，量本身可复现，权重不可复现）。

---

## 转交下一轮（显示形式）

> 只登记，不展开。

1. `learn.astro:147` 课程卡直接展示内部 slug `{course.mvpSlug}`（`harness-mvp`/`obs-mvp`/`memory-mvp`），而实际可 clone 的目录叫 `harness-demo`/`memory-redteam`——文案与目录名的对齐决策属显示形式/命名层。
2. `/learn/` 阶段段头没有难度指示（F14 建议的"难度区间"落在渲染层）。
3. `mcp.md` S4 的双 10 项清单表在窄屏需要折叠/分段（认知负荷的呈现手段）。
4. 练习题库「考察」列目前是纯文本 `S3+S4`，可做成指向小节的锚点（F7 建议的落地形式）。
5. `/map` 的 mermaid 依赖图节点无难度/状态标注（图例只有 done/doing/todo/hub 四种色）。
6. `notes/details/` 8 页在站点的入口（`details/index.astro` 与 `details/[slug].astro`）与课程页的关系表达——本轮只看正文，未看呈现。

## 本轮未覆盖 / 未验证

1. **未实跑任何 demo**。为避免改动仓库（`harness-demo` 的 demo 会写 trajectories/workspace 产物），`npm run demo*`、`npx tsx src/test-compact.ts`、`node test.mjs` 一律未执行。因此 `course-structure.ts:110` 的「1378→426」只做了**源码级核对**（`test-compact.ts:42-48` 打印但不断言这两个数），未验证实跑值是否为 1378/426——**未验证**。
2. **难度评分是加权判断，不是实测**。量（字数/CJK/加粗数/节数/题数/前置数）全部实测可复现，但"1-5 分"的权重不可复现；F14 的相关结论因此标 **中** 置信度。
3. **17 门课程正文未逐行通读**。覆盖率约为：标题 100%、每课「预备知识」段 100%、每课首尾 100%、指定区间逐行（报告头列出）——中段机制说明（绝大多数 S 节的正文）为**抽样阅读**，可能漏掉中段的类比/反例/自检点。因此 F7（练习不可自检）的结论只对"练习题库表"成立，不排除正文内嵌了自检问句。
4. **`notes/process/` 其余 18 篇计划文档只做 grep 级抽读**（`site-refactor-plan.md`、`capstone-*.md` 等）。它们是 F1/F2/F3 的潜在"第三方说法"，可能还有更多与站点不一致的顺序/阶段表述——**未系统比对**。
5. **站点未构建、未渲染验证**。`astro build`（约 8 分钟且本机不稳定，见 `knowledge-map.md:18` 自述）未跑；`learn.astro`/`nav.astro`/`map.astro` 的结论基于源文件阅读，未验证实际渲染结果（例如 `learn.astro:113-121` 是否真的把 `isHorizontal: true` 的 llm-timeline 渲染在 P0 段内——**源码层面成立，渲染层未验证**）。
6. **外部事实未联网复核**。OWASP 2026 两清单的条目名、"Devin Review 每 PR 2 bug/58% 严重级"、Anthropic 的 4×/15×/80.2%/+90.2% 等数字均**按原文引用**，未做一手源核对（属技术准确性/证据角度，非本角度）。
7. **`my-agent/` 与各 demo 的 README 未通读**（作品文档带）。F13 只做了结构与文件存在性核对。
8. **未验证 `details/` 8 页在站点的呈现**（`details/[slug].astro` 是否渲染「未覆盖」行），F5 的读者影响按正文推定。
