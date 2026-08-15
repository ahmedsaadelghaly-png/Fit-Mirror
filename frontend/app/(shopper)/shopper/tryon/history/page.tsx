import type { Metadata } from "next";

import { TryOnHistoryView } from "@/features/tryon/components/tryon-history-view";

export const metadata: Metadata = { title: "Try-on history" };

export default function TryOnHistoryPage() {
  return <TryOnHistoryView />;
}
