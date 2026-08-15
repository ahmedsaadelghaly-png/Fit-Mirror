import { MOCK_STORES } from "@/api/admin/mock-data";
import { delay } from "@/api/admin/shared";
import type { AdminStoreRow, StoreOverlay } from "@/types/admin";

/**
 * PLACEHOLDER — no cross-tenant store listing endpoint exists (only
 * `GET /store/me`, scoped to the caller's own store — see
 * docs/frontend/ADMIN_APP.md). Verify and suspend are captured in a
 * localStorage overlay per store.
 */
export async function listStores(): Promise<AdminStoreRow[]> {
  await delay();
  return MOCK_STORES;
}

function storageKey(storeId: string): string {
  return `fitmirror.admin.store-overlay.${storeId}`;
}

function emptyOverlay(storeId: string): StoreOverlay {
  return { storeId, isVerifiedOverride: null, isSuspendedOverride: null };
}

export function readStoreOverlaySync(storeId: string): StoreOverlay {
  if (typeof window === "undefined") return emptyOverlay(storeId);
  try {
    const raw = window.localStorage.getItem(storageKey(storeId));
    return raw ? (JSON.parse(raw) as StoreOverlay) : emptyOverlay(storeId);
  } catch {
    return emptyOverlay(storeId);
  }
}

function writeOverlay(overlay: StoreOverlay): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(overlay.storeId), JSON.stringify(overlay));
}

export async function setStoreVerifiedOverride(
  storeId: string,
  isVerified: boolean,
): Promise<StoreOverlay> {
  await delay();
  const overlay = { ...readStoreOverlaySync(storeId), isVerifiedOverride: isVerified };
  writeOverlay(overlay);
  return overlay;
}

export async function setStoreSuspendedOverride(
  storeId: string,
  isSuspended: boolean,
): Promise<StoreOverlay> {
  await delay();
  const overlay = { ...readStoreOverlaySync(storeId), isSuspendedOverride: isSuspended };
  writeOverlay(overlay);
  return overlay;
}
