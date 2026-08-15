import type { Metadata } from "next";

import { ProductEditView } from "@/features/brand/components/products/product-edit-view";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditView productId={id} />;
}
