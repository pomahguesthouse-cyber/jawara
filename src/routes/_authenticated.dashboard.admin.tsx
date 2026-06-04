import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/format";
import {
  Shield, Users, Store, Package, Layers, CheckCircle2, XCircle,
  Trash2, Plus, Star, MapPin, ChevronRight, PlusCircle, AlertCircle, Loader2
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  beforeLoad: ({ context }) => {
    // If the user does not have super_admin role, redirect back to overview
    if (!context.isSuperAdmin) {
      toast.error("Akses ditolak: Hanya administrator yang diizinkan.");
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminDashboard,
});

type TabType = "umkm" | "products" | "categories";

function AdminDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("umkm");

  // Category Input states
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🏪");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

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
          owner_id,
          category:categories(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

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
        .select("id, name, slug, icon, created_at")
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
      const { error } = await supabase
        .from("categories")
        .insert({ name: newCatName.trim(), slug, icon: newCatIcon });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kategori baru berhasil ditambahkan");
      setNewCatName("");
      setNewCatSlug("");
      setNewCatIcon("🏪");
      setIsAddingCategory(false);
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kategori berhasil dihapus");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(e.message),
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

      {/* ── Tabs Navigation ── */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {(["umkm", "products", "categories"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer capitalize ${
                activeTab === tab
                  ? "border-[#1a6b3c] text-[#1a6b3c]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab === "umkm" ? "Manajemen UMKM" : tab === "products" ? "Manajemen Produk" : "Kategori"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        {/* ── 1. MANAJEMEN UMKM ── */}
        {activeTab === "umkm" && (
          <div className="overflow-x-auto">
            {umkmLoading ? (
              <div className="p-20 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="size-8 text-[#1a6b3c] animate-spin" />
                <span>Memuat data UMKM...</span>
              </div>
            ) : umkmList.length === 0 ? (
              <div className="p-16 text-center text-gray-400">
                <AlertCircle className="size-8 mx-auto mb-2 text-gray-300" />
                Belum ada UMKM terdaftar di sistem.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">UMKM</th>
                    <th className="px-6 py-4">Kota</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Pemilik (Email)</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {umkmList.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="font-extrabold text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">slug: {u.slug}</div>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3.5 text-gray-400 shrink-0" />
                          <span>{u.city}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                          {u.category?.name || "Kustom / Lainnya"}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-xs font-mono text-gray-500">
                        {u.owner_id}
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center justify-center gap-2">
                          {u.is_verified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blue-100 text-blue-700">
                              <CheckCircle2 className="size-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-gray-100 text-gray-400">
                              Unverified
                            </span>
                          )}
                          {u.is_published ? (
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
                      <td className="px-6 py-4.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => toggleVerifyUmkm.mutate({ id: u.id, status: !u.is_verified })}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                            u.is_verified
                              ? "border-gray-200 text-gray-500 hover:bg-gray-50"
                              : "border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100/50"
                          }`}
                        >
                          {u.is_verified ? "Unverify" : "Verify"}
                        </button>

                        <button
                          onClick={() => togglePublishUmkm.mutate({ id: u.id, status: !u.is_published })}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                            u.is_published
                              ? "border-yellow-200 text-yellow-600 bg-yellow-50 hover:bg-yellow-100/50"
                              : "border-green-200 text-[#1a6b3c] bg-green-50 hover:bg-green-100/50"
                          }`}
                        >
                          {u.is_published ? "Draft" : "Publish"}
                        </button>

                        <button
                          onClick={() => confirm(`Hapus UMKM "${u.name}" beserta seluruh produknya? Tindakan ini permanen.`) && deleteUmkm.mutate(u.id)}
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
                    <label className="text-xs font-semibold block mb-1">Icon (Emoji)</label>
                    <input
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                      placeholder="e.g. 🎨"
                      className="w-full h-10 px-3 rounded-xl bg-white border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]"
                    />
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
                          <td className="px-4 py-3 text-center text-xl">{c.icon || "🏪"}</td>
                          <td className="px-4 py-3 font-bold text-gray-900">{c.name}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-mono">{c.slug}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => confirm(`Hapus kategori "${c.name}"? Produk dengan kategori ini akan diset NULL.`) && deleteCategory.mutate(c.id)}
                              className="p-1.5 rounded-lg border border-red-500/10 text-red-500 hover:bg-red-50 transition cursor-pointer"
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
