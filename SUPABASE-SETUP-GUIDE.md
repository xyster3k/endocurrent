# Complete Supabase Setup Guide

## Problem Summary

1. **Empty site** - No articles loading
2. **RLS Error** - "new row violates row-level security policy for table 'articles'"

## Root Causes

1. RLS enabled on `articles` table but NO policies exist
2. Database uses `uuid` for user IDs, but Clerk IDs are strings like `user_2abc123...`

## Complete Fix - Follow in Order!

---

## Step 1: Fix User ID Schema (CRITICAL - Do This First!)

Your database schema has a fundamental incompatibility with Clerk:
- **Current:** User IDs are UUID type
- **Clerk:** User IDs are TEXT strings like `user_2abc123xyz...`

### Run the Fix:

1. Go to https://supabase.com/dashboard
2. Select project: **nrirqijyayrwhckmjltn**
3. Click **SQL Editor** (left sidebar)
4. Click **New query**
5. Open file: `web/supabase/fix-clerk-user-ids.sql`
6. **Copy the ENTIRE file contents**
7. Paste into SQL Editor
8. Click **Run** (or Ctrl+Enter)
9. Wait for "Success. No rows returned"

### What This Does:

- Changes `users.id` from `uuid` to `text`
- Updates ALL foreign keys to use `text`
- Updates ALL RLS policies to use `auth.jwt()->>'sub'` (Clerk JWT)
- Enables proper Clerk integration

---

## Step 2: Apply RLS Policies for Articles

Now that user IDs are fixed, apply the article policies:

1. Still in **SQL Editor**
2. Click **New query**
3. Open file: `web/supabase/rls-policies.sql`
4. **Copy the ENTIRE file contents**
5. Paste into SQL Editor
6. Click **Run**
7. You should see: "Success. No rows returned"

### What This Does:

**Articles:**
- Public users can read published articles
- Admin/Editor users can manage all articles

**Related Tables:**
- Public read access for images, tags, references
- Admin/Editor write access

---

## Step 3: Create Your Admin User

### Get Your Clerk User ID:

1. Go to https://dashboard.clerk.com
2. Click **Users** (left sidebar)
3. Find and click on YOUR user
4. Copy the **User ID** (looks like: `user_2abc123...`)

### Create Admin in Database:

1. Open file: `web/supabase/setup-admin-user.sql`
2. **Replace `YOUR_CLERK_USER_ID`** with your actual Clerk user ID
3. **Replace `your-email@example.com`** with your email
4. Go to Supabase **SQL Editor**
5. Click **New query**
6. **Copy your EDITED file contents**
7. Paste into SQL Editor
8. Click **Run**
9. You should see 1 row returned showing your user with `admin` role

### Example:

If your Clerk user ID is `user_2abc123xyz456`, your SQL should look like:

```sql
INSERT INTO public.users (id, email, created_at)
VALUES (
  'user_2abc123xyz456',
  'your@email.com',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, display_name, role, created_at, updated_at)
VALUES (
  'user_2abc123xyz456',
  'Admin User',
  'admin',
  NOW(),
  NOW()
)
...
```

---

## Step 4: Test Everything

### Test 1: Public Article Reading

1. Open your site (logged out)
2. Homepage should load
3. If you have published articles, they should display
4. If no articles exist yet, homepage will be empty (normal)

### Test 2: Admin Login

1. Go to your site
2. Click "Sign In" (should redirect to Clerk)
3. Log in with your Clerk account
4. You should be redirected back

### Test 3: Create Article

1. Make sure you're logged in
2. Go to `/admin/articles/new`
3. Fill in:
   - Title
   - Slug (must be unique, lowercase, dashes)
   - Summary
   - Category
   - Body markdown
4. Click **Save as Draft**
5. Should see success message

### Test 4: Publish Article

1. Go to `/admin/articles`
2. Find your draft article
3. Click **Edit**
4. Click **Publish**
5. Set publish date
6. Confirm
7. Go to homepage
8. Your published article should appear!

---

## Troubleshooting

### Still Getting RLS Errors?

#### Check 1: Verify Policies Exist

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'articles'
ORDER BY policyname;
```

You should see 5 policies:
- `articles_delete_admin` (DELETE)
- `articles_insert_admin` (INSERT)
- `articles_select_admin` (SELECT)
- `articles_select_published` (SELECT)
- `articles_update_admin` (UPDATE)

#### Check 2: Verify User ID Type Changed

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'id';
```

Should show: `data_type = text` (NOT uuid)

#### Check 3: Verify Your Admin User

```sql
SELECT u.id, u.email, p.role
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'your@email.com';
```

Should show:
- `id` = your Clerk user ID (starts with `user_`)
- `role` = `admin`

### Articles Still Not Showing?

#### Option 1: No Published Articles Yet

- Create an article in admin panel
- Set status to "published"
- Set a published_at date
- Article should appear on homepage

#### Option 2: Environment Variables Missing

Check Cloudflare Pages dashboard:
- `NEXT_PUBLIC_SUPABASE_URL` exists
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` exists
- `SUPABASE_SERVICE_ROLE_KEY` exists

### "Unauthorized" in Admin Panel?

1. Verify you're logged in (check Clerk)
2. Verify your Clerk user ID is in `users` table
3. Verify your profile has `role = 'admin'`

Run this query to check:

```sql
SELECT * FROM public.profiles WHERE role = 'admin';
```

---

## Understanding the Setup

### Two Ways to Access Supabase:

1. **Public/Frontend (anon key):**
   - Goes through RLS policies
   - Can only see published articles
   - Cannot create/edit articles

2. **Admin API (service role key):**
   - BYPASSES all RLS policies
   - Full database access
   - Used in `/api/admin/*` routes

### How Clerk Integration Works:

When a user logs in with Clerk:
1. Clerk creates a JWT token
2. JWT contains user ID in `sub` field
3. Supabase extracts this: `auth.jwt()->>'sub'`
4. RLS policies check this against `profiles.id`
5. If user is admin/editor, they can manage articles

---

## Files Created

1. `web/supabase/fix-clerk-user-ids.sql` - Fixes UUID/TEXT incompatibility
2. `web/supabase/rls-policies.sql` - Article RLS policies
3. `web/supabase/setup-admin-user.sql` - Creates your admin user
4. `SUPABASE-SETUP-GUIDE.md` - This guide

---

## Quick Reference

### Key SQL Commands

**Check policies:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'articles';
```

**Check your admin user:**
```sql
SELECT u.*, p.* FROM users u JOIN profiles p ON u.id = p.id WHERE p.role = 'admin';
```

**List all users:**
```sql
SELECT id, email FROM users;
```

**Manually make someone admin:**
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'user_2abc123...';
```
