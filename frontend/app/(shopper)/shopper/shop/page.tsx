import type { Metadata } from "next";

import { ShopView } from "@/features/shopper/components/shop/shop-view";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return <ShopView />;
}
