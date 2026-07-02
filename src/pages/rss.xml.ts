import rss from '@astrojs/rss';

export async function GET(context: { site: string }) {
  return rss({
    title: "liukeyou's Blog",
    description: '一个热爱技术的开发者博客',
    site: context.site,
    items: [],
  });
}