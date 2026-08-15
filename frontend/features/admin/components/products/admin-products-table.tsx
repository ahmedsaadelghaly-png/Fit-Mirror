"use client";

import { Flag, MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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
import { useFlagProduct } from "@/features/admin/hooks/use-flag-product";
import { useHideProduct } from "@/features/admin/hooks/use-hide-product";
import type { ResolvedAdminProduct } from "@/features/admin/lib/resolve-admin-product";
import { ResolvedImage } from "@/shared/components/resolved-image";

export interface AdminProductsTableProps {
  products: ResolvedAdminProduct[];
}

/** Flag and hide are both local-overlay placeholders — see api/admin/products.ts. */
function AdminProductsTable({ products }: AdminProductsTableProps) {
  const flagMutation = useFlagProduct();
  const hideMutation = useHideProduct();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Store</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3">
                <ResolvedImage
                  imageKey={product.primary_image_key}
                  alt={product.title}
                  className="size-10 rounded-md"
                />
                <span className="font-medium hover:underline">{product.title}</span>
                {product.isFlagged && (
                  <Flag className="size-3.5 text-destructive" aria-label="Flagged" />
                )}
              </Link>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{product.store_name}</TableCell>
            <TableCell className="capitalize">{product.category}</TableCell>
            <TableCell className="font-mono text-xs">
              {product.currency} {product.price}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={product.is_active ? "success" : "secondary"}>
                  {product.is_active ? "Active" : "Inactive"}
                </Badge>
                {product.isHidden && <Badge variant="destructive">Hidden</Badge>}
              </div>
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
                    <Link href={`/admin/products/${product.id}`}>View details</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      flagMutation.mutate({ productId: product.id, isFlagged: !product.isFlagged })
                    }
                  >
                    {product.isFlagged ? "Remove flag" : "Flag product"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      hideMutation.mutate({ productId: product.id, isHidden: !product.isHidden })
                    }
                  >
                    {product.isHidden ? "Unhide" : "Hide from catalog"}
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

export { AdminProductsTable };
