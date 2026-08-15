"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { useAdminStore } from "@/features/admin/hooks/use-admin-store";
import { useSuspendStore } from "@/features/admin/hooks/use-suspend-store";
import { useVerifyStore } from "@/features/admin/hooks/use-verify-store";

export interface StoreDetailsViewProps {
  storeId: string;
}

function StoreDetailsView({ storeId }: StoreDetailsViewProps) {
  return (
    <AdminGuard>
      <StoreDetailsContent storeId={storeId} />
    </AdminGuard>
  );
}

function StoreDetailsContent({ storeId }: { storeId: string }) {
  const { data: store, isLoading, isError, isMissing, refetch } = useAdminStore(storeId);
  const verifyMutation = useVerifyStore();
  const suspendMutation = useSuspendStore();

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (isError) {
    return (
      <ErrorState
        description="We couldn't load this store. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  if (isMissing || !store) {
    return (
      <EmptyState
        title="Store not found"
        action={
          <Button asChild size="sm">
            <Link href="/admin/stores">Back to stores</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold">{store.name}</h1>
            <Badge variant={store.is_verified ? "success" : "secondary"}>
              {store.is_verified ? "Verified" : "Unverified"}
            </Badge>
            {store.is_suspended && <Badge variant="destructive">Suspended</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">fitmirror.ai/store/{store.slug}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              verifyMutation.mutate({ storeId: store.id, isVerified: !store.is_verified })
            }
            isLoading={verifyMutation.isPending}
          >
            {store.is_verified ? "Revoke verification" : "Verify store"}
          </Button>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() =>
              suspendMutation.mutate({ storeId: store.id, isSuspended: !store.is_suspended })
            }
            isLoading={suspendMutation.isPending}
          >
            {store.is_suspended ? "Unsuspend" : "Suspend"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{store.owner_email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catalog</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Products</span>
            <span className="font-display text-2xl font-semibold">{store.product_count}</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { StoreDetailsView };
