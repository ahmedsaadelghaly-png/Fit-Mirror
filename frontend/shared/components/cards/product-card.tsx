"use client";

import { cn } from "@/lib/utils";
import { ResolvedImage } from "@/shared/components/resolved-image";

export interface ProductCardProps {
  imageKey: string | null | undefined;
  alt: string;
  name: string;
  /** Brand/store name, category, or other single supporting line. */
  subtitle?: string;
  /** Pre-formatted price string (currency formatting is the caller's concern). */
  price?: string;
  /** Status/moderation chip — active, out of stock, archived, etc. */
  badge?: React.ReactNode;
  /** Revealed on hover/focus over the image — delete/edit affordances. */
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Garment-on-white product photography, name, and price — catalog grids
 * on the Shopper shopping surface and Brand product catalog. Product
 * photography sits full-bleed above quiet, small-caps-weight metadata:
 * the photo is the primary signal, price/name are secondary reference
 * text, never competing headline typography — see
 * docs/frontend/DESIGN_SYSTEM.md "Fashion-specific components".
 */
function ProductCard({
  imageKey,
  alt,
  name,
  subtitle,
  price,
  badge,
  actions,
  onClick,
  className,
}: ProductCardProps) {
  const interactive = Boolean(onClick);

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn("group flex flex-col gap-3", interactive && "cursor-pointer", className)}
    >
      <div className="relative overflow-hidden rounded-md bg-muted">
        <ResolvedImage
          imageKey={imageKey}
          alt={alt}
          className={cn(
            "aspect-square w-full transition-transform duration-500 ease-signature",
            interactive && "group-hover:scale-[1.04]",
          )}
        />
        {/* Solid backing: translucent chips are unreadable over light photos. */}
        {badge && (
          <div className="absolute left-2.5 top-2.5 rounded-full bg-background/90 shadow-sm backdrop-blur">
            {badge}
          </div>
        )}
        {actions && (
          <div className="absolute bottom-2.5 right-2.5 flex gap-1.5 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">
            {actions}
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {price && <span className="shrink-0 font-mono text-sm text-foreground">{price}</span>}
      </div>
    </div>
  );
}

export { ProductCard };
