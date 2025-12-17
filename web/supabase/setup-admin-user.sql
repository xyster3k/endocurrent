-- ============================================
-- Setup Admin User
-- ============================================

-- STEP 1: Find your Clerk user ID
-- Go to Clerk Dashboard → Users → Click your user → Copy the User ID
-- It looks like: user_2xxxxxxxxxxxxxxxxxxxxx (starts with "user_")

-- STEP 2: Replace 'YOUR_CLERK_USER_ID' below with your actual Clerk user ID
-- STEP 3: Replace 'your-email@example.com' with your actual email

-- Insert user (if not exists)
INSERT INTO public.users (id, email, created_at)
VALUES (
  'user_36okOSsQ7TkVCzS7cgknJHpCI51',
  'yuriy.poteshkin@gmail.com',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert or update profile with admin role
INSERT INTO public.profiles (id, display_name, role, created_at, updated_at)
VALUES (
  'user_36okOSsQ7TkVCzS7cgknJHpCI51',
  'Admin User',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin',
    updated_at = NOW();

-- Verify your admin user was created
SELECT u.id, u.email, p.display_name, p.role
FROM public.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.id = 'user_36okOSsQ7TkVCzS7cgknJHpCI51';
