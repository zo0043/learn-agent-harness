/**
 * 前端 mermaid 渲染（客户端）。
 * 构建期所有 ```mermaid 围栏 / <Mermaid> 组件都被转成 <div class="mermaid">源码</div>；
 * 本脚本负责首次渲染 + 主题切换时按新主题重渲染。
 * 仅在页面存在 .mermaid 元素时动态 import，避免无关页面加载 ~2MB 的 mermaid bundle。
 */

function currentTheme(): 'default' | 'dark' {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default';
}

export async function renderAllMermaid(): Promise<void> {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('.mermaid'));
  if (nodes.length === 0) return;
  const { default: mermaid } = await import('mermaid');
  mermaid.initialize({
    startOnLoad: false,
    theme: currentTheme(),
    securityLevel: 'strict',
    fontFamily: 'inherit',
    flowchart: { htmlLabels: true, curve: 'basis' },
  });
  for (const el of nodes) {
    // 首次：记住源码（主题切换重渲染用）
    if (el.dataset.msrc == null) el.dataset.msrc = el.textContent ?? '';
    const src = el.dataset.msrc;
    el.innerHTML = '';
    el.textContent = src;
    try {
      await mermaid.run({ nodes: [el] });
      el.classList.remove('mermaid-error');
    } catch (err) {
      el.classList.add('mermaid-error');
      console.error('[mermaid] 渲染失败：', err);
    }
  }
}

document.addEventListener('lah:theme-change', () => {
  if (document.querySelector('.mermaid')) void renderAllMermaid();
});
