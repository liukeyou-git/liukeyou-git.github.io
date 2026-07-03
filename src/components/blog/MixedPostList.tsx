import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Post, User } from '../../types';

interface MixedPost {
  id: string;
  type: 'mdx' | 'dynamic';
  title: string;
  description?: string;
  tags: string[];
  date: string;
  href: string;
  cover?: string;
  author?: string;
}

interface MixedPostListProps {
  initialPosts: MixedPost[];
}

export default function MixedPostList({ initialPosts }: MixedPostListProps) {
  const [dynamicPosts, setDynamicPosts] = useState<MixedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const fetchDynamic = async () => {
      // 获取已发布文章
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (postsError || !posts) {
        setLoading(false);
        return;
      }

      // 获取作者信息
      const authorIds = [...new Set(posts.map((p: Post) => p.author_id).filter(Boolean))];
      let authorsMap: Record<string, User> = {};
      if (authorIds.length > 0) {
        const { data: authors } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', authorIds);
        if (authors) {
          authorsMap = (authors as User[]).reduce((acc, a) => {
            acc[a.id] = a;
            return acc;
          }, {} as Record<string, User>);
        }
      }

      const mapped: MixedPost[] = (posts as Post[]).map((p) => ({
        id: p.id,
        type: 'dynamic',
        title: p.title,
        description: p.description,
        tags: p.tags || [],
        date: p.published_at || p.created_at || '',
        href: `/blog/p/${p.id}`,
        cover: p.cover_url,
        author: authorsMap[p.author_id]?.username,
      }));

      setDynamicPosts(mapped);
      setLoading(false);
    };

    fetchDynamic();
  }, []);

  const allPosts = [...initialPosts, ...dynamicPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    // 先显示 MDX 文章，加载完后整体刷新
    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2">
          {initialPosts.map((post, i) => (
            <PostCardItem key={post.id} post={post} index={i} formatDate={formatDate} />
          ))}
        </div>
        <div className="text-center text-text-secondary/60 text-xs py-2">正在加载更多文章...</div>
      </>
    );
  }

  if (allPosts.length === 0) {
    return <p className="text-text-secondary text-center py-20">暂无文章。</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {allPosts.map((post, i) => (
        <PostCardItem key={post.id} post={post} index={i} formatDate={formatDate} />
      ))}
    </div>
  );
}

function PostCardItem({
  post,
  index,
  formatDate,
}: {
  post: MixedPost;
  index: number;
  formatDate: (d: string) => string;
}) {
  return (
    <article
      className="group glass rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/10 hover:border-accent/20 relative overflow-hidden card-glow"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {post.cover && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <img
            src={post.cover}
            alt={post.title}
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      {post.tags.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-accent/10 text-accent-hover">
              {tag}
            </span>
          ))}
          {post.type === 'dynamic' && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-400">
              用户
            </span>
          )}
        </div>
      )}

      <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:gradient-text transition-all">
        <a href={post.href}>{post.title}</a>
      </h3>

      {post.description && (
        <p className="text-text-secondary text-sm mb-4 line-clamp-2">{post.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <span>{formatDate(post.date)}</span>
          {post.author && (
            <>
              <span>·</span>
              <a href={`/users/${post.author}`} className="hover:text-accent transition-colors">
                {post.author}
              </a>
            </>
          )}
        </div>
        <span className="flex items-center gap-1">
          阅读更多
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </span>
      </div>
    </article>
  );
}
