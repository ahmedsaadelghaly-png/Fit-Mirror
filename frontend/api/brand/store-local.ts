import type { StoreBusinessInfo } from "@/types/brand";

/**
 * PLACEHOLDER — `category`, `description`, `social_links`, and a usable
 * `logo_image_key` have no backend field/endpoint at all (see
 * types/brand.ts `StoreBusinessInfo` and docs/frontend/BRAND_APP.md "API
 * contract mismatches"). Persisted to localStorage per store, following
 * the same pattern as api/shopper/saved-looks.ts from Phase 2.3.
 */

const SIMULATED_LATENCY_MS = 300;

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
}

function storageKey(storeId: string): string {
  return `fitmirror.store-business-info.${storeId}`;
}

const EMPTY_BUSINESS_INFO: StoreBusinessInfo = {
  category: null,
  description: null,
  social_links: { website: null, instagram: null, tiktok: null },
  logo_image_key: null,
};

export async function fetchStoreBusinessInfo(storeId: string): Promise<StoreBusinessInfo> {
  await delay();
  if (typeof window === "undefined") return EMPTY_BUSINESS_INFO;
  try {
    const raw = window.localStorage.getItem(storageKey(storeId));
    return raw ? (JSON.parse(raw) as StoreBusinessInfo) : EMPTY_BUSINESS_INFO;
  } catch {
    return EMPTY_BUSINESS_INFO;
  }
}

export async function saveStoreBusinessInfo(
  storeId: string,
  info: StoreBusinessInfo,
): Promise<StoreBusinessInfo> {
  await delay();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey(storeId), JSON.stringify(info));
  }
  return info;
}
