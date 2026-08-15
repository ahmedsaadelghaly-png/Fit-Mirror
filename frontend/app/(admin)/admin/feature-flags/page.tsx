import type { Metadata } from "next";

import { FeatureFlagsView } from "@/features/admin/components/feature-flags/feature-flags-view";

export const metadata: Metadata = { title: "Feature flags" };

export default function AdminFeatureFlagsPage() {
  return <FeatureFlagsView />;
}
