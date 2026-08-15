"use client";

import { cn } from "@/lib/utils";
import { ResolvedImage } from "@/shared/components/resolved-image";

export interface LookCardProps {
  /** Storage key for the look/outfit photo — resolved via `ResolvedImage`. */
  imageKey: string | null | undefined;
  alt: string;
  title?: string;
  /** Small line under the title — occasion, season, garment count, etc. */
  meta?: string;
  /** Top-right overlay slot — a favorite toggle, status chip, etc. */
  badge?: React.ReactNode;
  /** Revealed on hover/focus over the image — save/share/retry actions. */
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * The image-dominant card for a single styled photo — saved looks, AI
 * Stylist outfit suggestions, try-on results in a gallery. Caption sits
 * as a gradient overlay at the foot of the image rather than in a
 * separate white content block below it, so the photography reads as the
 * content, not a thumbnail next to the content — see
 * docs/frontend/DESIGN_SYSTEM.md "Fashion-specific components".
 *
 * A generic presentational primitive: no `SavedLook`/domain typing here,
 * so it composes equally for saved looks (Stage 5) and stylist
 * suggestions (Stage 6) — callers map their own data into these props.
 */
function LookCard({ imageKey, alt, title, meta, badge, actions, onClick, className }: LookCardProps) {
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
      className={cn(
        "group relative overflow-hidden rounded-md bg-muted",
        interactive && "cursor-pointer",
        className,
      )}
    >
      <ResolvedImage
        imageKey={imageKey}
        alt={alt}
        className={cn(
          "aspect-[3/4] w-full transition-transform duration-500 ease-signature",
          interactive && "group-hover:scale-[1.03]",
        )}
      />

      {badge && <div className="absolute right-2.5 top-2.5">{badge}</div>}

      {(title || meta) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/85 via-foreground/25 to-transparent p-4 pt-10">
          {title && (
            <p className="truncate font-display text-sm font-medium text-background">{title}</p>
          )}
          {meta && <p className="truncate text-xs text-background/70">{meta}</p>}
        </div>
      )}

      {actions && (
        <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          {actions}
        </div>
      )}
    </div>
  );
}

export { LookCard };
