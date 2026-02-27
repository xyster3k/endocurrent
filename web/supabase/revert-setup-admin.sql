-- ============================================
-- Revert: Remove junk rows from setup-admin-user.sql
-- ============================================
-- This removes the rows created with literal placeholder text 'YOUR_SUPABASE_AUTH_UUID'

BEGIN;

DELETE FROM public.profiles WHERE id = 'YOUR_SUPABASE_AUTH_UUID';
DELETE FROM public.users WHERE id = 'YOUR_SUPABASE_AUTH_UUID';

-- Verify cleanup
SELECT 'users' as tbl, count(*) as junk_rows FROM public.users WHERE id = 'YOUR_SUPABASE_AUTH_UUID'
UNION ALL
SELECT 'profiles', count(*) FROM public.profiles WHERE id = 'YOUR_SUPABASE_AUTH_UUID';
-- Both should show 0

COMMIT;
