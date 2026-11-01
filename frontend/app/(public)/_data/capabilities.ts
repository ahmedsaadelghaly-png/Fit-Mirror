import { Layers, Shirt, ShoppingBag, Sparkles, Store, Wand2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Capability {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  status: "available" | "coming-soon";
  /** Static photo under public/images/ (see docs/frontend/ASSETS.md). */
  image: string;
  imageAlt: string;
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
    image: "/images/models/woman-pink.jpg",
    imageAlt: "Woman in a pink ruffled blouse holding sunglasses",
  },
  {
    icon: Shirt,
    eyebrow: "Digital Wardrobe",
    title: "Your closet, mapped",
    description: "Every piece you own, organized in one place and ready to style or try on.",
    status: "available",
    image: "/images/products/flatlay-denim.jpg",
    imageAlt: "Flat-lay of jeans, a knit cardigan and suede boots",
  },
  {
    icon: Wand2,
    eyebrow: "AI Stylist",
    title: "A stylist that knows your closet",
    description:
      "Tell it the occasion and the weather — it builds a complete outfit from what you already own.",
    status: "available",
    image: "/images/models/man-flannel.jpg",
    imageAlt: "Man in a plaid overshirt and sunglasses",
  },
  {
    icon: Layers,
    eyebrow: "Size Recommendation",
    title: "Fit, not guesswork",
    description:
      "Your measurements and body shape matched against each product's real sizes — for women, men, girls and boys.",
    status: "available",
    image: "/images/models/woman-street.jpg",
    imageAlt: "Woman in a tailored check coat on a city street",
  },
  {
    icon: ShoppingBag,
    eyebrow: "Shopping Assistant",
    title: "Ask for it, find it",
    description:
      '"A black jacket under $100 in size M" — plain language in, matching products out.',
    status: "available",
    image: "/images/editorial/shopping.jpg",
    imageAlt: "Woman in sunglasses carrying shopping bags",
  },
  {
    icon: Store,
    eyebrow: "For Fashion Brands",
    title: "Fewer returns, happier customers",
    description: "Brands manage their catalog and see how it performs across try-on requests.",
    status: "available",
    image: "/images/editorial/boutique.jpg",
    imageAlt: "Interior of a modern clothing boutique",
  },
];
