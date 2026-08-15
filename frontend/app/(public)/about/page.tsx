import Link from "next/link";
import type { Metadata } from "next";

import { FashionSection } from "@/shared/components/editorial-section";

export const metadata: Metadata = {
  title: "About",
  description: "Why FitMirror AI exists.",
};

export default function AboutPage() {
  return (
    <FashionSection
      headingLevel="h1"
      align="center"
      eyebrow="About"
      heading="Buying clothes online shouldn't be a guessing game"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6 text-lg leading-relaxed text-muted-foreground">
        <p>
          FitMirror AI exists because trying on clothes is the part of shopping that actually
          matters, and it&apos;s the one thing online stores can&apos;t offer — until now. We
          combine virtual try-on, a wardrobe that knows what you own, and a stylist that understands
          your fit to make buying clothes online feel less like a bet.
        </p>
        <p>
          We&apos;re early. Some of what&apos;s described on our{" "}
          <Link href="/features" className="text-primary-text underline underline-offset-2">
            features page
          </Link>{" "}
          is live today; some of it is still being built. We&apos;d rather be honest about that than
          pretend otherwise.
        </p>
        <p>
          FitMirror AI is built for two audiences at once: shoppers who want confidence before they
          buy, and the fashion brands who want fewer returns and happier customers.
        </p>
      </div>
    </FashionSection>
  );
}
