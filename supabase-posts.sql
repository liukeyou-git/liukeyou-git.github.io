-- ============================================
-- 用户发文 posts 表
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 1. 创建 posts 表
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at DESC);

-- 3. 启用 RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 4. 删除已存在的策略（幂等）
DROP POLICY IF EXISTS "Public can read published posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can read their own drafts" ON public.posts;
DROP POLICY IF EXISTS "Authors can insert posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can delete their own posts" ON public.posts;

-- 5. 创建 RLS 策略
-- 5.1 任何人可读已发布文章
CREATE POLICY "Public can read published posts" ON public.posts
  FOR SELECT USING (status = 'published');

-- 5.2 作者可读自己的草稿
CREATE POLICY "Authors can read their own drafts" ON public.posts
  FOR SELECT USING (auth.uid() = author_id);

-- 5.3 登录用户可发布文章
CREATE POLICY "Authors can insert posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 5.4 作者可更新自己的文章
CREATE POLICY "Authors can update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

-- 5.5 作者可删除自己的文章
CREATE POLICY "Authors can delete their own posts" ON public.posts
  FOR DELETE USING (auth.uid() = author_id);

-- 6. 授权
GRANT ALL ON public.posts TO anon, authenticated, service_role;

-- 7. 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_posts_updated_at ON public.posts;
CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 8. 重新加载 PostgREST schema
NOTIFY pgrst, 'reload schema';

SELECT 'posts 表创建完成' AS status;
