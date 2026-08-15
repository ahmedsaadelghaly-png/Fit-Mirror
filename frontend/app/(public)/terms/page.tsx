import Link from "next/link";
import type { Metadata } from "next";

import { FashionSection } from "@/shared/components/editorial-section";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing use of FitMirror AI.",
};

/** Explicitly a placeholder — see privacy/page.tsx's docstring; the same reasoning applies here. */
export default function TermsPage() {
  return (
    <FashionSection headingLevel="h1" eyebrow="Terms of Service" heading="Terms of Service">
      <div className="max-w-2xl">
        <p className="text-lg leading-relaxed text-muted-foreground">
          We&apos;re still finalizing our terms of service with legal review. This page will be
          updated with complete terms before FitMirror AI is generally available.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Questions in the meantime? Reach out via our{" "}
          <Link href="/contact" className="text-primary-text underline underline-offset-2">
            contact page
          </Link>
          .
        </p>
      </div>
    </FashionSection>
  );
}
