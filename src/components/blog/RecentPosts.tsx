import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getPostHref, hasSignificantUpdate } from '../../lib/utils';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';
import type { PostCardData } from '../../types';

interface RecentPostsProps {
  staticPosts: Array<{
    id: string;
    title: string;
    description: string;
    publishedAt: string;
    updatedAt?: string;
    tags: string[];
  }>;
  limit?: number;
}

const toCardData = (
  p: {
    id: string;
    title: string;
    description?: string;
    publishedAt: string;
    updatedAt?: string;
    tags: string[];
  },
  source: 'static' | 'dynamic',
  index: number,
): PostCardData => ({
  id: p.id,
  title: p.title,
  description: p.description ?? '',
  date: p.publishedAt,
  updatedAt: hasSignificantUpdate(p.publishedAt, p.updatedAt) ? p.updatedAt : undefined,
  tags: p.tags ?? [],
  href: getPostHref(p.id, source),
  source,
  index,
});

export default function RecentPosts({ staticPosts, limit = 4 }: RecentPostsProps) {
  const [posts, setPosts] = useState<PostCardData[]>(() =>
    staticPosts
      .map((p) => ({ ...p, source: 'static' as const }))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit)
      .map((p, i) => toCardData(p, 'static', i)),
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
          .select('id, title, description, tags, published_at, updated_at')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Failed to fetch dynamic posts:', error);
          setLoading(false);
          return;
        }

        const dynamicPosts = (data ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description ?? '',
          publishedAt: p.published_at ?? p.updated_at,
          updatedAt: p.updated_at,
          tags: p.tags ?? [],
          source: 'dynamic' as const,
        }));

        // 合并：静态 + 动态，按时间降序，取前 limit
        const merged = [...staticPosts.map((p) => ({ ...p, source: 'static' as const })), ...dynamicPosts]
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
          .slice(0, limit)
          .map((p, i) => toCardData(p, p.source, i));

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

  if (posts.length === 0 && loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {posts.map((post) => (
        <PostCard key={`${post.source}-${post.id}`} post={post} showAuthor={false} />
      ))}
    </div>
  );
}
