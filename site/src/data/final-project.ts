// ============================================================
// final-project.ts —— 毕业项目（生成层收口）站点数据源
//   与 notes/capstone-final.md 逐字一致（单一真源；learn.astro 只读它渲染，不另造文案）。
// ============================================================

/** 生成层纪律（一句话，capstone-final.md §2） */
export const GENERATIVE_DISCIPLINE =
  '本页不提供 starter / TODO / 参考答案，学员从空目录起步。';

/** 三步技能层级（capstone-final.md §1） */
export const SKILL_LADDER = [
  { level: '追踪（track）', train: '看懂确定性 demo', given: '完整可跑源码', judge: 'demo 自带断言' },
  { level: '补全（complete）', train: '把 TODO 补对', given: 'starter + solution', judge: 'assert:m<N> 三态' },
  { level: '生成（generate）', train: '从模糊需求自己设计实现', given: '只有命题 + 判据 + 引导', judge: '你自己的 assert.mjs + MANIFEST.md' },
];

/** 三命题（capstone-final.md §3，标题 + 一句话摘要） */
export const FINAL_SUBJECTS = [
  {
    key: 'a-research',
    title: '命题 A · 个人研究助理（research-assistant）',
    summary: '查资料 → 记笔记 → 定时提醒，带权限门 / 可自评 / 可恢复。',
  },
  {
    key: 'b-repo-guard',
    title: '命题 B · 仓库巡检门禁（repo-guard）',
    summary: '读变更 → 跑检查 → 写报告 → 放行/拦截，带沙箱边界 / golden 评测 / 可观测。',
  },
  {
    key: 'c-signal-arbiter',
    title: '命题 C · 带噪信号方向判断器（signal-arbiter）',
    summary: '带噪 label 两轮降噪 → 门禁提案，带飞轮 / 模型意识 / 可恢复。',
  },
];

/** 黑盒判据 B1–B5（capstone-final.md §4.1，与 rubric.mjs 逐字一致） */
export const FINAL_BLACKBOX = [
  ['B1', '确定性', '同一输入连跑两次 diff 空'],
  ['B2', '主任务跑通', '某条端到端输入→预期断言过'],
  ['B3', '权限/沙箱拦停', '危险动作被拒且副作用未发生'],
  ['B4', '崩溃可恢复', '中断后重启，副作用恰好一次'],
  ['B5', '评测自评', 'golden set（≥3 条）达标 + 打印指标'],
] as const;

/** 白盒要素 W1–W7（capstone-final.md §4.2，与 rubric.mjs 逐字一致） */
export const FINAL_WHITEBOX = [
  ['W1', 'loop 想→做→说 + 终止判定', 'M0'],
  ['W2', '≥2 工具按名分发', 'M1'],
  ['W3', '默认 deny / 白名单 / 多通道（其一）', 'M1/M2'],
  ['W4', 'golden set + 可跑断言', 'M2'],
  ['W5', 'journal / checkpoint / 幂等（其一）', 'M3'],
  ['W6', 'span / metric / 结构化日志（其一）', 'M3'],
  ['W7', '记忆 / 评测飞轮 / 模型成本意识（M4 三选一）', 'M4'],
] as const;

/** 自测引导三步（capstone-final.md §5） */
export const FINAL_SELF_CHECK = [
  '先黑盒跑通：断言一行都别写，先让成品对 2–3 个手工输入跑通（主场景 + 危险动作）。',
  '再白盒自查：逐条写 MANIFEST.md 指认 W1–W7 的实现位置。',
  '再补断言：把手工输入固化成确定性断言（B1–B5），连跑两次 diff 空。',
];

/** 判据运行入口（capstone-final-structure.md §3.2） */
export const FINAL_GRADE_CMD = 'node grade.mjs <成品目录>';

/** 毕业判据一句话收口（capstone-final.md §6） */
export const FINAL_CLOSING =
  '你搭出的这个，与 M4 的 my-agent 同级——同样的确定性、同样的权限/评测/可恢复/可观测纪律——且它是你从空目录、从模糊需求、独立设计出来的。';