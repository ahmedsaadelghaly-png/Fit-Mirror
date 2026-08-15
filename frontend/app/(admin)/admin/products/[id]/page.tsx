import type { Metadata } from "next";

import { AdminProductDetailsView } from "@/features/admin/components/products/admin-product-details-view";

export const metadata: Metadata = { title: "Product details" };

export default async function AdminProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminProductDetailsView productId={id} />;
}
