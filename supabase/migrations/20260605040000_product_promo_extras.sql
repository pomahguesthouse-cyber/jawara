-- Expiry + original price for the product promo feature.
--   promo_expires_at: when the promo stops being valid. The badge hides
--   automatically once this passes; the product itself stays published.
--   original_price: pre-discount price, displayed strikethrough next to
--   the actual price when set (mainly for promo_type='diskon').

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS promo_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS original_price NUMERIC;

-- Sanity: original_price must be greater than the current price when
-- both are set (otherwise the strikethrough makes no sense).
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_original_price_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_original_price_check
  CHECK (original_price IS NULL OR original_price >= price);
