import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, Eye, MessageCircle, Sparkles, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Overview,
});

function Overview() {
  const { user } = Route.useRouteContext();

  const { data } = useQuery({
    queryKey: ["dashboard-overview", user.id],
    queryFn: async () => {
      const { data: umkm } = await supabase
        .from("umkm_profiles")
        .select("id, name, slug, is_published")
        .eq("owner_id", user.id)
        .maybeSingle();
      let productCount = 0;
      if (umkm) {
        const { count } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("umkm_id", umkm.id);
        productCount = count ?? 0;
      }
      return { umkm, productCount };
    },
  });

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">Selamat datang kembali 👋</p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">Dashboard UMKM : Pomah Guesthouse</h1>
      </header>

      {!data?.umkm && (
        <div className="rounded-2xl bg-primary text-primary-foreground p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start gap-4 justify-between">
          <div>
            <h3 className="text-xl font-extrabold">Lengkapi profil usaha Anda dulu</h3>
            <p className="text-sm opacity-80 mt-1">Buat profil UMKM agar bisa menambahkan produk dan tampil di direktori publik.</p>
          </div>
          <Link to="/dashboard/profil" className="bg-background text-primary px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap">
            Buat Profil UMKM
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Stat label="Total Produk" value={data?.productCount ?? 0} icon={Package} />
        <Stat label="Pengunjung" value="—" icon={Eye} hint="Segera" />
        <Stat label="Chat AI" value="—" icon={MessageCircle} hint="Segera" />
        <Stat label="Leads WA" value="—" icon={Sparkles} hint="Segera" />
      </div>

      {data?.umkm && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Link to="/dashboard/produk" className="rounded-2xl bg-card p-6 ring-1 ring-border hover:shadow-lift transition">
            <Package className="size-6 text-primary mb-3" />
            <h3 className="font-bold">Kelola Produk</h3>
            <p className="text-sm text-muted-foreground mt-1">Tambah, ubah, atau hapus produk Anda.</p>
          </Link>
          <Link to="/umkm/$slug" params={{ slug: data.umkm.slug }} className="rounded-2xl bg-card p-6 ring-1 ring-border hover:shadow-lift transition">
            <Eye className="size-6 text-primary mb-3" />
            <h3 className="font-bold">Lihat Profil Publik</h3>
            <p className="text-sm text-muted-foreground mt-1">Lihat tampilan UMKM Anda dari sisi pengunjung.</p>
          </Link>
        </div>
      )}

      {data?.umkm && (
        <div className="mt-10 rounded-2xl bg-card ring-1 ring-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">{data.umkm.name}</h3>
            <Link to="/dashboard/produk" className="text-xs font-bold text-primary inline-flex items-center gap-1">
              <Plus className="size-3" /> Tambah Produk
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Profil aktif. Slug publik:{" "}
            <Link to="/umkm/$slug" params={{ slug: data.umkm.slug }} className="text-primary font-mono">/umkm/{data.umkm.slug}</Link>
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, hint }: { label: string; value: string | number; icon: React.ElementType; hint?: string }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-5">
      <Icon className="size-5 text-primary mb-3" />
      <p className="text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}{hint && <span className="ml-1 text-[10px] uppercase font-bold text-primary/70">• {hint}</span>}</p>
    </div>
  );
}
