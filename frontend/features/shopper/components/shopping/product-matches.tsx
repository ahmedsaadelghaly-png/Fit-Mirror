"use client";

import { Ruler, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { ProductTryOnDialog } from "@/features/shopper/components/shop/product-try-on-dialog";
import { useCatalogProducts } from "@/features/shopper/hooks/use-catalog-products";
import { useSizeRecommendation } from "@/features/shopper/hooks/use-size-recommendation";
import { ProductCard } from "@/shared/components/cards/product-card";
import type { Product } from "@/types/domain";

export interface ProductMatchesProps {
  /** Best match first — the Shopping Assistant's `matched_product_ids`. */
  productIds: string[];
}

/**
 * Renders the Shopping Assistant's latest matches as product cards (via
 * `GET /catalog/products?ids=`), each with an on-demand "Find my size"
 * (`POST /sizing/recommend`, from the shopper's body profile).
 */
function ProductMatches({ productIds }: ProductMatchesProps) {
  const { data: products, isLoading, isError } = useCatalogProducts(productIds);
  const [tryOnProduct, setTryOnProduct] = useState<Product | null>(null);

  if (productIds.length === 0) return null;
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading matches…</p>;
  }
  if (isError || !products) {
    return <p className="text-sm text-destructive">Couldn&apos;t load the matched products.</p>;
  }

  return (
    <section aria-label="Matched products" className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Matches</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {products.map((product) => (
          <ProductMatch key={product.id} product={product} onTryOn={setTryOnProduct} />
        ))}
      </div>
      <ProductTryOnDialog
        product={tryOnProduct}
        onOpenChange={(open) => !open && setTryOnProduct(null)}
      />
    </section>
  );
}

function ProductMatch({
  product,
  onTryOn,
}: {
  product: Product;
  onTryOn: (product: Product) => void;
}) {
  const sizing = useSizeRecommendation();
  const sizes = product.variants.map((variant) => variant.size_label).join(" · ");
  const sizingError = sizing.error instanceof ApiError ? sizing.error : null;

  return (
    <div className="flex flex-col gap-2">
      <ProductCard
        imageKey={product.primary_image_key}
        alt={product.title}
        name={product.title}
        subtitle={sizes || product.category}
        price={`${product.currency} ${product.price}`}
      />
      {sizing.data ? (
        <p className="text-xs" aria-live="polite">
          <span className="font-medium">
            Your size: {sizing.data.recommended_size_label} (
            {Math.round(sizing.data.confidence * 100)}% match)
          </span>
          <span className="block text-muted-foreground">{sizing.data.fit_note}</span>
        </p>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          isLoading={sizing.isPending}
          onClick={() => sizing.mutate({ productId: product.id })}
        >
          <Ruler className="size-3.5" /> Find my size
        </Button>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={() => onTryOn(product)}>
        <Sparkles className="size-3.5" /> Try on
      </Button>
      {sizingError && (
        <p className="text-xs text-destructive" role="alert">
          {sizingError.message}{" "}
          {sizingError.status === 422 && (
            <Link href="/shopper/profile" className="underline">
              Update body profile
            </Link>
          )}
        </p>
      )}
    </div>
  );
}

export { ProductMatches };
