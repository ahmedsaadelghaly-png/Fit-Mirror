import type { Metadata } from "next";

import { AdminTryOnJobDetailsView } from "@/features/admin/components/tryon-jobs/admin-tryon-job-details-view";

export const metadata: Metadata = { title: "Try-on job details" };

export default async function AdminTryOnJobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminTryOnJobDetailsView jobId={id} />;
}
