import type { Metadata } from "next";

import { AdminTryOnJobsListView } from "@/features/admin/components/tryon-jobs/admin-tryon-jobs-list-view";

export const metadata: Metadata = { title: "Try-on jobs" };

export default function AdminTryOnJobsPage() {
  return <AdminTryOnJobsListView />;
}
