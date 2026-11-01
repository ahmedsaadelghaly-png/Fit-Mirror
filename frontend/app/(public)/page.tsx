import { ArrowRight, Camera, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import Link from "next/link";

import { AudienceGrid } from "@/app/(public)/_components/audience-grid";
import { HeroMosaic } from "@/app/(public)/_components/hero-mosaic";
import { capabilities } from "@/app/(public)/_data/capabilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditorialHero } from "@/shared/components/editorial-hero";
import { FashionImage, ModelImage } from "@/shared/components/fashion-image";
import { FashionSection } from "@/shared/components/editorial-section";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildOrganizationJsonLd } from "@/lib/seo/structured-data";

export const metadata = buildPageMetadata({
  title: "FitMirror AI — See it on, before it's yours",
  path: "/",
});

const highlights = [
  { icon: Camera, label: "Try-on on your own photo" },
  { icon: Sparkles, label: "Outfits from your wardrobe" },
  { icon: ShieldCheck, label: "Your photos stay private" },
];

const steps = [
  {
    label: "01",
    title: "Upload",
    description:
      "A photo of you, and a garment you're eyeing — or pick one from a brand's catalog.",
    image: "/images/products/flatlay-dark.jpg",
    imageAlt: "Flat-lay of trousers, a black tee, sneakers and a watch",
  },
  {
    label: "02",
    title: "Try it on",
    description: "FitMirror renders the garment on you in seconds, not on a stranger's model.",
    image: "/images/models/woman-teal.jpg",
    imageAlt: "Woman in wide striped trousers posing against a teal wall",
  },
  {
    label: "03",
    title: "Shop with confidence",
    description: "Get your size, save the look, and buy knowing it actually fits.",
    image: "/images/models/man-shirt.jpg",
    imageAlt: "Smiling man in a light blue shirt",
  },
];

/**
 * Editorial landing page: photographic hero mosaic, the four body-profile
 * audiences, one story panel per capability, how-it-works, a brand
 * section, and a closing CTA. Photography lives in public/images (Unsplash
 * License — see docs/frontend/ASSETS.md).
 */
const shopperCapabilities = capabilities.filter(
  (capability) => capability.eyebrow !== "For Fashion Brands",
);

export default function HomePage() {
  return (
    <>
      {/* Structured data (JSON-LD) — see docs/frontend/SEO.md "Structured data". */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLd()) }}
      />

      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 size-[36rem] rounded-full bg-primary/10 blur-3xl"
        />
        <div className="container relative grid items-center gap-14 py-14 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
          <div className="flex flex-col items-start gap-6">
            <Badge variant="eyebrow">AI-powered fashion, done properly</Badge>
            <h1 className="font-display text-4xl font-semibold leading-[1.04] tracking-tight md:text-6xl lg:text-7xl">
              See it on, <span className="text-primary">before it&apos;s yours</span>.
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Virtual try-on, a wardrobe that knows your fit, and a stylist that never sleeps — for
              women, men and kids, and for the brands they love.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button size="xl" asChild>
                <Link href="/register">
                  Start free <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="/features">See how it works</Link>
              </Button>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-3">
              {highlights.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="size-4 text-primary-text" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <HeroMosaic />
        </div>
      </section>

      <FashionSection
        eyebrow="Made for every body"
        heading="Women, men, girls and boys."
        description="Pick your profile and body shape once — try-on, sizing and styling adapt to you."
        align="left"
      >
        <AudienceGrid />
      </FashionSection>

      {/* Brands get their own banner below, so their panel is /features-only. */}
      {shopperCapabilities.map((capability, index) => (
        <EditorialHero
          key={capability.title}
          headingLevel="h2"
          reverse={index % 2 === 1}
          className={index % 2 === 0 ? "bg-surface" : undefined}
          eyebrow={capability.eyebrow}
          heading={capability.title}
          description={capability.description}
          actions={
            capability.status === "coming-soon" ? (
              <Badge variant="secondary">Coming soon</Badge>
            ) : (
              <Button variant="link" className="h-auto px-0" asChild>
                <Link href="/register">
                  Try it free <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            )
          }
          media={
            <ModelImage
              src={capability.image}
              alt={capability.imageAlt}
              className="mx-auto max-w-md rounded-xl shadow-lg"
            />
          }
        />
      ))}

      <FashionSection eyebrow="How it works" heading="Three steps, no fitting room." align="left">
        <ol className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.label} className="flex flex-col gap-4">
              <FashionImage
                src={step.image}
                alt={step.imageAlt}
                aspect="landscape"
                className="rounded-xl"
              />
              <span className="font-mono text-sm text-primary-text">{step.label}</span>
              <h3 className="font-display text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </FashionSection>

      <section className="container pb-16 md:pb-24">
        <div className="relative overflow-hidden rounded-2xl">
          <FashionImage
            src="/images/editorial/store-rack.jpg"
            alt="Racks of neutral-toned clothing in a boutique window"
            aspect="wide"
            className="min-h-[22rem] md:aspect-[21/9]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 flex items-center p-6 md:p-14">
            <div className="max-w-md space-y-4 text-white">
              <Badge variant="eyebrow" className="text-white/70">
                For fashion brands
              </Badge>
              <h2 className="font-display text-3xl font-semibold leading-tight md:text-4xl">
                Let shoppers try before they buy.
              </h2>
              <p className="text-white/80">
                Publish your catalog, give every product a try-on and a size recommendation, and see
                which pieces shoppers try most.
              </p>
              <Button size="lg" asChild>
                <Link href="/register?type=brand">
                  <ShoppingBag className="size-4" aria-hidden="true" /> Open your store
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-foreground text-background">
        <FashionImage
          src="/images/editorial/rail-neutral.jpg"
          alt=""
          aspect="wide"
          className="absolute inset-0 h-full w-full opacity-25 [&>img]:grayscale"
        />
        <div className="container relative flex flex-col items-center gap-6 py-20 text-center md:py-28">
          <h2 className="max-w-2xl font-display text-3xl font-semibold leading-tight md:text-5xl">
            Ready to see it on?
          </h2>
          <p className="max-w-md text-background/70">
            Create a free account and try your first garment on in minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="xl" asChild>
              <Link href="/register">Create your account</Link>
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
              asChild
            >
              <Link href="/login">I already have one</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
