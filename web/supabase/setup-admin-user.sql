-- ============================================
-- Setup Admin User (Supabase Auth)
-- ============================================
--
-- Only use this for NEW installs (no existing Clerk data).
-- If migrating from Clerk, use migrate-clerk-to-supabase-auth.sql instead.
--
-- STEP 1: Create a Supabase Auth account
-- Go to Supabase Dashboard → Authentication → Users → Add User
--
-- STEP 2: Copy the UUID and replace below

INSERT INTO public.users (id, email, created_at)
VALUES (
  'YOUR_SUPABASE_AUTH_UUID',
  'your-email@example.com',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, display_name, role, created_at, updated_at)
VALUES (
  'YOUR_SUPABASE_AUTH_UUID',
  'Your Name',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin',
    updated_at = NOW();
