import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PublicShell } from "@/components/PublicShell";
import { UmkmCard, type UmkmCardData } from "@/components/cards/UmkmCard";
import { Search } from "lucide-react";

const searchSchema = z.object({
  q: z.string().optional().default(""),
  kota: z.string().optional().default(""),
  kategori: z.string().optional().default(""),
});

type Params = z.infer<typeof searchSchema>;

const directoryQueryOptions = (p: Params) =>
  queryOptions({
    queryKey: ["directory", p],
    queryFn: async () => {
      let query = supabase
        .from("umkm_profiles")
        .select("id, slug, name, city, logo_url, rating, is_verified, category:categories(slug, name)")
        .eq("is_published", true);
      if (p.q) query = query.ilike("name", `%${p.q}%`);
      if (p.kota) query = query.eq("city", p.kota);
      const { data: umkm } = await query.order("rating", { ascending: false }).limit(48);
      let filtered = (umkm ?? []) as (UmkmCardData & { category?: { slug: string } | null })[];
      if (p.kategori) filtered = filtered.filter((u) => u.category?.slug === p.kategori);
      const { data: categories } = await supabase.from("categories").select("id, name, slug").order("name");
      const cities = Array.from(new Set((umkm ?? []).map((u) => u.city))).sort();
      return { umkm: filtered, categories: categories ?? [], cities };
    },
  });

export const Route = createFileRoute("/direktori")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(directoryQueryOptions(deps)),
  head: () => ({
    meta: [
      { title: "Direktori UMKM Jawa Tengah — Jateng Hub" },
      { name: "description", content: "Jelajahi ribuan UMKM Jawa Tengah berdasarkan kota, kategori, dan rating." },
      { property: "og:title", content: "Direktori UMKM Jawa Tengah" },
      { property: "og:description", content: "Cari UMKM berkualitas di setiap kabupaten/kota Jawa Tengah." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-10 text-destructive">{error.message}</div>,
  component: DirektoriPage,
});

function DirektoriPage() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data } = useSuspenseQuery(directoryQueryOptions(params));

  return (
    <PublicShell>
      <section className="bg-surface border-b border-border py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Direktori UMKM</h1>
          <p className="text-muted-foreground mt-2">Temukan UMKM terbaik di Jawa Tengah.</p>

          <form
            onSubmit={(e) => { e.preventDefault(); }}
            className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-card p-3 rounded-2xl ring-1 ring-border"
          >
            <div className="sm:col-span-2 flex items-center gap-2 px-3 bg-background rounded-xl ring-1 ring-border">
              <Search className="size-4 text-muted-foreground" />
              <input
                defaultValue={params.q}
                onChange={(e) => navigate({ search: { ...params, q: e.target.value } })}
                placeholder="Cari nama UMKM..."
                className="w-full h-10 bg-transparent text-sm focus:outline-none"
              />
            </div>
            <select
              value={params.kota}
              onChange={(e) => navigate({ search: { ...params, kota: e.target.value } })}
              className="h-10 px-3 rounded-xl bg-background ring-1 ring-border text-sm"
            >
              <option value="">Semua Kota</option>
              {data.cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={params.kategori}
              onChange={(e) => navigate({ search: { ...params, kategori: e.target.value } })}
              className="h-10 px-3 rounded-xl bg-background ring-1 ring-border text-sm"
            >
              <option value="">Semua Kategori</option>
              {data.categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </form>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {data.umkm.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
              <p className="text-muted-foreground">Tidak ada UMKM yang cocok dengan filter.</p>
              <Link to="/auth" className="inline-block mt-4 text-sm font-bold text-primary">
                Daftarkan UMKM Anda →
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">{data.umkm.length} UMKM ditemukan</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.umkm.map((u) => <UmkmCard key={u.id} umkm={u} />)}
              </div>
            </>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
