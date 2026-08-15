import { describe, expect, it } from "vitest";

import {
  productSchema,
  slugify,
  storeBasicsSchema,
  storeBusinessInfoSchema,
  variantSchema,
} from "@/features/brand/schemas";

describe("slugify", () => {
  it("lowercases and hyphenates a store name", () => {
    expect(slugify("Demo Fashion Co.")).toBe("demo-fashion-co");
  });

  it("collapses repeated separators and trims leading/trailing hyphens", () => {
    expect(slugify("  Über --- Cool!!  ")).toBe("ber-cool");
  });
});

describe("storeBasicsSchema (store onboarding validation)", () => {
  it("accepts a valid name and slug", () => {
    const result = storeBasicsSchema.safeParse({
      name: "Demo Fashion Co.",
      slug: "demo-fashion-co",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty store name", () => {
    const result = storeBasicsSchema.safeParse({ name: "", slug: "demo-fashion-co" });
    expect(result.success).toBe(false);
  });

  it("rejects a slug with uppercase letters", () => {
    const result = storeBasicsSchema.safeParse({ name: "Demo", slug: "Demo-Fashion-Co" });
    expect(result.success).toBe(false);
  });

  it("rejects a slug with spaces or underscores", () => {
    expect(storeBasicsSchema.safeParse({ name: "Demo", slug: "demo fashion" }).success).toBe(false);
    expect(storeBasicsSchema.safeParse({ name: "Demo", slug: "demo_fashion" }).success).toBe(false);
  });

  it("rejects a slug shorter than 2 characters", () => {
    const result = storeBasicsSchema.safeParse({ name: "Demo", slug: "d" });
    expect(result.success).toBe(false);
  });
});

describe("storeBusinessInfoSchema", () => {
  it("accepts a fully empty payload — every field is optional", () => {
    const result = storeBusinessInfoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects a website that isn't a full URL", () => {
    const result = storeBusinessInfoSchema.safeParse({ website: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid website URL", () => {
    const result = storeBusinessInfoSchema.safeParse({ website: "https://example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects a category outside the known set", () => {
    const result = storeBusinessInfoSchema.safeParse({ category: "spaceship-parts" });
    expect(result.success).toBe(false);
  });
});

describe("productSchema (product form validation)", () => {
  it("accepts a fully valid product", () => {
    const result = productSchema.safeParse({
      title: "Classic Cotton T-Shirt",
      description: "A soft, everyday tee.",
      category: "tops",
      price: "24.99",
      currency: "USD",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing title", () => {
    const result = productSchema.safeParse({
      title: "",
      category: "tops",
      price: "24.99",
      currency: "USD",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a category outside the known set", () => {
    const result = productSchema.safeParse({
      title: "T-Shirt",
      category: "spaceship-parts",
      price: "24.99",
      currency: "USD",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a price with more than two decimal places", () => {
    const result = productSchema.safeParse({
      title: "T-Shirt",
      category: "tops",
      price: "24.999",
      currency: "USD",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric price", () => {
    const result = productSchema.safeParse({
      title: "T-Shirt",
      category: "tops",
      price: "free",
      currency: "USD",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a whole-number price", () => {
    const result = productSchema.safeParse({
      title: "T-Shirt",
      category: "tops",
      price: "25",
      currency: "USD",
    });
    expect(result.success).toBe(true);
  });
});

describe("variantSchema", () => {
  it("accepts a valid variant", () => {
    const result = variantSchema.safeParse({
      size_label: "M",
      color: "White",
      sku: "TSHIRT-WHT-M",
      stock_quantity: 50,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a variant with no color", () => {
    const result = variantSchema.safeParse({ size_label: "M", sku: "SKU-1", stock_quantity: 0 });
    expect(result.success).toBe(true);
  });

  it("rejects a missing SKU", () => {
    const result = variantSchema.safeParse({ size_label: "M", sku: "", stock_quantity: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects a negative stock quantity", () => {
    const result = variantSchema.safeParse({ size_label: "M", sku: "SKU-1", stock_quantity: -5 });
    expect(result.success).toBe(false);
  });

  it("coerces a numeric string stock quantity (as produced by a number input) into a number", () => {
    const result = variantSchema.safeParse({ size_label: "M", sku: "SKU-1", stock_quantity: "12" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stock_quantity).toBe(12);
    }
  });
});
