import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listStores } from "@/api/admin/stores";
import { resolveStore } from "@/features/admin/lib/resolve-store";
import type { AdminStoreFilters } from "@/types/admin";

const DEFAULT_FILTERS: AdminStoreFilters = { verification: "all", search: "" };

export function useAdminStores() {
  const [filters, setFilters] = useState<AdminStoreFilters>(DEFAULT_FILTERS);

  const query = useQuery({ queryKey: ["admin", "stores"], queryFn: listStores });

  const resolvedStores = useMemo(() => (query.data ?? []).map(resolveStore), [query.data]);

  const filteredStores = useMemo(() => {
    return resolvedStores.filter((store) => {
      if (filters.verification === "verified" && !store.is_verified) return false;
      if (filters.verification === "unverified" && store.is_verified) return false;
      if (filters.search) {
        const haystack = `${store.name} ${store.owner_email}`.toLowerCase();
        if (!haystack.includes(filters.search.toLowerCase())) return false;
      }
      return true;
    });
  }, [resolvedStores, filters]);

  return { ...query, stores: resolvedStores, filteredStores, filters, setFilters };
}
