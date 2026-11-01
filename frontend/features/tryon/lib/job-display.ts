import type { TryOnJob } from "@/types/domain";
import type { TryOnCreateRequest } from "@/types/shopper";

/** What was tried on: the catalog product, or the shopper's own upload. */
export function tryOnJobTitle(job: TryOnJob): string {
  return job.product_title ?? "Your own garment";
}

/** "Size M · 1 Nov 2026" — size only for catalog try-ons. */
export function tryOnJobMeta(job: TryOnJob): string {
  const date = new Date(job.created_at).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return job.size_label ? `Size ${job.size_label} · ${date}` : date;
}

/** Re-runs a job with the same inputs — catalog try-ons keep their product link. */
export function retryPayload(job: TryOnJob): TryOnCreateRequest {
  return job.product_variant_id
    ? { user_image_key: job.user_image_key, product_variant_id: job.product_variant_id }
    : { user_image_key: job.user_image_key, garment_image_key: job.garment_image_key };
}

export function newestFirst(jobs: TryOnJob[]): TryOnJob[] {
  return [...jobs].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}
