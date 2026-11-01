import { Shirt } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductCard } from "@/shared/components/cards/product-card";
import type { Product } from "@/types/domain";

export interface RecentProductsCardProps {
  products: Product[];
}

function RecentProductsCard({ products }: RecentProductsCardProps) {
  return (
    <Card className="lg:col-span-2">
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
          <div className="flex flex-wrap gap-3">
            {products.map((product) => (
              <div key={product.id} className="w-32">
                <ProductCard
                  imageKey={product.primary_image_key}
                  alt={product.title}
                  name={product.title}
                  badge={
                    <Badge variant={product.is_active ? "success" : "secondary"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  }
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { RecentProductsCard };
