-- Allow hero slides to target a specific device (or both).
-- Values: 'desktop' | 'mobile' | 'both'
ALTER TABLE public.hero_slides
  ADD COLUMN IF NOT EXISTS device TEXT NOT NULL DEFAULT 'both';

ALTER TABLE public.hero_slides
  DROP CONSTRAINT IF EXISTS hero_slides_device_check;

ALTER TABLE public.hero_slides
  ADD CONSTRAINT hero_slides_device_check
  CHECK (device IN ('desktop', 'mobile', 'both'));

CREATE INDEX IF NOT EXISTS hero_slides_device_idx ON public.hero_slides(device);
