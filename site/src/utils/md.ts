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
 * 与站点主管线（astro.config.mjs 的 markdown 配置）的关系——**已逐项实测比对**（W4-A）：
 * 同一份 markdown 过两条管线，9 个样本里 8 个输出逐字节相同
 * （公式 / 表格 / 脚注 / 删除线 / 内嵌 HTML / 任务列表 / 代码块 / 标题锚点）。
 *
 * 唯一分歧是 mermaid 围栏的输出形态，且这是**有意的双路径**，不是漏对齐：
 *   - astro.config.mjs（主管线）：只产裸 `<div class="mermaid">`，figure 外壳由
 *     `src/scripts/mermaid.ts` 的 ensureFigure() 在**浏览器渲染时**补；
 *   - 本文件（mdToHtml，服务端直出 HTML）：构建期直接产完整
 *     `<figure class="mermaid-figure">…<figcaption>…</figcaption><noscript>…</noscript></figure>`，
 *     因为服务端没有客户端脚本可依赖，noscript 兜底只能在构建期写好。
 * 两条路径产出的 figure 结构同构，global.css 的 .mermaid-figure 规则因此都生效。
 *
 * 为何不抽成共享模块一次对齐：astro.config.mjs 不在 W4-A 的 inScope 内
 * （改它要动 shiki/base 等全局配置，属 W4-B/W4-C 范围），本文件在 scope 内却改不动
 * 主管线——硬抽只会得到"一份没人用的共享模块 + 主管线仍手抄"。故此处把差异写明，
 * 待 astro.config.mjs 解禁后可抽 `utils/remarkMermaid.ts` 供两边 import 收口。
 *
 * allowDangerousHtml 两侧都必须开：remarkMermaid 产出的 html 节点默认会被
 * remark-rehype 丢弃；Astro 主管线内部对 remarkRehype/rehypeStringify 默认就是
 * allowDangerousHtml:true，这里与它对齐（实测：不开则内嵌 HTML 与 mermaid 全被吞）。
 * footnotes:false：轨迹片段是局部渲染，不需要文末脚注区（主管线整页渲染才需要）。
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

/**
 * demoteInlineHeadings：把**片段** markdown 的标题整体降一级（h1→h2 … h5→h6）（2026-10-19，PRES-F2）。
 *
 * 为什么：mdToHtml 渲染的是**页面内的片段**（demo 文档、轨迹事件内容），宿主页面自己已经有
 * `<h1 class="page-title">`。片段里的 `# 标题` 若不降级，一页就会冒出多个 h1——线上实测
 * /works/ 有 **4 个**：`作品详解`（页面自己的，正确）+ `FinHot（示例项目文档）`
 * （来自 harness-demo/workspace/docs/README.md:1）+ `项目总结`×2（来自轨迹事件内容
 * harness-demo/trajectories/demo.example.jsonl）。多 h1 会让屏幕阅读器与文档大纲
 * 把内嵌文档标题误当页标题（上轮评审 PRES-F2，medium，复核时被标「未复核」）。
 *
 * 2026-10-19 复审划改：原文写 4 个 h1 的第二个来自
 * `harness-demo/workspace/docs/README.md:1`——works.astro 现已不内嵌 demo 文档，
 * mdToHtml 的调用方只有 TrajectoryTimeline（轨迹片段），那个 h1 实际也来自
 * 轨迹 jsonl 的 `# FinHot（示例项目文档）`。降级逻辑本身不变，出处记账更正。
 *
 * 只降一级、不整段拍平：保留片段内部的层级关系（否则 h2/h3 的相对层级会丢失）。
 */
function demoteInlineHeadings() {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      const m = /^h([1-6])$/.exec(node.tagName ?? '');
      if (m) node.tagName = `h${Math.min(Number(m[1]) + 1, 6)}`;
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
  .use(demoteInlineHeadings)
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
