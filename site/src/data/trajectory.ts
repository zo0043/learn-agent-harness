import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 构建时静态导入 harness-demo/trajectories/demo.jsonl（真实 demo 运行轨迹）。
 * 注意：harness-demo/trajectories/ 被仓库 .gitignore 排除（可再生产物），
 * 所以 GitHub Actions 上该文件不存在 → available=false，页面显示占位说明，build 不报错。
 *
 * 事件字段（实测 demo.jsonl）：
 *   init:            { kind, system, user, startedAt }
 *   model_response:  { kind, assistant: { content, tool_calls: [{ id, name, arguments }] }, finishReason, ms }
 *   tool_intent:     { kind, id, name, args }
 *   tool_exec:       { kind, id, name, status: "ok"|"denied", result, ms }
 *   compaction:      { kind, ... }（低阈值压缩模式下出现）
 *   final:           { kind, content, totalMs }
 */
export interface TrajEvent {
  kind: string;
  [k: string]: unknown;
}

const here = dirname(fileURLToPath(import.meta.url));
const trajPath = resolve(here, '../../../harness-demo/trajectories/demo.jsonl');

export const trajectory: { events: TrajEvent[]; available: boolean } = (() => {
  try {
    if (!existsSync(trajPath)) return { events: [], available: false };
    const raw = readFileSync(trajPath, 'utf8');
    const events = raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l) as TrajEvent);
    return { events, available: true };
  } catch {
    return { events: [], available: false };
  }
})();
