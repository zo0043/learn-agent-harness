#!/usr/bin/env node
// 等价入口（对齐合约 W5-B verify#3 的 `npx tsx src/index.ts`）：
//   npx tsx src/index.ts        → 正跑
//   npx tsx src/index.ts --ablate → 消融自检
// 本目录零依赖：node 直接跑 test.mjs 亦可（package.json scripts: test / test:ablate）。
// 这里只做转发，保证两种跑法输出完全一致。
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const r = spawnSync(process.execPath, [join(here, '..', 'test.mjs'), ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(r.status ?? 1);
