import { Link } from "@tanstack/react-router";
import { MapPin, Star, BadgeCheck, Heart, ChevronRight } from "lucide-react";
import { useState } from "react";

export interface UmkmCardData {
  id: string;
  slug: string;
  name: string;
  city: string;
  logo_url: string | null;
  banner_url?: string | null;
  rating: number | null;
  is_verified?: boolean;
  product_count?: number;
  review_count?: number | null;
  category_name?: string | null;
}

export function UmkmCard({ umkm }: { umkm: UmkmCardData }) {
  const [liked, setLiked] = useState(false);
  const initials = umkm.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div className="bg-white rounded-2xl overflow-hidden ring-1 ring-gray-100 hover:shadow-lg transition-shadow duration-200 flex flex-col">
      {/* ── Image Banner ── */}
      <div className="relative h-44 bg-gray-100 overflow-hidden">
        {umkm.banner_url ? (
          <img
            src={umkm.banner_url}
            alt={`Banner ${umkm.name}`}
            className="size-full object-cover"
          />
        ) : umkm.logo_url ? (
          <>
            <img src={umkm.logo_url} alt="" className="absolute inset-0 size-full object-cover scale-110 blur-lg opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 to-green-600/20" />
          </>
        ) : (
          <div className="size-full bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center">
            <span className="text-5xl font-black text-green-200">{initials}</span>
          </div>
        )}

        {/* Rating badge */}
        {umkm.rating != null && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
            <Star className="size-3 fill-white text-white" />
            {Number(umkm.rating).toFixed(1)}
          </div>
        )}

        {/* Heart button */}
        <button
          onClick={(e) => { e.preventDefault(); setLiked((v) => !v); }}
          className="absolute top-3 right-3 size-7 rounded-full bg-white/90 flex items-center justify-center shadow hover:scale-110 transition"
        >
          <Heart className={`size-3.5 ${liked ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
        </button>

        {/* Logo overlay */}
        {umkm.logo_url ? (
          <div className="absolute bottom-3 left-3 size-11 rounded-full ring-2 ring-white bg-white overflow-hidden shadow-md">
            <img src={umkm.logo_url} alt={umkm.name} className="size-full object-cover" />
          </div>
        ) : (
          <div className="absolute bottom-3 left-3 size-11 rounded-full ring-2 ring-white bg-[#1a6b3c] flex items-center justify-center shadow-md">
            <span className="text-sm font-bold text-white">{initials}</span>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Name + verified */}
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-sm text-gray-900 truncate leading-snug flex-1">{umkm.name}</h3>
          {umkm.is_verified && <BadgeCheck className="size-4 shrink-0 text-[#1a6b3c]" />}
        </div>

        {/* Location */}
        <p className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{umkm.city}</span>
        </p>

        {/* Star row */}
        {umkm.rating != null && (
          <div className="flex items-center gap-1 flex-wrap">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`size-3 ${s <= Math.round(Number(umkm.rating)) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
              />
            ))}
            <span className="text-xs font-bold text-gray-800 ml-0.5">{Number(umkm.rating).toFixed(1)}</span>
            {umkm.review_count != null && (
              <span className="text-[11px] text-gray-400">({umkm.review_count} ulasan)</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {umkm.category_name && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-[#1a6b3c] truncate max-w-[80px]">
                {umkm.category_name}
              </span>
            )}
            <span className="text-[10px] text-gray-400 shrink-0">{umkm.product_count ?? 0} Produk</span>
          </div>
          <Link
            to="/umkm/$slug"
            params={{ slug: umkm.slug }}
            className="shrink-0 text-xs font-bold text-[#1a6b3c] hover:underline flex items-center gap-0.5"
          >
            Lihat Profil <ChevronRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
