"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductStatusBadge } from "@/features/brand/components/products/product-status-badge";
import { VariantList } from "@/features/brand/components/products/variant-list";
import { RequireStore } from "@/features/brand/components/require-store";
import { useArchiveProduct } from "@/features/brand/hooks/use-archive-product";
import { useProductFitFeedback } from "@/features/brand/hooks/use-size-charts";
import { useProduct } from "@/features/brand/hooks/use-product";
import { useToggleProductActive } from "@/features/brand/hooks/use-toggle-product-active";
import { ResolvedImage } from "@/shared/components/resolved-image";
import { describeFit } from "@/shared/utils/fit-summary";

export interface ProductDetailsViewProps {
  productId: string;
}

function ProductDetailsView({ productId }: ProductDetailsViewProps) {
  return <RequireStore>{() => <ProductDetailsContent productId={productId} />}</RequireStore>;
}

function ProductDetailsContent({ productId }: { productId: string }) {
  const { data: product, isLoading, isError, isMissing, refetch } = useProduct(productId);
  const toggleActiveMutation = useToggleProductActive();
  const archiveMutation = useArchiveProduct();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
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
        description="It may have been removed, or the link is incorrect."
        action={
          <Button asChild size="sm">
            <Link href="/brand/products">Back to products</Link>
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
              <ProductStatusBadge isActive={product.is_active} isArchived={product.isArchived} />
            </div>
            <p className="text-sm capitalize text-muted-foreground">
              {product.category} · {product.currency} {product.price}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/brand/products/${product.id}/edit`}>
              <Pencil className="size-4" /> Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toggleActiveMutation.mutate({ productId: product.id, isActive: !product.is_active })
            }
            isLoading={toggleActiveMutation.isPending}
          >
            {product.is_active ? "Mark inactive" : "Mark active"}
          </Button>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() =>
              archiveMutation.mutate({ productId: product.id, isArchived: !product.isArchived })
            }
            isLoading={archiveMutation.isPending}
          >
            {product.isArchived ? "Unarchive" : "Archive"}
          </Button>
        </div>
      </div>

      {product.description && (
        <p className="max-w-2xl text-sm text-muted-foreground">{product.description}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variants</CardTitle>
        </CardHeader>
        <CardContent>
          <VariantList productId={product.id} variants={product.variants} />
        </CardContent>
      </Card>

      <FitFeedbackCard productId={product.id} />
    </div>
  );
}

/** What shoppers report about this product's fit (`GET /store/products/{id}/fit-feedback`). */
function FitFeedbackCard({ productId }: { productId: string }) {
  const { data: summary } = useProductFitFeedback(productId);
  if (!summary) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fit feedback</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {summary.reports === 0 ? (
          <p className="text-muted-foreground">No shopper has reported on the fit yet.</p>
        ) : (
          <>
            <p className="font-medium">
              {describeFit(summary) ?? `Mixed — ${summary.reports} reports so far`}
            </p>
            <p className="text-muted-foreground">
              Runs small {summary.small} · True to size {summary.true_to_size} · Runs large{" "}
              {summary.large}
            </p>
            {summary.runs && summary.runs !== "true_to_size" && (
              <p className="text-muted-foreground">
                Size recommendations now go one size {summary.runs === "small" ? "up" : "down"} for
                this product.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export { ProductDetailsView };
