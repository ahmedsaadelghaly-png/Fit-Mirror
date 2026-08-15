import { Shirt } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface ProductCountCardProps {
  productCount: number;
  activeProductCount: number;
}

function ProductCountCard({ productCount, activeProductCount }: ProductCountCardProps) {
  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shirt className="size-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-base">Products</CardTitle>
        </div>
        <CardDescription>
          {activeProductCount} active of {productCount} total
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <span className="font-display text-3xl font-semibold">{productCount}</span>
        <Button asChild variant="outline" size="sm">
          <Link href="/brand/products">{productCount === 0 ? "Add product" : "Manage"}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export { ProductCountCard };
