import { Shirt } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResolvedImage } from "@/shared/components/resolved-image";
import type { Product } from "@/types/domain";

export interface RecentProductsCardProps {
  products: Product[];
}

function RecentProductsCard({ products }: RecentProductsCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Recent products</CardTitle>
          <CardDescription>The latest additions to your catalog</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/brand/products">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Shirt className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              No products yet — add your first one to see it here.
            </p>
            <Button asChild size="sm">
              <Link href="/brand/products/new">Add a product</Link>
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {products.map((product) => (
              <li key={product.id} className="flex items-center gap-3">
                <ResolvedImage
                  imageKey={product.primary_image_key}
                  alt={product.title}
                  className="size-10 shrink-0 rounded-md"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{product.title}</span>
                <Badge variant={product.is_active ? "success" : "secondary"}>
                  {product.is_active ? "Active" : "Inactive"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { RecentProductsCard };
