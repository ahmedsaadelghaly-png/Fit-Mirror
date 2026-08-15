import { Layers, Shirt, Sparkles, Store, Wand2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Capability {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  status: "available" | "coming-soon";
}

/**
 * Single source of truth for the capability list shown on both the home
 * page hero narrative and /features — previously duplicated independently
 * in each file with drifting copy. Keep in sync with what's actually
 * shipped: `status` drives the "Coming soon" signal in both places.
 */
export const capabilities: Capability[] = [
  {
    icon: Sparkles,
    eyebrow: "Virtual Try-On",
    title: "See it on, before it's yours",
    description:
      "Upload a photo and see a garment rendered on you, not just on a model — before you buy.",
    status: "available",
  },
  {
    icon: Shirt,
    eyebrow: "Digital Wardrobe",
    title: "Your closet, mapped",
    description: "Every piece you own, organized in one place and ready to style or try on.",
    status: "available",
  },
  {
    icon: Wand2,
    eyebrow: "AI Stylist",
    title: "A stylist that knows your closet",
    description: "Outfit suggestions built from what's already in your wardrobe, for any occasion.",
    status: "coming-soon",
  },
  {
    icon: Layers,
    eyebrow: "Size Recommendation",
    title: "Fit, not guesswork",
    description: "A size guess that accounts for your actual measurements, not just a size chart.",
    status: "coming-soon",
  },
  {
    icon: Store,
    eyebrow: "For Fashion Brands",
    title: "Fewer returns, happier customers",
    description: "Brands manage their catalog and see how it performs across try-on requests.",
    status: "available",
  },
];
