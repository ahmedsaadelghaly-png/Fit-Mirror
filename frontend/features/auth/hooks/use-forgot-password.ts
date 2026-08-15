import { useMutation } from "@tanstack/react-query";

import { forgotPassword } from "@/features/auth/api";

/** See features/auth/api.ts::forgotPassword — PLACEHOLDER, no backend endpoint yet. */
export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPassword,
  });
}
