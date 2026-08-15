"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AddWardrobeItemDialog } from "@/features/shopper/components/wardrobe/add-wardrobe-item-dialog";
import { WardrobeFiltersBar } from "@/features/shopper/components/wardrobe/wardrobe-filters";
import { WardrobeGrid } from "@/features/shopper/components/wardrobe/wardrobe-grid";
import { useWardrobeItems } from "@/features/shopper/hooks/use-wardrobe-items";

function WardrobeView() {
  const { isLoading, isError, refetch, items, filteredItems, filters, setFilters } =
    useWardrobeItems();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Wardrobe</h1>
          <p className="text-sm text-muted-foreground">
            Pieces you own, ready to try on and build outfits from.
          </p>
        </div>
        {items.length > 0 && <AddWardrobeItemDialog />}
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square w-full" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState
          description="We couldn't load your wardrobe. Please try again."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (
        <>
          {items.length > 0 && <WardrobeFiltersBar filters={filters} onChange={setFilters} />}
          <WardrobeGrid items={filteredItems} hasAnyItems={items.length > 0} />
        </>
      )}
    </div>
  );
}

export { WardrobeView };
