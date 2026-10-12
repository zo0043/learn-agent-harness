// ============================================================
// mock 外部世界（离线、确定性）
//   MockMessageService：消息队列。ledger = 外部世界的记忆 —— runner 只能投递 / 只读查询，
//                       不能改历史；服务端**不去重**（真实队列的 at-least-once 语义），
//                       所以"盲重放"会真实产生第二条副作用，计数才会说话。
//   MockDb：业务库，幂等写的落点（upsert by key，重复写最终状态收敛）。
// 两者各有自己的状态目录（.state/mock-service、.state/mock-db），runner 的 .state 清理只在
// 试验之间由 demo  harness 做 —— 对应"外部世界不随进程崩溃而消失"。
// ============================================================
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { readJsonFile, writeJsonAtomic } from "./state.js";

export interface Delivery {
  messageId: string;
  idemKey: string;
  payload: string;
}

/** mock 外部服务①：消息队列（非幂等副作用的落点） */
export class MockMessageService {
  constructor(private readonly dir: string) {
    mkdirSync(dir, { recursive: true });
  }

  private get ledgerPath(): string {
    return `${this.dir}/ledger.jsonl`;
  }

  /** 投递 = 真实副作用。idempotency key 随请求带上，但服务端按原样落账本（不去重） */
  deliver(idemKey: string, payload: string): Delivery {
    const rec: Delivery = { messageId: `msg-${String(this.deliveries() + 1).padStart(4, "0")}`, idemKey, payload };
    appendFileSync(this.ledgerPath, `${JSON.stringify(rec)}\n`);
    return rec;
  }

  /** 只读核对（unknown→confirm 的唯一依据）：这个 idempotency key 送达过吗 */
  lookup(idemKey: string): { delivered: boolean; record: Delivery | null } {
    const hit = this.records().find((r) => r.idemKey === idemKey) ?? null;
    return { delivered: hit !== null, record: hit };
  }

  records(): Delivery[] {
    if (!existsSync(this.ledgerPath)) return [];
    const out: Delivery[] = [];
    for (const line of readFileSync(this.ledgerPath, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        out.push(JSON.parse(line) as Delivery);
      } catch {
        // 撕裂行忽略
      }
    }
    return out;
  }

  /** 副作用计数 = 账本行数（验收指标：必须恒=1） */
  deliveries(): number {
    return this.records().length;
  }
}

/** mock 外部服务②：业务库（幂等写的落点） */
export class MockDb {
  constructor(private readonly dir: string) {
    mkdirSync(dir, { recursive: true });
  }

  private get file(): string {
    return `${this.dir}/rows.json`;
  }

  upsert(key: string, value: string): string {
    const rows = this.rows();
    rows[key] = value;
    writeJsonAtomic(this.file, rows);
    return value;
  }

  get(key: string): string | null {
    const rows = this.rows();
    return key in rows ? rows[key] : null;
  }

  rows(): Record<string, string> {
    const raw = readJsonFile(this.file);
    return raw && typeof raw === "object" ? (raw as Record<string, string>) : {};
  }
}

export class ExternalWorld {
  readonly msg: MockMessageService;
  readonly db: MockDb;

  constructor(stateDir: string) {
    this.msg = new MockMessageService(`${stateDir}/mock-service`);
    this.db = new MockDb(`${stateDir}/mock-db`);
  }
}
