import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";

export interface OptimisticMutationConfig<TData, TVariables, TQueryData> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** The query this mutation should optimistically update while in flight. */
  queryKey: QueryKey;
  /** Returns the new cache value given the current one (possibly undefined) and the mutation's variables. */
  updateCache: (current: TQueryData | undefined, variables: TVariables) => TQueryData;
}

/**
 * Thin wrapper over TanStack Query's documented optimistic-update recipe
 * (cancel in-flight refetches, snapshot, optimistically write, roll back
 * `onError`, always refetch `onSettled`) — every mutation hook across
 * Phases 2.3–2.5 (`useToggleUserActive`, `useVerifyStore`,
 * `useFlagProduct`, ...) instead invalidates-and-refetches on success,
 * which is simpler but means the UI waits for the round-trip before
 * reflecting a change. This is a genuine, working helper for the cases
 * where instant feedback matters more than that simplicity — not yet
 * adopted by any existing hook (that would mean touching every mutation
 * across three feature areas); see docs/frontend/UX_SYSTEM.md "Optimistic
 * update helper".
 */
export function useOptimisticMutation<TData, TVariables, TQueryData>({
  mutationFn,
  queryKey,
  updateCache,
}: OptimisticMutationConfig<TData, TVariables, TQueryData>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TQueryData>(queryKey);
      queryClient.setQueryData<TQueryData>(queryKey, (current) => updateCache(current, variables));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
