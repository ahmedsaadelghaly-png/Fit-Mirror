import type { Metadata } from "next";

import { CustomersView } from "@/features/brand/components/customers/customers-view";

export const metadata: Metadata = { title: "Customers" };

export default function CustomersPage() {
  return <CustomersView />;
}
