import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicShell } from "@/components/PublicShell";
import { formatTanggal } from "@/lib/format";
import { MapPin, Calendar } from "lucide-react";

const eventsQuery = queryOptions({
  queryKey: ["events-all"],
  queryFn: async () => {
    const { data } = await supabase.from("events").select("*").order("start_at", { ascending: true });
    return data ?? [];
  },
});

export const Route = createFileRoute("/event")({
  loader: ({ context }) => context.queryClient.ensureQueryData(eventsQuery),
  head: () => ({
    meta: [
      { title: "Event UMKM Jawa Tengah — Jateng Hub" },
      { name: "description", content: "Pameran, bazaar, dan pelatihan UMKM Jawa Tengah." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-10 text-destructive">{error.message}</div>,
  component: () => {
    const { data } = useSuspenseQuery(eventsQuery);
    return (
      <PublicShell>
        <section className="bg-surface border-b border-border py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Event UMKM</h1>
            <p className="text-muted-foreground mt-2">Pameran, bazaar, workshop, dan seminar UMKM Jawa Tengah.</p>
          </div>
        </section>
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((e) => (
              <article key={e.id} className="bg-card rounded-2xl ring-1 ring-border overflow-hidden hover:shadow-lift transition">
                {e.cover_url && <img src={e.cover_url} alt={e.title} className="aspect-video w-full object-cover" loading="lazy" />}
                <div className="p-5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary-soft text-primary">{e.event_type}</span>
                  <h3 className="font-bold text-lg mt-2">{e.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
                  <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5"><Calendar className="size-3.5" />{formatTanggal(e.start_at)}</p>
                    <p className="flex items-center gap-1.5"><MapPin className="size-3.5" />{e.location}, {e.city}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </PublicShell>
    );
  },
});
