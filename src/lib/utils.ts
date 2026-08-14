/**
 * 全局工具函数（不引入 cn()/clsx 等依赖，遵循 react-bits 零工具依赖原则）
 */

/** 将 ISO 字符串或 Date 格式化为中文长日期；空输入返回空串 */
export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return '';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** 简单的 className 拼接，过滤 falsy 值 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** 文章来源类型 */
export type PostSource = 'static' | 'dynamic' | 'mdx';

/** 根据文章来源生成跳转路径：静态 MDX → /blog/{id}，动态 Supabase → /blog/p/{id} */
export function getPostHref(id: string, source: PostSource): string {
  return source === 'dynamic' ? `/blog/p/${id}` : `/blog/${id}`;
}

/** 判断 updatedAt 是否相对 publishedAt 构成有效更新（间隔 > 1 分钟） */
export function hasSignificantUpdate(
  publishedAt?: string | null,
  updatedAt?: string | null,
): boolean {
  if (!updatedAt || !publishedAt) return false;
  return new Date(updatedAt).getTime() - new Date(publishedAt).getTime() > 60 * 1000;
}
