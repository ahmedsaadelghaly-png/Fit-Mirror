"use client";

import { Archive, MoreHorizontal, Pencil, RotateCcw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductStatusBadge } from "@/features/brand/components/products/product-status-badge";
import { useArchiveProduct } from "@/features/brand/hooks/use-archive-product";
import { useToggleProductActive } from "@/features/brand/hooks/use-toggle-product-active";
import { ResolvedImage } from "@/shared/components/resolved-image";
import type { ResolvedProduct } from "@/types/brand";

export interface ProductsTableProps {
  products: ResolvedProduct[];
}

/**
 * The active/inactive toggle and archive action are both local-overlay
 * placeholders (see api/brand/product-overlay.ts) — the backend has no
 * endpoint to persist either. They're fully interactive so the UX can be
 * evaluated, but changes only live in this browser.
 */
function ProductsTable({ products }: ProductsTableProps) {
  const toggleActiveMutation = useToggleProductActive();
  const archiveMutation = useArchiveProduct();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Variants</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              <Link href={`/brand/products/${product.id}`} className="flex items-center gap-3">
                <ResolvedImage
                  imageKey={product.primary_image_key}
                  alt={product.title}
                  className="size-10 shrink-0 rounded-md"
                />
                <span className="font-medium hover:underline">{product.title}</span>
                {product.hasLocalEdits && (
                  <span className="text-xs text-muted-foreground" title="Has unsynced local edits">
                    (edited)
                  </span>
                )}
              </Link>
            </TableCell>
            <TableCell className="capitalize">{product.category}</TableCell>
            <TableCell className="font-mono text-xs">
              {product.currency} {product.price}
            </TableCell>
            <TableCell>{product.variants.length}</TableCell>
            <TableCell>
              <ProductStatusBadge isActive={product.is_active} isArchived={product.isArchived} />
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Actions for ${product.title}`}>
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export { ProductsTable };
