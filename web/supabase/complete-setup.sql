-- ============================================
-- Complete Database Setup for Clerk Integration
-- Run this ONCE in a fresh database
-- ============================================

-- Enable UUID extension (for article IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & PROFILES (Using TEXT for Clerk IDs)
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,  -- Clerk user IDs like "user_2abc123..."
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT,
  affiliation TEXT,
  country TEXT,
  role TEXT CHECK (role IN ('user','editor','admin')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  plan TEXT CHECK (plan IN ('FREE','PREMIUM')) DEFAULT 'FREE',
  status TEXT CHECK (status IN ('active','canceled','past_due','incomplete')) DEFAULT 'active',
  billing_provider TEXT DEFAULT 'clerk_stripe',
  external_customer_id TEXT,
  external_subscription_id TEXT,
  current_period_end TIMESTAMPTZ
);

-- ============================================
-- ARTICLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE TABLE IF NOT EXISTS public.article_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('cover','inline')) NOT NULL,
  storage_path TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  caption TEXT,
  order_index INT
);

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.article_tags (
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.article_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  order_index INT,
  label TEXT,
  citation_text TEXT,
  url TEXT
);

CREATE TABLE IF NOT EXISTS public.article_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id TEXT,
  value INT CHECK (value IN (1,-1)) NOT NULL,
  UNIQUE (article_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.article_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id TEXT,
  reason_code TEXT CHECK (reason_code IN ('spam','incorrect','offensive','other')) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_by TEXT REFERENCES public.users(id)
);

-- ============================================
-- ENABLE RLS ON ALL TABLES
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

-- ============================================
-- RLS POLICIES - USERS & PROFILES
-- ============================================

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = (auth.jwt()->>'sub')::text);

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = (auth.jwt()->>'sub')::text);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = (auth.jwt()->>'sub')::text);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (id = (auth.jwt()->>'sub')::text)
  WITH CHECK (id = (auth.jwt()->>'sub')::text);

-- ============================================
-- RLS POLICIES - SUBSCRIPTIONS
-- ============================================

CREATE POLICY "subscriptions_select_own" ON public.user_subscriptions
  FOR SELECT USING (user_id = (auth.jwt()->>'sub')::text);

CREATE POLICY "subscriptions_insert_own" ON public.user_subscriptions
  FOR INSERT WITH CHECK (user_id = (auth.jwt()->>'sub')::text);

CREATE POLICY "subscriptions_update_own" ON public.user_subscriptions
  FOR UPDATE
  USING (user_id = (auth.jwt()->>'sub')::text)
  WITH CHECK (user_id = (auth.jwt()->>'sub')::text);

-- ============================================
-- RLS POLICIES - ARTICLES
-- ============================================

-- Public can read published articles
CREATE POLICY "articles_select_published" ON public.articles
  FOR SELECT USING (status = 'published');

-- Admin/Editor can read all articles
CREATE POLICY "articles_select_admin" ON public.articles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Admin/Editor can insert articles
CREATE POLICY "articles_insert_admin" ON public.articles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Admin/Editor can update articles
CREATE POLICY "articles_update_admin" ON public.articles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Admin can delete articles
CREATE POLICY "articles_delete_admin" ON public.articles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (auth.jwt()->>'sub')::text
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- RLS POLICIES - ARTICLE IMAGES
-- ============================================

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

-- ============================================
-- RLS POLICIES - TAGS
-- ============================================

CREATE POLICY "tags_select" ON public.tags
  FOR SELECT USING (true);

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

-- ============================================
-- RLS POLICIES - ARTICLE TAGS
-- ============================================

CREATE POLICY "article_tags_select" ON public.article_tags
  FOR SELECT USING (true);

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

-- ============================================
-- RLS POLICIES - ARTICLE REFERENCES
-- ============================================

CREATE POLICY "article_references_select" ON public.article_references
  FOR SELECT USING (true);

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

-- ============================================
-- RLS POLICIES - ARTICLE LIKES
-- ============================================

CREATE POLICY "likes_select" ON public.article_likes
  FOR SELECT USING (true);

CREATE POLICY "likes_insert" ON public.article_likes
  FOR INSERT WITH CHECK (user_id = (auth.jwt()->>'sub')::text);

CREATE POLICY "likes_update_own" ON public.article_likes
  FOR UPDATE USING (user_id = (auth.jwt()->>'sub')::text);

-- ============================================
-- RLS POLICIES - ARTICLE REPORTS
-- ============================================

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

-- ============================================
-- DONE!
-- ============================================
-- Now run setup-admin-user.sql to create your admin user
