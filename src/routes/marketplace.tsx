import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicShell } from "@/components/PublicShell";
import { ProductCard } from "@/components/cards/ProductCard";

const marketQuery = queryOptions({
  queryKey: ["marketplace"],
  queryFn: async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, price, image_url, promo_type, promo_text, category:categories(name), umkm:umkm_profiles!inner(name, slug)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(60);
    return data ?? [];
  },
});

export const Route = createFileRoute("/marketplace")({
  loader: ({ context }) => context.queryClient.ensureQueryData(marketQuery),
  head: () => ({
    meta: [
      { title: "Marketplace UMKM Jawa Tengah — JAWARA" },
      { name: "description", content: "Belanja produk lokal terbaik dari UMKM seluruh Jawa Tengah." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-10 text-destructive">{error.message}</div>,
  component: () => {
    const { data } = useSuspenseQuery(marketQuery);
    return (
      <PublicShell>
        <section className="bg-surface border-b border-border py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Marketplace</h1>
            <p className="text-muted-foreground mt-2">Belanja produk UMKM Jawa Tengah terbaru.</p>
          </div>
        </section>
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {data.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
                Belum ada produk yang tersedia.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
                {data.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={{
                      id: p.id,
                      name: p.name,
                      price: p.price,
                      image_url: p.image_url,
                      umkm: p.umkm,
                      category_name: p.category?.name ?? null,
                      promo_type: (p as any).promo_type,
                      promo_text: (p as any).promo_text,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </PublicShell>
    );
  },
});
