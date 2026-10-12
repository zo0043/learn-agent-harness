// ============================================================
// 持久层（S2 三机制中的两个）
//   Journal：.state/journal.jsonl，每步 intent→exec，同步 append（进程被杀不丢行）
//   Checkpoint：.state/checkpoint.json，每 N 步快照；写临时文件 + 原子 rename（防毒快照）
//   Idempotency Store：.state/idempotency.json，幂等写 key→结果（持久层，非进程内存）
// 全部落在 .state/（运行产物，可随时删除重来）
// ============================================================
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { Checkpoint, CheckpointDone, JournalEvent, JournalInput } from "./types.js";

/** 每完成 N 步落一次快照（粗粒度 checkpoint = 重放加速器） */
export const CHECKPOINT_EVERY = 2;

export function sha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

/** canonical JSON：键排序 + 无空白 → 跨进程/跨次字节一致（报告 sha256 对比的前提） */
export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const rec = value as Record<string, unknown>;
  return `{${Object.keys(rec)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(rec[k])}`)
    .join(",")}}`;
}

/** 原子写：临时文件 + rename（S9.1 #2 毒快照防御第一件套） */
export function writeJsonAtomic(path: string, value: unknown): void {
  writeFileSync(`${path}.tmp`, canonical(value));
  renameSync(`${path}.tmp`, path);
}

export function readJsonFile(path: string): unknown | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch {
    return null;
  }
}

export class Store {
  private seq = 0;

  constructor(readonly dir: string) {
    mkdirSync(dir, { recursive: true });
    for (const e of this.readJournal()) this.seq = Math.max(this.seq, e.seq);
  }

  get journalPath(): string {
    return `${this.dir}/journal.jsonl`;
  }
  get checkpointPath(): string {
    return `${this.dir}/checkpoint.json`;
  }
  get idempotencyPath(): string {
    return `${this.dir}/idempotency.json`;
  }

  /** 同步 append：进程被 SIGKILL 时已写入的行一定在（崩溃检测的前提） */
  append(ev: JournalInput): JournalEvent {
    const full = { ...ev, seq: ++this.seq } as JournalEvent;
    appendFileSync(this.journalPath, `${JSON.stringify(full)}\n`);
    return full;
  }

  readJournal(): JournalEvent[] {
    if (!existsSync(this.journalPath)) return [];
    const out: JournalEvent[] = [];
    for (const line of readFileSync(this.journalPath, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        out.push(JSON.parse(line) as JournalEvent);
      } catch {
        // 撕裂行（写一半被杀）：不参与恢复，宁可重做也不从错乱状态重放
      }
    }
    return out;
  }

  writeCheckpoint(done: CheckpointDone[], seq: number): Checkpoint {
    const ck: Checkpoint = { version: 1, seq, lastStep: done.length ? done[done.length - 1].step : 0, done, checksum: "" };
    ck.checksum = sha256(canonical({ version: ck.version, seq: ck.seq, lastStep: ck.lastStep, done: ck.done }));
    writeJsonAtomic(this.checkpointPath, ck);
    return ck;
  }

  /** 读快照并校验；校验失败（毒快照）→ 当没有快照，退回全量重放 journal */
  readCheckpoint(): { ck: Checkpoint | null; valid: boolean } {
    const raw = readJsonFile(this.checkpointPath) as Checkpoint | null;
    if (!raw || typeof raw !== "object" || !Array.isArray(raw.done)) return { ck: null, valid: false };
    const { checksum, ...rest } = raw;
    const ok = typeof checksum === "string" && checksum === sha256(canonical(rest));
    return ok ? { ck: raw, valid: true } : { ck: null, valid: false };
  }

  readIdempotency(): Record<string, string> {
    const raw = readJsonFile(this.idempotencyPath);
    return raw && typeof raw === "object" ? (raw as Record<string, string>) : {};
  }

  writeIdempotency(key: string, result: string): void {
    const cur = this.readIdempotency();
    cur[key] = result;
    const sorted: Record<string, string> = {};
    for (const k of Object.keys(cur).sort()) sorted[k] = cur[k];
    writeJsonAtomic(this.idempotencyPath, sorted);
  }
}
