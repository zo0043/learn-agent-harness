#!/usr/bin/env node
/**
 * chrome.mjs —— 本仓 Chromium 可执行文件的**唯一解析点**（G0-4 / 03-D3(a)）。
 *
 * 为什么抽出来：`viz/render.mjs` 与 `viz/mermaid-check.mjs` 各自内联了一份候选路径；
 * `mermaid-check.mjs` 曾把「某台机器上某个 playwright revision 的 chrome 绝对路径」
 * 写死成常量——换机器 / 换 checkout / 换 playwright 版本后就找不到浏览器（不是报错，
 * 是直接崩栈）。抽成一个候选表后，两个调用方共用同一套探测顺序，且路径是**探测派生**
 * 的，不是手抄常量（纪律 #5：修显示值不如修生成器）。
 *
 * 候选顺序（**保持 render.mjs 原顺序不变**，只在末尾追加同族的 search 兜底）：
 *   1. `$CHROME_PATH`（显式覆盖，优先级最高；保留本仓既有约定）
 *   2. `~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`（本机既有安装，headless shell 之外的完整 chromium）
 *   3. `~/.cache/ms-playwright/chromium-1234/chrome-linux/chrome`（旧目录布局）
 *   4. `/usr/bin/google-chrome`
 *   5. `/usr/bin/chromium`
 *   6. `npx playwright` 自带安装目录下**按目录名 glob 探测**的 `chromium-<rev>/chrome-linux64/chrome`
 *      （playwright 版本升级会改 revision 号，写死 1234 必失效——这就是原来那条硬编码的病因）
 *
 * 用法：`import { resolveChrome } from './chrome.mjs'`；找不到返回 `null`（调用方负责给出明确错误）。
 */
import fs from 'node:fs';
import path from 'node:path';

/** 所有候选路径（按优先级）。导出是为了让调用方能把「探测过什么」打进错误信息。 */
export function chromeCandidates() {
  const home = process.env.HOME || '';
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH || `${home}/.cache/ms-playwright`;
  const list = [
    process.env.CHROME_PATH,
    `${cache}/chromium-1234/chrome-linux64/chrome`,
    `${cache}/chromium-1234/chrome-linux/chrome`,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];
  // 兜底：按 revision glob 探测（写死版本号是原缺陷的病因，这里用目录枚举根治）。
  try {
    for (const d of fs.readdirSync(cache).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
      list.push(`${cache}/${d}/chrome-linux64/chrome`);
      list.push(`${cache}/${d}/chrome-linux/chrome`);
    }
  } catch {
    /* 目录不存在：候选表就停在上面的静态项 */
  }
  return list.filter(Boolean);
}

/** 返回第一个**真实存在且可执行**的浏览器路径；找不到返回 null。 */
export function resolveChrome() {
  for (const p of chromeCandidates()) {
    try {
      fs.accessSync(p, fs.constants.X_OK);
      return p;
    } catch {
      /* 试下一个 */
    }
  }
  return null;
}

/** 找不到浏览器时的统一错误信息（明确告诉人怎么办，而不是让调用方崩 ENOENT）。 */
export function chromeNotFoundMessage() {
  return [
    'no Chromium/Chrome binary found.',
    `  probed: ${chromeCandidates().join(', ')}`,
    '  fix: set CHROME_PATH=/path/to/chrome, or install one',
    '       (`npx playwright install --with-deps chromium`), or',
    '       (`apt-get install -y chromium` / `google-chrome`).',
  ].join('\n');
}

// 直接执行时的诊断入口：`node viz/chrome.mjs` 打印解析结果（发给验收命令用）。
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const exe = resolveChrome();
  if (exe) console.log(exe);
  else {
    console.error(chromeNotFoundMessage());
    process.exit(1);
  }
}
