import type { ProductOverlay, VariantFormInput } from "@/types/brand";

/**
 * PLACEHOLDER — no backend endpoint exists to edit a product, archive it,
 * toggle `is_active`, or create/edit/delete a `ProductVariant` (confirmed
 * absent: no `PUT/PATCH/DELETE /store/products/{id}`, no variant schema or
 * route anywhere). Persisted to localStorage per product, following the
 * same pattern as api/shopper/saved-looks.ts from Phase 2.3 — real
 * interactive UI, clearly not yet synced to a backend that doesn't support
 * it. See docs/frontend/BRAND_APP.md "API contract mismatches".
 */

const SIMULATED_LATENCY_MS = 300;

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
}

function storageKey(productId: string): string {
  return `fitmirror.product-overlay.${productId}`;
}

function emptyOverlay(productId: string): ProductOverlay {
  return { productId, overrides: {}, isActiveOverride: null, isArchived: false, variants: [] };
}

function readOverlay(productId: string): ProductOverlay {
  if (typeof window === "undefined") return emptyOverlay(productId);
  try {
    const raw = window.localStorage.getItem(storageKey(productId));
    return raw ? (JSON.parse(raw) as ProductOverlay) : emptyOverlay(productId);
  } catch {
    return emptyOverlay(productId);
  }
}

function writeOverlay(overlay: ProductOverlay): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(overlay.productId), JSON.stringify(overlay));
}

export async function fetchProductOverlay(productId: string): Promise<ProductOverlay> {
  await delay();
  return readOverlay(productId);
}

/**
 * Synchronous variant of `fetchProductOverlay`, for merging an overlay onto
 * every row of a product list (see features/brand/hooks/use-products.ts) —
 * awaiting N simulated-latency reads for a list of products would make the
 * list feel slower than the real `GET /store/products` call it's
 * decorating. Safe because this is just a localStorage read; the
 * simulated latency above only exists to give mutations realistic
 * pending/success UX, not to simulate this read's cost.
 */
export function readProductOverlaySync(productId: string): ProductOverlay {
  return readOverlay(productId);
}

export async function saveProductOverrides(
  productId: string,
  overrides: ProductOverlay["overrides"],
): Promise<ProductOverlay> {
  await delay();
  const overlay = { ...readOverlay(productId), overrides };
  writeOverlay(overlay);
  return overlay;
}

export async function setProductActiveOverride(
  productId: string,
  isActive: boolean,
): Promise<ProductOverlay> {
  await delay();
  const overlay = { ...readOverlay(productId), isActiveOverride: isActive };
  writeOverlay(overlay);
  return overlay;
}

export async function setProductArchived(
  productId: string,
  isArchived: boolean,
): Promise<ProductOverlay> {
  await delay();
  const overlay = { ...readOverlay(productId), isArchived };
  writeOverlay(overlay);
  return overlay;
}

export async function addVariant(
  productId: string,
  variant: VariantFormInput,
): Promise<ProductOverlay> {
  await delay();
  const overlay = readOverlay(productId);
  overlay.variants = [
    ...overlay.variants,
    {
      id: crypto.randomUUID(),
      size_label: variant.size_label,
      color: variant.color ?? null,
      sku: variant.sku,
      stock_quantity: variant.stock_quantity,
      garment_image_key: variant.garment_image_key ?? null,
    },
  ];
  writeOverlay(overlay);
  return overlay;
}

export async function updateVariant(
  productId: string,
  variantId: string,
  variant: VariantFormInput,
): Promise<ProductOverlay> {
  await delay();
  const overlay = readOverlay(productId);
  overlay.variants = overlay.variants.map((existing) =>
    existing.id === variantId
      ? {
          ...existing,
          size_label: variant.size_label,
          color: variant.color ?? null,
          sku: variant.sku,
          stock_quantity: variant.stock_quantity,
          garment_image_key: variant.garment_image_key ?? existing.garment_image_key,
        }
      : existing,
  );
  writeOverlay(overlay);
  return overlay;
}

export async function deleteVariant(productId: string, variantId: string): Promise<ProductOverlay> {
  await delay();
  const overlay = readOverlay(productId);
  overlay.variants = overlay.variants.filter((existing) => existing.id !== variantId);
  writeOverlay(overlay);
  return overlay;
}
