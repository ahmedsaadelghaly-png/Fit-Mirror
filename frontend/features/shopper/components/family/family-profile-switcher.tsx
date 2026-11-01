"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BODY_CATEGORIES, findBodyCategory } from "@/features/shopper/body-shapes";
import { useCreateBodyProfile } from "@/features/shopper/hooks/use-body-profiles";
import { FashionImage } from "@/shared/components/fashion-image";
import type { BodyCategory, BodyProfile } from "@/types/domain";

export interface FamilyProfileSwitcherProps {
  profiles: BodyProfile[];
  selectedId: string | undefined;
  onSelect: (profile: BodyProfile) => void;
}

/** "Girls · 128 cm" — who a profile is for, at a glance. */
export function describeProfile(profile: BodyProfile): string {
  const category = findBodyCategory(profile.body_category ?? "")?.label;
  const height = profile.height_cm ? `${profile.height_cm} cm` : null;
  return [category, height].filter(Boolean).join(" · ") || "Not set up yet";
}

/**
 * The account's body profiles as a row of chips — the shopper's own first,
 * then family members — plus "Add family member". Each family member gets
 * their own measurements and body type, so a parent can size and try on
 * their children's clothes without changing their own profile.
 */
function FamilyProfileSwitcher({ profiles, selectedId, onSelect }: FamilyProfileSwitcherProps) {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Family profiles">
        {profiles.map((profile) => {
          const isSelected = profile.id === selectedId;
          return (
            <button
              key={profile.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(profile)}
              className={cn(
                "flex items-center gap-3 rounded-full border bg-surface py-1.5 pl-1.5 pr-4 text-left transition-colors hover:border-primary/50",
                isSelected && "border-primary bg-primary/5 ring-1 ring-primary",
              )}
            >
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-full bg-accent font-display text-sm font-semibold text-accent-foreground"
              >
                {profile.name.charAt(0).toUpperCase()}
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium">
                  {profile.is_primary ? `${profile.name} (you)` : profile.name}
                </span>
                <span className="text-xs text-muted-foreground">{describeProfile(profile)}</span>
              </span>
            </button>
          );
        })}
        <Button
          type="button"
          variant="outline"
          className="h-auto rounded-full py-3"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="size-4" /> Add family member
        </Button>
      </div>

      <AddFamilyMemberDialog
        open={isAdding}
        onOpenChange={setIsAdding}
        onCreated={(profile) => {
          setIsAdding(false);
          onSelect(profile);
        }}
      />
    </div>
  );
}

interface AddFamilyMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (profile: BodyProfile) => void;
}

function AddFamilyMemberDialog({ open, onOpenChange, onCreated }: AddFamilyMemberDialogProps) {
  const createMutation = useCreateBodyProfile();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BodyCategory>("girls");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate(
      { name: name.trim(), body_category: category },
      {
        onSuccess: (profile) => {
          setName("");
          createMutation.reset();
          onCreated(profile);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Add a family member</DialogTitle>
            <DialogDescription>
              Give them their own measurements so you can find their size and try clothes on for
              them.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="family-member-name">Name</Label>
            <Input
              id="family-member-name"
              value={name}
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Lina"
              autoComplete="off"
              required
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Who is it for?</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {BODY_CATEGORIES.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-2 text-sm transition-colors hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:ring-1 has-[:focus-visible]:ring-2 has-[:checked]:ring-primary has-[:focus-visible]:ring-ring"
                >
                  <input
                    type="radio"
                    name="family-member-category"
                    value={option.value}
                    checked={category === option.value}
                    onChange={() => setCategory(option.value)}
                    className="sr-only"
                  />
                  <FashionImage
                    src={option.image}
                    alt=""
                    aspect="square"
                    className="size-12 rounded-full"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {createMutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {createMutation.error instanceof ApiError
                ? createMutation.error.message
                : "Couldn't add this profile. Please try again."}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" isLoading={createMutation.isPending} disabled={!name.trim()}>
              Add profile
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { FamilyProfileSwitcher };
