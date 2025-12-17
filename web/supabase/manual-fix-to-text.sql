-- ============================================
-- MANUAL FIX: Convert UUID columns to TEXT
-- Run this if reset-and-setup.sql didn't work
-- ============================================

-- Step 1: Drop all foreign key constraints first
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_author_id_fkey;
ALTER TABLE public.user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey;
ALTER TABLE public.article_likes DROP CONSTRAINT IF EXISTS article_likes_user_id_fkey;
ALTER TABLE public.article_reports DROP CONSTRAINT IF EXISTS article_reports_user_id_fkey;
ALTER TABLE public.article_reports DROP CONSTRAINT IF EXISTS article_reports_resolved_by_fkey;

-- Step 2: Convert all user ID columns from UUID to TEXT
ALTER TABLE public.users ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE public.articles ALTER COLUMN author_id TYPE TEXT USING author_id::TEXT;
ALTER TABLE public.user_subscriptions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.article_likes ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.article_reports ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.article_reports ALTER COLUMN resolved_by TYPE TEXT USING resolved_by::TEXT;

-- Step 3: Add missing featured column
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Step 4: Recreate foreign key constraints
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.articles
  ADD CONSTRAINT articles_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.users(id);

ALTER TABLE public.user_subscriptions
  ADD CONSTRAINT user_subscriptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.article_likes
  ADD CONSTRAINT article_likes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.article_reports
  ADD CONSTRAINT article_reports_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.article_reports
  ADD CONSTRAINT article_reports_resolved_by_fkey
  FOREIGN KEY (resolved_by) REFERENCES public.users(id);

-- Step 5: Verify the changes
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('users', 'profiles', 'articles')
  AND column_name IN ('id', 'author_id')
ORDER BY table_name, column_name;

-- EXPECTED: All should show 'text' now
