-- Optional Google Maps link for the UMKM (any maps.app.goo.gl,
-- google.com/maps/place/..., or embed URL).
ALTER TABLE public.umkm_profiles
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
