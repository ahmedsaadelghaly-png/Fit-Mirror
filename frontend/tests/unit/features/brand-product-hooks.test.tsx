import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useArchiveProduct } from "@/features/brand/hooks/use-archive-product";
import { useCreateProduct } from "@/features/brand/hooks/use-create-product";
import { useProducts } from "@/features/brand/hooks/use-products";
import type { Product } from "@/types/domain";

const { listProductsMock, createProductMock, updateProductMock } = vi.hoisted(() => ({
  listProductsMock: vi.fn(),
  createProductMock: vi.fn(),
  updateProductMock: vi.fn(),
}));

vi.mock("@/api/brand/products", () => ({
  listProducts: listProductsMock,
  createProduct: createProductMock,
  updateProduct: updateProductMock,
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const tshirt: Product = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Classic Cotton T-Shirt",
  description: null,
  category: "tops",
  price: "24.99",
  currency: "USD",
  primary_image_key: null,
  is_active: true,
  is_archived: false,
  variants: [],
};

const jeans: Product = {
  id: "22222222-2222-2222-2222-222222222222",
  title: "Slim Fit Denim Jeans",
  description: null,
  category: "bottoms",
  price: "59.99",
  currency: "USD",
  primary_image_key: null,
  is_active: false,
  is_archived: false,
  variants: [],
};

describe("useProducts", () => {
  it("fetches the product list via listProducts and exposes it unfiltered by default", async () => {
    listProductsMock.mockResolvedValueOnce([tshirt, jeans]);

    const { result } = renderHook(() => useProducts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listProductsMock).toHaveBeenCalledTimes(1);
    expect(result.current.products).toHaveLength(2);
    expect(result.current.filteredProducts).toHaveLength(2);
  });

  it("filters client-side by status", async () => {
    listProductsMock.mockResolvedValueOnce([tshirt, jeans]);

    const { result } = renderHook(() => useProducts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.setFilters({ ...result.current.filters, status: "inactive" });

    await waitFor(() => {
      expect(result.current.filteredProducts).toHaveLength(1);
      expect(result.current.filteredProducts[0]?.title).toBe("Slim Fit Denim Jeans");
    });
  });

  it("filters client-side by category", async () => {
    listProductsMock.mockResolvedValueOnce([tshirt, jeans]);

    const { result } = renderHook(() => useProducts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.setFilters({ ...result.current.filters, category: "bottoms" });

    await waitFor(() => {
      expect(result.current.filteredProducts).toHaveLength(1);
      expect(result.current.filteredProducts[0]?.category).toBe("bottoms");
    });
  });
});

describe("useCreateProduct", () => {
  it("calls createProduct with the given payload and resolves with the created product", async () => {
    createProductMock.mockResolvedValueOnce(tshirt);

    const { result } = renderHook(() => useCreateProduct(), { wrapper });

    result.current.mutate({
      title: "Classic Cotton T-Shirt",
      category: "tops",
      price: "24.99",
      currency: "USD",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Only assert the payload (first arg) — TanStack Query v5 also passes a
    // second `mutationFnContext` argument ({ client, meta, mutationKey })
    // that real callers ignore, but which would break a strict toHaveBeenCalledWith.
    expect(createProductMock.mock.calls[0]?.[0]).toEqual({
      title: "Classic Cotton T-Shirt",
      category: "tops",
      price: "24.99",
      currency: "USD",
    });
    expect(result.current.data).toEqual(tshirt);
  });
});

describe("archiving", () => {
  it("keeps archived products out of the default view and shows them under 'archived'", async () => {
    const archived: Product = { ...jeans, is_active: true, is_archived: true };
    listProductsMock.mockResolvedValueOnce([tshirt, archived]);

    const { result } = renderHook(() => useProducts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.filteredProducts.map((p) => p.id)).toEqual([tshirt.id]);

    result.current.setFilters({ ...result.current.filters, status: "archived" });

    await waitFor(() => {
      expect(result.current.filteredProducts.map((p) => p.id)).toEqual([archived.id]);
    });
  });

  it("archives through PATCH /store/products/{id} with is_archived", async () => {
    updateProductMock.mockResolvedValueOnce({ ...tshirt, is_archived: true });

    const { result } = renderHook(() => useArchiveProduct(), { wrapper });
    await result.current.mutateAsync({ productId: tshirt.id, isArchived: true });

    expect(updateProductMock).toHaveBeenCalledWith(tshirt.id, { is_archived: true });
  });
});
