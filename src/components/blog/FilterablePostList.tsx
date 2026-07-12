import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import type { Post, User } from '../../types';

export interface MixedPost {
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

interface FilterablePostListProps {
  initialPosts: MixedPost[];
}

export default function FilterablePostList({ initialPosts }: FilterablePostListProps) {
  const [dynamicPosts, setDynamicPosts] = useState<MixedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>('');

  // 从 URL hash 同步初始标签（如 /blog#Astro）
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '').trim();
    if (hash) {
      setSelectedTag(decodeURIComponent(hash));
    }
    const onHashChange = () => {
      const h = window.location.hash.replace(/^#/, '').trim();
      setSelectedTag(h ? decodeURIComponent(h) : '');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // 拉取动态文章
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const fetchDynamic = async () => {
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (postsError || !posts) {
        setLoading(false);
        return;
      }

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
        date: p.published_at || p.updated_at || '',
        href: `/blog/p/${p.id}`,
        cover: p.cover_url,
        author: authorsMap[p.author_id]?.username,
      }));

      setDynamicPosts(mapped);
      setLoading(false);
    };

    fetchDynamic();
  }, []);

  // 合并并排序
  const allPosts = useMemo(
    () =>
      [...initialPosts, ...dynamicPosts].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [initialPosts, dynamicPosts]
  );

  // 计算所有标签和计数（合并静态 + 动态）
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const post of allPosts) {
      for (const tag of post.tags) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    return counts;
  }, [allPosts]);

  const allTags = useMemo(
    () => Object.entries(tagCounts).sort(([, a], [, b]) => b - a),
    [tagCounts]
  );

  // 筛选后的文章
  const filteredPosts = useMemo(
    () => (selectedTag ? allPosts.filter((p) => p.tags.includes(selectedTag)) : allPosts),
    [allPosts, selectedTag]
  );

  const handleTagClick = (tag: string) => {
    const newTag = selectedTag === tag ? '' : tag;
    setSelectedTag(newTag);
    // 用 hash 同步 URL（不触发整页刷新）
    if (newTag) {
      window.history.replaceState(null, '', `#${encodeURIComponent(newTag)}`);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            type="button"
            onClick={() => handleTagClick('')}
            className={`px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${
              !selectedTag
                ? 'bg-accent text-white'
                : 'bg-bg-card text-text-secondary hover:text-text-primary border border-white/5'
            }`}
          >
            全部
          </button>
          {allTags.map(([tag, count]) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className={`px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${
                selectedTag === tag
                  ? 'bg-accent text-white'
                  : 'bg-bg-card text-text-secondary hover:text-text-primary border border-white/5'
              }`}
            >
              {tag} ({count})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {initialPosts.map((post, i) => (
              <PostCardItem key={post.id} post={post} index={i} formatDate={formatDate} />
            ))}
          </div>
          <div className="text-center text-text-secondary/60 text-xs py-2">正在加载更多文章...</div>
        </>
      ) : filteredPosts.length === 0 ? (
        <p className="text-text-secondary text-center py-20">
          {selectedTag ? `没有 "${selectedTag}" 标签的文章` : '暂无文章。'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredPosts.map((post, i) => (
            <PostCardItem key={post.id} post={post} index={i} formatDate={formatDate} />
          ))}
        </div>
      )}
    </>
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
