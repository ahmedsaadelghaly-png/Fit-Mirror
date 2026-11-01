import { apiClient } from "@/api/client";
import type { ContactFormValues } from "@/features/contact/schemas";

export interface ContactResponse {
  message: string;
}

/**
 * `POST /contact` (no auth) — stored in the support inbox platform admins
 * work through (`/admin/support`) and forwarded to the support address.
 */
export async function submitContactForm(payload: ContactFormValues): Promise<ContactResponse> {
  const { data } = await apiClient.post<ContactResponse>("/contact", payload);
  return data;
}
