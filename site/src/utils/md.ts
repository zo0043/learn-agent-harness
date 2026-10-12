import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';

/** mermaid 源码首行 %% caption: 注释 → 图注文本；无则 null */
function captionOf(src: string): string | null {
  const firstLine = src.split('\n').find((l) => l.trim() !== '') ?? '';
  const m = firstLine.match(/^%%\s*caption:\s*(.+?)\s*$/);
  return m ? m[1] : null;
}

/**
 * 与站点主管线（astro.config.mjs 的 remarkMermaid）对齐：mermaid 围栏 →
 * <figure class="mermaid-figure">（让 global.css 的 .mermaid-figure 规则生效），
 * figcaption 取源码首行 %% caption: 注释，否则按页内序号自动编号『图 N』。
 * figure 内联 <noscript> 兜底：无 JS 时（客户端脚本不执行）div 里显示的是
 * 图表源码，noscript 给读者一句人话说明。
 */
function remarkMermaid() {
  return (tree: any) => {
    let ordinal = 0;
    visit(tree, 'code', (node: any) => {
      if (node.lang === 'mermaid') {
        ordinal += 1;
        const caption = captionOf(node.value) ?? `图 ${ordinal}`;
        node.type = 'html';
        node.value = [
          '<figure class="mermaid-figure">',
          '<div class="mermaid">',
          node.value,
          '</div>',
          `<figcaption>${esc(caption)}</figcaption>`,
          '<noscript><p class="mermaid-noscript">此图需要 JavaScript 才能渲染；无脚本时上面显示的是图表源码。</p></noscript>',
          '</figure>',
        ].join('\n');
      }
    });
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkMermaid)
  // remark-rehype 只做 mdast→hast 转换，不设 compiler；末尾必须接 rehype-stringify
  // 才有 compiler（之前缺这一步导致 build 期 mdToHtml 抛 Cannot `process`
  // without `compiler`）。
  // allowDangerousHtml（toHast 侧）：让 remarkMermaid 产出的 html 节点保留为
  // hast raw 节点（默认会被丢弃）；stringify 侧同名选项让 raw 原样输出，
  // 与站点主管线（Astro markdown）对内嵌 HTML 的行为一致。
  .use(remarkRehype, { footnotes: false, allowDangerousHtml: true })
  .use(rehypeKatex, { throwOnError: false, strict: false })
  .use(rehypeStringify, { allowDangerousHtml: true });

/** 构建期 markdown → HTML（用于轨迹事件内容等片段渲染），KaTeX 与站点主管线一致 */
export async function mdToHtml(md: string): Promise<string> {
  const file = await processor.process(md);
  return String(file);
}

/** HTML 转义（轨迹里的 JSON/参数展示用） */
export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
