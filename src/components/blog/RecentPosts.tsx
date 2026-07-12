import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface PostItem {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
  source: 'static' | 'dynamic';
}

interface RecentPostsProps {
  staticPosts: Array<{
    id: string;
    title: string;
    description: string;
    publishedAt: string;
    tags: string[];
  }>;
  limit?: number;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getHref = (post: PostItem) => {
  return post.source === 'static' ? `/blog/${post.id}` : `/blog/p/${post.id}`;
};

export default function RecentPosts({ staticPosts, limit = 4 }: RecentPostsProps) {
  const [posts, setPosts] = useState<PostItem[]>(() =>
    staticPosts
      .map((p) => ({ ...p, source: 'static' as const }))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const fetchDynamic = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, title, description, tags, published_at, created_at')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Failed to fetch dynamic posts:', error);
          setLoading(false);
          return;
        }

        const dynamicPosts: PostItem[] = (data ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description ?? '',
          publishedAt: p.published_at ?? p.created_at,
          tags: p.tags ?? [],
          source: 'dynamic' as const,
        }));

        // 合并：静态 + 动态，按时间降序，取前 limit
        const merged = [...staticPosts.map((p) => ({ ...p, source: 'static' as const })), ...dynamicPosts]
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
          .slice(0, limit);

        setPosts(merged);
      } catch (err) {
        console.error('RecentPosts fetch error:', err);
      }
      setLoading(false);
    };

    fetchDynamic();
  }, [staticPosts, limit]);

  if (posts.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {posts.map((post) => (
        <article
          key={`${post.source}-${post.id}`}
          className="group glass rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/10 hover:border-accent/20 relative overflow-hidden card-glow"
        >
          {post.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-full bg-accent/10 text-accent-hover"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:gradient-text transition-all">
            <a href={getHref(post)}>{post.title}</a>
          </h3>

          {post.description && (
            <p className="text-text-secondary text-sm mb-4 line-clamp-2">{post.description}</p>
          )}

          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>{formatDate(post.publishedAt)}</span>
            <span className="flex items-center gap-1">
              阅读更多
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
