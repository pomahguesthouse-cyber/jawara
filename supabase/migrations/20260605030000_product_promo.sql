-- Promo / Diskon / Lainnya marker for products. promo_type drives the
-- badge color & icon; promo_text is an optional custom label string
-- (required when promo_type='lainnya', otherwise falls back to the type
-- name when rendering).
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS promo_type TEXT,
  ADD COLUMN IF NOT EXISTS promo_text TEXT;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_promo_type_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_promo_type_check
  CHECK (promo_type IS NULL OR promo_type IN ('promo', 'diskon', 'lainnya'));

CREATE INDEX IF NOT EXISTS products_promo_type_idx
  ON public.products (promo_type)
  WHERE promo_type IS NOT NULL;
