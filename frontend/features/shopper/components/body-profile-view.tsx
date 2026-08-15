"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BodyProfileForm } from "@/features/shopper/components/body-profile-form";
import { useBodyProfile } from "@/features/shopper/hooks/use-body-profile";

function BodyProfileView() {
  const bodyProfileQuery = useBodyProfile();

  if (bodyProfileQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (bodyProfileQuery.isError && !bodyProfileQuery.isMissing) {
    return (
      <ErrorState
        description="We couldn't load your body profile. Please try again."
        onRetry={() => bodyProfileQuery.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Body profile</h1>
        <p className="text-sm text-muted-foreground">
          {bodyProfileQuery.isMissing
            ? "You haven't set up a body profile yet — add your measurements below."
            : "Keep your measurements and style preferences up to date."}
        </p>
      </div>
      <BodyProfileForm existingProfile={bodyProfileQuery.data} />
    </div>
  );
}

export { BodyProfileView };
