import type { Metadata } from "next";

import { BodyProfileView } from "@/features/shopper/components/body-profile-view";

export const metadata: Metadata = { title: "Body profile" };

export default function BodyProfilePage() {
  return <BodyProfileView />;
}
