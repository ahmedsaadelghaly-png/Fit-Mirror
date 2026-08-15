import { Mail } from "lucide-react";
import type { Metadata } from "next";

import { ContactForm } from "@/features/contact/components/contact-form";
import { FashionSection } from "@/shared/components/editorial-section";
import { ModelImage } from "@/shared/components/fashion-image";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the FitMirror AI team.",
};

export default function ContactPage() {
  return (
    <FashionSection
      headingLevel="h1"
      eyebrow="Contact"
      heading="Let's talk"
      description="Questions about FitMirror AI, partnership inquiries, or just want to say hello — send us a message and we'll get back to you."
    >
      <div className="grid gap-12 md:grid-cols-2 md:items-start">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4" aria-hidden="true" />
            <span>hello@fitmirror.ai</span>
          </div>
          <ModelImage alt="" className="hidden md:block" />
        </div>
        <ContactForm />
      </div>
    </FashionSection>
  );
}
