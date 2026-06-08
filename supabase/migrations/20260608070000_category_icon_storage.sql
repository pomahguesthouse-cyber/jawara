-- Storage bucket for category icons
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('category_icons', 'category_icons', true, 2 * 1024 * 1024, ARRAY['image/png','image/jpeg','image/webp','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for category icons bucket
CREATE POLICY "Public read category_icons"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'category_icons');

CREATE POLICY "Authenticated upload category_icons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'category_icons');

CREATE POLICY "Authenticated update category_icons"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'category_icons')
WITH CHECK (bucket_id = 'category_icons');

CREATE POLICY "Authenticated delete category_icons"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'category_icons');
