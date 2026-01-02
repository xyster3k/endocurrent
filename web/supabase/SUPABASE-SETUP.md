# Nexus Med News Supabase Database Setup

This document provides complete instructions for recreating the Supabase database schema for the Nexus Med News project.

## Prerequisites

- A Supabase project (create at https://supabase.com)
- Access to the SQL Editor in Supabase Dashboard

## Environment Variables

Add these to your `.env.local` file and Cloudflare environment:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Resend (Email)
RESEND_API_KEY=re_...

# Ads (Optional)
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-...
ADS_DISABLED=true
```

---

## Database Tables

### 1. Users Table

Stores user accounts synced from Clerk.

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,  -- Clerk user IDs like "user_2abc123..."
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Profiles Table

User profile information including roles.

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT,
  affiliation TEXT,
  country TEXT,
  role TEXT CHECK (role IN ('user','editor','admin')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. User Subscriptions Table

Subscription/billing data from Clerk Stripe integration.

```sql
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  plan TEXT CHECK (plan IN ('FREE','PREMIUM')) DEFAULT 'FREE',
  status TEXT CHECK (status IN ('active','canceled','past_due','incomplete')) DEFAULT 'active',
  billing_provider TEXT DEFAULT 'clerk_stripe',
  external_customer_id TEXT,
  external_subscription_id TEXT,
  current_period_end TIMESTAMPTZ
);
```

### 4. Articles Table

Main content table for all articles.

```sql
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  body_markdown TEXT DEFAULT '',
  status TEXT CHECK (status IN ('draft','draft_ai','published','archived')) DEFAULT 'draft',
  category TEXT,
  reading_time_minutes INT,
  word_count INT,
  author_id TEXT REFERENCES public.users(id),
  published_at TIMESTAMPTZ,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Article Images Table

Cover and inline images for articles.

```sql
CREATE TABLE IF NOT EXISTS public.article_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('cover','inline')) NOT NULL,
  storage_path TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  caption TEXT,
  order_index INT
);
```

### 6. Tags Table

Article tags/categories.

```sql
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);
```

### 7. Article Tags Table (Junction)

Many-to-many relationship between articles and tags.

```sql
CREATE TABLE IF NOT EXISTS public.article_tags (
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);
```

### 8. Article References Table

Citations and references for articles.

```sql
CREATE TABLE IF NOT EXISTS public.article_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  order_index INT,
  label TEXT,
  citation_text TEXT,
  url TEXT
);
```

### 9. Article Likes Table

User likes/dislikes for articles.

```sql
CREATE TABLE IF NOT EXISTS public.article_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id TEXT,
  value INT CHECK (value IN (1,-1)) NOT NULL,
  UNIQUE (article_id, user_id)
);
```

### 10. Article Reports Table

User reports for inappropriate content.

```sql
CREATE TABLE IF NOT EXISTS public.article_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id TEXT,
  reason_code TEXT CHECK (reason_code IN ('spam','incorrect','offensive','other')) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_by TEXT REFERENCES public.users(id)
);
```

### 11. Article Shares Table

Tracks when articles are shared.

```sql
CREATE TABLE IF NOT EXISTS public.article_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id TEXT,
  shared_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 12. Menus Table

Navigation menu containers.

```sql
CREATE TABLE IF NOT EXISTS public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 13. Menu Items Table

Individual menu items with hierarchy support.

```sql
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT,
  category TEXT,
  parent_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON public.menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_parent_id ON public.menu_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_order ON public.menu_items(order_index);
```

### 14. Site Settings Table

Key-value store for site-wide settings (GA, GTM, etc.).

```sql
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row Level Security (RLS) Policies

Enable RLS on all tables:

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
```

### Key RLS Policies

```sql
-- Articles: Public can read published articles
CREATE POLICY "articles_select_published" ON public.articles
  FOR SELECT USING (status = 'published');

-- Articles: Admin/Editor can read all articles
CREATE POLICY "articles_select_admin" ON public.articles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Articles: Admin/Editor can insert/update
CREATE POLICY "articles_insert_admin" ON public.articles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Likes: Anyone can view, authenticated users can add
CREATE POLICY "likes_select" ON public.article_likes
  FOR SELECT USING (true);

CREATE POLICY "likes_insert" ON public.article_likes
  FOR INSERT WITH CHECK (user_id = (auth.jwt()->>'sub')::text);

-- Reports: Only editors can view, anyone can submit
CREATE POLICY "reports_select_editors" ON public.article_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('editor','admin')
    )
  );

CREATE POLICY "reports_insert" ON public.article_reports
  FOR INSERT WITH CHECK (true);

-- Menus: Public read, admin/editor manage
CREATE POLICY "menus_select_public" ON public.menus
  FOR SELECT USING (true);

CREATE POLICY "menu_items_select_public" ON public.menu_items
  FOR SELECT USING (true);

-- Site Settings: Public read (for analytics), admin update
CREATE POLICY "site_settings_select" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "site_settings_upsert_admin" ON public.site_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Article Shares: Anyone can insert
CREATE POLICY "shares_select" ON public.article_shares
  FOR SELECT USING (true);

CREATE POLICY "shares_insert" ON public.article_shares
  FOR INSERT WITH CHECK (true);
```

---

## Storage Buckets

Create these storage buckets in Supabase Dashboard > Storage:

### 1. article-images

- **Purpose**: Store article cover and inline images
- **Public Access**: Yes (for displaying images)
- **Max File Size**: 5MB
- **Allowed MIME Types**: image/*

```sql
-- Storage policies (run in SQL Editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true);

-- Allow public read access
CREATE POLICY "Public can read article images"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

-- Allow authenticated editors to upload
CREATE POLICY "Editors can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'article-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (auth.jwt()->>'sub')::text
    AND profiles.role IN ('admin', 'editor')
  )
);

-- Allow editors to delete
CREATE POLICY "Editors can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'article-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (auth.jwt()->>'sub')::text
    AND profiles.role IN ('admin', 'editor')
  )
);
```

### 2. site-assets

- **Purpose**: Store site logo, favicon, and static assets
- **Public Access**: Yes

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true);

-- Allow public read access
CREATE POLICY "Public can read site assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- Allow admin to upload
CREATE POLICY "Admin can upload site assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'site-assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (auth.jwt()->>'sub')::text
    AND profiles.role = 'admin'
  )
);
```

---

## Complete Setup Script

Run this complete script in Supabase SQL Editor to set up everything:

```sql
-- ============================================
-- COMPLETE NEXUS MED NEWS DATABASE SETUP
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CREATE ALL TABLES
-- ============================================

-- Users
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT,
  affiliation TEXT,
  country TEXT,
  role TEXT CHECK (role IN ('user','editor','admin')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  plan TEXT CHECK (plan IN ('FREE','PREMIUM')) DEFAULT 'FREE',
  status TEXT CHECK (status IN ('active','canceled','past_due','incomplete')) DEFAULT 'active',
  billing_provider TEXT DEFAULT 'clerk_stripe',
  external_customer_id TEXT,
  external_subscription_id TEXT,
  current_period_end TIMESTAMPTZ
);

-- Articles
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  body_markdown TEXT DEFAULT '',
  status TEXT CHECK (status IN ('draft','draft_ai','published','archived')) DEFAULT 'draft',
  category TEXT,
  reading_time_minutes INT,
  word_count INT,
  author_id TEXT REFERENCES public.users(id),
  published_at TIMESTAMPTZ,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article Images
CREATE TABLE IF NOT EXISTS public.article_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('cover','inline')) NOT NULL,
  storage_path TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  caption TEXT,
  order_index INT
);

-- Tags
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

-- Article Tags (Junction)
CREATE TABLE IF NOT EXISTS public.article_tags (
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Article References
CREATE TABLE IF NOT EXISTS public.article_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  order_index INT,
  label TEXT,
  citation_text TEXT,
  url TEXT
);

-- Article Likes
CREATE TABLE IF NOT EXISTS public.article_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id TEXT,
  value INT CHECK (value IN (1,-1)) NOT NULL,
  UNIQUE (article_id, user_id)
);

-- Article Reports
CREATE TABLE IF NOT EXISTS public.article_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id TEXT,
  reason_code TEXT CHECK (reason_code IN ('spam','incorrect','offensive','other')) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_by TEXT REFERENCES public.users(id)
);

-- Article Shares
CREATE TABLE IF NOT EXISTS public.article_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id TEXT,
  shared_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menus
CREATE TABLE IF NOT EXISTS public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT,
  category TEXT,
  parent_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON public.menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_parent_id ON public.menu_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_order ON public.menu_items(order_index);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Users
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = (auth.jwt()->>'sub')::text);

-- Profiles
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = (auth.jwt()->>'sub')::text);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = (auth.jwt()->>'sub')::text);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (id = (auth.jwt()->>'sub')::text)
  WITH CHECK (id = (auth.jwt()->>'sub')::text);

-- Subscriptions
CREATE POLICY "subscriptions_select_own" ON public.user_subscriptions
  FOR SELECT USING (user_id = (auth.jwt()->>'sub')::text);

CREATE POLICY "subscriptions_insert_own" ON public.user_subscriptions
  FOR INSERT WITH CHECK (user_id = (auth.jwt()->>'sub')::text);

CREATE POLICY "subscriptions_update_own" ON public.user_subscriptions
  FOR UPDATE
  USING (user_id = (auth.jwt()->>'sub')::text)
  WITH CHECK (user_id = (auth.jwt()->>'sub')::text);

-- Articles
CREATE POLICY "articles_select_published" ON public.articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "articles_select_admin" ON public.articles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "articles_insert_admin" ON public.articles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "articles_update_admin" ON public.articles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "articles_delete_admin" ON public.articles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role = 'admin'
    )
  );

-- Article Images
CREATE POLICY "article_images_select" ON public.article_images
  FOR SELECT USING (true);

CREATE POLICY "article_images_insert_admin" ON public.article_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "article_images_update_admin" ON public.article_images
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "article_images_delete_admin" ON public.article_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Tags
CREATE POLICY "tags_select" ON public.tags FOR SELECT USING (true);

CREATE POLICY "tags_insert_admin" ON public.tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "tags_update_admin" ON public.tags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "tags_delete_admin" ON public.tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role = 'admin'
    )
  );

-- Article Tags
CREATE POLICY "article_tags_select" ON public.article_tags FOR SELECT USING (true);

CREATE POLICY "article_tags_insert_admin" ON public.article_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "article_tags_delete_admin" ON public.article_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Article References
CREATE POLICY "article_references_select" ON public.article_references FOR SELECT USING (true);

CREATE POLICY "article_references_insert_admin" ON public.article_references
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "article_references_update_admin" ON public.article_references
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "article_references_delete_admin" ON public.article_references
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Article Likes
CREATE POLICY "likes_select" ON public.article_likes FOR SELECT USING (true);

CREATE POLICY "likes_insert" ON public.article_likes
  FOR INSERT WITH CHECK (user_id = (auth.jwt()->>'sub')::text);

CREATE POLICY "likes_update_own" ON public.article_likes
  FOR UPDATE USING (user_id = (auth.jwt()->>'sub')::text);

CREATE POLICY "likes_delete_own" ON public.article_likes
  FOR DELETE USING (user_id = (auth.jwt()->>'sub')::text);

-- Article Reports
CREATE POLICY "reports_select_editors" ON public.article_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('editor','admin')
    )
  );

CREATE POLICY "reports_insert" ON public.article_reports
  FOR INSERT WITH CHECK (true);

-- Article Shares
CREATE POLICY "shares_select" ON public.article_shares FOR SELECT USING (true);

CREATE POLICY "shares_insert" ON public.article_shares
  FOR INSERT WITH CHECK (true);

-- Menus
CREATE POLICY "menus_select_public" ON public.menus FOR SELECT USING (true);

CREATE POLICY "menus_insert_admin" ON public.menus
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "menus_update_admin" ON public.menus
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "menus_delete_admin" ON public.menus
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role = 'admin'
    )
  );

-- Menu Items
CREATE POLICY "menu_items_select_public" ON public.menu_items FOR SELECT USING (true);

CREATE POLICY "menu_items_insert_admin" ON public.menu_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "menu_items_update_admin" ON public.menu_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "menu_items_delete_admin" ON public.menu_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Site Settings
CREATE POLICY "site_settings_select" ON public.site_settings FOR SELECT USING (true);

CREATE POLICY "site_settings_insert_admin" ON public.site_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "site_settings_update_admin" ON public.site_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_menus_updated_at
  BEFORE UPDATE ON public.menus
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- SETUP COMPLETE
-- ============================================
```

---

## Setting Up Admin User

After running the database setup, create your admin user:

```sql
-- Replace with your actual Clerk user ID and email
INSERT INTO public.users (id, email)
VALUES ('user_2abc123...', 'your-email@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, display_name, role)
VALUES ('user_2abc123...', 'Admin User', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

---

## Default Site Settings

Initialize common settings:

```sql
-- Analytics settings
INSERT INTO public.site_settings (key, value) VALUES
  ('ga_measurement_id', ''),
  ('gtm_container_id', '')
ON CONFLICT (key) DO NOTHING;

-- Static page content (About, Privacy, Terms)
INSERT INTO public.site_settings (key, value) VALUES
  ('page_about_title', 'About Us'),
  ('page_about_content', 'Welcome to our site. Edit this content in the admin panel.'),
  ('page_privacy_title', 'Privacy & Cookies'),
  ('page_privacy_content', 'Your privacy policy content here.'),
  ('page_terms_title', 'Terms of Use'),
  ('page_terms_content', 'Your terms of service content here.')
ON CONFLICT (key) DO NOTHING;
```

**Site Settings Keys:**
| Key | Purpose |
|-----|---------|
| `ga_measurement_id` | Google Analytics 4 Measurement ID (G-XXXXXXX) |
| `gtm_container_id` | Google Tag Manager Container ID (GTM-XXXXXXX) |
| `page_about_title` | About page title |
| `page_about_content` | About page content (Markdown) |
| `page_privacy_title` | Privacy page title |
| `page_privacy_content` | Privacy page content (Markdown) |
| `page_terms_title` | Terms page title |
| `page_terms_content` | Terms page content (Markdown) |

---

## Storage Buckets Setup

Create buckets in Supabase Dashboard > Storage > New Bucket:

1. **article-images**
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: image/*

2. **site-assets**
   - Public: Yes
   - File size limit: 2MB
   - Allowed MIME types: image/*

---

## Table Summary

| Table | Purpose | Public Read | Who Can Modify |
|-------|---------|-------------|----------------|
| users | User accounts | Own only | System |
| profiles | User profiles | Own only | Own user |
| user_subscriptions | Billing data | Own only | Own user |
| articles | Content | Published only | Editor/Admin |
| article_images | Images | Yes | Editor/Admin |
| tags | Categories | Yes | Editor/Admin |
| article_tags | Tag mapping | Yes | Editor/Admin |
| article_references | Citations | Yes | Editor/Admin |
| article_likes | Likes/Dislikes | Yes | Own user |
| article_reports | User reports | Editor/Admin | Anyone |
| article_shares | Share tracking | Yes | Anyone |
| menus | Navigation | Yes | Editor/Admin |
| menu_items | Menu links | Yes | Editor/Admin |
| site_settings | Config | Yes | Editor/Admin |

---

## Changelog

Keep this section updated when database schema changes are made.

### 2024-12-20 - Dynamic Static Pages
- Added site_settings keys for static page content:
  - `page_about_title`, `page_about_content`
  - `page_privacy_title`, `page_privacy_content`
  - `page_terms_title`, `page_terms_content`
- About, Privacy, and Terms pages now load from database
- Added admin UI for editing static page content

### 2024-12-20 - Initial Documentation
- Documented all 14 tables:
  - users, profiles, user_subscriptions
  - articles, article_images, article_references
  - tags, article_tags
  - article_likes, article_reports, article_shares
  - menus, menu_items
  - site_settings
- Documented 2 storage buckets:
  - article-images
  - site-assets
- Added complete RLS policies
- Added indexes for performance
- Added triggers for updated_at columns

---

## Notes for Future Updates

When adding new tables or modifying existing ones:

1. **Add the table definition** in the "Database Tables" section
2. **Add RLS policies** in the "Row Level Security" section
3. **Update the complete setup script** to include the new table
4. **Update the Table Summary** at the bottom
5. **Add a changelog entry** with the date and changes made

### SQL Template for New Tables

```sql
-- 1. Create table
CREATE TABLE IF NOT EXISTS public.new_table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- columns here
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.new_table_name ENABLE ROW LEVEL SECURITY;

-- 3. Add policies
CREATE POLICY "new_table_select" ON public.new_table_name
  FOR SELECT USING (true);  -- or appropriate condition

-- 4. Add to changelog in this document
```
