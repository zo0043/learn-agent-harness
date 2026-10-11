// ============================================================
// ③ 工具协议：注册表 + JSON schema 校验 + 执行
//    ⑤ 的路径范围在这里落实（沙箱的执行层实现）
// ============================================================
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ToolSpec } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url)); // src/ 目录（不是文件路径！）
/** workspace 根：工具只允许碰这个目录（范围控制，见课程 harness 第七节） */
export const WORKSPACE_ROOT = resolve(__dirname, "..", "workspace");

export class ToolError extends Error {}

/**
 * 简化 JSON schema 校验（面试版：required + type + enum，不引 zod）。
 * 生产用 zod/ajv，但面试要能手写这三层检查。
 */
export function validateArgs(schema: Record<string, unknown>, args: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const props = (schema.properties ?? {}) as Record<string, { type?: string; enum?: unknown[] }>;
  for (const req of (schema.required ?? []) as string[]) {
    if (!(req in args)) errors.push(`缺必填参数 ${req}`);
  }
  for (const [k, v] of Object.entries(args)) {
    const p = props[k];
    if (!p) {
      errors.push(`未知参数 ${k}`);
      continue;
    }
    if (p.type && typeof v !== p.type) errors.push(`参数 ${k} 应为 ${p.type}，实际 ${typeof v}`);
    if (p.enum && !p.enum.includes(v)) errors.push(`参数 ${k} 须为 ${p.enum.join("/")} 之一`);
  }
  return errors;
}

/** 路径范围：相对路径一律基于 workspace 解析，越界即拒 */
function scoped(p: string): string {
  const abs = resolve(WORKSPACE_ROOT, p);
  if (abs !== WORKSPACE_ROOT && !abs.startsWith(WORKSPACE_ROOT + "/")) {
    throw new ToolError(`路径越出 workspace：${p}`);
  }
  return abs;
}

const s = (description: string) => ({ type: "string", description });

/** 注册表：每个工具 = schema（给模型看的文档）+ execute（给执行器用的代码） */
export function buildRegistry(): Map<string, ToolSpec> {
  const tools: ToolSpec[] = [
    {
      name: "get_weather",
      description: "查询城市天气（demo：返回内置假数据）",
      readonly: true,
      parameters: { type: "object", properties: { city: s("城市名") }, required: ["city"] },
      execute: async ({ city }) => JSON.stringify({ city: String(city), weather: "晴 28°C", source: "fake-demo-data" }),
    },
    {
      name: "list_dir",
      description: "列出 workspace 内某目录下的文件与子目录",
      readonly: true,
      parameters: { type: "object", properties: { path: s("相对路径，如 docs") }, required: ["path"] },
      execute: async ({ path }) => JSON.stringify(readdirSync(scoped(String(path)))),
    },
    {
      name: "read_file",
      description: "读取 workspace 内一个文件",
      readonly: true,
      parameters: { type: "object", properties: { path: s("相对路径") }, required: ["path"] },
      execute: async ({ path }) => readFileSync(scoped(String(path)), "utf8"),
    },
    {
      name: "write_file",
      description: "写入 workspace 内一个文件（有副作用，需审批）",
      parameters: { type: "object", properties: { path: s("相对路径"), content: s("文件内容") }, required: ["path", "content"] },
      execute: async ({ path, content }) => {
        const abs = scoped(String(path));
        mkdirSync(resolve(abs, ".."), { recursive: true });
        writeFileSync(abs, String(content), "utf8");
        return `已写入 ${String(path)}（${String(content).length} 字符）`;
      },
    },
    {
      name: "run_shell",
      description: "执行 shell 命令（demo：会被策略拒绝，用于演示 deny 路径）",
      parameters: { type: "object", properties: { command: s("命令") }, required: ["command"] },
      execute: async ({ command }) => `[demo] 已执行: ${command}`,
    },
  ];
  return new Map(tools.map((t) => [t.name, t]));
}

/** 转成 API 的 tools 参数格式 */
export function toolSchemas(registry: Map<string, ToolSpec>): unknown[] {
  return [...registry.values()].map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

/** 校验 + 执行。任何失败都抛 ToolError，由 agent 层转成"回写的错误结果" */
export async function callTool(registry: Map<string, ToolSpec>, name: string, args: Record<string, unknown>): Promise<string> {
  const spec = registry.get(name);
  if (!spec) throw new ToolError(`未知工具: ${name}`);
  const errors = validateArgs(spec.parameters, args ?? {});
  if (errors.length) throw new ToolError(`参数校验失败: ${errors.join("; ")}`);
  return await spec.execute(args ?? {});
}
