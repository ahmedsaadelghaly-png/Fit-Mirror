import type { Metadata } from "next";

import { StylistView } from "@/features/shopper/components/stylist/stylist-view";

export const metadata: Metadata = { title: "AI Stylist" };

export default function StylistPage() {
  return <StylistView />;
}
