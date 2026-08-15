import { MOCK_PRODUCTS } from "@/api/admin/mock-data";
import { delay } from "@/api/admin/shared";
import type { AdminProductRow, ProductModerationOverlay } from "@/types/admin";

/**
 * PLACEHOLDER — no platform-wide product listing endpoint exists (only
 * `GET /store/products`, scoped to the caller's own store — see
 * docs/frontend/ADMIN_APP.md). Flag/hide moderation actions are captured
 * in a localStorage overlay per product.
 */
export async function listAllProducts(): Promise<AdminProductRow[]> {
  await delay();
  return MOCK_PRODUCTS;
}

function storageKey(productId: string): string {
  return `fitmirror.admin.product-moderation.${productId}`;
}

function emptyOverlay(productId: string): ProductModerationOverlay {
  return { productId, isFlagged: false, isHidden: false };
}

export function readModerationOverlaySync(productId: string): ProductModerationOverlay {
  if (typeof window === "undefined") return emptyOverlay(productId);
  try {
    const raw = window.localStorage.getItem(storageKey(productId));
    return raw ? (JSON.parse(raw) as ProductModerationOverlay) : emptyOverlay(productId);
  } catch {
    return emptyOverlay(productId);
  }
}

function writeOverlay(overlay: ProductModerationOverlay): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(overlay.productId), JSON.stringify(overlay));
}

export async function setProductFlagged(
  productId: string,
  isFlagged: boolean,
): Promise<ProductModerationOverlay> {
  await delay();
  const overlay = { ...readModerationOverlaySync(productId), isFlagged };
  writeOverlay(overlay);
  return overlay;
}

export async function setProductHidden(
  productId: string,
  isHidden: boolean,
): Promise<ProductModerationOverlay> {
  await delay();
  const overlay = { ...readModerationOverlaySync(productId), isHidden };
  writeOverlay(overlay);
  return overlay;
}
