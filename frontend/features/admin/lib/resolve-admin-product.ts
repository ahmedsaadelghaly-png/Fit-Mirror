import { readModerationOverlaySync } from "@/api/admin/products";
import type { AdminProductRow } from "@/types/admin";

export interface ResolvedAdminProduct extends AdminProductRow {
  isFlagged: boolean;
  isHidden: boolean;
}

export function resolveAdminProduct(product: AdminProductRow): ResolvedAdminProduct {
  const overlay = readModerationOverlaySync(product.id);
  return { ...product, isFlagged: overlay.isFlagged, isHidden: overlay.isHidden };
}
