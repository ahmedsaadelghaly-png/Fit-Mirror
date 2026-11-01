import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listContactMessages, setContactMessageResolved } from "@/api/admin/contact-messages";

const KEY = ["admin", "contact-messages"] as const;

export function useContactMessages(isResolved: boolean) {
  return useQuery({
    queryKey: [...KEY, isResolved],
    queryFn: () => listContactMessages(isResolved),
  });
}

export function useSetContactMessageResolved() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isResolved }: { id: string; isResolved: boolean }) =>
      setContactMessageResolved(id, isResolved),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
