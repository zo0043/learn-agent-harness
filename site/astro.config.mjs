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
 * 关于「笔记正文首个 h1」的处理（2026-10-19 更正，PRES-F1）：
 *
 * 这里原先有一个 demoteNoteH1 插件，靠 `file.history[0]` 的**文件名**判断是不是
 * knowledge-map.md，命中才把首个 h1 降为 h2。
 *
 * **它在真实构建里从未生效**：content 集合条目经 `content-entry-type.js` 渲染时是
 * `fileURL: entry.filePath ? pathToFileURL(entry.filePath) : void 0`，而 glob 加载的条目
 * **没有 `filePath`** ⇒ vfile 不带路径 ⇒ 插件走「路径缺失时不降级」的保守分支 ⇒ 静默 no-op。
 * 线上实测：/map/ 曾输出 **2 个 h1**（`h1.page-title` + 笔记自己的 h1），
 * 而终审只在**隔离环境**里测过该函数（自造 vfile 带路径），所以当时判成「已修」。
 *
 * 现改为**在源头修正**：这两篇笔记的首个标题本身已是 `## `（页面标题由 NotePageLayout
 * 的 h1 承担），不再需要任何降级插件——没有「静默失效」这条路径，且由
 * `site/tools/visual-check.mjs` 的「h1 唯一性」断言守着（多 h1 即 CI 红）。
 */
export default defineConfig({
  site: 'https://blog.zero43.top/learn-agent-harness/',
  base: '/learn-agent-harness/',
  markdown: {
    remarkPlugins: [remarkGfm, remarkMath, remarkMermaid],
    rehypePlugins: [[rehypeKatex, { throwOnError: false, strict: false }]],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});
