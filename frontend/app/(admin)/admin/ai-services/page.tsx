import type { Metadata } from "next";

import { AiServicesView } from "@/features/admin/components/ai-services/ai-services-view";

export const metadata: Metadata = { title: "AI services" };

export default function AdminAiServicesPage() {
  return <AiServicesView />;
}
