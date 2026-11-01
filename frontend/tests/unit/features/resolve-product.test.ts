import { describe, expect, it } from "vitest";

import { resolveProduct } from "@/features/brand/lib/resolve-product";
import type { Product } from "@/types/domain";

const baseProduct: Product = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Classic Cotton T-Shirt",
  description: null,
  category: "tops",
  price: "24.99",
  currency: "USD",
  primary_image_key: null,
  is_active: true,
  is_archived: false,
  variants: [
    {
      id: "v1",
      size_label: "M",
      color: "White",
      sku: "TSHIRT-WHT-M",
      stock_quantity: 50,
      garment_image_key: null,
    },
  ],
};

describe("resolveProduct", () => {
  it("returns the server product with the isArchived alias", () => {
    const resolved = resolveProduct(baseProduct);

    expect(resolved).toEqual({ ...baseProduct, isArchived: false });
  });

  it("reflects the server's archived flag, independent of is_active", () => {
    const resolved = resolveProduct({ ...baseProduct, is_archived: true });

    expect(resolved.isArchived).toBe(true);
    expect(resolved.is_active).toBe(true);
  });

  it("ignores any stale pre-Phase-3.1 localStorage overlay", () => {
    window.localStorage.setItem(
      `fitmirror.product-overlay.${baseProduct.id}`,
      JSON.stringify({
        productId: baseProduct.id,
        overrides: { title: "Stale" },
        isArchived: true,
      }),
    );

    const resolved = resolveProduct(baseProduct);

    expect(resolved.title).toBe("Classic Cotton T-Shirt");
    expect(resolved.isArchived).toBe(false);
  });
});
