-- Allow authenticated users to insert categories (so they can add custom ones)
CREATE POLICY "authenticated_insert_categories" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (true);

-- Insert common Indonesian UMKM categories
INSERT INTO public.categories (name, slug, icon) VALUES
  ('Kuliner (Makanan & Minuman)', 'kuliner', '🍔'),
  ('Fashion & Pakaian', 'fashion', '👕'),
  ('Kerajinan & Kriya', 'kerajinan', '🎨'),
  ('Jasa & Layanan', 'jasa', '💼'),
  ('Kecantikan & Kesehatan', 'kecantikan-kesehatan', '💅'),
  ('Agribisnis & Pertanian', 'agribisnis-pertanian', '🌱'),
  ('Peternakan & Perikanan', 'peternakan-perikanan', '🐟'),
  ('Furnitur & Dekorasi', 'furnitur-dekorasi', '🛋️'),
  ('Elektronik & Gadget', 'elektronik-gadget', '🔌'),
  ('Otomotif', 'otomotif', '🚗'),
  ('Industri Kreatif & Edukasi', 'industri-kreatif-edukasi', '📚')
ON CONFLICT DO NOTHING;
