import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listProducts } from "@/api/brand/products";
import { resolveProduct } from "@/features/brand/lib/resolve-product";
import type { ProductFilters } from "@/types/brand";

const DEFAULT_FILTERS: ProductFilters = { category: "all", status: "all", search: "" };

/**
 * `GET /store/products` accepts no query params (see api/brand/products.ts)
 * — category/status/search filtering all happen client-side against the
 * full list, same pattern as features/shopper/hooks/use-wardrobe-items.ts.
 */
export function useProducts() {
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);

  const query = useQuery({
    queryKey: ["brand", "products"],
    queryFn: listProducts,
  });

  const resolvedProducts = useMemo(() => (query.data ?? []).map(resolveProduct), [query.data]);

  const filteredProducts = useMemo(() => {
    return resolvedProducts.filter((product) => {
      if (filters.status === "archived") {
        if (!product.isArchived) return false;
      } else if (product.isArchived) {
        return false;
      }
      if (filters.category !== "all" && product.category !== filters.category) return false;
      if (filters.status === "active" && !product.is_active) return false;
      if (filters.status === "inactive" && product.is_active) return false;
      if (filters.search) {
        const haystack = `${product.title} ${product.category}`.toLowerCase();
        if (!haystack.includes(filters.search.toLowerCase())) return false;
      }
      return true;
    });
  }, [resolvedProducts, filters]);

  return {
    ...query,
    products: resolvedProducts,
    filteredProducts,
    filters,
    setFilters,
  };
}
