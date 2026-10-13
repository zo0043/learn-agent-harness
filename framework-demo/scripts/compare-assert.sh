#!/usr/bin/env bash
# compare-assert.sh —— npm run compare:assert 编排器
#
#   阶段1：./node_modules/.bin/tsx src/compare.ts
#          （三家对照 + 打印 + 写 .compare-trace.json，含本轮 Claude session_id）
#   阶段2：**detached watcher**（setsid 新会话）：
#          ① bash 有界等待本轮 <session_id>.jsonl 落盘（≤240s，等待期间该会话内无 node 进程）
#          ② 跨进程 resume 探针（src/sdks/resume-probe.ts，独立进程自带 mock）
#          ③ 断言引擎（src/compare-assert.ts，A1–A16）
#          结果写 .assert-watcher-result（首行退出码，其余输出）
#   阶段3：本脚本轮询结果文件（本会话内只有 bash 轮询，不起 node），透传输出与退出码
#
# 为什么必须 detached（实测结论，见 README 踩坑④）：
#   Claude 会话 JSONL 的落盘可见性受**会话（session）内 node 进程**门控：
#   - 与 CLI 同会话存活的 node 父/兄弟进程 → 文件不可见（延迟 0–240s+，mtime 回填）
#   - 异会话的 node 进程 → 无影响
#   - 无 node 的新会话内观察 → compare 退出后数秒即可见
#   而 `npm run compare:assert` 的 npm（node）在整个命令期间与本脚本同会话存活，
#   因此「等待落盘」必须交给 setsid 出的新会话；跨进程 resume 探针与断言引擎也在
#   该会话内执行（实测：探针在新会话内可见文件并成功 resume，rc=0）。
#
# 诚实标注：全部断言在离线 mock 下可复现；模型调用均指向 127.0.0.1 mock 端点。
set -uo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)
BIN_TSX=./node_modules/.bin/tsx
RESULT=.assert-watcher-result
WATCH_LOG=.assert-watcher.log
rm -f "$RESULT" "$WATCH_LOG"

echo "══ framework-demo · 三家对照断言（compare:assert） ══"
echo "── 阶段1：运行 compare（输出透传） ──"
if ! "$BIN_TSX" src/compare.ts; then
  echo "[阶段1失败] compare 退出非 0，断言不执行" >&2
  exit 1
fi

# 本轮 Claude session_id（一次性 node，毫秒级退出）
SID=$(node -e "console.log(require('./.compare-trace.json').traces[0].extra.sessionId)" 2>/dev/null || true)
if [ -z "${SID:-}" ]; then
  echo "[阶段2失败] 未能从 .compare-trace.json 读到 session_id" >&2
  exit 1
fi

proj=".claude-home/projects/$(pwd | tr '/' '-')"
file="$proj/$SID.jsonl"

# ── 阶段2：detached watcher（setsid 新会话） ──
setsid bash -c '
  set -u
  cd "$1"
  file="$2"; sid="$3"; result="$4"; log="$5"; bin="$6"
  waited=0; found=0
  while [ $waited -lt 240 ]; do
    if [ -f "$file" ]; then found=1; break; fi
    sleep 1
    waited=$((waited + 1))
    if [ $((waited % 30)) -eq 0 ]; then
      echo "     [等待会话 JSONL 落盘] ${waited}s（异步刷盘，无 node 会话内通常数秒）" >> "$log"
    fi
  done
  if [ $found -eq 1 ]; then
    echo "     [会话 JSONL] ${waited}s 后可见：$file" >> "$log"
  else
    echo "     [会话 JSONL] 等待 240s 未落盘（A11 将失败）" >> "$log"
  fi
  probe_rc=1
  if [ $found -eq 1 ]; then
    "$bin" src/sdks/resume-probe.ts "$sid" 8791 >> "$log" 2>&1
    probe_rc=$?
  fi
  "$bin" src/compare-assert.ts "$probe_rc" "$waited" "$found" >> "$log" 2>&1
  rc=$?
  { echo "$rc"; cat "$log"; } > "$result"
' _ "$ROOT" "$file" "$SID" "$RESULT" "$WATCH_LOG" "$BIN_TSX" < /dev/null > /dev/null 2>&1 &
watcher=$!

# ── 阶段3：等待 watcher 结果（本会话只跑 bash 轮询；落盘等待在 watcher 自己的会话里） ──
deadline=420
waited_script=0
while [ ! -f "$RESULT" ]; do
  sleep 1
  waited_script=$((waited_script + 1))
  if [ $waited_script -ge $deadline ]; then
    echo "[超时] watcher ${deadline}s 未产出结果（会话 JSONL 刷盘异常？）" >&2
    if [ -f "$WATCH_LOG" ]; then cat "$WATCH_LOG" >&2; fi
    kill "$watcher" 2>/dev/null || true
    exit 3
  fi
done

rc=$(head -1 "$RESULT")
tail -n +2 "$RESULT"
rm -f "$RESULT" "$WATCH_LOG"
exit "$rc"
