import { MOCK_USERS } from "@/api/admin/mock-data";
import { delay } from "@/api/admin/shared";
import type { AdminUserRow, UserOverlay } from "@/types/admin";
import type { UserRole } from "@/types/domain";

/**
 * PLACEHOLDER — no `/admin/users` (or any cross-tenant user listing)
 * endpoint exists on the backend (confirmed absent — see
 * docs/frontend/ADMIN_APP.md "API contract mismatches"). Returns the fixed
 * mock roster from api/admin/mock-data.ts. Activate/deactivate and role
 * change are captured in a localStorage overlay per user, same pattern as
 * Phase 2.4's `api/brand/product-overlay.ts`.
 */
export async function listUsers(): Promise<AdminUserRow[]> {
  await delay();
  return MOCK_USERS;
}

function storageKey(userId: string): string {
  return `fitmirror.admin.user-overlay.${userId}`;
}

function emptyOverlay(userId: string): UserOverlay {
  return { userId, isActiveOverride: null, roleOverride: null };
}

export function readUserOverlaySync(userId: string): UserOverlay {
  if (typeof window === "undefined") return emptyOverlay(userId);
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as UserOverlay) : emptyOverlay(userId);
  } catch {
    return emptyOverlay(userId);
  }
}

function writeOverlay(overlay: UserOverlay): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(overlay.userId), JSON.stringify(overlay));
}

export async function setUserActiveOverride(
  userId: string,
  isActive: boolean,
): Promise<UserOverlay> {
  await delay();
  const overlay = { ...readUserOverlaySync(userId), isActiveOverride: isActive };
  writeOverlay(overlay);
  return overlay;
}

export async function setUserRoleOverride(userId: string, role: UserRole): Promise<UserOverlay> {
  await delay();
  const overlay = { ...readUserOverlaySync(userId), roleOverride: role };
  writeOverlay(overlay);
  return overlay;
}
