import type { Metadata } from "next";

import { DashboardView } from "@/features/shopper/components/dashboard/dashboard-view";

export const metadata: Metadata = { title: "Shopper overview" };

export default function ShopperOverviewPage() {
  return <DashboardView />;
}
