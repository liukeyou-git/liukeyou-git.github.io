import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { getPostHref, hasSignificantUpdate } from '../../lib/utils';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';
import type { Post, User, PostCardData } from '../../types';

export interface MixedPost {
  id: string;
  type: 'mdx' | 'dynamic';
  title: string;
  description?: string;
  tags: string[];
  date: string;
  updatedAt?: string;
  href: string;
  cover?: string;
  author?: string;
}

interface FilterablePostListProps {
  initialPosts: MixedPost[];
}

/** 将 MixedPost 映射为 PostCardData */
function toCardData(post: MixedPost, index: number): PostCardData {
  return {
    id: post.id,
    title: post.title,
    description: post.description,
    date: post.date,
    updatedAt: hasSignificantUpdate(post.date, post.updatedAt) ? post.updatedAt : undefined,
    tags: post.tags,
    href: post.href,
    cover: post.cover,
    author: post.author,
    source: post.type,
    index,
  };
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

      const mapped: MixedPost[] = (posts as Post[]).map((p) => {
        const hasUpdate = hasSignificantUpdate(p.published_at, p.updated_at);
        return {
          id: p.id,
          type: 'dynamic',
          title: p.title,
          description: p.description,
          tags: p.tags || [],
          date: p.published_at || p.updated_at || '',
          updatedAt: hasUpdate ? p.updated_at : undefined,
          href: getPostHref(p.id, 'dynamic'),
          cover: p.cover_url,
          author: authorsMap[p.author_id]?.username,
        };
      });

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
              <PostCard key={post.id} post={toCardData(post, i)} />
            ))}
            {Array.from({ length: 2 }).map((_, i) => (
              <PostCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        </>
      ) : filteredPosts.length === 0 ? (
        <p className="text-text-secondary text-center py-20">
          {selectedTag ? `没有 "${selectedTag}" 标签的文章` : '暂无文章。'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredPosts.map((post, i) => (
            <PostCard key={post.id} post={toCardData(post, i)} />
          ))}
        </div>
      )}
    </>
  );
}
