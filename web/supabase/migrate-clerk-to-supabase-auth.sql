-- ============================================
-- Migrate Clerk → Supabase Auth (All-in-one)
-- ============================================
--
-- BEFORE RUNNING:
-- 1. Go to Supabase Dashboard → Authentication → Users → Add User
--    Email: yuriy.poteshkin@gmail.com, set a password
-- 2. Copy the UUID it generates
-- 3. Paste it below replacing fcd7eec2-4f21-43c3-b82f-5483733263f4
-- 4. Run this script in the Supabase SQL Editor

BEGIN;

-- =====================
-- YOUR SUPABASE AUTH UUID (replace this one value)
-- =====================
DO $$
DECLARE
  new_uuid TEXT := 'fcd7eec2-4f21-43c3-b82f-5483733263f4';
  clerk_id TEXT := 'user_36okOSsQ7TkVCzS7cgknJHpCI51';
BEGIN

  -- Step 1: Drop foreign key constraints
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
  ALTER TABLE public.user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey;
  ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_author_id_fkey;
  ALTER TABLE public.article_likes DROP CONSTRAINT IF EXISTS article_likes_user_id_fkey;
  ALTER TABLE public.article_reports DROP CONSTRAINT IF EXISTS article_reports_user_id_fkey;
  ALTER TABLE public.article_reports DROP CONSTRAINT IF EXISTS article_reports_resolved_by_fkey;
  ALTER TABLE public.article_shares DROP CONSTRAINT IF EXISTS article_shares_user_id_fkey;

  -- Step 2: Remap Clerk ID → Supabase UUID in all tables
  UPDATE public.users SET id = new_uuid WHERE id = clerk_id;
  UPDATE public.profiles SET id = new_uuid WHERE id = clerk_id;
  UPDATE public.articles SET author_id = new_uuid WHERE author_id = clerk_id;
  UPDATE public.article_likes SET user_id = new_uuid WHERE user_id = clerk_id;
  UPDATE public.article_reports SET user_id = new_uuid WHERE user_id = clerk_id;
  UPDATE public.article_reports SET resolved_by = new_uuid WHERE resolved_by = clerk_id;
  UPDATE public.article_shares SET user_id = new_uuid WHERE user_id = clerk_id;
  UPDATE public.user_subscriptions SET user_id = new_uuid WHERE user_id = clerk_id;

  -- Step 3: Ensure admin role is set
  UPDATE public.profiles
  SET role = 'admin', updated_at = NOW()
  WHERE id = new_uuid;

  -- Step 4: Re-add foreign key constraints
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;
  ALTER TABLE public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  ALTER TABLE public.articles
    ADD CONSTRAINT articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);

END $$;

-- Step 5: Verify — all counts should be 0
SELECT 'users' as tbl, count(*) as remaining_clerk_ids
FROM public.users WHERE id LIKE 'user_%'
UNION ALL
SELECT 'profiles', count(*) FROM public.profiles WHERE id LIKE 'user_%'
UNION ALL
SELECT 'articles', count(*) FROM public.articles WHERE author_id LIKE 'user_%'
UNION ALL
SELECT 'article_likes', count(*) FROM public.article_likes WHERE user_id LIKE 'user_%'
UNION ALL
SELECT 'article_reports', count(*) FROM public.article_reports WHERE user_id LIKE 'user_%';

COMMIT;
