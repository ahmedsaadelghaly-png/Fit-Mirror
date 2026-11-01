import type { ResolvedProduct } from "@/types/brand";
import type { Product } from "@/types/domain";

/**
 * Maps a server `Product` to what every product list/detail view renders.
 * Since Phase 3.1 all edits, archiving, and variants are stored on the
 * backend (see api/brand/products.ts), so this is just the camelCase
 * `isArchived` alias the views and filters were built against.
 */
export function resolveProduct(product: Product): ResolvedProduct {
  return { ...product, isArchived: product.is_archived };
}
