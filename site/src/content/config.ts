import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 课程内容集合：notes/*.md（仅顶层，不含 details/）。
 * ⚠️ `pattern: '*.md'` **只匹配 `notes/` 顶层**：设计/过程文档（2026-10-14 起集中在
 * `notes/process/`）因在子目录内天然不可见，不进本集合——这就是「课程路由 = 顶层数 − 2」的机制来源，
 * 不要把它改成递归 glob（会把 20 份 process 文档重新捞成课程）。
 * 既有笔记无 YAML frontmatter（若个别有则兼容：passthrough 放行任意字段）。
 * 课程元数据（域/阶段/状态/导读）走手写映射 src/data/courses.ts。
 */
const courses = defineCollection({
  loader: glob({ pattern: '*.md', base: '../notes' }),
  schema: z.object({}).passthrough(),
});

/**
 * 详解内容集合：notes/details/*.md。
 * 并行 worker 正在新增，frontmatter 约定：title/slug/domain/source/status。
 * `related`（2026-10-19 新增）：本页「本地映射」涉及的课程 slug 列表——由它派生
 * ① 详情页「相关课程」chip ② 课程页「延伸分水岭」反查格，修复 details↔课程双向断链
 * （此前本地映射是纯文本、课程页无任何反向链接）。目录可能不存在或文件写到一半
 * → 全部字段 optional + passthrough，build 不报错。
 */
const details = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../notes/details' }),
  schema: z
    .object({
      title: z.string().optional(),
      slug: z.string().optional(),
      domain: z.string().optional(),
      source: z.string().optional(),
      status: z.string().optional(),
      related: z.array(z.string()).optional(),
    })
    .passthrough(),
});

export const collections = { courses, details };
