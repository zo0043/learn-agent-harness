// ============================================================
// ⑥ 会话持久化 + ⑦ 恢复
//    原则：JSONL 日志是唯一事实源；上下文由日志"派生"（可重建）
//    未知状态 = tool_intent 已记、tool_exec 缺失（崩溃点）
// ============================================================
import { appendFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";
import type { Message, ToolSpec, TrajectoryEvent } from "./types.js";

export class Session {
  private path: string;
  constructor(
    dir: string,
    public id: string,
  ) {
    this.path = `${dir}/${id}.jsonl`;
  }
  get file() {
    return this.path;
  }
  exists() {
    return existsSync(this.path);
  }
  /** 同步写：进程被 kill 时已 append 的行不丢（崩溃检测的前提） */
  append(ev: TrajectoryEvent) {
    mkdirSync(dirname(this.path), { recursive: true });
    appendFileSync(this.path, JSON.stringify(ev) + "\n");
  }
  remove() {
    if (existsSync(this.path)) unlinkSync(this.path);
  }
  loadAll(): TrajectoryEvent[] {
    return readFileSync(this.path, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l) as TrajectoryEvent);
  }
  start(system: string, user: string) {
    this.append({ kind: "init", system, user, startedAt: Date.now() });
  }
}

export interface Rebuilt {
  messages: Message[];
  /** intent 已记但 exec 缺失的工具调用（⑦ 未知状态） */
  unknownIntents: { id: string; name: string; args: Record<string, unknown> }[];
}

/** 从日志重建上下文（确定性规则，可重复执行） */
export function rebuild(events: TrajectoryEvent[], _registry: Map<string, ToolSpec>): Rebuilt {
  void _registry;
  const init = events.find((e) => e.kind === "init");
  if (!init || init.kind !== "init") throw new Error("日志缺少 init 事件，无法重建");
  const messages: Message[] = [
    { role: "system", content: init.system },
    { role: "user", content: init.user },
  ];
  const intents = new Map<string, { id: string; name: string; args: Record<string, unknown> }>();
  const executed = new Set<string>();

  for (const e of events) {
    if (e.kind === "model_response") messages.push(e.assistant);
    else if (e.kind === "tool_intent") intents.set(e.id, e);
    else if (e.kind === "tool_exec") {
      executed.add(e.id);
      messages.push({
        role: "tool",
        tool_call_id: e.id,
        name: e.name,
        content:
          e.status === "ok"
            ? e.result ?? "ok"
            : e.status === "denied"
              ? `[策略拒绝] ${e.result ?? "该操作不被允许"}`
              : e.status === "error"
                ? `[工具错误] ${e.result ?? "执行异常"}`
                : `[未知状态] ${e.result ?? ""}`,
      });
    }
  }
  const unknownIntents = [...intents.values()].filter((i) => !executed.has(i.id));
  return { messages, unknownIntents };
}
