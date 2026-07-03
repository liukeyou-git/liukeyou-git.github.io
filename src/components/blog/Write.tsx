import { useState, useEffect } from 'react';
import PostEditor from './PostEditor';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import AuthGate from '../auth/AuthGate';
import type { PostDraft } from '../../types';

function WriteInner() {
  const { authState } = useAuth();
  const [initial, setInitial] = useState<Partial<PostDraft> & { id?: string } | null>(null);
  const [loading, setLoading] = useState(!!new URLSearchParams(window.location.search).get('id'));

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id || !supabase || !authState.user) {
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .eq('author_id', authState.user.id)
        .maybeSingle();

      if (error) {
        console.error('加载文章失败:', error);
        alert('加载文章失败：' + error.message);
      } else if (!data) {
        alert('文章不存在或您无权编辑');
        window.location.href = '/profile';
      } else {
        setInitial({
          id: data.id,
          title: data.title,
          description: data.description || '',
          content: data.content,
          tags: data.tags || [],
          cover_url: data.cover_url || '',
          status: data.status,
        });
      }
      setLoading(false);
    };

    fetchPost();
  }, [authState.user]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <svg className="animate-spin h-6 w-6 text-accent mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <PostEditor
      initial={initial || undefined}
      onSaved={(postId) => {
        window.location.href = `/blog/p/${postId}`;
      }}
      onCancel={() => {
        window.location.href = '/profile';
      }}
    />
  );
}

export default function Write() {
  // client:only 创建独立 React 根，必须自带 AuthProvider
  return (
    <AuthProvider>
      <AuthGate message="请先登录后发布文章">
        <WriteInner />
      </AuthGate>
    </AuthProvider>
  );
}
