import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/format";
import {
  Shield, Users, Store, Package, Layers, CheckCircle2, XCircle,
  Trash2, Plus, Star, MapPin, ChevronRight, PlusCircle, AlertCircle, Loader2,
  Pencil, X
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  // Auth + role check lives in the parent /admin route; this file just
  // owns the dashboard content.
  component: AdminDashboard,
});

type TabType = "umkm" | "products" | "categories";

function AdminDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("umkm");

  const [editCatName, setEditCatName] = useState("");
  const [editCatSlug, setEditCatSlug] = useState("");
  const [editCatIcon, setEditCatIcon] = useState("");
  const [editCatIconUrl, setEditCatIconUrl] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<any | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [newCatIconUrl, setNewCatIconUrl] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const openEditCategory = (c: any) => {
    setEditCategory(c);
    setEditCatName(c.name ?? "");
    setEditCatSlug(c.slug ?? "");
    setEditCatIcon(c.icon ?? "");
    setEditCatIconUrl(c.icon_url ?? null);
  };

  const uploadEditCategoryIcon = async (file: File) => {
    const ext = file.name.split(".").pop() || "png";
    const path = `category_icons/edit-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("category_icons").upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from("category_icons").getPublicUrl(path);
    setEditCatIconUrl(publicUrl);
    setEditCatIcon("");
  };

  const removeEditCategoryIcon = () => {
    setEditCatIconUrl(null);
    setEditCatIcon("");
  };

  const updateCategoryMutation = useMutation({
    mutationFn: async () => {
      if (!editCategory?.id || !editCatName.trim()) {
        throw new Error("Nama kategori wajib diisi");
      }
      const slug = editCatSlug.trim() || editCatName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const payload: any = { name: editCatName.trim(), slug };
      if (editCatIconUrl) payload.icon_url = editCatIconUrl;
      else if (editCatIcon.trim()) payload.icon = editCatIcon.trim();
      const { error } = await supabase.from("categories").update(payload).eq("id", editCategory.id).select("id");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kategori berhasil diperbarui");
      setEditCategory(null);
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal memperbarui kategori"),
  });

  const uploadCategoryIcon = async (file: File) => {
    const ext = file.name.split('.').pop() || 'png';
    const path = `category_icons/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('category_icons').upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('category_icons').getPublicUrl(path);
    setNewCatIconUrl(publicUrl);
    setNewCatIcon("");
  };

  const removeCategoryIcon = () => {
    setNewCatIconUrl(null);
    setNewCatIcon("");
  };

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [umkmRes, productsRes, catRes] = await Promise.all([
        supabase.from("umkm_profiles").select("id, is_verified, is_published, city"),
        supabase.from("products").select("id, is_published, price"),
        supabase.from("categories").select("id"),
      ]);

      const umkm = umkmRes.data ?? [];
      const products = productsRes.data ?? [];
      const categories = catRes.data ?? [];

      return {
        totalUmkm: umkm.length,
        verifiedUmkm: umkm.filter((u) => u.is_verified).length,
        publishedUmkm: umkm.filter((u) => u.is_published).length,
        totalProducts: products.length,
        publishedProducts: products.filter((p) => p.is_published).length,
        totalCategories: categories.length,
      };
    },
  });

  const { data: umkmList = [], isLoading: umkmLoading } = useQuery({
    queryKey: ["admin-umkm"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("umkm_profiles")
        .select(`
          id, name, slug, city, is_verified, is_published, rating, created_at,
          owner_id, description, district, address, google_maps_url, whatsapp, email, website,
          instagram, facebook, tiktok, logo_url, banner_url, category_id,
          category:categories(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  // Edit modal state — null when closed, holds the row being edited otherwise.
  const [editingUmkm, setEditingUmkm] = useState<any | null>(null);

  const { data: productsList = [], isLoading: productsLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, price, stock, is_published, image_url, created_at,
          umkm:umkm_profiles(name, slug)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: categoriesList = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, icon, icon_url, created_at")
        .order("name");

      if (error) throw error;
      return data ?? [];
    },
  });

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const toggleVerifyUmkm = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      const { error } = await supabase
        .from("umkm_profiles")
        .update({ is_verified: status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status verifikasi UMKM diperbarui");
      qc.invalidateQueries({ queryKey: ["admin-umkm"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const togglePublishUmkm = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      const { error } = await supabase
        .from("umkm_profiles")
        .update({ is_published: status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status publikasi UMKM diperbarui");
      qc.invalidateQueries({ queryKey: ["admin-umkm"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const editUmkm = useMutation({
    mutationFn: async (payload: { id: string } & Record<string, any>) => {
      const { id, ...patch } = payload;
      // Normalize empty strings to null so they don't shadow defaults / NOT NULL
      // columns silently.
      const cleaned: Record<string, any> = {};
      for (const [k, v] of Object.entries(patch)) {
        cleaned[k] = typeof v === "string" && v.trim() === "" ? null : v;
      }
      const { data, error } = await supabase
        .from("umkm_profiles")
        .update(cleaned as any)
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(
          "Tidak ada baris yang diperbarui. Periksa apakah akun Anda memiliki role super_admin (kemungkinan tertolak RLS)."
        );
      }
    },
    onSuccess: () => {
      toast.success("UMKM berhasil diperbarui");
      setEditingUmkm(null);
      qc.invalidateQueries({ queryKey: ["admin-umkm"] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal memperbarui UMKM"),
  });

  const deleteUmkm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("umkm_profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("UMKM dan semua produknya berhasil dihapus");
      qc.invalidateQueries({ queryKey: ["admin-umkm"] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const togglePublishProduct = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_published: status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status publikasi produk diperbarui");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produk berhasil dihapus");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const addCategory = useMutation({
    mutationFn: async () => {
      const slug = newCatSlug.trim() || newCatName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const payload: any = { name: newCatName.trim(), slug };
      if (newCatIconUrl) {
        payload.icon_url = newCatIconUrl;
      } else if (newCatIcon.trim()) {
        payload.icon = newCatIcon.trim();
      }
      const { error } = await supabase
        .from("categories")
        .insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kategori baru berhasil ditambahkan");
      setNewCatName("");
      setNewCatSlug("");
      setNewCatIcon("");
      setNewCatIconUrl(null);
      setIsAddingCategory(false);
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(e?.message ?? "Gagal menambahkan kategori"),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(
          "Tidak ada baris yang dihapus. Periksa apakah akun Anda memiliki role super_admin (kemungkinan tertolak RLS)."
        );
      }
    },
    onSuccess: () => {
      toast.success("Kategori berhasil dihapus");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menghapus kategori"),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Shield className="size-8 text-red-600 shrink-0" />
            Backend Administrator
          </h1>
          <p className="text-sm text-gray-500 mt-1">Kelola direktori wirausaha, kategori produk, dan data seluruh platform.</p>
        </div>
      </header>

      {/* ── Stats Widget Grid ── */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-24 border border-gray-100" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-sm">
            <div className="size-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <Store className="size-5 text-[#1a6b3c]" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{stats.totalUmkm}</p>
              <p className="text-xs font-semibold text-gray-400">Total UMKM ({stats.publishedUmkm} Live)</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-sm">
            <div className="size-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{stats.verifiedUmkm}</p>
              <p className="text-xs font-semibold text-gray-400">UMKM Terverifikasi</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-sm">
            <div className="size-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <Package className="size-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{stats.totalProducts}</p>
              <p className="text-xs font-semibold text-gray-400">Total Produk ({stats.publishedProducts} Live)</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-sm">
            <div className="size-11 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Layers className="size-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{stats.totalCategories}</p>
              <p className="text-xs font-semibold text-gray-400">Kategori Terdaftar</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tab navigation */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
        <nav className="flex gap-6 border-b border-gray-100 px-6">
          {(["umkm", "products", "categories"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
                activeTab === tab
                  ? "border-[#1a6b3c] text-[#1a6b3c]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "umkm"
                ? "Manajemen UMKM"
                : tab === "products"
                ? "Manajemen Produk"
                : "Kategori"}
            </button>
          ))}
        </nav>

        <div className="p-6">
        {/* ── 1. MANAJEMEN UMKM ── */}
        {activeTab === "umkm" && (
          <div className="space-y-6">
            {umkmLoading ? (
              <div className="p-20 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="size-8 text-[#1a6b3c] animate-spin" />
                <span>Memuat data UMKM...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4">UMKM</th>
                      <th className="px-6 py-4">Kategori</th>
                      <th className="px-6 py-4">Kota</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {umkmList.map((u: any) => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="font-extrabold text-gray-900">{u.name}</div>
                          <div className="text-xs text-gray-400">slug: {u.slug}</div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="font-bold text-gray-600">{u.category?.name ?? "Tanpa kategori"}</div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="font-bold text-gray-600">{u.city || "-"}</div>
                          <div className="text-xs text-gray-400">{u.district ? `Kec. ${u.district}` : ""}</div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                              u.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {u.is_published ? "Live" : "Draft"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => togglePublishProduct.mutate({ id: u.id, status: !u.is_published })}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                              u.is_published
                                ? "border-yellow-200 text-yellow-600 bg-yellow-50 hover:bg-yellow-100/50"
                                : "border-green-200 text-[#1a6b3c] bg-green-50 hover:bg-green-100/50"
                            }`}
                          >
                            {u.is_published ? "Draft" : "Publish"}
                          </button>
                          <button
                            onClick={() => setEditingUmkm(u)}
                            className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition cursor-pointer"
                            title="Edit UMKM"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            onClick={() => confirm(`Hapus UMKM "${u.name}" beserta seluruh produknya? Tindakan ini permanen.`) && deleteUmkm.mutate(u.id)}
                            className="inline-flex items-center justify-center p-2 rounded-lg border border-red-100 text-red-500 bg-red-50 hover:bg-red-100/50 transition cursor-pointer"
                            title="Hapus UMKM"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        {/* ── 2. MANAJEMEN PRODUK ── */}
        {activeTab === "products" && (
          <div className="overflow-x-auto">
            {productsLoading ? (
              <div className="p-20 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="size-8 text-[#1a6b3c] animate-spin" />
                <span>Memuat data produk...</span>
              </div>
            ) : productsList.length === 0 ? (
              <div className="p-16 text-center text-gray-400">
                <AlertCircle className="size-8 mx-auto mb-2 text-gray-300" />
                Belum ada produk terdaftar di sistem.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Foto</th>
                    <th className="px-6 py-4">Nama Produk</th>
                    <th className="px-6 py-4">UMKM</th>
                    <th className="px-6 py-4">Harga</th>
                    <th className="px-6 py-4">Stok</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {productsList.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="size-11 rounded-lg bg-gray-100 overflow-hidden ring-1 ring-gray-100">
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="size-full object-cover" />
                          ) : (
                            <div className="size-full flex items-center justify-center text-gray-300 text-[10px]">No Pic</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-extrabold text-gray-900">{p.name}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-gray-600">{p.umkm?.name}</div>
                        <div className="text-xs text-gray-400">slug: {p.umkm?.slug}</div>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-[#1a6b3c]">
                        {formatRupiah(p.price)}
                      </td>
                      <td className="px-6 py-3.5">
                        {p.stock} pcs
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex justify-center">
                          {p.is_published ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-green-100 text-green-700">
                              Live
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-yellow-100 text-yellow-700">
                              Draft
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => togglePublishProduct.mutate({ id: p.id, status: !p.is_published })}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                            p.is_published
                              ? "border-yellow-200 text-yellow-600 bg-yellow-50 hover:bg-yellow-100/50"
                              : "border-green-200 text-[#1a6b3c] bg-green-50 hover:bg-green-100/50"
                          }`}
                        >
                          {p.is_published ? "Draft" : "Publish"}
                        </button>
                        <button
                          onClick={() => confirm(`Hapus produk "${p.name}"?`) && deleteProduct.mutate(p.id)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-red-100 text-red-500 bg-red-50 hover:bg-red-100/50 transition cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── 3. MANAJEMEN KATEGORI ── */}
        {activeTab === "categories" && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Form Tambah Kategori */}
              <div className="w-full md:w-80 bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-4 shrink-0">
                <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                  <PlusCircle className="size-5 text-[#1a6b3c]" />
                  Tambah Kategori
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Nama Kategori</label>
                    <input
                      value={newCatName}
                      onChange={(e) => {
                        setNewCatName(e.target.value);
                        setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                      }}
                      placeholder="e.g. Kerajinan Kulit"
                      className="w-full h-10 px-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">Slug (URL)</label>
                    <input
                      value={newCatSlug}
                      onChange={(e) => setNewCatSlug(e.target.value)}
                      placeholder="e.g. kerajinan-kulit"
                      className="w-full h-10 px-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">Icon Kategori</label>
                    <label className="flex items-center justify-between gap-3 h-10 px-3 rounded-xl bg-white border border-gray-200 text-sm cursor-pointer hover:border-[#1a6b3c]">
                      <span className="truncate text-gray-600">{newCatIconUrl || newCatIcon || 'Pilih file kategori...'}</span>
                      <span className="text-[10px] font-bold text-[#1a6b3c] uppercase">Upload</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setNewCatIcon(URL.createObjectURL(file));
                          uploadCategoryIcon(file).catch((err) => toast.error(err?.message ?? 'Upload icon gagal'));
                        }}
                      />
                    </label>
                    {(newCatIcon || newCatIconUrl) && (
                      <button type="button" onClick={removeCategoryIcon} className="mt-1 text-[10px] font-bold text-red-500">Hapus icon</button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (!newCatName.trim()) {
                        toast.error("Nama kategori wajib diisi");
                        return;
                      }
                      addCategory.mutate();
                    }}
                    disabled={addCategory.isPending}
                    className="w-full h-10 rounded-xl bg-[#1a6b3c] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#155c33] transition disabled:opacity-50 cursor-pointer"
                  >
                    {addCategory.isPending ? "Menyimpan..." : "Simpan Kategori"}
                  </button>
                </div>
              </div>

              {/* Tabel Daftar Kategori */}
              <div className="flex-1 w-full border border-gray-100 rounded-2xl overflow-hidden">
                {categoriesLoading ? (
                  <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="size-6 text-[#1a6b3c] animate-spin" />
                    <span>Memuat kategori...</span>
                  </div>
                ) : categoriesList.length === 0 ? (
                  <div className="p-10 text-center text-gray-400">Belum ada kategori.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3 text-center">Icon</th>
                        <th className="px-4 py-3">Nama Kategori</th>
                        <th className="px-4 py-3">Slug</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                      {categoriesList.map((c: any) => (
                        <tr key={c.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-center">
                            {c.icon_url ? (
                              <img src={c.icon_url} alt={c.name} className="size-8 rounded-lg object-cover mx-auto" />
                            ) : (
                              <span className="text-xl">{c.icon || "🏪"}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900">{c.name}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-mono">{c.slug}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-2 justify-end">
                              <button
                                onClick={() => openEditCategory(c)}
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-[#1a6b3c] hover:border-[#1a6b3c] transition cursor-pointer"
                                title="Edit kategori"
                              >
                                <Pencil className="size-4" />
                              </button>
                              <button
                                onClick={() => confirm(`Hapus kategori "${c.name}"? Produk dengan kategori ini akan diset NULL.`) && deleteCategory.mutate(c.id)}
                                className="p-1.5 rounded-lg border border-red-500/10 text-red-500 hover:bg-red-50 transition cursor-pointer"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* ─── Edit UMKM Modal ────────────────────────────────────────────────── */}
      {editingUmkm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editUmkm.mutate({
                id: editingUmkm.id,
                ...form,
                category_id: form.category_id || null,
                rating: Number(form.rating) || null,
              });
            }}
            className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl my-8 overflow-hidden"
          >
            <header className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <Pencil className="size-4 text-indigo-600" />
                  Edit UMKM
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">{editingUmkm.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUmkm(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Tutup"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Info dasar */}
              <section className="space-y-3">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Info Dasar</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Nama UMKM">
                    <input
                      value={umkmList.find((x: any) => x.id === editingUmkm?.id)?.name ?? editingUmkm?.name ?? ""}
                      onChange={(e) => setEditingUmkm({ ...editingUmkm, name: e.target.value })}
                      required
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Slug (URL)">
                    <input
                      value={editingUmkm?.slug ?? ""}
                      onChange={(e) => setEditingUmkm({ ...editingUmkm, slug: e.target.value })}
                      required
                      className={`${INPUT_CLASS} font-mono text-xs`}
                    />
                  </Field>
                  <Field label="Kota">
                    <input
                      value={editingUmkm?.city ?? ""}
                      onChange={(e) => setEditingUmkm({ ...editingUmkm, city: e.target.value })}
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Kecamatan / Distrik">
                    <input
                      value={editingUmkm?.district ?? ""}
                      onChange={(e) => setEditingUmkm({ ...editingUmkm, district: e.target.value })}
                      className={INPUT_CLASS}
                    />
                  </Field>
                </div>
                <Field label="Alamat Lengkap">
                  <textarea
                    value={editingUmkm?.address ?? ""}
                    onChange={(e) => setEditingUmkm({ ...editingUmkm, address: e.target.value })}
                    rows={2}
                    className={`${INPUT_CLASS} resize-none`}
                  />
                </Field>
                <Field label="Deskripsi">
                  <textarea
                    value={editingUmkm?.description ?? ""}
                    onChange={(e) => setEditingUmkm({ ...editingUmkm, description: e.target.value })}
                    rows={3}
                    className={`${INPUT_CLASS} resize-none`}
                  />
                </Field>
              </section>

              {/* Kontak & Media Sosial */}
              <section className="space-y-3">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Kontak</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="WhatsApp">
                    <input
                      value={editingUmkm?.whatsapp ?? ""}
                      onChange={(e) => setEditingUmkm({ ...editingUmkm, whatsapp: e.target.value })}
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      value={editingUmkm?.email ?? ""}
                      onChange={(e) => setEditingUmkm({ ...editingUmkm, email: e.target.value })}
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Website">
                    <input
                      value={editingUmkm?.website ?? ""}
                      onChange={(e) => setEditingUmkm({ ...editingUmkm, website: e.target.value })}
                      placeholder="https://"
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Instagram">
                    <input
                      value={editingUmkm?.instagram ?? ""}
                      onChange={(e) => setEditingUmkm({ ...editingUmkm, instagram: e.target.value })}
                      placeholder="@username"
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Facebook">
                    <input
                      value={editingUmkm?.facebook ?? ""}
                      onChange={(e) => setEditingUmkm({ ...editingUmkm, facebook: e.target.value })}
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="TikTok">
                    <input
                      value={editingUmkm?.tiktok ?? ""}
                      onChange={(e) => setEditingUmkm({ ...editingUmkm, tiktok: e.target.value })}
                      placeholder="@username"
                      className={INPUT_CLASS}
                    />
                  </Field>
                </div>
              </section>
            </div>

            <footer className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50 sticky bottom-0">
              <button
                type="button"
                onClick={() => setEditingUmkm(null)}
                className="px-4 py-2 text-sm font-bold text-gray-600 rounded-xl hover:bg-gray-100"
              >
                Batal
              </button>
              <div className="flex items-center gap-2">
                <label className="px-4 py-2 text-sm font-bold text-[#1a6b3c] rounded-xl border border-[#1a6b3c]/20 cursor-pointer hover:bg-[#1a6b3c]/5">
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setEditingUmkm({ ...editingUmkm, logo_url: reader.result as string });
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                <button
                  type="submit"
                  disabled={editUmkm.isPending}
                  className="px-5 py-2 text-sm font-bold text-white bg-[#1a6b3c] hover:bg-[#155c33] disabled:opacity-60 rounded-xl flex items-center gap-1.5"
                >
                  {editUmkm.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                  Simpan Perubahan
                </button>
              </div>
            </footer>
          </form>
        </div>
      )}

      {/* ─── Edit Kategori Modal ────────────────────────────────────────────── */}
      {editCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateCategoryMutation.mutate();
            }}
            className="bg-white w-full max-w-xl rounded-3xl shadow-2xl my-8 overflow-hidden"
          >
            <header className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <Pencil className="size-4 text-[#1a6b3c]" />
                  Edit Kategori
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">{editCategory?.name}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditCategory(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Tutup"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="p-5 space-y-5">
              <section className="space-y-3">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Info Dasar</h3>
                <div className="space-y-3">
                  <Field label="Nama Kategori">
                    <input
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                      required
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Slug (URL)">
                    <input
                      value={editCatSlug}
                      onChange={(e) => setEditCatSlug(e.target.value)}
                      className={`${INPUT_CLASS} font-mono text-xs`}
                    />
                  </Field>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Icon</h3>
                <div className="space-y-2">
                  {editCatIconUrl ? (
                    <div className="space-y-2">
                      <img src={editCatIconUrl} alt="Preview" className="size-12 rounded-xl object-cover border border-gray-200" />
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-500 truncate">{editCatIconUrl}</span>
                        <button
                          type="button"
                          onClick={removeEditCategoryIcon}
                          className="text-[11px] font-bold text-red-500"
                        >
                          Hapus icon
                        </button>
                      </div>
                    </div>
                  ) : editCatIcon ? (
                    <div className="space-y-2">
                      <span className="text-2xl">{editCatIcon}</span>
                      <button
                        type="button"
                        onClick={removeEditCategoryIcon}
                        className="text-[11px] font-bold text-red-500"
                      >
                        Hapus icon
                      </button>
                    </div>
                  ) : null}
                  <label className="flex items-center justify-between gap-3 h-10 px-3 rounded-xl bg-white border border-gray-200 text-sm cursor-pointer hover:border-[#1a6b3c]">
                    <span className="truncate text-gray-600">{editCatIconUrl || editCatIcon || 'Pilih file icon...'}</span>
                    <span className="text-[10px] font-bold text-[#1a6b3c] uppercase">Upload</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setEditCatIcon(URL.createObjectURL(file));
                        uploadEditCategoryIcon(file).catch((err) => toast.error(err?.message ?? 'Upload icon gagal'));
                      }}
                    />
                  </label>
                </div>
              </section>
            </div>

            <footer className="flex items-center justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50 sticky bottom-0">
              <button
                type="button"
                onClick={() => setEditCategory(null)}
                className="px-4 py-2 text-sm font-bold text-gray-600 rounded-xl hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={updateCategoryMutation.isPending}
                className="px-5 py-2 text-sm font-bold text-white bg-[#1a6b3c] hover:bg-[#155c33] disabled:opacity-60 rounded-xl flex items-center gap-1.5"
              >
                {updateCategoryMutation.isPending
                  ? <Loader2 className="size-3.5 animate-spin" />
                  : <CheckCircle2 className="size-3.5" />}
                {updateCategoryMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}

function isVideoMedia(url: string | null | undefined): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v|ogv)$/.test(clean);
}

const INPUT_CLASS =
  "w-full h-10 px-3 text-sm bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]/30 focus:border-[#1a6b3c]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1">{label}</span>
      {children}
    </label>
  );
}
