import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Comment, User } from '../../types';

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setCurrentUser(profile
          ? {
              id: profile.id,
              email: session.user.email || '',
              username: profile.username,
              avatar_url: profile.avatar_url,
              bio: profile.bio,
            }
          : {
              id: session.user.id,
              email: session.user.email || '',
              username: session.user.email?.split('@')[0] || '',
            });
      }
    };

    checkAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            setCurrentUser(profile
              ? {
                  id: profile.id,
                  email: session.user.email || '',
                  username: profile.username,
                  avatar_url: profile.avatar_url,
                  bio: profile.bio,
                }
              : {
                  id: session.user.id,
                  email: session.user.email || '',
                  username: session.user.email?.split('@')[0] || '',
                });
          });
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const fetchComments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*, author:profiles(id, username, avatar_url)')
      .eq('post_id', postId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const rootComments = data.filter((c: Comment) => !c.parent_id);
      const replies = data.filter((c: Comment) => c.parent_id);

      const commentsWithReplies = rootComments.map((comment: Comment) => ({
        ...comment,
        replies: replies.filter((r: Comment) => r.parent_id === comment.id),
      }));

      setComments(commentsWithReplies);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchComments();

    const { data: listener } = supabase
      .channel(`comments:${postId}`)
      .on('INSERT', { event: 'INSERT', schema: 'public', table: 'comments' }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      listener?.unsubscribe();
    };
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      content: content.trim(),
      parent_id: replyingTo,
      author_id: currentUser?.id,
      status: 'approved',
    });

    if (!error) {
      setContent('');
      setReplyingTo(null);
      fetchComments();
    }

    setIsSubmitting(false);
  };

  const handleLike = async (commentId: string) => {
    const comment = comments.find((c) => c.id === commentId);
    if (comment) {
      await supabase.from('comments').update({ likes: comment.likes + 1 }).eq('id', commentId);
      fetchComments();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold mb-6">评论 ({comments.length})</h2>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3">
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={replyingTo ? '回复评论...' : currentUser ? '发表评论...' : '登录后发表评论...'}
              disabled={!currentUser}
              className="w-full px-4 py-3 bg-bg-card border border-white/10 rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors resize-none"
              rows={3}
            />
          </div>
          <button
            type="submit"
            disabled={!currentUser || !content.trim() || isSubmitting}
            className="px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isSubmitting ? '提交中...' : '发送'}
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="text-center py-8">
          <svg className="animate-spin h-6 w-6 text-accent mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-text-secondary text-center py-8">暂无评论，快来发表第一条评论吧！</p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="border border-white/10 rounded-lg p-4 bg-bg-card/50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text-primary">
                      {comment.author?.username || '匿名用户'}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-text-secondary mb-3">{comment.content}</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(comment.id)}
                      className="flex items-center gap-1 text-sm text-text-secondary hover:text-accent transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      {comment.likes}
                    </button>
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="text-sm text-text-secondary hover:text-accent transition-colors"
                    >
                      回复
                    </button>
                  </div>

                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-white/10 space-y-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="bg-bg-primary/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-text-primary text-sm">
                              {reply.author?.username || '匿名用户'}
                            </span>
                            <span className="text-xs text-text-secondary">
                              {formatDate(reply.created_at)}
                            </span>
                          </div>
                          <p className="text-text-secondary text-sm">{reply.content}</p>
                          <button
                            onClick={() => setReplyingTo(reply.id)}
                            className="text-xs text-text-secondary hover:text-accent transition-colors mt-2"
                          >
                            回复
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {replyingTo === comment.id && currentUser && (
                    <form onSubmit={handleSubmit} className="mt-4 pl-4 border-l-2 border-accent">
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="回复评论..."
                        className="w-full px-3 py-2 bg-bg-primary border border-white/10 rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors resize-none text-sm"
                        rows={2}
                      />
                      <button
                        type="submit"
                        disabled={!content.trim()}
                        className="mt-2 px-4 py-1 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
                      >
                        发送回复
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}