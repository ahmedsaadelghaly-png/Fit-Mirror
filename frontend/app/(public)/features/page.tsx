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
      description="Some of this is live today. Some of it is still being built — we'd rather tell you honestly than oversell it."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((capability) => (
          <Card key={capability.title} variant="media" className="relative">
            <FashionImage alt={capability.title} aspect="landscape" />
            {capability.status === "coming-soon" && (
              <Badge variant="secondary" className="absolute right-3 top-3">
                Coming soon
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-lg">{capability.eyebrow}</CardTitle>
              <CardDescription>{capability.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </FashionSection>
  );
}
