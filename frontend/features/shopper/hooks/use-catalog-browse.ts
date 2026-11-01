import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { type CatalogFilters, listCatalogProducts } from "@/api/shopper/catalog";

/** The Shop page's catalog grid — keeps the previous page on screen while filters change. */
export function useCatalogBrowse(filters: CatalogFilters) {
  return useQuery({
    queryKey: ["catalog", "browse", filters],
    queryFn: () => listCatalogProducts(filters),
    placeholderData: keepPreviousData,
  });
}
