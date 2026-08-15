"use client";

import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useDeleteWardrobeItem } from "@/features/shopper/hooks/use-delete-wardrobe-item";
import { ResolvedImage } from "@/shared/components/resolved-image";
import type { WardrobeItem } from "@/types/domain";

export interface WardrobeItemCardProps {
  item: WardrobeItem;
}

function WardrobeItemCard({ item }: WardrobeItemCardProps) {
  const deleteMutation = useDeleteWardrobeItem();

  return (
    <Card className="overflow-hidden">
      <ResolvedImage
        imageKey={item.image_key}
        alt={item.label ?? item.category}
        className="aspect-square w-full"
      />
      <CardContent className="flex flex-col gap-1 p-4">
        <span className="truncate text-sm font-medium">{item.label ?? item.category}</span>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="capitalize">
            {item.category}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {item.source}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto text-destructive hover:text-destructive"
          onClick={() => deleteMutation.mutate(item.id)}
          isLoading={deleteMutation.isPending}
          aria-label={`Delete ${item.label ?? item.category}`}
        >
          <Trash2 className="size-3.5" /> Remove
        </Button>
      </CardFooter>
    </Card>
  );
}

export { WardrobeItemCard };
