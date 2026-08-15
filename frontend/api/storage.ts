import { apiClient } from "@/api/client";
import type { DownloadUrlResponse } from "@/types/domain";

/**
 * Resolves any storage object key to a downloadable URL — the read-side
 * counterpart to `api/shopper/upload.ts`'s `requestUploadUrl`. Lives at
 * the top level (not under `api/shopper/`) because it backs
 * `shared/components/resolved-image.tsx`, used across Shopper, Brand, and
 * Admin. See backend `app/api/v1/endpoints/tryon.py::create_download_url`
 * and `docs/STORAGE.md` "Upload flow".
 */
export async function requestDownloadUrl(objectKey: string): Promise<DownloadUrlResponse> {
  const { data } = await apiClient.get<DownloadUrlResponse>("/tryon/download-url", {
    params: { object_key: objectKey },
  });
  return data;
}
