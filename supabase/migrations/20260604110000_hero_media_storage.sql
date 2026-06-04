-- Storage bucket for hero builder media (images, videos, posters)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-media', 'hero-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read; admin write
CREATE POLICY "hero-media public read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'hero-media');

CREATE POLICY "hero-media admin write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'hero-media' AND (
      public.has_role(auth.uid(), 'super_admin')
      OR (auth.jwt()->>'email' = 'ical.smg@gmail.com')
    )
  );

CREATE POLICY "hero-media admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'hero-media' AND (
      public.has_role(auth.uid(), 'super_admin')
      OR (auth.jwt()->>'email' = 'ical.smg@gmail.com')
    )
  );

CREATE POLICY "hero-media admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'hero-media' AND (
      public.has_role(auth.uid(), 'super_admin')
      OR (auth.jwt()->>'email' = 'ical.smg@gmail.com')
    )
  );

-- Media library table (records uploads + folder tagging)
CREATE TABLE IF NOT EXISTS public.hero_media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  folder TEXT NOT NULL DEFAULT 'Hero Images',
  size_bytes BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.hero_media_library TO anon, authenticated;
GRANT ALL ON public.hero_media_library TO authenticated;

ALTER TABLE public.hero_media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hero_media_library read"
  ON public.hero_media_library FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "hero_media_library admin manage"
  ON public.hero_media_library FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (auth.jwt()->>'email' = 'ical.smg@gmail.com')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (auth.jwt()->>'email' = 'ical.smg@gmail.com')
  );

CREATE INDEX IF NOT EXISTS hero_media_library_folder_idx ON public.hero_media_library(folder);
CREATE INDEX IF NOT EXISTS hero_media_library_created_at_idx ON public.hero_media_library(created_at DESC);
