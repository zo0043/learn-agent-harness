import { defineConfig } from 'astro/config';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { visit } from 'unist-util-visit';

/**
 * 把 ```mermaid 代码块转成 <div class="mermaid">…</div>，
 * 绕开 shiki（mermaid 不是代码高亮语言），由前端 mermaid 库渲染。
 */
function remarkMermaid() {
  return (tree) => {
    visit(tree, 'code', (node) => {
      if (node.lang === 'mermaid') {
        node.type = 'html';
        node.value = `<div class="mermaid">\n${node.value}\n</div>`;
      }
    });
  };
}

/**
 * demoteNoteH1：把「笔记原文渲染页」正文的首个 h1 降级为 h2（C2/PRES-F1）。
 *
 * 为什么：/map、/interview 走 NotePageLayout，该布局现在自己输出页面的 <h1>（排在 before 槽之前）；
 * 而 notes/knowledge-map.md、notes/interview-bank.md 正文首行是 `# 标题`——不降级就会出现两个 h1，
 * 且正文那个仍排在 before 槽的 h2 之后，大纲倒置未真正修好。
 *
 * 为什么只对这两篇生效：其余笔记（/c/<slug>、/details/<slug>）的 markdown h1 就是页面的唯一标题；
 * 全局降级会让这 25 页失去 h1（visual-check 的 `article.markdown h1` 断言随即失败）。
 *
 * 识别方式：unified pipeline 传入的 vfile 带源文件路径（Astro 自身 rehype-collect-headings
 * 就依赖 file.history[0]）。**路径缺失时不降级**——保守回退，宁可保留旧行为，也不误伤 25 个课程页。
 */
function demoteNoteH1() {
  const NOTE_PAGES = new Set(['knowledge-map.md', 'interview-bank.md']);
  return (tree, file) => {
    const src = file?.history?.[0] ?? file?.path ?? '';
    const name = String(src).split(/[\\/]/).pop();
    if (!NOTE_PAGES.has(name)) return;
    let seenFirst = false;
    visit(tree, 'heading', (node) => {
      if (seenFirst) return;
      seenFirst = true;
      if (node.depth === 1) node.depth = 2;
    });
  };
}

export default defineConfig({
  site: 'https://blog.zero43.top/learn-agent-harness/',
  base: '/learn-agent-harness/',
  markdown: {
    remarkPlugins: [remarkGfm, remarkMath, remarkMermaid],
    rehypePlugins: [demoteNoteH1, [rehypeKatex, { throwOnError: false, strict: false }]],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});
