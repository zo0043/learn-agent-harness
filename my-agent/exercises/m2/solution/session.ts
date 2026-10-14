// ============================================================
// JSONL 会话 —— M1：events 是唯一事实源，上下文由日志派生
//   每行一条事件，重启时 loadAll 读日志 → rebuild 出 messages。
// ============================================================
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Message, type TrajectoryEvent } from './types.js';

export class Session {
  constructor(private dir: string, public id: string) {}

  get file(): string {
    return join(this.dir, `${this.id}.jsonl`);
  }

  append(event: TrajectoryEvent): void {
    mkdirSync(this.dir, { recursive: true });
    appendFileSync(this.file, JSON.stringify(event) + '\n', 'utf8');
  }

  loadAll(): TrajectoryEvent[] {
    if (!this.exists()) return [];
    const text = readFileSync(this.file, 'utf8');
    return text
      .split('\n')
      .filter((l) => l.trim() !== '')
      .map((l) => JSON.parse(l) as TrajectoryEvent);
  }

  exists(): boolean {
    return existsSync(this.file);
  }

  start(system: string, user: string): void {
    this.append({ kind: 'init', system, user });
  }

  rebuild(events: TrajectoryEvent[]): Message[] {
    const messages: Message[] = [];
    for (const ev of events) {
      if (ev.kind === 'init') {
        messages.push({ role: 'system', content: ev.system });
        messages.push({ role: 'user', content: ev.user });
      } else if (ev.kind === 'assistant') {
        if (ev.deliver) {
          messages.push({ role: 'assistant', content: ev.deliver });
        } else if (ev.tool_calls) {
          for (const tc of ev.tool_calls) {
            const exec = events
              .filter((e): e is Extract<TrajectoryEvent, { kind: 'tool_exec' }> => e.kind === 'tool_exec')
              .find((e) => e.id === tc.id);
            messages.push({ role: 'assistant', content: null, tool_calls: [tc] });
            if (exec?.status === 'ok') {
              messages.push({ role: 'tool', tool_call_id: exec.id, name: exec.name, content: exec.result ?? '' });
            } else if (exec?.status === 'denied') {
              messages.push({ role: 'tool', tool_call_id: exec.id, name: exec.name, content: '[策略拒绝] 白名单外工具' });
            } else if (exec?.status === 'error') {
              messages.push({ role: 'tool', tool_call_id: exec.id, name: exec.name, content: `[工具错误] ${exec.result ?? ''}` });
            } else {
              // intent 已记而 exec 缺失 → 未知状态标注（不丢这一意图）
              messages.push({ role: 'tool', tool_call_id: tc.id, name: tc.name, content: '[未知状态] 工具执行未记录' });
            }
          }
        }
      } else if (ev.kind === 'final') {
        messages.push({ role: 'assistant', content: ev.content });
      }
      // tool_exec 事件已在上面的 assistant 段里与 intent 配对回填，不单独 push
    }
    return messages;
  }
}