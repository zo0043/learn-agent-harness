/**
 * 课程元数据（手写映射）。
 * 基线：notes/knowledge-map.md 的课程总表（15 域 + 阶段 + 状态），
 * 并行新增：multi-agent=多智能体编排/P0、llm-timeline=LLM 时间线/P0、industry-2026=行业前线调研/—。
 * 一句话导读：各课 notes/*.md 开头提炼（这节讲什么 + 对应哪个作品/节）。
 * 面试视角 interviewAngle：面试官为什么看这课（一句话 ≤25 字，从 notes/interview-bank.md 考点分布提炼）。
 * 相关面试题 relatedQuestions：题库真实题目（题号 no + 题目原文 text + 题库页内锚点 anchor）。
 *
 * /c/[slug] 路由由 notes/*.md 的 glob 驱动(新增文件自动出现);
 * 这里没列的新 slug 用 DEFAULT_META 兜底。
 * 例外:whiteboard 是「从零写 harness」的白板作品(无独立 notes 文件),课程卡链向 /works/#whiteboard。
 */
export interface RelatedQuestion {
  /** 题号（interview-bank.md 内编号：§3.x-Qn 项目深挖 / §4-#n 交叉快答 / §8-Qn 行为面） */
  no: string;
  /** 题目原文（notes/interview-bank.md 真实题目，禁止编造） */
  text: string;
  /** 题库页内锚点：题目所在小节 heading 的 id（interview.astro 渲染产物，2026-10-11 build 实测） */
  anchor: string;
}

export interface CourseMeta {
  slug: string;
  /** 知识域名 */
  domain: string;
  phase: 'P0' | 'P1' | 'P2' | '—';
  status: '✅ 完成' | '🔄 进行中' | '🔄 讲义已展开' | '⏳ 规划中';
  /** 一句话导读（占位，可改） */
  intro: string;
  /** 面试视角：面试官为什么看这课（一句话 ≤25 字，提炼自 interview-bank.md 考点分布） */
  interviewAngle: string;
  /** 相关面试题：3-5 条，全部来自 notes/interview-bank.md 真实题目（题号+锚点） */
  relatedQuestions: RelatedQuestion[];
}

/** 题库页（/interview/）小节 heading id —— Astro 由 interview-bank.md 标题自动生成（已实测） */
const BANK = {
  s31: '31-finhot-幽灵事故权限沙箱事故响应最稀缺故事',
  s32: '32-finhot-labeler评测状态机延迟奖励',
  s33: '33-backfill-1645-行长任务失败治理',
  s34: '34-harness-demo白板能力的运行版',
  s35: '35-rag-demo检索评测实操',
  s4: '4-交叉快速问答跨课考察知识是否成网',
  s8: '五道标准题骨架红线',
} as const;

export const COURSES: CourseMeta[] = [
  // ── P0 ──────────────────────────────────────────────
  {
    slug: 'harness-from-scratch', domain: '从零写 harness', phase: 'P0', status: '✅ 完成',
    intro: '10 节逐节长出最小 agent loop（权限门 / 崩溃恢复 / 压缩），作品 harness-demo + 白板版',
    interviewAngle: 'loop/权限/恢复三大主考点的实现级素材',
    relatedQuestions: [
      { no: '§3.4-Q1', text: '四种运行模式各证明了什么？crash 模式怎么注入的？', anchor: BANK.s34 },
      { no: '§3.4-Q3', text: '你的 policy 如果默认 allow，幽灵事故会怎么重演？', anchor: BANK.s34 },
      { no: '§3.4-Q4', text: '压缩策略里 head/tail 怎么定？约束丢了会怎样？(模型基础:位置效应)', anchor: BANK.s34 },
      { no: '§4-#3', text: '上下文压缩、prompt caching、长期记忆注入，三者在“进 system 的 token”上怎么抢预算？', anchor: BANK.s4 },
      { no: '§4-#9', text: '一个 coding agent 的 pass@1 从 0.4→0.55，列出你按 ROI 排序的五个优化动作（不换基座模型）', anchor: BANK.s4 },
    ],
  },
  {
    slug: 'rag', domain: 'RAG 与检索', phase: 'P0', status: '✅ 完成',
    intro: '12 节 + §13 实操复盘：pipeline 每层为什么存在；rag-demo golden set recall@3=1.00',
    interviewAngle: '检索每层为何存在 + 评测实操证据（recall@3=1.00）',
    relatedQuestions: [
      { no: '§3.5-Q1', text: '为什么用 hash embedding 不用语义模型？（代理 503 + 可复现/可打印的教学价值——要敢承认局限）', anchor: BANK.s35 },
      { no: '§3.5-Q2', text: 'recall@5 唯一漏题错在哪？（paraphrase 探针=词法路极限）', anchor: BANK.s35 },
      { no: '§3.5-Q3', text: 'BM25 的 IDF 定价怎么解释“什么”这种高频词？（rag.md §13 发现 1）', anchor: BANK.s35 },
      { no: '§3.5-Q4', text: '换真 embedding 模型要改几行？为什么架构不用动？（Embedder 接口）', anchor: BANK.s35 },
    ],
  },
  {
    slug: 'system-design', domain: '系统设计', phase: 'P0', status: '🔄 讲义已展开',
    intro: '30 分钟结构化答“设计一个 X agent”：七步骨架 / 五范式 / 三演练，收口「从零写 harness / RAG 与检索」作品',
    interviewAngle: '“设计一个 coding agent”主场题的 30 分钟模板',
    relatedQuestions: [
      { no: '§4-#9', text: '一个 coding agent 的 pass@1 从 0.4→0.55，列出你按 ROI 排序的五个优化动作（不换基座模型）', anchor: BANK.s4 },
      { no: '§4-#10', text: '“能用 workflow 不用 agent”——FinHot 的流水线是 agent 还是 workflow？哪里必须有模型自决？', anchor: BANK.s4 },
      { no: '§4-#8', text: '多 agent 编排里，子 agent 的权限、凭据、trace 分别怎么管？', anchor: BANK.s4 },
    ],
  },
  {
    slug: 'sandbox', domain: '沙箱与凭据', phase: 'P0', status: '🔄 讲义已展开',
    intro: '权限门 ≠ 沙箱（两道独立的门）；S2 四通道 policy 已实现，sandbox-demo 幽灵重放逐字节可复现',
    interviewAngle: '幽灵事故=最稀缺故事：权限门≠沙箱两道门',
    relatedQuestions: [
      { no: '§3.1-Q1', text: '事故完整时间线？18:00-18:25 之间你做了什么？', anchor: BANK.s31 },
      { no: '§3.1-Q2', text: '为什么并行会话能碰到生产？目录/容器/命名空间各缺了什么边界？', anchor: BANK.s31 },
      { no: '§3.1-Q3', text: '“动容器前查创建时间”这条规则防什么、不防什么？（事前 vs 事后）', anchor: BANK.s31 },
      { no: '§3.1-Q4', text: '如果重做一次，架构上怎么让这类事故不可能发生？（沙箱池/compose 项目隔离/worktree——沙箱与凭据 §S1/S3)', anchor: BANK.s31 },
      { no: '§3.1-Q5', text: '事故里数据面受影响吗？你怎么验证的？', anchor: BANK.s31 },
    ],
  },
  {
    slug: 'evaluation', domain: '评测工程化', phase: 'P0', status: '🔄 讲义已展开',
    intro: '评测从 recall@k 升级成系统：judge 校准 / golden set 版本化 / CI 门禁，FinHot labeler + rag-demo 双证据链',
    interviewAngle: '评测=最强项：judge+golden set+CI 门禁',
    relatedQuestions: [
      { no: '§3.2-Q3', text: '方向准确率 vs baseline，baseline 怎么定义的？n≈60 够吗？', anchor: BANK.s32 },
      { no: '§3.2-Q5', text: '这个系统和 SWE-bench 式评测的本质区别？（延迟奖励/真实世界结果）', anchor: BANK.s32 },
      { no: '§4-#6', text: '为什么“评测集污染”和“记忆投毒”是同一类问题？防御机制能复用吗？', anchor: BANK.s4 },
      { no: '§4-#9', text: '一个 coding agent 的 pass@1 从 0.4→0.55，列出你按 ROI 排序的五个优化动作（不换基座模型）', anchor: BANK.s4 },
    ],
  },
  {
    slug: 'multi-agent', domain: '多智能体编排', phase: 'P0', status: '🔄 讲义已展开',
    intro: '何时多智能体（读多路、写单线程）；S7 练习是给 harness-demo 设计子代理方案',
    interviewAngle: '“读多路、写单线程”判断 + 子代理设计练习',
    relatedQuestions: [
      { no: '§4-#8', text: '多 agent 编排里，子 agent 的权限、凭据、trace 分别怎么管？', anchor: BANK.s4 },
      { no: '§4-#10', text: '“能用 workflow 不用 agent”——FinHot 的流水线是 agent 还是 workflow？哪里必须有模型自决？', anchor: BANK.s4 },
      { no: '§8-Q4', text: '为什么做 agent 开发 / 为什么这个方向?(bank 骨架三件套:从零写 harness + FinHot + 沙箱与凭据)', anchor: BANK.s8 },
    ],
  },
  {
    slug: 'llm-timeline', domain: 'LLM 时间线', phase: 'P0', status: '✅ 完成',
    intro: '12 节点模型演化时间线（★5 个面试谈资），答“为什么当年这么设计 / 下一步往哪走”',
    interviewAngle: '“为什么当年这么设计/下一步往哪走”的谈资',
    relatedQuestions: [
      { no: '§4-#7', text: '模型下架（你遇到过）那天，harness/API 层/评测层各有什么反应？', anchor: BANK.s4 },
      { no: '§3.4-Q2', text: '19:33 的代理 400 事故你当时怎么定位的？（provider 是组件）', anchor: BANK.s34 },
      { no: '§4-#9', text: '一个 coding agent 的 pass@1 从 0.4→0.55，列出你按 ROI 排序的五个优化动作（不换基座模型）', anchor: BANK.s4 },
    ],
  },
  {
    slug: 'agent-harness', domain: 'Harness 架构', phase: 'P0', status: '✅ 完成',
    intro: '13 节完整教程：harness 分层与每层解决什么问题，FinHot 幽灵事故是现成案例',
    interviewAngle: 'harness 分层与每层职责，幽灵事故现成案例',
    relatedQuestions: [
      { no: '§3.4-Q1', text: '四种运行模式各证明了什么？crash 模式怎么注入的？', anchor: BANK.s34 },
      { no: '§3.4-Q3', text: '你的 policy 如果默认 allow，幽灵事故会怎么重演？', anchor: BANK.s34 },
      { no: '§4-#1', text: '提示注入攻击一个接了 MCP 的 coding agent，画出从 payload 进入到最后动作被（没）拦住的完整路径，标出每层防线', anchor: BANK.s4 },
    ],
  },
  {
    slug: 'whiteboard', domain: '从零写 harness', phase: 'P0', status: '✅ 完成',
    intro: '~150 行纯标准库 Python 白板版 agent，与 harness-demo 1:1 对应，20 分钟白板题骨架',
    interviewAngle: '20 分钟白板题：边写边讲三个关键设计',
    relatedQuestions: [
      { no: '§3.4-Q1', text: '四种运行模式各证明了什么？crash 模式怎么注入的？', anchor: BANK.s34 },
      { no: '§3.4-Q3', text: '你的 policy 如果默认 allow，幽灵事故会怎么重演？', anchor: BANK.s34 },
      { no: '§3.4-Q4', text: '压缩策略里 head/tail 怎么定？约束丢了会怎样？(模型基础:位置效应)', anchor: BANK.s34 },
    ],
  },
  // ── P1 ──────────────────────────────────────────────
  {
    slug: 'durable-execution', domain: 'durable execution', phase: 'P1', status: '🔄 讲义已展开',
    intro: '长任务不丢不重：journal / checkpoint / 幂等；教学素材是 FinHot backfill 1645 行断点续跑',
    interviewAngle: '长任务不丢不重：backfill 断点续跑素材',
    relatedQuestions: [
      { no: '§3.3-Q2', text: '断点续跑怎么实现的？幂等键是什么？', anchor: BANK.s33 },
      { no: '§3.3-Q3', text: '为什么不在失败时原地重试到成功？（退避/全局预算/次日续跑）', anchor: BANK.s33 },
      { no: '§3.3-Q4', text: '如果 1645→164500，先改什么？（并发/队列/限流——API 与多模型路由)', anchor: BANK.s33 },
      { no: '§3.2-Q4', text: 'labeler 跑挂了怎么办？(幂等/upsert——durable execution)', anchor: BANK.s32 },
    ],
  },
  {
    slug: 'mcp', domain: 'MCP 与供应链安全', phase: 'P1', status: '🔄 讲义已展开',
    intro: 'MCP 架构 / 原语 / 认证 + Agent 安全全景；mcp-demo 投毒 + 四层防御实操已实现',
    interviewAngle: 'MCP 供应链投毒题素材：四层防御实操',
    relatedQuestions: [
      { no: '§4-#1', text: '提示注入攻击一个接了 MCP 的 coding agent，画出从 payload 进入到最后动作被（没）拦住的完整路径，标出每层防线', anchor: BANK.s4 },
      { no: '§4-#6', text: '为什么“评测集污染”和“记忆投毒”是同一类问题？防御机制能复用吗？', anchor: BANK.s4 },
      { no: '§4-#8', text: '多 agent 编排里，子 agent 的权限、凭据、trace 分别怎么管？（凭据面）', anchor: BANK.s4 },
    ],
  },
  {
    slug: 'api-engineering', domain: 'API 与多模型路由', phase: 'P1', status: '🔄 讲义已展开',
    intro: '流式 / 结构化输出 / caching / 重试分类 / 路由 / 成本六模块，素材是代理 400 + 模型轮换实录',
    interviewAngle: '代理 400 + 模型轮换实录：重试分类/路由',
    relatedQuestions: [
      { no: '§4-#3', text: '上下文压缩、prompt caching、长期记忆注入，三者在“进 system 的 token”上怎么抢预算？', anchor: BANK.s4 },
      { no: '§4-#4', text: 'FinHot 6 次调用里哪次最适合蒸馏成小模型？数据从哪来？怎么评？', anchor: BANK.s4 },
      { no: '§4-#7', text: '模型下架（你遇到过）那天，harness/API 层/评测层各有什么反应？', anchor: BANK.s4 },
      { no: '§3.4-Q2', text: '19:33 的代理 400 事故你当时怎么定位的？（provider 是组件）', anchor: BANK.s34 },
      { no: '§3.3-Q4', text: '如果 1645→164500，先改什么？（并发/队列/限流——API 与多模型路由)', anchor: BANK.s33 },
    ],
  },
  {
    slug: 'data-flywheel', domain: '数据飞轮', phase: 'P1', status: '🔄 讲义已展开',
    intro: '把 FinHot 台账 1830 行 + labeler 讲成“跑过一轮真实生产飞轮”的故事（含三轮真实评测指标：precision 0.256→0.304→0.272）',
    interviewAngle: '飞轮=最强项：FinHot 台账+labeler 全故事',
    relatedQuestions: [
      { no: '§3.2-Q1', text: '为什么 T+5 而不是 T+1？（金融数据的噪声/交易日历）', anchor: BANK.s32 },
      { no: '§3.2-Q2', text: '858 条 skipped 各是什么？分母怎么写才不会骗人？', anchor: BANK.s32 },
      { no: '§3.2-Q3', text: '方向准确率 vs baseline，baseline 怎么定义的？n≈60 够吗？', anchor: BANK.s32 },
      { no: '§4-#5', text: '轨迹数据仓、golden set、情景记忆，同一份轨迹的三种用途，存储要求各差在哪？', anchor: BANK.s4 },
    ],
  },
  // ── P2 ──────────────────────────────────────────────
  {
    slug: 'observability', domain: '可观测', phase: 'P2', status: '🔄 讲义已展开',
    intro: 'agent tracing 模型 + OTel GenAI 属性 + 成本归因；S2 埋点已在 harness-demo 实操（demo:otel）',
    interviewAngle: '“agent tracing+成本归因”考点，demo:otel 实操',
    relatedQuestions: [
      { no: '§4-#2', text: '你的 agent 跑一夜：可观测记什么？崩了怎么恢复？第二天怎么证明它没变笨？', anchor: BANK.s4 },
      { no: '§3.3-Q1', text: '失败率 ~10%，失败分几类？各自处置？（超时/订阅异常/…）', anchor: BANK.s33 },
      { no: '§8-Q2', text: '你的一次失败（bank 骨架：litellm 15× 劣化，API 与多模型路由 §S5 事故实录——监控缺位本身就是失败）', anchor: BANK.s8 },
    ],
  },
  {
    slug: 'long-term-memory', domain: '长期记忆', phase: 'P2', status: '🔄 讲义已展开',
    intro: '四类记忆：写 / 读 / 遗忘 / 安全；活锚点是日常在用的 pi Magic Context',
    interviewAngle: '记忆写/读/遗忘/安全四类 + 记忆投毒题',
    relatedQuestions: [
      { no: '§4-#3', text: '上下文压缩、prompt caching、长期记忆注入，三者在“进 system 的 token”上怎么抢预算？', anchor: BANK.s4 },
      { no: '§4-#5', text: '轨迹数据仓、golden set、情景记忆，同一份轨迹的三种用途，存储要求各差在哪？', anchor: BANK.s4 },
      { no: '§4-#6', text: '为什么“评测集污染”和“记忆投毒”是同一类问题？防御机制能复用吗？', anchor: BANK.s4 },
    ],
  },
  {
    slug: 'model-basics', domain: '模型基础', phase: 'P2', status: '🔄 讲义已展开',
    intro: 'KV cache / 推理成本 / 微调意识 + S7 八股速查 16 题——够用不深挖',
    interviewAngle: '八股速查 16 题：KV cache/推理成本/微调',
    relatedQuestions: [
      { no: '§3.4-Q4', text: '压缩策略里 head/tail 怎么定？约束丢了会怎样？(模型基础:位置效应)', anchor: BANK.s34 },
      { no: '§4-#4', text: 'FinHot 6 次调用里哪次最适合蒸馏成小模型？数据从哪来？怎么评？', anchor: BANK.s4 },
      { no: '§4-#7', text: '模型下架（你遇到过）那天，harness/API 层/评测层各有什么反应？', anchor: BANK.s4 },
    ],
  },
  {
    slug: 'framework-ecosystem', domain: '框架生态', phase: 'P2', status: '🔄 讲义已展开',
    intro: '框架给你什么 / 藏什么；framework-demo 四能力实操已跑通，实测 allowedTools 抢跑坑',
    interviewAngle: '“框架给你什么/藏什么”：allowedTools 抢跑实证',
    relatedQuestions: [
      { no: '§4-#8', text: '多 agent 编排里，子 agent 的权限、凭据、trace 分别怎么管？', anchor: BANK.s4 },
      { no: '§8-Q4', text: '为什么做 agent 开发 / 为什么这个方向？（bank 骨架引 框架生态 §S2：亲手建过才知道框架藏了什么）', anchor: BANK.s8 },
      { no: '§4-#9', text: '一个 coding agent 的 pass@1 从 0.4→0.55，列出你按 ROI 排序的五个优化动作（不换基座模型）', anchor: BANK.s4 },
    ],
  },
  // ── 未分阶段（横向素材）──────────────────────────────
  {
    slug: 'industry-2026', domain: '行业前线调研', phase: '—', status: '✅ 完成',
    intro: '两轮外部调研，核心论断均实抓官方一手源；分水岭 8 细节是“资深分水岭”板块底稿',
    interviewAngle: '8 分水岭细节一手源实证，资深判断题素材',
    relatedQuestions: [
      { no: '§8-Q5', text: '为什么想来我们公司？（bank：面试前作业——对对方产品/工程博客的具体观察 + 资产共鸣点）', anchor: BANK.s8 },
      { no: '§4-#7', text: '模型下架（你遇到过）那天，harness/API 层/评测层各有什么反应？', anchor: BANK.s4 },
      { no: '§4-#1', text: '提示注入攻击一个接了 MCP 的 coding agent，画出从 payload 进入到最后动作被（没）拦住的完整路径，标出每层防线', anchor: BANK.s4 },
    ],
  },
];

const COURSE_MAP = new Map(COURSES.map((c) => [c.slug, c]));

export const DEFAULT_META: CourseMeta = {
  slug: '',
  domain: '未分类',
  phase: '—',
  status: '⏳ 规划中',
  intro: '课程元数据待补',
  interviewAngle: '',
  relatedQuestions: [],
};

export function courseMeta(slug: string): CourseMeta {
  return COURSE_MAP.get(slug) ?? { ...DEFAULT_META, slug };
}

/** /c/[slug] 路由排除项：总地图与题库各有独立页面（/map、/interview） */
export const EXCLUDED_FROM_COURSE_ROUTE = new Set(['knowledge-map', 'interview-bank']);
