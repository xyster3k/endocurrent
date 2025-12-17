-- ============================================
-- RLS Policies for Articles Table
-- ============================================

-- Enable RLS on articles table
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone can SELECT published articles
CREATE POLICY "articles_select_published" ON public.articles
  FOR SELECT
  USING (status = 'published');

-- Policy 2: Authenticated users with admin/editor role can SELECT all articles
CREATE POLICY "articles_select_admin" ON public.articles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Policy 3: Authenticated users with admin/editor role can INSERT articles
CREATE POLICY "articles_insert_admin" ON public.articles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Policy 4: Authenticated users with admin/editor role can UPDATE articles
CREATE POLICY "articles_update_admin" ON public.articles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Policy 5: Authenticated users with admin role can DELETE articles
CREATE POLICY "articles_delete_admin" ON public.articles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- RLS Policies for Related Tables
-- ============================================

-- Article Images: Public read, admin/editor write
ALTER TABLE public.article_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "article_images_select" ON public.article_images
  FOR SELECT
  USING (true);

CREATE POLICY "article_images_insert_admin" ON public.article_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "article_images_update_admin" ON public.article_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "article_images_delete_admin" ON public.article_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Tags: Public read, admin/editor write
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_select" ON public.tags
  FOR SELECT
  USING (true);

CREATE POLICY "tags_insert_admin" ON public.tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "tags_update_admin" ON public.tags
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "tags_delete_admin" ON public.tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Article Tags: Public read, admin/editor write
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "article_tags_select" ON public.article_tags
  FOR SELECT
  USING (true);

CREATE POLICY "article_tags_insert_admin" ON public.article_tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "article_tags_delete_admin" ON public.article_tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Article References: Public read, admin/editor write
ALTER TABLE public.article_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "article_references_select" ON public.article_references
  FOR SELECT
  USING (true);

CREATE POLICY "article_references_insert_admin" ON public.article_references
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "article_references_update_admin" ON public.article_references
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "article_references_delete_admin" ON public.article_references
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );
