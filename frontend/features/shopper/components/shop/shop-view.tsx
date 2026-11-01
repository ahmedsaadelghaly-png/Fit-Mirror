"use client";

import { Search, ShoppingBag, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PRODUCT_CATEGORIES } from "@/features/brand/schemas";
import { ProductTryOnDialog } from "@/features/shopper/components/shop/product-try-on-dialog";
import { useCatalogBrowse } from "@/features/shopper/hooks/use-catalog-browse";
import { ProductCard } from "@/shared/components/cards/product-card";
import type { Product, ProductAudience } from "@/types/domain";

const AUDIENCE_FILTERS: { value: ProductAudience | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "girls", label: "Girls" },
  { value: "boys", label: "Boys" },
];

const ALL_CATEGORIES = "all";

function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Catalog browse (`GET /catalog/products`) with audience, category and
 * search filters. Each product opens the catalog try-on dialog: size it
 * for anyone in the family, then try it on.
 */
function ShopView() {
  const [audience, setAudience] = useState<ProductAudience | "all">("all");
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // Debounce typing so each keystroke doesn't fire a request.
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const {
    data: products,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useCatalogBrowse({
    audience: audience === "all" ? undefined : audience,
    category: category === ALL_CATEGORIES ? undefined : category,
    q: search || undefined,
    limit: 48,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Shop</h1>
        <p className="text-sm text-muted-foreground">
          Find the right size for anyone in your family, then see it on before you buy.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Shop for">
          {AUDIENCE_FILTERS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={audience === option.value ? "default" : "outline"}
              aria-pressed={audience === option.value}
              onClick={() => setAudience(option.value)}
              className="rounded-full"
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44" aria-label="Category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
              {PRODUCT_CATEGORIES.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatCategory(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Search products"
              placeholder="Search products"
              className="w-56 pl-9"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[3/4] w-full" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState
          description="We couldn't load the catalog. Please try again."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && products?.length === 0 && (
        <EmptyState
          icon={ShoppingBag}
          title="Nothing matches yet"
          description="Try another category or a different search."
        />
      )}

      {!isLoading && !isError && products && products.length > 0 && (
        <div
          className="grid grid-cols-2 gap-x-4 gap-y-6 transition-opacity md:grid-cols-3 xl:grid-cols-4"
          style={{ opacity: isFetching ? 0.6 : 1 }}
          aria-busy={isFetching}
        >
          {products.map((product) => (
            <div key={product.id} className="flex flex-col gap-2">
              <ProductCard
                imageKey={product.primary_image_key}
                alt={product.title}
                name={product.title}
                subtitle={product.variants.map((variant) => variant.size_label).join(" · ")}
                price={`${product.currency} ${product.price}`}
                onClick={() => setActiveProduct(product)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveProduct(product)}
              >
                <Sparkles className="size-3.5" /> Try on
              </Button>
            </div>
          ))}
        </div>
      )}

      <ProductTryOnDialog
        product={activeProduct}
        onOpenChange={(open) => !open && setActiveProduct(null)}
      />
    </div>
  );
}

export { ShopView };
