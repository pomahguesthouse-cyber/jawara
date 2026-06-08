-- Add icon_url column to categories table to support image-based icons
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS icon_url TEXT;
