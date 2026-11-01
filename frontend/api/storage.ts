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

/** `POST /storage/download-urls` — up to 100 keys in one request. */
export async function requestDownloadUrls(objectKeys: string[]): Promise<Record<string, string>> {
  const { data } = await apiClient.post<{ download_urls: Record<string, string> }>(
    "/storage/download-urls",
    { object_keys: objectKeys },
  );
  return data.download_urls;
}

const BATCH_WINDOW_MS = 10;
const MAX_KEYS_PER_REQUEST = 100;

interface Waiter {
  resolve: (url: string) => void;
  reject: (error: unknown) => void;
}

let pending = new Map<string, Waiter[]>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Resolves one key, batched: every key asked for within a short window
 * (e.g. all the tiles of an image grid mounting together) goes out in a
 * single `POST /storage/download-urls` instead of one request per image.
 */
export function loadDownloadUrl(objectKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const waiters = pending.get(objectKey) ?? [];
    waiters.push({ resolve, reject });
    pending.set(objectKey, waiters);
    flushTimer ??= setTimeout(flushDownloadUrls, BATCH_WINDOW_MS);
  });
}

function flushDownloadUrls() {
  const batch = pending;
  pending = new Map();
  flushTimer = null;

  const keys = [...batch.keys()];
  for (let start = 0; start < keys.length; start += MAX_KEYS_PER_REQUEST) {
    const chunk = keys.slice(start, start + MAX_KEYS_PER_REQUEST);
    requestDownloadUrls(chunk).then(
      (urls) => {
        for (const key of chunk) {
          const url = urls[key];
          for (const waiter of batch.get(key) ?? []) {
            if (url) waiter.resolve(url);
            else waiter.reject(new Error(`No download URL returned for ${key}`));
          }
        }
      },
      (error: unknown) => {
        for (const key of chunk) batch.get(key)?.forEach((waiter) => waiter.reject(error));
      },
    );
  }
}
