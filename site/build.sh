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

# ── 口径门禁（t9 新增）────────────────────────────────────────────────────────
# 为什么插在这里而不是「只在 deploy.yml 加一个 step」：
#   ① 覆盖面：`deploy.yml`（发布）与 `verify.yml`（验证）**都**是通过
#      `working-directory: site` + `run: npm run build` 调用构建，而 `package.json` 的
#      `build` = `bash build.sh`——所以在 build.sh 里插**一处**即同时覆盖 CI 部署与 CI 验证；
#      并且额外覆盖了**本地每一次构建**（此前本地无任何门禁：口径失真只能在 push 后被发现）。
#   ② 不重复插桩：若分别改两个 workflow，就是两处漂移点；未来新增第三个调用方还要再改一处。
#   ③ 不堵死开发：`package.json` 的 `build:fast` = `astro build`（直连 astro、不经 build.sh）
#      是既有的**调试旁路**，故本门禁「严格但可绕」——需要跳过时显式用 `npm run build:fast`。
# 位置刻意在 astro 构建**之前**（fail fast）：口径重算本机实测约 0.3s，而本机全量构建约 484s，
# 红利是 ~1600×；且 fail fast 保证「口径失真时压根不产出 dist HTML」，而不是构建完才发现。
# 脚本只读源码与文件系统（Node 内置模块；不读 dist、不读 node_modules、无网络、无浏览器依赖）。
# 边界诚实：本门禁绿只证明「口径块与实数一致」，**不**证明页面渲染正确——渲染正确性由
# verify.yml 的 Build sanity（dist 等值断言 33 + 关键页非空）与 3 视口 headless 断言覆盖。
# 此处已 `cd` 到 site/（见文件头），故用相对路径 tools/check-counters.mjs。
if ! node tools/check-counters.mjs; then
  echo "build.sh: 口径一致性门禁未通过，已中止构建（未产出 dist）。" >&2
  echo "         口径唯一参照：notes/knowledge-map.md 的「计数口径」块；" >&2
  echo "         修好后重跑；确需跳过门禁做调试请用 npm run build:fast。" >&2
  exit 1
fi

# ── 类集合门禁（G0-5 / 纪律 #9）───────────────────────────────────────────────
# 为什么需要：CSS 选择器可以挂在**从未存在的祖先类**下而静默失效（`.lf-count-note` vs
# 页面实际输出的 `.lw-count-note` 只差一个字母前缀），这类缺陷不会被「页面里有没有这个
# class」抓住，只能靠集合比对：CSS 定义的类集合 − 页面实际输出的类集合。差集非 0 即中止。
# 输入面 = site/src/** 源码（**不读 site/dist**：dist 可能是 0 HTML 的残骸，拿它当基准
# 会让门禁恒真）。与上面的口径门禁同构：fail fast、只读、秒级、`build:fast` 可绕过。
if ! node tools/check-classes.mjs; then
  echo "build.sh: 类集合门禁未通过，已中止构建（未产出 dist）。" >&2
  echo "         上方清单 = CSS 定义了但页面从不输出的类（会静默失效）。" >&2
  echo "         修好后重跑；确需跳过门禁做调试请用 npm run build:fast。" >&2
  exit 1
fi

# 显式指定 V8 老生代上限。原因：在 cgroup 内存受限时 Node 会推导出一个很小的默认堆
# （实测只到 ~450MB 就 FATAL "Ineffective mark-compacts near heap limit"），
# 而本站构建实际需要 ~1GB。显式给 1GB 堆 + capped 的 1.5GB cgroup 上限即可稳定通过。
export NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=${BUILD_MAX_OLD_SPACE:-1024}"

# capped 探活（G0-1，2026-10-14）：本机 /usr/local/bin/capped 的「无 passwordless sudo」回退分支
# 有 bug——`run_plain` 把原始命令丢在函数参数之外，回退时实际执行的是空命令列表
# （报错 `nice: a command must be given with an adjustment`）并以 **exit 125** 静默终止，
# 构建被整个吞掉、dist 一个文件都不产出（实测 2026-10-14：BUILD_EXIT=125，dist 不存在）。
# 这是「89 文件 / 0 HTML 残骸」的一条现实成因路径，故这里先探活：`capped true` 真的能跑起来
# 才用它；不能则打印明确告警后原样直跑（不加 caps，慢但产出 HTML）。
CAPPED_USABLE=0
if command -v capped >/dev/null 2>&1 && capped true >/dev/null 2>&1; then
  CAPPED_USABLE=1
fi

if [ "$CAPPED_USABLE" = 1 ]; then
  export CAPPED_MEMORY_MAX="${CAPPED_MEMORY_MAX:-1800M}"
  capped "$ASTRO" build "$@"
else
  if command -v capped >/dev/null 2>&1; then
    echo "build.sh: ⚠️ capped 存在但不可用（探活 'capped true' 非 0；本机 /usr/local/bin/capped 的" >&2
    echo "          run_plain 回退分支会丢掉命令、以 exit 125 静默终止构建）——本次改为不限流直跑。" >&2
  fi
  if command -v nice >/dev/null 2>&1; then
    nice -n 10 "$ASTRO" build "$@"
  else
    "$ASTRO" build "$@"
  fi
fi

# ── pagefind：构建期全文索引（零服务端依赖）────────────────────
# 只在 astro build 成功后执行：上面任一支非 0 退出都会被 set -e 拦下，脚本直接终止，
# 不会走到这里——即「build 失败则不跑 pagefind」，不会给半成品 dist 盖一层索引。
# 产物落在 dist/pagefind/，随 CI 的 upload-pages-artifact（path: site/dist）整目录上传，
# 浏览器端 pagefind.js 按需拉取索引分片，无需任何服务端搜索组件。
# 用 npx 而不是写死 node_modules/.bin/pagefind：CI 上 npm ci 已装好（npx 直接命中本地），
# 万一本地 node_modules 不新鲜，npx 还能按需取一次，不会让构建卡在"找不到二进制"。
npx pagefind --site dist
