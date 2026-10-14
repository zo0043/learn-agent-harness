// ============================================================
// 工具协议底座 —— M0（单工具 read_file + 注册表 + 执行，给全不挖）
//   read_file 返回内置固定内容（不读真实文件系统，保证确定性 + 零 fs 依赖）
//   （参数校验 / 路径范围控制留 M1/M2；M0 只保留「查注册表 + 执行 + 未知工具抛错」最小协议）
// ============================================================
import type { ToolSpec } from './types.js';

export function buildRegistry(): Map<string, ToolSpec> {
  const read_file: ToolSpec = {
    name: 'read_file',
    description: '读取一个文件（demo：返回内置固定内容）',
    readonly: true,
    parameters: {
      type: 'object',
      properties: { path: { type: 'string', description: '文件路径' } },
      required: ['path'],
    },
    execute: async () => 'hello from my-agent',
  };
  return new Map([[read_file.name, read_file]]);
}

export async function callTool(
  registry: Map<string, ToolSpec>,
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  const spec = registry.get(name);
  if (!spec) throw new Error(`未知工具: ${name}`);
  return await spec.execute(args ?? {});
}