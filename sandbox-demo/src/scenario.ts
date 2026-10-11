// ============================================================
// scenario.ts —— 幽灵事故剧本 + policy 配置（S2：把事故重建成可重放剧本）
//   FinHot 2026-10-09 18:00：并行会话在错误目录（旧 AINews compose 树，build:
//   指向幽灵树，无 editorial/ledger/labeler）跑 compose build+up，生产 worker/api
//   被幽灵代码替换 25 分钟。每个动作都是"合法工具+合法命令"——缺的是执行环境边界
// ============================================================
import type { Rule, ToolCall } from "./types.js";
import type { Approval } from "./policy.js";

/** 幽灵事故剧本（固定事件序列：错误目录 compose → build → up → 生产容器被换） */
export const GHOST_SCRIPT: ToolCall[] = [
  { id: "g1", tool: "read_file", args: { path: "work/ainews-old/README.md" }, note: "并行会话在旧 AINews 树里定位自己——在它自己的上下文里一切都正常" },
  { id: "g2", tool: "docker_compose_build", args: { project: "finfo", dir: "work/ainews-old" }, note: "build: 指向幽灵树（无 editorial/ledger/labeler）" },
  { id: "g3", tool: "docker_compose_up", args: { project: "finfo", dir: "work/ainews-old", services: ["worker", "api"] }, note: "毒化步：按容器名 up，把生产 worker/api 换成幽灵代码" },
  { id: "g4", tool: "check_container", args: { name: "finfo-worker", expectBuiltFrom: "work/ainews-new" }, note: "运维规则（事故后长出）：动生产容器前后核对构建来源/创建时间" },
];

/** A⑤ 权限门 only（沙箱与凭据之前的状态）：compose 是合法工具，每个动作都"能做" */
export const GATE_ONLY_RULES: Rule[] = [
  { id: "g-deny-shell", channel: "deny", tools: ["run_shell"], note: "硬禁止（A⑤）" },
  { id: "g-approve-sideeffect", channel: "approve", tools: ["write_file", "net_fetch"], note: "副作用需审批（A⑤）" },
  { id: "g-allow-compose", channel: "allow", tools: ["docker_compose_build", "docker_compose_up"], note: "compose 是合法工具（事故根因：每个动作都'能做'）" },
  { id: "g-allow-read", channel: "allow", tools: ["read_file", "check_container", "print_env"], note: "低风险（A⑤）" },
];

/** S2 四通道 policy（本课新增）：compose build/up 动作合法、但需关边界 → sandbox 通道 */
export const POLICY_4CH_RULES: Rule[] = [
  { id: "s-deny-sensitive", channel: "deny", tools: ["read_file", "write_file"], when: (a) => /(^|\/)\.env$/.test(String(a.path ?? "")), note: "凭据文件（S4）：读写 .env 禁止" },
  { id: "s-deny-foreign", channel: "deny", tools: ["write_file"], when: (a) => String(a.path ?? "").startsWith("work/ainews-new/"), note: "写别的会话的树/生产目录（scope）" },
  { id: "s-deny-shell", channel: "deny", tools: ["run_shell"], note: "硬禁止" },
  { id: "s-approve-write", channel: "approve", tools: ["write_file"], note: "副作用需人工审批（human-in-the-loop）" },
  { id: "s-sandbox-compose", channel: "sandbox", tools: ["docker_compose_build", "docker_compose_up"], note: "动作合法但需关边界：隔离命名空间内 build/up" },
  { id: "s-sandbox-net", channel: "sandbox", tools: ["net_fetch"], note: "网络工具：必须关 egress" },
  { id: "s-allow-read", channel: "allow", tools: ["read_file", "check_container", "print_env"], note: "低风险、边界内" },
];

/** 预置审批表（离线模拟人工审批：结果固定 → 重放确定） */
export const APPROVAL_TABLE: Approval[] = [
  { tool: "write_file", when: (a) => String(a.path ?? "").endsWith("notes.md"), decision: "approved", note: "值班人已预批 out/notes.md 写入" },
  { tool: "write_file", when: (a) => String(a.path ?? "").endsWith("report.md"), decision: "rejected", note: "审批窗口超时未批（拒绝也是合法结果）" },
];

/** 宿主 env（S4：FinHot 根目录 .env 即生产配置 = 凭据面过大） */
export const HOST_ENV: Record<string, string> = { HOME: "/home/ubuntu", PATH: "/usr/bin", LLM_API_KEY: "sk-demo-****", FEISHU_WEBHOOK: "https://open.feishu.cn/hook/****" };

/** 事故会话的沙箱配置：workspace=它自己的（幽灵）树；敏感凭据不进可见 env */
export const SESSION_WORKSPACE = "work/ainews-old";
export const ENV_WHITELIST = ["HOME", "PATH"];
