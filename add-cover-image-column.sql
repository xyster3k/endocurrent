-- Add cover_image_url column to articles table
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
