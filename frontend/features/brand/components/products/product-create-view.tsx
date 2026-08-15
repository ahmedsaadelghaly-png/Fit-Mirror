"use client";

import { ProductForm } from "@/features/brand/components/products/product-form";
import { RequireStore } from "@/features/brand/components/require-store";

function ProductCreateView() {
  return (
    <RequireStore>
      {() => (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-display text-2xl font-semibold">Add a product</h1>
            <p className="text-sm text-muted-foreground">
              Add variants (sizes, colors, stock) after creating the product.
            </p>
          </div>
          <ProductForm />
        </div>
      )}
    </RequireStore>
  );
}

export { ProductCreateView };
