import Link from "next/link";
import type { Metadata } from "next";

import { FashionSection } from "@/shared/components/editorial-section";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How FitMirror AI handles your data.",
};

/**
 * Explicitly a placeholder — a real privacy policy requires legal review
 * (what data is collected, retention periods, third-party processors,
 * regional compliance like GDPR/CCPA) that hasn't happened yet. See
 * backend docs/SECURITY.md "data retention policy" for the technical
 * retention stance already documented on the backend side, which a real
 * policy here would need to reflect accurately.
 */
export default function PrivacyPage() {
  return (
    <FashionSection headingLevel="h1" eyebrow="Privacy Policy" heading="Privacy Policy">
      <div className="max-w-2xl">
        <p className="text-lg leading-relaxed text-muted-foreground">
          We&apos;re still finalizing our privacy policy with legal review. This page will be
          updated with a complete policy — covering what data we collect, how long we keep it, and
          your rights over it — before FitMirror AI is generally available.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          In the meantime, if you have questions about your data, reach out via our{" "}
          <Link href="/contact" className="text-primary-text underline underline-offset-2">
            contact page
          </Link>
          .
        </p>
      </div>
    </FashionSection>
  );
}
