# notes-sec 修复日志（修复阶段）

- 组：`notes-sec`｜任务：`task-11`｜时间：2026-10-19 00:15 起（Asia/Shanghai）
- 基准：HEAD `0f0ca19` + 评审前工作树改动
- 上游：`reviews/2026-10-19/FIX-CHARTER.md` §3 `notes-sec` 清单（8 条）
- 可写范围：`notes/mcp.md`、`notes/sandbox.md`、`notes/durable-execution.md`、`notes/long-term-memory.md`、`notes/multi-agent.md`、`notes/system-design.md`、`notes/interview-bank.md` + 本日志

## 覆盖声明

| ID | 文件 | 状态 |
|---|---|---|
| B5 / TECHSTATE-F1 | `notes/mcp.md`（原语表 / roots 方向 / Deprecated 徽标 / MRTR）+ `:553` 练习 8 | 待办 |
| A2 / TECHSTATE-F2 | `notes/durable-execution.md:256` 复现命令 | 待办 |
| TECHSTATE-F3 | `notes/sandbox.md:236/:238-253/:284` 四层顺序 | 待办 |
| TECHSTATE-F4 | `notes/sandbox.md:186-189` A 组 sha256 回填 | 待办 |
| TECHSTATE-F5 | `notes/mcp.md:132` 内联 URL 拆分 | 待办 |
| TECHSTATE-F6 | `notes/long-term-memory.md:399` 0.03226→0.03227 | 待办 |
| PED-F11 | `notes/interview-bank.md:66/:71/:73` 归属统一 + #6 锚点 S5→S7 | 待办 |
| P9 | `notes/multi-agent.md:268` `demo.jsonl`→`demo.example.jsonl` | 待办 |

## 修改记录

### TECHSTATE-F6｜`notes/long-term-memory.md:399`｜RRF 数值取位
- 改动前：`` `mem#248` = `1/(60+1) + 1/(60+3) = 0.01639 + 0.01587 = 0.03226`，融合 **#1**。 ``
- 改动后：`` `mem#248` = `1/(60+1) + 1/(60+3) = 0.01639 + 0.01587 ≈ 0.03227`（5 位截断），融合 **#1**。 ``
- 验证命令与输出：
  - `sed -n '399p' notes/long-term-memory.md` → `4. **RRF 融合**：`mem#248` = `1/(60+1) + 1/(60+3) = 0.01639 + 0.01587 ≈ 0.03227`（5 位截断），融合 **#1**。`
  - `node -e "console.log('toFixed(5)=',(1/61+1/63).toFixed(5))"` → `toFixed(5)= 0.03227`（原值 0.03226645…）

### P9｜`notes/multi-agent.md:217/:262/:268/:447`｜轨迹文件引用改为入库的那份
- 改动前（4 处）：`复用 demo.jsonl 事件类型`、`见 harness-demo/trajectories/demo.jsonl`、`以及 harness-demo/trajectories/demo.jsonl 的真实运行记录（trajectories/demo.jsonl 实测含 …）`、`+ harness-demo/trajectories/demo.jsonl（实测）`
- 改动后：对应 4 处全部改为 `demo.example.jsonl`（`:217` 裸文件名处也一并改，避免同文件内两种写法）
- 验证命令与输出：
  - `sed -i 's|trajectories/demo\.jsonl|trajectories/demo.example.jsonl|g; s|复用 demo\.jsonl 事件类型|复用 demo.example.jsonl 事件类型|g' notes/multi-agent.md`
  - `grep -n "demo\.jsonl" notes/multi-agent.md` → 无输出（`exit=1`）
  - `grep -c "demo\.example\.jsonl" notes/multi-agent.md` → `4`
  - 依据：`.gitignore:19-20`（`harness-demo/trajectories/*` + `!harness-demo/trajectories/demo.example.jsonl`）与 FIX-CHARTER §1「轨迹文件引用 = `demo.example.jsonl`」

（逐条追加）

## 未修改条目及原因

（最后汇总）

## 转交他人

（逐条追加）

## 自检

（最后汇总）
