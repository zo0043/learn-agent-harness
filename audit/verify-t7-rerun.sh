#!/usr/bin/env bash
# t7 V1 独立验证 —— 可重跑脚本（verify-dev，2026-10-13）
# 用法：bash audit/verify-t7-rerun.sh [t2|t3|t4|t5|t6|all]
# 说明：
#   - 每条命令的退出码原样透传；任何一步非 0 则整体非 0。
#   - t5 段只做「本机可跑」部分（selftest + gh 查询）；站点级构建/三视口断言必须走 CI（本机 2 核 3.4GB，astro build 必 OOM）。
#   - t6 段为 grep 对账 + rag eval 守卫。
#   - 独立复算（不依赖实现者断言逻辑）：见 audit/verify-t7.md §5（my-persist 独立重放 + span 独立计数方法），
#     脚本内以 [独立] 前缀标注。
set -u
cd "$(dirname "$0")/.."
TARGET="${1:-all}"
rc=0
step() { echo; echo "════ $* ════"; }
run() { echo "\$ $*"; "$@"; local e=$?; echo "── exit=$e"; [ $e -ne 0 ] && rc=1; return 0; }

case "$TARGET" in
t2|all)
  step "t2 长期记忆自研（memory-redteam）"
  run bash -c "cd memory-redteam && node test.mjs"
  run bash -c "cd memory-redteam && node test.mjs --ablate"
  run bash -c "cd memory-redteam && node test.mjs --persist"
  run bash -c "cd memory-redteam && npm run demo"
  run bash -c "cd memory-redteam && node test.mjs > /tmp/m1.txt 2>&1 && node test.mjs > /tmp/m2.txt 2>&1 && diff /tmp/m1.txt /tmp/m2.txt"
  run bash -c "cd memory-redteam && node src/demo.mjs > /tmp/d1.txt 2>&1 && node src/demo.mjs > /tmp/d2.txt 2>&1 && diff /tmp/d1.txt /tmp/d2.txt"
  ;;
t3|all)
  step "t3 三家 SDK 离线对照（framework-demo）"
  run bash -c "cd framework-demo && npm run compare"
  run bash -c "cd framework-demo && npm run compare:assert"
  run bash -c "cd framework-demo && npx tsc --noEmit"
  run bash -c "cd framework-demo && npm run compare > /tmp/c1.txt 2>&1 && npm run compare > /tmp/c2.txt 2>&1 && diff /tmp/c1.txt /tmp/c2.txt"
  run grep -rn '11/11\|10 断言\|断言 + 1' framework-demo/README.md framework-demo/src/*.ts
  ;;
t4|all)
  step "t4 未验证项收口（harness-demo + rag 守卫）"
  run bash -c "cd harness-demo && npm run demo:otel:mock"
  run bash -c "cd harness-demo && npm run demo:otel:assert"
  run bash -c "cd harness-demo && npx tsx src/test-compact.ts"
  run bash -c "cd rag-demo && npx tsx src/evaluate.ts 2>&1 | grep -E 'recall@|PASS|chunks'"
  run grep -rn '仓外\|未验证\|无法确认\|核实日期' notes/agent-harness.md notes/harness-from-scratch.md notes/industry-2026.md
  ;;
t5|all)
  step "t5 CI 结构+几何回归（本机可跑部分）"
  run gh workflow list
  run gh run list --limit 5 --json name,conclusion,status
  run ls site/tools/
  run grep -rn 'scrollWidth\|viewport\|screenshot' site/tools/ .github/workflows/ | head -10
  # 本机负路径（fixture，不依赖站点构建）：溢出/缺元素/运行时注入必须被检出，好页不得被冤枉
  run bash -c "cd site && PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers node tools/visual-check.mjs --selftest"
  # 站点级证据以 CI 实跑为准（run id 见 audit/verify-t7.md §3 t5 段；本机 astro build 必 OOM，不复现）
  ;;
t6|all)
  step "t6 口径收口（grep 对账 + eval 守卫）"
  run grep -n '长期记忆\|框架生态' notes/interview-bank.md | head -10
  run grep -rn '11/11' README.md notes/*.md framework-demo/README.md memory-redteam/README.md 2>/dev/null
  run bash -c "cd rag-demo && npx tsx src/evaluate.ts 2>&1 | grep -E 'recall@|PASS|chunks'"
  run grep -rn '6 个可运行 demo\|WORK_COUNT' notes/knowledge-map.md site/src/data/courses.ts | head -5
  ;;
*)
  echo "用法: $0 [t2|t3|t4|t5|t6|all]"; exit 2 ;;
esac
exit $rc
