-- Add multi-image support to products table
-- `images` stores a JSONB array of public URLs (ordered, first one is primary)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Backfill: move existing image_url into the images array (if not null)
UPDATE public.products
SET images = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL AND images = '[]'::jsonb;
