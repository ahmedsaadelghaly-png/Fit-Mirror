import { apiClient } from "@/api/client";
import type { AdminUserRow } from "@/types/admin";
import type { UserRole } from "@/types/domain";

/** Backend `AdminUserRead` — see docs/API_CONTRACTS.md "Platform Admin". */
type AdminUserResponse = Omit<AdminUserRow, "last_login_at">;

/**
 * The list views filter/search client-side (see features/admin/hooks/
 * use-users.ts), so this fetches up to the backend's page-size cap in one
 * call. Last-login isn't tracked server-side yet, so `last_login_at` is
 * always null ("Never" in the UI).
 */
export async function listUsers(): Promise<AdminUserRow[]> {
  const { data } = await apiClient.get<AdminUserResponse[]>("/admin/users", {
    params: { limit: 200 },
  });
  return data.map((user) => ({ ...user, last_login_at: null }));
}

/** Takes effect on the user's next request — role checks read the DB, not the token. */
export async function updateUser(
  userId: string,
  changes: { role?: UserRole; is_active?: boolean },
): Promise<AdminUserRow> {
  const { data } = await apiClient.patch<AdminUserResponse>(`/admin/users/${userId}`, changes);
  return { ...data, last_login_at: null };
}
