-- Alter hero_slides table to support dynamic visual builder configurations
ALTER TABLE public.hero_slides 
ADD COLUMN IF NOT EXISTS internal_name TEXT,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS priority_score INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Backfill internal_name for existing seeded slides
UPDATE public.hero_slides SET internal_name = 'Slide Pencarian Utama' WHERE sort_order = 1;
UPDATE public.hero_slides SET internal_name = 'Slide Marketplace' WHERE sort_order = 2;
UPDATE public.hero_slides SET internal_name = 'Slide Pendaftaran Usaha' WHERE sort_order = 3;
UPDATE public.hero_slides SET status = 'published' WHERE status = 'draft';
