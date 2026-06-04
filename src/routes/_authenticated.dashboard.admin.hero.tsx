import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  Layers, Plus, Trash2, Pencil, X, Save, ArrowUp, ArrowDown, MapPin, Search,
  ChevronRight, Eye, Layout, Loader2, GripVertical, Copy, Archive, RotateCcw,
  Smartphone, Tablet, Monitor, Undo2, Redo2, Sparkles, Image as ImageIcon, Video,
  Palette, RefreshCw, UploadCloud, Folder, Sliders, Type, FileText, Globe, Play,
  VolumeX, HelpCircle, Check, Calendar, CheckSquare, PlusCircle, Sparkle, Settings2,
  TrendingUp, BarChart2, Star, ShieldAlert, BadgeCheck, FileImage, Undo, ChevronDown
} from "lucide-react";

// ─── Route Definition ────────────────────────────────────────────────────────
export const Route = createFileRoute("/_authenticated/dashboard/admin/hero")({
  ssr: false,
  beforeLoad: ({ context }) => {
    if (!context.isSuperAdmin) {
      toast.error("Akses ditolak: Hanya administrator yang diizinkan.");
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminHeroSliderPage,
});

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface ViewportMode {
  id: "desktop" | "tablet" | "mobile";
  label: string;
  icon: any;
  width: string;
}

interface SlideSettings {
  headline: {
    text: string;
    fontSize: { desktop: string; tablet: string; mobile: string };
    fontWeight: string;
    color: string;
    letterSpacing: string;
    lineHeight: string;
    textShadow: boolean;
    gradientText: boolean;
    gradientColors: { from: string; to: string };
    animation: string;
  };
  subheadline: {
    text: string;
    fontSize: { desktop: string; tablet: string; mobile: string };
    color: string;
    animation: string;
  };
  background: {
    type: string; // image, video, gradient, solid, ai
    image: string;
    blur: string;
    brightness: string;
    contrast: string;
    overlayColor: string;
    overlayOpacity: string;
    solidColor: string;
    gradientType: string;
    gradientColors: string[];
    videoUrl: string;
    videoProvider: string; // upload, youtube, vimeo
    videoAutoplay: boolean;
    videoLoop: boolean;
    videoMute: boolean;
    videoPoster: string;
  };
  badge: {
    show: boolean;
    text: string;
    color: string;
    textColor: string;
  };
  cta1: {
    show: boolean;
    text: string;
    link: string;
    style: string; // filled, outline, ghost, gradient
    hoverEffect: string; // scale, glow, ripple
    openNewTab: boolean;
  };
  cta2: {
    show: boolean;
    text: string;
    link: string;
    style: string;
    hoverEffect: string;
    openNewTab: boolean;
  };
  searchBar: {
    show: boolean;
    placeholder: string;
    borderRadius: string;
    shadow: string;
    showLocation: boolean;
    showCategory: boolean;
  };
  stats: {
    show: boolean;
    items: Array<{ label: string; value: string; delay: string }>;
    animation: string;
  };
  seo: {
    title: string;
    description: string;
    ogImage: string;
    ogTitle: string;
    ogDescription: string;
  };
}

interface HeroSlideRow {
  id: string;
  image: string;
  title: string;
  subtext: string;
  type: string;
  btn_text: string | null;
  btn_to: string | null;
  sort_order: number;
  internal_name?: string;
  status: string; // draft, published, scheduled, archived
  start_date?: string | null;
  end_date?: string | null;
  priority_score: number;
  tags?: string[];
  settings: SlideSettings;
}

// ─── Constants & Fallbacks ──────────────────────────────────────────────────
const defaultSettings: SlideSettings = {
  headline: {
    text: "Temukan UMKM Terbaik Jawa Tengah",
    fontSize: { desktop: "48", tablet: "36", mobile: "28" },
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: "normal",
    lineHeight: "1.2",
    textShadow: true,
    gradientText: false,
    gradientColors: { from: "#34d399", to: "#10b981" },
    animation: "fade-up",
  },
  subheadline: {
    text: "Direktori digital wirausaha pilihan dengan rating terbaik dan layanan terpercaya.",
    fontSize: { desktop: "16", tablet: "14", mobile: "12" },
    color: "#e4e4e7",
    animation: "fade-up",
  },
  background: {
    type: "image",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600",
    blur: "0",
    brightness: "100",
    contrast: "100",
    overlayColor: "#000000",
    overlayOpacity: "60",
    solidColor: "#1a6b3c",
    gradientType: "linear",
    gradientColors: ["#1a6b3c", "#09090b"],
    videoUrl: "",
    videoProvider: "youtube",
    videoAutoplay: true,
    videoLoop: true,
    videoMute: true,
    videoPoster: "",
  },
  badge: {
    show: false,
    text: "🔥 TERBAIK 2026",
    color: "#10b981",
    textColor: "#ffffff",
  },
  cta1: {
    show: true,
    text: "Jelajahi Sekarang",
    link: "/direktori",
    style: "filled",
    hoverEffect: "scale",
    openNewTab: false,
  },
  cta2: {
    show: false,
    text: "Daftar Usaha",
    link: "/auth",
    style: "outline",
    hoverEffect: "none",
    openNewTab: false,
  },
  searchBar: {
    show: false,
    placeholder: "Cari wirausaha, kuliner, kerajinan...",
    borderRadius: "full",
    shadow: "lg",
    showLocation: true,
    showCategory: true,
  },
  stats: {
    show: false,
    items: [
      { label: "Total UMKM", value: "2,500+", delay: "100" },
      { label: "Total Produk", value: "10K+", delay: "200" },
      { label: "Total Kota", value: "35", delay: "300" },
    ],
    animation: "countup",
  },
  seo: {
    title: "JAWARA | Jaringan Wirausaha Jawa Tengah",
    description: "Temukan wirausaha lokal Jawa Tengah.",
    ogImage: "",
    ogTitle: "",
    ogDescription: "",
  },
};

const VIEWPORTS: ViewportMode[] = [
  { id: "desktop", label: "Desktop (1024px)", icon: Monitor, width: "w-full max-w-[100%]" },
  { id: "tablet", label: "Tablet (768px)", icon: Tablet, width: "w-[768px]" },
  { id: "mobile", label: "Mobile (375px)", icon: Smartphone, width: "w-[375px]" },
];

const PRESETS = [
  {
    name: "Portal UMKM Jawa Tengah",
    description: "Layout slider utama yang dilengkapi kolom pencarian dan kategori.",
    settings: {
      ...defaultSettings,
      headline: { ...defaultSettings.headline, text: "Temukan UMKM Pilihan Terbaik Jawa Tengah" },
      searchBar: { ...defaultSettings.searchBar, show: true },
      cta1: { ...defaultSettings.cta1, show: false },
    },
  },
  {
    name: "Kampanye Marketplace Lokal",
    description: "Promo produk kerajinan dan fashion lokal dengan tombol belanja langsung.",
    settings: {
      ...defaultSettings,
      headline: { ...defaultSettings.headline, text: "Dukung Karya Kreatif & Kerajinan Lokal" },
      subheadline: { ...defaultSettings.subheadline, text: "Beli aneka produk busana, kuliner, dan kriya berkualitas premium langsung dari pengrajin Jawa Tengah." },
      background: {
        ...defaultSettings.background,
        image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1600",
      },
      cta1: { ...defaultSettings.cta1, text: "Buka Marketplace", link: "/marketplace", style: "filled" },
    },
  },
  {
    name: "Gerakan UMKM Go Digital",
    description: "Ajakan pendaftaran merchants dengan A/B Testing terpasang.",
    settings: {
      ...defaultSettings,
      badge: { show: true, text: "🚀 PENDAFTARAN DIBUKA", color: "#e11d48", textColor: "#ffffff" },
      headline: { ...defaultSettings.headline, text: "Kembangkan Bisnis Anda ke Ranah Digital" },
      background: {
        ...defaultSettings.background,
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1600",
      },
      cta1: { ...defaultSettings.cta1, text: "Daftar Usaha Sekarang", link: "/auth", style: "filled" },
    },
  },
];

// ─── Page Component ─────────────────────────────────────────────────────────
function AdminHeroSliderPage() {
  const qc = useQueryClient();
  const [slides, setSlides] = useState<HeroSlideRow[]>([]);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"slides" | "templates" | "media">("slides");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [zoom, setZoom] = useState<number>(100);
  const [selectedElement, setSelectedElement] = useState<string>("background");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Undo / Redo stacks
  const [undoStack, setUndoStack] = useState<HeroSlideRow[][]>([]);
  const [redoStack, setRedoStack] = useState<HeroSlideRow[][]>([]);
  
  // Revision list mockup
  const [revisions, setRevisions] = useState<Array<{ id: string; time: string; author: string }>>([
    { id: "1", time: "Baru saja", author: "Super Admin (Anda)" },
    { id: "2", time: "10 menit yang lalu", author: "ical.smg@gmail.com" },
    { id: "3", time: "Hari ini, 09:30", author: "System Auto-save" },
  ]);

  // AI assistant form state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiName, setAiName] = useState("JAWARA");
  const [aiTarget, setAiTarget] = useState("Pembeli & Wirausaha Muda Jawa Tengah");
  const [aiGoal, setAiGoal] = useState("Meningkatkan transaksi produk lokal & pendaftaran anggota baru");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Media Library state mockup
  const [mediaFolder, setMediaFolder] = useState<string>("Hero Images");
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaItems, setMediaItems] = useState([
    { id: "m1", name: "UMKM Crowd.jpg", url: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600", folder: "Hero Images", size: "1.2 MB" },
    { id: "m2", name: "Crafts.jpg", url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1600", folder: "Hero Images", size: "850 KB" },
    { id: "m3", name: "Meeting.jpg", url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1600", folder: "Hero Images", size: "1.4 MB" },
    { id: "m4", name: "Jawara Logo.png", url: "/logo.png", folder: "Logos", size: "45 KB" },
    { id: "m5", name: "Semarang City.jpg", url: "https://images.unsplash.com/photo-1596422846543-75c6fc18a52b?q=80&w=1600", folder: "Backgrounds", size: "2.1 MB" },
  ]);

  // A/B Testing details mockup
  const abMetrics = {
    "Slide Pencarian Utama": { views: 12450, clicks: 1205, cr: "9.6%" },
    "Slide Marketplace": { views: 8900, clicks: 750, cr: "8.4%" },
    "Slide Pendaftaran Usaha": { views: 6200, clicks: 310, cr: "5.0%" },
  };

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: rawSlides = [], isLoading } = useQuery<HeroSlideRow[]>({
    queryKey: ["admin-hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;

      // Transform & normalize rows for advanced builder configuration
      const formatted = (data ?? []).map((s: any) => {
        const settings = {
          ...defaultSettings,
          ...(s.settings || {}),
        };
        // Ensure core attributes fall back to database values
        if (!settings.headline.text) settings.headline.text = s.title;
        if (!settings.subheadline.text) settings.subheadline.text = s.subtext;
        if (!settings.background.image) settings.background.image = s.image;
        if (s.type === "search") {
          settings.searchBar.show = true;
          settings.cta1.show = false;
        } else if (s.type === "button") {
          settings.cta1.show = true;
          if (s.btn_text) settings.cta1.text = s.btn_text;
          if (s.btn_to) settings.cta1.link = s.btn_to;
        }
        return {
          ...s,
          internal_name: s.internal_name || s.title || `Slide ${s.sort_order}`,
          status: s.status || "published",
          start_date: s.start_date || null,
          end_date: s.end_date || null,
          priority_score: s.priority_score || 0,
          tags: s.tags || [],
          settings,
        } as HeroSlideRow;
      });
      return formatted;
    },
  });

  // Sync loaded database query with local component state
  useEffect(() => {
    if (rawSlides.length > 0) {
      setSlides(rawSlides);
    }
  }, [rawSlides]);

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const publishAll = useMutation({
    mutationFn: async (items: HeroSlideRow[]) => {
      // Save each slide sequentially to support JSONB updates & database values mapping
      const promises = items.map((slide) => {
        const payload = {
          title: slide.settings.headline.text,
          subtext: slide.settings.subheadline.text,
          image: slide.settings.background.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600",
          type: slide.settings.searchBar.show ? "search" : "button",
          btn_text: slide.settings.cta1.show ? slide.settings.cta1.text : null,
          btn_to: slide.settings.cta1.show ? slide.settings.cta1.link : null,
          sort_order: slide.sort_order,
          internal_name: slide.internal_name,
          status: slide.status,
          start_date: slide.start_date,
          end_date: slide.end_date,
          priority_score: slide.priority_score,
          tags: slide.tags,
          settings: slide.settings,
        };
        return supabase.from("hero_slides").upsert({
          id: slide.id.includes("-") ? slide.id : undefined, // Check if actual UUID or temporary
          ...payload,
        });
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast.success("Semua perubahan berhasil dipublikasikan ke Website Utama!");
      qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      qc.invalidateQueries({ queryKey: ["home-hero-slides"] });
    },
    onError: (e) => toast.error(`Gagal mempublikasikan: ${e.message}`),
  });

  // ─── State History (Undo / Redo) ──────────────────────────────────────────
  const pushToHistory = (newSlides: HeroSlideRow[]) => {
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(slides))]);
    setRedoStack([]); // Clear redo stack on new change
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(slides))]);
    setSlides(previous);
    toast.info("Undo berhasil diterapkan");
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(slides))]);
    setSlides(next);
    toast.info("Redo berhasil diterapkan");
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const updateActiveSlide = (updater: (s: HeroSlideRow) => HeroSlideRow) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (!copy[activeIdx]) return prev;
      
      // Save to undo stack before changes
      setUndoStack((u) => [...u, JSON.parse(JSON.stringify(prev))]);
      setRedoStack([]);

      copy[activeIdx] = updater(copy[activeIdx]);
      return copy;
    });
  };

  const handleAddSlide = () => {
    const newSlide: HeroSlideRow = {
      id: `temp_${Date.now()}`,
      title: "Slide Banner Baru",
      subtext: "Deskripsi singkat banner promosi.",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600",
      type: "button",
      btn_text: "Jelajahi Usaha",
      btn_to: "/direktori",
      sort_order: slides.length + 1,
      internal_name: `Slide Kampanye Baru #${slides.length + 1}`,
      status: "draft",
      priority_score: 0,
      tags: ["Campaign"],
      settings: JSON.parse(JSON.stringify(defaultSettings)),
    };
    const updated = [...slides, newSlide];
    pushToHistory(updated);
    setSlides(updated);
    setActiveIdx(slides.length);
    toast.success("Slide baru ditambahkan (Draft)");
  };

  const handleDuplicateSlide = (idx: number) => {
    const source = slides[idx];
    if (!source) return;
    const duplicated: HeroSlideRow = {
      ...JSON.parse(JSON.stringify(source)),
      id: `temp_${Date.now()}`,
      internal_name: `${source.internal_name} (Copy)`,
      sort_order: slides.length + 1,
      status: "draft",
    };
    const updated = [...slides, duplicated];
    pushToHistory(updated);
    setSlides(updated);
    setActiveIdx(slides.length);
    toast.success("Slide berhasil digandakan");
  };

  const handleDeleteSlide = (idx: number) => {
    if (slides.length <= 1) {
      toast.warning("Harus menyisakan minimal 1 slide di slider!");
      return;
    }
    const filtered = slides.filter((_, i) => i !== idx).map((s, idx) => ({ ...s, sort_order: idx + 1 }));
    pushToHistory(filtered);
    setSlides(filtered);
    setActiveIdx(0);
    toast.success("Slide dihapus dari daftar kerja");
  };

  const handleArchiveSlide = (idx: number) => {
    const isArchived = slides[idx].status === "archived";
    updateActiveSlide((s) => ({
      ...s,
      status: isArchived ? "draft" : "archived",
    }));
    toast.success(isArchived ? "Slide dikembalikan dari arsip" : "Slide berhasil diarsipkan");
  };

  const handleDndDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = slides.findIndex((i) => i.id === active.id);
    const newIndex = slides.findIndex((i) => i.id === over.id);

    const reordered = arrayMove(slides, oldIndex, newIndex).map((s, idx) => ({
      ...s,
      sort_order: idx + 1,
    }));

    pushToHistory(reordered);
    setSlides(reordered);
    setActiveIdx(newIndex);
    toast.info("Urutan slide berhasil diperbarui");
  };

  // ─── Unsplash Search Simulation ────────────────────────────────────────────
  const applyUnsplashImage = (url: string) => {
    updateActiveSlide((s) => ({
      ...s,
      settings: {
        ...s.settings,
        background: { ...s.settings.background, image: url },
      },
    }));
    toast.success("Gambar Unsplash diterapkan!");
  };

  // ─── AI Helper Generation Simulation ──────────────────────────────────────
  const handleGenerateAiHero = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      updateActiveSlide((s) => ({
        ...s,
        settings: {
          ...s.settings,
          headline: {
            ...s.settings.headline,
            text: `Bergabung di ${aiName}: Pusat Wirausaha Digital Jawa Tengah`,
          },
          subheadline: {
            ...s.settings.subheadline,
            text: `Tingkatkan omzet UMKM Anda! Akses ribuan ${aiTarget.toLowerCase()} di seluruh nusantara dan nikmati fitur promosi instan.`,
          },
          cta1: {
            ...s.settings.cta1,
            text: "Daftar Toko Gratis",
          },
          seo: {
            ...s.settings.seo,
            title: `Gerakan Digitalisasi UMKM Jawa Tengah - ${aiName}`,
            description: `Tujuan Kampanye: ${aiGoal}. Menggerakkan daya saing pengusaha Jawa Tengah ke era digital global.`,
          },
        },
      }));
      setIsAiLoading(false);
      setShowAiModal(false);
      toast.success("AI Content Assistant berhasil memformulasikan Headline, Subheadline & SEO!");
    }, 2000);
  };

  // ─── Render Helper Constants ───────────────────────────────────────────────
  const activeSlide = slides[activeIdx] || slides[0] || null;
  const filteredSlides = slides.filter(
    (s) =>
      s.internal_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.settings.headline.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 text-emerald-500 animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-zinc-400">Menyiapkan Canvas Visual Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] lg:min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none border-l border-zinc-800">
      {/* ─── Top Framer-like Toolbar ────────────────────────────────────────── */}
      <header className="h-14 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-emerald-500">
            <Layers className="size-5" />
            <span className="font-extrabold text-sm tracking-wider uppercase text-white">Jawara Builder</span>
          </div>
          <span className="h-4 w-px bg-zinc-800" />
          <div className="text-xs text-zinc-400 font-medium">
            Active: <span className="text-zinc-200 font-bold">{activeSlide?.internal_name}</span>
          </div>
        </div>

        {/* Viewport Control Buttons */}
        <div className="hidden md:flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 gap-1">
          {VIEWPORTS.map((v) => (
            <button
              key={v.id}
              onClick={() => setViewport(v.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewport === v.id
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title={v.label}
            >
              <v.icon className="size-3.5" />
              <span className="capitalize">{v.id}</span>
            </button>
          ))}
        </div>

        {/* Editor Settings Buttons (Undo/Redo, Sync, Publish) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-0.5">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition"
              title="Undo"
            >
              <Undo2 className="size-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition"
              title="Redo"
            >
              <Redo2 className="size-4" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-400 font-semibold px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Auto-saved
          </div>

          <button
            onClick={() => publishAll.mutate(slides)}
            disabled={publishAll.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 h-9 rounded-xl flex items-center gap-1.5 shadow-lg transition cursor-pointer"
          >
            {publishAll.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            Publish
          </button>
        </div>
      </header>

      {/* ─── Main Editor Workspace ──────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ─── Left Sidebar: Slides, Presets & Media ───────────────────────── */}
        <aside className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
          {/* Tab Navigation */}
          <div className="grid grid-cols-3 border-b border-zinc-800 text-xs text-zinc-400">
            {(["slides", "templates", "media"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`py-3 font-bold border-b-2 capitalize transition ${
                  activeTab === t
                    ? "border-emerald-500 text-white bg-zinc-800/40"
                    : "border-transparent hover:text-zinc-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Tab 1: Slides List */}
            {activeTab === "slides" && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">Slide Deck</h3>
                  <button
                    onClick={handleAddSlide}
                    className="p-1 text-emerald-500 hover:bg-zinc-800 rounded-lg transition"
                    title="Tambah Slide Baru"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="size-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari slide..."
                    className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleDndDragEnd}
                  sensors={sensors}
                >
                  <SortableContext
                    items={filteredSlides.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {filteredSlides.map((slide, index) => {
                        const isSelected = activeIdx === index;
                        return (
                          <SortableItem
                            key={slide.id}
                            slide={slide}
                            isSelected={isSelected}
                            index={index}
                            onClick={() => setActiveIdx(index)}
                            onDuplicate={() => handleDuplicateSlide(index)}
                            onArchive={() => handleArchiveSlide(index)}
                            onDelete={() => handleDeleteSlide(index)}
                          />
                        );
                      })}
                      {filteredSlides.length === 0 && (
                        <p className="text-xs text-zinc-500 text-center py-6">Slide tidak ditemukan.</p>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )}

            {/* Tab 2: Template Presets */}
            {activeTab === "templates" && (
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">Profesional Presets</h3>
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      updateActiveSlide((s) => ({
                        ...s,
                        settings: JSON.parse(JSON.stringify(p.settings)),
                      }));
                      toast.success(`Preset "${p.name}" diterapkan!`);
                    }}
                    className="w-full text-left p-3 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 transition space-y-1"
                  >
                    <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <Sparkle className="size-3 text-emerald-400" />
                      {p.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 leading-normal">{p.description}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Tab 3: Media Library */}
            {activeTab === "media" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">Media Files</h3>
                  <select
                    value={mediaFolder}
                    onChange={(e) => setMediaFolder(e.target.value)}
                    className="text-[10px] font-bold bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-300 focus:outline-none"
                  >
                    <option>Hero Images</option>
                    <option>Hero Videos</option>
                    <option>Logos</option>
                    <option>Backgrounds</option>
                  </select>
                </div>

                <div className="border border-dashed border-zinc-800 rounded-2xl p-4 text-center hover:bg-zinc-950 cursor-pointer transition relative">
                  <UploadCloud className="size-6 mx-auto mb-2 text-zinc-500" />
                  <p className="text-[10px] text-zinc-400 font-bold">Upload Multiple Files</p>
                  <p className="text-[9px] text-zinc-600 mt-0.5">Drag/Drop or click to browse</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files) return;
                      toast.info("Mengunggah media ke Supabase...");
                      for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64 = reader.result as string;
                          setMediaItems((prev) => [
                            {
                              id: `m_${Date.now()}_${i}`,
                              name: file.name,
                              url: base64,
                              folder: mediaFolder,
                              size: `${(file.size / 1024).toFixed(0)} KB`,
                            },
                            ...prev,
                          ]);
                          toast.success(`Berhasil mengunggah ${file.name}`);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 size-full opacity-0 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {mediaItems
                    .filter((m) => m.folder === mediaFolder)
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (mediaFolder === "Logos") {
                            toast.info("Logo dipilih");
                          } else {
                            applyUnsplashImage(item.url);
                          }
                        }}
                        className="group relative aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 hover:border-emerald-500 cursor-pointer transition"
                      >
                        <img src={item.url} alt="" className="size-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <span className="text-[9px] font-bold text-white uppercase bg-emerald-600 px-2 py-1 rounded-full">Apply</span>
                        </div>
                        <div className="absolute bottom-1 left-1 bg-black/75 px-1.5 py-0.5 rounded text-[8px] text-zinc-400 truncate max-w-[90%]">
                          {item.name}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ─── Center Preview Area ────────────────────────────────────────────── */}
        <main className="flex-1 bg-zinc-950 flex flex-col overflow-hidden relative">
          {/* Zoom & View Options Toolbar */}
          <div className="h-10 border-b border-zinc-900 px-4 flex items-center justify-between gap-4 shrink-0 bg-zinc-900/20">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 font-bold text-[10px] uppercase">Zoom:</span>
              <select
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="bg-zinc-900 border border-zinc-800 text-[10px] font-bold px-1.5 py-0.5 rounded focus:outline-none"
              >
                <option value={100}>100%</option>
                <option value={75}>75%</option>
                <option value={50}>50%</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1 rounded text-zinc-500 hover:text-white transition"
                title="Fullscreen Preview"
              >
                <Eye className="size-4" />
              </button>
              <button
                onClick={() => {
                  qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
                  toast.info("Real-Time Preview refreshed");
                }}
                className="p-1 rounded text-zinc-500 hover:text-white transition animate-hover"
                title="Refresh Preview"
              >
                <RefreshCw className="size-4" />
              </button>
            </div>
          </div>

          {/* Interactive Responsive Canvas Frame */}
          <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-zinc-900/50">
            {activeSlide ? (
              <div
                className={`transition-all duration-300 ease-in-out origin-center border border-zinc-800 rounded-3xl bg-zinc-950 shadow-2xl overflow-hidden ${
                  VIEWPORTS.find((v) => v.id === viewport)?.width
                }`}
                style={{ transform: `scale(${zoom / 100})` }}
              >
                {/* Simulated Screen Top Header */}
                <div className="h-6 bg-zinc-900 px-4 flex items-center justify-between text-[9px] text-zinc-500 shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-red-500/80" />
                    <span className="size-2 rounded-full bg-yellow-500/80" />
                    <span className="size-2 rounded-full bg-green-500/80" />
                  </div>
                  <span className="font-mono">Preview ({viewport}) — JAWARA Portal</span>
                  <div className="w-4" />
                </div>

                {/* Banner Simulated Frame */}
                <div
                  className="relative w-full aspect-[16/9] min-h-[360px] sm:min-h-[480px] lg:min-h-[520px] flex items-center overflow-hidden"
                  style={{
                    backgroundColor: activeSlide.settings.background.solidColor,
                    backgroundImage:
                      activeSlide.settings.background.type === "gradient"
                        ? `${
                            activeSlide.settings.background.gradientType
                          }-gradient(from center, ${activeSlide.settings.background.gradientColors.join(
                            ", "
                          )})`
                        : "none",
                  }}
                >
                  {/* Background Image / Video render with adjustments */}
                  {(activeSlide.settings.background.type === "image" ||
                    activeSlide.settings.background.type === "ai") &&
                    activeSlide.settings.background.image && (
                      <img
                        src={activeSlide.settings.background.image}
                        alt=""
                        className="absolute inset-0 size-full object-cover transition duration-300"
                        style={{
                          filter: `blur(${activeSlide.settings.background.blur}px) brightness(${activeSlide.settings.background.brightness}%) contrast(${activeSlide.settings.background.contrast}%)`,
                        }}
                      />
                    )}

                  {activeSlide.settings.background.type === "video" && (
                    <div className="absolute inset-0 size-full bg-black">
                      {activeSlide.settings.background.videoUrl.includes("youtube.com") ||
                      activeSlide.settings.background.videoUrl.includes("youtu.be") ? (
                        <div className="absolute inset-0 size-full pointer-events-none scale-125">
                          <iframe
                            className="size-full"
                            src={`https://www.youtube.com/embed/${
                              activeSlide.settings.background.videoUrl.split("v=")[1]?.split("&")[0] || ""
                            }?autoplay=1&mute=1&controls=0&loop=1&playlist=${
                              activeSlide.settings.background.videoUrl.split("v=")[1]?.split("&")[0] || ""
                            }`}
                            allow="autoplay"
                          />
                        </div>
                      ) : (
                        <video
                          src={activeSlide.settings.background.videoUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 size-full object-cover"
                        />
                      )}
                    </div>
                  )}

                  {/* Adjustable overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundColor: activeSlide.settings.background.overlayColor,
                      opacity: `${activeSlide.settings.background.overlayOpacity}%`,
                    }}
                  />

                  {/* Slide Content wrapper */}
                  <div className="relative z-10 mx-auto max-w-7xl w-full px-8 flex flex-col justify-center">
                    <div className="max-w-2xl text-white space-y-6">
                      
                      {/* Active highlight indicators on click */}
                      {activeSlide.settings.badge.show && (
                        <div
                          onClick={() => setSelectedElement("badge")}
                          className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer border hover:border-dashed hover:border-emerald-400 ${
                            selectedElement === "badge" ? "border-emerald-500 ring-2 ring-emerald-500/40" : "border-transparent"
                          }`}
                          style={{
                            backgroundColor: activeSlide.settings.badge.color,
                            color: activeSlide.settings.badge.textColor,
                          }}
                        >
                          {activeSlide.settings.badge.text}
                        </div>
                      )}

                      <h1
                        onClick={() => setSelectedElement("headline")}
                        className={`font-black leading-[1.1] tracking-tight cursor-pointer border hover:border-dashed hover:border-emerald-400 ${
                          selectedElement === "headline" ? "border-emerald-500 ring-2 ring-emerald-500/40" : "border-transparent"
                        } ${
                          activeSlide.settings.headline.textShadow ? "drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" : ""
                        }`}
                        style={{
                          fontSize: `${activeSlide.settings.headline.fontSize[viewport]}px`,
                          color: activeSlide.settings.headline.gradientText ? "transparent" : activeSlide.settings.headline.color,
                          backgroundImage: activeSlide.settings.headline.gradientText
                            ? `linear-gradient(to right, ${activeSlide.settings.headline.gradientColors.from}, ${activeSlide.settings.headline.gradientColors.to})`
                            : "none",
                          backgroundClip: activeSlide.settings.headline.gradientText ? "text" : "border-box",
                        }}
                      >
                        {activeSlide.settings.headline.text}
                      </h1>

                      <p
                        onClick={() => setSelectedElement("subheadline")}
                        className={`text-zinc-200 cursor-pointer border hover:border-dashed hover:border-emerald-400 ${
                          selectedElement === "subheadline" ? "border-emerald-500 ring-2 ring-emerald-500/40" : "border-transparent"
                        }`}
                        style={{
                          fontSize: `${activeSlide.settings.subheadline.fontSize[viewport]}px`,
                          color: activeSlide.settings.subheadline.color,
                        }}
                      >
                        {activeSlide.settings.subheadline.text}
                      </p>

                      {/* Interactive Button CTA blocks */}
                      {(activeSlide.settings.cta1.show || activeSlide.settings.cta2.show) && (
                        <div className="flex flex-wrap gap-3 items-center">
                          {activeSlide.settings.cta1.show && (
                            <div
                              onClick={() => setSelectedElement("cta")}
                              className={`inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full text-sm transition cursor-pointer border border-transparent shadow hover:scale-105 ${
                                activeSlide.settings.cta1.style === "filled" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                              } ${
                                activeSlide.settings.cta1.style === "outline" ? "border-white/40 hover:bg-white/10 text-white" : ""
                              } ${
                                activeSlide.settings.cta1.style === "ghost" ? "hover:bg-white/10 text-white" : ""
                              } ${
                                activeSlide.settings.cta1.style === "gradient" ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white" : ""
                              }`}
                            >
                              {activeSlide.settings.cta1.text} <ChevronRight className="size-4" />
                            </div>
                          )}
                          {activeSlide.settings.cta2.show && (
                            <div
                              onClick={() => setSelectedElement("cta")}
                              className={`inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full text-sm transition cursor-pointer border border-transparent shadow hover:scale-105 ${
                                activeSlide.settings.cta2.style === "filled" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
                              } ${
                                activeSlide.settings.cta2.style === "outline" ? "border-white/40 hover:bg-white/10 text-white" : ""
                              } ${
                                activeSlide.settings.cta2.style === "ghost" ? "hover:bg-white/10 text-white" : ""
                              } ${
                                activeSlide.settings.cta2.style === "gradient" ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white" : ""
                              }`}
                            >
                              {activeSlide.settings.cta2.text}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Homepage Search Widget block */}
                      {activeSlide.settings.searchBar.show && (
                        <div
                          onClick={() => setSelectedElement("searchBar")}
                          className={`flex items-stretch bg-white rounded-full p-1.5 shadow-lg max-w-lg gap-2 text-zinc-800 cursor-pointer border ${
                            selectedElement === "searchBar" ? "border-emerald-500 ring-2 ring-emerald-500/40" : "border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 px-3 border-r border-zinc-100 shrink-0">
                            <MapPin className="size-4 text-emerald-600" />
                            <span className="text-xs font-extrabold">Semarang</span>
                          </div>
                          <div className="flex-1 flex items-center gap-2 px-3">
                            <Search className="size-4 text-zinc-400 shrink-0" />
                            <input
                              disabled
                              placeholder={activeSlide.settings.searchBar.placeholder}
                              className="w-full bg-transparent text-xs outline-none text-zinc-700"
                            />
                          </div>
                          <div className="bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-full flex items-center shrink-0">
                            Cari
                          </div>
                        </div>
                      )}

                      {/* Interactive Counter widgets */}
                      {activeSlide.settings.stats.show && (
                        <div
                          onClick={() => setSelectedElement("stats")}
                          className={`pt-6 border-t border-white/10 grid grid-cols-3 gap-6 cursor-pointer border ${
                            selectedElement === "stats" ? "border-emerald-500 ring-2 ring-emerald-500/40" : "border-transparent"
                          }`}
                        >
                          {activeSlide.settings.stats.items.map((stat, i) => (
                            <div key={i} className="text-center sm:text-left">
                              <p className="text-xl sm:text-2xl font-black">{stat.value}</p>
                              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">{stat.label}</p>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-zinc-500 text-center py-20 bg-zinc-950 p-10 border border-zinc-900 rounded-3xl">
                <Layout className="size-12 mx-auto text-zinc-700 mb-3" />
                Tidak ada slide yang aktif.
              </div>
            )}
          </div>
        </main>

        {/* ─── Right Sidebar: Accordion Properties Inspector ───────────────── */}
        <aside className="w-96 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0 overflow-y-auto">
          {/* Inspector Header */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
            <h3 className="text-xs font-extrabold tracking-wider uppercase flex items-center gap-2 text-white">
              <Settings2 className="size-4 text-emerald-400" />
              Inspector Panel
            </h3>
            <span className="text-[9px] font-bold bg-zinc-850 px-2 py-0.5 rounded text-zinc-400 capitalize">
              {selectedElement} Selected
            </span>
          </div>

          <div className="p-4 space-y-4">
            {/* 1. Slide Config Panel */}
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4 space-y-3">
              <h4 className="text-xs font-black uppercase text-zinc-400 flex items-center gap-1.5">
                <FileText className="size-3.5 text-emerald-500" /> Slide Info
              </h4>
              
              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1">Slide Title</label>
                  <input
                    value={activeSlide?.settings.headline.text || ""}
                    onChange={(e) =>
                      updateActiveSlide((s) => ({
                        ...s,
                        settings: {
                          ...s.settings,
                          headline: { ...s.settings.headline, text: e.target.value },
                        },
                      }))
                    }
                    className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">Internal Name</label>
                    <input
                      value={activeSlide?.internal_name || ""}
                      onChange={(e) =>
                        updateActiveSlide((s) => ({
                          ...s,
                          internal_name: e.target.value,
                        }))
                      }
                      className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">Status</label>
                    <select
                      value={activeSlide?.status || "draft"}
                      onChange={(e) =>
                        updateActiveSlide((s) => ({
                          ...s,
                          status: e.target.value,
                        }))
                      }
                      className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 text-xs text-white focus:outline-none"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">Priority Score</label>
                    <input
                      type="number"
                      value={activeSlide?.priority_score || 0}
                      onChange={(e) =>
                        updateActiveSlide((s) => ({
                          ...s,
                          priority_score: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">Tags (Comma-separated)</label>
                    <input
                      value={activeSlide?.tags?.join(", ") || ""}
                      onChange={(e) =>
                        updateActiveSlide((s) => ({
                          ...s,
                          tags: e.target.value.split(",").map((t) => t.trim()),
                        }))
                      }
                      className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {activeSlide?.status === "scheduled" && (
                  <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-zinc-900 border border-zinc-800 animate-fade-in">
                    <div>
                      <label className="text-[8px] font-bold text-zinc-400 block mb-1">Start date</label>
                      <input
                        type="date"
                        value={activeSlide.start_date || ""}
                        onChange={(e) =>
                          updateActiveSlide((s) => ({ ...s, start_date: e.target.value }))
                        }
                        className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded px-1.5 text-[10px] text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-bold text-zinc-400 block mb-1">End date</label>
                      <input
                        type="date"
                        value={activeSlide.end_date || ""}
                        onChange={(e) =>
                          updateActiveSlide((s) => ({ ...s, end_date: e.target.value }))
                        }
                        className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded px-1.5 text-[10px] text-white outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Inspector Detail based on selected element */}
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4 space-y-4">
              <h4 className="text-xs font-black uppercase text-zinc-400 flex items-center gap-1.5">
                <Sliders className="size-3.5 text-emerald-500" /> Detail Inspector
              </h4>

              {/* Elements Selector Tabs inside Inspector */}
              <div className="grid grid-cols-4 gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-[10px]">
                {(["background", "headline", "buttons", "widgets"] as const).map((el) => (
                  <button
                    key={el}
                    onClick={() => setSelectedElement(el)}
                    className={`py-1.5 rounded-lg font-bold transition capitalize ${
                      selectedElement === el ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {el}
                  </button>
                ))}
              </div>

              {/* Background properties tab */}
              {selectedElement === "background" && activeSlide && (
                <div className="space-y-3 animate-fade-up">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">Bg Type</label>
                    <select
                      value={activeSlide.settings.background.type}
                      onChange={(e) =>
                        updateActiveSlide((s) => ({
                          ...s,
                          settings: {
                            ...s.settings,
                            background: { ...s.settings.background, type: e.target.value },
                          },
                        }))
                      }
                      className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 text-xs text-white focus:outline-none"
                    >
                      <option value="image">Image Background</option>
                      <option value="video">Video Background</option>
                      <option value="gradient">Gradient Background</option>
                      <option value="solid">Solid Color</option>
                    </select>
                  </div>

                  {/* Render solid bg options */}
                  {activeSlide.settings.background.type === "solid" && (
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1">Color HEX</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={activeSlide.settings.background.solidColor}
                          onChange={(e) =>
                            updateActiveSlide((s) => ({
                              ...s,
                              settings: {
                                ...s.settings,
                                background: { ...s.settings.background, solidColor: e.target.value },
                              },
                            }))
                          }
                          className="size-8 rounded border border-zinc-800 bg-transparent cursor-pointer shrink-0"
                        />
                        <input
                          value={activeSlide.settings.background.solidColor}
                          onChange={(e) =>
                            updateActiveSlide((s) => ({
                              ...s,
                              settings: {
                                ...s.settings,
                                background: { ...s.settings.background, solidColor: e.target.value },
                              },
                            }))
                          }
                          className="flex-1 h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Render gradient options */}
                  {activeSlide.settings.background.type === "gradient" && (
                    <div className="space-y-2 p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                      <div>
                        <label className="text-[9px] font-bold text-zinc-400 block mb-1">Gradient Type</label>
                        <select
                          value={activeSlide.settings.background.gradientType}
                          onChange={(e) =>
                            updateActiveSlide((s) => ({
                              ...s,
                              settings: {
                                ...s.settings,
                                background: { ...s.settings.background, gradientType: e.target.value },
                              },
                            }))
                          }
                          className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded text-xs text-white"
                        >
                          <option value="linear">Linear Gradient</option>
                          <option value="radial">Radial Gradient</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-zinc-400 block mb-0.5">Start Color</label>
                          <input
                            type="color"
                            value={activeSlide.settings.background.gradientColors[0]}
                            onChange={(e) =>
                              updateActiveSlide((s) => {
                                const colors = [...s.settings.background.gradientColors];
                                colors[0] = e.target.value;
                                return {
                                  ...s,
                                  settings: {
                                    ...s.settings,
                                    background: { ...s.settings.background, gradientColors: colors },
                                  },
                                };
                              })
                            }
                            className="w-full h-7 bg-transparent border border-zinc-800 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-zinc-400 block mb-0.5">End Color</label>
                          <input
                            type="color"
                            value={activeSlide.settings.background.gradientColors[1]}
                            onChange={(e) =>
                              updateActiveSlide((s) => {
                                const colors = [...s.settings.background.gradientColors];
                                colors[1] = e.target.value;
                                return {
                                  ...s,
                                  settings: {
                                    ...s.settings,
                                    background: { ...s.settings.background, gradientColors: colors },
                                  },
                                };
                              })
                            }
                            className="w-full h-7 bg-transparent border border-zinc-800 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render image options */}
                  {activeSlide.settings.background.type === "image" && (
                    <div className="space-y-3 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                      <div>
                        <label className="text-[9px] font-bold text-zinc-400 block mb-1">Image URL</label>
                        <input
                          value={activeSlide.settings.background.image}
                          onChange={(e) =>
                            updateActiveSlide((s) => ({
                              ...s,
                              settings: {
                                ...s.settings,
                                background: { ...s.settings.background, image: e.target.value },
                              },
                            }))
                          }
                          className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded text-xs px-2"
                        />
                      </div>

                      {/* Sliders adjustments */}
                      <div>
                        <div className="flex justify-between text-[9px] text-zinc-400 mb-0.5 font-bold">
                          <span>Brightness</span>
                          <span>{activeSlide.settings.background.brightness}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          value={activeSlide.settings.background.brightness}
                          onChange={(e) =>
                            updateActiveSlide((s) => ({
                              ...s,
                              settings: {
                                ...s.settings,
                                background: { ...s.settings.background, brightness: e.target.value },
                              },
                            }))
                          }
                          className="w-full accent-emerald-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[9px] text-zinc-400 mb-0.5 font-bold">
                          <span>Blur Strength</span>
                          <span>{activeSlide.settings.background.blur}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="15"
                          value={activeSlide.settings.background.blur}
                          onChange={(e) =>
                            updateActiveSlide((s) => ({
                              ...s,
                              settings: {
                                ...s.settings,
                                background: { ...s.settings.background, blur: e.target.value },
                              },
                            }))
                          }
                          className="w-full accent-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-zinc-400 block mb-0.5">Overlay Tint</label>
                          <input
                            type="color"
                            value={activeSlide.settings.background.overlayColor}
                            onChange={(e) =>
                              updateActiveSlide((s) => ({
                                ...s,
                                settings: {
                                  ...s.settings,
                                  background: { ...s.settings.background, overlayColor: e.target.value },
                                },
                              }))
                            }
                            className="w-full h-7 bg-transparent border border-zinc-800 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-zinc-400 block mb-0.5">Overlay Opacity ({activeSlide.settings.background.overlayOpacity}%)</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={activeSlide.settings.background.overlayOpacity}
                            onChange={(e) =>
                              updateActiveSlide((s) => ({
                                ...s,
                                settings: {
                                  ...s.settings,
                                  background: { ...s.settings.background, overlayOpacity: e.target.value },
                                },
                              }))
                            }
                            className="w-full mt-1.5 accent-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render video options */}
                  {activeSlide.settings.background.type === "video" && (
                    <div className="space-y-3 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                      <div>
                        <label className="text-[9px] font-bold text-zinc-400 block mb-1">YouTube / Direct Video URL</label>
                        <input
                          value={activeSlide.settings.background.videoUrl}
                          onChange={(e) =>
                            updateActiveSlide((s) => ({
                              ...s,
                              settings: {
                                ...s.settings,
                                background: { ...s.settings.background, videoUrl: e.target.value },
                              },
                            }))
                          }
                          placeholder="e.g. https://www.youtube.com/watch?v=..."
                          className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded text-xs px-2"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Headline properties tab */}
              {selectedElement === "headline" && activeSlide && (
                <div className="space-y-3 animate-fade-up">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">Headline Text</label>
                    <textarea
                      value={activeSlide.settings.headline.text}
                      onChange={(e) =>
                        updateActiveSlide((s) => ({
                          ...s,
                          settings: {
                            ...s.settings,
                            headline: { ...s.settings.headline, text: e.target.value },
                          },
                        }))
                      }
                      rows={3}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 block mb-0.5">Text Gradient</label>
                      <input
                        type="checkbox"
                        checked={activeSlide.settings.headline.gradientText}
                        onChange={(e) =>
                          updateActiveSlide((s) => ({
                            ...s,
                            settings: {
                              ...s.settings,
                              headline: { ...s.settings.headline, gradientText: e.target.checked },
                            },
                          }))
                        }
                        className="rounded border-zinc-800 text-emerald-500 accent-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 block mb-0.5">Drop Shadow</label>
                      <input
                        type="checkbox"
                        checked={activeSlide.settings.headline.textShadow}
                        onChange={(e) =>
                          updateActiveSlide((s) => ({
                            ...s,
                            settings: {
                              ...s.settings,
                              headline: { ...s.settings.headline, textShadow: e.target.checked },
                            },
                          }))
                        }
                        className="rounded border-zinc-800 text-emerald-500 accent-emerald-500"
                      />
                    </div>
                  </div>

                  {activeSlide.settings.headline.gradientText && (
                    <div className="grid grid-cols-2 gap-2 p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                      <div>
                        <label className="text-[8px] font-bold text-zinc-400 block">From</label>
                        <input
                          type="color"
                          value={activeSlide.settings.headline.gradientColors.from}
                          onChange={(e) =>
                            updateActiveSlide((s) => ({
                              ...s,
                              settings: {
                                ...s.settings,
                                headline: {
                                  ...s.settings.headline,
                                  gradientColors: { ...s.settings.headline.gradientColors, from: e.target.value },
                                },
                              },
                            }))
                          }
                          className="w-full h-6 bg-transparent border-none cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-bold text-zinc-400 block">To</label>
                        <input
                          type="color"
                          value={activeSlide.settings.headline.gradientColors.to}
                          onChange={(e) =>
                            updateActiveSlide((s) => ({
                              ...s,
                              settings: {
                                ...s.settings,
                                headline: {
                                  ...s.settings.headline,
                                  gradientColors: { ...s.settings.headline.gradientColors, to: e.target.value },
                                },
                              },
                            }))
                          }
                          className="w-full h-6 bg-transparent border-none cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Responsive headline font sizes */}
                  <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2">
                    <label className="text-[9px] font-extrabold text-zinc-400 block">Font Size (px)</label>
                    <div className="grid grid-cols-3 gap-1">
                      <div>
                        <span className="text-[8px] text-zinc-500 font-bold block mb-0.5">Desktop</span>
                        <input
                          type="number"
                          value={activeSlide.settings.headline.fontSize.desktop}
                          onChange={(e) =>
                            updateActiveSlide((s) => ({
                              ...s,
                              settings: {
                                ...s.settings,
                                headline: {
                                  ...s.settings.headline,
                                  fontSize: { ...s.settings.headline.fontSize, desktop: e.target.value },
                                },
                              },
                            }))
                          }
                          className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded text-xs text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] text-zinc-500 font-bold block mb-0.5">Tablet</span>
                        <input
                          type="number"
                          value={activeSlide.settings.headline.fontSize.tablet}
                          onChange={(e) =>
                            updateActiveSlide((s) => ({
                              ...s,
                              settings: {
                                ...s.settings,
                                headline: {
                                  ...s.settings.headline,
                                  fontSize: { ...s.settings.headline.fontSize, tablet: e.target.value },
                                },
                              },
                            }))
                          }
                          className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded text-xs text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] text-zinc-500 font-bold block mb-0.5">Mobile</span>
                        <input
                          type="number"
                          value={activeSlide.settings.headline.fontSize.mobile}
                          onChange={(e) =>
                            updateActiveSlide((s) => ({
                              ...s,
                              settings: {
                                ...s.settings,
                                headline: {
                                  ...s.settings.headline,
                                  fontSize: { ...s.settings.headline.fontSize, mobile: e.target.value },
                                },
                              },
                            }))
                          }
                          className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded text-xs text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">Subheadline / Description</label>
                    <textarea
                      value={activeSlide.settings.subheadline.text}
                      onChange={(e) =>
                        updateActiveSlide((s) => ({
                          ...s,
                          settings: {
                            ...s.settings,
                            subheadline: { ...s.settings.subheadline, text: e.target.value },
                          },
                        }))
                      }
                      rows={2}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Buttons properties tab */}
              {selectedElement === "buttons" && activeSlide && (
                <div className="space-y-4 animate-fade-up">
                  <div className="space-y-2.5 p-3.5 bg-zinc-900 rounded-2xl border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-white">CTA Button 1</label>
                      <input
                        type="checkbox"
                        checked={activeSlide.settings.cta1.show}
                        onChange={(e) =>
                          updateActiveSlide((s) => ({
                            ...s,
                            settings: {
                              ...s.settings,
                              cta1: { ...s.settings.cta1, show: e.target.checked },
                            },
                          }))
                        }
                        className="accent-emerald-500"
                      />
                    </div>

                    {activeSlide.settings.cta1.show && (
                      <div className="space-y-2 pt-2 border-t border-zinc-800 animate-fade-in">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[9px] font-bold text-zinc-400 block mb-0.5">Label</span>
                            <input
                              value={activeSlide.settings.cta1.text}
                              onChange={(e) =>
                                updateActiveSlide((s) => ({
                                  ...s,
                                  settings: {
                                    ...s.settings,
                                    cta1: { ...s.settings.cta1, text: e.target.value },
                                  },
                                }))
                              }
                              className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded text-xs px-2"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-zinc-400 block mb-0.5">Link / Target</span>
                            <input
                              value={activeSlide.settings.cta1.link}
                              onChange={(e) =>
                                updateActiveSlide((s) => ({
                                  ...s,
                                  settings: {
                                    ...s.settings,
                                    cta1: { ...s.settings.cta1, link: e.target.value },
                                  },
                                }))
                              }
                              className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded text-xs px-2"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[9px] font-bold text-zinc-400 block mb-0.5">Style</span>
                            <select
                              value={activeSlide.settings.cta1.style}
                              onChange={(e) =>
                                updateActiveSlide((s) => ({
                                  ...s,
                                  settings: {
                                    ...s.settings,
                                    cta1: { ...s.settings.cta1, style: e.target.value },
                                  },
                                }))
                              }
                              className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded text-xs px-1"
                            >
                              <option value="filled">Filled (Solid)</option>
                              <option value="outline">Outline</option>
                              <option value="ghost">Ghost</option>
                              <option value="gradient">Gradient Accent</option>
                            </select>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-zinc-400 block mb-0.5">Hover Effect</span>
                            <select
                              value={activeSlide.settings.cta1.hoverEffect}
                              onChange={(e) =>
                                updateActiveSlide((s) => ({
                                  ...s,
                                  settings: {
                                    ...s.settings,
                                    cta1: { ...s.settings.cta1, hoverEffect: e.target.value },
                                  },
                                }))
                              }
                              className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded text-xs px-1"
                            >
                              <option value="none">Normal</option>
                              <option value="scale">Grow Scale</option>
                              <option value="glow">Glow effect</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 p-3.5 bg-zinc-900 rounded-2xl border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-white">CTA Button 2</label>
                      <input
                        type="checkbox"
                        checked={activeSlide.settings.cta2.show}
                        onChange={(e) =>
                          updateActiveSlide((s) => ({
                            ...s,
                            settings: {
                              ...s.settings,
                              cta2: { ...s.settings.cta2, show: e.target.checked },
                            },
                          }))
                        }
                        className="accent-emerald-500"
                      />
                    </div>

                    {activeSlide.settings.cta2.show && (
                      <div className="space-y-2 pt-2 border-t border-zinc-800 animate-fade-in">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[9px] font-bold text-zinc-400 block mb-0.5">Label</span>
                            <input
                              value={activeSlide.settings.cta2.text}
                              onChange={(e) =>
                                updateActiveSlide((s) => ({
                                  ...s,
                                  settings: {
                                    ...s.settings,
                                    cta2: { ...s.settings.cta2, text: e.target.value },
                                  },
                                }))
                              }
                              className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded text-xs px-2"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-zinc-400 block mb-0.5">Link / Target</span>
                            <input
                              value={activeSlide.settings.cta2.link}
                              onChange={(e) =>
                                updateActiveSlide((s) => ({
                                  ...s,
                                  settings: {
                                    ...s.settings,
                                    cta2: { ...s.settings.cta2, link: e.target.value },
                                  },
                                }))
                              }
                              className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded text-xs px-2"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Widgets properties tab */}
              {selectedElement === "widgets" && activeSlide && (
                <div className="space-y-4 animate-fade-up">
                  <div className="space-y-2 p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-white">Homepage Search Box</label>
                      <input
                        type="checkbox"
                        checked={activeSlide.settings.searchBar.show}
                        onChange={(e) =>
                          updateActiveSlide((s) => ({
                            ...s,
                            settings: {
                              ...s.settings,
                              searchBar: { ...s.settings.searchBar, show: e.target.checked },
                            },
                          }))
                        }
                        className="accent-emerald-500"
                      />
                    </div>

                    {activeSlide.settings.searchBar.show && (
                      <div className="space-y-2 pt-2 border-t border-zinc-800 animate-fade-in">
                        <div>
                          <span className="text-[9px] font-bold text-zinc-400 block mb-0.5">Placeholder</span>
                          <input
                            value={activeSlide.settings.searchBar.placeholder}
                            onChange={(e) =>
                              updateActiveSlide((s) => ({
                                ...s,
                                settings: {
                                  ...s.settings,
                                  searchBar: { ...s.settings.searchBar, placeholder: e.target.value },
                                },
                              }))
                            }
                            className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded text-xs px-2"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-white">Statistics Counters</label>
                      <input
                        type="checkbox"
                        checked={activeSlide.settings.stats.show}
                        onChange={(e) =>
                          updateActiveSlide((s) => ({
                            ...s,
                            settings: {
                              ...s.settings,
                              stats: { ...s.settings.stats, show: e.target.checked },
                            },
                          }))
                        }
                        className="accent-emerald-500"
                      />
                    </div>

                    {activeSlide.settings.stats.show && (
                      <div className="space-y-2.5 pt-2 border-t border-zinc-800 animate-fade-in">
                        {activeSlide.settings.stats.items.map((stat, i) => (
                          <div key={i} className="grid grid-cols-2 gap-2 bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                            <div>
                              <span className="text-[8px] text-zinc-500 font-bold block mb-0.5">Value</span>
                              <input
                                value={stat.value}
                                onChange={(e) =>
                                  updateActiveSlide((s) => {
                                    const items = [...s.settings.stats.items];
                                    items[i].value = e.target.value;
                                    return {
                                      ...s,
                                      settings: {
                                        ...s.settings,
                                        stats: { ...s.settings.stats, items },
                                      },
                                    };
                                  })
                                }
                                className="w-full h-6 bg-zinc-900 border border-zinc-800 rounded text-center text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[8px] text-zinc-500 font-bold block mb-0.5">Label</span>
                              <input
                                value={stat.label}
                                onChange={(e) =>
                                  updateActiveSlide((s) => {
                                    const items = [...s.settings.stats.items];
                                    items[i].label = e.target.value;
                                    return {
                                      ...s,
                                      settings: {
                                        ...s.settings,
                                        stats: { ...s.settings.stats, items },
                                      },
                                    };
                                  })
                                }
                                className="w-full h-6 bg-zinc-900 border border-zinc-800 rounded text-center text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. AI Assistant Trigger Widget */}
            <div className="bg-zinc-950 rounded-2xl border border-zinc-850 p-4 space-y-3 bg-gradient-to-br from-zinc-950 to-zinc-900 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2">
                <Sparkles className="size-6 text-emerald-500/20" />
              </div>
              <h4 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-emerald-400" /> AI Content Assistant
              </h4>
              <p className="text-[10px] text-zinc-400 leading-normal">
                Gunakan AI untuk menghasilkan judul banner, deskripsi kampanye, SEO, dan kata kunci relevan.
              </p>
              <button
                onClick={() => setShowAiModal(true)}
                className="w-full h-8 bg-zinc-900 hover:bg-zinc-850 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
              >
                Generate Hero dengan AI
              </button>
            </div>

            {/* 4. A/B Testing Report Dashboard */}
            {activeSlide && (
              <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4 space-y-3">
                <h4 className="text-xs font-black uppercase text-zinc-400 flex items-center gap-1.5">
                  <BarChart2 className="size-3.5 text-emerald-500" /> Heatmap & conversion
                </h4>
                <div className="text-[10px] text-zinc-400 space-y-2">
                  <div className="flex justify-between">
                    <span>Views (A/B Test)</span>
                    <span className="font-bold text-white">
                      {abMetrics[activeSlide.internal_name as keyof typeof abMetrics]?.views || 4500}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clicks (CTA)</span>
                    <span className="font-bold text-white">
                      {abMetrics[activeSlide.internal_name as keyof typeof abMetrics]?.clicks || 220}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversion Rate</span>
                    <span className="font-bold text-emerald-400">
                      {abMetrics[activeSlide.internal_name as keyof typeof abMetrics]?.cr || "4.8%"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Revision log list */}
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4 space-y-3">
              <h4 className="text-xs font-black uppercase text-zinc-400 flex items-center gap-1.5">
                <RotateCcw className="size-3.5 text-emerald-500" /> Revision History
              </h4>
              <div className="space-y-1.5">
                {revisions.map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => {
                      toast.success(`Mengembalikan ke revisi: ${rev.time}`);
                    }}
                    className="p-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:border-emerald-500 cursor-pointer transition text-[9px] flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-white">{rev.time}</p>
                      <p className="text-zinc-500">{rev.author}</p>
                    </div>
                    <span className="text-[8px] text-emerald-500 font-extrabold uppercase">Rollback</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ─── AI Modal Dialog ────────────────────────────────────────────────── */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-6 space-y-4 text-zinc-300">
            <header className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-white text-base flex items-center gap-1.5">
                  <Sparkles className="size-5 text-emerald-400" />
                  Generate Hero Banner dengan AI
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Optimalkan Headline & SEO slide menggunakan modul kecerdasan buatan.</p>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1">Nama Portal / Brand</label>
                <input
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                  className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1">Target Pengguna</label>
                <input
                  value={aiTarget}
                  onChange={(e) => setAiTarget(e.target.value)}
                  className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1">Tujuan Kampanye</label>
                <textarea
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <footer className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 h-9 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleGenerateAiHero}
                disabled={isAiLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 h-9 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    Buat Sekarang
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sortable Sidebar Item Component ──────────────────────────────────────────
function SortableItem({
  slide,
  isSelected,
  onClick,
  onDuplicate,
  onArchive,
  onDelete,
  index,
}: {
  slide: HeroSlideRow;
  isSelected: boolean;
  onClick: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  index: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`group flex items-start gap-2.5 p-3 rounded-2xl border text-left cursor-pointer transition ${
        isSelected
          ? "bg-zinc-800/80 border-emerald-500/40 text-white"
          : "bg-zinc-900/60 border-zinc-850 hover:bg-zinc-800/40 text-zinc-300"
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-zinc-600 hover:text-zinc-400 active:cursor-grabbing p-1 rounded hover:bg-zinc-800 shrink-0"
      >
        <GripVertical className="size-4" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-[10px] text-zinc-500 bg-zinc-950 size-5 rounded-full flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <p className="font-bold text-xs truncate flex-1 text-white">{slide.internal_name}</p>
        </div>

        <p className="text-[10px] text-zinc-500 line-clamp-1 italic px-1">
          Headline: {slide.settings.headline.text}
        </p>

        <div className="flex items-center gap-1.5 flex-wrap pt-1 px-1">
          <span
            className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
              slide.status === "published" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : ""
            } ${slide.status === "draft" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : ""} ${
              slide.status === "scheduled" ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : ""
            } ${slide.status === "archived" ? "bg-zinc-700/25 text-zinc-500 border border-zinc-800" : ""}`}
          >
            {slide.status}
          </span>
          <span className="text-[8px] text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850">
            Score: {slide.priority_score}
          </span>
        </div>
      </div>

      {/* Slide Deck quick action tools */}
      <div className="hidden group-hover:flex flex-col gap-1 items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0 animate-fade-in">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition"
          title="Duplicate slide"
        >
          <Copy className="size-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
          className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition"
          title={slide.status === "archived" ? "Restore" : "Archive"}
        >
          <Archive className="size-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-red-500 hover:text-red-400 rounded hover:bg-zinc-800 transition"
          title="Delete slide"
        >
          <Trash2 className="size-3" />
        </button>
      </div>
    </div>
  );
}
