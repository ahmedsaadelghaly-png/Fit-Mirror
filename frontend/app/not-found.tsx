import { Compass } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { PublicFooter } from "@/shared/components/public-footer";
import { PublicHeader } from "@/shared/components/public-header";

export const metadata: Metadata = { title: "Page not found" };

/**
 * Root `not-found.tsx` — Next.js renders this for any unmatched route
 * app-wide. It sits outside every route group, so it does NOT
 * automatically inherit `(public)/layout.tsx`'s `PublicLayout` — the
 * header/footer are included manually here so a 404 still looks like
 * part of the product, not a bare, unstyled error.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center"
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Compass className="size-7 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          We couldn&apos;t find that page
        </h1>
        <p className="max-w-md text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist, or may have moved.
        </p>
        <Button asChild className="mt-2">
          <Link href="/">Back to home</Link>
        </Button>
      </main>
      <PublicFooter />
    </div>
  );
}
