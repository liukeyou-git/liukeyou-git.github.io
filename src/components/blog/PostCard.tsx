import type { CSSProperties } from 'react';
import Card3D from './Card3D';
import { formatDate, hasSignificantUpdate } from '../../lib/utils';
import type { PostCardData } from '../../types';

interface PostCardProps {
  post: PostCardData;
  showAuthor?: boolean;
  showSourceBadge?: boolean;
  className?: string;
}

/**
 * 共享文章卡片
 * - 用 Card3D 包裹统一的标签/标题/描述/日期/作者/"阅读更多"标记
 * - 复用 utils.ts 的 formatDate / hasSignificantUpdate，消除 7 处重复
 * - 入场动画：fadeInUp + index stagger
 */
export default function PostCard({
  post,
  showAuthor = true,
  showSourceBadge = true,
  className = '',
}: PostCardProps) {
  const showUpdated = hasSignificantUpdate(post.date, post.updatedAt);
  const index = post.index ?? 0;

  const wrapperStyle: CSSProperties = {
    animationDelay: `${index * 50}ms`,
    animation: 'fadeInUp 0.4s ease-out backwards',
  };

  return (
    <div className={`relative ${className}`} style={wrapperStyle}>
      <Card3D href={post.href} className="glass group p-6 hover:border-accent/30">
        {post.cover && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img
              src={post.cover}
              alt={post.title}
              loading="lazy"
              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        {post.tags.length > 0 && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-accent/10 text-accent-hover"
              >
                {tag}
              </span>
            ))}
            {showSourceBadge && post.source === 'dynamic' && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-400">
                用户
              </span>
            )}
          </div>
        )}

        <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:gradient-text transition-all">
          {post.title}
        </h3>

        {post.description && (
          <p className="text-text-secondary text-sm mb-4 line-clamp-2">{post.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-text-secondary">
          <div className="flex items-center gap-2 min-w-0">
            {showUpdated ? (
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                  <path d="M16 5l4 4"></path>
                  <path d="M20 16v5h-5"></path>
                </svg>
                更新于 {formatDate(post.updatedAt)}
              </span>
            ) : (
              <span>{formatDate(post.date)}</span>
            )}
            {showAuthor && post.author && (
              <>
                <span aria-hidden="true">·</span>
                <a
                  href={`/users/${post.author}`}
                  className="hover:text-accent transition-colors truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {post.author}
                </a>
              </>
            )}
          </div>
          <span className="flex items-center gap-1 group-hover:text-accent transition-colors">
            阅读更多
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </span>
        </div>
      </Card3D>
    </div>
  );
}
