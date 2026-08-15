"use client";

import { Boxes } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RequireStore } from "@/features/brand/components/require-store";
import { useProducts } from "@/features/brand/hooks/use-products";

const LOW_STOCK_THRESHOLD = 10;

function InventoryView() {
  return <RequireStore>{() => <InventoryContent />}</RequireStore>;
}

/**
 * Stock quantities are real (`ProductVariant.stock_quantity` from
 * `GET /store/products`, merged with any locally-added variants — see
 * features/brand/lib/resolve-product.ts). "Overview" trends and "bulk
 * update" have no backend to support them — see docs/frontend/BRAND_APP.md.
 */
function InventoryContent() {
  const { isLoading, isError, refetch, products } = useProducts();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        description="We couldn't load your inventory. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  const activeProducts = products.filter((product) => !product.isArchived);
  const rows = activeProducts.flatMap((product) =>
    product.variants.map((variant) => ({ product, variant })),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Inventory</h1>
        <p className="text-sm text-muted-foreground">Stock levels across every product variant.</p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Boxes className="size-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle className="text-base">Bulk stock update</CardTitle>
            </div>
            <Badge variant="secondary">Planned</Badge>
          </div>
          <CardDescription>
            Import a spreadsheet to update stock across many variants at once.
          </CardDescription>
        </CardHeader>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="No variants yet"
          description="Add products and variants to see stock levels here."
          action={
            <Button asChild size="sm">
              <Link href="/brand/products">Go to products</Link>
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ product, variant }) => (
              <TableRow key={variant.id}>
                <TableCell>
                  <Link href={`/brand/products/${product.id}`} className="hover:underline">
                    {product.title}
                  </Link>
                </TableCell>
                <TableCell>{variant.size_label}</TableCell>
                <TableCell>{variant.color ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5">
                    {variant.stock_quantity}
                    {variant.stock_quantity <= LOW_STOCK_THRESHOLD && (
                      <Badge variant="warning">Low stock</Badge>
                    )}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export { InventoryView };
