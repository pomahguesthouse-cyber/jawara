import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PublicShell } from "@/components/PublicShell";
import { UmkmCard, type UmkmCardData } from "@/components/cards/UmkmCard";
import { ProductCard } from "@/components/cards/ProductCard";
import { formatTanggalSingkat } from "@/lib/format";

const homeQueryOptions = queryOptions({
  queryKey: ["home"],
  queryFn: async () => {
    const [umkm, products, events, articles, categories] = await Promise.all([
      supabase.from("umkm_profiles").select("id, slug, name, city, logo_url, rating, is_verified").eq("is_published", true).order("rating", { ascending: false }).limit(6),
      supabase.from("products").select("id, name, price, image_url, umkm:umkm_profiles!inner(name, slug)").eq("is_published", true).order("created_at", { ascending: false }).limit(8),
      supabase.from("events").select("id, slug, title, cover_url, event_type, location, city, start_at").order("start_at", { ascending: true }).limit(3),
      supabase.from("articles").select("id, slug, title, excerpt, cover_url, category, published_at").order("published_at", { ascending: false }).limit(3),
      supabase.from("categories").select("id, name, slug, icon").order("name"),
    ]);
    return {
      umkm: (umkm.data ?? []) as UmkmCardData[],
      products: products.data ?? [],
      events: events.data ?? [],
      articles: articles.data ?? [],
      categories: categories.data ?? [],
    };
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UMKM Jateng Hub — Temukan UMKM Terbaik Jawa Tengah" },
      { name: "description", content: "Direktori digital UMKM Jawa Tengah. Jelajahi ribuan UMKM, produk lokal, event, dan tips bisnis dengan dukungan AI." },
      { property: "og:title", content: "UMKM Jateng Hub" },
      { property: "og:description", content: "Direktori digital UMKM Jawa Tengah dengan dukungan AI." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQueryOptions),
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-sm text-destructive">Gagal memuat: {error.message}</div>
  ),
  component: HomePage,
});

function HomePage() {
  return (
    <PublicShell>
      <Hero />
      <CategoriesStrip />
      <PopularUmkm />
      <LatestProducts />
      <EventsSection />
      <ArticlesSection />
      <CtaBanner />
    </PublicShell>
  );
}

function Hero() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden pt-16 pb-20 bg-gradient-to-b from-primary-soft/40 to-background">
      <div className="absolute inset-0 -z-10 opacity-50" style={{ background: "radial-gradient(60% 50% at 50% 0%, oklch(0.94 0.045 158) 0%, transparent 70%)" }} />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center animate-fade-up">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-bold tracking-wide">
          <Sparkles className="size-3.5" />
          Pusat Digital UMKM Jawa Tengah
        </span>
        <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-balance">
          Temukan Produk UMKM Terbaik{" "}
          <span className="text-primary italic font-extrabold">Jawa Tengah</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          Direktori digital UMKM Jawa Tengah dengan teknologi AI untuk membantu pemasaran, penjualan, dan pertumbuhan ekonomi lokal.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/direktori", search: { q } as never });
          }}
          className="mt-8 mx-auto max-w-2xl flex items-center gap-2 bg-card p-2 rounded-2xl shadow-soft ring-1 ring-border"
        >
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari UMKM, produk, atau kota (Semarang, Solo, Magelang...)"
              className="w-full h-11 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition">
            Cari
          </button>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/direktori"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-card border border-border text-sm font-semibold hover:border-primary hover:text-primary transition"
          >
            Jelajah Direktori <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
          >
            Daftarkan UMKM Anda
          </Link>
        </div>
      </div>
    </section>
  );
}

function CategoriesStrip() {
  const { data } = useSuspenseQuery(homeQueryOptions);
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
          {data.categories.map((c: { id: string; name: string; slug: string; icon: string | null }) => (
            <Link
              key={c.id}
              to="/direktori"
              search={{ kategori: c.slug } as never}
              className="group flex flex-col items-center gap-2 px-4 py-2 rounded-2xl hover:bg-primary-soft transition"
            >
              <div className="size-12 rounded-2xl bg-primary-soft text-primary grid place-items-center text-xl group-hover:scale-110 transition">
                {c.icon ?? "•"}
              </div>
              <span className="text-xs font-semibold text-foreground">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PopularUmkm() {
  const { data } = useSuspenseQuery(homeQueryOptions);
  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">UMKM Populer</h2>
            <p className="text-sm text-muted-foreground mt-1">Wirausaha pilihan dengan rating tertinggi.</p>
          </div>
          <Link to="/direktori" className="text-sm font-bold text-primary hover:underline shrink-0">
            Lihat Semua →
          </Link>
        </div>
        {data.umkm.length === 0 ? (
          <EmptyState text="Belum ada UMKM terdaftar. Jadilah yang pertama!" actionLabel="Daftar UMKM" to="/auth" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.umkm.map((u) => <UmkmCard key={u.id} umkm={u} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function LatestProducts() {
  const { data } = useSuspenseQuery(homeQueryOptions);
  return (
    <section className="py-20 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Produk Terbaru</h2>
            <p className="text-sm text-muted-foreground mt-1">Produk unggulan dari UMKM Jawa Tengah.</p>
          </div>
          <Link to="/marketplace" className="text-sm font-bold text-primary hover:underline shrink-0">
            Marketplace →
          </Link>
        </div>
        {data.products.length === 0 ? (
          <EmptyState text="Belum ada produk. Tambahkan produk dari dashboard UMKM Anda." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
            {data.products.map((p: never) => <ProductCard key={(p as { id: string }).id} product={p} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function EventsSection() {
  const { data } = useSuspenseQuery(homeQueryOptions);
  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Event & Pameran</h2>
          <Link to="/event" className="text-sm font-bold text-primary hover:underline">Kalender →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.events.map((e: { id: string; title: string; cover_url: string | null; event_type: string; city: string | null; start_at: string }) => (
            <article key={e.id} className="group rounded-2xl overflow-hidden bg-card ring-1 ring-border hover:shadow-lift transition">
              <div className="aspect-video bg-muted overflow-hidden">
                {e.cover_url && <img src={e.cover_url} alt={e.title} loading="lazy" className="size-full object-cover group-hover:scale-105 transition" />}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary-soft text-primary">{e.event_type}</span>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">{formatTanggalSingkat(e.start_at)}</span>
                </div>
                <h3 className="font-bold text-lg group-hover:text-primary transition">{e.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{e.city}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArticlesSection() {
  const { data } = useSuspenseQuery(homeQueryOptions);
  return (
    <section className="py-20 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Edukasi & Tips Bisnis</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            Tingkatkan skala usaha Anda dengan artikel dari para ahli dan pelaku UMKM.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.articles.map((a: { id: string; title: string; excerpt: string | null; cover_url: string | null; category: string }) => (
            <article key={a.id} className="bg-card rounded-2xl overflow-hidden ring-1 ring-border hover:shadow-lift transition group">
              <div className="aspect-[16/10] bg-muted overflow-hidden">
                {a.cover_url && <img src={a.cover_url} alt={a.title} loading="lazy" className="size-full object-cover group-hover:scale-105 transition" />}
              </div>
              <div className="p-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{a.category}</span>
                <h3 className="font-bold mt-2 group-hover:text-primary transition">{a.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-primary text-primary-foreground p-10 sm:p-14 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 size-72 rounded-full bg-white/5 blur-2xl" />
          <div className="relative">
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-xl">
              Siap membawa UMKM Anda ke dunia digital?
            </h3>
            <p className="mt-3 text-primary-foreground/80 max-w-lg">
              Daftar gratis, kelola produk, dan manfaatkan AI untuk pemasaran dalam satu platform.
            </p>
            <Link
              to="/auth"
              className="mt-8 inline-flex items-center gap-2 bg-background text-primary px-6 py-3 rounded-full font-bold text-sm hover:bg-card transition"
            >
              Daftarkan UMKM Sekarang <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyState({ text, actionLabel, to }: { text: string; actionLabel?: string; to?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      {actionLabel && to && (
        <Link to={to} className="inline-block mt-4 text-sm font-bold text-primary hover:underline">
          {actionLabel} →
        </Link>
      )}
    </div>
  );
}
