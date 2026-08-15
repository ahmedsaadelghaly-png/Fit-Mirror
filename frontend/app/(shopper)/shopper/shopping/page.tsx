import type { Metadata } from "next";

import { ShoppingView } from "@/features/shopper/components/shopping/shopping-view";

export const metadata: Metadata = { title: "Shopping Assistant" };

export default function ShoppingPage() {
  return <ShoppingView />;
}
