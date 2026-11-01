"use client";

import { Store } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { StoreFiltersBar } from "@/features/admin/components/stores/store-filters-bar";
import { StoresTable } from "@/features/admin/components/stores/stores-table";
import { useAdminStores } from "@/features/admin/hooks/use-admin-stores";

function StoresListView() {
  return (
    <AdminGuard>
      <StoresListContent />
    </AdminGuard>
  );
}

function StoresListContent() {
  const { isLoading, isError, refetch, stores, filteredStores, filters, setFilters } =
    useAdminStores();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Stores</h1>
          <p className="text-sm text-muted-foreground">Every brand storefront on the platform.</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState
          description="We couldn't load the store list. Please try again."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && stores.length === 0 && (
        <EmptyState icon={Store} title="No stores yet" />
      )}

      {!isLoading && !isError && stores.length > 0 && (
        <>
          <StoreFiltersBar filters={filters} onChange={setFilters} />
          {filteredStores.length === 0 ? (
            <EmptyState title="No stores match your filters" />
          ) : (
            <StoresTable stores={filteredStores} />
          )}
        </>
      )}
    </div>
  );
}

export { StoresListView };
