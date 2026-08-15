import { Shirt } from "lucide-react";

import { useResolvedImageUrl } from "@/hooks/use-resolved-image-url";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/shared/utils/resolve-image-url";

export interface ResolvedImageProps {
  imageKey: string | null | undefined;
  alt: string;
  className?: string;
}

/**
 * Renders a storage-key-backed image, otherwise a placeholder tile — never
 * a broken `<img>`. Two resolution paths, tried in order:
 *   1. `resolveImageUrl` (shared/utils/resolve-image-url.ts) — synchronous,
 *      zero-latency direct URL, only available when
 *      `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` is configured (a public-read
 *      bucket/CDN in front of it).
 *   2. `useResolvedImageUrl` (hooks/use-resolved-image-url.ts) — calls
 *      `GET /tryon/download-url` for a short-lived presigned URL. This is
 *      the path exercised today (no public bucket configured — see
 *      docs/STORAGE.md).
 * While path 2 is loading, or if both come up empty (no key, or the
 * backend call fails), this renders the same placeholder tile — no
 * layout shift once the real image swaps in.
 *
 * Uses a plain `<img>`, not next/image: the resolved URL is an arbitrary
 * external bucket host (no fixed set of remote patterns to allowlist in
 * next.config), so it would need `unoptimized` regardless — staying
 * framework-agnostic here also keeps this component Storybook-safe (see
 * docs/frontend/STORYBOOK.md on next/image not resolving under the
 * Vite-based story runner).
 */
function ResolvedImage({ imageKey, alt, className }: ResolvedImageProps) {
  const directUrl = resolveImageUrl(imageKey);
  const resolvedQuery = useResolvedImageUrl(directUrl ? null : imageKey);
  const url = directUrl ?? resolvedQuery.data?.download_url;

  if (!url) {
    // Same rule as shared/components/fashion-image.tsx: an empty `alt`
    // means decorative, so use `aria-hidden` instead of `role="img"
    // aria-label=""`, which is a WCAG violation.
    const isDecorative = alt === "";
    return (
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground/40",
          className,
        )}
        role={isDecorative ? undefined : "img"}
        aria-label={isDecorative ? undefined : alt}
        aria-hidden={isDecorative || undefined}
      >
        <Shirt className="size-1/4 min-h-6 min-w-6 text-background/15" strokeWidth={1} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden bg-muted", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className="size-full animate-fade-in object-cover" />
    </div>
  );
}

export { ResolvedImage };
