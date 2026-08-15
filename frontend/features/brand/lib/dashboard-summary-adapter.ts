import type { StoreBusinessInfo } from "@/types/brand";
import type { Product, StoreDashboardSummary } from "@/types/domain";

export interface SetupChecklistItem {
  id: string;
  label: string;
  isComplete: boolean;
  href: string;
}

export interface DashboardSummaryViewModel {
  productCount: number;
  activeProductCount: number;
  tryOnJobCount: number;
  completedTryOnCount: number;
  failedTryOnCount: number;
  recentProducts: Product[];
  setupChecklist: SetupChecklistItem[];
  isSetupComplete: boolean;
}

/**
 * Pure adapter turning the three independent data sources the Brand
 * dashboard needs (`GET /store/me/summary`, `GET /store/products`, and the
 * localStorage-backed `StoreBusinessInfo`) into one view model — kept
 * side-effect-free and exported standalone so it's unit-testable without
 * mocking TanStack Query or localStorage. See
 * tests/unit/features/dashboard-summary-adapter.test.ts.
 *
 * `Product` carries no timestamp field (same gap as `TryOnJob` in Phase
 * 2.3's shopper app), so "recent products" approximates recency by
 * reversing the list endpoint's insertion order.
 */
export function buildDashboardSummary(input: {
  summary: StoreDashboardSummary;
  products: Product[];
  businessInfo: StoreBusinessInfo | undefined;
}): DashboardSummaryViewModel {
  const { summary, products, businessInfo } = input;
  const activeProducts = products.filter((product) => product.is_active);

  const setupChecklist: SetupChecklistItem[] = [
    {
      id: "store-created",
      label: "Create your store",
      isComplete: true,
      href: "/brand/onboarding",
    },
    {
      id: "logo-uploaded",
      label: "Upload a store logo",
      isComplete: !!businessInfo?.logo_image_key,
      href: "/brand/profile",
    },
    {
      id: "description-added",
      label: "Add a store description",
      isComplete: !!businessInfo?.description,
      href: "/brand/profile",
    },
    {
      id: "first-product-added",
      label: "Add your first product",
      isComplete: products.length > 0,
      href: "/brand/products/new",
    },
  ];

  return {
    productCount: products.length,
    activeProductCount: activeProducts.length,
    tryOnJobCount: summary.total_tryon_jobs,
    completedTryOnCount: summary.completed_tryon_jobs,
    failedTryOnCount: summary.failed_tryon_jobs,
    recentProducts: [...products].reverse().slice(0, 5),
    setupChecklist,
    isSetupComplete: setupChecklist.every((item) => item.isComplete),
  };
}
