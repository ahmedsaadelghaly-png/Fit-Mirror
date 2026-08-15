import type { Metadata } from "next";

import { OrdersView } from "@/features/brand/components/orders/orders-view";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return <OrdersView />;
}
