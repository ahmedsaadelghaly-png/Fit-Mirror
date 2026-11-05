"use client";

import { useMutation } from "@tanstack/react-query";
import { ThumbsDown, ThumbsUp } from "lucide-react";

import { sendOutfitFeedback } from "@/api/shopper/stylist";
import { useWardrobeItems } from "@/features/shopper/hooks/use-wardrobe-items";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ResolvedImage } from "@/shared/components/resolved-image";
export interface SuggestedOutfitProps {
  suggestionId: string;
  /** Wardrobe item ids, resolved from the (cached) wardrobe list. */
  itemIds: string[];
}

/**
 * The pieces of one suggested outfit, plus "Love it" / "Not for me" —
 * feedback the stylist learns the shopper's taste and favorite pairings
 * from (`POST /stylist/suggestions/{id}/feedback`).
 */
function SuggestedOutfit({ suggestionId, itemIds }: SuggestedOutfitProps) {
  const { items: wardrobe } = useWardrobeItems();
  const items = itemIds
    .map((id) => wardrobe.find((item) => item.id === id))
    .filter((item) => item !== undefined);
  const feedback = useMutation({
    mutationFn: (liked: boolean) => sendOutfitFeedback(suggestionId, liked),
  });
  if (items.length === 0) return null;
  const chosen = feedback.isSuccess ? feedback.variables : undefined;

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-2" aria-label="Suggested outfit">
        {items.map((item) => (
          <li key={item.id} className="w-20">
            <ResolvedImage
              imageKey={item.image_key}
              alt={item.label ?? item.category}
              className="aspect-square w-20 rounded-md object-cover"
            />
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {item.label ?? item.category}
            </p>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-pressed={chosen === true}
          className={cn("h-8 rounded-full", chosen === true && "border-primary bg-primary/10")}
          disabled={feedback.isPending}
          onClick={() => feedback.mutate(true)}
        >
          <ThumbsUp className="size-3.5" /> Love it
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-pressed={chosen === false}
          className={cn("h-8 rounded-full", chosen === false && "border-primary bg-primary/10")}
          disabled={feedback.isPending}
          onClick={() => feedback.mutate(false)}
        >
          <ThumbsDown className="size-3.5" /> Not for me
        </Button>
        {feedback.isSuccess && (
          <span role="status" className="text-xs text-muted-foreground">
            Got it — I&apos;ll keep that in mind.
          </span>
        )}
      </div>
    </div>
  );
}

export { SuggestedOutfit };
