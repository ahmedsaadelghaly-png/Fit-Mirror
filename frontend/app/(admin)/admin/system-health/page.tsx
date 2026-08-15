import type { Metadata } from "next";

import { SystemHealthView } from "@/features/admin/components/system-health/system-health-view";

export const metadata: Metadata = { title: "System health" };

export default function AdminSystemHealthPage() {
  return <SystemHealthView />;
}
