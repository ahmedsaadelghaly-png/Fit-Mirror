import { Clock } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Session expired" };

/**
 * Reached when api/client.ts's response interceptor fails to silently
 * refresh an expired access token (see api/client.ts's "performRefresh").
 * Distinct from /unauthorized: this means "you WERE logged in, and
 * aren't anymore" rather than "you're logged in as the wrong role".
 */
export default function SessionExpiredPage() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Clock className="size-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="font-display text-2xl font-semibold">Your session has expired</h1>
      <p className="text-sm text-muted-foreground">
        For your security, we logged you out after a period of inactivity. Log in again to pick up
        where you left off.
      </p>
      <Button asChild className="mt-2">
        <Link href="/login">Log in again</Link>
      </Button>
    </div>
  );
}
