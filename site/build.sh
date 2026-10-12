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
  export CAPPED_MEMORY_MAX="${CAPPED_MEMORY_MAX:-1800M}"
  capped "$ASTRO" build "$@"
else
  "$ASTRO" build "$@"
fi

# ── pagefind：构建期全文索引（零服务端依赖）────────────────────
# 只在 astro build 成功后执行：上面任一支非 0 退出都会被 set -e 拦下，脚本直接终止，
# 不会走到这里——即「build 失败则不跑 pagefind」，不会给半成品 dist 盖一层索引。
# 产物落在 dist/pagefind/，随 CI 的 upload-pages-artifact（path: site/dist）整目录上传，
# 浏览器端 pagefind.js 按需拉取索引分片，无需任何服务端搜索组件。
# 用 npx 而不是写死 node_modules/.bin/pagefind：CI 上 npm ci 已装好（npx 直接命中本地），
# 万一本地 node_modules 不新鲜，npx 还能按需取一次，不会让构建卡在"找不到二进制"。
npx pagefind --site dist
