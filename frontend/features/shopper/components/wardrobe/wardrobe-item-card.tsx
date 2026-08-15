"use client";

import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeleteWardrobeItem } from "@/features/shopper/hooks/use-delete-wardrobe-item";
import { ProductCard } from "@/shared/components/cards/product-card";
import type { WardrobeItem } from "@/types/domain";

export interface WardrobeItemCardProps {
  item: WardrobeItem;
}

function WardrobeItemCard({ item }: WardrobeItemCardProps) {
  const deleteMutation = useDeleteWardrobeItem();

  return (
    <ProductCard
      imageKey={item.image_key}
      alt={item.label ?? item.category}
      name={item.label ?? item.category}
      subtitle={item.source === "uploaded" ? "Uploaded" : "Catalog item"}
      badge={
        <Badge variant="secondary" className="capitalize">
          {item.category}
        </Badge>
      }
      actions={
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-8 rounded-full text-destructive hover:text-destructive"
          onClick={() => deleteMutation.mutate(item.id)}
          isLoading={deleteMutation.isPending}
          aria-label={`Delete ${item.label ?? item.category}`}
        >
          <Trash2 className="size-3.5" />
        </Button>
      }
    />
  );
}

export { WardrobeItemCard };
