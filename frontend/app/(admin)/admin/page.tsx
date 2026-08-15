import type { Metadata } from "next";

import { DashboardView } from "@/features/admin/components/dashboard/dashboard-view";

export const metadata: Metadata = { title: "Platform overview" };

export default function AdminOverviewPage() {
  return <DashboardView />;
}
