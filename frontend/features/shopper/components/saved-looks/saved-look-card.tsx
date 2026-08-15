"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ResolvedImage } from "@/shared/components/resolved-image";
import type { SavedLook } from "@/types/shopper";

export interface SavedLookCardProps {
  look: SavedLook;
  onOpen: (look: SavedLook) => void;
}

function SavedLookCard({ look, onOpen }: SavedLookCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen(look)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(look);
        }
      }}
      className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
    >
      <ResolvedImage
        imageKey={look.result_image_key}
        alt={look.label ?? "Saved look"}
        className="aspect-[3/4] w-full"
      />
      <CardContent className="p-4">
        <span className="truncate text-sm font-medium">{look.label ?? "Saved look"}</span>
      </CardContent>
    </Card>
  );
}

export { SavedLookCard };
