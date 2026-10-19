/**
 * 课程元数据（手写映射）。
 * 基线：notes/knowledge-map.md 的课程总表（15 域 + 阶段 + 状态），
 * 并行新增：multi-agent=多智能体编排/P0、llm-timeline=LLM 时间线/P0、industry-2026=行业前线调研/—。
 * 一句话导读：各课 notes/*.md 开头提炼（这节讲什么 + 对应哪个作品/节）。
 *
 * /c/[slug] 路由由 notes/*.md 的 glob 驱动(新增文件自动出现);
 * 这里没列的新 slug 用 DEFAULT_META 兜底。
 * 例外:whiteboard 是「从零写 harness」的白板作品(无独立 notes 文件),课程卡链向 /works/#whiteboard。
 */
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
}

export const COURSES: CourseMeta[] = [
  // ── P0 ──────────────────────────────────────────────
  {
    slug: 'harness-from-scratch', domain: '从零写 harness', phase: 'P0', status: '✅ 完成',
    intro: '10 节逐节长出最小 agent loop（权限门 / 崩溃恢复 / 压缩），作品 harness-demo + 白板版',
  },
  {
    slug: 'rag', domain: 'RAG 与检索', phase: 'P0', status: '✅ 完成',
    intro: '12 节 + §13 实操复盘：pipeline 每层为什么存在；rag-demo golden set recall@3=0.31（132 chunks，PASS 3/8）',
  },
  {
    slug: 'system-design', domain: '系统设计', phase: 'P0', status: '🔄 讲义已展开',
    intro: '30 分钟结构化答“设计一个 X agent”：七步骨架 / 五范式 / 三演练，收口「从零写 harness / RAG 与检索」作品',
  },
  {
    slug: 'sandbox', domain: '沙箱与凭据', phase: 'P0', status: '🔄 讲义已展开',
    intro: '权限门 ≠ 沙箱（两道独立的门）；S2 四通道 policy 已实现，sandbox-demo 幽灵重放逐字节可复现',
  },
  {
    slug: 'evaluation', domain: '评测工程化', phase: 'P0', status: '🔄 讲义已展开',
    intro: '评测从 recall@k 升级成系统：judge 校准 / golden set 版本化 / CI 门禁，FinHot labeler + rag-demo 双证据链',
  },
  {
    slug: 'multi-agent', domain: '多智能体编排', phase: 'P0', status: '🔄 讲义已展开',
    intro: '何时多智能体（读多路、写单线程）；S7 练习是给 harness-demo 设计子代理方案',
  },
  {
    slug: 'llm-timeline', domain: 'LLM 时间线', phase: '—', status: '✅ 完成',
    intro: '12 节点模型演化时间线（★5 个关键节点），答「为什么当年这么设计 / 下一步往哪走」',
  },
  {
    slug: 'agent-harness', domain: 'Harness 架构', phase: 'P0', status: '✅ 完成',
    intro: '15 节完整教程：harness 分层与每层解决什么问题，FinHot 幽灵事故是现成案例',
  },
  {
    slug: 'whiteboard', domain: '从零写 harness（白板版）', phase: 'P0', status: '✅ 完成',
    intro: '~180 行纯标准库 Python 白板版 agent，与 harness-demo 1:1 对应，20 分钟白板题骨架',
  },
  // ── P1 ──────────────────────────────────────────────
  {
    slug: 'durable-execution', domain: 'durable execution', phase: 'P1', status: '🔄 讲义已展开',
    intro: '长任务不丢不重：journal / checkpoint / 幂等；教学素材是 FinHot backfill 1645 行断点续跑',
  },
  {
    slug: 'mcp', domain: 'MCP 与供应链安全', phase: 'P1', status: '🔄 讲义已展开',
    intro: 'MCP 架构 / 原语 / 认证 + Agent 安全全景；mcp-demo 投毒 + 四层防御实操已实现',
  },
  {
    slug: 'api-engineering', domain: 'API 与多模型路由', phase: 'P1', status: '🔄 讲义已展开',
    intro: '流式 / 结构化输出 / caching / 重试分类 / 路由 / 成本六模块，素材是代理 400 + 模型轮换实录',
  },
  {
    slug: 'data-flywheel', domain: '数据飞轮', phase: 'P1', status: '🔄 讲义已展开',
    intro: '把 FinHot 台账 1830 行（仓外生产数字）+ labeler 讲成“跑过一轮真实生产飞轮”的故事（含三轮真实评测指标：precision 0.256→0.304→0.272）',
  },
  // ── P2 ──────────────────────────────────────────────
  {
    slug: 'observability', domain: '可观测', phase: 'P2', status: '🔄 讲义已展开',
    intro: 'agent tracing 模型 + OTel GenAI 属性 + 成本归因；S2 埋点已在 harness-demo 实操（demo:otel）',
  },
  {
    slug: 'long-term-memory', domain: '长期记忆', phase: 'P2', status: '🔄 讲义已展开',
    intro: '四类记忆：写 / 读 / 遗忘 / 安全；活锚点是日常在用的 pi Magic Context',
  },
  {
    slug: 'model-basics', domain: '模型基础', phase: 'P2', status: '🔄 讲义已展开',
    intro: 'KV cache / 推理成本 / 微调意识 + 一次延迟归因走查——够用不深挖',
  },
  {
    slug: 'framework-ecosystem', domain: '框架生态', phase: 'P2', status: '🔄 讲义已展开',
    intro: '框架给你什么 / 藏什么；framework-demo 四能力实操已跑通，实测 allowedTools 抢跑坑',
  },
  // ── 未分阶段（横向素材）──────────────────────────────
  {
    slug: 'industry-2026', domain: '行业前线调研', phase: '—', status: '✅ 完成',
    intro: '两轮外部调研，核心论断均实抓官方一手源；分水岭 8 细节是“资深分水岭”板块底稿',
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
/** 横向资产阶段标记：llm-timeline / industry-2026 不计入知识域门数。 */
const HORIZONTAL_PHASE = '—' as const;

/**
 * 课程页口径：站点 /c/<slug>/ 实生成路由数（notes 顶层 18 − knowledge-map）= **17**。
 * 18 = 17 课程正文 + `knowledge-map.md`（须留顶层：/map 从 courses 集合按 id 取正文）；
 * 2026-10-19 去面试化：`interview-bank.md` 已删除，顶层由 19 降为 18，算式随之自洽（18 − 1 = 17）。
 * 20 份设计/过程文档在 `notes/process/`，被 `pattern:'*.md'` 挡在集合外，故不计入 19。
 * 取证：`ls notes/*.md | wc -l` → 19；`ls notes/process/*.md | wc -l` → 20。
 */
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

/**
 * 可运行 demo 作品口径：六个具名作品目录 = 6
 * （harness-demo / rag-demo / sandbox-demo / mcp-demo / durable-execution-demo / framework-demo）。
 * whiteboard / viz / site 为配套资产，memory-redteam 按回归套件计，均不计入作品数。
 *
 * ⚠️ 勿据「有 `npm run demo` 的目录数」推算本值：实测为 10（另含 model-basics-demo / flywheel-demo /
 * api-demo / my-agent / memory-redteam；`rag-demo` 的入口是 `demo:eval`，反而不在那 10 个里）。
 * 逐项加平：6 具名作品里只有 5 个有 demo 键（`rag-demo` 无，它的入口是 `demo:eval`）
 *  + 5 个另含目录（model-basics-demo / flywheel-demo / api-demo / my-agent / memory-redteam）= 10 ✅
 * 即 10 = harness-demo / sandbox-demo / mcp-demo / durable-execution-demo / framework-demo
 *  + model-basics-demo / flywheel-demo / api-demo / my-agent / memory-redteam。
 * `memory-redteam` 有 demo 键但按回归套件/自研实操证据计，故不计入作品数——这正是两个口径的分野。
 * 本值口径见 `notes/knowledge-map.md` 计数口径块，与「有 demo 脚本的目录」不是同一件事。
 */
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
};

export function courseMeta(slug: string): CourseMeta {
  return COURSE_MAP.get(slug) ?? { ...DEFAULT_META, slug };
}

/**
 * /c/[slug] 路由排除项：仅 1 条真排除——总地图（`/map`）有独立页面且不做课程页。
 * （2026-10-19 去面试化前为 2 条，另一条是题库 `interview-bank`，该文件与 /interview 页已删除。）
 *
 * 2026-10-14 结构重组：其余 20 份 process 文档（15 capstone 设计 + 3 MVP 规格 + 2 施工规范）已移入
 * `notes/process/`，**不在 `courses` glob 内**（`site/src/content/config.ts:10` 的 `pattern:'*.md'`
 * 仅匹配 `notes/` 顶层），`Set.has` 对它们恒 false，故从本集合删除（22 条 → 2 条）。
 * ⇒ 新增 process 文档直接放进 `notes/process/` 即可，**无需再登记到本集合**。
 */
export const EXCLUDED_FROM_COURSE_ROUTE = new Set(['knowledge-map']);
