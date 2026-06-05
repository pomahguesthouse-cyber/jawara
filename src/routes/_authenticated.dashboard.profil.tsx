import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { slugify } from "@/lib/format";
import { Upload, Trash2, Image } from "lucide-react";

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
  tiktok: string;
  logo_url: string;
  banner_url: string;
  category_id: string;
}

// A banner_url is treated as a video when it ends with a known video
// extension OR contains an explicit video MIME indicator in the path
// (covers Supabase Storage URLs that include the extension before any
// transform query string).
export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v|ogv)$/.test(clean);
}

const empty: UmkmForm = {
  name: "", slug: "", description: "", city: "Semarang", district: "",
  address: "", whatsapp: "", email: "", website: "", instagram: "",
  facebook: "", tiktok: "", logo_url: "", banner_url: "", category_id: "",
};

function ProfilPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [form, setForm] = useState<UmkmForm>(empty);
  const [umkmId, setUmkmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Helper to compress/resize image to base64
  const compressImage = (file: File, maxW: number, maxH: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxW || height > maxH) {
            if (width > height) {
              height = Math.round((height * maxW) / width);
              width = maxW;
            } else {
              width = Math.round((width * maxH) / height);
              height = maxH;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // JPEG compression at 85% quality
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    // Logos are always images. Banners may be image OR video.
    if (type === 'logo' && !isImage) {
      toast.error('Logo harus berupa gambar');
      return;
    }
    if (type === 'banner' && !isImage && !isVideo) {
      toast.error('Banner harus berupa gambar atau video');
      return;
    }

    // Different size caps for video vs image (video is bigger by nature).
    const maxBytes = isVideo ? 30 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`File terlalu besar, maksimal ${isVideo ? '30MB' : '5MB'}`);
      return;
    }

    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingBanner;
    setUploading(true);

    try {
      const bucketName = 'umkm_assets';
      const fileExt = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

      // Image path: compress first, then upload the compressed JPEG.
      // Video path: upload the original file unchanged.
      let uploadFile: File;
      let finalUrl: string;

      if (isVideo) {
        uploadFile = file;
        finalUrl = ''; // will be filled by the public URL after upload; no base64 fallback for video
      } else {
        const maxW = type === 'logo' ? 300 : 1200;
        const maxH = type === 'logo' ? 300 : 400;
        const compressedBase64 = await compressImage(file, maxW, maxH);
        const response = await fetch(compressedBase64);
        const blob = await response.blob();
        uploadFile = new File([blob], `${type}.jpg`, { type: 'image/jpeg' });
        finalUrl = compressedBase64; // fallback if storage upload fails
      }

      try {
        await supabase.storage.createBucket(bucketName, { public: true });
      } catch (e) {
        // ignore bucket creation errors
      }

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, uploadFile, { upsert: true, contentType: uploadFile.type });

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(uploadData.path);
          finalUrl = publicUrl;
        } else if (isVideo) {
          // Videos cannot fall back to base64 — fail hard so the user knows.
          throw uploadError ?? new Error("Upload video gagal");
        } else {
          console.warn("Storage upload failed, fallback to base64 saving:", uploadError?.message);
        }
      } catch (uploadErr) {
        if (isVideo) {
          toast.error(`Gagal upload video: ${(uploadErr as Error)?.message ?? "unknown"}`);
          return;
        }
        console.warn("Storage upload error, using base64 direct DB storage instead:", uploadErr);
      }

      update(type === 'logo' ? 'logo_url' : 'banner_url', finalUrl);
      toast.success(`${type === 'logo' ? 'Logo' : (isVideo ? 'Video banner' : 'Banner')} berhasil diproses`);
    } catch (err) {
      toast.error('Gagal memproses gambar');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const { data: categories } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => (await supabase.from("categories").select("id, name").order("name")).data ?? [],
  });

  const { data: existing, isLoading } = useQuery({
    queryKey: ["my-umkm", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("umkm_profiles")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("Error fetching my-umkm:", error);
      }
      return data;
    },
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
        tiktok: existing.tiktok ?? "",
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
      let finalCategoryId = form.category_id || null;

      // Handle custom category insertion
      if (form.category_id === "custom") {
        const name = customCategoryName.trim();
        if (!name) {
          throw new Error("Nama kategori kustom wajib diisi");
        }
        const slug = slugify(name);

        // 1. Check if category already exists by slug
        const { data: existingCat, error: findError } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (findError) throw findError;

        if (existingCat) {
          finalCategoryId = existingCat.id;
        } else {
          // 2. Insert new custom category
          const { data: newCat, error: insertCatError } = await supabase
            .from("categories")
            .insert({ name, slug, icon: "🏷️" })
            .select("id")
            .single();

          if (insertCatError) throw insertCatError;
          finalCategoryId = newCat.id;
        }
      }

      const payload = {
        owner_id: user.id,
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description || null,
        city: form.city || 'Semarang',
        district: form.district || null,
        address: form.address || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        website: form.website || null,
        instagram: form.instagram || null,
        facebook: form.facebook || null,
        tiktok: form.tiktok || null,
        logo_url: form.logo_url || null,
        banner_url: form.banner_url || null,
        category_id: finalCategoryId,
      };

      const { error } = umkmId
        ? await supabase.from("umkm_profiles").update(payload).eq("id", umkmId)
        : await supabase.from("umkm_profiles").insert(payload);
      
      if (error) throw error;
      
      toast.success("Profil tersimpan");
      qc.invalidateQueries({ queryKey: ["my-umkm"] });
      qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
      qc.invalidateQueries({ queryKey: ["categories-all"] });
    } catch (err: any) {
      console.error("Gagal menyimpan profil:", err);
      const msg = err?.message || err?.details || (typeof err === 'string' ? err : "Gagal menyimpan");
      toast.error(msg);
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
              <select 
                value={form.category_id} 
                onChange={(e) => {
                  update("category_id", e.target.value);
                  if (e.target.value !== "custom") setCustomCategoryName("");
                }} 
                className={inputCls}
              >
                <option value="">Pilih kategori</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="custom">Lainnya (Isi sendiri...)</option>
              </select>
            </Field>
            {form.category_id === "custom" && (
              <Field label="Nama Kategori Baru" required full hint="kategori baru akan didaftarkan ke sistem">
                <input 
                  value={customCategoryName} 
                  onChange={(e) => setCustomCategoryName(e.target.value)} 
                  required 
                  placeholder="Contoh: Kerajinan Bambu, Konveksi Sablon, Jasa Jahit" 
                  className={inputCls} 
                />
              </Field>
            )}
            <Field label="Deskripsi Usaha" full>
              <textarea rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className={inputCls} />
            </Field>
          </Grid>
        </Card>

        <Card title="Identitas Visual">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Logo Upload Field */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                Logo Usaha
              </span>
              <div className="relative size-32 rounded-2xl border-2 border-dashed border-border hover:border-primary transition flex flex-col items-center justify-center overflow-hidden bg-muted group">
                {form.logo_url ? (
                  <>
                    <img src={form.logo_url} alt="Logo Preview" className="size-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <label className="p-2 bg-background rounded-lg cursor-pointer hover:bg-muted text-foreground transition flex items-center justify-center">
                        <Upload className="size-4" />
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} className="hidden" disabled={uploadingLogo} />
                      </label>
                      <button type="button" onClick={() => update('logo_url', '')} className="p-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="size-full flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:text-primary transition gap-2">
                    <Upload className="size-5" />
                    <span className="text-xs font-medium">Pilih Logo</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} className="hidden" disabled={uploadingLogo} />
                  </label>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center text-xs text-primary font-bold">
                    Mengunggah...
                  </div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">Format JPG/PNG, maks 5MB.</span>
            </div>

            {/* Banner Upload Field */}
            <div className="md:col-span-2 flex flex-col gap-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                Banner Usaha
              </span>
              <div className="relative h-32 w-full rounded-2xl border-2 border-dashed border-border hover:border-primary transition flex flex-col items-center justify-center overflow-hidden bg-muted group">
                {form.banner_url ? (
                  <>
                    {isVideoUrl(form.banner_url) ? (
                      <video
                        src={form.banner_url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="size-full object-cover"
                      />
                    ) : (
                      <img src={form.banner_url} alt="Banner Preview" className="size-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <label className="p-2 bg-background rounded-lg cursor-pointer hover:bg-muted text-foreground transition flex items-center gap-1 text-xs font-semibold">
                        <Upload className="size-4" /> Ganti Banner
                        <input type="file" accept="image/*,video/*" onChange={(e) => handleFileChange(e, 'banner')} className="hidden" disabled={uploadingBanner} />
                      </label>
                      <button type="button" onClick={() => update('banner_url', '')} className="p-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition flex items-center gap-1 text-xs font-semibold">
                        <Trash2 className="size-4" /> Hapus
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="size-full flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:text-primary transition gap-2">
                    <Image className="size-6" />
                    <span className="text-xs font-medium">Pilih Banner (gambar / video)</span>
                    <span className="text-[10px] text-muted-foreground">Gambar maks 5MB · Video maks 30MB</span>
                    <input type="file" accept="image/*,video/*" onChange={(e) => handleFileChange(e, 'banner')} className="hidden" disabled={uploadingBanner} />
                  </label>
                )}
                {uploadingBanner && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center text-xs text-primary font-bold">
                    Mengunggah...
                  </div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">Format JPG/PNG, maks 5MB.</span>
            </div>
          </div>
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
            <Field label="TikTok">
              <input value={form.tiktok} onChange={(e) => update("tiktok", e.target.value)} className={inputCls} placeholder="@namaakun" />
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
