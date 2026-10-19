/**
 * MVP 词表（单一真源）。
 *
 * 来源：notes/process/site-refactor-plan.md §4.1（13 个 mvpSlug，三态如实标注）。
 * 口径：本文件是「课程 → MVP」映射与「MVP 现况」的唯一真源；course-structure.ts 的
 * 每个 mvpSlug 必须落在此表内（mvpStatusOf 对未知 slug fail-fast，映射闭合）。
 *
 * 三态语义（§4.1「现况」列，规划态绝不冒充已实现）：
 *   - done     当前已实现、可 clone 运行的代码 demo（或非代码横向资产，见 industry-research）
 *   - planned  本 sprint 只登记、尚无独立 demo 的「代码 MVP（规划）」
 *   - asset    非代码 / 横向资产（llm-history / industry-research），不计入 6 个可运行作品数
 *
 * ⚠️ 可运行 demo 作品数（WORK_COUNT = 6）与「本词表 size = 13」是两个不同口径：
 *    6 = 六个具名作品目录（harness-demo / rag-demo / sandbox-demo / mcp-demo /
 *        durable-execution-demo / framework-demo），口径见 notes/knowledge-map.md 头部；
 *    本表同时登记了横向资产（llm-history / industry-research）与 memory-redteam
 *        （回归套件，不计入作品数）。**2026-10-19 更正**：旧注释称 api / flywheel /
 *        model-basics 为「规划态」——三者实际均已 done（api-demo 六模块+15 断言 /
 *        flywheel-demo 四模块+10 断言 / model-basics-demo 四模块+10 断言，见各条目 status）。
 */

/** MVP 现况三态（与 §8.1 的 mvpStatus 共用同一枚举族，done/planned/asset）。 */
export type MvpStatus = 'done' | 'planned' | 'asset';

export interface Mvp {
  /** mvpSlug（§4 词表内唯一标识） */
  slug: string;
  /** 归属课（owner）slug：这门课「拥有」该 MVP */
  owner: string;
  /** 复用/扩展课 slug（无则空数组）。映射不是单射：后段课可复用/扩展前段课同一 MVP */
  reuse: string[];
  /** 三态（如实标注，规划态不冒充已实现） */
  status: MvpStatus;
  /** §4.1「现况」列的原始标注（含 v0 / 重建 / 非代码等精细口径） */
  statusLabel: string;
  /** §4.1「制品」列：已实现=制品路径与证据；规划=规划内容 */
  artifact: string;
  /** 补充说明（引用/横向不计入作品数等），可选 */
  note?: string;
}

export const MVPS: Mvp[] = [
  {
    slug: 'harness-mvp',
    owner: 'harness-from-scratch',
    reuse: ['agent-harness', 'system-design', 'multi-agent'],
    status: 'done',
    statusLabel: '✅ 已实现',
    artifact: 'harness-demo/（13 src = 9 运行时 + 3 OTel 离线判据/断言 + 1 压缩自测，5 运行模式）+ whiteboard/agent_whiteboard.py',
  },
  {
    slug: 'rag-mvp',
    owner: 'rag',
    reuse: ['evaluation', 'system-design'],
    status: 'done',
    statusLabel: '✅ 已实现',
    artifact: 'rag-demo/（134 chunks golden set，recall@3=0.31）',
    note: 'system-design 为「参考」复用（设计模板参考检索链路，非代码扩展）',
  },
  {
    slug: 'sandbox-mvp',
    owner: 'sandbox',
    reuse: [],
    status: 'done',
    statusLabel: '✅ 已实现',
    artifact: 'sandbox-demo/（四通道 policy + 幽灵重放）',
  },
  {
    slug: 'mcp-mvp',
    owner: 'mcp',
    reuse: [],
    status: 'done',
    statusLabel: '✅ 已实现',
    artifact: 'mcp-demo/（投毒 + 四层防御 + 消融）',
  },
  {
    slug: 'durable-execution-mvp',
    owner: 'durable-execution',
    reuse: [],
    status: 'done',
    statusLabel: '✅ 已实现',
    artifact: 'durable-execution-demo/（journal/checkpoint/幂等）',
  },
  {
    slug: 'obs-mvp',
    owner: 'observability',
    reuse: [],
    status: 'done',
    statusLabel: '✅ 已实现（v0）',
    artifact: 'harness-demo 的 demo:otel（离线 mock 15 spans/1 trace）',
  },
  {
    slug: 'memory-mvp',
    owner: 'long-term-memory',
    reuse: [],
    status: 'done',
    statusLabel: '✅ 已实现',
    artifact: 'memory-redteam/（自研记忆子系统，16/16 守住）',
    note: 'memory-redteam 为回归套件/自研实操证据，不计入 6 个作品数',
  },
  {
    slug: 'framework-mvp',
    owner: 'framework-ecosystem',
    reuse: [],
    status: 'done',
    statusLabel: '✅ 已实现',
    artifact: 'framework-demo/（Claude Agent SDK 四能力）',
  },
  {
    slug: 'api-mvp',
    owner: 'api-engineering',
    reuse: [],
    status: 'done',
    statusLabel: '✅ 已实现',
    artifact: 'api-demo/（六模块最小闭环 + 15 条断言自测，全离线零 key）',
    note: '复用 harness-mvp 的 chatStream/context/validateArgs 语义（独立目录不 import）；确定性：mock provider + 固定 seed jitter，跑 N 次逐字节一致',
  },
  {
    slug: 'flywheel-mvp',
    owner: 'data-flywheel',
    reuse: [],
    status: 'done',
    statusLabel: '✅ 已实现',
    artifact: 'flywheel-demo/（脱敏台账 → filter/label 两轮降噪 → 指标 → 门禁 四模块 + 10 断言自测）',
    note: '脱敏合成样本（FinHot 字段形状对齐、内容合成，生产数据在仓外）；labeler 用预置预测表、全离线零 key；确定性（逻辑时钟 + 无墙钟/随机）',
  },
  {
    slug: 'model-basics-mvp',
    owner: 'model-basics',
    reuse: [],
    status: 'done',
    statusLabel: '✅ 已实现',
    artifact: 'model-basics-demo/（KV cache / 推理成本数值走查脚本：四模块 + 10 断言 + S8 六步走查）',
    note: '全离线零 key、纯计算脚本不调模型不联网；输入全部预置常量、无墙钟/随机，跑 N 次逐字节一致；数值为量级参考（非某真实硬件精确承诺）',
  },
  {
    slug: 'llm-history',
    owner: 'llm-timeline',
    reuse: ['industry-2026'],
    status: 'asset',
    statusLabel: '🔄 本 sprint 重建（横向资产）',
    artifact: 'site/src/data/llm-history.ts（重建）+ /nav 横向导航页',
    note: 'industry-2026 为同类横向资产；横向资产不计入 6 个可运行作品数',
  },
  {
    slug: 'industry-research',
    owner: 'industry-2026',
    reuse: [],
    status: 'asset',
    statusLabel: '✅ 已实现（非代码）',
    artifact: 'notes/industry-2026.md + notes/details/ 8 页',
    note: '横向资产（非代码），不计入 6 个可运行作品数',
  },
];

const MVP_MAP = new Map(MVPS.map((m) => [m.slug, m]));

/** 按 slug 取 MVP；未知 slug 抛错（映射闭合，fail-fast）。 */
export function mvpBySlug(slug: string): Mvp {
  const found = MVP_MAP.get(slug);
  if (!found) {
    throw new Error(
      `mvps.ts：未知 mvpSlug「${slug}」——课程→MVP 映射未闭合（参照 notes/process/site-refactor-plan.md §4 词表）`,
    );
  }
  return found;
}

/** 课程侧 mvpStatus 派生值（§8.1 的 done/planned/asset），单一真源在 mvps.ts。 */
export function mvpStatusOf(slug: string): MvpStatus {
  return mvpBySlug(slug).status;
}