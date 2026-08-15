"use client";

import { Heart, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SavedLookCard } from "@/features/shopper/components/saved-looks/saved-look-card";
import { SavedLookDetailsDrawer } from "@/features/shopper/components/saved-looks/saved-look-details-drawer";
import { useSavedLooks } from "@/features/shopper/hooks/use-saved-looks";
import type { SavedLook } from "@/types/shopper";

function SavedLooksView() {
  const { data: looks, isLoading, isError, refetch } = useSavedLooks();
  const [selectedLook, setSelectedLook] = useState<SavedLook | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Saved looks</h1>
        <p className="text-sm text-muted-foreground">Try-on results you&apos;ve kept for later.</p>
        {/* Saved looks are localStorage-only today (see api/shopper/
            saved-looks.ts) — no backend resource exists yet, so this stays
            visible rather than letting the LookCard grid imply real
            cloud sync. */}
        <p className="mt-1 text-xs text-muted-foreground">
          Saved on this device — clearing your browser data will remove them.
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[3/4] w-full" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState
          description="We couldn't load your saved looks. Please try again."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (!looks || looks.length === 0) && (
        <EmptyState
          icon={Heart}
          title="No saved looks yet"
          description="Complete a try-on and select “Save look” to keep it here."
          action={
            <Button asChild size="sm">
              <Link href="/shopper/tryon">
                <Sparkles className="size-4" /> Start a try-on
              </Link>
            </Button>
          }
        />
      )}

      {!isLoading && !isError && looks && looks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {looks.map((look) => (
            <SavedLookCard key={look.id} look={look} onOpen={setSelectedLook} />
          ))}
        </div>
      )}

      <SavedLookDetailsDrawer
        look={selectedLook}
        onOpenChange={(open) => !open && setSelectedLook(null)}
      />
    </div>
  );
}

export { SavedLooksView };
