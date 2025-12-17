-- ============================================
-- ADD RLS POLICIES FOR MENUS
-- ============================================

-- Enable RLS on menu tables
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Public can read all menus and menu items
CREATE POLICY "menus_select_public" ON public.menus
  FOR SELECT USING (true);

CREATE POLICY "menu_items_select_public" ON public.menu_items
  FOR SELECT USING (true);

-- Admin/Editor can manage menus
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

-- Admin/Editor can manage menu items
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

-- Verify policies were created
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('menus', 'menu_items')
ORDER BY tablename, policyname;
