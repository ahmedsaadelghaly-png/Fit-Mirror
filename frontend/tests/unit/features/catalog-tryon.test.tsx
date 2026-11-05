import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  pickDefaultProfile,
  ProductTryOnDialog,
} from "@/features/shopper/components/shop/product-try-on-dialog";
import {
  newestFirst,
  retryPayload,
  tryOnJobMeta,
  tryOnJobTitle,
} from "@/features/tryon/lib/job-display";
import type { BodyProfile, Product, TryOnJob } from "@/types/domain";

const { listBodyProfilesMock, recommendSizeMock, createTryOnJobMock, pushMock } = vi.hoisted(
  () => ({
    listBodyProfilesMock: vi.fn(),
    recommendSizeMock: vi.fn(),
    createTryOnJobMock: vi.fn(),
    pushMock: vi.fn(),
  }),
);

vi.mock("@/api/shopper/body-profile", () => ({ listBodyProfiles: listBodyProfilesMock }));
vi.mock("@/api/shopper/sizing", () => ({ recommendSize: recommendSizeMock, reportFit: vi.fn() }));
vi.mock("@/api/shopper/tryon", () => ({ createTryOnJob: createTryOnJobMock }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock("@/shared/components/resolved-image", () => ({
  ResolvedImage: ({ alt }: { alt: string }) => <span>{alt}</span>,
}));

function profile(overrides: Partial<BodyProfile>): BodyProfile {
  return {
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
    ...overrides,
  };
}

const me = profile({ reference_image_key: "user-photos/me/me.jpg" });
const lina = profile({
  id: "lina",
  name: "Lina",
  is_primary: false,
  body_category: "girls",
  height_cm: 128,
  reference_image_key: "user-photos/me/lina.jpg",
});

const smockTop: Product = {
  id: "p-smock",
  title: "Girls' Polka Dot Smock Top",
  description: null,
  category: "tops",
  audience: "girls",
  price: "24.00",
  currency: "USD",
  primary_image_key: "seed-data/products/smock.jpg",
  is_active: true,
  is_archived: false,
  variants: ["6-7Y", "8Y", "9-10Y"].map((size) => ({
    id: `v-${size}`,
    size_label: size,
    color: null,
    sku: size,
    stock_quantity: 4,
    garment_image_key: null,
  })),
};

function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("pickDefaultProfile", () => {
  it("prefers a matching child's profile for kids' items, else the shopper's own", () => {
    expect(pickDefaultProfile([me, lina], "girls")?.name).toBe("Lina");
    expect(pickDefaultProfile([me, lina], "boys")?.name).toBe("Me");
    expect(pickDefaultProfile([me, lina], "unisex")?.name).toBe("Me");
    expect(pickDefaultProfile([], "women")).toBeUndefined();
  });
});

describe("ProductTryOnDialog", () => {
  it("sizes for the child, preselects the recommended size and starts the try-on", async () => {
    listBodyProfilesMock.mockResolvedValue([me, lina]);
    recommendSizeMock.mockResolvedValueOnce({
      product_id: "p-smock",
      recommended_size_label: "8Y",
      confidence: 0.9,
      fit_note: "Sized for a height of 128 cm.",
      body_profile_id: "lina",
      profile_name: "Lina",
    });
    createTryOnJobMock.mockResolvedValueOnce({ job_id: "job-9", status: "pending" });

    renderWithClient(<ProductTryOnDialog product={smockTop} onOpenChange={() => undefined} />);

    // Lina is chosen for a girls' item, so her saved photo is used.
    expect(await screen.findByRole("button", { name: "Lina", pressed: true })).toBeInTheDocument();
    expect(screen.getByText("Lina's profile photo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try it on/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /find lina's size/i }));
    expect(await screen.findByText(/Recommended: 8Y/)).toBeInTheDocument();
    expect(recommendSizeMock).toHaveBeenCalledWith("p-smock", "lina");
    expect(screen.getByRole("radio", { name: /8Y/ })).toHaveAttribute("aria-checked", "true");

    fireEvent.click(screen.getByRole("button", { name: /try it on/i }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/shopper/tryon?job=job-9"));
    expect(createTryOnJobMock).toHaveBeenCalledWith(
      { user_image_key: "user-photos/me/lina.jpg", product_variant_id: "v-8Y" },
      expect.anything(),
    );
  });

  it("asks for a photo when the chosen profile has none saved", async () => {
    listBodyProfilesMock.mockResolvedValue([profile({})]);
    renderWithClient(<ProductTryOnDialog product={smockTop} onOpenChange={() => undefined} />);

    expect(await screen.findByText(/drop a full-length photo/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /6-7Y/ }));
    expect(screen.getByText(/add a photo to continue/i)).toBeInTheDocument();
  });
});

describe("try-on job display helpers", () => {
  const base: TryOnJob = {
    id: "j1",
    status: "completed",
    user_image_key: "user-photos/me/me.jpg",
    garment_image_key: "seed-data/products/tee.jpg",
    result_image_key: "tryon-results/r.png",
    ai_model_name: null,
    error_message: null,
    created_at: "2026-11-01T10:00:00Z",
    product_variant_id: null,
    product_title: null,
    size_label: null,
  };
  const catalogJob: TryOnJob = {
    ...base,
    id: "j2",
    created_at: "2026-11-02T09:00:00+00:00",
    product_variant_id: "v-m",
    product_title: "Classic Tee",
    size_label: "M",
  };

  it("names catalog try-ons by product and size", () => {
    expect(tryOnJobTitle(catalogJob)).toBe("Classic Tee");
    expect(tryOnJobTitle(base)).toBe("Your own garment");
    expect(tryOnJobMeta(catalogJob)).toMatch(/^Size M · /);
  });

  it("retries catalog try-ons through the variant", () => {
    expect(retryPayload(catalogJob)).toEqual({
      user_image_key: "user-photos/me/me.jpg",
      product_variant_id: "v-m",
    });
    expect(retryPayload(base)).toEqual({
      user_image_key: "user-photos/me/me.jpg",
      garment_image_key: "seed-data/products/tee.jpg",
    });
  });

  it("sorts newest first across timestamp formats", () => {
    expect(newestFirst([base, catalogJob]).map((job) => job.id)).toEqual(["j2", "j1"]);
  });
});
