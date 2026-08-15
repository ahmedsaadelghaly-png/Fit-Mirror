import type { Metadata } from "next";

import { ProductCreateView } from "@/features/brand/components/products/product-create-view";

export const metadata: Metadata = { title: "Add product" };

export default function NewProductPage() {
  return <ProductCreateView />;
}
