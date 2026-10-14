// ============================================================
// 断言式自测 —— API 与多模型路由 §S2
//   六模块各 1+ 条可证伪断言（期望值写死，不依赖墙钟/随机）
//   本文件的每条 run() 返回 { ok, detail }，detail 始终带实际值以便失败定位
// ============================================================
import { callProvider, emitFrames, providerById, PROVIDERS, ROUTE_400_MSG, ProviderError } from "./providers.js";
import { consumeStream, StreamError } from "./sse.js";
import { validateSchema, validateSemantic, WEATHER_TOOL_SCHEMA } from "./schema.js";
import { prefixKey, naivePrefixKey, PrefixCache, type PrefixMsg } from "./caching.js";
import { classify, withRetry } from "./retry.js";
import { route, withFallback } from "./router.js";
import { stepCost, aggregateCosts } from "./cost.js";
import type { SSEFrame } from "./types.js";

export interface Assertion {
  id: string;
  module: string;
  run(): { ok: boolean; detail: string } | Promise<{ ok: boolean; detail: string }>;
}

const ok = (detail: string) => ({ ok: true, detail });
const bad = (detail: string) => ({ ok: false, detail });

const STABLE_PREFIX: PrefixMsg[] = [
  { role: "system", content: "你是天气助手" },
  { role: "user", content: "北京今天天气？" },
];

export const ASSERTIONS: Assertion[] = [
  // ── ① SSE ────────────────────────────────────────────────
  {
    id: "sse-A", module: "sse",
    run: async () => {
      try {
        const res = await consumeStream(
          emitFrames(providerById("p-capable"), { toolCall: { name: "get_weather", arguments: { city: "北京" } } }),
        );
        const pass =
          res.toolCalls.length === 1 &&
          res.toolCalls[0].name === "get_weather" &&
          (res.toolCalls[0].arguments as { city?: string }).city === "北京";
        return pass
          ? ok(`跨帧 tool_calls（首帧 id/name + 两段 arguments）→ 整体 parse 出 1 个完整 arguments {city:"北京"}`)
          : bad(`toolCalls=${JSON.stringify(res.toolCalls)}（期望 1 个，arguments={city:"北京"}）`);
      } catch (e) {
        return bad(`抛异常：${(e as Error).message}`);
      }
    },
  },
  {
    id: "sse-B", module: "sse",
    run: async () => {
      const frames: SSEFrame[] = [{ type: "delta", content: "hi" }];
      const res = await consumeStream(frames);
      return res.incomplete
        ? ok(`帧序列无 finish 帧 → incomplete=${res.incomplete}`)
        : bad(`incomplete=${res.incomplete}（期望 true：断流）`);
    },
  },
  {
    id: "sse-C", module: "sse",
    run: async () => {
      const frames: SSEFrame[] = [{ type: "error", message: "provider 流中断" }];
      try {
        await consumeStream(frames);
        return bad("收到 error 帧却未抛错（期望抛 StreamError）");
      } catch (e) {
        return e instanceof StreamError && e.kind === "error-frame"
          ? ok(`流中 error 帧 → 抛 StreamError(kind="error-frame")：${(e as Error).message}`)
          : bad(`抛错类型错误：${(e as Error).constructor.name}/${(e as Error).message}`);
      }
    },
  },

  // ── ② schema ─────────────────────────────────────────────
  {
    id: "schema-A", module: "schema",
    run: () => {
      const s = validateSchema(WEATHER_TOOL_SCHEMA, { city: "北京" });
      const m = validateSemantic("get_weather", { city: "北京" });
      return s.length === 0 && m.length === 0
        ? ok('{city:"北京"} → 形状门 [] 语义门 []：两道门都过')
        : bad(`形状门=${JSON.stringify(s)} 语义门=${JSON.stringify(m)}（期望都空）`);
    },
  },
  {
    id: "schema-B", module: "schema",
    run: () => {
      const s = validateSchema(WEATHER_TOOL_SCHEMA, { city: 123 });
      return s.length > 0 && s.some((e) => e.includes("string"))
        ? ok(`{city:123} → 形状违约：${s.join("；")}`)
        : bad(`形状错误=${JSON.stringify(s)}（期望报「应为 string」）`);
    },
  },
  {
    id: "schema-C", module: "schema",
    run: () => {
      const s = validateSchema(WEATHER_TOOL_SCHEMA, { city: "北惊" });
      const m = validateSemantic("get_weather", { city: "北惊" });
      return s.length === 0 && m.length > 0
        ? ok(`{city:"北惊"} → 形状门过、语义门 reject：${m.join("；")}（演示 schema 合法 ≠ 语义正确）`)
        : bad(`形状门=${JSON.stringify(s)} 语义门=${JSON.stringify(m)}（期望形状空、语义非空）`);
    },
  },

  // ── ③ caching ────────────────────────────────────────────
  {
    id: "cache-A", module: "caching",
    run: () => {
      const c = new PrefixCache();
      const k1 = prefixKey(STABLE_PREFIX);
      const k2 = prefixKey(STABLE_PREFIX);
      const r1 = c.hit(k1);
      const r2 = c.hit(k2);
      const pass = k1 === k2 && !r1.hit && r1.inputPriceX === 1 && r2.hit && r2.inputPriceX === 0.5 && r2.hits === 1;
      return pass
        ? ok(`同前缀连发 2 次 → 第 2 次 hit=true、输入成本 ×${r2.inputPriceX}、命中计数=${r2.hits}`)
        : bad(`k1=${k1} k2=${k2} 首次hit=${r1.hit} 二次hit=${r2.hit} ×${r2.inputPriceX} hits=${r2.hits}（期望 hit ×0.5 计数=1）`);
    },
  },
  {
    id: "cache-B", module: "caching",
    run: () => {
      const withNow: PrefixMsg[] = [
        ...STABLE_PREFIX,
        { role: "user", content: "本次请求时间：2026-10-10T12:00:00" },
      ];
      const stableSame = prefixKey(STABLE_PREFIX) === prefixKey(withNow); // 正确：剔除易变段
      const naiveDiff = naivePrefixKey(STABLE_PREFIX) !== naivePrefixKey(withNow); // 反模式：原文 hash 被动态值破坏
      return stableSame && naiveDiff
        ? ok(`前缀插时间戳 → 稳定 key 不变（prefixKey 剔除易变段）、naive 原文 hash 改变（命中=0），证明「动态值毁前缀」`)
        : bad(`stableSame=${stableSame} naiveDiff=${naiveDiff}（期望 stableSame=true 且 naiveDiff=true）`);
    },
  },

  // ── ④ retry ──────────────────────────────────────────────
  {
    id: "retry-A", module: "retry",
    run: async () => {
      let calls = 0;
      const d = await withRetry(
        async () => {
          calls += 1;
          throw new ProviderError({ status: 400 }, `p-capable → HTTP 400：${ROUTE_400_MSG}`);
        },
        3,
      );
      return !d.ok && d.retried === 0 && calls === 1
        ? ok(`classify=400（用 classify(status:400)=${classify({ status: 400 })}）→ retried=0（4xx 契约违约不重试），fn 只被调用 ${calls} 次`)
        : bad(`ok=${d.ok} retried=${d.retried} calls=${calls}（期望 retried=0、calls=1）`);
    },
  },
  {
    id: "retry-B", module: "retry",
    run: async () => {
      let calls = 0;
      const sleeps: number[] = [];
      const d = await withRetry(
        async () => {
          calls += 1;
          if (calls === 1) throw new ProviderError({ status: 500 }, "p-fast → HTTP 500");
          return "ok";
        },
        3,
        async (ms) => {
          sleeps.push(ms);
        },
      );
      const pass = d.ok && d.retried >= 1 && calls === 2 && sleeps.length === d.retried;
      return pass
        ? ok(`500 一次 → 指数退避(jitter)后第 2 次成功：retried=${d.retried}、退避=${JSON.stringify(sleeps)}ms、calls=${calls}`)
        : bad(`ok=${d.ok} retried=${d.retried} calls=${calls} sleeps=${JSON.stringify(sleeps)}（期望 retried≥1 且 calls=2）`);
    },
  },
  {
    id: "retry-C", module: "retry",
    run: async () => {
      const d = await withRetry(
        async () => {
          throw new ProviderError({ status: 500 }, "p-fast → HTTP 500");
        },
        1,
      );
      return !d.ok && d.retried === 1 && d.diagnostic.includes("预算")
        ? ok(`连续 500 + 预算=1 → 预算耗尽放弃：retried=${d.retried} —— 「${d.diagnostic}」`)
        : bad(`ok=${d.ok} retried=${d.retried} diagnostic=${d.diagnostic}（期望 retried=1 且含「预算」）`);
    },
  },

  // ── ⑤ router ─────────────────────────────────────────────
  {
    id: "router-A", module: "router",
    run: () => {
      const p = route({ needsToolCalling: true, needsStructured: false, minWindowTokens: 8192 }, PROVIDERS);
      return p?.id === "p-capable"
        ? ok(`要 tool_calling + 窗口 ≥8192 → 路由到 p-capable（p-fast 无 tool_calling/窗口不足，被能力矩阵跳过）`)
        : bad(`route 结果=${p?.id ?? "null"}（期望 p-capable）`);
    },
  },
  {
    id: "router-B", module: "router",
    run: () => {
      const fb = withFallback({ needsToolCalling: true, needsStructured: false, minWindowTokens: 4096 }, PROVIDERS, new Set(["p-fast"]));
      return fb.fell && fb.provider?.id === "p-fast"
        ? ok(`p-capable（首选）注入故障 → 降级 p-fast：fell=${fb.fell} ——「${fb.reason}」`)
        : bad(`fell=${fb.fell} provider=${fb.provider?.id ?? "null"} reason=${fb.reason}（期望降级到 p-fast）`);
    },
  },
  {
    id: "router-C", module: "router",
    run: () => {
      const fb = withFallback({ needsToolCalling: true, needsStructured: false, minWindowTokens: 4096 }, PROVIDERS, new Set());
      return fb.provider === null && fb.fell
        ? ok(`所有候选都不健康 → 如实失败 provider=null：fell=${fb.fell} ——「${fb.reason}」（不静默截断）`)
        : bad(`provider=${fb.provider?.id ?? "null"} fell=${fb.fell} reason=${fb.reason}（期望 provider=null 如实失败）`);
    },
  },

  // ── ⑥ cost ───────────────────────────────────────────────
  {
    id: "cost-A", module: "cost",
    run: () => {
      const a = stepCost("p-fast", { input: 10000, output: 1000 }); // 10×0.5 + 1×1.5 = 6.5
      const b = stepCost("p-capable", { input: 10000, output: 1000 }); // 10×3 + 1×15 = 45
      const r = aggregateCosts([
        { model: "p-fast", cost: a },
        { model: "p-capable", cost: b },
      ]);
      const pass =
        a === 6.5 && b === 45 && r.total === 51.5 && Object.keys(r.byModel).length === 2 && r.byModel["p-fast"] === 6.5 && r.byModel["p-capable"] === 45;
      return pass
        ? ok(`token×单价：p-fast=6.5 + p-capable=45 → total=${r.total}，byModel 两行=${JSON.stringify(r.byModel)}（归因到模型）`)
        : bad(`a=${a} b=${b} total=${r.total} byModel=${JSON.stringify(r.byModel)}（期望 6.5/45/51.5/两行）`);
    },
  },
];