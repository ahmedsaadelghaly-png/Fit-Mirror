import type { Metadata } from "next";

import { SizeChartsView } from "@/features/brand/components/size-charts/size-charts-view";

export const metadata: Metadata = { title: "Size charts" };

export default function SizeChartsPage() {
  return <SizeChartsView />;
}
