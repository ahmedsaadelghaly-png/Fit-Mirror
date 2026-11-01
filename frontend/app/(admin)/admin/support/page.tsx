import type { Metadata } from "next";

import { SupportInboxView } from "@/features/admin/components/support/support-inbox-view";

export const metadata: Metadata = { title: "Support inbox" };

export default function AdminSupportPage() {
  return <SupportInboxView />;
}
