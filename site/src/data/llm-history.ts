/**
 * LLM 发展史与演进（横向知识导航页数据源，重建）。
 *
 * 唯一内容源：notes/site-refactor-plan.md §7（alex 审计后的权威事实表——已逐条 web 核实，
 * 附 URL + 日期；臆测项「Agent 2.0 / Self-improvement / Multi-agent collaboration /
 * 2026 Next-gen」已全部删除，不进入数据层）。
 *
 * 旧草稿字段（year/model/key/summary）与本文件 §8.2 规范字段的对应关系：
 *   year  → date 的年份部分（本文件另存 year 便捷字段，值派生于 date）
 *   model → name ；  key / summary → significance
 * 旧草稿的错误（LLaMA 标 2022、「Open source」表述、GPT-4 与 function calling 绑错年份、
 * 「Agent 2.0」臆造标签）均已按 §7.1 修正；本文件不沿用旧字段名与旧事实。
 *
 * t5 教学化：在权威事实之上加了两个教学字段（不是新增事实主张，只是面向 0 经验学员的讲解）：
 *   · LlmHistoryItem.summary       —— 该节点「为什么重要 / 解决了什么问题」（2–4 句）
 *   · LlmHistoryItem.connectsTo    ——    学员「现在就能用」的课程落点（背景 → 主线衔接）
 *   · LlmEvolutionEra.transition   ——    代际「首尾承接」（上一代卡在哪 → 怎么突破 → 新能力）
 *   · LlmEvolutionEra.connectsTo   ——    该代「现在就能用」的课程落点
 */

export type HistoryVerified = 'exact' | 'month';

/**
 * LLM 发展历史时间线（§7.3 权威事实列表，10 节点）。
 * `verified: 'exact'` = 精确日期已核实（Wikipedia/arXiv 给出具体日）；
 * `verified: 'month'` = 月份级事实成立、精确日待复核（不得标成已核实，§8.2）。
 */
export interface LlmHistoryItem {
  /** 规范日期：YYYY-MM（§8.2） */
  date: string;
  /** 日历年份（由 date 派生，供导航按年分组；不另设真源） */
  year: number;
  /** 模型 / 论文 / API 名 */
  name: string;
  /** 发布方 */
  org: string;
  /** 关键意义（对 agent 开发），§7.3「关键意义」列逐字（一句话） */
  significance: string;
  /** 【t5】教学展开：为什么重要 / 解决了什么问题（2–4 句，面向 0 经验学员） */
  summary: string;
  /** 【t5】课程挂钩：学员「现在就能用」的落点（关联 P0–P4 哪门课） */
  connectsTo: string;
  /** 权威出处（1+ URL），§7.3「出处」列 */
  source: string[];
  /** 核查精度（§8.2：月份级待复核须标 month 并附 note，不得标成已核实） */
  verified: HistoryVerified;
  /** verified='month' 或需澄清的说明（如「并非 open source」） */
  note?: string;
}

export const LLM_HISTORY: LlmHistoryItem[] = [
  {
    date: '2017-06',
    year: 2017,
    name: 'Transformer',
    org: 'Google',
    significance: '现代 LLM 架构起点：自注意力 + 多头 + 位置编码，可并行训练',
    summary:
      '在 Transformer 之前，序列建模主流是 RNN/LSTM——一个 token 接一个 token 顺序算，又慢又难并行，长句还容易忘。Transformer 用「自注意力」让每个位置一次性看到整句里的所有其他位置，配合多头注意与位置编码，既能并行训练、又能捕捉远距离依赖。今天所有主流 LLM——BERT、GPT、LLaMA、DeepSeek——都是 Transformer 变体，你写的每一个 agent 都跑在这个架构上。',
    connectsTo:
      '现在就能用：这条架构认知是 P0《从零写 harness》与 P3《模型基础》的地基——不需要会推公式，但要知道「模型为什么能并行、为什么有上下文窗口」。',
    source: [
      'https://arxiv.org/abs/1706.03762',
      'https://en.wikipedia.org/wiki/Attention_Is_All_You_Need',
    ],
    verified: 'exact',
    note: '论文「Attention Is All You Need」（Vaswani 等 8 人），NeurIPS 2017；Wikipedia 载 presented June 12, 2017',
  },
  {
    date: '2018-10',
    year: 2018,
    name: 'BERT',
    org: 'Google',
    significance: '「预训练 + 微调」范式确立',
    summary:
      'BERT 解决的是「没有标好的数据怎么先学会语言」：用掩码语言模型（挖空猜词）在大语料上预训练，再用少量标注数据微调，一个底座就能打遍各种 NLP 任务。它确立了「预训练 + 微调」的标准范式，是检索、分类这类任务的经典底座。',
    connectsTo:
      '现在就能用：P0《RAG 与检索》里「语义检索 vs 词法检索」的取舍、P3《长期记忆》的 embedding 思路，都源自这条预训练路线。',
    source: [
      'https://arxiv.org/abs/1810.04805',
      'https://en.wikipedia.org/wiki/BERT_(language_model)',
    ],
    verified: 'exact',
    note: 'encoder-only，MLM + NSP 预训练；Wikipedia 载 release Oct 31, 2018',
  },
  {
    date: '2020-05',
    year: 2020,
    name: 'GPT-3',
    org: 'OpenAI',
    significance: '上下文学习(in-context learning)/few-shot 涌现',
    summary:
      'GPT-3 把参数量推到 1750 亿，出现了一个此前没有的能力：不用微调，只在提示里给几个例子（few-shot），模型就自己学会了任务——这就是「上下文学习」。它直接塑造了今天的 prompt 工程与 agent 设计：能力不靠改权重，而靠改上下文。',
    connectsTo:
      '现在就能用：这是 P0《从零写 harness》里 token 压缩、P2《API 与多模型路由》里 prompt caching 的直接动机——上下文有多贵、多能打，从这一年开始。',
    source: [
      'https://arxiv.org/abs/2005.14165',
      'https://en.wikipedia.org/wiki/GPT-3',
    ],
    verified: 'exact',
    note: '175B，「Language Models are Few-Shot Learners」；Wikipedia 载 publication May 29, 2020',
  },
  {
    date: '2023-02',
    year: 2023,
    name: 'LLaMA',
    org: 'Meta AI',
    significance: '开源权重竞赛起点；规模缩小也能打',
    summary:
      'GPT-3 是闭源黑盒，普通开发者既拿不到权重也扛不住成本。LLaMA 证明「小模型 + 更多数据」也能打（Chinchilla 缩放律），并把权重带到社区（起初只限研究者申请、随后被泄流），引爆了开源权重竞赛。注意它并非 open source（OSI 不认可）；真正开放可商用是 LLaMA 2。',
    connectsTo:
      '现在就能用：P3《模型基础》选开源基座、P0 各课的本地 demo 之所以能离线跑，都受益于这条开源路线。',
    source: ['https://en.wikipedia.org/wiki/LLaMA'],
    verified: 'exact',
    note: 'announced Feb 24, 2023；首发权重仅 case-by-case 给研究者、2023-03-03 泄流——并非 open source（OSI 不认可）；真正开放可商用权重是 LLaMA 2（2023-07）',
  },
  {
    date: '2023-03',
    year: 2023,
    name: 'GPT-4',
    org: 'OpenAI',
    significance: 'agent 能力起点（含 32k 上下文版本）',
    summary:
      'GPT-4 是多模态模型，能力第一次接近「能干活」的水准——agent 的概念从此开始成立：给它 32k 上下文、让它多步操作，才有了后面 harness 要管的那一整套问题（权限、恢复、压缩）。',
    connectsTo:
      '现在就能用：P0《Harness 架构》与《从零写 harness》要解决的 loop / 权限 / 恢复，正是 GPT-4 把 agent 推到生产后暴露出来的问题。',
    source: ['https://en.wikipedia.org/wiki/GPT-4'],
    verified: 'exact',
    note: 'release March 14, 2023；多模态。tool/function calling 是 2023-06 独立上线，并非 GPT-4 发布自带（§7.1 已拆开）',
  },
  {
    date: '2023-06',
    year: 2023,
    name: 'OpenAI function calling API',
    org: 'OpenAI',
    significance: '工具调用开始标准化，一切 agent 的协议地基',
    summary:
      '在 function calling 之前，工具调用是各家自定的野路子协议。OpenAI 把它标准化成「模型返回一个结构化函数名 + 参数 JSON」，让「模型意图」与「代码执行」第一次有了稳定接口——这是所有 agent 工具调用的协议地基。',
    connectsTo:
      '现在就能用：P0《从零写 harness》的工具协议、P1《MCP 与供应链安全》的 MCP，都站在这个 base 上。（备注：精确日待复核，月份级已核实）',
    source: ['https://openai.com/index/function-calling-and-other-api-updates/'],
    verified: 'month',
    note: '官方 blog「Function calling and other API updates」抓取 403，月份级公开史实（精确日待复核）；本仓 notes/llm-timeline.md 标 2023-06，一致',
  },
  {
    date: '2023-07',
    year: 2023,
    name: 'LLaMA 2',
    org: 'Meta + Microsoft',
    significance: '真正「开放权重」节点（OSI 仍不认可称 open source）',
    summary:
      'LLaMA 2 是 Meta 与微软合推、真正开放可商用权重的版本（7/13/70B），把「能不能拿去商用」这道门槛拆了，开源生态从此可复现、可私有化部署。',
    connectsTo:
      '现在就能用：想在本地/私有环境跑基座做 P0–P4 实验时，LLaMA 2 之后的开源权重是现实选项（措辞上 OSI 仍不认可称「open source」，要准）。',
    source: ['https://en.wikipedia.org/wiki/LLaMA'],
    verified: 'exact',
    note: '7/13/70B；July 18, 2023，开放可商用权重',
  },
  {
    date: '2024-09',
    year: 2024,
    name: 'o1-preview / o1-mini',
    org: 'OpenAI',
    significance: '推理模型开启：训练期大规模 RL + 推理期 chain-of-thought',
    summary:
      'o1 系列开创了「推理模型」：训练期用大规模强化学习教模型在回答前先展开链式思考（chain-of-thought），推理期花更多算力换更高的正确率。这让「难而慢」的推理题第一次可工程化，也改变了 agent 设计——从「多写几次调用重试」转向「少而深的一次深度推理」。',
    connectsTo:
      '现在就能用：P1《评测工程化》的 judge、P2《API 与多模型路由》的路由（难题走推理模型、易题走便宜模型）都源于这条代际。',
    source: ['https://en.wikipedia.org/wiki/OpenAI_o1'],
    verified: 'exact',
    note: 'o1-preview / o1-mini Sept 12, 2024',
  },
  {
    date: '2024-12',
    year: 2024,
    name: 'o1（正式版）/ DeepSeek-V3',
    org: 'OpenAI / DeepSeek',
    significance: 'o1 正式开放；DeepSeek-V3（MoE 671B/37B 激活）开源权重追平闭源',
    summary:
      'o1 正式开放；同月 DeepSeek-V3 用 MoE（671B 总参、每次只激活 37B）把开源权重做到接近闭源水平，训练成本据报告远低于同级——「开源追平闭源」从这里开始成立。',
    connectsTo:
      '现在就能用：P3《模型基础》的 MoE / KV cache 讲解、P2《API 与多模型路由》的模型轮换，都要面对这样的开源选项。',
    source: ['https://en.wikipedia.org/wiki/OpenAI_o1', 'https://arxiv.org/abs/2412.19437'],
    verified: 'exact',
    note: 'full o1 Dec 5, 2024；DeepSeek-V3 arXiv 2412.19437 submitted Dec 27, 2024',
  },
  {
    date: '2025-01',
    year: 2025,
    name: 'DeepSeek-R1',
    org: 'DeepSeek',
    significance: '纯 RL 激发推理能力，开源权重推理模型，Nature 收录',
    summary:
      'DeepSeek-R1 是第一代用纯强化学习激励出推理能力的开源权重模型，并把推理过程（chain-of-thought）开放出来，被 Nature 收录。它把「推理模型」从 OpenAI 一家扩展到开源，成本与透明度双双下探。',
    connectsTo:
      '现在就能用：P4《行业前线调研》的 agent 代际判断、P2 路由中的开源推理基座选择，都以 R1 为关键锚点。',
    source: ['https://arxiv.org/abs/2501.12948'],
    verified: 'exact',
    note: 'arXiv 2501.12948 submitted Jan 22, 2025；Nature 645:633–638, 2025',
  },
];

/**
 * LLM 演进过程（代际）（§7.4 权威代际列表，5 代）。
 * 与草稿相比：去掉「Open source」（表述错）与第四代里的「Reasoning」（时间错配，移到第五代），
 * 删除「Agent 2.0 / Self-improvement / Multi-agent collaboration」臆测项。
 */
export interface LlmEvolutionEra {
  /** 代：一代…五代（§7.4「代」列） */
  era: string;
  /** 时期（§7.4「时期」列） */
  period: string;
  /** 代表架构/模型（§7.4「代表架构/模型」列） */
  architecture: string;
  /** 解锁能力（有出处的主张），§7.4「解锁能力」列拆成条目 */
  features: string[];
  /** 意义/教学定位一句话（由 §7.4 解锁能力 + §6.1 教学定位合成，不新增事实主张） */
  significance: string;
  /** 【t5】首尾承接：上一代卡在哪 → 这一代怎么突破 → 给 agent 的新能力 */
  transition: string;
  /** 【t5】课程挂钩：学员「现在就能用」的落点（关联 P0–P4 哪门课） */
  connectsTo: string;
}

export const LLM_EVOLUTION: LlmEvolutionEra[] = [
  {
    era: '一代',
    period: '2017–2018',
    architecture: 'Transformer → BERT/GPT',
    features: ['自注意力', '多头', '位置编码', '预训练+微调范式'],
    significance: '自注意力/多头/位置编码奠定可并行训练的现代 LLM 架构，同时确立「预训练 + 微调」范式',
    transition:
      '这是起点，没有上一代。序列任务此前被 RNN 的顺序计算卡住——慢、难并行、长句会忘；这一代用自注意力换来并行与长程建模，BERT/GPT 又把任务拆成「预训练 + 微调」。给 agent 打下的底子：一切模型都是 Transformer，能力能被大规模预训练出来。',
    connectsTo: '现在就能用：这是 P0 所有动手课的前提认知——模型为什么能读上下文、为什么有窗口。',
  },
  {
    era: '二代',
    period: '2019–2020',
    architecture: 'GPT-2 → GPT-3',
    features: ['无监督预训练 scaling', '上下文学习（in-context learning）', 'few-shot 涌现'],
    significance: '无监督预训练随规模扩展，解锁上下文学习与 few-shot（免微调）能力',
    transition:
      '一代卡在：每做新任务都要重新微调、重新备标注数据。这一代靠无监督预训练 scaling 突破——GPT-3 只靠提示里的几个例子（few-shot）就解锁任务、免微调。给 agent 的新能力：能力存在于上下文而非权重，prompt 工程与上下文管理从此登场。',
    connectsTo: '现在就能用：P0《从零写 harness》的 token 压缩、P2《API 与多模型路由》的 caching，都在跟「上下文=能力+成本」这条原理打交道。',
  },
  {
    era: '三代',
    period: '2021–2022',
    architecture: 'Codex / ChatGPT(InstructGPT)',
    features: ['代码生成', '指令遵循（instruction following）', 'RLHF 对齐'],
    significance: '代码生成（Codex）与指令遵循 + RLHF 对齐，把模型推向可用 agent 工具',
    transition:
      '二代卡在：模型能生成，但不一定听人话、不一定按指令办事。这一代用指令微调 + RLHF（人类反馈强化学习）让模型对齐人类意图，Codex 又把生成能力落到代码。给 agent 的新能力：模型从「能说」变成「能照着做」，成为可执行的工具而非聊天玩具。',
    connectsTo: '现在就能用：P0《Harness 架构》里「模型输出必须结构化、可校验」，就是这条对齐路线的延续。',
  },
  {
    era: '四代',
    period: '2023',
    architecture: 'GPT-4（多模态）/ LLaMA·LLaMA 2（开源权重）/ function calling',
    features: ['多模态', '工具调用标准化', '开源权重竞赛'],
    significance: '多模态与工具调用标准化并行推进，开源权重竞赛开启（LLaMA / LLaMA 2）',
    transition:
      '三代卡在：模型强了，但接不进真实工具与外部世界，且闭源不可私有化。这一代双线突破——GPT-4 把能力推到「能干活」、function calling 标准化工具调用，LLaMA / LLaMA 2 把权重开放给社区。给 agent 的新能力：稳定的工具协议 + 可私有化部署的基座。',
    connectsTo: '现在就能用：P0《从零写 harness》的工具协议、P1《MCP》与《沙箱》的边界，都是这一代打开的工程问题。',
  },
  {
    era: '五代',
    period: '2024–2025',
    architecture: 'o1/o3（推理）、DeepSeek-V3/R1（开源推理）、Claude 3+',
    features: ['推理模型（chain-of-thought + RL）', '开源权重追平闭源'],
    significance: '推理模型（训练期 RL + 推理期 chain-of-thought）涌现，开源权重推理模型追平闭源',
    transition:
      '四代卡在：显性推理与长链路自主要么错、要么慢。这一代靠「训练期 RL + 推理期链式思考」突破，推理模型在难题上大幅跃升；DeepSeek 又把推理能力开源、下探成本。给 agent 的新能力：从「多试几次」转向「少而深」，长时程自主 coding agent 从这一代开始跨过质量门槛。',
    connectsTo: '现在就能用：P1《评测工程化》的 judge、P2《API 与多模型路由》的难题/易题分层路由、P4《行业前线调研》的 agent 代际判断，都锚在这一代。',
  },
];