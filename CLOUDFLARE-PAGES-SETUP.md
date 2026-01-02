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
2. Click **Workers & Pages** → Select your **nexusmednews** project
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

⚠️ **ALL environment variables must be added in the Cloudflare Pages dashboard.**

**IMPORTANT:** Add these to **BOTH Production AND Preview** environments!

1. Go to **Settings** → **Environment variables**
2. For EACH variable below:
   - Click **Add variable**
   - Add to **Production** environment
   - Click **Add variable** again
   - Add the SAME variable to **Preview** environment

### ✅ Variables to Add (All 7):

**Variable 1:**
```
Name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_test_cXVhbGl0eS1zbHVnLTIzLmNsZXJrLmFjY291bnRzLmRldiQ
Environment: Production AND Preview
```

**Variable 2:**
```
Name: CLERK_SECRET_KEY
Value: sk_test_FURqEu3pOkqP3Ut5BKr8zIMSFu68PnYtIR3rEQtrXd
Environment: Production AND Preview
```
✅ Check **"Encrypt"** box

**Variable 3:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://nrirqijyayrwhckmjltn.supabase.co
Environment: Production AND Preview
```

**Variable 4:**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yaXJxaWp5YXlyd2hja21qbHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDM1OTQsImV4cCI6MjA4MTIxOTU5NH0.qZMatidbHAbDcIPEX8EC86WtmZLdlQyBrCAEpXUjcrY
Environment: Production AND Preview
```

**Variable 5:**
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yaXJxaWp5YXlyd2hja21qbHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDM1OTQsImV4cCI6MjA4MTIxOTU5NH0.qZMatidbHAbDcIPEX8EC86WtmZLdlQyBrCAEpXUjcrY
Environment: Production AND Preview
```
✅ Check **"Encrypt"** box

**Variable 6:**
```
Name: NEXT_PUBLIC_ADSENSE_CLIENT
Value: pub-4712145302121710
Environment: Production AND Preview
```

**Variable 7:**
```
Name: NEXT_PUBLIC_SITE_URL
Value: https://nexusmednews.pages.dev
Environment: Production AND Preview
```

### ✅ Verify All Variables Added

After adding, you should see **7 variables for Production** and **7 variables for Preview**:
1. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
2. CLERK_SECRET_KEY (encrypted)
3. NEXT_PUBLIC_SUPABASE_URL
4. NEXT_PUBLIC_SUPABASE_ANON_KEY
5. SUPABASE_SERVICE_ROLE_KEY (encrypted)
6. NEXT_PUBLIC_ADSENSE_CLIENT
7. NEXT_PUBLIC_SITE_URL

## Step 3: Configure Compatibility Settings - REQUIRED!

⚠️ **CRITICAL:** You MUST configure compatibility settings for Node.js modules to work.

This MUST be done in the dashboard (not in a file):

1. Go to **Settings** → **Functions**
2. Scroll down to **Compatibility Date**
3. Set compatibility date to: `2024-09-23` (or any date after 2024-09-23)
4. Scroll to **Compatibility flags**
5. Click **Configure Production compatibility flag** and add:
   - `nodejs_compat`
   - `nodejs_als`
6. Click **Save**

These settings enable Cloudflare to resolve Node.js built-in modules like `async_hooks`, `fs`, `crypto`, etc.

⚠️ **Do NOT create a wrangler.toml file** - it will block you from adding public environment variables in the dashboard!

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

## Step 4: Verify Deployment

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
- `Could not resolve "async_hooks"` or other Node.js modules → Compatibility settings not configured in dashboard (see Step 3)

**Expected warnings (these are OK):**
- "Next.js 16 is not fully supported yet!" - OpenNext warning, app will still work
- "The 'middleware' file convention is deprecated" - Next.js warning, doesn't affect functionality
- "OpenNext is not fully compatible with Windows" - Only for local builds, Cloudflare uses Linux

### Build Errors: "Could not resolve" Node.js Modules

If you see errors like `Could not resolve "async_hooks"`, `Could not resolve "fs"`, etc:

**Cause:** Compatibility settings not configured in Cloudflare dashboard

**Fix:**
1. Go to **Settings** → **Functions** in Cloudflare Pages dashboard
2. Set **Compatibility Date** to `2024-09-23` or later
3. Add **Compatibility flags**: `nodejs_compat` and `nodejs_als`
4. Click **Save**
5. Redeploy

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
✅ **Dashboard-only configuration** - All settings managed in Cloudflare Pages dashboard
✅ **Node.js compatibility flags** (`nodejs_compat`, `nodejs_als`) - Configured in Settings → Functions
✅ **Custom build script** - Structures output correctly for Pages
❌ **No wrangler.toml** - Would block non-encrypted variables from dashboard
❌ **No wrangler CLI for deployment** - Cloudflare Pages handles deployment automatically
❌ **No @cloudflare/next-on-pages** - Doesn't support Next.js 16 yet

### Important: No wrangler.toml File

**This project does NOT use wrangler.toml** because:
- wrangler.toml blocks non-encrypted variables from being added in the dashboard
- All configuration is done through the Cloudflare Pages dashboard
- Compatibility settings are configured in Settings → Functions (not in a file)

### How It Works:
1. `npm run build:cloudflare` runs the build process
2. Next.js builds your app with Turbopack
3. `@opennextjs/cloudflare` converts the build to Cloudflare Workers format
4. Custom script (`scripts/build-cloudflare.js`) structures output for Pages:
   - Creates `.cloudflare/dist` directory
   - Copies `worker.js` as `_worker.js` (Pages Advanced Mode)
   - Copies all static assets
5. Cloudflare Pages deploys the `_worker.js` with full Next.js support
