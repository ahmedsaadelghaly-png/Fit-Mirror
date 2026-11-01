"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BodyProfileForm } from "@/features/shopper/components/body-profile-form";
import { FamilyProfileSwitcher } from "@/features/shopper/components/family/family-profile-switcher";
import { useBodyProfiles, useDeleteBodyProfile } from "@/features/shopper/hooks/use-body-profiles";
import { useConfirm } from "@/shared/components/confirm-dialog-provider";

function BodyProfileView() {
  const profilesQuery = useBodyProfiles();
  const deleteMutation = useDeleteBodyProfile();
  const confirm = useConfirm();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (profilesQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (profilesQuery.isError) {
    return (
      <ErrorState
        description="We couldn't load your body profile. Please try again."
        onRetry={() => profilesQuery.refetch()}
      />
    );
  }

  const profiles = profilesQuery.data ?? [];
  // The shopper's own profile comes first; it's the default selection.
  const selected = profiles.find((profile) => profile.id === selectedId) ?? profiles[0];
  const isMissing = profiles.length === 0;

  const handleRemove = async () => {
    if (!selected || selected.is_primary) return;
    const confirmed = await confirm({
      title: `Remove ${selected.name}'s profile?`,
      description: "Their measurements and body type will be deleted. Past try-ons stay.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!confirmed) return;
    deleteMutation.mutate(selected.id, { onSuccess: () => setSelectedId(null) });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Body profile</h1>
        <p className="text-sm text-muted-foreground">
          {isMissing
            ? "You haven't set up a body profile yet — add your measurements below."
            : "Keep measurements up to date for you and your family."}
        </p>
      </div>

      {!isMissing && (
        <FamilyProfileSwitcher
          profiles={profiles}
          selectedId={selected?.id}
          onSelect={(profile) => setSelectedId(profile.id)}
        />
      )}

      {selected && !selected.is_primary && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
          <p className="text-sm">
            Editing <span className="font-medium">{selected.name}</span>&apos;s profile.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            isLoading={deleteMutation.isPending}
          >
            <Trash2 className="size-4" /> Remove profile
          </Button>
        </div>
      )}

      {/* Keyed by profile so switching resets the form to that profile's values. */}
      <BodyProfileForm key={selected?.id ?? "new"} existingProfile={selected} />
    </div>
  );
}

export { BodyProfileView };
