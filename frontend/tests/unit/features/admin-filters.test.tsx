import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAdminProducts } from "@/features/admin/hooks/use-admin-products";
import { useAdminUsers } from "@/features/admin/hooks/use-users";
import type { AdminProductRow, AdminUserRow } from "@/types/admin";

const { listUsersMock } = vi.hoisted(() => ({ listUsersMock: vi.fn() }));
vi.mock("@/api/admin/users", async () => {
  const actual = await vi.importActual<typeof import("@/api/admin/users")>("@/api/admin/users");
  return { ...actual, listUsers: listUsersMock };
});

const { listAllProductsMock } = vi.hoisted(() => ({ listAllProductsMock: vi.fn() }));
vi.mock("@/api/admin/products", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/admin/products")>("@/api/admin/products");
  return { ...actual, listAllProducts: listAllProductsMock };
});

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const activeShopper: AdminUserRow = {
  id: "u-1",
  email: "shopper@example.com",
  full_name: "Ada Shopper",
  role: "shopper",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  last_login_at: null,
};

const inactiveBrandAdmin: AdminUserRow = {
  id: "u-2",
  email: "brand@example.com",
  full_name: "Brand Owner",
  role: "brand_admin",
  is_active: false,
  created_at: "2026-01-01T00:00:00Z",
  last_login_at: null,
};

const topProduct: AdminProductRow = {
  id: "p-1",
  title: "T-Shirt",
  store_name: "Demo Store",
  category: "tops",
  price: "10.00",
  currency: "USD",
  is_active: true,
  primary_image_key: null,
  created_at: "2026-01-01T00:00:00Z",
};

const bottomProduct: AdminProductRow = {
  id: "p-2",
  title: "Jeans",
  store_name: "Other Store",
  category: "bottoms",
  price: "40.00",
  currency: "USD",
  is_active: false,
  primary_image_key: null,
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  window.localStorage.clear();
  listUsersMock.mockReset();
  listAllProductsMock.mockReset();
});

describe("useAdminUsers filters", () => {
  it("filters by role", async () => {
    listUsersMock.mockResolvedValueOnce([activeShopper, inactiveBrandAdmin]);
    const { result } = renderHook(() => useAdminUsers(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.setFilters({ ...result.current.filters, role: "brand_admin" });

    await waitFor(() => {
      expect(result.current.filteredUsers).toHaveLength(1);
      expect(result.current.filteredUsers[0]?.email).toBe("brand@example.com");
    });
  });

  it("filters by active status", async () => {
    listUsersMock.mockResolvedValueOnce([activeShopper, inactiveBrandAdmin]);
    const { result } = renderHook(() => useAdminUsers(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.setFilters({ ...result.current.filters, status: "active" });

    await waitFor(() => {
      expect(result.current.filteredUsers).toHaveLength(1);
      expect(result.current.filteredUsers[0]?.is_active).toBe(true);
    });
  });

  it("filters by search across email and name", async () => {
    listUsersMock.mockResolvedValueOnce([activeShopper, inactiveBrandAdmin]);
    const { result } = renderHook(() => useAdminUsers(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.setFilters({ ...result.current.filters, search: "brand owner" });

    await waitFor(() => {
      expect(result.current.filteredUsers).toHaveLength(1);
      expect(result.current.filteredUsers[0]?.id).toBe("u-2");
    });
  });
});

describe("useAdminProducts filters", () => {
  it("derives the available store and category options from the fetched list", async () => {
    listAllProductsMock.mockResolvedValueOnce([topProduct, bottomProduct]);
    const { result } = renderHook(() => useAdminProducts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.storeNames).toEqual(["Demo Store", "Other Store"]);
    expect(result.current.categories).toEqual(["bottoms", "tops"]);
  });

  it("filters by store", async () => {
    listAllProductsMock.mockResolvedValueOnce([topProduct, bottomProduct]);
    const { result } = renderHook(() => useAdminProducts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.setFilters({ ...result.current.filters, store: "Demo Store" });

    await waitFor(() => {
      expect(result.current.filteredProducts).toHaveLength(1);
      expect(result.current.filteredProducts[0]?.title).toBe("T-Shirt");
    });
  });

  it("filters by status=inactive", async () => {
    listAllProductsMock.mockResolvedValueOnce([topProduct, bottomProduct]);
    const { result } = renderHook(() => useAdminProducts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.setFilters({ ...result.current.filters, status: "inactive" });

    await waitFor(() => {
      expect(result.current.filteredProducts).toHaveLength(1);
      expect(result.current.filteredProducts[0]?.id).toBe("p-2");
    });
  });
});
