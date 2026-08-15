import { readStoreOverlaySync } from "@/api/admin/stores";
import type { AdminStoreRow } from "@/types/admin";

export interface ResolvedAdminStore extends AdminStoreRow {
  hasLocalEdits: boolean;
}

export function resolveStore(store: AdminStoreRow): ResolvedAdminStore {
  const overlay = readStoreOverlaySync(store.id);
  return {
    ...store,
    is_verified: overlay.isVerifiedOverride ?? store.is_verified,
    is_suspended: overlay.isSuspendedOverride ?? store.is_suspended,
    hasLocalEdits: overlay.isVerifiedOverride !== null || overlay.isSuspendedOverride !== null,
  };
}
