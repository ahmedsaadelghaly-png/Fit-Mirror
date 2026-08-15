"use client";

import { LookCard } from "@/shared/components/cards/look-card";
import type { SavedLook } from "@/types/shopper";

export interface SavedLookCardProps {
  look: SavedLook;
  onOpen: (look: SavedLook) => void;
}

function SavedLookCard({ look, onOpen }: SavedLookCardProps) {
  return (
    <LookCard
      imageKey={look.result_image_key}
      alt={look.label ?? "Saved look"}
      title={look.label ?? "Saved look"}
      onClick={() => onOpen(look)}
    />
  );
}

export { SavedLookCard };
