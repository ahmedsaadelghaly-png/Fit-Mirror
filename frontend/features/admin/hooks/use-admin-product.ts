import { useQuery } from "@tanstack/react-query";

import { listAllProducts } from "@/api/admin/products";
import { resolveAdminProduct } from "@/features/admin/lib/resolve-admin-product";

export function useAdminProduct(productId: string) {
  const query = useQuery({ queryKey: ["admin", "products"], queryFn: listAllProducts });

  const product = query.data?.find((item) => item.id === productId);
  const resolved = product ? resolveAdminProduct(product) : undefined;

  return { ...query, data: resolved, isMissing: !query.isLoading && !query.isError && !resolved };
}
