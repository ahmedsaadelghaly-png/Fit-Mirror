import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listUsers } from "@/api/admin/users";
import type { AdminUserFilters } from "@/types/admin";

const DEFAULT_FILTERS: AdminUserFilters = { role: "all", status: "all", search: "" };

export function useAdminUsers() {
  const [filters, setFilters] = useState<AdminUserFilters>(DEFAULT_FILTERS);

  const query = useQuery({
    queryKey: ["admin", "users"],
    queryFn: listUsers,
  });

  const users = useMemo(() => query.data ?? [], [query.data]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (filters.role !== "all" && user.role !== filters.role) return false;
      if (filters.status === "active" && !user.is_active) return false;
      if (filters.status === "inactive" && user.is_active) return false;
      if (filters.search) {
        const haystack = `${user.email} ${user.full_name ?? ""}`.toLowerCase();
        if (!haystack.includes(filters.search.toLowerCase())) return false;
      }
      return true;
    });
  }, [users, filters]);

  return { ...query, users, filteredUsers, filters, setFilters };
}
