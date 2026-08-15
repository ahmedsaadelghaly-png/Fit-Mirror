import { useQuery } from "@tanstack/react-query";

import { listProducts } from "@/api/brand/products";
import { resolveProduct } from "@/features/brand/lib/resolve-product";

/**
 * There is no `GET /store/products/{id}` (confirmed absent — see
 * docs/frontend/BRAND_APP.md "API contract mismatches"), so a single
 * product's detail view is derived from the same `GET /store/products`
 * list query cache `useProducts()` uses (same query key: `["brand",
 * "products"]`) — arriving from the products list is instant (cache
 * already warm); a direct link/refresh triggers one full-list fetch.
 */
export function useProduct(productId: string) {
  const query = useQuery({
    queryKey: ["brand", "products"],
    queryFn: listProducts,
  });

  const product = query.data?.find((item) => item.id === productId);
  const resolved = product ? resolveProduct(product) : undefined;

  return {
    ...query,
    data: resolved,
    isMissing: !query.isLoading && !query.isError && !resolved,
  };
}
