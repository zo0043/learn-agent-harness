#!/usr/bin/env node
/**
 * render.mjs — render an SVG file to a PNG for Obsidian embedding.
 *
 * Usage:
 *   node viz/render.mjs <input.svg> [output.png] [--bg white] [--scale 2] [--width 1000]
 *
 * Defaults: output = input with .png extension; bg = white; scale = 2 (Retina-sharp);
 *           width = the SVG's own width (or derived from viewBox, else 1000).
 *
 * Uses playwright-core (needs node >= 18) + a locally installed Chromium
 * (no browser download — reuses ~/.cache/ms-playwright). If the node on PATH
 * is too old, this script re-execs itself with the newest node >= 18 found in
 * ~/.nvm/versions/node. Override the browser with CHROME_PATH, the node with LEARN_NODE.
 */
import { spawn } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MIN_NODE = 18;
const major = parseInt(process.versions.node.split(".")[0], 10);

function findModernNode() {
  if (process.env.LEARN_NODE) return process.env.LEARN_NODE;
  const base = `${process.env.HOME}/.nvm/versions/node`;
  let versions = [];
  try {
    versions = readdirSync(base)
      .filter((v) => /^v\d+/.test(v))
      .sort((a, b) => parseInt(b.slice(1)) - parseInt(a.slice(1)));
  } catch (e) {
    return null;
  }
  for (const v of versions) {
    if (parseInt(v.slice(1)) >= MIN_NODE) return `${base}/${v}/bin/node`;
  }
  return null;
}

// Re-exec under a modern node; the child keeps stdio and the event loop alive.
if (major < MIN_NODE) {
  const node = findModernNode();
  if (!node) {
    console.error(`render.mjs needs node >= ${MIN_NODE}, current is ${process.versions.node}, and no newer node found in ~/.nvm/versions/node. Set LEARN_NODE.`);
    process.exit(1);
  }
  const child = spawn(node, [fileURLToPath(import.meta.url), ...process.argv.slice(2)], { stdio: "inherit" });
  child.on("exit", (c, s) => process.exit(c != null ? c : s ? 1 : 0));
  child.on("error", (e) => {
    console.error(e.message);
    process.exit(1);
  });
  // never falls through to main()
}

async function main() {
  const { chromium } = await import("playwright-core");

  // G0-4：浏览器候选表已抽到 viz/chrome.mjs（唯一解析点）。候选**顺序未变**：
  //   CHROME_PATH → ms-playwright chromium-1234 ×2 → /usr/bin/google-chrome → /usr/bin/chromium，
  // 仅在末尾追加了 revision 目录 glob 兜底——写死 1234 会在 playwright 升级后失效（原缺陷病因）。
  const { resolveChrome, chromeNotFoundMessage } = await import("./chrome.mjs");

  const argv = process.argv.slice(2);
  const input = argv[0];
  const output = argv[1] && !argv[1].startsWith("--") ? argv[1] : null;
  const flag = (name, dflt) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
  };

  if (!input) {
    console.error("usage: node viz/render.mjs <input.svg> [output.png] [--bg white] [--scale 2] [--width 1000]");
    process.exit(1);
  }

  const inPath = resolve(input);
  const outPath = output ? resolve(output) : inPath.replace(/\.svg$/i, "") + ".png";
  const bg = flag("bg", "white");
  const scale = Number(flag("scale", "2"));
  const widthArg = flag("width", null) ? Number(flag("width", null)) : null;

  const svg = readFileSync(inPath, "utf8");

  // Determine intrinsic size: explicit width/height attrs win, else viewBox aspect.
  const attr = (name) => {
    const m = svg.match(new RegExp(`\\b${name}=["']([^"']+)["']`));
    return m ? parseFloat(m[1]) : NaN;
  };
  let width = widthArg || attr("width");
  let height = attr("height");
  if (isNaN(width) || !width) width = 1000;
  if (isNaN(height) || !height) {
    const vb = svg.match(/\bviewBox=["']\s*([-0-9.e]+)\s+([-0-9.e]+)\s+([-0-9.e]+)\s+([-0-9.e]+)/);
    if (vb && parseFloat(vb[3]) > 0) height = width * (parseFloat(vb[4]) / parseFloat(vb[3]));
    else height = width;
  }

  const chrome = resolveChrome();
  if (!chrome) {
    console.error(chromeNotFoundMessage());
    process.exit(1);
  }

  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: Math.ceil(width), height: Math.ceil(height) },
      deviceScaleFactor: scale,
    });
    const html = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:${bg};}body{display:inline-block}</style>
</head><body>${svg}</body></html>`;
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForTimeout(150); // let fonts/layout settle
    const body = page.locator("body");
    await body.screenshot({ path: outPath, omitBackground: bg === "transparent" });
  } finally {
    await browser.close();
  }
  console.log(outPath);
}

if (major >= MIN_NODE) {
  main().catch((e) => {
    console.error(e && e.message ? e.message : e);
    process.exit(1);
  });
} else {
  // old node: re-exec branch above owns the process; nothing else to do
}
