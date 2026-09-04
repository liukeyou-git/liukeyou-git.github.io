interface PostCardSkeletonProps {
  className?: string;
}

/**
 * 文章卡片骨架屏
 * - 复用 PostCard 的布局结构，内容区用 animate-pulse 灰块
 * - 用于 RecentPosts / FilterablePostList 加载态
 */
export default function PostCardSkeleton({ className = '' }: PostCardSkeletonProps) {
  return (
    <div className={`glass rounded-xl p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-12 rounded-full bg-bg-card/60 animate-pulse"></div>
        <div className="h-5 w-16 rounded-full bg-bg-card/60 animate-pulse"></div>
      </div>
      <div className="h-6 w-3/4 rounded bg-bg-card/60 animate-pulse mb-3"></div>
      <div className="h-4 w-full rounded bg-bg-card/40 animate-pulse mb-2"></div>
      <div className="h-4 w-5/6 rounded bg-bg-card/40 animate-pulse mb-6"></div>
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 rounded bg-bg-card/40 animate-pulse"></div>
        <div className="h-3 w-16 rounded bg-bg-card/40 animate-pulse"></div>
      </div>
    </div>
  );
}
