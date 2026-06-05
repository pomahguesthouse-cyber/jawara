import { Link } from "@tanstack/react-router";
import { PromoBadge, type PromoType } from "./PromoBadge";
import { PromoPrice } from "./PromoPrice";

function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v|ogv)$/.test(clean);
}

export interface ProductCardData {
  id: string;
  name: string;
  price: number | string;
  image_url: string | null;
  umkm?: { name: string; slug: string } | null;
  category_name?: string | null;
  promo_type?: PromoType;
  promo_text?: string | null;
  promo_expires_at?: string | null;
  original_price?: number | string | null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <div className="group">
      <div className="relative aspect-[4/5] w-full rounded-2xl bg-muted overflow-hidden ring-1 ring-border mb-3">
        {product.promo_type && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <PromoBadge
              type={product.promo_type}
              text={product.promo_text}
              expiresAt={product.promo_expires_at}
            />
          </div>
        )}
        {product.image_url ? (
          isVideoUrl(product.image_url) ? (
            <video
              src={product.image_url}
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
              className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )
        ) : (
          <div className="size-full grid place-items-center text-muted-foreground text-xs uppercase tracking-wider">
            Tanpa Foto
          </div>
        )}
      </div>
      {product.category_name && (
        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
          {product.category_name}
        </p>
      )}
      <h3 className="text-sm font-semibold line-clamp-2 mb-1">{product.name}</h3>
      <PromoPrice
        price={product.price}
        originalPrice={product.original_price}
        expiresAt={product.promo_expires_at}
      />
      {product.umkm && (
        <Link
          to="/umkm/$slug"
          params={{ slug: product.umkm.slug }}
          className="text-[11px] text-muted-foreground hover:text-primary mt-1 inline-block"
        >
          oleh {product.umkm.name}
        </Link>
      )}
    </div>
  );
}
