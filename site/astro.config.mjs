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

export default defineConfig({
  site: 'https://zo0043.github.io/learn-agent-harness/',
  markdown: {
    remarkPlugins: [remarkGfm, remarkMath, remarkMermaid],
    rehypePlugins: [[rehypeKatex, { throwOnError: false, strict: false }]],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});
