import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Search, MapPin, ChevronRight, Star, BadgeCheck, Heart,
  Shield, Zap, HeadphonesIcon, Users, TrendingUp, ChevronDown, Flame,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PublicShell } from "@/components/PublicShell";
import { formatRupiah } from "@/lib/format";

// ─── Query ───────────────────────────────────────────────────────────────────
const homeQueryOptions = queryOptions({
  queryKey: ["home"],
  queryFn: async () => {
    const [umkm, products, events, articles, categories] = await Promise.all([
      supabase.from("umkm_profiles").select("id, slug, name, city, logo_url, banner_url, rating, is_verified, review_count").eq("is_published", true).order("rating", { ascending: false }).limit(8),
      supabase.from("products").select("id, name, price, image_url, umkm:umkm_profiles!inner(name, slug)").eq("is_published", true).order("created_at", { ascending: false }).limit(8),
      supabase.from("events").select("id, slug, title, cover_url, event_type, location, city, start_at").order("start_at", { ascending: true }).limit(3),
      supabase.from("articles").select("id, slug, title, excerpt, cover_url, category, published_at").order("published_at", { ascending: false }).limit(3),
      supabase.from("categories").select("id, name, slug, icon").order("name"),
    ]);
    return {
      umkm: umkm.data ?? [],
      products: products.data ?? [],
      events: events.data ?? [],
      articles: articles.data ?? [],
      categories: categories.data ?? [],
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

// ─── Hero ────────────────────────────────────────────────────────────────────
const CITIES = ["Semua Kota", "Semarang", "Solo", "Yogyakarta", "Magelang", "Pekalongan", "Purwokerto", "Kudus", "Jepara", "Demak"];

function Hero() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("Semarang");
  const navigate = useNavigate();

  return (
    <section className="bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-4 items-center">

          {/* ── Left content ── */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                Temukan UMKM<br />
                <span className="text-[#1a6b3c]">Terbaik Jawa Tengah</span>
              </h1>
              <p className="mt-4 text-gray-500 text-base leading-relaxed max-w-md">
                Direktori digital UMKM Jawa Tengah pilihan dengan rating terbaik dan layanan terpercaya.
              </p>
            </div>

            {/* Search bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate({ to: "/direktori", search: { q, kota: city === "Semua Kota" ? undefined : city } as never });
              }}
              className="flex items-center gap-0 bg-white ring-1 ring-gray-200 rounded-2xl shadow-md overflow-hidden"
            >
              {/* City selector */}
              <div className="relative shrink-0 border-r border-gray-200">
                <div className="flex items-center gap-1.5 px-3 py-3">
                  <MapPin className="size-4 text-[#1a6b3c] shrink-0" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="text-sm font-semibold text-gray-700 bg-transparent focus:outline-none pr-5 appearance-none cursor-pointer"
                  >
                    {CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="size-3.5 text-gray-400 absolute right-3 pointer-events-none" />
                </div>
              </div>

              {/* Search input */}
              <div className="flex-1 flex items-center gap-2 px-4 min-w-0">
                <Search className="size-4 text-gray-400 shrink-0" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari usaha, produk, kategori..."
                  className="w-full h-12 bg-transparent text-sm focus:outline-none text-gray-700 placeholder:text-gray-400 min-w-0"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="shrink-0 h-12 px-5 sm:px-6 bg-[#1a6b3c] text-white text-sm font-bold hover:bg-[#155c33] transition flex items-center gap-2"
              >
                Cari Sekarang <ChevronRight className="size-4" />
              </button>
            </form>

            {/* Category quick links */}
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wider">Kategori Populer</p>
              <QuickCategories />
            </div>
          </div>

          {/* ── Right hero visual ── */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Green blob background */}
            <div
              className="absolute inset-0 -z-0 rounded-[3rem] opacity-20"
              style={{ background: "radial-gradient(ellipse at 60% 40%, #a7f3d0 0%, #6ee7b7 40%, transparent 70%)" }}
            />

            {/* Stat cards */}
            <div className="absolute top-4 left-0 sm:left-4 z-10 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 min-w-[160px]">
              <div className="size-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <Shield className="size-5 text-[#1a6b3c]" />
              </div>
              <div>
                <p className="font-extrabold text-gray-900 text-lg leading-none">10.000+</p>
                <p className="text-xs text-gray-500 mt-0.5">UMKM Terdaftar</p>
              </div>
            </div>

            <div className="absolute top-28 sm:top-32 left-0 sm:left-4 z-10 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 min-w-[150px]">
              <div className="size-10 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0">
                <Star className="size-5 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <p className="font-extrabold text-gray-900 text-lg leading-none">4.9</p>
                <p className="text-xs text-gray-500 mt-0.5">Rating Rata-rata</p>
              </div>
            </div>

            <div className="absolute bottom-8 left-0 sm:left-8 z-10 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <TrendingUp className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm leading-snug">Tumbuh Bersama</p>
                <p className="text-xs text-gray-500">UMKM Jateng</p>
              </div>
            </div>

            {/* Hero woman image */}
            <div className="relative z-0 w-full max-w-sm sm:max-w-md lg:max-w-lg">
              <img
                src="/hero-woman.png"
                alt="Pengusaha UMKM Jawa Tengah"
                className="w-full h-auto object-contain drop-shadow-xl"
                style={{ maxHeight: 420 }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickCategories() {
  const { data } = useSuspenseQuery(homeQueryOptions);
  const shown = data.categories.slice(0, 6);

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {shown.map((c) => (
        <Link
          key={c.id}
          to="/direktori"
          search={{ kategori: c.slug } as never}
          className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl bg-gray-50 hover:bg-green-50 hover:ring-1 hover:ring-green-200 transition group"
        >
          <span className="text-xl leading-none">{c.icon ?? "🏪"}</span>
          <span className="text-[11px] font-semibold text-gray-600 group-hover:text-[#1a6b3c]">{c.name}</span>
        </Link>
      ))}
      <Link
        to="/direktori"
        className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl bg-gray-50 hover:bg-green-50 transition"
      >
        <span className="text-xl leading-none">≡</span>
        <span className="text-[11px] font-semibold text-gray-500">Lainnya</span>
      </Link>
    </div>
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
          <div className="flex overflow-x-auto no-scrollbar gap-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {data.umkm.map((u) => (
              <UmkmCard key={u.id} umkm={u} />
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
  review_count?: number | null;
  [key: string]: unknown;
}

function UmkmCard({ umkm }: { umkm: UmkmData }) {
  const [liked, setLiked] = useState(false);
  const initials = umkm.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div className="bg-white rounded-2xl overflow-hidden ring-1 ring-gray-100 hover:shadow-lg transition-shadow duration-200 shrink-0 w-64 sm:w-auto flex flex-col">
      {/* Image area */}
      <div className="relative h-40 bg-gray-100 overflow-hidden">
        {umkm.banner_url ? (
          <img src={umkm.banner_url} alt={umkm.name} className="size-full object-cover" />
        ) : umkm.logo_url ? (
          <>
            <img src={umkm.logo_url} alt="" className="absolute inset-0 size-full object-cover scale-110 blur-lg opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 to-green-600/20" />
          </>
        ) : (
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
              UMKM
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
  if (data.products.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Produk Terbaru</h2>
            <p className="text-sm text-gray-500 mt-1">Produk unggulan dari UMKM Jawa Tengah</p>
          </div>
          <Link to="/marketplace" className="text-sm font-bold text-[#1a6b3c] hover:underline flex items-center gap-1 shrink-0">
            Marketplace <ChevronRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {data.products.slice(0, 8).map((p) => (
            <div key={p.id} className="group">
              <div className="aspect-[4/5] w-full rounded-2xl bg-gray-100 overflow-hidden ring-1 ring-gray-100 mb-2.5">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} loading="lazy" className="size-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="size-full flex items-center justify-center text-gray-300 text-xs">Tanpa Foto</div>
                )}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{p.name}</h3>
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
