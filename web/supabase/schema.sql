-- Core tables
create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key,
  email text,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references public.users (id) on delete cascade,
  display_name text,
  affiliation text,
  country text,
  role text check (role in ('user','editor','admin')) default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users (id) on delete cascade,
  plan text check (plan in ('FREE','PREMIUM')) default 'FREE',
  status text check (status in ('active','canceled','past_due','incomplete')) default 'active',
  billing_provider text default 'clerk_stripe',
  external_customer_id text,
  external_subscription_id text,
  current_period_end timestamptz
);

create table if not exists public.articles (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  summary text,
  body_markdown text default '',
  status text check (status in ('draft','draft_ai','published','archived')) default 'draft',
  category text,
  reading_time_minutes int,
  word_count int,
  author_id uuid references public.users (id),
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.article_images (
  id uuid primary key default uuid_generate_v4(),
  article_id uuid references public.articles (id) on delete cascade,
  type text check (type in ('cover','inline')) not null,
  storage_path text not null,
  alt_text text not null,
  caption text,
  order_index int
);

create table if not exists public.tags (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null
);

create table if not exists public.article_tags (
  article_id uuid references public.articles (id) on delete cascade,
  tag_id uuid references public.tags (id) on delete cascade,
  primary key (article_id, tag_id)
);

create table if not exists public.article_references (
  id uuid primary key default uuid_generate_v4(),
  article_id uuid references public.articles (id) on delete cascade,
  order_index int,
  label text,
  citation_text text,
  url text
);

create table if not exists public.article_likes (
  id uuid primary key default uuid_generate_v4(),
  article_id uuid references public.articles (id) on delete cascade,
  user_id uuid,
  value int check (value in (1,-1)) not null,
  unique (article_id, user_id)
);

create table if not exists public.article_reports (
  id uuid primary key default uuid_generate_v4(),
  article_id uuid references public.articles (id) on delete cascade,
  user_id uuid,
  reason_code text check (reason_code in ('spam','incorrect','offensive','other')) not null,
  comment text,
  created_at timestamptz default now(),
  resolved boolean default false,
  resolved_by uuid references public.users (id)
);

-- RLS
alter table public.profiles enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.article_likes enable row level security;
alter table public.article_reports enable row level security;

create policy "profiles select own" on public.profiles for select
  using (auth.uid() = id);
create policy "profiles insert" on public.profiles for insert
  with check (auth.uid() = id);
create policy "profiles update own" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "subscriptions select own" on public.user_subscriptions for select
  using (auth.uid() = user_id);
create policy "subscriptions upsert own" on public.user_subscriptions for insert
  with check (auth.uid() = user_id);
create policy "subscriptions update own" on public.user_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "likes select" on public.article_likes for select using (true);
create policy "likes insert" on public.article_likes for insert
  with check (auth.uid() = user_id);
create policy "likes update own" on public.article_likes for update
  using (auth.uid() = user_id);

create policy "reports select editors" on public.article_reports for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor','admin')));
create policy "reports insert" on public.article_reports for insert
  with check (true);
