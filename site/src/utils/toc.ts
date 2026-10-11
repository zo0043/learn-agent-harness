/**
 * 从 markdown 正文提取 h2/h3 目录，id 算法与 github-slugger 对齐
 * （Astro 默认 heading id 生成器），保证 TOC 锚点可跳转。
 */
export interface TocItem {
  id: string;
  text: string;
  depth: 2 | 3;
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    // 只保留 Unicode 字母（含中文）/数字/组合符/空白/连字符
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function extractToc(body: string): TocItem[] {
  const items: TocItem[] = [];
  const counts = new Map<string, number>();
  let inFence = false;

  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.*)$/.exec(line);
    if (!m) continue;
    const raw = m[2].trim();
    const text = raw.replace(/[*_`~[\]()]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim();
    let id = slugify(raw);
    const n = counts.get(id) ?? 0;
    counts.set(id, n + 1);
    if (n > 0) id = `${id}-${n}`;
    items.push({ id, text, depth: m[1].length as 2 | 3 });
  }
  return items;
}
