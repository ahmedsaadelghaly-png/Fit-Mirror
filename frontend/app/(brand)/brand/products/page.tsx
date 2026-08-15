import type { Metadata } from "next";

import { ProductsListView } from "@/features/brand/components/products/products-list-view";

export const metadata: Metadata = { title: "Products" };

export default function BrandProductsPage() {
  return <ProductsListView />;
}
