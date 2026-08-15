import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listWardrobeItems } from "@/api/shopper/wardrobe";
import type { WardrobeFilters } from "@/types/shopper";

const DEFAULT_FILTERS: WardrobeFilters = { category: "all", source: "all", search: "" };

/**
 * `GET /wardrobe` accepts no filter query params server-side (see
 * api/shopper/wardrobe.ts) — category/source/search filtering happens
 * client-side against the full list this query returns.
 */
export function useWardrobeItems() {
  const [filters, setFilters] = useState<WardrobeFilters>(DEFAULT_FILTERS);

  const query = useQuery({
    queryKey: ["wardrobe", "list"],
    queryFn: listWardrobeItems,
  });

  const filteredItems = useMemo(() => {
    const items = query.data ?? [];
    return items.filter((item) => {
      if (filters.category !== "all" && item.category !== filters.category) return false;
      if (filters.source !== "all" && item.source !== filters.source) return false;
      if (filters.search) {
        const haystack = `${item.category} ${item.label ?? ""}`.toLowerCase();
        if (!haystack.includes(filters.search.toLowerCase())) return false;
      }
      return true;
    });
  }, [query.data, filters]);

  return { ...query, items: query.data ?? [], filteredItems, filters, setFilters };
}
