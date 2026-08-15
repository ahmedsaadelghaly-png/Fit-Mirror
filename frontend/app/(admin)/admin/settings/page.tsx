import type { Metadata } from "next";

import { PlatformSettingsView } from "@/features/admin/components/settings/platform-settings-view";

export const metadata: Metadata = { title: "Platform settings" };

export default function AdminSettingsPage() {
  return <PlatformSettingsView />;
}
