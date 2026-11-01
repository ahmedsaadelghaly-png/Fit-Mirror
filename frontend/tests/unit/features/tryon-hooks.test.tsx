import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useCreateTryOnJob } from "@/features/tryon/hooks/use-create-tryon-job";
import { useTryOnJob } from "@/features/tryon/hooks/use-tryon-job";
import type { TryOnJob } from "@/types/domain";

const { createTryOnJobMock, fetchTryOnJobMock } = vi.hoisted(() => ({
  createTryOnJobMock: vi.fn(),
  fetchTryOnJobMock: vi.fn(),
}));

vi.mock("@/api/shopper/tryon", () => ({
  createTryOnJob: createTryOnJobMock,
  fetchTryOnJob: fetchTryOnJobMock,
  listTryOnJobs: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const baseJob: TryOnJob = {
  id: "job-1",
  status: "pending",
  user_image_key: "user-photos/abc.png",
  garment_image_key: "wardrobe/def.png",
  result_image_key: null,
  ai_model_name: null,
  error_message: null,
  created_at: "2026-11-01T10:00:00Z",
  product_variant_id: null,
  product_title: null,
  size_label: null,
};

describe("useCreateTryOnJob", () => {
  it("calls createTryOnJob with the given payload and resolves with the accepted job", async () => {
    createTryOnJobMock.mockResolvedValueOnce({ job_id: "job-1", status: "pending" });

    const { result } = renderHook(() => useCreateTryOnJob(), { wrapper });

    result.current.mutate({
      user_image_key: "user-photos/abc.png",
      garment_image_key: "wardrobe/def.png",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Only assert the payload (first arg) — TanStack Query v5 also passes a
    // second `mutationFnContext` argument ({ client, meta, mutationKey })
    // that real callers ignore, but which would break a strict toHaveBeenCalledWith.
    expect(createTryOnJobMock.mock.calls[0]?.[0]).toEqual({
      user_image_key: "user-photos/abc.png",
      garment_image_key: "wardrobe/def.png",
    });
    expect(result.current.data).toEqual({ job_id: "job-1", status: "pending" });
  });
});

describe("useTryOnJob", () => {
  it("is disabled (does not fetch) when jobId is null", () => {
    const { result } = renderHook(() => useTryOnJob(null), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchTryOnJobMock).not.toHaveBeenCalled();
  });

  it("fetches the job by id when jobId is provided", async () => {
    fetchTryOnJobMock.mockResolvedValueOnce({
      ...baseJob,
      status: "completed",
      result_image_key: "results/abc.png",
    });

    const { result } = renderHook(() => useTryOnJob("job-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchTryOnJobMock).toHaveBeenCalledWith("job-1");
    expect(result.current.data?.status).toBe("completed");
  });
});
