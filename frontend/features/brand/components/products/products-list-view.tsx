"use client";

import { Plus, Shirt } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductFiltersBar } from "@/features/brand/components/products/product-filters-bar";
import { ProductsGrid } from "@/features/brand/components/products/products-grid";
import { RequireStore } from "@/features/brand/components/require-store";
import { useProducts } from "@/features/brand/hooks/use-products";

function ProductsListView() {
  return <RequireStore>{() => <ProductsListContent />}</RequireStore>;
}

function ProductsListContent() {
  const { isLoading, isError, refetch, products, filteredProducts, filters, setFilters } =
    useProducts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your product catalog.</p>
        </div>
        {products.length > 0 && (
          <Button asChild>
            <Link href="/brand/products/new">
              <Plus className="size-4" /> Add product
            </Link>
          </Button>
        )}
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
          description="We couldn't load your products. Please try again."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && products.length === 0 && (
        <EmptyState
          icon={Shirt}
          title="No products yet"
          description="Add your first product to start showing up in shopper try-ons."
          action={
            <Button asChild size="sm">
              <Link href="/brand/products/new">
                <Plus className="size-4" /> Add product
              </Link>
            </Button>
          }
        />
      )}

      {!isLoading && !isError && products.length > 0 && (
        <>
          <ProductFiltersBar filters={filters} onChange={setFilters} />
          {filteredProducts.length === 0 ? (
            <EmptyState title="No products match your filters" />
          ) : (
            <ProductsGrid products={filteredProducts} />
          )}
        </>
      )}
    </div>
  );
}

export { ProductsListView };
