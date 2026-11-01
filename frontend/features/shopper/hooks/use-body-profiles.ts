import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createBodyProfile,
  deleteBodyProfile,
  listBodyProfiles,
  updateBodyProfile,
} from "@/api/shopper/body-profile";
import type { BodyProfileUpsertRequest } from "@/types/shopper";

const PROFILES_KEY = ["shopper", "body-profiles"] as const;

/** Every body profile on the account — the shopper's own first, then family. */
export function useBodyProfiles() {
  return useQuery({ queryKey: PROFILES_KEY, queryFn: listBodyProfiles });
}

/** Profile changes touch both the list and the single primary-profile query. */
function useInvalidateProfiles() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: PROFILES_KEY });
    queryClient.invalidateQueries({ queryKey: ["shopper", "body-profile"] });
  };
}

export function useCreateBodyProfile() {
  const invalidate = useInvalidateProfiles();
  return useMutation({ mutationFn: createBodyProfile, onSuccess: invalidate });
}

export function useUpdateBodyProfile() {
  const invalidate = useInvalidateProfiles();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BodyProfileUpsertRequest }) =>
      updateBodyProfile(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteBodyProfile() {
  const invalidate = useInvalidateProfiles();
  return useMutation({ mutationFn: deleteBodyProfile, onSuccess: invalidate });
}
