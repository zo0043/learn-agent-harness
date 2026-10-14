// ============================================================
// 结构化输出两道门 —— API 与多模型路由 §S2
//   照搬 harness-demo/src/tools.ts validateArgs 的教学三层（required + type + enum）
//   教学点：「schema 合法 ≠ 语义正确」——类型校验过不代表业务上对
// ============================================================

/** get_weather 工具的参数 schema（city 只约束「字符串」，不设 enum——把语义留给第二道门） */
export const WEATHER_TOOL_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: { city: { type: "string" } },
  required: ["city"],
};

const KNOWN_CITIES = ["北京", "上海", "广州", "深圳"];

/** 第一道门：形状校验（required + type + enum），返回错误列表；空数组 = 通过 */
export function validateSchema(schema: Record<string, unknown>, value: unknown): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return ["根值应为 JSON 对象"];
  }
  const errors: string[] = [];
  const args = value as Record<string, unknown>;
  const props = (schema.properties ?? {}) as Record<string, { type?: string; enum?: unknown[] }>;
  for (const req of (schema.required ?? []) as string[]) {
    if (!(req in args)) errors.push(`缺必填参数 ${req}`);
  }
  for (const [k, v] of Object.entries(args)) {
    const p = props[k];
    if (!p) {
      errors.push(`未知参数 ${k}`);
      continue;
    }
    if (p.type && typeof v !== p.type) errors.push(`参数 ${k} 应为 ${p.type}，实际 ${typeof v}`);
    if (p.enum && !p.enum.includes(v)) errors.push(`参数 ${k} 须为 ${p.enum.join("/")} 之一`);
  }
  return errors;
}

/** 第二道门：语义校验（schema 合法但业务非法——如城市不在服务范围） */
export function validateSemantic(tool: string, args: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (tool === "get_weather") {
    const city = args.city;
    if (typeof city !== "string" || !KNOWN_CITIES.includes(city)) {
      errors.push(`城市「${String(city)}」不在服务范围（${KNOWN_CITIES.join("/")}）；schema 合法但语义非法`);
    }
  }
  return errors;
}