import type { Metadata } from "next";
import { Suspense } from "react";

import { TryOnWorkspace } from "@/features/tryon/components/tryon-workspace";

export const metadata: Metadata = { title: "Virtual try-on" };

export default function TryOnPage() {
  // Suspense: the workspace reads `?job=` via useSearchParams.
  return (
    <Suspense>
      <TryOnWorkspace />
    </Suspense>
  );
}
