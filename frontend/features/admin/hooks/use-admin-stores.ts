import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listStores } from "@/api/admin/stores";
import type { AdminStoreFilters } from "@/types/admin";

const DEFAULT_FILTERS: AdminStoreFilters = { verification: "all", search: "" };

export function useAdminStores() {
  const [filters, setFilters] = useState<AdminStoreFilters>(DEFAULT_FILTERS);

  const query = useQuery({ queryKey: ["admin", "stores"], queryFn: listStores });

  const stores = useMemo(() => query.data ?? [], [query.data]);

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      if (filters.verification === "verified" && !store.is_verified) return false;
      if (filters.verification === "unverified" && store.is_verified) return false;
      if (filters.search) {
        const haystack = `${store.name} ${store.owner_email}`.toLowerCase();
        if (!haystack.includes(filters.search.toLowerCase())) return false;
      }
      return true;
    });
  }, [stores, filters]);

  return { ...query, stores, filteredStores, filters, setFilters };
}
