import { useQuery } from "@tanstack/react-query";

import { listCatalogProductsByIds } from "@/api/shopper/catalog";

export function useCatalogProducts(ids: string[]) {
  return useQuery({
    queryKey: ["catalog", "products", ids],
    queryFn: () => listCatalogProductsByIds(ids),
    enabled: ids.length > 0,
  });
}
