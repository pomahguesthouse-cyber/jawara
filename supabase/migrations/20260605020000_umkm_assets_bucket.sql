-- Public bucket for UMKM logo / banner uploads (images & videos).
-- The member dashboard uploads here at path {user_id}/{type}_{ts}.{ext}.

INSERT INTO storage.buckets (id, name, public)
VALUES ('umkm_assets', 'umkm_assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read: anyone can fetch the file (banner shown on homepage etc.).
DROP POLICY IF EXISTS "umkm_assets public read" ON storage.objects;
CREATE POLICY "umkm_assets public read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'umkm_assets');

-- Owner write: any authenticated user can upload into a folder named with
-- their own auth.uid(). Super admins can upload anywhere in the bucket.
DROP POLICY IF EXISTS "umkm_assets owner write" ON storage.objects;
CREATE POLICY "umkm_assets owner write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'umkm_assets' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'super_admin')
      OR (auth.jwt()->>'email' = 'ical.smg@gmail.com')
    )
  );

DROP POLICY IF EXISTS "umkm_assets owner update" ON storage.objects;
CREATE POLICY "umkm_assets owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'umkm_assets' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'super_admin')
      OR (auth.jwt()->>'email' = 'ical.smg@gmail.com')
    )
  );

DROP POLICY IF EXISTS "umkm_assets owner delete" ON storage.objects;
CREATE POLICY "umkm_assets owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'umkm_assets' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'super_admin')
      OR (auth.jwt()->>'email' = 'ical.smg@gmail.com')
    )
  );
