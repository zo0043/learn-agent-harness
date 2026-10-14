// ============================================================
// grade.mjs —— 毕业判据运行器（生成层：只判行为 + 覆盖性，不判「怎么实现」）
//
//   用法：
//     node grade.mjs                 无成品目录 → 显式报「未提交」，exit 1
//     node grade.mjs <成品目录>      对该目录跑黑盒 + 白盒判据
//
//   只做两件可判定的事：
//     (1) 黑盒：node <成品>/assert.mjs 子进程 exit 0 → 黑盒过（B1–B5 细节由学员自己的断言决定）
//     (2) 白盒：读 <成品>/MANIFEST.md，检查 W1–W7 逐条被指认 → 白盒过
//   不检查黑盒是不是真确定性、不检查白盒指认对不对——那是学员 assert.mjs / MANIFEST.md 的责任。
// ============================================================
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { BLACKBOX, WHITEBOX } from './rubric.mjs';

const dir = process.argv[2] ? resolve(process.argv[2]) : null;

if (!dir) {
  console.error('❌ 未找到成品目录：请从空目录开始搭建（本页无 starter/TODO/参考答案）。');
  console.error('   用法：node grade.mjs <你的成品目录>');
  console.error('   成品目录需含两样：assert.mjs（黑盒断言，exit 0 = 过）+ MANIFEST.md（白盒自述，覆盖 W1–W7）。');
  process.exit(1);
}

let blackboxPassed = false;
let whiteMissing = [];

// —— (1) 黑盒：跑学员自己的 assert.mjs（只认 exit 码） ——
const assertPath = join(dir, 'assert.mjs');
if (!existsSync(assertPath)) {
  console.error(`❌ 黑盒：未找到 ${assertPath}（成品缺 assert.mjs）`);
} else {
  const run = spawnSync(process.execPath, [assertPath], { stdio: 'inherit' });
  if (run.error) {
    console.error(`❌ 黑盒：运行 assert.mjs 失败：${run.error.message}`);
  } else if (run.status === 0) {
    blackboxPassed = true;
  } else {
    console.error(`❌ 黑盒：assert.mjs exit ${run.status}（未过）`);
  }
}

// —— (2) 白盒：读 MANIFEST.md，逐条 W1–W7 检查指认 ——
const manifestPath = join(dir, 'MANIFEST.md');
if (!existsSync(manifestPath)) {
  console.error(`❌ 白盒：未找到 ${manifestPath}（成品缺 MANIFEST.md）`);
  whiteMissing = WHITEBOX.map(([id]) => id);
} else {
  const text = readFileSync(manifestPath, 'utf8');
  for (const [id] of WHITEBOX) {
    // 指认格式：行内出现「W<k>:」即算已指认（内容对不对由黑盒兜底）
    const re = new RegExp(`(^|\\n)\\s*${id}\\s*:`, 'i');
    if (!re.test(text)) whiteMissing.push(id);
  }
}

console.log('');
console.log(blackboxPassed ? '✅ 黑盒判据（assert.mjs exit 0）通过' : '❌ 黑盒判据未过（见上）');
if (whiteMissing.length === 0) {
  console.log('✅ 白盒要素（W1–W7 全指认）通过');
} else {
  console.log(`❌ 白盒要素未齐（缺失：${whiteMissing.join(', ')}）`);
}

if (blackboxPassed && whiteMissing.length === 0) {
  console.log('✅ 毕业判据通过');
  process.exit(0);
} else {
  const miss = [];
  if (!blackboxPassed) miss.push('黑盒未过');
  if (whiteMissing.length) miss.push(`白盒缺 ${whiteMissing.join(',')}`);
  console.log(`❌ 毕业判据通过（${miss.join('；')}）`);
  process.exit(1);
}