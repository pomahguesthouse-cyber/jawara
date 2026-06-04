import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/format";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, X, Upload, ImagePlus, ChevronLeft, ChevronRight, Loader2, Star,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/produk")({
  component: ProdukPage,
});

interface ProductRow {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  images: string[];
  description: string | null;
  category_id: string | null;
  is_published: boolean;
}

// ─── Helper: compress image to JPEG data-url ──────────────────────────────────
async function compressImage(file: File, maxW = 1200, maxH = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxW || height > maxH) {
        const scale = Math.min(maxW / width, maxH / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── Helper: upload one file to Supabase Storage, return public URL ───────────
async function uploadToStorage(userId: string, file: File): Promise<string> {
  const bucket = "umkm_assets";
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  // Ensure bucket exists (ignore error if already exists)
  try { await supabase.storage.createBucket(bucket, { public: true }); } catch (_) {}

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl;
}

// ─── ProdukPage ───────────────────────────────────────────────────────────────
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
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl">
      <header className="mb-6 sm:mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Produk</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} produk terdaftar.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 sm:px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Tambah </span>Produk
        </button>
      </header>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
          <ImagePlus className="size-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">Belum ada produk. Klik "Tambah Produk" untuk memulai.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {(products as ProductRow[]).map((p) => {
            const allImages: string[] = Array.isArray(p.images) && p.images.length > 0
              ? p.images
              : p.image_url ? [p.image_url] : [];
            return (
              <div key={p.id} className="bg-card ring-1 ring-border rounded-2xl overflow-hidden">
                {/* Photo carousel preview */}
                <ProductPhotoCarousel images={allImages} name={p.name} />
                <div className="p-3 sm:p-4">
                  <h3 className="font-bold text-sm line-clamp-1">{p.name}</h3>
                  <p className="text-primary font-bold text-xs mt-0.5">{formatRupiah(p.price)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Stok: {p.stock} · {allImages.length} foto</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => { setEditing(p); setShowForm(true); }}
                      className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-semibold py-1.5 rounded-lg bg-muted hover:bg-primary-soft hover:text-primary transition"
                    >
                      <Pencil className="size-3" /> Ubah
                    </button>
                    <button
                      onClick={() => confirm("Hapus produk ini?") && del.mutate(p.id)}
                      className="inline-flex items-center justify-center text-xs font-semibold py-1.5 px-3 rounded-lg bg-muted hover:bg-destructive/10 hover:text-destructive transition"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <ProductForm
          userId={user.id}
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

// ─── Small carousel for product card preview ──────────────────────────────────
function ProductPhotoCarousel({ images, name }: { images: string[]; name: string }) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-muted flex items-center justify-center">
        <ImagePlus className="size-8 text-muted-foreground/40" />
      </div>
    );
  }
  return (
    <div className="relative aspect-[4/3] bg-muted overflow-hidden group">
      <img src={images[idx]} alt={name} className="size-full object-cover" />
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); }}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
          ><ChevronLeft className="size-4" /></button>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
          ><ChevronRight className="size-4" /></button>
          <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
            {images.map((_, i) => (
              <div key={i} className={`size-1.5 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── ProductForm modal ────────────────────────────────────────────────────────
function ProductForm({
  userId,
  umkmId,
  categories,
  initial,
  onClose,
  onSaved,
}: {
  userId: string;
  umkmId: string;
  categories: { id: string; name: string }[];
  initial: ProductRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName]   = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [stock, setStock] = useState(initial?.stock?.toString() ?? "0");
  const [desc, setDesc]   = useState(initial?.description ?? "");
  const [catId, setCatId] = useState(initial?.category_id ?? "");

  // Existing images (URLs already saved)
  const initImages: string[] = Array.isArray(initial?.images) && (initial?.images?.length ?? 0) > 0
    ? (initial!.images as string[])
    : initial?.image_url ? [initial.image_url] : [];

  const [savedImages, setSavedImages] = useState<string[]>(initImages);
  // New local files picked by user (not yet uploaded)
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle file selection (from input or drop)
  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 10);
    if (!arr.length) return;
    setPendingFiles((prev) => [...prev, ...arr]);
    arr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPendingPreviews((prev) => [...prev, e.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeSaved = (i: number) => setSavedImages((p) => p.filter((_, idx) => idx !== i));
  const removePending = (i: number) => {
    setPendingFiles((p) => p.filter((_, idx) => idx !== i));
    setPendingPreviews((p) => p.filter((_, idx) => idx !== i));
  };
  const setPrimary = (i: number) => {
    setSavedImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(i, 1);
      return [item, ...next];
    });
  };

  // Drag-and-drop handlers
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Upload pending files
      const uploadedUrls: string[] = [];
      for (let i = 0; i < pendingFiles.length; i++) {
        setUploadProgress(`Mengupload foto ${i + 1} dari ${pendingFiles.length}...`);
        try {
          const compressed = await compressImage(pendingFiles[i]);
          const response = await fetch(compressed);
          const blob = await response.blob();
          const uploadFile = new File([blob], `product_${Date.now()}.jpg`, { type: "image/jpeg" });
          const url = await uploadToStorage(userId, uploadFile);
          uploadedUrls.push(url);
        } catch (uploadErr) {
          console.warn("Upload failed for file", i, uploadErr);
          // Fallback: use compressed base64
          const compressed = await compressImage(pendingFiles[i], 800, 800, 0.75);
          uploadedUrls.push(compressed);
        }
      }
      setUploadProgress("");

      const allImages = [...savedImages, ...uploadedUrls];
      const primaryUrl = allImages[0] ?? null;

      const payload = {
        umkm_id: umkmId,
        name,
        price: parseFloat(price) || 0,
        stock: parseInt(stock) || 0,
        image_url: primaryUrl,
        images: allImages,
        description: desc || null,
        category_id: catId || null,
      };

      const { error } = initial
        ? await supabase.from("products").update(payload).eq("id", initial.id)
        : await supabase.from("products").insert(payload);

      if (error) throw error;
      toast.success(initial ? "Produk diperbarui" : "Produk ditambahkan");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  const totalPhotos = savedImages.length + pendingFiles.length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-lift max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
          <h3 className="text-lg font-extrabold">{initial ? "Ubah Produk" : "Tambah Produk"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition"><X className="size-5" /></button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <form id="product-form" onSubmit={submit} className="space-y-4">

            {/* ── Photo Uploader ── */}
            <div>
              <label className="text-xs font-semibold block mb-2">
                Foto Produk
                <span className="ml-1.5 text-muted-foreground font-normal">({totalPhotos} foto — pertama jadi cover)</span>
              </label>

              {/* Drop zone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors
                  ${dragging ? "border-primary bg-primary-soft" : "border-border hover:border-primary hover:bg-primary-soft/30"}
                `}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
                <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-semibold text-foreground">Klik atau seret foto ke sini</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP · Bisa pilih banyak foto sekaligus</p>
              </div>

              {/* Preview grid */}
              {totalPhotos > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {/* Already saved photos */}
                  {savedImages.map((url, i) => (
                    <div key={`saved-${i}`} className="relative group aspect-square rounded-xl overflow-hidden ring-2 ring-border">
                      <img src={url} alt="" className="size-full object-cover" />
                      {i === 0 && (
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-full p-0.5">
                          <Star className="size-2.5" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                        {i !== 0 && (
                          <button
                            type="button"
                            title="Jadikan cover"
                            onClick={() => setPrimary(i)}
                            className="bg-white/90 text-foreground rounded-full p-1"
                          ><Star className="size-3" /></button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeSaved(i)}
                          className="bg-white/90 text-destructive rounded-full p-1"
                        ><X className="size-3" /></button>
                      </div>
                    </div>
                  ))}

                  {/* Pending (not yet uploaded) */}
                  {pendingPreviews.map((src, i) => (
                    <div key={`pending-${i}`} className="relative group aspect-square rounded-xl overflow-hidden ring-2 ring-primary/40">
                      <img src={src} alt="" className="size-full object-cover" />
                      <div className="absolute top-1 right-1 bg-primary/80 text-primary-foreground rounded-full p-0.5">
                        <Upload className="size-2.5" />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => removePending(i)}
                          className="bg-white/90 text-destructive rounded-full p-1"
                        ><X className="size-3" /></button>
                      </div>
                    </div>
                  ))}

                  {/* Add more button */}
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary-soft/30 transition flex flex-col items-center justify-center gap-1 text-muted-foreground"
                  >
                    <ImagePlus className="size-5" />
                    <span className="text-[10px] font-semibold">Tambah</span>
                  </button>
                </div>
              )}

              {/* Upload progress */}
              {uploadProgress && (
                <div className="mt-2 flex items-center gap-2 text-xs text-primary font-medium">
                  <Loader2 className="size-3 animate-spin" />
                  {uploadProgress}
                </div>
              )}
            </div>

            {/* ── Fields ── */}
            <Field label="Nama Produk" required>
              <input value={name} onChange={(e) => setName(e.target.value)} required className={inp} placeholder="Contoh: Batik Sogan Klasik" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Harga (Rp)" required>
                <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} required className={inp} placeholder="0" />
              </Field>
              <Field label="Stok">
                <input type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} className={inp} placeholder="0" />
              </Field>
            </div>

            <Field label="Kategori">
              <select value={catId} onChange={(e) => setCatId(e.target.value)} className={inp}>
                <option value="">Pilih kategori</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>

            <Field label="Deskripsi">
              <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} className={`${inp} h-auto py-2.5`} placeholder="Jelaskan keunggulan produk Anda..." />
            </Field>
          </form>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-2 px-6 py-4 border-t border-border shrink-0">
          <button type="button" onClick={onClose} className="flex-1 h-11 rounded-xl bg-muted text-sm font-bold hover:bg-muted/80 transition">
            Batal
          </button>
          <button
            form="product-form"
            type="submit"
            disabled={saving || !name || !price}
            className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 hover:opacity-90 transition inline-flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? (uploadProgress ? "Mengupload..." : "Menyimpan...") : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full h-10 px-3 rounded-xl bg-background ring-1 ring-border text-sm focus:ring-2 focus:ring-primary outline-none";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}
