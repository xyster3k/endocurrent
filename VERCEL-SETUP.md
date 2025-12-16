# Vercel Deployment Guide

## Why Vercel?

Vercel is made by the creators of Next.js. It requires **zero configuration** and all Next.js features (Edge runtime, Clerk auth, middleware) work out of the box.

## Step 1: Sign Up for Vercel

1. Go to https://vercel.com/signup
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub account

## Step 2: Import Your Project

1. Once logged in, click **"Add New..."** → **"Project"**
2. Find and click **"Import"** next to `xyster3k/endocurrent`
3. If you don't see it, click **"Adjust GitHub App Permissions"** and give Vercel access to the repo

## Step 3: Configure Project

Vercel will auto-detect Next.js. Configure these settings:

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `web` (click "Edit" and select `web`)

**Build Settings:** (Auto-detected, but verify)
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

**Environment Variables:** Click **"Add"** for each:

### Production Environment Variables:

**Public Variables:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_cXVhbGl0eS1zbHVnLTIzLmNsZXJrLmFjY291bnRzLmRldiQ
NEXT_PUBLIC_SUPABASE_URL = https://nrirqijyayrwhckmjltn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_HA_FSzUR5bprPwmTgbXTaA_W5xumBWD
NEXT_PUBLIC_ADSENSE_CLIENT = pub-4712145302121710
```

**Secret Variables:**
```
CLERK_SECRET_KEY = sk_test_FURqEu3pOkqP3Ut5BKr8zIMSFu68PnYtIR3rEQtrXd
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yaXJxaWp5YXlyd2hja21qbHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDM1OTQsImV4cCI6MjA4MTIxOTU5NH0.qZMatidbHAbDcIPEX8EC86WtmZLdlQyBrCAEpXUjcrY
```

**Note:** `NEXT_PUBLIC_SITE_URL` will be auto-set by Vercel after deployment

## Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. You'll get a URL like `https://endocurrent.vercel.app`

## Step 5: Update Environment Variables (After First Deploy)

1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Add `NEXT_PUBLIC_SITE_URL` with your Vercel URL:
   ```
   NEXT_PUBLIC_SITE_URL = https://endocurrent.vercel.app
   ```
4. Click **Redeploy** to apply the change

## Step 6: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain (e.g., `endocurrent.com`)
3. Update DNS records as instructed by Vercel
4. Update `NEXT_PUBLIC_SITE_URL` to your custom domain

## Automatic Deployments

Every time you push to GitHub:
- **Production:** Pushes to `main` branch → deploys to production
- **Preview:** Pushes to other branches → creates preview URLs

## Troubleshooting

### Build fails

- Check that **Root Directory** is set to `web`
- Verify all environment variables are added
- Check build logs for specific errors

### Clerk auth not working

- Make sure `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are set
- Add your Vercel domain to Clerk dashboard allowed origins

### Supabase not connecting

- Verify `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` are correct
- Check Supabase dashboard for any IP restrictions

## Advantages Over Cloudflare Pages

✅ Zero configuration - just works
✅ No adapters or compatibility flags needed
✅ Automatic HTTPS and SSL certificates
✅ Built-in analytics and monitoring
✅ Edge network (similar to Cloudflare)
✅ Automatic image optimization
✅ Preview deployments for every PR

## Free Tier Limits

- Unlimited personal projects
- 100GB bandwidth/month
- 100 hours serverless function execution
- 1000 image optimizations/month

This is more than enough for most projects!
