import type { Metadata } from "next";

import { AdminProductsListView } from "@/features/admin/components/products/admin-products-list-view";

export const metadata: Metadata = { title: "Products" };

export default function AdminProductsPage() {
  return <AdminProductsListView />;
}
