// ============================================================
// JSONL 会话 —— M1（挖 m1.3）：events 是唯一事实源，上下文由日志派生
//   每行一条事件，重启时 loadAll 读日志 → rebuild 出 messages。
// ============================================================
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TODOError, type Message, type TrajectoryEvent } from './types.js';

export class Session {
  constructor(private dir: string, public id: string) {}

  get file(): string {
    return join(this.dir, `${this.id}.jsonl`);
  }

  append(_event: TrajectoryEvent): void {
    throw new TODOError('m1.3: 实现 JSONL 会话写入与重建');
  }

  loadAll(): TrajectoryEvent[] {
    throw new TODOError('m1.3: 实现 JSONL 会话写入与重建');
  }

  exists(): boolean {
    throw new TODOError('m1.3: 实现 JSONL 会话写入与重建');
  }

  start(_system: string, _user: string): void {
    throw new TODOError('m1.3: 实现 JSONL 会话写入与重建');
  }

  rebuild(_events: TrajectoryEvent[]): Message[] {
    throw new TODOError('m1.3: 实现 JSONL 会话写入与重建');
  }
}