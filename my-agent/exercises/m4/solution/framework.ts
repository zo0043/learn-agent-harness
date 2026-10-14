// ============================================================
// 框架边界对照 —— M4：五维「我搭的 vs 框架给的」+ allowedTools 抢跑对照
//   框架把 loop/权限/状态/可观测藏进 SDK；我搭过才知道它给我的边界在哪。
//   主线不引真实 SDK —— 对照是离线条目 + canUseTool 逻辑函数。
// ============================================================

/** 五维对照维度名（给全） */
export const DIMENSION_NAMES = Object.freeze(['loop 归属', '工具与 schema 声明', '权限与 HITL 钩子', '状态与中断恢复', '可观测钩子'] as const);

/** 三条 SDK 的抽象边界数据（给全，取自 framework-demo/src/compare.ts DIMENSIONS） */
export const SDK_COLUMNS: Record<string, string[]> = Object.freeze({
  'claude-agent-sdk': [
    'SDK 内置查询循环',
    '不声明函数工具：内置工具市场（Read/Bash）+ allowedTools/disallowedTools 过滤',
    'canUseTool 逐调用回调（进程内门，预执行拦截）',
    '会话 JSONL 落盘；resume: session_id 重建历史续跑',
    'hook 事件流（PreToolUse/PostToolUse…）',
  ],
  'openai-agents-sdk': [
    'SDK run(agent) 编排',
    'tool({ name, description, parameters: zod, strict: true }) 编译进请求',
    '无预执行权限门；人工审批 needsApproval=true（run 在审批点停下）',
    'RunState 内存态 toJSON()；approve() → run(agent, state) 续跑',
    'trace 事件（model/tool/handoff 计费事件）',
  ],
  'langgraph': [
    'SDK graph 编译成工作流',
    'tool({ schema: zod }) + model.bindTools() 编译进请求',
    '无预执行权限门；interrupt() 真挂起 → Command({ resume })',
    'MemorySaver checkpointer 按 thread_id 存全量；interrupt+resume 续跑',
    'callbacks 事件（on_chat_model/on_tool…）',
  ],
});

/** 「我搭的 my-agent」五维收口（给全，供对照表 mine 列） */
export const MINE_COLUMNS: readonly string[] = Object.freeze([
  '显式：手写 runLoop（parseModelReply / executeAndBackfill / runLoop）',
  '显式：ToolSpec + registry（name/description/parameters）',
  '显式：四通道 policy（deny>approve>sandbox>allow）+ 沙箱三边界',
  '显式：durable journal + checkpoint（intent→exec 双锚点）+ 幂等键',
  '自建：SpanNode span 树 + aggregateCosts 成本归因',
]);

const SDK_IDS = ['claude-agent-sdk', 'openai-agents-sdk', 'langgraph'] as const;

/** 五维对照表：「我搭的 vs 框架给的」——框架把 loop/权限/状态/可观测藏进 SDK，我搭过才知道边界在哪 */
export function compareTable(): Array<{ dim: string; mine: string; sdk: string[] }> {
  return DIMENSION_NAMES.map((dim, i) => ({
    dim,
    mine: MINE_COLUMNS[i],
    sdk: SDK_IDS.map((id) => SDK_COLUMNS[id][i]),
  }));
}

/**
 * allowedTools 抢跑对照：裸名 auto-approve 抢在 canUseTool 之前（SDK 明确警告）。
 * 正确写法 = 不把危险工具放 allowedTools，让它落入 canUseTool 逐调用拦截 → deny。
 */
export function allowedToolsRaceCheck(
  toolName: string,
  allowedTools: string[],
  canUseTool: (n: string, input: Record<string, unknown>) => { behavior: 'allow' | 'deny' },
): { behavior: 'allow' | 'deny'; via: string } {
  if (allowedTools.includes(toolName)) {
    return { behavior: 'allow', via: 'allowedTools 裸名 auto-approve（抢在 canUseTool 之前——危险，危险工具不该进 allowedTools）' };
  }
  return { ...canUseTool(toolName, {}), via: '未进 allowedTools → 落入 canUseTool 逐调用拦截（预执行权限门真的生效）' };
}