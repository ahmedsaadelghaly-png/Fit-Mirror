import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StylistView } from "@/features/shopper/components/stylist/stylist-view";

const mocks = vi.hoisted(() => ({
  requestStylistSuggestion: vi.fn(),
  sendOutfitFeedback: vi.fn(),
  listWardrobeItems: vi.fn(),
}));

vi.mock("@/api/shopper/stylist", () => ({
  requestStylistSuggestion: mocks.requestStylistSuggestion,
  sendOutfitFeedback: mocks.sendOutfitFeedback,
}));
vi.mock("@/api/shopper/wardrobe", () => ({ listWardrobeItems: mocks.listWardrobeItems }));
vi.mock("@/shared/components/resolved-image", () => ({ ResolvedImage: () => null }));

function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const item = (id: string, label: string, category: string) => ({
  id,
  label,
  category,
  source: "uploaded",
  image_key: `wardrobe/${id}.jpg`,
  product_variant_id: null,
});

beforeEach(() => vi.clearAllMocks());

describe("StylistView feedback", () => {
  it("shows the suggested pieces and sends a like", async () => {
    mocks.listWardrobeItems.mockResolvedValue([
      item("w1", "Navy Linen Shirt", "tops"),
      item("w2", "Beige Chinos", "bottoms"),
      item("w3", "Ripped Jeans", "bottoms"),
    ]);
    mocks.requestStylistSuggestion.mockResolvedValue({
      suggestion_id: "s-1",
      wardrobe_item_ids: ["w1", "w2"],
      rationale: "For brunch, try Navy Linen Shirt with Beige Chinos.",
    });
    mocks.sendOutfitFeedback.mockResolvedValue(undefined);

    renderWithClient(<StylistView />);
    fireEvent.change(screen.getByLabelText("Occasion"), { target: { value: "Brunch" } });
    fireEvent.click(screen.getByRole("button", { name: /ask/i }));

    const outfit = await screen.findByRole("list", { name: "Suggested outfit" });
    expect(outfit).toHaveTextContent("Navy Linen Shirt");
    expect(outfit).toHaveTextContent("Beige Chinos");
    expect(outfit).not.toHaveTextContent("Ripped Jeans");

    fireEvent.click(screen.getByRole("button", { name: /love it/i }));
    await waitFor(() => expect(mocks.sendOutfitFeedback).toHaveBeenCalledWith("s-1", true));
    expect(await screen.findByRole("status")).toHaveTextContent(/keep that in mind/i);
  });
});
