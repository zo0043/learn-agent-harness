/**
 * TOC 条目类型。
 *
 * 2026-10-19 复审：本文件原有的 `extractToc()` 与自带 `slugify()` **已删除**——
 * 那是一个对 github-slugger 的手工复刻，三处偏差（①–⑫ 属 `\p{N}` 被保留而 slugger
 * 删除、折叠连字符、`_`→`-`）让 87/385 条目录锚点与 Astro 真实 heading id 不一致，
 * 点了不跳转（rag.md 13/15、harness-from-scratch.md 10/12 全中），而三道门禁全绿。
 *
 * 现在 id 一律取 `await render(entry)` 返回的 `headings[].slug`——与渲染用的
 * **同一条 remark 管线**（rehype-collect-headings + github-slugger）产出，
 * 从根上同源，不再有第二份实现需要同步。用法见 c/[slug].astro / map.astro。
 *
 * 不要再往这里加 slug 算法：复刻一次漂一次。
 */
export interface TocItem {
  id: string;
  text: string;
  depth: 2 | 3;
}
