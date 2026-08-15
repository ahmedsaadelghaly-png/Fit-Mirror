import type { Metadata } from "next";

import { SavedLooksView } from "@/features/shopper/components/saved-looks/saved-looks-view";

export const metadata: Metadata = { title: "Saved looks" };

export default function SavedLooksPage() {
  return <SavedLooksView />;
}
