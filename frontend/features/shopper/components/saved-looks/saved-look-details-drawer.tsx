"use client";

import { Share2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteLook } from "@/features/shopper/hooks/use-delete-look";
import { ResolvedImage } from "@/shared/components/resolved-image";
import type { SavedLook } from "@/types/shopper";

export interface SavedLookDetailsDrawerProps {
  look: SavedLook | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * A dialog standing in for a proper side drawer — components/ui/dialog.tsx
 * is the only modal primitive today (see docs/frontend/COMPONENT_GUIDELINES.md);
 * a real edge-anchored drawer is a follow-up, not required to make this
 * feature functional. "Share" is a UI-only placeholder — see
 * types/shopper.ts, there's no backend endpoint to share a look with yet.
 */
function SavedLookDetailsDrawer({ look, onOpenChange }: SavedLookDetailsDrawerProps) {
  const deleteMutation = useDeleteLook();

  return (
    <Dialog open={!!look} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{look?.label ?? "Saved look"}</DialogTitle>
        </DialogHeader>
        {look && (
          <ResolvedImage
            imageKey={look.result_image_key}
            alt={look.label ?? "Saved look"}
            className="aspect-[3/4] w-full rounded-lg"
          />
        )}
        <DialogFooter>
          <Button type="button" variant="outline" disabled title="Sharing is coming soon">
            <Share2 className="size-3.5" /> Share
          </Button>
          <Button
            type="button"
            variant="destructive"
            isLoading={deleteMutation.isPending}
            onClick={() => {
              if (!look) return;
              deleteMutation.mutate(look.id, { onSuccess: () => onOpenChange(false) });
            }}
          >
            <Trash2 className="size-3.5" /> Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { SavedLookDetailsDrawer };
