import { useMutation, useQueryClient } from "@tanstack/react-query";

import { upsertBodyProfile } from "@/api/shopper/body-profile";

export function useUpsertBodyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertBodyProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(["shopper", "body-profile"], profile);
    },
  });
}
