import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PostActions from './PostActions';
import CommentSection from './CommentSection';
import AuthModal from '../auth/AuthModal';
import type { Post, User } from '../../types';

interface DynamicPostViewProps {
  postId: string;
}

export default function DynamicPostView({ postId }: DynamicPostViewProps) {
  const { authState } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchPost = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('加载文章失败:', error);
        setLoading(false);
        return;
      }

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // 草稿仅作者可见
      if (data.status === 'draft' && data.author_id !== authState.user?.id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPost(data);
      setIsAuthor(authState.user?.id === data.author_id);

      // 加载作者信息
      if (data.author_id) {
        const { data: authorData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.author_id)
          .maybeSingle();
        if (!cancelled && authorData) {
          setAuthor(authorData as User);
        }
      }

      setLoading(false);
    };

    fetchPost();

    return () => {
      cancelled = true;
    };
  }, [postId, authState.user?.id]);

  const handleDelete = async () => {
    if (!supabase || !post) return;
    setIsDeleting(true);
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    setIsDeleting(false);
    if (!error) {
      window.location.href = '/blog';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  if (notFound || !post) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl font-black mb-4">文章不存在</h1>
        <p className="text-text-secondary mb-6">该文章可能已被删除或尚未发布</p>
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
    <article className="mx-auto max-w-3xl px-6 pb-24">
      {post.status === 'draft' && (
        <div className="mb-6 px-4 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm text-center">
          ⚠️ 这是一篇草稿，仅你可见
        </div>
      )}

      <header className="mb-12">
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs rounded-full bg-accent/10 text-accent-hover"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-4xl sm:text-5xl font-black text-text-primary mb-4 leading-tight">
          {post.title}
        </h1>

        {post.description && (
          <p className="text-text-secondary text-lg mb-6">{post.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-text-secondary">
          {author && (
            <a
              href={`/users/${author.username}`}
              className="flex items-center gap-2 hover:text-accent transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <span>{author.username}</span>
            </a>
          )}
          <span>·</span>
          <span>{formatDate(post.published_at || post.created_at)}</span>
        </div>
      </header>

      {post.cover_url && (
        <div className="mb-10 rounded-xl overflow-hidden">
          <img src={post.cover_url} alt={post.title} className="w-full" />
        </div>
      )}

      <div className="prose max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {post.content}
        </ReactMarkdown>
      </div>

      <footer className="mt-16 pt-8 border-t border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-text-secondary">
            {author && (
              <span>
                作者：<a href={`/users/${author.username}`} className="text-accent hover:underline">{author.username}</a>
              </span>
            )}
          </div>
          <PostActions client:load postId={post.id} postTitle={post.title} />
        </div>

        {isAuthor && (
          <div className="mt-6 flex items-center gap-3 p-4 rounded-lg bg-bg-card border border-white/10">
            <span className="text-sm text-text-secondary">作者操作：</span>
            <a
              href={`/write?id=${post.id}`}
              className="px-4 py-1.5 text-sm bg-bg-primary border border-white/10 rounded-lg hover:border-accent hover:text-accent transition-colors"
            >
              编辑
            </a>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-1.5 text-sm bg-bg-primary border border-white/10 rounded-lg hover:border-red-500 hover:text-red-400 transition-colors"
            >
              删除
            </button>
          </div>
        )}
      </footer>

      <CommentSection client:load postId={post.id} />

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-bg-card border border-white/10 rounded-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold mb-2">确认删除？</h3>
            <p className="text-text-secondary text-sm mb-6">文章删除后无法恢复</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-text-secondary hover:text-text-primary"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
