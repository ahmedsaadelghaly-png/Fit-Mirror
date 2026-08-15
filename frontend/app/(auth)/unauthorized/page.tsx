import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Unauthorized" };

/**
 * Reached when middleware.ts's role check fails (e.g. a shopper account
 * navigating to /brand) — see middleware/auth-guard.ts. Distinct from
 * /session-expired: this means "you're logged in, just not as the right
 * kind of account for this page".
 */
export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <ShieldAlert className="size-6 text-destructive" aria-hidden="true" />
      </div>
      <h1 className="font-display text-2xl font-semibold">
        You don&apos;t have access to this page
      </h1>
      <p className="text-sm text-muted-foreground">
        Your account doesn&apos;t have permission to view that page. If you think this is a mistake,
        contact support.
      </p>
      <Button asChild className="mt-2">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
