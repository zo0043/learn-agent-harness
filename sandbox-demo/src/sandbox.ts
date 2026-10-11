// ============================================================
// 沙箱：内存版"真实世界" + 执行环境边界（S1：权限门与沙箱是两道独立的门）
//   权限门回答"能不能做"（意图）；沙箱回答"做了能炸多大"（影响范围）
//   三条边界：路径（workspace）/ env（白名单）/ 网络（egress 默认禁用，S3）
//   状态变更记入 world.log（审计底账，S5）；时间用步序号（逻辑时钟，S6 可复现）
// ============================================================
import type { SandboxConfig } from "./types.js";
import { BoundaryViolation } from "./types.js";

export interface Container {
  name: string;
  image: string;
  builtFrom: string; // 镜像构建自哪棵目录树 —— 幽灵事故的根因证据
  startedAtStep: number; // 启动时所在步序号（逻辑时钟，替代 Date.now()）
}

export interface World {
  ns: string; // 命名空间：沙箱执行有自己的世界视图，生产容器不可见
  fs: Map<string, string>;
  containers: Map<string, Container>;
  log: string[];
  change(msg: string): void;
}

export function makeWorld(ns: string, fs: Record<string, string> = {}, containers: Container[] = []): World {
  return {
    ns,
    fs: new Map(Object.entries(fs)),
    containers: new Map(containers.map((c) => [c.name, c])),
    log: [],
    change(m: string) {
      this.log.push(m);
    },
  };
}

/** 宿主世界：生产基线（finfo worker/api 由正常树 work/ainews-new 构建）+ 幽灵树 */
export function makeHostWorld(): World {
  return makeWorld("host",
    {
      "work/ainews-new/README.md": "FinHot（生产）：editorial / ledger / labeler",
      "work/ainews-old/README.md": "AINews（废弃树，无 editorial/ledger/labeler）——事故里的幽灵树",
    },
    [
      { name: "finfo-worker", image: "finfo-worker:2026.10.08", builtFrom: "work/ainews-new", startedAtStep: 0 },
      { name: "finfo-api", image: "finfo-api:2026.10.08", builtFrom: "work/ainews-new", startedAtStep: 0 },
    ]);
}

/** 沙箱内的会话视图：只含 workspace 下的文件；容器为空（自己的命名空间，生产不可见） */
export function makeSandboxWorld(ns: string, host: World, workspace: string): World {
  const fs: Record<string, string> = {};
  for (const [k, v] of host.fs) if (k === workspace || k.startsWith(workspace + "/")) fs[k] = v;
  return makeWorld(ns, fs);
}

/**
 * 路径边界：规范化逻辑路径并确认落在 workspace 内（纯字符串逻辑，不碰真实 FS）
 *   绝对路径直接拒；不越过根；不得落到 workspace 外（跨树=跨会话，S1 并行污染场景）
 */
export function assertInWorkspace(workspace: string, raw: string): string {
  if (raw === "" || raw.startsWith("/") || raw.includes("\0"))
    throw new BoundaryViolation("path", `非法路径（空或绝对路径）: ${raw}`);
  const segs: string[] = [];
  for (const seg of raw.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") {
      if (segs.length === 0) throw new BoundaryViolation("path", `路径越出根: ${raw}`);
      segs.pop();
    } else segs.push(seg);
  }
  const resolved = segs.join("/");
  if (resolved !== workspace && !resolved.startsWith(workspace + "/"))
    throw new BoundaryViolation("path", `路径越出 workspace: ${raw}（workspace=${workspace}）`);
  return resolved;
}

export class Sandbox {
  constructor(
    readonly config: SandboxConfig,
    readonly world: World, // 该沙箱的隔离世界视图（自己的命名空间）
    readonly hostEnv: Record<string, string>,
  ) {}

  /** 路径边界 */
  path(raw: string): string {
    return assertInWorkspace(this.config.workspace, raw);
  }

  /** env 边界：只有白名单可见；敏感凭据不进 agent 可见的 env（S4：env 是最大泄漏面） */
  env(name: string): string | undefined {
    if (!this.config.envWhitelist.includes(name)) return undefined;
    return this.hostEnv[name];
  }

  /** 网络边界：egress 默认禁用 —— 断言永远成立，调用即违规（S3：egress 是最难关的一档） */
  openNetwork(target: string): never {
    if (this.config.network !== "deny") {
      throw new BoundaryViolation("network", `egress 策略异常: ${this.config.network}`);
    }
    throw new BoundaryViolation("network", `egress 禁用: 尝试访问 ${target}`);
  }
}
