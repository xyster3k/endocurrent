-- ============================================
-- Fix User ID Type for Clerk Integration
-- ============================================
-- Clerk user IDs are strings like "user_2abc123...", not UUIDs
-- This script converts the schema to use TEXT for user IDs

-- IMPORTANT: Run this BEFORE inserting any data
-- If you already have data, you'll need to migrate it separately

-- Step 1: Drop existing foreign key constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_author_id_fkey;
ALTER TABLE public.article_reports DROP CONSTRAINT IF EXISTS article_reports_resolved_by_fkey;
ALTER TABLE public.user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey;
ALTER TABLE public.article_likes DROP CONSTRAINT IF EXISTS article_likes_user_id_fkey CASCADE;
ALTER TABLE public.article_reports DROP CONSTRAINT IF EXISTS article_reports_user_id_fkey CASCADE;

-- Step 2: Change column types from UUID to TEXT
ALTER TABLE public.users ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.articles ALTER COLUMN author_id TYPE TEXT;
ALTER TABLE public.article_reports ALTER COLUMN resolved_by TYPE TEXT;
ALTER TABLE public.user_subscriptions ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.article_likes ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.article_reports ALTER COLUMN user_id TYPE TEXT;

-- Step 2.5: Add missing featured column to articles table
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Step 3: Recreate foreign key constraints
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.articles
  ADD CONSTRAINT articles_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.users(id);

ALTER TABLE public.article_reports
  ADD CONSTRAINT article_reports_resolved_by_fkey
  FOREIGN KEY (resolved_by) REFERENCES public.users(id);

ALTER TABLE public.user_subscriptions
  ADD CONSTRAINT user_subscriptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Step 4: Update RLS policies to use auth.jwt() for Clerk
-- Drop old policies first
DROP POLICY IF EXISTS "profiles select own" ON public.profiles;
DROP POLICY IF EXISTS "profiles insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles update own" ON public.profiles;
DROP POLICY IF EXISTS "subscriptions select own" ON public.user_subscriptions;
DROP POLICY IF EXISTS "subscriptions upsert own" ON public.user_subscriptions;
DROP POLICY IF EXISTS "subscriptions update own" ON public.user_subscriptions;
DROP POLICY IF EXISTS "likes insert" ON public.article_likes;
DROP POLICY IF EXISTS "likes update own" ON public.article_likes;

-- Recreate policies with Clerk JWT
CREATE POLICY "profiles select own" ON public.profiles FOR SELECT
  USING (id = (auth.jwt()->>'sub')::text);

CREATE POLICY "profiles insert" ON public.profiles FOR INSERT
  WITH CHECK (id = (auth.jwt()->>'sub')::text);

CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE
  USING (id = (auth.jwt()->>'sub')::text)
  WITH CHECK (id = (auth.jwt()->>'sub')::text);

CREATE POLICY "subscriptions select own" ON public.user_subscriptions FOR SELECT
  USING (user_id = (auth.jwt()->>'sub')::text);

CREATE POLICY "subscriptions upsert own" ON public.user_subscriptions FOR INSERT
  WITH CHECK (user_id = (auth.jwt()->>'sub')::text);

CREATE POLICY "subscriptions update own" ON public.user_subscriptions FOR UPDATE
  USING (user_id = (auth.jwt()->>'sub')::text)
  WITH CHECK (user_id = (auth.jwt()->>'sub')::text);

CREATE POLICY "likes insert" ON public.article_likes FOR INSERT
  WITH CHECK (user_id = (auth.jwt()->>'sub')::text);

CREATE POLICY "likes update own" ON public.article_likes FOR UPDATE
  USING (user_id = (auth.jwt()->>'sub')::text);

-- Drop and recreate article policies with Clerk JWT
DROP POLICY IF EXISTS "articles_select_admin" ON public.articles;
DROP POLICY IF EXISTS "articles_insert_admin" ON public.articles;
DROP POLICY IF EXISTS "articles_update_admin" ON public.articles;
DROP POLICY IF EXISTS "articles_delete_admin" ON public.articles;

CREATE POLICY "articles_select_admin" ON public.articles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "articles_insert_admin" ON public.articles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "articles_update_admin" ON public.articles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "articles_delete_admin" ON public.articles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role = 'admin'
    )
  );

-- Update policies for related tables
DROP POLICY IF EXISTS "article_images_insert_admin" ON public.article_images;
DROP POLICY IF EXISTS "article_images_update_admin" ON public.article_images;
DROP POLICY IF EXISTS "article_images_delete_admin" ON public.article_images;

CREATE POLICY "article_images_insert_admin" ON public.article_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "article_images_update_admin" ON public.article_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "article_images_delete_admin" ON public.article_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Tags policies
DROP POLICY IF EXISTS "tags_insert_admin" ON public.tags;
DROP POLICY IF EXISTS "tags_update_admin" ON public.tags;
DROP POLICY IF EXISTS "tags_delete_admin" ON public.tags;

CREATE POLICY "tags_insert_admin" ON public.tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "tags_update_admin" ON public.tags
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "tags_delete_admin" ON public.tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role = 'admin'
    )
  );

-- Article tags policies
DROP POLICY IF EXISTS "article_tags_insert_admin" ON public.article_tags;
DROP POLICY IF EXISTS "article_tags_delete_admin" ON public.article_tags;

CREATE POLICY "article_tags_insert_admin" ON public.article_tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "article_tags_delete_admin" ON public.article_tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Article references policies
DROP POLICY IF EXISTS "article_references_insert_admin" ON public.article_references;
DROP POLICY IF EXISTS "article_references_update_admin" ON public.article_references;
DROP POLICY IF EXISTS "article_references_delete_admin" ON public.article_references;

CREATE POLICY "article_references_insert_admin" ON public.article_references
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "article_references_update_admin" ON public.article_references
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "article_references_delete_admin" ON public.article_references
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Update reports policy
DROP POLICY IF EXISTS "reports_select_editors" ON public.article_reports;

CREATE POLICY "reports_select_editors" ON public.article_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (auth.jwt()->>'sub')::text
      AND p.role IN ('editor','admin')
    )
  );
