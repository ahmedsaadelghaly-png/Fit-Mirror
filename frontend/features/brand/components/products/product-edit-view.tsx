"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm } from "@/features/brand/components/products/product-form";
import { RequireStore } from "@/features/brand/components/require-store";
import { useProduct } from "@/features/brand/hooks/use-product";

export interface ProductEditViewProps {
  productId: string;
}

function ProductEditView({ productId }: ProductEditViewProps) {
  return <RequireStore>{() => <ProductEditContent productId={productId} />}</RequireStore>;
}

function ProductEditContent({ productId }: { productId: string }) {
  const { data: product, isLoading, isError, isMissing, refetch } = useProduct(productId);

  if (isLoading) {
    return <Skeleton className="h-96 w-full max-w-2xl" />;
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
            <Link href="/brand/products">Back to products</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Edit product</h1>
        <p className="text-sm text-muted-foreground">{product.title}</p>
      </div>
      <ProductForm product={product} />
    </div>
  );
}

export { ProductEditView };
