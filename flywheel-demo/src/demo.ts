// ============================================================
// 入口 —— data-flywheel §S2
//   ① 四模块断言自测 ② 两轮消融走查（v1→v2 只动 prompt 升 → v2→v3 双变量退步不可归因）
//   全离线零 key；逻辑时钟 = 步序号；预置预测表 + 合成样本，跑 N 次逐字节一致
// ============================================================
import { SAMPLE, MODEL_VERSION, HARNESS_COMMIT } from './sample.js';
import { advanceStatus } from './ledger.js';
import { curate } from './curate.js';
import { round, relabel } from './label.js';
import { metrics } from './metrics.js';
import { gate } from './gate.js';
import { ASSERTIONS } from './assert.js';
import type { LedgerRow } from './types.js';

const MODULE_ORDER = ['ledger', 'curate', 'label', 'metrics', 'gate'];
const MODULE_LABEL: Record<string, string> = {
  ledger: '① ledger（台账状态机）',
  curate: '② curate（筛选三道门）',
  label: '③ label（延迟回填 + 两轮降噪）',
  metrics: '④ metrics（指标）',
  gate: '⑤ gate（决策门禁）',
};

const log = console.log;

/** 黄金集合漂移（人为改 2 条 ground truth，模拟评测集漂移/重标 = 第二个变量） */
function driftGold(rows: LedgerRow[]): LedgerRow[] {
  return rows.map((r) => {
    if (r.id === 'e5') return { ...r, direction: 'bullish' as const };
    if (r.id === 'e7') return { ...r, direction: 'bullish' as const };
    return r;
  });
}

function labelable(): LedgerRow[] {
  return curate(SAMPLE).kept.filter((r) => !r.skip_when_due);
}

async function main() {
  let allOk = true;
  let total = 0;

  log('flywheel-demo —— 数据飞轮四模块最小闭环（脱敏合成样本，全离线零 key）');
  for (const mod of MODULE_ORDER) {
    log(`\n${MODULE_LABEL[mod]}`);
    for (const a of ASSERTIONS.filter((x) => x.module === mod)) {
      const r = await a.run();
      total += 1;
      if (!r.ok) allOk = false;
      log(`  ${r.ok ? '✅' : '❌'} [${a.id}] ${r.detail}`);
    }
  }

  log('\n════════════════════════════════════════');
  log('两轮消融走查（对齐 notes/data-flywheel.md §S6 的 FinHot 过程，合成样本重放）');
  log(`模型版本 ${MODEL_VERSION} / harness ${HARNESS_COMMIT} 全程不变；逻辑时钟 = 轮次`);
  const lab = curate(SAMPLE).kept; // 11 行

  const v1rows = advanceStatus(lab, 0);
  const m1 = metrics(v1rows);
  log(`\n[轮次1 v1→v2] 只动 prompt（round 校验非 prompt 字段不变）`);
  const r1 = round(labelable(), 'v1', 'v2');
  const m2 = metrics(relabel(labelable(), 'v2'));
  log(`  v1: precision=${m1.precision} f1=${m1.f1} errors=${m1.errors}`);
  log(`  v2: precision=${m2.precision} f1=${m2.f1} errors=${m2.errors}  edits=${r1.edits.map((e) => e.file)}`);
  const d12 = gate({ prev: m1, next: m2, n: 9 });
  log(`  ${d12.action === 'propose' && d12.attributable ? '✅' : '❌'} gate → ${d12.action}（attributable=${d12.attributable}）：${d12.reason}`);
  if (!(d12.action === 'propose' && d12.attributable)) allOk = false;

  log(`\n[轮次2 v2→v3] prompt + golden set 双变量叠加（模拟评测集漂移/重标）`);
  const m3 = metrics(driftGold(relabel(labelable(), 'v3')));
  log(`  v3: precision=${m3.precision} f1=${m3.f1} errors=${m3.errors}（gold 已漂移 e5/e7 → bullish）`);
  const d23 = gate({ prev: m2, next: m3, n: 9, varNote: 'prompt v3 + golden set 漂移双变量' });
  log(`  ${d23.attributable === false && d23.reason.includes('不可归因') ? '✅' : '❌'} gate → ${d23.action}（attributable=${d23.attributable}）：${d23.reason}`);
  if (!(d23.attributable === false && d23.reason.includes('不可归因'))) allOk = false;

  log('\n════════════════════════════════════════');
  log('[汇总]');
  log(`  四模块断言：${total} 条${allOk ? ' 全绿' : ''}`);
  log('  两轮消融：v1→v2 可归因 propose；v2→v3 不可归因 reject');
  log('  禁 auto-apply：Decision.action 类型只有 propose/reject，全程无「自动合入」态');

  if (!allOk) {
    log('\n❌ 存在未通过的验收项');
    process.exit(1);
  }
  log(`\n✅ flywheel 验收通过：四模块 ${total} 条断言全绿 + 两轮消融走查通过`);
}

main();