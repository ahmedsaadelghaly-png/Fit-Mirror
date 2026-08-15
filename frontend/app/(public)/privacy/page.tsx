import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";

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
    <div className="container max-w-2xl py-20">
      <Badge variant="outline">Privacy Policy</Badge>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        We&apos;re still finalizing our privacy policy with legal review. This page will be updated
        with a complete policy — covering what data we collect, how long we keep it, and your rights
        over it — before FitMirror AI is generally available.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        In the meantime, if you have questions about your data, reach out via our{" "}
        <a href="/contact" className="text-primary-text underline underline-offset-2">
          contact page
        </a>
        .
      </p>
    </div>
  );
}
