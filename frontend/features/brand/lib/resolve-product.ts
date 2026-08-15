import { readProductOverlaySync } from "@/api/brand/product-overlay";
import type { ResolvedProduct } from "@/types/brand";
import type { Product } from "@/types/domain";

/**
 * Pure adapter merging a server `Product` with its local overlay (see
 * api/brand/product-overlay.ts) into what every product list/detail view
 * actually renders. Kept side-effect-free and exported standalone so it's
 * unit-testable without mocking TanStack Query — see
 * tests/unit/features/resolve-product.test.ts.
 */
export function resolveProduct(product: Product): ResolvedProduct {
  const overlay = readProductOverlaySync(product.id);
  const hasLocalEdits =
    Object.keys(overlay.overrides).length > 0 || overlay.isActiveOverride !== null;

  return {
    ...product,
    ...overlay.overrides,
    is_active: overlay.isActiveOverride ?? product.is_active,
    variants: overlay.variants.length > 0 ? overlay.variants : product.variants,
    isArchived: overlay.isArchived,
    hasLocalEdits,
  };
}
