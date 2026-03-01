-- Fix categories: remove hallucinated ones, add actual sections
-- Run this in Supabase SQL Editor

-- Delete categories that don't exist in your menu
delete from public.categories
where name in ('Cardiology', 'Gastroenterology', 'Pulmonology', 'Rheumatology', 'Dermatology');

-- Add missing actual categories
insert into public.categories (name, slug, order_index) values
  ('Medical AI',        'medical-ai',        4),
  ('General medicine',  'general-medicine',   5),
  ('Genetics',          'genetics',           6)
on conflict (name) do nothing;

-- Fix ordering to match your menu
update public.categories set order_index = 1 where name = 'Endocrinology';
update public.categories set order_index = 2 where name = 'Medical AI';
update public.categories set order_index = 3 where name = 'Oncology';
update public.categories set order_index = 4 where name = 'General medicine';
update public.categories set order_index = 5 where name = 'Neurology';
update public.categories set order_index = 6 where name = 'Genetics';
