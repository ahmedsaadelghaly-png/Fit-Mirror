"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { captureError } from "@/lib/monitoring";
import { PublicFooter } from "@/shared/components/public-footer";
import { PublicHeader } from "@/shared/components/public-header";

/**
 * Route-level error boundary — Next.js renders this automatically when a
 * page (or anything it renders) throws during render, below the root
 * layout. Must be a Client Component ("use client"). For an error thrown
 * by the root layout itself, Next.js falls back to app/global-error.tsx
 * instead (which this delegates to conceptually but can't reuse directly
 * — see that file for why it can't share this component).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { digest: error.digest, boundary: "app/error.tsx" });
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-7 text-destructive" aria-hidden="true" />
        </div>
        <p className="font-mono text-sm text-muted-foreground">500</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Something went wrong
        </h1>
        <p className="max-w-md text-muted-foreground">
          We hit an unexpected error. Try again, or head back to home if it keeps happening.
        </p>
        <div className="mt-2 flex gap-3">
          <Button variant="outline" onClick={reset}>
            Try again
          </Button>
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
