import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/client";
import { ProductMatches } from "@/features/shopper/components/shopping/product-matches";
import type { Product } from "@/types/domain";

const { listCatalogProductsByIdsMock, recommendSizeMock } = vi.hoisted(() => ({
  listCatalogProductsByIdsMock: vi.fn(),
  recommendSizeMock: vi.fn(),
}));

vi.mock("@/api/shopper/catalog", () => ({
  listCatalogProductsByIds: listCatalogProductsByIdsMock,
}));
vi.mock("@/api/shopper/sizing", () => ({ recommendSize: recommendSizeMock }));
// The card's image resolves storage keys over the network; not under test here.
vi.mock("@/shared/components/resolved-image", () => ({ ResolvedImage: () => null }));

const jacket: Product = {
  id: "p-1",
  title: "Lightweight Bomber Jacket",
  description: null,
  category: "outerwear",
  price: "89.99",
  currency: "USD",
  primary_image_key: null,
  is_active: true,
  is_archived: false,
  variants: [
    {
      id: "v-s",
      size_label: "S",
      color: "Black",
      sku: "B-S",
      stock_quantity: 3,
      garment_image_key: null,
    },
    {
      id: "v-m",
      size_label: "M",
      color: "Black",
      sku: "B-M",
      stock_quantity: 3,
      garment_image_key: null,
    },
  ],
};

function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProductMatches", () => {
  it("renders nothing without matches", () => {
    const { container } = renderWithClient(<ProductMatches productIds={[]} />);
    expect(container).toBeEmptyDOMElement();
    expect(listCatalogProductsByIdsMock).not.toHaveBeenCalled();
  });

  it("loads matched products and shows a size recommendation on demand", async () => {
    listCatalogProductsByIdsMock.mockResolvedValueOnce([jacket]);
    recommendSizeMock.mockResolvedValueOnce({
      product_id: "p-1",
      recommended_size_label: "M",
      confidence: 0.95,
      fit_note: "Your measurements fall within M on our size chart.",
    });

    renderWithClient(<ProductMatches productIds={["p-1"]} />);

    expect(await screen.findByText("Lightweight Bomber Jacket")).toBeInTheDocument();
    expect(screen.getByText("S · M")).toBeInTheDocument();
    expect(listCatalogProductsByIdsMock).toHaveBeenCalledWith(["p-1"]);

    fireEvent.click(screen.getByRole("button", { name: /find my size/i }));

    expect(await screen.findByText(/Your size: M/)).toBeInTheDocument();
    expect(screen.getByText(/95% match/)).toBeInTheDocument();
    expect(recommendSizeMock).toHaveBeenCalledWith("p-1", expect.anything());
  });

  it("links to the body profile when measurements are missing", async () => {
    listCatalogProductsByIdsMock.mockResolvedValueOnce([jacket]);
    recommendSizeMock.mockRejectedValueOnce(
      new ApiError("Add your chest / waist measurements.", 422, "validation_error"),
    );

    renderWithClient(<ProductMatches productIds={["p-1"]} />);
    fireEvent.click(await screen.findByRole("button", { name: /find my size/i }));

    expect(await screen.findByText(/Add your chest/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /update body profile/i })).toHaveAttribute(
      "href",
      "/shopper/profile",
    );
  });
});
