import { useQuery } from "@tanstack/react-query";

import { listUsers } from "@/api/admin/users";
import { resolveUser } from "@/features/admin/lib/resolve-user";

/** No single-user detail endpoint exists (mocked or otherwise) — derived from the same `["admin", "users"]` list query cache `useAdminUsers()` populates, same adaptation as Phase 2.4's `useProduct`. */
export function useAdminUser(userId: string) {
  const query = useQuery({ queryKey: ["admin", "users"], queryFn: listUsers });

  const user = query.data?.find((item) => item.id === userId);
  const resolved = user ? resolveUser(user) : undefined;

  return { ...query, data: resolved, isMissing: !query.isLoading && !query.isError && !resolved };
}
