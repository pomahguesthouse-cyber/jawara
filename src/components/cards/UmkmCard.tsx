import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";

export interface UmkmCardData {
  id: string;
  slug: string;
  name: string;
  city: string;
  logo_url: string | null;
  rating: number | null;
  is_verified?: boolean;
  product_count?: number;
}

export function UmkmCard({ umkm }: { umkm: UmkmCardData }) {
  const initials = umkm.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <Link
      to="/umkm/$slug"
      params={{ slug: umkm.slug }}
      className="group bg-card p-5 rounded-2xl border border-border hover:shadow-lift hover:-translate-y-0.5 transition-all flex items-start gap-4"
    >
      <div className="size-14 shrink-0 rounded-full bg-primary-soft text-primary grid place-items-center font-bold ring-1 ring-border overflow-hidden">
        {umkm.logo_url ? (
          <img src={umkm.logo_url} alt={umkm.name} className="size-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">
            {umkm.name}
          </h3>
          {umkm.rating != null && (
            <span className="shrink-0 inline-flex items-center gap-0.5 text-xs font-bold text-warm-foreground bg-warm/15 px-1.5 py-0.5 rounded">
              <Star className="size-3 fill-warm text-warm" />
              {Number(umkm.rating).toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <MapPin className="size-3" /> {umkm.city}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {umkm.is_verified && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-soft text-primary">
              Terverifikasi
            </span>
          )}
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {umkm.product_count ?? 0} Produk
          </span>
        </div>
      </div>
    </Link>
  );
}
