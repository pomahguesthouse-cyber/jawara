import { Link } from "@tanstack/react-router";
import { MapPin, Star, BadgeCheck } from "lucide-react";

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
}

export function UmkmCard({ umkm }: { umkm: UmkmCardData }) {
  const initials = umkm.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Link
      to="/umkm/$slug"
      params={{ slug: umkm.slug }}
      className="group bg-card rounded-2xl border border-border hover:shadow-lift hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* ── Banner ── */}
      <div className="relative h-36 w-full overflow-hidden bg-primary-soft">
        {umkm.banner_url ? (
          <img
            src={umkm.banner_url}
            alt={`Banner ${umkm.name}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : umkm.logo_url ? (
          /* pakai logo sebagai background blur jika tidak ada banner */
          <>
            <img
              src={umkm.logo_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-primary-soft" />
            <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-primary/60 select-none">
              {initials}
            </span>
          </>
        ) : (
          /* fallback gradient murni */
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary-soft" />
            <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-primary/50 select-none">
              {initials}
            </span>
          </>
        )}

        {/* Rating badge di pojok kanan atas */}
        {umkm.rating != null && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 text-xs font-bold bg-black/60 text-yellow-300 px-2 py-0.5 rounded-full backdrop-blur-sm">
            <Star className="size-3 fill-yellow-300 text-yellow-300" />
            {Number(umkm.rating).toFixed(1)}
          </span>
        )}

        {/* Logo kecil di pojok kiri bawah (overlay di atas banner) */}
        {umkm.logo_url && (
          <div className="absolute bottom-2 left-2 size-10 rounded-full ring-2 ring-white/80 bg-white overflow-hidden shadow-md">
            <img src={umkm.logo_url} alt={umkm.name} className="size-full object-cover" />
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-4 flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-sm leading-snug truncate group-hover:text-primary transition-colors flex-1">
            {umkm.name}
          </h3>
          {umkm.is_verified && (
            <BadgeCheck className="size-4 shrink-0 text-primary" />
          )}
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{umkm.city}</span>
        </p>

        <span className="mt-2 self-start text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {umkm.product_count ?? 0} Produk
        </span>
      </div>
    </Link>
  );
}
