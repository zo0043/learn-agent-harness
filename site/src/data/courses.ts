/**
 * 课程元数据（手写映射）。
 * 基线：notes/knowledge-map.md 的课程总表（15 域 + 阶段 + 状态），
 * 并行新增：multi-agent=多智能体编排/P0、llm-timeline=LLM 时间线/P0、industry-2026=行业前线/—。
 * 一句话导读：各课 notes/*.md 开头提炼（这节讲什么 + 对应哪个作品/节）。
 *
 * /c/[slug] 路由由 notes/*.md 的 glob 驱动（并行 worker 新增文件自动出现）；
 * 这里没列的新 slug 用 DEFAULT_META 兜底。
 * 例外：whiteboard 是课程 A 的白板作品（无独立 notes 文件），课程卡链向 /works/#whiteboard。
 */
export interface CourseMeta {
  slug: string;
  /** 课程代号 A–M；非编号课留空 */
  letter?: string;
  /** 知识域名 */
  domain: string;
  phase: 'P0' | 'P1' | 'P2' | '—';
  status: '✅ 完成' | '🔄 进行中' | '⏳ 规划中';
  /** 一句话导读（占位，可改） */
  intro: string;
}

export const COURSES: CourseMeta[] = [
  // ── P0 ──────────────────────────────────────────────
  { slug: 'harness-from-scratch', letter: 'A', domain: '从零写最小 harness', phase: 'P0', status: '✅ 完成', intro: '10 节逐节长出最小 agent loop（权限门 / 崩溃恢复 / 压缩），作品 harness-demo + 白板版' },
  { slug: 'rag', letter: 'B', domain: 'RAG 与检索', phase: 'P0', status: '✅ 完成', intro: '12 节 + §13 实操复盘：pipeline 每层为什么存在；rag-demo golden set recall@3=1.00' },
  { slug: 'system-design', letter: 'C', domain: 'Agent 系统设计模板', phase: 'P0', status: '⏳ 规划中', intro: '30 分钟结构化答“设计一个 X agent”：七步骨架 / 五范式 / 三演练，收口 A/B 作品' },
  { slug: 'sandbox', letter: 'E', domain: '沙箱与凭据 · 可复现', phase: 'P0', status: '🔄 进行中', intro: '权限门 ≠ 沙箱（两道独立的门）；S2 四通道 policy 已实现，sandbox-demo 幽灵重放逐字节可复现' },
  { slug: 'evaluation', letter: 'H', domain: '评测工程化', phase: 'P0', status: '⏳ 规划中', intro: '评测从 recall@k 升级成系统：judge 校准 / golden set 版本化 / CI 门禁，FinHot labeler + rag-demo 双证据链' },
  { slug: 'multi-agent', domain: '多智能体编排', phase: 'P0', status: '⏳ 规划中', intro: '何时多智能体（读多路、写单线程）；S7 练习是给 harness-demo 设计子代理方案' },
  { slug: 'llm-timeline', domain: 'LLM 时间线', phase: 'P0', status: '⏳ 规划中', intro: '12 节点模型演化时间线（★5 个面试谈资），答“为什么当年这么设计 / 下一步往哪走”' },
  { slug: 'agent-harness', domain: 'Agent Harness 架构', phase: 'P0', status: '✅ 完成', intro: '13 节完整教程：harness 分层与每层解决什么问题，FinHot 幽灵事故是现成案例' },
  { slug: 'whiteboard', domain: '从零写最小 harness', phase: 'P0', status: '✅ 完成', intro: '~150 行纯标准库 Python 白板版 agent，与 harness-demo 1:1 对应，20 分钟白板题骨架' },
  // ── P1 ──────────────────────────────────────────────
  { slug: 'durable-execution', letter: 'G', domain: 'Durable Execution', phase: 'P1', status: '⏳ 规划中', intro: '长任务不丢不重：journal / checkpoint / 幂等；教学素材是 FinHot backfill 1645 行断点续跑' },
  { slug: 'mcp', letter: 'I', domain: 'MCP 协议 + 供应链安全', phase: 'P1', status: '🔄 进行中', intro: 'MCP 架构 / 原语 / 认证 + Agent 安全全景；mcp-demo 投毒 + 四层防御实操已实现' },
  { slug: 'api-engineering', letter: 'J', domain: 'API 实操 + 多模型路由', phase: 'P1', status: '⏳ 规划中', intro: '流式 / 结构化输出 / caching / 重试分类 / 路由 / 成本六模块，素材是代理 400 + 模型轮换实录' },
  { slug: 'data-flywheel', letter: 'K', domain: '数据飞轮', phase: 'P1', status: '⏳ 规划中', intro: '把 FinHot 台账 1830 行 + labeler 讲成“跑过一轮真实生产飞轮”的故事' },
  // ── P2 ──────────────────────────────────────────────
  { slug: 'observability', letter: 'D', domain: 'Agent 可观测', phase: 'P2', status: '🔄 进行中', intro: 'agent tracing 模型 + OTel GenAI 属性 + 成本归因；S2 埋点已在 harness-demo 实操（demo:otel）' },
  { slug: 'long-term-memory', letter: 'F', domain: '长期记忆', phase: 'P2', status: '⏳ 规划中', intro: '四类记忆：写 / 读 / 遗忘 / 安全；活锚点是日常在用的 pi Magic Context' },
  { slug: 'model-basics', letter: 'L', domain: '模型基础', phase: 'P2', status: '⏳ 规划中', intro: 'KV cache / 推理成本 / 微调意识 + S7 八股速查 16 题——够用不深挖' },
  { slug: 'framework-ecosystem', letter: 'M', domain: '框架生态', phase: 'P2', status: '🔄 进行中', intro: '框架给你什么 / 藏什么；framework-demo 四能力实操已跑通，实测 allowedTools 抢跑坑' },
  // ── 未分阶段（横向素材）──────────────────────────────
  { slug: 'industry-2026', domain: '行业前线', phase: '—', status: '✅ 完成', intro: '两轮外部调研，核心论断均实抓官方一手源；分水岭 8 细节是“资深分水岭”板块底稿' },
];

const COURSE_MAP = new Map(COURSES.map((c) => [c.slug, c]));

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

/** /c/[slug] 路由排除项：总地图与题库各有独立页面（/map、/interview） */
export const EXCLUDED_FROM_COURSE_ROUTE = new Set(['knowledge-map', 'interview-bank']);
