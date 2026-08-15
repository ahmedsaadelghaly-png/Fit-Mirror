import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listAllProducts } from "@/api/admin/products";
import { resolveAdminProduct } from "@/features/admin/lib/resolve-admin-product";
import type { AdminProductFilters } from "@/types/admin";

const DEFAULT_FILTERS: AdminProductFilters = {
  store: "all",
  category: "all",
  status: "all",
  search: "",
};

export function useAdminProducts() {
  const [filters, setFilters] = useState<AdminProductFilters>(DEFAULT_FILTERS);

  const query = useQuery({ queryKey: ["admin", "products"], queryFn: listAllProducts });

  const resolvedProducts = useMemo(() => (query.data ?? []).map(resolveAdminProduct), [query.data]);

  const storeNames = useMemo(
    () => Array.from(new Set(resolvedProducts.map((product) => product.store_name))).sort(),
    [resolvedProducts],
  );
  const categories = useMemo(
    () => Array.from(new Set(resolvedProducts.map((product) => product.category))).sort(),
    [resolvedProducts],
  );

  const filteredProducts = useMemo(() => {
    return resolvedProducts.filter((product) => {
      if (filters.store !== "all" && product.store_name !== filters.store) return false;
      if (filters.category !== "all" && product.category !== filters.category) return false;
      if (filters.status === "active" && !product.is_active) return false;
      if (filters.status === "inactive" && product.is_active) return false;
      if (filters.status === "flagged" && !product.isFlagged) return false;
      if (filters.status === "hidden" && !product.isHidden) return false;
      if (filters.search) {
        const haystack = `${product.title} ${product.store_name} ${product.category}`.toLowerCase();
        if (!haystack.includes(filters.search.toLowerCase())) return false;
      }
      return true;
    });
  }, [resolvedProducts, filters]);

  return {
    ...query,
    products: resolvedProducts,
    filteredProducts,
    storeNames,
    categories,
    filters,
    setFilters,
  };
}
