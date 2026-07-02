import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context: { site: string }) {
  const posts = await getCollection('blog');
  return rss({
    title: "liukeyou's Blog",
    description: '一个热爱技术的开发者博客',
    site: context.site,
    items: posts
      .filter((p) => !p.data.draft)
      .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime())
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.publishedAt,
        link: `/blog/${post.id}`,
      })),
  });
}
