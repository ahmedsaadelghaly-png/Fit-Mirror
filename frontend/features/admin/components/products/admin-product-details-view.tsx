"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { ImageModerationPlaceholder } from "@/features/admin/components/products/image-moderation-placeholder";
import { useAdminProduct } from "@/features/admin/hooks/use-admin-product";
import { useFlagProduct } from "@/features/admin/hooks/use-flag-product";
import { useHideProduct } from "@/features/admin/hooks/use-hide-product";
import { ResolvedImage } from "@/shared/components/resolved-image";

export interface AdminProductDetailsViewProps {
  productId: string;
}

function AdminProductDetailsView({ productId }: AdminProductDetailsViewProps) {
  return (
    <AdminGuard>
      <AdminProductDetailsContent productId={productId} />
    </AdminGuard>
  );
}

function AdminProductDetailsContent({ productId }: { productId: string }) {
  const { data: product, isLoading, isError, isMissing, refetch } = useAdminProduct(productId);
  const flagMutation = useFlagProduct();
  const hideMutation = useHideProduct();

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (isError) {
    return (
      <ErrorState
        description="We couldn't load this product. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  if (isMissing || !product) {
    return (
      <EmptyState
        title="Product not found"
        action={
          <Button asChild size="sm">
            <Link href="/admin/products">Back to products</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <ResolvedImage
            imageKey={product.primary_image_key}
            alt={product.title}
            className="size-16 shrink-0 rounded-lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-semibold">{product.title}</h1>
              <Badge variant={product.is_active ? "success" : "secondary"}>
                {product.is_active ? "Active" : "Inactive"}
              </Badge>
              {product.isFlagged && <Badge variant="destructive">Flagged</Badge>}
              {product.isHidden && <Badge variant="destructive">Hidden</Badge>}
            </div>
            <p className="text-sm capitalize text-muted-foreground">
              {product.store_name} · {product.category} · {product.currency} {product.price}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              flagMutation.mutate({ productId: product.id, isFlagged: !product.isFlagged })
            }
            isLoading={flagMutation.isPending}
          >
            {product.isFlagged ? "Remove flag" : "Flag product"}
          </Button>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() =>
              hideMutation.mutate({ productId: product.id, isHidden: !product.isHidden })
            }
            isLoading={hideMutation.isPending}
          >
            {product.isHidden ? "Unhide" : "Hide from catalog"}
          </Button>
        </div>
      </div>

      <ImageModerationPlaceholder />
    </div>
  );
}

export { AdminProductDetailsView };
