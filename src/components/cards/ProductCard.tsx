import { Link } from "@tanstack/react-router";
import { formatRupiah } from "@/lib/format";

export interface ProductCardData {
  id: string;
  name: string;
  price: number | string;
  image_url: string | null;
  umkm?: { name: string; slug: string } | null;
  category_name?: string | null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <div className="group">
      <div className="aspect-[4/5] w-full rounded-2xl bg-muted overflow-hidden ring-1 ring-border mb-3">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
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
      <p className="text-sm font-bold text-foreground">{formatRupiah(product.price)}</p>
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
