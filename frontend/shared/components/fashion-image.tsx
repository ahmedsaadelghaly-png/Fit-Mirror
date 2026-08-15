import { Shirt } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Aspect-ratio presets used consistently across every fashion-imagery
 * surface in the product — one vocabulary instead of ad-hoc `aspect-[..]`
 * values scattered per page. See docs/frontend/ASSETS.md for which preset
 * each real photography slot should be shot for.
 */
const ASPECT_PRESETS = {
  /** Garment-on-white product shots (catalog, wardrobe, product cards). */
  square: "aspect-square",
  /** Model/try-on portrait photography (look cards, stylist, try-on canvas). */
  portrait: "aspect-[3/4]",
  /** Standard content photography (brand dashboard tiles, galleries). */
  landscape: "aspect-[4/3]",
  /** Wide supporting imagery (section banners, mosaics). */
  wide: "aspect-[16/9]",
  /** Cinematic editorial banners (landing hero, section dividers). */
  editorial: "aspect-[21/9]",
} as const;

export type FashionImageAspect = keyof typeof ASPECT_PRESETS;

export interface FashionImageProps {
  /** Static asset path under `public/images/...`, or omit to render the placeholder. */
  src?: string | null;
  alt: string;
  aspect?: FashionImageAspect;
  fit?: "cover" | "contain";
  className?: string;
}

/**
 * Static fashion/editorial imagery primitive — for design-time assets
 * under `public/images/` (marketing, editorial, empty-state art), NOT for
 * user data. Dynamic, storage-key-backed content (wardrobe items, try-on
 * results, product photos) still goes through `ResolvedImage`
 * (shared/components/resolved-image.tsx), which resolves an S3 key rather
 * than pointing at a static path — the two are complementary, not
 * redundant.
 *
 * Deliberately a plain `<img>`, not `next/image`, matching
 * `ResolvedImage`'s convention — keeps this Storybook-safe under the
 * Vite-based runner (see docs/frontend/STORYBOOK.md) and framework-
 * agnostic. Static assets under `public/` don't need next/image's
 * optimization pipeline as urgently as remote content would.
 *
 * With no `src`, renders a tasteful abstract placeholder (not a broken
 * image icon) — see docs/frontend/ASSETS.md for the full shot list this
 * stands in for. The small corner marker only renders outside production
 * builds, so it's a development signal, never a customer-facing "missing
 * asset" tell.
 */
function FashionImage({ src, alt, aspect = "square", fit = "cover", className }: FashionImageProps) {
  if (!src) {
    // An empty `alt` means the caller intends this as decorative — mark
    // it `aria-hidden` instead of `role="img" aria-label=""`, which is a
    // WCAG violation (an element with `role="img"` must have a non-empty
    // accessible name, same rule that makes `<img alt="">` correct but
    // `<div role="img" aria-label="">` incorrect).
    const isDecorative = alt === "";
    return (
      <div
        role={isDecorative ? undefined : "img"}
        aria-label={isDecorative ? undefined : alt}
        aria-hidden={isDecorative || undefined}
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground/40",
          ASPECT_PRESETS[aspect],
          className,
        )}
      >
        <Shirt
          className="size-1/4 min-h-6 min-w-6 text-background/15"
          strokeWidth={1}
          aria-hidden="true"
        />
        {process.env.NODE_ENV !== "production" && (
          <span className="absolute bottom-1.5 right-1.5 rounded-sm bg-background/80 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-foreground/70">
            photo needed
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden bg-muted", ASPECT_PRESETS[aspect], className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn(
          "size-full animate-fade-in",
          fit === "cover" ? "object-cover" : "object-contain",
        )}
      />
    </div>
  );
}

/** Garment-on-white product photography — catalog, wardrobe, product cards. */
function ProductImage(props: Omit<FashionImageProps, "aspect">) {
  return <FashionImage {...props} aspect="square" />;
}

/** Model/try-on portrait photography — look cards, stylist, try-on canvas. */
function ModelImage(props: Omit<FashionImageProps, "aspect">) {
  return <FashionImage {...props} aspect="portrait" fit={props.fit ?? "cover"} />;
}

/** Cinematic wide banners for hero sections and editorial dividers. */
function EditorialImage(props: Omit<FashionImageProps, "aspect">) {
  return <FashionImage {...props} aspect="editorial" />;
}

export { FashionImage, ProductImage, ModelImage, EditorialImage };
