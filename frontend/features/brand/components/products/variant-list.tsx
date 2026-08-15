"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VariantFormDialog } from "@/features/brand/components/products/variant-form-dialog";
import { useDeleteVariant } from "@/features/brand/hooks/use-delete-variant";
import { ResolvedImage } from "@/shared/components/resolved-image";
import type { ProductVariant } from "@/types/domain";

const LOW_STOCK_THRESHOLD = 10;

export interface VariantListProps {
  productId: string;
  variants: ProductVariant[];
}

function VariantList({ productId, variants }: VariantListProps) {
  const deleteMutation = useDeleteVariant(productId);

  if (variants.length === 0) {
    return (
      <EmptyState
        title="No variants yet"
        description="Add sizes, colors, and stock levels for this product."
        action={<VariantFormDialog productId={productId} />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <VariantFormDialog productId={productId} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14" />
            <TableHead>Size</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((variant) => (
            <TableRow key={variant.id}>
              <TableCell>
                <ResolvedImage
                  imageKey={variant.garment_image_key}
                  alt={`${variant.size_label} ${variant.color ?? ""}`}
                  className="size-10 rounded-md"
                />
              </TableCell>
              <TableCell>{variant.size_label}</TableCell>
              <TableCell>{variant.color ?? "—"}</TableCell>
              <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5">
                  {variant.stock_quantity}
                  {variant.stock_quantity <= LOW_STOCK_THRESHOLD && (
                    <Badge variant="warning">Low</Badge>
                  )}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <VariantFormDialog
                    productId={productId}
                    variant={variant}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${variant.size_label} variant`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(variant.id)}
                    isLoading={deleteMutation.isPending}
                    aria-label={`Delete ${variant.size_label} variant`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export { VariantList };
