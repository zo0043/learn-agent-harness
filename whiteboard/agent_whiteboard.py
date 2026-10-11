#!/usr/bin/env python3
"""
agent_whiteboard.py —— 白板版最小 harness（~150 行，仅标准库）
与 TS 版（harness-demo/src/）架构 1:1 对应：
  ② loop  ③ 工具协议  ⑤ 权限门  ⑥⑦ 会话与恢复  ⑧ 预算
简化（白板上的取舍说明）：
  - 非流式调用（生产换 SSE：解析 data: 帧 + 拼接 tool_calls 片段）
  - 压缩留 stub（只报预算超限）
  - schema 校验只查 required（完整版在 TS validateArgs）
跑法（需要 node 22 环境里的 LLM 代理，变量与 TS 版同一套 .env）：
  set -a; . ../harness-demo/.env; set +a
  python3 whiteboard/agent_whiteboard.py
"""
import json
import os
import urllib.request

BASE = os.environ["LLM_BASE_URL"].rstrip("/")
KEY = os.environ["LLM_API_KEY"]
MODEL = os.environ.get("LLM_MODEL", "qwen3.8-flash")
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "harness-demo", "workspace"))


# ---------- ② 一次模型调用（生产：SSE 流式） ----------
def llm(messages, tools=None):
    body = json.dumps({"model": MODEL, "messages": messages, "tools": tools or []}).encode()
    req = urllib.request.Request(
        BASE + "/chat/completions", data=body,
        headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        d = json.load(r)
    m = d["choices"][0]["message"]
    return ({"role": "assistant", "content": m.get("content"), "tool_calls": m.get("tool_calls")},
            d["choices"][0].get("finish_reason"))


# ---------- ③ 工具协议：注册表 + 校验 + 执行（错误/拒绝也是结果，必须回写） ----------
TOOLS = {}


def tool(name, desc, readonly=False):
    def deco(fn):
        TOOLS[name] = {"desc": desc, "readonly": readonly, "fn": fn,
                       "required": list(fn.__code__.co_varnames[:fn.__code__.co_argcount])}
        return fn
    return deco


def scoped(p):
    abs_ = os.path.abspath(os.path.join(ROOT, str(p)))
    if not abs_.startswith(ROOT + os.sep):
        raise ValueError(f"路径越出 workspace: {p}")
    return abs_


@tool("list_dir", "列出 workspace 内目录内容", readonly=True)
def list_dir(path):
    return json.dumps(os.listdir(scoped(path)))


@tool("read_file", "读 workspace 内文件", readonly=True)
def read_file(path):
    with open(scoped(path), encoding="utf-8") as f:
        return f.read()


@tool("write_file", "写 workspace 内文件（副作用，需审批）")
def write_file(path, content):
    p = scoped(path)
    os.makedirs(os.path.dirname(p) or ROOT, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(str(content))
    return f"已写入 {path}"


def call_tool(name, args):
    spec = TOOLS.get(name)
    if spec is None:
        raise ValueError(f"未知工具: {name}")
    missing = [k for k in spec["required"] if k not in (args or {})]
    if missing:
        raise ValueError(f"缺参数: {missing}")
    return spec["fn"](**(args or {}))


def tool_schemas():
    return [{"type": "function", "function": {
        "name": n, "description": s["desc"],
        "parameters": {"type": "object",
                       "properties": {k: {"type": "string"} for k in s["required"]},
                       "required": s["required"]}}} for n, s in TOOLS.items()]


# ---------- ⑤ 权限门：deny > approve > allow，默认 deny（执行路径上，不在提示词里） ----------
DENY, APPROVE, ALLOW = {"run_shell"}, {"write_file"}, {"list_dir", "read_file"}


def check(name):
    return "deny" if name in DENY else "approve" if name in APPROVE else "allow" if name in ALLOW else "deny"


# ---------- ⑥⑦ 会话：JSONL 日志 = 唯一事实源；未知状态 = intent 在、exec 不在 ----------
def log_append(path, ev):
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(ev, ensure_ascii=False) + "\n")


def rebuild(path):
    events = [json.loads(l) for l in open(path, encoding="utf-8") if l.strip()]
    init = next(e for e in events if e["kind"] == "init")
    msgs = [{"role": "system", "content": init["system"]}, {"role": "user", "content": init["user"]}]
    done, intents = set(), {}
    for e in events:
        if e["kind"] == "model_response":
            msgs.append(e["assistant"])
        elif e["kind"] == "tool_intent":
            intents[e["id"]] = e
        elif e["kind"] == "tool_exec":
            done.add(e["id"])
            msgs.append({"role": "tool", "tool_call_id": e["id"], "name": e["name"], "content": e["result"]})
    return msgs, [i for i in intents.values() if i["id"] not in done]


# ---------- ⑧ 预算：估算即可（精确 tokenization 只为计费） ----------
def est_tokens(msgs):
    return len(json.dumps(msgs, ensure_ascii=False)) // 4


# ---------- ② loop ----------
def run(user, log_path, max_steps=15, compact_at=12000):
    if os.path.exists(log_path):
        msgs, unknown = rebuild(log_path)
        print(f"[恢复] {len(msgs)} 条消息，{len(unknown)} 个未知状态")
        for u in unknown:  # ⑦ 只读→安全重放；非只读→摆状态给模型核对
            if TOOLS[u["name"]]["readonly"]:
                res = "[恢复安全重放] " + call_tool(u["name"], u["args"])
            else:
                res = "[未知状态] 结果未知，先用只读工具核对现状再决定是否重放。"
            msgs.append({"role": "tool", "tool_call_id": u["id"], "name": u["name"], "content": res})
            log_append(log_path, {"kind": "tool_exec", "id": u["id"], "name": u["name"], "result": res})
    else:
        system = "逐步完成用户任务；工具被拒绝就调整计划；遇到未知状态先核对现状；完成后总结。"
        msgs = [{"role": "system", "content": system}, {"role": "user", "content": user}]
        log_append(log_path, {"kind": "init", "system": system, "user": user})

    for step in range(1, max_steps + 1):
        if est_tokens(msgs) > compact_at:
            # ⑧ 生产：保头尾、中间 LLM 摘要（见 TS compactIfNeeded）；白板版留 stub
            print(f"[预算] ~{est_tokens(msgs)} tokens 超限 → 需要压缩（stub）")
        r, finish = llm(msgs, tool_schemas())
        msgs.append(r)
        log_append(log_path, {"kind": "model_response", "assistant": r, "finish_reason": finish})
        if not r.get("tool_calls"):
            log_append(log_path, {"kind": "final", "content": r["content"]})
            print("\n[final]\n" + (r["content"] or ""))
            return
        for tc in r["tool_calls"]:
            name, cid = tc["function"]["name"], tc["id"]
            args = json.loads(tc["function"].get("arguments") or "{}")
            d = check(name)  # ⑤
            if d == "deny":
                res = "[策略拒绝] 该操作不允许；改用其他方式或说明原因。"
            elif d == "approve" and not input(f"批准 {name}({json.dumps(args, ensure_ascii=False)})? [y/N] ").lower().startswith("y"):
                res = "[审批未通过] 用户未批准。"
            else:
                log_append(log_path, {"kind": "tool_intent", "id": cid, "name": name, "args": args})  # ⑦ 先记 intent
                try:
                    res = call_tool(name, args)
                except Exception as e:
                    res = f"[工具错误] {e}"
            msgs.append({"role": "tool", "tool_call_id": cid, "name": name, "content": res})
            log_append(log_path, {"kind": "tool_exec", "id": cid, "name": name, "result": res})
    raise SystemExit(f"达到最大步数 {max_steps}：状态已保存，不视为完成")


if __name__ == "__main__":
    run("列出 docs 目录，读取 README.md，把项目一句话总结写入 out/summary.md，再总结你做了什么。",
        os.path.join(os.path.dirname(__file__), "..", "harness-demo", "trajectories", "demo-py.jsonl"))
