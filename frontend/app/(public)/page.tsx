import Link from "next/link";

import { capabilities } from "@/app/(public)/_data/capabilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditorialHero } from "@/shared/components/editorial-hero";
import { EditorialImage, ModelImage } from "@/shared/components/fashion-image";
import { FashionSection } from "@/shared/components/editorial-section";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildOrganizationJsonLd } from "@/lib/seo/structured-data";

export const metadata = buildPageMetadata({
  title: "FitMirror AI — See it on, before it's yours",
  path: "/",
});

const steps = [
  { label: "01", title: "Upload", description: "A photo of you, and a garment you're eyeing." },
  {
    label: "02",
    title: "Try it on",
    description: "FitMirror renders the garment on you in seconds, not on a stranger's model.",
  },
  {
    label: "03",
    title: "Shop with confidence",
    description: "Save the look, compare before/after, and buy knowing it actually fits.",
  },
];

/**
 * Placeholder-in-scope but real-in-craft: Phase 2.1 validated layout and
 * the design system; Phase 2.8 replaces the generic-SaaS composition
 * (icon-pill badge, centered hero, uniform icon-card grid) with an
 * editorial narrative built on the Phase 2.8 primitives — see
 * docs/frontend/DESIGN_SYSTEM.md "Phase 2.8". Imagery is placeholder art
 * pending real photography (docs/frontend/ASSETS.md).
 */
export default function HomePage() {
  return (
    <>
      {/* Structured data (JSON-LD) — see docs/frontend/SEO.md "Structured data". */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLd()) }}
      />

      <EditorialHero
        eyebrow="AI-powered fashion, done properly"
        heading={
          <>
            See it on, <span className="text-primary">before it&apos;s yours</span>.
          </>
        }
        description="FitMirror AI combines virtual try-on, a wardrobe that knows your fit, and a stylist that never sleeps — built for shoppers and the brands they buy from."
        actions={
          <>
            <Button size="xl" asChild>
              <Link href="/register">Create your account</Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/login">I already have one</Link>
            </Button>
          </>
        }
        media={<EditorialImage alt="A model wearing a FitMirror virtual try-on result" />}
      />

      {capabilities.map((capability, index) => (
        <EditorialHero
          key={capability.title}
          headingLevel="h2"
          reverse={index % 2 === 1}
          eyebrow={capability.eyebrow}
          heading={capability.title}
          description={capability.description}
          actions={
            capability.status === "coming-soon" ? (
              <Badge variant="secondary">Coming soon</Badge>
            ) : undefined
          }
          media={<ModelImage alt={`${capability.title} — ${capability.eyebrow}`} />}
        />
      ))}

      <FashionSection
        eyebrow="How it works"
        heading="Three steps, no fitting room."
        align="left"
      >
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.label} className="flex flex-col gap-2">
              <span className="font-mono text-sm text-primary-text">{step.label}</span>
              <h3 className="font-display text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </FashionSection>

      <FashionSection
        tone="dark"
        align="center"
        heading="Ready to see it on?"
        description="Create a free account and try your first garment on in minutes."
        actions={
          <>
            <Button size="xl" asChild>
              <Link href="/register">Create your account</Link>
            </Button>
            <Button size="xl" variant="outline" className="border-background/30 text-background hover:bg-background/10 hover:text-background" asChild>
              <Link href="/login">I already have one</Link>
            </Button>
          </>
        }
      />
    </>
  );
}
