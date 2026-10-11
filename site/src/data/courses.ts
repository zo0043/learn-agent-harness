/**
 * 课程元数据（手写映射）。
 * 基线：notes/knowledge-map.md 的课程总表（15 域 + 阶段 + 状态），
 * 并行新增：multi-agent=多智能体编排/P0、llm-timeline=LLM 时间线/P0、industry-2026=行业前线/—。
 * 一句话导读为占位（可按内容改）。
 *
 * /c/[slug] 路由由 notes/*.md 的 glob 驱动（并行 worker 新增文件自动出现）；
 * 这里没列的新 slug 用 DEFAULT_META 兜底。
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
  { slug: 'harness-from-scratch', letter: 'A', domain: '从零写最小 harness', phase: 'P0', status: '✅ 完成', intro: '白板 20 分钟写出可运行 agent loop（loop / 工具协议 / 权限门 / 崩溃恢复 / 压缩）' },
  { slug: 'rag', letter: 'B', domain: 'RAG 与检索', phase: 'P0', status: '✅ 完成', intro: '讲清 pipeline 每层为什么存在 + 跑过 85-chunk golden 评测' },
  { slug: 'system-design', letter: 'C', domain: 'Agent 系统设计模板', phase: 'P0', status: '⏳ 规划中', intro: '30 分钟结构化答“设计一个 X agent”' },
  { slug: 'sandbox', letter: 'E', domain: '沙箱与凭据 · 可复现', phase: 'P0', status: '🔄 进行中', intro: '“权限层 ≠ 沙箱” + 隔离技术选型 + 幽灵事故完整故事' },
  { slug: 'evaluation', letter: 'H', domain: '评测工程化', phase: 'P0', status: '⏳ 规划中', intro: '设计 LLM-judge + golden set 版本化 + 评测 CI 门禁' },
  { slug: 'multi-agent', domain: '多智能体编排', phase: 'P0', status: '⏳ 规划中', intro: '多 agent 协作与编排模式（撰写中）' },
  { slug: 'llm-timeline', domain: 'LLM 时间线', phase: 'P0', status: '⏳ 规划中', intro: 'LLM 演进关键节点与转折点（撰写中）' },
  { slug: 'agent-harness', domain: 'Agent Harness 架构', phase: 'P0', status: '✅ 完成', intro: '13 节完整教程：harness 分层、每层解决什么问题、设计取舍' },
  // ── P1 ──────────────────────────────────────────────
  { slug: 'durable-execution', letter: 'G', domain: 'Durable Execution', phase: 'P1', status: '⏳ 规划中', intro: '长任务不丢不重：journal / checkpoint / 幂等' },
  { slug: 'mcp', letter: 'I', domain: 'MCP 协议 + 供应链安全', phase: 'P1', status: '⏳ 规划中', intro: 'MCP 架构 / 原语 / 认证 + 四类投毒攻击与防御' },
  { slug: 'api-engineering', letter: 'J', domain: 'API 实操 + 多模型路由', phase: 'P1', status: '⏳ 规划中', intro: '流式 / 结构化输出 / caching / 重试分类 / 路由成本' },
  { slug: 'data-flywheel', letter: 'K', domain: '数据飞轮', phase: 'P1', status: '⏳ 规划中', intro: '把 FinHot 台账 + labeler 讲成“生产数据飞轮”故事' },
  // ── P2 ──────────────────────────────────────────────
  { slug: 'observability', letter: 'D', domain: 'Agent 可观测', phase: 'P2', status: '⏳ 规划中', intro: '画 agent tracing 模型 + OTel GenAI 属性 + 成本归因' },
  { slug: 'long-term-memory', letter: 'F', domain: '长期记忆', phase: 'P2', status: '⏳ 规划中', intro: '设计跨会话 memory：写 / 读 / 遗忘 / 安全' },
  { slug: 'model-basics', letter: 'L', domain: '模型基础', phase: 'P2', status: '⏳ 规划中', intro: 'KV cache / 推理成本 / 微调意识——够用不深挖' },
  { slug: 'framework-ecosystem', letter: 'M', domain: '框架生态', phase: 'P2', status: '⏳ 规划中', intro: '框架给你什么 / 藏什么 + pi 源码级实操故事' },
  // ── 未分阶段（横向素材）──────────────────────────────
  { slug: 'industry-2026', domain: '行业前线', phase: '—', status: '✅ 完成', intro: '两轮外部调研：2026 行业前线，核心论断均实抓官方一手源' },
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
