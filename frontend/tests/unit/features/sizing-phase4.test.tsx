import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SizeChartsView, toCsv } from "@/features/brand/components/size-charts/size-charts-view";
import { ProductTryOnDialog } from "@/features/shopper/components/shop/product-try-on-dialog";
import { describeFit } from "@/shared/utils/fit-summary";
import type { Product } from "@/types/domain";

const mocks = vi.hoisted(() => ({
  listSizeCharts: vi.fn(),
  saveSizeChartCsv: vi.fn(),
  listBodyProfiles: vi.fn(),
  recommendSize: vi.fn(),
  reportFit: vi.fn(),
}));

vi.mock("@/api/brand/size-charts", () => ({
  SIZED_CATEGORIES: ["tops", "outerwear", "dresses", "bottoms"],
  listSizeCharts: mocks.listSizeCharts,
  saveSizeChartCsv: mocks.saveSizeChartCsv,
  deleteSizeChart: vi.fn(),
}));
vi.mock("@/api/shopper/body-profile", () => ({ listBodyProfiles: mocks.listBodyProfiles }));
vi.mock("@/api/shopper/sizing", () => ({
  recommendSize: mocks.recommendSize,
  reportFit: mocks.reportFit,
}));
vi.mock("@/api/shopper/tryon", () => ({ createTryOnJob: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/features/brand/components/require-store", () => ({
  RequireStore: ({ children }: { children: () => ReactNode }) => <>{children()}</>,
}));
vi.mock("@/shared/components/resolved-image", () => ({ ResolvedImage: () => null }));
vi.mock("@/shared/components/confirm-dialog-provider", () => ({ useConfirm: () => vi.fn() }));

function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

beforeEach(() => vi.clearAllMocks());

describe("describeFit", () => {
  it("names the agreed fit with the vote count, or nothing without agreement", () => {
    expect(describeFit({ reports: 5, small: 4, true_to_size: 1, large: 0, runs: "small" })).toBe(
      "Runs small — 4 of 5 shoppers",
    );
    expect(describeFit({ reports: 2, small: 2, true_to_size: 0, large: 0, runs: null })).toBeNull();
    expect(describeFit(null)).toBeNull();
  });
});

describe("size charts", () => {
  const tops = {
    category: "tops",
    updated_at: "2026-11-02T08:00:00Z",
    rows: [
      { size_label: "S", chest_cm: [84, 91] as [number, number] },
      {
        size_label: "M",
        chest_cm: [91, 98] as [number, number],
        waist_cm: [73, 80] as [number, number],
      },
    ],
  };

  it("round-trips a chart to editable CSV with only the columns in use", () => {
    expect(toCsv(tops)).toBe("size,chest,waist\nS,84-91,\nM,91-98,73-80\n");
  });

  it("shows each category and saves an edited chart as CSV", async () => {
    mocks.listSizeCharts.mockResolvedValue([tops]);
    mocks.saveSizeChartCsv.mockResolvedValue(tops);
    renderWithClient(<SizeChartsView />);

    expect(await screen.findByText("Your chart")).toBeInTheDocument();
    expect(screen.getAllByText("Using the standard chart")).toHaveLength(3);

    fireEvent.click(screen.getAllByRole("button", { name: /add chart/i })[0]!);
    const csv = await screen.findByLabelText(/chart \(csv\)/i);
    fireEvent.change(csv, { target: { value: "size,waist\n30,74-78\n" } });
    fireEvent.click(screen.getByRole("button", { name: /save chart/i }));

    await waitFor(() =>
      expect(mocks.saveSizeChartCsv).toHaveBeenCalledWith("outerwear", "size,waist\n30,74-78\n"),
    );
  });
});

describe("fit feedback in the try-on dialog", () => {
  const tee: Product = {
    id: "p-tee",
    title: "Essential Black Tee",
    description: null,
    category: "tops",
    audience: "unisex",
    price: "19.99",
    currency: "USD",
    primary_image_key: null,
    is_active: true,
    is_archived: false,
    variants: ["S", "M", "L"].map((size) => ({
      id: `v-${size}`,
      size_label: size,
      color: "Black",
      sku: size,
      stock_quantity: 4,
      garment_image_key: null,
    })),
  };

  it("shows what shoppers say and records this shopper's verdict", async () => {
    mocks.listBodyProfiles.mockResolvedValue([
      {
        id: "me",
        name: "Me",
        is_primary: true,
        body_category: "women",
        height_cm: 168,
        weight_kg: null,
        chest_cm: 92,
        waist_cm: 76,
        hip_cm: 98,
        body_shape: null,
        reference_image_key: null,
        preferred_fit: null,
        favorite_colors: [],
        style_preferences: [],
      },
    ]);
    mocks.recommendSize.mockResolvedValue({
      product_id: "p-tee",
      recommended_size_label: "L",
      confidence: 0.9,
      fit_note:
        "Your measurements match M. 3 of 4 shoppers say this runs small, so we went one size up.",
      body_profile_id: "me",
      profile_name: "Me",
      size_chart: "brand",
      fit_feedback: { reports: 4, small: 3, true_to_size: 1, large: 0, runs: "small" },
    });
    mocks.reportFit.mockResolvedValue({
      reports: 5,
      small: 4,
      true_to_size: 1,
      large: 0,
      runs: "small",
    });

    renderWithClient(<ProductTryOnDialog product={tee} onOpenChange={() => undefined} />);
    fireEvent.click(await screen.findByRole("button", { name: /find your size/i }));

    expect(await screen.findByText("Runs small — 3 of 4 shoppers")).toBeInTheDocument();
    expect(screen.getByText(/brand's own size chart/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "True to size" }));
    await waitFor(() =>
      expect(mocks.reportFit).toHaveBeenCalledWith(
        { product_id: "p-tee", size_label: "L", fit: "true_to_size" },
        expect.anything(),
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(/thanks/i);
  });
});
