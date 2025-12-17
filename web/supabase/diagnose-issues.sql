-- ============================================
-- Diagnostic Queries
-- ============================================

-- 1. Check if user ID columns are TEXT (not UUID)
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('users', 'profiles', 'articles')
  AND column_name IN ('id', 'author_id', 'user_id')
ORDER BY table_name, column_name;

-- EXPECTED RESULT:
-- users.id should be: text
-- profiles.id should be: text
-- articles.author_id should be: text
-- If you see "uuid", you need to run fix-clerk-user-ids.sql first!

-- 2. Check if RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('articles', 'article_images', 'tags', 'article_tags', 'article_references')
ORDER BY tablename;

-- EXPECTED: rowsecurity = true for all tables

-- 3. Check what policies exist for articles
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'articles'
ORDER BY policyname;

-- EXPECTED: Should see 5 policies:
-- - articles_delete_admin (DELETE)
-- - articles_insert_admin (INSERT)
-- - articles_select_admin (SELECT)
-- - articles_select_published (SELECT)
-- - articles_update_admin (UPDATE)

-- 4. Check what articles exist in the database
SELECT
  id,
  title,
  slug,
  status,
  published_at,
  author_id,
  created_at
FROM public.articles
ORDER BY created_at DESC;

-- This shows ALL articles (bypasses RLS because you're the database owner)

-- 5. Check if your admin user exists
SELECT
  u.id,
  u.email,
  p.display_name,
  p.role
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- EXPECTED: Your Clerk user ID should be here with role = 'admin'

-- 6. Test RLS policy for published articles (simulates public user)
SET ROLE anon;
SELECT
  id,
  title,
  status
FROM public.articles
WHERE status = 'published';
RESET ROLE;

-- This tests if public users can see published articles
-- If this returns 0 rows but articles exist, RLS policies are blocking access

-- 7. Check if featured column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'articles'
  AND column_name = 'featured';

-- If this returns 0 rows, you need to add the featured column
