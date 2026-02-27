-- Categories table for section background images and ordering
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  slug text unique not null,
  image_url text,
  order_index int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Public read access (no auth needed for homepage)
alter table public.categories enable row level security;

create policy "categories select public" on public.categories
  for select using (true);

create policy "categories manage editors" on public.categories
  for all using (
    exists (select 1 from public.profiles p where p.id::text = auth.uid()::text and p.role in ('editor','admin'))
  );

-- Seed with known categories
insert into public.categories (name, slug, order_index) values
  ('Oncology',         'oncology',         1),
  ('Neurology',        'neurology',        2),
  ('Endocrinology',    'endocrinology',    3),
  ('Cardiology',       'cardiology',       4),
  ('Gastroenterology', 'gastroenterology', 5),
  ('Pulmonology',      'pulmonology',      6),
  ('Rheumatology',     'rheumatology',     7),
  ('Dermatology',      'dermatology',      8)
on conflict (name) do nothing;
