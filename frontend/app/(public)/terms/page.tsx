import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing use of FitMirror AI.",
};

/** Explicitly a placeholder — see privacy/page.tsx's docstring; the same reasoning applies here. */
export default function TermsPage() {
  return (
    <div className="container max-w-2xl py-20">
      <Badge variant="outline">Terms of Service</Badge>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        We&apos;re still finalizing our terms of service with legal review. This page will be
        updated with complete terms before FitMirror AI is generally available.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Questions in the meantime? Reach out via our{" "}
        <a href="/contact" className="text-primary-text underline underline-offset-2">
          contact page
        </a>
        .
      </p>
    </div>
  );
}
