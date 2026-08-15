import type { Metadata } from "next";

import { ProductDetailsView } from "@/features/brand/components/products/product-details-view";

export const metadata: Metadata = { title: "Product details" };

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailsView productId={id} />;
}
