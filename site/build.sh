#!/usr/bin/env bash
# 站点构建入口。
#
# 为什么存在这个文件：在只有 2 vCPU / 3.4GB 的机器上，未限流的 `astro build`
# 会吃满一个核、RSS 冲到 ~1.3GB，把整机推入 direct reclaim + 换页，而同机的
# 反向隧道/面板服务（必须保持毫秒级响应）会因此表现为"域名打不开"。
# 所以构建默认走 `capped`：systemd 瞬时 scope，CPUQuota 90%、MemoryMax 1.3G、
# MemorySwapMax 0（内存撞顶时是构建自己被杀，而不是把整机拖进 swap）。
#
# `capped` 不存在时（CI、其他机器、未安装该工具的机器）原样执行，无副作用。
# 需要绕过限流时用 `npm run build:fast`。
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# astro 需要 node >= 18；系统 PATH 里可能是旧版本，这里给出明确报错而不是晦涩堆栈。
if ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 18 ? 0 : 1)' 2>/dev/null; then
  echo "build.sh: 需要 node >= 18，当前是 $(node -v 2>/dev/null || echo '未找到 node')" >&2
  echo "         请检查 PATH（本机：export PATH=/home/ubuntu/.local/bin:\$PATH）" >&2
  exit 1
fi

ASTRO=./node_modules/.bin/astro
[ -x "$ASTRO" ] || { echo "build.sh: 未找到 $ASTRO，先跑 npm ci/npm i" >&2; exit 1; }

# 显式指定 V8 老生代上限。原因：在 cgroup 内存受限时 Node 会推导出一个很小的默认堆
# （实测只到 ~450MB 就 FATAL "Ineffective mark-compacts near heap limit"），
# 而本站构建实际需要 ~1GB。显式给 1GB 堆 + capped 的 1.5GB cgroup 上限即可稳定通过。
export NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=${BUILD_MAX_OLD_SPACE:-1024}"

if command -v capped >/dev/null 2>&1; then
  # 实测：一旦 node_modules/.vite 依赖预构建缓存被清掉（换依赖、`rm -rf node_modules/.vite`、
  # 或者上一次构建被中途杀掉），vite 的 transform 阶段内存峰值会明显超过 1.5G——在默认
  # 的 1500M 硬上限下会被直接杀掉（日志停在 "building client (vite) / [vite] transforming..."，
  # 进程收到 SIGTERM 后消失，看起来像"莫名构建失败"）。1500M 只在热缓存下够用。
  # 因此默认把硬上限抬到 1800M（仍受 capped.slice 的 MemorySwapMax=0 约束：撞顶时被杀的是
  # 构建自己，不会把整机拖进 swap/reclaim）。
  export CAPPED_MEMORY_MAX="${CAPPED_MEMORY_MAX:-1800M}"
  exec capped "$ASTRO" build "$@"
fi
exec "$ASTRO" build "$@"
