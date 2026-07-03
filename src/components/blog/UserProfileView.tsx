import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Post, User } from '../../types';

interface UserProfileViewProps {
  username: string;
}

export default function UserProfileView({ username }: UserProfileViewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      // 通过 username 查 user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (cancelled) return;

      if (profileError || !profile) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setUser(profile as User);

      // 查已发布的文章
      const { data: userPosts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', profile.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (!cancelled && !postsError && userPosts) {
        setPosts(userPosts as Post[]);
      }
      setLoading(false);
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [username]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <svg className="animate-spin h-8 w-8 text-accent mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl font-black mb-4">用户不存在</h1>
        <p className="text-text-secondary mb-6">找不到用户名为 {username} 的用户</p>
        <a
          href="/blog"
          className="inline-block px-6 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
        >
          返回文章列表
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24">
      <div className="p-6 rounded-xl bg-bg-card border border-white/10 mb-8 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-black">{user?.username}</h1>
          {user?.bio && <p className="text-text-secondary text-sm mt-1">{user.bio}</p>}
          <p className="text-xs text-text-secondary/60 mt-2">
            共发布 {posts.length} 篇文章
          </p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">文章</h2>

      {posts.length === 0 ? (
        <p className="text-text-secondary text-center py-12">该用户还没有发布文章</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <a
              key={post.id}
              href={`/blog/p/${post.id}`}
              className="block p-5 rounded-xl bg-bg-card border border-white/10 hover:border-accent/30 transition-all"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {post.tags && post.tags.slice(0, 3).map((t) => (
                  <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-accent/10 text-accent-hover">
                    {t}
                  </span>
                ))}
              </div>
              <h3 className="text-lg font-semibold mb-1 hover:text-accent transition-colors">
                {post.title}
              </h3>
              {post.description && (
                <p className="text-sm text-text-secondary line-clamp-1">{post.description}</p>
              )}
              <p className="text-xs text-text-secondary/60 mt-2">
                {formatDate(post.published_at || post.created_at)}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
