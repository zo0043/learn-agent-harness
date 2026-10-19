/**
 * 五阶段课程编排（唯一真源，重建）。
 *
 * **阶段口径（唯一真源声明）**：本文件的 `stage` ∈ `P0–P4` 是**教学阶段**（基础篇 / 工具与安全 /
 * 生产可靠性 / 体系与数据 / 收口与前沿），也是站点 `/learn/` 的线性阅读序。
 * `notes/knowledge-map.md` 课程总表里的 **W0–W2** 是**岗位权重**（备考优先级），两者**不是同一套标签、
 * 不可互换**——2026-10-19 修复前该表用同一批 `P0–P2` 表达权重，导致 `/learn` 与 `/map` 对同一门课
 * 给出相反顺序（评审 `PED-F1`）。阶段以本文件为准，权重以 knowledge-map 为准。
 *
 * 唯一内容源：notes/process/site-refactor-plan.md §2/§3/§4/§5。17 项按 §3 线性阅读序排列
 * （order = 数组 index，不必显式存）；slug/stage/prereqs/next/mvpSlug/前置知识与 §2 主表
 * 逐字一致，无遗漏、无漂移。
 *
 * 字段是 §8.1 契约与实现任务要求的并集：
 *   §8.1：slug / stage / domain / title / prereqs / next / mvpSlug / prerequisiteNote /
 *         mvpStatus / isHorizontal
 *   任务附加（教学三字段）：intro / teachingFocus / practicalOutput
 * 其中 mvpStatus 不在此表硬编码——由 mvps.ts 词表派生（单一真源；mvpStatusOf fail-fast）。
 *
 * 旧草稿已整体重做、不沿用（§7）：三档 phase + 单链 5 门 + sandbox/observability 错标阶段。
 */

import { type MvpStatus, mvpStatusOf } from './mvps';

/** 严格五档（§1）：无 0.5、无「—」当课程阶段。 */
export const STAGES = ['P0', 'P1', 'P2', 'P3', 'P4'] as const;
export type Stage = (typeof STAGES)[number];

/** 阶段中文名（§1 编排总原则：基础篇/工具与安全/生产可靠性/体系与数据/收口与前沿）。 */
export const STAGE_LABELS: Record<Stage, string> = {
  P0: '基础篇',
  P1: '工具与安全',
  P2: '生产可靠性',
  P3: '体系与数据',
  P4: '收口与前沿',
};

/**
 * 阶段目标一句话（单一真源）。
 * /learn/ 与首页共用——此前硬编码在 learn.astro，首页要用时若各写一份即为重复真源。
 */
export const STAGE_DESC: Record<Stage, string> = {
  P0: '0 经验可入手 · 从零写 harness 起步（序章 + 动手）',
  P1: '工具调用 / 供应链安全 / 评测 / 多智能体编排',
  P2: '长任务不丢不重 / 多模型路由 / 可观测',
  P3: '长期记忆 / 数据飞轮 / 模型基础',
  P4: '框架生态收口 + 行业前线调研',
};

export interface Course {
  /** 课程页 slug（与 courses.ts / notes 同名） */
  slug: string;
  /** 阶段（严格五档） */
  stage: Stage;
  /** 知识域规范名（取自 notes/knowledge-map.md 命名总表） */
  domain: string;
  /** 一句话标题（用于导航卡） */
  title: string;
  /** 一句话导读（这课讲什么 + 收口哪个 MVP/作品） */
  intro: string;
  /** 前置课程 slug（⊆ 更早 order；§2 已校验拓扑序） */
  prereqs: string[];
  /** 线性后继 slug（0 或 1 个；上下篇导航由数组 index 派生，不用此字段重算序列） */
  next: string[];
  /** §4 词表内的 slug（映射闭合，mvpStatusOf fail-fast） */
  mvpSlug: string;
  /** 教学重点（本课讲清哪些机制） */
  teachingFocus: string;
  /** 实践产物（学生学完能产出/复现什么） */
  practicalOutput: string;
  /** 前置知识一句话；无则「—」（§2/§5） */
  prerequisiteNote: string;
  /** MVP 现况三态（派生自 mvps.ts，单一真源） */
  mvpStatus: MvpStatus;
  /** 横向双定位（仅 llm-timeline / industry-2026 为 true） */
  isHorizontal: boolean;
  /** 主线挂钩（capstone）：本课给 my-agent 哪个 milestone 供货什么机制（如「M0：loop 骨架 / 工具协议」）；
   *  横向资产课为「全域 / 收口」素材。缺省空 = 无主线挂钩（渲染层优雅降级，不显示 undefined）。 */
  capstoneHook?: string;
}

/** §8.1 的接口名（alias）：CourseStructureItem 即 Course。 */
export type CourseStructureItem = Course;

/** 原始 17 项（MVP 现况除外——那由 mvps.ts 派生）。 */
const COURSE_STRUCTURE_BASE: Omit<Course, 'mvpStatus'>[] = [
  // ── P0 基础篇（0 经验可入手，从零写 harness 起步）────────────────────
  {
    slug: 'llm-timeline',
    capstoneHook: '全域 · 背景地图（序章）',
    stage: 'P0',
    domain: 'LLM 时间线',
    title: 'LLM 时间线（agent 开发者视角·序章横向）',
    intro: 'agent 开发者视角时间线正文：2023 GPT-4 → 2026 的 12 个关键节点（function calling / MCP / 推理代际等必记里程碑），带出处',
    prereqs: [],
    next: ['harness-from-scratch'],
    mvpSlug: 'llm-history',
    teachingFocus: 'agent 里程碑 / 能力代际 / 面试谈资（序章背景地图，非动手课）',
    practicalOutput:
      '交付 agent 视角 12 节点时间线正文（notes/llm-timeline.md）。判定「跑得起来」= npm run build 后 /c/llm-timeline 渲染出 12 节点表；横向资产另见 mvpSlug=llm-history（/nav 发展史 10 节点 + 5 代演进，与本文互补：模型史 vs agent 史）',
    prerequisiteNote: '0 经验可读：会看网页即可，无代码/数学门槛',
    isHorizontal: true,
  },
  {
    slug: 'harness-from-scratch',
    capstoneHook: 'M0 · 最小 loop / 工具协议',
    stage: 'P0',
    domain: '从零写 harness',
    title: '从零写 harness',
    intro: '10 节逐节长出最小 agent loop（权限门 / 崩溃恢复 / token 压缩），作品 harness-demo（5 种运行模式）',
    prereqs: [],
    next: ['agent-harness'],
    mvpSlug: 'harness-mvp',
    teachingFocus: 'loop / 工具协议 / 权限门（默认 deny）/ JSONL 轨迹恢复 / 压缩',
    practicalOutput:
      '交付 harness-mvp（独占）：最小 agent loop（权限门/崩溃恢复/压缩，5 种运行模式）。判定 clone 能跑 = cd harness-demo && npx tsx src/test-compact.ts 复现压缩 1378→426 tokens；它是主干第一块砖，agent-harness/sandbox/durable-execution/multi-agent 复用/扩展这份代码',
    prerequisiteNote:
      '0 经验可入手：会 Python 基础（函数/异常/文件 IO）＋ 跑终端命令即可，不要求懂模型原理（demo 用 npm/tsx，白板版纯标准库）',
    isHorizontal: false,
  },
  {
    slug: 'agent-harness',
    capstoneHook: 'M1 · harness 分层落位',
    stage: 'P0',
    domain: 'Harness 架构',
    title: 'Harness 架构（主线）',
    intro: 'harness 分层与每层职责（主线架构课），FinHot 幽灵事故是现成案例',
    prereqs: ['harness-from-scratch'],
    next: ['rag'],
    mvpSlug: 'harness-mvp',
    teachingFocus: 'harness 分层 / 每层职责 / 权限门·恢复·压缩的架构落位',
    practicalOutput:
      '交付 = harness 分层图 + 每层职责/组件清单（无独立代码，复用 harness-mvp 作解剖对象）；判定（学习者自查）＝ 能对照 harness-demo 现场画出 5 层分层图（loop / 工具注册与执行 / 权限门 / 恢复与压缩 / 可观测），每层说出「为什么存在」+ 指出 FinHot 幽灵事故对应哪一层失守——可证伪：缺一层即未过',
    prerequisiteNote: '已理解最小 loop 的组成（权限门/恢复/压缩；来自前置课）',
    isHorizontal: false,
  },
  {
    slug: 'rag',
    capstoneHook: 'M1 · 检索工具（打分排序）',
    stage: 'P0',
    domain: 'RAG 与检索',
    title: 'RAG 与检索',
    intro: '检索 pipeline 每层为何存在；rag-demo 132 chunks golden set，recall@3=0.31',
    prereqs: ['harness-from-scratch'],
    next: ['system-design'],
    mvpSlug: 'rag-mvp',
    teachingFocus: 'chunking / 检索打分排序 / RRF 融合 / 强制引用与拒答',
    practicalOutput:
      '交付 rag-mvp（独占）：检索 pipeline（chunk/打分/RRF/强制引用）。判定 clone 能跑 = cd rag-demo && npx tsx src/evaluate.ts 复现 recall@3=0.31（132 chunks，PASS 3/8）；evaluation/system-design 复用它的评测链与检索取舍',
    prerequisiteNote: '已能跑通 harness-demo（前置课带入最小 loop 与工具协议直觉）；只需会读写文件、无需语义模型/向量库——「检索=打分排序」直觉随课建立',
    isHorizontal: false,
  },
  {
    slug: 'system-design',
    capstoneHook: 'M1 · 系统设计讲法',
    stage: 'P0',
    domain: '系统设计',
    title: 'Agent 系统设计',
    intro: '30 分钟结构化答「设计一个 X agent」：七步骨架 / 五范式 / 三演练，收口从零写 harness 与 RAG',
    prereqs: ['harness-from-scratch', 'rag'],
    next: ['sandbox'],
    mvpSlug: 'harness-mvp',
    teachingFocus: '需求→组件→权衡 / 设计模板 / 演练收口',
    practicalOutput:
      '交付 = 30 分钟「设计一个 X agent」模板 + 演练答法（无独立代码，复用 harness-mvp + rag-mvp 作素材）；判定（学习者自查）＝ 30 分钟内按七步骨架输出一份「需求→组件→权衡」模板（每步至少一个权衡点），并能对同一需求给出「改用 workflow 实现」的反例——可证伪：超时或缺任一骨架步骤即未过',
    prerequisiteNote: '无需额外技能：能画流程图、会讲「需求→组件→权衡」即可',
    isHorizontal: false,
  },

  // ── P1 工具与安全篇 ────────────────────────────────────────────────
  {
    slug: 'sandbox',
    capstoneHook: 'M2 · 四通道 policy + 沙箱',
    stage: 'P1',
    domain: '沙箱与凭据',
    title: '沙箱与凭据',
    intro: '权限门 ≠ 沙箱（两道独立的门）；sandbox-demo 四通道 policy + 幽灵重放',
    prereqs: ['harness-from-scratch'],
    next: ['mcp'],
    mvpSlug: 'sandbox-mvp',
    teachingFocus: '四通道 policy（deny>approve>sandbox>allow）/ 隔离选型 / 事故重放',
    practicalOutput:
      '交付 sandbox-mvp（独占）：四通道 policy 引擎 + 幽灵事故重放剧本。判定 clone 能跑 = cd sandbox-demo && npm i && npm run demo 复现「A 组仅权限门→生产被替换 / B 组四通道+沙箱→生产正常」+ `✅ 重放一致性断言通过`（A/B 各 3 次逐字节一致，node ≥ 18）；mcp/durable-execution 复用它的 policy 门与「事故重放」方法论',
    prerequisiteNote:
      '已能跑通 harness-demo（前置课带入最小 loop 与 policy 门直觉）；只需「进程/文件系统/容器隔离」的粗概念——四通道与三条边界（路径/env/网络）的具体机制随 sandbox-demo 边跑边建，不要求会写容器',
    isHorizontal: false,
  },
  {
    slug: 'mcp',
    capstoneHook: 'M2 · MCP 原语 + 四层防御',
    stage: 'P1',
    domain: 'MCP 与供应链安全',
    title: 'MCP 与供应链安全',
    intro: 'MCP 架构/原语/认证 + Agent 安全全景；mcp-demo 投毒 + 四层防御实操',
    prereqs: ['sandbox'],
    next: ['evaluation'],
    mvpSlug: 'mcp-mvp',
    teachingFocus: '协议原语 / 供应链投毒 / 四层防御与消融',
    practicalOutput:
      '交付 mcp-mvp（独占）：MCP 投毒攻击 + 四层防御对照（全离线确定性）。判定 clone 能跑 = cd mcp-demo && npm i && npm run demo 复现「对照组 outbox 出现 attacker@evil.example 外泄 / 防御组 outbox 为空」+ 末行 `✅ demo 断言全部通过`（重放两次 digest 一致，node ≥ 18）；evaluation/multi-agent 复用它的「四层 defense-in-depth」与重放断言方法论',
    prerequisiteNote:
      '已上完沙箱与凭据（前置课带入 policy 门/egress 直觉）；只需 HTTP/JSON-RPC 与客户端-服务器的粗概念——MCP 的 Client/Server 特性与四层防御随 mcp-demo 边跑边建，不要求写过 MCP',
    isHorizontal: false,
  },
  {
    slug: 'evaluation',
    capstoneHook: 'M2 · 评测套件',
    stage: 'P1',
    domain: '评测工程化',
    title: '评测工程化',
    intro: '评测从 recall@k 升级成系统：judge 校准 / golden set 版本化 / CI 门禁',
    prereqs: ['rag'],
    next: ['multi-agent'],
    mvpSlug: 'rag-mvp',
    teachingFocus: 'judge / golden set 版本化 / CI 门禁 / 评测污染与记忆投毒同源',
    practicalOutput:
      '交付 = 一套评测体系方案（复用 rag-mvp 评测链，非新 MVP）：judge 校准 + golden set 版本化 + CI 门禁。判定 clone 能跑 = cd rag-demo && npm run demo:eval 复现 recall@3=0.31（132 chunks，PASS 3/8，10 题含 2 范围外拒答探针）；data-flywheel 复用它的「分母纪律 + 评测环节」，multi-agent 复用它的「轨迹级也要评」口径',
    prerequisiteNote:
      '已上完 RAG 并跑过 rag-demo（前置课带入 recall@k / golden set / 错误归因三件直觉）；只需 precision/recall + 抽样统计的粗概念——judge 校准 / 分母纪律 / CI 门禁的具体机制随 rag-demo 的 demo:eval 边跑边建',
    isHorizontal: false,
  },
  {
    slug: 'multi-agent',
    capstoneHook: 'M2 · 单线程写约束',
    stage: 'P1',
    domain: '多智能体编排',
    title: '多智能体编排',
    intro: '何时多智能体（读多路、写单线程）；给 harness-demo 设计子代理方案',
    prereqs: ['system-design', 'harness-from-scratch'],
    next: ['durable-execution'],
    mvpSlug: 'harness-mvp',
    teachingFocus: 'orchestrator-worker / 单线程写 / 子代理权限·凭据·trace',
    practicalOutput:
      '交付 = 一份子代理编排设计（复用 harness-mvp，非新 MVP；S7 四决策 walkthrough：进程内嵌套 / 节点健康 / 权限收紧 / 单线程写）。判定 clone 能跑 = cd harness-demo && npm run demo:reject 复现「单线程写 + 拒绝也是合法结果」+ npm run demo:otel:mock 复现 15 spans/1 trace（子代理 trace 埋点地基）；durable-execution 复用它的 loop / 恢复 / trajectory 骨架',
    prerequisiteNote:
      '已上完系统设计（前置课带入「谁和谁说话 × 怎么想」与读写分治）并能跑通 harness-demo；只需「顺序执行 vs 并发」的粗概念，不要求写过编排框架——orchestrator-worker 与子代理四决的具体机制随 harness-demo 的 demo:reject / demo:otel:mock 边跑边建',
    isHorizontal: false,
  },

  // ── P2 生产可靠性篇 ────────────────────────────────────────────────
  {
    slug: 'durable-execution',
    capstoneHook: 'M3 · durable（journal/checkpoint/幂等）',
    stage: 'P2',
    domain: 'durable execution',
    title: 'durable execution',
    intro: '长任务不丢不重：journal / checkpoint / 幂等；FinHot backfill 1645 行断点续跑',
    prereqs: ['harness-from-scratch', 'evaluation'],
    next: ['api-engineering'],
    mvpSlug: 'durable-execution-mvp',
    teachingFocus: 'journal 双锚点 / checkpoint 原子写 / 幂等键 / 未知态只读确认',
    practicalOutput:
      '交付 durable-execution-mvp（独占：durable-execution-demo/，src 821 行全离线确定性）。判定 clone 能跑 = cd durable-execution-demo && npm i && npm run demo 复现「3 崩溃点 × 各 3 次真实 SIGKILL → 副作用计数恒=1」+ 末尾 `✅ durable 验收通过`（恢复报告跨次 sha256 逐字节一致，node ≥ 18）；observability 复用它的「intent↔exec 配对 = 崩溃未知态」判据与确定性重放口径',
    prerequisiteNote:
      '已能跑通 harness-demo（前置课带入 session.ts 的最小 durable journal：intent→exec）并上完评测工程化（轨迹级评测 = 恢复正确性的验证手段）；只需「幂等 / 事务 / checkpoint」的粗概念——journal 双锚点 / 原子写 / 未知态只读确认的具体机制随 durable-execution-demo 的 npm run demo 边跑边建',
    isHorizontal: false,
  },
  {
    slug: 'api-engineering',
    capstoneHook: 'M3 · SSE/重试/路由/成本',
    stage: 'P2',
    domain: 'API 与多模型路由',
    title: 'API 与多模型路由',
    intro: '流式 / 结构化输出 / caching / 重试分类 / 路由 / 成本六模块',
    prereqs: ['harness-from-scratch'],
    next: ['observability'],
    mvpSlug: 'api-mvp',
    teachingFocus: 'SSE 流式 / 重试分类（4xx 不盲重试）/ 多模型路由 / 成本',
    practicalOutput:
      '交付 api-mvp（独占：api-demo/，六模块最小闭环，规格 notes/process/api-mvp-spec.md）。判定 clone 能跑 = cd api-demo && npm i && npm run demo 复现六模块断言（SSE 分帧 / schema 校验 / cache 命中 / 4xx 不重试 / 能力路由 / 成本归因）+ 末尾 `✅ api 验收通过`（全离线零 key、确定性、断言自测）；observability 复用它的「成本归因 + gen_ai.response.model 埋点」作为可观测上游',
    prerequisiteNote:
      '已能跑通 harness-demo（前置课带入 chatStream 的 SSE 三件事 + provider/context/压缩 + tc.name.trim() 防御性解析）；只需 HTTP 流式(SSE) / JSON 结构 / 基本成本概念的粗认知——六模块（流式 / 结构化 / caching / 重试分类 / 路由 / 成本）的具体机制随 api-demo 的 npm run demo 边跑边建，不要求用过 litellm / 真实多模型网关',
    isHorizontal: false,
  },
  {
    slug: 'observability',
    capstoneHook: 'M3 · OTel 埋点 + 成本归因',
    stage: 'P2',
    domain: '可观测',
    title: '可观测',
    intro: 'agent tracing 模型 + OTel GenAI 属性 + 成本归因；demo:otel 埋点实操',
    prereqs: ['api-engineering'],
    next: ['long-term-memory'],
    mvpSlug: 'obs-mvp',
    teachingFocus: 'trace/span/metric / 成本归因 / OTel GenAI 属性',
    practicalOutput:
      '交付 obs-mvp（v0：harness-demo 的 demo:otel 埋点，复用 harness-mvp 非新 MVP）。判定 clone 能跑 = cd harness-demo && npm run demo:otel:mock 复现 15 spans/1 trace（invoke_agent×1 + chat×6 + execute_tool×8，全离线无 key）+ npm run demo:otel:assert 断言形态/计数（exit 0 = 过）；data-flywheel 复用它的「可观测=数据采集、评测=决策」数据管道口径',
    prerequisiteNote:
      '已上完 API 与多模型路由（前置课带入「成本归因 = 路由决策输入」的账本意识）；只需 trace / span / metric 三个 OTel 术语的粗概念——OTel GenAI 属性族 / span 树建模 / burn-rate 告警的具体机制随 harness-demo 的 demo:otel:mock / demo:otel:assert 边跑边建',
    isHorizontal: false,
  },

  // ── P3 体系与数据篇 ────────────────────────────────────────────────
  {
    slug: 'long-term-memory',
    capstoneHook: 'M4 · 四类记忆 + 投毒防线',
    stage: 'P3',
    domain: '长期记忆',
    title: '长期记忆',
    intro: '四类记忆（写/读/遗忘/安全）；memory-redteam 自研子系统 16/16 守住',
    prereqs: ['rag'],
    next: ['data-flywheel'],
    mvpSlug: 'memory-mvp',
    teachingFocus: '记忆写读遗忘 / 冲突消解 / 记忆投毒四道防线',
    practicalOutput:
      '交付 memory-mvp（已实现：memory-redteam/，自研子系统零依赖）。判定 clone 能跑 = cd memory-redteam && npm run demo 复现「写入→召回→冲突消解→遗忘传播→跨会话持久化」全生命周期 + node test.mjs 正跑 16/16 条探针守住（exit 0）+ node test.mjs --ablate 逐层关防线探针须失败（18/18 层承重，exit 0）；rag 复用它的「混合检索 BM25∥向量 + RRF 融合」读路径底层，data-flywheel 复用它的「轨迹归档 = 情景记忆底座 + 评测/eval 结果分离」数据管道口径',
    prerequisiteNote:
      '已上完 RAG 与检索（前置课带入余弦相似度 + BM25/RRF 混合检索的底层机制，记忆读路径直接复用这套轮子）；只需「会话上下文有窗口上限、进程/会话之间默认无状态」的粗概念——四类记忆的存储介质 / 写读遗忘状态机 / 四道投毒防线随 memory-redteam 的 npm run demo + node test.mjs --ablate 边跑边建，不要求会 pi/Letta/Mem0 任一产品',
    isHorizontal: false,
  },
  {
    slug: 'data-flywheel',
    capstoneHook: 'M4 · 评测飞轮门禁',
    stage: 'P3',
    domain: '数据飞轮',
    title: '数据飞轮',
    intro: '把 FinHot 台账 + labeler 讲成「跑过一轮真实生产飞轮」的故事（含三轮评测指标）',
    prereqs: ['evaluation'],
    next: ['model-basics'],
    mvpSlug: 'flywheel-mvp',
    teachingFocus: '数据版本化 / 标签噪声 / 两轮降噪指标（precision 0.256→0.304→0.272）',
    practicalOutput:
      '交付 flywheel-mvp（独占：flywheel-demo/，四模块最小闭环，规格 notes/process/flywheel-mvp-spec.md）。判定 clone 能跑 = cd flywheel-demo && npm run demo 复现「脱敏台账样本 → filter/label 两轮降噪 → 指标 precision/f1/errors 单调可解释」断言 + 末尾 `✅ flywheel 验收通过`（全离线零 key、脱敏样本不碰生产数据、确定性）；evaluation 复用它的「评测 = 飞轮仪表盘」口径做上游，model-basics 复用它的「指标可归因需版本字段」前置',
    prerequisiteNote:
      '已上完评测工程化（前置课带入「评测 = 飞轮的仪表盘」+「golden set 版本化 + 指标基线 + CI 门禁」的对照意识）；只需「训练/评测数据要版本化、标签会有噪声」的粗概念——FinHot 台账字段 / 在线-离线数据通路 / labeler 两轮降噪闭环随 flywheel-demo 的 npm run demo 边跑边建，不要求会真实微调平台 / 数据平台',
    isHorizontal: false,
  },
  {
    slug: 'model-basics',
    capstoneHook: 'M4 · KV cache/成本走查',
    stage: 'P3',
    domain: '模型基础',
    title: '模型基础',
    intro: 'KV cache / 推理成本 / 微调意识 + 八股速查 16 题——够用不深挖',
    prereqs: ['llm-timeline'],
    next: ['framework-ecosystem'],
    mvpSlug: 'model-basics-mvp',
    teachingFocus: 'KV cache / 推理成本 / softmax 与矩阵乘法直觉 / 微调意识',
    practicalOutput:
      '交付 model-basics-mvp（独占：model-basics-demo/，KV cache / 推理成本数值走查脚本，规格 notes/process/model-basics-mvp-spec.md）。判定 clone 能跑 = cd model-basics-demo && npm run demo 复现「输入上下文长/输出预算/单价 → KV 命中 savings / 首 token 时间估算 / 总成本拆分」断言 + 末尾 `✅ model-basics 验收通过`（全离线零 key、纯计算脚本不调模型、确定性）；api-engineering 复用它的「成本 = token×单价×步数」理论底座，data-flywheel 复用它的「微调时机/取舍」意识',
    prerequisiteNote:
      '已上完 LLM 时间线（序章横向；前置课带入「模型是会持续换代的组件」时间轴：GPT 系 / o1 推理模型的代际差异）；只需「矩阵乘法 + softmax 是啥」的粗直觉——KV cache 机制 / prefill-decode 两阶段 / 推理成本构成 / 微调谱系随 model-basics-demo 的 npm run demo 边跑边建，不要求会 PyTorch / 推导 attention',
    isHorizontal: false,
  },

  // ── P4 收口与前沿篇 ────────────────────────────────────────────────
  {
    slug: 'framework-ecosystem',
    capstoneHook: 'M4 · 框架抽象边界',
    stage: 'P4',
    domain: '框架生态',
    title: '框架生态',
    intro: '框架给你什么 / 藏什么；framework-demo 四能力实操（allowedTools 抢跑坑）',
    prereqs: ['agent-harness'],
    next: ['industry-2026'],
    mvpSlug: 'framework-mvp',
    teachingFocus: '框架抽象边界 / allowedTools 抢跑实证 / 读 TS·Python SDK 文档',
    practicalOutput:
      '交付 framework-mvp（已实现：framework-demo/，三家 SDK 同任务离线 mock 对照 + Claude Agent SDK 四能力）。判定 clone 能跑 = cd framework-demo && npm run demo 复现四能力断言（10 条 ok() + demo 末行 1 条整体判定「4 个能力全部 ✅」，exit 0）+ npm run compare:assert 复现三家 16 条对照断言（exit 0，离线 mock 无 key）；系统设计/多智能体编排复用它的「三族坐标系 + 多智能体原语三条路」，observability 复用它的「可观测出口第四层」选型口径',
    prerequisiteNote:
      '已上完从零写 harness 的 agent-harness 底座（前置课带入「loop / 工具 / 权限 / 会话是四层可拆卸预制件」的拆解语言，本课用它拆任何框架）；只需会读 TS 接口签名 + CLI 输出——三家 SDK 的调用形状 / 权限钩子 / 恢复语义随 framework-demo 的 npm run compare + compare:assert 边跑边建，不要求会 Python / 背任何框架 API',
    isHorizontal: false,
  },
  {
    slug: 'industry-2026',
    capstoneHook: 'M4 · 收口素材（行业一手源）',
    stage: 'P4',
    domain: '行业前线调研',
    title: '行业前线调研（横向收口）',
    intro: '两轮外部调研核心论断 + 8 分水岭细节（均实抓官方一手源）；收口阅读',
    prereqs: [],
    next: [],
    mvpSlug: 'industry-research',
    teachingFocus: '行业一手源 / 8 分水岭细节 / 资深判断素材',
    practicalOutput:
      '交付 industry-research（横向资产·非代码：notes/industry-2026.md + notes/details/ 8 页）。判定 = 每条 [2026现行] 论断带官方一手源 URL + 文末 U-26 核实台账（curl / npm view 命令可重跑、结论分确认/需修正/无法确认三态）+ 文首截断时间点「2026-10-13 复核」；framework-ecosystem 复用它的「框架生态收敛」结论做 P4 收口，interview-bank 复用它的「八条分水岭 + 面试含义」做弹药',
    prerequisiteNote:
      '无硬前置（横向收口：建议先修完前 16 课再读）；只需会读「结论→出处→[稳定历史]/[2026现行] 标注」三元组——唯一门槛是时效判断而非技能，截断时间点已标在文首与核实台账（2026-10-13 复核），不要求会任何新工具',
    isHorizontal: true,
  },
];

/** 课程结构终值：mvpStatus 由 mvps.ts 词表派生（单一真源；映射不闭合则 fail-fast）。 */
export const COURSE_STRUCTURE: Course[] = COURSE_STRUCTURE_BASE.map((c) => ({
  ...c,
  mvpStatus: mvpStatusOf(c.mvpSlug),
}));

/** 课程页口径：17（不含 whiteboard 课程卡；§8.1 COURSE_COUNT）。 */
export const COURSE_COUNT = COURSE_STRUCTURE.length;

/** 五档阶段计数（P0:5 / P1:4 / P2:3 / P3:3 / P4:2 = 17），由 COURSE_STRUCTURE 派生。 */
export const STAGE_COUNTS = STAGES.reduce(
  (acc, s) => {
    acc[s] = COURSE_STRUCTURE.filter((c) => c.stage === s).length;
    return acc;
  },
  {} as Record<Stage, number>,
);

const BY_SLUG = new Map(COURSE_STRUCTURE.map((c, i) => [c.slug, { course: c, order: i }]));

/** 按 slug 取课程（含线性序 index）。 */
export function courseBySlug(slug: string): Course | undefined {
  return BY_SLUG.get(slug)?.course;
}

/** 课程在 §3 线性序中的 0 起始 index；未知 slug 返回 -1。 */
export function orderOf(slug: string): number {
  return BY_SLUG.get(slug)?.order ?? -1;
}

/**
 * 上一篇 / 下一篇（§8.1：用线性序 index 派生 = order-1 / order+1，
 * 不使用 next 字段重算序列）。
 */
export function prevCourse(slug: string): Course | undefined {
  const hit = BY_SLUG.get(slug);
  if (!hit) return undefined;
  return COURSE_STRUCTURE[hit.order - 1];
}

export function nextCourse(slug: string): Course | undefined {
  const hit = BY_SLUG.get(slug);
  if (!hit) return undefined;
  return COURSE_STRUCTURE[hit.order + 1];
}

/** 按阶段取课程（保持 §3 线性序）。 */
export function coursesByStage(stage: Stage): Course[] {
  return COURSE_STRUCTURE.filter((c) => c.stage === stage);
}