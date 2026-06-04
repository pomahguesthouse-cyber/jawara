import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicShell } from "@/components/PublicShell";
import { formatTanggal } from "@/lib/format";

const articlesQuery = queryOptions({
  queryKey: ["articles-all"],
  queryFn: async () => {
    const { data } = await supabase.from("articles").select("*").order("published_at", { ascending: false });
    return data ?? [];
  },
});

export const Route = createFileRoute("/artikel")({
  loader: ({ context }) => context.queryClient.ensureQueryData(articlesQuery),
  head: () => ({
    meta: [
      { title: "Artikel & Edukasi UMKM — JAWARA" },
      { name: "description", content: "Tips, panduan, dan edukasi bisnis untuk UMKM Jawa Tengah." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-10 text-destructive">{error.message}</div>,
  component: () => {
    const { data } = useSuspenseQuery(articlesQuery);
    return (
      <PublicShell>
        <section className="bg-surface border-b border-border py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Edukasi & Bisnis</h1>
            <p className="text-muted-foreground mt-2">Panduan, tips, dan strategi untuk pertumbuhan UMKM.</p>
          </div>
        </section>
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((a) => (
              <article key={a.id} className="bg-card rounded-2xl ring-1 ring-border overflow-hidden hover:shadow-lift transition">
                {a.cover_url && <img src={a.cover_url} alt={a.title} className="aspect-[16/10] w-full object-cover" loading="lazy" />}
                <div className="p-5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{a.category}</span>
                  <h3 className="font-bold mt-2">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{a.excerpt}</p>
                  <p className="text-xs text-muted-foreground mt-4">{formatTanggal(a.published_at)} • {a.author}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </PublicShell>
    );
  },
});
