import type { Metadata } from "next";

import { WardrobeView } from "@/features/shopper/components/wardrobe/wardrobe-view";

export const metadata: Metadata = { title: "Wardrobe" };

export default function WardrobePage() {
  return <WardrobeView />;
}
