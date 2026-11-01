import { useQuery } from "@tanstack/react-query";

import { listUsers } from "@/api/admin/users";

/** Derived from the same `["admin", "users"]` list query `useAdminUsers()` populates — arriving from the list is instant. */
export function useAdminUser(userId: string) {
  const query = useQuery({ queryKey: ["admin", "users"], queryFn: listUsers });

  const user = query.data?.find((item) => item.id === userId);

  return { ...query, data: user, isMissing: !query.isLoading && !query.isError && !user };
}
