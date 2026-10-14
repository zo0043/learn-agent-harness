// ============================================================
// 沙箱：内存世界 + 三道边界（makeWorld 给全；挖 m2.2 三边界）
//   权限门管意图，沙箱管影响范围：路径(workspace) / env(白名单) / 网络(egress 禁用)
// ============================================================
import { TODOError, type SandboxConfig } from './types.js';

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

export function assertInWorkspace(_workspace: string, _raw: string): string {
  // TODO m2.2：规范化相对路径，拒绝绝对路径 / `..` 越根，返回 workspace 内路径
  throw new TODOError('m2.2: 实现沙箱路径边界');
}

export class Sandbox {
  constructor(readonly config: SandboxConfig, readonly world: World, readonly hostEnv: Record<string, string>) {}

  path(_raw: string): string {
    throw new TODOError('m2.2: 实现沙箱路径边界');
  }

  env(_name: string): string | undefined {
    throw new TODOError('m2.2: 实现沙箱 env 白名单与网络禁用边界');
  }

  openNetwork(_target: string): never {
    throw new TODOError('m2.2: 实现沙箱 env 白名单与网络禁用边界');
  }
}

/** 沙箱通道执行：副作用工具（write_file）写进隔离世界（base 给全，边界在两上函数里挖） */
export function runSandboxed(tool: string, args: Record<string, unknown>): string {
  if (tool !== 'write_file') throw new Error(`未知沙箱工具: ${tool}`);
  const config: SandboxConfig = { workspace: 'work', envWhitelist: ['LANG'], network: 'deny' };
  const sb = new Sandbox(config, makeWorld('sandbox'), { LANG: 'C', SECRET: 'token-42' });
  const p = sb.path(String(args.path ?? ''));
  sb.world.fs.set(p, String(args.content ?? ''));
  sb.world.change(`write_file ${p}`);
  return `沙箱写入成功: ${p}`;
}