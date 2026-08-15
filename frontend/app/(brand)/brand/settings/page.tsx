import type { Metadata } from "next";

import { BrandSettingsView } from "@/features/brand/components/settings/brand-settings-view";

export const metadata: Metadata = { title: "Settings" };

export default function BrandSettingsPage() {
  return <BrandSettingsView />;
}
