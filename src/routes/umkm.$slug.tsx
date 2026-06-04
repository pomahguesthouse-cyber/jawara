import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicShell } from "@/components/PublicShell";
import { ProductCard } from "@/components/cards/ProductCard";
import { MapPin, Phone, Globe, Star, BadgeCheck, Instagram, Facebook } from "lucide-react";

const umkmQuery = (slug: string) =>
  queryOptions({
    queryKey: ["umkm", slug],
    queryFn: async () => {
      const { data: umkm, error } = await supabase
        .from("umkm_profiles")
        .select("*, category:categories(name, slug)")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      if (!umkm) throw notFound();
      const { data: products } = await supabase
        .from("products")
        .select("id, name, price, image_url, category:categories(name)")
        .eq("umkm_id", umkm.id)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      return { umkm, products: products ?? [] };
    },
  });

export const Route = createFileRoute("/umkm/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(umkmQuery(params.slug)),
  head: ({ params }) => ({
    meta: [
      { title: `UMKM ${params.slug} — Jateng Hub` },
      { name: "description", content: `Profil UMKM dan katalog produk di Jateng Hub.` },
    ],
  }),
  notFoundComponent: () => (
    <PublicShell>
      <div className="p-20 text-center">
        <h1 className="text-2xl font-bold">UMKM tidak ditemukan</h1>
        <Link to="/direktori" className="text-primary mt-4 inline-block">Kembali ke direktori</Link>
      </div>
    </PublicShell>
  ),
  errorComponent: ({ error }) => <div className="p-10 text-destructive">{error.message}</div>,
  component: DetailUmkm,
});

function DetailUmkm() {
  const { slug } = Route.useParams();
  const { data: { umkm, products } } = useSuspenseQuery(umkmQuery(slug));

  return (
    <PublicShell>
      {/* Banner */}
      <div className="h-48 sm:h-64 bg-gradient-to-br from-primary-soft to-primary/20 relative">
        {umkm.banner_url && <img src={umkm.banner_url} alt="" className="size-full object-cover" />}
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 -mt-16 relative">
        <div className="bg-card rounded-3xl ring-1 ring-border p-6 sm:p-8 shadow-soft">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="size-24 sm:size-28 rounded-2xl bg-primary-soft text-primary grid place-items-center font-extrabold text-3xl ring-4 ring-card shadow-soft overflow-hidden shrink-0 -mt-16 sm:-mt-20">
              {umkm.logo_url ? (
                <img src={umkm.logo_url} alt={umkm.name} className="size-full object-cover" />
              ) : (
                umkm.name.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2 flex-wrap">
                    {umkm.name}
                    {umkm.is_verified && <BadgeCheck className="size-5 text-primary" />}
                  </h1>
                  <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
                    <MapPin className="size-4" /> {umkm.city}{umkm.district ? `, ${umkm.district}` : ""}
                    {umkm.category && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="font-medium">{umkm.category.name}</span>
                      </>
                    )}
                  </p>
                </div>
                {umkm.rating && (
                  <span className="inline-flex items-center gap-1 text-warm-foreground bg-warm/15 px-3 py-1.5 rounded-full font-bold text-sm">
                    <Star className="size-4 fill-warm text-warm" />
                    {Number(umkm.rating).toFixed(1)}
                  </span>
                )}
              </div>
              {umkm.description && <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{umkm.description}</p>}

              <div className="mt-5 flex flex-wrap gap-2">
                {umkm.whatsapp && (
                  <a href={`https://wa.me/${umkm.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
                    <Phone className="size-4" /> WhatsApp
                  </a>
                )}
                {umkm.website && (
                  <a href={umkm.website} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-card ring-1 ring-border text-sm font-semibold hover:border-primary">
                    <Globe className="size-4" /> Website
                  </a>
                )}
                {umkm.instagram && (
                  <a href={`https://instagram.com/${umkm.instagram.replace("@", "")}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-card ring-1 ring-border text-sm font-semibold hover:border-primary">
                    <Instagram className="size-4" />
                  </a>
                )}
                {umkm.facebook && (
                  <a href={umkm.facebook} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-card ring-1 ring-border text-sm font-semibold hover:border-primary">
                    <Facebook className="size-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <section className="mt-12 pb-20">
          <h2 className="text-2xl font-extrabold tracking-tight mb-6">Katalog Produk ({products.length})</h2>
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">UMKM ini belum memiliki produk.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={{
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    image_url: p.image_url,
                    category_name: p.category?.name ?? null,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </PublicShell>
  );
}
