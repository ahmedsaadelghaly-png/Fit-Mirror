import type { Metadata } from "next";

import { TryOnWorkspace } from "@/features/tryon/components/tryon-workspace";

export const metadata: Metadata = { title: "Virtual try-on" };

export default function TryOnPage() {
  return <TryOnWorkspace />;
}
