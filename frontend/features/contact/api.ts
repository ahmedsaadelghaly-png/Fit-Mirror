import type { ContactFormValues } from "@/features/contact/schemas";

export interface ContactResponse {
  message: string;
}

/**
 * PLACEHOLDER — there is no `POST /contact` endpoint anywhere in the
 * backend (see backend docs/API_CONTRACTS.md — no such route exists,
 * and adding one is a backend change out of scope for this frontend
 * phase). This simulates a network round-trip and always resolves
 * successfully so ContactForm's full loading/success UI can be built and
 * tested now. Swap this function's body for a real `apiClient.post` call
 * the moment a backend endpoint exists — callers only depend on this
 * function's signature, not its implementation.
 */
export async function submitContactForm(payload: ContactFormValues): Promise<ContactResponse> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { message: `Thanks, ${payload.name} — we'll get back to you soon.` };
}
