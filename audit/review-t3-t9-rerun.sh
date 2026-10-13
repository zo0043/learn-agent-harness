#!/usr/bin/env bash
# review-t3-t9-rerun.sh —— t9（R3 评审 t3）独立复跑脚本
# 用法：bash audit/review-t3-t9-rerun.sh
# 覆盖：V1 compare / V4 确定性 diff / V2 compare:assert / V3 tsc / V5 口径 grep
#       + R3-1 五维表权限行复现 + R3-2 file:line 指针审计
set -uo pipefail
cd "$(dirname "$0")/../framework-demo"
FAIL=0
L=/tmp/review-t3-t9
mkdir -p "$L"

echo '══ V1+V4: npm run compare ×2 + diff（确定性） ══'
if npm run compare > "$L/c1.log" 2>&1; then echo 'V1 PASS exit 0'; else echo 'V1 FAIL（见 '"$L"/c1.log'）'; FAIL=1; fi
if npm run compare > "$L/c2.log" 2>&1 && diff -q "$L/c1.log" "$L/c2.log" >/dev/null; then
  echo 'V4 PASS 两次运行 diff 空'
else
  echo 'V4 FAIL（diff 非空或第二次非 0）'; FAIL=1
fi
grep -m1 '【诚实标注】' "$L/c1.log" || { echo 'V1 缺诚实标注行'; FAIL=1; }

echo '══ V2: npm run compare:assert ══'
npm run compare:assert > "$L/assert.log" 2>&1; rc=$?
tail -4 "$L/assert.log"
[ "$rc" -eq 0 ] && echo 'V2 PASS exit 0' || { echo "V2 FAIL exit $rc"; FAIL=1; }

echo '══ V3: npx tsc --noEmit ══'
if npx tsc --noEmit > "$L/tsc.log" 2>&1; then echo 'V3 PASS exit 0'; else echo 'V3 FAIL'; cat "$L/tsc.log"; FAIL=1; fi

echo '══ V5: 口径 grep（无活 11/11；新口径在位） ══'
if grep -rn '11/11' README.md src/ docs/ scripts/ package.json 2>/dev/null; then
  echo 'V5 FAIL 存在活 11/11'; FAIL=1
else
  echo 'V5 PASS 0 命中'
fi
grep -n '10 断言 + 1 总体判定' README.md | head -2

echo '══ R3-1 复现：五维表「权限与 HITL」行（看第 2/3 格是否相同） ══'
grep '权限与 human-in-the-loop' "$L/c1.log" | head -1

echo '══ R3-2: docs/sdk-comparison.md file:line 指针审计 ══'
python3 - <<'EOF'
import re
doc = open('docs/sdk-comparison.md').read()
refs = []
for r in re.findall(r'src/[A-Za-z0-9_./-]+?:\d+(?:-\d+)?', doc):
    if r not in refs:
        refs.append(r)
for ref in refs:
    m = re.match(r'(src/[^:]+):(\d+)(?:-(\d+))?', ref)
    path, a, b = m.group(1), int(m.group(2)), (int(m.group(3)) if m.group(3) else int(m.group(2)))
    try:
        lines = open(path).read().split('\n')
        text = ' | '.join(l.strip()[:80] for l in lines[a-1:b])
        print(f'{ref:45s} -> {text}')
    except Exception as e:
        print(f'{ref:45s} FILE MISSING: {e}')
EOF

echo
[ "$FAIL" -eq 0 ] && echo 'ALL PASS' || echo 'HAS FAILURES'
exit "$FAIL"
