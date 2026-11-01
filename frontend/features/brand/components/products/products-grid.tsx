"use client";

import { Archive, MoreHorizontal, Pencil, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductStatusBadge } from "@/features/brand/components/products/product-status-badge";
import { useArchiveProduct } from "@/features/brand/hooks/use-archive-product";
import { useToggleProductActive } from "@/features/brand/hooks/use-toggle-product-active";
import { ProductCard } from "@/shared/components/cards/product-card";
import type { ResolvedProduct } from "@/types/brand";

export interface ProductsGridProps {
  products: ResolvedProduct[];
}

/**
 * Card-grid replacement for the former row-per-product ProductsTable —
 * same data (ResolvedProduct, the server+local-overlay merge from
 * resolve-product.ts) and the same two mutations
 * (useToggleProductActive/useArchiveProduct, identical payload shapes),
 * just a photography-forward layout instead of a table. See
 * docs/frontend/DESIGN_SYSTEM.md "Fashion-specific components".
 *
 * Navigation uses router.push (not a wrapping <Link>) so ProductCard
 * stays the sole interactive control — nesting a real <a> around a
 * role="button" div would create a nested-interactive-element a11y
 * issue. The dropdown trigger/content stop propagation so acting on a
 * product (toggle/archive/edit) doesn't also navigate to its detail page.
 */
function ProductsGrid({ products }: ProductsGridProps) {
  const router = useRouter();
  const toggleActiveMutation = useToggleProductActive();
  const archiveMutation = useArchiveProduct();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          imageKey={product.primary_image_key}
          alt={product.title}
          name={product.title}
          subtitle={product.category}
          price={`${product.currency} ${product.price}`}
          onClick={() => router.push(`/brand/products/${product.id}`)}
          badge={
            <ProductStatusBadge isActive={product.is_active} isArchived={product.isArchived} />
          }
          actions={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-8 rounded-full"
                  aria-label={`Actions for ${product.title}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                <DropdownMenuItem asChild>
                  <Link href={`/brand/products/${product.id}/edit`}>
                    <Pencil className="mr-2 size-4" /> Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    toggleActiveMutation.mutate({
                      productId: product.id,
                      isActive: !product.is_active,
                    })
                  }
                >
                  {product.is_active ? "Mark inactive" : "Mark active"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    archiveMutation.mutate({
                      productId: product.id,
                      isArchived: !product.isArchived,
                    })
                  }
                >
                  {product.isArchived ? (
                    <>
                      <RotateCcw className="mr-2 size-4" /> Unarchive
                    </>
                  ) : (
                    <>
                      <Archive className="mr-2 size-4" /> Archive
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      ))}
    </div>
  );
}

export { ProductsGrid };
