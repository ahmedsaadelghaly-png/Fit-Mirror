import type { Metadata } from "next";

import { AnalyticsView } from "@/features/brand/components/analytics/analytics-view";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return <AnalyticsView />;
}
