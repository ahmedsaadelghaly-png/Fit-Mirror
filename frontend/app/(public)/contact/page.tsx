import { Mail } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { ContactForm } from "@/features/contact/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the FitMirror AI team.",
};

export default function ContactPage() {
  return (
    <div className="container grid max-w-4xl gap-12 py-20 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <Badge variant="outline" className="w-fit">
          Contact
        </Badge>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Let&apos;s talk
        </h1>
        <p className="text-lg text-muted-foreground">
          Questions about FitMirror AI, partnership inquiries, or just want to say hello — send us a
          message and we&apos;ll get back to you.
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="size-4" aria-hidden="true" />
          <span>hello@fitmirror.ai</span>
        </div>
      </div>

      <ContactForm />
    </div>
  );
}
