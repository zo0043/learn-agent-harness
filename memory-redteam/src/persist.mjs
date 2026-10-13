// 跨会话持久化 —— 事件日志（JSONL）落盘 → 新进程重建
//
// 设计（对齐 notes/long-term-memory.md [S2]「工作→情景：轨迹全部落盘，是审计、恢复、评测的底座」
// 与 [S3] schema 纪律「每条记忆独立成句、自包含、带元数据」）：
//   不是把最终数组 dump 成 JSON，而是把**每次变更作为事件追加**：
//     {"t":"header", v, clock}                        日志头（记录基准时钟，便于事后核对确定性）
//     {"t":"item", item:{…完整快照…}}                  条目新增或状态迁移后的快照（同 id 后写覆盖前写）
//     {"t":"audit", rec:{op,id,…}}                     [S7 防御4] 审计留痕
//   重建 = 顺序重放：同 id 的事件替换到**首次出现的下标**，因此重建后的 items 顺序与进程内一致。
//   追加写（append-only）而不是覆写：崩溃时已落盘的前缀仍然可重放（与 durable execution 的 journal 同源）。
//
// 诚实边界（不宣称什么）：
//   · 单进程、单写者。没有文件锁 / 多进程并发控制（多写者会交错写坏日志，本版本不防）。
//   · 没有 fsync / 原子重命名：崩溃可能丢掉最后若干条。durable-execution-demo 处理的是这个问题的完整版。
//   · 命中计数（hit_count / last_hit_at）**不在持久化范围内**（读路径的回写信号，本轮不落日志）——
//     跨进程等价性断言已显式排除这两个字段，见 persist-check.mjs 的输出声明。

import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createStore, hydrate, FIXED_NOW } from './memory.mjs';

export const JOURNAL_VERSION = 1;

/** 追加写 sink：交给 createStore(overrides, { sink }) 使用 */
export function createJsonlSink(file) {
  const dir = dirname(file);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const lines = [];
  return {
    file,
    /** 事件缓冲在内存里，flush() 时一次性追加（避免每条都开文件句柄；仍是 append-only） */
    push(ev) {
      lines.push(JSON.stringify(ev));
    },
    flush() {
      if (lines.length === 0) return 0;
      appendFileSync(file, `${lines.join('\n')}\n`);
      const n = lines.length;
      lines.length = 0;
      return n;
    },
  };
}

export function resetJournal(file, clock = FIXED_NOW) {
  const dir = dirname(file);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(file, `${JSON.stringify({ t: 'header', v: JOURNAL_VERSION, clock })}\n`);
}

/**
 * 读日志并重放。
 * 返回 { items, audit, events, corrupt } —— corrupt > 0 表示日志里有坏行（本套件自产日志必须为 0）。
 */
export function loadJournal(file) {
  const raw = readFileSync(file, 'utf8');
  const items = [];
  const index = new Map();
  const audit = [];
  let events = 0;
  let corrupt = 0;
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      corrupt += 1;
      continue;
    }
    events += 1;
    if (ev.t === 'item') {
      const at = index.get(ev.item.id);
      if (at === undefined) {
        index.set(ev.item.id, items.length);
        items.push(ev.item);
      } else {
        items[at] = ev.item; // 同 id 后写覆盖前写，保留下标（= 进程内的首次出现序）
      }
    } else if (ev.t === 'audit') {
      audit.push(ev.rec);
    }
  }
  return { items, audit, events, corrupt };
}

/** 新进程重建：createStore + hydrate（重放日志） */
export function rebuildFromJournal(file, overrides = {}) {
  const { items, audit, events, corrupt } = loadJournal(file);
  const store = createStore(overrides);
  hydrate(store, { items, audit }); // 编号继续、字段就位——重放逻辑只有一份（memory.mjs）
  return { store, meta: { events, corrupt, items: items.length, audit: audit.length } };
}

/** 日志文件清理（演示/测试重复运行时保证可重跑） */
export function removeJournal(file) {
  if (existsSync(file)) rmSync(file);
}
