import type { Metadata } from "next";

import { ReportsView } from "@/features/admin/components/reports/reports-view";

export const metadata: Metadata = { title: "Reports" };

export default function AdminReportsPage() {
  return <ReportsView />;
}
