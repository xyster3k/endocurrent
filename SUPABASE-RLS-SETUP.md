# Supabase RLS Setup Guide

## Problem

You're getting:
- Empty site (no articles loading)
- Error when creating articles: "new row violates row-level security policy for table 'articles'"

## Root Cause

RLS (Row Level Security) was enabled on the `articles` table, but no policies were created. This blocks ALL access to the table.

## Solution - Step by Step

### Step 1: Apply RLS Policies

1. Go to https://supabase.com/dashboard
2. Select your project: **nrirqijyayrwhckmjltn**
3. Go to **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy ALL contents from `web/supabase/rls-policies.sql`
6. Paste into SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. You should see: "Success. No rows returned"

### Step 2: Create Your Admin User

1. **Get your Clerk User ID:**
   - Go to https://dashboard.clerk.com
   - Click **Users** in the left sidebar
   - Find your user and click on it
   - Copy the **User ID** (looks like: `user_xxxxxxxxxxxxxxxxxxxxx`)

2. **Open `web/supabase/setup-admin-user.sql`**

3. **Edit the file and replace:**
   - `YOUR_CLERK_USER_ID` → Your actual Clerk User ID
   - `your-email@example.com` → Your actual email

4. **Run the SQL:**
   - Go back to Supabase SQL Editor
   - Click **New query**
   - Copy the EDITED contents from `setup-admin-user.sql`
   - Paste into SQL Editor
   - Click **Run**
   - You should see 1 row returned showing your user with `admin` role

### Step 3: Test the Connection

1. **Test public article reading:**
   - Open your site homepage
   - You should see published articles (if any exist)
   - If no articles exist yet, that's OK - move to next step

2. **Test admin article creation:**
   - Log into your site with your Clerk account
   - Go to `/admin/articles/new`
   - Try creating a new article
   - It should now work without RLS errors!

## What These Policies Do

### Articles Table:
- **Public users:** Can read published articles only
- **Admin/Editor users:** Can read, create, update, and delete all articles (including drafts)
- **Service role (API):** Bypasses ALL policies (used by admin API endpoints)

### Related Tables (images, tags, references):
- **Public users:** Can read everything
- **Admin/Editor users:** Can create, update, and delete

## Troubleshooting

### Still getting "new row violates row-level security policy"?

**Check 1:** Verify your admin user was created correctly:
```sql
SELECT u.id, u.email, p.display_name, p.role
FROM public.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'your-email@example.com';
```

You should see your user with `role = 'admin'`.

**Check 2:** Verify the Clerk user ID matches:
- The UUID in Supabase must EXACTLY match your Clerk user ID
- Clerk user IDs look like: `user_2abc123def456ghi789`
- In Supabase, this becomes a UUID

**Check 3:** Check if policies were applied:
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'articles';
```

You should see 5 policies for articles table.

### Articles still not showing on homepage?

**Option 1:** No published articles exist yet
- Create an article in admin panel
- Set status to "published"
- Set a published_at date

**Option 2:** Check environment variables:
- Make sure `NEXT_PUBLIC_SUPABASE_URL` is set in Cloudflare
- Make sure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in Cloudflare

### Admin panel shows "Unauthorized" or "Forbidden"?

Make sure:
1. You're logged in with your Clerk account
2. Your Clerk user ID is in the `users` table
3. Your profile has `role = 'admin'` in the `profiles` table

## Understanding RLS with Service Role

Your app has TWO ways to access Supabase:

1. **Frontend/Public (uses ANON_KEY):**
   - Subject to RLS policies
   - Can only see published articles
   - Cannot create/edit articles

2. **Admin API (uses SERVICE_ROLE_KEY):**
   - BYPASSES all RLS policies
   - Full access to everything
   - Used in `/api/admin/*` endpoints

This is why your admin API routes use:
```typescript
const supabase = await createSupabaseServerClient({ useServiceRole: true });
```

## Files Created

1. `web/supabase/rls-policies.sql` - RLS policies for all tables
2. `web/supabase/setup-admin-user.sql` - Script to create your admin user
3. `SUPABASE-RLS-SETUP.md` - This guide
