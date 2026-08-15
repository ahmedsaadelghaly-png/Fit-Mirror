"use client";

import { Store as StoreIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/features/brand/hooks/use-store";
import type { Store } from "@/types/domain";

export interface RequireStoreProps {
  children: (store: Store) => ReactNode;
}

/**
 * Every Brand page beyond onboarding itself needs a registered store to
 * show anything meaningful — `GET /store/me` 404s until `POST /store`
 * has run once (see features/brand/hooks/use-store.ts). This is the
 * shared "loading / needs setup / error / success" gate every such page
 * renders through, so that logic (and its copy) lives in exactly one
 * place instead of being repeated on the dashboard, products, profile,
 * and inventory pages.
 */
function RequireStore({ children }: RequireStoreProps) {
  const storeQuery = useStore();

  if (storeQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (storeQuery.isMissing) {
    return (
      <EmptyState
        icon={StoreIcon}
        title="Set up your store"
        description="Register your store to start adding products and tracking try-on performance."
        action={
          <Button asChild size="sm">
            <Link href="/brand/onboarding">Set up your store</Link>
          </Button>
        }
      />
    );
  }

  if (storeQuery.isError || !storeQuery.data) {
    return (
      <ErrorState
        description="We couldn't load your store. Please try again."
        onRetry={() => storeQuery.refetch()}
      />
    );
  }

  return <>{children(storeQuery.data)}</>;
}

export { RequireStore };
