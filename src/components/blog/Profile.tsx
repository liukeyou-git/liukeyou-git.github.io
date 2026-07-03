import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth, AuthProvider } from '../../contexts/AuthContext';
import AuthGate from '../auth/AuthGate';
import type { Post } from '../../types';

function ProfileInner() {
  const { authState } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    if (!supabase || !authState.user) {
      setLoading(false);
      return;
    }

    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', authState.user.id)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setPosts(data as Post[]);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [authState.user]);

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    if (!confirm('确定删除这篇文章吗？')) return;

    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) {
      setPosts(posts.filter((p) => p.id !== id));
    }
  };

  const handleTogglePublish = async (post: Post) => {
    if (!supabase) return;
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase
      .from('posts')
      .update({
        status: newStatus,
        published_at: newStatus === 'published' ? new Date().toISOString() : post.published_at,
      })
      .eq('id', post.id);

    if (!error) {
      setPosts(posts.map((p) => (p.id === post.id ? { ...p, status: newStatus } : p)));
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-xl bg-bg-card border border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">{authState.user.username}</h1>
            <p className="text-sm text-text-secondary">{authState.user.email}</p>
            <p className="text-xs text-text-secondary/60 mt-1">
              共 {posts.length} 篇文章 ·
              <span className="text-green-400"> {posts.filter((p) => p.status === 'published').length} 已发布 </span>·
              <span className="text-yellow-400"> {posts.filter((p) => p.status === 'draft').length} 草稿</span>
            </p>
          </div>
        </div>
        <a
          href="/write"
          className="px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-all active:scale-95"
        >
          写新文章
        </a>
      </div>

      <div className="flex items-center gap-2">
        {(['all', 'published', 'draft'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
              filter === f
                ? 'bg-accent text-white'
                : 'bg-bg-card text-text-secondary hover:text-text-primary border border-white/10'
            }`}
          >
            {f === 'all' ? '全部' : f === 'published' ? '已发布' : '草稿'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <svg className="animate-spin h-6 w-6 text-accent mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <p>暂无{filter === 'draft' ? '草稿' : filter === 'published' ? '已发布' : ''}文章</p>
          <a
            href="/write"
            className="inline-block mt-4 px-5 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover"
          >
            开始写作
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="p-5 rounded-xl bg-bg-card border border-white/10 hover:border-accent/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        post.status === 'published'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {post.status === 'published' ? '已发布' : '草稿'}
                    </span>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((t) => (
                          <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-accent/10 text-accent-hover">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-1 truncate">
                    {post.status === 'published' ? (
                      <a href={`/blog/p/${post.id}`} className="hover:text-accent transition-colors">
                        {post.title}
                      </a>
                    ) : (
                      post.title
                    )}
                  </h3>
                  {post.description && (
                    <p className="text-sm text-text-secondary line-clamp-1">{post.description}</p>
                  )}
                  <p className="text-xs text-text-secondary/60 mt-2">
                    {post.status === 'published' ? '发布于' : '编辑于'} {formatDate(post.published_at || post.updated_at)}
                    {' · '}
                    {post.content.length} 字
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <a
                    href={`/write?id=${post.id}`}
                    className="px-3 py-1 text-xs text-center bg-bg-primary border border-white/10 rounded hover:border-accent hover:text-accent transition-colors"
                  >
                    编辑
                  </a>
                  <button
                    onClick={() => handleTogglePublish(post)}
                    className="px-3 py-1 text-xs bg-bg-primary border border-white/10 rounded hover:border-accent hover:text-accent transition-colors"
                  >
                    {post.status === 'published' ? '转草稿' : '发布'}
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="px-3 py-1 text-xs bg-bg-primary border border-white/10 rounded hover:border-red-500 hover:text-red-400 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  return (
    <AuthGate message="请先登录后查看个人中心">
      <ProfileInner />
    </AuthGate>
  );
}
