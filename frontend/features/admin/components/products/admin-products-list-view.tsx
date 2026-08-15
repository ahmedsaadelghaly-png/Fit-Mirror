"use client";

import { Shirt } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { MockedBadge } from "@/features/admin/components/mocked-badge";
import { AdminProductFiltersBar } from "@/features/admin/components/products/admin-product-filters-bar";
import { AdminProductsTable } from "@/features/admin/components/products/admin-products-table";
import { useAdminProducts } from "@/features/admin/hooks/use-admin-products";

function AdminProductsListView() {
  return (
    <AdminGuard>
      <AdminProductsListContent />
    </AdminGuard>
  );
}

function AdminProductsListContent() {
  const {
    isLoading,
    isError,
    refetch,
    products,
    filteredProducts,
    storeNames,
    categories,
    filters,
    setFilters,
  } = useAdminProducts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">Every product listed across all stores.</p>
        </div>
        <MockedBadge />
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState
          description="We couldn't load the product list. Please try again."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && products.length === 0 && (
        <EmptyState icon={Shirt} title="No products yet" />
      )}

      {!isLoading && !isError && products.length > 0 && (
        <>
          <AdminProductFiltersBar
            filters={filters}
            onChange={setFilters}
            storeNames={storeNames}
            categories={categories}
          />
          {filteredProducts.length === 0 ? (
            <EmptyState title="No products match your filters" />
          ) : (
            <AdminProductsTable products={filteredProducts} />
          )}
        </>
      )}
    </div>
  );
}

export { AdminProductsListView };
