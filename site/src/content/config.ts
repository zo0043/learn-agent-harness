import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 课程内容集合：notes/*.md（仅顶层，不含 details/）。
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
 * 目录可能不存在或文件写到一半 → 全部字段 optional + passthrough，build 不报错。
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
    })
    .passthrough(),
});

export const collections = { courses, details };
