-- Add TikTok handle / URL column to UMKM profiles.
ALTER TABLE public.umkm_profiles
  ADD COLUMN IF NOT EXISTS tiktok TEXT;
