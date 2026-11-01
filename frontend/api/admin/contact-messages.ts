import { apiClient } from "@/api/client";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

/** `GET /admin/contact-messages` — the support inbox, newest first. */
export async function listContactMessages(isResolved?: boolean): Promise<ContactMessage[]> {
  const { data } = await apiClient.get<ContactMessage[]>("/admin/contact-messages", {
    params: { limit: 200, ...(isResolved === undefined ? {} : { is_resolved: isResolved }) },
  });
  return data;
}

export async function setContactMessageResolved(
  messageId: string,
  isResolved: boolean,
): Promise<ContactMessage> {
  const { data } = await apiClient.patch<ContactMessage>(`/admin/contact-messages/${messageId}`, {
    is_resolved: isResolved,
  });
  return data;
}
