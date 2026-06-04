import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/produk")({
  component: ProdukPage,
});

interface ProductRow {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  description: string | null;
  category_id: string | null;
}

function ProdukPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: umkm } = useQuery({
    queryKey: ["my-umkm", user.id],
    queryFn: async () =>
      (await supabase.from("umkm_profiles").select("id, name").eq("owner_id", user.id).maybeSingle()).data,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["my-products", umkm?.id],
    enabled: !!umkm,
    queryFn: async () =>
      (await supabase.from("products").select("*").eq("umkm_id", umkm!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => (await supabase.from("categories").select("id, name").order("name")).data ?? [],
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produk dihapus");
      qc.invalidateQueries({ queryKey: ["my-products"] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (!umkm) {
    return (
      <div className="p-6 lg:p-10 max-w-3xl">
        <div className="bg-card ring-1 ring-border rounded-2xl p-10 text-center">
          <h2 className="text-xl font-bold">Buat profil UMKM dulu</h2>
          <p className="text-sm text-muted-foreground mt-2">Anda perlu membuat profil usaha sebelum bisa menambahkan produk.</p>
          <Link to="/dashboard/profil" className="inline-block mt-4 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold">
            Buat Profil UMKM
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <header className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Produk</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} produk terdaftar.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90"
        >
          <Plus className="size-4" /> Tambah Produk
        </button>
      </header>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
          <p className="text-muted-foreground">Belum ada produk. Klik "Tambah Produk" untuk memulai.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-card ring-1 ring-border rounded-2xl overflow-hidden">
              <div className="aspect-video bg-muted overflow-hidden">
                {p.image_url && <img src={p.image_url} alt={p.name} className="size-full object-cover" />}
              </div>
              <div className="p-4">
                <h3 className="font-bold line-clamp-1">{p.name}</h3>
                <p className="text-primary font-bold text-sm mt-1">{formatRupiah(p.price)}</p>
                <p className="text-xs text-muted-foreground mt-1">Stok: {p.stock}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { setEditing(p); setShowForm(true); }} className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-semibold py-1.5 rounded-lg bg-muted hover:bg-primary-soft hover:text-primary">
                    <Pencil className="size-3" /> Ubah
                  </button>
                  <button onClick={() => confirm("Hapus produk?") && del.mutate(p.id)} className="inline-flex items-center justify-center text-xs font-semibold py-1.5 px-3 rounded-lg bg-muted hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProductForm
          umkmId={umkm.id}
          categories={categories}
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            qc.invalidateQueries({ queryKey: ["my-products"] });
            qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
          }}
        />
      )}
    </div>
  );
}

function ProductForm({
  umkmId,
  categories,
  initial,
  onClose,
  onSaved,
}: {
  umkmId: string;
  categories: { id: string; name: string }[];
  initial: ProductRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [stock, setStock] = useState(initial?.stock?.toString() ?? "0");
  const [image, setImage] = useState(initial?.image_url ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [catId, setCatId] = useState(initial?.category_id ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        umkm_id: umkmId,
        name,
        price: parseFloat(price) || 0,
        stock: parseInt(stock) || 0,
        image_url: image || null,
        description: desc || null,
        category_id: catId || null,
      };
      const { error } = initial
        ? await supabase.from("products").update(payload).eq("id", initial.id)
        : await supabase.from("products").insert(payload);
      if (error) throw error;
      toast.success(initial ? "Produk diperbarui" : "Produk ditambahkan");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-extrabold">{initial ? "Ubah Produk" : "Tambah Produk"}</h3>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Nama Produk" required>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inp} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Harga (Rp)" required>
              <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} required className={inp} />
            </Field>
            <Field label="Stok">
              <input type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} className={inp} />
            </Field>
          </div>
          <Field label="Kategori">
            <select value={catId} onChange={(e) => setCatId(e.target.value)} className={inp}>
              <option value="">Pilih kategori</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="URL Foto Produk">
            <input value={image} onChange={(e) => setImage(e.target.value)} className={inp} placeholder="https://..." />
          </Field>
          <Field label="Deskripsi">
            <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} className={inp} />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-11 rounded-xl bg-muted text-sm font-bold">Batal</button>
            <button disabled={saving} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inp = "w-full h-10 px-3 rounded-xl bg-background ring-1 ring-border text-sm focus:ring-2 focus:ring-primary outline-none";
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold">{label} {required && <span className="text-destructive">*</span>}</span>
      {children}
    </label>
  );
}
