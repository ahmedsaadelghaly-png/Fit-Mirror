import { useQuery } from "@tanstack/react-query";

import { loadDownloadUrl } from "@/api/storage";
import { STALE_TIME } from "@/lib/performance/query-config";

/**
 * Resolves a storage object key to a real, loadable image URL — batched
 * through `POST /storage/download-urls` (see `api/storage.ts`
 * `loadDownloadUrl`), so a grid of images costs one request — used by
 * `shared/components/resolved-image.tsx` for every wardrobe/try-on/product
 * image across Shopper, Brand, and Admin. `STALE_TIME.LONG` (5 min) is
 * comfortably inside the backend's 1-hour presigned URL expiry, so a
 * cached URL is never served past the point it'd actually fail to load.
 */
export function useResolvedImageUrl(key: string | null | undefined) {
  return useQuery({
    queryKey: ["storage", "download-url", key],
    queryFn: async () => ({ download_url: await loadDownloadUrl(key as string) }),
    enabled: !!key,
    staleTime: STALE_TIME.LONG,
  });
}
