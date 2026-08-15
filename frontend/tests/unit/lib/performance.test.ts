import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/client";
import { debounce } from "@/lib/performance/debounce";
import { paginate } from "@/lib/performance/paginate";
import { MAX_QUERY_RETRIES, shouldRetryQuery, STALE_TIME } from "@/lib/performance/query-config";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("only calls the wrapped function once after the wait elapses", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("passes through the latest call's arguments", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced("first");
    debounced("second");
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledWith("second");
  });

  it("cancel() prevents a pending call from firing", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(300);

    expect(fn).not.toHaveBeenCalled();
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it("returns the requested page's slice", () => {
    const result = paginate(items, 2, 10);
    expect(result.items).toEqual(Array.from({ length: 10 }, (_, i) => i + 11));
  });

  it("computes pageCount from totalCount and pageSize", () => {
    const result = paginate(items, 1, 10);
    expect(result.totalCount).toBe(25);
    expect(result.pageCount).toBe(3);
  });

  it("clamps a page number below 1 up to 1", () => {
    const result = paginate(items, -5, 10);
    expect(result.page).toBe(1);
  });

  it("clamps a page number beyond pageCount down to the last page", () => {
    const result = paginate(items, 99, 10);
    expect(result.page).toBe(3);
    expect(result.hasNextPage).toBe(false);
  });

  it("hasPreviousPage is false on page 1 and true afterward", () => {
    expect(paginate(items, 1, 10).hasPreviousPage).toBe(false);
    expect(paginate(items, 2, 10).hasPreviousPage).toBe(true);
  });

  it("handles an empty array without dividing by zero", () => {
    const result = paginate([], 1, 10);
    expect(result.pageCount).toBe(1);
    expect(result.items).toEqual([]);
  });
});

describe("shouldRetryQuery", () => {
  it("does not retry a 4xx ApiError", () => {
    expect(shouldRetryQuery(0, new ApiError("Not found", 404, "not_found"))).toBe(false);
  });

  it("retries a 5xx ApiError up to MAX_QUERY_RETRIES", () => {
    const error = new ApiError("Server error", 500, "internal_error");
    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldRetryQuery(MAX_QUERY_RETRIES - 1, error)).toBe(true);
    expect(shouldRetryQuery(MAX_QUERY_RETRIES, error)).toBe(false);
  });

  it("retries a network error (null status)", () => {
    expect(shouldRetryQuery(0, new ApiError("Network error", null, "network_error"))).toBe(true);
  });

  it("retries a non-ApiError failure the same as a network error", () => {
    expect(shouldRetryQuery(0, new Error("boom"))).toBe(true);
  });
});

describe("STALE_TIME", () => {
  it("orders tiers from shortest to longest", () => {
    expect(STALE_TIME.NONE).toBeLessThan(STALE_TIME.SHORT);
    expect(STALE_TIME.SHORT).toBeLessThan(STALE_TIME.STANDARD);
    expect(STALE_TIME.STANDARD).toBeLessThan(STALE_TIME.LONG);
  });
});
