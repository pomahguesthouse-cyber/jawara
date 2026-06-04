import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/profil")({
  component: ProfilPage,
});

interface UmkmForm {
  name: string;
  slug: string;
  description: string;
  city: string;
  district: string;
  address: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  logo_url: string;
  banner_url: string;
  category_id: string;
}

const empty: UmkmForm = {
  name: "", slug: "", description: "", city: "Semarang", district: "",
  address: "", whatsapp: "", email: "", website: "", instagram: "",
  facebook: "", logo_url: "", banner_url: "", category_id: "",
};

function ProfilPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [form, setForm] = useState<UmkmForm>(empty);
  const [umkmId, setUmkmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => (await supabase.from("categories").select("id, name").order("name")).data ?? [],
  });

  const { data: existing, isLoading } = useQuery({
    queryKey: ["my-umkm", user.id],
    queryFn: async () =>
      (await supabase.from("umkm_profiles").select("*").eq("owner_id", user.id).maybeSingle()).data,
  });

  useEffect(() => {
    if (existing) {
      setUmkmId(existing.id);
      setForm({
        name: existing.name ?? "",
        slug: existing.slug ?? "",
        description: existing.description ?? "",
        city: existing.city ?? "Semarang",
        district: existing.district ?? "",
        address: existing.address ?? "",
        whatsapp: existing.whatsapp ?? "",
        email: existing.email ?? "",
        website: existing.website ?? "",
        instagram: existing.instagram ?? "",
        facebook: existing.facebook ?? "",
        logo_url: existing.logo_url ?? "",
        banner_url: existing.banner_url ?? "",
        category_id: existing.category_id ?? "",
      });
    }
  }, [existing]);

  function update<K extends keyof UmkmForm>(k: K, v: UmkmForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === "name" && !umkmId) setForm((f) => ({ ...f, slug: slugify(v as string) }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        owner_id: user.id,
        ...form,
        slug: form.slug || slugify(form.name),
        category_id: form.category_id || null,
      };
      const { error } = umkmId
        ? await supabase.from("umkm_profiles").update(payload).eq("id", umkmId)
        : await supabase.from("umkm_profiles").insert(payload);
      if (error) throw error;
      toast.success("Profil tersimpan");
      qc.invalidateQueries({ queryKey: ["my-umkm"] });
      qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <div className="p-10 text-muted-foreground">Memuat...</div>;

  return (
    <div className="p-6 lg:p-10 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Profil Usaha</h1>
        <p className="text-sm text-muted-foreground mt-1">Informasi ini akan ditampilkan di profil publik UMKM Anda.</p>
      </header>

      <form onSubmit={save} className="space-y-6">
        <Card title="Informasi Dasar">
          <Grid>
            <Field label="Nama Usaha" required>
              <input value={form.name} onChange={(e) => update("name", e.target.value)} required className={inputCls} />
            </Field>
            <Field label="Slug URL" hint="huruf kecil dan tanda hubung">
              <input value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} required className={inputCls} />
            </Field>
            <Field label="Kategori" full>
              <select value={form.category_id} onChange={(e) => update("category_id", e.target.value)} className={inputCls}>
                <option value="">Pilih kategori</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Deskripsi Usaha" full>
              <textarea rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className={inputCls} />
            </Field>
          </Grid>
        </Card>

        <Card title="Identitas Visual">
          <Grid>
            <Field label="URL Logo" hint="link gambar JPG/PNG">
              <input value={form.logo_url} onChange={(e) => update("logo_url", e.target.value)} className={inputCls} />
            </Field>
            <Field label="URL Banner">
              <input value={form.banner_url} onChange={(e) => update("banner_url", e.target.value)} className={inputCls} />
            </Field>
          </Grid>
        </Card>

        <Card title="Lokasi & Kontak">
          <Grid>
            <Field label="Kota/Kabupaten" required>
              <input value={form.city} onChange={(e) => update("city", e.target.value)} required className={inputCls} />
            </Field>
            <Field label="Kecamatan">
              <input value={form.district} onChange={(e) => update("district", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Alamat Lengkap" full>
              <input value={form.address} onChange={(e) => update("address", e.target.value)} className={inputCls} />
            </Field>
            <Field label="WhatsApp" hint="dengan kode negara, contoh 6281234...">
              <input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Website">
              <input value={form.website} onChange={(e) => update("website", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Instagram">
              <input value={form.instagram} onChange={(e) => update("instagram", e.target.value)} className={inputCls} placeholder="@namaakun" />
            </Field>
            <Field label="Facebook URL" full>
              <input value={form.facebook} onChange={(e) => update("facebook", e.target.value)} className={inputCls} />
            </Field>
          </Grid>
        </Card>

        <div className="flex justify-end">
          <button disabled={saving} className="h-11 px-8 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50">
            {saving ? "Menyimpan..." : umkmId ? "Simpan Perubahan" : "Buat Profil"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full h-10 px-3 rounded-xl bg-background ring-1 ring-border text-sm focus:ring-2 focus:ring-primary outline-none";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-2xl ring-1 ring-border p-6">
      <h3 className="font-bold mb-4">{title}</h3>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}
function Field({ label, hint, required, full, children }: { label: string; hint?: string; required?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-semibold text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
        {hint && <span className="ml-1 font-normal text-muted-foreground">— {hint}</span>}
      </span>
      {children}
    </label>
  );
}
