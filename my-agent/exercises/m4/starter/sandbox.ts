// ============================================================
// 沙箱：内存世界 + 三道边界（makeWorld 给全；三边界 m2.2 补全）
//   权限门管意图，沙箱管影响范围：路径(workspace) / env(白名单) / 网络(egress 禁用)
// ============================================================
import { BoundaryViolation, type SandboxConfig } from './types.js';

export interface Container {
  name: string;
  image: string;
  builtFrom: string;
  startedAtStep: number;
}

export interface World {
  ns: string;
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

/** 路径边界：workspace 是相对根，raw 是相对路径；拒绝对路径/`..` 越根（纯字符串逻辑，不碰真实 FS） */
export function assertInWorkspace(workspace: string, raw: string): string {
  if (raw === '' || raw.startsWith('/') || raw.includes('\0'))
    throw new BoundaryViolation('path', `非法路径（空或绝对路径）: ${raw}`);
  const segs: string[] = [];
  for (const seg of raw.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') {
      if (segs.length === 0) throw new BoundaryViolation('path', `路径越出根: ${raw}`);
      segs.pop();
    } else segs.push(seg);
  }
  const rel = segs.join('/');
  if (rel === '') return workspace;
  return `${workspace}/${rel}`;
}

export class Sandbox {
  constructor(readonly config: SandboxConfig, readonly world: World, readonly hostEnv: Record<string, string>) {}

  path(raw: string): string {
    return assertInWorkspace(this.config.workspace, raw);
  }

  /** env 边界：只有白名单可见；敏感凭据不进 agent 可见 env（env 是最大泄漏面） */
  env(name: string): string | undefined {
    if (!this.config.envWhitelist.includes(name)) return undefined;
    return this.hostEnv[name];
  }

  /** 网络边界：egress 默认禁用 —— 调用即违规 */
  openNetwork(target: string): never {
    if (this.config.network !== 'deny') {
      throw new BoundaryViolation('network', `egress 策略异常: ${this.config.network}`);
    }
    throw new BoundaryViolation('network', `egress 禁用: 尝试访问 ${target}`);
  }
}

/** 沙箱通道执行：副作用工具（write_file）写进隔离世界（base 给全，边界在两上函数） */
export function runSandboxed(tool: string, args: Record<string, unknown>): string {
  if (tool !== 'write_file') throw new Error(`未知沙箱工具: ${tool}`);
  const config: SandboxConfig = { workspace: 'work', envWhitelist: ['LANG'], network: 'deny' };
  const sb = new Sandbox(config, makeWorld('sandbox'), { LANG: 'C', SECRET: 'token-42' });
  const p = sb.path(String(args.path ?? ''));
  sb.world.fs.set(p, String(args.content ?? ''));
  sb.world.change(`write_file ${p}`);
  return `沙箱写入成功: ${p}`;
}