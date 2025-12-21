# Cloudflare Pages Deployment Guide

Complete instructions for deploying this Next.js 15 content platform to Cloudflare Pages with Supabase and Clerk.

## Prerequisites

### Required Accounts
- [Cloudflare](https://dash.cloudflare.com/sign-up) - Free tier works
- [Supabase](https://supabase.com) - Free tier works
- [Clerk](https://clerk.com) - Free tier works

### Required Tools
```bash
# Node.js 18+ (recommend using nvm)
node --version  # Should be 18.x or higher

# Install Wrangler CLI globally
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

---

## Step 1: Supabase Setup

### 1.1 Create Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization, name, password, region
4. Wait for project to be ready (~2 minutes)

### 1.2 Get Connection Details
From Project Settings > API:
- Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 1.3 Create Database Tables
Go to SQL Editor and run:

```sql
-- Articles table
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  body_markdown TEXT DEFAULT '',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'draft_ai', 'published', 'archived')),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  reading_time_minutes INT DEFAULT 0,
  word_count INT DEFAULT 0,
  author_id TEXT,
  featured BOOLEAN DEFAULT FALSE,
  cover_image_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article likes
CREATE TABLE article_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  value INT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- Article reports
CREATE TABLE article_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id TEXT,
  reason_code TEXT NOT NULL CHECK (reason_code IN ('spam', 'incorrect', 'offensive', 'other')),
  comment TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article shares tracking
CREATE TABLE article_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  affiliation TEXT,
  country TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'editor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions (for premium features)
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  plan TEXT DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PREMIUM')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
  billing_provider TEXT DEFAULT 'clerk_stripe',
  external_customer_id TEXT,
  external_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site settings (key-value store)
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Navigation menus
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID REFERENCES menus(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT,
  category TEXT,
  parent_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create default header menu
INSERT INTO menus (name) VALUES ('header');

-- Create indexes for performance
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_article_likes_article_id ON article_likes(article_id);
CREATE INDEX idx_article_reports_resolved ON article_reports(resolved);
CREATE INDEX idx_menu_items_menu_id ON menu_items(menu_id);
```

### 1.4 Storage Setup (for images)
1. Go to Storage in Supabase dashboard
2. Create a bucket called `article-images` (public)
3. Create a bucket called `site-assets` (public)

---

## Step 2: Clerk Setup

### 2.1 Create Application
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click "Add application"
3. Name it and select sign-in methods (Email, Google, etc.)

### 2.2 Get API Keys
From API Keys section:
- Copy `Publishable key` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Copy `Secret key` → `CLERK_SECRET_KEY`

### 2.3 Configure URLs
In Clerk Dashboard > Paths:
- Sign-in URL: `/sign-in`
- Sign-up URL: `/sign-up`
- After sign-in URL: `/`
- After sign-up URL: `/`

### 2.4 Set Up Admin User
After creating your account:
1. Go to Users in Clerk Dashboard
2. Click on your user
3. Scroll to "Public metadata"
4. Add: `{ "role": "admin" }`
5. Save

---

## Step 3: Local Development Setup

### 3.1 Clone and Install
```bash
git clone <your-repo-url>
cd <project-folder>/web
npm install
```

### 3.2 Create Environment File
Create `.env.local` in the `web` folder:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Site URL (use localhost for dev)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Ads (set to true to disable)
ADS_DISABLED=true
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxx

# Optional: Email
RESEND_API_KEY=re_xxxxx
```

### 3.3 Test Locally
```bash
npm run dev
```
Visit http://localhost:3000

---

## Step 4: Cloudflare Pages Deployment

### 4.1 Create Cloudflare Pages Project

**Option A: Via Dashboard (Recommended for first time)**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > Workers & Pages
2. Click "Create" > "Pages" > "Connect to Git"
3. Select your repository
4. Configure build settings:
   - **Framework preset**: None
   - **Build command**: `npm run build:cloudflare`
   - **Build output directory**: `.open-next/assets`
   - **Root directory**: `web` (if your code is in a subfolder)

**Option B: Via Wrangler CLI**
```bash
cd web
npm run build:cloudflare
npx wrangler pages project create your-project-name
npx wrangler pages deploy .open-next/assets --project-name=your-project-name
```

### 4.2 Set Environment Variables
In Cloudflare Dashboard > Your Project > Settings > Environment Variables:

Add ALL of these (for both Production and Preview):

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (encrypt) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your Clerk publishable key |
| `CLERK_SECRET_KEY` | Your Clerk secret key (encrypt) |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` |
| `NODE_VERSION` | `18` |

**Important**: Click "Encrypt" for sensitive values (service role key, clerk secret).

### 4.3 Configure Compatibility
In Cloudflare Dashboard > Your Project > Settings > Functions:
- **Compatibility date**: `2024-09-23` (or latest)
- **Compatibility flags**: Add `nodejs_compat`

### 4.4 Trigger Deployment
Either:
- Push to your connected Git branch, OR
- Run manually:
```bash
cd web
npm run build:cloudflare
npx wrangler pages deploy .open-next/assets --project-name=your-project-name
```

---

## Step 5: Custom Domain Setup

### 5.1 Add Domain in Cloudflare
1. Go to your Pages project > Custom domains
2. Click "Set up a custom domain"
3. Enter your domain (e.g., `example.com` or `www.example.com`)

### 5.2 DNS Configuration
If domain is on Cloudflare:
- Automatically configured

If domain is elsewhere:
- Add CNAME record: `your-domain.com` → `your-project.pages.dev`

### 5.3 Update Environment Variables
After domain is active, update:
- `NEXT_PUBLIC_SITE_URL` → `https://your-domain.com`

### 5.4 Update Clerk
In Clerk Dashboard > Domains:
1. Add your production domain
2. This enables cookies to work properly

---

## Step 6: Post-Deployment Checklist

### 6.1 Verify Everything Works
- [ ] Homepage loads
- [ ] Sign in/Sign up works
- [ ] Admin panel accessible (after signing in as admin)
- [ ] Can create/edit articles
- [ ] Images upload to Supabase
- [ ] Cookie consent banner appears

### 6.2 Set Up First Admin
1. Sign up on your live site
2. In Clerk Dashboard, find your user
3. Set public metadata: `{ "role": "admin" }`
4. Refresh your site - admin panel should be visible

### 6.3 Create Initial Content
1. Go to `/admin`
2. Set up navigation menu
3. Create About, Privacy, Terms pages
4. Publish your first article

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next .open-next node_modules/.cache
npm run build:cloudflare
```

### "Edge runtime" Errors
Check that `wrangler.toml` has:
```toml
compatibility_flags = ["nodejs_compat"]
compatibility_date = "2024-09-23"
```

### Clerk Auth Not Working
1. Verify domain is added in Clerk Dashboard
2. Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set (not encrypted)
3. Ensure cookies are enabled in browser

### Supabase Connection Errors
1. Check all three Supabase env vars are set
2. Verify service role key is correct
3. Check Supabase project is not paused (free tier pauses after inactivity)

### 500 Errors on API Routes
1. Check Cloudflare Pages > Functions logs
2. Verify all env vars are set
3. Ensure `nodejs_compat` flag is enabled

### Images Not Loading
1. Check Supabase Storage bucket is public
2. Verify bucket policy allows public access:
```sql
-- Run in Supabase SQL Editor
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'article-images');
```

---

## Maintenance

### Updating the Site
```bash
git pull
cd web
npm install
npm run build:cloudflare
npx wrangler pages deploy .open-next/assets --project-name=your-project-name
```

### Monitoring
- **Cloudflare Analytics**: Pages dashboard shows traffic
- **Function Logs**: Workers & Pages > Your project > Functions > Logs
- **Supabase Logs**: Database > Logs

### Backups
- **Database**: Supabase automatically backs up (Pro plan) or export manually
- **Code**: Git repository

---

## Environment Variables Reference

| Variable | Required | Public | Description |
|----------|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | No | Supabase service role (encrypt!) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | No | Clerk secret key (encrypt!) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Yes | Your production URL |
| `NODE_VERSION` | Yes | Yes | Set to `18` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Yes | Google Analytics ID |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | No | Yes | AdSense publisher ID |
| `ADS_DISABLED` | No | Yes | Set `true` to disable ads |
| `RESEND_API_KEY` | No | No | Resend email API key |

---

## Quick Deploy Commands

```bash
# Full deploy from scratch
cd web
npm install
npm run build:cloudflare
npx wrangler pages deploy .open-next/assets --project-name=YOUR_PROJECT

# Quick redeploy after changes
npm run build:cloudflare && npx wrangler pages deploy .open-next/assets --project-name=YOUR_PROJECT
```

---

## Support

- **Next.js Issues**: https://github.com/vercel/next.js/issues
- **OpenNext Issues**: https://github.com/opennextjs/opennextjs-cloudflare/issues
- **Cloudflare Docs**: https://developers.cloudflare.com/pages
- **Supabase Docs**: https://supabase.com/docs
- **Clerk Docs**: https://clerk.com/docs
