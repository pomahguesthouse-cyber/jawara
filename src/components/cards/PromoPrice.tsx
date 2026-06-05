import { formatRupiah } from "@/lib/format";
import { isPromoExpired } from "./PromoBadge";

interface Props {
  price: number | string;
  originalPrice?: number | string | null;
  /** When the original price is only valid until a date. Past expiry hides
   *  the strikethrough (the product reverts to its normal price visually). */
  expiresAt?: string | null;
  className?: string;
  /** Tailwind classes applied to the current (post-discount) price. */
  priceClass?: string;
  /** Tailwind classes applied to the strikethrough number. */
  originalClass?: string;
}

/**
 * Renders the current price and, when there is an active original price
 * higher than the current price, a strikethrough "was X" next to it plus
 * the calculated percent saved.
 */
export function PromoPrice({
  price,
  originalPrice,
  expiresAt,
  className = "",
  priceClass = "text-sm font-bold text-foreground",
  originalClass = "text-xs text-muted-foreground line-through",
}: Props) {
  const current = Number(price) || 0;
  const original = Number(originalPrice) || 0;
  const showOriginal =
    original > current && !isPromoExpired(expiresAt);

  const percentOff = showOriginal
    ? Math.round(((original - current) / original) * 100)
    : 0;

  return (
    <div className={`flex items-baseline gap-1.5 flex-wrap ${className}`}>
      <span className={priceClass}>{formatRupiah(current)}</span>
      {showOriginal && (
        <>
          <span className={originalClass}>{formatRupiah(original)}</span>
          {percentOff > 0 && (
            <span className="text-[10px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
              -{percentOff}%
            </span>
          )}
        </>
      )}
    </div>
  );
}
