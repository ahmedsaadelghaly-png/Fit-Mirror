import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FamilyProfileSwitcher } from "@/features/shopper/components/family/family-profile-switcher";
import type { BodyProfile } from "@/types/domain";

const { createBodyProfileMock } = vi.hoisted(() => ({ createBodyProfileMock: vi.fn() }));

vi.mock("@/api/shopper/body-profile", () => ({ createBodyProfile: createBodyProfileMock }));

function profile(overrides: Partial<BodyProfile>): BodyProfile {
  return {
    id: "me",
    name: "Me",
    is_primary: true,
    body_category: "women",
    height_cm: 168,
    weight_kg: null,
    chest_cm: null,
    waist_cm: null,
    hip_cm: null,
    body_shape: null,
    reference_image_key: null,
    preferred_fit: null,
    favorite_colors: [],
    style_preferences: [],
    ...overrides,
  };
}

function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FamilyProfileSwitcher", () => {
  it("lists each profile with who it's for and selects on click", () => {
    const onSelect = vi.fn();
    const lina = profile({
      id: "lina",
      name: "Lina",
      is_primary: false,
      body_category: "girls",
      height_cm: 128,
    });
    renderWithClient(
      <FamilyProfileSwitcher profiles={[profile({}), lina]} selectedId="me" onSelect={onSelect} />,
    );

    expect(screen.getByRole("button", { name: /me \(you\)/i, pressed: true })).toBeInTheDocument();
    expect(screen.getByText("Girls · 128 cm")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /lina/i }));
    expect(onSelect).toHaveBeenCalledWith(lina);
  });

  it("adds a family member and selects the new profile", async () => {
    const onSelect = vi.fn();
    const omar = profile({ id: "omar", name: "Omar", is_primary: false, body_category: "boys" });
    createBodyProfileMock.mockResolvedValueOnce(omar);
    renderWithClient(
      <FamilyProfileSwitcher profiles={[profile({})]} selectedId="me" onSelect={onSelect} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /add family member/i }));
    fireEvent.change(await screen.findByLabelText("Name"), { target: { value: "Omar" } });
    fireEvent.click(screen.getByRole("radio", { name: "Boys" }));
    fireEvent.click(screen.getByRole("button", { name: /add profile/i }));

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(omar));
    expect(createBodyProfileMock).toHaveBeenCalledWith(
      { name: "Omar", body_category: "boys" },
      expect.anything(),
    );
  });
});
