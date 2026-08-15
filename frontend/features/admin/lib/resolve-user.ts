import { readUserOverlaySync } from "@/api/admin/users";
import type { AdminUserRow } from "@/types/admin";

export interface ResolvedAdminUser extends AdminUserRow {
  hasLocalEdits: boolean;
}

/** Merges a mock user row with its local overlay (see api/admin/users.ts) — same pattern as features/brand/lib/resolve-product.ts. */
export function resolveUser(user: AdminUserRow): ResolvedAdminUser {
  const overlay = readUserOverlaySync(user.id);
  return {
    ...user,
    is_active: overlay.isActiveOverride ?? user.is_active,
    role: overlay.roleOverride ?? user.role,
    hasLocalEdits: overlay.isActiveOverride !== null || overlay.roleOverride !== null,
  };
}
