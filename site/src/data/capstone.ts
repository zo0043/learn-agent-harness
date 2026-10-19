/**
 * 增量主线（capstone）呈现数据源。
 *
 * 只读课程/mvp 词表，不反向改它们。milestone 六栏（key/name/stage/adds/courses/reference）
 * 与 notes/process/capstone-blueprint.md §3 映射表逐字一致（这是「自洽」的机器可核对点）。
 *
 * term 约定（notes/process/capstone-site-render-checklist.md §0）：milestone 键用小写 m0…m4，展示名 M0…M4；
 * demo 一律叫「参考样本（reference）」，主线 my-agent 是「你要搭的（your build）」。
 *
 * 每课「主线挂钩」不在本表——它作为 Course.capstoneHook 落在 course-structure.ts（单一真源），
 * 由 learn.astro 卡片 chip 与 c/[slug].astro 学习路径共同消费。
 */
import { courseBySlug } from './course-structure';

export interface Milestone {
  /** 工号键（小写，与 capstone-blueprint §3 一致） */
  key: 'm0' | 'm1' | 'm2' | 'm3' | 'm4';
  /** 展示名（M0 minimal-loop 等） */
  name: string;
  /** 阶段（严格五档；m4 单值 'P3' + stageNote 说明「跨 P3+P4」） */
  stage: string;
  /** 阶段补充说明（仅 m4 用） */
  stageNote?: string;
  /** 增建能力（真·增建到 my-agent/src/，每人一行） */
  adds: string[];
  /** 必修课 slug（供给机制，链到 /c/<slug>/） */
  courses: string[];
  /** 参考答案 demo（目录名，仅展示，不链） */
  reference: string[];
  /** 本 milestone 断言的 clone 判据命令 */
  assertCmd: string;
  /** 就位状态：m0–m4 均已就位（exercises/m<N>/ + assert/m<N>.assert.ts 在库；旧注释「m1–m4 留待后续 sprint」已于 2026-10-19 更正） */
  status: 'done' | 'building';
  /** 状态中文标注 */
  statusLabel: string;
}

/**
 * 五 milestone（照 capstone-blueprint.md §3 映射表逐行抄入）。
 * key/name/stage/adds/courses/reference 六栏不得在别处另造一套划分。
 */
export const MILESTONES: Milestone[] = [
  {
    key: 'm0',
    name: 'M0 · minimal-loop（最小 loop）',
    stage: 'P0',
    adds: ['单工具最小循环：确定性 mock model「想」→ 单工具 read_file「做」→ model「说」→ 终止判定'],
    courses: ['harness-from-scratch'],
    reference: ['harness-demo（最小 loop 段）'],
    assertCmd: 'npm run assert:m0',
    status: 'done',
    statusLabel: '✅ 已就位（my-agent/ 起步）',
  },
  {
    key: 'm1',
    name: 'M1 · multi-tool-session（多工具 + 会话 + 压缩）',
    stage: 'P0',
    adds: [
      '第二工具（检索，接入「检索 = 打分排序」）',
      '多工具命名分发',
      'JSONL 会话持久化 / 续跑',
      'token 上下文压缩',
      '默认 deny 权限门（第一道）',
    ],
    courses: ['harness-from-scratch', 'agent-harness', 'rag', 'system-design'],
    reference: ['harness-demo（5 运行模式）', 'rag-demo（打分排序）'],
    assertCmd: 'npm run assert:m1',
    status: 'done',
    statusLabel: '✅ 已就位（exercises/m1/）',
  },
  {
    key: 'm2',
    name: 'M2 · sandbox-mcp-eval（沙箱 + MCP + 评测）',
    stage: 'P1',
    adds: [
      '四通道 policy（deny > approve > sandbox > allow，从 M1 默认 deny 升级）',
      '沙箱第三通道',
      'MCP 工具（一个远程工具走 JSON-RPC + 防御）',
      '评测套件（golden set + judge 校准）',
    ],
    courses: ['sandbox', 'mcp', 'evaluation', 'multi-agent'],
    reference: ['sandbox-demo / mcp-demo', 'rag-demo demo:eval'],
    assertCmd: 'npm run assert:m2',
    status: 'done',
    statusLabel: '✅ 已就位（exercises/m2/）',
  },
  {
    key: 'm3',
    name: 'M3 · durable-api-obs（可恢复 + 路由 + 可观测）',
    stage: 'P2',
    adds: [
      'durable execution（journal 双锚点 / checkpoint 原子写 / 幂等键）',
      'SSE 流式',
      '重试分类（4xx 不盲重试）',
      'caching',
      '多模型路由',
      '成本归因',
      'OTel trace/span 埋点',
    ],
    courses: ['durable-execution', 'api-engineering', 'observability'],
    reference: ['durable-execution-demo', 'api-demo', 'harness-demo demo:otel'],
    assertCmd: 'npm run assert:m3',
    status: 'done',
    statusLabel: '✅ 已就位（exercises/m3/）',
  },
  {
    key: 'm4',
    name: 'M4 · memory-flywheel-model（记忆 + 飞轮 + 模型意识）',
    stage: 'P3',
    stageNote: '跨 P3+P4',
    adds: [
      '四类记忆（写读遗忘 + 四道投毒防线）',
      '评测飞轮（label 两轮降噪 + 决策门禁）',
      '模型意识（KV cache / 成本走查：该不该上更大模型 / 该不该微调）',
      '框架边界对照（把 my-agent 对照 SDK 抽象边界）',
    ],
    courses: ['long-term-memory', 'data-flywheel', 'model-basics', 'framework-ecosystem', 'industry-2026'],
    reference: ['memory-redteam', 'flywheel-demo', 'model-basics-demo', 'framework-demo'],
    assertCmd: 'npm run assert:m4',
    status: 'done',
    statusLabel: '✅ 已就位（exercises/m4/）',
  },
];

/** 按 key 取 milestone（供筛选/校验） */
export function milestoneByKey(key: string): Milestone | undefined {
  return MILESTONES.find((m) => m.key === key);
}

/** 校验：milestone.courses 里的 slug 必须在课程词表内（缺一即 fail-fast，防手抄漂移）。 */
export function assertMilestonesCoursesResolve(): void {
  for (const m of MILESTONES) {
    for (const slug of m.courses) {
      if (!courseBySlug(slug)) {
        throw new Error(`capstone.ts：milestone ${m.key} 的必修课 slug "${slug}" 不在 course-structure.ts 词表内`);
      }
    }
  }
}