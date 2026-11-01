import { useMutation } from "@tanstack/react-query";

import { forgotPassword } from "@/features/auth/api";

/** `POST /auth/forgot-password` — see features/auth/api.ts. */
export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPassword,
  });
}
