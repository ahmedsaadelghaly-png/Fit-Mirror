import { describe, expect, it } from "vitest";

import { buildDashboardSummary } from "@/features/brand/lib/dashboard-summary-adapter";
import type { Product, StoreDashboardSummary } from "@/types/domain";

const summary: StoreDashboardSummary = {
  total_products: 2,
  total_tryon_jobs: 12,
  completed_tryon_jobs: 10,
  failed_tryon_jobs: 1,
};

function product(overrides: Partial<Product>): Product {
  return {
    id: crypto.randomUUID(),
    title: "T-Shirt",
    description: null,
    category: "tops",
    audience: "unisex",
    price: "24.99",
    currency: "USD",
    primary_image_key: null,
    is_active: true,
    is_archived: false,
    variants: [],
    ...overrides,
  };
}

describe("buildDashboardSummary", () => {
  it("passes through the store-wide try-on totals unchanged", () => {
    const result = buildDashboardSummary({ summary, products: [], businessInfo: undefined });

    expect(result.tryOnJobCount).toBe(12);
    expect(result.completedTryOnCount).toBe(10);
    expect(result.failedTryOnCount).toBe(1);
  });

  it("counts total and active products separately", () => {
    const products = [product({ is_active: true }), product({ is_active: false })];
    const result = buildDashboardSummary({ summary, products, businessInfo: undefined });

    expect(result.productCount).toBe(2);
    expect(result.activeProductCount).toBe(1);
  });

  it("keeps the API's newest-first order, capped at 5", () => {
    const products = Array.from({ length: 7 }, (_, index) =>
      product({ title: `Product ${index}` }),
    );
    const result = buildDashboardSummary({ summary, products, businessInfo: undefined });

    expect(result.recentProducts).toHaveLength(5);
    expect(result.recentProducts[0]?.title).toBe("Product 0");
  });

  it("marks every checklist item incomplete when there's no business info or products yet", () => {
    const result = buildDashboardSummary({ summary, products: [], businessInfo: undefined });

    const logoItem = result.setupChecklist.find((item) => item.id === "logo-uploaded");
    const productItem = result.setupChecklist.find((item) => item.id === "first-product-added");
    expect(logoItem?.isComplete).toBe(false);
    expect(productItem?.isComplete).toBe(false);
    expect(result.isSetupComplete).toBe(false);
  });

  it("marks the checklist complete once every step's data is present", () => {
    const result = buildDashboardSummary({
      summary,
      products: [product({})],
      businessInfo: {
        category: "womenswear",
        description: "A demo store.",
        social_links: { website: null, instagram: null, tiktok: null },
        logo_image_key: "user-photos/abc.png",
      },
    });

    expect(result.isSetupComplete).toBe(true);
    expect(result.setupChecklist.every((item) => item.isComplete)).toBe(true);
  });
});
