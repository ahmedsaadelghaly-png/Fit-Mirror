import type { Metadata } from "next";

import { StoreProfileView } from "@/features/brand/components/profile/store-profile-view";

export const metadata: Metadata = { title: "Store profile" };

export default function BrandProfilePage() {
  return <StoreProfileView />;
}
