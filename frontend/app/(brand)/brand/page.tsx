import type { Metadata } from "next";

import { DashboardView } from "@/features/brand/components/dashboard/dashboard-view";

export const metadata: Metadata = { title: "Brand overview" };

export default function BrandOverviewPage() {
  return <DashboardView />;
}
