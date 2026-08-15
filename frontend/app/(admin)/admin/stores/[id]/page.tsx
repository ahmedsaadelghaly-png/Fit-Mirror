import type { Metadata } from "next";

import { StoreDetailsView } from "@/features/admin/components/stores/store-details-view";

export const metadata: Metadata = { title: "Store details" };

export default async function AdminStoreDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StoreDetailsView storeId={id} />;
}
