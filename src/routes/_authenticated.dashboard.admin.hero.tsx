import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Layers, Plus, Trash2, Pencil, X, Save, ArrowUp, ArrowDown, MapPin, Search, ChevronRight, Eye, Layout, Loader2
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/hero")({
  beforeLoad: ({ context }) => {
    if (!context.isSuperAdmin) {
      toast.error("Akses ditolak: Hanya administrator yang diizinkan.");
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminHeroSliderPage,
});

interface HeroSlideRow {
  id: string;
  image: string;
  title: string;
  subtext: string;
  type: string;
  btn_text: string | null;
  btn_to: string | null;
  sort_order: number;
}

function AdminHeroSliderPage() {
  const qc = useQueryClient();
  const [editingSlide, setEditingSlide] = useState<HeroSlideRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [subtext, setSubtext] = useState("");
  const [image, setImage] = useState("");
  const [type, setType] = useState("button");
  const [btnText, setBtnText] = useState("");
  const [btnTo, setBtnTo] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: slides = [], isLoading } = useQuery<HeroSlideRow[]>({
    queryKey: ["admin-hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as HeroSlideRow[];
    },
  });

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const deleteSlide = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hero_slides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Slide berhasil dihapus");
      qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      qc.invalidateQueries({ queryKey: ["home-hero-slides"] }); // Clear client-side homepage cache
    },
    onError: (e) => toast.error(e.message),
  });

  const saveSlide = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        subtext,
        image,
        type,
        btn_text: type === "button" ? btnText : null,
        btn_to: type === "button" ? btnTo : null,
        sort_order: parseInt(sortOrder) || 0,
      };

      const { error } = editingSlide
        ? await supabase.from("hero_slides").update(payload).eq("id", editingSlide.id)
        : await supabase.from("hero_slides").insert(payload);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(editingSlide ? "Slide diperbarui" : "Slide baru ditambahkan");
      setShowForm(false);
      setEditingSlide(null);
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      qc.invalidateQueries({ queryKey: ["home-hero-slides"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setTitle("");
    setSubtext("");
    setImage("");
    setType("button");
    setBtnText("");
    setBtnTo("");
    setSortOrder("0");
  };

  const handleEdit = (slide: HeroSlideRow) => {
    setEditingSlide(slide);
    setTitle(slide.title);
    setSubtext(slide.subtext);
    setImage(slide.image);
    setType(slide.type);
    setBtnText(slide.btn_text ?? "");
    setBtnTo(slide.btn_to ?? "");
    setSortOrder(slide.sort_order.toString());
    setShowForm(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Layers className="size-8 text-[#1a6b3c]" />
            Homepage Hero Slider
          </h1>
          <p className="text-sm text-gray-500 mt-1">Kelola slide banner, promosi, dan tombol pencarian di bagian atas halaman depan.</p>
        </div>
        <button
          onClick={() => {
            setEditingSlide(null);
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 bg-[#1a6b3c] hover:bg-[#155c33] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow transition cursor-pointer"
        >
          <Plus className="size-4" />
          Tambah Slide
        </button>
      </header>

      {/* Slide Editor Panel */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm grid lg:grid-cols-2 gap-8 animate-fade-up">
          {/* Form */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Pencil className="size-5 text-[#1a6b3c]" />
              {editingSlide ? "Edit Slide" : "Tambah Slide Baru"}
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold block mb-1">Judul Slide</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Temukan UMKM Terbaik Jawa Tengah"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold block mb-1">Sub-judul / Deskripsi Pendek</label>
                <textarea
                  value={subtext}
                  onChange={(e) => setSubtext(e.target.value)}
                  placeholder="Deskripsi singkat yang tampil di bawah judul..."
                  rows={2}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold block mb-1">URL Gambar Latar Belakang (Unsplash / URL luar)</label>
                <input
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Tipe Slide</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]"
                >
                  <option value="search">Kolom Pencarian</option>
                  <option value="button">Tombol Link (CTA)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Urutan Tampil (Sort Order)</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  placeholder="1"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]"
                />
              </div>

              {type === "button" && (
                <>
                  <div>
                    <label className="text-xs font-semibold block mb-1">Teks Tombol</label>
                    <input
                      value={btnText}
                      onChange={(e) => setBtnText(e.target.value)}
                      placeholder="e.g. Mulai Belanja"
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">Tautan Tombol (URL/Route)</label>
                    <input
                      value={btnTo}
                      onChange={(e) => setBtnTo(e.target.value)}
                      placeholder="e.g. /marketplace atau /auth"
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => saveSlide.mutate()}
                disabled={saveSlide.isPending || !title || !image}
                className="flex-1 h-10 rounded-xl bg-[#1a6b3c] hover:bg-[#155c33] text-white text-sm font-bold flex items-center justify-center gap-1.5 shadow transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="size-4" />
                Simpan Slide
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingSlide(null);
                  resetForm();
                }}
                className="px-4 h-10 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-bold transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>

          {/* Live Mockup Preview */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-sm text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="size-4" />
              Live Mockup Preview
            </h3>
            <div className="relative aspect-[16/9] w-full rounded-2xl bg-gray-900 overflow-hidden shadow border border-gray-100 flex items-center">
              {image ? (
                <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-green-800 to-emerald-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />
              
              <div className="relative z-10 p-6 text-white space-y-3 max-w-[80%]">
                <h2 className="text-xl sm:text-2xl font-black leading-tight">
                  {title || "Judul Slide Anda Akan Tampil Di Sini"}
                </h2>
                <p className="text-[11px] sm:text-xs text-gray-200 line-clamp-2">
                  {subtext || "Deskripsi pendek slide yang memberikan penjelasan lebih lanjut mengenai topik promosi."}
                </p>
                
                {type === "search" ? (
                  <div className="flex bg-white rounded-full p-1 max-w-sm gap-1 items-center">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-gray-500 px-2 shrink-0 border-r border-gray-100">
                      <MapPin className="size-2.5 text-green-600" /> Semarang
                    </div>
                    <div className="flex-1 flex items-center gap-1 px-1">
                      <Search className="size-2.5 text-gray-400" />
                      <div className="text-[9px] text-gray-400">Cari usaha...</div>
                    </div>
                    <div className="bg-[#1a6b3c] text-white text-[9px] font-bold px-3 py-1.5 rounded-full shrink-0">
                      Cari
                    </div>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 bg-[#1a6b3c] text-white text-[10px] font-bold px-4 py-2 rounded-full shadow">
                    {btnText || "Jelajahi"} <ChevronRight className="size-3" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banners List */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="size-8 text-[#1a6b3c] animate-spin" />
            <span>Memuat data slide...</span>
          </div>
        ) : slides.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <Layout className="size-10 mx-auto mb-2 text-gray-300" />
            Belum ada slide banner terdaftar. Klik "Tambah Slide" di atas untuk membuat.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {slides.map((slide, index) => (
              <div key={slide.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 hover:bg-gray-50/50 transition">
                {/* Image Thumb */}
                <div className="w-24 sm:w-32 aspect-[16/9] rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100 shadow-sm relative">
                  <img src={slide.image} alt="" className="size-full object-cover" />
                  <span className="absolute top-1.5 left-1.5 bg-black/60 text-white font-black text-[9px] size-5 rounded-full flex items-center justify-center">
                    {slide.sort_order}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                  <h3 className="font-extrabold text-gray-900 truncate">{slide.title}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2">{slide.subtext}</p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1.5">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-gray-100 text-gray-500">
                      Tipe: {slide.type === "search" ? "Kolom Pencarian" : "Tombol Link"}
                    </span>
                    {slide.type === "button" && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-50 text-[#1a6b3c]">
                        Link: {slide.btn_text} ({slide.btn_to})
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <button
                    onClick={() => handleEdit(slide)}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition cursor-pointer"
                  >
                    <Pencil className="size-3.5" /> Ubah
                  </button>
                  <button
                    onClick={() => confirm(`Hapus slide banner "${slide.title}"?`) && deleteSlide.mutate(slide.id)}
                    className="p-2 rounded-xl border border-red-500/10 text-red-500 bg-red-50 hover:bg-red-100/50 transition cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
