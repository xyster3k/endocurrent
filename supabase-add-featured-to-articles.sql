-- ============================================
-- Add Featured Field to Articles Table
-- ============================================
-- Run this in your Supabase SQL Editor to add the featured/pin functionality

-- 1. Add featured column to articles table
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_articles_featured ON public.articles(featured) WHERE featured = TRUE;

-- 3. Create a function to ensure only one article is featured at a time
CREATE OR REPLACE FUNCTION public.ensure_single_featured_article()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.featured = TRUE THEN
    -- Unfeature all other articles
    UPDATE public.articles
    SET featured = FALSE
    WHERE id != NEW.id AND featured = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to auto-unfeature other articles when one is featured
DROP TRIGGER IF EXISTS trigger_ensure_single_featured ON public.articles;
CREATE TRIGGER trigger_ensure_single_featured
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  WHEN (NEW.featured = TRUE AND (OLD.featured IS NULL OR OLD.featured = FALSE))
  EXECUTE FUNCTION public.ensure_single_featured_article();

-- ============================================
-- Done! You can now feature/pin one article at a time
-- ============================================
