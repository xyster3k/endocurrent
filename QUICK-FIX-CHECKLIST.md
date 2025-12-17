# Quick Fix Checklist - Get Articles Working

## Current Issues:
1. ✅ Clerk "fs is missing" error → **FIXED** (removed edge runtime)
2. ❌ Articles not showing in feed
3. ❌ Articles not showing in admin panel

## Fix Steps - Do in Order:

### Step 1: Run Database Fixes

Go to https://supabase.com/dashboard → Your Project → SQL Editor

#### 1a. Run fix-clerk-user-ids.sql
- Open `web/supabase/fix-clerk-user-ids.sql`
- Copy ENTIRE contents
- Paste in SQL Editor
- Click **Run**
- Should see: "Success. No rows returned"

**This fixes:**
- UUID → TEXT conversion for Clerk
- Adds missing `featured` column
- Updates all RLS policies

#### 1b. Run rls-policies.sql
- Open `web/supabase/rls-policies.sql`
- Copy ENTIRE contents
- Paste in SQL Editor
- Click **Run**
- Should see: "Success. No rows returned"

**This adds:**
- RLS policies for articles table
- Public can read published articles
- Admins can manage all articles

#### 1c. Create Your Admin User
- Get your Clerk User ID from https://dashboard.clerk.com → Users
- Open `web/supabase/setup-admin-user.sql`
- Replace `YOUR_CLERK_USER_ID` with your actual ID (starts with `user_`)
- Replace email
- Copy edited contents
- Paste in SQL Editor
- Click **Run**
- Should see 1 row with your user + admin role

### Step 2: Diagnose Issues

Run diagnostic script to check everything:

- Open `web/supabase/diagnose-issues.sql`
- Copy ENTIRE contents
- Paste in SQL Editor
- Click **Run**

**Check the results:**

**Query 1** - User ID types:
- ✅ All should be `text`, not `uuid`
- ❌ If still `uuid`, run fix-clerk-user-ids.sql again

**Query 2** - RLS enabled:
- ✅ All tables should have `rowsecurity = true`

**Query 3** - Article policies:
- ✅ Should see 5 policies for articles

**Query 4** - Articles in database:
- This shows ALL articles (bypasses RLS)
- Check: Do articles have `status = 'published'`?
- Check: Do articles have a `published_at` date?
- If article is draft, it won't show on homepage!

**Query 5** - Your admin user:
- ✅ Your Clerk user ID should be here with `role = 'admin'`
- ❌ If not found, run setup-admin-user.sql

**Query 6** - Public access test:
- This tests if public users can see published articles
- ✅ Should return published articles
- ❌ If returns 0 rows, RLS policies are wrong

**Query 7** - Featured column:
- ✅ Should return 1 row showing `featured | boolean | YES`
- ❌ If 0 rows, run fix-clerk-user-ids.sql again

### Step 3: Publish Your Article

If your article is still draft:

1. Go to http://localhost:3000/admin/articles
2. Find your draft article
3. Click **Edit**
4. Click **Publish** button
5. Set a publish date (today's date)
6. Confirm

**OR** publish via SQL:

```sql
UPDATE public.articles
SET status = 'published',
    published_at = NOW()
WHERE status = 'draft';
```

### Step 4: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 5: Test

1. **Homepage:** http://localhost:3000
   - Should see your published article

2. **Admin:** http://localhost:3000/admin/articles
   - Should see all articles (including drafts)

## Still Not Working?

### Check Environment Variables

Make sure `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (the ANON key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (the SERVICE_ROLE key)
```

They're different keys! Don't mix them up.

### Check Clerk Integration

Your code expects the user role in Clerk metadata, but it's actually in the Supabase profiles table.

**Quick test:** Run this SQL to see if admin API would work:

```sql
SELECT * FROM profiles WHERE id = 'YOUR_CLERK_USER_ID';
```

Should return 1 row with `role = 'admin'`.

### Check Server Logs

When you try to create/view articles, check terminal for errors:
- Supabase connection errors?
- RLS policy violations?
- Authentication errors?

## Common Mistakes

1. ❌ Not running fix-clerk-user-ids.sql FIRST
2. ❌ Mixing up anon key and service role key
3. ❌ Article is draft, not published
4. ❌ Article has no published_at date
5. ❌ Admin user not created in database
6. ❌ Clerk user ID doesn't match database ID
