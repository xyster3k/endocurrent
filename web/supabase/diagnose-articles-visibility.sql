-- ============================================
-- DIAGNOSE WHY ARTICLES DON'T SHOW IN UI
-- ============================================

-- 1. Check if articles exist (bypasses RLS)
SELECT
  id,
  title,
  status,
  author_id,
  created_at
FROM public.articles
ORDER BY created_at DESC;

-- 2. Check what your Clerk user ID is in the database
SELECT
  u.id as user_id,
  u.email,
  p.role
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.role IN ('admin', 'editor');

-- 3. Check if RLS policies exist for articles
SELECT
  policyname,
  cmd,
  CASE
    WHEN cmd = 'SELECT' THEN 'Allows viewing articles'
    WHEN cmd = 'INSERT' THEN 'Allows creating articles'
    WHEN cmd = 'UPDATE' THEN 'Allows editing articles'
    WHEN cmd = 'DELETE' THEN 'Allows deleting articles'
  END as description
FROM pg_policies
WHERE tablename = 'articles'
ORDER BY cmd, policyname;

-- 4. Test if YOUR user can see articles through RLS
-- Replace 'user_36okOSsQ7TkVCzS7cgknJHpCI51' with your actual Clerk user ID
DO $$
DECLARE
  user_clerk_id TEXT := 'user_36okOSsQ7TkVCzS7cgknJHpCI51';
  article_count INT;
  has_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE id = user_clerk_id
    AND role IN ('admin', 'editor')
  ) INTO has_admin;

  RAISE NOTICE 'User % is admin/editor: %', user_clerk_id, has_admin;

  -- This simulates what happens when the app tries to fetch articles
  -- It sets the JWT claim to your user ID
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user_clerk_id)::text, true);

  -- Now try to select articles (this will use RLS policies)
  SELECT COUNT(*) INTO article_count
  FROM public.articles;

  RAISE NOTICE 'Articles visible with RLS: %', article_count;
END $$;

-- 5. Check if anon role can see published articles
SET ROLE anon;
SELECT COUNT(*) as published_articles_visible_to_public
FROM public.articles
WHERE status = 'published';
RESET ROLE;

-- 6. Check if service_role can see all articles (bypasses RLS)
SET ROLE service_role;
SELECT COUNT(*) as all_articles_visible_to_service_role
FROM public.articles;
RESET ROLE;
