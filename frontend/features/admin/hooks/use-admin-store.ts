import { useQuery } from "@tanstack/react-query";

import { listStores } from "@/api/admin/stores";
import { resolveStore } from "@/features/admin/lib/resolve-store";

export function useAdminStore(storeId: string) {
  const query = useQuery({ queryKey: ["admin", "stores"], queryFn: listStores });

  const store = query.data?.find((item) => item.id === storeId);
  const resolved = store ? resolveStore(store) : undefined;

  return { ...query, data: resolved, isMissing: !query.isLoading && !query.isError && !resolved };
}
