import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AnalyticsView } from "@/features/brand/components/analytics/analytics-view";
import type { StoreAnalytics } from "@/types/brand";

const { fetchStoreAnalyticsMock } = vi.hoisted(() => ({ fetchStoreAnalyticsMock: vi.fn() }));

vi.mock("@/api/brand/analytics", () => ({ fetchStoreAnalytics: fetchStoreAnalyticsMock }));
vi.mock("@/features/brand/components/require-store", () => ({
  RequireStore: ({ children }: { children: () => ReactNode }) => <>{children()}</>,
}));

const report: StoreAnalytics = {
  days: 30,
  tryons: 8,
  shoppers: 3,
  completed: 4,
  saved_looks: 1,
  top_products: [{ product_id: "p1", title: "Linen Blazer", tryons: 8, shoppers: 3 }],
  size_demand: [{ size_label: "M", tryons: 6 }],
  fit_counts: { small: 1, true_to_size: 3, large: 0 },
};

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AnalyticsView />
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("AnalyticsView", () => {
  it("shows totals, rates, products, sizes and fit for the last 30 days", async () => {
    fetchStoreAnalyticsMock.mockResolvedValue(report);
    renderView();

    expect(await screen.findByRole("link", { name: "Linen Blazer" })).toBeInTheDocument();
    expect(fetchStoreAnalyticsMock).toHaveBeenCalledWith(30);
    expect(screen.getByText("50%")).toBeInTheDocument(); // completed 4 of 8
    expect(screen.getAllByText("25%")).toHaveLength(2); // saved 1 of 4; runs small 1 of 4
    expect(screen.getAllByText("75%")).toHaveLength(2); // size M 6 of 8; true to size 3 of 4
  });

  it("explains an empty period instead of showing empty tables", async () => {
    fetchStoreAnalyticsMock.mockResolvedValue({
      ...report,
      tryons: 0,
      shoppers: 0,
      completed: 0,
      saved_looks: 0,
      top_products: [],
      size_demand: [],
      fit_counts: { small: 0, true_to_size: 0, large: 0 },
    });
    renderView();

    expect(await screen.findByText("No try-ons in this period")).toBeInTheDocument();
    expect(screen.getByText("No fit reports yet.")).toBeInTheDocument();
  });

  it("offers a retry when the report fails", async () => {
    fetchStoreAnalyticsMock.mockRejectedValue(new Error("boom"));
    renderView();

    expect(await screen.findByText("Couldn't load analytics")).toBeInTheDocument();
  });
});
