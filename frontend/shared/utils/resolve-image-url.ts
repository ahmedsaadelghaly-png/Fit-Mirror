import { env } from "@/config/env";

/**
 * Fast path only: a direct, unsigned URL, used when
 * `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` is configured (the bucket/CDN in front
 * of it is public-read). Every read API (wardrobe items, try-on jobs,
 * body profile) returns opaque object keys, never a URL — when this
 * returns `null` (the common case; no public bucket is configured today),
 * callers should fall back to `hooks/use-resolved-image-url.ts`, which
 * resolves a key via the real `GET /tryon/download-url` backend endpoint
 * instead. `shared/components/resolved-image.tsx` already does both, in
 * that order — most callers should use that component directly rather
 * than this function.
 */
export function resolveImageUrl(key: string | null | undefined): string | null {
  if (!key || !env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL) return null;
  return `${env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL}/${key}`;
}
