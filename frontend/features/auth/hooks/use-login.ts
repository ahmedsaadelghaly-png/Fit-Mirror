import { useMutation } from "@tanstack/react-query";

import { login } from "@/features/auth/api";

/**
 * Wraps the login API call in a TanStack Query mutation — gives the form
 * `isPending`/`isError`/`error` for free, instead of hand-rolled loading
 * state. See features/auth/components/login-form.tsx for usage.
 */
export function useLogin() {
  return useMutation({
    mutationFn: login,
  });
}
