/**
 * 课程元数据（手写映射）。
 * 基线：notes/knowledge-map.md 的课程总表（15 域 + 阶段 + 状态），
 * 并行新增：multi-agent=多智能体编排/P0、llm-timeline=LLM 时间线/P0、industry-2026=行业前线调研/—。
 * 一句话导读：各课 notes/*.md 开头提炼（这节讲什么 + 对应哪个作品/节）。
 * 面试视角 interviewAngle：面试官为什么看这课（一句话 ≤25 字，从 notes/interview-bank.md 考点分布提炼）。
 * 相关面试题 relatedQuestions：题库真实题目（题号 no + 题目文本 text + 题库页锚点定位前缀 anchorPrefix，构建期解析成真实 heading id；text 默认逐字取题库原文，§8 行为面几条例外带站点补的答案要点，见 RelatedQuestion.text 注释）。
 *
 * /c/[slug] 路由由 notes/*.md 的 glob 驱动(新增文件自动出现);
 * 这里没列的新 slug 用 DEFAULT_META 兜底。
 * 例外:whiteboard 是「从零写 harness」的白板作品(无独立 notes 文件),课程卡链向 /works/#whiteboard。
 */
export interface RelatedQuestion {
  /** 题号（interview-bank.md 内编号：§3.x-Qn 项目深挖 / §4-#n 交叉快答 / §8-Qn 行为面） */
  no: string;
  /** 题目文本：默认取 notes/interview-bank.md 题目原文（禁止编造）；§8 行为面几条在原文题骨后带站点补的答案要点（括号内）——题库 §8 原文只有题骨，全文见 notes/interview-bank.md §8 */
  text: string;
  /**
   * 题库页内锚点的定位前缀：题目所在小节 heading 文本的稳定前缀（如 '3.1 FinHot 幽灵事故'）。
   * 构建期由 c/[slug].astro 用 extractToc 从 notes/interview-bank.md 解析成真实 heading id
   * （与 interview.astro 的 idOf 同机制、同 slug 算法）；解析不到即构建失败（fail-fast）。
   * 旧实现是手抄 heading id 常量，题库标题一动全部静默失效，已废弃。
   */
  anchorPrefix: string;
}

export interface CourseMeta {
  slug: string;
  /** 知识域名 */
  domain: string;
  /**
   * legacy 旧三档阶段标记：P0/P1/P2 已无读写方（唯一读方 DomainMap.astro 已迁到
   * course-structure.ts 五档 stage，t36）。当前仅 '—' 仍有语义——标记横向资产
   * （llm-timeline / industry-2026），被 DOMAIN_COUNT 过滤与 c/[slug].astro 兜底 chip
   * 消费。阶段口径唯一源 = course-structure.ts stage，勿据此字段呈现阶段定位。
   */
  phase: 'P0' | 'P1' | 'P2' | '—';
  status: '✅ 完成' | '🔄 进行中' | '🔄 讲义已展开' | '⏳ 规划中';
  /** 一句话导读（占位，可改） */
  intro: string;
  /** 面试视角：面试官为什么看这课（一句话 ≤25 字，提炼自 interview-bank.md 考点分布） */
  interviewAngle: string;
  /** 相关面试题：3-5 条，全部来自 notes/interview-bank.md 真实题目（题号+锚点） */
  relatedQuestions: RelatedQuestion[];
}

export const COURSES: CourseMeta[] = [
  // ── P0 ──────────────────────────────────────────────
  {
    slug: 'harness-from-scratch', domain: '从零写 harness', phase: 'P0', status: '✅ 完成',
    intro: '10 节逐节长出最小 agent loop（权限门 / 崩溃恢复 / 压缩），作品 harness-demo + 白板版',
    interviewAngle: 'loop/权限/恢复三大主考点的实现级素材',
    relatedQuestions: [
      { no: '§3.4-Q1', text: '五种运行模式各证明了什么？crash 模式怎么注入的？', anchorPrefix: '3.4 harness-demo' },
      { no: '§3.4-Q3', text: '你的 policy 如果默认 allow，幽灵事故会怎么重演？', anchorPrefix: '3.4 harness-demo' },
      { no: '§3.4-Q4', text: '压缩策略里 head/tail 怎么定？约束丢了会怎样？(模型基础:位置效应)', anchorPrefix: '3.4 harness-demo' },
      { no: '§4-#3', text: '上下文压缩、prompt caching、长期记忆注入，三者在“进 system 的 token”上怎么抢预算？', anchorPrefix: '4. 交叉快速问答' },
      { no: '§4-#9', text: '一个 coding agent 的 pass@1 从 0.4→0.55，列出你按 ROI 排序的五个优化动作（不换基座模型）', anchorPrefix: '4. 交叉快速问答' },
    ],
  },
  {
    slug: 'rag', domain: 'RAG 与检索', phase: 'P0', status: '✅ 完成',
    intro: '12 节 + §13 实操复盘：pipeline 每层为什么存在；rag-demo golden set recall@3=0.31（132 chunks，PASS 3/8）',
    interviewAngle: '检索每层为何存在 + 评测实操证据（recall@3=0.31，锚点式复测）',
    relatedQuestions: [
      { no: '§3.5-Q1', text: '为什么用 hash embedding 不用语义模型？（代理 503 + 可复现/可打印的教学价值——要敢承认局限）', anchorPrefix: '3.5 rag-demo' },
      { no: '§3.5-Q2', text: '10 题 golden set 里 5 题 FAIL，逐题机制归因是什么？（语料缺口 / 检索短板 / 表面形式盲区——词法路只能走表面形式重叠）', anchorPrefix: '3.5 rag-demo' },
      { no: '§3.5-Q3', text: 'BM25 的 IDF 定价怎么解释“什么”这种高频词？（rag.md §13 发现 1）', anchorPrefix: '3.5 rag-demo' },
      { no: '§3.5-Q4', text: '换真 embedding 模型要改几行？为什么架构不用动？（Embedder 接口）', anchorPrefix: '3.5 rag-demo' },
    ],
  },
  {
    slug: 'system-design', domain: '系统设计', phase: 'P0', status: '🔄 讲义已展开',
    intro: '30 分钟结构化答“设计一个 X agent”：七步骨架 / 五范式 / 三演练，收口「从零写 harness / RAG 与检索」作品',
    interviewAngle: '“设计一个 coding agent”主场题的 30 分钟模板',
    relatedQuestions: [
      { no: '§4-#9', text: '一个 coding agent 的 pass@1 从 0.4→0.55，列出你按 ROI 排序的五个优化动作（不换基座模型）', anchorPrefix: '4. 交叉快速问答' },
      { no: '§4-#10', text: '“能用 workflow 不用 agent”——FinHot 的流水线是 agent 还是 workflow？哪里必须有模型自决？', anchorPrefix: '4. 交叉快速问答' },
      { no: '§4-#8', text: '多 agent 编排里，子 agent 的权限、凭据、trace 分别怎么管？', anchorPrefix: '4. 交叉快速问答' },
    ],
  },
  {
    slug: 'sandbox', domain: '沙箱与凭据', phase: 'P0', status: '🔄 讲义已展开',
    intro: '权限门 ≠ 沙箱（两道独立的门）；S2 四通道 policy 已实现，sandbox-demo 幽灵重放逐字节可复现',
    interviewAngle: '幽灵事故=最稀缺故事：权限门≠沙箱两道门',
    relatedQuestions: [
      { no: '§3.1-Q1', text: '事故完整时间线？18:00-18:25 之间你做了什么？', anchorPrefix: '3.1 FinHot 幽灵事故' },
      { no: '§3.1-Q2', text: '为什么并行会话能碰到生产？目录/容器/命名空间各缺了什么边界？', anchorPrefix: '3.1 FinHot 幽灵事故' },
      { no: '§3.1-Q3', text: '“动容器前查创建时间”这条规则防什么、不防什么？（事前 vs 事后）', anchorPrefix: '3.1 FinHot 幽灵事故' },
      { no: '§3.1-Q4', text: '如果重做一次，架构上怎么让这类事故不可能发生？（沙箱池/compose 项目隔离/worktree——沙箱与凭据 §S1/S3)', anchorPrefix: '3.1 FinHot 幽灵事故' },
      { no: '§3.1-Q5', text: '事故里数据面受影响吗？你怎么验证的？', anchorPrefix: '3.1 FinHot 幽灵事故' },
    ],
  },
  {
    slug: 'evaluation', domain: '评测工程化', phase: 'P0', status: '🔄 讲义已展开',
    intro: '评测从 recall@k 升级成系统：judge 校准 / golden set 版本化 / CI 门禁，FinHot labeler + rag-demo 双证据链',
    interviewAngle: '评测=最强项：judge+golden set+CI 门禁',
    relatedQuestions: [
      { no: '§3.2-Q3', text: '方向准确率 vs baseline，baseline 怎么定义的？n≈60 够吗？', anchorPrefix: '3.2 FinHot labeler' },
      { no: '§3.2-Q5', text: '这个系统和 SWE-bench 式评测的本质区别？（延迟奖励/真实世界结果）', anchorPrefix: '3.2 FinHot labeler' },
      { no: '§4-#6', text: '为什么“评测集污染”和“记忆投毒”是同一类问题？防御机制能复用吗？', anchorPrefix: '4. 交叉快速问答' },
      { no: '§4-#9', text: '一个 coding agent 的 pass@1 从 0.4→0.55，列出你按 ROI 排序的五个优化动作（不换基座模型）', anchorPrefix: '4. 交叉快速问答' },
    ],
  },
  {
    slug: 'multi-agent', domain: '多智能体编排', phase: 'P0', status: '🔄 讲义已展开',
    intro: '何时多智能体（读多路、写单线程）；S7 练习是给 harness-demo 设计子代理方案',
    interviewAngle: '“读多路、写单线程”判断 + 子代理设计练习',
    relatedQuestions: [
      { no: '§4-#8', text: '多 agent 编排里，子 agent 的权限、凭据、trace 分别怎么管？', anchorPrefix: '4. 交叉快速问答' },
      { no: '§4-#10', text: '“能用 workflow 不用 agent”——FinHot 的流水线是 agent 还是 workflow？哪里必须有模型自决？', anchorPrefix: '4. 交叉快速问答' },
      { no: '§8-Q4', text: '为什么做 agent 开发 / 为什么这个方向？（三件套：从零写 harness + FinHot + 沙箱与凭据）', anchorPrefix: '五道标准题' },
    ],
  },
  {
    slug: 'llm-timeline', domain: 'LLM 时间线', phase: '—', status: '✅ 完成',
    intro: '12 节点模型演化时间线（★5 个面试谈资），答“为什么当年这么设计 / 下一步往哪走”',
    interviewAngle: '“为什么当年这么设计/下一步往哪走”的谈资',
    relatedQuestions: [
      { no: '§4-#7', text: '模型下架（你遇到过）那天，harness/API 层/评测层各有什么反应？', anchorPrefix: '4. 交叉快速问答' },
      { no: '§3.4-Q2', text: '19:33 的代理 400 事故你当时怎么定位的？（provider 是组件）', anchorPrefix: '3.4 harness-demo' },
      { no: '§4-#9', text: '一个 coding agent 的 pass@1 从 0.4→0.55，列出你按 ROI 排序的五个优化动作（不换基座模型）', anchorPrefix: '4. 交叉快速问答' },
    ],
  },
  {
    slug: 'agent-harness', domain: 'Harness 架构', phase: 'P0', status: '✅ 完成',
    intro: '15 节完整教程：harness 分层与每层解决什么问题，FinHot 幽灵事故是现成案例',
    interviewAngle: 'harness 分层与每层职责，幽灵事故现成案例',
    relatedQuestions: [
      { no: '§3.4-Q1', text: '五种运行模式各证明了什么？crash 模式怎么注入的？', anchorPrefix: '3.4 harness-demo' },
      { no: '§3.4-Q3', text: '你的 policy 如果默认 allow，幽灵事故会怎么重演？', anchorPrefix: '3.4 harness-demo' },
      { no: '§4-#1', text: '提示注入攻击一个接了 MCP 的 coding agent，画出从 payload 进入到最后动作被（没）拦住的完整路径，标出每层防线', anchorPrefix: '4. 交叉快速问答' },
    ],
  },
  {
    slug: 'whiteboard', domain: '从零写 harness（白板版）', phase: 'P0', status: '✅ 完成',
    intro: '~180 行纯标准库 Python 白板版 agent，与 harness-demo 1:1 对应，20 分钟白板题骨架',
    interviewAngle: '20 分钟白板题：边写边讲三个关键设计',
    relatedQuestions: [
      { no: '§3.4-Q1', text: '五种运行模式各证明了什么？crash 模式怎么注入的？', anchorPrefix: '3.4 harness-demo' },
      { no: '§3.4-Q3', text: '你的 policy 如果默认 allow，幽灵事故会怎么重演？', anchorPrefix: '3.4 harness-demo' },
      { no: '§3.4-Q4', text: '压缩策略里 head/tail 怎么定？约束丢了会怎样？(模型基础:位置效应)', anchorPrefix: '3.4 harness-demo' },
    ],
  },
  // ── P1 ──────────────────────────────────────────────
  {
    slug: 'durable-execution', domain: 'durable execution', phase: 'P1', status: '🔄 讲义已展开',
    intro: '长任务不丢不重：journal / checkpoint / 幂等；教学素材是 FinHot backfill 1645 行断点续跑',
    interviewAngle: '长任务不丢不重：backfill 断点续跑素材',
    relatedQuestions: [
      { no: '§3.3-Q2', text: '断点续跑怎么实现的？幂等键是什么？', anchorPrefix: '3.3 backfill' },
      { no: '§3.3-Q3', text: '为什么不在失败时原地重试到成功？（退避/全局预算/次日续跑）', anchorPrefix: '3.3 backfill' },
      { no: '§3.3-Q4', text: '如果 1645→164500，先改什么？（并发/队列/限流——API 与多模型路由)', anchorPrefix: '3.3 backfill' },
      { no: '§3.2-Q4', text: 'labeler 跑挂了怎么办？（幂等/upsert/durable execution）', anchorPrefix: '3.2 FinHot labeler' },
    ],
  },
  {
    slug: 'mcp', domain: 'MCP 与供应链安全', phase: 'P1', status: '🔄 讲义已展开',
    intro: 'MCP 架构 / 原语 / 认证 + Agent 安全全景；mcp-demo 投毒 + 四层防御实操已实现',
    interviewAngle: 'MCP 供应链投毒题素材：四层防御实操',
    relatedQuestions: [
      { no: '§4-#1', text: '提示注入攻击一个接了 MCP 的 coding agent，画出从 payload 进入到最后动作被（没）拦住的完整路径，标出每层防线', anchorPrefix: '4. 交叉快速问答' },
      { no: '§4-#6', text: '为什么“评测集污染”和“记忆投毒”是同一类问题？防御机制能复用吗？', anchorPrefix: '4. 交叉快速问答' },
      { no: '§4-#8', text: '多 agent 编排里，子 agent 的权限、凭据、trace 分别怎么管？', anchorPrefix: '4. 交叉快速问答' },
    ],
  },
  {
    slug: 'api-engineering', domain: 'API 与多模型路由', phase: 'P1', status: '🔄 讲义已展开',
    intro: '流式 / 结构化输出 / caching / 重试分类 / 路由 / 成本六模块，素材是代理 400 + 模型轮换实录',
    interviewAngle: '代理 400 + 模型轮换实录：重试分类/路由',
    relatedQuestions: [
      { no: '§4-#3', text: '上下文压缩、prompt caching、长期记忆注入，三者在“进 system 的 token”上怎么抢预算？', anchorPrefix: '4. 交叉快速问答' },
      { no: '§4-#4', text: 'FinHot 6 次调用里哪次最适合蒸馏成小模型？数据从哪来？怎么评？', anchorPrefix: '4. 交叉快速问答' },
      { no: '§4-#7', text: '模型下架（你遇到过）那天，harness/API 层/评测层各有什么反应？', anchorPrefix: '4. 交叉快速问答' },
      { no: '§3.4-Q2', text: '19:33 的代理 400 事故你当时怎么定位的？（provider 是组件）', anchorPrefix: '3.4 harness-demo' },
      { no: '§3.3-Q4', text: '如果 1645→164500，先改什么？（并发/队列/限流——API 与多模型路由)', anchorPrefix: '3.3 backfill' },
    ],
  },
  {
    slug: 'data-flywheel', domain: '数据飞轮', phase: 'P1', status: '🔄 讲义已展开',
    intro: '把 FinHot 台账 1830 行（仓外生产数字）+ labeler 讲成“跑过一轮真实生产飞轮”的故事（含三轮真实评测指标：precision 0.256→0.304→0.272）',
    interviewAngle: '飞轮=最强项：FinHot 台账+labeler 全故事',
    relatedQuestions: [
      { no: '§3.2-Q1', text: '为什么 T+5 而不是 T+1？（金融数据的噪声/交易日历）', anchorPrefix: '3.2 FinHot labeler' },
      { no: '§3.2-Q2', text: '858 条 skipped 各是什么？分母怎么写才不会骗人？', anchorPrefix: '3.2 FinHot labeler' },
      { no: '§3.2-Q3', text: '方向准确率 vs baseline，baseline 怎么定义的？n≈60 够吗？', anchorPrefix: '3.2 FinHot labeler' },
      { no: '§4-#5', text: '轨迹数据仓、golden set、情景记忆，同一份轨迹的三种用途，存储要求各差在哪？', anchorPrefix: '4. 交叉快速问答' },
    ],
  },
  // ── P2 ──────────────────────────────────────────────
  {
    slug: 'observability', domain: '可观测', phase: 'P2', status: '🔄 讲义已展开',
    intro: 'agent tracing 模型 + OTel GenAI 属性 + 成本归因；S2 埋点已在 harness-demo 实操（demo:otel）',
    interviewAngle: '“agent tracing+成本归因”考点，demo:otel 实操',
    relatedQuestions: [
      { no: '§4-#2', text: '你的 agent 跑一夜：可观测记什么？崩了怎么恢复？第二天怎么证明它没变笨？', anchorPrefix: '4. 交叉快速问答' },
      { no: '§3.3-Q1', text: '失败率 ~10%，失败分几类？各自处置？（超时/订阅异常/…）', anchorPrefix: '3.3 backfill' },
      { no: '§8-Q2', text: '你的一次失败（litellm 15× 劣化事故实录——监控缺位本身就是失败；API 与多模型路由 §S5）', anchorPrefix: '五道标准题' },
    ],
  },
  {
    slug: 'long-term-memory', domain: '长期记忆', phase: 'P2', status: '🔄 讲义已展开',
    intro: '四类记忆：写 / 读 / 遗忘 / 安全；活锚点是日常在用的 pi Magic Context',
    interviewAngle: '记忆写/读/遗忘/安全四类 + 记忆投毒题',
    relatedQuestions: [
      { no: '§4-#3', text: '上下文压缩、prompt caching、长期记忆注入，三者在“进 system 的 token”上怎么抢预算？', anchorPrefix: '4. 交叉快速问答' },
      { no: '§4-#5', text: '轨迹数据仓、golden set、情景记忆，同一份轨迹的三种用途，存储要求各差在哪？', anchorPrefix: '4. 交叉快速问答' },
      { no: '§4-#6', text: '为什么“评测集污染”和“记忆投毒”是同一类问题？防御机制能复用吗？', anchorPrefix: '4. 交叉快速问答' },
    ],
  },
  {
    slug: 'model-basics', domain: '模型基础', phase: 'P2', status: '🔄 讲义已展开',
    intro: 'KV cache / 推理成本 / 微调意识 + S7 八股速查 16 题——够用不深挖',
    interviewAngle: '八股速查 16 题：KV cache/推理成本/微调',
    relatedQuestions: [
      { no: '§3.4-Q4', text: '压缩策略里 head/tail 怎么定？约束丢了会怎样？(模型基础:位置效应)', anchorPrefix: '3.4 harness-demo' },
      { no: '§4-#4', text: 'FinHot 6 次调用里哪次最适合蒸馏成小模型？数据从哪来？怎么评？', anchorPrefix: '4. 交叉快速问答' },
      { no: '§4-#7', text: '模型下架（你遇到过）那天，harness/API 层/评测层各有什么反应？', anchorPrefix: '4. 交叉快速问答' },
    ],
  },
  {
    slug: 'framework-ecosystem', domain: '框架生态', phase: 'P2', status: '🔄 讲义已展开',
    intro: '框架给你什么 / 藏什么；framework-demo 四能力实操已跑通，实测 allowedTools 抢跑坑',
    interviewAngle: '“框架给你什么/藏什么”：allowedTools 抢跑实证',
    relatedQuestions: [
      { no: '§4-#8', text: '多 agent 编排里，子 agent 的权限、凭据、trace 分别怎么管？', anchorPrefix: '4. 交叉快速问答' },
      { no: '§8-Q4', text: '为什么做 agent 开发 / 为什么这个方向？（框架生态 §S2：亲手从零建过 harness，才知道框架藏了什么）', anchorPrefix: '五道标准题' },
      { no: '§4-#9', text: '一个 coding agent 的 pass@1 从 0.4→0.55，列出你按 ROI 排序的五个优化动作（不换基座模型）', anchorPrefix: '4. 交叉快速问答' },
    ],
  },
  // ── 未分阶段（横向素材）──────────────────────────────
  {
    slug: 'industry-2026', domain: '行业前线调研', phase: '—', status: '✅ 完成',
    intro: '两轮外部调研，核心论断均实抓官方一手源；分水岭 8 细节是“资深分水岭”板块底稿',
    interviewAngle: '8 分水岭细节一手源实证，资深判断题素材',
    relatedQuestions: [
      { no: '§8-Q5', text: '为什么想来我们公司？（面试前作业：对对方产品/工程博客的具体观察 + 与我的资产共鸣点）', anchorPrefix: '五道标准题' },
      { no: '§4-#7', text: '模型下架（你遇到过）那天，harness/API 层/评测层各有什么反应？', anchorPrefix: '4. 交叉快速问答' },
      { no: '§4-#1', text: '提示注入攻击一个接了 MCP 的 coding agent，画出从 payload 进入到最后动作被（没）拦住的完整路径，标出每层防线', anchorPrefix: '4. 交叉快速问答' },
    ],
  },
];

const COURSE_MAP = new Map(COURSES.map((c) => [c.slug, c]));

/* ──────────────────────────────────────────────────────────────
 * 派生计数（单一数据源 · 2026-10-12 W1-A 起）
 *
 * 口径唯一参照：notes/knowledge-map.md 头部「计数口径（2026-10-12 冻结，全仓唯一参照）」块。
 * 全站页面只引用下面这些常量，不再手抄数字；要改口径先改该块、再改这里，别处只引用不改写。
 *
 * ⚠️ DOMAIN_COUNT 不是朴素的 new Set(domain).size（那会得出 17，与冻结的 15 冲突）：
 *    必须同时排除 ① whiteboard 课程卡（无独立 notes 文件，不算知识域）
 *    ② phase === '—' 的横向资产（llm-timeline / industry-2026，knowledge-map 明令不计入门数）。
 * ────────────────────────────────────────────────────────────── */

/** 课程卡中无独立 notes 文件、也无 /c/<slug>/ 课程页的条目（白板作品卡，链向 /works/#whiteboard）。 */
const NON_COURSE_CARD_SLUG = 'whiteboard';
/** 横向资产阶段标记：interview-bank / llm-timeline / industry-2026 不计入知识域门数。 */
const HORIZONTAL_PHASE = '—' as const;

/** 课程页口径：站点 /c/<slug>/ 实生成路由数（notes 顶层 19 − knowledge-map − interview-bank）= 17 */
export const COURSE_COUNT = COURSES.filter((c) => c.slug !== NON_COURSE_CARD_SLUG).length;

/** 课程卡口径：courses.ts 全部条目数（含 whiteboard 白板卡，故比课程页多 1）= 18 */
export const CARD_COUNT = COURSES.length;

/**
 * 知识域口径：14 编号课 + Harness 架构主线 = 15。
 * 排除 whiteboard 卡与 phase='—' 横向资产后按 domain 去重。
 */
export const DOMAIN_COUNT = new Set(
  COURSES.filter((c) => c.slug !== NON_COURSE_CARD_SLUG && c.phase !== HORIZONTAL_PHASE).map(
    (c) => c.domain,
  ),
).size;

/** 可运行 demo 作品口径：有 `npm run demo` 的目录数 = 6（whiteboard / viz / site 为配套资产，不计入）。 */
export const WORK_COUNT = 6;

/** （收口，t36）旧三档「PHASE_COUNTS」已删除（t18）；五阶段计数单一真源在 course-structure.ts 的 STAGE_COUNTS。courses.ts 的 `phase` 字段已降为 legacy：P0/P1/P2 无读方（DomainMap.astro 已迁五档 stage，t36），仅 '—' 仍被两处消费——① DOMAIN_COUNT 过滤（下文 `c.phase !== HORIZONTAL_PHASE`）② c/[slug].astro:61 兜底 chip（`meta.phase === '—'` → '未分阶段'）。阶段定位一律以 course-structure.ts `stage` 为准，勿再依据 phase 呈现三档。 */

/** 按状态分组的课程卡数（从 learn.astro 原有逻辑抽出共享）。 */
export const STATUS_COUNTS = {
  done: COURSES.filter((c) => c.status.startsWith('✅')).length,
  doing: COURSES.filter((c) => c.status.startsWith('🔄') || c.status.startsWith('🚧')).length,
  planned: COURSES.filter((c) => c.status.startsWith('⏳')).length,
};

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

/** /c/[slug] 路由排除项：总地图/题库/重构方案文档/教学规范/MVP 设计规格/capstone 设计文档（蓝图/规范/呈现清单/M0 练习/M0 结构）各有独立页面（/map、/interview）；后几者是 process 文档不是课程，不能生成 /c/ 课程页。 */
export const EXCLUDED_FROM_COURSE_ROUTE = new Set(['knowledge-map', 'interview-bank', 'site-refactor-plan', 'teaching-style-guide', 'api-mvp-spec', 'flywheel-mvp-spec', 'model-basics-mvp-spec', 'capstone-blueprint', 'capstone-style-guide', 'capstone-site-render-checklist', 'capstone-m0-exercise', 'capstone-m0-structure', 'capstone-m1-exercise', 'capstone-m1-structure', 'capstone-m2-exercise', 'capstone-m2-structure', 'capstone-m3-exercise', 'capstone-m3-structure', 'capstone-m4-exercise', 'capstone-m4-structure', 'capstone-final', 'capstone-final-structure']);
