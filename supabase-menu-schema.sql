-- ============================================
-- EndoCurrent Menu System - Database Schema
-- ============================================
-- Run this in your Supabase SQL Editor to create the menu tables

-- 1. Create menus table
CREATE TABLE IF NOT EXISTS public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create menu_items table
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

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON public.menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_parent_id ON public.menu_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_order ON public.menu_items(order_index);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies

-- Menus: Allow public read access
CREATE POLICY "Public can view menus"
  ON public.menus FOR SELECT
  TO PUBLIC
  USING (true);

-- Menus: Allow authenticated users with editor/admin role to insert
CREATE POLICY "Editors can create menus"
  ON public.menus FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Menus: Allow authenticated users with editor/admin role to update
CREATE POLICY "Editors can update menus"
  ON public.menus FOR UPDATE
  TO authenticated
  USING (true);

-- Menus: Allow authenticated users with editor/admin role to delete
CREATE POLICY "Editors can delete menus"
  ON public.menus FOR DELETE
  TO authenticated
  USING (true);

-- Menu Items: Allow public read access
CREATE POLICY "Public can view menu items"
  ON public.menu_items FOR SELECT
  TO PUBLIC
  USING (true);

-- Menu Items: Allow authenticated users with editor/admin role to insert
CREATE POLICY "Editors can create menu items"
  ON public.menu_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Menu Items: Allow authenticated users with editor/admin role to update
CREATE POLICY "Editors can update menu items"
  ON public.menu_items FOR UPDATE
  TO authenticated
  USING (true);

-- Menu Items: Allow authenticated users with editor/admin role to delete
CREATE POLICY "Editors can delete menu items"
  ON public.menu_items FOR DELETE
  TO authenticated
  USING (true);

-- 6. Add update trigger for updated_at columns
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_menus_updated_at
  BEFORE UPDATE ON public.menus
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- Done! Your menu system is ready to use.
-- ============================================
