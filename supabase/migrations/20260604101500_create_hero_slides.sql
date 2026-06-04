-- Create hero_slides table to manage homepage banners dynamically
CREATE TABLE public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image TEXT NOT NULL,
  title TEXT NOT NULL,
  subtext TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'button', -- 'search' or 'button'
  btn_text TEXT,
  btn_to TEXT,
  btn_search JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant privileges
GRANT SELECT ON public.hero_slides TO anon, authenticated;
GRANT ALL ON public.hero_slides TO service_role;
GRANT ALL ON public.hero_slides TO authenticated;

-- Enable RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Read policy: public read allowed
CREATE POLICY "hero_slides public read" ON public.hero_slides
  FOR SELECT TO anon, authenticated USING (true);

-- Admin policy: manage allowed for super_admins
CREATE POLICY "admin manage hero_slides" ON public.hero_slides
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR (auth.jwt()->>'email' = 'ical.smg@gmail.com'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR (auth.jwt()->>'email' = 'ical.smg@gmail.com'));

-- Seed default slides
INSERT INTO public.hero_slides (image, title, subtext, type, btn_text, btn_to, sort_order) VALUES
  ('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600', 'Temukan UMKM Terbaik Jawa Tengah', 'Direktori digital wirausaha pilihan dengan rating terbaik dan layanan terpercaya di Jawa Tengah.', 'search', null, null, 1),
  ('https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1600', 'Dukung Produk Unggulan Lokal', 'Jelajahi dan beli produk kerajinan, fashion, serta kuliner khas langsung dari produsen lokal terbaik.', 'button', 'Kunjungi Marketplace', '/marketplace', 2),
  ('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1600', 'Bawa Usaha Anda ke Dunia Digital', 'Daftar secara gratis, kelola katalog produk, dan perluas jangkauan pasar wirausaha Anda bersama JAWARA.', 'button', 'Daftarkan UMKM Anda', '/auth', 3);
