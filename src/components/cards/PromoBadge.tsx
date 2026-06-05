import { Flame, Tag, Sparkles } from "lucide-react";

export type PromoType = "promo" | "diskon" | "lainnya" | null | undefined;

interface Props {
  type: PromoType;
  text?: string | null;
  /** ISO timestamp. If set and in the past, the badge does not render. */
  expiresAt?: string | null;
  /** Compact = pill for card overlays. Inline = chip for content rows. */
  variant?: "compact" | "inline";
}

/** True when the promo has an expires_at that is already in the past. */
export function isPromoExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const ts = Date.parse(expiresAt);
  if (!Number.isFinite(ts)) return false;
  return ts < Date.now();
}

const PRESETS: Record<NonNullable<PromoType>, {
  defaultLabel: string;
  bg: string;
  text: string;
  ring: string;
  icon: typeof Flame;
}> = {
  promo: {
    defaultLabel: "PROMO",
    bg: "bg-red-500",
    text: "text-white",
    ring: "ring-red-200",
    icon: Flame,
  },
  diskon: {
    defaultLabel: "DISKON",
    bg: "bg-orange-500",
    text: "text-white",
    ring: "ring-orange-200",
    icon: Tag,
  },
  lainnya: {
    defaultLabel: "PENAWARAN",
    bg: "bg-amber-400",
    text: "text-amber-950",
    ring: "ring-amber-200",
    icon: Sparkles,
  },
};

export function PromoBadge({ type, text, expiresAt, variant = "compact" }: Props) {
  if (!type) return null;
  if (isPromoExpired(expiresAt)) return null;
  const preset = PRESETS[type];
  if (!preset) return null;
  const Icon = preset.icon;
  const label = (text?.trim() || preset.defaultLabel).toUpperCase();

  if (variant === "inline") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider ${preset.bg} ${preset.text}`}
      >
        <Icon className="size-2.5" />
        {label}
      </span>
    );
  }

  // compact (default): pill suitable for card image overlay
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black tracking-wider shadow-md ring-2 ${preset.bg} ${preset.text} ${preset.ring}`}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}
