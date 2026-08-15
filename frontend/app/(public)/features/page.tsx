import { Layers, Shirt, Sparkles, Store, Wand2 } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Features",
  description: "Everything FitMirror AI does — today and what's coming next.",
};

const features = [
  {
    icon: Sparkles,
    title: "Virtual Try-On",
    description:
      "Upload a photo and see a garment rendered on you, not just on a model — before you buy.",
    status: "available" as const,
  },
  {
    icon: Shirt,
    title: "Smart Wardrobe",
    description: "Every piece you own, organized in one place and ready to style or try on.",
    status: "available" as const,
  },
  {
    icon: Store,
    title: "Store Dashboard",
    description: "Brands manage their catalog and see how it performs across try-on requests.",
    status: "available" as const,
  },
  {
    icon: Wand2,
    title: "AI Stylist",
    description: "Outfit suggestions built from what's already in your wardrobe, for any occasion.",
    status: "coming-soon" as const,
  },
  {
    icon: Layers,
    title: "Size Recommendation",
    description: "A size guess that accounts for your actual measurements, not just a size chart.",
    status: "coming-soon" as const,
  },
];

export default function FeaturesPage() {
  return (
    <div className="container flex flex-col gap-16 py-20">
      <div className="flex flex-col items-center gap-4 text-center">
        <Badge variant="outline">Features</Badge>
        <h1 className="max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Everything you need to shop with confidence
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Some of this is live today. Some of it is still being built — we&apos;d rather tell you
          honestly than oversell it.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="relative overflow-hidden">
            {feature.status === "coming-soon" && (
              <Badge variant="secondary" className="absolute right-4 top-4">
                Coming soon
              </Badge>
            )}
            <CardHeader>
              <div className="mb-2 flex size-11 items-center justify-center rounded-md bg-accent">
                <feature.icon className="size-5 text-accent-foreground" aria-hidden="true" />
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
