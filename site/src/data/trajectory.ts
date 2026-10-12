import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * harness-demo 轨迹数据加载：**真实产物优先，仓库内脱敏样例兜底**。
 *
 * 背景（P-13）：`harness-demo/trajectories/` 是 demo 运行产物，被 .gitignore 排除
 * （可再生产物，不该进仓库）。于是 GitHub Actions / 新克隆上该目录为空，
 * /works#trajectory 永远是"轨迹文件不在仓库中"的空占位——一个花了两节讲
 * 「JSONL 是唯一事实源」的作品，线上却拿不出任何一条轨迹。
 *
 * 解法：把一份**脱敏样例** `demo.example.jsonl` 提交进仓库（.gitignore 用
 * `trajectories/*` + `!trajectories/demo.example.jsonl` 白名单放行——注意不能写
 * 目录级 `trajectories/`，那会让 git 根本不 descend 进去、negation 永不生效，已实测），
 * 本模块按「真实 → 样例」顺序取第一个非空来源：
 *   本地跑过 `npm run demo`  → 用真实产物（数据最新，覆盖样例）
 *   CI / 新克隆              → 用样例（页面有东西可看，不再是空占位）
 *
 * **两个来源都没有时构建失败（throw），不静默空渲染**：样例是提交进仓库的文件，
 * 走到这一步只可能是仓库被改坏（例如白名单被删）——那正是要用构建失败暴露的问题，
 * 而不是让页面继续显示"文件不在仓库中"把故障藏起来。与本站其他 fail-fast 一致
 * （parseRagStats 解析失败即构建失败、c/[slug] 的 bankAnchor 找不到小节即抛）。
 *
 * 事件字段（实测 demo.jsonl）：
 *   init:            { kind, system, user, startedAt }
 *   model_response:  { kind, assistant: { content, tool_calls: [{ id, name, arguments }] }, finishReason, ms, usage }
 *   tool_intent:     { kind, id, name, args }
 *   tool_exec:       { kind, id, name, status: "ok"|"denied", result, ms }
 *   compaction:      { kind, ... }（低阈值压缩模式下出现）
 *   final:           { kind, content, totalMs }
 */
export interface TrajEvent {
  kind: string;
  [k: string]: unknown;
}

/** 数据来源：real = 本地真实 demo 产物；example = 仓库内脱敏样例 */
export type TrajectorySource = 'real' | 'example';

export interface TrajectoryLoad {
  events: TrajEvent[];
  /** 兼容 TrajectoryTimeline 的既有判空；两个来源都没有时已在下方 throw，不会为 false */
  available: boolean;
  source: TrajectorySource;
  /** 页面标注数据源用（相对仓库根） */
  file: string;
}

const here = dirname(fileURLToPath(import.meta.url));
const trajDir = resolve(here, '../../../harness-demo/trajectories');

const REAL_FILE = 'demo.jsonl';
const EXAMPLE_FILE = 'demo.example.jsonl';

/** JSONL 解析：行号级报错（不说"文件坏了"而是说第几行、为什么），空行跳过 */
function parseJsonl(raw: string, file: string): TrajEvent[] {
  const events: TrajEvent[] = [];
  raw.split('\n').forEach((line, idx) => {
    const l = line.trim();
    if (!l) return;
    let ev: unknown;
    try {
      ev = JSON.parse(l);
    } catch (e) {
      throw new Error(
        `trajectory.ts：${file} 第 ${idx + 1} 行不是合法 JSON（${(e as Error).message}）——轨迹文件损坏；修文件或删掉它让下一个来源生效`,
      );
    }
    if (typeof ev !== 'object' || ev === null || typeof (ev as { kind?: unknown }).kind !== 'string') {
      throw new Error(`trajectory.ts：${file} 第 ${idx + 1} 行缺少字符串 kind 字段——不是合法轨迹事件`);
    }
    events.push(ev as TrajEvent);
  });
  return events;
}

export const trajectory: TrajectoryLoad = (() => {
  // 顺序即优先级：真实产物 → 脱敏样例。空文件不当来源（继续往下找），
  // 避免"文件在但是空的"又把页面打回占位。
  const candidates: [TrajectorySource, string][] = [
    ['real', REAL_FILE],
    ['example', EXAMPLE_FILE],
  ];
  for (const [source, file] of candidates) {
    const p = resolve(trajDir, file);
    if (!existsSync(p)) continue;
    const events = parseJsonl(readFileSync(p, 'utf8'), file);
    if (events.length === 0) continue;
    return { events, available: true, source, file: `harness-demo/trajectories/${file}` };
  }
  throw new Error(
    `trajectory.ts：${REAL_FILE} 与 ${EXAMPLE_FILE} 都不存在——样例文件应随仓库提交，` +
      `请检查根 .gitignore 的白名单 !harness-demo/trajectories/demo.example.jsonl 是否被误删`,
  );
})();
