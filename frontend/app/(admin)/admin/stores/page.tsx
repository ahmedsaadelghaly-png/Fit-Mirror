import type { Metadata } from "next";

import { StoresListView } from "@/features/admin/components/stores/stores-list-view";

export const metadata: Metadata = { title: "Stores" };

export default function AdminStoresPage() {
  return <StoresListView />;
}
