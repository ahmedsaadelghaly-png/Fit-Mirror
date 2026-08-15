import { Shirt } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { AddWardrobeItemDialog } from "@/features/shopper/components/wardrobe/add-wardrobe-item-dialog";
import { WardrobeItemCard } from "@/features/shopper/components/wardrobe/wardrobe-item-card";
import type { WardrobeItem } from "@/types/domain";

export interface WardrobeGridProps {
  items: WardrobeItem[];
  hasAnyItems: boolean;
}

function WardrobeGrid({ items, hasAnyItems }: WardrobeGridProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Shirt}
        title={hasAnyItems ? "No items match your filters" : "Your wardrobe is empty"}
        description={
          hasAnyItems
            ? "Try a different category, source, or search term."
            : "Add pieces you own to start building outfits and trying things on."
        }
        action={!hasAnyItems ? <AddWardrobeItemDialog /> : undefined}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <WardrobeItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export { WardrobeGrid };
