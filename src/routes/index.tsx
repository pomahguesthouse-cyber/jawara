import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import {
  Search, MapPin, ChevronRight, ChevronLeft, Star, BadgeCheck, Heart,
  Shield, Zap, HeadphonesIcon, Users, TrendingUp, ChevronDown, Flame, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PublicShell } from "@/components/PublicShell";
import { formatRupiah } from "@/lib/format";

// ─── Query ───────────────────────────────────────────────────────────────────
const homeQueryOptions = queryOptions({
  queryKey: ["home"],
  queryFn: async () => {
    const [umkm, products, umkmProducts, events, articles, categories, heroSlidesResult] = await Promise.all([
      supabase.from("umkm_profiles").select("id, slug, name, city, logo_url, banner_url, rating, is_verified, category:categories(name)").eq("is_published", true).order("rating", { ascending: false }).limit(8),
      supabase.from("products").select("id, name, price, image_url, umkm:umkm_profiles!inner(name, slug)").eq("is_published", true).order("created_at", { ascending: false }).limit(8),
      // Fetch product images grouped by umkm_id for banner fallback
      supabase.from("products").select("umkm_id, image_url").eq("is_published", true).not("image_url", "is", null).order("created_at", { ascending: false }).limit(100),
      supabase.from("events").select("id, slug, title, cover_url, event_type, location, city, start_at").order("start_at", { ascending: true }).limit(3),
      supabase.from("articles").select("id, slug, title, excerpt, cover_url, category, published_at").order("published_at", { ascending: false }).limit(3),
      supabase.from("categories").select("id, name, slug, icon").order("name"),
      supabase.from("hero_slides").select("*").order("sort_order", { ascending: true }).then(
        (res) => (res.error ? { data: [] } : res),
        () => ({ data: [] })
      ),
    ]);

    // Build map: umkm_id → first 4 product image URLs
    const productImagesMap = new Map<string, string[]>();
    for (const p of umkmProducts.data ?? []) {
      if (!p.umkm_id || !p.image_url) continue;
      const existing = productImagesMap.get(p.umkm_id) ?? [];
      if (existing.length < 4) {
        productImagesMap.set(p.umkm_id, [...existing, p.image_url]);
      }
    }

    const heroSlides = (heroSlidesResult?.data ?? []) as any[];

    return {
      umkm: umkm.data ?? [],
      products: products.data ?? [],
      productImagesMap,
      events: events.data ?? [],
      articles: articles.data ?? [],
      categories: categories.data ?? [],
      heroSlides,
    };
  },
});

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "JAWARA — Temukan UMKM Terbaik Jawa Tengah" },
      { name: "description", content: "Direktori digital UMKM Jawa Tengah. Jelajahi ribuan UMKM, produk lokal, event, dan tips bisnis." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQueryOptions),
  component: HomePage,
}) as Parameters<typeof createFileRoute>[0] extends infer T ? T : never);

function HomePage() {
  return (
    <PublicShell>
      <Hero />
      <CategoriesStrip />
      <PopularUmkm />
      <TrustSection />
      <LatestProducts />
      <CtaBanner />
    </PublicShell>
  );
}

// ─── Hero Slider ─────────────────────────────────────────────────────────────
const CITIES = ["Semua Kota", "Semarang", "Solo", "Yogyakarta", "Magelang", "Pekalongan", "Purwokerto", "Kudus", "Jepara", "Demak"];

const HERO_SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600",
    title: "Temukan UMKM Terbaik Jawa Tengah",
    subtext: "Direktori digital wirausaha pilihan dengan rating terbaik dan layanan terpercaya di Jawa Tengah.",
    type: "search",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1600",
    title: "Dukung Produk Unggulan Lokal",
    subtext: "Jelajahi dan beli produk kerajinan, fashion, serta kuliner khas langsung dari produsen lokal terbaik.",
    type: "button",
    btnText: "Kunjungi Marketplace",
    btnTo: "/marketplace",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1600",
    title: "Bawa Usaha Anda ke Dunia Digital",
    subtext: "Daftar secara gratis, kelola katalog produk, dan perluas jangkauan pasar wirausaha Anda bersama JAWARA.",
    type: "button",
    btnText: "Daftarkan UMKM Anda",
    btnTo: "/auth",
    btnSearch: { mode: "register" },
  }
];

type HeroSlideVM = {
  id: string | number;
  image: string;
  title: string;
  subtext: string;
  type: string;
  btnText?: string | null;
  btnTo?: string | null;
  btnSearch?: any;
  bgType?: "image" | "video" | "gradient" | "solid" | "ai";
  videoUrl?: string;
  videoPoster?: string;
  /** Auto-advance duration in ms. Falls back to DEFAULT_HERO_DURATION. */
  duration?: number;
};

const DEFAULT_HERO_DURATION = 6000;
const MIN_HERO_DURATION = 1000;

// Convert various video URLs (YouTube, Vimeo, direct .mp4) into something
// we can render as background. Returns either { kind: 'iframe', src } or
// { kind: 'video', src }.
function resolveHeroVideo(url: string): { kind: "iframe" | "video"; src: string } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) {
    const id = yt[1];
    return {
      kind: "iframe",
      src: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&modestbranding=1&playsinline=1&rel=0`,
    };
  }
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) {
    return {
      kind: "iframe",
      src: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&muted=1&loop=1&background=1`,
    };
  }
  return { kind: "video", src: url };
}

function HeroBackground({ slide }: { slide: HeroSlideVM }) {
  if (slide.bgType === "video" && slide.videoUrl) {
    const v = resolveHeroVideo(slide.videoUrl);
    if (v?.kind === "iframe") {
      return (
        <div className="absolute inset-0 size-full overflow-hidden">
          <iframe
            src={v.src}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full pointer-events-none"
            allow="autoplay; encrypted-media; picture-in-picture"
            title=""
          />
          {slide.videoPoster && (
            <img src={slide.videoPoster} alt="" className="absolute inset-0 size-full object-cover -z-10" />
          )}
        </div>
      );
    }
    if (v?.kind === "video") {
      return (
        <video
          src={v.src}
          poster={slide.videoPoster || slide.image}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 size-full object-cover"
        />
      );
    }
  }
  return <img src={slide.image} alt="" className="absolute inset-0 size-full object-cover object-center" />;
}

function useCarousel(length: number, getDuration: (idx: number) => number) {
  const [currentSlide, setCurrentSlide] = useState(0);
  // Keep the latest duration accessor in a ref so the effect doesn't re-run
  // every render just because the parent recreates the callback.
  const getDurationRef = useRef(getDuration);
  getDurationRef.current = getDuration;

  useEffect(() => {
    if (length <= 1) return;
    const raw = getDurationRef.current(currentSlide);
    const ms = Math.max(MIN_HERO_DURATION, Number.isFinite(raw) ? raw : DEFAULT_HERO_DURATION);
    const t = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % length);
    }, ms);
    return () => clearTimeout(t);
  }, [currentSlide, length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + length) % length);
  };
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % length);
  };
  const handleDotClick = (idx: number) => {
    setCurrentSlide(idx);
  };

  return { currentSlide, handlePrev, handleNext, handleDotClick };
}

function Hero() {
  const { data } = useSuspenseQuery(homeQueryOptions);

  // Normalize db schema and filter per device. Slides marked 'both' appear in
  // both carousels; 'mobile'/'desktop' appear only in their target.
  const allDbSlides: (HeroSlideVM & { device: string })[] = (data.heroSlides ?? []).map((s: any) => {
    const bg = s.settings?.background ?? {};
    return {
      id: s.id,
      image: bg.image || s.image,
      title: s.settings?.headline?.text || s.title,
      subtext: s.settings?.subheadline?.text || s.subtext,
      type: s.type,
      btnText: s.btn_text,
      btnTo: s.btn_to,
      btnSearch: undefined,
      bgType: bg.type || "image",
      videoUrl: bg.videoUrl || undefined,
      videoPoster: bg.videoPoster || undefined,
      duration: typeof s.settings?.duration === "number" ? s.settings.duration : DEFAULT_HERO_DURATION,
      device: s.device || "both",
    };
  });

  const dbMobile = allDbSlides.filter((s) => s.device === "mobile" || s.device === "both");
  const dbDesktop = allDbSlides.filter((s) => s.device === "desktop" || s.device === "both");

  const mobileSlides: HeroSlideVM[] = dbMobile.length > 0 ? dbMobile : HERO_SLIDES;
  const desktopSlides: HeroSlideVM[] = dbDesktop.length > 0 ? dbDesktop : HERO_SLIDES;

  const mobileCarousel = useCarousel(
    mobileSlides.length,
    (idx) => mobileSlides[idx]?.duration ?? DEFAULT_HERO_DURATION,
  );
  const desktopCarousel = useCarousel(
    desktopSlides.length,
    (idx) => desktopSlides[idx]?.duration ?? DEFAULT_HERO_DURATION,
  );

  const [q, setQ] = useState("");
  const [city, setCity] = useState("Semarang");
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/direktori", search: { q, kota: city === "Semua Kota" ? undefined : city } as never });
  };

  const handleSearchIconClick = (e: React.MouseEvent) => {
    if (!searchOpen) {
      e.preventDefault();
      setSearchOpen(true);
    }
    // when open the icon is type=submit and click submits the form naturally
  };

  return (
    <>
      {/* ─── MOBILE HERO (< md) — vertical, centered, compact search ──────── */}
      <section className="md:hidden relative w-full overflow-hidden bg-gray-900 h-[460px] flex items-end">
        {mobileSlides.map((slide, idx) => {
          const isActive = idx === mobileCarousel.currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 size-full transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <HeroBackground slide={slide} />
              {/* Strong vertical gradient: image visible up top, dark below for text */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/95" />
              <div className="absolute inset-x-0 bottom-28 px-5 z-10 text-center text-white">
                <h1 className="text-2xl font-black leading-tight tracking-tight animate-fade-up">
                  {slide.title}
                </h1>
                <p className="text-gray-200 text-xs leading-relaxed mt-2 line-clamp-2 animate-fade-up">
                  {slide.subtext}
                </p>
                {slide.type === "button" && (
                  <div className="pt-4 animate-fade-up">
                    <Link
                      to={slide.btnTo!}
                      search={slide.btnSearch as never}
                      className="inline-flex items-center gap-1.5 bg-[#1a6b3c] active:bg-[#155c33] text-white font-bold px-5 py-2.5 rounded-full text-sm shadow-md"
                    >
                      {slide.btnText} <ChevronRight className="size-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Mobile search: floating toggle — icon-only collapsed, slides in from right when open */}
        <div className="absolute bottom-6 right-4 z-30 pointer-events-auto">
          <form
            onSubmit={onSearchSubmit}
            className="flex items-stretch"
          >
            <div
              className={`flex items-stretch overflow-hidden bg-white shadow-2xl rounded-l-full transition-[max-width,opacity] duration-500 ease-out ${
                searchOpen ? "max-w-[calc(100vw-6.5rem)] opacity-100" : "max-w-0 opacity-0"
              }`}
            >
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="px-3 text-gray-400 active:text-gray-700 shrink-0"
                aria-label="Tutup pencarian"
              >
                <X className="size-4" />
              </button>
              <div className="relative flex items-center gap-1 px-2 border-r border-gray-100 shrink-0">
                <MapPin className="size-3.5 text-[#1a6b3c]" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="text-[11px] font-semibold text-gray-700 bg-transparent focus:outline-none pr-3 appearance-none max-w-[80px]"
                >
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 flex items-center px-2 min-w-0">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari..."
                  className="w-full h-11 bg-transparent text-sm focus:outline-none text-gray-700 placeholder:text-gray-400"
                  autoFocus={searchOpen}
                />
              </div>
            </div>
            <button
              type={searchOpen ? "submit" : "button"}
              onClick={handleSearchIconClick}
              className={`size-12 grid place-items-center bg-[#1a6b3c] active:bg-[#155c33] text-white shadow-2xl transition-all duration-300 ${
                searchOpen ? "rounded-r-full" : "rounded-full"
              }`}
              aria-label={searchOpen ? "Cari sekarang" : "Buka pencarian"}
            >
              <Search className="size-5" />
            </button>
          </form>
        </div>

        {/* Dot Indicators (mobile) */}
        <div className="absolute top-4 left-0 right-0 z-20 flex justify-center gap-1.5">
          {mobileSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => mobileCarousel.handleDotClick(idx)}
              className={`h-1 rounded-full transition-all cursor-pointer ${
                idx === mobileCarousel.currentSlide ? "bg-emerald-400 w-6" : "bg-white/40 w-3"
              }`}
              aria-label={`Ke slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ─── DESKTOP HERO (md+) — wide, left-aligned, full search bar ──────── */}
      <section className="hidden md:flex relative w-full overflow-hidden bg-gray-900 h-[600px] items-center group">
        {desktopSlides.map((slide, idx) => {
          const isActive = idx === desktopCarousel.currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 size-full transition-opacity duration-1000 ease-in-out flex items-center ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <HeroBackground slide={slide} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/10" />
              <div className="relative z-10 mx-auto max-w-7xl w-full px-8 flex flex-col justify-center">
                <div className="max-w-2xl text-white space-y-6 py-16">
                  <h1 className="text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight animate-fade-up">
                    {slide.title}
                  </h1>
                  <p className="text-gray-200 text-base lg:text-lg max-w-xl leading-relaxed animate-fade-up">
                    {slide.subtext}
                  </p>
                  {slide.type === "button" && (
                    <div className="pt-2 animate-fade-up">
                      <Link
                        to={slide.btnTo!}
                        search={slide.btnSearch as never}
                        className="inline-flex items-center gap-2 bg-[#1a6b3c] hover:bg-[#155c33] text-white font-bold px-7 py-3.5 rounded-full text-base transition shadow-md cursor-pointer"
                      >
                        {slide.btnText} <ChevronRight className="size-5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Desktop search: floating toggle — icon-only collapsed, slides in from right when open */}
        <div className="absolute bottom-20 right-8 z-30 pointer-events-auto">
          <form
            onSubmit={onSearchSubmit}
            className="flex items-stretch"
          >
            <div
              className={`flex items-stretch overflow-hidden bg-white shadow-2xl rounded-l-full transition-[max-width,opacity] duration-500 ease-out ${
                searchOpen ? "max-w-[640px] opacity-100" : "max-w-0 opacity-0"
              }`}
            >
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="px-3 text-gray-400 hover:text-gray-700 shrink-0"
                aria-label="Tutup pencarian"
              >
                <X className="size-4" />
              </button>
              <div className="relative flex items-center gap-1.5 px-3 border-r border-gray-100 shrink-0">
                <MapPin className="size-4 text-[#1a6b3c]" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="text-sm font-semibold text-gray-700 bg-transparent focus:outline-none pr-5 appearance-none cursor-pointer"
                >
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown className="size-3.5 text-gray-400 absolute right-3 pointer-events-none" />
              </div>
              <div className="flex-1 flex items-center gap-2 px-3 min-w-[260px]">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari usaha, produk, kategori..."
                  className="w-full h-12 bg-transparent text-sm focus:outline-none text-gray-700 placeholder:text-gray-400"
                  autoFocus={searchOpen}
                />
              </div>
            </div>
            <button
              type={searchOpen ? "submit" : "button"}
              onClick={handleSearchIconClick}
              className={`size-14 grid place-items-center bg-[#1a6b3c] hover:bg-[#155c33] text-white shadow-2xl transition-all duration-300 cursor-pointer ${
                searchOpen ? "rounded-r-full" : "rounded-full hover:scale-105"
              }`}
              aria-label={searchOpen ? "Cari sekarang" : "Buka pencarian"}
            >
              <Search className="size-5" />
            </button>
          </form>
        </div>

        {/* Navigation Arrows (Desktop Only) */}
        <button
          onClick={desktopCarousel.handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
          aria-label="Slide sebelumnya"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={desktopCarousel.handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
          aria-label="Slide berikutnya"
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Dot Indicators (desktop) */}
        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2.5">
          {desktopSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => desktopCarousel.handleDotClick(idx)}
              className={`size-2.5 rounded-full transition-all cursor-pointer ${
                idx === desktopCarousel.currentSlide ? "bg-[#1a6b3c] w-6" : "bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Ke slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>
    </>
  );
}

// ─── Categories Strip (full row with icons) ──────────────────────────────────
function CategoriesStrip() {
  const { data } = useSuspenseQuery(homeQueryOptions);
  return (
    <section className="border-y border-gray-100 bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex overflow-x-auto no-scrollbar gap-2 sm:gap-3 sm:flex-wrap sm:justify-center">
          {data.categories.map((c) => (
            <Link
              key={c.id}
              to="/direktori"
              search={{ kategori: c.slug } as never}
              className="group flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl hover:bg-white hover:shadow-sm transition shrink-0"
            >
              <div className="size-10 sm:size-12 rounded-2xl bg-white shadow-sm text-xl sm:text-2xl grid place-items-center group-hover:scale-110 transition ring-1 ring-gray-100">
                {c.icon ?? "🏪"}
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-gray-600 whitespace-nowrap">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Popular UMKM ────────────────────────────────────────────────────────────
function PopularUmkm() {
  const { data } = useSuspenseQuery(homeQueryOptions);

  return (
    <section className="py-10 sm:py-14 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <Flame className="size-6 text-orange-500 fill-orange-400" />
              UMKM Populer
            </h2>
            <p className="text-sm text-gray-500 mt-1">Wirausaha pilihan dengan rating tertinggi dari pelanggan</p>
          </div>
          <Link to="/direktori" className="text-sm font-bold text-[#1a6b3c] hover:underline flex items-center gap-1 shrink-0">
            Lihat Semua <ChevronRight className="size-4" />
          </Link>
        </div>

        {data.umkm.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">Belum ada UMKM terdaftar.</p>
          </div>
        ) : (
          /* Horizontal scroll on mobile, 4-col grid on desktop */
          <div className="flex overflow-x-auto sm:overflow-visible no-scrollbar gap-4 -mx-4 px-4 pb-4 sm:pb-0 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {data.umkm.map((u) => (
              <UmkmCard
                key={u.id}
                umkm={u}
                productImages={data.productImagesMap.get(u.id) ?? []}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── UMKM Card (new design) ───────────────────────────────────────────────────
interface UmkmData {
  id: string;
  slug: string;
  name: string;
  city: string;
  logo_url: string | null;
  banner_url?: string | null;
  rating: number | null;
  is_verified?: boolean;
  category?: { name: string } | null;
  [key: string]: unknown;
}

/** Auto-sliding image carousel used as banner fallback */
function ProductSlideshow({ images, alt }: { images: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (images.length <= 1) return;
    timerRef.current = setInterval(() => setIdx((i) => (i + 1) % images.length), 2800);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <>
      <img
        key={idx}
        src={images[idx]}
        alt={alt}
        className="absolute inset-0 size-full object-cover transition-opacity duration-700"
      />
      {/* subtle dark gradient so overlays stay readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      {/* dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); setIdx(i); }}
              className={`size-1.5 rounded-full transition-colors ${
                i === idx ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}

function UmkmCard({ umkm, productImages = [] }: { umkm: UmkmData; productImages?: string[] }) {
  const [liked, setLiked] = useState(false);
  const initials = umkm.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  // Determine what to show in the banner area
  const hasBanner = !!umkm.banner_url;
  const hasProductPhotos = productImages.length > 0;
  const hasLogo = !!umkm.logo_url;

  return (
    <div className="bg-white rounded-2xl overflow-hidden ring-1 ring-gray-100 hover:shadow-lg transition-shadow duration-200 shrink-0 w-64 sm:w-auto flex flex-col">
      {/* Image area */}
      <div className="relative h-40 bg-gray-100 overflow-hidden">
        {hasBanner ? (
          /* 1. UMKM has a dedicated banner → show it */
          <img src={umkm.banner_url!} alt={umkm.name} className="size-full object-cover" />
        ) : hasProductPhotos ? (
          /* 2. No banner but has product photos → auto-slideshow */
          <ProductSlideshow images={productImages} alt={umkm.name} />
        ) : hasLogo ? (
          /* 3. Only logo → blurred logo as background */
          <>
            <img src={umkm.logo_url!} alt="" className="absolute inset-0 size-full object-cover scale-110 blur-lg opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 to-green-600/20" />
          </>
        ) : (
          /* 4. Nothing → gradient placeholder */
          <div className="size-full bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center">
            <span className="text-4xl font-black text-green-300">{initials}</span>
          </div>
        )}

        {/* Rating badge — top left */}
        {umkm.rating != null && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
            <Star className="size-3 fill-white text-white" />
            {Number(umkm.rating).toFixed(1)}
          </div>
        )}

        {/* Heart — top right */}
        <button
          onClick={() => setLiked((v) => !v)}
          className="absolute top-2.5 right-2.5 size-7 rounded-full bg-white/90 flex items-center justify-center shadow hover:scale-110 transition"
        >
          <Heart className={`size-3.5 ${liked ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
        </button>

        {/* Logo circle — bottom left */}
        {umkm.logo_url && (
          <div className="absolute bottom-3 left-3 size-10 rounded-full ring-2 ring-white bg-white overflow-hidden shadow">
            <img src={umkm.logo_url} alt={umkm.name} className="size-full object-cover" />
          </div>
        )}
        {!umkm.logo_url && (
          <div className="absolute bottom-3 left-3 size-10 rounded-full ring-2 ring-white bg-[#1a6b3c] flex items-center justify-center shadow">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        {/* Name + verified */}
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-sm text-gray-900 truncate leading-snug">{umkm.name}</h3>
          {umkm.is_verified && <BadgeCheck className="size-4 shrink-0 text-[#1a6b3c]" />}
        </div>

        {/* City */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{umkm.city}</span>
        </div>

        {/* Stars + review count */}
        {umkm.rating != null && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`size-3 ${s <= Math.round(Number(umkm.rating)) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}`}
              />
            ))}
            <span className="text-xs font-bold text-gray-700 ml-0.5">{Number(umkm.rating).toFixed(1)}</span>
            {umkm.review_count != null && (
              <span className="text-xs text-gray-400">({umkm.review_count} ulasan)</span>
            )}
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-[#1a6b3c]">
              {(umkm.category as { name: string })?.name || "UMKM"}
            </span>
            <span className="text-[10px] text-gray-400">0 Produk</span>
          </div>
          <Link
            to="/umkm/$slug"
            params={{ slug: umkm.slug }}
            className="shrink-0 text-xs font-bold text-[#1a6b3c] hover:underline flex items-center gap-0.5"
          >
            Lihat Profil <ChevronRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Trust section ────────────────────────────────────────────────────────────
const TRUST = [
  { icon: Shield,          color: "bg-green-100 text-[#1a6b3c]", title: "Terpercaya & Terverifikasi", desc: "Setiap UMKM diverifikasi tim kami" },
  { icon: Zap,             color: "bg-orange-100 text-orange-600", title: "Mudah & Cepat", desc: "Cari UMKM dengan mudah" },
  { icon: HeadphonesIcon,  color: "bg-purple-100 text-purple-600", title: "Dukungan Penuh", desc: "Kami siap membantu Anda" },
  { icon: Users,           color: "bg-blue-100 text-blue-600",    title: "Tumbuh Bersama", desc: "Membangun ekonomi daerah" },
];

function TrustSection() {
  return (
    <section className="border-y border-gray-100 bg-gray-50/60 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-start gap-3">
              <div className={`size-10 sm:size-11 rounded-xl flex items-center justify-center shrink-0 ${t.color}`}>
                <t.icon className="size-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">{t.title}</p>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Latest Products ──────────────────────────────────────────────────────────
function LatestProducts() {
  const { data } = useSuspenseQuery(homeQueryOptions);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || data.products.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      const card = el.firstElementChild as HTMLElement;
      if (!card) return;

      const cardWidth = card.offsetWidth;
      const gap = window.innerWidth >= 640 ? 20 : 12; // sm:gap-5 is 20px, gap-3 is 12px
      const step = cardWidth + gap;

      let nextScroll = el.scrollLeft + step;
      // Wrap back to start if we exceed the scrollable content
      if (nextScroll >= el.scrollWidth - el.clientWidth - 10) {
        nextScroll = 0;
      }

      el.scrollTo({
        left: nextScroll,
        behavior: "smooth",
      });
    }, 3000); // Transitions automatically every 3 seconds

    return () => clearInterval(interval);
  }, [data.products.length, isPaused]);

  if (data.products.length === 0) return null;

  const handleManualScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const card = el.firstElementChild as HTMLElement;
    if (!card) return;

    const cardWidth = card.offsetWidth;
    const gap = window.innerWidth >= 640 ? 20 : 12;
    const step = cardWidth + gap;

    const nextScroll = direction === "left" 
      ? el.scrollLeft - step 
      : el.scrollLeft + step;

    el.scrollTo({
      left: nextScroll,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-10 sm:py-14 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Produk Terbaru</h2>
            <p className="text-sm text-gray-500 mt-1">Produk unggulan dari UMKM Jawa Tengah</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Slider Navigation Buttons */}
            <div className="flex items-center gap-1.5 mr-2">
              <button
                onClick={() => handleManualScroll("left")}
                className="size-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#1a6b3c] hover:text-[#1a6b3c] active:bg-gray-50 transition cursor-pointer"
                aria-label="Slide sebelumnya"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => handleManualScroll("right")}
                className="size-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#1a6b3c] hover:text-[#1a6b3c] active:bg-gray-50 transition cursor-pointer"
                aria-label="Slide berikutnya"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <Link to="/marketplace" className="text-sm font-bold text-[#1a6b3c] hover:underline flex items-center gap-1">
              Marketplace <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>

        {/* Horizontal Slider Track Container */}
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          className="flex overflow-x-auto no-scrollbar gap-3 sm:gap-5 scroll-smooth -mx-4 px-4 pb-4 sm:mx-0 sm:px-0"
        >
          {data.products.slice(0, 8).map((p) => (
            <div key={p.id} className="w-[200px] sm:w-[240px] md:w-[260px] lg:w-[285px] shrink-0 group">
              <div className="aspect-[4/5] w-full rounded-2xl bg-gray-100 overflow-hidden ring-1 ring-gray-100 mb-2.5">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} loading="lazy" className="size-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="size-full flex items-center justify-center text-gray-300 text-xs">Tanpa Foto</div>
                )}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-[#1a6b3c] transition-colors">{p.name}</h3>
              <p className="text-sm font-bold text-[#1a6b3c]">{formatRupiah(p.price)}</p>
              {p.umkm && (
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">oleh {(p.umkm as { name: string }).name}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────
function CtaBanner() {
  return (
    <section className="pb-24 sm:pb-14 bg-white px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl bg-[#1a6b3c] text-white p-8 sm:p-14 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -left-8 bottom-0 size-48 rounded-full bg-white/5 blur-xl" />
          <div className="relative max-w-2xl">
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Siap membawa UMKM Anda ke dunia digital?
            </h3>
            <p className="mt-3 text-white/80 text-sm sm:text-base max-w-lg">
              Daftar gratis, kelola produk, dan manfaatkan teknologi untuk pemasaran dalam satu platform.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link
                to="/auth"
                search={{ mode: "register" } as never}
                className="inline-flex items-center justify-center gap-2 bg-white text-[#1a6b3c] px-6 py-3 rounded-full font-bold text-sm hover:bg-gray-100 transition"
              >
                Daftarkan UMKM Sekarang <ChevronRight className="size-4" />
              </Link>
              <Link
                to="/direktori"
                className="inline-flex items-center justify-center gap-2 border border-white/40 text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-white/10 transition"
              >
                Jelajahi Direktori
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
