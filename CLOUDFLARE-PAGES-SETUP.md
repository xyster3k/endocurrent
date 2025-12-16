# Cloudflare Pages Deployment Setup

## Step 1: Update Cloudflare Pages Build Settings

1. Go to https://dash.cloudflare.com
2. Click **Workers & Pages** → Select your **endocurrent** project
3. Go to **Settings** → **Builds & deployments**
4. Set the following:

**Framework preset:** `Next.js`

**Build command:**
```
cd web && npm install && npm run build
```

**Build output directory:**
```
web/.next/standalone
```

**Root directory:**
```
/
```

**Node.js version:** `22` (or leave as Auto)

## Step 2: Add Environment Variables (Including PUBLIC ones!)

Go to **Settings** → **Environment variables**

### How to Add PUBLIC Variables (NEXT_PUBLIC_*)

Cloudflare Pages lets you add ALL variables the same way. There's **no separate section for public vs secret**:

1. Click **Add variable**
2. Enter the **Variable name** (e.g., `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
3. Enter the **Value**
4. **IMPORTANT**: For public variables (`NEXT_PUBLIC_*`), you can leave "Encrypt" UNCHECKED
5. For secret variables (API keys, secrets), CHECK the "Encrypt" box
6. Click **Save**

### Production Environment Variables to Add:

**Public Variables** (uncheck "Encrypt"):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_cXVhbGl0eS1zbHVnLTIzLmNsZXJrLmFjY291bnRzLmRldiQ
NEXT_PUBLIC_SUPABASE_URL = https://nrirqijyayrwhckmjltn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_HA_FSzUR5bprPwmTgbXTaA_W5xumBWD
NEXT_PUBLIC_ADSENSE_CLIENT = pub-4712145302121710
NEXT_PUBLIC_SITE_URL = https://endocurrent.pages.dev
```

**Secret Variables** (check "Encrypt"):
```
CLERK_SECRET_KEY = sk_test_FURqEu3pOkqP3Ut5BKr8zIMSFu68PnYtIR3rEQtrXd
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yaXJxaWp5YXlyd2hja21qbHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDM1OTQsImV4cCI6MjA4MTIxOTU5NH0.qZMatidbHAbDcIPEX8EC86WtmZLdlQyBrCAEpXUjcrY
```

### Preview Environment (Optional)

Repeat the same variables for **Preview** environment if you want preview deployments to work.

## Step 3: Install Dependencies Locally

```bash
cd web
npm install
```

This will install the new OpenNext adapter and remove the old wrangler stuff.

## Step 4: Test Build Locally (Optional)

```bash
npm run build
```

This should build successfully now.

## Step 5: Deploy

Option 1: **Trigger deployment from dashboard**
- Go to **Deployments** tab
- Click **Create deployment**

Option 2: **Push code to trigger auto-deploy**
```bash
git add -A
git commit -m "Switch to OpenNext for Cloudflare Pages"
git push
```

## Troubleshooting

### "I can't add public variables!"

In Cloudflare Pages, there's no distinction in the UI between public and secret variables. They're all added the same way:
- The **"Encrypt"** checkbox is optional and just hides the value in the UI
- For `NEXT_PUBLIC_*` variables, you can leave "Encrypt" unchecked (they'll be public in the browser anyway)
- For secret keys, check "Encrypt" to hide them in the UI

### Build fails

- Make sure **Build command** is: `cd web && npm install && npm run build`
- Make sure **Build output directory** is: `web/.next`
- Check that all environment variables are added

### Site shows 500 error

- Check that ALL environment variables are added (especially Clerk keys)
- Make sure `NEXT_PUBLIC_SITE_URL` matches your actual Cloudflare Pages URL

## What Changed

- ❌ **Removed**: wrangler, @cloudflare/next-on-pages (deprecated), all special adapters
- ✅ **Using**: Native Next.js 15 + Cloudflare Pages integration
- ✅ **Cleaner**: Standard Next.js build, no build adapters needed
