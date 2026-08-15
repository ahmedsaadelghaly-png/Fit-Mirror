import { Layers, Shirt, Sparkles, Store, Wand2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildOrganizationJsonLd } from "@/lib/seo/structured-data";

export const metadata = buildPageMetadata({
  title: "FitMirror AI — See it on, before it's yours",
  path: "/",
});

const capabilities = [
  {
    icon: Sparkles,
    title: "Virtual Try-On",
    description: "See a garment on you, not just on a model, before you buy it.",
  },
  {
    icon: Wand2,
    title: "AI Stylist",
    description: "Outfit suggestions built from what's already in your wardrobe.",
    comingSoon: true,
  },
  {
    icon: Shirt,
    title: "Smart Wardrobe",
    description: "Every piece you own, organized and ready to style.",
  },
  {
    icon: Layers,
    title: "Size Recommendation",
    description: "A size guess that accounts for your actual measurements.",
    comingSoon: true,
  },
  {
    icon: Store,
    title: "Store Dashboard",
    description: "Brands manage their catalog and see how it performs in try-on.",
  },
];

/**
 * Placeholder-in-scope but real-in-craft: Phase 2.1 validates layout and
 * the design system, so this page is intentionally more built out than a
 * bare "hello world" — it's the one screen every visitor sees first, and
 * the best place to prove the visual direction actually holds up.
 */
export default function HomePage() {
  return (
    <>
      {/* Structured data (JSON-LD) — see docs/frontend/SEO.md "Structured data". */}
      <script
        type="application/ld+json"

        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLd()) }}
      />
      <section className="container flex flex-col items-center gap-6 py-20 text-center md:py-32">
        <Badge variant="outline" className="gap-1.5 py-1">
          <Sparkles className="size-3" /> AI-powered fashion, done properly
        </Badge>
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
          See it on, <span className="text-primary">before it&apos;s yours</span>.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          FitMirror AI combines virtual try-on, a wardrobe that knows your fit, and a stylist that
          never sleeps — built for shoppers and the brands they buy from.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/register">Create your account</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">I already have one</Link>
          </Button>
        </div>
      </section>

      <section className="container grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((capability) => (
          <Card key={capability.title} className="relative overflow-hidden">
            {capability.comingSoon && (
              <Badge variant="secondary" className="absolute right-4 top-4">
                Coming soon
              </Badge>
            )}
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-accent">
                <capability.icon className="size-5 text-accent-foreground" aria-hidden="true" />
              </div>
              <CardTitle className="text-lg">{capability.title}</CardTitle>
              <CardDescription>{capability.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </>
  );
}
