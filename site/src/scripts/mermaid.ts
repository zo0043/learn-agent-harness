/**
 * 前端 mermaid 渲染（客户端）。
 * 构建期所有 ```mermaid 围栏都被转成 <div class="mermaid">源码</div>
 * （站点主管线在 astro.config.mjs，只产裸 div；轨迹片段管线 utils/md.ts 直接产
 * <figure class="mermaid-figure">）；本脚本把裸 div 补上 figure/figcaption 语义，
 * 并负责首次渲染 + 主题切换时按新主题重渲染。
 * 仅在页面存在 .mermaid 元素时动态 import，避免无关页面加载 ~2MB 的 mermaid bundle。
 *
 * 无 JS 兜底（noscript）不在本文件——客户端代码在无脚本时不执行；提示由服务端产出：
 * md.ts 的 figure 标记内联 <noscript>，课程页由 c/[slug].astro 按页面是否含
 * ```mermaid 条件渲染。div 内的图表源码在渲染前与渲染失败后始终可见。
 */

function currentTheme(): 'default' | 'dark' {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default';
}

/** mermaid 源码首行 %% caption: 注释 → 图注文本；无则 null */
function captionOf(src: string): string | null {
  const firstLine = src.split('\n').find((l) => l.trim() !== '') ?? '';
  const m = firstLine.match(/^%%\s*caption:\s*(.+?)\s*$/);
  return m ? m[1] : null;
}

/**
 * innerHTML → 源码原文。innerHTML 序列化会把文本节点里的 > 转义成 &gt;（mermaid
 * 源码里满处是 --> 箭头），直接存会让再渲染读到 --&gt; 而 parse 失败；textarea
 * 是 RCDATA——标签不解析、实体被解码，恰好还原（与 mermaid 读取元素时自己的
 * entityDecode 等效）。
 */
function decodeEntities(html: string): string {
  const ta = document.createElement('textarea');
  ta.innerHTML = html;
  return ta.value;
}

/** 把裸 .mermaid div 包进 <figure class="mermaid-figure"> 并补 figcaption（已有 figure 则跳过） */
function ensureFigure(el: HTMLElement, ordinal: number): void {
  if (el.parentElement?.classList.contains('mermaid-figure')) return;
  const figure = document.createElement('figure');
  figure.className = 'mermaid-figure';
  el.parentNode?.insertBefore(figure, el);
  figure.appendChild(el);
  const figcaption = document.createElement('figcaption');
  figcaption.textContent = captionOf(el.dataset.msrc ?? '') ?? `图 ${ordinal}`;
  figure.appendChild(figcaption);
}

export async function renderAllMermaid(): Promise<void> {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('.mermaid'));
  if (nodes.length === 0) return;
  const { default: mermaid } = await import('mermaid');
  mermaid.initialize({
    startOnLoad: false,
    theme: currentTheme(),
    // securityLevel 保持 'strict'：v12.1.0 的 sanitizeMore 对 strict 仅做
    // removeScript（= DOMPurify），并不禁用 htmlLabels（getEffectiveHtmlLabels
    // 从不读 securityLevel）；渲染断言实测 strict 下 <br/> 换行正常。换 'loose'
    // 只会去掉这层 sanitize，零渲染收益——详见交付说明。
    securityLevel: 'strict',
    fontFamily: 'inherit',
    // v12 起 htmlLabels 是全局项（flowchart.htmlLabels 已 deprecated）。notes 的
    // <br/> 换行标签分布在 flowchart / stateDiagram-v2 等多种图型，只有全局开启
    // 能全覆盖（本次修复前 <br/> 全部退化的根因是 msrc 采集丢了标签，见下）。
    htmlLabels: true,
    flowchart: { curve: 'basis' },
  });
  for (const [ordinal, el] of nodes.entries()) {
    // 首次：用 innerHTML 记住源码（序列化保留 <br/> 元素），但必须 entityDecode——
    // 否则 --> 箭头会以 --&gt; 形态存下来，再渲染时 parse 直接失败。
    // mermaid.run 读的就是 innerHTML（读后自己做 entityDecode + <br> 归一化）；
    // 若用 textContent 采集，浏览器已解析的 <br/> 会被当元素丢掉，换行从此失踪。
    if (el.dataset.msrc == null) el.dataset.msrc = decodeEntities(el.innerHTML);
    const src = el.dataset.msrc;
    // mermaid.run 跳过带 data-processed 的节点——主题切换重渲染必须先摘掉该属性
    el.removeAttribute('data-processed');
    el.innerHTML = '';
    // textContent 赋值生成文本节点，序列化时 <br/> 被转义，mermaid 读取时 entityDecode 还原
    el.textContent = src;
    ensureFigure(el, ordinal + 1);
    try {
      await mermaid.run({ nodes: [el] });
      el.classList.remove('mermaid-error');
      el.parentElement?.querySelector('.mermaid-error-hint')?.remove();
    } catch (err) {
      // 源码已由上面的 textContent 还原可见；补一条读者可见的人话提示（技术错误仍留 console）
      el.classList.add('mermaid-error');
      console.error('[mermaid] 渲染失败：', err);
      let hint = el.parentElement?.querySelector('.mermaid-error-hint') ?? null;
      if (!hint) {
        hint = document.createElement('p');
        hint.className = 'mermaid-error-hint';
        el.insertAdjacentElement('afterend', hint);
      }
      hint.textContent = '该图渲染失败，已显示源码。';
    }
  }
}

document.addEventListener('lah:theme-change', () => {
  if (document.querySelector('.mermaid')) void renderAllMermaid();
});
