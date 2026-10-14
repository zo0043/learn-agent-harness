// ============================================================
// 工具协议底座 —— M1（read_file 给全 + search 打分排序 + 多工具注册）
//   read_file 照搬 M0；search 是「检索=打分排序」的最小子集（不做 BM25 的 IDF/长度归一全套）
// ============================================================
import { type ToolSpec } from './types.js';

/** 确定性检索语料（预置固定，不读真实数据源） */
const CORPUS = [
  { id: 'c1', doc: 'bm25', text: 'BM25 是词频饱和的概率检索函数，k1 控制饱和程度。' },
  { id: 'c2', doc: 'harness', text: 'agent loop = read prompt → call LLM → parse → execute 工具 → 回填。' },
];

const search: ToolSpec = {
  name: 'search',
  description: '检索知识库（demo：分词打分排序，取 topK）',
  readonly: true,
  parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
  execute: async (args) => {
    const query = String(args.query ?? '').toLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    // 词面命中打分：doc 命中 +1、正文命中 +1；同分保持 CORPUS 原序（确定性）
    const scored = CORPUS.map((c) => {
      let score = 0;
      for (const t of terms) {
        if (c.doc.toLowerCase().includes(t)) score += 1;
        if (c.text.toLowerCase().includes(t)) score += 1;
      }
      return { ...c, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const topK = scored.slice(0, 2);
    return JSON.stringify(topK.map(({ id, doc, score }) => ({ id, doc, score })));
  },
};

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
  return new Map([
    [read_file.name, read_file],
    [search.name, search],
  ]);
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