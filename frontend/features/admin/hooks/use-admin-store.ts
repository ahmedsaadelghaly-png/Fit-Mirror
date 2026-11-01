import { useQuery } from "@tanstack/react-query";

import { listStores } from "@/api/admin/stores";

export function useAdminStore(storeId: string) {
  const query = useQuery({ queryKey: ["admin", "stores"], queryFn: listStores });

  const store = query.data?.find((item) => item.id === storeId);

  return { ...query, data: store, isMissing: !query.isLoading && !query.isError && !store };
}
