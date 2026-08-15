import { useMutation } from "@tanstack/react-query";

import { submitContactForm } from "@/features/contact/api";

/** See features/contact/api.ts — PLACEHOLDER, no backend endpoint yet. */
export function useContactForm() {
  return useMutation({
    mutationFn: submitContactForm,
  });
}
