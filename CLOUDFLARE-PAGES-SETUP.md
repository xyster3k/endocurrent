# Cloudflare Pages Deployment Setup

## IMPORTANT: Project is Now Configured for Cloudflare Pages

This project uses **Next.js 16.0.10** (secure version, fixes CVE-2025-66478) with **@opennextjs/cloudflare adapter**.

The adapter converts Next.js output to Cloudflare Pages Advanced Mode format using `_worker.js`. This enables:
- ✅ Full Next.js App Router support
- ✅ Server-side rendering (SSR)
- ✅ Edge runtime
- ✅ Middleware (Clerk authentication)
- ✅ Server Actions
- ✅ NO WRANGLER needed!

## Step 1: Cloudflare Pages Build Settings

1. Go to https://dash.cloudflare.com
2. Click **Workers & Pages** → Select your **endocurrent** project
3. Go to **Settings** → **Builds & deployments**
4. Click **Edit configuration** and set:

**Framework preset:** `Next.js`

**Root directory (Build directory):** `web`
⚠️ IMPORTANT: This must be set to `web` not `/`

**Build command:**
```
npm install && npm run build:cloudflare
```
⚠️ IMPORTANT: Use `npm run build:cloudflare` which builds with OpenNext and structures output for Cloudflare Pages

**Build output directory:**
```
.cloudflare/dist
```
⚠️ IMPORTANT: This is `.cloudflare/dist` (contains `_worker.js` and static assets)

**Node.js version:** `22` (or leave as Auto)

## Step 2: Add Environment Variables - CRITICAL!

⚠️ **This is the most important step!** Missing variables cause 500 errors and "0 of 0 articles" issues.

1. Go to **Settings** → **Environment variables**
2. Make sure you're on the **Production** tab
3. Add each variable below by clicking **Add variable**

### How Variables Work in Cloudflare

- **All variables are added the same way** - there's no separate UI for "public" vs "secret"
- The **"Encrypt"** checkbox just hides the value in Cloudflare's UI (optional for all variables)
- `NEXT_PUBLIC_*` variables are automatically available in browser code (that's how Next.js works)
- Other variables are server-only and never exposed to the browser

### ✅ Variables to Add (Copy-paste these exactly):

**Variable 1:**
```
Name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_test_cXVhbGl0eS1zbHVnLTIzLmNsZXJrLmFjY291bnRzLmRldiQ
```

**Variable 2:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://nrirqijyayrwhckmjltn.supabase.co
```

**Variable 3:**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yaXJxaWp5YXlyd2hja21qbHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDM1OTQsImV4cCI6MjA4MTIxOTU5NH0.qZMatidbHAbDcIPEX8EC86WtmZLdlQyBrCAEpXUjcrY
```

**Variable 4:**
```
Name: NEXT_PUBLIC_ADSENSE_CLIENT
Value: pub-4712145302121710
```

**Variable 5:**
```
Name: NEXT_PUBLIC_SITE_URL
Value: https://endocurrent.pages.dev
```
(⚠️ Change this to your actual Cloudflare Pages URL if different!)

**Variable 6:**
```
Name: CLERK_SECRET_KEY
Value: sk_test_FURqEu3pOkqP3Ut5BKr8zIMSFu68PnYtIR3rEQtrXd
```
(✅ Check "Encrypt" box for this one to hide it)

**Variable 7:**
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yaXJxaWp5YXlyd2hja21qbHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDM1OTQsImV4cCI6MjA4MTIxOTU5NH0.qZMatidbHAbDcIPEX8EC86WtmZLdlQyBrCAEpXUjcrY
```
(✅ Check "Encrypt" box for this one to hide it)

### ✅ Verify All Variables Added

After adding, you should see 7 variables in the list:
1. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
2. NEXT_PUBLIC_SUPABASE_URL
3. NEXT_PUBLIC_SUPABASE_ANON_KEY
4. NEXT_PUBLIC_ADSENSE_CLIENT
5. NEXT_PUBLIC_SITE_URL
6. CLERK_SECRET_KEY (encrypted)
7. SUPABASE_SERVICE_ROLE_KEY (encrypted)

## Step 3: Add Compatibility Flags for Node.js Features

Clerk authentication requires Node.js APIs. Add these compatibility flags:

1. Go to **Settings** → **Functions**
2. Scroll to **Compatibility flags**
3. Click **Add flag** and add these one by one:
   - `nodejs_compat`
   - `nodejs_als`

These flags enable Node.js async_hooks and other APIs that Clerk needs.

## Step 4: Deploy

**Option 1: Push code to trigger auto-deploy (Recommended)**
```bash
git add -A
git commit -m "Configure for Cloudflare Pages"
git push
```

Cloudflare will automatically detect the push and start a new deployment.

**Option 2: Manual deployment from dashboard**
- Go to **Deployments** tab in Cloudflare
- Click **Create deployment**
- Select your branch and deploy

## Step 5: Verify Deployment

After deployment completes:

1. Click **View deployment** to open your site
2. Check that the homepage loads without errors
3. Try creating an article at `/admin/articles/new`
4. Verify your published articles appear on the homepage

### Expected Results:
- ✅ Homepage shows your published articles from Supabase
- ✅ Admin panel works with Clerk authentication
- ✅ No 500 errors
- ✅ No "0 of 0 articles" message

## Troubleshooting

### Build Fails

**Check these settings:**
- Root directory must be set to `web`
- Build command: `npm install && npm run build`
- Build output directory: `.cloudflare/dist` (NOT `.next`)
- All 7 environment variables are added
- Node.js version is 22 or Auto

**Common errors:**
- `cd: can't cd to web` → Root directory is wrong, change it to `web`
- `Module not found` → Run `npm install` locally first, then push again
- Build succeeds but 404 error → Build output directory is wrong, must be `.cloudflare/dist`

**Expected warnings (these are OK):**
- "Next.js 16 is not fully supported yet!" - OpenNext warning, app will still work
- "The 'middleware' file convention is deprecated" - Next.js warning, doesn't affect functionality
- "OpenNext is not fully compatible with Windows" - Only for local builds, Cloudflare uses Linux

### Site Shows 500 Error or "async_hooks" Error

**This means compatibility flags are missing:**
1. Go to **Settings** → **Functions**
2. Add compatibility flags: `nodejs_compat` and `nodejs_als`
3. Redeploy

### Shows "0 of 0 articles" or Articles Not Loading

**This means environment variables are missing:**
1. Go to **Settings** → **Environment variables**
2. Verify all 7 variables are present (especially `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. If variables were added after deployment, trigger a new deployment

### Clerk Authentication Not Working

**Check:**
1. `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are added
2. Add your Cloudflare Pages domain to Clerk dashboard:
   - Go to https://dashboard.clerk.com
   - Select your application
   - Go to **Settings** → **Domains**
   - Add `*.pages.dev` or your specific domain

### "TypeError: C.get is not a function"

This is a Supabase connection error. Check:
1. All Supabase environment variables are correctly added
2. Variable names match exactly (including `NEXT_PUBLIC_` prefix)
3. No extra spaces in variable values

## What This Setup Uses

✅ **Next.js 16.0.10** - Secure version (fixes CVE-2025-66478)
✅ **@opennextjs/cloudflare v1.14.6** - Adapter for Cloudflare Pages
✅ **Cloudflare Pages Advanced Mode** - Using `_worker.js` pattern
✅ **Node.js compatibility flags** (`nodejs_compat`, `nodejs_als`) - For Clerk authentication
✅ **Custom build script** - Structures output correctly for Pages
❌ **No wrangler** - Not needed for Pages deployment
❌ **No @cloudflare/next-on-pages** - Doesn't support Next.js 16 yet

### How It Works:
1. `npm run build:cloudflare` runs the build process
2. Next.js builds your app with Turbopack
3. `@opennextjs/cloudflare` converts the build to Cloudflare Workers format
4. Custom script (`scripts/build-cloudflare.js`) structures output for Pages:
   - Creates `.cloudflare/dist` directory
   - Copies `worker.js` as `_worker.js` (Pages Advanced Mode)
   - Copies all static assets
5. Cloudflare Pages deploys the `_worker.js` with full Next.js support
