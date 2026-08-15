import { beforeEach, describe, expect, it } from "vitest";

import { resolveProduct } from "@/features/brand/lib/resolve-product";
import type { ProductOverlay } from "@/types/brand";
import type { Product } from "@/types/domain";

const productId = "11111111-1111-1111-1111-111111111111";

const baseProduct: Product = {
  id: productId,
  title: "Classic Cotton T-Shirt",
  description: null,
  category: "tops",
  price: "24.99",
  currency: "USD",
  primary_image_key: null,
  is_active: true,
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

function seedOverlay(overlay: ProductOverlay) {
  window.localStorage.setItem(
    `fitmirror.product-overlay.${overlay.productId}`,
    JSON.stringify(overlay),
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("resolveProduct", () => {
  it("returns the server product unchanged when no overlay exists", () => {
    const resolved = resolveProduct(baseProduct);

    expect(resolved.title).toBe("Classic Cotton T-Shirt");
    expect(resolved.isArchived).toBe(false);
    expect(resolved.hasLocalEdits).toBe(false);
    expect(resolved.variants).toEqual(baseProduct.variants);
  });

  it("applies local field overrides on top of the server product", () => {
    seedOverlay({
      productId,
      overrides: { title: "Renamed T-Shirt" },
      isActiveOverride: null,
      isArchived: false,
      variants: [],
    });

    const resolved = resolveProduct(baseProduct);

    expect(resolved.title).toBe("Renamed T-Shirt");
    expect(resolved.category).toBe("tops");
    expect(resolved.hasLocalEdits).toBe(true);
  });

  it("applies the active-status override instead of the server's is_active", () => {
    seedOverlay({
      productId,
      overrides: {},
      isActiveOverride: false,
      isArchived: false,
      variants: [],
    });

    const resolved = resolveProduct(baseProduct);

    expect(resolved.is_active).toBe(false);
    expect(resolved.hasLocalEdits).toBe(true);
  });

  it("marks the product archived via the overlay flag", () => {
    seedOverlay({
      productId,
      overrides: {},
      isActiveOverride: null,
      isArchived: true,
      variants: [],
    });

    const resolved = resolveProduct(baseProduct);

    expect(resolved.isArchived).toBe(true);
  });

  it("replaces the server's variants with locally-added ones when present", () => {
    seedOverlay({
      productId,
      overrides: {},
      isActiveOverride: null,
      isArchived: false,
      variants: [
        {
          id: "v2",
          size_label: "L",
          color: "White",
          sku: "TSHIRT-WHT-L",
          stock_quantity: 40,
          garment_image_key: null,
        },
      ],
    });

    const resolved = resolveProduct(baseProduct);

    expect(resolved.variants).toHaveLength(1);
    expect(resolved.variants[0]?.size_label).toBe("L");
  });
});
