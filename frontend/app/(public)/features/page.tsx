import type { Metadata } from "next";

import { capabilities } from "@/app/(public)/_data/capabilities";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FashionImage } from "@/shared/components/fashion-image";
import { FashionSection } from "@/shared/components/editorial-section";

export const metadata: Metadata = {
  title: "Features",
  description: "Everything FitMirror AI does — today and what's coming next.",
};

export default function FeaturesPage() {
  return (
    <FashionSection
      headingLevel="h1"
      align="center"
      eyebrow="Features"
      heading="Everything you need to shop with confidence"
      description="Try-on, sizing and styling for women, men and kids — and the tools brands need to sell with confidence."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((capability) => (
          <Card key={capability.title} variant="media" className="relative">
            <FashionImage
              src={capability.image}
              alt={capability.imageAlt}
              aspect="landscape"
              className="transition-transform duration-700 ease-signature hover:scale-[1.03]"
            />
            {capability.status === "coming-soon" && (
              <Badge variant="secondary" className="absolute right-3 top-3">
                Coming soon
              </Badge>
            )}
            <CardHeader>
              <div className="flex items-center gap-2">
                <capability.icon className="size-4 text-primary-text" aria-hidden="true" />
                <CardTitle className="text-lg">{capability.eyebrow}</CardTitle>
              </div>
              <CardDescription>{capability.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </FashionSection>
  );
}
