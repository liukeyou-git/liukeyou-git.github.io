import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { PostDraft } from '../../types';

interface PostEditorProps {
  initial?: Partial<PostDraft> & { id?: string };
  onSaved?: (postId: string) => void;
  onCancel?: () => void;
}

export default function PostEditor({ initial, onSaved, onCancel }: PostEditorProps) {
  const { authState } = useAuth();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(', '));
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const postId = initial?.id;
  const isEdit = !!postId;

  const handleSave = async (status: 'draft' | 'published') => {
    if (!supabase) {
      setError('Supabase 未初始化');
      return;
    }
    if (!authState.user) {
      setError('请先登录');
      return;
    }
    if (!title.trim()) {
      setError('请填写标题');
      return;
    }
    if (!content.trim()) {
      setError('请填写内容');
      return;
    }

    setIsSaving(true);
    setError(null);

    const tags = tagsInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      author_id: authState.user.id,
      title: title.trim(),
      description: description.trim() || null,
      content: content.trim(),
      tags,
      cover_url: coverUrl.trim() || null,
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
    };

    let result;
    if (isEdit && postId) {
      result = await supabase
        .from('posts')
        .update(payload)
        .eq('id', postId)
        .eq('author_id', authState.user.id)
        .select('id')
        .single();
    } else {
      result = await supabase
        .from('posts')
        .insert(payload)
        .select('id')
        .single();
    }

    setIsSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    onSaved?.(result.data!.id);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          标题 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="给你的文章起个标题"
          className="w-full px-4 py-3 bg-bg-card border border-white/10 rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">描述</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="一句话介绍这篇文章（用于列表和分享）"
          className="w-full px-4 py-3 bg-bg-card border border-white/10 rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">标签</label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="用逗号分隔，例如：技术栈, Astro, React"
          className="w-full px-4 py-3 bg-bg-card border border-white/10 rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">封面 URL</label>
        <input
          type="text"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="https://...（可选）"
          className="w-full px-4 py-3 bg-bg-card border border-white/10 rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
        />
        {coverUrl && (
          <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
            <img
              src={coverUrl}
              alt="cover preview"
              className="w-full h-40 object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-text-secondary">
            内容 <span className="text-red-400">*</span>
            <span className="ml-2 text-xs text-text-secondary/60">支持 Markdown · GFM</span>
          </label>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-card border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className={`px-3 py-1 rounded transition-colors ${
                !showPreview ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              编辑
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className={`px-3 py-1 rounded transition-colors ${
                showPreview ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              预览
            </button>
          </div>
        </div>
        {showPreview ? (
          <div className="prose min-h-[400px] px-4 py-3 bg-bg-card border border-white/10 rounded-lg max-w-none">
            {content.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {content}
              </ReactMarkdown>
            ) : (
              <p className="text-text-secondary/50">暂无内容</p>
            )}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# 标题&#10;&#10;开始你的创作...&#10;&#10;支持 **Markdown** 语法、`代码`、```代码块```、表格、列表、引用等。"
            className="w-full min-h-[400px] px-4 py-3 bg-bg-card border border-white/10 rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors font-mono text-sm resize-y"
          />
        )}
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => handleSave('published')}
          disabled={isSaving}
          className="px-6 py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {isSaving ? '发布中...' : isEdit ? '更新发布' : '发布'}
        </button>
        <button
          type="button"
          onClick={() => handleSave('draft')}
          disabled={isSaving}
          className="px-6 py-2.5 bg-bg-card text-text-secondary border border-white/10 rounded-lg hover:bg-white/5 hover:text-text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          保存草稿
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-text-secondary hover:text-text-primary transition-colors"
          >
            取消
          </button>
        )}
        <span className="ml-auto text-xs text-text-secondary/60">{content.length} 字</span>
      </div>
    </div>
  );
}
