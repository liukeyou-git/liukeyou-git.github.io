import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import AuthModal from '../auth/AuthModal';

interface PostActionsProps {
  postId: string;
  postTitle: string;
}

function PostActionsInner({ postId, postTitle }: PostActionsProps) {
  const { authState } = useAuth();
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUser = authState.user;
  const currentUserId = currentUser?.id;

  // 加载点赞数和当前用户点赞状态
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchLikes = async () => {
      try {
        // 获取总点赞数
        const { count, error: countError } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        if (!cancelled && !countError && count !== null) {
          setLikes(count);
        }

        // 检查当前用户是否已点赞
        if (!cancelled && currentUserId) {
          const { data, error: userLikeError } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', currentUserId)
            .maybeSingle();

          if (!cancelled && !userLikeError) {
            setIsLiked(!!data);
          }
        } else if (!cancelled) {
          setIsLiked(false);
        }
      } catch (err) {
        console.error('加载点赞数据失败:', err);
      }
      if (!cancelled) {
        setLoading(false);
      }
    };

    fetchLikes();

    return () => {
      cancelled = true;
    };
  }, [postId, currentUserId]);

  const handleLike = async () => {
    if (!supabase) return;

    // 未登录时弹出登录框
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    // 乐观更新
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikes(wasLiked ? likes - 1 : likes + 1);
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 600);

    try {
      if (wasLiked) {
        // 取消点赞
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);

        if (error) {
          // 回滚
          setIsLiked(wasLiked);
          setLikes(likes);
        }
      } else {
        // 点赞
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: currentUser.id,
          });

        if (error && !error.message.includes('duplicate')) {
          // 回滚
          setIsLiked(wasLiked);
          setLikes(likes);
        }
      }
    } catch (err) {
      // 回滚
      setIsLiked(wasLiked);
      setLikes(likes);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    try {
      // 优先使用现代 API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
      alert(`复制失败，请手动复制：${url}`);
    }
  };

  if (!supabase) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <button
          onClick={handleLike}
          disabled={loading}
          className={`group flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm ${
            isLiked
              ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
              : 'bg-bg-card text-text-secondary hover:text-pink-400 hover:bg-pink-500/10 border border-white/5'
          } ${isLikeAnimating ? 'like-animate' : ''}`}
          aria-label={isLiked ? '取消点赞' : '点赞'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={isLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-hover:scale-110"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span>{isLiked ? '已点赞' : '点赞'}</span>
          {likes > 0 && <span className="text-xs opacity-75">({likes})</span>}
        </button>

        <button
          onClick={handleShare}
          className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-card text-text-secondary hover:text-accent hover:bg-accent/10 border border-white/5 transition-all duration-300 text-sm"
          aria-label="分享"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-hover:scale-110"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
          分享
        </button>
      </div>

      {/* 复制成功提示 */}
      {showCopyToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-accent text-white rounded-lg shadow-lg shadow-accent/30 flex items-center gap-2 animate-fade-in-up">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>链接已复制到剪贴板</span>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}

export default function PostActions(props: PostActionsProps) {
  return (
    <AuthProvider>
      <PostActionsInner {...props} />
    </AuthProvider>
  );
}
